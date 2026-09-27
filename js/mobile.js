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
  // CANLI DERS KARTI (ÜSTTEKİ CANLI BİLGİ)
  // ==========================================================================
  function updateLiveLessonCard() {
    const titleEl = document.getElementById('live-lesson-name');
    const topicEl = document.getElementById('live-lesson-topic-text');
    const timeEl = document.getElementById('live-lesson-time-span');
    if (!titleEl || !topicEl || !timeEl) return;

    if (!window.stateManager) {
      titleEl.textContent = 'Ders Programı Hazır';
      topicEl.textContent = 'Sınıf Asistanı Canlı Modu';
      timeEl.textContent = 'Serbest Zaman';
      return;
    }

    const state = window.stateManager.loadState();
    const times = state.scheduleTimes || {};
    const grid = state.scheduleGrid || {};
    const lessons = state.definedLessons || [];
    const plans = state.plans || [];

    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();
    let dayOfWeek = now.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;

    const pKeys = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
    let currentPeriod = null;

    for (const pk of pKeys) {
      const t = times[pk];
      if (t && t.start && t.end) {
        const [sh, sm] = t.start.split(':').map(Number);
        const [eh, em] = t.end.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        if (curMin >= startMin && curMin <= endMin) {
          currentPeriod = pk;
          break;
        }
      }
    }

    if (currentPeriod && dayOfWeek <= 5) {
      const gridKey = `${dayOfWeek}-${currentPeriod}`;
      const lessonId = grid[gridKey];
      const lesson = lessons.find(l => l.id === lessonId);
      const t = times[currentPeriod];

      titleEl.textContent = lesson ? lesson.name.toUpperCase() : 'BOŞ DERS';
      timeEl.textContent = `${t.start} - ${t.end} (${currentPeriod.replace('p', '')}. Ders)`;

      // Yıllık Plan konusunu çek
      const matchedPlan = plans.find(p => p.courseName === (lesson ? lesson.name : ''));
      if (matchedPlan) {
        const schedule = matchedPlan.weeklySchedule || matchedPlan.weeks || [];
        const activeWeekIndex = Math.min(Math.max(0, Math.floor((now.getTime() - new Date(now.getFullYear(), 8, 15).getTime()) / (7 * 86400000))), schedule.length - 1);
        const activeWeek = schedule[activeWeekIndex];
        topicEl.textContent = activeWeek ? (activeWeek.topics ? activeWeek.topics[0] : activeWeek.topic || 'Müfredat Konusu') : 'Plan Konusu';
      } else {
        topicEl.textContent = 'Aktif ders işleniyor';
      }
    } else {
      titleEl.textContent = 'DERS SAATİ DIŞI 🌙';
      topicEl.textContent = 'Şu an aktif ders saati bulunmuyor.';
      timeEl.textContent = 'Serbest Zaman';
    }
  }

  // ==========================================================================
  // 1. MODÜL: PERFORMANS (HIZLI DOJO PUANLAMA)
  // ==========================================================================
  function renderPerformanceTab() {
    const container = document.getElementById('m-students-grid');
    if (!container) return;

    const students = getFilteredStudents();
    container.innerHTML = '';

    if (students.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="users" style="width: 40px; height: 40px; margin-bottom: 0.5rem; opacity: 0.5;"></i>
          <p style="font-weight: 600;">Öğrenci bulunamadı.</p>
        </div>
      `;
      return;
    }

    students.forEach(st => {
      const card = document.createElement('div');
      card.className = 'student-card';
      const avatarColor = getAvatarColor(st.id || st.name);
      const score = (st.scores && st.scores.total) || 0;

      card.innerHTML = `
        <div class="student-avatar" style="background-color: ${avatarColor};">
          ${st.photo ? `<img src="${st.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : st.name.charAt(0).toUpperCase()}
        </div>
        <div class="student-card-info">
          <div class="student-card-name">${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}</div>
          <div class="student-card-no">${formatStudentSubtitle(st)}</div>
        </div>
        <div class="student-card-score" id="score-badge-${st.id}">${score >= 0 ? '+' : ''}${score}</div>
      `;

      card.addEventListener('click', () => {
        openPointBottomSheet(st);
      });

      container.appendChild(card);
    });
  }

  // Puan Verme Bottom Sheet
  function openPointBottomSheet(student) {
    selectedStudentForPoints = student;
    window.vibrate(30);

    const sheet = document.getElementById('sheet-points');
    const backdrop = document.getElementById('sheet-backdrop');
    const title = document.getElementById('sheet-student-name');
    const scoreVal = document.getElementById('sheet-student-current-score');

    if (title) title.textContent = `${student.name} ${student.surname || ''}`;
    if (scoreVal) {
      const curScore = (student.scores && student.scores.total) || 0;
      scoreVal.textContent = `Toplam Puan: ${curScore >= 0 ? '+' : ''}${curScore}`;
    }

    if (sheet && backdrop) {
      backdrop.classList.add('active');
      sheet.classList.add('active');
    }
  }

  window.giveQuickPoint = (points, reason) => {
    if (!selectedStudentForPoints || !window.stateManager) return;

    window.stateManager.addScore(selectedStudentForPoints.id, points, reason);
    window.vibrate(45);

    // Rozet skorunu hemen güncelle
    const updatedStudent = getStudentByIdSafe(selectedStudentForPoints.id);
    const newTotal = (updatedStudent && updatedStudent.scores && updatedStudent.scores.total) || 0;

    const badge = document.getElementById(`score-badge-${selectedStudentForPoints.id}`);
    if (badge) {
      badge.textContent = `${newTotal >= 0 ? '+' : ''}${newTotal}`;
      badge.style.transform = 'scale(1.25)';
      setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200);
    }

    showMobileToast(`${selectedStudentForPoints.name}: ${points > 0 ? '+' : ''}${points} Puan (${reason})`);
    closeBottomSheet();
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
    let list = window.stateManager.getStudents(true) || [];
    const isMiddle = isMiddleSchool();
    if (isMiddle && activeBranch && activeBranch !== 'all') {
      list = list.filter(st => st.branch === activeBranch);
    }
    if (activeSearchTerm) {
      list = list.filter(st => {
        const full = `${st.name} ${st.surname || ''} ${st.number || ''}`.toLowerCase();
        return full.includes(activeSearchTerm);
      });
    }
    return list;
  }

  function populateBranchOptions(selectEl) {
    if (!window.stateManager) return;
    const branches = window.stateManager.getBranches ? window.stateManager.getBranches() : [];
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

  window.closeBottomSheet = () => {
    document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('active'));
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.classList.remove('active');
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
    if (subviewId === 'weekly') renderMobileWeekly();
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
    // 0. Yüzen menüler (FAB) açıksa kapat
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
    // 1. Çekmece açıksa kapat
    const drawer = document.getElementById('config-drawer');
    if (drawer && drawer.classList.contains('active')) {
      window.closeConfigDrawer();
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

  function initMobileGames() {
    window.backToGamesLanding();
  }

  window.backToGamesLanding = () => {
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

  // Oyun 1: Bilgi Yarışması
  window.startMobileQuizGame = () => {
    const landing = document.getElementById('m-games-landing');
    const arenaQuiz = document.getElementById('m-arena-quiz');
    const title = document.getElementById('m-games-header-title');
    if (landing) landing.style.display = 'none';
    if (arenaQuiz) arenaQuiz.style.display = 'block';
    if (title) title.textContent = 'Bilgi Yarışması';

    // Soruları state'ten veya hazır havuzdan çek
    const state = window.stateManager ? window.stateManager.state : {};
    quizQuestions = (state && state.quizQuestions && state.quizQuestions.length > 0)
      ? state.quizQuestions
      : [
        { text: "Türkiye'nin başkenti neresidir?", options: ["İstanbul", "Ankara", "İzmir", "Bursa"], correct: 1, category: "Coğrafya" },
        { text: "Güneş sistemindeki en büyük gezegen hangisidir?", options: ["Mars", "Dünya", "Jüpiter", "Venüs"], correct: 2, category: "Fen Bilimleri" },
        { text: "İstiklal Marşı'mızın şairi kimdir?", options: ["Mehmet Akif Ersoy", "Yahya Kemal", "Necip Fazıl", "Cahit Sıtkı"], correct: 0, category: "Türkçe" },
        { text: "3 x 7 işleminin sonucu kaçtır?", options: ["18", "21", "24", "27"], correct: 1, category: "Matematik" },
        { text: "Cumhuriyet kaç yılında ilan edilmiştir?", options: ["1919", "1920", "1923", "1924"], correct: 2, category: "Tarih" },
        { text: "Su kaç derecede kaynar?", options: ["90°C", "100°C", "110°C", "120°C"], correct: 1, category: "Fen Bilimleri" }
      ];

    // Soruları karıştır
    quizQuestions = [...quizQuestions].sort(() => Math.random() - 0.5);
    currentQuizIdx = 0;
    quizScore = 0;
    renderCurrentQuizQuestion();
  };

  function renderCurrentQuizQuestion() {
    const qText = document.getElementById('m-quiz-question-text');
    const optContainer = document.getElementById('m-quiz-options-container');
    const scoreBadge = document.getElementById('m-quiz-score-badge');
    const catBadge = document.getElementById('m-quiz-category');
    if (!qText || !optContainer) return;

    if (currentQuizIdx >= quizQuestions.length) {
      qText.innerHTML = `🏆 Yarışma Tamamlandı!<br><span style="font-size: 0.9rem; color: var(--m-primary); margin-top: 8px;">Toplam Puan: ${quizScore}</span>`;
      optContainer.innerHTML = '';
      if (scoreBadge) scoreBadge.textContent = `Puan: ${quizScore}`;
      return;
    }

    const q = quizQuestions[currentQuizIdx];
    if (qText) qText.textContent = `${currentQuizIdx + 1}. ${q.text || q.question}`;
    if (scoreBadge) scoreBadge.textContent = `Puan: ${quizScore}`;
    if (catBadge) catBadge.textContent = q.category || 'Genel Kültür';

    const opts = q.options || [];
    const correctIdx = (typeof q.correct === 'number') ? q.correct : 0;

    optContainer.innerHTML = opts.map((opt, i) => `
      <button class="game-quiz-btn" onclick="window.handleQuizAnswer(${i}, ${correctIdx})">
        <span style="width: 26px; height: 26px; border-radius: 50%; background: var(--m-surface); border: 1px solid var(--m-border); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800;">
          ${String.fromCharCode(65 + i)}
        </span>
        <span style="flex: 1;">${escapeHTML(opt)}</span>
      </button>
    `).join('');
  }

  window.handleQuizAnswer = (selectedIdx, correctIdx) => {
    const btns = document.querySelectorAll('.game-quiz-btn');
    btns.forEach((btn, i) => {
      btn.disabled = true;
      if (i === correctIdx) btn.classList.add('correct');
      if (i === selectedIdx && selectedIdx !== correctIdx) btn.classList.add('wrong');
    });

    if (selectedIdx === correctIdx) {
      window.vibrate(30);
      playSynthChime('correct');
      quizScore += 10;
      showMobileToast('👏 Doğru Cevap! (+10 Puan)');
    } else {
      window.vibrate(100);
      playSynthChime('wrong');
      showMobileToast('❌ Yanlış Cevap');
    }

    const scoreBadge = document.getElementById('m-quiz-score-badge');
    if (scoreBadge) scoreBadge.textContent = `Puan: ${quizScore}`;
  };

  window.nextQuizQuestion = () => {
    currentQuizIdx++;
    renderCurrentQuizQuestion();
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
      titleEl.textContent = '📅 Sınıf Nöbet Listesi';
      const dutyStudents = students.slice(0, 2);
      bodyEl.innerHTML = `
        <div style="padding: 0.5rem 0;">
          <div style="font-weight: 800; font-size: 0.95rem; margin-bottom: 0.75rem; color: var(--m-primary);">
            Bu Haftanın Nöbetçi Öğrencileri
          </div>
          ${dutyStudents.length > 0 ? dutyStudents.map((st, i) => `
            <div class="m-item-card" style="flex-direction: row; align-items: center; gap: 12px;">
              <span class="m-badge m-badge-active">${i + 1}. Nöbetçi</span>
              <div style="font-weight: 800; font-size: 0.95rem;">${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}</div>
            </div>
          `).join('') : '<div class="empty-state">Öğrenci bulunamadı.</div>'}
          <button class="subview-primary-action-btn" style="margin-top: 1rem;" onclick="showMobileToast('Nöbet listesi güncellendi!')">
            Nöbetçileri Yeniden Ata
          </button>
        </div>
      `;
    } else if (toolType === 'seating') {
      titleEl.textContent = '🗺️ Sınıf Oturma & Yerleşim';
      bodyEl.innerHTML = `
        <div style="padding: 0.5rem 0;">
          <div style="font-size: 0.8rem; color: var(--m-text-muted); margin-bottom: 1rem; text-align: center;">Tahta & Öğretmen Masası</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            ${students.slice(0, 12).map((st, i) => `
              <div class="m-item-card" style="padding: 0.75rem; text-align: center;">
                <div style="font-size: 0.72rem; color: var(--m-text-light);">Sıra ${i + 1}</div>
                <div style="font-weight: 700; font-size: 0.88rem; margin-top: 2px;">${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (toolType === 'schedule') {
      titleEl.textContent = '📖 Haftalık Ders Programı';
      const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
      bodyEl.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px; padding: 0.5rem 0;">
          ${days.map(d => `
            <div class="m-item-card" style="padding: 0.85rem 1rem;">
              <div style="font-weight: 800; font-size: 0.92rem; color: var(--m-primary);">${d}</div>
              <div style="font-size: 0.8rem; color: var(--m-text); margin-top: 4px;">1. Ders: Türkçe • 2. Ders: Matematik • 3. Ders: Fen Bilimleri</div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (toolType === 'supplies') {
      titleEl.textContent = '📦 Sınıf Katkı & Tedarik Takibi';
      bodyEl.innerHTML = `
        <div style="padding: 0.5rem 0;">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label class="m-item-card" style="flex-direction: row; align-items: center; gap: 10px; cursor: pointer;">
              <input type="checkbox" checked style="width: 18px; height: 18px;">
              <span style="font-weight: 700; font-size: 0.88rem;">Fotokopi Kağıdı (A4)</span>
            </label>
            <label class="m-item-card" style="flex-direction: row; align-items: center; gap: 10px; cursor: pointer;">
              <input type="checkbox" checked style="width: 18px; height: 18px;">
              <span style="font-weight: 700; font-size: 0.88rem;">Tahta Kalemi Seti</span>
            </label>
            <label class="m-item-card" style="flex-direction: row; align-items: center; gap: 10px; cursor: pointer;">
              <input type="checkbox" style="width: 18px; height: 18px;">
              <span style="font-weight: 700; font-size: 0.88rem;">Sınıf Kitaplığı Yeni Eserler</span>
            </label>
          </div>
          <button class="subview-primary-action-btn" style="margin-top: 1rem;" onclick="showMobileToast('İhtiyaçlar kaydedildi')">
            Kaydet
          </button>
        </div>
      `;
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

  window.openCreateReportModal = () => {
    openBottomSheet('modal-create-report');
  };

  window.generateNewReport = () => {
    const rangeSelect = document.getElementById('m-report-range');
    const chkPts = document.getElementById('m-rep-chk-points');
    const chkHw = document.getElementById('m-rep-chk-hw');
    const chkBk = document.getElementById('m-rep-chk-books');
    const chkAtt = document.getElementById('m-rep-chk-att');

    const range = rangeSelect ? rangeSelect.value : 'this-week';
    const students = getFilteredStudents();

    const reportStudents = students.map(st => ({
      id: st.id,
      name: `${st.name} ${st.surname || ''}`,
      number: st.number || '-',
      points: st.points || 0,
      booksRead: st.booksRead || 0
    }));

    const rangeLabels = {
      'today': 'Günün Özeti',
      'this-week': 'Haftalık Gelişim Dökümü',
      'this-month': 'Aylık Performans Özeti'
    };

    const newReport = {
      id: 'rep_' + Date.now(),
      title: `${activeBranch === 'all' ? 'Tüm Sınıflar' : activeBranch + ' Şubesi'} ${rangeLabels[range] || 'Raporu'}`,
      rangeLabel: rangeLabels[range] || 'Bu Hafta',
      branch: activeBranch,
      metrics: 'Puan, Ödev, Kitap',
      totalStudents: students.length,
      students: reportStudents,
      createdAt: new Date().toISOString()
    };

    if (!window.stateManager.state.reports) window.stateManager.state.reports = [];
    window.stateManager.state.reports.push(newReport);
    window.stateManager.saveState();

    window.closeBottomSheet();
    window.vibrate(30);
    showMobileToast('✅ Rapor başarıyla üretildi!');
    renderMobileReports();
  };

  window.viewMobileReport = (repId) => {
    const state = window.stateManager.state;
    const rep = (state.reports || []).find(r => r.id === repId);
    if (!rep) return;

    const titleEl = document.getElementById('m-view-report-title');
    const contentEl = document.getElementById('m-view-report-content');
    if (titleEl) titleEl.textContent = rep.title || 'Rapor Detayı';

    const stList = rep.students || [];

    if (contentEl) {
      contentEl.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--m-text-muted); margin-bottom: 1rem;">
          Tarih: ${new Date(rep.createdAt).toLocaleDateString('tr-TR')} • Toplam: ${stList.length} Öğrenci
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${stList.map((st, i) => `
            <div class="m-item-card" style="padding: 0.75rem 1rem; margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 800; font-size: 0.9rem;">${i + 1}. ${escapeHTML(st.name)}</div>
                <span class="m-badge m-badge-active">${st.points || 0} Puan</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--m-text-muted); margin-top: 2px;">
                No: ${escapeHTML(st.number || '-')} • Okunan Kitap: ${st.booksRead || 0}
              </div>
            </div>
          `).join('')}
        </div>

        <button class="subview-primary-action-btn" style="margin-top: 1.25rem;" onclick="window.shareMobileReport('${rep.id}')">
          <i data-lucide="share-2" style="width: 18px; height: 18px;"></i> Bu Raporu Gönder / Paylaş
        </button>
      `;
    }

    openBottomSheet('modal-view-report');
  };

  window.shareMobileReport = (repId) => {
    const state = window.stateManager.state;
    const rep = (state.reports || []).find(r => r.id === repId);
    if (!rep) return;

    const dateStr = new Date(rep.createdAt).toLocaleDateString('tr-TR');
    let summaryText = `📊 *${rep.title}*\n📅 Tarih: ${dateStr}\n👥 Öğrenci Sayısı: ${rep.students ? rep.students.length : 0}\n\n`;

    (rep.students || []).slice(0, 15).forEach((st, i) => {
      summaryText += `${i + 1}. ${st.name} → ${st.points || 0} Puan (Kitap: ${st.booksRead || 0})\n`;
    });

    if (navigator.share) {
      navigator.share({
        title: rep.title,
        text: summaryText
      }).catch(() => {});
    } else {
      // WhatsApp doğrudan paylaşım URL'si
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
      window.open(waUrl, '_blank');
    }
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
    if (aiModel) aiModel.value = localStorage.getItem('sinif_asistani_gemini_model') || 'gemini-1.5-flash';

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
    let students = window.stateManager ? (window.stateManager.state.students || []) : [];

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

    container.innerHTML = students.map(st => `
      <div class="m-item-card" style="padding: 0.75rem 0.85rem; flex-direction: row; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="min-width: 0; flex: 1;">
          <div style="font-weight: 800; font-size: 0.9rem; color: var(--m-text);">${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}</div>
          <div style="font-size: 0.74rem; color: var(--m-text-muted); margin-top: 2px;">
            No: <strong>${escapeHTML(st.number || '-')}</strong>${(isMiddle && st.branch) ? ` • Şube: <strong>${escapeHTML(st.branch)}</strong>` : ''}
            ${st.phone ? ` • 📞 ${escapeHTML(st.phone)}` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 6px; flex-shrink: 0;">
          <button class="m-btn-sm" style="padding: 6px 10px; font-size: 0.75rem;" onclick="window.editMobileStudent('${st.id}')">
            <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i> Düzenle
          </button>
          <button class="m-btn-sm danger" style="padding: 6px 8px;" onclick="window.deleteConfigStudent('${st.id}')">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  window.addMobileStudent = () => {
    const nameEl = document.getElementById('m-cfg-st-name');
    const surEl = document.getElementById('m-cfg-st-surname');
    const noEl = document.getElementById('m-cfg-st-no');
    const brEl = document.getElementById('m-cfg-st-branch');
    const genEl = document.getElementById('m-cfg-st-gender');
    const phEl = document.getElementById('m-cfg-st-phone');

    const name = nameEl ? nameEl.value.trim() : '';
    if (!name) {
      showMobileToast('Lütfen öğrenci adı girin');
      return;
    }

    const newStudent = {
      id: 'st_' + Date.now(),
      name,
      surname: surEl ? surEl.value.trim() : '',
      number: noEl ? noEl.value.trim() : '',
      branch: isMiddleSchool() ? ((brEl && brEl.value !== 'all') ? brEl.value : (activeBranch !== 'all' ? activeBranch : 'A')) : '',
      gender: genEl ? genEl.value : 'male',
      phone: phEl ? phEl.value.trim() : '',
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

    window.vibrate(30);
    showMobileToast('✅ Öğrenci kaydedildi');
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
      brEl.value = student.branch || 'A';
    }
    if (genEl) genEl.value = student.gender || 'male';
    if (phEl) phEl.value = student.phone || '';

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

    const id = idEl ? idEl.value : null;
    const name = nameEl ? nameEl.value.trim() : '';
    if (!id || !name) {
      showMobileToast('Lütfen öğrenci adı girin');
      return;
    }

    const student = (window.stateManager.state.students || []).find(s => s.id === id);
    if (student) {
      student.name = name;
      student.surname = surEl ? surEl.value.trim() : '';
      student.number = noEl ? noEl.value.trim() : '';
      student.branch = isMiddleSchool() ? (brEl ? brEl.value : 'A') : '';
      student.gender = genEl ? genEl.value : 'male';
      student.phone = phEl ? phEl.value.trim() : '';
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
      window.closeBottomSheet();
      if (activeMobileSubview !== 'config') {
        window.openMobileSubview('config');
      }
      window.switchConfigPanel('students');
      setTimeout(() => {
        const brEl = document.getElementById('m-cfg-st-branch');
        if (brEl) {
          populateBranchOptions(brEl);
          if (activeBranch !== 'all') brEl.value = activeBranch;
        }
        syncEducationLevelUI();
        window.openBottomSheet('modal-add-student-manual');
        const nameInput = document.getElementById('m-cfg-st-name');
        if (nameInput) nameInput.focus();
      }, 200);
    } else if (method === 'ai') {
      window.triggerAiStudentScan();
    }
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
    if (!apiKey) throw new Error('API anahtarı bulunamadı');

    const savedModel = (localStorage.getItem('sinif_asistani_gemini_model') || 'gemini-1.5-flash').trim();
    const candidateModels = [
      savedModel,
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro'
    ].filter((v, i, a) => a.indexOf(v) === i);

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

    for (const model of candidateModels) {
      const cleanModelName = model.startsWith('models/') ? model : `models/${model}`;
      const url = `https://generativelanguage.googleapis.com/v1beta/${cleanModelName}:generateContent?key=${encodeURIComponent(apiKey)}`;

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
                    inlineData: {
                      mimeType: mimeType || 'image/jpeg',
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
                      inlineData: {
                        mimeType: mimeType || 'image/jpeg',
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
          let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          rawText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
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

      window.tempAiScannedStudents = students.map((s, idx) => ({
        index: idx,
        number: String(s.number || s.no || '').trim(),
        name: String(s.name || s.ad || '').trim(),
        surname: String(s.surname || s.soyad || '').trim(),
        gender: (s.gender === 'female' || s.gender === 'kız' || s.gender === 'K') ? 'female' : 'male',
        selected: true
      }));

      renderAiStudentPreviewModal();
      openBottomSheet('modal-ai-student-preview');
      window.vibrate(35);
      showMobileToast(`📸 ${window.tempAiScannedStudents.length} öğrenci tespit edildi!`);
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

  window.updateAiPreviewBranch = (val) => {
    // Toplu şube seçimi güncellendi
  };

  window.confirmSaveAiStudents = () => {
    const list = (window.tempAiScannedStudents || []).filter(s => s.selected);
    if (list.length === 0) {
      showMobileToast('Lütfen eklenecek en az bir öğrenci seçin');
      return;
    }

    const isMiddle = isMiddleSchool();
    const branchSelect = document.getElementById('m-ai-preview-branch');
    const targetBranch = isMiddle ? (branchSelect ? branchSelect.value : (activeBranch !== 'all' ? activeBranch : 'A')) : '';

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
  // 8. HAFTALIK DEĞERLENDİRME MODÜLÜ
  // ==========================================================================
  let weeklyOffset = 0;

  window.changeWeeklyOffset = (delta) => {
    weeklyOffset += delta;
    window.vibrate(15);
    renderMobileWeekly();
  };

  function renderMobileWeekly() {
    const container = document.getElementById('m-weekly-list-container');
    const weekLabel = document.getElementById('m-weekly-week-label');
    if (!container) return;

    if (weekLabel) {
      weekLabel.textContent = weeklyOffset === 0 ? 'Mevcut Hafta' : `${weeklyOffset > 0 ? '+' : ''}${weeklyOffset} Hafta`;
    }

    const students = getFilteredStudents();
    if (students.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="users" class="empty-icon"></i>
          <div class="empty-title">Öğrenci Bulunamadı</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = students.map(st => {
      const pts = st.points || 0;
      const stars = pts >= 20 ? '⭐⭐⭐' : pts >= 10 ? '⭐⭐' : pts >= 0 ? '⭐' : '⚪';

      return `
        <div class="m-item-card">
          <div class="m-item-header">
            <div>
              <div class="m-item-title">${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}</div>
              <div style="font-size: 0.75rem; color: var(--m-text-muted); margin-top: 2px;">
                ${formatStudentSubtitle(st)}
              </div>
            </div>
            <div style="font-size: 1.1rem;">${stars}</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <div style="font-size: 0.8rem; color: var(--m-text-muted);">Haftalık Toplam Puan:</div>
            <span class="m-badge ${pts >= 0 ? 'm-badge-active' : 'm-badge-warning'}">${pts > 0 ? '+' : ''}${pts} Puan</span>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

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

  // Global Dışa Aktarımlar
  window.switchTab = switchTab;
  window.showMobileToast = showMobileToast;
})();


