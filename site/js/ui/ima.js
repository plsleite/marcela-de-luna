// Ímã do scroll (só na travessia): quando o visitante para de rolar (nenhuma entrada há
// IMA.espera ms e a página parada), a câmera desliza até o foco da parada mais próxima, por
// lenis.scrollTo: o scroll continua o nativo. Qualquer entrada que rola (roda, toque, tecla de
// rolagem, barra de rolagem) interrompe o deslize na hora, sem impulso herdado e sem conter nada:
// a página fica onde está e o Lenis segue com o gesto. Enquanto um gesto está em curso (dedo na
// tela, botão apertado na barra), o ímã espera; ele conta a espera a partir de quando o gesto
// termina. Tab, Shift e as demais teclas não mexem no ímã. O ímã só age depois de uma entrada do visitante
// (nunca sozinho na carga, depois de restaurar a posição, nem depois de corrigir o resize) e
// nunca enquanto `bloqueado()` (abertura, tela ampliada ou a volta dela, viagem de navegação).
// O ímã respeita o sentido do gesto: guarda a origem (vh em que a página parava quando o gesto
// começou) e avança à parada vizinha já a partir de IMA.limiar do caminho; a origem se renova
// a cada chegada e se apaga com o bloqueio, o resize e o encerramento.
// Tudo o que este módulo cria (ouvintes) sai em encerrar().
import { IMA } from '../config.js';
import { alvoDoIma, duracaoDoIma, curvaDoIma, teclaDeRolagem } from '../core/ima.js';
import { vhDe, pxDe } from '../core/rolagem.js';

const CAPTURA = { capture: true, passive: true };
const DESVIO = 2; // px entre a página e o deslize do Lenis: a partir disto, alguém mexeu na barra
// px/s: abaixo disto a página está parada (o fim do amortecimento da roda, a menos de ~5 px do
// alvo, já conta; o deslize parte da posição e substitui esse resto sem salto)
const PARADA = 30;

export function criarIma({ linha, lenis, bloqueado }) {
  let armado = false;            // houve entrada do visitante desde a última vez que o ímã agiu
  let ultimaEntrada = -Infinity; // performance.now() da última entrada
  let naBarra = false;           // botão apertado sobre a barra de rolagem (até e.buttons voltar a 0)
  let toques = 0;                // dedos na tela
  let yConhecido = scrollY;      // scrollY no último quadro (ou na última correção)
  let tAnterior = performance.now();
  let deslize = null;            // userData do deslize em curso (identidade)
  let origem = null;             // vh em que a página estava parada quando o gesto começou (null: nenhum)
  const meu = () => deslize !== null && lenis.userData === deslize;
  const deslizando = () => meu() && lenis.isScrolling === 'smooth';

  // Para o deslize onde a página está (reset do Lenis: sem velocidade nem alvo herdados).
  // Devolve se havia um deslize (a página ficou fora do foco e o ímã precisa voltar a agir).
  function interromper() {
    const havia = deslizando();
    if (havia) lenis.reset();
    deslize = null;
    return havia;
  }
  function entrada() {
    // A origem só se grava na primeira entrada depois de um repouso: com o gesto em curso
    // (armado) ou o deslize cortado agora, ela segue sendo a do gesto.
    if (!interromper() && !armado) origem = vhDe(yConhecido, innerHeight);
    armado = true;
    ultimaEntrada = performance.now();
  }
  // Fim de um gesto (dedo solto, botão da barra solto): a espera começa agora.
  function fimDoGesto() {
    ultimaEntrada = performance.now();
  }
  const emGesto = () => toques > 0 || naBarra;

  // Na captura da janela: chega antes do Lenis (roda) e da navegação (teclas), então o deslize
  // já parou quando eles agem; a roda parte da posição atual.
  function aoRodar(e) { if (!e.ctrlKey && (e.deltaY || e.deltaX)) entrada(); } // ctrl + roda: pinça, não rola
  function aoTeclar(e) { if (teclaDeRolagem(e)) entrada(); }
  function aoTocar(e) {
    toques = e.touches.length;
    // o dedo na tela segura a página; só arma se cortou um deslize (senão, quando rolar)
    if (interromper()) armado = true;
  }
  const aoArrastarDedo = () => entrada(); // o dedo que move rola a página
  function aoSoltarDedo(e) {
    toques = e.touches.length;
    if (toques === 0) fimDoGesto();
  }
  // Barra de rolagem: o pointerdown cai no próprio <html> (o conteúdo da travessia é o <main>)
  // ou fora da área do conteúdo (barra clássica). Segura o ímã até e.buttons voltar a 0.
  function aoApertar(e) {
    const html = document.documentElement;
    if (e.target === html || e.clientX >= html.clientWidth || e.clientY >= html.clientHeight) {
      naBarra = true;
      entrada();
    }
  }
  function soltarBarra(e) {
    if (!naBarra || (e.type === 'pointermove' && e.buttons !== 0)) return;
    naBarra = false;
    fimDoGesto();
  }
  // Scroll nativo que não veio do Lenis nem de uma correção nossa: barra de rolagem, toque.
  function aoRolar() {
    const y = scrollY;
    if (meu()) {
      if (Math.abs(y - lenis.animatedScroll) > DESVIO) entrada(); // a barra no meio do deslize
      return;
    }
    if (lenis.isScrolling === 'native' && Math.abs(y - yConhecido) >= 1) entrada();
  }
  const OUVINTES = [
    ['wheel', aoRodar, CAPTURA],
    ['keydown', aoTeclar, { capture: true }],
    ['touchstart', aoTocar, CAPTURA],
    ['touchmove', aoArrastarDedo, CAPTURA],
    ['touchend', aoSoltarDedo, CAPTURA],
    ['touchcancel', aoSoltarDedo, CAPTURA],
    ['pointerdown', aoApertar, CAPTURA],
    ['pointermove', soltarBarra, CAPTURA],
    ['pointerup', soltarBarra, CAPTURA],
    ['pointercancel', soltarBarra, CAPTURA],
    ['scroll', aoRolar, { passive: true }],
  ];
  for (const [tipo, fn, op] of OUVINTES) addEventListener(tipo, fn, op);

  // A cada quadro, depois de lenis.raf.
  function quadro() {
    const y = scrollY;
    const agora = performance.now();
    const dt = Math.max(1, agora - tAnterior);
    const parada = (Math.abs(y - yConhecido) / dt) * 1000 < PARADA;
    yConhecido = y;
    tAnterior = agora;
    if (bloqueado()) { deslize = null; armado = false; origem = null; return; }
    if (deslizando()) return;
    deslize = null;
    if (!armado || emGesto() || !parada || agora - ultimaEntrada < IMA.espera) return;
    armado = false;
    const vh = vhDe(y, innerHeight);
    const alvo = alvoDoIma(linha, vh, { folga: IMA.folga, origem, limiar: IMA.limiar });
    if (alvo === null) { origem = vh; return; }
    const limite = Number.isFinite(lenis.limit) ? lenis.limit : Infinity;
    const px = Math.max(0, Math.min(limite, pxDe(alvo, innerHeight)));
    if (Math.abs(px - y) < 1) { origem = vh; return; }
    const marca = { ima: true };
    deslize = marca;
    lenis.scrollTo(px, {
      duration: duracaoDoIma(alvo - vh), easing: curvaDoIma, userData: marca,
      onComplete: () => { if (deslize === marca) { deslize = null; origem = alvo; } },
    });
    if (lenis.userData !== marca) deslize = null; // o Lenis recusou (parado) ou já estava lá
  }

  // Correção do resize (ou outra posição posta por main.js): não é entrada do visitante.
  function desarmar() {
    interromper();
    armado = false;
    origem = null;
    yConhecido = scrollY;
  }

  function encerrar() {
    interromper();
    armado = false;
    origem = null;
    for (const [tipo, fn, op] of OUVINTES) removeEventListener(tipo, fn, op);
  }

  return { quadro, desarmar, encerrar, get deslizando() { return deslizando(); } };
}
