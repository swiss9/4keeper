import sharp from 'sharp';

const SIZE = 1024;
const SCALE = 0.65;
const contentSize = Math.round(SIZE * SCALE);
const offset = Math.round((SIZE - contentSize) / 2);

const logo = `
    <path
      fill="#99989E"
      fill-rule="evenodd"
      d="
        M310 227
        H936
        V736
        L623 1004
        L309 736
        Z

        M360 273
        V715
        L623 939
        L889 715
        V273
        Z
      "
    />
    <path
      fill="#FFFFFF"
      fill-rule="evenodd"
      d="
        M619 322
        L407 550
        V615
        H641
        L642 706
        H568
        L680 834
        L799 707
        L733 705
        V617
        L797 615
        V557
        L733 555
        V323
        H734
        Z

        M641 392
        L642 556
        L492 557
        Z
      "
    />
`;

function paddedSvg(background) {
  const rect = background ? `<rect width="${SIZE}" height="${SIZE}" fill="${background}" />` : '';
  return `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  ${rect}
  <svg x="${offset}" y="${offset}" width="${contentSize}" height="${contentSize}" viewBox="0 0 1254 1254" fill="none">
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