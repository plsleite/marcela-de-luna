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

// Fração da área do retângulo `alvo` ({ esq, dir, topo, base }) que nenhum retângulo de
// `naFrente` cobre (as sobreposições entre eles contam uma vez). Alvo sem área → 0.
export function fracaoVisivel(alvo, naFrente) {
  const area = (alvo.dir - alvo.esq) * (alvo.base - alvo.topo);
  if (!(area > 0)) return 0;
  const cortes = naFrente
    .map((r) => ({ esq: Math.max(r.esq, alvo.esq), dir: Math.min(r.dir, alvo.dir),
      topo: Math.max(r.topo, alvo.topo), base: Math.min(r.base, alvo.base) }))
    .filter((r) => r.dir > r.esq && r.base > r.topo);
  // União dos cortes por faixas verticais entre as bordas: em cada uma, os intervalos em y.
  const xs = [...new Set(cortes.flatMap((r) => [r.esq, r.dir]))].sort((a, b) => a - b);
  let coberta = 0;
  for (let k = 0; k + 1 < xs.length; k++) {
    const meio = (xs[k] + xs[k + 1]) / 2;
    const ys = cortes.filter((r) => r.esq <= meio && meio < r.dir).map((r) => [r.topo, r.base]).sort((a, b) => a[0] - b[0]);
    let alto = 0, fim = -Infinity;
    for (const [t, bs] of ys) {
      if (t > fim) { alto += bs - t; fim = bs; } else if (bs > fim) { alto += bs - fim; fim = bs; }
    }
    coberta += alto * (xs[k + 1] - xs[k]);
  }
  return Math.max(0, 1 - coberta / area);
}

// Ponto (x, y, z) por uma matriz 4×4 em coluna, com a divisão perspectiva (a mesma conta, na
// mesma ordem, de Vector3.applyMatrix4 do three).
function porMatriz([x, y, z], e) {
  const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
  return [(e[0] * x + e[4] * y + e[8] * z + e[12]) * w,
    (e[1] * x + e[5] * y + e[9] * z + e[13]) * w,
    (e[2] * x + e[6] * y + e[10] * z + e[14]) * w];
}

// Caixa envolvente (px, y para baixo) dos quatro cantos de uma tela largura × altura, levados ao
// mundo por `mundo` (matrixWorld: posição, escala e giro), à câmera por `vista`
// (matrixWorldInverse) e ao recorte por `projecao`. Matrizes = Matrix4.elements (em coluna).
export function caixaProjetada(largura, altura, mundo, vista, projecao, W, H) {
  const r = { esq: Infinity, dir: -Infinity, topo: Infinity, base: -Infinity };
  for (const sx of [-0.5, 0.5]) {
    for (const sy of [-0.5, 0.5]) {
      const [nx, ny] = porMatriz(porMatriz(porMatriz([sx * largura, sy * altura, 0], mundo), vista), projecao);
      const x = ((nx + 1) / 2) * W, y = ((1 - ny) / 2) * H;
      r.esq = Math.min(r.esq, x); r.dir = Math.max(r.dir, x);
      r.topo = Math.min(r.topo, y); r.base = Math.max(r.base, y);
    }
  }
  return r;
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
