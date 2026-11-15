// Posição da legenda de uma obra (sem DOM): ao lado da própria tela, alinhada pela base, como
// uma etiqueta de museu (o vulto da tela seguinte fica na faixa central da altura e não chega lá).
// Tela à esquerda do centro → legenda à direita dela; à direita → à esquerda; duas telas → à
// direita da mais à direita, pela base do conjunto. Distância da borda da tela: 3,5% da largura
// da janela, mínimo de 32 px. Nunca sai da janela (margem de 24 px): isso prevalece.
const VAO = 0.035;  // fração da largura da janela
const VAO_MIN = 32; // px
const MARGEM = 24;  // px da legenda à borda da janela

// rets: retângulos das telas da parada ({ esq, dir, topo, base }, px); W, H: janela; lw, lh:
// tamanho da legenda. → { x, y } do canto superior esquerdo da legenda, em px.
export function posicaoDaLegenda({ rets, W, H, lw, lh }) {
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
  return { x: dentro(x, lw, W), y: dentro(y, lh, H) };
}
