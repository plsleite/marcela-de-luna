import { test } from 'node:test'; import assert from 'node:assert/strict';
import { SOM } from '../site/js/config.js';
import { estadoDoSom, preferenciaLida, alternada } from '../site/js/core/som.js';

const base = { carregado: true, gesto: true, preferencia: null, oculta: false };

test('SOM: volume 0,22, entrada em 3 s, troca em 0,6 s', () => {
  assert.deepEqual(SOM, { volume: 0.22, entrada: 3, troca: 0.6 });
});

test('preferenciaLida: só "ligado" ou "desligado"; o resto é nenhuma', () => {
  assert.equal(preferenciaLida('ligado'), 'ligado');
  assert.equal(preferenciaLida('desligado'), 'desligado');
  assert.equal(preferenciaLida(null), null);
  assert.equal(preferenciaLida('talvez'), null);
  assert.equal(preferenciaLida(undefined), null);
});

test('estadoDoSom: abre em silêncio e toca depois do primeiro gesto', () => {
  assert.deepEqual(estadoDoSom({ ...base, gesto: false }), { ligado: true, tocar: false, volume: 0 });
  assert.deepEqual(estadoDoSom(base), { ligado: true, tocar: true, volume: 0.22 });
  assert.deepEqual(estadoDoSom({ ...base, preferencia: 'ligado' }), { ligado: true, tocar: true, volume: 0.22 });
});

test('estadoDoSom: desligado não começa sozinho', () => {
  assert.deepEqual(estadoDoSom({ ...base, preferencia: 'desligado' }), { ligado: false, tocar: false, volume: 0 });
  assert.deepEqual(estadoDoSom({ ...base, preferencia: 'desligado', gesto: false }), { ligado: false, tocar: false, volume: 0 });
});

test('estadoDoSom: sem o arquivo ou com a aba oculta, não toca', () => {
  assert.deepEqual(estadoDoSom({ ...base, carregado: false }), { ligado: true, tocar: false, volume: 0 });
  assert.deepEqual(estadoDoSom({ ...base, oculta: true }), { ligado: true, tocar: false, volume: 0 });
});

test('alternada: ligado (ou sem escolha) → desligado; desligado → ligado', () => {
  assert.equal(alternada(null), 'desligado');
  assert.equal(alternada('ligado'), 'desligado');
  assert.equal(alternada('desligado'), 'ligado');
});
