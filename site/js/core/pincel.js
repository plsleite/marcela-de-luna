// Pincel: geometria do gesto, sem DOM nem three. Coordenadas em px de janela (y para baixo).

// Carimbos a cada `passo` px no segmento a→b, sem o ponto de partida; o último cai em b só se
// a distância for múltipla do passo (quem chama continua o traço a partir do último carimbo).
// `ang` é a direção do gesto (atan2 em px de janela).
export function carimbosEntre(a, b, passo) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const n = Math.floor(dist / passo + 1e-9);
  if (!(n > 0)) return [];
  const ang = Math.atan2(dy, dx);
  const c = [];
  for (let i = 1; i <= n; i++) {
    const t = (i * passo) / dist;
    c.push({ x: a.x + dx * t, y: a.y + dy * t, ang });
  }
  return c;
}

// Cor da tinta: o acento (cor mais viva) da primeira imagem da parada (telas, imagens ou
// planos); a cor dominante fica de reserva.
export function corDaParada(stop, images) {
  if (!stop) return null;
  const id = stop.telas?.[0] ?? stop.imagens?.[0] ?? stop.planos?.[0]?.imagem;
  return images[id]?.acento ?? images[id]?.cor ?? null;
}

// Gesto pela velocidade (px/ms): devagar o pincel deita inteiro e carregado; rápido fica mais
// fino (até 60% da largura), seco (cerdas falhando) e com menos tinta. `percurso` (px desde que o
// pincel parou pela última vez) gasta a tinta: o traço longo vai secando até um mínimo.
const LENTO = 0.4, RAPIDO = 3, GASTO = 2400;
export function gesto(velocidade, percurso = 0) {
  const v = Number.isFinite(velocidade) ? velocidade : 0;
  const k = Math.min(1, Math.max(0, (v - LENTO) / (RAPIDO - LENTO)));
  const g = Math.min(1, Math.max(0, (Number.isFinite(percurso) ? percurso : 0) / GASTO));
  return { escala: 1 - 0.4 * k, seca: Math.min(0.8, 0.45 * k + 0.25 * g), carga: (1 - 0.35 * k) * (1 - 0.35 * g) };
}

// Distância de um ponto a um retângulo { esq, dir, topo, base } (0 dentro ou na borda).
export function distanciaAoRetangulo(x, y, r) {
  const dx = Math.max(r.esq - x, 0, x - r.dir);
  const dy = Math.max(r.topo - y, 0, y - r.base);
  return Math.hypot(dx, dy);
}

// Força do depósito perto dos blocos de parágrafos: `dentro` sobre o bloco, subindo suave até 1
// a `faixa` px dele (vale o bloco mais próximo). Sem blocos, 1.
export function forcaSobreTexto(p, retangulos, { dentro = 0.3, faixa = 40 } = {}) {
  let d = Infinity;
  for (const r of retangulos) d = Math.min(d, distanciaAoRetangulo(p.x, p.y, r));
  if (d >= faixa) return 1;
  const t = d / faixa;
  return dentro + (1 - dentro) * t * t * (3 - 2 * t);
}
