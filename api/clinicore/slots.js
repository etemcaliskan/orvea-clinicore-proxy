function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, AuthorizationToken, Accept");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

function asArray(value) {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.flatMap(asArray);
  return String(value).split(",").map((v) => v.trim()).filter(Boolean);
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token = process.env.CLINICORE_WAPI_TOKEN;
    const { service, date, days, offices, remote } = req.query;

    if (!token) return res.status(500).json({ error: "Missing CLINICORE_WAPI_TOKEN" });
    if (!service) return res.status(400).json({ error: "Missing service" });

    const users = [
      ...asArray(req.query.user),
      ...asArray(req.query.users),
      ...asArray(req.query["users[]"])
    ];

    const url = new URL("https://wapi.clinicoresuite.app/slots");
    url.searchParams.set("service", String(service));

    for (const user of users) {
      url.searchParams.append("users[]", user);
    }

    if (date) url.searchParams.set("date", String(date));
    if (days) url.searchParams.set("days", String(days));
    if (offices) url.searchParams.set("offices", String(offices));
    if (remote !== undefined && remote !== null && remote !== "") url.searchParams.set("remote", String(remote));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        AuthorizationToken: token,
        Accept: "application/json"
      }
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: "Invalid JSON from Clinicoresuite slots endpoint",
        upstreamStatus: response.status,
        raw: text
      });
    }

    if (req.query.debug === "1") {
      return res.status(response.status).json({
        ...data,
        requestedUrl: url.toString(),
        upstreamStatus: response.status
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected slots proxy error",
      message: error.message
    });
  }
}
