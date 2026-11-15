import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarLinha, focoDe, emFoco } from '../site/js/core/timeline.js';
import { cartaoFinal, deCostas, opacidadeDoVulto } from '../site/js/core/final.js';
import { zDoStop, planosDoStop, indicesPorTipo, ladosDosDetalhes, fovPara } from '../site/js/core/camera.js';
import { retanguloNaTela, fracaoVisivel } from '../site/js/core/projecao.js';
import { brancura, alfa } from '../site/js/core/vulto.js';
import { DIST_FOCO, VISIBILIDADE, VISIBILIDADE_DETALHE, VERSO, UNIDADES_POR_VH } from '../site/js/config.js';

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
  const versoDeCostas = (s, antes, vh) => s.tipo === 'verso' && antes?.tipo === 'detalhe'
    && deCostas(cartaoFinal(vh, { focoFrente: focoDe(linha, antes.id), focoVerso: focoDe(linha, s.id),
      frente: planos[i(antes.id)][0], verso: planos[i(s.id)][0] }).giro, 'verso');
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
      if (versoDeCostas(stops[c], stops[c - 1], focoDe(linha, id))) continue;
      for (const p of planos[c]) assert.ok(alfa(zc - p.z, vis(stops[c])) <= 0.05, `${msg}; ${stops[c].id} aparece`);
    }
  }
});

// A regra "um só vulto à frente" vale também para o vulto do verso (travessia/cartao.js: o plano
// do verso com VERSO.vulto, VISIBILIDADE): do foco de cada close anterior ao último ele não
// aparece, por alfa (≤ 0,05) ou por ficar inteiro atrás das telas em foco. Janela 1440 × 900.
test('dados reais: o vulto do verso não aparece do foco dos closes anteriores ao último', () => {
  const { stops } = JSON.parse(readFileSync('site/data/content.json', 'utf8'));
  const images = JSON.parse(readFileSync('site/data/images.json', 'utf8'));
  const linha = criarLinha(stops);
  const indices = indicesPorTipo(stops);
  const lados = ladosDosDetalhes(stops, images, linha);
  const planos = stops.map(s => planosDoStop(s, indices.get(s.id), images, linha, lados.get(s.id)));
  const aspecto = 1440 / 900, fov = fovPara(aspecto);
  const [ultimo, verso] = stops.slice(-2);
  assert.equal(ultimo.tipo, 'detalhe'); assert.equal(verso.tipo, 'verso');
  const vulto = { ...planos[stops.length - 1][0], ...VERSO.vulto };
  const p = { focoFrente: focoDe(linha, ultimo.id) };
  const dentro = (r) => ({ esq: Math.max(0, r.esq), dir: Math.min(1, r.dir), topo: Math.max(0, r.topo), base: Math.min(1, r.base) });
  const closes = stops.slice(0, -2).map((s, k) => [s, k]).filter(([s]) => s.tipo === 'detalhe');
  assert.equal(closes.length, 16 + 7);
  for (const [s, k] of closes) {
    const vh = focoDe(linha, s.id);
    const zc = zDoStop(linha, s.id) + DIST_FOCO;
    const ret = (pl) => retanguloNaTela(pl, zc, aspecto, fov);
    const a = alfa(zc - vulto.z, VISIBILIDADE) * opacidadeDoVulto(vh, p);
    const livre = fracaoVisivel(dentro(ret(vulto)), planos[k].map(ret));
    assert.ok(a <= 0.05 || livre === 0, `${s.id}: d ${(zc - vulto.z).toFixed(2)}, alfa ${a.toFixed(2)}, livre ${(livre * 100).toFixed(0)}%`);
  }
});

// O vulto do verso (travessia/cartao.js): do lado oposto ao do último close, inteiro e quase
// branco no foco do close, sem nunca ganhar cor enquanto aparece; some antes de o verso entrar
// em foco (o clique nele nunca amplia).
test('dados reais: vulto do verso ao lado do último close', () => {
  const { stops } = JSON.parse(readFileSync('site/data/content.json', 'utf8'));
  const images = JSON.parse(readFileSync('site/data/images.json', 'utf8'));
  const linha = criarLinha(stops);
  const [a, b] = stops.slice(-2);
  assert.equal(a.tipo, 'detalhe'); assert.equal(b.tipo, 'verso');
  const close = planosDoStop(a, indicesPorTipo(stops).get(a.id), images, linha, ladosDosDetalhes(stops, images, linha).get(a.id))[0];
  assert.ok(close.x > 0 && VERSO.vulto.x < 0, 'o vulto fica do lado oposto ao do close');
  const p = { focoFrente: focoDe(linha, a.id), focoVerso: focoDe(linha, b.id) };
  const z = zDoStop(linha, b.id);
  for (let vh = p.focoFrente - 20; vh <= p.focoVerso; vh += 0.5) {
    const o = opacidadeDoVulto(vh, p);
    if (o === 0) continue;
    const d = DIST_FOCO - vh * UNIDADES_POR_VH - z;
    const msg = `vh ${vh}: d ${d.toFixed(2)}`;
    assert.ok(brancura(d, VISIBILIDADE) >= 0.85, msg);
    assert.notEqual(emFoco(linha, vh), b.id, msg);
  }
  assert.equal(alfa(DIST_FOCO - p.focoFrente * UNIDADES_POR_VH - z, VISIBILIDADE), 1);
  assert.equal(opacidadeDoVulto(p.focoVerso, p), 0);
});
