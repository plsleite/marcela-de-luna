// Geometria de tela e ritmo dos textos da travessia. Sem DOM, sem three.
import { FOV } from '../config.js';

// Retângulo de um plano na janela, em frações (0..1, origem no canto superior esquerdo),
// com a câmera em (0, 0, zCamera) olhando para −z. `d` é a distância em z.
export function retanguloNaTela(plano, zCamera, aspecto, fov = FOV) {
  const d = zCamera - plano.z;
  const meiaAlt = d * Math.tan((fov / 2) * Math.PI / 180);
  const meiaLarg = meiaAlt * aspecto;
  const x = (v) => 0.5 + v / (2 * meiaLarg);
  const y = (v) => 0.5 - v / (2 * meiaAlt);
  return {
    esq: x(plano.x - plano.largura / 2), dir: x(plano.x + plano.largura / 2),
    topo: y(plano.y + plano.altura / 2), base: y(plano.y - plano.altura / 2), d,
  };
}

const PASSO_LINHA = 60;   // ms entre linhas
const ATRASO_NEGRITO = 300; // ms depois da última linha

// Atraso de entrada de cada palavra: as palavras com o mesmo topo (±tol px) formam uma linha;
// as linhas sobem a cada 60 ms; as palavras em negrito assentam 300 ms depois da última linha.
export function atrasosDasPalavras(tops, negritos, tol = 4) {
  const linhas = [];
  let topoDaLinha = -Infinity;
  let n = -1;
  for (const t of tops) {
    if (t > topoDaLinha + tol) { n++; topoDaLinha = t; }
    linhas.push(n);
  }
  const ultima = n * PASSO_LINHA;
  return linhas.map((l, i) => (negritos[i] ? ultima + ATRASO_NEGRITO : l * PASSO_LINHA));
}
