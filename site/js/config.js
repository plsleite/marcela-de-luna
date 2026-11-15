// Constantes do site. Sem dependências, sem DOM.
export const PILOTO_ULTIMA_PAGINA = 6;
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
// Ímã do scroll: sem entrada há `espera` ms (e com a página parada), a câmera desliza até o foco
// da parada mais próxima, em duracaoMin s até 20 vh de distância, crescendo até duracaoMax s em
// 80 vh ou mais; a menos de `folga` vh do foco, não faz nada.
export const IMA = { espera: 160, duracaoMin: 0.45, duracaoMax: 0.9, folga: 0.5 };
// Música de fundo: volume-alvo, subida no primeiro gesto (s) e transição do botão (s). O arquivo
// vem atenuado em 9 dB (no iOS o volume fica em 1), daí o alvo 0,6 em vez de ~0,22.
export const SOM = { volume: 0.6, subida: 3, troca: 0.6 };
// Pigmentos do pincel (paleta da artista, medida no acervo): azul, rosa neon, magenta, laranja.
// O primeiro é o padrão.
export const PIGMENTOS = ['#305fa3', '#e91b6a', '#d15ca1', '#f3953e'];
