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
  let hwMode = 'list'; // 'list' veya 'walk'
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

  window.isMiddleSchool = isMiddleSchool;
  window.isStudentInCurrentLevel = isStudentInCurrentLevel;

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
    const btnHwModeOrder = document.getElementById('btn-hw-mode-order');
    if (btnHwModeWalk) {
      btnHwModeWalk.addEventListener('click', () => {
        hwMode = 'walk';
        btnHwModeWalk.classList.add('active');
        if (btnHwModeList) btnHwModeList.classList.remove('active');
        if (btnHwModeOrder) btnHwModeOrder.style.display = 'inline-flex';
        renderHomeworkTab();
      });
    }
    if (btnHwModeList) {
      btnHwModeList.addEventListener('click', () => {
        hwMode = 'list';
        btnHwModeList.classList.add('active');
        if (btnHwModeWalk) btnHwModeWalk.classList.remove('active');
        if (btnHwModeOrder) btnHwModeOrder.style.display = 'none';
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

      // Yüzen menü butonuna tıklandığında titremeyi derhal durdur
      const clickedFab = e.target.closest('.mobile-fab-btn');
      if (clickedFab) {
        cancelFabAttention(clickedFab);
      }
    });
  }

  // ==========================================================================
  // YÜZEN MENÜ DİKKAT ÇEKME & TİTREME MOTORU (FAB ATTENTION ON ARRIVAL)
  // Sayfaya ilk gelindiğinde yüzen menü birkaç kez titreyerek kendini fark ettirir.
  // ==========================================================================
  const fabLastTriggered = new Map();
  const fabActiveTimeouts = new Map();

  function triggerFabArrivalAttention(target, delay = 450) {
    if (!target) return;
    const btn = (typeof target === 'string')
      ? document.getElementById(target)
      : (target.classList && target.classList.contains('mobile-fab-btn'))
        ? target
        : (target.querySelector ? target.querySelector('.mobile-fab-btn') : null);

    if (!btn) return;
    const btnId = btn.id || ('fab-btn-' + Math.random().toString(36).substr(2, 6));

    // Menü açıksa veya buton ekranda görünür değilse titreme yapma
    if (btn.classList.contains('active')) return;

    // Cooldown kontrolü: aynı buton için 12 saniye içinde tekrar tetikleme
    const now = Date.now();
    const lastTime = fabLastTriggered.get(btnId) || 0;
    if (now - lastTime < 12000) return;
    fabLastTriggered.set(btnId, now);

    // Varsa önceki zamanlayıcıları temizle
    if (fabActiveTimeouts.has(btnId)) {
      const timers = fabActiveTimeouts.get(btnId);
      if (Array.isArray(timers)) timers.forEach(id => clearTimeout(id));
      fabActiveTimeouts.delete(btnId);
    }

    const timerList = [];

    const startTimer = setTimeout(() => {
      if (!btn || btn.classList.contains('active') || btn.offsetParent === null) {
        fabActiveTimeouts.delete(btnId);
        return;
      }

      // Animasyon sınıfını ekle (önce kaldırıp reflow ile yeniden tetikle)
      btn.classList.remove('fab-attention');
      void btn.offsetWidth; // Reflow
      btn.classList.add('fab-attention');

      // Android ve mobil cihazlar için 3 dalgalı titreşim (Haptic Feedback)
      // 1. Titreme Dalgası: hemen
      window.vibrate(30);

      // 2. Titreme Dalgası: ~540ms sonra
      const tVib2 = setTimeout(() => {
        if (btn.classList.contains('fab-attention') && !btn.classList.contains('active') && btn.offsetParent !== null) {
          window.vibrate(30);
        }
      }, 540);
      timerList.push(tVib2);

      // 3. Titreme Dalgası: ~1080ms sonra
      const tVib3 = setTimeout(() => {
        if (btn.classList.contains('fab-attention') && !btn.classList.contains('active') && btn.offsetParent !== null) {
          window.vibrate(30);
        }
      }, 1080);
      timerList.push(tVib3);

      // Animasyon bittiğinde temizle
      const onEnd = () => {
        btn.classList.remove('fab-attention');
        btn.removeEventListener('animationend', onEnd);
      };
      btn.addEventListener('animationend', onEnd, { once: true });

      const tClean = setTimeout(() => {
        btn.classList.remove('fab-attention');
        fabActiveTimeouts.delete(btnId);
      }, 1800);
      timerList.push(tClean);
    }, delay);

    timerList.push(startTimer);
    fabActiveTimeouts.set(btnId, timerList);
  }

  function cancelFabAttention(btn) {
    if (!btn) return;
    const btnId = btn.id;
    if (btnId && fabActiveTimeouts.has(btnId)) {
      const timers = fabActiveTimeouts.get(btnId);
      if (Array.isArray(timers)) timers.forEach(id => clearTimeout(id));
      fabActiveTimeouts.delete(btnId);
    }
    btn.classList.remove('fab-attention');
  }

  function cancelAllFabAttention() {
    fabActiveTimeouts.forEach(timers => {
      if (Array.isArray(timers)) timers.forEach(id => clearTimeout(id));
    });
    fabActiveTimeouts.clear();
    document.querySelectorAll('.mobile-fab-btn.fab-attention').forEach(btn => {
      btn.classList.remove('fab-attention');
    });
  }

  window.triggerFabArrivalAttention = triggerFabArrivalAttention;
  window.cancelFabAttention = cancelFabAttention;
  window.cancelAllFabAttention = cancelAllFabAttention;

  // ==========================================================================
  // SEKME YÖNETİMİ
  // ==========================================================================
  function switchTab(tabId) {
    if (tabId === 'attendance') {
      switchTab('tools');
      if (typeof window.openAttendanceModal === 'function') {
        window.openAttendanceModal();
      }
      return;
    }
    cancelAllFabAttention();
    currentTab = tabId;

    // Canlı Ders Kartı: Puan menüsü dışında hiçbir menüde üst tarafta canlı ders penceresi olmasın
    const liveCard = document.getElementById('m-live-lesson-card');
    if (liveCard) {
      liveCard.style.display = (tabId === 'performance') ? 'flex' : 'none';
    }

    // Filtre & Arama Çubuğu: Sadece Puan ve Ödev sekmelerinde göster
    const filterBar = document.getElementById('mobile-filter-bar');
    if (filterBar) {
      filterBar.style.display = (tabId === 'performance' || tabId === 'homework') ? 'flex' : 'none';
    }

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
      // Ödev menüsüne her girişte içinde bulunulan günün listesi ve TÜM LİSTE modu açılacak
      currentHwDate = getTodayDateStr();
      hwMode = 'list';
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

    // Sayfaya ilk gelindiğinde yüzen menü varsa dikkat çekme titremesini tetikle
    const targetPane = document.getElementById(`tab-${tabId}`);
    if (targetPane) {
      triggerFabArrivalAttention(targetPane, 450);
    }
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
        if (typeof window.renderBooksTab === 'function') window.renderBooksTab();
        break;
      case 'tools':
        if (typeof window.renderMobileTools === 'function') window.renderMobileTools();
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
        const point = b.point !== undefined ? Math.abs(b.point) : (b.points !== undefined ? Math.abs(b.points) : 1);
        const name = b.name || b.title || 'Davranış';
        const icon = b.icon || '⭐';
        return `
          <button type="button" class="m-point-btn-item positive" onclick="window.giveQuickPoint(${point}, '${escapeHTML(name)}')">
            <span class="m-point-btn-icon">${icon}</span>
            <span class="m-point-btn-name">${escapeHTML(name)}</span>
            <span class="m-point-btn-badge plus">+${point}</span>
          </button>
        `;
      }).join('');
    }

    // 2. Olumsuz Butonları Render Et
    const gridNeg = document.getElementById('m-point-grid-negative');
    if (gridNeg) {
      gridNeg.innerHTML = negativeList.map(b => {
        let point = b.point !== undefined ? b.point : (b.points !== undefined ? b.points : -1);
        if (point > 0) point = -point; // Olumsuz puanlar eksi olmalıdır
        const name = b.name || b.title || 'Davranış';
        const icon = b.icon || '⚠️';
        return `
          <button type="button" class="m-point-btn-item negative" onclick="window.giveQuickPoint(${point}, '${escapeHTML(name)}')">
            <span class="m-point-btn-icon">${icon}</span>
            <span class="m-point-btn-name">${escapeHTML(name)}</span>
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
  // TOPLU DEĞİŞKEN PUAN GİRİŞİ MODAL FONKSİYONLARI
  // ==========================================================================
  window.openBulkVariablePointsModal = function() {
    window.vibrate(25);
    const branchGroup = document.getElementById('m-bulk-var-branch-group');
    const branchSelect = document.getElementById('m-bulk-var-branch');
    const isMiddle = isMiddleSchool();

    if (branchGroup && branchSelect) {
      if (isMiddle) {
        branchGroup.style.display = 'block';
        populateBranchOptions(branchSelect);
        branchSelect.value = activeBranch || 'all';
      } else {
        branchGroup.style.display = 'none';
      }
    }

    const qInput = document.getElementById('m-bulk-var-quick-val');
    if (qInput) qInput.value = '';

    window.renderBulkVariablePointsList();
    openBottomSheet('modal-bulk-variable-points');
  };

  window.renderBulkVariablePointsList = function() {
    const listEl = document.getElementById('m-bulk-var-students-list');
    if (!listEl) return;

    if (!window.stateManager) {
      listEl.innerHTML = '<div style="text-align: center; padding: 2rem 1rem; color: var(--m-text-muted);">Sistem durumu yüklenemedi.</div>';
      return;
    }

    const state = (window.stateManager.loadState) ? window.stateManager.loadState() : (window.stateManager.state || {});
    const all = state.students || [];
    const isMiddle = isMiddleSchool();
    const branchSelect = document.getElementById('m-bulk-var-branch');
    const filterBranch = (isMiddle && branchSelect) ? branchSelect.value : (activeBranch || 'all');

    let students = all.filter(s => isStudentInCurrentLevel(s));
    if (isMiddle && filterBranch && filterBranch !== 'all') {
      students = students.filter(s => s.branch === filterBranch);
    }

    students.sort((a, b) => {
      const numA = parseInt(a.number, 10);
      const numB = parseInt(b.number, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return (a.name || '').localeCompare(b.name || '', 'tr');
    });

    if (students.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="users" style="width: 36px; height: 36px; opacity: 0.4; margin-bottom: 0.5rem;"></i>
          <p style="font-weight: 600; font-size: 0.88rem;">Seçili kriterlerde öğrenci bulunamadı.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    listEl.innerHTML = students.map(st => {
      const avatarColor = getAvatarColor(st.id || st.name);
      const currentScore = (st.scores && st.scores.total !== undefined) 
        ? st.scores.total 
        : ((window.stateManager && window.stateManager.getStudentScore) ? window.stateManager.getStudentScore(st.id) : 0);
      const photoHtml = st.photo 
        ? `<img src="${st.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` 
        : escapeHTML((st.name || '?').charAt(0).toUpperCase());

      return `
        <div class="m-bulk-var-row" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 6px; border-bottom: 1px solid var(--m-border); gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
            <div style="width: 34px; height: 34px; border-radius: 50%; background: ${avatarColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.82rem; flex-shrink: 0; overflow: hidden;">
              ${photoHtml}
            </div>
            <div style="min-width: 0;">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <span style="font-size: 0.72rem; color: var(--m-text-muted); margin-right: 4px;">#${escapeHTML(st.number || st.id || '')}</span>${escapeHTML(st.name || '')}
              </div>
              <div style="font-size: 0.7rem; color: var(--m-text-muted);">
                Puan: <b style="color: ${currentScore >= 0 ? 'var(--m-success)' : 'var(--m-danger)'};">${currentScore >= 0 ? '+' : ''}${currentScore}</b>
                ${st.branch ? ` • ${escapeHTML(st.branch)}` : ''}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
            <button type="button" onclick="window.adjustBulkVarInput('${st.id}', -1)" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--m-border); background: var(--m-surface); color: var(--m-text); font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; cursor: pointer;">-</button>
            <input type="number" id="m-bulk-input-${st.id}" class="m-bulk-var-input" data-student-id="${st.id}" placeholder="0" oninput="window.onBulkVarInputChange(this)" style="width: 48px; height: 28px; text-align: center; border-radius: 6px; border: 1px solid var(--m-border); background: var(--m-surface); font-weight: 800; font-size: 0.88rem; color: var(--m-text);">
            <button type="button" onclick="window.adjustBulkVarInput('${st.id}', 1)" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--m-border); background: var(--m-surface); color: var(--m-text); font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; cursor: pointer;">+</button>
            <button type="button" onclick="window.adjustBulkVarInput('${st.id}', 5)" style="padding: 4px 6px; height: 28px; font-size: 0.72rem; font-weight: 800; border-radius: 6px; border: 1px solid rgba(99,102,241,0.25); background: rgba(99,102,241,0.1); color: var(--m-primary); cursor: pointer;">+5</button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  };

  window.adjustBulkVarInput = function(studentId, delta) {
    const input = document.getElementById(`m-bulk-input-${studentId}`);
    if (!input) return;
    window.vibrate(15);
    let val = parseInt(input.value, 10);
    if (isNaN(val)) val = 0;
    val += delta;
    input.value = val === 0 ? '' : val;
    window.onBulkVarInputChange(input);
  };

  window.onBulkVarInputChange = function(input) {
    if (!input) return;
    const val = parseInt(input.value, 10);
    if (!isNaN(val) && val !== 0) {
      input.style.borderColor = val > 0 ? '#10b981' : '#ef4444';
      input.style.color = val > 0 ? '#10b981' : '#ef4444';
      input.style.backgroundColor = val > 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)';
    } else {
      input.style.borderColor = '';
      input.style.color = '';
      input.style.backgroundColor = '';
    }
  };

  window.setBulkVarReason = function(reason) {
    window.vibrate(15);
    const input = document.getElementById('m-bulk-var-reason');
    if (input) input.value = reason;
  };

  window.applyBulkVarQuickValue = function() {
    window.vibrate(20);
    const qInput = document.getElementById('m-bulk-var-quick-val');
    const qVal = parseInt(qInput ? qInput.value : '', 10);
    if (isNaN(qVal) || qVal === 0) {
      showMobileToast('Lütfen geçerli bir puan girin (Örn: 5 veya -2)');
      return;
    }
    const inputs = document.querySelectorAll('.m-bulk-var-input');
    inputs.forEach(inp => {
      inp.value = qVal;
      window.onBulkVarInputChange(inp);
    });
    showMobileToast(`Tüm öğrencilere ${qVal > 0 ? '+' : ''}${qVal} uygulandı.`);
  };

  window.clearBulkVarInputs = function() {
    window.vibrate(20);
    const inputs = document.querySelectorAll('.m-bulk-var-input');
    inputs.forEach(inp => {
      inp.value = '';
      window.onBulkVarInputChange(inp);
    });
    const qInput = document.getElementById('m-bulk-var-quick-val');
    if (qInput) qInput.value = '';
    showMobileToast('Tüm puanlar temizlendi.');
  };

  window.saveBulkVariablePoints = function() {
    if (!window.stateManager) return;
    const reasonInput = document.getElementById('m-bulk-var-reason');
    const reason = (reasonInput && reasonInput.value.trim()) ? reasonInput.value.trim() : 'Ders İçi Katılım';

    const inputs = document.querySelectorAll('.m-bulk-var-input');
    const records = [];
    inputs.forEach(inp => {
      const pts = parseInt(inp.value, 10);
      if (!isNaN(pts) && pts !== 0) {
        const studentId = inp.getAttribute('data-student-id');
        records.push({
          studentId: studentId,
          type: pts >= 0 ? 'positive' : 'development',
          point: pts,
          reason: reason
        });
      }
    });

    if (records.length === 0) {
      showMobileToast('Lütfen en az bir öğrenciye puan girin.');
      return;
    }

    if (typeof window.stateManager.addBatchPerformance === 'function') {
      window.stateManager.addBatchPerformance(records);
    } else {
      records.forEach(r => {
        if (typeof window.stateManager.addPerformance === 'function') {
          window.stateManager.addPerformance(r.studentId, r.type, r.point, r.reason);
        } else if (typeof window.stateManager.addScore === 'function') {
          window.stateManager.addScore(r.studentId, r.point, r.reason);
        }
      });
    }

    window.vibrate(45);

    // Ana performans ekranını yenile
    renderPerformanceTab();

    // Varsa açık öğrenci detay modalını yenile
    const detailModal = document.getElementById('modal-student-detail');
    if (window.currentDetailedStudentId && detailModal && detailModal.classList.contains('active')) {
      window.openStudentDetailModal(window.currentDetailedStudentId);
    }

    showMobileToast(`✅ ${records.length} öğrencinin puanı başarıyla kaydedildi!`);
    closeBottomSheet();

    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);
  };

  // ==========================================================================
  // TAM EKRAN (FULLSCREEN) YÖNETİMİ
  // ==========================================================================
  window.isMobileFullscreen = false;

  window.toggleMobileFullscreen = function() {
    window.vibrate(25);
    let isFs = false;

    // 1. Android Native Köprüsü
    if (window.AndroidBridge && typeof window.AndroidBridge.toggleFullscreen === 'function') {
      try {
        isFs = window.AndroidBridge.toggleFullscreen();
      } catch (e) {
        console.warn('AndroidBridge.toggleFullscreen çağrısı başarısız', e);
      }
    }

    // 2. Web Fullscreen API Senkronizasyonu
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      isFs = false;
    } else if (!window.AndroidBridge) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().then(() => {
          updateFullscreenUI(true);
        }).catch(() => {});
        isFs = true;
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
        isFs = true;
      }
    }

    window.isMobileFullscreen = isFs;
    updateFullscreenUI(isFs);
    showMobileToast(isFs ? '🖥️ Tam ekran moduna geçildi' : 'Pencereli moda dönüldü');
  };

  function updateFullscreenUI(isFs) {
    const fsBtn = document.getElementById('btn-appbar-fullscreen');
    const fsIcon = document.getElementById('appbar-fs-icon');
    if (!fsBtn) return;

    if (isFs) {
      fsBtn.setAttribute('title', 'Tam Ekrandan Çık');
      if (fsIcon) {
        fsIcon.setAttribute('data-lucide', 'minimize');
      }
    } else {
      fsBtn.setAttribute('title', 'Tam Ekran Yap');
      if (fsIcon) {
        fsIcon.setAttribute('data-lucide', 'maximize');
      }
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    window.isMobileFullscreen = isFs;
    updateFullscreenUI(isFs);
  });

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
      const isMiddle = isMiddleSchool();
      const branch = isMiddle ? (activeBranch || '') : '';
      const hw = (state && state.homeworks) ? state.homeworks.find(h =>
        h.dueDate === currentHwDate &&
        (!isMiddle || h.branch === branch || (!h.branch && branch === 'all'))
      ) : null;

      if (hw && hw.title) {
        subEl.innerHTML = `📚 ${escapeHTML(hw.title)} <button type="button" onclick="event.stopPropagation(); window.shareCurrentDateHomeworkWhatsApp();" title="WhatsApp ile Paylaş" style="background: rgba(37,211,102,0.15); border: 1px solid rgba(37,211,102,0.35); color: #15803d; border-radius: 6px; padding: 2px 7px; font-size: 0.7rem; font-weight: 700; margin-left: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;"><i data-lucide="message-circle" style="width: 12px; height: 12px;"></i> Paylaş</button>`;
      } else {
        subEl.textContent = '📅 Günlük Ödev Kontrolü';
      }
    }
  }

  // --- SIRA GEZME KONTROL SIRASI YÖNETİMİ ---
  let hwWalkOrderDraft = [];

  function getHwWalkBranchKey() {
    const isMiddle = isMiddleSchool();
    return isMiddle ? (activeBranch || 'all') : 'primary';
  }

  function getHomeworkWalkStudents() {
    const filtered = getFilteredStudents();
    if (!filtered || filtered.length === 0) return [];

    const branchKey = getHwWalkBranchKey();
    const savedOrderJson = localStorage.getItem(`sinif_asistani_hw_walk_order_${branchKey}`);
    if (savedOrderJson) {
      try {
        const savedIds = JSON.parse(savedOrderJson);
        if (Array.isArray(savedIds) && savedIds.length > 0) {
          const map = new Map();
          filtered.forEach(s => map.set(String(s.id), s));
          const ordered = [];
          savedIds.forEach(id => {
            const st = map.get(String(id));
            if (st) {
              ordered.push(st);
              map.delete(String(id));
            }
          });
          // Henüz sırada yer almayan yeni öğrencileri sona ekle
          map.forEach(st => ordered.push(st));
          return ordered;
        }
      } catch (e) {}
    }

    return filtered;
  }

  window.openHomeworkOrderModal = () => {
    if (window.vibrate) window.vibrate(20);
    const students = getHomeworkWalkStudents();
    hwWalkOrderDraft = students.map(s => String(s.id));
    renderHwOrderList();
    openBottomSheet('modal-hw-order');
  };

  function renderHwOrderList() {
    const container = document.getElementById('m-hw-order-list');
    if (!container) return;

    const filtered = getFilteredStudents();
    const map = new Map();
    filtered.forEach(s => map.set(String(s.id), s));

    const draftStudents = [];
    hwWalkOrderDraft.forEach(id => {
      const st = map.get(String(id));
      if (st) draftStudents.push(st);
    });
    // Varsa eksik kalanları ekle
    filtered.forEach(s => {
      if (!hwWalkOrderDraft.includes(String(s.id))) {
        draftStudents.push(s);
        hwWalkOrderDraft.push(String(s.id));
      }
    });

    if (draftStudents.length === 0) {
      container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--m-text-muted);">Ödev kontrolü için öğrenci bulunamadı.</div>';
      return;
    }

    container.innerHTML = draftStudents.map((st, idx) => {
      const avatarColor = getAvatarColor(st.id || st.name);
      const isFirst = (idx === 0);
      const isLast = (idx === draftStudents.length - 1);
      return `
        <div style="display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: var(--m-surface); border: 1px solid var(--m-border); border-radius: 10px; margin-bottom: 6px;">
          <div style="font-weight: 800; font-size: 0.78rem; color: var(--m-primary); min-width: 24px;">#${idx + 1}</div>
          <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${avatarColor}; color: #fff; font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${st.photo ? `<img src="${st.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : escapeHTML(st.name.charAt(0).toUpperCase())}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}
            </div>
            <div style="font-size: 0.7rem; color: var(--m-text-muted);">
              ${st.number ? `No: ${escapeHTML(st.number)}` : ''} ${st.branch ? `| ${escapeHTML(st.branch)}` : ''}
            </div>
          </div>
          <div style="display: flex; gap: 4px; flex-shrink: 0;">
            <button type="button" onclick="window.moveHwWalkStudent(${idx}, -1)" ${isFirst ? 'disabled style="opacity: 0.35;"' : ''} style="width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--m-border); background: var(--m-surface-subtle); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--m-text); font-weight: 800;">
              ▲
            </button>
            <button type="button" onclick="window.moveHwWalkStudent(${idx}, 1)" ${isLast ? 'disabled style="opacity: 0.35;"' : ''} style="width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--m-border); background: var(--m-surface-subtle); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--m-text); font-weight: 800;">
              ▼
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  window.moveHwWalkStudent = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= hwWalkOrderDraft.length) return;
    const temp = hwWalkOrderDraft[index];
    hwWalkOrderDraft[index] = hwWalkOrderDraft[target];
    hwWalkOrderDraft[target] = temp;
    window.vibrate(20);
    renderHwOrderList();
  };

  window.applyHwWalkPreset = (preset) => {
    const filtered = getFilteredStudents();
    if (!filtered || filtered.length === 0) return;

    if (preset === 'number') {
      filtered.sort((a, b) => {
        const numA = parseInt(a.number) || 999999;
        const numB = parseInt(b.number) || 999999;
        return numA - numB;
      });
      hwWalkOrderDraft = filtered.map(s => String(s.id));
      showMobileToast('Numara sırasına göre dizildi');
    } else if (preset === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
      hwWalkOrderDraft = filtered.map(s => String(s.id));
      showMobileToast('İsim sırasına (A-Z) göre dizildi');
    } else if (preset === 'reverse') {
      hwWalkOrderDraft.reverse();
      showMobileToast('Mevcut sıra ters çevrildi');
    } else if (preset === 'seating') {
      const state = (window.stateManager && window.stateManager.state) || {};
      const isMiddle = isMiddleSchool();
      const branchKey = isMiddle ? (activeBranch || 'all') : 'all';
      const plan = (state.seatingPlans && state.seatingPlans[branchKey]);

      if (plan && Array.isArray(plan.desks) && plan.desks.length > 0) {
        const seatingIds = [];
        const sortedDesks = plan.desks.slice().sort((a, b) => {
          if (Math.abs(a.y - b.y) > 5) return a.y - b.y;
          return a.x - b.x;
        });
        sortedDesks.forEach(desk => {
          if (Array.isArray(desk.studentIds)) {
            desk.studentIds.forEach(sid => {
              if (sid && !seatingIds.includes(String(sid))) seatingIds.push(String(sid));
            });
          }
        });

        const finalIds = [];
        seatingIds.forEach(id => {
          if (filtered.some(s => String(s.id) === id)) finalIds.push(id);
        });
        filtered.forEach(s => {
          if (!finalIds.includes(String(s.id))) finalIds.push(String(s.id));
        });
        hwWalkOrderDraft = finalIds;
        showMobileToast('🪑 Oturma planına göre dizildi');
      } else {
        showMobileToast('Kayıtlı oturma planı bulunamadı, numara sırasına göre dizildi');
        filtered.sort((a, b) => (parseInt(a.number) || 999999) - (parseInt(b.number) || 999999));
        hwWalkOrderDraft = filtered.map(s => String(s.id));
      }
    }

    window.vibrate(25);
    renderHwOrderList();
  };

  window.saveHwWalkOrder = () => {
    const branchKey = getHwWalkBranchKey();
    localStorage.setItem(`sinif_asistani_hw_walk_order_${branchKey}`, JSON.stringify(hwWalkOrderDraft));
    window.vibrate(40);
    showMobileToast('✓ Kontrol sırası kaydedildi');
    window.closeBottomSheet();
    hwWalkIndex = 0;
    renderHomeworkTab();
  };

  // --- YENİ ÖDEV VERME & WHATSAPP PAYLAŞIMI ---
  window.openNewHomeworkModal = () => {
    if (window.vibrate) window.vibrate(20);
    const dateInput = document.getElementById('m-new-hw-date');
    const titleInput = document.getElementById('m-new-hw-title');
    const descInput = document.getElementById('m-new-hw-desc');
    const branchSelect = document.getElementById('m-new-hw-branch');
    const branchGroup = document.getElementById('m-new-hw-branch-group');

    // 1. Şube seçimi (ortaokul ise)
    const isMiddle = isMiddleSchool();
    if (branchGroup) {
      branchGroup.style.display = isMiddle ? 'block' : 'none';
      if (isMiddle && branchSelect) {
        populateBranchOptions(branchSelect);
        branchSelect.value = (activeBranch && activeBranch !== 'all') ? activeBranch : (branchSelect.options[1]?.value || 'all');
      }
    }

    // 2. Bir sonraki okul günü tarihi ayarla
    window.setNewHwDateQuick('tomorrow');

    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';

    openBottomSheet('modal-new-homework');
  };

  window.setNewHwDateQuick = (mode) => {
    const dateInput = document.getElementById('m-new-hw-date');
    if (!dateInput) return;

    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (mode === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      // Cuma ise Pazartesi (+2 gün daha), Cumartesi ise Pazartesi (+2 gün daha), Pazar ise Pazartesi (+1 gün)
      if (d.getDay() === 6) d.setDate(d.getDate() + 2);
      else if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    } else if (mode === 'monday') {
      const day = d.getDay();
      const diff = (day === 0 ? 1 : 8 - day);
      d.setDate(d.getDate() + diff);
    } else if (mode === 'week') {
      d.setDate(d.getDate() + 7);
    }

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dateInput.value = `${y}-${m}-${day}`;
    window.onNewHwDateChanged();
  };

  window.onNewHwDateChanged = () => {
    const dateInput = document.getElementById('m-new-hw-date');
    const badge = document.getElementById('m-new-hw-dayname-badge');
    if (!dateInput || !badge) return;

    const val = dateInput.value;
    if (!val) {
      badge.textContent = '';
      return;
    }
    const parts = val.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = d.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let relative = '';
    if (diffDays === 0) relative = 'Bugün';
    else if (diffDays === 1) relative = 'Yarın';
    else if (diffDays === 2) relative = '2 Gün Sonra';
    else if (diffDays > 2) relative = `${diffDays} Gün Sonra`;

    badge.textContent = relative ? `${relative} (${days[d.getDay()]})` : `${days[d.getDay()]}`;
  };

  window.appendNewHwSubject = (prefix) => {
    const titleInput = document.getElementById('m-new-hw-title');
    if (!titleInput) return;
    if (!titleInput.value.trim()) {
      titleInput.value = prefix;
    } else if (!titleInput.value.startsWith(prefix)) {
      titleInput.value = prefix + titleInput.value.replace(/^[A-Za-zÇĞİÖŞÜçğıöşü\s]+:\s*/, '');
    }
    titleInput.focus();
  };

  window.saveAndShareNewHomework = (sendWhatsApp) => {
    const dateInput = document.getElementById('m-new-hw-date');
    const titleInput = document.getElementById('m-new-hw-title');
    const descInput = document.getElementById('m-new-hw-desc');
    const branchSelect = document.getElementById('m-new-hw-branch');

    const dueDate = dateInput ? dateInput.value : '';
    const title = titleInput ? titleInput.value.trim() : '';
    const description = descInput ? descInput.value.trim() : '';
    const isMiddle = isMiddleSchool();
    const branch = isMiddle && branchSelect ? branchSelect.value : (activeBranch || '');

    if (!dueDate) {
      showMobileToast('Lütfen teslim tarihini seçin');
      return;
    }
    if (!title) {
      showMobileToast('Lütfen ödev konusunu girin');
      return;
    }

    if (!window.stateManager) {
      showMobileToast('Hata: Sistem yöneticisi bulunamadı');
      return;
    }

    const state = window.stateManager.loadState();
    let hw = (state.homeworks || []).find(h =>
      h.dueDate === dueDate &&
      (!isMiddle || h.branch === branch || (!h.branch && branch === 'all'))
    );

    if (hw) {
      window.stateManager.updateHomework(hw.id, { title, description, dueDate, branch });
    } else {
      hw = window.stateManager.addHomework({ title, description, dueDate, branch });
    }

    // Aktif ödev tarihini güncelleyip sekmede göster
    currentHwDate = dueDate;
    window.vibrate(40);
    renderHomeworkTab();
    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);

    window.closeBottomSheet();

    if (sendWhatsApp) {
      const parts = dueDate.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      const formattedDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${days[d.getDay()]}`;

      let msg = `📚 *YENİ ÖDEV BİLDİRİMİ*\n\n`;
      if (branch && branch !== 'all') {
        msg += `🏷️ *Sınıf / Şube:* ${branch}\n`;
      }
      msg += `🗓️ *Son Teslim / Kontrol Tarihi:* ${formattedDate}\n`;
      msg += `📖 *Ödev Konusu:* ${title}\n`;
      if (description) {
        msg += `📝 *Açıklama & Detay:* ${description}\n`;
      }
      msg += `\n✨ _Sınıf Asistanı ile gönderildi_`;

      showMobileToast('Ödev kaydedildi! WhatsApp açılıyor...');
      setTimeout(() => {
        shareHomeworkWhatsAppMessage(msg);
      }, 350);
    } else {
      showMobileToast('✓ Ödev başarıyla kaydedildi');
    }
  };

  function shareHomeworkWhatsAppMessage(message) {
    const encoded = encodeURIComponent(message);
    const groupLink = (window.stateManager && typeof window.stateManager.getWhatsappGroupLink === 'function')
      ? window.stateManager.getWhatsappGroupLink()
      : '';

    // Metni panoya da kopyala
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).catch(() => {});
    }

    // Grup davet linki varsa doğrudan gruba yönlendir
    if (groupLink && groupLink.trim().startsWith('https://chat.whatsapp.com/')) {
      showMobileToast('Ödev panoya kopyalandı, grup açılıyor...');
      setTimeout(() => {
        try {
          window.location.href = groupLink.trim();
        } catch (e) {
          window.open(groupLink.trim(), '_blank');
        }
      }, 300);
      return;
    }

    // Doğrudan WhatsApp paylaşımı
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    try {
      window.location.href = waUrl;
    } catch (e) {
      if (window.AndroidBridge && typeof window.AndroidBridge.shareData === 'function') {
        window.AndroidBridge.shareData(message, 'Ödev Bildirimi', 'text/plain');
      } else {
        window.open(waUrl, '_blank');
      }
    }
  }

  window.shareCurrentDateHomeworkWhatsApp = () => {
    const state = window.stateManager ? window.stateManager.loadState() : null;
    const isMiddle = isMiddleSchool();
    const branch = isMiddle ? (activeBranch || '') : '';
    const hw = (state && state.homeworks) ? state.homeworks.find(h =>
      h.dueDate === currentHwDate &&
      (!isMiddle || h.branch === branch || (!h.branch && branch === 'all'))
    ) : null;

    if (!hw) {
      showMobileToast('Bu güne ait kayıtlı ödev bulunamadı.');
      return;
    }

    const parts = currentHwDate.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const formattedDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${days[d.getDay()]}`;

    let msg = `📚 *ÖDEV BİLDİRİMİ*\n\n`;
    if (hw.branch && hw.branch !== 'all') {
      msg += `🏷️ *Sınıf / Şube:* ${hw.branch}\n`;
    }
    msg += `🗓️ *Son Teslim / Kontrol Tarihi:* ${formattedDate}\n`;
    msg += `📖 *Ödev Konusu:* ${hw.title}\n`;
    if (hw.description) {
      msg += `📝 *Açıklama & Detay:* ${hw.description}\n`;
    }
    msg += `\n✨ _Sınıf Asistanı ile gönderildi_`;

    shareHomeworkWhatsAppMessage(msg);
  };

  function renderHomeworkTab() {
    const students = getFilteredStudents();
    const walkContainer = document.getElementById('hw-walk-container');
    const listWrapper = document.getElementById('hw-list-wrapper');
    const toggleWalkBtn = document.getElementById('btn-hw-mode-walk');
    const toggleListBtn = document.getElementById('btn-hw-mode-list');
    const orderBtn = document.getElementById('btn-hw-mode-order');

    if (toggleWalkBtn && toggleListBtn) {
      toggleWalkBtn.classList.toggle('active', hwMode === 'walk');
      toggleListBtn.classList.toggle('active', hwMode === 'list');
    }
    if (orderBtn) {
      orderBtn.style.display = (hwMode === 'walk') ? 'inline-flex' : 'none';
    }

    updateHwDateDisplay();

    if (hwMode === 'walk') {
      if (walkContainer) walkContainer.style.display = 'block';
      if (listWrapper) listWrapper.style.display = 'none';
      const walkStudents = getHomeworkWalkStudents();
      renderHomeworkWalkCard(walkStudents);
    } else {
      if (walkContainer) walkContainer.style.display = 'none';
      if (listWrapper) listWrapper.style.display = 'block';
      renderHomeworkList(students);
    }
  }

  function renderHomeworkWalkCard(students) {
    const container = document.getElementById('hw-walk-card-inner');
    if (!container) return;

    if (!students || students.length === 0) {
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; width: 100%;">
        <div class="hw-walk-counter" style="margin-bottom: 0;">Sıradaki: ${hwWalkIndex + 1} / ${students.length} (%${Math.round(((hwWalkIndex + 1) / students.length) * 100)})</div>
        <button type="button" onclick="window.openHomeworkOrderModal()" style="background: var(--m-surface-subtle); border: 1px solid var(--m-border); color: var(--m-primary); font-size: 0.74rem; font-weight: 700; padding: 4px 9px; border-radius: 8px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
          <i data-lucide="arrow-up-down" style="width: 13px; height: 13px;"></i>
          <span>Sırayı Düzenle</span>
        </button>
      </div>
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
    const students = getHomeworkWalkStudents();
    if (hwWalkIndex < students.length - 1) {
      hwWalkIndex++;
    } else {
      hwWalkIndex = 0;
      showMobileToast('🎉 Tüm sınıfın ödev kontrolü tamamlandı!');
    }
    renderHomeworkWalkCard(students);
  };

  window.nextHwStudent = () => {
    const students = getHomeworkWalkStudents();
    if (hwWalkIndex < students.length - 1) hwWalkIndex++;
    else hwWalkIndex = 0;
    renderHomeworkWalkCard(students);
  };

  window.prevHwStudent = () => {
    const students = getHomeworkWalkStudents();
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

  // 3. CEP KİTAPLIĞI MODÜLÜ -> js/mobile-books.js modülüne taşındı.
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

  window.renderAttendanceTab = renderAttendanceTab;

  window.openAttendanceModal = () => {
    if (window.vibrate) window.vibrate(20);
    renderAttendanceTab();
    if (typeof window.openBottomSheet === 'function') {
      window.openBottomSheet('modal-attendance');
    }
    if (window.lucide) window.lucide.createIcons();
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
  window.escapeHTML = escapeHTML;
  window.getAvatarColor = getAvatarColor;
  window.getFilteredStudents = getFilteredStudents;
  window.populateBranchOptions = populateBranchOptions;
  window.formatStudentSubtitle = formatStudentSubtitle;
  window.getStudentByIdSafe = getStudentByIdSafe;
  window.getTodayDateStr = getTodayDateStr;

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
  window.showMobileToast = showMobileToast;

  window.closeBottomSheet = () => {
    cancelAllFabAttention();
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
    cancelAllFabAttention();
    window.closeBottomSheet();
    const sheet = document.getElementById(sheetId);
    const backdrop = document.getElementById('sheet-backdrop');
    if (sheet) sheet.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    if (window.lucide) window.lucide.createIcons();

    // Açılan alt sayfada (bottom sheet) yüzen menü varsa dikkat çekme titremesini tetikle
    if (sheet && typeof triggerFabArrivalAttention === 'function') {
      triggerFabArrivalAttention(sheet, 500);
    }
  }
  window.openBottomSheet = openBottomSheet;

  // ==========================================================================
  // 1. SUBVIEW (ALT EKRAN) YÖNETİMİ & ANDROID GERİ TUŞU
  // ==========================================================================
  let activeMobileSubview = null;

  window.openMobileSubview = (subviewId) => {
    if (subviewId === 'tools') {
      window.switchTab('tools');
      return;
    }
    cancelAllFabAttention();
    window.closeBottomSheet();
    window.closeConfigDrawer();
    activeMobileSubview = subviewId;
    window.vibrate(20);

    const liveCard = document.getElementById('m-live-lesson-card');
    if (liveCard) liveCard.style.display = 'none';
    const filterBar = document.getElementById('mobile-filter-bar');
    if (filterBar) filterBar.style.display = 'none';

    document.querySelectorAll('.mobile-subview').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(`subview-${subviewId}`);
    if (targetView) {
      targetView.classList.add('active');
      targetView.scrollTop = 0;
      // Sayfaya ilk gelindiğinde yüzen menü varsa dikkat çekme titremesini tetikle
      if (typeof triggerFabArrivalAttention === 'function') {
        triggerFabArrivalAttention(targetView, 450);
      }
    }

    // İlgili modülün render fonksiyonunu çalıştır
    if (subviewId === 'weekly') {
      currentWeeklyTargetWeek = (window.stateManager && typeof window.stateManager.getSelectedWeek === 'function')
        ? window.stateManager.getSelectedWeek()
        : (window.getISOWeek ? window.getISOWeek() : '2026-W39');
      if (typeof window.renderMobileWeekly === 'function') window.renderMobileWeekly();
    }
    else if (subviewId === 'games') {
      if (typeof window.initMobileGames === 'function') window.initMobileGames();
    }
    else if (subviewId === 'tasks') {
      if (typeof window.renderMobileTasks === 'function') window.renderMobileTasks();
    }
    else if (subviewId === 'tools') {
      if (typeof window.renderMobileTools === 'function') window.renderMobileTools();
    }
    else if (subviewId === 'reports') {
      if (typeof window.renderMobileReports === 'function') window.renderMobileReports();
    }
    else if (subviewId === 'materials') renderMobileMaterials();
    else if (subviewId === 'config') initMobileConfig();

    if (window.lucide) window.lucide.createIcons();
  };

  window.closeMobileSubview = () => {
    cancelAllFabAttention();
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

  // 2. OYUNLAR MODÜLÜ -> js/mobile-games.js modülüne taşındı.
  // 3. GÖREVLER VE 4. ARAÇLAR MODÜLÜ -> js/mobile-tools.js modülüne taşındı.
  // 5. RAPORLAR MODÜLÜ -> js/mobile-reports.js modülüne taşındı.
  // ==========================================================================
  // 6. DERS MATERYALLERİ MODÜLÜ (DEFTERLER VE KİTAPLAR)
  // ==========================================================================
  let currentMaterialsFilter = 'notebooks'; // 'notebooks' | 'textbooks'

  window.toggleMaterialsFab = () => {
    const menu = document.getElementById('m-materials-fab-menu');
    const btn = document.getElementById('m-materials-fab-btn');
    if (btn && typeof cancelFabAttention === 'function') cancelFabAttention(btn);
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
    if (btn && typeof cancelFabAttention === 'function') cancelFabAttention(btn);
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
    const url = `https://wa.me/905058856785?text=${msg}`;
    try {
      window.location.href = url;
    } catch (e) {
      window.open(url, '_blank');
    }
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
        : posList.map((b, idx) => {
          const bId = b.id || ('pos_' + idx);
          const icon = b.icon || '⭐';
          const name = b.name || b.title || 'Davranış';
          const pts = b.point !== undefined ? Math.abs(b.point) : (b.points !== undefined ? Math.abs(b.points) : 5);
          return `
            <div class="m-behavior-row">
              <button type="button" class="m-behavior-emoji-pill" onclick="window.openBehaviorEmojiPicker('existing', 'positive', '${bId}', '${encodeURIComponent(name)}')" title="Emojiyi Değiştir">
                ${icon}
              </button>
              <span style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(name)}</span>
              <span class="badge" onclick="window.editMobileBehaviorPoints('positive', '${bId}', '${encodeURIComponent(name)}', ${pts})" style="background: var(--m-success); color: white; padding: 2px 7px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; cursor: pointer;" title="Puanı Değiştir">+${pts}</span>
              <button type="button" onclick="window.deleteMobileBehavior('positive', '${bId}', '${encodeURIComponent(name)}')" style="background: none; border: none; padding: 2px 4px; color: var(--m-danger); cursor: pointer;" title="Sil">
                <i data-lucide="x" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          `;
        }).join('');
    }

    const devContainer = document.getElementById('m-cfg-dev-behaviors-list');
    if (devContainer) {
      const devList = behaviors.development || behaviors.negative || [];
      devContainer.innerHTML = devList.length === 0
        ? '<div style="font-size: 0.75rem; color: var(--m-text-muted); padding: 4px;">Kayıtlı geliştirilmeli davranış bulunmuyor.</div>'
        : devList.map((b, idx) => {
          const bId = b.id || ('dev_' + idx);
          const icon = b.icon || '⚠️';
          const name = b.name || b.title || 'Davranış';
          let pts = b.point !== undefined ? b.point : (b.points !== undefined ? b.points : -5);
          if (pts > 0) pts = -pts;
          return `
            <div class="m-behavior-row">
              <button type="button" class="m-behavior-emoji-pill" onclick="window.openBehaviorEmojiPicker('existing', 'development', '${bId}', '${encodeURIComponent(name)}')" title="Emojiyi Değiştir">
                ${icon}
              </button>
              <span style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(name)}</span>
              <span class="badge" onclick="window.editMobileBehaviorPoints('development', '${bId}', '${encodeURIComponent(name)}', ${pts})" style="background: var(--m-danger); color: white; padding: 2px 7px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; cursor: pointer;" title="Puanı Değiştir">${pts}</span>
              <button type="button" onclick="window.deleteMobileBehavior('development', '${bId}', '${encodeURIComponent(name)}')" style="background: none; border: none; padding: 2px 4px; color: var(--m-danger); cursor: pointer;" title="Sil">
                <i data-lucide="x" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          `;
        }).join('');
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

  // ==========================================================================
  // DAVRANIŞ EMOJİ SEÇİCİ & YÖNETİMİ
  // ==========================================================================
  window.behaviorEmojiTarget = null;

  window.openBehaviorEmojiPicker = (targetType, category, behaviorId, behaviorName) => {
    window.vibrate(20);
    window.behaviorEmojiTarget = {
      targetType, // 'pos-new', 'dev-new', 'existing'
      category: category || 'positive', // 'positive', 'development'
      behaviorId,
      behaviorName: behaviorName ? decodeURIComponent(behaviorName) : ''
    };

    const titleEl = document.getElementById('m-emoji-picker-title');
    if (titleEl) {
      if (targetType === 'existing') {
        titleEl.textContent = `Emoji Değiştir: ${window.behaviorEmojiTarget.behaviorName || 'Davranış'}`;
      } else if (targetType === 'pos-new') {
        titleEl.textContent = 'Olumlu Davranış Emojisi Seç';
      } else {
        titleEl.textContent = 'Geliştirilmeli Davranış Emojisi Seç';
      }
    }

    const input = document.getElementById('m-emoji-custom-input');
    if (input) input.value = '';

    openBottomSheet('modal-behavior-emoji-picker');
  };

  window.selectBehaviorEmoji = (emoji) => {
    if (!emoji) return;
    window.vibrate(25);
    const target = window.behaviorEmojiTarget;
    if (!target) return;

    if (target.targetType === 'pos-new') {
      const prev = document.getElementById('m-new-pos-emoji-preview');
      const hidden = document.getElementById('m-new-pos-emoji');
      if (prev) prev.textContent = emoji;
      if (hidden) hidden.value = emoji;
      closeBottomSheet();
    } else if (target.targetType === 'dev-new') {
      const prev = document.getElementById('m-new-dev-emoji-preview');
      const hidden = document.getElementById('m-new-dev-emoji');
      if (prev) prev.textContent = emoji;
      if (hidden) hidden.value = emoji;
      closeBottomSheet();
    } else if (target.targetType === 'existing') {
      if (window.stateManager && window.stateManager.state.performanceBehaviors) {
        const cat = target.category || 'positive';
        let list = window.stateManager.state.performanceBehaviors[cat];
        if (!list && cat === 'development') list = window.stateManager.state.performanceBehaviors.negative;
        if (list) {
          const item = list.find(b => (b.id && b.id === target.behaviorId) || ((b.name || b.title) && (b.name || b.title) === target.behaviorName));
          if (item) {
            item.icon = emoji;
            window.stateManager.saveState(`Davranış emojisi güncellendi: ${emoji}`);
            closeBottomSheet();
            renderMobilePointsConfig();
            showMobileToast(`✅ Emoji güncellendi: ${emoji}`);
          } else {
            closeBottomSheet();
          }
        } else {
          closeBottomSheet();
        }
      } else {
        closeBottomSheet();
      }
    }
  };

  window.applyCustomBehaviorEmoji = () => {
    const input = document.getElementById('m-emoji-custom-input');
    const val = input ? input.value.trim() : '';
    if (!val) {
      showMobileToast('Lütfen bir emoji veya simge girin');
      return;
    }
    window.selectBehaviorEmoji(val);
  };

  window.editMobileBehaviorPoints = async (type, id, encodedName, currentPts) => {
    window.vibrate(20);
    const name = encodedName ? decodeURIComponent(encodedName) : 'Davranış';
    const inputVal = await (window.promptAsync 
      ? window.promptAsync(`"${name}" için puan değerini girin:`, Math.abs(currentPts)) 
      : Promise.resolve(prompt(`"${name}" için puan değerini girin:`, Math.abs(currentPts))));
    if (inputVal === null || inputVal.trim() === '') return;
    let newPts = parseInt(inputVal, 10);
    if (isNaN(newPts)) return;
    if (type === 'positive') newPts = Math.abs(newPts) || 1;
    if (type === 'development') newPts = -(Math.abs(newPts) || 1);

    if (window.stateManager && window.stateManager.state.performanceBehaviors) {
      const cat = type;
      let list = window.stateManager.state.performanceBehaviors[cat];
      if (!list && cat === 'development') list = window.stateManager.state.performanceBehaviors.negative;
      if (list) {
        const item = list.find(b => (b.id && b.id === id) || ((b.name || b.title) && (b.name || b.title) === name));
        if (item) {
          item.point = newPts;
          item.points = newPts;
          window.stateManager.saveState(`Davranış puanı güncellendi: ${newPts}`);
          renderMobilePointsConfig();
          showMobileToast(`✅ "${name}" puanı güncellendi: ${newPts > 0 ? '+' : ''}${newPts}`);
        }
      }
    }
  };

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
    const emojiEl = document.getElementById('m-new-pos-emoji');
    const title = nameEl ? nameEl.value.trim() : '';
    const points = ptsEl ? (parseInt(ptsEl.value) || 5) : 5;
    const icon = (emojiEl && emojiEl.value.trim()) ? emojiEl.value.trim() : '⭐';

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
      id: 'bh_' + Date.now() + Math.random().toString(36).substr(2, 4),
      title,
      name: title,
      points: Math.abs(points),
      point: Math.abs(points),
      icon,
      category: 'positive'
    };
    window.stateManager.state.performanceBehaviors.positive.push(newBh);
    window.stateManager.saveState('Yeni olumlu davranış eklendi');

    if (nameEl) nameEl.value = '';
    window.vibrate(20);
    renderMobilePointsConfig();
    showMobileToast(`✅ Olumlu davranış eklendi (${icon})`);
  };

  window.addMobileDevBehavior = () => {
    const nameEl = document.getElementById('m-new-dev-name');
    const ptsEl = document.getElementById('m-new-dev-pts');
    const emojiEl = document.getElementById('m-new-dev-emoji');
    const title = nameEl ? nameEl.value.trim() : '';
    let points = ptsEl ? (parseInt(ptsEl.value) || -5) : -5;
    if (points > 0) points = -points;
    const icon = (emojiEl && emojiEl.value.trim()) ? emojiEl.value.trim() : '⚠️';

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
      id: 'bh_' + Date.now() + Math.random().toString(36).substr(2, 4),
      title,
      name: title,
      points,
      point: points,
      icon,
      category: 'development'
    };
    window.stateManager.state.performanceBehaviors.development.push(newBh);
    window.stateManager.saveState('Yeni geliştirilmeli davranış eklendi');

    if (nameEl) nameEl.value = '';
    window.vibrate(20);
    renderMobilePointsConfig();
    showMobileToast(`✅ Geliştirilmeli davranış eklendi (${icon})`);
  };

  window.deleteMobileBehavior = (type, id, encodedName) => {
    const name = encodedName ? decodeURIComponent(encodedName) : '';
    if (!confirm(`"${name || 'Bu davranışı'}" silmek istediğinize emin misiniz?`)) return;
    if (window.stateManager && window.stateManager.state.performanceBehaviors) {
      const list = window.stateManager.state.performanceBehaviors[type] || [];
      window.stateManager.state.performanceBehaviors[type] = list.filter(b => {
        if (id && b.id) return b.id !== id;
        if (name && (b.name || b.title)) return (b.name || b.title) !== name;
        return true;
      });
      window.stateManager.saveState('Davranış silindi');
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

    if (typeof removeDemoStudentsIfOnlyDemoExist === 'function') {
      removeDemoStudentsIfOnlyDemoExist();
    }

    if (!window.stateManager.state.students) window.stateManager.state.students = [];

    const isDemo = window.LicenseConfig && window.LicenseConfig.isDemo;
    const studentLimit = isDemo ? (window.LicenseConfig.studentLimit || 5) : Infinity;

    let addedCount = 0;
    let hitLimit = false;

    for (let idx = 0; idx < list.length; idx++) {
      const st = list[idx];
      if (!st.name) continue;

      if (isDemo && window.stateManager.state.students.length >= studentLimit) {
        hitLimit = true;
        break;
      }

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
    }

    window.stateManager.saveState();
    window.closeBottomSheet();
    window.vibrate(40);
    
    let toastMsg = `🎉 ${addedCount} öğrenci başarıyla ${targetBranch ? targetBranch + ' şubesine ' : ''}eklendi!`;
    if (hitLimit) {
      toastMsg += ` (Demo sürüm sınırı nedeniyle ilk ${addedCount} öğrenci eklendi)`;
    }
    showMobileToast(toastMsg);

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

  // 8. HAFTALIK DEĞERLENDİRME MODÜLÜ -> js/mobile-exams.js modülüne taşındı.

  // DERS AKIŞI VE TEDARİK MODÜLÜ -> js/mobile-schedule.js modülüne taşındı.
  // 13. MODÜL: SINAVLAR & ANALİZ -> js/mobile-exams.js modülüne taşındı.
  window.switchTab = switchTab;
  window.showMobileToast = showMobileToast;
})();


