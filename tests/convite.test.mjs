import { test } from 'node:test'; import assert from 'node:assert/strict';
import { CONVITE, conviteVisivel } from '../site/js/core/convite.js';

test('CONVITE: rótulo em português e limiar de 3 vh', () => {
  assert.deepEqual(CONVITE, { rotulo: 'ROLE PARA ENTRAR', limiar: 3 });
});

test('conviteVisivel: só depois da abertura, com a capa em repouso', () => {
  assert.equal(conviteVisivel({ vh: 0, aberturaFim: false }), false);
  assert.equal(conviteVisivel({ vh: 0, aberturaFim: true }), true);
  assert.equal(conviteVisivel({ vh: 2.9, aberturaFim: true }), true);
});

test('conviteVisivel: esconde-se ao rolar e volta ao retornar à capa', () => {
  assert.equal(conviteVisivel({ vh: 3, aberturaFim: true }), false);
  assert.equal(conviteVisivel({ vh: 130, aberturaFim: true }), false); // outra parada
  assert.equal(conviteVisivel({ vh: 0, aberturaFim: true }), true);    // de volta à capa
});
