// 구글 캘린더 '비공개 iCal 주소'를 읽어서 파크골프 일정만 골라 주는 모듈
// - 반복 일정(RRULE)을 펼치고, 예외 날짜(EXDATE)·바뀐 회차(RECURRENCE-ID)를 처리
// - 결과는 한국 시간 기준 {date, time, end, title, place, memo}
const MS_DAY = 86400000;
const KST = 9 * 3600000;
const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export const DEFAULT_KEYWORDS = ['파크골프', '파크', '골프', '파골', '대회', '라운딩'];

/* ── 읽기 ─────────────────────────────────────── */
const unesc = s => String(s || '').replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');

export function parseIcs(text) {
  const lines = String(text).replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
  const events = []; let cur = null; let calName = ''; let inAlarm = false;
  for (const line of lines) {
    if (line === 'BEGIN:VALARM') { inAlarm = true; continue; }   // 알림 안의 글('This is an event reminder' 등)은 일정 내용이 아님
    if (line === 'END:VALARM') { inAlarm = false; continue; }
    if (inAlarm) continue;
    if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (line === 'END:VEVENT') { if (cur) events.push(cur); cur = null; continue; }
    const i = line.indexOf(':'); if (i < 0) continue;
    const head = line.slice(0, i).split(';'), name = head[0].toUpperCase(), value = line.slice(i + 1);
    if (!cur) { if (name === 'X-WR-CALNAME') calName = unesc(value); continue; }
    const params = {};
    for (const p of head.slice(1)) { const [k, v] = p.split('='); if (k) params[k.toUpperCase()] = (v || '').replace(/^"|"$/g, ''); }
    (cur[name] = cur[name] || []).push({ params, value });
  }
  return { events, calName };
}

/* 20261121T090000Z / 20261121T090000 (+TZID) / 20261121 (종일) */
function parseDt(prop) {
  if (!prop) return null;
  const m = String(prop.value).match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const allDay = !m[4] || prop.params.VALUE === 'DATE';
  return { y: +m[1], mo: +m[2], d: +m[3], h: allDay ? 0 : +m[4], mi: allDay ? 0 : +m[5], allDay, tz: m[7] ? 'UTC' : (prop.params.TZID || 'Asia/Seoul') };
}

const fmtCache = {};
function tzOffsetMs(tz, utcMs) {
  if (tz === 'UTC') return 0;
  if (tz === 'Asia/Seoul') return KST;
  try {
    const f = fmtCache[tz] || (fmtCache[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const p = Object.fromEntries(f.formatToParts(new Date(utcMs)).map(x => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(utcMs / 1000) * 1000;
  } catch (e) { return KST; }
}
function toUtc(y, mo, d, h, mi, tz) {
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  if (tz === 'UTC') return wall;
  let u = wall - tzOffsetMs(tz, wall);
  u = wall - tzOffsetMs(tz, u);
  return u;
}
const kstParts = utc => { const k = new Date(utc + KST); return { date: `${k.getUTCFullYear()}-${String(k.getUTCMonth() + 1).padStart(2, '0')}-${String(k.getUTCDate()).padStart(2, '0')}`, time: `${String(k.getUTCHours()).padStart(2, '0')}:${String(k.getUTCMinutes()).padStart(2, '0')}` }; };

/* ── 반복 규칙 ───────────────────────────────── */
function parseRule(s) {
  const r = {};
  for (const kv of String(s).split(';')) { const [k, v] = kv.split('='); if (k) r[k.toUpperCase()] = v; }
  r.INTERVAL = Math.max(1, Number(r.INTERVAL) || 1);
  r.COUNT = r.COUNT ? Number(r.COUNT) : null;
  r.BYDAY = r.BYDAY ? r.BYDAY.split(',').map(x => { const m = x.match(/^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/); return m ? { n: m[1] ? Number(m[1]) : 0, d: DAY_CODES.indexOf(m[2]) } : null; }).filter(Boolean) : [];
  r.BYMONTHDAY = r.BYMONTHDAY ? r.BYMONTHDAY.split(',').map(Number) : [];
  r.BYMONTH = r.BYMONTH ? r.BYMONTH.split(',').map(Number) : [];
  return r;
}
const dowOf = (y, mo, d) => new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
const daysIn = (y, mo) => new Date(Date.UTC(y, mo, 0)).getUTCDate();
const nthWeekday = (y, mo, n, dow) => { // n>0: n번째, n<0: 끝에서 n번째
  const last = daysIn(y, mo); const days = [];
  for (let d = 1; d <= last; d++) if (dowOf(y, mo, d) === dow) days.push(d);
  return n > 0 ? days[n - 1] : days[days.length + n];
};

/* 반복 일정의 '달력상 날짜' 목록 (시각은 시작 일정의 시각을 그대로) */
function* walls(start, rule, endWallMs) {
  const base = Date.UTC(start.y, start.mo - 1, start.d);
  const push = (y, mo, d) => Date.UTC(y, mo - 1, d);
  const f = rule.FREQ;
  let guard = 0;
  if (f === 'DAILY') {
    for (let t = base; t <= endWallMs && guard++ < 5000; t += rule.INTERVAL * MS_DAY) {
      const dt = new Date(t);
      if (rule.BYDAY.length && !rule.BYDAY.some(b => b.d === dt.getUTCDay())) continue;
      yield t;
    }
  } else if (f === 'WEEKLY') {
    const days = rule.BYDAY.length ? rule.BYDAY.map(b => b.d) : [new Date(base).getUTCDay()];
    const wkst = rule.WKST ? DAY_CODES.indexOf(rule.WKST) : 1;
    const startOfWeek = t => t - ((new Date(t).getUTCDay() - wkst + 7) % 7) * MS_DAY;
    for (let w = startOfWeek(base); w <= endWallMs && guard++ < 1500; w += rule.INTERVAL * 7 * MS_DAY) {
      for (const d of [...days].sort((a, b) => ((a - wkst + 7) % 7) - ((b - wkst + 7) % 7))) {
        const t = w + ((d - wkst + 7) % 7) * MS_DAY;
        if (t >= base && t <= endWallMs) yield t;
      }
    }
  } else if (f === 'MONTHLY') {
    for (let k = 0; guard++ < 600; k += rule.INTERVAL) {
      const y = start.y + Math.floor((start.mo - 1 + k) / 12), mo = ((start.mo - 1 + k) % 12) + 1;
      if (push(y, mo, 1) > endWallMs) break;
      const list = [];
      if (rule.BYDAY.length) for (const b of rule.BYDAY) {
        if (b.n) { const d = nthWeekday(y, mo, b.n, b.d); if (d) list.push(d); }
        else for (let d = 1; d <= daysIn(y, mo); d++) if (dowOf(y, mo, d) === b.d) list.push(d);
      } else if (rule.BYMONTHDAY.length) for (const d of rule.BYMONTHDAY) list.push(d > 0 ? d : daysIn(y, mo) + d + 1);
      else list.push(start.d);
      for (const d of list.sort((a, b) => a - b)) if (d >= 1 && d <= daysIn(y, mo)) { const t = push(y, mo, d); if (t >= base && t <= endWallMs) yield t; }
    }
  } else if (f === 'YEARLY') {
    for (let k = 0; guard++ < 100; k += rule.INTERVAL) {
      const y = start.y + k, mo = rule.BYMONTH.length ? rule.BYMONTH[0] : start.mo;
      if (push(y, 1, 1) > endWallMs) break;
      let d = start.d;
      if (rule.BYDAY.length && rule.BYDAY[0].n) d = nthWeekday(y, mo, rule.BYDAY[0].n, rule.BYDAY[0].d);
      else if (rule.BYMONTHDAY.length) d = rule.BYMONTHDAY[0];
      if (d && d <= daysIn(y, mo)) { const t = push(y, mo, d); if (t >= base && t <= endWallMs) yield t; }
    }
  }
}

/* ── 일정 → 창(기간) 안의 모든 회차 ─────────────── */
export function expandEvents(events, fromMs, toMs) {
  const out = [];
  const overridden = new Set();
  for (const e of events) { // 바뀐 회차 표시
    const rid = parseDt(e['RECURRENCE-ID'] && e['RECURRENCE-ID'][0]), uid = e.UID && e.UID[0].value;
    if (rid && uid) overridden.add(uid + '|' + (rid.allDay ? `${rid.y}-${rid.mo}-${rid.d}` : toUtc(rid.y, rid.mo, rid.d, rid.h, rid.mi, rid.tz)));
  }
  for (const e of events) {
    if (e.STATUS && /CANCELLED/i.test(e.STATUS[0].value)) continue;
    const s = parseDt(e.DTSTART && e.DTSTART[0]); if (!s) continue;
    const eEnd = parseDt(e.DTEND && e.DTEND[0]);
    const uid = (e.UID && e.UID[0].value) || '';
    const title = unesc(e.SUMMARY && e.SUMMARY[0].value) || '(제목 없음)';
    const place = unesc(e.LOCATION && e.LOCATION[0].value);
    const memo = unesc(e.DESCRIPTION && e.DESCRIPTION[0].value).slice(0, 300);
    const startUtc0 = s.allDay ? Date.UTC(s.y, s.mo - 1, s.d) : toUtc(s.y, s.mo, s.d, s.h, s.mi, s.tz);
    let durMs = s.allDay ? MS_DAY : 0;
    if (eEnd) durMs = (eEnd.allDay ? Date.UTC(eEnd.y, eEnd.mo - 1, eEnd.d) : toUtc(eEnd.y, eEnd.mo, eEnd.d, eEnd.h, eEnd.mi, eEnd.tz)) - startUtc0;
    else if (e.DURATION) { const m = e.DURATION[0].value.match(/P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?/); if (m) durMs = ((+m[1] || 0) * 24 * 60 + (+m[2] || 0) * 60 + (+m[3] || 0)) * 60000; }
    if (durMs < 0) durMs = 0;

    const instances = [];
    const rr = e.RRULE && e.RRULE[0] && parseRule(e.RRULE[0].value);
    if (rr && rr.FREQ && !e['RECURRENCE-ID']) {
      const ex = new Set();
      for (const x of e.EXDATE || []) for (const v of String(x.value).split(',')) {
        const d = parseDt({ params: x.params, value: v });
        if (d) ex.add(d.allDay ? `${d.y}-${d.mo}-${d.d}` : toUtc(d.y, d.mo, d.d, d.h, d.mi, d.tz));
      }
      let until = Infinity;
      if (rr.UNTIL) { const u = parseDt({ params: {}, value: rr.UNTIL }); if (u) until = u.allDay ? Date.UTC(u.y, u.mo - 1, u.d) + MS_DAY - 1 : toUtc(u.y, u.mo, u.d, u.h, u.mi, u.tz); }
      const endWall = Math.min(toMs + 2 * MS_DAY + (s.tz === 'UTC' ? 0 : 0), Number.isFinite(until) ? until + 2 * MS_DAY : Infinity);
      let n = 0;
      for (const wall of walls(s, rr, endWall)) {
        const w = new Date(wall);
        const startUtc = s.allDay ? wall : toUtc(w.getUTCFullYear(), w.getUTCMonth() + 1, w.getUTCDate(), s.h, s.mi, s.tz);
        if (startUtc > until) break;
        n++;
        if (rr.COUNT && n > rr.COUNT) break;
        const key = s.allDay ? `${w.getUTCFullYear()}-${w.getUTCMonth() + 1}-${w.getUTCDate()}` : startUtc;
        if (ex.has(key) || overridden.has(uid + '|' + key)) continue;
        instances.push(startUtc);
      }
    } else instances.push(startUtc0);

    for (const st of instances) {
      const endUtc = st + durMs;
      if (endUtc < fromMs || st > toMs) continue;
      const a = s.allDay ? { date: new Date(st).toISOString().slice(0, 10), time: '' } : kstParts(st);
      const b = s.allDay ? null : kstParts(endUtc);
      out.push({ uid, title, date: a.date, time: a.time, end: b && b.date === a.date && b.time !== a.time ? b.time : '', allDay: s.allDay, place, memo, repeat: !!rr });
    }
  }
  return out.sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time));
}

export function filterEvents(list, keywords) {
  const kws = (keywords && keywords.length ? keywords : DEFAULT_KEYWORDS).map(k => String(k).trim().toLowerCase()).filter(Boolean);
  return list.filter(e => { const hay = `${e.title} ${e.place} ${e.memo}`.toLowerCase(); return kws.some(k => hay.includes(k)); });
}

/* 한국 시간으로 오늘 0시(ms) */
export const kstToday = (now = Date.now()) => Math.floor((now + KST) / MS_DAY) * MS_DAY - KST;

export function readCalendar(text, { keywords, days = 365, now = Date.now(), back = 1 } = {}) {
  if (!/BEGIN:VCALENDAR/.test(String(text))) throw new Error('캘린더 형식이 아니에요');
  const { events, calName } = parseIcs(text);
  const from = kstToday(now) - back * MS_DAY, to = from + (back + Math.min(days, 730)) * MS_DAY;
  const all = expandEvents(events, from, to);
  const matched = filterEvents(all, keywords);
  return { calName, scanned: events.length, inRange: all.length, matched: matched.length, events: matched.slice(0, 300) };
}

/* 구글 캘린더 주소만 허용 (서버가 아무 주소나 대신 열어 주지 않도록) */
export function checkCalendarUrl(raw) {
  let u;
  try { u = new URL(String(raw).trim().replace(/^webcal:/i, 'https:')); } catch (e) { return null; }
  if (u.protocol !== 'https:' || u.hostname !== 'calendar.google.com' || !u.pathname.startsWith('/calendar/ical/') || u.port) return null;
  return u.toString();
}
