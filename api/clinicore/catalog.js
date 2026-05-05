const CATEGORY_NAMES = {
  368: "Botulinumtoxin",
  374: "Biostimulation",
  380: "PRP",
  383: "Infusionstherapie",
  389: "Beratung",
  392: "Laser"
};

function categoryNameFromId(id) {
  return CATEGORY_NAMES[String(id)] || `Kategorie ${id}`;
}

function categoryDescriptionFromName(name) {
  return {
    Beratung: "Beratung.",
    Biostimulation: "Skinbooster, Polynukleotide.",
    Botulinumtoxin: "Botox-Behandlungen.",
    Infusionstherapie: "Performance Drips.",
    Laser: "Laserbehandlungen.",
    PRP: "PRP Face, Haare, Augen."
  }[name] || "";
}

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

async function fetchAllServices(req) {
  const token = process.env.CLINICORE_WAPI_TOKEN;

  if (!token) {
    throw new Error("Missing CLINICORE_WAPI_TOKEN");
  }

  const allServices = [];
  const seen = new Set();

  for (let page = 1; page <= 80; page++) {
    const url = new URL("https://wapi.clinicoresuite.app/services");
    url.searchParams.set("page", String(page));

    if (req?.query?.users) {
      url.searchParams.set("users", String(req.query.users));
    } else if (req?.query?.user) {
      url.searchParams.set("users", String(req.query.user));
    }

    if (req?.query?.offices) url.searchParams.set("offices", String(req.query.offices));
    if (req?.query?.remote !== undefined && req.query.remote !== null && req.query.remote !== "") {
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
      throw new Error(`Invalid JSON from Clinicore services endpoint. HTTP ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data?.error || data?.message || `Clinicore services HTTP ${response.status}`);
    }

    const items = parseItems(data);

    if (!items.length) break;

    let added = 0;

    for (const item of items) {
      const key = item?.uuid || item?.id || JSON.stringify(item);
      if (seen.has(key)) continue;
      seen.add(key);
      allServices.push(item);
      added++;
    }

    if (!added) break;
  }

  return allServices;
}

function normalizeService(service) {
  const categoryId = service?.categoryId ?? service?.category_id ?? service?.category?.id ?? null;
  const categoryName = categoryId ? categoryNameFromId(categoryId) : "Weitere Behandlungen";

  return {
    uuid: service?.uuid || service?.id || null,
    id: service?.id || service?.uuid || null,
    name: service?.name || "",
    description: service?.description || "",
    duration: service?.duration ?? null,
    break: service?.break ?? null,
    language: service?.language || null,
    categoryId: categoryId || "uncategorized",
    categoryName,
    price: service?.price ?? null,
    raw: service
  };
}

function serviceSort(a, b) {
  const an = String(a?.name || "");
  const bn = String(b?.name || "");
  return an.localeCompare(bn, "de");
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
    const services = (await fetchAllServices(req))
      .map(normalizeService)
      .filter((service) => service.uuid && service.name);

    const map = new Map();

    for (const service of services) {
      const id = service.categoryId || "uncategorized";
      const name = service.categoryName || "Weitere Behandlungen";

      if (!map.has(String(id))) {
        map.set(String(id), {
          id,
          name,
          description: categoryDescriptionFromName(name),
          services: []
        });
      }

      map.get(String(id)).services.push({
        uuid: service.uuid,
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        break: service.break,
        language: service.language,
        categoryId: service.categoryId,
        categoryName: service.categoryName,
        price: service.price
      });
    }

    const order = ["Beratung", "Biostimulation", "Botulinumtoxin", "Hyaluronsäure", "Mesotherapie", "Infusionstherapie", "Laser", "PRP", "Weitere Behandlungen"];

    const catalog = Array.from(map.values())
      .map((category) => ({
        ...category,
        serviceCount: category.services.length,
        services: category.services.sort(serviceSort)
      }))
      .filter((category) => category.serviceCount > 0)
      .sort((a, b) => {
        const ai = order.indexOf(a.name);
        const bi = order.indexOf(b.name);
        if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        return String(a.name).localeCompare(String(b.name), "de");
      });

    return res.status(200).json({
      catalog,
      categories: catalog.map(({ services, ...category }) => category),
      count: catalog.length,
      serviceCount: services.length
    });
  } catch (error) {
    return res.status(500).json({
      error: "Catalog extraction failed",
      message: error.message
    });
  }
}
