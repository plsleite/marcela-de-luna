// Palco three.js: cena branca, câmera em perspectiva olhando para −z, o laço de quadros
// e o ponteiro do mouse (suavizado) para a paralaxe e a luz rasante.
import * as THREE from 'three';
import { DIST_FOCO } from '../config.js';
import { aoAlcance } from '../core/janela.js';
import { fovPara } from '../core/camera.js';
import { suavizar } from '../core/paralaxe.js';

export function criarPalco(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (erro) {
    console.warn('WebGL indisponível; fica a página base.', erro);
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0xffffff, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fovPara(innerWidth / innerHeight), innerWidth / innerHeight, 0.1, 80);
  camera.position.set(0, 0, DIST_FOCO);

  // Ponteiro em −1..1 (y para cima): `alvo` segue o mouse; `ponteiro` o persegue a cada quadro.
  // Fora da janela (ou sem foco), o alvo volta ao centro. Toque não move nada.
  const ponteiro = { x: 0, y: 0 };
  const alvo = { x: 0, y: 0 };
  const aoMover = (e) => {
    if (e.pointerType === 'touch') return;
    alvo.x = (e.clientX / innerWidth) * 2 - 1;
    alvo.y = 1 - (e.clientY / innerHeight) * 2;
  };
  const aoCentro = () => { alvo.x = 0; alvo.y = 0; };
  const aoSair = (e) => { if (!e.relatedTarget) aoCentro(); };
  addEventListener('pointermove', aoMover, { passive: true });
  document.addEventListener('mouseout', aoSair);
  addEventListener('blur', aoCentro);

  // Raio da câmera pelo ponteiro suavizado (com a câmera já posicionada neste quadro).
  const lancador = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function raioDoPonteiro() {
    camera.updateMatrixWorld();
    lancador.setFromCamera(ndc.set(ponteiro.x, ponteiro.y), camera);
    return lancador.ray;
  }

  // Tela (Mesh com userData.stopId) mais próxima da câmera sob o ponto (x, y) em px da janela,
  // ou null. Ignora as invisíveis: opacidade 0, mais perto que o `perto` de cada tela (rente à
  // câmera) ou além do `alcance` (sumidas ao longe), as distâncias em que o shader de gl/tela.js
  // a deixa transparente.
  const lancadorDoPonto = new THREE.Raycaster();
  const ndcDoPonto = new THREE.Vector2();
  const _local = new THREE.Vector3();
  function telaSob(x, y) {
    camera.updateMatrixWorld();
    lancadorDoPonto.setFromCamera(ndcDoPonto.set((x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2), camera);
    const telas = cena.children.filter((o) => o.isMesh && o.visible && o.userData.stopId !== undefined
      && o.material.uniforms?.uOpacidade?.value > 0);
    for (const hit of lancadorDoPonto.intersectObjects(telas, false)) {
      const dist = -_local.copy(hit.point).applyMatrix4(camera.matrixWorldInverse).z;
      if (aoAlcance(dist, hit.object.userData.perto, hit.object.userData.alcance)) return hit.object;
    }
    return null;
  }

  const fns = [];
  const aoQuadro = (fn) => { fns.push(fn); };
  const erros = [];
  const aoErro = (fn) => { erros.push(fn); };

  // Densidade que muda sem o tamanho mudar (janela levada a outro monitor): o mesmo caminho do
  // resize, para o canvas e para quem ouve o resize. A consulta vale para uma densidade só:
  // é rearmada a cada troca.
  let densidade = null;
  const aoTrocarDensidade = () => { armarDensidade(); dispatchEvent(new Event('resize')); };
  function armarDensidade() {
    densidade?.removeEventListener('change', aoTrocarDensidade);
    densidade = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    densidade.addEventListener('change', aoTrocarDensidade);
  }
  armarDensidade();

  // Para o laço e solta os ouvintes do ponteiro e da densidade.
  const parar = () => {
    renderer.setAnimationLoop(null);
    removeEventListener('pointermove', aoMover);
    document.removeEventListener('mouseout', aoSair);
    removeEventListener('blur', aoCentro);
    densidade?.removeEventListener('change', aoTrocarDensidade);
    densidade = null;
  };

  function redimensionar() {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.fov = fovPara(camera.aspect); // janela estreita: campo horizontal constante
    camera.updateProjectionMatrix();
  }
  redimensionar();

  // Um erro num quadro para o laço e avisa quem se registrou em aoErro (a travessia se desmonta).
  let anterior = null;
  renderer.setAnimationLoop((t) => {
    try {
      const dt = anterior === null ? 0 : t - anterior;
      anterior = t;
      ponteiro.x = suavizar(ponteiro.x, alvo.x, dt);
      ponteiro.y = suavizar(ponteiro.y, alvo.y, dt);
      for (const fn of fns) fn(t, dt);
      renderer.render(cena, camera);
    } catch (erro) {
      parar();
      for (const fn of erros) fn(erro);
    }
  });

  return { cena, camera, renderer, ponteiro, raioDoPonteiro, telaSob, aoQuadro, aoErro, redimensionar, parar };
}
