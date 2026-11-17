// Medição: o mesmo preenchimento das letras, com o tempo de tocar contado.
import { criarPreenchimento as original } from '/js/ui/preenchimento.js?original';
export * from '/js/ui/preenchimento.js?original';

export function criarPreenchimento(raiz) {
  const p = original(raiz);
  p.tocar = window.__medir.cronometrar('letras', p.tocar);
  return p;
}
