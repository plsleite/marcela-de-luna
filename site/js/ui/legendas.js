// Textos da travessia sobre o palco: qual parada está em foco, entrada dos textos linha a linha
// e posição das legendas em relação às telas projetadas.
import { emFoco } from '../core/timeline.js';
import { atrasosDasPalavras } from '../core/projecao.js';

const MARGEM = 24; // px da legenda à borda da janela

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

// Legenda de obra colada à sua tela, do lado de dentro da janela, centralizada na vertical:
// tela à esquerda → legenda à direita dela; tela à direita → à esquerda dela; duas telas → à
// direita da mais à direita, centralizada no conjunto. Distância da borda da tela: 3,5% da
// largura da janela (mínimo de 32 px). Nunca sai da janela (em janela estreita, isso prevalece).
const VAO = 0.035; // fração da largura da janela
const VAO_MIN = 32; // px
function posicionarLegenda(secao, rets, W, H) {
  const leg = secao.querySelector('.legenda');
  if (!leg) return;
  const lw = leg.offsetWidth, lh = leg.offsetHeight;
  const u = {
    esq: Math.min(...rets.map((r) => r.esq)), dir: Math.max(...rets.map((r) => r.dir)),
    topo: Math.min(...rets.map((r) => r.topo)), base: Math.max(...rets.map((r) => r.base)),
  };
  const vao = Math.max(VAO_MIN, VAO * W);
  const aDireita = rets.length > 1 || (u.esq + u.dir) / 2 < W / 2;
  const x = aDireita ? u.dir + vao : u.esq - vao - lw;
  const y = (u.topo + u.base) / 2 - lh / 2;
  const dentro = (v, max) => Math.max(MARGEM, Math.min(max - MARGEM, v));
  secao.style.setProperty('--leg-x', `${Math.round(lw + 2 * MARGEM > W ? MARGEM : dentro(x, W - lw))}px`);
  secao.style.setProperty('--leg-y', `${Math.round(lh + 2 * MARGEM > H ? MARGEM : dentro(y, H - lh))}px`);
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
