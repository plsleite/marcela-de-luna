// Ímã do scroll (só na travessia): quando o visitante para de rolar (nenhuma entrada há
// IMA.espera ms e a página parada), a câmera desliza até o foco da parada mais próxima, por
// lenis.scrollTo: o scroll continua o nativo. Qualquer entrada (roda, toque, tecla, barra de
// rolagem) interrompe o deslize na hora, sem impulso herdado e sem conter nada: a página fica
// onde está e o Lenis segue com o gesto. O ímã só age depois de uma entrada do visitante
// (nunca sozinho na carga, depois de restaurar a posição, nem depois de corrigir o resize) e
// nunca enquanto `bloqueado()` (abertura, tela ampliada ou a volta dela, viagem de navegação).
// Tudo o que este módulo cria (ouvintes) sai em encerrar().
import { IMA } from '../config.js';
import { alvoDoIma, duracaoDoIma, curvaDoIma } from '../core/ima.js';
import { vhDe, pxDe } from '../core/rolagem.js';

const CAPTURA = { capture: true, passive: true };
const DESVIO = 2; // px entre a página e o deslize do Lenis: a partir disto, alguém mexeu na barra
// px/s: abaixo disto a página está parada (o fim do amortecimento da roda, a menos de ~5 px do
// alvo, já conta; o deslize parte da posição e substitui esse resto sem salto)
const PARADA = 30;

export function criarIma({ linha, lenis, bloqueado }) {
  let armado = false;            // houve entrada do visitante desde a última vez que o ímã agiu
  let ultimaEntrada = -Infinity; // performance.now() da última entrada
  let naBarra = false;           // botão apertado sobre a barra de rolagem
  let yConhecido = scrollY;      // scrollY no último quadro (ou na última correção)
  let tAnterior = performance.now();
  let deslize = null;            // userData do deslize em curso (identidade)
  const meu = () => deslize !== null && lenis.userData === deslize;
  const deslizando = () => meu() && lenis.isScrolling === 'smooth';

  // Para o deslize onde a página está (reset do Lenis: sem velocidade nem alvo herdados).
  function interromper() {
    if (deslizando()) lenis.reset();
    deslize = null;
  }
  function entrada() {
    interromper();
    armado = true;
    ultimaEntrada = performance.now();
  }

  // Na captura da janela: chega antes do Lenis (roda) e da navegação (teclas), então o deslize
  // já parou quando eles agem; a roda parte da posição atual.
  const aoEntrar = () => entrada();
  function aoApertar(e) {
    // a barra de rolagem (fora do conteúdo) não emite pointerup confiável: solta no próximo movimento sem botão
    if (e.clientX >= document.documentElement.clientWidth) { naBarra = true; entrada(); }
  }
  function aoMover(e) { if (naBarra && e.buttons === 0) naBarra = false; }
  const aoSoltar = () => { naBarra = false; };
  // Scroll nativo que não veio do Lenis nem de uma correção nossa: barra de rolagem, toque.
  function aoRolar() {
    const y = scrollY;
    if (meu()) {
      if (Math.abs(y - lenis.animatedScroll) > DESVIO) entrada(); // a barra no meio do deslize
      return;
    }
    if (lenis.isScrolling === 'native' && Math.abs(y - yConhecido) >= 1) entrada();
  }
  addEventListener('wheel', aoEntrar, CAPTURA);
  addEventListener('touchstart', aoEntrar, CAPTURA);
  addEventListener('touchmove', aoEntrar, CAPTURA);
  addEventListener('keydown', aoEntrar, { capture: true });
  addEventListener('pointerdown', aoApertar, CAPTURA);
  addEventListener('pointermove', aoMover, { passive: true });
  addEventListener('pointerup', aoSoltar, { passive: true });
  addEventListener('scroll', aoRolar, { passive: true });

  // A cada quadro, depois de lenis.raf.
  function quadro() {
    const y = scrollY;
    const agora = performance.now();
    const dt = Math.max(1, agora - tAnterior);
    const parada = (Math.abs(y - yConhecido) / dt) * 1000 < PARADA;
    yConhecido = y;
    tAnterior = agora;
    if (bloqueado()) { deslize = null; armado = false; return; }
    if (deslizando()) return;
    deslize = null;
    if (!armado || naBarra || !parada || agora - ultimaEntrada < IMA.espera) return;
    armado = false;
    const vh = vhDe(y, innerHeight);
    const alvo = alvoDoIma(linha, vh, IMA.folga);
    if (alvo === null) return;
    const limite = Number.isFinite(lenis.limit) ? lenis.limit : Infinity;
    const px = Math.max(0, Math.min(limite, pxDe(alvo, innerHeight)));
    if (Math.abs(px - y) < 1) return;
    const marca = { ima: true };
    deslize = marca;
    lenis.scrollTo(px, {
      duration: duracaoDoIma(alvo - vh), easing: curvaDoIma, userData: marca,
      onComplete: () => { if (deslize === marca) deslize = null; },
    });
    if (lenis.userData !== marca) deslize = null; // o Lenis recusou (parado) ou já estava lá
  }

  // Correção do resize (ou outra posição posta por main.js): não é entrada do visitante.
  function desarmar() {
    interromper();
    armado = false;
    yConhecido = scrollY;
  }

  function encerrar() {
    interromper();
    armado = false;
    removeEventListener('wheel', aoEntrar, CAPTURA);
    removeEventListener('touchstart', aoEntrar, CAPTURA);
    removeEventListener('touchmove', aoEntrar, CAPTURA);
    removeEventListener('keydown', aoEntrar, { capture: true });
    removeEventListener('pointerdown', aoApertar, CAPTURA);
    removeEventListener('pointermove', aoMover, { passive: true });
    removeEventListener('pointerup', aoSoltar, { passive: true });
    removeEventListener('scroll', aoRolar, { passive: true });
  }

  return { quadro, desarmar, encerrar, get deslizando() { return deslizando(); } };
}
