// 앱 아이콘 만들기: SVG 원본을 쓰고, 크기별 PNG 로 그린다.
// 실행: node scripts/make_icons.js   (Playwright 가 깔려 있어야 함)
// - icon.svg / icon-192.png / icon-512.png : 둥근 사각형 (일반용)
// - icon-maskable.svg / icon-maskable-192.png / icon-maskable-512.png : 꽉 찬 사각형, 그림은 가운데 안전 영역 안 (안드로이드가 동그라미 등으로 잘라 씀)
// - apple-touch-icon.png (180) : 꽉 찬 사각형 (아이폰이 알아서 둥글게)
// - favicon-32.png : 브라우저 탭용
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'app');

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#3CCB7F"/><stop offset="0.55" stop-color="#14935A"/><stop offset="1" stop-color="#08643C"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.22" cy="0.16" r="0.75">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.42"/><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0.08"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hillBack" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#62D088"/><stop offset="1" stop-color="#239055"/>
    </linearGradient>
    <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#A8EEB2"/><stop offset="0.35" stop-color="#6FD38A"/><stop offset="1" stop-color="#2F9F5E"/>
    </linearGradient>
    <linearGradient id="flag" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFB25C"/><stop offset="0.55" stop-color="#FF7A3A"/><stop offset="1" stop-color="#E64422"/>
    </linearGradient>
    <linearGradient id="pole" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="#F2F5F3"/><stop offset="1" stop-color="#BFCBC4"/>
    </linearGradient>
    <radialGradient id="ball" cx="0.36" cy="0.3" r="0.78">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#F3F6F4"/><stop offset="0.85" stop-color="#D9E2DD"/><stop offset="1" stop-color="#B9C6BF"/>
    </radialGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FFF6C8"/><stop offset="0.6" stop-color="#FFE071"/><stop offset="1" stop-color="#FFC93C"/>
    </radialGradient>
    <radialGradient id="sunHalo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FFE98A" stop-opacity="0.55"/><stop offset="1" stop-color="#FFE98A" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="hole" cx="0.5" cy="0.35" r="0.6">
      <stop offset="0" stop-color="#03200F"/><stop offset="1" stop-color="#0D4A2B"/>
    </radialGradient>
    <filter id="drop" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#043A22" flood-opacity="0.38"/>
    </filter>
    <filter id="dropSm" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="2" dy="6" stdDeviation="5" flood-color="#043A22" flood-opacity="0.32"/>
    </filter>
    <clipPath id="ballClip"><circle cx="0" cy="0" r="76"/></clipPath>
  </defs>`;

// 공의 보조개 무늬 (공 중심 기준 좌표)
function dimples() {
  const pts = [];
  for (let row = -3; row <= 3; row++) {
    for (let col = -3; col <= 3; col++) {
      const x = col * 26 + (row % 2 ? 13 : 0), y = row * 23;
      const d = Math.hypot(x, y);
      if (d > 70) continue;
      const k = 1 - Math.pow(d / 76, 2) * 0.55; // 가장자리로 갈수록 작고 옅게
      pts.push(`<ellipse cx="${x}" cy="${y}" rx="${(7.2 * k).toFixed(1)}" ry="${(6.6 * k).toFixed(1)}" fill="#9FB1A7" fill-opacity="${(0.42 * k).toFixed(2)}"/>`);
    }
  }
  return pts.join('');
}

// 배경을 뺀 그림 (512 칸 기준). fg 는 앞쪽 물체(해·깃발·공)만 따로 줄일 때 쓰는 변환
function art(fg = '') {
  return `
  <rect width="512" height="512" fill="url(#glow)"/>
  <!-- 해 -->
  <g transform="${fg}">
    <circle cx="122" cy="122" r="66" fill="url(#sunHalo)"/>
    <circle cx="122" cy="122" r="38" fill="url(#sun)"/>
  </g>
  <!-- 뒤 언덕 -->
  <path d="M0 318 C 110 268, 250 290, 340 270 C 420 252, 470 238, 512 236 L512 512 L0 512 Z" fill="url(#hillBack)"/>
  <!-- 앞 언덕 (그린) -->
  <path d="M0 384 C 120 330, 300 352, 400 330 C 450 319, 490 306, 512 300 L512 512 L0 512 Z" fill="url(#hill)"/>
  <path d="M0 384 C 120 330, 300 352, 400 330 C 450 319, 490 306, 512 300" fill="none" stroke="#D9FBDE" stroke-opacity="0.65" stroke-width="5"/>
  <g transform="${fg}">
    <!-- 홀컵 -->
    <ellipse cx="330" cy="352" rx="44" ry="13" fill="url(#hole)"/>
    <path d="M286 352 A44 13 0 0 0 374 352" fill="none" stroke="#C8F3D1" stroke-opacity="0.55" stroke-width="3"/>
    <!-- 깃대 -->
    <g filter="url(#dropSm)">
      <rect x="322" y="104" width="15" height="252" rx="7.5" fill="url(#pole)"/>
      <circle cx="329.5" cy="102" r="11" fill="#FFFFFF"/>
    </g>
    <!-- 깃발 (펄럭임) -->
    <g filter="url(#dropSm)">
      <path d="M336 112 C 368 100, 392 128, 436 116 C 446 113, 452 116, 448 126 L 430 160 L 448 196 C 452 205, 446 208, 436 206 C 392 216, 370 188, 336 200 Z" fill="url(#flag)"/>
      <path d="M336 150 C 368 140, 392 166, 436 156 L 430 160 L 448 196 C 452 205, 446 208, 436 206 C 392 216, 370 188, 336 200 Z" fill="#B8321A" fill-opacity="0.22"/>
      <path d="M340 118 C 368 108, 390 130, 428 122" fill="none" stroke="#FFE2B8" stroke-opacity="0.75" stroke-width="5" stroke-linecap="round"/>
    </g>
    <!-- 공 그림자 -->
    <ellipse cx="196" cy="440" rx="74" ry="14" fill="#0B5A34" fill-opacity="0.38"/>
    <!-- 공 -->
    <g transform="translate(178 362)">
      <circle cx="0" cy="0" r="76" fill="url(#ball)" filter="url(#drop)"/>
      <g clip-path="url(#ballClip)">${dimples()}</g>
      <circle cx="0" cy="0" r="76" fill="none" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="2"/>
      <ellipse cx="-26" cy="-34" rx="26" ry="15" fill="#FFFFFF" fill-opacity="0.9" transform="rotate(-32 -26 -34)"/>
      <ellipse cx="-44" cy="-14" rx="6" ry="4" fill="#FFFFFF" fill-opacity="0.8" transform="rotate(-32 -44 -14)"/>
    </g>
  </g>`;
}

const svgAny = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}
  <clipPath id="round"><rect width="512" height="512" rx="114"/></clipPath>
  <g clip-path="url(#round)">
    <rect width="512" height="512" fill="url(#bg)"/>${art()}
    <rect x="1.5" y="1.5" width="509" height="509" rx="112.5" fill="none" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="3"/>
  </g>
</svg>
`;
// 꽉 찬 사각형: 앞쪽 물체를 가운데로 조금 모아(0.92배, 안전 영역 반지름 205 안) 동그라미로 잘려도 안 잘리게
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}
  <rect width="512" height="512" fill="url(#bg)"/>${art('translate(256 268) scale(0.92) translate(-256 -268)')}
</svg>
`;

(async () => {
  fs.writeFileSync(path.join(OUT, 'icon.svg'), svgAny);
  fs.writeFileSync(path.join(OUT, 'icon-maskable.svg'), svgMaskable);
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const p = await b.newPage();
  const shot = async (svg, size, file) => {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await p.screenshot({ path: path.join(OUT, file), omitBackground: true });
  };
  await shot(svgAny, 512, 'icon-512.png');
  await shot(svgAny, 192, 'icon-192.png');
  await shot(svgAny, 32, 'favicon-32.png');
  await shot(svgMaskable, 512, 'icon-maskable-512.png');
  await shot(svgMaskable, 192, 'icon-maskable-192.png');
  await shot(svgMaskable, 180, 'apple-touch-icon.png');
  await b.close();
  console.log('아이콘을 만들었어요:', fs.readdirSync(OUT).filter(f => /icon|favicon/.test(f)).join(', '));
})();
