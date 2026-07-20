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

  // Cihaz kimliğini al (Tauri'de anakart UUID'si, Web'de LocalStorage benzersiz UUID'si)
  async function getDeviceId() {
    let devId = localStorage.getItem('sinif_asistani_device_uuid');
    if (window.__TAURI__) {
      try {
        const invoke = (window.__TAURI__.core && window.__TAURI__.core.invoke) || window.__TAURI__.invoke;
        if (invoke) {
          const nativeId = await invoke('get_machine_id');
          if (nativeId && nativeId !== 'unknown_machine') {
            return 'desktop_' + nativeId;
          }
        }
      } catch (e) {
        console.error("Tauri get_machine_id invoke failed:", e);
      }
    }
    if (!devId) {
      devId = 'web_' + Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem('sinif_asistani_device_uuid', devId);
    }
    return devId;
  }

  // Supabase API istek yardımcı fonksiyonu
  async function supabaseRequest(method, path, body = null) {
    if (!window.SupabaseConfig) {
      console.error("Supabase Config is missing.");
      return null;
    }
    const url = `${window.SupabaseConfig.url}/rest/v1/${path}`;
    const headers = {
      'apikey': window.SupabaseConfig.anonKey,
      'Authorization': `Bearer ${window.SupabaseConfig.anonKey}`,
      'Content-Type': 'application/json'
    };
    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        const text = await response.text();
        return text ? JSON.parse(text) : { success: true };
      }
      console.error("Supabase API error:", response.status, await response.text());
      return null;
    } catch (e) {
      console.error("Supabase connection error:", e);
      return null;
    }
  }

  // Çevrimiçi arka plan lisans sorgulaması (Farklı cihazda aktivasyon kontrolü)
  async function checkLicenseStatusOnline() {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (!savedKey) return;
    
    const localCheck = verifyLicenseKey(savedKey);
    if (!localCheck.isValid) return;
    
    const devId = await getDeviceId();
    
    // Supabase'den lisans durumunu sorgula
    const data = await supabaseRequest('GET', `licenses?license_key=eq.${encodeURIComponent(savedKey)}&select=*`);
    if (!data || data.length === 0) return; // Ağ hatası durumunda offline çalışmaya devam et
    
    const dbLicense = data[0];
    if (dbLicense.device_id && dbLicense.device_id !== devId) {
      // Lisans başka bir cihazda aktif edilmiş! Yerel lisansı iptal et.
      localStorage.removeItem(STORAGE_KEY);
      checkLicenseStatus();
      
      const alertMsg = "Lisansınız İptal Edildi: Bu ürün anahtarı başka bir bilgisayarda aktif edilmiştir!";
      if (window.showToast) {
        window.showToast(alertMsg, "danger");
      } else {
        alert(alertMsg);
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }

  // Global yapılandırmayı oluştur
  function checkLicenseStatus() {
    const savedKey = localStorage.getItem(STORAGE_KEY);
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
      saveLicense: async (key) => {
        // 1. Yerel imza doğrulaması
        const localCheck = verifyLicenseKey(key);
        if (!localCheck.isValid) {
          return { success: false, reason: localCheck.reason };
        }
        
        // 2. Cihaz ID ve Supabase doğrulaması
        const devId = await getDeviceId();
        const data = await supabaseRequest('GET', `licenses?license_key=eq.${encodeURIComponent(key)}&select=*`);
        
        if (!data) {
          return { success: false, reason: 'Aktivasyon için internet bağlantısı gereklidir!' };
        }
        if (data.length === 0) {
          return { success: false, reason: 'Geçersiz ürün anahtarı! (Bulut veritabanında bulunamadı)' };
        }
        
        const dbLicense = data[0];
        
        // Cihaz eşleştirme mantığı
        if (!dbLicense.device_id) {
          // İlk aktivasyon: Cihazı kilitle
          const update = await supabaseRequest('PATCH', `licenses?license_key=eq.${encodeURIComponent(key)}`, {
            device_id: devId,
            activated_at: new Date().toISOString()
          });
          if (!update) {
            return { success: false, reason: 'Cihaz kilitleme işlemi veritabanına kaydedilemedi!' };
          }
        } else if (dbLicense.device_id !== devId) {
          // Zaten başka bir cihaza kilitli!
          return { success: false, reason: 'Bu ürün anahtarı zaten başka bir bilgisayarda aktif edilmiştir!' };
        }
        
        // 3. Başarılı: Yerel depolamaya kaydet ve durumu güncelle
        localStorage.setItem(STORAGE_KEY, key);
        checkLicenseStatus();
        return { success: true, licensee: localCheck.licensee, expiryDate: localCheck.expiryDate };
      },
      removeLicense: () => {
        localStorage.removeItem(STORAGE_KEY);
        checkLicenseStatus();
      }
    };
  }

  // İlk yüklemede lisans durumunu kontrol et
  checkLicenseStatus();
  
  // Arka planda çevrimiçi kontrolü tetikle
  setTimeout(() => {
    checkLicenseStatusOnline();
  }, 1000);
})();
