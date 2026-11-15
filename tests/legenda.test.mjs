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

// Linha "DETALHES" da legenda: a tela que tem close ligado (a primeira, se as duas tiverem).
import { telaDoDestaque } from '../site/js/core/legenda.js';

const imgs = { a: {}, b: {} };

test('telaDoDestaque: sem closes, nada', () => {
  assert.equal(telaDoDestaque([], imgs), null);
  assert.equal(telaDoDestaque(undefined, imgs), null);
});

test('telaDoDestaque: a tela que tem o close', () => {
  assert.equal(telaDoDestaque([{ imagem: 'a', tela: 1 }], imgs), 1);
  assert.equal(telaDoDestaque([{ imagem: 'a', tela: 0 }], imgs), 0);
});

test('telaDoDestaque: as duas telas com close → a primeira', () => {
  assert.equal(telaDoDestaque([{ imagem: 'b', tela: 1 }, { imagem: 'a', tela: 0 }], imgs), 0);
});

test('telaDoDestaque: close sem imagem no acervo não conta (como na ampliação)', () => {
  assert.equal(telaDoDestaque([{ imagem: 'x', tela: 0 }, { imagem: 'a', tela: 1 }], imgs), 1);
  assert.equal(telaDoDestaque([{ imagem: 'x', tela: 0 }], imgs), null);
});

// O vulto (tela à frente, vista do foco desta parada) não fica coberto pela legenda: a legenda
// desce o mínimo, ou, não cabendo embaixo, afasta-se da própria tela.
const cart = { rets: [{ esq: 63, dir: 565, topo: 104, base: 796 }], W: 1440, H: 900, lw: 325, lh: 146 };
const vulto = { esq: 473, dir: 739, topo: 198, base: 671 };

test('vulto fora do caminho da legenda: posição de sempre', () => {
  const longe = { esq: 100, dir: 200, topo: 100, base: 300 };
  assert.deepEqual(posicaoDaLegenda({ ...cart, evitar: [longe] }), posicaoDaLegenda(cart));
  assert.deepEqual(posicaoDaLegenda({ ...cart, evitar: [] }), posicaoDaLegenda(cart));
});

test('legenda sobre o vulto: desce até folgar embaixo dele (12 px)', () => {
  const p = posicaoDaLegenda({ ...cart, evitar: [vulto] });
  assert.equal(p.x, 565 + 50.4);
  assert.equal(p.y, 671 + 12);
});

test('não cabe descer: afasta-se da tela, para a direita do vulto (12 px)', () => {
  // vulto que desce até 850: embaixo estouraria a janela (850 + 12 + 146 > 900 - 24)
  const alto = { esq: 473, dir: 739, topo: 198, base: 850 };
  const p = posicaoDaLegenda({ ...cart, evitar: [alto] });
  assert.equal(p.x, 739 + 12);
  assert.equal(p.y, 796 - 146);
});

test('legenda à esquerda da tela: afasta-se para a esquerda do vulto', () => {
  const rets = [{ esq: 884, dir: 1386, topo: 104, base: 796 }];
  const alto = { esq: 700, dir: 960, topo: 198, base: 850 };
  const p = posicaoDaLegenda({ rets, W: 1440, H: 900, lw: 325, lh: 146, evitar: [alto] });
  assert.equal(p.x, 700 - 12 - 325);
  assert.equal(p.y, 796 - 146);
});

test('várias telas a evitar: nenhuma fica coberta', () => {
  const dois = [vulto, { esq: 600, dir: 800, topo: 560, base: 720 }];
  const p = posicaoDaLegenda({ ...cart, evitar: dois });
  const cobre = (r) => p.x < r.dir && p.x + 325 > r.esq && p.y < r.base && p.y + 146 > r.topo;
  assert.equal(dois.some(cobre), false);
});
