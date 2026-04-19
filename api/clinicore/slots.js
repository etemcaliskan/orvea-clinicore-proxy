export default async function handler(req, res) {
  try {
    const token = process.env.CLINICORE_WAPI_TOKEN;
    const { service } = req.query;

    if (!token) {
      return res.status(500).json({ error: "Missing CLINICORE_WAPI_TOKEN" });
    }

    if (!service) {
      return res.status(400).json({ error: "Missing service" });
    }

    const url = `https://wapi.clinicoresuite.app/slots?service=${encodeURIComponent(service)}`;

    const response = await fetch(url, {
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
