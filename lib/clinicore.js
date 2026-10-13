// Shared by slots and booking: never silently fall back to a shorter treatment.
export function httpError(message, status = 502) {
  const e = new Error(message); e.status = status; return e;
}
export async function readResponse(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    return { response, text };
  } catch (e) {
    if (e.name === 'AbortError') throw httpError('Clinicore antwortet zu langsam. Bitte erneut versuchen.', 504);
    throw e;
  } finally { clearTimeout(timer); }
}
export function berlinNow(date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
function items(data) {
  for (const value of [data, data?.['hydra:member'], data?.items, data?.data, data?.services, data?.categories]) {
    if (Array.isArray(value)) return value;
  }
  return [];
}
let indexCache = null, indexPending = null;
async function apiGet(path, params, deadline) {
  const token = process.env.CLINICORE_WAPI_TOKEN;
  if (!token) throw httpError('Clinicore-Zugang ist nicht eingerichtet.', 503);
  const url = new URL('https://wapi.clinicoresuite.app' + path);
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, String(v));
  const remaining = deadline - Date.now();
  if (remaining < 1) throw httpError('Clinicore antwortet zu langsam. Bitte erneut versuchen.', 504);
  const { response, text } = await readResponse(url.toString(), {
    headers: { AuthorizationToken: token, Accept: 'application/json' }
  }, Math.min(8000, remaining));
  let data; try { data = JSON.parse(text); } catch { throw httpError('Ungültige Clinicore-Antwort. Bitte erneut versuchen.'); }
  if (!response.ok) throw httpError('Clinicore-Leistungen konnten nicht geladen werden.', 502);
  return data;
}
async function loadIndex() {
  if (indexCache?.expiresAt > Date.now()) return indexCache.value;
  if (indexPending) return indexPending;
  indexPending = (async () => {
    const deadline = Date.now() + 12000, cats = new Map(), all = new Map();
    try { for (const c of items(await apiGet('/categories', {}, deadline))) cats.set(String(c.id), String(c.name || c.title || '')); }
    catch { /* Detection by the original combination treatment name remains available. */ }
    let complete = false;
    for (let page = 1; page <= 80; page++) {
      const list = items(await apiGet('/services', { page }, deadline)); let added = 0;
      for (const s of list) {
        const uuid = s?.uuid || s?.id;
        if (!uuid || all.has(uuid)) continue;
        const category = cats.get(String(s.categoryId ?? s.category_id ?? s.category?.id)) || s.categoryName || s.category?.name || '';
        all.set(uuid, { uuid, name: String(s.name || ''), duration: Number(s.duration) || 0,
          kombi: /kombinationsbehandlung/i.test(s.name || '') || /^\s*intern\s*$/i.test(category) });
        added++;
      }
      if (!list.length || !added) { complete = true; break; }
    }
    if (!complete) throw httpError('Leistungsliste unvollständig. Bitte erneut versuchen.', 503);
    const value = { all, kombis: [...all.values()].filter(s => s.kombi && s.duration > 0 && s.duration <= 120).sort((a,b) => a.duration-b.duration || String(a.uuid).localeCompare(String(b.uuid))) };
    indexCache = { value, expiresAt: Date.now() + 300000 }; return value;
  })().finally(() => { indexPending = null; });
  return indexPending;
}
export async function resolveKombi(raw) {
  const uuids = [...new Set(String(raw || '').split(',').map(x => x.trim()).filter(Boolean))];
  if (!uuids.length || uuids.length > 10 || !uuids.every(u => /^[0-9a-f-]{20,40}$/i.test(u)))
    throw httpError('Bitte ein bis zehn gültige Behandlungen auswählen.', 400);
  if (uuids.length === 1) return { ok: true, multi: false, serviceUuid: uuids[0] };
  const index = await loadIndex();
  const selected = uuids.map(u => index.all.get(u));
  if (selected.some(s => !s || s.kombi || s.duration <= 0)) throw httpError('Eine Behandlung ist nicht mehr verfügbar. Bitte neu auswählen.', 409);
  const sum = selected.reduce((total,s) => total + s.duration, 0), target = Math.ceil(sum / 5) * 5;
  if (target > 120) throw httpError('Diese Auswahl benötigt mehr als 120 Minuten. Bitte getrennte Termine buchen oder ORVĒA kontaktieren.', 422);
  const kombi = index.kombis.find(k => k.duration >= target);
  if (!kombi) throw httpError('Für diese Kombination ist keine passende Termindauer eingerichtet. Bitte ORVĒA kontaktieren.', 422);
  return { ok: true, multi: true, kombi, serviceUuid: kombi.uuid, items: selected, sum, target };
}
export function kombiNote(r) {
  if (!r.multi) return '';
  return `KOMBI-TERMIN ${r.kombi.duration} Min. (Summe ${r.sum} Min.):\n` +
    r.items.map((s,i) => `${i+1}. ${s.name} (${s.duration} Min.)`).join('\n');
}
