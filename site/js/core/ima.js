// Ímã do scroll: contas puras (sem DOM). Quem age é ui/ima.js.
import { IMA } from '../config.js';

// Item da linha cujo foco está mais perto de `vh` (empate: o de menor índice).
export function paradaDoIma(linha, vh) {
  let melhor = linha.itens[0];
  for (const it of linha.itens) if (Math.abs(vh - it.foco) < Math.abs(vh - melhor.foco)) melhor = it;
  return melhor;
}

// Foco (vh) até onde o ímã leva a página, ou null se ela já está a menos de `folga` vh dele.
// `origem` é o vh em que a página estava parada quando o gesto começou. Entre dois focos a e b,
// com f = fração já andada de a para b: descendo (vh > origem) avança para b a partir de
// `limiar`; subindo (vh < origem) recua para a quando o que falta andar até a é ao menos `limiar`.
// Sem origem, ou parado nela, vai ao foco mais próximo. Antes do primeiro foco e depois do
// último, o extremo.
export function alvoDoIma(linha, vh, { folga = IMA.folga, origem, limiar = IMA.limiar } = {}) {
  const itens = linha.itens;
  let alvo;
  if (!Number.isFinite(origem) || vh === origem || vh <= itens[0].foco || vh >= itens.at(-1).foco) {
    alvo = paradaDoIma(linha, vh).foco;
  } else {
    let i = 0;
    while (i < itens.length - 2 && itens[i + 1].foco <= vh) i++;
    const a = itens[i].foco, b = itens[i + 1].foco;
    const f = (vh - a) / (b - a);
    alvo = vh > origem ? (f >= limiar ? b : a) : (1 - f >= limiar ? a : b);
  }
  return Math.abs(vh - alvo) < folga ? null : alvo;
}

// Duração do deslize (s) pela distância (vh): duracaoMin até 20 vh, linear até duracaoMax em 80 vh.
const PERTO = 20, LONGE = 80;
export function duracaoDoIma(distanciaVh, { duracaoMin, duracaoMax } = IMA) {
  const d = Math.abs(distanciaVh);
  if (!(d > PERTO)) return duracaoMin; // também NaN
  if (d >= LONGE) return duracaoMax;
  return duracaoMin + ((d - PERTO) / (LONGE - PERTO)) * (duracaoMax - duracaoMin);
}

// Curva do deslize (progresso 0 → 1): saída suave (seno), que parte sem tranco forte (o ímã
// começa com a página parada) e chega ao foco em repouso.
export function curvaDoIma(t) {
  const x = Math.min(1, Math.max(0, t));
  return Math.sin((x * Math.PI) / 2);
}

// Tecla que rola a página (e por isso arma o ímã): setas verticais, PageUp/PageDown, espaço,
// Home e End, sem Ctrl, Cmd ou Alt. Tab, Shift e as demais não rolam e não mexem no ímã.
const ROLAM = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Spacebar', 'Home', 'End']);
export function teclaDeRolagem({ key, ctrlKey = false, metaKey = false, altKey = false }) {
  return ROLAM.has(key) && !ctrlKey && !metaKey && !altKey;
}
