import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarLinha } from '../site/js/core/timeline.js';
import { duracaoDaViagem, curvaDaViagem, impulsoDaRoda, paradaMaisProxima, destinoDaTecla, marcasDaFileira, marcaAtual, passoDaFileira, passoEmRepouso, lente, limitesDasMarcas } from '../site/js/core/navegacao.js';
import { FILEIRA } from '../site/js/config.js';

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
  assert.deepEqual(m.map((x) => x.ids), [['capa'], ['t'], ['ab'], ['o1'], ['o2'], ['o3']]);
});

test('marcasDaFileira com os dados reais: um traço por trecho de "Detalhes" e o verso no fim', () => {
  const { stops: reais } = JSON.parse(readFileSync('site/data/content.json', 'utf8'));
  const images = JSON.parse(readFileSync('site/data/images.json', 'utf8'));
  const marcas = marcasDaFileira(reais, images);
  assert.equal(marcas.length, 36);                       // 1 capa + 1 texto + 2 aberturas + 29 obras + 2 trechos + 1 verso
  const det = marcas.filter(m => m.titulo === 'DETALHES');
  assert.deepEqual(det.map(m => m.ids.length), [16, 8]);
  assert.equal(det[0].id, 'detalhes-1-01'); assert.equal(det[0].forma, 'traco');
  assert.equal(marcas.at(-1).id, 'verso'); assert.equal(marcas.at(-1).titulo, 'MARCELA DE LUNA');
  assert.equal(marcas.at(-1).forma, 'traco');
  assert.equal(marcas[marcaAtual(marcas, 'detalhes-1-09')].id, 'detalhes-1-01');
  assert.equal(marcas[marcaAtual(marcas, 'duvidei')].id, 'duvidei');
  assert.equal(marcaAtual(marcas, 'nao-existe'), -1);
});

test('passoDaFileira: (altura − 160) / n, entre 12 e 24 px', () => {
  assert.equal(passoDaFileira(900, 36), (900 - 160) / 36);
  assert.equal(passoDaFileira(700, 36), 15);
  assert.equal(passoDaFileira(500, 36), 12);
  assert.equal(passoDaFileira(1200, 6), 24);
});

test('impulsoDaRoda: só soma o impulso da viagem quando a roda vai no mesmo sentido', () => {
  assert.equal(impulsoDaRoda(100, 2700, 5.4), 600);    // descendo: 100 + 2700/5,4
  assert.equal(impulsoDaRoda(-100, -2700, 5.4), -600); // subindo
  assert.equal(impulsoDaRoda(-100, 2700, 5.4), -100);  // sentido contrário: a roda manda
  assert.equal(impulsoDaRoda(100, -2700, 5.4), 100);
  assert.equal(impulsoDaRoda(0, 2700, 5.4), 0);        // sem deltaY vertical, nada muda
  assert.equal(impulsoDaRoda(100, 0, 5.4), 100);
  assert.equal(impulsoDaRoda(100, NaN, 5.4), 100);     // valores não finitos: sem impulso
  assert.equal(impulsoDaRoda(100, Infinity, 5.4), 100);
  assert.equal(impulsoDaRoda(100, 2700, 0), 100);
  assert.equal(impulsoDaRoda(100, 2700, NaN), 100);
  assert.ok(Number.isNaN(impulsoDaRoda(NaN, 2700, 5.4))); // deltaY inválido passa adiante intacto
});

test('FILEIRA: repouso 0,45, passo mínimo 6 px, raio de 3 passos cheios', () => {
  assert.deepEqual(FILEIRA, { repouso: 0.45, passoMin: 6, raio: 3 });
});

test('passoEmRepouso: max(6, 0,45 · passo cheio)', () => {
  assert.ok(perto(passoEmRepouso(20), 9));
  assert.ok(perto(passoEmRepouso(24), 10.8));
  assert.equal(passoEmRepouso(12), 6);   // 5,4 → piso de 6
  assert.equal(passoEmRepouso(13.3), 6); // 5,985 → piso de 6
});

// Coluna de 21 marcas em repouso (passo 9, cheio 20): R = 60, k = 20/9 − 1.
const PASSO = 9, CHEIO = 20, RAIO = 3, R = RAIO * CHEIO, K = CHEIO / PASSO - 1;
const centros = Array.from({ length: 21 }, (_, i) => 30 + i * PASSO);
const opcoes = { passo: PASSO, passoCheio: CHEIO, raio: RAIO };

test('lente: sem cursor, identidade e fator 0', () => {
  for (const cursor of [null, undefined, NaN]) {
    const r = lente(centros, cursor, opcoes);
    assert.deepEqual(r.map(m => m.y), centros);
    assert.ok(r.every(m => m.fator === 0));
  }
});

test('lente: a marca sob o cursor não sai do lugar e tem fator 1', () => {
  const r = lente(centros, centros[10], opcoes);
  assert.equal(r[10].y, centros[10]);
  assert.equal(r[10].fator, 1);
  assert.ok(r[9].fator > 0 && r[9].fator < 1);
});

test('lente: a ordem das marcas se conserva, para qualquer posição do cursor', () => {
  for (let cursor = 0; cursor <= 260; cursor += 0.7) {
    const ys = lente(centros, cursor, opcoes).map(m => m.y);
    for (let i = 1; i < ys.length; i++) assert.ok(ys[i] > ys[i - 1], `cursor ${cursor}, marca ${i}`);
  }
});

test('lente: vizinhas do cursor ficam a cerca de um passo cheio uma da outra (5%)', () => {
  const sobre = lente(centros, centros[10], opcoes);       // cursor sobre uma marca
  assert.ok(Math.abs(sobre[11].y - sobre[10].y - CHEIO) / CHEIO < 0.05);
  assert.ok(Math.abs(sobre[10].y - sobre[9].y - CHEIO) / CHEIO < 0.05);
  const entre = lente(centros, centros[10] + PASSO / 2, opcoes); // entre duas marcas
  assert.ok(Math.abs(entre[11].y - entre[10].y - CHEIO) / CHEIO < 0.05);
});

test('lente: além de R, as marcas se deslocam exatamente k · R/2 e têm fator 0', () => {
  const cursor = centros[10];
  const r = lente(centros, cursor, opcoes);
  centros.forEach((c, i) => {
    const d = c - cursor;
    if (Math.abs(d) <= R) return;
    assert.ok(perto(r[i].y - c, Math.sign(d) * K * R / 2), `marca ${i}`);
    assert.equal(r[i].fator, 0);
  });
  assert.ok(perto(r[0].y - centros[0], -K * R / 2));
  assert.ok(perto(r[20].y - centros[20], K * R / 2));
});

test('lente: fator = cos²(π d / 2R) dentro de R', () => {
  const r = lente(centros, centros[10], opcoes);
  const d = 2 * PASSO;
  assert.ok(perto(r[12].fator, Math.cos(Math.PI * d / (2 * R)) ** 2));
});

test('lente: ganho (entrada e saída) multiplica o deslocamento e o fator', () => {
  const cheia = lente(centros, centros[10] + 3, opcoes);
  const zero = lente(centros, centros[10] + 3, { ...opcoes, ganho: 0 });
  assert.deepEqual(zero.map(m => m.y), centros);
  assert.ok(zero.every(m => m.fator === 0));
  const meia = lente(centros, centros[10] + 3, { ...opcoes, ganho: 0.5 });
  meia.forEach((m, i) => {
    assert.ok(perto(m.y - centros[i], (cheia[i].y - centros[i]) / 2));
    assert.ok(perto(m.fator, cheia[i].fator / 2));
  });
});

test('limitesDasMarcas: cada área vai do meio até a vizinha de cima ao meio até a de baixo', () => {
  const ys = [10, 20, 40, 45];
  const l = limitesDasMarcas(ys);
  assert.deepEqual(l, [
    { topo: 5, base: 15 },    // a primeira estende para cima o mesmo que para baixo
    { topo: 15, base: 30 },
    { topo: 30, base: 42.5 },
    { topo: 42.5, base: 47.5 }, // a última, idem para baixo
  ]);
  for (let i = 1; i < l.length; i++) assert.equal(l[i].topo, l[i - 1].base); // sem buraco nem sobreposição
  assert.deepEqual(limitesDasMarcas([7], 6), [{ topo: 4, base: 10 }]); // uma só: meio passo de cada lado
  assert.deepEqual(limitesDasMarcas([]), []);
});
