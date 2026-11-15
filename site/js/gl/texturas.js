// Texturas das pinturas sob demanda: decodifica fora da linha principal (createImageBitmap),
// envia à GPU assim que chega e descarta o que sai da janela de carregamento.
import * as THREE from 'three';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// opcoes.renderer: para enviar a textura à GPU na chegada; opcoes.atraso: ms extras por textura (depuração).
export function criarTexturas(images, { renderer = null, atraso = 0 } = {}) {
  const cache = new Map(); // id → { largura, promessa, textura }

  async function carregar(id, largura, entrada) {
    if (atraso) await espera(atraso);
    const r = await fetch(`./assets/img/${id}-${largura}.webp`);
    if (!r.ok) throw new Error(`Falha ao carregar textura ${id}-${largura}: HTTP ${r.status}`);
    const bitmap = await createImageBitmap(await r.blob(), { imageOrientation: 'flipY', premultiplyAlpha: 'none' });
    if (cache.get(id) !== entrada) { bitmap.close(); return null; } // liberada ou trocada no caminho
    const tex = new THREE.Texture(bitmap);
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    if (renderer) tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.needsUpdate = true;
    if (renderer) renderer.initTexture(tex);
    entrada.textura = tex;
    if (entrada.anterior) { fora(entrada.anterior); entrada.anterior = null; }
    return tex;
  }

  const fora = (tex) => { if (tex) { tex.dispose(); tex.image?.close?.(); } };
  function descartar(entrada) {
    fora(entrada.textura);
    fora(entrada.anterior);
  }

  // Devolve uma promessa da textura (ou null, se ela foi liberada antes de chegar).
  function pedir(id, largura) {
    if (!images[id]) return Promise.reject(new Error(`Imagem ausente em images.json: ${id}`));
    const atual = cache.get(id);
    if (atual && atual.largura === largura) return atual.promessa;
    // Outra largura (janela redimensionada): a textura anterior segue em uso até a nova chegar.
    const entrada = { largura, textura: null, anterior: atual ? (atual.textura ?? atual.anterior) : null };
    cache.set(id, entrada);
    entrada.promessa = carregar(id, largura, entrada);
    return entrada.promessa;
  }

  function liberarForaDe(conjunto) {
    const liberadas = [];
    for (const [id, entrada] of cache) {
      if (conjunto.has(id)) continue;
      cache.delete(id);
      descartar(entrada);
      liberadas.push(id);
    }
    return liberadas;
  }

  return { pedir, liberarForaDe };
}
