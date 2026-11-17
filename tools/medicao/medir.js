// Medição do pincel (só na conferência; não vai para o site): relógio controlado, quadros
// rodados à mão e movimentos de mouse simulados. Carregado por medir.html antes dos módulos
// (ver tools/medir-pincel.sh). Uso, no console: await __medir.rodar({ taxa: 1000, agrupar: true,
// rotulo: 'antes' }) e depois await __medir.comparar('antes:…', 'depois:…').
(() => {
  const real = performance.now.bind(performance);
  const rafReal = window.requestAnimationFrame.bind(window);
  const dataBase = Date.now() - real();
  let virtual = false, tv = 0, desvio = 0;
  const agora = () => (virtual ? tv : real() + desvio);
  performance.now = agora;
  Date.now = () => Math.round(dataBase + agora());

  // Os pedidos de quadro passam por aqui: fora da medição seguem para o navegador; durante,
  // ficam na fila e a medição os chama no instante que ela escolhe.
  let fila = new Map(), prox = 1, pedido = false;
  function rodarFila(t) {
    const cbs = [...fila.values()];
    fila.clear();
    for (const cb of cbs) cb(t);
  }
  function agendar() {
    if (pedido) return;
    pedido = true;
    rafReal(() => { pedido = false; if (!virtual) { const t = agora(); rodarFila(t); api.aoFimDoQuadro?.(t); } });
  }
  window.requestAnimationFrame = (cb) => { const id = prox++; fila.set(id, cb); if (!virtual) agendar(); return id; };
  window.cancelAnimationFrame = (id) => { fila.delete(id); };

  // Tempo acumulado por trabalho (ms reais) e número de chamadas.
  const NOMES = ['tinta', 'barreiras', 'raio', 'letras'];
  const ac = Object.fromEntries(NOMES.map((n) => [n, { ms: 0, n: 0 }]));
  function cronometrar(nome, fn) {
    return function cronometrada(...args) {
      const t0 = real();
      try { return fn.apply(this, args); } finally { ac[nome].ms += real() - t0; ac[nome].n++; }
    };
  }
  const carimbos = []; // x, y, meia largura de cada carimbo, na ordem
  let ponta = null;    // último carimbo
  function carimbo(x, y, meia) { carimbos.push(x, y, meia); ponta = { x, y }; }

  // Trajeto rápido e curvo (px de janela, inteiros como os de um mouse), s em segundos.
  function posicao(s) {
    const x = innerWidth / 2 + 0.36 * innerWidth * Math.sin(2 * Math.PI * 0.9 * s);
    const y = innerHeight / 2 + 0.34 * innerHeight * Math.sin(2 * Math.PI * 1.35 * s + 0.6);
    return { x: Math.round(x), y: Math.round(y) };
  }
  function evento(p, t) {
    const e = new PointerEvent('pointermove', {
      bubbles: true, composed: true, view: window, pointerType: 'mouse', pointerId: 1, isPrimary: true,
      clientX: p.x, clientY: p.y, screenX: p.x, screenY: p.y,
    });
    Object.defineProperty(e, 'timeStamp', { value: t });
    return e;
  }

  function banco() {
    return new Promise((ok, falha) => {
      const r = indexedDB.open('medir-pincel', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('capturas');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => falha(r.error);
    });
  }
  async function guardar(chave, valor) {
    const db = await banco();
    await new Promise((ok, falha) => {
      const tx = db.transaction('capturas', 'readwrite');
      tx.objectStore('capturas').put(valor, chave);
      tx.oncomplete = ok; tx.onerror = () => falha(tx.error);
    });
    db.close();
  }
  async function ler(chave) {
    const db = await banco();
    const v = await new Promise((ok, falha) => {
      const r = db.transaction('capturas').objectStore('capturas').get(chave);
      r.onsuccess = () => ok(r.result); r.onerror = () => falha(r.error);
    });
    db.close();
    return v;
  }
  function pixels() {
    const cv = document.getElementById('gl');
    const gl = cv.getContext('webgl2') ?? cv.getContext('webgl');
    const px = new Uint8Array(cv.width * cv.height * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, cv.width, cv.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return { w: cv.width, h: cv.height, px };
  }

  const media = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
  const r3 = (x) => Math.round(x * 1000) / 1000;

  // taxa: posições por segundo; agrupar: true entrega um evento por quadro com as posições em
  // getCoalescedEvents (Chrome), false entrega um evento por posição; quadros de movimento a
  // 60 por segundo e depois `parado` quadros com o mouse quieto (o traço fecha até o cursor).
  // relogioMs: arredonda o instante de cada evento (1 imita o Safari, que só informa ms inteiros).
  async function rodar({ taxa, agrupar, quadros = 180, parado = 12, rotulo = 'x', capturar = true, relogioMs = 0 }) {
    const DT = 1000 / 60;
    const chave = `${rotulo}:${taxa}:${agrupar ? 'agrupado' : 'solto'}${relogioMs ? `:relogio${relogioMs}` : ''}`;
    const porQuadro = [];
    const capturas = {};
    carimbos.length = 0; ponta = null;
    virtual = true;
    const T0 = (tv = real() + desvio);
    let j = 1, ultima = null;
    for (let k = 1; k <= quadros + parado; k++) {
      const evs = [];
      if (k <= quadros) {
        for (; (j * 1000) / taxa <= k * DT + 1e-9; j++) {
          const ms = (j * 1000) / taxa;
          ultima = posicao(ms / 1000);
          evs.push(evento(ultima, relogioMs ? Math.round((T0 + ms) / relogioMs) * relogioMs : T0 + ms));
        }
      }
      let entregues = evs;
      if (agrupar && evs.length) {
        const e = evento(ultima, evs.at(-1).timeStamp);
        Object.defineProperty(e, 'getCoalescedEvents', { value: () => evs });
        entregues = [e];
      }
      for (const n of NOMES) { ac[n].ms = 0; ac[n].n = 0; }
      const a = real();
      for (const e of entregues) {
        tv = agrupar ? T0 + k * DT : e.timeStamp;
        document.body.dispatchEvent(e);
      }
      const b = real();
      tv = T0 + k * DT;
      rodarFila(tv);
      const c = real();
      porQuadro.push({
        quadro: k, posicoes: evs.length, eventos: entregues.length,
        msEventos: r3(b - a), msQuadro: r3(c - b), msScript: r3(c - a),
        msTinta: r3(ac.tinta.ms), msBarreiras: r3(ac.barreiras.ms), msRaio: r3(ac.raio.ms), msLetras: r3(ac.letras.ms),
        nTinta: ac.tinta.n, nRaio: ac.raio.n, nLetras: ac.letras.n, nCarimbos: ac.barreiras.n,
        distancia: ponta && ultima ? r3(Math.hypot(ponta.x - ultima.x, ponta.y - ultima.y)) : null,
      });
      if (capturar && (k === Math.floor(quadros / 2) || k === quadros + parado)) {
        capturas[k === quadros + parado ? 'fim' : 'meio'] = pixels();
      }
    }
    virtual = false;
    desvio = tv - real();
    if (fila.size) agendar();
    if (capturar) await guardar(chave, { capturas, carimbos: Float64Array.from(carimbos) });
    const mov = porQuadro.slice(0, quadros);
    const col = (c) => mov.map((q) => q[c]);
    const dist = col('distancia').filter((d) => d !== null);
    const resumo = {
      chave, janela: `${innerWidth}x${innerHeight}@${devicePixelRatio}`,
      posicoesPorQuadro: r3(media(col('posicoes'))), eventosPorQuadro: r3(media(col('eventos'))),
      msScript: r3(media(col('msScript'))), msScriptPior: Math.max(...col('msScript')),
      msEventos: r3(media(col('msEventos'))), msQuadro: r3(media(col('msQuadro'))),
      msTinta: r3(media(col('msTinta'))), msBarreiras: r3(media(col('msBarreiras'))),
      msRaio: r3(media(col('msRaio'))), msLetras: r3(media(col('msLetras'))),
      raiosPorQuadro: r3(media(col('nRaio'))), letrasPorQuadro: r3(media(col('nLetras'))),
      carimbos: carimbos.length / 3,
      larguraMedia: r3(2 * media(carimbos.filter((_, i) => i % 3 === 2))),
      distanciaMedia: r3(media(dist)), distanciaMaxima: Math.max(...dist),
      distanciaParado: porQuadro.at(-1).distancia,
    };
    api.ultimo = { resumo, porQuadro };
    return resumo;
  }

  // Compara duas medições guardadas: os pontos da tela (canal a canal) e a lista de carimbos.
  async function comparar(chaveA, chaveB) {
    const [a, b] = await Promise.all([ler(chaveA), ler(chaveB)]);
    if (!a || !b) return { erro: 'medição não encontrada', temA: Boolean(a), temB: Boolean(b) };
    const r = { carimbosA: a.carimbos.length / 3, carimbosB: b.carimbos.length / 3, difMaximaCarimbo: 0 };
    for (let i = 0; i < Math.min(a.carimbos.length, b.carimbos.length); i++) {
      r.difMaximaCarimbo = Math.max(r.difMaximaCarimbo, Math.abs(a.carimbos[i] - b.carimbos[i]));
    }
    for (const nome of ['meio', 'fim']) {
      const pa = a.capturas[nome], pb = b.capturas[nome];
      if (!pa || !pb || pa.w !== pb.w || pa.h !== pb.h) { r[nome] = 'tamanhos diferentes'; continue; }
      let maxima = 0, diferentes = 0;
      for (let i = 0; i < pa.px.length; i += 4) {
        const d = Math.max(Math.abs(pa.px[i] - pb.px[i]), Math.abs(pa.px[i + 1] - pb.px[i + 1]), Math.abs(pa.px[i + 2] - pb.px[i + 2]));
        if (d > 0) { diferentes++; if (d > maxima) maxima = d; }
      }
      r[nome] = { pontos: pa.w * pa.h, diferentes, difMaxima: maxima };
    }
    return r;
  }

  const api = {
    rodar, comparar, cronometrar, carimbo, ultimo: null, real, tempos: ac, aoFimDoQuadro: null,
    get ponta() { return ponta; },
  };
  window.__medir = api;
})();
