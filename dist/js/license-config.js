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

  // WhatsApp ile lisans satın alma yönlendiricisi
  window.openLicensePurchase = function(reason = '') {
    const phone = '905058856785';
    let text = 'Merhaba, Sınıf Asistanı programı için tam sürüm lisansı satın almak istiyorum.';
    if (reason) {
      text += ` (Konu: ${reason})`;
    }
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${phone}?text=${encoded}`;
    
    if (window.safeOpenURL) {
      window.safeOpenURL(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // Demo kısıtına takılan öğretmenler için şık bilgilendirme ve satın alma penceresi
  function showLicensePromptModal(feature = 'Öğrenci Yönetimi', limit = 5) {
    let modal = document.getElementById('modal-license-prompt');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'modal-license-prompt';
      modal.style.zIndex = '9999';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 480px; padding: 1.75rem; border-radius: var(--radius-lg); background: var(--bg-secondary); border: 1px solid var(--border-color); box-shadow: 0 20px 40px rgba(0,0,0,0.35);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(99, 102, 241, 0.15); display: flex; align-items: center; justify-content: center; color: var(--primary);">
                <i data-lucide="sparkles" style="width: 22px; height: 22px;"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">Tam Sürüme Yükseltin 🚀</h3>
                <span style="font-size: 0.75rem; color: #f59e0b; font-weight: 600;">Demo Sürüm Sınırına Ulaşıldı</span>
              </div>
            </div>
            <button class="btn-close-license-prompt" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
          </div>

          <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 0.9rem; margin-bottom: 1.25rem; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
            <span id="license-prompt-desc">Demo sürüm sınırına ulaştınız. Tüm sınıfınızı eklemek ve sınırsız özelliklere erişmek için tam sürüm lisansı edinebilirsiniz.</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <button type="button" id="btn-license-prompt-whatsapp" class="btn" style="background: #25D366; color: white; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600; padding: 0.75rem; border-radius: 8px; text-decoration: none; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25);">
              <i data-lucide="message-circle" style="width: 20px; height: 20px;"></i>
              WhatsApp ile Lisans Satın Al (0505 885 67 85)
            </button>

            <button type="button" id="btn-license-prompt-enter-key" class="btn btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600; padding: 0.6rem; border-radius: 8px;">
              <i data-lucide="key" style="width: 18px; height: 18px;"></i>
              Lisans Anahtarım Var, Kodu Gir
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => modal.classList.remove('active');
      modal.querySelector('.btn-close-license-prompt').addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

      document.getElementById('btn-license-prompt-whatsapp').addEventListener('click', (e) => {
        e.preventDefault();
        window.openLicensePurchase('Lisans Satın Alma Talebi');
      });

      document.getElementById('btn-license-prompt-enter-key').addEventListener('click', () => {
        closeModal();
        if (window.switchTab) {
          window.switchTab('assistant-config');
          const tabGeneralBtn = document.getElementById('tab-btn-config-general');
          if (tabGeneralBtn) tabGeneralBtn.click();
          setTimeout(() => {
            const txtKey = document.getElementById('txt-license-key');
            if (txtKey) {
              txtKey.scrollIntoView({ behavior: 'smooth', block: 'center' });
              txtKey.focus();
            }
          }, 150);
        }
      });
    }

    const descElem = modal.querySelector('#license-prompt-desc');
    if (descElem) {
      descElem.innerHTML = `Demo sürümde <strong>${feature}</strong> için <strong>en fazla ${limit}</strong> limit tanımlıdır.<br>Tüm sınıfınızı yönetmek ve sınırsız özelliklere erişmek için tam sürüm lisansı edinebilirsiniz.`;
    }

    modal.classList.add('active');
    if (window.safeCreateIcons) window.safeCreateIcons();
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
      contactPhone: '05058856785',
      showPrompt: showLicensePromptModal,
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
