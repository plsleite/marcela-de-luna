// Música de fundo: o estado (deve tocar? com que volume-alvo? o que o botão mostra? o que faz o
// clique nele?) em contas puras, sem DOM. Quem toca é ui/som.js.
import { SOM } from '../config.js';

// Valor guardado em localStorage ('som') → 'ligado', 'desligado' ou null (sem escolha).
export function preferenciaLida(valor) {
  return valor === 'ligado' || valor === 'desligado' ? valor : null;
}

// carregado: o arquivo pode tocar; gesto: já houve um pointerdown ou keydown que o navegador
// aceita para tocar som; preferencia: a escolha guardada (ou null: sem escolha, toca no primeiro
// gesto); oculta: a aba está oculta.
// → tocar: a música deve estar tocando; volume: o volume-alvo (0 = silêncio, e pausa).
export function estadoDoSom({ carregado, gesto, preferencia, oculta }) {
  const tocar = Boolean(carregado && gesto && preferencia !== 'desligado' && !oculta);
  return { tocar, volume: tocar ? SOM.volume : 0 };
}

// Clique no botão → a nova escolha (sempre gravada). Tocando, desliga. Sem tocar (desligado, ou
// ligado mas ainda sem gesto aceito), o clique é o gesto que faz tocar: nunca grava 'desligado'
// para quem clicou querendo ouvir.
export const cliqueNoBotao = ({ tocando }) => (tocando ? 'desligado' : 'ligado');

// O botão mostra o que se ouve: rótulo, aria-pressed e barras derivam de "está tocando".
export function botaoDoSom(tocando) {
  return tocando
    ? { rotulo: 'Desligar o som', pressionado: true, barras: 'tocando' }
    : { rotulo: 'Ligar o som', pressionado: false, barras: 'paradas' };
}

// Convite "LIGAR O SOM": enquanto a música ainda não tocou nesta visita (memória, não vai para o
// localStorage) e a escolha guardada não é 'desligado'.
export const convite = ({ escolha, tocou }) => escolha !== 'desligado' && !tocou;
