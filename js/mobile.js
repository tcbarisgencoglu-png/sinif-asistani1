/**
 * SINIF ASİSTANI — MOBİL UYGULAMA KONTROLCÜSÜ (MOBILE.JS)
 * Tek elle kullanıma, hızlı aksiyona ve dokunmatik jestlere özel mobil motor.
 */

(() => {
  'use strict';

  // Global State ve Değişkenler
  let currentTab = 'performance';
  let activeBranch = 'all';
  let activeSearchTerm = '';
  let selectedStudentForPoints = null;
  let hwWalkIndex = 0;
  let hwMode = 'walk'; // 'walk' veya 'list'
  let currentHwDate = getTodayDateStr();
  let attendanceData = {}; // Tarihe göre geçici yoklama durumu
  let timerInterval = null;
  // Haptic desteği kontrolü (Android Native + Web API)
  window.vibrate = (ms = 35) => {
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === 'function') {
        window.AndroidBridge.vibrate(ms);
        return;
      }
      if (navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(ms);
      }
    } catch (e) {}
  };

  function getTodayDateStr() {
    if (typeof window.formatLocalDate === 'function') {
      return window.formatLocalDate();
    }
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getStudentByIdSafe(studentId) {
    if (!studentId && studentId !== 0) return null;
    if (window.stateManager && typeof window.stateManager.getStudentById === 'function') {
      return window.stateManager.getStudentById(studentId);
    }
    if (window.stateManager && typeof window.stateManager.getStudents === 'function') {
      const all = window.stateManager.getStudents(true);
      return all.find(s => String(s.id) === String(studentId)) || null;
    }
    return null;
  }

  function isMiddleSchool() {
    if (!window.stateManager || !window.stateManager.state) return false;
    const lvl = (typeof window.stateManager.getEducationLevel === 'function')
      ? window.stateManager.getEducationLevel()
      : (window.stateManager.state.educationLevel || window.stateManager.state.gradeLevel || 'middle');
    return lvl === 'middle';
  }

  function isStudentInCurrentLevel(s) {
    if (!s) return false;
    const isMiddle = isMiddleSchool();
    const isMiddleStudent = s.schoolLevel === 'middle' || 
      (s.schoolLevel !== 'primary' && s.branch && (['5', '6', '7', '8'].includes(s.branch.trim()[0]) || s.branch.trim().length > 0));
    return isMiddle ? isMiddleStudent : !isMiddleStudent;
  }

  function formatStudentSubtitle(st) {
    const isMiddle = isMiddleSchool();
    const no = escapeHTML(st.number || '-');
    if (isMiddle && st.branch) {
      return `No: ${no} • ${escapeHTML(st.branch)}`;
    }
    return `No: ${no}`;
  }

  function syncEducationLevelUI() {
    const isMiddle = isMiddleSchool();

    // 1. Üst Bar Şube Rozeti (#appbar-branch-text)
    const appbarBranchBadge = document.getElementById('appbar-branch-text');
    if (appbarBranchBadge) {
      appbarBranchBadge.style.display = isMiddle ? 'inline-block' : 'none';
      if (isMiddle) {
        appbarBranchBadge.textContent = (activeBranch === 'all') ? 'Tüm Sınıf' : `${activeBranch} Şubesi`;
      }
    }

    // 2. Filtre Barındaki Şube Seçici Dropdown (#m-branch-select)
    const branchSelect = document.getElementById('m-branch-select');
    if (branchSelect) {
      branchSelect.style.display = isMiddle ? 'inline-block' : 'none';
    }
    if (!isMiddle) {
      activeBranch = 'all';
    }

    // 3. Konfigürasyon: Yeni Öğrenci Ekleme Şube Alanı (#m-cfg-st-branch-group)
    const stBranchGroup = document.getElementById('m-cfg-st-branch-group');
    const stNoBranchRow = document.getElementById('m-cfg-st-no-branch-row');
    if (stBranchGroup) {
      stBranchGroup.style.display = isMiddle ? 'block' : 'none';
    }
    if (stNoBranchRow) {
      stNoBranchRow.style.gridTemplateColumns = isMiddle ? '1fr 1fr' : '1fr';
    }

    // 4. Konfigürasyon: Kayıtlı Öğrenciler Şube Filtresi (#m-cfg-st-branch-filter)
    const stBranchFilter = document.getElementById('m-cfg-st-branch-filter');
    if (stBranchFilter) {
      stBranchFilter.style.display = isMiddle ? 'inline-block' : 'none';
      if (!isMiddle) stBranchFilter.value = 'all';
    }

    // 5. Öğrenci Düzenleme Modalı Şube Alanı (#m-edit-st-branch-group)
    const editBranchGroup = document.getElementById('m-edit-st-branch-group');
    const editNoBranchRow = document.getElementById('m-edit-st-no-branch-row');
    if (editBranchGroup) {
      editBranchGroup.style.display = isMiddle ? 'block' : 'none';
    }
    if (editNoBranchRow) {
      editNoBranchRow.style.gridTemplateColumns = isMiddle ? '1fr 1fr' : '1fr';
    }

    // 6. AI Öğrenci Önizleme Modalı Şube Seçimi (#m-ai-branch-container)
    const aiBranchContainer = document.getElementById('m-ai-branch-container');
    if (aiBranchContainer) {
      aiBranchContainer.style.display = isMiddle ? 'flex' : 'none';
    }
  }

  window.handleLevelChange = (newLevel) => {
    if (window.stateManager) {
      if (typeof window.stateManager.setEducationLevel === 'function') {
        window.stateManager.setEducationLevel(newLevel);
      } else {
        window.stateManager.state.educationLevel = newLevel;
        window.stateManager.state.gradeLevel = newLevel;
      }
      window.stateManager.saveState();
    }
    syncEducationLevelUI();
    renderConfigStudentsList();
    renderActiveTab();
    window.vibrate(20);
    const isMiddle = (newLevel === 'middle');
    showMobileToast(isMiddle ? '🏫 Ortaokul modu seçildi (Şubeler aktif)' : '🎒 İlkokul modu seçildi (Şube özelliği kaldırıldı)');
  };

  // DOM Yüklendiğinde Başlat
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });

  function initApp() {
    // Lucide ikonlarını güvenle render et
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Kademe arayüzünü senkronize et (İlkokul / Ortaokul)
    syncEducationLevelUI();

    // Haftayı otomatik kontrol et (Pazartesi otomatik geçiş tetiklemesi)
    if (window.stateManager && typeof window.stateManager.getSelectedWeek === 'function') {
      window.stateManager.getSelectedWeek();
    }

    // Alt Navigasyon Butonlarını Dinle
    const navButtons = document.querySelectorAll('.nav-item-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });

    // Arama Kutusu
    const searchInput = document.getElementById('m-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        activeSearchTerm = e.target.value.trim().toLowerCase();
        renderActiveTab();
      });
    }

    // Şube Seçici
    const branchSelect = document.getElementById('m-branch-select');
    if (branchSelect) {
      populateBranchOptions(branchSelect);
      branchSelect.addEventListener('change', (e) => {
        activeBranch = e.target.value;
        const badge = document.getElementById('appbar-branch-text');
        if (badge) {
          badge.textContent = activeBranch === 'all' ? 'Tüm Sınıf' : activeBranch;
        }
        renderActiveTab();
      });
    }

    // Ödev Tarih Navigasyonu
    const btnHwPrevDay = document.getElementById('btn-hw-prev-day');
    const btnHwNextDay = document.getElementById('btn-hw-next-day');
    const btnHwTodayJump = document.getElementById('btn-hw-today-jump');

    if (btnHwPrevDay) {
      btnHwPrevDay.addEventListener('click', () => {
        changeHwDate(-1);
      });
    }
    if (btnHwNextDay) {
      btnHwNextDay.addEventListener('click', () => {
        changeHwDate(1);
      });
    }
    if (btnHwTodayJump) {
      btnHwTodayJump.addEventListener('click', () => {
        currentHwDate = getTodayDateStr();
        window.vibrate(25);
        renderHomeworkTab();
      });
    }

    // Ödev Mod Değiştiricileri
    const btnHwModeWalk = document.getElementById('btn-hw-mode-walk');
    const btnHwModeList = document.getElementById('btn-hw-mode-list');
    if (btnHwModeWalk) {
      btnHwModeWalk.addEventListener('click', () => {
        hwMode = 'walk';
        btnHwModeWalk.classList.add('active');
        if (btnHwModeList) btnHwModeList.classList.remove('active');
        renderHomeworkTab();
      });
    }
    if (btnHwModeList) {
      btnHwModeList.addEventListener('click', () => {
        hwMode = 'list';
        currentHwDate = getTodayDateStr(); // Her girişte içinde bulunulan günün listesi
        btnHwModeList.classList.add('active');
        if (btnHwModeWalk) btnHwModeWalk.classList.remove('active');
        renderHomeworkTab();
      });
    }

    // Canlı Ders Bilgisini Güncelle
    updateLiveLessonCard();
    setInterval(updateLiveLessonCard, 30000); // 30 saniyede bir güncelle

    // URL Parametresi Kontrolü (?tab=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const initialTab = urlParams.get('tab');
      if (initialTab) {
        currentTab = initialTab;
      }
    } catch (e) {}

    // İlk Ekranı Çiz
    switchTab(currentTab);

    // Dışarı tıklandığında yüzen menüleri kapat
    document.addEventListener('click', (e) => {
      const booksFab = document.getElementById('m-books-fab-container');
      const booksToggle = e.target.closest('[onclick*="toggleBooksFabMenu"]');
      if (booksFab && !booksFab.contains(e.target) && !booksToggle) {
        const menu = document.getElementById('m-books-fab-menu');
        const btn = document.getElementById('m-books-fab-btn');
        if (menu && menu.classList.contains('show')) {
          menu.classList.remove('show');
          if (btn) btn.classList.remove('active');
        }
      }

      const cfgFab = document.getElementById('m-config-fab-container');
      const cfgToggle = e.target.closest('[onclick*="toggleConfigFabMenu"]');
      if (cfgFab && !cfgFab.contains(e.target) && !cfgToggle) {
        const menu = document.getElementById('m-config-fab-menu');
        const btn = document.getElementById('m-config-fab-btn');
        if (menu && menu.classList.contains('show')) {
          menu.classList.remove('show');
          if (btn) btn.classList.remove('active');
        }
      }

      const schedFab = document.getElementById('m-sched-fab-container');
      const schedToggle = e.target.closest('[onclick*="toggleScheduleFabMenu"]');
      if (schedFab && !schedFab.contains(e.target) && !schedToggle) {
        const menu = document.getElementById('m-sched-fab-menu');
        const btn = document.getElementById('m-sched-fab-btn');
        if (menu && menu.classList.contains('show')) {
          menu.classList.remove('show');
          if (btn) btn.classList.remove('active');
        }
      }
    });
  }

  // ==========================================================================
  // SEKME YÖNETİMİ
  // ==========================================================================
  function switchTab(tabId) {
    currentTab = tabId;

    // Aktif olan tüm alt ekranları (subviews), modalları ve çekmeceleri kapat
    if (typeof activeMobileSubview !== 'undefined') {
      activeMobileSubview = null;
    }
    document.querySelectorAll('.mobile-subview').forEach(v => v.classList.remove('active'));
    if (typeof window.closeBottomSheet === 'function') {
      window.closeBottomSheet();
    }
    if (typeof window.closeConfigDrawer === 'function') {
      window.closeConfigDrawer();
    }
    if (typeof window.backToGamesLanding === 'function') {
      window.backToGamesLanding();
    }
    document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('active'));
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    const fabMenu = document.getElementById('m-books-fab-menu');
    const fabBtn = document.getElementById('m-books-fab-btn');
    if (fabMenu) fabMenu.classList.remove('show');
    if (fabBtn) fabBtn.classList.remove('active');

    if (tabId === 'homework') {
      // Ödev menüsüne her girişte içinde bulunulan günün listesi açılacak
      currentHwDate = getTodayDateStr();
    }

    // Alt menü butonlarını güncelle
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Sekme panellerini güncelle
    document.querySelectorAll('.tab-pane').forEach(pane => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    window.vibrate(25);
    renderActiveTab();
  }
  window.switchTab = switchTab;

  function renderActiveTab() {
    switch (currentTab) {
      case 'performance':
        renderPerformanceTab();
        break;
      case 'homework':
        renderHomeworkTab();
        break;
      case 'books':
        renderBooksTab();
        break;
      case 'attendance':
        renderAttendanceTab();
        break;
      case 'more':
        renderMoreTab();
        break;
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ==========================================================================
  // CANLI DERS KARTI VE HAFTALIK KAZANIM YÖNETİMİ (MASAÜSTÜ PARİTESİ)
  // ==========================================================================
  window._currentLiveLessonInfo = null;

  function parseMobileTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function normalizeMobileLessonName(text) {
    if (!text) return '';
    try {
      let textStr = String(text)
        .toLocaleLowerCase('tr')
        .replace(/\b\d+([.\-/]sınıf|\s+sınıf|[.\-/][a-z])?\b/gi, '')
        .replace(/\b\d+\b/g, '')
        .replace(/[^a-z0-9ışğçöü]/gi, '')
        .trim();

      if (textStr.includes('fenbilimleri') || textStr.includes('fenbilgisi') || textStr.includes('fenbilgi') || textStr.includes('fenve') || textStr === 'fen') return 'fenbilimleri';
      if (textStr.includes('bedenegitimi') || textStr.includes('beden') || textStr.includes('sporegitimi')) return 'bedenegitimi';
      if (textStr.includes('gorselsanatlar') || textStr.includes('resim') || textStr.includes('gorsel')) return 'gorselsanatlar';
      if (textStr.includes('dinkulturu') || textStr.includes('dinkulturuveahlakbilgisi') || textStr === 'din') return 'dinkulturu';
      if (textStr.includes('turkce') || textStr.includes('turkdiliveedebiyati')) return 'turkce';
      if (textStr.includes('hayatbilgisi') || textStr.includes('hayat')) return 'hayatbilgisi';
      if (textStr.includes('sosyalbilgiler') || textStr.includes('sosyal')) return 'sosyalbilgiler';
      if (textStr.includes('ingilizce') || textStr === 'ing') return 'ingilizce';
      if (textStr.includes('matematik') || textStr === 'mat') return 'matematik';
      if (textStr.includes('muzik') || textStr === 'muz') return 'muzik';
      if (textStr.includes('bilisim') || textStr.includes('bilgisayar') || textStr.includes('yazilim')) return 'bilisim';
      return textStr;
    } catch (e) {
      return '';
    }
  }

  function isMobileLessonPlanMatch(planName, lessonName) {
    if (!planName || !lessonName) return false;
    const pStr = String(planName).toLocaleLowerCase('tr').trim();
    const lStr = String(lessonName).toLocaleLowerCase('tr').trim();

    if (pStr.includes(lStr) || lStr.includes(pStr)) return true;

    const normPlan = normalizeMobileLessonName(planName);
    const normLesson = normalizeMobileLessonName(lessonName);
    if (normPlan && normLesson) {
      if (normPlan.includes(normLesson) || normLesson.includes(normPlan)) return true;
    }

    const pWords = pStr.split(/[\s\-_\/,\.]+/).filter(w => w.length >= 3);
    const lWords = lStr.split(/[\s\-_\/,\.]+/).filter(w => w.length >= 3);
    const commonWords = pWords.filter(w => lWords.includes(w));
    return commonWords.length > 0;
  }

  function getMobileActiveWeekIndex(weeklySchedule) {
    if (!weeklySchedule || weeklySchedule.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayM = today.getMonth();
    const todayD = today.getDate();

    const parseFlexibleDate = (dateVal) => {
      if (!dateVal) return null;
      if (dateVal instanceof Date && !isNaN(dateVal.getTime())) return dateVal;
      if (typeof dateVal === 'string') {
        const str = dateVal.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          const parts = str.split('T')[0].split('-');
          return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
        if (/^\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4}/.test(str)) {
          const parts = str.split(/[\.\/\-]/);
          return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
        if (/^\d{1,2}[\.\/\-]\d{1,2}$/.test(str)) {
          const parts = str.split(/[\.\/\-]/);
          return new Date(today.getFullYear(), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) return parsed;
      }
      return null;
    };

    // 0. Seviye: stateManager getSelectedWeek
    if (typeof window.stateManager !== 'undefined' && window.stateManager.getSelectedWeek) {
      const selectedIso = window.stateManager.getSelectedWeek();
      if (selectedIso) {
        for (let i = 0; i < weeklySchedule.length; i++) {
          if (weeklySchedule[i].isoWeek === selectedIso) return i;
        }
        if (typeof window.getEducationWeekInfo === 'function') {
          const eduInfo = window.getEducationWeekInfo(selectedIso);
          if (eduInfo && eduInfo.academicWeekNo) {
            const targetNo = eduInfo.academicWeekNo;
            for (let i = 0; i < weeklySchedule.length; i++) {
              const w = weeklySchedule[i];
              if (w.weekNumber === targetNo || w.week === targetNo || w.weekNo === targetNo || (i + 1) === targetNo) {
                return i;
              }
            }
          }
        }
      }
    }

    // 1. Seviye: startDate - endDate
    for (let i = 0; i < weeklySchedule.length; i++) {
      const week = weeklySchedule[i];
      if (week.startDate && week.endDate) {
        const sDate = parseFlexibleDate(week.startDate);
        const eDate = parseFlexibleDate(week.endDate);
        if (sDate && eDate) {
          sDate.setHours(0, 0, 0, 0);
          eDate.setHours(23, 59, 59, 999);
          const eDateExt = new Date(eDate.getTime());
          eDateExt.setDate(eDateExt.getDate() + 2);
          if (today >= sDate && today <= eDateExt) return i;

          if (sDate.getMonth() === eDate.getMonth() && todayM === sDate.getMonth()) {
            if (todayD >= sDate.getDate() && todayD <= eDate.getDate() + 2) return i;
          }
        }
      }
    }

    // 2. Seviye: dateRange metninden Türkçe ay ve gün kontrolü
    const TURKISH_MONTH_MAP = {
      'ocak': 0, 'şubat': 1, 'subat': 1, 'mart': 2, 'nisan': 3,
      'mayıs': 4, 'mayis': 4, 'haziran': 5, 'temmuz': 6,
      'ağustos': 7, 'agustos': 7, 'eylül': 8, 'eylul': 8,
      'ekim': 9, 'kasım': 10, 'kasim': 10, 'aralık': 11, 'aralik': 11
    };

    for (let i = 0; i < weeklySchedule.length; i++) {
      const week = weeklySchedule[i];
      const rawText = `${week.dateRange || ''} ${week.month || ''}`.toLocaleLowerCase('tr');
      if (!rawText.trim()) continue;

      let matchedMonthIdx = -1;
      for (const [mName, mIdx] of Object.entries(TURKISH_MONTH_MAP)) {
        if (rawText.includes(mName)) {
          matchedMonthIdx = mIdx;
          break;
        }
      }

      if (matchedMonthIdx === todayM) {
        const numMatches = rawText.match(/\b\d{1,2}\b/g);
        if (numMatches && numMatches.length >= 1) {
          const startDay = parseInt(numMatches[0], 10);
          const endDay = numMatches.length >= 2 ? parseInt(numMatches[1], 10) + 2 : startDay + 6;
          if (todayD >= startDay && todayD <= endDay) return i;
        }
      }
    }

    // 3. Seviye: ISO week
    const currentISO = window.getISOWeek ? window.getISOWeek(today) : '';
    if (currentISO) {
      for (let i = 0; i < weeklySchedule.length; i++) {
        if (weeklySchedule[i].isoWeek === currentISO) return i;
      }
    }

    // 4. Seviye: İlk tamamlanmamış hafta
    for (let i = 0; i < weeklySchedule.length; i++) {
      if (!weeklySchedule[i].isHoliday && !weeklySchedule[i].isCompleted && !weeklySchedule[i].completed) {
        return i;
      }
    }

    return 0;
  }

  function extractMobileWeekTopic(activeWeek) {
    if (!activeWeek) return '';
    if (activeWeek.isHoliday) return `Tatil: ${activeWeek.dateRange || ''}`;

    if (activeWeek.topics) {
      if (Array.isArray(activeWeek.topics) && activeWeek.topics.length > 0) {
        return activeWeek.topics.join(', ');
      } else if (typeof activeWeek.topics === 'string' && activeWeek.topics.trim()) {
        return activeWeek.topics.trim();
      }
    }
    if (activeWeek.topic && typeof activeWeek.topic === 'string' && activeWeek.topic.trim()) {
      return activeWeek.topic.trim();
    }
    if (activeWeek.unitName && String(activeWeek.unitName).trim()) {
      const uNo = activeWeek.unitNo ? `${activeWeek.unitNo}. Ünite: ` : '';
      return `${uNo}${String(activeWeek.unitName).trim()}`;
    }
    if (activeWeek.learningOutcomes) {
      if (Array.isArray(activeWeek.learningOutcomes) && activeWeek.learningOutcomes.length > 0) {
        return activeWeek.learningOutcomes[0];
      } else if (typeof activeWeek.learningOutcomes === 'string' && activeWeek.learningOutcomes.trim()) {
        return activeWeek.learningOutcomes.trim();
      }
    }
    return 'Ders konusu planda belirtilmemiş.';
  }

  function extractMobileWeekOutcomes(activeWeek) {
    if (!activeWeek) return [];
    let outcomes = [];

    if (activeWeek.learningOutcomes) {
      if (Array.isArray(activeWeek.learningOutcomes)) {
        outcomes = activeWeek.learningOutcomes.map(o => String(o || '').trim()).filter(Boolean);
      } else if (typeof activeWeek.learningOutcomes === 'string') {
        outcomes = activeWeek.learningOutcomes.split(/\r?\n|;/).map(o => o.trim()).filter(Boolean);
      }
    }

    if (outcomes.length === 0 && activeWeek.outcomes) {
      if (Array.isArray(activeWeek.outcomes)) {
        outcomes = activeWeek.outcomes.map(o => String(o || '').trim()).filter(Boolean);
      } else if (typeof activeWeek.outcomes === 'string') {
        outcomes = activeWeek.outcomes.split(/\r?\n|;/).map(o => o.trim()).filter(Boolean);
      }
    }

    if (outcomes.length === 0 && activeWeek.topics) {
      if (Array.isArray(activeWeek.topics)) {
        outcomes = activeWeek.topics.map(t => String(t || '').trim()).filter(Boolean);
      } else if (typeof activeWeek.topics === 'string') {
        outcomes = activeWeek.topics.split(/\r?\n|;/).map(t => t.trim()).filter(Boolean);
      }
    }

    if (outcomes.length === 0 && activeWeek.topic) {
      outcomes = [String(activeWeek.topic).trim()];
    }

    return outcomes;
  }

  function getCurrentMobileLessonInfo() {
    const state = (window.stateManager && typeof window.stateManager.loadState === 'function')
      ? window.stateManager.loadState()
      : (window.stateManager?.state || {});

    const times = state.scheduleTimes || {};
    const grid = state.scheduleGrid || {};
    const lessons = state.definedLessons || [];
    const plans = state.plans || [];

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0: Pazar, 1: Pazartesi, ..., 6: Cumartesi
    const daysOfWeekEnums = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const dayName = daysOfWeekEnums[dayOfWeek] || '';

    const curTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const curMin = parseMobileTimeToMinutes(curTimeStr);

    const isMiddle = state.educationLevel === 'middle';
    const pKeys = isMiddle 
      ? ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']
      : ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

    let periodNum = '';
    let lessonName = '';
    let lessonColor = '';
    let statusType = 'outside'; // 'lesson', 'break', 'lunch', 'outside'
    let lessonTopic = 'Konu bilgisi bulunamadı veya ders boş.';
    let remainingMinutes = null;
    let remainingPercent = null;
    let remainingText = '';
    let matchedPlan = null;
    let activeWeek = null;
    let weekIndex = null;
    let isCompleted = false;
    let canComplete = false;

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // 1. Ders saati içinde mi?
      let resolvedPeriod = null;
      let resolvedStartMin = 0;
      let resolvedEndMin = 0;

      for (let i = 0; i < pKeys.length; i++) {
        const pk = pKeys[i];
        const pData = times[pk];
        if (pData && pData.start && pData.end) {
          const pStart = parseMobileTimeToMinutes(pData.start);
          const pEnd = parseMobileTimeToMinutes(pData.end);
          if (curMin >= pStart && curMin <= pEnd) {
            resolvedPeriod = pk;
            resolvedStartMin = pStart;
            resolvedEndMin = pEnd;
            break;
          }
        }
      }

      if (resolvedPeriod) {
        statusType = 'lesson';
        periodNum = `${resolvedPeriod.replace('p', '')}. Ders`;
        const totalDuration = Math.max(1, resolvedEndMin - resolvedStartMin);
        remainingMinutes = Math.max(0, resolvedEndMin - curMin);
        remainingPercent = Math.max(0, Math.min(100, Math.round((remainingMinutes / totalDuration) * 100)));
        remainingText = remainingMinutes === 0 ? '< 1 dk' : `${remainingMinutes} dk kaldı`;

        const gridKey = `${dayOfWeek}-${resolvedPeriod}`;
        const lessonId = grid[gridKey] || '';
        const lesson = lessons.find(l => l.id === lessonId);

        if (lesson) {
          lessonName = lesson.name;
          lessonColor = lesson.color || '';

          // Yıllık plan eşleştir
          matchedPlan = plans.find(p => p && isMobileLessonPlanMatch(p.courseName || p.title, lesson.name));
          if (matchedPlan) {
            const schedule = matchedPlan.weeklySchedule || matchedPlan.weeks || [];
            weekIndex = getMobileActiveWeekIndex(schedule);
            activeWeek = schedule[weekIndex];

            if (activeWeek) {
              canComplete = !activeWeek.isHoliday;
              isCompleted = !!(activeWeek.isCompleted || activeWeek.completed);
              lessonTopic = extractMobileWeekTopic(activeWeek);
            } else {
              lessonTopic = 'Bu hafta için plan konusu girilmemiş.';
            }
          } else {
            lessonTopic = 'Bu ders için yıllık plan yüklenmemiş.';
          }
        } else {
          lessonName = 'Boş Ders';
          lessonTopic = 'Boş ders saati.';
        }
      } else {
        // 2. Öğle arası kontrolü
        const lunchData = times['lunch'];
        let isLunch = false;
        let lunchStartMin = 0;
        let lunchEndMin = 0;
        if (lunchData && lunchData.start && lunchData.end) {
          const lStart = parseMobileTimeToMinutes(lunchData.start);
          const lEnd = parseMobileTimeToMinutes(lunchData.end);
          if (curMin >= lStart && curMin <= lEnd) {
            isLunch = true;
            lunchStartMin = lStart;
            lunchEndMin = lEnd;
          }
        }

        if (isLunch) {
          statusType = 'lunch';
          periodNum = 'Öğle Arası';
          lessonName = 'Öğle Yemeği / Dinlenme 🍽️';
          lessonTopic = 'Yemek ve dinlenme zamanı.';
          const totalDuration = Math.max(1, lunchEndMin - lunchStartMin);
          remainingMinutes = Math.max(0, lunchEndMin - curMin);
          remainingPercent = Math.max(0, Math.min(100, Math.round((remainingMinutes / totalDuration) * 100)));
          remainingText = remainingMinutes === 0 ? '< 1 dk' : `${remainingMinutes} dk kaldı`;
        } else {
          // 3. Teneffüs kontrolü
          let breakNextPeriod = null;
          let breakStartMin = 0;
          let breakEndMin = 0;
          for (let i = 0; i < pKeys.length - 1; i++) {
            const currentPKey = pKeys[i];
            const nextPKey = pKeys[i + 1];
            const currentEnd = times[currentPKey] ? parseMobileTimeToMinutes(times[currentPKey].end) : 0;
            const nextStart = times[nextPKey] ? parseMobileTimeToMinutes(times[nextPKey].start) : 0;

            if (currentEnd && nextStart && curMin > currentEnd && curMin < nextStart) {
              breakNextPeriod = nextPKey;
              breakStartMin = currentEnd;
              breakEndMin = nextStart;
              break;
            }
          }

          if (breakNextPeriod) {
            statusType = 'break';
            periodNum = 'Teneffüs';
            const totalDuration = Math.max(1, breakEndMin - breakStartMin);
            remainingMinutes = Math.max(0, breakEndMin - curMin);
            remainingPercent = Math.max(0, Math.min(100, Math.round((remainingMinutes / totalDuration) * 100)));
            remainingText = remainingMinutes === 0 ? '< 1 dk' : `${remainingMinutes} dk kaldı`;

            const gridKey = `${dayOfWeek}-${breakNextPeriod}`;
            const nextLessonId = grid[gridKey] || '';
            const nextLesson = lessons.find(l => l.id === nextLessonId);
            if (nextLesson) {
              lessonName = `Sıradaki: ${nextLesson.name}`;
              lessonColor = nextLesson.color || '';

              matchedPlan = plans.find(p => p && isMobileLessonPlanMatch(p.courseName || p.title, nextLesson.name));
              if (matchedPlan) {
                const schedule = matchedPlan.weeklySchedule || matchedPlan.weeks || [];
                weekIndex = getMobileActiveWeekIndex(schedule);
                activeWeek = schedule[weekIndex];
                if (activeWeek) {
                  lessonTopic = `Sıradaki Konu: ${extractMobileWeekTopic(activeWeek)}`;
                } else {
                  lessonTopic = 'Sıradaki ders plan konusu bulunamadı.';
                }
              } else {
                lessonTopic = 'Sıradaki ders için plan bulunamadı.';
              }
            } else {
              lessonName = 'Sıradaki Ders Boş';
              lessonTopic = 'Teneffüsten sonra ders boş.';
            }
          } else {
            statusType = 'outside';
            periodNum = 'Ders Dışı';
            lessonName = 'Serbest Zaman';
            lessonTopic = 'Ders saatleri dışındasınız.';
            remainingPercent = null;
          }
        }
      }
    } else {
      statusType = 'outside';
      periodNum = 'Hafta Sonu';
      lessonName = 'Dinlenme Günü';
      lessonTopic = 'Hafta sonu tatili.';
      remainingPercent = null;
    }

    const selectedWeek = (window.stateManager && typeof window.stateManager.getSelectedWeek === 'function')
      ? window.stateManager.getSelectedWeek()
      : (window.getISOWeek ? window.getISOWeek(now) : '');

    let weekText = '';
    if (selectedWeek) {
      if (typeof window.getEducationWeekInfo === 'function') {
        const eduInfo = window.getEducationWeekInfo(selectedWeek);
        if (eduInfo && eduInfo.shortLabel) {
          weekText = eduInfo.shortLabel;
        }
      }
      if (!weekText && typeof window.formatWeekTR === 'function') {
        weekText = window.formatWeekTR(selectedWeek, 'short');
      }
      if (!weekText) {
        const parts = selectedWeek.split('-W');
        weekText = parts.length === 2 ? `${parseInt(parts[1], 10)}. Hafta` : selectedWeek;
      }
    } else {
      weekText = dayName;
    }

    return {
      dayName,
      periodNum,
      lessonName,
      lessonColor,
      statusType,
      weekText,
      lessonTopic,
      remainingMinutes,
      remainingPercent,
      remainingText,
      matchedPlan,
      activeWeek,
      weekIndex,
      isCompleted,
      canComplete
    };
  }

  function updateLiveLessonCard() {
    const periodEl = document.getElementById('live-lesson-period-span');
    const weekEl = document.getElementById('live-lesson-week-span');
    const titleEl = document.getElementById('live-lesson-name');
    const topicEl = document.getElementById('live-lesson-topic-text');
    const progressBar = document.getElementById('m-live-lesson-progress-bar');
    const timeWrap = document.getElementById('m-live-lesson-time-wrap');
    const timeText = document.getElementById('live-lesson-remaining-text');
    const iconEl = document.getElementById('m-live-lesson-icon');
    const completedBadge = document.getElementById('live-lesson-completed-badge');
    const outcomeBtn = document.getElementById('btn-live-lesson-outcome');

    if (!titleEl || !topicEl) return;

    const info = getCurrentMobileLessonInfo();
    window._currentLiveLessonInfo = info;

    if (periodEl) periodEl.textContent = info.periodNum || 'Canlı Ders';
    if (weekEl) weekEl.textContent = info.weekText ? `📅 ${info.weekText}` : (info.dayName || '');
    if (titleEl) titleEl.textContent = (info.lessonName || 'SERBEST ZAMAN').toUpperCase();
    if (topicEl) topicEl.textContent = info.lessonTopic || '';

    // Azalan İlerleme Çubuğu ve Renkler
    if (progressBar) {
      if (info.remainingPercent !== null) {
        progressBar.style.display = 'block';
        progressBar.style.width = `${info.remainingPercent}%`;
        if (info.lessonColor) {
          progressBar.style.background = `linear-gradient(90deg, ${info.lessonColor}33, ${info.lessonColor}88)`;
          progressBar.style.borderRightColor = info.lessonColor;
        } else if (info.statusType === 'break' || info.statusType === 'lunch') {
          progressBar.style.background = 'linear-gradient(90deg, rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.55))';
          progressBar.style.borderRightColor = '#f59e0b';
        } else {
          progressBar.style.background = 'linear-gradient(90deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.5))';
          progressBar.style.borderRightColor = 'var(--m-primary)';
        }
      } else {
        progressBar.style.width = '0%';
        progressBar.style.display = 'none';
      }
    }

    // Kalan Süre
    if (timeWrap && timeText) {
      if (info.remainingText) {
        timeWrap.style.display = 'inline-flex';
        timeText.textContent = info.remainingText;
      } else {
        timeWrap.style.display = 'none';
      }
    }

    // İkon
    if (iconEl) {
      if (info.statusType === 'lunch') iconEl.setAttribute('data-lucide', 'utensils');
      else if (info.statusType === 'break') iconEl.setAttribute('data-lucide', 'bell');
      else if (info.statusType === 'outside') iconEl.setAttribute('data-lucide', 'moon');
      else iconEl.setAttribute('data-lucide', 'book-open');
    }

    // İşlendi Rozeti
    if (completedBadge) {
      completedBadge.style.display = info.isCompleted ? 'inline-block' : 'none';
    }

    // Kazanım Butonu
    if (outcomeBtn) {
      if (info.matchedPlan) {
        outcomeBtn.style.opacity = '1';
        outcomeBtn.style.borderColor = 'var(--m-primary)';
      } else {
        outcomeBtn.style.opacity = '0.85';
        outcomeBtn.style.borderColor = 'var(--m-border)';
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }
  window.updateLiveLessonCard = updateLiveLessonCard;

  // Haftalık Kazanım Görüntüleme Penceresi
  window.showLiveLessonOutcomeModal = () => {
    const info = window._currentLiveLessonInfo || getCurrentMobileLessonInfo();
    const modalContent = document.getElementById('m-outcome-modal-content');
    const modalTitle = document.getElementById('m-outcome-modal-title');
    if (!modalContent) return;

    if (modalTitle) {
      modalTitle.textContent = info.lessonName ? `${info.lessonName} • Kazanım` : 'Ders Kazanımı';
    }

    if (info.matchedPlan && info.activeWeek) {
      const plan = info.matchedPlan;
      const week = info.activeWeek;
      const outcomes = extractMobileWeekOutcomes(week);
      const isDone = !!(week.isCompleted || week.completed);

      modalContent.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.05)); border: 1.5px solid rgba(99, 102, 241, 0.2); border-radius: 14px; padding: 12px 14px; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span class="m-badge" style="background: var(--m-primary); color: white; font-weight: 800; font-size: 0.72rem;">
              ${escapeHTML(info.lessonName)}
            </span>
            <span style="font-size: 0.74rem; font-weight: 700; color: var(--m-text-muted);">
              ${escapeHTML(week.dateRange || info.weekText || '')}
            </span>
          </div>
          <div style="font-size: 0.95rem; font-weight: 800; color: var(--m-text); margin-bottom: 2px;">
            ${escapeHTML(week.unitName ? (week.unitNo ? `${week.unitNo}. Ünite: ` : '') + week.unitName : 'Aktif Ünite')}
          </div>
          <div style="font-size: 0.76rem; color: var(--m-text-muted);">
            Yıllık Plan: <strong>${escapeHTML(plan.courseName || plan.title || '')}</strong>
          </div>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 800; color: var(--m-text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
            📖 BU HAFTANIN DERS KONUSU
          </div>
          <div style="padding: 10px 12px; background: var(--m-surface-subtle); border-radius: 10px; border: 1px solid var(--m-border); font-size: 0.88rem; font-weight: 700; color: var(--m-text); line-height: 1.45;">
            ${escapeHTML(extractMobileWeekTopic(week))}
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 0.72rem; font-weight: 800; color: var(--m-primary); text-transform: uppercase; letter-spacing: 0.5px;">
              🎯 ÖĞRENME KAZANIMLARI (${outcomes.length})
            </div>
            ${isDone ? '<span class="m-badge" style="background: rgba(16, 185, 129, 0.12); color: #10b981; font-weight: 800;">✓ İşlendi</span>' : ''}
          </div>
          ${outcomes.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${outcomes.map(oc => `
                <div style="display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 10px; background: var(--m-surface); border: 1px solid var(--m-border); box-shadow: 0 1px 4px rgba(0,0,0,0.02);">
                  <span style="font-size: 1rem; line-height: 1; flex-shrink: 0; margin-top: 2px;">🎯</span>
                  <div style="font-size: 0.82rem; font-weight: 600; color: var(--m-text); line-height: 1.45;">
                    ${escapeHTML(oc)}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="padding: 12px; text-align: center; color: var(--m-text-muted); font-size: 0.82rem; background: var(--m-surface-subtle); border-radius: 10px;">
              Bu hafta için ayrıntılı kazanım maddesi girilmemiş.
            </div>
          `}
        </div>

        ${!week.isHoliday ? `
          <div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 8px;">
            <button type="button" class="subview-primary-action-btn" onclick="window.toggleLiveLessonTopicCompleted('${plan.id}', ${info.weekIndex})" style="background: ${isDone ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, var(--m-primary), #4338ca)'};">
              <i data-lucide="${isDone ? 'check-circle-2' : 'circle'}" style="width: 18px; height: 18px;"></i>
              <span>${isDone ? '✓ Bu Konu İŞLENDİ (Geri Al)' : 'Bu Konuyu İŞLENDİ Olarak İşaretle'}</span>
            </button>
          </div>
        ` : ''}
      `;
    } else {
      const lessonTitle = info.lessonName ? info.lessonName : 'Aktif Ders';
      modalContent.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem;">
          <div style="width: 64px; height: 64px; border-radius: 20px; background: rgba(99, 102, 241, 0.1); color: var(--m-primary); font-size: 2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto;">
            📑
          </div>
          <div style="font-size: 1.05rem; font-weight: 800; color: var(--m-text); margin-bottom: 0.5rem;">
            Yıllık Plan Bulunamadı
          </div>
          <div style="font-size: 0.82rem; color: var(--m-text-muted); line-height: 1.5; max-width: 300px; margin: 0 auto 1.5rem auto;">
            <strong>${escapeHTML(lessonTitle)}</strong> dersi için henüz sisteme yüklenmiş bir yıllık plan bulunmuyor.
          </div>
          <button type="button" class="subview-primary-action-btn" onclick="window.closeBottomSheet(); window.openScheduleFlowModal();" style="max-width: 260px; margin: 0 auto;">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i>
            <span>Ders Akışından Plan Ekle</span>
          </button>
        </div>
      `;
    }

    openBottomSheet('modal-live-lesson-outcome');
    if (window.lucide) window.lucide.createIcons();
  };

  window.toggleLiveLessonTopicCompleted = (planId, weekIdx) => {
    if (!planId || weekIdx === null || weekIdx === undefined) return;
    if (window.stateManager && typeof window.stateManager.toggleWeekCompleted === 'function') {
      window.stateManager.toggleWeekCompleted(planId, weekIdx);
      window.vibrate(30);

      const st = window.stateManager.loadState();
      const pl = (st.plans || []).find(x => x.id === planId);
      const sch = pl ? (pl.weeklySchedule || pl.weeks || []) : [];
      const wk = sch[weekIdx];
      const isDone = wk ? !!(wk.isCompleted || wk.completed) : false;

      showMobileToast(isDone ? '✓ Ders konusu "İşlendi" olarak işaretlendi.' : 'Ders konusu "İşlenmedi" yapıldı.');
      updateLiveLessonCard();
      window.showLiveLessonOutcomeModal();
    }
  };

  // ==========================================================================
  // 1. MODÜL: PERFORMANS (HIZLI DOJO PUANLAMA & ÖĞRENCİ DETAYLARI)
  // ==========================================================================
  window.currentDetailedStudentId = null;

  function renderPerformanceTab() {
    const container = document.getElementById('m-students-grid');
    if (!container) return;

    const students = getFilteredStudents();
    container.innerHTML = '';

    if (students.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="users" style="width: 40px; height: 40px; margin-bottom: 0.5rem; opacity: 0.5;"></i>
          <p style="font-weight: 600;">Öğrenci bulunamadı.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const state = (window.stateManager && window.stateManager.loadState) 
      ? window.stateManager.loadState() 
      : (window.stateManager ? window.stateManager.state : {});
    const transactions = (state.books && state.books.transactions) ? state.books.transactions : [];
    const homeworks = state.homeworks || [];
    const evaluations = state.weeklyEvaluations || [];
    const writtenExams = state.writtenExams || [];

    students.forEach(st => {
      const card = document.createElement('div');
      card.className = 'student-card';
      const avatarColor = getAvatarColor(st.id || st.name);
      const score = (st.scores && st.scores.total !== undefined) 
        ? st.scores.total 
        : ((window.stateManager && window.stateManager.getStudentScore) ? window.stateManager.getStudentScore(st.id) : 0);

      // 1. Okuduğu kitap sayısı (İade edilmiş kitaplar)
      const readBookCount = transactions.filter(t => String(t.studentId) === String(st.id) && t.status === 'returned').length;

      // 2. Yapılan / Yapılmayan ödev sayısı
      let hwDone = 0;
      let hwNotDone = 0;
      homeworks.forEach(hw => {
        if (!hw.status) return;
        const s = hw.status[st.id] !== undefined ? hw.status[st.id] : hw.status[String(st.id)];
        if (s === 'completed') {
          hwDone++;
        } else if (s === 'missing' || s === 'incomplete') {
          hwNotDone++;
        }
      });

      // 3. Haftalık değerlendirme ve sınav başarı ortalaması
      let evalScores = [];
      evaluations.forEach(e => {
        let sc = null;
        if (e.examScores && (e.examScores[st.id] !== undefined || e.examScores[String(st.id)] !== undefined)) {
          sc = e.examScores[st.id] !== undefined ? e.examScores[st.id] : e.examScores[String(st.id)];
        } else if (e.studentResults && (e.studentResults[st.id] || e.studentResults[String(st.id)])) {
          const res = e.studentResults[st.id] || e.studentResults[String(st.id)];
          sc = (typeof res === 'object') ? res.score : res;
        }
        if (sc !== null && sc !== undefined && sc !== '') {
          const num = parseFloat(sc);
          if (!isNaN(num)) evalScores.push(num);
        }
      });
      writtenExams.forEach(we => {
        if (we.scores && (we.scores[st.id] !== undefined || we.scores[String(st.id)] !== undefined)) {
          const sc = we.scores[st.id] !== undefined ? we.scores[st.id] : we.scores[String(st.id)];
          if (sc !== null && sc !== undefined && sc !== '') {
            const num = parseFloat(sc);
            if (!isNaN(num)) evalScores.push(num);
          }
        }
      });
      const evalAvg = evalScores.length > 0 
        ? (evalScores.reduce((a, b) => a + b, 0) / evalScores.length).toFixed(1)
        : null;

      card.innerHTML = `
        <div class="student-card-top-row">
          <div class="student-avatar" style="background-color: ${avatarColor};">
            ${st.photo ? `<img src="${st.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : escapeHTML(st.name.charAt(0).toUpperCase())}
          </div>
          <div class="student-card-info">
            <div class="student-card-name">${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}</div>
            <div class="student-card-no">${formatStudentSubtitle(st)}</div>
          </div>
          <div class="student-card-point-actions">
            <button type="button" class="student-card-score-btn" id="score-badge-${st.id}" title="Hızlı Puan Ver">
              <span class="score-val">${score >= 0 ? '+' : ''}${score}</span>
              <span class="score-plus" style="display: flex; align-items: center; justify-content: center; background: rgba(79, 70, 229, 0.15); border-radius: 50%; width: 20px; height: 20px; margin-left: 2px;">
                <i data-lucide="plus" style="width: 13px; height: 13px;"></i>
              </span>
            </button>
          </div>
        </div>

        <div class="student-card-metrics-row">
          <div class="student-metric-item" title="Okuduğu Kitap Sayısı">
            <span class="student-metric-icon">📚</span>
            <div class="student-metric-content">
              <span class="student-metric-lbl">Kitap</span>
              <span class="student-metric-val">${readBookCount} Okundu</span>
            </div>
          </div>

          <div class="student-metric-item" title="Yapılan / Yapılmayan Ödevler">
            <span class="student-metric-icon">📝</span>
            <div class="student-metric-content">
              <span class="student-metric-lbl">Ödev</span>
              <span class="student-metric-val"><span style="color: var(--m-success);">${hwDone}</span> / <span style="color: var(--m-danger);">${hwNotDone}</span></span>
            </div>
          </div>

          <div class="student-metric-item" title="Haftalık Sınav Başarı Ortalaması">
            <span class="student-metric-icon">📊</span>
            <div class="student-metric-content">
              <span class="student-metric-lbl">Haftalık Sınav</span>
              <span class="student-metric-val" style="color: ${evalAvg !== null ? 'var(--m-primary)' : 'var(--m-text-muted)'};">${evalAvg !== null ? `${evalAvg} Ort.` : '-'}</span>
            </div>
          </div>
        </div>
      `;

      // Hızlı puan verme butonu
      const scoreBtn = card.querySelector('.student-card-score-btn');
      if (scoreBtn) {
        scoreBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openPointBottomSheet(st);
        });
      }

      // Kartın tamamına tıklandığında detay penceresi açılır
      card.addEventListener('click', () => {
        window.openStudentDetailModal(st.id);
      });

      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================================================
  // OLUMLU & OLUMSUZ GRUPLANDIRILMIŞ VE KAYDIRILABİLİR PUAN VERME SİSTEMİ
  // ==========================================================================
  let activePointTab = 'positive';
  let isProgrammaticPointScroll = false;

  window.handlePointSwipeScroll = () => {
    if (isProgrammaticPointScroll) return;
    const container = document.getElementById('m-point-swipe-container');
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const width = container.clientWidth;
    const threshold = width * 0.45;

    if (scrollLeft >= threshold && activePointTab !== 'negative') {
      activePointTab = 'negative';
      updatePointTabUI('negative');
    } else if (scrollLeft < threshold && activePointTab !== 'positive') {
      activePointTab = 'positive';
      updatePointTabUI('positive');
    }
  };

  window.switchPointTab = (tab) => {
    activePointTab = tab;
    updatePointTabUI(tab);
    const container = document.getElementById('m-point-swipe-container');
    if (container) {
      isProgrammaticPointScroll = true;
      const targetLeft = tab === 'positive' ? 0 : container.clientWidth;
      container.scrollTo({ left: targetLeft, behavior: 'smooth' });
      setTimeout(() => { isProgrammaticPointScroll = false; }, 350);
    }
  };

  function updatePointTabUI(tab) {
    const posBtn = document.getElementById('tab-btn-point-pos');
    const negBtn = document.getElementById('tab-btn-point-neg');
    const posDot = document.getElementById('m-point-dot-pos');
    const negDot = document.getElementById('m-point-dot-neg');

    if (tab === 'positive') {
      if (posBtn) posBtn.classList.add('active');
      if (negBtn) negBtn.classList.remove('active');
      if (posDot) posDot.classList.add('active');
      if (negDot) negDot.classList.remove('active');
    } else {
      if (posBtn) posBtn.classList.remove('active');
      if (negBtn) negBtn.classList.add('active');
      if (posDot) posDot.classList.remove('active');
      if (negDot) negDot.classList.add('active');
    }
  }

  // Puan Verme Bottom Sheet
  function openPointBottomSheet(student) {
    if (!student) return;
    selectedStudentForPoints = student;
    window.vibrate(30);

    const sheet = document.getElementById('sheet-points');
    const backdrop = document.getElementById('sheet-backdrop');
    const title = document.getElementById('sheet-student-name');
    const scoreVal = document.getElementById('sheet-student-current-score');
    const avatarEl = document.getElementById('sheet-student-avatar');

    if (title) title.textContent = `${student.name} ${student.surname || ''}`;
    
    const curScore = (student.scores && student.scores.total !== undefined) 
      ? student.scores.total 
      : ((window.stateManager && window.stateManager.getStudentScore) ? window.stateManager.getStudentScore(student.id) : 0);

    if (scoreVal) {
      scoreVal.textContent = `Toplam Puan: ${curScore >= 0 ? '+' : ''}${curScore}`;
    }

    if (avatarEl) {
      const avatarColor = getAvatarColor(student.id || student.name);
      avatarEl.style.backgroundColor = avatarColor;
      avatarEl.innerHTML = student.photo 
        ? `<img src="${student.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` 
        : escapeHTML(student.name.charAt(0).toUpperCase());
    }

    // Davranış Havuzunu Yükle (Ayarlarda özelleştirilmiş listeyi al)
    const behaviors = (window.stateManager && typeof window.stateManager.getPerformanceBehaviors === 'function') 
      ? window.stateManager.getPerformanceBehaviors() 
      : null;

    const defaultPositive = [
      { name: 'Derse Katılım', point: 1, icon: '🙋‍♂️' },
      { name: 'Parmak Kaldırma', point: 1, icon: '✋' },
      { name: 'Ödev Başarısı', point: 1, icon: '📝' },
      { name: 'Kitap Okuma', point: 2, icon: '📚' },
      { name: 'Arkadaşlık / Yardımlaşma', point: 2, icon: '🤝' },
      { name: 'Temiz ve Düzenli', point: 1, icon: '🧼' },
      { name: 'Görev Bilinci / Sorumluluk', point: 2, icon: '🎯' },
      { name: 'Örnek Davranış', point: 3, icon: '🏆' }
    ];

    const defaultNegative = [
      { name: 'Sınıf Düzenini Bozma', point: -1, icon: '📣' },
      { name: 'Derse Geç Kalma', point: -1, icon: '⏰' },
      { name: 'Malzemelerini Getirmeme', point: -1, icon: '🎒' },
      { name: 'Ödevini Yapmama', point: -1, icon: '❌' },
      { name: 'Arkadaşlarına Saygısızlık', point: -2, icon: '⚠️' },
      { name: 'Hazırlıksız Gelme', point: -1, icon: '📝' }
    ];

    const positiveList = (behaviors && behaviors.positive && behaviors.positive.length > 0)
      ? behaviors.positive
      : defaultPositive;

    const negativeList = (behaviors && (behaviors.development || behaviors.negative) && (behaviors.development || behaviors.negative).length > 0)
      ? (behaviors.development || behaviors.negative)
      : defaultNegative;

    // 1. Olumlu Butonları Render Et
    const gridPos = document.getElementById('m-point-grid-positive');
    if (gridPos) {
      gridPos.innerHTML = positiveList.map(b => {
        const point = b.point !== undefined ? Math.abs(b.point) : 1;
        const icon = b.icon || '⭐';
        return `
          <button type="button" class="m-point-btn-item positive" onclick="window.giveQuickPoint(${point}, '${escapeHTML(b.name)}')">
            <span class="m-point-btn-icon">${icon}</span>
            <span class="m-point-btn-name">${escapeHTML(b.name)}</span>
            <span class="m-point-btn-badge plus">+${point}</span>
          </button>
        `;
      }).join('');
    }

    // 2. Olumsuz Butonları Render Et
    const gridNeg = document.getElementById('m-point-grid-negative');
    if (gridNeg) {
      gridNeg.innerHTML = negativeList.map(b => {
        let point = b.point !== undefined ? b.point : -1;
        if (point > 0) point = -point; // Olumsuz puanlar eksi olmalıdır
        const icon = b.icon || '⚠️';
        return `
          <button type="button" class="m-point-btn-item negative" onclick="window.giveQuickPoint(${point}, '${escapeHTML(b.name)}')">
            <span class="m-point-btn-icon">${icon}</span>
            <span class="m-point-btn-name">${escapeHTML(b.name)}</span>
            <span class="m-point-btn-badge minus">${point}</span>
          </button>
        `;
      }).join('');
    }

    // Sayı Rozetlerini Güncelle
    const posCount = document.getElementById('m-point-pos-count');
    const negCount = document.getElementById('m-point-neg-count');
    if (posCount) posCount.textContent = positiveList.length;
    if (negCount) negCount.textContent = negativeList.length;

    // Özel Puan Formunu Sıfırla
    const customForm = document.getElementById('m-point-custom-form');
    if (customForm) customForm.style.display = 'none';

    // İlk olarak Olumlu sekmesini seç ve kaydırıcıyı başa al
    activePointTab = 'positive';
    updatePointTabUI('positive');

    if (sheet && backdrop) {
      backdrop.classList.add('active');
      sheet.classList.add('active');
    }

    const container = document.getElementById('m-point-swipe-container');
    if (container) {
      container.scrollLeft = 0;
      setupPointSwipeTouchGestures(container);
    }

    if (window.lucide) window.lucide.createIcons();
  }
  window.openPointBottomSheet = openPointBottomSheet;

  // Mobil Dokunmatik Sağa/Sola Hızlı Kaydırma Desteği
  function setupPointSwipeTouchGestures(container) {
    if (container._touchGesturesAttached) return;
    container._touchGesturesAttached = true;

    let startX = 0;
    let startY = 0;
    let isSwiping = false;

    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
      }
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (!isSwiping || e.changedTouches.length === 0) return;
      isSwiping = false;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // Yatay kaydırma dikeyden baskınsa ve 40px üzerindeyse
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
        if (diffX < 0 && activePointTab === 'positive') {
          // Sola kaydırıldı -> Olumsuzlara geç
          window.switchPointTab('negative');
        } else if (diffX > 0 && activePointTab === 'negative') {
          // Sağa kaydırıldı -> Olumlulara geç
          window.switchPointTab('positive');
        }
      }
    }, { passive: true });
  }

  window.toggleCustomPointForm = () => {
    const form = document.getElementById('m-point-custom-form');
    if (form) {
      const isHidden = form.style.display === 'none';
      form.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        const reasonInput = document.getElementById('m-custom-point-reason');
        if (reasonInput) reasonInput.focus();
      }
    }
  };

  window.giveCustomPoint = () => {
    if (!selectedStudentForPoints) return;
    const valInput = document.getElementById('m-custom-point-val');
    const reasonInput = document.getElementById('m-custom-point-reason');
    const pts = parseInt(valInput ? valInput.value : 1) || 1;
    const reason = (reasonInput && reasonInput.value.trim()) ? reasonInput.value.trim() : 'Özel Değerlendirme';
    window.giveQuickPoint(pts, reason);
  };

  window.giveQuickPoint = (points, reason) => {
    if (!selectedStudentForPoints || !window.stateManager) return;

    window.stateManager.addScore(selectedStudentForPoints.id, points, reason);
    window.vibrate(45);

    // Rozet skorunu hemen güncelle
    const updatedStudent = getStudentByIdSafe(selectedStudentForPoints.id);
    const newTotal = (updatedStudent && updatedStudent.scores && updatedStudent.scores.total !== undefined) 
      ? updatedStudent.scores.total 
      : ((window.stateManager && window.stateManager.getStudentScore) ? window.stateManager.getStudentScore(selectedStudentForPoints.id) : 0);

    const badge = document.getElementById(`score-badge-${selectedStudentForPoints.id}`);
    if (badge) {
      const valEl = badge.querySelector('.score-val');
      if (valEl) {
        valEl.textContent = `${newTotal >= 0 ? '+' : ''}${newTotal}`;
      } else {
        badge.textContent = `${newTotal >= 0 ? '+' : ''}${newTotal}`;
      }
      badge.style.transform = 'scale(1.25)';
      setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200);
    }

    showMobileToast(`${selectedStudentForPoints.name}: ${points > 0 ? '+' : ''}${points} Puan (${reason})`);
    
    // sheet-points'i kapat
    const ptSheet = document.getElementById('sheet-points');
    if (ptSheet) ptSheet.classList.remove('active');

    // Eğer öğrenci detay penceresi arkada açıksa hemen güncelle ve açık tut
    const detailModal = document.getElementById('modal-student-detail');
    if (window.currentDetailedStudentId === selectedStudentForPoints.id && detailModal && detailModal.classList.contains('active')) {
      window.openStudentDetailModal(selectedStudentForPoints.id);
    } else {
      closeBottomSheet();
    }
  };

  // ==========================================================================
  // ÖĞRENCİ DETAYLARI MODALI
  // ==========================================================================
  window.openStudentDetailModal = function(studentId) {
    if (!window.stateManager) return;
    const state = (window.stateManager.loadState) ? window.stateManager.loadState() : (window.stateManager.state || {});
    const student = (state.students || []).find(s => String(s.id) === String(studentId));
    if (!student) return;

    window.vibrate(30);
    window.currentDetailedStudentId = student.id;

    const modal = document.getElementById('modal-student-detail');
    const backdrop = document.getElementById('sheet-backdrop');
    if (!modal) return;

    // 1. Header Bilgileri
    const avatarEl = document.getElementById('m-std-avatar');
    const nameEl = document.getElementById('m-std-name');
    const subtitleEl = document.getElementById('m-std-subtitle');
    const givePointBtn = document.getElementById('m-std-give-point-btn');

    const avatarColor = getAvatarColor(student.id || student.name);
    if (avatarEl) {
      avatarEl.style.backgroundColor = avatarColor;
      avatarEl.innerHTML = student.photo 
        ? `<img src="${student.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` 
        : escapeHTML(student.name.charAt(0).toUpperCase());
    }

    if (nameEl) {
      nameEl.textContent = `${student.name} ${student.surname || ''}`;
    }

    const curScore = (window.stateManager.getStudentScore) 
      ? window.stateManager.getStudentScore(student.id) 
      : ((student.scores && student.scores.total !== undefined) ? student.scores.total : 0);

    if (subtitleEl) {
      const subInfo = formatStudentSubtitle(student);
      subtitleEl.innerHTML = `${subInfo} • <span style="color: var(--m-primary); font-weight: 800;">${curScore >= 0 ? '+' : ''}${curScore} Puan</span>`;
    }

    if (givePointBtn) {
      givePointBtn.onclick = () => {
        window.openPointBottomSheet(student);
      };
    }

    // 2. İletişim ve Notlar Şeridi
    const infoStrip = document.getElementById('m-std-info-strip');
    if (infoStrip) {
      let phoneHtml = student.parentPhone 
        ? `<a href="tel:${student.parentPhone}" class="m-std-info-link" style="display: inline-flex; align-items: center; gap: 3px;">
             <span>📞</span> ${escapeHTML(student.parentPhone)}
           </a>`
        : `<span style="color: var(--m-text-muted);">📞 Veli Tel: Girilmemiş</span>`;

      const regDate = student.createdAt 
        ? new Date(student.createdAt).toLocaleDateString('tr-TR')
        : '-';

      infoStrip.innerHTML = `
        <div class="m-std-info-item">${phoneHtml}</div>
        <div class="m-std-info-item" style="color: var(--m-text-muted);">•</div>
        <div class="m-std-info-item" title="Kayıt Tarihi"><span>📅</span> ${regDate}</div>
        ${student.notes ? `
          <div style="width: 100%; margin-top: 4px; padding-top: 4px; border-top: 1px dashed var(--m-border); color: var(--m-text-secondary); font-size: 0.72rem;">
            <strong>📝 Not:</strong> ${escapeHTML(student.notes)}
          </div>
        ` : ''}
      `;
    }

    // 3. Sekme İçeriklerini Doldur
    renderStudentDetailTabs(student, state);

    // Modalı aç
    if (backdrop) backdrop.classList.add('active');
    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  };

  window.switchStudentDetailTab = function(tabName) {
    document.querySelectorAll('.m-std-tab-btn').forEach(btn => {
      if (btn.dataset.tab === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    document.querySelectorAll('.m-std-tab-pane').forEach(pane => {
      if (pane.id === `m-std-tab-${tabName}`) pane.style.display = 'block';
      else pane.style.display = 'none';
    });
    window.vibrate(15);
    if (window.lucide) window.lucide.createIcons();
  };

  function renderStudentDetailTabs(student, state) {
    if (!student || !state) return;

    // 1. Sekme: Puanlar
    const perfPane = document.getElementById('m-std-tab-perf');
    if (perfPane) {
      const studentPerf = (state.performance || [])
        .filter(p => String(p.studentId) === String(student.id))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      let posPoints = 0, negPoints = 0;
      studentPerf.forEach(p => {
        const pt = parseFloat(p.point) || 0;
        if (pt >= 0) posPoints += pt;
        else negPoints += Math.abs(pt);
      });
      const curScore = (window.stateManager.getStudentScore) 
        ? window.stateManager.getStudentScore(student.id) 
        : ((student.scores && student.scores.total !== undefined) ? student.scores.total : 0);

      let listHtml = '';
      if (studentPerf.length === 0) {
        listHtml = `
          <div style="text-align: center; padding: 2rem 1rem; color: var(--m-text-muted);">
            <i data-lucide="award" style="width: 36px; height: 36px; opacity: 0.4; margin-bottom: 0.5rem;"></i>
            <p style="font-weight: 600; font-size: 0.85rem;">Henüz puan veya davranış kaydı bulunmuyor.</p>
          </div>
        `;
      } else {
        listHtml = studentPerf.map(p => {
          const pt = parseFloat(p.point) || 0;
          const sign = pt >= 0 ? '+' : '';
          const color = pt >= 0 ? 'var(--m-success)' : 'var(--m-danger)';
          const bg = pt >= 0 ? 'var(--m-success-light)' : 'var(--m-danger-light)';
          const dateStr = p.date ? new Date(p.date).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
          return `
            <div class="m-std-card-item">
              <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
                <div style="width: 34px; height: 34px; border-radius: 8px; background: ${bg}; color: ${color}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem; flex-shrink: 0;">
                  ${sign}${pt}
                </div>
                <div style="min-width: 0; flex: 1;">
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(p.reason || 'Puan')}</div>
                  <div style="font-size: 0.7rem; color: var(--m-text-muted);">${dateStr}</div>
                </div>
              </div>
              <button type="button" class="m-std-del-btn" onclick="window.deleteStudentPerformanceEntry('${p.id}', '${student.id}')" title="Bu puan kaydını sil">
                <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
              </button>
            </div>
          `;
        }).join('');
      }

      perfPane.innerHTML = `
        <div class="m-std-summary-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--m-text-muted); text-transform: uppercase;">Performans Özeti</div>
            <button type="button" class="subview-primary-action-btn" onclick="window.openPointBottomSheet(getStudentByIdSafe('${student.id}'))" style="padding: 4px 10px; font-size: 0.74rem; width: auto;">
              <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Puan Ver
            </button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center;">
            <div style="background: var(--m-bg); padding: 6px; border-radius: 6px; border: 1px solid var(--m-border);">
              <div style="font-size: 0.65rem; color: var(--m-text-muted); font-weight: 600;">TOPLAM</div>
              <div style="font-size: 1.05rem; font-weight: 800; color: var(--m-primary);">${curScore >= 0 ? '+' : ''}${curScore}</div>
            </div>
            <div style="background: var(--m-bg); padding: 6px; border-radius: 6px; border: 1px solid var(--m-border);">
              <div style="font-size: 0.65rem; color: var(--m-text-muted); font-weight: 600;">POZİTİF</div>
              <div style="font-size: 1.05rem; font-weight: 800; color: var(--m-success);">+${posPoints}</div>
            </div>
            <div style="background: var(--m-bg); padding: 6px; border-radius: 6px; border: 1px solid var(--m-border);">
              <div style="font-size: 0.65rem; color: var(--m-text-muted); font-weight: 600;">NEGATİF</div>
              <div style="font-size: 1.05rem; font-weight: 800; color: var(--m-danger);">${negPoints > 0 ? `-${negPoints}` : '0'}</div>
            </div>
          </div>
        </div>
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--m-text-muted); margin: 0.75rem 0 0.4rem 0.2rem; text-transform: uppercase;">Puan Akışı (${studentPerf.length} Kayıt)</div>
        <div class="m-std-list-container">${listHtml}</div>
      `;
    }

    // 2. Sekme: Kitaplar
    const booksPane = document.getElementById('m-std-tab-books');
    if (booksPane) {
      const allTx = (state.books && state.books.transactions) ? state.books.transactions : [];
      const studentTx = allTx
        .filter(t => String(t.studentId) === String(student.id))
        .sort((a, b) => new Date(b.borrowDate || 0) - new Date(a.borrowDate || 0));

      const returnedCount = studentTx.filter(t => t.status === 'returned').length;
      const readingTx = studentTx.find(t => t.status === 'reading');

      // Sınıf okuma sıralaması hesabı
      const readerCounts = (state.students || []).map(s => {
        const c = allTx.filter(t => String(t.studentId) === String(s.id) && t.status === 'returned').length;
        return { studentId: s.id, count: c };
      });
      readerCounts.sort((a, b) => b.count - a.count);
      let rank = 1, lastCount = -1;
      const rankMap = {};
      readerCounts.forEach((rc, idx) => {
        if (rc.count !== lastCount) {
          rank = idx + 1;
          lastCount = rc.count;
        }
        rankMap[rc.studentId] = rank;
      });
      const studentRank = rankMap[student.id] || '-';

      const library = (state.books && state.books.library) ? state.books.library : [];

      let txListHtml = '';
      if (studentTx.length === 0) {
        txListHtml = `
          <div style="text-align: center; padding: 2rem 1rem; color: var(--m-text-muted);">
            <i data-lucide="book-open" style="width: 36px; height: 36px; opacity: 0.4; margin-bottom: 0.5rem;"></i>
            <p style="font-weight: 600; font-size: 0.85rem;">Henüz kitap okuma kaydı bulunmuyor.</p>
          </div>
        `;
      } else {
        txListHtml = studentTx.map(t => {
          const book = library.find(b => String(b.id) === String(t.bookId)) || { title: 'Kitap', author: '-' };
          const isReading = t.status === 'reading';
          const bDate = t.borrowDate ? new Date(t.borrowDate).toLocaleDateString('tr-TR') : '-';
          const rDate = t.returnDate ? new Date(t.returnDate).toLocaleDateString('tr-TR') : '-';
          return `
            <div class="m-std-card-item">
              <div style="min-width: 0; flex: 1;">
                <div style="font-size: 0.86rem; font-weight: 700; color: var(--m-text);">${escapeHTML(book.title)}</div>
                <div style="font-size: 0.72rem; color: var(--m-text-muted);">${escapeHTML(book.author || '')} • Veriliş: ${bDate}${t.returnDate ? ` • Teslim: ${rDate}` : ''}</div>
              </div>
              <span class="status-badge ${isReading ? 'incomplete' : 'completed'}" style="font-size: 0.72rem; padding: 3px 8px;">
                ${isReading ? '📖 Okuyor' : '✓ Okundu'}
              </span>
            </div>
          `;
        }).join('');
      }

      booksPane.innerHTML = `
        <div class="m-std-summary-card">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; text-align: center;">
            <div style="background: var(--m-bg); padding: 8px; border-radius: 6px; border: 1px solid var(--m-border);">
              <div style="font-size: 0.65rem; color: var(--m-text-muted); font-weight: 600;">OKUDUĞU KİTAP</div>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--m-success);">${returnedCount} Kitap</div>
            </div>
            <div style="background: var(--m-bg); padding: 8px; border-radius: 6px; border: 1px solid var(--m-border);">
              <div style="font-size: 0.65rem; color: var(--m-text-muted); font-weight: 600;">SINIF SIRALAMASI</div>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--m-primary);">${studentRank}. Sıra</div>
            </div>
          </div>
          ${readingTx ? `
            <div style="margin-top: 8px; padding: 6px 10px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 6px; font-size: 0.75rem; color: #b45309; display: flex; align-items: center; gap: 6px;">
              <span>📖</span>
              <span><strong>Şu an okuyor:</strong> ${(library.find(b => String(b.id) === String(readingTx.bookId)) || {}).title || 'Kitap'}</span>
            </div>
          ` : ''}
        </div>
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--m-text-muted); margin: 0.75rem 0 0.4rem 0.2rem; text-transform: uppercase;">Okuma Geçmişi (${studentTx.length} Kayıt)</div>
        <div class="m-std-list-container">${txListHtml}</div>
      `;
    }

    // 3. Sekme: Ödevler
    const hwPane = document.getElementById('m-std-tab-hw');
    if (hwPane) {
      const hws = (state.homeworks || []).slice().sort((a, b) => new Date(b.dueDate || b.date || 0) - new Date(a.dueDate || a.date || 0));
      let done = 0, notDone = 0, incomplete = 0, excused = 0, totalTracked = 0;

      hws.forEach(hw => {
        if (!hw.status) return;
        const st = hw.status[student.id] !== undefined ? hw.status[student.id] : hw.status[String(student.id)];
        if (st === 'completed') { done++; totalTracked++; }
        else if (st === 'missing') { notDone++; totalTracked++; }
        else if (st === 'incomplete') { incomplete++; totalTracked++; }
        else if (st === 'excused') { excused++; }
      });

      const percent = totalTracked > 0 ? Math.round((done / totalTracked) * 100) : 0;

      let hwListHtml = '';
      if (hws.length === 0) {
        hwListHtml = `
          <div style="text-align: center; padding: 2rem 1rem; color: var(--m-text-muted);">
            <i data-lucide="check-square" style="width: 36px; height: 36px; opacity: 0.4; margin-bottom: 0.5rem;"></i>
            <p style="font-weight: 600; font-size: 0.85rem;">Tanımlanmış ödev bulunmuyor.</p>
          </div>
        `;
      } else {
        hwListHtml = hws.map(hw => {
          const st = hw.status ? (hw.status[student.id] !== undefined ? hw.status[student.id] : hw.status[String(student.id)]) : null;
          let badgeHtml = '';
          if (st === 'completed') badgeHtml = '<span class="status-badge completed" style="font-size: 0.72rem;">✓ Yapıldı</span>';
          else if (st === 'missing') badgeHtml = '<span class="status-badge missing" style="font-size: 0.72rem;">✗ Yapılmadı</span>';
          else if (st === 'incomplete') badgeHtml = '<span class="status-badge incomplete" style="font-size: 0.72rem;">/ Eksik</span>';
          else if (st === 'excused') badgeHtml = '<span class="status-badge excused" style="font-size: 0.72rem;">Muaf</span>';
          else badgeHtml = '<span class="status-badge none" style="font-size: 0.72rem;">İşaretlenmedi</span>';

          const dateStr = (hw.dueDate || hw.date) ? new Date(hw.dueDate || hw.date).toLocaleDateString('tr-TR') : '-';
          return `
            <div class="m-std-card-item">
              <div style="min-width: 0; flex: 1;">
                <div style="font-size: 0.86rem; font-weight: 700; color: var(--m-text);">${escapeHTML(hw.title || 'Ödev')}</div>
                <div style="font-size: 0.72rem; color: var(--m-text-muted);">${escapeHTML(hw.subject || '')} • Tarih: ${dateStr}</div>
              </div>
              ${badgeHtml}
            </div>
          `;
        }).join('');
      }

      hwPane.innerHTML = `
        <div class="m-std-summary-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--m-text-muted); text-transform: uppercase;">Ödev Başarı Raporu</div>
            <span class="student-card-score" style="background: rgba(16, 185, 129, 0.15); color: var(--m-success); font-size: 0.82rem;">Başarı: %${percent}</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center;">
            <div style="background: var(--m-bg); padding: 6px; border-radius: 6px; border: 1px solid var(--m-border);">
              <div style="font-size: 0.65rem; color: var(--m-text-muted); font-weight: 600;">YAPILDI</div>
              <div style="font-size: 1.05rem; font-weight: 800; color: var(--m-success);">${done}</div>
            </div>
            <div style="background: var(--m-bg); padding: 6px; border-radius: 6px; border: 1px solid var(--m-border);">
              <div style="font-size: 0.65rem; color: var(--m-text-muted); font-weight: 600;">YAPILMADI</div>
              <div style="font-size: 1.05rem; font-weight: 800; color: var(--m-danger);">${notDone}</div>
            </div>
            <div style="background: var(--m-bg); padding: 6px; border-radius: 6px; border: 1px solid var(--m-border);">
              <div style="font-size: 0.65rem; color: var(--m-text-muted); font-weight: 600;">EKSİK</div>
              <div style="font-size: 1.05rem; font-weight: 800; color: #f59e0b;">${incomplete}</div>
            </div>
          </div>
        </div>
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--m-text-muted); margin: 0.75rem 0 0.4rem 0.2rem; text-transform: uppercase;">Ödevler Listesi (${hws.length} Kayıt)</div>
        <div class="m-std-list-container">${hwListHtml}</div>
      `;
    }

    // 4. Sekme: Sınavlar
    const examsPane = document.getElementById('m-std-tab-exams');
    if (examsPane) {
      const weekly = (state.weeklyEvaluations || []).filter(e => {
        return (e.examScores && (e.examScores[student.id] !== undefined || e.examScores[String(student.id)] !== undefined)) ||
               (e.studentResults && (e.studentResults[student.id] || e.studentResults[String(student.id)]));
      });

      const written = (state.writtenExams || []).filter(w => {
        return w.scores && (w.scores[student.id] !== undefined || w.scores[String(student.id)] !== undefined);
      });

      let allExamScores = [];
      weekly.forEach(e => {
        let sc = null;
        if (e.examScores && (e.examScores[student.id] !== undefined || e.examScores[String(student.id)] !== undefined)) {
          sc = e.examScores[student.id] !== undefined ? e.examScores[student.id] : e.examScores[String(student.id)];
        } else if (e.studentResults && (e.studentResults[student.id] || e.studentResults[String(student.id)])) {
          const res = e.studentResults[student.id] || e.studentResults[String(student.id)];
          sc = (typeof res === 'object') ? res.score : res;
        }
        if (sc !== null && sc !== undefined && sc !== '') {
          const num = parseFloat(sc);
          if (!isNaN(num)) allExamScores.push(num);
        }
      });
      written.forEach(w => {
        const sc = w.scores[student.id] !== undefined ? w.scores[student.id] : w.scores[String(student.id)];
        if (sc !== null && sc !== undefined && sc !== '') {
          const num = parseFloat(sc);
          if (!isNaN(num)) allExamScores.push(num);
        }
      });

      const avgScore = allExamScores.length > 0 ? (allExamScores.reduce((a, b) => a + b, 0) / allExamScores.length).toFixed(1) : '-';

      let weeklyListHtml = '';
      if (weekly.length === 0) {
        weeklyListHtml = '<div style="font-size: 0.78rem; color: var(--m-text-muted); padding: 0.5rem 0;">Haftalık sınav kaydı yok.</div>';
      } else {
        weeklyListHtml = weekly.map(exam => {
          let score = exam.examScores ? (exam.examScores[student.id] !== undefined ? exam.examScores[student.id] : exam.examScores[String(student.id)]) : '-';
          const res = exam.studentResults ? (exam.studentResults[student.id] || exam.studentResults[String(student.id)]) : null;
          let statsStr = '';
          if (res) {
            statsStr = `${res.correct || 0}D / ${res.wrong || 0}Y / ${res.blank || 0}B • Net: ${typeof res.net === 'number' ? res.net.toFixed(1) : (res.net || '-')}`;
          }
          const eInfo = typeof window.getEducationWeekInfo === 'function' ? window.getEducationWeekInfo(exam.weekId) : null;
          const weekLabel = eInfo ? eInfo.shortLabel : (window.formatWeekTR ? window.formatWeekTR(exam.weekId, 'short') : ((exam.weekId || '').split('-W')[1] ? `${(exam.weekId || '').split('-W')[1]}. Hafta` : ''));
          return `
            <div class="m-std-card-item">
              <div style="min-width: 0; flex: 1;">
                <div style="font-size: 0.86rem; font-weight: 700; color: var(--m-text);">${escapeHTML(exam.examName || 'Haftalık Değerlendirme')}</div>
                <div style="font-size: 0.72rem; color: var(--m-text-muted);">${weekLabel ? `${weekLabel} • ` : ''}${statsStr || 'Detay Yok'}</div>
              </div>
              <div class="student-card-score" style="font-size: 0.85rem;">
                ${score} Puan
              </div>
            </div>
          `;
        }).join('');
      }

      let writtenListHtml = '';
      if (written.length === 0) {
        writtenListHtml = '<div style="font-size: 0.78rem; color: var(--m-text-muted); padding: 0.5rem 0;">Yazılı sınav kaydı yok.</div>';
      } else {
        writtenListHtml = written.map(w => {
          const score = w.scores[student.id] !== undefined ? w.scores[student.id] : w.scores[String(student.id)];
          const dateStr = w.date ? new Date(w.date).toLocaleDateString('tr-TR') : '-';
          return `
            <div class="m-std-card-item">
              <div style="min-width: 0; flex: 1;">
                <div style="font-size: 0.86rem; font-weight: 700; color: var(--m-text);">${escapeHTML(w.title || 'Yazılı Sınav')}</div>
                <div style="font-size: 0.72rem; color: var(--m-text-muted);">${escapeHTML(w.subject || '')} • Tarih: ${dateStr}</div>
              </div>
              <div class="student-card-score" style="background: rgba(16, 185, 129, 0.15); color: var(--m-success); font-size: 0.85rem;">
                ${score} Puan
              </div>
            </div>
          `;
        }).join('');
      }

      examsPane.innerHTML = `
        <div class="m-std-summary-card">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; text-align: center;">
            <div style="background: var(--m-bg); padding: 8px; border-radius: 6px; border: 1px solid var(--m-border);">
              <div style="font-size: 0.65rem; color: var(--m-text-muted); font-weight: 600;">GENEL SINAV ORTALAMASI</div>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--m-primary);">${avgScore !== '-' ? `${avgScore} Puan` : '-'}</div>
            </div>
            <div style="background: var(--m-bg); padding: 8px; border-radius: 6px; border: 1px solid var(--m-border);">
              <div style="font-size: 0.65rem; color: var(--m-text-muted); font-weight: 600;">TOPLAM SINAV</div>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--m-text);">${allExamScores.length} Sınav</div>
            </div>
          </div>
        </div>
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--m-text-muted); margin: 0.75rem 0 0.4rem 0.2rem; text-transform: uppercase;">Haftalık Sınavlar</div>
        <div class="m-std-list-container" style="margin-bottom: 0.85rem;">${weeklyListHtml}</div>
        ${written.length > 0 ? `
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--m-text-muted); margin: 0.75rem 0 0.4rem 0.2rem; text-transform: uppercase;">Yazılı Sınavlar</div>
          <div class="m-std-list-container">${writtenListHtml}</div>
        ` : ''}
      `;
    }
  }

  window.deleteStudentPerformanceEntry = async function(perfId, studentId) {
    if (!window.stateManager) return;
    const confirmed = await (window.confirmAsync 
      ? window.confirmAsync('Bu puan kaydını silmek istediğinize emin misiniz?') 
      : Promise.resolve(confirm('Bu puan kaydını silmek istediğinize emin misiniz?')));
    if (!confirmed) return;

    window.stateManager.deletePerformance(perfId);
    showMobileToast('Puan kaydı silindi.');
    
    // Detay modalını tazele
    window.openStudentDetailModal(studentId);
    
    // Arka plandaki performans listesini de tazele
    renderPerformanceTab();
    
    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);
  };

  // ==========================================================================
  // 2. MODÜL: SERİ ÖDEV KONTROLÜ (1 GÜNLÜK LİSTE & SIRA GEZME MODU)
  // ==========================================================================
  function changeHwDate(deltaDays) {
    const parts = currentHwDate.split('-');
    const curDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    curDate.setDate(curDate.getDate() + deltaDays);
    currentHwDate = (typeof window.formatLocalDate === 'function')
      ? window.formatLocalDate(curDate)
      : `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}-${String(curDate.getDate()).padStart(2, '0')}`;
    window.vibrate(20);
    renderHomeworkTab();
  }

  function updateHwDateDisplay() {
    const titleEl = document.getElementById('hw-current-date-title');
    const subEl = document.getElementById('hw-current-date-sub');
    if (!titleEl) return;

    const todayStr = getTodayDateStr();
    const parts = currentHwDate.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    const dayName = days[d.getDay()];
    const dateFormatted = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${dayName}`;

    if (currentHwDate === todayStr) {
      titleEl.innerHTML = `<span class="hw-today-badge">Bugün</span> ${dateFormatted}`;
    } else {
      titleEl.textContent = dateFormatted;
    }

    if (subEl) {
      const state = window.stateManager ? window.stateManager.loadState() : null;
      const hw = (state && state.homeworks) ? state.homeworks.find(h => h.dueDate === currentHwDate) : null;
      if (hw && hw.title) {
        subEl.textContent = `📚 ${hw.title}`;
      } else {
        subEl.textContent = '📅 Günlük Ödev Kontrolü';
      }
    }
  }

  function renderHomeworkTab() {
    const students = getFilteredStudents();
    const walkContainer = document.getElementById('hw-walk-container');
    const listWrapper = document.getElementById('hw-list-wrapper');
    const toggleWalkBtn = document.getElementById('btn-hw-mode-walk');
    const toggleListBtn = document.getElementById('btn-hw-mode-list');

    if (toggleWalkBtn && toggleListBtn) {
      toggleWalkBtn.classList.toggle('active', hwMode === 'walk');
      toggleListBtn.classList.toggle('active', hwMode === 'list');
    }

    updateHwDateDisplay();

    if (hwMode === 'walk') {
      if (walkContainer) walkContainer.style.display = 'block';
      if (listWrapper) listWrapper.style.display = 'none';
      renderHomeworkWalkCard(students);
    } else {
      if (walkContainer) walkContainer.style.display = 'none';
      if (listWrapper) listWrapper.style.display = 'block';
      renderHomeworkList(students);
    }
  }

  function renderHomeworkWalkCard(students) {
    const container = document.getElementById('hw-walk-card-inner');
    if (!container) return;

    if (students.length === 0) {
      container.innerHTML = `<p style="padding: 2rem; color: var(--m-text-muted);">Ödev kontrolü için öğrenci bulunamadı.</p>`;
      return;
    }

    if (hwWalkIndex >= students.length) hwWalkIndex = 0;
    if (hwWalkIndex < 0) hwWalkIndex = students.length - 1;

    const st = students[hwWalkIndex];
    const avatarColor = getAvatarColor(st.id || st.name);
    const record = (window.stateManager && typeof window.stateManager.getHomeworkRecord === 'function')
      ? window.stateManager.getHomeworkRecord(st.id, currentHwDate)
      : null;
    const curStatus = record ? record.status : 'none';
    const statusLabel = curStatus === 'completed' ? '✓ Yaptı (+)' : (curStatus === 'incomplete' || curStatus === 'partial') ? '/ Yarım (/)' : curStatus === 'missing' ? '✗ Yok (-)' : 'Henüz Kontrol Edilmedi';
    const statusColor = curStatus === 'completed' ? 'var(--m-success)' : (curStatus === 'incomplete' || curStatus === 'partial') ? 'var(--m-warning)' : curStatus === 'missing' ? 'var(--m-danger)' : 'var(--m-text-muted)';

    container.innerHTML = `
      <div class="hw-walk-counter">Sıradaki: ${hwWalkIndex + 1} / ${students.length} (%${Math.round(((hwWalkIndex + 1) / students.length) * 100)})</div>
      <div class="hw-walk-avatar" style="background-color: ${avatarColor};">
        ${st.photo ? `<img src="${st.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : escapeHTML(st.name.charAt(0).toUpperCase())}
      </div>
      <div class="hw-walk-name">${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}</div>
      <div class="hw-walk-no">${formatStudentSubtitle(st)}</div>

      <div style="margin-bottom: 1.25rem;">
        <span style="font-size: 0.78rem; font-weight: 700; color: ${statusColor}; background: var(--m-surface-subtle); padding: 4px 12px; border-radius: var(--m-radius-full); border: 1px solid var(--m-border);">
          Durum: ${statusLabel}
        </span>
      </div>

      <div class="hw-action-grid">
        <button class="hw-btn hw-btn-success" onclick="window.markHomeworkWalk('${st.id}', 'completed')">
          <i data-lucide="check" style="width: 26px; height: 26px;"></i>
          <span>Yaptı (+)</span>
        </button>
        <button class="hw-btn hw-btn-partial" onclick="window.markHomeworkWalk('${st.id}', 'incomplete')">
          <i data-lucide="minus" style="width: 26px; height: 26px;"></i>
          <span>Yarım (/)</span>
        </button>
        <button class="hw-btn hw-btn-danger" onclick="window.markHomeworkWalk('${st.id}', 'missing')">
          <i data-lucide="x" style="width: 26px; height: 26px;"></i>
          <span>Yok (-)</span>
        </button>
      </div>

      <div class="hw-nav-row">
        <button class="hw-nav-btn" onclick="window.prevHwStudent()"><i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i> Önceki</button>
        <button class="hw-nav-btn" onclick="window.nextHwStudent()">Sonraki <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i></button>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  window.markHomeworkWalk = (studentId, status) => {
    if (!window.stateManager) return;
    const normStatus = (status === 'partial') ? 'incomplete' : status;

    if (typeof window.stateManager.saveHomeworkRecord === 'function') {
      window.stateManager.saveHomeworkRecord(studentId, currentHwDate, normStatus);
    }
    window.vibrate(35);

    const st = getStudentByIdSafe(studentId);
    const statusText = normStatus === 'completed' ? 'Yaptı (+)' : normStatus === 'incomplete' ? 'Yarım (/)' : 'Yapmadı (-)';
    showMobileToast(`${st ? st.name : 'Öğrenci'}: ${statusText}`);

    // Otomatik bir sonraki öğrenciye geç
    const students = getFilteredStudents();
    if (hwWalkIndex < students.length - 1) {
      hwWalkIndex++;
    } else {
      hwWalkIndex = 0;
      showMobileToast('🎉 Tüm sınıfın ödev kontrolü tamamlandı!');
    }
    renderHomeworkWalkCard(students);
  };

  window.nextHwStudent = () => {
    const students = getFilteredStudents();
    if (hwWalkIndex < students.length - 1) hwWalkIndex++;
    else hwWalkIndex = 0;
    renderHomeworkWalkCard(students);
  };

  window.prevHwStudent = () => {
    const students = getFilteredStudents();
    if (hwWalkIndex > 0) hwWalkIndex--;
    else hwWalkIndex = students.length - 1;
    renderHomeworkWalkCard(students);
  };

  function renderHomeworkList(students) {
    const list = document.getElementById('hw-list-container');
    const summaryBar = document.getElementById('hw-list-summary-bar');
    if (!list) return;

    list.innerHTML = '';

    if (!students || students.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="clipboard-list" style="width: 36px; height: 36px; opacity: 0.5; margin-bottom: 0.5rem;"></i>
          <p style="font-weight: 600;">Ödev kontrolü için öğrenci bulunamadı.</p>
        </div>
      `;
      if (summaryBar) summaryBar.innerHTML = '';
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let countCompleted = 0;
    let countIncomplete = 0;
    let countMissing = 0;
    let countNone = 0;

    students.forEach(st => {
      const record = (window.stateManager && typeof window.stateManager.getHomeworkRecord === 'function')
        ? window.stateManager.getHomeworkRecord(st.id, currentHwDate)
        : null;
      const status = record ? record.status : 'none';

      if (status === 'completed') countCompleted++;
      else if (status === 'incomplete' || status === 'partial') countIncomplete++;
      else if (status === 'missing') countMissing++;
      else countNone++;

      const row = document.createElement('div');
      row.className = 'attendance-row';
      const avatarColor = getAvatarColor(st.id || st.name);

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background-color: ${avatarColor}; color: #fff; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${st.photo ? `<img src="${st.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : escapeHTML(st.name.charAt(0).toUpperCase())}
          </div>
          <div style="min-width: 0;">
            <div style="font-weight: 800; font-size: 0.92rem; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}
            </div>
            <div style="font-size: 0.72rem; color: var(--m-text-muted);">
              ${formatStudentSubtitle(st)}
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
          <button class="hw-status-btn btn-completed ${status === 'completed' ? 'active' : ''}"
                  title="Yaptı / Tam (+)"
                  onclick="window.toggleHwStatus('${st.id}', 'completed')">
            ✓
          </button>
          <button class="hw-status-btn btn-incomplete ${(status === 'incomplete' || status === 'partial') ? 'active' : ''}"
                  title="Yarım / Eksik (/)"
                  onclick="window.toggleHwStatus('${st.id}', 'incomplete')">
            /
          </button>
          <button class="hw-status-btn btn-missing ${status === 'missing' ? 'active' : ''}"
                  title="Yok / Yapılmadı (-)"
                  onclick="window.toggleHwStatus('${st.id}', 'missing')">
            ✗
          </button>
        </div>
      `;
      list.appendChild(row);
    });

    if (summaryBar) {
      summaryBar.innerHTML = `
        <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
          <span class="hw-stat-badge completed" title="Yaptı">✓ ${countCompleted}</span>
          <span class="hw-stat-badge incomplete" title="Yarım">/ ${countIncomplete}</span>
          <span class="hw-stat-badge missing" title="Yapmadı">✗ ${countMissing}</span>
          <span class="hw-stat-badge none" title="Bekliyor">⚪ ${countNone}</span>
        </div>
        <button class="hw-nav-btn" style="padding: 4px 10px; font-size: 0.75rem; background: var(--m-success-light); color: var(--m-success); border-color: var(--m-success);" onclick="window.markAllHomeworkCompleted()">
          <i data-lucide="check-check" style="width: 14px; height: 14px;"></i> Tümünü Yaptı Yap
        </button>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  window.toggleHwStatus = (studentId, newStatus) => {
    if (!window.stateManager) return;
    const currentRecord = (typeof window.stateManager.getHomeworkRecord === 'function')
      ? window.stateManager.getHomeworkRecord(studentId, currentHwDate)
      : null;
    const cur = currentRecord ? currentRecord.status : 'none';
    const targetStatus = (cur === newStatus) ? 'none' : newStatus;

    if (typeof window.stateManager.saveHomeworkRecord === 'function') {
      window.stateManager.saveHomeworkRecord(studentId, currentHwDate, targetStatus);
    }
    window.vibrate(30);

    const st = getStudentByIdSafe(studentId);
    const statusText = targetStatus === 'completed' ? 'Tam (+)' : targetStatus === 'incomplete' ? 'Yarım (/)' : targetStatus === 'missing' ? 'Yapılmadı (-)' : 'Temizlendi';
    showMobileToast(`${st ? st.name : 'Öğrenci'}: ${statusText}`);

    renderHomeworkTab();
  };

  window.markAllHomeworkCompleted = () => {
    if (!window.stateManager || typeof window.stateManager.saveHomeworkRecord !== 'function') return;
    const students = getFilteredStudents();
    students.forEach(st => {
      window.stateManager.saveHomeworkRecord(st.id, currentHwDate, 'completed');
    });
    window.vibrate(50);
    showMobileToast('Tüm öğrencilerin ödevi "Yaptı" olarak işaretlendi.');
    renderHomeworkTab();
  };

  // ==========================================================================
  // 3. MODÜL: CEP KİTAPLIĞI (İKİ SEKME: ŞU AN OKUNANLAR & ÖĞRENCİ KİTAPLIĞI)
  // ==========================================================================
  let currentBooksSubTab = 'reading'; // 'reading' | 'library' | 'catalog'
  let selectedBooksStudentId = null;
  let catalogSearchTerm = '';
  let catalogFolderFilter = 'all';

  window.toggleBooksFabMenu = () => {
    window.vibrate(15);
    const menu = document.getElementById('m-books-fab-menu');
    const btn = document.getElementById('m-books-fab-btn');
    if (!menu) return;
    const isShowing = menu.classList.toggle('show');
    if (btn) {
      btn.classList.toggle('active', isShowing);
    }
  };

  window.switchBooksSubTab = (subTab) => {
    currentBooksSubTab = subTab;
    window.vibrate(20);

    const menu = document.getElementById('m-books-fab-menu');
    const fabBtn = document.getElementById('m-books-fab-btn');
    if (menu) menu.classList.remove('show');
    if (fabBtn) fabBtn.classList.remove('active');

    const btnReading = document.getElementById('btn-books-subtab-reading');
    const btnLibrary = document.getElementById('btn-books-subtab-library');
    const btnCatalog = document.getElementById('btn-books-subtab-catalog');
    const paneReading = document.getElementById('books-pane-reading');
    const paneLibrary = document.getElementById('books-pane-library');
    const paneCatalog = document.getElementById('books-pane-catalog');

    if (btnReading) btnReading.classList.toggle('active', subTab === 'reading');
    if (btnLibrary) btnLibrary.classList.toggle('active', subTab === 'library');
    if (btnCatalog) btnCatalog.classList.toggle('active', subTab === 'catalog');
    if (paneReading) paneReading.style.display = (subTab === 'reading') ? 'block' : 'none';
    if (paneLibrary) paneLibrary.style.display = (subTab === 'library') ? 'block' : 'none';
    if (paneCatalog) paneCatalog.style.display = (subTab === 'catalog') ? 'block' : 'none';

    // FAB menu active indicators
    const fabReading = document.getElementById('fab-item-reading');
    const fabLibrary = document.getElementById('fab-item-library');
    const fabCatalog = document.getElementById('fab-item-catalog');
    if (fabReading) fabReading.classList.toggle('active', subTab === 'reading');
    if (fabLibrary) fabLibrary.classList.toggle('active', subTab === 'library');
    if (fabCatalog) fabCatalog.classList.toggle('active', subTab === 'catalog');

    // Header title & subtitle
    const activeTitle = document.getElementById('m-books-active-title');
    const activeSub = document.getElementById('m-books-active-subtitle');
    if (activeTitle && activeSub) {
      if (subTab === 'reading') {
        activeTitle.innerHTML = '📖 Şu An Okunanlar';
        activeSub.textContent = 'Ödünçteki kitaplar ve teslim durumları';
      } else if (subTab === 'library') {
        activeTitle.innerHTML = '👤 Öğrenci Kitaplığı';
        activeSub.textContent = 'Öğrencinin okuduğu kitaplar ve okuma istatistikleri';
      } else if (subTab === 'catalog') {
        activeTitle.innerHTML = '📚 Kütüphane Kitaplığı';
        activeSub.textContent = 'Kitap listesi, soru havuzu ve detaylar';
      }
    }

    renderBooksTab();
  };

  function renderBooksTab() {
    if (currentBooksSubTab === 'reading') {
      renderBooksReadingPane();
    } else if (currentBooksSubTab === 'library') {
      renderBooksLibraryPane();
    } else if (currentBooksSubTab === 'catalog') {
      renderBooksCatalogPane();
    }
    if (window.lucide) window.lucide.createIcons();
  }

  // 1. SEKME: ŞU AN OKUNANLAR (ÖĞRENCİ BAZLI GRUPLAMA & ÇOKLU KİTAP İÇİN ÜST ÜSTE OTURMUŞ KARTLAR)
  function renderBooksReadingPane() {
    const container = document.getElementById('m-books-reading-list');
    const badge = document.getElementById('books-reading-count-badge');
    if (!container) return;

    container.innerHTML = '';
    if (!window.stateManager) return;

    const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);
    const bookSettings = (typeof window.stateManager.getBookSettings === 'function') ? window.stateManager.getBookSettings() : {};

    // Sadece şu an okunanlar (status === 'reading')
    const activeTx = transactions.filter(t => t.status === 'reading');
    
    // Öğrenci bazında grupla
    const studentGroups = new Map();
    activeTx.forEach(t => {
      const student = getStudentByIdSafe(t.studentId);
      const book = books.find(b => b.id === t.bookId);
      if (!student || !book) return;

      const bDateStr = (t.borrowDate || '').split('T')[0];
      const todayStr = getTodayDateStr();
      const bParts = bDateStr ? bDateStr.split('-').map(Number) : [2026, 1, 1];
      const tParts = todayStr.split('-').map(Number);
      const dBorrow = new Date(bParts[0], bParts[1] - 1, bParts[2]);
      const dToday = new Date(tParts[0], tParts[1] - 1, tParts[2]);
      const diffDays = Math.max(0, Math.round((dToday - dBorrow) / (1000 * 60 * 60 * 24)));

      const isLevel2 = (book.level === 'seviye_2');
      const lvlSettings = isLevel2 ? (bookSettings.level2 || {}) : (bookSettings.level1 || {});
      const limitDays = parseInt(lvlSettings.readingLimitDays || lvlSettings.limitDays) || (isLevel2 ? 7 : (bookSettings.limitDays || 4));

      const overdueDays = diffDays - limitDays;
      const isOverdue = overdueDays > 0;

      const item = {
        transaction: t,
        student,
        book,
        diffDays,
        limitDays,
        overdueDays,
        isOverdue
      };

      if (!studentGroups.has(t.studentId)) {
        studentGroups.set(t.studentId, {
          student,
          items: []
        });
      }
      studentGroups.get(t.studentId).items.push(item);
    });

    const studentEntries = Array.from(studentGroups.values());

    // Sıralama: En çok gecikmesi olan öğrenciler en üstte
    studentEntries.forEach(entry => {
      entry.items.sort((a, b) => b.overdueDays - a.overdueDays);
      entry.maxOverdue = Math.max(...entry.items.map(it => it.overdueDays));
      entry.hasOverdue = entry.items.some(it => it.isOverdue);
    });

    studentEntries.sort((a, b) => {
      if (b.maxOverdue !== a.maxOverdue) {
        return b.maxOverdue - a.maxOverdue;
      }
      return b.items.length - a.items.length;
    });

    const totalActiveBooks = activeTx.length;
    const totalOverdueBooks = studentEntries.reduce((acc, entry) => acc + entry.items.filter(it => it.isOverdue).length, 0);

    if (badge) {
      badge.textContent = `${totalActiveBooks} Kitap (${studentEntries.length} Öğrenci)${totalOverdueBooks > 0 ? ` • ${totalOverdueBooks} Gecikmeli` : ''}`;
      badge.style.color = totalOverdueBooks > 0 ? 'var(--m-danger)' : 'var(--m-text-muted)';
    }

    if (studentEntries.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="book-check" style="width: 44px; height: 44px; margin-bottom: 0.5rem; opacity: 0.5;"></i>
          <p style="font-weight: 700;">Şu anda ödünçte kitap yok.</p>
          <p style="font-size: 0.8rem; margin-top: 0.25rem;">Yukarıdaki <strong>+ Kitap Ekle</strong> ve <strong>+ Kitap Ver</strong> butonları ile kitap dağıtabilirsiniz.</p>
        </div>
      `;
      return;
    }

    studentEntries.forEach(entry => {
      const student = entry.student;
      const items = entry.items;
      const isMulti = items.length > 1;
      const hasOverdue = entry.hasOverdue;

      const card = document.createElement('div');
      card.className = `book-reading-card ${isMulti ? 'is-multi-book' : ''} ${hasOverdue ? 'is-overdue' : 'is-ontime'}`;
      card.onclick = () => window.openManageStudentBooksModal(student.id);

      const avatarColor = getAvatarColor(student.id || student.name);

      let delayHtml = '';
      if (isMulti) {
        const overdueCount = items.filter(it => it.isOverdue).length;
        if (overdueCount > 0) {
          delayHtml = `<span class="book-delay-badge overdue">⚠️ ${overdueCount} kitap makul süreyi aştı</span>`;
        } else {
          delayHtml = `<span class="book-delay-badge ontime">✓ ${items.length} kitap da süresinde</span>`;
        }
      } else {
        const item = items[0];
        if (item.isOverdue) {
          delayHtml = `<span class="book-delay-badge overdue">⚠️ ${item.overdueDays} gün gecikti (Makul: ${item.limitDays} gün)</span>`;
        } else if (item.diffDays === item.limitDays) {
          delayHtml = `<span class="book-delay-badge ontime" style="background: var(--m-warning-light); color: var(--m-warning);">⏳ Son gün (${item.diffDays}/${item.limitDays} gün)</span>`;
        } else {
          const remaining = item.limitDays - item.diffDays;
          delayHtml = `<span class="book-delay-badge ontime">✓ Süresinde (${remaining} gün kaldı)</span>`;
        }
      }

      let booksListHtml = '';
      if (isMulti) {
        booksListHtml = `
          <div style="margin: 4px 0 6px 0; display: flex; flex-direction: column; gap: 3px;">
            ${items.map((it, idx) => `
              <div style="font-size: 0.82rem; font-weight: 700; color: var(--m-primary); display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📖 ${idx + 1}. ${escapeHTML(it.book.title)}</span>
                ${it.isOverdue ? `<span style="font-size: 0.68rem; color: var(--m-danger); font-weight: 800; flex-shrink: 0;">+${it.overdueDays} gün</span>` : `<span style="font-size: 0.68rem; color: var(--m-success); font-weight: 700; flex-shrink: 0;">(Süresinde)</span>`}
              </div>
            `).join('')}
          </div>
        `;
      } else {
        const item = items[0];
        booksListHtml = `
          <div class="book-title-text">${escapeHTML(item.book.title)}</div>
          <div class="book-meta-sub">
            <span>Veriliş: ${item.diffDays} gün önce</span> • <span>${item.book.pages ? item.book.pages + ' sayfa' : 'Sayfa belirtilmemiş'}</span>
          </div>
        `;
      }

      card.innerHTML = `
        <div style="width: 44px; height: 44px; border-radius: 50%; background: ${avatarColor}; color: #fff; font-weight: 800; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative;">
          ${student.photo ? `<img src="${student.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : escapeHTML(student.name.charAt(0).toUpperCase())}
          ${isMulti ? `<div style="position: absolute; bottom: -4px; right: -4px; background: var(--m-primary); color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.68rem; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--m-surface);">${items.length}</div>` : ''}
        </div>
        <div class="book-info-col">
          <div class="book-student-name">
            <span>${escapeHTML(student.name)} ${escapeHTML(student.surname || '')}</span>
            <span style="font-size: 0.72rem; color: var(--m-text-muted); font-weight: 600;">(No: ${escapeHTML(student.number || '-')})</span>
            ${isMulti ? `<span class="multi-book-badge">📚 ${items.length} Kitap</span>` : ''}
          </div>
          ${booksListHtml}
          <div>${delayHtml}</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 4px; flex-shrink: 0;">
          <span style="font-size: 0.74rem; color: var(--m-primary); font-weight: 700; display: flex; align-items: center; gap: 2px;">
            İşlemler <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
          </span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // 2. SEKME: ÖĞRENCİ KİTAPLIĞI
  function renderBooksLibraryPane() {
    const select = document.getElementById('m-books-student-select');
    const statsContainer = document.getElementById('m-books-student-stats');
    const historyList = document.getElementById('m-books-student-history');
    const countBadge = document.getElementById('m-books-history-count');
    if (!select || !statsContainer || !historyList) return;

    if (!window.stateManager) return;
    const students = getFilteredStudents();

    if (students.length === 0) {
      statsContainer.innerHTML = '<p style="color: var(--m-text-muted); padding: 1rem;">Öğrenci bulunamadı.</p>';
      historyList.innerHTML = '';
      return;
    }

    // Seçili öğrenci yoksa ilk öğrenciyi seç
    if (!selectedBooksStudentId || !students.some(s => String(s.id) === String(selectedBooksStudentId))) {
      selectedBooksStudentId = students[0].id;
    }

    // Select kutusunu güncelle
    select.innerHTML = students.map(s => `
      <option value="${s.id}" ${String(s.id) === String(selectedBooksStudentId) ? 'selected' : ''}>
        ${escapeHTML(s.name)} ${escapeHTML(s.surname || '')} (${s.number || '-'})${isMiddleSchool() && s.branch ? ' • ' + s.branch : ''}
      </option>
    `).join('');

    const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);

    const studentTx = transactions.filter(t => String(t.studentId) === String(selectedBooksStudentId));
    const completedTx = studentTx.filter(t => t.status === 'returned');
    const activeTx = studentTx.find(t => t.status === 'reading');

    // Toplam sayfa ve kitap sayısı
    let totalPages = 0;
    completedTx.forEach(t => {
      const book = books.find(b => b.id === t.bookId);
      if (book && book.pages) {
        totalPages += parseInt(book.pages) || 0;
      }
    });

    const activeBook = activeTx ? books.find(b => b.id === activeTx.bookId) : null;

    statsContainer.innerHTML = `
      <div class="books-stat-card">
        <div class="books-stat-num">${completedTx.length}</div>
        <div class="books-stat-lbl">Okunan Kitap</div>
      </div>
      <div class="books-stat-card">
        <div class="books-stat-num">${totalPages}</div>
        <div class="books-stat-lbl">Toplam Sayfa</div>
      </div>
      <div class="books-stat-card" style="${activeBook ? 'border-color: var(--m-primary);' : ''}">
        <div class="books-stat-num" style="font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 4px;">
          ${activeBook ? escapeHTML(activeBook.title) : 'Yok'}
        </div>
        <div class="books-stat-lbl">${activeBook ? 'Şu An Okuyor' : 'Aktif Kitap Yok'}</div>
      </div>
    `;

    if (countBadge) {
      countBadge.textContent = `${completedTx.length} Kitap Teslim Edildi`;
    }

    if (completedTx.length === 0) {
      historyList.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="book-open" style="width: 36px; height: 36px; opacity: 0.4; margin-bottom: 0.5rem;"></i>
          <p style="font-weight: 700;">Bu öğrenci henüz teslim edilmiş bir kitap okumamış.</p>
        </div>
      `;
      return;
    }

    // Ters kronolojik sıralama (son teslim edilen en üstte)
    completedTx.sort((a, b) => new Date(b.returnDate || b.borrowDate) - new Date(a.returnDate || a.borrowDate));

    historyList.innerHTML = '';
    completedTx.forEach(t => {
      const book = books.find(b => b.id === t.bookId) || { title: 'Bilinmeyen Kitap', pages: 0, author: '-' };
      const item = document.createElement('div');
      item.className = 'books-history-item';
      item.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 800; font-size: 0.9rem; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHTML(book.title)}
          </div>
          <div style="font-size: 0.72rem; color: var(--m-text-muted); margin-top: 2px;">
            <span>${escapeHTML(book.author || 'Yazar Belirtilmemiş')}</span> • <span>${book.pages || 0} Sayfa</span>
          </div>
          <div style="font-size: 0.7rem; color: var(--m-primary); margin-top: 3px; font-weight: 600;">
            📅 Teslim: ${t.returnDate || 'Tamamlandı'} (Veriliş: ${t.borrowDate || '-'})
          </div>
        </div>
        <div style="background: var(--m-success-light); color: var(--m-success); padding: 4px 8px; border-radius: var(--m-radius-sm); font-size: 0.75rem; font-weight: 800;">
          ✓ Okundu
        </div>
      `;
      historyList.appendChild(item);
    });
  }

  window.selectBooksStudent = (studentId) => {
    selectedBooksStudentId = studentId;
    window.vibrate(15);
    renderBooksLibraryPane();
    if (window.lucide) window.lucide.createIcons();
  };

  // ==========================================================================
  // YENİ KİTAP EKLE MODALI
  // ==========================================================================
  window.openAddBookModal = () => {
    window.vibrate(15);
    const titleInput = document.getElementById('m-new-book-title');
    const authorInput = document.getElementById('m-new-book-author');
    const pagesInput = document.getElementById('m-new-book-pages');
    const noInput = document.getElementById('m-new-book-no');
    const levelSelect = document.getElementById('m-new-book-level');

    if (titleInput) titleInput.value = '';
    if (authorInput) authorInput.value = '';
    if (pagesInput) pagesInput.value = '';
    if (noInput) noInput.value = '';
    if (levelSelect) levelSelect.value = 'seviye_1';

    window.openBottomSheet('modal-add-book');
    setTimeout(() => {
      if (titleInput) titleInput.focus();
    }, 250);
  };

  window.saveNewBook = () => {
    const titleInput = document.getElementById('m-new-book-title');
    const authorInput = document.getElementById('m-new-book-author');
    const pagesInput = document.getElementById('m-new-book-pages');
    const noInput = document.getElementById('m-new-book-no');
    const levelSelect = document.getElementById('m-new-book-level');

    const title = titleInput ? titleInput.value.trim() : '';
    if (!title) {
      showMobileToast('Lütfen kitap adını girin');
      if (titleInput) titleInput.focus();
      return;
    }

    const author = (authorInput && authorInput.value.trim()) ? authorInput.value.trim() : 'Bilinmiyor';
    const pages = pagesInput ? (parseInt(pagesInput.value) || 0) : 0;
    const bookNo = noInput ? noInput.value.trim() : '';
    const level = levelSelect ? levelSelect.value : 'seviye_1';

    if (!window.stateManager) {
      showMobileToast('Veri motoru yüklenemedi');
      return;
    }

    let added = null;
    if (typeof window.stateManager.addBook === 'function') {
      added = window.stateManager.addBook({
        title,
        author,
        pages,
        bookNo,
        level
      });
      if (!added) return; // Demo limit hit or error
    } else {
      if (!window.stateManager.state.books) window.stateManager.state.books = { library: [], transactions: [] };
      if (!window.stateManager.state.books.library) window.stateManager.state.books.library = [];

      added = {
        id: 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title,
        author,
        pages,
        bookNo,
        level,
        createdAt: new Date().toISOString()
      };
      window.stateManager.state.books.library.push(added);
      window.stateManager.saveState();
    }

    window.vibrate(30);
    playSynthChime('correct');
    showMobileToast(`✅ "${title}" kütüphaneye eklendi!`);
    window.closeBottomSheet();

    // Paneli güncelle
    renderBooksTab();
  };

  // ==========================================================================
  // KİTAP VER MODALI
  // ==========================================================================
  window.openGiveBookModal = (preselectedStudentId = null) => {
    if (!window.stateManager) return;
    const students = getFilteredStudents();
    const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);

    // Şu an başkasında olan kitapların ID'leri
    const currentlyReadingBookIds = new Set(
      transactions.filter(t => t.status === 'reading').map(t => t.bookId)
    );

    // Kütüphanede müsait olan kitaplar
    const availableBooks = books.filter(b => !currentlyReadingBookIds.has(b.id));

    const stSelect = document.getElementById('m-give-book-student');
    const bkSelect = document.getElementById('m-give-book-book');
    const dateInput = document.getElementById('m-give-book-date');

    if (stSelect) {
      stSelect.innerHTML = students.map(s => `
        <option value="${s.id}" ${s.id === preselectedStudentId ? 'selected' : ''}>
          ${escapeHTML(s.name)} ${escapeHTML(s.surname || '')} (${s.number || '-'})${isMiddleSchool() && s.branch ? ' • ' + s.branch : ''}
        </option>
      `).join('');
    }

    if (bkSelect) {
      if (availableBooks.length === 0) {
        bkSelect.innerHTML = '<option value="">(Kütüphanede müsait kitap yok)</option>';
      } else {
        bkSelect.innerHTML = availableBooks.map(b => `
          <option value="${b.id}">
            ${escapeHTML(b.title)} - ${escapeHTML(b.author || '')} (${b.pages || 0} Sayfa)
          </option>
        `).join('');
      }
    }

    if (dateInput) {
      dateInput.value = getTodayDateStr();
    }

    openBottomSheet('modal-give-book');
  };

  window.submitGiveBook = () => {
    const stSelect = document.getElementById('m-give-book-student');
    const bkSelect = document.getElementById('m-give-book-book');
    const dateInput = document.getElementById('m-give-book-date');

    if (!stSelect || !bkSelect) return;
    const studentId = stSelect.value;
    const bookId = bkSelect.value;
    const borrowDate = dateInput ? (dateInput.value || getTodayDateStr()) : getTodayDateStr();

    if (!studentId) {
      showMobileToast('❌ Lütfen bir öğrenci seçin');
      return;
    }
    if (!bookId) {
      showMobileToast('❌ Lütfen verilecek bir kitap seçin');
      return;
    }

    const res = window.stateManager.borrowBook(studentId, bookId, borrowDate);
    if (res && res.success) {
      window.vibrate(35);
      const student = getStudentByIdSafe(studentId);
      const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
      const book = books.find(b => b.id === bookId);
      showMobileToast(`📖 "${book ? book.title : 'Kitap'}" ${student ? student.name : 'öğrenciye'} verildi!`);
      closeBottomSheet();
      renderBooksTab();
    } else {
      showMobileToast(res ? res.message : '❌ Kitap verilemedi');
    }
  };

  // ==========================================================================
  // KİTAP YÖNETİM & TESLİM ALMA & ÖNERİ MODALI (ÇOKLU KİTAP DESTEĞİ)
  // ==========================================================================
  window.openManageStudentBooksModal = (studentId) => {
    if (!window.stateManager) return;
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);
    const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const bookSettings = (typeof window.stateManager.getBookSettings === 'function') ? window.stateManager.getBookSettings() : {};
    const student = getStudentByIdSafe(studentId);
    if (!student) return;

    // Bu öğrencinin şu anda okuduğu tüm kitapları bul
    const activeStudentTx = transactions.filter(t => t.studentId === studentId && t.status === 'reading');

    if (activeStudentTx.length === 0) {
      showMobileToast('Bu öğrencinin şu anda okuduğu kitap kalmadı.');
      window.closeBottomSheet();
      renderBooksTab();
      return;
    }

    const items = [];
    activeStudentTx.forEach(t => {
      const book = books.find(b => b.id === t.bookId);
      if (!book) return;

      const bDateStr = (t.borrowDate || '').split('T')[0];
      const todayStr = getTodayDateStr();
      const bParts = bDateStr ? bDateStr.split('-').map(Number) : [2026, 1, 1];
      const tParts = todayStr.split('-').map(Number);
      const dBorrow = new Date(bParts[0], bParts[1] - 1, bParts[2]);
      const dToday = new Date(tParts[0], tParts[1] - 1, tParts[2]);
      const diffDays = Math.max(0, Math.round((dToday - dBorrow) / (1000 * 60 * 60 * 24)));

      const isLevel2 = (book.level === 'seviye_2');
      const lvlSettings = isLevel2 ? (bookSettings.level2 || {}) : (bookSettings.level1 || {});
      const limitDays = parseInt(lvlSettings.readingLimitDays || lvlSettings.limitDays) || (isLevel2 ? 7 : 4);
      const overdueDays = diffDays - limitDays;
      const isOverdue = overdueDays > 0;

      items.push({
        transaction: t,
        book,
        diffDays,
        limitDays,
        overdueDays,
        isOverdue
      });
    });

    const titleEl = document.getElementById('m-manage-book-header-title');
    const bodyEl = document.getElementById('m-manage-book-body');
    if (titleEl) {
      titleEl.innerHTML = `👤 ${escapeHTML(student.name)} ${escapeHTML(student.surname || '')} <span style="font-size: 0.78rem; font-weight: 600; color: var(--m-text-muted);">(${items.length} Kitap)</span>`;
    }

    if (!bodyEl) return;

    bodyEl.innerHTML = `
      <div style="font-size: 0.8rem; color: var(--m-text-muted); margin-bottom: 0.85rem; line-height: 1.45;">
        ${items.length > 1 ? `Öğrencinin okumakta olduğu <strong>${items.length} kitap</strong> aşağıdadır. Dilediğiniz kitabı tek tek teslim alabilirsiniz:` : 'Öğrencinin okumakta olduğu kitap:'}
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 1.25rem;">
        ${items.map(it => `
          <div class="multi-book-item-card ${it.isOverdue ? 'is-overdue' : 'is-ontime'}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 800; font-size: 0.95rem; color: var(--m-primary);">${escapeHTML(it.book.title)}</div>
                <div style="font-size: 0.76rem; color: var(--m-text-muted); margin-top: 2px;">
                  ${escapeHTML(it.book.author || 'Yazar Belirtilmemiş')} • ${it.book.pages || 0} Sayfa • <span class="badge" style="background: ${it.book.level === 'seviye_2' ? '#9333ea' : 'var(--m-success)'}; color: white; padding: 1px 6px; border-radius: 8px; font-size: 0.68rem; font-weight: 700;">${it.book.level === 'seviye_2' ? '2. Seviye' : '1. Seviye'}</span>
                </div>
                <div style="font-size: 0.74rem; color: var(--m-text-secondary); margin-top: 5px;">
                  📅 Veriliş: <strong>${it.diffDays} gün önce</strong> (${it.transaction.borrowDate || '-'})
                </div>
              </div>
              <div style="flex-shrink: 0;">
                ${it.isOverdue ? `<span class="book-delay-badge overdue">⚠️ ${it.overdueDays} gün gecikti</span>` : `<span class="book-delay-badge ontime">✓ Süresinde (${it.limitDays - it.diffDays} gün kaldı)</span>`}
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 8px; border-top: 1px dashed var(--m-border);">
              <span style="font-size: 0.72rem; color: var(--m-text-muted);">Makul okuma süresi: ${it.limitDays} gün</span>
              <button class="m-btn-sm" style="background: linear-gradient(135deg, var(--m-success), #059669); color: white; border: none; font-weight: 700; padding: 6px 14px; gap: 6px; border-radius: var(--m-radius-sm); box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);" onclick="window.confirmReturnStudentBook('${it.transaction.id}', '${student.id}')">
                <i data-lucide="check-circle" style="width: 15px; height: 15px;"></i>
                <span>İade Al</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <button class="subview-secondary-btn" onclick="window.closeBottomSheet()">
        Kapat
      </button>
    `;

    openBottomSheet('modal-manage-reading-book');
    if (window.lucide) window.lucide.createIcons();
  };

  // Geriye dönük uyumluluk için alias
  window.openManageBookModal = (transactionId) => {
    if (!window.stateManager) return;
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);
    const t = transactions.find(item => item.id === transactionId);
    if (t) {
      window.openManageStudentBooksModal(t.studentId);
    }
  };

  window.confirmReturnStudentBook = (transactionId, studentId) => {
    if (!window.stateManager) return;
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);
    const t = transactions.find(item => item.id === transactionId);
    if (!t) return;

    const bookId = t.bookId;
    const student = getStudentByIdSafe(studentId);
    const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const returnedBook = books.find(b => b.id === bookId);

    // İade al
    window.stateManager.returnBook(transactionId);
    window.vibrate(35);
    playSynthChime('correct');

    // Performans puanı ekle
    if (window.stateManager.addPerformance && student && returnedBook) {
      const bookSettings = (typeof window.stateManager.getBookSettings === 'function') ? window.stateManager.getBookSettings() : {};
      const isLevel2 = (returnedBook.level === 'seviye_2');
      const lvlSettings = isLevel2 ? (bookSettings.level2 || {}) : (bookSettings.level1 || {});
      const limitDays = parseInt(lvlSettings.readingLimitDays || lvlSettings.limitDays) || (isLevel2 ? 7 : 4);

      const bDate = new Date(t.borrowDate);
      const diffDays = Math.max(0, Math.round((new Date() - bDate) / (1000 * 60 * 60 * 24)));
      const isOnTime = diffDays <= limitDays;
      const points = isOnTime ? (lvlSettings.ontime !== undefined ? lvlSettings.ontime : 10) : (lvlSettings.late !== undefined ? lvlSettings.late : 5);

      window.stateManager.addPerformance(
        student.id,
        points >= 0 ? 'positive' : 'development',
        points,
        `Kitap Teslim Edildi: ${returnedBook.title}${isOnTime ? ' (Zamanında)' : ' (Gecikmeli)'}`,
        window.stateManager.getSelectedWeek ? window.stateManager.getSelectedWeek() : '1'
      );
    }

    showMobileToast(`✅ "${returnedBook ? returnedBook.title : 'Kitap'}" teslim alındı!`);
    renderBooksTab();

    // Öğrencinin başka okuduğu kitap var mı kontrol et
    const updatedTransactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);
    const remainingActive = updatedTransactions.filter(item => item.studentId === studentId && item.status === 'reading');

    if (remainingActive.length > 0) {
      // Hala okuduğu kitap var: Modalı kalan kitaplarla anında yenile
      window.openManageStudentBooksModal(studentId);
    } else {
      // Tüm kitapları teslim edildi: Yeni kitap önerme ekranına geç
      renderBookSuggestionsStep(studentId);
    }
  };

  // Geriye dönük uyumluluk aliası
  window.confirmReturnBook = (transactionId) => {
    if (!window.stateManager) return;
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);
    const t = transactions.find(item => item.id === transactionId);
    if (t) {
      window.confirmReturnStudentBook(transactionId, t.studentId);
    }
  };

  function renderBookSuggestionsStep(studentId) {
    const bodyEl = document.getElementById('m-manage-book-body');
    const titleEl = document.getElementById('m-manage-book-header-title');
    if (!bodyEl) return;

    const student = getStudentByIdSafe(studentId);
    if (titleEl) titleEl.textContent = `🎉 Yeni Kitap Öner: ${student ? student.name : ''}`;

    const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);

    // Şu an başkalarında olan kitaplar
    const currentlyReadingBookIds = new Set(
      transactions.filter(t => t.status === 'reading').map(t => t.bookId)
    );

    // Bu öğrencinin daha önce okuduğu kitaplar
    const alreadyReadBookIds = new Set(
      transactions.filter(t => String(t.studentId) === String(studentId) && t.status === 'returned').map(t => t.bookId)
    );

    // Müsait kitaplar (başkasında olmayan)
    const availableBooks = books.filter(b => !currentlyReadingBookIds.has(b.id));

    // Öncelikli olarak öğrencinin henüz okumadığı kitaplar
    const unreadAvailable = availableBooks.filter(b => !alreadyReadBookIds.has(b.id));
    const suggestedBooks = unreadAvailable.length > 0 ? unreadAvailable : availableBooks;

    let suggestionsHtml = '';
    if (suggestedBooks.length === 0) {
      suggestionsHtml = `
        <div style="text-align: center; padding: 1.5rem; color: var(--m-text-muted);">
          <p>Kütüphanede şu an verilebilecek müsait kitap bulunamadı.</p>
        </div>
      `;
    } else {
      suggestionsHtml = suggestedBooks.slice(0, 5).map(b => `
        <div class="books-suggestion-item">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 800; font-size: 0.88rem; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHTML(b.title)}
            </div>
            <div style="font-size: 0.72rem; color: var(--m-text-muted);">
              ${escapeHTML(b.author || 'Yazar Belirtilmemiş')} • ${b.pages || 0} Sayfa
            </div>
          </div>
          <button class="btn-primary-action" style="padding: 0.4rem 0.75rem; font-size: 0.78rem;" onclick="window.quickAssignSuggestedBook('${studentId}', '${b.id}')">
            Seç ve Ver
          </button>
        </div>
      `).join('');
    }

    bodyEl.innerHTML = `
      <div style="text-align: center; margin-bottom: 1rem;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--m-success-light); color: var(--m-success); font-size: 1.5rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem auto;">
          ✓
        </div>
        <div style="font-weight: 800; font-size: 1.05rem; color: var(--m-text);">Kitap Başarıyla Teslim Alındı</div>
        <p style="font-size: 0.8rem; color: var(--m-text-muted); margin-top: 2px;">
          ${student ? student.name : 'Öğrenci'} için kütüphaneden aktif okuyabileceği kitaplar:
        </p>
      </div>

      <div class="books-suggestion-box">
        <div style="font-size: 0.8rem; font-weight: 800; color: var(--m-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 4px;">
          <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i> Önerilen Müsait Kitaplar
        </div>
        ${suggestionsHtml}
      </div>

      <button class="subview-secondary-btn" style="margin-top: 1rem;" onclick="window.closeBottomSheet()">
        Şimdilik Kitap Verme / Kapat
      </button>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  window.quickAssignSuggestedBook = (studentId, bookId) => {
    if (!window.stateManager) return;
    const res = window.stateManager.borrowBook(studentId, bookId, getTodayDateStr());
    if (res && res.success) {
      window.vibrate(35);
      const student = getStudentByIdSafe(studentId);
      const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
      const book = books.find(b => b.id === bookId);
      showMobileToast(`📖 "${book ? book.title : 'Kitap'}" ${student ? student.name : 'öğrenciye'} verildi!`);
      closeBottomSheet();
      renderBooksTab();
    } else {
      showMobileToast(res ? res.message : '❌ Kitap verilemedi');
    }
  };

  // ==========================================================================
  // 3. ALT SEKME: KİTAPLIK (KLASÖRLER HALİNDE & SORU EKLEME)
  // ==========================================================================
  window.filterCatalogBooks = (term) => {
    catalogSearchTerm = (term || '').trim().toLowerCase();
    renderBooksCatalogPane();
  };

  window.filterCatalogFolder = (filter) => {
    catalogFolderFilter = filter || 'all';
    window.vibrate(15);
    renderBooksCatalogPane();
  };

  function renderBooksCatalogPane() {
    const container = document.getElementById('m-catalog-folders-container');
    const countText = document.getElementById('m-catalog-count-text');
    if (!container) return;

    container.innerHTML = '';
    if (!window.stateManager) return;

    const allBooks = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);

    // Aktif okunan kitapların bilgisi (bookId -> readerName)
    const readingMap = {};
    transactions.filter(t => t.status === 'reading').forEach(t => {
      const student = getStudentByIdSafe(t.studentId);
      readingMap[t.bookId] = student ? `${student.name} ${student.surname || ''}`.trim() : 'Öğrenci';
    });

    // Filtreleme
    const filtered = allBooks.filter(b => {
      const isReading = !!readingMap[b.id];
      const level = b.level || 'seviye_1';

      if (catalogSearchTerm) {
        const titleMatch = (b.title || '').toLowerCase().includes(catalogSearchTerm);
        const authorMatch = (b.author || '').toLowerCase().includes(catalogSearchTerm);
        const noMatch = (b.bookNo || '').toLowerCase().includes(catalogSearchTerm);
        if (!titleMatch && !authorMatch && !noMatch) return false;
      }

      if (catalogFolderFilter === 'seviye_1' && level !== 'seviye_1') return false;
      if (catalogFolderFilter === 'seviye_2' && level !== 'seviye_2') return false;
      if (catalogFolderFilter === 'reading' && !isReading) return false;
      if (catalogFolderFilter === 'available' && isReading) return false;

      return true;
    });

    const totalReadingCount = Object.keys(readingMap).length;
    if (countText) {
      countText.textContent = `${filtered.length} Kitap (${totalReadingCount} Öğrencide)`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="book-x" style="width: 40px; height: 40px; opacity: 0.4; margin-bottom: 0.5rem;"></i>
          <p style="font-weight: 700;">Aramanıza uygun kitap bulunamadı.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Klasörlere Ayırma
    const folderGroups = [
      {
        id: 'folder-level-1',
        title: '📁 1. Seviye Kitaplar (Kolay / Başlangıç)',
        books: filtered.filter(b => (b.level || 'seviye_1') === 'seviye_1')
      },
      {
        id: 'folder-level-2',
        title: '📁 2. Seviye Kitaplar (İleri Seviye)',
        books: filtered.filter(b => b.level === 'seviye_2')
      },
      {
        id: 'folder-other',
        title: '📁 Genel / Diğer Kitaplar',
        books: filtered.filter(b => b.level && b.level !== 'seviye_1' && b.level !== 'seviye_2')
      }
    ].filter(f => f.books.length > 0);

    folderGroups.forEach((folder) => {
      const folderCard = document.createElement('div');
      folderCard.className = 'catalog-folder-card';

      const folderHeader = document.createElement('div');
      folderHeader.className = 'catalog-folder-header';
      folderHeader.innerHTML = `
        <div class="catalog-folder-title">
          <span>${folder.title}</span>
          <span class="catalog-folder-badge">${folder.books.length} Kitap</span>
        </div>
        <i data-lucide="chevron-down" style="width: 18px; height: 18px; color: var(--m-text-muted); transition: transform 0.2s;" id="chevron-${folder.id}"></i>
      `;

      const folderContent = document.createElement('div');
      folderContent.className = 'catalog-books-list';
      folderContent.id = `content-${folder.id}`;

      folder.books.forEach(b => {
        const isReading = !!readingMap[b.id];
        const readerName = readingMap[b.id] || '';
        const qCount = Array.isArray(b.questions) ? b.questions.length : 0;

        const card = document.createElement('div');
        card.className = `catalog-book-card ${isReading ? 'is-borrowed' : 'is-available'}`;
        card.onclick = () => window.openBookQuestionsModal(b.id);

        let statusBadge = '';
        if (isReading) {
          statusBadge = `<span class="catalog-status-tag borrowed">👤 ${escapeHTML(readerName)}'da (Okuyor)</span>`;
        } else {
          statusBadge = `<span class="catalog-status-tag available">✓ Kütüphanede (Müsait)</span>`;
        }

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 6px;">
            ${statusBadge}
            <span class="catalog-questions-tag">
              <i data-lucide="help-circle" style="width: 12px; height: 12px;"></i> ${qCount > 0 ? qCount + ' Soru' : '+ Soru Ekle'}
            </span>
          </div>
          <div style="font-weight: 800; font-size: 0.92rem; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHTML(b.title)}
          </div>
          <div style="font-size: 0.74rem; color: var(--m-text-muted); margin-top: 2px;">
            <span>${escapeHTML(b.author || 'Yazar Belirtilmemiş')}</span> • <span>${b.pages || 0} Sayfa</span> ${b.bookNo ? '• No: ' + escapeHTML(b.bookNo) : ''}
          </div>
        `;
        folderContent.appendChild(card);
      });

      // Accordion toggle
      folderHeader.onclick = () => {
        const isOpen = folderContent.style.display !== 'none';
        folderContent.style.display = isOpen ? 'none' : 'flex';
        const ch = document.getElementById(`chevron-${folder.id}`);
        if (ch) ch.style.transform = isOpen ? 'rotate(-90deg)' : 'rotate(0deg)';
        window.vibrate(15);
      };

      folderCard.appendChild(folderHeader);
      folderCard.appendChild(folderContent);
      container.appendChild(folderCard);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================================================
  // KİTAP SORULARI GÖRÜNTÜLEME VE EKLEME MODALI
  // ==========================================================================
  const DEFAULT_STARTER_QUESTIONS = [
    { question: "Kitabın ana kahramanı kimdir ve en belirgin özellikleri nelerdir?", answer: "Ana karakter ve kişilik özellikleri." },
    { question: "Kitaptaki olayların geçtiği ana mekan ve zaman dilimi neresidir?", answer: "Olayların geçtiği yer ve çevre." },
    { question: "Kitapta karakterin karşılaştığı en büyük zorluk veya problem neydi?", answer: "Karşılaşılan engel ve çözüm yolu." },
    { question: "Bu kitabı okuduktan sonra kendinize çıkardığınız ana fikir veya ders nedir?", answer: "Kitabın ana fikri ve verilen mesaj." }
  ];

  window.openBookQuestionsModal = (bookId) => {
    if (!window.stateManager) return;
    const allBooks = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    const titleEl = document.getElementById('m-questions-book-title');
    const authorEl = document.getElementById('m-questions-book-author');
    const bodyEl = document.getElementById('m-book-questions-body');

    if (titleEl) titleEl.textContent = `📖 ${book.title}`;
    if (authorEl) authorEl.textContent = `${book.author || 'Bilinmiyor'} • ${book.pages || 0} Sayfa (Sorular & Değerlendirme)`;

    if (!bodyEl) return;

    const questions = Array.isArray(book.questions) ? [...book.questions] : [];

    let questionsListHtml = '';
    if (questions.length === 0) {
      questionsListHtml = `
        <div style="text-align: center; padding: 1.5rem 1rem; color: var(--m-text-muted); background: var(--m-surface-subtle); border-radius: var(--m-radius-md); border: 1px dashed var(--m-border); margin-bottom: 1rem;">
          <i data-lucide="help-circle" style="width: 32px; height: 32px; opacity: 0.4; margin-bottom: 0.4rem;"></i>
          <p style="font-weight: 700; margin: 0; font-size: 0.85rem;">Bu kitaba henüz özel soru eklenmemiş.</p>
          <p style="font-size: 0.75rem; margin-top: 4px;">Aşağıdaki formu kullanarak kitaba dilediğiniz kadar soru ve cevap ekleyebilirsiniz.</p>
          <button class="btn-primary-action" style="margin: 0.75rem auto 0 auto; font-size: 0.75rem; padding: 0.4rem 0.85rem;" onclick="window.loadStarterQuestionsToBook('${book.id}')">
            ✨ Standart Soruları Otomatik Ekle
          </button>
        </div>
      `;
    } else {
      questionsListHtml = questions.map((q, idx) => `
        <div class="question-bubble-card">
          <div class="question-bubble-header">
            <span class="question-num-pill">Soru ${idx + 1}</span>
            <button class="question-del-btn" title="Soruyu Sil" onclick="window.deleteBookQuestion('${book.id}', ${idx})">
              <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
            </button>
          </div>
          <div class="question-text-content">❓ ${escapeHTML(q.question)}</div>
          <div class="answer-text-content">
            <strong style="color: var(--m-success);">Cevap:</strong> ${escapeHTML(q.answer || 'Cevap belirtilmemiş')}
          </div>
        </div>
      `).join('');
    }

    bodyEl.innerHTML = `
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
          <h4 style="font-size: 0.88rem; font-weight: 800; color: var(--m-text);">
            Kayıtlı Sorular (${questions.length})
          </h4>
        </div>
        ${questionsListHtml}
      </div>

      <!-- Yeni Soru Ekleme Formu -->
      <div class="new-question-box">
        <div style="font-size: 0.85rem; font-weight: 800; color: var(--m-primary); margin-bottom: 0.65rem; display: flex; align-items: center; gap: 4px;">
          <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i> Bu Kitaba Yeni Soru Ekle
        </div>
        <div class="mobile-input-group" style="margin-bottom: 0.65rem;">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--m-text-muted); display: block; margin-bottom: 3px;">Soru Metni</label>
          <input type="text" id="m-new-q-text" class="mobile-input" placeholder="Örn: Zeze'nin şeker portakalı fidanının adı nedir?">
        </div>
        <div class="mobile-input-group" style="margin-bottom: 0.85rem;">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--m-text-muted); display: block; margin-bottom: 3px;">Beklenen Cevap (İsteğe Bağlı)</label>
          <input type="text" id="m-new-q-ans" class="mobile-input" placeholder="Örn: Minguinho">
        </div>
        <button class="subview-primary-action-btn" onclick="window.saveNewBookQuestion('${book.id}')">
          <i data-lucide="check" style="width: 16px; height: 16px;"></i> Soruyu Kaydet
        </button>
      </div>

      <button class="subview-secondary-btn" style="margin-top: 1rem;" onclick="window.closeBottomSheet()">
        Kapat
      </button>
    `;

    openBottomSheet('modal-book-questions');
    if (window.lucide) window.lucide.createIcons();
  };

  window.saveNewBookQuestion = (bookId) => {
    const qInput = document.getElementById('m-new-q-text');
    const aInput = document.getElementById('m-new-q-ans');
    if (!qInput) return;

    const qText = qInput.value.trim();
    const aText = aInput ? aInput.value.trim() : '';

    if (!qText) {
      showMobileToast('❌ Lütfen soru metnini yazın');
      return;
    }

    const allBooks = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    if (!Array.isArray(book.questions)) {
      book.questions = [];
    }

    book.questions.push({ question: qText, answer: aText });

    if (typeof window.stateManager.updateBookQuestions === 'function') {
      window.stateManager.updateBookQuestions(bookId, book.questions);
    } else {
      window.stateManager.saveState();
    }

    window.vibrate(30);
    showMobileToast('✅ Soru kitaba başarıyla eklendi!');
    window.openBookQuestionsModal(bookId);
    renderBooksCatalogPane();
  };

  window.deleteBookQuestion = (bookId, qIdx) => {
    const allBooks = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const book = allBooks.find(b => b.id === bookId);
    if (!book || !Array.isArray(book.questions)) return;

    book.questions.splice(qIdx, 1);

    if (typeof window.stateManager.updateBookQuestions === 'function') {
      window.stateManager.updateBookQuestions(bookId, book.questions);
    } else {
      window.stateManager.saveState();
    }

    window.vibrate(25);
    showMobileToast('🗑️ Soru silindi');
    window.openBookQuestionsModal(bookId);
    renderBooksCatalogPane();
  };

  window.loadStarterQuestionsToBook = (bookId) => {
    const allBooks = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    book.questions = JSON.parse(JSON.stringify(DEFAULT_STARTER_QUESTIONS));

    if (typeof window.stateManager.updateBookQuestions === 'function') {
      window.stateManager.updateBookQuestions(bookId, book.questions);
    } else {
      window.stateManager.saveState();
    }

    window.vibrate(35);
    showMobileToast('✨ Standart sorular kitaba yüklendi!');
    window.openBookQuestionsModal(bookId);
    renderBooksCatalogPane();
  };

  // ==========================================================================
  // 4. MODÜL: HIZLI YOKLAMA
  // ==========================================================================
  function renderAttendanceTab() {
    const list = document.getElementById('m-attendance-list');
    const statPresent = document.getElementById('att-stat-present');
    const statAbsent = document.getElementById('att-stat-absent');
    const students = getFilteredStudents();

    if (!list) return;
    list.innerHTML = '';

    let presentCount = 0;
    let absentCount = 0;

    students.forEach(st => {
      const status = attendanceData[st.id] || 'present';
      if (status === 'present') presentCount++;
      else absentCount++;

      const row = document.createElement('div');
      row.className = 'attendance-row';
      row.innerHTML = `
        <div>
          <div style="font-weight: 700; font-size: 0.92rem;">${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}</div>
          <div style="font-size: 0.72rem; color: var(--m-text-muted);">No: ${escapeHTML(st.number || '-')}</div>
        </div>
        <button class="attendance-status-pill ${status === 'present' ? 'status-present' : 'status-absent'}" onclick="window.toggleAttendance('${st.id}')">
          ${status === 'present' ? '✓ VAR' : '✗ YOK'}
        </button>
      `;
      list.appendChild(row);
    });

    if (statPresent) statPresent.textContent = presentCount;
    if (statAbsent) statAbsent.textContent = absentCount;
  }

  window.toggleAttendance = (studentId) => {
    attendanceData[studentId] = attendanceData[studentId] === 'absent' ? 'present' : 'absent';
    window.vibrate(30);
    renderAttendanceTab();
  };

  window.markAllAttendance = (status) => {
    const students = getFilteredStudents();
    students.forEach(st => {
      attendanceData[st.id] = status;
    });
    window.vibrate(40);
    renderAttendanceTab();
    showMobileToast(status === 'present' ? 'Tüm sınıf VAR olarak işaretlendi' : 'Tüm sınıf YOK olarak işaretlendi');
  };

  window.saveAttendance = () => {
    window.vibrate(50);
    showMobileToast('Yoklama başarıyla kaydedildi!');
  };

  // ==========================================================================
  // 5. MODÜL: DAHA FAZLA / ARAÇLAR
  // ==========================================================================
  function renderMoreTab() {
    // Statik kartlar mobile.html içinde render edilir
  }

  // Şanslı Öğrenci Çağırıcı (Kura Çarkı)
  window.drawLuckyStudent = () => {
    const students = getFilteredStudents();
    if (students.length === 0) {
      showMobileToast('Listede öğrenci bulunamadı.');
      return;
    }

    const lucky = students[Math.floor(Math.random() * students.length)];
    window.vibrate(80);

    const resultBox = document.getElementById('lucky-student-result');
    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.innerHTML = `
        <div style="padding: 1.5rem; background: var(--m-surface); border: 2px solid var(--m-primary); border-radius: var(--m-radius-md); text-align: center; margin-top: 1rem; animation: tabFadeIn 0.3s;">
          <div style="font-size: 0.75rem; font-weight: 800; color: var(--m-primary); text-transform: uppercase;">🎉 Şanslı Öğrenci</div>
          <div style="font-size: 1.4rem; font-weight: 800; margin: 0.35rem 0;">${escapeHTML(lucky.name)} ${escapeHTML(lucky.surname || '')}</div>
          <div style="font-size: 0.85rem; color: var(--m-text-muted);">Okul No: ${escapeHTML(lucky.number || '-')}</div>
        </div>
      `;
    }
  };

  // Hızlı Geri Sayım Sayacı
  window.startMobileTimer = (minutes) => {
    clearInterval(timerInterval);
    timerSecondsLeft = minutes * 60;
    window.vibrate(40);

    const display = document.getElementById('m-timer-display');
    const updateDisplay = () => {
      const m = Math.floor(timerSecondsLeft / 60);
      const s = timerSecondsLeft % 60;
      if (display) display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    updateDisplay();
    showMobileToast(`${minutes} Dakikalık Sayaç Başlatıldı`);

    timerInterval = setInterval(() => {
      timerSecondsLeft--;
      updateDisplay();
      if (timerSecondsLeft <= 0) {
        clearInterval(timerInterval);
        window.vibrate(200);
        showMobileToast('🔔 Süre Doldu!');
      }
    }, 1000);
  };

  // ==========================================================================
  // YARDIMCI VE PAYLAŞILAN METOTLAR
  // ==========================================================================
  function getFilteredStudents() {
    if (!window.stateManager) return [];
    const isMiddle = isMiddleSchool();
    const all = (window.stateManager.state && window.stateManager.state.students) 
      ? window.stateManager.state.students 
      : (window.stateManager.getStudents(true) || []);
      
    // 1. Ayarlarda seçilen kademeye göre listeleme (İlkokul -> sadece ilkokul, Ortaokul -> sadece ortaokul)
    let list = all.filter(s => isStudentInCurrentLevel(s));

    // 2. Ortaokul ise şube filtresi
    if (isMiddle && activeBranch && activeBranch !== 'all') {
      list = list.filter(st => st.branch === activeBranch);
    }
    // 3. Arama terimi filtresi
    if (activeSearchTerm) {
      list = list.filter(st => {
        const full = `${st.name} ${st.surname || ''} ${st.number || ''}`.toLowerCase();
        return full.includes(activeSearchTerm);
      });
    }
    return list;
  }

  function populateBranchOptions(selectEl) {
    if (!selectEl) return;
    const branches = (window.stateManager && typeof window.stateManager.getBranches === 'function')
      ? window.stateManager.getBranches()
      : ['5/A', '5/B', '6/A', '6/B', '7/A', '7/B', '8/A', '8/B'];
    selectEl.innerHTML = '<option value="all">Tüm Şubeler</option>';
    branches.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = `${b} Şubesi`;
      selectEl.appendChild(opt);
    });
  }

  function getAvatarColor(idOrName) {
    const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#3b82f6'];
    let hash = 0;
    const str = String(idOrName || 'st');
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }

  function showMobileToast(msg) {
    let toast = document.getElementById('mobile-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'mobile-toast';
      toast.className = 'mobile-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  const showToast = (msg) => showMobileToast(msg);
  window.showToast = showMobileToast;

  window.closeBottomSheet = () => {
    window.currentDetailedStudentId = null;
    document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('active'));
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    const schedFabMenu = document.getElementById('m-sched-fab-menu');
    const schedFabBtn = document.getElementById('m-sched-fab-btn');
    if (schedFabMenu) schedFabMenu.classList.remove('show');
    if (schedFabBtn) schedFabBtn.classList.remove('active');
    const quizFabMenu = document.getElementById('m-quiz-fab-menu');
    const quizFabBtn = document.getElementById('m-quiz-fab-btn');
    if (quizFabMenu) quizFabMenu.classList.remove('show');
    if (quizFabBtn) quizFabBtn.classList.remove('active');
  };

  function openBottomSheet(sheetId) {
    window.closeBottomSheet();
    const sheet = document.getElementById(sheetId);
    const backdrop = document.getElementById('sheet-backdrop');
    if (sheet) sheet.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================================================
  // 1. SUBVIEW (ALT EKRAN) YÖNETİMİ & ANDROID GERİ TUŞU
  // ==========================================================================
  let activeMobileSubview = null;

  window.openMobileSubview = (subviewId) => {
    window.closeBottomSheet();
    window.closeConfigDrawer();
    activeMobileSubview = subviewId;
    window.vibrate(20);

    document.querySelectorAll('.mobile-subview').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(`subview-${subviewId}`);
    if (targetView) {
      targetView.classList.add('active');
      targetView.scrollTop = 0;
    }

    // İlgili modülün render fonksiyonunu çalıştır
    if (subviewId === 'weekly') {
      currentWeeklyTargetWeek = (window.stateManager && typeof window.stateManager.getSelectedWeek === 'function')
        ? window.stateManager.getSelectedWeek()
        : (window.getISOWeek ? window.getISOWeek() : '2026-W39');
      renderMobileWeekly();
    }
    else if (subviewId === 'games') initMobileGames();
    else if (subviewId === 'tasks') renderMobileTasks();
    else if (subviewId === 'tools') renderMobileTools();
    else if (subviewId === 'reports') renderMobileReports();
    else if (subviewId === 'materials') renderMobileMaterials();
    else if (subviewId === 'config') initMobileConfig();

    if (window.lucide) window.lucide.createIcons();
  };

  window.closeMobileSubview = () => {
    activeMobileSubview = null;
    window.vibrate(15);
    document.querySelectorAll('.mobile-subview').forEach(v => v.classList.remove('active'));
    window.closeBottomSheet();
    window.closeConfigDrawer();
    const configFabMenu = document.getElementById('m-config-fab-menu');
    const configFabBtn = document.getElementById('m-config-fab-btn');
    if (configFabMenu) configFabMenu.classList.remove('show');
    if (configFabBtn) configFabBtn.classList.remove('active');
    // Diğer sekmesine dön
    switchTab('more');
  };

  // Android Donanım Geri Tuşu Yönetimi
  window.handleAndroidBack = () => {
    // 0. Özel diyaloglar açıksa kapat
    const noteDialog = document.getElementById('modal-supply-note-dialog');
    if (noteDialog && noteDialog.style.display !== 'none') {
      window.closeSupplyNoteDialog();
      return true;
    }
    const payDialog = document.getElementById('modal-supply-payment-dialog');
    if (payDialog && payDialog.style.display !== 'none') {
      window.closeSupplyPaymentDialog();
      return true;
    }

    // 0.1 Yüzen menüler (FAB) açıksa kapat
    const configFabMenu = document.getElementById('m-config-fab-menu');
    if (configFabMenu && configFabMenu.classList.contains('show')) {
      configFabMenu.classList.remove('show');
      const btn = document.getElementById('m-config-fab-btn');
      if (btn) btn.classList.remove('active');
      return true;
    }
    const booksFabMenu = document.getElementById('m-books-fab-menu');
    if (booksFabMenu && booksFabMenu.classList.contains('show')) {
      booksFabMenu.classList.remove('show');
      const btn = document.getElementById('m-books-fab-btn');
      if (btn) btn.classList.remove('active');
      return true;
    }
    const schedFabMenu = document.getElementById('m-sched-fab-menu');
    if (schedFabMenu && schedFabMenu.classList.contains('show')) {
      schedFabMenu.classList.remove('show');
      const btn = document.getElementById('m-sched-fab-btn');
      if (btn) btn.classList.remove('active');
      return true;
    }
    const docsFabMenu = document.getElementById('m-docs-fab-menu');
    if (docsFabMenu && docsFabMenu.classList.contains('show')) {
      docsFabMenu.classList.remove('show');
      const btn = document.getElementById('m-docs-fab-btn');
      if (btn) btn.classList.remove('active');
      return true;
    }
    const examsFabMenu = document.getElementById('m-exams-fab-menu');
    if (examsFabMenu && examsFabMenu.classList.contains('show')) {
      examsFabMenu.classList.remove('show');
      const btn = document.getElementById('m-exams-fab-btn');
      if (btn) btn.classList.remove('active');
      return true;
    }
    const quizFabMenu = document.getElementById('m-quiz-fab-menu');
    if (quizFabMenu && quizFabMenu.classList.contains('show')) {
      quizFabMenu.classList.remove('show');
      const btn = document.getElementById('m-quiz-fab-btn');
      if (btn) btn.classList.remove('active');
      return true;
    }
    const quizAddSheet = document.getElementById('modal-quiz-add-question');
    if (quizAddSheet && quizAddSheet.classList.contains('active')) {
      quizAddSheet.classList.remove('active');
      const backdrop = document.getElementById('sheet-backdrop');
      if (backdrop) backdrop.classList.remove('active');
      return true;
    }
    const quizSettingsSheet = document.getElementById('modal-quiz-settings');
    if (quizSettingsSheet && quizSettingsSheet.classList.contains('active')) {
      quizSettingsSheet.classList.remove('active');
      const backdrop = document.getElementById('sheet-backdrop');
      if (backdrop) backdrop.classList.remove('active');
      return true;
    }
    const quizRaffleSheet = document.getElementById('modal-quiz-raffle');
    if (quizRaffleSheet && quizRaffleSheet.classList.contains('active')) {
      quizRaffleSheet.classList.remove('active');
      const backdrop = document.getElementById('sheet-backdrop');
      if (backdrop) backdrop.classList.remove('active');
      return true;
    }
    const outcomeSheet = document.getElementById('modal-live-lesson-outcome');
    if (outcomeSheet && outcomeSheet.classList.contains('active')) {
      outcomeSheet.classList.remove('active');
      const backdrop = document.getElementById('sheet-backdrop');
      if (backdrop) backdrop.classList.remove('active');
      return true;
    }
    // 1.34 Haftalık Değerlendirme & Optik alt modalları açıksa kapat
    const optPrintSheet = document.getElementById('modal-mobile-optical-print');
    if (optPrintSheet && optPrintSheet.classList.contains('active')) {
      if (typeof window.closeMobileOpticalPrintModal === 'function') window.closeMobileOpticalPrintModal();
      else optPrintSheet.classList.remove('active');
      return true;
    }
    const optManualSheet = document.getElementById('modal-manual-optical-entry');
    if (optManualSheet && optManualSheet.classList.contains('active')) {
      if (typeof window.closeManualOpticalEntryModal === 'function') window.closeManualOpticalEntryModal();
      else optManualSheet.classList.remove('active');
      return true;
    }
    const omrScannerSheet = document.getElementById('modal-mobile-omr-scanner');
    if (omrScannerSheet && omrScannerSheet.classList.contains('active')) {
      if (typeof window.closeMobileOmrScanner === 'function') window.closeMobileOmrScanner();
      else omrScannerSheet.classList.remove('active');
      return true;
    }
    const wegSheet = document.getElementById('modal-weekly-exam-grading');
    if (wegSheet && wegSheet.classList.contains('active')) {
      window.closeWeeklyGradingModal();
      return true;
    }
    const weAddSheet = document.getElementById('modal-add-weekly-exam');
    if (weAddSheet && weAddSheet.classList.contains('active')) {
      weAddSheet.classList.remove('active');
      const backdrop = document.getElementById('sheet-backdrop');
      if (backdrop) backdrop.classList.remove('active');
      return true;
    }
    // 1.35 Sınavlar ve Yazılı alt modalları açıksa kapat
    const createWeSheet = document.getElementById('modal-create-written-exam');
    if (createWeSheet && createWeSheet.classList.contains('active')) {
      createWeSheet.classList.remove('active');
      return true;
    }
    const viewWeSheet = document.getElementById('modal-view-written-exam');
    if (viewWeSheet && viewWeSheet.classList.contains('active')) {
      viewWeSheet.classList.remove('active');
      return true;
    }
    const eaAddSheet = document.getElementById('modal-ea-add-exam');
    if (eaAddSheet && eaAddSheet.classList.contains('active')) {
      eaAddSheet.classList.remove('active');
      return true;
    }
    const eaGradesSheet = document.getElementById('modal-ea-grades');
    if (eaGradesSheet && eaGradesSheet.classList.contains('active')) {
      eaGradesSheet.classList.remove('active');
      return true;
    }
    const eaReportSheet = document.getElementById('modal-ea-report');
    if (eaReportSheet && eaReportSheet.classList.contains('active')) {
      eaReportSheet.classList.remove('active');
      return true;
    }
    // 1.3 Evrak alt modalları açıksa kapat
    const docViewerSheet = document.getElementById('modal-document-viewer');
    if (docViewerSheet && docViewerSheet.classList.contains('active')) {
      docViewerSheet.classList.remove('active');
      return true;
    }
    const docUploadSheet = document.getElementById('modal-document-upload');
    if (docUploadSheet && docUploadSheet.classList.contains('active')) {
      docUploadSheet.classList.remove('active');
      return true;
    }
    const docNewCatSheet = document.getElementById('modal-document-new-category');
    if (docNewCatSheet && docNewCatSheet.classList.contains('active')) {
      docNewCatSheet.classList.remove('active');
      return true;
    }
    const docMoveSheet = document.getElementById('modal-document-move');
    if (docMoveSheet && docMoveSheet.classList.contains('active')) {
      docMoveSheet.classList.remove('active');
      return true;
    }
    // 1. Çekmece açıksa kapat
    const drawer = document.getElementById('config-drawer');
    if (drawer && drawer.classList.contains('active')) {
      window.closeConfigDrawer();
      return true;
    }
    // 1.1 Nöbet oluşturma modalı açıksa ana nöbet modalına dön
    const createRosterSheet = document.getElementById('modal-create-duty-roster');
    if (createRosterSheet && createRosterSheet.classList.contains('active')) {
      window.openDutyRosterModal();
      return true;
    }
    // 1.2 Oturma planı öğrenci seçimi açıksa kapat
    const seatingPickerSheet = document.getElementById('modal-seating-student-select');
    if (seatingPickerSheet && seatingPickerSheet.classList.contains('active')) {
      window.closeMobileSeatPicker();
      return true;
    }

    // 2. Herhangi bir modal/sheet açıksa kapat
    const activeSheet = document.querySelector('.bottom-sheet.active');
    if (activeSheet) {
      window.closeBottomSheet();
      return true;
    }
    // 3. Oyun arenası açıksa oyun menüsüne dön
    const gamesLanding = document.getElementById('m-games-landing');
    if (activeMobileSubview === 'games' && gamesLanding && gamesLanding.style.display === 'none') {
      window.backToGamesLanding();
      return true;
    }
    // 4. Bir subview açıksa subview'ı kapat ve Diğer sekmesine dön
    if (activeMobileSubview) {
      window.closeMobileSubview();
      return true;
    }
    // 5. Diğer sekmelerden birindeyse ana puana dön
    if (currentTab !== 'performance') {
      switchTab('performance');
      return true;
    }
    return false;
  };

  // ==========================================================================
  // 2. OYUNLAR MODÜLÜ (QUIZ, ÇARPIM TABLOSU, HAZİNE SANDIĞI)
  // ==========================================================================
  let quizQuestions = [];
  let currentQuizIdx = 0;
  let quizScore = 0;
  let mathStreak = 0;
  let mathScore = 0;
  let mathCurrentAnswer = 0;

  let quizTimerInterval = null;
  function stopQuizTimer() {
    if (quizTimerInterval) {
      clearInterval(quizTimerInterval);
      quizTimerInterval = null;
    }
  }

  function initMobileGames() {
    window.backToGamesLanding();
  }

  window.backToGamesLanding = () => {
    stopQuizTimer();
    const quizFabMenu = document.getElementById('m-quiz-fab-menu');
    const quizFabBtn = document.getElementById('m-quiz-fab-btn');
    if (quizFabMenu) quizFabMenu.classList.remove('show');
    if (quizFabBtn) quizFabBtn.classList.remove('active');

    const landing = document.getElementById('m-games-landing');
    const arenaQuiz = document.getElementById('m-arena-quiz');
    const arenaMath = document.getElementById('m-arena-math');
    const arenaTreasure = document.getElementById('m-arena-treasure');
    const title = document.getElementById('m-games-header-title');

    if (landing) landing.style.display = 'block';
    if (arenaQuiz) arenaQuiz.style.display = 'none';
    if (arenaMath) arenaMath.style.display = 'none';
    if (arenaTreasure) arenaTreasure.style.display = 'none';
    if (title) title.textContent = 'Sınıf Oyunları';
    if (window.lucide) window.lucide.createIcons();
  };

  // ==========================================================================
  // Oyun 1: BİLGİ YARIŞMASI (MASAÜSTÜ PARİTESİ, YÜZEN MENÜ & SORU HAVUZU)
  // ==========================================================================
  const defaultMobileQuizQuestions = [
    { id: 1, type: "tf", category: "Bilim", text: "Ahtapotların üç adet kalbi vardır.", answer: true, explanation: "Evet, ahtapotların iki solungaç kalbi ve bir sistemik kalbi bulunur." },
    { id: 2, type: "tf", category: "Bilim", text: "Dünya, Güneş sistemindeki en büyük gezegendir.", answer: false, explanation: "En büyük gezegen Jüpiter'dir. Dünya büyüklükte 5. sıradadır." },
    { id: 3, type: "tf", category: "Bilim", text: "Işık, sesten daha hızlı yayılır.", answer: true, explanation: "Işık hızı boşlukta yaklaşık 300.000 km/s iken, ses hızı havada yaklaşık 343 m/s'dir." },
    { id: 4, type: "tf", category: "Coğrafya", text: "Kanada'nın başkenti Toronto'dur.", answer: false, explanation: "Kanada'nın başkenti Ottawa'dır. Toronto en büyük şehridir." },
    { id: 5, type: "tf", category: "Biyoloji", text: "İnsan vücudundaki en sert madde diş minesidir.", answer: true, explanation: "Diş minesi vücudun en yoğun mineralli ve en sert dokusudur." },
    { id: 6, type: "tf", category: "Biyoloji", text: "Balinalar balık sınıfına giren deniz canlılarıdır.", answer: false, explanation: "Balinalar memelidir; akciğerleriyle nefes alırlar ve yavrularını emzirirler." },
    { id: 7, type: "tf", category: "Bilim", text: "Güneş aslında orta büyüklükte bir yıldızdır.", answer: true, explanation: "Güneş, G-tipi anakol cüce yıldızıdır ve orta büyüklüktedir." },
    { id: 8, type: "tf", category: "Coğrafya", text: "Türkiye'nin yüzölçümü en büyük ili Konya'dır.", answer: true, explanation: "Yüzölçümü bakımından Konya, 38.873 km² ile Türkiye'nin en büyük ilidir." },
    { id: 9, type: "tf", category: "Biyoloji", text: "Penguenler uçabilen tek kutup kuşlarıdır.", answer: false, explanation: "Penguenler uçamayan kuşlardır; kanatlarını yüzmek için kullanırlar." },
    { id: 10, type: "tf", category: "Fizik", text: "Su, deniz seviyesinde 100 santigrat derecede kaynar.", answer: true, explanation: "Deniz seviyesinde (1 atm basınçta) suyun kaynama noktası 100°C'dir." },
    { id: 11, type: "mc", category: "Bilim", text: "Hangi gezegen Güneş sistemindeki en büyük gezegendir?", options: ["Mars", "Jüpiter", "Satürn", "Dünya"], answer: 1, explanation: "Jüpiter, Güneş sisteminin en büyük gezegenidir ve çapı Dünya'nın yaklaşık 11 katıdır." },
    { id: 12, type: "mc", category: "Coğrafya", text: "Aşağıdakilerden hangisi Türkiye'nin başkentidir?", options: ["İstanbul", "Ankara", "İzmir", "Bursa"], answer: 1, explanation: "Türkiye'nin başkenti Ankara'dır ve 13 Ekim 1923'te başkent olmuştur." },
    { id: 13, type: "mc", category: "Biyoloji", text: "Kutup ayıları doğal olarak hangi yarımkürede yaşarlar?", options: ["Kuzey Yarımküre", "Güney Yarımküre", "Ekvator", "Hiçbiri"], answer: 0, explanation: "Kutup ayıları yalnızca Kuzey Kutbu ve çevresindeki Kuzey Yarımküre bölgelerinde yaşarlar; penguenler ise Güney Yarımküre'de yaşar." },
    { id: 14, type: "mc", category: "Tarih", text: "Cumhuriyet hangi yılda ilan edilmiştir?", options: ["1919", "1920", "1923", "1924"], answer: 2, explanation: "Türkiye Cumhuriyeti, 29 Ekim 1923'te resmen ilan edilmiştir." },
    { id: 15, type: "fib", category: "Bilim", text: "Güneş sistemindeki en sıcak gezegen [___] gezegenidir.", options: ["Mars", "Venüs", "Merkür", "Jüpiter"], answer: 1, explanation: "Venüs, kalın karbondioksit atmosferi nedeniyle Merkür'den daha sıcaktır (yaklaşık 460°C)." },
    { id: 16, type: "fib", category: "Coğrafya", text: "Dünyanın en yüksek dağı olan [___] Asya kıtasında bulunur.", options: ["Everest Dağı", "K2 Dağı", "Kilimanjaro Dağı", "Mont Blanc"], answer: 0, explanation: "Everest Dağı, deniz seviyesinden 8.848 metre yüksekliğiyle dünyanın en yüksek dağıdır." },
    { id: 17, type: "fib", category: "Tarih", text: "İstanbul, [___] yılında Fatih Sultan Mehmet tarafından fethedilmiştir.", options: ["1071", "1453", "1923", "1299"], answer: 1, explanation: "İstanbul, 29 Mayıs 1453 tarihinde Osmanlı ordusu tarafından fethedilmiştir." }
  ];

  let mobileQuizQuestions = [];
  let mobileQuizFilteredQuestions = [];
  let quizTimeLeft = 15;
  let quizActiveStudent = null;
  let quizCurrentRound = 1;
  let quizSelectedStudentNames = [];
  let quizUnselectedStudents = [];
  let quizStudentScores = {};
  let quizSoundEnabled = true;
  let quizTimerDuration = 15;
  let quizFilterType = 'all';
  let quizFilterCategory = 'all';
  let quizPoolCategoryFilter = 'all';
  let quizPoolSearchText = '';
  let quizFormActiveType = 'tf';
  let quizRafflePendingWinner = null;
  let quizHasAnsweredCurrent = false;

  function getMobileQuizActiveStudents() {
    if (!window.stateManager || !window.stateManager.state) return [];
    let students = window.stateManager.state.students || [];
    if (students.length === 0 && window.stateManager.state.rawStudents) {
      students = window.stateManager.state.rawStudents;
    }
    const demoMiddleNames = new Set([
      "Hakan Yıldız", "Zeynep Demir", "Ömer Aslan", "Ceren Yılmaz", "Kerem Kaya", "Melis Şahin", "Burak Çelik", "Eda Öztürk",
      "Ahmet Yılmaz", "Can Demir", "Zeynep Kaya", "Ayşe Yılmaz"
    ]);
    const demoMiddleIds = new Set(['std_1', '101', '102', '103', 'std_m1', 'std_m2', 'std_m3', 'std_m4', 'std_m5', 'std_m6', 'std_m7', 'std_m8', 'std_m9', 'std_m10']);
    const isDemo = (s) => {
      const fn = `${s.name || ''} ${s.surname || ''}`.trim();
      const norm = fn.toLowerCase().replace(/[\s\.\-_]/g, '');
      if (demoMiddleNames.has(fn)) return true;
      if (norm === 'candemir' || norm === 'ahmetyilmaz' || norm === 'ahmetyılmaz') return true;
      if (s.id && (demoMiddleIds.has(String(s.id)) || String(s.id).startsWith('std_m'))) return true;
      return false;
    };
    if (students.some(s => !isDemo(s))) {
      students = students.filter(s => !isDemo(s));
    }
    return students;
  }

  function getStudentDisplayName(s) {
    if (!s) return '';
    return `${s.name || ''} ${s.surname || ''}`.trim();
  }

  function loadMobileQuizData() {
    // 1. Sorular
    try {
      const storedQ = localStorage.getItem("tf_questions");
      if (storedQ) {
        mobileQuizQuestions = JSON.parse(storedQ);
        if (!Array.isArray(mobileQuizQuestions) || mobileQuizQuestions.length === 0) {
          mobileQuizQuestions = [...defaultMobileQuizQuestions];
          localStorage.setItem("tf_questions", JSON.stringify(mobileQuizQuestions));
        }
      } else {
        mobileQuizQuestions = [...defaultMobileQuizQuestions];
        localStorage.setItem("tf_questions", JSON.stringify(mobileQuizQuestions));
      }
    } catch (e) {
      mobileQuizQuestions = [...defaultMobileQuizQuestions];
    }
    if (window.stateManager && window.stateManager.state) {
      window.stateManager.state.quizQuestions = mobileQuizQuestions;
    }

    // 2. Ayarlar
    try {
      const storedSet = localStorage.getItem("m_quiz_settings");
      if (storedSet) {
        const s = JSON.parse(storedSet);
        if (s.timerSeconds !== undefined) quizTimerDuration = parseInt(s.timerSeconds);
        if (s.qType) quizFilterType = s.qType;
        if (s.category) quizFilterCategory = s.category;
        if (s.soundEnabled !== undefined) quizSoundEnabled = s.soundEnabled;
      }
    } catch (e) {}

    // 3. Skorlar
    try {
      const storedSc = localStorage.getItem("tf_student_scores");
      quizStudentScores = storedSc ? JSON.parse(storedSc) : {};
    } catch (e) {
      quizStudentScores = {};
    }

    // 4. Öğrenciler
    const activeStudents = getMobileQuizActiveStudents();
    const activeNames = activeStudents.map(s => getStudentDisplayName(s));

    try {
      const storedSel = localStorage.getItem("quiz_selected_students");
      if (storedSel) {
        quizSelectedStudentNames = JSON.parse(storedSel);
        quizSelectedStudentNames = quizSelectedStudentNames.filter(n => activeNames.includes(n));
      }
    } catch (e) {
      quizSelectedStudentNames = [];
    }

    if (quizSelectedStudentNames.length === 0 && activeNames.length > 0) {
      quizSelectedStudentNames = [...activeNames];
      localStorage.setItem("quiz_selected_students", JSON.stringify(quizSelectedStudentNames));
    }

    // 5. Kura havuzu
    try {
      const storedUnsel = localStorage.getItem("tf_unselected_students");
      if (storedUnsel) {
        quizUnselectedStudents = JSON.parse(storedUnsel);
        quizUnselectedStudents = quizUnselectedStudents.filter(n => quizSelectedStudentNames.includes(n));
      }
    } catch (e) {
      quizUnselectedStudents = [];
    }

    if (quizUnselectedStudents.length === 0 && quizSelectedStudentNames.length > 0) {
      quizUnselectedStudents = [...quizSelectedStudentNames];
      localStorage.setItem("tf_unselected_students", JSON.stringify(quizUnselectedStudents));
    }

    const soundIcon = document.getElementById('m-quiz-sound-icon');
    if (soundIcon) soundIcon.textContent = quizSoundEnabled ? '🔊' : '🔇';
  }

  function applyQuizFilters() {
    let list = [...mobileQuizQuestions];
    if (quizFilterType && quizFilterType !== 'all') {
      list = list.filter(q => q.type === quizFilterType);
    }
    if (quizFilterCategory && quizFilterCategory !== 'all') {
      list = list.filter(q => q.category === quizFilterCategory);
    }
    if (list.length === 0) {
      showMobileToast('Seçilen filtrede soru bulunamadı, tüm sorular kullanılıyor.');
      list = [...mobileQuizQuestions];
    }
    mobileQuizFilteredQuestions = list.sort(() => Math.random() - 0.5);
  }

  window.startMobileQuizGame = () => {
    const landing = document.getElementById('m-games-landing');
    const arenaQuiz = document.getElementById('m-arena-quiz');
    const title = document.getElementById('m-games-header-title');
    if (landing) landing.style.display = 'none';
    if (arenaQuiz) arenaQuiz.style.display = 'block';
    if (title) title.textContent = 'Bilgi Yarışması';

    loadMobileQuizData();
    applyQuizFilters();
    currentQuizIdx = 0;
    quizScore = 0;
    quizCurrentRound = 1;
    quizActiveStudent = null;

    window.switchQuizView('play');
    if (window.lucide) window.lucide.createIcons();
  };

  window.toggleQuizFabMenu = () => {
    const menu = document.getElementById('m-quiz-fab-menu');
    const btn = document.getElementById('m-quiz-fab-btn');
    if (!menu) return;
    const isShowing = menu.classList.toggle('show');
    if (btn) btn.classList.toggle('active', isShowing);
    if (isShowing) window.vibrate(15);
  };

  window.switchQuizView = (viewName) => {
    const menu = document.getElementById('m-quiz-fab-menu');
    const btn = document.getElementById('m-quiz-fab-btn');
    if (menu) menu.classList.remove('show');
    if (btn) btn.classList.remove('active');

    const views = {
      play: document.getElementById('m-quiz-view-play'),
      students: document.getElementById('m-quiz-view-students'),
      pool: document.getElementById('m-quiz-view-pool'),
      leaderboard: document.getElementById('m-quiz-view-leaderboard')
    };

    Object.keys(views).forEach(key => {
      if (views[key]) views[key].style.display = (key === viewName) ? 'block' : 'none';
    });

    const badge = document.getElementById('m-quiz-current-view-badge');
    if (badge) {
      if (viewName === 'play') badge.textContent = '🎮 Yarışma';
      else if (viewName === 'students') badge.textContent = '🎲 Öğrenci Seç & Kura';
      else if (viewName === 'pool') badge.textContent = '📦 Soru Havuzu';
      else if (viewName === 'leaderboard') badge.textContent = '🏆 Skor Tablosu';
    }

    if (viewName === 'play') {
      renderCurrentQuizQuestion();
    } else if (viewName === 'students') {
      stopQuizTimer();
      renderQuizStudentsRoster();
    } else if (viewName === 'pool') {
      stopQuizTimer();
      renderQuizPoolList();
    } else if (viewName === 'leaderboard') {
      stopQuizTimer();
      renderQuizLeaderboard();
    }

    if (window.lucide) window.lucide.createIcons();
  };

  function startQuizTimer() {
    stopQuizTimer();
    const timerText = document.getElementById('m-quiz-timer-text');
    const timerBar = document.getElementById('m-quiz-timer-bar');

    if (quizTimerDuration <= 0) {
      if (timerText) timerText.textContent = 'Süresiz';
      if (timerBar) {
        timerBar.style.width = '100%';
        timerBar.style.background = 'linear-gradient(90deg, #10b981, #6366f1)';
      }
      return;
    }

    quizTimeLeft = quizTimerDuration;
    if (timerText) timerText.textContent = `${quizTimeLeft}s`;
    if (timerBar) {
      timerBar.style.width = '100%';
      timerBar.style.background = 'linear-gradient(90deg, #10b981, #6366f1)';
    }

    quizTimerInterval = setInterval(() => {
      quizTimeLeft--;
      if (timerText) timerText.textContent = `${quizTimeLeft}s`;
      if (timerBar) {
        const percent = Math.max(0, (quizTimeLeft / quizTimerDuration) * 100);
        timerBar.style.width = `${percent}%`;
        if (quizTimeLeft <= 5) {
          timerBar.style.background = '#ef4444';
          if (quizSoundEnabled) playSynthChime('tick');
        }
      }

      if (quizTimeLeft <= 0) {
        stopQuizTimer();
        handleQuizTimeout();
      }
    }, 1000);
  }

  function handleQuizTimeout() {
    quizHasAnsweredCurrent = true;
    window.vibrate(100);
    if (quizSoundEnabled) playSynthChime('wrong');
    showMobileToast('⏱️ Süre Doldu!');

    const q = mobileQuizFilteredQuestions[currentQuizIdx];
    if (!q) return;

    if (q.type === 'tf') {
      const correctVal = (q.answer === true || q.answer === 'true');
      const tfBtns = document.querySelectorAll('.game-quiz-tf-btn');
      tfBtns.forEach(b => {
        b.disabled = true;
        const isTrueBtn = b.classList.contains('tf-true');
        if (isTrueBtn === correctVal) b.classList.add('correct');
      });
    } else {
      const correctIdx = (typeof q.answer === 'number') ? q.answer : ((typeof q.correct === 'number') ? q.correct : 0);
      const btns = document.querySelectorAll('.game-quiz-btn');
      btns.forEach((btn, i) => {
        btn.disabled = true;
        if (i === correctIdx) btn.classList.add('correct');
      });
    }

    if (q.explanation) {
      const expBox = document.getElementById('m-quiz-explanation-box');
      const expText = document.getElementById('m-quiz-explanation-text');
      if (expBox && expText) {
        expText.textContent = q.explanation;
        expBox.style.display = 'block';
      }
    }

    if (quizActiveStudent) {
      if (!quizStudentScores[quizActiveStudent]) {
        quizStudentScores[quizActiveStudent] = { score: 0, correctCount: 0, incorrectCount: 1 };
      } else if (typeof quizStudentScores[quizActiveStudent] === 'number') {
        quizStudentScores[quizActiveStudent] = { score: quizStudentScores[quizActiveStudent], correctCount: 0, incorrectCount: 1 };
      } else {
        quizStudentScores[quizActiveStudent].incorrectCount = (quizStudentScores[quizActiveStudent].incorrectCount || 0) + 1;
      }
      localStorage.setItem("tf_student_scores", JSON.stringify(quizStudentScores));
    }
  }

  function renderCurrentQuizQuestion() {
    stopQuizTimer();
    quizHasAnsweredCurrent = false;

    if (!mobileQuizFilteredQuestions || mobileQuizFilteredQuestions.length === 0) {
      applyQuizFilters();
    }

    if (currentQuizIdx >= mobileQuizFilteredQuestions.length) {
      mobileQuizFilteredQuestions = [...mobileQuizFilteredQuestions].sort(() => Math.random() - 0.5);
      currentQuizIdx = 0;
      showMobileToast('Tüm sorular tamamlandı, havuz yeniden karıştırıldı! 🔄');
    }

    const q = mobileQuizFilteredQuestions[currentQuizIdx];
    if (!q) return;

    const roundBadge = document.getElementById('m-quiz-round-badge');
    if (roundBadge) roundBadge.textContent = `${quizCurrentRound}. Tur`;

    const catBadge = document.getElementById('m-quiz-category-badge');
    if (catBadge) catBadge.textContent = q.category || 'Genel Kültür';

    const qtypeBadge = document.getElementById('m-quiz-qtype-badge');
    if (qtypeBadge) {
      if (q.type === 'tf') {
        qtypeBadge.textContent = '✓/✗ Doğru / Yanlış';
        qtypeBadge.style.color = '#10b981';
        qtypeBadge.style.background = 'rgba(16, 185, 129, 0.12)';
      } else if (q.type === 'fib') {
        qtypeBadge.textContent = '📝 Boşluk Doldurma';
        qtypeBadge.style.color = '#8b5cf6';
        qtypeBadge.style.background = 'rgba(139, 92, 246, 0.12)';
      } else {
        qtypeBadge.textContent = '🔤 Çoktan Seçmeli';
        qtypeBadge.style.color = '#3b82f6';
        qtypeBadge.style.background = 'rgba(59, 130, 246, 0.12)';
      }
    }

    const activeStudentEl = document.getElementById('m-quiz-active-student-name');
    if (activeStudentEl) {
      activeStudentEl.textContent = quizActiveStudent || 'Öğrenci Seçilmedi (Kura Çekebilirsiniz)';
    }

    const scoreBadge = document.getElementById('m-quiz-score-badge');
    if (scoreBadge) {
      let stScore = 0;
      if (quizActiveStudent && quizStudentScores[quizActiveStudent]) {
        const sc = quizStudentScores[quizActiveStudent];
        stScore = typeof sc === 'number' ? sc : (sc.score || 0);
      } else {
        stScore = quizScore;
      }
      scoreBadge.textContent = `Skor: ${stScore}`;
    }

    const qText = document.getElementById('m-quiz-question-text');
    if (qText) {
      let txt = q.text || q.question || '';
      if (q.type === 'fib') {
        txt = escapeHTML(txt).replace(/\[___\]/g, '<span style="border-bottom: 2px dashed var(--m-primary); color: var(--m-primary); padding: 0 8px; font-weight: 900;">____</span>');
        qText.innerHTML = txt;
      } else {
        qText.textContent = txt;
      }
    }

    const imgWrap = document.getElementById('m-quiz-question-image-wrap');
    const imgEl = document.getElementById('m-quiz-question-image');
    if (imgWrap && imgEl) {
      if (q.image) {
        imgEl.src = q.image;
        imgWrap.style.display = 'block';
      } else {
        imgWrap.style.display = 'none';
      }
    }

    const expBox = document.getElementById('m-quiz-explanation-box');
    const expText = document.getElementById('m-quiz-explanation-text');
    if (expBox) expBox.style.display = 'none';
    if (expText) expText.textContent = '';

    const optContainer = document.getElementById('m-quiz-options-container');
    if (optContainer) {
      optContainer.innerHTML = '';
      if (q.type === 'tf') {
        const correctVal = (q.answer === true || q.answer === 'true');
        optContainer.innerHTML = `
          <div class="game-quiz-tf-grid">
            <button class="game-quiz-tf-btn tf-true" onclick="window.handleQuizAnswer(true, ${correctVal})">
              <span style="font-size: 1.4rem;">✓</span>
              <span>DOĞRU</span>
            </button>
            <button class="game-quiz-tf-btn tf-false" onclick="window.handleQuizAnswer(false, ${correctVal})">
              <span style="font-size: 1.4rem;">✗</span>
              <span>YANLIŞ</span>
            </button>
          </div>
        `;
      } else {
        const opts = q.options || [];
        const correctIdx = (typeof q.answer === 'number') ? q.answer : ((typeof q.correct === 'number') ? q.correct : 0);
        optContainer.innerHTML = opts.map((opt, i) => `
          <button class="game-quiz-btn" onclick="window.handleQuizAnswer(${i}, ${correctIdx})">
            <span style="width: 28px; height: 28px; border-radius: 50%; background: var(--m-surface); border: 1.5px solid var(--m-border); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; flex-shrink: 0;">
              ${String.fromCharCode(65 + i)}
            </span>
            <span style="flex: 1; text-align: left;">${escapeHTML(opt)}</span>
          </button>
        `).join('');
      }
    }

    startQuizTimer();
  }

  window.handleQuizAnswer = (selectedAns, correctAns) => {
    if (quizHasAnsweredCurrent) return;
    quizHasAnsweredCurrent = true;
    stopQuizTimer();

    const isCorrect = (selectedAns === correctAns);
    const q = mobileQuizFilteredQuestions[currentQuizIdx];

    if (q && q.type === 'tf') {
      const tfBtns = document.querySelectorAll('.game-quiz-tf-btn');
      tfBtns.forEach(btn => {
        btn.disabled = true;
        const isTrueBtn = btn.classList.contains('tf-true');
        if (isTrueBtn === correctAns) btn.classList.add('correct');
        if (isTrueBtn === selectedAns && !isCorrect) btn.classList.add('wrong');
      });
    } else {
      const btns = document.querySelectorAll('.game-quiz-btn');
      btns.forEach((btn, i) => {
        btn.disabled = true;
        if (i === correctAns) btn.classList.add('correct');
        if (i === selectedAns && !isCorrect) btn.classList.add('wrong');
      });
    }

    if (isCorrect) {
      window.vibrate(35);
      if (quizSoundEnabled) playSynthChime('correct');
      quizScore += 10;
      showMobileToast('👏 Doğru Cevap! (+10 Puan)');

      if (quizActiveStudent) {
        if (!quizStudentScores[quizActiveStudent]) {
          quizStudentScores[quizActiveStudent] = { score: 10, correctCount: 1, incorrectCount: 0 };
        } else if (typeof quizStudentScores[quizActiveStudent] === 'number') {
          quizStudentScores[quizActiveStudent] = { score: quizStudentScores[quizActiveStudent] + 10, correctCount: 1, incorrectCount: 0 };
        } else {
          quizStudentScores[quizActiveStudent].score = (quizStudentScores[quizActiveStudent].score || 0) + 10;
          quizStudentScores[quizActiveStudent].correctCount = (quizStudentScores[quizActiveStudent].correctCount || 0) + 1;
        }
        localStorage.setItem("tf_student_scores", JSON.stringify(quizStudentScores));
      }
    } else {
      window.vibrate(90);
      if (quizSoundEnabled) playSynthChime('wrong');
      showMobileToast('❌ Yanlış Cevap');

      if (quizActiveStudent) {
        if (!quizStudentScores[quizActiveStudent]) {
          quizStudentScores[quizActiveStudent] = { score: 0, correctCount: 0, incorrectCount: 1 };
        } else if (typeof quizStudentScores[quizActiveStudent] === 'number') {
          quizStudentScores[quizActiveStudent] = { score: quizStudentScores[quizActiveStudent], correctCount: 0, incorrectCount: 1 };
        } else {
          quizStudentScores[quizActiveStudent].incorrectCount = (quizStudentScores[quizActiveStudent].incorrectCount || 0) + 1;
        }
        localStorage.setItem("tf_student_scores", JSON.stringify(quizStudentScores));
      }
    }

    const scoreBadge = document.getElementById('m-quiz-score-badge');
    if (scoreBadge) {
      let stScore = 0;
      if (quizActiveStudent && quizStudentScores[quizActiveStudent]) {
        const sc = quizStudentScores[quizActiveStudent];
        stScore = typeof sc === 'number' ? sc : (sc.score || 0);
      } else {
        stScore = quizScore;
      }
      scoreBadge.textContent = `Skor: ${stScore}`;
    }

    if (q && q.explanation) {
      const expBox = document.getElementById('m-quiz-explanation-box');
      const expText = document.getElementById('m-quiz-explanation-text');
      if (expBox && expText) {
        expText.textContent = q.explanation;
        expBox.style.display = 'block';
      }
    }
  };

  window.nextQuizQuestion = () => {
    currentQuizIdx++;
    renderCurrentQuizQuestion();
  };

  window.skipQuizQuestion = () => {
    stopQuizTimer();
    showMobileToast('⏭️ Soru Pas Geçildi');
    currentQuizIdx++;
    renderCurrentQuizQuestion();
  };

  window.restartQuizGame = () => {
    stopQuizTimer();
    currentQuizIdx = 0;
    quizScore = 0;
    applyQuizFilters();
    renderCurrentQuizQuestion();
    showMobileToast('🔄 Yarışma Yeniden Başlatıldı!');
  };

  window.confirmExitQuizGame = () => {
    stopQuizTimer();
    window.backToGamesLanding();
  };

  window.toggleQuizSound = () => {
    quizSoundEnabled = !quizSoundEnabled;
    const icon = document.getElementById('m-quiz-sound-icon');
    if (icon) icon.textContent = quizSoundEnabled ? '🔊' : '🔇';
    try {
      const s = JSON.parse(localStorage.getItem("m_quiz_settings") || "{}");
      s.soundEnabled = quizSoundEnabled;
      localStorage.setItem("m_quiz_settings", JSON.stringify(s));
    } catch (e) {}
    showMobileToast(quizSoundEnabled ? '🔊 Ses efektleri açıldı' : '🔇 Ses efektleri kapatıldı');
  };

  // Kura Çekimi
  window.pickRandomQuizStudent = () => {
    if (!quizSelectedStudentNames || quizSelectedStudentNames.length === 0) {
      showMobileToast('⚠️ Lütfen önce yarışmacı havuzundan öğrenci seçin!');
      window.switchQuizView('students');
      return;
    }

    if (!quizUnselectedStudents || quizUnselectedStudents.length === 0) {
      quizCurrentRound++;
      quizUnselectedStudents = [...quizSelectedStudentNames];
      localStorage.setItem("tf_unselected_students", JSON.stringify(quizUnselectedStudents));
      showMobileToast(`🎉 Tüm öğrenciler cevapladı! ${quizCurrentRound}. Tura geçildi!`);
    }

    openBottomSheet('modal-quiz-raffle');

    const spinner = document.getElementById('m-quiz-raffle-spinner');
    const confirmBtn = document.getElementById('btn-quiz-raffle-confirm');
    const subtext = document.getElementById('m-quiz-raffle-subtext');

    if (confirmBtn) confirmBtn.style.display = 'none';
    if (subtext) subtext.textContent = 'Sıradaki soruyu cevaplayacak şanslı öğrenci belirleniyor!';

    let ticks = 0;
    const maxTicks = 20;
    const pool = [...quizUnselectedStudents];

    const spinInterval = setInterval(() => {
      ticks++;
      const randomIdx = Math.floor(Math.random() * pool.length);
      const candidate = pool[randomIdx] || 'Öğrenci';
      if (spinner) spinner.textContent = candidate;
      if (quizSoundEnabled) playSynthChime('tick');

      if (ticks >= maxTicks) {
        clearInterval(spinInterval);
        const winnerIdx = Math.floor(Math.random() * quizUnselectedStudents.length);
        const winner = quizUnselectedStudents[winnerIdx];
        quizRafflePendingWinner = winner;

        quizUnselectedStudents.splice(winnerIdx, 1);
        localStorage.setItem("tf_unselected_students", JSON.stringify(quizUnselectedStudents));

        if (spinner) {
          spinner.innerHTML = `🌟 ${escapeHTML(winner)} 🌟`;
          spinner.style.borderColor = 'var(--m-success)';
          spinner.style.color = 'var(--m-primary)';
        }
        if (subtext) subtext.textContent = 'Tebrikler! Sıradaki soru senin için geliyor.';
        if (confirmBtn) confirmBtn.style.display = 'inline-flex';
        if (quizSoundEnabled) playSynthChime('fanfare');
        window.vibrate(50);
      }
    }, 80);
  };

  window.confirmQuizRaffleWinner = () => {
    if (quizRafflePendingWinner) {
      quizActiveStudent = quizRafflePendingWinner;
      quizRafflePendingWinner = null;
    }
    window.closeBottomSheet();
    window.switchQuizView('play');
    renderCurrentQuizQuestion();
  };

  // Öğrenci Listesi / Havuzu
  function renderQuizStudentsRoster() {
    const listEl = document.getElementById('m-quiz-students-roster-list');
    const badgeEl = document.getElementById('m-quiz-students-count-badge');
    if (!listEl) return;

    const allStudents = getMobileQuizActiveStudents();
    if (badgeEl) {
      badgeEl.textContent = `${quizSelectedStudentNames.length} / ${allStudents.length} Seçili`;
    }

    if (allStudents.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--m-text-muted);">
          <div style="font-size: 2rem; margin-bottom: 6px;">👥</div>
          <div>Kayıtlı öğrenci bulunamadı. Lütfen sınıfa öğrenci ekleyin.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = allStudents.map(st => {
      const name = getStudentDisplayName(st);
      const isSelected = quizSelectedStudentNames.includes(name);
      let sc = quizStudentScores[name];
      let pts = 0;
      let corr = 0;
      let incorr = 0;
      if (typeof sc === 'number') {
        pts = sc;
      } else if (sc) {
        pts = sc.score || 0;
        corr = sc.correctCount || 0;
        incorr = sc.incorrectCount || 0;
      }

      return `
        <div class="m-quiz-student-item ${isSelected ? 'selected' : ''}" onclick="window.toggleQuizStudentSelection('${escapeHTML(name)}')">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); window.toggleQuizStudentSelection('${escapeHTML(name)}')">
          <div class="student-avatar" style="width: 32px; height: 32px; font-size: 0.82rem;">
            ${escapeHTML(name.charAt(0).toUpperCase())}
          </div>
          <div class="student-info">
            <div class="student-name">${escapeHTML(name)}</div>
            <div class="student-meta">${corr} Doğru • ${incorr} Yanlış</div>
          </div>
          <div class="student-score">${pts} Puan</div>
        </div>
      `;
    }).join('');
  }

  window.toggleQuizStudentSelection = (name) => {
    const idx = quizSelectedStudentNames.indexOf(name);
    if (idx >= 0) {
      quizSelectedStudentNames.splice(idx, 1);
    } else {
      quizSelectedStudentNames.push(name);
    }
    localStorage.setItem("quiz_selected_students", JSON.stringify(quizSelectedStudentNames));

    quizUnselectedStudents = quizUnselectedStudents.filter(n => quizSelectedStudentNames.includes(n));
    if (idx < 0 && !quizUnselectedStudents.includes(name)) {
      quizUnselectedStudents.push(name);
    }
    localStorage.setItem("tf_unselected_students", JSON.stringify(quizUnselectedStudents));

    renderQuizStudentsRoster();
  };

  window.selectAllQuizStudents = (selectAll) => {
    const allStudents = getMobileQuizActiveStudents();
    const allNames = allStudents.map(s => getStudentDisplayName(s));
    if (selectAll) {
      quizSelectedStudentNames = [...allNames];
      quizUnselectedStudents = [...allNames];
    } else {
      quizSelectedStudentNames = [];
      quizUnselectedStudents = [];
    }
    localStorage.setItem("quiz_selected_students", JSON.stringify(quizSelectedStudentNames));
    localStorage.setItem("tf_unselected_students", JSON.stringify(quizUnselectedStudents));
    renderQuizStudentsRoster();
    showMobileToast(selectAll ? 'Tüm öğrenciler seçildi' : 'Seçimler temizlendi');
  };

  // Soru Havuzu Yönetimi
  function renderQuizPoolList() {
    const container = document.getElementById('m-quiz-pool-list-container');
    const countBadge = document.getElementById('m-quiz-pool-count-badge');
    const catSelect = document.getElementById('m-quiz-pool-category-filter');
    if (!container) return;

    if (catSelect) {
      const cats = Array.from(new Set(mobileQuizQuestions.map(q => q.category).filter(Boolean)));
      catSelect.innerHTML = `<option value="all">Tüm Konular / Paketler</option>` +
        cats.map(c => `<option value="${escapeHTML(c)}" ${quizPoolCategoryFilter === c ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('');
    }

    let list = [...mobileQuizQuestions];
    if (quizPoolCategoryFilter && quizPoolCategoryFilter !== 'all') {
      list = list.filter(q => q.category === quizPoolCategoryFilter);
    }
    if (quizPoolSearchText && quizPoolSearchText.trim() !== '') {
      const st = quizPoolSearchText.toLowerCase().trim();
      list = list.filter(q => (q.text || '').toLowerCase().includes(st) || (q.category || '').toLowerCase().includes(st));
    }

    if (countBadge) countBadge.textContent = `${list.length} Soru`;

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 6px;">📦</div>
          <div>Filtrelere uygun soru bulunamadı.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(q => {
      let typeLabel = 'Çoktan Seçmeli';
      let typeColor = '#3b82f6';
      if (q.type === 'tf') {
        typeLabel = 'Doğru / Yanlış';
        typeColor = '#10b981';
      } else if (q.type === 'fib') {
        typeLabel = 'Boşluk Doldur';
        typeColor = '#8b5cf6';
      }

      let answerDisplay = '';
      if (q.type === 'tf') {
        const isTrue = (q.answer === true || q.answer === 'true');
        answerDisplay = isTrue ? '✓ DOĞRU' : '✗ YANLIŞ';
      } else if (q.options && q.options.length > 0) {
        const corrIdx = Number(q.answer) || 0;
        const letter = String.fromCharCode(65 + corrIdx);
        answerDisplay = `${letter}) ${escapeHTML(q.options[corrIdx] || '')}`;
      }

      return `
        <div class="m-quiz-pool-card">
          <div class="m-quiz-pool-card-header">
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              <span class="m-badge" style="background: rgba(99,102,241,0.1); color: ${typeColor}; font-weight: 800; font-size: 0.7rem;">
                ${typeLabel}
              </span>
              <span class="m-badge" style="background: var(--m-surface-subtle); color: var(--m-text-muted); font-size: 0.7rem;">
                ${escapeHTML(q.category || 'Genel')}
              </span>
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="m-icon-btn" onclick="window.openQuizAddQuestionModal(${q.id})" title="Düzenle" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--m-border); background: var(--m-surface); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 0.8rem;">✏️</span>
              </button>
              <button class="m-icon-btn" onclick="window.deleteQuizQuestion(${q.id})" title="Sil" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--m-border); background: var(--m-surface); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--m-danger);">
                <span style="font-size: 0.8rem;">🗑️</span>
              </button>
            </div>
          </div>
          <div class="m-quiz-pool-card-text">
            ${escapeHTML(q.text || '')}
          </div>
          <div class="m-quiz-pool-card-ans">
            <span style="color: var(--m-primary); font-weight: 800;">Doğru Cevap:</span> ${answerDisplay}
          </div>
          ${q.explanation ? `<div style="font-size: 0.74rem; color: var(--m-text-muted); margin-top: 4px; font-style: italic;">💡 ${escapeHTML(q.explanation)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  window.filterQuizPoolByCategory = (cat) => {
    quizPoolCategoryFilter = cat;
    renderQuizPoolList();
  };

  window.filterQuizPoolBySearch = (txt) => {
    quizPoolSearchText = txt;
    renderQuizPoolList();
  };

  window.deleteQuizQuestion = (id) => {
    if (!confirm('Bu soruyu havuzdan silmek istediğinize emin misiniz?')) return;
    mobileQuizQuestions = mobileQuizQuestions.filter(q => q.id !== id);
    localStorage.setItem("tf_questions", JSON.stringify(mobileQuizQuestions));
    if (window.stateManager && window.stateManager.state) {
      window.stateManager.state.quizQuestions = mobileQuizQuestions;
    }
    applyQuizFilters();
    renderQuizPoolList();
    showMobileToast('Soru havuzdan silindi.');
  };

  window.restoreDefaultQuizQuestions = () => {
    if (!confirm('Örnek soruları tekrar yüklemek istediğinize emin misiniz? Mevcut havuz sıfırlanacaktır.')) return;
    mobileQuizQuestions = [...defaultMobileQuizQuestions];
    localStorage.setItem("tf_questions", JSON.stringify(mobileQuizQuestions));
    if (window.stateManager && window.stateManager.state) {
      window.stateManager.state.quizQuestions = mobileQuizQuestions;
    }
    applyQuizFilters();
    renderQuizPoolList();
    showMobileToast('Örnek sorular başarıyla yüklendi! (17 Soru)');
  };

  // Soru Ekleme / Düzenleme
  window.openQuizAddQuestionModal = (editId) => {
    const editIdInput = document.getElementById('m-qform-edit-id');
    const formTitle = document.getElementById('m-quiz-form-title');
    const catSelect = document.getElementById('m-qform-category-select');
    const catCustom = document.getElementById('m-qform-category-custom');
    const textInput = document.getElementById('m-qform-text');
    const expInput = document.getElementById('m-qform-explanation');
    const imgInput = document.getElementById('m-qform-image');

    const cats = Array.from(new Set(mobileQuizQuestions.map(q => q.category).filter(Boolean)));
    if (catSelect) {
      catSelect.innerHTML = cats.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('') +
        `<option value="__new__">+ Yeni Konu Ekle...</option>`;
    }

    if (editId) {
      const q = mobileQuizQuestions.find(item => item.id == editId);
      if (!q) return;
      if (editIdInput) editIdInput.value = editId;
      if (formTitle) formTitle.textContent = 'Soruyu Düzenle';
      if (textInput) textInput.value = q.text || '';
      if (expInput) expInput.value = q.explanation || '';
      if (imgInput) imgInput.value = q.image || '';

      if (catSelect) {
        if (cats.includes(q.category)) {
          catSelect.value = q.category;
          if (catCustom) catCustom.value = '';
        } else {
          catSelect.value = '__new__';
          if (catCustom) catCustom.value = q.category || '';
        }
      }

      window.setQuizFormType(q.type || 'tf');

      if (q.type === 'tf') {
        const isTrue = (q.answer === true || q.answer === 'true');
        const radios = document.getElementsByName('m-qform-tf-ans');
        radios.forEach(r => {
          r.checked = (r.value === 'true' && isTrue) || (r.value === 'false' && !isTrue);
        });
      } else {
        const opts = q.options || [];
        for (let i = 0; i < 4; i++) {
          const optInput = document.getElementById(`m-qform-opt-${i}`);
          if (optInput) optInput.value = opts[i] || '';
        }
        const radios = document.getElementsByName('m-qform-mc-correct');
        const corrIdx = Number(q.answer) || 0;
        radios.forEach(r => {
          r.checked = (Number(r.value) === corrIdx);
        });
      }
    } else {
      if (editIdInput) editIdInput.value = '';
      if (formTitle) formTitle.textContent = 'Yeni Soru Hazırla';
      if (textInput) textInput.value = '';
      if (expInput) expInput.value = '';
      if (imgInput) imgInput.value = '';
      if (catCustom) catCustom.value = '';
      for (let i = 0; i < 4; i++) {
        const optInput = document.getElementById(`m-qform-opt-${i}`);
        if (optInput) optInput.value = '';
      }
      window.setQuizFormType('tf');
    }

    openBottomSheet('modal-quiz-add-question');
  };

  window.setQuizFormType = (type) => {
    quizFormActiveType = type;
    const btnTf = document.getElementById('btn-qtype-tf');
    const btnMc = document.getElementById('btn-qtype-mc');
    const btnFib = document.getElementById('btn-qtype-fib');

    const tfOptions = document.getElementById('m-qform-options-tf');
    const mcOptions = document.getElementById('m-qform-options-mc');

    const setActive = (btn, active) => {
      if (!btn) return;
      if (active) {
        btn.style.background = 'var(--m-primary)';
        btn.style.borderColor = 'var(--m-primary)';
        btn.style.color = 'white';
        btn.style.fontWeight = '800';
      } else {
        btn.style.background = 'var(--m-surface)';
        btn.style.borderColor = 'var(--m-border)';
        btn.style.color = 'var(--m-text)';
        btn.style.fontWeight = '700';
      }
    };

    setActive(btnTf, type === 'tf');
    setActive(btnMc, type === 'mc');
    setActive(btnFib, type === 'fib');

    if (type === 'tf') {
      if (tfOptions) tfOptions.style.display = 'block';
      if (mcOptions) mcOptions.style.display = 'none';
    } else {
      if (tfOptions) tfOptions.style.display = 'none';
      if (mcOptions) mcOptions.style.display = 'block';
    }
  };

  window.handleQuizFormCategoryChange = (val) => {
    const catCustom = document.getElementById('m-qform-category-custom');
    if (val === '__new__') {
      if (catCustom) {
        catCustom.focus();
        catCustom.placeholder = 'Yeni konu adını giriniz...';
      }
    }
  };

  window.saveQuizQuestionFromForm = () => {
    const editId = document.getElementById('m-qform-edit-id')?.value;
    const text = document.getElementById('m-qform-text')?.value?.trim();
    if (!text) {
      showMobileToast('⚠️ Lütfen soru metnini yazınız!');
      return;
    }

    const catSelect = document.getElementById('m-qform-category-select');
    const catCustom = document.getElementById('m-qform-category-custom');
    let category = 'Genel Kültür';
    if (catSelect && catSelect.value === '__new__') {
      category = catCustom?.value?.trim() || 'Özel';
    } else if (catSelect && catSelect.value) {
      category = catSelect.value;
    }

    const explanation = document.getElementById('m-qform-explanation')?.value?.trim() || '';
    const image = document.getElementById('m-qform-image')?.value?.trim() || '';

    let questionObj = {
      id: editId ? Number(editId) : Date.now(),
      type: quizFormActiveType,
      category,
      text,
      explanation,
      image
    };

    if (quizFormActiveType === 'tf') {
      const radios = document.getElementsByName('m-qform-tf-ans');
      let ans = true;
      radios.forEach(r => { if (r.checked) ans = (r.value === 'true'); });
      questionObj.answer = ans;
    } else {
      const opts = [];
      for (let i = 0; i < 4; i++) {
        const val = document.getElementById(`m-qform-opt-${i}`)?.value?.trim() || '';
        opts.push(val);
      }
      if (!opts[0] || !opts[1]) {
        showMobileToast('⚠️ En az 2 seçenek (A ve B) doldurulmalıdır!');
        return;
      }
      questionObj.options = opts;

      const radios = document.getElementsByName('m-qform-mc-correct');
      let corr = 0;
      radios.forEach(r => { if (r.checked) corr = Number(r.value); });
      questionObj.answer = corr;
    }

    if (editId) {
      const idx = mobileQuizQuestions.findIndex(q => q.id == editId);
      if (idx >= 0) {
        mobileQuizQuestions[idx] = questionObj;
      } else {
        mobileQuizQuestions.push(questionObj);
      }
      showMobileToast('✓ Soru güncellendi!');
    } else {
      mobileQuizQuestions.unshift(questionObj);
      showMobileToast('✓ Yeni soru havuza eklendi!');
    }

    localStorage.setItem("tf_questions", JSON.stringify(mobileQuizQuestions));
    if (window.stateManager && window.stateManager.state) {
      window.stateManager.state.quizQuestions = mobileQuizQuestions;
    }

    applyQuizFilters();
    window.closeBottomSheet();
    renderQuizPoolList();
  };

  // Skor Tablosu
  function renderQuizLeaderboard() {
    const listEl = document.getElementById('m-quiz-leaderboard-list');
    if (!listEl) return;

    const allStudents = getMobileQuizActiveStudents();
    const ranked = allStudents.map(st => {
      const name = getStudentDisplayName(st);
      let sc = quizStudentScores[name];
      let pts = 0;
      let corr = 0;
      let incorr = 0;
      if (typeof sc === 'number') {
        pts = sc;
      } else if (sc) {
        pts = sc.score || 0;
        corr = sc.correctCount || 0;
        incorr = sc.incorrectCount || 0;
      }
      return { id: st.id, name, pts, corr, incorr };
    }).sort((a, b) => b.pts - a.pts);

    if (ranked.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 6px;">🏆</div>
          <div>Liderlik tablosu henüz boş.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = ranked.map((st, i) => {
      let rankBadge = `${i + 1}.`;
      if (i === 0) rankBadge = '🥇';
      else if (i === 1) rankBadge = '🥈';
      else if (i === 2) rankBadge = '🥉';

      return `
        <div class="m-quiz-leaderboard-row ${i === 0 ? 'rank-1' : ''}">
          <div class="rank-num">${rankBadge}</div>
          <div class="player-info">
            <div class="player-name">${escapeHTML(st.name)}</div>
            <div class="player-stats">${st.corr} Doğru • ${st.incorr} Yanlış</div>
          </div>
          <div class="player-pts">${st.pts} Puan</div>
        </div>
      `;
    }).join('');
  }

  window.transferQuizScoresToClassPoints = () => {
    const allStudents = getMobileQuizActiveStudents();
    let transferCount = 0;
    let totalPoints = 0;

    allStudents.forEach(st => {
      const name = getStudentDisplayName(st);
      let sc = quizStudentScores[name];
      let pts = 0;
      if (typeof sc === 'number') pts = sc;
      else if (sc) pts = sc.score || 0;

      if (pts > 0 && window.stateManager && typeof window.stateManager.addScore === 'function') {
        window.stateManager.addScore(st.id, pts, 'Bilgi Yarışması');
        transferCount++;
        totalPoints += pts;
      }
    });

    if (transferCount === 0) {
      showMobileToast('Aktarılacak pozitif puan bulunamadı.');
      return;
    }

    showMobileToast(`⭐ ${transferCount} öğrenciye toplam ${totalPoints} puan başarıyla aktarıldı!`);
    window.vibrate(40);
  };

  window.resetQuizScores = () => {
    if (!confirm('Tüm yarışma skorlarını sıfırlamak istediğinize emin misiniz?')) return;
    quizStudentScores = {};
    quizScore = 0;
    localStorage.removeItem("tf_student_scores");
    renderQuizLeaderboard();
    showMobileToast('Skorlar sıfırlandı.');
  };

  // Ayarlar Modalı
  window.openQuizSettingsModal = () => {
    const timerSelect = document.getElementById('m-quiz-setting-timer');
    const qtypeSelect = document.getElementById('m-quiz-setting-qtype');
    const catSelect = document.getElementById('m-quiz-setting-category');
    const soundCheck = document.getElementById('m-quiz-setting-sound');

    if (timerSelect) timerSelect.value = String(quizTimerDuration);
    if (qtypeSelect) qtypeSelect.value = quizFilterType;
    if (soundCheck) soundCheck.checked = quizSoundEnabled;

    if (catSelect) {
      const cats = Array.from(new Set(mobileQuizQuestions.map(q => q.category).filter(Boolean)));
      catSelect.innerHTML = `<option value="all">Tüm Konular / Paketler</option>` +
        cats.map(c => `<option value="${escapeHTML(c)}" ${quizFilterCategory === c ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('');
    }

    openBottomSheet('modal-quiz-settings');
  };

  window.saveQuizSettingsFromModal = () => {
    const timerSelect = document.getElementById('m-quiz-setting-timer');
    const qtypeSelect = document.getElementById('m-quiz-setting-qtype');
    const catSelect = document.getElementById('m-quiz-setting-category');
    const soundCheck = document.getElementById('m-quiz-setting-sound');

    if (timerSelect) quizTimerDuration = parseInt(timerSelect.value) || 0;
    if (qtypeSelect) quizFilterType = qtypeSelect.value;
    if (catSelect) quizFilterCategory = catSelect.value;
    if (soundCheck) quizSoundEnabled = soundCheck.checked;

    const icon = document.getElementById('m-quiz-sound-icon');
    if (icon) icon.textContent = quizSoundEnabled ? '🔊' : '🔇';

    const settingsObj = {
      timerSeconds: quizTimerDuration,
      qType: quizFilterType,
      category: quizFilterCategory,
      soundEnabled: quizSoundEnabled
    };
    localStorage.setItem("m_quiz_settings", JSON.stringify(settingsObj));

    applyQuizFilters();
    window.closeBottomSheet();
    renderCurrentQuizQuestion();
    showMobileToast('✓ Oyun ve zaman ayarları kaydedildi!');
  };

  // Oyun 2: Çarpım Tablosu Düellosu
  window.startMobileMathGame = () => {
    const landing = document.getElementById('m-games-landing');
    const arenaMath = document.getElementById('m-arena-math');
    const title = document.getElementById('m-games-header-title');
    if (landing) landing.style.display = 'none';
    if (arenaMath) arenaMath.style.display = 'block';
    if (title) title.textContent = 'Çarpım Tablosu';

    mathStreak = 0;
    mathScore = 0;
    nextMathQuestion();
  };

  function nextMathQuestion() {
    const a = Math.floor(Math.random() * 8) + 2; // 2..9
    const b = Math.floor(Math.random() * 8) + 2; // 2..9
    mathCurrentAnswer = a * b;

    const formulaEl = document.getElementById('m-math-formula');
    const streakEl = document.getElementById('m-math-streak');
    const scoreEl = document.getElementById('m-math-score');
    const optContainer = document.getElementById('m-math-options-container');

    if (formulaEl) formulaEl.textContent = `${a} × ${b} = ?`;
    if (streakEl) streakEl.textContent = `🔥 Seri: ${mathStreak}`;
    if (scoreEl) scoreEl.textContent = `Doğru: ${mathScore}`;

    // 4 seçenek oluştur (1 doğru, 3 çeldirici)
    const options = new Set([mathCurrentAnswer]);
    while (options.size < 4) {
      const offset = (Math.floor(Math.random() * 7) - 3) * (Math.random() > 0.5 ? a : b);
      const fake = mathCurrentAnswer + (offset !== 0 ? offset : (Math.random() > 0.5 ? 2 : -2));
      if (fake > 0 && fake !== mathCurrentAnswer) options.add(fake);
    }
    const shuffled = Array.from(options).sort(() => Math.random() - 0.5);

    if (optContainer) {
      optContainer.innerHTML = shuffled.map(val => `
        <button class="game-quiz-btn" style="justify-content: center; font-size: 1.4rem; font-weight: 800; padding: 1.25rem 0.5rem;" onclick="window.handleMathAnswer(${val})">
          ${val}
        </button>
      `).join('');
    }
  }

  window.handleMathAnswer = (val) => {
    if (val === mathCurrentAnswer) {
      window.vibrate(30);
      playSynthChime('correct');
      mathStreak++;
      mathScore++;
      showMobileToast(`👏 Harika! Doğru (${val})`);
      setTimeout(nextMathQuestion, 300);
    } else {
      window.vibrate(120);
      playSynthChime('wrong');
      mathStreak = 0;
      showMobileToast(`❌ Yanlış! Doğrusu: ${mathCurrentAnswer}`);
      setTimeout(nextMathQuestion, 700);
    }
  };

  // Oyun 3: Hazine Sandığı
  const treasurePrizes = [
    { text: "🪙 +10 Altın Puan", points: 10, icon: "🪙" },
    { text: "⭐ +5 Yıldız Puanı", points: 5, icon: "⭐" },
    { text: "💎 +15 Elmas Puan", points: 15, icon: "💎" },
    { text: "❓ Soru Kartı: Soruyu Bil, 20 Puanı Kap!", points: 20, icon: "📜" },
    { text: "🎁 Sürpriz Alkış & Tebrik", points: 2, icon: "🎁" },
    { text: "🛡️ Şans Kalkanı (+3 Puan)", points: 3, icon: "🛡️" }
  ];

  window.startMobileTreasureGame = () => {
    const landing = document.getElementById('m-games-landing');
    const arenaTreasure = document.getElementById('m-arena-treasure');
    const title = document.getElementById('m-games-header-title');
    if (landing) landing.style.display = 'none';
    if (arenaTreasure) arenaTreasure.style.display = 'block';
    if (title) title.textContent = 'Hazine Sandığı';

    window.resetTreasureChests();
  };

  window.resetTreasureChests = () => {
    const grid = document.getElementById('m-treasure-chests-grid');
    const resBox = document.getElementById('m-treasure-result');
    if (resBox) resBox.style.display = 'none';

    // 6 sandığı karıştır
    const shuffled = [...treasurePrizes].sort(() => Math.random() - 0.5);

    if (grid) {
      grid.innerHTML = [1, 2, 3, 4, 5, 6].map((num, i) => `
        <div class="treasure-chest-box" id="chest-${i}" onclick="window.openTreasureChest(${i}, '${escapeHTML(shuffled[i].text)}', ${shuffled[i].points}, '${shuffled[i].icon}')">
          <div style="font-size: 2.2rem;">📦</div>
          <div style="font-size: 0.85rem; font-weight: 800; color: var(--m-text);">Sandık ${num}</div>
        </div>
      `).join('');
    }
  };

  window.openTreasureChest = (chestIdx, prizeText, points, icon) => {
    const chest = document.getElementById(`chest-${chestIdx}`);
    if (chest && chest.classList.contains('opened')) return;

    window.vibrate(50);
    playSynthChime('fanfare');

    if (chest) {
      chest.classList.add('opened');
      chest.innerHTML = `
        <div style="font-size: 2.2rem; animation: tabFadeIn 0.3s;">${icon}</div>
        <div style="font-size: 0.75rem; font-weight: 800; color: var(--m-warning);">AÇILDI</div>
      `;
    }

    const resBox = document.getElementById('m-treasure-result');
    if (resBox) {
      resBox.style.display = 'block';
      resBox.innerHTML = `
        <div style="font-size: 1.15rem; font-weight: 800; color: var(--m-text);">${prizeText}</div>
        <div style="font-size: 0.8rem; color: var(--m-text-muted); margin-top: 4px;">Şanslı öğrencinize bu puanı hemen işleyebilirsiniz!</div>
      `;
    }
  };

  // ==========================================================================
  // 3. GÖREVLER MODÜLÜ (GÖREV TAKİP ASİSTANI)
  // ==========================================================================
  let currentTasksFilter = 'active'; // 'active' | 'completed' | 'passive'

  window.toggleTasksFab = () => {
    const menu = document.getElementById('m-tasks-fab-menu');
    const btn = document.getElementById('m-tasks-fab-btn');
    if (menu) menu.classList.toggle('show');
    if (btn) btn.classList.toggle('active');
  };

  window.setTasksFilter = (filter) => {
    currentTasksFilter = filter;
    window.toggleTasksFab();

    const titleEl = document.getElementById('m-tasks-filter-title');
    if (titleEl) {
      titleEl.textContent = filter === 'active' ? 'Aktif Görevler'
        : filter === 'completed' ? 'Teslim Edilen Görevler'
        : 'Pasif / Arşiv Görevler';
    }

    document.querySelectorAll('#m-tasks-fab-menu .mobile-fab-item').forEach(b => b.classList.remove('active'));
    renderMobileTasks();
  };

  function renderMobileTasks() {
    const container = document.getElementById('m-tasks-list-container');
    const countBadge = document.getElementById('m-tasks-count-badge');
    if (!container) return;

    const state = window.stateManager ? window.stateManager.state : {};
    let tasks = state.tasks || [];

    // Filtreleme
    let filtered = tasks.filter(t => {
      const status = t.status || 'active';
      return status === currentTasksFilter;
    });

    if (countBadge) countBadge.textContent = `${filtered.length} Görev`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="check-square" class="empty-icon"></i>
          <div class="empty-title">Kayıtlı Görev Bulunmuyor</div>
          <div class="empty-desc">Bu filtreye ait görev kaydı yok. "+ Görev Tanımla" butonuyla yeni görev verebilirsiniz.</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = filtered.map(t => {
      const isCompleted = t.status === 'completed';
      const studentName = t.studentName || 'Tüm Sınıf';
      const points = t.points || 10;
      const deadline = t.deadline || 'Süresiz';

      return `
        <div class="m-item-card">
          <div class="m-item-header">
            <div>
              <div class="m-item-title">${escapeHTML(t.title)}</div>
              <div style="font-size: 0.75rem; color: var(--m-text-muted); margin-top: 2px;">
                👤 ${escapeHTML(studentName)} • 📅 ${escapeHTML(deadline)}
              </div>
            </div>
            <span class="m-badge ${isCompleted ? 'm-badge-success' : 'm-badge-active'}">
              +${points} Puan
            </span>
          </div>

          ${t.description ? `<div style="font-size: 0.8rem; color: var(--m-text); line-height: 1.35;">${escapeHTML(t.description)}</div>` : ''}

          <div class="m-item-actions">
            ${!isCompleted ? `
              <button class="m-btn-sm success" onclick="window.completeMobileTask('${t.id}')">
                <i data-lucide="check" style="width: 14px; height: 14px;"></i> Teslim Alındı (+${points})
              </button>
            ` : `
              <button class="m-btn-sm" onclick="window.revertMobileTask('${t.id}')">
                <i data-lucide="rotate-ccw" style="width: 14px; height: 14px;"></i> Geri Al
              </button>
            `}
            <button class="m-btn-sm" style="flex: 0 0 42px;" onclick="window.deleteMobileTask('${t.id}')" title="Sil">
              <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--m-danger);"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  window.openAssignTaskModal = () => {
    const studentSelect = document.getElementById('m-task-student');
    if (studentSelect) {
      studentSelect.innerHTML = '<option value="all">Tüm Sınıf</option>';
      const students = getFilteredStudents();
      students.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st.id;
        opt.textContent = `${st.name} ${st.surname || ''} (${st.number || '-'})`;
        studentSelect.appendChild(opt);
      });
    }

    const deadlineInput = document.getElementById('m-task-deadline');
    if (deadlineInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      deadlineInput.value = tomorrow.toISOString().slice(0, 10);
    }

    openBottomSheet('modal-assign-task');
  };

  window.saveNewTask = () => {
    const titleInput = document.getElementById('m-task-title');
    const descInput = document.getElementById('m-task-desc');
    const studentSelect = document.getElementById('m-task-student');
    const deadlineInput = document.getElementById('m-task-deadline');
    const pointsInput = document.getElementById('m-task-points');

    const title = titleInput ? titleInput.value.trim() : '';
    if (!title) {
      showMobileToast('Lütfen görev başlığı girin');
      return;
    }

    const newTask = {
      id: 'task_' + Date.now(),
      title,
      description: descInput ? descInput.value.trim() : '',
      studentId: studentSelect ? studentSelect.value : 'all',
      studentName: (studentSelect && studentSelect.value !== 'all') ? studentSelect.options[studentSelect.selectedIndex].text : 'Tüm Sınıf',
      deadline: deadlineInput ? deadlineInput.value : '',
      points: pointsInput ? parseInt(pointsInput.value) || 10 : 10,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    if (!window.stateManager.state.tasks) window.stateManager.state.tasks = [];
    window.stateManager.state.tasks.push(newTask);
    window.stateManager.saveState();

    window.closeBottomSheet();
    window.vibrate(30);
    showMobileToast('✅ Görev başarıyla oluşturuldu!');
    renderMobileTasks();
  };

  window.completeMobileTask = (taskId) => {
    const state = window.stateManager.state;
    const task = (state.tasks || []).find(t => t.id === taskId);
    if (!task) return;

    task.status = 'completed';
    task.completedAt = new Date().toISOString();

    // Öğrenciye puan ver
    if (task.studentId && task.studentId !== 'all') {
      window.stateManager.addPoint(task.studentId, task.points || 10, `Görev: ${task.title}`);
    }

    window.stateManager.saveState();
    window.vibrate(35);
    playSynthChime('correct');
    showMobileToast(`✓ Görev teslim alındı (+${task.points || 10} Puan)!`);
    renderMobileTasks();
  };

  window.revertMobileTask = (taskId) => {
    const state = window.stateManager.state;
    const task = (state.tasks || []).find(t => t.id === taskId);
    if (!task) return;

    task.status = 'active';
    window.stateManager.saveState();
    window.vibrate(20);
    showMobileToast('Görev aktife çekildi');
    renderMobileTasks();
  };

  window.deleteMobileTask = (taskId) => {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    window.stateManager.state.tasks = (window.stateManager.state.tasks || []).filter(t => t.id !== taskId);
    window.stateManager.saveState();
    window.vibrate(25);
    showMobileToast('Görev silindi');
    renderMobileTasks();
  };

  // ==========================================================================
  // 4. ARAÇLAR MODÜLÜ (SINIF YARDIMCI ARAÇLARI)
  // ==========================================================================
  function renderMobileTools() {
    // Statik kartlar mobile.html içinde hazır
  }

  window.openToolModal = (toolType) => {
    const titleEl = document.getElementById('m-tool-window-title');
    const bodyEl = document.getElementById('m-tool-window-body');
    if (!titleEl || !bodyEl) return;

    const students = getFilteredStudents();

    if (toolType === 'lucky') {
      titleEl.textContent = '🎲 Şanslı Öğrenci (Kura)';
      bodyEl.innerHTML = `
        <div style="text-align: center; padding: 1.5rem 0.5rem;">
          <div id="tool-lucky-display" style="font-size: 1.4rem; font-weight: 800; min-height: 80px; display: flex; align-items: center; justify-content: center; background: var(--m-surface-subtle); border-radius: var(--m-radius-md); border: 2px dashed var(--m-warning); margin-bottom: 1.25rem;">
            Kurayı Başlatın!
          </div>
          <button class="subview-primary-action-btn" onclick="window.spinLuckyStudentTool()">
            <i data-lucide="shuffle" style="width: 18px; height: 18px;"></i> Kura Çek
          </button>
        </div>
      `;
    } else if (toolType === 'timer') {
      titleEl.textContent = '⏱️ Akıllı Sayaç & Kronometre';
      bodyEl.innerHTML = `
        <div style="text-align: center; padding: 1rem 0.5rem;">
          <div style="font-size: 3.2rem; font-weight: 900; color: var(--m-primary); font-variant-numeric: tabular-nums; margin-bottom: 1rem;" id="tool-timer-clock">
            05:00
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 1.25rem;">
            <button class="m-btn-sm" onclick="window.setToolTimerMinutes(1)">1 Dk</button>
            <button class="m-btn-sm" onclick="window.setToolTimerMinutes(2)">2 Dk</button>
            <button class="m-btn-sm" onclick="window.setToolTimerMinutes(3)">3 Dk</button>
            <button class="m-btn-sm" onclick="window.setToolTimerMinutes(5)">5 Dk</button>
            <button class="m-btn-sm" onclick="window.setToolTimerMinutes(10)">10 Dk</button>
            <button class="m-btn-sm" onclick="window.setToolTimerMinutes(15)">15 Dk</button>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="subview-primary-action-btn" id="btn-tool-timer-start" onclick="window.toggleToolTimer()">
              Başlat
            </button>
            <button class="m-btn-sm" onclick="window.resetToolTimer()">Sıfırla</button>
          </div>
        </div>
      `;
    } else if (toolType === 'sounds') {
      titleEl.textContent = '🔔 Sınıf Zil & Efekt Sesleri';
      bodyEl.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 0.5rem 0;">
          <button class="game-quiz-btn" style="justify-content: center; flex-direction: column; text-align: center; padding: 1.25rem 0.5rem;" onclick="window.playSynthChime('bell')">
            <span style="font-size: 1.8rem; margin-bottom: 4px;">🔔</span>
            <span>Ders Zili</span>
          </button>
          <button class="game-quiz-btn" style="justify-content: center; flex-direction: column; text-align: center; padding: 1.25rem 0.5rem;" onclick="window.playSynthChime('applause')">
            <span style="font-size: 1.8rem; margin-bottom: 4px;">👏</span>
            <span>Büyük Alkış</span>
          </button>
          <button class="game-quiz-btn" style="justify-content: center; flex-direction: column; text-align: center; padding: 1.25rem 0.5rem;" onclick="window.playSynthChime('correct')">
            <span style="font-size: 1.8rem; margin-bottom: 4px;">✨</span>
            <span>Doğru Sesi</span>
          </button>
          <button class="game-quiz-btn" style="justify-content: center; flex-direction: column; text-align: center; padding: 1.25rem 0.5rem;" onclick="window.playSynthChime('wrong')">
            <span style="font-size: 1.8rem; margin-bottom: 4px;">❌</span>
            <span>Hata / Buzzer</span>
          </button>
          <button class="game-quiz-btn" style="justify-content: center; flex-direction: column; text-align: center; padding: 1.25rem 0.5rem;" onclick="window.playSynthChime('fanfare')">
            <span style="font-size: 1.8rem; margin-bottom: 4px;">🎺</span>
            <span>Zafer Trompeti</span>
          </button>
          <button class="game-quiz-btn" style="justify-content: center; flex-direction: column; text-align: center; padding: 1.25rem 0.5rem;" onclick="window.playSynthChime('silence')">
            <span style="font-size: 1.8rem; margin-bottom: 4px;">🤫</span>
            <span>Sessizlik Zili</span>
          </button>
        </div>
      `;
    } else if (toolType === 'groups') {
      titleEl.textContent = '👥 Grup / Takım Oluşturucu';
      bodyEl.innerHTML = `
        <div style="padding: 0.5rem 0;">
          <div class="m-form-group">
            <label class="m-form-label">Grup Sayısı</label>
            <select class="m-form-select" id="m-groups-count">
              <option value="2">2 Takım</option>
              <option value="3">3 Takım</option>
              <option value="4" selected>4 Takım</option>
              <option value="5">5 Takım</option>
              <option value="6">6 Takım</option>
            </select>
          </div>
          <button class="subview-primary-action-btn" onclick="window.generateGroupsTool()">
            <i data-lucide="shuffle" style="width: 18px; height: 18px;"></i> Grupları Oluştur
          </button>
          <div id="tool-groups-result" style="margin-top: 1.25rem; display: flex; flex-direction: column; gap: 10px;"></div>
        </div>
      `;
    } else if (toolType === 'roster') {
      window.openDutyRosterModal();
      return;
    } else if (toolType === 'seating') {
      window.openSeatingPlanModal();
      return;
    } else if (toolType === 'schedule') {
      window.openScheduleFlowModal('schedule');
      return;
    } else if (toolType === 'supplies') {
      window.openSuppliesModal();
      return;
    } else if (toolType === 'documents') {
      window.openDocumentsModal();
      return;
    } else if (toolType === 'exams') {
      window.openExamsHubModal();
      return;
    }

    openBottomSheet('modal-tool-window');
  };

  // Kura Döndürücü
  window.spinLuckyStudentTool = () => {
    const students = getFilteredStudents();
    if (students.length === 0) {
      showMobileToast('Bu şubede öğrenci bulunamadı!');
      return;
    }
    const display = document.getElementById('tool-lucky-display');
    if (!display) return;

    let count = 0;
    const interval = setInterval(() => {
      const rand = students[Math.floor(Math.random() * students.length)];
      display.textContent = `${rand.name} ${rand.surname || ''}`;
      window.vibrate(10);
      count++;
      if (count > 15) {
        clearInterval(interval);
        const winner = students[Math.floor(Math.random() * students.length)];
        display.innerHTML = `
          <div style="color: var(--m-primary); font-size: 1.5rem; animation: tabFadeIn 0.3s;">
            🎉 ${escapeHTML(winner.name)} ${escapeHTML(winner.surname || '')} (${escapeHTML(winner.number || '-')})
          </div>
        `;
        window.vibrate(60);
        playSynthChime('fanfare');
      }
    }, 80);
  };

  // Sayaç Aracı Mantığı
  let toolTimerSec = 300;
  let toolTimerInterval = null;

  window.setToolTimerMinutes = (m) => {
    clearInterval(toolTimerInterval);
    toolTimerInterval = null;
    toolTimerSec = m * 60;
    updateToolTimerDisplay();
  };

  function updateToolTimerDisplay() {
    const el = document.getElementById('tool-timer-clock');
    if (!el) return;
    const m = Math.floor(toolTimerSec / 60);
    const s = toolTimerSec % 60;
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  window.toggleToolTimer = () => {
    const btn = document.getElementById('btn-tool-timer-start');
    if (toolTimerInterval) {
      clearInterval(toolTimerInterval);
      toolTimerInterval = null;
      if (btn) btn.textContent = 'Devam Et';
    } else {
      if (btn) btn.textContent = 'Durdur';
      toolTimerInterval = setInterval(() => {
        toolTimerSec--;
        updateToolTimerDisplay();
        if (toolTimerSec <= 0) {
          clearInterval(toolTimerInterval);
          toolTimerInterval = null;
          if (btn) btn.textContent = 'Başlat';
          window.vibrate(200);
          playSynthChime('bell');
          showMobileToast('🔔 Süre Tamamlandı!');
        }
      }, 1000);
    }
  };

  window.resetToolTimer = () => {
    clearInterval(toolTimerInterval);
    toolTimerInterval = null;
    toolTimerSec = 300;
    updateToolTimerDisplay();
    const btn = document.getElementById('btn-tool-timer-start');
    if (btn) btn.textContent = 'Başlat';
  };

  // Web Audio Synthesizer (Harici dosya indirmeden ses üretimi)
  function playSynthChime(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'correct') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'wrong') {
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(196, now + 0.12);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'bell') {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
      } else if (type === 'fanfare') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'tick') {
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else {
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Sessiz yut
    }
  }
  window.playSynthChime = playSynthChime;

  // Grup Oluşturucu
  window.generateGroupsTool = () => {
    const students = getFilteredStudents();
    const select = document.getElementById('m-groups-count');
    const groupCount = select ? parseInt(select.value) || 4 : 4;
    const resBox = document.getElementById('tool-groups-result');
    if (!resBox) return;

    if (students.length === 0) {
      resBox.innerHTML = '<div class="empty-state">Öğrenci bulunamadı.</div>';
      return;
    }

    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const groups = Array.from({ length: groupCount }, () => []);

    shuffled.forEach((st, i) => {
      groups[i % groupCount].push(st);
    });

    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

    resBox.innerHTML = groups.map((grp, i) => `
      <div class="m-item-card" style="border-left: 4px solid ${colors[i % colors.length]};">
        <div style="font-weight: 800; font-size: 0.95rem; color: ${colors[i % colors.length]};">
          ${i + 1}. Takım (${grp.length} Öğrenci)
        </div>
        <div style="font-size: 0.82rem; color: var(--m-text); line-height: 1.4; margin-top: 4px;">
          ${grp.map(s => `${escapeHTML(s.name)} ${escapeHTML(s.surname || '')}`).join(', ')}
        </div>
      </div>
    `).join('');

    window.vibrate(30);
  };

  // ==========================================================================
  // 4.1 SINIF NÖBET LİSTESİ YÖNETİMİ (MOBİL)
  // ==========================================================================
  let mobileRosterHolidays = [];
  let activeRosterFilter = 'all';

  function shuffleArrayMobile(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  window.openDutyRosterModal = () => {
    window.vibrate(15);
    activeRosterFilter = 'all';
    openBottomSheet('modal-duty-roster');
    window.renderDutyRosterContent();
  };

  window.setRosterFilter = (filter) => {
    activeRosterFilter = filter;
    document.querySelectorAll('#m-roster-filter-chips [data-roster-filter]').forEach(btn => {
      if (btn.getAttribute('data-roster-filter') === filter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    window.renderDutyRosterContent();
  };

  window.openCreateDutyRosterModal = () => {
    window.vibrate(15);
    const existing = (window.stateManager && window.stateManager.getDutyRoster()) || (window.stateManager && window.stateManager.state && window.stateManager.state.dutyRoster);

    const startEl = document.getElementById('m-roster-start-date');
    const endEl = document.getElementById('m-roster-end-date');
    const skipEl = document.getElementById('m-roster-skip-weekends');
    const countEl = document.getElementById('m-roster-student-count');
    const sortEl = document.getElementById('m-roster-sort-order');
    const holInput = document.getElementById('m-roster-holiday-input');

    const todayStr = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    if (startEl) startEl.value = (existing && existing.startDate) || todayStr;
    if (endEl) endEl.value = (existing && existing.endDate) || nextMonth;
    if (skipEl) skipEl.checked = existing ? (existing.skipWeekends !== false) : true;
    if (countEl) countEl.value = (existing && existing.studentCountPerDay) || 2;
    if (sortEl) sortEl.value = (existing && existing.sortOrder) || 'alphabetical';
    if (holInput) holInput.value = '';

    mobileRosterHolidays = (existing && Array.isArray(existing.holidays)) ? [...existing.holidays] : [];
    window.renderMobileRosterHolidays();

    openBottomSheet('modal-create-duty-roster');
    if (window.lucide) window.lucide.createIcons();
  };

  window.addMobileRosterHoliday = () => {
    const input = document.getElementById('m-roster-holiday-input');
    if (!input || !input.value) {
      showMobileToast('Lütfen geçerli bir tatil tarihi seçin.', 'warning');
      return;
    }
    const val = input.value;
    if (mobileRosterHolidays.includes(val)) {
      showMobileToast('Bu tarih zaten tatil listesinde ekli.', 'warning');
      return;
    }
    mobileRosterHolidays.push(val);
    mobileRosterHolidays.sort();
    input.value = '';
    window.vibrate(10);
    window.renderMobileRosterHolidays();
  };

  window.removeMobileRosterHoliday = (dateStr) => {
    mobileRosterHolidays = mobileRosterHolidays.filter(d => d !== dateStr);
    window.vibrate(10);
    window.renderMobileRosterHolidays();
  };

  window.renderMobileRosterHolidays = () => {
    const container = document.getElementById('m-roster-holidays-list');
    if (!container) return;
    if (mobileRosterHolidays.length === 0) {
      container.innerHTML = '<span style="font-size: 0.74rem; color: var(--m-text-muted); font-style: italic;">Henüz tatil günü eklenmedi.</span>';
      return;
    }
    container.innerHTML = mobileRosterHolidays.map(dStr => {
      const d = new Date(dStr);
      const formatted = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      return `
        <div class="m-holiday-badge">
          <span>${formatted}</span>
          <button type="button" onclick="window.removeMobileRosterHoliday('${dStr}')" title="Sil">&times;</button>
        </div>
      `;
    }).join('');
  };

  window.generateMobileDutyRoster = () => {
    const startStr = document.getElementById('m-roster-start-date')?.value;
    const endStr = document.getElementById('m-roster-end-date')?.value;
    const skipWeekends = document.getElementById('m-roster-skip-weekends')?.checked ?? true;
    const countEl = document.getElementById('m-roster-student-count');
    const sortOrder = document.getElementById('m-roster-sort-order')?.value || 'alphabetical';

    if (!startStr || !endStr) {
      showMobileToast('Lütfen başlangıç ve bitiş tarihlerini girin.', 'warning');
      return;
    }

    const start = new Date(startStr);
    const end = new Date(endStr);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      showMobileToast('Başlangıç tarihi bitiş tarihinden sonra olamaz!', 'warning');
      return;
    }

    const activeStudents = getFilteredStudents();
    const studentCountPerDay = countEl ? (parseInt(countEl.value) || 2) : 2;

    if (isNaN(studentCountPerDay) || studentCountPerDay < 1) {
      showMobileToast('Lütfen geçerli bir günlük görevli sayısı girin.', 'warning');
      return;
    }

    if (activeStudents.length < studentCountPerDay) {
      showMobileToast(`Nöbet listesi hazırlamak için sınıfta en az ${studentCountPerDay} öğrenci olmalıdır!`, 'warning');
      return;
    }

    let studentsPool = [...activeStudents];
    if (sortOrder === 'alphabetical') {
      studentsPool.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
    } else if (sortOrder === 'random') {
      studentsPool = shuffleArrayMobile(studentsPool);
    }

    const assignments = [];
    let poolIndex = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const dateStr = current.toISOString().slice(0, 10);
      const isHoliday = mobileRosterHolidays.includes(dateStr);

      if ((isWeekend && skipWeekends) || isHoliday) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      const dayStudentIds = [];
      for (let s = 0; s < studentCountPerDay; s++) {
        const student = studentsPool[(poolIndex + s) % studentsPool.length];
        dayStudentIds.push(student.id);
      }

      assignments.push({
        date: dateStr,
        studentIds: dayStudentIds
      });

      poolIndex += studentCountPerDay;
      current.setDate(current.getDate() + 1);
    }

    if (assignments.length === 0) {
      showMobileToast('Seçilen tarih aralığında nöbet yazılacak uygun gün bulunamadı.', 'warning');
      return;
    }

    const rosterData = {
      startDate: startStr,
      endDate: endStr,
      skipWeekends: skipWeekends,
      sortOrder: sortOrder,
      studentCountPerDay: studentCountPerDay,
      holidays: [...mobileRosterHolidays],
      assignments: assignments
    };

    if (window.stateManager) {
      window.stateManager.saveDutyRoster(rosterData);
    }

    window.vibrate([30, 50, 30]);
    showMobileToast(`🎉 ${assignments.length} günlük nöbet listesi oluşturuldu!`, 'success');
    window.openDutyRosterModal();
  };

  window.clearMobileDutyRoster = () => {
    if (!confirm('Mevcut nöbet listesini silmek istediğinize emin misiniz?')) return;
    if (window.stateManager) {
      window.stateManager.clearDutyRoster();
    }
    window.vibrate(20);
    showMobileToast('Nöbet listesi temizlendi.');
    window.renderDutyRosterContent();
  };

  window.renderDutyRosterContent = () => {
    const headerBar = document.getElementById('m-roster-header-bar');
    const container = document.getElementById('m-roster-list-body');
    const metaEl = document.getElementById('m-roster-date-meta');
    if (!container) return;

    const roster = (window.stateManager && window.stateManager.getDutyRoster()) || (window.stateManager && window.stateManager.state && window.stateManager.state.dutyRoster);

    if (!roster || !Array.isArray(roster.assignments) || roster.assignments.length === 0) {
      if (headerBar) headerBar.style.display = 'none';
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--m-text-muted);">
          <div style="font-size: 3rem; margin-bottom: 0.75rem;">📅</div>
          <div style="font-weight: 800; font-size: 1.05rem; color: var(--m-text); margin-bottom: 0.35rem;">
            Kayıtlı Nöbet Listesi Yok
          </div>
          <div style="font-size: 0.8rem; line-height: 1.4; max-width: 290px; margin: 0 auto 1.5rem auto;">
            Tarih aralığı ve kuralları belirleyerek hemen sınıfınız için adil bir nöbet çizelgesi oluşturabilirsiniz.
          </div>
          <button class="subview-primary-action-btn" onclick="window.openCreateDutyRosterModal()" style="display: inline-flex; width: auto; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, var(--m-primary), #4338ca); font-size: 0.9rem; font-weight: 800;">
            ➕ Yeni Nöbet Listesi Ekle
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    if (headerBar) headerBar.style.display = 'flex';

    // Meta bilgisi
    const dStart = new Date(roster.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const dEnd = new Date(roster.endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    if (metaEl) {
      metaEl.textContent = `📅 ${dStart} - ${dEnd} • ${roster.studentCountPerDay || 2} Görevli/Gün`;
    }

    // Filtreleme
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const currentDayOfWeek = now.getDay() || 7; // 1: Pzt, 7: Paz
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);
    const endOfWeekStr = endOfWeek.toISOString().slice(0, 10);

    const allAssignments = roster.assignments;
    const weekAssignments = allAssignments.filter(a => a.date >= startOfWeekStr && a.date <= endOfWeekStr);
    const upcomingAssignments = allAssignments.filter(a => a.date >= todayStr);

    const cntAll = document.getElementById('m-roster-cnt-all');
    const cntWeek = document.getElementById('m-roster-cnt-week');
    const cntUp = document.getElementById('m-roster-cnt-up');
    if (cntAll) cntAll.textContent = allAssignments.length;
    if (cntWeek) cntWeek.textContent = weekAssignments.length;
    if (cntUp) cntUp.textContent = upcomingAssignments.length;

    let displayList = allAssignments;
    if (activeRosterFilter === 'this-week') {
      displayList = weekAssignments;
    } else if (activeRosterFilter === 'upcoming') {
      displayList = upcomingAssignments;
    }

    if (displayList.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="calendar" style="width: 32px; height: 32px; opacity: 0.4; margin-bottom: 0.5rem;"></i>
          <div style="font-weight: 700; font-size: 0.88rem;">Bu filtrede nöbet günü bulunamadı</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const allStudents = (window.stateManager && window.stateManager.state && window.stateManager.state.students) || [];

    container.innerHTML = displayList.map(a => {
      const isToday = (a.date === todayStr);
      const d = new Date(a.date);
      const dateFormatted = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });

      const assignedStudents = (a.studentIds || []).map(sid => allStudents.find(s => s.id === sid)).filter(Boolean);

      return `
        <div class="m-item-card" style="padding: 0.85rem 1rem; margin-bottom: 8px; border-left: 4px solid ${isToday ? 'var(--m-primary)' : 'var(--m-border)'}; background: ${isToday ? 'rgba(99, 102, 241, 0.05)' : 'var(--m-surface)'};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-weight: 800; font-size: 0.88rem; color: var(--m-text); display: flex; align-items: center; gap: 6px;">
              <span>📅</span> <span>${dateFormatted}</span>
            </div>
            ${isToday ? '<span class="m-badge m-badge-active" style="font-size: 0.72rem; font-weight: 800; padding: 2px 8px;">🌟 Bugün</span>' : ''}
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${assignedStudents.map((st, idx) => {
              const avatarColor = getAvatarColor(st.id || st.name);
              const avatarContent = st.photo
                ? `<img src="${st.photo}" style="width: 100%; height: 100%; object-fit: cover;">`
                : escapeHTML((st.name || '?').charAt(0).toUpperCase());

              return `
                <div style="display: flex; align-items: center; gap: 8px; background: var(--m-surface-subtle); padding: 5px 8px; border-radius: 8px; border: 1px solid var(--m-border-light, rgba(255,255,255,0.05));">
                  <span style="font-size: 0.72rem; font-weight: 800; color: var(--m-primary); background: rgba(99, 102, 241, 0.12); padding: 2px 6px; border-radius: 6px; white-space: nowrap;">
                    ${idx + 1}. Nöbetçi
                  </span>
                  <div style="width: 26px; height: 26px; border-radius: 50%; overflow: hidden; background-color: ${avatarColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 800; flex-shrink: 0;">
                    ${avatarContent}
                  </div>
                  <div style="font-weight: 700; font-size: 0.85rem; color: var(--m-text); min-width: 0; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}
                    <span style="font-size: 0.74rem; color: var(--m-text-muted); font-weight: 600;">(No: ${escapeHTML(st.number || '-')})</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  };

  // Nöbet Çizelgesini Paylaş (WhatsApp, Telegram vb.)
  window.shareMobileDutyRoster = function() {
    const roster = (window.stateManager && window.stateManager.getDutyRoster()) || (window.stateManager && window.stateManager.state && window.stateManager.state.dutyRoster);
    if (!roster || !roster.assignments || roster.assignments.length === 0) {
      showToast('Paylaşılacak nöbet çizelgesi bulunamadı.', 'warning');
      return;
    }

    const allStudents = (window.stateManager && window.stateManager.state && window.stateManager.state.students) || [];
    
    let text = `📋 SINIF NÖBET ÇİZELGESİ\n`;
    if (roster.startDate && roster.endDate) {
      let sDate = roster.startDate;
      let eDate = roster.endDate;
      try {
        sDate = new Date(roster.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        eDate = new Date(roster.endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) {}
      text += `📅 Dönem: ${sDate} - ${eDate}\n`;
    }
    text += `═════════════════════════\n\n`;

    roster.assignments.forEach(a => {
      const d = new Date(a.date);
      const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
      text += `🗓️ ${dateStr}:\n`;
      
      const sids = a.studentIds || [];
      const assigned = sids.map(sid => allStudents.find(s => s.id === sid)).filter(Boolean);
      if (assigned.length === 0) {
        text += `   • Görevli öğrenci atanmadı\n`;
      } else {
        assigned.forEach((st, idx) => {
          text += `   ${idx + 1}. ${st.name} ${st.surname || ''} (No: ${st.number || '-'})\n`;
        });
      }
      text += `\n`;
    });

    text += `✨ Sınıf Asistanı ile oluşturuldu.`;

    if (window.AndroidBridge && typeof window.AndroidBridge.shareData === 'function') {
      window.AndroidBridge.shareData(text, 'Sınıf Nöbet Çizelgesi', 'text/plain');
    } else if (navigator.share) {
      navigator.share({
        title: 'Sınıf Nöbet Çizelgesi',
        text: text
      }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Nöbet listesi panoya kopyalandı.', 'success');
      }).catch(() => {
        showToast('Paylaşım desteklenmiyor.', 'warning');
      });
    } else {
      showToast('Paylaşım özelliği bu cihazda desteklenmiyor.', 'warning');
    }
  };

  // Nöbet Çizelgesini Yazdır / PDF Olarak Kaydet
  window.printMobileDutyRoster = function() {
    const roster = (window.stateManager && window.stateManager.getDutyRoster()) || (window.stateManager && window.stateManager.state && window.stateManager.state.dutyRoster);
    if (!roster || !roster.assignments || roster.assignments.length === 0) {
      showToast('Yazdırılacak nöbet çizelgesi bulunamadı.', 'warning');
      return;
    }

    const allStudents = (window.stateManager && window.stateManager.state && window.stateManager.state.students) || [];
    const printContainer = document.querySelector('.roster-report-print');
    if (!printContainer) {
      showToast('Yazdırma şablonu bulunamadı.', 'danger');
      return;
    }

    let startFormatted = roster.startDate || '';
    let endFormatted = roster.endDate || '';
    try {
      if (roster.startDate) startFormatted = new Date(roster.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      if (roster.endDate) endFormatted = new Date(roster.endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {}

    const daysHtml = roster.assignments.map(a => {
      const d = new Date(a.date);
      const dateFormatted = d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const assigned = (a.studentIds || []).map(sid => allStudents.find(s => s.id === sid)).filter(Boolean);

      const studentsHtml = assigned.map((st, idx) => {
        const initials = `${(st.name || '').charAt(0)}${(st.surname || '').charAt(0)}`.toUpperCase() || '?';
        const avatar = st.photo
          ? `<img src="${st.photo}" class="roster-print-photo" alt="${escapeHTML(st.name)}">`
          : `<div class="roster-print-avatar">${initials}</div>`;

        return `
          <div class="roster-print-student">
            ${avatar}
            <div class="roster-print-info">
              <span class="roster-print-name">${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}</span>
              <span class="roster-print-no">No: ${escapeHTML(st.number || '-')}</span>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="roster-print-day">
          <div class="roster-print-date">${dateFormatted}</div>
          <div class="roster-print-students">
            ${studentsHtml || '<div style="font-size: 8pt; color: #888;">Görevli atanmadı</div>'}
          </div>
        </div>
      `;
    }).join('');

    printContainer.innerHTML = `
      <div class="roster-print-header">
        <h1>SINIF NÖBET ÇİZELGESİ</h1>
        <div class="roster-meta">Dönem: ${startFormatted} - ${endFormatted} | Toplam: ${roster.assignments.length} Gün</div>
      </div>
      <div class="roster-print-grid">
        ${daysHtml}
      </div>
    `;

    document.body.classList.add('print-roster');

    // Temizleme fonksiyonu
    const cleanup = () => {
      document.body.classList.remove('print-roster');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 4000);

    // Android WebView veya Standart Yazdırma
    if (window.AndroidBridge && typeof window.AndroidBridge.printDocument === 'function') {
      window.AndroidBridge.printDocument("Sinif_Nobet_Cizelgesi");
    } else {
      window.print();
    }
  };

  // ==========================================================================
  // 4.3 SINIF OTURMA PLANI MODÜLÜ (MOBİL SÜRÜM)
  // ==========================================================================
  let mSeatingBranch = 'all';
  let mActiveSeatTarget = null; // { deskId, seatIndex }
  let mSeatingPlan = {
    desks: [],
    teacherDesk: { x: 68, y: 3, visible: true },
    whiteboard: { x: 12, y: 3, visible: true }
  };
  let mCachedStudentsForSeating = [];

  // Şubeleri listeleyen yardımcı
  window.getUniqueBranches = function() {
    const state = (window.stateManager && window.stateManager.state) || {};
    const students = state.students || [];
    return [...new Set(students.map(s => s.branch).filter(Boolean))].sort();
  };

  function loadMobileSeatingData() {
    const state = (window.stateManager && window.stateManager.loadState()) || (window.stateManager && window.stateManager.state) || {};
    const isMiddle = (state.educationLevel === 'middle');

    if (!isMiddle) {
      mSeatingBranch = 'all';
    } else if (!mSeatingBranch || mSeatingBranch === 'all') {
      const branches = window.getUniqueBranches();
      mSeatingBranch = (branches.length > 0) ? branches[0] : ((activeBranch && activeBranch !== 'all') ? activeBranch : '5/A');
    }

    const plan = (state.seatingPlans && state.seatingPlans[mSeatingBranch]) || {
      desks: [],
      teacherDesk: { x: 68, y: 3, visible: true },
      whiteboard: { x: 12, y: 3, visible: true }
    };

    mSeatingPlan = {
      desks: Array.isArray(plan.desks) ? JSON.parse(JSON.stringify(plan.desks)) : [],
      teacherDesk: plan.teacherDesk || { x: 68, y: 3, visible: true },
      whiteboard: plan.whiteboard || { x: 12, y: 3, visible: true }
    };
  }

  function saveMobileSeatingData() {
    if (!window.stateManager || typeof window.stateManager.saveSeatingPlan !== 'function') return;
    const planData = {
      desks: mSeatingPlan.desks,
      teacherDesk: mSeatingPlan.teacherDesk,
      whiteboard: mSeatingPlan.whiteboard
    };
    window.stateManager.saveSeatingPlan(mSeatingBranch, planData);
  }

  window.openSeatingPlanModal = function() {
    loadMobileSeatingData();

    const state = (window.stateManager && window.stateManager.state) || {};
    const isMiddle = (state.educationLevel === 'middle');

    // Şube alanı kontrolleri
    const branchRow = document.getElementById('m-seating-branch-selector-row');
    const branchSelect = document.getElementById('m-seating-branch-select');
    const branchBadge = document.getElementById('m-seating-branch-badge');

    if (isMiddle) {
      if (branchRow) branchRow.style.display = 'flex';
      if (branchSelect) {
        const branches = window.getUniqueBranches();
        if (branches.length === 0 && mSeatingBranch !== 'all') branches.push(mSeatingBranch);
        branchSelect.innerHTML = branches.map(b => `<option value="${escapeHTML(b)}" ${b === mSeatingBranch ? 'selected' : ''}>${escapeHTML(b)} Şubesi</option>`).join('');
      }
      if (branchBadge) branchBadge.textContent = `${mSeatingBranch} Şubesi`;
    } else {
      if (branchRow) branchRow.style.display = 'none';
      if (branchBadge) branchBadge.textContent = 'İlkokul';
    }

    renderMobileSeatingView();
    openBottomSheet('modal-seating-plan');
  };

  window.changeMobileSeatingBranch = function(newBranch) {
    if (!newBranch) return;
    mSeatingBranch = newBranch;
    const branchBadge = document.getElementById('m-seating-branch-badge');
    if (branchBadge) branchBadge.textContent = `${newBranch} Şubesi`;

    loadMobileSeatingData();
    renderMobileSeatingView();
  };

  window.startNewSeatingPlan = function() {
    if (mSeatingPlan.desks.length > 0) {
      if (!confirm('Mevcut oturma planı sıfırlanıp yeni bir oturma planı oluşturulacak. Devam etmek istiyor musunuz?')) {
        return;
      }
    }

    // Başlangıç olarak tahta, öğretmen masası ve 4 adet çiftli sıra yerleştir
    mSeatingPlan = {
      desks: [
        { id: 'desk_' + Date.now() + '_1', type: 'double', x: 8, y: 18, rotation: 0, students: [null, null] },
        { id: 'desk_' + Date.now() + '_2', type: 'double', x: 50, y: 18, rotation: 0, students: [null, null] },
        { id: 'desk_' + Date.now() + '_3', type: 'double', x: 8, y: 36, rotation: 0, students: [null, null] },
        { id: 'desk_' + Date.now() + '_4', type: 'double', x: 50, y: 36, rotation: 0, students: [null, null] }
      ],
      teacherDesk: { x: 68, y: 3, visible: true },
      whiteboard: { x: 12, y: 3, visible: true }
    };

    saveMobileSeatingData();
    renderMobileSeatingView();
    showToast('Yeni oturma planı oluşturuldu. Sıraları dilediğiniz gibi taşıyabilirsiniz.', 'success');
  };

  window.createAutoSeatingLayout = function(deskType = 2) {
    const state = (window.stateManager && window.stateManager.state) || {};
    const isMiddle = (state.educationLevel === 'middle');
    let branchStudents = (state.students || []).filter(s => {
      if (!isMiddle) return true;
      return mSeatingBranch === 'all' || s.branch === mSeatingBranch;
    });

    const studentCount = branchStudents.length > 0 ? branchStudents.length : 16;
    const isDouble = (deskType === 2);
    const deskCount = isDouble ? Math.max(4, Math.ceil(studentCount / 2)) : Math.max(6, studentCount);

    const newDesks = [];
    const cols = isDouble ? 2 : 3;
    const colWidth = isDouble ? 42 : 28;
    const colGaps = isDouble ? [8, 50] : [5, 36, 68];

    for (let i = 0; i < deskCount; i++) {
      const colIdx = i % cols;
      const rowIdx = Math.floor(i / cols);
      const x = colGaps[colIdx] || 10;
      const y = 16 + (rowIdx * 15);

      newDesks.push({
        id: 'desk_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 3),
        type: isDouble ? 'double' : 'single',
        x: Math.min(x, 100 - colWidth),
        y: Math.min(y, 82),
        rotation: 0,
        students: isDouble ? [null, null] : [null]
      });
    }

    mSeatingPlan.desks = newDesks;
    mSeatingPlan.whiteboard.visible = true;
    mSeatingPlan.teacherDesk.visible = true;

    saveMobileSeatingData();
    renderMobileSeatingView();
    showToast(`${newDesks.length} sıralık hazır sınıf düzeni oluşturuldu.`, 'success');
  };

  window.addMobileDesk = function(type = 'double') {
    const isSingle = (type === 'single');
    const id = 'desk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    // Rastgele ortalarda boş bir konuma yerleştir
    const randX = Math.round(10 + Math.random() * 40);
    const randY = Math.round(20 + Math.random() * 35);

    mSeatingPlan.desks.push({
      id: id,
      type: isSingle ? 'single' : 'double',
      x: randX,
      y: randY,
      rotation: 0,
      students: isSingle ? [null] : [null, null]
    });

    saveMobileSeatingData();
    renderMobileSeatingView();
    showToast(`${isSingle ? 'Tekli' : 'Çiftli'} sıra eklendi.`, 'success');
  };

  window.toggleMobileSeatingBoard = function() {
    mSeatingPlan.whiteboard.visible = !mSeatingPlan.whiteboard.visible;
    saveMobileSeatingData();
    renderMobileSeatingView();
  };

  window.toggleMobileSeatingTeacherDesk = function() {
    mSeatingPlan.teacherDesk.visible = !mSeatingPlan.teacherDesk.visible;
    saveMobileSeatingData();
    renderMobileSeatingView();
  };

  window.rotateMobileDesk = function(deskId, delta = 90) {
    const desk = mSeatingPlan.desks.find(d => d.id === deskId);
    if (!desk) return;
    desk.rotation = ((desk.rotation || 0) + delta + 360) % 360;
    saveMobileSeatingData();
    renderMobileSeatingView();
  };

  window.deleteMobileDesk = function(deskId) {
    if (!confirm('Bu sırayı kaldırmak istediğinize emin misiniz?')) return;
    mSeatingPlan.desks = mSeatingPlan.desks.filter(d => d.id !== deskId);
    saveMobileSeatingData();
    renderMobileSeatingView();
    showToast('Sıra kaldırıldı.', 'info');
  };

  function renderMobileSeatingView() {
    const emptyView = document.getElementById('m-seating-empty-view');
    const canvasContainer = document.getElementById('m-seating-canvas-container');
    const canvas = document.getElementById('m-seating-canvas');
    if (!emptyView || !canvasContainer || !canvas) return;

    // Araç butonlarının aktiflik durumları
    const btnBoard = document.getElementById('m-btn-toggle-board');
    const btnTeacher = document.getElementById('m-btn-toggle-teacher-desk');
    if (btnBoard) btnBoard.classList.toggle('active', !!mSeatingPlan.whiteboard.visible);
    if (btnTeacher) btnTeacher.classList.toggle('active', !!mSeatingPlan.teacherDesk.visible);

    // Eğer henüz sıra yoksa boş durumu göster
    if (mSeatingPlan.desks.length === 0) {
      emptyView.style.display = 'flex';
      canvasContainer.style.display = 'none';
      return;
    }

    emptyView.style.display = 'none';
    canvasContainer.style.display = 'flex';
    canvas.innerHTML = '';

    // 1. Yazı Tahtası
    if (mSeatingPlan.whiteboard && mSeatingPlan.whiteboard.visible) {
      const wb = mSeatingPlan.whiteboard;
      const wbEl = document.createElement('div');
      wbEl.className = 'm-seating-element m-seating-whiteboard';
      wbEl.style.width = '48%';
      wbEl.style.height = '32px';
      wbEl.style.left = (wb.x || 12) + '%';
      wbEl.style.top = (wb.y || 3) + '%';
      wbEl.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;"><span>📋</span> <span>YAZI TAHTASI</span></span>`;
      canvas.appendChild(wbEl);
      makeMobileElementDraggable(wbEl, 'whiteboard');
    }

    // 2. Öğretmen Masası
    if (mSeatingPlan.teacherDesk && mSeatingPlan.teacherDesk.visible) {
      const td = mSeatingPlan.teacherDesk;
      const tdEl = document.createElement('div');
      tdEl.className = 'm-seating-element m-seating-teacher-desk';
      tdEl.style.width = '24%';
      tdEl.style.height = '42px';
      tdEl.style.left = (td.x || 68) + '%';
      tdEl.style.top = (td.y || 3) + '%';
      tdEl.innerHTML = `
        <span style="display: flex; align-items: center; gap: 3px;"><span>🧑‍🏫</span> <span>ÖĞRETMEN</span></span>
        <span style="font-size: 0.58rem; opacity: 0.7;">MASASI</span>
      `;
      canvas.appendChild(tdEl);
      makeMobileElementDraggable(tdEl, 'teacherDesk');
    }

    // 3. Sıralar
    const state = (window.stateManager && window.stateManager.state) || {};
    const allStudents = state.students || [];

    // Sıra numaralarını yukarıdan aşağıya, soldan sağa sıralayarak hesapla
    const sortedDesks = [...mSeatingPlan.desks].sort((a, b) => {
      if (Math.abs(a.y - b.y) < 7) return a.x - b.x;
      return a.y - b.y;
    });

    mSeatingPlan.desks.forEach(desk => {
      const deskEl = document.createElement('div');
      deskEl.className = 'm-seating-element';
      const isSingle = (desk.type === 'single');
      const deskNum = sortedDesks.findIndex(d => d.id === desk.id) + 1;

      deskEl.style.width = isSingle ? '28%' : '44%';
      deskEl.style.height = '76px';
      deskEl.style.left = desk.x + '%';
      deskEl.style.top = desk.y + '%';
      deskEl.style.transform = `rotate(${desk.rotation || 0}deg)`;

      // Header
      const header = document.createElement('div');
      header.className = 'm-desk-header';
      header.innerHTML = `
        <div class="m-desk-drag-handle">
          <span>🪑</span>
          <span>${deskNum}. Sıra</span>
        </div>
        <div style="display: flex; align-items: center; gap: 2px;">
          <button type="button" class="m-desk-action-btn" title="90° Döndür" onclick="event.stopPropagation(); window.rotateMobileDesk('${desk.id}', 90)">
            🔄
          </button>
          <button type="button" class="m-desk-action-btn delete" title="Sırayı Sil" onclick="event.stopPropagation(); window.deleteMobileDesk('${desk.id}')">
            ✕
          </button>
        </div>
      `;

      // Body (Koltuklar)
      const body = document.createElement('div');
      body.className = 'm-desk-body';

      desk.students.forEach((studentId, seatIdx) => {
        const seat = document.createElement('div');
        seat.className = 'm-seating-seat';

        if (!studentId) {
          seat.innerHTML = `
            <div class="m-seating-seat-empty">
              <span style="font-size: 1.1rem; line-height: 1;">➕</span>
              <span style="font-size: 0.6rem;">Öğrenci</span>
            </div>
          `;
        } else {
          const st = allStudents.find(s => s.id === studentId);
          if (st) {
            const avatarColor = getAvatarColor(st.id || st.name);
            const avatarContent = st.photo
              ? `<img src="${st.photo}" class="m-seating-seat-photo" alt="${escapeHTML(st.name)}">`
              : `<div class="m-seating-seat-initials" style="background-color: ${avatarColor}; color: white;">${escapeHTML((st.name || '?').charAt(0).toUpperCase())}</div>`;

            seat.innerHTML = `
              <div class="m-seating-seat-occupied">
                ${avatarContent}
                <div class="m-seating-seat-name">${escapeHTML(st.name)}</div>
                <div class="m-seating-seat-no">No: ${escapeHTML(st.number || '-')}</div>
              </div>
            `;
          } else {
            // Öğrenci sistemden silinmişse
            desk.students[seatIdx] = null;
            seat.innerHTML = `
              <div class="m-seating-seat-empty">
                <span style="font-size: 1.1rem; line-height: 1;">➕</span>
                <span style="font-size: 0.6rem;">Öğrenci</span>
              </div>
            `;
          }
        }

        seat.onclick = (e) => {
          e.stopPropagation();
          openMobileSeatPicker(desk.id, seatIdx);
        };

        body.appendChild(seat);
      });

      deskEl.appendChild(header);
      deskEl.appendChild(body);
      canvas.appendChild(deskEl);

      makeMobileElementDraggable(deskEl, 'desk', desk.id);
    });
  }

  // Mobil Dokunmatik & Fare ile Sürükleme Yöneticisi
  function makeMobileElementDraggable(element, type, id = null) {
    const handle = element.querySelector('.m-desk-drag-handle') || element;

    handle.addEventListener('mousedown', startDrag);
    handle.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
      if (e.target.closest('.m-desk-action-btn') || e.target.closest('.m-seating-seat')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const canvas = document.getElementById('m-seating-canvas');
      if (!canvas) return;

      element.classList.add('dragging');

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const elementRect = element.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      const offsetX = clientX - elementRect.left;
      const offsetY = clientY - elementRect.top;

      const onMove = (moveEvt) => {
        moveEvt.preventDefault();
        const curX = moveEvt.touches ? moveEvt.touches[0].clientX : moveEvt.clientX;
        const curY = moveEvt.touches ? moveEvt.touches[0].clientY : moveEvt.clientY;

        let leftPercent = ((curX - canvasRect.left - offsetX) / canvasRect.width) * 100;
        let topPercent = ((curY - canvasRect.top - offsetY) / canvasRect.height) * 100;

        const widthPercent = (elementRect.width / canvasRect.width) * 100;
        const heightPercent = (elementRect.height / canvasRect.height) * 100;

        leftPercent = Math.max(0, Math.min(100 - widthPercent, leftPercent));
        topPercent = Math.max(0, Math.min(100 - heightPercent, topPercent));

        element.style.left = leftPercent.toFixed(2) + '%';
        element.style.top = topPercent.toFixed(2) + '%';

        if (type === 'whiteboard') {
          mSeatingPlan.whiteboard.x = parseFloat(leftPercent.toFixed(2));
          mSeatingPlan.whiteboard.y = parseFloat(topPercent.toFixed(2));
        } else if (type === 'teacherDesk') {
          mSeatingPlan.teacherDesk.x = parseFloat(leftPercent.toFixed(2));
          mSeatingPlan.teacherDesk.y = parseFloat(topPercent.toFixed(2));
        } else if (type === 'desk') {
          const d = mSeatingPlan.desks.find(item => item.id === id);
          if (d) {
            d.x = parseFloat(leftPercent.toFixed(2));
            d.y = parseFloat(topPercent.toFixed(2));
          }
        }
      };

      const onEnd = () => {
        element.classList.remove('dragging');

        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);

        saveMobileSeatingData();
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    }
  }

  // Öğrenci Seçme Alt Çekmecesi
  function openMobileSeatPicker(deskId, seatIndex) {
    mActiveSeatTarget = { deskId, seatIndex };

    const state = (window.stateManager && window.stateManager.state) || {};
    const isMiddle = (state.educationLevel === 'middle');
    const allStudents = state.students || [];

    // Sıra numarasını bul
    const sortedDesks = [...mSeatingPlan.desks].sort((a, b) => {
      if (Math.abs(a.y - b.y) < 7) return a.x - b.x;
      return a.y - b.y;
    });
    const desk = mSeatingPlan.desks.find(d => d.id === deskId);
    const deskNum = desk ? sortedDesks.findIndex(d => d.id === desk.id) + 1 : '?';
    const seatLabel = desk && desk.type === 'double' ? (seatIndex === 0 ? 'Sol Koltuk' : 'Sağ Koltuk') : 'Tek Koltuk';

    const slotInfoEl = document.getElementById('m-seating-slot-info');
    if (slotInfoEl) {
      slotInfoEl.textContent = `${deskNum}. Sıra - ${seatLabel}`;
    }

    // Seçili koltuktaki öğrenciyi kontrol et
    const currentStudentBar = document.getElementById('m-seating-current-student-bar');
    const currentStudentName = document.getElementById('m-seating-current-student-name');
    const currentStudentId = desk ? desk.students[seatIndex] : null;

    if (currentStudentId) {
      const curSt = allStudents.find(s => s.id === currentStudentId);
      if (curSt) {
        if (currentStudentName) currentStudentName.textContent = `${curSt.name} ${curSt.surname || ''} (No: ${curSt.number || '-'})`;
        if (currentStudentBar) currentStudentBar.style.display = 'flex';
      } else {
        if (currentStudentBar) currentStudentBar.style.display = 'none';
      }
    } else {
      if (currentStudentBar) currentStudentBar.style.display = 'none';
    }

    // Arama kutusunu temizle
    const searchInput = document.getElementById('m-seating-student-search');
    if (searchInput) searchInput.value = '';

    // Şubeye göre filtrele
    mCachedStudentsForSeating = allStudents.filter(s => {
      if (!isMiddle) return true;
      return mSeatingBranch === 'all' || s.branch === mSeatingBranch;
    });

    // Alfabetik sırala
    mCachedStudentsForSeating.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));

    renderMobileSeatStudentList(mCachedStudentsForSeating);
    openBottomSheet('modal-seating-student-select');
  }

  function renderMobileSeatStudentList(students) {
    const listContainer = document.getElementById('m-seating-student-list');
    if (!listContainer) return;

    if (students.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; color: var(--m-text-muted); font-size: 0.82rem; padding: 1.5rem;">
          Öğrenci bulunamadı.
        </div>
      `;
      return;
    }

    // Hangi öğrencilerin hangi sırada oturduğunu tespit et
    const seatedMap = new Map(); // studentId -> deskNumber
    const sortedDesks = [...mSeatingPlan.desks].sort((a, b) => {
      if (Math.abs(a.y - b.y) < 7) return a.x - b.x;
      return a.y - b.y;
    });

    mSeatingPlan.desks.forEach(d => {
      const dNum = sortedDesks.findIndex(sd => sd.id === d.id) + 1;
      (d.students || []).forEach(sid => {
        if (sid) seatedMap.set(sid, dNum);
      });
    });

    const activeDeskId = mActiveSeatTarget ? mActiveSeatTarget.deskId : null;
    const activeSeatIdx = mActiveSeatTarget ? mActiveSeatTarget.seatIndex : null;
    const currentSeatStudentId = activeDeskId ? (mSeatingPlan.desks.find(d => d.id === activeDeskId) || {}).students?.[activeSeatIdx] : null;

    listContainer.innerHTML = students.map(s => {
      const isCurrent = (s.id === currentSeatStudentId);
      const seatedDeskNum = seatedMap.get(s.id);
      const isSeatedElsewhere = (!isCurrent && seatedDeskNum !== undefined);

      const avatarColor = getAvatarColor(s.id || s.name);
      const avatarContent = s.photo
        ? `<img src="${s.photo}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`
        : `<div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${avatarColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.78rem;">${escapeHTML((s.name || '?').charAt(0).toUpperCase())}</div>`;

      let badgeHtml = '';
      if (isCurrent) {
        badgeHtml = `<span class="m-badge m-badge-active" style="font-size: 0.68rem; padding: 2px 6px;">🟢 Bu Koltukta</span>`;
      } else if (isSeatedElsewhere) {
        badgeHtml = `<span style="font-size: 0.68rem; color: var(--m-text-muted); background: var(--m-surface-subtle); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--m-border);">Sıra ${seatedDeskNum}'de</span>`;
      }

      return `
        <div class="m-item-card" onclick="window.assignStudentToMobileSeat('${s.id}')" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; cursor: pointer; border-left: 3px solid ${isCurrent ? 'var(--m-primary)' : 'transparent'};">
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
            ${avatarContent}
            <div style="min-width: 0;">
              <div style="font-weight: 700; font-size: 0.88rem; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHTML(s.name)} ${escapeHTML(s.surname || '')}
              </div>
              <div style="font-size: 0.72rem; color: var(--m-text-muted);">
                No: ${escapeHTML(s.number || '-')} ${s.branch ? `• ${escapeHTML(s.branch)}` : ''}
              </div>
            </div>
          </div>
          ${badgeHtml}
        </div>
      `;
    }).join('');
  }

  window.filterMobileSeatStudents = function(query) {
    if (!query) {
      renderMobileSeatStudentList(mCachedStudentsForSeating);
      return;
    }
    const q = query.toLowerCase().trim();
    const filtered = mCachedStudentsForSeating.filter(s => {
      const fullName = `${s.name || ''} ${s.surname || ''}`.toLowerCase();
      const no = (s.number || '').toString().toLowerCase();
      return fullName.includes(q) || no.includes(q);
    });
    renderMobileSeatStudentList(filtered);
  };

  window.assignStudentToMobileSeat = function(studentId) {
    if (!mActiveSeatTarget) return;
    const { deskId, seatIndex } = mActiveSeatTarget;

    // 1. Öğrenci başka bir sırada oturuyorsa oradan temizle
    mSeatingPlan.desks.forEach(d => {
      d.students.forEach((sid, idx) => {
        if (sid === studentId) d.students[idx] = null;
      });
    });

    // 2. Yeni koltuğa ata
    const desk = mSeatingPlan.desks.find(d => d.id === deskId);
    if (desk) {
      desk.students[seatIndex] = studentId;
      saveMobileSeatingData();
      renderMobileSeatingView();
    }

    window.closeMobileSeatPicker();
    showToast('Öğrenci sıraya yerleştirildi.', 'success');
  };

  window.clearCurrentSeatStudent = function() {
    if (!mActiveSeatTarget) return;
    const { deskId, seatIndex } = mActiveSeatTarget;
    const desk = mSeatingPlan.desks.find(d => d.id === deskId);
    if (desk) {
      desk.students[seatIndex] = null;
      saveMobileSeatingData();
      renderMobileSeatingView();
    }

    window.closeMobileSeatPicker();
    showToast('Koltuk boşaltıldı.', 'info');
  };

  window.closeMobileSeatPicker = function() {
    mActiveSeatTarget = null;
    const sheet = document.getElementById('modal-seating-student-select');
    if (sheet) sheet.classList.remove('active');
  };

  window.clearMobileSeatingPlan = function() {
    if (!confirm('Sınıf oturma planındaki tüm sıraları ve yerleşimleri silmek istediğinize emin misiniz?')) {
      return;
    }

    mSeatingPlan.desks = [];
    mSeatingPlan.teacherDesk = { x: 68, y: 3, visible: true };
    mSeatingPlan.whiteboard = { x: 12, y: 3, visible: true };

    saveMobileSeatingData();
    renderMobileSeatingView();
    showToast('Oturma planı temizlendi.', 'info');
  };

  window.printMobileSeatingPlan = function() {
    if (mSeatingPlan.desks.length === 0) {
      showToast('Yazdırılacak oturma planı bulunamadı.', 'warning');
      return;
    }

    const printContainer = document.querySelector('.seating-report-print');
    if (!printContainer) {
      showToast('Yazdırma şablonu bulunamadı.', 'danger');
      return;
    }

    const state = (window.stateManager && window.stateManager.state) || {};
    const allStudents = state.students || [];

    // Sıraları numaralandır
    const sortedDesks = [...mSeatingPlan.desks].sort((a, b) => {
      if (Math.abs(a.y - b.y) < 7) return a.x - b.x;
      return a.y - b.y;
    });

    const desksHtml = sortedDesks.map((desk, idx) => {
      const seatsHtml = desk.students.map((sid, sIdx) => {
        if (!sid) {
          return `
            <div class="seating-print-seat-item">
              <div style="font-size: 8pt; color: #94a3b8; font-style: italic;">Boş Koltuk</div>
            </div>
          `;
        }
        const st = allStudents.find(s => s.id === sid);
        const name = st ? `${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}` : 'Öğrenci';
        const no = st ? escapeHTML(st.number || '-') : '-';

        return `
          <div class="seating-print-seat-item">
            <div class="seating-print-name">${name}</div>
            <div class="seating-print-no">No: ${no}</div>
          </div>
        `;
      }).join('');

      return `
        <div class="seating-print-desk">
          <div class="seating-print-desk-title">${idx + 1}. Sıra (${desk.type === 'single' ? 'Tekli' : 'Çiftli'})</div>
          <div class="seating-print-seats">${seatsHtml}</div>
        </div>
      `;
    }).join('');

    printContainer.innerHTML = `
      <div class="seating-print-header">
        <h1>SINIF OTURMA PLANI</h1>
        <p>Şube: ${mSeatingBranch === 'all' ? 'Tüm Sınıf' : mSeatingBranch} | Toplam Sıra: ${mSeatingPlan.desks.length}</p>
      </div>
      <div class="seating-print-grid">
        ${desksHtml}
      </div>
    `;

    document.body.classList.add('print-seating');

    const cleanup = () => {
      document.body.classList.remove('print-seating');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 4000);

    if (window.AndroidBridge && typeof window.AndroidBridge.printDocument === 'function') {
      window.AndroidBridge.printDocument("Sinif_Oturma_Plani");
    } else {
      window.print();
    }
  };

  // ==========================================================================
  // 4.4 KİŞİSEL EVRAK DEPOSU MODÜLÜ (MOBİL SÜRÜM)
  // ==========================================================================
  let currentDocsCategory = 'all'; // 'all' | 'uncategorized' | catId
  let mobileSelectedDocFile = null;
  let activeMobileViewerDoc = null;
  let targetMoveDoc = null;

  const MAX_DOCUMENT_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
  const DOCS_DB_NAME = 'DocumentsStorageDB';
  const DOCS_DB_VERSION = 1;
  const DOCS_STORE_NAME = 'document_files';

  function openDocsDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DOCS_DB_NAME, DOCS_DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(DOCS_STORE_NAME)) {
          db.createObjectStore(DOCS_STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(request.error);
    });
  }

  async function saveDocFileToDB(id, content, htmlContent) {
    try {
      const db = await openDocsDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(DOCS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(DOCS_STORE_NAME);
        const request = store.put({ id, content: content || '', htmlContent: htmlContent || '' });
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("saveDocFileToDB error:", e);
    }
  }

  async function getDocFileFromDB(id) {
    try {
      const db = await openDocsDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(DOCS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(DOCS_STORE_NAME);
        const request = store.get(id);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("getDocFileFromDB error:", e);
      return null;
    }
  }

  async function deleteDocFileFromDB(id) {
    try {
      const db = await openDocsDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(DOCS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(DOCS_STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("deleteDocFileFromDB error:", e);
    }
  }

  // Ana Evrak Deposu Modalını Aç
  window.openDocumentsModal = function() {
    try {
      const searchInput = document.getElementById('m-docs-search-input');
      if (searchInput) searchInput.value = '';

      renderDocsFabMenu();
      renderMobileDocumentsList();
    } catch (err) {
      console.warn("openDocumentsModal pre-render error:", err);
    }
    openBottomSheet('modal-documents');
    if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
  };

  // Yüzen Menü (FAB) Aç/Kapa
  window.toggleDocsFabMenu = function() {
    const fabMenu = document.getElementById('m-docs-fab-menu');
    const fabBtn = document.getElementById('m-docs-fab-btn');
    if (!fabMenu || !fabBtn) return;

    const isOpen = fabMenu.classList.contains('show');
    if (isOpen) {
      fabMenu.classList.remove('show');
      fabBtn.classList.remove('active');
    } else {
      renderDocsFabMenu();
      fabMenu.classList.add('show');
      fabBtn.classList.add('active');
    }
  };

  // Yüzen Menüyü (Sekmeler) Dinamik Render Et
  function renderDocsFabMenu() {
    const fabMenu = document.getElementById('m-docs-fab-menu');
    if (!fabMenu) return;

    const state = (window.stateManager && window.stateManager.state) || {};
    const docs = Array.isArray(state.documents) ? state.documents : [];
    const categories = (window.stateManager && typeof window.stateManager.getDocumentCategories === 'function')
      ? window.stateManager.getDocumentCategories()
      : (Array.isArray(state.documentCategories) ? state.documentCategories : []);

    const allCount = docs.length;
    const uncategorizedCount = docs.filter(d => d && !d.categoryId).length;

    let html = `
      <button class="mobile-fab-item ${currentDocsCategory === 'all' ? 'active' : ''}" onclick="window.switchDocsCategory('all')">
        <span style="font-size: 1.15rem;">📑</span>
        <span style="flex: 1; text-align: left;">Tüm Evraklar</span>
        <span style="font-size: 0.72rem; opacity: 0.7; font-weight: 800;">${allCount}</span>
      </button>

      <button class="mobile-fab-item ${currentDocsCategory === 'uncategorized' ? 'active' : ''}" onclick="window.switchDocsCategory('uncategorized')">
        <span style="font-size: 1.15rem;">📁</span>
        <span style="flex: 1; text-align: left;">Kategorisiz Evraklar</span>
        <span style="font-size: 0.72rem; opacity: 0.7; font-weight: 800;">${uncategorizedCount}</span>
      </button>
    `;

    if (Array.isArray(categories)) {
      categories.forEach(cat => {
        if (!cat) return;
        const catCount = docs.filter(d => d && d.categoryId === cat.id).length;
        const isActive = (currentDocsCategory === cat.id);
        html += `
          <button class="mobile-fab-item ${isActive ? 'active' : ''}" onclick="window.switchDocsCategory('${cat.id}')">
            <span style="font-size: 1.15rem;">📂</span>
            <span style="flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(cat.name || 'Sekme')}</span>
            <span style="font-size: 0.72rem; opacity: 0.7; font-weight: 800;">${catCount}</span>
          </button>
        `;
      });
    }

    // Yeni Sekme Ekle Butonu (Yüzen menünün içinde en altta)
    html += `
      <div style="border-top: 1px solid var(--m-border); margin-top: 4px; padding-top: 4px;">
        <button class="mobile-fab-item" onclick="window.openDocumentNewCategoryModal()" style="color: var(--m-primary); font-weight: 800;">
          <span style="font-size: 1.15rem;">➕</span>
          <span>Yeni Sekme Ekle</span>
        </button>
      </div>
    `;

    fabMenu.innerHTML = html;
  }

  // Sekme Değiştir
  window.switchDocsCategory = function(catId) {
    currentDocsCategory = catId;

    // Yüzen menüyü kapat
    const fabMenu = document.getElementById('m-docs-fab-menu');
    const fabBtn = document.getElementById('m-docs-fab-btn');
    if (fabMenu) fabMenu.classList.remove('show');
    if (fabBtn) fabBtn.classList.remove('active');

    // Başlık ve Yönetim Barı Güncelle
    updateDocsHeader();
    renderMobileDocumentsList();
  };

  function updateDocsHeader() {
    const subtitleEl = document.getElementById('m-docs-active-category-subtitle');
    const manageBar = document.getElementById('m-docs-category-manage-bar');
    const customNameEl = document.getElementById('m-docs-custom-category-name');

    const state = (window.stateManager && window.stateManager.state) || {};
    const categories = (window.stateManager && typeof window.stateManager.getDocumentCategories === 'function')
      ? window.stateManager.getDocumentCategories()
      : (Array.isArray(state.documentCategories) ? state.documentCategories : []);

    if (currentDocsCategory === 'all') {
      if (subtitleEl) subtitleEl.textContent = 'Tüm Evraklar';
      if (manageBar) manageBar.style.display = 'none';
    } else if (currentDocsCategory === 'uncategorized') {
      if (subtitleEl) subtitleEl.textContent = 'Kategorisiz Evraklar';
      if (manageBar) manageBar.style.display = 'none';
    } else {
      const cat = Array.isArray(categories) ? categories.find(c => c && c.id === currentDocsCategory) : null;
      const catName = cat ? cat.name : 'Sekme';
      if (subtitleEl) subtitleEl.textContent = catName;
      if (customNameEl) customNameEl.textContent = catName;
      if (manageBar) manageBar.style.display = 'flex';
    }
  }

  // Evrak Listesini Render Et
  function renderMobileDocumentsList() {
    const container = document.getElementById('m-docs-list-container');
    if (!container) return;

    updateDocsHeader();

    const state = (window.stateManager && window.stateManager.state) || {};
    let docs = state.documents || [];
    const categories = (window.stateManager && typeof window.stateManager.getDocumentCategories === 'function')
      ? window.stateManager.getDocumentCategories()
      : (state.documentCategories || []);

    // Kategori Filtresi
    if (currentDocsCategory === 'uncategorized') {
      docs = docs.filter(d => !d.categoryId);
    } else if (currentDocsCategory !== 'all') {
      docs = docs.filter(d => d.categoryId === currentDocsCategory);
    }

    // Arama Filtresi
    const searchInput = document.getElementById('m-docs-search-input');
    const q = searchInput ? (searchInput.value || '').toLowerCase().trim() : '';
    if (q) {
      docs = docs.filter(d => (d.title || '').toLowerCase().includes(q) || (d.fileName || '').toLowerCase().includes(q));
    }

    // En yeni en üstte
    docs = [...docs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (docs.length === 0) {
      let emptyMsg = 'Henüz yüklenmiş bir evrak bulunmuyor.';
      if (currentDocsCategory === 'uncategorized') emptyMsg = 'Kategorisiz bir evrak bulunmuyor.';
      else if (currentDocsCategory !== 'all') {
        const cat = categories.find(c => c.id === currentDocsCategory);
        emptyMsg = `"${cat ? cat.name : 'Bu sekme'}" altında henüz bir evrak bulunmuyor.`;
      }

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 3rem 1rem; color: var(--m-text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📂</div>
          <div style="font-weight: 700; font-size: 0.95rem; color: var(--m-text); margin-bottom: 0.25rem;">${emptyMsg}</div>
          <p style="font-size: 0.78rem; max-width: 280px; margin-bottom: 1.25rem; line-height: 1.4;">
            Zümre, toplantı, plan ve sınav evraklarınızı eklemek için "Evrak Yükle" butonuna dokunun.
          </p>
          <button type="button" class="m-btn-sm" onclick="window.openDocumentUploadModal()" style="background: linear-gradient(135deg, var(--m-primary), #4338ca); color: white; border: none; font-weight: 800; font-size: 0.82rem; padding: 8px 16px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 3px 10px rgba(79, 70, 229, 0.3); cursor: pointer;">
            <span>➕</span> <span>İlk Evrağı Yükle</span>
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = docs.map(doc => {
      const type = (doc.fileType || 'other').toLowerCase();
      let iconClass = 'm-doc-icon-other';
      let iconEmoji = '📄';

      if (type === 'docx' || type === 'doc') {
        iconClass = 'm-doc-icon-word';
        iconEmoji = '📘';
      } else if (type === 'xlsx' || type === 'xls') {
        iconClass = 'm-doc-icon-excel';
        iconEmoji = '📗';
      } else if (type === 'pdf') {
        iconClass = 'm-doc-icon-pdf';
        iconEmoji = '📕';
      }

      const cat = categories.find(c => c.id === doc.categoryId);
      const catLabel = cat ? cat.name : 'Genel';

      let dateStr = '';
      try {
        if (doc.createdAt) {
          dateStr = new Date(doc.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch (e) {}

      return `
        <div class="m-doc-card">
          <div style="display: flex; align-items: flex-start; gap: 10px;">
            <div class="m-doc-icon-badge ${iconClass}">
              ${iconEmoji}
            </div>
            <div style="min-width: 0; flex: 1;">
              <div style="font-weight: 800; font-size: 0.92rem; color: var(--m-text); line-height: 1.3; margin-bottom: 2px;">
                ${escapeHTML(doc.title || doc.fileName || 'İsimsiz Evrak')}
              </div>
              <div style="font-size: 0.72rem; color: var(--m-text-muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span>${escapeHTML(doc.fileName || '')}</span>
                <span>•</span>
                <span>${escapeHTML(doc.fileSize || '')}</span>
                ${dateStr ? `<span>•</span><span>${dateStr}</span>` : ''}
              </div>
              <div style="margin-top: 4px;">
                <span class="m-badge" style="font-size: 0.65rem; padding: 1px 6px; background: rgba(99, 102, 241, 0.08); color: var(--m-primary); font-weight: 700;">
                  📂 ${escapeHTML(catLabel)}
                </span>
              </div>
            </div>
          </div>

          <!-- Eylemler Çubuğu -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--m-border); padding-top: 6px; margin-top: 2px; gap: 4px; overflow-x: auto;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <button type="button" class="m-doc-action-btn" onclick="window.openMobileDocumentViewer('${doc.id}')" style="background: rgba(99, 102, 241, 0.12); color: var(--m-primary); border-color: rgba(99, 102, 241, 0.25);">
                <span>👁️</span> <span>Görüntüle</span>
              </button>
              <button type="button" class="m-doc-action-btn" onclick="window.downloadMobileDocument('${doc.id}')">
                <span>📥</span> <span>İndir</span>
              </button>
              <button type="button" class="m-doc-action-btn" onclick="window.shareMobileDocument('${doc.id}')" style="color: #10b981;">
                <span>📤</span> <span>Paylaş</span>
              </button>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <button type="button" class="m-doc-action-btn" title="Kategori Değiştir" onclick="window.openMobileDocumentMove('${doc.id}')">
                <span>📂</span>
              </button>
              <button type="button" class="m-doc-action-btn" title="Yeniden Adlandır" onclick="window.renameMobileDocument('${doc.id}')">
                <span>✏️</span>
              </button>
              <button type="button" class="m-doc-action-btn" title="Sil" onclick="window.deleteMobileDocument('${doc.id}')" style="color: var(--m-danger);">
                <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  window.filterMobileDocuments = function(val) {
    renderMobileDocumentsList();
  };

  // Yeni Evrak Yükleme Modalı
  window.openDocumentUploadModal = function() {
    mobileSelectedDocFile = null;

    const fileInput = document.getElementById('m-docs-file-input');
    if (fileInput) fileInput.value = '';

    const selectedFileCard = document.getElementById('m-docs-selected-file-card');
    if (selectedFileCard) selectedFileCard.style.display = 'none';

    const titleInput = document.getElementById('m-docs-input-title');
    if (titleInput) titleInput.value = '';

    // Kategorileri doldur
    const categorySelect = document.getElementById('m-docs-input-category');
    if (categorySelect) {
      const state = (window.stateManager && window.stateManager.state) || {};
      const categories = (window.stateManager && typeof window.stateManager.getDocumentCategories === 'function')
        ? window.stateManager.getDocumentCategories()
        : (state.documentCategories || []);

      let catHtml = `<option value="">Genel / Kategorisiz Evraklar</option>`;
      categories.forEach(cat => {
        const isSelected = (currentDocsCategory === cat.id);
        catHtml += `<option value="${cat.id}" ${isSelected ? 'selected' : ''}>${escapeHTML(cat.name)}</option>`;
      });
      categorySelect.innerHTML = catHtml;
    }

    openBottomSheet('modal-document-upload');
  };

  window.closeDocumentUploadModal = function() {
    const sheet = document.getElementById('modal-document-upload');
    if (sheet) sheet.classList.remove('active');
  };

  window.clearSelectedDocumentFile = function() {
    mobileSelectedDocFile = null;
    const fileInput = document.getElementById('m-docs-file-input');
    if (fileInput) fileInput.value = '';
    const selectedFileCard = document.getElementById('m-docs-selected-file-card');
    if (selectedFileCard) selectedFileCard.style.display = 'none';
  };

  // Dosya Seçildiğinde (Word, Excel, PDF) & 15 MB Boyut Kontrolü
  window.handleDocumentFileSelected = function(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // 1. BOYUT KONTROLÜ (Maksimum 15 MB)
    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      showToast(`⚠️ Dosya boyutu çok büyük (${sizeMB} MB)! Uygulama sağlığı için maksimum dosya boyutu 15 MB olmalıdır.`, 'danger');
      e.target.value = '';
      window.clearSelectedDocumentFile();
      return;
    }

    // 2. FORMAT KONTROLÜ
    const fileName = file.name || 'dosya';
    const lastDotIdx = fileName.lastIndexOf('.');
    const ext = (lastDotIdx !== -1 ? fileName.substring(lastDotIdx) : '').toLowerCase();
    const allowedExts = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.txt'];

    if (!allowedExts.includes(ext)) {
      showToast('Lütfen Word (.docx), Excel (.xlsx) veya PDF (.pdf) formatında bir evrak seçin.', 'warning');
      e.target.value = '';
      window.clearSelectedDocumentFile();
      return;
    }

    // Dosya boyutu dizesi
    let sizeStr = '';
    if (file.size < 1024 * 1024) {
      sizeStr = (file.size / 1024).toFixed(1) + ' KB';
    } else {
      sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    }

    // Otomatik başlık öner
    const titleInput = document.getElementById('m-docs-input-title');
    if (titleInput && !titleInput.value.trim()) {
      const baseName = fileName.substring(0, lastDotIdx) || fileName;
      titleInput.value = baseName;
    }

    // İkonu belirle
    let iconEmoji = '📄';
    let fileType = 'other';
    if (ext === '.docx' || ext === '.doc') {
      iconEmoji = '📘';
      fileType = 'docx';
    } else if (ext === '.xlsx' || ext === '.xls') {
      iconEmoji = '📗';
      fileType = 'xlsx';
    } else if (ext === '.pdf') {
      iconEmoji = '📕';
      fileType = 'pdf';
    } else if (ext === '.txt') {
      fileType = 'txt';
    }

    const card = document.getElementById('m-docs-selected-file-card');
    const nameEl = document.getElementById('m-docs-selected-file-name');
    const sizeEl = document.getElementById('m-docs-selected-file-size');
    const iconEl = document.getElementById('m-docs-selected-file-icon');

    if (nameEl) nameEl.textContent = fileName;
    if (sizeEl) sizeEl.textContent = sizeStr;
    if (iconEl) iconEl.textContent = iconEmoji;
    if (card) card.style.display = 'flex';

    // Dosya okuma ve parse işlemi
    const reader = new FileReader();

    if (fileType === 'docx') {
      reader.onload = function(evt) {
        if (window.mammoth) {
          window.mammoth.convertToHtml({ arrayBuffer: evt.target.result })
            .then(result => {
              const html = result.value;
              const b64Reader = new FileReader();
              b64Reader.onload = function(b64Evt) {
                mobileSelectedDocFile = {
                  fileName: fileName,
                  fileSize: sizeStr,
                  fileType: 'docx',
                  content: b64Evt.target.result,
                  htmlContent: html
                };
              };
              b64Reader.readAsDataURL(file);
            })
            .catch(() => {
              readBase64Directly(file, fileName, sizeStr, 'docx');
            });
        } else {
          readBase64Directly(file, fileName, sizeStr, 'docx');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileType === 'xlsx') {
      reader.onload = function(evt) {
        try {
          let html = '';
          if (window.XLSX) {
            const data = new Uint8Array(evt.target.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            html = window.XLSX.utils.sheet_to_html(worksheet, { id: 'm-excel-table', editable: false });
          }
          const b64Reader = new FileReader();
          b64Reader.onload = function(b64Evt) {
            mobileSelectedDocFile = {
              fileName: fileName,
              fileSize: sizeStr,
              fileType: 'xlsx',
              content: b64Evt.target.result,
              htmlContent: html
            };
          };
          b64Reader.readAsDataURL(file);
        } catch (err) {
          readBase64Directly(file, fileName, sizeStr, 'xlsx');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileType === 'pdf') {
      reader.onload = function(evt) {
        mobileSelectedDocFile = {
          fileName: fileName,
          fileSize: sizeStr,
          fileType: 'pdf',
          content: evt.target.result,
          htmlContent: ''
        };
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = function(evt) {
        const text = evt.target.result;
        const html = escapeHTML(text).split('\n').map(l => l.trim() ? `<p>${l}</p>` : '<br>').join('');
        const b64Reader = new FileReader();
        b64Reader.onload = function(b64Evt) {
          mobileSelectedDocFile = {
            fileName: fileName,
            fileSize: sizeStr,
            fileType: 'txt',
            content: b64Evt.target.result,
            htmlContent: html
          };
        };
        b64Reader.readAsDataURL(file);
      };
      reader.readAsText(file);
    }
  };

  function readBase64Directly(file, fileName, sizeStr, fileType) {
    const b64Reader = new FileReader();
    b64Reader.onload = function(b64Evt) {
      mobileSelectedDocFile = {
        fileName: fileName,
        fileSize: sizeStr,
        fileType: fileType,
        content: b64Evt.target.result,
        htmlContent: ''
      };
    };
    b64Reader.readAsDataURL(file);
  }

  // Evrağı Kaydet
  window.saveUploadedDocumentFromMobile = async function() {
    const titleInput = document.getElementById('m-docs-input-title');
    const title = titleInput ? titleInput.value.trim() : '';

    if (!title) {
      showToast('Lütfen evrak için bir başlık girin.', 'warning');
      if (titleInput) titleInput.focus();
      return;
    }

    if (!mobileSelectedDocFile) {
      showToast('Lütfen yüklenecek bir dosya seçin.', 'warning');
      return;
    }

    const categorySelect = document.getElementById('m-docs-input-category');
    const categoryId = categorySelect ? (categorySelect.value || null) : null;

    const docRecord = {
      title: title,
      fileName: mobileSelectedDocFile.fileName,
      fileSize: mobileSelectedDocFile.fileSize,
      fileType: mobileSelectedDocFile.fileType,
      categoryId: categoryId,
      createdAt: new Date().toISOString()
    };

    if (window.stateManager && typeof window.stateManager.addDocument === 'function') {
      const savedDoc = window.stateManager.addDocument(docRecord);
      // Ağır dosya içeriğini IndexedDB'ye kaydet
      await saveDocFileToDB(savedDoc.id, mobileSelectedDocFile.content, mobileSelectedDocFile.htmlContent);
    }

    window.closeDocumentUploadModal();
    renderDocsFabMenu();
    renderMobileDocumentsList();
    showToast('Evrak başarıyla kaydedildi.', 'success');
  };

  // Evrak Görüntüleyici
  window.openMobileDocumentViewer = async function(docId) {
    const state = (window.stateManager && window.stateManager.state) || {};
    const doc = (state.documents || []).find(d => d.id === docId);
    if (!doc) return;

    activeMobileViewerDoc = doc;

    const titleEl = document.getElementById('m-docs-viewer-title');
    const metaEl = document.getElementById('m-docs-viewer-meta');
    const iconEl = document.getElementById('m-docs-viewer-icon');
    const bodyEl = document.getElementById('m-docs-viewer-body');

    if (titleEl) titleEl.textContent = doc.title || doc.fileName || 'Evrak';
    if (metaEl) metaEl.textContent = `${(doc.fileType || '').toUpperCase()} • ${doc.fileSize || ''}`;

    let icon = '📄';
    if (doc.fileType === 'docx') icon = '📘';
    else if (doc.fileType === 'xlsx') icon = '📗';
    else if (doc.fileType === 'pdf') icon = '📕';
    if (iconEl) iconEl.textContent = icon;

    if (bodyEl) {
      bodyEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; color: var(--m-text-muted); gap: 10px;">
          <div class="spinner-sm" style="width: 28px; height: 28px; border: 3px solid var(--m-primary); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <span style="font-size: 0.85rem; font-weight: 700;">Evrak içeriği hazırlanıyor...</span>
        </div>
      `;
    }

    openBottomSheet('modal-document-viewer');

    // IndexedDB'den dosya içeriğini al
    let fileRecord = null;
    try {
      fileRecord = await getDocFileFromDB(doc.id);
    } catch (e) {}

    const fileContent = (fileRecord && fileRecord.content) || doc.content || '';
    const htmlContent = (fileRecord && fileRecord.htmlContent) || doc.htmlContent || '';

    activeMobileViewerDoc = { ...doc, content: fileContent, htmlContent: htmlContent };

    if (!bodyEl) return;

    if (doc.fileType === 'pdf') {
      if (fileContent) {
        bodyEl.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 10px; height: 100%;">
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(239, 68, 68, 0.08); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2);">
              <span style="font-size: 0.78rem; font-weight: 700; color: #ef4444;">📕 PDF Belgesi</span>
              <button type="button" class="m-btn-sm" onclick="window.shareCurrentViewerDocument()" style="background: #ef4444; color: white; border: none; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.72rem; cursor: pointer;">
                Uygulama ile Aç
              </button>
            </div>
            <iframe src="${fileContent}" style="width: 100%; height: calc(100% - 50px); min-height: 480px; border: 1px solid var(--m-border); border-radius: 8px;"></iframe>
          </div>
        `;
      } else {
        bodyEl.innerHTML = `<p style="text-align: center; color: var(--m-danger); padding: 2rem;">PDF içeriği yüklenemedi.</p>`;
      }
    } else {
      if (htmlContent) {
        bodyEl.innerHTML = `<div style="overflow-x: auto;">${htmlContent}</div>`;
      } else {
        bodyEl.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📄</div>
            <div style="font-weight: 700; font-size: 0.9rem; color: var(--m-text);">Doğrudan Önizleme Bulunamadı</div>
            <p style="font-size: 0.78rem; margin: 0.5rem 0 1.25rem 0;">Bu dosyayı indirmek veya telefonunuzdaki uygun bir ofis uygulamasıyla açmak için aşağıdaki butonu kullanabilirsiniz.</p>
            <div style="display: flex; justify-content: center; gap: 8px;">
              <button type="button" class="m-btn-sm" onclick="window.downloadCurrentViewerDocument()" style="background: var(--m-primary); color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700;">
                📥 Dosyayı İndir
              </button>
              <button type="button" class="m-btn-sm" onclick="window.shareCurrentViewerDocument()" style="background: var(--m-surface); border: 1px solid var(--m-border); color: var(--m-text); padding: 8px 14px; border-radius: 8px; font-weight: 700;">
                📤 Paylaş / Birlikte Aç
              </button>
            </div>
          </div>
        `;
      }
    }
  };

  window.closeDocumentViewerModal = function() {
    activeMobileViewerDoc = null;
    const sheet = document.getElementById('modal-document-viewer');
    if (sheet) sheet.classList.remove('active');
  };

  // Görüntüleyicideki Evrağı İndir
  window.downloadCurrentViewerDocument = function() {
    if (!activeMobileViewerDoc) return;
    downloadDocByRecord(activeMobileViewerDoc);
  };

  window.downloadMobileDocument = async function(docId) {
    const state = (window.stateManager && window.stateManager.state) || {};
    const doc = (state.documents || []).find(d => d.id === docId);
    if (!doc) return;

    let content = doc.content;
    if (!content) {
      const record = await getDocFileFromDB(doc.id);
      if (record) content = record.content;
    }

    downloadDocByRecord({ ...doc, content });
  };

  function downloadDocByRecord(doc) {
    if (!doc || !doc.content) {
      showToast('Dosya içeriği bulunamadı.', 'warning');
      return;
    }

    try {
      const a = document.createElement('a');
      a.href = doc.content;
      a.download = doc.fileName || `${doc.title || 'evrak'}.${doc.fileType || 'bin'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Dosya indiriliyor...', 'success');
    } catch (e) {
      showToast('Dosya indirme hatası: ' + e.message, 'danger');
    }
  }

  // Görüntüleyicideki Evrağı Paylaş
  window.shareCurrentViewerDocument = function() {
    if (!activeMobileViewerDoc) return;
    shareDocByRecord(activeMobileViewerDoc);
  };

  window.shareMobileDocument = async function(docId) {
    const state = (window.stateManager && window.stateManager.state) || {};
    const doc = (state.documents || []).find(d => d.id === docId);
    if (!doc) return;

    let content = doc.content;
    if (!content) {
      const record = await getDocFileFromDB(doc.id);
      if (record) content = record.content;
    }

    shareDocByRecord({ ...doc, content });
  };

  function shareDocByRecord(doc) {
    if (!doc) return;
    const shareText = `📄 ${doc.title || doc.fileName}\n📁 Kişisel Evrak Deposu\nFormat: ${(doc.fileType || '').toUpperCase()} (${doc.fileSize || ''})`;

    if (window.AndroidBridge && typeof window.AndroidBridge.shareData === 'function') {
      window.AndroidBridge.shareData(shareText, doc.title || 'Evrak Paylaşımı', 'text/plain');
    } else if (navigator.share) {
      navigator.share({
        title: doc.title || 'Evrak Paylaşımı',
        text: shareText
      }).catch(() => {});
    } else {
      downloadDocByRecord(doc);
    }
  }

  // Görüntüleyicideki Evrağı Yazdır
  window.printCurrentViewerDocument = function() {
    if (!activeMobileViewerDoc) return;
    if (window.AndroidBridge && typeof window.AndroidBridge.printDocument === 'function') {
      window.AndroidBridge.printDocument(activeMobileViewerDoc.title || "Evrak");
    } else {
      window.print();
    }
  };

  // Evrak Taşıma
  window.openMobileDocumentMove = function(docId) {
    const state = (window.stateManager && window.stateManager.state) || {};
    const doc = (state.documents || []).find(d => d.id === docId);
    if (!doc) return;

    targetMoveDoc = doc;

    const titleEl = document.getElementById('m-docs-move-doc-title');
    if (titleEl) titleEl.textContent = doc.title || doc.fileName;

    const listEl = document.getElementById('m-docs-move-category-list');
    if (!listEl) return;

    const categories = (window.stateManager && typeof window.stateManager.getDocumentCategories === 'function')
      ? window.stateManager.getDocumentCategories()
      : (state.documentCategories || []);

    let html = `
      <div class="m-item-card" onclick="window.confirmMoveMobileDocument(null)" style="padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border-left: 3px solid ${!doc.categoryId ? 'var(--m-primary)' : 'transparent'};">
        <div style="font-weight: 700; font-size: 0.88rem; color: var(--m-text);">📁 Genel / Kategorisiz Evraklar</div>
        ${!doc.categoryId ? '<span class="m-badge m-badge-active" style="font-size: 0.68rem;">Mevcut</span>' : ''}
      </div>
    `;

    categories.forEach(cat => {
      const isCurrent = (doc.categoryId === cat.id);
      html += `
        <div class="m-item-card" onclick="window.confirmMoveMobileDocument('${cat.id}')" style="padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border-left: 3px solid ${isCurrent ? 'var(--m-primary)' : 'transparent'};">
          <div style="font-weight: 700; font-size: 0.88rem; color: var(--m-text);">📂 ${escapeHTML(cat.name)}</div>
          ${isCurrent ? '<span class="m-badge m-badge-active" style="font-size: 0.68rem;">Mevcut</span>' : ''}
        </div>
      `;
    });

    listEl.innerHTML = html;
    openBottomSheet('modal-document-move');
  };

  window.confirmMoveMobileDocument = function(catId) {
    if (!targetMoveDoc) return;
    if (window.stateManager && typeof window.stateManager.moveDocumentToCategory === 'function') {
      window.stateManager.moveDocumentToCategory(targetMoveDoc.id, catId);
    }
    window.closeDocumentMoveModal();
    renderDocsFabMenu();
    renderMobileDocumentsList();
    showToast('Evrak seçilen sekmeye taşındı.', 'success');
  };

  window.closeDocumentMoveModal = function() {
    targetMoveDoc = null;
    const sheet = document.getElementById('modal-document-move');
    if (sheet) sheet.classList.remove('active');
  };

  // Evrak Yeniden Adlandır
  window.renameMobileDocument = function(docId) {
    const state = (window.stateManager && window.stateManager.state) || {};
    const doc = (state.documents || []).find(d => d.id === docId);
    if (!doc) return;

    const newTitle = prompt('Evrak için yeni başlık girin:', doc.title || doc.fileName);
    if (newTitle === null) return;
    const trimmed = newTitle.trim();
    if (!trimmed) {
      showToast('Evrak başlığı boş bırakılamaz.', 'warning');
      return;
    }

    if (window.stateManager && typeof window.stateManager.updateDocumentTitle === 'function') {
      window.stateManager.updateDocumentTitle(doc.id, trimmed);
    }
    renderMobileDocumentsList();
    showToast('Evrak başlığı güncellendi.', 'success');
  };

  // Evrak Sil
  window.deleteMobileDocument = async function(docId) {
    const state = (window.stateManager && window.stateManager.state) || {};
    const doc = (state.documents || []).find(d => d.id === docId);
    if (!doc) return;

    if (!confirm(`"${doc.title || doc.fileName}" evrağını silmek istediğinize emin misiniz?`)) {
      return;
    }

    if (window.stateManager && typeof window.stateManager.deleteDocument === 'function') {
      window.stateManager.deleteDocument(doc.id);
    }
    await deleteDocFileFromDB(doc.id);

    renderDocsFabMenu();
    renderMobileDocumentsList();
    showToast('Evrak silindi.', 'info');
  };

  // Yeni Sekme / Kategori Ekleme
  window.openDocumentNewCategoryModal = function() {
    const fabMenu = document.getElementById('m-docs-fab-menu');
    const fabBtn = document.getElementById('m-docs-fab-btn');
    if (fabMenu) fabMenu.classList.remove('show');
    if (fabBtn) fabBtn.classList.remove('active');

    const input = document.getElementById('m-docs-new-cat-name');
    if (input) input.value = '';

    openBottomSheet('modal-document-new-category');
  };

  window.closeDocumentNewCategoryModal = function() {
    const sheet = document.getElementById('modal-document-new-category');
    if (sheet) sheet.classList.remove('active');
  };

  window.saveNewDocumentCategoryFromMobile = function() {
    const input = document.getElementById('m-docs-new-cat-name');
    const name = input ? input.value.trim() : '';

    if (!name) {
      showToast('Lütfen geçerli bir sekme adı girin.', 'warning');
      if (input) input.focus();
      return;
    }

    if (window.stateManager && typeof window.stateManager.addDocumentCategory === 'function') {
      const newCat = window.stateManager.addDocumentCategory(name);
      if (newCat) {
        currentDocsCategory = newCat.id;
      }
    }

    window.closeDocumentNewCategoryModal();
    renderDocsFabMenu();
    renderMobileDocumentsList();
    showToast(`"${name}" sekmesi yüzen menüye eklendi.`, 'success');
  };

  // Mevcut Kategori Adını Değiştir
  window.promptRenameDocumentCategory = function() {
    if (currentDocsCategory === 'all' || currentDocsCategory === 'uncategorized') return;
    const state = (window.stateManager && window.stateManager.state) || {};
    const categories = (window.stateManager && typeof window.stateManager.getDocumentCategories === 'function')
      ? window.stateManager.getDocumentCategories()
      : (state.documentCategories || []);

    const cat = categories.find(c => c.id === currentDocsCategory);
    if (!cat) return;

    const newName = prompt('Sekme için yeni adı girin:', cat.name);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      showToast('Sekme adı boş olamaz.', 'warning');
      return;
    }

    if (window.stateManager && typeof window.stateManager.updateDocumentCategory === 'function') {
      window.stateManager.updateDocumentCategory(cat.id, trimmed);
    }
    renderDocsFabMenu();
    renderMobileDocumentsList();
    showToast('Sekme adı güncellendi.', 'success');
  };

  // Mevcut Kategoriyi Sil
  window.confirmDeleteDocumentCategory = function() {
    if (currentDocsCategory === 'all' || currentDocsCategory === 'uncategorized') return;
    const state = (window.stateManager && window.stateManager.state) || {};
    const categories = (window.stateManager && typeof window.stateManager.getDocumentCategories === 'function')
      ? window.stateManager.getDocumentCategories()
      : (state.documentCategories || []);

    const cat = categories.find(c => c.id === currentDocsCategory);
    if (!cat) return;

    if (!confirm(`"${cat.name}" sekmesini silmek istediğinize emin misiniz?\n\nNot: Bu sekme altındaki evraklarınız silinmez, "Kategorisiz Evraklar" bölümüne aktarılır.`)) {
      return;
    }

    if (window.stateManager && typeof window.stateManager.deleteDocumentCategory === 'function') {
      window.stateManager.deleteDocumentCategory(cat.id);
    }

    currentDocsCategory = 'all';
    renderDocsFabMenu();
    renderMobileDocumentsList();
    showToast(`"${cat.name}" sekmesi silindi.`, 'info');
  };

  // ==========================================================================
  // 5. RAPORLAR MODÜLÜ (GELİŞİM RAPORLARI)
  // ==========================================================================
  function renderMobileReports() {
    const container = document.getElementById('m-reports-list-container');
    const countBadge = document.getElementById('m-reports-count-badge');
    if (!container) return;

    const state = window.stateManager ? window.stateManager.state : {};
    let reports = state.reports || [];

    // Tarihe göre sırala (en yeni en üstte)
    reports = [...reports].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (countBadge) countBadge.textContent = `${reports.length} Rapor`;

    if (reports.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="printer" class="empty-icon"></i>
          <div class="empty-title">Henüz Rapor Oluşturulmadı</div>
          <div class="empty-desc">Yukarıdaki "+ Rapor Oluştur" butonuna dokunarak haftalık veya aylık gelişim dökümü oluşturabilirsiniz.</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = reports.map(rep => {
      const dateStr = rep.createdAt ? new Date(rep.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tarihsiz';
      const studentCount = rep.students ? rep.students.length : (rep.totalStudents || 0);

      return `
        <div class="m-item-card">
          <div class="m-item-header">
            <div>
              <div class="m-item-title">${escapeHTML(rep.title || 'Gelişim Değerlendirme Raporu')}</div>
              <div style="font-size: 0.75rem; color: var(--m-text-muted); margin-top: 2px;">
                📅 ${escapeHTML(dateStr)}${isMiddleSchool() ? ' • Şube: ' + escapeHTML(rep.branch || 'Tümü') : ''}
              </div>
            </div>
            <span class="m-badge m-badge-active">${studentCount} Öğrenci</span>
          </div>

          <div style="font-size: 0.8rem; color: var(--m-text-muted);">
            Kapsam: ${escapeHTML(rep.rangeLabel || 'Bu Hafta')} • ${escapeHTML(rep.metrics || 'Puan, Ödev, Kitap')}
          </div>

          <div class="m-item-actions">
            <button class="m-btn-sm primary" onclick="window.viewMobileReport('${rep.id}')">
              <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Görüntüle
            </button>
            <button class="m-btn-sm success" onclick="window.shareMobileReport('${rep.id}')">
              <i data-lucide="share-2" style="width: 14px; height: 14px;"></i> Paylaş / Gönder
            </button>
            <button class="m-btn-sm" style="flex: 0 0 42px;" onclick="window.deleteMobileReport('${rep.id}')" title="Sil">
              <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--m-danger);"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================================================
  // GELİŞİM RAPORLARI VE KRİTER ANALİZ MOTORU
  // ==========================================================================

  let currentViewingReportId = null;
  let allReportCardsExpanded = false;

  window.handleReportRangeChange = (val) => {
    const customDiv = document.getElementById('m-report-custom-dates');
    if (!customDiv) return;
    if (val === 'custom') {
      customDiv.style.display = 'grid';
      const startInp = document.getElementById('m-report-start-date');
      const endInp = document.getElementById('m-report-end-date');
      const now = new Date();
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (startInp && !startInp.value) startInp.value = fmt(past);
      if (endInp && !endInp.value) endInp.value = fmt(now);
    } else {
      customDiv.style.display = 'none';
    }
  };

  function calculateReportDateBounds(range, customStart, customEnd) {
    const now = new Date();
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (range === 'today') {
      const todayStr = fmt(now);
      return { startDate: todayStr, endDate: todayStr, label: 'Bugünün Özeti' };
    } else if (range === 'this-week') {
      const day = now.getDay();
      const diffToMon = (day === 0 ? -6 : 1) - day;
      const mon = new Date(now);
      mon.setDate(now.getDate() + diffToMon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { startDate: fmt(mon), endDate: fmt(sun), label: 'Haftalık Gelişim Dökümü' };
    } else if (range === 'this-month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: fmt(firstDay), endDate: fmt(lastDay), label: 'Aylık Performans Özeti' };
    } else if (range === 'last-30') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: fmt(past), endDate: fmt(now), label: 'Son 30 Günlük Gelişim' };
    } else if (range === 'custom') {
      const start = customStart || fmt(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
      const end = customEnd || fmt(now);
      return { startDate: start, endDate: end, label: 'Özel Tarih Aralığı' };
    }
    return { startDate: fmt(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)), endDate: fmt(now), label: 'Gelişim Raporu' };
  }

  function getStudentsForReport(branchFilter = 'all') {
    if (!window.stateManager) return [];
    const isMiddle = isMiddleSchool();
    const all = (window.stateManager.state && window.stateManager.state.students) 
      ? window.stateManager.state.students 
      : (window.stateManager.getStudents(true) || []);
    let list = all.filter(s => isStudentInCurrentLevel(s));
    if (isMiddle && branchFilter && branchFilter !== 'all') {
      list = list.filter(st => st.branch === branchFilter);
    }
    return list;
  }

  function computeStudentReportMetrics(student, scopeStudents, startDateStr, endDateStr, criteria, state) {
    const startD = new Date(startDateStr + 'T00:00:00');
    const endD = new Date(endDateStr + 'T23:59:59');
    const isMiddle = isMiddleSchool();

    const result = {
      id: student.id,
      name: `${student.name || ''} ${student.surname || ''}`.trim(),
      firstName: student.name || '',
      surname: student.surname || '',
      number: student.number || '-',
      branch: student.branch || '',
      photo: student.photo || '',
      gender: student.gender || 'male',
      parentPhone: student.parentPhone || student.phone || '',
      books: null,
      homeworks: null,
      points: null,
      attendance: null,
      exams: null,
      tasks: null
    };

    // 1. KİTAP OKUMA KRİTERİ
    if (criteria.books) {
      const txList = (state.books && state.books.transactions) ? state.books.transactions : [];
      const libList = (state.books && state.books.library) ? state.books.library : [];

      const returnTx = txList.filter(t => {
        if (String(t.studentId) !== String(student.id) || !t.returnDate) return false;
        const d = new Date(t.returnDate);
        return d >= startD && d <= endD;
      });

      let readPages = 0;
      const readBooks = [];
      returnTx.forEach(t => {
        const book = libList.find(b => b.id === t.bookId) || {};
        const p = parseInt(book.pages) || 0;
        readPages += p;
        readBooks.push({
          title: book.title || 'Kitap',
          author: book.author || 'Belirtilmemiş',
          pages: p,
          returnDate: t.returnDate ? new Date(t.returnDate).toLocaleDateString('tr-TR') : '-'
        });
      });

      // Şu an okuduğu kitap
      const curTx = txList.find(t => String(t.studentId) === String(student.id) && t.status === 'reading');
      let currentReading = null;
      if (curTx) {
        const curB = libList.find(b => b.id === curTx.bookId) || {};
        currentReading = {
          title: curB.title || 'Kitap',
          author: curB.author || '',
          pages: parseInt(curB.pages) || 0,
          issueDate: curTx.issueDate ? new Date(curTx.issueDate).toLocaleDateString('tr-TR') : '-'
        };
      }

      // Sınıf içi okuma sıralaması
      const classBookStats = scopeStudents.map(s => {
        const sTx = txList.filter(t => {
          if (String(t.studentId) !== String(s.id) || !t.returnDate) return false;
          const d = new Date(t.returnDate);
          return d >= startD && d <= endD;
        });
        let sPages = 0;
        sTx.forEach(t => {
          const b = libList.find(bk => bk.id === t.bookId);
          if (b) sPages += parseInt(b.pages) || 0;
        });
        return { id: s.id, count: sTx.length, pages: sPages };
      }).sort((a, b) => (b.pages - a.pages) || (b.count - a.count));

      const rankIndex = classBookStats.findIndex(b => String(b.id) === String(student.id));
      const bookRank = rankIndex !== -1 ? (rankIndex + 1) : '-';
      const readPct = libList.length > 0 ? ((readBooks.length / libList.length) * 100).toFixed(0) : '0';

      result.books = {
        count: returnTx.length,
        pages: readPages,
        rank: bookRank,
        percentage: readPct,
        items: readBooks,
        currentReading: currentReading
      };
    }

    // 2. ÖDEV TAKİBİ KRİTERİ
    if (criteria.homeworks) {
      const allHws = (state.homeworks || []).filter(hw => {
        const matchBranch = !isMiddle || !hw.branch || hw.branch === student.branch;
        const hwDate = new Date(hw.dueDate);
        return matchBranch && hwDate >= startD && hwDate <= endD;
      });

      let hwCompleted = 0;
      let hwIncomplete = 0;
      let hwMissing = 0;
      let hwExcused = 0;
      const hwItems = [];

      allHws.forEach(hw => {
        const st = hw.status ? hw.status[student.id] : undefined;
        let statusText = 'Değerlendirilmedi';
        let badgeColor = '#64748b';
        let bg = 'rgba(100, 116, 139, 0.1)';

        if (st === 'completed') {
          hwCompleted++;
          statusText = 'Yapıldı (Tam)';
          badgeColor = '#10b981';
          bg = 'rgba(16, 185, 129, 0.12)';
        } else if (st === 'incomplete') {
          hwIncomplete++;
          statusText = 'Eksik / Yarım';
          badgeColor = '#f59e0b';
          bg = 'rgba(245, 158, 11, 0.12)';
        } else if (st === 'missing') {
          hwMissing++;
          statusText = 'Yapılmadı';
          badgeColor = '#ef4444';
          bg = 'rgba(239, 68, 68, 0.12)';
        } else if (st === 'excused') {
          hwExcused++;
          statusText = 'Muaf';
          badgeColor = '#6366f1';
          bg = 'rgba(99, 102, 241, 0.12)';
        }

        hwItems.push({
          title: hw.title || 'Ödev',
          dueDate: hw.dueDate ? new Date(hw.dueDate).toLocaleDateString('tr-TR') : '-',
          status: st || 'none',
          statusText: statusText,
          badgeColor: badgeColor,
          bg: bg
        });
      });

      const totalHw = allHws.length;
      const successPct = totalHw > 0 
        ? Math.round(((hwCompleted + (hwIncomplete * 0.5)) / totalHw) * 100) 
        : 100;

      result.homeworks = {
        total: totalHw,
        completed: hwCompleted,
        incomplete: hwIncomplete,
        missing: hwMissing,
        excused: hwExcused,
        percentage: successPct,
        items: hwItems
      };
    }

    // 3. DAVRANIŞ PUANI KRİTERİ
    if (criteria.points) {
      const allPerf = (state.performance || []).filter(p => {
        if (String(p.studentId) !== String(student.id)) return false;
        const d = new Date(p.date);
        return d >= startD && d <= endD;
      });

      let posCount = 0;
      let posSum = 0;
      let devCount = 0;
      let devSum = 0;
      const perfItems = [];

      allPerf.forEach(p => {
        const pt = parseInt(p.point) || 0;
        const isPos = p.type === 'positive' || pt >= 0;
        if (isPos) {
          posCount++;
          posSum += pt;
        } else {
          devCount++;
          devSum += Math.abs(pt);
        }
        perfItems.push({
          date: p.date ? new Date(p.date).toLocaleDateString('tr-TR') : '-',
          reason: p.reason || (isPos ? 'Olumlu Davranış' : 'Geliştirilmesi Gereken Davranış'),
          point: pt,
          isPositive: isPos
        });
      });

      result.points = {
        totalScore: student.points || 0,
        netPeriodScore: posSum - devSum,
        positiveCount: posCount,
        positiveSum: posSum,
        devCount: devCount,
        devSum: devSum,
        items: perfItems
      };
    }

    // 4. YOKLAMA & DEVAMSIZLIK KRİTERİ
    if (criteria.attendance) {
      const absentDates = [];
      const attMap = state.attendance || {};

      for (const dStr in attMap) {
        if (dStr >= startDateStr && dStr <= endDateStr) {
          if (Array.isArray(attMap[dStr]) && attMap[dStr].includes(student.id)) {
            absentDates.push(dStr);
          }
        }
      }

      absentDates.sort();
      const formattedAbsentDates = absentDates.map(d => {
        const parts = d.split('-');
        const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
      });

      result.attendance = {
        absentDays: absentDates.length,
        dates: formattedAbsentDates
      };
    }

    // 5. SINAVLAR KRİTERİ
    if (criteria.exams) {
      const evalList = (state.weeklyEvaluations || []).filter(e => {
        const matchBranch = !isMiddle || !e.branch || e.branch === student.branch;
        if (!matchBranch) return false;

        // Tarih kontrolü
        if (e.date || e.createdAt) {
          const d = new Date(e.date || e.createdAt);
          if (!isNaN(d.getTime()) && d >= startD && d <= endD) return true;
        }

        // Hafta kontrolü
        if (e.weekId) {
          const parts = e.weekId.split('-W');
          if (parts.length === 2 && window.getDayInWeek) {
            const y = parseInt(parts[0]);
            const w = parseInt(parts[1]);
            const wDate = window.getDayInWeek(y, w, 4); // Perşembe
            if (!isNaN(wDate.getTime()) && wDate >= startD && wDate <= endD) return true;
          }
        }
        return false;
      });

      let participated = 0;
      let totalExamScore = 0;
      const examItems = [];

      evalList.forEach(e => {
        let sc = undefined;
        if (e.studentResults && e.studentResults[student.id]) {
          sc = e.studentResults[student.id].score;
        } else if (e.examScores && e.examScores[student.id] !== undefined) {
          sc = e.examScores[student.id];
        }

        const hasScore = sc !== undefined && sc !== null && sc !== '';
        if (hasScore) {
          participated++;
          totalExamScore += parseFloat(sc);
        }

        let detailText = '';
        if (e.studentResults && e.studentResults[student.id]) {
          const res = e.studentResults[student.id];
          detailText = `${res.correct || 0}D / ${res.wrong || 0}Y / ${res.blank || 0}B • Net: ${typeof res.net === 'number' ? res.net.toFixed(1) : (res.net || '-')}`;
        }

        examItems.push({
          title: e.examName || e.title || 'Haftalık Değerlendirme',
          date: (e.date || e.createdAt) ? new Date(e.date || e.createdAt).toLocaleDateString('tr-TR') : '-',
          score: hasScore ? parseFloat(sc) : null,
          details: detailText
        });
      });

      const avgScore = participated > 0 ? (totalExamScore / participated).toFixed(1) : '-';

      // Sınıf sınav ortalamaları ve sıralama
      const classExams = scopeStudents.map(s => {
        let sPart = 0;
        let sTotal = 0;
        evalList.forEach(e => {
          let sc = undefined;
          if (e.studentResults && e.studentResults[s.id]) {
            sc = e.studentResults[s.id].score;
          } else if (e.examScores && e.examScores[s.id] !== undefined) {
            sc = e.examScores[s.id];
          }
          if (sc !== undefined && sc !== null && sc !== '') {
            sPart++;
            sTotal += parseFloat(sc);
          }
        });
        return { id: s.id, avg: sPart > 0 ? (sTotal / sPart) : 0, participated: sPart };
      }).sort((a, b) => (b.avg - a.avg) || (b.participated - a.participated));

      const examRankIdx = classExams.findIndex(x => String(x.id) === String(student.id));
      const examRank = examRankIdx !== -1 ? (examRankIdx + 1) : '-';

      result.exams = {
        totalExams: evalList.length,
        participated: participated,
        avgScore: avgScore,
        rank: examRank,
        items: examItems
      };
    }

    // 6. GÖREVLER KRİTERİ
    if (criteria.tasks) {
      const studentTasks = (state.tasks || []).filter(t => {
        if (String(t.studentId) !== String(student.id)) return false;
        const d = new Date(t.dueDate || t.createdAt);
        return d >= startD && d <= endD;
      });

      const completed = studentTasks.filter(t => t.status === 'completed');
      const pending = studentTasks.filter(t => t.status !== 'completed');

      result.tasks = {
        total: studentTasks.length,
        completed: completed.length,
        pending: pending.length,
        items: studentTasks.map(t => ({
          title: t.title || 'Görev',
          dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('tr-TR') : '-',
          status: t.status || 'active',
          statusText: t.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'
        }))
      };
    }

    return result;
  }

  window.openCreateReportModal = () => {
    const isMiddle = isMiddleSchool();
    const branchGroup = document.getElementById('m-report-branch-group');
    const branchSelect = document.getElementById('m-report-branch-select');

    if (branchGroup && branchSelect) {
      if (isMiddle) {
        branchGroup.style.display = 'block';
        const branches = (typeof window.getUniqueBranches === 'function') 
          ? window.getUniqueBranches() 
          : [];
        let optHtml = '<option value="all">Tüm Şubeler</option>';
        branches.forEach(b => {
          const sel = (b === activeBranch) ? 'selected' : '';
          optHtml += `<option value="${escapeHTML(b)}" ${sel}>${escapeHTML(b)} Şubesi</option>`;
        });
        branchSelect.innerHTML = optHtml;
      } else {
        branchGroup.style.display = 'none';
      }
    }

    // Reset range dropdown to default
    const rangeSelect = document.getElementById('m-report-range');
    if (rangeSelect) {
      rangeSelect.value = 'this-week';
      window.handleReportRangeChange('this-week');
    }

    openBottomSheet('modal-create-report');
  };

  window.generateNewReport = () => {
    const rangeSelect = document.getElementById('m-report-range');
    const customStartInp = document.getElementById('m-report-start-date');
    const customEndInp = document.getElementById('m-report-end-date');
    const branchSelect = document.getElementById('m-report-branch-select');

    const chkPts = document.getElementById('m-rep-chk-points');
    const chkHw = document.getElementById('m-rep-chk-hw');
    const chkBk = document.getElementById('m-rep-chk-books');
    const chkAtt = document.getElementById('m-rep-chk-att');
    const chkExams = document.getElementById('m-rep-chk-exams');
    const chkTasks = document.getElementById('m-rep-chk-tasks');

    const criteria = {
      points: chkPts ? chkPts.checked : true,
      homeworks: chkHw ? chkHw.checked : true,
      books: chkBk ? chkBk.checked : true,
      attendance: chkAtt ? chkAtt.checked : true,
      exams: chkExams ? chkExams.checked : false,
      tasks: chkTasks ? chkTasks.checked : false
    };

    if (!criteria.points && !criteria.homeworks && !criteria.books && !criteria.attendance && !criteria.exams && !criteria.tasks) {
      showMobileToast('⚠️ Lütfen rapora dahil edilecek en az bir kriter seçin!');
      return;
    }

    const range = rangeSelect ? rangeSelect.value : 'this-week';
    const bounds = calculateReportDateBounds(
      range, 
      customStartInp ? customStartInp.value : '', 
      customEndInp ? customEndInp.value : ''
    );

    const branch = (branchSelect && branchSelect.value) ? branchSelect.value : activeBranch;
    const students = getStudentsForReport(branch);

    if (students.length === 0) {
      showMobileToast('⚠️ Rapora dahil edilecek kayıtlı öğrenci bulunamadı!');
      return;
    }

    const state = window.stateManager ? window.stateManager.state : {};
    const reportStudents = students.map(st => 
      computeStudentReportMetrics(st, students, bounds.startDate, bounds.endDate, criteria, state)
    );

    // Aktif kriter isimleri
    const activeMetricLabels = [];
    if (criteria.points) activeMetricLabels.push('Davranış Puanı');
    if (criteria.homeworks) activeMetricLabels.push('Ödev Takibi');
    if (criteria.books) activeMetricLabels.push('Kitap Okuma');
    if (criteria.attendance) activeMetricLabels.push('Yoklama');
    if (criteria.exams) activeMetricLabels.push('Sınavlar');
    if (criteria.tasks) activeMetricLabels.push('Görevler');

    const branchLabel = (branch === 'all' || !branch) ? 'Tüm Sınıflar' : `${branch} Şubesi`;
    const newReport = {
      id: 'rep_' + Date.now(),
      title: `${branchLabel} ${bounds.label}`,
      range: range,
      rangeLabel: bounds.label,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      branch: branch,
      criteria: criteria,
      metrics: activeMetricLabels.join(', '),
      totalStudents: reportStudents.length,
      students: reportStudents,
      createdAt: new Date().toISOString()
    };

    if (!window.stateManager.state.reports) window.stateManager.state.reports = [];
    window.stateManager.state.reports.push(newReport);
    window.stateManager.saveState();

    window.closeBottomSheet();
    window.vibrate(30);
    showMobileToast('✅ Gelişim raporu tüm kriterleriyle üretildi!');
    renderMobileReports();
    
    // Raporu doğrudan görüntüleme modunda aç
    setTimeout(() => {
      window.viewMobileReport(newReport.id);
    }, 300);
  };

  function renderStudentReportDetailsHtml(st, criteria) {
    let sectionsHtml = '';

    // A. 📚 KİTAP OKUMA KRİTERİ
    if (criteria.books && st.books) {
      const b = st.books;
      let booksListHtml = '';
      if (b.items && b.items.length > 0) {
        booksListHtml = `
          <div class="m-rep-detail-list">
            ${b.items.map(bk => `
              <div class="m-rep-detail-item">
                <div>
                  <div style="font-weight: 700; color: var(--m-text);">${escapeHTML(bk.title)}</div>
                  <div style="font-size: 0.68rem; color: var(--m-text-muted);">${escapeHTML(bk.author)} • ${bk.pages} Sayfa</div>
                </div>
                <span class="m-rep-pill" style="background: rgba(99, 102, 241, 0.12); color: #6366f1;">
                  📅 ${escapeHTML(bk.returnDate)}
                </span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        booksListHtml = `<div style="font-size: 0.72rem; color: var(--m-text-muted); padding: 4px 0;">Seçili dönemde teslim edilen kitap kaydı bulunmuyor.</div>`;
      }

      let curReadingHtml = '';
      if (b.currentReading) {
        curReadingHtml = `
          <div style="background: rgba(99, 102, 241, 0.08); border: 1px dashed rgba(99, 102, 241, 0.3); border-radius: 8px; padding: 6px 10px; margin-bottom: 8px; font-size: 0.74rem;">
            📖 <strong>Şu An Okuyor:</strong> ${escapeHTML(b.currentReading.title)} (${b.currentReading.pages} Sayfa)
          </div>
        `;
      }

      sectionsHtml += `
        <div class="m-rep-criterion-card">
          <div class="m-rep-criterion-title" style="color: #6366f1;">
            <span>📚</span>
            <span>Kitap Okuma İstatistikleri</span>
          </div>

          <div class="m-rep-stat-grid">
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #6366f1;">${b.count}</div>
              <div class="m-rep-stat-lbl">Okunan Kitap</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #6366f1;">${b.pages}</div>
              <div class="m-rep-stat-lbl">Toplam Sayfa</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #6366f1;">#${b.rank}</div>
              <div class="m-rep-stat-lbl">Sınıf Sırası</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #6366f1;">%${b.percentage}</div>
              <div class="m-rep-stat-lbl">Kütüphane Oranı</div>
            </div>
          </div>

          ${curReadingHtml}
          ${booksListHtml}
        </div>
      `;
    }

    // B. 📝 ÖDEV TAKİBİ KRİTERİ
    if (criteria.homeworks && st.homeworks) {
      const hw = st.homeworks;
      let hwListHtml = '';
      if (hw.items && hw.items.length > 0) {
        hwListHtml = `
          <div class="m-rep-detail-list">
            ${hw.items.map(item => `
              <div class="m-rep-detail-item">
                <div>
                  <div style="font-weight: 700; color: var(--m-text);">${escapeHTML(item.title)}</div>
                  <div style="font-size: 0.68rem; color: var(--m-text-muted);">Son Teslim: ${escapeHTML(item.dueDate)}</div>
                </div>
                <span class="m-rep-pill" style="background: ${item.bg}; color: ${item.badgeColor};">
                  ${escapeHTML(item.statusText)}
                </span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        hwListHtml = `<div style="font-size: 0.72rem; color: var(--m-text-muted); padding: 4px 0;">Seçili dönemde tanımlı ödev bulunmuyor.</div>`;
      }

      sectionsHtml += `
        <div class="m-rep-criterion-card">
          <div class="m-rep-criterion-title" style="color: #f59e0b;">
            <span>📝</span>
            <span>Ödev Takip Analizi</span>
          </div>

          <div class="m-rep-stat-grid">
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #10b981;">${hw.completed}</div>
              <div class="m-rep-stat-lbl">Yapıldı (Tam)</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #f59e0b;">${hw.incomplete}</div>
              <div class="m-rep-stat-lbl">Eksik / Yarım</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #ef4444;">${hw.missing}</div>
              <div class="m-rep-stat-lbl">Yapılmadı</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #6366f1;">%${hw.percentage}</div>
              <div class="m-rep-stat-lbl">Başarı Oranı</div>
            </div>
          </div>

          ${hwListHtml}
        </div>
      `;
    }

    // C. ⭐ DAVRANIŞ PUANI KRİTERİ
    if (criteria.points && st.points) {
      const p = st.points;
      let perfListHtml = '';
      if (p.items && p.items.length > 0) {
        perfListHtml = `
          <div class="m-rep-detail-list">
            ${p.items.map(item => `
              <div class="m-rep-detail-item">
                <div>
                  <div style="font-weight: 700; color: var(--m-text);">${escapeHTML(item.reason)}</div>
                  <div style="font-size: 0.68rem; color: var(--m-text-muted);">${escapeHTML(item.date)}</div>
                </div>
                <span class="m-rep-pill" style="background: ${item.isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; color: ${item.isPositive ? '#10b981' : '#ef4444'}; font-weight: 800;">
                  ${item.point >= 0 ? '+' + item.point : item.point} Puan
                </span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        perfListHtml = `<div style="font-size: 0.72rem; color: var(--m-text-muted); padding: 4px 0;">Seçili dönemde özel davranış puanı kaydı bulunmuyor.</div>`;
      }

      sectionsHtml += `
        <div class="m-rep-criterion-card">
          <div class="m-rep-criterion-title" style="color: #10b981;">
            <span>⭐</span>
            <span>Davranış Puanı ve Gelişim Kayıtları</span>
          </div>

          <div class="m-rep-stat-grid">
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #10b981;">${p.totalScore}</div>
              <div class="m-rep-stat-lbl">Genel Puan</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: ${p.netPeriodScore >= 0 ? '#10b981' : '#ef4444'};">
                ${p.netPeriodScore >= 0 ? '+' + p.netPeriodScore : p.netPeriodScore}
              </div>
              <div class="m-rep-stat-lbl">Dönem Net Puanı</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #10b981;">${p.positiveCount}</div>
              <div class="m-rep-stat-lbl">Olumlu Davranış</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #ef4444;">${p.devCount}</div>
              <div class="m-rep-stat-lbl">Geliştirilmeli</div>
            </div>
          </div>

          ${perfListHtml}
        </div>
      `;
    }

    // D. 📅 YOKLAMA & DEVAMSIZLIK KRİTERİ
    if (criteria.attendance && st.attendance) {
      const att = st.attendance;
      let attListHtml = '';
      if (att.dates && att.dates.length > 0) {
        attListHtml = `
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
            ${att.dates.map(dt => `
              <span class="m-rep-pill" style="background: rgba(239, 68, 68, 0.12); color: #ef4444; padding: 4px 8px;">
                ❌ ${escapeHTML(dt)}
              </span>
            `).join('')}
          </div>
        `;
      } else {
        attListHtml = `
          <div style="font-size: 0.76rem; color: #10b981; font-weight: 700; background: rgba(16, 185, 129, 0.08); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2);">
            🎉 Tebrikler! Seçili dönemde hiç devamsızlık yapılmadı, derslere eksiksiz katıldı.
          </div>
        `;
      }

      sectionsHtml += `
        <div class="m-rep-criterion-card">
          <div class="m-rep-criterion-title" style="color: #ef4444;">
            <span>📅</span>
            <span>Yoklama ve Devamsızlık Durumu</span>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--m-surface); border: 1px solid var(--m-border); border-radius: 10px; padding: 8px 12px; margin-bottom: 8px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--m-text);">Toplam Devamsızlık:</div>
            <span class="m-rep-pill" style="background: ${att.absentDays > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)'}; color: ${att.absentDays > 0 ? '#ef4444' : '#10b981'}; font-size: 0.85rem; font-weight: 800; padding: 4px 10px;">
              ${att.absentDays} Gün
            </span>
          </div>

          ${attListHtml}
        </div>
      `;
    }

    // E. 🏆 SINAVLAR KRİTERİ
    if (criteria.exams && st.exams) {
      const ex = st.exams;
      let exListHtml = '';
      if (ex.items && ex.items.length > 0) {
        exListHtml = `
          <div class="m-rep-detail-list">
            ${ex.items.map(item => `
              <div class="m-rep-detail-item">
                <div>
                  <div style="font-weight: 700; color: var(--m-text);">${escapeHTML(item.title)}</div>
                  <div style="font-size: 0.68rem; color: var(--m-text-muted);">Tarih: ${escapeHTML(item.date)}</div>
                </div>
                <span class="m-rep-pill" style="background: rgba(236, 72, 153, 0.12); color: #ec4899; font-weight: 800;">
                  ${item.score !== null ? item.score + ' Puan' : 'Girilmedi'}
                </span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        exListHtml = `<div style="font-size: 0.72rem; color: var(--m-text-muted); padding: 4px 0;">Seçili dönemde kayıtlı sınav bulunmuyor.</div>`;
      }

      sectionsHtml += `
        <div class="m-rep-criterion-card">
          <div class="m-rep-criterion-title" style="color: #ec4899;">
            <span>🏆</span>
            <span>Sınav ve Değerlendirme Analizi</span>
          </div>

          <div class="m-rep-stat-grid">
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #ec4899;">${ex.participated}</div>
              <div class="m-rep-stat-lbl">Katıldığı Sınav</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #ec4899;">${ex.avgScore}</div>
              <div class="m-rep-stat-lbl">Not Ortalaması</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #ec4899;">#${ex.rank}</div>
              <div class="m-rep-stat-lbl">Sınıf Başarı Sırası</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #64748b;">${ex.totalExams}</div>
              <div class="m-rep-stat-lbl">Toplam Sınav</div>
            </div>
          </div>

          ${exListHtml}
        </div>
      `;
    }

    // F. 🎯 GÖREV VE SORUMLULUK KRİTERİ
    if (criteria.tasks && st.tasks) {
      const ts = st.tasks;
      let tsListHtml = '';
      if (ts.items && ts.items.length > 0) {
        tsListHtml = `
          <div class="m-rep-detail-list">
            ${ts.items.map(item => `
              <div class="m-rep-detail-item">
                <div>
                  <div style="font-weight: 700; color: var(--m-text);">${escapeHTML(item.title)}</div>
                  <div style="font-size: 0.68rem; color: var(--m-text-muted);">Son Teslim: ${escapeHTML(item.dueDate)}</div>
                </div>
                <span class="m-rep-pill" style="background: ${item.status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)'}; color: ${item.status === 'completed' ? '#10b981' : '#f59e0b'};">
                  ${escapeHTML(item.statusText)}
                </span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        tsListHtml = `<div style="font-size: 0.72rem; color: var(--m-text-muted); padding: 4px 0;">Seçili dönemde görevlendirme kaydı bulunmuyor.</div>`;
      }

      sectionsHtml += `
        <div class="m-rep-criterion-card">
          <div class="m-rep-criterion-title" style="color: #06b6d4;">
            <span>🎯</span>
            <span>Görev ve Sorumluluk Takibi</span>
          </div>

          <div class="m-rep-stat-grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #10b981;">${ts.completed}</div>
              <div class="m-rep-stat-lbl">Tamamlanan</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #f59e0b;">${ts.pending}</div>
              <div class="m-rep-stat-lbl">Bekleyen</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #06b6d4;">${ts.total}</div>
              <div class="m-rep-stat-lbl">Toplam Görev</div>
            </div>
          </div>

          ${tsListHtml}
        </div>
      `;
    }

    return sectionsHtml;
  }

  window.viewMobileReport = (repId) => {
    currentViewingReportId = repId;
    allReportCardsExpanded = false;
    const state = window.stateManager ? window.stateManager.state : {};
    const rep = (state.reports || []).find(r => r.id === repId);
    if (!rep) return;

    const titleEl = document.getElementById('m-view-report-title');
    const subEl = document.getElementById('m-view-report-subtitle');
    const criteriaBarEl = document.getElementById('m-view-report-criteria-bar');
    const contentEl = document.getElementById('m-view-report-content');
    const searchInp = document.getElementById('m-rep-student-search');
    const toggleAllBtn = document.getElementById('m-rep-toggle-all-btn');

    if (searchInp) searchInp.value = '';
    if (toggleAllBtn) toggleAllBtn.textContent = 'Tümünü Aç';

    if (titleEl) titleEl.textContent = rep.title || 'Gelişim Raporu Detayı';
    
    // Tarih aralığı formatı
    const startFmt = rep.startDate ? new Date(rep.startDate).toLocaleDateString('tr-TR') : '';
    const endFmt = rep.endDate ? new Date(rep.endDate).toLocaleDateString('tr-TR') : '';
    const rangeText = (startFmt && endFmt) ? `${startFmt} - ${endFmt}` : (rep.rangeLabel || 'Bu Hafta');
    const studentCount = (rep.students && rep.students.length) || rep.totalStudents || 0;
    
    if (subEl) {
      subEl.textContent = `📅 ${rangeText} • 👥 ${studentCount} Öğrenci`;
    }

    // Kriter rozetlerini oluştur
    const crit = rep.criteria || { points: true, homeworks: true, books: true, attendance: true };
    if (criteriaBarEl) {
      let critHtml = '';
      if (crit.points) critHtml += `<span class="m-rep-pill" style="background: rgba(16, 185, 129, 0.12); color: #10b981;">⭐ Davranış</span>`;
      if (crit.homeworks) critHtml += `<span class="m-rep-pill" style="background: rgba(245, 158, 11, 0.12); color: #f59e0b;">📝 Ödev</span>`;
      if (crit.books) critHtml += `<span class="m-rep-pill" style="background: rgba(99, 102, 241, 0.12); color: #6366f1;">📚 Kitap</span>`;
      if (crit.attendance) critHtml += `<span class="m-rep-pill" style="background: rgba(239, 68, 68, 0.12); color: #ef4444;">📅 Yoklama</span>`;
      if (crit.exams) critHtml += `<span class="m-rep-pill" style="background: rgba(236, 72, 153, 0.12); color: #ec4899;">🏆 Sınavlar</span>`;
      if (crit.tasks) critHtml += `<span class="m-rep-pill" style="background: rgba(6, 182, 212, 0.12); color: #06b6d4;">🎯 Görevler</span>`;
      criteriaBarEl.innerHTML = critHtml;
    }

    // Öğrenci listesini ve detaylarını hazırla (Eski kayıt ise otomatik hesapla)
    let stList = rep.students || [];
    const scopeStudents = getStudentsForReport(rep.branch || 'all');

    // Eğer eski bir rapor açıldıysa ve detay objeleri eksikse, anında zenginleştir
    stList = stList.map(st => {
      if (st.books !== undefined && st.homeworks !== undefined) return st;
      const fullStudentObj = scopeStudents.find(s => s.id === st.id) || st;
      return computeStudentReportMetrics(fullStudentObj, scopeStudents, rep.startDate || '2026-01-01', rep.endDate || '2026-12-31', crit, state);
    });

    if (contentEl) {
      if (stList.length === 0) {
        contentEl.innerHTML = `
          <div class="empty-state" style="padding: 2rem 1rem;">
            <i data-lucide="users" class="empty-icon"></i>
            <div class="empty-title">Raporda Öğrenci Yok</div>
            <div class="empty-desc">Bu kriter ve şubeye uygun öğrenci bulunamadı.</div>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        openBottomSheet('modal-view-report');
        return;
      }

      contentEl.innerHTML = `
        <div style="font-size: 0.73rem; color: var(--m-text-muted); margin-bottom: 0.6rem; display: flex; justify-content: space-between; align-items: center;">
          <span>Öğrencinin detaylarını görmek için kartına dokunun 👇</span>
          <span style="font-weight: 700;">${stList.length} Kayıt</span>
        </div>

        <div id="m-rep-students-accordion-container" style="display: flex; flex-direction: column;">
          ${stList.map((st, i) => {
            const avatarHtml = st.photo
              ? `<img src="${st.photo}" alt="${escapeHTML(st.name)}">`
              : `${(st.name[0] || '').toUpperCase()}${(st.surname[0] || '').toUpperCase()}`;

            let headerBadges = '';
            if (crit.points && st.points) {
              headerBadges += `<span class="m-rep-pill" style="background: rgba(16, 185, 129, 0.12); color: #10b981;">⭐ ${st.points.totalScore} P</span>`;
            }
            if (crit.books && st.books) {
              headerBadges += `<span class="m-rep-pill" style="background: rgba(99, 102, 241, 0.12); color: #6366f1;">📚 ${st.books.count} Kitap</span>`;
            }
            if (crit.homeworks && st.homeworks) {
              headerBadges += `<span class="m-rep-pill" style="background: rgba(245, 158, 11, 0.12); color: #f59e0b;">📝 %${st.homeworks.percentage} Ödev</span>`;
            }
            if (crit.attendance && st.attendance) {
              headerBadges += `<span class="m-rep-pill" style="background: ${st.attendance.absentDays > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)'}; color: ${st.attendance.absentDays > 0 ? '#ef4444' : '#10b981'};">📅 ${st.attendance.absentDays} Gün Dev.</span>`;
            }

            const branchInfo = st.branch ? ` • Şube: ${escapeHTML(st.branch)}` : '';
            const detailsHtml = renderStudentReportDetailsHtml(st, crit);

            return `
              <div class="m-rep-student-card" id="m-rep-student-${st.id}" data-name="${escapeHTML((st.name || '').toLowerCase())}" data-number="${escapeHTML(st.number || '')}">
                <div class="m-rep-student-header" onclick="window.toggleReportStudent('${st.id}')">
                  <div class="m-rep-avatar-circle">
                    ${avatarHtml}
                  </div>
                  <div class="m-rep-student-info">
                    <div class="m-rep-student-name">${i + 1}. ${escapeHTML(st.name)}</div>
                    <div class="m-rep-student-meta">
                      <span>No: ${escapeHTML(st.number || '-')}</span>
                      <span>${branchInfo}</span>
                    </div>
                    <div class="m-rep-badges-row">
                      ${headerBadges}
                    </div>
                  </div>
                  <svg class="m-rep-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>

                <div class="m-rep-student-body" id="m-rep-body-${st.id}">
                  ${detailsHtml}

                  <div class="m-rep-action-btn-row">
                    <button type="button" class="m-btn-sm success" style="flex: 1; padding: 9px 12px; font-weight: 800; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;" onclick="window.shareStudentReportWhatsApp('${rep.id}', '${st.id}')">
                      <span>📲 Velisine WhatsApp ile Gönder</span>
                    </button>
                    <button type="button" class="m-btn-sm" style="flex: 0 0 46px; border: 1.5px solid var(--m-border); background: var(--m-surface); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center;" onclick="window.printStudentReport('${rep.id}', '${st.id}')" title="Bu Öğrenciyi Yazdır">
                      <i data-lucide="printer" style="width: 16px; height: 16px; color: var(--m-primary);"></i>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top: 1.25rem; display: flex; gap: 8px;">
          <button class="subview-primary-action-btn" style="flex: 1;" onclick="window.shareMobileReport('${rep.id}')">
            <i data-lucide="share-2" style="width: 18px; height: 18px;"></i> Rapor Özetini Paylaş
          </button>
          <button type="button" class="m-btn-sm" style="flex: 0 0 50px; background: rgba(99, 102, 241, 0.12); color: var(--m-primary); border: none; border-radius: 12px; display: flex; align-items: center; justify-content: center;" onclick="window.printMobileReport()" title="Yazdır / PDF">
            <i data-lucide="printer" style="width: 20px; height: 20px;"></i>
          </button>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
    openBottomSheet('modal-view-report');
  };

  window.toggleReportStudent = (studentId) => {
    const card = document.getElementById(`m-rep-student-${studentId}`);
    if (!card) return;
    card.classList.toggle('expanded');
    window.vibrate(15);
  };

  window.toggleAllReportStudents = () => {
    const container = document.getElementById('m-rep-students-accordion-container');
    const toggleBtn = document.getElementById('m-rep-toggle-all-btn');
    if (!container) return;

    allReportCardsExpanded = !allReportCardsExpanded;
    const cards = container.querySelectorAll('.m-rep-student-card');
    cards.forEach(c => {
      if (allReportCardsExpanded) {
        c.classList.add('expanded');
      } else {
        c.classList.remove('expanded');
      }
    });

    if (toggleBtn) {
      toggleBtn.textContent = allReportCardsExpanded ? 'Tümünü Daralt' : 'Tümünü Aç';
    }
  };

  window.filterReportStudents = (query) => {
    const term = (query || '').toLowerCase().trim();
    const container = document.getElementById('m-rep-students-accordion-container');
    if (!container) return;

    const cards = container.querySelectorAll('.m-rep-student-card');
    cards.forEach(c => {
      const name = c.getAttribute('data-name') || '';
      const num = c.getAttribute('data-number') || '';
      if (!term || name.includes(term) || num.includes(term)) {
        c.style.display = 'block';
      } else {
        c.style.display = 'none';
      }
    });
  };

  window.shareStudentReportWhatsApp = (repId, studentId) => {
    const state = window.stateManager.state;
    const rep = (state.reports || []).find(r => r.id === repId);
    if (!rep) return;

    const st = (rep.students || []).find(s => String(s.id) === String(studentId));
    if (!st) return;

    const crit = rep.criteria || { points: true, homeworks: true, books: true, attendance: true };
    const dateStr = new Date().toLocaleDateString('tr-TR');
    const startFmt = rep.startDate ? new Date(rep.startDate).toLocaleDateString('tr-TR') : '';
    const endFmt = rep.endDate ? new Date(rep.endDate).toLocaleDateString('tr-TR') : '';

    let msg = `*ÖĞRENCİ GELİŞİM RAPORU*\n`;
    if (startFmt && endFmt) msg += `📅 *Dönem:* ${startFmt} - ${endFmt}\n`;
    msg += `👤 *Öğrenci:* ${st.name}`;
    if (st.number && st.number !== '-') msg += ` (No: ${st.number})`;
    if (st.branch) msg += ` | Şube: ${st.branch}`;
    msg += `\n----------------------------------------\n`;

    // 1. Kitap Okuma
    if (crit.books && st.books) {
      msg += `📚 *Kitap Okuma:* ${st.books.count} Kitap (${st.books.pages} Sayfa)`;
      if (st.books.rank && st.books.rank !== '-') msg += ` | Sınıf Sırası: #${st.books.rank}`;
      msg += `\n`;
      if (st.books.items && st.books.items.length > 0) {
        st.books.items.slice(0, 3).forEach(bk => {
          msg += `   • ${bk.title} (${bk.pages} sf)\n`;
        });
      }
    }

    // 2. Ödev Takibi
    if (crit.homeworks && st.homeworks) {
      msg += `📝 *Ödev Takibi:* ${st.homeworks.completed} Yapıldı, ${st.homeworks.incomplete} Eksik, ${st.homeworks.missing} Yapılmadı (%${st.homeworks.percentage} Başarı)\n`;
    }

    // 3. Davranış Puanı
    if (crit.points && st.points) {
      const net = st.points.netPeriodScore >= 0 ? '+' + st.points.netPeriodScore : st.points.netPeriodScore;
      msg += `⭐ *Davranış Puanı:* Toplam: ${st.points.totalScore} Puan (Dönem Net: ${net})\n`;
    }

    // 4. Yoklama & Devamsızlık
    if (crit.attendance && st.attendance) {
      msg += `📅 *Devamsızlık:* ${st.attendance.absentDays === 0 ? '0 Gün (Eksiksiz Katılım)' : st.attendance.absentDays + ' Gün'}\n`;
    }

    // 5. Sınavlar
    if (crit.exams && st.exams) {
      msg += `🏆 *Sınav Değerlendirmesi:* Not Ortalaması: ${st.exams.avgScore} | Sınıf Sırası: #${st.exams.rank}\n`;
    }

    // 6. Görevler
    if (crit.tasks && st.tasks) {
      msg += `🎯 *Görev ve Sorumluluk:* ${st.tasks.completed} Tamamlandı, ${st.tasks.pending} Bekleyen\n`;
    }

    msg += `----------------------------------------\n`;
    msg += `*Rapor Tarihi:* ${dateStr}\n`;
    msg += `_Sınıf Asistanı ile hazırlanmıştır._`;

    // Telefon no varsa doğrudan o numaraya yönlendir
    const phone = st.parentPhone || '';
    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('0') && cleanedPhone.length === 11) {
      cleanedPhone = '90' + cleanedPhone.substring(1);
    } else if (cleanedPhone.length === 10) {
      cleanedPhone = '90' + cleanedPhone;
    }

    if (cleanedPhone && cleanedPhone.length >= 10) {
      const waUrl = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    } else {
      if (navigator.share) {
        navigator.share({
          title: `${st.name} Gelişim Raporu`,
          text: msg
        }).catch(() => {
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
          window.open(waUrl, '_blank');
        });
      } else {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
      }
    }
  };

  window.shareMobileReport = (repId) => {
    const state = window.stateManager.state;
    const rep = (state.reports || []).find(r => r.id === repId);
    if (!rep) return;

    const dateStr = new Date(rep.createdAt || Date.now()).toLocaleDateString('tr-TR');
    let summaryText = `📊 *${rep.title}*\n📅 Tarih: ${dateStr}\n👥 Öğrenci Sayısı: ${rep.students ? rep.students.length : 0}\n`;
    summaryText += `📌 Kriterler: ${rep.metrics || 'Tüm Alanlar'}\n\n`;

    (rep.students || []).slice(0, 15).forEach((st, i) => {
      let line = `${i + 1}. ${st.name}`;
      if (st.points) line += ` → ${st.points.totalScore} P`;
      if (st.books) line += ` (Kitap: ${st.books.count})`;
      if (st.homeworks) line += ` (Ödev: %${st.homeworks.percentage})`;
      summaryText += line + '\n';
    });

    if (rep.students && rep.students.length > 15) {
      summaryText += `\n... ve diğer ${rep.students.length - 15} öğrenci.\n`;
    }

    summaryText += `\n_Sınıf Asistanı ile hazırlanmıştır._`;

    if (navigator.share) {
      navigator.share({
        title: rep.title,
        text: summaryText
      }).catch(() => {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
        window.open(waUrl, '_blank');
      });
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
      window.open(waUrl, '_blank');
    }
  };

  window.printMobileReport = () => {
    const state = window.stateManager.state;
    const rep = (state.reports || []).find(r => r.id === currentViewingReportId);
    if (!rep) return;

    const printContainer = document.querySelector('.mobile-report-print');
    if (!printContainer) return;

    const crit = rep.criteria || { points: true, homeworks: true, books: true, attendance: true };
    const dateStr = new Date().toLocaleDateString('tr-TR');

    printContainer.innerHTML = (rep.students || []).map(st => `
      <div class="m-rep-print-page">
        <div class="m-rep-print-header">
          <div>
            <h2 style="margin: 0; font-size: 1.15rem; color: #1e293b;">ÖĞRENCİ GELİŞİM RAPORU</h2>
            <div style="font-size: 0.75rem; color: #64748b;">${escapeHTML(rep.title)}</div>
          </div>
          <div style="text-align: right; font-size: 0.75rem; color: #64748b;">
            Tarih: ${dateStr}
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 12px; display: flex; justify-content: space-between;">
          <div>
            <div style="font-size: 1rem; font-weight: 800; color: #0f172a;">${escapeHTML(st.name)}</div>
            <div style="font-size: 0.75rem; color: #475569;">Okul No: ${escapeHTML(st.number || '-')}${st.branch ? ' | Şube: ' + escapeHTML(st.branch) : ''}</div>
          </div>
        </div>

        ${renderStudentReportDetailsHtml(st, crit)}

        <div style="margin-top: 24px; display: flex; justify-content: space-between; font-size: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          <div>Sınıf Asistanı ile Hazırlanmıştır.</div>
          <div style="text-align: right;">Sınıf Öğretmeni İmza: ____________________</div>
        </div>
      </div>
    `).join('');

    document.body.classList.add('print-mobile-report');
    if (window.AndroidBridge && typeof window.AndroidBridge.printDocument === 'function') {
      window.AndroidBridge.printDocument(rep.title.replace(/\s+/g, '_'));
    } else {
      window.print();
    }

    setTimeout(() => {
      document.body.classList.remove('print-mobile-report');
      printContainer.innerHTML = '';
    }, 1500);
  };

  window.printStudentReport = (repId, studentId) => {
    const state = window.stateManager.state;
    const rep = (state.reports || []).find(r => r.id === repId);
    if (!rep) return;
    const st = (rep.students || []).find(s => String(s.id) === String(studentId));
    if (!st) return;

    const printContainer = document.querySelector('.mobile-report-print');
    if (!printContainer) return;

    const crit = rep.criteria || { points: true, homeworks: true, books: true, attendance: true };
    const dateStr = new Date().toLocaleDateString('tr-TR');

    printContainer.innerHTML = `
      <div class="m-rep-print-page">
        <div class="m-rep-print-header">
          <div>
            <h2 style="margin: 0; font-size: 1.15rem; color: #1e293b;">ÖĞRENCİ GELİŞİM RAPORU</h2>
            <div style="font-size: 0.75rem; color: #64748b;">${escapeHTML(rep.title)}</div>
          </div>
          <div style="text-align: right; font-size: 0.75rem; color: #64748b;">
            Tarih: ${dateStr}
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 12px; display: flex; justify-content: space-between;">
          <div>
            <div style="font-size: 1rem; font-weight: 800; color: #0f172a;">${escapeHTML(st.name)}</div>
            <div style="font-size: 0.75rem; color: #475569;">Okul No: ${escapeHTML(st.number || '-')}${st.branch ? ' | Şube: ' + escapeHTML(st.branch) : ''}</div>
          </div>
        </div>

        ${renderStudentReportDetailsHtml(st, crit)}

        <div style="margin-top: 24px; display: flex; justify-content: space-between; font-size: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          <div>Sınıf Asistanı ile Hazırlanmıştır.</div>
          <div style="text-align: right;">Sınıf Öğretmeni İmza: ____________________</div>
        </div>
      </div>
    `;

    document.body.classList.add('print-mobile-report');
    if (window.AndroidBridge && typeof window.AndroidBridge.printDocument === 'function') {
      window.AndroidBridge.printDocument(`${st.name}_Gelisim_Raporu`.replace(/\s+/g, '_'));
    } else {
      window.print();
    }

    setTimeout(() => {
      document.body.classList.remove('print-mobile-report');
      printContainer.innerHTML = '';
    }, 1500);
  };

  window.deleteMobileReport = (repId) => {
    if (!confirm('Bu raporu silmek istediğinize emin misiniz?')) return;
    window.stateManager.state.reports = (window.stateManager.state.reports || []).filter(r => r.id !== repId);
    window.stateManager.saveState();
    window.vibrate(20);
    showMobileToast('Rapor silindi');
    renderMobileReports();
  };

  // ==========================================================================
  // 6. DERS MATERYALLERİ MODÜLÜ (DEFTERLER VE KİTAPLAR)
  // ==========================================================================
  let currentMaterialsFilter = 'notebooks'; // 'notebooks' | 'textbooks'

  window.toggleMaterialsFab = () => {
    const menu = document.getElementById('m-materials-fab-menu');
    const btn = document.getElementById('m-materials-fab-btn');
    if (menu) menu.classList.toggle('show');
    if (btn) btn.classList.toggle('active');
  };

  window.setMaterialsFilter = (filter) => {
    currentMaterialsFilter = filter;
    window.toggleMaterialsFab();

    const titleEl = document.getElementById('m-materials-filter-title');
    if (titleEl) {
      titleEl.textContent = filter === 'notebooks' ? 'Öğrenci Defterleri' : 'Ders Kitapları';
    }

    renderMobileMaterials();
  };

  function renderMobileMaterials() {
    const container = document.getElementById('m-materials-list-container');
    const countBadge = document.getElementById('m-materials-count-badge');
    if (!container) return;

    const state = window.stateManager ? window.stateManager.state : {};
    const listKey = (currentMaterialsFilter === 'notebooks') ? 'notebooks' : 'textbooks';
    let items = state[listKey] || [];

    if (countBadge) countBadge.textContent = `${items.length} Materyal`;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="${currentMaterialsFilter === 'notebooks' ? 'notebook' : 'book'}" class="empty-icon"></i>
          <div class="empty-title">Kayıtlı Materyal Bulunmuyor</div>
          <div class="empty-desc">Yukarıdaki "+ Materyal Oluştur" butonuna dokunarak ders defteri veya ders kitabı tanımlayabilirsiniz.</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="m-item-card">
        <div class="m-item-header">
          <div>
            <div class="m-item-title">${escapeHTML(item.title || item.name)}</div>
            <div style="font-size: 0.75rem; color: var(--m-text-muted); margin-top: 2px;">
              ${currentMaterialsFilter === 'notebooks' ? '📒 Ders Defteri' : '📚 Ders Kitabı'} • Kontrol: +${item.points || 5} Puan
            </div>
          </div>
          <span class="m-badge m-badge-active">+${item.points || 5}</span>
        </div>

        <div class="m-item-actions">
          <button class="m-btn-sm primary" onclick="window.checkMobileMaterial('${item.id}', '${listKey}')">
            <i data-lucide="check-square" style="width: 14px; height: 14px;"></i> Kontrol Et & Puanla
          </button>
          <button class="m-btn-sm" style="flex: 0 0 42px;" onclick="window.deleteMobileMaterial('${item.id}', '${listKey}')">
            <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--m-danger);"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  window.openCreateMaterialModal = () => {
    openBottomSheet('modal-create-material');
  };

  window.saveNewMaterial = () => {
    const typeSelect = document.getElementById('m-mat-type');
    const nameInput = document.getElementById('m-mat-name');
    const ptsInput = document.getElementById('m-mat-points');

    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      showMobileToast('Lütfen materyal adı girin');
      return;
    }

    const type = typeSelect ? typeSelect.value : 'notebook';
    const listKey = (type === 'notebook') ? 'notebooks' : 'textbooks';

    const newMat = {
      id: 'mat_' + Date.now(),
      title: name,
      points: ptsInput ? parseInt(ptsInput.value) || 5 : 5,
      createdAt: new Date().toISOString()
    };

    if (!window.stateManager.state[listKey]) window.stateManager.state[listKey] = [];
    window.stateManager.state[listKey].push(newMat);
    window.stateManager.saveState();

    window.closeBottomSheet();
    window.vibrate(30);
    showMobileToast('✅ Materyal başarıyla oluşturuldu!');

    currentMaterialsFilter = (type === 'notebook') ? 'notebooks' : 'textbooks';
    const titleEl = document.getElementById('m-materials-filter-title');
    if (titleEl) titleEl.textContent = (type === 'notebook') ? 'Öğrenci Defterleri' : 'Ders Kitapları';

    renderMobileMaterials();
  };

  window.checkMobileMaterial = (matId, listKey) => {
    const state = window.stateManager.state;
    const mat = (state[listKey] || []).find(m => m.id === matId);
    if (!mat) return;

    const titleEl = document.getElementById('m-tool-window-title');
    const bodyEl = document.getElementById('m-tool-window-body');
    if (titleEl) titleEl.textContent = `Kontrol: ${mat.title}`;

    const students = getFilteredStudents();

    if (bodyEl) {
      bodyEl.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--m-text-muted); margin-bottom: 0.75rem;">
          Öğrencinin durumuna dokunarak anında puan verin.
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${students.map(st => `
            <div class="m-item-card" style="padding: 0.75rem 1rem; flex-direction: row; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 800; font-size: 0.9rem;">${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}</div>
                <div style="font-size: 0.72rem; color: var(--m-text-muted);">No: ${escapeHTML(st.number || '-')}</div>
              </div>
              <div style="display: flex; gap: 6px;">
                <button class="m-btn-sm success" style="padding: 0.45rem 0.75rem;" onclick="window.gradeStudentMaterial('${st.id}', ${mat.points || 5}, '${escapeHTML(mat.title)}')">
                  +${mat.points || 5}
                </button>
                <button class="m-btn-sm" style="padding: 0.45rem 0.75rem; color: var(--m-danger);" onclick="window.gradeStudentMaterial('${st.id}', -2, '${escapeHTML(mat.title)} Eksik')">
                  -2
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    openBottomSheet('modal-tool-window');
  };

  window.gradeStudentMaterial = (studentId, points, reason) => {
    window.stateManager.addPoint(studentId, points, reason);
    window.vibrate(25);
    showMobileToast(`${points > 0 ? '+' : ''}${points} Puan İşlendi`);
  };

  window.deleteMobileMaterial = (matId, listKey) => {
    if (!confirm('Bu materyali silmek istediğinize emin misiniz?')) return;
    window.stateManager.state[listKey] = (window.stateManager.state[listKey] || []).filter(m => m.id !== matId);
    window.stateManager.saveState();
    window.vibrate(20);
    showMobileToast('Materyal silindi');
    renderMobileMaterials();
  };

  // ==========================================================================
  // 7. ASİSTAN KONFİGÜRASYONU (HAMBURGER MENÜLÜ SİSTEM AYARLARI)
  // ==========================================================================
  window.openConfigDrawer = () => {
    const drawer = document.getElementById('config-drawer');
    const backdrop = document.getElementById('config-drawer-backdrop');
    if (drawer) drawer.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    window.vibrate(20);
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeConfigDrawer = () => {
    const drawer = document.getElementById('config-drawer');
    const backdrop = document.getElementById('config-drawer-backdrop');
    if (drawer) drawer.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
  };

  // ==========================================================================
  // 7. ASİSTAN KONFİGÜRASYONU YÖNETİMİ (YÜZEN MENÜ & TÜM AYARLAR)
  // ==========================================================================
  let currentConfigPanel = 'general';

  window.toggleConfigFabMenu = () => {
    window.vibrate(15);
    const menu = document.getElementById('m-config-fab-menu');
    const btn = document.getElementById('m-config-fab-btn');
    if (!menu) return;
    const isShowing = menu.classList.toggle('show');
    if (btn) btn.classList.toggle('active', isShowing);
  };

  window.switchConfigPanel = (panelName) => {
    currentConfigPanel = panelName;
    window.vibrate(15);

    const menu = document.getElementById('m-config-fab-menu');
    const btn = document.getElementById('m-config-fab-btn');
    if (menu) menu.classList.remove('show');
    if (btn) btn.classList.remove('active');

    // Panelleri gizle / hedef paneli aç
    document.querySelectorAll('#m-config-panels-wrapper .config-panel').forEach(p => p.style.display = 'none');
    const targetPanel = document.getElementById(`config-panel-${panelName}`);
    if (targetPanel) targetPanel.style.display = 'block';

    // Sayfayı en yukarı kaydır
    const subview = document.getElementById('subview-config');
    if (subview) subview.scrollTo({ top: 0, behavior: 'smooth' });

    // Yüzen menüdeki aktif elemanı işaretle
    document.querySelectorAll('#m-config-fab-menu .mobile-fab-item').forEach(b => b.classList.remove('active'));
    const fabItem = document.getElementById(`cfg-fab-${panelName}`);
    if (fabItem) fabItem.classList.add('active');

    // Üst başlık ve alt başlığı güncelle
    const titleEl = document.getElementById('m-config-panel-title');
    const subtitleEl = document.getElementById('m-config-panel-subtitle');
    const panelMeta = {
      'general': { title: '⚙️ Genel Ayarlar & Lisans', sub: 'Tema, kademe, yedekleme ve lisans yönetimi' },
      'ai': { title: '✨ Yapay Zeka (AI)', sub: 'Google Gemini AI entegrasyonu ve model seçimi' },
      'points': { title: '🏆 Puan & Kural Standartları', sub: 'Davranışlar, ödevler, kitaplar ve sınav ödülleri' },
      'week': { title: '📅 Geçerli Çalışma Haftası', sub: 'Aktif eğitim haftası ve otomatik takvim' },
      'students': { title: '👥 Öğrenci Yönetimi', sub: 'Öğrenci ekleme, düzenleme ve listeleme' },
      'lock': { title: '🔒 Şifre Kontrolü & PIN', sub: 'Uygulama kilidi ve güvenlik ayarları' },
      'manual': { title: '📖 Kullanım Kılavuzu', sub: 'Modüller hakkında detaylı rehber ve SSS' }
    };
    const meta = panelMeta[panelName] || { title: 'Ayarlar', sub: '' };
    if (titleEl) titleEl.textContent = meta.title;
    if (subtitleEl) subtitleEl.textContent = meta.sub;

    if (panelName === 'general') renderMobileLicenseInfo();
    else if (panelName === 'points') renderMobilePointsConfig();
    else if (panelName === 'week') updateMobileWeekUI();
    else if (panelName === 'students') renderConfigStudentsList();
    else if (panelName === 'lock') checkMobilePinStatus();

    if (window.lucide) window.lucide.createIcons();
  };

  function initMobileConfig() {
    const state = window.stateManager ? window.stateManager.state : {};

    // 1. Genel: Kademe
    const lvl = document.getElementById('m-cfg-level');
    if (lvl) lvl.value = (window.stateManager && typeof window.stateManager.getEducationLevel === 'function')
      ? window.stateManager.getEducationLevel()
      : (state.educationLevel || state.gradeLevel || 'middle');

    // 2. Branş Adı
    const branchName = document.getElementById('m-cfg-branch-name');
    if (branchName) branchName.value = state.branchName || '';

    // 3. Tema
    const themeSelect = document.getElementById('m-cfg-theme');
    const savedTheme = localStorage.getItem('sinif_asistani_theme') || document.documentElement.getAttribute('data-theme') || 'light';
    if (themeSelect) themeSelect.value = savedTheme;

    // 4. AI Anahtarı ve Modeli
    const aiKey = document.getElementById('m-cfg-ai-key');
    if (aiKey) aiKey.value = localStorage.getItem('sinif_asistani_gemini_api_key') || '';
    const aiModel = document.getElementById('m-cfg-ai-model');
    let savedAiModel = localStorage.getItem('sinif_asistani_gemini_model') || 'gemini-1.5-flash';
    if (savedAiModel === 'gemini-1.5-pro') {
      savedAiModel = 'gemini-1.5-flash';
      localStorage.setItem('sinif_asistani_gemini_model', 'gemini-1.5-flash');
    }
    if (aiModel) aiModel.value = savedAiModel;

    // 5. Hafta Seçici ve Göstergesi
    updateMobileWeekUI();

    // 6. Şube Seçicileri
    const stBranch = document.getElementById('m-cfg-st-branch');
    if (stBranch) populateBranchOptions(stBranch);

    const stBranchFilter = document.getElementById('m-cfg-st-branch-filter');
    if (stBranchFilter) {
      populateBranchOptions(stBranchFilter);
      // 'Tümü' seçeneğini ekle
      const allOpt = document.createElement('option');
      allOpt.value = 'all';
      allOpt.textContent = 'Tüm Şubeler';
      allOpt.selected = true;
      stBranchFilter.insertBefore(allOpt, stBranchFilter.firstChild);
    }

    const editBranch = document.getElementById('m-edit-st-branch');
    if (editBranch) populateBranchOptions(editBranch);

    // Panelleri hazırla
    renderMobileLicenseInfo();
    renderMobilePointsConfig();
    renderConfigStudentsList();
    checkMobilePinStatus();

    switchConfigPanel(currentConfigPanel || 'general');
  }

  // --- LİSANS YÖNETİMİ ---
  function renderMobileLicenseInfo() {
    const badge = document.getElementById('m-cfg-license-badge');
    const details = document.getElementById('m-cfg-license-details');
    const btnRemove = document.getElementById('btn-m-cfg-remove-license');
    if (!badge || !details) return;

    const licenseConfig = window.LicenseConfig;
    const isLicensed = licenseConfig ? licenseConfig.isLicensed : false;
    const isDemo = licenseConfig ? licenseConfig.isDemo : true;
    const licensee = licenseConfig ? (licenseConfig.licensee || 'Belirtilmedi') : 'Kullanıcı';
    const expiry = licenseConfig ? (licenseConfig.expiryDate === 'never' ? 'Süresiz / Ömür Boyu' : licenseConfig.expiryDate) : 'Süresiz';
    const devId = (licenseConfig && licenseConfig.deviceId) ? licenseConfig.deviceId : (localStorage.getItem('sinif_asistani_device_uuid') || 'Android Cihaz');

    if (isLicensed && !isDemo) {
      badge.innerHTML = `<span style="background: var(--m-success); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: 700;">✅ Aktif (Lisanslı)</span>`;
      details.innerHTML = `
        <div><strong>Lisans Sahibi:</strong> ${escapeHTML(licensee)}</div>
        <div><strong>Geçerlilik:</strong> ${escapeHTML(expiry)}</div>
        <div><strong>Cihaz ID:</strong> <span style="font-family: monospace;">${escapeHTML(devId.substring(0, 16))}...</span></div>
      `;
      if (btnRemove) btnRemove.style.display = 'inline-block';
    } else {
      badge.innerHTML = `<span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: 700;">⭐ Demo / Deneme Sürümü</span>`;
      details.innerHTML = `
        <div>Sınıf Asistanı tüm özellikleri ile deneme sürümündedir. Lisans anahtarınızı girerek sınırsız tam sürüme geçebilirsiniz.</div>
        <div><strong>Cihaz ID:</strong> <span style="font-family: monospace;">${escapeHTML(devId.substring(0, 16))}...</span></div>
      `;
      if (btnRemove) btnRemove.style.display = 'none';
    }
  }

  window.activateMobileLicense = async () => {
    const keyInput = document.getElementById('m-cfg-license-key');
    const key = keyInput ? keyInput.value.trim() : '';
    if (!key) {
      showMobileToast('Lütfen geçerli bir lisans anahtarı girin');
      return;
    }

    if (window.LicenseConfig && typeof window.LicenseConfig.activateLicense === 'function') {
      showMobileToast('🔄 Lisans doğrulanıyor...');
      try {
        const res = await window.LicenseConfig.activateLicense(key);
        if (res && res.success) {
          window.vibrate(50);
          playSynthChime('correct');
          showMobileToast('🎉 Lisans başarıyla aktifleştirildi!');
          if (keyInput) keyInput.value = '';
          renderMobileLicenseInfo();
        } else {
          window.vibrate(100);
          showMobileToast('❌ ' + (res.reason || 'Geçersiz ürün anahtarı!'));
        }
      } catch (e) {
        showMobileToast('❌ Lisans doğrulama hatası');
      }
    } else {
      localStorage.setItem('sinif_asistani_license_key', key);
      showMobileToast('✅ Lisans anahtarı kaydedildi');
      renderMobileLicenseInfo();
    }
  };

  window.removeMobileLicense = () => {
    if (!confirm('Lisansı bu cihazdan kaldırmak istediğinize emin misiniz?')) return;
    if (window.LicenseConfig && typeof window.LicenseConfig.removeLicense === 'function') {
      window.LicenseConfig.removeLicense();
    } else {
      localStorage.removeItem('sinif_asistani_license_key');
    }
    window.vibrate(20);
    showMobileToast('Lisans kaldırıldı');
    renderMobileLicenseInfo();
  };

  window.buyMobileLicense = () => {
    const devId = localStorage.getItem('sinif_asistani_device_uuid') || '';
    const msg = encodeURIComponent(`Merhaba, Sınıf Asistanı Android sürümü için lisans satın almak istiyorum. Cihaz ID: ${devId}`);
    window.open(`https://wa.me/905335601267?text=${msg}`, '_blank');
  };

  // --- SİSTEM SIFIRLAMA ---
  window.resetMobileSystem = () => {
    if (!confirm('⚠️ DİKKAT: Tüm veriler (öğrenciler, notlar, ödevler, kitaplar) silinecek ve fabrika ayarlarına dönülecektir!\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?')) return;
    if (window.stateManager && typeof window.stateManager.resetState === 'function') {
      window.stateManager.resetState();
      window.vibrate(50);
      showMobileToast('🔄 Sistem fabrika ayarlarına sıfırlandı');
      setTimeout(() => {
        window.location.reload();
      }, 900);
    }
  };

  // --- PUAN AYARLARI ---
  function renderMobilePointsConfig() {
    if (!window.stateManager) return;

    // 1. Davranışlar
    const behaviors = (typeof window.stateManager.getPerformanceBehaviors === 'function')
      ? window.stateManager.getPerformanceBehaviors()
      : (window.stateManager.state.performanceBehaviors || { positive: [], development: [] });

    const posContainer = document.getElementById('m-cfg-pos-behaviors-list');
    if (posContainer) {
      const posList = behaviors.positive || [];
      posContainer.innerHTML = posList.length === 0
        ? '<div style="font-size: 0.75rem; color: var(--m-text-muted); padding: 4px;">Kayıtlı olumlu davranış bulunmuyor.</div>'
        : posList.map(b => `
          <div class="m-behavior-row">
            <span style="flex: 1;">${escapeHTML(b.title)}</span>
            <span class="badge" style="background: var(--m-success); color: white; padding: 2px 7px; border-radius: 10px; font-size: 0.72rem; font-weight: 700;">+${b.points}</span>
            <button onclick="window.deleteMobileBehavior('positive', '${b.id}')" style="background: none; border: none; padding: 2px 4px; color: var(--m-danger); cursor: pointer;">
              <i data-lucide="x" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        `).join('');
    }

    const devContainer = document.getElementById('m-cfg-dev-behaviors-list');
    if (devContainer) {
      const devList = behaviors.development || [];
      devContainer.innerHTML = devList.length === 0
        ? '<div style="font-size: 0.75rem; color: var(--m-text-muted); padding: 4px;">Kayıtlı geliştirilmeli davranış bulunmuyor.</div>'
        : devList.map(b => `
          <div class="m-behavior-row">
            <span style="flex: 1;">${escapeHTML(b.title)}</span>
            <span class="badge" style="background: var(--m-danger); color: white; padding: 2px 7px; border-radius: 10px; font-size: 0.72rem; font-weight: 700;">${b.points}</span>
            <button onclick="window.deleteMobileBehavior('development', '${b.id}')" style="background: none; border: none; padding: 2px 4px; color: var(--m-danger); cursor: pointer;">
              <i data-lucide="x" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        `).join('');
    }

    // 2. Ödev Puanları
    const hwSettings = (typeof window.stateManager.getHomeworkSettings === 'function')
      ? window.stateManager.getHomeworkSettings()
      : {};
    const hwFull = document.getElementById('m-cfg-pt-hw-full');
    const hwHalf = document.getElementById('m-cfg-pt-hw-half');
    const hwZero = document.getElementById('m-cfg-pt-hw-zero');
    const hwExcused = document.getElementById('m-cfg-pt-hw-excused');
    const hwWhatsApp = document.getElementById('m-cfg-hw-whatsapp');

    if (hwFull) hwFull.value = hwSettings.completed ?? 4;
    if (hwHalf) hwHalf.value = hwSettings.incomplete ?? 2;
    if (hwZero) hwZero.value = hwSettings.missing ?? -4;
    if (hwExcused) hwExcused.value = hwSettings.excused ?? 0;
    if (hwWhatsApp) hwWhatsApp.value = hwSettings.whatsappGroupLink || '';

    // 3. Kitap Puanları
    const bookSettings = (typeof window.stateManager.getBookSettings === 'function')
      ? window.stateManager.getBookSettings()
      : {};
    const b1Ontime = document.getElementById('m-cfg-book-l1-ontime');
    const b1Late = document.getElementById('m-cfg-book-l1-late');
    const b1Limit = document.getElementById('m-cfg-book-l1-limit');
    const b2Ontime = document.getElementById('m-cfg-book-l2-ontime');
    const b2Late = document.getElementById('m-cfg-book-l2-late');
    const b2Limit = document.getElementById('m-cfg-book-l2-limit');

    if (b1Ontime) b1Ontime.value = (bookSettings.level1 && bookSettings.level1.ontime) ?? 10;
    if (b1Late) b1Late.value = (bookSettings.level1 && bookSettings.level1.late) ?? 5;
    if (b1Limit) b1Limit.value = (bookSettings.level1 && bookSettings.level1.readingLimitDays) ?? 4;
    if (b2Ontime) b2Ontime.value = (bookSettings.level2 && bookSettings.level2.ontime) ?? 20;
    if (b2Late) b2Late.value = (bookSettings.level2 && bookSettings.level2.late) ?? 10;
    if (b2Limit) b2Limit.value = (bookSettings.level2 && bookSettings.level2.readingLimitDays) ?? 7;

    // 4. Sınav Puanları
    const examSettings = (typeof window.stateManager.getWeeklyExamSettings === 'function')
      ? window.stateManager.getWeeklyExamSettings()
      : {};
    const topCountEl = document.getElementById('m-cfg-exam-topcount');
    if (topCountEl) topCountEl.value = examSettings.topCount || 3;
    window.renderMobileExamRanks();

    if (window.lucide) window.lucide.createIcons();
  }

  window.renderMobileExamRanks = () => {
    const topCountEl = document.getElementById('m-cfg-exam-topcount');
    const container = document.getElementById('m-cfg-exam-ranks-container');
    if (!container || !topCountEl) return;

    const count = parseInt(topCountEl.value) || 3;
    const examSettings = (window.stateManager && typeof window.stateManager.getWeeklyExamSettings === 'function')
      ? window.stateManager.getWeeklyExamSettings()
      : {};
    const currentRanks = examSettings.rankPoints || { 1: 50, 2: 30, 3: 15 };

    container.innerHTML = '';
    for (let r = 1; r <= count; r++) {
      const val = currentRanks[r] !== undefined ? currentRanks[r] : Math.max(10, 50 - (r - 1) * 10);
      const div = document.createElement('div');
      div.innerHTML = `
        <label style="font-size: 0.72rem; font-weight: 700; color: var(--m-text); display: block; margin-bottom: 2px;">${r}. Derece (+)</label>
        <input type="number" class="m-form-input m-cfg-exam-rank-input" data-rank="${r}" value="${val}" style="padding: 6px; text-align: center; font-size: 0.85rem;">
      `;
      container.appendChild(div);
    }
  };

  window.addMobilePosBehavior = () => {
    const nameEl = document.getElementById('m-new-pos-name');
    const ptsEl = document.getElementById('m-new-pos-pts');
    const title = nameEl ? nameEl.value.trim() : '';
    const points = ptsEl ? (parseInt(ptsEl.value) || 5) : 5;

    if (!title) {
      showMobileToast('Lütfen davranış başlığı girin');
      return;
    }

    if (!window.stateManager.state.performanceBehaviors) {
      window.stateManager.state.performanceBehaviors = { positive: [], development: [] };
    }
    if (!window.stateManager.state.performanceBehaviors.positive) {
      window.stateManager.state.performanceBehaviors.positive = [];
    }

    const newBh = {
      id: 'bh_' + Date.now(),
      title,
      points: Math.abs(points),
      icon: '⭐',
      category: 'positive'
    };
    window.stateManager.state.performanceBehaviors.positive.push(newBh);
    window.stateManager.saveState();

    if (nameEl) nameEl.value = '';
    window.vibrate(20);
    renderMobilePointsConfig();
    showMobileToast('✅ Olumlu davranış eklendi');
  };

  window.addMobileDevBehavior = () => {
    const nameEl = document.getElementById('m-new-dev-name');
    const ptsEl = document.getElementById('m-new-dev-pts');
    const title = nameEl ? nameEl.value.trim() : '';
    let points = ptsEl ? (parseInt(ptsEl.value) || -5) : -5;
    if (points > 0) points = -points;

    if (!title) {
      showMobileToast('Lütfen davranış başlığı girin');
      return;
    }

    if (!window.stateManager.state.performanceBehaviors) {
      window.stateManager.state.performanceBehaviors = { positive: [], development: [] };
    }
    if (!window.stateManager.state.performanceBehaviors.development) {
      window.stateManager.state.performanceBehaviors.development = [];
    }

    const newBh = {
      id: 'bh_' + Date.now(),
      title,
      points,
      icon: '⚠️',
      category: 'development'
    };
    window.stateManager.state.performanceBehaviors.development.push(newBh);
    window.stateManager.saveState();

    if (nameEl) nameEl.value = '';
    window.vibrate(20);
    renderMobilePointsConfig();
    showMobileToast('✅ Geliştirilmeli davranış eklendi');
  };

  window.deleteMobileBehavior = (type, id) => {
    if (!confirm('Bu davranışı silmek istediğinize emin misiniz?')) return;
    if (window.stateManager && window.stateManager.state.performanceBehaviors) {
      const list = window.stateManager.state.performanceBehaviors[type] || [];
      window.stateManager.state.performanceBehaviors[type] = list.filter(b => b.id !== id);
      window.stateManager.saveState();
      window.vibrate(15);
      renderMobilePointsConfig();
      showMobileToast('Davranış silindi');
    }
  };

  window.testMobileWhatsApp = () => {
    const linkInput = document.getElementById('m-cfg-hw-whatsapp');
    const url = linkInput ? linkInput.value.trim() : '';
    if (!url) {
      showMobileToast('Lütfen test edilecek bir WhatsApp linki girin');
      return;
    }
    window.open(url, '_blank');
  };

  window.saveMobilePointRules = () => {
    if (!window.stateManager) return;

    // 1. Ödev Puanları
    const hwFull = document.getElementById('m-cfg-pt-hw-full');
    const hwHalf = document.getElementById('m-cfg-pt-hw-half');
    const hwZero = document.getElementById('m-cfg-pt-hw-zero');
    const hwExcused = document.getElementById('m-cfg-pt-hw-excused');
    const hwWhatsApp = document.getElementById('m-cfg-hw-whatsapp');

    const hwSettings = {
      completed: hwFull ? (parseInt(hwFull.value) || 4) : 4,
      incomplete: hwHalf ? (parseInt(hwHalf.value) || 2) : 2,
      missing: hwZero ? (parseInt(hwZero.value) || -4) : -4,
      excused: hwExcused ? (parseInt(hwExcused.value) || 0) : 0,
      whatsappGroupLink: hwWhatsApp ? hwWhatsApp.value.trim() : ''
    };
    if (typeof window.stateManager.updateHomeworkSettings === 'function') {
      window.stateManager.updateHomeworkSettings(hwSettings);
    }

    // 2. Kitap Puanları
    const b1Ontime = document.getElementById('m-cfg-book-l1-ontime');
    const b1Late = document.getElementById('m-cfg-book-l1-late');
    const b1Limit = document.getElementById('m-cfg-book-l1-limit');
    const b2Ontime = document.getElementById('m-cfg-book-l2-ontime');
    const b2Late = document.getElementById('m-cfg-book-l2-late');
    const b2Limit = document.getElementById('m-cfg-book-l2-limit');

    const bookSettings = {
      level1: {
        ontime: b1Ontime ? (parseInt(b1Ontime.value) || 10) : 10,
        late: b1Late ? (parseInt(b1Late.value) || 5) : 5,
        readingLimitDays: b1Limit ? (parseInt(b1Limit.value) || 4) : 4
      },
      level2: {
        ontime: b2Ontime ? (parseInt(b2Ontime.value) || 20) : 20,
        late: b2Late ? (parseInt(b2Late.value) || 10) : 10,
        readingLimitDays: b2Limit ? (parseInt(b2Limit.value) || 7) : 7
      }
    };
    if (typeof window.stateManager.updateBookSettings === 'function') {
      window.stateManager.updateBookSettings(bookSettings);
    }

    // 3. Sınav Puanları
    const topCountEl = document.getElementById('m-cfg-exam-topcount');
    const topCount = topCountEl ? (parseInt(topCountEl.value) || 3) : 3;
    const rankPoints = {};
    document.querySelectorAll('.m-cfg-exam-rank-input').forEach(input => {
      const r = input.getAttribute('data-rank');
      rankPoints[r] = parseInt(input.value) || 0;
    });
    if (typeof window.stateManager.updateWeeklyExamSettings === 'function') {
      window.stateManager.updateWeeklyExamSettings({ topCount, rankPoints });
    }

    window.stateManager.saveState();
    window.vibrate(30);
    showMobileToast('✅ Tüm puan ve kural standartları kaydedildi');
  };

  // --- HAFTA YÖNETİMİ ---
  function updateMobileWeekUI(targetWeekId) {
    if (!window.stateManager) return;
    const currentWeekId = targetWeekId || (typeof window.stateManager.getSelectedWeek === 'function' ? window.stateManager.getSelectedWeek() : (window.getISOWeek ? window.getISOWeek() : ''));

    // 1. Badge Göstergesi
    const badgeText = document.getElementById('m-cfg-week-display-badge');
    if (badgeText) {
      if (typeof window.formatWeekTR === 'function') {
        badgeText.textContent = window.formatWeekTR(currentWeekId, 'full') || currentWeekId;
      } else {
        badgeText.textContent = currentWeekId || '-';
      }
    }

    // 2. Açılır Hafta Seçim Listesi (Tüm Eğitim Haftaları 1..40)
    const weekSelect = document.getElementById('m-cfg-week-select');
    if (weekSelect) {
      weekSelect.innerHTML = '';

      const currInfo = typeof window.getEducationWeekInfo === 'function' ? window.getEducationWeekInfo(currentWeekId) : null;
      const startYear = currInfo ? parseInt(currInfo.academicYear.split('-')[0], 10) : (new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear() - 1);
      const opening = typeof window.getSchoolOpeningMonday === 'function' ? window.getSchoolOpeningMonday(startYear) : new Date(startYear, 8, 15);

      for (let k = 1; k <= 40; k++) {
        const d = new Date(opening.getTime() + (k - 1) * 7 * 24 * 60 * 60 * 1000);
        const iso = typeof window.getISOWeek === 'function' ? window.getISOWeek(d) : `W${k}`;
        const inf = typeof window.getEducationWeekInfo === 'function' ? window.getEducationWeekInfo(iso) : null;

        const opt = document.createElement('option');
        opt.value = iso;
        opt.textContent = inf ? inf.label : `${k}. Hafta (${iso})`;
        if (iso === currentWeekId) opt.selected = true;
        weekSelect.appendChild(opt);
      }

      // Eğer mevcut hafta 1..40 aralığı dışındaysa (tatil / dönem öncesi) başa ekle
      if (currentWeekId && !Array.from(weekSelect.options).some(o => o.value === currentWeekId)) {
        const opt = document.createElement('option');
        opt.value = currentWeekId;
        opt.textContent = typeof window.formatWeekTR === 'function' ? window.formatWeekTR(currentWeekId, 'full') : currentWeekId;
        opt.selected = true;
        weekSelect.insertBefore(opt, weekSelect.firstChild);
      }
    }
  }

  window.adjustMobileWeek = (offset) => {
    if (!window.stateManager) return;
    let curWeek = typeof window.stateManager.getSelectedWeek === 'function' ? window.stateManager.getSelectedWeek() : '';
    if (!curWeek) curWeek = typeof window.getISOWeek === 'function' ? window.getISOWeek(new Date()) : '';
    if (!curWeek) return;

    const parts = curWeek.split('-W');
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const week = parseInt(parts[1], 10);
      const d = window.getDayInWeek ? window.getDayInWeek(year, week, 4) : new Date();
      d.setDate(d.getDate() + (offset * 7));
      const newWeek = typeof window.getISOWeek === 'function' ? window.getISOWeek(d) : curWeek;
      window.stateManager.setSelectedWeek(newWeek);
      updateMobileWeekUI(newWeek);
      window.vibrate(20);
      const weekLabel = typeof window.formatWeekTR === 'function' ? window.formatWeekTR(newWeek, 'short') : newWeek;
      showMobileToast(`📅 Hafta değiştirildi: ${weekLabel}`);
      renderActiveTab();
    }
  };

  window.resetMobileWeekToCurrent = () => {
    if (!window.stateManager) return;
    const thisWeek = typeof window.getISOWeek === 'function' ? window.getISOWeek(new Date()) : '';
    if (thisWeek) {
      window.stateManager.setSelectedWeek(thisWeek);
      updateMobileWeekUI(thisWeek);
      window.vibrate(25);
      showMobileToast('📅 Güncel eğitim haftasına (Bugün) dönüldü');
      renderActiveTab();
    }
  };

  window.saveMobileActiveWeek = () => {
    const sel = document.getElementById('m-cfg-week-select');
    if (sel && window.stateManager) {
      const newWeek = sel.value;
      window.stateManager.setSelectedWeek(newWeek);
      updateMobileWeekUI(newWeek);
      window.vibrate(30);
      const weekLabel = typeof window.formatWeekTR === 'function' ? window.formatWeekTR(newWeek, 'short') : newWeek;
      showMobileToast(`✅ Aktif çalışma haftası güncellendi: ${weekLabel}`);
      renderActiveTab();
    }
  };

  // --- ÖĞRENCİ YÖNETİMİ ---
  function renderConfigStudentsList() {
    const container = document.getElementById('m-cfg-students-list');
    const totalEl = document.getElementById('m-cfg-st-total');
    if (!container) return;

    const searchTerm = (document.getElementById('m-cfg-st-search') ? document.getElementById('m-cfg-st-search').value.trim().toLowerCase() : '');
    const branchFilter = (document.getElementById('m-cfg-st-branch-filter') ? document.getElementById('m-cfg-st-branch-filter').value : 'all');

    const isMiddle = isMiddleSchool();
    let allStudents = window.stateManager ? (window.stateManager.state.students || []) : [];

    // Ayarlarda seçilen eğitim kademesine göre filtreleme (İlkokul -> sadece ilkokul, Ortaokul -> sadece ortaokul)
    let students = allStudents.filter(s => isStudentInCurrentLevel(s));

    if (isMiddle && branchFilter !== 'all') {
      students = students.filter(s => s.branch === branchFilter);
    }
    if (searchTerm) {
      students = students.filter(s => {
        const full = `${s.name || ''} ${s.surname || ''} ${s.number || ''}`.toLowerCase();
        return full.includes(searchTerm);
      });
    }

    if (totalEl) totalEl.textContent = students.length;

    if (students.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="users" style="width: 32px; height: 32px; opacity: 0.5; margin-bottom: 0.5rem;"></i>
          <div style="font-weight: 700; font-size: 0.88rem;">Kayıtlı öğrenci bulunamadı</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = students.map(st => {
      const avatarColor = getAvatarColor(st.id || st.name);
      const avatarContent = st.photo
        ? `<img src="${st.photo}" style="width: 100%; height: 100%; object-fit: cover;">`
        : escapeHTML((st.name || '?').charAt(0).toUpperCase());

      return `
      <div class="m-item-card" style="padding: 0.75rem 0.85rem; flex-direction: row; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
          <div style="width: 38px; height: 38px; border-radius: 50%; overflow: hidden; background-color: ${avatarColor}; color: #fff; font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.12);">
            ${avatarContent}
          </div>
          <div style="min-width: 0; flex: 1;">
            <div style="font-weight: 800; font-size: 0.9rem; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}
            </div>
            <div style="font-size: 0.74rem; color: var(--m-text-muted); margin-top: 2px;">
              No: <strong>${escapeHTML(st.number || '-')}</strong>${(isMiddle && st.branch) ? ` • Şube: <strong>${escapeHTML(st.branch)}</strong>` : ''}
              ${st.phone ? ` • 📞 ${escapeHTML(st.phone)}` : ''}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 6px; flex-shrink: 0; margin-left: 6px;">
          <button class="m-btn-sm" style="padding: 6px 10px; font-size: 0.75rem;" onclick="window.editMobileStudent('${st.id}')">
            <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i> Düzenle
          </button>
          <button class="m-btn-sm danger" style="padding: 6px 8px;" onclick="window.deleteConfigStudent('${st.id}')">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>
    `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================================================
  // ÖĞRENCİ FOTOĞRAFI YÖNETİMİ (SIKIŞTIRMA, KAMERA / GALERİ & SİLME)
  // ==========================================================================
  function compressStudentPhoto(source, maxWidth = 256, maxHeight = 256, quality = 0.82) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => {
        resolve(typeof source === 'string' ? source : null);
      };
      if (typeof source === 'string') {
        img.src = source;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(source);
      }
    });
  }

  window.handleStudentPhotoSelected = async (input, mode) => {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    try {
      window.vibrate(15);
      showMobileToast('⏳ Fotoğraf işleniyor...');
      const compressedData = await compressStudentPhoto(file, 256, 256, 0.82);
      if (!compressedData) {
        showMobileToast('❌ Fotoğraf işlenemedi');
        return;
      }

      const previewEl = document.getElementById(`m-${mode}-st-avatar-preview`);
      const dataEl = document.getElementById(`m-${mode}-st-photo-data`);
      const removeBtn = document.getElementById(`m-${mode}-st-photo-remove`);

      if (dataEl) dataEl.value = compressedData;
      if (previewEl) {
        previewEl.innerHTML = `<img src="${compressedData}" style="width: 100%; height: 100%; object-fit: cover;">`;
      }
      if (removeBtn) removeBtn.style.display = 'flex';
      showMobileToast('✅ Fotoğraf eklendi', 'success');
    } catch (err) {
      console.error('Photo selection error:', err);
      showMobileToast('❌ Fotoğraf seçilirken bir hata oluştu');
    } finally {
      input.value = '';
    }
  };

  window.removeEditStudentPhoto = () => {
    window.vibrate(15);
    const dataEl = document.getElementById('m-edit-st-photo-data');
    const previewEl = document.getElementById('m-edit-st-avatar-preview');
    const removeBtn = document.getElementById('m-edit-st-photo-remove');
    const nameEl = document.getElementById('m-edit-st-name');

    if (dataEl) dataEl.value = '';
    if (previewEl) {
      const initial = (nameEl && nameEl.value.trim()) ? escapeHTML(nameEl.value.trim().charAt(0).toUpperCase()) : '👤';
      previewEl.textContent = initial;
    }
    if (removeBtn) removeBtn.style.display = 'none';
  };

  window.removeManualStudentPhoto = () => {
    window.vibrate(15);
    const dataEl = document.getElementById('m-manual-st-photo-data');
    const previewEl = document.getElementById('m-manual-st-avatar-preview');
    const removeBtn = document.getElementById('m-manual-st-photo-remove');

    if (dataEl) dataEl.value = '';
    if (previewEl) {
      previewEl.textContent = '👤';
    }
    if (removeBtn) removeBtn.style.display = 'none';
  };

  window.addMobileStudent = () => {
    const nameEl = document.getElementById('m-manual-st-name') || document.getElementById('m-cfg-st-name');
    const surEl = document.getElementById('m-manual-st-surname') || document.getElementById('m-cfg-st-surname');
    const noEl = document.getElementById('m-manual-st-no') || document.getElementById('m-cfg-st-no');
    const brEl = document.getElementById('m-manual-st-branch') || document.getElementById('m-cfg-st-branch');
    const genEl = document.getElementById('m-manual-st-gender') || document.getElementById('m-cfg-st-gender');
    const phEl = document.getElementById('m-manual-st-phone') || document.getElementById('m-cfg-st-phone');
    const photoDataEl = document.getElementById('m-manual-st-photo-data');
    const photoData = photoDataEl ? photoDataEl.value.trim() : '';

    const name = nameEl ? nameEl.value.trim() : '';
    if (!name) {
      showMobileToast('Lütfen öğrenci adını girin', 'warning');
      if (nameEl) nameEl.focus();
      return;
    }

    const isMiddle = isMiddleSchool();
    const branch = isMiddle ? ((brEl && brEl.value !== 'all') ? brEl.value : (activeBranch !== 'all' ? activeBranch : '5/A')) : '';

    const newStudent = {
      id: 'st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name,
      surname: surEl ? surEl.value.trim() : '',
      number: noEl ? noEl.value.trim() : '',
      branch: branch,
      schoolLevel: isMiddle ? 'middle' : 'primary',
      gender: genEl ? genEl.value : 'male',
      phone: phEl ? phEl.value.trim() : '',
      photo: photoData || undefined,
      scores: { total: 0 },
      points: 0,
      booksRead: 0
    };

    if (!window.stateManager.state.students) window.stateManager.state.students = [];
    window.stateManager.state.students.push(newStudent);
    window.stateManager.saveState();

    if (nameEl) nameEl.value = '';
    if (surEl) surEl.value = '';
    if (noEl) noEl.value = '';
    if (phEl) phEl.value = '';
    if (photoDataEl) photoDataEl.value = '';
    const manualPhotoPreview = document.getElementById('m-manual-st-avatar-preview');
    const manualPhotoRemove = document.getElementById('m-manual-st-photo-remove');
    if (manualPhotoPreview) manualPhotoPreview.textContent = '👤';
    if (manualPhotoRemove) manualPhotoRemove.style.display = 'none';

    window.vibrate(30);
    showMobileToast(`✅ ${name} ${newStudent.surname || ''} ${isMiddle ? `(${branch}) ` : ''}kaydedildi`, 'success');
    window.closeBottomSheet();
    renderConfigStudentsList();
    renderActiveTab();
  };

  window.editMobileStudent = (studentId) => {
    const student = (window.stateManager.state.students || []).find(s => s.id === studentId);
    if (!student) return;

    const idEl = document.getElementById('m-edit-st-id');
    const nameEl = document.getElementById('m-edit-st-name');
    const surEl = document.getElementById('m-edit-st-surname');
    const noEl = document.getElementById('m-edit-st-no');
    const brEl = document.getElementById('m-edit-st-branch');
    const genEl = document.getElementById('m-edit-st-gender');
    const phEl = document.getElementById('m-edit-st-phone');

    if (idEl) idEl.value = student.id;
    if (nameEl) nameEl.value = student.name || '';
    if (surEl) surEl.value = student.surname || '';
    if (noEl) noEl.value = student.number || '';
    if (brEl) {
      populateBranchOptions(brEl);
      brEl.value = student.branch || '5/A';
    }
    if (genEl) genEl.value = student.gender || 'male';
    if (phEl) phEl.value = student.phone || '';

    // Fotoğraf / Avatar alanını hazırla
    const photoDataEl = document.getElementById('m-edit-st-photo-data');
    const photoPreviewEl = document.getElementById('m-edit-st-avatar-preview');
    const photoRemoveBtn = document.getElementById('m-edit-st-photo-remove');

    if (photoDataEl) photoDataEl.value = student.photo || '';
    if (photoPreviewEl) {
      if (student.photo) {
        photoPreviewEl.innerHTML = `<img src="${student.photo}" style="width: 100%; height: 100%; object-fit: cover;">`;
      } else {
        const initial = student.name ? escapeHTML(student.name.charAt(0).toUpperCase()) : '👤';
        photoPreviewEl.textContent = initial;
      }
    }
    if (photoRemoveBtn) {
      photoRemoveBtn.style.display = student.photo ? 'flex' : 'none';
    }

    syncEducationLevelUI();
    window.openBottomSheet('modal-edit-student');
  };

  window.saveEditedStudent = () => {
    const idEl = document.getElementById('m-edit-st-id');
    const nameEl = document.getElementById('m-edit-st-name');
    const surEl = document.getElementById('m-edit-st-surname');
    const noEl = document.getElementById('m-edit-st-no');
    const brEl = document.getElementById('m-edit-st-branch');
    const genEl = document.getElementById('m-edit-st-gender');
    const phEl = document.getElementById('m-edit-st-phone');
    const photoDataEl = document.getElementById('m-edit-st-photo-data');

    const id = idEl ? idEl.value : null;
    const name = nameEl ? nameEl.value.trim() : '';
    if (!id || !name) {
      showMobileToast('Lütfen öğrenci adı girin');
      return;
    }

    const isMiddle = isMiddleSchool();
    const student = (window.stateManager.state.students || []).find(s => s.id === id);
    if (student) {
      student.name = name;
      student.surname = surEl ? surEl.value.trim() : '';
      student.number = noEl ? noEl.value.trim() : '';
      student.branch = isMiddle ? (brEl ? brEl.value : '5/A') : '';
      student.schoolLevel = isMiddle ? 'middle' : 'primary';
      student.gender = genEl ? genEl.value : 'male';
      student.phone = phEl ? phEl.value.trim() : '';

      const photoData = photoDataEl ? photoDataEl.value.trim() : '';
      if (photoData) {
        student.photo = photoData;
      } else {
        delete student.photo;
      }

      window.stateManager.saveState();
      window.vibrate(25);
      showMobileToast('✅ Öğrenci bilgileri güncellendi');
      window.closeBottomSheet();
      renderConfigStudentsList();
      renderActiveTab();
    }
  };

  window.deleteConfigStudent = (studentId) => {
    if (!confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) return;
    window.stateManager.state.students = (window.stateManager.state.students || []).filter(s => s.id !== studentId);
    window.stateManager.saveState();
    window.vibrate(20);
    showMobileToast('Öğrenci silindi');
    renderConfigStudentsList();
    renderActiveTab();
  };

  // ==========================================================================
  // YAPAY ZEKA (AI) İLE ÖĞRENCİ EKLEME & YÖNTEM SEÇİMİ
  // ==========================================================================
  window.openAddStudentMethodModal = () => {
    window.vibrate(20);
    openBottomSheet('modal-add-student-method');
  };

  window.selectAddStudentMethod = (method) => {
    window.vibrate(20);
    if (method === 'manual') {
      window.openManualAddStudentModal();
    } else if (method === 'ai') {
      window.triggerAiStudentScan();
    }
  };

  // Manuel Öğrenci Ekleme Modalı Açılışı (Kademeye göre alanlar yapılandırılır)
  window.openManualAddStudentModal = () => {
    window.vibrate(20);
    const isMiddle = isMiddleSchool();

    // Alanları temizle
    const nameEl = document.getElementById('m-manual-st-name') || document.getElementById('m-cfg-st-name');
    const surEl = document.getElementById('m-manual-st-surname') || document.getElementById('m-cfg-st-surname');
    const noEl = document.getElementById('m-manual-st-no') || document.getElementById('m-cfg-st-no');
    const brEl = document.getElementById('m-manual-st-branch') || document.getElementById('m-cfg-st-branch');
    const phEl = document.getElementById('m-manual-st-phone') || document.getElementById('m-cfg-st-phone');
    const genEl = document.getElementById('m-manual-st-gender') || document.getElementById('m-cfg-st-gender');

    if (nameEl) nameEl.value = '';
    if (surEl) surEl.value = '';
    if (noEl) noEl.value = '';
    if (phEl) phEl.value = '';
    if (genEl) genEl.value = 'male';

    const manualPhotoData = document.getElementById('m-manual-st-photo-data');
    const manualPhotoPreview = document.getElementById('m-manual-st-avatar-preview');
    const manualPhotoRemove = document.getElementById('m-manual-st-photo-remove');
    if (manualPhotoData) manualPhotoData.value = '';
    if (manualPhotoPreview) manualPhotoPreview.textContent = '👤';
    if (manualPhotoRemove) manualPhotoRemove.style.display = 'none';

    // Kademe Rozeti
    const badgeEl = document.getElementById('m-manual-st-level-badge');
    if (badgeEl) {
      badgeEl.textContent = isMiddle ? '🏫 Ortaokul Kademesi' : '🏫 İlkokul Kademesi';
    }

    // Şube alanı: İlkokulda gizli, Ortaokulda açık
    const branchGroup = document.getElementById('m-manual-st-branch-group') || document.getElementById('m-cfg-st-branch-group');
    const noBranchRow = document.getElementById('m-manual-st-no-branch-row') || document.getElementById('m-cfg-st-no-branch-row');

    if (branchGroup) {
      branchGroup.style.display = isMiddle ? 'block' : 'none';
    }
    if (noBranchRow) {
      noBranchRow.style.gridTemplateColumns = isMiddle ? '1fr 1fr' : '1fr';
    }

    if (isMiddle && brEl) {
      const branches = (window.stateManager && typeof window.stateManager.getBranches === 'function')
        ? window.stateManager.getBranches()
        : ['5/A', '5/B', '6/A', '6/B', '7/A', '7/B', '8/A', '8/B'];
      brEl.innerHTML = branches.map(b => `<option value="${b}">${b} Şubesi</option>`).join('');
      if (activeBranch && activeBranch !== 'all' && branches.includes(activeBranch)) {
        brEl.value = activeBranch;
      }
    }

    openBottomSheet('modal-add-student-manual');
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      if (noEl) noEl.focus();
      else if (nameEl) nameEl.focus();
    }, 150);
  };

  window.triggerAiStudentScan = () => {
    const apiKey = (localStorage.getItem('sinif_asistani_gemini_api_key') || '').trim();
    if (!apiKey) {
      window.closeBottomSheet();
      showMobileToast('⚠️ Yapay zeka ile liste taramak için lütfen önce Gemini API anahtarınızı kaydedin');
      if (activeMobileSubview !== 'config') {
        window.openMobileSubview('config');
      }
      window.switchConfigPanel('ai');
      return;
    }

    window.closeBottomSheet();
    const fileInput = document.getElementById('m-ai-student-file-input');
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  };

  function processImageFileForGemini(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const base64 = dataUrl.split(',')[1];
          resolve({ base64, mimeType: 'image/jpeg' });
        };
        img.onerror = () => reject(new Error('Görsel yüklenemedi'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Dosya okunamadı'));
      reader.readAsDataURL(file);
    });
  }

  async function analyzeStudentListWithGemini(base64Data, mimeType) {
    const apiKey = (localStorage.getItem('sinif_asistani_gemini_api_key') || '').trim();
    if (!apiKey) throw new Error('API anahtarı bulunamadı. Lütfen Ayarlar > Yapay Zeka menüsünden Gemini API anahtarınızı girin.');

    // 1. API anahtarının erişebildiği aktif modelleri ve desteklenen API sürümünü Google'dan doğrudan çek
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
        throw new Error('Google Cloud projenizde Generative Language API henüz etkin değil. Google AI Studio üzerinden yeni bir anahtar oluşturabilirsiniz.');
      }
      throw new Error(`Google API bağlantı hatası: ${listError || 'Modeller sorgulanamadı'}`);
    }

    // 2. generateContent destekleyen modelleri filtrele
    const supportedModels = listData.models.filter(m =>
      !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent')
    );

    if (supportedModels.length === 0) {
      throw new Error('Bu API anahtarının içerik üretme modellerine izni bulunmuyor.');
    }

    // Kullanıcının kayıtlı tercihini ve hızlı flash modellerini önceliklendir
    let savedModel = (localStorage.getItem('sinif_asistani_gemini_model') || 'gemini-1.5-flash').trim();
    if (savedModel === 'gemini-1.5-pro') {
      savedModel = 'gemini-1.5-flash';
    }

    const candidatePreferences = [
      savedModel,
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-latest',
      ...supportedModels.map(m => m.name.replace(/^models\//, ''))
    ];

    // Sadece Google'ın bu anahtar için izin verdiği geçerli modelleri listeye ekle
    const validCandidatePaths = [];
    for (const pref of candidatePreferences) {
      const match = supportedModels.find(sm => sm.name === pref || sm.name === `models/${pref}` || sm.name.endsWith(`/${pref}`));
      if (match && !validCandidatePaths.includes(match.name)) {
        validCandidatePaths.push(match.name);
      }
    }

    if (validCandidatePaths.length === 0) {
      validCandidatePaths.push(supportedModels[0].name);
    }

    const promptText = `Bu görsel bir okul sınıf listesidir. Görseldeki tüm öğrencileri satır satır tespit et.
Her öğrenci için okul numarasını, adını, soyadını ve cinsiyetini ('male' veya 'female') çıkar.
Ad ve soyad ayrılmış olmalıdır.
Eğer cinsiyet listede açıkça belirtilmemişse Türk isim yapısına göre tahmin et ('male' ya da 'female').
Numara yoksa boş bırak ("").

SADECE VE SADECE GEÇERLİ BİR JSON DİZİSİ DÖNDÜR. Markdown (örneğin \`\`\`json) veya başka hiçbir metin/açıklama ekleme:
[
  {"number": "101", "name": "Ahmet", "surname": "Yılmaz", "gender": "male"},
  {"number": "105", "name": "Zeynep", "surname": "Kaya", "gender": "female"}
]`;

    let lastError = null;

    for (const modelPath of validCandidatePaths) {
      const cleanPath = modelPath.startsWith('models/') ? modelPath : `models/${modelPath}`;
      const url = `https://generativelanguage.googleapis.com/${listData.version}/${cleanPath}:generateContent?key=${apiKey}`;

      try {
        let res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inline_data: {
                      mime_type: mimeType || 'image/jpeg',
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          })
        });

        // 400 hatası (responseMimeType desteklenmezse) formatsız tekrar dene
        if (res.status === 400) {
          res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: promptText },
                    {
                      inline_data: {
                        mime_type: mimeType || 'image/jpeg',
                        data: base64Data
                      }
                    }
                  ]
                }
              ],
              generationConfig: { temperature: 0.1 }
            })
          });
        }

        if (res.ok) {
          const data = await res.json();
          let rawText = '';
          const parts = data.candidates?.[0]?.content?.parts || [];
          for (const p of parts) {
            if (p.text) rawText += p.text;
          }
          if (!rawText && data.candidates?.[0]?.content?.parts?.[0]?.text) {
            rawText = data.candidates[0].content.parts[0].text;
          }

          // JSON dizisini regex ile ayıkla
          const jsonMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            rawText = jsonMatch[0];
          } else {
            rawText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          }

          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = new Error((errData.error && errData.error.message) || `HTTP ${res.status}`);
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Yapay zeka görseli okuyamadı');
  }

  window.handleAiStudentImageSelected = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    openBottomSheet('modal-ai-student-loading');

    try {
      const processed = await processImageFileForGemini(file);
      const students = await analyzeStudentListWithGemini(processed.base64, processed.mimeType);

      if (!students || students.length === 0) {
        window.closeBottomSheet();
        showMobileToast('❌ Listede öğrenci bulunamadı. Lütfen daha net bir fotoğraf çekin.');
        return;
      }

      const scanned = students.map((s, idx) => ({
        index: idx,
        number: String(s.number || s.no || '').trim(),
        name: String(s.name || s.ad || '').trim(),
        surname: String(s.surname || s.soyad || '').trim(),
        gender: (s.gender === 'female' || s.gender === 'kız' || s.gender === 'K') ? 'female' : 'male',
        selected: true
      })).filter(s => !!s.name);

      if (scanned.length === 0) {
        window.closeBottomSheet();
        showMobileToast('❌ Öğrenci isimleri okunamadı.');
        return;
      }

      window.tempAiScannedStudents = scanned;

      // 1. İLKOKUL KADEMESİ: Doğrudan hiçbir şey sormadan kaydet!
      if (!isMiddleSchool()) {
        if (!window.stateManager.state.students) window.stateManager.state.students = [];
        let addedCount = 0;
        scanned.forEach((st, idx) => {
          const newStudent = {
            id: 'st_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5),
            name: st.name,
            surname: st.surname || '',
            number: st.number || '',
            branch: '',
            schoolLevel: 'primary',
            gender: st.gender || 'male',
            phone: '',
            points: 0,
            booksRead: 0
          };
          window.stateManager.state.students.push(newStudent);
          addedCount++;
        });

        window.stateManager.saveState();
        window.closeBottomSheet();
        window.vibrate([40, 60, 40]);
        showMobileToast(`🎉 ${addedCount} öğrenci doğrudan sınıfa kaydedildi!`, 'success');

        if (activeMobileSubview !== 'config') {
          window.openMobileSubview('config');
        }
        window.switchConfigPanel('students');
        renderConfigStudentsList();
        renderActiveTab();
        return;
      }

      // 2. ORTAOKUL KADEMESİ: Öğretmene bu listeyi hangi şube için ekleyeceğini sor
      window.closeBottomSheet();
      window.openAiAskBranchModal();
    } catch (err) {
      window.closeBottomSheet();
      console.error('AI student scan error:', err);
      showMobileToast(`❌ Hata: ${err.message || 'Görsel işlenirken bir sorun oluştu'}`);
    }
  };

  function renderAiStudentPreviewModal() {
    const list = window.tempAiScannedStudents || [];
    const container = document.getElementById('m-ai-preview-list-container');
    const countBadge = document.getElementById('m-ai-preview-count');
    const branchSelect = document.getElementById('m-ai-preview-branch');
    const confirmBtnText = document.getElementById('m-ai-confirm-btn-text');
    const toggleSelectText = document.getElementById('m-ai-toggle-select-text');

    if (countBadge) countBadge.textContent = list.length;

    // Şube seçiciyi doldur
    if (branchSelect && branchSelect.options.length === 0) {
      const branches = window.stateManager && window.stateManager.getBranches ? window.stateManager.getBranches() : [];
      const opts = branches.length > 0 ? branches : ['A', 'B', 'C', 'D'];
      branchSelect.innerHTML = '';
      opts.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = `${b} Şubesi`;
        if (b === (activeBranch !== 'all' ? activeBranch : 'A')) opt.selected = true;
        branchSelect.appendChild(opt);
      });
    }

    const selectedCount = list.filter(s => s.selected).length;
    if (confirmBtnText) {
      confirmBtnText.textContent = `${selectedCount} Öğrenciyi Sınıfa Ekle`;
    }
    if (toggleSelectText) {
      toggleSelectText.textContent = (selectedCount === list.length) ? 'Tümünü Kaldır' : 'Tümünü Seç';
    }

    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="users" style="width: 32px; height: 32px; opacity: 0.5; margin-bottom: 0.5rem;"></i>
          <div style="font-weight: 700;">Listelenecek öğrenci kalmadı</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = list.map(st => `
      <div class="ai-preview-card ${st.selected ? '' : 'excluded'}" id="ai-row-${st.index}">
        <input type="checkbox" id="ai-check-${st.index}" ${st.selected ? 'checked' : ''} onchange="window.toggleAiRowCheck(${st.index})" style="width: 20px; height: 20px; accent-color: var(--m-primary); cursor: pointer; flex-shrink: 0;">
        <div class="ai-preview-inputs">
          <div class="ai-preview-row-top">
            <input type="text" id="ai-no-${st.index}" value="${escapeHTML(st.number)}" placeholder="No" class="m-form-input" onchange="window.updateAiRowField(${st.index}, 'number', this.value)" style="width: 60px; font-weight: 700; padding: 5px 6px; font-size: 0.8rem; text-align: center;">
            <input type="text" id="ai-name-${st.index}" value="${escapeHTML(st.name)}" placeholder="Ad" class="m-form-input" onchange="window.updateAiRowField(${st.index}, 'name', this.value)" style="flex: 1; font-weight: 700; padding: 5px 8px; font-size: 0.8rem;">
            <input type="text" id="ai-surname-${st.index}" value="${escapeHTML(st.surname)}" placeholder="Soyad" class="m-form-input" onchange="window.updateAiRowField(${st.index}, 'surname', this.value)" style="flex: 1; font-weight: 700; padding: 5px 8px; font-size: 0.8rem;">
          </div>
          <div class="ai-preview-row-bottom">
            <select id="ai-gender-${st.index}" class="m-form-select" onchange="window.updateAiRowField(${st.index}, 'gender', this.value)" style="padding: 4px 8px; font-size: 0.74rem; width: auto; font-weight: 700;">
              <option value="male" ${st.gender === 'male' ? 'selected' : ''}>👦 Erkek</option>
              <option value="female" ${st.gender === 'female' ? 'selected' : ''}>👧 Kız</option>
            </select>
            <button type="button" class="m-btn-sm danger" onclick="window.removeAiPreviewRow(${st.index})" style="padding: 4px 8px; font-size: 0.74rem; margin-left: auto; border: none; border-radius: var(--m-radius-sm);">
              <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  window.toggleAiRowCheck = (index) => {
    const list = window.tempAiScannedStudents || [];
    const item = list.find(s => s.index === index);
    if (!item) return;

    item.selected = !item.selected;
    const rowEl = document.getElementById(`ai-row-${index}`);
    if (rowEl) {
      rowEl.classList.toggle('excluded', !item.selected);
    }

    const selectedCount = list.filter(s => s.selected).length;
    const confirmBtnText = document.getElementById('m-ai-confirm-btn-text');
    const toggleSelectText = document.getElementById('m-ai-toggle-select-text');
    if (confirmBtnText) confirmBtnText.textContent = `${selectedCount} Öğrenciyi Sınıfa Ekle`;
    if (toggleSelectText) {
      toggleSelectText.textContent = (selectedCount === list.length) ? 'Tümünü Kaldır' : 'Tümünü Seç';
    }
  };

  window.updateAiRowField = (index, field, value) => {
    const list = window.tempAiScannedStudents || [];
    const item = list.find(s => s.index === index);
    if (item) {
      item[field] = value.trim();
    }
  };

  window.toggleSelectAllAiStudents = () => {
    const list = window.tempAiScannedStudents || [];
    const allSelected = list.every(s => s.selected);
    list.forEach(s => { s.selected = !allSelected; });
    renderAiStudentPreviewModal();
  };

  window.removeAiPreviewRow = (index) => {
    window.vibrate(15);
    window.tempAiScannedStudents = (window.tempAiScannedStudents || []).filter(s => s.index !== index);
    renderAiStudentPreviewModal();
  };

  // --------------------------------------------------------------------------
  // ORTAOKUL İÇİN AI ŞUBE SORMA İŞLEMLERİ
  // --------------------------------------------------------------------------
  window.openAiAskBranchModal = () => {
    const list = window.tempAiScannedStudents || [];
    const countEl = document.getElementById('m-ai-branch-student-count');
    const inputEl = document.getElementById('m-ai-branch-input-field');
    const chipsContainer = document.getElementById('m-ai-branch-quick-chips');

    if (countEl) countEl.textContent = list.length;
    
    // Varsayılan şube: Aktif şube veya ilk şube
    const defaultBranch = (activeBranch && activeBranch !== 'all') ? activeBranch : '5/A';
    if (inputEl) inputEl.value = defaultBranch;

    // Hızlı seçim çipleri
    if (chipsContainer) {
      const branches = (window.stateManager && typeof window.stateManager.getBranches === 'function')
        ? window.stateManager.getBranches()
        : ['5/A', '5/B', '6/A', '6/B', '7/A', '7/B', '8/A', '8/B'];
      
      chipsContainer.innerHTML = branches.map(b => `
        <button type="button" class="m-sched-day-chip ${b === defaultBranch ? 'active' : ''}" style="padding: 5px 12px; font-size: 0.8rem; border-radius: 999px; cursor: pointer;" onclick="window.selectAiBranchChip('${b}')">
          ${b}
        </button>
      `).join('');
    }

    openBottomSheet('modal-ai-ask-branch');
    if (window.lucide) window.lucide.createIcons();
  };

  window.selectAiBranchChip = (branchName) => {
    const inputEl = document.getElementById('m-ai-branch-input-field');
    if (inputEl) inputEl.value = branchName;
    document.querySelectorAll('#m-ai-branch-quick-chips .m-sched-day-chip').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.trim() === branchName);
    });
    window.vibrate(10);
  };

  window.confirmSaveAiStudentsWithBranch = () => {
    const inputEl = document.getElementById('m-ai-branch-input-field');
    let targetBranch = inputEl ? inputEl.value.trim().toUpperCase() : '';
    if (!targetBranch) {
      showMobileToast('Lütfen eklenecek şubeyi belirtin (Örn: 5/A)', 'warning');
      if (inputEl) inputEl.focus();
      return;
    }

    const list = (window.tempAiScannedStudents || []).filter(s => s.selected !== false);
    if (list.length === 0) {
      showMobileToast('Eklenecek öğrenci bulunamadı!', 'danger');
      return;
    }

    if (!window.stateManager.state.students) window.stateManager.state.students = [];
    let addedCount = 0;
    list.forEach((st, idx) => {
      if (!st.name) return;
      const newStudent = {
        id: 'st_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5),
        name: st.name,
        surname: st.surname || '',
        number: st.number || '',
        branch: targetBranch,
        schoolLevel: 'middle',
        gender: st.gender || 'male',
        phone: '',
        points: 0,
        booksRead: 0
      };
      window.stateManager.state.students.push(newStudent);
      addedCount++;
    });

    window.stateManager.saveState();
    window.closeBottomSheet();
    window.vibrate([40, 60, 40]);
    showMobileToast(`🎉 ${addedCount} öğrenci ${targetBranch} şubesine kaydedildi!`, 'success');

    activeBranch = targetBranch;
    const branchSelect = document.getElementById('m-branch-select');
    if (branchSelect) {
      populateBranchOptions(branchSelect);
      branchSelect.value = targetBranch;
    }
    const badge = document.getElementById('appbar-branch-text');
    if (badge) badge.textContent = `${targetBranch} Şubesi`;

    if (activeMobileSubview !== 'config') {
      window.openMobileSubview('config');
    }
    window.switchConfigPanel('students');
    renderConfigStudentsList();
    renderActiveTab();
  };

  window.openAiPreviewFromBranchModal = () => {
    const inputEl = document.getElementById('m-ai-branch-input-field');
    const targetBranch = inputEl ? inputEl.value.trim().toUpperCase() : '5/A';
    renderAiStudentPreviewModal();
    const branchSelect = document.getElementById('m-ai-preview-branch');
    if (branchSelect) {
      let opt = Array.from(branchSelect.options).find(o => o.value === targetBranch);
      if (!opt) {
        opt = document.createElement('option');
        opt.value = targetBranch;
        opt.textContent = `${targetBranch} Şubesi`;
        branchSelect.appendChild(opt);
      }
      branchSelect.value = targetBranch;
    }
    openBottomSheet('modal-ai-student-preview');
  };

  window.confirmSaveAiStudents = () => {
    const list = (window.tempAiScannedStudents || []).filter(s => s.selected);
    if (list.length === 0) {
      showMobileToast('Lütfen eklenecek en az bir öğrenci seçin');
      return;
    }

    const isMiddle = isMiddleSchool();
    const branchSelect = document.getElementById('m-ai-preview-branch');
    const targetBranch = isMiddle ? (branchSelect ? branchSelect.value : (activeBranch !== 'all' ? activeBranch : '5/A')) : '';

    if (!window.stateManager.state.students) window.stateManager.state.students = [];

    let addedCount = 0;
    list.forEach((st, idx) => {
      if (!st.name) return;
      const newStudent = {
        id: 'st_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5),
        name: st.name,
        surname: st.surname || '',
        number: st.number || '',
        branch: targetBranch,
        schoolLevel: isMiddle ? 'middle' : 'primary',
        gender: st.gender || 'male',
        phone: '',
        points: 0,
        booksRead: 0
      };
      window.stateManager.state.students.push(newStudent);
      addedCount++;
    });

    window.stateManager.saveState();
    window.closeBottomSheet();
    window.vibrate(40);
    showMobileToast(`🎉 ${addedCount} öğrenci başarıyla ${targetBranch ? targetBranch + ' şubesine ' : ''}eklendi!`);

    if (activeMobileSubview !== 'config') {
      window.openMobileSubview('config');
    }
    window.switchConfigPanel('students');
    renderConfigStudentsList();
    renderActiveTab();
  };

  // --- PIN GÜVENLİK ---
  function checkMobilePinStatus() {
    const statusEl = document.getElementById('m-cfg-pin-status');
    const pin = localStorage.getItem('sinif_asistani_app_pin');
    if (!statusEl) return;
    if (pin && pin.length >= 4) {
      statusEl.innerHTML = `<span style="background: var(--m-danger); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: 700;">🔒 Şifreli Giriş Aktif</span>`;
    } else {
      statusEl.innerHTML = `<span style="background: var(--m-text-muted); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: 700;">🔓 Kilit Devre Dışı</span>`;
    }
  }

  window.saveMobilePin = () => {
    const pin = document.getElementById('m-cfg-pin-code');
    if (!pin || pin.value.length < 4) {
      showMobileToast('Lütfen 4 haneli PIN girin');
      return;
    }
    localStorage.setItem('sinif_asistani_app_pin', pin.value);
    window.vibrate(30);
    showMobileToast('✅ PIN kodu belirlendi');
    checkMobilePinStatus();
  };

  window.removeMobilePin = () => {
    localStorage.removeItem('sinif_asistani_app_pin');
    const pin = document.getElementById('m-cfg-pin-code');
    if (pin) pin.value = '';
    window.vibrate(20);
    showMobileToast('Kilit kaldırıldı');
    checkMobilePinStatus();
  };

  // --- KULLANIM KILAVUZU AKORDEON ---
  window.toggleMobileManualAccordion = (itemEl) => {
    if (!itemEl) return;
    window.vibrate(10);
    const wasActive = itemEl.classList.contains('active');
    document.querySelectorAll('.m-accordion-item').forEach(el => el.classList.remove('active'));
    if (!wasActive) {
      itemEl.classList.add('active');
    }
  };

  // --- ŞİFRE GÖSTER / GİZLE ---
  window.togglePasswordVisibility = (inputId) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = (input.type === 'password') ? 'text' : 'password';
  };

  // --- GENEL AYARLARI KAYDETME ---
  window.saveMobileGeneralConfig = () => {
    const lvl = document.getElementById('m-cfg-level');
    const branchName = document.getElementById('m-cfg-branch-name');

    if (window.stateManager) {
      if (lvl) {
        if (typeof window.stateManager.setEducationLevel === 'function') {
          window.stateManager.setEducationLevel(lvl.value);
        } else {
          window.stateManager.state.educationLevel = lvl.value;
          window.stateManager.state.gradeLevel = lvl.value;
        }
      }
      if (branchName) {
        window.stateManager.state.branchName = branchName.value.trim();
      }
      window.stateManager.saveState();
    }

    syncEducationLevelUI();
    renderConfigStudentsList();
    renderActiveTab();

    window.vibrate(30);
    const isMiddle = isMiddleSchool();
    showMobileToast(isMiddle ? '✅ Ortaokul modu kaydedildi (Şubeler aktif)' : '✅ İlkokul modu kaydedildi (Şube özelliği kaldırıldı)');
  };

  window.saveMobileAIConfig = () => {
    const aiKey = document.getElementById('m-cfg-ai-key');
    const aiModel = document.getElementById('m-cfg-ai-model');
    if (aiKey) {
      localStorage.setItem('sinif_asistani_gemini_api_key', aiKey.value.trim());
    }
    if (aiModel) {
      localStorage.setItem('sinif_asistani_gemini_model', aiModel.value);
    }
    window.vibrate(30);
    showMobileToast('✅ Yapay Zeka ayarları kaydedildi');
  };

  window.testMobileAIKey = async () => {
    const keyInput = document.getElementById('m-cfg-ai-key');
    const key = (keyInput && keyInput.value.trim()) || localStorage.getItem('sinif_asistani_gemini_api_key');
    if (!key) {
      showMobileToast('Lütfen önce API anahtarı girin');
      return;
    }
    showMobileToast('🔄 Bağlantı test ediliyor...');
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (res.ok) {
        window.vibrate(40);
        playSynthChime('correct');
        showMobileToast('✅ Google Gemini bağlantısı başarılı!');
      } else {
        window.vibrate(100);
        showMobileToast('❌ Bağlantı başarısız: Anahtar geçersiz');
      }
    } catch (e) {
      showMobileToast('❌ Ağ hatası: İnternet bağlantınızı kontrol edin');
    }
  };

  // ==========================================================================
  // 8. HAFTALIK DEĞERLENDİRME MODÜLÜ (SINAV EKLEME & NOT GİRİŞİ)
  // ==========================================================================
  let weeklyFilterMode = 'week';
  let currentWeeklyTargetWeek = null;
  window.activeWeeklyExam = null;

  function getWeeklySelectedWeek() {
    if (!currentWeeklyTargetWeek) {
      currentWeeklyTargetWeek = (window.stateManager && typeof window.stateManager.getSelectedWeek === 'function')
        ? window.stateManager.getSelectedWeek()
        : (window.getISOWeek ? window.getISOWeek() : '2026-W39');
    }
    return currentWeeklyTargetWeek;
  }

  window.resetWeeklyToActiveConfigWeek = () => {
    window.vibrate(15);
    currentWeeklyTargetWeek = (window.stateManager && typeof window.stateManager.getSelectedWeek === 'function')
      ? window.stateManager.getSelectedWeek()
      : (window.getISOWeek ? window.getISOWeek() : '2026-W39');
    renderMobileWeekly();
    const info = typeof window.getEducationWeekInfo === 'function' ? window.getEducationWeekInfo(currentWeeklyTargetWeek) : null;
    const label = info ? info.shortLabel : currentWeeklyTargetWeek;
    showMobileToast(`📅 Ayarlardaki geçerli haftaya dönüldü: ${label}`);
  };

  window.changeWeeklyOffset = (delta) => {
    window.vibrate(15);
    const cur = getWeeklySelectedWeek();
    if (window.stateManager && typeof window.stateManager.addWeeks === 'function') {
      currentWeeklyTargetWeek = window.stateManager.addWeeks(cur, delta);
    } else {
      const parts = cur.split('-W');
      if (parts.length === 2) {
        const y = parseInt(parts[0]);
        let w = parseInt(parts[1]) + delta;
        if (w < 1) w = 1;
        if (w > 52) w = 52;
        currentWeeklyTargetWeek = `${y}-W${String(w).padStart(2, '0')}`;
      }
    }
    renderMobileWeekly();
  };

  window.setWeeklyFilter = (mode) => {
    weeklyFilterMode = mode;
    window.vibrate(15);
    const tabs = document.querySelectorAll('#m-weekly-filter-tabs .m-std-tab-btn');
    tabs.forEach(btn => {
      if (btn.dataset.filter === mode) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    renderMobileWeekly();
  };

  function renderMobileWeekly() {
    const container = document.getElementById('m-weekly-list-container');
    const weekLabel = document.getElementById('m-weekly-week-label');
    const weekSub = document.getElementById('m-weekly-week-sub');
    if (!container) return;

    const curWeek = getWeeklySelectedWeek();
    const appConfigWeek = (window.stateManager && typeof window.stateManager.getSelectedWeek === 'function')
      ? window.stateManager.getSelectedWeek()
      : (window.getISOWeek ? window.getISOWeek() : '');
    const isAppCurrent = (curWeek === appConfigWeek);

    const info = typeof window.getEducationWeekInfo === 'function' ? window.getEducationWeekInfo(curWeek) : null;
    const formattedWeek = info ? info.label : (window.formatWeekTR ? window.formatWeekTR(curWeek, 'full') : curWeek);

    if (weekLabel) {
      weekLabel.textContent = formattedWeek;
    }
    if (weekSub) {
      if (isAppCurrent) {
        weekSub.innerHTML = `🟢 <strong style="color: var(--m-primary);">Geçerli Çalışma Haftası</strong>${info ? ` • ${info.academicYear}` : ''}`;
      } else {
        weekSub.textContent = `${info ? `${info.academicYear} • ` : ''}Haftalık Sınavlar`;
      }
    }

    const state = (window.stateManager && window.stateManager.loadState)
      ? window.stateManager.loadState()
      : (window.stateManager ? window.stateManager.state : {});
    const allExams = state.weeklyEvaluations || [];
    const settings = (window.stateManager && window.stateManager.getWeeklyExamSettings)
      ? window.stateManager.getWeeklyExamSettings()
      : { topCount: 3, rankPoints: { 1: 10, 2: 7, 3: 4 } };

    // Filtreleme
    let displayedExams = [];
    if (weeklyFilterMode === 'week') {
      displayedExams = allExams.filter(e => e.weekId === curWeek);
    } else {
      displayedExams = [...allExams];
    }

    displayedExams.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (displayedExams.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 2.5rem 1rem; text-align: center; background: var(--m-surface); border: 1px dashed var(--m-border); border-radius: var(--m-radius-lg);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📋</div>
          <div style="font-weight: 800; font-size: 1rem; color: var(--m-text); margin-bottom: 0.35rem;">
            ${weeklyFilterMode === 'week' ? 'Bu Hafta Tanımlanmış Sınav Yok' : 'Henüz Sınav Eklenmedi'}
          </div>
          <p style="font-size: 0.78rem; color: var(--m-text-muted); max-width: 280px; margin: 0 auto 1.25rem auto;">
            Haftalık değerlendirme ekleyerek öğrenci netlerini hesaplayabilir ve dereceye girenleri otomatik puanlayabilirsiniz.
          </p>
          <button type="button" class="subview-primary-action-btn" onclick="window.openAddWeeklyExamModal()" style="max-width: 240px; margin: 0 auto;">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Sınav Oluştur
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = displayedExams.map(exam => {
      // Sınav ortalama puanı ve ilk 3 öğrencisi
      const scores = [];
      const examScores = exam.examScores || {};
      for (const stdId in examScores) {
        const sc = examScores[stdId];
        if (sc !== undefined && sc !== null && sc !== '') {
          scores.push({ studentId: stdId, score: parseFloat(sc) });
        }
      }

      const avgScore = scores.length > 0
        ? (scores.reduce((sum, item) => sum + item.score, 0) / scores.length).toFixed(1)
        : null;

      scores.sort((a, b) => b.score - a.score);
      const topThree = scores.slice(0, 3);

      let topStudentsHtml = '';
      if (topThree.length === 0) {
        topStudentsHtml = `
          <div style="text-align: center; color: var(--m-text-muted); font-size: 0.74rem; padding: 4px 0;">
            Henüz not girişi yapılmamış • Not girmek için dokunun
          </div>
        `;
      } else {
        topStudentsHtml = topThree.map((item, idx) => {
          const student = getStudentByIdSafe(item.studentId);
          const name = student ? `${student.name} ${student.surname || ''}` : 'Öğrenci';
          const medals = ['🥇 1.', '🥈 2.', '🥉 3.'];
          const rankPoint = (settings.rankPoints && settings.rankPoints[idx + 1]) || 0;
          return `
            <div class="m-weekly-top-row">
              <span class="m-weekly-top-student">
                <span>${medals[idx]}</span>
                <span>${escapeHTML(name)}</span>
              </span>
              <span class="m-weekly-top-score">
                ${item.score} Puan ${rankPoint > 0 ? `<span style="font-size: 0.68rem; color: var(--m-success); font-weight: 700;">(+${rankPoint})</span>` : ''}
              </span>
            </div>
          `;
        }).join('');
      }

      const eInfo = typeof window.getEducationWeekInfo === 'function' ? window.getEducationWeekInfo(exam.weekId) : null;
      const eWeekLabel = eInfo ? eInfo.shortLabel : (window.formatWeekTR ? window.formatWeekTR(exam.weekId, 'short') : ((exam.weekId || '').split('-W')[1] ? `${(exam.weekId || '').split('-W')[1]}. Hafta` : exam.weekId));
      const penaltyText = exam.wrongAffects ? `${exam.penaltyRate || 3} Yanlış 1 Doğruyu Götürür` : 'Yanlışlar Etkilemez';

      return `
        <div class="m-weekly-card" onclick="window.openWeeklyGradingModal('${exam.id}')">
          <div class="m-weekly-card-header">
            <div style="flex: 1; min-width: 0;">
              <div class="m-weekly-card-title">${escapeHTML(exam.examName || 'Değerlendirme Sınavı')}</div>
              <div class="m-weekly-card-meta">
                <span class="m-weekly-meta-chip">📅 ${eWeekLabel}</span>
                <span class="m-weekly-meta-chip">❓ ${exam.totalQuestions} Soru</span>
                <span class="m-weekly-meta-chip">⏱️ ${exam.duration} Dk</span>
                <span class="m-weekly-meta-chip">⚖️ ${penaltyText}</span>
                ${exam.branch ? `<span class="m-weekly-meta-chip" style="background: rgba(79, 70, 229, 0.1); color: var(--m-primary);">🏷️ ${escapeHTML(exam.branch)}</span>` : ''}
              </div>
            </div>
            <div class="student-card-score" style="font-size: 0.84rem; flex-shrink: 0; background: ${avgScore !== null ? 'var(--m-primary-light)' : 'var(--m-bg)'}; color: ${avgScore !== null ? 'var(--m-primary)' : 'var(--m-text-muted)'};">
              ${avgScore !== null ? `Ort: ${avgScore}` : 'Not Yok'}
            </div>
          </div>

          <!-- İlk 3 Öğrenci (Kürsü) -->
          <div class="m-weekly-top-podium">
            ${topStudentsHtml}
          </div>

          <div class="m-weekly-card-actions" onclick="event.stopPropagation()">
            <button type="button" class="m-btn-sm primary" onclick="window.openMobileOmrScanner('${exam.id}')" style="padding: 5px 8px; font-weight: 700; display: flex; align-items: center; gap: 4px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff;" title="Kamera ile Optik Okuyucu">
              <i data-lucide="scan" style="width: 14px; height: 14px;"></i> Optik Oku
            </button>
            <button type="button" class="m-btn-sm" onclick="window.openManualOpticalEntryModal('${exam.id}')" style="padding: 5px 8px; font-weight: 700; display: flex; align-items: center; gap: 4px; background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);" title="Manuel Optik Girişi">
              <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i> Manuel Gir
            </button>
            <button type="button" class="m-btn-sm" onclick="window.openMobileOpticalPrintModal('${exam.id}')" style="padding: 5px 8px; display: flex; align-items: center; gap: 4px; background: var(--m-surface-subtle); border: 1px solid var(--m-border);" title="Optik Form Yazdır">
              <i data-lucide="printer" style="width: 14px; height: 14px;"></i> Form Bas
            </button>
            <button type="button" class="m-btn-sm danger" onclick="window.deleteWeeklyExam('${exam.id}')" style="padding: 5px 8px; display: flex; align-items: center; gap: 4px;" title="Sınavı Sil">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================
  // SINAV EKLEME SİHİRBAZI MODALI (OPTİK FORM VE CEVAP ANAHTARI ENTEGRE)
  // ==========================================
  window._tempCreateExamKey = {};

  window.openAddWeeklyExamModal = () => {
    window.vibrate(20);
    const form = document.getElementById('m-form-add-weekly-exam');
    if (form) form.reset();

    const nameInput = document.getElementById('m-we-name-input');
    const weekSelect = document.getElementById('m-we-week-select');
    const branchGroup = document.getElementById('m-we-branch-group');
    const branchSelect = document.getElementById('m-we-branch-select');
    const penaltyCont = document.getElementById('m-we-penalty-container');
    const wrongToggle = document.getElementById('m-we-wrong-affects-toggle');
    const opticalToggle = document.getElementById('m-we-has-optical-toggle');
    const opticalCont = document.getElementById('m-we-optical-config-container');

    if (nameInput) nameInput.value = '';
    if (penaltyCont) penaltyCont.style.display = 'none';
    if (wrongToggle) wrongToggle.checked = false;

    // Optik form onay kutusunu ve cevap anahtarını hazırla
    window._tempCreateExamKey = {};
    if (opticalToggle) opticalToggle.checked = true;
    if (opticalCont) opticalCont.style.display = 'block';
    window.selectExamChoicesCount(4);

    // Uygulamanın ayarlar menüsünde seçilmiş olan geçerli hafta (Ders yılı / Eğitim Haftası)
    const activeSettingWeek = (window.stateManager && typeof window.stateManager.getSelectedWeek === 'function')
      ? window.stateManager.getSelectedWeek()
      : (window.getISOWeek ? window.getISOWeek() : '2026-W39');

    // Hafta Seçenekleri
    if (weekSelect) {
      weekSelect.innerHTML = '';
      const currInfo = typeof window.getEducationWeekInfo === 'function' ? window.getEducationWeekInfo(activeSettingWeek) : null;
      const startYear = currInfo ? parseInt(currInfo.academicYear.split('-')[0], 10) : (new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear() - 1);
      const opening = typeof window.getSchoolOpeningMonday === 'function' ? window.getSchoolOpeningMonday(startYear) : new Date(startYear, 8, 15);

      for (let k = 1; k <= 40; k++) {
        const d = new Date(opening.getTime() + (k - 1) * 7 * 24 * 60 * 60 * 1000);
        const iso = typeof window.getISOWeek === 'function' ? window.getISOWeek(d) : `W${k}`;
        const inf = typeof window.getEducationWeekInfo === 'function' ? window.getEducationWeekInfo(iso) : null;

        const opt = document.createElement('option');
        opt.value = iso;
        const isCurrent = (iso === activeSettingWeek);
        opt.textContent = inf ? `${inf.label}${isCurrent ? ' ★ (Geçerli Hafta)' : ''}` : `${k}. Hafta${isCurrent ? ' ★ (Geçerli Hafta)' : ''}`;
        if (isCurrent) opt.selected = true;
        weekSelect.appendChild(opt);
      }

      if (activeSettingWeek && !Array.from(weekSelect.options).some(o => o.value === activeSettingWeek)) {
        const opt = document.createElement('option');
        opt.value = activeSettingWeek;
        const fallbackText = typeof window.formatWeekTR === 'function' ? window.formatWeekTR(activeSettingWeek, 'full') : activeSettingWeek;
        opt.textContent = `${fallbackText} ★ (Geçerli Hafta)`;
        opt.selected = true;
        weekSelect.insertBefore(opt, weekSelect.firstChild);
      }

      weekSelect.value = activeSettingWeek;

      if (nameInput && currInfo && currInfo.shortLabel) {
        nameInput.placeholder = `Örn: ${currInfo.shortLabel} Kazanım Değerlendirme Sınavı`;
      }
    }

    // Şube Seçenekleri (Ortaokul ise)
    const state = (window.stateManager && window.stateManager.loadState)
      ? window.stateManager.loadState()
      : (window.stateManager ? window.stateManager.state : {});
    const isMiddle = isMiddleSchool();

    if (branchGroup && branchSelect) {
      if (isMiddle) {
        branchGroup.style.display = 'block';
        branchSelect.innerHTML = '';
        const branches = [...new Set((state.students || []).map(s => s.branch).filter(Boolean))].sort();
        if (branches.length === 0) {
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'Tüm Sınıf';
          branchSelect.appendChild(opt);
        } else {
          branches.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = `${b} Şubesi`;
            branchSelect.appendChild(opt);
          });
        }
      } else {
        branchGroup.style.display = 'none';
      }
    }

    // Soru sayısına göre optik form satırlarını render et
    window.renderCreateExamAnswerKeyForm();

    const modal = document.getElementById('modal-add-weekly-exam');
    const backdrop = document.getElementById('sheet-backdrop');
    if (modal && backdrop) {
      backdrop.classList.add('active');
      modal.classList.add('active');
    }
    if (window.lucide) window.lucide.createIcons();
  };

  window.toggleWeeklyExamPenalty = (isChecked) => {
    const penaltyCont = document.getElementById('m-we-penalty-container');
    if (penaltyCont) {
      penaltyCont.style.display = isChecked ? 'block' : 'none';
    }
  };

  window.toggleWeeklyExamOpticalSection = (isChecked) => {
    const cont = document.getElementById('m-we-optical-config-container');
    if (cont) {
      cont.style.display = isChecked ? 'block' : 'none';
    }
    if (isChecked) {
      window.renderCreateExamAnswerKeyForm();
    }
  };

  window.selectExamChoicesCount = (count) => {
    const hiddenInput = document.getElementById('m-we-choices-count');
    if (hiddenInput) hiddenInput.value = count;
    [3, 4, 5].forEach(c => {
      const pill = document.getElementById(`m-pill-opt-${c}`);
      if (pill) {
        if (c === count) pill.classList.add('active');
        else pill.classList.remove('active');
      }
    });
    window.renderCreateExamAnswerKeyForm();
  };

  window.renderCreateExamAnswerKeyForm = () => {
    const qInput = document.getElementById('m-we-questions-input');
    const cInput = document.getElementById('m-we-choices-count');
    const grid = document.getElementById('m-we-optical-form-grid');
    const counter = document.getElementById('m-we-opt-counter');
    if (!grid) return;

    const totalQ = Math.max(1, Math.min(100, parseInt(qInput ? qInput.value : 20, 10) || 20));
    const choicesCount = parseInt(cInput ? cInput.value : 4, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);

    let html = '';
    let markedCount = 0;

    for (let q = 1; q <= totalQ; q++) {
      const sel = window._tempCreateExamKey ? window._tempCreateExamKey[q] || '' : '';
      if (sel && letters.includes(sel)) markedCount++;
      else if (sel && !letters.includes(sel) && window._tempCreateExamKey) delete window._tempCreateExamKey[q];

      html += `
        <div class="m-opt-bubble-row" data-q="${q}">
          <span class="m-opt-bubble-qnum">${q}.</span>
          <div class="m-opt-bubbles-wrap">
            ${letters.map(l => `
              <button type="button" class="m-opt-bubble-btn ${sel === l ? 'active' : ''}" onclick="window.selectCreateExamAnswerKeyChoice(${q}, '${l}')">
                ${l}
              </button>
            `).join('')}
            <button type="button" class="m-opt-clear-btn ${sel ? 'visible' : ''}" id="m-we-clear-${q}" title="Boş Bırak" onclick="window.clearCreateExamKeyChoice(${q})">
              &times;
            </button>
          </div>
        </div>
      `;
    }

    grid.innerHTML = html;
    if (counter) counter.textContent = `${markedCount} / ${totalQ} Soru İşaretlendi`;
  };

  window.selectCreateExamAnswerKeyChoice = (q, opt) => {
    if (window.vibrate) window.vibrate(10);
    if (!window._tempCreateExamKey) window._tempCreateExamKey = {};

    if (window._tempCreateExamKey[q] === opt) {
      delete window._tempCreateExamKey[q];
    } else {
      window._tempCreateExamKey[q] = opt;
    }

    const row = document.querySelector(`#m-we-optical-form-grid .m-opt-bubble-row[data-q="${q}"]`);
    if (row) {
      const currentSel = window._tempCreateExamKey[q] || '';
      row.querySelectorAll('.m-opt-bubble-btn').forEach(btn => {
        if (btn.textContent.trim() === currentSel) btn.classList.add('active');
        else btn.classList.remove('active');
      });
      const clr = document.getElementById(`m-we-clear-${q}`);
      if (clr) clr.className = `m-opt-clear-btn ${currentSel ? 'visible' : ''}`;
    }

    const qInput = document.getElementById('m-we-questions-input');
    const totalQ = parseInt(qInput ? qInput.value : 20, 10) || 20;
    const marked = Object.keys(window._tempCreateExamKey || {}).length;
    const counter = document.getElementById('m-we-opt-counter');
    if (counter) counter.textContent = `${marked} / ${totalQ} Soru İşaretlendi`;
  };

  window.clearCreateExamKeyChoice = (q) => {
    if (window.vibrate) window.vibrate(10);
    if (window._tempCreateExamKey) delete window._tempCreateExamKey[q];
    const row = document.querySelector(`#m-we-optical-form-grid .m-opt-bubble-row[data-q="${q}"]`);
    if (row) {
      row.querySelectorAll('.m-opt-bubble-btn').forEach(b => b.classList.remove('active'));
      const clr = document.getElementById(`m-we-clear-${q}`);
      if (clr) clr.className = 'm-opt-clear-btn';
    }
    const qInput = document.getElementById('m-we-questions-input');
    const totalQ = parseInt(qInput ? qInput.value : 20, 10) || 20;
    const marked = Object.keys(window._tempCreateExamKey || {}).length;
    const counter = document.getElementById('m-we-opt-counter');
    if (counter) counter.textContent = `${marked} / ${totalQ} Soru İşaretlendi`;
  };

  window.fillSampleCreateExamKey = () => {
    const qInput = document.getElementById('m-we-questions-input');
    const cInput = document.getElementById('m-we-choices-count');
    const totalQ = parseInt(qInput ? qInput.value : 20, 10) || 20;
    const choicesCount = parseInt(cInput ? cInput.value : 4, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);

    window._tempCreateExamKey = {};
    for (let q = 1; q <= totalQ; q++) {
      window._tempCreateExamKey[q] = letters[(q - 1) % letters.length];
    }
    window.renderCreateExamAnswerKeyForm();
    if (window.showMobileToast) window.showMobileToast('Örnek cevap anahtarı dolduruldu.');
  };

  window.clearCreateExamKey = () => {
    window._tempCreateExamKey = {};
    window.renderCreateExamAnswerKeyForm();
  };

  window.handleCreateWeeklyExam = (event) => {
    event.preventDefault();
    if (!window.stateManager) return;

    const name = document.getElementById('m-we-name-input').value.trim();
    const week = document.getElementById('m-we-week-select').value;
    const questions = parseInt(document.getElementById('m-we-questions-input').value) || 20;
    const duration = parseInt(document.getElementById('m-we-duration-input').value) || 40;
    const wrongAffects = document.getElementById('m-we-wrong-affects-toggle').checked;
    const penaltyRate = wrongAffects ? (parseInt(document.getElementById('m-we-penalty-select').value) || 3) : 0;

    const isMiddle = isMiddleSchool();
    const branchSelect = document.getElementById('m-we-branch-select');
    const branch = (isMiddle && branchSelect) ? branchSelect.value : '';

    // Optik form onay kutusu ve cevap anahtarı
    const opticalToggle = document.getElementById('m-we-has-optical-toggle');
    const hasOptical = opticalToggle ? opticalToggle.checked : true;
    const choicesCount = parseInt(document.getElementById('m-we-choices-count').value, 10) || 4;
    const answerKey = hasOptical ? { ...(window._tempCreateExamKey || {}) } : {};

    const examData = {
      id: 'exam_' + Date.now(),
      weekId: week,
      examName: name,
      totalQuestions: questions,
      duration: duration,
      wrongAffects: wrongAffects,
      penaltyRate: penaltyRate,
      branch: branch,
      hasOpticalForm: hasOptical,
      choicesCount: choicesCount,
      answerKey: answerKey,
      examScores: {},
      studentResults: {},
      notes: '',
      date: (typeof window.formatLocalDate === 'function') ? window.formatLocalDate() : new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    window.stateManager.saveExam(examData);
    window.vibrate(30);
    showMobileToast(`"${name}" değerlendirme sınavı oluşturuldu!`);

    // Sınav ekleme modalını kapat
    const addModal = document.getElementById('modal-add-weekly-exam');
    if (addModal) addModal.classList.remove('active');

    // Hafta filtresini bu haftaya al ve listeyi tazele
    currentWeeklyTargetWeek = week;
    renderMobileWeekly();

    // Sınavın detay ve sonuç ekranını aç
    setTimeout(() => {
      window.openWeeklyGradingModal(examData.id);
    }, 200);

    const ev = new CustomEvent('stateChanged');
    document.dispatchEvent(ev);
  };

  // ==========================================
  // SINAV DETAYI VE OKUMA SONUÇLARI MODALI
  // ==========================================
  window._currentExamResultFilter = 'all';

  window.openWeeklyGradingModal = (examId) => {
    if (!window.stateManager) return;
    const state = (window.stateManager.loadState) ? window.stateManager.loadState() : (window.stateManager.state || {});
    const exam = (state.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
    if (!exam) return;

    window.activeWeeklyExam = exam;
    window.vibrate(20);

    const titleEl = document.getElementById('m-weg-exam-title');
    const subtitleEl = document.getElementById('m-weg-exam-subtitle');

    const eInfo = typeof window.getEducationWeekInfo === 'function' ? window.getEducationWeekInfo(exam.weekId) : null;
    const eParts = (exam.weekId || '').split('-W');
    const eWeekLabel = eInfo ? eInfo.label : (typeof window.formatWeekTR === 'function' ? window.formatWeekTR(exam.weekId, 'full') : (eParts.length === 2 ? `${eParts[0]} Yılı, ${eParts[1]}. Hafta` : exam.weekId));
    const penaltyText = exam.wrongAffects ? `${exam.penaltyRate || 3} Yanlış 1 Doğruyu Götürür` : 'Yanlışlar Doğruları Etkilemez';
    const optText = `${exam.choicesCount || 4} Şıklı Optik Form`;

    if (titleEl) titleEl.textContent = exam.examName || 'Değerlendirme Sınavı';
    if (subtitleEl) {
      subtitleEl.textContent = `${eWeekLabel} • ${exam.totalQuestions} Soru • ${optText} • ${penaltyText}${exam.branch ? ` • ${exam.branch} Şubesi` : ''}`;
    }

    // Filtreyi sıfırla ve sonuç listesini çiz
    window._currentExamResultFilter = 'all';
    const tabs = document.getElementById('m-weg-filter-tabs');
    if (tabs) {
      tabs.querySelectorAll('.m-std-tab-btn').forEach(btn => {
        if (btn.dataset.filter === 'all') btn.classList.add('active');
        else btn.classList.remove('active');
      });
    }

    window.renderExamResultsList(exam, 'all');

    const modal = document.getElementById('modal-weekly-exam-grading');
    const backdrop = document.getElementById('sheet-backdrop');
    if (modal && backdrop) {
      backdrop.classList.add('active');
      modal.classList.add('active');
    }
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeWeeklyGradingModal = () => {
    const modal = document.getElementById('modal-weekly-exam-grading');
    if (modal) modal.classList.remove('active');
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.classList.remove('active');
  };

  window.setExamResultFilter = (filterMode) => {
    window._currentExamResultFilter = filterMode;
    const tabs = document.getElementById('m-weg-filter-tabs');
    if (tabs) {
      tabs.querySelectorAll('.m-std-tab-btn').forEach(btn => {
        if (btn.dataset.filter === filterMode) btn.classList.add('active');
        else btn.classList.remove('active');
      });
    }
    if (window.activeWeeklyExam) {
      window.renderExamResultsList(window.activeWeeklyExam, filterMode);
    }
  };

  window.renderExamResultsList = (exam, filterMode) => {
    if (!exam || !window.stateManager) return;
    const state = window.stateManager.loadState ? window.stateManager.loadState() : (window.stateManager.state || {});
    const container = document.getElementById('m-weg-results-container');
    if (!container) return;

    const isMiddle = isMiddleSchool();
    const allStudents = (state.students || []).filter(s => {
      if (!isStudentInCurrentLevel(s)) return false;
      if (isMiddle && exam.branch && s.branch !== exam.branch) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    const examScores = exam.examScores || {};
    const studentResults = exam.studentResults || {};

    const gradedList = [];
    const pendingList = [];

    allStudents.forEach(st => {
      const sc = examScores[st.id];
      const res = studentResults[st.id];
      if (sc !== undefined && sc !== null && sc !== '') {
        gradedList.push({
          student: st,
          score: parseFloat(sc),
          result: res || { correct: '-', wrong: '-', blank: '-', net: '-', score: sc }
        });
      } else {
        pendingList.push({ student: st });
      }
    });

    // Puanlara göre büyükten küçüğe sırala
    gradedList.sort((a, b) => b.score - a.score);

    // İstatistik ve Sayaçları Güncelle
    const statsEl = document.getElementById('m-weg-stats-text');
    const avgEl = document.getElementById('m-weg-avg-badge');
    const countAll = document.getElementById('m-count-res-all');
    const countGraded = document.getElementById('m-count-res-graded');
    const countPending = document.getElementById('m-count-res-pending');

    if (countAll) countAll.textContent = allStudents.length;
    if (countGraded) countGraded.textContent = gradedList.length;
    if (countPending) countPending.textContent = pendingList.length;

    const totalScore = gradedList.reduce((sum, item) => sum + item.score, 0);
    const avgScore = gradedList.length > 0 ? (totalScore / gradedList.length).toFixed(1) : null;

    if (statsEl) statsEl.textContent = `${gradedList.length}/${allStudents.length} Öğrenci Puanlandı`;
    if (avgEl) {
      avgEl.textContent = avgScore !== null ? `Ort: ${avgScore} Puan` : 'Ort: -';
      avgEl.style.color = avgScore !== null ? 'var(--m-primary)' : 'var(--m-text-muted)';
    }

    if (allStudents.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <p style="font-weight: 600;">Bu sınav için uygun öğrenci bulunamadı.</p>
        </div>
      `;
      return;
    }

    let html = '';

    // Sonuçlar (Puanlanan Öğrenciler Listesi)
    if (filterMode === 'all' || filterMode === 'graded') {
      if (gradedList.length === 0 && filterMode === 'graded') {
        html += `
          <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
            <div style="font-size: 2.5rem; margin-bottom: 8px;">📷</div>
            <p style="font-weight: 700; margin-bottom: 4px; color: var(--m-text);">Henüz Okuma Sonucu Yok</p>
            <p style="font-size: 0.74rem; max-width: 280px; margin: 0 auto;">Yukarıdaki "Optik Form Oku" veya "Manuel Giriş Yap" butonlarıyla öğrencilerin kağıtlarını okutabilirsiniz.</p>
          </div>
        `;
      } else {
        gradedList.forEach((item, idx) => {
          const st = item.student;
          const res = item.result;
          const medals = ['🥇', '🥈', '🥉'];
          const rankStr = idx < 3 ? medals[idx] : `${idx + 1}.`;
          const avatarColor = getAvatarColor(st.id || st.name);

          const isOptical = res.source === 'optical';
          const sourceBadge = isOptical
            ? `<span class="m-exam-result-badge-source m-exam-result-badge-optical"><i data-lucide="scan" style="width:10px;height:10px;"></i> Optik Okuma</span>`
            : `<span class="m-exam-result-badge-source m-exam-result-badge-manual"><i data-lucide="edit-3" style="width:10px;height:10px;"></i> Manuel Giriş</span>`;

          html += `
            <div class="m-exam-result-item" data-student-id="${st.id}">
              <div class="m-exam-result-rank">${rankStr}</div>

              <div class="student-avatar" style="width: 32px; height: 32px; font-size: 0.8rem; background-color: ${avatarColor}; flex-shrink: 0;">
                ${st.photo ? `<img src="${st.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : escapeHTML(st.name.charAt(0).toUpperCase())}
              </div>

              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 0.82rem; font-weight: 800; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}
                  </span>
                  <span style="font-size: 0.68rem; color: var(--m-text-muted);">No: ${st.number || '-'}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 0.7rem; color: var(--m-text-secondary); flex-wrap: wrap;">
                  <span>${res.correct !== undefined ? res.correct : '-'} D</span> •
                  <span>${res.wrong !== undefined ? res.wrong : '-'} Y</span> •
                  <span>${res.blank !== undefined ? res.blank : '-'} B</span>
                  ${res.net !== undefined ? ` • <strong style="color: var(--m-primary);">${res.net} Net</strong>` : ''}
                  ${sourceBadge}
                </div>
              </div>

              <div style="text-align: right; display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                <div class="student-card-score" style="font-size: 0.86rem; padding: 4px 8px; font-weight: 800;">
                  ${item.score} P
                </div>
                <button type="button" class="m-btn-sm" onclick="window.openManualOpticalEntryModal('${exam.id}', '${st.id}')" title="Optiği Düzenle" style="padding: 5px 6px; background: var(--m-surface-subtle); border: 1px solid var(--m-border);">
                  <i data-lucide="edit-2" style="width: 13px; height: 13px; color: var(--m-text);"></i>
                </button>
                <button type="button" class="m-btn-sm danger" onclick="window.deleteStudentExamResult('${exam.id}', '${st.id}')" title="Sonucu Sil" style="padding: 5px 6px;">
                  <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                </button>
              </div>
            </div>
          `;
        });
      }
    }

    // Bekleyenler (Henüz Sonucu Girilmemiş Öğrenciler)
    if (filterMode === 'all' || filterMode === 'pending') {
      if (pendingList.length > 0) {
        if (filterMode === 'all' && gradedList.length > 0) {
          html += `
            <div style="margin: 12px 0 8px 0; font-size: 0.72rem; font-weight: 800; color: var(--m-text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
              <span>Bekleyen Öğrenciler (${pendingList.length})</span>
              <div style="flex: 1; height: 1px; background: var(--m-border);"></div>
            </div>
          `;
        }

        pendingList.forEach(item => {
          const st = item.student;
          const avatarColor = getAvatarColor(st.id || st.name);

          html += `
            <div class="m-exam-result-item" style="opacity: 0.85; background: var(--m-surface-subtle);" data-student-id="${st.id}">
              <div class="m-exam-result-rank" style="color: var(--m-text-muted);">-</div>

              <div class="student-avatar" style="width: 32px; height: 32px; font-size: 0.8rem; background-color: ${avatarColor}; flex-shrink: 0;">
                ${st.photo ? `<img src="${st.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : escapeHTML(st.name.charAt(0).toUpperCase())}
              </div>

              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 0.82rem; font-weight: 700; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}
                </div>
                <div style="font-size: 0.68rem; color: var(--m-text-muted); margin-top: 2px;">
                  No: ${st.number || '-'} • Henüz sonuç girilmedi
                </div>
              </div>

              <button type="button" class="m-btn-sm primary" onclick="window.openManualOpticalEntryModal('${exam.id}', '${st.id}')" style="font-size: 0.72rem; font-weight: 700; padding: 5px 10px; display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i>
                <span>Giriş Yap</span>
              </button>
            </div>
          `;
        });
      } else if (filterMode === 'pending') {
        html += `
          <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-success);">
            <div style="font-size: 2.5rem; margin-bottom: 8px;">🎉</div>
            <p style="font-weight: 700; margin-bottom: 4px; color: var(--m-text);">Tüm Öğrenciler Puanlandı!</p>
            <p style="font-size: 0.74rem; color: var(--m-text-muted);">Sınıftaki tüm öğrencilerin sınav sonuçları başarıyla kaydedildi.</p>
          </div>
        `;
      }
    }

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  };

  window.deleteStudentExamResult = async (examId, studentId) => {
    if (!window.stateManager) return;
    const state = window.stateManager.loadState ? window.stateManager.loadState() : (window.stateManager.state || {});
    const exam = (state.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
    if (!exam) return;

    const st = (state.students || []).find(s => String(s.id) === String(studentId));
    const stName = st ? `${st.name} ${st.surname || ''}` : 'Öğrenci';

    const confirmed = await (window.confirmAsync
      ? window.confirmAsync(`${stName} öğrencisine ait sınav sonucunu silmek istediğinize emin misiniz?`)
      : Promise.resolve(confirm(`${stName} öğrencisine ait sınav sonucunu silmek istediğinize emin misiniz?`)));

    if (!confirmed) return;

    if (exam.examScores) delete exam.examScores[studentId];
    if (exam.studentResults) delete exam.studentResults[studentId];

    window.stateManager.saveExam(exam);
    window.activeWeeklyExam = exam;

    if (window.showMobileToast) window.showMobileToast('Sonuç silindi.');
    if (window.vibrate) window.vibrate(20);

    window.renderExamResultsList(exam, window._currentExamResultFilter || 'all');
    renderMobileWeekly();
  };

  // ==========================================
  // MANUEL OPTİK FORM GİRİŞİ MODALI
  // ==========================================
  window._tempManualAnswers = {};

  window.openManualOpticalEntryModal = (examId, targetStudentId) => {
    if (!window.stateManager) return;
    const state = window.stateManager.loadState ? window.stateManager.loadState() : (window.stateManager.state || {});
    const exam = (state.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
    if (!exam) return;

    window.activeWeeklyExam = exam;
    if (window.vibrate) window.vibrate(20);

    const selectEl = document.getElementById('m-moe-student-select');
    const subtitleEl = document.getElementById('m-moe-subtitle');
    if (!selectEl) return;

    const isMiddle = isMiddleSchool();
    const students = (state.students || []).filter(s => {
      if (!isStudentInCurrentLevel(s)) return false;
      if (isMiddle && exam.branch && s.branch !== exam.branch) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    if (students.length === 0) {
      alert('Sınava ait öğrenci bulunamadı.');
      return;
    }

    const examScores = exam.examScores || {};

    selectEl.innerHTML = students.map(s => {
      const sc = examScores[s.id];
      const scoreText = (sc !== undefined && sc !== null && sc !== '') ? ` • [${sc} Puan]` : '';
      return `<option value="${s.id}">${escapeHTML(s.name)} ${escapeHTML(s.surname || '')} (No: ${s.number || '-'})${scoreText}</option>`;
    }).join('');

    if (targetStudentId) {
      selectEl.value = targetStudentId;
    } else {
      const unassigned = students.find(s => examScores[s.id] === undefined || examScores[s.id] === null || examScores[s.id] === '');
      if (unassigned) selectEl.value = unassigned.id;
      else selectEl.value = students[0].id;
    }

    if (subtitleEl) {
      subtitleEl.textContent = `${exam.examName || 'Sınav'} • ${exam.totalQuestions || 20} Soru • Optik Form`;
    }

    window.onManualEntryStudentChanged();

    const modal = document.getElementById('modal-manual-optical-entry');
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.classList.add('active');
    if (modal) modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeManualOpticalEntryModal = () => {
    const modal = document.getElementById('modal-manual-optical-entry');
    if (modal) modal.classList.remove('active');
    const gradingModal = document.getElementById('modal-weekly-exam-grading');
    const isGradingOpen = gradingModal && gradingModal.classList.contains('active');
    if (!isGradingOpen) {
      const backdrop = document.getElementById('sheet-backdrop');
      if (backdrop) backdrop.classList.remove('active');
    }
  };

  window.onManualEntryStudentChanged = () => {
    const selectEl = document.getElementById('m-moe-student-select');
    const studentId = selectEl ? selectEl.value : '';
    const exam = window.activeWeeklyExam;
    if (!exam) return;

    const existingRes = (exam.studentResults && exam.studentResults[studentId]) || {};
    window._tempManualAnswers = existingRes.answers ? { ...existingRes.answers } : {};

    window.renderManualEntryOpticalSheet();
  };

  window.renderManualEntryOpticalSheet = () => {
    const sheet = document.getElementById('m-moe-bubbles-sheet');
    const exam = window.activeWeeklyExam;
    if (!sheet || !exam) return;

    const totalQ = parseInt(exam.totalQuestions, 10) || 20;
    const choicesCount = parseInt(exam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
    const answerKey = exam.answerKey || {};

    let html = '';
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;
    let markedCount = 0;

    for (let q = 1; q <= totalQ; q++) {
      const marked = window._tempManualAnswers[q] || '';
      const key = answerKey[q] || '';

      let rowClass = '';
      if (!marked) {
        blankCount++;
      } else {
        markedCount++;
        if (key) {
          if (marked === key) {
            correctCount++;
            rowClass = 'is-correct';
          } else {
            wrongCount++;
            rowClass = 'is-wrong';
          }
        } else {
          correctCount++;
        }
      }

      html += `
        <div class="m-opt-bubble-row ${rowClass}" data-q="${q}">
          <span class="m-opt-bubble-qnum">${q}.</span>
          <div class="m-opt-bubbles-wrap">
            ${letters.map(l => {
              let btnClass = 'm-opt-bubble-btn';
              if (marked === l) {
                btnClass += ' active';
                if (key) {
                  btnClass += (l === key) ? ' active-correct' : ' active-wrong';
                }
              }
              return `
                <button type="button" class="${btnClass}" onclick="window.selectManualEntryChoice(${q}, '${l}')">
                  ${l}
                </button>
              `;
            }).join('')}
            <button type="button" class="m-opt-clear-btn ${marked ? 'visible' : ''}" id="m-moe-clear-${q}" title="Boş Bırak" onclick="window.clearManualEntryChoice(${q})">
              &times;
            </button>
          </div>
        </div>
      `;
    }

    sheet.innerHTML = html;

    // Skor ve Net Hesabı
    const penaltyRate = exam.wrongAffects ? (parseFloat(exam.penaltyRate) || 3) : 0;
    let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
    net = Math.max(0, parseFloat(net.toFixed(2)));
    const score = totalQ > 0 ? Math.round((net / totalQ) * 100) : 0;

    const dybEl = document.getElementById('m-moe-live-dyb');
    const netEl = document.getElementById('m-moe-live-net');
    const scoreEl = document.getElementById('m-moe-live-score');
    const badgeEl = document.getElementById('m-moe-qcount-badge');

    if (dybEl) dybEl.textContent = `${correctCount} D • ${wrongCount} Y • ${blankCount} B`;
    if (netEl) netEl.textContent = net.toFixed(2).replace('.00', '');
    if (scoreEl) scoreEl.textContent = score;
    if (badgeEl) badgeEl.textContent = `${markedCount} / ${totalQ} Soru İşaretlendi`;
  };

  window.selectManualEntryChoice = (q, opt) => {
    if (window.vibrate) window.vibrate(10);
    if (!window._tempManualAnswers) window._tempManualAnswers = {};

    if (window._tempManualAnswers[q] === opt) {
      delete window._tempManualAnswers[q];
    } else {
      window._tempManualAnswers[q] = opt;
    }
    window.renderManualEntryOpticalSheet();
  };

  window.clearManualEntryChoice = (q) => {
    if (window.vibrate) window.vibrate(10);
    if (window._tempManualAnswers) delete window._tempManualAnswers[q];
    window.renderManualEntryOpticalSheet();
  };

  window.clearManualEntryForm = () => {
    if (!confirm('Tüm işaretlemeleri temizlemek istediğinize emin misiniz?')) return;
    window._tempManualAnswers = {};
    window.renderManualEntryOpticalSheet();
  };

  window.saveManualOpticalEntry = (andNext) => {
    const selectEl = document.getElementById('m-moe-student-select');
    const studentId = selectEl ? selectEl.value : '';
    const exam = window.activeWeeklyExam;
    if (!exam || !studentId || !window.stateManager) return;

    const state = window.stateManager.loadState ? window.stateManager.loadState() : (window.stateManager.state || {});
    const ex = (state.weeklyEvaluations || []).find(e => String(e.id) === String(exam.id));
    if (!ex) return;

    const totalQ = parseInt(ex.totalQuestions, 10) || 20;
    const answerKey = ex.answerKey || {};
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;

    for (let q = 1; q <= totalQ; q++) {
      const marked = window._tempManualAnswers[q] || '';
      const key = answerKey[q] || '';
      if (!marked) {
        blankCount++;
      } else if (key && marked === key) {
        correctCount++;
      } else if (key && marked !== key) {
        wrongCount++;
      } else {
        correctCount++;
      }
    }

    const penaltyRate = ex.wrongAffects ? (parseFloat(ex.penaltyRate) || 3) : 0;
    let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
    net = Math.max(0, parseFloat(net.toFixed(2)));
    const score = totalQ > 0 ? Math.round((net / totalQ) * 100) : 0;

    if (!ex.examScores) ex.examScores = {};
    if (!ex.studentResults) ex.studentResults = {};

    ex.examScores[studentId] = score;
    ex.studentResults[studentId] = {
      correct: correctCount,
      wrong: wrongCount,
      blank: blankCount,
      net: net,
      score: score,
      answers: { ...window._tempManualAnswers },
      source: 'manual',
      scannedAt: new Date().toISOString()
    };

    window.stateManager.saveExam(ex);
    window.activeWeeklyExam = ex;
    if (window.vibrate) window.vibrate(30);

    const st = (state.students || []).find(s => String(s.id) === String(studentId));
    const stName = st ? `${st.name} ${st.surname || ''}` : 'Öğrenci';

    if (window.showMobileToast) {
      window.showMobileToast(`✅ ${stName} için ${score} Puan kaydedildi.`);
    }

    window.renderExamResultsList(ex, window._currentExamResultFilter || 'all');
    renderMobileWeekly();

    if (andNext) {
      const isMiddle = isMiddleSchool();
      const students = (state.students || []).filter(s => {
        if (!isStudentInCurrentLevel(s)) return false;
        if (isMiddle && ex.branch && s.branch !== ex.branch) return false;
        return true;
      }).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

      const unassigned = students.find(s => ex.examScores[s.id] === undefined || ex.examScores[s.id] === null || ex.examScores[s.id] === '');
      if (unassigned) {
        selectEl.value = unassigned.id;
        window.onManualEntryStudentChanged();
      } else {
        if (window.showMobileToast) window.showMobileToast('🎉 Tüm öğrencilerin notları tamamlandı!');
        window.closeManualOpticalEntryModal();
      }
    } else {
      window.closeManualOpticalEntryModal();
    }
  };

  window.deleteWeeklyExam = async (examId) => {
    if (!window.stateManager) return;
    const confirmed = await (window.confirmAsync
      ? window.confirmAsync('Bu değerlendirme sınavını ve varsa derece puanlarını tamamen silmek istediğinize emin misiniz?')
      : Promise.resolve(confirm('Bu sınavı silmek istediğinize emin misiniz?')));
    if (!confirmed) return;

    window.stateManager.deleteExam(examId);
    window.vibrate(30);
    showMobileToast('Sınav silindi.');

    renderMobileWeekly();

    const ev = new CustomEvent('stateChanged');
    document.dispatchEvent(ev);
  };

  // Tema Yönetimi
  window.setMobileTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sinif_asistani_theme', theme);
    window.vibrate(15);
  };

  // Mobil Yedekleme (Dışa ve İçe Aktarma)
  window.exportMobileData = () => {
    if (!window.stateManager) return;
    const exportPayload = {
      ...window.stateManager.state,
      _sinif_asistani_gemini_api_key: localStorage.getItem('sinif_asistani_gemini_api_key') || ''
    };
    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const dateStr = (typeof window.formatLocalDate === 'function') ? window.formatLocalDate() : new Date().toISOString().slice(0, 10);
    const fileName = `sinif_asistani_yedek_${dateStr}.json`;

    if (window.AndroidBridge && typeof window.AndroidBridge.shareData === 'function') {
      window.AndroidBridge.shareData(jsonStr, "Sınıf Asistanı Yedek Paylaş", "application/json");
    } else {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMobileToast('📥 Yedek dosyası indirildi');
    }
  };

  window.importMobileData = (event) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (window.stateManager && window.stateManager.importData(e.target.result)) {
          showMobileToast('✅ Verileriniz başarıyla yüklendi!');
          setTimeout(() => location.reload(), 800);
        } else {
          showMobileToast('❌ Geçersiz yedek dosyası');
        }
      } catch (err) {
        showMobileToast('❌ Dosya okunurken hata oluştu');
      }
    };
    reader.readAsText(file);
  };

  // ==========================================================================
  // DERS AKIŞI MODÜLÜ (DERS PROGRAMI, PLANLAR, DERS SAATLERİ)
  // ==========================================================================
  const SCHEDULE_PRESET_COLORS = [
    '#3b82f6', // Mavi
    '#10b981', // Yeşil
    '#f59e0b', // Kehribar
    '#ef4444', // Kırmızı
    '#8b5cf6', // Mor
    '#ec4899', // Pembe
    '#06b6d4', // Turkuaz
    '#6366f1', // İndigo
    '#14b8a6', // Teal
    '#64748b'  // Gri
  ];

  let activeScheduleFlowTab = 'schedule'; // 'schedule' | 'plans' | 'times'
  let activeSelectedLessonColor = '#3b82f6';
  let activeCellPickerSlot = null; // { dayIdx, periodKey, dayName, periodName }
  let activeMebGradeFilter = 'all';

  // Ana Modalı Açma
  window.openScheduleFlowModal = (tab = 'schedule') => {
    try {
      activeScheduleFlowTab = tab || 'schedule';
      const menu = document.getElementById('m-sched-fab-menu');
      const btn = document.getElementById('m-sched-fab-btn');
      if (menu) menu.classList.remove('show');
      if (btn) btn.classList.remove('active');

      openBottomSheet('modal-schedule-flow');
      window.updateScheduleFlowTabsUI();
      window.renderScheduleFlowContent();
      if (window.lucide) window.lucide.createIcons();
    } catch (e) {
      console.error('Error in openScheduleFlowModal:', e);
    }
  };

  // Ders Akışı Yüzen Menü Aç/Kapat (FAB Toggle)
  window.toggleScheduleFabMenu = () => {
    window.vibrate(15);
    const menu = document.getElementById('m-sched-fab-menu');
    const btn = document.getElementById('m-sched-fab-btn');
    if (!menu) return;
    const isShowing = menu.classList.toggle('show');
    if (btn) btn.classList.toggle('active', isShowing);
    if (window.lucide) window.lucide.createIcons();
  };

  // Sekme / Alt Araç Değiştirme (Yüzen Menüden Çağrılır)
  window.switchScheduleFlowTab = (tab) => {
    activeScheduleFlowTab = tab;
    const menu = document.getElementById('m-sched-fab-menu');
    const btn = document.getElementById('m-sched-fab-btn');
    if (menu && menu.classList.contains('show')) {
      menu.classList.remove('show');
      if (btn) btn.classList.remove('active');
    }
    window.updateScheduleFlowTabsUI();
    window.renderScheduleFlowContent();
    window.vibrate(10);
  };

  // Yüzen Menü Butonlarının ve Başlığın Görünümünü Güncelleme
  window.updateScheduleFlowTabsUI = () => {
    document.querySelectorAll('#m-sched-fab-menu .mobile-fab-item, .sched-dock-btn').forEach(btn => {
      if (btn.getAttribute('data-flow-tab') === activeScheduleFlowTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const headerTitle = document.getElementById('m-sched-header-title');
    const headerIcon = document.getElementById('m-sched-header-icon');
    if (headerTitle && headerIcon) {
      if (activeScheduleFlowTab === 'schedule') {
        headerIcon.textContent = '📅';
        headerTitle.textContent = 'Ders Programı';
      } else if (activeScheduleFlowTab === 'plans') {
        headerIcon.textContent = '📑';
        headerTitle.textContent = 'Yıllık Planlar';
      } else if (activeScheduleFlowTab === 'times') {
        headerIcon.textContent = '⏰';
        headerTitle.textContent = 'Ders Saatleri';
      }
    }
  };

  // Aktif Alt Araç İçeriğini Çizme
  window.renderScheduleFlowContent = () => {
    const container = document.getElementById('m-schedule-flow-body');
    if (!container) return;

    if (activeScheduleFlowTab === 'schedule') {
      renderScheduleProgramTab(container);
    } else if (activeScheduleFlowTab === 'plans') {
      renderSchedulePlansTab(container);
    } else if (activeScheduleFlowTab === 'times') {
      renderScheduleTimesTab(container);
    }

    if (window.lucide) window.lucide.createIcons();
  };

  // Belirli bir güne yumuşak kaydırma
  window.scrollToScheduleDay = (dayNum) => {
    const el = document.getElementById(`sched-day-${dayNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.vibrate(10);
    }
  };

  // --------------------------------------------------------------------------
  // 1. DERS PROGRAMI: GÜN GÜN ALT ALTA DİKEY YERLEŞİM (TABLOSUZ, TAŞMASIZ)
  // --------------------------------------------------------------------------
  function renderScheduleProgramTab(container) {
    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const isMiddle = state.educationLevel === 'middle';
    const periods = isMiddle
      ? ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']
      : ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

    const lessons = (window.stateManager && window.stateManager.getLessons()) || [];
    const times = (window.stateManager && window.stateManager.getScheduleTimes()) || {};
    const grid = (window.stateManager && window.stateManager.getScheduleGrid()) || {};

    const days = [
      { num: 1, name: 'Pazartesi', icon: '🗓️', short: 'Pzt' },
      { num: 2, name: 'Salı', icon: '🗓️', short: 'Sal' },
      { num: 3, name: 'Çarşamba', icon: '🗓️', short: 'Çar' },
      { num: 4, name: 'Perşembe', icon: '🗓️', short: 'Per' },
      { num: 5, name: 'Cuma', icon: '🗓️', short: 'Cum' }
    ];

    const lunchData = times['lunch'] || { start: '12:10', end: '13:00' };
    const hasLunch = times.lunch ? (times.lunch.enabled !== false && times.lunch.disabled !== true) : true;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        
        <!-- Üst Başlık & Eylemler -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="m-badge" style="background: rgba(99, 102, 241, 0.12); color: var(--m-primary); font-weight: 800; font-size: 0.78rem; padding: 4px 10px; border-radius: 999px;">
              ${isMiddle ? '🏫 Ortaokul (Günlük 7 Saat)' : '🏫 İlkokul (Günlük 6 Saat)'}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button class="m-btn-sm" style="display: flex; align-items: center; gap: 5px; background: var(--m-primary); color: #ffffff; border: none; font-weight: 700; font-size: 0.78rem; padding: 6px 12px; border-radius: 10px; cursor: pointer; box-shadow: var(--m-shadow-sm);" onclick="window.openScheduleLessonsModal()">
              <i data-lucide="book" style="width: 14px; height: 14px;"></i> Dersler (${lessons.length})
            </button>
            <button class="m-btn-sm" style="display: flex; align-items: center; gap: 4px; background: var(--m-surface-subtle); color: var(--m-danger); border: 1px solid var(--m-border); font-weight: 700; font-size: 0.78rem; padding: 6px 10px; border-radius: 10px; cursor: pointer;" onclick="window.clearScheduleGridFromMobile()" title="Programı Temizle">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>

        <!-- Hızlı Gün Atlama Çipleri -->
        <div class="m-sched-day-chips">
          ${days.map(d => `
            <button class="m-sched-day-chip" onclick="window.scrollToScheduleDay(${d.num})">
              ${d.name}
            </button>
          `).join('')}
        </div>

        <div style="font-size: 0.74rem; color: var(--m-text-muted); line-height: 1.3;">
          👉 Ders saatlerine dokunarak ders atayabilir veya değiştirebilirsiniz.
        </div>

        <!-- GÜN GÜN ALT ALTA DERS LİSTESİ -->
        <div class="m-sched-days-container">
          ${days.map(d => {
            const filledCount = periods.filter(pKey => !!grid[`${d.num}-${pKey}`]).length;
            const isComplete = filledCount === periods.length;

            return `
              <div class="m-sched-day-card" id="sched-day-${d.num}">
                <!-- Gün Başlığı -->
                <div class="m-sched-day-header">
                  <div class="m-sched-day-title">
                    <span>${d.icon}</span>
                    <span>${d.name}</span>
                  </div>
                  <span class="m-sched-day-count-badge ${isComplete ? 'complete' : ''}">
                    ${filledCount}/${periods.length} Ders ${isComplete ? '✓' : ''}
                  </span>
                </div>

                <!-- Günün Ders Slotları -->
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 2px;">
                  <!-- İlk 4 Ders (Sabah) -->
                  ${periods.slice(0, 4).map((pKey, idx) => {
                    const pNum = idx + 1;
                    const pTime = times[pKey] || { start: '--:--', end: '--:--' };
                    const timeText = (pTime.start && pTime.end) ? `${pTime.start}-${pTime.end}` : '';
                    const gridKey = `${d.num}-${pKey}`;
                    const lessonId = grid[gridKey] || '';
                    const lesson = lessons.find(l => l.id === lessonId);

                    return `
                      <div class="m-sched-slot-row">
                        <div class="m-sched-slot-badge">
                          <span class="m-sched-slot-num">${pNum}. Ders</span>
                          <span class="m-sched-slot-time">${timeText}</span>
                        </div>
                        ${lesson ? `
                          <button class="m-sched-slot-btn" style="background-color: ${lesson.color}; color: #ffffff;" onclick="window.openScheduleCellPicker(${d.num}, '${pKey}', '${d.name}', '${pNum}. Ders')">
                            <span style="font-weight: 800; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                              ${escapeHTML(lesson.name.toUpperCase())}
                            </span>
                            <span style="opacity: 0.85; font-size: 0.72rem; padding: 2px 6px; background: rgba(0,0,0,0.22); border-radius: 6px; font-weight: 600; flex-shrink: 0;">
                              Değiştir ✎
                            </span>
                          </button>
                        ` : `
                          <button class="m-sched-slot-btn empty" onclick="window.openScheduleCellPicker(${d.num}, '${pKey}', '${d.name}', '${pNum}. Ders')">
                            <i data-lucide="plus" style="width: 15px; height: 15px;"></i>
                            <span>Ders Seç</span>
                          </button>
                        `}
                      </div>
                    `;
                  }).join('')}

                  <!-- Öğle Arası Banner veya Öğle Arası Ekle Butonu -->
                  ${hasLunch ? `
                    <div class="m-sched-lunch-banner">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span>🍴</span>
                        <span>ÖĞLE ARASI (${lunchData.start || '12:10'} - ${lunchData.end || '13:00'})</span>
                      </div>
                      <button type="button" class="m-sched-lunch-remove-btn" onclick="window.removeScheduleLunchBreak()" title="Öğle Arasını Kaldır">
                        ✕
                      </button>
                    </div>
                  ` : `
                    <div class="m-sched-lunch-add-wrap">
                      <button type="button" class="m-sched-lunch-add-btn" onclick="window.addScheduleLunchBreak()">
                        <span>🍴</span>
                        <span>+ Öğle Arası Ekle</span>
                      </button>
                    </div>
                  `}

                  <!-- Öğleden Sonraki Dersler (5..6 veya 5..7) -->
                  ${periods.slice(4).map((pKey, idx) => {
                    const pNum = idx + 5;
                    const pTime = times[pKey] || { start: '--:--', end: '--:--' };
                    const timeText = (pTime.start && pTime.end) ? `${pTime.start}-${pTime.end}` : '';
                    const gridKey = `${d.num}-${pKey}`;
                    const lessonId = grid[gridKey] || '';
                    const lesson = lessons.find(l => l.id === lessonId);

                    return `
                      <div class="m-sched-slot-row">
                        <div class="m-sched-slot-badge">
                          <span class="m-sched-slot-num">${pNum}. Ders</span>
                          <span class="m-sched-slot-time">${timeText}</span>
                        </div>
                        ${lesson ? `
                          <button class="m-sched-slot-btn" style="background-color: ${lesson.color}; color: #ffffff;" onclick="window.openScheduleCellPicker(${d.num}, '${pKey}', '${d.name}', '${pNum}. Ders')">
                            <span style="font-weight: 800; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                              ${escapeHTML(lesson.name.toUpperCase())}
                            </span>
                            <span style="opacity: 0.85; font-size: 0.72rem; padding: 2px 6px; background: rgba(0,0,0,0.22); border-radius: 6px; font-weight: 600; flex-shrink: 0;">
                              Değiştir ✎
                            </span>
                          </button>
                        ` : `
                          <button class="m-sched-slot-btn empty" onclick="window.openScheduleCellPicker(${d.num}, '${pKey}', '${d.name}', '${pNum}. Ders')">
                            <i data-lucide="plus" style="width: 15px; height: 15px;"></i>
                            <span>Ders Seç</span>
                          </button>
                        `}
                      </div>
                    `;
                  }).join('')}

                </div>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  }

  // Hücreye Dokununca Ders Seçim Penceresi
  window.openScheduleCellPicker = (dayIdx, periodKey, dayName, periodName) => {
    activeCellPickerSlot = { dayIdx, periodKey, dayName, periodName };
    const titleEl = document.getElementById('m-pick-cell-title');
    const currentWrap = document.getElementById('m-pick-cell-current-wrap');
    const listEl = document.getElementById('m-pick-cell-lessons-list');

    if (titleEl) {
      titleEl.textContent = `📖 ${dayName} - ${periodName}`;
    }

    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const grid = state.scheduleGrid || {};
    const gridKey = `${dayIdx}-${periodKey}`;
    const currentLessonId = grid[gridKey];
    const lessons = (window.stateManager && window.stateManager.getLessons()) || [];
    const currentLesson = lessons.find(l => l.id === currentLessonId);

    if (currentWrap) {
      if (currentLesson) {
        currentWrap.innerHTML = `
          <div class="m-item-card" style="padding: 0.85rem; margin-bottom: 0.75rem; flex-direction: row; align-items: center; justify-content: space-between; border-left: 4px solid ${currentLesson.color};">
            <div>
              <div style="font-size: 0.72rem; color: var(--m-text-muted);">Mevcut Ders:</div>
              <div style="font-weight: 800; font-size: 0.95rem; color: var(--m-text);">${escapeHTML(currentLesson.name)}</div>
            </div>
            <button class="subview-danger-btn" style="padding: 6px 12px; font-size: 0.78rem; border-radius: 8px;" onclick="window.clearScheduleCellFromMobile(${dayIdx}, '${periodKey}')">
              <i data-lucide="x" style="width: 14px; height: 14px;"></i> Dersi Kaldır
            </button>
          </div>
        `;
      } else {
        currentWrap.innerHTML = `
          <div style="font-size: 0.8rem; color: var(--m-text-light); margin-bottom: 0.5rem; font-style: italic;">
            Bu ders saati şu anda boş.
          </div>
        `;
      }
    }

    if (listEl) {
      if (lessons.length === 0) {
        listEl.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 1rem; text-align: center; color: var(--m-text-muted); font-size: 0.85rem;">
            Henüz tanımlı ders bulunmuyor.<br>Aşağıdaki butona dokunarak ilk dersinizi ekleyebilirsiniz.
          </div>
        `;
      } else {
        listEl.innerHTML = lessons.map(l => `
          <button class="m-sched-cell-btn" style="background-color: ${l.color}; color: #ffffff; padding: 12px 8px; font-size: 0.85rem; font-weight: 800; border-radius: 12px;" onclick="window.assignLessonToCell(${dayIdx}, '${periodKey}', '${l.id}')">
            ${escapeHTML(l.name.toUpperCase())}
          </button>
        `).join('');
      }
    }

    openBottomSheet('modal-schedule-pick-cell');
    if (window.lucide) window.lucide.createIcons();
  };

  // Hücreye Ders Atama
  window.assignLessonToCell = (dayIdx, periodKey, lessonId) => {
    if (window.stateManager) {
      window.stateManager.saveScheduleCell(dayIdx, periodKey, lessonId);
    }
    window.vibrate(15);
    window.openScheduleFlowModal('schedule');
    updateLiveLessonCard();
    showMobileToast('Ders programa yerleştirildi', 'success');
  };

  // Hücreyi Boşaltma
  window.clearScheduleCellFromMobile = (dayIdx, periodKey) => {
    if (window.stateManager) {
      window.stateManager.saveScheduleCell(dayIdx, periodKey, '');
    }
    window.vibrate(10);
    window.openScheduleFlowModal('schedule');
    updateLiveLessonCard();
    showMobileToast('Hücre temizlendi', 'info');
  };

  // Tüm Programı Temizleme
  window.clearScheduleGridFromMobile = () => {
    if (confirm('Haftalık ders programındaki tüm yerleşimleri temizlemek istediğinize emin misiniz? (Ders tanımları silinmez)')) {
      if (window.stateManager) {
        window.stateManager.clearScheduleGrid();
      }
      window.renderScheduleFlowContent();
      updateLiveLessonCard();
      showMobileToast('Ders programı temizlendi', 'info');
    }
  };

  // Öğle Arasını Programdan Kaldırma
  window.removeScheduleLunchBreak = () => {
    if (window.stateManager) {
      const times = window.stateManager.getScheduleTimes() || {};
      if (!times.lunch) times.lunch = { start: '12:10', end: '13:00' };
      times.lunch.enabled = false;
      times.lunch.disabled = true;
      window.stateManager.saveScheduleTimes(times);
    }
    window.vibrate(15);
    window.renderScheduleFlowContent();
    updateLiveLessonCard();
    showMobileToast('Öğle arası programdan kaldırıldı', 'info');
  };

  // Öğle Arasını Programa Yeniden Ekleme
  window.addScheduleLunchBreak = () => {
    if (window.stateManager) {
      const times = window.stateManager.getScheduleTimes() || {};
      if (!times.lunch) times.lunch = {};
      times.lunch.enabled = true;
      times.lunch.disabled = false;
      if (!times.lunch.start) times.lunch.start = '12:10';
      if (!times.lunch.end) times.lunch.end = '13:00';
      window.stateManager.saveScheduleTimes(times);
    }
    window.vibrate(20);
    window.renderScheduleFlowContent();
    updateLiveLessonCard();
    showMobileToast('Öğle arası programa eklendi', 'success');
  };

  // Dersler Yönetim Modalı Açma
  window.openScheduleLessonsModal = () => {
    const listEl = document.getElementById('m-schedule-lessons-list');
    const colorPickerEl = document.getElementById('m-lesson-color-picker');
    const nameInput = document.getElementById('m-new-lesson-name');

    if (nameInput) nameInput.value = '';

    // Renk seçiciyi çiz
    if (colorPickerEl) {
      colorPickerEl.innerHTML = SCHEDULE_PRESET_COLORS.map(c => `
        <span class="color-dot-swatch ${c === activeSelectedLessonColor ? 'active' : ''}" style="background-color: ${c};" onclick="window.selectScheduleLessonColor('${c}')"></span>
      `).join('');
    }

    // Dersler listesini çiz
    renderScheduleLessonsList(listEl);

    openBottomSheet('modal-schedule-lessons');
    if (window.lucide) window.lucide.createIcons();
  };

  window.selectScheduleLessonColor = (color) => {
    activeSelectedLessonColor = color;
    document.querySelectorAll('.color-dot-swatch').forEach(sw => {
      if (sw.style.backgroundColor === color || sw.style.backgroundColor === hexToRgbString(color)) {
        sw.classList.add('active');
      } else {
        sw.classList.remove('active');
      }
    });
  };

  function hexToRgbString(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgb(${num >> 16}, ${(num >> 8) & 255}, ${num & 255})`;
  }

  function renderScheduleLessonsList(listEl) {
    if (!listEl) return;
    const lessons = (window.stateManager && window.stateManager.getLessons()) || [];

    if (lessons.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 1.5rem 1rem; text-align: center; color: var(--m-text-muted); font-size: 0.85rem;">
          Henüz kayıtlı ders bulunmuyor.
        </div>
      `;
      return;
    }

    listEl.innerHTML = lessons.map(l => `
      <div class="m-item-card" style="flex-direction: row; align-items: center; justify-content: space-between; padding: 0.75rem 1rem;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="width: 14px; height: 14px; border-radius: 50%; background-color: ${l.color}; flex-shrink: 0;"></span>
          <span style="font-weight: 700; font-size: 0.9rem; color: var(--m-text);">${escapeHTML(l.name)}</span>
        </div>
        <button style="border: none; background: rgba(244, 63, 94, 0.12); color: var(--m-danger); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;" onclick="window.deleteScheduleLessonFromMobile('${l.id}')" title="Dersi Sil">
          <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
        </button>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // Yeni Ders Tanımlama
  window.addNewScheduleLessonFromMobile = () => {
    const nameInput = document.getElementById('m-new-lesson-name');
    if (!nameInput) return;
    const name = nameInput.value.trim();

    if (!name) {
      showMobileToast('Lütfen geçerli bir ders adı girin!', 'warning');
      return;
    }

    const lessons = (window.stateManager && window.stateManager.getLessons()) || [];
    if (lessons.some(l => l.name.toLowerCase() === name.toLowerCase())) {
      showMobileToast('Bu ders zaten kayıtlı!', 'warning');
      return;
    }

    if (window.stateManager) {
      window.stateManager.saveLesson({
        name: name,
        color: activeSelectedLessonColor
      });
    }

    nameInput.value = '';
    const listEl = document.getElementById('m-schedule-lessons-list');
    renderScheduleLessonsList(listEl);
    showMobileToast(`"${name}" dersi eklendi`, 'success');
  };

  // Ders Silme
  window.deleteScheduleLessonFromMobile = (lessonId) => {
    const lessons = (window.stateManager && window.stateManager.getLessons()) || [];
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    if (confirm(`"${lesson.name}" dersini silmek istediğinize emin misiniz? Programdaki tüm hücrelerden de kaldırılacaktır.`)) {
      if (window.stateManager) {
        window.stateManager.deleteLesson(lessonId);
      }
      const listEl = document.getElementById('m-schedule-lessons-list');
      renderScheduleLessonsList(listEl);
      updateLiveLessonCard();
      showMobileToast('Ders silindi', 'info');
    }
  };

  // --------------------------------------------------------------------------
  // 2. SEKME: PLANLAR (YILLIK MÜFREDAT PLANLARI)
  // --------------------------------------------------------------------------
  function renderSchedulePlansTab(container) {
    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const plans = state.plans || [];

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <!-- Üst Buton ve Başlık -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--m-text);">Yıllık Ders Planları</div>
            <div style="font-size: 0.72rem; color: var(--m-text-muted);">Toplam ${plans.length} plan kayıtlı</div>
          </div>
          <button class="subview-primary-action-btn" style="width: auto; padding: 7px 14px; font-size: 0.8rem; border-radius: 10px; margin: 0;" onclick="window.openPlanAddOptions()">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Plan Ekle
          </button>
        </div>

        <!-- Planlar Listesi -->
        ${plans.length === 0 ? `
          <div class="empty-state" style="padding: 2.5rem 1rem; text-align: center; background: var(--m-surface); border: 1.5px dashed var(--m-border); border-radius: var(--m-radius-md); margin-top: 0.5rem;">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📑</div>
            <div style="font-weight: 800; font-size: 1rem; color: var(--m-text); margin-bottom: 0.25rem;">Henüz Yıllık Plan Eklenmemiş</div>
            <div style="font-size: 0.8rem; color: var(--m-text-muted); max-width: 280px; margin: 0 auto 1.25rem;">
              MEB müfredat havuzundan hazır yükleyebilir, Excel dosyanızı aktarabilir veya yapay zeka ile 36 haftalık plan oluşturabilirsiniz.
            </div>
            <button class="subview-secondary-btn" style="margin: 0 auto;" onclick="window.openPlanAddOptions()">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Hemen Plan Ekle
            </button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 0.25rem;">
            ${plans.map(p => {
              const weeks = p.weeklySchedule || p.weeks || [];
              const completedCount = weeks.filter(w => w.isCompleted || w.completed).length;

              return `
                <div class="m-item-card" style="padding: 1rem; border-left: 4px solid var(--m-primary);">
                  <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                    <div>
                      <div style="font-weight: 800; font-size: 0.95rem; color: var(--m-text);">
                        ${escapeHTML(p.className ? p.className + ' - ' : '')}${escapeHTML(p.courseName || p.title)}
                      </div>
                      <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                        <span class="m-badge" style="background: rgba(99, 102, 241, 0.1); color: var(--m-primary); font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 6px;">
                          ${escapeHTML(p.modelName || (p.modelType === 'maarif' ? 'Maarif Modeli' : 'Standart MEB'))}
                        </span>
                        <span style="font-size: 0.72rem; color: var(--m-text-muted);">
                          📅 ${weeks.length} Hafta (${completedCount} tamamlandı)
                        </span>
                      </div>
                    </div>
                    <button style="border: none; background: rgba(244, 63, 94, 0.12); color: var(--m-danger); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;" onclick="window.deletePlanFromMobile('${p.id}')" title="Planı Sil">
                      <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                    </button>
                  </div>

                  <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.85rem; padding-top: 0.65rem; border-top: 1px solid var(--m-border);">
                    <div style="font-size: 0.72rem; color: var(--m-text-light);">
                      Eğitim Yılı: ${escapeHTML(p.educationYear || '2026-2027')}
                    </div>
                    <button class="m-btn-sm" style="display: flex; align-items: center; gap: 4px; background: var(--m-surface-subtle); color: var(--m-primary); border: 1px solid var(--m-border); font-weight: 700; font-size: 0.76rem; padding: 5px 10px; border-radius: 8px; cursor: pointer;" onclick="window.openPlanWeeksViewModal('${p.id}')">
                      <i data-lucide="eye" style="width: 13px; height: 13px;"></i> Haftalık Konular
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  // Plan Ekleme Seçenekler Modalı
  window.openPlanAddOptions = () => {
    openBottomSheet('modal-plan-add-options');
  };

  // Plan Silme
  window.deletePlanFromMobile = (planId) => {
    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const plan = (state.plans || []).find(p => p.id === planId);
    if (!plan) return;

    if (confirm(`"${plan.courseName || plan.title}" yıllık planını silmek istediğinize emin misiniz?`)) {
      if (window.stateManager) {
        window.stateManager.deletePlan(planId);
      }
      window.renderScheduleFlowContent();
      updateLiveLessonCard();
      showMobileToast('Yıllık plan silindi', 'info');
    }
  };

  // Plan Haftaları İnceleme Modalı
  window.openPlanWeeksViewModal = (planId) => {
    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const plan = (state.plans || []).find(p => p.id === planId);
    if (!plan) return;

    const titleEl = document.getElementById('m-plan-weeks-title');
    const subTitleEl = document.getElementById('m-plan-weeks-subtitle');
    const contentEl = document.getElementById('m-plan-weeks-content');

    if (titleEl) {
      titleEl.textContent = `📑 ${plan.className ? plan.className + ' - ' : ''}${plan.courseName || plan.title}`;
    }
    if (subTitleEl) {
      subTitleEl.textContent = `${plan.educationYear || '2026-2027'} • ${plan.modelName || 'MEB Müfredatı'}`;
    }

    const weeks = plan.weeklySchedule || plan.weeks || [];

    if (contentEl) {
      contentEl.innerHTML = weeks.map((w, idx) => {
        const isDone = Boolean(w.isCompleted || w.completed);
        const wTitle = w.weekLabel || `${idx + 1}. Hafta`;
        const topics = Array.isArray(w.topics) ? w.topics.join(', ') : (w.topics || w.topic || '');
        const outcomes = Array.isArray(w.learningOutcomes) ? w.learningOutcomes.join('<br>• ') : (w.learningOutcomes || '');

        return `
          <div class="m-item-card" style="padding: 0.85rem; border-left: 3px solid ${isDone ? 'var(--m-success)' : 'var(--m-border)'};">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-weight: 800; font-size: 0.88rem; color: var(--m-text);">${wTitle}</span>
                  ${w.dateRange ? `<span style="font-size: 0.72rem; color: var(--m-text-muted);">(${escapeHTML(w.dateRange)})</span>` : ''}
                </div>
                ${w.unitName ? `<div style="font-size: 0.76rem; font-weight: 700; color: var(--m-primary); margin-top: 2px;">Ünite: ${escapeHTML(w.unitName)}</div>` : ''}
                ${topics ? `<div style="font-size: 0.8rem; color: var(--m-text); margin-top: 3px;"><strong>Konu:</strong> ${escapeHTML(topics)}</div>` : ''}
                ${outcomes ? `<div style="font-size: 0.74rem; color: var(--m-text-muted); margin-top: 4px; line-height: 1.35;"><strong>Kazanım / Çıktı:</strong><br>• ${outcomes}</div>` : ''}
              </div>
              <label style="display: flex; align-items: center; cursor: pointer; padding: 4px;">
                <input type="checkbox" ${isDone ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--m-success); cursor: pointer;" onchange="window.togglePlanWeekCompletedMobile('${plan.id}', ${idx})">
              </label>
            </div>
          </div>
        `;
      }).join('');
    }

    openBottomSheet('modal-plan-view-weeks');
    if (window.lucide) window.lucide.createIcons();
  };

  window.togglePlanWeekCompletedMobile = (planId, weekIdx) => {
    if (window.stateManager) {
      window.stateManager.toggleWeekCompleted(planId, weekIdx);
    }
    window.vibrate(10);
    showMobileToast('Hafta durumu güncellendi', 'success');
  };

  // --------------------------------------------------------------------------
  // MEB MÜFREDAT HAVUZUNDAN PLAN SEÇME
  // --------------------------------------------------------------------------
  window.openMebCurriculumBrowser = () => {
    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const isMiddle = state.educationLevel === 'middle';
    activeMebGradeFilter = isMiddle ? '5' : '4';

    const classInput = document.getElementById('m-meb-plan-class');
    if (classInput) {
      const activeBranch = (window.getActiveBranch && window.getActiveBranch()) || 'all';
      classInput.value = (activeBranch && activeBranch !== 'all') ? activeBranch : (isMiddle ? '6/A' : '4/A');
    }

    const pillsEl = document.getElementById('m-meb-grade-pills');
    if (pillsEl) {
      const grades = isMiddle ? [5, 6, 7, 8] : [1, 2, 3, 4];
      pillsEl.innerHTML = `
        <button class="m-grade-filter-pill ${activeMebGradeFilter === 'all' ? 'active' : ''}" onclick="window.setMebGradeFilter('all')">Tümü</button>
        ${grades.map(g => `
          <button class="m-grade-filter-pill ${String(g) === String(activeMebGradeFilter) ? 'active' : ''}" onclick="window.setMebGradeFilter('${g}')">${g}. Sınıf</button>
        `).join('')}
      `;
    }

    window.filterMebCurriculumPlans();
    openBottomSheet('modal-plan-meb-browser');
    if (window.lucide) window.lucide.createIcons();
  };

  window.setMebGradeFilter = (grade) => {
    activeMebGradeFilter = grade;
    document.querySelectorAll('.m-grade-filter-pill').forEach(pill => {
      if (pill.textContent.includes(grade) || (grade === 'all' && pill.textContent === 'Tümü')) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
    window.filterMebCurriculumPlans();
    window.vibrate(10);
  };

  window.filterMebCurriculumPlans = () => {
    const listEl = document.getElementById('m-meb-curriculum-list');
    const searchInput = document.getElementById('m-meb-plan-search');
    if (!listEl) return;

    const data = window.MEB_CURRICULUM_DATA || [];
    const search = (searchInput && searchInput.value) ? searchInput.value.toLocaleLowerCase('tr-TR').trim() : '';

    let filtered = data.filter(p => {
      if (activeMebGradeFilter !== 'all' && String(p.grade) !== String(activeMebGradeFilter)) {
        return false;
      }
      if (search) {
        const cName = (p.course || '').toLocaleLowerCase('tr-TR');
        const mName = (p.modelName || '').toLocaleLowerCase('tr-TR');
        return cName.includes(search) || mName.includes(search);
      }
      return true;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 2rem 1rem; text-align: center; color: var(--m-text-muted); font-size: 0.85rem;">
          Aradığınız kritere uygun MEB taslak planı bulunamadı.
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(p => `
      <div class="m-item-card" style="padding: 0.85rem 1rem; flex-direction: row; align-items: center; justify-content: space-between; gap: 8px;">
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 800; font-size: 0.92rem; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${p.grade}. Sınıf ${escapeHTML(p.course)}
          </div>
          <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 0.72rem; color: var(--m-text-muted);">
            <span style="color: var(--m-primary); font-weight: 700;">${escapeHTML(p.modelName || (p.modelType === 'maarif' ? 'Maarif Modeli' : 'Standart MEB'))}</span>
            • <span>${p.weekCount || 36} Hafta</span>
          </div>
        </div>
        <button class="m-btn-sm" style="display: flex; align-items: center; gap: 4px; background: var(--m-primary); color: #ffffff; border: none; font-weight: 700; font-size: 0.78rem; padding: 6px 12px; border-radius: 8px; cursor: pointer; flex-shrink: 0;" onclick="window.addMebPlanToMobile('${p.id}')">
          <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Ekle
        </button>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  };

  // MEB Planını Kullanıcı Planlarına Ekleme
  window.addMebPlanToMobile = (planId) => {
    const data = window.MEB_CURRICULUM_DATA || [];
    const mebPlan = data.find(p => p.id === planId);
    if (!mebPlan) {
      showMobileToast('Müfredat planı bulunamadı!', 'danger');
      return;
    }

    const classInput = document.getElementById('m-meb-plan-class');
    const className = (classInput && classInput.value.trim()) || `${mebPlan.grade}/A`;
    const courseName = mebPlan.course;

    // Zaten ekli mi kontrolü
    const existingPlans = (window.stateManager && window.stateManager.state && window.stateManager.state.plans) || [];
    const curClassLower = className.toLocaleLowerCase('tr-TR');
    const mebCourseLower = courseName.trim().toLocaleLowerCase('tr-TR');

    const isAlreadyAdded = existingPlans.some(ep => {
      const epClass = (ep.className || '').trim().toLocaleLowerCase('tr-TR');
      if (epClass !== curClassLower) return false;
      const epCourse = (ep.courseName || ep.title || '').trim().toLocaleLowerCase('tr-TR');
      return epCourse === mebCourseLower;
    });

    if (isAlreadyAdded) {
      showMobileToast(`"${courseName}" dersine ait ${className} planı zaten ekli!`, 'warning');
      return;
    }

    // Haftalık içerikleri dönüştür
    const weeklySchedule = [];
    const sourceWeeks = mebPlan.weeks || [];

    sourceWeeks.forEach((w, idx) => {
      weeklySchedule.push({
        id: 'w_' + (w.weekNum || (idx + 1)) + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        month: w.month ? String(w.month).toUpperCase() : '',
        weekNumber: [w.weekNum || (idx + 1)],
        weekLabel: w.weekLabel || `${w.weekNum || (idx + 1)}. Hafta`,
        dateRange: w.dateRange || '',
        startDate: null,
        endDate: null,
        classHours: w.classHours || 4,
        unitNo: null,
        unitName: w.unitName || '',
        learningOutcomes: Array.isArray(w.learningOutcomes) ? [...w.learningOutcomes] : (w.learningOutcomes ? [w.learningOutcomes] : []),
        topics: Array.isArray(w.topics) ? [...w.topics] : (w.topics ? [w.topics] : []),
        descriptions: [],
        specialDays: w.specialDays || '',
        assessment: Array.isArray(w.assessment) ? [...w.assessment] : (w.assessment ? [w.assessment] : []),
        isHoliday: false,
        isCompleted: false
      });
    });

    if (weeklySchedule.length === 0) {
      showMobileToast('Seçilen planda haftalık içerik bulunamadı!', 'danger');
      return;
    }

    const saved = window.stateManager ? window.stateManager.addPlan({
      title: `${className} - ${courseName}`,
      educationYear: '2026-2027',
      className: className,
      courseName: courseName,
      modelType: mebPlan.modelType || 'maarif',
      modelName: mebPlan.modelName || 'Türkiye Yüzyılı Maarif Modeli',
      weeklySchedule: weeklySchedule
    }) : null;

    if (saved) {
      window.openScheduleFlowModal('plans');
      updateLiveLessonCard();
      showMobileToast(`"${courseName}" (${className}) planı eklendi!`, 'success');
    }
  };

  // --------------------------------------------------------------------------
  // EXCEL DOSYASINDAN PLAN YÜKLEME
  // --------------------------------------------------------------------------
  window.handleMobilePlanExcelUpload = (event) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;

    if (!window.XLSX) {
      showMobileToast('Excel okuma modülü yüklenemedi!', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rows = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rows || rows.length < 2) {
          showMobileToast('Excel dosyasında yeterli veri bulunamadı!', 'warning');
          return;
        }

        // Basit akıllı sütun tespiti
        let weekCol = -1, dateCol = -1, unitCol = -1, topicCol = -1, outcomeCol = -1;
        let startRow = 1;

        // Başlık satırını ara (ilk 10 satırda)
        for (let r = 0; r < Math.min(10, rows.length); r++) {
          const row = rows[r];
          for (let c = 0; c < row.length; c++) {
            const val = String(row[c] || '').toLowerCase();
            if (val.includes('hafta') && weekCol === -1) weekCol = c;
            else if ((val.includes('tarih') || val.includes('ay')) && dateCol === -1) dateCol = c;
            else if ((val.includes('ünite') || val.includes('tema')) && unitCol === -1) unitCol = c;
            else if (val.includes('konu') && topicCol === -1) topicCol = c;
            else if ((val.includes('kazanım') || val.includes('çıktı')) && outcomeCol === -1) outcomeCol = c;
          }
          if (weekCol !== -1 && (topicCol !== -1 || outcomeCol !== -1)) {
            startRow = r + 1;
            break;
          }
        }

        if (weekCol === -1) weekCol = 0;
        if (topicCol === -1) topicCol = Math.min(2, (rows[0] ? rows[0].length - 1 : 0));
        if (outcomeCol === -1) outcomeCol = Math.min(3, (rows[0] ? rows[0].length - 1 : 0));

        const weeklySchedule = [];
        let weekNumCounter = 1;

        for (let r = startRow; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.every(cell => !cell)) continue;

          const rawWeek = String(row[weekCol] || '').trim();
          const rawDate = dateCol !== -1 ? String(row[dateCol] || '').trim() : '';
          const rawUnit = unitCol !== -1 ? String(row[unitCol] || '').trim() : '';
          const rawTopic = topicCol !== -1 ? String(row[topicCol] || '').trim() : '';
          const rawOutcome = outcomeCol !== -1 ? String(row[outcomeCol] || '').trim() : '';

          if (!rawTopic && !rawOutcome && !rawUnit) continue;

          weeklySchedule.push({
            id: 'w_' + weekNumCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            weekNumber: [weekNumCounter],
            weekLabel: rawWeek.includes('Hafta') ? rawWeek : `${weekNumCounter}. Hafta`,
            dateRange: rawDate,
            unitName: rawUnit,
            topics: rawTopic ? [rawTopic] : [],
            learningOutcomes: rawOutcome ? [rawOutcome] : [],
            descriptions: [],
            isHoliday: false,
            isCompleted: false
          });

          weekNumCounter++;
        }

        if (weeklySchedule.length === 0) {
          showMobileToast('Excel dosyasından haftalık plan satırları okunamadı.', 'danger');
          return;
        }

        const defaultClass = ((window.getActiveBranch && window.getActiveBranch()) !== 'all' ? window.getActiveBranch() : '4/A') || '4/A';
        const detectedCourse = file.name.replace(/\.[^/.]+$/, '').replace(/yıllık\s*plan|cerceve|taslak/gi, '').trim() || 'Yeni Ders';

        const courseName = prompt('Ders Adı:', detectedCourse) || detectedCourse;
        const className = prompt('Sınıf / Şube (örn: 4/A):', defaultClass) || defaultClass;

        if (window.stateManager) {
          window.stateManager.addPlan({
            title: `${className} - ${courseName}`,
            educationYear: '2026-2027',
            className: className,
            courseName: courseName,
            modelType: 'standard',
            modelName: 'Excel İçe Aktarım',
            weeklySchedule: weeklySchedule
          });
        }

        event.target.value = '';
        window.openScheduleFlowModal('plans');
        updateLiveLessonCard();
        showMobileToast(`"${courseName}" yıllık planı Excel'den başarıyla yüklendi! (${weeklySchedule.length} hafta)`, 'success');
      } catch (err) {
        console.error(err);
        showMobileToast('Excel dosyası okunurken hata oluştu!', 'danger');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --------------------------------------------------------------------------
  // YAPAY ZEKA İLE YILLIK PLAN ÜRETİMİ
  // --------------------------------------------------------------------------
  window.openAiPlanGeneratorModal = () => {
    const classInput = document.getElementById('m-ai-plan-class');
    if (classInput) {
      const activeBranch = (window.getActiveBranch && window.getActiveBranch()) || 'all';
      classInput.value = (activeBranch && activeBranch !== 'all') ? activeBranch : '4/A';
    }
    const statusBox = document.getElementById('m-ai-plan-status-box');
    if (statusBox) statusBox.style.display = 'none';

    openBottomSheet('modal-plan-ai-generator');
    if (window.lucide) window.lucide.createIcons();
  };

  window.generateAiPlanMobile = async () => {
    let apiKey = (localStorage.getItem('sinif_asistani_gemini_api_key') || '').trim();
    if (!apiKey) {
      const promptKey = prompt('Yapay zeka ile plan üretmek için lütfen Google Gemini API anahtarınızı girin:');
      if (promptKey && promptKey.trim()) {
        apiKey = promptKey.trim();
        localStorage.setItem('sinif_asistani_gemini_api_key', apiKey);
      } else {
        showMobileToast('Gemini API anahtarı tanımlanmadan yapay zeka kullanılamaz.', 'warning');
        return;
      }
    }

    const classInput = document.getElementById('m-ai-plan-class');
    const courseInput = document.getElementById('m-ai-plan-course');
    const hoursSelect = document.getElementById('m-ai-plan-hours');
    const styleSelect = document.getElementById('m-ai-plan-style');
    const notesInput = document.getElementById('m-ai-plan-notes');
    const statusBox = document.getElementById('m-ai-plan-status-box');
    const statusText = document.getElementById('m-ai-plan-status-text');
    const btnGenerate = document.getElementById('m-btn-generate-ai-plan');

    const className = (classInput && classInput.value.trim()) || '4/A';
    const courseName = (courseInput && courseInput.value.trim()) || '';
    const hours = (hoursSelect && hoursSelect.value) || '4';
    const style = (styleSelect && styleSelect.value) || 'maarif';
    const notes = (notesInput && notesInput.value.trim()) || '';

    if (!courseName) {
      showMobileToast('Lütfen plan oluşturulacak dersin adını girin!', 'warning');
      return;
    }

    if (statusBox) statusBox.style.display = 'block';
    if (statusText) statusText.textContent = `Yapay zeka ${className} ${courseName} dersi için 36 haftalık MEB müfredatını hazırlıyor...`;
    if (btnGenerate) btnGenerate.disabled = true;

    try {
      const promptText = `Sen Millî Eğitim Bakanlığı (MEB) müfredat uzmanısın.
Aşağıda bilgileri verilen ders ve sınıf için 2026-2027 eğitim-öğretim yılına ait 36 haftalık MEB müfredatına tam uyumlu bir YILLIK DERS PLANI hazırla.

DERS BİLGİLERİ:
- Ders Adı: ${courseName}
- Sınıf Düzeyi: ${className}
- Haftalık Ders Saati: ${hours}
- Model: ${style === 'maarif' ? 'Türkiye Yüzyılı Maarif Modeli' : 'Standart MEB'}
${notes ? `- Özel İstekler: ${notes}` : ''}

Yanıtını YALNIZCA geçerli bir JSON objesi olarak ver. Markdown kod bloğu vb. ekleme:
{
  "title": "${className} - ${courseName}",
  "educationYear": "2026-2027",
  "className": "${className}",
  "courseName": "${courseName}",
  "weeklySchedule": [
    {
      "weekNum": 1,
      "weekLabel": "1. Hafta",
      "month": "EYLÜL",
      "dateRange": "14 Eylül - 18 Eylül",
      "classHours": ${hours},
      "unitName": "1. Ünite",
      "learningOutcomes": ["Kazanım metni"],
      "topics": ["Konu"],
      "specialDays": "İlköğretim Haftası",
      "isHoliday": false
    }
  ]
}`;

      // Gemini çağrısı
      let responseJson = null;
      if (window.callGeminiAPI) {
        const rawRes = await window.callGeminiAPI(promptText, { json: true, temperature: 0.3 });
        let clean = rawRes.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
        const objM = clean.match(/\{[\s\S]*\}/);
        if (objM) clean = objM[0];
        responseJson = JSON.parse(clean);
      } else {
        // Doğrudan fetch ile çağır
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.3 }
          })
        });
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        let clean = rawText.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
        const objM = clean.match(/\{[\s\S]*\}/);
        if (objM) clean = objM[0];
        responseJson = JSON.parse(clean);
      }

      if (!responseJson || !responseJson.weeklySchedule || responseJson.weeklySchedule.length === 0) {
        throw new Error('Geçersiz plan yanıtı alındı.');
      }

      const finalSchedule = responseJson.weeklySchedule.map((w, idx) => ({
        id: 'w_' + (w.weekNum || (idx + 1)) + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        weekNumber: [w.weekNum || (idx + 1)],
        weekLabel: w.weekLabel || `${w.weekNum || (idx + 1)}. Hafta`,
        dateRange: w.dateRange || '',
        month: w.month || '',
        classHours: w.classHours || parseInt(hours) || 4,
        unitName: w.unitName || '',
        learningOutcomes: Array.isArray(w.learningOutcomes) ? w.learningOutcomes : (w.learningOutcomes ? [w.learningOutcomes] : []),
        topics: Array.isArray(w.topics) ? w.topics : (w.topics ? [w.topics] : []),
        descriptions: [],
        specialDays: w.specialDays || '',
        isHoliday: Boolean(w.isHoliday),
        isCompleted: false
      }));

      if (window.stateManager) {
        window.stateManager.addPlan({
          title: `${className} - ${courseName}`,
          educationYear: '2026-2027',
          className: className,
          courseName: courseName,
          modelType: style,
          modelName: style === 'maarif' ? 'Türkiye Yüzyılı Maarif Modeli' : 'Standart MEB Müfredatı',
          weeklySchedule: finalSchedule
        });
      }

      window.openScheduleFlowModal('plans');
      updateLiveLessonCard();
      showMobileToast(`"${courseName}" yıllık planı yapay zeka ile başarıyla oluşturuldu!`, 'success');
    } catch (err) {
      console.error(err);
      showMobileToast('Yapay zeka planı üretirken hata oluştu: ' + (err.message || 'Bilinmeyen hata'), 'danger');
    } finally {
      if (statusBox) statusBox.style.display = 'none';
      if (btnGenerate) btnGenerate.disabled = false;
    }
  };

  // --------------------------------------------------------------------------
  // 3. SEKME: DERS SAATLERİ VE TENEFFÜS SÜRELERİ
  // --------------------------------------------------------------------------
  function renderScheduleTimesTab(container) {
    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const isMiddle = state.educationLevel === 'middle';
    const periods = isMiddle
      ? ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']
      : ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

    const times = (window.stateManager && window.stateManager.getScheduleTimes()) || {};
    const lunchData = times['lunch'] || { start: '12:10', end: '13:00' };
    const hasLunch = times.lunch ? (times.lunch.enabled !== false && times.lunch.disabled !== true) : true;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <!-- Seviye Bilgisi -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--m-text);">Ders & Teneffüs Saatleri</div>
            <div style="font-size: 0.72rem; color: var(--m-text-muted);">
              ${isMiddle ? 'Ortaokul modu: Günde 7 ders saati' : 'İlkokul modu: Günde 6 ders saati'}
            </div>
          </div>
          <span class="m-badge" style="background: rgba(99, 102, 241, 0.12); color: var(--m-primary); font-weight: 800; font-size: 0.75rem; padding: 4px 8px; border-radius: 999px;">
            ${isMiddle ? '7 Ders' : '6 Ders'}
          </span>
        </div>

        <!-- Hızlı Dağıtım ve Teneffüs Sihirbazı Kartı -->
        <div class="m-item-card" style="padding: 1rem; border: 1.5px solid var(--m-border); background: var(--m-surface-subtle);">
          <div style="font-weight: 800; font-size: 0.88rem; color: var(--m-primary); margin-bottom: 0.65rem; display: flex; align-items: center; gap: 6px;">
            <span>⚡</span> Hızlı Saat & Teneffüs Dağıtımı
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 0.75rem;">
            <div>
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--m-text-muted); display: block; margin-bottom: 3px;">İlk Ders Başlangıç</label>
              <input type="time" class="m-form-input" id="m-wiz-start" value="${times['p1']?.start || '09:00'}" style="padding: 6px 8px; font-size: 0.85rem;">
            </div>
            <div>
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--m-text-muted); display: block; margin-bottom: 3px;">Ders Süresi</label>
              <select class="m-form-select" id="m-wiz-lesson-dur" style="padding: 6px 8px; font-size: 0.85rem;">
                <option value="35">35 Dakika</option>
                <option value="40" selected>40 Dakika</option>
                <option value="45">45 Dakika</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--m-text-muted); display: block; margin-bottom: 3px;">Teneffüs Süresi</label>
              <select class="m-form-select" id="m-wiz-recess-dur" style="padding: 6px 8px; font-size: 0.85rem;">
                <option value="10">10 Dakika</option>
                <option value="15" selected>15 Dakika</option>
                <option value="20">20 Dakika</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--m-text-muted); display: block; margin-bottom: 3px;">Öğle Arası (4. Ders Sonrası)</label>
              <select class="m-form-select" id="m-wiz-lunch-dur" style="padding: 6px 8px; font-size: 0.85rem;">
                <option value="40">40 Dakika</option>
                <option value="45" ${hasLunch ? 'selected' : ''}>45 Dakika</option>
                <option value="50">50 Dakika</option>
                <option value="0" ${!hasLunch ? 'selected' : ''}>Öğle Arası Yok</option>
              </select>
            </div>
          </div>
          <button class="subview-secondary-btn" style="width: 100%; justify-content: center; font-size: 0.8rem; padding: 7px;" onclick="window.calculateMobileScheduleTimes()">
            <i data-lucide="calculator" style="width: 15px; height: 15px;"></i> Saatleri Otomatik Dağıt
          </button>
        </div>

        <!-- Ders ve Teneffüs Saatleri Listesi -->
        <div style="font-weight: 800; font-size: 0.88rem; margin-top: 0.25rem;">Saat Çizelgesi (Giriş & Çıkış)</div>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${periods.map((pKey, idx) => {
            const pNum = idx + 1;
            const curP = times[pKey] || { start: '', end: '' };

            // Bu dersin başlangıcı ile önceki dersin bitişi arasındaki teneffüs süresi
            let recessHtml = '';
            if (idx > 0) {
              const prevPKey = periods[idx - 1];
              const prevEnd = times[prevPKey]?.end;
              const curStart = curP.start;
              let diffMin = 0;
              if (prevEnd && curStart) {
                const [ph, pm] = prevEnd.split(':').map(Number);
                const [ch, cm] = curStart.split(':').map(Number);
                diffMin = (ch * 60 + cm) - (ph * 60 + pm);
              }

              if (idx === 4) {
                if (hasLunch) {
                  recessHtml = `
                    <div class="m-recess-badge-row" style="color: var(--m-warning); font-weight: 800; background: rgba(245, 158, 11, 0.08); padding: 6px; border-radius: 8px;">
                      <span>🍴 Öğle Arası: ${diffMin > 0 ? diffMin + ' dk' : 'Öğle Tatili'}</span>
                    </div>
                  `;
                } else if (diffMin > 0) {
                  recessHtml = `
                    <div class="m-recess-badge-row">
                      <span>☕ ${diffMin} dk Teneffüs</span>
                    </div>
                  `;
                }
              } else if (diffMin > 0) {
                recessHtml = `
                  <div class="m-recess-badge-row">
                    <span>☕ ${diffMin} dk Teneffüs</span>
                  </div>
                `;
              }
            }

            return `
              ${recessHtml}
              <div class="m-time-slot-card">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="width: 24px; height: 24px; border-radius: 50%; background: var(--m-primary-light); color: var(--m-primary); font-weight: 800; font-size: 0.78rem; display: flex; align-items: center; justify-content: center;">
                    ${pNum}
                  </span>
                  <span style="font-weight: 800; font-size: 0.9rem; color: var(--m-text);">${pNum}. Ders</span>
                </div>
                <div class="m-time-input-box">
                  <input type="time" class="m-time-input m-time-start" data-period="${pKey}" value="${curP.start || ''}">
                  <span style="color: var(--m-text-light); font-weight: 800;">-</span>
                  <input type="time" class="m-time-input m-time-end" data-period="${pKey}" value="${curP.end || ''}">
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Kaydet Butonu -->
        <button class="subview-primary-action-btn" style="margin-top: 0.75rem;" onclick="window.saveMobileScheduleTimes()">
          <i data-lucide="check" style="width: 18px; height: 18px;"></i> Saatleri ve Teneffüsleri Kaydet
        </button>
      </div>
    `;
  }

  // Sihirbaz ile saatleri otomatik hesaplama
  window.calculateMobileScheduleTimes = () => {
    const startInput = document.getElementById('m-wiz-start');
    const lessonDurSelect = document.getElementById('m-wiz-lesson-dur');
    const recessDurSelect = document.getElementById('m-wiz-recess-dur');
    const lunchDurSelect = document.getElementById('m-wiz-lunch-dur');

    const startTimeStr = (startInput && startInput.value) || '09:00';
    const lessonDur = parseInt(lessonDurSelect ? lessonDurSelect.value : '40', 10) || 40;
    const recessDur = parseInt(recessDurSelect ? recessDurSelect.value : '15', 10) || 15;
    const lunchDur = parseInt(lunchDurSelect ? lunchDurSelect.value : '45', 10);

    const [sh, sm] = startTimeStr.split(':').map(Number);
    let curMinutes = sh * 60 + sm;

    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const isMiddle = state.educationLevel === 'middle';
    const periods = isMiddle
      ? ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']
      : ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

    const formatMins = (totalMins) => {
      const h = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const newTimes = {};

    periods.forEach((pKey, idx) => {
      const s = formatMins(curMinutes);
      curMinutes += lessonDur;
      const e = formatMins(curMinutes);
      newTimes[pKey] = { start: s, end: e };

      if (idx === 3 && lunchDur > 0) {
        newTimes['lunch'] = { start: e, end: formatMins(curMinutes + lunchDur), enabled: true, disabled: false };
        curMinutes += lunchDur;
      } else if (idx === 3 && lunchDur === 0) {
        newTimes['lunch'] = { start: e, end: e, enabled: false, disabled: true };
        curMinutes += recessDur;
      } else if (idx < periods.length - 1) {
        curMinutes += recessDur;
      }
    });

    if (window.stateManager) {
      window.stateManager.saveScheduleTimes(newTimes);
    }

    window.renderScheduleFlowContent();
    updateLiveLessonCard();
    showMobileToast('Saatler ve teneffüsler otomatik dağıtıldı!', 'success');
  };

  // Ders Saatlerini Kaydetme
  window.saveMobileScheduleTimes = () => {
    const startInputs = document.querySelectorAll('.m-time-start');
    const endInputs = document.querySelectorAll('.m-time-end');
    const timesUpdate = {};

    startInputs.forEach(input => {
      const pKey = input.getAttribute('data-period');
      if (!timesUpdate[pKey]) timesUpdate[pKey] = {};
      timesUpdate[pKey].start = input.value;
    });

    endInputs.forEach(input => {
      const pKey = input.getAttribute('data-period');
      if (!timesUpdate[pKey]) timesUpdate[pKey] = {};
      timesUpdate[pKey].end = input.value;
    });

    // 4. ders bitişi ile 5. ders başlangıcı arasını öğle arası olarak kaydet
    if (timesUpdate['p4']?.end && timesUpdate['p5']?.start) {
      timesUpdate['lunch'] = {
        start: timesUpdate['p4'].end,
        end: timesUpdate['p5'].start
      };
    }

    if (window.stateManager) {
      window.stateManager.saveScheduleTimes(timesUpdate);
    }

    window.renderScheduleFlowContent();
    updateLiveLessonCard();
    showMobileToast('Ders saatleri ve teneffüsler kaydedildi!', 'success');
  };

  // ==========================================================================
  // SINIF KATKI & TEDARİK TAKİBİ MODÜLÜ (MOBİL)
  // ==========================================================================

  let activeMobileSupplyType = 'material';
  let activeCurrentSupplyId = null;
  let activeSupplyFilter = 'all'; // 'all' | 'completed' | 'pending'
  let activeSupplySearchQuery = '';

  // 1. Ana Modalı Açma (Kampanyalar Listesi)
  window.openSuppliesModal = () => {
    const container = document.getElementById('m-supplies-list-container');
    if (!container) return;

    const contributions = (window.stateManager && window.stateManager.getContributions()) || [];
    const students = (window.stateManager && window.stateManager.getStudents()) || [];
    const totalStudents = students.length;

    if (contributions.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 3rem 1rem; text-align: center; background: var(--m-surface); border: 1.5px dashed var(--m-border); border-radius: var(--m-radius-md); margin-top: 0.5rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📦</div>
          <div style="font-weight: 800; font-size: 1.05rem; color: var(--m-text); margin-bottom: 0.25rem;">Henüz Katkı / Tedarik Takibi Yok</div>
          <div style="font-size: 0.8rem; color: var(--m-text-muted); max-width: 280px; margin: 0 auto 1.25rem; line-height: 1.4;">
            Sınıfınız için fotokopi kağıdı, kırtasiye malzemesi veya tiyatro/gezi ücreti toplama takibi başlatabilirsiniz.
          </div>
          <button class="subview-primary-action-btn" style="margin: 0 auto; width: auto; padding: 10px 20px;" onclick="window.openAddSupplyModal()">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i> İlk Listeyi Ekle
          </button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${contributions.map(item => {
            const records = item.records || {};
            let completedCount = 0;
            let totalCollectedMoney = 0;

            students.forEach(std => {
              const rec = records[std.id];
              if (rec) {
                if (rec.status === 'completed') {
                  completedCount++;
                  totalCollectedMoney += item.type === 'money' ? (rec.paidAmount || item.targetAmount || 0) : 0;
                } else if (rec.status === 'partial') {
                  totalCollectedMoney += Number(rec.paidAmount) || 0;
                }
              }
            });

            const percent = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;
            const isMoney = item.type === 'money';
            const dateStr = item.dueDate ? new Date(item.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : 'Süresiz';

            return `
              <div class="m-item-card" style="padding: 1rem; border: 1px solid var(--m-border); border-left: 4px solid ${isMoney ? '#10b981' : 'var(--m-primary)'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.3rem;">${isMoney ? '💵' : '📦'}</span>
                    <strong style="font-size: 0.95rem; color: var(--m-text);">${escapeHTML(item.title)}</strong>
                  </div>
                  <span class="m-badge" style="background: ${isMoney ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)'}; color: ${isMoney ? '#10b981' : 'var(--m-primary)'}; font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 999px;">
                    ${isMoney ? 'Maddi / Ücret' : 'Malzeme'}
                  </span>
                </div>

                <div style="font-size: 0.78rem; color: var(--m-text-muted); margin-bottom: 0.6rem; display: flex; align-items: center; gap: 8px;">
                  <span>${isMoney ? `Kişi Başı: <strong>${item.targetAmount || 0} ₺</strong>` : `Birim: <strong>${escapeHTML(item.materialUnit || '1 Adet')}</strong>`}</span>
                  <span>•</span>
                  <span>Son: ${dateStr}</span>
                </div>

                <!-- İlerleme Çubuğu -->
                <div style="display: flex; justify-content: space-between; font-size: 0.74rem; font-weight: 700; color: var(--m-text-secondary); margin-bottom: 3px;">
                  <span>Teslim Eden: ${completedCount} / ${totalStudents}</span>
                  <span>%${percent}</span>
                </div>
                <div style="width: 100%; height: 7px; background: var(--m-surface-subtle); border-radius: 999px; overflow: hidden; margin-bottom: 0.5rem;">
                  <div style="height: 100%; width: ${percent}%; background: ${isMoney ? '#10b981' : 'var(--m-primary)'}; border-radius: 999px; transition: width 0.3s ease;"></div>
                </div>

                ${isMoney ? `
                  <div style="font-size: 0.76rem; color: var(--m-text-muted); margin-bottom: 0.75rem;">
                    Toplanan: <strong style="color: #10b981;">${totalCollectedMoney} ₺</strong> / Hedef: ${(item.targetAmount || 0) * totalStudents} ₺
                  </div>
                ` : ''}

                <!-- Butonlar -->
                <div style="display: flex; gap: 6px; justify-content: flex-end; border-top: 1px solid var(--m-border-light, rgba(255,255,255,0.06)); padding-top: 0.65rem;">
                  <button class="subview-primary-action-btn" style="flex: 1; margin: 0; padding: 7px 12px; font-size: 0.8rem; border-radius: 8px;" onclick="window.openSupplyDetailModal('${item.id}')">
                    <i data-lucide="list-checks" style="width: 14px; height: 14px;"></i> Listeyi Aç
                  </button>
                  <button class="subview-secondary-btn" style="padding: 7px 10px; border-radius: 8px;" onclick="window.openEditSupplyModal('${item.id}')" title="Düzenle">
                    <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                  </button>
                  <button class="subview-danger-btn" style="padding: 7px 10px; border-radius: 8px;" onclick="window.deleteSupplyModal('${item.id}')" title="Sil">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    openBottomSheet('modal-supplies');
    if (window.lucide) window.lucide.createIcons();
  };

  // 2. Yeni Liste Ekleme Penceresini Açma
  window.openAddSupplyModal = () => {
    const editIdInput = document.getElementById('m-supply-edit-id');
    const titleInput = document.getElementById('m-supply-input-title');
    const materialInput = document.getElementById('m-supply-input-material');
    const amountInput = document.getElementById('m-supply-input-amount');
    const dueDateInput = document.getElementById('m-supply-input-due-date');
    const descInput = document.getElementById('m-supply-input-desc');
    const headerTitle = document.getElementById('m-add-supply-header-title');

    if (editIdInput) editIdInput.value = '';
    if (titleInput) titleInput.value = '';
    if (materialInput) materialInput.value = '1 Top A4 Kağıdı';
    if (amountInput) amountInput.value = '';
    if (dueDateInput) dueDateInput.value = '';
    if (descInput) descInput.value = '';
    if (headerTitle) headerTitle.textContent = '➕ Yeni Liste Ekle';

    window.selectMobileSupplyType('material');
    openBottomSheet('modal-add-supply');
    if (window.lucide) window.lucide.createIcons();
  };

  // 3. Takip Türü Seçimi (Malzeme vs. Ücret)
  window.selectMobileSupplyType = (type) => {
    activeMobileSupplyType = type;
    const matCard = document.getElementById('m-supply-type-material-card');
    const moneyCard = document.getElementById('m-supply-type-money-card');
    const groupMat = document.getElementById('m-supply-group-material');
    const groupMoney = document.getElementById('m-supply-group-money');

    if (type === 'money') {
      if (moneyCard) {
        moneyCard.style.borderColor = '#10b981';
        moneyCard.style.borderWidth = '2px';
        moneyCard.style.background = 'rgba(16, 185, 129, 0.1)';
      }
      if (matCard) {
        matCard.style.borderColor = 'var(--m-border)';
        matCard.style.borderWidth = '1px';
        matCard.style.background = 'var(--m-surface)';
      }
      if (groupMat) groupMat.style.display = 'none';
      if (groupMoney) groupMoney.style.display = 'block';
    } else {
      if (matCard) {
        matCard.style.borderColor = 'var(--m-primary)';
        matCard.style.borderWidth = '2px';
        matCard.style.background = 'rgba(99, 102, 241, 0.1)';
      }
      if (moneyCard) {
        moneyCard.style.borderColor = 'var(--m-border)';
        moneyCard.style.borderWidth = '1px';
        moneyCard.style.background = 'var(--m-surface)';
      }
      if (groupMat) groupMat.style.display = 'block';
      if (groupMoney) groupMoney.style.display = 'none';
    }
  };

  // 4. Yeni Listeyi / Düzenlemeyi Kaydetme
  window.saveSupplyCampaignFromMobile = () => {
    const titleInput = document.getElementById('m-supply-input-title');
    const materialInput = document.getElementById('m-supply-input-material');
    const amountInput = document.getElementById('m-supply-input-amount');
    const dueDateInput = document.getElementById('m-supply-input-due-date');
    const descInput = document.getElementById('m-supply-input-desc');
    const editIdInput = document.getElementById('m-supply-edit-id');

    const title = (titleInput && titleInput.value.trim()) || '';
    if (!title) {
      showMobileToast('Lütfen bir liste başlığı girin!', 'warning');
      return;
    }

    const type = activeMobileSupplyType || 'material';
    const materialUnit = (materialInput && materialInput.value.trim()) || '1 Adet';
    const targetAmount = Number(amountInput && amountInput.value) || 0;
    const dueDate = (dueDateInput && dueDateInput.value) || '';
    const description = (descInput && descInput.value.trim()) || '';
    const editId = editIdInput ? editIdInput.value : '';

    if (window.stateManager) {
      if (editId) {
        window.stateManager.updateContribution(editId, {
          title,
          type,
          materialUnit,
          targetAmount,
          dueDate,
          description
        });
        showMobileToast('Liste başarıyla güncellendi', 'success');
      } else {
        window.stateManager.addContribution({
          title,
          type,
          materialUnit,
          targetAmount,
          dueDate,
          description
        });
        showMobileToast('Yeni liste başarıyla eklendi', 'success');
      }
    }

    window.vibrate(15);
    window.openSuppliesModal();
  };

  // 5. Listeyi Düzenleme Penceresini Açma
  window.openEditSupplyModal = (contribId) => {
    const contributions = (window.stateManager && window.stateManager.getContributions()) || [];
    const item = contributions.find(c => c.id === contribId);
    if (!item) return;

    const editIdInput = document.getElementById('m-supply-edit-id');
    const titleInput = document.getElementById('m-supply-input-title');
    const materialInput = document.getElementById('m-supply-input-material');
    const amountInput = document.getElementById('m-supply-input-amount');
    const dueDateInput = document.getElementById('m-supply-input-due-date');
    const descInput = document.getElementById('m-supply-input-desc');
    const headerTitle = document.getElementById('m-add-supply-header-title');

    if (editIdInput) editIdInput.value = item.id;
    if (titleInput) titleInput.value = item.title;
    if (materialInput) materialInput.value = item.materialUnit || '';
    if (amountInput) amountInput.value = item.targetAmount || '';
    if (dueDateInput) dueDateInput.value = item.dueDate || '';
    if (descInput) descInput.value = item.description || '';
    if (headerTitle) headerTitle.textContent = '✏️ Listeyi Düzenle';

    window.selectMobileSupplyType(item.type || 'material');
    openBottomSheet('modal-add-supply');
    if (window.lucide) window.lucide.createIcons();
  };

  // 6. Listeyi Silme
  window.deleteSupplyModal = (contribId) => {
    const contributions = (window.stateManager && window.stateManager.getContributions()) || [];
    const item = contributions.find(c => c.id === contribId);
    if (!item) return;

    if (confirm(`"${item.title}" takibini silmek istediğinize emin misiniz?`)) {
      if (window.stateManager) {
        window.stateManager.deleteContribution(contribId);
      }
      showMobileToast('Liste silindi', 'info');
      window.vibrate(10);
      window.openSuppliesModal();
    }
  };

  // 7. Öğrenci Teslimat Takip Ekranını Açma
  window.openSupplyDetailModal = (contribId) => {
    activeCurrentSupplyId = contribId;
    activeSupplyFilter = 'all';
    activeSupplySearchQuery = '';

    const searchInput = document.getElementById('m-supply-student-search');
    if (searchInput) searchInput.value = '';

    renderSupplyDetailContent();
    openBottomSheet('modal-supply-detail');
    if (window.lucide) window.lucide.createIcons();
  };

  // Filtre Seçimi
  window.setSupplyFilter = (filter) => {
    activeSupplyFilter = filter;
    document.querySelectorAll('#m-supply-filter-chips .m-sched-day-chip').forEach(btn => {
      if (btn.getAttribute('data-filter') === filter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    renderSupplyDetailContent();
    window.vibrate(10);
  };

  // Arama Girişi
  window.filterSupplyStudentsList = () => {
    const searchInput = document.getElementById('m-supply-student-search');
    activeSupplySearchQuery = (searchInput && searchInput.value.toLowerCase().trim()) || '';
    renderSupplyDetailContent();
  };

  // Detay İçeriğini Çizme
  function renderSupplyDetailContent() {
    if (!activeCurrentSupplyId) return;

    const contributions = (window.stateManager && window.stateManager.getContributions()) || [];
    const item = contributions.find(c => c.id === activeCurrentSupplyId);
    if (!item) return;

    const students = (window.stateManager && window.stateManager.getStudents()) || [];
    const records = item.records || {};
    const isMoney = item.type === 'money';

    // Başlıklar
    const titleEl = document.getElementById('m-supply-detail-title');
    const subTitleEl = document.getElementById('m-supply-detail-subtitle');
    if (titleEl) titleEl.textContent = item.title;
    if (subTitleEl) {
      subTitleEl.textContent = `${isMoney ? '💵 Hedef: ' + item.targetAmount + ' ₺' : '📦 Birim: ' + (item.materialUnit || '1 Adet')} — ${students.length} Öğrenci`;
    }

    // İstatistik Sayımları
    let completedCount = 0;
    let pendingCount = 0;
    let totalMoney = 0;

    students.forEach(std => {
      const rec = records[std.id] || {};
      if (rec.status === 'completed') {
        completedCount++;
        totalMoney += isMoney ? (rec.paidAmount || item.targetAmount || 0) : 0;
      } else if (rec.status === 'partial') {
        pendingCount++;
        totalMoney += Number(rec.paidAmount) || 0;
      } else {
        pendingCount++;
      }
    });

    // İstatistik Alanı
    const statsContainer = document.getElementById('m-supply-detail-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr) ${isMoney ? '1.2fr' : ''}; gap: 6px;">
          <div class="m-item-card" style="padding: 6px; text-align: center;">
            <div style="font-size: 0.68rem; color: var(--m-text-muted);">Toplam</div>
            <strong style="font-size: 1.05rem; color: var(--m-text);">${students.length}</strong>
          </div>
          <div class="m-item-card" style="padding: 6px; text-align: center; border-left: 3px solid #10b981;">
            <div style="font-size: 0.68rem; color: var(--m-text-muted);">Teslim</div>
            <strong style="font-size: 1.05rem; color: #10b981;">${completedCount}</strong>
          </div>
          <div class="m-item-card" style="padding: 6px; text-align: center; border-left: 3px solid #f59e0b;">
            <div style="font-size: 0.68rem; color: var(--m-text-muted);">Bekleyen</div>
            <strong style="font-size: 1.05rem; color: #f59e0b;">${pendingCount}</strong>
          </div>
          ${isMoney ? `
            <div class="m-item-card" style="padding: 6px; text-align: center; border-left: 3px solid var(--m-primary);">
              <div style="font-size: 0.68rem; color: var(--m-text-muted);">Toplanan</div>
              <strong style="font-size: 1.05rem; color: var(--m-primary);">${totalMoney} ₺</strong>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Filtre Sayaçları
    const cntAll = document.getElementById('m-supply-cnt-all');
    const cntComp = document.getElementById('m-supply-cnt-comp');
    const cntPend = document.getElementById('m-supply-cnt-pend');
    if (cntAll) cntAll.textContent = students.length;
    if (cntComp) cntComp.textContent = completedCount;
    if (cntPend) cntPend.textContent = pendingCount;

    // Öğrencileri Filtrele ve Sırala
    const sortedStudents = [...students].sort((a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0));
    const filteredStudents = sortedStudents.filter(std => {
      const rec = records[std.id] || { status: 'pending' };
      const status = rec.status || 'pending';

      if (activeSupplyFilter === 'completed' && status !== 'completed') return false;
      if (activeSupplyFilter === 'pending' && status === 'completed') return false;

      if (activeSupplySearchQuery) {
        const full = `${std.number || ''} ${std.name || ''} ${std.surname || ''}`.toLowerCase();
        if (!full.includes(activeSupplySearchQuery)) return false;
      }
      return true;
    });

    // Öğrenci Listesi
    const listContainer = document.getElementById('m-supply-students-list');
    if (!listContainer) return;

    if (filteredStudents.length === 0) {
      listContainer.innerHTML = `
        <div style="padding: 2rem 1rem; text-align: center; color: var(--m-text-muted); font-size: 0.85rem;">
          Eşleşen öğrenci bulunamadı.
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filteredStudents.map(std => {
      const rec = records[std.id] || { status: 'pending', paidAmount: 0, note: '' };
      const status = rec.status || 'pending';
      const isCompleted = status === 'completed';
      const isPartial = status === 'partial';

      return `
        <div class="m-item-card" style="padding: 10px 12px; flex-direction: column; gap: 6px; border-left: 3.5px solid ${isCompleted ? '#10b981' : (isPartial ? '#f59e0b' : 'var(--m-border)')};">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; flex: 1; overflow: hidden;">
              <span style="font-weight: 800; font-size: 0.85rem; color: var(--m-primary); width: 32px; text-align: center; flex-shrink: 0;">
                ${escapeHTML(std.number || '-')}
              </span>
              <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <span style="font-weight: 700; font-size: 0.9rem; color: var(--m-text);">
                  ${escapeHTML(std.name)} ${escapeHTML(std.surname)}
                </span>
                <span style="font-size: 0.72rem; color: var(--m-text-muted); margin-left: 4px;">
                  (${escapeHTML(std.branch || '-')})
                </span>
              </div>
            </div>

            <!-- Durum Butonu -->
            ${isMoney ? `
              <button style="border: none; border-radius: 8px; font-weight: 800; font-size: 0.78rem; padding: 6px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; background: ${isCompleted ? 'rgba(16,185,129,0.15)' : (isPartial ? 'rgba(245,158,11,0.15)' : 'var(--m-surface-subtle)')}; color: ${isCompleted ? '#10b981' : (isPartial ? '#f59e0b' : 'var(--m-text-muted)')}; border: 1px solid ${isCompleted ? 'rgba(16,185,129,0.3)' : (isPartial ? 'rgba(245,158,11,0.3)' : 'var(--m-border)')};" onclick="window.promptSupplyPayment('${std.id}')">
                ${isCompleted ? `✓ Ödedi (${rec.paidAmount || item.targetAmount || 0}₺)` : (isPartial ? `⚡ Kısmi (${rec.paidAmount}₺)` : 'Ödemedi')}
              </button>
            ` : `
              <button style="border: none; border-radius: 8px; font-weight: 800; font-size: 0.78rem; padding: 6px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; background: ${isCompleted ? '#10b981' : 'var(--m-surface-subtle)'}; color: ${isCompleted ? '#ffffff' : 'var(--m-text-muted)'}; border: 1px solid ${isCompleted ? '#10b981' : 'var(--m-border)'};" onclick="window.toggleSupplyStudentStatus('${std.id}')">
                ${isCompleted ? '✓ Getirdi' : 'Bekliyor'}
              </button>
            `}
          </div>

          <!-- Not / Açıklama Satırı -->
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; color: var(--m-text-muted); border-top: 1px dashed var(--m-border-light, rgba(255,255,255,0.06)); padding-top: 4px; cursor: pointer;" onclick="window.promptSupplyStudentNote('${std.id}')">
            <span>${rec.note ? `💬 <em>${escapeHTML(rec.note)}</em>` : '💬 Not eklemek için dokunun...'}</span>
            <span style="font-weight: 600; color: var(--m-primary);">Düzenle</span>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // Malzeme Durumu Değiştirme (Getirdi / Bekliyor Toggle)
  window.toggleSupplyStudentStatus = (stdId) => {
    if (!activeCurrentSupplyId) return;
    const contributions = (window.stateManager && window.stateManager.getContributions()) || [];
    const item = contributions.find(c => c.id === activeCurrentSupplyId);
    if (!item) return;

    const records = item.records || {};
    const rec = records[stdId] || {};
    const newStatus = rec.status === 'completed' ? 'pending' : 'completed';

    if (window.stateManager) {
      window.stateManager.updateContributionStudentStatus(activeCurrentSupplyId, stdId, {
        status: newStatus,
        paidAmount: 0,
        note: rec.note || ''
      });
    }

    window.vibrate(10);
    renderSupplyDetailContent();
  };

  // Maddi / Para Ödeme Tutarı Girişi (Özel Modern Diyalog Penceresi)
  window.promptSupplyPayment = (stdId) => {
    if (!activeCurrentSupplyId) return;
    const contributions = (window.stateManager && window.stateManager.getContributions()) || [];
    const item = contributions.find(c => c.id === activeCurrentSupplyId);
    if (!item) return;

    const records = item.records || {};
    const rec = records[stdId] || {};
    const target = item.targetAmount || 0;
    const curPaid = rec.paidAmount || 0;
    const students = (window.stateManager && window.stateManager.getStudents()) || [];
    const std = students.find(s => s.id === stdId);
    const stdName = std ? `${std.name} ${std.surname || ''}`.trim() : 'Öğrenci';

    const dialog = document.getElementById('modal-supply-payment-dialog');
    const nameEl = document.getElementById('m-supply-payment-std-name');
    const labelEl = document.getElementById('m-supply-payment-label');
    const inputEl = document.getElementById('m-supply-payment-input');
    const idEl = document.getElementById('m-supply-payment-std-id');

    if (nameEl) nameEl.textContent = stdName;
    if (labelEl) labelEl.textContent = `Ödenen tutarı girin (Hedef: ${target} ₺):`;
    if (inputEl) inputEl.value = curPaid > 0 ? curPaid : (target > 0 ? target : '');
    if (idEl) idEl.value = stdId;

    if (dialog) {
      dialog.style.display = 'flex';
      window.vibrate(10);
      setTimeout(() => {
        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }
      }, 100);
    }
  };

  window.closeSupplyPaymentDialog = () => {
    const dialog = document.getElementById('modal-supply-payment-dialog');
    if (dialog) dialog.style.display = 'none';
  };

  window.saveSupplyPaymentDialog = () => {
    if (!activeCurrentSupplyId) return;
    const idEl = document.getElementById('m-supply-payment-std-id');
    const inputEl = document.getElementById('m-supply-payment-input');
    const stdId = idEl ? idEl.value : null;
    if (!stdId) return;

    const contributions = (window.stateManager && window.stateManager.getContributions()) || [];
    const item = contributions.find(c => c.id === activeCurrentSupplyId);
    if (!item) return;

    const records = item.records || {};
    const rec = records[stdId] || {};
    const target = item.targetAmount || 0;

    const amt = Number(inputEl ? inputEl.value : 0) || 0;
    const status = (target > 0 && amt >= target) ? 'completed' : (amt > 0 ? 'partial' : 'pending');

    if (window.stateManager) {
      window.stateManager.updateContributionStudentStatus(activeCurrentSupplyId, stdId, {
        status: status,
        paidAmount: amt,
        note: rec.note || ''
      });
    }

    window.closeSupplyPaymentDialog();
    window.vibrate(15);
    showMobileToast('✅ Ödeme kaydedildi', 'success');
    renderSupplyDetailContent();
  };

  // Öğrenciye Not Ekleme (Özel Modern Diyalog Penceresi)
  window.promptSupplyStudentNote = (stdId) => {
    if (!activeCurrentSupplyId) return;
    const contributions = (window.stateManager && window.stateManager.getContributions()) || [];
    const item = contributions.find(c => c.id === activeCurrentSupplyId);
    if (!item) return;

    const records = item.records || {};
    const rec = records[stdId] || {};
    const students = (window.stateManager && window.stateManager.getStudents()) || [];
    const std = students.find(s => s.id === stdId);
    const stdName = std ? `${std.name} ${std.surname || ''}`.trim() : 'Öğrenci';

    const dialog = document.getElementById('modal-supply-note-dialog');
    const nameEl = document.getElementById('m-supply-note-std-name');
    const inputEl = document.getElementById('m-supply-note-input');
    const idEl = document.getElementById('m-supply-note-std-id');

    if (nameEl) nameEl.textContent = stdName;
    if (inputEl) inputEl.value = rec.note || '';
    if (idEl) idEl.value = stdId;

    if (dialog) {
      dialog.style.display = 'flex';
      window.vibrate(10);
      setTimeout(() => {
        if (inputEl) inputEl.focus();
      }, 100);
    }
  };

  window.closeSupplyNoteDialog = () => {
    const dialog = document.getElementById('modal-supply-note-dialog');
    if (dialog) dialog.style.display = 'none';
  };

  window.saveSupplyNoteDialog = () => {
    if (!activeCurrentSupplyId) return;
    const idEl = document.getElementById('m-supply-note-std-id');
    const inputEl = document.getElementById('m-supply-note-input');
    const stdId = idEl ? idEl.value : null;
    if (!stdId) return;

    const note = inputEl ? inputEl.value.trim() : '';

    const contributions = (window.stateManager && window.stateManager.getContributions()) || [];
    const item = contributions.find(c => c.id === activeCurrentSupplyId);
    if (!item) return;

    const records = item.records || {};
    const rec = records[stdId] || {};

    if (window.stateManager) {
      window.stateManager.updateContributionStudentStatus(activeCurrentSupplyId, stdId, {
        status: rec.status || 'pending',
        paidAmount: rec.paidAmount || 0,
        note: note
      });
    }

    window.closeSupplyNoteDialog();
    window.vibrate(15);
    showMobileToast(note ? '✅ Teslimat notu kaydedildi' : 'Teslimat notu temizlendi');
    renderSupplyDetailContent();
  };

  // Tümünü Getirdi / Ödedi Olarak İşaretle
  window.markAllSupplyStudentsCompleted = () => {
    if (!activeCurrentSupplyId) return;
    const students = (window.stateManager && window.stateManager.getStudents()) || [];
    if (students.length === 0) return;

    if (confirm('Sınıftaki tüm öğrencileri "Getirdi / Ödedi" olarak işaretlemek istediğinize emin misiniz?')) {
      const studentIds = students.map(s => s.id);
      if (window.stateManager) {
        window.stateManager.batchUpdateContributionStatus(activeCurrentSupplyId, studentIds, 'completed');
      }
      showMobileToast('Tüm öğrenciler tamamlandı olarak işaretlendi!', 'success');
      window.vibrate(20);
      renderSupplyDetailContent();
    }
  };

  // ==========================================================================
  // 13. MODÜL: SINAVLAR & ANALİZ (YAZILI HAZIRLAMA + SINAV ANALİZİ)
  // ==========================================================================
  let activeExamsHubTab = 'analysis'; // 'analysis' veya 'creator'
  let activeGradeExamId = null;
  let activeAnalysisReportExamId = null;
  let activeCurrentWrittenExam = null;
  let activeQuestionUploadIndex = null;

  // LocalStorage / State Helper for Written Exams
  function getWrittenExamsSafe() {
    try {
      const fromStorage = localStorage.getItem('sa_written_exams');
      if (fromStorage) {
        return JSON.parse(fromStorage);
      }
    } catch (e) {
      console.warn('Written exams localStorage read error:', e);
    }
    const state = (window.stateManager && window.stateManager.state) || {};
    return state.writtenExams || [];
  }

  function saveWrittenExamsSafe(exams) {
    try {
      localStorage.setItem('sa_written_exams', JSON.stringify(exams));
    } catch (e) {
      console.warn('Written exams localStorage write error:', e);
    }
    if (window.stateManager && window.stateManager.state) {
      window.stateManager.state.writtenExams = exams;
      window.stateManager.saveState();
    }
  }

  // --- HUB YÖNETİMİ ---
  window.openExamsHubModal = (defaultView = 'analysis') => {
    activeExamsHubTab = defaultView;
    window.switchExamsHubTab(defaultView);
    openBottomSheet('modal-exams-hub');
    if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
  };

  window.switchExamsHubTab = (view) => {
    activeExamsHubTab = view;
    const viewAnalysis = document.getElementById('m-exams-view-analysis');
    const viewCreator = document.getElementById('m-exams-view-creator');
    const subtitle = document.getElementById('m-exams-active-tab-subtitle');
    const actionBtn = document.getElementById('m-exams-main-action-btn');
    const actionText = document.getElementById('m-exams-main-action-text');
    const fabItemAnalysis = document.getElementById('m-exams-fab-item-analysis');
    const fabItemCreator = document.getElementById('m-exams-fab-item-creator');
    const fabMenu = document.getElementById('m-exams-fab-menu');
    const fabBtn = document.getElementById('m-exams-fab-btn');

    if (fabMenu) fabMenu.classList.remove('show');
    if (fabBtn) fabBtn.classList.remove('active');

    if (view === 'analysis') {
      if (viewAnalysis) viewAnalysis.style.display = 'flex';
      if (viewCreator) viewCreator.style.display = 'none';
      if (subtitle) subtitle.textContent = '📊 Sınav Analizi';
      if (actionText) actionText.textContent = 'Sınav Tanımla';
      if (actionBtn) {
        actionBtn.onclick = () => window.openAddAnalysisExamModal();
      }
      if (fabItemAnalysis) fabItemAnalysis.classList.add('active');
      if (fabItemCreator) fabItemCreator.classList.remove('active');
      window.renderMobileExamAnalysis();
    } else {
      if (viewAnalysis) viewAnalysis.style.display = 'none';
      if (viewCreator) viewCreator.style.display = 'flex';
      if (subtitle) subtitle.textContent = '📝 Yazılı Hazırla';
      if (actionText) actionText.textContent = 'Sınav Oluştur';
      if (actionBtn) {
        actionBtn.onclick = () => window.openCreateWrittenExamModal();
      }
      if (fabItemAnalysis) fabItemAnalysis.classList.remove('active');
      if (fabItemCreator) fabItemCreator.classList.add('active');
      window.renderWrittenExamsList();
    }

    if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
  };

  window.toggleExamsFabMenu = () => {
    const fabMenu = document.getElementById('m-exams-fab-menu');
    const fabBtn = document.getElementById('m-exams-fab-btn');
    if (!fabMenu) return;
    const isShowing = fabMenu.classList.contains('show');
    if (isShowing) {
      fabMenu.classList.remove('show');
      if (fabBtn) fabBtn.classList.remove('active');
    } else {
      fabMenu.classList.add('show');
      if (fabBtn) fabBtn.classList.add('active');
    }
  };

  // ==========================================================================
  // SINAV ANALİZİ KONTROLCÜSÜ (EXAM ANALYSIS)
  // ==========================================================================
  window.renderMobileExamAnalysis = () => {
    const state = (window.stateManager && window.stateManager.state) || {};
    const exams = state.examAnalysisExams || [];
    const students = state.students || [];

    // İstatistik sayaçları
    const branches = [...new Set(students.map(s => s.branch).filter(Boolean))];
    const statExams = document.getElementById('m-ea-stat-total-exams');
    const statBranches = document.getElementById('m-ea-stat-total-branches');
    const statStudents = document.getElementById('m-ea-stat-total-students');

    if (statExams) statExams.textContent = exams.length;
    if (statBranches) statBranches.textContent = branches.length;
    if (statStudents) statStudents.textContent = students.length;

    const listContainer = document.getElementById('m-ea-exams-list');
    if (!listContainer) return;

    if (exams.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <div style="font-size: 2.8rem; margin-bottom: 8px;">📊</div>
          <div style="font-weight: 800; font-size: 0.95rem; color: var(--m-text); margin-bottom: 4px;">Kayıtlı Sınav Analizi Bulunamadı</div>
          <div style="font-size: 0.75rem; margin-bottom: 1rem; max-width: 280px; margin-left: auto; margin-right: auto;">
            Sınıflarınız için yazılı sınav analizleri tanımlayabilir, soru bazında kazanım ve başarı oranlarını inceleyebilirsiniz.
          </div>
          <button type="button" class="subview-primary-action-btn" onclick="window.openAddAnalysisExamModal()" style="display: inline-flex; width: auto; padding: 7px 16px; font-size: 0.8rem; border-radius: 20px;">
            <span>➕</span> <span>Yeni Sınav Tanımla</span>
          </button>
        </div>
      `;
      return;
    }

    const sortedExams = [...exams].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const allGrades = state.examAnalysisGrades || [];

    let html = '';
    sortedExams.forEach(exam => {
      const branchBadges = (exam.branches || []).map(b => `<span class="m-exam-badge m-exam-badge-primary">${b}</span>`).join(' ');
      const qCount = (exam.questions && exam.questions.length) || 0;
      const maxScore = exam.maxScore || 100;
      const examDate = exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('tr-TR') : '';

      // Şubelerdeki öğrenci sayısı
      const targetStudents = students.filter(s => (exam.branches || []).includes(s.branch));
      const examGrades = allGrades.filter(g => g.examId === exam.id);
      const gradedCount = examGrades.length;
      const progressPercent = targetStudents.length > 0 ? Math.min(100, Math.round((gradedCount / targetStudents.length) * 100)) : 0;

      html += `
        <div class="m-exam-card">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
            <div>
              <div style="font-weight: 800; font-size: 0.9rem; color: var(--m-text);">${exam.name}</div>
              <div style="font-size: 0.7rem; color: var(--m-text-muted); margin-top: 2px;">
                Tarih: ${examDate} &bull; ${qCount} Soru &bull; <strong>${maxScore} Puan</strong>
              </div>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end;">
              ${branchBadges}
            </div>
          </div>

          <!-- İlerleme Çubuğu -->
          <div style="margin-top: 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.68rem; font-weight: 700; color: var(--m-text-muted); margin-bottom: 3px;">
              <span>Not Girişi İlerlemesi</span>
              <span>${gradedCount} / ${targetStudents.length} (%${progressPercent})</span>
            </div>
            <div style="width: 100%; height: 6px; background: var(--m-border); border-radius: 3px; overflow: hidden;">
              <div style="width: ${progressPercent}%; height: 100%; background: ${progressPercent === 100 ? '#10b981' : 'var(--m-primary)'}; transition: width 0.3s ease;"></div>
            </div>
          </div>

          <!-- Eylemler -->
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            <button type="button" class="m-exam-action-btn primary" onclick="window.openGradeEntryModal('${exam.id}')">
              <span>📝</span> <span>Notlar</span>
            </button>
            <button type="button" class="m-exam-action-btn" onclick="window.openExamAnalysisReport('${exam.id}')">
              <span>📊</span> <span>Analiz</span>
            </button>
            <button type="button" class="m-exam-action-btn danger" style="flex: 0 0 38px;" onclick="window.deleteAnalysisExam('${exam.id}')" title="Sil">
              <span>🗑️</span>
            </button>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
  };

  // Yeni Sınav Tanımlama Modalı
  window.openAddAnalysisExamModal = () => {
    const state = (window.stateManager && window.stateManager.state) || {};
    const students = state.students || [];
    const branches = [...new Set(students.map(s => s.branch).filter(Boolean))].sort();

    const nameInput = document.getElementById('m-ea-name');
    const qCountInput = document.getElementById('m-ea-qcount');
    const branchesContainer = document.getElementById('m-ea-branches-container');

    if (nameInput) nameInput.value = '';
    if (qCountInput) qCountInput.value = '10';

    if (branchesContainer) {
      if (branches.length === 0) {
        branchesContainer.innerHTML = '<span style="color: var(--m-danger); font-size: 0.75rem;">Sınav tanımlamak için önce sınıfa şube tanımlı öğrenci eklemelisiniz.</span>';
      } else {
        branchesContainer.innerHTML = branches.map(b => `
          <label style="border: 1px solid var(--m-border); background: var(--m-surface-subtle); padding: 5px 10px; border-radius: 8px; font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; cursor: pointer;">
            <input type="checkbox" name="m-ea-branch-cb" value="${b}" checked style="accent-color: var(--m-primary);">
            <span>${b}</span>
          </label>
        `).join('');
      }
    }

    window.renderMobileEAQuestionInputs();
    openBottomSheet('modal-ea-add-exam');
  };

  window.closeAddAnalysisExamModal = () => {
    closeBottomSheet('modal-ea-add-exam');
  };

  window.renderMobileEAQuestionInputs = () => {
    const qCountInput = document.getElementById('m-ea-qcount');
    const container = document.getElementById('m-ea-questions-container');
    if (!qCountInput || !container) return;

    let qCount = parseInt(qCountInput.value) || 10;
    if (qCount < 1) qCount = 1;
    if (qCount > 50) qCount = 50;

    const basePoints = Math.floor(100 / qCount);
    const remainder = 100 % qCount;

    let html = '';
    for (let i = 1; i <= qCount; i++) {
      const defaultPts = i <= remainder ? basePoints + 1 : basePoints;
      html += `
        <div style="display: grid; grid-template-columns: 50px 70px 1fr; gap: 6px; align-items: center;">
          <div style="font-weight: 800; font-size: 0.75rem; color: var(--m-text);">Soru ${i}</div>
          <input type="number" class="m-form-input m-ea-q-pts-input" data-qnum="${i}" value="${defaultPts}" min="1" max="100" oninput="window.calcMobileEATotalPoints()" style="padding: 4px 6px; text-align: center; font-size: 0.8rem; font-weight: 700;">
          <input type="text" class="m-form-input m-ea-q-outcome-input" data-qnum="${i}" placeholder="Kazanım açıklaması (opsiyonel)" style="padding: 4px 8px; font-size: 0.76rem;">
        </div>
      `;
    }
    container.innerHTML = html;
    window.calcMobileEATotalPoints();
  };

  window.calcMobileEATotalPoints = () => {
    const ptsInputs = document.querySelectorAll('.m-ea-q-pts-input');
    let sum = 0;
    ptsInputs.forEach(inp => {
      sum += parseInt(inp.value) || 0;
    });
    const badge = document.getElementById('m-ea-total-points-badge');
    if (badge) {
      badge.textContent = `Toplam: ${sum} Puan`;
      badge.style.color = sum === 100 ? '#10b981' : '#f59e0b';
    }
    return sum;
  };

  window.saveNewAnalysisExam = () => {
    const nameInput = document.getElementById('m-ea-name');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      showMobileToast('Lütfen sınav adı giriniz!', 'warning');
      return;
    }

    const branchCbs = document.querySelectorAll('input[name="m-ea-branch-cb"]:checked');
    const branches = Array.from(branchCbs).map(cb => cb.value);
    if (branches.length === 0) {
      showMobileToast('Lütfen en az bir şube seçiniz!', 'warning');
      return;
    }

    const totalScore = window.calcMobileEATotalPoints();
    const configItems = document.querySelectorAll('.m-ea-q-pts-input');
    const questions = [];

    configItems.forEach(inp => {
      const qNum = parseInt(inp.getAttribute('data-qnum'));
      const maxPoints = parseInt(inp.value) || 0;
      const outcomeInp = document.querySelector(`.m-ea-q-outcome-input[data-qnum="${qNum}"]`);
      const outcome = outcomeInp ? outcomeInp.value.trim() : '';

      questions.push({
        number: qNum,
        maxPoints,
        outcome: outcome || `Soru ${qNum} Kazanımı`
      });
    });

    const newExam = {
      id: 'exam_' + Date.now(),
      name,
      branches,
      questions,
      maxScore: totalScore,
      createdAt: new Date().toISOString()
    };

    const state = (window.stateManager && window.stateManager.state) || {};
    if (!state.examAnalysisExams) state.examAnalysisExams = [];
    state.examAnalysisExams.push(newExam);
    if (window.stateManager) window.stateManager.saveState();

    window.closeAddAnalysisExamModal();
    window.renderMobileExamAnalysis();
    showMobileToast('✅ Sınav analizi oluşturuldu!', 'success');

    // Doğrudan not girişini aç
    setTimeout(() => {
      window.openGradeEntryModal(newExam.id);
    }, 250);
  };

  window.deleteAnalysisExam = (examId) => {
    if (confirm('Bu sınavı ve kayıtlı tüm notlarını kalıcı olarak silmek istediğinize emin misiniz?')) {
      const state = (window.stateManager && window.stateManager.state) || {};
      state.examAnalysisExams = (state.examAnalysisExams || []).filter(e => e.id !== examId);
      state.examAnalysisGrades = (state.examAnalysisGrades || []).filter(g => g.examId !== examId);
      if (window.stateManager) window.stateManager.saveState();
      window.renderMobileExamAnalysis();
      showMobileToast('Sınav ve notları silindi', 'info');
    }
  };

  // --- NOT GİRİŞİ MODALI ---
  window.openGradeEntryModal = (examId, targetBranch = null) => {
    activeGradeExamId = examId;
    const state = (window.stateManager && window.stateManager.state) || {};
    const exam = (state.examAnalysisExams || []).find(e => e.id === examId);
    if (!exam) return;

    const titleEl = document.getElementById('m-ea-grades-exam-title');
    const subEl = document.getElementById('m-ea-grades-exam-subtitle');
    const branchSelect = document.getElementById('m-ea-grades-branch-select');

    if (titleEl) titleEl.textContent = exam.name;
    if (subEl) subEl.textContent = `${(exam.questions || []).length} Soru &bull; Toplam ${exam.maxScore} Puan`;

    if (branchSelect) {
      branchSelect.innerHTML = (exam.branches || []).map(b => `<option value="${b}">${b} Şubesi</option>`).join('');
      if (targetBranch && (exam.branches || []).includes(targetBranch)) {
        branchSelect.value = targetBranch;
      }
    }

    window.renderMobileGradeGrid();
    openBottomSheet('modal-ea-grades');
  };

  window.closeGradeEntryModal = () => {
    closeBottomSheet('modal-ea-grades');
    window.renderMobileExamAnalysis();
  };

  window.renderMobileGradeGrid = () => {
    const state = (window.stateManager && window.stateManager.state) || {};
    const exam = (state.examAnalysisExams || []).find(e => e.id === activeGradeExamId);
    const branchSelect = document.getElementById('m-ea-grades-branch-select');
    const table = document.getElementById('m-ea-grades-table');
    if (!exam || !branchSelect || !table) return;

    const branch = branchSelect.value;
    const allStudents = state.students || [];
    const branchStudents = allStudents.filter(s => s.branch === branch);

    branchStudents.sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0));

    if (branchStudents.length === 0) {
      table.innerHTML = `<tr><td style="text-align: center; padding: 2rem; color: var(--m-text-muted);">Bu şubede (${branch}) kayıtlı öğrenci bulunamadı.</td></tr>`;
      return;
    }

    const allGrades = state.examAnalysisGrades || [];
    const questions = exam.questions || [];

    // Başlıklar
    let thead = '<thead><tr>';
    thead += '<th style="text-align: left; min-width: 130px; position: sticky; left: 0; background: var(--m-surface-subtle); z-index: 12;">Öğrenci</th>';
    questions.forEach(q => {
      thead += `<th style="min-width: 52px; text-align: center;">S${q.number}<div style="font-size: 0.65rem; color: var(--m-text-muted); font-weight: normal;">(${q.maxPoints}p)</div></th>`;
    });
    thead += '<th style="min-width: 54px; text-align: center;">Durum</th>';
    thead += '<th style="min-width: 60px; text-align: center; font-weight: 800; background: var(--m-surface-subtle);">Toplam</th>';
    thead += '</tr></thead>';

    // Gövde
    let tbody = '<tbody>';
    branchStudents.forEach(st => {
      const gradeRec = allGrades.find(g => g.examId === exam.id && g.studentId === st.id);
      const isAbsent = gradeRec ? !!gradeRec.isAbsent : false;
      const scores = (gradeRec && gradeRec.questionScores) || {};
      const totalScore = gradeRec ? gradeRec.totalScore : 0;

      tbody += `<tr id="m-ea-row-${st.id}" class="${isAbsent ? 'grade-row-absent' : ''}" data-studentid="${st.id}">`;
      tbody += `
        <td style="position: sticky; left: 0; background: var(--m-surface); z-index: 5; font-weight: 700; white-space: nowrap;">
          <span style="color: var(--m-primary);">${st.number}</span> ${st.name} ${(st.surname || '')}
        </td>
      `;

      questions.forEach(q => {
        const val = (!isAbsent && scores[q.number] !== undefined) ? scores[q.number] : '';
        tbody += `
          <td style="text-align: center;">
            <input type="number" 
                   class="m-grade-cell-input m-ea-score-input" 
                   data-qnum="${q.number}" 
                   data-max="${q.maxPoints}" 
                   value="${val}" 
                   ${isAbsent ? 'disabled' : ''} 
                   min="0" 
                   max="${q.maxPoints}"
                   oninput="window.calcMobileRowTotal('${st.id}')">
          </td>
        `;
      });

      tbody += `
        <td style="text-align: center;">
          <button type="button" class="m-btn-sm" onclick="window.toggleMobileStudentAbsent('${st.id}')" style="font-size: 0.68rem; font-weight: 800; padding: 4px 6px; border-radius: 6px; background: ${isAbsent ? '#ef4444' : 'var(--m-surface-subtle)'}; color: ${isAbsent ? 'white' : 'var(--m-text)'}; border: 1px solid var(--m-border);">
            ${isAbsent ? 'GİRMEDİ' : 'GİRDİ'}
          </button>
        </td>
        <td id="m-ea-total-${st.id}" style="text-align: center; font-weight: 800; font-size: 0.88rem; color: ${isAbsent ? '#ef4444' : 'var(--m-text)'};">
          ${isAbsent ? 'G' : totalScore}
        </td>
      `;
      tbody += '</tr>';
    });
    tbody += '</tbody>';

    table.innerHTML = thead + tbody;
  };

  window.calcMobileRowTotal = (studentId) => {
    const row = document.getElementById(`m-ea-row-${studentId}`);
    const totalCell = document.getElementById(`m-ea-total-${studentId}`);
    if (!row || !totalCell) return;

    const inputs = row.querySelectorAll('.m-ea-score-input');
    let sum = 0;
    let anyInvalid = false;

    inputs.forEach(inp => {
      const valStr = inp.value.trim();
      const max = parseFloat(inp.getAttribute('data-max')) || 0;
      if (valStr !== '') {
        const val = parseFloat(valStr);
        if (isNaN(val) || val < 0 || val > max) {
          inp.classList.add('invalid');
          anyInvalid = true;
        } else {
          inp.classList.remove('invalid');
          sum += val;
        }
      } else {
        inp.classList.remove('invalid');
      }
    });

    totalCell.textContent = anyInvalid ? 'Hata' : sum;
    totalCell.style.color = anyInvalid ? '#ef4444' : 'var(--m-text)';
  };

  window.toggleMobileStudentAbsent = (studentId) => {
    const row = document.getElementById(`m-ea-row-${studentId}`);
    const totalCell = document.getElementById(`m-ea-total-${studentId}`);
    if (!row) return;

    const isAbsent = !row.classList.contains('grade-row-absent');
    const inputs = row.querySelectorAll('.m-ea-score-input');
    const btn = row.querySelector('button');

    if (isAbsent) {
      row.classList.add('grade-row-absent');
      inputs.forEach(inp => {
        inp.disabled = true;
        inp.value = '';
        inp.classList.remove('invalid');
      });
      if (btn) {
        btn.textContent = 'GİRMEDİ';
        btn.style.background = '#ef4444';
        btn.style.color = 'white';
      }
      if (totalCell) {
        totalCell.textContent = 'G';
        totalCell.style.color = '#ef4444';
      }
    } else {
      row.classList.remove('grade-row-absent');
      inputs.forEach(inp => {
        inp.disabled = false;
      });
      if (btn) {
        btn.textContent = 'GİRDİ';
        btn.style.background = 'var(--m-surface-subtle)';
        btn.style.color = 'var(--m-text)';
      }
      window.calcMobileRowTotal(studentId);
    }
  };

  window.autoFillMobileZeros = () => {
    const table = document.getElementById('m-ea-grades-table');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr:not(.grade-row-absent)');
    rows.forEach(row => {
      const inputs = row.querySelectorAll('.m-ea-score-input');
      const studentId = row.getAttribute('data-studentid');
      inputs.forEach(inp => {
        if (inp.value.trim() === '') {
          inp.value = '0';
        }
      });
      if (studentId) window.calcMobileRowTotal(studentId);
    });
    showMobileToast('Boş alanlara 0 yazıldı');
  };

  window.saveMobileGrades = () => {
    const state = (window.stateManager && window.stateManager.state) || {};
    const exam = (state.examAnalysisExams || []).find(e => e.id === activeGradeExamId);
    if (!exam) return;

    const table = document.getElementById('m-ea-grades-table');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    let hasError = false;

    if (!state.examAnalysisGrades) state.examAnalysisGrades = [];

    rows.forEach(row => {
      const studentId = row.getAttribute('data-studentid');
      const isAbsent = row.classList.contains('grade-row-absent');
      const inputs = row.querySelectorAll('.m-ea-score-input');

      const questionScores = {};
      let totalScore = 0;

      if (!isAbsent) {
        inputs.forEach(inp => {
          const qNum = parseInt(inp.getAttribute('data-qnum'));
          const max = parseFloat(inp.getAttribute('data-max')) || 0;
          const valStr = inp.value.trim();

          if (valStr !== '') {
            const score = parseFloat(valStr);
            if (isNaN(score) || score < 0 || score > max) {
              inp.classList.add('invalid');
              hasError = true;
            } else {
              questionScores[qNum] = score;
              totalScore += score;
            }
          } else {
            questionScores[qNum] = 0;
          }
        });
      }

      // Mevcut kaydı güncelle veya ekle
      state.examAnalysisGrades = state.examAnalysisGrades.filter(
        g => !(g.examId === exam.id && g.studentId === studentId)
      );

      state.examAnalysisGrades.push({
        examId: exam.id,
        studentId,
        questionScores: isAbsent ? {} : questionScores,
        isAbsent,
        totalScore: isAbsent ? 0 : totalScore
      });
    });

    if (hasError) {
      showMobileToast('Puanlarda hata var! Kırmızı kutuları düzeltiniz.', 'warning');
      return;
    }

    if (window.stateManager) window.stateManager.saveState();
    showMobileToast('✅ Notlar başarıyla kaydedildi!', 'success');
  };

  // --- SINAV ANALİZ VE RAPORU ---
  function calculateExamStats(examId) {
    const state = (window.stateManager && window.stateManager.state) || {};
    const exam = (state.examAnalysisExams || []).find(e => e.id === examId);
    if (!exam) return null;

    const participatingStudents = (state.students || []).filter(s => (exam.branches || []).includes(s.branch));
    const grades = (state.examAnalysisGrades || []).filter(g => g.examId === examId);

    const gradeMap = {};
    grades.forEach(g => { gradeMap[g.studentId] = g; });

    let participantCount = 0;
    let absentCount = 0;
    const scores = [];
    const branchScores = {};
    (exam.branches || []).forEach(b => { branchScores[b] = []; });

    participatingStudents.forEach(st => {
      const g = gradeMap[st.id];
      const isAbsent = g ? !!g.isAbsent : true;
      if (g && !isAbsent) {
        participantCount++;
        scores.push(g.totalScore);
        if (branchScores[st.branch]) branchScores[st.branch].push(g.totalScore);
      } else {
        absentCount++;
      }
    });

    const sum = scores.reduce((a, b) => a + b, 0);
    const average = scores.length > 0 ? (sum / scores.length) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;

    let stdDev = 0;
    if (scores.length > 1) {
      const variance = scores.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / (scores.length - 1);
      stdDev = Math.sqrt(variance);
    }

    const branchAverages = {};
    (exam.branches || []).forEach(b => {
      const bScores = branchScores[b] || [];
      const bSum = bScores.reduce((acc, curr) => acc + curr, 0);
      branchAverages[b] = bScores.length > 0 ? parseFloat((bSum / bScores.length).toFixed(1)) : 0;
    });

    const validGrades = grades.filter(g => !g.isAbsent);
    const questionStats = (exam.questions || []).map(q => {
      const qNum = q.number;
      let qSum = 0;
      let fullMarksCount = 0;

      validGrades.forEach(g => {
        const val = g.questionScores && g.questionScores[qNum] !== undefined ? g.questionScores[qNum] : 0;
        qSum += val;
        if (val === q.maxPoints) fullMarksCount++;
      });

      const qAvg = validGrades.length > 0 ? (qSum / validGrades.length) : 0;
      const successPercent = q.maxPoints > 0 ? (qAvg / q.maxPoints) * 100 : 0;

      let difficulty = 'Orta';
      if (successPercent >= 80) difficulty = 'Çok Kolay';
      else if (successPercent >= 60) difficulty = 'Kolay';
      else if (successPercent >= 40) difficulty = 'Orta';
      else if (successPercent >= 20) difficulty = 'Zor';
      else difficulty = 'Çok Zor';

      return {
        number: qNum,
        maxPoints: q.maxPoints,
        averagePoints: parseFloat(qAvg.toFixed(2)),
        successPercent: parseFloat(successPercent.toFixed(1)),
        difficulty,
        outcome: q.outcome || `Soru ${qNum} Kazanımı`,
        fullMarksCount
      };
    });

    return {
      exam,
      totalCount: participatingStudents.length,
      participantCount,
      absentCount,
      average: parseFloat(average.toFixed(1)),
      maxScore,
      minScore,
      stdDev: parseFloat(stdDev.toFixed(1)),
      branchAverages,
      questionStats
    };
  }

  window.openExamAnalysisReport = (examId) => {
    activeAnalysisReportExamId = examId;
    const stats = calculateExamStats(examId);
    if (!stats) return;

    const titleEl = document.getElementById('m-ea-report-title');
    const subEl = document.getElementById('m-ea-report-subtitle');
    const content = document.getElementById('m-ea-report-content');

    if (titleEl) titleEl.textContent = stats.exam.name;
    if (subEl) subEl.textContent = `Şubeler: ${(stats.exam.branches || []).join(', ')} &bull; ${stats.exam.questions.length} Soru`;

    let html = `
      <!-- Özet Kartlar -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 1rem;">
        <div style="background: var(--m-surface-subtle); border: 1px solid var(--m-border); border-radius: 10px; padding: 10px; text-align: center;">
          <div style="font-size: 0.7rem; color: var(--m-text-muted); font-weight: 700;">Katılım Durumu</div>
          <div style="font-size: 1.2rem; font-weight: 800; color: var(--m-text); margin: 2px 0;">${stats.participantCount} / ${stats.totalCount}</div>
          <div style="font-size: 0.65rem; color: #ef4444;">${stats.absentCount} Öğrenci Girmedi</div>
        </div>

        <div style="background: var(--m-surface-subtle); border: 1px solid var(--m-border); border-radius: 10px; padding: 10px; text-align: center;">
          <div style="font-size: 0.7rem; color: var(--m-text-muted); font-weight: 700;">Genel Başarı Ort.</div>
          <div style="font-size: 1.2rem; font-weight: 800; color: var(--m-primary); margin: 2px 0;">%${stats.average}</div>
          <div style="font-size: 0.65rem; color: var(--m-text-muted);">Standart Sapma: ${stats.stdDev}</div>
        </div>

        <div style="background: var(--m-surface-subtle); border: 1px solid var(--m-border); border-radius: 10px; padding: 10px; text-align: center;">
          <div style="font-size: 0.7rem; color: var(--m-text-muted); font-weight: 700;">En Yüksek Not</div>
          <div style="font-size: 1.2rem; font-weight: 800; color: #10b981; margin: 2px 0;">${stats.maxScore}</div>
          <div style="font-size: 0.65rem; color: var(--m-text-muted);">${stats.exam.maxScore} üzerinden</div>
        </div>

        <div style="background: var(--m-surface-subtle); border: 1px solid var(--m-border); border-radius: 10px; padding: 10px; text-align: center;">
          <div style="font-size: 0.7rem; color: var(--m-text-muted); font-weight: 700;">En Düşük Not</div>
          <div style="font-size: 1.2rem; font-weight: 800; color: #f59e0b; margin: 2px 0;">${stats.minScore}</div>
          <div style="font-size: 0.65rem; color: var(--m-text-muted);">${stats.exam.maxScore} üzerinden</div>
        </div>
      </div>

      <!-- Şube Bazlı Ortalamalar -->
      <div style="background: var(--m-surface); border: 1px solid var(--m-border); border-radius: 12px; padding: 12px; margin-bottom: 1rem;">
        <div style="font-weight: 800; font-size: 0.85rem; color: var(--m-text); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
          <span>🏫</span> <span>Şube Bazlı Başarı Ortalamaları</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    Object.keys(stats.branchAverages).forEach(b => {
      const avg = stats.branchAverages[b];
      html += `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.76rem; font-weight: 700; color: var(--m-text); margin-bottom: 3px;">
            <span>${b} Şubesi</span>
            <span style="color: var(--m-primary);">%${avg}</span>
          </div>
          <div style="width: 100%; height: 8px; background: var(--m-surface-subtle); border-radius: 4px; overflow: hidden; border: 1px solid var(--m-border);">
            <div style="width: ${Math.min(100, avg)}%; height: 100%; background: linear-gradient(90deg, var(--m-primary), #6366f1); border-radius: 4px;"></div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>

      <!-- Soru & Kazanım Analizi Tablosu -->
      <div style="background: var(--m-surface); border: 1px solid var(--m-border); border-radius: 12px; padding: 12px;">
        <div style="font-weight: 800; font-size: 0.85rem; color: var(--m-text); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
          <span>🎯</span> <span>Soru ve Kazanım Analizi</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    stats.questionStats.forEach(qs => {
      let diffBadgeColor = '#10b981';
      if (qs.difficulty === 'Zor' || qs.difficulty === 'Çok Zor') diffBadgeColor = '#ef4444';
      else if (qs.difficulty === 'Orta') diffBadgeColor = '#f59e0b';

      html += `
        <div style="background: var(--m-surface-subtle); border: 1px solid var(--m-border); border-radius: 8px; padding: 8px 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 800; font-size: 0.82rem; color: var(--m-text);">Soru ${qs.number}</span>
              <span style="font-size: 0.68rem; color: var(--m-text-muted);">(${qs.maxPoints} Puan)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 0.68rem; font-weight: 700; color: ${diffBadgeColor}; background: rgba(0,0,0,0.05); padding: 1px 6px; border-radius: 4px;">${qs.difficulty}</span>
              <span style="font-weight: 800; font-size: 0.85rem; color: var(--m-primary);">%${qs.successPercent}</span>
            </div>
          </div>
          <div style="font-size: 0.72rem; color: var(--m-text-muted); font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif; margin-bottom: 6px;">
            ${qs.outcome}
          </div>
          <div style="width: 100%; height: 6px; background: var(--m-border); border-radius: 3px; overflow: hidden;">
            <div style="width: ${Math.min(100, qs.successPercent)}%; height: 100%; background: ${qs.successPercent >= 60 ? '#10b981' : (qs.successPercent >= 40 ? '#f59e0b' : '#ef4444')};"></div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    if (content) content.innerHTML = html;
    openBottomSheet('modal-ea-report');
  };

  window.closeExamReportModal = () => {
    closeBottomSheet('modal-ea-report');
  };

  window.printMobileExamReport = () => {
    if (!activeAnalysisReportExamId) return;
    const stats = calculateExamStats(activeAnalysisReportExamId);
    if (!stats) return;

    const printContainer = document.querySelector('.exam-report-print');
    if (!printContainer) return;

    let rowsHtml = '';
    stats.questionStats.forEach(qs => {
      rowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: bold;">Soru ${qs.number}</td>
          <td>${qs.outcome}</td>
          <td style="text-align: center;">${qs.maxPoints}</td>
          <td style="text-align: center;">${qs.averagePoints}</td>
          <td style="text-align: center; font-weight: bold;">%${qs.successPercent}</td>
          <td style="text-align: center;">${qs.difficulty}</td>
        </tr>
      `;
    });

    printContainer.innerHTML = `
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="margin: 0; font-size: 16pt; text-transform: uppercase;">YAZILI SINAV ANALİZ VE DEĞERLENDİRME RAPORU</h2>
        <h3 style="margin: 4px 0; font-size: 13pt;">${stats.exam.name}</h3>
        <p style="margin: 4px 0; font-size: 9pt; color: #444;">Şubeler: ${(stats.exam.branches || []).join(', ')} &nbsp;|&nbsp; Soru Sayısı: ${stats.exam.questions.length} &nbsp;|&nbsp; Tarih: ${new Date(stats.exam.createdAt).toLocaleDateString('tr-TR')}</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 9.5pt;">
        <div><strong>Toplam Öğrenci:</strong> ${stats.totalCount}</div>
        <div><strong>Katılan:</strong> ${stats.participantCount}</div>
        <div><strong>Girmedi (G):</strong> ${stats.absentCount}</div>
        <div><strong>Genel Başarı:</strong> %${stats.average}</div>
        <div><strong>En Yüksek:</strong> ${stats.maxScore}</div>
        <div><strong>En Düşük:</strong> ${stats.minScore}</div>
      </div>

      <h4 style="margin: 12px 0 6px 0; font-size: 11pt; border-bottom: 1px solid #ccc; padding-bottom: 4px;">SORU VE KAZANIM ANALİZİ</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;" border="1">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 6px;">Soru</th>
            <th style="padding: 6px;">Kazanım / Açıklama</th>
            <th style="padding: 6px;">Puan</th>
            <th style="padding: 6px;">Ortalama</th>
            <th style="padding: 6px;">Başarı (%)</th>
            <th style="padding: 6px;">Zorluk</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 9.5pt;">
        <div style="text-align: center; width: 200px;">
          <div>.....................................</div>
          <div style="font-weight: bold; margin-top: 4px;">Ders Öğretmeni</div>
          <div>İmza</div>
        </div>
        <div style="text-align: center; width: 200px;">
          <div>.....................................</div>
          <div style="font-weight: bold; margin-top: 4px;">Okul Müdürü</div>
          <div>İmza / Mühür</div>
        </div>
      </div>
    `;

    document.body.classList.add('print-exam-report');
    if (window.AndroidBridge && typeof window.AndroidBridge.printDocument === 'function') {
      window.AndroidBridge.printDocument("Sinav_Analiz_Raporu");
    } else {
      window.print();
    }

    setTimeout(() => {
      document.body.classList.remove('print-exam-report');
    }, 4000);
  };

  // ==========================================================================
  // SINAV HAZIRLAMA KONTROLCÜSÜ (WRITTEN EXAM CREATOR)
  // ==========================================================================
  window.renderWrittenExamsList = () => {
    const listContainer = document.getElementById('m-we-exams-list');
    if (!listContainer) return;

    const exams = getWrittenExamsSafe();

    if (exams.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--m-text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 6px;">📄</div>
          <div style="font-weight: 800; font-size: 0.95rem; color: var(--m-text); margin-bottom: 4px;">Kayıtlı Yazılı Kağıdı Yok</div>
          <div style="font-size: 0.75rem; margin-bottom: 1rem; max-width: 280px; margin-left: auto; margin-right: auto;">
            A4 kağıdı düzeninde, Maarif modeli kazanımlı veya klasik MEB sınavları hazırlayıp yazdırabilir ya da doğrudan sınav analizine aktarabilirsiniz.
          </div>
          <button type="button" class="subview-primary-action-btn" onclick="window.openCreateWrittenExamModal()" style="display: inline-flex; width: auto; padding: 7px 16px; font-size: 0.8rem; border-radius: 20px;">
            <span>➕</span> <span>Yeni Sınav Oluştur</span>
          </button>
        </div>
      `;
      return;
    }

    const sorted = [...exams].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    let html = '';

    sorted.forEach(we => {
      const modeBadge = we.maarifMode
        ? '<span class="m-exam-badge m-exam-badge-primary">Maarif Modeli</span>'
        : '<span class="m-exam-badge m-exam-badge-info">Klasik MEB</span>';
      const colBadge = we.columnsCount === '2'
        ? '<span class="m-exam-badge m-exam-badge-warning">Çift Sütun</span>'
        : '<span class="m-exam-badge m-exam-badge-success">Tek Sütun</span>';
      const dateStr = we.createdAt ? new Date(we.createdAt).toLocaleDateString('tr-TR') : '';

      html += `
        <div class="m-exam-card">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
            <div>
              <div style="font-weight: 800; font-size: 0.9rem; color: var(--m-text);">${we.title}</div>
              <div style="font-size: 0.7rem; color: var(--m-text-muted); margin-top: 2px;">
                Tarih: ${dateStr} &bull; ${we.questionCount} Soru &bull; Süre: ${we.duration || '40 dk'}
              </div>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end;">
              ${modeBadge}
              ${colBadge}
            </div>
          </div>

          <!-- Eylemler -->
          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <button type="button" class="m-exam-action-btn primary" onclick="window.viewWrittenExam('${we.id}')">
              <span>👁️</span> <span>Görüntüle</span>
            </button>
            <button type="button" class="m-exam-action-btn" onclick="window.printWrittenExamSheet('${we.id}')">
              <span>🖨️</span> <span>Yazdır/PDF</span>
            </button>
            <button type="button" class="m-exam-action-btn" onclick="window.transferWrittenExamToAnalysis('${we.id}')" title="Sınav Analizine Aktar" style="color: #10b981;">
              <span>🔗</span> <span>Analize Aktar</span>
            </button>
            <button type="button" class="m-exam-action-btn danger" style="flex: 0 0 38px;" onclick="window.deleteWrittenExam('${we.id}')" title="Sil">
              <span>🗑️</span>
            </button>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
  };

  // Yeni Yazılı Sınavı Oluşturma Formu
  window.openCreateWrittenExamModal = () => {
    const titleInp = document.getElementById('m-we-title');
    const schoolInp = document.getElementById('m-we-school');
    const yearInp = document.getElementById('m-we-year');
    const qCountInp = document.getElementById('m-we-qcount');
    const columnsInp = document.getElementById('m-we-columns');
    const durationInp = document.getElementById('m-we-duration');
    const pointsInp = document.getElementById('m-we-points-descr');
    const teacherInp = document.getElementById('m-we-teacher');

    if (titleInp) titleInp.value = '1. DÖNEM 1. YAZILI SINAVI';
    if (schoolInp) schoolInp.value = '................................ ORTAOKULU';
    if (yearInp) yearInp.value = '2025-2026 EĞİTİM ÖĞRETİM YILI';
    if (qCountInp) qCountInp.value = '10';
    if (columnsInp) columnsInp.value = '1';
    if (durationInp) durationInp.value = '40 Dakika';
    if (pointsInp) pointsInp.value = 'Her soru 10 puandır.';
    if (teacherInp) teacherInp.value = 'Ders Öğretmeni';

    window.toggleMaarifMode(true);
    window.renderMaarifKazanimInputs();
    openBottomSheet('modal-create-written-exam');
  };

  window.closeCreateWrittenExamModal = () => {
    closeBottomSheet('modal-create-written-exam');
  };

  window.toggleMaarifMode = (isMaarif) => {
    const box = document.getElementById('m-we-maarif-kazanimlar-box');
    const lblMaarif = document.getElementById('lbl-we-mode-maarif');
    const lblKlasik = document.getElementById('lbl-we-mode-klasik');

    if (box) box.style.display = isMaarif ? 'block' : 'none';

    if (lblMaarif && lblKlasik) {
      if (isMaarif) {
        lblMaarif.style.border = '2px solid var(--m-primary)';
        lblMaarif.style.background = 'rgba(99, 102, 241, 0.08)';
        lblKlasik.style.border = '1px solid var(--m-border)';
        lblKlasik.style.background = 'var(--m-surface-subtle)';
      } else {
        lblKlasik.style.border = '2px solid var(--m-primary)';
        lblKlasik.style.background = 'rgba(99, 102, 241, 0.08)';
        lblMaarif.style.border = '1px solid var(--m-border)';
        lblMaarif.style.background = 'var(--m-surface-subtle)';
      }
    }

    if (isMaarif) window.renderMaarifKazanimInputs();
  };

  window.handleWrittenExamQCountChange = () => {
    const qCountInp = document.getElementById('m-we-qcount');
    const pointsInp = document.getElementById('m-we-points-descr');
    const qCount = parseInt(qCountInp.value) || 10;

    if (pointsInp) {
      const perPts = Math.round(100 / (qCount > 0 ? qCount : 10));
      pointsInp.value = `Her soru ${perPts} puandır.`;
    }

    window.renderMaarifKazanimInputs();
  };

  window.renderMaarifKazanimInputs = () => {
    const qCountInp = document.getElementById('m-we-qcount');
    const list = document.getElementById('m-we-kazanimlar-inputs-list');
    if (!qCountInp || !list) return;

    let qCount = parseInt(qCountInp.value) || 10;
    if (qCount < 1) qCount = 1;
    if (qCount > 25) qCount = 25;

    let html = '';
    for (let i = 1; i <= qCount; i++) {
      html += `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 800; font-size: 0.74rem; color: var(--m-primary); min-width: 48px;">Soru ${i}:</span>
          <input type="text" class="m-form-input m-we-kazanim-field" data-qidx="${i}" placeholder="Kazanım kod veya açıklaması yazın..." style="padding: 4px 8px; font-size: 0.74rem;">
        </div>
      `;
    }
    list.innerHTML = html;
  };

  window.generateWrittenExamSheet = () => {
    const titleInp = document.getElementById('m-we-title');
    const schoolInp = document.getElementById('m-we-school');
    const yearInp = document.getElementById('m-we-year');
    const qCountInp = document.getElementById('m-we-qcount');
    const columnsInp = document.getElementById('m-we-columns');
    const durationInp = document.getElementById('m-we-duration');
    const pointsInp = document.getElementById('m-we-points-descr');
    const teacherInp = document.getElementById('m-we-teacher');
    const modeRadio = document.querySelector('input[name="m-we-curriculum-mode"]:checked');

    const title = titleInp ? titleInp.value.trim() : 'YAZILI SINAVI';
    const school = schoolInp ? schoolInp.value.trim() : 'ORTAOKULU';
    const year = yearInp ? yearInp.value.trim() : '2025-2026 EĞİTİM ÖĞRETİM YILI';
    let qCount = parseInt(qCountInp.value) || 10;
    if (qCount < 1) qCount = 1;
    if (qCount > 25) qCount = 25;
    const columns = columnsInp ? columnsInp.value : '1';
    const isMaarif = modeRadio ? modeRadio.value === 'maarif' : true;
    const duration = durationInp ? durationInp.value.trim() : '40 Dakika';
    const pointsDescr = pointsInp ? pointsInp.value.trim() : `Her soru ${Math.round(100/qCount)} puandır.`;
    const teacher = teacherInp ? teacherInp.value.trim() : 'Ders Öğretmeni';

    // Kazanımları topla
    const questionKazanimlar = {};
    if (isMaarif) {
      document.querySelectorAll('.m-we-kazanim-field').forEach(field => {
        const qidx = parseInt(field.getAttribute('data-qidx'));
        const val = field.value.trim();
        if (val) questionKazanimlar[qidx] = val;
      });
    }

    const perPoints = Math.round(100 / qCount);
    const questionPoints = {};
    for (let i = 1; i <= qCount; i++) {
      questionPoints[i] = perPoints;
    }

    const newWe = {
      id: 'we_' + Date.now(),
      title,
      schoolName: school,
      schoolYear: year,
      questionCount: qCount,
      columnsCount: columns,
      maarifMode: isMaarif,
      questionKazanimlar,
      duration,
      pointsDescription: pointsDescr,
      questionPoints,
      teacherName: teacher,
      questionTexts: {},
      questionImages: {},
      questionScales: {},
      createdAt: new Date().toISOString()
    };

    const exams = getWrittenExamsSafe();
    exams.push(newWe);
    saveWrittenExamsSafe(exams);

    window.closeCreateWrittenExamModal();
    window.viewWrittenExam(newWe.id);
    showMobileToast('✅ Sınav oluşturuldu!', 'success');
  };

  // --- YAZILI SINAV ÖNİZLEME VE DÜZENLEME ---
  window.viewWrittenExam = (examId) => {
    const exams = getWrittenExamsSafe();
    const we = exams.find(e => e.id === examId);
    if (!we) return;

    activeCurrentWrittenExam = we;

    const previewTitle = document.getElementById('m-we-preview-title');
    if (previewTitle) previewTitle.textContent = we.title;

    window.renderWrittenExamPaper(we);
    openBottomSheet('modal-view-written-exam');
  };

  window.closeViewWrittenExamModal = () => {
    closeBottomSheet('modal-view-written-exam');
    window.renderWrittenExamsList();
  };

  window.renderWrittenExamPaper = (we) => {
    const paper = document.getElementById('m-we-paper-preview');
    if (!paper) return;

    const isTwoCols = we.columnsCount === '2';
    const pointsPerQ = we.questionPoints && we.questionPoints[1] ? we.questionPoints[1] : Math.round(100 / we.questionCount);

    let html = `
      <!-- Üst Başlık -->
      <div class="m-we-header">
        <div class="m-we-school-name" contenteditable="true" onblur="window.updateWrittenExamField('schoolName', this.innerText)">${we.schoolName}</div>
        <div class="m-we-school-year" contenteditable="true" onblur="window.updateWrittenExamField('schoolYear', this.innerText)">${we.schoolYear}</div>
        <div class="m-we-title" contenteditable="true" onblur="window.updateWrittenExamField('title', this.innerText)">${we.title}</div>
      </div>

      <!-- Öğrenci Bilgi Tablosu -->
      <table class="m-we-student-table">
        <tr>
          <td style="width: 50%;"><strong>Adı Soyadı:</strong> .................................................</td>
          <td style="width: 25%;"><strong>Sınıf/Şube:</strong> ...... / ......</td>
          <td style="width: 25%;"><strong>Okul No:</strong> .............</td>
        </tr>
      </table>

      <!-- Sorular Izgarası -->
      <div class="m-we-questions-grid ${isTwoCols ? 'cols-2' : ''}">
    `;

    for (let i = 1; i <= we.questionCount; i++) {
      const qPts = (we.questionPoints && we.questionPoints[i]) || pointsPerQ;
      const kazanim = (we.questionKazanimlar && we.questionKazanimlar[i]) || '';
      const text = (we.questionTexts && we.questionTexts[i]) || '';
      const img = (we.questionImages && we.questionImages[i]) || null;
      const scale = (we.questionScales && we.questionScales[i]) || 1.0;
      const imgHeight = Math.round(140 * scale);

      let kazanimHtml = '';
      if (we.maarifMode) {
        kazanimHtml = `
          <div class="m-we-q-kazanim-text" contenteditable="true" onblur="window.updateQuestionKazanim(${i}, this.innerText)" title="Kazanımı düzenlemek için dokunun">
            ${kazanim ? kazanim : 'Kazanım giriniz...'}
          </div>
        `;
      }

      let imgContent = '';
      if (img) {
        imgContent = `
          <div style="position: relative; display: inline-block; max-width: 100%;">
            <img src="${img}" style="height: ${imgHeight}px; max-width: 100%; object-fit: contain; border-radius: 4px;">
            <div class="m-we-q-tools" style="display: flex; gap: 4px; justify-content: center; margin-top: 4px;">
              <button type="button" class="m-btn-sm" onclick="window.scaleQuestionImage(${i}, -0.15)" style="padding: 2px 7px; font-weight: 800; font-size: 0.7rem; background: var(--m-surface); border: 1px solid var(--m-border); border-radius: 4px;">-</button>
              <span style="font-size: 0.68rem; font-weight: 700; align-self: center;">%${Math.round(scale * 100)}</span>
              <button type="button" class="m-btn-sm" onclick="window.scaleQuestionImage(${i}, 0.15)" style="padding: 2px 7px; font-weight: 800; font-size: 0.7rem; background: var(--m-surface); border: 1px solid var(--m-border); border-radius: 4px;">+</button>
              <button type="button" class="m-btn-sm" onclick="window.removeQuestionImage(${i})" style="padding: 2px 7px; font-weight: 800; font-size: 0.7rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 4px;">Kaldır</button>
            </div>
          </div>
        `;
      } else {
        imgContent = `
          <div class="m-we-image-slot empty" onclick="window.triggerQuestionPhotoUpload(${i})" style="cursor: pointer;">
            <div style="font-size: 0.74rem; font-weight: 700; color: var(--m-primary); display: flex; align-items: center; gap: 4px;">
              <span>📷</span> <span>Görsel / Fotoğraf Ekle</span>
            </div>
          </div>
        `;
      }

      html += `
        <div class="m-we-question-item" data-qnum="${i}">
          <div class="m-we-q-topbar">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span class="m-we-q-num">SORU ${i})</span>
              ${kazanimHtml}
            </div>
            <span class="m-we-q-points">[${qPts} Puan]</span>
          </div>

          <textarea class="m-we-text-editor" placeholder="Soru metnini buraya yazın..." oninput="window.handleQuestionTextChange(${i}, this.value)">${text}</textarea>

          <div style="margin-top: 4px;">
            ${imgContent}
          </div>

          <!-- Yanıt Alanı Boşluğu -->
          <div style="height: 38px; border-bottom: 1px dashed #e2e8f0; width: 100%; margin-top: 4px;"></div>
        </div>
      `;
    }

    html += `
      </div>

      <!-- Alt Bilgi -->
      <div class="m-we-footer">
        <div style="line-height: 1.4;">
          <div><strong>Sınav Süresi:</strong> ${we.duration}</div>
          <div><strong>Değerlendirme:</strong> ${we.pointsDescription}</div>
        </div>
        <div style="text-align: center; line-height: 1.4;">
          <div style="font-weight: 800;">${we.teacherName}</div>
          <div style="font-size: 7.5pt; color: #64748b; margin-top: 12px;">İmza / Başarılar Dilerim.</div>
        </div>
      </div>
    `;

    paper.innerHTML = html;
  };

  window.updateWrittenExamField = (field, val) => {
    if (!activeCurrentWrittenExam) return;
    activeCurrentWrittenExam[field] = val.trim();
  };

  window.updateQuestionKazanim = (qNum, val) => {
    if (!activeCurrentWrittenExam) return;
    if (!activeCurrentWrittenExam.questionKazanimlar) activeCurrentWrittenExam.questionKazanimlar = {};
    activeCurrentWrittenExam.questionKazanimlar[qNum] = val.trim();
  };

  window.handleQuestionTextChange = (qNum, val) => {
    if (!activeCurrentWrittenExam) return;
    if (!activeCurrentWrittenExam.questionTexts) activeCurrentWrittenExam.questionTexts = {};
    activeCurrentWrittenExam.questionTexts[qNum] = val;
  };

  window.triggerQuestionPhotoUpload = (qNum) => {
    activeQuestionUploadIndex = qNum;
    const inp = document.getElementById('m-we-question-photo-input');
    if (inp) {
      inp.value = '';
      inp.click();
    }
  };

  window.handleWrittenExamPhotoSelected = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file || !activeCurrentWrittenExam || !activeQuestionUploadIndex) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Optimize canvas
        const canvas = document.createElement('canvas');
        const maxW = 1000;
        let w = img.width;
        let h = img.height;
        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);

        if (!activeCurrentWrittenExam.questionImages) activeCurrentWrittenExam.questionImages = {};
        activeCurrentWrittenExam.questionImages[activeQuestionUploadIndex] = compressedBase64;

        window.renderWrittenExamPaper(activeCurrentWrittenExam);
        window.saveCurrentWrittenExam();
        showMobileToast(`Soru ${activeQuestionUploadIndex} görseli eklendi`, 'success');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.scaleQuestionImage = (qNum, delta) => {
    if (!activeCurrentWrittenExam) return;
    if (!activeCurrentWrittenExam.questionScales) activeCurrentWrittenExam.questionScales = {};
    let cur = activeCurrentWrittenExam.questionScales[qNum] || 1.0;
    cur = Math.max(0.4, Math.min(2.5, cur + delta));
    activeCurrentWrittenExam.questionScales[qNum] = parseFloat(cur.toFixed(2));
    window.renderWrittenExamPaper(activeCurrentWrittenExam);
  };

  window.removeQuestionImage = (qNum) => {
    if (!activeCurrentWrittenExam) return;
    if (activeCurrentWrittenExam.questionImages) {
      delete activeCurrentWrittenExam.questionImages[qNum];
    }
    if (activeCurrentWrittenExam.questionScales) {
      delete activeCurrentWrittenExam.questionScales[qNum];
    }
    window.renderWrittenExamPaper(activeCurrentWrittenExam);
    window.saveCurrentWrittenExam();
    showMobileToast(`Soru ${qNum} görseli kaldırıldı`, 'info');
  };

  window.saveCurrentWrittenExam = () => {
    if (!activeCurrentWrittenExam) return;
    const exams = getWrittenExamsSafe();
    const idx = exams.findIndex(e => e.id === activeCurrentWrittenExam.id);
    if (idx >= 0) {
      exams[idx] = activeCurrentWrittenExam;
    } else {
      exams.push(activeCurrentWrittenExam);
    }
    saveWrittenExamsSafe(exams);
    showMobileToast('💾 Sınav kağıdı kaydedildi', 'success');
  };

  window.printCurrentWrittenExam = () => {
    if (!activeCurrentWrittenExam) return;
    window.saveCurrentWrittenExam();

    const printContainer = document.querySelector('.written-exam-print');
    const paper = document.getElementById('m-we-paper-preview');
    if (!printContainer || !paper) return;

    printContainer.innerHTML = paper.outerHTML;

    document.body.classList.add('print-written-exam');
    if (window.AndroidBridge && typeof window.AndroidBridge.printDocument === 'function') {
      window.AndroidBridge.printDocument("Yazili_Sinav_Kagidi");
    } else {
      window.print();
    }

    setTimeout(() => {
      document.body.classList.remove('print-written-exam');
    }, 4000);
  };

  window.printWrittenExamSheet = (examId) => {
    const exams = getWrittenExamsSafe();
    const we = exams.find(e => e.id === examId);
    if (!we) return;
    window.viewWrittenExam(examId);
    setTimeout(() => {
      window.printCurrentWrittenExam();
    }, 200);
  };

  window.transferCurrentWrittenExamToAnalysis = () => {
    if (!activeCurrentWrittenExam) return;
    window.transferWrittenExamToAnalysis(activeCurrentWrittenExam.id);
  };

  window.transferWrittenExamToAnalysis = (examId) => {
    const exams = getWrittenExamsSafe();
    const we = exams.find(e => e.id === examId);
    if (!we) return;

    const state = (window.stateManager && window.stateManager.state) || {};
    const students = state.students || [];
    const branches = [...new Set(students.map(s => s.branch).filter(Boolean))];

    const questions = [];
    const basePts = Math.round(100 / we.questionCount);

    for (let i = 1; i <= we.questionCount; i++) {
      const pts = (we.questionPoints && we.questionPoints[i]) || basePts;
      const kaz = (we.questionKazanimlar && we.questionKazanimlar[i]) || `Soru ${i} Kazanımı`;
      questions.push({
        number: i,
        maxPoints: pts,
        outcome: kaz
      });
    }

    const newAnalysisExam = {
      id: 'exam_' + Date.now(),
      name: we.title,
      branches: branches.length > 0 ? branches : ['A'],
      questions,
      maxScore: 100,
      createdAt: new Date().toISOString()
    };

    if (!state.examAnalysisExams) state.examAnalysisExams = [];
    state.examAnalysisExams.push(newAnalysisExam);
    if (window.stateManager) window.stateManager.saveState();

    window.closeViewWrittenExamModal();
    window.switchExamsHubTab('analysis');

    showMobileToast('🔗 Sınav Analizi modülüne aktarıldı!', 'success');

    setTimeout(() => {
      if (confirm('Sınav analizi modülüne aktarıldı. Şimdi bu sınav için not girişi yapmak ister misiniz?')) {
        window.openGradeEntryModal(newAnalysisExam.id);
      }
    }, 300);
  };

  window.deleteWrittenExam = (examId) => {
    if (confirm('Bu sınav kağıdını silmek istediğinize emin misiniz?')) {
      let exams = getWrittenExamsSafe();
      exams = exams.filter(e => e.id !== examId);
      saveWrittenExamsSafe(exams);
      window.renderWrittenExamsList();
      showMobileToast('Sınav kağıdı silindi', 'info');
    }
  };

  // Global Dışa Aktarımlar
  window.switchTab = switchTab;
  window.showMobileToast = showMobileToast;
})();


