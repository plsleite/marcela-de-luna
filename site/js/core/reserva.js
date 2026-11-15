// Reserva de arquivos: baixa em segundo plano (prioridade baixa, `simultaneos` por vez) e guarda
// os bytes, sem decodificar. pedir(url) é o caminho da janela de carregamento: dispara na hora,
// sem esperar a fila nem ocupar lugar dela, e reaproveita o download em curso do mesmo arquivo.
// buscar(url, { sinal, prioridade }) → promessa dos bytes (injetado: fetch no navegador).
const abortado = () => Object.assign(new Error('Reserva encerrada'), { name: 'AbortError' });

export function criarReserva({ buscar, simultaneos = 2 }) {
  const entradas = new Map(); // url → { promessa, blob, controle }
  const falhas = new Set(); // o fundo não insiste num arquivo que falhou (pedir tenta sempre)
  let fila = [];
  let deFundo = 0; // downloads de fundo em curso
  let encerrado = false;

  function baixar(url, fundo) {
    const entrada = { promessa: null, blob: null, controle: new AbortController() };
    entradas.set(url, entrada);
    if (fundo) deFundo++;
    entrada.promessa = buscar(url, { sinal: entrada.controle.signal, prioridade: fundo ? 'low' : 'high' })
      .then((blob) => {
        entrada.blob = blob;
        entrada.controle = null;
        falhas.delete(url);
        return blob;
      }, (erro) => {
        if (entradas.get(url) === entrada) entradas.delete(url);
        if (!encerrado && erro?.name !== 'AbortError') falhas.add(url);
        throw erro;
      })
      .finally(() => { if (fundo) { deFundo--; bombear(); } });
    if (fundo) entrada.promessa.catch(() => {}); // no fundo, a falha é silenciosa
    return entrada.promessa;
  }

  function bombear() {
    while (!encerrado && deFundo < simultaneos && fila.length) {
      const url = fila.shift();
      if (!entradas.has(url) && !falhas.has(url)) baixar(url, true);
    }
  }

  function pedir(url) {
    if (encerrado) return Promise.reject(abortado());
    const entrada = entradas.get(url);
    if (entrada) return entrada.promessa;
    fila = fila.filter((u) => u !== url); // ainda na fila: promovido
    return baixar(url, false);
  }

  // A fila passa a ser `urls` (sem o que já está em curso, pronto ou falhou); os bytes prontos
  // que ficaram fora dela (outra largura, depois de redimensionar) são soltos.
  function enfileirar(urls) {
    if (encerrado) return;
    const lista = new Set(urls);
    for (const [url, entrada] of entradas) if (entrada.blob && !lista.has(url)) entradas.delete(url);
    fila = [...lista].filter((u) => !entradas.has(u) && !falhas.has(u));
    bombear();
  }

  const tem = (url) => Boolean(entradas.get(url)?.blob);

  function encerrar() {
    encerrado = true;
    fila = [];
    for (const entrada of entradas.values()) entrada.controle?.abort();
    entradas.clear();
  }

  return { pedir, enfileirar, tem, encerrar };
}
