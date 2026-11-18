import { test } from 'node:test'; import assert from 'node:assert/strict';
import { CONVITE, estadoDoConvite } from '../site/js/core/convite.js';

test('CONVITE: rótulo em português e limiar de 3 vh', () => {
  assert.deepEqual(CONVITE, { rotulo: 'ROLE PARA ENTRAR', limiar: 3 });
});

test('estadoDoConvite: espera a abertura, aparece na capa parada', () => {
  assert.equal(estadoDoConvite('espera', { vh: 0, aberturaFim: false }), 'espera');
  assert.equal(estadoDoConvite('espera', { vh: 0, aberturaFim: true }), 'visivel');
  assert.equal(estadoDoConvite('visivel', { vh: 2.9, aberturaFim: true }), 'visivel');
});

test('estadoDoConvite: a rolagem a partir do limiar dispensa, mesmo durante a abertura', () => {
  assert.equal(estadoDoConvite('visivel', { vh: 3, aberturaFim: true }), 'dispensado');
  assert.equal(estadoDoConvite('espera', { vh: 130, aberturaFim: false }), 'dispensado'); // página restaurada
});

test('estadoDoConvite: dispensado é definitivo (não volta ao retornar à capa)', () => {
  assert.equal(estadoDoConvite('dispensado', { vh: 0, aberturaFim: true }), 'dispensado');
});
