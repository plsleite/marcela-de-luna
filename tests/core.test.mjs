import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarLinha, situar, focoDe, emFoco, alturaDaPagina, vizinho } from '../site/js/core/timeline.js';
import { zDaCamera, zDoStop, planosDoStop } from '../site/js/core/camera.js';
import { texturasNecessarias, larguraPara } from '../site/js/core/janela.js';
import * as cfg from '../site/js/config.js';

const stops = [{ id:'capa', tipo:'capa' }, { id:'t', tipo:'texto' }, { id:'o1', tipo:'obra', telas:['a'] }, { id:'o2', tipo:'obra', telas:['b','c'] }];
const linha = criarLinha(stops);
const images = { a:{w:3000,h:4000}, b:{w:2000,h:2000}, c:{w:2000,h:2000} };

test('config', () => {
  assert.equal(cfg.PILOTO_ULTIMA_PAGINA, 6);
  assert.deepEqual(cfg.DURACAO, { capa: 100, texto: 160, abertura: 140, obra: 100, detalhe: 45, verso: 100 });
  assert.deepEqual([cfg.UNIDADES_POR_VH, cfg.DIST_FOCO, cfg.FOV, cfg.RELEVO], [0.14, 8, 35, 0.12]);
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
  assert.equal(alturaDaPagina(linha), 460);
  assert.equal(vizinho(linha, 'capa', -1), 'capa'); assert.equal(vizinho(linha, 'o1', 1), 'o2');
  assert.equal(vizinho(linha, 'o2', 1), 'o2'); assert.equal(vizinho(linha, 'o1', -1), 't');
});

test('câmera e planos', () => {
  assert.ok(Math.abs(zDaCamera(260) - zDoStop(linha, 'o1') - 8) < 1e-9);
  const [p] = planosDoStop(stops[2], 0, images, linha);
  assert.deepEqual([p.x, p.y, p.altura, p.largura], [-2.4, 0, 4, 3]);
  assert.equal(planosDoStop(stops[2], 1, images, linha)[0].x, 2.4);
  const [A, B] = planosDoStop(stops[3], 1, images, linha);
  assert.equal(A.altura, 2.6); assert.equal(B.z - A.z, -1.5); assert.ok(A.y > B.y);
});

test('planos de capa, texto e abertura', () => {
  const imgs = { c1:{w:1000,h:500}, p:{w:100,h:200} };
  const l = criarLinha([{ id:'capa', tipo:'capa' }, { id:'t', tipo:'texto' }]);
  const [c] = planosDoStop({ id:'capa', tipo:'capa', imagens:['c1'] }, 0, imgs, l);
  assert.deepEqual([c.imagem, c.x, c.y, c.z, c.altura, c.largura], ['c1', -2.0, 0, 0, 4.6, 9.2]);
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

test('dados reais: linha cobre as 58 paradas e planos resolvem', () => {
  const { stops: reais } = JSON.parse(readFileSync('site/data/content.json', 'utf8'));
  const imgs = JSON.parse(readFileSync('site/data/images.json', 'utf8'));
  const l = criarLinha(reais);
  assert.equal(l.itens.length, 58);
  let n = 0;
  for (const s of reais) {
    const o = s.tipo === 'obra' ? n++ : 0;
    for (const p of planosDoStop(s, o, imgs, l)) assert.ok(p.largura > 0, `${s.id}/${p.imagem}`);
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
