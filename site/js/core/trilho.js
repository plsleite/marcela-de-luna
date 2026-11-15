// Trilho: deslocamento lateral (x) da câmera em função do scroll. Em cada série, a câmera vai
// até o x da última pintura e passa por dentro dela para entrar no trecho de closes ("entrada"),
// e atravessa o último close para sair dele ("saída"). Fora desses trechos, e em todo foco, 0.

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// xDaTela(id) → x do primeiro plano da parada. Devolve (vh) => x.
export function criarTrilho(linha, stops, xDaTela) {
  const trechos = []; // cada um: chaves [[vh, x], ...] em vh crescente
  linha.itens.forEach((it, i) => {
    const prox = stops[i + 1];
    if (!prox) return;
    if (it.tipo === 'obra' && prox.tipo === 'detalhe') {
      const F = it.foco, xt = xDaTela(it.id);
      trechos.push([[F + 12, 0], [F + 50, xt], [F + 60, xt], [linha.itens[i + 1].foco, 0]]);
    } else if (it.tipo === 'detalhe' && prox.tipo !== 'detalhe' && prox.tipo !== 'verso') {
      // A saída volta a 0 até F + 84, ou antes, no foco da parada seguinte, se ele vier antes
      // (close seguido de obra): as chaves encolhem na mesma proporção e seguem em ordem.
      const F = it.foco, xt = xDaTela(it.id);
      const k = Math.min(84, linha.itens[i + 1].foco - F) / 84;
      trechos.push([[F + 8 * k, 0], [F + 48 * k, xt], [F + 60 * k, xt], [F + 84 * k, 0]]);
    }
  });

  return (vh) => {
    for (const chaves of trechos) {
      if (vh <= chaves[0][0] || vh >= chaves[chaves.length - 1][0]) continue;
      for (let k = 1; k < chaves.length; k++) {
        const [v0, x0] = chaves[k - 1], [v1, x1] = chaves[k];
        if (vh > v1) continue;
        if (x0 === x1) return x0; // patamar: sem interpolar (igualdade exata)
        const s = smoothstep(v0, v1, vh);
        return x0 * (1 - s) + x1 * s;
      }
    }
    return 0;
  };
}

// Os textos de uma parada (em-foco, com-legenda) só valem com o trilho praticamente em 0: com a
// câmera deslocada, o texto (posto pelo retângulo da tela no foco) não estaria sobre a sua tela.
export const textoVale = (xDoTrilho, folga) => Math.abs(xDoTrilho) < folga;
