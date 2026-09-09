import fs from 'node:fs';

const parts = [
  'site/assets/styles.css',
  'site/assets/live.css',
  'site/assets/home-polish.css',
  'site/assets/v434-polish.css',
  'site/assets/v435-final.css',
  'site/assets/home-mobile-layout-v1.css',
];

let expected = `/* 4b4c legacy core bundle — generated in source order for V4.5.6
   Consolidates historical global layers while pruning rules proven shadowed later in the cascade.
   V5 design layer must remain loaded after this file. */\n\n`;

for (const path of parts) {
  const content = fs.readFileSync(path, 'utf8');
  const name = path.split('/').pop();
  expected += `\n/* ===== BEGIN ${name} ===== */\n${content}\n/* ===== END ${name} ===== */\n`;
}

const actual = fs.readFileSync('site/assets/core-legacy-v455.css', 'utf8');
if (actual !== expected) {
  console.error('CSS BUNDLE CHECK FAILED: core-legacy-v455.css is not an exact ordered bundle of its source layers.');
  process.exit(1);
}

console.log('css bundle: OK');
