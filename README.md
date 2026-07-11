# Sınıf Asistanı 🎓

> Dijital Öğretmen Yardımcısı — Tauri ile güçlendirilmiş çapraz platform masaüstü uygulaması

[![Tauri](https://img.shields.io/badge/Tauri-2.x-orange?logo=tauri)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.77+-orange?logo=rust)](https://www.rust-lang.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-Özel-red)](LICENSE)

---

## 📋 Genel Bakış

**Sınıf Asistanı**, öğretmenlerin günlük sınıf yönetimini kolaylaştırmak için tasarlanmış dijital bir yardımcı programdır. Uygulama:

- ✅ Tamamen **çevrimdışı** çalışır — internet bağlantısı gerektirmez
- ✅ Hiçbir **backend sunucu** gerektirmez
- ✅ Tüm veriler **yerel olarak** (tarayıcı/uygulama belleğinde) saklanır
- ✅ **Tauri** ile gerçek masaüstü uygulamasına dönüştürülmüştür

---

## 🔧 Gerekli Yazılımlar

### Geliştirme Ortamı

| Yazılım | Minimum Sürüm | İndirme |
|---------|--------------|---------|
| **Node.js** | 18 LTS+ | [nodejs.org](https://nodejs.org) |
| **Rust** | 1.77.2+ | [rustup.rs](https://rustup.rs) |
| **Git** | 2.x+ | [git-scm.com](https://git-scm.com) |

### Platform Gereksinimleri

**macOS:**
- Xcode Command Line Tools (`xcode-select --install`)
- macOS 10.13 (High Sierra) veya üzeri

**Windows:**
- Microsoft Visual Studio C++ Build Tools veya Visual Studio 2022
- WebView2 Runtime (Windows 10/11 genellikle varsayılan olarak gelir)

**Linux:**
- `libwebkit2gtk-4.1-dev`, `libssl-dev`, `libayatana-appindicator3-dev`
- Ubuntu: `sudo apt install libwebkit2gtk-4.1-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`

---

## 🚀 Kurulum

```bash
# Repo'yu klonla
git clone <repo-url>
cd "sınıf asistanı"

# Node.js bağımlılıklarını yükle
npm install

# Rust bağımlılıklarını önceden derle (isteğe bağlı ama önerilir)
cd src-tauri && cargo fetch && cd ..
```

---

## 💻 Geliştirme Modunda Çalıştırma

```bash
npm run dev
```

Bu komut:
1. Web dosyalarını `dist/` klasörüne kopyalar
2. Tauri geliştirme penceresini açar
3. Hot-reload etkinleştirir (kaynak dosyaları değiştirince)

> **Not:** İlk çalıştırmada Rust bağımlılıkları indirileceğinden 5-10 dakika sürebilir.

---

## 📦 Derleme Komutları

### macOS için Derleme
```bash
# macOS'ta çalıştırın
npm run build
```
Çıktılar:
- `src-tauri/target/release/bundle/macos/Sınıf Asistanı.app`
- `src-tauri/target/release/bundle/dmg/Sınıf Asistanı_1.0.0_aarch64.dmg`

### Windows için Derleme
```bash
# Windows'ta çalıştırın
npm run build
```
Çıktılar:
- `src-tauri/target/release/bundle/msi/Sınıf Asistanı_1.0.0_x64_en-US.msi`
- `src-tauri/target/release/sinif-asistani.exe`

### Linux için Derleme
```bash
# Linux'ta çalıştırın
npm run build
```
Çıktılar:
- `src-tauri/target/release/bundle/appimage/sinif-asistani_1.0.0_amd64.AppImage`
- `src-tauri/target/release/bundle/deb/sinif-asistani_1.0.0_amd64.deb`

---

## 🔄 CI/CD ile Çapraz Platform Derleme

GitHub Actions ile tüm platformlar için otomatik derleme yapılabilir. `.github/workflows/build.yml` dosyasına bakın.

Her `main` branch'ine push veya tag oluşturulduğunda:
- macOS'ta `.app` + `.dmg`
- Windows'ta `.msi` + `.exe`
- Linux'ta `.AppImage` + `.deb`

otomatik olarak derlenir ve GitHub Releases'e yüklenir.

---

## 📁 Oluşan Paketlerin Konumu

| Platform | Klasör | Dosyalar |
|----------|--------|---------|
| macOS | `src-tauri/target/release/bundle/` | `macos/*.app`, `dmg/*.dmg` |
| Windows | `src-tauri/target/release/bundle/` | `msi/*.msi`, `nsis/*.exe` |
| Linux | `src-tauri/target/release/bundle/` | `appimage/*.AppImage`, `deb/*.deb` |

---

## 🆙 Yeni Sürüm Oluşturma

1. **Sürüm numarasını güncelle:**
   ```bash
   # src-tauri/tauri.conf.json içinde "version" alanını güncelle
   # src-tauri/Cargo.toml içinde "version" alanını güncelle
   # package.json içinde "version" alanını güncelle
   ```

2. **Değişiklikleri commit'le:**
   ```bash
   git add -A
   git commit -m "chore: bump version to X.Y.Z"
   git tag v X.Y.Z
   git push && git push --tags
   ```

3. **Derleme yap:**
   ```bash
   npm run build
   ```

4. **GitHub Actions otomatik olarak** tag'i algılayıp tüm platformlar için derleme yapar.

---

## 📂 Proje Yapısı

```
sınıf asistanı/
├── index.html              # Ana uygulama (tek dosya)
├── css/                    # Stil dosyaları
│   ├── styles.css
│   ├── games.css
│   ├── treasure.css
│   ├── tools.css
│   ├── exam-analysis.css
│   └── notebooks.css
├── js/                     # JavaScript modülleri
│   ├── app.js              # Ana uygulama mantığı
│   ├── state.js            # Durum yönetimi
│   ├── dashboard.js        # Gösterge paneli
│   └── ...                 # Diğer modüller
├── dist/                   # Tauri için web varlıkları (otomatik oluşturulur)
├── src-tauri/              # Tauri / Rust backend
│   ├── src/
│   │   ├── main.rs         # Giriş noktası
│   │   └── lib.rs          # Tauri kurulumu
│   ├── icons/              # Platform ikonları
│   ├── tauri.conf.json     # Tauri yapılandırması
│   ├── Cargo.toml          # Rust bağımlılıkları
│   └── build.rs            # Build scripti
├── package.json            # Node.js / npm yapılandırması
├── .github/
│   └── workflows/
│       └── build.yml       # CI/CD iş akışı
└── README.md               # Bu dosya
```

---

## 🐛 Sorun Giderme

### `cargo not found` hatası
```bash
source "$HOME/.cargo/env"
# veya yeniden kurun:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### `node not found` hatası
```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# veya yeniden kurun:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install --lts
```

### macOS'ta `xcrun: error`
```bash
xcode-select --install
```

### Linux'ta `webkit2gtk not found`
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

---

## 📞 Destek

Herhangi bir sorun yaşarsanız lütfen GitHub Issues üzerinden bildirin.

---

*Sınıf Asistanı — Her öğretmenin yanında olacak dijital asistanı* 🍎.
