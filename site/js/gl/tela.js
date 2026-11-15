// Uma pintura suspensa: plano com a textura (ou a cor dominante enquanto ela não chega),
// que nasce do branco ao longe e some ao passar rente à câmera. Sem iluminação da cena.
import * as THREE from 'three';

const vertex = /* glsl */`
varying vec2 vUv;
varying float vDist;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

// uRevela, uLuz e uRelevo ficam neutros nesta etapa (abertura e luz rasante vêm depois).
const fragment = /* glsl */`
uniform sampler2D uMapa;
uniform vec3 uCor;
uniform float uTemMapa;
uniform float uRevela;
uniform vec2 uLuz;
uniform float uRelevo;
uniform float uOpacidade;
varying vec2 vUv;
varying float vDist;
void main() {
  vec3 cor = uCor;
  if (uTemMapa > 0.0) cor = mix(uCor, texture2D(uMapa, vUv).rgb, uTemMapa);
  cor = mix(cor, vec3(1.0), smoothstep(22.0, 40.0, vDist));
  float alfa = uOpacidade * uRevela * smoothstep(1.5, 3.0, vDist);
  gl_FragColor = vec4(cor, alfa);
  #include <colorspace_fragment>
}`;

export function criarTela(plano, info) {
  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    uniforms: {
      uMapa: { value: null },
      uCor: { value: new THREE.Color(info.cor) },
      uTemMapa: { value: 0 },
      uRevela: { value: 1 },
      uLuz: { value: new THREE.Vector2(0.5, 0.5) },
      uRelevo: { value: 0 },
      uOpacidade: { value: 1 },
    },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(plano.largura, plano.altura), material);
  mesh.position.set(plano.x, plano.y, plano.z);
  mesh.userData = { imagem: plano.imagem, stopId: info.stopId, indiceTela: info.indiceTela };
  return mesh;
}
