// Ids de imagem de uma parada: imagens (capa/detalhe/verso), telas (obra), planos (texto/abertura).
const idsDe = s => [...(s.imagens ?? []), ...(s.telas ?? []), ...(s.planos ?? []).map(p => p.imagem)];

export function texturasNecessarias(linha, stops, indice, antes = 1, depois = 3) {
  const ids = new Set();
  const de = Math.max(0, indice - antes);
  const ate = Math.min(stops.length - 1, indice + depois);
  for (let i = de; i <= ate; i++) idsDe(stops[i]).forEach(id => ids.add(id));
  return ids;
}

export function larguraPara(larguraPx, dpr, larguras) {
  const ord = [...larguras].sort((a, b) => a - b);
  const alvo = larguraPx * dpr;
  return ord.find(l => l >= alvo) ?? ord[ord.length - 1];
}

// Uma tela existe para o ponteiro, o realce e o pincel só entre `perto` (o surge[0] dela: mais
// perto, está transparente, rente à câmera) e `alcance` (o some[1]: mais longe, sumiu no branco).
export function aoAlcance(distancia, perto, alcance) {
  return distancia >= perto && distancia < alcance;
}
