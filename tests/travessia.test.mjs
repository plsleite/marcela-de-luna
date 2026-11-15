import { test } from 'node:test'; import assert from 'node:assert/strict';
import { retanguloNaTela, atrasosDasPalavras } from '../site/js/core/projecao.js';

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
