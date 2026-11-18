// Convite de rolagem da capa ("ROLE PARA ENTRAR"): quando aparece e quando some. Sem DOM.
// Estados: 'espera' (a abertura ainda roda), 'visivel' e 'dispensado' (definitivo nesta visita:
// não volta ao retornar à capa).
export const CONVITE = { rotulo: 'ROLE PARA ENTRAR', limiar: 3 }; // limiar: vh de rolagem que o dispensam

// `vh`: posição de leitura; `aberturaFim`: a abertura terminou. Qualquer rolagem a partir do
// limiar (a mão do visitante, uma viagem, a página restaurada fora da capa) dispensa de vez.
export function estadoDoConvite(estado, { vh, aberturaFim }) {
  if (estado === 'dispensado' || vh >= CONVITE.limiar) return 'dispensado';
  return aberturaFim ? 'visivel' : 'espera';
}
