export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const token = process.env.CLINICORE_WAPI_TOKEN;

    if (!token) {
      return res.status(500).json({ error: "Missing token" });
    }

    let allServices = [];
    let page = 1;

    while (true) {
      const url = new URL("https://wapi.clinicoresuite.app/services");
      url.searchParams.set("page", page);

      const response = await fetch(url.toString(), {
        headers: {
          AuthorizationToken: token,
          Accept: "application/json"
        }
      });

      const data = await response.json();

      const items = Array.isArray(data)
        ? data
        : data["hydra:member"] || [];

      if (!items.length) break;

      allServices.push(...items);
      page++;
    }

    // 👉 HIER DIE FIX LOGIK
    const categoriesMap = new Map();

    for (const s of allServices) {
      let id = null;
      let name = null;

      // 🔥 alle möglichen Varianten abdecken
      if (s.category && s.category.id && s.category.name) {
        id = s.category.id;
        name = s.category.name;
      } else if (s.categoryId && s.categoryName) {
        id = s.categoryId;
        name = s.categoryName;
      } else if (s.categoryName) {
        id = s.categoryName;
        name = s.categoryName;
      }

      if (id && name) {
        categoriesMap.set(id, {
          id,
          name
        });
      }
    }

    const categories = Array.from(categoriesMap.values());

    return res.status(200).json(categories);

  } catch (err) {
    return res.status(500).json({
      error: "Category extraction failed",
      message: err.message
    });
  }
}
