import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { htmlDaParada } from '../site/js/ui/base.js';

const lerJson = (c) => JSON.parse(readFileSync(new URL(c, import.meta.url), 'utf8'));
const { stops } = lerJson('../site/data/content.json');
const imgs = lerJson('../site/data/images.json');

test('htmlDaParada sobre o content.json real', () => {
  const h4 = htmlDaParada(stops[3], imgs);   // Foyer de la Danse
  assert.match(h4, /<section class="parada parada--obra" id="foyer-de-la-danse"/);
  assert.match(h4, /alt="FOYER DE LA DANSE, acrílica sobre tela, 30 x 40 cm, 2026"/);
  assert.match(h4, /srcset="[^"]*p04-a-640\.webp 640w[^"]*p04-a-1280\.webp 1280w/);
  assert.match(h4, /loading="lazy"/);
  const h2 = htmlDaParada(stops[1], imgs);
  assert.match(h2, /<strong>identidade, subjetividade, força, vulnerabilidade\s+e transformação\.<\/strong>/);
  assert.equal((h2.match(/<p[ >]/g) ?? []).length, 4);
  assert.match(htmlDaParada(stops[22], imgs), />DÚVIDEI</);
  assert.match(htmlDaParada(stops[0], imgs), /href="mailto:marceladeluna\.art@gmail\.com"/);
  assert.doesNotMatch(htmlDaParada(stops[0], imgs), /loading="lazy"/);
});

test('htmlDaParada escapa & < > e aspas', () => {
  const h = htmlDaParada({ id: 'x', tipo: 'texto', pagina: 1, titulo: 'A & <B> "C"', subtitulo: '',
    paragrafos: [[{ t: 'a < b & "c"' }]], planos: [] }, imgs);
  assert.match(h, /A &amp; &lt;B&gt; &quot;C&quot;/);
  assert.match(h, /a &lt; b &amp; &quot;c&quot;/);
});
