// Música de fundo (só na travessia): "O Cisne", de Saint-Saëns, em looping e volume baixo.
// Música: Camille Saint-Saëns, "Le Cygne" (O Carnaval dos Animais, 1886). Alisa Weilerstein (violoncelo) e Jason Yoder (piano), Casa Branca, 4/11/2009. Fonte: Wikimedia Commons, arquivo "20091104 Alisa Weilerstein and Jason Yoder - Saint Saëns' The Swan.ogg" (domínio público nos EUA como obra do governo federal; execução sob CC BY 3.0). Editado: silêncio inicial e aplausos cortados, convertido para MP3.
//
// O site abre em silêncio (os navegadores não tocam som antes de um gesto): no primeiro
// pointerdown ou keydown do visitante a música sobe de 0 a SOM.volume em SOM.subida s. O arquivo
// só é pedido quando main.js chama carregar() (depois da abertura); se não carregar, não há botão
// e nada mais muda. O botão no canto superior direito liga e desliga (SOM.troca s) e a escolha
// fica em localStorage ('som'); a aba oculta pausa, e a volta retoma. Quem decide o estado é
// core/som.js. Tudo o que este módulo cria (áudio, botão, ouvintes, tweens) sai em encerrar().
import { gsap } from 'gsap';
import { SOM } from '../config.js';
import { estadoDoSom, preferenciaLida, cliqueNoBotao, botaoDoSom } from '../core/som.js';

const ARQUIVO = './assets/audio/o-cisne.mp3';
const CHAVE = 'som';

function lerPreferencia() {
  try { return preferenciaLida(localStorage.getItem(CHAVE)); } catch { return null; }
}
function gravarPreferencia(valor) {
  try { localStorage.setItem(CHAVE, valor); } catch { /* armazenamento indisponível: vale só nesta visita */ }
}

export function criarSom() {
  let audio = null;
  let botao = null;
  let carregado = false;
  let gesto = false;
  let preferencia = lerPreferencia();
  let encerrado = false;
  const nivel = { v: 0 }; // volume exibido (o tween anda nele e copia para audio.volume)

  const estado = () => estadoDoSom({ carregado, gesto, preferencia, oculta: document.hidden });

  // Está tocando: deve tocar e o áudio de fato toca (não pausado). É o que o botão mostra.
  const tocando = () => estado().tocar && Boolean(audio) && !audio.paused;
  function atualizarBotao() {
    if (!botao) return;
    const b = botaoDoSom(tocando());
    botao.setAttribute('aria-pressed', String(b.pressionado));
    botao.setAttribute('aria-label', b.rotulo);
    botao.classList.toggle('tocando', b.barras === 'tocando');
  }

  function tocar() {
    const p = audio.play();
    p?.catch?.((erro) => {
      // o navegador recusou (sem gesto que valha): espera o próximo pointerdown ou keydown
      if (erro?.name === 'NotAllowedError') { gesto = false; atualizarBotao(); }
    });
  }

  // Leva o som ao estado de agora, em `duracao` s.
  function aplicar(duracao) {
    if (encerrado || !audio || !carregado) return;
    const e = estado();
    gsap.killTweensOf(nivel);
    if (e.tocar) {
      if (audio.paused) tocar();
      gsap.to(nivel, { v: e.volume, duration: duracao, ease: 'sine.inOut', onUpdate: () => { audio.volume = nivel.v; } });
    } else if (document.hidden) {
      audio.pause(); // aba oculta: pausa na hora; ao voltar, entra de novo do silêncio
      nivel.v = 0;
      audio.volume = 0;
    } else if (!audio.paused) {
      gsap.to(nivel, {
        v: 0, duration: duracao, ease: 'sine.inOut',
        onUpdate: () => { audio.volume = nivel.v; },
        onComplete: () => audio.pause(),
      });
    }
    atualizarBotao();
  }

  // Primeiro gesto do visitante (o do próprio botão conta como clique nele, não aqui).
  function aoGesto(e) {
    if (gesto || (botao && botao.contains(e.target))) return;
    gesto = true;
    aplicar(SOM.subida);
  }
  addEventListener('pointerdown', aoGesto, { capture: true, passive: true });
  addEventListener('keydown', aoGesto, { capture: true });

  const aoVisibilidade = () => aplicar(SOM.troca);
  document.addEventListener('visibilitychange', aoVisibilidade);

  function criarBotao() {
    botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'som';
    for (let i = 0; i < 3; i++) {
      const barra = document.createElement('span');
      barra.setAttribute('aria-hidden', 'true');
      botao.append(barra);
    }
    botao.addEventListener('click', (e) => {
      if (e.detail > 0) botao.blur(); // clicado com o ponteiro, não guarda o foco (como a fileira)
      preferencia = cliqueNoBotao({ preferencia, tocando: tocando() });
      gravarPreferencia(preferencia);
      gesto = true; // o clique é um gesto: se for para ligar, já toca
      aplicar(SOM.troca);
    });
    document.body.append(botao);
    atualizarBotao();
    requestAnimationFrame(() => botao?.classList.add('visivel'));
  }

  const aoPoderTocar = () => {
    if (encerrado || carregado) return;
    carregado = true;
    criarBotao();
    aplicar(SOM.subida);
  };
  const aoTrocarReproducao = () => atualizarBotao();

  // Pede o arquivo (main.js chama depois da abertura). Sem ele, nada aparece.
  function carregar() {
    if (encerrado || audio) return;
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audio.addEventListener('canplay', aoPoderTocar);
    audio.addEventListener('playing', aoTrocarReproducao);
    audio.addEventListener('pause', aoTrocarReproducao);
    audio.src = ARQUIVO;
  }

  function encerrar() {
    encerrado = true;
    removeEventListener('pointerdown', aoGesto, { capture: true, passive: true });
    removeEventListener('keydown', aoGesto, { capture: true });
    document.removeEventListener('visibilitychange', aoVisibilidade);
    gsap.killTweensOf(nivel);
    if (audio) {
      audio.removeEventListener('canplay', aoPoderTocar);
      audio.removeEventListener('playing', aoTrocarReproducao);
      audio.removeEventListener('pause', aoTrocarReproducao);
      audio.pause();
      audio.removeAttribute('src');
      audio.load(); // solta o download
      audio = null;
    }
    botao?.remove();
    botao = null;
  }

  return { carregar, encerrar };
}
