export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, AuthorizationToken, Accept, Cache-Control");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const token = process.env.CLINICORE_WAPI_TOKEN;
    const { service, user, date, days, remote } = req.query;
    const office = req.query.office_id || req.query.office || req.query.offices;

    if (!token) return res.status(500).json({ error: "Missing CLINICORE_WAPI_TOKEN" });
    if (!service) return res.status(400).json({ error: "Missing service" });

    const url = new URL("https://wapi.clinicoresuite.app/slots");
    url.searchParams.set("service", service);
    if (user) url.searchParams.set("user", user);
    if (date) url.searchParams.set("date", date);
    if (days) url.searchParams.set("days", days);
    if (remote) url.searchParams.set("remote", remote);

    if (office) {
      url.searchParams.set("office_id", office);
      url.searchParams.set("office", office);
      url.searchParams.set("offices", office);
    }

    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers: {
        AuthorizationToken: token,
        Accept: "application/json",
        "Cache-Control": "no-cache"
      }
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(500).json({ error: "Invalid JSON from Clinicoresuite", raw: text }); }

    return res.status(upstream.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Unexpected proxy error", message: error.message });
  }
}
