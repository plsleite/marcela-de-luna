import { test } from 'node:test'; import assert from 'node:assert/strict';
import { CREDITO, COMMONS, LICENCA, textoDoCredito, linksDoCredito } from '../site/js/core/credito.js';

test('crédito da música: o texto exato da licença CC BY 3.0', () => {
  assert.equal(textoDoCredito(CREDITO),
    'Música: Camille Saint-Saëns, “O Cisne”. Alisa Weilerstein (violoncelo) e Jason Yoder (piano), Casa Branca, 2009. '
    + 'Gravação de whitehouse.gov, via Wikimedia Commons, sob licença CC BY 3.0. Editada: silêncio inicial e aplausos cortados.');
});

test('crédito da música: "Wikimedia Commons" leva ao arquivo e "CC BY 3.0" à licença', () => {
  assert.equal(COMMONS, 'https://commons.wikimedia.org/wiki/File:20091104_Alisa_Weilerstein_and_Jason_Yoder_-_Saint_Sa%C3%ABns%27_The_Swan.ogg');
  assert.equal(LICENCA, 'https://creativecommons.org/licenses/by/3.0/');
  assert.deepEqual(linksDoCredito(CREDITO), [
    { texto: 'Wikimedia Commons', href: COMMONS },
    { texto: 'CC BY 3.0', href: LICENCA },
  ]);
});

test('textoDoCredito e linksDoCredito: trechos de texto e de link, na ordem', () => {
  const t = ['a ', { texto: 'b', href: 'https://x.test/' }, ' c'];
  assert.equal(textoDoCredito(t), 'a b c');
  assert.deepEqual(linksDoCredito(t), [{ texto: 'b', href: 'https://x.test/' }]);
});
