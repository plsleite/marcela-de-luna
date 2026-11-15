// Luz rasante e realce dos vultos. Recebe tudo por parâmetro: palco (gl/palco.js), telas, linha,
// pontoNaTela (gl/tela.js) e vale() → true com a abertura terminada, sem tela ampliada e fora
// da volta dela (condição do realce). Os ouvintes do mouse saem em encerrar().
import { emFoco } from '../core/timeline.js';
import { suavizar } from '../core/paralaxe.js';

// Luz rasante: em cada tela, a luz fica onde o raio do ponteiro cruza o seu plano; a tela
// sob o cursor (a mais próxima atingida) recebe força 1, as demais 0,35, com transição suave.
const FORCA_SOB = 1;
const FORCA_DEMAIS = 0.35;
// Realce dos vultos: com o ponteiro sobre uma tela que não é da parada em foco, o uRealce
// dela vai a 1 em ~200 ms (o vulto ganha um esmaecido mais visível) e volta a 0 ao sair. A tela
// da parada em foco não muda; nada disso vale na abertura nem com uma tela ampliada.
const REALCE_MS = 200;

export function criarLuz({ palco, telas, linha, pontoNaTela, vale }) {
  const mouse = { x: 0, y: 0, dentro: false };
  const aoMoverMouse = (e) => {
    if (e.pointerType === 'touch') return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.dentro = true;
  };
  const aoSairMouse = (e) => { if (!e.relatedTarget) mouse.dentro = false; };
  addEventListener('pointermove', aoMoverMouse, { passive: true });
  document.addEventListener('mouseout', aoSairMouse, { passive: true });

  function aplicarLuz(dt) {
    const raio = palco.raioDoPonteiro();
    const pontos = telas.map((m) => pontoNaTela(m, raio));
    let sob = -1;
    pontos.forEach((p, i) => {
      if (!p || p.t < 3 || p.u < 0 || p.u > 1 || p.v < 0 || p.v > 1) return;
      if (sob < 0 || p.t < pontos[sob].t) sob = i;
    });
    telas.forEach((m, i) => {
      const u = m.material.uniforms;
      if (pontos[i]) u.uLuz.value.set(pontos[i].u, pontos[i].v);
      u.uRelevo.value = suavizar(u.uRelevo.value, i === sob ? FORCA_SOB : FORCA_DEMAIS, dt);
    });
  }

  function aplicarRealce(dt, vh) {
    const ok = mouse.dentro && vale();
    const sob = ok ? palco.telaSob(mouse.x, mouse.y) : null;
    const vulto = sob && sob.userData.stopId !== emFoco(linha, vh) ? sob : null;
    const passo = dt / REALCE_MS;
    for (const m of telas) {
      const u = m.material.uniforms.uRealce;
      const alvo = m === vulto ? 1 : 0;
      if (u.value !== alvo) u.value = alvo > u.value ? Math.min(1, u.value + passo) : Math.max(0, u.value - passo);
    }
  }

  return {
    quadro(dt, vh) { aplicarLuz(dt); aplicarRealce(dt, vh); },
    encerrar() {
      removeEventListener('pointermove', aoMoverMouse);
      document.removeEventListener('mouseout', aoSairMouse);
    },
  };
}
