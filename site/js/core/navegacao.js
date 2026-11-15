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

// Roda girada no meio de uma viagem: o primeiro passo da roda (deltaY, px) herda o caminho que a
// velocidade atual (px/s) percorreria sob o amortecimento do Lenis (1/s), para a página
// desacelerar em vez de frear. Só no mesmo sentido do gesto: no sentido contrário (ou sem
// deltaY, ou com valores não finitos) a roda segue intacta e manda.
export function impulsoDaRoda(deltaY, velocidade, amortecimento) {
  if (!deltaY || !Number.isFinite(deltaY) || !Number.isFinite(velocidade) || !Number.isFinite(amortecimento) || amortecimento <= 0) return deltaY;
  if (Math.sign(deltaY) !== Math.sign(velocidade)) return deltaY;
  return deltaY + velocidade / amortecimento;
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
// destas pinturas é acinzentado); capa, textos, aberturas e verso como traços finos. Cada trecho
// de closes ("Detalhes") vira um traço só: `id` é o primeiro close (destino do clique), `ids` são
// todos os do trecho, e o título vem do primeiro close. O verso leva o nome da artista (o da
// capa). novoGrupo marca a troca de série (espaço maior antes da marca).
export function marcasDaFileira(stops, images) {
  const nome = stops.find((s) => s.tipo === 'capa')?.nome ?? '';
  const marcas = [];
  stops.forEach((s, i) => {
    if (s.tipo === 'detalhe' && stops[i - 1]?.tipo === 'detalhe') { marcas.at(-1).ids.push(s.id); return; }
    const obra = s.tipo === 'obra';
    const tela = obra ? images[s.telas?.[0]] : null;
    const titulo = s.tipo === 'detalhe' ? (s.titulo ?? 'DETALHES') : s.tipo === 'verso' ? nome : (s.titulo ?? '');
    marcas.push({
      ids: [s.id],
      id: s.id,
      titulo,
      forma: obra ? 'pincelada' : 'traco',
      cor: tela?.acento ?? tela?.cor ?? null,
      novoGrupo: i > 0 && (s.serie ?? null) !== (stops[i - 1].serie ?? null),
    });
  });
  return marcas;
}

// Índice da marca que contém a parada `id` (−1 se nenhuma).
export function marcaAtual(marcas, id) {
  return marcas.findIndex((m) => m.ids.includes(id));
}

// Altura de cada marca (px) para a fileira caber inteira na janela, sem rolagem: 160 px ficam
// para as margens e os espaços entre séries; entre 12 e 24 px.
export function passoDaFileira(alturaDaJanela, n) {
  return Math.min(24, Math.max(12, (alturaDaJanela - 160) / n));
}
