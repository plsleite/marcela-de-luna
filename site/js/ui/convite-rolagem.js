// Convite de rolagem (só na travessia): no canto superior direito da capa, "ROLE PARA ENTRAR" com
// um traço fino que desce. Entra no fim da abertura, esconde-se ao rolar e volta sempre que o
// visitante retorna à capa; o clique viaja até a parada seguinte (irPara), como o clique no
// vulto. Quem decide é core/convite.js. O botão e o ouvinte saem em encerrar().
import { CONVITE, conviteVisivel } from '../core/convite.js';
import { vhDe } from '../core/rolagem.js';
import { soltarFocoDoPonteiro } from './foco.js';

export function criarConviteDeRolagem({ abertura, irPara }) {
  let aberturaFim = false;
  let encerrado = false;

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'convite-rolagem';
  botao.disabled = true; // escondido: fora do teclado e dos leitores de tela
  botao.dataset.barraTinta = ''; // o pincel não pinta sob o convite (travessia/pincel.js)
  const texto = document.createElement('span');
  texto.textContent = CONVITE.rotulo;
  const traco = document.createElement('span');
  traco.className = 'convite-rolagem-traco';
  traco.setAttribute('aria-hidden', 'true');
  botao.append(texto, traco);
  botao.addEventListener('click', (e) => { soltarFocoDoPonteiro(e); irPara(); });
  document.body.append(botao);

  function atualizar() {
    if (encerrado) return;
    const visivel = conviteVisivel({ vh: vhDe(scrollY, innerHeight), aberturaFim });
    botao.classList.toggle('visivel', visivel);
    botao.disabled = !visivel;
  }

  addEventListener('scroll', atualizar, { passive: true });
  abertura.then(() => { aberturaFim = true; atualizar(); }).catch(() => {}); // o erro da abertura é de main.js

  return {
    encerrar() {
      encerrado = true;
      removeEventListener('scroll', atualizar);
      botao.remove();
    },
  };
}
