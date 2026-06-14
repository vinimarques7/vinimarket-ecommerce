#!/usr/bin/env python3
"""
Seed script — Vini Market
Popula o banco com ~45 produtos de tecnologia e categorias variadas.

Uso:
    pip install requests
    python3 seed_products.py
"""
import sys
try:
    import requests
except ImportError:
    print("Instale a dependência: pip install requests")
    sys.exit(1)

BASE        = "http://localhost:8000"
ADMIN_EMAIL = "admin@vinimarket.com"
ADMIN_PASS  = "admin@2024"


U = "https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w=600&h=400&q=80"

PRODUCTS = [
    # ── Celulares ─────────────────────────────────────────────────────────
    {"name": "iPhone 16 Pro Max", "category": "Celulares", "price": 11999.99, "stock": 15,
     "description": "Chip A18 Pro, câmera 48MP com zoom óptico 5x, tela ProMotion 6.9\"",
     "specifications": {"Chip": "A18 Pro", "Tela": "6.9\" ProMotion OLED", "Câmera": "48MP + 12MP", "Bateria": "Até 33h", "Armazenamento": "256GB"},
     "image_url": U.format(id="1592750475338-74b7b21085ab")},

    {"name": "Samsung Galaxy S25 Ultra", "category": "Celulares", "price": 9799.99, "stock": 20,
     "description": "Snapdragon 8 Elite, S Pen, câmera 200MP, tela Dynamic AMOLED 6.9\"",
     "specifications": {"Chip": "Snapdragon 8 Elite", "Tela": "6.9\" Dynamic AMOLED", "Câmera": "200MP", "RAM": "12GB", "Bateria": "5000mAh"},
     "image_url": U.format(id="1610945415295-d9bbf067e59c")},

    {"name": "Motorola Edge 50 Pro", "category": "Celulares", "price": 3299.99, "stock": 30,
     "description": "Snapdragon 7s Gen 2, câmera 50MP OIS, tela pOLED 144Hz 6.7\"",
     "specifications": {"Chip": "Snapdragon 7s Gen 2", "Tela": "6.7\" pOLED 144Hz", "Câmera": "50MP OIS", "RAM": "12GB", "Bateria": "4500mAh"},
     "image_url": U.format(id="1511707171634-5f897ff02aa9")},

    # ── Laptops ───────────────────────────────────────────────────────────
    {"name": "MacBook Pro 16\" M4 Pro", "category": "Laptops", "price": 23999.99, "stock": 8,
     "description": "Chip M4 Pro, 24GB RAM unificada, SSD 512GB, tela Liquid Retina XDR",
     "specifications": {"Chip": "Apple M4 Pro", "RAM": "24GB Unificada", "SSD": "512GB", "Tela": "16.2\" Liquid Retina XDR", "Bateria": "22h"},
     "image_url": U.format(id="1517336714731-489689fd1ca8")},

    {"name": "Dell XPS 15 (2025)", "category": "Laptops", "price": 18999.99, "stock": 6,
     "description": "Intel Core Ultra 9, RTX 4070, 32GB DDR5, OLED 4K touch 15.6\"",
     "specifications": {"CPU": "Core Ultra 9 185H", "GPU": "RTX 4070", "RAM": "32GB DDR5", "Tela": "15.6\" OLED 4K", "SSD": "1TB NVMe"},
     "image_url": U.format(id="1593642632559-0c6d3fc62b89")},

    {"name": "ASUS ROG Zephyrus G16", "category": "Laptops", "price": 15999.99, "stock": 10,
     "description": "AMD Ryzen AI 9, RTX 4080, 32GB DDR5, tela QHD+ 240Hz",
     "specifications": {"CPU": "Ryzen AI 9 HX 370", "GPU": "RTX 4080", "RAM": "32GB DDR5", "Tela": "16\" QHD+ 240Hz", "SSD": "1TB NVMe"},
     "image_url": U.format(id="1542751371-adc38448a05e")},

    {"name": "MacBook Air M3", "category": "Laptops", "price": 11999.99, "stock": 20,
     "description": "Chip M3, 8GB RAM, SSD 256GB, tela Liquid Retina 13.6\", ultrafino",
     "specifications": {"Chip": "Apple M3", "RAM": "8GB Unificada", "SSD": "256GB", "Tela": "13.6\" Liquid Retina", "Peso": "1.24kg"},
     "image_url": U.format(id="1541807084-5c52b6b3adef")},

    # ── Computadores ──────────────────────────────────────────────────────
    {"name": "Mac Mini M4", "category": "Computadores", "price": 8499.99, "stock": 12,
     "description": "Chip M4, 16GB RAM unificada, SSD 256GB, compacto e silencioso",
     "specifications": {"Chip": "Apple M4", "RAM": "16GB", "SSD": "256GB", "Portas": "Thunderbolt 4, USB-A, HDMI", "Dimensoes": "12.7cm x 12.7cm"},
     "image_url": U.format(id="1610945265064-0e34e5519bbf")},

    {"name": "PC Gamer Titan RTX 4090", "category": "Computadores", "price": 29999.99, "stock": 3,
     "description": "i9-14900K, RTX 4090, 64GB DDR5, SSD 2TB + HDD 4TB, Water Cooling",
     "specifications": {"CPU": "Intel i9-14900K", "GPU": "RTX 4090 24GB", "RAM": "64GB DDR5 6000MHz", "SSD": "2TB NVMe Gen4", "Gabinete": "Lian Li PC-O11D"},
     "image_url": U.format(id="1587202372775-e229f172b9d7")},

    # ── Monitores ─────────────────────────────────────────────────────────
    {"name": "LG UltraGear 27\" 4K 144Hz", "category": "Monitores", "price": 4299.99, "stock": 15,
     "description": "IPS Nano 4K, 144Hz, 1ms GtG, G-Sync/FreeSync, DisplayHDR 600",
     "specifications": {"Painel": "IPS Nano 4K", "Taxa": "144Hz", "Resposta": "1ms GtG", "HDR": "DisplayHDR 600", "Portas": "HDMI 2.1, DP 1.4"},
     "image_url": U.format(id="1527443224154-c4a573d87655")},

    {"name": "Samsung Odyssey OLED G9 49\"", "category": "Monitores", "price": 12999.99, "stock": 5,
     "description": "OLED curvo 49\" DQHD, 240Hz, 0.03ms, Quantum Matrix HDR 2000",
     "specifications": {"Painel": "OLED DQHD 5120x1440", "Taxa": "240Hz", "Resposta": "0.03ms", "Curvatura": "1800R", "HDR": "Quantum HDR 2000"},
     "image_url": U.format(id="1593640408182-31c228c26710")},

    {"name": "BenQ PD3225U Designer 32\"", "category": "Monitores", "price": 7999.99, "stock": 8,
     "description": "IPS 4K 60Hz, 99% DCI-P3, Calman Verified, ideal para design",
     "specifications": {"Painel": "IPS 4K UHD", "Cor": "99% DCI-P3", "Calibracao": "Calman Verified", "Portas": "Thunderbolt 4, USB-C 90W", "Bordas": "Sem borda 3 lados"},
     "image_url": U.format(id="1527443224154-c4a573d87655")},

    # ── Processadores ─────────────────────────────────────────────────────
    {"name": "Intel Core i9-14900KS", "category": "Processadores", "price": 3999.99, "stock": 10,
     "description": "24 nucleos (8P+16E), ate 6.2GHz, 36MB cache, socket LGA1700",
     "specifications": {"Nucleos": "24 (8P + 16E)", "Boost": "ate 6.2GHz", "Cache": "36MB Smart Cache", "TDP": "150W", "Socket": "LGA1700"},
     "image_url": U.format(id="1555617981-dac3772ef2d6")},

    {"name": "AMD Ryzen 9 7950X", "category": "Processadores", "price": 3499.99, "stock": 12,
     "description": "16 nucleos, 32 threads, ate 5.7GHz, 80MB cache, socket AM5",
     "specifications": {"Nucleos": "16", "Threads": "32", "Boost": "ate 5.7GHz", "Cache": "64MB", "Socket": "AM5"},
     "image_url": U.format(id="1555617981-dac3772ef2d6")},

    {"name": "AMD Ryzen 5 7600X", "category": "Processadores", "price": 1299.99, "stock": 25,
     "description": "6 nucleos, 12 threads, ate 5.3GHz, otimo custo-beneficio",
     "specifications": {"Nucleos": "6", "Threads": "12", "Boost": "ate 5.3GHz", "Cache": "32MB", "Socket": "AM5"},
     "image_url": U.format(id="1555617981-dac3772ef2d6")},

    # ── Memória RAM ───────────────────────────────────────────────────────
    {"name": "Corsair Vengeance DDR5 32GB", "category": "Memória RAM", "price": 899.99, "stock": 30,
     "description": "32GB (2x16GB) DDR5 6000MHz CL30, RGB, compativel Intel/AMD",
     "specifications": {"Capacidade": "32GB (2x16GB)", "Velocidade": "6000MHz", "Latencia": "CL30", "Tensao": "1.35V", "RGB": "Sim"},
     "image_url": U.format(id="1562976540-1502c2145851")},

    {"name": "Kingston Fury Beast DDR5 64GB", "category": "Memória RAM", "price": 1699.99, "stock": 15,
     "description": "64GB (2x32GB) DDR5 5200MHz, ideal para workstations",
     "specifications": {"Capacidade": "64GB (2x32GB)", "Velocidade": "5200MHz", "Latencia": "CL40", "Tensao": "1.25V", "Perfil": "XMP 3.0"},
     "image_url": U.format(id="1562976540-1502c2145851")},

    # ── Placas de Vídeo ───────────────────────────────────────────────────
    {"name": "NVIDIA GeForce RTX 4090", "category": "Placas de Vídeo", "price": 14999.99, "stock": 4,
     "description": "24GB GDDR6X, 16384 CUDA cores, Ada Lovelace, DLSS 3",
     "specifications": {"VRAM": "24GB GDDR6X", "CUDA Cores": "16384", "Boost Clock": "2520MHz", "TDP": "450W", "Conector": "16-pin"},
     "image_url": U.format(id="1591488320449-011701bb6704")},

    {"name": "AMD Radeon RX 7900 XTX", "category": "Placas de Vídeo", "price": 8999.99, "stock": 8,
     "description": "24GB GDDR6, 6144 Stream Processors, FSR 3.0, RDNA 3",
     "specifications": {"VRAM": "24GB GDDR6", "Stream Proc.": "6144", "Boost Clock": "2500MHz", "TDP": "355W", "Interface": "PCIe 4.0 x16"},
     "image_url": U.format(id="1591488320449-011701bb6704")},

    {"name": "NVIDIA GeForce RTX 4070 Ti Super", "category": "Placas de Vídeo", "price": 5999.99, "stock": 12,
     "description": "16GB GDDR6X, excelente para 4K gaming e criacao de conteudo",
     "specifications": {"VRAM": "16GB GDDR6X", "CUDA Cores": "8448", "Boost Clock": "2610MHz", "TDP": "285W", "DLSS": "3.5"},
     "image_url": U.format(id="1591488320449-011701bb6704")},

    # ── Armazenamento ─────────────────────────────────────────────────────
    {"name": "Samsung 990 Pro NVMe 2TB", "category": "Armazenamento", "price": 1299.99, "stock": 20,
     "description": "PCIe 4.0, leitura 7450MB/s, escrita 6900MB/s, ideal para games",
     "specifications": {"Interface": "PCIe 4.0 NVMe", "Leitura": "7450 MB/s", "Escrita": "6900 MB/s", "Capacidade": "2TB", "Form Factor": "M.2 2280"},
     "image_url": U.format(id="1597838816882-4435b1977fbe")},

    {"name": "WD Black SN850X 1TB", "category": "Armazenamento", "price": 699.99, "stock": 30,
     "description": "PCIe 4.0, leitura 7300MB/s, otimizado para PlayStation 5",
     "specifications": {"Interface": "PCIe 4.0 NVMe", "Leitura": "7300 MB/s", "Escrita": "6600 MB/s", "Capacidade": "1TB", "PS5": "Compativel"},
     "image_url": U.format(id="1597838816882-4435b1977fbe")},

    # ── Teclados ──────────────────────────────────────────────────────────
    {"name": "Logitech MX Keys S", "category": "Teclados", "price": 799.99, "stock": 25,
     "description": "Teclado sem fio para produtividade, Bluetooth + USB, retroiluminado",
     "specifications": {"Conexao": "Bluetooth + USB", "Bateria": "10 dias com luz", "Layout": "ABNT2", "Retroiluminacao": "Adaptativa", "Compat.": "Win/Mac/iOS/Android"},
     "image_url": U.format(id="1587829741301-dc798b83add3")},

    {"name": "Keychron Q3 Pro (Mecanico)", "category": "Teclados Mecânicos", "price": 1299.99, "stock": 15,
     "description": "Teclado mecanico TKL wireless, switch Gateron G Pro, aluminio, RGB",
     "specifications": {"Layout": "TKL (87 teclas)", "Switch": "Gateron G Pro Red", "Caixa": "Aluminio CNC", "Conexao": "Bluetooth 5.1 + USB-C", "RGB": "South-facing"},
     "image_url": U.format(id="1614632537423-1e6c2e7e0aab")},

    {"name": "Razer BlackWidow V4 Pro", "category": "Teclados Mecânicos", "price": 1799.99, "stock": 10,
     "description": "Switch Razer Yellow, sem fio, Chroma RGB, apoio de pulso magnetico",
     "specifications": {"Switch": "Razer Yellow linear", "Conexao": "2.4GHz + USB-C", "Bateria": "200h sem RGB", "Retroiluminacao": "Chroma RGB", "Extras": "Apoio de pulso"},
     "image_url": U.format(id="1618366712010-f4ae9c647dcb")},

    {"name": "HHKB Professional Hybrid", "category": "Teclados Mecânicos", "price": 2499.99, "stock": 5,
     "description": "Topre 45g, layout 60%, cult classico entre programadores, feito no Japao",
     "specifications": {"Switch": "Topre 45g capacitivo", "Layout": "60% HHKB", "Conexao": "Bluetooth 4.2 + USB-C", "Peso": "540g", "Fabricacao": "Japao"},
     "image_url": U.format(id="1587829741301-dc798b83add3")},

    # ── Mouses ────────────────────────────────────────────────────────────
    {"name": "Logitech MX Master 3S", "category": "Mouses", "price": 699.99, "stock": 30,
     "description": "8000 DPI, roda MagSpeed, silencioso, Bluetooth + USB, ergonomico",
     "specifications": {"DPI": "200-8000", "Botoes": "7", "Roda": "MagSpeed magnetica", "Conexao": "Bluetooth + USB Unifying", "Bateria": "70 dias"},
     "image_url": U.format(id="1527814050087-3793815479db")},

    {"name": "Razer DeathAdder V3 HyperSpeed", "category": "Mouses", "price": 499.99, "stock": 25,
     "description": "Focus X 26K DPI, sem fio 2.4GHz, 90h bateria, ultraleve 64g",
     "specifications": {"DPI": "100-26000", "Sensor": "Focus X Optical", "Conexao": "2.4GHz HyperSpeed", "Bateria": "90h", "Peso": "64g"},
     "image_url": U.format(id="1613040809024-b4ef7ba99bc3")},

    {"name": "Glorious Model O 2 Wireless", "category": "Mouses", "price": 599.99, "stock": 20,
     "description": "26000 DPI, favo de mel, 55g, 110h bateria, polling 4K Hz",
     "specifications": {"DPI": "100-26000", "Polling": "4000 Hz", "Peso": "55g", "Bateria": "110h", "Cliques": "Omron 60M"},
     "image_url": U.format(id="1527814050087-3793815479db")},

    # ── Controles ─────────────────────────────────────────────────────────
    {"name": "PlayStation DualSense Edge", "category": "Controles", "price": 1299.99, "stock": 18,
     "description": "Controle PS5 pro com gatilhos adaptaveis e sticks intercambiaveis",
     "specifications": {"Plataforma": "PS5 / PC", "Sticks": "Intercambiaveis", "Gatilhos": "Adaptaveis ajustaveis", "Bateria": "Li-Ion", "Conexao": "USB-C / Bluetooth"},
     "image_url": U.format(id="1612287230202-1ff1d85d1bdf")},

    {"name": "Xbox Elite Series 2", "category": "Controles", "price": 1099.99, "stock": 15,
     "description": "4 paddles traseiros, tensao dos sticks ajustavel, sem fio",
     "specifications": {"Plataforma": "Xbox / PC / iOS / Android", "Paddles": "4 traseiros", "Sticks": "Tensao ajustavel", "Bateria": "40h", "Conexao": "Xbox Wireless + Bluetooth"},
     "image_url": U.format(id="1559564741-12ec0ea7b3be")},

    {"name": "8BitDo Ultimate Wireless", "category": "Controles", "price": 499.99, "stock": 22,
     "description": "Hall Effect sticks, dock de carga inclusa, 2.4GHz + Bluetooth",
     "specifications": {"Sticks": "Hall Effect sem desgaste", "Conexao": "2.4GHz + Bluetooth", "Dock": "Incluida", "Plataforma": "PC / Android / Switch", "Bateria": "22h"},
     "image_url": U.format(id="1595327656903-2f54e37ce09e")},

    # ── Áudio ─────────────────────────────────────────────────────────────
    {"name": "Sony WH-1000XM6", "category": "Áudio", "price": 2699.99, "stock": 20,
     "description": "ANC lider de mercado, 40h bateria, LDAC, HD Voice, dobrado",
     "specifications": {"ANC": "Lider categoria", "Bateria": "40h", "Codec": "LDAC AAC SBC", "Driver": "30mm", "Peso": "250g"},
     "image_url": U.format(id="1505740420928-5e560c06d30e")},

    {"name": "Apple AirPods Pro 2 USB-C", "category": "Áudio", "price": 2099.99, "stock": 25,
     "description": "Chip H2, ANC adaptativo, audio espacial personalizado, IP54",
     "specifications": {"Chip": "H2", "ANC": "Adaptativo", "Audio Espacial": "Personalizado", "IP": "IP54", "Bateria": "6h (+30h case)"},
     "image_url": U.format(id="1600294037681-c80b4cb5b434")},

    # ── Caixas de Som ─────────────────────────────────────────────────────
    {"name": "JBL Charge 5", "category": "Caixas de Som", "price": 999.99, "stock": 20,
     "description": "Bluetooth 5.1, 20h bateria, IP67, carregador externo, potencia 40W",
     "specifications": {"Potencia": "40W", "Bateria": "20h", "IP": "IP67", "Bluetooth": "5.1", "PartyBoost": "Sim"},
     "image_url": U.format(id="1608043152269-423dbba4e7e1")},

    {"name": "Sonos Era 300", "category": "Caixas de Som", "price": 3499.99, "stock": 8,
     "description": "Spatial Audio Dolby Atmos, 6 drivers, Wi-Fi + Bluetooth, voz",
     "specifications": {"Drivers": "6 (3 tweeters + 3 woofers)", "Audio": "Dolby Atmos Spatial", "Conexao": "Wi-Fi + Bluetooth 5.0", "Microfone": "8 array", "Assistente": "Alexa"},
     "image_url": U.format(id="1545454675-3531b543be5d")},

    # ── Refrigeração ──────────────────────────────────────────────────────
    {"name": "Noctua NH-D15 Chromax", "category": "Refrigeração", "price": 699.99, "stock": 15,
     "description": "Air cooler duplo, 2x NF-A15 PWM, TDP 250W, versao preta",
     "specifications": {"Tipo": "Air Cooler Duplo Torre", "Fans": "2x 150mm NF-A15 PWM", "TDP": "250W", "Ruido": "24.6 dBA", "Compat.": "AM4/AM5/LGA1700"},
     "image_url": U.format(id="1587202372583-49330a15584d")},

    {"name": "Corsair iCUE H150i Elite LCD", "category": "Refrigeração", "price": 1599.99, "stock": 10,
     "description": "AIO 360mm, bomba de alta pressao, tela LCD IPS no bloco, RGB",
     "specifications": {"Radiador": "360mm", "Fans": "3x 120mm QL RGB", "Display": "IPS LCD 2.1\"", "TDP": "+350W", "Compat.": "AM4/AM5/LGA1700"},
     "image_url": U.format(id="1587202372583-49330a15584d")},

    # ── Cadeiras ──────────────────────────────────────────────────────────
    {"name": "SecretLab Titan Evo 2024", "category": "Cadeiras", "price": 4999.99, "stock": 10,
     "description": "Couro PU premium, lombar magnetico, apoio de cabeca 4D, inclinacao",
     "specifications": {"Material": "NEO Hybrid Leather", "Lombar": "Magnetico 4-way", "Apoio Cabeca": "4D premium", "Inclinacao": "165deg", "Carga Max": "180kg"},
     "image_url": U.format(id="1616625619884-0e7a0eae69a0")},

    {"name": "Herman Miller Embody Gaming", "category": "Cadeiras", "price": 14999.99, "stock": 4,
     "description": "Parceria Logitech G, suporte lombar inteligente, tecido respiravel",
     "specifications": {"Lombar": "Spine-like support dinamico", "Material": "Tecido respiravel", "Garantia": "12 anos", "Carga Max": "160kg", "Ajustes": "Multiplos pontos"},
     "image_url": U.format(id="1611175694989-4870fafe4702")},

    # ── Tablets ───────────────────────────────────────────────────────────
    {"name": "iPad Pro M4 13\"", "category": "Tablets", "price": 14999.99, "stock": 12,
     "description": "Chip M4, tela OLED ultra-fino 5.1mm, Apple Pencil Pro",
     "specifications": {"Chip": "Apple M4", "Tela": "13\" OLED Ultra Retina XDR", "Espessura": "5.1mm", "Armazenamento": "256GB-2TB", "Conect.": "Wi-Fi 6E + 5G"},
     "image_url": U.format(id="1544244015-0df4b3ffc6b0")},

    {"name": "Samsung Galaxy Tab S10 Ultra", "category": "Tablets", "price": 9999.99, "stock": 10,
     "description": "Snapdragon 8 Gen 3, tela AMOLED 14.6\" 120Hz, S Pen incluida",
     "specifications": {"Chip": "Snapdragon 8 Gen 3", "Tela": "14.6\" Dynamic AMOLED 120Hz", "RAM": "12GB", "S Pen": "Incluida", "Bateria": "11200mAh"},
     "image_url": U.format(id="1561154464-82e9adf32764")},

    # ── Leitura ───────────────────────────────────────────────────────────
    {"name": "Kindle Paperwhite 16GB", "category": "Leitura", "price": 699.99, "stock": 40,
     "description": "300ppi, luz ajustavel quente/fria, IPX8, 12 semanas de bateria",
     "specifications": {"Tela": "6.8\" 300ppi e-ink", "Luz": "Ajustavel quente/fria", "IP": "IPX8 2m/60min", "Bateria": "12 semanas", "Armazenamento": "16GB"},
     "image_url": U.format(id="1592439904875-cc81c6f8bc60")},

    {"name": "Kobo Libra Colour", "category": "Leitura", "price": 899.99, "stock": 20,
     "description": "Tela e-ink colorida 7\", IPX8, 32GB, leitura de ebooks e HQ",
     "specifications": {"Tela": "7\" e-ink Kaleido 3 colorida", "IP": "IPX8", "Armazenamento": "32GB", "Formatos": "EPUB KEPUB PDF CBZ", "Bateria": "Semanas"},
     "image_url": U.format(id="1553729784-e91953dec042")},
]


def main():
    print("=" * 50)
    print("  Vini Market — Seed de Produtos")
    print("=" * 50)
    print()

    # Registrar admin (ignora erro se já existe)
    requests.post(f"{BASE}/users/register", json={
        "name": "Admin", "email": ADMIN_EMAIL,
        "password": ADMIN_PASS, "role": "admin",
    }, timeout=5)

    # Login
    res = requests.post(f"{BASE}/users/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=5)
    if res.status_code != 200:
        print(f"[ERRO] Login falhou: {res.text}")
        print(f"       Verifique se os serviços estão rodando em {BASE}")
        sys.exit(1)

    token   = res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[OK] Logado como admin ({ADMIN_EMAIL})\n")

    ok = 0
    for p in PRODUCTS:
        try:
            res = requests.post(f"{BASE}/products", json=p, headers=headers, timeout=5)
            if res.status_code == 201:
                print(f"  [+] {p['category']:<22} {p['name']}")
                ok += 1
            else:
                print(f"  [!] {p['name']}: {res.text}")
        except Exception as e:
            print(f"  [!] Erro em {p['name']}: {e}")

    print(f"\n{ok}/{len(PRODUCTS)} produtos criados com sucesso!")
    print(f"\nCredenciais admin:")
    print(f"  Email: {ADMIN_EMAIL}")
    print(f"  Senha: {ADMIN_PASS}")
    print(f"\nAcesse: http://localhost:3000")


if __name__ == "__main__":
    main()
