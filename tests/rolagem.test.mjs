import { test } from 'node:test'; import assert from 'node:assert/strict';
import { vhDe, pxDe, posicaoRestaurada } from '../site/js/core/rolagem.js';

test('px ↔ vh: a mesma posição em qualquer altura de janela', () => {
  assert.equal(vhDe(3600, 900), 400);
  assert.equal(pxDe(400, 900), 3600);
  assert.equal(pxDe(400, 700), 2800);
  assert.equal(vhDe(0, 700), 0);
  // ida e volta entre alturas: 1440×900 → 1200×700 → 1440×900 volta ao mesmo px
  const vh = vhDe(3600, 900);
  assert.equal(vhDe(pxDe(vh, 700), 700), vh);
  assert.equal(pxDe(vhDe(pxDe(vh, 700), 700), 900), 3600);
});

test('vhDe: altura nula ou inválida não produz NaN nem Infinity', () => {
  assert.equal(vhDe(100, 0), 0);
  assert.equal(vhDe(NaN, 900), 0);
});

test('posicaoRestaurada: vh salvo vira px na altura atual, só no mesmo modo', () => {
  assert.equal(posicaoRestaurada({ vh: 400, travessia: true }, true, 700), 2800);
  assert.equal(posicaoRestaurada({ vh: 400, travessia: true }, true, 900), 3600);
  assert.equal(posicaoRestaurada({ vh: 400, travessia: true }, false, 900), null);
  assert.equal(posicaoRestaurada({ vh: 50, travessia: false }, false, 800), 400);
});

test('posicaoRestaurada: nada salvo, topo ou formato antigo não restauram', () => {
  assert.equal(posicaoRestaurada(null, true, 900), null);
  assert.equal(posicaoRestaurada(undefined, true, 900), null);
  assert.equal(posicaoRestaurada({ vh: 0, travessia: true }, true, 900), null);
  assert.equal(posicaoRestaurada({ y: 3600, travessia: true }, true, 900), null); // px da versão anterior
  assert.equal(posicaoRestaurada({ vh: 'x', travessia: true }, true, 900), null);
  assert.equal(posicaoRestaurada({ vh: -10, travessia: true }, true, 900), null);
});
