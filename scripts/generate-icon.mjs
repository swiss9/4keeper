import sharp from 'sharp';

const SIZE = 1024;
const BACKGROUND = '#09090b';
const SAFE_ZONE = 0.65;
const LOGO_SIZE = Math.round(SIZE * SAFE_ZONE);

const logoPaths = `
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

const logoSvg = `
<svg width="1254" height="1254" viewBox="0 0 1254 1254" xmlns="http://www.w3.org/2000/svg" fill="none">
${logoPaths}
</svg>`;

const logo = await sharp(Buffer.from(logoSvg), { density: 384 })
  .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain' })
  .png()
  .toBuffer();

async function composeIcon(output, background) {
  const canvas = {
    width: SIZE,
    height: SIZE,
    channels: 4,
    background: background || { r: 0, g: 0, b: 0, alpha: 0 }
  };
  await sharp({ create: canvas })
    .composite([{ input: logo, gravity: 'center' }])
    .resize(SIZE, SIZE)
    .png()
    .toFile(output);
}

await composeIcon('assets/icon-only.png', BACKGROUND);
await composeIcon('assets/icon-foreground.png', null);

await sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: BACKGROUND }
})
  .png()
  .toFile('assets/icon-background.png');

console.log(`Created ${SIZE}x${SIZE} icons on ${BACKGROUND} (${Math.round(SAFE_ZONE * 100)}% safe zone)`);
