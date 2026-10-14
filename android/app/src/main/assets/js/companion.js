/**
 * Sınıf Asistanı — El Terminali Çekirdek Kontrolcüsü (companion.js)
 * Hafif, hızlı, çevrim dışı ve tek elle kullanıma optimize edilmiş mobil mantık.
 */

(function(window) {
  'use strict';

  // Sabit Depolama Anahtarları
  const PROFILE_STORAGE_KEY = 'sinif_companion_profile';
  const ACTIVE_SECTION_KEY = 'sinif_companion_active_section';
  const STUDENTS_STORAGE_KEY = 'sinif_companion_students';

  // Varsayılan Branş Listesi (Ortaokul Odaklı)
  const DEFAULT_BRANCHES = [
    'Matematik',
    'Fen Bilimleri',
    'Türkçe',
    'Sosyal Bilgiler',
    'İngilizce',
    'Din Kültürü ve Ahlak Bilgisi',
    'Bilişim Teknolojileri',
    'Görsel Sanatlar',
    'Müzik',
    'Beden Eğitimi',
    'Teknoloji ve Tasarım',
    'Sınıf Öğretmeni (İlkokul)'
  ];

  // Varsayılan Ortaokul Şubeleri
  const DEFAULT_SECTIONS = [
    '5-A', '5-B', '5-C',
    '6-A', '6-B', '6-C',
    '7-A', '7-B', '7-C',
    '8-A', '8-B', '8-C'
  ];

  // Varsayılan İlkokul Sınıfları (Sınıf Öğretmenleri İçin Tek Sınıf)
  const PRIMARY_SECTIONS = [
    '1-A', '1-B', '1-C', '1-D',
    '2-A', '2-B', '2-C', '2-D',
    '3-A', '3-B', '3-C', '3-D',
    '4-A', '4-B', '4-C', '4-D'
  ];

  // Sınıf Öğretmeni kontrolü
  function isPrimaryTeacherBranch(branch) {
    if (!branch) return false;
    return branch.includes('Sınıf Öğretmeni');
  }

  // Modül Durumu (State)
  const Companion = {
    profile: null,
    activeSection: '5-A',
    currentView: 'dashboard',
    isLocked: false,
    enteredPin: '',
    temporarySelectedSections: new Set(),

    isClassTeacher(branch) {
      if (this.profile && this.profile.teacherRole === 'primary') return true;
      if (this.profile && this.profile.isClassTeacher) return true;
      return isPrimaryTeacherBranch(branch || (this.profile && this.profile.branch));
    },

    // Uygulamayı Başlat
    init() {
      this.loadProfile();
      this.bindEvents();

      // Bulut canlı dinleyicisini başlat (Masaüstüyle tam eşgüdüm)
      if (window.CloudSync && typeof window.CloudSync.startLiveListener === 'function') {
        window.CloudSync.startLiveListener();
      }

      // Profil var mı kontrol et
      if (!this.profile || !this.profile.isComplete) {
        this.showView('setup');
        this.renderSetupForm();
      } else {
        this.activeSection = localStorage.getItem(ACTIVE_SECTION_KEY) || this.profile.sections[0] || (this.isClassTeacher() ? '3-A' : '5-A');
        this.updateHeader();
        this.renderSectionBar();
        this.showView('dashboard');
      }

      this.renderIcons();
    },

    // Profili Yükle
    loadProfile() {
      try {
        const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (raw) {
          this.profile = JSON.parse(raw);
        }
      } catch (e) {
        console.error('Profil yükleme hatası:', e);
        this.profile = null;
      }
    },

    // Profili Kaydet
    saveProfile(profileData) {
      this.profile = {
        ...profileData,
        isComplete: true,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this.profile));
      if (!this.profile.sections.includes(this.activeSection)) {
        this.activeSection = this.profile.sections[0] || (this.isClassTeacher() ? '3-A' : '5-A');
      }
      localStorage.setItem(ACTIVE_SECTION_KEY, this.activeSection);
      this.updateHeader();
      this.renderSectionBar();
      this.showToast('Profil başarıyla kaydedildi!');
      this.showView('dashboard');
    },

    // Aktif Şubeyi Değiştir
    setActiveSection(section) {
      this.activeSection = section;
      localStorage.setItem(ACTIVE_SECTION_KEY, section);
      this.renderSectionBar();
      this.updateHeader();
      this.vibrate(20);
      this.showToast(`Şube seçildi: ${section}`);
      
      if (this.currentView === 'dashboard') {
        const titleEl = document.getElementById('dash-active-section-name');
        if (titleEl) titleEl.textContent = section;
      } else if (this.currentView === 'omr' && window.CompanionOmr) {
        window.CompanionOmr.renderHub();
      } else if (this.currentView === 'behavior' && window.CompanionBehavior) {
        window.CompanionBehavior.init();
      } else if (this.currentView === 'homework' && window.CompanionHomework) {
        window.CompanionHomework.init();
      } else if (this.currentView === 'books' && window.CompanionBooks) {
        window.CompanionBooks.init();
      }
    },

    // Üst Bar Bilgilerini Güncelle
    updateHeader() {
      if (!this.profile) return;
      const nameEl = document.getElementById('appbar-teacher-name');
      const branchEl = document.getElementById('appbar-branch-name');
      const avatarEl = document.getElementById('appbar-avatar-initials');

      const isClassT = this.isClassTeacher();
      if (nameEl) nameEl.textContent = this.profile.name || 'Öğretmen';
      if (branchEl) {
        branchEl.textContent = isClassT
          ? `Sınıf Öğretmeni • ${this.activeSection}`
          : `${this.profile.branch || 'Branş'} • ${this.activeSection}`;
      }
      if (avatarEl) {
        const initials = (this.profile.name || 'Ö')
          .split(' ')
          .map(w => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        avatarEl.textContent = initials || 'Ö';
      }

      const dashName = document.getElementById('dash-hero-teacher-name');
      const dashSection = document.getElementById('dash-active-section-name');
      if (dashName) dashName.textContent = this.profile.name || 'Öğretmen';
      if (dashSection) dashSection.textContent = isClassT ? `${this.activeSection} Sınıfı` : this.activeSection;
    },

    // Şube Seçici Barı (Sınıf Öğretmeninde veya tek şubede GİZLENİR)
    renderSectionBar() {
      const container = document.getElementById('companion-section-bar');
      if (!container) return;

      // Sınıf Öğretmeni ise veya yalnızca 1 şube varsa barı tamamen gizle
      if (this.isClassTeacher() || !this.profile || !Array.isArray(this.profile.sections) || this.profile.sections.length <= 1) {
        container.style.display = 'none';
        return;
      }

      container.style.display = 'flex';
      container.innerHTML = `
        <span class="c-section-label">Şubeler:</span>
        ${this.profile.sections.map(sec => `
          <button type="button" class="c-section-pill ${sec === this.activeSection ? 'active' : ''}" onclick="window.Companion.setActiveSection('${sec}')">
            ${sec}
          </button>
        `).join('')}
      `;
    },

    // Branş seçimi değiştiğinde arayüzü güncelle
    handleBranchChange() {
      const branchSelect = document.getElementById('setup-branch-select');
      const multiGroup = document.getElementById('setup-multi-section-group');
      const singleGroup = document.getElementById('setup-single-section-group');
      const singleClassSelect = document.getElementById('setup-single-class-select');
      const currentBranch = branchSelect ? branchSelect.value : '';

      const isClassT = isPrimaryTeacherBranch(currentBranch);

      if (isClassT) {
        if (multiGroup) multiGroup.style.display = 'none';
        if (singleGroup) singleGroup.style.display = 'block';

        if (singleClassSelect && singleClassSelect.children.length === 0) {
          singleClassSelect.innerHTML = PRIMARY_SECTIONS.map(s => `
            <option value="${s}" ${(this.profile && this.profile.sections && this.profile.sections[0] === s) || s === '3-A' ? 'selected' : ''}>${s}</option>
          `).join('');
        }
      } else {
        if (multiGroup) multiGroup.style.display = 'block';
        if (singleGroup) singleGroup.style.display = 'none';
        this.renderSetupChips();
      }
    },

    // Profil Kurulum Ekranını Doldur
    renderSetupForm() {
      const branchSelect = document.getElementById('setup-branch-select');
      const nameInput = document.getElementById('setup-name-input');
      const pinInput = document.getElementById('setup-pin-input');

      if (this.profile) {
        if (nameInput) nameInput.value = this.profile.name || '';
        if (pinInput) pinInput.value = this.profile.pin || '';
        this.temporarySelectedSections = new Set(this.profile.sections || ['5-A', '6-A', '7-A', '8-A']);
      } else {
        this.temporarySelectedSections = new Set(['5-A', '6-A', '7-A', '8-A']);
      }

      // Branşları doldur
      if (branchSelect) {
        branchSelect.innerHTML = DEFAULT_BRANCHES.map(b => `
          <option value="${b}" ${this.profile && this.profile.branch === b ? 'selected' : ''}>${b}</option>
        `).join('');
      }

      this.handleBranchChange();
    },

    renderSetupChips() {
      const chipsContainer = document.getElementById('setup-section-chips');
      if (!chipsContainer) return;

      chipsContainer.innerHTML = `
        ${DEFAULT_SECTIONS.map(sec => `
          <button type="button" class="c-chip ${this.temporarySelectedSections.has(sec) ? 'selected' : ''}" onclick="window.Companion.toggleSectionChip('${sec}')">
            ${sec}
          </button>
        `).join('')}
        <button type="button" class="c-chip c-chip-add" onclick="window.Companion.promptAddCustomSection()">
          + Özel Şube
        </button>
      `;
    },

    toggleSectionChip(section) {
      if (this.temporarySelectedSections.has(section)) {
        if (this.temporarySelectedSections.size <= 1) {
          this.showToast('En az bir şube seçili olmalıdır.');
          return;
        }
        this.temporarySelectedSections.delete(section);
      } else {
        this.temporarySelectedSections.add(section);
      }
      this.vibrate(15);
      this.renderSetupChips();
    },

    promptAddCustomSection() {
      const custom = prompt('Eklemek istediğiniz şube adını girin (Örn: 8-D, 7-F):');
      if (custom && custom.trim()) {
        const formatted = custom.trim().toUpperCase();
        this.temporarySelectedSections.add(formatted);
        this.renderSetupChips();
        this.showToast(`${formatted} şubesi eklendi.`);
      }
    },

    // Formu Kaydetme Aksiyonu
    submitSetupForm() {
      const nameInput = document.getElementById('setup-name-input');
      const branchSelect = document.getElementById('setup-branch-select');
      const singleClassSelect = document.getElementById('setup-single-class-select');
      const pinInput = document.getElementById('setup-pin-input');

      const name = nameInput ? nameInput.value.trim() : '';
      const branch = branchSelect ? branchSelect.value : 'Matematik';
      const pin = pinInput ? pinInput.value.trim() : '';

      if (!name) {
        this.showToast('Lütfen adınızı ve soyadınızı girin.');
        nameInput && nameInput.focus();
        return;
      }

      const isClassT = isPrimaryTeacherBranch(branch);
      let sections = [];

      if (isClassT) {
        const singleSec = singleClassSelect ? singleClassSelect.value : '3-A';
        sections = [singleSec];
      } else {
        if (this.temporarySelectedSections.size === 0) {
          this.showToast('Lütfen girdiğiniz en az 1 şubeyi seçin.');
          return;
        }
        sections = Array.from(this.temporarySelectedSections).sort();
      }

      if (pin && (pin.length !== 4 || isNaN(pin))) {
        this.showToast('PIN kodu tam olarak 4 haneli bir sayı olmalıdır.');
        pinInput && pinInput.focus();
        return;
      }

      this.saveProfile({
        name,
        branch,
        sections,
        pin: pin || '1234'
      });
    },

    // Ekran Geçişleri
    showView(viewId) {
      this.currentView = viewId;
      const views = document.querySelectorAll('.c-view');
      views.forEach(v => {
        v.style.display = (v.id === `view-${viewId}`) ? 'block' : 'none';
      });

      // Bottom nav aktiflik durumu
      const navItems = document.querySelectorAll('.c-nav-item');
      navItems.forEach(item => {
        const target = item.getAttribute('data-target');
        item.classList.toggle('active', target === viewId);
      });

      // Header ve section bar görünürlüğü (setup ekranında gizle)
      const appbar = document.querySelector('.c-appbar');
      const sectionBar = document.getElementById('companion-section-bar');
      const bottomNav = document.querySelector('.c-bottom-nav');

      if (viewId === 'setup') {
        if (appbar) appbar.style.display = 'none';
        if (sectionBar) sectionBar.style.display = 'none';
        if (bottomNav) bottomNav.style.display = 'none';
      } else {
        if (appbar) appbar.style.display = 'flex';
        if (sectionBar) sectionBar.style.display = 'flex';
        if (bottomNav) bottomNav.style.display = 'flex';
      }

      window.scrollTo(0, 0);
      this.renderIcons();

      // OMR Modülü açıldığında verileri başlat ve render et
      if (viewId === 'omr' && window.CompanionOmr) {
        window.CompanionOmr.viewState = 'list';
        window.CompanionOmr.init();
      }

      // Davranış Modülü açıldığında verileri başlat ve render et
      if (viewId === 'behavior' && window.CompanionBehavior) {
        window.CompanionBehavior.init();
      }

      // Ödev Modülü açıldığında verileri başlat ve render et
      if (viewId === 'homework' && window.CompanionHomework) {
        window.CompanionHomework.init();
      }

      // Kitap Modülü açıldığında verileri başlat ve render et
      if (viewId === 'books' && window.CompanionBooks) {
        window.CompanionBooks.init();
      }

      // Eşitleme veya Ayarlar açıldığında bulut göstergelerini tazele
      if ((viewId === 'setup' || viewId === 'sync') && window.CloudSync) {
        window.CloudSync.updateSyncUI();
      }
    },

    // PIN Kilit Sistemi
    lockApp() {
      if (!this.profile || !this.profile.pin) return;
      this.isLocked = true;
      this.enteredPin = '';
      this.updatePinDots();
      const overlay = document.getElementById('companion-lock-overlay');
      if (overlay) overlay.style.display = 'flex';
      this.vibrate(30);
    },

    enterPinDigit(digit) {
      if (this.enteredPin.length < 4) {
        this.enteredPin += digit;
        this.vibrate(15);
        this.updatePinDots();

        if (this.enteredPin.length === 4) {
          setTimeout(() => this.verifyPin(), 100);
        }
      }
    },

    deletePinDigit() {
      if (this.enteredPin.length > 0) {
        this.enteredPin = this.enteredPin.slice(0, -1);
        this.vibrate(15);
        this.updatePinDots();
      }
    },

    updatePinDots() {
      const dots = document.querySelectorAll('.c-pin-dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('filled', index < this.enteredPin.length);
      });
    },

    verifyPin() {
      if (this.enteredPin === this.profile.pin) {
        this.isLocked = false;
        const overlay = document.getElementById('companion-lock-overlay');
        if (overlay) overlay.style.display = 'none';
        this.vibrate([20, 50, 20]);
        this.showToast('Oturum açıldı');
      } else {
        this.vibrate([100, 50, 100]);
        this.showToast('Hatalı PIN kodu!');
        this.enteredPin = '';
        this.updatePinDots();
      }
    },

    // Toast Bildirimi
    showToast(message) {
      let toast = document.getElementById('companion-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'companion-toast';
        toast.className = 'c-toast';
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 2500);
    },

    // Masaüstünden Tüm Sınıf & Verileri Kalıcı Çek
    async pullMasterDataFromCloud() {
      const btn = document.getElementById('btn-mobile-pull-master');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>Masaüstünden Yükleniyor...</span>';
      }
      this.showToast('Masaüstü veritabanı kontrol ediliyor...');

      if (!window.CloudSync) {
        this.showToast('Bulut motoru henüz başlatılmadı.');
        if (btn) btn.disabled = false;
        return;
      }

      const res = await window.CloudSync.pullMasterData();

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="refresh-cw" style="width: 18px; height: 18px;"></i><span>Tüm Sınıf & Verileri Masaüstünden Eşitle</span>';
        this.renderIcons();
      }

      if (res.success) {
        this.vibrate([40, 30, 40]);
        this.showToast(`✅ Eşitlendi! ${res.studentCount} öğrenci, ${res.examCount} sınav ve ${res.perfCount || 0} davranış puanı yüklendi.`);
        this.updateHeader();
        this.renderSectionBar();
        if (window.CompanionOmr) {
          window.CompanionOmr.ensureActiveExam();
          window.CompanionOmr.renderHub();
        }
        if (window.CompanionBehavior) {
          window.CompanionBehavior.init();
        }
        if (window.CompanionHomework) {
          window.CompanionHomework.init();
        }
        if (window.CompanionBooks) {
          window.CompanionBooks.init();
        }
      } else {
        const errorMsg = res.error || 'Masaüstünden veri bulunamadı. Lütfen masaüstünden "Terminale Gönder" butonuna basın.';
        this.showToast(errorMsg);
        alert('⚠️ Eşitleme Bekleniyor\n\n' + errorMsg);
      }
    },

    // Titreşim (Haptic)
    vibrate(pattern) {
      try {
        if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === 'function') {
          // Native bridge call if implemented
        } else if (navigator.vibrate) {
          navigator.vibrate(pattern);
        }
      } catch (e) {}
    },

    // Terminal Ayarları Modalı Metodları
    openSettingsModal() {
      const modal = document.getElementById('companion-settings-modal');
      if (!modal) return;

      const codeDisplay = document.getElementById('settings-modal-code-display');
      if (codeDisplay && window.CloudSync) {
        codeDisplay.textContent = window.CloudSync.syncCode || '-';
      }

      const nameInput = document.getElementById('settings-teacher-name-input');
      if (nameInput) {
        nameInput.value = (this.profile && this.profile.name) || 'Öğretmen';
      }

      const isClass = this.isClassTeacher();
      const rolePrimary = document.getElementById('role-primary');
      const roleMiddle = document.getElementById('role-middle');
      if (isClass) {
        if (rolePrimary) rolePrimary.checked = true;
      } else {
        if (roleMiddle) roleMiddle.checked = true;
      }
      this.handleRoleChange(isClass ? 'primary' : 'middle');

      const secSelect = document.getElementById('settings-primary-section');
      if (secSelect) {
        secSelect.value = this.activeSection || '3-A';
      }

      modal.style.display = 'flex';
      this.renderIcons();
    },

    closeSettingsModal() {
      const modal = document.getElementById('companion-settings-modal');
      if (modal) modal.style.display = 'none';
    },

    handleRoleChange(role) {
      const wrap = document.getElementById('settings-primary-section-wrap');
      const lblPrimary = document.getElementById('lbl-role-primary');
      const lblMiddle = document.getElementById('lbl-role-middle');

      if (role === 'primary') {
        if (wrap) wrap.style.display = 'block';
        if (lblPrimary) {
          lblPrimary.style.borderColor = '#4f46e5';
          lblPrimary.style.background = 'rgba(79, 70, 229, 0.08)';
        }
        if (lblMiddle) {
          lblMiddle.style.borderColor = '#e2e8f0';
          lblMiddle.style.background = '#f8fafc';
        }
      } else {
        if (wrap) wrap.style.display = 'none';
        if (lblMiddle) {
          lblMiddle.style.borderColor = '#4f46e5';
          lblMiddle.style.background = 'rgba(79, 70, 229, 0.08)';
        }
        if (lblPrimary) {
          lblPrimary.style.borderColor = '#e2e8f0';
          lblPrimary.style.background = '#f8fafc';
        }
      }
    },

    saveSettingsModal() {
      const nameInput = document.getElementById('settings-teacher-name-input');
      const teacherName = nameInput ? nameInput.value.trim() : 'Öğretmen';

      const rolePrimary = document.getElementById('role-primary');
      const isPrimary = rolePrimary ? rolePrimary.checked : false;

      const secSelect = document.getElementById('settings-primary-section');
      const primarySection = secSelect ? secSelect.value : '3-A';

      if (!this.profile) {
        this.profile = {
          pin: '1234',
          sections: isPrimary ? [primarySection] : DEFAULT_SECTIONS
        };
      }

      this.profile.name = teacherName;
      this.profile.teacherRole = isPrimary ? 'primary' : 'middle';
      this.profile.isClassTeacher = isPrimary;
      this.profile.branch = isPrimary ? 'Sınıf Öğretmeni (İlkokul)' : (this.profile.branch || 'Matematik');

      if (isPrimary) {
        this.profile.sections = [primarySection];
        this.activeSection = primarySection;
      } else {
        if (!this.profile.sections || this.profile.sections.length === 0) {
          this.profile.sections = ['5-A', '6-A', '7-A', '8-A'];
        }
      }

      this.saveProfile(this.profile);
      this.closeSettingsModal();
      this.showToast('✅ Terminal ayarları kaydedildi!');
    },

    async pushTerminalDataToCloud() {
      if (!window.CloudSync) {
        this.showToast('Bulut motoru hazır değil.');
        return;
      }
      this.showToast('Terminal verileri masaüstüne gönderiliyor...');
      const res = await window.CloudSync.pushMasterData();
      if (res && res.success) {
        this.showToast('✅ Veriler masaüstüne başarıyla aktarıldı!');
      } else {
        this.showToast((res && res.error) || 'Aktarım sırasında bir sorun oluştu.');
      }
    },

    // Lucide ikonlarını yeniden oluştur
    renderIcons() {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    // Olay Dinleyicileri
    bindEvents() {
      // Tema Butonu
      const themeBtn = document.getElementById('btn-companion-theme');
      if (themeBtn) {
        themeBtn.addEventListener('click', () => {
          const current = document.body.dataset.theme;
          document.body.dataset.theme = current === 'dark' ? 'light' : 'dark';
          this.vibrate(15);
        });
      }

      // Branş Değiştiğinde (Sınıf Öğretmeni vs Ortaokul)
      const branchSelect = document.getElementById('setup-branch-select');
      if (branchSelect) {
        branchSelect.addEventListener('change', () => {
          this.handleBranchChange();
          this.vibrate(10);
        });
      }
    }
  };

  window.Companion = Companion;

  document.addEventListener('DOMContentLoaded', () => {
    Companion.init();
  });
})(window);
