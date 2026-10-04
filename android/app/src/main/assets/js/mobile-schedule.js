/**
 * SINIF ASİSTANI — MOBİL DERS AKIŞI & TEDARİK MODÜLÜ (MOBILE-SCHEDULE.JS)
 * Ders Programı, Yıllık Planlar, Ders Saatleri ve Sınıf Katkı/Tedarik Takibi.
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

  let activePlanSubtab = 'plans'; // 'plans' | 'schedule' | 'times'
  let activeScheduleFlowTab = 'plans'; // 'schedule' | 'plans' | 'times'
  let activePlanCardWeek = {}; // planId -> active week index
  let activeViewPlanId = null;
  let activePlanViewMode = 'weekly'; // 'weekly' | 'monthly'
  let activeSelectedLessonColor = '#3b82f6';
  let activeCellPickerSlot = null; // { dayIdx, periodKey, dayName, periodName }
  let activeMebGradeFilter = 'all';

  // Plan Menüsü Ana Çizim Fonksiyonu (#tab-plan)
  window.renderPlanTabMobile = () => {
    const container = document.getElementById('m-plan-subtab-content');
    if (!container) return;

    // Alt sekme butonlarını güncelle
    const subtabs = ['plans', 'schedule', 'times'];
    subtabs.forEach(st => {
      const btn = document.getElementById(`btn-plan-subtab-${st}`);
      if (btn) {
        btn.classList.toggle('active', st === activePlanSubtab);
      }
    });

    if (activePlanSubtab === 'plans') {
      renderSchedulePlansTab(container);
    } else if (activePlanSubtab === 'schedule') {
      renderScheduleProgramTab(container);
    } else if (activePlanSubtab === 'times') {
      renderScheduleTimesTab(container);
    }

    if (typeof updateLiveLessonCard === 'function') {
      try { updateLiveLessonCard(); } catch (e) {}
    }
    if (window.lucide) window.lucide.createIcons();
  };

  // Plan Alt Sekmesi Değiştirme
  window.switchPlanSubtab = (subtab) => {
    activePlanSubtab = subtab || 'plans';
    activeScheduleFlowTab = subtab || 'plans';
    if (window.vibrate) window.vibrate(15);
    window.renderPlanTabMobile();
  };

  // Ana Modalı veya Sekmeyi Açma (Geriye Dönük Uyumluluk ile Plan Sayfasına Yönlendirir)
  window.openScheduleFlowModal = (tab = 'plans') => {
    if (window.vibrate) window.vibrate(20);
    try {
      activePlanSubtab = tab || 'plans';
      activeScheduleFlowTab = tab || 'plans';
      if (typeof window.switchTab === 'function') {
        window.switchTab('plan');
      }
      window.renderPlanTabMobile();
    } catch (e) {
      console.error('Error in openScheduleFlowModal:', e);
    }
  };

  // Ders Akışı Yüzen Menü Aç/Kapat (FAB Toggle)
  window.toggleScheduleFabMenu = () => {
    window.vibrate(15);
    const menu = document.getElementById('m-sched-fab-menu');
    const btn = document.getElementById('m-sched-fab-btn');
    if (btn && typeof window.cancelFabAttention === 'function') window.cancelFabAttention(btn);
    if (!menu) return;
    const isShowing = menu.classList.toggle('show');
    if (btn) btn.classList.toggle('active', isShowing);
    if (window.lucide) window.lucide.createIcons();
  };

  // Sekme / Alt Araç Değiştirme (Yüzen Menüden Çağrılır)
  window.switchScheduleFlowTab = (tab) => {
    activeScheduleFlowTab = tab;
    activePlanSubtab = tab;
    const menu = document.getElementById('m-sched-fab-menu');
    const btn = document.getElementById('m-sched-fab-btn');
    if (menu && menu.classList.contains('show')) {
      menu.classList.remove('show');
      if (btn) btn.classList.remove('active');
    }
    window.updateScheduleFlowTabsUI();
    window.renderScheduleFlowContent();
    window.renderPlanTabMobile();
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
  const MONTH_NAMES_ORDER = [
    'EYLÜL', 'EKİM', 'KASIM', 'ARALIK', 'OCAK',
    'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN'
  ];

  function getPlanActiveWeekIndex(p) {
    const weeks = p.weeklySchedule || p.weeks || [];
    if (!weeks.length) return 0;
    if (activePlanCardWeek[p.id] !== undefined) {
      const idx = activePlanCardWeek[p.id];
      if (idx >= 0 && idx < weeks.length) return idx;
    }
    if (typeof window.getMobileActiveWeekIndex === 'function') {
      const activeIdx = window.getMobileActiveWeekIndex(weeks);
      if (activeIdx >= 0 && activeIdx < weeks.length) {
        activePlanCardWeek[p.id] = activeIdx;
        return activeIdx;
      }
    }
    // Varsayılan olarak ilk tamamlanmamış hafta
    for (let i = 0; i < weeks.length; i++) {
      if (!weeks[i].isCompleted && !weeks[i].completed && !weeks[i].isHoliday) {
        activePlanCardWeek[p.id] = i;
        return i;
      }
    }
    activePlanCardWeek[p.id] = 0;
    return 0;
  }

  function renderSchedulePlansTab(container) {
    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const plans = state.plans || [];

    if (plans.length === 0) {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <div>
              <div style="font-weight: 850; font-size: 1rem; color: var(--m-text);">Yıllık Ders Planları</div>
              <div style="font-size: 0.74rem; color: var(--m-text-muted);">Müfredat ve haftalık kazanım takibi</div>
            </div>
            <button class="subview-primary-action-btn" style="width: auto; padding: 7px 14px; font-size: 0.8rem; border-radius: 10px; margin: 0;" onclick="window.openPlanAddOptions()">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Plan Ekle
            </button>
          </div>

          <div class="empty-state" style="padding: 2.5rem 1rem; text-align: center; background: var(--m-surface); border: 1.5px dashed var(--m-border); border-radius: var(--m-radius-md); margin-top: 0.5rem;">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📑</div>
            <div style="font-weight: 850; font-size: 1rem; color: var(--m-text); margin-bottom: 0.25rem;">Henüz Yıllık Plan Eklenmemiş</div>
            <div style="font-size: 0.8rem; color: var(--m-text-muted); max-width: 290px; margin: 0 auto 1.25rem; line-height: 1.4;">
              MEB müfredat havuzundan hazır yükleyebilir, Excel dosyanızı aktarabilir veya yapay zeka ile 36 haftalık Maarif/MEB planı oluşturabilirsiniz.
            </div>
            <button class="subview-secondary-btn" style="margin: 0 auto;" onclick="window.openPlanAddOptions()">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Hemen Plan Ekle
            </button>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <!-- Üst Başlık & Plan Ekle Butonu -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div>
            <div style="font-weight: 850; font-size: 1rem; color: var(--m-text);">Yıllık Ders Planları</div>
            <div style="font-size: 0.74rem; color: var(--m-text-muted);">Toplam ${plans.length} plan aktif</div>
          </div>
          <button class="subview-primary-action-btn" style="width: auto; padding: 7px 14px; font-size: 0.8rem; border-radius: 10px; margin: 0; box-shadow: var(--m-shadow-sm);" onclick="window.openPlanAddOptions()">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Plan Ekle
          </button>
        </div>

        <!-- Plan Kartları Listesi -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${plans.map(p => {
            const weeks = p.weeklySchedule || p.weeks || [];
            const totalWeeks = weeks.length || 36;
            const completedCount = weeks.filter(w => w.isCompleted || w.completed).length;
            const percent = totalWeeks > 0 ? Math.round((completedCount / totalWeeks) * 100) : 0;

            const curIdx = getPlanActiveWeekIndex(p);
            const w = weeks[curIdx] || {};
            const isDone = Boolean(w.isCompleted || w.completed);
            const wNum = w.weekNumber ? (Array.isArray(w.weekNumber) ? w.weekNumber[0] : w.weekNumber) : (curIdx + 1);
            const wLabel = w.weekLabel || `${wNum}. Hafta`;
            const wDate = w.dateRange ? `(${w.dateRange})` : '';

            const academicActiveIdx = (typeof window.getMobileActiveWeekIndex === 'function')
              ? window.getMobileActiveWeekIndex(weeks)
              : 0;
            const isAcademicWeek = (curIdx === academicActiveIdx);

            let topicText = '';
            if (typeof window.extractMobileWeekTopic === 'function') {
              topicText = window.extractMobileWeekTopic(w);
            } else {
              topicText = Array.isArray(w.topics) ? w.topics.join(', ') : (w.topics || w.topic || 'Ders konusu planda belirtilmemiş.');
            }

            const unitText = w.unitName ? (w.unitNo ? `${w.unitNo}. Ünite: ${w.unitName}` : `Ünite: ${w.unitName}`) : '';
            const outcomes = Array.isArray(w.learningOutcomes) ? w.learningOutcomes : (w.learningOutcomes ? [w.learningOutcomes] : []);
            const outcomePreview = outcomes.length > 0 ? outcomes[0] : '';

            const title = `${p.className ? p.className + ' - ' : ''}${p.courseName || p.title}`;
            const modelName = p.modelName || (p.modelType === 'maarif' ? 'Türkiye Yüzyılı Maarif Modeli' : 'Standart MEB');

            return `
              <div class="m-plan-card" id="m-plan-card-${p.id}">
                <!-- 1. Üst Kısım: Ders Başlığı, Model ve Aksiyonlar -->
                <div class="m-plan-card-header" onclick="window.openPlanWeeksViewModal('${p.id}')">
                  <div style="flex: 1; min-width: 0;">
                    <div class="m-plan-card-title">${escapeHTML(title)}</div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                      <span class="m-plan-badge-model">${escapeHTML(modelName)}</span>
                      <span class="m-plan-badge-year">📅 ${escapeHTML(p.educationYear || '2026-2027')}</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;" onclick="event.stopPropagation();">
                    <button class="m-plan-card-view-btn" onclick="window.openPlanWeeksViewModal('${p.id}')" title="Aylık ve Haftalık Görünüm">
                      <i data-lucide="eye" style="width: 13px; height: 13px;"></i>
                      <span>Görünüm</span>
                    </button>
                    <button class="m-plan-card-del-btn" onclick="window.deletePlanFromMobile('${p.id}')" title="Planı Sil">
                      <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                  </div>
                </div>

                <!-- 2. İlerleme Çubuğu (Yüzde ve Hafta) -->
                <div class="m-plan-progress-section" onclick="window.openPlanWeeksViewModal('${p.id}')">
                  <div class="m-plan-progress-header">
                    <span class="m-plan-progress-label">Müfredat İlerlemesi</span>
                    <span class="m-plan-progress-value">%${percent} • ${completedCount}/${totalWeeks} Hafta</span>
                  </div>
                  <div class="m-plan-progress-track">
                    <div class="m-plan-progress-fill" style="width: ${percent}%;"></div>
                  </div>
                </div>

                <!-- 3. Hafta İlerletme Navigasyonu -->
                <div class="m-plan-week-nav-bar" onclick="event.stopPropagation();">
                  <button class="m-plan-nav-arrow" ${curIdx === 0 ? 'disabled' : ''} onclick="window.stepPlanCardWeek('${p.id}', -1)" title="Önceki Hafta">
                    <i data-lucide="chevron-left" style="width: 18px; height: 18px;"></i>
                  </button>
                  <div class="m-plan-nav-week-info" onclick="window.openPlanWeeksViewModal('${p.id}')">
                    <span class="m-plan-nav-week-title">${escapeHTML(wLabel)}</span>
                    ${wDate ? `<span class="m-plan-nav-week-date">${escapeHTML(wDate)}</span>` : ''}
                    ${isAcademicWeek ? `<span class="m-plan-active-dot">● Aktif Hafta</span>` : `
                      <button class="m-plan-jump-current-btn" onclick="event.stopPropagation(); window.jumpPlanCardToActiveWeek('${p.id}')" title="Aktif takvim haftasına dön">
                        <span>📌 Bu Hafta</span>
                      </button>
                    `}
                  </div>
                  <button class="m-plan-nav-arrow" ${curIdx >= weeks.length - 1 ? 'disabled' : ''} onclick="window.stepPlanCardWeek('${p.id}', 1)" title="Sonraki Hafta">
                    <i data-lucide="chevron-right" style="width: 18px; height: 18px;"></i>
                  </button>
                </div>

                <!-- 4. Haftaya Ait Ders Konusu & Detaylar -->
                <div class="m-plan-week-content-box" onclick="window.openPlanWeeksViewModal('${p.id}')">
                  ${unitText ? `<div class="m-plan-unit-name">${escapeHTML(unitText)}</div>` : ''}
                  <div class="m-plan-topic-text">
                    <strong>Konu:</strong> ${escapeHTML(topicText)}
                  </div>
                  ${outcomePreview ? `
                    <div class="m-plan-outcomes-text">
                      <strong>Kazanım / Çıktı:</strong> ${escapeHTML(outcomePreview)}
                    </div>
                  ` : ''}
                </div>

                <!-- 5. Konunun İşlendiğini İşaretleyecek Onay Kutusu -->
                <div class="m-plan-check-row" onclick="event.stopPropagation();">
                  <label class="m-plan-check-label">
                    <input type="checkbox" class="m-plan-check-input" ${isDone ? 'checked' : ''} onchange="window.togglePlanWeekStatus('${p.id}', ${curIdx})">
                    <span style="color: ${isDone ? '#059669' : 'var(--m-text)'};">
                      ${isDone ? '✓ Bu Haftanın Konusu İşlendi' : 'Bu haftanın konusu işlendi olarak işaretle'}
                    </span>
                  </label>
                  ${isDone ? `<span style="font-size: 0.7rem; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.12); padding: 2px 7px; border-radius: 6px;">Tamamlandı</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
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
      delete activePlanCardWeek[planId];
      window.renderPlanTabMobile();
      updateLiveLessonCard();
      showMobileToast('Yıllık plan silindi', 'info');
    }
  };

  // Plan Kartında Hafta İlerletme / Geriletme
  window.stepPlanCardWeek = (planId, delta) => {
    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const plan = (state.plans || []).find(p => p.id === planId);
    if (!plan) return;
    const weeks = plan.weeklySchedule || plan.weeks || [];
    if (!weeks.length) return;

    let curIdx = activePlanCardWeek[planId] !== undefined ? activePlanCardWeek[planId] : 0;
    curIdx = Math.max(0, Math.min(weeks.length - 1, curIdx + delta));
    activePlanCardWeek[planId] = curIdx;
    if (window.vibrate) window.vibrate(15);
    window.renderPlanTabMobile();
  };

  // Plan Kartını Aktif Takvim Haftasına Atlama
  window.jumpPlanCardToActiveWeek = (planId) => {
    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const plan = (state.plans || []).find(p => p.id === planId);
    if (!plan) return;
    const weeks = plan.weeklySchedule || plan.weeks || [];
    if (!weeks.length) return;

    const activeIdx = (typeof window.getMobileActiveWeekIndex === 'function')
      ? window.getMobileActiveWeekIndex(weeks)
      : 0;
    activePlanCardWeek[planId] = Math.max(0, Math.min(weeks.length - 1, activeIdx));
    if (window.vibrate) window.vibrate(20);
    window.renderPlanTabMobile();
  };

  // Plan Kartındaki Onay Kutusu ile Hafta Tamamlama Durumunu Değiştirme
  window.togglePlanWeekStatus = (planId, weekIdx) => {
    if (window.stateManager) {
      window.stateManager.toggleWeekCompleted(planId, weekIdx);
    }
    if (window.vibrate) window.vibrate(20);
    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const plan = (state.plans || []).find(p => p.id === planId);
    const weeks = plan?.weeklySchedule || plan?.weeks || [];
    const isNowDone = Boolean(weeks[weekIdx]?.isCompleted || weeks[weekIdx]?.completed);
    showMobileToast(isNowDone ? '✓ Hafta konusu işlendi olarak kaydedildi' : 'Hafta konusu işlenmedi olarak işaretlendi', isNowDone ? 'success' : 'info');

    window.renderPlanTabMobile();
    if (typeof updateLiveLessonCard === 'function') {
      updateLiveLessonCard();
    }
  };

  // Plan Haftaları ve Aylık Görünümü Açma Modalı
  window.openPlanWeeksViewModal = (planId) => {
    activeViewPlanId = planId;
    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const plan = (state.plans || []).find(p => p.id === planId);
    if (!plan) return;

    const titleEl = document.getElementById('m-plan-weeks-title');
    const subTitleEl = document.getElementById('m-plan-weeks-subtitle');

    if (titleEl) {
      titleEl.textContent = `📑 ${plan.className ? plan.className + ' - ' : ''}${plan.courseName || plan.title}`;
    }
    if (subTitleEl) {
      subTitleEl.textContent = `${plan.educationYear || '2026-2027'} • ${plan.modelName || 'MEB Müfredatı'}`;
    }

    renderPlanWeeksModalContent();
    openBottomSheet('modal-plan-view-weeks');
    if (window.lucide) window.lucide.createIcons();
  };

  // Modal İçi Görünüm Modu Değiştirme (Haftalık vs Aylık)
  window.setPlanViewMode = (mode) => {
    activePlanViewMode = mode || 'weekly';
    const btnWeekly = document.getElementById('m-plan-mode-weekly');
    const btnMonthly = document.getElementById('m-plan-mode-monthly');
    if (btnWeekly) btnWeekly.classList.toggle('active', activePlanViewMode === 'weekly');
    if (btnMonthly) btnMonthly.classList.toggle('active', activePlanViewMode === 'monthly');
    if (window.vibrate) window.vibrate(10);
    renderPlanWeeksModalContent();
  };

  // Modal İçerik Çizimi
  function renderPlanWeeksModalContent() {
    const contentEl = document.getElementById('m-plan-weeks-content');
    if (!contentEl) return;
    const state = (window.stateManager && window.stateManager.loadState()) || {};
    const plan = (state.plans || []).find(p => p.id === activeViewPlanId);
    if (!plan) return;

    const weeks = plan.weeklySchedule || plan.weeks || [];
    const academicActiveIdx = (typeof window.getMobileActiveWeekIndex === 'function')
      ? window.getMobileActiveWeekIndex(weeks)
      : -1;

    if (activePlanViewMode === 'weekly') {
      // 1. HAFTALIK SIRALI GÖRÜNÜM (1-36 Hafta)
      contentEl.innerHTML = weeks.map((w, idx) => {
        const isDone = Boolean(w.isCompleted || w.completed);
        const isAcademic = (idx === academicActiveIdx);
        const wTitle = w.weekLabel || `${idx + 1}. Hafta`;
        const topics = Array.isArray(w.topics) ? w.topics.join(', ') : (w.topics || w.topic || '');
        const outcomes = Array.isArray(w.learningOutcomes) ? w.learningOutcomes.join('<br>• ') : (w.learningOutcomes || '');

        return `
          <div class="m-item-card" style="padding: 0.85rem; border-left: 4px solid ${isDone ? '#10b981' : (isAcademic ? 'var(--m-primary)' : 'var(--m-border)')}; background: var(--m-surface);">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <span style="font-weight: 850; font-size: 0.9rem; color: var(--m-text);">${escapeHTML(wTitle)}</span>
                  ${w.dateRange ? `<span style="font-size: 0.72rem; color: var(--m-text-muted);">(${escapeHTML(w.dateRange)})</span>` : ''}
                  ${isAcademic ? `<span class="m-badge" style="background: rgba(99, 102, 241, 0.12); color: var(--m-primary); font-size: 0.68rem; font-weight: 800; padding: 1px 6px; border-radius: 4px;">Aktif Hafta</span>` : ''}
                  ${w.month ? `<span class="m-badge" style="background: var(--m-surface-subtle); color: var(--m-text-muted); font-size: 0.68rem; font-weight: 700; padding: 1px 6px; border-radius: 4px;">${escapeHTML(w.month)}</span>` : ''}
                </div>
                ${w.unitName ? `<div style="font-size: 0.76rem; font-weight: 750; color: var(--m-primary); margin-top: 3px;">Ünite: ${escapeHTML(w.unitName)}</div>` : ''}
                ${topics ? `<div style="font-size: 0.82rem; color: var(--m-text); margin-top: 3px; line-height: 1.35;"><strong>Konu:</strong> ${escapeHTML(topics)}</div>` : ''}
                ${outcomes ? `<div style="font-size: 0.74rem; color: var(--m-text-muted); margin-top: 4px; line-height: 1.35;"><strong>Kazanım / Çıktı:</strong><br>• ${outcomes}</div>` : ''}
              </div>
              <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; flex-shrink: 0;" title="İşlendi olarak işaretle">
                <input type="checkbox" ${isDone ? 'checked' : ''} style="width: 22px; height: 22px; accent-color: #10b981; cursor: pointer;" onchange="window.togglePlanWeekCompletedMobile('${plan.id}', ${idx})">
              </label>
            </div>
          </div>
        `;
      }).join('');
    } else {
      // 2. AYLIK GÖRÜNÜM (Aylara göre gruplanmış)
      const monthGroups = {};
      weeks.forEach((w, idx) => {
        let m = (w.month || '').trim().toUpperCase();
        if (!m) {
          const dStr = (w.dateRange || '').toLocaleLowerCase('tr');
          for (const mName of MONTH_NAMES_ORDER) {
            if (dStr.includes(mName.toLocaleLowerCase('tr'))) {
              m = mName;
              break;
            }
          }
        }
        if (!m) {
          const mIdx = Math.min(MONTH_NAMES_ORDER.length - 1, Math.floor(idx / 3.6));
          m = MONTH_NAMES_ORDER[mIdx];
        }
        if (!monthGroups[m]) {
          monthGroups[m] = [];
        }
        monthGroups[m].push({ ...w, index: idx });
      });

      const monthKeys = Object.keys(monthGroups);
      monthKeys.sort((a, b) => {
        let ia = MONTH_NAMES_ORDER.indexOf(a);
        let ib = MONTH_NAMES_ORDER.indexOf(b);
        if (ia === -1) ia = 99;
        if (ib === -1) ib = 99;
        return ia - ib;
      });

      contentEl.innerHTML = monthKeys.map(mName => {
        const mWeeks = monthGroups[mName] || [];
        const mDoneCount = mWeeks.filter(w => w.isCompleted || w.completed).length;
        const mTotal = mWeeks.length;
        const mPercent = mTotal > 0 ? Math.round((mDoneCount / mTotal) * 100) : 0;

        return `
          <div class="m-plan-month-card">
            <div class="m-plan-month-header">
              <div class="m-plan-month-title">
                <span>🗓️</span>
                <span>${escapeHTML(mName)}</span>
              </div>
              <span class="m-plan-month-stat">
                ${mDoneCount}/${mTotal} Hafta Tamamlandı (%${mPercent})
              </span>
            </div>
            <div style="padding: 8px 10px; display: flex; flex-direction: column; gap: 8px;">
              ${mWeeks.map(w => {
                const isDone = Boolean(w.isCompleted || w.completed);
                const isAcademic = (w.index === academicActiveIdx);
                const wTitle = w.weekLabel || `${w.index + 1}. Hafta`;
                const topics = Array.isArray(w.topics) ? w.topics.join(', ') : (w.topics || w.topic || '');

                return `
                  <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 8px; background: ${isDone ? 'rgba(16, 185, 129, 0.06)' : 'var(--m-surface-subtle)'}; border: 1px solid ${isDone ? 'rgba(16, 185, 129, 0.25)' : (isAcademic ? 'var(--m-primary)' : 'var(--m-border)')};">
                    <div style="flex: 1; min-width: 0;">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-weight: 800; font-size: 0.82rem; color: var(--m-text);">${escapeHTML(wTitle)}</span>
                        ${w.dateRange ? `<span style="font-size: 0.7rem; color: var(--m-text-muted);">(${escapeHTML(w.dateRange)})</span>` : ''}
                        ${isAcademic ? `<span class="m-badge" style="background: rgba(99, 102, 241, 0.12); color: var(--m-primary); font-size: 0.65rem; font-weight: 800; padding: 1px 5px; border-radius: 4px;">Aktif</span>` : ''}
                      </div>
                      ${topics ? `<div style="font-size: 0.78rem; color: var(--m-text); margin-top: 2px; line-height: 1.3;">${escapeHTML(topics)}</div>` : ''}
                    </div>
                    <label style="display: flex; align-items: center; cursor: pointer; padding: 2px; flex-shrink: 0;">
                      <input type="checkbox" ${isDone ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #10b981; cursor: pointer;" onchange="window.togglePlanWeekCompletedMobile('${plan.id}', ${w.index})">
                    </label>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  window.togglePlanWeekCompletedMobile = (planId, weekIdx) => {
    if (window.stateManager) {
      window.stateManager.toggleWeekCompleted(planId, weekIdx);
    }
    if (window.vibrate) window.vibrate(10);
    renderPlanWeeksModalContent();
    window.renderPlanTabMobile();
    if (typeof updateLiveLessonCard === 'function') {
      updateLiveLessonCard();
    }
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
    // 0. API Anahtarı Kontrolü ve Adım Adım Rehber Modalı (Anahtar yoksa kullanıcıya adım adım anlatır)
    if (typeof window.ensureGeminiApiKey === 'function') {
      const hasKey = await window.ensureGeminiApiKey({
        featureName: 'Yapay Zeka ile Yıllık Plan Oluşturucu',
        description: 'Müfredat kazanımları ve 36 haftalık yıllık ders planını MEB standartlarında hazırlamak için Google Gemini API anahtarı gereklidir.'
      });
      if (!hasKey) return;
    } else if (typeof window.hasGeminiApiKey === 'function' && !window.hasGeminiApiKey()) {
      if (typeof window.showGeminiKeyRequiredModal === 'function') {
        window.showGeminiKeyRequiredModal({
          featureName: 'Yapay Zeka ile Yıllık Plan Oluşturucu',
          confirmText: 'Kaydet ve Planı Oluştur',
          onSuccess: () => { window.generateAiPlanMobile(); }
        });
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
        const apiKey = (typeof window.getGeminiApiKey === 'function') ? window.getGeminiApiKey() : '';
        if (!apiKey) throw new Error('NO_API_KEY');
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
      if ((err.message === 'NO_API_KEY' || String(err.message).includes('API key')) && typeof window.ensureGeminiApiKey === 'function') {
        window.ensureGeminiApiKey({
          featureName: 'Yapay Zeka ile Yıllık Plan Üretimi',
          description: 'Müfredat kazanımları ve 36 haftalık yıllık ders planını hazırlamak için geçerli bir Google Gemini API anahtarı gereklidir.'
        });
      } else if (err.message === 'NO_API_KEY' && typeof window.showGeminiKeyRequiredModal === 'function') {
        window.showGeminiKeyRequiredModal({
          featureName: 'Yapay Zeka ile Yıllık Plan Üretimi',
          confirmText: 'Kaydet ve Planı Oluştur',
          onSuccess: () => {
            window.generateAiPlanMobile();
          }
        });
      } else {
        showMobileToast('Yapay zeka planı üretirken hata oluştu: ' + (err.message || 'Bilinmeyen hata'), 'danger');
      }
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
    if (window.vibrate) window.vibrate(20);
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


})(window);
