// Textos da travessia sobre o palco: qual parada está em foco, entrada dos textos linha a linha
// e posição das legendas em relação às telas projetadas.
import { emFoco } from '../core/timeline.js';
import { atrasosDasPalavras } from '../core/projecao.js';
import { posicaoDaLegenda } from '../core/legenda.js';

// Envolve cada palavra de .corpo num <span class="palavra"> (os espaços ficam como texto).
function separarPalavras(corpo) {
  const nos = [];
  const andar = document.createTreeWalker(corpo, NodeFilter.SHOW_TEXT);
  while (andar.nextNode()) nos.push(andar.currentNode);
  for (const no of nos) {
    const frag = document.createDocumentFragment();
    for (const pedaco of no.textContent.split(/(\s+)/)) {
      if (!pedaco) continue;
      if (/^\s+$/.test(pedaco)) { frag.append(pedaco); continue; }
      const span = document.createElement('span');
      span.className = 'palavra';
      span.textContent = pedaco;
      frag.append(span);
    }
    no.replaceWith(frag);
  }
  return [...corpo.querySelectorAll('.palavra')];
}

function prepararEntrada(secao) {
  const corpo = secao.querySelector('.corpo');
  if (!corpo) return;
  if (!secao._palavras) secao._palavras = separarPalavras(corpo);
  const ps = secao._palavras;
  const atrasos = atrasosDasPalavras(ps.map((p) => p.offsetTop), ps.map((p) => p.closest('strong') !== null));
  ps.forEach((p, i) => p.style.setProperty('--atraso', `${atrasos[i]}ms`));
}

// Legenda de obra ao lado da sua tela, alinhada pela base (a conta é core/legenda.js).
function posicionarLegenda(secao, rets, W, H) {
  const leg = secao.querySelector('.legenda');
  if (!leg) return;
  const { x, y } = posicaoDaLegenda({ rets, W, H, lw: leg.offsetWidth, lh: leg.offsetHeight });
  secao.style.setProperty('--leg-x', `${Math.round(x)}px`);
  secao.style.setProperty('--leg-y', `${Math.round(y)}px`);
}

// A legenda de obra só aparece mais perto do foco (fração 0,16 em vez de 0,3, classe com-legenda):
// nas obras de duas telas, a segunda passa por cima dela a partir de foco + 18 vh.
const FRACAO_DA_LEGENDA = 0.16;

export function criarLegendas(raiz, linha) {
  const secoes = new Map([...raiz.querySelectorAll('.parada')].map((s) => [s.dataset.id, s]));
  let atual = null;
  let comLegenda = null;

  function atualizar(vh) {
    const l = emFoco(linha, vh, FRACAO_DA_LEGENDA);
    if (l !== comLegenda) {
      if (comLegenda) secoes.get(comLegenda)?.classList.remove('com-legenda');
      comLegenda = l;
      secoes.get(l)?.classList.add('com-legenda');
    }
    const id = emFoco(linha, vh);
    if (id === atual) return;
    if (atual) secoes.get(atual)?.classList.remove('em-foco');
    atual = id;
    const s = id ? secoes.get(id) : null;
    if (!s) return;
    if (s.classList.contains('parada--texto') || s.classList.contains('parada--abertura')) {
      prepararEntrada(s);
    }
    s.classList.add('em-foco');
  }

  // retangulos: Map id → [{ esq, dir, topo, base }] em px, das telas projetadas no foco.
  function posicionar(retangulos) {
    const W = innerWidth, H = innerHeight;
    for (const [id, rets] of retangulos) {
      const s = secoes.get(id);
      if (!s || !rets.length) continue;
      const u = {
        esq: Math.min(...rets.map((r) => r.esq)), dir: Math.max(...rets.map((r) => r.dir)),
        topo: Math.min(...rets.map((r) => r.topo)), base: Math.max(...rets.map((r) => r.base)),
      };
      for (const k of ['esq', 'dir', 'topo', 'base']) s.style.setProperty(`--tela-${k}`, `${Math.round(u[k])}px`);
      s.style.setProperty('--tela-larg', `${Math.round(u.dir - u.esq)}px`);
      if (s.classList.contains('parada--obra')) posicionarLegenda(s, rets, W, H);
    }
    // Se a janela mudou com um texto em foco, as linhas mudaram: recalcula os atrasos.
    const s = atual && secoes.get(atual);
    if (s?._palavras) prepararEntrada(s);
  }

  return { atualizar, posicionar };
}
