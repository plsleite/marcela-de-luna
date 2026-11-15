// Constantes do site. Sem dependências, sem DOM.
export const PILOTO_ULTIMA_PAGINA = 6;
// Duração de cada tipo de parada, em vh de scroll.
export const DURACAO = { capa: 100, texto: 160, abertura: 140, obra: 100, detalhe: 45, verso: 100 };
export const UNIDADES_POR_VH = 0.14;
export const DIST_FOCO = 8;
export const FOV = 35;
export const RELEVO = 0.12;
// Distâncias (unidades de mundo, da câmera à tela) em que uma tela é visível: surge de
// transparente entre surge[0] e surge[1] (rente à câmera) e se dissolve no branco entre branco[0]
// e branco[1] (ao longe). Fora de [surge[0], branco[1]] não é clicável nem barra o pincel.
export const VISIBILIDADE = { surge: [1.5, 3.0], branco: [14, 28] };
// Pigmentos do pincel (paleta da artista, medida no acervo): azul, rosa neon, magenta, laranja.
// O primeiro é o padrão.
export const PIGMENTOS = ['#305fa3', '#e91b6a', '#d15ca1', '#f3953e'];
