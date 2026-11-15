import { test } from 'node:test'; import assert from 'node:assert/strict';
import { carimbosEntre, carimbosNaCurva, corDaParada, gesto, distanciaAoRetangulo, forcaSobreTexto, forcaJuntoAosControles, pigmentoPara, tamanhoDoAlvo } from '../site/js/core/pincel.js';
import { PIGMENTOS } from '../site/js/config.js';

test('carimbosEntre: passo, último carimbo e ângulo do gesto', () => {
  const c = carimbosEntre({ x: 0, y: 0 }, { x: 10, y: 0 }, 2.5);
  assert.equal(c.length, 4); assert.deepEqual(c.at(-1), { x: 10, y: 0, ang: 0 });
  assert.equal(carimbosEntre({ x: 0, y: 0 }, { x: 1, y: 0 }, 2.5).length, 0);
  assert.ok(Math.abs(carimbosEntre({ x: 0, y: 0 }, { x: 0, y: 5 }, 5)[0].ang - Math.PI / 2) < 1e-9);
});

test('carimbosEntre: espaçamento regular e sobra para o próximo trecho', () => {
  const c = carimbosEntre({ x: 0, y: 0 }, { x: 13, y: 0 }, 6);
  assert.deepEqual(c.map((p) => p.x), [6, 12]); // o 1 que sobra fica para o próximo movimento
  assert.equal(carimbosEntre({ x: 3, y: 3 }, { x: 3, y: 3 }, 6).length, 0);
  const d = carimbosEntre({ x: 0, y: 0 }, { x: -6, y: 0 }, 6);
  assert.ok(Math.abs(Math.abs(d[0].ang) - Math.PI) < 1e-9);
});

test('corDaParada: pigmento da paleta pelo acento da primeira imagem (cor como reserva)', () => {
  const images = { a: { cor: '#414152' }, b: { cor: '#222222', acento: '#d6959d' }, c: { cor: '#2f3b6c' }, d: { cor: '#111111', acento: '#f0a050' } };
  assert.equal(corDaParada({ tipo: 'obra', telas: ['b', 'a'] }, images), '#e91b6a');
  assert.equal(corDaParada({ tipo: 'obra', telas: ['a', 'b'] }, images), '#305fa3');
  assert.equal(corDaParada({ tipo: 'capa', imagens: ['d'] }, images), '#f3953e');
  assert.equal(corDaParada({ tipo: 'texto', planos: [{ imagem: 'c' }, { imagem: 'b' }] }, images), '#305fa3');
  assert.equal(corDaParada({ tipo: 'texto' }, images), null);
  assert.equal(corDaParada(undefined, images), null);
  assert.equal(corDaParada({ tipo: 'obra', telas: ['x'] }, images), null);
});

test('pigmentoPara: croma baixa vai ao padrão; senão o pigmento de matiz mais próximo', () => {
  const P = PIGMENTOS;
  assert.deepEqual(P, ['#305fa3', '#e91b6a', '#d15ca1', '#f3953e']);
  assert.equal(pigmentoPara('#414152', P), '#305fa3');
  assert.equal(pigmentoPara('#e6bec0', P), '#e91b6a');
  assert.equal(pigmentoPara('#2f3b6c', P), '#305fa3');
  assert.equal(pigmentoPara('#d6959d', P), '#e91b6a');
  assert.equal(pigmentoPara('#f0a050', P), '#f3953e');
  assert.equal(pigmentoPara('#ff0000', P), '#e91b6a'); // 0° fica a 23° do rosa (circular) e 29° do laranja
});

test('gesto: devagar é largo e carregado; rápido é fino e seco', () => {
  const lento = gesto(0), rapido = gesto(10);
  assert.deepEqual(lento, { escala: 1, seca: 0, carga: 1 });
  assert.ok(rapido.escala < lento.escala && rapido.escala >= 0.6);
  assert.ok(rapido.seca > 0.4 && rapido.carga < 1);
  const meio = gesto(1.5);
  assert.ok(meio.escala < 1 && meio.escala > rapido.escala);
  assert.deepEqual(gesto(-3), lento);
  assert.deepEqual(gesto(NaN), lento);
  // o percurso gasta a tinta: mais seco e menos carregado, com limite
  const longo = gesto(0, 1200), gasto = gesto(0, 1e6);
  assert.ok(longo.seca > 0 && longo.carga < 1 && longo.escala === 1);
  assert.ok(gasto.seca > longo.seca && gasto.carga < longo.carga);
  assert.deepEqual(gasto, gesto(0, 2400));
  assert.ok(gesto(10, 1e6).seca <= 0.8 && gesto(10, 1e6).carga > 0);
});

test('distanciaAoRetangulo: zero dentro, euclidiana fora', () => {
  const r = { esq: 10, dir: 20, topo: 10, base: 30 };
  assert.equal(distanciaAoRetangulo(15, 20, r), 0);
  assert.equal(distanciaAoRetangulo(0, 20, r), 10);
  assert.equal(distanciaAoRetangulo(23, 34, r), 5);
});

test('forcaSobreTexto: 30% dentro do bloco, sobe até 100% em 40 px', () => {
  const r = [{ esq: 100, dir: 300, topo: 100, base: 200 }];
  const op = { dentro: 0.3, faixa: 40 };
  assert.equal(forcaSobreTexto({ x: 150, y: 150 }, r, op), 0.3);
  assert.equal(forcaSobreTexto({ x: 100, y: 150 }, r, op), 0.3); // na borda
  assert.equal(forcaSobreTexto({ x: 340, y: 150 }, r, op), 1);
  assert.equal(forcaSobreTexto({ x: 400, y: 400 }, r, op), 1);
  const meio = forcaSobreTexto({ x: 320, y: 150 }, r, op);
  assert.ok(meio > 0.3 && meio < 1);
  assert.ok(forcaSobreTexto({ x: 310, y: 150 }, r, op) < meio); // sobe com a distância
  assert.equal(forcaSobreTexto({ x: 150, y: 150 }, [], op), 1);
  // o bloco mais próximo manda; os padrões são 0,3 e 40 px
  const dois = [...r, { esq: 330, dir: 400, topo: 100, base: 200 }];
  assert.equal(forcaSobreTexto({ x: 335, y: 150 }, dois), 0.3);
});

test('tamanhoDoAlvo: um ponto de tinta por pixel do canvas (densidade até 2), com teto de área', () => {
  assert.deepEqual(tamanhoDoAlvo(1440, 900, 2), { w: 2880, h: 1800 });
  assert.deepEqual(tamanhoDoAlvo(1512, 860, 2), { w: 3024, h: 1720 });
  assert.deepEqual(tamanhoDoAlvo(3440, 1440, 1), { w: 3440, h: 1440 });
  assert.deepEqual(tamanhoDoAlvo(1280, 720, 1), { w: 1280, h: 720 });
  assert.deepEqual(tamanhoDoAlvo(1440, 900, 3), { w: 2880, h: 1800 }); // o renderer limita a 2
  assert.deepEqual(tamanhoDoAlvo(1440, 900, 1.5), { w: 2160, h: 1350 });
  assert.deepEqual(tamanhoDoAlvo(1440, 900, 0.5), { w: 1440, h: 900 }); // nunca menos de um
  const r = tamanhoDoAlvo(2560, 1440, 2);
  assert.ok(r.w * r.h <= 8_300_000 && r.w * r.h > 8_200_000);
  assert.ok(Math.abs(r.w / r.h - 2560 / 1440) < 0.002);
  const g = tamanhoDoAlvo(5120, 2880, 1);
  assert.ok(g.w * g.h <= 8_300_000 && g.w * g.h > 8_200_000);
  assert.ok(Math.abs(g.w / g.h - 5120 / 2880) < 0.002);
  assert.deepEqual(tamanhoDoAlvo(100, 100, 1, 2500), { w: 50, h: 50 });
  assert.deepEqual(tamanhoDoAlvo(0, 0, 1), { w: 1, h: 1 });
});

test('carimbosNaCurva: com três pontos alinhados, o mesmo espaçamento de carimbosEntre', () => {
  const a = { x: 0, y: 0 }, b = { x: 31, y: 0 };
  const reto = carimbosEntre(a, b, 6);
  const curva = carimbosNaCurva(a, { x: 15.5, y: 0 }, b, 6);
  assert.equal(curva.length, reto.length);
  curva.forEach((p, i) => {
    assert.ok(Math.abs(p.x - reto[i].x) < 1e-6 && Math.abs(p.y - reto[i].y) < 1e-6);
    assert.ok(Math.abs(p.ang - reto[i].ang) < 1e-9);
  });
  // controle alinhado mas fora do meio: o espaçamento ainda é o passo
  const torto = carimbosNaCurva({ x: 0, y: 0 }, { x: 0, y: 4 }, { x: 0, y: 30 }, 6);
  assert.equal(torto.length, 5);
  torto.forEach((p, i) => { assert.ok(Math.abs(p.y - 6 * (i + 1)) < 0.05 && Math.abs(p.x) < 1e-9); });
  assert.equal(carimbosNaCurva({ x: 2, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 2 }, 6).length, 0);
  assert.equal(carimbosNaCurva({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }, 6).length, 0);
});

test('carimbosNaCurva: sobre a curva, espaçados pelo passo e tangentes a ela', () => {
  const a = { x: 0, y: 0 }, c = { x: 60, y: 0 }, b = { x: 60, y: 60 };
  const cs = carimbosNaCurva(a, c, b, 6);
  assert.ok(cs.length >= 14 && cs.length <= 16); // o arco mede entre 84 e 96 px
  const ponto = (t) => ({ x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });
  let ant = a;
  for (const p of cs) {
    const d = Math.hypot(p.x - ant.x, p.y - ant.y);
    assert.ok(d >= 3 && d <= 9, `vizinhos a ${d}`);
    ant = p;
    // o ponto está na curva: o t mais próximo (busca fina) fica a menos de 0,05 px
    let menor = Infinity, tMelhor = 0;
    for (let t = 0; t <= 1; t += 1e-4) { const q = ponto(t); const e = Math.hypot(q.x - p.x, q.y - p.y); if (e < menor) { menor = e; tMelhor = t; } }
    assert.ok(menor < 0.05, `fora da curva por ${menor}`);
    const tg = Math.atan2(2 * (1 - tMelhor) * (c.y - a.y) + 2 * tMelhor * (b.y - c.y), 2 * (1 - tMelhor) * (c.x - a.x) + 2 * tMelhor * (b.x - c.x));
    assert.ok(Math.abs(p.ang - tg) < 0.01, 'tangente');
  }
  // começa pela horizontal e termina pela vertical
  assert.ok(Math.abs(cs[0].ang) < 0.2 && Math.abs(cs.at(-1).ang - Math.PI / 2) < 0.2);
  assert.ok(Math.hypot(b.x - cs.at(-1).x, b.y - cs.at(-1).y) < 6); // a sobra fica para o próximo trecho
});

test('forcaJuntoAosControles: sem meia largura, zero até 10 px do controle e cheia a 24 px dessa margem', () => {
  const r = [{ esq: 100, dir: 200, topo: 100, base: 130 }];
  assert.equal(forcaJuntoAosControles({ x: 150, y: 115 }, r), 0);
  assert.equal(forcaJuntoAosControles({ x: 210, y: 115 }, r), 0); // na margem
  assert.equal(forcaJuntoAosControles({ x: 150, y: 90 }, r), 0);
  assert.equal(forcaJuntoAosControles({ x: 234, y: 115 }, r), 1);
  assert.equal(forcaJuntoAosControles({ x: 400, y: 400 }, r), 1);
  const meio = forcaJuntoAosControles({ x: 222, y: 115 }, r);
  assert.ok(Math.abs(meio - 0.5) < 1e-9);
  assert.ok(forcaJuntoAosControles({ x: 215, y: 115 }, r) < meio);
  assert.equal(forcaJuntoAosControles({ x: 150, y: 115 }, []), 1);
  // o controle mais próximo manda
  const dois = [...r, { esq: 300, dir: 320, topo: 100, base: 130 }];
  assert.equal(forcaJuntoAosControles({ x: 295, y: 115 }, dois), 0);
});

test('forcaJuntoAosControles: margem e rampa contadas da borda do carimbo (meia largura)', () => {
  const r = [{ esq: 100, dir: 200, topo: 100, base: 130 }];
  const op = { meiaLargura: 23 };
  assert.equal(forcaJuntoAosControles({ x: 150, y: 115 }, r, op), 0);
  assert.equal(forcaJuntoAosControles({ x: 233, y: 115 }, r, op), 0); // borda a 10 px
  assert.ok(forcaJuntoAosControles({ x: 234, y: 115 }, r, op) > 0);
  assert.ok(Math.abs(forcaJuntoAosControles({ x: 245, y: 115 }, r, op) - 0.5) < 1e-9);
  assert.equal(forcaJuntoAosControles({ x: 257, y: 115 }, r, op), 1);
  assert.equal(forcaJuntoAosControles({ x: 300, y: 115 }, r, op), 1);
  assert.equal(forcaJuntoAosControles({ x: 150, y: 67 }, r, op), 0); // por cima também
  // pincel fino (escala 0,6 do gesto): meia largura 13,8
  const fino = { meiaLargura: 23 * 0.6 };
  assert.equal(forcaJuntoAosControles({ x: 223.8, y: 115 }, r, fino), 0);
  assert.ok(Math.abs(forcaJuntoAosControles({ x: 235.8, y: 115 }, r, fino) - 0.5) < 1e-9);
  assert.equal(forcaJuntoAosControles({ x: 247.8, y: 115 }, r, fino), 1);
  // a rampa de antes (meia largura 0) só vale quando não se passa a largura
  assert.ok(forcaJuntoAosControles({ x: 222, y: 115 }, r, op) === 0);
});
