import { readFile, mkdir, writeFile } from 'node:fs/promises';

const source = new URL('./site/wp-content/uploads/2026/10/Снимок-экрана-2026-10-23-225553-300x51.png', import.meta.url);
const target = new URL('./site/assets/vet-academy-logo.svg', import.meta.url);
const png = await readFile(source);

// Preserve the exact lettering from the site's logo and make its flat gray
// screenshot background transparent. Red pixels have a higher R than G value.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="51" viewBox="0 0 300 51">
  <filter id="remove-gray" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="
      1 0 0 0 0
      0 1 0 0 0
      0 0 1 0 0
      1 -1 0 0 0"/>
  </filter>
  <image width="300" height="51" href="data:image/png;base64,${png.toString('base64')}" filter="url(#remove-gray)"/>
</svg>`;

await mkdir(new URL('./site/assets/', import.meta.url), { recursive: true });
await writeFile(target, svg, 'utf8');
