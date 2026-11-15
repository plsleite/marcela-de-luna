import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarLinha } from '../site/js/core/timeline.js';
import { IMA } from '../site/js/config.js';
import { paradaDoIma, alvoDoIma, duracaoDoIma, curvaDoIma, teclaDeRolagem } from '../site/js/core/ima.js';

// focos: 0, 100, 200, 300 (linha mínima, só com o que o ímã lê)
const linha = { itens: [0, 100, 200, 300].map((foco, i) => ({ id: `p${i}`, foco })) };
const perto = (a, b) => Math.abs(a - b) < 1e-9;

test('IMA: as constantes do roteiro', () => {
  assert.deepEqual(IMA, { espera: 160, duracaoMin: 0.45, duracaoMax: 0.9, folga: 0.5, limiar: 0.25 });
});

test('paradaDoIma: o foco mais perto do vh; empate fica com a de menor índice', () => {
  assert.equal(paradaDoIma(linha, 0).id, 'p0');
  assert.equal(paradaDoIma(linha, 49).id, 'p0');
  assert.equal(paradaDoIma(linha, 50).id, 'p0'); // empate entre p0 e p1
  assert.equal(paradaDoIma(linha, 51).id, 'p1');
  assert.equal(paradaDoIma(linha, 250).id, 'p2'); // empate entre p2 e p3
  assert.equal(paradaDoIma(linha, 9999).id, 'p3');
  assert.equal(paradaDoIma(linha, -20).id, 'p0');
  assert.equal(paradaDoIma(linha, 130).foco, 100);
});

test('alvoDoIma: o foco a buscar, ou null dentro da folga', () => {
  assert.equal(alvoDoIma(linha, 130, { folga: 0.5 }), 100);
  assert.equal(alvoDoIma(linha, 170, { folga: 0.5 }), 200);
  assert.equal(alvoDoIma(linha, 100.3, { folga: 0.5 }), null);
  assert.equal(alvoDoIma(linha, 99.6, { folga: 0.5 }), null);
  assert.equal(alvoDoIma(linha, 100.5, { folga: 0.5 }), 100); // a folga é estrita: 0,5 já desliza
  assert.equal(alvoDoIma(linha, 100, { folga: 0.5 }), null);
});

test('alvoDoIma: sem origem (ou parado na origem) vai à parada mais próxima, como antes', () => {
  assert.equal(alvoDoIma(linha, 130, { folga: 0.5 }), 100);
  assert.equal(alvoDoIma(linha, 170, { folga: 0.5, limiar: 0.25 }), 200);
  assert.equal(alvoDoIma(linha, 130, { folga: 0.5, origem: 130, limiar: 0.25 }), 100);
  assert.equal(alvoDoIma(linha, 170, { folga: 0.5, origem: 170, limiar: 0.25 }), 200);
  assert.equal(alvoDoIma(linha, 130), 100); // padrões: IMA de config.js
});

test('alvoDoIma: descendo, avança a partir de 25% do caminho; subindo, o mesmo no sentido contrário', () => {
  const o = { folga: 0.5, limiar: 0.25 };
  assert.equal(alvoDoIma(linha, 120, { ...o, origem: 100 }), 100); // 20%: volta
  assert.equal(alvoDoIma(linha, 126, { ...o, origem: 100 }), 200); // 26%: avança
  assert.equal(alvoDoIma(linha, 125, { ...o, origem: 100 }), 200); // 25% já avança
  assert.equal(alvoDoIma(linha, 180, { ...o, origem: 200 }), 200); // subiu 20%: volta
  assert.equal(alvoDoIma(linha, 174, { ...o, origem: 200 }), 100); // subiu 26%: recua
  assert.equal(alvoDoIma(linha, 175, { ...o, origem: 200 }), 100);
  assert.equal(alvoDoIma(linha, 160, { ...o, origem: 100 }), 200); // desceu 60% e ficou
  assert.equal(alvoDoIma(linha, 120, { ...o, origem: 160 }), 100); // desceu 60% e voltou a 20%
  assert.equal(alvoDoIma(linha, 120, { ...o, origem: 100 }), 100);
});

test('alvoDoIma: antes do primeiro e depois do último foco, o extremo; dentro da folga, null', () => {
  const o = { folga: 0.5, limiar: 0.25 };
  assert.equal(alvoDoIma(linha, -30, { ...o, origem: 0 }), 0);
  assert.equal(alvoDoIma(linha, 340, { ...o, origem: 300 }), 300);
  assert.equal(alvoDoIma(linha, 120.3, { ...o, origem: 100 }), 100);
  assert.equal(alvoDoIma(linha, 100.3, { ...o, origem: 130 }), null);
  assert.equal(alvoDoIma(linha, 200.2, { ...o, origem: 180 }), null);
});

test('alvoDoIma com as paradas reais: Foyer, A Dança é por Ela e os closes', () => {
  const { stops } = JSON.parse(readFileSync('site/data/content.json', 'utf8'));
  const real = criarLinha(stops);
  const foco = (id) => real.itens.find((i) => i.id === id).foco;
  const foyer = foco('foyer-de-la-danse'), danca = foco('a-danca-e-por-ela');
  const o = { folga: 0.5, limiar: 0.25 };
  assert.equal(alvoDoIma(real, foyer + 20, { ...o, origem: foyer }), foyer);   // rolada curta: volta
  assert.equal(alvoDoIma(real, foyer + 26, { ...o, origem: foyer }), danca);   // 26 vh: avança
  assert.equal(alvoDoIma(real, danca - 26, { ...o, origem: danca }), foyer);   // para trás
  assert.equal(alvoDoIma(real, danca - 20, { ...o, origem: danca }), danca);
  const c1 = foco('detalhes-1-01'), c2 = foco('detalhes-1-02');               // closes, 45 vh
  assert.equal(alvoDoIma(real, c1 + 12, { ...o, origem: c1 }), c2);
  assert.equal(alvoDoIma(real, c1 + 10, { ...o, origem: c1 }), c1);
  assert.equal(alvoDoIma(real, foyer + 60, { ...o, origem: foyer }) , danca);
  assert.equal(alvoDoIma(real, foyer + 20, { ...o, origem: foyer + 60 }), foyer); // desceu 60 e voltou a 20
});

test('duracaoDoIma: mínima até 20 vh, linear até a máxima em 80 vh', () => {
  const o = { duracaoMin: 0.45, duracaoMax: 0.9 };
  assert.equal(duracaoDoIma(0, o), 0.45);
  assert.equal(duracaoDoIma(20, o), 0.45);
  assert.equal(duracaoDoIma(-20, o), 0.45);
  assert.ok(perto(duracaoDoIma(50, o), 0.675));
  assert.ok(perto(duracaoDoIma(-50, o), 0.675));
  assert.equal(duracaoDoIma(80, o), 0.9);
  assert.equal(duracaoDoIma(500, o), 0.9);
  assert.equal(duracaoDoIma(NaN, o), 0.45);
  assert.ok(perto(duracaoDoIma(50), 0.675)); // padrão: IMA de config.js
});

test('curvaDoIma: de 0 a 1, sempre crescendo, com saída suave (chega parada)', () => {
  assert.equal(curvaDoIma(0), 0);
  assert.equal(curvaDoIma(1), 1);
  assert.equal(curvaDoIma(-1), 0);
  assert.equal(curvaDoIma(2), 1);
  let anterior = 0;
  for (let t = 0.01; t <= 1; t += 0.01) {
    const v = curvaDoIma(t);
    assert.ok(v >= anterior, `t ${t}`);
    anterior = v;
  }
  // saída suave: no fim a velocidade vai a zero e é bem menor que no começo
  const h = 1e-4;
  const vFim = (curvaDoIma(1) - curvaDoIma(1 - h)) / h;
  const vInicio = (curvaDoIma(h) - curvaDoIma(0)) / h;
  assert.ok(vFim < 0.01, `vFim ${vFim}`);
  assert.ok(vInicio > 1, `vInicio ${vInicio}`);
});

test('teclaDeRolagem: só as teclas que rolam a página armam o ímã', () => {
  for (const key of ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Spacebar', 'Home', 'End']) {
    assert.equal(teclaDeRolagem({ key }), true, key);
    assert.equal(teclaDeRolagem({ key, shiftKey: true }), true, `shift+${key}`); // shift+espaço volta
  }
  for (const key of ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape', 'Enter', 'a', 'ArrowLeft', 'ArrowRight']) {
    assert.equal(teclaDeRolagem({ key }), false, key);
  }
  assert.equal(teclaDeRolagem({ key: 'ArrowDown', ctrlKey: true }), false);
  assert.equal(teclaDeRolagem({ key: 'ArrowDown', metaKey: true }), false);
  assert.equal(teclaDeRolagem({ key: 'ArrowDown', altKey: true }), false);
});
