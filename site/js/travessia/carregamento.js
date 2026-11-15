// Carregamento progressivo das texturas: só as da janela em torno da parada atual (ou, numa
// viagem longa, as das janelas de partida e de chegada). Tela sem textura definitiva mostra a
// miniatura borrada; sem miniatura ainda (ou a capa durante a revelação), a cor chapada.
// Recebe tudo por parâmetro (sem estado global): linha, stops, images; telas (meshes);
// texturas (gl/texturas.js); gsap; retanguloNoFoco(mesh) → retângulo em px; ativo() → false
// depois da desmontagem (uma textura que chega tarde não é aplicada); semMiniatura(mesh) → true
// enquanto essa tela não deve mostrar a miniatura.
import { texturasNecessarias, larguraPara } from '../core/janela.js';

export function criarCarregamento({ linha, stops, images, telas, texturas, gsap, retanguloNoFoco, ativo, semMiniatura = () => false }) {
  const telasDe = (id) => telas.filter((m) => m.userData.imagem === id);
  let minis = new Map(); // id → textura da miniatura
  let ehMini = new Set();

  // A tela volta à miniatura (ou à cor chapada, se não houver).
  function mostrarMiniatura(m) {
    const u = m.material.uniforms;
    const mini = minis.get(m.userData.imagem);
    gsap.killTweensOf(u.uTemMapa);
    gsap.killTweensOf(u.uMistura);
    u.uMistura.value = 1;
    u.uMapaAnterior.value = null;
    if (mini && !semMiniatura(m)) { u.uMapa.value = mini; u.uTemMapa.value = 1; }
    else { u.uMapa.value = null; u.uTemMapa.value = 0; }
  }
  // Miniaturas nas telas ainda sem textura nenhuma (na chegada delas e no fim da abertura).
  function mostrarMiniaturas() {
    for (const m of telas) if (m.material.uniforms.uMapa.value === null) mostrarMiniatura(m);
  }
  function usarMiniaturas(mapa) {
    minis = mapa;
    ehMini = new Set(mapa.values());
    mostrarMiniaturas();
  }

  // A textura definitiva cobre a miniatura em 0,35 s; sobre outra definitiva (outra largura),
  // troca direto (a anterior já foi descartada); sobre a cor chapada, entra em 0,6 s (a capa,
  // na abertura, entra direto: quem a mostra são as pinceladas).
  function aplicar(id, tex, esmaecer = true) {
    for (const m of telasDe(id)) {
      const u = m.material.uniforms;
      if (u.uMapa.value === tex) continue;
      const anterior = u.uMapa.value;
      u.uMapa.value = tex;
      if (ehMini.has(anterior)) {
        u.uMapaAnterior.value = anterior;
        gsap.killTweensOf(u.uMistura);
        gsap.fromTo(u.uMistura, { value: 0 }, { value: 1, duration: 0.35, ease: 'power1.out',
          onComplete: () => { u.uMapaAnterior.value = null; } });
      }
      if (anterior !== null) continue;
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
  // Pede as texturas de `ids` e libera as demais (a da tela ampliada nunca: fica na maior largura).
  function carregarConjunto(ids) {
    const conjunto = new Set(ids);
    if (imagemDoMergulho !== null) conjunto.add(imagemDoMergulho);
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
      for (const m of telasDe(id)) mostrarMiniatura(m);
    }
  }
  const carregarJanela = (indice) => carregarConjunto(texturasNecessarias(linha, stops, indice));
  // Telas com textura definitiva (nem miniatura nem cor chapada).
  const definitivas = () => telas.filter((m) => {
    const t = m.material.uniforms.uMapa.value;
    return t !== null && !ehMini.has(t);
  }).length;
  return { aplicar, carregarJanela, carregarConjunto, fixarMaxima, usarMiniaturas, mostrarMiniaturas, definitivas };
}
