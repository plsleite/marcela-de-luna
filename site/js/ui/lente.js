// Lente da fileira (B9): em repouso a coluna fica contraída (passoEmRepouso, traços curtos); com o
// ponteiro na faixa da borda direita, ou uma marca com foco de teclado, as marcas perto dele crescem
// até o formato cheio e se afastam (core/navegacao.js, lente). A lente entra e sai em ENTRADA s.
// Sem refluxo a cada movimento: o leiaute da lista é o de repouso; cada marca recebe por variável
// CSS o deslocamento (--dy), a altura da área de clique (--alto), o meio do desenho (--meio) e o
// fator (--f). Em aparelho sem hover, nada de repouso nem lente: o formato cheio de sempre.
// Tudo o que cria (ouvintes) sai em encerrar().
import { FILEIRA } from '../config.js';
import { lente, limitesDasMarcas, passoEmRepouso } from '../core/navegacao.js';

const FAIXA = 72;       // px a partir da borda direita em que o ponteiro abre a lente
const ENTRADA = 0.25;   // s para a lente abrir ou fechar
const SEPARACAO = 12;   // px entre séries no passo cheio
const VARS = ['--dy', '--alto', '--meio', '--f'];

// nav, lista: a fileira (navegacao.js); botoes: as marcas, uma por <li>.
export function criarLente({ nav, lista, botoes }) {
  const semHover = matchMedia('(hover: none)');
  let cheio = 24, passo = 24;
  let centros = null;   // centros de repouso (px, origem no topo da lista), lidos do leiaute
  let topos = null;     // topo de cada <li> (mesma origem)
  let caixa = null;     // retângulo da lista em repouso (px de janela)
  let ys = null;        // centros atuais (com a lente), ou null em repouso
  let ponteiro = null;  // { x, y } do último movimento do mouse, ou null fora da janela
  let focada = -1;      // índice da marca com :focus-visible
  let cursor = null;    // y da lente (origem no topo da lista); fica na saída
  let progresso = 0;    // 0 a 1, linear no tempo
  let sujo = true;

  const contraida = () => !semHover.matches;

  // passoCheio: passoDaFileira (navegacao.js). Escreve o passo de repouso, a separação entre
  // séries na mesma proporção e quanto a lente aberta passa da coluna em cima e embaixo (--alem,
  // para a barreira da tinta cobrir a lente aberta).
  function medir(passoCheio) {
    cheio = passoCheio;
    passo = contraida() ? passoEmRepouso(cheio) : cheio;
    const alem = (cheio / passo - 1) * FILEIRA.raio * cheio / 2;
    nav.classList.toggle('contraida', contraida());
    nav.style.setProperty('--passo', `${passo.toFixed(2)}px`);
    nav.style.setProperty('--sep', `${(SEPARACAO * passo / cheio).toFixed(2)}px`);
    nav.style.setProperty('--alem', `${alem.toFixed(2)}px`);
    centros = topos = caixa = null;
    progresso = 0;
    soltar();
  }
  // Centros de repouso e caixa da lista: leitura de leiaute só depois de medir. Pelos retângulos,
  // não por offsetTop (inteiro): com passos fracionários, o arredondamento abriria frestas.
  function ler() {
    caixa = lista.getBoundingClientRect();
    const rs = botoes.map((b) => b.parentElement.getBoundingClientRect());
    topos = rs.map((r) => r.top - caixa.top);
    centros = rs.map((r) => r.top + r.height / 2 - caixa.top);
  }

  // Volta ao leiaute de repouso: tira as variáveis de cada marca.
  function soltar() {
    if (!ys) return;
    for (const b of botoes) for (const v of VARS) b.style.removeProperty(v);
    nav.classList.remove('lente-ativa');
    ys = null;
  }

  function naFaixa() {
    if (!ponteiro || ponteiro.x < innerWidth - FAIXA) return false;
    const R = FILEIRA.raio * cheio;
    return ponteiro.y >= caixa.top - R && ponteiro.y <= caixa.bottom + R;
  }

  // dt em ms; oculta: a fileira está escondida (abertura, mergulho): a lente não reage.
  // Devolve true se as marcas mudaram de lugar neste quadro.
  function quadro(dt, oculta) {
    if (!contraida()) return false;
    if (!centros) ler();
    let alvo = null;
    if (!oculta) {
      if (naFaixa()) alvo = ponteiro.y - caixa.top;
      else if (focada >= 0) alvo = centros[focada];
    }
    const antes = progresso;
    if (alvo !== null) {
      if (alvo !== cursor) { cursor = alvo; sujo = true; }
      progresso = Math.min(1, progresso + dt / 1000 / ENTRADA);
    } else {
      progresso = Math.max(0, progresso - dt / 1000 / ENTRADA);
    }
    if (progresso !== antes) sujo = true;
    if (!sujo) return false;
    sujo = false;
    if (progresso === 0 || cursor === null) { const mudou = Boolean(ys); soltar(); return mudou; }
    const ganho = progresso * progresso * (3 - 2 * progresso); // suave nas pontas
    const marcas = lente(centros, cursor, { passo, passoCheio: cheio, raio: FILEIRA.raio, ganho });
    ys = marcas.map((m) => m.y);
    const limites = limitesDasMarcas(ys, passo);
    nav.classList.add('lente-ativa');
    botoes.forEach((b, i) => {
      const { topo, base } = limites[i];
      const s = b.style;
      s.setProperty('--dy', `${(topo - topos[i]).toFixed(2)}px`); // do topo do <li>
      s.setProperty('--alto', `${(base - topo).toFixed(2)}px`);
      s.setProperty('--meio', `${(ys[i] - topo).toFixed(2)}px`);
      s.setProperty('--f', marcas[i].fator.toFixed(3));
    });
    return true;
  }

  // Centro atual da marca i, com origem no topo da lista (para o título).
  function meio(i) {
    if (ys) return ys[i];
    const r = botoes[i].parentElement.getBoundingClientRect();
    return r.top + r.height / 2 - lista.getBoundingClientRect().top;
  }

  const aoMover = (e) => {
    if (e.pointerType === 'touch') return;
    ponteiro = { x: e.clientX, y: e.clientY };
    sujo = true;
  };
  const aoSair = (e) => { if (!e.relatedTarget) { ponteiro = null; sujo = true; } };
  const aoFocar = (e) => {
    const i = botoes.indexOf(e.target);
    focada = i >= 0 && e.target.matches(':focus-visible') ? i : -1;
    sujo = true;
  };
  const aoDesfocar = () => { focada = -1; sujo = true; };
  const aoTrocarHover = () => medir(cheio);
  addEventListener('pointermove', aoMover, { passive: true });
  document.addEventListener('pointerout', aoSair);
  lista.addEventListener('focusin', aoFocar);
  lista.addEventListener('focusout', aoDesfocar);
  semHover.addEventListener('change', aoTrocarHover);

  function encerrar() {
    removeEventListener('pointermove', aoMover);
    document.removeEventListener('pointerout', aoSair);
    lista.removeEventListener('focusin', aoFocar);
    lista.removeEventListener('focusout', aoDesfocar);
    semHover.removeEventListener('change', aoTrocarHover);
  }

  return { medir, quadro, meio, encerrar };
}
