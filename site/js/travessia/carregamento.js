// Carregamento progressivo das texturas: só as da janela em torno da parada atual.
// Recebe tudo por parâmetro (sem estado global): linha, stops, images; telas (meshes);
// texturas (gl/texturas.js); gsap; retanguloNoFoco(mesh) → retângulo em px; ativo() → false
// depois da desmontagem (uma textura que chega tarde não é aplicada).
import { texturasNecessarias, larguraPara } from '../core/janela.js';

export function criarCarregamento({ linha, stops, images, telas, texturas, gsap, retanguloNoFoco, ativo }) {
  const telasDe = (id) => telas.filter((m) => m.userData.imagem === id);
  // esmaecer: a primeira textura entra sobre a cor dominante em 0,6 s (a capa, na abertura,
  // entra direto: quem a mostra são as pinceladas).
  function aplicar(id, tex, esmaecer = true) {
    for (const m of telasDe(id)) {
      const u = m.material.uniforms;
      if (u.uMapa.value === tex) continue;
      const jaTinha = u.uMapa.value !== null;
      u.uMapa.value = tex;
      if (jaTinha) continue;
      if (esmaecer) gsap.fromTo(u.uTemMapa, { value: 0 }, { value: 1, duration: 0.6, ease: 'power1.out' });
      else u.uTemMapa.value = 1;
    }
  }
  // Durante o mergulho, a pintura aberta fica na maior largura disponível.
  let imagemDoMergulho = null;
  const larguraMaxima = (id) => images[id].larguras.at(-1);
  // fixarMaxima(id): a pintura passa a ficar na maior largura e já a pede; fixarMaxima(null)
  // solta (a próxima carregarJanela volta à largura da janela).
  function fixarMaxima(id) {
    imagemDoMergulho = id;
    if (id === null) return;
    texturas.pedir(id, larguraMaxima(id))
      .then((tex) => { if (tex && ativo()) aplicar(id, tex); })
      .catch((erro) => console.error(erro));
  }
  function carregarJanela(indice) {
    const conjunto = texturasNecessarias(linha, stops, indice);
    const dpr = Math.min(devicePixelRatio, 2);
    for (const id of conjunto) {
      const m = telasDe(id)[0];
      if (!m) continue;
      const r = retanguloNoFoco(m);
      const largura = id === imagemDoMergulho ? larguraMaxima(id) : larguraPara(r.dir - r.esq, dpr, images[id].larguras);
      texturas.pedir(id, largura)
        .then((tex) => { if (tex && ativo()) aplicar(id, tex); })
        .catch((erro) => console.error(erro));
    }
    for (const id of texturas.liberarForaDe(conjunto)) {
      for (const m of telasDe(id)) {
        const u = m.material.uniforms;
        gsap.killTweensOf(u.uTemMapa);
        u.uTemMapa.value = 0;
        u.uMapa.value = null;
      }
    }
  }
  return { aplicar, carregarJanela, fixarMaxima };
}
