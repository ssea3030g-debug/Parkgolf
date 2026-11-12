// 앱 아이콘 만들기: SVG 원본을 쓰고, 크기별 PNG 로 그린다.
// 실행: node scripts/make_icons.js   (Playwright 가 깔려 있어야 함)
// 디자인: 미니멀 플랫 — 초록 바탕, 흰 깃발, 흰 공 (그림자·광택 없음)
// - icon.svg / icon-192.png / icon-512.png : 둥근 사각형 (일반용)
// - icon-maskable.svg / icon-maskable-192.png / icon-maskable-512.png : 꽉 찬 사각형 (안드로이드가 동그라미 등으로 잘라 씀).
//   그림은 모두 가운데 안전 영역(반지름 205) 안에 있음
// - apple-touch-icon.png (180) : 꽉 찬 사각형 (아이폰이 알아서 둥글게)
// - favicon-32.png : 브라우저 탭용
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'app');

const GREEN = '#0F9D58', DEEP = '#0B7C45', WHITE = '#FFFFFF';
const art = `
  <ellipse cx="262" cy="392" rx="96" ry="22" fill="${DEEP}"/>
  <rect x="251" y="112" width="24" height="284" rx="12" fill="${WHITE}"/>
  <path d="M275 124 L392 172 Q402 176 392 180 L275 228 Z" fill="${WHITE}" stroke="${WHITE}" stroke-width="10" stroke-linejoin="round"/>
  <circle cx="168" cy="360" r="40" fill="${WHITE}"/>`;

const svgAny = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="114" fill="${GREEN}"/>${art}
</svg>
`;
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${GREEN}"/>${art}
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
