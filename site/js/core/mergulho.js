// Mergulho numa tela: zoom e arrasto livres, sem a vista sair da pintura. Sem DOM, sem three.
// estado = { zoom, cx, cy }: zoom 1..6; (cx, cy) = centro da vista em UV da tela (0..1).
// ext = { u, v }: quanto da tela a janela mostra em cada eixo com zoom 1 (1 = a tela exata;
// com a tela encaixada em 92% da janela, o eixo que limita vale 1/0,92 e o outro mais).
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 6;

const limitar = (v, a, b) => Math.min(b, Math.max(a, v));
const SEM_FOLGA = { u: 1, v: 1 };

// Centro num eixo: enquanto a vista é maior que a tela, fica no meio; depois, anda só até a borda.
function conter(c, zoom, ext) {
  const meia = ext / (2 * zoom);
  return meia >= 0.5 ? 0.5 : limitar(c, meia, 1 - meia);
}

// Multiplica o zoom por `fator` mantendo o ponto `cursor` (UV) no mesmo lugar da janela.
export function aplicarZoom(estado, fator, cursor, ext = SEM_FOLGA) {
  const zoom = limitar(estado.zoom * fator, ZOOM_MIN, ZOOM_MAX);
  const k = estado.zoom / zoom;
  return {
    zoom,
    cx: conter(cursor.x + (estado.cx - cursor.x) * k, zoom, ext.u),
    cy: conter(cursor.y + (estado.cy - cursor.y) * k, zoom, ext.v),
  };
}

// Desloca o centro da vista em (dx, dy) UV.
export function arrastar(estado, dx, dy, ext = SEM_FOLGA) {
  return {
    zoom: estado.zoom,
    cx: conter(estado.cx + dx, estado.zoom, ext.u),
    cy: conter(estado.cy + dy, estado.zoom, ext.v),
  };
}

const meiaTan = (fov) => Math.tan((fov / 2) * Math.PI / 180);

// Distância da câmera à tela (largura × altura, em unidades de mundo) para ela caber em
// `ocupa` da janela, com a câmera de campo vertical `fov` (graus) e proporção `aspecto`.
export function distanciaDeEncaixe(largura, altura, aspecto, fov, ocupa) {
  return Math.max(altura / ocupa, largura / (ocupa * aspecto)) / (2 * meiaTan(fov));
}

// ext da tela encaixada (ver acima).
export function extensaoVisivel(largura, altura, aspecto, fov, ocupa) {
  const visAlt = 2 * distanciaDeEncaixe(largura, altura, aspecto, fov, ocupa) * meiaTan(fov);
  return { u: (visAlt * aspecto) / largura, v: visAlt / altura };
}

// O zoom estreita o campo da câmera (a distância fica a do encaixe): nada chega rente à lente.
export function fovDoZoom(fov, zoom) {
  return (2 * Math.atan(meiaTan(fov) / zoom) * 180) / Math.PI;
}

// ---------- close aberto pela marca: imagem w × h encaixada (contain) numa janela larg × alt ----------
// O estado é o da tela ampliada ({ zoom, cx, cy }, em UV da imagem, v para baixo), com os mesmos
// limites: no zoom 1 a imagem fica centrada; com zoom, a borda para na borda da janela.
export function encaixeDaImagem(w, h, larg, alt) {
  const s = Math.min(larg / w, alt / h);
  const dw = w * s, dh = h * s;
  return { larg, alt, dw, dh, ext: { u: larg / dw, v: alt / dh } };
}

// Deslocamento (px, a partir do centro) e escala da imagem para o estado ("0 -" evita −0).
export function vistaDaImagem(estado, c) {
  const z = estado.zoom;
  return { x: 0 - z * (estado.cx - 0.5) * c.dw, y: 0 - z * (estado.cy - 0.5) * c.dh, scale: z };
}

// Ponto da imagem (UV, sem limitar) sob (px, py) px da janela.
export function pontoDaImagem(estado, c, px, py) {
  const t = vistaDaImagem(estado, c);
  return { x: 0.5 + (px - c.larg / 2 - t.x) / (t.scale * c.dw), y: 0.5 + (py - c.alt / 2 - t.y) / (t.scale * c.dh) };
}

// Zoom por `fator` com o ponto sob (px, py) parado.
export function zoomNaImagem(estado, fator, px, py, c) {
  return aplicarZoom(estado, fator, pontoDaImagem(estado, c, px, py), c.ext);
}

// Arrasto de (dx, dy) px: a imagem anda junto com o ponteiro.
export function arrastarImagem(estado, dx, dy, c) {
  return arrastar(estado, -dx / (estado.zoom * c.dw), -dy / (estado.zoom * c.dh), c.ext);
}
