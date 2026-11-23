import fs from 'node:fs';
import crypto from 'node:crypto';

function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.git' || file === 'review') continue;
    const full = dir + '/' + file;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getHtmlFiles(full));
    } else if (file === 'index.html') {
      results.push(full);
    }
  }
  return results;
}

const allPages = getHtmlFiles('.').map(p => p.replace(/^\.\//, ''));
console.log('Total pages found:', allPages.length);

const hashes = new Map();
const pagesWithHero = [];
let duplicates = 0;

allPages.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const match = html.match(/<header class="[^"]*hero[^"]*">[\s\S]*?<figure class="hero-img"><img src="([^"]+)"/);
  if (!match) return; // home or non-plate hero
  const imgPath = match[1].replace(/^\//, '');
  if (!fs.existsSync(imgPath)) {
    console.log('IMAGE NOT FOUND:', imgPath, 'in', file);
    return;
  }
  const buf = fs.readFileSync(imgPath);
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  const size = (buf.length / 1024).toFixed(1) + ' KB';
  pagesWithHero.push({ file, imgPath, size, hash });
  if (hashes.has(hash)) {
    console.log('DUPLICATE:', file, 'shares image with', hashes.get(hash).file, '(' + imgPath + ')');
    duplicates++;
  } else {
    hashes.set(hash, { file, imgPath, size });
  }
});

console.log('---');
console.log('Pages with hero plates:', pagesWithHero.length);
console.log('Unique image hashes:', hashes.size);
console.log('Total duplicate hero images:', duplicates);
console.log('All heroes 100% unique:', duplicates === 0 && hashes.size === pagesWithHero.length);
