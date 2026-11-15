// Uma pintura suspensa: plano com a textura (ou a cor dominante enquanto ela não chega),
// que nasce do branco ao longe e some ao passar rente à câmera. Sem iluminação da cena:
// a única luz é a rasante do cursor, que só multiplica a cor (luminância, nunca matiz).
import * as THREE from 'three';
import { RELEVO } from '../config.js';
import { ALTURA_LUZ, RAIO_LUZ, GANHO, PASSO_TEXELS } from '../core/luz.js';

const f = (v) => v.toFixed(4); // constante JS → literal GLSL

const vertex = /* glsl */`
varying vec2 vUv;
varying float vDist;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

// uRevela fica neutro nesta etapa (a abertura vem depois).
// Luz rasante: relevo pelo gradiente de luminância da textura (4 vizinhos), luz em uLuz (UV),
// força em uRelevo (0..1). Mesma fórmula de fatorDeLuz em core/luz.js.
const fragment = /* glsl */`
const float RELEVO = ${f(RELEVO)};
const float ALTURA_LUZ = ${f(ALTURA_LUZ)};
const float RAIO_LUZ = ${f(RAIO_LUZ)};
const float GANHO = ${f(GANHO)};
const float PASSO = ${f(PASSO_TEXELS)};
uniform sampler2D uMapa;
uniform vec3 uCor;
uniform float uTemMapa;
uniform float uRevela;
uniform vec2 uLuz;
uniform float uRelevo;
uniform float uOpacidade;
varying vec2 vUv;
varying float vDist;

float lum(vec2 uv) { return dot(texture2D(uMapa, uv).rgb, vec3(0.2126, 0.7152, 0.0722)); }

float fatorDeLuz(float gx, float gy, vec2 d, float forca) {
  float ll = length(vec3(d, ALTURA_LUZ));
  float difusa = (-gx * d.x - gy * d.y + ALTURA_LUZ) / (length(vec3(gx, gy, 1.0)) * ll);
  float k = (difusa - ALTURA_LUZ / ll) * exp(-dot(d, d) / (RAIO_LUZ * RAIO_LUZ)) * forca * GANHO;
  return 1.0 + clamp(k, -RELEVO, RELEVO);
}

void main() {
  vec3 cor = uCor;
  float fator = 1.0;
  if (uTemMapa > 0.0) {
    cor = mix(uCor, texture2D(uMapa, vUv).rgb, uTemMapa);
    float forca = uRelevo * uTemMapa;
    if (forca > 0.0) {
      vec2 passo = PASSO / vec2(textureSize(uMapa, 0));
      float gx = lum(vUv + vec2(passo.x, 0.0)) - lum(vUv - vec2(passo.x, 0.0));
      float gy = lum(vUv + vec2(0.0, passo.y)) - lum(vUv - vec2(0.0, passo.y));
      fator = fatorDeLuz(gx, gy, uLuz - vUv, forca);
    }
  }
  float branco = smoothstep(14.0, 28.0, vDist);
  cor = mix(cor, vec3(1.0), branco);
  fator = mix(fator, 1.0, branco); // o branco da distância não ganha relevo
  // Quase toda branca, a tela também fica transparente: sobre o branco não muda nada, e não
  // recorta um retângulo branco na tinta do pincel que está atrás.
  float alfa = uOpacidade * uRevela * smoothstep(1.5, 3.0, vDist) * (1.0 - smoothstep(0.85, 1.0, branco));
  gl_FragColor = vec4(cor, alfa);
  #include <colorspace_fragment>
  // Depois da conversão para sRGB: o mesmo fator nos três canais da cor exibida mantém a
  // razão R:G:B (matiz e saturação); perto do branco, limitado para nenhum canal saturar.
  vec3 c = gl_FragColor.rgb;
  gl_FragColor.rgb = c * min(fator, 1.0 / max(max(c.r, c.g), max(c.b, 1e-4)));
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

// Ponto em que um raio (mundo) cruza o plano da tela, em UV (0..1 dentro da tela), e a distância
// ao longo do raio; null se o plano está atrás da origem. As telas olham para +z, sem rotação.
export function pontoNaTela(mesh, raio) {
  const { origin: o, direction: d } = raio;
  if (Math.abs(d.z) < 1e-9) return null;
  const t = (mesh.position.z - o.z) / d.z;
  if (t <= 0) return null;
  const { width, height } = mesh.geometry.parameters;
  return {
    u: (o.x + d.x * t - mesh.position.x) / width + 0.5,
    v: (o.y + d.y * t - mesh.position.y) / height + 0.5,
    t,
  };
}

// Retângulo da tela na janela (px, y para baixo) com a câmera do último quadro.
const _canto = new THREE.Vector3();
export function retanguloProjetado(mesh, camera) {
  const { width, height } = mesh.geometry.parameters;
  const r = { esq: Infinity, dir: -Infinity, topo: Infinity, base: -Infinity };
  for (const sx of [-0.5, 0.5]) {
    for (const sy of [-0.5, 0.5]) {
      _canto.set(mesh.position.x + sx * width, mesh.position.y + sy * height, mesh.position.z).project(camera);
      const x = ((_canto.x + 1) / 2) * innerWidth, y = ((1 - _canto.y) / 2) * innerHeight;
      r.esq = Math.min(r.esq, x); r.dir = Math.max(r.dir, x);
      r.topo = Math.min(r.topo, y); r.base = Math.max(r.base, y);
    }
  }
  return r;
}
