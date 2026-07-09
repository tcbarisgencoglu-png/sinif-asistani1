#!/usr/bin/env python3
"""
Sınıf Asistanı - Tauri İkon Üreticisi
Mevcut original.jpg logosundan tüm platform ikonlarını üretir.
"""

import os
import sys
import struct
import zlib
import subprocess

# Pillow kurulu mu kontrol et, yoksa kur
try:
    from PIL import Image
    print("✓ Pillow mevcut")
except ImportError:
    print("Pillow kuruluyor...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "--quiet"])
    from PIL import Image

# Çalışma dizini: src-tauri/
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_IMAGE = os.path.join(os.path.dirname(SCRIPT_DIR), "icon_build", "original.jpg")
ICONS_DIR = os.path.join(SCRIPT_DIR, "icons")

os.makedirs(ICONS_DIR, exist_ok=True)

print(f"Kaynak ikon: {SOURCE_IMAGE}")
print(f"Çıktı klasörü: {ICONS_DIR}")

# Kaynak görseli aç
img = Image.open(SOURCE_IMAGE).convert("RGBA")

# Kare kırpma (merkezi al)
w, h = img.size
side = min(w, h)
left = (w - side) // 2
top = (h - side) // 2
img = img.crop((left, top, left + side, top + side))

print(f"Kaynak boyut: {w}x{h} → kare kırpma: {side}x{side}")

# PNG boyutları
png_sizes = [32, 64, 128, 256, 512, 1024]

def save_png(image, size, filename):
    resized = image.resize((size, size), Image.LANCZOS)
    path = os.path.join(ICONS_DIR, filename)
    resized.save(path, "PNG")
    print(f"  ✓ {filename} ({size}x{size})")
    return path

print("\n📦 PNG İkonları üretiliyor...")
save_png(img, 32, "32x32.png")
save_png(img, 128, "128x128.png")
save_png(img, 256, "128x128@2x.png")   # Retina için 256px
save_png(img, 256, "256x256.png")
save_png(img, 512, "512x512.png")
save_png(img, 1024, "1024x1024.png")

# ---- Windows ICO ----
print("\n🪟 Windows ICO üretiliyor...")
ico_sizes = [16, 32, 48, 64, 128, 256]
ico_images = []
for s in ico_sizes:
    ico_images.append(img.resize((s, s), Image.LANCZOS).convert("RGBA"))

ico_path = os.path.join(ICONS_DIR, "icon.ico")
# PIL'in ICO kaydedici'sini kullan
img.resize((256, 256), Image.LANCZOS).save(
    ico_path,
    format="ICO",
    sizes=[(s, s) for s in ico_sizes]
)
print(f"  ✓ icon.ico ({', '.join(str(s) for s in ico_sizes)} px)")

# ---- macOS ICNS ----
print("\n🍎 macOS ICNS üretiliyor...")

# iconutil gerekli — macOS'ta mevcut
iconset_dir = os.path.join(ICONS_DIR, "icon.iconset")
os.makedirs(iconset_dir, exist_ok=True)

icns_specs = [
    ("icon_16x16.png", 16),
    ("icon_16x16@2x.png", 32),
    ("icon_32x32.png", 32),
    ("icon_32x32@2x.png", 64),
    ("icon_64x64.png", 64),
    ("icon_64x64@2x.png", 128),
    ("icon_128x128.png", 128),
    ("icon_128x128@2x.png", 256),
    ("icon_256x256.png", 256),
    ("icon_256x256@2x.png", 512),
    ("icon_512x512.png", 512),
    ("icon_512x512@2x.png", 1024),
]

for fname, size in icns_specs:
    resized = img.resize((size, size), Image.LANCZOS)
    resized.save(os.path.join(iconset_dir, fname), "PNG")

# iconutil ile ICNS oluştur
icns_path = os.path.join(ICONS_DIR, "icon.icns")
result = subprocess.run(
    ["iconutil", "-c", "icns", iconset_dir, "-o", icns_path],
    capture_output=True, text=True
)

if result.returncode == 0:
    print(f"  ✓ icon.icns (iconutil ile)")
    # Geçici iconset klasörünü temizle
    import shutil
    shutil.rmtree(iconset_dir)
else:
    print(f"  ⚠ iconutil başarısız: {result.stderr}")
    # Fallback: PNG'yi ICNS olarak kopyala (kısmi destek)
    img.resize((1024, 1024), Image.LANCZOS).save(icns_path.replace(".icns", "_fallback.png"), "PNG")
    print(f"  → Fallback: 1024x1024 PNG oluşturuldu (manuel .icns dönüşümü gerekebilir)")

print("\n✅ Tüm ikonlar başarıyla oluşturuldu!")
print(f"📁 Konum: {ICONS_DIR}")

# Dosya listesi
files = os.listdir(ICONS_DIR)
for f in sorted(files):
    fpath = os.path.join(ICONS_DIR, f)
    if os.path.isfile(fpath):
        size_kb = os.path.getsize(fpath) / 1024
        print(f"   {f} ({size_kb:.1f} KB)")
