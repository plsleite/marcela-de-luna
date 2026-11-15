// Posição da legenda de uma obra (sem DOM): ao lado da própria tela, alinhada pela base, como
// uma etiqueta de museu (o vulto da tela seguinte fica na faixa central da altura e não chega lá).
// Tela à esquerda do centro → legenda à direita dela; à direita → à esquerda; duas telas → à
// direita da mais à direita, pela base do conjunto. Distância da borda da tela: 3,5% da largura
// da janela, mínimo de 32 px. Nunca sai da janela (margem de 24 px): isso prevalece.
const VAO = 0.035;  // fração da largura da janela
const VAO_MIN = 32; // px
const MARGEM = 24;  // px da legenda à borda da janela
const FOLGA = 12;   // px entre a legenda e uma tela que ela evita

// rets: retângulos das telas da parada ({ esq, dir, topo, base }, px); W, H: janela; lw, lh:
// tamanho da legenda; evitar: telas que a legenda não deve cobrir (o vulto da parada seguinte, vista
// do foco desta): se a cobre, a legenda desce até folgar embaixo dela ou se afasta da própria tela,
// o que deslocar menos. → { x, y } do canto superior esquerdo da legenda, em px.
export function posicaoDaLegenda({ rets, W, H, lw, lh, evitar = [] }) {
  const u = {
    esq: Math.min(...rets.map((r) => r.esq)), dir: Math.max(...rets.map((r) => r.dir)),
    base: Math.max(...rets.map((r) => r.base)),
  };
  const vao = Math.max(VAO_MIN, VAO * W);
  const aDireita = rets.length > 1 || (u.esq + u.dir) / 2 < W / 2;
  const x = aDireita ? u.dir + vao : u.esq - vao - lw;
  const y = u.base - lh;
  const dentro = (v, tamanho, janela) => (tamanho + 2 * MARGEM > janela
    ? MARGEM : Math.max(MARGEM, Math.min(janela - MARGEM - tamanho, v)));
  let p = { x: dentro(x, lw, W), y: dentro(y, lh, H) };
  const cobre = (r) => p.x < r.dir && p.x + lw > r.esq && p.y < r.base && p.y + lh > r.topo;
  for (let i = 0; i <= evitar.length; i++) {
    const r = evitar.find(cobre);
    if (!r) break;
    const descer = { x: p.x, y: r.base + FOLGA };
    const afastar = { x: dentro(aDireita ? r.dir + FOLGA : r.esq - FOLGA - lw, lw, W), y: p.y };
    const cabe = descer.y + lh <= H - MARGEM;
    const custo = (q) => Math.abs(q.x - p.x) + Math.abs(q.y - p.y);
    p = cabe && custo(descer) <= custo(afastar) ? descer : afastar;
  }
  return p;
}

// Tela da obra que a linha "DETALHES" da legenda amplia: a que tem close ligado (a primeira, se
// as duas tiverem). Closes sem imagem no acervo não contam (a ampliação também os ignora).
// → índice da tela, ou null se a obra não tem close.
export function telaDoDestaque(closes, images) {
  const telas = (closes ?? []).filter((c) => images[c.imagem]).map((c) => c.tela);
  return telas.length ? Math.min(...telas) : null;
}
