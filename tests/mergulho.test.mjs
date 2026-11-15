import { test } from 'node:test'; import assert from 'node:assert/strict';
import { aplicarZoom, arrastar, distanciaDeEncaixe, fovDoZoom, extensaoVisivel, ZOOM_MAX,
  encaixeDaImagem, vistaDaImagem, pontoDaImagem, zoomNaImagem, arrastarImagem } from '../site/js/core/mergulho.js';

const perto = (a, b, tol = 1e-9) => Math.abs(a - b) < tol;

test('aplicarZoom e arrastar: limites do zoom e da vista (brief)', () => {
  let e = { zoom: 1, cx: .5, cy: .5 };
  assert.deepEqual(aplicarZoom(e, 0.5, { x: .5, y: .5 }), e);            // não passa de 1
  e = aplicarZoom(e, 2, { x: 1, y: 1 });                                  // aproxima no canto
  assert.equal(e.zoom, 2); assert.equal(e.cx, .75); assert.equal(e.cy, .75);
  assert.equal(aplicarZoom(e, 10, { x: .5, y: .5 }).zoom, 6);             // teto
  assert.equal(arrastar(e, 1, 0).cx, .75);                                // não sai da tela
  assert.equal(arrastar({ zoom: 2, cx: .5, cy: .5 }, -.1, 0).cx, .4);
});

test('aplicarZoom: o ponto sob o cursor fica parado', () => {
  const e = { zoom: 2, cx: .5, cy: .5 };
  const p = { x: .6, y: .4 };
  const z = aplicarZoom(e, 1.5, p);
  // deslocamento do ponto ao centro, em unidades de janela (∝ zoom), não muda
  assert.ok(perto((p.x - e.cx) * e.zoom, (p.x - z.cx) * z.zoom));
  assert.ok(perto((p.y - e.cy) * e.zoom, (p.y - z.cy) * z.zoom));
});

test('extensão visível: eixo com folga fica centrado; o outro só anda até a borda', () => {
  // tela retrato numa janela larga: na horizontal a vista mostra 2,5× a tela, na vertical 1,1×
  const ext = { u: 2.5, v: 1.1 };
  let e = aplicarZoom({ zoom: 1, cx: .5, cy: .5 }, 2, { x: 1, y: 1 }, ext);
  assert.equal(e.cx, .5);                       // 2,5/2 > 1: a tela ainda cabe na largura
  assert.ok(perto(e.cy, 1 - 1.1 / 4));           // borda de cima encostada na borda da janela
  e = arrastar(e, 0, -5, ext);
  assert.ok(perto(e.cy, 1.1 / 4));
});

test('extensaoVisivel e distanciaDeEncaixe: a tela ocupa 92% no eixo que limita', () => {
  const fov = 35, t = Math.tan((fov / 2) * Math.PI / 180);
  // tela 3 × 4 numa janela 16:9: limita a altura
  const d = distanciaDeEncaixe(3, 4, 16 / 9, fov, 0.92);
  assert.ok(perto(4 / (2 * d * t), 0.92));
  const ext = extensaoVisivel(3, 4, 16 / 9, fov, 0.92);
  assert.ok(perto(ext.v, 1 / 0.92));
  assert.ok(perto(ext.u, (2 * d * t * 16 / 9) / 3));
  // tela larga numa janela quase quadrada: limita a largura
  const d2 = distanciaDeEncaixe(6, 2, 1.2, fov, 0.92);
  assert.ok(perto(6 / (2 * d2 * t * 1.2), 0.92));
});

test('fovDoZoom: o campo encolhe na razão do zoom', () => {
  const t = (f) => Math.tan((f / 2) * Math.PI / 180);
  assert.ok(perto(fovDoZoom(35, 1), 35));
  assert.ok(perto(t(fovDoZoom(35, 4)), t(35) / 4));
});

// ---------- close aberto pela marca: imagem 2D encaixada na janela ----------
// Retrato 3000 × 4000 numa janela 1600 × 1000: no zoom 1 ocupa 750 × 1000, centrado.
const caixa = encaixeDaImagem(3000, 4000, 1600, 1000);
// Onde o ponto (u, v) da imagem aparece na janela (px), com a vista do estado.
function naJanela(estado, c, u, v) {
  const t = vistaDaImagem(estado, c);
  return { x: c.larg / 2 + t.x + t.scale * (u - 0.5) * c.dw, y: c.alt / 2 + t.y + t.scale * (v - 0.5) * c.dh };
}
// Bordas da imagem na janela (px).
function bordas(estado, c) {
  const a = naJanela(estado, c, 0, 0), b = naJanela(estado, c, 1, 1);
  return { esq: a.x, topo: a.y, dir: b.x, base: b.y };
}

test('encaixeDaImagem: contain na janela; ext como o da tela ampliada', () => {
  assert.deepEqual([caixa.dw, caixa.dh], [750, 1000]);
  assert.ok(perto(caixa.ext.u, 1600 / 750)); assert.equal(caixa.ext.v, 1);
  const largo = encaixeDaImagem(4000, 1000, 1600, 1000);
  assert.deepEqual([largo.dw, largo.dh, largo.ext.u, largo.ext.v], [1600, 400, 1, 2.5]);
});

test('vistaDaImagem: no zoom 1 a imagem fica centrada (sem −0)', () => {
  assert.deepEqual(vistaDaImagem({ zoom: 1, cx: 0.5, cy: 0.5 }, caixa), { x: 0, y: 0, scale: 1 });
  // um estado fora do lugar volta ao centro no zoom 1
  const e = arrastarImagem({ zoom: 1, cx: 0.5, cy: 0.5 }, 300, -200, caixa);
  assert.deepEqual(vistaDaImagem(e, caixa), { x: 0, y: 0, scale: 1 });
});

test('zoomNaImagem: o ponto sob o ponteiro fica parado; zoom entre 1 e 6', () => {
  // (com a imagem maior que a janela nos dois eixos; senão o eixo que cabe fica centrado)
  let e = { zoom: 1, cx: 0.5, cy: 0.5 };
  for (const [px, py, fator] of [[780, 300, 2.5], [900, 650, 1.5], [820, 520, 0.8]]) {
    const p = pontoDaImagem(e, caixa, px, py);
    e = zoomNaImagem(e, fator, px, py, caixa);
    const q = naJanela(e, caixa, p.x, p.y);
    assert.ok(perto(q.x, px, 1e-6) && perto(q.y, py, 1e-6), `${px},${py}: ${q.x},${q.y}`);
  }
  assert.equal(zoomNaImagem(e, 100, 800, 500, caixa).zoom, ZOOM_MAX);
  const um = zoomNaImagem(e, 0.01, 700, 300, caixa);
  assert.equal(um.zoom, 1);
  assert.deepEqual(vistaDaImagem(um, caixa), { x: 0, y: 0, scale: 1 });
});

test('arrastarImagem: a imagem anda com o ponteiro e para nas bordas da janela, nas quatro direções', () => {
  const e = zoomNaImagem({ zoom: 1, cx: 0.5, cy: 0.5 }, 4, 800, 500, caixa); // 3000 × 4000 px na janela
  const passo = arrastarImagem(e, 50, -30, caixa);
  const a = naJanela(e, caixa, 0.5, 0.5), b = naJanela(passo, caixa, 0.5, 0.5);
  assert.ok(perto(b.x - a.x, 50) && perto(b.y - a.y, -30));
  const longe = 1e5;
  assert.ok(perto(bordas(arrastarImagem(e, longe, 0, caixa), caixa).esq, 0));        // para a direita
  assert.ok(perto(bordas(arrastarImagem(e, -longe, 0, caixa), caixa).dir, 1600));    // para a esquerda
  assert.ok(perto(bordas(arrastarImagem(e, 0, longe, caixa), caixa).topo, 0));       // para baixo
  assert.ok(perto(bordas(arrastarImagem(e, 0, -longe, caixa), caixa).base, 1000));   // para cima
  // num eixo em que a imagem ainda cabe na janela, ela fica no meio
  const pouco = zoomNaImagem({ zoom: 1, cx: 0.5, cy: 0.5 }, 1.5, 800, 500, caixa); // 1125 px de largura
  const lado = bordas(arrastarImagem(pouco, longe, 0, caixa), caixa);
  assert.ok(perto(lado.esq, (1600 - 1125) / 2) && perto(lado.dir, 1600 - (1600 - 1125) / 2));
});
