import { test } from 'node:test'; import assert from 'node:assert/strict';
import { cartaoFinal, noMeioDoGiro, giroDaFace, deCostas, opacidadeDoVulto } from '../site/js/core/final.js';

test('cartaoFinal: o último close centraliza, gira e chega ao verso', () => {
  const p = { focoFrente: 1000, focoVerso: 1072.5, frente: { x: 1.5, y: -0.25, altura: 6.2 }, verso: { x: 0, y: 0, altura: 4.6 } };
  const a = cartaoFinal(1000, p);
  assert.deepEqual([a.x, a.y, a.altura, a.giro], [1.5, -0.25, 6.2, 0]);
  assert.ok(Math.abs(a.z - (-1000 * 0.14)) < 1e-9);
  const b = cartaoFinal(1072.5, p);
  assert.deepEqual([b.x, b.y, b.altura], [0, 0, 4.6]); assert.ok(Math.abs(b.giro - Math.PI) < 1e-9);
  assert.ok(Math.abs(b.z - (-1072.5 * 0.14)) < 1e-9);
  const m = cartaoFinal(1035, p);
  assert.ok(m.giro > 0 && m.giro < Math.PI); assert.ok(m.altura < 6.2 && m.altura > 4.6);
  assert.ok(Math.abs(m.z - (-1035 * 0.14)) < 1e-9);
  assert.deepEqual(cartaoFinal(500, p), a);                                                          // antes: parado na frente
  assert.ok(Math.abs(cartaoFinal(2000, p).giro - Math.PI) < 1e-9);                                    // depois: parado no verso
  let anterior = -1; for (let vh = 1000; vh <= 1072.5; vh += 2.5) { const g = cartaoFinal(vh, p).giro; assert.ok(g >= anterior); anterior = g; }
});

test('noMeioDoGiro: só estritamente entre 0 e π', () => {
  assert.equal(noMeioDoGiro(0), false);
  assert.equal(noMeioDoGiro(Math.PI), false);
  assert.equal(noMeioDoGiro(Math.PI / 2), true);
  assert.equal(noMeioDoGiro(1e-6), true);
});

test('deCostas: a frente gira com o cartão; o verso nasce de costas (giro − π)', () => {
  assert.equal(giroDaFace(1, 'frente'), 1);
  assert.equal(giroDaFace(1, 'verso'), 1 - Math.PI);
  assert.equal(deCostas(0, 'frente'), false);
  assert.equal(deCostas(0, 'verso'), true);
  assert.equal(deCostas(Math.PI, 'frente'), true);
  assert.equal(deCostas(Math.PI, 'verso'), false);
  assert.equal(deCostas(Math.PI / 2 - 0.01, 'frente'), false); // até π/2 só a frente aparece
  assert.equal(deCostas(Math.PI / 2 - 0.01, 'verso'), true);
  assert.equal(deCostas(Math.PI / 2 + 0.01, 'frente'), true);  // depois, só o verso
  assert.equal(deCostas(Math.PI / 2 + 0.01, 'verso'), false);
});

test('opacidadeDoVulto: inteiro no foco do último close, some antes do giro e não volta', () => {
  const p = { focoFrente: 1000, focoVerso: 1072.5 };
  assert.equal(opacidadeDoVulto(1000, p), 1);
  assert.equal(opacidadeDoVulto(900, p), 1);                  // antes do foco do close
  assert.equal(opacidadeDoVulto(1002, p), 1);
  assert.ok(Math.abs(opacidadeDoVulto(1008, p) - 0.5) < 1e-9); // meio do caminho
  assert.equal(opacidadeDoVulto(1014, p), 0);
  assert.equal(opacidadeDoVulto(1040, p), 0);
  assert.equal(opacidadeDoVulto(1072.5, p), 0);               // no foco do verso
  assert.equal(opacidadeDoVulto(2000, p), 0);
  let anterior = 2; for (let vh = 1000; vh <= 1072.5; vh += 0.5) { const o = opacidadeDoVulto(vh, p); assert.ok(o <= anterior); anterior = o; }
});
