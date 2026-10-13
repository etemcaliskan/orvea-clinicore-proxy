import { resolveKombi, readResponse, berlinNow, httpError } from '../../lib/clinicore.js';
export const config = { maxDuration: 30 };
const origins = ['https://orvea.de', 'https://www.orvea.de'];
const cache = new Map(), pending = new Map();
const addDays = (date, n) => { const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
function validDate(date) { return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date+'T00:00:00Z')) && new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date; }
async function build(serviceList, user, start, days, facility, screenWidth) {
  const deadline = Date.now()+24000, resolved = await resolveKombi(serviceList), end = [addDays(start,days), addDays(berlinNow().date,56)].sort()[0];
  const slots = {}, frames = [], seen = new Set(); let cursor = start;
  for (let guard=0; cursor<end && guard<20; guard++) {
    if (seen.has(cursor)) throw httpError('Terminkalender konnte nicht vollständig geladen werden. Bitte erneut versuchen.');
    seen.add(cursor);
    const remaining = deadline-Date.now();
    if (remaining<1) throw httpError('Termine laden zu langsam. Bitte erneut versuchen.',504);
    const url = new URL('https://registration.clinicoresuite.app/register/all_registration_events/');
    for (const [k,v] of Object.entries({user_uuid:user, service_uuid:resolved.serviceUuid, office_id:'', facility_uuid:facility, current_time:cursor, screen_width:screenWidth})) url.searchParams.set(k,v);
    const {response,text} = await readResponse(url.toString(), { headers: {Accept:'application/json, text/javascript, */*; q=0.01','X-Requested-With':'XMLHttpRequest'},cache:'no-store'}, Math.min(8000,remaining));
    let data; try { data=JSON.parse(text); } catch { throw httpError('Clinicore lieferte eine ungültige Terminantwort. Bitte erneut versuchen.'); }
    if (!response.ok || !Array.isArray(data.user_schedule)) throw httpError('Clinicore-Termine konnten nicht geladen werden. Bitte erneut versuchen.');
    const now = berlinNow();
    const flags=[];
    for (const day of data.user_schedule) {
      const date=String(day?.date?.date || '').slice(0,10); if (!validDate(date)) continue;
      // Widget flags today's midnight as past even when future workingPeriods exist.
      // Only today is exempt from isPast; isAllowed and isHoliday always apply.
      const allowed=day.isAllowed!==false && day.isHoliday!==true && (day.isPast!==true || date===now.date);
      const times=allowed && Array.isArray(day.workingPeriods)?[...new Set(day.workingPeriods.map(t=>{
        const m=String(t||'').match(/(\d{1,2}):(\d{2})/); return m && +m[1]<24 && +m[2]<60?m[1].padStart(2,'0')+':'+m[2]:'';
      }).filter(t=>t && date>=now.date && (date!==now.date || t>now.time)))].sort():[];
      if (date>=start && date<end && times.length) slots[date]=times;
      flags.push({date,isAllowed:day.isAllowed,isHoliday:day.isHoliday,isPast:day.isPast,returnedTimes:times.length});
    }
    frames.push({date:cursor,days:flags});
    const next=String(data.next?.date || '').slice(0,10), last=String(data.user_schedule.at(-1)?.date?.date || '').slice(0,10);
    cursor=validDate(next)&&next>cursor?next:validDate(last)&&last>=cursor?addDays(last,1):addDays(cursor,4);
  }
  if(cursor<end) throw httpError('Terminkalender konnte nicht vollständig geladen werden. Bitte erneut versuchen.');
  return {slots:Object.fromEntries(Object.entries(slots).sort(([a],[b])=>a.localeCompare(b))),nextFreeVisits:[],resolved_service_uuid:resolved.serviceUuid,range:{start,end},_debug:{source:'registration_widget_all_registration_events',frames}};
}
export default async function handler(req,res) {
  if(origins.includes(req.headers.origin)) res.setHeader('Access-Control-Allow-Origin',req.headers.origin);
  res.setHeader('Vary','Origin'); res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Accept');res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try {
    const q=req.query||{}, service=String(q.service || q.service_uuid || ''), user=String(q.user || q.users || q.user_uuid || ''), start=String(q.date || q.current_time || berlinNow().date).slice(0,10);
    const days=Number.isFinite(Number(q.days))?Math.max(1,Math.min(56,Math.floor(Number(q.days)))):56;
    const facility=String(q.facility_uuid || process.env.CLINICORE_FACILITY_UUID || '022ee251-93ad-9357-751b-38677fa760dd'), width=String(q.screen_width||488);
    if(!service||!user||!validDate(start)||start>=addDays(berlinNow().date,56)) throw httpError('Ungültige Terminabfrage.',400);
    const key=JSON.stringify([service,user,start,days,facility,width]);let entry=cache.get(key);
    if(q.refresh==='1'||q.debug==='1'||!entry||entry.expiresAt<=Date.now()) {
      if(!pending.has(key)) pending.set(key,build(service,user,start,days,facility,width).then(value=>{
        const e={value,expiresAt:Date.now()+30000};
        for(const [k,v] of cache) if(v.expiresAt<=Date.now()) cache.delete(k);
        if(cache.size>=100) cache.delete(cache.keys().next().value);
        cache.set(key,e);return e;
      }).finally(()=>pending.delete(key)));
      entry=await pending.get(key);
    }
    const result={...entry.value};if(q.debug!=='1') delete result._debug;
    return res.status(200).json(result);
  } catch(e) { return res.status(e.status||502).json({error:e.message || 'Termine konnten nicht geladen werden. Bitte erneut versuchen.'}); }
}
