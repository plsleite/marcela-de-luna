import { test } from 'node:test'; import assert from 'node:assert/strict';
import { criarLinha } from '../site/js/core/timeline.js';
import { duracaoDaViagem, curvaDaViagem, paradaMaisProxima, destinoDaTecla, marcasDaFileira } from '../site/js/core/navegacao.js';

const perto = (a, b, tol = 1e-9) => Math.abs(a - b) < tol;

const stops = [
  { id: 'capa', tipo: 'capa', titulo: 'PORTFÓLIO', imagens: ['c'] },
  { id: 't', tipo: 'texto', titulo: 'PESQUISA' },
  { id: 'ab', tipo: 'abertura', serie: 's1', titulo: 'SÉRIE' },
  { id: 'o1', tipo: 'obra', serie: 's1', titulo: 'UM', telas: ['a', 'b'] },
  { id: 'o2', tipo: 'obra', serie: 's1', titulo: 'DOIS', telas: ['d'] },
  { id: 'o3', tipo: 'obra', serie: 's2', titulo: 'TRÊS', telas: ['e'] },
];
const linha = criarLinha(stops); // focos: 0, 130, 280, 400, 500, 600

test('duracaoDaViagem: 0,8 s até 100 vh, linear até 2,4 s em 700 vh, teto depois', () => {
  assert.equal(duracaoDaViagem(0), 0.8);
  assert.equal(duracaoDaViagem(100), 0.8);
  assert.ok(perto(duracaoDaViagem(400), 1.6));
  assert.ok(perto(duracaoDaViagem(250), 1.2));
  assert.equal(duracaoDaViagem(700), 2.4);
  assert.equal(duracaoDaViagem(5000), 2.4);
  assert.ok(perto(duracaoDaViagem(-400), 1.6)); // para cima vale a distância
  assert.equal(duracaoDaViagem(NaN), 0.8);
});

test('curvaDaViagem: começa e termina parada; com inclinação inicial, continua o movimento', () => {
  const e = curvaDaViagem(0);
  assert.equal(e(0), 0); assert.equal(e(1), 1);
  assert.ok(perto(e(0.5), 0.5));
  const d = (f, t, h = 1e-6) => (f(t + h) - f(t)) / h;
  assert.ok(Math.abs(d(e, 0)) < 1e-4);              // sai do repouso
  assert.ok(Math.abs(d(e, 1 - 1e-6)) < 1e-4);       // chega em repouso
  const c = curvaDaViagem(1.5);
  assert.ok(perto(d(c, 0), 1.5, 1e-4));             // herda a velocidade da viagem anterior
  assert.ok(Math.abs(d(c, 1 - 1e-6)) < 1e-4);
  for (const k of [-2, 0, 1, 3, 9]) {                // sempre monótona, sem passar do alvo
    const f = curvaDaViagem(k);
    let antes = 0;
    for (let t = 0; t <= 1.0000001; t += 0.01) { const v = f(Math.min(1, t)); assert.ok(v >= antes - 1e-12 && v <= 1 + 1e-12); antes = v; }
  }
  assert.ok(perto(d(curvaDaViagem(9), 0), 3, 1e-4)); // inclinação limitada a 3
  assert.ok(Math.abs(d(curvaDaViagem(-2), 0)) < 1e-4); // sentido contrário: parte do repouso
});

test('paradaMaisProxima: o foco mais perto do scroll', () => {
  assert.equal(paradaMaisProxima(linha, 0), 'capa');
  assert.equal(paradaMaisProxima(linha, 64), 'capa');
  assert.equal(paradaMaisProxima(linha, 66), 't');
  assert.equal(paradaMaisProxima(linha, 455), 'o2');
  assert.equal(paradaMaisProxima(linha, 9999), 'o3');
});

test('destinoDaTecla: setas, páginas, espaço, Home e End', () => {
  const ir = (key, extra = {}, atual = 'ab') => destinoDaTecla(linha, atual, { key, ...extra });
  assert.equal(ir('ArrowDown'), 'o1');
  assert.equal(ir('PageDown'), 'o1');
  assert.equal(ir(' '), 'o1');
  assert.equal(ir('Spacebar'), 'o1');
  assert.equal(ir('ArrowUp'), 't');
  assert.equal(ir('PageUp'), 't');
  assert.equal(ir(' ', { shift: true }), 't');
  assert.equal(ir('Home'), 'capa');
  assert.equal(ir('End'), 'o3');
  assert.equal(ir('ArrowDown', {}, 'o3'), 'o3');      // na ponta: fica (recentra)
  assert.equal(ir('ArrowUp', {}, 'capa'), 'capa');
});

test('destinoDaTecla: o que não é tratado devolve null', () => {
  const ir = (key, extra = {}) => destinoDaTecla(linha, 'ab', { key, ...extra });
  assert.equal(ir('a'), null);
  assert.equal(ir('Escape'), null);
  assert.equal(ir('Tab'), null);
  assert.equal(ir('Enter'), null);
  assert.equal(ir(' ', { emControle: true }), null);   // espaço num link ou botão é dele
  assert.equal(ir('ArrowDown', { emControle: true }), 'o1'); // setas valem mesmo assim
  assert.equal(ir('ArrowDown', { modificador: true }), null); // Cmd/Ctrl/Alt + tecla: do navegador
  assert.equal(ir('ArrowDown', { shift: true }), null);       // Shift + seta: seleção de texto
});

test('marcasDaFileira: uma marca por parada, pinceladas nas obras, grupos por série', () => {
  const images = { a: { cor: '#111111', acento: '#aa0000' }, b: { cor: '#222222', acento: '#00aa00' }, d: { cor: '#333333' }, e: {}, c: { cor: '#999999', acento: '#888888' } };
  const m = marcasDaFileira(stops, images);
  assert.deepEqual(m.map((x) => x.id), ['capa', 't', 'ab', 'o1', 'o2', 'o3']);
  assert.deepEqual(m.map((x) => x.titulo), ['PORTFÓLIO', 'PESQUISA', 'SÉRIE', 'UM', 'DOIS', 'TRÊS']);
  assert.deepEqual(m.map((x) => x.forma), ['traco', 'traco', 'traco', 'pincelada', 'pincelada', 'pincelada']);
  assert.deepEqual(m.map((x) => x.cor), [null, null, null, '#aa0000', '#333333', null]); // acento da 1ª tela; reserva: cor
  assert.deepEqual(m.map((x) => x.novoGrupo), [false, false, true, false, false, true]);
});
