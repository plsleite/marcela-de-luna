// O que faz um clique numa tela da travessia. Sem DOM.
// parada: a parada da tela clicada ({ id, tipo }); emFoco: id da parada em foco (ou null);
// aberturaPronta: a abertura terminou; mergulhoAberto: já se está dentro de uma tela;
// viajando: uma viagem (irPara) está em andamento.
// → 'mergulho' (a tela da parada em foco amplia: obra, capa ou recorte de texto e de abertura),
//   'viagem' (tela ao longe, ou qualquer tela durante uma viagem) ou null (nada: antes do fim da
//   abertura ou dentro do mergulho).
const AMPLIAM = new Set(['obra', 'capa', 'texto', 'abertura']);
export function destinoDoClique({ parada, emFoco, aberturaPronta, mergulhoAberto, viajando }) {
  if (!parada || !aberturaPronta || mergulhoAberto) return null;
  if (!viajando && parada.id === emFoco) return AMPLIAM.has(parada.tipo) ? 'mergulho' : null;
  return 'viagem';
}
