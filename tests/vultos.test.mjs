import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarLinha, focoDe } from '../site/js/core/timeline.js';
import { cartaoFinal } from '../site/js/core/final.js';
import { zDoStop, planosDoStop, indicesPorTipo, ladosDosDetalhes, fovPara } from '../site/js/core/camera.js';
import { retanguloNaTela, fracaoVisivel } from '../site/js/core/projecao.js';
import { brancura, alfa } from '../site/js/core/vulto.js';
import { DIST_FOCO, VISIBILIDADE, VISIBILIDADE_DETALHE } from '../site/js/config.js';

const perto = (a, b, tol = 1e-3) => Math.abs(a - b) < tol;

test('brancura e alfa: o mesmo smoothstep do shader de gl/tela.js', () => {
  const V = VISIBILIDADE_DETALHE;
  assert.equal(brancura(9, V), 0);
  assert.ok(perto(brancura(12, V), 0.5 * 0.92));
  assert.ok(perto(brancura(14.3, V), 0.92) && perto(brancura(18.15, V), 0.92));
  assert.ok(perto(brancura(18.15, V, 1), 0.63));                 // com realce, cai até realce
  assert.ok(perto(brancura(18.15, V, 0.5), (0.92 + 0.63) / 2));
  assert.equal(brancura(5, V, 1), 0);                            // em foco, o realce não muda nada
  assert.equal(alfa(14.3, V), 1); assert.equal(alfa(18.15, V), 1);
  assert.equal(alfa(20.6, V), 0); assert.equal(alfa(24.45, V), 0);
  assert.equal(alfa(1.7, V), 0);                                 // rente à câmera
  assert.ok(perto(alfa(19.5, V), 0.5));
});

// Do foco de cada parada A, a primeira tela da parada seguinte é um vulto com realce, visível em
// pelo menos 40% fora das telas de A; nada mais adiante aparece. Janela 1440 × 900. O verso,
// seguido do último close, é o cartão final (main.js): antes de girar, fica de costas (não é
// desenhado), no lugar do close.
test('dados reais: um só vulto à frente, inclusive nos closes', () => {
  const { stops } = JSON.parse(readFileSync('site/data/content.json', 'utf8'));
  const images = JSON.parse(readFileSync('site/data/images.json', 'utf8'));
  const linha = criarLinha(stops);
  const indices = indicesPorTipo(stops);
  const lados = ladosDosDetalhes(stops, images, linha);
  const planos = stops.map(s => planosDoStop(s, indices.get(s.id), images, linha, lados.get(s.id)));
  const vis = (s) => (s.tipo === 'detalhe' ? VISIBILIDADE_DETALHE : VISIBILIDADE);
  const aspecto = 1440 / 900, fov = fovPara(aspecto);
  const i = (id) => stops.findIndex(s => s.id === id);
  const deCostas = (s, antes, vh) => s.tipo === 'verso' && antes?.tipo === 'detalhe'
    && Math.cos(cartaoFinal(vh, { focoFrente: focoDe(linha, antes.id), focoVerso: focoDe(linha, s.id),
      frente: planos[i(antes.id)][0], verso: planos[i(s.id)][0] }).giro - Math.PI) < 0;
  const dentro = (r) => ({ esq: Math.max(0, r.esq), dir: Math.min(1, r.dir), topo: Math.max(0, r.topo), base: Math.min(1, r.base) });

  const partidas = ['duvidei', 'cartografia-do-intimo'];
  stops.forEach((s, k) => { if (s.tipo === 'detalhe' && stops[k + 1]?.tipo === 'detalhe') partidas.push(s.id); });
  partidas.push('detalhes-1-16');
  assert.equal(partidas.length, 2 + 15 + 7 + 1);

  for (const id of partidas) {
    const a = i(id), b = a + 1;
    const zc = zDoStop(linha, id) + DIST_FOCO;
    const ret = (p) => retanguloNaTela(p, zc, aspecto, fov);
    const vulto = planos[b][0];
    const d = zc - vulto.z;
    const livre = fracaoVisivel(dentro(ret(vulto)), planos[a].map(p => ret(p)));
    const msg = `${id} → ${stops[b].id}: d ${d.toFixed(2)}, livre ${(livre * 100).toFixed(0)}%`;
    assert.ok(brancura(d, vis(stops[b])) >= 0.9, msg);
    assert.equal(alfa(d, vis(stops[b])), 1, msg);
    assert.ok(livre >= 0.4, msg);
    for (let c = b + 1; c < stops.length; c++) {
      if (deCostas(stops[c], stops[c - 1], focoDe(linha, id))) continue;
      for (const p of planos[c]) assert.ok(alfa(zc - p.z, vis(stops[c])) <= 0.05, `${msg}; ${stops[c].id} aparece`);
    }
  }
});
