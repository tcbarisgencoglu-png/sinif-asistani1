(() => {
  // Sınıf Asistanı Çevrimdışı Lisanslama Modülü
  const SECRET_SALT = 'SinifAsistani2026SecureLicensingKey_v1';
  const STORAGE_KEY = 'sinif_asistani_license_key';

  // Hızlı ve bağımsız 128-bit hash fonksiyonu
  function cyrb128(str) {
    let h1 = 1779033703, h2 = 3024733165, h3 = 3362453659, h4 = 502493250;
    for (let i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
  }

  // Unicode güvenli Base64 Çözücü
  function decodeUtf8Base64(base64Str) {
    try {
      return decodeURIComponent(escape(atob(base64Str)));
    } catch (e) {
      return null;
    }
  }

  // Unicode güvenli Base64 Kodlayıcı (doğrulama testi için)
  function encodeUtf8Base64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  // Lisans imza üretim fonksiyonu
  function generateSignature(name, expiry) {
    const rawData = `${name.trim().toLowerCase()}|${expiry}|${SECRET_SALT}`;
    const hashes = cyrb128(rawData);
    
    // Hash değerlerini Hex bloklarına dönüştür
    const toHex = (n) => (n >>> 0).toString(16).padStart(8, '0').toUpperCase();
    const hex = hashes.map(toHex).join('');
    
    // XXXX-XXXX-XXXX-XXXX formatına getir
    return `${hex.substr(0,4)}-${hex.substr(4,4)}-${hex.substr(8,4)}-${hex.substr(12,4)}`;
  }

  // Lisans anahtarını doğrula
  function verifyLicenseKey(key) {
    if (!key || typeof key !== 'string') return { isValid: false, reason: 'Lisans kodu girilmedi.' };
    
    const dashIdx = key.indexOf('-');
    if (dashIdx === -1) return { isValid: false, reason: 'Geçersiz lisans formatı.' };
    
    const payloadBase64 = key.substring(0, dashIdx);
    const signature = key.substring(dashIdx + 1);
    
    const decodedPayload = decodeUtf8Base64(payloadBase64);
    if (!decodedPayload) return { isValid: false, reason: 'Lisans verisi çözülemedi.' };
    
    const parts = decodedPayload.split('|');
    if (parts.length !== 2) return { isValid: false, reason: 'Lisans verisi geçersiz.' };
    
    const name = parts[0];
    const expiry = parts[1]; // YYYY-MM-DD veya "never"
    
    // İmzayı yeniden hesapla ve karşılaştır
    const expectedSignature = generateSignature(name, expiry);
    if (signature !== expectedSignature) {
      return { isValid: false, reason: 'Lisans imzası uyuşmuyor.' };
    }
    
    // Tarih kontrolü yap
    if (expiry !== 'never') {
      const today = new Date();
      today.setHours(0,0,0,0);
      const expiryDate = new Date(expiry);
      if (isNaN(expiryDate.getTime())) {
        return { isValid: false, reason: 'Geçersiz lisans tarihi.' };
      }
      if (today > expiryDate) {
        return { isValid: false, reason: 'Lisans süreniz dolmuştur.' };
      }
    }
    
    return {
      isValid: true,
      licensee: name,
      expiryDate: expiry
    };
  }

  // Global yapılandırmayı oluştur
  function checkLicenseStatus() {
    const DEFAULT_KEY = 'U8SxbsSxZiBBc2lzdGFuxLEgS3VsbGFuxLFjxLFzxLF8bmV2ZXI=-7098-1EA4-D0F9-2C4F';
    let savedKey = localStorage.getItem(STORAGE_KEY);
    
    if (localStorage.getItem('sinif_asistani_license_removed') === 'true') {
      savedKey = null;
    } else if (!savedKey) {
      savedKey = DEFAULT_KEY;
    }
    
    const verification = verifyLicenseKey(savedKey);
    
    window.LicenseConfig = {
      isDemo: !verification.isValid,
      licensee: verification.isValid ? verification.licensee : '',
      expiryDate: verification.isValid ? verification.expiryDate : '',
      studentLimit: 5,
      planLimit: 2,
      bookLimit: 10,
      notebookLimit: 2,
      verifyLicenseKey: verifyLicenseKey,
      generateSignature: generateSignature,
      encodeUtf8Base64: encodeUtf8Base64,
      saveLicense: (key) => {
        const check = verifyLicenseKey(key);
        if (check.isValid) {
          localStorage.setItem(STORAGE_KEY, key);
          localStorage.removeItem('sinif_asistani_license_removed');
          checkLicenseStatus(); // Durumu güncelle
          return { success: true, licensee: check.licensee, expiryDate: check.expiryDate };
        }
        return { success: false, reason: check.reason };
      },
      removeLicense: () => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem('sinif_asistani_license_removed', 'true');
        checkLicenseStatus();
      }
    };
  }

  // İlk yüklemede lisans durumunu kontrol et
  checkLicenseStatus();
})();
