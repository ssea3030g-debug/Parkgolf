#!/usr/bin/env python3
"""카카오 장소 검색으로 골프장 이름을 찾아 후보(이름·주소·좌표)를 보여 준다. 목록은 바꾸지 않음.
사용: KAKAO_KEY=... PG_LOOKUP='이름1|이름2' python3 scripts/kakao_lookup.py"""
import json, os, sys, urllib.parse, urllib.request

key = os.environ.get('KAKAO_KEY', '').strip()
names = [n.strip() for n in os.environ.get('PG_LOOKUP', '').split('|') if n.strip()]
if not key or not names:
    print('KAKAO_KEY 와 PG_LOOKUP 이 필요해요.')
    sys.exit(0)
for n in names:
    q = urllib.parse.urlencode({'query': n, 'size': 6})
    req = urllib.request.Request('https://dapi.kakao.com/v2/local/search/keyword.json?' + q, headers={'Authorization': 'KakaoAK ' + key})
    try:
        docs = json.loads(urllib.request.urlopen(req, timeout=10).read().decode()).get('documents', [])
    except Exception as e:
        print(f'### {n}: 실패 {e}')
        continue
    print(f'### {n}')
    for d in docs:
        print(f"- {d['place_name']} | {d.get('road_address_name') or '-'} | {d.get('address_name')} | {float(d['y']):.6f},{float(d['x']):.6f} | {d.get('category_name', '')}")
    if not docs:
        print('- (결과 없음)')
