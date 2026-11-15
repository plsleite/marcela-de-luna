// Títulos grandes que se enchem de tinta: cada letra de .titulo-secao (menos a da capa, branca
// sobre a pintura) vira um <span class="letra">; quando o pincel passa a menos de 40 px, ela ganha
// .pintada e a pintura aparece por trás de uma pincelada que corre no sentido do gesto (450 ms,
// em travessia.css). A letra fica pintada. O título inteiro segue no aria-label.
import { carimbosEntre, distanciaAoRetangulo } from '../core/pincel.js';

const RAIO = 40;     // px do ponteiro à letra
const AMOSTRA = 10;  // px entre pontos testados num movimento rápido
const SALTO = 320;   // px: o ponteiro "pulou" (não passou pelo meio)
const SELETOR = '.parada--texto .titulo-secao, .parada--abertura .titulo-secao, .parada--detalhe .titulo-secao';

// Pincelada (SVG embutido, 300×100, estica sobre a letra): tinta preta de um lado, borda de
// cerdas irregular, transparente do outro. Deslizada sobre a letra, revela a pintura de baixo.
export function pincelada(paraDireita) {
  let s = 11;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  let rects = '<rect x="140" y="0" width="160" height="100"/>';
  for (let y = 0; y < 100; y += 4) {
    const x = 100 + 40 * rnd();
    rects += `<rect x="${x.toFixed(1)}" y="${y}" width="${(300 - x).toFixed(1)}" height="${(2 + 2.6 * rnd()).toFixed(1)}"/>`;
  }
  const g = paraDireita ? rects : `<g transform="matrix(-1 0 0 1 300 0)">${rects}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" preserveAspectRatio="none">${g}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function grafemas(palavra) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter('pt', { granularity: 'grapheme' }).segment(palavra)].map((x) => x.segment);
  }
  return Array.from(palavra);
}

// Letras agrupadas por palavra (a palavra não quebra na mudança de linha; os espaços ficam
// como texto, então o espaçamento do título não muda).
function separar(titulo) {
  const texto = titulo.textContent;
  titulo.setAttribute('aria-label', texto);
  const frag = document.createDocumentFragment();
  for (const pedaco of texto.split(/(\s+)/)) {
    if (!pedaco) continue;
    if (/^\s+$/.test(pedaco)) { frag.append(pedaco); continue; }
    const palavra = document.createElement('span');
    palavra.className = 'titulo-palavra';
    palavra.setAttribute('aria-hidden', 'true');
    for (const g of grafemas(pedaco)) {
      const letra = document.createElement('span');
      letra.className = 'letra';
      letra.textContent = g;
      palavra.append(letra);
    }
    frag.append(palavra);
  }
  titulo.replaceChildren(frag);
  return { titulo, texto, letras: [...titulo.querySelectorAll('.letra')] };
}

export function criarPreenchimento(raiz) {
  const html = document.documentElement;
  html.style.setProperty('--pincelada-dir', pincelada(true));
  html.style.setProperty('--pincelada-esq', pincelada(false));
  const titulos = [...raiz.querySelectorAll(SELETOR)].map(separar);
  let ultimo = null;

  // A pintura é contínua no título: cada letra mostra o pedaço que lhe cabe.
  function encaixar(t, letra) {
    const tr = t.titulo.getBoundingClientRect();
    const lr = letra.getBoundingClientRect();
    letra.style.setProperty('--tinta-larg', `${tr.width.toFixed(1)}px`);
    letra.style.setProperty('--bx', `${(tr.left - lr.left).toFixed(1)}px`);
    letra.style.setProperty('--by', `${(tr.top - lr.top).toFixed(1)}px`);
  }

  // Caixa do desenho da letra (não a da linha, que é bem mais alta): a altura sai das métricas
  // da fonte no canvas; guardada por tamanho de fonte.
  const regua = document.createElement('canvas').getContext('2d');
  function caixaDoGlifo(letra) {
    const r = letra.getBoundingClientRect();
    const fonte = getComputedStyle(letra).font;
    if (letra._glifo?.fonte !== fonte) {
      regua.font = fonte;
      const m = regua.measureText(letra.textContent);
      const topo = m.fontBoundingBoxAscent - m.actualBoundingBoxAscent;
      const base = m.fontBoundingBoxAscent + m.actualBoundingBoxDescent;
      // métricas indisponíveis: fica a caixa da linha
      letra._glifo = Number.isFinite(topo + base) && base > topo ? { fonte, topo, base } : { fonte, topo: 0, base: r.height };
    }
    return { esq: r.left, dir: r.right, topo: r.top + letra._glifo.topo, base: r.top + letra._glifo.base };
  }

  function pintar(t, letra, paraDireita) {
    encaixar(t, letra);
    letra.dataset.dir = paraDireita ? 'dir' : 'esq';
    getComputedStyle(letra).backgroundPosition; // fixa o ponto de partida da pincelada
    letra.classList.add('pintada');
  }

  return {
    // Movimento do ponteiro (px de janela): pinta as letras tocadas dos títulos visíveis.
    tocar(x, y) {
      const a = ultimo && Math.hypot(x - ultimo.x, y - ultimo.y) <= SALTO ? ultimo : { x, y };
      ultimo = { x, y };
      const pontos = [{ x, y }, ...carimbosEntre(a, { x, y }, AMOSTRA)];
      const paraDireita = x >= a.x;
      for (const t of titulos) {
        if (!t.titulo.closest('.em-foco')) continue;
        const b = t.titulo.getBoundingClientRect();
        const caixa = { esq: b.left, dir: b.right, topo: b.top, base: b.bottom };
        if (pontos.every((p) => distanciaAoRetangulo(p.x, p.y, caixa) >= RAIO)) continue;
        for (const letra of t.letras) {
          if (letra.classList.contains('pintada')) continue;
          const rl = caixaDoGlifo(letra);
          if (pontos.some((p) => distanciaAoRetangulo(p.x, p.y, rl) < RAIO)) pintar(t, letra, paraDireita);
        }
      }
    },
    romper() { ultimo = null; },
    // A janela mudou: as letras já pintadas reencaixam a pintura.
    reposicionar() {
      for (const t of titulos) for (const l of t.letras) if (l.classList.contains('pintada')) encaixar(t, l);
    },
    // Volta os títulos ao texto original (página base).
    desfazer() {
      for (const t of titulos) { t.titulo.textContent = t.texto; t.titulo.removeAttribute('aria-label'); }
      html.style.removeProperty('--pincelada-dir');
      html.style.removeProperty('--pincelada-esq');
    },
  };
}
