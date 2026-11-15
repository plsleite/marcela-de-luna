// Navegação rápida: contas puras (sem DOM) da viagem até uma parada, do teclado e da fileira.
import { vizinho } from './timeline.js';

// Duração da viagem (s) pela distância (vh): 0,8 até 100 vh, linear até 2,4 em 700 vh ou mais.
const CURTA = 100, LONGA = 700, MIN = 0.8, MAX = 2.4;
export function duracaoDaViagem(distanciaVh) {
  const d = Math.abs(distanciaVh);
  if (!(d > CURTA)) return MIN; // também NaN
  if (d >= LONGA) return MAX;
  return MIN + ((d - CURTA) / (LONGA - CURTA)) * (MAX - MIN);
}

// Curva da viagem (progresso 0 → 1): Hermite cúbica que chega em repouso. k é a inclinação
// inicial (velocidade herdada, em unidades de distância/duração): 0 sai do repouso (acelera e
// freia, simétrica); uma viagem interrompida por outra continua na velocidade em que estava.
// Limitada a [0, 3]: acima de 3 a curva passaria do alvo; abaixo de 0 (sentido contrário) parte do repouso.
export function curvaDaViagem(k = 0) {
  const s = Math.min(3, Math.max(0, Number.isFinite(k) ? k : 0));
  return (t) => {
    const x = Math.min(1, Math.max(0, t));
    return (s - 2) * x * x * x + (3 - 2 * s) * x * x + s * x;
  };
}

export function paradaMaisProxima(linha, vh) {
  let melhor = linha.itens[0];
  for (const it of linha.itens) if (Math.abs(vh - it.foco) < Math.abs(vh - melhor.foco)) melhor = it;
  return melhor.id;
}

// Tecla → id da parada de destino, ou null se a tecla não é da navegação (e fica com o navegador).
// shift: Shift apertado; modificador: Ctrl, Cmd ou Alt; emControle: o foco está num link ou botão
// (o espaço é dele).
export function destinoDaTecla(linha, atual, { key, shift = false, modificador = false, emControle = false }) {
  if (modificador) return null;
  if (key === ' ' || key === 'Spacebar') return emControle ? null : vizinho(linha, atual, shift ? -1 : 1);
  if (shift) return null;
  switch (key) {
    case 'ArrowDown': case 'PageDown': return vizinho(linha, atual, 1);
    case 'ArrowUp': case 'PageUp': return vizinho(linha, atual, -1);
    case 'Home': return linha.itens[0].id;
    case 'End': return linha.itens[linha.itens.length - 1].id;
    default: return null;
  }
}

// Uma marca por parada: obras como pinceladas no acento da primeira tela (reserva: cor; o `cor`
// destas pinturas é acinzentado); capa, textos e aberturas como traços finos. novoGrupo marca
// a troca de série (espaço maior antes da marca).
export function marcasDaFileira(stops, images) {
  return stops.map((s, i) => {
    const obra = s.tipo === 'obra';
    const tela = obra ? images[s.telas?.[0]] : null;
    return {
      id: s.id,
      titulo: s.titulo ?? '',
      forma: obra ? 'pincelada' : 'traco',
      cor: tela?.acento ?? tela?.cor ?? null,
      novoGrupo: i > 0 && (s.serie ?? null) !== (stops[i - 1].serie ?? null),
    };
  });
}
