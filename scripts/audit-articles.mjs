import fs from 'node:fs';
import crypto from 'node:crypto';

const glob = [
  'stack/index.html',
  'architecture/index.html',
  'decisions/index.html',
  'benchmarks/index.html',
  'journal/index.html'
];

fs.readdirSync('library').forEach(f => {
  if (fs.existsSync('library/' + f + '/index.html')) glob.push('library/' + f + '/index.html');
});
fs.readdirSync('guides').forEach(f => {
  if (fs.existsSync('guides/' + f + '/index.html')) glob.push('guides/' + f + '/index.html');
});

console.log('Auditing ' + glob.length + ' articles:');
const hashes = new Map();
let duplicates = 0;

glob.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const match = html.match(/<header class="hero plate">[\s\S]*?<figure class="hero-img"><img src="([^"]+)"/);
  if (!match) {
    console.log('MISSING hero plate in:', file);
    return;
  }
  const imgPath = match[1].replace(/^\//, '');
  if (!fs.existsSync(imgPath)) {
    console.log('IMAGE NOT FOUND:', imgPath, 'in', file);
    return;
  }
  const buf = fs.readFileSync(imgPath);
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  const size = (buf.length / 1024).toFixed(1) + ' KB';
  if (hashes.has(hash)) {
    console.log('DUPLICATE:', file, 'shares image with', hashes.get(hash).file, '(' + imgPath + ')');
    duplicates++;
  } else {
    hashes.set(hash, { file, imgPath, size });
    console.log('OK:', file.padEnd(46), '->', imgPath.padEnd(40), size, hash.slice(0, 8));
  }
});

console.log('---');
console.log('Total articles audited:', glob.length);
console.log('Total unique image hashes:', hashes.size);
console.log('All articles 100% dedicated & unique:', duplicates === 0 && hashes.size === glob.length);
