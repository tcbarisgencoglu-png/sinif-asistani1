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
    // Diğer sekmesine dön
    switchTab('more');
  };

  // Android Donanım Geri Tuşu Yönetimi
  window.handleAndroidBack = () => {
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
                📅 ${escapeHTML(dateStr)} • Şube: ${escapeHTML(rep.branch || 'Tümü')}
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

  window.switchConfigPanel = (panelName) => {
    window.closeConfigDrawer();
    window.vibrate(15);

    document.querySelectorAll('#m-config-panels-wrapper .config-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.config-drawer-item').forEach(b => b.classList.remove('active'));

    const targetPanel = document.getElementById(`config-panel-${panelName}`);
    if (targetPanel) targetPanel.style.display = 'block';

    const drawerBtn = document.querySelector(`.config-drawer-item[data-panel="${panelName}"]`);
    if (drawerBtn) drawerBtn.classList.add('active');

    const titleEl = document.getElementById('m-config-panel-title');
    const titles = {
      'general': 'Genel Ayarlar',
      'ai': 'Yapay Zeka (AI)',
      'points': 'Puan Ayarları',
      'week': 'Geçerli Hafta',
      'students': 'Öğrenci Yönetimi',
      'lock': 'Şifre Kontrolü',
      'manual': 'Kullanım Kılavuzu'
    };
    if (titleEl) titleEl.textContent = titles[panelName] || 'Konfigürasyon';

    if (window.lucide) window.lucide.createIcons();
  };

  function initMobileConfig() {
    const state = window.stateManager ? window.stateManager.state : {};

    // 1. Genel
    const lvl = document.getElementById('m-cfg-level');
    if (lvl) lvl.value = state.gradeLevel || 'primary';

    const branchName = document.getElementById('m-cfg-branch-name');
    if (branchName) branchName.value = state.branchName || '';

    // 2. AI
    const aiKey = document.getElementById('m-cfg-ai-key');
    if (aiKey) aiKey.value = localStorage.getItem('sinif_asistani_gemini_api_key') || '';

    // 3. Hafta Seçici (1-36)
    const weekSelect = document.getElementById('m-cfg-week-select');
    if (weekSelect) {
      weekSelect.innerHTML = '';
      for (let w = 1; w <= 36; w++) {
        const opt = document.createElement('option');
        opt.value = w;
        opt.textContent = `${w}. Çalışma Haftası`;
        if (state.currentWeek == w) opt.selected = true;
        weekSelect.appendChild(opt);
      }
    }

    // 4. Şube Seçici (Öğrenci Yönetimi)
    const stBranch = document.getElementById('m-cfg-st-branch');
    if (stBranch) populateBranchOptions(stBranch);

    renderConfigStudentsList();
  }

  function renderConfigStudentsList() {
    const container = document.getElementById('m-cfg-students-list');
    const totalEl = document.getElementById('m-cfg-st-total');
    if (!container) return;

    const students = getFilteredStudents();
    if (totalEl) totalEl.textContent = students.length;

    container.innerHTML = students.map(st => `
      <div class="m-item-card" style="padding: 0.65rem 0.85rem; flex-direction: row; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <div>
          <div style="font-weight: 700; font-size: 0.88rem;">${escapeHTML(st.name)} ${escapeHTML(st.surname || '')}</div>
          <div style="font-size: 0.72rem; color: var(--m-text-muted);">No: ${escapeHTML(st.number || '-')} • Şube: ${escapeHTML(st.branch || '-')}</div>
        </div>
        <button class="m-btn-sm" style="flex: 0 0 36px; padding: 0.4rem;" onclick="window.deleteConfigStudent('${st.id}')">
          <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--m-danger);"></i>
        </button>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  window.saveMobileGeneralConfig = () => {
    const lvl = document.getElementById('m-cfg-level');
    const branchName = document.getElementById('m-cfg-branch-name');

    if (lvl) window.stateManager.state.gradeLevel = lvl.value;
    if (branchName) window.stateManager.state.branchName = branchName.value.trim();

    window.stateManager.saveState();
    window.vibrate(30);
    showMobileToast('✅ Genel ayarlar kaydedildi');
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
    const key = localStorage.getItem('sinif_asistani_gemini_api_key');
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

  window.saveMobilePointRules = () => {
    const hwFull = document.getElementById('m-cfg-pt-hw-full');
    const hwHalf = document.getElementById('m-cfg-pt-hw-half');
    const hwZero = document.getElementById('m-cfg-pt-hw-zero');

    if (!window.stateManager.state.rules) window.stateManager.state.rules = {};
    if (hwFull) window.stateManager.state.rules.homeworkFull = parseInt(hwFull.value) || 4;
    if (hwHalf) window.stateManager.state.rules.homeworkHalf = parseInt(hwHalf.value) || 2;
    if (hwZero) window.stateManager.state.rules.homeworkZero = parseInt(hwZero.value) || -4;

    window.stateManager.saveState();
    window.vibrate(30);
    showMobileToast('✅ Puan kuralları güncellendi');
  };

  window.saveMobileActiveWeek = () => {
    const sel = document.getElementById('m-cfg-week-select');
    if (sel) {
      window.stateManager.state.currentWeek = parseInt(sel.value) || 1;
      window.stateManager.saveState();
      window.vibrate(30);
      showMobileToast(`✅ ${sel.value}. Çalışma Haftası aktif edildi`);
    }
  };

  window.addMobileStudent = () => {
    const nameEl = document.getElementById('m-cfg-st-name');
    const surEl = document.getElementById('m-cfg-st-surname');
    const noEl = document.getElementById('m-cfg-st-no');
    const brEl = document.getElementById('m-cfg-st-branch');

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
      branch: (brEl && brEl.value !== 'all') ? brEl.value : (activeBranch !== 'all' ? activeBranch : 'A'),
      points: 0,
      booksRead: 0
    };

    if (!window.stateManager.state.students) window.stateManager.state.students = [];
    window.stateManager.state.students.push(newStudent);
    window.stateManager.saveState();

    if (nameEl) nameEl.value = '';
    if (surEl) surEl.value = '';
    if (noEl) noEl.value = '';

    window.vibrate(30);
    showMobileToast('✅ Öğrenci kaydedildi');
    renderConfigStudentsList();
    renderActiveTab();
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

  window.saveMobilePin = () => {
    const pin = document.getElementById('m-cfg-pin-code');
    if (!pin || pin.value.length < 4) {
      showMobileToast('Lütfen 4 haneli PIN girin');
      return;
    }
    localStorage.setItem('sinif_asistani_app_pin', pin.value);
    window.vibrate(30);
    showMobileToast('✅ PIN kodu belirlendi');
  };

  window.removeMobilePin = () => {
    localStorage.removeItem('sinif_asistani_app_pin');
    const pin = document.getElementById('m-cfg-pin-code');
    if (pin) pin.value = '';
    window.vibrate(20);
    showMobileToast('Kilit kaldırıldı');
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
                No: ${escapeHTML(st.number || '-')} • Şube: ${escapeHTML(st.branch || '-')}
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


