import { test } from 'node:test'; import assert from 'node:assert/strict';
import { ABERTURA, fracaoCarregada, revelacao } from '../site/js/core/abertura.js';

const PROP = 2560 / 3439; // a capa (retrato)
const grade = (n = 60) => {
  const pts = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) pts.push([(i + 0.5) / n, (j + 0.5) / n]);
  return pts;
};

test('ABERTURA: valores do brief', () => {
  assert.equal(ABERTURA.revela, 1.6);
  assert.equal(ABERTURA.intervaloLetras, 0.04);
  assert.equal(ABERTURA.atrasoDoTraco, 0.2);
  assert.equal(ABERTURA.larguraDaCapa, 640); // a revelação começa com a capa leve
  assert.equal(ABERTURA.prazo, 4);           // s: teto da espera pelo carregamento
});

test('fracaoCarregada: feitos sobre o total, entre 0 e 1', () => {
  assert.equal(fracaoCarregada(0, 4), 0);
  assert.equal(fracaoCarregada(2, 4), 0.5);
  assert.equal(fracaoCarregada(4, 4), 1);
  assert.equal(fracaoCarregada(5, 4), 1);
  assert.equal(fracaoCarregada(0, 0), 1); // nada a esperar
});

test('revelacao: 0 em uRevela = 0 e exatamente 1 em uRevela = 1 em toda a tela', () => {
  for (const [u, v] of grade()) {
    assert.equal(revelacao(u, v, 0, PROP), 0);
    assert.equal(revelacao(u, v, 1, PROP), 1);
  }
  // também numa tela deitada e nos cantos
  for (const [u, v] of [[0, 0], [1, 1], [0, 1], [1, 0]]) {
    assert.equal(revelacao(u, v, 0, 1.6), 0);
    assert.equal(revelacao(u, v, 1, 1.6), 1);
  }
});

test('revelacao: nunca recua (o que apareceu fica)', () => {
  const pts = grade(40);
  let anterior = pts.map(() => 0);
  for (let r = 0.02; r <= 1.0001; r += 0.02) {
    const atual = pts.map(([u, v]) => revelacao(u, v, r, PROP));
    atual.forEach((a, i) => assert.ok(a >= anterior[i] - 1e-9, `recuou em r=${r.toFixed(2)}`));
    anterior = atual;
  }
});

test('revelacao: a meio caminho, parte revelada em faixas (nem fade nem cortina)', () => {
  const pts = grade(80);
  const m = pts.map(([u, v]) => revelacao(u, v, 0.5, PROP));
  const cheia = m.filter((x) => x > 0.99).length / m.length;
  const vazia = m.filter((x) => x < 0.01).length / m.length;
  assert.ok(cheia > 0.2 && cheia < 0.8, `revelada: ${cheia}`);
  assert.ok(cheia + vazia > 0.85, 'quase tudo já decidido: não é um fade uniforme');
  // cortina reta? numa mesma linha horizontal, a máscara alterna várias vezes entre 0 e 1
  let trocas = 0;
  for (const v of [0.3, 0.5, 0.7]) {
    let antes = null;
    for (let i = 0; i < 400; i++) {
      const x = revelacao((i + 0.5) / 400, v, 0.5, PROP) > 0.5;
      if (antes !== null && x !== antes) trocas++;
      antes = x;
    }
  }
  assert.ok(trocas >= 6, `trocas: ${trocas}`);
});

test('revelacao: borda de cerdas (fios vizinhos chegam a pontos diferentes)', () => {
  // ao longo de uma faixa estreita perpendicular ao traço, a fronteira varia de fio para fio
  const r = 0.45;
  const alcances = new Set();
  for (let k = 0; k < 30; k++) {
    const v = 0.40 + k * 0.002;
    let ultimo = -1;
    for (let i = 0; i < 300; i++) if (revelacao((i + 0.5) / 300, v, r, PROP) > 0.5) ultimo = i;
    alcances.add(ultimo);
  }
  assert.ok(alcances.size >= 5, `alcances distintos: ${alcances.size}`);
});
