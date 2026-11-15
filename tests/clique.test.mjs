import { test } from 'node:test'; import assert from 'node:assert/strict';
import { destinoDoClique } from '../site/js/core/clique.js';

const capa = { id: 'capa', tipo: 'capa' };
const texto = { id: 'pesquisa', tipo: 'texto' };
const abertura = { id: 'serie', tipo: 'abertura' };
const obra = { id: 'foyer', tipo: 'obra' };
const pronto = { aberturaPronta: true, mergulhoAberto: false, viajando: false };

test('tela em foco, de qualquer tipo (obra, capa, recorte de texto ou de abertura): amplia', () => {
  assert.equal(destinoDoClique({ parada: obra, emFoco: 'foyer', ...pronto }), 'mergulho');
  assert.equal(destinoDoClique({ parada: capa, emFoco: 'capa', ...pronto }), 'mergulho');
  assert.equal(destinoDoClique({ parada: texto, emFoco: 'pesquisa', ...pronto }), 'mergulho');
  assert.equal(destinoDoClique({ parada: abertura, emFoco: 'serie', ...pronto }), 'mergulho');
});

test('tela ao longe, de qualquer tipo: viagem até a parada', () => {
  for (const parada of [capa, texto, abertura, obra]) {
    assert.equal(destinoDoClique({ parada, emFoco: 'outra', ...pronto }), 'viagem', parada.tipo);
    assert.equal(destinoDoClique({ parada, emFoco: null, ...pronto }), 'viagem', parada.tipo);
  }
});

test('durante uma viagem, toda tela leva à sua parada (inclusive a em foco)', () => {
  const v = { ...pronto, viajando: true };
  assert.equal(destinoDoClique({ parada: obra, emFoco: 'foyer', ...v }), 'viagem');
  assert.equal(destinoDoClique({ parada: capa, emFoco: 'capa', ...v }), 'viagem');
});

test('antes do fim da abertura, com mergulho aberto ou sem parada: nada', () => {
  for (const parada of [capa, texto, abertura]) {
    assert.equal(destinoDoClique({ parada, emFoco: parada.id, ...pronto, aberturaPronta: false }), null, parada.tipo);
  }
  assert.equal(destinoDoClique({ parada: obra, emFoco: 'foyer', ...pronto, aberturaPronta: false }), null);
  assert.equal(destinoDoClique({ parada: obra, emFoco: 'outra', ...pronto, aberturaPronta: false }), null);
  assert.equal(destinoDoClique({ parada: obra, emFoco: 'foyer', ...pronto, mergulhoAberto: true }), null);
  assert.equal(destinoDoClique({ parada: obra, emFoco: 'outra', ...pronto, mergulhoAberto: true }), null);
  assert.equal(destinoDoClique({ parada: null, emFoco: 'foyer', ...pronto }), null);
});

test('close e verso em foco: amplia', () => {
  for (const tipo of ['detalhe', 'verso'])
    assert.equal(destinoDoClique({ parada: { id: 'x', tipo }, emFoco: 'x', aberturaPronta: true, mergulhoAberto: false, viajando: false }), 'mergulho');
});
