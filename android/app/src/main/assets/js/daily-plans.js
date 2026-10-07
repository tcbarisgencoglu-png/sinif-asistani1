/**
 * Sınıf Asistanı - Dersin Haftalık Planı Hazırlama Modülü (daily-plans.js)
 * MEB ve Türkiye Yüzyılı Maarif Modeli standartlarında, bir dersin haftalık planını
 * haftalık ders programı ve yıllık plan kazanımları ile tam senkronize olarak hazırlar.
 */

(() => {
  let toastCallbackFn = null;

  // Modül Yerel Durumu
  let currentDailyPlan = null;
  let activeViewMode = 'create'; // 'create' | 'archive'
  let isGenerating = false;
  let abortController = null;

  // Hafta & Ders & Yıllık Plan Durumu
  let currentSelectedWeekId = ''; // örn: '2025-W42'
  let matchedYearlyPlan = null;
  let currentWeekOutcomesList = [];
  let selectedOutcomesSet = new Set();
  let modalSelectedOutcomesSet = new Set();

  // DOM Elemanları Önbelleği
  let dom = {};

  const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  function getDOM() {
    return {
      container: document.getElementById('tools-daily-plan-view'),
      btnModeCreate: document.getElementById('btn-daily-mode-create'),
      btnModeArchive: document.getElementById('btn-daily-mode-archive'),
      badgeArchiveCount: document.getElementById('daily-archive-count-badge'),
      sectionCreate: document.getElementById('daily-plan-create-section'),
      sectionArchive: document.getElementById('daily-plan-archive-section'),

      // Adım 1: Sınıf Düzeyi & Hafta
      selectGrade: document.getElementById('daily-plan-grade-select'),
      inputClass: document.getElementById('daily-plan-class-input'),
      curriculumBadgeBox: document.getElementById('daily-plan-curriculum-badge-box'),
      curriculumIcon: document.getElementById('daily-plan-curriculum-icon'),
      curriculumName: document.getElementById('daily-plan-curriculum-name'),
      curriculumDesc: document.getElementById('daily-plan-curriculum-desc'),
      curriculumBadge: document.getElementById('daily-plan-curriculum-badge'),
      inputTeacher: document.getElementById('daily-plan-teacher-input'),
      inputPrincipal: document.getElementById('daily-plan-principal-input'),
      selectWeek: document.getElementById('daily-plan-week-select'),
      btnPrevWeek: document.getElementById('btn-daily-prev-week'),
      btnNextWeek: document.getElementById('btn-daily-next-week'),
      btnResetWeek: document.getElementById('btn-daily-current-week-reset'),
      badgeDateRange: document.getElementById('daily-plan-date-range-badge'),

      // Adım 2: Ders & Program
      selectCourse: document.getElementById('daily-plan-course-select'),
      scheduleChipsContainer: document.getElementById('daily-plan-schedule-chips'),

      // Adım 3: Yıllık Plan & Kazanım
      noticeYearlyMatch: document.getElementById('daily-plan-yearly-match-notice'),
      btnFetchYearly: document.getElementById('btn-daily-fetch-yearly'),
      inputUnit: document.getElementById('daily-plan-unit-input'),
      inputTopic: document.getElementById('daily-plan-topic-input'),
      weekOutcomesContainer: document.getElementById('daily-plan-week-outcomes-container'),
      btnSelectAllOutcomes: document.getElementById('btn-daily-select-all-outcomes'),
      btnClearOutcomes: document.getElementById('btn-daily-clear-outcomes'),
      btnViewAllOutcomes: document.getElementById('btn-daily-view-all-outcomes'),
      inputOutcomes: document.getElementById('daily-plan-outcomes-input'),

      // Adım 4: Ders Saati & Pedagoji
      inputHours: document.getElementById('daily-plan-hours-input'),
      badgeAutoHours: document.getElementById('daily-plan-auto-detected-badge'),
      selectMethodStyle: document.getElementById('daily-plan-method-style'),
      inputCustomPrompt: document.getElementById('daily-plan-custom-prompt'),
      btnGenerate: document.getElementById('btn-daily-generate'),
      loadingBox: document.getElementById('daily-generate-loading'),
      btnCancelGenerate: document.getElementById('btn-daily-cancel-generate'),

      // Gizli Alanlar
      inputDate: document.getElementById('daily-plan-date-input'),
      inputSchool: document.getElementById('daily-plan-school-input'),

      // Sonuç & Editör
      resultCard: document.getElementById('daily-plan-result-card'),
      emptyState: document.getElementById('daily-plan-empty-state'),
      generatingScreen: document.getElementById('daily-plan-generating-screen'),
      generatingStepText: document.getElementById('dp-generating-step-text'),
      curriculumStepLabel: document.getElementById('dp-step-curriculum-label'),
      activePlanEditor: document.getElementById('daily-plan-active-editor'),
      selectRevision: document.getElementById('daily-plan-revision-select'),
      btnCopy: document.getElementById('btn-daily-copy-plan'),
      btnDownloadWord: document.getElementById('btn-daily-download-word'),
      btnSave: document.getElementById('btn-daily-save-plan'),
      btnPrint: document.getElementById('btn-daily-print-plan'),
      planSheet: document.getElementById('daily-plan-sheet'),

      // Modal: Tüm Kazanımlar
      modalAllOutcomes: document.getElementById('modal-daily-all-outcomes'),
      modalAllOutcomesTitle: document.getElementById('daily-all-outcomes-modal-title'),
      btnCloseModalAllOutcomes: document.getElementById('btn-close-daily-all-outcomes'),
      btnCancelModalAllOutcomes: document.getElementById('btn-cancel-daily-all-outcomes'),
      btnApplyModalAllOutcomes: document.getElementById('btn-apply-daily-all-outcomes'),
      inputSearchModalAllOutcomes: document.getElementById('daily-all-outcomes-search-input'),
      btnFocusCurrentWeekInModal: document.getElementById('btn-daily-select-current-week-in-modal'),
      modalAllOutcomesList: document.getElementById('daily-all-outcomes-modal-list'),
      badgeSelectedCountModal: document.getElementById('daily-all-outcomes-selected-count-badge'),

      // Arşiv
      archiveSearch: document.getElementById('daily-archive-search-input'),
      archiveCourseFilter: document.getElementById('daily-archive-course-filter'),
      archiveListContainer: document.getElementById('daily-archive-list-container')
    };
  }

  // Modülü Başlat
  function setupDailyPlansTool(toastCallback) {
    toastCallbackFn = toastCallback;
    dom = getDOM();
    if (!dom.container) return;

    bindEvents();
    initDefaults();
  }

  // Planlama sekmesine girildiğinde çağrılır
  function openDailyPlanView() {
    dom = getDOM();
    if (!dom.container) return;

    dom.container.style.display = 'block';
    initDefaults();
    updateArchiveBadgeCount();

    if (activeViewMode === 'archive') {
      renderArchiveList();
    } else {
      populateCoursesFromSchedule();
      syncCourseAndYearlyPlan();
    }

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Olay Dinleyicileri
  function bindEvents() {
    if (!dom.container) return;

    // Mod Değiştirme (Oluştur / Arşiv)
    if (dom.btnModeCreate) {
      dom.btnModeCreate.addEventListener('click', () => switchViewMode('create'));
    }
    if (dom.btnModeArchive) {
      dom.btnModeArchive.addEventListener('click', () => switchViewMode('archive'));
    }

    // Sınıf Düzeyi ve Şube Değişimi
    if (dom.selectGrade) {
      dom.selectGrade.addEventListener('change', () => {
        if (dom.inputClass) {
          const gVal = dom.selectGrade.value;
          const curClass = dom.inputClass.value.trim();
          const branchMatch = curClass.match(/[\/-]?([A-Za-zÇĞİÖŞÜçğıöşü]+)$/);
          const branch = branchMatch ? branchMatch[1].toUpperCase() : 'A';
          dom.inputClass.value = `${gVal}/${branch}`;
        }
        updateCurriculumModelBadge();
        syncCourseAndYearlyPlan();
      });
    }

    if (dom.inputClass) {
      dom.inputClass.addEventListener('change', () => {
        const match = dom.inputClass.value.match(/^(\d+)/);
        if (match && dom.selectGrade) {
          dom.selectGrade.value = match[1];
        }
        updateCurriculumModelBadge();
        syncCourseAndYearlyPlan();
      });
    }

    // Öğretmen ve Müdür Girişi Kaydı
    if (dom.inputTeacher) {
      dom.inputTeacher.addEventListener('change', () => {
        if (window.stateManager) {
          window.stateManager.state.teacherName = dom.inputTeacher.value.trim();
          window.stateManager.saveState();
        }
      });
    }

    if (dom.inputPrincipal) {
      dom.inputPrincipal.addEventListener('change', () => {
        if (window.stateManager) {
          window.stateManager.state.principalName = dom.inputPrincipal.value.trim();
          window.stateManager.saveState();
        }
      });
    }

    // Hafta Seçimi ve Navigasyon
    if (dom.selectWeek) {
      dom.selectWeek.addEventListener('change', () => {
        currentSelectedWeekId = dom.selectWeek.value;
        onWeekSelectionChanged();
      });
    }

    if (dom.btnPrevWeek) {
      dom.btnPrevWeek.addEventListener('click', () => stepWeek(-1));
    }

    if (dom.btnNextWeek) {
      dom.btnNextWeek.addEventListener('click', () => stepWeek(1));
    }

    if (dom.btnResetWeek) {
      dom.btnResetWeek.addEventListener('click', () => {
        const appWeek = window.stateManager ? window.stateManager.getSelectedWeek() : '';
        if (appWeek) {
          currentSelectedWeekId = appWeek;
          if (dom.selectWeek) dom.selectWeek.value = appWeek;
          onWeekSelectionChanged();
        }
      });
    }

    // Ders Seçimi Değişimi
    if (dom.selectCourse) {
      dom.selectCourse.addEventListener('change', () => {
        syncCourseAndYearlyPlan();
      });
    }

    // Hızlı Saat Butonları
    document.querySelectorAll('.btn-quick-hour').forEach(btn => {
      btn.addEventListener('click', () => {
        const h = btn.getAttribute('data-hours');
        if (dom.inputHours) {
          dom.inputHours.value = h;
          if (dom.badgeAutoHours) dom.badgeAutoHours.style.display = 'none';
        }
      });
    });

    // Yıllık Plandan Yeniden Eşleştir Butonu
    if (dom.btnFetchYearly) {
      dom.btnFetchYearly.addEventListener('click', () => {
        fetchYearlyPlanOutcomes(true);
      });
    }

    // Kazanım Toplu Seçim Linkleri
    if (dom.btnSelectAllOutcomes) {
      dom.btnSelectAllOutcomes.addEventListener('click', () => {
        selectAllWeekOutcomes(true);
      });
    }

    if (dom.btnClearOutcomes) {
      dom.btnClearOutcomes.addEventListener('click', () => {
        selectAllWeekOutcomes(false);
      });
    }

    // Tüm Kazanımları Gör Butonu
    if (dom.btnViewAllOutcomes) {
      dom.btnViewAllOutcomes.addEventListener('click', openAllOutcomesModal);
    }

    // Tüm Kazanımlar Modalı Olayları
    if (dom.btnCloseModalAllOutcomes) {
      dom.btnCloseModalAllOutcomes.addEventListener('click', closeAllOutcomesModal);
    }
    if (dom.btnCancelModalAllOutcomes) {
      dom.btnCancelModalAllOutcomes.addEventListener('click', closeAllOutcomesModal);
    }
    if (dom.btnApplyModalAllOutcomes) {
      dom.btnApplyModalAllOutcomes.addEventListener('click', applySelectedOutcomesFromModal);
    }
    if (dom.inputSearchModalAllOutcomes) {
      dom.inputSearchModalAllOutcomes.addEventListener('input', () => {
        renderModalOutcomesList(dom.inputSearchModalAllOutcomes.value.trim());
      });
    }
    if (dom.btnFocusCurrentWeekInModal) {
      dom.btnFocusCurrentWeekInModal.addEventListener('click', scrollToCurrentWeekInModal);
    }

    // Plan Üret Butonu
    if (dom.btnGenerate) {
      dom.btnGenerate.addEventListener('click', generateWeeklyPlanWithAI);
    }

    // İptal Butonu
    if (dom.btnCancelGenerate) {
      dom.btnCancelGenerate.addEventListener('click', cancelAIGeneration);
    }

    // Hızlı Revizyon Dropdown
    if (dom.selectRevision) {
      dom.selectRevision.addEventListener('change', handleQuickRevision);
    }

    // Kopyala Butonu
    if (dom.btnCopy) {
      dom.btnCopy.addEventListener('click', copyDailyPlanToClipboard);
    }

    // Word Olarak İndir Butonu
    if (dom.btnDownloadWord) {
      dom.btnDownloadWord.addEventListener('click', downloadDailyPlanAsWord);
    }

    // Evrak Deposuna Kaydet Butonu
    if (dom.btnSave) {
      dom.btnSave.addEventListener('click', saveCurrentDailyPlan);
    }

    // A4 Yazdır Butonu
    if (dom.btnPrint) {
      dom.btnPrint.addEventListener('click', printCurrentDailyPlan);
    }

    // Arşiv Arama ve Filtreleme
    if (dom.archiveSearch) {
      dom.archiveSearch.addEventListener('input', renderArchiveList);
    }
    if (dom.archiveCourseFilter) {
      dom.archiveCourseFilter.addEventListener('change', renderArchiveList);
    }
  }

  // Varsayılan Değerleri Başlat
  function initDefaults() {
    dom = getDOM();
    if (!dom.container) return;

    const state = window.stateManager ? window.stateManager.loadState() : {};

    // 1. Öğretmen, Okul Müdürü ve Okul Bilgisi
    if (dom.inputTeacher) {
      dom.inputTeacher.value = state.teacherName || (state.teachers && state.teachers[0]?.name) || 'Öğretmen';
    }
    if (dom.inputPrincipal) {
      dom.inputPrincipal.value = state.principalName || 'Okul Müdürü';
    }
    if (dom.inputSchool) {
      dom.inputSchool.value = state.schoolName || 'T.C. Millî Eğitim Bakanlığı';
    }

    // 2. Sınıf Düzeyi & Şube
    const currentLevel = state.educationLevel || 'middle';
    let defaultGrade = currentLevel === 'middle' ? '5' : '4';
    let defaultClass = (state.scheduleTimes && state.scheduleTimes.className) || (defaultGrade + '/A');

    // Kayıtlı öğrencilerden veya mevcut yıllık planlardan şube tespiti
    if (state.plans && state.plans.length > 0 && state.plans[0].className) {
      defaultClass = state.plans[0].className;
      const gMatch = defaultClass.match(/^(\d+)/);
      if (gMatch) defaultGrade = gMatch[1];
    } else if (state.students && state.students.length > 0 && state.students[0].branch) {
      defaultClass = state.students[0].branch;
      const gMatch = defaultClass.match(/^(\d+)/);
      if (gMatch) defaultGrade = gMatch[1];
    }

    if (dom.selectGrade && !dom.selectGrade.value) {
      dom.selectGrade.value = defaultGrade;
    }
    if (dom.inputClass && !dom.inputClass.value) {
      dom.inputClass.value = defaultClass;
    }

    // Müfredat Modelini Güncelle (4 ve 8 Klasik, Diğerleri TYMM)
    updateCurriculumModelBadge();

    // 3. Hafta Bilgisini Ayarla (Ayarlardaki geçerli hafta)
    const appWeek = window.stateManager ? window.stateManager.getSelectedWeek() : '';
    currentSelectedWeekId = appWeek || (window.getISOWeek ? window.getISOWeek(new Date()) : '');

    populateAcademicWeeksDropdown();
    populateCoursesFromSchedule();
    onWeekSelectionChanged();
  }

  // Sınıf Düzeyine Göre Müfredat Türü Tespiti (4 ve 8 Klasik, Diğerleri TYMM)
  function isClassicCurriculumGrade(gradeVal) {
    const g = String(gradeVal || '').trim();
    return g === '4' || g === '8';
  }

  function updateCurriculumModelBadge() {
    dom = getDOM();
    if (!dom.curriculumBadgeBox) return;

    const grade = dom.selectGrade ? dom.selectGrade.value : '1';
    const isClassic = isClassicCurriculumGrade(grade);

    if (isClassic) {
      // 4. veya 8. Sınıf -> Klasik Müfredat
      dom.curriculumBadgeBox.style.background = 'rgba(245, 158, 11, 0.08)';
      dom.curriculumBadgeBox.style.borderColor = 'rgba(245, 158, 11, 0.28)';
      if (dom.curriculumIcon) dom.curriculumIcon.textContent = '📜';
      if (dom.curriculumName) {
        dom.curriculumName.textContent = 'Klasik (Mevcut) MEB Müfredatı';
        dom.curriculumName.style.color = '#d97706';
      }
      if (dom.curriculumDesc) {
        dom.curriculumDesc.textContent = `${grade}. Sınıf: Konu, Hedef ve Davranış Odaklı Geleneksel Plan`;
      }
      if (dom.curriculumBadge) {
        dom.curriculumBadge.textContent = 'KLASİK MÜFREDAT';
        dom.curriculumBadge.style.background = '#d97706';
      }
    } else {
      // 1, 2, 3, 5, 6, 7. Sınıflar -> Türkiye Yüzyılı Maarif Modeli
      dom.curriculumBadgeBox.style.background = 'rgba(99, 102, 241, 0.08)';
      dom.curriculumBadgeBox.style.borderColor = 'rgba(99, 102, 241, 0.28)';
      if (dom.curriculumIcon) dom.curriculumIcon.textContent = '🌟';
      if (dom.curriculumName) {
        dom.curriculumName.textContent = 'Türkiye Yüzyılı Maarif Modeli';
        dom.curriculumName.style.color = 'var(--primary)';
      }
      if (dom.curriculumDesc) {
        dom.curriculumDesc.textContent = `${grade}. Sınıf: Alan Becerileri, Erdem-Değer & Bütüncül Öğrenme`;
      }
      if (dom.curriculumBadge) {
        dom.curriculumBadge.textContent = 'TYMM MÜFREDATI';
        dom.curriculumBadge.style.background = 'var(--primary)';
      }
    }
  }

  // 1-36 Eğitim Haftalarını Dropdown'a Doldur
  function populateAcademicWeeksDropdown() {
    dom = getDOM();
    if (!dom.selectWeek) return;

    const state = window.stateManager ? window.stateManager.loadState() : {};
    const appCurrentWeek = window.stateManager ? window.stateManager.getSelectedWeek() : '';

    // Tüm eğitim haftalarını listele
    const weeksList = [];
    const now = new Date();
    const currentYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    const openingMon = typeof window.getSchoolOpeningMonday === 'function' 
      ? window.getSchoolOpeningMonday(currentYear) 
      : new Date(currentYear, 8, 8);

    for (let w = 1; w <= 38; w++) {
      const mon = new Date(openingMon.getTime() + (w - 1) * 7 * 86400000);
      const isoWeek = typeof window.getISOWeek === 'function' ? window.getISOWeek(mon) : '';
      const info = typeof window.getEducationWeekInfo === 'function' ? window.getEducationWeekInfo(isoWeek) : null;
      
      const label = info ? info.label : `${w}. Hafta`;
      weeksList.push({
        isoWeek,
        academicWeekNo: w,
        label,
        isCurrent: isoWeek === appCurrentWeek
      });
    }

    let html = '';
    weeksList.forEach(w => {
      const currentStar = w.isCurrent ? ' ★ (Geçerli Hafta)' : '';
      html += `<option value="${w.isoWeek}">${w.label}${currentStar}</option>`;
    });

    dom.selectWeek.innerHTML = html;
    if (currentSelectedWeekId) {
      dom.selectWeek.value = currentSelectedWeekId;
    }
  }

  // Hafta Adım Butonları (Önceki / Sonraki)
  function stepWeek(delta) {
    dom = getDOM();
    if (!dom.selectWeek) return;

    const curIdx = dom.selectWeek.selectedIndex;
    const newIdx = curIdx + delta;
    if (newIdx >= 0 && newIdx < dom.selectWeek.options.length) {
      dom.selectWeek.selectedIndex = newIdx;
      currentSelectedWeekId = dom.selectWeek.value;
      onWeekSelectionChanged();
    }
  }

  // Hafta Değiştiğinde Çağrılır
  function onWeekSelectionChanged() {
    dom = getDOM();
    if (!currentSelectedWeekId) return;

    const appCurrentWeek = window.stateManager ? window.stateManager.getSelectedWeek() : '';
    const info = typeof window.getEducationWeekInfo === 'function' 
      ? window.getEducationWeekInfo(currentSelectedWeekId) 
      : null;

    // Tarih aralığı rozetini güncelle
    if (dom.badgeDateRange) {
      if (info) {
        const yStr = info.year || '';
        dom.badgeDateRange.innerHTML = `📅 <strong>${info.shortLabel}</strong>: ${info.dateRange} ${yStr}`;
      } else {
        dom.badgeDateRange.textContent = currentSelectedWeekId;
      }
    }

    // Geçerli haftaya dön butonu
    if (dom.btnResetWeek) {
      dom.btnResetWeek.style.display = (currentSelectedWeekId !== appCurrentWeek) ? 'inline-block' : 'none';
    }

    // Gizli tarih inputunu Pazartesi tarihine eşitle
    if (dom.inputDate && info && info.monday) {
      dom.inputDate.value = formatISODate(info.monday);
    }

    syncCourseAndYearlyPlan();
  }

  // Haftalık Programdan Dersleri Çek ve Dropdown'a Doldur
  function populateCoursesFromSchedule() {
    dom = getDOM();
    if (!dom.selectCourse) return;

    const curCourse = dom.selectCourse.value;
    const state = window.stateManager ? window.stateManager.loadState() : {};
    const definedLessons = state.definedLessons || [];
    const scheduleGrid = state.scheduleGrid || {};
    const yearlyPlans = state.plans || [];

    const coursesMap = new Map();

    // 1. Haftalık ders programında gerçekten yer alan dersler
    const lessonsInSchedule = new Set();
    Object.keys(scheduleGrid).forEach(k => {
      const lessonId = scheduleGrid[k];
      if (lessonId) lessonsInSchedule.add(lessonId);
    });

    definedLessons.forEach(l => {
      if (l.name) {
        const inSchedule = lessonsInSchedule.has(l.id);
        coursesMap.set(l.name.trim(), {
          name: l.name.trim(),
          color: l.color || '#4f46e5',
          inSchedule
        });
      }
    });

    // 2. Yıllık planlardaki dersler
    yearlyPlans.forEach(p => {
      const name = p.courseName || p.title;
      if (name && !coursesMap.has(name.trim())) {
        coursesMap.set(name.trim(), {
          name: name.trim(),
          color: '#64748b',
          inSchedule: false
        });
      }
    });

    // 3. Standart MEB temel dersleri (eksikse)
    ['Türkçe', 'Matematik', 'Hayat Bilgisi', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü ve Ahlak Bilgisi'].forEach(c => {
      if (!coursesMap.has(c)) {
        coursesMap.set(c, { name: c, color: '#6366f1', inSchedule: false });
      }
    });

    let html = `<option value="">-- Ders Seçiniz (Haftalık Programdan) --</option>`;
    coursesMap.forEach(item => {
      const scheduleTag = item.inSchedule ? ' (Programda Tanımlı)' : '';
      html += `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}${scheduleTag}</option>`;
    });

    dom.selectCourse.innerHTML = html;
    if (curCourse && coursesMap.has(curCourse)) {
      dom.selectCourse.value = curCourse;
    } else {
      // Programda ilk bulunan dersi varsayılan seç
      for (const [name, item] of coursesMap.entries()) {
        if (item.inSchedule) {
          dom.selectCourse.value = name;
          break;
        }
      }
    }
  }

  // Ders Seçimi, Saat Tespiti ve Yıllık Plan Eşleştirme Motoru
  function syncCourseAndYearlyPlan() {
    dom = getDOM();
    const selectedCourse = dom.selectCourse ? dom.selectCourse.value.trim() : '';

    if (!selectedCourse) {
      if (dom.scheduleChipsContainer) {
        dom.scheduleChipsContainer.innerHTML = `
          <div style="color: var(--text-muted); font-style: italic;">
            ℹ️ Ders seçtiğinizde haftalık programdaki ders saati ve yıllık plan kazanımları otomatik listelenecektir.
          </div>
        `;
      }
      if (dom.noticeYearlyMatch) dom.noticeYearlyMatch.style.display = 'none';
      if (dom.weekOutcomesContainer) dom.weekOutcomesContainer.innerHTML = '';
      return;
    }

    // 1. Haftalık Ders Programından Dersin Saat Sayısını ve Gün Dağılımını Tespit Et
    detectWeeklyHoursFromSchedule(selectedCourse);

    // 2. Yıllık Plandan O Haftanın Kazanımlarını Çek
    fetchYearlyPlanOutcomes(false);
  }

  // Haftalık Programda Bu Ders Kaç Saat Var? (Otomatik Tespit)
  function detectWeeklyHoursFromSchedule(courseName) {
    dom = getDOM();
    if (!dom.scheduleChipsContainer) return;

    const state = window.stateManager ? window.stateManager.loadState() : {};
    const scheduleGrid = state.scheduleGrid || {};
    const definedLessons = state.definedLessons || [];

    // Ders ID'sini bul
    const foundLesson = definedLessons.find(l => l.name.trim().toLowerCase() === courseName.toLowerCase());
    const targetId = foundLesson ? foundLesson.id : null;

    let totalHours = 0;
    const daysDistribution = {}; // { 'Pazartesi': 2, 'Salı': 1, ... }

    // 5 iş gününü tara (1: Pazartesi ... 5: Cuma)
    for (let d = 1; d <= 5; d++) {
      const dayName = DAYS_TR[d];
      let dayCount = 0;
      for (let p = 1; p <= 8; p++) {
        const key = `${d}-p${p}`;
        const cellVal = scheduleGrid[key];
        if (cellVal && ((targetId && cellVal === targetId) || cellVal === courseName)) {
          dayCount++;
          totalHours++;
        }
      }
      if (dayCount > 0) {
        daysDistribution[dayName] = dayCount;
      }
    }

    // Haftalık ders saati kutusunu otomatik doldur
    if (dom.inputHours) {
      if (totalHours > 0) {
        dom.inputHours.value = totalHours;
        if (dom.badgeAutoHours) dom.badgeAutoHours.style.display = 'inline';
      } else {
        // Programda yoksa mantıklı bir varsayılan ver
        if (!dom.inputHours.value || dom.inputHours.value === '0') dom.inputHours.value = '2';
        if (dom.badgeAutoHours) dom.badgeAutoHours.style.display = 'none';
      }
    }

    // Dağılım rozetlerini çiz
    const dayKeys = Object.keys(daysDistribution);
    if (dayKeys.length > 0) {
      const summaryText = dayKeys.map(k => `${k} (${daysDistribution[k]} Saat)`).join(' • ');
      dom.scheduleChipsContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.4rem;">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span style="width: 9px; height: 9px; border-radius: 50%; background-color: ${foundLesson?.color || '#4f46e5'};"></span>
            <strong>Programda:</strong>
            <span style="color: var(--text-primary); font-weight: 600;">${summaryText}</span>
          </div>
          <span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #10b981; font-weight: 700; font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 12px;">
            Toplam: ${totalHours} Ders Saati/Hafta
          </span>
        </div>
      `;
    } else {
      dom.scheduleChipsContainer.innerHTML = `
        <div style="color: var(--text-muted); font-style: italic;">
          ℹ️ "${escapeHtml(courseName)}" dersi haftalık ders programında hücrelerde seçili değil. Ders saatini aşağıdan belirleyebilirsiniz.
        </div>
      `;
    }
  }

  // Yıllık Plandan O Haftanın Kazanımlarını Çek
  function fetchYearlyPlanOutcomes(showToastOnFail = false) {
    dom = getDOM();
    const selectedCourse = dom.selectCourse ? dom.selectCourse.value.trim() : '';
    const selectedGrade = dom.selectGrade ? dom.selectGrade.value.trim() : '';

    if (!selectedCourse || !currentSelectedWeekId) {
      if (dom.noticeYearlyMatch) dom.noticeYearlyMatch.style.display = 'none';
      return;
    }

    const state = window.stateManager ? window.stateManager.loadState() : {};
    const plans = state.plans || [];

    // Seçilen ders ve sınıf düzeyine en uygun yıllık planı bul
    matchedYearlyPlan = plans.find(p => {
      const pTitle = (p.title || '').toLowerCase();
      const pCourse = (p.courseName || '').toLowerCase();
      const pClass = (p.className || '').toLowerCase();
      const sCourse = selectedCourse.toLowerCase();

      const courseMatch = pCourse.includes(sCourse) || sCourse.includes(pCourse) || pTitle.includes(sCourse);
      const gradeMatch = selectedGrade ? (pClass.includes(selectedGrade) || pTitle.includes(selectedGrade)) : true;
      return courseMatch && gradeMatch;
    });

    // Sınıf düzeyi tam tutmasa bile sadece ders adına göre eşleştir
    if (!matchedYearlyPlan) {
      matchedYearlyPlan = plans.find(p => {
        const pCourse = (p.courseName || p.title || '').toLowerCase();
        const sCourse = selectedCourse.toLowerCase();
        return pCourse.includes(sCourse) || sCourse.includes(pCourse);
      });
    }

    if (!matchedYearlyPlan) {
      if (dom.noticeYearlyMatch) {
        dom.noticeYearlyMatch.style.display = 'block';
        dom.noticeYearlyMatch.style.borderColor = 'rgba(239, 68, 68, 0.25)';
        dom.noticeYearlyMatch.style.background = 'rgba(239, 68, 68, 0.06)';
        dom.noticeYearlyMatch.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: 0.78rem;">
            <span style="color: #ef4444; font-weight: 600;">
              ⚠️ "${escapeHtml(selectedCourse)}" için kayıtlı yıllık plan bulunamadı.
            </span>
            <span style="color: var(--text-muted); font-size: 0.72rem;">Kazanımı manuel yazabilirsiniz</span>
          </div>
        `;
      }
      if (dom.weekOutcomesContainer) {
        dom.weekOutcomesContainer.innerHTML = `
          <div style="font-size: 0.78rem; color: var(--text-muted); padding: 0.4rem; text-align: center;">
            Kayıtlı yıllık plan bulunamadı. Aşağıdaki alana ders konusu ve kazanımını serbestçe yazabilirsiniz.
          </div>
        `;
      }
      if (showToastOnFail && toastCallbackFn) {
        toastCallbackFn(`"${selectedCourse}" dersine ait kayıtlı yıllık plan bulunamadı.`, 'info');
      }
      return;
    }

    // Yıllık Plan bulundu! Haftayı ara
    const schedule = matchedYearlyPlan.weeklySchedule || matchedYearlyPlan.weeks || [];
    let matchedWeek = null;

    // 1. ISO Week koduna göre eşleştir
    matchedWeek = schedule.find(w => w.isoWeek === currentSelectedWeekId);

    // 2. Eğitim haftası numarasına göre eşleştir
    if (!matchedWeek) {
      const info = typeof window.getEducationWeekInfo === 'function' ? window.getEducationWeekInfo(currentSelectedWeekId) : null;
      if (info && info.academicWeekNo) {
        matchedWeek = schedule.find(w => {
          const wNum = parseInt(w.weekNumber || w.weekNo, 10);
          return wNum === info.academicWeekNo;
        });
      }
    }

    // 3. Fallback: İlk tamamlanmamış hafta veya ilk hafta
    if (!matchedWeek && schedule.length > 0) {
      matchedWeek = schedule.find(w => !w.isCompleted) || schedule[0];
    }

    if (matchedWeek) {
      // Formu yıllık plan verileriyle doldur
      const unitText = matchedWeek.unitName || (matchedWeek.unitNo ? `${matchedWeek.unitNo}. Ünite` : '');
      const topicText = matchedWeek.topics || matchedWeek.topic || '';
      if (dom.inputUnit) dom.inputUnit.value = unitText;
      if (dom.inputTopic) dom.inputTopic.value = topicText;

      // Eşleşme rozeti
      if (dom.noticeYearlyMatch) {
        dom.noticeYearlyMatch.style.display = 'block';
        dom.noticeYearlyMatch.style.borderColor = 'rgba(16, 185, 129, 0.25)';
        dom.noticeYearlyMatch.style.background = 'rgba(16, 185, 129, 0.08)';
        dom.noticeYearlyMatch.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.4rem; color: #10b981; font-size: 0.78rem; font-weight: 700;">
              <i data-lucide="check-circle-2" style="width: 14px; height: 14px;"></i>
              <span>Yıllık Plan: <strong>${escapeHtml(matchedYearlyPlan.title || matchedYearlyPlan.courseName)}</strong></span>
            </div>
            <span class="badge" style="background: rgba(99,102,241,0.1); color: var(--primary); font-size: 0.72rem; padding: 0.1rem 0.4rem; border-radius: 4px;">
              ${escapeHtml(matchedWeek.weekLabel || matchedWeek.weekNumber + '. Hafta')}
            </span>
          </div>
        `;
        if (window.safeCreateIcons) window.safeCreateIcons();
      }

      // Kazanımları listele
      renderWeekOutcomes(matchedWeek);

      if (showToastOnFail && toastCallbackFn) {
        toastCallbackFn('Kazanımlar yıllık plandan başarıyla çekildi.', 'success');
      }
    }
  }

  // O Haftanın Kazanımlarını Tıklanabilir Kartlar Olarak Çiz
  function renderWeekOutcomes(weekItem) {
    dom = getDOM();
    if (!dom.weekOutcomesContainer) return;

    const rawOutcomes = weekItem.learningOutcomes || weekItem.outcomes || '';
    const parsed = splitOutcomesText(rawOutcomes);

    currentWeekOutcomesList = parsed;
    selectedOutcomesSet = new Set(parsed); // Varsayılan olarak tümü seçili

    if (parsed.length === 0) {
      dom.weekOutcomesContainer.innerHTML = `
        <div style="font-size: 0.78rem; color: var(--text-muted); font-style: italic; padding: 0.4rem;">
          Bu hafta için tanımlı kazanım metni bulunmuyor.
        </div>
      `;
      syncOutcomesTextarea();
      return;
    }

    let html = '';
    parsed.forEach((outcome, idx) => {
      html += `
        <label class="daily-outcome-item selected" data-idx="${idx}">
          <input type="checkbox" checked data-outcome="${escapeHtml(outcome)}">
          <span>${escapeHtml(outcome)}</span>
        </label>
      `;
    });

    dom.weekOutcomesContainer.innerHTML = html;

    // Checkbox tıklama olayları
    dom.weekOutcomesContainer.querySelectorAll('.daily-outcome-item').forEach(label => {
      const chk = label.querySelector('input[type="checkbox"]');
      chk.addEventListener('change', (e) => {
        const val = chk.getAttribute('data-outcome');
        if (chk.checked) {
          selectedOutcomesSet.add(val);
          label.classList.add('selected');
        } else {
          selectedOutcomesSet.delete(val);
          label.classList.remove('selected');
        }
        syncOutcomesTextarea();
      });
    });

    syncOutcomesTextarea();
  }

  // Tümünü Seç / Kaldır
  function selectAllWeekOutcomes(selectAll) {
    dom = getDOM();
    if (!dom.weekOutcomesContainer) return;

    dom.weekOutcomesContainer.querySelectorAll('.daily-outcome-item').forEach(label => {
      const chk = label.querySelector('input[type="checkbox"]');
      const val = chk.getAttribute('data-outcome');
      chk.checked = selectAll;
      if (selectAll) {
        label.classList.add('selected');
        selectedOutcomesSet.add(val);
      } else {
        label.classList.remove('selected');
        selectedOutcomesSet.delete(val);
      }
    });

    syncOutcomesTextarea();
  }

  // Seçili Kazanımları Metin Kutusuna Aktar
  function syncOutcomesTextarea() {
    dom = getDOM();
    if (!dom.inputOutcomes) return;
    const arr = Array.from(selectedOutcomesSet);
    dom.inputOutcomes.value = arr.join('\n');
  }

  // "Tüm Kazanımları Gör" Modalını Aç
  function openAllOutcomesModal() {
    dom = getDOM();
    if (!matchedYearlyPlan) {
      if (toastCallbackFn) toastCallbackFn('Önce yıllık planı olan bir ders seçiniz.', 'warning');
      return;
    }

    if (!dom.modalAllOutcomes) return;

    if (dom.modalAllOutcomesTitle) {
      dom.modalAllOutcomesTitle.textContent = `${matchedYearlyPlan.title || matchedYearlyPlan.courseName} - Yıllık Plan Kazanım Havuzu`;
    }

    if (dom.inputSearchModalAllOutcomes) {
      dom.inputSearchModalAllOutcomes.value = '';
    }

    // Mevcut seçili kazanımları modal setine aktar
    modalSelectedOutcomesSet = new Set(selectedOutcomesSet);

    dom.modalAllOutcomes.classList.add('active');
    renderModalOutcomesList('');
  }

  // Modal Listesini Render Et
  function renderModalOutcomesList(searchQuery = '') {
    dom = getDOM();
    if (!dom.modalAllOutcomesList || !matchedYearlyPlan) return;

    const schedule = matchedYearlyPlan.weeklySchedule || matchedYearlyPlan.weeks || [];
    const q = searchQuery.toLowerCase();

    let html = '';
    let matchCount = 0;

    schedule.forEach((w, wIdx) => {
      const wLabel = w.weekLabel || `${w.weekNumber || (wIdx + 1)}. Hafta`;
      const dateRange = w.dateRange || '';
      const unit = w.unitName || (w.unitNo ? `${w.unitNo}. Ünite` : '');
      const topics = w.topics || w.topic || '';
      const outcomes = splitOutcomesText(w.learningOutcomes || w.outcomes || '');

      const isCurrentWeek = w.isoWeek === currentSelectedWeekId;

      // Filtreleme
      const combined = `${wLabel} ${dateRange} ${unit} ${topics} ${outcomes.join(' ')}`.toLowerCase();
      if (q && !combined.includes(q)) return;

      matchCount++;

      html += `
        <div class="modal-week-card ${isCurrentWeek ? 'is-current-week' : ''}" id="modal-week-card-${wIdx}">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border-color); padding-bottom: 0.4rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="badge" style="background: ${isCurrentWeek ? 'var(--primary)' : 'rgba(99,102,241,0.1)'}; color: ${isCurrentWeek ? '#fff' : 'var(--primary)'}; font-weight: 700; font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 6px;">
                ${escapeHtml(wLabel)}
              </span>
              <span style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(unit)}</span>
              ${isCurrentWeek ? '<span class="badge" style="background: #10b981; color: #fff; font-size: 0.65rem; padding: 0.1rem 0.35rem; border-radius: 10px;">Şu An Seçili Hafta</span>' : ''}
            </div>
            <span style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(dateRange)}</span>
          </div>
          
          ${topics ? `<div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 0.2rem;"><strong>Konu:</strong> ${escapeHtml(topics)}</div>` : ''}

          <div style="display: flex; flex-direction: column; gap: 0.3rem; margin-top: 0.35rem;">
            ${outcomes.map(out => {
              const isChecked = modalSelectedOutcomesSet.has(out);
              return `
                <label class="daily-outcome-item ${isChecked ? 'selected' : ''}" style="font-size: 0.78rem;">
                  <input type="checkbox" class="chk-modal-outcome" ${isChecked ? 'checked' : ''} data-outcome="${escapeHtml(out)}">
                  <span>${escapeHtml(out)}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    if (matchCount === 0) {
      dom.modalAllOutcomesList.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          Arama kriterine uyan kazanım bulunamadı.
        </div>
      `;
    } else {
      dom.modalAllOutcomesList.innerHTML = html;

      // Checkbox dinleyicileri
      dom.modalAllOutcomesList.querySelectorAll('.chk-modal-outcome').forEach(chk => {
        chk.addEventListener('change', () => {
          const out = chk.getAttribute('data-outcome');
          const parent = chk.closest('.daily-outcome-item');
          if (chk.checked) {
            modalSelectedOutcomesSet.add(out);
            if (parent) parent.classList.add('selected');
          } else {
            modalSelectedOutcomesSet.delete(out);
            if (parent) parent.classList.remove('selected');
          }
          updateModalSelectedCountBadge();
        });
      });
    }

    updateModalSelectedCountBadge();
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  function updateModalSelectedCountBadge() {
    dom = getDOM();
    if (!dom.badgeSelectedCountModal) return;
    dom.badgeSelectedCountModal.textContent = `${modalSelectedOutcomesSet.size} kazanım seçildi`;
  }

  function scrollToCurrentWeekInModal() {
    dom = getDOM();
    if (!dom.modalAllOutcomesList) return;
    const currentCard = dom.modalAllOutcomesList.querySelector('.is-current-week');
    if (currentCard) {
      currentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      currentCard.style.outline = '2px solid #6366f1';
      setTimeout(() => { currentCard.style.outline = 'none'; }, 1500);
    }
  }

  function closeAllOutcomesModal() {
    dom = getDOM();
    if (dom.modalAllOutcomes) {
      dom.modalAllOutcomes.classList.remove('active');
    }
  }

  function applySelectedOutcomesFromModal() {
    selectedOutcomesSet = new Set(modalSelectedOutcomesSet);
    syncOutcomesTextarea();
    closeAllOutcomesModal();
    if (toastCallbackFn) {
      toastCallbackFn(`${selectedOutcomesSet.size} kazanım plana aktarıldı.`, 'success');
    }
  }

  // Yapay Zeka ile Haftalık Ders Planı Üret
  async function generateWeeklyPlanWithAI() {
    dom = getDOM();
    if (isGenerating) return;

    const course = dom.selectCourse ? dom.selectCourse.value.trim() : '';
    const grade = dom.selectGrade ? dom.selectGrade.value.trim() : '4';
    const className = dom.inputClass ? dom.inputClass.value.trim() : `${grade}/A`;
    const hoursCount = dom.inputHours ? dom.inputHours.value.trim() : '2';
    const unit = dom.inputUnit ? dom.inputUnit.value.trim() : '';
    const topic = dom.inputTopic ? dom.inputTopic.value.trim() : '';
    const outcomes = dom.inputOutcomes ? dom.inputOutcomes.value.trim() : '';
    const methodStyle = dom.selectMethodStyle ? dom.selectMethodStyle.value : 'Karma & Etkileşimli';
    const customPrompt = dom.inputCustomPrompt ? dom.inputCustomPrompt.value.trim() : '';
    const teacherName = dom.inputTeacher ? dom.inputTeacher.value.trim() : 'Öğretmen';
    const principalName = dom.inputPrincipal ? dom.inputPrincipal.value.trim() : 'Okul Müdürü';
    const schoolName = dom.inputSchool ? dom.inputSchool.value.trim() : 'T.C. Millî Eğitim Bakanlığı';

    if (!course) {
      if (toastCallbackFn) toastCallbackFn('Lütfen bir ders adı seçiniz.', 'warning');
      if (dom.selectCourse) dom.selectCourse.focus();
      return;
    }

    if (!outcomes && !topic) {
      if (toastCallbackFn) toastCallbackFn('Lütfen dersin konusunu veya kazanımlarını belirtiniz.', 'warning');
      if (dom.inputTopic) dom.inputTopic.focus();
      return;
    }

    // Müfredat Modeli Belirleme: 4. ve 8. Sınıf Klasik, Diğerleri TYMM
    const isClassic = isClassicCurriculumGrade(grade);
    const curriculumModel = isClassic ? 'classic' : 'tymm';
    const curriculumTitle = isClassic ? 'Klasik (Mevcut) MEB Müfredatı' : 'Türkiye Yüzyılı Maarif Modeli (TYMM)';

    // Hafta Bilgileri
    const weekInfo = typeof window.getEducationWeekInfo === 'function' ? window.getEducationWeekInfo(currentSelectedWeekId) : null;
    const weekLabel = weekInfo ? weekInfo.label : '5. Hafta';
    const academicWeekNo = weekInfo ? weekInfo.academicWeekNo : 5;
    const dateRangeStr = weekInfo ? weekInfo.dateRange : '';
    const totalMinutes = parseInt(hoursCount, 10) * 40;
    const durationLabel = `${hoursCount} Ders Saati (${totalMinutes} Dakika)`;

    // Programdaki günleri al
    const state = window.stateManager ? window.stateManager.loadState() : {};
    const scheduleSummary = dom.scheduleChipsContainer ? dom.scheduleChipsContainer.innerText.replace(/\n/g, ' ') : '';

    // API Anahtarını kontrol et
    if (typeof window.ensureGeminiApiKey === 'function') {
      const hasKey = await window.ensureGeminiApiKey({
        featureTitle: 'Yapay Zeka Destekli Haftalık Ders Planı',
        featureDescription: `${curriculumTitle}ne uygun haftalık ders planı üretmek için Google Gemini API anahtarı gereklidir.`
      });
      if (!hasKey) return;
    } else if (!window.callGeminiAPI) {
      if (toastCallbackFn) toastCallbackFn('Gemini API bağlantısı bulunamadı.', 'danger');
      return;
    }

    setGeneratingState(true, isClassic);

    let promptText = '';

    if (isClassic) {
      // =========================================================================
      // KLASİK MÜFREDAT (4. ve 8. SINIFLAR)
      // Odak: Bilgi aktarımı, hedef & davranışlar, konu temelli derinlik, sınav hazırlığı/klasik ölçme
      // =========================================================================
      promptText = `Sen 20 yıllık deneyime sahip uzman bir MEB Maarif Müfettişisin.
Bu sınıf düzeyi (${grade}. Sınıf) MEB KLASİK (MEVCUT) MÜFREDATINA tabidir.
Aşağıda verilen bilgilere dayanarak, MEB Eğitim ve Öğretim Çalışmalarının Plânlı Yürütülmesine İlişkin Yönerge standartlarında,
öğretmenin o haftadaki tüm ders saatlerinde (${hoursCount} ders saati, ${totalMinutes} dakika) adım adım uygulayabileceği
tam ve resmi bir "KLASİK HAFTALIK DERS PLANI" hazırla.

DERS VE HAFTA BİLGİLERİ:
- Okul Adı: ${schoolName}
- Ders: ${course}
- Sınıf Düzeyi / Şube: ${className} (${grade}. Sınıf - KLASİK MÜFREDAT)
- Eğitim Haftası: ${weekLabel} (${dateRangeStr})
- Haftalık Ders Saati: ${durationLabel}
- Haftalık Program Bilgisi: ${scheduleSummary}
- Ders Öğretmeni: ${teacherName}
- Okul Müdürü: ${principalName}
- Ünite Adı: ${unit || 'Genel Ünite'}
- Ders Konusu: ${topic || course}
- Hedef ve Davranışlar / Kazanımlar: ${outcomes || topic}
- Tercih Edilen Ders İşleniş Yaklaşımı: ${methodStyle}
${customPrompt ? `- Öğretmenin Özel İstekleri / Notu: ${customPrompt}` : ''}

KLASİK MÜFREDAT DERS PLANI KRİTERLERİ (Bölüm I, II, III, IV):
1. Plan, haftalık tüm ders saatlerini (${hoursCount} saat) kapsar.
2. İşleniş Bölümü: Dikkati Çekme, Güdüleme, Gözden Geçirme, Derse Geçiş, Bireysel/Grupla Öğrenme Etkinlikleri ve Özet adımlarını içermelidir.
3. Ölçme-Değerlendirme: Konu kazanım kavrama soruları, klasik test/açık uçlu sınav tarzı sorular, hedef-davranış kontrolü.
4. Diğer Derslerle İlişkilendirme: Konunun diğer disiplinlerle/derslerle bağlantısı.

Lütfen yanıtını SADECE aşağıdaki JSON şemasına uygun geçerli bir JSON olarak ver (hiçbir markdown kod bloğu, \`\`\`json veya fazladan metin ekleme):
{
  "curriculumModel": "classic",
  "methods": "Öğretme-öğrenme yöntem ve teknikleri (Soru-cevap, anlatım, problem çözme, alıştırma)",
  "materials": "Eğitim teknolojileri, araç-gereçler ve kaynaklar (Ders kitabı, defter, akıllı tahta, test yaprağı)",
  "concepts": "Ünite kavramları ve sembolleri",
  "otherCoursesRelation": "Diğer derslerle ilişkilendirme (Disiplinler arası bağ)",
  "introduction": "Dikkati Çekme, Güdüleme ve Derse Geçiş (Hedeften haberdar etme, merak uyandırma)",
  "development": "Öğretme-Öğrenme Etkinlikleri (${hoursCount} ders saatine yayılmış adım adım konu anlatımı, etkinlikler ve soru çözümleri)",
  "conclusion": "Özet ve Pekiştirme (Dersin ana hatlarının toparlanması)",
  "assessment": "Ölçme ve Değerlendirme (Kazanım kavrama soruları, çalışma soruları, hedef-davranış yoklaması)",
  "homework": "Ödev ve Bireysel Çalışma (Konu tekrarı ve pekiştirme soruları)"
}`;
    } else {
      // =========================================================================
      // TÜRKİYE YÜZYILI MAARİF MODELİ (TYMM) (1, 2, 3, 5, 6, 7. SINIFLAR)
      // Odak: Alan Becerileri, Kavramsal Beceriler, Erdem-Değer-Eylem, Köprü Kurma, Farklılaştırma
      // =========================================================================
      promptText = `Sen 20 yıllık deneyime sahip uzman bir MEB ve Maarif Modeli Program Geliştirme uzmanısın.
Bu sınıf düzeyi (${grade}. Sınıf) TÜRKİYE YÜZYILI MAARİF MODELİ (TYMM) müfredatına tabidir.
Aşağıda verilen bilgilere dayanarak, Türkiye Yüzyılı Maarif Modeli Taslak Çerçeve ve Öğretim Programı ilkelerine tam uyumlu,
öğretmenin o haftadaki tüm ders saatlerinde (${hoursCount} ders saati, ${totalMinutes} dakika) adım adım uygulayabileceği
zengin, somut ve pedagojik bir "TÜRKİYE YÜZYILI MAARİF MODELİ HAFTALIK DERS PLANI" hazırla.

DERS VE HAFTA BİLGİLERİ:
- Okul Adı: ${schoolName}
- Ders: ${course}
- Sınıf Düzeyi / Şube: ${className} (${grade}. Sınıf - TYMM MÜFREDATI)
- Eğitim Haftası: ${weekLabel} (${dateRangeStr})
- Haftalık Ders Saati: ${durationLabel}
- Haftalık Program Bilgisi: ${scheduleSummary}
- Ders Öğretmeni: ${teacherName}
- Okul Müdürü: ${principalName}
- Tema / Öğrenme Alanı: ${unit || 'Genel Tema'}
- Konu / Odak: ${topic || course}
- Öğrenme Çıktıları ve Süreç Bileşenleri: ${outcomes || topic}
- Tercih Edilen Öğretim Yaklaşımı: ${methodStyle}
${customPrompt ? `- Öğretmenin Özel İstekleri / Notu: ${customPrompt}` : ''}

MAARİF MODELİ (TYMM) KRİTERLERİ:
1. Alan Becerileri ve Kavramsal Beceriler açıkça vurgulanmalıdır.
2. Programlar Arası Bileşenler: Erdem-Değer-Eylem (adalet, sorumluluk, saygı vb.) ve Okuryazarlık becerileri entegre edilmelidir.
3. Ön Değerlendirme & Temel Kabuller (Yokla): Öğrencilerin hazırbulunuşluk düzeyi.
4. Köprü Kurma (Bağla): Mevcut bilgi ve günlük hayatla anlamlı bağ kurma.
5. Öğrenme-Öğretme Yaşantıları: Öğrenci merkezli, keşfetme ve uygulama etkinlikleri (${hoursCount} saat).
6. Farklılaştırma: Zenginleştirme (ileri düzey) ve Destekleme (desteğe ihtiyaç duyanlar).
7. Öğrenme Kanıtları: Süreç odaklı değerlendirme, gözlem formu ve açık uçlu durum soruları.

Lütfen yanıtını SADECE aşağıdaki JSON şemasına uygun geçerli bir JSON olarak ver (hiçbir markdown kod bloğu, \`\`\`json veya fazladan metin ekleme):
{
  "curriculumModel": "tymm",
  "fieldSkills": "Alan Becerileri ve Kavramsal Beceriler (Derse özgü beceriler, sorgulama, analiz)",
  "valuesAndLiteracy": "Programlar Arası Bileşenler (Erdem-Değer-Eylem, Okuryazarlık Becerileri)",
  "methods": "Öğrenme-Öğretme Yöntem ve Teknikleri (Etkileşimli, 5E, istasyon, probleme dayalı vb.)",
  "materials": "Araç, Gereç ve Dijital Materyaller (Akıllı tahta, EBA, somut materyal, çalışma kartı)",
  "preAssessment": "Temel Kabuller ve Ön Değerlendirme (Yokla: Hazırbulunuşluğu ölçme adımı)",
  "bridging": "Köprü Kurma (Bağla: Önceki öğrenmeler ve günlük hayatla anlamlı ilişki kurma)",
  "development": "Öğrenme-Öğretme Uygulamaları (Keşfetme, Yaparak Yaşayarak Öğrenme - ${hoursCount} ders saati akışı)",
  "conclusion": "Anlamlandırma, Değerlendirme ve Kapanış (Çıkış bileti, özetleme)",
  "assessment": "Öğrenme Kanıtları ve Süreç Odaklı Değerlendirme (Gözlem, süreç rubriği, durum sorusu)",
  "differentiation": "Farklılaştırma (Zenginleştirme ve Destekleme uyarlamaları)",
  "homework": "Öğrenme Görevi / Bireysel Derinleştirme (Günlük yaşam bağlantılı görev)"
}`;
    }

    try {
      let rawRes = '';
      if (typeof window.callGeminiAPI === 'function') {
        rawRes = await window.callGeminiAPI(promptText, {
          json: true,
          temperature: 0.35
        });
      }

      if (!rawRes) {
        throw new Error('Yapay zekadan boş yanıt döndü.');
      }

      const planContent = parseAIJsonResponse(rawRes);
      if (!planContent.curriculumModel) {
        planContent.curriculumModel = curriculumModel;
      }

      // Güncel haftalık plan nesnesini oluştur
      currentDailyPlan = {
        id: 'wp_' + Date.now(),
        weekId: currentSelectedWeekId,
        academicWeekNo: academicWeekNo,
        weekLabel: weekLabel,
        dateRange: dateRangeStr,
        curriculumModel: curriculumModel,
        curriculumTitle: curriculumTitle,
        courseName: course,
        gradeLevel: grade,
        className: className,
        lessonHours: durationLabel,
        teacherName: teacherName,
        principalName: principalName,
        schoolName: schoolName,
        unitName: unit,
        topic: topic,
        learningOutcomes: outcomes,
        methodStyle: methodStyle,
        scheduleDistribution: scheduleSummary,
        planData: planContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      renderWeeklyPlanSheet(currentDailyPlan);

      if (toastCallbackFn) {
        toastCallbackFn(`${curriculumTitle} formatında haftalık plan başarıyla hazırlandı!`, 'success');
      }

      // Otomatik kaydet & Kişisel Evrak Deposu'na senkronize et
      if (window.stateManager && typeof window.stateManager.saveDailyPlan === 'function') {
        window.stateManager.saveDailyPlan(currentDailyPlan);
        updateArchiveBadgeCount();
        try {
          await syncDailyPlanToDocumentsStorage(currentDailyPlan);
        } catch (e) {
          console.warn('Evrak deposuna senkronizasyon uyarısı:', e);
        }
      }

    } catch (err) {
      console.error('Haftalık plan üretme hatası:', err);
      if (err.message !== 'CANCELLED') {
        if (toastCallbackFn) {
          toastCallbackFn(`Plan oluşturulurken hata: ${err.message || err}`, 'danger');
        }
      }
    } finally {
      setGeneratingState(false);
    }
  }

  let generationProgressTimer = null;

  function cancelAIGeneration() {
    if (abortController) {
      abortController.abort();
    }
    setGeneratingState(false);
    if (toastCallbackFn) toastCallbackFn('İşlem iptal edildi.', 'info');
  }

  function setGeneratingState(loading, isClassicCurriculum = false) {
    isGenerating = loading;
    dom = getDOM();
    if (dom.loadingBox) dom.loadingBox.style.display = loading ? 'flex' : 'none';
    if (dom.btnGenerate) {
      dom.btnGenerate.disabled = loading;
      dom.btnGenerate.style.opacity = loading ? '0.6' : '1';
    }

    // Sağ taraftaki plan penceresinde animasyonlu süreç ekranı
    if (loading) {
      if (dom.emptyState) dom.emptyState.style.display = 'none';
      if (dom.activePlanEditor) dom.activePlanEditor.style.display = 'none';
      if (dom.generatingScreen) {
        dom.generatingScreen.style.display = 'block';

        if (dom.curriculumStepLabel) {
          dom.curriculumStepLabel.textContent = isClassicCurriculum 
            ? 'Klasik müfredat hedef ve davranışlarına uygun etkinlikler üretiliyor' 
            : 'TYMM alan becerileri ve erdem-değer çerçevesinde etkinlikler üretiliyor';
        }

        // Adım adım ilerleyen dinamik mesajlar
        const progressMessages = [
          'Ders kazanımları ve haftalık program saat dağılımı analiz ediliyor...',
          isClassicCurriculum 
            ? 'Hedef ve davranışlara uygun giriş, dikkati çekme ve konu işlenişi kurgulanıyor...' 
            : 'Temel kabuller (Yokla) ve günlük yaşam bağlantısı (Bağla) yapılandırılıyor...',
          isClassicCurriculum
            ? 'Haftalık ders saatlerine yayılmış soru çözümleri ve pekiştirme adımları yazılıyor...'
            : 'Öğrenme-öğretme uygulamaları ve keşfetme etkinlikleri tasarlanıyor...',
          isClassicCurriculum
            ? 'Kavram kavrama soruları ve ölçme-değerlendirme bölümü oluşturuluyor...'
            : 'Öğrenme kanıtları, rubrik ve farklılaştırma (zenginleştirme/destekleme) ekleniyor...',
          'A4 resmi baskı formatı, öğretmen ve müdür onay alanı son haline getiriliyor...'
        ];

        let msgIdx = 0;
        if (dom.generatingStepText) {
          dom.generatingStepText.textContent = progressMessages[0];
        }

        if (generationProgressTimer) clearInterval(generationProgressTimer);
        generationProgressTimer = setInterval(() => {
          msgIdx = (msgIdx + 1) % progressMessages.length;
          if (dom.generatingStepText) {
            dom.generatingStepText.style.opacity = '0';
            setTimeout(() => {
              if (dom.generatingStepText) {
                dom.generatingStepText.textContent = progressMessages[msgIdx];
                dom.generatingStepText.style.opacity = '1';
              }
            }, 200);
          }
        }, 3200);

        if (window.safeCreateIcons) window.safeCreateIcons();
      }
    } else {
      if (generationProgressTimer) {
        clearInterval(generationProgressTimer);
        generationProgressTimer = null;
      }
      if (dom.generatingScreen) dom.generatingScreen.style.display = 'none';
      if (!currentDailyPlan) {
        if (dom.emptyState) dom.emptyState.style.display = 'block';
        if (dom.activePlanEditor) dom.activePlanEditor.style.display = 'none';
      }
    }
  }

  // A4 Haftalık Ders Planı Kağıdını Render Et (Klasik ve TYMM formatlarına göre otomatik şablon)
  function renderWeeklyPlanSheet(plan) {
    dom = getDOM();
    if (!dom.planSheet) return;

    if (generationProgressTimer) {
      clearInterval(generationProgressTimer);
      generationProgressTimer = null;
    }
    if (dom.generatingScreen) dom.generatingScreen.style.display = 'none';

    if (!plan || !plan.planData) {
      if (dom.emptyState) dom.emptyState.style.display = 'block';
      if (dom.activePlanEditor) dom.activePlanEditor.style.display = 'none';
      dom.planSheet.innerHTML = '';
      return;
    }

    if (dom.emptyState) dom.emptyState.style.display = 'none';
    if (dom.activePlanEditor) dom.activePlanEditor.style.display = 'block';

    const p = plan.planData || {};
    const isClassic = plan.curriculumModel === 'classic' || isClassicCurriculumGrade(plan.gradeLevel);
    const curriculumTitle = isClassic ? 'Klasik (Mevcut) MEB Müfredatı' : 'Türkiye Yüzyılı Maarif Modeli';
    const teacherDisplayName = plan.teacherName || 'Öğretmen';
    const principalDisplayName = plan.principalName || 'Okul Müdürü';

    let sectionsHtml = '';

    if (isClassic) {
      // =========================================================================
      // ŞABLON A: KLASİK MÜFREDAT TABLOSU (4. ve 8. Sınıflar)
      // =========================================================================
      sectionsHtml = `
        <!-- BÖLÜM 1: DERS VE KAZANIM BİLGİLERİ -->
        <div class="dp-section">
          <div class="dp-section-title">BÖLÜM I: DERS, KONU VE HEDEF-DAVRANIŞ BİLGİLERİ</div>
          <table class="dp-content-table">
            <tr>
              <td style="width: 26%; font-weight: 700;">Ünite Adı ve No:</td>
              <td contenteditable="true" data-field="unitName" class="dp-editable-cell">${escapeHtml(plan.unitName || 'Genel')}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Konu:</td>
              <td contenteditable="true" data-field="topic" class="dp-editable-cell">${escapeHtml(plan.topic || plan.courseName)}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Öğrenci Kazanımları / Hedef-Davranışlar:</td>
              <td contenteditable="true" data-field="learningOutcomes" class="dp-editable-cell" style="white-space: pre-wrap;">${escapeHtml(plan.learningOutcomes || '')}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Öğretme-Öğrenme Yöntem ve Teknikleri:</td>
              <td contenteditable="true" data-field="planData.methods" class="dp-editable-cell">${escapeHtml(p.methods || '')}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Kullanılan Araç, Gereç ve Kaynaklar:</td>
              <td contenteditable="true" data-field="planData.materials" class="dp-editable-cell">${escapeHtml(p.materials || '')}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Ünite Kavramları ve Sembolleri:</td>
              <td contenteditable="true" data-field="planData.concepts" class="dp-editable-cell">${escapeHtml(p.concepts || '')}</td>
            </tr>
            ${p.otherCoursesRelation ? `
            <tr>
              <td style="font-weight: 700;">Diğer Derslerle İlişkilendirme:</td>
              <td contenteditable="true" data-field="planData.otherCoursesRelation" class="dp-editable-cell">${escapeHtml(p.otherCoursesRelation)}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <!-- BÖLÜM 2: ÖĞRETME - ÖĞRENME ETKİNLİKLERİ -->
        <div class="dp-section">
          <div class="dp-section-title">BÖLÜM II: ÖĞRETME - ÖĞRENME ETKİNLİKLERİ (HAFTALIK İŞLENİŞ)</div>
          
          <div class="dp-substep">
            <div class="dp-substep-title">A) Dikkati Çekme, Güdüleme ve Derse Geçiş</div>
            <div contenteditable="true" data-field="planData.introduction" class="dp-editable-block">${formatRichParagraphs(p.introduction)}</div>
          </div>

          <div class="dp-substep">
            <div class="dp-substep-title">B) Geliştirme ve Öğrenme Etkinlikleri (${escapeHtml(plan.lessonHours || 'Ders Saatleri')} Boyunca İşleniş)</div>
            <div contenteditable="true" data-field="planData.development" class="dp-editable-block">${formatRichParagraphs(p.development)}</div>
          </div>

          <div class="dp-substep">
            <div class="dp-substep-title">C) Özetleme ve Pekiştirme</div>
            <div contenteditable="true" data-field="planData.conclusion" class="dp-editable-block">${formatRichParagraphs(p.conclusion)}</div>
          </div>
        </div>

        <!-- BÖLÜM 3: ÖLÇME VE DEĞERLENDİRME -->
        <div class="dp-section">
          <div class="dp-section-title">BÖLÜM III: ÖLÇME VE DEĞERLENDİRME</div>
          <table class="dp-content-table">
            <tr>
              <td style="width: 26%; font-weight: 700;">Ölçme ve Değerlendirme (Kavram Soruları / Test):</td>
              <td contenteditable="true" data-field="planData.assessment" class="dp-editable-cell">${formatRichParagraphs(p.assessment)}</td>
            </tr>
            ${p.homework ? `
            <tr>
              <td style="font-weight: 700;">Ödev ve Bireysel Pekiştirme Çalışması:</td>
              <td contenteditable="true" data-field="planData.homework" class="dp-editable-cell">${formatRichParagraphs(p.homework)}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      `;
    } else {
      // =========================================================================
      // ŞABLON B: TÜRKİYE YÜZYILI MAARİF MODELİ TABLOSU (1, 2, 3, 5, 6, 7. Sınıflar)
      // =========================================================================
      sectionsHtml = `
        <!-- BÖLÜM 1: DERS VE BECERİ BİLEŞENLERİ -->
        <div class="dp-section">
          <div class="dp-section-title">BÖLÜM I: DERS, ÖĞRENME ÇIKTILARI VE BECERİ ODAKLARI</div>
          <table class="dp-content-table">
            <tr>
              <td style="width: 26%; font-weight: 700;">Tema / Öğrenme Alanı:</td>
              <td contenteditable="true" data-field="unitName" class="dp-editable-cell">${escapeHtml(plan.unitName || 'Genel')}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Konu / Odak:</td>
              <td contenteditable="true" data-field="topic" class="dp-editable-cell">${escapeHtml(plan.topic || plan.courseName)}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Öğrenme Çıktıları:</td>
              <td contenteditable="true" data-field="learningOutcomes" class="dp-editable-cell" style="white-space: pre-wrap;">${escapeHtml(plan.learningOutcomes || '')}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Alan Becerileri & Kavramsal Beceriler:</td>
              <td contenteditable="true" data-field="planData.fieldSkills" class="dp-editable-cell">${escapeHtml(p.fieldSkills || '')}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Programlar Arası Bileşenler (Erdem-Değer-Eylem / Okuryazarlık):</td>
              <td contenteditable="true" data-field="planData.valuesAndLiteracy" class="dp-editable-cell">${escapeHtml(p.valuesAndLiteracy || '')}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Yöntem, Teknik ve Materyaller:</td>
              <td contenteditable="true" data-field="planData.methods" class="dp-editable-cell">${escapeHtml(p.methods || '')} ${p.materials ? `(${escapeHtml(p.materials)})` : ''}</td>
            </tr>
          </table>
        </div>

        <!-- BÖLÜM 2: ÖĞRENME - ÖĞRETME YAŞANTILARI -->
        <div class="dp-section">
          <div class="dp-section-title">BÖLÜM II: ÖĞRENME - ÖĞRETME YAŞANTILARI (HAFTALIK SÜREÇ)</div>
          
          <div class="dp-substep">
            <div class="dp-substep-title">A) Temel Kabuller & Ön Değerlendirme (Yokla)</div>
            <div contenteditable="true" data-field="planData.preAssessment" class="dp-editable-block">${formatRichParagraphs(p.preAssessment || p.introduction)}</div>
          </div>

          <div class="dp-substep">
            <div class="dp-substep-title">B) Köprü Kurma (Bağla: Önceki Öğrenmeler & Günlük Yaşam Bağlantısı)</div>
            <div contenteditable="true" data-field="planData.bridging" class="dp-editable-block">${formatRichParagraphs(p.bridging || '')}</div>
          </div>

          <div class="dp-substep">
            <div class="dp-substep-title">C) Öğrenme-Öğretme Uygulamaları (${escapeHtml(plan.lessonHours || 'Haftalık')} Adım Adım İşleniş)</div>
            <div contenteditable="true" data-field="planData.development" class="dp-editable-block">${formatRichParagraphs(p.development)}</div>
          </div>

          <div class="dp-substep">
            <div class="dp-substep-title">D) Anlamlandırma, Değerlendirme ve Kapanış (Çıkış Bileti)</div>
            <div contenteditable="true" data-field="planData.conclusion" class="dp-editable-block">${formatRichParagraphs(p.conclusion)}</div>
          </div>
        </div>

        <!-- BÖLÜM 3: ÖĞRENME KANITLARI VE FARKLILAŞTIRMA -->
        <div class="dp-section">
          <div class="dp-section-title">BÖLÜM III: ÖĞRENME KANITLARI VE FARKLILAŞTIRILMIŞ ÖĞRETİM</div>
          <table class="dp-content-table">
            <tr>
              <td style="width: 26%; font-weight: 700;">Öğrenme Kanıtları (Süreç Odaklı Ölçme / Rubrik):</td>
              <td contenteditable="true" data-field="planData.assessment" class="dp-editable-cell">${formatRichParagraphs(p.assessment)}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Farklılaştırma (Zenginleştirme ve Destekleme):</td>
              <td contenteditable="true" data-field="planData.differentiation" class="dp-editable-cell">${formatRichParagraphs(p.differentiation)}</td>
            </tr>
            ${p.homework ? `
            <tr>
              <td style="font-weight: 700;">Öğrenme Görevi / Bireysel Derinleştirme:</td>
              <td contenteditable="true" data-field="planData.homework" class="dp-editable-cell">${formatRichParagraphs(p.homework)}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      `;
    }

    dom.planSheet.innerHTML = `
      <!-- A4 MEB Standart Haftalık Ders Planı -->
      <div class="daily-plan-print-page" id="daily-plan-print-content">
        
        <!-- Resmi Başlık ve Antet -->
        <div class="dp-header-table">
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px;">
            <h4 style="margin: 0; font-size: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(plan.schoolName || 'T.C. MİLLÎ EĞİTİM BAKANLIĞI')}</h4>
            <h5 style="margin: 3px 0 0 0; font-size: 0.95rem; font-weight: 700; color: #1e293b;">DERSİN HAFTALIK DERS PLANI</h5>
            <div style="font-size: 0.78rem; font-weight: 700; color: ${isClassic ? '#d97706' : '#4f46e5'}; margin-top: 2px;">
              [ ${escapeHtml(curriculumTitle)} ]
            </div>
          </div>

          <table class="dp-meta-table">
            <tr>
              <td style="width: 18%; font-weight: 700;">Dersin Adı:</td>
              <td style="width: 32%;">${escapeHtml(plan.courseName)}</td>
              <td style="width: 18%; font-weight: 700;">Eğitim Haftası:</td>
              <td style="width: 32%;">${escapeHtml(plan.weekLabel || '5. Hafta')} (${escapeHtml(plan.dateRange || '')})</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Sınıf / Şube:</td>
              <td>${escapeHtml(plan.className)} (${escapeHtml(plan.gradeLevel || '')}. Sınıf)</td>
              <td style="font-weight: 700;">Haftalık Ders Saati:</td>
              <td>${escapeHtml(plan.lessonHours)}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Ders Öğretmeni:</td>
              <td>${escapeHtml(teacherDisplayName)}</td>
              <td style="font-weight: 700;">Müfredat Standardı:</td>
              <td>${escapeHtml(curriculumTitle)}</td>
            </tr>
          </table>
        </div>

        ${sectionsHtml}

        <!-- İMZA ALANI -->
        <div class="dp-signatures" style="display: flex; justify-content: space-between; margin-top: 30px; padding: 0 30px;">
          <div class="dp-sign-box" style="width: 220px; text-align: center;">
            <div style="font-weight: 700; font-size: 0.95rem;">${escapeHtml(teacherDisplayName)}</div>
            <div style="font-size: 0.8rem; color: #475569;">Ders Öğretmeni</div>
            <div style="margin-top: 2.2rem; font-size: 0.75rem; color: #94a3b8;">İmza</div>
          </div>
          <div class="dp-sign-box" style="width: 220px; text-align: center;">
            <div style="font-weight: 700; font-size: 0.95rem;">UYGUNDUR</div>
            <div style="font-size: 0.82rem; font-weight: 600; color: #1e293b;">${escapeHtml(principalDisplayName)}</div>
            <div style="font-size: 0.8rem; color: #475569;">Okul Müdürü</div>
            <div style="margin-top: 1.5rem; font-size: 0.75rem; color: #94a3b8;">İmza / Mühür</div>
          </div>
      </div>
    `;

    // Düzenlenebilir alanların otomatik kaydedilmesi için dinleyiciler
    dom.planSheet.querySelectorAll('[contenteditable="true"]').forEach(el => {
      el.addEventListener('blur', () => {
        collectPlanDataFromDOM();
      });
    });

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Kağıttaki Düzenlemeleri Plan Nesnesine Aktar
  function collectPlanDataFromDOM() {
    if (!currentDailyPlan || !dom.planSheet) return;

    dom.planSheet.querySelectorAll('[contenteditable="true"]').forEach(el => {
      const field = el.getAttribute('data-field');
      const val = el.innerText.trim();

      if (field.startsWith('planData.')) {
        const sub = field.replace('planData.', '');
        if (!currentDailyPlan.planData) currentDailyPlan.planData = {};
        currentDailyPlan.planData[sub] = val;
      } else {
        currentDailyPlan[field] = val;
      }
    });

    currentDailyPlan.updatedAt = new Date().toISOString();
  }

  // Kişisel Evrak Deposu ile Senkronizasyon (Kalıcı Günlük Planlar Sekmesi)
  async function syncDailyPlanToDocumentsStorage(plan) {
    if (!plan || !window.stateManager) return;

    const docId = 'doc_' + plan.id;
    const docTitle = `${plan.className || ''} ${plan.courseName} - Haftalık Ders Planı (${plan.weekLabel || 'Hafta'})`;
    const fileName = `${plan.courseName}_Haftalik_Plan_${plan.academicWeekNo || 'Hafta'}.html`;

    const printContent = dom.planSheet ? dom.planSheet.innerHTML : '';
    const fullHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(docTitle)}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; color: #000; padding: 25px; line-height: 1.4; font-size: 10pt; max-width: 900px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    td, th { border: 1px solid #334155; padding: 5px 8px; vertical-align: top; font-size: 9.5pt; }
    .dp-section { margin-bottom: 12px; }
    .dp-section-title { font-weight: bold; font-size: 10pt; background: #f1f5f9; border: 1px solid #334155; border-bottom: none; padding: 4px 8px; text-transform: uppercase; }
    .dp-substep { border: 1px solid #334155; border-top: none; padding: 6px 8px; margin-bottom: -1px; }
    .dp-substep-title { font-weight: bold; font-size: 9.5pt; margin-bottom: 4px; }
    .dp-signatures { display: flex; justify-content: space-between; margin-top: 25px; padding: 0 30px; }
    .dp-sign-box { width: 200px; text-align: center; }
    @media print { @page { size: A4 portrait; margin: 10mm 12mm; } }
  </style>
</head>
<body>
  ${printContent}
</body>
</html>`;

    let base64Html = '';
    try {
      base64Html = 'data:text/html;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(fullHtml)));
    } catch (e) {
      base64Html = 'data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml);
    }

    const docData = {
      id: docId,
      title: docTitle,
      fileName: fileName,
      fileSize: formatBytes(fullHtml.length),
      fileType: 'html',
      categoryId: 'cat_daily_plans', // Kalıcı Günlük Planlar Sekmesi
      createdAt: plan.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDailyPlan: true,
      dailyPlanId: plan.id,
      courseName: plan.courseName || '',
      className: plan.className || '',
      weekLabel: plan.weekLabel || '',
      academicWeekNo: plan.academicWeekNo || ''
    };

    // 1. IndexedDB'ye tam dosya içeriğini kaydet
    if (typeof window.saveDocumentFileToIndexedDB === 'function') {
      try {
        await window.saveDocumentFileToIndexedDB(docId, base64Html, fullHtml);
      } catch (e) {
        console.warn('saveDocumentFileToIndexedDB error:', e);
      }
    }

    // 2. state.documents içinde güncelle / ekle
    if (window.stateManager.state) {
      if (!Array.isArray(window.stateManager.state.documents)) {
        window.stateManager.state.documents = [];
      }
      const existingIdx = window.stateManager.state.documents.findIndex(d => d.id === docId || d.dailyPlanId === plan.id);
      if (existingIdx >= 0) {
        window.stateManager.state.documents[existingIdx] = docData;
      } else {
        window.stateManager.state.documents.unshift(docData);
      }
      window.stateManager.saveState();
    }
  }

  // Word (.doc) Olarak İndir
  function downloadDailyPlanAsWord() {
    if (!currentDailyPlan) {
      if (toastCallbackFn) toastCallbackFn('İndirilecek bir plan bulunmuyor.', 'warning');
      return;
    }

    collectPlanDataFromDOM();
    const printContent = dom.planSheet ? dom.planSheet.innerHTML : '';
    const safeTitle = `${currentDailyPlan.className || ''}_${currentDailyPlan.courseName}_Haftalik_Plan_${currentDailyPlan.academicWeekNo || 'Hafta'}`.replace(/\s+/g, '_');

    const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${escapeHtml(safeTitle)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page { size: A4 portrait; margin: 15mm 15mm 15mm 15mm; }
    body { font-family: 'Times New Roman', serif; font-size: 10pt; color: #000000; line-height: 1.35; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    td, th { border: 1px solid #333333; padding: 5px 7px; vertical-align: top; font-size: 9.5pt; }
    .dp-section-title { font-weight: bold; font-size: 10pt; background-color: #f1f5f9; border: 1px solid #333333; border-bottom: none; padding: 4px 6px; text-transform: uppercase; }
    .dp-substep { border: 1px solid #333333; border-top: none; padding: 5px 7px; }
    .dp-substep-title { font-weight: bold; font-size: 9.5pt; margin-bottom: 3px; }
    .dp-signatures { margin-top: 25px; }
  </style>
</head>
<body>
  ${printContent}
</body>
</html>`;

    try {
      const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeTitle}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (toastCallbackFn) toastCallbackFn('Haftalık ders planı Word belgesi (.doc) olarak indirildi.', 'success');
    } catch (e) {
      console.error('Word indirme hatası:', e);
      if (toastCallbackFn) toastCallbackFn('Dosya indirilirken bir hata oluştu.', 'danger');
    }
  }

  // HTML Olarak İndir
  function downloadDailyPlanAsHtml() {
    if (!currentDailyPlan) return;
    collectPlanDataFromDOM();
    const printContent = dom.planSheet ? dom.planSheet.innerHTML : '';
    const safeTitle = `${currentDailyPlan.className || ''}_${currentDailyPlan.courseName}_Haftalik_Plan`.replace(/\s+/g, '_');

    const fullHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(safeTitle)}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; color: #000; padding: 25px; line-height: 1.4; font-size: 10pt; max-width: 900px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    td, th { border: 1px solid #333; padding: 5px 8px; vertical-align: top; font-size: 9.5pt; }
    .dp-section { margin-bottom: 10px; }
    .dp-section-title { font-weight: 800; font-size: 10pt; background: #f1f5f9; border: 1px solid #333; border-bottom: none; padding: 4px 8px; text-transform: uppercase; }
    .dp-substep { border: 1px solid #333; border-top: none; padding: 6px 8px; margin-bottom: -1px; }
    .dp-substep-title { font-weight: 700; font-size: 9.5pt; margin-bottom: 4px; }
    .dp-signatures { display: flex; justify-content: space-between; margin-top: 25px; padding: 0 20px; }
    .dp-sign-box { width: 220px; text-align: center; }
    @media print { @page { size: A4 portrait; margin: 10mm 12mm; } }
  </style>
</head>
<body>
  ${printContent}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (toastCallbackFn) toastCallbackFn('Haftalık ders planı HTML olarak indirildi.', 'success');
  }

  // Planı Kaydet (Hem arşive hem Kişisel Evrak Deposu'na)
  async function saveCurrentDailyPlan() {
    if (!currentDailyPlan) {
      if (toastCallbackFn) toastCallbackFn('Kaydedilecek bir plan bulunmuyor.', 'warning');
      return;
    }

    collectPlanDataFromDOM();

    if (window.stateManager && typeof window.stateManager.saveDailyPlan === 'function') {
      window.stateManager.saveDailyPlan(currentDailyPlan);
      updateArchiveBadgeCount();
    }

    try {
      await syncDailyPlanToDocumentsStorage(currentDailyPlan);
    } catch (e) {
      console.warn('Evrak deposu senkronizasyon uyarısı:', e);
    }

    renderWeeklyPlanSheet(currentDailyPlan);

    if (toastCallbackFn) {
      toastCallbackFn('Haftalık plan başarıyla kaydedildi ve Kişisel Evrak Deposu\'na aktarıldı.', 'success');
    }
  }

  // Panoya Kopyala
  function copyDailyPlanToClipboard() {
    if (!currentDailyPlan || !currentDailyPlan.planData) return;

    const p = currentDailyPlan.planData;
    const text = `T.C. MİLLÎ EĞİTİM BAKANLIĞI - DERSİN HAFTALIK DERS PLANI
--------------------------------------------------
Ders: ${currentDailyPlan.courseName}
Sınıf / Şube: ${currentDailyPlan.className}
Eğitim Haftası: ${currentDailyPlan.weekLabel} (${currentDailyPlan.dateRange || ''})
Süre: ${currentDailyPlan.lessonHours}
Öğretmen: ${currentDailyPlan.teacherName}
Ünite: ${currentDailyPlan.unitName || ''}
Konu: ${currentDailyPlan.topic || ''}
Kazanımlar: ${currentDailyPlan.learningOutcomes || ''}
Yöntem-Teknikler: ${p.methods || ''}
Materyaller: ${p.materials || ''}

BÖLÜM II: HAFTALIK DERSİN İŞLENİŞİ
A) Haftaya Giriş ve Dikkati Çekme:
${p.introduction || ''}

B) Haftalık Öğrenme Etkinlikleri ve Gelişme:
${p.development || ''}

C) Özet, Pekiştirme ve Kapanış:
${p.conclusion || ''}

BÖLÜM III: ÖLÇME, DEĞERLENDİRME VE FARKLILAŞTIRMA
Değerlendirme: ${p.assessment || ''}
Farklılaştırma: ${p.differentiation || ''}
Haftalık Görev: ${p.homework || ''}
`;

    navigator.clipboard.writeText(text).then(() => {
      if (toastCallbackFn) toastCallbackFn('Haftalık plan metni panoya kopyalandı.', 'success');
    }).catch(() => {
      if (toastCallbackFn) toastCallbackFn('Panoya kopyalama başarısız oldu.', 'danger');
    });
  }

  // A4 Yazdır
  function printCurrentDailyPlan() {
    if (!currentDailyPlan) return;
    document.body.classList.add('print-daily-plan');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-daily-plan');
    }, 500);
  }

  // Hızlı Revizyon
  async function handleQuickRevision() {
    dom = getDOM();
    if (!dom.selectRevision || !currentDailyPlan || isGenerating) return;

    const revisionType = dom.selectRevision.value;
    if (!revisionType) return;

    let instruction = '';
    if (revisionType === 'gamify') {
      instruction = 'Dersin haftalık etkinliklerini ve gelişme bölümünü tamamen eğlenceli, yarışmalı veya oyunlaştırılmış (gamification) bir kurguya dönüştür.';
    } else if (revisionType === 'experiment') {
      instruction = 'Dersin içine mutlaka basit sınıf içi malzemelerle yapılabilecek pratik bir deney, gözlem veya canlandırma etkinliği ekle.';
    } else if (revisionType === 'compact') {
      instruction = 'Dersi daha hızlı, kompakt ve pratik adımlara böl; açıklamaları sadeleştir ve süreyi çok etkin kıl.';
    } else if (revisionType === 'support') {
      instruction = 'Öğrenme güçlüğü çeken ve desteğe ihtiyaç duyan öğrenciler için farklılaştırılmış öğretim ipuçlarını ve ek etkinlikleri belirgin şekilde artır.';
    }

    dom.selectRevision.value = '';

    if (toastCallbackFn) {
      toastCallbackFn('Yapay zeka haftalık planı revize ediyor, lütfen bekleyin...', 'info');
    }

    setGeneratingState(true);

    const revisionPrompt = `Aşağıda daha önce hazırlanan bir haftalık ders planı bulunmaktadır:
MEVCUT PLAN:
- Ders: ${currentDailyPlan.courseName}
- Konu: ${currentDailyPlan.topic}
- Giriş: ${currentDailyPlan.planData?.introduction || ''}
- Gelişme: ${currentDailyPlan.planData?.development || ''}
- Sonuç: ${currentDailyPlan.planData?.conclusion || ''}
- Ölçme: ${currentDailyPlan.planData?.assessment || ''}
- Farklılaştırma: ${currentDailyPlan.planData?.differentiation || ''}

ÖĞRETMENİN REVİZYON TALEBİ:
${instruction}

Lütfen bu talebe göre planı yeniden düzenle ve SADECE geçerli JSON formatında şu anahtarlarla ver:
{
  "methods": "...",
  "materials": "...",
  "concepts": "...",
  "introduction": "...",
  "development": "...",
  "conclusion": "...",
  "assessment": "...",
  "differentiation": "...",
  "homework": "..."
}`;

    try {
      const rawRes = await window.callGeminiAPI(revisionPrompt, { json: true, temperature: 0.35 });
      const newContent = parseAIJsonResponse(rawRes);
      currentDailyPlan.planData = newContent;
      currentDailyPlan.updatedAt = new Date().toISOString();

      renderWeeklyPlanSheet(currentDailyPlan);

      if (window.stateManager && typeof window.stateManager.saveDailyPlan === 'function') {
        window.stateManager.saveDailyPlan(currentDailyPlan);
        updateArchiveBadgeCount();
        await syncDailyPlanToDocumentsStorage(currentDailyPlan);
      }

      if (toastCallbackFn) toastCallbackFn('Plan başarıyla revize edildi!', 'success');
    } catch (e) {
      console.error('Revizyon hatası:', e);
      if (toastCallbackFn) toastCallbackFn('Revizyon uygulanırken hata oluştu.', 'danger');
    } finally {
      setGeneratingState(false);
    }
  }

  // Mod Değiştir (Oluştur / Arşiv)
  function switchViewMode(mode) {
    activeViewMode = mode;
    dom = getDOM();

    if (dom.btnModeCreate) dom.btnModeCreate.classList.toggle('active', mode === 'create');
    if (dom.btnModeArchive) dom.btnModeArchive.classList.toggle('active', mode === 'archive');

    if (dom.sectionCreate) dom.sectionCreate.style.display = mode === 'create' ? 'grid' : 'none';
    if (dom.sectionArchive) dom.sectionArchive.style.display = mode === 'archive' ? 'block' : 'none';

    if (mode === 'archive') {
      renderArchiveList();
    } else {
      populateCoursesFromSchedule();
      syncCourseAndYearlyPlan();
    }

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Arşiv Listesini Render Et
  function renderArchiveList() {
    dom = getDOM();
    if (!dom.archiveListContainer) return;

    const state = window.stateManager ? window.stateManager.loadState() : {};
    const plans = state.dailyPlans || [];

    const searchQuery = dom.archiveSearch ? dom.archiveSearch.value.trim().toLowerCase() : '';
    const courseFilter = dom.archiveCourseFilter ? dom.archiveCourseFilter.value : '';

    const filtered = plans.filter(p => {
      if (courseFilter && p.courseName !== courseFilter) return false;
      if (!searchQuery) return true;
      const combined = `${p.courseName} ${p.topic} ${p.unitName} ${p.weekLabel} ${p.className}`.toLowerCase();
      return combined.includes(searchQuery);
    });

    // Kurs filtre seçeneklerini güncelle
    if (dom.archiveCourseFilter) {
      const courses = Array.from(new Set(plans.map(p => p.courseName))).filter(Boolean);
      const cur = dom.archiveCourseFilter.value;
      dom.archiveCourseFilter.innerHTML = `
        <option value="">Tüm Dersler (${plans.length})</option>
        ${courses.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
      `;
      if (cur) dom.archiveCourseFilter.value = cur;
    }

    if (filtered.length === 0) {
      dom.archiveListContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          <i data-lucide="folder-search" style="width: 44px; height: 44px; color: var(--text-muted); margin-bottom: 0.75rem; opacity: 0.6;"></i>
          <h4 style="margin: 0 0 0.4rem 0; font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">Kayıtlı Plan Bulunamadı</h4>
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">
            ${plans.length === 0 ? 'Henüz kaydedilmiş bir haftalık planınız yok. Yeni bir plan oluşturup kaydedebilirsiniz.' : 'Arama kriterlerinize uyan bir plan bulunamadı.'}
          </p>
        </div>
      `;
      if (window.safeCreateIcons) window.safeCreateIcons();
      return;
    }

    let html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem;">
    `;

    filtered.forEach(p => {
      html += `
        <div class="glass-card daily-archive-item-card" style="padding: 1rem 1.25rem; border-radius: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem; transition: transform 0.2s, box-shadow 0.2s;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.4rem;">
              <span class="badge" style="background: rgba(99,102,241,0.12); color: var(--primary); font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px;">
                ${escapeHtml(p.className || '')} • ${escapeHtml(p.courseName || '')}
              </span>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">
                ${escapeHtml(p.weekLabel || formatTurkishDate(p.date) || '')}
              </span>
            </div>
            
            <h4 style="margin: 0 0 0.25rem 0; font-size: 0.98rem; font-weight: 700; color: var(--text-primary); line-height: 1.35;">
              ${escapeHtml(p.topic || 'Haftalık Ders Planı')}
            </h4>
            <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.35;">
              ${escapeHtml(p.unitName || '')}
            </div>
            <div style="margin-top: 0.4rem; font-size: 0.72rem; color: var(--text-muted);">
              ⏱️ ${escapeHtml(p.lessonHours || 'Haftalık')}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.6rem;">
            <button type="button" class="btn btn-secondary btn-sm btn-archive-load" data-id="${p.id}" style="font-size: 0.78rem; padding: 0.25rem 0.65rem;">
              <i data-lucide="eye" style="width: 13px; height: 13px;"></i> İncele & Düzenle
            </button>
            <div style="display: flex; gap: 0.35rem;">
              <button type="button" class="btn btn-secondary btn-sm btn-archive-print" data-id="${p.id}" title="Yazdır" style="padding: 0.25rem 0.5rem;">
                <i data-lucide="printer" style="width: 13px; height: 13px;"></i>
              </button>
              <button type="button" class="btn btn-danger btn-sm btn-archive-delete" data-id="${p.id}" title="Sil" style="padding: 0.25rem 0.5rem;">
                <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    dom.archiveListContainer.innerHTML = html;

    // Buton dinleyicileri
    dom.archiveListContainer.querySelectorAll('.btn-archive-load').forEach(btn => {
      btn.addEventListener('click', () => loadPlanFromArchive(btn.getAttribute('data-id'), false));
    });
    dom.archiveListContainer.querySelectorAll('.btn-archive-print').forEach(btn => {
      btn.addEventListener('click', () => loadPlanFromArchive(btn.getAttribute('data-id'), true));
    });
    dom.archiveListContainer.querySelectorAll('.btn-archive-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Bu haftalık ders planını silmek istediğinize emin misiniz?')) {
          if (window.stateManager && typeof window.stateManager.deleteDailyPlan === 'function') {
            window.stateManager.deleteDailyPlan(id);

            // Kişisel Evrak Deposu ile senkronize sil
            if (window.stateManager.state && Array.isArray(window.stateManager.state.documents)) {
              window.stateManager.state.documents = window.stateManager.state.documents.filter(d => d.id !== ('doc_' + id) && d.dailyPlanId !== id);
              window.stateManager.saveState();
            }
            if (typeof window.deleteDocumentFileFromIndexedDB === 'function') {
              window.deleteDocumentFileFromIndexedDB('doc_' + id);
            }

            if (currentDailyPlan && currentDailyPlan.id === id) {
              currentDailyPlan = null;
              renderWeeklyPlanSheet(null);
            }
            updateArchiveBadgeCount();
            renderArchiveList();
            if (toastCallbackFn) toastCallbackFn('Plan silindi.', 'info');
          }
        }
      });
    });

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Arşivden Plan Yükle
  function loadPlanFromArchive(planId, printDirectly = false) {
    if (!window.stateManager || typeof window.stateManager.getDailyPlanById !== 'function') return;
    const plan = window.stateManager.getDailyPlanById(planId);
    if (!plan) return;

    currentDailyPlan = plan;

    switchViewMode('create');
    renderWeeklyPlanSheet(currentDailyPlan);

    dom = getDOM();
    if (dom.selectGrade && plan.gradeLevel) dom.selectGrade.value = plan.gradeLevel;
    if (dom.inputClass) dom.inputClass.value = plan.className || '';
    if (dom.inputTeacher && plan.teacherName) dom.inputTeacher.value = plan.teacherName;
    if (dom.inputPrincipal && plan.principalName) dom.inputPrincipal.value = plan.principalName;
    updateCurriculumModelBadge();
    if (dom.selectCourse) dom.selectCourse.value = plan.courseName || '';
    if (dom.inputUnit) dom.inputUnit.value = plan.unitName || '';
    if (dom.inputTopic) dom.inputTopic.value = plan.topic || '';
    if (dom.inputOutcomes) dom.inputOutcomes.value = plan.learningOutcomes || '';
    if (dom.inputHours) {
      const hMatch = (plan.lessonHours || '').match(/^(\d+)/);
      if (hMatch) dom.inputHours.value = hMatch[1];
    }
    if (dom.selectWeek && plan.weekId) {
      dom.selectWeek.value = plan.weekId;
      currentSelectedWeekId = plan.weekId;
      onWeekSelectionChanged();
    }

    if (printDirectly) {
      setTimeout(() => printCurrentDailyPlan(), 200);
    }
  }

  function updateArchiveBadgeCount() {
    dom = getDOM();
    if (!dom.badgeArchiveCount) return;
    const state = window.stateManager ? window.stateManager.loadState() : {};
    const count = (state.dailyPlans || []).length;
    dom.badgeArchiveCount.textContent = count;
    dom.badgeArchiveCount.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  // Yardımcı Fonksiyonlar
  function splitOutcomesText(outcomesData) {
    if (!outcomesData) return [];
    if (Array.isArray(outcomesData)) {
      return outcomesData.map(o => String(o).trim()).filter(Boolean);
    }
    const str = String(outcomesData);
    // Yeni satırlar, noktalı virgül veya madde imlerine göre böl
    const lines = str.split(/\n+|;|(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9][.)-])/);
    const result = [];
    lines.forEach(l => {
      const clean = l.replace(/^[-•*–\d.)\s]+/, '').trim();
      // Tarih veya anlamsız kısa dizgileri filtrele
      if (clean && clean.length > 5 && !clean.match(/^\d{1,2}[./-]\d{1,2}/)) {
        result.push(clean);
      }
    });
    return result.length > 0 ? result : [str.trim()];
  }

  function parseAIJsonResponse(rawText) {
    if (!rawText) return {};
    let text = rawText.trim();
    if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');

    try {
      return JSON.parse(text);
    } catch (e) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e2) {}
      }
    }

    // Fallback: Temel alanları metinden oluştur
    return {
      methods: "Soru-cevap, grup çalışması, problem çözme",
      materials: "Ders kitabı, akıllı tahta, çalışma kağıdı",
      concepts: "Temel kavramlar",
      introduction: "Derse öğrencilerin ilgisini çekecek güncel bir soru ve kısa bir hikaye ile başlanır.",
      development: "Öğrencilerle birlikte haftanın temel etkinlikleri adım adım uygulanır.",
      conclusion: "Haftanın özeti yapılır, temel öğrenmeler değerlendirilir.",
      assessment: "Süreç değerlendirme soruları ve öğrenci paylaşımları.",
      differentiation: "İhtiyacı olan öğrencilere ek rehberlik sağlanır.",
      homework: "Pekiştirici mini uygulama görevi."
    };
  }

  function formatISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatTurkishDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatRichParagraphs(text) {
    if (!text) return '';
    return escapeHtml(String(text))
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  function escapeHtml(string) {
    if (!string) return '';
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Genel pencereye dışa aktar
  window.setupDailyPlansTool = setupDailyPlansTool;
  window.openDailyPlanView = openDailyPlanView;
  window.loadDailyPlanById = loadPlanFromArchive;

})();
