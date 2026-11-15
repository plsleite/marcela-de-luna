// Palco three.js: cena branca, câmera em perspectiva olhando para −z e o laço de quadros.
import * as THREE from 'three';
import { FOV, DIST_FOCO } from '../config.js';

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
  const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 80);
  camera.position.set(0, 0, DIST_FOCO);

  const fns = [];
  const aoQuadro = (fn) => { fns.push(fn); };

  function redimensionar() {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  redimensionar();

  renderer.setAnimationLoop((t) => {
    for (const fn of fns) fn(t);
    renderer.render(cena, camera);
  });

  return { cena, camera, renderer, aoQuadro, redimensionar, parar: () => renderer.setAnimationLoop(null) };
}
