// Música de fundo: o estado (deve tocar? com que volume-alvo?) em contas puras, sem DOM.
// Quem toca é ui/som.js.
import { SOM } from '../config.js';

// Valor guardado em localStorage ('som') → 'ligado', 'desligado' ou null (sem escolha).
export function preferenciaLida(valor) {
  return valor === 'ligado' || valor === 'desligado' ? valor : null;
}

// carregado: o arquivo pode tocar; gesto: já houve o primeiro pointerdown ou keydown do
// visitante (antes disso o navegador não toca som); preferencia: a escolha guardada (ou null);
// oculta: a aba está oculta.
// → ligado: o que o botão mostra (sem escolha, o som está ligado: começa no primeiro gesto);
//   tocar: a música deve estar tocando; volume: o volume-alvo (0 = silêncio, e pausa).
export function estadoDoSom({ carregado, gesto, preferencia, oculta }) {
  const ligado = preferencia !== 'desligado';
  const tocar = Boolean(carregado && gesto && ligado && !oculta);
  return { ligado, tocar, volume: tocar ? SOM.volume : 0 };
}

// O clique no botão troca a escolha.
export const alternada = (preferencia) => (preferencia === 'desligado' ? 'ligado' : 'desligado');
