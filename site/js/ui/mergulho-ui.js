// Mergulho: clicar na tela da parada em foco leva a câmera para dentro dela (a tela cabe em 92%
// da janela), com título, ficha e "voltar"; roda e pinça aproximam no cursor, arrasto move a
// vista sem sair da pintura (no Safari do macOS, a pinça chega como gesturestart/change/end); marcas sobre os closes abrem o detalhe em alta resolução.
// Sair (Esc, "voltar", clicar fora da tela, rolar para baixo com zoom 1, rolar a página por outro meio, irPara)
// devolve a câmera à posição do scroll, que não muda durante o mergulho.
// Tudo o que o mergulho cria (elementos, ouvintes, tweens) sai em fechar() e em encerrar().
import * as THREE from 'three';
import { gsap } from 'gsap';
import { fovPara } from '../core/camera.js';
import { aplicarZoom, arrastar, distanciaDeEncaixe, extensaoVisivel, fovDoZoom, ZOOM_MIN } from '../core/mergulho.js';
import { pontoNaTela } from '../gl/tela.js';

const OCUPA = 0.92;     // fração da janela que a tela ocupa com zoom 1
const ENTRA = 0.9;      // s
const SAI = 0.7;        // s
const DETALHE = 0.6;    // s: o close cresce da marca até a janela
const DETALHE_FIRME = 300; // ms: cliques no detalhe recém-aberto não o fecham (duplo clique na marca)
const SEGUE = 0.22;     // lerp por quadro de 60 Hz da vista exibida rumo à pedida (zoom e arrasto suaves)
const GESTO = 200;      // ms sem roda: começa outro gesto
const TETO_ENGOLIR = 400; // ms: depois de sair pela roda, ela só é contida até aqui, no máximo
const ARRASTO_MIN = 4;  // px: abaixo disto foi clique, não arrasto
const CLIQUE_MAX = 6;   // px: fora do mergulho, um clique que andou mais que isto foi arrasto
const RODA = 0.002;     // ganho do zoom por px de roda
const PINCA = 0.01;     // ganho da pinça do trackpad (ctrl + roda: deltas pequenos)
const QUADRO = 1000 / 60;

const html = document.documentElement;
const CHAVES = ['x', 'y', 'z', 'rx', 'ry', 'fov'];
const misturar = (a, b, k) => Object.fromEntries(CHAVES.map((c) => [c, a[c] + (b[c] - a[c]) * k]));

// opcoes: palco; porId (Map id → stop); images; telas (meshes); estado (estado.mergulho é escrito aqui);
// poseDoScroll() → { x, y, z, rx, ry, fov } da câmera pela travessia; destino(mesh) → 'mergulho'
// (abre), 'viagem' (chama aoViajar(mesh)) ou null (o clique não faz nada): quem decide é main.js;
// aoAbrir(mesh) e aoFechar(mesh): o resto do site entra e sai do modo mergulho.
export function criarMergulho({ palco, porId, images, telas, estado, poseDoScroll, destino, aoViajar, aoAbrir, aoFechar }) {
  const cam = palco.camera;
  let m = null;      // sessão aberta
  let saida = null;  // volta animada depois de fechar: { de, t, tween, opacidades }
  let engolir = null; // ouvinte que segura o resto do gesto de roda que fechou o mergulho
  const lancador = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const _p = new THREE.Vector3();

  function porNaCamera(p) {
    cam.position.set(p.x, p.y, p.z);
    cam.rotation.set(p.rx, p.ry, 0);
    if (cam.fov !== p.fov) { cam.fov = p.fov; cam.updateProjectionMatrix(); }
  }
  const poseAtual = () => ({ x: cam.position.x, y: cam.position.y, z: cam.position.z, rx: cam.rotation.x, ry: cam.rotation.y, fov: cam.fov });
  const dims = (mesh) => mesh.geometry.parameters;
  // Campo vertical efetivo da janela atual (o mesmo da travessia: core/camera.js).
  const aspecto = () => innerWidth / innerHeight;
  const ext = (mesh) => extensaoVisivel(dims(mesh).width, dims(mesh).height, aspecto(), fovPara(aspecto()), OCUPA);
  function poseDaVista(mesh, v) {
    const { width: w, height: h } = dims(mesh);
    const fov = fovPara(aspecto());
    const d = distanciaDeEncaixe(w, h, aspecto(), fov, OCUPA);
    return { x: mesh.position.x + (v.cx - 0.5) * w, y: mesh.position.y + (v.cy - 0.5) * h, z: mesh.position.z + d, rx: 0, ry: 0, fov: fovDoZoom(fov, v.zoom) };
  }
  // Ponto da tela (UV, v para cima) sob (x, y) px da janela, com a câmera do último quadro.
  function uvSob(mesh, x, y) {
    cam.updateMatrixWorld();
    lancador.setFromCamera(ndc.set((x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2), cam);
    const p = pontoNaTela(mesh, lancador.ray);
    if (!p) return { x: 0.5, y: 0.5 };
    return { x: Math.min(1, Math.max(0, p.u)), y: Math.min(1, Math.max(0, p.v)) };
  }
  // (x, y) px da janela cai sobre a tela ampliada? (com a câmera do último quadro)
  function sobATela(mesh, x, y) {
    cam.updateMatrixWorld();
    lancador.setFromCamera(ndc.set((x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2), cam);
    const p = pontoNaTela(mesh, lancador.ray);
    return Boolean(p) && p.u >= 0 && p.u <= 1 && p.v >= 0 && p.v <= 1;
  }

  // ---------- interface ----------
  function criarInterface(stop, closes) {
    const ui = document.createElement('div');
    ui.className = 'mergulho';
    const voltar = document.createElement('button');
    voltar.type = 'button';
    voltar.className = 'mergulho-voltar';
    voltar.textContent = 'voltar';
    // Título e ficha só nas obras: a capa e os recortes das páginas de texto não têm legenda no
    // PDF, e a interface deles é só o "voltar" (nenhum bloco vazio).
    const ficha = stop.tipo === 'obra' ? criarFicha(stop) : null;
    const marcas = closes.map((close) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mergulho-marca';
      b.setAttribute('aria-label', 'Ver detalhe');
      return { el: b, close };
    });
    ui.append(voltar, ...(ficha ? [ficha] : []), ...marcas.map((mk) => mk.el));
    return { ui, voltar, marcas };
  }
  function criarFicha(stop) {
    const ficha = document.createElement('div');
    ficha.className = 'mergulho-ficha';
    const titulo = document.createElement('h2');
    titulo.className = 'mergulho-titulo';
    titulo.textContent = stop.titulo ?? '';
    ficha.append(titulo);
    const f = stop.ficha ?? {};
    for (const linha of [f.tecnica, f.dimensoes, f.ano]) {
      const el = document.createElement('div');
      el.className = 'mergulho-linha';
      el.textContent = linha ?? '';
      ficha.append(el);
    }
    return ficha;
  }

  function posicionarMarcas() {
    const { width: w, height: h } = dims(m.mesh);
    const o = m.mesh.position;
    cam.updateMatrixWorld();
    for (const mk of m.marcas) {
      _p.set(o.x + (mk.close.x - 0.5) * w, o.y + (0.5 - mk.close.y) * h, o.z).project(cam);
      const x = ((_p.x + 1) / 2) * innerWidth, y = ((1 - _p.y) / 2) * innerHeight;
      mk.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }

  // ---------- abrir ----------
  function abrir(mesh) {
    if (m || saida || !mesh) return;
    const stop = porId.get(mesh.userData.stopId);
    if (!stop) return;
    const indiceTela = mesh.userData.indiceTela;
    const closes = (stop.closes ?? []).filter((c) => c.tela === indiceTela && images[c.imagem]);
    const { ui, voltar, marcas } = criarInterface(stop, closes);
    m = {
      mesh, ui, voltar, marcas, y0: scrollY, foco: document.activeElement,
      vista: { zoom: 1, cx: 0.5, cy: 0.5 }, ver: { zoom: 1, cx: 0.5, cy: 0.5 },
      t: { v: 0 }, fase: 'entrando', detalhe: null, saindo: new Set(),
      arrasto: null, engolirClique: false, gesto: { ultimo: -Infinity, podeSair: false }, pinca: null,
      opacidades: telas.filter((t) => t !== mesh).map((t) => t.material.uniforms.uOpacidade),
    };
    estado.mergulho = { stopId: stop.id, tela: indiceTela, close: null };
    // As saídas (Esc, "voltar", roda, scroll) existem antes de qualquer coisa que trave o
    // visitante; se algo lançar no meio da entrada, o mergulho fecha na hora e nada fica preso.
    voltar.addEventListener('click', aoVoltar);
    for (const mk of marcas) mk.el.addEventListener('click', aoMarca);
    addEventListener('keydown', aoTeclar);
    addEventListener('wheel', aoRodar, { passive: false });
    addEventListener('pointerdown', aoApertar);
    addEventListener('pointermove', aoArrastar, { passive: true });
    addEventListener('pointerup', aoSoltar);
    addEventListener('pointercancel', aoSoltar);
    addEventListener('scroll', aoRolarPagina, { passive: true });
    addEventListener('gesturestart', aoPincaInicio, { passive: false });
    addEventListener('gesturechange', aoPinca, { passive: false });
    addEventListener('gestureend', aoPincaFim, { passive: false });
    try {
      html.classList.remove('tela-clicavel');
      html.classList.add('mergulhando');
      document.body.append(ui);
      aoAbrir(mesh);
      gsap.to(m.opacidades, { value: 0, duration: 0.6, ease: 'power1.out', overwrite: true });
      const s = m;
      gsap.to(m.t, {
        v: 1, duration: ENTRA, ease: 'power3.inOut',
        onComplete: () => { s.fase = 'livre'; s.ui.classList.add('livre'); },
      });
      voltar.focus({ preventScroll: true });
    } catch (erro) {
      fechar({ imediato: true });
      throw erro;
    }
  }

  // ---------- fechar ----------
  // imediato: sem animação (a página rolou por outro meio, ou a travessia se desmonta).
  function fechar({ imediato = false } = {}) {
    if (!m) { if (imediato) pararSaida(); return; }
    const s = m;
    m = null;
    estado.mergulho = null;
    removeEventListener('keydown', aoTeclar);
    removeEventListener('wheel', aoRodar, { passive: false });
    removeEventListener('pointerdown', aoApertar);
    removeEventListener('pointermove', aoArrastar, { passive: true });
    removeEventListener('pointerup', aoSoltar);
    removeEventListener('pointercancel', aoSoltar);
    removeEventListener('scroll', aoRolarPagina, { passive: true });
    removeEventListener('gesturestart', aoPincaInicio, { passive: false });
    removeEventListener('gesturechange', aoPinca, { passive: false });
    removeEventListener('gestureend', aoPincaFim, { passive: false });
    // Primeiro o que trava o visitante (scroll suavizado, pincel); um erro aí não impede o resto
    // da saída, e é relançado no fim.
    let falha = null;
    try { aoFechar(s.mesh); } catch (erro) { falha = erro; }
    html.classList.remove('mergulhando', 'arrastando', 'fora-da-tela');
    s.ui.remove();
    gsap.killTweensOf(s.t);
    for (const d of [s.detalhe, ...s.saindo]) if (d) tirarDetalhe(d);
    if (s.foco?.isConnected && s.foco !== document.body) s.foco.focus({ preventScroll: true });
    else document.activeElement?.blur?.();

    gsap.killTweensOf(s.opacidades);
    if (imediato) {
      for (const o of s.opacidades) o.value = 1;
      pararSaida();
      porNaCamera(poseDoScroll());
      if (falha) throw falha;
      return;
    }
    gsap.to(s.opacidades, { value: 1, duration: SAI, ease: 'power1.inOut' });
    const t = { v: 1 };
    saida = {
      de: poseAtual(), t, opacidades: s.opacidades,
      tween: gsap.to(t, { v: 0, duration: SAI, ease: 'power2.inOut', onComplete: () => { saida = null; } }),
    };
    if (falha) throw falha;
  }
  function pararSaida() {
    if (!saida) return;
    saida.tween.kill();
    gsap.killTweensOf(saida.opacidades);
    for (const o of saida.opacidades) o.value = 1;
    saida = null;
    porNaCamera(poseDoScroll());
  }

  // ---------- quadro: a câmera é do mergulho enquanto ele existe (e na volta) ----------
  function quadro(dt) {
    if (m) {
      const e = ext(m.mesh);
      m.vista = arrastar(m.vista, 0, 0, e); // a janela pode ter mudado
      const a = 1 - (1 - SEGUE) ** Math.max(0, dt / QUADRO);
      const v = m.ver;
      v.zoom = Math.exp(Math.log(v.zoom) + (Math.log(m.vista.zoom) - Math.log(v.zoom)) * a);
      v.cx += (m.vista.cx - v.cx) * a;
      v.cy += (m.vista.cy - v.cy) * a;
      if (Math.abs(v.zoom - m.vista.zoom) < 1e-4) v.zoom = m.vista.zoom;
      const alvo = poseDaVista(m.mesh, v);
      porNaCamera(m.t.v < 1 ? misturar(poseDoScroll(), alvo, m.t.v) : alvo);
      if (m.marcas.length) posicionarMarcas();
      return true;
    }
    if (saida) {
      porNaCamera(misturar(poseDoScroll(), saida.de, saida.t.v));
      return true;
    }
    return false;
  }

  // ---------- entradas durante o mergulho ----------
  function aoVoltar(e) {
    e.stopPropagation();
    if (m?.detalhe) recolher(); else fechar();
  }
  function aoTeclar(e) {
    if (e.key !== 'Escape' || !m) return;
    e.preventDefault();
    if (m.detalhe) recolher(); else fechar();
  }
  function aoRolarPagina() {
    if (m && Math.abs(scrollY - m.y0) > 1) fechar({ imediato: true }); // barra de rolagem, teclado…
  }
  // A página está parada e a roda é o zoom: aqui o preventDefault é legítimo (sem ele, ctrl +
  // roda ampliaria a página). Rolar para baixo com zoom 1 sai, se o gesto já começou em zoom 1
  // (a inércia de um afastamento que chegou a 1 não fecha o mergulho).
  function aoRodar(e) {
    e.preventDefault();
    if (!m) return;
    const agora = performance.now();
    const g = m.gesto;
    if (agora - g.ultimo > GESTO) g.podeSair = m.fase === 'livre' && m.vista.zoom === ZOOM_MIN;
    g.ultimo = agora;
    if (m.fase !== 'livre' || m.detalhe) return;
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    if (!dy) return;
    if (!e.ctrlKey && dy > 0 && m.vista.zoom === ZOOM_MIN && g.podeSair) { fechar(); engolirResto(); return; }
    const fator = Math.exp(-dy * (e.ctrlKey ? PINCA : RODA));
    m.vista = aplicarZoom(m.vista, fator, uvSob(m.mesh, e.clientX, e.clientY), ext(m.mesh));
    if (m.vista.zoom !== ZOOM_MIN) g.podeSair = false;
  }
  // Pinça do Safari (macOS): e.scale é relativo ao gesturestart; a âncora é o último ponto do
  // ponteiro. O preventDefault impede o Safari de ampliar a página. Não verificado (sem Safari).
  function aoPincaInicio(e) {
    e.preventDefault();
    if (m) m.pinca = { zoom0: m.vista.zoom };
  }
  function aoPinca(e) {
    e.preventDefault();
    if (!m?.pinca || m.fase !== 'livre' || m.detalhe || !(e.scale > 0)) return;
    const fator = (m.pinca.zoom0 * e.scale) / m.vista.zoom;
    m.vista = aplicarZoom(m.vista, fator, uvSob(m.mesh, ponteiro.x, ponteiro.y), ext(m.mesh));
    if (m.vista.zoom !== ZOOM_MIN) m.gesto.podeSair = false;
  }
  function aoPincaFim(e) {
    e.preventDefault();
    if (m) m.pinca = null;
  }
  function aoApertar(e) {
    if (m) m.engolirClique = false; // um arrasto anterior sem click não engole o próximo
    if (!m || m.fase !== 'livre' || m.detalhe || e.button !== 0 || !e.isPrimary) return;
    if (e.target.closest?.('button, a')) return;
    m.arrasto = { id: e.pointerId, x: e.clientX, y: e.clientY, total: 0 };
  }
  function aoArrastar(e) {
    const a = m?.arrasto;
    if (!a || e.pointerId !== a.id) return;
    const dx = e.clientX - a.x, dy = e.clientY - a.y;
    a.x = e.clientX; a.y = e.clientY;
    a.total += Math.hypot(dx, dy);
    if (a.total < ARRASTO_MIN) return;
    html.classList.add('arrastando');
    const ex = ext(m.mesh), z = m.vista.zoom;
    // a janela mostra ex/z da tela em cada eixo: px → UV; arrastar para a direita leva a pintura junto
    m.vista = arrastar(m.vista, (-dx * ex.u) / (innerWidth * z), (dy * ex.v) / (innerHeight * z), ex);
  }
  function aoSoltar(e) {
    const a = m?.arrasto;
    if (!a || e.pointerId !== a.id) return;
    m.arrasto = null;
    html.classList.remove('arrastando');
    if (a.total >= ARRASTO_MIN) m.engolirClique = true; // o click que segue o arrasto não conta
  }

  // O resto do gesto que fechou (inércia do trackpad, roda ainda girando) não rola a página
  // logo de cara: a volta começa no mesmo ponto. Teto absoluto de 400 ms após a saída, seja
  // qual for o intervalo entre eventos; antes disso, uma pausa de 200 ms (gesto novo) já solta.
  let prazoEngolir = 0;
  function engolirResto() {
    soltarEngolir();
    const inicio = performance.now();
    let ultimo = inicio;
    engolir = (e) => {
      const agora = performance.now();
      if (agora - inicio > TETO_ENGOLIR || agora - ultimo > GESTO) { soltarEngolir(); return; }
      ultimo = agora;
      e.preventDefault();
      e.stopPropagation(); // na captura da janela: o Lenis (na janela, sem captura) não recebe
    };
    addEventListener('wheel', engolir, { capture: true, passive: false });
    prazoEngolir = setTimeout(soltarEngolir, TETO_ENGOLIR);
  }
  function soltarEngolir() {
    clearTimeout(prazoEngolir);
    if (engolir) removeEventListener('wheel', engolir, { capture: true, passive: false });
    engolir = null;
  }

  // ---------- closes ----------
  function aoMarca(e) {
    e.stopPropagation();
    const mk = m?.marcas.find((x) => x.el === e.currentTarget);
    if (mk) abrirDetalhe(mk);
  }
  function abrirDetalhe(mk) {
    if (!m || m.fase !== 'livre' || m.detalhe) return;
    const id = mk.close.imagem;
    const info = images[id];
    const caixa = document.createElement('div');
    caixa.className = 'mergulho-detalhe';
    const img = document.createElement('img');
    img.alt = 'DETALHES';
    img.decoding = 'async';
    img.width = info.w; img.height = info.h;
    img.src = `./assets/img/${id}-${info.larguras.at(-1)}.webp`;
    caixa.append(img);
    m.ui.before(caixa);
    m.ui.classList.add('com-detalhe');
    m.detalhe = { caixa, img, marca: mk.el, desde: performance.now() };
    estado.mergulho.close = id;
    const r = mk.el.getBoundingClientRect();
    gsap.fromTo(caixa, { opacity: 0 }, { opacity: 1, duration: DETALHE * 0.6, ease: 'power1.out' });
    gsap.fromTo(img,
      { x: r.left + r.width / 2 - innerWidth / 2, y: r.top + r.height / 2 - innerHeight / 2, scale: 0.03 },
      { x: 0, y: 0, scale: 1, duration: DETALHE, ease: 'power3.out' });
    caixa.addEventListener('click', (ev) => { ev.stopPropagation(); if (!detalheRecente()) recolher(); });
  }
  const detalheRecente = () => Boolean(m?.detalhe) && performance.now() - m.detalhe.desde < DETALHE_FIRME;
  function recolher() {
    const d = m?.detalhe;
    if (!d) return;
    m.detalhe = null;
    estado.mergulho.close = null;
    m.ui.classList.remove('com-detalhe');
    m.saindo.add(d);
    const s = m;
    const r = d.marca.getBoundingClientRect();
    gsap.killTweensOf([d.caixa, d.img]);
    gsap.to(d.img, { x: r.left + r.width / 2 - innerWidth / 2, y: r.top + r.height / 2 - innerHeight / 2, scale: 0.03, duration: DETALHE * 0.75, ease: 'power3.in' });
    gsap.to(d.caixa, { opacity: 0, duration: DETALHE * 0.75, ease: 'power2.in', onComplete: () => { s.saindo.delete(d); tirarDetalhe(d); } });
    if (document.activeElement === document.body || !document.activeElement) s.voltar.focus({ preventScroll: true });
  }
  function tirarDetalhe(d) {
    gsap.killTweensOf([d.caixa, d.img]);
    d.img.removeAttribute('src');
    d.caixa.remove();
  }

  // ---------- sempre: clique numa tela e cursor ----------
  // Onde o botão desceu: um clique que chega depois de arrastar (seleção, gesto) não viaja nem mergulha.
  let descida = null;
  function aoDescer(e) { descida = e.isPrimary ? { x: e.clientX, y: e.clientY } : descida; }
  // Com uma tela ampliada: um clique num controle (botão de som, "voltar") é só dele; com um
  // close aberto, o clique fora fecha só o close; sem ele, um clique
  // (não arrasto) fora da tela e fora dos controles fecha a ampliação. Este mesmo clique não
  // segue adiante (não viaja): a volta (saida) ainda segura os cliques seguintes.
  function aoClicar(e) {
    if (e.button !== 0) return;
    const d0 = descida;
    descida = null;
    const arrastou = Boolean(d0) && Math.hypot(e.clientX - d0.x, e.clientY - d0.y) > CLIQUE_MAX;
    if (m) {
      if (m.engolirClique) { m.engolirClique = false; return; }
      if (e.target.closest?.('a, button, input, select, textarea, label')) return; // controles (som, voltar…)
      if (m.detalhe) { if (!detalheRecente()) recolher(); return; }
      if (arrastou) return;
      if (!sobATela(m.mesh, e.clientX, e.clientY)) fechar();
      return;
    }
    if (saida || e.target.closest?.('a, button, input, select, textarea, label')) return;
    if (arrastou) return;
    const mesh = palco.telaSob(e.clientX, e.clientY);
    const d = mesh ? destino(mesh) : null;
    if (d === 'mergulho') abrir(mesh);
    else if (d === 'viagem') aoViajar(mesh);
  }
  const ponteiro = { x: innerWidth / 2, y: innerHeight / 2 }; // último ponto (âncora da pinça do Safari)
  function aoPassar(e) {
    ponteiro.x = e.clientX; ponteiro.y = e.clientY;
    if (m) { // fora da tela ampliada o cursor avisa que o clique fecha
      if (e.pointerType !== 'touch' && !m.arrasto) html.classList.toggle('fora-da-tela', !sobATela(m.mesh, e.clientX, e.clientY));
      return;
    }
    if (saida || e.pointerType === 'touch') return;
    const mesh = palco.telaSob(e.clientX, e.clientY);
    html.classList.toggle('tela-clicavel', Boolean(mesh && destino(mesh)));
  }
  addEventListener('pointerdown', aoDescer, { passive: true });
  addEventListener('click', aoClicar);
  addEventListener('pointermove', aoPassar, { passive: true });

  // Desmontagem: os ouvintes saem sempre, mesmo se fechar lançar (o erro segue para quem chamou).
  function encerrar() {
    soltarEngolir();
    removeEventListener('pointerdown', aoDescer, { passive: true });
    removeEventListener('click', aoClicar);
    removeEventListener('pointermove', aoPassar, { passive: true });
    try {
      fechar({ imediato: true });
    } finally {
      pararSaida();
      html.classList.remove('tela-clicavel', 'mergulhando', 'arrastando', 'fora-da-tela');
      const fov = fovPara(aspecto());
      if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    }
  }

  // A janela mudou de altura e main.js levou o scroll ao mesmo vh: a sessão conta a partir daí
  // (senão a correção do scroll pareceria o visitante rolando a página e fecharia o mergulho).
  function reancorar() { if (m) m.y0 = scrollY; }

  // saindo: a volta animada (0,7 s) ainda não terminou; cabeçalho e fileira esperam por ela.
  return { abrir, fechar, quadro, encerrar, reancorar, get aberto() { return m !== null; }, get saindo() { return saida !== null; } };
}
