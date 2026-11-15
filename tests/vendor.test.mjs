import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const arquivos = ['three.module.min.js','three.core.min.js','gsap.mjs','lenis.mjs'];
test('bibliotecas locais, sem importação remota', () => {
  for (const a of arquivos) {
    const txt = readFileSync(`site/vendor/${a}`, 'utf8');
    assert.ok(txt.length > 10000, a);
    assert.doesNotMatch(txt, /from\s*["']https?:/, a);
  }
});
test('fonte e index sem URL remota', () => {
  assert.ok(existsSync('site/fonts/outfit-latin-wght-normal.woff2'));
  const html = readFileSync('site/index.html', 'utf8');
  assert.doesNotMatch(html, /(src|href)=["']https?:/);
  assert.match(html, /name="robots" content="noindex, nofollow"/);
});
