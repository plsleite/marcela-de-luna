import { DIST_FOCO, UNIDADES_POR_VH } from '../config.js';
import { focoDe } from './timeline.js';

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
