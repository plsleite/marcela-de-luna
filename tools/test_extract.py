# tools/test_extract.py
import unittest
from PIL import Image
from extract import caixa_nao_branca, cor_dominante, cor_de_acento, larguras_para, recortar

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
    def test_acento_rosa(self):
        im = Image.new('RGB', (100, 100), (110, 115, 130))
        im.paste((255, 60, 140), (0, 0, 100, 30))
        c = cor_de_acento(im)
        rgb = tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))
        for v, alvo in zip(rgb, (255, 60, 140)):
            self.assertLessEqual(abs(v - alvo), 6, c)
    def test_acento_cinza_igual_dominante(self):
        im = Image.new('RGB', (64, 64), (120, 120, 124))
        im.paste((90, 90, 92), (0, 0, 64, 20))
        self.assertEqual(cor_de_acento(im), cor_dominante(im))
