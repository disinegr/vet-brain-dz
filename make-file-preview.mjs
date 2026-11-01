import { readFile, writeFile } from 'node:fs/promises';

const file = new URL('./site/index.html', import.meta.url);
let html = await readFile(file, 'utf8');

// Relative paths work both from file:///.../site/index.html and from the local server.
html = html
  .replaceAll(/(src|poster|data-src|data-bg|data-lazy-src|href)="\/(wp-content|assets|local\.js)([^\"]*)"/g, '$1="./$2$3"')
  .replaceAll(/url\((['"]?)\/(wp-content|assets)\//g, 'url($1./$2/')
  .replaceAll('href="/" class="header__logo"', 'href="./index.html" class="header__logo"');

await writeFile(file, html, 'utf8');
