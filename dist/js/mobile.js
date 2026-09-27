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
  let timerSecondsLeft = 0;

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

  // DOM Yüklendiğinde Başlat
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });

  function initApp() {
    // Lucide ikonlarını güvenle render et
    if (window.lucide) {
      window.lucide.createIcons();
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

    // Haptic desteği kontrolü (Android Native + Web API)
    window.vibrate = (ms = 35) => {
      if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === 'function') {
        try { window.AndroidBridge.vibrate(ms); return; } catch (e) {}
      }
      if ('vibrate' in navigator) {
        try { navigator.vibrate(ms); } catch (e) {}
      }
    };
  }

  // ==========================================================================
  // SEKME YÖNETİMİ
  // ==========================================================================
  function switchTab(tabId) {
    currentTab = tabId;

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
          <div class="student-card-no">No: ${escapeHTML(st.number || '-')} ${st.branch ? '• ' + escapeHTML(st.branch) : ''}</div>
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
    const updatedStudent = window.stateManager.getStudentById(selectedStudentForPoints.id);
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
      <div class="hw-walk-no">No: ${escapeHTML(st.number || '-')} ${st.branch ? '• ' + escapeHTML(st.branch) : ''}</div>

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

    const st = window.stateManager.getStudentById(studentId);
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
              No: ${escapeHTML(st.number || '-')} ${st.branch ? '• ' + escapeHTML(st.branch) : ''}
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

    const st = window.stateManager.getStudentById(studentId);
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
  // 3. MODÜL: CEP KİTAPLIĞI
  // ==========================================================================
  function renderBooksTab() {
    const container = document.getElementById('m-books-list');
    if (!container) return;

    container.innerHTML = '';
    const books = window.stateManager ? window.stateManager.getBooks() : [];
    const activeReadings = [];

    // Halen okunmakta olan kitapları derle
    books.forEach(bk => {
      if (bk.borrowedBy && bk.borrowedBy.studentId) {
        const student = window.stateManager.getStudentById(bk.borrowedBy.studentId);
        if (student) {
          activeReadings.push({
            book: bk,
            student: student,
            borrowDate: bk.borrowedBy.date || '',
            isOverdue: isBookOverdue(bk.borrowedBy.date)
          });
        }
      }
    });

    if (activeReadings.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="book-check" style="width: 44px; height: 44px; margin-bottom: 0.5rem; opacity: 0.5;"></i>
          <p style="font-weight: 700;">Şu anda ödünçte kitap yok.</p>
          <p style="font-size: 0.8rem; margin-top: 0.25rem;">Tüm kitaplar kütüphanede teslim edilmiş durumda.</p>
        </div>
      `;
      return;
    }

    activeReadings.forEach(item => {
      const card = document.createElement('div');
      card.className = 'book-reading-card';
      card.innerHTML = `
        <div class="book-info-col">
          <div class="book-student-name">${escapeHTML(item.student.name)} ${escapeHTML(item.student.surname || '')}</div>
          <div class="book-title-text">${escapeHTML(item.book.title)}</div>
          <div class="book-due-badge ${item.isOverdue ? 'overdue' : 'ok'}">
            <i data-lucide="${item.isOverdue ? 'alert-circle' : 'clock'}" style="width: 12px; height: 12px;"></i>
            ${item.isOverdue ? 'Süresi Gecikti!' : 'Okuma Devam Ediyor'}
          </div>
        </div>
        <button class="btn-book-action" onclick="window.returnBookMobile('${item.book.id}', '${item.student.id}')">
          <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Teslim Al
        </button>
      `;
      container.appendChild(card);
    });
  }

  window.returnBookMobile = (bookId, studentId) => {
    if (!window.stateManager) return;
    window.stateManager.returnBook(bookId);
    window.vibrate(40);
    showMobileToast('Kitap teslim alındı ve okuma puanı işlendi!');
    renderBooksTab();
  };

  function isBookOverdue(borrowDateStr) {
    if (!borrowDateStr) return false;
    const bDate = new Date(borrowDateStr);
    const diffDays = Math.floor((Date.now() - bDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 14; // 14 günden fazla ise gecikmiş
  }

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
    let list = window.stateManager.getStudents(activeBranch) || [];
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

  // Android Geri Tuşu Yönetimi
  window.handleAndroidBack = () => {
    const sheet = document.getElementById('sheet-points');
    if (sheet && sheet.classList.contains('active')) {
      window.closeBottomSheet();
      return true;
    }
    return false;
  };

  // Mobil Yedekleme (Android Native Paylaşım + Tarayıcı İndirme)
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
      window.stateManager.exportData();
    }
  };

  // Global Metotlar
  window.switchTab = switchTab;
  window.showMobileToast = showMobileToast;
})();
