import { PILOTO_ULTIMA_PAGINA, DIST_FOCO, VISIBILIDADE } from './config.js';
import { montarBase } from './ui/base.js';
import { criarLinha, situar, emFoco, alturaDaPagina } from './core/timeline.js';
import { zDaCamera, zDoStop, planosDoStop, fovPara } from './core/camera.js';
import { texturasNecessarias, larguraPara } from './core/janela.js';
import { retanguloNaTela } from './core/projecao.js';
import { paralaxe, suavizar } from './core/paralaxe.js';
import { corDaParada, distanciaAoRetangulo, forcaSobreTexto } from './core/pincel.js';
import { vhDe, pxDe, posicaoRestaurada } from './core/rolagem.js';
import { destinoDoClique } from './core/clique.js';

const raiz = document.getElementById('paradas');
const html = document.documentElement;

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Falha ao carregar ${url}: HTTP ${r.status}`);
  return r.json();
}

// Posição de leitura entre recargas: guardada ao sair, em vh (a página da travessia é medida
// em vh: a mesma parada em qualquer altura de janela), e restaurada à mão depois que a página
// tem a altura certa (na travessia, a altura só existe depois de montar o palco).
const CHAVE_SCROLL = 'marcela-de-luna:scroll';
let vhDaTravessia = null; // vh do último quadro da travessia (null fora dela)
try { history.scrollRestoration = 'manual'; } catch { /* sem suporte: fica o padrão */ }
addEventListener('pagehide', () => {
  try {
    const vh = vhDaTravessia ?? vhDe(scrollY, innerHeight);
    sessionStorage.setItem(CHAVE_SCROLL, JSON.stringify({ vh, travessia: html.classList.contains('travessia') }));
  } catch { /* armazenamento indisponível */ }
});
function restaurarScroll(travessia) {
  try {
    const y = posicaoRestaurada(JSON.parse(sessionStorage.getItem(CHAVE_SCROLL)), travessia, innerHeight);
    if (y !== null) scrollTo(0, y);
  } catch { /* armazenamento indisponível */ }
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
  const [
    { criarPalco }, { criarTela, pontoNaTela, retanguloProjetado }, { criarTexturas }, { criarTinta },
    { criarLegendas }, { criarPreenchimento }, { rodarAbertura }, { ABERTURA }, { criarMergulho }, { criarNavegacao },
    { default: Lenis }, { gsap },
  ] = await Promise.all([
    import('./gl/palco.js'), import('./gl/tela.js'), import('./gl/texturas.js'), import('./gl/tinta.js'),
    import('./ui/legendas.js'), import('./ui/preenchimento.js'), import('./ui/abertura.js'), import('./core/abertura.js'),
    import('./ui/mergulho-ui.js'), import('./ui/navegacao.js'), import('lenis'), import('gsap'),
  ]);
  const palco = criarPalco(canvas);
  if (!palco) return false;

  const estado = { id: stops[0].id, local: 0, mergulho: null };
  let lenis = null;
  let pincel = null; // { tinta, preenchimento, soltar }
  let abertura = null; // promessa de rodarAbertura, com .encerrar()
  let mergulho = null; // criarMergulho: abrir, fechar, quadro, encerrar
  let navegacao = null; // criarNavegacao: fileira, teclado, cabeçalho e irPara
  let ativo = true;
  // Cada parte montada registra aqui como se desmonta; a desmontagem as percorre da última
  // para a primeira, cada passo no seu try/catch: um passo que falha não impede os outros.
  const encerramentos = [];
  const aoDesmontar = (fn) => { encerramentos.push(fn); };
  const cadaUm = (passos) => {
    for (const passo of passos) {
      try { passo(); } catch (e) { console.error(e); }
    }
  };
  // Único caminho de desmontagem (contexto perdido, erro num quadro ou erro na montagem):
  // para o laço, solta o scroll e mostra a página base na parada em que se estava.
  function desmontar(erro) {
    if (!ativo) return;
    ativo = false;
    vhDaTravessia = null;
    if (erro) console.error(erro);
    cadaUm([() => palco.parar(), ...encerramentos.reverse()]);
    cadaUm([
      () => { for (const s of raiz.querySelectorAll('.em-foco')) s.classList.remove('em-foco'); },
      () => { raiz.style.removeProperty('--paralaxe-x'); raiz.style.removeProperty('--paralaxe-y'); },
    ]);
    ficarNaBase(); // sempre
    document.getElementById(estado.id)?.scrollIntoView();
  }
  palco.aoErro(desmontar);
  canvas.addEventListener('webglcontextlost', () => desmontar());

  try {
    montarTravessia();
  } catch (erro) {
    desmontar(erro);
  }
  return true;

  function montarTravessia() {
    const linha = criarLinha(stops);
    const porId = new Map(stops.map((s) => [s.id, s]));
    raiz.style.setProperty('--altura', `${alturaDaPagina(linha)}vh`);
    restaurarScroll(true); // antes do primeiro quadro: a câmera já nasce na parada certa
    // Altura da janela com que o vh guardado foi medido: entre a janela mudar e o resize ser
    // tratado, um quadro não sobrescreve o vh certo com o px antigo dividido pela altura nova.
    let alturaMedida = innerHeight;
    vhDaTravessia = vhDe(scrollY, innerHeight);

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
      const aspecto = innerWidth / innerHeight;
      const r = retanguloNaTela(mesh.userData.plano, zDoStop(linha, mesh.userData.stopId) + DIST_FOCO, aspecto, fovPara(aspecto));
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
    // Depuração: ?lento=1 atrasa cada textura em 1,5 s; ?lento=trava nunca entrega a capa da abertura.
    const lento = new URLSearchParams(location.search).get('lento');
    const texturas = criarTexturas(images, { renderer: palco.renderer, atraso: lento === '1' ? 1500 : 0 });
    const telasDe = (id) => telas.filter((m) => m.userData.imagem === id);
    // esmaecer: a primeira textura entra sobre a cor dominante em 0,6 s (a capa, na abertura,
    // entra direto: quem a mostra são as pinceladas).
    function aplicar(id, tex, esmaecer = true) {
      for (const m of telasDe(id)) {
        const u = m.material.uniforms;
        if (u.uMapa.value === tex) continue;
        const jaTinha = u.uMapa.value !== null;
        u.uMapa.value = tex;
        if (jaTinha) continue;
        if (esmaecer) gsap.fromTo(u.uTemMapa, { value: 0 }, { value: 1, duration: 0.6, ease: 'power1.out' });
        else u.uTemMapa.value = 1;
      }
    }
    // Durante o mergulho, a pintura aberta fica na maior largura disponível.
    let imagemDoMergulho = null;
    const larguraMaxima = (id) => images[id].larguras.at(-1);
    function carregarJanela(indice) {
      const conjunto = texturasNecessarias(linha, stops, indice);
      const dpr = Math.min(devicePixelRatio, 2);
      for (const id of conjunto) {
        const m = telasDe(id)[0];
        if (!m) continue;
        const r = retanguloNoFoco(m);
        const largura = id === imagemDoMergulho ? larguraMaxima(id) : larguraPara(r.dir - r.esq, dpr, images[id].larguras);
        texturas.pedir(id, largura)
          .then((tex) => { if (tex && ativo) aplicar(id, tex); })
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

    const LERP = 0.09;
    // virtualScroll só intervém com uma viagem em andamento (a roda no mesmo sentido herda a
    // velocidade dela). Depende do Lenis 1.3.27 vendorizado ler data.deltaY depois do gancho.
    lenis = new Lenis({ lerp: LERP, virtualScroll: (dados) => { navegacao?.aoRolarVirtual(dados); } });
    aoDesmontar(() => lenis.destroy());
    navegacao = criarNavegacao({
      linha, stops, images, lenis, amortecimento: LERP * 60, antes: raiz,
      fecharMergulho: () => mergulho?.fechar(), // toda navegação fecha o mergulho antes de agir
    });
    aoDesmontar(() => navegacao.encerrar());
    window.__site = {
      linha, estado, telas, ponteiro: palco.ponteiro,
      get abertura() { return abertura?.estado ?? null; },
      irPara(id) { navegacao.irPara(id); },
      abrirMergulho(stopId, indiceTela = 0) {
        mergulho?.abrir(telas.find((m) => m.userData.stopId === stopId && m.userData.indiceTela === indiceTela));
      },
      fecharMergulho() { mergulho?.fechar(); },
    };

    // Paralaxe: a câmera fica no z do scroll e ganha por cima o deslocamento do ponteiro;
    // os textos andam até 8 px no sentido contrário (só escreve no DOM quando muda).
    let textoAnterior = '';
    function poseDoScroll(vh = vhDe(scrollY, innerHeight), p = paralaxe(palco.ponteiro)) {
      return { x: p.x, y: p.y, z: zDaCamera(vh), rx: p.giroX, ry: p.giroY, fov: fovPara(innerWidth / innerHeight) };
    }
    function aplicarParalaxe(vh) {
      const p = paralaxe(palco.ponteiro);
      const c = poseDoScroll(vh, p);
      palco.camera.position.set(c.x, c.y, c.z);
      palco.camera.rotation.set(c.rx, c.ry, 0);
      if (palco.camera.fov !== c.fov) { palco.camera.fov = c.fov; palco.camera.updateProjectionMatrix(); } // depois do mergulho
      const texto = `${p.textoX.toFixed(1)}|${p.textoY.toFixed(1)}`;
      if (texto !== textoAnterior) {
        textoAnterior = texto;
        raiz.style.setProperty('--paralaxe-x', `${p.textoX.toFixed(1)}px`);
        raiz.style.setProperty('--paralaxe-y', `${p.textoY.toFixed(1)}px`);
      }
    }

    // Luz rasante: em cada tela, a luz fica onde o raio do ponteiro cruza o seu plano; a tela
    // sob o cursor (a mais próxima atingida) recebe força 1, as demais 0,35, com transição suave.
    const FORCA_SOB = 1;
    const FORCA_DEMAIS = 0.35;
    function aplicarLuz(dt) {
      const raio = palco.raioDoPonteiro();
      const pontos = telas.map((m) => pontoNaTela(m, raio));
      let sob = -1;
      pontos.forEach((p, i) => {
        if (!p || p.t < 3 || p.u < 0 || p.u > 1 || p.v < 0 || p.v > 1) return;
        if (sob < 0 || p.t < pontos[sob].t) sob = i;
      });
      telas.forEach((m, i) => {
        const u = m.material.uniforms;
        if (pontos[i]) u.uLuz.value.set(pontos[i].u, pontos[i].v);
        u.uRelevo.value = suavizar(u.uRelevo.value, i === sob ? FORCA_SOB : FORCA_DEMAIS, dt);
      });
    }

    // Pincel (só com mouse): tinta no fundo branco, na cor viva da tela da parada atual, e letras
    // dos títulos que se enchem de pintura. Não deposita sobre as telas; passa por baixo de todo
    // texto, mais leve sobre os parágrafos da parada em foco (para não atrapalhar a leitura).
    function montarPincel() {
      const p = { obstaculos: null };
      function obstaculos() {
        const telasNaJanela = [];
        const cz = palco.camera.position.z;
        for (const m of telas) {
          const d = cz - m.position.z; // telas visíveis (nem rente à câmera nem sumidas no branco)
          if (d > VISIBILIDADE.surge[0] && d < VISIBILIDADE.branco[1]) telasNaJanela.push(retanguloProjetado(m, palco.camera));
        }
        const paragrafos = [...raiz.querySelectorAll('.em-foco .corpo')].map((el) => {
          const b = el.getBoundingClientRect();
          return { esq: b.left, dir: b.right, topo: b.top, base: b.bottom };
        });
        return { telasNaJanela, paragrafos };
      }
      const forca = (x, y) => {
        const o = (p.obstaculos ??= obstaculos());
        if (o.telasNaJanela.some((r) => distanciaAoRetangulo(x, y, r) === 0)) return 0;
        return forcaSobreTexto({ x, y }, o.paragrafos, { dentro: 0.3, faixa: 40 });
      };
      p.tinta = criarTinta(palco, { forca });
      p.preenchimento = criarPreenchimento(raiz);
      const aoMover = (e) => {
        if (e.pointerType !== 'mouse' || estado.mergulho) return;
        p.tinta.pintar(e.clientX, e.clientY, corDaParada(porId.get(estado.id), images));
        p.preenchimento.tocar(e.clientX, e.clientY);
      };
      const aoSair = (e) => { if (!e.relatedTarget) { p.tinta.romper(); p.preenchimento.romper(); } };
      addEventListener('pointermove', aoMover, { passive: true });
      document.addEventListener('mouseout', aoSair, { passive: true });
      p.soltar = () => {
        removeEventListener('pointermove', aoMover);
        document.removeEventListener('mouseout', aoSair);
      };
      return p;
    }
    pincel = montarPincel();
    aoDesmontar(() => {
      const p = pincel;
      pincel = null;
      cadaUm([() => p.soltar(), () => p.tinta.liberar(), () => p.preenchimento.desfazer()]);
    });

    // Clique numa tela (quem decide é core/clique.js): só depois da abertura; a da parada em foco
    // (obra, capa ou recorte de texto) abre o mergulho, qualquer outra visível leva até a sua
    // parada. Durante uma viagem, toda tela leva até a sua parada. Dentro do
    // mergulho o scroll suavizado para, o pincel descansa e a pintura vem na maior largura.
    mergulho = criarMergulho({
      palco, porId, images, telas, estado, poseDoScroll,
      destino: (mesh) => destinoDoClique({
        parada: porId.get(mesh.userData.stopId),
        emFoco: emFoco(linha, vhDe(scrollY, innerHeight)),
        aberturaPronta: abertura?.estado === 'fim',
        mergulhoAberto: Boolean(estado.mergulho),
        viajando: navegacao.viajando,
      }),
      aoViajar: (mesh) => navegacao.irPara(mesh.userData.stopId),
      aoAbrir(mesh) {
        navegacao.cancelar();
        lenis.stop();
        pincel.tinta.ativa = false;
        pincel.tinta.romper();
        pincel.preenchimento.romper();
        const id = mesh.userData.imagem;
        imagemDoMergulho = id;
        texturas.pedir(id, larguraMaxima(id))
          .then((tex) => { if (tex && ativo) aplicar(id, tex); })
          .catch((erro) => console.error(erro));
      },
      aoFechar() {
        lenis?.start();
        if (pincel) pincel.tinta.ativa = true;
        imagemDoMergulho = null;
        if (ativo && indiceAtual >= 0) carregarJanela(indiceAtual); // volta à largura da janela (não na desmontagem)
      },
    });
    aoDesmontar(() => mergulho.encerrar()); // fecha o mergulho com o scroll e o pincel ainda vivos

    let indiceAtual = -1;
    palco.aoQuadro((t, dt) => {
      pincel.obstaculos = null; // a câmera e os textos podem ter mudado
      lenis.raf(t);
      const vh = vhDe(scrollY, innerHeight);
      if (innerHeight === alturaMedida) vhDaTravessia = vh;
      const s = situar(linha, vh);
      estado.id = s.id;
      estado.local = s.local;
      if (!mergulho.quadro(dt)) aplicarParalaxe(vh); // no mergulho a câmera é dele, sem paralaxe
      aplicarLuz(dt);
      legendas.atualizar(vh);
      // Cabeçalho e fileira só voltam depois da volta do mergulho: o 2º clique em "voltar" cairia no cabeçalho.
      navegacao.quadro(dt, { atual: s.id, oculta: abertura?.estado !== 'fim' || Boolean(estado.mergulho) || mergulho.saindo });
      if (s.indice !== indiceAtual) { indiceAtual = s.indice; carregarJanela(indiceAtual); }
    });

    posicionar();
    const inicio = situar(linha, (scrollY / innerHeight) * 100);
    indiceAtual = inicio.indice;
    estado.id = inicio.id;

    // Abertura: só a fonte e a capa (em 640, leve) bloqueiam; content.json e images.json já
    // chegaram. Do topo, a capa vem antes de tudo: o resto da janela (inclusive a capa na largura
    // certa, que troca sem salto quando chegar) espera por ela, ou pelo fim da abertura se a capa
    // travar. Recarregada no meio da página, a janela carrega já e a abertura só espera a fonte.
    const fonte = document.fonts ? document.fonts.load('1em Outfit') : Promise.resolve();
    const telaDaCapa = stops[0].tipo === 'capa' ? telas.find((m) => m.userData.stopId === stops[0].id) : null;
    const etapas = [Promise.resolve(), Promise.resolve(), fonte];
    let capa = null;
    if (telaDaCapa && scrollY <= 0) {
      const id = telaDaCapa.userData.imagem;
      const larguras = images[id].larguras;
      const largura = larguras.includes(ABERTURA.larguraDaCapa) ? ABERTURA.larguraDaCapa : larguras[0];
      capa = lento === 'trava' ? new Promise(() => {}) : texturas.pedir(id, largura).then((tex) => {
        if (tex && ativo) aplicar(id, tex, abertura?.estado !== 'carregando');
      });
      capa.catch((erro) => console.error(erro));
      etapas.push(capa);
    } else {
      carregarJanela(indiceAtual); // já pede as texturas da parada inicial, sem esperar o primeiro quadro
    }
    const fundo = telas.filter((m) => m !== telaDaCapa);
    abertura = rodarAbertura({ telaDaCapa, pronto: Promise.all(etapas), etapas, fundo });
    aoDesmontar(() => abertura.encerrar());
    if (capa) {
      Promise.race([capa, abertura]).catch(() => {}) // erro da capa já registrado acima
        .then(() => { if (ativo) carregarJanela(indiceAtual); })
        .catch(desmontar);
    }
    // Redimensionar não muda de parada: antes de tudo, o mesmo vh em px da altura nova (e o
    // mergulho aberto passa a contar a partir dele). As texturas esperam a janela assentar.
    let prazoTexturas = 0;
    aoDesmontar(() => clearTimeout(prazoTexturas));
    addEventListener('resize', () => {
      if (!ativo) return;
      try {
        const vh = vhDaTravessia ?? vhDe(scrollY, alturaMedida);
        alturaMedida = innerHeight;
        lenis.resize();
        navegacao.cancelar();
        lenis.scrollTo(pxDe(vh, innerHeight), { immediate: true, force: true });
        vhDaTravessia = vh;
        mergulho.reancorar();
        palco.redimensionar();
        pincel?.tinta.redimensionar();
        pincel?.preenchimento.reposicionar();
        posicionar();
        clearTimeout(prazoTexturas);
        prazoTexturas = setTimeout(() => {
          try { if (ativo && indiceAtual >= 0) carregarJanela(indiceAtual); } catch (erro) { desmontar(erro); }
        }, 200);
      } catch (erro) { desmontar(erro); }
    });
    document.fonts?.ready.then(() => { if (ativo) posicionar(); }).catch(desmontar);
  }
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
      if (!(await iniciarTravessia(piloto, images))) { ficarNaBase(); restaurarScroll(false); }
    } catch (erro) { // qualquer falha do modo imersivo deixa a página base intacta
      console.error(erro);
      ficarNaBase();
    }
  } else {
    restaurarScroll(false);
  }
} catch (erro) {
  console.error(erro);
  raiz.textContent = 'Não foi possível carregar o portfólio.';
}
