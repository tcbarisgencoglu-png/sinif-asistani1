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

  // WhatsApp ile doğrudan mesaj açıcı (isteğe bağlı direkt çağrılar için)
  window.openWhatsAppDirect = function(customText = '') {
    const phone = '905058856785';
    const text = customText || 'Merhaba, Sınıf Asistanı 200 TL yıllık tam sürüm lisansı için ödememi yaptım. Lisans için dekont ve bilgilerimi paylaşmak istiyorum.';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    if (window.safeOpenURL) {
      window.safeOpenURL(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // IBAN kopyalama fonksiyonu
  window.copyLicenseIban = function(btnElement) {
    const iban = 'TR100009902171270400100010';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(iban).then(() => {
        if (btnElement) {
          const origHtml = btnElement.innerHTML;
          btnElement.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px;"></i> Kopyalandı!`;
          btnElement.style.background = '#10b981';
          btnElement.style.color = '#ffffff';
          if (window.safeCreateIcons) window.safeCreateIcons();
          setTimeout(() => {
            btnElement.innerHTML = origHtml;
            btnElement.style.background = '';
            btnElement.style.color = '';
            if (window.safeCreateIcons) window.safeCreateIcons();
          }, 2000);
        }
        if (window.showToast) window.showToast('IBAN panoya kopyalandı! ✅', 'success');
      }).catch(() => fallbackCopy(iban));
    } else {
      fallbackCopy(iban);
    }

    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (window.showToast) window.showToast('IBAN panoya kopyalandı! ✅', 'success');
    }
  };

  // Tam Sürüm Lisans Satın Alma ve Bilgilendirme Rehberi Modalı
  function showLicensePurchaseGuideModal(featureName = '') {
    let modal = document.getElementById('modal-license-purchase-guide');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'modal-license-purchase-guide';
      modal.style.zIndex = '10000';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 560px; max-height: 90vh; overflow-y: auto; padding: 1.75rem; border-radius: var(--radius-lg); background: var(--bg-secondary); border: 1.5px solid var(--border-color); box-shadow: 0 25px 50px rgba(0,0,0,0.4);">
          
          <!-- Başlık & Kapatma -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.9rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(99, 102, 241, 0.15); display: flex; align-items: center; justify-content: center; color: var(--primary);">
                <i data-lucide="crown" style="width: 24px; height: 24px; color: #f59e0b;"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--text-primary);">Sınıf Asistanı — Tam Sürüm Lisans</h3>
                <span style="font-size: 0.8rem; color: var(--text-muted);">Sınırsız Öğrenci, Kitap ve Yıllık Plan Erişimi</span>
              </div>
            </div>
            <button class="btn-close-license-guide" style="background: none; border: none; font-size: 1.6rem; color: var(--text-muted); cursor: pointer; line-height: 1; padding: 0.25rem;">&times;</button>
          </div>

          <!-- 1 Aylık Ücretsiz Deneme Lisansı Bannerı -->
          <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.15)); border: 1.5px solid rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap;">
            <div>
              <div style="font-weight: 800; font-size: 0.95rem; color: #10b981; display: flex; align-items: center; gap: 0.4rem;">
                <i data-lucide="gift" style="width: 18px; height: 18px;"></i> 1 Aylık Ücretsiz Deneme Lisansı
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
                Henüz satın almadan önce tüm özellikleri 30 gün boyunca ücretsiz deneyin.
              </div>
            </div>
            <button type="button" id="btn-guide-get-demo-license" class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; font-weight: 700; padding: 0.55rem 1rem; border-radius: 8px; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);">
              <span>1 Ay Ücretsiz Başlat 🚀</span>
            </button>
          </div>

          <!-- Açıklama ve Fiyat Kutusu -->
          <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem; line-height: 1.55;">
            <p style="margin: 0 0 0.6rem 0; font-size: 0.88rem; color: var(--text-secondary);">
              Değerli Öğretmenimiz; <strong>Sınıf Asistanı</strong> uygulamasının geliştirme masraflarının karşılanabilmesi, yeni özelliklerin eklenmesi ve güncellemelerin kesintisiz devam edebilmesi için cüzi bir yıllık lisans ücreti talep edilmektedir.
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.6rem 1rem; border-radius: 8px;">
              <span style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">Yıllık Tam Sürüm Bedeli:</span>
              <span style="font-size: 1.15rem; font-weight: 800; color: #10b981;">200 TL <small style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">/ 1 Yıl</small></span>
            </div>
          </div>

          <!-- 3 Adımda Lisans Alma Rehberi -->
          <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.04em;">
              Adım Adım Lisans Aktifleştirme:
            </div>

            <!-- Adım 1 -->
            <div style="display: flex; gap: 0.85rem; padding: 0.85rem; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 8px;">
              <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(99, 102, 241, 0.2); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; flex-shrink: 0;">
                1
              </div>
              <div style="flex: 1; font-size: 0.84rem; line-height: 1.45;">
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.3rem;">Ücretin Yatırılması (FAST / Havale)</div>
                <div style="color: var(--text-muted); margin-bottom: 0.5rem;">Aşağıdaki banka hesabına <strong>200 TL</strong> lisans ücretini yatırınız:</div>
                
                <div style="background: rgba(0,0,0,0.25); border: 1px dashed rgba(255,255,255,0.2); border-radius: 6px; padding: 0.6rem 0.75rem; display: flex; flex-direction: column; gap: 0.4rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: 0.82rem;">
                    <span style="color: var(--text-muted);">Alıcı / Hesap Sahibi:</span>
                    <strong style="color: var(--text-primary); font-size: 0.88rem; letter-spacing: 0.02em;">Barış GENÇOĞLU</strong>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.35rem;">
                    <code style="font-family: monospace; font-size: 0.88rem; font-weight: 700; color: #38bdf8; letter-spacing: 0.05em;">TR10 0009 9021 7127 0400 1000 10</code>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="window.copyLicenseIban(this)" style="font-size: 0.75rem; padding: 0.25rem 0.6rem; display: flex; align-items: center; gap: 0.3rem; cursor: pointer;">
                      <i data-lucide="copy" style="width: 13px; height: 13px;"></i> IBAN'ı Kopyala
                    </button>
                  </div>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">* Açıklama alanına <strong>Adınız Soyadınız</strong> ve <strong>Sınıf Asistanı Lisans</strong> yazınız.</div>
              </div>
            </div>

            <!-- Adım 2 -->
            <div style="display: flex; gap: 0.85rem; padding: 0.85rem; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 8px;">
              <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(37, 211, 102, 0.2); color: #25D366; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; flex-shrink: 0;">
                2
              </div>
              <div style="flex: 1; font-size: 0.84rem; line-height: 1.45;">
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem;">Dekont ve Bilgilerin İletilmesi</div>
                <div style="color: var(--text-muted);">
                  Ödeme dekontunuzu ve lisans için gerekli bilgileri (<strong>Adınız Soyadınız, Okulunuz</strong>) <strong>0505 885 67 85</strong> nolu WhatsApp hattımıza gönderiniz.
                </div>
              </div>
            </div>

            <!-- Adım 3 -->
            <div style="display: flex; gap: 0.85rem; padding: 0.85rem; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 8px;">
              <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(245, 158, 11, 0.2); color: #f59e0b; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; flex-shrink: 0;">
                3
              </div>
              <div style="flex: 1; font-size: 0.84rem; line-height: 1.45;">
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem;">Lisans Kodunun Teslimi ve Tam Sürüm</div>
                <div style="color: var(--text-muted);">
                  WhatsApp üzerinden sizinle iletişime geçilerek adınıza özel üretilen <strong>Lisans Anahtarı</strong> gün içinde saat 16.00'a kadar iletilir. Lisans kodunu uygulamaya yapıştırarak sınırsız sürüme anında geçebilirsiniz.
                </div>
              </div>
            </div>
          </div>

          <!-- Aksiyon Butonları -->
          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            <button type="button" id="btn-guide-open-whatsapp" class="btn" style="background: #25D366; color: white; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 700; padding: 0.8rem; border-radius: 8px; text-decoration: none; border: none; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);">
              <i data-lucide="message-circle" style="width: 20px; height: 20px;"></i>
              WhatsApp ile Dekont / Bilgi Gönder (0505 885 67 85)
            </button>

            <button type="button" id="btn-guide-enter-key" class="btn btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600; padding: 0.65rem; border-radius: 8px; font-size: 0.85rem;">
              <i data-lucide="key" style="width: 16px; height: 16px;"></i>
              Lisans Anahtarım Var, Kodu Yapıştır
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => modal.classList.remove('active');
      modal.querySelector('.btn-close-license-guide').addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

      document.getElementById('btn-guide-open-whatsapp').addEventListener('click', () => {
        window.openWhatsAppDirect();
      });

      const btnGuideGetDemo = document.getElementById('btn-guide-get-demo-license');
      if (btnGuideGetDemo) {
        btnGuideGetDemo.addEventListener('click', () => {
          closeModal();
          showAppDemoLicenseModal();
        });
      }

      document.getElementById('btn-guide-enter-key').addEventListener('click', () => {
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

    modal.classList.add('active');
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Uygulama İçi 1 Aylık Ücretsiz Demo Lisansı Modalı
  function showAppDemoLicenseModal() {
    let modal = document.getElementById('modal-app-demo-license');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'modal-app-demo-license';
      modal.style.zIndex = '10005';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; max-height: 90vh; overflow-y: auto; padding: 1.75rem; border-radius: var(--radius-lg); background: var(--bg-secondary); border: 1.5px solid rgba(16, 185, 129, 0.4); box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
          
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.9rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: white;">
                <i data-lucide="gift" style="width: 22px; height: 22px;"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">1 Aylık Ücretsiz Deneme Lisansı</h3>
                <span style="font-size: 0.78rem; color: var(--text-muted);">Sınırsız Özellikler • 30 Gün Ücretsiz</span>
              </div>
            </div>
            <button class="btn-close-app-demo" style="background: none; border: none; font-size: 1.6rem; color: var(--text-muted); cursor: pointer; line-height: 1; padding: 0.25rem;">&times;</button>
          </div>

          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.82rem; line-height: 1.5; color: var(--text-secondary);">
            ✨ Bilgilerinizi girerek <strong>30 günlük tam sürüm lisansınızı</strong> anında bu cihazda aktifleştirebilirsiniz. Kredi kartı veya ödeme gerekmez!
          </div>

          <form id="form-app-demo-license" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.35rem; display: block;">
                Adınız Soyadınız <span style="color: #ef4444;">*</span>
              </label>
              <input type="text" id="app-demo-name" class="form-control" placeholder="Örn: Ayşe Yılmaz" required style="width: 100%; padding: 0.7rem 0.9rem; font-size: 0.9rem;">
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.35rem; display: block;">
                Telefon Numaranız (WhatsApp) <span style="color: #ef4444;">*</span>
              </label>
              <input type="tel" id="app-demo-phone" class="form-control" placeholder="Örn: 0555 123 45 67" required style="width: 100%; padding: 0.7rem 0.9rem; font-size: 0.9rem;">
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.35rem; display: block;">
                Okulunuz / Branşınız <span style="font-weight: 400; color: var(--text-muted);">(İsteğe bağlı)</span>
              </label>
              <input type="text" id="app-demo-school" class="form-control" placeholder="Örn: Atatürk İlkokulu / Sınıf Öğretmeni" style="width: 100%; padding: 0.7rem 0.9rem; font-size: 0.9rem;">
            </div>

            <div id="app-demo-error" style="display: none; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 0.6rem 0.8rem; font-size: 0.8rem; color: #fca5a5;"></div>

            <button type="submit" id="btn-submit-app-demo" class="btn" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-weight: 700; padding: 0.8rem; border-radius: 8px; font-size: 0.92rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); margin-top: 0.3rem;">
              <span>30 Günlük Lisansı Oluştur ve Aktifleştir 🚀</span>
            </button>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => modal.classList.remove('active');
      modal.querySelector('.btn-close-app-demo').addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

      document.getElementById('form-app-demo-license').addEventListener('submit', async (e) => {
        e.preventDefault();
        const txtName = document.getElementById('app-demo-name');
        const txtPhone = document.getElementById('app-demo-phone');
        const txtSchool = document.getElementById('app-demo-school');
        const errEl = document.getElementById('app-demo-error');
        const btnSubmit = document.getElementById('btn-submit-app-demo');

        const name = (txtName ? txtName.value : '').trim();
        const phone = (txtPhone ? txtPhone.value : '').trim();
        const school = (txtSchool ? txtSchool.value : '').trim();

        if (!name || name.length < 3) {
          if (errEl) { errEl.textContent = 'Lütfen geçerli bir Ad ve Soyad giriniz.'; errEl.style.display = 'block'; }
          return;
        }
        const cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 10) {
          if (errEl) { errEl.textContent = 'Lütfen geçerli bir telefon numarası giriniz.'; errEl.style.display = 'block'; }
          return;
        }

        if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
        btnSubmit.disabled = true;
        const origBtnText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = `<span>⏳ Aktifleştiriliyor...</span>`;

        try {
          const now = new Date();
          const expiryDateObj = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          const expiryDate = expiryDateObj.toISOString().split('T')[0];

          const payloadName = `${name}`;
          const payloadString = `${payloadName}|${expiryDate}`;
          const payloadBase64 = encodeUtf8Base64(payloadString);
          const signature = generateSignature(payloadName, expiryDate);
          const licenseKey = `${payloadBase64}-${signature}`;

          // Supabase kaydet
          await supabaseRequest('POST', 'licenses', {
            license_key: licenseKey,
            licensee_name: `${name} (${phone}) - ${school || 'Öğretmen'} [Uygulama İçi Demo]`,
            expiry_date: expiryDate
          });

          // Otomatik yerel aktifleştir
          const actResult = await window.LicenseConfig.saveLicense(licenseKey);
          if (actResult.success) {
            closeModal();
            const guideModal = document.getElementById('modal-license-purchase-guide');
            if (guideModal) guideModal.classList.remove('active');

            const alertMsg = `🎉 Tebrikler! 1 Aylık Tam Sürüm Lisansınız Başarıyla Aktifleştirildi! (Bitiş: ${expiryDate})`;
            if (window.showToast) {
              window.showToast(alertMsg, 'success');
            } else {
              alert(alertMsg);
            }

            const event = new CustomEvent('stateChanged');
            document.dispatchEvent(event);
          } else {
            if (errEl) {
              errEl.textContent = `Aktivasyon Hatası: ${actResult.reason}`;
              errEl.style.display = 'block';
            }
          }
        } catch (err) {
          console.error(err);
          if (errEl) {
            errEl.textContent = 'Bir hata oluştu. İnternet bağlantınızı kontrol edin.';
            errEl.style.display = 'block';
          }
        } finally {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = origBtnText;
        }
      });
    }

    modal.classList.add('active');
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  window.openAppDemoLicense = showAppDemoLicenseModal;

  window.openLicensePurchase = showLicensePurchaseGuideModal;

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
      showPrompt: showLicensePurchaseGuideModal,
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
