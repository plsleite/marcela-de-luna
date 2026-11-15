// Constantes do site. Sem dependências, sem DOM.
// Duração de cada tipo de parada, em vh de scroll.
export const DURACAO = { capa: 100, texto: 160, abertura: 140, obra: 100, detalhe: 45, verso: 100 };
export const UNIDADES_POR_VH = 0.14;
export const DIST_FOCO = 8;
export const FOV = 35;
export const RELEVO = 0.12;
// Distâncias (unidades de mundo, da câmera à tela) em que uma tela é visível: surge de
// transparente entre surge[0] e surge[1] (rente à câmera); ao longe embranquece entre branco[0] e
// branco[1] até virar um vulto que conserva `residuo` da pintura, e some (alfa 0) entre some[0] e
// some[1]. Com o ponteiro sobre um vulto, a brancura cai até `realce`. Fora de
// [surge[0], some[1]] a tela não é clicável nem barra o pincel.
export const VISIBILIDADE = { surge: [1.5, 3.0], branco: [10.5, 17], residuo: 0.08, some: [22, 28], realce: 0.63 };
// Closes (detalhe) e verso: altura das telas, afastamento lateral dos closes (alternam esquerda e
// direita) e alturas y que se repetem de três em três. Os closes são vistos de mais longe, então
// embranquecem e somem mais tarde; e, a 45 vh um do outro, o close anterior fica a 1,7 da câmera
// no foco do atual: o surge deles começa em 2,0, para esse não existir mais (os demais campos são
// os de VISIBILIDADE).
export const DETALHE = { altura: 6.2, x: 1.5, ys: [0.2, -0.25, 0.1] };
export const VERSO = { altura: 4.6 };
export const VISIBILIDADE_DETALHE = { ...VISIBILIDADE, surge: [2.0, 3.6], branco: [15, 24], some: [24, 30] };
// Ímã do scroll: sem entrada há `espera` ms (e com a página parada), a câmera desliza até o foco
// da parada mais próxima, em duracaoMin s até 20 vh de distância, crescendo até duracaoMax s em
// 80 vh ou mais; a menos de `folga` vh do foco, não faz nada.
export const IMA = { espera: 160, duracaoMin: 0.45, duracaoMax: 0.9, folga: 0.5 };
// Música de fundo: volume-alvo, subida no primeiro gesto (s) e transição do botão (s). O arquivo
// já é baixo (cerca de −25,6 LUFS) e no iOS o volume fica em 1; daí o alvo 0,6 em vez de ~0,22.
export const SOM = { volume: 0.6, subida: 3, troca: 0.6 };
// Pigmentos do pincel (paleta da artista, medida no acervo): azul, rosa neon, magenta, laranja.
// O primeiro é o padrão.
export const PIGMENTOS = ['#305fa3', '#e91b6a', '#d15ca1', '#f3953e'];
// Folga (unidades de mundo) do trilho da câmera abaixo da qual os textos das paradas valem.
export const TRILHO_FOLGA_TEXTO = 0.15;
