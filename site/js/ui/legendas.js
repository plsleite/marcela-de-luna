// Textos da travessia sobre o palco: qual parada está em foco, entrada dos textos linha a linha
// e posição das legendas em relação às telas projetadas.
import { emFoco } from '../core/timeline.js';
import { atrasosDasPalavras } from '../core/projecao.js';

const MARGEM = 24; // px entre legenda e tela, e da legenda à borda da janela

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

const sobrepoe = (a, b) => a.esq < b.dir && a.dir > b.esq && a.topo < b.base && a.base > b.topo;

// Legenda de obra: com uma tela, no lado oposto, espelhada em relação ao centro da janela;
// com duas, embaixo ao centro — ou, se não couber sem cobrir uma tela, sob a tela de cima.
function posicionarLegenda(secao, rets, W, H) {
  const leg = secao.querySelector('.legenda');
  if (!leg) return;
  const lw = leg.offsetWidth, lh = leg.offsetHeight;
  const caixa = (cx, topo) => ({ esq: cx - lw / 2, dir: cx + lw / 2, topo, base: topo + lh });
  const folgada = (c) => ({ esq: c.esq - MARGEM, dir: c.dir + MARGEM, topo: c.topo - MARGEM, base: c.base + MARGEM });
  const livre = (c) => c.esq >= MARGEM && c.dir <= W - MARGEM && c.topo >= MARGEM && c.base <= H - MARGEM
    && rets.every((r) => !sobrepoe(folgada(c), r));
  let c;
  if (rets.length === 1) {
    const [r] = rets;
    c = caixa(W - (r.esq + r.dir) / 2, (r.topo + r.base) / 2 - lh / 2);
    if (!livre(c)) { // centro do espaço livre ao lado da tela
      const ladoDir = (r.esq + r.dir) / 2 < W / 2;
      c = caixa(ladoDir ? (r.dir + W) / 2 : r.esq / 2, (r.topo + r.base) / 2 - lh / 2);
    }
  } else {
    const baseMax = Math.max(...rets.map((r) => r.base));
    c = caixa(W / 2, (baseMax + H - lh) / 2); // no meio da faixa sob a tela mais baixa
    if (!livre(c)) {
      const [cima] = [...rets].sort((a, b) => a.topo - b.topo);
      c = caixa((Math.max(cima.esq, 0) + cima.dir) / 2, cima.base + MARGEM * 1.5);
    }
  }
  secao.style.setProperty('--leg-x', `${Math.round(c.esq)}px`);
  secao.style.setProperty('--leg-y', `${Math.round(c.topo)}px`);
}

export function criarLegendas(raiz, linha) {
  const secoes = new Map([...raiz.querySelectorAll('.parada')].map((s) => [s.dataset.id, s]));
  let atual = null;

  function atualizar(vh) {
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
