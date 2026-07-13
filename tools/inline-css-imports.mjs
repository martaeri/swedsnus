import fs from 'fs';

const target = 'commerce.css';

const filesToInline = [
  'mobile-menu-carousel-fixes.css',
  'mobile-polish.css'
];

let css = fs.readFileSync(target, 'utf8');

const importPattern = /^@import url\("[^"]+"\);\r?\n?/gm;
const allImports = css.match(importPattern) || [];

const importsToInline = filesToInline.map(file => `@import url("${file}");`);

for (const importLine of importsToInline) {
  if (!css.includes(importLine)) {
    throw new Error(`Missing import: ${importLine}`);
  }
}

const remainingImports = allImports.filter(line => {
  const normalized = line.trim();
  return !importsToInline.includes(normalized);
});

const bodyWithoutImports = css.replace(importPattern, '').trimStart();

const inlinedCss = filesToInline
  .map(file => fs.readFileSync(file, 'utf8').trimEnd())
  .join('\n\n');

const result = [
  remainingImports.join('').trimEnd(),
  inlinedCss,
  bodyWithoutImports
].filter(Boolean).join('\n\n');

fs.writeFileSync(target, result.endsWith('\n') ? result : `${result}\n`);

for (const file of filesToInline) {
  fs.rmSync(file);
}