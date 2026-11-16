import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Arquivos de texto do site (html, css, js; o vendor também).
function arquivos(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return p.startsWith(join('site', 'assets')) ? [] : arquivos(p);
    return /\.(html|css|m?js)$/.test(e.name) ? [p] : [];
  });
}

test('site servido de subcaminho (/marcela-de-luna/): nenhum caminho absoluto', () => {
  const absoluto = /(src|href)=["']\/(?!\/)|url\(\s*["']?\/(?!\/)|from\s*["']\/(?!\/)|import\(\s*["']\/(?!\/)|fetch\(\s*["'`]\/(?!\/)/;
  const lista = arquivos('site');
  assert.ok(lista.length > 20);
  for (const a of lista) assert.doesNotMatch(readFileSync(a, 'utf8'), absoluto, a);
});

test('fluxo do Pages: testes no Node 22 e, se passarem, publica site/ com as ações oficiais', () => {
  const y = readFileSync('.github/workflows/pages.yml', 'utf8');
  assert.match(y, /push:\s*\n\s*branches: \[main\]/);
  assert.match(y, /workflow_dispatch:/);
  assert.match(y, /node-version: 22/);
  assert.match(y, /run: node --test tests\/\*\.test\.mjs/);
  assert.match(y, /needs: testes/);
  for (const acao of ['checkout', 'configure-pages', 'upload-pages-artifact', 'deploy-pages']) {
    assert.match(y, new RegExp(`uses: actions/${acao}@v\\d+\\n`), acao);
  }
  assert.match(y, /path: site\n/);
  assert.match(y, /pages: write/);
  assert.match(y, /id-token: write/);
  assert.match(y, /concurrency:\s*\n\s*group: pages/);
});
