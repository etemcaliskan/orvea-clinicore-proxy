export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, AuthorizationToken, Accept");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const token = process.env.CLINICORE_WAPI_TOKEN;
    const { service, user, date, days, offices, remote } = req.query;

    if (!token) {
      return res.status(500).json({ error: "Missing CLINICORE_WAPI_TOKEN" });
    }

    if (!service) {
      return res.status(400).json({ error: "Missing service" });
    }

    const url = new URL("https://wapi.clinicoresuite.app/slots");
    url.searchParams.set("service", service);

    if (user) url.searchParams.set("users[]", user);
    if (date) url.searchParams.set("date", date);
    if (days) url.searchParams.set("days", days);
    if (offices) url.searchParams.set("offices", offices);
    if (remote) url.searchParams.set("remote", remote);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        AuthorizationToken: token,
        Accept: "application/json"
      }
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return res.status(response.status).json(data);
    } catch (e) {
      return res.status(500).json({
        error: "Invalid JSON from Clinicoresuite",
        raw: text
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected proxy error",
      message: error.message
    });
  }
}
