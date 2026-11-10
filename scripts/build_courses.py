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
UA = 'Mozilla/5.0 (X11; Linux x86_64) parkgolf-list-builder/1.0'
# 검색으로 찾기 전에도 알려진 자료 번호 (검색이 막혔을 때의 보험)
SEEDS = [15160428, 15160352, 15160528, 15160516, 15166992, 15160487, 15160548, 15160419, 15150432, 15150439, 15142224]


def log(*a):
    print(*a, flush=True)


def get(url, data=None, timeout=40, binary=False):
    req = urllib.request.Request(url, data=data, headers={'User-Agent': UA, 'Accept': '*/*', 'Referer': 'https://www.data.go.kr/'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
        return raw if binary else raw.decode('utf-8', 'replace'), r.headers.get('Content-Type', '')


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
    if not info['title'] or not info['urls']:
        try:  # 보험: 자료 페이지에서 제목과 첨부파일 번호를 찾기
            body, _ = get(info['page'])
            m = re.search(r'<title>(.*?)\s*\|', body, re.S)
            if m and not info['title']:
                info['title'] = html.unescape(m.group(1)).strip()
            for fid in set(re.findall(r'(FILE_\d{9,})', body)):
                info['urls'].append(f'https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId={fid}&fileDetailSn=1&insertDataPrcus=N')
        except Exception as e:
            log(f'  [{pk}] 자료 페이지 실패: {e}')
    return info


def decode(raw):
    for enc in ('utf-8-sig', 'cp949', 'euc-kr'):
        try:
            return raw.decode(enc)
        except Exception:
            pass
    return raw.decode('utf-8', 'replace')


def read_csv(text):
    rows = list(csv.reader(io.StringIO(text)))
    # 머리글 줄 찾기: '파크골프장명' 또는 '명' 과 '위도' 가 같이 있는 첫 줄
    for i, r in enumerate(rows[:10]):
        joined = ','.join(r)
        if ('명' in joined) and ('주소' in joined or '위도' in joined):
            head = [c.strip() for c in r]
            return [dict(zip(head, (x.strip() for x in row))) for row in rows[i + 1:] if any(x.strip() for x in row)]
    return []


def pick(row, *keys):
    for k in keys:
        for rk, v in row.items():
            if k in rk and v and v not in ('-', 'N/A', 'null'):
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
        '전남': '전남', '전라남': '전남', '경북': '경북', '경상북': '경북', '경남': '경남', '경상남': '경남', '제주': '제주'}


def region(addr, org=''):
    for text in (addr, org):
        t = (text or '').strip()
        for k in sorted(SIDO, key=len, reverse=True):
            if t.startswith(k):
                parts = t.split()
                sgg = ''
                for w in parts[1:4]:
                    if re.search(r'[시군구]$', w):
                        sgg = w
                        break
                return SIDO[k], sgg
    return '', ''


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


def convert(row, src):
    name = pick(row, '파크골프장명', '시설명', '명칭')
    if not name:
        return None
    road = pick(row, '소재지도로명주소', '도로명주소')
    jibun = pick(row, '소재지지번주소', '지번주소')
    addr = road or jibun
    la, lo = num(pick(row, '위도')), num(pick(row, '경도'))
    if la is not None and lo is not None and not (32 < la < 39.5 and 124 < lo < 132.5):
        if 32 < lo < 39.5 and 124 < la < 132.5:  # 위도·경도가 뒤바뀐 경우
            la, lo = lo, la
        else:
            la = lo = None
    org = pick(row, '운영기관명', '관리기관명', '제공기관')
    sido, sgg = region(addr, org)
    open_text = pick(row, '운영시간', '이용시간', '개방시간')
    close_text = pick(row, '휴무일', '휴장일', '휴관일')
    o, c = hours(open_text)
    item = {
        'n': name, 'a': addr, 'sd': sido, 'sg': sgg,
        'la': round(la, 6) if la is not None else None, 'lo': round(lo, 6) if lo is not None else None,
        'h': int(num(pick(row, '홀수')) or 0) or None, 'cs': int(num(pick(row, '코스수')) or 0) or None,
        'ot': open_text, 'o': o, 'c': c, 'ct': close_text, 'cd': closed_days(close_text),
        'fee': pick(row, '이용요금', '요금'), 'tel': pick(row, '전화번호', '문의전화', '연락처'),
        'rs': pick(row, '예약방식'), 'rl': pick(row, '예약처링크', '예약링크', '홈페이지'),
        'org': org, 'sr': src, 'dt': pick(row, '데이터기준일자'),
    }
    return {k: v for k, v in item.items() if v not in ('', None, [])}


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
    for pk in ids:
        info = dataset_info(pk)
        title = info['title']
        if not re.search(r'파크\s*골프', title or ''):
            skipped.append((pk, title))
            log(f'- [{pk}] 건너뜀(파크골프 자료 아님): {title[:40]}')
            continue
        got = None
        for u in info['urls']:
            try:
                raw, ctype = get(u, binary=True)
                text = decode(raw)
                if text.lstrip().startswith('<'):
                    log(f'  [{pk}] 내려받기가 웹페이지로 응답됨 (로그인 필요 등): {u[:80]}')
                    continue
                rows = read_csv(text)
                if rows:
                    got = rows
                    break
                log(f'  [{pk}] CSV 에서 머리글을 못 찾음: {text[:80]!r}')
            except Exception as e:
                log(f'  [{pk}] 내려받기 실패: {u[:80]} {e}')
        if not got:
            log(f'- [{pk}] ❌ {title[:50]} — 자료를 못 받음')
            continue
        n0 = len(items)
        for row in got:
            it = convert(row, pk)
            if it:
                items.append(it)
        log(f'- [{pk}] ✅ {title[:50]} — {len(items) - n0}곳')
        sources.append({'id': pk, 'title': title, 'org': info['org'], 'modified': info['modified'], 'url': info['page'], 'count': len(items) - n0})
        time.sleep(0.5)

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
