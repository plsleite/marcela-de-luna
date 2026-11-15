import { test } from 'node:test'; import assert from 'node:assert/strict';
import { aplicarZoom, arrastar, distanciaDeEncaixe, fovDoZoom, extensaoVisivel } from '../site/js/core/mergulho.js';

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
