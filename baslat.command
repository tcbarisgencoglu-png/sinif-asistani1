#!/bin/bash

# Scriptin bulunduğu dizine geçiş yap
cd "$(dirname "$0")"

# 8000 portundan başlayarak boş bir port bul
PORT=8000
while lsof -i :$PORT -t >/dev/null 2>&1 ; do
    PORT=$((PORT+1))
done

echo "--------------------------------------------------------"
echo "  Sınıf Asistanı Yerel Sunucusu Başlatılıyor..."
echo "  Adres: http://localhost:$PORT"
echo "--------------------------------------------------------"

# Varsayılan tarayıcıda uygulamayı aç
open "http://localhost:$PORT"

# Python 3 ile HTTP sunucusunu başlat
python3 -m http.server $PORT
