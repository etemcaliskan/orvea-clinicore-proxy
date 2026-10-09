const ALLOWED_ORIGINS = ["https://orvea.de", "https://www.orvea.de"];

function allowOrigin(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
}

const CACHE_TTL_MS = 5 * 60 * 1000;

let catalogCache = null;
let categoriesCache = null;

function isFresh(entry) {
  return entry && entry.expiresAt > Date.now();
}

function setCors(req, res) {
  allowOrigin(req, res);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, AuthorizationToken, Accept");
}

function setCacheHeaders(res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
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
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
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

async function buildCatalog(req) {
  const { map: categoryMap, tried } = await fetchCategoryMap(req);
  const services = (await fetchAllServices(req))
    .map((service) => normalizeService(service, categoryMap))
    .filter((service) => service.uuid && service.name)
    .filter((service) => !isKombiService(service, service.categoryName));

  const catalog = groupCatalog(services);

  return {
    catalog,
    categories: catalog.map(({ services, ...category }) => category),
    count: catalog.length,
    serviceCount: services.length,
    categorySource: categoryMap.size ? "clinicore-category-endpoint" : "service-fields-or-category-id-fallback",
    categoryEndpointDebug: tried
  };
}

function shouldBypassCache(req) {
  return req?.query?.refresh === "1" || req?.query?.nocache === "1";
}

// ---- ORVEA Kombi-Termin (v1, 10.10.2026) ----------------------------------
// Mehrere gewaehlte Behandlungen werden im Hintergrund als EIN Kombi-Termin
// gebucht. Kombi-Leistungen erkennt der Proxy am Namen ("Kombi...") oder an
// einer Clinicore-Kategorie, deren Name "Kombi" oder "Intern" enthaelt.
// Sie werden im Buchungstool nie angezeigt.
const KOMBI_MIN = 60;
const KOMBI_MAX = 120;
const KOMBI_STEP = 5;
const KOMBI_TTL_MS = 5 * 60 * 1000;
let kombiCache = null;

function kombiItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.["hydra:member"])) return data["hydra:member"];
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

async function kombiGet(path, params = {}) {
  const token = process.env.CLINICORE_WAPI_TOKEN;
  if (!token) throw new Error("Missing CLINICORE_WAPI_TOKEN");
  const url = new URL("https://wapi.clinicoresuite.app" + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const r = await fetch(url.toString(), { headers: { AuthorizationToken: token, Accept: "application/json" } });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data) throw new Error("Clinicore " + path + " HTTP " + r.status);
  return data;
}

function kombiCategoryId(s) {
  return s?.categoryId ?? s?.category_id ?? s?.category?.id ?? null;
}

function isKombiService(service, categoryName) {
  const name = String(service?.name || "");
  const cat = String(categoryName || service?.categoryName || service?.category?.name || "");
  return /kombi/i.test(name) || /kombi|intern/i.test(cat);
}

async function loadServiceIndex() {
  if (kombiCache && kombiCache.expiresAt > Date.now()) return kombiCache.value;
  const catNames = new Map();
  try {
    for (const c of kombiItems(await kombiGet("/categories"))) {
      if (c && c.id != null) catNames.set(String(c.id), String(c.name || c.title || ""));
    }
  } catch (e) { /* Kategorien optional, Erkennung dann nur ueber den Namen */ }
  const all = new Map();
  for (let page = 1; page <= 80; page++) {
    const items = kombiItems(await kombiGet("/services", { page }));
    let added = 0;
    for (const s of items) {
      const uuid = s?.uuid || s?.id;
      if (!uuid || all.has(uuid)) continue;
      const catName = catNames.get(String(kombiCategoryId(s))) || s?.categoryName || "";
      all.set(uuid, {
        uuid,
        name: String(s.name || ""),
        duration: Number(s.duration) || 0,
        kombi: isKombiService(s, catName)
      });
      added++;
    }
    if (!items.length || !added) break;
  }
  const value = { all, kombis: [...all.values()].filter((s) => s.kombi && s.duration > 0).sort((a, b) => a.duration - b.duration) };
  kombiCache = { value, expiresAt: Date.now() + KOMBI_TTL_MS };
  return value;
}

function parseServiceList(raw) {
  const list = String(raw || "").split(",").map((x) => x.trim()).filter(Boolean);
  const unique = [...new Set(list)];
  if (!unique.length || unique.length > 10) return [];
  return unique.every((u) => /^[0-9a-f-]{20,40}$/i.test(u)) ? unique : [];
}

// Liefert fuer eine Liste von Leistungs-UUIDs die zu buchende Leistung.
// Eine Leistung: unveraendert. Mehrere: passender Kombi-Termin
// (Summe der Behandlungsdauern, auf 5 Min. aufgerundet, mind. 60, max. 120).
async function resolveKombi(rawServices) {
  const uuids = parseServiceList(rawServices);
  if (!uuids.length) return { ok: false, error: "Ungueltige Leistung" };
  if (uuids.length === 1) return { ok: true, multi: false, serviceUuid: uuids[0] };

  const fallback = { ok: true, multi: true, kombi: null, serviceUuid: uuids[uuids.length - 1], items: uuids.map((u) => ({ uuid: u, name: u, duration: 0 })) };
  let index;
  try { index = await loadServiceIndex(); } catch (e) { return fallback; }

  const items = uuids.map((u) => index.all.get(u) || { uuid: u, name: u, duration: 0 });
  fallback.items = items;
  const sum = items.reduce((t, s) => t + (s.duration || 0), 0);
  let target = Math.ceil(sum / KOMBI_STEP) * KOMBI_STEP;
  if (target < KOMBI_MIN) target = KOMBI_MIN;
  if (target > KOMBI_MAX) target = KOMBI_MAX;

  const kombi =
    index.kombis.find((k) => k.duration === target) ||
    index.kombis.find((k) => k.duration >= target) ||
    index.kombis[index.kombis.length - 1] ||
    null;
  if (!kombi) return { ...fallback, sum, target };
  return { ok: true, multi: true, kombi, serviceUuid: kombi.uuid, items, sum, target };
}

function kombiNote(r) {
  if (!r?.multi) return "";
  const lines = r.items.map((s, i) => (i + 1) + ". " + s.name + (s.duration ? " (" + s.duration + " Min.)" : ""));
  if (!r.kombi) {
    return "MEHRERE BEHANDLUNGEN - bitte Termindauer prüfen:\n" + lines.join("\n");
  }
  const capped = r.sum > KOMBI_MAX;
  return "KOMBI-TERMIN " + r.kombi.duration + " Min." +
    " (Summe " + r.sum + " Min." + (capped ? ", auf " + KOMBI_MAX + " Min. begrenzt – Termindauer prüfen" : "") + "):\n" +
    lines.join("\n");
}
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  setCors(req, res);
  setCacheHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const debug = req.query.debug === "1";
    const bypass = shouldBypassCache(req);

    if (!bypass && isFresh(catalogCache)) {
      const cached = { ...catalogCache.value };
      if (!debug) delete cached.categoryEndpointDebug;
      return res.status(200).json({ ...cached, cache: "hit" });
    }

    const built = await buildCatalog(req);

    const payload = {
      catalog: built.catalog,
      categories: built.categories,
      count: built.count,
      serviceCount: built.serviceCount,
      categorySource: built.categorySource,
      categoryEndpointDebug: built.categoryEndpointDebug
    };

    catalogCache = {
      value: payload,
      expiresAt: Date.now() + CACHE_TTL_MS
    };

    const response = { ...payload };
    if (!debug) delete response.categoryEndpointDebug;

    return res.status(200).json({ ...response, cache: bypass ? "bypass" : "miss" });
  } catch (error) {
    return res.status(500).json({
      error: "Catalog extraction failed",
      message: error.message
    });
  }
}
