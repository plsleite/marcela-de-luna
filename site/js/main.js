import { PILOTO_ULTIMA_PAGINA, DIST_FOCO } from './config.js';
import { montarBase } from './ui/base.js';
import { criarLinha, situar, focoDe, alturaDaPagina } from './core/timeline.js';
import { zDaCamera, zDoStop, planosDoStop } from './core/camera.js';
import { texturasNecessarias, larguraPara } from './core/janela.js';
import { retanguloNaTela } from './core/projecao.js';

const raiz = document.getElementById('paradas');
const html = document.documentElement;

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Falha ao carregar ${url}: HTTP ${r.status}`);
  return r.json();
}

// A travessia só roda com WebGL, sem pedido de movimento reduzido e fora do celular em pé.
const querTravessia = () => !matchMedia('(prefers-reduced-motion: reduce)').matches
  && !matchMedia('(pointer: coarse) and (orientation: portrait)').matches;

// As <img> da página base ficam no DOM para leitores de tela, mas sem baixar nada enquanto
// o palco desenha as pinturas; voltam a carregar se a página base reaparecer.
function suspenderImagens(suspender) {
  for (const img of raiz.querySelectorAll('img.tela')) {
    for (const a of ['srcset', 'src']) {
      if (suspender && img.hasAttribute(a)) { img.dataset[a] = img.getAttribute(a); img.removeAttribute(a); }
      if (!suspender && img.dataset[a]) { img.setAttribute(a, img.dataset[a]); delete img.dataset[a]; }
    }
  }
}

async function iniciarTravessia(stops, images) {
  const canvas = document.getElementById('gl');
  const [{ criarPalco }, { criarTela }, { criarTexturas }, { criarLegendas }, { default: Lenis }, { gsap }] = await Promise.all([
    import('./gl/palco.js'), import('./gl/tela.js'), import('./gl/texturas.js'),
    import('./ui/legendas.js'), import('lenis'), import('gsap'),
  ]);
  const palco = criarPalco(canvas);
  if (!palco) return false;

  const linha = criarLinha(stops);
  raiz.style.setProperty('--altura', `${alturaDaPagina(linha)}vh`);

  // Telas: uma por plano de cada parada.
  const telas = [];
  let indiceDaObra = 0;
  for (const stop of stops) {
    const planos = planosDoStop(stop, stop.tipo === 'obra' ? indiceDaObra : 0, images, linha);
    if (stop.tipo === 'obra') indiceDaObra++;
    planos.forEach((plano, indiceTela) => {
      const mesh = criarTela(plano, { stopId: stop.id, indiceTela, cor: images[plano.imagem].cor });
      mesh.userData.plano = plano;
      palco.cena.add(mesh);
      telas.push(mesh);
    });
  }

  // Retângulo de cada tela na janela, com a câmera no foco da sua parada.
  const retanguloNoFoco = (mesh) => {
    const r = retanguloNaTela(mesh.userData.plano, zDoStop(linha, mesh.userData.stopId) + DIST_FOCO, innerWidth / innerHeight);
    return { esq: r.esq * innerWidth, dir: r.dir * innerWidth, topo: r.topo * innerHeight, base: r.base * innerHeight };
  };
  const legendas = criarLegendas(raiz, linha);
  const posicionar = () => {
    const rets = new Map();
    for (const m of telas) {
      if (!rets.has(m.userData.stopId)) rets.set(m.userData.stopId, []);
      rets.get(m.userData.stopId).push(retanguloNoFoco(m));
    }
    legendas.posicionar(rets);
  };

  // Carregamento progressivo: só as texturas da janela em torno da parada atual.
  const lento = new URLSearchParams(location.search).get('lento') === '1';
  const texturas = criarTexturas(images, { renderer: palco.renderer, atraso: lento ? 1500 : 0 });
  const telasDe = (id) => telas.filter((m) => m.userData.imagem === id);
  function aplicar(id, tex) {
    for (const m of telasDe(id)) {
      const u = m.material.uniforms;
      if (u.uMapa.value === tex) continue;
      const jaTinha = u.uMapa.value !== null;
      u.uMapa.value = tex;
      if (!jaTinha) gsap.fromTo(u.uTemMapa, { value: 0 }, { value: 1, duration: 0.6, ease: 'power1.out' });
    }
  }
  function carregarJanela(indice) {
    const conjunto = texturasNecessarias(linha, stops, indice);
    const dpr = Math.min(devicePixelRatio, 2);
    for (const id of conjunto) {
      const m = telasDe(id)[0];
      if (!m) continue;
      const r = retanguloNoFoco(m);
      texturas.pedir(id, larguraPara(r.dir - r.esq, dpr, images[id].larguras))
        .then((tex) => { if (tex) aplicar(id, tex); })
        .catch((erro) => console.error(erro));
    }
    for (const id of texturas.liberarForaDe(conjunto)) {
      for (const m of telasDe(id)) {
        const u = m.material.uniforms;
        gsap.killTweensOf(u.uTemMapa);
        u.uTemMapa.value = 0;
        u.uMapa.value = null;
      }
    }
  }

  const lenis = new Lenis({ lerp: 0.09 });
  const estado = { id: stops[0].id, local: 0, mergulho: null };
  window.__site = {
    linha, estado,
    irPara(id) { lenis.scrollTo((focoDe(linha, id) / 100) * innerHeight); },
  };

  let indiceAtual = -1;
  let ativo = true;
  palco.aoQuadro((t) => {
    lenis.raf(t);
    const vh = (scrollY / innerHeight) * 100;
    const s = situar(linha, vh);
    estado.id = s.id;
    estado.local = s.local;
    palco.camera.position.z = zDaCamera(vh);
    legendas.atualizar(vh);
    if (s.indice !== indiceAtual) { indiceAtual = s.indice; carregarJanela(indiceAtual); }
  });

  posicionar();
  // Já pede as texturas da parada inicial, sem esperar o primeiro quadro.
  indiceAtual = situar(linha, (scrollY / innerHeight) * 100).indice;
  carregarJanela(indiceAtual);
  addEventListener('resize', () => {
    if (!ativo) return;
    palco.redimensionar();
    posicionar();
    if (indiceAtual >= 0) carregarJanela(indiceAtual);
  });
  document.fonts?.ready.then(() => { if (ativo) posicionar(); });

  // Sem contexto WebGL, a página base volta com todo o conteúdo, na parada em que se estava.
  canvas.addEventListener('webglcontextlost', () => {
    ativo = false;
    palco.parar();
    lenis.destroy();
    const id = estado.id;
    for (const s of raiz.querySelectorAll('.em-foco')) s.classList.remove('em-foco');
    ficarNaBase();
    document.getElementById(id)?.scrollIntoView();
  });
  return true;
}

// Volta à página base (sem palco, ou se algo falhou ao montá-lo).
function ficarNaBase() {
  html.classList.remove('travessia');
  suspenderImagens(false);
}

try {
  const [{ stops }, images] = await Promise.all([json('./data/content.json'), json('./data/images.json')]);
  const piloto = stops.filter((s) => s.pagina <= PILOTO_ULTIMA_PAGINA);
  montarBase(raiz, piloto, images);
  if (querTravessia()) {
    // A classe entra antes de montar o palco para a página base não piscar na abertura.
    html.classList.add('travessia');
    suspenderImagens(true);
    try {
      if (!(await iniciarTravessia(piloto, images))) ficarNaBase();
    } catch (erro) { // qualquer falha do modo imersivo deixa a página base intacta
      console.error(erro);
      ficarNaBase();
    }
  }
} catch (erro) {
  console.error(erro);
  raiz.textContent = 'Não foi possível carregar o portfólio.';
}
