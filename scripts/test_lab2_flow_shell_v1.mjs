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
if (!polish.includes("level==='PARTIAL'")) throw new Error('Slice 3 must distinguish partial research from complete research');
if (!polish.includes('Recherche Web non configurée')) throw new Error('Slice 3 must expose unconfigured Web research');
if (!polish.includes('Continuer sans recherche concurrentielle')) throw new Error('Slice 3 must not disguise unavailable research as a completed analysis');

const understandingUx = fs.readFileSync('site/lab2/idea-studio-ux.js', 'utf8');
if (!understandingUx.includes("EXPECTED_CONTRACT = 'lab2-understanding-v2'")) throw new Error('Slice 2 must require the semantic understanding v2 contract');
if (!understandingUx.includes("window.location.assign(`./idea-research.html?idea=")) throw new Error('Confirming understanding must transition directly to research');

const improvements = fs.readFileSync('site/lab2/idea-improvements.js', 'utf8');
if (!improvements.includes("EXPECTED_IMPROVEMENTS_CONTRACT='lab2-improvements-v2'")) throw new Error('Slice 4 must reject stale improvement outputs');
if (!improvements.includes('MIN_PROPOSALS=3')) throw new Error('Slice 4 must require a minimum useful proposal set');

console.log('lab2 flow shell checks: OK');
