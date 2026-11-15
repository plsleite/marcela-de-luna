// Luz rasante e realce dos vultos. Recebe tudo por parâmetro: palco (gl/palco.js), telas,
// pontoNaTela (gl/tela.js), emFoco(vh) → id da parada em foco para o clique (o mesmo predicado
// do clique, em main.js: null com o cartão no meio do giro) e vale() → true com a abertura
// terminada, sem tela ampliada e fora da volta dela (condição do realce). Os ouvintes do mouse
// saem em encerrar().
import { suavizar } from '../core/paralaxe.js';
import { aoAlcance } from '../core/janela.js';

// Luz rasante: em cada tela, a luz fica onde o raio do ponteiro cruza o seu plano; a tela
// sob o cursor (a mais próxima atingida) recebe força 1, as demais 0,35, com transição suave.
// Uma tela com userData.luzNeutra (o cartão final no meio do giro, que pontoNaTela não mede) ou
// userData.deCostas (a tela do cartão que está de costas, invisível) fica sem luz rasante:
// força 0 e fora da disputa pela tela sob o cursor. Também fica fora da disputa (com a força das
// demais) a tela que não aparece: não desenhada, com opacidade 0 (as outras, com uma tela
// ampliada) ou fora do seu alcance (rente à câmera ou sumida no branco).
const FORCA_SOB = 1;
const FORCA_DEMAIS = 0.35;
// Realce dos vultos: com o ponteiro sobre uma tela que não é da parada em foco, o uRealce
// dela vai a 1 em ~200 ms (o vulto ganha um esmaecido mais visível) e volta a 0 ao sair. A tela
// da parada em foco não muda; nada disso vale na abertura nem com uma tela ampliada. No meio do
// giro final, a tela da parada também é vulto: o clique nela viaja.
const REALCE_MS = 200;

export function criarLuz({ palco, telas, pontoNaTela, emFoco, vale }) {
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
    const fora = (m) => m.userData.luzNeutra || m.userData.deCostas;
    const pontos = telas.map((m) => (fora(m) ? null : pontoNaTela(m, raio)));
    const cz = palco.camera.position.z;
    const aparece = (m) => m.visible && m.material.uniforms.uOpacidade.value !== 0
      && aoAlcance(cz - m.position.z, m.userData.perto, m.userData.alcance);
    let sob = -1;
    pontos.forEach((p, i) => {
      if (!p || p.t < 3 || p.u < 0 || p.u > 1 || p.v < 0 || p.v > 1 || !aparece(telas[i])) return;
      if (sob < 0 || p.t < pontos[sob].t) sob = i;
    });
    telas.forEach((m, i) => {
      const u = m.material.uniforms;
      if (fora(m)) { u.uRelevo.value = 0; return; }
      if (pontos[i]) u.uLuz.value.set(pontos[i].u, pontos[i].v);
      u.uRelevo.value = suavizar(u.uRelevo.value, i === sob ? FORCA_SOB : FORCA_DEMAIS, dt);
    });
  }

  function aplicarRealce(dt, vh) {
    const ok = mouse.dentro && vale();
    const sob = ok ? palco.telaSob(mouse.x, mouse.y) : null;
    const vulto = sob && sob.userData.stopId !== emFoco(vh) ? sob : null;
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
