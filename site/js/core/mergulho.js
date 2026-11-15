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
