const CATEGORY_NAMES = {
  368: "Botulinumtoxin",
  371: "Hyaluronsäure",
  374: "Biostimulation",
  380: "PRP",
  383: "Infusionstherapie",
  389: "Beratung",
  392: "Laser",
  572: "Mesotherapie",
  599: "Beratung"
};

function inferCategoryFromServiceName(name) {
  const n = String(name || "").toLowerCase();

  if (/^beratung\b/.test(n)) return { id: 599, name: "Beratung" };
  if (/\bprp\b/.test(n)) return { id: 380, name: "PRP" };
  if (/hyaluron|hyaluronidase|lippe|jawline|kinn|mundwinkel|nasolabial|plissefalten|tränenrinne|traenenrinne|wangen|zone hyaluron/.test(n)) {
    return { id: 371, name: "Hyaluronsäure" };
  }
  if (/nctf|profhilo|mesotherapie|\bmeso\b/.test(n)) return { id: 572, name: "Mesotherapie" };
  if (/botox|botulinum/.test(n)) return { id: 368, name: "Botulinumtoxin" };
  if (/polynukleotid|radiesse|skinbooster/.test(n)) return { id: 374, name: "Biostimulation" };
  if (/infusion|drip|vitamin|baseninfusion|inner glow|neuro balance/.test(n)) return { id: 383, name: "Infusionstherapie" };
  if (/laser|lasemd/.test(n)) return { id: 392, name: "Laser" };

  return { id: "uncategorized", name: "Weitere Behandlungen" };
}

function categoryNameFromId(id) {
  return CATEGORY_NAMES[String(id)] || `Kategorie ${id}`;
}

function categoryDescriptionFromName(name) {
  return {
    Beratung: "Erstgespräche und individuelle Beratung.",
    Biostimulation: "Skinbooster, Polynukleotide und regenerative Behandlungen.",
    Botulinumtoxin: "Botox-Behandlungen und verwandte Leistungen.",
    Hyaluronsäure: "Hyaluron-Filler und konturierende Behandlungen.",
    Mesotherapie: "Mesotherapie, Profhilo und NCTF.",
    Infusionstherapie: "Performance Drips und Infusionsleistungen.",
    Laser: "Laser- und apparative Behandlungen.",
    PRP: "PRP Face, Haare und Augen.",
    "Weitere Behandlungen": "Weitere Leistungen."
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
  const directCategoryId = service?.categoryId ?? service?.category_id ?? service?.category?.id ?? null;

  let categoryId = directCategoryId;
  let categoryName = categoryId ? categoryNameFromId(categoryId) : "";

  if (!categoryId || /^Kategorie\s+\d+$/i.test(categoryName)) {
    const inferred = inferCategoryFromServiceName(service?.name);
    categoryId = inferred.id;
    categoryName = inferred.name;
  }

  return {
    uuid: service?.uuid || service?.id || null,
    id: service?.id || service?.uuid || null,
    name: service?.name || "",
    description: service?.description || "",
    duration: service?.duration ?? null,
    break: service?.break ?? null,
    language: service?.language || null,
    categoryId,
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

function categorySort(a, b) {
  const order = [
    "Beratung",
    "Biostimulation",
    "Botulinumtoxin",
    "Hyaluronsäure",
    "Mesotherapie",
    "Infusionstherapie",
    "Laser",
    "PRP",
    "Weitere Behandlungen"
  ];

  const ai = order.indexOf(a.name);
  const bi = order.indexOf(b.name);

  if (ai !== -1 || bi !== -1) {
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  }

  return String(a.name).localeCompare(String(b.name), "de");
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
    const services = (await fetchAllServices(req)).map(normalizeService);
    const map = new Map();

    for (const service of services) {
      const id = service.categoryId || "uncategorized";
      const name = service.categoryName || "Weitere Behandlungen";

      if (!map.has(String(id))) {
        map.set(String(id), {
          id,
          name,
          description: categoryDescriptionFromName(name),
          serviceCount: 0
        });
      }

      map.get(String(id)).serviceCount++;
    }

    const categories = Array.from(map.values())
      .filter((category) => category.serviceCount > 0)
      .sort(categorySort);

    return res.status(200).json({
      categories,
      count: categories.length,
      serviceCount: services.length
    });
  } catch (error) {
    return res.status(500).json({
      error: "Category extraction failed",
      message: error.message
    });
  }
}
