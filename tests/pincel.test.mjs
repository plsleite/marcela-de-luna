import { test } from 'node:test'; import assert from 'node:assert/strict';
import { carimbosEntre, corDaParada, gesto, distanciaAoRetangulo, forcaSobreTexto, pigmentoPara } from '../site/js/core/pincel.js';
import { PIGMENTOS } from '../site/js/config.js';

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

test('corDaParada: pigmento da paleta pelo acento da primeira imagem (cor como reserva)', () => {
  const images = { a: { cor: '#414152' }, b: { cor: '#222222', acento: '#d6959d' }, c: { cor: '#2f3b6c' }, d: { cor: '#111111', acento: '#f0a050' } };
  assert.equal(corDaParada({ tipo: 'obra', telas: ['b', 'a'] }, images), '#e91b6a');
  assert.equal(corDaParada({ tipo: 'obra', telas: ['a', 'b'] }, images), '#305fa3');
  assert.equal(corDaParada({ tipo: 'capa', imagens: ['d'] }, images), '#f3953e');
  assert.equal(corDaParada({ tipo: 'texto', planos: [{ imagem: 'c' }, { imagem: 'b' }] }, images), '#305fa3');
  assert.equal(corDaParada({ tipo: 'texto' }, images), null);
  assert.equal(corDaParada(undefined, images), null);
  assert.equal(corDaParada({ tipo: 'obra', telas: ['x'] }, images), null);
});

test('pigmentoPara: croma baixa vai ao padrão; senão o pigmento de matiz mais próximo', () => {
  const P = PIGMENTOS;
  assert.deepEqual(P, ['#305fa3', '#e91b6a', '#d15ca1', '#f3953e']);
  assert.equal(pigmentoPara('#414152', P), '#305fa3');
  assert.equal(pigmentoPara('#e6bec0', P), '#e91b6a');
  assert.equal(pigmentoPara('#2f3b6c', P), '#305fa3');
  assert.equal(pigmentoPara('#d6959d', P), '#e91b6a');
  assert.equal(pigmentoPara('#f0a050', P), '#f3953e');
  assert.equal(pigmentoPara('#ff0000', P), '#e91b6a'); // 0° fica a 23° do rosa (circular) e 29° do laranja
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

test('forcaSobreTexto: 30% dentro do bloco, sobe até 100% em 40 px', () => {
  const r = [{ esq: 100, dir: 300, topo: 100, base: 200 }];
  const op = { dentro: 0.3, faixa: 40 };
  assert.equal(forcaSobreTexto({ x: 150, y: 150 }, r, op), 0.3);
  assert.equal(forcaSobreTexto({ x: 100, y: 150 }, r, op), 0.3); // na borda
  assert.equal(forcaSobreTexto({ x: 340, y: 150 }, r, op), 1);
  assert.equal(forcaSobreTexto({ x: 400, y: 400 }, r, op), 1);
  const meio = forcaSobreTexto({ x: 320, y: 150 }, r, op);
  assert.ok(meio > 0.3 && meio < 1);
  assert.ok(forcaSobreTexto({ x: 310, y: 150 }, r, op) < meio); // sobe com a distância
  assert.equal(forcaSobreTexto({ x: 150, y: 150 }, [], op), 1);
  // o bloco mais próximo manda; os padrões são 0,3 e 40 px
  const dois = [...r, { esq: 330, dir: 400, topo: 100, base: 200 }];
  assert.equal(forcaSobreTexto({ x: 335, y: 150 }, dois), 0.3);
});
