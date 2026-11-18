// Convite de rolagem da capa ("ROLE PARA ENTRAR"): quando aparece. Sem DOM.
export const CONVITE = { rotulo: 'ROLE PARA ENTRAR', limiar: 3 }; // limiar: vh de rolagem a partir dos quais se esconde

// Visível só com a capa em repouso (a menos de `limiar` vh do topo) e a abertura terminada:
// esconde-se ao rolar e volta sempre que o visitante retorna à capa. `vh`: posição de leitura.
export const conviteVisivel = ({ vh, aberturaFim }) => aberturaFim && vh < CONVITE.limiar;
