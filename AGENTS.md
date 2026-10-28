# Sınıf Asistanı — Mimari ve Kalite Koruma Kuralları (AGENTS.md)

Bu projede çalışan tüm yapay zeka ajanları, herhangi bir kod değişikliği yapmadan önce aşağıdaki **Kırmızı Çizgi Kurallarını** kontrol etmek ve uygulamak zorundadır:

## 1. Bulut Eşitleme ve Kota (Supabase Egress) Koruması
- **Periyodik Tam Tablo Sorgusu Yasaktır:** `checkLiveUpdates` veya herhangi bir zamanlayıcı içinde `select=*` ile periyodik sorgu yapılması **kesinlikle yasaktır**. Canlı kontrol yalnızca `select=exam_id,updated_at` (~150 Byte) ile yapılmalı, sadece `updated_at` zaman damgası değişen satırın içeriği çekilmelidir.
- **Fotoğraf Önbellekleme (`STUDENT_PHOTOS`):** Öğrenci fotoğrafları (`base64`) asla `MASTER_STATE` içine gömülmemelidir. Fotoğraflar yalnızca `STUDENT_PHOTOS` satırında tutulmalı ve el terminalinde sadece fotoğrafı eksik olan öğrenci varsa tek seferlik indirilmelidir.
- **Ağır Veri Temizliği:** `weeklyEvaluations` içindeki `questionDetails`, `pdfDataUrl`, `thumbUrl` gibi dinamik üretilebilen veya ağır görsel veriler `MASTER_STATE` içine dahil edilmemelidir.
- **Kota Kalkanı (`402` / `429`):** Sunucu kota veya hız sınırı hatası döndürdüğünde arka plan istekleri en az 5 dakika duraklatılmalıdır (`_quotaErrorUntil`).

## 2. Veri ve Öğrenci Fotoğraf Kalkanı (Yerel Depolama)
- **Masaüstü Sınırsız Disk Depolama:** Masaüstü uygulamasında (`window.__TAURI__`) 5 MB `localStorage` sınırına takılmamak için veriler `save_desktop_data` / `load_desktop_data` Tauri komutlarıyla doğrudan yerel diske kaydedilir.
- **Açılış Koruma Kilidi (`_isHydrated` Save Guard):** Uygulama açılışında yerel diskten okuma (`hydrateDesktopNativeState`) tamamlanmadan `saveState()` çağrılması ve diskteki verinin boş/eksik durumla ezilmesi yasaktır.
- **Fotoğraf Koruma Kalkanı:** Öğrenci fotoğrafları (`student.photo`) hiçbir senkronizasyon, güncelleme veya yedek birleştirme işleminde boş veriyle ezilemez.

## 3. Optik Okuma (OMR & ArUco) Kuralları
- **Beyaz Arka Planlı ArUco Kimlik Kodu:** Parlama (yansıma) oluşmaması için öğrenci kimlik matrisinde (`generateArucoSVG`) arka plan ve `0` bitleri mat beyaz (`#ffffff`), yalnızca `1` bitleri ayrık siyah kare (`#000000`) olarak üretilir.
- **4 Kenar Çerçeve ve Satır Bazlı Parlama Doğrulaması:** `scanArucoInGrayscale` içinde iç veri hücrelerinin dış çerçeve sanılmaması için 4 dış kenar sürekliliği kontrol edilmeli ve değişiklik sonrası 1..1000 öğrenci numarası için sentetik parlama/rotasyon testi çalıştırılmalıdır.

## 4. Paketleme ve Dağıtım Senkronizasyonu
- `js/`, `css/`, `index.html`, `mobile.html` üzerinde yapılan her değişiklikten sonra:
  1. `node -c <dosya.js>` ile sözdizimi doğrulaması yapılmalıdır.
  2. `npm run sync` çalıştırılarak `dist/` ve `android/app/src/main/assets/` güncellenmelidir.
  3. `Linux uygulama/` ve `MEB uygulama/` klasörlerine güncel dosyalar kopyalanmalıdır.
