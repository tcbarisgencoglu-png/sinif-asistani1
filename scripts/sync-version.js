#!/usr/bin/env node

/**
 * Sınıf Asistanı — Sürüm Senkronizasyon ve Yönetim Scripti
 *
 * Kullanım:
 *   npm run version:sync          -> package.json'daki sürümü tüm platformlara (Masaüstü, Android, Web) senkronize eder.
 *   npm run version:set 1.0.30    -> Belirtilen sürüme geçer ve tüm dosyaları günceller.
 *   npm run version:bump patch    -> Yama sürümünü artırır (1.0.29 -> 1.0.30).
 *   npm run version:bump minor    -> Alt sürümü artırır (1.0.29 -> 1.1.0).
 *   npm run version:bump major    -> Ana sürümü artırır (1.0.29 -> 2.0.0).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

// Dosya yolları
const PATHS = {
  packageJson: path.join(ROOT_DIR, 'package.json'),
  tauriConf: path.join(ROOT_DIR, 'src-tauri', 'tauri.conf.json'),
  cargoToml: path.join(ROOT_DIR, 'src-tauri', 'Cargo.toml'),
  androidGradle: path.join(ROOT_DIR, 'android', 'app', 'build.gradle'),
  versionJson: path.join(ROOT_DIR, 'version.json'),
  appJs: path.join(ROOT_DIR, 'js', 'app.js'),
  indexHtml: path.join(ROOT_DIR, 'index.html'),
  mobileHtml: path.join(ROOT_DIR, 'mobile.html'),
  tanitimIndex: path.join(ROOT_DIR, 'tanitim', 'index.html')
};

// 1. Mevcut sürümü oku
const pkg = JSON.parse(fs.readFileSync(PATHS.packageJson, 'utf8'));
let currentVer = pkg.version || '1.0.0';

// 2. Argümanları analiz et
const arg = (process.argv[2] || '').trim();
let targetVer = currentVer;

function bump(ver, type) {
  const parts = ver.split('.').map(n => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  if (type === 'major') {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  } else if (type === 'minor') {
    parts[1] += 1;
    parts[2] = 0;
  } else {
    // patch varsayılan
    parts[2] += 1;
  }
  return parts.join('.');
}

if (arg === 'patch' || arg === 'minor' || arg === 'major') {
  targetVer = bump(currentVer, arg);
} else if (/^\d+\.\d+\.\d+/.test(arg)) {
  targetVer = arg;
} else if (arg && arg !== 'sync') {
  console.error(`❌ Geçersiz sürüm argümanı: "${arg}". Örnekler: "patch", "minor", "major", "1.0.30"`);
  process.exit(1);
}

console.log(`\n========================================`);
console.log(`🚀 Sınıf Asistanı Sürüm Senkronizasyonu`);
console.log(`📦 Mevcut Sürüm: v${currentVer}`);
console.log(`🎯 Hedef Sürüm : v${targetVer}`);
console.log(`========================================\n`);

// Android versionCode hesapla: (major * 10000) + (minor * 100) + patch
const vParts = targetVer.split('.').map(n => parseInt(n, 10) || 0);
const targetVersionCode = (vParts[0] * 10000) + (vParts[1] * 100) + (vParts[2] || 0);

const results = [];

// A. package.json
try {
  pkg.version = targetVer;
  fs.writeFileSync(PATHS.packageJson, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  results.push({ file: 'package.json', status: '✅', detail: `version: "${targetVer}"` });
} catch (e) {
  results.push({ file: 'package.json', status: '❌', detail: e.message });
}

// B. src-tauri/tauri.conf.json
try {
  if (fs.existsSync(PATHS.tauriConf)) {
    const tauri = JSON.parse(fs.readFileSync(PATHS.tauriConf, 'utf8'));
    tauri.version = targetVer;
    fs.writeFileSync(PATHS.tauriConf, JSON.stringify(tauri, null, 2) + '\n', 'utf8');
    results.push({ file: 'src-tauri/tauri.conf.json', status: '✅', detail: `version: "${targetVer}"` });
  }
} catch (e) {
  results.push({ file: 'src-tauri/tauri.conf.json', status: '❌', detail: e.message });
}

// C. src-tauri/Cargo.toml
try {
  if (fs.existsSync(PATHS.cargoToml)) {
    let cargo = fs.readFileSync(PATHS.cargoToml, 'utf8');
    cargo = cargo.replace(/^version\s*=\s*"[^"]+"/m, `version = "${targetVer}"`);
    fs.writeFileSync(PATHS.cargoToml, cargo, 'utf8');
    results.push({ file: 'src-tauri/Cargo.toml', status: '✅', detail: `version = "${targetVer}"` });
  }
} catch (e) {
  results.push({ file: 'src-tauri/Cargo.toml', status: '❌', detail: e.message });
}

// D. android/app/build.gradle
try {
  if (fs.existsSync(PATHS.androidGradle)) {
    let gradle = fs.readFileSync(PATHS.androidGradle, 'utf8');
    gradle = gradle.replace(/versionCode\s+\d+/g, `versionCode ${targetVersionCode}`);
    gradle = gradle.replace(/versionName\s+"[^"]+"/g, `versionName "${targetVer}"`);
    fs.writeFileSync(PATHS.androidGradle, gradle, 'utf8');
    results.push({ file: 'android/app/build.gradle', status: '✅', detail: `code: ${targetVersionCode}, name: "${targetVer}"` });
  }
} catch (e) {
  results.push({ file: 'android/app/build.gradle', status: '❌', detail: e.message });
}

// E. version.json
try {
  if (fs.existsSync(PATHS.versionJson)) {
    const vJson = JSON.parse(fs.readFileSync(PATHS.versionJson, 'utf8'));
    vJson.version = targetVer;
    vJson.title = `Sınıf Asistanı v${targetVer} Yayında!`;
    const today = new Date().toISOString().split('T')[0];
    vJson.releaseDate = today;
    fs.writeFileSync(PATHS.versionJson, JSON.stringify(vJson, null, 2) + '\n', 'utf8');
    results.push({ file: 'version.json', status: '✅', detail: `version: "${targetVer}", date: "${today}"` });
  }
} catch (e) {
  results.push({ file: 'version.json', status: '❌', detail: e.message });
}

// F. js/app.js (APP_VERSION)
try {
  if (fs.existsSync(PATHS.appJs)) {
    let appJs = fs.readFileSync(PATHS.appJs, 'utf8');
    appJs = appJs.replace(/const\s+APP_VERSION\s*=\s*'[^']+';/g, `const APP_VERSION = '${targetVer}';`);
    fs.writeFileSync(PATHS.appJs, appJs, 'utf8');
    results.push({ file: 'js/app.js', status: '✅', detail: `APP_VERSION = '${targetVer}'` });
  }
} catch (e) {
  results.push({ file: 'js/app.js', status: '❌', detail: e.message });
}

// G. index.html (Sidebar Version Text)
try {
  if (fs.existsSync(PATHS.indexHtml)) {
    let indexHtml = fs.readFileSync(PATHS.indexHtml, 'utf8');
    indexHtml = indexHtml.replace(/<span id="app-sidebar-version-text">Sınıf Asistanı v[^<]+<\/span>/g, `<span id="app-sidebar-version-text">Sınıf Asistanı v${targetVer}</span>`);
    fs.writeFileSync(PATHS.indexHtml, indexHtml, 'utf8');
    results.push({ file: 'index.html', status: '✅', detail: `Sınıf Asistanı v${targetVer}` });
  }
} catch (e) {
  results.push({ file: 'index.html', status: '❌', detail: e.message });
}

// H. mobile.html (Kullanım Kılavuzu & Drawer Sürüm Metni)
try {
  if (fs.existsSync(PATHS.mobileHtml)) {
    let mobileHtml = fs.readFileSync(PATHS.mobileHtml, 'utf8');
    mobileHtml = mobileHtml.replace(/Versiyon:\s*<strong>v[^<]+<\/strong>/g, `Versiyon: <strong>v${targetVer}</strong>`);
    fs.writeFileSync(PATHS.mobileHtml, mobileHtml, 'utf8');
    results.push({ file: 'mobile.html', status: '✅', detail: `Versiyon: v${targetVer}` });
  }
} catch (e) {
  results.push({ file: 'mobile.html', status: '❌', detail: e.message });
}

// Sonuçları yazdır
console.table(results);

// Senkronizasyon (dist/ ve android assets)
console.log(`\n🔄 Dağıtım klasörleri senkronize ediliyor (npm run sync)...`);
try {
  execSync('npm run sync', { cwd: ROOT_DIR, stdio: 'inherit' });
  execSync("rsync -av --delete --exclude='*.DS_Store' dist/ android/app/src/main/assets/", { cwd: ROOT_DIR, stdio: 'ignore' });
  console.log(`✅ dist/ ve android/app/src/main/assets/ başarıyla güncellendi.\n`);
} catch (err) {
  console.warn(`⚠️ Senkronizasyon uyarısı: ${err.message}`);
}

console.log(`🎉 TÜM PLATFORMLAR (Masaüstü, Android, Web) v${targetVer} SÜRÜMÜNE EŞİTLENDİ!`);
console.log(`\n📌 Yeni sürümü yayınlamak için şu komutları kullanabilirsiniz:`);
console.log(`   git add .`);
console.log(`   git commit -m "chore(release): v${targetVer}"`);
console.log(`   git tag v${targetVer}`);
console.log(`   git push origin main --tags\n`);
