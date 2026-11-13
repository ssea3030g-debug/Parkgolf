// 실행: npm test   (가짜 응답으로 시험)
import test from 'node:test';
import assert from 'node:assert';
import { parseMid, midBase, wfCode, parseWarn, matchWarn, areaOf, uvBase, nearCities, extras } from '../src/extra.js';

test('중기예보 발표 시각', () => {
  assert.strictEqual(midBase(new Date('2026-11-13T05:00:00+09:00')), '202611121800');
  assert.strictEqual(midBase(new Date('2026-11-13T07:00:00+09:00')), '202611130600');
  assert.strictEqual(midBase(new Date('2026-11-13T19:00:00+09:00')), '202611131800');
  assert.strictEqual(uvBase(new Date('2026-11-13T05:00:00+09:00')), '2026111218');
});

test('중기예보 읽기: 4일 뒤부터 날짜·날씨·기온', () => {
  const land = { regId: '11B00000', rnSt4Am: 20, rnSt4Pm: 60, wf4Am: '맑음', wf4Pm: '흐리고 비', rnSt8: 30, wf8: '구름많음' };
  const ta = { regId: '11B10101', taMin4: 3, taMax4: 12, taMin8: 1, taMax8: 9, taMin4Low: 1 };
  const d = parseMid(land, ta, '202611130600');
  assert.strictEqual(d[0].date, '2026-11-17');
  assert.strictEqual(d[0].pop, 60); assert.strictEqual(d[0].code, 63); assert.strictEqual(d[0].min, 3); assert.strictEqual(d[0].max, 12);
  assert.strictEqual(d[1].date, '2026-11-21'); assert.strictEqual(d[1].code, 102);
  assert.strictEqual(wfCode('흐리고 비/눈'), 68); assert.strictEqual(wfCode('맑음'), 0);
});

test('가까운 도시: 하남 미사 → 서울, 강릉 → 영동', () => {
  assert.strictEqual(nearCities(37.56, 127.19)[0].land, '11B00000');
  assert.strictEqual(nearCities(37.76, 128.9)[0].land, '11D20000');
});

test('특보 읽기·고르기', () => {
  const t = 'o 건조주의보 : 서울, 경기도(성남, 하남, 광주), 강원도(강릉시평지, 동해시평지)\r\no 강풍주의보 : 경기도(동부), 경상북도(포항, 경주)\r\no 풍랑주의보 : 동해중부먼바다';
  const p = parseWarn(t);
  assert.strictEqual(p.length, 3);
  assert.deepStrictEqual(p[0].groups[1], { prov: '경기도', subs: ['성남', '하남', '광주'] });
  const ha = matchWarn(p, '경기', '하남시');
  assert.deepStrictEqual(ha.map(x => [x.kind, x.part]), [['건조주의보', false], ['강풍주의보', true]]);
  assert.deepStrictEqual(matchWarn(p, '경기', '파주시').map(x => x.kind), ['강풍주의보']);
  assert.deepStrictEqual(matchWarn(p, '서울', '송파구').map(x => x.kind), ['건조주의보']);
  assert.deepStrictEqual(matchWarn(p, '강원', '강릉시').map(x => x.kind), ['건조주의보']);
  assert.deepStrictEqual(matchWarn(p, '경북', '영덕군'), []);
});

test('주소 → 시도·시군구', () => {
  assert.deepStrictEqual(areaOf('경기도 하남시 미사동 산 1', 37.5, 127.2), { sd: '경기', sg: '하남시' });
  assert.deepStrictEqual(areaOf('경상북도 영덕군 영덕읍', 36.4, 129.3), { sd: '경북', sg: '영덕군' });
  assert.deepStrictEqual(areaOf('서울특별시 강남구 일원동', 37.4, 127.0), { sd: '서울', sg: '강남구' });
  assert.deepStrictEqual(areaOf('', 35.1, 129.0), { sd: '부산', sg: '' });
});

test('한 번에 받기: 승인 안 된 서비스는 그 항목만 오류, 나머지는 정상', async () => {
  const fake = async url => {
    const u = new URL(url); const p = u.pathname;
    const ok = items => new Response(JSON.stringify({ response: { header: { resultCode: '00', resultMsg: 'NORMAL' }, body: { items } } }));
    if (p.endsWith('getMsrstnList')) return ok([{ stationName: '미사', addr: '하남시', dmX: '37.56', dmY: '127.19' }, { stationName: '종로구', addr: '서울', dmX: '37.57', dmY: '126.98' }]);
    if (p.endsWith('getMsrstnAcctoRltmMesureDnsty')) return ok(u.searchParams.get('stationName') === '미사' ? [{ dataTime: '2026-11-13 10:00', pm10Value: '-', pm25Value: '-' }] : [{ dataTime: '2026-11-13 10:00', pm10Value: '45', pm25Value: '20' }]);
    if (p.endsWith('getMidLandFcst')) return ok({ item: [{ rnSt4Am: 10, rnSt4Pm: 20, wf4Am: '맑음', wf4Pm: '맑음' }] });
    if (p.endsWith('getMidTa')) return ok({ item: [{ taMin4: 2, taMax4: 11 }] });
    if (p.endsWith('getUVIdxV5')) return new Response('<OpenAPI_ServiceResponse><cmmMsgHeader><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg></cmmMsgHeader></OpenAPI_ServiceResponse>', { status: 200 });
    if (p.endsWith('getPwnStatus')) return ok({ item: [{ tmFc: 202611131000, t6: 'o 건조주의보 : 경기도(하남)', t7: '' }] });
    return new Response('?', { status: 404 });
  };
  const r = await extras({ lat: 37.56, lon: 127.19, addr: '경기도 하남시 미사동', key: 'k', fetcher: fake, cache: null, now: new Date('2026-11-13T10:00:00+09:00') });
  assert.strictEqual(r.air.station, '종로구'); // 미사 측정소가 비어 있으면 다음 측정소
  assert.strictEqual(r.air.pm10, 45);
  assert.strictEqual(r.mid.days[0].date, '2026-11-17');
  assert.match(r.uv.error, /활용신청/);
  assert.deepStrictEqual(r.warn.now.map(x => x.kind), ['건조주의보']);
});

test('측정소정보 활용신청 전: 시도 자료에서 같은 시군구 측정소로', async () => {
  const fake = async url => {
    const u = new URL(url); const p = u.pathname;
    if (p.endsWith('getMsrstnList')) return new Response(JSON.stringify({ OpenAPI_ServiceResponse: { cmmMsgHeader: { errMsg: 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR', returnReasonCode: '30' } } }));
    if (p.endsWith('getCtprvnRltmMesureDnsty')) return new Response(JSON.stringify({ response: { header: { resultCode: '00' }, body: { items: [
      { stationName: '하남시', dataTime: '2026-11-13 20:00', pm10Value: '50', pm25Value: '30' }, { stationName: '수원', dataTime: '2026-11-13 20:00', pm10Value: '10', pm25Value: '5' }] } } }));
    if (p.endsWith('getUVIdxV5')) return new Response(JSON.stringify({ response: { header: { resultCode: '00' }, body: { items: { item: [{ date: '2026111306', h0: '1', h3: '4', h6: '6', h9: '3', h12: '0' }] } } } }));
    return new Response(JSON.stringify({ response: { header: { resultCode: '03', resultMsg: 'NO_DATA' } } }));
  };
  const r = await extras({ lat: 37.54, lon: 127.21, addr: '경기도 하남시 미사동', key: 'k', fetcher: fake, cache: null, now: new Date('2026-11-13T10:00:00+09:00') });
  assert.strictEqual(r.air.station, '하남시'); assert.strictEqual(r.air.pm10, 50);
  assert.strictEqual(r.uv.now, 4); assert.strictEqual(r.uv.todayMax, 6); assert.strictEqual(r.uv.nowGrade, '보통');
  const r2 = await extras({ lat: 37.27, lon: 127.0, addr: '경기도 용인시 처인구', key: 'k', fetcher: fake, cache: null });
  assert.strictEqual(r2.air.station, '경기 평균'); assert.strictEqual(r2.air.pm10, 30);
});
