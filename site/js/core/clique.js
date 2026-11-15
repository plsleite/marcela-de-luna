// O que faz um clique numa tela da travessia. Sem DOM.
// parada: a parada da tela clicada ({ id, tipo }); emFoco: id da parada em foco (ou null);
// aberturaPronta: a abertura terminou; mergulhoAberto: já se está dentro de uma tela;
// viajando: uma viagem (irPara) está em andamento.
// → 'mergulho' (só obra em foco), 'viagem' (tela ao longe, ou qualquer tela durante uma viagem)
//   ou null (nada: antes da abertura, dentro do mergulho, ou capa e recortes de texto em foco).
export function destinoDoClique({ parada, emFoco, aberturaPronta, mergulhoAberto, viajando }) {
  if (!parada || !aberturaPronta || mergulhoAberto) return null;
  if (!viajando && parada.id === emFoco) return parada.tipo === 'obra' ? 'mergulho' : null;
  return 'viagem';
}
