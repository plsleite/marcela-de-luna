import { test } from 'node:test'; import assert from 'node:assert/strict';
import { criarReserva } from '../site/js/core/reserva.js';
import { filaDeReserva } from '../site/js/core/janela.js';

// buscar falso: cada chamada fica pendente até o teste entregar ou falhar; respeita o sinal.
function buscarFalso() {
  const chamadas = [];
  const buscar = (url, { sinal, prioridade }) => new Promise((resolver, rejeitar) => {
    const c = { url, prioridade, sinal, entregar: () => resolver(`blob:${url}`), falhar: () => rejeitar(new Error(`HTTP 404 ${url}`)) };
    sinal.addEventListener('abort', () => { const e = new Error('abortado'); e.name = 'AbortError'; rejeitar(e); });
    chamadas.push(c);
  });
  const de = (url) => chamadas.filter((c) => c.url === url);
  return { buscar, chamadas, de };
}
const tique = () => new Promise((r) => setTimeout(r, 0));

test('reserva: dois downloads de fundo por vez, na ordem da fila, com prioridade baixa', async () => {
  const f = buscarFalso();
  const r = criarReserva({ buscar: f.buscar });
  r.enfileirar(['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(f.chamadas.map((c) => c.url), ['a', 'b']);
  assert.ok(f.chamadas.every((c) => c.prioridade === 'low'));
  f.chamadas[1].entregar();
  await tique();
  assert.deepEqual(f.chamadas.map((c) => c.url), ['a', 'b', 'c']);
  assert.equal(r.tem('b'), true);
  assert.equal(r.tem('a'), false);
  f.chamadas[0].entregar(); f.chamadas[2].entregar();
  await tique();
  assert.deepEqual(f.chamadas.map((c) => c.url), ['a', 'b', 'c', 'd', 'e']);
  f.chamadas[3].entregar(); f.chamadas[4].entregar();
  await tique();
  assert.equal(f.chamadas.length, 5); // nada baixa duas vezes
  assert.ok(['a', 'b', 'c', 'd', 'e'].every(r.tem));
});

test('reserva: pedir passa na frente sem esperar a fila; o limite de dois vale para o fundo', async () => {
  const f = buscarFalso();
  const r = criarReserva({ buscar: f.buscar });
  r.enfileirar(['a', 'b', 'c', 'd']);
  const p = r.pedir('x');
  assert.deepEqual(f.chamadas.map((c) => c.url), ['a', 'b', 'x']); // dispara na hora
  assert.notEqual(f.de('x')[0].prioridade, 'low');
  // um arquivo ainda na fila é promovido: baixa já e sai da fila
  const pd = r.pedir('d');
  assert.deepEqual(f.chamadas.map((c) => c.url), ['a', 'b', 'x', 'd']);
  f.de('x')[0].entregar(); f.de('d')[0].entregar();
  assert.equal(await p, 'blob:x');
  assert.equal(await pd, 'blob:d');
  // os pedidos da janela não ocupam lugar do fundo: c continua esperando a ou b
  assert.equal(f.de('c').length, 0);
  f.de('a')[0].entregar();
  await tique();
  assert.equal(f.de('c').length, 1);
  f.de('b')[0].entregar(); f.de('c')[0].entregar();
  await tique();
  assert.equal(f.chamadas.length, 5); // d não foi baixado de novo
});

test('reserva: pedir de um arquivo em curso ou pronto devolve a mesma promessa', async () => {
  const f = buscarFalso();
  const r = criarReserva({ buscar: f.buscar });
  r.enfileirar(['a']);
  const p1 = r.pedir('a');
  const p2 = r.pedir('a');
  assert.equal(p1, p2);
  assert.equal(f.chamadas.length, 1);
  f.chamadas[0].entregar();
  assert.equal(await p1, 'blob:a');
  assert.equal(await r.pedir('a'), 'blob:a');
  assert.equal(f.chamadas.length, 1);
});

test('reserva: falha remove a entrada; um novo pedir baixa de novo; o fundo não insiste', async () => {
  const f = buscarFalso();
  const r = criarReserva({ buscar: f.buscar });
  const p = r.pedir('a');
  f.chamadas[0].falhar();
  await assert.rejects(p, /HTTP 404/);
  assert.equal(r.tem('a'), false);
  const p2 = r.pedir('a');
  assert.notEqual(p2, p);
  assert.equal(f.de('a').length, 2);
  f.de('a')[1].entregar();
  assert.equal(await p2, 'blob:a');
  // no fundo, a falha não gera rejeição sem tratamento nem nova tentativa
  r.enfileirar(['b', 'c']);
  f.de('b')[0].falhar();
  await tique();
  assert.equal(r.tem('b'), false);
  r.enfileirar(['b', 'c', 'd']); // a fila refeita não repete o que falhou
  await tique();
  assert.equal(f.de('b').length, 1);
  assert.equal(f.de('d').length, 1);
});

test('reserva: enfileirar refaz a fila e solta o que ficou pronto fora dela', async () => {
  const f = buscarFalso();
  const r = criarReserva({ buscar: f.buscar });
  r.enfileirar(['a', 'b', 'c', 'd']);
  f.de('a')[0].entregar(); f.de('b')[0].entregar();
  await tique();
  // larguras novas (janela redimensionada): a fila passa a ser a nova; a, fora dela, é solto;
  // c e d (em curso) seguem até o fim
  r.enfileirar(['b', 'e', 'f']);
  assert.equal(r.tem('a'), false);
  assert.equal(r.tem('b'), true);
  assert.equal(f.chamadas.length, 4);
  f.de('c')[0].entregar();
  await tique();
  assert.equal(f.de('e').length, 1);
  assert.equal(f.de('a').length, 1);
});

test('reserva: encerrar aborta os downloads em curso e esvazia a fila', async () => {
  const f = buscarFalso();
  const r = criarReserva({ buscar: f.buscar });
  r.enfileirar(['a', 'b', 'c']);
  f.de('a')[0].entregar();
  await tique();
  const p = r.pedir('x');
  r.encerrar();
  assert.ok(f.chamadas.filter((c) => c.url !== 'a').every((c) => c.sinal.aborted));
  await assert.rejects(p, { name: 'AbortError' });
  await tique();
  assert.equal(f.de('c').length, 1); // c tinha começado quando a terminou
  assert.equal(f.chamadas.length, 4); // nada mais começa
  assert.equal(r.tem('a'), false); // os bytes foram soltos
  r.enfileirar(['d']);
  await assert.rejects(r.pedir('e'), { name: 'AbortError' });
  assert.equal(f.chamadas.length, 4);
});

test('reserva: com a fila vazia (reserva parada), um pedir entrega os bytes e não os guarda', async () => {
  const f = buscarFalso();
  const r = criarReserva({ buscar: f.buscar });
  const pa = r.pedir('a');
  f.de('a')[0].entregar();
  assert.equal(await pa, 'blob:a');
  r.enfileirar([]); // economia de dados: a reserva não roda
  assert.equal(r.tem('a'), false);
  const pb = r.pedir('b');
  assert.equal(r.pedir('b'), pb); // em curso, o mesmo download serve aos dois pedidos
  f.de('b')[0].entregar();
  assert.equal(await pb, 'blob:b');
  assert.equal(r.tem('b'), false);
});

test('reserva: fora da lista, pedir não guarda; antes do primeiro enfileirar, guarda e não baixa duas vezes', async () => {
  const f = buscarFalso();
  const r = criarReserva({ buscar: f.buscar });
  // durante a abertura (antes da fila): a janela pede a; a fila que chega depois o aproveita
  const pa = r.pedir('a');
  f.de('a')[0].entregar();
  await pa;
  assert.equal(r.tem('a'), true);
  r.enfileirar(['a', 'b']);
  await tique();
  assert.equal(f.de('a').length, 1);
  f.de('b')[0].entregar();
  await tique();
  // com a reserva rodando, um arquivo fora da lista é entregue e solto
  const px = r.pedir('x');
  f.de('x')[0].entregar();
  assert.equal(await px, 'blob:x');
  assert.equal(r.tem('x'), false);
  assert.ok(r.tem('a') && r.tem('b'));
});

test('filaDeReserva: da parada atual até o fim, depois da atual para trás', () => {
  const stops = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));
  assert.deepEqual(filaDeReserva(stops, 2), [2, 3, 4, 1, 0]);
  assert.deepEqual(filaDeReserva(stops, 0), [0, 1, 2, 3, 4]);
  assert.deepEqual(filaDeReserva(stops, 4), [4, 3, 2, 1, 0]);
  assert.deepEqual(filaDeReserva(stops, -1), [0, 1, 2, 3, 4]); // antes do primeiro quadro
});
