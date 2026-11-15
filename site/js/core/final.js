// Final: o último close (frente) e o verso formam um cartão. Entre os dois focos, o cartão
// acompanha a câmera, sai do lado para o centro, muda de tamanho e gira meia volta em y,
// mostrando o verso. Sem DOM.
import { UNIDADES_POR_VH } from '../config.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// frente e verso: { x, y, altura } dos planos no foco de cada um.
// → { x, y, z, altura, giro }: giro 0 mostra a frente; π, o verso.
export function cartaoFinal(vh, { focoFrente, focoVerso, frente, verso }) {
  const s = smoothstep(focoFrente + 6, focoVerso - 14, vh);
  const mistura = (a, b) => a * (1 - s) + b * s; // nesta forma, os extremos saem exatos
  return {
    x: mistura(frente.x, verso.x),
    y: mistura(frente.y, verso.y),
    z: -clamp(vh, focoFrente, focoVerso) * UNIDADES_POR_VH,
    altura: mistura(frente.altura, verso.altura),
    giro: Math.PI * s,
  };
}
