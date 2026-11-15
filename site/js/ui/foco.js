// Clicado com o ponteiro (detail > 0; Enter e espaço dão 0), o controle não guarda o foco: senão a
// próxima tecla o tornaria :focus-visible, ou a barra de espaço iria para ele em vez da travessia.
// Pelo teclado o foco fica (e volta a ele quando a ampliação fecha).
export function soltarFocoDoPonteiro(e) {
  if (e.detail > 0) e.currentTarget?.blur?.();
}
