import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const html = await readFile('site/index.html', 'utf8');
const refs = [...html.matchAll(/(?:src|poster|data-src|data-bg|data-lazy-src|href)="(\.\/(?:wp-content|assets|local\.js)[^"?#]*)/g)].map(match => match[1]);
const backgrounds = [...html.matchAll(/url\(['"]?(\.\/(?:wp-content|assets)\/[^'"\)]+)/g)].map(match => match[1]);
const missing = [];

for (const ref of [...refs, ...backgrounds]) {
  try { await stat(join('site', decodeURIComponent(ref))); }
  catch { missing.push(ref); }
}

const result = {
  relativeReferences: refs.length,
  inlineBackgrounds: backgrounds.length,
  missing: [...new Set(missing)],
  absoluteAssetReferences: (html.match(/(?:src|href)="\/(?:wp-content|assets|local\.js)/g) || []).length
};
console.log(JSON.stringify(result, null, 2));
if (result.missing.length || result.absoluteAssetReferences) process.exitCode = 1;
