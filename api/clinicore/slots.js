export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const service = String(req.query.service || req.query.service_uuid || "");
  const user = String(req.query.user || req.query.users || req.query.user_uuid || "");
  const days = Math.max(4, Math.min(180, Number(req.query.days || 180)));
  const startDate = String(req.query.date || req.query.current_time || new Date().toISOString().slice(0,10)).slice(0,10);
  const facility = String(req.query.facility_uuid || process.env.CLINICORE_FACILITY_UUID || "022ee251-93ad-9357-751b-38677fa760dd");
  const screenWidth = String(req.query.screen_width || 488);

  if (!service) return res.status(400).json({ error: "Missing service" });
  if (!user) return res.status(400).json({ error: "Missing user" });

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
