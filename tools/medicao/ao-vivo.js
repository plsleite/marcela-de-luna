// Medição ao vivo (só na conferência): um painel no canto com os números do mouse de verdade,
// somados nos quadros em que o ponteiro se moveu (os últimos 5 s de movimento). Carregado por
// ao-vivo.html depois de medir.js. A tecla Z zera.
(() => {
  const M = window.__medir;
  const painel = document.createElement('pre');
  painel.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99999;margin:0;padding:10px 12px;'
    + 'background:rgba(20,20,20,.86);color:#fff;font:12px/1.5 ui-monospace,Menlo,monospace;pointer-events:none;border-radius:6px';
  addEventListener('DOMContentLoaded', () => document.body.append(painel));

  let quadros = [];  // só os quadros com movimento
  let q = null;      // o quadro que está juntando eventos
  let anterior = null, cursor = null, antes = null;
  const novo = () => ({ eventos: 0, posicoes: 0, idade: 0, idadeMax: 0, caminho: 0 });
  q = novo();
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const n = e.getCoalescedEvents?.().length || 1;
    const idade = performance.now() - e.timeStamp;
    q.eventos++; q.posicoes += n; q.idade += idade; q.idadeMax = Math.max(q.idadeMax, idade);
    if (cursor) q.caminho += Math.hypot(e.clientX - cursor.x, e.clientY - cursor.y);
    cursor = { x: e.clientX, y: e.clientY };
  }, { capture: true, passive: true });
  addEventListener('keydown', (e) => { if (e.key === 'z' || e.key === 'Z') quadros = []; });

  const media = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
  const n1 = (x) => x.toFixed(1).replace('.', ',');
  M.aoFimDoQuadro = (t) => {
    const intervalo = anterior === null ? 0 : t - anterior;
    anterior = t;
    const ms = M.tempos.tinta.ms + M.tempos.raio.ms + M.tempos.letras.ms;
    for (const k of Object.keys(M.tempos)) { M.tempos[k].ms = 0; M.tempos[k].n = 0; }
    if (q.eventos > 0 && antes) {
      const ponta = M.ponta;
      quadros.push({
        ...q, intervalo, ms,
        distancia: ponta && cursor ? Math.hypot(ponta.x - cursor.x, ponta.y - cursor.y) : null,
        velocidade: intervalo > 0 ? (q.caminho / intervalo) * 1000 : 0,
      });
      if (quadros.length > 300) quadros.shift();
    }
    antes = true;
    q = novo();
    if (!quadros.length) { painel.textContent = 'MEDIÇÃO DO PINCEL\nmexa o mouse depressa por uns 5 segundos'; return; }
    const col = (c) => quadros.map((x) => x[c]);
    const rapidos = quadros.filter((x) => x.velocidade > 1500 && x.distancia !== null);
    const vmax = Math.max(...col('velocidade'));
    const intervaloMedio = media(col('intervalo'));
    painel.textContent = [
      `MEDIÇÃO DO PINCEL (${quadros.length} quadros com movimento; Z zera)`,
      `intervalo entre quadros: média ${n1(intervaloMedio)} ms, pior ${n1(Math.max(...col('intervalo')))} ms`,
      `movimentos por quadro: média ${n1(media(col('eventos')))}, máx. ${Math.max(...col('eventos'))}`,
      `posições por quadro: média ${n1(media(col('posicoes')))}, máx. ${Math.max(...col('posicoes'))}`,
      `idade do movimento ao ser tratado: média ${n1(media(quadros.map((x) => x.idade / x.eventos)))} ms, pior ${n1(Math.max(...col('idadeMax')))} ms`,
      `tinta + raio + letras por quadro: média ${n1(media(col('ms')))} ms, pior ${n1(Math.max(...col('ms')))} ms`,
      rapidos.length
        ? `ponta do traço atrás do cursor (acima de 1.500 px/s): média ${n1(media(rapidos.map((x) => x.distancia)))} px, pior ${n1(Math.max(...rapidos.map((x) => x.distancia)))} px`
        : 'ponta do traço atrás do cursor: ainda sem movimento rápido',
      `velocidade máxima: ${Math.round(vmax)} px/s (um quadro de espera da tela = ${Math.round((vmax * intervaloMedio) / 1000)} px)`,
    ].join('\n');
  };
})();
