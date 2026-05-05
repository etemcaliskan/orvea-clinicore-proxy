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

function getCategory(service) {
  const category = service?.category || service?.serviceCategory || service?.service_category || null;

  if (category && typeof category === "object") {
    const id = category.id ?? category.uuid ?? category["@id"] ?? category.value ?? category.code ?? null;
    const name = String(category.name ?? category.title ?? category.label ?? category.description ?? "").trim();
    const description = String(category.description ?? category.subtitle ?? category.note ?? "").trim();

    if (name) {
      return {
        id: id !== null && id !== undefined ? String(id) : name,
        name,
        description
      };
    }
  }

  const id = service?.categoryId ?? service?.category_id ?? service?.categoryUuid ?? service?.category_uuid ?? null;
  const name = String(service?.categoryName ?? service?.category_name ?? service?.categoryTitle ?? service?.category_title ?? "").trim();

  if (name) {
    return {
      id: id !== null && id !== undefined ? String(id) : name,
      name,
      description: ""
    };
  }

  return {
    id: "uncategorized",
    name: "Weitere Behandlungen",
    description: ""
  };
}

function getServiceId(service) {
  return String(service?.uuid ?? service?.id ?? service?.["@id"] ?? service?.name ?? Math.random());
}

async function fetchServices(req, token) {
  const all = [];
  const seen = new Set();
  const maxPages = Number(req.query.maxPages || 100);

  for (let page = 1; page <= maxPages; page += 1) {
    const url = new URL("https://wapi.clinicoresuite.app/services");
    url.searchParams.set("page", String(page));

    const passthrough = ["name", "remote", "offices", "categoryId"];
    for (const key of passthrough) {
      if (req.query[key] !== undefined && req.query[key] !== null && req.query[key] !== "") {
        url.searchParams.set(key, String(req.query[key]));
      }
    }

    if (req.query.users) {
      url.searchParams.set("users", String(req.query.users));
    } else if (req.query.user) {
      url.searchParams.set("users", String(req.query.user));
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
      const err = new Error("Invalid JSON from Clinicoresuite services endpoint");
      err.status = 502;
      err.details = {
        upstreamStatus: response.status,
        raw: text
      };
      throw err;
    }

    if (!response.ok) {
      const err = new Error("Clinicoresuite services endpoint returned an error");
      err.status = response.status;
      err.details = data;
      throw err;
    }

    const items = parseItems(data);
    if (!items.length) break;

    let added = 0;
    for (const item of items) {
      const key = getServiceId(item);
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(item);
      added += 1;
    }

    if (!added) break;
  }

  return all;
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

    const services = await fetchServices(req, token);
    const map = new Map();

    for (const service of services) {
      const category = getCategory(service);
      const key = category.id || category.name;

      if (!map.has(key)) {
        map.set(key, {
          id: category.id,
          name: category.name,
          description: category.description || "",
          serviceCount: 0
        });
      }

      const group = map.get(key);
      group.serviceCount += 1;

      if (!group.description && category.description) {
        group.description = category.description;
      }
    }

    const categories = Array.from(map.values()).sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "de")
    );

    return res.status(200).json({
      categories,
      count: categories.length,
      serviceCount: services.length
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.message || "Unexpected categories proxy error",
      ...(error.details ? { details: error.details } : {})
    });
  }
}
