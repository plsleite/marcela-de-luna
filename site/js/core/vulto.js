// Brancura e alfa de uma tela pela distância à câmera: espelho, em JS, das contas do fragment
// shader de gl/tela.js (sem opacidade nem revelação da abertura). `vis` = VISIBILIDADE,
// VISIBILIDADE_DETALHE (config.js) ou o que visibilidadeDasParadas devolve. Sem DOM, sem three.
import { DIST_FOCO, VISIBILIDADE, VISIBILIDADE_DETALHE } from '../config.js';
import { zDoStop } from './camera.js';

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// 0 = pintura inteira; ao longe, 1 − residuo. Com o ponteiro sobre o vulto (realce 0..1), cai até vis.realce.
export function brancura(d, vis, realce = 0) {
  const b = smoothstep(vis.branco[0], vis.branco[1], d) * (1 - vis.residuo);
  return b + (Math.min(b, vis.realce) - b) * realce;
}

// 0 rente à câmera (surge) e ao longe (some); 1 entre os dois.
export const alfa = (d, vis) => smoothstep(vis.surge[0], vis.surge[1], d) * (1 - smoothstep(vis.some[0], vis.some[1], d));

// Visibilidade das telas de cada parada (Map id → vis). Closes: VISIBILIDADE_DETALHE. Demais:
// VISIBILIDADE, mas, se a primeira tela da parada fica além de some[0] quando vista do foco da
// parada anterior (paradas longas: capa, texto, abertura), a faixa `some` é deslocada para
// começar FOLGA depois dessa distância, com a mesma largura: o vulto da parada seguinte aparece
// sempre inteiro. `planos[k]` = planosDoStop da parada k.
const FOLGA = 0.2;
export function visibilidadeDasParadas(stops, planos, linha) {
  const mapa = new Map();
  stops.forEach((s, k) => {
    let vis = s.tipo === 'detalhe' ? VISIBILIDADE_DETALHE : VISIBILIDADE;
    const primeira = planos[k][0];
    if (s.tipo !== 'detalhe' && k > 0 && primeira) {
      const d = zDoStop(linha, stops[k - 1].id) + DIST_FOCO - primeira.z;
      // + 1e-6: os 22,00 de obra a obra chegam com erro de ponto flutuante
      if (d > vis.some[0] + 1e-6) vis = { ...vis, some: [d + FOLGA, d + FOLGA + vis.some[1] - vis.some[0]] };
    }
    mapa.set(s.id, vis);
  });
  return mapa;
}
