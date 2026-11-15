// Ímã do scroll: contas puras (sem DOM). Quem age é ui/ima.js.
import { IMA } from '../config.js';

// Item da linha cujo foco está mais perto de `vh` (empate: o de menor índice).
export function paradaDoIma(linha, vh) {
  let melhor = linha.itens[0];
  for (const it of linha.itens) if (Math.abs(vh - it.foco) < Math.abs(vh - melhor.foco)) melhor = it;
  return melhor;
}

// Foco (vh) até onde o ímã leva a página, ou null se ela já está a menos de `folga` vh dele.
export function alvoDoIma(linha, vh, folga = IMA.folga) {
  const { foco } = paradaDoIma(linha, vh);
  return Math.abs(vh - foco) < folga ? null : foco;
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
