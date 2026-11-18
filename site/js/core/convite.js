// Convite de rolagem da capa ("ROLE PARA ENTRAR"): quando aparece. Sem DOM.
// `teclado`: a segunda linha, mais clara, só onde há ponteiro (num aparelho de toque não há teclado).
// `limiar`: vh de rolagem a partir dos quais se esconde.
export const CONVITE = { rotulo: 'ROLE PARA ENTRAR', teclado: 'OU USE AS TECLAS ↑ ↓', limiar: 3 };

// Visível só com a capa em repouso (a menos de `limiar` vh do topo) e a abertura terminada:
// esconde-se ao rolar e volta sempre que o visitante retorna à capa. `vh`: posição de leitura.
export const conviteVisivel = ({ vh, aberturaFim }) => aberturaFim && vh < CONVITE.limiar;
