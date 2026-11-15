import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarLinha, situar, focoDe, emFoco, alturaDaPagina, vizinho } from '../site/js/core/timeline.js';
import { zDaCamera, zDoStop, planosDoStop, indicesPorTipo, ladosDosDetalhes } from '../site/js/core/camera.js';
import { texturasNecessarias, larguraPara, aoAlcance, janelaDeViagem, naVista } from '../site/js/core/janela.js';
import * as cfg from '../site/js/config.js';

const stops = [{ id:'capa', tipo:'capa' }, { id:'t', tipo:'texto' }, { id:'o1', tipo:'obra', telas:['a'] }, { id:'o2', tipo:'obra', telas:['b','c'] }];
const linha = criarLinha(stops);
const images = { a:{w:3000,h:4000}, b:{w:2000,h:2000}, c:{w:2000,h:2000} };

test('config', () => {
  assert.equal('PILOTO_ULTIMA_PAGINA' in cfg, false);
  assert.deepEqual(cfg.DURACAO, { capa: 100, texto: 160, abertura: 140, obra: 100, detalhe: 45, verso: 100 });
  assert.deepEqual([cfg.UNIDADES_POR_VH, cfg.DIST_FOCO, cfg.FOV, cfg.RELEVO], [0.14, 8, 35, 0.12]);
  assert.deepEqual(cfg.CAPA, { x: -2.0, y: -0.05, altura: 4.5 });
});

test('linha do tempo', () => {
  assert.equal(linha.total, 410);
  assert.deepEqual(linha.itens[0], { id:'capa', tipo:'capa', dur:100, inicio:0, fim:50, foco:0 });
  assert.deepEqual(linha.itens[1], { id:'t', tipo:'texto', dur:160, inicio:50, fim:210, foco:130 });
  assert.deepEqual(situar(linha, 260), { indice: 2, id:'o1', local: 0.5 });
  assert.equal(situar(linha, -50).id, 'capa'); assert.equal(situar(linha, 9999).id, 'o2');
  assert.equal(situar(linha, -50).local, 0); assert.equal(situar(linha, 9999).local, 1);
  assert.equal(focoDe(linha, 'o1'), 260);
  assert.equal(emFoco(linha, 0), 'capa'); assert.equal(emFoco(linha, 260), 'o1'); assert.equal(emFoco(linha, 205), null);
  assert.equal(emFoco(linha, 280, 0.16), null);          // o1 tem foco 260 e dur 100
  assert.equal(emFoco(linha, 280), 'o1');
  assert.equal(emFoco(linha, 270, 0.16), 'o1');
  assert.equal(alturaDaPagina(linha), 460);
  assert.equal(vizinho(linha, 'capa', -1), 'capa'); assert.equal(vizinho(linha, 'o1', 1), 'o2');
  assert.equal(vizinho(linha, 'o2', 1), 'o2'); assert.equal(vizinho(linha, 'o1', -1), 't');
});

test('câmera e planos', () => {
  assert.ok(Math.abs(zDaCamera(260) - zDoStop(linha, 'o1') - 8) < 1e-9);
  const [p] = planosDoStop(stops[2], 0, images, linha);
  // obra de uma tela: x = ±min(2,4; 3,8 − largura/2) — a borda externa nunca passa de 3,8
  assert.deepEqual([p.y, p.altura, p.largura], [0, 4, 3]);
  assert.ok(Math.abs(p.x - -2.3) < 1e-9);
  assert.ok(Math.abs(planosDoStop(stops[2], 1, images, linha)[0].x - 2.3) < 1e-9);
  const quadrada = { id:'o1', tipo:'obra', telas:['b'] }; // b: 2000 × 2000 → largura 4
  const [qe] = planosDoStop(quadrada, 0, images, linha);
  const [qd] = planosDoStop(quadrada, 1, images, linha);
  assert.ok(Math.abs(qe.x - -1.8) < 1e-9 && Math.abs(qd.x - 1.8) < 1e-9);
  assert.ok(Math.abs(qd.x + qd.largura / 2 - 3.8) < 1e-9);
  const estreita = planosDoStop(stops[2], 0, { a:{ w:1000, h:4000 } }, linha)[0]; // largura 1 → 2,4
  assert.equal(estreita.x, -2.4);
  const [A, B] = planosDoStop(stops[3], 1, images, linha);
  assert.equal(A.altura, 2.6); assert.equal(B.z - A.z, -1.5); assert.ok(A.y > B.y);
});

test('planos de capa, texto e abertura', () => {
  const imgs = { c1:{w:1000,h:500}, p:{w:100,h:200} };
  const l = criarLinha([{ id:'capa', tipo:'capa' }, { id:'t', tipo:'texto' }]);
  const [c] = planosDoStop({ id:'capa', tipo:'capa', imagens:['c1'] }, 0, imgs, l);
  assert.deepEqual([c.imagem, c.x, c.y, c.z, c.altura, c.largura], ['c1', -2.0, -0.05, 0, 4.5, 9]);
  const t = { id:'t', tipo:'texto', planos:[{ imagem:'p', x:-1.6, y:1.1, z:-0.6, altura:3.4 }] };
  const [q] = planosDoStop(t, 0, imgs, l);
  const z = zDoStop(l, 't');
  assert.ok(Math.abs(q.z - (z - 0.6)) < 1e-9);
  assert.deepEqual([q.x, q.y, q.altura, q.largura], [-1.6, 1.1, 3.4, 1.7]);
});

test('janela de texturas', () => {
  assert.deepEqual([...texturasNecessarias(linha, stops, 2, 1, 1)].sort(), ['a','b','c']);
  const s2 = [
    { id:'capa', tipo:'capa', imagens:['x'] },
    { id:'t', tipo:'texto', paragrafos:[] },
    { id:'ab', tipo:'abertura', planos:[{ imagem:'y' }, { imagem:'z' }] },
    { id:'d', tipo:'detalhe', imagens:['w'] },
  ];
  const l2 = criarLinha(s2);
  assert.deepEqual([...texturasNecessarias(l2, s2, 1, 1, 0)], ['x']);        // parada sem imagem no foco
  assert.deepEqual([...texturasNecessarias(l2, s2, 0, 1, 1)], ['x']);        // ponta inicial, vizinha sem imagem
  assert.deepEqual([...texturasNecessarias(l2, s2, 3, 0, 3)], ['w']);        // ponta final
  assert.deepEqual([...texturasNecessarias(l2, s2, 2)].sort(), ['w','y','z']); // padrão 1/3, planos
  assert.deepEqual([...texturasNecessarias(l2, s2, 1, 0, 0)], []);
});

test('larguraPara', () => {
  assert.equal(larguraPara(500, 2, [640,1280,2560]), 1280);
  assert.equal(larguraPara(2000, 2, [640,1280,2560]), 2560);
  assert.equal(larguraPara(320, 2, [640,1280,2560]), 640);
  assert.equal(larguraPara(500, 2, [2560,640,1280]), 1280);
});

test('larguraPara: 8% de folga antes de subir de largura', () => {
  assert.equal(larguraPara(644, 2, [640, 1280, 2560]), 1280);     // 1288 cabe em 1280 com 8% de folga
  assert.equal(larguraPara(700, 2, [640, 1280, 2560]), 2560);
  assert.equal(larguraPara(500, 2, [640, 1280, 2560]), 1280);
  assert.equal(larguraPara(9999, 2, [640, 1280, 2560]), 2560);
});

test('janelaDeViagem: só as janelas da partida e da chegada', () => {
  // stops do teste existente: [capa, t, o1(a), o2(b,c)]
  assert.deepEqual([...janelaDeViagem(linha, stops, 0, 3)].sort(), ['a', 'b', 'c']);
});

test('naVista: a tela é desenhada entre −1 e o alcance', () => {
  assert.equal(naVista(5, 28), true); assert.equal(naVista(-2, 28), false); assert.equal(naVista(28, 28), false);
});

test('dados reais: linha cobre as 58 paradas e planos resolvem', () => {
  const { stops: reais } = JSON.parse(readFileSync('site/data/content.json', 'utf8'));
  const imgs = JSON.parse(readFileSync('site/data/images.json', 'utf8'));
  const l = criarLinha(reais);
  assert.equal(l.itens.length, 58);
  const ind = indicesPorTipo(reais);
  const lados = ladosDosDetalhes(reais, imgs, l);
  for (const s of reais) {
    const ps = planosDoStop(s, ind.get(s.id), imgs, l, lados.get(s.id));
    for (const p of ps) assert.ok(p.largura > 0, `${s.id}/${p.imagem}`);
    if (s.tipo === 'detalhe' || s.tipo === 'verso') assert.equal(ps.length, 1, s.id);
  }
});

test('fovPara: campo horizontal constante abaixo da proporção 1,65', async () => {
  const { fovPara } = await import('../site/js/core/camera.js');
  const meiaLarg = (aspecto, d = cfg.DIST_FOCO) => d * Math.tan((fovPara(aspecto) / 2) * Math.PI / 180) * aspecto;
  assert.equal(fovPara(1.65), 35);
  assert.equal(fovPara(2.4), 35);
  assert.equal(fovPara(1.65 + 1e-6), 35);
  assert.ok(fovPara(1.2) > 35);
  assert.ok(Math.abs(meiaLarg(1.2) - meiaLarg(1.65)) < 1e-9);
  assert.ok(Math.abs(meiaLarg(1) - meiaLarg(1.65)) < 1e-9);
  assert.ok(Math.abs(meiaLarg(0.9) - meiaLarg(1.65)) < 1e-9);
  // monotonia: quanto mais estreita a janela, maior o campo vertical
  let anterior = fovPara(3);
  for (let a = 2.9; a >= 0.5; a -= 0.05) {
    const f = fovPara(a);
    assert.ok(f >= anterior - 1e-12, `aspecto ${a}`);
    anterior = f;
  }
  // limite: abaixo de 0,9 fica o valor de 0,9
  assert.equal(fovPara(0.5), fovPara(0.9));
  assert.equal(fovPara(0.3), fovPara(0.9));
  assert.ok(fovPara(0.9) > fovPara(1));
});

test('visibilidade das telas: uma constante só', () => {
  assert.deepEqual(cfg.VISIBILIDADE, { surge: [1.5, 3.0], branco: [10.5, 17], residuo: 0.08, some: [22, 28], realce: 0.63 });
  assert.deepEqual(cfg.VISIBILIDADE_DETALHE, { ...cfg.VISIBILIDADE, surge: [2.0, 3.6], branco: [10, 14], some: [18.6, 20.4] });
  assert.deepEqual(cfg.VISIBILIDADE.surge, [1.5, 3.0]);
});

test('aoAlcance: a tela existe para ponteiro, realce e pincel em [perto, alcance)', () => {
  assert.equal(aoAlcance(1.7, 2.0, 30), false);
  assert.equal(aoAlcance(2.0, 2.0, 30), true);
  assert.equal(aoAlcance(8, 1.5, 28), true);
  assert.equal(aoAlcance(28, 1.5, 28), false);
  assert.equal(aoAlcance(-6, 1.5, 28), false);
});

test('indicesPorTipo e planos de detalhe e verso', () => {
  const S = [{id:'c',tipo:'capa'},{id:'o1',tipo:'obra'},{id:'o2',tipo:'obra'},{id:'d1',tipo:'detalhe'},{id:'d2',tipo:'detalhe'},
    {id:'a',tipo:'abertura'},{id:'o3',tipo:'obra'},{id:'e1',tipo:'detalhe'},{id:'v',tipo:'verso'}];
  const ind = indicesPorTipo(S);
  assert.deepEqual(['o1','o2','o3'].map(i => ind.get(i)), [0, 1, 2]);
  assert.deepEqual(['d1','d2','e1'].map(i => ind.get(i)), [0, 1, 0]);
  assert.equal(ind.get('c'), 0); assert.equal(ind.get('v'), 0);
  const img = { w: { w: 2250, h: 4000 } };
  const linhaD = criarLinha([{id:'c',tipo:'capa'},{id:'d',tipo:'detalhe',imagens:['w']},{id:'v',tipo:'verso',imagens:['w']}]);
  const [d0] = planosDoStop({id:'d',tipo:'detalhe',imagens:['w']}, 0, img, linhaD, -1);
  assert.deepEqual([d0.x, d0.y, d0.altura], [-1.5, 0.2, 6.2]);
  assert.ok(Math.abs(d0.largura - 6.2 * 2250 / 4000) < 1e-9);
  const [dd] = planosDoStop({id:'d',tipo:'detalhe',imagens:['w']}, 1, img, linhaD, 1);
  assert.deepEqual([dd.x, dd.y], [1.5, -0.25]);
  // o lado vem de ladosDosDetalhes, não do índice; a altura continua pelo índice
  assert.deepEqual(planosDoStop({id:'d',tipo:'detalhe',imagens:['w']}, 0, img, linhaD, 1)[0].x, 1.5);
  assert.equal(planosDoStop({id:'d',tipo:'detalhe',imagens:['w']}, 5, img, linhaD, -1)[0].y, 0.1);
  const [pv] = planosDoStop({id:'v',tipo:'verso',imagens:['w']}, 0, img, linhaD);
  assert.deepEqual([pv.x, pv.y, pv.altura], [0, 0, 4.6]);
});

test('ladosDosDetalhes: o último close de cada trecho fica do lado oposto ao da parada seguinte', () => {
  const S = [{id:'c',tipo:'capa',imagens:['w']},{id:'o',tipo:'obra',telas:['w']},
    {id:'d1',tipo:'detalhe',imagens:['w']},{id:'d2',tipo:'detalhe',imagens:['w']},{id:'d3',tipo:'detalhe',imagens:['w']},
    {id:'a',tipo:'abertura',planos:[{imagem:'w',x:2.45,y:0,altura:4}]},
    {id:'f1',tipo:'detalhe',imagens:['w']},{id:'f2',tipo:'detalhe',imagens:['w']},
    {id:'t',tipo:'texto',planos:[{imagem:'w',x:-1.6,y:0,altura:3}]},
    {id:'e1',tipo:'detalhe',imagens:['w']},{id:'e2',tipo:'detalhe',imagens:['w']},{id:'v',tipo:'verso',imagens:['w']},
    {id:'g1',tipo:'detalhe',imagens:['w']}];
  const img = { w: { w: 2250, h: 4000 } };
  const lados = ladosDosDetalhes(S, img, criarLinha(S));
  assert.deepEqual(['d1','d2','d3'].map(i => lados.get(i)), [-1, 1, -1]); // seguinte à direita: último à esquerda
  assert.deepEqual(['f1','f2'].map(i => lados.get(i)), [-1, 1]);          // seguinte à esquerda: último à direita
  assert.deepEqual(['e1','e2'].map(i => lados.get(i)), [-1, 1]);          // seguinte no centro (verso): à direita
  assert.equal(lados.get('g1'), 1);                                        // sem parada seguinte: à direita
  assert.equal(lados.has('o'), false);
});

test('ladosDosDetalhes, dados reais: 1º trecho começa à direita e acaba à esquerda; 2º não muda', () => {
  const { stops: reais } = JSON.parse(readFileSync('site/data/content.json', 'utf8'));
  const imgs = JSON.parse(readFileSync('site/data/images.json', 'utf8'));
  const l = criarLinha(reais);
  const lados = ladosDosDetalhes(reais, imgs, l);
  const ind = indicesPorTipo(reais);
  const x = (id) => planosDoStop(reais.find(s => s.id === id), ind.get(id), imgs, l, lados.get(id))[0].x;
  assert.equal(x('detalhes-1-01'), 1.5);
  assert.equal(x('detalhes-1-16'), -1.5);
  assert.ok(x('entre-nos') > 0);
  for (let k = 1; k <= 8; k++) {
    const id = `detalhes-2-0${k}`;
    assert.equal(x(id), (ind.get(id) % 2 === 0 ? -1 : 1) * 1.5, id); // como antes
  }
});
