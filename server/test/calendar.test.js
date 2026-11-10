import test from 'node:test';
import assert from 'node:assert';
import { readCalendar, checkCalendarUrl, parseIcs, expandEvents } from '../src/calendar.js';
import { handle } from '../src/index.js';

const NOW = Date.parse('2026-11-10T01:00:00Z'); // 한국 시간 2026-11-10 10:00 (화)
const ICS = [
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'X-WR-CALNAME:김순자',
  // 1) 한 번짜리 대회 (UTC 표기 → 한국 시간 09:00)
  'BEGIN:VEVENT', 'UID:a1', 'DTSTART:20261121T000000Z', 'DTEND:20261121T040000Z', 'SUMMARY:시장배 파크골프 대회', 'LOCATION:한강 반포 파크골프장', 'END:VEVENT',
  // 2) 매주 월·수 동호회 (TZID 서울), 11/18 하루는 제외, 12/2 는 시간을 바꿈, 5번만
  'BEGIN:VEVENT', 'UID:b2', 'DTSTART;TZID=Asia/Seoul:20261109T060000', 'DTEND;TZID=Asia/Seoul:20261109T080000', 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=7', 'EXDATE;TZID=Asia/Seoul:20261118T060000', 'SUMMARY:새벽 파크골프 모임', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:b2', 'RECURRENCE-ID;TZID=Asia/Seoul:20261123T060000', 'DTSTART;TZID=Asia/Seoul:20261123T070000', 'DTEND;TZID=Asia/Seoul:20261123T090000', 'SUMMARY:새벽 파크골프 모임 (늦게 시작)', 'END:VEVENT',
  // 3) 종일 일정
  'BEGIN:VEVENT', 'UID:c3', 'DTSTART;VALUE=DATE:20261128', 'DTEND;VALUE=DATE:20261129', 'SUMMARY:전국 골프 한마당', 'END:VEVENT',
  // 4) 상관없는 일정과 취소된 일정
  'BEGIN:VEVENT', 'UID:d4', 'DTSTART:20261112T050000Z', 'SUMMARY:치과 예약', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:e5', 'DTSTART:20261113T000000Z', 'SUMMARY:파크골프 연습', 'STATUS:CANCELLED', 'END:VEVENT',
  // 5) 매월 둘째 토요일 (접힌 줄 + 쉼표 이스케이프)
  'BEGIN:VEVENT', 'UID:f6', 'DTSTART;TZID=Asia/Seoul:20261114T100000', 'RRULE:FREQ=MONTHLY;BYDAY=2SA', 'SUMMARY:월례회 파크골프\\, 점심 포함', 'DESCRIPTION:준비물\\n장갑', ' 과 물', 'END:VEVENT',
  'END:VCALENDAR'
].join('\r\n');

test('구글 캘린더 읽기: 파크골프 일정만, 반복·예외·종일·시간대 처리', () => {
  const r = readCalendar(ICS, { now: NOW, days: 120 });
  const rows = r.events.map(e => `${e.date} ${e.time || '종일'} ${e.title}`);
  assert.strictEqual(r.calName, '김순자');
  assert.ok(!rows.some(x => x.includes('치과')), '상관없는 일정은 빠짐');
  assert.ok(!rows.some(x => x.includes('파크골프 연습')), '취소된 일정은 빠짐');
  assert.ok(rows.includes('2026-11-21 09:00 시장배 파크골프 대회'), 'UTC → 한국 시간');
  assert.ok(rows.includes('2026-11-28 종일 전국 골프 한마당'));
  // 매주 월·수 (11/9 월 시작, 7번): 11/9, 11/11, 11/16, (11/18 제외), 11/23(바뀜), 11/25, 11/30
  const club = rows.filter(x => x.includes('새벽'));
  assert.deepStrictEqual(club, [
    '2026-11-09 06:00 새벽 파크골프 모임', '2026-11-11 06:00 새벽 파크골프 모임', '2026-11-16 06:00 새벽 파크골프 모임',
    '2026-11-23 07:00 새벽 파크골프 모임 (늦게 시작)', '2026-11-25 06:00 새벽 파크골프 모임', '2026-11-30 06:00 새벽 파크골프 모임']);
  // 매월 둘째 토요일: 11/14, 12/12, 1/9
  const monthly = rows.filter(x => x.includes('월례회'));
  assert.deepStrictEqual(monthly.slice(0, 3), ['2026-11-14 10:00 월례회 파크골프, 점심 포함', '2026-12-12 10:00 월례회 파크골프, 점심 포함', '2027-01-09 10:00 월례회 파크골프, 점심 포함']);
  const m = r.events.find(e => e.title.startsWith('월례회'));
  assert.strictEqual(m.memo, '준비물\n장갑과 물', '접힌 줄 이어 붙임');
  assert.strictEqual(r.scanned, 7);
});

test('낱말을 바꾸면 다른 일정이 걸러짐', () => {
  const r = readCalendar(ICS, { now: NOW, days: 30, keywords: ['치과'] });
  assert.deepStrictEqual(r.events.map(e => e.title), ['치과 예약']);
  assert.strictEqual(r.events[0].time, '14:00');
});

test('종일 일정은 지난 날 기준으로 걸러짐', () => {
  const r = readCalendar(ICS, { now: Date.parse('2026-12-01T00:00:00Z'), days: 10 });
  assert.ok(!r.events.some(e => e.title.includes('한마당')));
});

test('구글 캘린더 주소만 허용', () => {
  assert.ok(checkCalendarUrl('https://calendar.google.com/calendar/ical/me%40gmail.com/private-abc123/basic.ics'));
  assert.ok(checkCalendarUrl('webcal://calendar.google.com/calendar/ical/x/private-1/basic.ics'));
  assert.strictEqual(checkCalendarUrl('https://evil.example/calendar/ical/x'), null);
  assert.strictEqual(checkCalendarUrl('https://calendar.google.com.evil.example/calendar/ical/x'), null);
  assert.strictEqual(checkCalendarUrl('http://calendar.google.com/calendar/ical/x'), null);
  assert.strictEqual(checkCalendarUrl('https://calendar.google.com/other'), null);
  assert.strictEqual(checkCalendarUrl('https://calendar.google.com:8443/calendar/ical/x'), null);
  assert.strictEqual(checkCalendarUrl('아무말'), null);
});

const env = { ALLOWED_ORIGINS: 'https://me.github.io' };
const req = (body) => new Request('https://srv.example/calendar', { method: 'POST', body: JSON.stringify(body), headers: { Origin: 'https://me.github.io' } });

test('서버 경로: 다른 주소는 거절, 구글 주소는 읽어 줌, 주소는 응답에 안 나옴', async () => {
  let r = await handle(req({ url: 'https://evil.example/x' }), env, null, { cache: null });
  assert.strictEqual(r.status, 400);
  let fetched = null;
  const calFetch = async (u) => { fetched = u; return new Response(ICS); };
  const secret = 'https://calendar.google.com/calendar/ical/me%40gmail.com/private-SECRET999/basic.ics';
  r = await handle(req({ url: secret, days: 60 }), env, null, { cache: null, calFetch });
  const text = await r.text();
  assert.strictEqual(r.status, 200);
  assert.ok(!text.includes('SECRET999'), '응답에 비밀 주소가 없어야 함');
  assert.strictEqual(fetched, secret);
  assert.ok(JSON.parse(text).events.length > 3);
  r = await handle(req({ url: secret }), env, null, { cache: null, calFetch: async () => new Response('nope', { status: 404 }) });
  assert.strictEqual(r.status, 400);
  assert.match((await r.json()).error, /다시 복사/);
  r = await handle(req({ url: secret }), env, null, { cache: null, calFetch: async () => new Response('<html>로그인</html>') });
  assert.strictEqual(r.status, 502);
});
