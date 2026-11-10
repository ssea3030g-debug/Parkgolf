#!/usr/bin/env python3
"""전국 파크골프장 목록 만들기.

공공데이터포털(data.go.kr)에 지자체·시설관리공단이 올린 '파크골프장' 표준데이터(CSV)를 모아
app/data/courses.json 으로 합친다. 앱은 이 파일로 이름·지역 검색을 한다.

- 데이터에 없는 곳은 목록에 없다. 지어내거나 지도 서비스에서 긁어 오지 않는다.
- 사용 자료의 제목·기준일·주소는 app/data/sources.json 에 남긴다 (출처 표시용).
- 인터넷은 표준 라이브러리만 쓴다. 한 곳이 실패해도 나머지는 계속한다.
"""
import csv, html, io, json, os, re, sys, time, urllib.parse, urllib.request
from datetime import date

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'data')
CACHE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data-cache')
UA = 'Mozilla/5.0 (X11; Linux x86_64) parkgolf-list-builder/1.0'
# 검색으로 찾기 전에도 알려진 자료 번호 (검색이 막혔을 때의 보험)
SEEDS = [15160428, 15160352, 15160528, 15160516, 15166992, 15160487, 15160548, 15160419, 15150432, 15150439, 15142224]


def log(*a):
    print(*a, flush=True)


START = time.time()
BUDGET = int(os.environ.get('PG_BUDGET', '600'))  # 초: 전체 제한 시간


class OutOfTime(Exception):
    pass


class CaptchaRequired(Exception):
    """포털이 보안문자를 요구함 — 사람이 확인하는 장치이므로 우회하지 않고 멈춘다."""


def get(url, data=None, timeout=15, binary=False, tries=3):
    if time.time() - START > BUDGET:
        raise OutOfTime('제한 시간 초과')
    if isinstance(data, dict):
        data = urllib.parse.urlencode(data).encode()
    last = None
    for k in range(tries):
        headers = {'User-Agent': UA, 'Accept': '*/*', 'Referer': 'https://www.data.go.kr/'}
        if data:
            headers['X-Requested-With'] = 'XMLHttpRequest'
        req = urllib.request.Request(url, data=data, headers=headers)
        t0 = time.time()
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read()
                log(f'    {"POST" if data else "GET"} {url[:90]} → {len(raw)}B ({time.time() - t0:.1f}s)')
                return raw if binary else raw.decode('utf-8', 'replace'), r.headers.get('Content-Type', '')
        except urllib.error.HTTPError as e:
            log(f'    {url[:90]} ✗ HTTP {e.code}')
            raise
        except Exception as e:  # 연결이 끊기는 경우가 간혹 있어 몇 번 더 시도
            last = e
            log(f'    {url[:90]} ✗ {type(e).__name__} {str(e)[:60]} (시도 {k + 1}/{tries})')
            time.sleep(1.5 * (k + 1))
    raise last


def discover():
    """'파크골프장' 파일데이터 번호 찾기"""
    ids = {}
    kw = urllib.parse.quote('파크골프장')
    tries = [
        f'https://www.data.go.kr/tcs/dss/selectDataSetList.do?dType=FILE&keyword={kw}&operator=AND&recmSe=N&currentPage={{p}}&perPage=100',
        f'https://www.data.go.kr/tcs/dss/selectDataSetList.do?dType=FILE&keyword={kw}&currentPage={{p}}&perPage=40',
        f'https://www.data.go.kr/tcs/dss/selectDataSetList.do?keyword={kw}&currentPage={{p}}&perPage=40',
    ]
    for pattern in tries:
        found = 0
        for p in range(1, 12):
            try:
                body, _ = get(pattern.format(p=p))
            except Exception as e:
                log('  검색 실패:', pattern[:70], e)
                break
            page_ids = set(re.findall(r'/data/(\d{7,8})/fileData\.do', body)) | set(re.findall(r'/catalog/(\d{7,8})/fileData', body))
            new = [i for i in page_ids if i not in ids]
            for i in new:
                ids[i] = True
            found += len(new)
            log(f'  검색 {p}쪽: 새 자료 {len(new)}개')
            if not new:
                break
            time.sleep(0.7)
        if ids:
            break
    return [int(i) for i in ids]


def dataset_info(pk):
    """자료 하나의 제목·내려받기 주소"""
    info = {'id': pk, 'title': '', 'org': '', 'modified': '', 'urls': [], 'page': f'https://www.data.go.kr/data/{pk}/fileData.do'}
    try:
        body, _ = get(f'https://www.data.go.kr/catalog/{pk}/fileData.json')
        j = json.loads(body)
        info['title'] = j.get('name') or j.get('title') or ''
        pub = j.get('publisher') or j.get('creator') or {}
        info['org'] = pub.get('name', '') if isinstance(pub, dict) else str(pub)
        info['modified'] = j.get('dateModified') or j.get('datePublished') or ''
        dist = j.get('distribution') or []
        if isinstance(dist, dict):
            dist = [dist]
        for d in dist:
            u = d.get('contentUrl') or d.get('downloadUrl') or d.get('url')
            if u:
                info['urls'].append(u)
    except Exception as e:
        log(f'  [{pk}] 설명 파일 실패: {e}')
    return info


def download_args(pk):
    """자료 페이지의 '다운로드' 버튼이 쓰는 값 (publicDataDetailPk, fileDetailSn)"""
    body, _ = get(f'https://www.data.go.kr/data/{pk}/fileData.do')
    m = re.search(r"fn_fileDataDown\('(\d+)',\s*'(uddi:[^']+)',\s*'([^']*)',\s*'(\d+)',\s*'(\d+)'\)", body)
    return m.groups() if m else None


def fetch_csv(pk):
    """포털 화면과 같은 순서로 요청: ① 파일 정보 → ② 횟수 제한 확인 → ③ 내려받기"""
    a = download_args(pk)
    if not a:
        raise RuntimeError('다운로드 버튼을 못 찾음')
    pub_pk, detail_pk, atch, sn, _hist = a
    body, _ = get('https://www.data.go.kr/tcs/dss/selectFileDataDownload.do',
                  data={'publicDataDetailPk': detail_pk, 'publicDataPk': pub_pk, 'atchFileId': atch, 'fileDetailSn': sn, 'publicDataTyCode': 'PR0051'})
    j = json.loads(body)
    if not j.get('status'):
        raise RuntimeError('파일 정보 응답: ' + str(j.get('error') or j)[:80])
    atch, sn = j['atchFileId'], j['fileDetailSn']
    name = (j.get('dataSetFileDetailInfo') or {}).get('dataNm') or ''
    try:
        lim, _ = get('https://www.data.go.kr/cmm/cmm/check-limit.json', data={'atchFileId': atch, 'fileDetailSn': sn}, tries=1)
        if json.loads(lim).get('needCaptcha'):
            raise CaptchaRequired()
    except urllib.error.HTTPError as e:
        if e.code == 403:
            raise CaptchaRequired()
        raise
    q = urllib.parse.urlencode({'atchFileId': atch, 'fileDetailSn': sn, 'dataNm': name})
    raw, ctype = get('https://www.data.go.kr/cmm/cmm/fileDownload.do?' + q, binary=True, timeout=30)
    return decode(raw)


def decode(raw):
    for enc in ('utf-8-sig', 'cp949', 'euc-kr'):
        try:
            return raw.decode(enc)
        except Exception:
            pass
    return raw.decode('utf-8', 'replace')


def read_csv(text):
    rows = list(csv.reader(io.StringIO(text)))
    # 머리글 줄 찾기: '…명' 열이 있고 주소·위치·위도 중 하나가 있는 첫 줄
    for i, r in enumerate(rows[:10]):
        head = [re.sub(r'\s', '', c) for c in r]
        joined = ','.join(head)
        if re.search(r'명', joined) and re.search(r'주소|위치|위도|소재지', joined):
            return [dict(zip(head, (x.strip() for x in row))) for row in rows[i + 1:] if any(x.strip() for x in row)]
    return []


def pick(row, *keys):
    for k in keys:
        for rk, v in row.items():
            if k in rk and v and v.strip() not in ('-', 'N/A', 'null', '없음', '해당없음', '해당 없음', '미정', '.'):
                return v
    return ''


def num(s):
    try:
        v = float(re.sub(r'[^\d.\-]', '', s or ''))
        return v
    except Exception:
        return None


SIDO = {'서울': '서울', '부산': '부산', '대구': '대구', '인천': '인천', '광주': '광주', '대전': '대전', '울산': '울산', '세종': '세종',
        '경기': '경기', '강원': '강원', '충북': '충북', '충청북': '충북', '충남': '충남', '충청남': '충남', '전북': '전북', '전라북': '전북',
        '전남광주': '광주·전남', '전남': '전남', '전라남': '전남', '경북': '경북', '경상북': '경북', '경남': '경남', '경상남': '경남', '제주': '제주'}
FULL = {'서울': '서울특별시', '부산': '부산광역시', '대구': '대구광역시', '인천': '인천광역시', '광주': '광주광역시', '대전': '대전광역시', '울산': '울산광역시',
        '세종': '세종특별자치시', '경기': '경기도', '강원': '강원특별자치도', '충북': '충청북도', '충남': '충청남도', '전북': '전북특별자치도',
        '전남': '전라남도', '경북': '경상북도', '경남': '경상남도', '제주': '제주특별자치도', '광주·전남': ''}


def region(addr, org='', title=''):
    sgg = ''
    for w in [x.strip('()[],·') for x in (addr or '').split()[:5]]:
        if re.search(r'[가-힣]{1,6}[시군구]$', w) and not re.search(r'(특별|광역|자치)시$', w) and w not in ('시', '군', '구'):
            sgg = w
            break
    if not sgg:  # 주소에 없으면 제목·기관 이름 앞부분에서 (예: '동작구시설관리공단_…')
        for text in (title, org):
            m = re.match(r'(?:[가-힣]+(?:특별시|광역시|특별자치시|특별자치도|도)\s*)?([가-힣]{2,4}?[시군구])(?:시설|도시|체육|_|\s|$)', (text or '').strip())
            if m and not re.search(r'(특별|광역|자치)시$', m.group(1)) and m.group(1)[:-1] not in SIDO and m.group(1) not in ('서울시', '부산시', '대구시', '인천시', '광주시', '대전시', '울산시'):
                sgg = m.group(1)
                break
    for text in (addr, org, title):
        t = (text or '').strip()
        for k in sorted(SIDO, key=len, reverse=True):
            if t.startswith(k):
                if not sgg:
                    for w in [x.strip('()[],·') for x in t.split()[1:4]]:
                        if re.search(r'[가-힣]{1,6}[시군구]$', w) and not re.search(r'(특별|광역|자치)시$', w):
                            sgg = w
                            break
                return SIDO[k], sgg
    return '', sgg


def holes(row):
    v = num(pick(row, '홀수', '홀'))
    if v:
        return int(v)
    m = re.search(r'(\d+)\s*홀', pick(row, '규모', '시설규모', '비고'))
    return int(m.group(1)) if m else None


def closed_days(text):
    """'매주 월요일' → [1] (일=0 … 토=6). 둘째·넷째처럼 매주가 아닌 휴무는 비워 둔다(원문은 ct 에 남김)."""
    if re.search(r'[첫둘셋넷다섯]째|\d\s*째|격주|홀수|짝수|\d\s*번째', text or ''):
        return []
    days = '일월화수목금토'
    out = set()
    for m in re.finditer(r'([일월화수목금토])요일', text or ''):
        out.add(days.index(m.group(1)))
    return sorted(out)


def hours(text):
    """시간대가 하나일 때만 돌려준다. 동절기·하절기처럼 여러 개면 비워 둔다(원문은 ot 에 남김)."""
    found = re.findall(r'(\d{1,2})\s*[:시]\s*(\d{0,2})\s*분?\s*[~\-–]\s*(\d{1,2})\s*[:시]\s*(\d{0,2})', text or '')
    if len(found) != 1:
        return '', ''
    a, b, c, d = found[0]
    return f'{int(a):02d}:{int(b or 0):02d}', f'{int(c):02d}:{int(d or 0):02d}'


def convert(row, src, title=''):
    row = {re.sub(r'\s', '', k): v for k, v in row.items()}
    name = pick(row, '파크골프장명', '시설명', '업장명', '구장명', '명칭')
    if not name:
        return None
    road = pick(row, '소재지도로명주소', '도로명주소', '주소', '위치', '소재지')
    jibun = pick(row, '소재지지번주소', '지번주소')
    addr = road or jibun
    la, lo = num(pick(row, '위도')), num(pick(row, '경도'))
    if la is not None and lo is not None and not (32 < la < 39.5 and 124 < lo < 132.5):
        if 32 < lo < 39.5 and 124 < la < 132.5:  # 위도·경도가 뒤바뀐 경우
            la, lo = lo, la
        else:
            la = lo = None
    org = pick(row, '운영기관명', '관리기관명', '운영기관', '제공기관')
    sido, sgg = region(addr, org, title)
    open_text = pick(row, '운영시간', '이용시간', '개방시간', '이용가능시간')
    close_text = pick(row, '휴무일', '휴장일', '휴관일', '비고')
    o, c = hours(open_text)
    item = {
        'n': name, 'a': addr, 'sd': sido, 'sg': sgg,
        'la': round(la, 6) if la is not None else None, 'lo': round(lo, 6) if lo is not None else None,
        'h': holes(row), 'cs': int(num(pick(row, '코스수')) or 0) or None,
        'ot': open_text, 'o': o, 'c': c, 'ct': close_text, 'cd': closed_days(close_text),
        'fee': pick(row, '이용요금', '요금', '사용료'), 'tel': pick(row, '예약문의전화번호', '전화번호', '문의전화', '연락처', '전화'),
        'rs': pick(row, '예약방식', '예약방법'), 'rl': pick(row, '예약처링크', '예약링크', '홈페이지'),
        'org': org, 'sr': src, 'dt': pick(row, '데이터기준일자'),
    }
    return {k: v for k, v in item.items() if v not in ('', None, [])}


GEO_FILE = os.path.join(CACHE_DIR, 'geo.json')
AMBIGUOUS = {'중구', '서구', '동구', '남구', '북구', '강서구', '동래구'}


def geocode_missing(items):
    """좌표가 없는 곳은 '시도 시군구' 중심 좌표로 채우고 ap=1(대략적 위치)로 표시. 지도 서비스(Nominatim) 1초에 1번."""
    geo = json.load(open(GEO_FILE, encoding='utf-8')) if os.path.exists(GEO_FILE) else {}
    todo = sorted({(x.get('sd', ''), x.get('sg', '')) for x in items if (x.get('la') is None or not x.get('sd')) and x.get('sg')})
    log(f'좌표가 없는 시·군·구: {len(todo)}곳')
    for sd, sg in todo:
        key = f'{sd}|{sg}'
        if key in geo or time.time() - START > BUDGET:
            continue
        if not sd and sg in AMBIGUOUS:
            continue  # 중구·서구처럼 같은 이름이 여러 곳이면 시도를 모르는 채로는 찾지 않는다
        q = f"{FULL.get(sd, '')} {sg}".strip() if sd != '광주·전남' else sg
        try:
            body, _ = get('https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(
                {'q': q, 'format': 'jsonv2', 'limit': 1, 'countrycodes': 'kr', 'accept-language': 'ko', 'addressdetails': 1}), tries=2)
            r = json.loads(body)
            if r:
                ad = r[0].get('address') or {}
                short = next((k for k, v in FULL.items() if v and v in (ad.get('province'), ad.get('state'), ad.get('city'), ad.get('region'))), '')
                geo[key] = [float(r[0]['lat']), float(r[0]['lon']), short]
            else:
                geo[key] = None
        except OutOfTime:
            break
        except Exception as e:
            log(f'  위치 찾기 실패 {q}: {e}')
        time.sleep(1.2)
    os.makedirs(CACHE_DIR, exist_ok=True)
    json.dump(geo, open(GEO_FILE, 'w', encoding='utf-8'), ensure_ascii=False)
    for x in items:
        g = geo.get(f"{x.get('sd', '')}|{x.get('sg', '')}")
        if g:
            if x.get('la') is None:
                x['la'], x['lo'] = round(g[0], 4), round(g[1], 4)
                x['ap'] = 1
            if not x.get('sd') and len(g) > 2 and g[2]:
                x['sd'] = g[2]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    ids = discover()
    log(f'검색으로 찾은 자료: {len(ids)}개')
    for s in SEEDS:
        if s not in ids:
            ids.append(s)
    ids = sorted(set(ids))
    log(f'확인할 자료: {len(ids)}개')

    sources, items, skipped = [], [], []
    stop_downloads = False
    for pk in ids:
        if time.time() - START > BUDGET:
            log('제한 시간이 다 되어 남은 자료는 다음 실행으로 미룹니다.')
            break
        info = dataset_info(pk)
        title = info['title']
        if not re.search(r'파크\s*골프', title or '') or re.search(r'이용자|이용객|통계|대회|스크린|예약\s*현황|민원|사고', title or ''):
            skipped.append((pk, title))
            log(f'- [{pk}] 건너뜀(파크골프 자료 아님): {title[:40]}')
            continue
        cache_file = os.path.join(CACHE_DIR, f'{pk}.json')
        got = None
        if os.path.exists(cache_file):
            c = json.load(open(cache_file, encoding='utf-8'))
            if c.get('modified') == info['modified'] and c.get('rows'):
                got = c['rows']
                log(f'- [{pk}] 저장해 둔 자료 사용 ({title[:40]})')
        if got is None:
            if stop_downloads:
                log(f'- [{pk}] ⏭ 보안문자 때문에 이번에는 건너뜀: {title[:40]}')
                continue
            try:
                text = fetch_csv(pk)
                if text.lstrip().startswith('<'):
                    raise RuntimeError('파일 대신 웹페이지가 옴')
                got = read_csv(text)
                if not got:
                    raise RuntimeError('CSV 머리글을 못 찾음: ' + repr(text[:60]))
                os.makedirs(CACHE_DIR, exist_ok=True)
                json.dump({'modified': info['modified'], 'title': title, 'rows': got}, open(cache_file, 'w', encoding='utf-8'), ensure_ascii=False)
                time.sleep(2.5)  # 포털에 부담을 주지 않도록 천천히
            except CaptchaRequired:
                stop_downloads = True
                log(f'- [{pk}] ⛔ 포털이 보안문자를 요구해서 새 내려받기를 멈춥니다 (우회하지 않음). 받아 둔 자료로 계속합니다.')
                continue
            except OutOfTime:
                log('제한 시간이 다 되어 남은 자료는 다음 실행으로 미룹니다.')
                break
            except Exception as e:
                log(f'- [{pk}] ❌ {title[:50]} — {e}')
                continue
        n0 = len(items)
        for row in got:
            it = convert(row, pk, title)
            if it:
                items.append(it)
        log(f'- [{pk}] ✅ {title[:50]} — {len(items) - n0}곳')
        sources.append({'id': pk, 'title': title, 'org': info['org'], 'modified': info['modified'], 'url': info['page'], 'count': len(items) - n0})
        time.sleep(0.5)

    # 직접 추가한 항목 (scripts/manual_courses.json) — 자동 갱신으로 지워지지 않게 따로 보관
    mp = os.path.join(os.path.dirname(__file__), 'manual_courses.json')
    if os.path.exists(mp):
        manual = json.load(open(mp, encoding='utf-8'))
        for m in manual:
            m['sr'] = '직접 추가'
            items.append(m)
        if manual:
            sources.append({'id': 0, 'title': '직접 추가한 항목', 'org': '', 'modified': date.today().isoformat(), 'url': '', 'count': len(manual)})
        log(f'직접 추가한 항목: {len(manual)}곳')

    # 같은 곳 중복 정리 (이름+주소 또는 이름+좌표)
    seen, uniq = set(), []
    for it in items:
        key = (re.sub(r'\s', '', it['n']), (it.get('a') or '')[:12] or (round(it.get('la') or 0, 3), round(it.get('lo') or 0, 3)))
        if key in seen:
            continue
        seen.add(key)
        uniq.append(it)
    uniq.sort(key=lambda x: (x.get('sd', '힣'), x.get('sg', ''), x['n']))
    for i, it in enumerate(uniq, 1):
        it['i'] = i

    geocode_missing(uniq)
    with_geo = sum(1 for x in uniq if x.get('la') is not None)
    log(f'\n합계: {len(uniq)}곳 (좌표 있음 {with_geo}곳) · 자료 {len(sources)}개 · 실패/제외 {len(ids) - len(sources)}개')
    if not uniq:
        log('만들 목록이 없어서 파일을 바꾸지 않았습니다.')
        sys.exit(1)
    by = {}
    for x in uniq:
        by[x.get('sd', '미상')] = by.get(x.get('sd', '미상'), 0) + 1
    log('지역별:', ', '.join(f'{k} {v}' for k, v in sorted(by.items(), key=lambda kv: -kv[1])))

    with open(os.path.join(OUT_DIR, 'courses.json'), 'w', encoding='utf-8') as f:
        json.dump({'updated': date.today().isoformat(), 'count': len(uniq), 'items': uniq}, f, ensure_ascii=False, separators=(',', ':'))
    with open(os.path.join(OUT_DIR, 'sources.json'), 'w', encoding='utf-8') as f:
        json.dump({'updated': date.today().isoformat(), 'note': '공공데이터포털 지자체·시설관리공단 파크골프장 표준데이터', 'sources': sources}, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
