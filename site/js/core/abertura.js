// Abertura: tempos, fração do carregamento e a máscara das pinceladas que revelam a capa.
// `revelacao` é o espelho da função de mesmo nome no fragment shader de gl/tela.js
// (as constantes abaixo entram no GLSL). Sem DOM, sem three.

export const ABERTURA = {
  revela: 1.6,           // s: uRevela de 0 a 1
  intervaloLetras: 0.04, // s entre as letras de "PORTFÓLIO"
  atrasoDoTraco: 0.2,    // s: se tudo ficar pronto antes, o traço de carregamento nem aparece
  larguraDaCapa: 640,    // px da textura da capa que a abertura espera (a da janela vem depois)
  prazo: 4,              // s: teto da espera pelo carregamento; depois, estado final sem revelação
};

// Pinceladas: faixas paralelas na diagonal (ANGULO, subindo para a direita), cada uma com o seu
// atraso, varridas ida e volta; a ponta de cada faixa é feita de fios (cerdas) de comprimentos
// diferentes. Tudo em função de r = uRevela, monótona em r.
export const PINCELADA = {
  ANGULO: 0.5236,  // rad (30°)
  FAIXAS: 7,       // pinceladas através da tela
  ESPALHA: 0.45,   // atraso máximo de uma faixa (fração de r); cada faixa leva 1 − ESPALHA
  FIOS: 22,        // cerdas por faixa
  CERDA: 0.14,     // quanto uma cerda avança ou recua em relação à ponta (fração do traço)
  BORDA: 0.02,     // suavização da ponta
  ONDA: 0.022,     // ondulação da margem entre faixas
};

export function fracaoCarregada(feitos, total) {
  if (!(total > 0)) return 1;
  return Math.min(1, Math.max(0, feitos / total));
}

const fract = (x) => x - Math.floor(x);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// hash11 (Dave Hoskins), sem seno: igual em JS e na GPU a menos de arredondamento.
export function hash(n) {
  let p = fract(n * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

// u, v: UV na tela (0..1, v para cima); r: uRevela; proporcao: largura / altura da tela.
// Devolve a opacidade da pintura nesse ponto: 0 em r ≤ 0, exatamente 1 em r ≥ 1.
export function revelacao(u, v, r, proporcao) {
  if (r >= 1) return 1;
  if (r <= 0) return 0;
  const P = PINCELADA;
  const dx = Math.cos(P.ANGULO), dy = Math.sin(P.ANGULO);
  const qx = u * proporcao, qy = v;
  const sMax = proporcao * dx + dy;
  const tMin = -proporcao * dy, tMax = dx;
  let sn = (qx * dx + qy * dy) / sMax;                 // ao longo do traço, 0..1
  let tn = (-qx * dy + qy * dx - tMin) / (tMax - tMin); // através, 0..1
  tn += P.ONDA * Math.sin(sn * 9.0) + P.ONDA * 0.4 * Math.sin(sn * 23.0 + 1.3);
  tn = Math.min(Math.max(tn, 0), 0.9999);
  const k = Math.floor(tn * P.FAIXAS);
  const atraso = hash(k + 1) * P.ESPALHA;
  const p = clamp01((r - atraso) / (1 - P.ESPALHA));
  if (k % 2 === 1) sn = 1 - sn; // ida e volta
  const cerda = 0.65 * hash(Math.floor(tn * P.FAIXAS * P.FIOS) + 37) + 0.35 * hash(Math.floor(tn * P.FAIXAS * P.FIOS * 2.7) + 11);
  const m = P.CERDA + P.BORDA;
  const ponta = (-m) + (1 + 2 * m) * p + P.CERDA * (2 * cerda - 1);
  return 1 - smoothstep(ponta - P.BORDA, ponta, sn);
}
