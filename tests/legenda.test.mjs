import { test } from 'node:test'; import assert from 'node:assert/strict';
import { posicaoDaLegenda } from '../site/js/core/legenda.js';

const W = 1440, H = 900, lw = 250, lh = 114;
// vão: 3,5% de 1440 = 50,4 px

test('tela à esquerda: legenda à direita dela, base com base', () => {
  const p = posicaoDaLegenda({ rets: [{ esq: 54, dir: 556, topo: 104, base: 796 }], W, H, lw, lh });
  assert.equal(p.x, 556 + 50.4);
  assert.equal(p.y, 796 - lh);
});

test('tela à direita: legenda à esquerda dela, base com base', () => {
  const p = posicaoDaLegenda({ rets: [{ esq: 884, dir: 1386, topo: 104, base: 796 }], W, H, lw, lh });
  assert.equal(p.x, 884 - 50.4 - lw);
  assert.equal(p.y, 796 - lh);
});

test('duas telas: à direita da mais à direita, base com a base do conjunto', () => {
  const rets = [{ esq: 90, dir: 560, topo: 69, base: 520 }, { esq: 540, dir: 1004, topo: 330, base: 770 }];
  const p = posicaoDaLegenda({ rets, W, H, lw: 216, lh });
  assert.equal(p.x, 1004 + 50.4);
  assert.equal(p.y, 770 - lh);
});

test('vão mínimo de 32 px em janela estreita', () => {
  const p = posicaoDaLegenda({ rets: [{ esq: 33, dir: 348, topo: 234, base: 666 }], W: 900, H: 900, lw: 192, lh: 102 });
  assert.equal(p.x, 348 + 32);
  assert.equal(p.y, 666 - 102);
});

test('janela estreita: ficar dentro da janela prevalece (margem de 24 px)', () => {
  // a legenda à direita da tela passaria da borda direita
  const a = posicaoDaLegenda({ rets: [{ esq: 100, dir: 600, topo: 100, base: 500 }], W: 800, H: 600, lw: 250, lh: 100 });
  assert.equal(a.x, 800 - 24 - 250);
  // a base da tela abaixo da janela: a legenda sobe até caber
  const b = posicaoDaLegenda({ rets: [{ esq: 100, dir: 400, topo: 300, base: 700 }], W: 1200, H: 600, lw: 200, lh: 100 });
  assert.equal(b.y, 600 - 24 - 100);
  // tela à direita encostada na esquerda: a legenda não sai pela esquerda
  const c = posicaoDaLegenda({ rets: [{ esq: 820, dir: 1000, topo: 100, base: 500 }], W: 1000, H: 600, lw: 900, lh: 100 });
  assert.equal(c.x, 24);
  // legenda maior que a janela: encosta na margem
  const d = posicaoDaLegenda({ rets: [{ esq: 10, dir: 100, topo: 10, base: 50 }], W: 200, H: 100, lw: 400, lh: 300 });
  assert.deepEqual(d, { x: 24, y: 24 });
});
