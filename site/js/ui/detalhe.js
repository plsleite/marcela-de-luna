// Zoom e arrasto do close aberto pela marca (a img de .mergulho-detalhe), com os limites da tela
// ampliada (core/mergulho.js). Os eventos chegam de mergulho-ui.js, que só cria esta vista com a
// entrada terminada: daí em diante o transform da img (x, y, scale, pelo gsap) é daqui, até
// encerrar(); o recolhimento parte de onde ela estiver. Cursor: classes na caixa (travessia.css).
import { gsap } from 'gsap';
import { encaixeDaImagem, vistaDaImagem, zoomNaImagem, arrastarImagem, ZOOM_MIN } from '../core/mergulho.js';

const SEGUE = 0.25; // s: a imagem exibida alcança a pedida (zoom e arrasto suaves, como na tela)

export function criarVistaDoDetalhe(caixa, img, info) {
  let vista = { zoom: ZOOM_MIN, cx: 0.5, cy: 0.5 };
  // a caixa, não innerWidth: com barra de rolagem clássica ela é mais estreita que a janela
  const encaixe = () => encaixeDaImagem(info.w, info.h, caixa.clientWidth, caixa.clientHeight);
  function mostrar(duracao = SEGUE) {
    gsap.to(img, { ...vistaDaImagem(vista, encaixe()), duration: duracao, ease: 'power2.out', overwrite: true });
    caixa.classList.toggle('ampliado', vista.zoom > ZOOM_MIN);
  }
  // A janela mudou: a vista volta para dentro dos limites novos, sem animação.
  function aoRedimensionar() { vista = arrastarImagem(vista, 0, 0, encaixe()); mostrar(0); }
  addEventListener('resize', aoRedimensionar);

  return {
    get zoom() { return vista.zoom; },
    // Multiplica o zoom por `fator`, com o ponto sob (px, py) parado.
    aproximar(fator, px, py) { vista = zoomNaImagem(vista, fator, px, py, encaixe()); mostrar(); },
    mover(dx, dy) { vista = arrastarImagem(vista, dx, dy, encaixe()); mostrar(); },
    puxando(sim) { caixa.classList.toggle('puxando', sim); },
    encerrar() {
      removeEventListener('resize', aoRedimensionar);
      gsap.killTweensOf(img);
      caixa.classList.remove('ampliado', 'puxando');
    },
  };
}
