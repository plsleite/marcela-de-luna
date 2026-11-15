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

// O cartão está girando (nem frente nem verso de chapa): aí a luz rasante fica neutra e o
// clique na tela não amplia.
export const noMeioDoGiro = (giro) => giro > 0 && giro < Math.PI;

// Giro de cada face do cartão: a frente gira `giro`; o verso nasce de costas (giro − π). Face
// única (gl/tela.js): a que está de costas não é desenhada nem barra o pincel.
export const giroDaFace = (giro, face) => (face === 'verso' ? giro - Math.PI : giro);
export const deCostas = (giro, face) => Math.cos(giroDaFace(giro, face)) < 0;

// Vulto do verso, ao lado do último close em foco: some enquanto o giro (que parte de
// focoFrente + 6) ainda é pequeno, e não volta até o foco do verso.
export const opacidadeDoVulto = (vh, { focoFrente }) => 1 - smoothstep(focoFrente + 2, focoFrente + 14, vh);
