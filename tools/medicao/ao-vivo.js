// Medição ao vivo (só na conferência): um painel no canto com os números do mouse de verdade,
// somados nos quadros em que o ponteiro se moveu (os últimos 5 s de movimento). Carregado por
// ao-vivo.html depois de medir.js. A tecla Z zera. As teclas M (mouse) e T (trackpad) gravam 6 s
// do gesto, posição a posição e quadro a quadro, e baixam um arquivo pincel-….json.
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
  // Gravação: cada movimento [instante em que foi tratado, e as posições [instante, x, y]] e
  // cada quadro [instante, x e y da ponta do traço, carimbos do quadro].
  const GRAVA_MS = 6000;
  let gravacao = null;
  function gravar(aparelho) {
    gravacao = { aparelho, inicio: performance.now(), movimentos: [], quadros: [] };
  }
  function baixar() {
    const g = gravacao;
    gravacao = null;
    const navegador = /Chrome\//.test(navigator.userAgent) ? 'chrome' : /Safari\//.test(navigator.userAgent) ? 'safari' : 'outro';
    const dados = { aparelho: g.aparelho, navegador, janela: [innerWidth, innerHeight, devicePixelRatio], movimentos: g.movimentos, quadros: g.quadros };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dados)], { type: 'application/json' }));
    a.download = `pincel-${g.aparelho}-${navegador}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
  const r2 = (x) => Math.round(x * 100) / 100;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const agrupados = e.getCoalescedEvents?.() ?? [];
    if (gravacao) {
      gravacao.movimentos.push([r2(performance.now() - gravacao.inicio),
        (agrupados.length ? agrupados : [e]).map((c) => [r2(c.timeStamp - gravacao.inicio), c.clientX, c.clientY])]);
    }
    const n = agrupados.length || 1;
    const idade = performance.now() - e.timeStamp;
    q.eventos++; q.posicoes += n; q.idade += idade; q.idadeMax = Math.max(q.idadeMax, idade);
    if (cursor) q.caminho += Math.hypot(e.clientX - cursor.x, e.clientY - cursor.y);
    cursor = { x: e.clientX, y: e.clientY };
  }, { capture: true, passive: true });
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'z') quadros = [];
    if (!gravacao && (k === 'm' || k === 't')) gravar(k === 'm' ? 'mouse' : 'trackpad');
  });

  const media = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
  const n1 = (x) => x.toFixed(1).replace('.', ',');
  M.aoFimDoQuadro = (t) => {
    const intervalo = anterior === null ? 0 : t - anterior;
    anterior = t;
    const ms = M.tempos.tinta.ms + M.tempos.raio.ms + M.tempos.letras.ms;
    if (gravacao) {
      const p = M.ponta;
      gravacao.quadros.push([r2(t - gravacao.inicio), p ? r2(p.x) : null, p ? r2(p.y) : null, M.tempos.barreiras.n]);
      if (t - gravacao.inicio > GRAVA_MS) baixar();
    }
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
    const aviso = gravacao
      ? `\nGRAVANDO ${gravacao.aparelho.toUpperCase()}: faltam ${Math.ceil((GRAVA_MS - (t - gravacao.inicio)) / 1000)} s`
      : '\nM grava 6 s com o mouse; T, com o trackpad';
    if (!quadros.length) { painel.textContent = `MEDIÇÃO DO PINCEL\nmexa o mouse depressa por uns 5 segundos${aviso}`; return; }
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
    ].join('\n') + aviso;
  };
})();
