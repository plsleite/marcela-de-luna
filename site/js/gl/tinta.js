// Camada de tinta do pincel: um alvo de renderização com um ponto de tinta por pixel do canvas
// (tamanhoDoAlvo), em espaço de janela
// (não acompanha câmera nem scroll), desenhado como fundo da cena — antes das telas e sem teste
// de profundidade, de modo que pinturas e texto sempre fiquem por cima.
// Cada movimento deposita carimbos de cerdas a cada 6 px, numa curva entre os pontos médios das
// posições do mouse (o traço não faz quinas); a cada quadro a tinta perde opacidade
// (linear, 0,1 de alfa por segundo): o corpo de uma passada (alfa ≈ 0,75–0,8) some sozinho em
// cerca de 8 s; bordas e cerdas ralas secam antes. Cor guardada em sRGB, pré-multiplicada.
import * as THREE from 'three';
import { carimbosEntre, carimbosNaCurva, gesto, tamanhoDoAlvo } from '../core/pincel.js';

const PASSO = 6;        // px entre carimbos
const LARGURA = 46;     // px, largura do pincel (perpendicular ao gesto)
const COMPRIMENTO = 24; // px, extensão de um carimbo ao longo do gesto
const VIDA = 10000;     // ms para sumir a tinta de alfa 1 (várias passadas sobrepostas)
const ALFA = 0.85;      // tinta de um carimbo (vários se sobrepõem)
const SALTO = 320;      // px: acima disso o ponteiro "pulou" e o traço recomeça
const PAUSA = 250;      // ms parado: o pincel volta carregado
const FECHO = 90;       // ms sem movimento: o traço vai até o mouse
const MAX = 512;        // carimbos por desenho

// Textura das cerdas (canvas 2D): x ao longo do gesto, y através do pincel. Cada linha é uma
// cerda com força própria; algumas falham; as bordas são mais ralas e irregulares. O desenho é
// sempre o de 64×40; com `fator` 2 cada ponto vira um bloco de 2×2 (mesmas cerdas, bordas mais
// nítidas quando o alvo tem mais de um ponto de tinta por ponto de tela).
function texturaDeCerdas(fator = 1) {
  const W = 64, H = 40;
  const cv = document.createElement('canvas');
  cv.width = W * fator; cv.height = H * fator;
  const ctx = cv.getContext('2d');
  let s = 21;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const linhas = [];
  let corpo = 0.72;
  for (let y = 0; y < H; y++) {
    corpo = 0.5 * corpo + 0.5 * (0.64 + 0.16 * rnd());       // carga que varia devagar
    const r = rnd();
    let f = corpo;
    if (r < 0.3) f = corpo + 0.2;                             // cerda cheia: risco escuro
    else if (r < 0.4) f = corpo * 0.55;                       // cerda rala: risco claro
    const v = y / (H - 1);
    const borda = Math.min(1, v / 0.18, (1 - v) / 0.18);      // borda rala…
    if (borda < 1) f *= borda * (rnd() < 0.35 ? 0.2 : 0.6 + 0.4 * rnd()); // …e irregular
    linhas.push(Math.max(0, Math.min(1, f)));
  }
  const img = ctx.createImageData(W * fator, H * fator);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const g = Math.round(255 * linhas[y] * (0.88 + 0.12 * rnd())); // leve grão ao longo
      for (let yy = y * fator; yy < (y + 1) * fator; yy++) {
        for (let xx = x * fator; xx < (x + 1) * fator; xx++) {
          const i = (yy * W * fator + xx) * 4;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = g;
          img.data[i + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

const telaCheia = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }`;

// Perda de opacidade preservando a cor (o alfa cai, a cor pura fica).
const fragPerda = /* glsl */`
uniform sampler2D uAnterior;
uniform float uPerda;
varying vec2 vUv;
void main() {
  vec4 t = texture2D(uAnterior, vUv);
  float a = max(t.a - uPerda, 0.0);
  gl_FragColor = t.a > 0.0 ? t * (a / t.a) : vec4(0.0);
}`;

// Um carimbo girado pelo gesto; a secura tira as cerdas fracas. vAoLongo é a distância (px de
// janela) ao longo do traço: cada cerda falha e volta ao longo do caminho, igual em carimbos
// sobrepostos (o ruído depende do traço, não do carimbo).
const vertCarimbo = /* glsl */`
attribute vec2 aCentro;
attribute float aDist;
attribute vec2 aTam;
attribute float aAng;
attribute vec3 aCor;
attribute vec2 aSecaCarga;
varying vec2 vUv;
varying vec3 vCor;
varying vec2 vSecaCarga;
varying float vAoLongo;
void main() {
  vUv = uv;
  vCor = aCor;
  vSecaCarga = aSecaCarga;
  vAoLongo = aDist + position.x * ${COMPRIMENTO.toFixed(1)};
  vec2 p = position.xy * aTam;
  float c = cos(aAng), s = sin(aAng);
  vec2 q = aCentro + vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  gl_Position = projectionMatrix * vec4(q, 0.0, 1.0);
}`;
const fragCarimbo = /* glsl */`
uniform sampler2D uCerdas;
varying vec2 vUv;
varying vec3 vCor;
varying vec2 vSecaCarga;
varying float vAoLongo;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float f = texture2D(uCerdas, vUv).r;
  float cerda = floor(vUv.y * 40.0);
  float l = vAoLongo / 34.0 + hash(vec2(cerda, 7.0)) * 10.0;
  float n = mix(hash(vec2(cerda, floor(l))), hash(vec2(cerda, floor(l) + 1.0)), smoothstep(0.0, 1.0, fract(l)));
  f *= mix(1.0, mix(0.25, 1.2, n), 0.55 + 0.45 * vSecaCarga.x);
  float ao_longo = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
  float a = f * smoothstep(vSecaCarga.x, vSecaCarga.x + 0.25, f) * ao_longo * vSecaCarga.y * ${ALFA.toFixed(3)};
  gl_FragColor = vec4(vCor * a, a);
}`;

// Exibição sobre o branco, com um relevo leve das cerdas (luz de cima à esquerda).
const fragExibe = /* glsl */`
uniform sampler2D uTinta;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  vec4 t = texture2D(uTinta, vUv);
  if (t.a < 0.003) discard;
  float aE = texture2D(uTinta, vUv - vec2(uTexel.x, 0.0)).a;
  float aD = texture2D(uTinta, vUv + vec2(uTexel.x, 0.0)).a;
  float aB = texture2D(uTinta, vUv - vec2(0.0, uTexel.y)).a;
  float aC = texture2D(uTinta, vUv + vec2(0.0, uTexel.y)).a;
  float relevo = clamp((aE - aD) + (aC - aB), -1.0, 1.0);
  vec3 cor = clamp(t.rgb / t.a * (1.0 + 0.06 * relevo), 0.0, 1.0);
  gl_FragColor = vec4(cor * t.a, t.a);
}`;

const preMultiplicado = (m) => {
  m.blending = THREE.CustomBlending;
  m.blendSrc = THREE.OneFactor;
  m.blendDst = THREE.OneMinusSrcAlphaFactor;
  m.blendEquation = THREE.AddEquation;
  return m;
};

// opcoes.forca(x, y, meiaLargura): 0..1, quanto da tinta o pincel deposita ali (0 sobre as telas,
// menos sobre os parágrafos); meiaLargura é a do carimbo em px de janela.
export function criarTinta(palco, { forca = () => 1 } = {}) {
  const { renderer, cena } = palco;
  const flutuante = renderer.extensions.has('EXT_color_buffer_float')
    || renderer.extensions.has('EXT_color_buffer_half_float');
  // Em 8 bits a perda por quadro some no arredondamento: acumula até dar dois degraus.
  const perdaMinima = flutuante ? 0 : 2 / 255;

  let cerdas = null, fatorCerdas = 0; // a textura acompanha a resolução do alvo
  const quad = new THREE.PlaneGeometry(1, 1);
  const camOrto = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);

  // Carimbos instanciados.
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = quad.index;
  geo.setAttribute('position', quad.getAttribute('position'));
  geo.setAttribute('uv', quad.getAttribute('uv'));
  const attr = (n) => new THREE.InstancedBufferAttribute(new Float32Array(MAX * n), n).setUsage(THREE.DynamicDrawUsage);
  const aCentro = attr(2), aDist = attr(1), aTam = attr(2), aAng = attr(1), aCor = attr(3), aSecaCarga = attr(2);
  Object.entries({ aCentro, aDist, aTam, aAng, aCor, aSecaCarga }).forEach(([k, a]) => geo.setAttribute(k, a));
  geo.instanceCount = 0;
  const matCarimbo = preMultiplicado(new THREE.ShaderMaterial({
    vertexShader: vertCarimbo, fragmentShader: fragCarimbo,
    uniforms: { uCerdas: { value: null } }, depthTest: false, depthWrite: false, transparent: true,
  }));
  const carimbos = new THREE.Mesh(geo, matCarimbo);
  carimbos.frustumCulled = false;
  const cenaCarimbos = new THREE.Scene();
  cenaCarimbos.add(carimbos);

  const matPerda = new THREE.ShaderMaterial({
    vertexShader: telaCheia, fragmentShader: fragPerda,
    uniforms: { uAnterior: { value: null }, uPerda: { value: 0 } },
    blending: THREE.NoBlending, depthTest: false, depthWrite: false,
  });
  const passoPerda = new THREE.Mesh(quad, matPerda);
  passoPerda.frustumCulled = false;
  const cenaPerda = new THREE.Scene();
  cenaPerda.add(passoPerda);

  const matExibe = preMultiplicado(new THREE.ShaderMaterial({
    vertexShader: telaCheia, fragmentShader: fragExibe,
    uniforms: { uTinta: { value: null }, uTexel: { value: new THREE.Vector2() } },
    transparent: true, depthTest: false, depthWrite: false,
  }));
  const exibe = new THREE.Mesh(quad, matExibe);
  exibe.frustumCulled = false;
  exibe.renderOrder = -1000; // fundo: antes de todas as telas
  exibe.visible = false;
  cena.add(exibe);

  // Dois alvos alternados (a perda lê um e escreve no outro).
  let alvos = [];
  let escala = 1; // px de janela → px do alvo
  const corLimpa = new THREE.Color();
  function limpar(rt) {
    const alfa = renderer.getClearAlpha();
    renderer.getClearColor(corLimpa);
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(rt);
    renderer.clear(true, false, false);
    renderer.setRenderTarget(null);
    renderer.setClearColor(corLimpa, alfa);
  }
  function redimensionar() {
    for (const rt of alvos) rt.dispose();
    const tam = renderer.getSize(new THREE.Vector2());
    const { w, h } = tamanhoDoAlvo(tam.x, tam.y, renderer.getPixelRatio());
    escala = w / innerWidth;
    const fator = escala > 1 ? 2 : 1;
    if (fator !== fatorCerdas) {
      cerdas?.dispose();
      cerdas = texturaDeCerdas(fator);
      fatorCerdas = fator;
      matCarimbo.uniforms.uCerdas.value = cerdas;
    }
    alvos = [0, 1].map(() => new THREE.WebGLRenderTarget(w, h, {
      type: flutuante ? THREE.HalfFloatType : THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      depthBuffer: false, stencilBuffer: false, generateMipmaps: false,
    }));
    alvos.forEach(limpar);
    camOrto.right = w; camOrto.top = h; camOrto.updateProjectionMatrix();
    // relevo medido a 1 px de janela, qualquer que seja a resolução do alvo
    matExibe.uniforms.uTexel.value.set(escala / w, escala / h);
    matExibe.uniforms.uTinta.value = alvos[0].texture;
    viva = 0;
    exibe.visible = false;
  }

  let viva = 0;          // ms até a última tinta sumir (0: camada vazia, nada a fazer)
  let perdaPendente = 0;
  let fila = 0;          // carimbos à espera do próximo quadro
  let ultimo = null;     // { x, y } do último carimbo; t, px, py, hex do último evento
  let velocidade = 0;    // px/ms, suavizada
  let percurso = 0;      // px desde a última pausa (a tinta vai gastando)
  let distancia = 0;     // px ao longo do traço (para o ruído das cerdas)
  let semente = 3;
  const rnd = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);

  function enfileirar(p, cor, g, f) {
    if (fila >= MAX) return;
    const i = fila++;
    aCentro.setXY(i, p.x * escala, (innerHeight - p.y) * escala); // alvo com y para cima
    aAng.setX(i, -p.ang);
    aDist.setX(i, distancia);
    aTam.setXY(i, COMPRIMENTO * escala, LARGURA * g.escala * escala);
    aCor.setXYZ(i, cor.r, cor.g, cor.b);
    // cada carimbo falha cerdas um pouco diferentes: o traço não sai como uma fita regular
    aSecaCarga.setXY(i, Math.min(0.9, g.seca + 0.14 * rnd()), g.carga * f * (0.85 + 0.15 * rnd()));
  }

  const cor = { r: 0, g: 0, b: 0 };
  const canal = (hex, i) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255;
  function depositar(cs, hex) {
    if (!cs.length) return;
    // sRGB direto (#rrggbb): a camada não converte espaço de cor
    cor.r = canal(hex, 0); cor.g = canal(hex, 1); cor.b = canal(hex, 2);
    const g = gesto(velocidade, percurso);
    for (const p of cs) {
      distancia = (distancia + PASSO) % 30000; // limitado: precisão do ruído na GPU
      const f = forca(p.x, p.y, (LARGURA / 2) * g.escala);
      if (f > 0) enfileirar(p, cor, g, f);
    }
    const fim = cs.at(-1);
    ultimo.x = fim.x; ultimo.y = fim.y;
  }
  // Mouse parado: o último meio trecho (do último carimbo até o mouse) é desenhado em linha reta,
  // na direção em que a curva já chegava. O próximo movimento continua do último carimbo.
  function fechar() {
    if (ultimo) depositar(carimbosEntre(ultimo, { x: ultimo.px, y: ultimo.py }, PASSO), ultimo.hex);
  }
  const tinta = {
    ativa: true,
    // Um movimento do ponteiro em (x, y) px de janela, com a cor da tela vizinha (#rrggbb), no
    // instante t (timeStamp do evento; os eventos agrupados de um quadro têm cada um o seu).
    pintar(x, y, hex, t = performance.now()) {
      if (!tinta.ativa || !hex) { ultimo = null; return; }
      if (!ultimo || Math.hypot(x - ultimo.px, y - ultimo.py) > SALTO) {
        ultimo = { x, y, t, px: x, py: y, hex };
        percurso = 0;
        return;
      }
      const dt = Math.max(1, t - ultimo.t);
      const d = Math.hypot(x - ultimo.px, y - ultimo.py);
      // suavização por tempo: com eventos agrupados (vários por quadro) fica igual à de um por quadro
      velocidade += (d / dt - velocidade) * (1 - 0.65 ** Math.min(1, dt / 16.7));
      percurso = dt > PAUSA ? 0 : percurso + d;
      // curva do último carimbo até o meio entre a posição anterior e esta, com a anterior de
      // controle: emenda na mesma direção do trecho de antes
      const meio = { x: (ultimo.px + x) / 2, y: (ultimo.py + y) / 2 };
      const cs = carimbosNaCurva(ultimo, { x: ultimo.px, y: ultimo.py }, meio, PASSO);
      ultimo.t = t; ultimo.px = x; ultimo.py = y; ultimo.hex = hex;
      depositar(cs, hex);
    },
    // O traço termina (ponteiro saiu da janela, mergulho etc.).
    romper() { ultimo = null; velocidade = 0; percurso = 0; },
    redimensionar,
    liberar() {
      cena.remove(exibe);
      for (const rt of alvos) rt.dispose();
      alvos = [];
      [geo, quad].forEach((g) => g.dispose());
      [matCarimbo, matPerda, matExibe].forEach((m) => m.dispose());
      cerdas?.dispose();
      cerdas = null; fatorCerdas = 0;
    },
  };

  redimensionar();

  palco.aoQuadro((t, dt) => {
    if (!tinta.ativa) { ultimo = null; fila = 0; }
    if (ultimo && performance.now() - ultimo.t > FECHO) fechar();
    if (viva <= 0 && fila === 0) return; // camada vazia: custo zero
    perdaPendente += dt / VIDA;
    if (perdaPendente > perdaMinima && viva > 0) {
      matPerda.uniforms.uAnterior.value = alvos[0].texture;
      matPerda.uniforms.uPerda.value = perdaPendente;
      renderer.setRenderTarget(alvos[1]);
      renderer.render(cenaPerda, camOrto);
      alvos.reverse();
      perdaPendente = 0;
    }
    viva -= dt;
    if (fila > 0) {
      for (const a of [aCentro, aDist, aTam, aAng, aCor, aSecaCarga]) {
        a.clearUpdateRanges();
        a.addUpdateRange(0, fila * a.itemSize);
        a.needsUpdate = true;
      }
      geo.instanceCount = fila;
      const auto = renderer.autoClear;
      renderer.autoClear = false;
      renderer.setRenderTarget(alvos[0]);
      renderer.render(cenaCarimbos, camOrto);
      renderer.autoClear = auto;
      fila = 0;
      viva = VIDA;
    }
    renderer.setRenderTarget(null);
    matExibe.uniforms.uTinta.value = alvos[0].texture;
    exibe.visible = viva > 0;
    if (viva <= 0) { alvos.forEach(limpar); perdaPendente = 0; } // nada fica para trás
  });

  return tinta;
}
