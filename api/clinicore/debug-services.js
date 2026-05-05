function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, AuthorizationToken, Accept");
}

function parseItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.["hydra:member"])) return data["hydra:member"];
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.services)) return data.services;
  return [];
}

function shallow(value) {
  if (Array.isArray(value)) return value.slice(0, 3).map(shallow);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).slice(0, 80)) {
      const v = value[key];
      if (v && typeof v === "object") {
        out[key] = Array.isArray(v)
          ? v.slice(0, 3).map(shallow)
          : Object.fromEntries(Object.entries(v).slice(0, 20).map(([k, x]) => [k, typeof x === "object" ? "[object]" : x]));
      } else {
        out[key] = v;
      }
    }
    return out;
  }
  return value;
}

function categoryCandidates(service) {
  const out = {};
  const keys = Object.keys(service || {});
  for (const key of keys) {
    if (/cat|group|family|type|section|parent|service/i.test(key)) {
      out[key] = shallow(service[key]);
    }
  }
  return out;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = process.env.CLINICORE_WAPI_TOKEN;

    if (!token) {
      return res.status(500).json({ error: "Missing CLINICORE_WAPI_TOKEN" });
    }

    const page = req.query.page || 1;
    const limit = Math.min(Number(req.query.limit || 5), 20);

    const url = new URL("https://wapi.clinicoresuite.app/services");
    url.searchParams.set("page", String(page));

    if (req.query.users) {
      url.searchParams.set("users", String(req.query.users));
    } else if (req.query.user) {
      url.searchParams.set("users", String(req.query.user));
    }

    if (req.query.offices) url.searchParams.set("offices", String(req.query.offices));
    if (req.query.remote !== undefined && req.query.remote !== null && req.query.remote !== "") {
      url.searchParams.set("remote", String(req.query.remote));
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
    } catch (error) {
      return res.status(502).json({
        error: "Invalid JSON from Clinicoresuite services endpoint",
        upstreamStatus: response.status,
        raw: text
      });
    }

    const items = parseItems(data).slice(0, limit);

    return res.status(response.status).json({
      upstreamStatus: response.status,
      requestedUrl: url.toString().replace(token, "[token]"),
      totalOnThisPage: parseItems(data).length,
      topLevelKeys: data && typeof data === "object" && !Array.isArray(data) ? Object.keys(data) : [],
      serviceKeys: items.map((item) => Object.keys(item || {})),
      categoryCandidates: items.map(categoryCandidates),
      sampleServices: items.map(shallow)
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected debug proxy error",
      message: error.message
    });
  }
}
