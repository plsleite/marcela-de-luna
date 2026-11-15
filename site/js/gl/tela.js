// Uma pintura suspensa: plano com a textura (ou a cor dominante enquanto ela não chega),
// que ao longe é um vulto quase branco (e some de vez mais longe) e some ao passar rente à câmera. Sem iluminação da cena:
// a única luz é a rasante do cursor, que só multiplica a cor (luminância, nunca matiz).
import * as THREE from 'three';
import { RELEVO, VISIBILIDADE as VIS } from '../config.js';
import { ALTURA_LUZ, RAIO_LUZ, GANHO, PASSO_UV } from '../core/luz.js';
import { PINCELADA as PC } from '../core/abertura.js';

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

// Abertura: uRevela (0..1) revela a pintura por pinceladas diagonais com ponta de cerdas;
// em 1 a tela é exatamente a de sempre. Mesma função de revelacao em core/abertura.js.
// Luz rasante: relevo pelo gradiente de luminância da textura (4 vizinhos), luz em uLuz (UV),
// força em uRelevo (0..1). Mesma fórmula de fatorDeLuz em core/luz.js.
const fragment = /* glsl */`
const float RELEVO = ${f(RELEVO)};
const float ALTURA_LUZ = ${f(ALTURA_LUZ)};
const float RAIO_LUZ = ${f(RAIO_LUZ)};
const float GANHO = ${f(GANHO)};
const float PASSO = ${PASSO_UV.toFixed(8)}; // UV (mesmo de passoDoRelevo em core/luz.js)
uniform sampler2D uMapa;
uniform vec3 uCor;
uniform float uTemMapa;
uniform float uRevela;
uniform vec2 uLuz;
uniform float uRelevo;
uniform float uOpacidade;
uniform float uProporcao;
uniform vec2 uSurge;  // distâncias em que surge de transparente, rente à câmera (início, fim)
uniform vec2 uBranco; // distâncias em que embranquece (início, fim)
uniform vec2 uSome;   // distâncias em que some (início, fim)
uniform float uRealce; // 0..1: o ponteiro sobre um vulto (a brancura cai até VIS.realce)
varying vec2 vUv;
varying float vDist;

float lum(vec2 uv) { return dot(texture2D(uMapa, uv).rgb, vec3(0.2126, 0.7152, 0.0722)); }

float fatorDeLuz(float gx, float gy, vec2 d, float forca) {
  float ll = length(vec3(d, ALTURA_LUZ));
  float difusa = (-gx * d.x - gy * d.y + ALTURA_LUZ) / (length(vec3(gx, gy, 1.0)) * ll);
  float k = (difusa - ALTURA_LUZ / ll) * exp(-dot(d, d) / (RAIO_LUZ * RAIO_LUZ)) * forca * GANHO;
  return 1.0 + clamp(k, -RELEVO, RELEVO);
}

float hash(float n) {
  float p = fract(n * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float revelacao(vec2 uv, float r) {
  if (r >= 1.0) return 1.0;
  if (r <= 0.0) return 0.0;
  vec2 d = vec2(cos(${f(PC.ANGULO)}), sin(${f(PC.ANGULO)}));
  vec2 q = vec2(uv.x * uProporcao, uv.y);
  float sMax = uProporcao * d.x + d.y;
  float tMin = -uProporcao * d.y;
  float sn = dot(q, d) / sMax;
  float tn = (-q.x * d.y + q.y * d.x - tMin) / (d.x - tMin);
  tn += ${f(PC.ONDA)} * sin(sn * 9.0) + ${f(PC.ONDA * 0.4)} * sin(sn * 23.0 + 1.3);
  tn = clamp(tn, 0.0, 0.9999);
  float k = floor(tn * ${f(PC.FAIXAS)});
  float atraso = hash(k + 1.0) * ${f(PC.ESPALHA)};
  float p = clamp((r - atraso) / ${f(1 - PC.ESPALHA)}, 0.0, 1.0);
  if (mod(k, 2.0) > 0.5) sn = 1.0 - sn;
  float cerda = 0.65 * hash(floor(tn * ${f(PC.FAIXAS * PC.FIOS)}) + 37.0)
              + 0.35 * hash(floor(tn * ${f(PC.FAIXAS * PC.FIOS * 2.7)}) + 11.0);
  float m = ${f(PC.CERDA + PC.BORDA)};
  float ponta = -m + (1.0 + 2.0 * m) * p + ${f(PC.CERDA)} * (2.0 * cerda - 1.0);
  return 1.0 - smoothstep(ponta - ${f(PC.BORDA)}, ponta, sn);
}

void main() {
  vec3 cor = uCor;
  float fator = 1.0;
  if (uTemMapa > 0.0) {
    cor = mix(uCor, texture2D(uMapa, vUv).rgb, uTemMapa);
    float forca = uRelevo * uTemMapa;
    if (forca > 0.0) {
      vec2 passo = vec2(PASSO, PASSO * uProporcao);
      float gx = lum(vUv + vec2(passo.x, 0.0)) - lum(vUv - vec2(passo.x, 0.0));
      float gy = lum(vUv + vec2(0.0, passo.y)) - lum(vUv - vec2(0.0, passo.y));
      fator = fatorDeLuz(gx, gy, uLuz - vUv, forca);
    }
  }
  // Em foco (até uBranco.x) a pintura fica inteira; ao longe vira um vulto quase branco, que
  // conserva VIS.residuo da pintura; com o ponteiro sobre ele, ganha um esmaecido mais visível.
  float branco = smoothstep(uBranco.x, uBranco.y, vDist) * ${f(1 - VIS.residuo)};
  branco = mix(branco, min(branco, ${f(VIS.realce)}), uRealce);
  cor = mix(cor, vec3(1.0), branco);
  fator = mix(fator, 1.0, branco); // o branco da distância não ganha relevo
  // Mais longe, o vulto some (alfa 0 entre some[0] e some[1]): sobre o branco não muda nada, e
  // não recorta um retângulo branco na tinta do pincel que está atrás.
  float alfa = uOpacidade * revelacao(vUv, uRevela) * smoothstep(uSurge.x, uSurge.y, vDist) * (1.0 - smoothstep(uSome.x, uSome.y, vDist));
  gl_FragColor = vec4(cor, alfa);
  #include <colorspace_fragment>
  // Depois da conversão para sRGB: o mesmo fator nos três canais da cor exibida mantém a
  // razão R:G:B (matiz e saturação); perto do branco, limitado para nenhum canal saturar.
  vec3 c = gl_FragColor.rgb;
  gl_FragColor.rgb = c * min(fator, 1.0 / max(max(c.r, c.g), max(c.b, 1e-4)));
}`;

export function criarTela(plano, info) {
  const vis = info.visibilidade ?? VIS;
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
      uProporcao: { value: plano.largura / plano.altura },
      uSurge: { value: new THREE.Vector2(...vis.surge) },
      uBranco: { value: new THREE.Vector2(...vis.branco) },
      uSome: { value: new THREE.Vector2(...vis.some) },
      uRealce: { value: 0 },
    },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(plano.largura, plano.altura), material);
  mesh.position.set(plano.x, plano.y, plano.z);
  mesh.userData = { imagem: plano.imagem, stopId: info.stopId, indiceTela: info.indiceTela, perto: vis.surge[0], alcance: vis.some[1] };
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
