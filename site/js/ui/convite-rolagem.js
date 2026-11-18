// Convite de rolagem (só na travessia): no canto superior direito da capa, "ROLE PARA ENTRAR" com
// um traço fino que desce. Entra no fim da abertura e some de vez na primeira rolagem; o clique
// viaja até a parada seguinte (irPara), como o clique no vulto. Quem decide é core/convite.js.
// Tudo o que este módulo cria (botão, ouvinte, temporizador) sai em encerrar().
import { CONVITE, estadoDoConvite } from '../core/convite.js';
import { vhDe } from '../core/rolagem.js';
import { soltarFocoDoPonteiro } from './foco.js';

const SAIDA = 700; // ms: a transição de opacidade do CSS, antes de tirar o botão da página

export function criarConviteDeRolagem({ abertura, irPara }) {
  let estado = 'espera';
  let aberturaFim = false;
  let botao = null;
  let saida = 0;
  let encerrado = false;

  function criarBotao() {
    botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'convite-rolagem';
    botao.dataset.barraTinta = ''; // o pincel não pinta sob o convite (travessia/pincel.js)
    const texto = document.createElement('span');
    texto.textContent = CONVITE.rotulo;
    const traco = document.createElement('span');
    traco.className = 'convite-rolagem-traco';
    traco.setAttribute('aria-hidden', 'true');
    botao.append(texto, traco);
    botao.addEventListener('click', (e) => { soltarFocoDoPonteiro(e); irPara(); });
    document.body.append(botao);
    requestAnimationFrame(() => botao?.classList.add('visivel'));
  }

  function tirarBotao() {
    if (!botao) return;
    const b = botao;
    botao = null;
    b.classList.remove('visivel');
    b.disabled = true;
    saida = setTimeout(() => b.remove(), SAIDA);
    aoEncerrar = () => { clearTimeout(saida); b.remove(); };
  }
  let aoEncerrar = () => {};

  function atualizar() {
    if (encerrado || estado === 'dispensado') return;
    const novo = estadoDoConvite(estado, { vh: vhDe(scrollY, innerHeight), aberturaFim });
    if (novo === estado) return;
    estado = novo;
    if (estado === 'visivel') criarBotao();
    else if (estado === 'dispensado') { tirarBotao(); removeEventListener('scroll', atualizar); }
  }

  addEventListener('scroll', atualizar, { passive: true });
  atualizar(); // a página restaurada fora da capa já nasce dispensada
  abertura.then(() => { aberturaFim = true; atualizar(); }).catch(() => {}); // o erro da abertura é de main.js

  return {
    encerrar() {
      encerrado = true;
      removeEventListener('scroll', atualizar);
      botao?.remove();
      botao = null;
      aoEncerrar();
    },
  };
}
