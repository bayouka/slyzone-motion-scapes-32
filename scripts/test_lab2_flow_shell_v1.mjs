import fs from 'node:fs';

const pages = [
  ['site/lab2/idea-research.html', 'idea-research.js'],
  ['site/lab2/idea-improvements.html', 'idea-improvements.js'],
  ['site/lab2/idea-brief.html', 'idea-brief.js'],
  ['site/lab2/idea-structure.html', 'idea-structure.js'],
  ['site/lab2/idea-design.html', 'idea-design.js'],
  ['site/lab2/idea-mockups.html', 'idea-mockups.js']
];

for (const [path, pageScript] of pages) {
  const html = fs.readFileSync(path, 'utf8');
  const configAt = html.indexOf('./runtime-config.js');
  const authAt = html.indexOf('./lab2-auth.js');
  const pageAt = html.indexOf(`./${pageScript}`);
  if (configAt < 0 || authAt < 0 || pageAt < 0) throw new Error(`${path}: missing shared auth scripts`);
  if (!(configAt < authAt && authAt < pageAt)) throw new Error(`${path}: auth scripts must load before ${pageScript}`);
}

const research = fs.readFileSync('site/lab2/idea-research.html', 'utf8');
if (!research.includes('./idea-improvements.html')) throw new Error('Slice 3 must provide a route to Slice 4');
if (!research.includes('./idea-research-polish.js')) throw new Error('Slice 3 transparency polish must be loaded');

const polish = fs.readFileSync('site/lab2/idea-research-polish.js', 'utf8');
if (!polish.includes('Analyse limitée')) throw new Error('Slice 3 must distinguish limited research from complete research');

console.log('lab2 flow shell checks: OK');
