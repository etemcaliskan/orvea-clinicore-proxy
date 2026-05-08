export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
        return res.status(400).json({
          error: `Missing required field: ${field}`
        });
      }
    }

    const hasAnyDocumentField =
      !!body.document_country || !!body.document_type || !!body.document_value;

    const hasAllDocumentFields =
      !!body.document_country && !!body.document_type && !!body.document_value;

    if (hasAnyDocumentField && !hasAllDocumentFields) {
      return res.status(400).json({
        error: "document_country, document_type and document_value must be provided together"
      });
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
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept": "application/json, text/plain, */*"
      },
      body: payload.toString()
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.status(502).json({
        error: "Invalid response from Clinicoresuite order endpoint",
        upstreamStatus: response.status,
        raw: text,
        _debug: { endpoint:"book", outgoingPayload:Object.fromEntries(payload), upstreamStatus:response.status }
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected booking proxy error",
      message: error.message
    });
  }
}
