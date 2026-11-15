import { test } from 'node:test'; import assert from 'node:assert/strict';
import { carimbosEntre, corDaParada, gesto, distanciaAoRetangulo } from '../site/js/core/pincel.js';

test('carimbosEntre: passo, último carimbo e ângulo do gesto', () => {
  const c = carimbosEntre({ x: 0, y: 0 }, { x: 10, y: 0 }, 2.5);
  assert.equal(c.length, 4); assert.deepEqual(c.at(-1), { x: 10, y: 0, ang: 0 });
  assert.equal(carimbosEntre({ x: 0, y: 0 }, { x: 1, y: 0 }, 2.5).length, 0);
  assert.ok(Math.abs(carimbosEntre({ x: 0, y: 0 }, { x: 0, y: 5 }, 5)[0].ang - Math.PI / 2) < 1e-9);
});

test('carimbosEntre: espaçamento regular e sobra para o próximo trecho', () => {
  const c = carimbosEntre({ x: 0, y: 0 }, { x: 13, y: 0 }, 6);
  assert.deepEqual(c.map((p) => p.x), [6, 12]); // o 1 que sobra fica para o próximo movimento
  assert.equal(carimbosEntre({ x: 3, y: 3 }, { x: 3, y: 3 }, 6).length, 0);
  const d = carimbosEntre({ x: 0, y: 0 }, { x: -6, y: 0 }, 6);
  assert.ok(Math.abs(Math.abs(d[0].ang) - Math.PI) < 1e-9);
});

test('corDaParada: cor da primeira imagem da parada, conforme o tipo', () => {
  const images = { a: { cor: '#111111' }, b: { cor: '#222222' }, c: { cor: '#333333' } };
  assert.equal(corDaParada({ tipo: 'obra', telas: ['b', 'a'] }, images), '#222222');
  assert.equal(corDaParada({ tipo: 'capa', imagens: ['c'] }, images), '#333333');
  assert.equal(corDaParada({ tipo: 'texto', planos: [{ imagem: 'a' }, { imagem: 'b' }] }, images), '#111111');
  assert.equal(corDaParada({ tipo: 'texto' }, images), null);
  assert.equal(corDaParada(undefined, images), null);
  assert.equal(corDaParada({ tipo: 'obra', telas: ['x'] }, images), null);
});

test('gesto: devagar é largo e carregado; rápido é fino e seco', () => {
  const lento = gesto(0), rapido = gesto(10);
  assert.deepEqual(lento, { escala: 1, seca: 0, carga: 1 });
  assert.ok(rapido.escala < lento.escala && rapido.escala >= 0.6);
  assert.ok(rapido.seca > 0.4 && rapido.carga < 1);
  const meio = gesto(1.5);
  assert.ok(meio.escala < 1 && meio.escala > rapido.escala);
  assert.deepEqual(gesto(-3), lento);
  assert.deepEqual(gesto(NaN), lento);
  // o percurso gasta a tinta: mais seco e menos carregado, com limite
  const longo = gesto(0, 1200), gasto = gesto(0, 1e6);
  assert.ok(longo.seca > 0 && longo.carga < 1 && longo.escala === 1);
  assert.ok(gasto.seca > longo.seca && gasto.carga < longo.carga);
  assert.deepEqual(gasto, gesto(0, 2400));
  assert.ok(gesto(10, 1e6).seca <= 0.8 && gesto(10, 1e6).carga > 0);
});

test('distanciaAoRetangulo: zero dentro, euclidiana fora', () => {
  const r = { esq: 10, dir: 20, topo: 10, base: 30 };
  assert.equal(distanciaAoRetangulo(15, 20, r), 0);
  assert.equal(distanciaAoRetangulo(0, 20, r), 10);
  assert.equal(distanciaAoRetangulo(23, 34, r), 5);
});
