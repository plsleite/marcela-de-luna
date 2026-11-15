// Textos da travessia sobre o palco: qual parada está em foco, entrada dos textos linha a linha
// e posição das legendas em relação às telas projetadas.
import { emFoco } from '../core/timeline.js';
import { atrasosDasPalavras } from '../core/projecao.js';
import { posicaoDaLegenda, telaDoDestaque } from '../core/legenda.js';

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
function posicionarLegenda(secao, rets, evitar, W, H) {
  const leg = secao.querySelector('.legenda');
  if (!leg) return;
  const { x, y } = posicaoDaLegenda({ rets, W, H, lw: leg.offsetWidth, lh: leg.offsetHeight, evitar });
  secao.style.setProperty('--leg-x', `${Math.round(x)}px`);
  secao.style.setProperty('--leg-y', `${Math.round(y)}px`);
}

// A legenda de obra só aparece mais perto do foco (fração 0,16 em vez de 0,3, classe com-legenda):
// nas obras de duas telas, a segunda passa por cima dela a partir de foco + 18 vh.
const FRACAO_DA_LEGENDA = 0.16;

// Linha "DETALHES" no fim da legenda das obras que têm close: um botão (anel + texto) que amplia a
// obra, na tela que tem o close. Só existe na travessia: a página base não a tem, e encerrar() a
// tira. Já no DOM quando a legenda é medida (posicionarLegenda); some para o teclado e o ponteiro
// enquanto a legenda está oculta (travessia.css). Barra a tinta do pincel (data-barra-tinta).
function criarLinhasDeDetalhes(raiz, stops, images, ampliar) {
  const linhas = [];
  for (const stop of stops) {
    const tela = stop.tipo === 'obra' ? telaDoDestaque(stop.closes, images) : null;
    const leg = tela === null ? null : raiz.querySelector(`.parada[data-id="${stop.id}"] .legenda`);
    if (!leg) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'legenda-detalhes';
    b.setAttribute('aria-label', `Detalhes de ${stop.titulo}`);
    b.setAttribute('data-barra-tinta', '');
    b.innerHTML = '<span class="legenda-anel" aria-hidden="true"></span>DETALHES';
    const clique = () => ampliar(stop.id, tela);
    b.addEventListener('click', clique);
    leg.append(b);
    linhas.push({ b, clique });
  }
  return linhas;
}

// opcoes: stops e images (o conteúdo), telas (meshes) e retanguloNoFoco(mesh, idDoFoco) (retângulo
// na janela da tela vista do foco daquela parada), ampliar(stopId, indiceTela) (abre a ampliação,
// com os mesmos bloqueios do clique na pintura) e aoDesmontar(fn) (encerramento da travessia).
export function criarLegendas(raiz, linha, { stops, images, telas, retanguloNoFoco, ampliar, aoDesmontar }) {
  const secoes = new Map([...raiz.querySelectorAll('.parada')].map((s) => [s.dataset.id, s]));
  const linhas = criarLinhasDeDetalhes(raiz, stops, images, ampliar);
  aoDesmontar(() => { for (const { b, clique } of linhas) { b.removeEventListener('click', clique); b.remove(); } });
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

  // Retângulos (px) das telas de cada parada no seu foco: Map id → [{ esq, dir, topo, base }].
  // Cada legenda evita o vulto: as telas da parada seguinte, vistas do foco desta.
  function posicionar() {
    const W = innerWidth, H = innerHeight;
    const retangulos = new Map();
    for (const m of telas) {
      if (!retangulos.has(m.userData.stopId)) retangulos.set(m.userData.stopId, []);
      retangulos.get(m.userData.stopId).push(retanguloNoFoco(m));
    }
    const seguinte = new Map(linha.itens.map((it, i) => [it.id, linha.itens[i + 1]?.id]));
    const vultosDe = (id) => telas.filter((m) => m.userData.stopId === seguinte.get(id)).map((m) => retanguloNoFoco(m, id));
    for (const [id, rets] of retangulos) {
      const s = secoes.get(id);
      if (!s || !rets.length) continue;
      const u = {
        esq: Math.min(...rets.map((r) => r.esq)), dir: Math.max(...rets.map((r) => r.dir)),
        topo: Math.min(...rets.map((r) => r.topo)), base: Math.max(...rets.map((r) => r.base)),
      };
      for (const k of ['esq', 'dir', 'topo', 'base']) s.style.setProperty(`--tela-${k}`, `${Math.round(u[k])}px`);
      s.style.setProperty('--tela-larg', `${Math.round(u.dir - u.esq)}px`);
      if (s.classList.contains('parada--obra')) posicionarLegenda(s, rets, vultosDe(id), W, H);
    }
    // Se a janela mudou com um texto em foco, as linhas mudaram: recalcula os atrasos.
    const s = atual && secoes.get(atual);
    if (s?._palavras) prepararEntrada(s);
  }

  return { atualizar, posicionar };
}
