import { resolveKombi, kombiNote, readResponse, httpError, berlinNow } from '../../lib/clinicore.js';
export const config = { maxDuration: 30 };
const ALLOWED_ORIGINS = ["https://orvea.de", "https://www.orvea.de"];

function allowOrigin(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
}

export default async function handler(req, res) {
  allowOrigin(req, res);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

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

    if (String(body.reg) !== "1" || String(body.terms) !== "1") {
      return res.status(400).json({
        error: "Bitte Datenschutzerklärung und AGB bestätigen."
      });
    }

    // Mehrere Behandlungen (kommagetrennt): als ein Kombi-Termin buchen
    const resolved = await resolveKombi(body.chosen_service);
    if (!resolved.ok) {
      return res.status(400).json({ error: resolved.error });
    }
    if (body.resolved_service_uuid && body.resolved_service_uuid !== resolved.serviceUuid) {
      throw httpError("Die passende Termindauer hat sich geändert. Bitte den Termin neu auswählen.", 409);
    }
    const note = kombiNote(resolved);
    const patientMessage = String(body.message || "");
    const message = note ? note + (patientMessage ? "\n\n" + patientMessage : "") : patientMessage;

    // Datum laut Clinicore-Doku im Format "Y-m-d H:i"
    const dateMatch = String(body.chosen_date).match(/^(\d{4}-\d{2}-\d{2})\s*(\d{1,2}:\d{2})$/);
    const chosenDate = dateMatch ? dateMatch[1] + " " + dateMatch[2].padStart(5, "0") : String(body.chosen_date);

    if (!dateMatch) throw httpError("Bitte einen gültigen Termin auswählen.", 400);
    const now = berlinNow();
    if (chosenDate < now.date + " " + now.time) throw httpError("Dieser Termin liegt bereits in der Vergangenheit. Bitte neu auswählen.", 409);
    const payload = new URLSearchParams();

    payload.set("reg", "1");
    payload.set("terms", "1");
    payload.set("chosen_user", String(body.chosen_user));
    payload.set("chosen_service", String(resolved.serviceUuid));
    payload.set("office_id", String(body.office_id));
    payload.set("chosen_date", chosenDate);
    payload.set("email", String(body.email));
    payload.set("phone", String(body.phone));
    payload.set("phone_direction", String(body.phone_direction));
    payload.set("patient_name", String(body.patient_name));
    payload.set("patient_lastname", String(body.patient_lastname));
    payload.set("message", message);
    payload.set("patient_language", String(body.patient_language || "de"));
    payload.set("referer", String(body.referer || ""));
    payload.set("source", String(body.source || "dedicated"));
    payload.set("allow_payment", String(body.allow_payment || "1"));

    if (body.document_country) {
      payload.set("document_country", String(body.document_country));
    }

    if (body.document_type) {
      payload.set("document_type", String(body.document_type));
    }

    if (body.document_value) {
      payload.set("document_value", String(body.document_value));
    }

    const { response, text } = await readResponse("https://clinicoresuite.app/rejestracja/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept": "application/json, text/plain, */*"
      },
      body: payload.toString()
    }, 12000).catch(error => {
      error.bookingStarted = true;
      if (!error.status) error.status = 504;
      throw error;
    });

    let data;
    try {
      data = JSON.parse(text);
      return res.status(response.status).json(data);
    } catch (e) {
      // A non-JSON reply may follow a successful write: do not claim failure
      // with an automatic retry and risk creating a duplicate appointment.
      return res.status(502).json({ error: "Buchungsbestätigung unklar. Bitte ORVĒA kontaktieren und nicht erneut buchen.", code: "BOOKING_STATUS_UNKNOWN" });
    }
  } catch (error) {
    const unknown = error.status === 504 && error.bookingStarted;
    return res.status(unknown ? 504 : error.status || 502).json({
      error: unknown ? "Buchungsbestätigung verzögert. Bitte ORVĒA kontaktieren und nicht erneut buchen." : error.message,
      code: unknown ? "BOOKING_STATUS_UNKNOWN" : "BOOKING_ERROR"
    });
  }
}
