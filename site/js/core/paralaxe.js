// Paralaxe pelo ponteiro: suavização do ponteiro e deslocamento da câmera e dos textos.
// Sem DOM, sem three. Ponteiro em −1..1, com y para cima.
const LERP = 0.06;          // por quadro de 60 Hz
const QUADRO = 1000 / 60;   // ms
const DESLOC_X = 0.35;      // unidades de mundo
const DESLOC_Y = 0.2;
const GIRO = 1.2 * Math.PI / 180;
const TEXTO = 8;            // px
const PARADO = 1e-4;        // abaixo disto o valor encosta no alvo

const limitar = (v) => Math.max(-1, Math.min(1, v));

// Um passo de lerp 0.06 normalizado pelo tempo do quadro (o mesmo ritmo a 60 ou 120 Hz).
// Perto do alvo, encosta nele: com o ponteiro parado a cena fica imóvel.
export function suavizar(atual, alvo, dtMs) {
  const a = 1 - (1 - LERP) ** Math.max(0, dtMs / QUADRO);
  const v = atual + (alvo - atual) * a;
  return Math.abs(alvo - v) < PARADO ? alvo : v;
}

// Câmera vai na direção do ponteiro e gira de volta para o centro (giroY > 0 olha para −x);
// os textos vão no sentido contrário, em px de tela (y para baixo).
export function paralaxe(ponteiro) {
  const x = limitar(ponteiro.x), y = limitar(ponteiro.y);
  return {
    x: x * DESLOC_X, y: y * DESLOC_Y,
    giroY: x * GIRO, giroX: -y * GIRO,
    textoX: -x * TEXTO, textoY: y * TEXTO,
  };
}
