import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarLinha } from '../site/js/core/timeline.js';
import { planosDoStop, indicesPorTipo } from '../site/js/core/camera.js';
import { criarTrilho, textoVale } from '../site/js/core/trilho.js';

test('criarTrilho: entra na pintura da obra e sai pelo último close do trecho', () => {
  const stops = [{id:'c',tipo:'capa'},{id:'o',tipo:'obra'},{id:'d1',tipo:'detalhe'},{id:'d2',tipo:'detalhe'},{id:'a',tipo:'abertura'}];
  const linha = criarLinha(stops);            // focos: c 0, o 100, d1 172.5, d2 217.5, a 310
  const x = { o: 2.4, d1: -1.5, d2: 1.5 };
  const trilho = criarTrilho(linha, stops, id => x[id]);
  for (const it of linha.itens) assert.equal(trilho(it.foco), 0, it.id);
  assert.equal(trilho(112), 0); assert.equal(trilho(150), 2.4); assert.equal(trilho(157.14), 2.4); assert.equal(trilho(160), 2.4);
  assert.ok(trilho(131) > 0 && trilho(131) < 2.4);
  assert.ok(trilho(166) > 0 && trilho(166) < 2.4);
  assert.equal(trilho(225.5), 0); assert.equal(trilho(265.5), 1.5); assert.equal(trilho(277.5), 1.5); assert.equal(trilho(301.5), 0);
  assert.equal(trilho(-50), 0); assert.equal(trilho(9999), 0);
});

test('criarTrilho: sem "saída" quando o close é seguido do verso', () => {
  const fim = [{id:'c',tipo:'capa'},{id:'d',tipo:'detalhe'},{id:'v',tipo:'verso'}];
  const tf = criarTrilho(criarLinha(fim), fim, () => 1.5);
  for (let vh = 0; vh < 300; vh += 7) assert.equal(tf(vh), 0);
});

test('criarTrilho: close seguido de obra, a saída termina no foco da obra', () => {
  const stops = [{id:'c',tipo:'capa'},{id:'o',tipo:'obra'},{id:'d',tipo:'detalhe'},{id:'o2',tipo:'obra'}];
  const linha = criarLinha(stops);
  const x = { o: 2.4, d: -1.5, o2: 0 };
  const trilho = criarTrilho(linha, stops, id => x[id]);
  for (const it of linha.itens) assert.equal(trilho(it.foco), 0, it.id);
  const [, , d, o2] = linha.itens;
  assert.ok(o2.foco - d.foco < 84); // o caso que a saída fixa em F + 84 quebrava
  assert.equal(trilho(d.foco + 46), -1.5); // ainda passa pelo patamar do close (encurtado)
  assert.ok(trilho(o2.foco - 3) < 0 && trilho(o2.foco - 3) > -1.5);
});

test('criarTrilho: com os dados reais, 0 em todos os focos', () => {
  const { stops } = JSON.parse(readFileSync('site/data/content.json', 'utf8'));
  const images = JSON.parse(readFileSync('site/data/images.json', 'utf8'));
  const linha = criarLinha(stops);
  const indices = indicesPorTipo(stops);
  const xDe = new Map(stops.map(s => [s.id, planosDoStop(s, indices.get(s.id), images, linha)[0].x]));
  const trilho = criarTrilho(linha, stops, id => xDe.get(id));
  assert.equal(linha.itens.length, 58);
  for (const it of linha.itens) assert.equal(trilho(it.foco), 0, it.id);
});

test('textoVale: o texto de uma parada só vale com o trilho dentro da folga', () => {
  assert.equal(textoVale(0, 0.15), true);
  assert.equal(textoVale(0.149, 0.15), true);
  assert.equal(textoVale(0.15, 0.15), false);
  assert.equal(textoVale(-2.4, 0.15), false);
});
