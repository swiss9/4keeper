import sharp from 'sharp';

const SIZE = 1024;
const SCALE = 0.7;
const contentSize = Math.round(SIZE * SCALE);
const offset = Math.round((SIZE - contentSize) / 2);

const logo = `
    <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" stroke="#ffffff" stroke-width="6" fill="#09090b"/>
    <rect x="30" y="30" width="25" height="10" fill="#ffffff"/>
    <polygon points="55,40 55,55 65,55 50,80 35,55 45,55 45,30 55,30" fill="#ffffff"/>
`;

function paddedSvg(background) {
  const rect = background ? `<rect width="${SIZE}" height="${SIZE}" fill="${background}" />` : '';
  return `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  ${rect}
  <svg x="${offset}" y="${offset}" width="${contentSize}" height="${contentSize}" viewBox="0 0 100 100" fill="none">
${logo}
  </svg>
</svg>`;
}

await sharp(Buffer.from(paddedSvg('#09090b')))
  .resize(SIZE, SIZE)
  .png()
  .toFile('assets/icon-only.png');

await sharp(Buffer.from(paddedSvg(null)))
  .resize(SIZE, SIZE)
  .png()
  .toFile('assets/icon-foreground.png');

await sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: '#09090b' }
})
  .png()
  .toFile('assets/icon-background.png');

console.log(`Created padded icons (${Math.round(SCALE * 100)}% safe zone)`);