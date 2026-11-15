// Texturas das pinturas sob demanda: decodifica fora da linha principal (createImageBitmap),
// envia à GPU assim que chega e descarta o que sai da janela de carregamento. As miniaturas
// (24 px, data URI em images.json, sem pedido de rede) ficam em todas as telas enquanto a
// textura definitiva não chega: ampliadas pelo filtro linear, são a pintura borrada.
import * as THREE from 'three';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// data:image/webp;base64,… → Blob, sem passar por fetch.
function blobDe(uri) {
  const virgula = uri.indexOf(',');
  const tipo = uri.slice(5, virgula).split(';')[0];
  const bin = atob(uri.slice(virgula + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: tipo });
}

// opcoes.renderer: para enviar a textura à GPU na chegada; opcoes.atraso: ms extras por textura (depuração).
export function criarTexturas(images, { renderer = null, atraso = 0 } = {}) {
  const cache = new Map(); // id → { largura, promessa, textura }
  let encerrado = false;

  async function carregar(id, largura, entrada) {
    if (atraso) await espera(atraso);
    const r = await fetch(`./assets/img/${id}-${largura}.webp`);
    if (!r.ok) throw new Error(`Falha ao carregar textura ${id}-${largura}: HTTP ${r.status}`);
    const bitmap = await createImageBitmap(await r.blob(), { imageOrientation: 'flipY', premultiplyAlpha: 'none' });
    // liberada ou trocada no caminho, ou a travessia se desmontou: nada de textura nova
    if (encerrado || cache.get(id) !== entrada) { bitmap.close(); return null; }
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

  // Uma textura por imagem a partir de images[id].mini (pedida uma vez; as chamadas seguintes
  // devolvem a mesma promessa). Sem mipmaps: 24 px ampliados, o borrado é o próprio filtro.
  let minis = null;
  function miniaturas() {
    minis ??= Promise.all(Object.entries(images).map(async ([id, im]) => {
      if (!im.mini) return null;
      const bitmap = await createImageBitmap(blobDe(im.mini), { imageOrientation: 'flipY', premultiplyAlpha: 'none' });
      if (encerrado) { bitmap.close(); return null; }
      const tex = new THREE.Texture(bitmap);
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
      if (renderer) renderer.initTexture(tex);
      return [id, tex];
    })).then((pares) => new Map(pares.filter(Boolean)));
    return minis;
  }

  // Desmontagem: descarta as texturas definitivas e as miniaturas (as que ainda chegarem nem
  // viram textura).
  function encerrar() {
    encerrado = true;
    for (const entrada of cache.values()) descartar(entrada);
    cache.clear();
    minis?.then((mapa) => { for (const tex of mapa.values()) fora(tex); }).catch(() => {});
  }

  return { pedir, liberarForaDe, miniaturas, encerrar };
}
