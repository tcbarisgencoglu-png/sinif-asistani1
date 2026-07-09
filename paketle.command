#!/bin/bash

# Scriptin bulunduğu dizine geçiş yap (ana proje dizini)
cd "$(dirname "$0")"

SRC_DIR="."
DEST_DIR="$HOME/Desktop/ticari sürüm"

echo "--------------------------------------------------------"
echo "  Sınıf Asistanı Ticari Sürüm Paketleme Sihirbazı"
echo "--------------------------------------------------------"

# 1. Eski ticari sürüm klasörünü temizle ve yeniden oluştur
echo "-> Eski klasör temizleniyor..."
rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"

# 2. Gerekli dosya ve klasörleri kopyala
echo "-> Dosyalar kopyalanıyor..."
cp "$SRC_DIR/index.html" "$DEST_DIR/"
cp "$SRC_DIR/ogrenci_yukleme_sablonu.xlsx" "$DEST_DIR/"

# Alt klasörleri kopyala (rekürsif)
cp -R "$SRC_DIR/css" "$DEST_DIR/"
cp -R "$SRC_DIR/assets" "$DEST_DIR/"
cp -R "$SRC_DIR/js" "$DEST_DIR/"

# 3. Paylaşılmaması gereken gereksiz veya gizli dosyaları temizle
echo "-> Gereksiz ve gizli sistem dosyaları temizleniyor..."
find "$DEST_DIR" -name ".DS_Store" -type f -delete 2>/dev/null
find "$DEST_DIR" -name ".idea" -type d -exec rm -rf {} + 2>/dev/null
rm -f "$DEST_DIR/js/test_plans.js" 2>/dev/null

echo "--------------------------------------------------------"
echo "  BAŞARILI: Güncel Ticari Sürüm Paketi Hazırlandı!"
echo "  Konum: $DEST_DIR"
echo "--------------------------------------------------------"
echo "Bu klasörü sıkıştırıp (zip) müşterilerinizle paylaşabilirsiniz."
echo "İşlem tamamlandı. Kapatmak için bir tuşa basın..."
read -n 1 -s
