/**
 * SINIF ASİSTANI — MOBİL SINAVLAR VE DEĞERLENDİRME MODÜLÜ (MOBILE-EXAMS.JS)
 * Haftalık Değerlendirmeler, Optik Okuma Sonuçları, Sınav Analizi ve Yazılı Sınav Hazırlama.
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
  const openBottomSheet = (id) => (window.openBottomSheet ? window.openBottomSheet(id) : null);
  const closeBottomSheet = () => (window.closeBottomSheet ? window.closeBottomSheet() : null);
  const getStudentByIdSafe = (id) => (window.getStudentByIdSafe ? window.getStudentByIdSafe(id) : null);
  const getAvatarColor = (id) => (window.getAvatarColor ? window.getAvatarColor(id) : '#4f46e5');
  const isMiddleSchool = () => (window.isMiddleSchool ? window.isMiddleSchool() : false);
  const isStudentInCurrentLevel = (s) => (window.isStudentInCurrentLevel ? window.isStudentInCurrentLevel(s) : true);

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

  window.renderMobileWeekly = renderMobileWeekly;

})(window);
