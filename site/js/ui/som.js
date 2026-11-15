// Música de fundo (só na travessia): "O Cisne", de Saint-Saëns, em looping e volume baixo.
// Crédito da gravação: a informar pelo coordenador quando o arquivo for escolhido.
//
// O site abre em silêncio (os navegadores não tocam som antes de um gesto): no primeiro
// pointerdown ou keydown do visitante a música sobe de 0 a SOM.volume em SOM.entrada s. O arquivo
// só é pedido quando main.js chama carregar() (depois da abertura); se não carregar, não há botão
// e nada mais muda. O botão no canto superior direito liga e desliga (SOM.troca s) e a escolha
// fica em localStorage ('som'); a aba oculta pausa, e a volta retoma. Quem decide o estado é
// core/som.js. Tudo o que este módulo cria (áudio, botão, ouvintes, tweens) sai em encerrar().
import { gsap } from 'gsap';
import { SOM } from '../config.js';
import { estadoDoSom, preferenciaLida, alternada } from '../core/som.js';

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

  function atualizarBotao() {
    if (!botao) return;
    const { ligado } = estado();
    botao.setAttribute('aria-pressed', String(ligado));
    botao.setAttribute('aria-label', ligado ? 'Desligar o som' : 'Ligar o som');
    botao.classList.toggle('tocando', ligado && Boolean(audio) && !audio.paused);
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
    aplicar(SOM.entrada);
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
      preferencia = alternada(estado().ligado ? 'ligado' : 'desligado');
      gravarPreferencia(preferencia);
      gesto = true; // o clique é um gesto: ligar já toca
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
    aplicar(SOM.entrada);
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
