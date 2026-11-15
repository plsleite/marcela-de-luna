import { test } from 'node:test'; import assert from 'node:assert/strict';
import { suavizar, paralaxe } from '../site/js/core/paralaxe.js';
import { fatorDeLuz } from '../site/js/core/luz.js';
import { RELEVO } from '../site/js/config.js';

const perto = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;
const GRAU = Math.PI / 180;

test('paralaxe: amplitudes máximas e sentido', () => {
  const p = paralaxe({ x: 1, y: 1 });
  assert.ok(perto(p.x, 0.35)); assert.ok(perto(p.y, 0.2));
  assert.ok(perto(p.giroY, 1.2 * GRAU)); assert.ok(perto(p.giroX, -1.2 * GRAU));
  // texto em sentido contrário ao ponteiro (tela: y cresce para baixo)
  assert.ok(perto(p.textoX, -8)); assert.ok(perto(p.textoY, 8));
  const n = paralaxe({ x: -1, y: -1 });
  assert.ok(perto(n.x, -0.35)); assert.ok(perto(n.y, -0.2)); assert.ok(perto(n.textoX, 8));
  // fora de −1..1 não passa do limite
  const f = paralaxe({ x: 5, y: -9 });
  assert.ok(perto(f.x, 0.35)); assert.ok(perto(f.y, -0.2)); assert.ok(perto(f.giroY, 1.2 * GRAU));
  const z = paralaxe({ x: 0, y: 0 });
  assert.deepEqual([z.x, z.y, z.giroX, z.giroY, z.textoX, z.textoY].map(Math.abs), [0, 0, 0, 0, 0, 0]);
});

test('suavizar: lerp 0.06 a 60 Hz, converge e para', () => {
  assert.ok(perto(suavizar(0, 1, 1000 / 60), 0.06));
  // dois quadros de 60 Hz equivalem a um de 30 Hz
  const doisPassos = suavizar(suavizar(0, 1, 1000 / 60), 1, 1000 / 60);
  assert.ok(perto(suavizar(0, 1, 2000 / 60), doisPassos, 1e-12));
  // alvo parado: converge para o alvo exato (nada treme) e fica nele
  let v = 0;
  for (let i = 0; i < 600; i++) v = suavizar(v, 0.7, 1000 / 60);
  assert.equal(v, 0.7);
  assert.equal(suavizar(0.7, 0.7, 1000 / 60), 0.7);
  // dt absurdo (aba em segundo plano) não ultrapassa o alvo
  assert.equal(suavizar(0, 1, 60000), 1);
  assert.equal(suavizar(0.3, 1, 0), 0.3);
});

test('fatorDeLuz: neutro sem relevo, sem força ou sem luz', () => {
  assert.equal(fatorDeLuz(0, 0, 0.2, 0.1, 1), 1);       // superfície lisa
  assert.equal(fatorDeLuz(0.3, -0.2, 0.2, 0.1, 0), 1);  // força zero (sem textura)
  assert.ok(perto(fatorDeLuz(0.3, -0.2, 50, 50, 1), 1, 1e-6)); // luz muito longe
});

test('fatorDeLuz: brilho na face voltada para a luz, sombra na oposta', () => {
  // luz à direita (+x): superfície que desce para +x encara a luz
  assert.ok(fatorDeLuz(-0.05, 0, 0.2, 0, 1) > 1);
  assert.ok(fatorDeLuz(0.05, 0, 0.2, 0, 1) < 1);
  // força menor, efeito menor
  const forte = fatorDeLuz(-0.02, 0, 0.2, 0, 1) - 1;
  const fraco = fatorDeLuz(-0.02, 0, 0.2, 0, 0.35) - 1;
  assert.ok(fraco > 0 && fraco < forte);
});

test('fatorDeLuz: sempre dentro de 1 ± RELEVO', () => {
  assert.equal(RELEVO, 0.12);
  assert.ok(perto(fatorDeLuz(-1, 0, 0.2, 0, 1), 1 + RELEVO));
  assert.ok(perto(fatorDeLuz(1, 0, 0.2, 0, 1), 1 - RELEVO));
  for (const g of [-1, -0.3, -0.01, 0, 0.01, 0.3, 1]) {
    for (const d of [-1, -0.3, 0, 0.05, 0.4, 1]) {
      for (const forca of [0, 0.35, 1, 3]) {
        const f = fatorDeLuz(g, -g / 2, d, d / 3, forca);
        assert.ok(f >= 1 - RELEVO - 1e-12 && f <= 1 + RELEVO + 1e-12, `${g} ${d} ${forca} → ${f}`);
      }
    }
  }
});
