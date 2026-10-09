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
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};

    const requiredFields = [
      "reg",
      "terms",
      "chosen_user",
      "chosen_service",
      "office_id",
      "chosen_date",
      "email",
      "phone",
      "phone_direction",
      "patient_name",
      "patient_lastname",
      "patient_language",
      "referer",
      "source"
    ];

    for (const field of requiredFields) {
      if (
        body[field] === undefined ||
        body[field] === null ||
        body[field] === ""
      ) {
        return res.status(400).json({
          error: `Missing required field: ${field}`
        });
      }
    }

    if (String(body.reg) !== "1" || String(body.terms) !== "1") {
      return res.status(400).json({
        error: "Bitte Datenschutzerklärung und AGB bestätigen."
      });
    }

    // Mehrere Behandlungen (kommagetrennt): als ein Kombi-Termin buchen
    const resolved = await resolveKombi(body.chosen_service);
    if (!resolved.ok) {
      return res.status(400).json({ error: resolved.error });
    }
    const note = kombiNote(resolved);
    const patientMessage = String(body.message || "");
    const message = note ? note + (patientMessage ? "\n\n" + patientMessage : "") : patientMessage;

    // Datum laut Clinicore-Doku im Format "Y-m-d H:i"
    const dateMatch = String(body.chosen_date).match(/^(\d{4}-\d{2}-\d{2})\s*(\d{1,2}:\d{2})$/);
    const chosenDate = dateMatch ? dateMatch[1] + " " + dateMatch[2].padStart(5, "0") : String(body.chosen_date);

    const payload = new URLSearchParams();

    payload.set("reg", "1");
    payload.set("terms", "1");
    payload.set("chosen_user", String(body.chosen_user));
    payload.set("chosen_service", String(resolved.serviceUuid));
    payload.set("office_id", String(body.office_id));
    payload.set("chosen_date", chosenDate);
    payload.set("email", String(body.email));
    payload.set("phone", String(body.phone));
    payload.set("phone_direction", String(body.phone_direction));
    payload.set("patient_name", String(body.patient_name));
    payload.set("patient_lastname", String(body.patient_lastname));
    payload.set("message", message);
    payload.set("patient_language", String(body.patient_language || "de"));
    payload.set("referer", String(body.referer || ""));
    payload.set("source", String(body.source || "dedicated"));
    payload.set("allow_payment", String(body.allow_payment || "1"));

    if (body.document_country) {
      payload.set("document_country", String(body.document_country));
    }

    if (body.document_type) {
      payload.set("document_type", String(body.document_type));
    }

    if (body.document_value) {
      payload.set("document_value", String(body.document_value));
    }

    const response = await fetch("https://clinicoresuite.app/rejestracja/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept": "application/json, text/plain, */*"
      },
      body: payload.toString()
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
      return res.status(response.status).json(data);
    } catch (e) {
      return res.status(200).json({
        success: response.ok,
        status: response.status,
        raw: text
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected booking proxy error",
      message: error.message
    });
  }
}
