// Medição: a mesma tinta, com o tempo de pintar e das barreiras contado e os carimbos anotados.
import { criarTinta as original } from '/js/gl/tinta.js?original';

export function criarTinta(palco, opcoes = {}) {
  const M = window.__medir;
  const forca = opcoes.forca ?? (() => 1);
  const medida = M.cronometrar('barreiras', forca);
  const tinta = original(palco, { ...opcoes, forca: (x, y, meia) => { M.carimbo(x, y, meia); return medida(x, y, meia); } });
  tinta.pintar = M.cronometrar('tinta', tinta.pintar);
  return tinta;
}
