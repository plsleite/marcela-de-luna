// Navegação rápida (só na travessia): a fileira de pinceladas na borda direita, o teclado, o
// cabeçalho "MARCELA DE LUNA" e a viagem até uma parada (irPara). A viagem só chama
// lenis.scrollTo: o scroll continua o nativo, e rolar ou pedir outra viagem no meio interrompe
// a atual sem tranco (a nova parte na velocidade em que a página já ia).
// Tudo o que este módulo cria (elementos e ouvintes) sai em encerrar().
import { focoDe, emFoco } from '../core/timeline.js';
import { criarLente } from './lente.js';
import { soltarFocoDoPonteiro } from './foco.js';
import { duracaoDaViagem, curvaDaViagem, impulsoDaRoda, paradaMaisProxima, destinoDaTecla, marcasDaFileira, marcaAtual, passoDaFileira } from '../core/navegacao.js';

const FOLGA = 250; // ms depois do fim previsto em que a viagem ainda conta como em andamento

function criar(tag, classe) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  return el;
}

// linha, stops, images: a travessia; lenis: o scroll suavizado; amortecimento: lerp do Lenis
// × 60 (1/s), para a roda herdar a velocidade da viagem; fecharMergulho(): sai do mergulho, se
// houver; antes: elemento antes do qual o cabeçalho e a fileira entram no DOM; aoPartir(indice):
// uma viagem começa rumo à parada `indice` de stops; aoChegar(): a viagem acabou (chegou, foi
// interrompida ou cancelada), visto no primeiro quadro em que `viajando` deixa de valer.
export function criarNavegacao({ linha, stops, images, lenis, amortecimento, fecharMergulho, antes, aoPartir = () => {}, aoChegar = () => {} }) {
  const capa = stops.find((s) => s.tipo === 'capa') ?? null;
  const vhAgora = () => (scrollY / innerHeight) * 100;

  // ---------- viagem ----------
  let viagem = null; // { id, ate }
  let velocidade = 0; // px/s do scroll, medida a cada quadro
  let yAnterior = scrollY;
  const viajando = () => Boolean(viagem) && performance.now() < viagem.ate;

  function irPara(id) {
    focoDe(linha, id); // lança se a parada não existe, antes de mexer em qualquer coisa
    fecharMergulho();
    if (viajando() && viagem.id === id) return; // já está indo para lá
    const limite = Number.isFinite(lenis.limit) ? lenis.limit : Infinity;
    const alvo = Math.max(0, Math.min(limite, (focoDe(linha, id) / 100) * innerHeight));
    const dist = alvo - scrollY;
    const duracao = duracaoDaViagem((dist / innerHeight) * 100);
    // inclinação inicial da curva: a velocidade atual em unidades de distância por duração
    const k = Math.abs(dist) >= 1 ? (velocidade * duracao) / dist : 0;
    const v = { id, ate: performance.now() + duracao * 1000 + FOLGA };
    viagem = v;
    aoPartir(stops.findIndex((s) => s.id === id));
    lenis.scrollTo(alvo, {
      duration: duracao, easing: curvaDaViagem(k),
      onComplete: () => { if (viagem === v) viagem = null; },
    });
  }
  // Roda no meio da viagem: o Lenis troca a viagem pelo amortecimento da roda. No mesmo sentido,
  // o primeiro passo herda o impulso da viagem (impulsoDaRoda); no contrário, a roda manda.
  // Depende do Lenis 1.3.27 vendorizado (site/vendor/lenis.mjs), que chama o gancho
  // virtualScroll ANTES de ler data.deltaY: mudar `dados.deltaY` aqui muda o passo. Se a
  // versão mudar, conferir essa ordem em onVirtualScroll.
  function aoRolarVirtual(dados) {
    if (!viajando() || !dados.event?.type?.includes('wheel') || dados.event.ctrlKey || !dados.deltaY) return;
    dados.deltaY = impulsoDaRoda(dados.deltaY, velocidade, amortecimento);
    viagem = null;
  }
  const cancelar = () => { viagem = null; };

  // ---------- teclado ----------
  function aoTeclar(e) {
    if (e.defaultPrevented || e.isComposing) return;
    const alvo = e.target instanceof Element ? e.target : document.activeElement;
    if (alvo?.isContentEditable || alvo?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
    const emControle = Boolean(alvo?.closest?.('a[href], button, summary, [role="button"], [role="link"]'));
    const atual = viajando() ? viagem.id : paradaMaisProxima(linha, vhAgora());
    const id = destinoDaTecla(linha, atual, {
      key: e.key, shift: e.shiftKey, modificador: e.ctrlKey || e.metaKey || e.altKey, emControle,
    });
    if (!id) return;
    e.preventDefault();
    if (e.repeat) return; // segurar a tecla avança uma parada só
    irPara(id);
  }
  addEventListener('keydown', aoTeclar);

  // ---------- cabeçalho ----------
  let topo = null;
  if (capa?.nome) {
    topo = criar('header', 'topo-site');
    const a = criar('a', 'topo-nome');
    a.dataset.barraTinta = ''; // o pincel não pinta sob o nome (travessia/pincel.js)
    a.href = `#${capa.id}`;
    a.textContent = capa.nome;
    a.addEventListener('click', (e) => { e.preventDefault(); soltarFocoDoPonteiro(e); irPara(capa.id); });
    topo.append(a);
  }

  // ---------- fileira ----------
  const nav = criar('nav', 'navegacao');
  nav.setAttribute('aria-label', 'Obras');
  const titulo = criar('span', 'navegacao-titulo');
  titulo.setAttribute('aria-hidden', 'true'); // o nome já está no aria-label de cada marca
  const lista = criar('ol', 'navegacao-lista');
  // nem sob a fileira: a barreira cobre a coluna com a lente aberta (--alem, lente.js)
  const barreira = criar('span', 'navegacao-barreira');
  barreira.setAttribute('aria-hidden', 'true');
  barreira.dataset.barraTinta = '';
  const marcas = marcasDaFileira(stops, images);
  const botoes = [];
  for (const m of marcas) {
    const li = criar('li', m.novoGrupo ? 'novo-grupo' : '');
    const b = criar('button', 'navegacao-marca');
    b.type = 'button';
    b.dataset.forma = m.forma;
    b.dataset.titulo = m.titulo;
    b.setAttribute('aria-label', m.titulo);
    if (m.cor) b.style.setProperty('--cor', m.cor);
    const traco = criar('span', 'pincelada');
    traco.setAttribute('aria-hidden', 'true');
    b.append(traco);
    b.addEventListener('click', (e) => { soltarFocoDoPonteiro(e); irPara(m.id); });
    li.append(b);
    lista.append(li);
    botoes.push(b);
  }
  nav.append(barreira, titulo, lista);
  const lenteDaFileira = criarLente({ nav, lista, botoes });
  antes.before(...(topo ? [topo] : []), nav);

  // Título ao lado da marca: um só elemento fora da lista, na altura do desenho da marca (que a
  // lente desloca; posicionarTitulo a cada quadro em que ela mexe).
  let comTitulo = null;
  function posicionarTitulo() {
    if (!comTitulo) return;
    titulo.style.top = `${(lista.offsetTop + lenteDaFileira.meio(botoes.indexOf(comTitulo))).toFixed(1)}px`;
  }
  function mostrarTitulo(b) {
    titulo.textContent = b.dataset.titulo;
    comTitulo = b;
    posicionarTitulo();
    nav.classList.add('com-titulo');
  }
  function esconderTitulo() {
    const focado = lista.querySelector('.navegacao-marca:focus-visible');
    if (focado) mostrarTitulo(focado); else nav.classList.remove('com-titulo');
  }
  const marcaDe = (el) => el?.closest?.('.navegacao-marca') ?? null;
  lista.addEventListener('pointerover', (e) => { const b = marcaDe(e.target); if (b) mostrarTitulo(b); });
  lista.addEventListener('pointerout', (e) => { if (!marcaDe(e.relatedTarget)) esconderTitulo(); });
  lista.addEventListener('focusin', (e) => { const b = marcaDe(e.target); if (b?.matches(':focus-visible')) mostrarTitulo(b); });
  lista.addEventListener('focusout', (e) => { if (!marcaDe(e.relatedTarget)) nav.classList.remove('com-titulo'); });

  // A fileira cabe inteira na janela, sem rolagem: o passo cheio sai da altura da janela; o de
  // repouso (contraído) e a lente ficam com lente.js.
  function medir() { lenteDaFileira.medir(passoDaFileira(innerHeight, marcas.length)); }
  medir();
  addEventListener('resize', medir);

  // ---------- a cada quadro ----------
  let atualAnterior = null; // id da parada do quadro anterior
  let marcaAnterior = -1;   // índice da marca atual
  let navVisivel = null;
  let topoVisivel = null;
  let foraDaCapa = null;
  let estavaViajando = false;
  // dt em ms; atual: id da parada em que o scroll está; oculta: abertura, mergulho ou a volta dele em curso.
  function quadro(dt, { atual, oculta }) {
    const y = scrollY;
    velocidade = dt > 0 ? ((y - yAnterior) / dt) * 1000 : 0;
    yAnterior = y;
    const v = viajando();
    if (estavaViajando && !v) aoChegar();
    estavaViajando = v;
    if (atual !== atualAnterior) {
      atualAnterior = atual;
      const i = marcaAtual(marcas, atual); // um trecho de closes é uma marca só
      if (i !== marcaAnterior) {
        botoes[marcaAnterior]?.removeAttribute('aria-current');
        botoes[i]?.setAttribute('aria-current', 'true');
        marcaAnterior = i;
      }
    }
    if (lenteDaFileira.quadro(dt, oculta)) posicionarTitulo();
    if (navVisivel !== !oculta) {
      navVisivel = !oculta;
      nav.classList.toggle('visivel', navVisivel);
      if (!navVisivel) nav.classList.remove('com-titulo');
    }
    const t = !oculta && emFoco(linha, (y / innerHeight) * 100) !== capa?.id;
    // o botão de som lê isto: fora da capa ele desliza para a direita do nome
    const fora = emFoco(linha, (y / innerHeight) * 100) !== capa?.id;
    if (foraDaCapa !== fora) { foraDaCapa = fora; document.documentElement.classList.toggle('fora-da-capa', fora); }
    if (topo && topoVisivel !== t) { topoVisivel = t; topo.classList.toggle('visivel', t); }
  }

  function encerrar() {
    viagem = null;
    removeEventListener('keydown', aoTeclar);
    removeEventListener('resize', medir);
    lenteDaFileira.encerrar();
    document.documentElement.classList.remove('fora-da-capa');
    nav.remove();
    topo?.remove();
  }

  return { irPara, aoRolarVirtual, cancelar, quadro, encerrar, get viajando() { return viajando(); } };
}
