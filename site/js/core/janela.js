// Ids de imagem de uma parada: imagens (capa/detalhe/verso), telas (obra), planos (texto/abertura).
const idsDe = s => [...(s.imagens ?? []), ...(s.telas ?? []), ...(s.planos ?? []).map(p => p.imagem)];

export function texturasNecessarias(linha, stops, indice, antes = 1, depois = 3) {
  const ids = new Set();
  const de = Math.max(0, indice - antes);
  const ate = Math.min(stops.length - 1, indice + depois);
  for (let i = de; i <= ate; i++) idsDe(stops[i]).forEach(id => ids.add(id));
  return ids;
}

// Viagem longa: só as janelas da parada de partida e da de chegada (as do caminho não baixam).
export function janelaDeViagem(linha, stops, atual, destino) {
  const ids = texturasNecessarias(linha, stops, atual);
  for (const id of texturasNecessarias(linha, stops, destino)) ids.add(id);
  return ids;
}

// Menor largura que, com `tolerancia` de folga (ampliada até 8%), cobre a tela em px físicos.
export function larguraPara(larguraPx, dpr, larguras, tolerancia = 1.08) {
  const ord = [...larguras].sort((a, b) => a - b);
  const alvo = larguraPx * dpr;
  return ord.find(l => l * tolerancia >= alvo) ?? ord[ord.length - 1];
}

// Uma tela existe para o ponteiro, o realce e o pincel só entre `perto` (o surge[0] dela: mais
// perto, está transparente, rente à câmera) e `alcance` (o some[1]: mais longe, sumiu no branco).
export function aoAlcance(distancia, perto, alcance) {
  return distancia >= perto && distancia < alcance;
}

// Uma tela é desenhada (mesh.visible) só entre logo atrás da câmera (−1) e o `alcance`: além
// dele já sumiu no branco. Não confundir com aoAlcance, que decide ponteiro, realce e pincel.
export function naVista(distancia, alcance) {
  return distancia > -1 && distancia < alcance;
}

// Ordem da reserva (índices de parada): da atual até o fim, depois da atual para trás.
export function filaDeReserva(stops, atual) {
  const a = Math.min(Math.max(atual, 0), stops.length - 1);
  const ordem = [];
  for (let i = a; i < stops.length; i++) ordem.push(i);
  for (let i = a - 1; i >= 0; i--) ordem.push(i);
  return ordem;
}
