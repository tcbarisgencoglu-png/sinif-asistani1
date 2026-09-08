# Değişiklik Günlüğü (CHANGELOG)

Bu dosya, Sınıf Asistanı uygulamasının tüm sürüm geçmişini içerir.

## [v1.0.5] — 2026-09-08

### 🔧 Linux / Pardus & Paketleme Düzeltmeleri
- **Pardus & Debian (.deb) Kurulum Düzeltmesi:** Paket adı (`Package: sinif-asistani`) Debian isimlendirme standartlarına uygun hale getirilerek Pardus Paket Kurucu ve `dpkg` üzerindeki karakter hatası giderildi.
- **Flash Disk / USB Taşınabilir Desteği:** Masaüstü indirme ekranlarında Linux Taşınabilir (AppImage) sürümünün USB flash disk üzerinden doğrudan tak-çalıştır şeklinde (özellikle ortaokul branş öğretmenleri için sınıf sınıf gezerek) kullanılabileceği bilgisi ve yönlendirmeleri eklendi.

---

## [v1.0.4] — 2026-08-29

### 🔧 Düzeltmeler & Lisans Doğrulama İyileştirmeleri
- Web tanıtım sitesinde üretilen deneme lisansı hash algoritması düzeltildi ve geriye dönük tam uyumluluk sağlandı.
- Masaüstü (macOS, Windows, Linux) ve Web uygulamalarında lisans anahtarı doğrulayıcısı tüm Türkçe karakter setleri ve eski/yeni imza varyasyonlarını destekleyecek şekilde güncellendi.
- Lisans anahtarı kopyala/yapıştır sırasındaki çift tire (`--`), tırnak ve görünmez karakterler otomatik olarak temizlenir.

---

## [v1.0.3] — 2026-08-29

### 🔧 Düzeltmeler & İyileştirmeler
- `js/app.js` içerisindeki sözdizimi (syntax) hatası giderildi; menülerin, hızlı araçların ve butonların tıklanmama/tepki vermeme sorunu tamamen çözüldü.
- macOS, Windows ve Linux masaüstü sürümleri için başlatma ve aktifleştirme süreçleri optimize edildi.

---

## [v1.0.2] — 2026-08-29

### 🚀 Yeni Özellikler & İyileştirmeler
- Doğrudan tek repo üzerinden (sinif-asistani1) tüm platformlar için release dağıtımı.
- Gelişmiş lisans doğrulama ve temizleme desteği.
- macOS için güvenlik açılış kılavuzu eklendi.

---

### 🔧 Düzeltmeler
- Defterler sayfasında uzun konu başlıkları artık yazı boyutu küçülerek otomatik sığar
- Defter konu başlığı boyutu değiştiğinde satır çizgileri ve yazılar artık kaymaz

---

## [v1.0.0] — 2026-07-09

### 🎉 İlk Sürüm
- Tauri v2 ile çapraz platform masaüstü uygulaması (macOS, Windows, Linux)
- Öğrenci yönetimi, haftalık değerlendirme, sınav analizi
- Defterler, ödevler, etkinlikler, oyunlar ve daha fazlası
- Tamamen çevrimdışı çalışma — internet gerektirmez
