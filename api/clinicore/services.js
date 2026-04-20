export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, AuthorizationToken, Accept");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const token = process.env.CLINICORE_WAPI_TOKEN;
    const { page, name, remote, offices, users, user, categoryId } = req.query;

    if (!token) {
      return res.status(500).json({ error: "Missing CLINICORE_WAPI_TOKEN" });
    }

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
