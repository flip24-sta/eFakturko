// Live lookup of Slovak companies and sole traders (SZČO) in the official
// Register právnických osôb (RPO) of the Statistical Office of the SR.
// Data licence: CC BY 4.0 — attribution is returned with every response.
//
//   GET /.netlify/functions/register?ico=36631124   -> one entity by IČO
//   GET /.netlify/functions/register?q=kaviaren      -> up to 10 active entities by name
//
// The upstream API rate-limits callers, so responses are cached in memory
// (warm instances) and at Netlify's CDN, and a 429 is reported as retryable.

const RPO = 'https://api.statistics.sk/rpo/v1/search';
const SOURCE = 'Register právnických osôb, Štatistický úrad SR (CC BY 4.0)';
const TTL = 6 * 60 * 60 * 1000;
const cache = new Map();

const current = (arr) => (Array.isArray(arr) && arr.length ? arr.find((x) => !x.validTo) || arr[arr.length - 1] : null);
const fmtPsc = (p) => { const d = String(p || '').replace(/\s/g, ''); return d.length === 5 ? `${d.slice(0, 3)} ${d.slice(3)}` : d; };

function address(a) {
  if (!a) return '';
  const nums = [a.regNumber && a.regNumber !== 0 ? a.regNumber : '', a.buildingNumber || ''].filter(Boolean).join('/');
  const town = a.municipality?.value || '';
  const street = a.street ? `${a.street} ${nums}`.trim() : nums ? `${town} ${nums}` : '';
  const psc = fmtPsc(a.postalCodes?.[0]);
  return [street, [psc, town].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

function normalize(e) {
  const src = e.sourceRegister || {};
  const regName = src.value?.value || '';
  const code = src.value?.code;
  const office = current(src.registrationOffices)?.value || '';
  const number = current(src.registrationNumbers)?.value || '';
  const type = code === '1' ? 'firma' : code === '2' ? 'szco' : 'iny';
  const registerText = regName
    ? `Zapísaný v registri: ${regName}${office ? ', ' + office : ''}${number ? ', č. ' + number : ''}`
    : '';
  return {
    ico: current(e.identifiers)?.value || '',
    name: current(e.fullNames)?.value || '',
    address: address(current(e.addresses)),
    type,
    register: regName,
    registerText,
    established: e.establishment || '',
    terminated: e.termination || null,
  };
}

const json = (status, body, maxAge = 0) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': maxAge ? `public, max-age=${Math.min(maxAge, 3600)}` : 'no-store',
    ...(maxAge ? { 'Netlify-CDN-Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=604800` } : {}),
  },
  body: JSON.stringify({ ...body, source: SOURCE }),
});

async function rpo(params) {
  const key = new URLSearchParams(params).toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(`${RPO}?${key}`, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    if (r.status === 429) { const err = new Error('rate'); err.code = 429; throw err; }
    if (!r.ok) { const err = new Error('upstream ' + r.status); err.code = 502; throw err; }
    const data = await r.json();
    cache.set(key, { at: Date.now(), data });
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    return data;
  } finally { clearTimeout(t); }
}

const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  const p = event.queryStringParameters || {};
  try {
    if (p.ico) {
      const raw = String(p.ico).replace(/\D/g, '');
      if (raw.length < 6 || raw.length > 8) return json(400, { error: 'IČO musí mať 8 číslic' });
      const ico = raw.padStart(8, '0');
      const data = await rpo({ identifier: ico });
      const list = (data.results || []).map(normalize).filter((x) => x.ico === ico);
      const item = list.find((x) => !x.terminated) || list[0] || null;
      return item ? json(200, { result: item }, 86400) : json(404, { error: 'Subjekt s týmto IČO sa v registri nenašiel' }, 3600);
    }
    const q = String(p.q || '').trim().replace(/\s+/g, ' ');
    if (q.length < 3) return json(400, { error: 'Zadajte aspoň 3 znaky názvu alebo IČO' });
    if (/^\d{6,8}$/.test(q)) return exports.handler({ ...event, queryStringParameters: { ico: q } });
    const data = await rpo({ fullName: q.slice(0, 80), onlyActive: 'true' });
    const fq = fold(q);
    const list = (data.results || []).map(normalize).filter((x) => !x.terminated && x.ico)
      .sort((a, b) => (fold(b.name).startsWith(fq) - fold(a.name).startsWith(fq)) || a.name.localeCompare(b.name, 'sk'))
      .slice(0, 10);
    return json(200, { results: list, total: (data.results || []).length }, 21600);
  } catch (e) {
    if (e.code === 429) return json(503, { error: 'Register je momentálne preťažený, skúste to o chvíľu', retry: true });
    if (e.name === 'AbortError') return json(504, { error: 'Register neodpovedal včas, skúste to znova', retry: true });
    console.error('register', e.message);
    return json(502, { error: 'Register je dočasne nedostupný', retry: true });
  }
};
