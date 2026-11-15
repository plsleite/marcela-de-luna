// Pincel (só com mouse): tinta no fundo branco, na cor viva da tela da parada atual, e letras
// dos títulos que se enchem de pintura. Não deposita sobre as telas; passa por baixo de todo
// texto, mais leve sobre os parágrafos da parada em foco (para não atrapalhar a leitura), e não
// chega aos controles marcados com data-barra-tinta (nome, som, fileira).
// Recebe tudo por parâmetro: palco, raiz, telas, porId (Map id → stop), images, estado
// (estado.id, estado.mergulho), criarTinta (gl/tinta.js), criarPreenchimento (ui/preenchimento.js)
// e retanguloProjetado (gl/tela.js).
import { aoAlcance } from '../core/janela.js';
import { corDaParada, distanciaAoRetangulo, forcaJuntoAosControles, forcaSobreTexto } from '../core/pincel.js';

export function montarPincel({ palco, raiz, telas, porId, images, estado, criarTinta, criarPreenchimento, retanguloProjetado }) {
  const p = { obstaculos: null };
  function obstaculos() {
    const telasNaJanela = [];
    const cz = palco.camera.position.z;
    for (const m of telas) {
      const d = cz - m.position.z; // telas visíveis (nem rente à câmera nem sumidas no branco,
      // nem a do cartão final que está de costas, nem com opacidade 0: ver travessia/cartao.js)
      if (m.visible && m.material.uniforms.uOpacidade.value > 0 && aoAlcance(d, m.userData.perto, m.userData.alcance)) {
        telasNaJanela.push(retanguloProjetado(m, palco.camera));
      }
    }
    const paragrafos = [...raiz.querySelectorAll('.em-foco .corpo')].map((el) => {
      const b = el.getBoundingClientRect();
      return { esq: b.left, dir: b.right, topo: b.top, base: b.bottom };
    });
    // lidos a cada quadro (o cache é limpo em limparObstaculos): os controles podem aparecer,
    // sumir, mudar de tamanho ou de lugar; os invisíveis (visibility, opacidade 0) não barram
    const controles = [];
    for (const el of document.querySelectorAll('[data-barra-tinta]')) {
      if (!visivel(el)) continue;
      const b = el.getBoundingClientRect();
      if (b.width > 0 && b.height > 0) controles.push({ esq: b.left, dir: b.right, topo: b.top, base: b.bottom });
    }
    return { telasNaJanela, paragrafos, controles };
  }
  function visivel(el) {
    // os nomes antigos das opções também: Chrome 105–120 e Firefox 106–124 só conhecem esses
    if (el.checkVisibility) return el.checkVisibility({ opacityProperty: true, visibilityProperty: true, checkOpacity: true, checkVisibilityCSS: true });
    const cs = getComputedStyle(el);
    return cs.visibility === 'visible' && cs.display !== 'none' && Number(cs.opacity) > 0;
  }
  // meia: meia largura do carimbo (px de janela); só os controles a usam
  const forca = (x, y, meia = 0) => {
    const o = (p.obstaculos ??= obstaculos());
    if (o.telasNaJanela.some((r) => distanciaAoRetangulo(x, y, r) === 0)) return 0;
    const c = o.controles.length ? forcaJuntoAosControles({ x, y }, o.controles, { meiaLargura: meia }) : 1;
    return c > 0 ? Math.min(c, forcaSobreTexto({ x, y }, o.paragrafos, { dentro: 0.3, faixa: 40 })) : 0;
  };
  const tinta = criarTinta(palco, { forca });
  const preenchimento = criarPreenchimento(raiz);
  const aoMover = (e) => {
    if (e.pointerType !== 'mouse' || estado.mergulho) return;
    const cor = corDaParada(porId.get(estado.id), images);
    // os movimentos agrupados no quadro dão a curva inteira, não só o último ponto
    const evs = e.getCoalescedEvents?.() ?? [];
    for (const ev of evs.length ? evs : [e]) tinta.pintar(ev.clientX, ev.clientY, cor, ev.timeStamp);
    preenchimento.tocar(e.clientX, e.clientY);
  };
  const aoSair = (e) => { if (!e.relatedTarget) { tinta.romper(); preenchimento.romper(); } };
  addEventListener('pointermove', aoMover, { passive: true });
  document.addEventListener('mouseout', aoSair, { passive: true });
  const soltar = () => {
    removeEventListener('pointermove', aoMover);
    document.removeEventListener('mouseout', aoSair);
  };
  return {
    tinta,
    preenchimento,
    limparObstaculos() { p.obstaculos = null; }, // a câmera e os textos podem ter mudado
    // Cada passo no seu try/catch: um que falha não impede os outros.
    encerrar() {
      for (const passo of [soltar, () => tinta.liberar(), () => preenchimento.desfazer()]) {
        try { passo(); } catch (e) { console.error(e); }
      }
    },
  };
}
