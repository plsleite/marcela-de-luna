// Posição de leitura em vh (a página da travessia é medida em vh): a mesma parada em qualquer
// altura de janela. Sem DOM.
export function vhDe(y, alturaJanela) {
  const vh = (y / alturaJanela) * 100;
  return Number.isFinite(vh) ? vh : 0;
}
export const pxDe = (vh, alturaJanela) => (vh / 100) * alturaJanela;

// salvo: { vh, travessia } do sessionStorage (ou null). Devolve o y em px a restaurar na altura
// atual, ou null (nada salvo, outro modo, topo, formato desconhecido).
export function posicaoRestaurada(salvo, travessia, alturaJanela) {
  if (!salvo || salvo.travessia !== travessia) return null;
  const { vh } = salvo;
  if (typeof vh !== 'number' || !Number.isFinite(vh) || vh <= 0) return null;
  return pxDe(vh, alturaJanela);
}
