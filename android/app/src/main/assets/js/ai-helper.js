/**
 * Sınıf Asistanı — Yapay Zeka (Google Gemini) Entegrasyon ve Rehber Modülü
 * 
 * Bu modül; uygulama genelinde (Mobil & Masaüstü) yapay zeka gerektiren tüm araçlar için:
 * - Merkezi API anahtarı yönetimi (get/set/sync),
 * - API anahtarı girilmemişse neden çalışmadığını ve neler yapılması gerektiğini adım adım açıklayan modern rehber modalı,
 * - Tek tıkla AI Studio açma, link kopyalama, panodan anahtar yapıştırma ve bağlantı testi,
 * - Çok modelli dinamik Gemini çağrı motoru (callGeminiAPI)
 * sağlar.
 */

(() => {
  const STORAGE_KEY = 'sinif_asistani_gemini_api_key';
  const AI_STUDIO_URL = 'https://aistudio.google.com/app/apikey';

  // ─── 1. Temel API Anahtarı Fonksiyonları ──────────────────────────────────
  function getGeminiApiKey() {
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    return raw.trim().replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '');
  }
  window.getGeminiApiKey = getGeminiApiKey;

  function hasGeminiApiKey() {
    return !!getGeminiApiKey();
  }
  window.hasGeminiApiKey = hasGeminiApiKey;

  function setGeminiApiKey(key) {
    const cleanKey = (key || '').trim().replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '');
    if (cleanKey) {
      localStorage.setItem(STORAGE_KEY, cleanKey);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    // Açık olan tüm ilgili input alanlarını eşitle
    const mInput = document.getElementById('m-cfg-ai-key');
    if (mInput) mInput.value = cleanKey;

    const cfgInput = document.getElementById('config-gemini-api-key');
    if (cfgInput) cfgInput.value = cleanKey;

    const modalInput = document.getElementById('input-modal-gemini-api-key');
    if (modalInput) modalInput.value = cleanKey;

    // Mobil OMR buton rozetini güncelle
    if (typeof window.updateOmrApiBtnState === 'function') {
      try { window.updateOmrApiBtnState(); } catch (e) {}
    }

    // Haftalık / Optik durum banner'ını güncelle
    if (typeof window.updateOpticalApiKeyBanner === 'function') {
      try { window.updateOpticalApiKeyBanner(); } catch (e) {}
    }

    return cleanKey;
  }
  window.setGeminiApiKey = setGeminiApiKey;

  // ─── 2. Harici Bağlantı ve Bildirim Yardımcıları ─────────────────────────
  function safeOpenAIStudio() {
    const url = AI_STUDIO_URL;
    if (typeof window.safeOpenURL === 'function') {
      window.safeOpenURL(url);
    } else if (window.__TAURI__) {
      try {
        if (window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
          window.__TAURI__.core.invoke('plugin:opener|open', { path: url }).catch(() => window.open(url, '_blank'));
          return;
        } else if (window.__TAURI__.invoke && typeof window.__TAURI__.invoke === 'function') {
          window.__TAURI__.invoke('plugin:opener|open', { path: url }).catch(() => window.open(url, '_blank'));
          return;
        }
      } catch (e) {
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  }
  window.safeOpenAIStudio = safeOpenAIStudio;

  function notifyUser(msg, type = 'info') {
    if (typeof window.showMobileToast === 'function') {
      window.showMobileToast(msg, type);
    } else if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else {
      console.log(`[Toast ${type}] ${msg}`);
    }
  }

  // ─── 3. Dinamik Modal Stilleri (CSS Injection) ───────────────────────────
  function ensureAiModalStyles() {
    if (document.getElementById('ai-key-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'ai-key-modal-styles';
    style.textContent = `
      .ai-guide-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 14px;
        box-sizing: border-box;
        overflow-y: auto;
        opacity: 0;
        transition: opacity 0.22s ease;
      }
      .ai-guide-backdrop.show {
        opacity: 1;
      }
      .ai-guide-card {
        background: var(--m-surface, var(--bg-secondary, #ffffff));
        color: var(--m-text, var(--text-primary, #0f172a));
        border-radius: 22px;
        max-width: 540px;
        width: 100%;
        max-height: 92vh;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--m-border, var(--border-color, #e2e8f0));
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: scale(0.92) translateY(12px);
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: inherit;
      }
      .ai-guide-backdrop.show .ai-guide-card {
        transform: scale(1) translateY(0);
      }
      .ai-guide-top-stripe {
        height: 5px;
        background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
        flex-shrink: 0;
      }
      .ai-guide-header {
        padding: 1.1rem 1.35rem 0.85rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid var(--m-border, var(--border-color, #f1f5f9));
        flex-shrink: 0;
      }
      .ai-guide-title-box {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .ai-guide-icon-badge {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(139, 92, 246, 0.22));
        color: #6366f1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.35rem;
        flex-shrink: 0;
      }
      .ai-guide-title {
        font-weight: 800;
        font-size: 1.05rem;
        line-height: 1.25;
        color: var(--m-text, var(--text-primary, #0f172a));
      }
      .ai-guide-subtitle-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(16, 185, 129, 0.12);
        color: #059669;
        margin-top: 3px;
      }
      .ai-guide-close-btn {
        background: none;
        border: none;
        font-size: 1.6rem;
        line-height: 1;
        color: var(--m-text-muted, var(--text-muted, #94a3b8));
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 8px;
        transition: background 0.15s, color 0.15s;
      }
      .ai-guide-close-btn:hover {
        background: rgba(0, 0, 0, 0.05);
        color: var(--m-text, var(--text-primary, #0f172a));
      }
      .ai-guide-body {
        padding: 1.15rem 1.35rem;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        flex: 1;
      }
      .ai-guide-why-box {
        background: rgba(239, 68, 68, 0.06);
        border: 1px solid rgba(239, 68, 68, 0.25);
        border-radius: 14px;
        padding: 0.9rem 1rem;
        display: flex;
        gap: 10px;
      }
      .ai-guide-why-title {
        font-weight: 800;
        font-size: 0.86rem;
        color: #dc2626;
        margin-bottom: 3px;
      }
      .ai-guide-why-text {
        font-size: 0.79rem;
        line-height: 1.48;
        color: var(--m-text-muted, var(--text-secondary, #475569));
      }
      .ai-guide-steps-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .ai-guide-steps-header {
        font-weight: 800;
        font-size: 0.85rem;
        color: var(--m-text, var(--text-primary, #0f172a));
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ai-guide-step {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 0.55rem 0.7rem;
        background: var(--m-surface-subtle, rgba(241, 245, 249, 0.55));
        border-radius: 12px;
        border: 1px solid var(--m-border, rgba(226, 232, 240, 0.7));
      }
      .ai-guide-step-num {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #6366f1;
        color: #ffffff;
        font-size: 0.75rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 1px;
      }
      .ai-guide-step-title {
        font-weight: 750;
        font-size: 0.81rem;
        color: var(--m-text, var(--text-primary, #0f172a));
        margin-bottom: 2px;
      }
      .ai-guide-step-desc {
        font-size: 0.74rem;
        color: var(--m-text-muted, var(--text-secondary, #64748b));
        line-height: 1.42;
      }
      .ai-guide-link-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 0.74rem;
        font-weight: 700;
        padding: 6px 12px;
        border-radius: 8px;
        border: none;
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        color: #ffffff;
        cursor: pointer;
        text-decoration: none;
        margin-top: 6px;
        box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25);
      }
      .ai-guide-copy-link-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.74rem;
        font-weight: 700;
        padding: 5px 10px;
        border-radius: 8px;
        border: 1px solid var(--m-border, #cbd5e1);
        background: var(--m-surface, #ffffff);
        color: var(--m-text, #334155);
        cursor: pointer;
        margin-top: 6px;
        margin-left: 6px;
      }
      .ai-guide-input-card {
        background: var(--m-surface-subtle, rgba(248, 250, 252, 0.8));
        border: 1.5px solid rgba(99, 102, 241, 0.3);
        border-radius: 14px;
        padding: 0.9rem 1rem;
      }
      .ai-guide-input-label {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--m-text, var(--text-primary, #0f172a));
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .ai-guide-input-group {
        display: flex;
        gap: 6px;
        position: relative;
      }
      .ai-guide-input {
        flex: 1;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.85rem;
        padding: 0.65rem 0.85rem;
        border-radius: 10px;
        border: 1.5px solid var(--m-border, #cbd5e1);
        background: var(--m-surface, var(--bg-primary, #ffffff));
        color: var(--m-text, var(--text-primary, #0f172a));
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
        box-sizing: border-box;
      }
      .ai-guide-input:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
      }
      .ai-guide-paste-btn {
        padding: 0.65rem 0.85rem;
        font-size: 0.78rem;
        font-weight: 700;
        border-radius: 10px;
        border: 1px solid var(--m-border, #cbd5e1);
        background: var(--m-surface, #ffffff);
        color: #4f46e5;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      }
      .ai-guide-eye-btn {
        padding: 0.65rem 0.75rem;
        font-size: 0.9rem;
        border-radius: 10px;
        border: 1px solid var(--m-border, #cbd5e1);
        background: var(--m-surface, #ffffff);
        color: var(--m-text-muted, #64748b);
        cursor: pointer;
      }
      .ai-guide-feedback {
        font-size: 0.74rem;
        margin-top: 6px;
        display: none;
        line-height: 1.4;
        font-weight: 600;
      }
      .ai-guide-footer {
        padding: 0.85rem 1.35rem 1.15rem;
        border-top: 1px solid var(--m-border, var(--border-color, #f1f5f9));
        background: var(--m-surface, var(--bg-secondary, #ffffff));
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        align-items: center;
        flex-shrink: 0;
      }
      .ai-guide-btn-cancel {
        padding: 0.65rem 1rem;
        font-size: 0.82rem;
        font-weight: 600;
        border-radius: 12px;
        border: 1px solid var(--m-border, #cbd5e1);
        background: transparent;
        color: var(--m-text-muted, var(--text-secondary, #64748b));
        cursor: pointer;
      }
      .ai-guide-btn-test {
        padding: 0.65rem 0.9rem;
        font-size: 0.82rem;
        font-weight: 700;
        border-radius: 12px;
        border: 1px solid rgba(99, 102, 241, 0.3);
        background: rgba(99, 102, 241, 0.08);
        color: #6366f1;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .ai-guide-btn-save {
        padding: 0.65rem 1.25rem;
        font-size: 0.84rem;
        font-weight: 750;
        border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        color: #ffffff;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
      }
      .ai-guide-btn-save:hover {
        opacity: 0.95;
      }

      /* Koyu Tema Uyumlandırması */
      [data-theme="dark"] .ai-guide-card {
        background: #111827;
        color: #f8fafc;
        border-color: #1f2937;
      }
      [data-theme="dark"] .ai-guide-step {
        background: #1e293b;
        border-color: #334155;
      }
      [data-theme="dark"] .ai-guide-input-card {
        background: #0f172a;
        border-color: rgba(99, 102, 241, 0.35);
      }
      [data-theme="dark"] .ai-guide-input {
        background: #1e293b;
        color: #f8fafc;
        border-color: #334155;
      }
      [data-theme="dark"] .ai-guide-paste-btn,
      [data-theme="dark"] .ai-guide-eye-btn,
      [data-theme="dark"] .ai-guide-copy-link-btn {
        background: #1e293b;
        border-color: #334155;
        color: #e2e8f0;
      }
      [data-theme="dark"] .ai-guide-footer {
        background: #111827;
        border-color: #1f2937;
      }
      [data-theme="dark"] .ai-guide-btn-cancel {
        border-color: #334155;
        color: #94a3b8;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── 4. Merkezi Yapay Zeka Anahtarı Rehber Modalı ─────────────────────────
  /**
   * showGeminiKeyRequiredModal
   * 
   * @param {Object} options
   * @param {string} options.featureName - İşlemin adı (örn: "Yıllık Plan Hazırlama", "Optik Form Okuma")
   * @param {string} [options.description] - Özel ek açıklama
   * @param {string} [options.confirmText] - Kaydet butonunun metni (varsayılan: "Kaydet ve Devam Et")
   * @param {Function} [options.onSuccess] - Anahtar kaydedildiğinde çağrılacak callback (apiKey parametresi alır)
   * @param {Function} [options.onCancel] - Vazgeçildiğinde çağrılacak callback
   * @returns {Promise<string|null>} - Girilen anahtar veya iptal durumunda null
   */
  function showGeminiKeyRequiredModal(options = {}) {
    ensureAiModalStyles();

    const featureName = options.featureName || 'Yapay Zeka Aracı';
    const confirmText = options.confirmText || 'Kaydet ve Devam Et';
    const customDesc = options.description || '';

    // Varsa mevcut açık olanı kapat
    const oldBackdrop = document.getElementById('ai-guide-modal-backdrop');
    if (oldBackdrop) oldBackdrop.remove();

    return new Promise((resolve) => {
      let isResolved = false;
      const doResolve = (val) => {
        if (isResolved) return;
        isResolved = true;
        resolve(val);
      };

      const backdrop = document.createElement('div');
      backdrop.id = 'ai-guide-modal-backdrop';
      backdrop.className = 'ai-guide-backdrop';

      const currentKey = getGeminiApiKey();

      backdrop.innerHTML = `
        <div class="ai-guide-card" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
          <div class="ai-guide-top-stripe"></div>
          
          <div class="ai-guide-header">
            <div class="ai-guide-title-box">
              <div class="ai-guide-icon-badge">🤖</div>
              <div>
                <div class="ai-guide-title" id="ai-modal-title">Yapay Zeka API Anahtarı Gerekli</div>
                <div class="ai-guide-subtitle-badge">
                  <span>✓</span> Tamamen Ücretsiz • Kredi Kartsız
                </div>
              </div>
            </div>
            <button type="button" class="ai-guide-close-btn" id="btn-ai-modal-close" aria-label="Kapat">&times;</button>
          </div>

          <div class="ai-guide-body">
            <!-- Neden Çalışmıyor? -->
            <div class="ai-guide-why-box">
              <div style="font-size: 1.3rem; line-height: 1;">⚠️</div>
              <div style="flex: 1;">
                <div class="ai-guide-why-title">Bu Araç Neden Çalışmıyor?</div>
                <div class="ai-guide-why-text">
                  <strong>${featureName}</strong>, Google'ın gelişmiş <strong>Gemini</strong> yapay zekasına bağlanarak otomatik içerik üretir.
                  Google sunucularının bu isteği işleyebilmesi için ücretsiz bir <strong>Google Gemini API Anahtarı</strong> gereklidir.
                  ${customDesc ? `<div style="margin-top: 4px; color: #4338ca;">${customDesc}</div>` : ''}
                  <div style="margin-top: 5px; font-weight: 700; color: #dc2626;">
                    Uygulamada kayıtlı bir API anahtarı bulunmadığı için bu işlem şu anda gerçekleştirilemiyor.
                  </div>
                </div>
              </div>
            </div>

            <!-- Adım Adım Rehber -->
            <div class="ai-guide-steps-container">
              <div class="ai-guide-steps-header">
                <span>📋</span> Neler Yapmalısınız? (5 Adımda Ücretsiz Kurulum)
              </div>

              <!-- Adım 1 -->
              <div class="ai-guide-step">
                <div class="ai-guide-step-num">1</div>
                <div style="flex: 1;">
                  <div class="ai-guide-step-title">Google AI Studio Sayfasını Açın</div>
                  <div class="ai-guide-step-desc">
                    Google'ın resmi ve ücretsiz anahtar dağıtım sayfasına gidin:
                  </div>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                    <button type="button" id="btn-ai-modal-open-studio" class="ai-guide-link-btn">
                      🌐 Google AI Studio'yu Aç
                    </button>
                    <button type="button" id="btn-ai-modal-copy-link" class="ai-guide-copy-link-btn" title="Bağlantıyı Panoya Kopyala">
                      📋 Linki Kopyala
                    </button>
                  </div>
                </div>
              </div>

              <!-- Adım 2 -->
              <div class="ai-guide-step">
                <div class="ai-guide-step-num">2</div>
                <div style="flex: 1;">
                  <div class="ai-guide-step-title">Google Hesabınızla Giriş Yapın</div>
                  <div class="ai-guide-step-desc">
                    Herhangi bir Gmail / Google hesabınızla oturum açın. <em>(Kredi kartı, faturalandırma veya ödeme kesinlikle gerekmez.)</em>
                  </div>
                </div>
              </div>

              <!-- Adım 3 -->
              <div class="ai-guide-step">
                <div class="ai-guide-step-num">3</div>
                <div style="flex: 1;">
                  <div class="ai-guide-step-title">"Create API key" Butonuna Basın</div>
                  <div class="ai-guide-step-desc">
                    Sayfadaki mavi renkli <strong>"Create API key"</strong> butonuna dokunarak yeni projenizi oluşturun.
                  </div>
                </div>
              </div>

              <!-- Adım 4 -->
              <div class="ai-guide-step">
                <div class="ai-guide-step-num">4</div>
                <div style="flex: 1;">
                  <div class="ai-guide-step-title">Anahtar Kodunuzu Kopyalayın</div>
                  <div class="ai-guide-step-desc">
                    Oluşturulan <code>AIzaSy...</code> ile başlayan anahtarın yanındaki kopyalama simgesine dokunun.
                  </div>
                </div>
              </div>

              <!-- Adım 5 -->
              <div class="ai-guide-step">
                <div class="ai-guide-step-num">5</div>
                <div style="flex: 1;">
                  <div class="ai-guide-step-title">Aşağıdaki Kutuya Yapıştırıp Kaydedin</div>
                  <div class="ai-guide-step-desc">
                    Kopyaladığınız anahtarı aşağıdaki alana yapıştırın ve <strong>"${confirmText}"</strong> butonuna basın.
                  </div>
                </div>
              </div>
            </div>

            <!-- Anahtar Giriş Kartı -->
            <div class="ai-guide-input-card">
              <label for="ai-modal-input-key" class="ai-guide-input-label">
                <span>Google Gemini API Anahtarınız (AIzaSy...)</span>
                <span style="font-size: 0.72rem; color: #6366f1; font-weight: 600;">🔒 Güvenli Yerel Depolama</span>
              </label>
              <div class="ai-guide-input-group">
                <input type="password" id="ai-modal-input-key" class="ai-guide-input" placeholder="AIzaSy..." value="${currentKey}" autocomplete="off" spellcheck="false" />
                <button type="button" id="btn-ai-modal-paste" class="ai-guide-paste-btn" title="Panodan Yapıştır">
                  📋 Yapıştır
                </button>
                <button type="button" id="btn-ai-modal-eye" class="ai-guide-eye-btn" title="Göster / Gizle">
                  👁️
                </button>
              </div>
              <div id="ai-modal-feedback-box" class="ai-guide-feedback"></div>
              <div style="font-size: 0.71rem; color: var(--m-text-light, var(--text-muted, #94a3b8)); margin-top: 6px; display: flex; align-items: center; gap: 4px;">
                <span>🛡️</span>
                <span>Anahtarınız yalnızca cihazınızda saklanır ve doğrudan Google sunucularıyla güvenli iletişim kurmak için kullanılır.</span>
              </div>
            </div>
          </div>

          <div class="ai-guide-footer">
            <button type="button" id="btn-ai-modal-cancel" class="ai-guide-btn-cancel">
              Vazgeç
            </button>
            <button type="button" id="btn-ai-modal-test" class="ai-guide-btn-test" title="Anahtarı Google ile test et">
              ⚡ Test Et
            </button>
            <button type="button" id="btn-ai-modal-save" class="ai-guide-btn-save">
              <span>✨</span>
              <span>${confirmText}</span>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);
      requestAnimationFrame(() => backdrop.classList.add('show'));

      const input = backdrop.querySelector('#ai-modal-input-key');
      const feedback = backdrop.querySelector('#ai-modal-feedback-box');
      const btnClose = backdrop.querySelector('#btn-ai-modal-close');
      const btnCancel = backdrop.querySelector('#btn-ai-modal-cancel');
      const btnOpenStudio = backdrop.querySelector('#btn-ai-modal-open-studio');
      const btnCopyLink = backdrop.querySelector('#btn-ai-modal-copy-link');
      const btnPaste = backdrop.querySelector('#btn-ai-modal-paste');
      const btnEye = backdrop.querySelector('#btn-ai-modal-eye');
      const btnTest = backdrop.querySelector('#btn-ai-modal-test');
      const btnSave = backdrop.querySelector('#btn-ai-modal-save');

      function closeModal() {
        backdrop.classList.remove('show');
        setTimeout(() => backdrop.remove(), 240);
      }

      function showFeedback(text, isError = true) {
        if (!feedback) return;
        feedback.textContent = text;
        feedback.style.color = isError ? '#ef4444' : '#10b981';
        feedback.style.display = 'block';
      }

      // Kapatma / İptal
      const handleCancel = () => {
        closeModal();
        if (typeof options.onCancel === 'function') {
          options.onCancel();
        }
        doResolve(null);
      };
      btnClose.addEventListener('click', handleCancel);
      btnCancel.addEventListener('click', handleCancel);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) handleCancel();
      });

      // AI Studio Aç
      btnOpenStudio.addEventListener('click', () => {
        safeOpenAIStudio();
      });

      // Link Kopyala
      btnCopyLink.addEventListener('click', () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(AI_STUDIO_URL).then(() => {
            notifyUser('✓ Google AI Studio linki panoya kopyalandı!', 'success');
            showFeedback('✓ Google AI Studio linki panoya kopyalandı!', false);
          }).catch(() => {
            notifyUser('Google AI Studio: ' + AI_STUDIO_URL, 'info');
            showFeedback('Bağlantı: ' + AI_STUDIO_URL, false);
          });
        } else {
          notifyUser('Google AI Studio: ' + AI_STUDIO_URL, 'info');
          showFeedback('Bağlantı: ' + AI_STUDIO_URL, false);
        }
      });

      // Panodan Yapıştır
      btnPaste.addEventListener('click', async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const clip = await navigator.clipboard.readText();
            if (clip && clip.trim()) {
              input.value = clip.trim();
              showFeedback('✓ Panodaki metin yapıştırıldı!', false);
              return;
            }
          }
        } catch (e) {
          console.warn('Clipboard read error:', e);
        }
        input.focus();
        input.select();
        showFeedback('ℹ️ Kutuya basılı tutarak "Yapıştır" seçeneğini kullanabilirsiniz.', false);
      });

      // Göster / Gizle
      btnEye.addEventListener('click', () => {
        if (input.type === 'password') {
          input.type = 'text';
          btnEye.textContent = '🔒';
          btnEye.title = 'Gizle';
        } else {
          input.type = 'password';
          btnEye.textContent = '👁️';
          btnEye.title = 'Göster';
        }
      });

      // Bağlantıyı Test Et
      btnTest.addEventListener('click', async () => {
        const val = input.value.trim().replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '');
        if (!val) {
          showFeedback('Lütfen önce test edilecek bir API anahtarı girin!', true);
          return;
        }
        showFeedback('🔄 Google ile bağlantı test ediliyor, lütfen bekleyin...', false);
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${val}`);
          if (res.ok) {
            showFeedback('✅ Google Gemini bağlantısı başarılı! Anahtar geçerli.', false);
            notifyUser('✅ Google Gemini bağlantısı başarılı!', 'success');
          } else {
            let detail = 'Anahtar geçersiz';
            try {
              const j = await res.json();
              if (j.error && j.error.message) detail = j.error.message;
            } catch (e) {}
            showFeedback(`❌ Bağlantı başarısız: ${detail}`, true);
          }
        } catch (err) {
          showFeedback('❌ Bağlantı hatası: İnternet bağlantınızı kontrol edin.', true);
        }
      });

      // Kaydet ve Devam Et
      btnSave.addEventListener('click', () => {
        const val = input.value.trim().replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '');
        if (!val) {
          showFeedback('Lütfen geçerli bir Google Gemini API anahtarı girin!', true);
          input.focus();
          return;
        }

        // Anahtarı kaydet ve tüm DOM ile senkronize et
        const savedKey = setGeminiApiKey(val);
        closeModal();
        notifyUser('✓ Google Gemini API anahtarı başarıyla kaydedildi!', 'success');

        if (typeof options.onSuccess === 'function') {
          try {
            options.onSuccess(savedKey);
          } catch (err) {
            console.error('onSuccess callback error:', err);
          }
        }
        doResolve(savedKey);
      });

      // Giriş yapıldıysa input'a odaklan
      setTimeout(() => {
        if (input) input.focus();
      }, 180);
    });
  }
  window.showGeminiKeyRequiredModal = showGeminiKeyRequiredModal;
  window.openGeminiKeyModal = showGeminiKeyRequiredModal;

  /**
   * ensureGeminiApiKey
   * API anahtarı zaten kayıtlıysa hemen döner; kayıtlı değilse rehber modalını açar ve tamamlanmasını bekler.
   */
  async function ensureGeminiApiKey(options = {}) {
    const key = getGeminiApiKey();
    if (key) return key;
    return await showGeminiKeyRequiredModal(options);
  }
  window.ensureGeminiApiKey = ensureGeminiApiKey;

  // ─── 5. Çok Modelli Dinamik Gemini API Çağrı Motoru ──────────────────────
  window.callGeminiAPI = async function(prompt, options = {}) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error('NO_API_KEY');
    }

    // 1. Önce API anahtarının erişebildiği modelleri Google'dan doğrudan çek
    let listData = null;
    let listError = null;

    for (const apiVer of ['v1beta', 'v1']) {
      try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/${apiVer}/models?key=${apiKey}`);
        const json = await listRes.json();
        if (listRes.ok && json.models && json.models.length > 0) {
          listData = { version: apiVer, models: json.models };
          break;
        } else if (!listRes.ok) {
          listError = json.error?.message || `HTTP ${listRes.status}`;
        }
      } catch (e) {
        listError = e.message;
      }
    }

    if (!listData) {
      if (listError && (listError.toLowerCase().includes('api key not valid') || listError.toLowerCase().includes('invalid'))) {
        throw new Error('Google API anahtarı geçersiz! Lütfen anahtarınızı kontrol edip tekrar kaydedin.');
      }
      if (listError && (listError.includes('not been used in project') || listError.includes('disabled'))) {
        throw new Error('Google Cloud projenizde Generative Language API henüz etkin değil. Lütfen Google AI Studio\'da yeni anahtar oluşturun.');
      }
      throw new Error(`Google API bağlantı hatası: ${listError || 'Modeller sorgulanamadı'}`);
    }

    const supportedModels = listData.models.filter(m => 
      !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent')
    );

    if (supportedModels.length === 0) {
      throw new Error('Bu API anahtarının içerik üretme modellerine erişim izni bulunmuyor.');
    }

    const prioritizedCandidateNames = [
      'models/gemini-2.0-flash',
      'models/gemini-1.5-flash',
      'models/gemini-2.5-flash-lite',
      'models/gemini-2.0-flash-lite',
      'models/gemini-3.6-flash',
      'models/gemini-3-flash',
      ...supportedModels.map(m => m.name.startsWith('models/') ? m.name : `models/${m.name}`)
    ].filter((v, i, a) => a.indexOf(v) === i);

    let response = null;
    let lastErrDetail = '';
    const temperature = options.temperature !== undefined ? options.temperature : 0.3;
    const wantJson = options.json !== false;

    const requestParts = [{ text: prompt }];
    if (options.imageBase64) {
      requestParts.push({
        inlineData: {
          mimeType: options.imageMimeType || 'image/jpeg',
          data: options.imageBase64.replace(/^data:[a-zA-Z0-9.\/+-]+;base64,/, '')
        }
      });
    } else if (Array.isArray(options.parts)) {
      requestParts.push(...options.parts);
    }

    for (const modelPath of prioritizedCandidateNames) {
      const url = `https://generativelanguage.googleapis.com/${listData.version}/${modelPath}:generateContent?key=${apiKey}`;
      try {
        let curRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: requestParts }],
            generationConfig: {
              temperature: temperature,
              ...(wantJson ? { responseMimeType: 'application/json' } : {})
            }
          })
        });

        if (curRes.status === 400 && wantJson) {
          curRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: requestParts }],
              generationConfig: { temperature: temperature }
            })
          });
        }

        if (curRes.ok) {
          response = curRes;
          break;
        }

        let errDetail = '';
        try {
          const errJson = await curRes.json();
          errDetail = errJson.error?.message || curRes.statusText;
        } catch (e) {
          errDetail = curRes.statusText;
        }
        lastErrDetail = errDetail;

        const match = errDetail.match(/use\s+(models\/[a-zA-Z0-9.-]+)/i);
        if (match && match[1]) {
          const suggestedUrl = `https://generativelanguage.googleapis.com/${listData.version}/${match[1]}:generateContent?key=${apiKey}`;
          const retryRes = await fetch(suggestedUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: requestParts }],
              generationConfig: { temperature: temperature }
            })
          });
          if (retryRes.ok) {
            response = retryRes;
            break;
          }
        }
      } catch (err) {
        lastErrDetail = err.message;
      }
    }

    if (!response || !response.ok) {
      if (lastErrDetail && (lastErrDetail.toLowerCase().includes('quota') || lastErrDetail.toLowerCase().includes('rate limit') || lastErrDetail.includes('429'))) {
        throw new Error('Google Gemini istek kotası aşıldı. Lütfen 30 saniye sonra tekrar deneyin.');
      }
      throw new Error(`Yapay zeka yanıt veremedi: ${lastErrDetail || 'Bilinmeyen hata'}`);
    }

    const resJson = await response.json();
    const candidate = resJson.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Yapay zeka boş bir yanıt döndürdü.');
    }

    return candidate.content.parts[0].text;
  };
})();
