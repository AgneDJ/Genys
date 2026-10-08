const fs = require('fs');
const path = require('path');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === '.git') return [];
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

let checked = 0;
let failures = 0;
for (const file of walk('.').filter(file => file.endsWith('.google-sites.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let index = 0;
  while ((match = scripts.exec(html))) {
    index += 1;
    if (/type\s*=\s*['"](?:application\/ld\+json|application\/json)/i.test(match[1])) continue;
    try {
      Function(match[2]);
      checked += 1;
    } catch (error) {
      failures += 1;
      console.error(`${file} script ${index}: ${error.message}`);
    }
  }
}

console.log(`Parsed inline scripts: ${checked}; failures: ${failures}`);
process.exitCode = failures ? 1 : 0;
