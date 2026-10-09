const ALLOWED_ORIGINS = ["https://orvea.de", "https://www.orvea.de"];

function allowOrigin(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
}

// ---- ORVEA Kombi-Termin (v1, 10.10.2026) ----------------------------------
// Mehrere gewaehlte Behandlungen werden im Hintergrund als EIN Kombi-Termin
// gebucht. Kombi-Leistungen = Clinicore-Kategorie "INTERN" oder Leistungsname
// "Kombinationsbehandlung". Sie werden im Buchungstool nie angezeigt.
// Kuerzester Kombi-Termin = kuerzeste vorhandene Kombi-Leistung (derzeit 55),
// laengster = KOMBI_MAX.
const KOMBI_MAX = 120;
const KOMBI_STEP = 5;
const KOMBI_TTL_MS = 5 * 60 * 1000;
let kombiCache = null;

function kombiItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.["hydra:member"])) return data["hydra:member"];
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

async function kombiGet(path, params = {}) {
  const token = process.env.CLINICORE_WAPI_TOKEN;
  if (!token) throw new Error("Missing CLINICORE_WAPI_TOKEN");
  const url = new URL("https://wapi.clinicoresuite.app" + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const r = await fetch(url.toString(), { headers: { AuthorizationToken: token, Accept: "application/json" } });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data) throw new Error("Clinicore " + path + " HTTP " + r.status);
  return data;
}

function kombiCategoryId(s) {
  return s?.categoryId ?? s?.category_id ?? s?.category?.id ?? null;
}

function isKombiService(service, categoryName) {
  const name = String(service?.name || "");
  const cat = String(categoryName || service?.categoryName || service?.category?.name || "");
  return /kombinationsbehandlung/i.test(name) || /^\s*intern\s*$/i.test(cat);
}

async function loadServiceIndex() {
  if (kombiCache && kombiCache.expiresAt > Date.now()) return kombiCache.value;
  const catNames = new Map();
  try {
    for (const c of kombiItems(await kombiGet("/categories"))) {
      if (c && c.id != null) catNames.set(String(c.id), String(c.name || c.title || ""));
    }
  } catch (e) { /* Kategorien optional, Erkennung dann nur ueber den Namen */ }
  const all = new Map();
  for (let page = 1; page <= 80; page++) {
    const items = kombiItems(await kombiGet("/services", { page }));
    let added = 0;
    for (const s of items) {
      const uuid = s?.uuid || s?.id;
      if (!uuid || all.has(uuid)) continue;
      const catName = catNames.get(String(kombiCategoryId(s))) || s?.categoryName || "";
      all.set(uuid, {
        uuid,
        name: String(s.name || ""),
        duration: Number(s.duration) || 0,
        kombi: isKombiService(s, catName)
      });
      added++;
    }
    if (!items.length || !added) break;
  }
  const value = { all, kombis: [...all.values()].filter((s) => s.kombi && s.duration > 0 && s.duration <= KOMBI_MAX).sort((a, b) => a.duration - b.duration) };
  kombiCache = { value, expiresAt: Date.now() + KOMBI_TTL_MS };
  return value;
}

function parseServiceList(raw) {
  const list = String(raw || "").split(",").map((x) => x.trim()).filter(Boolean);
  const unique = [...new Set(list)];
  if (!unique.length || unique.length > 10) return [];
  return unique.every((u) => /^[0-9a-f-]{20,40}$/i.test(u)) ? unique : [];
}

// Liefert fuer eine Liste von Leistungs-UUIDs die zu buchende Leistung.
// Eine Leistung: unveraendert. Mehrere: passender Kombi-Termin
// (Summe der Behandlungsdauern, auf 5 Min. aufgerundet, max. 120).
async function resolveKombi(rawServices) {
  const uuids = parseServiceList(rawServices);
  if (!uuids.length) return { ok: false, error: "Ungueltige Leistung" };
  if (uuids.length === 1) return { ok: true, multi: false, serviceUuid: uuids[0] };

  const fallback = { ok: true, multi: true, kombi: null, serviceUuid: uuids[uuids.length - 1], items: uuids.map((u) => ({ uuid: u, name: u, duration: 0 })) };
  let index;
  try { index = await loadServiceIndex(); } catch (e) { return fallback; }

  const items = uuids.map((u) => index.all.get(u) || { uuid: u, name: u, duration: 0 });
  fallback.items = items;
  const sum = items.reduce((t, s) => t + (s.duration || 0), 0);
  let target = Math.ceil(sum / KOMBI_STEP) * KOMBI_STEP;
  if (target > KOMBI_MAX) target = KOMBI_MAX;

  const kombi =
    index.kombis.find((k) => k.duration === target) ||
    index.kombis.find((k) => k.duration >= target) ||
    index.kombis[index.kombis.length - 1] ||
    null;
  if (!kombi) return { ...fallback, sum, target };
  return { ok: true, multi: true, kombi, serviceUuid: kombi.uuid, items, sum, target };
}

function kombiNote(r) {
  if (!r?.multi) return "";
  const lines = r.items.map((s, i) => (i + 1) + ". " + s.name + (s.duration ? " (" + s.duration + " Min.)" : ""));
  if (!r.kombi) {
    return "MEHRERE BEHANDLUNGEN - bitte Termindauer prüfen:\n" + lines.join("\n");
  }
  const capped = r.sum > KOMBI_MAX;
  return "KOMBI-TERMIN " + r.kombi.duration + " Min." +
    " (Summe " + r.sum + " Min." + (capped ? ", auf " + KOMBI_MAX + " Min. begrenzt – Termindauer prüfen" : "") + "):\n" +
    lines.join("\n");
}
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  allowOrigin(req, res);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  let service = String(req.query.service || req.query.service_uuid || "");
  const user = String(req.query.user || req.query.users || req.query.user_uuid || "");
  const days = Math.max(4, Math.min(180, Number(req.query.days || 180)));
  const startDate = String(req.query.date || req.query.current_time || new Date().toISOString().slice(0,10)).slice(0,10);
  const facility = String(req.query.facility_uuid || process.env.CLINICORE_FACILITY_UUID || "022ee251-93ad-9357-751b-38677fa760dd");
  const screenWidth = String(req.query.screen_width || 488);

  if (!service) return res.status(400).json({ error: "Missing service" });
  if (!user) return res.status(400).json({ error: "Missing user" });

  // Mehrere Behandlungen (kommagetrennt): freie Zeiten des passenden Kombi-Termins
  const resolved = await resolveKombi(service);
  if (!resolved.ok) return res.status(400).json({ error: resolved.error });
  service = resolved.serviceUuid;

  function iso(d) {
    return d.toISOString().slice(0,10);
  }

  function addDays(isoDate, n) {
    const d = new Date(isoDate + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return iso(d);
  }

  function normaliseTime(t) {
    const m = String(t || "").match(/(\d{1,2}):(\d{2})/);
    if (!m) return "";
    return String(m[1]).padStart(2,"0") + ":" + m[2];
  }

  async function fetchFrame(currentTime) {
    const url = new URL("https://registration.clinicoresuite.app/register/all_registration_events/");
    url.searchParams.set("user_uuid", user);
    url.searchParams.set("service_uuid", service);
    url.searchParams.set("office_id", "");
    url.searchParams.set("facility_uuid", facility);
    url.searchParams.set("current_time", currentTime);
    url.searchParams.set("screen_width", screenWidth);

    const r = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest"
      },
      cache: "no-store"
    });

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Widget endpoint returned invalid JSON: " + text.slice(0, 120));
    }
    if (!r.ok) throw new Error(data.error || data.message || "Widget endpoint HTTP " + r.status);
    return { data, url: url.toString() };
  }

  try {
    const slots = {};
    const seenFrames = new Set();
    let cursor = startDate;
    let debugFrames = [];

    // Widget liefert 4 Tage pro Request; wir gehen blockweise weiter.
    for (let guard = 0; guard < 60; guard++) {
      if (seenFrames.has(cursor)) break;
      seenFrames.add(cursor);

      const frame = await fetchFrame(cursor);
      debugFrames.push({ current_time: cursor, url: frame.url });
      const schedule = Array.isArray(frame.data.user_schedule) ? frame.data.user_schedule : [];

      for (const day of schedule) {
        const rawDate = day?.date?.date || "";
        const date = String(rawDate).slice(0,10);
        if (!date) continue;

        const allowed = day.isAllowed !== false && day.isHoliday !== true && day.isPast !== true;
        const periods = allowed && Array.isArray(day.workingPeriods)
          ? [...new Set(day.workingPeriods.map(normaliseTime).filter(Boolean))].sort()
          : [];

        if (periods.length) slots[date] = periods;
      }

      const nextDateRaw = frame.data?.next?.date ? String(frame.data.next.date).slice(0,10) : "";
      const lastScheduleDate = schedule.length ? String(schedule[schedule.length - 1]?.date?.date || "").slice(0,10) : "";
      const nextCursor = nextDateRaw || (lastScheduleDate ? addDays(lastScheduleDate, 1) : addDays(cursor, 4));

      if (!nextCursor || nextCursor <= cursor) cursor = addDays(cursor, 4);
      else cursor = nextCursor;

      const endDate = addDays(startDate, days);
      if (cursor >= endDate) break;
    }

    const ordered = Object.fromEntries(
      Object.entries(slots)
        .filter(([d]) => d >= startDate && d < addDays(startDate, days))
        .sort(([a],[b]) => a.localeCompare(b))
    );

    if (req.query.debug === "1") {
      return res.status(200).json({ slots: ordered, nextFreeVisits: [], _debug: { source: "registration_widget_all_registration_events", frames: debugFrames } });
    }

    return res.status(200).json({ slots: ordered, nextFreeVisits: [] });
  } catch (e) {
    return res.status(500).json({ error: "Widget slots proxy error", message: e.message });
  }
}
