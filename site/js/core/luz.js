// Luz rasante sobre as pinceladas: fator que multiplica a cor (só luminância).
// Espelho exato da fórmula do fragment shader de gl/tela.js. Sem DOM, sem three.
import { RELEVO } from '../config.js';

export const ALTURA_LUZ = 0.15; // altura da luz sobre o plano, em UV: baixa = rasante
export const RAIO_LUZ = 0.5;    // alcance da luz em torno do cursor, em UV
export const GANHO = 3;
// Distância dos 4 vizinhos no shader: relevo da pincelada, não do grão. Constante em UV
// (2 texels de uma textura de 1280 px de largura): trocar a resolução não muda o brilho.
export const PASSO_UV = 2 / 1280;

// Passo nos dois eixos para uma tela de proporção largura/altura (texel quadrado).
export const passoDoRelevo = (proporcao) => ({ u: PASSO_UV, v: PASSO_UV * proporcao });

// gx, gy: diferença de luminância entre os vizinhos (direita − esquerda, cima − baixo);
// dx, dy: vetor do ponto até a luz, em UV; forca: 0..1 (0 = sem efeito).
// Superfície lisa ou força zero → 1; o resultado fica sempre em 1 ± RELEVO.
export function fatorDeLuz(gx, gy, dx, dy, forca) {
  const nl = Math.hypot(gx, gy, 1);
  const ll = Math.hypot(dx, dy, ALTURA_LUZ);
  const lz = ALTURA_LUZ / ll;
  const difusa = (-gx * dx - gy * dy + ALTURA_LUZ) / (nl * ll); // n·l
  const k = (difusa - lz) * Math.exp(-(dx * dx + dy * dy) / (RAIO_LUZ * RAIO_LUZ)) * forca * GANHO;
  return 1 + Math.max(-RELEVO, Math.min(RELEVO, k));
}
