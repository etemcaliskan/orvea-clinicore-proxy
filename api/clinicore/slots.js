export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, AuthorizationToken, Accept");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token = process.env.CLINICORE_WAPI_TOKEN;
    const service = String(req.query.service || "");
    const user = String(req.query.user || req.query.users || req.query["users[]"] || "");
    const days = String(req.query.days || "180");
    const date = String(req.query.date || new Date().toISOString().slice(0, 10));
    const remote = req.query.remote;

    if (!token) return res.status(500).json({ error: "Missing CLINICORE_WAPI_TOKEN" });
    if (!service) return res.status(400).json({ error: "Missing service" });
    if (!user) return res.status(400).json({ error: "Missing user" });

    async function callClinicore(url) {
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
        return {
          ok: false,
          status: response.status,
          data: {
            error: "Invalid JSON from Clinicoresuite",
            raw: text
          }
        };
      }

      return { ok: response.ok, status: response.status, data };
    }

    function slotCount(data) {
      const slots = data && data.slots;
      if (!slots) return 0;
      if (Array.isArray(slots)) return slots.length;
      if (typeof slots === "object") {
        return Object.values(slots).reduce((sum, day) => {
          if (Array.isArray(day)) return sum + day.length;
          if (day && typeof day === "object") return sum + Object.keys(day).length;
          return sum;
        }, 0);
      }
      return 0;
    }

    const pathUrl = new URL(
      `https://wapi.clinicoresuite.app/slots/${encodeURIComponent(user)}/${encodeURIComponent(service)}/${encodeURIComponent(days)}/${encodeURIComponent(date)}`
    );
    if (remote !== undefined && remote !== null && remote !== "") {
      pathUrl.searchParams.set("remote", String(remote));
    }

    const first = await callClinicore(pathUrl);

    if (first.ok && slotCount(first.data) > 0) {
      if (req.query.debug === "1") {
        return res.status(first.status).json({
          ...first.data,
          _debug: {
            source: "path",
            requestedUrl: pathUrl.toString(),
            upstreamStatus: first.status
          }
        });
      }
      return res.status(first.status).json(first.data);
    }

    const queryUrl = new URL("https://wapi.clinicoresuite.app/slots");
    queryUrl.searchParams.set("service", service);
    queryUrl.searchParams.set("users", user);
    queryUrl.searchParams.set("date", date);
    queryUrl.searchParams.set("days", days);
    if (remote !== undefined && remote !== null && remote !== "") {
      queryUrl.searchParams.set("remote", String(remote));
    }

    const second = await callClinicore(queryUrl);

    if (req.query.debug === "1") {
      return res.status(second.status).json({
        ...second.data,
        _debug: {
          source: "query",
          requestedUrl: queryUrl.toString(),
          upstreamStatus: second.status,
          firstAttempt: {
            requestedUrl: pathUrl.toString(),
            upstreamStatus: first.status,
            slotCount: slotCount(first.data),
            error: first.data?.error || null
          }
        }
      });
    }

    return res.status(second.status).json(second.data);
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected slots proxy error",
      message: error.message
    });
  }
}
