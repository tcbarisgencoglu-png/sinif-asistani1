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
    'Rehberlik / Diğer'
  ];

  // Varsayılan Ortaokul Şubeleri (A, B, C, D, E)
  const DEFAULT_SECTIONS = [
    '5-A', '5-B', '5-C', '5-D', '5-E',
    '6-A', '6-B', '6-C', '6-D', '6-E',
    '7-A', '7-B', '7-C', '7-D', '7-E',
    '8-A', '8-B', '8-C', '8-D', '8-E'
  ];

  // Varsayılan İlkokul Sınıfları (Sınıf Öğretmenleri İçin Tek Sınıf: A, B, C, D, E)
  const PRIMARY_SECTIONS = [
    '1-A', '1-B', '1-C', '1-D', '1-E',
    '2-A', '2-B', '2-C', '2-D', '2-E',
    '3-A', '3-B', '3-C', '3-D', '3-E',
    '4-A', '4-B', '4-C', '4-D', '4-E'
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
    setupStep: 1,
    setupSelectedRole: 'primary',
    userSelectedSingleClass: null,

    isClassTeacher(branch) {
      if (this.profile && this.profile.teacherRole === 'primary') return true;
      if (this.profile && this.profile.isClassTeacher) return true;
      return isPrimaryTeacherBranch(branch || (this.profile && this.profile.branch));
    },

    // Uygulamayı Başlat
    init() {
      this.loadProfile();
      this.initTheme();
      this.bindEvents();
      this.initHistoryBack();

      // Bulut canlı dinleyicisini başlat (Masaüstüyle tam eşgüdüm)
      if (window.CloudSync && typeof window.CloudSync.startLiveListener === 'function') {
        window.CloudSync.startLiveListener();
      }

      // Profil var mı kontrol et (Profil tamamlanmışsa doğrudan ana menü açılır)
      const hasCompletedProfile = Boolean(this.profile && this.profile.isComplete);

      if (!hasCompletedProfile) {
        this.showView('setup');
        this.renderSetupForm();
      } else {
        this.activeSection = localStorage.getItem(ACTIVE_SECTION_KEY) || (this.profile.sections && this.profile.sections[0]) || (this.isClassTeacher() ? '3-A' : '5-A');
        this.updateHeader();
        this.renderSectionBar();
        this.showView('dashboard');

        // Arka planda masaüstünün eşleşmeyi sonlandırıp sonlandırmadığını doğrula (Eşleşme kodu varsa)
        if (window.CloudSync && typeof window.CloudSync.checkPairingStatusOnTerminal === 'function' && window.CloudSync.syncCode) {
          setTimeout(() => {
            window.CloudSync.checkPairingStatusOnTerminal();
          }, 1200);
        }
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
      localStorage.setItem('sinif_device_paired', 'true');
      if (window.CloudSync && typeof window.CloudSync.setDevicePaired === 'function') {
        window.CloudSync.setDevicePaired(true);
      }
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

      const codeBadge = document.getElementById('appbar-sync-code-badge');
      if (codeBadge) {
        const cCode = (window.CloudSync && window.CloudSync.syncCode) || localStorage.getItem('sinif_sync_pair_code') || '';
        codeBadge.textContent = cCode ? `Kod: ${cCode}` : 'Kod: Yok';
      }
    },

    // Şube Seçici Barı (Sınıf Öğretmeninde veya tek şubede GİZLENİR)
    renderSectionBar() {
      const container = document.getElementById('companion-section-bar');
      if (!container) return;

      const isClass = this.isClassTeacher();
      const sections = (this.profile && Array.isArray(this.profile.sections) && this.profile.sections.length > 0)
        ? this.profile.sections
        : (isClass ? ['3-A'] : DEFAULT_SECTIONS);

      // Sınıf Öğretmeni ise tek bir şubesi vardır; çoklu buton barını gizle veya sade sınıf etiketi göster
      if (isClass || sections.length <= 1) {
        container.style.display = 'flex';
        const mySection = sections[0] || this.activeSection || '3-A';
        container.innerHTML = `
          <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(79, 70, 229, 0.15); border: 1.5px solid rgba(99, 102, 241, 0.35); border-radius: 999px;">
            <i data-lucide="school" style="width: 13px; height: 13px; color: #a5b4fc;"></i>
            <span style="font-size: 11.5px; font-weight: 800; color: #e2e8f0;">Sınıf: ${mySection}</span>
          </div>
        `;
        this.renderIcons();
        return;
      }

      // Branş Öğretmenleri İçin Çoklu Şube Geçiş Hapları
      container.style.display = 'flex';
      container.innerHTML = `
        <span class="c-section-label">Şubeler:</span>
        ${sections.map(sec => `
          <button type="button" class="c-section-pill ${sec === this.activeSection ? 'active' : ''}" onclick="window.Companion.setActiveSection('${sec}')">
            ${sec}
          </button>
        `).join('')}
      `;
      this.renderIcons();
    },

    // ==========================================================================
    // KURULUM SİHİRBAZI YÖNETİMİ (WIZARD STEPS & ACTIONS)
    // ==========================================================================

    handleSetupRoleChange(role) {
      this.setupSelectedRole = role;
      const cardPrimary = document.getElementById('setup-role-card-primary');
      const cardMiddle = document.getElementById('setup-role-card-middle');
      const singleGroup = document.getElementById('setup-single-section-group');
      const branchGroup = document.getElementById('setup-branch-group');
      const multiGroup = document.getElementById('setup-multi-section-group');

      if (role === 'primary') {
        if (cardPrimary) cardPrimary.classList.add('selected');
        if (cardMiddle) cardMiddle.classList.remove('selected');
        if (singleGroup) singleGroup.style.display = 'block';
        if (branchGroup) branchGroup.style.display = 'none';
        if (multiGroup) multiGroup.style.display = 'none';
      } else {
        if (cardPrimary) cardPrimary.classList.remove('selected');
        if (cardMiddle) cardMiddle.classList.add('selected');
        if (singleGroup) singleGroup.style.display = 'none';
        if (branchGroup) branchGroup.style.display = 'block';
        if (multiGroup) multiGroup.style.display = 'block';
        this.renderSetupChips();
      }
      this.vibrate(15);
      this.renderIcons();
    },

    onSingleClassSelectChange(val) {
      this.userSelectedSingleClass = val;
      this.activeSection = val;
    },

    goToSetupStep(step) {
      // Adım 1'den ilerlerken doğrulama yap
      if (this.setupStep === 1 && step > 1) {
        const nameInput = document.getElementById('setup-name-input');
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
          this.showToast('Lütfen adınızı ve soyadınızı girin.');
          nameInput && nameInput.focus();
          return;
        }
        if (this.setupSelectedRole === 'middle' && this.temporarySelectedSections.size === 0) {
          this.showToast('Lütfen girdiğiniz en az 1 şubeyi seçin.');
          return;
        }
        if (this.setupSelectedRole === 'primary') {
          const singleClassSelect = document.getElementById('setup-single-class-select');
          if (singleClassSelect) {
            this.userSelectedSingleClass = singleClassSelect.value;
            this.activeSection = singleClassSelect.value;
          }
        }
      }

      this.setupStep = step;

      // Adım sayacı
      const counter = document.getElementById('setup-step-counter');
      if (counter) counter.textContent = `Adım ${step} / 3`;

      // İlerleme mermileri (Bullets)
      for (let i = 1; i <= 3; i++) {
        const bullet = document.getElementById(`wizard-bullet-${i}`);
        if (!bullet) continue;
        bullet.classList.remove('active', 'done');
        if (i < step) {
          bullet.classList.add('done');
        } else if (i === step) {
          bullet.classList.add('active');
        }
      }

      // Adım panelleri
      const p1 = document.getElementById('setup-step-1');
      const p2 = document.getElementById('setup-step-2');
      const p3 = document.getElementById('setup-step-3');
      if (p1) p1.style.display = step === 1 ? 'flex' : 'none';
      if (p2) p2.style.display = step === 2 ? 'flex' : 'none';
      if (p3) p3.style.display = step === 3 ? 'flex' : 'none';

      // Adım 2 açıldığında kod ve bellek durumunu güncelle
      if (step === 2) {
        const codeDisplay = document.getElementById('setup-view-code-display');
        if (codeDisplay && window.CloudSync) {
          codeDisplay.textContent = window.CloudSync.syncCode || '-';
        }
        this.updateWizardSyncStatus();
      }

      // Adım 3 açıldığında özet kartını doldur
      if (step === 3) {
        this.renderWizardSummary();
      }

      this.vibrate(20);
      this.renderIcons();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    getData() {
      if (window.CompanionOmr && typeof window.CompanionOmr.getData === 'function') {
        return window.CompanionOmr.getData();
      }
      try {
        const raw = localStorage.getItem('sinif_asistani_data') || localStorage.getItem('sinif_asistani_state_v3');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return { students: [], weeklyEvaluations: [] };
    },

    updateWizardSyncStatus() {
      const statusText = document.getElementById('wizard-sync-status-text');
      const statusBadge = document.getElementById('wizard-sync-status-badge');
      if (!statusText || !statusBadge) return;

      const data = this.getData();
      let students = Array.isArray(data.students) ? data.students : [];
      let exams = Array.isArray(data.weeklyEvaluations) ? data.weeklyEvaluations : [];

      if (students.length === 0) {
        try {
          const rawV3 = localStorage.getItem('sinif_asistani_state_v3');
          if (rawV3) {
            const parsedV3 = JSON.parse(rawV3);
            if (Array.isArray(parsedV3.students)) students = parsedV3.students;
            if (Array.isArray(parsedV3.weeklyEvaluations)) exams = parsedV3.weeklyEvaluations;
          }
        } catch (e) {}
      }

      if (students.length > 0) {
        const sections = [...new Set(students.map(s => {
          const b = s.branch || s.section || s.className || '';
          return b.replace('/', '-').trim().toUpperCase();
        }).filter(Boolean))];

        const secStr = sections.length > 0 ? ` (${sections.join(', ')})` : '';
        statusText.textContent = `✅ ${students.length} Öğrenci${secStr}, ${exams.length} Sınav yüklü`;
        statusBadge.textContent = 'Eşitlendi';
        statusBadge.style.color = '#10b981';
      } else {
        statusText.textContent = 'Durum: Henüz veri eşitlenmedi';
        statusBadge.textContent = 'Bekleniyor';
        statusBadge.style.color = '#f59e0b';
      }
    },

    updateSetupSectionsFromPulledData() {
      const data = this.getData();
      const students = Array.isArray(data.students) ? data.students : [];
      if (students.length === 0) return;

      const uniqueSections = [...new Set(students.map(s => {
        const b = s.branch || s.section || s.className || '';
        return b.replace('/', '-').trim().toUpperCase();
      }).filter(Boolean))].sort();

      if (uniqueSections.length === 0) return;

      // Sınıf Öğretmeni için okuttuğu sınıf seçeneklerini zenginleştir ama seçimi koru
      const singleClassSelect = document.getElementById('setup-single-class-select');
      if (singleClassSelect && singleClassSelect.options) {
        uniqueSections.forEach(sec => {
          let exists = false;
          for (let i = 0; i < singleClassSelect.options.length; i++) {
            if (singleClassSelect.options[i].value === sec) {
              exists = true;
              break;
            }
          }
          if (!exists) {
            const opt = document.createElement('option');
            opt.value = sec;
            opt.textContent = sec;
            singleClassSelect.appendChild(opt);
          }
        });

        // Kullanıcı kendisi bir sınıf seçtiyse onu KESİNLİKLE KORU, asla ezme!
        if (this.userSelectedSingleClass) {
          singleClassSelect.value = this.userSelectedSingleClass;
          this.activeSection = this.userSelectedSingleClass;
        } else if (uniqueSections.length === 1) {
          singleClassSelect.value = uniqueSections[0];
          this.activeSection = uniqueSections[0];
          this.userSelectedSingleClass = uniqueSections[0];
        }
      }

      // Branş Öğretmeni için şubeleri seçili yap
      if (this.setupSelectedRole === 'middle') {
        uniqueSections.forEach(sec => this.temporarySelectedSections.add(sec));
        this.renderSetupChips();
      }
    },

    renderWizardSummary() {
      const nameInput = document.getElementById('setup-name-input');
      const singleClassSelect = document.getElementById('setup-single-class-select');
      const branchSelect = document.getElementById('setup-branch-select');

      const name = nameInput ? nameInput.value.trim() : 'Öğretmen';
      const isPrimary = this.setupSelectedRole === 'primary';
      const roleStr = isPrimary ? 'Sınıf Öğretmeni (İlkokul)' : ((branchSelect && branchSelect.value) || 'Branş Öğretmeni');
      const chosenClass = this.userSelectedSingleClass || (singleClassSelect ? singleClassSelect.value : (isPrimary ? '4-C' : '5-A'));
      const sectionsStr = isPrimary
        ? chosenClass
        : (Array.from(this.temporarySelectedSections).sort().join(', ') || '-');

      const sName = document.getElementById('summary-teacher-name');
      const sRole = document.getElementById('summary-teacher-role');
      const sSections = document.getElementById('summary-teacher-sections');
      const sSync = document.getElementById('summary-sync-status');

      if (sName) sName.textContent = name;
      if (sRole) sRole.textContent = roleStr;
      if (sSections) sSections.textContent = sectionsStr;

      if (sSync) {
        const data = this.getData();
        const students = Array.isArray(data.students) ? data.students : [];
        if (students.length > 0) {
          sSync.textContent = `✅ Bağlı (${students.length} Öğrenci)`;
          sSync.style.color = '#10b981';
        } else {
          sSync.textContent = 'Çevrimdışı (Sonra Eşlenebilir)';
          sSync.style.color = '#fde047';
        }
      }
    },

    async pullMasterDataInWizard() {
      const btn = document.getElementById('btn-wizard-pull-master');
      if (btn) btn.disabled = true;
      this.showToast('Masaüstünden veriler alınıyor...');
      await this.pullMasterDataFromCloud();
      if (btn) btn.disabled = false;
      this.updateWizardSyncStatus();
      this.renderIcons();
    },

    finishSetupWizard() {
      const nameInput = document.getElementById('setup-name-input');
      const branchSelect = document.getElementById('setup-branch-select');
      const singleClassSelect = document.getElementById('setup-single-class-select');
      const pinInput = document.getElementById('setup-pin-input');

      const name = nameInput ? nameInput.value.trim() : 'Öğretmen';
      const isPrimary = this.setupSelectedRole === 'primary';
      const branch = isPrimary ? 'Sınıf Öğretmeni (İlkokul)' : ((branchSelect && branchSelect.value) || 'Matematik');
      const chosenSection = this.userSelectedSingleClass || (singleClassSelect ? singleClassSelect.value : (isPrimary ? '4-C' : '5-A'));
      const sections = isPrimary ? [chosenSection] : Array.from(this.temporarySelectedSections).sort();
      const pin = (pinInput && pinInput.value.trim()) || '1234';

      this.activeSection = sections[0] || chosenSection;

      this.saveProfile({
        name,
        teacherRole: isPrimary ? 'primary' : 'middle',
        isClassTeacher: isPrimary,
        branch,
        sections: sections.length > 0 ? sections : [this.activeSection],
        pin
      });

      localStorage.setItem('sinif_device_paired', 'true');
      if (window.CloudSync && typeof window.CloudSync.setDevicePaired === 'function') {
        window.CloudSync.setDevicePaired(true);
      }

      localStorage.setItem(ACTIVE_SECTION_KEY, this.activeSection);
      this.renderSectionBar();
      this.showToast('🎉 Tebrikler! Sınıf Asistanı kullanıma hazır.');
      this.showView('dashboard');
    },

    relaunchSetupWizard() {
      this.closeSettingsModal();
      this.renderSetupForm();
      const backBtn = document.getElementById('btn-setup-back-dashboard');
      if (backBtn) backBtn.style.display = 'flex';
      this.showView('setup');
    },

    // Profil Kurulum Ekranını Doldur
    renderSetupForm() {
      const branchSelect = document.getElementById('setup-branch-select');
      const nameInput = document.getElementById('setup-name-input');
      const pinInput = document.getElementById('setup-pin-input');
      const singleClassSelect = document.getElementById('setup-single-class-select');

      const isClass = this.isClassTeacher();
      this.setupSelectedRole = isClass ? 'primary' : ((this.profile && this.profile.teacherRole) || 'primary');

      if (this.profile) {
        if (nameInput) nameInput.value = this.profile.name || '';
        if (pinInput) pinInput.value = this.profile.pin || '';
        this.temporarySelectedSections = new Set(this.profile.sections || ['5-A', '6-A', '7-A', '8-A']);
        if (singleClassSelect && this.profile.sections && this.profile.sections[0]) {
          singleClassSelect.value = this.profile.sections[0];
          this.userSelectedSingleClass = this.profile.sections[0];
        }
      } else {
        this.temporarySelectedSections = new Set(['5-A', '6-A', '7-A', '8-A']);
        if (singleClassSelect) {
          this.userSelectedSingleClass = singleClassSelect.value;
        }
      }

      // Branşları doldur
      if (branchSelect) {
        branchSelect.innerHTML = DEFAULT_BRANCHES.map(b => `
          <option value="${b}" ${this.profile && this.profile.branch === b ? 'selected' : ''}>${b}</option>
        `).join('');
      }

      this.handleSetupRoleChange(this.setupSelectedRole);
      this.goToSetupStep(1);
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

    // Ekran Geçişleri
    showView(viewId) {
      this.currentView = viewId;
      if (viewId !== 'dashboard' && viewId !== 'setup') {
        try {
          if (window.history && window.history.pushState) {
            window.history.pushState({ view: viewId }, '');
          }
        } catch (e) {}
      }
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

      // Ders & Planlama Modülü açıldığında verileri başlat ve render et
      if (viewId === 'schedule-plan' && window.CompanionSchedule) {
        window.CompanionSchedule.init();
      }

      // Eşitleme veya Ayarlar açıldığında bulut göstergelerini tazele
      if ((viewId === 'setup' || viewId === 'sync') && window.CloudSync) {
        window.CloudSync.updateSyncUI();
      }
    },

    // Uygulama Önbelleğini Temizle ve Zorunlu Yenile
    async forceReloadApp() {
      this.showToast('🔄 Önbellek temizleniyor ve güncelleniyor...', 'info', 2000);
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
      } catch (e) {}
      setTimeout(() => {
        const cleanUrl = window.location.origin + window.location.pathname + '?r=' + Date.now();
        window.location.replace(cleanUrl);
      }, 300);
    },

    // Aşağı Çekerek Yenileme (Pull to Refresh) özelliği veri kaybını önlemek amacıyla kaldırıldı.
    // Yenileme işlemi yalnızca üst bardaki yenile butonu ('btn-companion-refresh') ile yapılır.
    initPullToRefresh() {
      // Devre dışı bırakıldı
    },

    // PIN Kilit Sistemi
    lockApp() {
      const pinStr = (this.profile && this.profile.pin) ? String(this.profile.pin).trim() : '';
      if (!pinStr) {
        this.vibrate([40, 60, 40]);
        if (typeof this.showToast === 'function') {
          this.showToast('⚠️ Uygulamayı kilitlemek için önce Ayarlardan bir PIN şifresi belirlemelisiniz.', 'warning', 3500);
        }
        const setNow = confirm(
          '🔒 Kilit Şifresi Belirlenmedi!\n\n' +
          'Uygulamayı kilitleyebilmeniz için önce 4 haneli bir güvenlik PIN kodu belirlemeniz gerekmektedir.\n\n' +
          'Şimdi Ayarlar ekranından şifre belirlemek ister misiniz?'
        );
        if (setNow) {
          this.openSettingsModal();
        }
        return;
      }
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
    async pullMasterDataFromCloud(isSilent = false) {
      const btn = document.getElementById('btn-mobile-pull-master');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>Masaüstünden Yükleniyor...</span>';
      }
      if (!isSilent) this.showToast('Masaüstü veritabanı kontrol ediliyor...');

      if (!window.CloudSync) {
        if (!isSilent) this.showToast('Bulut motoru henüz başlatılmadı.');
        if (btn) btn.disabled = false;
        return;
      }

      // Önce masaüstünün eşleşmeyi sonlandırıp sonlandırmadığını doğrula (Masaüstü Karar Vericidir)
      if (typeof window.CloudSync.checkPairingStatusOnTerminal === 'function') {
        const isStillValid = await window.CloudSync.checkPairingStatusOnTerminal();
        if (!isStillValid) {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="refresh-cw" style="width: 18px; height: 18px;"></i><span>Tüm Sınıf & Verileri Masaüstünden Eşitle</span>';
            this.renderIcons();
          }
          return;
        }
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
        this.updateWizardSyncStatus();
        this.updateSetupSectionsFromPulledData();
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
        if (window.CompanionSchedule) {
          window.CompanionSchedule.init();
        }
      } else {
        const errorMsg = res.error || 'Masaüstünden veri bulunamadı. Lütfen masaüstünden "Terminale Gönder" butonuna basın.';
        this.showToast(errorMsg);
        if (!isSilent) {
          alert('⚠️ Eşitleme Bekleniyor\n\n' + errorMsg);
        }
      }
    },

    // Üst Bar Yenile Butonu: Masaüstünden en güncel verileri çek ve ekranı tazele
    async handleRefreshButton() {
      const btn = document.getElementById('btn-companion-refresh');
      if (btn) btn.classList.add('c-spin-active');
      const currentCode = (window.CloudSync && window.CloudSync.syncCode) || localStorage.getItem('sinif_sync_pair_code') || '';
      this.showToast(`🔄 Bulut kontrol ediliyor... (Kod: ${currentCode || 'Yok'})`);

      try {
        if (!currentCode) {
          this.showToast('⚠️ Eşleşme kodu girilmemiş! Lütfen ⚙️ Ayarlar menüsünden tahtadaki kodu girin.');
          if (typeof this.openSettingsModal === 'function') this.openSettingsModal();
          return;
        }

        // Önce masaüstünün eşleşmeyi sonlandırıp sonlandırmadığını doğrula (Masaüstü Karar Vericidir)
        if (window.CloudSync && typeof window.CloudSync.checkPairingStatusOnTerminal === 'function') {
          const isStillValid = await window.CloudSync.checkPairingStatusOnTerminal();
          if (!isStillValid) {
            if (btn) btn.classList.remove('c-spin-active');
            return;
          }
        }

        if (window.CloudSync && typeof window.CloudSync.pullMasterData === 'function') {
          const res = await window.CloudSync.pullMasterData();
          if (res && res.success) {
            this.vibrate([40, 30, 40]);
            this.showToast(`✅ Eşitlendi! ${res.studentCount} öğrenci, ${res.examCount} sınav yüklendi. (Kod: ${currentCode})`);
            this.updateHeader();
            this.renderSectionBar();
            if (window.CompanionBehavior) window.CompanionBehavior.init();
            if (window.CompanionOmr) {
              window.CompanionOmr.ensureActiveExam();
              window.CompanionOmr.renderHub();
            }
            if (window.CompanionHomework) window.CompanionHomework.init();
            if (window.CompanionBooks) window.CompanionBooks.init();
            return;
          } else if (res && res.error) {
            this.showToast(res.error);
            return;
          }
        }
        if (window.CompanionBehavior) window.CompanionBehavior.init();
        this.showToast('Arayüz yenilendi.');
      } catch (err) {
        console.error('Yenileme hatası:', err);
        this.showToast('⚠️ Yenileme hatası: ' + (err.message || 'Bilinmeyen hata'));
      } finally {
        if (btn) btn.classList.remove('c-spin-active');
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
      this.showToast('Terminal sonuçları masaüstüne aktarılıyor...');
      try {
        const data = (window.CompanionOmr && typeof window.CompanionOmr.getData === 'function')
          ? window.CompanionOmr.getData()
          : JSON.parse(localStorage.getItem('sinif_asistani_data') || '{}');
        let examCount = 0;
        if (Array.isArray(data.weeklyEvaluations)) {
          for (const ex of data.weeklyEvaluations) {
            if (ex && ex.id && ex.studentResults && Object.keys(ex.studentResults).length > 0) {
              if (typeof window.CloudSync.pushLiveExam === 'function') {
                await window.CloudSync.pushLiveExam(ex);
                examCount++;
              }
            }
          }
        }
        this.showToast(`✅ ${examCount} sınavın optik sonuçları masaüstüne gönderildi!`);
      } catch (e) {
        this.showToast('Aktarım sırasında bir sorun oluştu: ' + e.message);
      }
    },

    // Lucide ikonlarını yeniden oluştur
    renderIcons() {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    // Tema Yönetimi (Karanlık / Aydınlık Mod)
    initTheme() {
      const savedTheme = localStorage.getItem('companion_theme') || 'dark';
      this.applyTheme(savedTheme, false);
    },

    toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      this.applyTheme(nextTheme, true);
      this.vibrate(20);
      if (typeof this.showToast === 'function') {
        this.showToast(nextTheme === 'dark' ? '🌙 Karanlık mod aktif' : '☀️ Aydınlık mod aktif', 'info', 1800);
      }
    },

    applyTheme(theme, animate = false) {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
      document.body.dataset.theme = theme;
      localStorage.setItem('companion_theme', theme);

      const themeBtn = document.getElementById('btn-companion-theme');
      if (themeBtn) {
        themeBtn.innerHTML = theme === 'dark'
          ? '<i data-lucide="sun" style="width: 18px; height: 18px; color: #fbbf24;"></i>'
          : '<i data-lucide="moon" style="width: 18px; height: 18px; color: #334155;"></i>';
        themeBtn.title = theme === 'dark' ? 'Aydınlık Temaya Geç' : 'Karanlık Temaya Geç';
        this.renderIcons();
      }
    },

    // Tarayıcı ve Donanım Geri Tuşu Geçmişi
    initHistoryBack() {
      window.addEventListener('popstate', (e) => {
        if (typeof window.handleAndroidBack === 'function') {
          window.handleAndroidBack();
        }
      });
    },

    // Olay Dinleyicileri
    bindEvents() {
      // Tema Butonu
      const themeBtn = document.getElementById('btn-companion-theme');
      if (themeBtn) {
        themeBtn.onclick = () => this.toggleTheme();
      }

      // Branş Değiştiğinde
      const branchSelect = document.getElementById('setup-branch-select');
      if (branchSelect) {
        branchSelect.addEventListener('change', () => {
          this.vibrate(10);
        });
      }
    }
  };

  // =========================================================================
  // TELEFON DONANIM / SİSTEM GERİ TUŞU ENTEGRASYONU (ANDROID BACK BUTTON)
  // =========================================================================
  window.handleAndroidBack = function() {
    // 0. Kilit Ekranı Açıksa (Güvenlik: Kilit ekranından geri tuşuyla çıkılamaz)
    const lockOverlay = document.getElementById('companion-lock-overlay');
    if (lockOverlay && lockOverlay.style.display !== 'none') {
      return true;
    }

    // 1. QR Tarayıcı Modalı Açıksa Kapat
    const qrModal = document.getElementById('mobile-qr-scanner-modal');
    if (qrModal && qrModal.style.display !== 'none') {
      if (window.CloudSync && typeof window.CloudSync.closeQrScanner === 'function') {
        window.CloudSync.closeQrScanner();
      } else {
        qrModal.style.display = 'none';
      }
      return true;
    }

    // 2. Terminal Ayarları Modalı Açıksa Kapat
    const settingsModal = document.getElementById('companion-settings-modal');
    if (settingsModal && settingsModal.style.display !== 'none') {
      if (window.Companion && typeof window.Companion.closeSettingsModal === 'function') {
        window.Companion.closeSettingsModal();
      } else {
        settingsModal.style.display = 'none';
      }
      return true;
    }

    // 3. Ödev Modülü: Sıralama Modalı veya Yeni Ödev Modalı Açıksa Kapat
    const hwOrderModal = document.getElementById('companion-hw-order-modal');
    if (hwOrderModal && hwOrderModal.style.display !== 'none') {
      if (window.CompanionHomework && typeof window.CompanionHomework.closeOrderModal === 'function') {
        window.CompanionHomework.closeOrderModal();
      } else {
        hwOrderModal.style.display = 'none';
      }
      return true;
    }

    const createHwModal = document.getElementById('companion-create-hw-modal') || document.getElementById('modal-create-homework');
    if (createHwModal && createHwModal.style.display !== 'none') {
      if (window.CompanionHomework && typeof window.CompanionHomework.closeCreateModal === 'function') {
        window.CompanionHomework.closeCreateModal();
      } else {
        createHwModal.style.display = 'none';
      }
      return true;
    }

    // 4. Davranış Puanı Modalleri Açıksa Kapat
    const randModal = document.getElementById('companion-random-caller-modal');
    if (randModal && randModal.style.display !== 'none') {
      if (window.CompanionBehavior && typeof window.CompanionBehavior.closeRandomCallerModal === 'function') {
        window.CompanionBehavior.closeRandomCallerModal();
      } else {
        randModal.style.display = 'none';
      }
      return true;
    }

    const bulkModal = document.getElementById('companion-bulk-score-modal');
    if (bulkModal && bulkModal.style.display !== 'none') {
      if (window.CompanionBehavior && typeof window.CompanionBehavior.closeBulkScoreModal === 'function') {
        window.CompanionBehavior.closeBulkScoreModal();
      } else {
        bulkModal.style.display = 'none';
      }
      return true;
    }

    const attModal = document.getElementById('companion-attendance-modal');
    if (attModal && attModal.style.display !== 'none') {
      if (window.CompanionBehavior && typeof window.CompanionBehavior.closeAttendanceModal === 'function') {
        window.CompanionBehavior.closeAttendanceModal();
      } else {
        attModal.style.display = 'none';
      }
      return true;
    }

    const scoreModal = document.getElementById('companion-score-modal');
    if (scoreModal && scoreModal.style.display !== 'none') {
      if (window.CompanionBehavior && typeof window.CompanionBehavior.closeScoreModal === 'function') {
        window.CompanionBehavior.closeScoreModal();
      } else {
        scoreModal.style.display = 'none';
      }
      return true;
    }

    // 5. Kitap Takip Modalleri Açıksa Kapat
    const bookLendModal = document.getElementById('modal-book-lend');
    if (bookLendModal && bookLendModal.style.display !== 'none') {
      if (window.CompanionBooks && typeof window.CompanionBooks.closeLendModal === 'function') {
        window.CompanionBooks.closeLendModal();
      } else {
        bookLendModal.style.display = 'none';
      }
      return true;
    }

    // 6. Optik Okuma (OMR) Modalleri ve Kamerası Açıksa Kapat
    const examPickerModal = document.getElementById('omr-quick-exam-picker-modal');
    if (examPickerModal && examPickerModal.style.display !== 'none') {
      if (window.CompanionOmr && typeof window.CompanionOmr.closeExamPickerModal === 'function') {
        window.CompanionOmr.closeExamPickerModal();
      } else {
        examPickerModal.style.display = 'none';
      }
      return true;
    }

    const inspectModal = document.getElementById('companion-optical-inspect-modal');
    if (inspectModal && inspectModal.style.display !== 'none') {
      if (window.CompanionOmr && typeof window.CompanionOmr.closeOpticalInspectModal === 'function') {
        window.CompanionOmr.closeOpticalInspectModal();
      } else {
        inspectModal.style.display = 'none';
      }
      return true;
    }

    const studentPickerModal = document.getElementById('omr-student-picker-modal');
    if (studentPickerModal && studentPickerModal.style.display !== 'none') {
      if (window.CompanionOmr && typeof window.CompanionOmr.closeStudentPickerModal === 'function') {
        window.CompanionOmr.closeStudentPickerModal();
      } else {
        studentPickerModal.style.display = 'none';
      }
      return true;
    }

    const printModal = document.getElementById('companion-optical-print-modal');
    if (printModal && printModal.style.display !== 'none') {
      if (window.CompanionOmr && typeof window.CompanionOmr.closeMobileOpticalPrintModal === 'function') {
        window.CompanionOmr.closeMobileOpticalPrintModal();
      } else {
        printModal.style.display = 'none';
      }
      return true;
    }

    const wizardModal = document.getElementById('companion-exam-wizard-modal');
    if (wizardModal && wizardModal.style.display !== 'none') {
      if (window.CompanionOmr && typeof window.CompanionOmr.closeCreateExamModal === 'function') {
        window.CompanionOmr.closeCreateExamModal();
      } else {
        wizardModal.style.display = 'none';
      }
      return true;
    }

    const cameraModal = document.getElementById('companion-omr-camera-modal');
    if (cameraModal && cameraModal.style.display !== 'none') {
      if (window.CompanionOmr && typeof window.CompanionOmr.closeCamera === 'function') {
        window.CompanionOmr.closeCamera();
      } else {
        cameraModal.style.display = 'none';
      }
      return true;
    }

    // 7. OMR Sınav Detay Ekranındaysa Sınav Listesine Dön
    if (window.CompanionOmr && window.CompanionOmr.viewState === 'detail') {
      window.CompanionOmr.backToExamsList();
      return true;
    }

    // 8. Diğer Herhangi Bir Açık Modal Varsa Kapat
    const openModals = document.querySelectorAll('.c-modal, [id$="-modal"]');
    for (const m of openModals) {
      if (m.style.display && m.style.display !== 'none' && m.id !== 'companion-lock-overlay') {
        m.style.display = 'none';
        return true;
      }
    }

    // 9. Menülerden Ana Menüye (Dashboard) Dönüş:
    // Öğretmen Ödev, Planlama, Kitap, Sınavlar veya Eşitleme menüsündeyse geri tuşuyla Dashboard'a döner!
    if (window.Companion && window.Companion.currentView && window.Companion.currentView !== 'dashboard' && window.Companion.currentView !== 'setup') {
      window.Companion.showView('dashboard');
      return true;
    }

    // Eğer zaten Dashboard'taysa false döner (uygulamadan çıkış veya sistem davranışı)
    return false;
  };

  window.Companion = Companion;

  document.addEventListener('DOMContentLoaded', () => {
    Companion.init();
  });
})(window);
