import { test } from 'node:test'; import assert from 'node:assert/strict';
import { SOM } from '../site/js/config.js';
import { estadoDoSom, preferenciaLida, cliqueNoBotao, botaoDoSom } from '../site/js/core/som.js';

const base = { carregado: true, gesto: true, preferencia: null, oculta: false };

test('SOM: volume 0,6 (arquivo atenuado em 9 dB), subida em 3 s, troca em 0,6 s', () => {
  assert.deepEqual(SOM, { volume: 0.6, subida: 3, troca: 0.6 });
});

test('preferenciaLida: só "ligado" ou "desligado"; o resto é nenhuma', () => {
  assert.equal(preferenciaLida('ligado'), 'ligado');
  assert.equal(preferenciaLida('desligado'), 'desligado');
  assert.equal(preferenciaLida(null), null);
  assert.equal(preferenciaLida('talvez'), null);
  assert.equal(preferenciaLida(undefined), null);
});

test('estadoDoSom: abre em silêncio e toca depois do primeiro gesto', () => {
  assert.deepEqual(estadoDoSom({ ...base, gesto: false }), { tocar: false, volume: 0 });
  assert.deepEqual(estadoDoSom(base), { tocar: true, volume: 0.6 });
  assert.deepEqual(estadoDoSom({ ...base, preferencia: 'ligado' }), { tocar: true, volume: 0.6 });
});

test('estadoDoSom: desligado não começa sozinho', () => {
  assert.deepEqual(estadoDoSom({ ...base, preferencia: 'desligado' }), { tocar: false, volume: 0 });
  assert.deepEqual(estadoDoSom({ ...base, preferencia: 'desligado', gesto: false }), { tocar: false, volume: 0 });
});

test('estadoDoSom: sem o arquivo ou com a aba oculta, não toca', () => {
  assert.deepEqual(estadoDoSom({ ...base, carregado: false }), { tocar: false, volume: 0 });
  assert.deepEqual(estadoDoSom({ ...base, oculta: true }), { tocar: false, volume: 0 });
});

test('cliqueNoBotao: tocando, desliga; sem tocar, o clique é o gesto que liga (nunca grava desligado)', () => {
  assert.equal(cliqueNoBotao({ preferencia: null, tocando: false }), 'ligado'); // só rolou com a roda: ainda não tocou
  assert.equal(cliqueNoBotao({ preferencia: 'ligado', tocando: false }), 'ligado'); // NotAllowedError ou arquivo atrasado
  assert.equal(cliqueNoBotao({ preferencia: 'desligado', tocando: false }), 'ligado');
  assert.equal(cliqueNoBotao({ preferencia: 'ligado', tocando: true }), 'desligado');
  assert.equal(cliqueNoBotao({ preferencia: null, tocando: true }), 'desligado');
});

test('botaoDoSom: rótulo, aria-pressed e barras derivam de "está tocando"', () => {
  assert.deepEqual(botaoDoSom(true), { rotulo: 'Desligar o som', pressionado: true, barras: 'tocando' });
  assert.deepEqual(botaoDoSom(false), { rotulo: 'Ligar o som', pressionado: false, barras: 'paradas' });
});
