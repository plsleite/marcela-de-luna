// Abertura (só na travessia). Enquanto `pronto` não resolve, um traço de tinta fino no centro da
// janela cresce com a fração já carregada (só aparece se a espera passar de 200 ms). Depois, a
// pintura da capa surge por pinceladas diagonais (uRevela 0 → 1 no shader da tela), "PORTFÓLIO"
// sobe letra a letra, "MARCELA DE LUNA" se enche de tinta e ano e contato entram por opacidade.
// O scroll nunca espera: qualquer gesto de rolagem (ou mudança de scrollY) leva tudo ao estado
// final na hora. Recarregada no meio da página (scrollY > 0), não há revelação, só o traço.
// O estado final é a ausência da abertura: terminar desfaz tudo o que ela pôs na página.
import { gsap } from 'gsap';
import { ABERTURA, fracaoCarregada } from '../core/abertura.js';
import { pincelada, grafemas } from './preenchimento.js';

const TECLAS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar']);

// telaDaCapa: mesh da capa (uRevela); pronto: promessa da fonte e da textura da capa;
// etapas: as promessas que compõem a fração do traço (as já resolvidas contam como feitas);
// fundo: as outras telas, que ficam ocultas até a capa quase se completar (o vulto da parada
// seguinte, ao longe, não aparece na tela branca nem pelos vãos das pinceladas).
// Devolve uma promessa que resolve ao terminar, com .encerrar() (desmontar) e .estado.
export function rodarAbertura({ telaDaCapa, pronto, etapas = [pronto], fundo = [] }) {
  const revelar = scrollY <= 0 && Boolean(telaDaCapa);
  const u = telaDaCapa?.material.uniforms;
  const secao = revelar ? document.getElementById(telaDaCapa.userData.stopId) : null;
  const titulo = secao?.querySelector('.capa-titulo') ?? null;
  const nome = secao?.querySelector('.nome') ?? null;
  const extras = secao ? ['.ano', '.contato', '.rodape'].map((s) => secao.querySelector(s)).filter(Boolean) : [];
  const textoDoTitulo = titulo?.textContent ?? '';
  const y0 = scrollY;
  const opacidades = revelar ? fundo.map((m) => m.material.uniforms.uOpacidade) : [];

  let estado = 'carregando';
  let terminado = false;
  let traco = null;
  let linha = null; // timeline da revelação
  let letras = [];
  let feitos = 0;
  let resolver;
  const fim = new Promise((r) => { resolver = r; });

  // ---------- estado inicial: capa em branco ----------
  if (revelar) {
    gsap.killTweensOf(u.uRevela);
    u.uRevela.value = 0;
    for (const o of opacidades) o.value = 0;
    if (titulo) gsap.set(titulo, { opacity: 0 });
    if (nome) {
      nome.style.setProperty('--abertura-pincelada', pincelada(false));
      nome.style.setProperty('--enche', '100%');
      nome.classList.add('abertura-enche');
    }
    gsap.set(extras, { opacity: 0 });
  }

  // ---------- traço de carregamento ----------
  const fracao = () => fracaoCarregada(feitos, etapas.length);
  // Teto da espera: se `pronto` não resolver em ABERTURA.prazo (rede travada sem erro), a
  // página vai ao estado final; a capa entra depois, quando chegar. A revelação já em curso segue.
  const prazo = setTimeout(() => { if (estado === 'carregando') terminar(); }, ABERTURA.prazo * 1000);
  const temporizador = setTimeout(() => {
    if (terminado || estado !== 'carregando') return;
    traco = document.createElement('div');
    traco.className = 'abertura-traco';
    traco.setAttribute('aria-hidden', 'true');
    document.body.append(traco);
    gsap.set(traco, { xPercent: -50, yPercent: -50, scaleX: fracao(), opacity: 0 });
    gsap.to(traco, { opacity: 1, duration: 0.25, ease: 'power1.out' });
  }, ABERTURA.atrasoDoTraco * 1000);
  for (const e of etapas) {
    const conta = () => {
      feitos++;
      if (traco && estado === 'carregando') gsap.to(traco, { scaleX: fracao(), duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    };
    Promise.resolve(e).then(conta, conta);
  }

  // ---------- rolar termina tudo ----------
  const aoRolar = () => terminar();
  const aoTeclar = (e) => { if (TECLAS.has(e.key)) terminar(); };
  const aoMudarScroll = () => { if (scrollY !== y0) terminar(); };
  addEventListener('wheel', aoRolar, { passive: true });
  addEventListener('touchmove', aoRolar, { passive: true });
  addEventListener('keydown', aoTeclar);
  addEventListener('scroll', aoMudarScroll, { passive: true });
  addEventListener('resize', aoRolar); // as letras foram medidas para esta janela

  Promise.resolve(pronto).then(comecar, () => terminar()); // sem a capa: estado final direto

  function comecar() {
    if (terminado) return;
    clearTimeout(temporizador);
    clearTimeout(prazo);
    estado = 'revelando';
    linha = gsap.timeline({ onComplete: terminar });
    let t0 = 0;
    if (traco) {
      linha.to(traco, { scaleX: 1, duration: 0.25, ease: 'power2.out', overwrite: 'auto' }, 0)
        .to(traco, { opacity: 0, duration: 0.3, ease: 'power1.in', onComplete: tirarTraco }, 0.2);
      t0 = 0.2;
    }
    if (!revelar) { if (!traco) terminar(); return; } // no meio da página: só o traço
    linha.to(u.uRevela, { value: 1, duration: ABERTURA.revela, ease: 'none' }, t0);
    linha.to(opacidades, { value: 1, duration: 0.8, ease: 'power1.inOut' }, t0 + ABERTURA.revela * 0.7);
    const depois = t0 + ABERTURA.revela;
    if (titulo) {
      letras = separarTitulo();
      gsap.set(titulo, { clearProps: 'opacity' });
      linha.fromTo(letras, { yPercent: 75, opacity: 0 }, {
        yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: ABERTURA.intervaloLetras,
      }, depois);
    }
    if (nome) linha.to(nome, { '--enche': '0%', duration: 1.1, ease: 'power2.inOut' }, depois + 0.25);
    if (extras.length) linha.to(extras, { opacity: 1, duration: 0.7, ease: 'power1.out', stagger: 0.12 }, depois + 0.7);
  }

  // "PORTFÓLIO" em spans (aria-hidden; o texto segue no aria-label). Cada letra fica exatamente
  // onde estava no texto corrido (o deslocamento compensa o kerning perdido entre os spans),
  // para que desfazer a separação no fim não mova nada.
  function separarTitulo() {
    const no = titulo.firstChild;
    const pedacos = grafemas(textoDoTitulo);
    const antes = [];
    if (no?.nodeType === Node.TEXT_NODE) {
      const faixa = document.createRange();
      let i = 0;
      for (const g of pedacos) {
        faixa.setStart(no, i); faixa.setEnd(no, i + g.length);
        antes.push(faixa.getBoundingClientRect());
        i += g.length;
      }
    }
    titulo.setAttribute('aria-label', textoDoTitulo);
    const frag = document.createDocumentFragment();
    const spans = [];
    for (const g of pedacos) {
      if (/^\s+$/.test(g)) { frag.append(g); spans.push(null); continue; }
      const s = document.createElement('span');
      s.className = 'abertura-letra';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = g;
      frag.append(s);
      spans.push(s);
    }
    titulo.replaceChildren(frag);
    // mede o glifo do mesmo jeito (Range sobre o texto), não a caixa do inline-block
    const faixa = document.createRange();
    spans.forEach((s, i) => {
      if (!s || !antes[i]) return;
      faixa.selectNodeContents(s);
      const r = faixa.getBoundingClientRect();
      gsap.set(s, { x: antes[i].left - r.left, y: antes[i].top - r.top });
    });
    return spans.filter(Boolean);
  }

  function tirarTraco() {
    if (!traco) return;
    gsap.killTweensOf(traco);
    traco.remove();
    traco = null;
  }

  // Estado final, na hora: o que a abertura pôs na página sai, a pintura fica inteira.
  function terminar() {
    if (terminado) return;
    terminado = true;
    estado = 'fim';
    clearTimeout(temporizador);
    clearTimeout(prazo);
    linha?.kill();
    removeEventListener('wheel', aoRolar);
    removeEventListener('touchmove', aoRolar);
    removeEventListener('keydown', aoTeclar);
    removeEventListener('scroll', aoMudarScroll);
    removeEventListener('resize', aoRolar);
    tirarTraco();
    if (revelar) {
      gsap.killTweensOf(u.uRevela);
      u.uRevela.value = 1;
      gsap.killTweensOf(opacidades);
      for (const o of opacidades) o.value = 1;
      if (titulo) {
        gsap.killTweensOf([titulo, ...letras]);
        titulo.textContent = textoDoTitulo;
        titulo.removeAttribute('aria-label');
        gsap.set(titulo, { clearProps: 'opacity' });
        letras = [];
      }
      if (nome) {
        gsap.killTweensOf(nome);
        nome.classList.remove('abertura-enche');
        nome.style.removeProperty('--enche');
        nome.style.removeProperty('--abertura-pincelada');
      }
      gsap.killTweensOf(extras);
      gsap.set(extras, { clearProps: 'opacity' });
      for (const el of [titulo, nome, ...extras]) if (el?.getAttribute('style') === '') el.removeAttribute('style');
    }
    resolver();
  }

  fim.encerrar = terminar;
  Object.defineProperty(fim, 'estado', { get: () => estado });
  return fim;
}
