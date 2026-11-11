import sharp from 'sharp';

const svg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#09090b" />
  <svg x="192" y="192" width="640" height="640" viewBox="0 0 80 80">
    <path d="M 12 12 H 68 V 48 L 40 72 L 12 48 Z M 18 18 V 45 L 40 64 L 62 45 V 18 Z" fill="#a1a1aa" fill-rule="evenodd" />
    <path d="M 44 22 H 52 V 40 H 58 V 46 H 52 V 50 L 58 50 L 48 62 L 38 50 L 44 50 V 46 H 26 V 40 L 44 22 Z M 44 32 L 34 40 H 44 Z" fill="#ffffff" fill-rule="evenodd" />
  </svg>
</svg>
`;

await sharp(Buffer.from(svg))
  .resize(1024, 1024)
  .png()
  .toFile('assets/icon-only.png');

console.log('Created assets/icon-only.png (1024x1024)');
