/**
 * SINIF ASİSTANI — MOBİL ARAÇLAR & YÖNETİM MODÜLÜ (MOBILE-TOOLS.JS)
 * Görev Takip Asistanı, Sınıf Araçları, Nöbet Listesi, Oturma Planı ve Evrak Deposu.
 */

(function(window) {
  'use strict';

  const escapeHTML = window.escapeHTML || (str => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  });
  const showMobileToast = window.showMobileToast || (msg => alert(msg));
  const showToast = showMobileToast;
  const getFilteredStudents = () => (window.getFilteredStudents ? window.getFilteredStudents() : []);
  const getAvatarColor = (id) => (window.getAvatarColor ? window.getAvatarColor(id) : '#4f46e5');
  const openBottomSheet = (id) => {
    if (typeof window.openBottomSheet === 'function') {
      return window.openBottomSheet(id);
    }
    const sheet = document.getElementById(id);
    const backdrop = document.getElementById('sheet-backdrop');
    if (sheet) sheet.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  };
  const closeBottomSheet = () => {
    if (typeof window.closeBottomSheet === 'function') {
      return window.closeBottomSheet();
    }
    document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('active'));
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.classList.remove('active');
  };

  // ==========================================================================
  // 3. GÖREVLER MODÜLÜ (GÖREV TAKİP ASİSTANI)
  // ==========================================================================
  let currentTasksFilter = 'active'; // 'active' | 'completed' | 'passive'

  window.toggleTasksFab = () => {
    const menu = document.getElementById('m-tasks-fab-menu');
    const btn = document.getElementById('m-tasks-fab-btn');
    if (btn && typeof window.cancelFabAttention === 'function') window.cancelFabAttention(btn);
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
    if (window.vibrate) window.vibrate(20);
    if (toolType === 'attendance') {
      if (typeof window.openAttendanceModal === 'function') {
        window.openAttendanceModal();
      } else {
        openBottomSheet('modal-attendance');
      }
      return;
    }
    const titleEl = document.getElementById('m-tool-window-title');
    const bodyEl = document.getElementById('m-tool-window-body');
    if (!titleEl || !bodyEl) return;

    const students = getFilteredStudents();

    if (toolType === 'lucky') {
      titleEl.textContent = '🎲 Şanslı Öğrenci (Kura)';
      bodyEl.innerHTML = `
        <div style="text-align: center; padding: 1.25rem 0.5rem;">
          <div id="tool-lucky-display" style="min-height: 190px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--m-surface-subtle); border-radius: var(--m-radius-md); border: 2px dashed var(--m-warning); margin-bottom: 1.25rem; padding: 1.25rem 1rem;">
            <div style="width: 76px; height: 76px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); color: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin-bottom: 0.75rem; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);">
              🎲
            </div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--m-text); margin-bottom: 4px;">
              Kurayı Başlatın!
            </div>
            <div style="font-size: 0.8rem; color: var(--m-text-muted); max-width: 260px; line-height: 1.4;">
              Sınıftan rastgele ve adil bir öğrenci seçmek için aşağıdaki butona dokunun.
            </div>
          </div>
          <button id="btn-spin-lucky-tool" class="subview-primary-action-btn" onclick="window.spinLuckyStudentTool()">
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

  // Kura Döndürücü (Şanslı Öğrenci)
  window.rewardLuckyStudent = (studentId) => {
    const student = (window.getStudentByIdSafe ? window.getStudentByIdSafe(studentId) : null) ||
      getFilteredStudents().find(s => String(s.id) === String(studentId)) ||
      (((window.stateManager && window.stateManager.state && window.stateManager.state.students) || []).find(s => String(s.id) === String(studentId)));
    if (student && typeof window.openPointBottomSheet === 'function') {
      window.openPointBottomSheet(student);
    } else {
      showMobileToast('Öğrenci bulunamadı');
    }
  };

  window.spinLuckyStudentTool = () => {
    let students = getFilteredStudents();
    if (window.stateManager && typeof window.stateManager.isStudentAbsent === 'function') {
      const present = students.filter(s => !window.stateManager.isStudentAbsent(s.id));
      if (present.length > 0) students = present;
    }
    if (students.length === 0) {
      showMobileToast('Bu şubede öğrenci bulunamadı!');
      return;
    }
    const display = document.getElementById('tool-lucky-display');
    const spinBtn = document.getElementById('btn-spin-lucky-tool');
    if (!display) return;

    if (spinBtn) {
      spinBtn.disabled = true;
      spinBtn.style.opacity = '0.6';
      spinBtn.style.pointerEvents = 'none';
    }

    let count = 0;
    const maxCount = 18;
    const interval = setInterval(() => {
      const rand = students[Math.floor(Math.random() * students.length)];
      const avatarColor = getAvatarColor(rand.id || rand.name);

      display.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; animation: tabFadeIn 0.1s ease-out; width: 100%;">
          <div style="width: 76px; height: 76px; border-radius: 50%; overflow: hidden; border: 3px solid var(--m-primary); box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3); display: flex; align-items: center; justify-content: center; background: ${avatarColor}; flex-shrink: 0;">
            ${rand.photo 
              ? `<img src="${rand.photo}" alt="${escapeHTML(rand.name)}" style="width: 100%; height: 100%; object-fit: cover;">` 
              : `<span style="font-size: 1.9rem; font-weight: 800; color: white;">${escapeHTML((rand.name || '?').charAt(0).toUpperCase())}</span>`
            }
          </div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px;">
            ${escapeHTML(rand.name)} ${escapeHTML(rand.surname || '')}
          </div>
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--m-text-muted);">
            Okul No: ${escapeHTML(rand.number || '-')}
          </div>
        </div>
      `;
      if (window.vibrate) window.vibrate(10);
      count++;

      if (count >= maxCount) {
        clearInterval(interval);
        const winner = students[Math.floor(Math.random() * students.length)];
        const winnerColor = getAvatarColor(winner.id || winner.name);

        display.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; animation: tabFadeIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); width: 100%;">
            <div style="font-size: 0.78rem; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px; display: inline-flex; align-items: center; gap: 4px;">
              <span>✨</span> ŞANSLI ÖĞRENCİ <span>✨</span>
            </div>
            
            <div style="position: relative; width: 92px; height: 92px; border-radius: 50%; overflow: hidden; border: 3.5px solid #f59e0b; box-shadow: 0 6px 22px rgba(245, 158, 11, 0.45); display: flex; align-items: center; justify-content: center; background: ${winnerColor}; flex-shrink: 0; margin: 4px 0;">
              ${winner.photo 
                ? `<img src="${winner.photo}" alt="${escapeHTML(winner.name)}" style="width: 100%; height: 100%; object-fit: cover;">` 
                : `<span style="font-size: 2.4rem; font-weight: 800; color: white;">${escapeHTML((winner.name || '?').charAt(0).toUpperCase())}</span>`
              }
            </div>

            <div style="font-size: 1.35rem; font-weight: 900; color: var(--m-text); line-height: 1.2; margin-top: 2px;">
              🎉 ${escapeHTML(winner.name)} ${escapeHTML(winner.surname || '')}
            </div>

            <div style="font-size: 0.85rem; font-weight: 700; color: var(--m-text-muted);">
              Okul No: <strong style="color: var(--m-primary);">${escapeHTML(winner.number || '-')}</strong>
              ${winner.branch ? ` &bull; Şube: <strong>${escapeHTML(winner.branch)}</strong>` : ''}
            </div>

            <div style="margin-top: 10px; display: flex; gap: 8px; justify-content: center; width: 100%;">
              <button type="button" class="m-btn-sm" onclick="window.rewardLuckyStudent('${winner.id}')" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; font-weight: 800; padding: 7px 18px; border-radius: 20px; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 3px 10px rgba(245, 158, 11, 0.35); cursor: pointer;">
                ⭐ Puan Ver
              </button>
            </div>
          </div>
        `;

        if (spinBtn) {
          spinBtn.disabled = false;
          spinBtn.style.opacity = '1';
          spinBtn.style.pointerEvents = 'auto';
        }

        if (window.vibrate) window.vibrate(60);
        if (typeof playSynthChime === 'function') playSynthChime('fanfare');
        if (window.lucide) window.lucide.createIcons();
      }
    }, 75);
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
    if (window.vibrate) window.vibrate(20);
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
    if (window.vibrate) window.vibrate(20);
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
    const pickerSheet = document.getElementById('modal-seating-student-select');
    const planSheet = document.getElementById('modal-seating-plan');
    const backdrop = document.getElementById('sheet-backdrop');
    if (pickerSheet) pickerSheet.classList.add('active');
    if (planSheet) planSheet.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
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
    const planSheet = document.getElementById('modal-seating-plan');
    if (planSheet) planSheet.classList.add('active');
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.classList.add('active');

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
    const planSheet = document.getElementById('modal-seating-plan');
    if (planSheet) planSheet.classList.add('active');
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.classList.add('active');

    showToast('Koltuk boşaltıldı.', 'info');
  };

  window.closeMobileSeatPicker = function() {
    mActiveSeatTarget = null;
    const sheet = document.getElementById('modal-seating-student-select');
    if (sheet) sheet.classList.remove('active');
    // Oturma planının ve backdrop'ın aktif kalmasını sağla
    const planSheet = document.getElementById('modal-seating-plan');
    if (planSheet) planSheet.classList.add('active');
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.classList.add('active');
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
    if (window.vibrate) window.vibrate(20);
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
    if (typeof window.cancelFabAttention === 'function') window.cancelFabAttention(fabBtn);

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


  window.renderMobileTasks = renderMobileTasks;
  window.renderMobileTools = renderMobileTools;

})(window);
