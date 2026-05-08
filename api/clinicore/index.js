// Full Express proxy for Clinicoresuite
// Replace your existing index.js completely with this file

import express from "express";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WAPI_TOKEN = process.env.CLINICORE_WAPI_TOKEN;

function sendJsonError(res, status, message, extra = {}) {
  return res.status(status).json({
    error: message,
    ...extra
  });
}

app.get("/api/clinicore/services", async (req, res) => {
  try {
    if (!WAPI_TOKEN) {
      return sendJsonError(res, 500, "Missing CLINICORE_WAPI_TOKEN");
    }

    const { name, remote, offices, users, categoryId, page } = req.query;

    const url = new URL("https://wapi.clinicoresuite.app/services");

    if (page) url.searchParams.set("page", String(page));
    if (name) url.searchParams.set("name", String(name));
    if (remote !== undefined && remote !== null && remote !== "") {
      url.searchParams.set("remote", String(remote));
    }
    if (offices) url.searchParams.set("offices", String(offices));
    if (users) url.searchParams.set("users", String(users));
    if (categoryId) url.searchParams.set("categoryId", String(categoryId));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        AuthorizationToken: WAPI_TOKEN,
        Accept: "application/json"
      }
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      return sendJsonError(res, 502, "Invalid JSON from Clinicoresuite services endpoint", {
        upstreamStatus: response.status,
        raw: text
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return sendJsonError(res, 500, "Unexpected proxy error", {
      message: error.message
    });
  }
});

app.get("/api/clinicore/slots", async (req, res) => {
  try {
    if (!WAPI_TOKEN) {
      return sendJsonError(res, 500, "Missing CLINICORE_WAPI_TOKEN");
    }

    const { service, days, date, users, user, offices, remote, page } = req.query;

    if (!service) {
      return sendJsonError(res, 400, "Missing service");
    }

    const url = new URL("https://wapi.clinicoresuite.app/slots");

    if (page) url.searchParams.set("page", String(page));
    url.searchParams.set("service", String(service));

    if (days) url.searchParams.set("days", String(days));
    if (date) url.searchParams.set("date", String(date));
    if (offices) url.searchParams.set("offices", String(offices));
    if (remote !== undefined && remote !== null && remote !== "") {
      url.searchParams.set("remote", String(remote));
    }

    if (users) {
      const splitUsers = String(users)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      for (const u of splitUsers) {
        url.searchParams.append("users[]", u);
      }
    } else if (user) {
      url.searchParams.append("users[]", String(user));
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        AuthorizationToken: WAPI_TOKEN,
        Accept: "application/json"
      }
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      return sendJsonError(res, 502, "Invalid JSON from Clinicoresuite slots endpoint", {
        upstreamStatus: response.status,
        raw: text
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return sendJsonError(res, 500, "Unexpected proxy error", {
      message: error.message
    });
  }
});

app.post("/api/clinicore/book", async (req, res) => {
  try {
    const body = req.body || {};

    const requiredFields = [
      "reg",
      "terms",
      "chosen_user",
      "chosen_service",
      "office_id",
      "chosen_date",
      "email",
      "phone",
      "phone_direction",
      "patient_name",
      "patient_lastname",
      "patient_language",
      "referer",
      "source"
    ];

    for (const field of requiredFields) {
      if (
        body[field] === undefined ||
        body[field] === null ||
        body[field] === ""
      ) {
        return sendJsonError(res, 400, `Missing required field: ${field}`);
      }
    }

    const hasAnyDocumentField =
      !!body.document_country || !!body.document_type || !!body.document_value;

    const hasAllDocumentFields =
      !!body.document_country && !!body.document_type && !!body.document_value;

    if (hasAnyDocumentField && !hasAllDocumentFields) {
      return sendJsonError(
        res,
        400,
        "document_country, document_type and document_value must be provided together"
      );
    }

    const payload = new URLSearchParams();

    payload.set("reg", String(body.reg));
    payload.set("terms", String(body.terms));
    payload.set("chosen_user", String(body.chosen_user));
    payload.set("chosen_service", String(body.chosen_service));
    payload.set("office_id", String(body.office_id));
    payload.set("chosen_date", String(body.chosen_date));
    payload.set("email", String(body.email));
    payload.set("phone", String(body.phone));
    payload.set("phone_direction", String(body.phone_direction));
    payload.set("patient_name", String(body.patient_name));
    payload.set("patient_lastname", String(body.patient_lastname));
    payload.set("message", String(body.message || ""));
    payload.set("patient_language", String(body.patient_language || "de"));
    payload.set("referer", String(body.referer || ""));
    payload.set("source", String(body.source || "dedicated"));
    payload.set("allow_payment", String(body.allow_payment || "1"));

    if (hasAllDocumentFields) {
      payload.set("document_country", String(body.document_country));
      payload.set("document_type", String(body.document_type));
      payload.set("document_value", String(body.document_value));
    }

    if (body.patient_pesel) {
      payload.set("patient_pesel", String(body.patient_pesel));
    }

    if (body.patient_zip) {
      payload.set("patient_zip", String(body.patient_zip));
    }

    if (body.patient_city) {
      payload.set("patient_city", String(body.patient_city));
    }

    if (body.patient_street) {
      payload.set("patient_street", String(body.patient_street));
    }

    if (body.patient_home_number) {
      payload.set("patient_home_number", String(body.patient_home_number));
    }

    if (body.patient_home_place) {
      payload.set("patient_home_place", String(body.patient_home_place));
    }

    if (body.chosen_facility) {
      payload.set("chosen_facility", String(body.chosen_facility));
    }

    if (body.discount_uuid) {
      payload.set("discount_uuid", String(body.discount_uuid));
    }

    const response = await fetch("https://clinicoresuite.app/rejestracja/order", {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: payload.toString()
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      return sendJsonError(res, 502, "Invalid response from Clinicoresuite order endpoint", {
        upstreamStatus: response.status,
        raw: text
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return sendJsonError(res, 500, "Unexpected booking proxy error", {
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on http://localhost:${PORT}`);
});
