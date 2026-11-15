import { DIST_FOCO, UNIDADES_POR_VH, FOV, DETALHE, VERSO } from '../config.js';
import { focoDe } from './timeline.js';

// Campo vertical efetivo (graus) para a proporção da janela. Acima de 1,65, o FOV de sempre;
// abaixo, o campo horizontal fica o de 1,65 (as telas diminuem, com mais branco acima e abaixo,
// mas nada se corta nas laterais), até o limite da proporção 0,9.
const ASPECTO_BASE = 1.65;
const ASPECTO_MIN = 0.9;
export function fovPara(aspecto) {
  if (aspecto >= ASPECTO_BASE) return FOV;
  const a = Math.max(aspecto, ASPECTO_MIN);
  return (2 * Math.atan(Math.tan((FOV / 2) * Math.PI / 180) * ASPECTO_BASE / a) * 180) / Math.PI;
}

export const zDaCamera = vh => DIST_FOCO - vh * UNIDADES_POR_VH;
export const zDoStop = (linha, id) => 0 - focoDe(linha, id) * UNIDADES_POR_VH; // "0 -" evita -0

// Índice de cada parada para posicionar suas telas: obra = contador das obras na ordem da lista;
// detalhe = posição dentro do trecho de paradas `detalhe` consecutivas (0, 1, ...); demais = 0.
export function indicesPorTipo(stops) {
  const indices = new Map();
  let obras = 0, noTrecho = 0;
  for (const s of stops) {
    noTrecho = s.tipo === 'detalhe' ? noTrecho + 1 : 0;
    indices.set(s.id, s.tipo === 'obra' ? obras++ : s.tipo === 'detalhe' ? noTrecho - 1 : 0);
  }
  return indices;
}

// Planos (pinturas) de uma parada em coordenadas de mundo. `indice` vem de indicesPorTipo.
export function planosDoStop(stop, indice, images, linha) {
  const z0 = zDoStop(linha, stop.id);
  const plano = (imagem, x, y, z, altura) => {
    const { w, h } = images[imagem];
    return { imagem, x, y, z, altura, largura: altura * w / h };
  };
  switch (stop.tipo) {
    case 'capa':
      return [plano(stop.imagens[0], -2.0, 0, z0, 4.6)];
    case 'obra': {
      const [a, b] = stop.telas;
      if (b === undefined) {
        // ±2,4, mas a borda externa nunca passa de 3,8 (obras largas; a fileira fica à direita)
        const p = plano(a, 0, 0, z0, 4);
        p.x = (indice % 2 === 0 ? -1 : 1) * Math.min(2.4, 3.8 - p.largura / 2);
        return [p];
      }
      return [plano(a, -2.3, 0.9, z0, 2.6), plano(b, 0.6, -0.9, z0 - 1.5, 2.6)];
    }
    case 'texto':
    case 'abertura':
      return (stop.planos ?? []).map(p => plano(p.imagem, p.x, p.y, z0 + (p.z ?? 0), p.altura));
    case 'detalhe':
      return [plano(stop.imagens[0], (indice % 2 === 0 ? -1 : 1) * DETALHE.x, DETALHE.ys[indice % 3], z0, DETALHE.altura)];
    case 'verso':
      return [plano(stop.imagens[0], 0, 0, z0, VERSO.altura)];
    default:
      return [];
  }
}
