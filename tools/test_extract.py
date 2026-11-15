# tools/test_extract.py
import unittest
from PIL import Image
from extract import caixa_nao_branca, cor_dominante, larguras_para, recortar

class T(unittest.TestCase):
    def test_caixa(self):
        im = Image.new('RGB', (100, 200), 'white'); im.paste((20, 30, 90), (10, 20, 60, 120))
        self.assertEqual(caixa_nao_branca(im), (10, 20, 60, 120))
    def test_cor(self):
        self.assertEqual(cor_dominante(Image.new('RGB', (8, 8), (26, 28, 58))), '#1a1c3a')
    def test_larguras(self):
        self.assertEqual(larguras_para(3000), [640, 1280, 2560])
        self.assertEqual(larguras_para(1800), [640, 1280, 1800])
        self.assertEqual(larguras_para(500), [500])
    def test_recortar_por_fracao(self):
        im = Image.new('RGB', (1000, 2000), 'white')
        self.assertEqual(recortar(im, [0.1, 0.25, 0.6, 0.75]).size, (500, 1000))
