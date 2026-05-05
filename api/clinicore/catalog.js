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
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.serviceCategories)) return data.serviceCategories;
  return [];
}

function getToken() {
  const token = process.env.CLINICORE_WAPI_TOKEN;
  if (!token) throw new Error("Missing CLINICORE_WAPI_TOKEN");
  return token;
}

async function clinicoreGet(path, req, extraParams = {}) {
  const token = getToken();
  const url = new URL(`https://wapi.clinicoresuite.app${path}`);

  for (const [key, value] of Object.entries(extraParams)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

  if (req?.query?.users) url.searchParams.set("users", String(req.query.users));
  else if (req?.query?.user) url.searchParams.set("users", String(req.query.user));

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
  } catch {
    throw new Error(`Invalid JSON from Clinicore ${path}. HTTP ${response.status}`);
  }

  if (!response.ok) {
    const msg = data?.error || data?.message || `Clinicore ${path} HTTP ${response.status}`;
    const error = new Error(msg);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function fetchAllServices(req) {
  const allServices = [];
  const seen = new Set();

  for (let page = 1; page <= 80; page++) {
    const data = await clinicoreGet("/services", req, { page });
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

function extractCategoryId(service) {
  return service?.categoryId ?? service?.category_id ?? service?.category?.id ?? service?.category?.uuid ?? null;
}

function extractServiceCategoryName(service) {
  return (
    service?.categoryName ||
    service?.category_name ||
    service?.category?.name ||
    service?.category?.title ||
    service?.categoryTitle ||
    service?.category_title ||
    ""
  );
}

function normalizeCategoryItem(item) {
  if (!item || typeof item !== "object") return null;

  const id = item.id ?? item.uuid ?? item.categoryId ?? item.category_id ?? item["@id"] ?? null;
  const name = item.name ?? item.title ?? item.label ?? item.categoryName ?? item.category_name ?? "";
  const description = item.description ?? item.desc ?? item.subtitle ?? "";

  if (id === null || id === undefined || !String(name).trim()) return null;

  return {
    id,
    name: String(name).trim(),
    description: String(description || "").trim()
  };
}

async function fetchCategoryMap(req) {
  const candidates = [
    "/service-categories",
    "/service_categories",
    "/serviceCategories",
    "/services/categories",
    "/service/category",
    "/categories",
    "/categories/services"
  ];

  const map = new Map();
  const tried = [];

  for (const path of candidates) {
    try {
      const data = await clinicoreGet(path, req);
      const items = parseItems(data);
      tried.push({ path, status: "ok", count: items.length });

      for (const item of items) {
        const category = normalizeCategoryItem(item);
        if (category) map.set(String(category.id), category);
      }

      if (map.size) break;
    } catch (error) {
      tried.push({ path, status: error.status || "error", message: error.message });
    }
  }

  return { map, tried };
}

function normalizeService(service, categoryMap) {
  const categoryId = extractCategoryId(service);
  const categoryNameFromService = extractServiceCategoryName(service);
  const mapped = categoryId !== null && categoryId !== undefined ? categoryMap.get(String(categoryId)) : null;

  const categoryName =
    mapped?.name ||
    categoryNameFromService ||
    (categoryId !== null && categoryId !== undefined ? `Kategorie ${categoryId}` : "Weitere Behandlungen");

  const categoryDescription = mapped?.description || "";

  return {
    uuid: service?.uuid || service?.id || null,
    id: service?.id || service?.uuid || null,
    name: service?.name || "",
    description: service?.description || "",
    duration: service?.duration ?? null,
    break: service?.break ?? null,
    language: service?.language || null,
    categoryId: categoryId ?? "uncategorized",
    categoryName,
    categoryDescription,
    price: service?.price ?? null
  };
}

function serviceSort(a, b) {
  return String(a?.name || "").localeCompare(String(b?.name || ""), "de");
}

function categorySort(a, b) {
  return String(a?.name || "").localeCompare(String(b?.name || ""), "de");
}

function groupCatalog(services) {
  const map = new Map();

  for (const service of services) {
    const id = service.categoryId ?? "uncategorized";
    const key = String(id);
    const name = service.categoryName || "Weitere Behandlungen";

    if (!map.has(key)) {
      map.set(key, {
        id,
        name,
        description: service.categoryDescription || "",
        services: []
      });
    }

    map.get(key).services.push({
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

  return Array.from(map.values())
    .map((category) => ({
      ...category,
      serviceCount: category.services.length,
      services: category.services.sort(serviceSort)
    }))
    .filter((category) => category.serviceCount > 0)
    .sort(categorySort);
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { map: categoryMap, tried } = await fetchCategoryMap(req);
    const services = (await fetchAllServices(req))
      .map((service) => normalizeService(service, categoryMap))
      .filter((service) => service.uuid && service.name);

    const catalog = groupCatalog(services);

    return res.status(200).json({
      catalog,
      categories: catalog.map(({ services, ...category }) => category),
      count: catalog.length,
      serviceCount: services.length,
      categorySource: categoryMap.size ? "clinicore-category-endpoint" : "service-fields-or-category-id-fallback",
      categoryEndpointDebug: req.query.debug ? tried : undefined
    });
  } catch (error) {
    return res.status(500).json({
      error: "Catalog extraction failed",
      message: error.message
    });
  }
}
