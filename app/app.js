/* 파크골프 수첩 — 화면 */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const app = $('#app');

  /* ── 아이콘 (선 모양, 글자색을 따라감) ───────────── */
  const ICONS = {"trash": "<path d=\"M4 7h16\"/><path d=\"M10 11v6M14 11v6\"/><path d=\"M6 7l1 13h10l1-13\"/><path d=\"M9 7V4h6v3\"/>", "home": "<path d=\"M3 11l9-8 9 8\"/><path d=\"M5 10v10h14V10\"/><path d=\"M10 20v-6h4v6\"/>", "note": "<rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"3\"/><path d=\"M9 8h6M9 12h6M9 16h3\"/>", "coin": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9.5 9.5c.4-1 1.4-1.5 2.5-1.5 1.5 0 2.5.8 2.5 1.8 0 2.4-5 1.2-5 4 0 1 1 1.8 2.5 1.8 1.1 0 2.1-.5 2.5-1.5\"/><path d=\"M12 6.5V8m0 8v1.5\"/>", "flag": "<path d=\"M6 21V4\"/><path d=\"M6 5h12l-3 4 3 4H6\"/>", "cal": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"3\"/><path d=\"M3 10h18M8 3v4M16 3v4\"/>", "chart": "<path d=\"M4 20v-9M10 20V4M16 20v-6M21 20H3\"/>", "bag": "<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"3\"/><path d=\"m8.5 12 2.5 2.5 4.5-5\"/>", "run": "<circle cx=\"12\" cy=\"5\" r=\"2.2\"/><path d=\"M12 8v5m-5-3 5-2 5 2M9.5 21 12 13l2.5 8\"/>", "sliders": "<path d=\"M4 7h9M17 7h3M4 17h3M11 17h9\"/><circle cx=\"15\" cy=\"7\" r=\"2\"/><circle cx=\"9\" cy=\"17\" r=\"2\"/>", "cloud": "<circle cx=\"8.5\" cy=\"8.5\" r=\"3.2\"/><path d=\"M8.5 2.5V4M2.5 8.5H4M4.3 4.3l1 1M12.7 4.3l-1 1\"/><path d=\"M8 20h9a4 4 0 0 0 .5-7.97A5 5 0 0 0 8.2 12 4 4 0 0 0 8 20z\"/>", "trophy": "<path d=\"M8 4h8v6a4 4 0 0 1-8 0z\"/><path d=\"M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4\"/><path d=\"M12 14v4M8 21h8M9.5 18h5\"/>", "clock": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>", "star": "<path d=\"m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z\"/>", "check": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m8 12.5 3 3 5-6\"/>", "plus": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 8v8M8 12h8\"/>", "pin": "<path d=\"M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z\"/><circle cx=\"12\" cy=\"9.5\" r=\"2.5\"/>", "smile": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M8.5 14c1 1.5 2.2 2.2 3.5 2.2s2.5-.7 3.5-2.2M9 9.5h.01M15 9.5h.01\"/>", "alert": "<path d=\"M12 3 2.5 20h19z\"/><path d=\"M12 10v4M12 17.2h.01\"/>", "stop": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m9 9 6 6M15 9l-6 6\"/>", "users": "<circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6\"/><circle cx=\"17\" cy=\"9\" r=\"2.4\"/><path d=\"M17 14c2.5 0 4 2 4 5\"/>", "back": "<path d=\"m15 5-7 7 7 7\"/>"};
  const I = (n, cls) => `<svg class="i${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  /* ── 저장소 ─────────────────────────────────────── */
  const KEY = 'parkgolf.v1';
  const blank = () => ({ courses: [], rounds: [], bets: [], events: [], players: [], settings: { name: '', size: 'big', theme: 'auto', alarms: ['1d', '2h'], server: { url: '', pass: '' }, cal: { url: '', keywords: '파크골프, 파크, 골프, 대회' } }, calCache: null, checklist: { date: '', checked: {} }, aiOverall: null });
  const JUNK_MEMO = /^\s*this is an event reminder\.?\s*$/i; // 알림 기본 문구가 메모로 잘못 들어간 것
  let betSel = null; // 내기 목록에서 '삭제'를 눌렀을 때 고른 내기 (null: 고르는 중 아님)
  let db = load();
  (db.events || []).forEach(e => { if (JUNK_MEMO.test(e.memo || '')) e.memo = ''; });
  if (db.calCache) db.calCache = null; // 예전 캐시에 잘못된 메모가 있을 수 있어 새로 받음
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) return Object.assign(blank(), s, { settings: Object.assign(blank().settings, s.settings || {}) }); } catch (e) { /* 처음 */ }
    return blank();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('저장 공간이 부족해요. 백업 후 오래된 기록을 지워 주세요.'); } }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const byId = (arr, id) => arr.find(x => x.id === id);
  const course = id => byId(db.courses, id);

  /* ── 도우미 ─────────────────────────────────────── */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  const today = () => WX.ymd(new Date());
  function fmtDate(s, withYear) {
    if (!s) return '';
    const d = new Date(s + 'T00:00:00');
    const y = d.getFullYear() !== new Date().getFullYear() || withYear ? `${d.getFullYear()}년 ` : '';
    return `${y}${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`;
  }
  function fmtTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ap = h < 12 ? '오전' : '오후'; const hh = h % 12 === 0 ? 12 : h % 12;
    return `${ap} ${hh}시${m ? ' ' + m + '분' : ''}`;
  }
  function dday(s) {
    const a = new Date(today() + 'T00:00:00'), b = new Date(s + 'T00:00:00');
    const n = Math.round((b - a) / 86400000);
    return n === 0 ? '오늘' : n > 0 ? `D-${n}` : `${-n}일 전`;
  }
  const won = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(Math.round(n)).toLocaleString('ko-KR') + '원';
  const wonPlain = n => Math.abs(Math.round(n)).toLocaleString('ko-KR') + '원';
  const diffTag = d => `<span class="tag ${d < 0 ? 'good' : d === 0 ? 'info' : d >= 5 ? 'bad' : 'plain'}">${PG.sign(d)}</span>`;

  function toast(msg, ms) {
    document.querySelectorAll('.toast').forEach(x => x.remove());
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), ms || 2600);
  }
  function modal(html, onReady) {
    return new Promise(resolve => {
      const back = document.createElement('div'); back.className = 'modal-back';
      back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
      document.body.appendChild(back);
      const close = v => { back.remove(); resolve(v); };
      back.addEventListener('click', e => {
        if (e.target === back) return close(null);
        const b = e.target.closest('[data-res]'); if (b) close(b.dataset.res);
      });
      if (onReady) onReady(back, close);
    });
  }
  const ask = (title, msg, yes, danger) => modal(`<h2>${esc(title)}</h2><p>${esc(msg)}</p><div class="btn-row"><button class="btn ghost" data-res="no">아니요</button><button class="btn ${danger ? 'danger' : 'primary'}" data-res="yes">${esc(yes || '네')}</button></div>`).then(v => v === 'yes');

  /* 소리로 읽어 주기 */
  function speak(text) {
    if (!('speechSynthesis' in window)) return toast('이 휴대폰은 소리 읽기를 지원하지 않아요');
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
    const u = new SpeechSynthesisUtterance(text.replace(/[▲▼★☆•·]/g, ' ').replace(/\+(\d)/g, '플러스 $1').replace(/−|(?<=\s)-(\d)/g, '마이너스 $1'));
    u.lang = 'ko-KR'; u.rate = 0.9; speechSynthesis.speak(u);
  }
  async function shareText(title, text) {
    try { if (navigator.share) { await navigator.share({ title, text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); toast('글을 복사했어요. 카카오톡에 붙여 넣으세요.'); }
    catch (e) { modal(`<h2>아래 글을 길게 눌러 복사하세요</h2><textarea readonly style="min-height:240px">${esc(text)}</textarea><button class="btn primary block" data-res="ok">닫기</button>`); }
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  /* ── 연결 서버 (기상청 날씨·AI 코치) ─────────────── */
  // 기본 서버: 할머니가 따로 넣지 않아도 기상청 날씨가 나오게. 설정에서 바꾸거나 '연결 끊기'(off)로 끌 수 있음.
  const DEFAULT_SERVER = 'https://parkgolf-server.ssea3030g.workers.dev';
  const srvUrl = () => { const sv = db.settings.server || {}; return sv.url || (sv.off ? '' : DEFAULT_SERVER); };
  const srvOn = () => !!srvUrl();
  const aiOn = () => srvOn() && db.settings.server.ai !== false; // 서버에 AI 키가 없으면 AI 버튼 숨김
  async function srv(path, opts = {}) {
    const s = db.settings.server || {};
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), opts.timeout || 20000);
    try {
      const headers = { 'X-App-Pass': encodeURIComponent(s.pass || '') };
      if (opts.body) headers['Content-Type'] = 'application/json';
      const r = await fetch(srvUrl().replace(/\/+$/, '') + path, { method: opts.body ? 'POST' : 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined, signal: ctrl.signal });
      let j = null; try { j = await r.json(); } catch (e) { /* 빈 응답 */ }
      if (!r.ok) throw new Error((j && j.error) || `서버 오류 (${r.status})`);
      return j;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('서버가 너무 오래 대답하지 않아요. 잠시 뒤 다시 해 주세요.');
      if (e instanceof TypeError) throw new Error('서버에 연결하지 못했어요. 인터넷과 서버 주소를 확인해 주세요.');
      throw e;
    } finally { clearTimeout(tm); }
  }

  /* ── 구글(삼성) 캘린더 자동 연결: 서버가 비공개 iCal 주소를 대신 읽어 파크골프 일정만 돌려줌 ── */
  const calOn = () => srvOn() && !!(db.settings.cal && db.settings.cal.url);
  const calKeywords = () => String((db.settings.cal && db.settings.cal.keywords) || '').split(/[,，\s]+/).map(x => x.trim()).filter(Boolean);
  async function syncCal(force) {
    if (!calOn()) return null;
    const c = db.calCache;
    if (!force && c && Date.now() - c.at < 15 * 60000) return c;
    const j = await srv('/calendar', { body: { url: db.settings.cal.url, keywords: calKeywords(), days: 365 }, timeout: 30000 });
    db.calCache = { at: Date.now(), name: j.calName || '', scanned: j.scanned, events: j.events || [] };
    save(); return db.calCache;
  }
  const normTitle = t => String(t || '').replace(/^⛳\s*/, '').replace(/\s+/g, '');
  /* 내가 앱에서 만든 일정 + 캘린더에서 가져온 일정 (같은 제목·날짜는 하나로) */
  function allEvents() {
    const mine = db.events.map(e => Object.assign({}, e));
    const seen = new Set(mine.map(e => normTitle(e.title) + '|' + e.date));
    const fromCal = ((calOn() && db.calCache && db.calCache.events) || []).filter(e => !seen.has(normTitle(e.title) + '|' + e.date)).map((e, i) => ({
      id: 'cal' + i + e.date, cal: true, type: /대회/.test(e.title) ? '대회' : /모임|동호회|월례/.test(e.title) ? '모임' : '연습',
      title: e.title.replace(/^⛳\s*/, ''), date: e.date, time: e.time || '', end: e.end || '', place: e.place || '', memo: JUNK_MEMO.test(e.memo || '') ? '' : (e.memo || ''), repeat: e.repeat
    }));
    return [...mine, ...fromCal];
  }
  /* 일정 제목·장소에 골프장 이름이 들어 있으면 그 골프장으로 들어가는 버튼 (내 골프장 먼저, 없으면 전국 목록에서) */
  const nrmS = x => String(x || '').replace(/[^가-힣A-Za-z0-9]/g, '').toLowerCase();
  const coreS = x => nrmS(x).replace(/파크골프장|파크골프|골프장|구장/g, '');
  const NAME_STOP = new Set(['한강', '생태', '체육', '시민', '근린', '강변', '하천', '공원', '제1', '제2', '시립', '구립', '군립']);
  function nameKeys(name) { // 골프장 이름에서 일정에 쓰일 만한 낱말들: 전체 이름, 그리고 낱말별 ('한강 반포 파크골프장' → 한강반포, 반포)
    const keys = new Set(); const full = coreS(name); if (full.length >= 2) keys.add(full);
    for (const t of String(name || '').split(/[\s()\[\]·,_\-]+/)) { for (const k of [coreS(t), coreS(t).replace(/공원$/, '')]) if (k.length >= 2 && !NAME_STOP.has(k)) keys.add(k); }
    return [...keys];
  }
  function courseFor(e) {
    const text = nrmS((e.title || '') + ' ' + (e.place || ''));
    if (e.courseId && course(e.courseId)) return { mine: course(e.courseId) };
    let best = null, bs = 0;
    const consider = (kind, c, name) => {
      // 내 골프장은 이름의 일부(2글자 이상)만 있어도, 전국 목록은 3글자 이상이거나 전체 이름일 때만 (엉뚱한 곳으로 안 가게)
      const full = coreS(name);
      const hit = nameKeys(name).filter(k => text.includes(k) && (kind === 'mine' ? k.length >= 2 : (k.length >= 3 || k === full)));
      if (!hit.length) return;
      const sc = Math.max(...hit.map(k => k.length)) + (kind === 'mine' ? 100 : 0);
      if (sc > bs) { bs = sc; best = { [kind]: c }; }
    };
    db.courses.forEach(c => consider('mine', c, c.name));
    if (GL && GL.items) GL.items.forEach(x => consider('item', x, x.n));
    return best;
  }
  function courseBtn(e) {
    const m = courseFor(e); if (!m) return '';
    return m.mine ? `<a class="btn block" href="#course-${m.mine.id}" style="margin-bottom:10px">${I('flag')} ${esc(m.mine.name)} 보기</a>`
      : `<button type="button" class="btn block" data-act="ev-course" data-i="${m.item.i}" style="margin-bottom:10px">${I('flag')} ${esc(m.item.n)} 보기</button>`;
  }
  const byWhen = (a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''));
  const agoText = at => { const m = Math.round((Date.now() - at) / 60000); return m < 1 ? '방금' : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.round(m / 60)}시간 전` : `${Math.round(m / 1440)}일 전`; };

  /* ── 화면 설정 ──────────────────────────────────── */
  function applySettings() {
    const r = document.documentElement;
    r.dataset.size = db.settings.size || 'big';
    if (db.settings.theme === 'auto') delete r.dataset.theme; else r.dataset.theme = db.settings.theme;
  }

  /* ── 라우터 ─────────────────────────────────────── */
  const views = {};
  const parents = { rounds: 'home', analysis: 'rounds', 'round-new': 'rounds', bets: 'home', 'bet-new': 'bets', courses: 'home', 'course-new': 'courses', schedule: 'home', 'event-new': 'schedule', more: 'home', checklist: 'home', stretch: 'home' };
  function parse() {
    const h = (location.hash || '#home').slice(1);
    const m = h.match(/^([a-z]+(?:-(?:new|edit|play))?)(?:-([a-z0-9]+))?$/);
    if (!m) return { name: 'home' };
    return { name: m[1], id: m[2] };
  }
  function go(h) { if (location.hash === '#' + h) render(); else location.hash = h; }
  function render() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    const r = parse();
    if (r.name !== 'bets') betSel = null; // 다른 화면으로 가면 고르기 끝
    const v = views[r.name] || views.home;
    let out;
    try { out = v(r.id) || {}; } catch (e) { console.error(e); out = { title: '오류', html: `<div class="note bad"><b>화면을 여는 중 문제가 생겼어요</b>${esc(e.message)}</div>` }; }
    $('#title').textContent = out.title || '파크골프 수첩';
    document.title = (out.title ? out.title + ' · ' : '') + '파크골프 수첩';
    app.innerHTML = out.html || '';
    const tab = out.tab || r.name.split('-')[0].replace(/^(round|analysis)$/, 'rounds').replace(/^bet$/, 'bets').replace(/^course$/, 'courses').replace(/^event$/, 'schedule');
    document.querySelectorAll('.tabbar a').forEach(a => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const back = out.back !== undefined ? out.back : (r.name === 'home' ? null : (parents[r.name] || (r.name.includes('-') ? r.name.split('-')[0] + 's' : 'home')));
    const bb = $('#backBtn'); bb.hidden = !back; bb.dataset.to = back || '';
    window.scrollTo(0, 0);
    if (out.after) out.after();
  }
  $('#backBtn').addEventListener('click', e => go(e.currentTarget.dataset.to || 'home'));
  window.addEventListener('hashchange', render);

  /* 클릭 처리: data-act="이름" */
  const acts = {};
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const fn = acts[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('submit', e => e.preventDefault());

  /* ── 날씨 캐시 ──────────────────────────────────── */
  const wxCache = {};
  async function courseNow(c) {
    if (!c || c.lat == null) return null;
    const k = c.lat.toFixed(3) + ',' + c.lon.toFixed(3);
    const hit = wxCache[k];
    if (hit && Date.now() - hit.at < 10 * 60000) return hit.data;
    let kmaErr = '';
    const [om, omAq, kma, ex] = await Promise.all([
      WX.nowWeather(c.lat, c.lon).catch(() => null),
      WX.airQuality(c.lat, c.lon).catch(() => null),
      srvOn() ? srv(`/weather?lat=${c.lat}&lon=${c.lon}`).catch(e => { kmaErr = e.message || '알 수 없는 오류'; return null; }) : null,
      srvOn() ? srv(`/extra?lat=${c.lat}&lon=${c.lon}&addr=${encodeURIComponent(c.address || '')}`).catch(() => null) : null
    ]);
    const w = WX.mergeKma(om, kma);
    if (!w) throw new Error('날씨 없음');
    const ok = x => (x && !x.error ? x : null);
    const air = ok(ex && ex.air);
    // 미세먼지: 에어코리아 측정소 값이 있으면 그것, 없으면 Open-Meteo
    const aq = air && (air.pm10 != null || air.pm25 != null) ? { source: 'airkorea', station: air.station, time: air.time, current: { pm10: air.pm10, pm2_5: air.pm25 } } : omAq;
    const extra = { mid: ok(ex && ex.mid), uv: ok(ex && ex.uv), warn: ok(ex && ex.warn) };
    const data = { w, aq, kmaErr, extra, status: WX.assessStatus(c, w, aq, null, extra) };
    wxCache[k] = { at: Date.now(), data };
    return data;
  }

  /* ════════════════ 처음 화면 ════════════════ */
  views.home = () => {
    const name = db.settings.name;
    const h = new Date().getHours();
    const hello = h < 11 ? '좋은 아침이에요' : h < 17 ? '안녕하세요' : '편안한 저녁 되세요';
    const ups = allEvents().filter(e => e.date >= today()).sort(byWhen).slice(0, 3);
    const fav = db.courses.find(c => c.fav) || db.courses[0];
    const last = [...db.rounds].sort((a, b) => b.date.localeCompare(a.date))[0];
    // 오늘 일정이 있으면 그 일정의 골프장(제목·장소에서 찾음) 날씨, 없으면 자주 가는 곳
    const todayEvs = allEvents().filter(e => e.date === today()).sort(byWhen);
    let wxTarget = null, wxWhy = '';
    for (const e of todayEvs) { const m = courseFor(e); if (m) { wxTarget = m.mine ? { c: m.mine, mine: true } : { c: listToCourse(m.item), item: m.item }; wxWhy = `오늘 일정: ${e.title}${e.time ? ' ' + fmtTime(e.time) : ''}`; break; } }
    if (!wxTarget && fav) { wxTarget = { c: fav, mine: true }; wxWhy = todayEvs.length ? `오늘 일정(${todayEvs[0].title})의 장소를 찾지 못해 자주 가는 곳 날씨예요` : '오늘 일정이 없어서 자주 가는 곳 날씨예요'; }
    let html = `<section class="card hero"><p class="big" style="margin:0">${name ? esc(name) + '님, ' : ''}${hello}</p><p class="muted" style="margin:4px 0 0">${fmtDate(today(), true)}</p>`;
    if (!name) html += `<hr><p>이름을 알려 주시면 내기 정산에 '나'로 표시돼요.</p><a class="btn block" href="#more">이름 넣기</a>`;
    html += `</section>`;
    html += `<section class="card"><div class="row" style="justify-content:space-between;flex-wrap:nowrap;margin-bottom:6px"><h2 style="margin:0">다가오는 일정</h2><a href="#schedule" style="font-weight:800;white-space:nowrap">모두 보기</a></div>${ups.length
      ? ups.map(e => `<a class="ev-row" href="#schedule"><span class="dday">${dday(e.date)}</span><span class="ev-main"><span class="ev-title">${esc(e.title)}</span><span class="ev-sub">${fmtDate(e.date)}${e.time ? ' ' + fmtTime(e.time) : ''}${e.place ? ' · ' + esc(e.place) : ''}</span></span></a>`).join('')
      : `<p class="muted" style="margin:8px 0 12px">다가오는 일정이 없어요.</p><a class="btn block" href="#event-new">일정 추가하기</a>`}</section>`;
    html += `<div class="menu-grid" style="margin-bottom:14px">
      <a href="#round-new"><span class="ico">${I('note')}</span>성적 기록하기</a>
      <a href="#bet-new"><span class="ico">${I('coin')}</span>내기 시작</a>
      <a href="#courses"><span class="ico">${I('cloud')}</span>골프장 날씨</a>
      <a href="#event-new"><span class="ico">${I('cal')}</span>일정 추가</a>
      <a href="#analysis"><span class="ico">${I('chart')}</span>나의 분석</a>
      <a href="#checklist"><span class="ico">${I('bag')}</span>준비물 챙기기</a>
      <a href="#stretch"><span class="ico">${I('run')}</span>몸풀기 체조</a>
      <a href="#more"><span class="ico">${I('sliders')}</span>설정·백업</a>
    </div>`;
    if (wxTarget) html += `<section class="card"><h2>${esc(wxTarget.c.name)} ${todayEvs.length && wxWhy.startsWith('오늘 일정:') ? '오늘 날씨' : '지금'}</h2><p class="muted small" style="margin-top:-6px">${esc(wxWhy)}</p><div id="homeWx"><p class="muted"><span class="spinner"></span> 날씨를 불러오는 중…</p></div>${wxTarget.mine ? `<a class="btn block" href="#course-${wxTarget.c.id}">자세히 보기</a>` : `<button type="button" class="btn block" data-act="ev-course" data-i="${wxTarget.item.i}">골프장 정보 보기</button>`}</section>`;
    else html += `<section class="card"><h2>오늘 날씨</h2><p class="muted" style="margin:0 0 12px">골프장을 하나 추가하면 오늘 갈 곳의 날씨를 여기서 볼 수 있어요.</p><a class="btn block" href="#courses">골프장 찾기</a></section>`;
    if (last) {
      const t = PG.roundTotals(last);
      html += `<h2 class="section-title">최근 기록</h2><ul class="list"><li><a href="#round-${last.id}"><span class="ico">${I(last.kind === '대회' ? 'trophy' : 'flag')}</span><span class="main"><span class="title">${esc(last.title || last.courseName || '경기')}</span><span class="sub">${fmtDate(last.date)} · ${esc(last.courseName || '')}</span></span><span class="right">${t.strokes}타<br>${diffTag(t.diff)}</span></a></li></ul>`;
    }
    return {
      title: '파크골프 수첩', html, back: null,
      after: () => { if (wxTarget) loadMiniWx(wxTarget.c, $('#homeWx')); { const had = GL !== null; loadGL().then(() => { if (!had && parse().name === 'home') render(); }); } if (calOn()) { const before = db.calCache && db.calCache.at; syncCal().then(c => { if (c && c.at !== before && parse().name === 'home') render(); }).catch(() => {}); } }
    };
  };

  async function loadMiniWx(c, box) {
    if (!box) return;
    if (c.lat == null) { box.innerHTML = `<p class="muted">위치 정보가 없어 날씨를 볼 수 없어요. 골프장 수정에서 '위치 찾기'를 눌러 주세요.</p>`; return; }
    try {
      const d = await courseNow(c);
      const cur = d.w.current;
      box.innerHTML = `<div class="status-big ${['good', 'warn', 'bad'][d.status.level]}"><span class="ico">${I(['smile', 'alert', 'stop'][d.status.level])}</span><div><div class="t">${d.status.label}</div><div class="d">${esc(d.status.reasons[0])}</div></div></div>
        <div class="wx"><div><span class="k">날씨</span><span class="v">${WX.wxIcon(cur.weather_code)} ${WX.wxName(cur.weather_code)}</span></div><div><span class="k">기온</span><span class="v">${Math.round(cur.temperature_2m)}℃</span></div></div>`;
    } catch (e) { box.innerHTML = `<p class="muted">인터넷이 연결되지 않아 날씨를 불러오지 못했어요.</p>`; }
  }

  /* ════════════════ 성적 ════════════════ */
  views.rounds = () => {
    const rs = [...db.rounds].sort((a, b) => b.date.localeCompare(a.date));
    let html = `<a class="btn primary block xl" href="#round-new">＋ 새 성적 기록하기</a><div style="height:10px"></div><a class="btn block" href="#analysis">나의 플레이 분석 보기</a>`;
    if (!rs.length) html += `<div class="empty"><span class="ico">${I('note')}</span>아직 기록이 없어요.<br>지난 대회 성적부터 넣어 보세요.</div>`;
    else {
      html += `<h2 class="section-title">지난 기록 (${rs.length}번)</h2><ul class="list">`;
      for (const r of rs) {
        const t = PG.roundTotals(r);
        html += `<li><a href="#round-${r.id}"><span class="ico">${I(r.kind === '대회' ? 'trophy' : 'flag')}</span><span class="main"><span class="title">${esc(r.title || (r.kind === '대회' ? '대회' : '연습 경기'))}</span><span class="sub">${fmtDate(r.date)} · ${esc(r.courseName || '')} · ${t.holes}홀${r.rank ? ' · ' + esc(r.rank) + '등' : ''}</span></span><span class="right">${t.strokes}타<br>${diffTag(t.diff)}</span></a></li>`;
      }
      html += `</ul>`;
    }
    return { title: '나의 성적', html };
  };

  let draft = null;
  function newDraft(prefill) {
    const fav = db.courses.find(c => c.fav) || db.courses[0];
    const d = { kind: '대회', title: '', date: today(), courseId: fav ? fav.id : '', nSec: 2, detail: true, sections: [], rank: '', condition: '보통', ob: 0, memo: '', weather: null, wxTags: [] };
    Object.assign(d, prefill || {});
    if (!d.sections.length) setSections(d, d.nSec);
    return d;
  }
  function setSections(d, n) {
    const c = course(d.courseId);
    const layout = (c && c.layout) || [];
    const old = d.sections;
    d.sections = Array.from({ length: n }, (_, i) => {
      if (old[i]) return old[i];
      const L = layout[i];
      const pars = L ? [...L.pars] : [...PG.DEFAULT_PARS];
      return { name: L ? L.name : PG.SECTION_NAMES[i], pars, strokes: [...pars], total: PG.sum(pars) };
    });
    d.nSec = n;
  }

  views['round-new'] = () => { if (!draft || draft.id || draft._fresh !== true) { draft = newDraft(window._roundPrefill); draft._fresh = true; window._roundPrefill = null; } return roundForm('새 성적 기록'); };
  views['round-edit'] = id => {
    const r = byId(db.rounds, id); if (!r) return views.rounds();
    if (draft && draft.id === id) return Object.assign(roundForm('성적 고치기'), { back: 'round-' + id });
    draft = JSON.parse(JSON.stringify(r)); draft.nSec = r.sections.length; draft.detail = r.sections.every(s => s.strokes); draft.wxTags = (r.weather && r.weather.tags) || [];
    return Object.assign(roundForm('성적 고치기'), { back: 'round-' + id });
  };

  function roundForm(title) {
    const d = draft;
    const opts = db.courses.map(c => `<option value="${c.id}" ${c.id === d.courseId ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
    const c = course(d.courseId);
    let html = `<form id="roundForm">
    <section class="card"><h2>1. 어떤 경기였나요?</h2>
      <div class="seg" role="group" aria-label="경기 종류">${['대회', '연습'].map(k => `<button type="button" class="chip" data-act="rf-kind" data-v="${k}" aria-pressed="${d.kind === k}">${k === '대회' ? '대회' : '연습·친선'}</button>`).join('')}</div>
      <div style="height:14px"></div>
      <label class="field"><span>대회 이름 (없으면 비워 두세요)</span><input type="text" id="rf-title" value="${esc(d.title)}" placeholder="예) 구청장배 파크골프 대회"></label>
      <label class="field"><span>날짜</span><input type="date" id="rf-date" value="${esc(d.date)}" max="${today()}"></label>
      <label class="field"><span>골프장</span>
        ${db.courses.length ? `<select id="rf-course"><option value="">— 골프장 고르기 —</option>${opts}</select>` : `<p class="muted">저장된 골프장이 없어요.</p>`}
      </label>
      <a class="btn ghost block" href="#courses" data-act="rf-addcourse">＋ 골프장 찾아서 추가하기</a>
    </section>
    <section class="card"><h2>2. 몇 코스를 쳤나요?</h2>
      <p class="muted small">한 코스는 9홀이에요.</p>
      <div class="seg">${[1, 2, 3, 4].map(n => `<button type="button" class="chip" data-act="rf-nsec" data-v="${n}" aria-pressed="${d.nSec === n}">${n}코스<br><span class="small">${n * 9}홀</span></button>`).join('')}</div>
      <div style="height:14px"></div>
      <div class="seg">${[[true, '홀마다 입력'], [false, '코스 합계만']].map(([v, l]) => `<button type="button" class="chip" data-act="rf-detail" data-v="${v}" aria-pressed="${d.detail === v}">${l}</button>`).join('')}</div>
      <p class="muted small">홀마다 넣으면 어느 홀이 약한지 더 자세히 분석해 드려요.</p>
    </section>
    <h2 class="section-title">3. 타수 넣기</h2>
    <p class="muted small" style="margin:-4px 4px 10px">－ ＋ 버튼으로 타수를 맞추세요. '파' 글자를 누르면 그 홀의 기준 타수가 바뀌어요.</p>`;
    d.sections.forEach((s, si) => {
      const sp = PG.sum(s.pars), st = s.strokes ? PG.sum(s.strokes) : s.total;
      html += `<section class="card"><div class="row" style="flex-wrap:nowrap"><h2 class="grow" style="margin:0;display:flex;align-items:center;gap:6px;white-space:nowrap"><input type="text" value="${esc(s.name)}" data-sec-name="${si}" aria-label="코스 이름 (바꿀 수 있어요)" style="width:3.6em;min-height:48px;padding:6px 8px;font-weight:800;text-align:center">코스</h2><span class="big" id="sec-sum-${si}">${st}타 ${diffTag(st - sp)}</span></div>`;
      if (d.detail) {
        s.pars.forEach((p, hi) => {
          const v = s.strokes[hi];
          html += `<div class="hole-row"><div><span class="hole-name">${hi + 1}번 홀</span><button type="button" class="par-chip" data-act="rf-par" data-s="${si}" data-h="${hi}" aria-label="${hi + 1}번 홀 기준 타수 ${p}, 눌러서 바꾸기">파${p}</button><br><span id="lbl-${si}-${hi}">${holeTag(v, p)}</span></div>
          <div class="stepper"><button type="button" data-act="rf-step" data-s="${si}" data-h="${hi}" data-d="-1" aria-label="${hi + 1}번 홀 한 타 빼기">－</button><span class="val" id="v-${si}-${hi}">${v}</span><button type="button" class="plus" data-act="rf-step" data-s="${si}" data-h="${hi}" data-d="1" aria-label="${hi + 1}번 홀 한 타 더하기">＋</button></div></div>`;
        });
      } else {
        html += `<div class="hole-row"><div><span class="hole-name">9홀 합계</span><br><span class="muted small">기준 ${sp}타</span></div><div class="stepper"><button type="button" data-act="rf-tot" data-s="${si}" data-d="-1" aria-label="합계 한 타 빼기">－</button><input type="number" inputmode="numeric" class="val" id="t-${si}" value="${s.total}" style="width:3.4em;min-height:60px;text-align:center;font-weight:900;font-size:1.5rem;padding:4px"><button type="button" class="plus" data-act="rf-tot" data-s="${si}" data-d="1" aria-label="합계 한 타 더하기">＋</button></div></div>`;
      }
      html += `</section>`;
    });
    html += `<section class="card"><h2>4. 그날 이야기 (안 넣어도 돼요)</h2>
      <label class="field"><span>순위</span><input type="number" inputmode="numeric" id="rf-rank" value="${esc(d.rank)}" placeholder="예) 3"></label>
      <label class="field"><span>OB(공이 밖으로 나간 횟수)</span></label>
      <div class="stepper" style="margin-bottom:14px"><button type="button" data-act="rf-ob" data-d="-1" aria-label="OB 빼기">－</button><span class="val" id="rf-ob">${d.ob}</span><button type="button" class="plus" data-act="rf-ob" data-d="1" aria-label="OB 더하기">＋</button></div>
      <label class="field"><span>몸 상태</span></label>
      <div class="seg" style="margin-bottom:14px">${['좋음', '보통', '안좋음'].map(k => `<button type="button" class="chip" data-act="rf-cond" data-v="${k}" aria-pressed="${d.condition === k}">${{ 좋음: '😊 좋음', 보통: '🙂 보통', 안좋음: '😣 안좋음' }[k]}</button>`).join('')}</div>
      <label class="field"><span>메모</span><textarea id="rf-memo" placeholder="예) 3번 홀 바람이 셌음, 새 공 사용">${esc(d.memo)}</textarea></label>
    </section>
    <section class="card"><h2>5. 그날 날씨</h2>
      <div id="rf-wx">${wxSummary(d.weather)}</div>
      ${c && c.lat != null ? `<p class="muted small">저장하면 그날 날씨를 자동으로 찾아 넣어요.</p><button type="button" class="btn block" data-act="rf-wxload">그날 날씨 불러오기</button>` : `<p class="muted small">골프장 위치가 있으면 날씨를 자동으로 찾아 드려요. 지금은 아래에서 골라 주세요.</p>`}
      <h3>직접 고르기 (여러 개 가능)</h3>
      <div class="chips">${['맑음', '흐림', '비', '바람', '더움', '추움'].map(k => `<button type="button" class="chip" data-act="rf-wxtag" data-v="${k}" aria-pressed="${d.wxTags.includes(k)}">${k}</button>`).join('')}</div>
    </section>
    <div class="card"><div class="row"><span class="grow big">전체</span><span class="huge" id="rf-total"></span></div></div>
    <button type="button" class="btn primary block xl" data-act="rf-save">저장하고 분석 보기</button>
    </form>`;
    return { title, html, back: 'rounds', after: () => { updateTotals(); bindRoundInputs(); } };
  }
  function holeTag(v, p) {
    const n = PG.scoreName(v, p), dd = v - p;
    return `<span class="tag ${dd < 0 ? 'good' : dd === 0 ? 'info' : dd >= 2 ? 'bad' : 'plain'}">${n}</span>`;
  }
  function wxSummary(w) {
    if (!w || w.tMax == null) return '';
    return `<div class="wx" style="margin-bottom:10px"><div><span class="k">날씨</span><span class="v">${WX.wxIcon(w.code)} ${WX.wxName(w.code)}</span></div><div><span class="k">기온(경기 시간)</span><span class="v">${w.tAvg != null ? Math.round(w.tAvg) : '-'}℃</span></div><div><span class="k">바람</span><span class="v">초속 ${w.wind != null ? Math.round(w.wind) : '-'}m</span></div><div><span class="k">비</span><span class="v">${w.precip != null ? w.precip : '-'}mm</span></div></div>`;
  }
  function updateTotals() {
    let st = 0, sp = 0;
    draft.sections.forEach((s, si) => {
      const a = s.strokes ? PG.sum(s.strokes) : Number(s.total) || 0, p = PG.sum(s.pars);
      st += a; sp += p;
      const el = $('#sec-sum-' + si); if (el) el.innerHTML = `${a}타 ${diffTag(a - p)}`;
    });
    const t = $('#rf-total'); if (t) t.innerHTML = `${st}타 ${diffTag(st - sp)}`;
  }
  function readRoundInputs() {
    const d = draft; if (!d) return;
    const g = id => document.getElementById(id);
    if (g('rf-title')) d.title = g('rf-title').value.trim();
    if (g('rf-date')) d.date = g('rf-date').value || today();
    if (g('rf-course')) d.courseId = g('rf-course').value;
    if (g('rf-rank')) d.rank = g('rf-rank').value;
    if (g('rf-memo')) d.memo = g('rf-memo').value;
    document.querySelectorAll('[data-sec-name]').forEach(i => { d.sections[i.dataset.secName].name = i.value.trim() || PG.SECTION_NAMES[i.dataset.secName]; });
    d.sections.forEach((s, si) => { const t = g('t-' + si); if (t) s.total = Math.max(9, Number(t.value) || 0); });
  }
  function bindRoundInputs() {
    const cs = $('#rf-course');
    if (cs) cs.addEventListener('change', () => {
      readRoundInputs();
      const c = course(draft.courseId);
      if (c && c.layout) { draft.sections = []; setSections(draft, draft.nSec); if (!draft.detail) draft.sections.forEach(s => { s.strokes = null; }); }
      draft.weather = null; render();
    });
    const dt = $('#rf-date'); if (dt) dt.addEventListener('change', () => { draft.weather = null; const w = $('#rf-wx'); if (w) w.innerHTML = ''; });
    document.querySelectorAll('[id^="t-"]').forEach(i => i.addEventListener('input', () => { readRoundInputs(); updateTotals(); }));
  }
  const rerenderForm = () => { const y = window.scrollY; readRoundInputs(); render(); window.scrollTo(0, y); };
  acts['rf-kind'] = el => { draft.kind = el.dataset.v; rerenderForm(); };
  acts['rf-nsec'] = el => { readRoundInputs(); setSections(draft, Number(el.dataset.v)); if (!draft.detail) draft.sections.forEach(s => { if (s.strokes) { s.total = PG.sum(s.strokes); s.strokes = null; } }); rerenderForm(); };
  acts['rf-detail'] = el => {
    readRoundInputs(); draft.detail = el.dataset.v === 'true';
    draft.sections.forEach(s => {
      if (draft.detail && !s.strokes) { s.strokes = [...s.pars]; }
      if (!draft.detail && s.strokes) { s.total = PG.sum(s.strokes); s.strokes = null; }
    });
    rerenderForm();
  };
  acts['rf-step'] = el => {
    const s = draft.sections[el.dataset.s], h = Number(el.dataset.h);
    s.strokes[h] = Math.min(15, Math.max(1, s.strokes[h] + Number(el.dataset.d)));
    $(`#v-${el.dataset.s}-${h}`).textContent = s.strokes[h];
    $(`#lbl-${el.dataset.s}-${h}`).innerHTML = holeTag(s.strokes[h], s.pars[h]);
    updateTotals();
  };
  acts['rf-par'] = el => {
    const s = draft.sections[el.dataset.s], h = Number(el.dataset.h);
    s.pars[h] = s.pars[h] >= 5 ? 3 : s.pars[h] + 1;
    el.textContent = '파' + s.pars[h];
    $(`#lbl-${el.dataset.s}-${h}`).innerHTML = holeTag(s.strokes[h], s.pars[h]);
    updateTotals();
  };
  acts['rf-tot'] = el => { readRoundInputs(); const s = draft.sections[el.dataset.s]; s.total = Math.max(9, (Number(s.total) || 0) + Number(el.dataset.d)); $('#t-' + el.dataset.s).value = s.total; updateTotals(); };
  acts['rf-ob'] = el => { draft.ob = Math.max(0, draft.ob + Number(el.dataset.d)); $('#rf-ob').textContent = draft.ob; };
  acts['rf-cond'] = el => { draft.condition = el.dataset.v; document.querySelectorAll('[data-act="rf-cond"]').forEach(b => b.setAttribute('aria-pressed', b === el)); };
  acts['rf-wxtag'] = el => {
    const v = el.dataset.v, i = draft.wxTags.indexOf(v);
    if (i >= 0) draft.wxTags.splice(i, 1); else draft.wxTags.push(v);
    el.setAttribute('aria-pressed', i < 0);
  };
  acts['rf-addcourse'] = () => { readRoundInputs(); window._returnTo = 'round-new'; go('courses'); };
  acts['rf-wxload'] = async el => {
    readRoundInputs();
    const c = course(draft.courseId); if (!c || c.lat == null) return;
    el.disabled = true; el.innerHTML = '<span class="spinner"></span> 불러오는 중…';
    try { draft.weather = await WX.dayWeather(c.lat, c.lon, draft.date); $('#rf-wx').innerHTML = wxSummary(draft.weather); toast('그날 날씨를 넣었어요'); }
    catch (e) { toast('날씨를 불러오지 못했어요. 직접 골라 주세요.'); }
    el.disabled = false; el.textContent = '그날 날씨 다시 불러오기';
  };
  acts['rf-save'] = async el => {
    readRoundInputs();
    const d = draft; const c = course(d.courseId);
    el.disabled = true; el.innerHTML = '<span class="spinner"></span> 저장하는 중…';
    if (c && c.lat != null && (!d.weather || d.weather.date !== d.date)) {
      try { d.weather = Object.assign(await WX.dayWeather(c.lat, c.lon, d.date), { date: d.date }); } catch (e) { /* 날씨 없이 저장 */ }
    }
    const weather = d.weather || (d.wxTags.length ? {} : null);
    if (weather) { weather.tags = [...d.wxTags]; weather.date = d.date; }
    const rec = { id: d.id || uid(), kind: d.kind, title: d.title, date: d.date, courseId: d.courseId, courseName: c ? c.name : '', sections: d.sections.map(s => ({ name: s.name, pars: [...s.pars], strokes: d.detail ? [...s.strokes] : null, total: d.detail ? PG.sum(s.strokes) : Number(s.total) })), rank: d.rank, condition: d.condition, ob: d.ob, memo: d.memo, weather, eventId: d.eventId || '' };
    const i = db.rounds.findIndex(r => r.id === rec.id);
    if (i >= 0) db.rounds[i] = rec; else db.rounds.push(rec);
    if (c && d.detail) c.layout = rec.sections.map(s => ({ name: s.name, pars: [...s.pars] })); // 다음에 같은 골프장 고르면 파 배치 그대로
    save(); draft = null;
    toast('저장했어요');
    go('round-' + rec.id);
  };

  views.round = id => {
    const r = byId(db.rounds, id); if (!r) return views.rounds();
    const c = course(r.courseId);
    const a = PG.analyzeRound(r, db.rounds, c);
    const t = a.totals;
    let html = `<section class="card center"><p style="margin:0">${r.kind === '대회' ? '대회' : '연습·친선'}${r.rank ? ` · <b>${esc(r.rank)}등</b>` : ''}</p>
      <h2 style="font-size:1.25rem;margin:6px 0">${esc(r.title || r.courseName || '경기')}</h2>
      <p class="muted" style="margin:0">${fmtDate(r.date, true)}${r.courseName ? ' · ' + esc(r.courseName) : ''}</p>
      <p class="huge" style="margin:12px 0 4px">${t.strokes}타</p><p class="big" style="margin:0">${diffTag(t.diff)} <span class="muted small">(기준 ${t.par}타 · ${t.holes}홀)</span></p></section>`;
    // 점수표
    html += `<section class="card"><h2>점수표</h2>`;
    for (const s of r.sections) {
      if (s.strokes) {
        html += `<h3>${esc(s.name)} 코스 · ${PG.sum(s.strokes)}타 ${diffTag(PG.sum(s.strokes) - PG.sum(s.pars))}</h3><div class="table-wrap"><table class="score"><tr><th>홀</th>${s.pars.map((_, i) => `<th>${i + 1}</th>`).join('')}</tr><tr><th>파</th>${s.pars.map(p => `<td>${p}</td>`).join('')}</tr><tr><th>타수</th>${s.strokes.map((v, i) => `<td class="${v < s.pars[i] ? 's-under' : v - s.pars[i] >= 2 ? 's-over2' : ''}">${v}</td>`).join('')}</tr></table></div>`;
      } else html += `<p><b>${esc(s.name)} 코스</b>: ${s.total}타 ${diffTag(s.total - PG.sum(s.pars))}</p>`;
    }
    html += `</section>`;
    if (r.weather && (r.weather.tMax != null || (r.weather.tags || []).length)) html += `<section class="card"><h2>그날 날씨</h2>${wxSummary(r.weather)}${(r.weather.tags || []).length ? `<div class="chips">${r.weather.tags.map(x => `<span class="tag plain">${esc(x)}</span>`).join('')}</div>` : ''}</section>`;
    if (aiOn()) html += `<section class="card" id="aiBox">${aiRoundBox(r)}</section>`;
    if (aiOn()) html += `<h2 class="section-title">기본 분석</h2>`;
    html += analysisCards(a.good, a.improve, a.practice, a.factors);
    if (r.memo) html += `<section class="card"><h2>메모</h2><p style="white-space:pre-wrap">${esc(r.memo)}</p></section>`;
    html += `<div class="btn-row"><button class="btn" data-act="speak-round" data-id="${r.id}">소리로 듣기</button><button class="btn" data-act="share-round" data-id="${r.id}">보내기</button></div><div style="height:10px"></div>
      <div class="btn-row"><a class="btn ghost" href="#round-edit-${r.id}">고치기</a><button class="btn danger" data-act="del-round" data-id="${r.id}">지우기</button></div>`;
    return { title: '성적 분석', html, back: 'rounds' };
  };
  /* ── AI 코치 ── */
  const aiNoteRound = '경기 기록·날씨·골프장 특징·지난 기록을 함께 보고 AI가 자세히 알려 드려요. 20~40초 걸려요.';
  function aiRoundBox(r) {
    if (r.ai && r.ai.result) return aiCards(r.ai.result, r.ai.at) + `<div class="btn-row"><button class="btn" data-act="ai-speak" data-kind="round" data-id="${r.id}">듣기</button><button class="btn ghost" data-act="ai-round" data-id="${r.id}">다시 받기</button></div>`;
    return `<h2>AI 코치</h2><p>${aiNoteRound}</p><button class="btn primary block xl" data-act="ai-round" data-id="${r.id}">AI 코치에게 분석받기</button>`;
  }
  function aiCards(res, at) {
    const items = (arr, cls) => (arr || []).map(g => `<div class="note ${cls}"><b>${esc(g.title)}</b>${esc(g.detail)}</div>`).join('');
    return `<h2>AI 코치 분석</h2><p style="font-size:1.05rem;font-weight:700">${esc(res.summary)}</p>
      <h3>잘한 점</h3>${items(res.good, 'good')}<h3>보완할 점</h3>${items(res.improve, 'warn')}<h3>연습 과제</h3>${items(res.practice, 'info')}
      ${res.encouragement ? `<p class="big" style="font-size:1.05rem;color:var(--primary)">${esc(res.encouragement)}</p>` : ''}
      <p class="muted small">AI가 쓴 분석이라 틀린 부분이 있을 수 있어요.${at ? ' · ' + fmtDate(WX.ymd(new Date(at))) + ' 받음' : ''}</p>`;
  }
  const aiText = res => `${res.summary} 잘한 점. ${(res.good || []).map(g => g.title + '. ' + g.detail).join(' ')} 보완할 점. ${(res.improve || []).map(g => g.title + '. ' + g.detail).join(' ')} 연습 과제. ${(res.practice || []).map(g => g.title + '. ' + g.detail).join(' ')} ${res.encouragement || ''}`;
  function aiHistory(before) {
    return [...db.rounds].filter(x => !before || x.date <= before.date && x.id !== before.id).sort((a, b) => a.date.localeCompare(b.date)).slice(-25).map(x => {
      const t = PG.roundTotals(x), f = PG.weatherFlags(x.weather);
      return { date: x.date, kind: x.kind, course: x.courseName, holes: t.holes, strokes: t.strokes, par: t.par, weather: Object.keys(f).filter(k => f[k]).join(',') || '모름', condition: x.condition };
    });
  }
  function aiCourse(c) { return c ? { name: c.name, features: c.features || {}, info: c.info || {} } : null; }
  async function aiRun(el, body, onDone) {
    const old = el.innerHTML; el.disabled = true;
    el.innerHTML = '<span class="spinner"></span> AI가 분석하는 중이에요…';
    try { const res = await srv('/analyze', { body, timeout: 150000 }); onDone(res); }
    catch (e) { toast(e.message, 4500); el.disabled = false; el.innerHTML = old; }
  }
  acts['ai-round'] = el => {
    const r = byId(db.rounds, el.dataset.id), c = course(r.courseId), a = PG.analyzeRound(r, db.rounds, c);
    const round = { date: r.date, kind: r.kind, title: r.title, sections: r.sections, ob: r.ob, condition: r.condition, rank: r.rank, memo: r.memo, weather: r.weather };
    aiRun(el, { mode: 'round', round, course: aiCourse(c), history: aiHistory(r), ruleBased: { good: a.good.map(x => x.t), improve: a.improve.map(x => x.t), factors: a.factors } }, res => {
      r.ai = { at: Date.now(), result: res }; save();
      const box = $('#aiBox'); if (box) box.innerHTML = aiRoundBox(r);
    });
  };
  acts['ai-overall'] = el => {
    const a = PG.analyzeOverall(db.rounds, db.courses);
    const overall = { style: a.style, count: a.count, avgPer9: a.avgPer9, parTypes: a.parTypes, counts: a.counts, weather: a.wxBuckets, grass: a.grass, trend: a.trend, spread: a.spread };
    const courses = db.courses.map(aiCourse);
    aiRun(el, { mode: 'overall', overall, history: aiHistory(null), course: null, courses, ruleBased: { good: a.good.map(x => x.t), improve: a.improve.map(x => x.t) } }, res => {
      db.aiOverall = { at: Date.now(), count: db.rounds.length, result: res }; save();
      const box = $('#aiBox'); if (box) box.innerHTML = aiOverallBox();
    });
  };
  acts['ai-speak'] = el => {
    const res = el.dataset.kind === 'overall' ? db.aiOverall.result : byId(db.rounds, el.dataset.id).ai.result;
    speak(aiText(res));
  };
  function aiOverallBox() {
    const o = db.aiOverall;
    if (o && o.result) {
      const stale = o.count !== db.rounds.length ? `<div class="note info">그 뒤로 기록이 ${Math.abs(db.rounds.length - o.count)}개 바뀌었어요. ‘다시 받기’를 누르면 새로 분석해요.</div>` : '';
      return aiCards(o.result, o.at) + stale + `<div class="btn-row"><button class="btn" data-act="ai-speak" data-kind="overall">듣기</button><button class="btn ghost" data-act="ai-overall">다시 받기</button></div>`;
    }
    return `<h2>AI 코치 종합 분석</h2><p>지금까지 기록 전체를 보고 플레이 스타일과 앞으로 집중할 점을 알려 드려요. 20~40초 걸려요.</p><button class="btn primary block xl" data-act="ai-overall">AI 코치에게 종합 분석받기</button>`;
  }

  function analysisCards(good, improve, practice, factors) {
    let h = '';
    if (factors && factors.length) h += `<section class="card"><h2>그날의 상황</h2>${factors.map(f => `<p>• ${esc(f)}</p>`).join('')}</section>`;
    h += `<section class="card"><h2>잘한 점</h2>${good.map(g => `<div class="note good"><b>${esc(g.t)}</b>${esc(g.d)}</div>`).join('')}</section>`;
    h += `<section class="card"><h2>보완할 점</h2>${improve.map(g => `<div class="note warn"><b>${esc(g.t)}</b>${esc(g.d)}</div>`).join('')}</section>`;
    h += `<section class="card"><h2>다음 연습 과제</h2>${practice.map((p, i) => `<div class="note info"><b>${i + 1}.</b>${esc(p)}</div>`).join('')}</section>`;
    return h;
  }
  function roundText(r) {
    const a = PG.analyzeRound(r, db.rounds, course(r.courseId));
    return `[파크골프 성적] ${fmtDate(r.date, true)}\n${r.title || ''} ${r.courseName || ''}\n총 ${a.totals.strokes}타 (${PG.sign(a.totals.diff)})${r.rank ? ` · ${r.rank}등` : ''}\n\n잘한 점\n${a.good.map(g => '· ' + g.t).join('\n')}\n\n보완할 점\n${a.improve.map(g => '· ' + g.t + ' — ' + g.d).join('\n')}\n\n연습 과제\n${a.practice.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
  }
  acts['speak-round'] = el => speak(roundText(byId(db.rounds, el.dataset.id)));
  acts['share-round'] = el => shareText('파크골프 성적', roundText(byId(db.rounds, el.dataset.id)));
  acts['del-round'] = async el => { if (await ask('이 기록을 지울까요?', '지우면 되돌릴 수 없어요.', '지우기', true)) { db.rounds = db.rounds.filter(r => r.id !== el.dataset.id); save(); go('rounds'); } };

  /* ════════════════ 나의 분석 ════════════════ */
  views.analysis = () => {
    const a = PG.analyzeOverall(db.rounds, db.courses);
    if (!a) return { title: '나의 플레이 분석', html: `<div class="empty"><span class="ico">${I('chart')}</span>성적을 한 번 이상 기록하면<br>플레이 스타일을 분석해 드려요.</div><a class="btn primary block xl" href="#round-new">성적 기록하기</a>` };
    const bt = a.bestTotals;
    let html = `<section class="card"><h2>나의 플레이 스타일</h2><p class="big" style="margin:0">${esc(a.style)}</p></section>
    <div class="wx" style="margin-bottom:16px"><div><span class="k">기록한 경기</span><span class="v">${a.count}번</span></div><div><span class="k">9홀당 평균</span><span class="v">${PG.signF(a.avgPer9)}타</span></div>
      <div><span class="k">최고 기록</span><span class="v">${bt.strokes}타 (${PG.sign(bt.diff)})</span><span class="k">${fmtDate(a.best.date)}</span></div><div><span class="k">버디 이상</span><span class="v">${a.counts.birdie}번</span>${a.counts.hio ? `<span class="k">홀인원 ${a.counts.hio}번 🎉</span>` : ''}</div></div>`;
    if (a.series.length >= 2) html += `<section class="card"><h2>성적 흐름</h2><p class="muted small" style="margin-top:0">9홀마다 기준 타수보다 몇 타 더 쳤는지예요. <b>아래로 내려갈수록 잘 친 것</b>이에요. 점을 누르면 자세히 보여요.</p><div class="chart" id="chart"></div></section>`;
    const pt = a.parTypes;
    if (a.holesCount) html += `<section class="card"><h2>홀 종류별 평균</h2><p class="muted small" style="margin-top:0">기준 타수보다 평균 몇 타 더 쳤는지</p><div class="wx" style="grid-template-columns:repeat(3,1fr)">${[3, 4, 5].map(k => `<div><span class="k">파${k} 홀</span><span class="v">${pt[k] ? PG.signF(pt[k].avg) : '-'}</span><span class="k">${pt[k] ? pt[k].n + '홀' : ''}</span></div>`).join('')}</div></section>`;
    const wx = a.wxBuckets.filter(b => b.n);
    if (wx.length) html += `<section class="card"><h2>날씨별 성적</h2>${wx.map(b => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="grow"><b>${b.label}</b> <span class="muted small">${b.n}번</span></span><span class="big">${PG.signF(b.avg)}</span>${b.others != null ? `<span class="muted small">다른 날 ${PG.signF(b.others)}</span>` : ''}</div>`).join('')}<p class="muted small">숫자는 9홀당 기준보다 더 친 타수예요.</p></section>`;
    if (aiOn()) html += `<section class="card" id="aiBox">${aiOverallBox()}</section><h2 class="section-title">기본 분석</h2>`;
    html += analysisCards(a.good, a.improve, a.practice);
    html += `<button class="btn block" data-act="speak-overall">소리로 듣기</button>`;
    return { title: '나의 플레이 분석', html, after: () => drawChart($('#chart'), a.series) };
  };
  acts['speak-overall'] = () => {
    const a = PG.analyzeOverall(db.rounds, db.courses);
    speak(`나의 플레이 스타일은 ${a.style}. 잘한 점. ${a.good.map(g => g.t).join('. ')}. 보완할 점. ${a.improve.map(g => g.t + '. ' + g.d).join(' ')} 연습 과제. ${a.practice.join(' ')}`);
  };

  /* 성적 흐름 그래프 (한 줄) */
  function drawChart(box, series) {
    if (!box || series.length < 2) return;
    const W = 600, H = 260, L = 44, R = 16, T = 16, B = 40;
    const ys = series.map(s => s.per9);
    let lo = Math.min(0, ...ys), hi = Math.max(1, ...ys);
    const padY = (hi - lo) * 0.15 || 1; lo -= padY; hi += padY;
    const x = i => L + (series.length === 1 ? 0 : (i * (W - L - R)) / (series.length - 1));
    const y = v => T + ((v - lo) / (hi - lo)) * (H - T - B); // 아래로 = 큰 값? → 잘 친 게 아래가 되도록 큰 값(많이 침)이 위
    const yy = v => H - B - (y(v) - T); // 뒤집기: 많이 친 것이 위
    const step = Math.max(1, Math.ceil((hi - lo) / 5));
    let grid = '';
    for (let v = Math.ceil(lo); v <= hi; v += step) grid += `<line x1="${L}" x2="${W - R}" y1="${yy(v)}" y2="${yy(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L - 8}" y="${yy(v) + 5}" text-anchor="end" font-size="14" fill="var(--muted)">${v > 0 ? '+' + v : v}</text>`;
    const par0 = `<line x1="${L}" x2="${W - R}" y1="${yy(0)}" y2="${yy(0)}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W - R}" y="${yy(0) - 6}" text-anchor="end" font-size="13" fill="var(--muted)">기준(파)</text>`;
    const path = series.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${yy(s.per9).toFixed(1)}`).join(' ');
    const labelIdx = [0, series.length - 1];
    const xl = labelIdx.map(i => `<text x="${x(i)}" y="${H - 12}" text-anchor="${i ? 'end' : 'start'}" font-size="14" fill="var(--muted)">${series[i].date.slice(2).replace(/-/g, '.')}</text>`).join('');
    const dots = series.map((s, i) => `<circle cx="${x(i)}" cy="${yy(s.per9)}" r="6" fill="var(--primary)" stroke="var(--card)" stroke-width="2"/><circle cx="${x(i)}" cy="${yy(s.per9)}" r="22" fill="transparent" data-i="${i}" style="cursor:pointer"/>`).join('');
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="경기별 9홀당 기준 대비 타수 그래프">${grid}${par0}<path d="${path}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round"/>${dots}${xl}</svg><div class="tip"></div>`;
    const tip = box.querySelector('.tip'), svg = box.querySelector('svg');
    const show = i => {
      const s = series[i], r = svg.getBoundingClientRect(), k = r.width / W;
      tip.innerHTML = `${fmtDate(s.date)} · ${esc(s.name || '')}<br>${s.totals.strokes}타 (${PG.sign(s.totals.diff)})`;
      tip.style.left = Math.min(r.width - 70, Math.max(70, x(i) * k)) + 'px'; tip.style.top = yy(s.per9) * k + 'px'; tip.style.display = 'block';
    };
    svg.querySelectorAll('[data-i]').forEach(c => { c.addEventListener('mouseenter', () => show(+c.dataset.i)); c.addEventListener('click', () => show(+c.dataset.i)); });
    svg.addEventListener('mouseleave', () => (tip.style.display = 'none'));
  }

  /* ════════════════ 내기 ════════════════ */
  /* 내기 목록: '삭제' 버튼을 누르면 지울 내기를 골라서 한꺼번에 지움 */
  const selCount = () => (betSel ? betSel.size : 0);
  function betRow(b) {
    const s = PG.settleBet(b), live = b.status === 'playing';
    const me = db.settings.name, mine = !live && me && b.players.includes(me) ? s.money[me] : null;
    const sub = live ? `${fmtDate(b.date)} · 점당 ${wonPlain(b.unit)}` : `${fmtDate(b.date)}${b.place ? ' · ' + esc(b.place) : ''} · ${b.totalsOnly ? '합계' : b.mode === 'hole' ? '홀 이기기' : '타당'}`;
    const right = live ? '<span class="right small">하던 중</span>' : (mine != null ? `<span class="right ${mine > 0 ? 'money-plus' : mine < 0 ? 'money-minus' : ''}">${won(mine)}</span>` : '');
    const body = `<span class="main"><span class="title">${esc(b.players.join(' · '))}</span><span class="sub">${sub}</span></span>${right}`;
    if (betSel) {
      const on = betSel.has(b.id);
      return `<li><button type="button" class="item selrow" data-act="bet-sel" data-id="${b.id}" aria-pressed="${on}"><span class="selbox" aria-hidden="true">${on ? '✓' : ''}</span>${body}</button></li>`;
    }
    return `<li><a href="#bet-${live ? 'play-' : ''}${b.id}"><span class="ico">${I(live ? 'clock' : 'coin')}</span>${body}</a></li>`;
  }
  acts['bet-sel-mode'] = () => { betSel = new Set(); render(); };
  acts['bet-sel-cancel'] = () => { betSel = null; render(); };
  acts['bet-sel'] = el => { const id = el.dataset.id; if (betSel.has(id)) betSel.delete(id); else betSel.add(id); const y = window.scrollY; render(); window.scrollTo(0, y); };
  acts['bet-sel-all'] = () => { betSel = betSel.size === db.bets.length ? new Set() : new Set(db.bets.map(b => b.id)); const y = window.scrollY; render(); window.scrollTo(0, y); };
  acts['bet-sel-delete'] = async () => {
    const n = selCount(); if (!n) return toast('지울 내기를 눌러서 골라 주세요');
    if (!(await ask(`내기 ${n}개를 지울까요?`, '지우면 되돌릴 수 없어요. 지금까지 내기 합계에서도 빠져요.', `${n}개 지우기`, true))) return;
    const ids = betSel; db.bets = db.bets.filter(b => !ids.has(b.id)); save(); betSel = null; toast(`내기 ${n}개를 지웠어요`); render();
  };
  views.bets = () => {
    const live = db.bets.filter(b => b.status === 'playing');
    const done = db.bets.filter(b => b.status === 'done').sort((a, b) => b.date.localeCompare(a.date));
    let html = '';
    if (betSel) html += `<div class="note warn"><b>지울 내기를 눌러서 고르세요</b>고른 것은 ✓ 표시가 돼요. 다 고르면 아래 ‘지우기’를 누르세요.</div>`;
    else html += `<a class="btn primary block xl" href="#bet-new">＋ 새 내기 시작하기</a>` + (db.bets.length ? `<div style="height:10px"></div><button type="button" class="btn danger block" data-act="bet-sel-mode">${I('trash')} 삭제</button>` : '');
    if (live.length) html += `<h2 class="section-title">하고 있는 내기</h2><ul class="list">${live.map(betRow).join('')}</ul>`;
    // 누적
    const me = db.settings.name;
    const acc = {};
    for (const b of done) { const s = PG.settleBet(b); for (const p of b.players) acc[p] = (acc[p] || 0) + s.money[p]; }
    const names = Object.keys(acc).sort((a, b) => acc[b] - acc[a]);
    if (names.length && !betSel) html += `<section class="card"><h2>지금까지 내기 합계</h2>${names.map(p => `<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line)"><span class="grow big">${esc(p)}${p === me ? ' <span class="tag info">나</span>' : ''}</span><span class="big ${acc[p] > 0 ? 'money-plus' : acc[p] < 0 ? 'money-minus' : ''}">${won(acc[p])}</span></div>`).join('')}<p class="muted small">＋는 딴 돈, −는 잃은 돈이에요.</p></section>`;
    if (done.length) html += `<h2 class="section-title">지난 내기</h2><ul class="list">${done.map(betRow).join('')}</ul>`;
    else if (!live.length) html += `<div class="empty"><span class="ico">${I('coin')}</span>함께 친 분들 이름과 점당 금액만 정하면<br>타수를 넣을 때마다 자동으로 정산해 드려요.</div>`;
    if (betSel) html += `<div style="height:92px"></div><div class="sel-bar"><button type="button" class="btn ghost" data-act="bet-sel-cancel">취소</button><button type="button" class="btn ghost" data-act="bet-sel-all">${betSel.size === db.bets.length ? '전체 해제' : '전체 선택'}</button><button type="button" class="btn danger" data-act="bet-sel-delete" ${betSel.size ? '' : 'disabled'}>${betSel.size ? betSel.size + '개 ' : ''}지우기</button></div>`;
    return { title: betSel ? `지울 내기 고르기${betSel.size ? ' · ' + betSel.size + '개' : ''}` : '내기', html, back: betSel ? null : undefined };
  };
  let bdraft = null;
  views['bet-new'] = () => {
    if (!bdraft) {
      const me = db.settings.name;
      const fav = db.courses.find(c => c.fav) || db.courses[0];
      bdraft = Object.assign({ players: me ? [me] : [], unit: 1000, mode: 'hole', carry: false, bonus: false, totalsOnly: false, nHoles: 18, place: fav ? fav.name : '' }, window._betPrefill || {});
      window._betPrefill = null;
    }
    const d = bdraft;
    const recent = db.players.filter(p => !d.players.includes(p)).slice(0, 12);
    const units = [100, 500, 1000, 2000, 5000];
    let html = `<section class="card"><h2>1. 누구와 치나요?</h2>
      <div class="chips" style="margin-bottom:12px">${d.players.map((p, i) => `<button type="button" class="chip" aria-pressed="true" data-act="bn-rm" data-i="${i}" aria-label="${esc(p)} 빼기">${esc(p)} ✕</button>`).join('') || '<span class="muted">아직 아무도 없어요</span>'}</div>
      <div class="row"><input type="text" id="bn-name" class="grow" placeholder="이름 넣기" style="flex:1;min-width:0" enterkeyhint="done"><button type="button" class="btn primary" data-act="bn-add">추가</button></div>
      ${recent.length ? `<h3>전에 같이 친 분 (누르면 추가)</h3><div class="chips">${recent.map(p => `<button type="button" class="chip" data-act="bn-pick" data-v="${esc(p)}">＋ ${esc(p)}</button>`).join('')}</div>` : ''}
    </section>
    <section class="card"><h2>2. 점당 얼마?</h2>
      <div class="chips">${units.map(u => `<button type="button" class="chip" data-act="bn-unit" data-v="${u}" aria-pressed="${d.unit === u}">${u.toLocaleString()}원</button>`).join('')}</div>
      <label class="field" style="margin-top:12px"><span>직접 넣기 (원)</span><input type="number" inputmode="numeric" id="bn-unit" value="${d.unit}" step="100" min="0"></label>
    </section>
    <section class="card"><h2>3. 내기 방식</h2>
      <div class="seg">${[['hole', '홀 이기기 (이긴 사람이 받음)'], ['stroke', '타당 (합계 타수 차이)']].map(([v, l]) => `<button type="button" class="chip" data-act="bn-mode" data-v="${v}" aria-pressed="${d.mode === v}">${l}</button>`).join('')}</div>
      <div class="note info">${d.mode === 'stroke' ? '<b>타당</b>다 친 뒤 사람마다 서로 타수 차이만큼 주고받아요. 예) 나 70타, 영희 73타, 점당 1,000원 → 영희가 나에게 3,000원.' : '<b>홀 이기기</b>홀마다 <b>제일 적게 친 사람</b>이 그 홀의 승자예요. 승자는 다른 분들에게서 점당 금액을 받아요. 예) 점당 1,000원, 3명이 치면 승자가 2,000원 받아요. 같은 타수가 둘 이상이면 그 홀은 비겨요.'}</div>
      ${d.mode === 'hole' ? `<button type="button" class="check" data-act="bn-toggle" data-k="carry" aria-pressed="${d.carry}"><span class="box">${d.carry ? '✓' : ''}</span><span class="lbl">비기면 다음 홀로 점수 쌓기 (이월)</span></button>` : ''}
      <button type="button" class="check" data-act="bn-toggle" data-k="bonus" aria-pressed="${d.bonus}" ${d.totalsOnly ? 'disabled' : ''}><span class="box">${d.bonus ? '✓' : ''}</span><span class="lbl">버디 보너스 (버디 1점, 홀인원 3점씩 더 받기)</span></button>
    </section>
    <section class="card"><h2>4. 몇 홀 치나요?</h2>
      <div class="seg">${[9, 18, 27, 36].map(n => `<button type="button" class="chip" data-act="bn-holes" data-v="${n}" aria-pressed="${d.nHoles === n}">${n}홀</button>`).join('')}</div>
      <div style="height:12px"></div>
      <div class="seg">${[[false, '홀마다 넣기'], [true, '합계만 넣기']].map(([v, l]) => `<button type="button" class="chip" data-act="bn-tot" data-v="${v}" aria-pressed="${d.totalsOnly === v}">${l}</button>`).join('')}</div>
      ${d.totalsOnly ? '<p class="muted small">합계만 넣을 때는 타당 방식으로만 계산해요.</p>' : ''}
      <label class="field" style="margin-top:12px"><span>골프장 (안 넣어도 돼요)</span><input type="text" id="bn-place" value="${esc(d.place)}" list="bn-courses"><datalist id="bn-courses">${db.courses.map(c => `<option value="${esc(c.name)}">`).join('')}</datalist></label>
    </section>
    <button type="button" class="btn primary block xl" data-act="bn-start">내기 시작</button>`;
    return { title: '새 내기', html, back: 'bets', after: () => { const n = $('#bn-name'); n.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); acts['bn-add'](); } }); } };
  };
  const rerenderBet = () => { const y = window.scrollY; readBetInputs(); render(); window.scrollTo(0, y); };
  function readBetInputs() { const u = $('#bn-unit'); if (u) bdraft.unit = Math.max(0, Number(u.value) || 0); const p = $('#bn-place'); if (p) bdraft.place = p.value.trim(); }
  acts['bn-add'] = () => {
    const n = $('#bn-name'); const v = n.value.trim();
    if (!v) return toast('이름을 넣어 주세요');
    if (bdraft.players.includes(v)) return toast('이미 있는 이름이에요');
    if (bdraft.players.length >= 8) return toast('8명까지 할 수 있어요');
    bdraft.players.push(v); rerenderBet(); setTimeout(() => $('#bn-name') && $('#bn-name').focus(), 50);
  };
  acts['bn-pick'] = el => { if (bdraft.players.length >= 8) return toast('8명까지 할 수 있어요'); bdraft.players.push(el.dataset.v); rerenderBet(); };
  acts['bn-rm'] = el => { bdraft.players.splice(Number(el.dataset.i), 1); rerenderBet(); };
  acts['bn-unit'] = el => { bdraft.unit = Number(el.dataset.v); $('#bn-unit').value = bdraft.unit; rerenderBet(); };
  acts['bn-mode'] = el => { bdraft.mode = el.dataset.v; rerenderBet(); };
  acts['bn-toggle'] = el => { bdraft[el.dataset.k] = !bdraft[el.dataset.k]; rerenderBet(); };
  acts['bn-holes'] = el => { bdraft.nHoles = Number(el.dataset.v); rerenderBet(); };
  acts['bn-tot'] = el => { bdraft.totalsOnly = el.dataset.v === 'true'; if (bdraft.totalsOnly) { bdraft.mode = 'stroke'; bdraft.bonus = false; } rerenderBet(); };
  acts['bn-start'] = () => {
    readBetInputs();
    const d = bdraft;
    if (d.players.length < 2) return toast('두 명 이상 넣어 주세요');
    const c = db.courses.find(x => x.name === d.place);
    const pars = [];
    const lay = (c && c.layout) || [];
    for (let i = 0; i < d.nHoles / 9; i++) pars.push(...(lay[i] ? lay[i].pars : PG.DEFAULT_PARS));
    const bet = { id: uid(), date: today(), place: d.place, players: [...d.players], unit: d.unit, mode: d.totalsOnly ? 'stroke' : d.mode, carry: d.carry, bonus: !d.totalsOnly && d.bonus, totalsOnly: d.totalsOnly, pars, scores: {}, totals: {}, cur: 0, status: 'playing' };
    for (const p of bet.players) { bet.scores[p] = pars.map(() => null); bet.totals[p] = PG.sum(pars); }
    db.bets.push(bet);
    for (const p of bet.players) { db.players = [p, ...db.players.filter(x => x !== p)].slice(0, 30); }
    save(); bdraft = null;
    go('bet-play-' + bet.id);
  };

  views['bet-play'] = id => {
    const b = byId(db.bets, id); if (!b) return views.bets();
    const s = PG.settleBet(b);
    let html = '';
    if (b.totalsOnly) {
      html += `<section class="card"><h2>사람마다 전체 타수를 넣으세요</h2><p class="muted small">기준 ${PG.sum(b.pars)}타 (${b.pars.length}홀)</p>${b.players.map((p, i) => `<div class="player-row"><span class="name">${esc(p)}</span><div class="stepper"><button type="button" data-act="bp-tot" data-i="${i}" data-d="-1" aria-label="${esc(p)} 한 타 빼기">－</button><input type="number" inputmode="numeric" class="val" data-tot="${i}" value="${b.totals[p]}" style="width:3.4em;min-height:60px;text-align:center;font-weight:900;font-size:1.5rem;padding:4px"><button type="button" class="plus" data-act="bp-tot" data-i="${i}" data-d="1" aria-label="${esc(p)} 한 타 더하기">＋</button></div></div>`).join('')}</section>`;
      html += liveBox(b, s);
      html += `<button type="button" class="btn primary block xl" data-act="bp-finish" data-id="${b.id}">정산하기</button>`;
    } else {
      const i = b.cur, par = b.pars[i], n = b.pars.length;
      const sec = Math.floor(i / 9), names = PG.SECTION_NAMES;
      html += `<section class="card center"><p class="muted" style="margin:0">${names[sec] || ''} 코스 · 점당 ${wonPlain(b.unit)}${b.mode === 'hole' ? ' · 홀 이기기' : ''}</p><p class="huge" style="margin:4px 0">${i + 1}번 홀</p><button type="button" class="par-chip" data-act="bp-par" style="font-size:1.1rem;padding:6px 18px">기준 파${par} (눌러서 바꾸기)</button>
        <div class="dots" aria-label="홀 고르기">${b.pars.map((_, k) => `<button type="button" data-act="bp-go" data-k="${k}" class="${k === i ? 'cur' : b.players.every(p => b.scores[p][k]) ? 'done' : ''}" aria-label="${k + 1}번 홀">${k + 1}</button>`).join('')}</div></section>
      ${holeBanner(b, i)}
      <section class="card">${b.players.map((p, pi) => { const v = b.scores[p][i] || par; return `<div class="player-row"><div><span class="name">${esc(p)}</span><br><span class="muted small">지금까지 ${s.totals[p] - (b.scores[p][i] || 0) + v}타</span> ${holeTag(v, par)}</div><div class="stepper"><button type="button" data-act="bp-step" data-p="${pi}" data-d="-1" aria-label="${esc(p)} 한 타 빼기">－</button><span class="val">${v}</span><button type="button" class="plus" data-act="bp-step" data-p="${pi}" data-d="1" aria-label="${esc(p)} 한 타 더하기">＋</button></div></div>`; }).join('')}</section>
      <div class="btn-row"><button type="button" class="btn" data-act="bp-prev" ${i === 0 ? 'disabled' : ''}>이전 홀</button>${i < n - 1 ? `<button type="button" class="btn primary" data-act="bp-next">다음 홀</button>` : `<button type="button" class="btn primary" data-act="bp-finish" data-id="${b.id}">정산하기</button>`}</div>
      <div style="height:16px"></div>${liveBox(b, s)}
      ${i < n - 1 ? `<button type="button" class="btn ghost block" data-act="bp-finish" data-id="${b.id}">여기까지만 하고 정산하기</button>` : ''}`;
    }
    html += `<div style="height:10px"></div><button type="button" class="btn danger block" data-act="bp-del" data-id="${b.id}">이 내기 지우기</button>`;
    return { title: '내기', html, back: 'bets', after: () => {
      document.querySelectorAll('[data-tot]').forEach(inp => inp.addEventListener('change', () => { b.totals[b.players[inp.dataset.tot]] = Math.max(0, Number(inp.value) || 0); save(); refreshLive(b); }));
    } };
  };
  /* 이 홀의 승자와 받을 돈 (홀 이기기 방식) */
  function holeBanner(b, i) {
    if (b.mode !== 'hole' || !b.players.every(p => b.scores[p][i])) return '';
    const l = PG.settleBet(b).log.find(x => x.hole === i + 1 && !x.bonus);
    if (!l) return '';
    if (!l.winner) return `<div class="note info"><b>${i + 1}번 홀은 비겼어요</b>${b.carry ? '이번 점수는 다음 홀로 넘어가요.' : '주고받는 돈이 없어요.'}</div>`;
    return `<div class="note good"><b>${esc(l.winner)}님이 이겼어요!</b>다른 분들에게서 ${wonPlain(l.pot * b.unit)}씩, 모두 ${wonPlain(l.pot * b.unit * (b.players.length - 1))} 받아요.</div>`;
  }
  function liveBox(b, s) {
    return `<section class="card" id="liveBox"><h2>지금 정산하면 ${b.totalsOnly ? '' : `<span class="muted small">(${s.holesDone}홀까지)</span>`}</h2>${[...b.players].sort((x, y) => s.money[y] - s.money[x]).map(p => `<div class="row" style="padding:6px 0"><span class="grow"><b>${esc(p)}</b> <span class="muted small">${s.totals[p]}타</span></span><span class="big ${s.money[p] > 0 ? 'money-plus' : s.money[p] < 0 ? 'money-minus' : ''}">${won(s.money[p])}</span></div>`).join('')}</section>`;
  }
  function refreshLive(b) { const el = $('#liveBox'); if (el) el.outerHTML = liveBox(b, PG.settleBet(b)); }
  const curBet = () => byId(db.bets, parse().id);
  function fillHole(b) { const i = b.cur; for (const p of b.players) if (!b.scores[p][i]) b.scores[p][i] = b.pars[i]; }
  const rerenderKeep = () => { const y = window.scrollY; render(); window.scrollTo(0, y); };
  acts['bp-step'] = el => { const b = curBet(); fillHole(b); const p = b.players[el.dataset.p]; b.scores[p][b.cur] = Math.min(15, Math.max(1, b.scores[p][b.cur] + Number(el.dataset.d))); save(); rerenderKeep(); };
  acts['bp-par'] = () => { const b = curBet(); b.pars[b.cur] = b.pars[b.cur] >= 5 ? 3 : b.pars[b.cur] + 1; save(); rerenderKeep(); };
  acts['bp-next'] = () => { const b = curBet(); fillHole(b); b.cur = Math.min(b.pars.length - 1, b.cur + 1); save(); render(); };
  acts['bp-prev'] = () => { const b = curBet(); b.cur = Math.max(0, b.cur - 1); save(); render(); };
  acts['bp-go'] = el => { const b = curBet(); b.cur = Number(el.dataset.k); save(); render(); };
  acts['bp-tot'] = el => { const b = curBet(); const p = b.players[el.dataset.i]; b.totals[p] = Math.max(0, (Number(b.totals[p]) || 0) + Number(el.dataset.d)); save(); const inp = document.querySelector(`[data-tot="${el.dataset.i}"]`); if (inp) inp.value = b.totals[p]; refreshLive(b); };
  acts['bp-finish'] = async el => {
    const b = byId(db.bets, el.dataset.id);
    if (!b.totalsOnly) {
      fillHole(b);
      const missing = b.pars.length - PG.completedHoles(b).length;
      if (missing > 0 && !(await ask('정산할까요?', `아직 넣지 않은 홀이 ${missing}개 있어요. 넣은 홀까지만 계산해요.`, '정산하기'))) return;
    }
    b.status = 'done'; save(); go('bet-' + b.id);
  };
  acts['bp-del'] = async el => { if (await ask('이 내기를 지울까요?', '지우면 되돌릴 수 없어요.', '지우기', true)) { db.bets = db.bets.filter(x => x.id !== el.dataset.id); save(); go('bets'); } };

  views.bet = id => {
    const b = byId(db.bets, id); if (!b) return views.bets();
    const s = PG.settleBet(b);
    const parSum = b.totalsOnly ? PG.sum(b.pars) : PG.completedHoles(b).reduce((a, i) => a + b.pars[i], 0);
    const medals = ['🥇', '🥈', '🥉'];
    let html = `<section class="card"><p class="muted" style="margin:0">${fmtDate(b.date, true)}${b.place ? ' · ' + esc(b.place) : ''}</p><p style="margin:4px 0 0"><b>${b.totalsOnly || b.mode === 'stroke' ? '타당' : '홀 이기기'}</b> · 점당 ${wonPlain(b.unit)}${b.bonus ? ' · 버디 보너스' : ''}${b.carry ? ' · 이월' : ''}${s.holesDone != null ? ` · ${s.holesDone}홀` : ''}</p></section>
      <section class="card"><h2>순위와 정산</h2>${s.ranking.map((p, i) => `<div class="rank-row"><span class="medal">${medals[i] || i + 1 + '등'}</span><div><span class="big">${esc(p)}</span><br><span class="muted">${s.totals[p]}타 ${diffTag(s.totals[p] - parSum)}</span></div><span class="big ${s.money[p] > 0 ? 'money-plus' : s.money[p] < 0 ? 'money-minus' : ''}">${won(s.money[p])}</span></div>`).join('')}</section>
      <section class="card"><h2>이렇게 주고받으세요</h2>${s.transfers.length ? s.transfers.map(t => `<div class="transfer"><span class="who">${esc(t.from)}님 ➜ ${esc(t.to)}님께</span><span class="amt">${wonPlain(t.amount)}</span></div>`).join('') : '<p>주고받을 돈이 없어요. 모두 비겼어요!</p>'}</section>`;
    const holeLog = s.log.filter(l => l.hole);
    if (holeLog.length) html += `<section class="card"><details><summary class="big" style="cursor:pointer;min-height:48px">홀별 내용 보기</summary>${holeLog.map(l => `<p>• ${l.hole}번 홀: ${l.bonus ? `${esc(l.bonus)} ${esc(l.what)} 보너스 ${l.k}점` : l.winner ? `${esc(l.winner)} 승 (${l.pot}점)` : '비김' + (b.carry ? ' → 다음 홀로' : '')}</p>`).join('')}</details></section>`;
    html += `<div class="btn-row"><button class="btn" data-act="bet-share" data-id="${b.id}">결과 보내기</button><button class="btn" data-act="bet-speak" data-id="${b.id}">소리로 듣기</button></div><div style="height:10px"></div>
      <div class="btn-row"><button class="btn ghost" data-act="bet-reopen" data-id="${b.id}">타수 고치기</button><button class="btn" data-act="bet-again" data-id="${b.id}">같은 분들과 또</button></div><div style="height:10px"></div>
      <button class="btn danger block" data-act="bp-del" data-id="${b.id}">지우기</button>`;
    return { title: '내기 결과', html, back: 'bets' };
  };
  function betText(b) {
    const s = PG.settleBet(b);
    return `[파크골프 내기 결과] ${fmtDate(b.date, true)}${b.place ? ' ' + b.place : ''}\n점당 ${wonPlain(b.unit)}\n\n${s.ranking.map((p, i) => `${i + 1}등 ${p} ${s.totals[p]}타  ${won(s.money[p])}`).join('\n')}\n\n주고받을 돈\n${s.transfers.map(t => `${t.from} → ${t.to} ${wonPlain(t.amount)}`).join('\n') || '없음'}`;
  }
  acts['bet-share'] = el => shareText('내기 결과', betText(byId(db.bets, el.dataset.id)));
  acts['bet-speak'] = el => { const b = byId(db.bets, el.dataset.id); const s = PG.settleBet(b); speak(s.ranking.map((p, i) => `${i + 1}등 ${p}, ${s.totals[p]}타, ${s.money[p] >= 0 ? '받을 돈' : '줄 돈'} ${wonPlain(s.money[p])}`).join('. ') + '. ' + s.transfers.map(t => `${t.from}님이 ${t.to}님에게 ${wonPlain(t.amount)}`).join('. ')); };
  acts['bet-reopen'] = el => { const b = byId(db.bets, el.dataset.id); b.status = 'playing'; save(); go('bet-play-' + b.id); };
  acts['bet-again'] = el => { const b = byId(db.bets, el.dataset.id); bdraft = null; window._betPrefill = { players: [...b.players], unit: b.unit, mode: b.mode, carry: b.carry, bonus: b.bonus, totalsOnly: b.totalsOnly, nHoles: b.pars.length, place: b.place }; go('bet-new'); };

  /* ════════════════ 골프장 ════════════════ */
  /* 전국 파크골프장 목록 (data/courses.json — 공공데이터포털 자료를 모은 것) */
  let GL = null; // null: 아직 안 불러옴, false: 없음/실패
  async function loadGL() {
    if (GL !== null) return GL;
    try { const r = await fetch('data/courses.json'); if (!r.ok) throw new Error('no'); GL = await r.json(); } catch (e) { GL = false; }
    if (GL && GL.items) { // 목록에서 정확한 위치를 새로 찾았으면, 대략적 위치로 저장해 둔 내 골프장도 바로잡기
      let n = 0;
      db.courses.forEach(c => {
        if (!c.approx) return;
        const x = GL.items.find(k => k.n === c.name && localAddr(k) === (c.address || '') && !k.ap && k.la != null);
        if (x) { c.lat = x.la; c.lon = x.lo; c.approx = false; n++; }
      });
      if (n) { save(); Object.keys(wxCache).forEach(k => delete wxCache[k]); }
    }
    return GL;
  }
  const SIDO_START = /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충청|충북|충남|전라|전북|전남|경상|경북|경남|제주)/;
  const localAddr = x => { const a = x.a || ''; return x.sd && !SIDO_START.test(a) ? `${x.sd} ${a}`.trim() : a; };
  const freshSearch = () => ({ q: '', region: '', limit: 20, results: null, near: null, loading: false, err: '' });
  let searchState = freshSearch();
  views.courses = () => {
    let html = `<section class="card"><h2>골프장 찾기</h2>
      <div class="row"><input type="search" id="cs-q" class="grow" style="flex:1;min-width:0" placeholder="예) 포항, 경북 영천, 반포" value="${esc(searchState.q)}" enterkeyhint="search"><button class="btn primary" data-act="cs-search">찾기</button></div>
      <div style="height:10px"></div><button class="btn block" data-act="cs-near">내 주변 골프장 찾기</button>
      <div id="cs-results">${searchResultsHtml()}</div>
      <a class="btn ghost block" href="#course-new" style="margin-top:10px">직접 입력해서 추가</a></section>`;
    if (window._returnTo) html = `<div class="note info"><b>골프장을 추가하면</b>성적 입력 화면으로 돌아갈 수 있어요. <a href="#${window._returnTo}" data-act="cs-return">돌아가기</a></div>` + html;
    if (db.courses.length) {
      html += `<h2 class="section-title">내 골프장</h2><ul class="list">${db.courses.map(c => `<li class="has-act"><a href="#course-${c.id}"><span class="ico">${I(c.fav ? 'star' : 'flag')}</span><span class="main"><span class="title">${esc(c.name)}</span><span class="sub">${esc(c.address || '')}</span></span><span class="right small" data-mini="${c.id}">${c.lat != null ? '<span class="spinner"></span>' : ''}</span></a><button type="button" class="star-btn" data-act="c-fav" data-id="${c.id}" aria-pressed="${!!c.fav}" aria-label="${esc(c.name)} ${c.fav ? '자주 가는 곳 해제' : '자주 가는 곳으로 정하기'}">${I('star')}<span>${c.fav ? '자주 가는 곳' : '별표'}</span></button></li>`).join('')}</ul><p class="muted small">★ 별표를 누르면 그 골프장이 <b>자주 가는 곳</b>이 돼요. 오늘 일정이 없을 때 처음 화면 날씨와 성적·내기 기본 골프장으로 쓰여요.</p>`;
    } else html += `<div class="empty"><span class="ico">${I('flag')}</span>자주 가는 골프장을 찾아 추가해 두면<br>날씨와 운영 상황을 바로 볼 수 있어요.</div>`;
    return { title: '골프장', html, after: () => {
      const q = $('#cs-q'); q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); acts['cs-search'](); } });
      loadGL().then(() => paintResults());
      db.courses.forEach(async c => {
        const el = document.querySelector(`[data-mini="${c.id}"]`); if (!el || c.lat == null) return;
        try { const d = await courseNow(c); el.innerHTML = `${WX.wxIcon(d.w.current.weather_code)} ${Math.round(d.w.current.temperature_2m)}℃<br><span class="tag ${['good', 'warn', 'bad'][d.status.level]}">${d.status.label}</span>`; } catch (e) { el.textContent = ''; }
      });
    } };
  };
  function localRow(x, extra) {
    const addr = localAddr(x), have = db.courses.find(c => c.name === x.n && (c.address || '') === addr);
    const bits = [addr || '주소 없음', x.h ? `${x.h}홀` : '', extra || ''].filter(Boolean).join(' · ');
    return `<li><button class="item" data-act="cs-add-local" data-i="${x.i}"><span class="ico">${I(have ? 'check' : 'plus')}</span><span class="main"><span class="title">${esc(x.n)}</span><span class="sub">${esc(bits)}</span></span></button></li>`;
  }
  function searchResultsHtml() {
    const s = searchState; let h = '';
    if (GL && GL.items) {
      const regs = PG.regionCounts(GL.items);
      const chips = `<h3>지역으로 찾기</h3><div class="chips">${regs.map(([r, n]) => `<button type="button" class="chip" data-act="cs-region" data-v="${esc(r)}" aria-pressed="${s.region === r}">${esc(r)} ${n}</button>`).join('')}</div>`;
      const active = !!(s.near || s.q || s.region);
      if (!active) h += chips;
      if (s.near) {
        h += `<h3>내 주변 파크골프장 (가까운 순)</h3><ul class="list">${s.near.map(o => localRow(o.x, `${o.d.toFixed(1)}km${o.x.ap ? ' (대략)' : ''}`)).join('')}</ul>`;
      } else if (s.q || s.region) {
        const list = PG.findCourses(GL.items, s.q, s.region), shown = list.slice(0, s.limit);
        h += `<h3>${s.region ? esc(s.region) + ' · ' : ''}전국 목록에서 ${list.length}곳 — 눌러서 추가</h3>`;
        h += list.length ? `<ul class="list">${shown.map(x => localRow(x)).join('')}</ul>${list.length > shown.length ? `<button class="btn ghost block" data-act="cs-more">더 보기 (${list.length - shown.length}곳 남음)</button>` : ''}`
          : `<div class="note warn"><b>목록에 없어요</b>아래 '지도에서 더 찾기'를 누르거나 '직접 입력해서 추가'를 눌러 주세요.</div>`;
        if (s.q) h += `<button class="btn block" data-act="cs-osm" style="margin-top:10px">지도에서 더 찾기</button>`;
      }
      if (active) h += chips; // 검색 중에는 결과를 먼저, 지역 버튼은 그 아래
      h += `<p class="muted small">전국 목록 ${GL.count}곳 · ${esc(GL.updated)} 기준 · 출처: 공공데이터포털(각 지자체·시설관리공단). 아직 자료가 없는 지역도 있어서 목록에 없는 곳이 있을 수 있어요.</p>`;
    }
    if (s.loading) return h + `<p class="muted"><span class="spinner"></span> 찾는 중…</p>`;
    if (s.err) h += `<div class="note bad">${esc(s.err)}</div>`;
    if (s.results) {
      if (!s.results.length) h += `<div class="note warn"><b>지도에서도 찾지 못했어요</b>동네 이름만 넣어 보거나, '직접 입력해서 추가'를 눌러 주세요.</div>`;
      else h += `<h3>지도에서 찾은 곳 (${s.results.length}곳) — 눌러서 추가</h3><ul class="list">${s.results.map((r, i) => {
        const have = db.courses.find(c => c.name === r.name);
        return `<li><button class="item" data-act="cs-add" data-i="${i}"><span class="ico">${I(have ? 'check' : 'plus')}</span><span class="main"><span class="title">${esc(r.name)}</span><span class="sub">${esc(r.address || '')}${r.dist != null ? ` · ${r.dist.toFixed(1)}km` : ''}</span></span></button></li>`;
      }).join('')}</ul>`;
    }
    return h;
  }
  const paintResults = () => { const el = $('#cs-results'); if (el) el.innerHTML = searchResultsHtml(); };
  async function runOsm(q) {
    searchState.loading = true; paintResults();
    try { searchState.results = await WX.searchCourses(q); searchState.err = ''; } catch (e) { searchState.err = '인터넷 연결을 확인해 주세요.'; }
    searchState.loading = false; paintResults();
  }
  acts['cs-search'] = async () => {
    const q = $('#cs-q').value.trim();
    if (!q && !searchState.region) return toast('찾을 이름이나 지역을 넣어 주세요');
    Object.assign(searchState, { q, limit: 20, results: null, near: null, err: '' });
    const g = await loadGL();
    if (g && g.items && PG.findCourses(g.items, q, searchState.region).length) return paintResults();
    if (!q) return paintResults();
    runOsm(q); // 목록에 없으면 지도에서도 찾기
  };
  acts['cs-osm'] = () => { if (searchState.q) runOsm(searchState.q); };
  acts['cs-region'] = el => {
    const v = el.dataset.v; searchState.region = searchState.region === v ? '' : v;
    Object.assign(searchState, { limit: 20, results: null, near: null, err: '', q: ($('#cs-q') || {}).value ? $('#cs-q').value.trim() : '' });
    paintResults();
  };
  acts['cs-more'] = () => { searchState.limit += 30; paintResults(); };
  acts['cs-near'] = () => {
    if (!navigator.geolocation) return toast('위치 기능을 쓸 수 없어요');
    Object.assign(searchState, { results: null, near: null, err: '', loading: true }); paintResults();
    navigator.geolocation.getCurrentPosition(async pos => {
      const g = await loadGL(), la = pos.coords.latitude, lo = pos.coords.longitude;
      if (g && g.items) {
        searchState.near = g.items.filter(x => x.la != null).map(x => ({ x, d: WX.distKm(la, lo, x.la, x.lo) })).sort((a, b) => a.d - b.d).slice(0, 15);
      } else {
        try { searchState.results = await WX.nearbyCourses(la, lo, 15); } catch (e) { searchState.err = '주변 골프장을 불러오지 못했어요. 잠시 뒤 다시 해 주세요.'; }
      }
      searchState.loading = false; paintResults();
    }, () => { searchState.loading = false; searchState.err = '위치 사용을 허용해 주세요. (휴대폰 설정 → 위치)'; paintResults(); }, { timeout: 15000 });
  };
  function afterAdd(c) {
    if (window._returnTo === 'round-new' && draft) { draft.courseId = c.id; draft.sections = []; setSections(draft, draft.nSec); window._returnTo = null; return go('round-new'); }
    go('course-' + c.id);
  }
  acts['cs-add-local'] = el => {
    const x = (GL && GL.items || []).find(i => i.i === Number(el.dataset.i)); if (!x) return;
    const addr = localAddr(x);
    let c = db.courses.find(k => k.name === x.n && (k.address || '') === addr);
    if (!c) {
      const memo = [x.h && `홀 수: ${x.h}홀${x.cs ? ` (${x.cs}코스)` : ''}`, x.ot && '운영시간: ' + x.ot, x.ct && '휴무일: ' + x.ct, x.fee && '이용요금: ' + x.fee, x.rs && '예약: ' + x.rs, x.rl && '예약 링크: ' + x.rl, x.nt && '※ ' + x.nt].filter(Boolean).join('\n');
      c = { id: uid(), name: x.n, address: addr, lat: x.la != null ? x.la : null, lon: x.lo != null ? x.lo : null, phone: x.tel || '', fav: !db.courses.length, info: { closedDays: x.cd || [], open: x.o || '', close: x.c || '' }, features: {}, memo, approx: !!x.ap };
      db.courses.push(c); save(); toast('내 골프장에 추가했어요');
    }
    afterAdd(c);
  };
  const listToCourse = x => ({ id: 'list' + x.i, name: x.n, lat: x.la != null ? x.la : null, lon: x.lo != null ? x.lo : null, approx: !!x.ap, info: { closedDays: x.cd || [], open: x.o || '', close: x.c || '' }, features: {} });
  acts['ev-course'] = el => acts['cs-add-local'](el); // 전국 목록의 골프장이면 내 골프장에 넣고 그 화면으로
  acts['cs-add'] = el => {
    const r = searchState.results[Number(el.dataset.i)];
    let c = db.courses.find(x => x.name === r.name);
    if (!c) {
      c = { id: uid(), name: r.name, address: r.address, lat: r.lat, lon: r.lon, phone: r.phone || '', fav: !db.courses.length, info: { closedDays: [], open: '', close: '' }, features: {}, memo: r.hours ? '운영시간(지도 정보): ' + r.hours : '' };
      db.courses.push(c); save(); toast('내 골프장에 추가했어요');
    }
    afterAdd(c);
  };
  acts['cs-return'] = el => { const t = window._returnTo; window._returnTo = null; go(t); };

  views.course = id => {
    const c = course(id); if (!c) return views.courses();
    const f = c.features || {}, info = c.info || {};
    const rs = db.rounds.filter(r => r.courseId === c.id);
    const stats = rs.length ? { n: rs.length, avg: PG.avg(rs.map(r => PG.roundTotals(r).per9)), best: Math.min(...rs.map(r => PG.roundTotals(r).diff)) } : null;
    const naver = 'https://map.naver.com/p/search/' + encodeURIComponent(c.name);
    const kakao = c.lat != null ? `https://map.kakao.com/link/map/${encodeURIComponent(c.name)},${c.lat},${c.lon}` : 'https://map.kakao.com/?q=' + encodeURIComponent(c.name);
    const missing = !f.grass || !info.open;
    let html = `<section class="card"><h2 style="font-size:1.25rem">${c.fav ? '' : ''}${esc(c.name)}</h2><p class="muted">${esc(c.address || '주소 없음')}</p>
      <div class="btn-row">${c.phone ? `<a class="btn primary" href="tel:${esc(c.phone.replace(/[^0-9+]/g, ''))}">전화하기</a>` : `<a class="btn ghost" href="#course-edit-${c.id}">전화번호 넣기</a>`}<a class="btn" href="${kakao}" target="_blank" rel="noopener">지도 보기</a></div>
      ${c.phone ? `<p class="center muted small">${esc(c.phone)}</p>` : ''}<p class="center small"><a href="${naver}" target="_blank" rel="noopener">네이버 지도에서 찾기</a></p></section>
      <section class="card"><h2>오늘 운영 상황 (예상)</h2><div id="cwx">${c.lat != null ? '<p class="muted"><span class="spinner"></span> 날씨를 불러오는 중…</p>' : `<p class="muted">위치가 없어 날씨를 볼 수 없어요.</p><a class="btn block" href="#course-edit-${c.id}">위치 찾기</a>`}</div>
      ${c.approx ? '<p class="muted small">정확한 위치 자료가 없어 이 지역(시·군·구)의 중심 위치로 날씨를 보고 있어요.</p>' : ''}
      <p class="muted small">날씨와 휴장일로 짐작한 것이에요. 대회·공사로 쉴 수도 있으니 가기 전에 꼭 전화로 확인하세요.</p></section>`;
    html += `<section class="card"><h2>골프장 특징</h2>
      ${missing ? `<div class="note info"><b>정보를 채워 주세요</b>잔디·경사·휴장일을 넣으면 운영 예상과 성적 분석이 더 정확해져요.</div>` : ''}
      <div class="wx"><div><span class="k">잔디</span><span class="v">${esc(f.grass || '모름')}</span></div><div><span class="k">경사</span><span class="v">${esc(f.terrain || '모름')}</span></div><div><span class="k">코스 길이</span><span class="v">${esc(f.length || '모름')}</span></div><div><span class="k">강가(하천)</span><span class="v">${f.river ? '예' : '아니요'}</span></div>
      <div><span class="k">휴장일</span><span class="v">${info.closedDays && info.closedDays.length ? info.closedDays.map(d => DOW[d]).join('·') + '요일' : '모름'}</span></div><div><span class="k">운영 시간</span><span class="v">${info.open ? `${esc(info.open)}~${esc(info.close)}` : '모름'}</span></div></div>
      ${c.memo ? `<p style="white-space:pre-wrap">${esc(c.memo)}</p>` : ''}</section>`;
    if (stats) html += `<section class="card"><h2>여기서 친 기록</h2><div class="wx"><div><span class="k">경기 수</span><span class="v">${stats.n}번</span></div><div><span class="k">9홀당 평균</span><span class="v">${PG.signF(stats.avg)}</span></div></div></section>`;
    html += `<button type="button" class="btn ${c.fav ? '' : 'ghost'} block" data-act="c-fav" data-id="${c.id}" style="margin-bottom:10px">${I('star')} ${c.fav ? '자주 가는 곳이에요 (누르면 해제)' : '자주 가는 곳으로 정하기'}</button>
      <div class="btn-row"><a class="btn ghost" href="#course-edit-${c.id}">정보 고치기</a><button class="btn" data-act="c-round" data-id="${c.id}">여기서 친 성적</button></div><div style="height:10px"></div>
      <div class="btn-row"><button class="btn" data-act="c-event" data-id="${c.id}">여기로 일정</button><button class="btn danger" data-act="c-del" data-id="${c.id}">지우기</button></div>`;
    return { title: '골프장 정보', html, back: 'courses', after: () => loadCourseWx(c) };
  };
  async function loadCourseWx(c) {
    const box = $('#cwx'); if (!box || c.lat == null) return;
    try {
      const d = await courseNow(c); const cur = d.w.current; const st = d.status;
      const pm = d.aq && d.aq.current ? WX.pmGrade(d.aq.current.pm10, d.aq.current.pm2_5) : null;
      const ex = d.extra || {}, uv = ex.uv;
      const hours = WX.bestHours(d.w);
      const D = d.w.daily; const todayIdx = D.time.indexOf(today());
      let h = `<div class="status-big ${['good', 'warn', 'bad'][st.level]}"><span class="ico">${I(['smile', 'alert', 'stop'][st.level])}</span><div><div class="t">${st.label}</div></div></div>${st.reasons.map(r => `<p>• ${esc(r)}</p>`).join('')}
        <div class="wx" style="margin-top:12px"><div><span class="k">지금 날씨</span><span class="v">${WX.wxIcon(cur.weather_code)} ${WX.wxName(cur.weather_code)}</span></div><div><span class="k">기온 (체감)</span><span class="v">${Math.round(cur.temperature_2m)}℃ <span class="small">(${Math.round(cur.apparent_temperature)}℃)</span></span></div>
        <div><span class="k">바람</span><span class="v">초속 ${Math.round(cur.wind_speed_10m)}m</span></div><div><span class="k">미세먼지</span><span class="v">${pm ? pm.icon + ' ' + pm.name : '-'}${d.aq && d.aq.current && d.aq.current.pm10 != null ? `<span class="small muted" style="display:block">미세 ${Math.round(d.aq.current.pm10)} · 초미세 ${d.aq.current.pm2_5 != null ? Math.round(d.aq.current.pm2_5) : '-'}</span>` : ''}</span></div>
        ${uv ? `<div><span class="k">자외선 (오늘 최고)</span><span class="v">${esc(uv.todayGrade || uv.nowGrade || '-')}${uv.todayMax != null ? ` <span class="small">(${uv.todayMax})</span>` : ''}</span></div>` : ''}
        ${todayIdx >= 0 ? `<div><span class="k">오늘 최고/최저</span><span class="v">${Math.round(D.temperature_2m_max[todayIdx])}° / ${Math.round(D.temperature_2m_min[todayIdx])}°</span></div><div><span class="k">비 올 확률</span><span class="v">${D.precipitation_probability_max[todayIdx] != null ? D.precipitation_probability_max[todayIdx] + '%' : '-'}</span></div>
        ${D.sunrise ? `<div><span class="k">해 뜨는 시간</span><span class="v">${D.sunrise[todayIdx].slice(11)}</span></div><div><span class="k">해 지는 시간</span><span class="v">${D.sunset[todayIdx].slice(11)}</span></div>` : ''}` : ''}</div>`;
      if (hours.length) { const best = hours.find(x => x.best); h += `<h3>오늘 시간별 날씨 ${best ? `<span class="tag good">${best.hour}시가 가장 좋아요</span>` : ''}</h3><div class="hours">${hours.map(x => `<div class="${x.best ? 'best' : ''}"><b>${x.hour}시</b><br>${WX.wxIcon(x.code)}<br>${Math.round(x.temp)}℃<br><span class="muted">비 ${x.pop}%</span></div>`).join('')}</div>`; }
      const fut = D.time.map((t, i) => ({ t, i })).filter(x => x.t > today()).slice(0, 3);
      if (fut.length) h += `<h3>앞으로 ${fut.length}일</h3><div class="hours">${fut.map(({ t, i }) => `<div style="min-width:96px"><b>${fmtDate(t).replace(/^\d+월 /, '')}</b><br>${WX.wxIcon(D.weather_code[i])} ${WX.wxName(D.weather_code[i])}<br>${Math.round(D.temperature_2m_min[i])}°/${Math.round(D.temperature_2m_max[i])}°<br><span class="muted">비 ${D.precipitation_probability_max[i] != null ? D.precipitation_probability_max[i] : '-'}%</span></div>`).join('')}</div>`;
      const lastFut = fut.length ? fut[fut.length - 1].t : today();
      const mid = ex.mid && ex.mid.days ? ex.mid.days.filter(x => x.date > lastFut).slice(0, 7) : [];
      if (mid.length) h += `<h3>그 뒤 ${mid.length}일 <span class="muted small">(중기예보)</span></h3><div class="hours">${mid.map(x => `<div style="min-width:96px"><b>${fmtDate(x.date).replace(/^\d+월 /, '')}</b><br>${x.code != null ? WX.wxIcon(x.code) + ' ' + WX.wxName(x.code) : esc(x.wfPm || x.wfAm)}<br>${x.min != null ? Math.round(x.min) : '-'}°/${x.max != null ? Math.round(x.max) : '-'}°<br><span class="muted">비 ${x.pop != null ? x.pop : '-'}%</span></div>`).join('')}</div>`;
      h += `<p class="muted small">날씨 자료: ${d.w.source === 'kma' ? '기상청 단기예보' : 'Open-Meteo (세계 기상 예보)'}${mid.length ? '·중기예보' : ''} · 미세먼지: ${d.aq && d.aq.source === 'airkorea' ? `에어코리아 (${esc(d.aq.station)} 측정소${d.aq.time ? ', ' + esc(d.aq.time.slice(11)) + ' 기준' : ''})` : 'Open-Meteo'}${uv ? ' · 자외선: 기상청' : ''}</p>`;
      if (d.w.source !== 'kma' && d.kmaErr) h += `<div class="note warn"><b>기상청 연결이 안 되어 기본 날씨를 보여 줘요</b>${esc(d.kmaErr)}<br><span class="small">설정 → 서버 연결에서 ‘저장하고 확인’을 눌러 보세요.</span></div>`;
      else if (d.w.source !== 'kma' && !srvOn()) h += `<p class="muted small">기상청 날씨를 쓰려면 설정 → 서버 연결에 서버 주소를 넣어 주세요.</p>`;
      box.innerHTML = h;
    } catch (e) { box.innerHTML = `<div class="note bad"><b>날씨를 불러오지 못했어요</b>인터넷 연결을 확인하고 다시 열어 주세요.</div>`; }
  }
  acts['c-fav'] = el => {
    const c = course(el.dataset.id); if (!c) return;
    const on = !c.fav; db.courses.forEach(x => { x.fav = false; }); c.fav = on; save();
    toast(on ? `‘${c.name}’을(를) 자주 가는 곳으로 정했어요` : '자주 가는 곳을 해제했어요');
    const y = window.scrollY; render(); window.scrollTo(0, y);
  };
  acts['c-round'] = el => { const c = course(el.dataset.id); const rs = db.rounds.filter(r => r.courseId === c.id); if (!rs.length) { draft = null; window._roundPrefill = { courseId: c.id }; return go('round-new'); } go('rounds'); };
  acts['c-event'] = el => { evDraft = null; window._eventPrefill = { courseId: el.dataset.id }; go('event-new'); };
  acts['c-del'] = async el => { if (await ask('이 골프장을 지울까요?', '성적 기록은 남아 있어요.', '지우기', true)) { db.courses = db.courses.filter(c => c.id !== el.dataset.id); save(); go('courses'); } };

  let cdraft = null;
  views['course-new'] = () => { cdraft = { id: '', name: '', address: '', lat: null, lon: null, phone: '', fav: !db.courses.length, info: { closedDays: [], open: '', close: '' }, features: {}, memo: '' }; return courseForm('골프장 직접 추가', 'courses'); };
  views['course-edit'] = id => { const c = course(id); if (!c) return views.courses(); cdraft = JSON.parse(JSON.stringify(c)); cdraft.info = Object.assign({ closedDays: [], open: '', close: '' }, cdraft.info); cdraft.features = cdraft.features || {}; return courseForm('골프장 정보 고치기', 'course-' + id); };
  function courseForm(title, back) {
    const c = cdraft, f = c.features, info = c.info;
    const seg = (k, opts) => `<div class="seg">${opts.map(o => `<button type="button" class="chip" data-act="cf-feat" data-k="${k}" data-v="${o}" aria-pressed="${f[k] === o}">${o}</button>`).join('')}</div>`;
    const html = `<section class="card">
      <label class="field"><span>골프장 이름</span><input type="text" id="cf-name" value="${esc(c.name)}" placeholder="예) 한강 OO파크골프장"></label>
      <label class="field"><span>주소 (동네 이름만 넣어도 돼요)</span><input type="text" id="cf-addr" value="${esc(c.address)}"></label>
      <button type="button" class="btn block" data-act="cf-locate">위치 찾기 ${c.lat != null ? '<span class="tag good">찾음</span>' : ''}</button>
      <div id="cf-loc"></div>
      <div style="height:14px"></div>
      <label class="field"><span>전화번호</span><input type="tel" id="cf-phone" value="${esc(c.phone)}" placeholder="예) 02-123-4567"></label>
      <button type="button" class="check" data-act="cf-fav" aria-pressed="${!!c.fav}"><span class="box">${c.fav ? '✓' : ''}</span><span class="lbl">자주 가는 곳 (처음 화면에 날씨 보이기)</span></button>
    </section>
    <section class="card"><h2>운영 정보</h2>
      <label class="field"><span>정기 휴장일 (여러 개 가능)</span></label>
      <div class="chips" style="margin-bottom:14px">${DOW.map((d, i) => `<button type="button" class="chip" data-act="cf-day" data-v="${i}" aria-pressed="${info.closedDays.includes(i)}">${d}</button>`).join('')}</div>
      <div class="btn-row"><label class="field"><span>여는 시간</span><input type="time" id="cf-open" value="${esc(info.open)}"></label><label class="field"><span>닫는 시간</span><input type="time" id="cf-close" value="${esc(info.close)}"></label></div>
    </section>
    <section class="card"><h2>코스 특징 (분석에 쓰여요)</h2>
      <h3>잔디</h3>${seg('grass', ['천연잔디', '인조잔디'])}
      <h3>경사</h3>${seg('terrain', ['평지', '보통', '경사 많음'])}
      <h3>코스 길이</h3>${seg('length', ['짧은 편', '보통', '긴 편'])}
      <div style="height:12px"></div>
      <button type="button" class="check" data-act="cf-river" aria-pressed="${!!f.river}"><span class="box">${f.river ? '✓' : ''}</span><span class="lbl">강가·하천 옆이에요 (바람·침수 영향)</span></button>
      <label class="field"><span>메모</span><textarea id="cf-memo" placeholder="예) 주차장 넓음, 3번 홀 그린 빠름">${esc(c.memo)}</textarea></label>
    </section>
    <button type="button" class="btn primary block xl" data-act="cf-save">저장</button>`;
    return { title, html, back };
  }
  function readCourse() {
    const g = id => document.getElementById(id);
    cdraft.name = g('cf-name').value.trim(); cdraft.address = g('cf-addr').value.trim(); cdraft.phone = g('cf-phone').value.trim();
    cdraft.info.open = g('cf-open').value; cdraft.info.close = g('cf-close').value; cdraft.memo = g('cf-memo').value;
  }
  // 다시 그릴 때 cdraft 를 유지하려고 별도 처리
  const keepC = fn => el => { readCourse(); fn(el); const y = window.scrollY; const saved = cdraft; const r = parse(); const v = r.name === 'course-new' ? courseForm('골프장 직접 추가', 'courses') : courseForm('골프장 정보 고치기', 'course-' + r.id); cdraft = saved; app.innerHTML = v.html; window.scrollTo(0, y); };
  acts['cf-feat'] = keepC(el => { const k = el.dataset.k; cdraft.features[k] = cdraft.features[k] === el.dataset.v ? '' : el.dataset.v; });
  acts['cf-river'] = keepC(() => { cdraft.features.river = !cdraft.features.river; });
  acts['cf-fav'] = keepC(() => { cdraft.fav = !cdraft.fav; });
  acts['cf-day'] = keepC(el => { const v = Number(el.dataset.v), a = cdraft.info.closedDays, i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); });
  acts['cf-locate'] = async () => {
    readCourse();
    const q = [cdraft.name, cdraft.address].filter(Boolean).join(' ');
    if (!q) return toast('이름이나 주소를 먼저 넣어 주세요');
    const box = $('#cf-loc'); box.innerHTML = '<p class="muted"><span class="spinner"></span> 찾는 중…</p>';
    try {
      let res = await WX.searchCourses(q);
      if (!res.length && cdraft.address) res = await WX.searchCourses(cdraft.address);
      if (!res.length) { box.innerHTML = '<div class="note warn"><b>찾지 못했어요</b>주소를 동네 이름(예: 서초구 반포동)으로 바꿔 보세요.</div>'; return; }
      box.innerHTML = `<p><b>맞는 곳을 눌러 주세요</b></p><ul class="list">${res.slice(0, 6).map((r, i) => `<li><button class="item" data-act="cf-pick" data-i="${i}"><span class="ico">${I('pin')}</span><span class="main"><span class="title">${esc(r.name)}</span><span class="sub">${esc(r.address)}</span></span></button></li>`).join('')}</ul>`;
      window._locRes = res;
    } catch (e) { box.innerHTML = '<div class="note bad">인터넷 연결을 확인해 주세요.</div>'; }
  };
  acts['cf-pick'] = keepC(el => { const r = window._locRes[Number(el.dataset.i)]; cdraft.lat = r.lat; cdraft.lon = r.lon; if (!cdraft.address) cdraft.address = r.address; if (!cdraft.name) cdraft.name = r.name; toast('위치를 찾았어요'); });
  acts['cf-save'] = () => {
    readCourse();
    if (!cdraft.name) return toast('골프장 이름을 넣어 주세요');
    if (cdraft.fav) db.courses.forEach(c => { if (c.id !== cdraft.id) c.fav = false; });
    if (!cdraft.id) { cdraft.id = uid(); db.courses.push(cdraft); } else { const i = db.courses.findIndex(c => c.id === cdraft.id); db.courses[i] = cdraft; }
    // 성적의 골프장 이름도 같이 맞춤
    db.rounds.forEach(r => { if (r.courseId === cdraft.id) r.courseName = cdraft.name; });
    save(); const id = cdraft.id; cdraft = null; toast('저장했어요');
    if (window._returnTo === 'round-new' && draft) { draft.courseId = id; draft.sections = []; setSections(draft, draft.nSec); window._returnTo = null; return go('round-new'); }
    go('course-' + id);
  };

  /* ════════════════ 일정 ════════════════ */
  const EV_ICON = { 대회: I('trophy'), 모임: I('users'), 연습: I('flag'), 기타: I('pin') };
  views.schedule = () => {
    const all = allEvents();
    const up = all.filter(e => e.date >= today()).sort(byWhen);
    const past = all.filter(e => e.date < today() && !e.cal).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
    let html = `<a class="btn primary block xl" href="#event-new">＋ 일정 추가하기</a>`;
    if (calOn()) {
      const c = db.calCache;
      html += `<div class="note info" id="calStatus"><b>삼성 캘린더 자동 연결 중</b>${c ? `파크골프 일정 ${c.events.length}개 · ${agoText(c.at)} 확인` : '일정을 불러오는 중…'} <button type="button" class="btn ghost" data-act="cal-refresh" style="min-height:44px;margin-top:8px;display:flex">지금 다시 확인</button></div>`;
    } else if (srvOn()) html += `<div class="note warn"><b>삼성 캘린더를 자동으로 가져올 수 있어요</b>설정 → 삼성 캘린더 자동 연결에서 구글 캘린더 주소를 한 번만 넣으면 돼요. <a href="#more">설정으로 가기</a></div>`;
    const card = e => {
      const rec = !e.cal && e.type === '대회' && e.date <= today() && !db.rounds.find(r => r.eventId === e.id);
      return `<section class="card"><div class="ev-head"><span class="ev-ico">${EV_ICON[e.type] || EV_ICON["기타"]}</span><span class="dday">${dday(e.date)}</span></div><p class="big" style="margin:10px 0 2px">${esc(e.title)}</p><p style="margin:0;font-weight:600">${fmtDate(e.date)} ${fmtTime(e.time)}</p>${e.place ? `<p class="muted" style="margin:0">${esc(e.place)}</p>` : ''}
        ${e.memo ? `<p class="muted small" style="white-space:pre-wrap">${esc(e.memo)}</p>` : ''}
        <div style="height:10px"></div>
        ${courseBtn(e)}
        ${e.cal ? `<p class="muted small" style="margin:0"><span class="tag info">캘린더</span> 삼성·구글 캘린더에서 가져왔어요${e.repeat ? ' (반복 일정)' : ''}. 고치려면 캘린더에서 고쳐 주세요.</p></section>` : ''}
        ${e.cal ? '' : ''}${!e.cal && e.date >= today() ? `<div class="btn-row"><button class="btn" data-act="ev-ics" data-id="${e.id}">삼성 캘린더</button><a class="btn" href="${gcalUrl(e)}" target="_blank" rel="noopener">구글 캘린더</a></div><div style="height:10px"></div>` : ''}
        ${rec ? `<button class="btn primary block" data-act="ev-record" data-id="${e.id}">이 대회 성적 기록하기</button><div style="height:10px"></div>` : ''}
        ${e.cal ? '' : `<div class="btn-row"><a class="btn ghost" href="#event-edit-${e.id}">고치기</a><button class="btn danger" data-act="ev-del" data-id="${e.id}">지우기</button></div></section>`}`;
    };
    if (up.length) html += `<h2 class="section-title">다가오는 일정 (${up.length})</h2>${up.map(card).join('')}`;
    else html += `<div class="empty"><span class="ico">${I('cal')}</span>다가오는 파크골프 일정이 없어요.</div>`;
    html += `<section class="card"><h2>삼성 캘린더와 연결</h2>
      <p>일정마다 <b>‘삼성 캘린더’</b> 버튼을 누르면 캘린더에 넣을 수 있어요.</p>
      <div class="btn-row" style="margin:12px 0"><button class="btn" data-act="ev-ics-all" ${up.length ? '' : 'disabled'}>모든 일정 한 번에</button><label class="btn" for="ev-import" style="cursor:pointer">캘린더에서 가져오기</label></div>
      <input type="file" id="ev-import" accept=".ics,text/calendar" hidden>
      <details><summary style="cursor:pointer;font-weight:800;min-height:48px">자세한 방법 보기</summary>
      <p><b>넣기:</b> 버튼을 누르면 ‘공유’ 창이 뜨면 <b>캘린더</b>를 고르세요. 파일이 내려받아지면 알림창에서 파일을 눌러 <b>캘린더</b>로 열고 ‘저장’을 누르면 돼요. 알림(하루 전·2시간 전)도 같이 들어가요.</p>
      <p><b>구글 캘린더:</b> 삼성 캘린더에 구글 계정이 연결돼 있다면 ‘구글 캘린더’로 넣어도 삼성 캘린더에 같이 보여요.</p>
      <p><b>가져오기:</b> 삼성 캘린더 일정을 파일(.ics)로 내보낸 뒤 ‘캘린더에서 가져오기’로 고르면 <b>파크골프·골프·대회</b>가 들어간 일정만 골라서 가져와요.</p>
      <p class="muted small">휴대폰 보안 때문에 이 앱이 삼성 캘린더를 직접 읽거나 바꾸지는 못해요.</p></details></section>`;
    if (past.length) html += `<h2 class="section-title">지난 일정</h2>${past.map(card).join('')}`;
    return { title: '파크골프 일정', html, after: () => { $('#ev-import').addEventListener('change', importIcs); const had = GL !== null; loadGL().then(() => { if (!had && parse().name === 'schedule') render(); }); if (calOn()) refreshCal(false); } };
  };
  async function refreshCal(force) {
    const st = () => $('#calStatus');
    try {
      const before = db.calCache && db.calCache.at;
      const c = await syncCal(force);
      if (parse().name !== 'schedule') return;
      if (c && (c.at !== before)) render(); // 새 일정이 있으면 화면을 다시 그림
      else if (st() && c) st().querySelector('b').nextSibling.textContent = `파크골프 일정 ${c.events.length}개 · ${agoText(c.at)} 확인 `;
    } catch (e) {
      if (st()) st().className = 'note bad', st().innerHTML = `<b>캘린더를 가져오지 못했어요</b>${esc(e.message)} <button type="button" class="btn ghost" data-act="cal-refresh" style="min-height:44px;margin-top:8px;display:flex">다시 시도</button>`;
    }
  }
  acts['cal-refresh'] = el => { el.disabled = true; el.textContent = '확인하는 중…'; refreshCal(true); };
  function gcalUrl(e) {
    const [s, en] = evTimes(e);
    const f = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates: `${f(s)}/${f(en)}`, location: e.place || '', details: (e.memo || '') + '\n(파크골프 수첩에서 추가)', ctz: 'Asia/Seoul' });
  }
  function evTimes(e) {
    const s = new Date(`${e.date}T${e.time || '09:00'}:00+09:00`);
    let en = e.end ? new Date(`${e.date}T${e.end}:00+09:00`) : new Date(s.getTime() + 4 * 3600000);
    if (en <= s) en = new Date(s.getTime() + 4 * 3600000);
    return [s, en];
  }
  function icsFor(events) {
    const f = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const fold = s => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const al = db.settings.alarms || [];
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//parkgolf-note//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    for (const e of events) {
      const [s, en] = evTimes(e);
      lines.push('BEGIN:VEVENT', `UID:${e.id}@parkgolf-note`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(s)}`, `DTEND:${f(en)}`, `SUMMARY:${fold('' + e.title)}`);
      if (e.place) lines.push(`LOCATION:${fold(e.place)}`);
      lines.push(`DESCRIPTION:${fold((e.memo || '') + '\n파크골프 수첩에서 추가한 일정')}`, 'CATEGORIES:파크골프');
      if (al.includes('1d')) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${fold('내일 ' + e.title)}`, 'TRIGGER:-P1D', 'END:VALARM');
      if (al.includes('2h')) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${fold(e.title)}`, 'TRIGGER:-PT2H', 'END:VALARM');
      lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }
  async function sendIcs(events, name) {
    const text = icsFor(events);
    try {
      const file = new File([text], name, { type: 'text/calendar' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: '파크골프 일정' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    download(name, text, 'text/calendar');
    toast('캘린더 파일을 받았어요. 알림창에서 파일을 눌러 캘린더로 여세요.', 4500);
  }
  acts['ev-ics'] = el => { const e = byId(db.events, el.dataset.id); sendIcs([e], `parkgolf-${e.date}.ics`); };
  acts['ev-ics-all'] = () => sendIcs(db.events.filter(e => e.date >= today()), 'parkgolf-schedule.ics');
  acts['ev-del'] = async el => { if (await ask('이 일정을 지울까요?', '삼성 캘린더에 넣은 일정은 캘린더에서 따로 지워 주세요.', '지우기', true)) { db.events = db.events.filter(e => e.id !== el.dataset.id); save(); render(); } };
  acts['ev-record'] = el => { const e = byId(db.events, el.dataset.id); draft = null; window._roundPrefill = { kind: '대회', title: e.title, date: e.date, courseId: e.courseId || '', eventId: e.id }; go('round-new'); };

  function parseIcs(text) {
    const raw = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
    const out = []; let cur = null, inAlarm = false;
    const un = s => s.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
    for (const line of raw) {
      if (line === 'BEGIN:VALARM') inAlarm = true;       // 알림 안의 DESCRIPTION(예: 'This is an event reminder')은 일정 메모가 아님
      else if (line === 'END:VALARM') inAlarm = false;
      else if (inAlarm) continue;
      else if (line === 'BEGIN:VEVENT') cur = {};
      else if (line === 'END:VEVENT') { if (cur) out.push(cur); cur = null; }
      else if (cur) {
        const i = line.indexOf(':'); if (i < 0) continue;
        const key = line.slice(0, i).split(';')[0].toUpperCase(), params = line.slice(0, i), val = line.slice(i + 1);
        if (key === 'SUMMARY') cur.title = un(val);
        else if (key === 'LOCATION') cur.place = un(val);
        else if (key === 'DESCRIPTION') cur.memo = un(val);
        else if (key === 'UID') cur.uid = val;
        else if (key === 'DTSTART' || key === 'DTEND') {
          const m = val.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/); if (!m) continue;
          let d;
          if (!m[4]) d = { date: `${m[1]}-${m[2]}-${m[3]}`, time: '' };
          else {
            let dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
            if (m[7]) dt = new Date(dt.getTime() + 9 * 3600000); // UTC → 한국 시간
            else if (!/TZID=Asia\/Seoul/i.test(params) && /TZID=/i.test(params)) { /* 다른 시간대는 그대로 둠 */ }
            const iso = dt.toISOString();
            d = { date: iso.slice(0, 10), time: iso.slice(11, 16) };
          }
          if (key === 'DTSTART') { cur.date = d.date; cur.time = d.time; } else cur.end = d.time;
        }
      }
    }
    return out.filter(e => e.date && e.title);
  }
  async function importIcs(ev) {
    const file = ev.target.files[0]; if (!file) return;
    const text = await file.text();
    const all = parseIcs(text);
    const re = /파크|골프|파골|대회|라운딩/;
    const pick = all.filter(e => re.test(e.title + ' ' + (e.place || '')));
    let n = 0;
    for (const e of pick) {
      if (db.events.find(x => (x.uid && x.uid === e.uid) || (x.title.replace(/^⛳ /, '') === e.title.replace(/^⛳ /, '') && x.date === e.date))) continue;
      const type = /대회/.test(e.title) ? '대회' : /모임|동호회|회원/.test(e.title) ? '모임' : '연습';
      db.events.push({ id: uid(), uid: e.uid, type, title: e.title.replace(/^⛳ /, ''), date: e.date, time: e.time, end: e.end || '', place: e.place || '', memo: e.memo || '', courseId: '' });
      n++;
    }
    save();
    toast(`일정 ${all.length}개 중 파크골프 일정 ${n}개를 가져왔어요`, 4000);
    render();
  }

  let evDraft = null;
  views['event-new'] = () => { evDraft = Object.assign({ id: '', type: '대회', title: '', date: today(), time: '09:00', end: '', courseId: '', place: '', memo: '' }, window._eventPrefill || {}); window._eventPrefill = null; if (evDraft.courseId) evDraft.place = (course(evDraft.courseId) || {}).name || ''; return eventForm('일정 추가', 'schedule'); };
  views['event-edit'] = id => { const e = byId(db.events, id); if (!e) return views.schedule(); evDraft = JSON.parse(JSON.stringify(e)); return eventForm('일정 고치기', 'schedule'); };
  function eventForm(title, back) {
    const e = evDraft;
    const html = `<section class="card">
      <label class="field"><span>어떤 일정인가요?</span></label>
      <div class="seg" style="margin-bottom:14px">${Object.keys(EV_ICON).map(k => `<button type="button" class="chip" data-act="ef-type" data-v="${k}" aria-pressed="${e.type === k}">${EV_ICON[k]}<br>${k}</button>`).join('')}</div>
      <label class="field"><span>제목</span><input type="text" id="ef-title" value="${esc(e.title)}" placeholder="예) 시장배 파크골프 대회"></label>
      <label class="field"><span>날짜</span><input type="date" id="ef-date" value="${esc(e.date)}"></label>
      <div class="btn-row"><label class="field"><span>시작 시간</span><input type="time" id="ef-time" value="${esc(e.time)}"></label><label class="field"><span>끝 시간</span><input type="time" id="ef-end" value="${esc(e.end)}"></label></div>
      <label class="field"><span>장소</span><input type="text" id="ef-place" value="${esc(e.place)}" list="ef-courses" placeholder="골프장 이름"><datalist id="ef-courses">${db.courses.map(c => `<option value="${esc(c.name)}">`).join('')}</datalist></label>
      <label class="field"><span>메모 (준비물, 모이는 곳 등)</span><textarea id="ef-memo">${esc(e.memo)}</textarea></label>
    </section>
    <button type="button" class="btn primary block xl" data-act="ef-save">저장</button>
    <p class="muted small center">저장한 뒤 ‘삼성 캘린더’ 버튼으로 휴대폰 캘린더에 넣을 수 있어요.</p>`;
    return { title, html, back, after: () => {
      // 장소 칸 제안에 전국 골프장 이름도 넣기 (입력해 둔 글자는 그대로)
      const fillList = () => { const dl = $('#ef-courses'); if (!dl) return; const names = [...new Set([...db.courses.map(c => c.name), ...((GL && GL.items) || []).map(x => x.n)])]; dl.innerHTML = names.map(n => `<option value="${esc(n)}">`).join(''); };
      loadGL().then(fillList);
      // 제목에 골프장 이름이 들어 있고 장소가 비어 있으면 장소를 자동으로 채움
      const t = $('#ef-title'), pl = $('#ef-place');
      const guess = () => { if (!pl.value.trim()) { const m = courseFor({ title: t.value, place: '' }); const nm = m && (m.mine ? m.mine.name : m.item.n); if (nm) { pl.value = nm; toast(`장소를 ‘${nm}’(으)로 넣었어요`); } } };
      t.addEventListener('change', guess);
    } };
  }
  acts['ef-type'] = el => { evDraft.type = el.dataset.v; document.querySelectorAll('[data-act="ef-type"]').forEach(b => b.setAttribute('aria-pressed', b === el)); };
  acts['ef-save'] = () => {
    const g = id => document.getElementById(id); const e = evDraft;
    e.date = g('ef-date').value; e.time = g('ef-time').value; e.end = g('ef-end').value; e.place = g('ef-place').value.trim(); e.memo = g('ef-memo').value;
    e.title = g('ef-title').value.trim() || `${e.place ? e.place + ' ' : ''}파크골프 ${e.type}`;
    if (!e.date) return toast('날짜를 골라 주세요');
    const c = db.courses.find(x => x.name === e.place); e.courseId = c ? c.id : '';
    if (!e.id) { e.id = uid(); db.events.push(e); } else { const i = db.events.findIndex(x => x.id === e.id); db.events[i] = e; }
    save(); evDraft = null;
    toast('저장했어요');
    go('schedule');
  };

  /* ════════════════ 준비물 ════════════════ */
  const ITEMS = ['파크골프채(클럽)', '공 (여분 1~2개)', '티(공 받침)', '장갑', '모자', '물·음료', '간식 (바나나·사탕)', '수건', '선크림', '회원증·신분증', '상비약 (혈압약 등)', '휴대폰 충전'];
  views.checklist = () => {
    if (db.checklist.date !== today()) db.checklist = { date: today(), checked: {} };
    const fav = db.courses.find(c => c.fav) || db.courses[0];
    const all = ITEMS.concat(db.settings.extraItems || []);
    const html = `<section class="card"><h2>오늘 챙길 것</h2><p class="muted small" style="margin-top:0">챙긴 것은 눌러서 표시하세요. 내일이 되면 다시 비워져요.</p>
      ${all.map(it => `<button type="button" class="check" data-act="ck" data-v="${esc(it)}" aria-pressed="${!!db.checklist.checked[it]}"><span class="box">${db.checklist.checked[it] ? '✓' : ''}</span><span class="lbl">${esc(it)}</span></button>`).join('')}
      <div class="row" style="margin-top:12px"><input type="text" id="ck-new" placeholder="더 넣을 물건" style="flex:1;min-width:0"><button class="btn" data-act="ck-add">추가</button></div></section>
      ${fav ? `<section class="card"><h2>오늘 날씨에 맞춰 더 챙기세요</h2><div id="ck-wx"><p class="muted"><span class="spinner"></span> 불러오는 중…</p></div></section>` : ''}
      <button class="btn ghost block" data-act="ck-reset">모두 비우기</button>`;
    return { title: '준비물 챙기기', html, after: async () => {
      const box = $('#ck-wx'); if (!box || !fav || fav.lat == null) { if (box) box.innerHTML = '<p class="muted">자주 가는 골프장 위치가 있으면 날씨에 맞는 준비물을 알려 드려요.</p>'; return; }
      try {
        const d = await courseNow(fav); const D = d.w.daily, i = D.time.indexOf(today());
        const tips = [];
        if (D.precipitation_probability_max[i] >= 40) tips.push('우산·우비 (비 올 확률 ' + D.precipitation_probability_max[i] + '%)');
        if (D.temperature_2m_max[i] >= 28) tips.push('물 넉넉히, 쿨토시·양산');
        if (D.temperature_2m_min[i] <= 5) tips.push('핫팩·두꺼운 장갑·목도리');
        const uvMax = d.extra && d.extra.uv && d.extra.uv.todayMax != null ? d.extra.uv.todayMax : (D.uv_index_max ? D.uv_index_max[i] : null);
        if (uvMax >= 6) tips.push('선크림·선글라스·챙 넓은 모자 (자외선 강함)');
        if (D.wind_speed_10m_max[i] >= 7) tips.push('바람막이 (바람 강함)');
        if (d.aq && d.aq.current && WX.pmGrade(d.aq.current.pm10, d.aq.current.pm2_5).g >= 3) tips.push('마스크 (미세먼지 나쁨)');
        box.innerHTML = `<p class="muted small" style="margin-top:0">${esc(fav.name)} 기준</p>` + (tips.length ? tips.map(t => `<div class="note info">${esc(t)}</div>`).join('') : '<p>오늘은 날씨가 무난해요. 기본 준비물만 챙기세요.</p>');
      } catch (e) { box.innerHTML = '<p class="muted">날씨를 불러오지 못했어요.</p>'; }
    } };
  };
  acts.ck = el => { const v = el.dataset.v; db.checklist.checked[v] = !db.checklist.checked[v]; save(); el.setAttribute('aria-pressed', db.checklist.checked[v]); el.querySelector('.box').textContent = db.checklist.checked[v] ? '✓' : ''; };
  acts['ck-add'] = () => { const v = $('#ck-new').value.trim(); if (!v) return; db.settings.extraItems = [...(db.settings.extraItems || []), v]; save(); rerenderKeep(); };
  acts['ck-reset'] = () => { db.checklist = { date: today(), checked: {} }; save(); render(); };

  /* ════════════════ 몸풀기 ════════════════ */
  const STRETCH = [
    ['목 돌리기', '천천히 오른쪽으로 5번, 왼쪽으로 5번 돌려요. 어지러우면 멈추세요.'],
    ['어깨 으쓱', '어깨를 귀까지 올렸다가 툭 떨어뜨려요. 10번.'],
    ['팔 앞으로 뻗기', '깍지를 끼고 팔을 앞으로 쭉 뻗어 10초 버텨요. 3번.'],
    ['허리 비틀기', '클럽을 어깨 뒤에 걸고 천천히 좌우로 몸통을 돌려요. 양쪽 10번.'],
    ['손목 털기', '손목을 가볍게 털고 돌려요. 안쪽·바깥쪽 10번씩.'],
    ['무릎 굽혔다 펴기', '의자나 클럽을 짚고 무릎을 살짝 굽혔다 펴요. 10번.'],
    ['발목 돌리기', '한 발씩 발끝을 땅에 대고 발목을 돌려요. 양쪽 10번.'],
    ['연습 스윙', '힘을 빼고 반만 휘두르는 스윙 10번, 마지막에 연습 퍼팅 5번.']
  ];
  views.stretch = () => ({
    title: '몸풀기 체조',
    html: `<div class="note info"><b>경기 전 10분</b>다치지 않게 천천히, 아프면 바로 멈추세요.</div>${STRETCH.map(([t, d], i) => `<section class="card"><h2>${i + 1}. ${t}</h2><p>${d}</p></section>`).join('')}<button class="btn primary block xl" data-act="st-speak">소리로 따라 하기</button>`
  });
  acts['st-speak'] = () => speak('몸풀기 체조를 시작합니다. ' + STRETCH.map(([t, d], i) => `${i + 1}번, ${t}. ${d}`).join(' '));

  /* ════════════════ 설정·백업 ════════════════ */
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
  views.more = () => {
    const s = db.settings;
    const html = `<section class="card"><h2>내 이름</h2><p class="muted small" style="margin-top:0">내기에서 '나'로 표시되고, 처음 화면에서 불러 드려요.</p><div class="row"><input type="text" id="st-name" value="${esc(s.name)}" style="flex:1;min-width:0" placeholder="예) 김순자"><button class="btn primary" data-act="st-name">저장</button></div></section>
    <section class="card"><h2>글자 크기</h2><div class="seg">${[['normal', '보통'], ['big', '크게'], ['huge', '아주 크게']].map(([v, l]) => `<button class="chip" data-act="st-size" data-v="${v}" aria-pressed="${s.size === v}">${l}</button>`).join('')}</div>
      <h3>화면 밝기</h3><div class="seg">${[['light', '밝게'], ['dark', '어둡게'], ['auto', '휴대폰 따라']].map(([v, l]) => `<button class="chip" data-act="st-theme" data-v="${v}" aria-pressed="${s.theme === v}">${l}</button>`).join('')}</div></section>
    <section class="card"><h2>캘린더 알림</h2><p class="muted small" style="margin-top:0">삼성 캘린더에 넣을 때 같이 넣을 알림</p><div class="chips">${[['1d', '하루 전'], ['2h', '2시간 전']].map(([v, l]) => `<button class="chip" data-act="st-alarm" data-v="${v}" aria-pressed="${(s.alarms || []).includes(v)}">${l}</button>`).join('')}</div></section>
    <section class="card"><h2>서버 연결 (기상청 날씨·AI 코치)</h2>
      <p class="muted small" style="margin-top:0">기본 서버가 이미 들어 있어서 따로 넣지 않아도 기상청 날씨가 나와요. 다른 서버를 쓰려면 바꾸고, ‘연결 끊기’를 누르면 기본 날씨(Open-Meteo)만 써요.</p>
      <label class="field"><span>서버 주소</span><input type="text" id="srv-url" inputmode="url" autocapitalize="off" spellcheck="false" value="${esc(srvUrl())}" placeholder="https://parkgolf-server.아이디.workers.dev"></label>
      <label class="field"><span>앱 비밀번호 (없으면 비워 두세요)</span><input type="text" id="srv-pass" autocapitalize="off" spellcheck="false" value="${esc((s.server || {}).pass || '')}"></label>
      <div class="btn-row"><button class="btn primary" data-act="srv-save">저장하고 확인</button><button class="btn ghost" data-act="srv-clear">연결 끊기</button></div>
      <div id="srv-status"></div></section>
    <section class="card"><h2>삼성 캘린더 자동 연결 (구글 캘린더 이용)</h2>
      ${srvOn() ? '' : '<div class="note warn"><b>먼저 위의 서버 연결이 필요해요</b>서버 주소를 넣고 저장해 주세요.</div>'}
      <p class="muted small" style="margin-top:0">삼성 캘린더가 구글 계정과 동기화되어 있으면, 구글 캘린더의 <b>비공개 주소</b>를 한 번 넣는 것만으로 파크골프 일정이 앱에 자동으로 나와요. (읽기만 해요)</p>
      <label class="field"><span>구글 캘린더 비공개 주소</span><input type="text" id="cal-url" inputmode="url" autocapitalize="off" spellcheck="false" value="${esc((s.cal || {}).url || '')}" placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"></label>
      <label class="field"><span>가져올 일정의 낱말 (쉼표로 구분)</span><input type="text" id="cal-kw" value="${esc((s.cal || {}).keywords || '')}"></label>
      <div class="btn-row"><button class="btn primary" data-act="cal-save">저장하고 확인</button><button class="btn ghost" data-act="cal-clear">연결 끊기</button></div>
      <div id="cal-status"></div>
      <details style="margin-top:12px"><summary style="cursor:pointer;font-weight:800;min-height:48px">주소 찾는 방법 보기</summary>
        <p><b>1.</b> 삼성 캘린더 → ☰ → 설정 → 캘린더 관리에 <b>구글 계정 이름</b>이 있어야 해요. 없으면 계정을 추가해 동기화를 켜세요.</p>
        <p><b>2.</b> 휴대폰 크롬에서 <a href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noopener">구글 캘린더 설정</a>을 열고 로그인하세요. 화면이 작게 나오면 크롬 ⋮ 메뉴에서 <b>‘데스크톱 사이트’</b>를 켜세요.</p>
        <p><b>3.</b> 왼쪽 <b>‘내 캘린더의 설정’</b>에서 가져올 캘린더(내 이름)를 누르고, 아래로 내려가 <b>‘iCal 형식의 비공개 주소’</b>를 복사하세요.</p>
        <p><b>4.</b> 위 칸에 붙여 넣고 <b>저장하고 확인</b>을 누르세요.</p>
        <div class="note warn"><b>이 주소는 비밀번호와 같아요</b>남에게 보내거나 사진으로 올리지 마세요. 새어 나갔으면 구글 캘린더에서 ‘비공개 주소 재설정’을 누르세요. 이 앱은 주소를 기기 안에만 두고, 서버는 읽을 때만 잠깐 받아 쓰고 저장하지 않아요. 백업 파일에도 넣지 않아요.</div>
        <p class="muted small">구글 캘린더 쪽 반영이 늦으면 앱에도 늦게 보일 수 있어요(최대 몇 시간). 일정을 앱에서 새로 넣는 건 ‘삼성 캘린더’ 버튼을 그대로 쓰세요.</p></details></section>
    <section class="card"><h2>휴대폰 화면에 앱 아이콘 만들기</h2>
      ${installEvt ? '<button class="btn primary block" data-act="st-install">홈 화면에 추가</button>' : ''}
      <p><b>삼성 인터넷:</b> 아래쪽 ☰ 메뉴 → <b>‘현재 페이지 추가’</b> → <b>‘홈 화면’</b></p><p><b>크롬:</b> 오른쪽 위 ⋮ → <b>‘홈 화면에 추가’</b></p></section>
    <section class="card"><h2>기록 백업</h2><p class="muted small" style="margin-top:0">기록은 이 휴대폰 안에만 저장돼요. 휴대폰을 바꾸기 전에 꼭 백업하세요.</p>
      <div class="btn-row"><button class="btn" data-act="bk-save">파일로 저장</button><button class="btn" data-act="bk-copy">글로 복사</button></div>
      <h3>되살리기</h3><div class="btn-row"><label class="btn ghost" for="bk-file" style="cursor:pointer">파일 고르기</label><button class="btn ghost" data-act="bk-paste">글 붙여넣기</button></div><input type="file" id="bk-file" accept=".json,application/json" hidden>
      <p class="muted small">성적 ${db.rounds.length}개 · 내기 ${db.bets.length}개 · 골프장 ${db.courses.length}곳 · 일정 ${db.events.length}개</p></section>
    <section class="card"><h2>도움말</h2><p class="small">날씨: 서버 연결 시 기상청 단기예보, 아니면 Open-Meteo · 지난 경기 날씨·미세먼지: Open-Meteo · 골프장 찾기: 오픈스트리트맵 · AI 코치: Anthropic Claude (서버 연결 시)</p><p class="small muted">운영 상황은 날씨와 휴장일로 짐작한 것이에요. 대회·공사·잔디 보수로 쉴 수 있으니 전화로 확인하세요.</p></section>
    <button class="btn danger block" data-act="st-wipe">모든 기록 지우기</button>`;
    return { title: '설정·백업', html, after: () => { $('#bk-file').addEventListener('change', async ev => { const f = ev.target.files[0]; if (f) restore(await f.text()); }); } };
  };
  acts['cal-save'] = async () => {
    if (!srvOn()) return toast('먼저 서버 연결을 해 주세요');
    let url = $('#cal-url').value.trim().replace(/^webcal:/i, 'https:');
    const kw = $('#cal-kw').value.trim() || '파크골프, 파크, 골프, 대회';
    const box = $('#cal-status');
    if (!/^https:\/\/calendar\.google\.com\/calendar\/ical\//.test(url)) { box.innerHTML = '<div class="note bad"><b>주소가 달라요</b>https://calendar.google.com/calendar/ical/ 로 시작하는 ‘iCal 형식의 비공개 주소’를 넣어 주세요.</div>'; return; }
    db.settings.cal = { url, keywords: kw }; db.calCache = null; save();
    box.innerHTML = '<p class="muted"><span class="spinner"></span> 캘린더를 읽는 중…</p>';
    try {
      const c = await syncCal(true);
      const next = c.events.filter(e => e.date >= today()).slice(0, 3);
      box.innerHTML = `<div class="note good"><b>연결됐어요${c.name ? ' · ' + esc(c.name) : ''}</b>캘린더 일정 ${c.scanned}개 중 파크골프 일정 ${c.events.length}개를 찾았어요.${next.length ? '<br>다가오는 일정: ' + next.map(e => esc(fmtDate(e.date) + ' ' + e.title)).join(' / ') : ' 다가오는 일정은 아직 없어요.'}${c.events.length === 0 ? '<br>낱말을 바꿔 보세요. (예: 파크, 골프, 모임)' : ''}</div>`;
    } catch (e) { box.innerHTML = `<div class="note bad"><b>연결하지 못했어요</b>${esc(e.message)}</div>`; }
  };
  acts['cal-clear'] = () => { db.settings.cal = { url: '', keywords: db.settings.cal ? db.settings.cal.keywords : '' }; db.calCache = null; save(); rerenderKeep(); toast('캘린더 연결을 끊었어요'); };
  acts['srv-save'] = async el => {
    const url = $('#srv-url').value.trim(), pass = $('#srv-pass').value.trim();
    if (url && !/^https:\/\//.test(url)) return toast('주소는 https:// 로 시작해야 해요');
    db.settings.server = { url, pass, off: !url }; save();
    const box = $('#srv-status');
    if (!url) { box.innerHTML = ''; return toast('저장했어요'); }
    box.innerHTML = '<p class="muted"><span class="spinner"></span> 서버를 확인하는 중…</p>';
    try {
      const h = await srv('/health');
      db.settings.server.ai = !!h.ai; save();
      let wxOk = false, wxMsg = '';
      if (h.weather) { try { await srv('/weather?lat=37.57&lon=126.98'); wxOk = true; } catch (e) { wxMsg = e.message; } }
      box.innerHTML = `<div class="note ${wxOk ? 'good' : 'warn'}"><b>서버에 연결됐어요</b>기상청 날씨: ${wxOk ? '사용 중' : '' + esc(wxMsg || '서버에 기상청 키 없음')}<br>AI 코치: ${h.ai ? '사용 가능' : '아직 꺼져 있음 (서버에 AI 키를 넣으면 켜져요)'}</div>`;
      Object.keys(wxCache).forEach(k => delete wxCache[k]);
    } catch (e) { box.innerHTML = `<div class="note bad"><b>연결하지 못했어요</b>${esc(e.message)}</div>`; }
  };
  acts['srv-clear'] = () => { db.settings.server = { url: '', pass: '', off: true }; save(); Object.keys(wxCache).forEach(k => delete wxCache[k]); rerenderKeep(); toast('서버 연결을 끊었어요'); };
  acts['st-name'] = () => { db.settings.name = $('#st-name').value.trim(); save(); toast('저장했어요'); };
  acts['st-size'] = el => { db.settings.size = el.dataset.v; save(); applySettings(); rerenderKeep(); };
  acts['st-theme'] = el => { db.settings.theme = el.dataset.v; save(); applySettings(); rerenderKeep(); };
  acts['st-alarm'] = el => { const a = db.settings.alarms = db.settings.alarms || []; const i = a.indexOf(el.dataset.v); if (i >= 0) a.splice(i, 1); else a.push(el.dataset.v); save(); el.setAttribute('aria-pressed', i < 0); };
  acts['st-install'] = async () => { if (installEvt) { installEvt.prompt(); installEvt = null; } };
  const backupText = () => { const c = JSON.parse(JSON.stringify(db)); if (c.settings.server) c.settings.server.pass = ''; if (c.settings.cal) c.settings.cal.url = ''; c.calCache = null; return JSON.stringify(c); }; // 비밀번호는 백업에 넣지 않음
  acts['bk-save'] = () => download(`parkgolf-backup-${today()}.json`, backupText(), 'application/json');
  acts['bk-copy'] = async () => { try { await navigator.clipboard.writeText(backupText()); toast('복사했어요. 카카오톡 ‘나와의 채팅’에 붙여 넣어 두세요.', 4000); } catch (e) { modal(`<h2>아래 글을 길게 눌러 모두 복사하세요</h2><textarea readonly style="min-height:200px">${esc(backupText())}</textarea><button class="btn primary block" data-res="ok">닫기</button>`); } };
  acts['bk-paste'] = () => modal(`<h2>백업한 글을 붙여 넣으세요</h2><textarea id="bk-text" style="min-height:200px"></textarea><div class="btn-row"><button class="btn ghost" data-res="no">취소</button><button class="btn primary" data-act="bk-do">되살리기</button></div>`);
  acts['bk-do'] = () => { const t = $('#bk-text').value; document.querySelector('.modal-back').remove(); restore(t); };
  async function restore(text) {
    let data; try { data = JSON.parse(text); } catch (e) { return toast('백업 내용이 올바르지 않아요'); }
    if (!data || !Array.isArray(data.rounds)) return toast('백업 내용이 올바르지 않아요');
    if (!(await ask('되살릴까요?', `지금 기록이 백업 내용(성적 ${data.rounds.length}개)으로 바뀌어요.`, '되살리기'))) return;
    const keepServer = db.settings.server, keepCal = db.settings.cal;
    db = Object.assign(blank(), data, { settings: Object.assign(blank().settings, data.settings || {}) });
    if (keepServer) db.settings.server = keepServer; // 백업에는 서버 비밀번호가 없으니 지금 연결을 유지
    if (!db.settings.cal || !db.settings.cal.url) db.settings.cal = keepCal || blank().settings.cal; // 백업에는 비밀번호가 없으니 지금 연결 유지
    save(); applySettings(); toast('되살렸어요'); go('home');
  }
  acts['st-wipe'] = async () => {
    if (!(await ask('정말 모두 지울까요?', '성적·내기·골프장·일정이 모두 지워지고 되돌릴 수 없어요. 먼저 백업하세요.', '모두 지우기', true))) return;
    db = blank(); save(); applySettings(); go('home');
  };

  /* ── 시작 ───────────────────────────────────────── */
  applySettings();
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
