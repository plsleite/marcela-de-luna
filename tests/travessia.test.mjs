import { test } from 'node:test'; import assert from 'node:assert/strict';
import { retanguloNaTela, atrasosDasPalavras, caixaProjetada, fracaoVisivel } from '../site/js/core/projecao.js';

const perto = (a, b) => Math.abs(a - b) < 1e-9;

test('retanguloNaTela: plano que preenche a altura da janela', () => {
  const alt = 2 * 8 * Math.tan((35 / 2) * Math.PI / 180);
  const r = retanguloNaTela({ x: 0, y: 0, z: -10, altura: alt, largura: alt }, -2, 2);
  assert.ok(perto(r.topo, 0) && perto(r.base, 1));
  assert.ok(perto(r.esq, 0.25) && perto(r.dir, 0.75));
  assert.equal(r.d, 8);
});

test('retanguloNaTela: deslocamento lateral e vertical', () => {
  const alt = 2 * 8 * Math.tan((35 / 2) * Math.PI / 180); // altura visível a 8 unidades
  const r = retanguloNaTela({ x: alt / 2, y: -alt / 4, z: 0, altura: alt / 2, largura: alt / 2 }, 8, 1);
  assert.ok(perto(r.esq, 0.75) && perto(r.dir, 1.25)); // metade para fora pela direita
  assert.ok(perto(r.topo, 0.5) && perto(r.base, 1));
});

test('atrasosDasPalavras: 60 ms por linha, negritos 300 ms depois da última', () => {
  //        linha 0      linha 1          linha 2 (só negrito)
  const tops = [10, 10, 11, 40, 40, 41, 70, 70];
  const neg = [false, false, false, false, true, true, true, true];
  assert.deepEqual(atrasosDasPalavras(tops, neg), [0, 0, 0, 60, 420, 420, 420, 420]);
  assert.deepEqual(atrasosDasPalavras([], []), []);
});

// Matrizes 4×4 em coluna (como Matrix4.elements do three).
const IDENT = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const mundoDe = ({ x = 0, y = 0, z = 0, escala = 1, giroY = 0 }) => {
  const c = Math.cos(giroY) * escala, s = Math.sin(giroY) * escala;
  return [c, 0, -s, 0, 0, escala, 0, 0, s, 0, c, 0, x, y, z, 1];
};

test('caixaProjetada: sem rotação, escala 1 — a tela transladada (projeção identidade)', () => {
  const r = caixaProjetada(1, 0.5, mundoDe({ x: 0.5, y: -0.25 }), IDENT, IDENT, 200, 100);
  // x de 0 a 1 (NDC) → 100..200 px; y de −0,5 a 0 (NDC) → 50..75 px
  assert.deepEqual(r, { esq: 100, dir: 200, topo: 50, base: 75 });
});

test('caixaProjetada: segue a escala e a rotação em y', () => {
  const e = caixaProjetada(1, 0.5, mundoDe({ escala: 2 }), IDENT, IDENT, 200, 100);
  assert.deepEqual(e, { esq: 0, dir: 200, topo: 25, base: 75 });
  const g = caixaProjetada(1, 0.5, mundoDe({ giroY: Math.PI / 2 }), IDENT, IDENT, 200, 100);
  assert.ok(perto(g.esq, 100) && perto(g.dir, 100)); // de perfil: largura nula
  assert.ok(perto(g.topo, 37.5) && perto(g.base, 62.5));
});

test('caixaProjetada: divide pela profundidade (perspectiva)', () => {
  // projeção com w = −z: um ponto a 2 unidades da câmera fica com metade do tamanho
  const P = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0];
  const r = caixaProjetada(1, 1, mundoDe({ z: -2 }), IDENT, P, 200, 200);
  assert.ok(perto(r.esq, 75) && perto(r.dir, 125) && perto(r.topo, 75) && perto(r.base, 125));
});

test('fracaoVisivel: parte do alvo que nenhum retângulo da frente cobre', () => {
  const r = (esq, dir, topo, base) => ({ esq, dir, topo, base });
  const alvo = r(0, 1, 0, 2);                                              // área 2
  assert.equal(fracaoVisivel(alvo, []), 1);
  assert.equal(fracaoVisivel(alvo, [r(5, 6, 0, 1)]), 1);                   // não toca
  assert.equal(fracaoVisivel(alvo, [r(-1, 2, -1, 3)]), 0);                 // cobre tudo
  assert.ok(perto(fracaoVisivel(alvo, [r(0.5, 3, 0, 2)]), 0.5));           // metade da direita
  assert.ok(perto(fracaoVisivel(alvo, [r(0, 1, 0, 1), r(0, 1, 0.5, 1.5)]), 0.25)); // sobreposição conta uma vez
  assert.ok(perto(fracaoVisivel(alvo, [r(0, 0.5, 0, 1), r(0.5, 1, 1, 2)]), 0.5));  // dois cantos
  assert.equal(fracaoVisivel(r(1, 1, 0, 2), [r(0, 2, 0, 2)]), 0);          // alvo sem área
});
