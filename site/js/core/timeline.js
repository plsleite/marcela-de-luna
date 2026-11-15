import { DURACAO } from '../config.js';

// A primeira parada já começa em foco (foco 0); as demais ocupam [fim anterior, + dur].
export function criarLinha(stops) {
  let cursor = 0;
  const itens = stops.map((s, i) => {
    const dur = DURACAO[s.tipo];
    const inicio = cursor;
    const fim = i === 0 ? dur / 2 : inicio + dur;
    const foco = i === 0 ? 0 : inicio + dur / 2;
    cursor = fim;
    return { id: s.id, tipo: s.tipo, dur, inicio, fim, foco };
  });
  return { total: cursor, itens };
}

export function situar(linha, vh) {
  const { itens } = linha;
  let indice = itens.length - 1;
  for (let i = 0; i < itens.length; i++) {
    if (vh < itens[i].fim) { indice = i; break; }
  }
  const it = itens[indice];
  const local = Math.min(1, Math.max(0, (vh - it.inicio) / (it.fim - it.inicio)));
  return { indice, id: it.id, local };
}

export function focoDe(linha, id) {
  const it = linha.itens.find(x => x.id === id);
  if (!it) throw new Error(`parada desconhecida: ${id}`);
  return it.foco;
}

// Parada cujo foco está a até `fracao` da sua duração do scroll. A legenda de obra usa 0,16: nas
// obras de duas telas, a segunda passa por cima da legenda a partir de foco + 18 vh.
export function emFoco(linha, vh, fracao = 0.3) {
  const it = linha.itens.find(x => Math.abs(vh - x.foco) <= fracao * x.dur);
  return it ? it.id : null;
}

// O fim do scroll coincide com o foco da última parada.
export function alturaDaPagina(linha) {
  return linha.itens[linha.itens.length - 1].foco + 100;
}

export function vizinho(linha, id, dir) {
  const i = linha.itens.findIndex(x => x.id === id);
  if (i < 0) throw new Error(`parada desconhecida: ${id}`);
  const j = Math.min(linha.itens.length - 1, Math.max(0, i + Math.sign(dir)));
  return linha.itens[j].id;
}
