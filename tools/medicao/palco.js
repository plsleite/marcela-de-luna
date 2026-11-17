// Medição: o mesmo palco, com o tempo do raio contra as telas (telaSob) contado.
import { criarPalco as original } from '/js/gl/palco.js?original';

export function criarPalco(canvas) {
  const palco = original(canvas);
  if (palco) palco.telaSob = window.__medir.cronometrar('raio', palco.telaSob);
  return palco;
}
