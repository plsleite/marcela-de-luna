// Brancura e alfa de uma tela pela distância à câmera: espelho, em JS, das contas do fragment
// shader de gl/tela.js (sem opacidade nem revelação da abertura). `vis` = VISIBILIDADE ou
// VISIBILIDADE_DETALHE (config.js). Sem DOM, sem three.
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// 0 = pintura inteira; ao longe, 1 − residuo. Com o ponteiro sobre o vulto (realce 0..1), cai até vis.realce.
export function brancura(d, vis, realce = 0) {
  const b = smoothstep(vis.branco[0], vis.branco[1], d) * (1 - vis.residuo);
  return b + (Math.min(b, vis.realce) - b) * realce;
}

// 0 rente à câmera (surge) e ao longe (some); 1 entre os dois.
export const alfa = (d, vis) => smoothstep(vis.surge[0], vis.surge[1], d) * (1 - smoothstep(vis.some[0], vis.some[1], d));
