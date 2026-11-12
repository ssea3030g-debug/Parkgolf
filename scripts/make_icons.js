// 앱 아이콘 만들기: SVG 원본을 쓰고, 크기별 PNG 로 그린다.
// 실행: node scripts/make_icons.js   (Playwright 가 깔려 있어야 함)
// - icon.svg / icon-192.png / icon-512.png : 둥근 사각형 (일반용, 얇은 금테)
// - icon-maskable.svg / icon-maskable-192.png / icon-maskable-512.png : 꽉 찬 사각형, 그림은 가운데 안전 영역 안 (안드로이드가 동그라미 등으로 잘라 씀)
// - apple-touch-icon.png (180) : 꽉 찬 사각형 (아이폰이 알아서 둥글게)
// - favicon-32.png : 브라우저 탭용
// 디자인: 깊은 에메랄드 배경 + 금속 금색(깃대·홀컵 테·금테) + 와인색 깃발 + 진주빛 공
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'app');

const defs = `
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.24" r="0.95">
      <stop offset="0" stop-color="#1E8B5C"/><stop offset="0.38" stop-color="#0E5F3D"/><stop offset="0.75" stop-color="#073823"/><stop offset="1" stop-color="#031C11"/>
    </radialGradient>
    <radialGradient id="spot" cx="0.42" cy="0.18" r="0.62">
      <stop offset="0" stop-color="#E9FFF2" stop-opacity="0.30"/><stop offset="0.5" stop-color="#E9FFF2" stop-opacity="0.06"/><stop offset="1" stop-color="#E9FFF2" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.72">
      <stop offset="0.62" stop-color="#000000" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.38"/>
    </radialGradient>
    <linearGradient id="farHill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#16774B"/><stop offset="1" stop-color="#0A472D"/>
    </linearGradient>
    <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3DB57A"/><stop offset="0.3" stop-color="#259A61"/><stop offset="1" stop-color="#0B4F31"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#B8FFD6" stop-opacity="0"/><stop offset="0.35" stop-color="#B8FFD6" stop-opacity="0.75"/><stop offset="0.75" stop-color="#B8FFD6" stop-opacity="0.35"/><stop offset="1" stop-color="#B8FFD6" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF4C9"/><stop offset="0.22" stop-color="#F1CF78"/><stop offset="0.48" stop-color="#B9852A"/><stop offset="0.7" stop-color="#F7DC8E"/><stop offset="1" stop-color="#8E5E17"/>
    </linearGradient>
    <linearGradient id="goldPole" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8E5E17"/><stop offset="0.3" stop-color="#F7DC8E"/><stop offset="0.55" stop-color="#FFF6D6"/><stop offset="0.8" stop-color="#D3A44A"/><stop offset="1" stop-color="#7A4E12"/>
    </linearGradient>
    <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF1C4" stop-opacity="0.9"/><stop offset="0.5" stop-color="#C99A42" stop-opacity="0.55"/><stop offset="1" stop-color="#FFE7A6" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="flag" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E23A4E"/><stop offset="0.5" stop-color="#B3122E"/><stop offset="1" stop-color="#6E0A1E"/>
    </linearGradient>
    <linearGradient id="flagSheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.35"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="pearl" cx="0.34" cy="0.28" r="0.82">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.45" stop-color="#F6F8F7"/><stop offset="0.78" stop-color="#DDE5E1"/><stop offset="1" stop-color="#A9B8B0"/>
    </radialGradient>
    <radialGradient id="hole" cx="0.5" cy="0.3" r="0.65">
      <stop offset="0" stop-color="#000704"/><stop offset="1" stop-color="#062417"/>
    </radialGradient>
    <filter id="drop" x="-35%" y="-30%" width="170%" height="175%">
      <feDropShadow dx="0" dy="12" stdDeviation="11" flood-color="#010D07" flood-opacity="0.55"/>
    </filter>
    <filter id="dropSm" x="-40%" y="-30%" width="180%" height="170%">
      <feDropShadow dx="3" dy="7" stdDeviation="6" flood-color="#010D07" flood-opacity="0.45"/>
    </filter>
    <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="blur18" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
    <clipPath id="ballClip"><circle cx="0" cy="0" r="80"/></clipPath>
  </defs>`;

// 공의 보조개: 아래쪽 그늘 + 위쪽 반사로 오목하게 보이게
function dimples() {
  const out = [];
  for (let row = -4; row <= 4; row++) for (let col = -4; col <= 4; col++) {
    const x = col * 23 + (row % 2 ? 11.5 : 0), y = row * 20;
    const d = Math.hypot(x, y); if (d > 74) continue;
    const k = 1 - Math.pow(d / 80, 2) * 0.6;
    const rx = (6.4 * k).toFixed(1), ry = (5.8 * k).toFixed(1);
    out.push(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#8FA39A" fill-opacity="${(0.34 * k).toFixed(2)}"/>`);
    out.push(`<ellipse cx="${(x + 1.4).toFixed(1)}" cy="${(y + 1.6).toFixed(1)}" rx="${(rx * 0.55).toFixed(1)}" ry="${(ry * 0.5).toFixed(1)}" fill="#FFFFFF" fill-opacity="${(0.55 * k).toFixed(2)}"/>`);
  }
  return out.join('');
}

// 배경 위의 그림. fg: 앞쪽 물체(깃발·홀·공)만 줄일 때의 변환
function art(fg = '') {
  return `
  <rect width="512" height="512" fill="url(#spot)"/>
  <!-- 먼 언덕 -->
  <path d="M0 300 C 120 262, 240 282, 330 266 C 410 252, 468 236, 512 232 L512 512 L0 512 Z" fill="url(#farHill)"/>
  <!-- 그린 -->
  <path d="M0 378 C 110 330, 290 356, 396 334 C 448 323, 488 310, 512 304 L512 512 L0 512 Z" fill="url(#green)"/>
  <path d="M0 378 C 110 330, 290 356, 396 334 C 448 323, 488 310, 512 304" fill="none" stroke="url(#rim)" stroke-width="4"/>
  <!-- 그린 위 잔디결 (은은한 줄무늬) -->
  <g fill="none" stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="18">
    <path d="M-20 430 C 120 390, 300 410, 540 360"/><path d="M-20 490 C 120 450, 300 470, 540 420"/>
  </g>
  <rect width="512" height="512" fill="url(#vignette)"/>
  <g transform="${fg}">
    <!-- 홀컵 + 금테 -->
    <ellipse cx="330" cy="348" rx="42" ry="12.5" fill="url(#hole)"/>
    <ellipse cx="330" cy="348" rx="42" ry="12.5" fill="none" stroke="url(#gold)" stroke-width="3.5"/>
    <!-- 깃대 (금속 금색) -->
    <g filter="url(#dropSm)">
      <rect x="322.5" y="98" width="14" height="250" rx="7" fill="url(#goldPole)"/>
      <circle cx="329.5" cy="94" r="12" fill="url(#gold)"/>
      <circle cx="326" cy="90" r="4" fill="#FFFBEA" fill-opacity="0.9"/>
    </g>
    <!-- 깃발 (와인색, 펄럭임) -->
    <g filter="url(#dropSm)">
      <path d="M336.5 108 C 370 96, 396 124, 440 112 C 449 109.5, 455 112, 451 121 L 433 156 L 451 192 C 455 201, 449 204, 440 202 C 396 212, 371 184, 336.5 196 Z" fill="url(#flag)"/>
      <path d="M336.5 108 C 370 96, 396 124, 440 112 C 449 109.5, 455 112, 451 121 L 446 131 C 400 140, 372 116, 336.5 128 Z" fill="url(#flagSheen)"/>
      <path d="M336.5 150 C 370 140, 396 164, 436 154 L 433 156 L 451 192 C 455 201, 449 204, 440 202 C 396 212, 371 184, 336.5 196 Z" fill="#3A0410" fill-opacity="0.25"/>
      <path d="M336.5 196 C 371 184, 396 212, 440 202" fill="none" stroke="url(#gold)" stroke-width="2.5" stroke-opacity="0.8"/>
    </g>
    <!-- 공 그림자 -->
    <ellipse cx="200" cy="446" rx="78" ry="14" fill="#010D07" fill-opacity="0.5" filter="url(#blur6)"/>
    <!-- 공 (진주빛) -->
    <g transform="translate(182 364)">
      <circle r="80" fill="url(#pearl)" filter="url(#drop)"/>
      <g clip-path="url(#ballClip)">${dimples()}
        <circle cx="30" cy="36" r="70" fill="#2E7A55" fill-opacity="0.10" filter="url(#blur18)"/>
      </g>
      <circle r="79" fill="none" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="2.2"/>
      <path d="M 52 50 A 78 78 0 0 1 -6 78" fill="none" stroke="#9EF0C2" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="-27" cy="-37" rx="27" ry="15" fill="#FFFFFF" fill-opacity="0.95" transform="rotate(-32 -27 -37)"/>
      <path d="M -50 -6 l 3 -9 l 3 9 l 9 3 l -9 3 l -3 9 l -3 -9 l -9 -3 z" fill="#FFFFFF" fill-opacity="0.9"/>
    </g>
  </g>`;
}

const svgAny = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}
  <clipPath id="round"><rect width="512" height="512" rx="114"/></clipPath>
  <g clip-path="url(#round)">
    <rect width="512" height="512" fill="url(#bg)"/>${art()}
    <!-- 얇은 금테 -->
    <rect x="16" y="16" width="480" height="480" rx="100" fill="none" stroke="url(#frame)" stroke-width="3"/>
    <rect x="1.5" y="1.5" width="509" height="509" rx="112.5" fill="none" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="3"/>
  </g>
</svg>
`;
// 꽉 찬 사각형: 앞쪽 물체를 가운데로 조금 모아(0.92배, 안전 영역 반지름 205 안). 금테는 잘리므로 넣지 않음
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
