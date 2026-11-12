import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const SIZE = 1024;
const BACKGROUND = '#09090b';
const SAFE_ZONE = 0.85;
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

const ANDROID_RES = 'android/app/src/main/res';
const ADAPTIVE_SIZES = {
  ldpi: 81,
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432
};

const foreground = await sharp('assets/icon-foreground.png').toBuffer();
for (const [density, size] of Object.entries(ADAPTIVE_SIZES)) {
  const dir = `${ANDROID_RES}/mipmap-${density}`;
  await sharp(foreground)
    .resize(size, size)
    .png()
    .toFile(`${dir}/ic_launcher_foreground.png`);
  await sharp({
    create: { width: size, height: size, channels: 4, background: BACKGROUND }
  })
    .png()
    .toFile(`${dir}/ic_launcher_background.png`);
}

const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

await writeFile(`${ANDROID_RES}/mipmap-anydpi-v26/ic_launcher.xml`, adaptiveIconXml);
await writeFile(`${ANDROID_RES}/mipmap-anydpi-v26/ic_launcher_round.xml`, adaptiveIconXml);

console.log(`Created ${SIZE}x${SIZE} icons on ${BACKGROUND} (${Math.round(SAFE_ZONE * 100)}% safe zone)`);
