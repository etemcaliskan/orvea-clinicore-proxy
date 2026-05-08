export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, AuthorizationToken, Accept");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const token = process.env.CLINICORE_WAPI_TOKEN;
    const { service, user, date, days, remote } = req.query;
    const offices = req.query.offices || req.query.office_id || req.query.office;

    if (!token) return res.status(500).json({ error: "Missing CLINICORE_WAPI_TOKEN" });
    if (!service) return res.status(400).json({ error: "Missing service" });

    const url = new URL("https://wapi.clinicoresuite.app/slots");
    url.searchParams.set("service", service);
    if (user) url.searchParams.set("users[]", user);
    if (date) url.searchParams.set("date", date);
    if (days) url.searchParams.set("days", days);
    if (offices) {
      url.searchParams.set("offices", offices);
      url.searchParams.set("offices[]", offices);
    }
    if (remote !== undefined && remote !== null && remote !== "") url.searchParams.set("remote", remote);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        AuthorizationToken: token,
        Accept: "application/json"
      },
      cache: "no-store"
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "Invalid JSON from Clinicoresuite", raw: text });
    }

    if (req.query.debug === "1") {
      return res.status(response.status).json({
        ...data,
        _debug: {
          requestedUrl: url.toString(),
          upstreamStatus: response.status
        }
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Unexpected proxy error", message: error.message });
  }
}
