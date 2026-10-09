(() => {
// DOM Elemanları
const btnWeeklyExamSettings = document.getElementById('btn-weekly-exam-settings');
const modalWeeklyExamSettings = document.getElementById('modal-weekly-exam-settings');
const formWeeklyExamSettings = document.getElementById('form-weekly-exam-settings');
const settingsExamFirst = document.getElementById('settings-exam-first');
const settingsExamSecond = document.getElementById('settings-exam-second');
const settingsExamThird = document.getElementById('settings-exam-third');

// Sınav Ekleme Modalı Elemanları
const btnAddWeeklyExam = document.getElementById('btn-add-weekly-exam');
const modalAddExam = document.getElementById('modal-add-exam');
const formAddExam = document.getElementById('form-add-exam');
const examWrongAffectsInput = document.getElementById('exam-wrong-affects-input');
const examPenaltyContainer = document.getElementById('exam-penalty-container');

// Aktif Sınav Detay Kartı Elemanları
const activeExamCard = document.getElementById('active-exam-card');
const activeExamTitle = document.getElementById('active-exam-title');
const activeExamInfoBar = document.getElementById('active-exam-info-bar');
const activeExamTableBody = document.getElementById('active-exam-table-body');
const activeExamNotes = document.getElementById('active-exam-notes');
const btnSaveActiveExam = document.getElementById('btn-save-active-exam');
const btnDeleteActiveExam = document.getElementById('btn-delete-active-exam');
const btnCloseActiveExam = document.getElementById('btn-close-active-exam');

// Yazdırma Butonu
const btnPrintReport = document.getElementById('btn-print-report');
const modalPrintWeeklyExamReport = document.getElementById('modal-print-weekly-exam-report');
const btnClosePrintExamModal = document.getElementById('btn-close-print-exam-modal');
const btnClosePrintExamModalFooter = document.getElementById('btn-close-print-exam-modal-footer');
const btnConfirmPrintExam = document.getElementById('btn-confirm-print-exam');
const printExamSelect = document.getElementById('print-exam-select');

// Optik Form Elemanları
const btnPrintOpticalForms = document.getElementById('btn-print-optical-forms');
const btnPrintStudentExamSlips = document.getElementById('btn-print-student-exam-slips');
const modalPrintOptical = document.getElementById('modal-print-optical');
const formPrintOptical = document.getElementById('form-print-optical');
const btnOpticalSelectAll = document.getElementById('btn-optical-select-all');
const btnOpticalClearAll = document.getElementById('btn-optical-clear-all');
const opticalStudentsList = document.getElementById('optical-students-list');
const opticalSelectedCount = document.getElementById('optical-selected-count');

// Optik Form Yükleme & Yapay Zeka Değerlendirme Elemanları
const btnUploadOpticalForms = document.getElementById('btn-upload-optical-forms');
const modalUploadOpticalEval = document.getElementById('modal-upload-optical-eval');
const btnCloseOpticalUploadModal = document.getElementById('btn-close-optical-upload-modal');
const btnCancelOpticalUpload = document.getElementById('btn-cancel-optical-upload');
const opticalDropzone = document.getElementById('optical-dropzone');
const opticalFileInput = document.getElementById('optical-file-input');
const opticalSelectedFilesContainer = document.getElementById('optical-selected-files-container');
const opticalSelectedFilesGrid = document.getElementById('optical-selected-files-grid');
const opticalSelectedFilesTitle = document.getElementById('optical-selected-files-title');
const btnOpticalClearFiles = document.getElementById('btn-optical-clear-files');
const opticalApiKeyBanner = document.getElementById('optical-api-key-banner');
const btnStartOpticalAiEval = document.getElementById('btn-start-optical-ai-eval');
const opticalEvalSubtitle = document.getElementById('optical-eval-subtitle');
const opticalEvalKeyStatus = document.getElementById('optical-eval-key-status');
const btnToggleOpticalKeyEditor = document.getElementById('btn-toggle-optical-key-editor');
const opticalEvalKeyEditorBox = document.getElementById('optical-eval-key-editor-box');
const opticalEvalKeyGrid = document.getElementById('optical-eval-key-grid');
const btnOpticalFillSampleKey = document.getElementById('btn-optical-fill-sample-key');
const btnOpticalClearKey = document.getElementById('btn-optical-clear-key');

const opticalEvalStepUpload = document.getElementById('optical-eval-step-upload');
const opticalEvalStepProcessing = document.getElementById('optical-eval-step-processing');
const opticalEvalStepResults = document.getElementById('optical-eval-step-results');

const opticalProcessingStepDesc = document.getElementById('optical-processing-step-desc');
const opticalProcessingCounter = document.getElementById('optical-processing-counter');
const opticalProcessingPercentage = document.getElementById('optical-processing-percentage');
const opticalProcessingProgressBar = document.getElementById('optical-processing-progress-bar');
const opticalProcessingLogBox = document.getElementById('optical-processing-log-box');

const opticalResStatTotal = document.getElementById('optical-res-stat-total');
const opticalResStatMatched = document.getElementById('optical-res-stat-matched');
const opticalResStatAvg = document.getElementById('optical-res-stat-avg');
const opticalEvalResultsContainer = document.getElementById('optical-eval-results-container');
const btnToggleAllOpticalAnswers = document.getElementById('btn-toggle-all-optical-answers');
const btnOpticalBackToUpload = document.getElementById('btn-optical-back-to-upload');
const btnCommitOpticalResults = document.getElementById('btn-commit-optical-results');

const modalOpticalImagePreview = document.getElementById('modal-optical-image-preview');
const opticalPreviewImg = document.getElementById('optical-preview-img');
const btnCloseOpticalPreview = document.getElementById('btn-close-optical-preview');

// PDF İlerleme & Bilgilendirme Elemanları
const opticalPdfLoadingOverlay = document.getElementById('optical-pdf-loading-overlay');
const opticalPdfLoadingTitle = document.getElementById('optical-pdf-loading-title');
const opticalPdfLoadingDesc = document.getElementById('optical-pdf-loading-desc');
const opticalPdfProgressBar = document.getElementById('optical-pdf-progress-bar');
const opticalPdfProgressText = document.getElementById('optical-pdf-progress-text');

// Güvenli, Non-Blocking Özel Onay Penceresi (WebKitGTK/Tauri donmalarını önler)
window.showConfirmDialog = function({ title = 'İşlemi Onaylayın', message, confirmText = 'Evet, Onayla', cancelText = 'Vazgeç', type = 'danger' }) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal-app-custom-confirm');
    if (!modal) {
      return resolve(window.confirm(message ? message.replace(/<[^>]+>/g, '') : 'Onaylıyor musunuz?'));
    }
    const titleEl = document.getElementById('app-confirm-title');
    const msgEl = document.getElementById('app-confirm-message');
    const okBtn = document.getElementById('app-confirm-btn-ok');
    const cancelBtn = document.getElementById('app-confirm-btn-cancel');
    const iconBox = document.getElementById('app-confirm-icon-box');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.innerHTML = message;
    if (okBtn) {
      okBtn.textContent = confirmText;
      okBtn.className = `btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`;
    }
    if (cancelBtn) cancelBtn.textContent = cancelText;
    if (iconBox) {
      if (type === 'danger') {
        iconBox.style.background = 'rgba(239, 68, 68, 0.12)';
        iconBox.style.color = '#ef4444';
        iconBox.textContent = '⚠️';
      } else if (type === 'warning') {
        iconBox.style.background = 'rgba(245, 158, 11, 0.12)';
        iconBox.style.color = '#f59e0b';
        iconBox.textContent = '⚠️';
      } else {
        iconBox.style.background = 'rgba(79, 70, 229, 0.12)';
        iconBox.style.color = '#4f46e5';
        iconBox.textContent = 'ℹ️';
      }
    }

    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('active'));

    const cleanUp = () => {
      modal.classList.remove('active');
      setTimeout(() => { modal.style.display = 'none'; }, 150);
      okBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    okBtn.onclick = () => {
      cleanUp();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      cleanUp();
      resolve(false);
    };
  });
};

// Kayıtlı Sınav Cevap Anahtarı Düzenleme Elemanları
const btnEditActiveExamKey = document.getElementById('btn-edit-active-exam-key');
const modalEditExamAnswerKey = document.getElementById('modal-edit-exam-answer-key');
const btnCloseEditAnswerKeyModal = document.getElementById('btn-close-edit-answer-key-modal');
const btnCancelEditAnswerKey = document.getElementById('btn-cancel-edit-answer-key');
const btnSaveEditAnswerKey = document.getElementById('btn-save-edit-answer-key');
const desktopAkSubtitle = document.getElementById('desktop-ak-subtitle');
const desktopAkCounterBadge = document.getElementById('desktop-ak-counter-badge');
const desktopAkQuestionsGrid = document.getElementById('desktop-ak-questions-grid');
const btnDesktopAkFillSample = document.getElementById('btn-desktop-ak-fill-sample');
const btnDesktopAkClearAll = document.getElementById('btn-desktop-ak-clear-all');
const desktopAkRescoreContainer = document.getElementById('desktop-ak-rescore-container');
const desktopAkRescoreCheckbox = document.getElementById('desktop-ak-rescore-checkbox');

// Öğrenci Optik Form Düzenleme Elemanları
const modalStudentOpticalEdit = document.getElementById('modal-student-optical-edit');
const stuOptModalSubtitle = document.getElementById('stu-opt-modal-subtitle');
const stuOptStatsBar = document.getElementById('stu-opt-stats-bar');
const stuOptStatCorrect = document.getElementById('stu-opt-stat-correct');
const stuOptStatWrong = document.getElementById('stu-opt-stat-wrong');
const stuOptStatBlank = document.getElementById('stu-opt-stat-blank');
const stuOptStatNet = document.getElementById('stu-opt-stat-net');
const stuOptStatScore = document.getElementById('stu-opt-stat-score');
const btnStuOptViewPaper = document.getElementById('btn-stu-opt-view-paper');
const btnStuOptClearAll = document.getElementById('btn-stu-opt-clear-all');
const stuOptSubjectTabs = document.getElementById('stu-opt-subject-tabs');
const stuOptQuestionsContainer = document.getElementById('stu-opt-questions-container');
const btnCloseStudentOpticalModal = document.getElementById('btn-close-student-optical-modal');
const btnCancelStudentOptical = document.getElementById('btn-cancel-student-optical');
const btnSaveStudentOptical = document.getElementById('btn-save-student-optical');
const btnDeleteStudentOptical = document.getElementById('btn-delete-student-optical');

let activeOpticalStudentId = null;
let activeOpticalStudentAnswers = {};
let activeOpticalStudentSubjTab = 'ALL';

let opticalSelectedFiles = [];
let opticalScannedResults = [];
let opticalTempExamKey = {};
let allOpticalDetailsVisible = false;
let activeOpticalKeySubjId = '';

let editAnswerKeyTemp = {};
let editAnswerKeyChoices = 4;

let activeExam = null;
let toastCallback = null;
let tempCreateExamKey = {};

// MEB Eğitim Haftası Seçeneklerini Dinamik Doldur
function populateDesktopExamWeekSelect(selectedWeekId) {
  const weekSelect = document.getElementById('exam-week-input');
  if (!weekSelect) return;
  weekSelect.innerHTML = '';

  const activeSettingWeek = selectedWeekId || (stateManager && typeof stateManager.getSelectedWeek === 'function' ? stateManager.getSelectedWeek() : (window.getISOWeek ? window.getISOWeek() : ''));
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
}

// Çoklu Ders ve Tek Ders Durumu
let tempCreateExamType = 'single'; // 'single' | 'multi'
let tempCreateExamSubjects = [
  { id: 'sub_0', name: 'Türkçe', questionCount: 15 },
  { id: 'sub_1', name: 'Matematik', questionCount: 15 },
  { id: 'sub_2', name: 'Fen Bilimleri', questionCount: 10 }
];
let activeCreateExamSubjId = 'sub_0';

// Sınav Türü Seçimi (Tek Ders vs Çoklu Ders)
window.selectExamType = (type) => {
  tempCreateExamType = type;
  const singlePill = document.getElementById('exam-type-pill-single');
  const multiPill = document.getElementById('exam-type-pill-multi');
  const typeInput = document.getElementById('exam-type-input');
  const singleGroup = document.getElementById('exam-single-questions-group');
  const multiContainer = document.getElementById('exam-multi-subject-container');

  if (typeInput) typeInput.value = type;

  if (type === 'multi') {
    if (singlePill) singlePill.classList.remove('active');
    if (multiPill) multiPill.classList.add('active');
    if (singleGroup) singleGroup.style.display = 'none';
    if (multiContainer) multiContainer.style.display = 'block';
    window.renderExamSubjectsUI();
  } else {
    if (singlePill) singlePill.classList.add('active');
    if (multiPill) multiPill.classList.remove('active');
    if (singleGroup) singleGroup.style.display = 'block';
    if (multiContainer) multiContainer.style.display = 'none';
  }

  renderDesktopAnswerKeyGrid();
};

// Hızlı Ders Şablonları
window.applyExamSubjectPreset = (presetKey) => {
  if (presetKey === 'ilkokul_4') {
    tempCreateExamSubjects = [
      { id: 'sub_0', name: 'Türkçe', questionCount: 10 },
      { id: 'sub_1', name: 'Matematik', questionCount: 10 },
      { id: 'sub_2', name: 'Fen Bilimleri', questionCount: 10 },
      { id: 'sub_3', name: 'Sosyal Bilgiler', questionCount: 10 }
    ];
  } else if (presetKey === 'lgs_sozel') {
    tempCreateExamSubjects = [
      { id: 'sub_0', name: 'Türkçe', questionCount: 20 },
      { id: 'sub_1', name: 'T.C. İnkılap Tarihi', questionCount: 10 },
      { id: 'sub_2', name: 'Din Kültürü', questionCount: 10 },
      { id: 'sub_3', name: 'İngilizce', questionCount: 10 }
    ];
  } else if (presetKey === 'lgs_sayisal') {
    tempCreateExamSubjects = [
      { id: 'sub_0', name: 'Matematik', questionCount: 20 },
      { id: 'sub_1', name: 'Fen Bilimleri', questionCount: 20 }
    ];
  } else if (presetKey === 'lgs_tam') {
    tempCreateExamSubjects = [
      { id: 'sub_0', name: 'Türkçe', questionCount: 20 },
      { id: 'sub_1', name: 'Matematik', questionCount: 20 },
      { id: 'sub_2', name: 'Fen Bilimleri', questionCount: 20 },
      { id: 'sub_3', name: 'T.C. İnkılap Tarihi', questionCount: 10 },
      { id: 'sub_4', name: 'Din Kültürü', questionCount: 10 },
      { id: 'sub_5', name: 'İngilizce', questionCount: 10 }
    ];
  }
  activeCreateExamSubjId = tempCreateExamSubjects[0]?.id || 'sub_0';
  tempCreateExamKey = {};
  window.renderExamSubjectsUI();
  renderDesktopAnswerKeyGrid();
};

window.addExamSubject = () => {
  const newId = 'sub_' + Date.now();
  tempCreateExamSubjects.push({
    id: newId,
    name: `Ders ${tempCreateExamSubjects.length + 1}`,
    questionCount: 10
  });
  activeCreateExamSubjId = newId;
  window.renderExamSubjectsUI();
  renderDesktopAnswerKeyGrid();
};

window.removeExamSubject = (id) => {
  if (tempCreateExamSubjects.length <= 1) {
    if (toastCallback) toastCallback('En az bir ders bulunmalıdır!', 'warning');
    return;
  }
  tempCreateExamSubjects = tempCreateExamSubjects.filter(s => s.id !== id);
  Object.keys(tempCreateExamKey).forEach(k => {
    if (k.startsWith(id + '_')) delete tempCreateExamKey[k];
  });
  if (activeCreateExamSubjId === id) {
    activeCreateExamSubjId = tempCreateExamSubjects[0]?.id || '';
  }
  window.renderExamSubjectsUI();
  renderDesktopAnswerKeyGrid();
};

window.updateExamSubject = (id, field, value) => {
  const subj = tempCreateExamSubjects.find(s => s.id === id);
  if (!subj) return;
  if (field === 'name') {
    subj.name = String(value).trim() || 'Ders';
  } else if (field === 'questionCount') {
    subj.questionCount = Math.max(1, Math.min(50, parseInt(value, 10) || 10));
    Object.keys(tempCreateExamKey).forEach(k => {
      if (k.startsWith(id + '_')) {
        const qNum = parseInt(k.split('_')[1], 10);
        if (qNum > subj.questionCount) delete tempCreateExamKey[k];
      }
    });
  }
  window.renderExamSubjectsUI(false);
  renderDesktopAnswerKeyGrid();
};

window.renderExamSubjectsUI = (rebuildInputs = true) => {
  const container = document.getElementById('exam-subjects-list');
  const badge = document.getElementById('exam-multi-total-badge');
  const qInput = document.getElementById('exam-questions-input');

  const total = tempCreateExamSubjects.reduce((sum, s) => sum + (parseInt(s.questionCount, 10) || 0), 0);
  if (badge) badge.textContent = `Toplam: ${total} Soru`;
  if (qInput) qInput.value = total;

  if (!container || !rebuildInputs) return;
  container.innerHTML = '';

  tempCreateExamSubjects.forEach((subj, idx) => {
    const row = document.createElement('div');
    row.className = 'exam-subject-row';
    row.innerHTML = `
      <span style="font-size: 0.78rem; font-weight: 800; color: var(--text-muted); min-width: 18px;">${idx + 1}.</span>
      <input type="text" class="form-control" value="${subj.name}" placeholder="Ders Adı" onchange="window.updateExamSubject('${subj.id}', 'name', this.value)" style="height: 30px; font-size: 0.82rem; padding: 2px 8px;">
      <input type="number" class="form-control" min="1" max="50" value="${subj.questionCount}" placeholder="Soru" onchange="window.updateExamSubject('${subj.id}', 'questionCount', this.value)" style="width: 70px; height: 30px; font-size: 0.82rem; padding: 2px 6px; text-align: center;">
      <span style="font-size: 0.72rem; color: var(--text-muted);">Soru</span>
      <button type="button" class="btn btn-secondary btn-sm" onclick="window.removeExamSubject('${subj.id}')" title="Dersi Sil" style="color: var(--danger); font-size: 0.85rem; padding: 2px 6px; height: 30px;">
        &times;
      </button>
    `;
    container.appendChild(row);
  });
};

window.selectCreateExamSubjTab = (subjId) => {
  activeCreateExamSubjId = subjId;
  renderDesktopAnswerKeyGrid();
};

// Masaüstü Sınav Oluşturma - Şık Sayısı Seçimi
window.selectDesktopExamChoicesCount = (count) => {
  const hiddenInput = document.getElementById('exam-choices-count');
  if (hiddenInput) hiddenInput.value = count;
  [3, 4, 5].forEach(c => {
    const pill = document.getElementById(`desk-pill-opt-${c}`);
    if (pill) {
      if (c === count) pill.classList.add('active');
      else pill.classList.remove('active');
    }
  });
  renderDesktopAnswerKeyGrid();
};

// Masaüstü Sınav Oluşturma - Cevap Anahtarı Gridi Çizimi
function renderDesktopAnswerKeyGrid() {
  const qInput = document.getElementById('exam-questions-input');
  const cInput = document.getElementById('exam-choices-count');
  const grid = document.getElementById('exam-optical-key-grid');
  const counter = document.getElementById('exam-opt-counter');
  const multiTabs = document.getElementById('exam-optical-multi-tabs');
  if (!grid) return;

  const choicesCount = parseInt(cInput ? cInput.value : 4, 10) || 4;
  const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);

  if (tempCreateExamType === 'multi') {
    // Çoklu Ders Durumu
    if (multiTabs) {
      multiTabs.style.display = 'flex';
      multiTabs.innerHTML = tempCreateExamSubjects.map(s => {
        const marked = Object.keys(tempCreateExamKey).filter(k => (k.startsWith(s.id + '_') || k.startsWith(s.name + '_')) && tempCreateExamKey[k]).length;
        const isActive = s.id === activeCreateExamSubjId;
        return `
          <button type="button" class="desktop-ak-subj-tab ${isActive ? 'active' : ''}" onclick="window.selectCreateExamSubjTab('${s.id}')">
            <span>${s.name}</span>
            <span class="badge">${marked}/${s.questionCount}</span>
          </button>
        `;
      }).join('');
    }

    const currentSubj = tempCreateExamSubjects.find(s => s.id === activeCreateExamSubjId) || tempCreateExamSubjects[0];
    if (!currentSubj) return;

    const subjQCount = currentSubj.questionCount || 10;
    let html = '';
    let subjMarked = 0;

    for (let q = 1; q <= subjQCount; q++) {
      const key = `${currentSubj.id}_${q}`;
      const sel = tempCreateExamKey[key] || '';
      if (sel && letters.includes(sel)) subjMarked++;
      else if (sel && !letters.includes(sel)) delete tempCreateExamKey[key];

      html += `
        <div class="desktop-opt-bubble-row" data-key="${key}" data-subj="${currentSubj.id}" data-q="${q}">
          <span class="desktop-opt-bubble-qnum">${q}.</span>
          <div class="desktop-opt-bubbles-wrap">
            ${letters.map(l => `
              <button type="button" class="desktop-opt-bubble-btn ${sel === l ? 'active' : ''}" data-key="${key}" data-opt="${l}" onclick="window.selectDesktopCreateExamKeyChoice('${key}', '${l}')">
                ${l}
              </button>
            `).join('')}
            <button type="button" class="desktop-opt-clear-btn ${sel ? 'visible' : ''}" id="desk-opt-clear-${key}" data-key="${key}" title="Boş Bırak" onclick="window.clearDesktopCreateExamKeyChoice('${key}')">
              &times;
            </button>
          </div>
        </div>
      `;
    }

    grid.innerHTML = html;

    const totalQ = tempCreateExamSubjects.reduce((sum, s) => sum + s.questionCount, 0);
    const totalMarked = Object.keys(tempCreateExamKey).filter(k => tempCreateExamKey[k]).length;
    if (counter) counter.textContent = `Toplam ${totalMarked} / ${totalQ} Soru İşaretlendi (${currentSubj.name}: ${subjMarked}/${subjQCount})`;

  } else {
    // Tek Ders Durumu
    if (multiTabs) multiTabs.style.display = 'none';

    const totalQ = Math.max(1, Math.min(100, parseInt(qInput ? qInput.value : 20, 10) || 20));
    let html = '';
    let markedCount = 0;

    for (let q = 1; q <= totalQ; q++) {
      const key = String(q);
      const sel = tempCreateExamKey[key] || '';
      if (sel && letters.includes(sel)) markedCount++;
      else if (sel && !letters.includes(sel)) delete tempCreateExamKey[key];

      html += `
        <div class="desktop-opt-bubble-row" data-key="${key}" data-q="${q}">
          <span class="desktop-opt-bubble-qnum">${q}.</span>
          <div class="desktop-opt-bubbles-wrap">
            ${letters.map(l => `
              <button type="button" class="desktop-opt-bubble-btn ${sel === l ? 'active' : ''}" data-key="${key}" data-opt="${l}" onclick="window.selectDesktopCreateExamKeyChoice('${key}', '${l}')">
                ${l}
              </button>
            `).join('')}
            <button type="button" class="desktop-opt-clear-btn ${sel ? 'visible' : ''}" id="desk-opt-clear-${key}" data-key="${key}" title="Boş Bırak" onclick="window.clearDesktopCreateExamKeyChoice('${key}')">
              &times;
            </button>
          </div>
        </div>
      `;
    }

    grid.innerHTML = html;
    if (counter) counter.textContent = `${markedCount} / ${totalQ} Soru İşaretlendi`;
  }
}
window.renderDesktopAnswerKeyGrid = renderDesktopAnswerKeyGrid;

window.selectDesktopCreateExamKeyChoice = (keyOrQ, opt) => {
  const key = String(keyOrQ);
  if (!opt || tempCreateExamKey[key] === opt) {
    delete tempCreateExamKey[key];
  } else {
    tempCreateExamKey[key] = opt;
  }

  const currentSel = tempCreateExamKey[key] || '';
  const row = document.querySelector(`#exam-optical-key-grid .desktop-opt-bubble-row[data-key="${key}"]`);
  if (row) {
    row.querySelectorAll('.desktop-opt-bubble-btn').forEach(btn => {
      const bOpt = btn.getAttribute('data-opt') || btn.textContent.trim();
      if (bOpt === currentSel) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    const clr = row.querySelector('.desktop-opt-clear-btn') || document.getElementById(`desk-opt-clear-${key}`);
    if (clr) {
      if (currentSel) clr.classList.add('visible');
      else clr.classList.remove('visible');
    }
  }

  if (tempCreateExamType === 'multi') {
    const multiTabs = document.getElementById('exam-optical-multi-tabs');
    if (multiTabs) {
      tempCreateExamSubjects.forEach(s => {
        const marked = Object.keys(tempCreateExamKey).filter(k => (k.startsWith(s.id + '_') || k.startsWith(s.name + '_')) && tempCreateExamKey[k]).length;
        const tabBadge = multiTabs.querySelector(`button[onclick*="'${s.id}'"] .badge`);
        if (tabBadge) tabBadge.textContent = `${marked}/${s.questionCount}`;
      });
    }
    const currentSubj = tempCreateExamSubjects.find(s => s.id === activeCreateExamSubjId) || tempCreateExamSubjects[0] || { name: 'Ders', questionCount: 10 };
    const totalQ = tempCreateExamSubjects.reduce((sum, s) => sum + s.questionCount, 0);
    const totalMarked = Object.keys(tempCreateExamKey).filter(k => tempCreateExamKey[k]).length;
    const subjMarked = Object.keys(tempCreateExamKey).filter(k => (k.startsWith(currentSubj.id + '_') || k.startsWith(currentSubj.name + '_')) && tempCreateExamKey[k]).length;
    const counter = document.getElementById('exam-opt-counter');
    if (counter) counter.textContent = `Toplam ${totalMarked} / ${totalQ} Soru İşaretlendi (${currentSubj.name}: ${subjMarked}/${currentSubj.questionCount})`;
  } else {
    const qInput = document.getElementById('exam-questions-input');
    const totalQ = Math.max(1, Math.min(100, parseInt(qInput ? qInput.value : 20, 10) || 20));
    const counter = document.getElementById('exam-opt-counter');
    const marked = Object.keys(tempCreateExamKey).filter(k => parseInt(k, 10) <= totalQ && tempCreateExamKey[k]).length;
    if (counter) counter.textContent = `${marked} / ${totalQ} Soru İşaretlendi`;
  }
};

window.clearDesktopCreateExamKeyChoice = (keyOrQ) => {
  const key = String(keyOrQ);
  delete tempCreateExamKey[key];
  window.selectDesktopCreateExamKeyChoice(key, '');
};

window.fillSampleDesktopExamKey = () => {
  const cInput = document.getElementById('exam-choices-count');
  const choicesCount = parseInt(cInput ? cInput.value : 4, 10) || 4;
  const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);

  tempCreateExamKey = {};
  if (tempCreateExamType === 'multi') {
    tempCreateExamSubjects.forEach(s => {
      for (let q = 1; q <= s.questionCount; q++) {
        tempCreateExamKey[`${s.id}_${q}`] = letters[(q - 1) % letters.length];
      }
    });
  } else {
    const qInput = document.getElementById('exam-questions-input');
    const totalQ = Math.max(1, Math.min(100, parseInt(qInput ? qInput.value : 20, 10) || 20));
    for (let q = 1; q <= totalQ; q++) {
      tempCreateExamKey[String(q)] = letters[(q - 1) % letters.length];
    }
  }
  renderDesktopAnswerKeyGrid();
};

window.clearDesktopExamKey = () => {
  tempCreateExamKey = {};
  renderDesktopAnswerKeyGrid();
};

// ==========================================================================
// OMR VE ÇOKLU BRANŞ EŞLEME & PUANLAMA GENEL YARDIMCI MOTORU
// ==========================================================================

function normalizeOmrSubject(str) {
  if (!str) return '';
  let s = String(str).toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]/g, '');
  // Tekrarlanan sesli harf yazım hatalarını normalize et (örn: sosyaal -> sosyal)
  s = s.replace(/([aeıioöuü])\1+/g, '$1');
  return s;
}

function getOmrSubjectBaseKeywords(str) {
  const norm = normalizeOmrSubject(str);
  const keywords = [];
  if (norm.includes('sosyal')) keywords.push('sosyal');
  if (norm.includes('turk') || norm.includes('türk')) keywords.push('turk', 'türk');
  if (norm.includes('mat')) keywords.push('mat');
  if (norm.includes('fen')) keywords.push('fen');
  if (norm.includes('inkilap') || norm.includes('tarih')) keywords.push('inkilap', 'tarih');
  if (norm.includes('din')) keywords.push('din');
  if (norm.includes('ingiliz') || norm.includes('dil')) keywords.push('ingiliz', 'dil');
  return { norm, keywords };
}

function extractAnswerForSubj(cardAnswers, card, subj, subjIndex, q, cumulativeOffset) {
  if (!cardAnswers && !card) return '';
  const answersObj = cardAnswers || (card && card.answers) || {};

  // 1. Doğrudan id_q eşleşmesi (örn: sub_0_1, sub_3_1)
  const key1 = `${subj.id}_${q}`;
  if (answersObj[key1] !== undefined && answersObj[key1] !== '') {
    return String(answersObj[key1]);
  }

  // 2. Doğrudan name_q eşleşmesi (örn: Türkçe_1, Sosyal Bilgiler_1, Sosyaal Bilgiler_1)
  const key2 = `${subj.name}_${q}`;
  if (answersObj[key2] !== undefined && answersObj[key2] !== '') {
    return String(answersObj[key2]);
  }

  // 3. İç içe nesne eşleşmesi (card.answers[subj.id] veya card.subjectAnswers)
  const nested = (card && card.subjectAnswers) || (card && typeof card.answers === 'object' ? card.answers : null);
  if (nested && typeof nested === 'object') {
    for (const candidateKey of [subj.id, subj.name]) {
      if (nested[candidateKey] && typeof nested[candidateKey] === 'object') {
        if (nested[candidateKey][q] !== undefined) return String(nested[candidateKey][q]);
        if (nested[candidateKey][String(q)] !== undefined) return String(nested[candidateKey][String(q)]);
      }
    }
    // İç içe nesne anahtarlarında fuzzy arama
    const { norm: subjNorm, keywords } = getOmrSubjectBaseKeywords(subj.name);
    for (const nestedKey of Object.keys(nested)) {
      const nNorm = normalizeOmrSubject(nestedKey);
      if (nNorm === subjNorm || nNorm.includes(subjNorm) || subjNorm.includes(nNorm) || keywords.some(kw => nNorm.includes(kw))) {
        const subObj = nested[nestedKey];
        if (subObj && typeof subObj === 'object') {
          if (subObj[q] !== undefined) return String(subObj[q]);
          if (subObj[String(q)] !== undefined) return String(subObj[String(q)]);
        }
      }
    }
  }

  // 4. Anahtarlar üzerinde sütun sırası veya fuzzy ders adı eşleme
  const { norm: subjNorm, keywords } = getOmrSubjectBaseKeywords(subj.name);
  const colNum = subjIndex + 1;
  const colPrefixes = [`ders_${colNum}`, `ders${colNum}`, `sutun_${colNum}`, `sutun${colNum}`, `col_${colNum}`, `column_${colNum}`];

  for (const k of Object.keys(answersObj)) {
    const match = k.match(/(?:_|-|\s|:|^)(\d+)$/);
    if (!match || parseInt(match[1], 10) !== q) continue;

    const prefix = k.slice(0, match.index);
    const prefixNorm = normalizeOmrSubject(prefix);

    if (colPrefixes.some(cp => prefixNorm === cp || prefixNorm.startsWith(cp))) {
      return String(answersObj[k]);
    }
    if (prefixNorm === subjNorm || prefixNorm.includes(subjNorm) || subjNorm.includes(prefixNorm)) {
      return String(answersObj[k]);
    }
    if (keywords.some(kw => prefixNorm.includes(kw))) {
      return String(answersObj[k]);
    }
  }

  // 5. Sıralı / Düzleştirilmiş Soru Numarası Fallback (örn: 1..24)
  const globalQ = cumulativeOffset + q;
  if (answersObj[globalQ] !== undefined && answersObj[globalQ] !== '') {
    return String(answersObj[globalQ]);
  }
  if (answersObj[String(globalQ)] !== undefined && answersObj[String(globalQ)] !== '') {
    return String(answersObj[String(globalQ)]);
  }

  return '';
}

function findCorrectAnswerForKey(answerKey, subj, subjIndex, q, cumulativeOffset) {
  if (!answerKey || typeof answerKey !== 'object') return '';
  const key1 = `${subj.id}_${q}`;
  if (answerKey[key1]) return String(answerKey[key1]).trim().toUpperCase();

  const key2 = `${subj.name}_${q}`;
  if (answerKey[key2]) return String(answerKey[key2]).trim().toUpperCase();

  const globalQ = cumulativeOffset + q;
  if (answerKey[globalQ]) return String(answerKey[globalQ]).trim().toUpperCase();
  if (answerKey[String(globalQ)]) return String(answerKey[String(globalQ)]).trim().toUpperCase();

  const found = extractAnswerForSubj(answerKey, null, subj, subjIndex, q, cumulativeOffset);
  return found ? String(found).trim().toUpperCase() : '';
}

window.normalizeOmrSubject = normalizeOmrSubject;
window.getOmrSubjectBaseKeywords = getOmrSubjectBaseKeywords;
window.extractAnswerForSubj = extractAnswerForSubj;
window.findCorrectAnswerForKey = findCorrectAnswerForKey;

function setupWeeklyTab(showToast) {
  toastCallback = showToast;

  // Sınav Ekleme Modalı Açılış
  if (btnAddWeeklyExam) {
    btnAddWeeklyExam.addEventListener('click', () => {
      if (formAddExam) formAddExam.reset();
      if (examPenaltyContainer) examPenaltyContainer.style.display = 'none';
      
      // Eğitim haftası seçeneklerini MEB takvimine göre dinamik doldur
      populateDesktopExamWeekSelect();

      // Şube seçeneklerini doldur
      const state = stateManager.loadState();
      const examBranchInput = document.getElementById('exam-branch-input');
      const examBranchGroup = document.getElementById('exam-branch-group');
      const isMiddle = state.educationLevel === 'middle';
      if (examBranchGroup) {
        examBranchGroup.style.display = isMiddle ? 'block' : 'none';
      }
      if (examBranchInput) {
        examBranchInput.innerHTML = '';
        const branches = [...new Set(state.students.map(s => s.branch).filter(Boolean))];
        branches.sort();
        if (branches.length === 0) {
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'Tüm Sınıf';
          examBranchInput.appendChild(opt);
        } else {
          branches.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = `${b} Şubesi`;
            examBranchInput.appendChild(opt);
          });
        }
      }

      // Sınav türü, optik form ve ders hazırlığı
      window.selectExamType('single');
      tempCreateExamSubjects = [
        { id: 'sub_0', name: 'Türkçe', questionCount: 15 },
        { id: 'sub_1', name: 'Matematik', questionCount: 15 },
        { id: 'sub_2', name: 'Fen Bilimleri', questionCount: 10 }
      ];
      activeCreateExamSubjId = 'sub_0';
      tempCreateExamKey = {};
      const opticalToggle = document.getElementById('exam-has-optical-input');
      const opticalCont = document.getElementById('exam-optical-config-container');
      if (opticalToggle) opticalToggle.checked = true;
      if (opticalCont) opticalCont.style.display = 'block';
      window.selectDesktopExamChoicesCount(4);
      renderDesktopAnswerKeyGrid();

      if (modalAddExam) modalAddExam.classList.add('active');
    });
  }

  // Yanlışlar doğruları etkilesin mi checkbox kontrolü
  if (examWrongAffectsInput && examPenaltyContainer) {
    examWrongAffectsInput.addEventListener('change', () => {
      examPenaltyContainer.style.display = examWrongAffectsInput.checked ? 'block' : 'none';
    });
  }

  // Optik form onay kutusu ve soru sayısı değişiklik dinleyicileri
  const examHasOpticalInput = document.getElementById('exam-has-optical-input');
  const examQuestionsInput = document.getElementById('exam-questions-input');
  if (examHasOpticalInput) {
    examHasOpticalInput.addEventListener('change', () => {
      const opticalCont = document.getElementById('exam-optical-config-container');
      if (opticalCont) {
        opticalCont.style.display = examHasOpticalInput.checked ? 'block' : 'none';
      }
      if (examHasOpticalInput.checked) {
        renderDesktopAnswerKeyGrid();
      }
    });
  }

  if (examQuestionsInput) {
    examQuestionsInput.addEventListener('input', () => {
      renderDesktopAnswerKeyGrid();
    });
  }

  const btnExamFillSampleKey = document.getElementById('btn-exam-fill-sample-key');
  if (btnExamFillSampleKey) {
    btnExamFillSampleKey.addEventListener('click', () => {
      window.fillSampleDesktopExamKey();
    });
  }

  const btnExamClearKey = document.getElementById('btn-exam-clear-key');
  if (btnExamClearKey) {
    btnExamClearKey.addEventListener('click', () => {
      window.clearDesktopExamKey();
    });
  }

  // Sınav Ekleme Modalı Kapatma
  document.querySelectorAll('#modal-add-exam .close-btn, #modal-add-exam .close-btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
      if (modalAddExam) modalAddExam.classList.remove('active');
    });
  });

  // Sınav Ekleme Formu Kaydetme
  if (formAddExam) {
    formAddExam.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('exam-name-input').value.trim();
      const week = document.getElementById('exam-week-input').value;
      const duration = parseInt(document.getElementById('exam-duration-input').value) || 40;
      const questions = parseInt(document.getElementById('exam-questions-input').value) || 20;
      const wrongAffects = examWrongAffectsInput.checked;
      const penaltyRate = wrongAffects ? parseInt(document.getElementById('exam-penalty-input').value) : 0;

      const state = stateManager.loadState();
      const examBranchInput = document.getElementById('exam-branch-input');
      const examBranch = examBranchInput && state.educationLevel === 'middle' ? examBranchInput.value : '';

      // Optik form onay kutusu ve cevap anahtarı
      const opticalToggle = document.getElementById('exam-has-optical-input');
      const hasOptical = opticalToggle ? opticalToggle.checked : true;
      const choicesCount = parseInt(document.getElementById('exam-choices-count')?.value, 10) || 4;
      const answerKey = hasOptical ? { ...tempCreateExamKey } : {};

      // Sınav türü ve dersler
      const isMulti = tempCreateExamType === 'multi';
      let totalQ = questions;
      let subjects = [];
      if (isMulti) {
        subjects = tempCreateExamSubjects.map(s => ({
          id: s.id,
          name: String(s.name || '').trim() || 'Ders',
          questionCount: Math.max(1, parseInt(s.questionCount, 10) || 10)
        }));
        totalQ = subjects.reduce((sum, s) => sum + s.questionCount, 0);
      }

      const examData = {
        id: 'exam_' + Date.now(),
        weekId: week,
        examName: name,
        isMultiSubject: isMulti,
        subjects: isMulti ? subjects : [],
        totalQuestions: totalQ,
        duration: duration,
        wrongAffects: wrongAffects,
        penaltyRate: penaltyRate,
        branch: examBranch,
        hasOpticalForm: hasOptical,
        choicesCount: choicesCount,
        answerKey: answerKey,
        examScores: {},
        studentResults: {},
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      stateManager.saveExam(examData);

      if (toastCallback) {
        toastCallback(`"${name}" sınavı başarıyla oluşturuldu.`, 'success');
      }

      if (modalAddExam) modalAddExam.classList.remove('active');
      
      renderExamsList();
      openActiveExam(examData); // Sınav oluşturulunca otomatik aç

      const event = new CustomEvent('stateChanged');
      document.dispatchEvent(event);
    });
  }

  // Ayarlar Modalı Açılış
  if (btnWeeklyExamSettings) {
    btnWeeklyExamSettings.addEventListener('click', () => {
      if (window.openGlobalSettingsModal) {
        window.openGlobalSettingsModal('settings-exams');
      }
    });
  }

  // Aktif Sınav Kapatma Butonu
  if (btnCloseActiveExam) {
    btnCloseActiveExam.addEventListener('click', () => {
      activeExam = null;
      if (activeExamCard) activeExamCard.style.display = 'none';
      if (btnPrintReport) btnPrintReport.style.display = 'none';
      renderExamsList();
    });
  }

  // Aktif Sınav Kaydetme Butonu
  if (btnSaveActiveExam) {
    btnSaveActiveExam.addEventListener('click', () => {
      if (!activeExam) return;

      const notes = activeExamNotes ? activeExamNotes.value.trim() : '';
      const rows = activeExamTableBody ? activeExamTableBody.querySelectorAll('tr') : [];

      const examScores = {};
      const studentResults = {};

      rows.forEach(row => {
        const correctInput = row.querySelector('.exam-correct-input');
        const blankInput = row.querySelector('.exam-blank-input');
        const wrongInput = row.querySelector('.exam-wrong-input');
        const netSpan = row.querySelector('.exam-net-span');
        const scoreSpan = row.querySelector('.exam-score-span');

        if (!correctInput || !blankInput) return;

        const studentId = correctInput.getAttribute('data-student-id');
        const correctVal = correctInput.value.trim();
        const blankVal = blankInput.value.trim();
        const existingRes = (activeExam.studentResults && activeExam.studentResults[studentId]) || {};
        const hasAnswers = existingRes.answers && Object.keys(existingRes.answers).length > 0;

        if (hasAnswers) {
          // Optikli öğrenci: Değerleri optikten hesaplandığı şekliyle aynen korunur
          if (existingRes.score !== undefined && existingRes.score !== '') {
            examScores[studentId] = existingRes.score;
            studentResults[studentId] = { ...existingRes };
          }
        } else if (correctVal !== '' && blankVal !== '') {
          // Optiksiz öğrenci: Elle girilen değerler kaydedilir
          const correct = parseInt(correctVal) || 0;
          const blank = parseInt(blankVal) || 0;
          const wrong = parseInt(wrongInput.value) || 0;
          const net = parseFloat(netSpan.textContent) || 0;
          const score = parseFloat(scoreSpan.textContent) || 0;

          examScores[studentId] = score;
          studentResults[studentId] = {
            ...existingRes,
            correct,
            blank,
            wrong,
            net,
            score
          };
        } else {
          // Kutucukları silinmiş/boşaltılmış öğrenci:
          // examScores ve studentResults nesnelerine eklenmez, böylece eski değerler geri gelmez ve silinir.
        }
      });

      activeExam.examScores = examScores;
      activeExam.studentResults = studentResults;
      activeExam.notes = notes;
      activeExam.updatedAt = new Date().toISOString();

      stateManager.saveExam(activeExam);

      if (toastCallback) {
        toastCallback('Sınav sonuçları başarıyla kaydedildi.', 'success');
      }

      renderExamsList();
      openActiveExam(activeExam); // Değişiklikleri yükle

      const event = new CustomEvent('stateChanged');
      document.dispatchEvent(event);
    });
  }

  // Sınav Silme Butonu
  if (btnDeleteActiveExam) {
    btnDeleteActiveExam.addEventListener('click', async () => {
      if (!activeExam) return;

      const confirmed = await window.showConfirmDialog({
        title: 'Sınavı Sil',
        message: `<strong>"${activeExam.examName}"</strong> sınavını ve bu sınava ait tüm öğrenci değerlendirme sonuçlarını tamamen silmek istediğinize emin misiniz?<br><span style="color:#ef4444; font-weight:700;">Bu işlem geri alınamaz!</span>`,
        confirmText: 'Sınavı Sil',
        cancelText: 'Vazgeç',
        type: 'danger'
      });
      if (!confirmed) return;

      stateManager.deleteExam(activeExam.id);
      
      if (toastCallback) {
        toastCallback('Sınav başarıyla silindi.', 'success');
      }

      activeExam = null;
      if (activeExamCard) activeExamCard.style.display = 'none';
      if (btnPrintReport) btnPrintReport.style.display = 'none';

      renderExamsList();

      const event = new CustomEvent('stateChanged');
      document.dispatchEvent(event);
    });
  }

  // Yazdır / PDF Al Butonu (Seçim Modalı Açma)
  if (btnPrintReport) {
    btnPrintReport.addEventListener('click', () => {
      openPrintWeeklyExamReportModal();
    });
  }

  // Rapor Seçim Modalı Kapatma
  const closePrintExamModalFn = () => {
    if (modalPrintWeeklyExamReport) modalPrintWeeklyExamReport.classList.remove('active');
  };

  if (btnClosePrintExamModal) btnClosePrintExamModal.addEventListener('click', closePrintExamModalFn);
  if (btnClosePrintExamModalFooter) btnClosePrintExamModalFooter.addEventListener('click', closePrintExamModalFn);
  if (modalPrintWeeklyExamReport) {
    modalPrintWeeklyExamReport.addEventListener('click', (e) => {
      if (e.target === modalPrintWeeklyExamReport) {
        closePrintExamModalFn();
      }
    });
  }

  function openPrintWeeklyExamReportModal() {
    if (!printExamSelect) return;
    printExamSelect.innerHTML = '';

    const state = stateManager.loadState();
    const selectedWeek = stateManager.getSelectedWeek();
    const weekExams = (state.weeklyEvaluations || []).filter(e => e.weekId === selectedWeek);

    if (weekExams.length === 0) {
      if (toastCallback) toastCallback('Seçili haftada tanımlı sınav bulunmuyor!', 'warning');
      return;
    }

    // 1. Sınavları Listele
    weekExams.forEach(ex => {
      const opt = document.createElement('option');
      opt.value = ex.id;
      opt.textContent = `${ex.examName} (${ex.totalQuestions} Soru)`;
      if (activeExam && activeExam.id === ex.id) {
        opt.selected = true;
      }
      printExamSelect.appendChild(opt);
    });

    // 2. Haftalık Ortalama seçeneği
    const optWeekAvg = document.createElement('option');
    optWeekAvg.value = 'week_avg';
    optWeekAvg.textContent = 'Tüm Sınavların Ortalaması (Seçili Hafta)';
    printExamSelect.appendChild(optWeekAvg);

    // 3. Genel Ortalama seçeneği
    const optAllAvg = document.createElement('option');
    optAllAvg.value = 'all_avg';
    optAllAvg.textContent = 'Tüm Sınavların Ortalaması (Tüm Sınavlar)';
    printExamSelect.appendChild(optAllAvg);

    if (modalPrintWeeklyExamReport) {
      modalPrintWeeklyExamReport.classList.add('active');
    }
  }

  if (btnConfirmPrintExam) {
    btnConfirmPrintExam.addEventListener('click', () => {
      const selectedValue = printExamSelect.value;
      if (!selectedValue) return;

      const state = stateManager.loadState();
      const selectedWeek = stateManager.getSelectedWeek();

      let examsToPrint = [];
      let isAverageReport = false;
      let reportTitle = '';
      let reportSubtitle = '';
      let examDetailText = '';
      let notes = '';

      if (selectedValue === 'week_avg') {
        isAverageReport = true;
        examsToPrint = (state.weeklyEvaluations || []).filter(e => e.weekId === selectedWeek);
        const formattedWeek = window.formatWeekTR ? window.formatWeekTR(selectedWeek, 'full') : selectedWeek;
        reportTitle = 'SINAV ORTALAMA RAPORU (SEÇİLİ HAFTA)';
        reportSubtitle = `Uygulama Dönemi: ${formattedWeek} | Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
        examDetailText = `Toplam ${examsToPrint.length} Sınavın Ortalaması`;
        notes = "Bu haftaki tüm sınavların başarı ortalamalarını içerir.";
      } else if (selectedValue === 'all_avg') {
        isAverageReport = true;
        examsToPrint = state.weeklyEvaluations || [];
        reportTitle = 'SINAV ORTALAMA RAPORU (TÜM ZAMANLAR)';
        reportSubtitle = `Tüm Dönem Sınavları | Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
        examDetailText = `Toplam ${examsToPrint.length} Sınavın Ortalaması`;
        notes = "Dönem başından bu yana yapılan tüm sınavların başarı ortalamalarını içerir.";
      } else {
        const targetExam = (state.weeklyEvaluations || []).find(e => e.id === selectedValue);
        if (!targetExam) return;
        examsToPrint = [targetExam];
        isAverageReport = false;
        
        const formattedWeek = window.formatWeekTR ? window.formatWeekTR(targetExam.weekId, 'full') : targetExam.weekId;
        reportTitle = 'SINAV SONUÇ RAPORU';
        reportSubtitle = `Uygulama Dönemi: ${formattedWeek} | Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
        const penaltyText = targetExam.wrongAffects ? `${targetExam.penaltyRate} Yanlış 1 Doğruyu Götürür` : 'Yanlışlar Doğruları Etkilemez';
        examDetailText = `Sınav: ${targetExam.examName} (${targetExam.totalQuestions} Soru | ${targetExam.duration} Dk | ${penaltyText})`;
        notes = targetExam.notes || "Bu sınav için öğretmen tarafından eklenmiş bir değerlendirme notu bulunmuyor.";
      }

      if (examsToPrint.length === 0) {
        if (toastCallback) toastCallback('Raporlanacak sınav verisi bulunamadı!', 'warning');
        return;
      }

      prepareAdvancedPrintLayout(reportTitle, reportSubtitle, examDetailText, notes, examsToPrint, isAverageReport, selectedValue);

      document.body.classList.add('print-weekly');
      window.print();

      window.addEventListener('afterprint', () => {
        document.body.classList.remove('print-weekly');
      }, { once: true });

      setTimeout(() => {
        document.body.classList.remove('print-weekly');
      }, 500);

      closePrintExamModalFn();
    });
  }

  // ==========================================================================
  // TOPLU OPTİK FORM BASMA (QR KODSUZ, CAMSCANNER & AI UYUMLU)
  // ==========================================================================
  window.openDesktopOpticalPrintModal = function(examId) {
    try {
      const state = stateManager.loadState();
      if (examId) {
        const found = (state.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
        if (found) activeExam = found;
      }
      if (!activeExam) {
        if (window.activeWeeklyExam) {
          activeExam = window.activeWeeklyExam;
        } else if (Array.isArray(state.weeklyEvaluations) && state.weeklyEvaluations.length > 0) {
          activeExam = state.weeklyEvaluations[0];
        }
      }
      if (!activeExam) {
        if (toastCallback) toastCallback('Lütfen önce bir sınav seçin!', 'warning');
        else if (window.showToast) window.showToast('Lütfen önce bir sınav seçin!', 'warning');
        return;
      }
      window.activeWeeklyExam = activeExam;
      
      const isMulti = !!activeExam.isMultiSubject;
      const qCount = activeExam.totalQuestions || 20;

      const questionCountInput = document.getElementById('optical-questions-input');
      if (questionCountInput) {
        questionCountInput.value = qCount;
        questionCountInput.disabled = true; // Sınavın soru sayısı değiştirilemez
      }

      const choicesInput = document.getElementById('optical-choices-input');
      if (choicesInput) {
        choicesInput.value = activeExam.choicesCount || 4;
      }

      const perPageInput = document.getElementById('optical-per-page-input');
      const tipEl = document.getElementById('optical-multi-page-tip');
      if (isMulti || qCount > 35) {
        if (perPageInput) perPageInput.value = '1';
        if (tipEl) {
          tipEl.style.display = 'block';
          tipEl.innerHTML = `ℹ️ Çoklu ders optik formunun A4 sayfaya tam sığması ve net okunabilmesi için <strong>Sayfa Başına 1 Form (A4)</strong> seçildi.`;
        }
      } else {
        if (perPageInput) perPageInput.value = '2';
        if (tipEl) tipEl.style.display = 'none';
      }
      
      try {
        populateOpticalStudentsList();
      } catch (err) {
        console.warn('populateOpticalStudentsList hatası:', err);
      }
      try {
        updateOpticalLivePreview();
      } catch (err) {
        console.warn('updateOpticalLivePreview hatası:', err);
      }
      
      const modalEl = modalPrintOptical || document.getElementById('modal-print-optical');
      if (modalEl) modalEl.classList.add('active');
    } catch (err) {
      console.error('openDesktopOpticalPrintModal hatası:', err);
      if (toastCallback) toastCallback('Optik form penceresi açılırken hata oluştu: ' + (err.message || err), 'danger');
    }
  };

  if (btnPrintOpticalForms) {
    btnPrintOpticalForms.addEventListener('click', () => {
      window.openDesktopOpticalPrintModal();
    });
  }

  // ==========================================================================
  // ÖĞRENCİ SINAV RAPORU / KES-DAĞIT FİŞLERİ BASMA
  // ==========================================================================
  if (btnPrintStudentExamSlips) {
    btnPrintStudentExamSlips.addEventListener('click', () => {
      printStudentExamSlips();
    });
  }

  // ==========================================================================
  // TAHTADA SORU ÇÖZÜMÜ & HATA ANALİZİ MODÜLÜ ELEMAN DİNLEYİCİLERİ
  // ==========================================================================
  const btnBoardQuestionAnalysis = document.getElementById('btn-board-question-analysis');
  if (btnBoardQuestionAnalysis) {
    btnBoardQuestionAnalysis.addEventListener('click', () => {
      openBoardQuestionAnalysisModal();
    });
  }

  const btnCloseBoardQaModal = document.getElementById('btn-close-board-qa-modal');
  if (btnCloseBoardQaModal) {
    btnCloseBoardQaModal.addEventListener('click', closeBoardQuestionAnalysisModal);
  }

  const btnBoardQaCloseFooter = document.getElementById('btn-board-qa-close-footer');
  if (btnBoardQaCloseFooter) {
    btnBoardQaCloseFooter.addEventListener('click', closeBoardQuestionAnalysisModal);
  }

  const btnBoardQaFullscreen = document.getElementById('btn-board-qa-fullscreen');
  if (btnBoardQaFullscreen) {
    btnBoardQaFullscreen.addEventListener('click', () => {
      const modal = document.getElementById('modal-board-question-analysis');
      if (!modal) return;
      boardQaIsFullscreen = !boardQaIsFullscreen;
      modal.classList.toggle('board-fullscreen', boardQaIsFullscreen);
      const fsText = document.getElementById('btn-board-qa-fullscreen-text');
      if (fsText) fsText.textContent = boardQaIsFullscreen ? 'Küçült' : 'Tam Ekran';
    });
  }

  const btnBoardQaPip = document.getElementById('btn-board-qa-pip');
  if (btnBoardQaPip) {
    btnBoardQaPip.addEventListener('click', () => {
      openBoardQuestionAnalysisPip();
    });
  }

  const btnBoardQaDirectPip = document.getElementById('btn-board-qa-direct-pip');
  if (btnBoardQaDirectPip) {
    btnBoardQaDirectPip.addEventListener('click', () => {
      openBoardQuestionAnalysisPip();
    });
  }

  const btnBoardQaPrevQ = document.getElementById('btn-board-qa-prev-q');
  if (btnBoardQaPrevQ) {
    btnBoardQaPrevQ.addEventListener('click', () => boardQaStepQuestion(-1));
  }

  const btnBoardQaNextQ = document.getElementById('btn-board-qa-next-q');
  if (btnBoardQaNextQ) {
    btnBoardQaNextQ.addEventListener('click', () => boardQaStepQuestion(1));
  }

  const boardQaQuestionSelect = document.getElementById('board-qa-question-select');
  if (boardQaQuestionSelect) {
    boardQaQuestionSelect.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10) || 1;
      boardQaActiveQNum = val;
      renderBoardQuestionAnalysis();
    });
  }

  const boardQaSearchInput = document.getElementById('board-qa-search-input');
  if (boardQaSearchInput) {
    boardQaSearchInput.addEventListener('input', (e) => {
      boardQaSearchTerm = e.target.value || '';
      renderBoardQuestionAnalysis();
    });
  }

  const boardQaFilterTabs = document.getElementById('board-qa-filter-tabs');
  if (boardQaFilterTabs) {
    boardQaFilterTabs.querySelectorAll('.board-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        boardQaFilterTabs.querySelectorAll('.board-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        boardQaActiveFilter = btn.getAttribute('data-filter') || 'all_errors';
        renderBoardQuestionAnalysis();
      });
    });
  }

  const btnBoardQaCopyList = document.getElementById('btn-board-qa-copy-list');
  if (btnBoardQaCopyList) {
    btnBoardQaCopyList.addEventListener('click', () => {
      copyBoardQaStudentList();
    });
  }

  const opticalQInput = document.getElementById('optical-questions-input');
  const opticalCInput = document.getElementById('optical-choices-input');
  const opticalTypeInput = document.getElementById('optical-type-input');
  const opticalPerPageInput = document.getElementById('optical-per-page-input');

  if (opticalQInput) opticalQInput.addEventListener('input', updateOpticalLivePreview);
  if (opticalCInput) opticalCInput.addEventListener('change', updateOpticalLivePreview);
  if (opticalTypeInput) opticalTypeInput.addEventListener('change', updateOpticalLivePreview);
  if (opticalPerPageInput) {
    opticalPerPageInput.addEventListener('change', () => {
      const tipEl = document.getElementById('optical-multi-page-tip');
      const isMulti = activeExam && !!activeExam.isMultiSubject;
      const qCount = activeExam ? (activeExam.totalQuestions || 20) : 20;
      if (tipEl) {
        if ((isMulti || qCount > 35) && opticalPerPageInput.value !== '1') {
          tipEl.style.display = 'block';
          tipEl.innerHTML = `⚠️ Bu sınav ${qCount} soru / çoklu ders içeriyor. Sayfa taşmasını önlemek ve şıkların tam sığması için <strong>Sayfa Başına 1 Form (A4)</strong> şiddetle önerilir.`;
          tipEl.style.background = 'rgba(239, 68, 68, 0.08)';
          tipEl.style.borderColor = 'rgba(239, 68, 68, 0.25)';
          tipEl.style.color = 'var(--danger)';
        } else if (isMulti || qCount > 35) {
          tipEl.style.display = 'block';
          tipEl.innerHTML = `ℹ️ Çoklu ders optik formunun A4 sayfaya tam sığması ve net okunabilmesi için <strong>Sayfa Başına 1 Form (A4)</strong> seçildi.`;
          tipEl.style.background = 'rgba(99, 102, 241, 0.08)';
          tipEl.style.borderColor = 'rgba(99, 102, 241, 0.2)';
          tipEl.style.color = '#4338ca';
        } else {
          tipEl.style.display = 'none';
        }
      }
      updateOpticalLivePreview();
    });
  }

  // Optik Form Kapatma
  document.querySelectorAll('#modal-print-optical .close-btn, #modal-print-optical .close-btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
      if (modalPrintOptical) modalPrintOptical.classList.remove('active');
    });
  });

  // Tümünü Seç / Kaldır
  if (btnOpticalSelectAll) {
    btnOpticalSelectAll.addEventListener('click', () => {
      if (opticalStudentsList) {
        opticalStudentsList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        updateOpticalSelectedCount();
        updateOpticalLivePreview();
      }
    });
  }

  if (btnOpticalClearAll) {
    btnOpticalClearAll.addEventListener('click', () => {
      if (opticalStudentsList) {
        opticalStudentsList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        updateOpticalSelectedCount();
        updateOpticalLivePreview();
      }
    });
  }

  // Optik Form Yazdırma Formu submit
  if (formPrintOptical) {
    formPrintOptical.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const questionCount = parseInt(document.getElementById('optical-questions-input').value) || 20;
      const choicesCount = parseInt(document.getElementById('optical-choices-input').value) || 4;
      const formType = document.getElementById('optical-type-input')?.value || 'named';
      const perPage = parseInt(document.getElementById('optical-per-page-input')?.value, 10) || 2;
      
      // Seçili öğrencileri al
      const selectedStudentIds = [];
      if (formType === 'named') {
        opticalStudentsList.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
          selectedStudentIds.push(cb.value);
        });
        
        if (selectedStudentIds.length === 0) {
          if (toastCallback) toastCallback('Lütfen en az bir öğrenci seçin!', 'warning');
          return;
        }
      }
      
      // Formları oluştur
      generateOpticalFormsHTML(selectedStudentIds, questionCount, choicesCount, formType, perPage);
      
      // Kapat modalı
      if (modalPrintOptical) modalPrintOptical.classList.remove('active');
      
      // Yazdır
      const printStyle = document.createElement('style');
      printStyle.id = 'optical-print-page-style';
      printStyle.textContent = `@page { size: A4 portrait; margin: 4mm 5mm; }`;
      document.head.appendChild(printStyle);

      document.body.classList.add('print-optical');
      window.print();
      
      const cleanupPrint = () => {
        document.body.classList.remove('print-optical');
        const s = document.getElementById('optical-print-page-style');
        if (s) s.remove();
      };

      window.addEventListener('afterprint', cleanupPrint, { once: true });
      setTimeout(cleanupPrint, 1000);
    });
  }

  // ==========================================================================
  // TARANAN OPTİK FORMLARI YÜKLEME VE YAPAY ZEKA (GEMINI) İLE DEĞERLENDİRME
  // ==========================================================================

  // Modalı Aç
  if (btnUploadOpticalForms) {
    btnUploadOpticalForms.addEventListener('click', () => {
      openOpticalUploadModal();
    });
  }

  function openOpticalUploadModal() {
    if (!activeExam) {
      if (toastCallback) toastCallback('Lütfen önce bir sınav seçin!', 'warning');
      return;
    }

    // State'ten sınavın en güncel verisini tazele (önceki sonuçların korunmasını garantile)
    const state = stateManager.loadState();
    const freshExam = (state.weeklyEvaluations || []).find(e => e && e.id === activeExam.id);
    if (freshExam) {
      activeExam = freshExam;
    }

    if (!modalUploadOpticalEval) return;

    // Sınav Bilgilerini ve Mevcut Kayıtlı Öğrenci Koruma Rozetini Başlığa Yaz
    if (opticalEvalSubtitle) {
      const qCount = activeExam.totalQuestions || 20;
      const cCount = activeExam.choicesCount || 4;
      const bText = activeExam.branch ? ` • Şube: <strong>${activeExam.branch}</strong>` : '';
      const existingCount = Object.keys(activeExam.studentResults || {}).length;
      const existingBadge = existingCount > 0
        ? `<div style="margin-top: 5px;"><span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; font-weight: 700; font-size: 0.76rem; padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">🛡️ Bu sınavda ${existingCount} kayıtlı öğrenci sonucu var — Yeni tarama mevcutların üzerine eklenecektir</span></div>`
        : '';
      opticalEvalSubtitle.innerHTML = `Sınav: <strong>${activeExam.examName}</strong> • Soru Sayısı: <strong>${qCount}</strong> • Seçenekler: <strong>${cCount} Şıklı</strong>${bText}${existingBadge}`;
    }

    // Ekranları Sıfırla
    if (opticalEvalStepUpload) opticalEvalStepUpload.style.display = 'block';
    if (opticalEvalStepProcessing) opticalEvalStepProcessing.style.display = 'none';
    if (opticalEvalStepResults) opticalEvalStepResults.style.display = 'none';

    // Seçilen Dosyaları Sıfırla
    opticalSelectedFiles = [];
    opticalScannedResults = [];
    renderOpticalFilesPreview();

    // Cevap Anahtarını Yükle & Durumu Güncelle
    opticalTempExamKey = { ...(activeExam.answerKey || {}) };
    if (activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0) {
      activeOpticalKeySubjId = activeExam.subjects[0].id;
    } else {
      activeOpticalKeySubjId = '';
    }
    updateOpticalKeyStatusDisplay();
    renderOpticalKeyEditor();

    // API Anahtarı Durumunu Güncelle
    updateOpticalApiKeyBanner();

    // Modalı Göster
    modalUploadOpticalEval.classList.add('active');
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Modalı Kapatma Butonları (Güvenli ve onaylı)
  const handleCloseOpticalUploadModal = async () => {
    if (!modalUploadOpticalEval) return;
    const hasUnsavedResults = opticalScannedResults && opticalScannedResults.length > 0 && opticalEvalStepResults && opticalEvalStepResults.style.display !== 'none';
    if (hasUnsavedResults) {
      const ok = await window.showConfirmDialog({
        title: 'Tarama İptali',
        message: 'Taranan öğrenci sonuçları henüz sınav tablosuna aktarılmadı.<br>Çıkmak istediğinize emin misiniz?<br><small style="color:var(--text-muted);">Mevcut kayıtlı tüm sınav notlarınız aynen korunacaktır.</small>',
        confirmText: 'Çık',
        cancelText: 'Devam Et',
        type: 'warning'
      });
      if (!ok) return;
    }
    modalUploadOpticalEval.classList.remove('active');
  };

  if (btnCloseOpticalUploadModal) {
    btnCloseOpticalUploadModal.addEventListener('click', handleCloseOpticalUploadModal);
  }
  if (btnCancelOpticalUpload) {
    btnCancelOpticalUpload.addEventListener('click', handleCloseOpticalUploadModal);
  }

  // API Anahtarı Durum Göstergesi
  function updateOpticalApiKeyBanner() {
    if (!opticalApiKeyBanner) return;
    const apiKey = (window.getGeminiApiKey ? window.getGeminiApiKey() : (localStorage.getItem('sinif_asistani_gemini_api_key') || '')).trim();

    if (apiKey) {
      opticalApiKeyBanner.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: 0.65rem 0.85rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: #059669; font-weight: 600;">
            <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
            <span>Gemini Vision Yapay Zeka Motoru Hazır</span>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-change-optical-gemini-key" style="font-size: 0.72rem; padding: 0.2rem 0.5rem; height: auto;">
            Anahtarı Değiştir
          </button>
        </div>
      `;
      const btnChange = document.getElementById('btn-change-optical-gemini-key');
      if (btnChange) {
        btnChange.addEventListener('click', () => {
          if (typeof window.showGeminiKeyRequiredModal === 'function') {
            window.showGeminiKeyRequiredModal({
              featureName: 'Optik Form Okuma (Gemini Vision)',
              description: 'Gemini API anahtarınızı güncellemek için yeni anahtarı giriniz.',
              confirmText: 'Anahtarı Güncelle',
              onSuccess: () => {
                updateOpticalApiKeyBanner();
              }
            });
          } else {
            const modalSetup = document.getElementById('modal-gemini-key-setup');
            if (modalSetup) modalSetup.classList.add('active');
          }
        });
      }
    } else {
      opticalApiKeyBanner.innerHTML = `
        <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: var(--radius-md); padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">✨</span>
            <div>
              <strong style="font-size: 0.84rem; color: #b45309;">Gemini API Anahtarı Tanımlayın</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1px;">
                Taranan optik formların yapay zeka ile otomatik okunabilmesi için ücretsiz Google API anahtarı gereklidir.
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="btn-setup-optical-gemini-key" style="font-size: 0.78rem; padding: 0.35rem 0.75rem; height: auto; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: #fff; font-weight: 700;">
            API Anahtarı Girin
          </button>
        </div>
      `;
      const btnSetup = document.getElementById('btn-setup-optical-gemini-key');
      if (btnSetup) {
        btnSetup.addEventListener('click', () => {
          if (typeof window.showGeminiKeyRequiredModal === 'function') {
            window.showGeminiKeyRequiredModal({
              featureName: 'Optik Form Okuma (Gemini Vision)',
              description: 'Taranan optik formların yapay zeka ile otomatik okunabilmesi için Google Gemini API anahtarı gereklidir.',
              confirmText: 'Kaydet ve Devam Et',
              onSuccess: () => {
                updateOpticalApiKeyBanner();
              }
            });
          } else {
            const modalSetup = document.getElementById('modal-gemini-key-setup');
            if (modalSetup) modalSetup.classList.add('active');
          }
        });
      }
    }
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Cevap Anahtarı Durum Metni
  function updateOpticalKeyStatusDisplay() {
    if (!opticalEvalKeyStatus || !activeExam) return;
    const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
    const isMulti = activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0;

    let answeredCount = 0;
    if (isMulti) {
      let cumulative = 0;
      activeExam.subjects.forEach(s => {
        for (let q = 1; q <= s.questionCount; q++) {
          const globalQ = cumulative + q;
          const k1 = `${s.id}_${q}`;
          const k2 = `${s.name}_${q}`;
          if (opticalTempExamKey[k1] || opticalTempExamKey[k2] || opticalTempExamKey[globalQ] || opticalTempExamKey[String(globalQ)]) {
            answeredCount++;
          }
        }
        cumulative += s.questionCount;
      });
    } else {
      answeredCount = Object.keys(opticalTempExamKey || {}).filter(k => parseInt(k, 10) <= qCount && opticalTempExamKey[k]).length;
    }

    if (answeredCount === qCount) {
      opticalEvalKeyStatus.innerHTML = `<span style="color: #10b981; font-weight: 700;">${answeredCount} / ${qCount} Soru Tamamlandı ✓</span>`;
    } else if (answeredCount > 0) {
      opticalEvalKeyStatus.innerHTML = `<span style="color: #f59e0b; font-weight: 700;">${answeredCount} / ${qCount} Soru Belirlendi (Eksik var!)</span>`;
    } else {
      opticalEvalKeyStatus.innerHTML = `<span style="color: #ef4444; font-weight: 700;">Cevap Anahtarı Tanımlanmamış</span>`;
    }
  }

  // Cevap Anahtarı Editörü Aç/Kapat
  if (btnToggleOpticalKeyEditor) {
    btnToggleOpticalKeyEditor.addEventListener('click', () => {
      if (!opticalEvalKeyEditorBox) return;
      const isHidden = opticalEvalKeyEditorBox.style.display === 'none';
      opticalEvalKeyEditorBox.style.display = isHidden ? 'block' : 'none';
      btnToggleOpticalKeyEditor.querySelector('span').textContent = isHidden ? 'Editörü Kapat' : 'Cevap Anahtarını Düzenle';
    });
  }

  // Cevap Anahtarı Editörü Grid Çizimi (Tek ve Çoklu Ders Uyumlu)
  function renderOpticalKeyEditor() {
    if (!opticalEvalKeyGrid || !activeExam) return;
    opticalEvalKeyGrid.innerHTML = '';

    const isMulti = activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0;
    const cCount = parseInt(activeExam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, cCount);

    if (isMulti) {
      const subjects = activeExam.subjects;
      activeOpticalKeySubjId = activeOpticalKeySubjId || subjects[0].id;
      const currentSubj = subjects.find(s => s.id === activeOpticalKeySubjId) || subjects[0];

      // Tab çubuğu
      const tabsWrap = document.createElement('div');
      tabsWrap.style.cssText = 'display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap; width: 100%; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;';

      subjects.forEach(s => {
        let marked = 0;
        for (let q = 1; q <= s.questionCount; q++) {
          if (opticalTempExamKey[`${s.id}_${q}`] || opticalTempExamKey[`${s.name}_${q}`]) marked++;
        }
        const tabBtn = document.createElement('button');
        tabBtn.type = 'button';
        const isActive = s.id === currentSubj.id;
        tabBtn.className = `btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`;
        tabBtn.style.cssText = `font-size: 0.73rem; padding: 0.2rem 0.55rem; height: auto; border-radius: 4px; ${isActive ? 'font-weight: 700;' : ''}`;
        tabBtn.textContent = `${s.name} (${marked}/${s.questionCount})`;
        tabBtn.addEventListener('click', () => {
          activeOpticalKeySubjId = s.id;
          renderOpticalKeyEditor();
        });
        tabsWrap.appendChild(tabBtn);
      });
      opticalEvalKeyGrid.appendChild(tabsWrap);

      const gridWrap = document.createElement('div');
      gridWrap.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; width: 100%;';

      for (let q = 1; q <= currentSubj.questionCount; q++) {
        const key = `${currentSubj.id}_${q}`;
        const row = document.createElement('div');
        row.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 2px 6px;';

        const label = document.createElement('span');
        label.textContent = `${q}:`;
        label.style.cssText = 'font-size: 0.75rem; font-weight: 700; color: var(--text-muted); min-width: 22px; text-align: right;';
        row.appendChild(label);

        const currentVal = opticalTempExamKey[key] || opticalTempExamKey[`${currentSubj.name}_${q}`] || '';

        letters.forEach(letter => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = letter;
          btn.className = `optical-key-pill-btn ${currentVal === letter ? 'active' : ''}`;
          btn.addEventListener('click', () => {
            if (opticalTempExamKey[key] === letter || opticalTempExamKey[`${currentSubj.name}_${q}`] === letter) {
              delete opticalTempExamKey[key];
              delete opticalTempExamKey[`${currentSubj.name}_${q}`];
            } else {
              opticalTempExamKey[key] = letter;
              delete opticalTempExamKey[`${currentSubj.name}_${q}`];
            }
            activeExam.answerKey = { ...opticalTempExamKey };
            stateManager.saveExam(activeExam);
            updateOpticalKeyStatusDisplay();
            renderOpticalKeyEditor();
          });
          row.appendChild(btn);
        });

        gridWrap.appendChild(row);
      }
      opticalEvalKeyGrid.appendChild(gridWrap);

    } else {
      // Tek ders modu
      const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
      for (let q = 1; q <= qCount; q++) {
        const row = document.createElement('div');
        row.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 2px 6px;';

        const label = document.createElement('span');
        label.textContent = `${q}:`;
        label.style.cssText = 'font-size: 0.75rem; font-weight: 700; color: var(--text-muted); min-width: 22px; text-align: right;';
        row.appendChild(label);

        letters.forEach(letter => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = letter;
          btn.className = `optical-key-pill-btn ${opticalTempExamKey[q] === letter ? 'active' : ''}`;
          btn.addEventListener('click', () => {
            if (opticalTempExamKey[q] === letter) {
              delete opticalTempExamKey[q];
            } else {
              opticalTempExamKey[q] = letter;
            }
            activeExam.answerKey = { ...opticalTempExamKey };
            stateManager.saveExam(activeExam);
            updateOpticalKeyStatusDisplay();
            renderOpticalKeyEditor();
          });
          row.appendChild(btn);
        });

        opticalEvalKeyGrid.appendChild(row);
      }
    }
  }

  // Cevap Anahtarı Örnek Doldur
  if (btnOpticalFillSampleKey) {
    btnOpticalFillSampleKey.addEventListener('click', () => {
      if (!activeExam) return;
      const cCount = parseInt(activeExam.choicesCount, 10) || 4;
      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, cCount);
      const isMulti = activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0;

      if (isMulti) {
        activeExam.subjects.forEach(s => {
          for (let q = 1; q <= s.questionCount; q++) {
            opticalTempExamKey[`${s.id}_${q}`] = letters[(q - 1) % letters.length];
          }
        });
      } else {
        const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
        for (let q = 1; q <= qCount; q++) {
          opticalTempExamKey[q] = letters[(q - 1) % letters.length];
        }
      }
      activeExam.answerKey = { ...opticalTempExamKey };
      stateManager.saveExam(activeExam);
      updateOpticalKeyStatusDisplay();
      renderOpticalKeyEditor();
    });
  }

  // Cevap Anahtarı Temizle
  if (btnOpticalClearKey) {
    btnOpticalClearKey.addEventListener('click', async () => {
      const confirmed = await window.showConfirmDialog({
        title: 'Cevap Anahtarını Temizle',
        message: 'Sınav cevap anahtarını temizlemek istediğinize emin misiniz?',
        confirmText: 'Temizle',
        cancelText: 'Vazgeç',
        type: 'danger'
      });
      if (!confirmed) return;

      opticalTempExamKey = {};
      if (activeExam) {
        activeExam.answerKey = {};
        stateManager.saveExam(activeExam);
      }
      updateOpticalKeyStatusDisplay();
      renderOpticalKeyEditor();
    });
  }

  // Sürükle Bırak ve Dosya Seçimi
  if (opticalDropzone) {
    opticalDropzone.addEventListener('click', () => {
      if (opticalFileInput) opticalFileInput.click();
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      opticalDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        opticalDropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      opticalDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        opticalDropzone.classList.remove('dragover');
      });
    });

    opticalDropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        handleOpticalFilesSelection(dt.files);
      }
    });
  }

  if (opticalFileInput) {
    opticalFileInput.addEventListener('change', () => {
      if (opticalFileInput.files && opticalFileInput.files.length > 0) {
        handleOpticalFilesSelection(opticalFileInput.files);
        opticalFileInput.value = '';
      }
    });
  }

  // JPEG Boyut Bilgisi Okuyucu (SOF0/SOF1/SOF2 marker)
  function getJpegDimensions(bytes) {
    let i = 2;
    while (i < bytes.length - 8) {
      if (bytes[i] === 0xFF) {
        const marker = bytes[i + 1];
        if (marker >= 0xC0 && marker <= 0xC3 && marker !== 0xC4) {
          const h = (bytes[i + 5] << 8) | bytes[i + 6];
          const w = (bytes[i + 7] << 8) | bytes[i + 8];
          return { w, h };
        }
        const len = (bytes[i + 2] << 8) | bytes[i + 3];
        if (len <= 0) break;
        i += 2 + len;
      } else {
        i++;
      }
    }
    return { w: 0, h: 0 };
  }

  // JPEG Akışı Çıkarıcı (CamScanner ve taranmış PDF'ler için saf JS, bağımsız ve çevrimdışı)
  function extractJpegsFromUint8Array(bytes) {
    const jpegs = [];
    const len = bytes.length;
    let i = 0;
    while (i < len - 3) {
      if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8 && bytes[i + 2] === 0xFF) {
        const start = i;
        let j = start + 2;
        let foundEnd = -1;
        let inSos = false;
        while (j < len - 1) {
          if (bytes[j] === 0xFF) {
            const marker = bytes[j + 1];
            if (marker === 0xD9) { // EOI marker
              foundEnd = j + 2;
              break;
            }
            if (marker === 0xDA) { // SOS (Start of Scan)
              inSos = true;
              if (j + 3 < len) {
                const segLen = (bytes[j + 2] << 8) | bytes[j + 3];
                j += 2 + segLen;
                continue;
              }
            }
            if (inSos) {
              if (marker === 0x00 || (marker >= 0xD0 && marker <= 0xD7)) {
                j += 2;
                continue;
              }
            } else {
              if (j + 3 < len && marker !== 0x00 && !(marker >= 0xD0 && marker <= 0xD7)) {
                const segLen = (bytes[j + 2] << 8) | bytes[j + 3];
                if (segLen >= 2) {
                  j += 2 + segLen;
                  continue;
                }
              }
            }
          }
          j++;
        }
        if (foundEnd !== -1) {
          const jpegBytes = bytes.subarray(start, foundEnd);
          const dims = getJpegDimensions(jpegBytes);
          // CamScanner watermark veya küçük simgeleri filtrele (en az 400x400 veya >25KB)
          const isFullPage = (dims.w >= 400 && dims.h >= 400) || jpegBytes.length > 25000;
          if (isFullPage) {
            jpegs.push(jpegBytes);
          }
          i = foundEnd;
          continue;
        }
      }
      i++;
    }
    return jpegs;
  }

  // Tuvalin bembeyaz veya boş kalıp kalmadığını denetleyen koruma fonksiyonu
  function isCanvasBlank(canvas) {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return true;
      const w = canvas.width;
      const h = canvas.height;
      if (w <= 0 || h <= 0) return true;

      const samplePoints = [
        [w * 0.15, h * 0.15], [w * 0.5, h * 0.15], [w * 0.85, h * 0.15],
        [w * 0.2, h * 0.35], [w * 0.5, h * 0.35], [w * 0.8, h * 0.35],
        [w * 0.15, h * 0.5], [w * 0.35, h * 0.5], [w * 0.5, h * 0.5], [w * 0.65, h * 0.5], [w * 0.85, h * 0.5],
        [w * 0.2, h * 0.65], [w * 0.5, h * 0.65], [w * 0.8, h * 0.65],
        [w * 0.15, h * 0.85], [w * 0.5, h * 0.85], [w * 0.85, h * 0.85]
      ];

      for (const [x, y] of samplePoints) {
        const px = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        if (px[3] > 10 && (px[0] < 240 || px[1] < 240 || px[2] < 240)) {
          return false; // Sayfada çizilmiş optik form içeriği var
        }
      }

      // Yatay orta çizgi kontrolü
      const midData = ctx.getImageData(Math.floor(w * 0.1), Math.floor(h * 0.5), Math.floor(w * 0.8), 1).data;
      for (let i = 0; i < midData.length; i += 4) {
        if (midData[i + 3] > 10 && (midData[i] < 240 || midData[i + 1] < 240 || midData[i + 2] < 240)) {
          return false;
        }
      }

      return true; // Bembeyaz / boş tuval
    } catch (e) {
      return false;
    }
  }

  // Tekil Dosya veya Çok Sayfalı PDF İşleme Motoru (Bellek Güvenli, Boş Sayfa Korumalı & Canlı İlerleme Bildirimli)
  async function processOpticalFile(file, onProgress) {
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

    if (!isPdf) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve([{
            id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            file: file,
            name: file.name,
            sizeText: (file.size / 1024).toFixed(0) + ' KB',
            dataUrl: e.target.result,
            isPdf: false
          }]);
        };
        reader.onerror = () => resolve([]);
        reader.readAsDataURL(file);
      });
    }

    // PDF Dosyası (CamScanner veya taranmış PDF belgesi)
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      // 1. CamScanner Gömülü Orijinal JPEG'leri Kontrol Et (Saf JS, WebKit Canvas ve Bellek Kısıtlarından Bağımsız)
      const extractedJpegs = extractJpegsFromUint8Array(uint8);

      let pdfDoc = null;
      let totalP = 0;
      if (window.pdfjsLib) {
        try {
          const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
          pdfDoc = await loadingTask.promise;
          totalP = pdfDoc.numPages || 0;
        } catch (e) {
          console.warn('PDF.js sayfa sayısı okunamadı:', e);
        }
      }

      // Eğer CamScanner gömülü JPEG'leri bulunduysa ve sayfa sayısıyla örtüşüyorsa:
      // Tuval oluşturma bellek sınırlarına girmeden doğrudan orijinal kamera taramalarını kullan!
      if (extractedJpegs.length > 0 && (totalP === 0 || extractedJpegs.length >= totalP)) {
        const count = extractedJpegs.length;
        const pages = [];
        for (let i = 0; i < count; i++) {
          if (typeof onProgress === 'function') {
            onProgress(i + 1, count, file.name);
          }
          const jpegBytes = extractedJpegs[i];
          const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
          const pageDataUrl = await new Promise(res => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result);
            fr.readAsDataURL(blob);
          });
          pages.push({
            id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '_p' + (i + 1),
            file: file,
            name: `${file.name} (Sayfa ${i + 1}/${count})`,
            sizeText: (jpegBytes.length / 1024).toFixed(0) + ' KB',
            dataUrl: pageDataUrl,
            isPdf: false,
            isPdfPage: true
          });
          await new Promise(r => setTimeout(r, 15));
        }
        if (pdfDoc && typeof pdfDoc.destroy === 'function') pdfDoc.destroy();
        return pages;
      }

      // 2. PDF.js ile Sayfaları Render Etme (Vektör/Dijital PDF veya hibrit belgeler)
      if (pdfDoc) {
        try {
          const pages = [];
          const numPages = totalP || 1;

          for (let p = 1; p <= numPages; p++) {
            if (typeof onProgress === 'function') {
              onProgress(p, numPages, file.name);
            }

            const page = await pdfDoc.getPage(p);
            const initialVp = page.getViewport({ scale: 1.0 });
            const maxDim = Math.max(initialVp.width, initialVp.height) || 1000;
            
            // HEDEF: 1400 piksel (WebKitGTK 4096px donanım sınırını ve 16MP doku taşmasını asla aşmaz)
            let scale = 1400 / maxDim;
            if (scale > 2.0) scale = 2.0;
            if (scale < 0.25) scale = 0.25;

            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(2048, Math.round(viewport.width));
            canvas.height = Math.min(2048, Math.round(viewport.height));
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({ canvasContext: ctx, viewport }).promise;

            let pageDataUrl = '';
            const isBlank = isCanvasBlank(canvas);

            if (isBlank) {
              console.warn(`[OMR PDF] Sayfa ${p} beyaz/boş render edildi! Alternatif kurtarma deneniyor...`);
              if (extractedJpegs[p - 1]) {
                const blob = new Blob([extractedJpegs[p - 1]], { type: 'image/jpeg' });
                pageDataUrl = await new Promise(res => {
                  const fr = new FileReader();
                  fr.onload = () => res(fr.result);
                  fr.readAsDataURL(blob);
                });
              } else {
                // Güvenli düşük çözünürlüklü kurtarma denemesi
                const retryScale = Math.min(1.0, 1000 / maxDim);
                const retryVp = page.getViewport({ scale: retryScale });
                canvas.width = Math.round(retryVp.width);
                canvas.height = Math.round(retryVp.height);
                const retryCtx = canvas.getContext('2d');
                await page.render({ canvasContext: retryCtx, viewport: retryVp }).promise;
                pageDataUrl = canvas.toDataURL('image/jpeg', 0.90);
              }
            } else {
              pageDataUrl = canvas.toDataURL('image/jpeg', 0.90);
            }

            if (typeof page.cleanup === 'function') page.cleanup();
            canvas.width = 0;
            canvas.height = 0;

            pages.push({
              id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '_p' + p,
              file: file,
              name: `${file.name} (Sayfa ${p}/${numPages})`,
              sizeText: `Sayfa ${p} / ${numPages}`,
              dataUrl: pageDataUrl,
              isPdf: false,
              isPdfPage: true
            });

            await new Promise(r => setTimeout(r, 25));
          }

          if (typeof pdfDoc.destroy === 'function') pdfDoc.destroy();
          if (pages.length > 0) return pages;
        } catch (pdfErr) {
          console.warn('PDF.js render hatası:', pdfErr);
        }
      }

      // 3. Eğer hiçbiri çalışmazsa ve elde JPEG'ler varsa onları döndür
      if (extractedJpegs.length > 0) {
        const pages = [];
        for (let i = 0; i < extractedJpegs.length; i++) {
          const jpegBytes = extractedJpegs[i];
          const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
          const pageDataUrl = await new Promise(res => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result);
            fr.readAsDataURL(blob);
          });
          pages.push({
            id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '_p' + (i + 1),
            file: file,
            name: `${file.name} (Sayfa ${i + 1}/${extractedJpegs.length})`,
            sizeText: (jpegBytes.length / 1024).toFixed(0) + ' KB',
            dataUrl: pageDataUrl,
            isPdf: false,
            isPdfPage: true
          });
        }
        return pages;
      }

      // 4. Doğrudan PDF Dosyası (Gemini Vision API)
      const pdfDataUrl = await new Promise(res => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.readAsDataURL(file);
      });
      return [{
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        file: file,
        name: file.name,
        sizeText: (file.size / 1024).toFixed(0) + ' KB (PDF)',
        dataUrl: pdfDataUrl,
        isPdf: true
      }];

    } catch (err) {
      console.error('PDF işleme hatası:', err);
      const pdfDataUrl = await new Promise(res => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.readAsDataURL(file);
      });
      return [{
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        file: file,
        name: file.name,
        sizeText: (file.size / 1024).toFixed(0) + ' KB (PDF)',
        dataUrl: pdfDataUrl,
        isPdf: true
      }];
    }
  }

  // Dosyaları İşle ve Listeye Ekle
  async function handleOpticalFilesSelection(fileList) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    const filesArray = Array.from(fileList).filter(f => validTypes.includes(f.type) || /\.(jpe?g|png|webp|pdf)$/i.test(f.name));

    if (filesArray.length === 0) {
      if (toastCallback) toastCallback('Lütfen geçerli görsel (JPG, PNG) veya CamScanner PDF dosyası seçin!', 'warning');
      return;
    }

    const hasPdf = filesArray.some(f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));

    if (hasPdf && opticalPdfLoadingOverlay) {
      opticalPdfLoadingOverlay.style.display = 'block';
      if (opticalDropzone) opticalDropzone.style.display = 'none';
      if (opticalPdfProgressBar) opticalPdfProgressBar.style.width = '0%';
      if (opticalPdfProgressText) opticalPdfProgressText.textContent = '%0 Hazırlandı';
      if (opticalPdfLoadingDesc) opticalPdfLoadingDesc.textContent = 'PDF sayfaları taranıyor ve optimize ediliyor...';
    }

    let newlyAdded = 0;
    try {
      for (let fIdx = 0; fIdx < filesArray.length; fIdx++) {
        const file = filesArray[fIdx];
        const items = await processOpticalFile(file, (p, totalP, fName) => {
          if (opticalPdfLoadingOverlay) {
            const pct = Math.round((p / totalP) * 100);
            if (opticalPdfProgressBar) opticalPdfProgressBar.style.width = `${pct}%`;
            if (opticalPdfProgressText) opticalPdfProgressText.textContent = `%${pct} (${p}/${totalP} Sayfa)`;
            if (opticalPdfLoadingTitle) opticalPdfLoadingTitle.textContent = `"${fName}" Ayrıştırılıyor...`;
            if (opticalPdfLoadingDesc) opticalPdfLoadingDesc.textContent = `Sayfa ${p} / ${totalP} taranıyor, optik formlar hazırlanıyor...`;
          }
        });

        items.forEach(item => {
          opticalSelectedFiles.push(item);
          newlyAdded++;
        });
      }
    } catch (procErr) {
      console.error('Dosya işleme hatası:', procErr);
      if (toastCallback) toastCallback('Dosyalar işlenirken bir sorun oluştu: ' + (procErr.message || procErr), 'error');
    } finally {
      if (opticalPdfLoadingOverlay) opticalPdfLoadingOverlay.style.display = 'none';
      if (opticalDropzone) opticalDropzone.style.display = 'block';
    }

    renderOpticalFilesPreview();
    if (newlyAdded > 0 && toastCallback) {
      toastCallback(`✅ ${newlyAdded} form sayfası başarıyla listeye eklendi.`, 'success');
    }
  }

  // Seçilen Dosyaların Önizleme Listesini Çiz
  function renderOpticalFilesPreview() {
    if (!opticalSelectedFilesGrid || !opticalSelectedFilesContainer) return;

    if (opticalSelectedFiles.length === 0) {
      opticalSelectedFilesContainer.style.display = 'none';
      opticalSelectedFilesGrid.innerHTML = '';
      if (btnStartOpticalAiEval) btnStartOpticalAiEval.disabled = true;
      return;
    }

    opticalSelectedFilesContainer.style.display = 'block';
    if (opticalSelectedFilesTitle) {
      opticalSelectedFilesTitle.textContent = `Seçilen Formlar (${opticalSelectedFiles.length})`;
    }
    if (btnStartOpticalAiEval) btnStartOpticalAiEval.disabled = false;

    opticalSelectedFilesGrid.innerHTML = '';
    opticalSelectedFiles.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'optical-file-item';

      let thumbHtml = '';
      if (item.isPdf) {
        thumbHtml = `
          <div class="optical-file-pdf-thumb">
            <i data-lucide="file-text" style="width: 28px; height: 28px;"></i>
            <span style="font-size: 0.68rem; font-weight: 700;">PDF BELGESİ</span>
          </div>
        `;
      } else {
        thumbHtml = `<img class="optical-file-thumb" src="${item.dataUrl}" alt="${item.name}">`;
      }

      card.innerHTML = `
        <button type="button" class="optical-file-remove-btn" title="Kaldır">&times;</button>
        ${thumbHtml}
        <div style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; color: var(--text-primary);" title="${item.name}">${item.name}</div>
        <div style="color: var(--text-muted); font-size: 0.68rem;">${item.sizeText}</div>
      `;

      card.querySelector('.optical-file-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        opticalSelectedFiles.splice(index, 1);
        renderOpticalFilesPreview();
      });

      card.addEventListener('click', () => {
        openOpticalImagePreview(item.dataUrl, item.isPdf, item.name);
      });

      opticalSelectedFilesGrid.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons({ root: opticalSelectedFilesGrid });
    }
  }

  // Tüm Dosyaları Temizle
  if (btnOpticalClearFiles) {
    btnOpticalClearFiles.addEventListener('click', () => {
      opticalSelectedFiles = [];
      renderOpticalFilesPreview();
    });
  }

  // Görsel / Belge Büyütme (Lightbox)
  function openOpticalImagePreview(dataUrl, isPdf = false, title = '') {
    if (!modalOpticalImagePreview) return;
    const img = document.getElementById('optical-preview-img');
    const iframe = document.getElementById('optical-preview-iframe');
    const titleEl = document.getElementById('optical-preview-title');

    if (titleEl) {
      titleEl.textContent = title || (isPdf ? 'Taranan PDF Belgesi' : 'Taranan Optik Form Görseli');
    }

    if (isPdf) {
      if (img) img.style.display = 'none';
      if (iframe) {
        iframe.style.display = 'block';
        iframe.src = dataUrl;
      }
    } else {
      if (iframe) {
        iframe.style.display = 'none';
        iframe.src = '';
      }
      if (img) {
        img.style.display = 'inline-block';
        img.src = dataUrl;
      }
    }
    modalOpticalImagePreview.classList.add('active');
  }

  if (btnCloseOpticalPreview) {
    btnCloseOpticalPreview.addEventListener('click', () => {
      if (modalOpticalImagePreview) modalOpticalImagePreview.classList.remove('active');
      const iframe = document.getElementById('optical-preview-iframe');
      if (iframe) iframe.src = '';
    });
  }

  // Log ekleme
  function appendOpticalLog(text) {
    if (!opticalProcessingLogBox) return;
    const line = document.createElement('div');
    line.textContent = `▶ ${text}`;
    opticalProcessingLogBox.appendChild(line);
    opticalProcessingLogBox.scrollTop = opticalProcessingLogBox.scrollHeight;
  }

  // ==========================================================================
  // OMR SONUÇ KARTI YENİDEN HESAPLAMA MOTORU
  // ==========================================================================

  function recalculateResultCard(res) {
    if (!res || !activeExam) return;
    const isMulti = activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0;
    const penaltyRate = activeExam.wrongAffects ? (parseFloat(activeExam.penaltyRate) || 4) : 0;
    const qCount = parseInt(activeExam.totalQuestions, 10) || 20;

    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;

    if (isMulti) {
      const subjectBreakdown = {};
      activeExam.subjects.forEach(subj => {
        let subjCorrect = 0;
        let subjWrong = 0;
        let subjBlank = 0;

        const qds = (res.questionDetails || []).filter(qd => qd.subjId === subj.id);
        qds.forEach(qd => {
          if (!qd.marked) {
            blankCount++;
            subjBlank++;
            qd.isCorrect = false;
            qd.isBlank = true;
          } else if (qd.keyAnswer && qd.marked === qd.keyAnswer) {
            correctCount++;
            subjCorrect++;
            qd.isCorrect = true;
            qd.isBlank = false;
          } else {
            wrongCount++;
            subjWrong++;
            qd.isCorrect = false;
            qd.isBlank = false;
          }
          if (res.answers) res.answers[qd.key] = qd.marked;
        });

        let subjNet = penaltyRate > 0 ? (subjCorrect - (subjWrong / penaltyRate)) : subjCorrect;
        subjNet = Math.max(0, parseFloat(subjNet.toFixed(2)));
        const subjScore = subj.questionCount > 0 ? parseFloat(((subjNet / subj.questionCount) * 100).toFixed(1)) : 0;

        subjectBreakdown[subj.id] = {
          id: subj.id,
          name: subj.name,
          subjectName: subj.name,
          correct: subjCorrect,
          wrong: subjWrong,
          blank: subjBlank,
          net: subjNet,
          score: subjScore,
          total: subj.questionCount
        };
      });

      let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
      net = Math.max(0, parseFloat(net.toFixed(2)));
      const score = qCount > 0 ? parseFloat(((net / qCount) * 100).toFixed(1)) : 0;

      res.correctCount = correctCount;
      res.wrongCount = wrongCount;
      res.blankCount = blankCount;
      res.net = net;
      res.score = score;
      res.subjectBreakdown = subjectBreakdown;

    } else {
      (res.questionDetails || []).forEach(qd => {
        if (!qd.marked) {
          blankCount++;
          qd.isCorrect = false;
          qd.isBlank = true;
        } else if (qd.keyAnswer && qd.marked === qd.keyAnswer) {
          correctCount++;
          qd.isCorrect = true;
          qd.isBlank = false;
        } else {
          wrongCount++;
          qd.isCorrect = false;
          qd.isBlank = false;
        }
        if (res.answers) res.answers[qd.q] = qd.marked;
      });

      let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
      net = Math.max(0, parseFloat(net.toFixed(2)));
      const score = qCount > 0 ? parseFloat(((net / qCount) * 100).toFixed(1)) : 0;

      res.correctCount = correctCount;
      res.wrongCount = wrongCount;
      res.blankCount = blankCount;
      res.net = net;
      res.score = score;
    }
  }

  // ==========================================================================
  // YAPAY ZEKA DEĞERLENDİRME ÇALIŞTIRMA MOTORU
  // ==========================================================================
  if (btnStartOpticalAiEval) {
    btnStartOpticalAiEval.addEventListener('click', () => {
      startOpticalAiEvaluation();
    });
  }

  // ==========================================================================
  // GELİŞMİŞ TÜRKÇE NORMALİZASYON VE ÖĞRENCİ EŞLEŞTİRME MOTORU (FUZZY + TOKEN)
  // ==========================================================================
  function normalizeOpticalName(text) {
    if (!text) return '';
    let str = String(text)
      .replace(/(?:öğrenci\s*adı\s*soyadı|öğrenci\s*adı|adı\s*soyadı|adi\s*soyadi|öğrenci|ogrenci|ad\s*soyad|no|numara|numarası)[\s:]+/gi, ' ')
      .trim();
    str = str.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
    const trMap = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };
    return str.replace(/[çğıöşü]/g, m => trMap[m] || m)
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function levenshteinDistance(a, b) {
    const m = a.length, n = b.length;
    const d = [];
    for (let i = 0; i <= m; i++) d[i] = [i];
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      }
    }
    return d[m][n];
  }

  function computeStringSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    if (s1 === s2) return 1;
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1;
    return 1 - (levenshteinDistance(s1, s2) / maxLen);
  }

  function findBestStudentMatch(cardStudentNo, cardStudentName, classStudents) {
    if (!Array.isArray(classStudents) || classStudents.length === 0) {
      return { matched: null, score: 0, candidate: null, candidateScore: 0 };
    }

    const rawNo = String(cardStudentNo || '').trim();
    const digitsAi = rawNo.replace(/\D/g, '');
    const normAi = normalizeOpticalName(cardStudentName);
    const wordsAi = normAi.split(' ').filter(w => w.length > 1);
    const sortedWordsAi = [...wordsAi].sort().join(' ');

    let bestStudent = null;
    let bestScore = 0;
    let bestCandidate = null;
    let highestCandidateScore = 0;

    for (const st of classStudents) {
      const rawStNo = String(st.number || '').trim();
      const digitsSt = rawStNo.replace(/\D/g, '');
      const normSt = normalizeOpticalName(`${st.name} ${st.surname || ''}`);
      const wordsSt = normSt.split(' ').filter(w => w.length > 1);
      const sortedWordsSt = [...wordsSt].sort().join(' ');

      let currentScore = 0;

      // 1. Okul Numarası Uyumu
      const hasMatchingNumber = digitsAi && digitsSt && (
        digitsAi === digitsSt || (parseInt(digitsAi, 10) === parseInt(digitsSt, 10) && parseInt(digitsAi, 10) > 0)
      );

      // 2. İsimsel Uyumluluk
      if (normAi && normSt && normAi === normSt) {
        currentScore += 100;
      } else if (sortedWordsAi && sortedWordsSt && sortedWordsAi === sortedWordsSt) {
        // Kelime sırası farklı (Ad-Soyad vs Soyad-Ad) ama kelimeler aynı
        currentScore += 96;
      } else if (normAi && normSt) {
        // Alt dize kontrolü (örneğin orta isim eksikliği veya tek isim yazılması)
        if (normSt.includes(normAi) || normAi.includes(normSt)) {
          currentScore += 85;
        }

        // Kelime (Token) kesişimi
        if (wordsAi.length > 0 && wordsSt.length > 0) {
          let matchedWordCount = 0;
          wordsAi.forEach(wAi => {
            if (wordsSt.some(wSt => wSt === wAi || (wAi.length >= 3 && (wSt.includes(wAi) || wAi.includes(wSt))))) {
              matchedWordCount++;
            }
          });
          const tokenOverlapRatio = matchedWordCount / Math.max(wordsAi.length, wordsSt.length);
          if (tokenOverlapRatio >= 0.75) {
            currentScore = Math.max(currentScore, 75 + Math.round(tokenOverlapRatio * 20));
          } else if (tokenOverlapRatio >= 0.5) {
            currentScore = Math.max(currentScore, 60 + Math.round(tokenOverlapRatio * 20));
          }
        }

        // Levenshtein Benzerlik Skoru (OCR harf hataları: ESLEN vs ESLEM, GOKTUK vs GOKTUG)
        const sim = computeStringSimilarity(sortedWordsAi || normAi, sortedWordsSt || normSt);
        if (sim >= 0.75) {
          currentScore = Math.max(currentScore, Math.round(sim * 90));
        }
      }

      if (hasMatchingNumber) {
        if (currentScore > 0) {
          currentScore = Math.min(100, currentScore + 25);
        } else {
          currentScore = 80;
        }
      }

      if (currentScore > highestCandidateScore) {
        highestCandidateScore = currentScore;
        bestCandidate = st;
      }

      if (currentScore >= 65 && currentScore > bestScore) {
        bestScore = currentScore;
        bestStudent = st;
      }
    }

    return {
      matched: bestStudent,
      score: bestScore,
      candidate: bestCandidate,
      candidateScore: highestCandidateScore
    };
  }
  window.findBestStudentMatch = findBestStudentMatch;

  async function startOpticalAiEvaluation() {
    if (!activeExam || opticalSelectedFiles.length === 0) return;

    let apiKey = (window.getGeminiApiKey ? window.getGeminiApiKey() : (localStorage.getItem('sinif_asistani_gemini_api_key') || '')).trim();
    if (!apiKey) {
      if (typeof window.showGeminiKeyRequiredModal === 'function') {
        window.showGeminiKeyRequiredModal({
          featureName: 'Optik Sınav Değerlendirme',
          description: 'Taranan optik formları yapay zeka ile otomatik değerlendirebilmek için Google Gemini bağlantısı gereklidir.',
          confirmText: 'Kaydet ve Değerlendirmeyi Başlat',
          onSuccess: () => {
            updateOpticalApiKeyBanner();
            startOpticalAiEvaluation();
          }
        });
      }
      return;
    }

    const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
    const choicesCount = parseInt(activeExam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
    const examTitle = activeExam.examName || 'Optik Sınav';

    // Ekranı İşlem Moduna Al
    opticalEvalStepUpload.style.display = 'none';
    opticalEvalStepProcessing.style.display = 'block';
    opticalEvalStepResults.style.display = 'none';

    if (opticalProcessingLogBox) opticalProcessingLogBox.innerHTML = '';
    appendOpticalLog('Yapay zeka analizi başlatılıyor...');

    const totalFiles = opticalSelectedFiles.length;
    opticalScannedResults = [];

    // Aktif sınıftaki öğrencileri al
    const state = stateManager.loadState();
    const isMiddle = state.educationLevel === 'middle';
    const examBranch = activeExam.branch || '';
    const classStudents = (state.students || []).filter(s => !isMiddle || !examBranch || s.branch === examBranch);

    const studentsRosterText = classStudents.length > 0
      ? classStudents.map(s => `- No: "${s.number || '-'}", Ad Soyad: "${s.name} ${s.surname || ''}"`).join('\n')
      : '(Sınıf listesi boş)';

    for (let i = 0; i < totalFiles; i++) {
      const fileItem = opticalSelectedFiles[i];
      const stepPct = Math.round(((i) / totalFiles) * 100);

      if (opticalProcessingCounter) opticalProcessingCounter.textContent = `${i + 1} / ${totalFiles} Dosya İnceleniyor`;
      if (opticalProcessingPercentage) opticalProcessingPercentage.textContent = `${stepPct}%`;
      if (opticalProcessingProgressBar) opticalProcessingProgressBar.style.width = `${stepPct}%`;
      if (opticalProcessingStepDesc) opticalProcessingStepDesc.textContent = `"${fileItem.name}" inceleniyor... Gemini Vision işaretlemeleri okuyor...`;

      appendOpticalLog(`Dosya ${i + 1}/${totalFiles}: ${fileItem.name} görseli taranıyor...`);

      try {
        let sendingData = fileItem.dataUrl;
        let sendingMime = 'image/jpeg';

        if (fileItem.isPdf) {
          sendingMime = 'application/pdf';
        } else {
          // Görseli canvas üzerinden yüksek kalitede optimize et (baloncuk netliği için 2200px)
          sendingData = await resizeImageForOmr(fileItem.dataUrl, 2200);
        }

        const isMulti = activeExam && !!activeExam.isMultiSubject;
        const examSubjects = activeExam && activeExam.subjects ? activeExam.subjects : [];

        // Resmi Cevap Anahtarı Bölümü (Gemini'ye optik baloncukları referans alarak hatasız okuma rehberliği sağlar)
        let answerKeyPromptSection = '';
        if (activeExam && activeExam.answerKey && Object.keys(activeExam.answerKey).length > 0) {
          if (isMulti && examSubjects.length > 0) {
            const lines = [];
            examSubjects.forEach((s, idx) => {
              const qList = [];
              for (let q = 1; q <= s.questionCount; q++) {
                const kAns = findCorrectAnswerForKey(activeExam.answerKey, s, idx, q, 0);
                if (kAns) qList.push(`${q}: ${kAns}`);
              }
              if (qList.length > 0) {
                lines.push(`  * ${s.name}: ${qList.join(', ')}`);
              }
            });
            if (lines.length > 0) {
              answerKeyPromptSection = `\nSINAVIN RESMİ CEVAP ANAHTARI (GÖRSEL REFERANS İÇİN):\n${lines.join('\n')}\n`;
            }
          } else {
            const qList = [];
            for (let q = 1; q <= qCount; q++) {
              const kAns = String(activeExam.answerKey[q] || activeExam.answerKey[String(q)] || '').trim().toUpperCase();
              if (kAns) qList.push(`${q}: ${kAns}`);
            }
            if (qList.length > 0) {
              answerKeyPromptSection = `\nSINAVIN RESMİ CEVAP ANAHTARI (GÖRSEL REFERANS İÇİN):\n  * Sorular: ${qList.join(', ')}\n`;
            }
          }
        }

        let prompt = '';
        if (isMulti && examSubjects.length > 0) {
          const subjectsDesc = examSubjects.map((s, idx) => {
            return `${idx + 1}. SÜTUN (Soldan Sağa ${idx + 1}. Dikey Blok) -> Ders Adı: "${s.name}", Soru Sayısı: ${s.questionCount} (Sorular 1'den ${s.questionCount}'e kadar), Kod: "${s.id}"`;
          }).join('\n');

          const exampleAnswerLines = [];
          examSubjects.forEach((s, sIdx) => {
            const sampleChoice = ['A', 'B', 'C', 'D'][sIdx % 4];
            exampleAnswerLines.push(`"${s.id}_1": "${sampleChoice}"`);
            if (s.questionCount >= 2) {
              const sampleChoice2 = ['C', 'A', 'D', 'B'][sIdx % 4];
              exampleAnswerLines.push(`"${s.id}_2": "${sampleChoice2}"`);
            }
          });

          prompt = `Görseldeki veya PDF belgesindeki ÇOKLU DERS (deneme/branşlı) sınav optik formunu yüksek dikkatle incele.
Sınav Bilgileri:
- Sınav Adı: ${examTitle}
- Sınav Türü: Çoklu Ders / Branşlı Deneme Sınavı
- Sütun Sıralaması ve Dersler (Soldan Sağa):
${subjectsDesc}
- Toplam Soru Sayısı: ${qCount}
- Olası Seçenekler: ${letters.join(', ')}
${answerKeyPromptSection}
SINIFTAKİ KAYITLI ÖĞRENCİ LİSTESİ (İSİM VE NUMARALARI BU LİSTEYLE EŞLEŞTİR):
${studentsRosterText}

FORM DÜZENİ VE OKUMA KURALLARI (EN KRİTİK BÖLÜM):
1. ÇOKLU DERS SÜTUNLARI:
   - Sayfa üzerinde dersler soldan sağa dikey sütunlar halinde yer alır:
${examSubjects.map((s, idx) => `     * ${idx + 1}. Sütun: ${s.name} (${s.questionCount} soru, 1'den ${s.questionCount}'e kadar)`).join('\n')}
   - DİKKAT: Formun üzerindeki ders başlığı yazımında küçük farklar olsa dahi soldan sağa sütun sırasına göre ilgili derstir. Her sütundaki sorular 1'den başlar (1, 2, 3..).

2. BALONCUKLARIN SABİT YATAY SIRASI (KESİN REFERANS KURALI):
   Her soru satırında soldan sağa her zaman tam 4 adet şık çemberi bulunur:
   * 1. Çember (en soldaki ilk daire)  = 'A'
   * 2. Çember (soldan 2. daire)       = 'B'
   * 3. Çember (soldan 3. daire)       = 'C'
   * 4. Çember (en sağdaki son daire)   = 'D'

3. ⚠️ "KOMŞU BOŞ HARF YANILGISI" VE ÖRTÜLEN HARF KURALI (HAYATİ ÖNEMDE):
   - Bir öğrenci şıkkı doldurduğunda o çember kurşun kalemle kapkara olur ve İÇİNDEKİ HARF ÖRTÜLÜR / GÖRÜNMEZ HALE GELİR.
   - İşaretlenmemiş BOŞ çemberler ise BEYAZ zemin üzerinde kalır ve içlerindeki harfler (A, B, C veya D) ÇOK NET OKUNUR.
   - SAKIN DİKKATİNİ KARALANMIŞ ÇEMBERİN HEMEN YANINDAKİ OKUNABİLEN BOŞ BEYAZ HARFE VERME!
   - ÖRNEK 1: Eğer 3. çember karalanmışsa (içi kapkara) ve hemen sağındaki 4. çember bembeyaz durup içinde 'D' harfi açıkça okunuyorsa; SAKIN 'D' YAZMA! 4. çember boştur! Karalanmış olan çember 3. sıradaki çemberdir ve onun değeri KESİNLİKLE "C"dir!
   - ÖRNEK 2: Eğer 1. çember karalanmışsa (içi kapkara) ve hemen sağındaki 2. çember bembeyaz durup içinde 'B' harfi açıkça okunuyorsa; SAKIN 'B' YAZMA! 2. çember boştur! Karalanmış olan çember 1. sıradaki çemberdir ve onun değeri KESİNLİKLE "A"dır!
   - HER SORUDA DİKKATİNİ HARFE DEĞİL, SOLDAN SAĞA DOLU OLAN ÇEMBERİN SIRASINA (1., 2., 3., 4.) VER!

4. CEVAP ANAHTARI İLE DOĞRULAMA PRENSİBİ:
   - Yukarıdaki cevap anahtarı, görseldeki optik formun hangi sorusunda hangi şıkkın hedeflendiğini teyit etmen için verilmiştir.
   - ÖĞRENCİNİN CEVAPLARINI OBJEKTİF OKU:
     * Öğrenci cevap anahtarındaki doğru şıkkı karalamışsa -> O şıkkı yaz.
     * Öğrenci cevap anahtarından FARKLI bir şık karalamışsa (öğrenci yanlış yapmışsa) -> Cevap anahtarındaki harfi DEĞİL, ÖĞRENCİNİN FORM ÜZERİNDE GERÇEKTE KARALADIĞI ŞIKKI yaz (Örn: Sosyal Bilgiler 3. soruda cevap D iken öğrenci B karalamışsa, "B" yaz!).
     * Öğrenci soruyu boş bırakmışsa -> "" (boş) yaz.

5. HER SATIRDA SOLDAN SAĞA 4 ÇEMBERİ SAYARAK TESPİT ET:
   - 1. çember koyu/karalanmışsa -> "A"
   - 2. çember koyu/karalanmışsa -> "B"
   - 3. çember koyu/karalanmışsa -> "C"
   - 4. çember koyu/karalanmışsa -> "D"
   - Satırdaki 4 çemberin dördü de eşit derecede boş, el değmemiş ve beyazsa -> "" (boş)
   - Birden fazla çember karalanmışsa -> "MULTIPLE"
   - Karalanıp silinmiş/çizilmiş ve başka bir şık doldurulmuşsa en belirgin ve koyu olan geçerli şıkkı al.

6. ÖĞRENCİ BİLGİLERİ VE EŞLEŞTİRME:
   - Formun üzerindeki "Öğrenci:" ve "No:" alanlarındaki yazıyı yukarıdaki sınıf listesiyle karşılaştır.
   - "studentName" alanına listedeki tam adı yaz, "studentNo" alanına okul numarasını yaz.

7. DOĞRULAMA (BUBBLECHECK):
   - "bubbleCheck" alanında her ders için satır satır dolu çember sırasını (1., 2., 3., 4.) kısaca listele. Bu doğrulama sonrasında "answers" nesnesini doldur.

Cevabını SADECE aşağıdaki JSON formatında ver (hiçbir markdown etiketi ekleme):
{
  "cards": [
    {
      "studentName": "Öğrenci Adı Soyadı",
      "studentNo": "123",
      "bubbleCheck": "Ders bazında karalanmış çember sıraları doğrulaması (Örn: Turkce: 1=1.cember(A), 2=2.cember(B)...)",
      "answers": {
        ${exampleAnswerLines.join(',\n        ')}
      }
    }
  ]
}
`;
        } else {
          prompt = `Görseldeki veya PDF belgesindeki sınav optik formunu yüksek dikkatle incele.
Sınav Bilgileri:
- Sınav Adı: ${examTitle}
- Toplam Soru Sayısı: ${qCount}
- Olası Seçenekler: ${letters.join(', ')}
${answerKeyPromptSection}
SINIFTAKİ KAYITLI ÖĞRENCİ LİSTESİ (İSİM VE NUMARALARI BU LİSTEYLE EŞLEŞTİR):
${studentsRosterText}

FORM DÜZENİ VE OKUMA KURALLARI (EN KRİTİK BÖLÜM):
1. Belgede veya görselde 1 veya birden fazla öğrencinin optik formu bulunabilir (örneğin çok sayfalı bir PDF veya tek sayfada altlı üstlü 2 form). Algılanan BÜTÜN optik formları "cards" dizisi içine ekle. Tek form varsa 1 elemanlı dizi döndür.
2. Her bir form için:
   - "Öğrenci:" yanındaki tam isim ve soyismi ("studentName"). Yukarıdaki öğrenci listesinden eşleşen resmi adı yaz.
   - "No:" yanındaki öğrenci okul numarasını ("studentNo").

3. BALONCUKLARIN SABİT YATAY SIRASI (KESİN REFERANS KURALI):
   Her soru satırında soldan sağa her zaman tam 4 adet şık çemberi bulunur:
   * 1. Çember (en soldaki ilk daire)  = 'A'
   * 2. Çember (soldan 2. daire)       = 'B'
   * 3. Çember (soldan 3. daire)       = 'C'
   * 4. Çember (en sağdaki son daire)   = 'D'

4. ⚠️ "KOMŞU BOŞ HARF YANILGISI" VE ÖRTÜLEN HARF KURALI (HAYATİ ÖNEMDE):
   - Bir öğrenci şıkkı doldurduğunda o çember kurşun kalemle kapkara olur ve İÇİNDEKİ HARF ÖRTÜLÜR / GÖRÜNMEZ HALE GELİR.
   - İşaretlenmemiş BOŞ çemberler ise BEYAZ zemin üzerinde kalır ve içlerindeki harfler (A, B, C veya D) ÇOK NET OKUNUR.
   - SAKIN DİKKATİNİ KARALANMIŞ ÇEMBERİN HEMEN YANINDAKİ OKUNABİLEN BOŞ BEYAZ HARFE VERME!
   - ÖRNEK 1: Eğer 3. çember karalanmışsa (içi kapkara) ve hemen sağındaki 4. çember bembeyaz durup içinde 'D' harfi açıkça okunuyorsa; SAKIN 'D' YAZMA! 4. çember boştur! Karalanmış olan çember 3. sıradaki çemberdir ve onun değeri KESİNLİKLE "C"dir!
   - ÖRNEK 2: Eğer 1. çember karalanmışsa (içi kapkara) ve hemen sağındaki 2. çember bembeyaz durup içinde 'B' harfi açıkça okunuyorsa; SAKIN 'B' YAZMA! 2. çember boştur! Karalanmış olan çember 1. sıradaki çemberdir ve onun değeri KESİNLİKLE "A"dır!
   - HER SORUDA DİKKATİNİ HARFE DEĞİL, SOLDAN SAĞA DOLU OLAN ÇEMBERİN SIRASINA (1., 2., 3., 4.) VER!

5. CEVAP ANAHTARI İLE DOĞRULAMA PRENSİBİ:
   - Yukarıdaki cevap anahtarı, görseldeki optik formun hangi sorusunda hangi şıkkın hedeflendiğini teyit etmen için verilmiştir.
   - ÖĞRENCİNİN CEVAPLARINI OBJEKTİF OKU:
     * Öğrenci cevap anahtarındaki doğru şıkkı karalamışsa -> O şıkkı yaz.
     * Öğrenci cevap anahtarından FARKLI bir şık karalamışsa (öğrenci yanlış yapmışsa) -> Cevap anahtarındaki harfi DEĞİL, ÖĞRENCİNİN FORM ÜZERİNDE GERÇEKTE KARALADIĞI ŞIKKI yaz.
     * Öğrenci soruyu boş bırakmışsa -> "" (boş) yaz.

6. HER SATIRDA SOLDAN SAĞA 4 ÇEMBERİ SAYARAK TESPİT ET:
   - 1. çember koyu/karalanmışsa -> "A"
   - 2. çember koyu/karalanmışsa -> "B"
   - 3. çember koyu/karalanmışsa -> "C"
   - 4. çember koyu/karalanmışsa -> "D"
   - Satırdaki 4 çemberin dördü de eşit derecede boş, el değmemiş ve beyazsa -> "" (boş)
   - Soru hiç işaretlenmemişse veya tüm çemberler boşsa "" (boş dize) yaz.
   - Bir soruda birden fazla çember karalanmışsa "MULTIPLE" yaz.
   - Bir şık karalanıp sonra üzeri çizilmiş/silinmiş ve başka bir şık doldurulmuşsa geçerli doldurulanı al.

7. DOĞRULAMA (BUBBLECHECK):
   - "bubbleCheck" alanında satır satır dolu çember sırasını (1., 2., 3., 4.) kısaca listele. Bu doğrulama sonrasında "answers" nesnesini doldur.

Cevabını SADECE aşağıdaki JSON formatında ver (hiçbir markdown etiketi veya ek metin ekleme):
{
  "cards": [
    {
      "studentName": "Öğrenci Adı Soyadı",
      "studentNo": "123",
      "bubbleCheck": "1=1.cember(A), 2=3.cember(C)...",
      "answers": {
        "1": "A",
        "2": "C"
      }
    }
  ]
}
`;
        }

        const rawRes = await window.callGeminiAPI(prompt, {
          imageBase64: sendingData,
          imageMimeType: sendingMime,
          json: true,
          temperature: 0.0
        });

        let parsed = null;
        if (typeof rawRes === 'object' && rawRes !== null) {
          parsed = rawRes;
        } else if (typeof rawRes === 'string') {
          const cleaned = rawRes.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        }

        if (!parsed) throw new Error('Yapay zeka geçerli bir yanıt veremedi.');

        // Kartları normalize et
        let detectedCards = [];
        if (Array.isArray(parsed.cards) && parsed.cards.length > 0) {
          detectedCards = parsed.cards;
        } else if (parsed.answers) {
          detectedCards = [parsed];
        }

        appendOpticalLog(`✓ ${fileItem.name}: ${detectedCards.length} adet optik form algılandı.`);

        // Her bir kartı değerlendir
        detectedCards.forEach((card, cardIndex) => {
          console.log(`[OMR Form ${cardIndex + 1}] Yapay Zeka Okuma Verisi:`, card);
          const cardStudentNo = String(card.studentNo || '').trim();
          const cardStudentName = String(card.studentName || '').trim();

          // Gelişmiş Öğrenci Eşleme (Numara, Normalize Türkçe İsim, Token Sırası ve Fuzzy Similarity)
          const matchResult = findBestStudentMatch(cardStudentNo, cardStudentName, classStudents);
          const matched = matchResult.matched;
          const candidate = matchResult.candidate;
          const candidateScore = matchResult.candidateScore;

          // Cevapları Puanla
          const answerKey = activeExam.answerKey || {};
          const detectedAnswers = {};
          const questionDetails = [];
          let correctCount = 0;
          let wrongCount = 0;
          let blankCount = 0;
          let subjectBreakdown = null;

          const cardAnswers = card.answers || {};

          if (isMulti && examSubjects.length > 0) {
            subjectBreakdown = {};
            const penaltyRate = activeExam.wrongAffects ? (parseFloat(activeExam.penaltyRate) || 4) : 0;
            let cumulativeOffset = 0;

            examSubjects.forEach((subj, subjIdx) => {
              let subjCorrect = 0;
              let subjWrong = 0;
              let subjBlank = 0;

              for (let q = 1; q <= subj.questionCount; q++) {
                const key = `${subj.id}_${q}`;
                let rawVal = extractAnswerForSubj(cardAnswers, card, subj, subjIdx, q, cumulativeOffset);
                rawVal = String(rawVal || '').trim().toUpperCase();

                if (!letters.includes(rawVal) && rawVal !== 'MULTIPLE') {
                  rawVal = '';
                }

                const correctAns = findCorrectAnswerForKey(answerKey, subj, subjIdx, q, cumulativeOffset);
                const qd = {
                  subjId: subj.id,
                  subjName: subj.name,
                  q,
                  key,
                  marked: rawVal === 'MULTIPLE' ? '' : rawVal,
                  status: rawVal === 'MULTIPLE' ? 'multiple' : (rawVal ? 'marked' : 'blank'),
                  keyAnswer: correctAns
                };

                if (!qd.marked) {
                  blankCount++;
                  subjBlank++;
                  qd.isCorrect = false;
                  qd.isBlank = true;
                } else if (correctAns && qd.marked === correctAns) {
                  correctCount++;
                  subjCorrect++;
                  qd.isCorrect = true;
                  qd.isBlank = false;
                } else {
                  wrongCount++;
                  subjWrong++;
                  qd.isCorrect = false;
                  qd.isBlank = false;
                }

                detectedAnswers[key] = qd.marked;
                questionDetails.push(qd);
              }

              let subjNet = penaltyRate > 0 ? (subjCorrect - (subjWrong / penaltyRate)) : subjCorrect;
              subjNet = Math.max(0, parseFloat(subjNet.toFixed(2)));
              const subjScore = subj.questionCount > 0 ? parseFloat(((subjNet / subj.questionCount) * 100).toFixed(1)) : 0;

              subjectBreakdown[subj.id] = {
                id: subj.id,
                name: subj.name,
                subjectName: subj.name,
                correct: subjCorrect,
                wrong: subjWrong,
                blank: subjBlank,
                net: subjNet,
                score: subjScore,
                total: subj.questionCount
              };

              cumulativeOffset += subj.questionCount;
            });

            let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
            net = Math.max(0, parseFloat(net.toFixed(2)));
            const score = qCount > 0 ? parseFloat(((net / qCount) * 100).toFixed(1)) : 0;

            opticalScannedResults.push({
              resultId: 'omr_res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              fileName: fileItem.name,
              thumbUrl: fileItem.isPdf ? '' : fileItem.dataUrl,
              isPdf: !!fileItem.isPdf,
              pdfDataUrl: fileItem.isPdf ? fileItem.dataUrl : '',
              rawStudentName: cardStudentName,
              rawStudentNo: cardStudentNo,
              matchedStudentId: matched ? matched.id : '',
              candidateStudentId: candidate ? candidate.id : '',
              candidateStudentName: candidate ? `${candidate.name} ${candidate.surname || ''}`.trim() : '',
              candidateScore: candidateScore || 0,
              correctCount,
              wrongCount,
              blankCount,
              net,
              score,
              answers: detectedAnswers,
              subjectBreakdown,
              questionDetails
            });

            const matchedLabel = matched ? `${matched.name} ${matched.surname}` : '(Eşleşmedi)';
            appendOpticalLog(`  → Form ${cardIndex + 1}: ${cardStudentName || 'İsimsiz'} (No: ${cardStudentNo || '-'}) ➔ ${matchedLabel} | Doğru: ${correctCount}, Yanlış: ${wrongCount}, Puan: ${score}`);

          } else {
            // Tek Ders Puanlama
            for (let q = 1; q <= qCount; q++) {
              let val = cardAnswers[q] || cardAnswers[String(q)] || '';
              val = String(val).trim().toUpperCase();
              if (!letters.includes(val) && val !== 'MULTIPLE') {
                val = '';
              }

              const correctAns = String(answerKey[q] || answerKey[String(q)] || '').trim().toUpperCase();
              const qd = {
                q,
                marked: val === 'MULTIPLE' ? '' : val,
                status: val === 'MULTIPLE' ? 'multiple' : (val ? 'marked' : 'blank'),
                keyAnswer: correctAns
              };

              if (!qd.marked) {
                blankCount++;
                qd.isCorrect = false;
                qd.isBlank = true;
              } else if (correctAns && qd.marked === correctAns) {
                correctCount++;
                qd.isCorrect = true;
                qd.isBlank = false;
              } else {
                wrongCount++;
                qd.isCorrect = false;
                qd.isBlank = false;
              }

              detectedAnswers[q] = qd.marked;
              questionDetails.push(qd);
            }

            const penaltyRate = activeExam.wrongAffects ? (parseFloat(activeExam.penaltyRate) || 4) : 0;
            let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
            net = Math.max(0, parseFloat(net.toFixed(2)));
            const score = qCount > 0 ? parseFloat(((net / qCount) * 100).toFixed(1)) : 0;

            opticalScannedResults.push({
              resultId: 'omr_res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              fileName: fileItem.name,
              thumbUrl: fileItem.isPdf ? '' : fileItem.dataUrl,
              isPdf: !!fileItem.isPdf,
              pdfDataUrl: fileItem.isPdf ? fileItem.dataUrl : '',
              rawStudentName: cardStudentName,
              rawStudentNo: cardStudentNo,
              matchedStudentId: matched ? matched.id : '',
              candidateStudentId: candidate ? candidate.id : '',
              candidateStudentName: candidate ? `${candidate.name} ${candidate.surname || ''}`.trim() : '',
              candidateScore: candidateScore || 0,
              correctCount,
              wrongCount,
              blankCount,
              net,
              score,
              answers: detectedAnswers,
              questionDetails
            });

            const matchedLabel = matched ? `${matched.name} ${matched.surname}` : '(Eşleşmedi)';
            appendOpticalLog(`  → Form ${cardIndex + 1}: ${cardStudentName || 'İsimsiz'} (No: ${cardStudentNo || '-'}) ➔ ${matchedLabel} | Doğru: ${correctCount}, Yanlış: ${wrongCount}, Puan: ${score}`);
          }
        });

      } catch (err) {
        console.error('Optik Form Analiz Hatası:', err);
        appendOpticalLog(`❌ ${fileItem.name} analiz edilemedi: ${err.message || err}`);
      }
    }

    // Tamamlandı
    if (opticalProcessingProgressBar) opticalProcessingProgressBar.style.width = '100%';
    if (opticalProcessingPercentage) opticalProcessingPercentage.textContent = '100%';
    if (opticalProcessingCounter) opticalProcessingCounter.textContent = `${totalFiles} / ${totalFiles} Tamamlandı`;
    appendOpticalLog('Tüm formların incelemesi tamamlandı. Sonuçlar hazırlanıyor...');

    setTimeout(() => {
      renderOpticalEvaluationResults();
    }, 600);
  }

  // Canvas ile Görsel Boyutlandırma (Gereksiz sıkıştırmayı önler, netliği korur)
  function resizeImageForOmr(dataUrl, maxDim = 2400) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        // Görsel zaten makul boyutlardaysa tekrar sıkıştırıp kalite kaybetme
        if (w <= maxDim && h <= maxDim) {
          resolve(dataUrl);
          return;
        }
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.96));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // ==========================================================================
  // DEĞERLENDİRME SONUÇLARINI GÖSTERME VE NOTLARI AKTARMA
  // ==========================================================================
  function renderOpticalEvaluationResults() {
    opticalEvalStepUpload.style.display = 'none';
    opticalEvalStepProcessing.style.display = 'none';
    opticalEvalStepResults.style.display = 'block';

    const state = stateManager.loadState();
    const isMiddle = state.educationLevel === 'middle';
    const examBranch = activeExam.branch || '';
    const classStudents = (state.students || []).filter(s => !isMiddle || !examBranch || s.branch === examBranch);
    const sortedStudents = [...classStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    // İstatistikler ve Mükerrer Kontrolü
    const totalCount = opticalScannedResults.length;
    const studentMatchCounts = {};
    opticalScannedResults.forEach(r => {
      if (r.matchedStudentId) {
        studentMatchCounts[r.matchedStudentId] = (studentMatchCounts[r.matchedStudentId] || 0) + 1;
      }
    });
    const uniqueMatchedCount = Object.keys(studentMatchCounts).length;
    const duplicateCount = opticalScannedResults.filter(r => r.matchedStudentId && studentMatchCounts[r.matchedStudentId] > 1).length;
    const avgScore = totalCount > 0 ? (opticalScannedResults.reduce((sum, r) => sum + r.score, 0) / totalCount).toFixed(1) : 0;

    if (opticalResStatTotal) opticalResStatTotal.textContent = totalCount;
    if (opticalResStatMatched) {
      if (duplicateCount > 0) {
        opticalResStatMatched.innerHTML = `${uniqueMatchedCount} Tekil <small style="font-size: 0.72rem; color: #d97706; font-weight: 700;">(${duplicateCount} Mükerrer)</small>`;
      } else {
        opticalResStatMatched.textContent = `${uniqueMatchedCount} / ${totalCount}`;
      }
    }
    if (opticalResStatAvg) opticalResStatAvg.textContent = `${avgScore} Puan`;

    if (!opticalEvalResultsContainer) return;
    opticalEvalResultsContainer.innerHTML = '';

    if (totalCount === 0) {
      opticalEvalResultsContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Hiçbir optik form okunamadı. Lütfen fotoğrafların net ve aydınlık olduğundan emin olup tekrar deneyin.
        </div>
      `;
      return;
    }

    // Mükerrer form uyarısı bildirim kutusu
    if (duplicateCount > 0) {
      const banner = document.createElement('div');
      banner.style.cssText = 'background: rgba(245, 158, 11, 0.12); border: 1.5px solid #f59e0b; border-radius: var(--radius-md); padding: 0.65rem 1rem; margin-bottom: 0.85rem; font-size: 0.82rem; color: #92400e; display: flex; align-items: center; gap: 8px;';
      banner.innerHTML = `
        <span style="font-size: 1.25rem; line-height: 1;">⚠️</span>
        <div>
          <strong>Mükerrer Form Okuması Algılandı:</strong> Bazı öğrenciler için birden fazla optik form taranmış (${duplicateCount} form). İstemediğiniz formu sağdaki <strong>"× Çıkar"</strong> butonuyla silebilirsiniz. Kaydederken sistem her öğrenci için otomatik olarak en yüksek puanlı okumayı seçecektir.
        </div>
      `;
      opticalEvalResultsContainer.appendChild(banner);
    }

    opticalScannedResults.forEach((res, index) => {
      const isDuplicate = res.matchedStudentId && studentMatchCounts[res.matchedStudentId] > 1;
      const card = document.createElement('div');
      card.className = `optical-eval-card ${!res.matchedStudentId ? 'unmatched' : ''} ${isDuplicate ? 'duplicate-match' : ''}`;
      if (isDuplicate) {
        card.style.borderColor = '#f59e0b';
        card.style.boxShadow = '0 0 0 1px rgba(245, 158, 11, 0.3)';
      }

      // Öğrenci Seçenekleri
      let optionsHtml = `<option value="">-- Öğrenci Seçilmedi --</option>`;
      sortedStudents.forEach(st => {
        const isSelected = String(st.id) === String(res.matchedStudentId);
        optionsHtml += `<option value="${st.id}" ${isSelected ? 'selected' : ''}>${st.number} - ${st.name} ${st.surname}</option>`;
      });

      let matchBadge = res.matchedStudentId
        ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; font-size: 0.75rem;">✓ Eşleşti</span>`
        : `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #b45309; font-size: 0.75rem;">⚠️ Eşleşmedi (Lütfen Seçin)</span>`;

      if (isDuplicate) {
        matchBadge += ` <span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #b45309; font-size: 0.75rem; font-weight: 700;" title="Bu öğrenci birden fazla optik formda eşleşti">⚠️ Mükerrer Okuma</span>`;
      }

      let quickMatchHtml = '';
      if (!res.matchedStudentId && res.candidateStudentId) {
        quickMatchHtml = `
          <button type="button" class="btn btn-sm res-quick-match-btn" data-candidate-id="${res.candidateStudentId}" style="font-size: 0.73rem; padding: 3px 8px; height: auto; border: 1px dashed #6366f1; background: rgba(99, 102, 241, 0.1); color: #4f46e5; cursor: pointer; border-radius: 4px; font-weight: 600;" title="Önerilen öğrenciyi bu forma bağlamak için tıklayın">
            💡 Öneri: <strong>${res.candidateStudentName}</strong> (${res.candidateScore > 0 ? '%' + res.candidateScore : 'Eşleştir'}) Bağla
          </button>
        `;
      }

      // Şıklar HTML'i
      let answersHtml = '';
      if (res.subjectBreakdown) {
        const subjectsMap = {};
        res.questionDetails.forEach((qd, qdIdx) => {
          const sName = qd.subjName || 'Ders';
          if (!subjectsMap[sName]) subjectsMap[sName] = [];
          subjectsMap[sName].push({ qd, qdIdx });
        });

        for (const sName in subjectsMap) {
          answersHtml += `<div style="width: 100%; font-size: 0.74rem; font-weight: 800; color: #4f46e5; margin-top: 6px; border-bottom: 1px dashed var(--border-color); padding-bottom: 2px;">📚 ${sName}</div>`;
          subjectsMap[sName].forEach(({ qd, qdIdx }) => {
            let chipClass = 'blank';
            let icon = '⚪';
            let detailText = qd.keyAnswer ? `(D:${qd.keyAnswer})` : '';

            if (qd.isCorrect) {
              chipClass = 'correct';
              icon = '✓';
              detailText = '';
            } else if (!qd.isBlank) {
              chipClass = 'wrong';
              icon = '✗';
            }

            answersHtml += `
              <div class="optical-answer-chip ${chipClass} opt-clickable-chip" 
                   data-res-index="${index}" 
                   data-qd-idx="${qdIdx}" 
                   title="${sName} Soru ${qd.q}: İşaretlenen '${qd.marked || 'Boş'}' - Doğru '${qd.keyAnswer || '-'}'. (Tıklayarak şıkkı değiştirin)">
                <span>S${qd.q}:</span>
                <strong>${qd.marked || '-'}</strong>
                <small>${icon}</small>
                ${detailText ? `<span style="font-size: 0.65rem; opacity: 0.85;">${detailText}</span>` : ''}
              </div>
            `;
          });
        }
      } else {
        res.questionDetails.forEach((qd, qdIdx) => {
          let chipClass = 'blank';
          let icon = '⚪';
          let detailText = qd.keyAnswer ? `(D:${qd.keyAnswer})` : '';

          if (qd.isCorrect) {
            chipClass = 'correct';
            icon = '✓';
            detailText = '';
          } else if (!qd.isBlank) {
            chipClass = 'wrong';
            icon = '✗';
          }

          answersHtml += `
            <div class="optical-answer-chip ${chipClass} opt-clickable-chip" 
                 data-res-index="${index}" 
                 data-qd-idx="${qdIdx}" 
                 title="Soru ${qd.q}: İşaretlenen '${qd.marked || 'Boş'}' - Doğru '${qd.keyAnswer || '-'}'. (Tıklayarak şıkkı değiştirin)">
              <span>S${qd.q}:</span>
              <strong>${qd.marked || '-'}</strong>
              <small>${icon}</small>
              ${detailText ? `<span style="font-size: 0.65rem; opacity: 0.85;">${detailText}</span>` : ''}
            </div>
          `;
        });
      }

      let breakdownHtml = '';
      if (res.subjectBreakdown) {
        const items = Object.values(res.subjectBreakdown).map(sb => `
          <span style="font-size: 0.72rem; background: var(--bg-primary); padding: 2px 7px; border-radius: 4px; border: 1px solid var(--border-color); color: var(--text-primary);">
            <strong>${sb.name || sb.subjectName}:</strong> ${sb.correct}D ${sb.wrong}Y <span style="color: #4f46e5; font-weight: 700;">(${sb.net} Net)</span>
          </span>
        `).join('');
        breakdownHtml = `<div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 5px;">${items}</div>`;
      }

      const thumbHtml = res.thumbUrl
        ? `<img src="${res.thumbUrl}" alt="Kağıt" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color); cursor: pointer;" class="res-thumb-img" title="Büyütmek için tıklayın">`
        : `<div class="res-thumb-pdf" title="PDF Belgesini Aç"><i data-lucide="file-text" style="width: 18px; height: 18px;"></i><span>PDF</span></div>`;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 260px;">
            ${thumbHtml}
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
                <label style="font-weight: 700; font-size: 0.82rem; margin: 0; color: var(--text-primary);">Öğrenci:</label>
                <select class="form-control form-control-sm res-student-select" style="font-size: 0.82rem; height: 30px; padding: 2px 8px; flex: 1; min-width: 170px;">
                  ${optionsHtml}
                </select>
                ${matchBadge}
                ${quickMatchHtml}
              </div>
              <div style="font-size: 0.73rem; color: var(--text-muted);">
                📄 Dosya: <code>${res.fileName}</code> • AI Okudu: "<strong>${res.rawStudentName || 'Belirsiz'}</strong>" (No: ${res.rawStudentNo || '-'})
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm res-delete-btn" style="color: var(--danger); font-size: 0.75rem; padding: 0.25rem 0.5rem; height: auto;" title="Bu formu değerlendirmeden çıkar">&times; Çıkar</button>
        </div>

        <!-- Puan ve Net Rozetleri -->
        <div style="display: flex; flex-direction: column; gap: 4px; background: var(--bg-secondary); padding: 0.5rem 0.75rem; border-radius: 6px;">
          <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
            <span style="font-size: 0.8rem; font-weight: 700; color: #10b981;">✓ ${res.correctCount} Doğru</span>
            <span style="font-size: 0.8rem; font-weight: 700; color: #ef4444;">✗ ${res.wrongCount} Yanlış</span>
            <span style="font-size: 0.8rem; font-weight: 600; color: #64748b;">⚪ ${res.blankCount} Boş</span>
            <span style="font-size: 0.8rem; font-weight: 700; color: #4f46e5;">📊 Toplam ${res.net} Net</span>
            <div style="margin-left: auto; font-size: 0.95rem; font-weight: 800; color: #7c3aed; background: rgba(124, 58, 237, 0.1); padding: 0.2rem 0.6rem; border-radius: 4px;">
              🎯 ${res.score} Puan
            </div>
          </div>
          ${breakdownHtml}
        </div>

        <!-- Şık Detayları Butonu & Konteyneri -->
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <button type="button" class="btn btn-secondary btn-sm res-toggle-answers-btn" style="font-size: 0.72rem; padding: 0.2rem 0.5rem; height: auto;">
              <span>Şıkları İncele</span>
            </button>
            <span style="font-size: 0.7rem; color: var(--text-muted); font-style: italic;">(Şıkları değiştirmek için üzerlerine tıklayabilirsiniz)</span>
          </div>
          <div class="res-answers-box" style="display: ${allOpticalDetailsVisible ? 'flex' : 'none'}; flex-wrap: wrap; gap: 4px; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--border-color);">
            ${answersHtml}
          </div>
        </div>
      `;

      // Hızlı eşleştirme önerisi dinleyicisi
      const qmBtn = card.querySelector('.res-quick-match-btn');
      if (qmBtn) {
        qmBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const candId = qmBtn.getAttribute('data-candidate-id');
          if (candId) {
            res.matchedStudentId = candId;
            renderOpticalEvaluationResults();
          }
        });
      }

      // Tıklanabilir şıklar ile manuel düzeltme dinleyicisi
      card.querySelectorAll('.opt-clickable-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const qdIdx = parseInt(chip.getAttribute('data-qd-idx'), 10);
          const qd = res.questionDetails[qdIdx];
          if (!qd) return;

          const cCount = parseInt(activeExam.choicesCount, 10) || 4;
          const choiceCycle = [...['A', 'B', 'C', 'D', 'E'].slice(0, cCount), ''];
          const curIndex = choiceCycle.indexOf(qd.marked || '');
          const nextIndex = (curIndex + 1) % choiceCycle.length;
          qd.marked = choiceCycle[nextIndex];
          qd.status = qd.marked ? 'marked' : 'blank';

          recalculateResultCard(res);
          renderOpticalEvaluationResults();
        });
      });

      // Öğrenci değiştirme dinleyicisi
      const sel = card.querySelector('.res-student-select');
      sel.addEventListener('change', (e) => {
        res.matchedStudentId = e.target.value;
        renderOpticalEvaluationResults();
      });

      // Görsel / PDF büyütme
      const thumbEl = card.querySelector('.res-thumb-img, .res-thumb-pdf');
      if (thumbEl) {
        thumbEl.addEventListener('click', () => {
          openOpticalImagePreview(res.thumbUrl || res.pdfDataUrl, res.isPdf, res.rawStudentName || res.fileName);
        });
      }

      // Çıkar butonu
      card.querySelector('.res-delete-btn').addEventListener('click', () => {
        opticalScannedResults.splice(index, 1);
        renderOpticalEvaluationResults();
      });

      // Şıkları aç/kapat
      const toggleBtn = card.querySelector('.res-toggle-answers-btn');
      const box = card.querySelector('.res-answers-box');
      toggleBtn.addEventListener('click', () => {
        const isHidden = box.style.display === 'none';
        box.style.display = isHidden ? 'flex' : 'none';
        toggleBtn.querySelector('span').textContent = isHidden ? 'Şıkları Gizle' : 'Şıkları İncele';
      });

      opticalEvalResultsContainer.appendChild(card);
    });

    if (window.safeCreateIcons) window.safeCreateIcons();
    else if (window.lucide) window.lucide.createIcons();
  }

  // Tüm Şıkları Göster / Gizle Butonu
  if (btnToggleAllOpticalAnswers) {
    btnToggleAllOpticalAnswers.addEventListener('click', () => {
      allOpticalDetailsVisible = !allOpticalDetailsVisible;
      document.querySelectorAll('.res-answers-box').forEach(b => {
        b.style.display = allOpticalDetailsVisible ? 'flex' : 'none';
      });
      document.querySelectorAll('.res-toggle-answers-btn span').forEach(s => {
        s.textContent = allOpticalDetailsVisible ? 'Şıkları Gizle' : 'Şıkları İncele';
      });
    });
  }

  // Geri Dön / Yeni Dosya Ekle
  if (btnOpticalBackToUpload) {
    btnOpticalBackToUpload.addEventListener('click', () => {
      opticalEvalStepUpload.style.display = 'block';
      opticalEvalStepProcessing.style.display = 'none';
      opticalEvalStepResults.style.display = 'none';
    });
  }

  // ==========================================================================
  // NOTLARI SINAV TABLOSUNA AKTAR VE KAYDET
  // ==========================================================================
  if (btnCommitOpticalResults) {
    btnCommitOpticalResults.addEventListener('click', () => {
      commitOpticalResultsToExam();
    });
  }

  async function commitOpticalResultsToExam() {
    try {
      if (!activeExam || opticalScannedResults.length === 0) return;

      // Eşleşmeyen öğrenci kontrolü
      const unmatched = opticalScannedResults.filter(r => !r.matchedStudentId);
      if (unmatched.length > 0) {
        const proceed = await window.showConfirmDialog({
          title: 'Eşleşmeyen Optik Formlar Var',
          message: `⚠️ <strong>${unmatched.length} adet optik form</strong> için öğrenci eşleştirmesi yapılmamış.<br><br>Eşleşmeyen formlar atlanacak, eşleşen öğrencilerin notları aktarılacaktır. Devam etmek istiyor musunuz?`,
          confirmText: 'Devam Et',
          cancelText: 'Formları Kontrol Et',
          type: 'warning'
        });
        if (!proceed) return;
      }

      // Mükerrer okuma tespiti ve tekilleştirme (aynı öğrenci birden fazla taranmışsa)
      const studentMap = new Map();
      const duplicateStudents = new Set();
      opticalScannedResults.forEach(res => {
        if (!res.matchedStudentId) return;
        if (studentMap.has(res.matchedStudentId)) {
          duplicateStudents.add(res.matchedStudentId);
          // Birden fazla okuma varsa, daha yüksek puanlı olanı veya en son okunanı seç
          const prevRes = studentMap.get(res.matchedStudentId);
          if ((res.score || 0) >= (prevRes.score || 0)) {
            studentMap.set(res.matchedStudentId, res);
          }
        } else {
          studentMap.set(res.matchedStudentId, res);
        }
      });

      if (duplicateStudents.size > 0) {
        const proceedDup = await window.showConfirmDialog({
          title: 'Mükerrer Öğrenci Formları',
          message: `⚠️ <strong>${duplicateStudents.size} öğrenci</strong> için birden fazla optik form okuması bulundu.<br><br>Sistem her öğrenci için otomatik olarak en yüksek puanlı okumayı aktaracaktır.<br><small style="color:var(--text-muted);">(İstemediğiniz formu listeden '× Çıkar' butonu ile silebilirsiniz).</small>`,
          confirmText: 'En Yüksekleri Aktar',
          cancelText: 'Listeyi İncele',
          type: 'warning'
        });
        if (!proceedDup) return;
      }

      // 1. Mevcut sınavı state'ten taze oku (kesinlikle eski kayıtlar kaybolmasın, akıllı birleştirme)
      const state = stateManager.loadState();
      const savedExam = (state.weeklyEvaluations || []).find(e => e && e.id === activeExam.id) || activeExam;

      const mergedScores = { ...(savedExam.examScores || {}), ...(activeExam.examScores || {}) };
      const mergedResults = { ...(savedExam.studentResults || {}), ...(activeExam.studentResults || {}) };

      let newlyAddedStudents = 0;
      let overwrittenStudents = 0;

      studentMap.forEach((res, studentId) => {
        const isAlreadyPresent = mergedResults[studentId] && mergedResults[studentId].score !== undefined && mergedResults[studentId].score !== '';
        if (isAlreadyPresent) {
          overwrittenStudents++;
        } else {
          newlyAddedStudents++;
        }

        mergedScores[studentId] = res.score;
        mergedResults[studentId] = {
          ...(mergedResults[studentId] || {}),
          correct: res.correctCount,
          wrong: res.wrongCount,
          blank: res.blankCount,
          net: res.net,
          score: res.score,
          answers: { ...res.answers },
          subjectBreakdown: res.subjectBreakdown || null,
          thumbUrl: res.thumbUrl || (mergedResults[studentId] && mergedResults[studentId].thumbUrl) || '',
          pdfDataUrl: res.pdfDataUrl || (mergedResults[studentId] && mergedResults[studentId].pdfDataUrl) || '',
          isPdf: !!res.isPdf,
          fileName: res.fileName || '',
          rawStudentName: res.rawStudentName || '',
          rawStudentNo: res.rawStudentNo || '',
          source: 'ai_optical_upload',
          scannedAt: new Date().toISOString()
        };
      });

      activeExam.examScores = mergedScores;
      activeExam.studentResults = mergedResults;
      activeExam.updatedAt = new Date().toISOString();
      stateManager.saveExam(activeExam);

      // Modalı kapat
      if (modalUploadOpticalEval) modalUploadOpticalEval.classList.remove('active');

      // Tabloyu ve listeyi güvenli şekilde güncelle
      try {
        renderExamsList();
        openActiveExam(activeExam);
      } catch (renderErr) {
        console.error('Sınav tablosu güncellenirken hata:', renderErr);
      }

      const totalExamStudents = Object.keys(mergedScores).length;
      if (toastCallback) {
        if (overwrittenStudents > 0) {
          toastCallback(`🎉 ${newlyAddedStudents} yeni öğrenci eklendi, ${overwrittenStudents} kayıtlı öğrenci güncellendi! (Sınavda toplam ${totalExamStudents} öğrenci kayıtlı)`, 'success');
        } else {
          toastCallback(`🎉 ${newlyAddedStudents} öğrencinin sınav notları başarıyla eklendi! (Sınavda toplam ${totalExamStudents} öğrenci kayıtlı)`, 'success');
        }
      }

      const event = new CustomEvent('stateChanged');
      document.dispatchEvent(event);
    } catch (err) {
      console.error('commitOpticalResultsToExam hatası:', err);
      if (toastCallback) {
        toastCallback(`Notlar aktarılırken bir hata oluştu: ${err.message || err}`, 'error');
      }
    }
  }

  // ==========================================================================
  // KAYITLI SINAV CEVAP ANAHTARINI DÜZENLEME VE YENİDEN HESAPLAMA
  // ==========================================================================

  if (btnEditActiveExamKey) {
    btnEditActiveExamKey.addEventListener('click', () => {
      openDesktopAnswerKeyModal();
    });
  }

  function openDesktopAnswerKeyModal() {
    if (!activeExam) {
      if (toastCallback) toastCallback('Lütfen önce bir sınav seçin!', 'warning');
      return;
    }

    if (!modalEditExamAnswerKey) return;

    editAnswerKeyTemp = { ...(activeExam.answerKey || {}) };
    editAnswerKeyChoices = parseInt(activeExam.choicesCount, 10) || 4;

    if (desktopAkSubtitle) {
      const qCount = activeExam.totalQuestions || 20;
      const bText = activeExam.branch ? ` • Şube: <strong>${activeExam.branch}</strong>` : '';
      desktopAkSubtitle.innerHTML = `Sınav: <strong>${activeExam.examName}</strong> • Soru Sayısı: <strong>${qCount}</strong>${bText}`;
    }

    // Şık butonlarını güncelle
    document.querySelectorAll('.desktop-ak-choice-pill').forEach(pill => {
      const c = parseInt(pill.getAttribute('data-choices'), 10);
      if (c === editAnswerKeyChoices) pill.classList.add('active');
      else pill.classList.remove('active');
    });

    // Çoklu ders sekmesi aktif dersini ayarla
    activeEditKeySubjId = (activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects[0]) ? activeExam.subjects[0].id : '';

    // Yeniden puanlama kutusunu göster/gizle
    const hasResults = activeExam.studentResults && Object.keys(activeExam.studentResults).length > 0;
    if (desktopAkRescoreContainer) {
      desktopAkRescoreContainer.style.display = hasResults ? 'block' : 'none';
      if (desktopAkRescoreCheckbox) desktopAkRescoreCheckbox.checked = true;
    }

    renderDesktopAnswerKeyModalGrid();
    modalEditExamAnswerKey.classList.add('active');
    if (window.safeCreateIcons) window.safeCreateIcons();
  }
  window.openDesktopAnswerKeyModal = openDesktopAnswerKeyModal;

  window.selectEditExamSubjTab = (subjId) => {
    activeEditKeySubjId = subjId;
    renderDesktopAnswerKeyModalGrid();
  };

  // Modalı Kapatma
  if (btnCloseEditAnswerKeyModal) {
    btnCloseEditAnswerKeyModal.addEventListener('click', () => {
      if (modalEditExamAnswerKey) modalEditExamAnswerKey.classList.remove('active');
    });
  }
  if (btnCancelEditAnswerKey) {
    btnCancelEditAnswerKey.addEventListener('click', () => {
      if (modalEditExamAnswerKey) modalEditExamAnswerKey.classList.remove('active');
    });
  }

  // Şık Sayısı Seçimi (3, 4, 5 Şık)
  document.querySelectorAll('.desktop-ak-choice-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const count = parseInt(pill.getAttribute('data-choices'), 10) || 4;
      editAnswerKeyChoices = count;
      document.querySelectorAll('.desktop-ak-choice-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      // Geçersiz şıkları temizle (örn. 5'ten 4'e geçildiğinde 'E' şıkkını kaldır)
      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, editAnswerKeyChoices);
      Object.keys(editAnswerKeyTemp).forEach(q => {
        if (!letters.includes(editAnswerKeyTemp[q])) {
          delete editAnswerKeyTemp[q];
        }
      });

      renderDesktopAnswerKeyModalGrid();
    });
  });

  // Soru Izgarasını Çiz
  function renderDesktopAnswerKeyModalGrid() {
    if (!desktopAkQuestionsGrid || !activeExam) return;
    desktopAkQuestionsGrid.innerHTML = '';

    const isMulti = activeExam && !!activeExam.isMultiSubject;
    const subjects = activeExam && Array.isArray(activeExam.subjects) ? activeExam.subjects : [];
    const subjectsTabsEl = document.getElementById('desktop-ak-subjects-tabs');

    if (isMulti && subjects.length > 0) {
      if (subjectsTabsEl) {
        subjectsTabsEl.style.display = 'flex';
        activeEditKeySubjId = activeEditKeySubjId || subjects[0].id;

        subjectsTabsEl.innerHTML = subjects.map(s => {
          const marked = Object.keys(editAnswerKeyTemp).filter(k => k.startsWith(s.id + '_') && editAnswerKeyTemp[k]).length;
          const isActive = s.id === activeEditKeySubjId;
          return `
            <button type="button" class="desktop-ak-subj-tab ${isActive ? 'active' : ''}" onclick="window.selectEditExamSubjTab('${s.id}')">
              <span>${s.name}</span>
              <span class="badge">${marked}/${s.questionCount}</span>
            </button>
          `;
        }).join('');
      }

      const currentSubj = subjects.find(s => s.id === activeEditKeySubjId) || subjects[0];
      const subjQCount = currentSubj.questionCount || 10;
      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, editAnswerKeyChoices);

      for (let q = 1; q <= subjQCount; q++) {
        const key = `${currentSubj.id}_${q}`;
        const selected = editAnswerKeyTemp[key] || '';
        const row = document.createElement('div');
        row.style.cssText = 'background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 6px; display: flex; align-items: center; justify-content: space-between; gap: 4px;';

        const qNum = document.createElement('span');
        qNum.textContent = `${q}.`;
        qNum.style.cssText = 'font-weight: 700; font-size: 0.76rem; min-width: 20px; color: var(--text-muted); text-align: right;';
        row.appendChild(qNum);

        const optsContainer = document.createElement('div');
        optsContainer.style.cssText = 'display: flex; gap: 3px; align-items: center; flex: 1; justify-content: center;';

        letters.forEach(letter => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = letter;
          btn.className = `optical-key-pill-btn ${selected === letter ? 'active' : ''}`;
          btn.style.cssText = 'width: 24px; height: 24px; font-size: 0.72rem; border-radius: 4px;';
          btn.addEventListener('click', () => {
            if (editAnswerKeyTemp[key] === letter) {
              delete editAnswerKeyTemp[key];
            } else {
              editAnswerKeyTemp[key] = letter;
            }
            renderDesktopAnswerKeyModalGrid();
          });
          optsContainer.appendChild(btn);
        });
        row.appendChild(optsContainer);

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.innerHTML = '&times;';
        clearBtn.title = 'Boş Bırak';
        clearBtn.style.cssText = `border: none; background: none; font-size: 14px; line-height: 1; color: var(--text-muted); cursor: pointer; padding: 0 2px; visibility: ${selected ? 'visible' : 'hidden'};`;
        clearBtn.addEventListener('click', () => {
          delete editAnswerKeyTemp[key];
          renderDesktopAnswerKeyModalGrid();
        });
        row.appendChild(clearBtn);

        desktopAkQuestionsGrid.appendChild(row);
      }

    } else {
      if (subjectsTabsEl) subjectsTabsEl.style.display = 'none';

      const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, editAnswerKeyChoices);

      for (let q = 1; q <= qCount; q++) {
        const selected = editAnswerKeyTemp[q] || '';
        const row = document.createElement('div');
        row.style.cssText = 'background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 6px; display: flex; align-items: center; justify-content: space-between; gap: 4px;';

        const qNum = document.createElement('span');
        qNum.textContent = `${q}.`;
        qNum.style.cssText = 'font-weight: 700; font-size: 0.76rem; min-width: 20px; color: var(--text-muted); text-align: right;';
        row.appendChild(qNum);

        const optsContainer = document.createElement('div');
        optsContainer.style.cssText = 'display: flex; gap: 3px; align-items: center; flex: 1; justify-content: center;';

        letters.forEach(letter => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = letter;
          btn.className = `optical-key-pill-btn ${selected === letter ? 'active' : ''}`;
          btn.style.cssText = 'width: 24px; height: 24px; font-size: 0.72rem; border-radius: 4px;';
          btn.addEventListener('click', () => {
            if (editAnswerKeyTemp[q] === letter) {
              delete editAnswerKeyTemp[q];
            } else {
              editAnswerKeyTemp[q] = letter;
            }
            renderDesktopAnswerKeyModalGrid();
          });
          optsContainer.appendChild(btn);
        });
        row.appendChild(optsContainer);

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.innerHTML = '&times;';
        clearBtn.title = 'Boş Bırak';
        clearBtn.style.cssText = `border: none; background: none; font-size: 14px; line-height: 1; color: var(--text-muted); cursor: pointer; padding: 0 2px; visibility: ${selected ? 'visible' : 'hidden'};`;
        clearBtn.addEventListener('click', () => {
          delete editAnswerKeyTemp[q];
          renderDesktopAnswerKeyModalGrid();
        });
        row.appendChild(clearBtn);

        desktopAkQuestionsGrid.appendChild(row);
      }
    }

    updateDesktopAkCounter();
  }

  function updateDesktopAkCounter() {
    if (!desktopAkCounterBadge || !activeExam) return;
    const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
    const filled = Object.keys(editAnswerKeyTemp).filter(k => editAnswerKeyTemp[k]).length;

    desktopAkCounterBadge.textContent = `${filled} / ${qCount} Soru Tanımlandı`;
    if (filled === qCount) {
      desktopAkCounterBadge.style.background = 'rgba(16, 185, 129, 0.12)';
      desktopAkCounterBadge.style.color = '#059669';
    } else {
      desktopAkCounterBadge.style.background = 'rgba(79, 70, 229, 0.1)';
      desktopAkCounterBadge.style.color = '#4f46e5';
    }
  }

  // Örnek Doldur
  if (btnDesktopAkFillSample) {
    btnDesktopAkFillSample.addEventListener('click', () => {
      if (!activeExam) return;
      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, editAnswerKeyChoices);
      if (activeExam.isMultiSubject && Array.isArray(activeExam.subjects)) {
        activeExam.subjects.forEach(s => {
          for (let q = 1; q <= s.questionCount; q++) {
            editAnswerKeyTemp[`${s.id}_${q}`] = letters[(q - 1) % letters.length];
          }
        });
      } else {
        const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
        for (let q = 1; q <= qCount; q++) {
          editAnswerKeyTemp[q] = letters[(q - 1) % letters.length];
        }
      }
      renderDesktopAnswerKeyModalGrid();
    });
  }

  // Tümünü Temizle
  if (btnDesktopAkClearAll) {
    btnDesktopAkClearAll.addEventListener('click', async () => {
      const confirmed = await window.showConfirmDialog({
        title: 'Cevap Anahtarını Temizle',
        message: 'Tüm cevap anahtarını temizlemek istediğinize emin misiniz?',
        confirmText: 'Temizle',
        cancelText: 'Vazgeç',
        type: 'danger'
      });
      if (!confirmed) return;
      editAnswerKeyTemp = {};
      renderDesktopAnswerKeyModalGrid();
    });
  }

  // Cevap Anahtarını Kaydet ve Gerekiyorsa Öğrenci Notlarını Yeniden Hesapla
  if (btnSaveEditAnswerKey) {
    btnSaveEditAnswerKey.addEventListener('click', () => {
      if (!activeExam) return;

      activeExam.answerKey = { ...editAnswerKeyTemp };
      activeExam.choicesCount = editAnswerKeyChoices;
      activeExam.hasOpticalForm = true;
      activeExam.updatedAt = new Date().toISOString();

      // Otomatik yeniden puanlama
      let rescoredCount = 0;
      const shouldRescore = desktopAkRescoreCheckbox && desktopAkRescoreCheckbox.checked && activeExam.studentResults;
      if (shouldRescore) {
        const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
        const penaltyRate = activeExam.wrongAffects ? (parseFloat(activeExam.penaltyRate) || 4) : 0;
        const isMulti = activeExam.isMultiSubject && Array.isArray(activeExam.subjects);

        Object.keys(activeExam.studentResults).forEach(studentId => {
          const res = activeExam.studentResults[studentId];
          if (res && res.answers) {
            let correctCount = 0;
            let wrongCount = 0;
            let blankCount = 0;

            if (isMulti) {
              const subjectBreakdown = {};
              let cumulativeOffset = 0;
              activeExam.subjects.forEach((subj, subjIdx) => {
                let subjCorrect = 0;
                let subjWrong = 0;
                let subjBlank = 0;

                for (let q = 1; q <= subj.questionCount; q++) {
                  const key = `${subj.id}_${q}`;
                  let ans = extractAnswerForSubj(res.answers, null, subj, subjIdx, q, cumulativeOffset);
                  ans = String(ans || '').trim().toUpperCase();
                  if (ans === 'MULTIPLE') ans = '';

                  const correctAns = findCorrectAnswerForKey(activeExam.answerKey, subj, subjIdx, q, cumulativeOffset);

                  if (!ans) {
                    blankCount++;
                    subjBlank++;
                  } else if (correctAns && ans === correctAns) {
                    correctCount++;
                    subjCorrect++;
                  } else {
                    wrongCount++;
                    subjWrong++;
                  }
                  res.answers[key] = ans;
                }

                let subjNet = penaltyRate > 0 ? (subjCorrect - (subjWrong / penaltyRate)) : subjCorrect;
                subjNet = Math.max(0, parseFloat(subjNet.toFixed(2)));
                const subjScore = subj.questionCount > 0 ? parseFloat(((subjNet / subj.questionCount) * 100).toFixed(1)) : 0;

                subjectBreakdown[subj.id] = {
                  id: subj.id,
                  name: subj.name,
                  subjectName: subj.name,
                  correct: subjCorrect,
                  wrong: subjWrong,
                  blank: subjBlank,
                  net: subjNet,
                  score: subjScore,
                  total: subj.questionCount
                };
                cumulativeOffset += subj.questionCount;
              });

              let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
              net = Math.max(0, parseFloat(net.toFixed(2)));
              const score = qCount > 0 ? parseFloat(((net / qCount) * 100).toFixed(1)) : 0;

              res.correct = correctCount;
              res.wrong = wrongCount;
              res.blank = blankCount;
              res.net = net;
              res.score = score;
              res.subjectBreakdown = subjectBreakdown;

            } else {
              for (let q = 1; q <= qCount; q++) {
                const ans = String(res.answers[q] || res.answers[String(q)] || '').trim().toUpperCase();
                const correctAns = String(activeExam.answerKey[q] || activeExam.answerKey[String(q)] || '').trim().toUpperCase();

                if (!ans) {
                  blankCount++;
                } else if (correctAns && ans === correctAns) {
                  correctCount++;
                } else {
                  wrongCount++;
                }
              }

              let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
              net = Math.max(0, parseFloat(net.toFixed(2)));
              const score = qCount > 0 ? parseFloat(((net / qCount) * 100).toFixed(1)) : 0;

              res.correct = correctCount;
              res.wrong = wrongCount;
              res.blank = blankCount;
              res.net = net;
              res.score = score;
            }

            if (!activeExam.examScores) activeExam.examScores = {};
            activeExam.examScores[studentId] = res.score;
            rescoredCount++;
          }
        });
      }

      stateManager.saveExam(activeExam);

      if (modalEditExamAnswerKey) modalEditExamAnswerKey.classList.remove('active');

      renderExamsList();
      openActiveExam(activeExam);

      if (toastCallback) {
        if (rescoredCount > 0) {
          toastCallback(`✅ Cevap anahtarı güncellendi ve ${rescoredCount} öğrencinin notları otomatik olarak yeniden hesaplandı!`, 'success');
        } else {
          toastCallback('✅ Cevap anahtarı başarıyla güncellendi.', 'success');
        }
      }

      const event = new CustomEvent('stateChanged');
      document.dispatchEvent(event);
    });
  }

  // ==========================================================================
  // ÖĞRENCİ OPTİK FORM İNCELEME VE DÜZENLEME MODALI
  // ==========================================================================
  function openStudentOpticalEditModal(studentId) {
    if (!activeExam) return;
    const state = stateManager.loadState();
    const student = (state.students || []).find(s => String(s.id) === String(studentId));
    if (!student) {
      if (toastCallback) toastCallback('Öğrenci bulunamadı!', 'error');
      return;
    }

    activeOpticalStudentId = studentId;
    const res = (activeExam.studentResults && activeExam.studentResults[studentId]) || {};
    activeOpticalStudentAnswers = { ...(res.answers || {}) };

    const isMulti = activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0;
    activeOpticalStudentSubjTab = isMulti ? 'ALL' : '';

    if (stuOptModalSubtitle) {
      const bText = student.branch ? ` • Şube: <strong>${student.branch}</strong>` : '';
      stuOptModalSubtitle.innerHTML = `Öğrenci: <strong>${student.name} ${student.surname}</strong> (No: <strong>${student.number || '-'}</strong>)${bText} • Sınav: <strong>${activeExam.examName}</strong>`;
    }

    // Taranan kağıt görseli kontrolü
    if (btnStuOptViewPaper) {
      const paperUrl = res.thumbUrl || res.pdfDataUrl;
      if (paperUrl) {
        btnStuOptViewPaper.style.display = 'inline-flex';
        btnStuOptViewPaper.onclick = () => {
          openOpticalImagePreview(paperUrl, res.isPdf, `${student.name} ${student.surname}`);
        };
      } else {
        btnStuOptViewPaper.style.display = 'none';
        btnStuOptViewPaper.onclick = null;
      }
    }

    renderStudentOpticalSubjectTabs();
    renderStudentOpticalModalGrid();
    updateStudentOpticalModalStats();

    const hasSavedAnswers = res.answers && Object.keys(res.answers).length > 0;
    if (btnDeleteStudentOptical) {
      btnDeleteStudentOptical.style.display = hasSavedAnswers ? 'inline-flex' : 'none';
    }

    if (modalStudentOpticalEdit) {
      modalStudentOpticalEdit.classList.add('active');
    }
    if (window.safeCreateIcons) window.safeCreateIcons();
  }
  window.openStudentOpticalEditModal = openStudentOpticalEditModal;

  function renderStudentOpticalSubjectTabs() {
    if (!stuOptSubjectTabs || !activeExam) return;
    const isMulti = activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0;

    if (!isMulti) {
      stuOptSubjectTabs.style.display = 'none';
      return;
    }

    stuOptSubjectTabs.style.display = 'flex';
    const subjects = activeExam.subjects;
    let html = `
      <button type="button" class="stu-opt-subj-tab ${activeOpticalStudentSubjTab === 'ALL' ? 'active' : ''}" onclick="window.selectStuOptSubjTab('ALL')">
        <span>Tüm Dersler</span>
        <span class="badge" style="background: rgba(0,0,0,0.1); font-size: 0.7rem; padding: 1px 5px; border-radius: 4px;">${activeExam.totalQuestions}</span>
      </button>
    `;

    subjects.forEach(subj => {
      const isActive = activeOpticalStudentSubjTab === subj.id;
      html += `
        <button type="button" class="stu-opt-subj-tab ${isActive ? 'active' : ''}" onclick="window.selectStuOptSubjTab('${subj.id}')">
          <span>${subj.name}</span>
          <span class="badge" style="background: rgba(0,0,0,0.1); font-size: 0.7rem; padding: 1px 5px; border-radius: 4px;">${subj.questionCount}</span>
        </button>
      `;
    });

    stuOptSubjectTabs.innerHTML = html;
  }

  window.selectStuOptSubjTab = (subjId) => {
    activeOpticalStudentSubjTab = subjId;
    renderStudentOpticalSubjectTabs();
    renderStudentOpticalModalGrid();
  };

  function renderStudentOpticalModalGrid() {
    if (!stuOptQuestionsContainer || !activeExam) return;
    stuOptQuestionsContainer.innerHTML = '';

    const isMulti = activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0;
    const answerKey = activeExam.answerKey || {};
    const choicesCount = parseInt(activeExam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);

    if (isMulti) {
      const subjectsToRender = activeOpticalStudentSubjTab === 'ALL'
        ? activeExam.subjects
        : activeExam.subjects.filter(s => s.id === activeOpticalStudentSubjTab);

      let cumulativeOffset = 0;
      activeExam.subjects.forEach((subj, sIdx) => {
        const isCurrentSubj = subjectsToRender.some(s => s.id === subj.id);
        if (isCurrentSubj) {
          if (activeOpticalStudentSubjTab === 'ALL') {
            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = 'grid-column: 1 / -1; font-weight: 800; font-size: 0.84rem; color: #4f46e5; border-bottom: 2px solid rgba(79, 70, 229, 0.2); padding-bottom: 4px; margin-top: 8px; display: flex; align-items: center; justify-content: space-between;';
            headerDiv.innerHTML = `
              <span>📚 ${subj.name} (${subj.questionCount} Soru)</span>
            `;
            stuOptQuestionsContainer.appendChild(headerDiv);
          }

          for (let q = 1; q <= subj.questionCount; q++) {
            const key = `${subj.id}_${q}`;
            let currentVal = extractAnswerForSubj(activeOpticalStudentAnswers, null, subj, sIdx, q, cumulativeOffset);
            currentVal = String(currentVal || '').trim().toUpperCase();
            if (currentVal === 'MULTIPLE') currentVal = '';

            const correctAns = findCorrectAnswerForKey(answerKey, subj, sIdx, q, cumulativeOffset);

            const row = createStudentQuestionRow(q, key, currentVal, correctAns, letters, subj.name);
            stuOptQuestionsContainer.appendChild(row);
          }
        }
        cumulativeOffset += subj.questionCount;
      });
    } else {
      const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
      for (let q = 1; q <= qCount; q++) {
        const key = String(q);
        const currentVal = String(activeOpticalStudentAnswers[q] || activeOpticalStudentAnswers[String(q)] || '').trim().toUpperCase();
        const correctAns = String(answerKey[q] || answerKey[String(q)] || '').trim().toUpperCase();

        const row = createStudentQuestionRow(q, key, currentVal, correctAns, letters, activeExam.subject || 'Ders');
        stuOptQuestionsContainer.appendChild(row);
      }
    }
  }

  function createStudentQuestionRow(q, key, currentVal, correctAns, letters, subjName) {
    const row = document.createElement('div');
    row.className = 'stu-opt-question-row';

    // Sol taraf: Soru no ve Cevap Anahtarı
    const leftBox = document.createElement('div');
    leftBox.style.cssText = 'display: flex; align-items: center; gap: 6px; min-width: 65px;';

    const qNum = document.createElement('span');
    qNum.style.cssText = 'font-weight: 700; font-size: 0.8rem; min-width: 20px; color: var(--text-muted); text-align: right;';
    qNum.textContent = `${q}.`;
    leftBox.appendChild(qNum);

    if (correctAns) {
      const keyBadge = document.createElement('span');
      keyBadge.style.cssText = 'font-size: 0.68rem; font-weight: 700; background: rgba(16, 185, 129, 0.12); color: #059669; padding: 1px 5px; border-radius: 4px;';
      keyBadge.title = `${subjName} Soru ${q} Cevap Anahtarı: ${correctAns}`;
      keyBadge.textContent = `D:${correctAns}`;
      leftBox.appendChild(keyBadge);
    }
    row.appendChild(leftBox);

    // Orta taraf: Şık Butonları
    const choicesBox = document.createElement('div');
    choicesBox.style.cssText = 'display: flex; gap: 4px; align-items: center; justify-content: center; flex: 1;';

    letters.forEach(letter => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = letter;
      btn.className = 'stu-opt-choice-btn';

      if (currentVal === letter) {
        if (correctAns && currentVal === correctAns) {
          btn.classList.add('selected-correct');
          btn.title = `İşaretlenen: ${letter} (Doğru ✓)`;
        } else if (correctAns) {
          btn.classList.add('selected-wrong');
          btn.title = `İşaretlenen: ${letter} (Yanlış ✗ - Doğru: ${correctAns})`;
        } else {
          btn.classList.add('selected-correct');
          btn.title = `İşaretlenen: ${letter}`;
        }
      }

      btn.addEventListener('click', () => {
        if (currentVal === letter) {
          delete activeOpticalStudentAnswers[key];
        } else {
          activeOpticalStudentAnswers[key] = letter;
        }
        renderStudentOpticalModalGrid();
        updateStudentOpticalModalStats();
      });

      choicesBox.appendChild(btn);
    });
    row.appendChild(choicesBox);

    // Sağ taraf: Boş Butonu
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.innerHTML = '&times;';
    clearBtn.className = 'stu-opt-clear-btn';
    clearBtn.title = 'Bu Soruyu Boş Bırak';
    clearBtn.style.visibility = currentVal ? 'visible' : 'hidden';
    clearBtn.addEventListener('click', () => {
      delete activeOpticalStudentAnswers[key];
      renderStudentOpticalModalGrid();
      updateStudentOpticalModalStats();
    });
    row.appendChild(clearBtn);

    return row;
  }

  function updateStudentOpticalModalStats() {
    if (!activeExam) return;
    const isMulti = activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0;
    const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
    const penaltyRate = activeExam.wrongAffects ? (parseFloat(activeExam.penaltyRate) || 4) : 0;
    const answerKey = activeExam.answerKey || {};

    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;

    if (isMulti) {
      let cumulativeOffset = 0;
      activeExam.subjects.forEach((subj, sIdx) => {
        for (let q = 1; q <= subj.questionCount; q++) {
          let ans = extractAnswerForSubj(activeOpticalStudentAnswers, null, subj, sIdx, q, cumulativeOffset);
          ans = String(ans || '').trim().toUpperCase();
          if (ans === 'MULTIPLE') ans = '';

          const correctAns = findCorrectAnswerForKey(answerKey, subj, sIdx, q, cumulativeOffset);

          if (!ans) {
            blankCount++;
          } else if (correctAns && ans === correctAns) {
            correctCount++;
          } else {
            wrongCount++;
          }
        }
        cumulativeOffset += subj.questionCount;
      });
    } else {
      for (let q = 1; q <= qCount; q++) {
        const ans = String(activeOpticalStudentAnswers[q] || activeOpticalStudentAnswers[String(q)] || '').trim().toUpperCase();
        const correctAns = String(answerKey[q] || answerKey[String(q)] || '').trim().toUpperCase();

        if (!ans) {
          blankCount++;
        } else if (correctAns && ans === correctAns) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    }

    let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
    net = Math.max(0, parseFloat(net.toFixed(2)));
    const score = qCount > 0 ? parseFloat(((net / qCount) * 100).toFixed(1)) : 0;

    if (stuOptStatCorrect) stuOptStatCorrect.textContent = correctCount;
    if (stuOptStatWrong) stuOptStatWrong.textContent = wrongCount;
    if (stuOptStatBlank) stuOptStatBlank.textContent = blankCount;
    if (stuOptStatNet) stuOptStatNet.textContent = net;
    if (stuOptStatScore) stuOptStatScore.textContent = score;
  }

  function saveStudentOpticalChanges() {
    if (!activeExam || !activeOpticalStudentId) return;

    const isMulti = activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0;
    const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
    const penaltyRate = activeExam.wrongAffects ? (parseFloat(activeExam.penaltyRate) || 4) : 0;
    const answerKey = activeExam.answerKey || {};

    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;
    let subjectBreakdown = null;

    if (isMulti) {
      subjectBreakdown = {};
      let cumulativeOffset = 0;
      activeExam.subjects.forEach((subj, sIdx) => {
        let subjCorrect = 0;
        let subjWrong = 0;
        let subjBlank = 0;

        for (let q = 1; q <= subj.questionCount; q++) {
          const key = `${subj.id}_${q}`;
          let ans = extractAnswerForSubj(activeOpticalStudentAnswers, null, subj, sIdx, q, cumulativeOffset);
          ans = String(ans || '').trim().toUpperCase();
          if (ans === 'MULTIPLE') ans = '';

          const correctAns = findCorrectAnswerForKey(answerKey, subj, sIdx, q, cumulativeOffset);

          if (!ans) {
            blankCount++;
            subjBlank++;
          } else if (correctAns && ans === correctAns) {
            correctCount++;
            subjCorrect++;
          } else {
            wrongCount++;
            subjWrong++;
          }
          activeOpticalStudentAnswers[key] = ans;
        }

        let subjNet = penaltyRate > 0 ? (subjCorrect - (subjWrong / penaltyRate)) : subjCorrect;
        subjNet = Math.max(0, parseFloat(subjNet.toFixed(2)));
        const subjScore = subj.questionCount > 0 ? parseFloat(((subjNet / subj.questionCount) * 100).toFixed(1)) : 0;

        subjectBreakdown[subj.id] = {
          id: subj.id,
          name: subj.name,
          subjectName: subj.name,
          correct: subjCorrect,
          wrong: subjWrong,
          blank: subjBlank,
          net: subjNet,
          score: subjScore,
          total: subj.questionCount
        };

        cumulativeOffset += subj.questionCount;
      });
    } else {
      for (let q = 1; q <= qCount; q++) {
        const ans = String(activeOpticalStudentAnswers[q] || activeOpticalStudentAnswers[String(q)] || '').trim().toUpperCase();
        const correctAns = String(answerKey[q] || answerKey[String(q)] || '').trim().toUpperCase();

        if (!ans) {
          blankCount++;
        } else if (correctAns && ans === correctAns) {
          correctCount++;
        } else {
          wrongCount++;
        }
        activeOpticalStudentAnswers[q] = ans;
      }
    }

    let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
    net = Math.max(0, parseFloat(net.toFixed(2)));
    const score = qCount > 0 ? parseFloat(((net / qCount) * 100).toFixed(1)) : 0;

    if (!activeExam.studentResults) activeExam.studentResults = {};
    if (!activeExam.examScores) activeExam.examScores = {};

    const existingRes = activeExam.studentResults[activeOpticalStudentId] || {};
    activeExam.studentResults[activeOpticalStudentId] = {
      ...existingRes,
      correct: correctCount,
      wrong: wrongCount,
      blank: blankCount,
      net,
      score,
      answers: { ...activeOpticalStudentAnswers },
      subjectBreakdown: subjectBreakdown || existingRes.subjectBreakdown || null,
      updatedAt: new Date().toISOString()
    };

    activeExam.examScores[activeOpticalStudentId] = score;
    activeExam.updatedAt = new Date().toISOString();

    stateManager.saveExam(activeExam);

    if (modalStudentOpticalEdit) {
      modalStudentOpticalEdit.classList.remove('active');
    }

    renderActiveExamTable();
    renderExamsList();

    const state = stateManager.loadState();
    const student = (state.students || []).find(s => String(s.id) === String(activeOpticalStudentId));
    const studentLabel = student ? `${student.name} ${student.surname}` : 'Öğrencinin';

    if (toastCallback) {
      toastCallback(`✓ ${studentLabel} optik form işaretlemeleri ve puanı (${score} Puan) başarıyla güncellendi!`, 'success');
    }

    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);
  }

  // Modal buton dinleyicileri
  if (btnCloseStudentOpticalModal) {
    btnCloseStudentOpticalModal.addEventListener('click', () => {
      if (modalStudentOpticalEdit) modalStudentOpticalEdit.classList.remove('active');
    });
  }
  if (btnCancelStudentOptical) {
    btnCancelStudentOptical.addEventListener('click', () => {
      if (modalStudentOpticalEdit) modalStudentOpticalEdit.classList.remove('active');
    });
  }
  if (btnStuOptClearAll) {
    btnStuOptClearAll.addEventListener('click', async () => {
      const confirmed = await window.showConfirmDialog({
        title: 'İşaretlemeleri Boşalt',
        message: 'Bu öğrenciye ait tüm soru işaretlemelerini temizlemek istediğinize emin misiniz?<br><small style="color:var(--text-muted);">Değişikliklerin geçerli ve kalıcı olması için ardından "Değişiklikleri Kaydet" butonuna basmanız gerekmektedir.</small>',
        confirmText: 'Tümünü Boşalt',
        cancelText: 'Vazgeç',
        type: 'danger'
      });
      if (!confirmed) return;

      activeOpticalStudentAnswers = {};
      renderStudentOpticalModalGrid();
      updateStudentOpticalModalStats();
      if (toastCallback) toastCallback('Tüm işaretlemeler temizlendi. Kaydetmek için butona basabilirsiniz.', 'info');
    });
  }
  if (btnSaveStudentOptical) {
    btnSaveStudentOptical.addEventListener('click', () => {
      saveStudentOpticalChanges();
    });
  }

  if (btnDeleteStudentOptical) {
    btnDeleteStudentOptical.addEventListener('click', async () => {
      if (!activeExam || !activeOpticalStudentId) return;
      const state = stateManager.loadState();
      const student = (state.students || []).find(s => String(s.id) === String(activeOpticalStudentId));
      const sName = student ? `${student.name} ${student.surname || ''}`.trim() : 'Öğrencinin';

      const confirmed = await window.showConfirmDialog({
        title: 'Optik Form Kaydını Sil',
        message: `<strong>${sName}</strong> isimli öğrencinin taranmış optik form kaydını ve sınav sonucunu tamamen silmek istediğinize emin misiniz?<br><br>Bu işlemden sonra optik form silinecek, öğrencinin sınav notu sıfırlanacak ve ana tabloda elle değer girmeye açık hale gelecektir.`,
        confirmText: 'Evet, Optiği Sil',
        cancelText: 'Vazgeç',
        type: 'danger'
      });
      if (!confirmed) return;

      if (activeExam.studentResults) delete activeExam.studentResults[activeOpticalStudentId];
      if (activeExam.examScores) delete activeExam.examScores[activeOpticalStudentId];
      activeExam.updatedAt = new Date().toISOString();
      stateManager.saveExam(activeExam);

      if (modalStudentOpticalEdit) modalStudentOpticalEdit.classList.remove('active');
      renderActiveExamTable();
      renderExamsList();

      if (toastCallback) {
        toastCallback(`✓ ${sName} optik form kaydı silindi ve elle not girişine açıldı.`, 'success');
      }

      const event = new CustomEvent('stateChanged');
      document.dispatchEvent(event);
    });
  }

  function populateOpticalStudentsList() {
    try {
      if (!opticalStudentsList) return;
      opticalStudentsList.innerHTML = '';
      
      const state = stateManager.loadState();
      const isMiddle = state.educationLevel === 'middle';
      const examBranch = activeExam ? activeExam.branch : '';

      const activeStudents = (state.students || []).filter(student => {
        if (!student) return false;
        return !isMiddle || !examBranch || student.branch === examBranch;
      });

      if (activeStudents.length === 0) {
        opticalStudentsList.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">Kayıtlı öğrenci bulunmuyor.</div>';
        if (opticalSelectedCount) opticalSelectedCount.textContent = '0 öğrenci seçildi';
        return;
      }
      
      const sortedStudents = [...activeStudents].sort((a, b) => {
        const nameA = String(a?.name || '').trim();
        const nameB = String(b?.name || '').trim();
        return nameA.localeCompare(nameB, 'tr');
      });
      
      sortedStudents.forEach(student => {
        const item = document.createElement('label');
        item.className = 'optical-student-checkbox-item';
        item.innerHTML = `
          <input type="checkbox" value="${student.id}" checked>
          <span>${student.number || ''} - ${student.name || ''} ${student.surname || ''}</span>
        `;
        
        const cb = item.querySelector('input');
        if (cb) {
          cb.addEventListener('change', updateOpticalSelectedCount);
          cb.addEventListener('change', updateOpticalLivePreview);
        }
        opticalStudentsList.appendChild(item);
      });
      
      updateOpticalSelectedCount();
    } catch (err) {
      console.error('populateOpticalStudentsList hatası:', err);
    }
  }

  function updateOpticalSelectedCount() {
    if (!opticalSelectedCount || !opticalStudentsList) return;
    const total = opticalStudentsList.querySelectorAll('input[type="checkbox"]').length;
    const checked = opticalStudentsList.querySelectorAll('input[type="checkbox"]:checked').length;
    
    if (checked === total) {
      opticalSelectedCount.textContent = 'Tümü Seçildi';
    } else {
      opticalSelectedCount.textContent = `${checked} / ${total} Öğrenci Seçildi`;
    }
  }

  // Tekil Optik Kart HTML Şablonu (QR Kodsuz, Yapay Zeka & CamScanner İçin Optimize)
  function generateSingleDesktopOpticalCardHTML(options) {
    const {
      examName = 'Haftalık Değerlendirme',
      studentName = '................................',
      studentNo = '......',
      totalQuestions = 20,
      letters = ['A', 'B', 'C', 'D'],
      perPage = 2,
      isMultiSubject = false,
      subjects = []
    } = options;

    if (isMultiSubject && Array.isArray(subjects) && subjects.length > 0) {
      // ÇOKLU DERS OPTİK KARTI (A4 Sığdırma Garantili & Her Derste 1'den Başlayan Numaralandırma)
      const cols = Math.min(6, Math.max(2, subjects.length));
      const maxSubjQ = Math.max(...subjects.map(s => s.questionCount || 0));
      const isCompact = maxSubjQ > 20 || totalQuestions > 40;

      let subjectsHtml = '';
      subjects.forEach(subj => {
        let rowsHtml = '';
        const count = subj.questionCount || 10;
        for (let q = 1; q <= count; q++) {
          rowsHtml += `
            <div class="omr-q-row" data-subj="${subj.id}" data-q="${q}">
              <span class="omr-q-num">${q}</span>
              <div class="omr-q-bubbles">
                ${letters.map(l => `<span class="omr-bubble" data-opt="${l}">${l}</span>`).join('')}
              </div>
            </div>
          `;
        }

        subjectsHtml += `
          <div class="omr-subject-block">
            <div class="omr-subject-header">
              <span class="omr-subject-name" title="${subj.name}">${subj.name}</span>
              <span class="omr-subject-badge">${count} Soru</span>
            </div>
            <div class="omr-subject-rows">
              ${rowsHtml}
            </div>
          </div>
        `;
      });

      return `
        <div class="omr-card omr-multi ${isCompact ? 'compact-rows' : ''}">
          <!-- 4 Köşe Referans Çapası (CamScanner & Tarayıcı Uyumlu) -->
          <div class="omr-anchor omr-anchor-tl"></div>
          <div class="omr-anchor omr-anchor-tr"></div>
          <div class="omr-anchor omr-anchor-bl"></div>
          <div class="omr-anchor omr-anchor-br"></div>

          <!-- Üst Başlık & Öğrenci Bilgileri -->
          <div class="omr-card-header">
            <div class="omr-header-main">
              <div class="omr-header-title">
                ${examName}
                <small style="font-size: 0.68rem; font-weight: 700; opacity: 0.85; margin-left: 6px;">(${subjects.map(s => s.name).join(' • ')})</small>
              </div>
              <div class="omr-student-info">
                <div><strong>Öğrenci:</strong> ${studentName}</div>
                <div><strong>No:</strong> ${studentNo}</div>
              </div>
            </div>
          </div>

          <!-- Çoklu Ders Şıkları Gövdesi -->
          <div class="omr-card-body" style="padding: 2px 0;">
            <div class="omr-multi-subjects-grid cols-${cols}">
              ${subjectsHtml}
            </div>
          </div>

          <!-- Alt Bilgi / Uyarı -->
          <div class="omr-card-footer">
            <span>* Her ders için 1'den başlayan soruları kurşun kalemle doldurunuz.</span>
            <span>SINIF ASİSTANI</span>
          </div>
        </div>
      `;
    }

    // TEK DERS OPTİK KARTI (Mevcut Mantık)
    const cols = totalQuestions <= 15 ? 1 : (totalQuestions <= 30 ? 2 : 3);
    const questionsPerCol = Math.ceil(totalQuestions / cols);

    let columnsHtml = '';
    for (let c = 0; c < cols; c++) {
      const startQ = c * questionsPerCol + 1;
      const endQ = Math.min((c + 1) * questionsPerCol, totalQuestions);

      let colRows = '';
      for (let q = startQ; q <= endQ; q++) {
        colRows += `
          <div class="omr-q-row" data-q="${q}">
            <span class="omr-q-num">${q}</span>
            <div class="omr-q-bubbles">
              ${letters.map(l => `<span class="omr-bubble" data-opt="${l}">${l}</span>`).join('')}
            </div>
          </div>
        `;
      }

      columnsHtml += `
        <div class="omr-grid-col col-${c}">
          ${colRows}
        </div>
      `;
    }

    return `
      <div class="omr-card">
        <!-- 4 Köşe Referans Çapası (CamScanner & Tarayıcı Uyumlu) -->
        <div class="omr-anchor omr-anchor-tl"></div>
        <div class="omr-anchor omr-anchor-tr"></div>
        <div class="omr-anchor omr-anchor-bl"></div>
        <div class="omr-anchor omr-anchor-br"></div>

        <!-- Üst Başlık & Öğrenci Bilgileri (Yapay Zeka Okuması İçin Açık Metin - QR KODSUZ) -->
        <div class="omr-card-header">
          <div class="omr-header-main">
            <div class="omr-header-title">${examName}</div>
            <div class="omr-student-info">
              <div><strong>Öğrenci:</strong> ${studentName}</div>
              <div><strong>No:</strong> ${studentNo}</div>
            </div>
          </div>
        </div>

        <!-- Optik Form Şıkları -->
        <div class="omr-card-body">
          <div class="omr-grid-container cols-${cols}">
            ${columnsHtml}
          </div>
        </div>

        <!-- Alt Bilgi / Uyarı -->
        <div class="omr-card-footer">
          <span>* Doğru seçeneği taşırmadan, koyu kurşun kalemle doldurunuz.</span>
          <span>SINIF ASİSTANI</span>
        </div>
      </div>
    `;
  }

  function updateOpticalLivePreview() {
    try {
      const previewContainer = document.getElementById('optical-live-preview');
      if (!previewContainer) return;
      previewContainer.innerHTML = '';

      const questionCountInput = document.getElementById('optical-questions-input');
      const choicesCountInput = document.getElementById('optical-choices-input');
      const typeInput = document.getElementById('optical-type-input');
      const perPageInput = document.getElementById('optical-per-page-input');

      const questionCount = parseInt(questionCountInput?.value || (activeExam?.totalQuestions || 20), 10) || 20;
      const choicesCount = parseInt(choicesCountInput?.value || (activeExam?.choicesCount || 4), 10) || 4;
      const formType = typeInput ? typeInput.value : 'named';
      const perPage = parseInt(perPageInput ? perPageInput.value : '2', 10) || 2;

      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
      const state = stateManager.loadState();
      const examName = activeExam ? (activeExam.examName || 'Haftalık Değerlendirme') : 'Haftalık Değerlendirme';
      const isMultiSubject = activeExam ? !!activeExam.isMultiSubject : false;
      const subjects = (activeExam && Array.isArray(activeExam.subjects)) ? activeExam.subjects : [];

      let previewStudents = [];
      if (formType === 'named') {
        let checkedStudentIds = [];
        if (opticalStudentsList) {
          opticalStudentsList.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            checkedStudentIds.push(cb.value);
          });
        }
        if (checkedStudentIds.length === 0) {
          checkedStudentIds = (state.students || []).slice(0, perPage).map(s => s.id);
        }
        previewStudents = checkedStudentIds.map(id => {
          const s = (state.students || []).find(st => st && String(st.id) === String(id));
          return s ? { name: `${s.name || ''} ${s.surname || ''}`.trim(), number: s.number || '' } : { name: 'Örnek Öğrenci', number: '123' };
        });
        if (previewStudents.length === 0) {
          previewStudents = [{ name: 'Ahmet YILMAZ', number: '105' }, { name: 'Ayşe DEMİR', number: '108' }];
        }
      } else {
        for (let i = 0; i < perPage; i++) {
          previewStudents.push({ name: '................................', number: '......' });
        }
      }

      const cardsToShow = previewStudents.slice(0, perPage);
      let cardsHtml = '';
      cardsToShow.forEach(st => {
        cardsHtml += generateSingleDesktopOpticalCardHTML({
          examName,
          studentName: st.name,
          studentNo: st.number,
          totalQuestions: questionCount,
          letters,
          perPage,
          isMultiSubject,
          subjects
        });
      });

      previewContainer.innerHTML = `
        <div class="omr-preview-sheet omr-per-page-${perPage}">
          ${cardsHtml}
        </div>
      `;
    } catch (err) {
      console.error('updateOpticalLivePreview hatası:', err);
    }
  }

  function generateOpticalFormsHTML(studentIds, questionCount, choicesCount, formType = 'named', perPage = 2) {
    const printContainer = document.getElementById('optical-forms-print-container');
    if (!printContainer) return;
    printContainer.innerHTML = '';
    
    const state = stateManager.loadState();
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
    const examName = activeExam ? (activeExam.examName || 'Haftalık Değerlendirme') : 'Haftalık Değerlendirme';
    const isMultiSubject = activeExam ? !!activeExam.isMultiSubject : false;
    const subjects = activeExam && activeExam.subjects ? activeExam.subjects : [];

    let studentsList = [];
    if (formType === 'named') {
      studentIds.forEach(id => {
        const s = (state.students || []).find(st => st.id === id);
        if (s) {
          studentsList.push({ name: `${s.name} ${s.surname || ''}`.trim(), number: s.number || '' });
        }
      });
      if (studentsList.length === 0) {
        const count = perPage === 4 ? 32 : (perPage === 2 ? 30 : 20);
        for (let i = 1; i <= count; i++) {
          studentsList.push({ name: '................................', number: '......' });
        }
      }
    } else {
      // Boş formlar: Sayfaları tam dolduracak miktarda oluştur
      const count = perPage === 4 ? 32 : (perPage === 2 ? 30 : 20);
      for (let i = 1; i <= count; i++) {
        studentsList.push({ name: '................................', number: '......' });
      }
    }

    let pagesHtml = '';
    for (let p = 0; p < studentsList.length; p += perPage) {
      const pageStudents = studentsList.slice(p, p + perPage);
      let pageCardsHtml = '';

      pageStudents.forEach(st => {
        pageCardsHtml += generateSingleDesktopOpticalCardHTML({
          examName,
          studentName: st.name,
          studentNo: st.number,
          totalQuestions: questionCount,
          letters,
          perPage,
          isMultiSubject,
          subjects
        });
      });

      pagesHtml += `<div class="omr-print-page omr-per-page-${perPage}">${pageCardsHtml}</div>`;
    }

    printContainer.innerHTML = pagesHtml;
  }

  // Başlangıç listesini yükle
  renderExamsList();
}

function renderExamsList() {
  let state = stateManager.loadState();
  const examsList = document.getElementById('weekly-exams-list');
  const emptyState = document.getElementById('weekly-exams-empty-state');
  
  if (!examsList) return;
  examsList.innerHTML = '';

  // id'si olan sınavları al (yeni format) ve oluşturulma tarihine göre azalan sırada sırala
  let exams = (state.weeklyEvaluations || []).filter(e => e && e.id);

  if (exams.length === 0 && state.students && state.students.length > 0) {
    const dummyExam = {
      id: 'exam_dummy',
      weekId: stateManager.getSelectedWeek(),
      examName: 'Deneme Sınavı 1',
      totalQuestions: 20,
      duration: 40,
      wrongAffects: false,
      penaltyRate: 0,
      examScores: {},
      studentResults: {},
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    stateManager.saveExam(dummyExam);
    state = stateManager.loadState();
    exams = (state.weeklyEvaluations || []).filter(e => e && e.id);
  }

  exams.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (exams.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  } else {
    if (emptyState) emptyState.style.display = 'none';
  }

  exams.forEach(exam => {
    // Sınav ortalama puanı ve ilk 3 öğrencisini hesapla
    const scores = [];
    for (const stdId in exam.examScores) {
      const score = exam.examScores[stdId];
      if (score !== undefined && score !== null && score !== '') {
        scores.push({ studentId: stdId, score: parseFloat(score) });
      }
    }

    const avgScore = scores.length > 0
      ? (scores.reduce((sum, item) => sum + item.score, 0) / scores.length).toFixed(1)
      : '0';

    scores.sort((a, b) => b.score - a.score);
    const topThree = scores.slice(0, 3);
    
    let topStudentsHTML = '<div class="exam-card-topstudents" style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">';
    if (topThree.length === 0) {
      topStudentsHTML += '<span style="color: var(--text-muted); font-size: 0.75rem;">Henüz puan girişi yapılmamış.</span>';
    } else {
      topThree.forEach((item, index) => {
        const student = (state.students || []).find(s => s && s.id === item.studentId);
        const sSurname = (student && student.surname) ? String(student.surname) : '';
        const name = student ? `${student.name || ''} ${sSurname ? sSurname[0] + '.' : ''}`.trim() : 'Öğrenci';
        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        topStudentsHTML += `
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 500; margin-bottom: 0.15rem;">
            <span style="color: var(--text-secondary);">${medal} ${name}</span>
            <strong style="color: var(--text-primary);">${item.score} Puan</strong>
          </div>
        `;
      });
    }
    topStudentsHTML += '</div>';

    const formattedWeek = window.formatWeekTR ? window.formatWeekTR(exam.weekId, 'full') : (exam.weekId || '');
    const penaltyText = exam.wrongAffects ? `${exam.penaltyRate} Yanlış 1 Doğruyu Götürür` : 'Yanlışlar Doğruları Etkilemez';
    const opticalBadge = exam.hasOpticalForm ? `<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary); font-size: 0.72rem; padding: 0.1rem 0.35rem; font-weight: 700;">📝 ${exam.choicesCount || 4} Şıklı Optik</span>` : '';
    const multiBadge = exam.isMultiSubject && exam.subjects ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; font-size: 0.72rem; padding: 0.1rem 0.35rem; font-weight: 700;">📚 ${exam.subjects.length} Ders</span>` : '';

    const card = document.createElement('div');
    card.className = `exam-card ${activeExam && activeExam.id === exam.id ? 'active-card' : ''}`;
    card.innerHTML = `
      <div class="exam-card-title">
        <span style="font-weight: 700; color: var(--text-primary);">${exam.examName || 'Sınav'}${exam.branch ? ` <span class="badge" style="background: rgba(255, 255, 255, 0.1); color: var(--text-primary); font-size: 0.7rem; padding: 0.1rem 0.3rem; margin-left: 0.25rem;">${exam.branch}</span>` : ''}</span>
        <span class="exam-card-average" title="Sınıf Ortalaması" style="font-size: 0.8rem; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 0.15rem;">
          <i data-lucide="trending-up" style="width: 14px; height: 14px;"></i> Ort: ${avgScore}
        </span>
      </div>
      <div class="exam-card-meta">
        <span>${formattedWeek}</span>
        <span>•</span>
        <span>${exam.totalQuestions} Soru</span>
        <span>•</span>
        <span>${exam.duration} Dk</span>
        ${multiBadge ? `<span>•</span>${multiBadge}` : ''}
        ${opticalBadge ? `<span>•</span>${opticalBadge}` : ''}
        <span>•</span>
        <span style="font-size: 0.7rem; opacity: 0.85;">${penaltyText}</span>
      </div>
      ${topStudentsHTML}
    `;

    card.addEventListener('click', () => {
      openActiveExam(exam);
    });

    examsList.appendChild(card);
  });

  if (window.safeCreateIcons) window.safeCreateIcons();
  else if (window.lucide) window.lucide.createIcons();
}

function openActiveExam(exam) {
  try {
    if (!exam) return;
    activeExam = exam;
    window.activeWeeklyExam = exam;

    if (activeExamCard) activeExamCard.style.display = 'block';
    if (btnPrintReport) btnPrintReport.style.display = 'inline-flex';

    if (activeExamTitle) activeExamTitle.textContent = exam.examName || 'Sınav';

    const formattedWeek = window.formatWeekTR ? window.formatWeekTR(exam.weekId, 'full') : (exam.weekId || '');
    const keyCount = Object.keys(exam.answerKey || {}).filter(k => exam.answerKey[k]).length;
    const opticalBadge = exam.hasOpticalForm ? `<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary); font-weight: 700; cursor: pointer;" title="Cevap anahtarını düzenlemek için tıklayın" onclick="window.openDesktopAnswerKeyModal ? window.openDesktopAnswerKeyModal() : null">📝 ${exam.choicesCount || 4} Şıklı Optik Form (${keyCount}/${exam.totalQuestions || 0} Cevap 🔑)</span>` : '';
    const multiSubjBadge = exam.isMultiSubject && exam.subjects ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; font-weight: 700;" title="${exam.subjects.map(s => `${s.name}: ${s.questionCount} Soru`).join(' • ')}">📚 Çoklu Ders (${exam.subjects.length} Branş - ${exam.totalQuestions} Soru)</span>` : '';
    const penaltyText = exam.wrongAffects ? `${exam.penaltyRate} Yanlış 1 Doğruyu Götürür` : 'Yanlışlar Doğruları Etkilemez';

    if (activeExamInfoBar) {
      activeExamInfoBar.innerHTML = `
        <span><strong>Hafta:</strong> ${formattedWeek}</span>
        <span>•</span>
        <span><strong>Soru Sayısı:</strong> ${exam.totalQuestions || 0}</span>
        <span>•</span>
        <span><strong>Süre:</strong> ${exam.duration || 0} Dk</span>
        ${multiSubjBadge ? `<span>•</span>${multiSubjBadge}` : ''}
        ${opticalBadge ? `<span>•</span>${opticalBadge}` : ''}
        <span>•</span>
        <span><strong>Değerlendirme:</strong> ${penaltyText}</span>
        ${exam.branch ? `<span>•</span><span><strong>Şube:</strong> <span class="badge" style="background: rgba(255, 255, 255, 0.1); color: var(--text-primary);">${exam.branch}</span></span>` : ''}
      `;
    }

    if (activeExamNotes) activeExamNotes.value = exam.notes || '';

    // Tabloyu çiz
    renderActiveExamTable();

    // Liste kartlarında seçili olanı güncellemek için
    document.querySelectorAll('.exam-card').forEach(card => {
      card.classList.remove('active-card');
    });
    // Yeniden çizim yapmadan DOM'dan ekleme
    const examsListEl = document.getElementById('weekly-exams-list');
    if (examsListEl) {
      const listItems = examsListEl.querySelectorAll('.exam-card');
      const state = stateManager.loadState();
      const exams = (state.weeklyEvaluations || []).filter(e => e && e.id);
      exams.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const activeIdx = exams.findIndex(e => e.id === exam.id);
      if (activeIdx !== -1 && listItems[activeIdx]) {
        listItems[activeIdx].classList.add('active-card');
      }
    }
  } catch (err) {
    console.error('openActiveExam hatası:', err);
    if (window.showToast) {
      window.showToast('Sınav detayları açılırken bir hata oluştu: ' + (err.message || err), 'danger');
    }
  }
}

// ==========================================================================
// ÖĞRENCİ DERS DAĞILIMI (D-Y-B / NET) HESAPLAMA VE GÖSTERİM YARDIMCILARI
// ==========================================================================
function getOrComputeSubjectBreakdown(result, exam) {
  if (!result) return {};
  if (!exam || !exam.isMultiSubject || !Array.isArray(exam.subjects) || exam.subjects.length === 0) {
    return result.subjectBreakdown || {};
  }

  const penaltyRate = exam.wrongAffects ? (parseFloat(exam.penaltyRate) || 4) : 0;
  const existingSb = (result.subjectBreakdown && typeof result.subjectBreakdown === 'object') ? result.subjectBreakdown : {};
  const answers = result.answers || {};
  const answerKey = exam.answerKey || {};
  const hasAnswers = Object.keys(answers).length > 0;
  const hasKey = Object.keys(answerKey).length > 0;

  const finalBreakdown = {};
  let cumulativeOffset = 0;

  exam.subjects.forEach((subj, subjIdx) => {
    // Mevcut breakdown kaydını bul (id, isim veya normalize edilmiş isimle)
    let existingEntry = existingSb[subj.id] || existingSb[subj.name];
    if (!existingEntry) {
      const normTarget = normalizeOmrSubject(subj.name);
      for (const k in existingSb) {
        if (normalizeOmrSubject(k) === normTarget) {
          existingEntry = existingSb[k];
          break;
        }
      }
    }
    if (!existingEntry && Object.values(existingSb)[subjIdx]) {
      existingEntry = Object.values(existingSb)[subjIdx];
    }

    // Eğer öğrencinin cevapları ve cevap anahtarı varsa, cevaplardan doğrula/hesapla
    if (hasAnswers && hasKey) {
      let subjCorrect = 0;
      let subjWrong = 0;
      let subjBlank = 0;

      for (let q = 1; q <= subj.questionCount; q++) {
        let ans = extractAnswerForSubj(answers, null, subj, subjIdx, q, cumulativeOffset);
        ans = String(ans || '').trim().toUpperCase();
        if (ans === 'MULTIPLE') ans = '';

        const correctAns = findCorrectAnswerForKey(answerKey, subj, subjIdx, q, cumulativeOffset);

        if (!ans) {
          subjBlank++;
        } else if (correctAns && ans === correctAns) {
          subjCorrect++;
        } else {
          subjWrong++;
        }
      }

      let subjNet = penaltyRate > 0 ? (subjCorrect - (subjWrong / penaltyRate)) : subjCorrect;
      subjNet = Math.max(0, parseFloat(subjNet.toFixed(2)));
      const subjScore = subj.questionCount > 0 ? parseFloat(((subjNet / subj.questionCount) * 100).toFixed(1)) : 0;

      finalBreakdown[subj.id] = {
        id: subj.id,
        name: subj.name,
        subjectName: subj.name,
        correct: subjCorrect,
        wrong: subjWrong,
        blank: subjBlank,
        net: subjNet,
        score: subjScore,
        total: subj.questionCount
      };
    } else if (existingEntry) {
      const correct = existingEntry.correct !== undefined ? existingEntry.correct : 0;
      const wrong = existingEntry.wrong !== undefined ? existingEntry.wrong : 0;
      const blank = existingEntry.blank !== undefined ? existingEntry.blank : Math.max(0, (subj.questionCount || 0) - correct - wrong);
      const net = existingEntry.net !== undefined ? existingEntry.net : correct;
      const score = existingEntry.score !== undefined ? existingEntry.score : 0;

      finalBreakdown[subj.id] = {
        id: subj.id,
        name: subj.name,
        subjectName: subj.name,
        correct,
        wrong,
        blank,
        net,
        score,
        total: subj.questionCount
      };
    } else {
      finalBreakdown[subj.id] = {
        id: subj.id,
        name: subj.name,
        subjectName: subj.name,
        correct: 0,
        wrong: 0,
        blank: subj.questionCount || 0,
        net: 0,
        score: 0,
        total: subj.questionCount || 0
      };
    }

    cumulativeOffset += subj.questionCount;
  });

  return finalBreakdown;
}

function renderStudentSubjectBreakdown(result, exam) {
  if (!result) return '<span style="color: var(--text-muted); font-size: 0.75rem;">-</span>';

  // Gerçek veri var mı kontrolü (henüz notu/optiği girilmemiş öğrenciye yanıltıcı 0D 0Y 0N gösterme)
  const hasRealData = (result.correct !== undefined && result.correct !== '') ||
                      (result.score !== undefined && result.score !== '') ||
                      (result.answers && Object.keys(result.answers).length > 0);
  if (!hasRealData) {
    return '<span style="color: var(--text-muted); font-size: 0.75rem;">-</span>';
  }

  const isMulti = exam && exam.isMultiSubject && Array.isArray(exam.subjects) && exam.subjects.length > 0;

  if (isMulti) {
    const breakdown = getOrComputeSubjectBreakdown(result, exam);
    const items = exam.subjects.map(subj => {
      const sb = breakdown[subj.id];
      const sName = subj.name;
      if (sb) {
        return `
          <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.73rem; background: var(--bg-primary); border: 1px solid var(--border-color); padding: 2px 7px; border-radius: 4px; margin: 1px 0; white-space: nowrap;" title="${sName}: ${sb.correct} Doğru, ${sb.wrong} Yanlış, ${sb.blank} Boş (${sb.net} Net)">
            <strong style="color: #4f46e5;">${sName}:</strong>
            <span style="color: #059669; font-weight: 600;">${sb.correct}D</span>
            <span style="color: #dc2626; font-weight: 600;">${sb.wrong}Y</span>
            <span style="color: #64748b; font-weight: 600;">${sb.blank}B</span>
            <span style="color: #4f46e5; font-weight: 700; margin-left: 2px;">(${sb.net}N)</span>
          </div>
        `;
      } else {
        return `
          <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.73rem; background: var(--bg-primary); border: 1px dashed var(--border-color); padding: 2px 7px; border-radius: 4px; opacity: 0.6; margin: 1px 0; white-space: nowrap;">
            <strong style="color: var(--text-muted);">${sName}:</strong>
            <span style="color: var(--text-muted);">-</span>
          </div>
        `;
      }
    });

    return `<div style="display: flex; flex-direction: column; gap: 2px; align-items: flex-start;">${items.join('')}</div>`;
  } else {
    if (result.correct !== '' && result.correct !== undefined) {
      const correct = parseInt(result.correct, 10) || 0;
      const wrong = parseInt(result.wrong, 10) || 0;
      const blank = parseInt(result.blank, 10) || 0;
      const net = result.net !== undefined && result.net !== '' ? result.net : correct;
      const examSubj = exam.subject || exam.examName || 'Ders';
      return `
        <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.74rem; background: var(--bg-primary); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; white-space: nowrap;">
          <strong style="color: #4f46e5;">${examSubj}:</strong>
          <span style="color: #059669; font-weight: 600;">${correct}D</span>
          <span style="color: #dc2626; font-weight: 600;">${wrong}Y</span>
          <span style="color: #64748b; font-weight: 600;">${blank}B</span>
          <span style="color: #4f46e5; font-weight: 700; margin-left: 2px;">(${net}N)</span>
        </div>
      `;
    }
    return '<span style="color: var(--text-muted); font-size: 0.75rem;">-</span>';
  }
}

function renderActiveExamTable() {
  try {
    if (!activeExam) return;
    const state = stateManager.loadState();
    if (!activeExamTableBody) return;
    activeExamTableBody.innerHTML = '';

    const isMiddle = state.educationLevel === 'middle';
    const examBranch = activeExam.branch || '';

    const activeStudents = (state.students || []).filter(student => {
      return !isMiddle || !examBranch || student.branch === examBranch;
    });

    if (activeStudents.length === 0) {
      activeExamTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            ${isMiddle && examBranch ? `Bu sınavın uygulanacağı "${examBranch}" şubesinde kayıtlı öğrenci yok.` : 'Sınıfta kayıtlı öğrenci yok.'}
          </td>
        </tr>
      `;
      return;
    }

    // Öğrencileri alfabetik sıraya göre sırala
    const sortedStudents = [...activeStudents].sort((a, b) => {
      const nameA = (a && a.name) ? String(a.name) : '';
      const nameB = (b && b.name) ? String(b.name) : '';
      return nameA.localeCompare(nameB, 'tr');
    });

    sortedStudents.forEach(student => {
      const result = (activeExam.studentResults && activeExam.studentResults[student.id]) || {
        correct: '',
        blank: '',
        wrong: '',
        net: '',
        score: ''
      };

      const row = document.createElement('tr');
      const isAbsentToday = stateManager.isStudentAbsent ? stateManager.isStudentAbsent(student.id) : false;
      if (isAbsentToday) {
        row.classList.add('absent-row');
      }
      const sName = (student && student.name) ? String(student.name) : '';
      const sSurname = (student && student.surname) ? String(student.surname) : '';
      const initials = `${sName[0] || ''}${sSurname[0] || ''}`;
      const avatarHtml = (student && student.photo)
        ? `<img src="${student.photo}" class="avatar-sm" style="width: 32px; height: 32px; object-fit: cover; border-radius: 50%; margin: 0;">`
        : `<div class="avatar-sm" style="width: 32px; height: 32px; font-size: 0.8rem; margin: 0; background-color: var(--primary-light); color: var(--primary); text-transform: uppercase; display: flex; align-items: center; justify-content: center; border-radius: 50%;">${initials}</div>`;

      const hasAnswers = result.answers && Object.keys(result.answers).length > 0;
      const optLockTooltip = 'Değerler optik formdan otomatik hesaplanmaktadır. Değiştirmek için sağdaki "Optik İncele" butonunu kullanın.';

      row.innerHTML = `
        <td style="text-align: center; vertical-align: middle; font-weight: 600;">${student.number || ''}</td>
        <td style="vertical-align: middle;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${avatarHtml}
            <strong>${sName} ${sSurname}</strong>
          </div>
        </td>
        <td style="text-align: center; vertical-align: middle;">
          <input type="number" class="form-control exam-table-input exam-correct-input" data-student-id="${student.id}" min="0" max="${activeExam.totalQuestions || 100}" value="${result.correct !== undefined ? result.correct : ''}" placeholder="-" ${hasAnswers ? `readonly style="background-color: var(--bg-secondary); cursor: not-allowed; border: 1.5px dashed var(--border-color); font-weight: 700; color: #059669;" title="${optLockTooltip}"` : 'title="Doğru sayısını girin"'}>
        </td>
        <td style="text-align: center; vertical-align: middle;">
          <input type="number" class="form-control exam-table-input exam-blank-input" data-student-id="${student.id}" min="0" max="${activeExam.totalQuestions || 100}" value="${result.blank !== undefined ? result.blank : ''}" placeholder="-" ${hasAnswers ? `readonly style="background-color: var(--bg-secondary); cursor: not-allowed; border: 1.5px dashed var(--border-color); font-weight: 700; color: #64748b;" title="${optLockTooltip}"` : 'title="Boş sayısını girin"'}>
        </td>
        <td style="text-align: center; vertical-align: middle;">
          <input type="number" class="form-control exam-table-input exam-wrong-input" readonly value="${result.wrong !== undefined ? result.wrong : ''}" style="background-color: var(--bg-secondary); opacity: 0.85; ${hasAnswers ? 'cursor: not-allowed; font-weight: 700; color: #dc2626;' : ''}" placeholder="-" ${hasAnswers ? `title="${optLockTooltip}"` : ''}>
        </td>
        <td style="text-align: center; vertical-align: middle; font-weight: 700; color: var(--primary);">
          <span class="exam-net-span" style="font-size: 0.95rem;">${result.net !== undefined && result.net !== '' ? result.net : '-'}</span>
        </td>
        <td style="vertical-align: middle;">
          ${renderStudentSubjectBreakdown(result, activeExam)}
        </td>
        <td style="text-align: center; vertical-align: middle; font-weight: 700;">
          <span class="exam-score-span">${result.score !== undefined && result.score !== '' ? result.score : '-'}</span>
        </td>
        <td style="text-align: center; vertical-align: middle;">
          <button type="button" class="btn btn-sm btn-open-student-optical ${hasAnswers ? 'btn-secondary' : 'btn-outline-secondary'}" data-student-id="${student.id}" style="font-size: 0.74rem; padding: 0.28rem 0.6rem; height: auto; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px; cursor: pointer; ${hasAnswers ? 'border-color: rgba(99, 102, 241, 0.4); color: var(--primary); font-weight: 600; background: rgba(99, 102, 241, 0.1);' : 'border: 1px dashed var(--border-color); color: var(--text-muted);'}" title="${sName} ${sSurname} - ${hasAnswers ? 'Optik form işaretlemelerini incele ve düzenle' : 'Bu öğrenci için optik form işaretlemelerini gir'}">
            <i data-lucide="${hasAnswers ? 'scan-line' : 'edit'}" style="width: 14px; height: 14px;"></i>
            <span>${hasAnswers ? 'Optik İncele' : 'Optik Gir'}</span>
          </button>
        </td>
        <td style="text-align: center; vertical-align: middle;" class="change-indicator-td">
          <!-- İlerleme rozeti -->
        </td>
      `;

      const correctInput = row.querySelector('.exam-correct-input');
      const blankInput = row.querySelector('.exam-blank-input');

      const updateHandler = () => {
        handleInputUpdate(student.id, row, activeExam.totalQuestions);
      };

      if (!hasAnswers) {
        if (correctInput) correctInput.addEventListener('input', updateHandler);
        if (blankInput) blankInput.addEventListener('input', updateHandler);
      }

      const optBtn = row.querySelector('.btn-open-student-optical');
      if (optBtn) {
        optBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof window.openStudentOpticalEditModal === 'function') {
            window.openStudentOpticalEditModal(student.id);
          } else if (typeof openStudentOpticalEditModal === 'function') {
            openStudentOpticalEditModal(student.id);
          } else {
            console.warn('openStudentOpticalEditModal bulunamadı.');
          }
        });
      }

      // İlk yüklemedeki değişim okları
      if (result.score !== undefined && result.score !== '') {
        updateChangeIndicator(student.id, parseFloat(result.score), row);
      } else {
        const ciTd = row.querySelector('.change-indicator-td');
        if (ciTd) ciTd.innerHTML = `<span class="score-change-badge score-stable">-</span>`;
      }

      activeExamTableBody.appendChild(row);
    });

    if (window.safeCreateIcons) window.safeCreateIcons();
    else if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error('renderActiveExamTable hatası:', err);
    if (window.showToast) {
      window.showToast('Öğrenci tablosu oluşturulurken hata: ' + (err.message || err), 'danger');
    }
  }
}

function handleInputUpdate(studentId, rowEl, totalQuestions) {
  const correctInput = rowEl.querySelector('.exam-correct-input');
  const blankInput = rowEl.querySelector('.exam-blank-input');
  const wrongInput = rowEl.querySelector('.exam-wrong-input');
  const netSpan = rowEl.querySelector('.exam-net-span');
  const scoreSpan = rowEl.querySelector('.exam-score-span');

  let correct = correctInput.value === '' ? null : parseInt(correctInput.value);
  let blank = blankInput.value === '' ? null : parseInt(blankInput.value);

  // Verilerden biri eksikse hesaplamaları durdur ve sıfırla
  if (correct === null || blank === null) {
    wrongInput.value = '';
    netSpan.textContent = '-';
    scoreSpan.textContent = '-';
    rowEl.querySelector('.change-indicator-td').innerHTML = `<span class="score-change-badge score-stable">-</span>`;
    return;
  }

  // Değerleri 0 ile toplam soru sayısı aralığına sınırla
  if (correct < 0) correct = 0;
  if (correct > totalQuestions) correct = totalQuestions;
  correctInput.value = correct;

  if (blank < 0) blank = 0;
  if (blank > totalQuestions - correct) {
    blank = totalQuestions - correct;
  }
  blankInput.value = blank;

  const wrong = totalQuestions - (correct + blank);
  wrongInput.value = wrong;

  // Net hesabı
  let net = correct;
  if (activeExam.wrongAffects) {
    const penaltyRate = activeExam.penaltyRate || 4;
    net = correct - (wrong / penaltyRate);
  }
  if (net < 0) net = 0;
  netSpan.textContent = net.toFixed(2).replace('.00', '');

  // Puan hesabı (100 üzerinden)
  const score = parseFloat(((net / totalQuestions) * 100).toFixed(1));
  scoreSpan.textContent = score;

  // Tek dersli sınavlarda Ders Dağılımı sütununu canlı güncelle
  const breakdownCell = rowEl.children[6];
  if (breakdownCell && (!activeExam.isMultiSubject || !activeExam.subjects || activeExam.subjects.length <= 1)) {
    const examSubj = activeExam.subject || activeExam.examName || 'Ders';
    breakdownCell.innerHTML = `
      <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.74rem; background: var(--bg-primary); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; white-space: nowrap;">
        <strong style="color: #4f46e5;">${examSubj}:</strong>
        <span style="color: #059669; font-weight: 600;">${correct}D</span>
        <span style="color: #dc2626; font-weight: 600;">${wrong}Y</span>
        <span style="color: #64748b; font-weight: 600;">${blank}B</span>
        <span style="color: #4f46e5; font-weight: 700; margin-left: 2px;">(${netSpan.textContent}N)</span>
      </div>
    `;
  }

  // Karşılaştırma göstergesini güncelle
  updateChangeIndicator(studentId, score, rowEl);
}

function updateChangeIndicator(studentId, currentScore, rowEl) {
  const td = rowEl.querySelector('.change-indicator-td');
  if (!td) return;

  if (currentScore === undefined || currentScore === null || isNaN(currentScore)) {
    td.innerHTML = `<span class="score-change-badge score-stable">-</span>`;
    return;
  }

  const prevScore = getPreviousExamScore(studentId);
  if (prevScore === null || isNaN(prevScore)) {
    td.innerHTML = `<span class="score-change-badge score-stable" title="İlk Sınav">-</span>`;
    return;
  }

  const diff = currentScore - prevScore;
  const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);

  if (diff > 0) {
    td.innerHTML = `<span class="score-change-badge score-up" title="Önceki Sınav: ${prevScore}"><i data-lucide="arrow-up" style="width: 12px; height: 12px;"></i> ${diffStr}</span>`;
  } else if (diff < 0) {
    td.innerHTML = `<span class="score-change-badge score-down" title="Önceki Sınav: ${prevScore}"><i data-lucide="arrow-down" style="width: 12px; height: 12px;"></i> ${diffStr}</span>`;
  } else {
    td.innerHTML = `<span class="score-change-badge score-stable" title="Önceki Sınav: ${prevScore}">→ 0</span>`;
  }

  if (window.safeCreateIcons) window.safeCreateIcons();
  else if (window.lucide) window.lucide.createIcons();
}

function getPreviousExamScore(studentId) {
  const state = stateManager.loadState();
  const exams = (state.weeklyEvaluations || []).filter(e => e && e.id);
  
  // Oluşturulma tarihine göre azalan sırada sırala (yeni en üstte)
  exams.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (!activeExam) return null;
  const activeIndex = exams.findIndex(e => e.id === activeExam.id);
  
  // Bu sınavdan daha önce oluşturulmuş olan ilk sınavı (descending listesinde bir sonraki elemanı) bulalım
  const prevExam = (activeIndex !== -1 && activeIndex + 1 < exams.length) ? exams[activeIndex + 1] : null;

  if (prevExam && prevExam.examScores && prevExam.examScores[studentId] !== undefined) {
    const val = parseFloat(prevExam.examScores[studentId]);
    return isNaN(val) ? null : val;
  }
  return null;
}

function prepareAdvancedPrintLayout(reportTitle, reportSubtitle, examDetailText, notes, examsToPrint, isAverageReport, selectedValue) {
  const state = stateManager.loadState();
  const printTitle = document.getElementById('print-title');
  const printTbody = document.getElementById('print-exam-scores-tbody');
  
  if (!printTbody) return;
  printTbody.innerHTML = '';

  let students = [...state.students];

  if (state.educationLevel === 'middle') {
    if (isAverageReport) {
      const activeBranch = document.getElementById('dash-select-branch') ? document.getElementById('dash-select-branch').value : 'all';
      if (activeBranch && activeBranch !== 'all') {
        students = students.filter(s => s.branch === activeBranch);
      }
    } else {
      const currentExam = examsToPrint[0];
      if (currentExam && currentExam.branch) {
        students = students.filter(s => s.branch === currentExam.branch);
      }
    }
  }

  if (students.length === 0) {
    printTbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">Öğrenci bulunamadı.</td></tr>';
    return;
  }

  const participants = [];
  const nonParticipants = [];

  if (isAverageReport) {
    // 1. Ortalama Raporu Hesaplama
    students.forEach(std => {
      let totalCorrect = 0;
      let totalWrong = 0;
      let totalBlank = 0;
      let totalNet = 0;
      let totalScore = 0;
      let examCount = 0;

      examsToPrint.forEach(ex => {
        const res = (ex.studentResults && ex.studentResults[std.id]) || null;
        if (res && (res.correct !== undefined || res.score !== undefined)) {
          totalCorrect += res.correct || 0;
          totalWrong += res.wrong || 0;
          totalBlank += res.blank || 0;
          totalNet += res.net || 0;
          totalScore += res.score || 0;
          examCount++;
        }
      });

      if (examCount > 0) {
        participants.push({
          student: std,
          correct: Number((totalCorrect / examCount).toFixed(2)),
          wrong: Number((totalWrong / examCount).toFixed(2)),
          blank: Number((totalBlank / examCount).toFixed(2)),
          net: Number((totalNet / examCount).toFixed(2)),
          score: Number((totalScore / examCount).toFixed(2)),
          directionHtml: '<span style="color: #64748b;">-</span>'
        });
      } else {
        nonParticipants.push(std);
      }
    });

    // Başarı sıralamasına göre sırala
    participants.sort((a, b) => {
      if (b.net !== a.net) return b.net - a.net;
      if (b.score !== a.score) return b.score - a.score;
      return a.student.name.localeCompare(b.student.name, 'tr');
    });

    nonParticipants.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    // Meta box contents for average reports
    const selectedWeek = stateManager.getSelectedWeek();
    const formattedWeek = window.formatWeekTR ? window.formatWeekTR(selectedWeek, 'full') : selectedWeek;

    const examDateText = selectedValue === 'week_avg' ? formattedWeek : 'Tüm Dönem';
    
    const questionCounts = [...new Set(examsToPrint.map(e => e.totalQuestions))];
    const questionsText = questionCounts.length === 1 ? `${questionCounts[0]} Soru` : 'Değişken';

    const durations = [...new Set(examsToPrint.map(e => e.duration))];
    const durationText = durations.length === 1 ? `${durations[0]} Dk` : 'Değişken';

    const totalScoresSum = participants.reduce((sum, p) => sum + p.score, 0);
    const avgScoreText = participants.length > 0 ? (totalScoresSum / participants.length).toFixed(2) + ' Puan' : '0 Puan';

    if (printTitle) printTitle.textContent = selectedValue === 'week_avg' ? 'HAFTALIK SINAV ORTALAMALARI SINAV SONUÇ RAPORU' : 'TÜM SINAVLARIN GENEL ORTALAMASI SINAV SONUÇ RAPORU';
    
    const metaDate = document.getElementById('print-meta-date');
    const metaQuestions = document.getElementById('print-meta-questions');
    const metaDuration = document.getElementById('print-meta-duration');
    const metaAverage = document.getElementById('print-meta-average');

    if (metaDate) metaDate.textContent = examDateText;
    if (metaQuestions) metaQuestions.textContent = questionsText;
    if (metaDuration) metaDuration.textContent = durationText;
    if (metaAverage) metaAverage.textContent = avgScoreText;

  } else {
    // 2. Tek Sınav Raporu Hesaplama
    const currentExam = examsToPrint[0];

    // Bir önceki sınavı tespit et (aynı şube)
    const sameBranchExams = (state.weeklyEvaluations || []).filter(e => e.branch === currentExam.branch);
    sameBranchExams.sort((a, b) => {
      const getTimestamp = (examItem) => {
        if (examItem.createdAt) return new Date(examItem.createdAt).getTime();
        return parseInt(examItem.id.replace('exam_', '')) || 0;
      };
      return getTimestamp(a) - getTimestamp(b);
    });

    const currentIdx = sameBranchExams.findIndex(e => e.id === currentExam.id);
    let prevExam = null;
    if (currentIdx > 0) {
      prevExam = sameBranchExams[currentIdx - 1];
    }

    // Bir önceki sınavdaki sıralamaları çıkar
    const prevRankMap = {};
    if (prevExam) {
      const prevParticipants = [];
      students.forEach(std => {
        const res = (prevExam.studentResults && prevExam.studentResults[std.id]) || null;
        if (res && (res.correct !== undefined || res.score !== undefined)) {
          prevParticipants.push({
            studentId: std.id,
            net: res.net || 0,
            score: res.score || 0
          });
        }
      });
      prevParticipants.sort((a, b) => {
        if (b.net !== a.net) return b.net - a.net;
        if (b.score !== a.score) return b.score - a.score;
        return 0;
      });
      prevParticipants.forEach((p, idx) => {
        prevRankMap[p.studentId] = idx + 1;
      });
    }

    // Bu sınavdaki sıralamaları çıkar
    const currentParticipantsList = [];
    students.forEach(std => {
      const res = (currentExam.studentResults && currentExam.studentResults[std.id]) || null;
      if (res && (res.correct !== undefined || res.score !== undefined)) {
        currentParticipantsList.push({
          studentId: std.id,
          net: res.net || 0,
          score: res.score || 0
        });
      }
    });
    currentParticipantsList.sort((a, b) => {
      if (b.net !== a.net) return b.net - a.net;
      if (b.score !== a.score) return b.score - a.score;
      return 0;
    });
    const currentRankMap = {};
    currentParticipantsList.forEach((p, idx) => {
      currentRankMap[p.studentId] = idx + 1;
    });

    // Öğrenci listesini oluştur
    students.forEach(std => {
      const res = (currentExam.studentResults && currentExam.studentResults[std.id]) || null;
      if (res && (res.correct !== undefined || res.score !== undefined)) {
        // Yön göstergesi hesapla
        let directionHtml = '<span style="color: #64748b;">-</span>';
        const curRank = currentRankMap[std.id];
        const prevRank = prevRankMap[std.id];

        if (prevRank && curRank) {
          const diff = prevRank - curRank; // Örn: 5.likten 2.liğe = 3 (Yükseldi)
          if (diff > 0) {
            directionHtml = `<span style="color: #10b981; font-weight: bold;">▲ ${diff}</span>`;
          } else if (diff < 0) {
            directionHtml = `<span style="color: #ef4444; font-weight: bold;">▼ ${Math.abs(diff)}</span>`;
          } else {
            directionHtml = `<span style="color: #94a3b8; font-weight: bold;">=</span>`;
          }
        }

        participants.push({
          student: std,
          correct: res.correct || 0,
          wrong: res.wrong || 0,
          blank: res.blank || 0,
          net: res.net || 0,
          score: res.score || 0,
          directionHtml: directionHtml,
          subjectBreakdown: res.subjectBreakdown
        });
      } else {
        nonParticipants.push(std);
      }
    });

    // Başarı sıralamasına göre sırala
    participants.sort((a, b) => {
      if (b.net !== a.net) return b.net - a.net;
      if (b.score !== a.score) return b.score - a.score;
      return a.student.name.localeCompare(b.student.name, 'tr');
    });

    nonParticipants.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    // Meta box contents for specific exam
    let examDateText = '-';
    if (currentExam.createdAt) {
      try {
        examDateText = new Date(currentExam.createdAt).toLocaleDateString('tr-TR');
      } catch(e) {}
    } else {
      try {
        const ts = parseInt(currentExam.id.replace('exam_', ''));
        if (ts) examDateText = new Date(ts).toLocaleDateString('tr-TR');
      } catch(e) {}
    }

    const questionsText = `${currentExam.totalQuestions} Soru`;
    const durationText = `${currentExam.duration} Dk`;
    
    const totalScoresSum = participants.reduce((sum, p) => sum + p.score, 0);
    const avgScoreText = participants.length > 0 ? (totalScoresSum / participants.length).toFixed(2) + ' Puan' : '0 Puan';

    if (printTitle) printTitle.textContent = `${currentExam.examName} SINAV SONUÇ RAPORU`;

    const metaDate = document.getElementById('print-meta-date');
    const metaQuestions = document.getElementById('print-meta-questions');
    const metaDuration = document.getElementById('print-meta-duration');
    const metaAverage = document.getElementById('print-meta-average');

    if (metaDate) metaDate.textContent = examDateText;
    if (metaQuestions) metaQuestions.textContent = questionsText;
    if (metaDuration) metaDuration.textContent = durationText;
    if (metaAverage) metaAverage.textContent = avgScoreText;
  }

  // 3. Tablo Satırlarını Render Et
  let ranking = 1;
  participants.forEach(p => {
    let breakdownPrintHtml = '';
    if (p.subjectBreakdown && typeof p.subjectBreakdown === 'object') {
      const parts = Object.values(p.subjectBreakdown).map(b => `${b.subjectName || b.name || 'Ders'}: ${b.net !== undefined ? b.net : b.correct}N`);
      if (parts.length > 0) {
        breakdownPrintHtml = `<div style="font-size: 0.68rem; color: #64748b; font-weight: normal; margin-top: 2px;">${parts.join(' • ')}</div>`;
      }
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd; font-weight: bold; background: rgba(0,0,0,0.01);">${ranking}</td>
      <td style="padding: 0.5rem; border-bottom: 1px solid #ddd;"><strong>${p.student.name} ${p.student.surname}</strong></td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd;">${p.student.branch || '-'}</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd; color: #10b981; font-weight: 500;">${p.correct}</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd; color: #ef4444; font-weight: 500;">${p.wrong}</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd; color: #f59e0b; font-weight: 500;">${p.blank}</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd; font-weight: bold;">
        ${p.net}
        ${breakdownPrintHtml}
      </td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd; font-weight: bold; color: var(--primary);">${p.score}</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd;">${p.directionHtml}</td>
    `;
    printTbody.appendChild(row);
    ranking++;
  });

  // Sınava girmeyenleri ekle
  nonParticipants.forEach(std => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #eee; color: var(--text-muted); font-style: italic;">-</td>
      <td style="padding: 0.5rem; border-bottom: 1px solid #eee; color: var(--text-muted);"><strong>${std.name} ${std.surname}</strong> <span style="font-size: 0.75rem; font-style: italic; color: #f59e0b; margin-left: 0.25rem;">(Katılmadı)</span></td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #eee; color: var(--text-muted);">${std.branch || '-'}</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #eee; color: var(--text-muted);">-</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #eee; color: var(--text-muted);">-</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #eee; color: var(--text-muted);">-</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #eee; color: var(--text-muted);">-</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #eee; color: var(--text-muted);">-</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #eee; color: var(--text-muted);">-</td>
    `;
    printTbody.appendChild(row);
  });
}

// ==========================================================================
// ÖĞRENCİ SINAV RAPORU / KES-DAĞIT FİŞLERİ OLUŞTURMA VE YAZDIRMA
// ==========================================================================
function printStudentExamSlips() {
  if (!activeExam) {
    if (toastCallback) toastCallback('Lütfen önce bir sınav seçin!', 'warning');
    else if (window.showToast) window.showToast('Lütfen önce bir sınav seçin!', 'warning');
    return;
  }

  const printArea = document.getElementById('student-exam-slips-print-area');
  if (!printArea) {
    console.error('student-exam-slips-print-area bulunamadı.');
    return;
  }

  const state = stateManager.loadState();
  const isMiddle = state.educationLevel === 'middle';
  const examBranch = activeExam.branch || '';

  const activeStudents = (state.students || []).filter(student => {
    return !isMiddle || !examBranch || student.branch === examBranch;
  });

  // Alfabetik sırala
  const sortedStudents = [...activeStudents].sort((a, b) => {
    const numA = parseInt(a.number, 10) || 9999;
    const numB = parseInt(b.number, 10) || 9999;
    if (numA !== numB && numA !== 9999 && numB !== 9999) return numA - numB;
    const nameA = (a && a.name) ? String(a.name) : '';
    const nameB = (b && b.name) ? String(b.name) : '';
    return nameA.localeCompare(nameB, 'tr');
  });

  const studentResults = activeExam.studentResults || {};
  const answerKey = activeExam.answerKey || {};
  const isMulti = !!(activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0);
  const qCount = parseInt(activeExam.totalQuestions, 10) || 20;

  // Sınava katılan öğrencileri ve sonuçlarını topla
  const studentReports = [];

  sortedStudents.forEach(student => {
    const res = studentResults[student.id];
    if (!res) return;

    // Öğrencinin sonuç bilgisi veya cevapları var mı?
    const hasAnswers = res.answers && Object.keys(res.answers).length > 0;
    const hasScores = res.score !== undefined && res.score !== '' && res.score !== null;
    const hasCounts = (res.correct !== undefined && res.correct !== '') || (res.wrong !== undefined && res.wrong !== '');

    if (!hasAnswers && !hasScores && !hasCounts) return;

    const studentAnswers = res.answers || {};

    // Ders bazlı döküm analizi
    const subjectList = [];

    if (isMulti) {
      let cumulativeOffset = 0;
      const computedBreakdown = getOrComputeSubjectBreakdown(res, activeExam);

      activeExam.subjects.forEach((subj, subjIdx) => {
        const sb = computedBreakdown[subj.id] || {
          correct: 0,
          wrong: 0,
          blank: subj.questionCount,
          net: 0,
          score: 0,
          total: subj.questionCount
        };

        const wrongs = [];
        const blanks = [];

        for (let q = 1; q <= subj.questionCount; q++) {
          let ans = extractAnswerForSubj(studentAnswers, null, subj, subjIdx, q, cumulativeOffset);
          ans = String(ans || '').trim().toUpperCase();
          if (ans === 'MULTIPLE') ans = '';

          const correctAns = findCorrectAnswerForKey(answerKey, subj, subjIdx, q, cumulativeOffset);

          if (!ans) {
            blanks.push({ qNum: q, correct: correctAns || '-' });
          } else if (correctAns && ans !== correctAns) {
            wrongs.push({ qNum: q, student: ans, correct: correctAns });
          }
        }

        subjectList.push({
          id: subj.id,
          name: subj.name,
          correct: sb.correct !== undefined ? sb.correct : 0,
          wrong: sb.wrong !== undefined ? sb.wrong : 0,
          blank: sb.blank !== undefined ? sb.blank : 0,
          net: sb.net !== undefined ? sb.net : 0,
          total: subj.questionCount,
          wrongs,
          blanks
        });

        cumulativeOffset += subj.questionCount;
      });
    } else {
      // Tek dersli sınav
      const subjName = activeExam.subject || activeExam.examName || 'Ders';
      const wrongs = [];
      const blanks = [];

      for (let q = 1; q <= qCount; q++) {
        const ans = String(studentAnswers[q] || studentAnswers[String(q)] || '').trim().toUpperCase();
        const correctAns = String(answerKey[q] || answerKey[String(q)] || '').trim().toUpperCase();

        if (!ans) {
          blanks.push({ qNum: q, correct: correctAns || '-' });
        } else if (correctAns && ans !== correctAns) {
          wrongs.push({ qNum: q, student: ans, correct: correctAns });
        }
      }

      const totalCorrect = res.correct !== undefined && res.correct !== '' ? parseInt(res.correct, 10) : (qCount - wrongs.length - blanks.length);
      const totalWrong = res.wrong !== undefined && res.wrong !== '' ? parseInt(res.wrong, 10) : wrongs.length;
      const totalBlank = res.blank !== undefined && res.blank !== '' ? parseInt(res.blank, 10) : blanks.length;
      const totalNet = res.net !== undefined && res.net !== '' ? res.net : totalCorrect;

      subjectList.push({
        id: 'single',
        name: subjName,
        correct: totalCorrect,
        wrong: totalWrong,
        blank: totalBlank,
        net: totalNet,
        total: qCount,
        wrongs,
        blanks
      });
    }

    const totalC = res.correct !== undefined && res.correct !== '' ? res.correct : subjectList.reduce((s, x) => s + (parseInt(x.correct, 10) || 0), 0);
    const totalW = res.wrong !== undefined && res.wrong !== '' ? res.wrong : subjectList.reduce((s, x) => s + (parseInt(x.wrong, 10) || 0), 0);
    const totalB = res.blank !== undefined && res.blank !== '' ? res.blank : subjectList.reduce((s, x) => s + (parseInt(x.blank, 10) || 0), 0);
    const totalN = res.net !== undefined && res.net !== '' ? res.net : (parseFloat(totalC) || 0);
    const scoreVal = res.score !== undefined && res.score !== '' ? res.score : '-';

    studentReports.push({
      student,
      totalCorrect: totalC,
      totalWrong: totalW,
      totalBlank: totalB,
      totalNet: totalN,
      score: scoreVal,
      subjects: subjectList
    });
  });

  if (studentReports.length === 0) {
    const msg = 'Bu sınavda henüz optik okuma sonucu veya öğrenci verisi bulunmuyor!';
    if (toastCallback) toastCallback(msg, 'warning');
    else if (window.showToast) window.showToast(msg, 'warning');
    return;
  }

  // ==========================================================================
  // BAŞARI SIRALAMASI HESAPLAMA (Eşit Netlerde Aynı Sıra, Sonraki Sıra Atlar: 1, 2, 3, 3, 5)
  // ==========================================================================
  const totalParticipants = studentReports.length;

  // Sıralama için kopya oluştur ve azalan net/puana göre diz (Başarı sıralaması)
  const sortedByPerformance = [...studentReports].sort((a, b) => {
    const netA = parseFloat(a.totalNet) || 0;
    const netB = parseFloat(b.totalNet) || 0;
    if (Math.abs(netB - netA) > 0.001) {
      return netB - netA;
    }
    const scoreA = parseFloat(a.score) || 0;
    const scoreB = parseFloat(b.score) || 0;
    if (Math.abs(scoreB - scoreA) > 0.001) {
      return scoreB - scoreA;
    }
    const corA = parseInt(a.totalCorrect, 10) || 0;
    const corB = parseInt(b.totalCorrect, 10) || 0;
    if (corB !== corA) {
      return corB - corA;
    }
    const nameA = (a.student && a.student.name) ? String(a.student.name) : '';
    const nameB = (b.student && b.student.name) ? String(b.student.name) : '';
    return nameA.localeCompare(nameB, 'tr');
  });

  // Standard competition ranking (1224 sıralaması)
  let currentRank = 1;
  sortedByPerformance.forEach((rep, i) => {
    if (i > 0) {
      const prev = sortedByPerformance[i - 1];
      const prevNet = parseFloat(prev.totalNet) || 0;
      const currNet = parseFloat(rep.totalNet) || 0;
      const prevScore = parseFloat(prev.score) || 0;
      const currScore = parseFloat(rep.score) || 0;

      // Netler (ve puanlar) eşit ise aynı sırayı paylaşırlar
      const isTie = Math.abs(prevNet - currNet) < 0.001 && Math.abs(prevScore - currScore) < 0.001;
      if (!isTie) {
        currentRank = i + 1;
      }
    } else {
      currentRank = 1;
    }
    rep.rank = currentRank;
  });

  // HTML Üretimi
  let examDateFormatted = '';
  try {
    const dt = activeExam.createdAt ? new Date(activeExam.createdAt) : new Date();
    examDateFormatted = dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    examDateFormatted = '-';
  }

  const schoolTitle = state.schoolName || 'SINIF ASİSTANI';
  const classBranch = state.className || (isMiddle ? `Şube: ${examBranch || '-'}` : '');

  let slipsHtml = '';

  // Rapor fişlerini başarı sıralamasına (1., 2., 3. ...) göre yazdır
  sortedByPerformance.forEach((rep, idx) => {
    const st = rep.student;
    const stFullName = `${st.name || ''} ${st.surname || ''}`.trim();
    const stNo = st.number ? `No: ${st.number}` : '';
    const studentRank = rep.rank || (idx + 1);

    // Her ders için satır / kart üretimi
    let subjectRowsHtml = '';

    rep.subjects.forEach(sub => {
      const wrongsHtml = sub.wrongs.length > 0
        ? `<div style="margin-top: 3px; font-size: 10.5px; color: #b91c1c; line-height: 1.4;">
            <strong style="color: #991b1b; display: inline-flex; align-items: center; gap: 3px;">❌ Yanlış Yapılanlar:</strong>
            <span style="font-weight: 500;"> ${sub.wrongs.map(w => `<span style="background: #fee2e2; border: 1px solid #fca5a5; padding: 1px 5px; border-radius: 4px; display: inline-block; margin: 1px 2px;">S.${w.qNum}: <b>${w.student}</b> <span style="color: #15803d; font-weight: 700;">(D: ${w.correct})</span></span>`).join(' ')}</span>
           </div>`
        : '';

      const blanksHtml = sub.blanks.length > 0
        ? `<div style="margin-top: 3px; font-size: 10.5px; color: #475569; line-height: 1.4;">
            <strong style="color: #334155; display: inline-flex; align-items: center; gap: 3px;">⚪ Boş Bırakılanlar:</strong>
            <span style="font-weight: 500;"> ${sub.blanks.map(b => `<span style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 1px 5px; border-radius: 4px; display: inline-block; margin: 1px 2px;">S.${b.qNum} <span style="color: #15803d; font-weight: 700;">(D: ${b.correct})</span></span>`).join(' ')}</span>
           </div>`
        : '';

      const allSuccessHtml = (sub.wrongs.length === 0 && sub.blanks.length === 0)
        ? `<div style="margin-top: 2px; font-size: 10.5px; color: #15803d; font-weight: 600; display: flex; align-items: center; gap: 4px;">
            <span>✨ Bu derste tüm sorular tam ve doğru yanıtlandı!</span>
           </div>`
        : '';

      subjectRowsHtml += `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; margin-top: 5px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            <span style="font-weight: 700; color: #1e293b; font-size: 11.5px;">📘 ${sub.name} <span style="font-size: 10px; font-weight: 500; color: #64748b;">(${sub.total} Soru)</span></span>
            <div style="display: inline-flex; gap: 8px; font-size: 11px; font-weight: 600;">
              <span style="color: #15803d;">Doğru: ${sub.correct}</span>
              <span style="color: #dc2626;">Yanlış: ${sub.wrong}</span>
              <span style="color: #475569;">Boş: ${sub.blank}</span>
              <span style="color: #4338ca; background: #e0e7ff; padding: 0 5px; border-radius: 3px;">Net: ${sub.net}</span>
            </div>
          </div>
          ${wrongsHtml}
          ${blanksHtml}
          ${allSuccessHtml}
        </div>
      `;
    });

    slipsHtml += `
      <div class="student-slip-item" style="box-sizing: border-box; background: #fff; border: 1.5px dashed #475569; border-radius: 8px; padding: 9px 12px; margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid;">
        <!-- Fiş Üst Başlığı -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 4px;">
          <div>
            <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${schoolTitle} ${classBranch ? '• ' + classBranch : ''}</div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 1px;">📝 ${activeExam.examName || 'Haftalık Değerlendirme Sınavı'}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; font-weight: 600; color: #475569;">📅 ${examDateFormatted}</div>
            <div style="font-size: 10px; font-weight: 700; color: #4338ca; margin-top: 1px;">Öğrenci Sınav Sonuç Fişi</div>
          </div>
        </div>

        <!-- Öğrenci Bilgisi ve Genel Özet Barı -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 8px; margin-top: 6px; flex-wrap: wrap; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; font-weight: 800; color: #0f172a;">👤 ${stFullName}</span>
            ${stNo ? `<span style="font-size: 11px; font-weight: 600; color: #475569; background: #e2e8f0; padding: 1px 6px; border-radius: 4px;">${stNo}</span>` : ''}
            <span style="font-size: 11px; font-weight: 800; color: #1e1b4b; background: linear-gradient(135deg, #e0e7ff, #c7d2fe); border: 1px solid #a5b4fc; padding: 1px 8px; border-radius: 999px; display: inline-flex; align-items: center; gap: 3px;" title="Sınıf Başarı Sırası">
              🏆 Sıra: ${studentRank} / ${totalParticipants}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700;">
            <span style="color: #15803d;">Toplam D: ${rep.totalCorrect}</span>
            <span style="color: #dc2626;">Toplam Y: ${rep.totalWrong}</span>
            <span style="color: #475569;">Toplam B: ${rep.totalBlank}</span>
            <span style="color: #4338ca; background: #e0e7ff; padding: 1px 6px; border-radius: 4px;">Toplam Net: ${rep.totalNet}</span>
            <span style="color: #0f172a; background: #fef08a; padding: 1px 6px; border-radius: 4px; border: 1px solid #fde047;">Puan: ${rep.score}</span>
          </div>
        </div>

        <!-- Ders Bazlı Detaylar -->
        <div style="margin-top: 4px;">
          ${subjectRowsHtml}
        </div>

        <!-- Kesme Çizgisi Notu -->
        <div class="student-slip-cut-line" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; font-size: 9.5px; color: #64748b; font-weight: 500;">
          <span style="display: flex; align-items: center; gap: 4px;">✂️ Buradan Kesiniz</span>
          <span style="font-size: 9px; color: #94a3b8; font-style: italic;">* Doğru cevaplanan sorular sadece sayısal olarak özetlenmiştir.</span>
        </div>
      </div>
    `;
  });

  printArea.innerHTML = slipsHtml;

  // Sayfa kenar boşluğu ve yazdırma ayarları
  const printStyle = document.createElement('style');
  printStyle.id = 'student-slips-page-style';
  printStyle.textContent = `@page { size: A4 portrait; margin: 6mm 6mm; }`;
  document.head.appendChild(printStyle);

  document.body.classList.add('print-student-slips');
  window.print();

  const cleanupSlipsPrint = () => {
    document.body.classList.remove('print-student-slips');
    const s = document.getElementById('student-slips-page-style');
    if (s) s.remove();
  };

  window.addEventListener('afterprint', cleanupSlipsPrint, { once: true });
  setTimeout(cleanupSlipsPrint, 1000);
}

window.printStudentExamSlips = printStudentExamSlips;

// ==========================================================================
// TAHTADA SORU ÇÖZÜMÜ & HATA ANALİZİ MODÜLÜ (AKILLI TAHTA UYUMLU)
// ==========================================================================
let boardQaActiveSubjIdx = 0;
let boardQaActiveQNum = 1;
let boardQaActiveFilter = 'all_errors'; // 'all_errors', 'wrong', 'blank', 'correct', 'all'
let boardQaSearchTerm = '';
let boardQaIsFullscreen = false;

function openBoardQuestionAnalysisModal(examId) {
  const state = stateManager.loadState();
  if (examId) {
    const found = (state.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
    if (found) activeExam = found;
  }
  if (!activeExam) {
    if (window.activeWeeklyExam) {
      activeExam = window.activeWeeklyExam;
    } else if (Array.isArray(state.weeklyEvaluations) && state.weeklyEvaluations.length > 0) {
      activeExam = state.weeklyEvaluations[0];
    }
  }

  if (!activeExam) {
    const msg = 'Lütfen önce incelenecek bir sınav seçin!';
    if (toastCallback) toastCallback(msg, 'warning');
    else if (window.showToast) window.showToast(msg, 'warning');
    return;
  }

  window.activeWeeklyExam = activeExam;

  const modal = document.getElementById('modal-board-question-analysis');
  if (!modal) return;

  // Başlangıç durumunu sıfırla
  boardQaActiveSubjIdx = 0;
  boardQaActiveQNum = 1;
  boardQaActiveFilter = 'all_errors';
  boardQaSearchTerm = '';
  const searchInput = document.getElementById('board-qa-search-input');
  if (searchInput) searchInput.value = '';

  const filterTabs = document.getElementById('board-qa-filter-tabs');
  if (filterTabs) {
    filterTabs.querySelectorAll('.board-filter-btn').forEach(b => {
      if (b.getAttribute('data-filter') === 'all_errors') b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  // Alt başlık güncelleme
  const subtitleEl = document.getElementById('board-qa-subtitle');
  if (subtitleEl) {
    const branchText = activeExam.branch ? ` • Şube: ${activeExam.branch}` : '';
    const qCount = activeExam.totalQuestions || 20;
    const dur = activeExam.duration ? ` • ${activeExam.duration} Dk` : '';
    subtitleEl.textContent = `📝 ${activeExam.examName || 'Haftalık Sınav'} • Toplam ${qCount} Soru${branchText}${dur}`;
  }

  renderBoardQuestionAnalysis();

  const modalBody = document.getElementById('board-qa-modal-body');
  if (modalBody) modalBody.scrollTop = 0;

  modal.classList.add('active');
  document.addEventListener('keydown', handleBoardQaKeydown);

  if (window.safeCreateIcons) window.safeCreateIcons();
  else if (window.lucide) window.lucide.createIcons();
}

function closeBoardQuestionAnalysisModal() {
  const modal = document.getElementById('modal-board-question-analysis');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.remove('board-fullscreen');
    boardQaIsFullscreen = false;
    const fsText = document.getElementById('btn-board-qa-fullscreen-text');
    if (fsText) fsText.textContent = 'Tam Ekran';
  }
  document.removeEventListener('keydown', handleBoardQaKeydown);
}

function handleBoardQaKeydown(e) {
  const modal = document.getElementById('modal-board-question-analysis');
  if (!modal || !modal.classList.contains('active')) return;

  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
    if (e.key === 'Escape') {
      closeBoardQuestionAnalysisModal();
    }
    return;
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    boardQaStepQuestion(-1);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    boardQaStepQuestion(1);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeBoardQuestionAnalysisModal();
  }
}

function boardQaStepQuestion(direction) {
  if (!activeExam) return;
  const isMulti = !!(activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0);

  if (isMulti) {
    const subjects = activeExam.subjects;
    const currSubj = subjects[boardQaActiveSubjIdx];
    const qCount = currSubj ? currSubj.questionCount : 1;

    if (direction > 0) {
      if (boardQaActiveQNum < qCount) {
        boardQaActiveQNum++;
      } else if (boardQaActiveSubjIdx < subjects.length - 1) {
        boardQaActiveSubjIdx++;
        boardQaActiveQNum = 1;
      }
    } else if (direction < 0) {
      if (boardQaActiveQNum > 1) {
        boardQaActiveQNum--;
      } else if (boardQaActiveSubjIdx > 0) {
        boardQaActiveSubjIdx--;
        const prevSubj = subjects[boardQaActiveSubjIdx];
        boardQaActiveQNum = prevSubj ? prevSubj.questionCount : 1;
      }
    }
  } else {
    const totalQ = parseInt(activeExam.totalQuestions, 10) || 20;
    if (direction > 0 && boardQaActiveQNum < totalQ) {
      boardQaActiveQNum++;
    } else if (direction < 0 && boardQaActiveQNum > 1) {
      boardQaActiveQNum--;
    }
  }

  renderBoardQuestionAnalysis();
}

function renderBoardQuestionAnalysis() {
  if (!activeExam) return;

  const state = stateManager.loadState();
  const isMiddle = state.educationLevel === 'middle';
  const examBranch = activeExam.branch || '';
  const isMulti = !!(activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0);

  const activeStudents = (state.students || []).filter(student => {
    return !isMiddle || !examBranch || student.branch === examBranch;
  });

  const studentResults = activeExam.studentResults || {};
  const answerKey = activeExam.answerKey || {};

  // Ders bilgisi ve kümülatif ofset
  let currentSubj = null;
  let cumulativeOffset = 0;
  let qCount = 20;

  if (isMulti) {
    if (boardQaActiveSubjIdx >= activeExam.subjects.length) {
      boardQaActiveSubjIdx = 0;
    }
    currentSubj = activeExam.subjects[boardQaActiveSubjIdx];
    qCount = currentSubj ? currentSubj.questionCount : 1;
    for (let i = 0; i < boardQaActiveSubjIdx; i++) {
      cumulativeOffset += activeExam.subjects[i].questionCount;
    }
  } else {
    qCount = parseInt(activeExam.totalQuestions, 10) || 20;
    currentSubj = {
      id: 'single',
      name: activeExam.subject || activeExam.examName || 'Ders',
      questionCount: qCount
    };
  }

  if (boardQaActiveQNum < 1) boardQaActiveQNum = 1;
  if (boardQaActiveQNum > qCount) boardQaActiveQNum = qCount;

  // 1. Çoklu Ders Sekmeleri
  const subjTabsContainer = document.getElementById('board-qa-subject-tabs');
  if (subjTabsContainer) {
    if (isMulti && activeExam.subjects.length > 1) {
      subjTabsContainer.style.display = 'flex';
      let tabsHtml = '';

      const getSubjEmoji = (name) => {
        const norm = (name || '').toLowerCase();
        if (norm.includes('türk') || norm.includes('turk')) return '📖';
        if (norm.includes('mat')) return '📐';
        if (norm.includes('fen')) return '🔬';
        if (norm.includes('sosyal') || norm.includes('tarih') || norm.includes('coğraf') || norm.includes('inkıl')) return '🌍';
        if (norm.includes('ing') || norm.includes('ingil') || norm.includes('dil')) return '🇬🇧';
        if (norm.includes('din')) return '🕌';
        return '📘';
      };

      activeExam.subjects.forEach((subj, sIdx) => {
        const isActive = sIdx === boardQaActiveSubjIdx;
        let subjErrors = 0;
        let subjOffset = 0;
        for (let i = 0; i < sIdx; i++) subjOffset += activeExam.subjects[i].questionCount;

        for (let q = 1; q <= subj.questionCount; q++) {
          const cAns = findCorrectAnswerForKey(answerKey, subj, sIdx, q, subjOffset);
          activeStudents.forEach(st => {
            const res = studentResults[st.id];
            if (!res || !res.answers) return;
            let ans = extractAnswerForSubj(res.answers, null, subj, sIdx, q, subjOffset);
            ans = String(ans || '').trim().toUpperCase();
            if (ans === 'MULTIPLE') ans = '';
            if (!ans || (cAns && ans !== cAns)) {
              subjErrors++;
            }
          });
        }

        tabsHtml += `
          <button type="button" class="board-subj-tab ${isActive ? 'active' : ''}" data-subj-idx="${sIdx}">
            <span style="font-size: 0.95rem;">${getSubjEmoji(subj.name)}</span>
            <span>${subj.name}</span>
            <span style="font-size: 0.72rem; opacity: 0.85; font-weight: 600;">(${subj.questionCount} Soru)</span>
            ${subjErrors > 0 ? `<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: ${isActive ? '#fff' : '#dc2626'}; border: 1px solid ${isActive ? 'rgba(255,255,255,0.4)' : '#fca5a5'}; font-size: 0.7rem; padding: 1px 6px; border-radius: 999px;">${subjErrors} Hata</span>` : ''}
          </button>
        `;
      });
      subjTabsContainer.innerHTML = tabsHtml;

      subjTabsContainer.querySelectorAll('.board-subj-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          const sIdx = parseInt(btn.getAttribute('data-subj-idx'), 10) || 0;
          boardQaActiveSubjIdx = sIdx;
          boardQaActiveQNum = 1;
          const modalBody = document.getElementById('board-qa-modal-body');
          if (modalBody) modalBody.scrollTop = 0;
          renderBoardQuestionAnalysis();
        });
      });
    } else {
      subjTabsContainer.style.display = 'none';
    }
  }

  // 2. Doğru Cevap Şıkkı
  let correctAns = '';
  if (isMulti) {
    correctAns = findCorrectAnswerForKey(answerKey, currentSubj, boardQaActiveSubjIdx, boardQaActiveQNum, cumulativeOffset);
  } else {
    correctAns = String(answerKey[boardQaActiveQNum] || answerKey[String(boardQaActiveQNum)] || '').trim().toUpperCase();
  }

  // 3. Katılan Öğrencileri ve Seçili Soru Cevaplarını Analiz Et
  const choicesCount = parseInt(activeExam.choicesCount, 10) || 4;
  const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
  const choiceStats = { 'BOŞ': 0 };
  letters.forEach(l => choiceStats[l] = 0);

  const studentAnalysisList = [];
  let evaluatedCount = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let blankCount = 0;

  activeStudents.forEach(st => {
    const res = studentResults[st.id];
    if (!res) return;

    const hasAnswers = res.answers && Object.keys(res.answers).length > 0;
    const hasScores = (res.score !== undefined && res.score !== '' && res.score !== null) ||
                      (res.correct !== undefined && res.correct !== '');

    if (!hasAnswers && !hasScores) return;

    evaluatedCount++;

    let studentAns = '';
    if (hasAnswers) {
      if (isMulti) {
        studentAns = extractAnswerForSubj(res.answers, null, currentSubj, boardQaActiveSubjIdx, boardQaActiveQNum, cumulativeOffset);
      } else {
        studentAns = String(res.answers[boardQaActiveQNum] || res.answers[String(boardQaActiveQNum)] || '');
      }
      studentAns = String(studentAns || '').trim().toUpperCase();
      if (studentAns === 'MULTIPLE') studentAns = '';
    }

    let status = 'blank';
    if (!hasAnswers) {
      status = 'no_data';
    } else if (!studentAns) {
      status = 'blank';
      blankCount++;
      choiceStats['BOŞ'] = (choiceStats['BOŞ'] || 0) + 1;
    } else if (correctAns && studentAns === correctAns) {
      status = 'correct';
      correctCount++;
      if (choiceStats[studentAns] !== undefined) choiceStats[studentAns]++;
      else choiceStats[studentAns] = 1;
    } else {
      status = 'wrong';
      wrongCount++;
      if (choiceStats[studentAns] !== undefined) choiceStats[studentAns]++;
      else choiceStats[studentAns] = 1;
    }

    studentAnalysisList.push({
      student: st,
      answer: studentAns,
      status: status,
      hasAnswers: hasAnswers,
      score: res.score !== undefined && res.score !== '' ? res.score : '-'
    });
  });

  const totalErrors = wrongCount + blankCount;
  const successPercent = evaluatedCount > 0 ? Math.round((correctCount / evaluatedCount) * 100) : 0;
  const wrongPercent = evaluatedCount > 0 ? Math.round((wrongCount / evaluatedCount) * 100) : 0;
  const blankPercent = evaluatedCount > 0 ? Math.round((blankCount / evaluatedCount) * 100) : 0;
  const totalErrorPercent = evaluatedCount > 0 ? Math.round((totalErrors / evaluatedCount) * 100) : 0;

  // En çok düşülen çeldirici
  let topDistractor = null;
  let maxDistractorCount = 0;
  letters.forEach(letter => {
    if (letter !== correctAns && (choiceStats[letter] || 0) > maxDistractorCount) {
      maxDistractorCount = choiceStats[letter];
      topDistractor = letter;
    }
  });

  // 4. Hero Kart ve Başlıkları Güncelle
  const qTitleEl = document.getElementById('board-qa-q-title');
  const qSubjBadgeEl = document.getElementById('board-qa-q-subject-badge');
  const correctLetterEl = document.getElementById('board-qa-correct-letter');

  if (qTitleEl) {
    qTitleEl.innerHTML = `Soru ${boardQaActiveQNum} <span style="font-size: 0.95rem; font-weight: 600; color: var(--text-muted); margin-left: 0.5rem;">(${isMulti ? currentSubj.name : 'Genel Soru'})</span>`;
  }
  if (qSubjBadgeEl) {
    qSubjBadgeEl.textContent = isMulti ? currentSubj.name : (activeExam.subject || 'Ders');
  }
  if (correctLetterEl) {
    correctLetterEl.textContent = correctAns || '-';
  }

  const statPartEl = document.getElementById('board-qa-stat-participants');
  const statWrongEl = document.getElementById('board-qa-stat-wrong');
  const statBlankEl = document.getElementById('board-qa-stat-blank');
  const statTotalErrorsEl = document.getElementById('board-qa-stat-total-errors');
  const statCorrectEl = document.getElementById('board-qa-stat-correct');

  if (statPartEl) statPartEl.textContent = `${evaluatedCount} Öğrenci`;
  if (statWrongEl) statWrongEl.innerHTML = `${wrongCount} <span style="font-size: 0.75rem; font-weight: 600;">(%${wrongPercent})</span>`;
  if (statBlankEl) statBlankEl.innerHTML = `${blankCount} <span style="font-size: 0.75rem; font-weight: 600;">(%${blankPercent})</span>`;
  if (statTotalErrorsEl) statTotalErrorsEl.innerHTML = `${totalErrors} <span style="font-size: 0.75rem; font-weight: 600;">(%${totalErrorPercent})</span>`;
  if (statCorrectEl) statCorrectEl.innerHTML = `${correctCount} <span style="font-size: 0.75rem; font-weight: 600;">(%${successPercent})</span>`;

  // 5. Şık Dağılımı
  const choicesContainer = document.getElementById('board-qa-choices-breakdown-container');
  if (choicesContainer) {
    let chipsHtml = '';
    letters.forEach(l => {
      const cnt = choiceStats[l] || 0;
      const pct = evaluatedCount > 0 ? Math.round((cnt / evaluatedCount) * 100) : 0;
      const isCorrect = (l === correctAns);
      const isTopWrong = (l === topDistractor && maxDistractorCount > 0);

      let styleStr = 'background: #f8fafc; border: 1px solid #cbd5e1; color: #334155;';
      if (isCorrect) {
        styleStr = 'background: #dcfce7; border: 1.5px solid #22c55e; color: #15803d; font-weight: 800;';
      } else if (isTopWrong) {
        styleStr = 'background: #fee2e2; border: 1.5px solid #ef4444; color: #b91c1c; font-weight: 800;';
      }

      chipsHtml += `
        <div class="board-choice-chip" style="${styleStr}">
          <span style="font-size: 0.95rem;">${l}</span>
          <span>: <strong>${cnt}</strong> <span style="font-size: 0.72rem; opacity: 0.85;">(%${pct})</span></span>
          ${isCorrect ? '<span style="font-size: 0.72rem; margin-left: 2px;">✓ Doğru</span>' : ''}
          ${isTopWrong ? '<span style="font-size: 0.72rem; margin-left: 2px;">⚠️ Çeldirici</span>' : ''}
        </div>
      `;
    });

    const blankCnt = choiceStats['BOŞ'] || 0;
    const blankPct = evaluatedCount > 0 ? Math.round((blankCnt / evaluatedCount) * 100) : 0;
    chipsHtml += `
      <div class="board-choice-chip" style="background: #f1f5f9; border: 1px solid #94a3b8; color: #475569;">
        <span>⚪ Boş: <strong>${blankCnt}</strong> <span style="font-size: 0.72rem; opacity: 0.85;">(%${blankPct})</span></span>
      </div>
    `;

    let distractorNotice = '';
    if (topDistractor && maxDistractorCount > 1) {
      const dPct = evaluatedCount > 0 ? Math.round((maxDistractorCount / evaluatedCount) * 100) : 0;
      distractorNotice = `
        <div style="font-size: 0.8rem; color: #b91c1c; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-top: 6px;">
          <span>⚠️ <strong>Tahta Notu:</strong> Sınıfın %${dPct}'i (${maxDistractorCount} öğrenci) <strong>${topDistractor}</strong> çeldiricisine düşmüştür. Tahtada bu şıkkın neden yanlış olduğunu özellikle vurgulayabilirsiniz.</span>
        </div>
      `;
    }

    choicesContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">📊 Şık Dağılımı:</span>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
          ${chipsHtml}
        </div>
      </div>
      ${distractorNotice}
    `;
  }

  // 6. Soru Gezinme Rozetleri (Question Pills)
  const pillsContainer = document.getElementById('board-qa-question-pills');
  const questionSelect = document.getElementById('board-qa-question-select');

  if (pillsContainer) {
    let pillsHtml = '';
    for (let q = 1; q <= qCount; q++) {
      let qErrors = 0;
      let qTotal = 0;
      const cAns = isMulti
        ? findCorrectAnswerForKey(answerKey, currentSubj, boardQaActiveSubjIdx, q, cumulativeOffset)
        : String(answerKey[q] || answerKey[String(q)] || '').trim().toUpperCase();

      activeStudents.forEach(st => {
        const res = studentResults[st.id];
        if (!res || !res.answers) return;
        qTotal++;
        let ans = isMulti
          ? extractAnswerForSubj(res.answers, null, currentSubj, boardQaActiveSubjIdx, q, cumulativeOffset)
          : String(res.answers[q] || res.answers[String(q)] || '');
        ans = String(ans || '').trim().toUpperCase();
        if (ans === 'MULTIPLE') ans = '';

        if (!ans || (cAns && ans !== cAns)) {
          qErrors++;
        }
      });

      const errRate = qTotal > 0 ? (qErrors / qTotal) : 0;
      let errClass = 'error-low';
      if (errRate >= 0.5) errClass = 'error-high';
      else if (errRate >= 0.25) errClass = 'error-mid';

      const isActive = (q === boardQaActiveQNum);

      pillsHtml += `
        <button type="button" class="board-q-pill ${errClass} ${isActive ? 'active' : ''}" data-q-num="${q}" title="Soru ${q} (${qErrors} Hata / ${qTotal} Katılan • Doğru: ${cAns || '-'})">
          <span>${q}</span>
          ${qErrors > 0 && !isActive ? `<span style="font-size: 0.62rem; line-height: 1; font-weight: 700; opacity: 0.85;">${qErrors}❌</span>` : ''}
        </button>
      `;
    }
    pillsContainer.innerHTML = pillsHtml;

    pillsContainer.querySelectorAll('.board-q-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const qNum = parseInt(btn.getAttribute('data-q-num'), 10) || 1;
        boardQaActiveQNum = qNum;
        renderBoardQuestionAnalysis();
      });
    });
  }

  // Hızlı Seçim Dropdown
  if (questionSelect) {
    let selHtml = '';
    for (let q = 1; q <= qCount; q++) {
      const cAns = isMulti
        ? findCorrectAnswerForKey(answerKey, currentSubj, boardQaActiveSubjIdx, q, cumulativeOffset)
        : String(answerKey[q] || answerKey[String(q)] || '').trim().toUpperCase();
      selHtml += `<option value="${q}" ${q === boardQaActiveQNum ? 'selected' : ''}>Soru ${q} (Doğru: ${cAns || '-'})</option>`;
    }
    questionSelect.innerHTML = selHtml;
  }

  // 7. Filtre Rozet Sayıları
  const badgeErrors = document.getElementById('board-qa-badge-errors');
  const badgeWrong = document.getElementById('board-qa-badge-wrong');
  const badgeBlank = document.getElementById('board-qa-badge-blank');
  const badgeCorrect = document.getElementById('board-qa-badge-correct');
  const badgeAll = document.getElementById('board-qa-badge-all');

  if (badgeErrors) badgeErrors.textContent = totalErrors;
  if (badgeWrong) badgeWrong.textContent = wrongCount;
  if (badgeBlank) badgeBlank.textContent = blankCount;
  if (badgeCorrect) badgeCorrect.textContent = correctCount;
  if (badgeAll) badgeAll.textContent = evaluatedCount;

  // 8. Öğrenci Listesini Çiz
  renderBoardStudentsGrid(studentAnalysisList, correctAns);

  if (boardPipWindow && !boardPipWindow.closed) {
    renderPipContent(boardPipWindow);
  }

  if (window.safeCreateIcons) window.safeCreateIcons();
  else if (window.lucide) window.lucide.createIcons();
}

function renderBoardStudentsGrid(studentAnalysisList, correctAns) {
  const container = document.getElementById('board-qa-students-grid');
  if (!container) return;

  const q = (boardQaSearchTerm || '').trim().toLowerCase();

  // Filtreleme
  let filtered = studentAnalysisList.filter(item => {
    if (boardQaActiveFilter === 'all_errors') {
      if (item.status !== 'wrong' && item.status !== 'blank') return false;
    } else if (boardQaActiveFilter === 'wrong') {
      if (item.status !== 'wrong') return false;
    } else if (boardQaActiveFilter === 'blank') {
      if (item.status !== 'blank') return false;
    } else if (boardQaActiveFilter === 'correct') {
      if (item.status !== 'correct') return false;
    }

    if (q) {
      const stName = `${item.student.name || ''} ${item.student.surname || ''}`.toLowerCase();
      const stNo = String(item.student.number || '').toLowerCase();
      if (!stName.includes(q) && !stNo.includes(q)) return false;
    }

    return true;
  });

  const statusWeight = { 'wrong': 1, 'blank': 2, 'no_data': 3, 'correct': 4 };
  filtered.sort((a, b) => {
    const wa = statusWeight[a.status] || 9;
    const wb = statusWeight[b.status] || 9;
    if (wa !== wb) return wa - wb;
    const numA = parseInt(a.student.number, 10) || 9999;
    const numB = parseInt(b.student.number, 10) || 9999;
    if (numA !== numB) return numA - numB;
    return (a.student.name || '').localeCompare(b.student.name || '', 'tr');
  });

  if (filtered.length === 0) {
    if (studentAnalysisList.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">ℹ️</div>
          <p style="font-weight: 700; font-size: 1rem; color: var(--text-primary); margin-bottom: 0.35rem;">Bu Sınavda Henüz Öğrenci Cevap Verisi Bulunmuyor</p>
          <span style="font-size: 0.85rem; max-width: 400px; display: block; margin: 0 auto;">Optik formları yükleyerek veya öğrenci tablosundaki 'Optik Gir' butonunu kullanarak öğrencilerin soru bazlı cevaplarını kaydedebilirsiniz.</span>
        </div>
      `;
    } else if (boardQaActiveFilter === 'all_errors' || boardQaActiveFilter === 'wrong' || boardQaActiveFilter === 'blank') {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; color: #15803d; background: rgba(16, 185, 129, 0.06); border: 1.5px dashed #86efac; border-radius: 10px;">
          <div style="font-size: 2.4rem; margin-bottom: 0.5rem;">🎉</div>
          <p style="font-weight: 800; font-size: 1.15rem; margin-bottom: 0.25rem;">Harika! Bu Soruda Hata Yapan Öğrenci Yok</p>
          <span style="font-size: 0.85rem; color: #166534;">Sınıftaki tüm öğrenciler bu soruyu eksiksiz ve doğru yanıtladı.</span>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
          <p style="font-weight: 600;">Seçilen filtreye veya aramaya uygun öğrenci bulunamadı.</p>
        </div>
      `;
    }
    return;
  }

  let html = '';
  filtered.forEach(item => {
    const st = item.student;
    const sName = (st && st.name) ? String(st.name) : '';
    const sSurname = (st && st.surname) ? String(st.surname) : '';
    const initials = `${sName[0] || ''}${sSurname[0] || ''}`;
    const avatarHtml = (st && st.photo)
      ? `<img src="${st.photo}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 50%; flex-shrink: 0;">`
      : `<div style="width: 36px; height: 36px; font-size: 0.82rem; font-weight: 700; background: var(--primary-light, #e0e7ff); color: var(--primary, #4338ca); border-radius: 50%; display: flex; align-items: center; justify-content: center; text-transform: uppercase; flex-shrink: 0;">${initials}</div>`;

    let cardClass = '';
    let badgeHtml = '';

    if (item.status === 'wrong') {
      cardClass = 'is-wrong';
      badgeHtml = `
        <div style="text-align: right; flex-shrink: 0;">
          <span style="background: #fee2e2; border: 1.5px solid #ef4444; color: #b91c1c; padding: 3px 8px; border-radius: 6px; font-size: 0.82rem; font-weight: 800; display: inline-flex; align-items: center; gap: 3px;">
            ❌ <b>${item.answer}</b> Şıkkı
          </span>
          ${correctAns ? `<div style="font-size: 0.7rem; color: #15803d; font-weight: 700; margin-top: 2px;">(Doğru: ${correctAns})</div>` : ''}
        </div>
      `;
    } else if (item.status === 'blank') {
      cardClass = 'is-blank';
      badgeHtml = `
        <div style="text-align: right; flex-shrink: 0;">
          <span style="background: #f1f5f9; border: 1.5px solid #94a3b8; color: #475569; padding: 3px 8px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">
            ⚪ Boş Bıraktı
          </span>
          ${correctAns ? `<div style="font-size: 0.7rem; color: #15803d; font-weight: 700; margin-top: 2px;">(Doğru: ${correctAns})</div>` : ''}
        </div>
      `;
    } else if (item.status === 'correct') {
      cardClass = 'is-correct';
      badgeHtml = `
        <div style="text-align: right; flex-shrink: 0;">
          <span style="background: #dcfce7; border: 1.5px solid #22c55e; color: #15803d; padding: 3px 8px; border-radius: 6px; font-size: 0.82rem; font-weight: 800; display: inline-flex; align-items: center; gap: 3px;">
            ✓ Doğru (${item.answer})
          </span>
        </div>
      `;
    } else {
      badgeHtml = `
        <div style="text-align: right; flex-shrink: 0;">
          <span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Cevap Yok</span>
        </div>
      `;
    }

    html += `
      <div class="board-student-card ${cardClass}">
        <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 0; flex: 1;">
          ${avatarHtml}
          <div style="min-width: 0; flex: 1;">
            <div style="font-weight: 800; font-size: 0.92rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${sName} ${sSurname}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-top: 2px;">
              ${st.number ? `<span style="background: var(--bg-primary); border: 1px solid var(--border-color); padding: 0 5px; border-radius: 4px; font-weight: 600;">No: ${st.number}</span>` : ''}
              <span>Net Puan: <strong>${item.score}</strong></span>
            </div>
          </div>
        </div>
        ${badgeHtml}
      </div>
    `;
  });

  container.innerHTML = html;
}

function copyBoardQaStudentList() {
  if (!activeExam) return;
  const state = stateManager.loadState();
  const isMiddle = state.educationLevel === 'middle';
  const examBranch = activeExam.branch || '';
  const isMulti = !!(activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0);

  const activeStudents = (state.students || []).filter(student => {
    return !isMiddle || !examBranch || student.branch === examBranch;
  });

  let currentSubj = null;
  let cumulativeOffset = 0;
  if (isMulti) {
    currentSubj = activeExam.subjects[boardQaActiveSubjIdx] || activeExam.subjects[0];
    for (let i = 0; i < boardQaActiveSubjIdx; i++) {
      cumulativeOffset += activeExam.subjects[i].questionCount;
    }
  } else {
    currentSubj = { name: activeExam.subject || 'Ders' };
  }

  const answerKey = activeExam.answerKey || {};
  let correctAns = isMulti
    ? findCorrectAnswerForKey(answerKey, currentSubj, boardQaActiveSubjIdx, boardQaActiveQNum, cumulativeOffset)
    : String(answerKey[boardQaActiveQNum] || answerKey[String(boardQaActiveQNum)] || '').trim().toUpperCase();

  const lines = [
    `📌 ${activeExam.examName || 'Haftalık Sınav'} - ${currentSubj ? currentSubj.name + ' ' : ''}Soru ${boardQaActiveQNum}`,
    `🔑 Doğru Cevap: ${correctAns || '-'}`,
    `----------------------------------------`
  ];

  const studentResults = activeExam.studentResults || {};
  const wrongStudents = [];
  const blankStudents = [];

  activeStudents.forEach(st => {
    const res = studentResults[st.id];
    if (!res || !res.answers) return;
    let ans = isMulti
      ? extractAnswerForSubj(res.answers, null, currentSubj, boardQaActiveSubjIdx, boardQaActiveQNum, cumulativeOffset)
      : String(res.answers[boardQaActiveQNum] || res.answers[String(boardQaActiveQNum)] || '');
    ans = String(ans || '').trim().toUpperCase();
    if (ans === 'MULTIPLE') ans = '';

    const fullName = `${st.name || ''} ${st.surname || ''}`.trim();
    const noStr = st.number ? ` (No: ${st.number})` : '';

    if (!ans) {
      blankStudents.push(`${fullName}${noStr}`);
    } else if (correctAns && ans !== correctAns) {
      wrongStudents.push(`${fullName}${noStr} -> İşaretlediği: ${ans}`);
    }
  });

  if (wrongStudents.length > 0) {
    lines.push(`❌ Yanlış Yapanlar (${wrongStudents.length}):`);
    wrongStudents.forEach(s => lines.push(`  • ${s}`));
  } else {
    lines.push(`❌ Yanlış Yapanlar: Yok (0)`);
  }

  if (blankStudents.length > 0) {
    lines.push(`⚪ Boş Bırakanlar (${blankStudents.length}):`);
    blankStudents.forEach(s => lines.push(`  • ${s}`));
  } else {
    lines.push(`⚪ Boş Bırakanlar: Yok (0)`);
  }

  const textToCopy = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      const msg = 'Soru hata analizi panoya kopyalandı.';
      if (toastCallback) toastCallback(msg, 'success');
      else if (window.showToast) window.showToast(msg, 'success');
    }).catch(() => {
      prompt('Öğrenci listesi:', textToCopy);
    });
  } else {
    prompt('Öğrenci listesi:', textToCopy);
  }
}

window.openBoardQuestionAnalysisModal = openBoardQuestionAnalysisModal;
window.closeBoardQuestionAnalysisModal = closeBoardQuestionAnalysisModal;

// ==========================================================================
// HER ZAMAN EN ÜSTTE YÜZEN MİNİ PENCERE MOTORU (ALWAYS-ON-TOP PiP / POPUP)
// ==========================================================================
let boardPipWindow = null;

async function openBoardQuestionAnalysisPip(examId) {
  const state = stateManager.loadState();
  if (examId) {
    const found = (state.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
    if (found) activeExam = found;
  }
  if (!activeExam) {
    if (window.activeWeeklyExam) {
      activeExam = window.activeWeeklyExam;
    } else if (Array.isArray(state.weeklyEvaluations) && state.weeklyEvaluations.length > 0) {
      activeExam = state.weeklyEvaluations[0];
    }
  }

  if (!activeExam) {
    const msg = 'Lütfen önce incelenecek bir sınav seçin!';
    if (toastCallback) toastCallback(msg, 'warning');
    else if (window.showToast) window.showToast(msg, 'warning');
    return;
  }

  window.activeWeeklyExam = activeExam;

  // Eğer zaten açıksa öne getir
  if (boardPipWindow && !boardPipWindow.closed) {
    try {
      boardPipWindow.focus();
      renderPipContent(boardPipWindow);
      return;
    } catch (e) {}
  }

  const width = 380;
  const height = 620;
  let win = null;

  // 1. Chrome / Edge: Document Picture-in-Picture API (Gerçek OS Düzeyinde Always-on-Top!)
  if ('documentPictureInPicture' in window && typeof window.documentPictureInPicture.requestWindow === 'function') {
    try {
      win = await window.documentPictureInPicture.requestWindow({
        width: width,
        height: height
      });
    } catch (err) {
      console.warn('documentPictureInPicture açılamadı, standart pop-up pencere deneniyor:', err);
    }
  }

  // 2. Standart Bağımsız Pop-up Pencere (Safari, Firefox ve genel tarayıcı desteği)
  if (!win) {
    const left = Math.max(10, (window.screen.availWidth || window.screen.width) - width - 20);
    const top = 80;
    try {
      win = window.open('', 'SinifAsistaniPiP', `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`);
    } catch (err) {
      console.error('window.open hatası:', err);
    }
  }

  if (!win) {
    const msg = 'Açılır pencere engellendi! Lütfen tarayıcınızın adres çubuğundan pop-up pencerelere izin verin.';
    if (toastCallback) toastCallback(msg, 'warning');
    else if (window.showToast) window.showToast(msg, 'warning');
    return;
  }

  boardPipWindow = win;

  // Stilleri aktar
  setupPipWindowStyles(win);

  // İçeriği çiz
  renderPipContent(win);

  // Büyük modal açıksa arka planı kapat
  closeBoardQuestionAnalysisModal();

  // Pencere kapandığında referansı temizle
  win.addEventListener('pagehide', () => {
    boardPipWindow = null;
  });
  win.addEventListener('unload', () => {
    boardPipWindow = null;
  });
}

function setupPipWindowStyles(win) {
  try {
    const doc = win.document;
    doc.title = '📌 Soru Analizi (Yüzen Mini Mod)';

    // Ana belgedeki stilleri kopyala
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const clone = doc.createElement('link');
      clone.rel = 'stylesheet';
      clone.href = link.href;
      doc.head.appendChild(clone);
    });

    document.querySelectorAll('style').forEach(st => {
      doc.head.appendChild(st.cloneNode(true));
    });

    const pipStyle = doc.createElement('style');
    pipStyle.textContent = `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        background: #f8fafc !important;
        color: #0f172a !important;
        font-size: 13px !important;
        user-select: none !important;
      }
      .pip-wrapper {
        display: flex;
        flex-direction: column;
        height: 100vh;
        box-sizing: border-box;
      }
      .pip-header {
        background: linear-gradient(135deg, #1e1b4b, #312e81);
        color: #ffffff;
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }
      .pip-subj-bar {
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        padding: 5px 8px;
        display: flex;
        gap: 5px;
        overflow-x: auto;
        flex-shrink: 0;
      }
      .pip-subj-btn {
        padding: 3px 8px;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #1e293b;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        transition: all 0.15s;
      }
      .pip-subj-btn.active {
        background: #4338ca;
        color: #ffffff;
        border-color: #312e81;
      }
      .pip-nav-bar {
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        padding: 7px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      .pip-nav-btn {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #0f172a;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 11.5px;
        cursor: pointer;
      }
      .pip-nav-btn:hover {
        background: #e2e8f0;
      }
      .pip-select {
        flex: 1;
        padding: 4px 6px;
        font-size: 12px;
        font-weight: 700;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #0f172a;
      }
      .pip-hero {
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        padding: 8px 12px;
        flex-shrink: 0;
      }
      .pip-filter-bar {
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        padding: 5px 8px;
        display: flex;
        gap: 4px;
        overflow-x: auto;
        flex-shrink: 0;
      }
      .pip-filter-btn {
        padding: 3px 8px;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #475569;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .pip-filter-btn.active {
        background: #1e1b4b;
        color: #ffffff;
        border-color: #1e1b4b;
      }
      .pip-students-container {
        flex: 1;
        overflow-y: auto;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        background: #f8fafc;
      }
      .pip-student-item {
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 7px;
        padding: 6px 9px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
      }
      .pip-student-item.is-wrong {
        border-color: #fca5a5;
        background: #fef2f2;
      }
      .pip-student-item.is-blank {
        border-color: #cbd5e1;
        background: #f8fafc;
      }
      .pip-student-item.is-correct {
        border-color: #86efac;
        background: #f0fdf4;
      }
      .pip-footer {
        background: #ffffff;
        border-top: 1px solid #e2e8f0;
        padding: 5px 10px;
        font-size: 10px;
        color: #64748b;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }
    `;
    doc.head.appendChild(pipStyle);
  } catch (e) {
    console.error('setupPipWindowStyles hatası:', e);
  }
}

function renderPipContent(win) {
  if (!win || win.closed || !activeExam) return;

  try {
    const doc = win.document;
    const state = stateManager.loadState();
    const isMiddle = state.educationLevel === 'middle';
    const examBranch = activeExam.branch || '';
    const isMulti = !!(activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0);

    const activeStudents = (state.students || []).filter(student => {
      return !isMiddle || !examBranch || student.branch === examBranch;
    });

    const studentResults = activeExam.studentResults || {};
    const answerKey = activeExam.answerKey || {};

    let currentSubj = null;
    let cumulativeOffset = 0;
    let qCount = 20;

    if (isMulti) {
      if (boardQaActiveSubjIdx >= activeExam.subjects.length) boardQaActiveSubjIdx = 0;
      currentSubj = activeExam.subjects[boardQaActiveSubjIdx];
      qCount = currentSubj ? currentSubj.questionCount : 1;
      for (let i = 0; i < boardQaActiveSubjIdx; i++) {
        cumulativeOffset += activeExam.subjects[i].questionCount;
      }
    } else {
      qCount = parseInt(activeExam.totalQuestions, 10) || 20;
      currentSubj = {
        id: 'single',
        name: activeExam.subject || activeExam.examName || 'Ders',
        questionCount: qCount
      };
    }

    if (boardQaActiveQNum < 1) boardQaActiveQNum = 1;
    if (boardQaActiveQNum > qCount) boardQaActiveQNum = qCount;

    // Doğru cevap
    let correctAns = '';
    if (isMulti) {
      correctAns = findCorrectAnswerForKey(answerKey, currentSubj, boardQaActiveSubjIdx, boardQaActiveQNum, cumulativeOffset);
    } else {
      correctAns = String(answerKey[boardQaActiveQNum] || answerKey[String(boardQaActiveQNum)] || '').trim().toUpperCase();
    }

    // Katılan öğrenci cevap analizi
    const choicesCount = parseInt(activeExam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
    const choiceStats = { 'BOŞ': 0 };
    letters.forEach(l => choiceStats[l] = 0);

    const studentAnalysisList = [];
    let evaluatedCount = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;

    activeStudents.forEach(st => {
      const res = studentResults[st.id];
      if (!res) return;

      const hasAnswers = res.answers && Object.keys(res.answers).length > 0;
      const hasScores = (res.score !== undefined && res.score !== '' && res.score !== null) ||
                        (res.correct !== undefined && res.correct !== '');

      if (!hasAnswers && !hasScores) return;

      evaluatedCount++;

      let studentAns = '';
      if (hasAnswers) {
        if (isMulti) {
          studentAns = extractAnswerForSubj(res.answers, null, currentSubj, boardQaActiveSubjIdx, boardQaActiveQNum, cumulativeOffset);
        } else {
          studentAns = String(res.answers[boardQaActiveQNum] || res.answers[String(boardQaActiveQNum)] || '');
        }
        studentAns = String(studentAns || '').trim().toUpperCase();
        if (studentAns === 'MULTIPLE') studentAns = '';
      }

      let status = 'blank';
      if (!hasAnswers) {
        status = 'no_data';
      } else if (!studentAns) {
        status = 'blank';
        blankCount++;
        choiceStats['BOŞ'] = (choiceStats['BOŞ'] || 0) + 1;
      } else if (correctAns && studentAns === correctAns) {
        status = 'correct';
        correctCount++;
        if (choiceStats[studentAns] !== undefined) choiceStats[studentAns]++;
        else choiceStats[studentAns] = 1;
      } else {
        status = 'wrong';
        wrongCount++;
        if (choiceStats[studentAns] !== undefined) choiceStats[studentAns]++;
        else choiceStats[studentAns] = 1;
      }

      studentAnalysisList.push({
        student: st,
        answer: studentAns,
        status: status,
        score: res.score !== undefined && res.score !== '' ? res.score : '-'
      });
    });

    const totalErrors = wrongCount + blankCount;

    let topDistractor = null;
    let maxDistractorCount = 0;
    letters.forEach(letter => {
      if (letter !== correctAns && (choiceStats[letter] || 0) > maxDistractorCount) {
        maxDistractorCount = choiceStats[letter];
        topDistractor = letter;
      }
    });

    const getSubjEmoji = (name) => {
      const norm = (name || '').toLowerCase();
      if (norm.includes('türk') || norm.includes('turk')) return '📖';
      if (norm.includes('mat')) return '📐';
      if (norm.includes('fen')) return '🔬';
      if (norm.includes('sosyal') || norm.includes('tarih') || norm.includes('coğraf') || norm.includes('inkıl')) return '🌍';
      if (norm.includes('ing') || norm.includes('ingil') || norm.includes('dil')) return '🇬🇧';
      if (norm.includes('din')) return '🕌';
      return '📘';
    };

    let subjBarHtml = '';
    if (isMulti && activeExam.subjects.length > 1) {
      subjBarHtml = `<div class="pip-subj-bar">`;
      activeExam.subjects.forEach((subj, sIdx) => {
        const isActive = (sIdx === boardQaActiveSubjIdx);
        subjBarHtml += `
          <button type="button" class="pip-subj-btn ${isActive ? 'active' : ''}" data-subj="${sIdx}">
            <span>${getSubjEmoji(subj.name)}</span>
            <span>${subj.name}</span>
          </button>
        `;
      });
      subjBarHtml += `</div>`;
    }

    let selectOptionsHtml = '';
    for (let q = 1; q <= qCount; q++) {
      const cAns = isMulti
        ? findCorrectAnswerForKey(answerKey, currentSubj, boardQaActiveSubjIdx, q, cumulativeOffset)
        : String(answerKey[q] || answerKey[String(q)] || '').trim().toUpperCase();
      selectOptionsHtml += `<option value="${q}" ${q === boardQaActiveQNum ? 'selected' : ''}>Soru ${q} (D: ${cAns || '-'})</option>`;
    }

    let distractorHtml = '';
    if (topDistractor && maxDistractorCount > 1) {
      distractorHtml = `
        <div style="margin-top: 4px; font-size: 11px; color: #b91c1c; font-weight: 700;">
          ⚠️ Çeldirici: ${topDistractor} Şıkkı (${maxDistractorCount} Kişi)
        </div>
      `;
    }

    let filtered = studentAnalysisList.filter(item => {
      if (boardQaActiveFilter === 'all_errors') return item.status === 'wrong' || item.status === 'blank';
      if (boardQaActiveFilter === 'wrong') return item.status === 'wrong';
      if (boardQaActiveFilter === 'blank') return item.status === 'blank';
      if (boardQaActiveFilter === 'correct') return item.status === 'correct';
      return true;
    });

    const statusWeight = { 'wrong': 1, 'blank': 2, 'no_data': 3, 'correct': 4 };
    filtered.sort((a, b) => {
      const wa = statusWeight[a.status] || 9;
      const wb = statusWeight[b.status] || 9;
      if (wa !== wb) return wa - wb;
      const numA = parseInt(a.student.number, 10) || 9999;
      const numB = parseInt(b.student.number, 10) || 9999;
      if (numA !== numB) return numA - numB;
      return (a.student.name || '').localeCompare(b.student.name || '', 'tr');
    });

    let studentsHtml = '';
    if (filtered.length === 0) {
      if (boardQaActiveFilter === 'all_errors' || boardQaActiveFilter === 'wrong' || boardQaActiveFilter === 'blank') {
        studentsHtml = `
          <div style="text-align: center; padding: 2rem 1rem; color: #15803d; background: #f0fdf4; border: 1.5px dashed #86efac; border-radius: 8px;">
            <div style="font-size: 1.8rem; margin-bottom: 4px;">🎉</div>
            <div style="font-weight: 800; font-size: 12.5px;">Hata Yapan Öğrenci Yok!</div>
            <div style="font-size: 11px; color: #166534; margin-top: 2px;">Tüm sınıf soruyu doğru yanıtladı.</div>
          </div>
        `;
      } else {
        studentsHtml = `<div style="text-align: center; padding: 1.5rem; color: #64748b;">Öğrenci bulunamadı.</div>`;
      }
    } else {
      filtered.forEach(item => {
        const st = item.student;
        const sName = `${st.name || ''} ${st.surname || ''}`.trim();
        const noText = st.number ? `No: ${st.number}` : '';

        let badgeStr = '';
        let cardClass = '';

        if (item.status === 'wrong') {
          cardClass = 'is-wrong';
          badgeStr = `<span style="background: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 11px;">❌ ${item.answer} <span style="font-weight: 500; font-size: 10px;">(D: ${correctAns})</span></span>`;
        } else if (item.status === 'blank') {
          cardClass = 'is-blank';
          badgeStr = `<span style="background: #f1f5f9; border: 1px solid #94a3b8; color: #475569; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px;">⚪ Boş</span>`;
        } else if (item.status === 'correct') {
          cardClass = 'is-correct';
          badgeStr = `<span style="background: #dcfce7; border: 1px solid #22c55e; color: #15803d; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 11px;">✓ ${item.answer}</span>`;
        } else {
          badgeStr = `<span style="color: #94a3b8; font-size: 10px;">Cevap Yok</span>`;
        }

        studentsHtml += `
          <div class="pip-student-item ${cardClass}">
            <div style="min-width: 0; flex: 1;">
              <div style="font-weight: 800; color: #0f172a; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${sName}
              </div>
              ${noText ? `<div style="font-size: 10px; color: #64748b;">${noText}</div>` : ''}
            </div>
            ${badgeStr}
          </div>
        `;
      });
    }

    doc.body.innerHTML = `
      <div class="pip-wrapper">
        <!-- Header -->
        <div class="pip-header">
          <div style="min-width: 0;">
            <div style="font-weight: 800; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              📌 ${activeExam.examName || 'Haftalık Sınav'}
            </div>
            <div style="font-size: 10px; color: #c7d2fe; margin-top: 1px;">
              ${isMulti ? currentSubj.name + ' • ' : ''}Toplam ${qCount} Soru
            </div>
          </div>
          <span style="background: #f59e0b; color: #000; font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 999px; white-space: nowrap;">
            Always-on-Top
          </span>
        </div>

        <!-- Çoklu Ders Çubuğu -->
        ${subjBarHtml}

        <!-- Soru Gezinme Çubuğu -->
        <div class="pip-nav-bar">
          <button type="button" class="pip-nav-btn" id="pip-btn-prev">◀ Önceki</button>
          <select class="pip-select" id="pip-select-q">
            ${selectOptionsHtml}
          </select>
          <button type="button" class="pip-nav-btn" id="pip-btn-next">Sonraki ▶</button>
        </div>

        <!-- Soru Başlığı & Doğru Şık -->
        <div class="pip-hero">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 10.5px; color: #4338ca; font-weight: 700;">${isMulti ? currentSubj.name : 'Ders'}</div>
              <div style="font-size: 16px; font-weight: 900; color: #0f172a;">Soru ${boardQaActiveQNum}</div>
            </div>
            <div style="background: #10b981; color: #ffffff; padding: 3px 12px; border-radius: 8px; text-align: center; box-shadow: 0 2px 6px rgba(16,185,129,0.3);">
              <div style="font-size: 9px; font-weight: 700; text-transform: uppercase;">Doğru</div>
              <div style="font-size: 16px; font-weight: 900; line-height: 1;">${correctAns || '-'}</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 6px; font-size: 11px; font-weight: 700;">
            <span style="color: #dc2626;">❌ Yanlış: ${wrongCount}</span>
            <span style="color: #475569;">⚪ Boş: ${blankCount}</span>
            <span style="color: #15803d;">🟢 Doğru: ${correctCount}</span>
          </div>
          ${distractorHtml}
        </div>

        <!-- Filtre Butonları -->
        <div class="pip-filter-bar">
          <button type="button" class="pip-filter-btn ${boardQaActiveFilter === 'all_errors' ? 'active' : ''}" data-filter="all_errors">
            🔴 Hatalar (${totalErrors})
          </button>
          <button type="button" class="pip-filter-btn ${boardQaActiveFilter === 'wrong' ? 'active' : ''}" data-filter="wrong">
            ❌ Yanlış (${wrongCount})
          </button>
          <button type="button" class="pip-filter-btn ${boardQaActiveFilter === 'blank' ? 'active' : ''}" data-filter="blank">
            ⚪ Boş (${blankCount})
          </button>
          <button type="button" class="pip-filter-btn ${boardQaActiveFilter === 'correct' ? 'active' : ''}" data-filter="correct">
            🟢 Doğru (${correctCount})
          </button>
        </div>

        <!-- Öğrenci Listesi -->
        <div class="pip-students-container">
          ${studentsHtml}
        </div>

        <!-- Alt Bilgi -->
        <div class="pip-footer">
          <span>💡 Sol (←) / Sağ (→) tuşlarıyla soru değiştirin</span>
        </div>
      </div>
    `;

    const btnPrev = doc.getElementById('pip-btn-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        boardQaStepQuestion(-1);
      });
    }

    const btnNext = doc.getElementById('pip-btn-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        boardQaStepQuestion(1);
      });
    }

    const selQ = doc.getElementById('pip-select-q');
    if (selQ) {
      selQ.addEventListener('change', (e) => {
        boardQaActiveQNum = parseInt(e.target.value, 10) || 1;
        renderBoardQuestionAnalysis();
      });
    }

    doc.querySelectorAll('.pip-subj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        boardQaActiveSubjIdx = parseInt(btn.getAttribute('data-subj'), 10) || 0;
        boardQaActiveQNum = 1;
        renderBoardQuestionAnalysis();
      });
    });

    doc.querySelectorAll('.pip-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        boardQaActiveFilter = btn.getAttribute('data-filter') || 'all_errors';
        renderBoardQuestionAnalysis();
      });
    });

    doc.onkeydown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        boardQaStepQuestion(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        boardQaStepQuestion(1);
      }
    };

  } catch (err) {
    console.error('renderPipContent hatası:', err);
  }
}

window.openBoardQuestionAnalysisPip = openBoardQuestionAnalysisPip;

  window.setupWeeklyTab = setupWeeklyTab;
})();
