// 공공데이터포털(data.go.kr) 추가 자료 — 기상청 키(KMA_KEY)와 같은 인증키를 쓰고, 서비스마다 '활용신청'만 하면 됨
//   미세먼지 : 한국환경공단 에어코리아 (측정소 목록 + 실시간 측정값)
//   중기예보 : 기상청 중기예보 (4~10일 뒤 날씨·기온)
//   자외선   : 기상청 생활기상지수 (자외선지수)
//   특보     : 기상청 기상특보 (지금 내려진 특보·예비특보)
// 각 자료는 따로 실패할 수 있으므로, 실패한 것만 error 로 알려 주고 나머지는 그대로 돌려준다.

const DG = 'https://apis.data.go.kr';
const pad = n => String(n).padStart(2, '0');
const kstDate = (now = new Date()) => new Date(now.getTime() + 9 * 3600000);
const ymdOf = t => `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}`;
const dash = s => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

export function distKm(a, b, c, d) {
  const R = 6371, r = x => (x * Math.PI) / 180;
  const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* 공공데이터포털 호출. 응답 모양이 서비스마다 조금씩 달라서 둘 다 받음 */
export async function dg(fetcher, key, path, params, label) {
  const q = new URLSearchParams({ serviceKey: key, pageNo: '1', numOfRows: '100', ...params });
  let r;
  try { r = await fetcher(`${DG}/${path}?${q}`); } catch (e) { throw new Error(`${label}: 연결 실패`); }
  const text = await r.text();
  let j;
  try { j = JSON.parse(text); } catch {
    const m = text.match(/<returnAuthMsg>([^<]+)</) || text.match(/<resultMsg>([^<]+)</) || text.match(/<errMsg>([^<]+)</);
    const msg = m ? m[1] : `${r.status} ${text.slice(0, 40).replace(/\s+/g, ' ')}`;
    throw new Error(`${label}: ${/NOT_REGISTERED|Unauthorized|Forbidden|403|401/i.test(msg + r.status) ? '활용신청 승인 전이거나 키가 달라요' : msg}`);
  }
  const resp = j.response || j;
  const h = resp.header || {};
  const code = String(h.resultCode == null ? '' : h.resultCode);
  if (code && code !== '00' && code !== '0') {
    const e = new Error(`${label}: ${code === '03' || /NO_DATA/.test(h.resultMsg) ? '자료 없음' : (h.resultMsg || code)}`);
    e.code = code;
    throw e;
  }
  let items = resp.body && resp.body.items;
  if (items && !Array.isArray(items)) items = items.item || [];
  if (items && !Array.isArray(items)) items = [items];
  return items || [];
}

/* 지역 기준 도시표: 위치 → 가장 가까운 도시 → 중기예보 지역번호·자외선 지역번호·시도 이름
 * ta: 중기기온 지역, land: 중기육상 지역, area: 생활기상지수 행정구역(시도), sd: 시도 줄임말 */
export const CITIES = [
  ['서울', 37.5665, 126.978, '11B10101', '11B00000', '1100000000', '서울'],
  ['인천', 37.4563, 126.7052, '11B20201', '11B00000', '2800000000', '인천'],
  ['수원', 37.2636, 127.0286, '11B20601', '11B00000', '4100000000', '경기'],
  ['파주', 37.76, 126.78, '11B20305', '11B00000', '4100000000', '경기'],
  ['춘천', 37.8813, 127.7298, '11D10301', '11D10000', '5100000000', '강원'],
  ['원주', 37.3422, 127.9202, '11D10401', '11D10000', '5100000000', '강원'],
  ['강릉', 37.7519, 128.8761, '11D20501', '11D20000', '5100000000', '강원'],
  ['대전', 36.3504, 127.3845, '11C20401', '11C20000', '3000000000', '대전'],
  ['세종', 36.48, 127.289, '11C20404', '11C20000', '3611000000', '세종'],
  ['서산', 36.7845, 126.45, '11C20101', '11C20000', '4400000000', '충남'],
  ['청주', 36.6424, 127.489, '11C10301', '11C10000', '4300000000', '충북'],
  ['전주', 35.8242, 127.148, '11F10201', '11F10000', '5200000000', '전북'],
  ['군산', 35.9676, 126.7369, '21F10501', '11F10000', '5200000000', '전북'],
  ['광주', 35.1595, 126.8526, '11F20501', '11F20000', '2900000000', '광주'],
  ['목포', 34.8118, 126.3922, '21F20801', '11F20000', '4600000000', '전남'],
  ['여수', 34.7604, 127.6622, '11F20401', '11F20000', '4600000000', '전남'],
  ['대구', 35.8714, 128.6014, '11H10701', '11H10000', '2700000000', '대구'],
  ['안동', 36.5684, 128.7294, '11H10501', '11H10000', '4700000000', '경북'],
  ['포항', 36.019, 129.3435, '11H10201', '11H10000', '4700000000', '경북'],
  ['부산', 35.1796, 129.0756, '11H20201', '11H20000', '2600000000', '부산'],
  ['울산', 35.5384, 129.3114, '11H20101', '11H20000', '3100000000', '울산'],
  ['창원', 35.2281, 128.6811, '11H20301', '11H20000', '4800000000', '경남'],
  ['제주', 33.4996, 126.5312, '11G00201', '11G00000', '5000000000', '제주'],
  ['서귀포', 33.2541, 126.56, '11G00401', '11G00000', '5000000000', '제주']
].map(([name, lat, lon, ta, land, area, sd]) => ({ name, lat, lon, ta, land, area, sd }));
export const nearCities = (lat, lon) => CITIES.map(c => ({ ...c, km: distKm(lat, lon, c.lat, c.lon) })).sort((a, b) => a.km - b.km);

/* ── 미세먼지 (에어코리아) ─────────────────────── */
const num = v => { const n = parseFloat(v); return Number.isFinite(n) && n >= 0 ? n : null; };
export async function stationList({ key, fetcher, cache }) {
  const ck = new Request('https://parkgolf.internal/air/stations/v1');
  if (cache) { const hit = await cache.match(ck); if (hit) return hit.json(); }
  const items = await dg(fetcher, key, 'B552584/MsrstnInfoInqireSvc/getMsrstnList', { returnType: 'json', numOfRows: '1000' }, '미세먼지 측정소');
  const list = items.map(x => {
    const a = num(x.dmX), b = num(x.dmY); // 에어코리아: dmX 위도, dmY 경도 (혹시 반대여도 알아서)
    const [lat, lon] = a != null && b != null ? (a < b ? [a, b] : [b, a]) : [null, null];
    return { n: x.stationName, a: x.addr || '', lat, lon };
  }).filter(x => x.n && x.lat > 32 && x.lat < 39.5 && x.lon > 124 && x.lon < 132.5);
  if (!list.length) throw new Error('미세먼지 측정소: 목록이 비어 있어요');
  if (cache) await cache.put(ck, new Response(JSON.stringify(list), { headers: { 'Cache-Control': 'max-age=604800' } }));
  return list;
}
export async function airNow({ lat, lon, key, fetcher = fetch, cache }) {
  const list = await stationList({ key, fetcher, cache });
  const near = list.map(s => ({ ...s, km: distKm(lat, lon, s.lat, s.lon) })).sort((a, b) => a.km - b.km).slice(0, 3);
  let lastErr = null;
  for (const s of near) { // 가까운 측정소가 점검 중이면 다음 측정소
    const ck = new Request(`https://parkgolf.internal/air/now/${encodeURIComponent(s.n)}/${Math.floor(Date.now() / 1200000)}`);
    let it = null;
    if (cache) { const hit = await cache.match(ck); if (hit) it = await hit.json(); }
    if (!it) {
      try {
        const rows = await dg(fetcher, key, 'B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty', { returnType: 'json', stationName: s.n, dataTerm: 'DAILY', ver: '1.3', numOfRows: '3' }, '미세먼지');
        it = rows.find(r => num(r.pm10Value) != null || num(r.pm25Value) != null) || null;
        if (it && cache) await cache.put(ck, new Response(JSON.stringify(it), { headers: { 'Cache-Control': 'max-age=1200' } }));
      } catch (e) { lastErr = e; continue; }
    }
    if (it) return { source: 'airkorea', station: s.n, addr: s.a, km: Math.round(s.km * 10) / 10, time: it.dataTime || '', pm10: num(it.pm10Value), pm25: num(it.pm25Value), o3: num(it.o3Value), khai: num(it.khaiGrade) };
  }
  throw lastErr || new Error('미세먼지: 가까운 측정소 자료가 없어요');
}

/* ── 중기예보 (4~10일 뒤) ─────────────────────── */
export function midBase(now = new Date()) {
  // 06시·18시 발표. 올라오기까지 여유를 두고 30분 뒤부터 사용
  const t = kstDate(now), mins = t.getUTCHours() * 60 + t.getUTCMinutes();
  if (mins >= 18 * 60 + 30) return `${ymdOf(t)}1800`;
  if (mins >= 6 * 60 + 30) return `${ymdOf(t)}0600`;
  return `${ymdOf(new Date(t.getTime() - 86400000))}1800`;
}
const prevBase = b => (b.endsWith('1800') ? `${b.slice(0, 8)}0600` : `${ymdOf(new Date(Date.UTC(+b.slice(0, 4), +b.slice(4, 6) - 1, +b.slice(6, 8)) - 86400000))}1800`);
export function wfCode(s) {
  s = String(s || '');
  if (/비\/눈|비 또는 눈|눈\/비|진눈깨비/.test(s)) return 68;
  if (/소나기/.test(s)) return 81;
  if (/눈/.test(s)) return 73;
  if (/비/.test(s)) return 63;
  if (/흐/.test(s)) return 3;
  if (/구름/.test(s)) return 102;
  if (/맑/.test(s)) return 0;
  return null;
}
export function parseMid(land, ta, tmFc) {
  const base = new Date(Date.UTC(+tmFc.slice(0, 4), +tmFc.slice(4, 6) - 1, +tmFc.slice(6, 8)));
  const days = new Map();
  const day = n => { if (!days.has(n)) { const d = new Date(base.getTime() + n * 86400000); days.set(n, { date: dash(ymdOf(d)), n }); } return days.get(n); };
  for (const [k, v] of Object.entries(land || {})) {
    const m = k.match(/^(rnSt|wf)(\d+)(Am|Pm)?$/); if (!m || v === '' || v == null) continue;
    const d = day(Number(m[2]));
    if (m[1] === 'rnSt') { const x = Number(v); if (m[3] === 'Pm') d.rnPm = x; else if (m[3] === 'Am') d.rnAm = x; else d.rnAm = d.rnPm = x; }
    else { if (m[3] === 'Pm') d.wfPm = v; else if (m[3] === 'Am') d.wfAm = v; else d.wfAm = d.wfPm = v; }
  }
  for (const [k, v] of Object.entries(ta || {})) {
    const m = k.match(/^ta(Min|Max)(\d+)$/); if (!m || v === '' || v == null) continue;
    day(Number(m[2]))[m[1] === 'Min' ? 'min' : 'max'] = Number(v);
  }
  return [...days.values()].sort((a, b) => a.n - b.n).map(d => {
    const pop = Math.max(d.rnAm != null ? d.rnAm : -1, d.rnPm != null ? d.rnPm : -1);
    const codes = [wfCode(d.wfAm), wfCode(d.wfPm)].filter(c => c != null);
    const sev = c => (c === 0 ? 0 : c === 102 ? 1 : c === 3 ? 2 : 10 + c);
    return { date: d.date, wfAm: d.wfAm || '', wfPm: d.wfPm || '', pop: pop >= 0 ? pop : null, min: d.min != null ? d.min : null, max: d.max != null ? d.max : null, code: codes.length ? codes.reduce((a, b) => (sev(b) > sev(a) ? b : a)) : null };
  }).filter(d => d.wfAm || d.wfPm || d.max != null);
}
export async function midForecast({ lat, lon, key, fetcher = fetch, cache, now = new Date() }) {
  const cities = nearCities(lat, lon);
  const city = cities[0];
  let tmFc = midBase(now);
  const ck = new Request(`https://parkgolf.internal/mid/${city.ta}/${tmFc}`);
  if (cache) { const hit = await cache.match(ck); if (hit) return hit.json(); }
  const get = async fc => Promise.all([
    dg(fetcher, key, '1360000/MidFcstInfoService/getMidLandFcst', { dataType: 'JSON', regId: city.land, tmFc: fc, numOfRows: '10' }, '중기예보'),
    dg(fetcher, key, '1360000/MidFcstInfoService/getMidTa', { dataType: 'JSON', regId: city.ta, tmFc: fc, numOfRows: '10' }, '중기기온')
  ]);
  let land, ta;
  try { [land, ta] = await get(tmFc); } catch (e) {
    if (e.code !== '03' && !/자료 없음/.test(e.message)) throw e;
    tmFc = prevBase(tmFc); // 막 발표된 자료가 아직 없으면 이전 발표
    [land, ta] = await get(tmFc);
  }
  const out = { source: 'kma-mid', city: city.name, tmFc, days: parseMid(land[0], ta[0], tmFc) };
  if (cache) await cache.put(ck, new Response(JSON.stringify(out), { headers: { 'Cache-Control': 'max-age=3600' } }));
  return out;
}

/* ── 자외선 (생활기상지수) ─────────────────────── */
export function uvBase(now = new Date()) {
  // 06시·18시 발표 → 가장 최근 발표 시각 (YYYYMMDDHH)
  const t = kstDate(now), h = t.getUTCHours();
  if (h >= 18) return `${ymdOf(t)}18`;
  if (h >= 6) return `${ymdOf(t)}06`;
  return `${ymdOf(new Date(t.getTime() - 86400000))}18`;
}
export function uvGrade(v) {
  if (v == null) return null;
  if (v >= 11) return '위험';
  if (v >= 8) return '매우 높음';
  if (v >= 6) return '높음';
  if (v >= 3) return '보통';
  return '낮음';
}
export async function uvIndex({ lat, lon, key, fetcher = fetch, cache, now = new Date() }) {
  const city = nearCities(lat, lon)[0];
  let time = uvBase(now);
  const ck = new Request(`https://parkgolf.internal/uv/${city.area}/${time}`);
  if (cache) { const hit = await cache.match(ck); if (hit) return hit.json(); }
  const ask = (area, t) => dg(fetcher, key, '1360000/LivingWthrIdxServiceV4/getUVIdxV4', { dataType: 'JSON', areaNo: area, time: t, numOfRows: '10' }, '자외선');
  let rows;
  const old = { '5100000000': '4200000000', '5200000000': '4500000000' }[city.area]; // 강원·전북 특별자치도 이전 번호
  try { rows = await ask(city.area, time); } catch (e) {
    if (old) { try { rows = await ask(old, time); } catch (e2) { /* 아래에서 다시 */ } }
    if (!rows) { time = uvBase(new Date(now.getTime() - 12 * 3600000)); rows = await ask(city.area, time); }
  }
  const it = rows[0] || {};
  const baseMs = Date.UTC(+time.slice(0, 4), +time.slice(4, 6) - 1, +time.slice(6, 8), +time.slice(8, 10)) - 9 * 3600000;
  const hours = Object.entries(it).map(([k, v]) => { const m = k.match(/^h(\d+)$/); return m && v !== '' ? { at: baseMs + Number(m[1]) * 3600000, v: Number(v) } : null; }).filter(Boolean).sort((a, b) => a.at - b.at);
  if (!hours.length) throw new Error('자외선: 자료 없음');
  const nowMs = now.getTime();
  const cur = [...hours].reverse().find(x => x.at <= nowMs) || hours[0];
  const todayYmd = ymdOf(kstDate(now));
  const todays = hours.filter(x => ymdOf(kstDate(new Date(x.at))) === todayYmd).map(x => x.v);
  const max = todays.length ? Math.max(...todays) : null;
  const out = { source: 'kma-uv', time, now: cur.v, nowGrade: uvGrade(cur.v), todayMax: max, todayGrade: uvGrade(max) };
  if (cache) await cache.put(ck, new Response(JSON.stringify(out), { headers: { 'Cache-Control': 'max-age=3600' } }));
  return out;
}

/* ── 기상특보 ─────────────────────────────── */
const SD_FULL = { 서울: ['서울'], 부산: ['부산'], 대구: ['대구'], 인천: ['인천'], 광주: ['광주'], 대전: ['대전'], 울산: ['울산'], 세종: ['세종'], 경기: ['경기'], 강원: ['강원'], 충북: ['충청북도', '충북'], 충남: ['충청남도', '충남'], 전북: ['전라북도', '전북'], 전남: ['전라남도', '전남'], 경북: ['경상북도', '경북'], 경남: ['경상남도', '경남'], 제주: ['제주'] };
/* "o 건조주의보 : 서울, 경기도(성남, 하남), 강원도(강릉시평지)" → [{ kind, groups:[{ prov, subs }] }] */
export function parseWarn(text) {
  const out = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    const m = line.match(/^\s*o?\s*([^:：]+?)\s*[:：]\s*(.+)$/);
    if (!m || !/(주의보|경보)/.test(m[1])) continue;
    const groups = []; let depth = 0, cur = '';
    for (const ch of m[2]) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { groups.push(cur); cur = ''; } else cur += ch;
    }
    if (cur.trim()) groups.push(cur);
    out.push({ kind: m[1].replace(/^o\s*/, '').trim(), groups: groups.map(g => { const mm = g.trim().match(/^([^(]+)(?:\((.*)\))?/); return { prov: (mm ? mm[1] : g).trim(), subs: mm && mm[2] ? mm[2].split(',').map(s => s.trim()).filter(Boolean) : [] }; }) });
  }
  return out;
}
const baseName = s => String(s || '').replace(/(특별자치시|특별자치도|특별시|광역시|도)$/, '').replace(/(시|군|구)$/, '');
/* 이 지역(시도·시군구)에 해당하는 특보만 고르기. 구역이 '동남권'처럼 넓게 적힌 곳은 '일부'로 표시 */
export function matchWarn(parsed, sd, sg) {
  const names = SD_FULL[sd] || (sd ? [sd] : []);
  const sgBase = baseName(sg);
  const hits = [];
  for (const w of parsed) {
    for (const g of w.groups) {
      if (!names.some(n => g.prov.startsWith(n))) continue;
      if (!g.subs.length) { hits.push({ kind: w.kind, part: false }); break; }
      const subBases = g.subs.map(s => s.replace(/(평지|산지|해안|내륙|북부|남부|동부|서부|중부)+$/, '')).map(baseName);
      if (sgBase && subBases.some(s => s && (s === sgBase || sgBase.startsWith(s) || s.startsWith(sgBase)))) { hits.push({ kind: w.kind, part: false }); break; }
      if (!sgBase || g.subs.every(s => /권|부$|산지$|평지$/.test(s) && !/[시군]/.test(s.replace(/(평지|산지)$/, '')))) { hits.push({ kind: w.kind, part: true, where: `${g.prov}(${g.subs.join(', ')})` }); break; }
    }
  }
  return hits;
}
export async function warnings({ key, fetcher = fetch, cache, sd, sg }) {
  const ck = new Request(`https://parkgolf.internal/warn/${Math.floor(Date.now() / 600000)}`);
  let raw = null;
  if (cache) { const hit = await cache.match(ck); if (hit) raw = await hit.json(); }
  if (!raw) {
    const rows = await dg(fetcher, key, '1360000/WthrWrnInfoService/getPwnStatus', { dataType: 'JSON', numOfRows: '10' }, '기상특보');
    const it = rows[0] || {};
    raw = { tmFc: String(it.tmFc || ''), now: String(it.t6 || ''), pre: String(it.t7 || '') };
    if (cache) await cache.put(ck, new Response(JSON.stringify(raw), { headers: { 'Cache-Control': 'max-age=600' } }));
  }
  return { source: 'kma-warn', tmFc: raw.tmFc, now: matchWarn(parseWarn(raw.now), sd, sg), pre: matchWarn(parseWarn(raw.pre), sd, sg) };
}

/* 위치·주소 → 시도·시군구 (주소가 없으면 가까운 도시로 시도만) */
export function areaOf(addr, lat, lon) {
  const a = String(addr || '');
  let sd = '';
  const SDK = Object.keys(SD_FULL);
  for (const k of SDK) { if (SD_FULL[k].concat([k]).some(n => a.startsWith(n) || a.includes(' ' + n))) { sd = k; break; } }
  if (!sd && /^(전라|경상|충청)/.test(a)) sd = { 전라북: '전북', 전라남: '전남', 경상북: '경북', 경상남: '경남', 충청북: '충북', 충청남: '충남' }[a.slice(0, 3)] || '';
  if (!sd && lat != null) sd = nearCities(lat, lon)[0].sd;
  const m = a.split(/\s+/).map(w => w.replace(/[(),]/g, '')).find(w => /^[가-힣]{1,6}[시군구]$/.test(w) && !/(특별|광역|자치)시$/.test(w));
  return { sd, sg: m || '' };
}

/* 한 번에: 빠진 키·승인 안 된 서비스는 그 항목만 error */
export async function extras({ lat, lon, addr, sd, sg, key, fetcher = fetch, cache, now = new Date() }) {
  const area = areaOf(addr, lat, lon);
  if (sd) area.sd = sd;
  if (sg) area.sg = sg;
  const safe = p => p.then(v => v, e => ({ error: String((e && e.message) || e) }));
  const [air, mid, uv, warn] = await Promise.all([
    safe(airNow({ lat, lon, key, fetcher, cache })),
    safe(midForecast({ lat, lon, key, fetcher, cache, now })),
    safe(uvIndex({ lat, lon, key, fetcher, cache, now })),
    safe(warnings({ key, fetcher, cache, sd: area.sd, sg: area.sg }))
  ]);
  return { area, air, mid, uv, warn };
}
