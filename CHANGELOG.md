# Değişiklik Günlüğü (CHANGELOG)

Bu dosya, Sınıf Asistanı uygulamasının tüm sürüm geçmişini içerir.

## [v1.0.8] — 2026-09-14

### 🚀 Yeni Özellikler & İyileştirmeler
- **Öğrenci Fotoğrafı Hafıza Optimizasyonu:** Öğrenci fotoğrafları yüklenirken istemci tarafında HTML5 Canvas tabanlı otomatik sıkıştırma (~20KB) ve otomatik arka plan optimizasyonu eklendi.
- **Pardus Linux & WebKitGTK Uyumluluğu:** Açılır kutular (select), hafta seçici ve form bileşenleri için platform bağımsız tema ve özel hafta rozeti arayüzü uygulandı.
- **Windows SmartScreen & macOS Gatekeeper Rehberleri:** İndirme ve kurulum aşamalarında karşılaşılabilecek güvenlik uyarıları için tek tıkla açılan yardım pencereleri eklendi.
- **Güncelleme & İndirme Modalı İyileştirmeleri:** Sürüm karşılaştırması, veri kaybı yaşanmayacağı güvencesi ve doğrudan GitHub Release entegrasyonu sağlandı.

---

## [v1.0.7] — 2026-09-11

### 🔧 İyileştirmeler
- Canlı indirme bağlantıları ve masaüstü indirme pencereleri optimize edildi.
- Otomatik güncelleme denetleyicisi hata yakalama ve yedek yönlendirmeleri güçlendirildi.

---

## [v1.0.6] — 2026-09-08

### 🌟 Yeni Başlangıç & Demo Verileri
- **Zengin Demo ve Başlangıç Verileri:** Uygulamanın ilk kurulumunda veya veri sıfırlamasında açılan başlangıç verileri güncel yedek ile eşitlendi; gerçekçi öğrenci fotoğrafları, güncel ders programı, ödevler, kitaplar, performans kayıtları ve defterler eklendi.

---

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
