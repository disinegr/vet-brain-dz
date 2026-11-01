import fs from 'node:fs';
import path from 'node:path';

const site = path.resolve('site');
const course = path.join(site, 'courses/100-pervykh-paczientov-terapevta');
const files = [path.join(site, 'index.html'), path.join(course, 'index.html'), ...fs.readdirSync(path.join(course, 'assets')).filter(name => name.endsWith('.css')).map(name => path.join(course, 'assets', name))];
const missing = [];
let checked = 0;
for (const file of files) {
  const contents = fs.readFileSync(file, 'utf8');
  const refs = [];
  if (file.endsWith('.html')) {
    refs.push(...[...contents.matchAll(/\b(?:src|href|poster)="([^"]+)"/g)].map(x => x[1]));
    for (const srcset of contents.matchAll(/\bsrcset="([^"]+)"/g)) {
      refs.push(...srcset[1].split(',').map(x => x.trim().split(/\s+/)[0]));
    }
  }
  refs.push(...[...contents.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)].map(x => x[1]));
  for (const ref of refs) {
    if (!ref || ref.startsWith('#') || ref.startsWith('%23') || /^(data:|https?:|mailto:|tel:)/i.test(ref)) continue;
    const target = path.resolve(path.dirname(file), decodeURIComponent(ref.split(/[?#]/)[0]));
    checked++;
    if (!fs.existsSync(target)) missing.push({ file: path.relative(site, file), ref });
  }
}
const home = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
const detail = fs.readFileSync(path.join(course, 'index.html'), 'utf8');
const result = {
  localReferencesChecked: checked,
  missing,
  externalNavigationLinks: [...home.matchAll(/<a\b[^>]*href="(?:https?:|mailto:|tel:)[^"]*"/g)].length + [...detail.matchAll(/<a\b[^>]*href="(?:https?:|mailto:|tel:)[^"]*"/g)].length,
  courseCardLinkedLocally: home.includes('href="./courses/100-pervykh-paczientov-terapevta/index.html"'),
  removedReview: !home.includes('Marina G.'),
};
console.log(JSON.stringify(result, null, 2));
if (missing.length || result.externalNavigationLinks || !result.courseCardLinkedLocally || !result.removedReview) process.exitCode = 1;
