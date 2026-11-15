#!/usr/bin/env python3
"""Extração e otimização das imagens do portfólio.

Uso (a partir da raiz do projeto):
  /usr/bin/python3 tools/extract.py texto   -> tools/pdf-text.txt
  /usr/bin/python3 tools/extract.py propor  -> rasteriza as páginas no cache e propõe tools/crops.json
  /usr/bin/python3 tools/extract.py gerar   -> site/assets/img/<id>-<largura>.webp e site/data/images.json

Entradas de tools/crops.json:
  {"pNN-a": {"pagina": N, "rect": [x0, y0, x1, y1]}}
      rect em frações da página rasterizada.
  {"pNN-a": {"pagina": N, "fonte": "embutida", "indice": I, "rot": 0|90|180|270, "rect": [...]}}
      I é o número da imagem em `pdfimages -list`; rot é o giro em graus no
      sentido horário; rect é fração da foto já girada. A foto é convertida do
      perfil ICC do PDF para sRGB, como na página rasterizada.
"""
import base64
import io
import json
import mmap
import os
import re
import subprocess
import sys
import zlib
from pathlib import Path

from PIL import Image, ImageChops, ImageCms

Image.MAX_IMAGE_PIXELS = None

RAIZ = Path(__file__).resolve().parent.parent
PDF = RAIZ / 'portfolio_marceladeluna_001_ml.pdf'
CACHE = Path.home() / 'Library' / 'Caches' / 'marcela-de-luna-site'
CROPS = RAIZ / 'tools' / 'crops.json'
TEXTO = RAIZ / 'tools' / 'pdf-text.txt'
SAIDA_IMG = RAIZ / 'site' / 'assets' / 'img'
SAIDA_JSON = RAIZ / 'site' / 'data' / 'images.json'

LARGURAS = [640, 1280, 2560]
QUALIDADE = 82
MINI = 24
PAGINAS_150DPI = set(range(24, 40)) | set(range(50, 58))


# ---------- funções puras ----------

def caixa_nao_branca(im, limiar=245):
    """Caixa (x0, y0, x1, y1) dos pixels com algum canal abaixo do limiar."""
    rgb = im.convert('RGB')
    mascara = None
    for canal in rgb.split():
        m = canal.point(lambda v: 255 if v < limiar else 0)
        mascara = m if mascara is None else ImageChops.lighter(mascara, m)
    return mascara.getbbox()


def cor_dominante(im, limiar=245):
    """Cor mais frequente (#rrggbb) após quantizar em 8 cores, ignorando branco."""
    rgb = im.convert('RGB')
    rgb.thumbnail((200, 200))
    q = rgb.quantize(colors=8, method=Image.Quantize.MEDIANCUT)
    idx = list(q.getdata())
    px = list(rgb.getdata())
    soma = {}
    for i, (r, g, b) in zip(idx, px):
        s = soma.setdefault(i, [0, 0, 0, 0])
        s[0] += r; s[1] += g; s[2] += b; s[3] += 1
    melhor = None
    for i, (r, g, b, n) in soma.items():
        media = (round(r / n), round(g / n), round(b / n))
        if min(media) > limiar:
            continue
        if melhor is None or n > melhor[0]:
            melhor = (n, media)
    if melhor is None:
        media = (255, 255, 255)
    else:
        media = melhor[1]
    return '#%02x%02x%02x' % media


def larguras_para(w):
    """640, 1280, 2560, trocando a última pela largura real quando a fonte for menor."""
    if w >= LARGURAS[-1]:
        return list(LARGURAS)
    return [x for x in LARGURAS if x < w] + [w]


def recortar(im, rect):
    """Recorta im por rect = [x0, y0, x1, y1] em frações da imagem."""
    w, h = im.size
    x0, y0, x1, y1 = rect
    return im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))


def girar(im, rot):
    """Gira im em graus no sentido horário (0, 90, 180, 270)."""
    rot = rot % 360
    if rot == 0:
        return im
    return im.transpose({90: Image.Transpose.ROTATE_270,
                         180: Image.Transpose.ROTATE_180,
                         270: Image.Transpose.ROTATE_90}[rot])


# ---------- acesso ao PDF (com cache) ----------

def dpi_da_pagina(n):
    return 150 if n in PAGINAS_150DPI else 300


def pagina_rasterizada(n):
    """Caminho do JPEG da página n no cache; rasteriza só se ainda não existir."""
    dpi = dpi_da_pagina(n)
    destino = CACHE / 'paginas' / f'p{n:02d}-{dpi}.jpg'
    if destino.exists():
        return destino
    destino.parent.mkdir(parents=True, exist_ok=True)
    base = destino.with_suffix('')
    subprocess.run(['pdftoppm', '-r', str(dpi), '-f', str(n), '-l', str(n),
                    '-jpeg', '-jpegopt', 'quality=95', '-singlefile',
                    str(PDF), str(base) + '.tmp'], check=True)
    os.replace(str(base) + '.tmp.jpg', destino)
    return destino


def lista_imagens():
    """[(pagina, indice, objeto)] conforme `pdfimages -list`."""
    saida = subprocess.run(['pdfimages', '-list', str(PDF)], check=True,
                           capture_output=True, text=True).stdout
    itens = []
    for linha in saida.splitlines():
        m = re.match(r'\s*(\d+)\s+(\d+)\s+image(?:\s+\S+){7}\s+(\d+)\s+\d+\s', linha)
        if m:
            itens.append((int(m.group(1)), int(m.group(2)), int(m.group(3))))
    return itens


def objeto_pdf(dados, xref, n):
    """(dicionário, conteúdo do stream decodificado ou None) do objeto n."""
    ini = xref[n]
    fim = dados.find(b'endobj', ini)
    corpo = dados[ini:fim]
    i = corpo.find(b'stream')
    if i < 0:
        return corpo, None
    dic = corpo[:i]
    j = i + 6
    j += 2 if corpo[j:j + 2] == b'\r\n' else 1
    tam = int(re.search(rb'/Length\s+(\d+)', dic).group(1))
    conteudo = corpo[j:j + tam]
    if b'/FlateDecode' in dic:
        conteudo = zlib.decompress(conteudo)
    return dic, conteudo


def perfil_icc(objeto):
    """Bytes do perfil ICC do espaço de cor da imagem `objeto` (tabela xref do PDF)."""
    with open(PDF, 'rb') as f:
        dados = mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ)
        pos = int(re.search(rb'startxref\s+(\d+)', dados[-1024:]).group(1))
        cab = re.match(rb'xref\s+0 (\d+)\s+', dados[pos:pos + 64])
        base = pos + cab.end()
        xref = {}
        for n in range(int(cab.group(1))):
            linha = dados[base + 20 * n: base + 20 * n + 20]
            if linha[17:18] == b'n':
                xref[n] = int(linha[:10])
        dic, _ = objeto_pdf(dados, xref, objeto)
        cs = re.search(rb'/ColorSpace\s+(\d+) 0 R', dic)
        if not cs:
            return None
        arr, _ = objeto_pdf(dados, xref, int(cs.group(1)))
        icc = re.search(rb'/ICCBased (\d+) 0 R', arr)
        if not icc:
            return None
        return objeto_pdf(dados, xref, int(icc.group(1)))[1]


def para_srgb(im, icc):
    """Converte im do perfil `icc` para sRGB (a página rasterizada já sai em sRGB)."""
    if not icc:
        return im
    perfil = ImageCms.ImageCmsProfile(io.BytesIO(icc))
    if 'sRGB' in (ImageCms.getProfileDescription(perfil) or ''):
        return im
    return ImageCms.profileToProfile(im, perfil, ImageCms.createProfile('sRGB'),
                                     renderingIntent=ImageCms.Intent.RELATIVE_COLORIMETRIC)


def imagem_embutida(pagina, indice):
    """Caminho da imagem embutida `indice` (numeração de pdfimages -list) no cache."""
    destino = CACHE / 'embutidas' / f'img-{indice:03d}.png'
    if destino.exists():
        return destino
    da_pagina = [(i, o) for p, i, o in lista_imagens() if p == pagina]
    indices = [i for i, _ in da_pagina]
    if indice not in indices:
        raise SystemExit(f'imagem {indice} não está na página {pagina}')
    pos = indices.index(indice)
    icc = perfil_icc(da_pagina[pos][1])
    tmp = CACHE / 'embutidas' / f'tmp-p{pagina:02d}'
    tmp.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['pdfimages', '-j', '-f', str(pagina), '-l', str(pagina),
                    str(PDF), str(tmp)], check=True)
    extraidas = sorted(tmp.parent.glob(tmp.name + '-*'))
    para_srgb(Image.open(extraidas[pos]).convert('RGB'), icc).save(destino, compress_level=1)
    for f in tmp.parent.glob(tmp.name + '-*'):
        f.unlink()
    return destino


def fonte_da_entrada(e):
    if e.get('fonte') == 'embutida':
        im = Image.open(imagem_embutida(e['pagina'], e['indice'])).convert('RGB')
        return girar(im, e.get('rot', 0))
    return Image.open(pagina_rasterizada(e['pagina'])).convert('RGB')


# ---------- comandos ----------

def cmd_texto():
    subprocess.run(['pdftotext', '-layout', str(PDF), str(TEXTO)], check=True)
    print(f'gravado {TEXTO.relative_to(RAIZ)}')


def numero_de_paginas():
    saida = subprocess.run(['pdfinfo', str(PDF)], check=True,
                           capture_output=True, text=True).stdout
    return int(re.search(r'^Pages:\s+(\d+)', saida, re.M).group(1))


def cmd_propor():
    crops = json.loads(CROPS.read_text()) if CROPS.exists() else {}
    paginas_com_entrada = {e['pagina'] for e in crops.values()}
    for n in range(1, numero_de_paginas() + 1):
        caminho = pagina_rasterizada(n)
        if n in paginas_com_entrada:
            continue  # preserva recortes já corrigidos à mão
        im = Image.open(caminho)
        w, h = im.size
        x0, y0, x1, y1 = caixa_nao_branca(im)
        crops[f'p{n:02d}-a'] = {'pagina': n, 'rect': [round(x0 / w, 4), round(y0 / h, 4),
                                                       round(x1 / w, 4), round(y1 / h, 4)]}
        print(f'p{n:02d}: {caminho.name} {w}x{h}')
    gravar_crops(crops)


def gravar_crops(crops):
    ordem = sorted(crops, key=lambda k: (crops[k]['pagina'], k))
    CROPS.write_text(json.dumps({k: crops[k] for k in ordem}, ensure_ascii=False, indent=1) + '\n')


def webp_bytes(im, qualidade=QUALIDADE):
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=qualidade, method=6)
    return buf.getvalue()


def cmd_gerar():
    crops = json.loads(CROPS.read_text())
    SAIDA_IMG.mkdir(parents=True, exist_ok=True)
    SAIDA_JSON.parent.mkdir(parents=True, exist_ok=True)
    for f in SAIDA_IMG.glob('*.webp'):
        f.unlink()
    dados = {}
    fontes = {}
    for id_, e in crops.items():
        chave = (e.get('fonte', 'pagina'), e['pagina'], e.get('indice'), e.get('rot', 0))
        if chave not in fontes:
            fontes.clear()
            fontes[chave] = fonte_da_entrada(e)
        im = recortar(fontes[chave], e['rect'])
        larguras = larguras_para(im.width)
        for lw in larguras:
            lh = round(im.height * lw / im.width)
            r = im if lw == im.width else im.resize((lw, lh), Image.Resampling.LANCZOS)
            (SAIDA_IMG / f'{id_}-{lw}.webp').write_bytes(webp_bytes(r))
        maior = larguras[-1]
        mini = im.resize((MINI, max(1, round(im.height * MINI / im.width))), Image.Resampling.LANCZOS)
        dados[id_] = {
            'w': maior,
            'h': round(im.height * maior / im.width),
            'cor': cor_dominante(im),
            'mini': 'data:image/webp;base64,' + base64.b64encode(webp_bytes(mini, 60)).decode(),
            'larguras': larguras,
        }
        print(f'{id_}: {im.width}x{im.height} -> {larguras}')
    SAIDA_JSON.write_text(json.dumps(dados, ensure_ascii=False, indent=1) + '\n')
    print(f'{len(dados)} imagens')


if __name__ == '__main__':
    comandos = {'texto': cmd_texto, 'propor': cmd_propor, 'gerar': cmd_gerar}
    if len(sys.argv) != 2 or sys.argv[1] not in comandos:
        raise SystemExit(__doc__)
    comandos[sys.argv[1]]()
