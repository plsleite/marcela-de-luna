import { DIST_FOCO, UNIDADES_POR_VH, FOV } from '../config.js';
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

// Planos (pinturas) de uma parada em coordenadas de mundo. `detalhe` e `verso`
// não têm regra de posição neste núcleo e devolvem [].
export function planosDoStop(stop, indiceDaObra, images, linha) {
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
      if (b === undefined) return [plano(a, indiceDaObra % 2 === 0 ? -2.4 : 2.4, 0, z0, 4)];
      return [plano(a, -2.3, 0.9, z0, 2.6), plano(b, 0.6, -0.9, z0 - 1.5, 2.6)];
    }
    case 'texto':
    case 'abertura':
      return (stop.planos ?? []).map(p => plano(p.imagem, p.x, p.y, z0 + (p.z ?? 0), p.altura));
    default:
      return [];
  }
}
