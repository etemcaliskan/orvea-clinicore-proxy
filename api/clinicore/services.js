const ALLOWED_ORIGINS = ["https://orvea.de", "https://www.orvea.de"];

function allowOrigin(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
}

export default async function handler(req, res) {
  allowOrigin(req, res);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, AuthorizationToken, Accept");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const token = process.env.CLINICORE_WAPI_TOKEN;

    if (!token) {
      return res.status(500).json({ error: "Missing CLINICORE_WAPI_TOKEN" });
    }

    const { page, name, remote, offices, users, user, categoryId } = req.query;

    const url = new URL("https://wapi.clinicoresuite.app/services");

    if (page) url.searchParams.set("page", String(page));
    if (name) url.searchParams.set("name", String(name));
    if (remote !== undefined && remote !== null && remote !== "") {
      url.searchParams.set("remote", String(remote));
    }
    if (offices) url.searchParams.set("offices", String(offices));
    if (categoryId) url.searchParams.set("categoryId", String(categoryId));

    if (users) {
      url.searchParams.set("users", String(users));
    } else if (user) {
      url.searchParams.set("users", String(user));
    }

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
    } catch (e) {
      return res.status(502).json({
        error: "Invalid JSON from Clinicoresuite services endpoint",
        raw: text
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected proxy error",
      message: error.message
    });
  }
}
