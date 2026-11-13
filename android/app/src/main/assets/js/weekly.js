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
let activeEditKeySubjId = '';

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

  const btnCopyAll = document.getElementById('btn-exam-copy-to-all');
  const applyAllLabel = document.getElementById('exam-key-apply-all-label');
  if (btnCopyAll) {
    btnCopyAll.style.display = (tempCreateExamType === 'multi') ? 'inline-block' : 'none';
  }
  if (applyAllLabel) {
    applyAllLabel.style.display = (tempCreateExamType === 'multi') ? 'flex' : 'none';
  }

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

  // 0. card.subjects nesnesi üzerinden ders adı ile doğrudan erişim
  if (card && card.subjects && typeof card.subjects === 'object') {
    // Doğrudan subj.name (Türkçe, Matematik, Fen Bilimleri vb.)
    if (card.subjects[subj.name] && typeof card.subjects[subj.name] === 'object') {
      const v = card.subjects[subj.name][q] ?? card.subjects[subj.name][String(q)];
      if (v !== undefined && v !== '') return String(v);
    }
    // Doğrudan subj.id (sub_0, sub_1, vb.)
    if (card.subjects[subj.id] && typeof card.subjects[subj.id] === 'object') {
      const v = card.subjects[subj.id][q] ?? card.subjects[subj.id][String(q)];
      if (v !== undefined && v !== '') return String(v);
    }
    // Fuzzy ders adı eşleşmesi
    const { norm: subjNorm, keywords } = getOmrSubjectBaseKeywords(subj.name);
    for (const sKey of Object.keys(card.subjects)) {
      const sNorm = normalizeOmrSubject(sKey);
      if (sNorm === subjNorm || sNorm.includes(subjNorm) || subjNorm.includes(sNorm) || keywords.some(kw => sNorm.includes(kw))) {
        const subObj = card.subjects[sKey];
        if (subObj && typeof subObj === 'object') {
          const v = subObj[q] ?? subObj[String(q)];
          if (v !== undefined && v !== '') return String(v);
        }
      }
    }
  }

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

  // 3. İç içe nesne eşleşmesi (card.subjects, card.subjectAnswers veya card.answers[subj.id])
  const nested = (card && card.subjects) || (card && card.subjectAnswers) || (card && typeof card.answers === 'object' ? card.answers : null);
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
    if (!prefixNorm) continue;

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
  if (found) return String(found).trim().toUpperCase();

  // 6. Soru numarası fallback (Örn: "Anahtar tüm derslerde aynı" ise veya sınav 1..N şeklinde tanımlanmışsa)
  if (answerKey[q]) return String(answerKey[q]).trim().toUpperCase();
  if (answerKey[String(q)]) return String(answerKey[String(q)]).trim().toUpperCase();

  return '';
}

function countExamDefinedAnswers(exam, keyObj) {
  if (!exam) return 0;
  const rawKey = keyObj || exam.answerKey || {};
  if (exam.isMultiSubject && Array.isArray(exam.subjects) && exam.subjects.length > 0) {
    let count = 0;
    let cum = 0;
    exam.subjects.forEach((s, idx) => {
      const qCount = parseInt(s.questionCount, 10) || 0;
      for (let q = 1; q <= qCount; q++) {
        if (findCorrectAnswerForKey(rawKey, s, idx, q, cum)) {
          count++;
        }
      }
      cum += qCount;
    });
    return count;
  }
  const totalQ = parseInt(exam.totalQuestions, 10) || 20;
  let count = 0;
  for (let q = 1; q <= totalQ; q++) {
    if (rawKey[q] || rawKey[String(q)]) count++;
  }
  return count;
}

// Serbest metinden (Örn: "1.a 2.a 3.b 4.b..." veya "AABBCCDDAA" veya "A, A, B...") cevap anahtarını ayrıştıran evrensel motor
function parseAnswerKeyText(rawText, choicesCount = 4) {
  if (!rawText || typeof rawText !== 'string') return {};
  const allowedLetters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
  const result = {};

  // 1. Durum: Numaralandırılmış format (örn: "1.a 2.a 3.b", "1-a", "1:b", "Soru 1: C", "1) a")
  const numberedPattern = /(?:^|[\s,;\n\r])(?:Soru\s*|S\s*)?(\d+)[\s.:\-=)]+([A-Ea-e])(?=[\s,;\n\r]|$)/gi;
  let match;
  let foundNumbered = false;
  while ((match = numberedPattern.exec(rawText)) !== null) {
    const qNum = parseInt(match[1], 10);
    const letter = match[2].toUpperCase();
    if (qNum > 0 && allowedLetters.includes(letter)) {
      result[qNum] = letter;
      foundNumbered = true;
    }
  }

  // Kullanıcı "10.10" veya benzeri yazmışsa ve 10 eksik kalmışsa metin içinde "10." sonrasındaki harfi veya 9'un devamını kontrol et
  if (!result[10]) {
    const m10 = rawText.match(/10[\s.:\-=)]+([A-Ea-e])/i);
    if (m10 && allowedLetters.includes(m10[1].toUpperCase())) {
      result[10] = m10[1].toUpperCase();
      foundNumbered = true;
    }
  }

  if (foundNumbered && Object.keys(result).length > 0) {
    return result;
  }

  // 2. Durum: Boşluk, virgül veya tire ile ayrılmış harfler (örn: "A A B B C C D D A A" veya "A, A, B, B...")
  const tokens = rawText.trim().split(/[\s,;:\n\r\t-]+/).filter(Boolean);
  const letterTokens = tokens.filter(t => t.length === 1 && allowedLetters.includes(t.toUpperCase()));
  if (letterTokens.length >= 2) {
    letterTokens.forEach((l, idx) => {
      result[idx + 1] = l.toUpperCase();
    });
    return result;
  }

  // 3. Durum: Bitişik harf dizisi (örn: "AABBCCDDAA" veya "AABCD")
  const cleanStr = rawText.replace(/[^A-Za-z]/g, '').toUpperCase();
  if (cleanStr.length >= 2) {
    let valid = true;
    for (let i = 0; i < cleanStr.length; i++) {
      if (!allowedLetters.includes(cleanStr[i])) {
        valid = false;
        break;
      }
    }
    if (valid) {
      for (let i = 0; i < cleanStr.length; i++) {
        result[i + 1] = cleanStr[i];
      }
      return result;
    }
  }

  return result;
}

window.normalizeOmrSubject = normalizeOmrSubject;
window.getOmrSubjectBaseKeywords = getOmrSubjectBaseKeywords;
window.extractAnswerForSubj = extractAnswerForSubj;
window.findCorrectAnswerForKey = findCorrectAnswerForKey;
window.countExamDefinedAnswers = countExamDefinedAnswers;
window.parseAnswerKeyText = parseAnswerKeyText;

function setupWeeklyTab(showToast) {
  toastCallback = showToast;

  // Sınav Ekleme Modalı Açılış
  if (btnAddWeeklyExam) {
    btnAddWeeklyExam.addEventListener('click', () => {
      if (formAddExam) formAddExam.reset();
      const durInput = document.getElementById('exam-duration-input');
      if (durInput) durInput.value = '40';
      const qInput = document.getElementById('exam-questions-input');
      if (qInput) qInput.value = '20';
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

  // Yeni Sınav Modalı - Metin Olarak Cevap Anahtarı Gir / Yapıştır & Tüm Derslere Uygula
  const btnExamCopyToAll = document.getElementById('btn-exam-copy-to-all');
  if (btnExamCopyToAll) {
    btnExamCopyToAll.addEventListener('click', () => {
      if (tempCreateExamType !== 'multi' || !Array.isArray(tempCreateExamSubjects)) return;
      const currentSubj = tempCreateExamSubjects.find(s => s.id === activeCreateExamSubjId) || tempCreateExamSubjects[0];
      if (!currentSubj) return;

      const currentSubjKey = {};
      for (let q = 1; q <= currentSubj.questionCount; q++) {
        const val = tempCreateExamKey[`${currentSubj.id}_${q}`] || tempCreateExamKey[`${currentSubj.name}_${q}`] || tempCreateExamKey[q];
        if (val) currentSubjKey[q] = val;
      }

      if (Object.keys(currentSubjKey).length === 0) {
        if (toastCallback) toastCallback(`Lütfen önce "${currentSubj.name}" dersi için şıkları belirleyin.`, 'warning');
        return;
      }

      tempCreateExamSubjects.forEach(subj => {
        for (let q = 1; q <= subj.questionCount; q++) {
          const srcVal = currentSubjKey[q];
          if (srcVal) {
            tempCreateExamKey[`${subj.id}_${q}`] = srcVal;
          }
        }
      });

      renderDesktopAnswerKeyGrid();
      if (toastCallback) toastCallback(`"${currentSubj.name}" dersinin cevap anahtarı tüm derslere uygulandı.`, 'success');
    });
  }

  const btnExamToggleTextKey = document.getElementById('btn-exam-toggle-text-key');
  const examKeyTextBox = document.getElementById('exam-key-text-box');
  const btnExamCancelTextKey = document.getElementById('btn-exam-cancel-text-key');
  const btnExamApplyTextKey = document.getElementById('btn-exam-apply-text-key');
  const examKeyTextInput = document.getElementById('exam-key-text-input');
  const examKeyApplyAllCheck = document.getElementById('exam-key-apply-all-check');

  if (btnExamToggleTextKey && examKeyTextBox) {
    btnExamToggleTextKey.addEventListener('click', () => {
      const isHidden = examKeyTextBox.style.display === 'none';
      examKeyTextBox.style.display = isHidden ? 'block' : 'none';
      if (isHidden && examKeyTextInput) {
        examKeyTextInput.focus();
      }
    });
  }
  if (btnExamCancelTextKey && examKeyTextBox) {
    btnExamCancelTextKey.addEventListener('click', () => {
      examKeyTextBox.style.display = 'none';
    });
  }

  if (btnExamApplyTextKey) {
    btnExamApplyTextKey.addEventListener('click', () => {
      const rawText = examKeyTextInput ? examKeyTextInput.value.trim() : '';
      if (!rawText) {
        if (toastCallback) toastCallback('Lütfen cevap anahtarını metin olarak girin veya yapıştırın!', 'warning');
        return;
      }

      const cInput = document.getElementById('exam-choices-count');
      const cCount = parseInt(cInput ? cInput.value : 4, 10) || 4;
      const parsedKey = parseAnswerKeyText(rawText, cCount);
      const parsedCount = Object.keys(parsedKey).length;

      if (parsedCount === 0) {
        if (toastCallback) toastCallback('Metinden hiçbir geçerli cevap algılanamadı! (Örn: 1.a 2.a 3.b ...)', 'error');
        return;
      }

      const isMulti = tempCreateExamType === 'multi';
      const applyAll = examKeyApplyAllCheck ? examKeyApplyAllCheck.checked : true;

      if (isMulti) {
        if (applyAll) {
          tempCreateExamSubjects.forEach(s => {
            for (let q = 1; q <= s.questionCount; q++) {
              if (parsedKey[q]) {
                tempCreateExamKey[`${s.id}_${q}`] = parsedKey[q];
              }
            }
          });
          if (toastCallback) toastCallback(`Cevap anahtarı (${parsedCount} soru) tüm derslere uygulandı!`, 'success');
        } else {
          const currentSubj = tempCreateExamSubjects.find(s => s.id === activeCreateExamSubjId) || tempCreateExamSubjects[0];
          for (let q = 1; q <= currentSubj.questionCount; q++) {
            if (parsedKey[q]) {
              tempCreateExamKey[`${currentSubj.id}_${q}`] = parsedKey[q];
            }
          }
          if (toastCallback) toastCallback(`Cevap anahtarı (${parsedCount} soru) "${currentSubj.name}" dersine uygulandı!`, 'success');
        }
      } else {
        const qInput = document.getElementById('exam-questions-input');
        const qCount = parseInt(qInput ? qInput.value : 20, 10) || 20;
        for (let q = 1; q <= qCount; q++) {
          if (parsedKey[q]) {
            tempCreateExamKey[String(q)] = parsedKey[q];
          }
        }
        if (toastCallback) toastCallback(`Cevap anahtarı (${parsedCount} soru) başarıyla aktarıldı!`, 'success');
      }

      if (examKeyTextBox) examKeyTextBox.style.display = 'none';
      if (examKeyTextInput) examKeyTextInput.value = '';
      renderDesktopAnswerKeyGrid();
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

      try {
        const nameInput = document.getElementById('exam-name-input');
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
          if (toastCallback) toastCallback('Lütfen sınav adını giriniz!', 'warning');
          return;
        }

        const weekInput = document.getElementById('exam-week-input');
        const week = weekInput ? weekInput.value : (stateManager.getSelectedWeek ? stateManager.getSelectedWeek() : '');
        const durationInput = document.getElementById('exam-duration-input');
        const duration = parseInt(durationInput ? durationInput.value : 40) || 40;
        const questionsInput = document.getElementById('exam-questions-input');
        const questions = parseInt(questionsInput ? questionsInput.value : 20) || 20;
        const wrongAffects = examWrongAffectsInput ? examWrongAffectsInput.checked : false;
        const penaltyInput = document.getElementById('exam-penalty-input');
        const penaltyRate = wrongAffects ? (parseInt(penaltyInput ? penaltyInput.value : 4) || 4) : 0;

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
          subjects = (tempCreateExamSubjects || []).map(s => ({
            id: s.id,
            name: String(s.name || '').trim() || 'Ders',
            questionCount: Math.max(1, parseInt(s.questionCount, 10) || 10)
          }));
          totalQ = subjects.reduce((sum, s) => sum + s.questionCount, 0);
        }

        const isMiddle = state.educationLevel === 'middle';
        const allClassStudents = (state.students || []).filter(student => {
          if (!student) return false;
          return !isMiddle || !examBranch || student.branch === examBranch;
        }).map(s => ({
          id: s.id,
          name: s.name,
          surname: s.surname || '',
          number: s.number || '',
          branch: s.branch || examBranch || ''
        }));

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
          classStudents: allClassStudents,
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

        // Canlı El Terminali Eşitlemesi (Buluta & Terminale Canlı Fırlat)
        if (window.CloudSync) {
          window.CloudSync.pushExam(examData).catch(() => {});
          if (typeof window.CloudSync.pushLiveExamCreated === 'function') {
            window.CloudSync.pushLiveExamCreated(examData, 'desktop').catch(() => {});
          }
        }

        if (toastCallback) {
          toastCallback(`"${name}" sınavı başarıyla oluşturuldu ve El Terminaline iletildi.`, 'success');
        }

        if (modalAddExam) modalAddExam.classList.remove('active');
        
        renderExamsList();
        openActiveExam(examData); // Sınav oluşturulunca otomatik aç

        const event = new CustomEvent('stateChanged');
        document.dispatchEvent(event);
      } catch (submitErr) {
        console.error('Sınav oluşturma hatası:', submitErr);
        if (toastCallback) {
          toastCallback('Sınav oluşturulurken bir hata oluştu: ' + (submitErr.message || submitErr), 'danger');
        }
      }
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
      window.activeWeeklyExam = null;
      weeklyCurrentSubView = 'exams';
      if (activeExamCard) activeExamCard.style.display = 'none';
      if (typeof updateWeeklySubViews === 'function') updateWeeklySubViews();
      renderExamsList();
    });
  }

  // Aktif Sınav Kaydetme Butonu
  if (btnSaveActiveExam) {
    btnSaveActiveExam.addEventListener('click', () => {
      if (!activeExam) return;

      const notes = activeExamNotes ? activeExamNotes.value.trim() : '';
      const rows = activeExamTableBody ? activeExamTableBody.querySelectorAll('tr') : [];

      // Mevcut kayıtları koruyarak başla (taranmış optikler ve diğer şube öğrencileri kaybolmasın)
      const examScores = { ...(activeExam.examScores || {}) };
      const studentResults = { ...(activeExam.studentResults || {}) };

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
          const wrong = parseInt(wrongInput ? wrongInput.value : 0) || 0;
          const net = parseFloat(netSpan ? netSpan.textContent : 0) || 0;
          const score = parseFloat(scoreSpan ? scoreSpan.textContent : 0) || 0;

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
          // Eğer önceden optik sonucu yoksa ve kutular silinmişse temizle
          if (!hasAnswers && existingRes.score === undefined) {
            delete examScores[studentId];
            delete studentResults[studentId];
          }
        }
      });

      activeExam.examScores = examScores;
      activeExam.studentResults = studentResults;
      activeExam.notes = notes;
      activeExam.updatedAt = new Date().toISOString();

      // Anlık görsel geri bildirim
      const origBtnHtml = btnSaveActiveExam.innerHTML;
      btnSaveActiveExam.disabled = true;
      btnSaveActiveExam.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Kaydedildi!`;
      setTimeout(() => {
        btnSaveActiveExam.disabled = false;
        btnSaveActiveExam.innerHTML = origBtnHtml;
        if (window.safeCreateIcons) window.safeCreateIcons();
      }, 1000);

      // saveExam kendi içinde stateChanged olayını fırlatır ve tabloyu/listeyi tek seferde günceller
      stateManager.saveExam(activeExam);

      // Canlı El Terminali Eşitlemesi (Arka planda asenkron fırlat)
      if (window.CloudSync) {
        window.CloudSync.pushExam(activeExam).catch(() => {});
        if (typeof window.CloudSync.pushLiveExamResults === 'function') {
          window.CloudSync.pushLiveExamResults(activeExam, 'desktop').catch(() => {});
        }
      }

      if (toastCallback) {
        toastCallback('Sınav sonuçları başarıyla kaydedildi ve El Terminaline aktarıldı.', 'success');
      }
    });
  }

  // Sınav Silme Butonu
  if (btnDeleteActiveExam) {
    btnDeleteActiveExam.addEventListener('click', async () => {
      if (!activeExam) return;

      const examNameToDelete = activeExam.examName || 'Bu sınavı';
      const examIdToDelete = activeExam.id;

      const confirmed = await window.showConfirmDialog({
        title: 'Sınavı Sil',
        message: `<strong>"${examNameToDelete}"</strong> sınavını ve bu sınava ait tüm öğrenci değerlendirme sonuçlarını tamamen silmek istediğinize emin misiniz?<br><span style="color:#ef4444; font-weight:700;">Bu işlem geri alınamaz!</span>`,
        confirmText: 'Sınavı Sil',
        cancelText: 'Vazgeç',
        type: 'danger'
      });
      if (!confirmed) return;

      stateManager.deleteExam(examIdToDelete);

      // Canlı El Terminali Eşitlemesi (Sınavı Terminalden ve Buluttan da Sil)
      if (window.CloudSync && typeof window.CloudSync.pushLiveExamDeleted === 'function') {
        window.CloudSync.pushLiveExamDeleted(examIdToDelete, examNameToDelete, 'desktop').catch(() => {});
      }

      activeExam = null;
      window.activeWeeklyExam = null;
      if (activeExamCard) activeExamCard.style.display = 'none';
      if (btnPrintReport) btnPrintReport.style.display = 'none';

      if (toastCallback) {
        toastCallback(`"${examNameToDelete}" sınavı başarıyla silindi ve El Terminalinden kaldırıldı.`, 'success');
      }

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

  function renderPrintModalCustomExamsChecklist(allExams) {
    const customBox = document.getElementById('print-modal-custom-exams-box');
    const customList = document.getElementById('print-modal-custom-exams-list');
    if (!customBox || !customList) return;

    customList.innerHTML = '';
    allExams.forEach((ex, idx) => {
      const formattedW = window.formatWeekTR ? window.formatWeekTR(ex.weekId, 'short') : (ex.weekId || '');
      const isChecked = examStatsCustomSelectedIds.size > 0
        ? examStatsCustomSelectedIds.has(String(ex.id))
        : (idx < 5);

      const label = document.createElement('label');
      label.style.cssText = 'display: flex; align-items: center; gap: 0.6rem; padding: 0.45rem 0.65rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); cursor: pointer; font-size: 0.82rem;';
      label.innerHTML = `
        <input type="checkbox" class="print-modal-custom-exam-chk" value="${ex.id}" ${isChecked ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary);">
        <span style="font-weight: 700; color: var(--primary);">#${idx + 1}</span>
        <span style="font-weight: 600; color: var(--text-primary); flex: 1;">${ex.examName || 'Sınav'}</span>
        ${ex.branch ? `<span class="badge" style="font-size: 0.68rem; padding: 0.1rem 0.35rem;">${ex.branch}</span>` : ''}
        <span style="font-size: 0.75rem; color: var(--text-muted);">${formattedW} • ${ex.totalQuestions || 0} Soru</span>
      `;
      customList.appendChild(label);
    });

    const btnSelAll = document.getElementById('btn-print-modal-select-all');
    const btnClrAll = document.getElementById('btn-print-modal-clear-all');
    if (btnSelAll) {
      btnSelAll.onclick = () => {
        customList.querySelectorAll('.print-modal-custom-exam-chk').forEach(chk => { chk.checked = true; });
      };
    }
    if (btnClrAll) {
      btnClrAll.onclick = () => {
        customList.querySelectorAll('.print-modal-custom-exam-chk').forEach(chk => { chk.checked = false; });
      };
    }
  }

  function openPrintWeeklyExamReportModal() {
    if (!printExamSelect) return;
    printExamSelect.innerHTML = '';

    const state = stateManager.loadState();
    const allExams = getSortedWeeklyExams(state);

    if (allExams.length === 0) {
      if (toastCallback) toastCallback('Henüz tanımlı sınav bulunmuyor!', 'warning');
      return;
    }

    const selectedWeek = stateManager.getSelectedWeek();
    const normSelected = window.normalizeWeekId ? window.normalizeWeekId(selectedWeek) : selectedWeek;
    const weekExams = allExams.filter(e => {
      const eNorm = window.normalizeWeekId ? window.normalizeWeekId(e.weekId) : e.weekId;
      return eNorm === normSelected;
    });

    // 1. Çoklu Sınav Sıralama ve İstatistik Raporları Grubu
    const multiGroup = document.createElement('optgroup');
    multiGroup.label = '📊 Sıralama ve İstatistik Raporları (Çoklu Sınav)';

    const optAllAvg = document.createElement('option');
    optAllAvg.value = 'all_avg';
    optAllAvg.textContent = `Tüm Sınavlar — Sıralama ve İstatistik Raporu (${allExams.length} Sınav)`;
    multiGroup.appendChild(optAllAvg);

    const optLast5 = document.createElement('option');
    optLast5.value = 'last_5';
    optLast5.textContent = `Son 5 Sınav — Sıralama ve İstatistik Raporu (${Math.min(5, allExams.length)} Sınav)`;
    multiGroup.appendChild(optLast5);

    const optLast10 = document.createElement('option');
    optLast10.value = 'last_10';
    optLast10.textContent = `Son 10 Sınav — Sıralama ve İstatistik Raporu (${Math.min(10, allExams.length)} Sınav)`;
    multiGroup.appendChild(optLast10);

    const optLast3 = document.createElement('option');
    optLast3.value = 'last_3';
    optLast3.textContent = `Son 3 Sınav — Sıralama ve İstatistik Raporu (${Math.min(3, allExams.length)} Sınav)`;
    multiGroup.appendChild(optLast3);

    const optCustom = document.createElement('option');
    optCustom.value = 'custom_select';
    optCustom.textContent = 'Seçeceğim Sınavlar — Özel Sınav Aralığı Raporu';
    multiGroup.appendChild(optCustom);

    if (weekExams.length > 0) {
      const optWeekAvg = document.createElement('option');
      optWeekAvg.value = 'week_avg';
      optWeekAvg.textContent = `Seçili Haftadaki Sınavlar (${weekExams.length} Sınav)`;
      multiGroup.appendChild(optWeekAvg);
    }

    printExamSelect.appendChild(multiGroup);

    // 2. Tek Sınav Sonuç Raporları Grubu
    const singleGroup = document.createElement('optgroup');
    singleGroup.label = '📝 Tek Sınav Sonuç Raporları';
    allExams.forEach((ex, idx) => {
      const opt = document.createElement('option');
      opt.value = ex.id;
      const wLabel = window.formatWeekTR ? window.formatWeekTR(ex.weekId, 'short') : (ex.weekId || '');
      opt.textContent = `#${idx + 1} ${ex.examName} (${ex.totalQuestions} Soru${wLabel ? ' • ' + wLabel : ''})`;
      if (activeExam && String(activeExam.id) === String(ex.id)) {
        opt.selected = true;
      }
      singleGroup.appendChild(opt);
    });
    printExamSelect.appendChild(singleGroup);

    if (!activeExam) {
      printExamSelect.value = 'all_avg';
    }

    renderPrintModalCustomExamsChecklist(allExams);

    const customBox = document.getElementById('print-modal-custom-exams-box');
    const syncCustomBoxVisibility = () => {
      if (customBox) {
        customBox.style.display = printExamSelect.value === 'custom_select' ? 'block' : 'none';
      }
    };
    printExamSelect.onchange = syncCustomBoxVisibility;
    syncCustomBoxVisibility();

    if (modalPrintWeeklyExamReport) {
      modalPrintWeeklyExamReport.classList.add('active');
    }
  }

  if (btnConfirmPrintExam) {
    btnConfirmPrintExam.addEventListener('click', () => {
      const selectedValue = printExamSelect.value;
      if (!selectedValue) return;

      const state = stateManager.loadState();
      const allExams = getSortedWeeklyExams(state);
      const selectedWeek = stateManager.getSelectedWeek();

      let examsToPrint = [];
      let isAverageReport = false;
      let reportTitle = '';
      let reportSubtitle = '';
      let examDetailText = '';
      let notes = '';

      if (selectedValue === 'week_avg') {
        isAverageReport = true;
        const normSelected = window.normalizeWeekId ? window.normalizeWeekId(selectedWeek) : selectedWeek;
        examsToPrint = allExams.filter(e => {
          const eNorm = window.normalizeWeekId ? window.normalizeWeekId(e.weekId) : e.weekId;
          return eNorm === normSelected;
        });
        const formattedWeek = window.formatWeekTR ? window.formatWeekTR(selectedWeek, 'full') : selectedWeek;
        reportTitle = 'SEÇİLİ HAFTA SINAV SIRALAMA VE İSTATİSTİK RAPORU';
        reportSubtitle = `Uygulama Dönemi: ${formattedWeek} | Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
        examDetailText = `Toplam ${examsToPrint.length} Sınavın Toplam ve Ağırlıklı Analizi`;
        notes = `Bu rapor, ${formattedWeek} döneminde uygulanan ${examsToPrint.length} sınavdaki öğrenci toplam doğru, toplam yanlış, toplam net ve soru ağırlıklı başarı puanlarını ((Toplam Net / Toplam Soru) x 100) puan üstünlüğüne göre sıralı olarak içerir.`;
      } else if (selectedValue === 'all_avg') {
        isAverageReport = true;
        examsToPrint = allExams;
        reportTitle = 'TÜM SINAVLAR ÖĞRENCİ SIRALAMA VE İSTATİSTİK RAPORU';
        reportSubtitle = `Tüm Dönem Sınavları | Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
        examDetailText = `Toplam ${examsToPrint.length} Sınavın Genel Sıralama ve İstatistikleri`;
        notes = `Öğrencilerin dönem başından itibaren girdikleri tüm sınavlardaki (${examsToPrint.length} sınav) toplam doğru, toplam yanlış, toplam net sayıları ve soru ağırlıklı başarı puanları ((Toplam Net / Toplam Soru) x 100) puan üstünlüğüne göre sıralanmıştır.`;
      } else if (selectedValue === 'last_5') {
        isAverageReport = true;
        examsToPrint = allExams.slice(0, 5);
        reportTitle = `SON ${examsToPrint.length} SINAV ÖĞRENCİ SIRALAMA VE İSTATİSTİK RAPORU`;
        reportSubtitle = `Son ${examsToPrint.length} Sınav Analizi | Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
        examDetailText = `Son ${examsToPrint.length} Sınavın Sıralama ve İstatistikleri`;
        notes = `Öğrencilerin son ${examsToPrint.length} sınavdaki toplam doğru, toplam yanlış, toplam net sayıları ve soru ağırlıklı başarı puanları ((Toplam Net / Toplam Soru) x 100) puan üstünlüğüne göre sıralanmıştır.`;
      } else if (selectedValue === 'last_10') {
        isAverageReport = true;
        examsToPrint = allExams.slice(0, 10);
        reportTitle = `SON ${examsToPrint.length} SINAV ÖĞRENCİ SIRALAMA VE İSTATİSTİK RAPORU`;
        reportSubtitle = `Son ${examsToPrint.length} Sınav Analizi | Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
        examDetailText = `Son ${examsToPrint.length} Sınavın Sıralama ve İstatistikleri`;
        notes = `Öğrencilerin son ${examsToPrint.length} sınavdaki toplam doğru, toplam yanlış, toplam net sayıları ve soru ağırlıklı başarı puanları ((Toplam Net / Toplam Soru) x 100) puan üstünlüğüne göre sıralanmıştır.`;
      } else if (selectedValue === 'last_3') {
        isAverageReport = true;
        examsToPrint = allExams.slice(0, 3);
        reportTitle = `SON ${examsToPrint.length} SINAV ÖĞRENCİ SIRALAMA VE İSTATİSTİK RAPORU`;
        reportSubtitle = `Son ${examsToPrint.length} Sınav Analizi | Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
        examDetailText = `Son ${examsToPrint.length} Sınavın Sıralama ve İstatistikleri`;
        notes = `Öğrencilerin son ${examsToPrint.length} sınavdaki toplam doğru, toplam yanlış, toplam net sayıları ve soru ağırlıklı başarı puanları ((Toplam Net / Toplam Soru) x 100) puan üstünlüğüne göre sıralanmıştır.`;
      } else if (selectedValue === 'custom_select') {
        isAverageReport = true;
        const checkedIds = new Set(
          Array.from(document.querySelectorAll('.print-modal-custom-exam-chk:checked')).map(el => String(el.value))
        );
        examsToPrint = allExams.filter(e => checkedIds.has(String(e.id)));
        if (examsToPrint.length === 0) {
          if (toastCallback) toastCallback('Lütfen rapora dahil edilecek en az bir sınav seçin!', 'warning');
          return;
        }
        reportTitle = `SEÇİLİ SINAVLAR (${examsToPrint.length} SINAV) SIRALAMA VE İSTATİSTİK RAPORU`;
        reportSubtitle = `Özel Sınav Aralığı (${examsToPrint.length} Sınav) | Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
        examDetailText = `Seçilen ${examsToPrint.length} Sınavın Sıralama ve İstatistikleri`;
        notes = `Seçilen ${examsToPrint.length} sınav (${examsToPrint.map(e => e.examName || 'Sınav').join(', ')}) kapsamında öğrencilerin toplam doğru, toplam yanlış, toplam net sayıları ve soru ağırlıklı başarı puanları ((Toplam Net / Toplam Soru) x 100) puan üstünlüğüne göre sıralanmıştır.`;
      } else {
        const targetExam = allExams.find(e => String(e.id) === String(selectedValue));
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
      
      const isMulti = !!activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0;
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

      const maxSubjQ = isMulti ? Math.max(...activeExam.subjects.map(s => parseInt(s.questionCount, 10) || 0)) : (parseInt(activeExam.totalQuestions, 10) || 20);
      const requiresSinglePage = maxSubjQ > 20 || (!isMulti && qCount > 40);

      const perPageInput = document.getElementById('optical-per-page-input');
      const tipEl = document.getElementById('optical-multi-page-tip');
      if (requiresSinglePage) {
        if (perPageInput) {
          perPageInput.value = '1';
          Array.from(perPageInput.options).forEach(opt => {
            if (opt.value !== '1') opt.disabled = true;
          });
        }
        if (tipEl) {
          tipEl.style.display = 'block';
          tipEl.innerHTML = `⚠️ Soru sayısı (ders başına > 20 soru) nedeniyle optik form güvenliği ve ergonomisi için <strong>Sayfa Başına 1 Form (A4)</strong> kilitlendi.`;
        }
      } else {
        if (perPageInput) {
          Array.from(perPageInput.options).forEach(opt => { opt.disabled = false; });
          perPageInput.value = '2';
        }
        if (tipEl) tipEl.style.display = 'none';
      }

      const typeInput = document.getElementById('optical-type-input');
      if (typeInput) typeInput.value = 'named';
      const studentsGrp = document.getElementById('optical-students-group');
      const blankGrp = document.getElementById('optical-blank-count-group');
      if (studentsGrp) studentsGrp.style.display = 'block';
      if (blankGrp) blankGrp.style.display = 'none';
      
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
  const opticalBlankCountInput = document.getElementById('optical-blank-count-input');

  const updateOpticalTypeUI = () => {
    const isBlank = opticalTypeInput && opticalTypeInput.value === 'blank';
    const studentsGrp = document.getElementById('optical-students-group');
    const blankGrp = document.getElementById('optical-blank-count-group');
    if (studentsGrp) studentsGrp.style.display = isBlank ? 'none' : 'block';
    if (blankGrp) blankGrp.style.display = isBlank ? 'block' : 'none';
  };

  if (opticalQInput) opticalQInput.addEventListener('input', updateOpticalLivePreview);
  if (opticalCInput) opticalCInput.addEventListener('change', updateOpticalLivePreview);
  if (opticalTypeInput) {
    opticalTypeInput.addEventListener('change', () => {
      updateOpticalTypeUI();
      updateOpticalLivePreview();
    });
  }
  if (opticalBlankCountInput) {
    opticalBlankCountInput.addEventListener('input', updateOpticalLivePreview);
  }
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
      const pagesHtml = generateOpticalFormsHTML(selectedStudentIds, questionCount, choicesCount, formType, perPage);
      
      // Kapat modalı
      if (modalPrintOptical) modalPrintOptical.classList.remove('active');
      
      // Güvenli ve Doğrudan Yazdırma (Tauri macOS/Windows, WebKit, WebView2 ve Tüm Tarayıcılarla %100 Uyumlu)
      if (toastCallback) toastCallback('Yazıcı hazırlanıyor, yazdırma penceresi açılıyor...', 'info');
      else if (window.showToast) window.showToast('Yazıcı hazırlanıyor, yazdırma penceresi açılıyor...', 'info');

      const printStyleId = 'optical-print-page-style';
      let printStyle = document.getElementById(printStyleId);
      if (!printStyle) {
        printStyle = document.createElement('style');
        printStyle.id = printStyleId;
        document.head.appendChild(printStyle);
      }
      printStyle.textContent = `@page { size: A4 portrait; margin: 4mm; }`;

      document.body.classList.add('print-optical');

      // Tarayıcının ve WebView'in DOM ile CSS'i hazırlaması için kısa gecikme
      setTimeout(() => {
        window.print();

        const cleanupPrint = () => {
          document.body.classList.remove('print-optical');
          const s = document.getElementById(printStyleId);
          if (s) s.remove();
        };

        window.addEventListener('afterprint', cleanupPrint, { once: true });
        setTimeout(cleanupPrint, 15000);
      }, 150);
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

    // Değerlendirme Motorunu Varsayılan Olarak Yerel (Deterministik) Moda Al
    setOpticalEngineMode('deterministic');

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

  // Taranan öğrenci sonuçlarını güncel cevap anahtarıyla anında yeniden puanlama
  function refreshOpticalScannedResultsEvaluation() {
    if (!activeExam || !opticalScannedResults || opticalScannedResults.length === 0) return;
    const isMulti = activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0;

    opticalScannedResults.forEach(res => {
      if (res.questionDetails) {
        res.questionDetails.forEach((qd) => {
          let correctAns = '';
          if (isMulti) {
            const sIdx = activeExam.subjects.findIndex(s => s.id === qd.subjId || s.name === qd.subjName);
            const subj = sIdx >= 0 ? activeExam.subjects[sIdx] : { id: qd.subjId, name: qd.subjName, questionCount: 10 };
            let cumulativeOffset = 0;
            for (let i = 0; i < sIdx; i++) {
              cumulativeOffset += (activeExam.subjects[i].questionCount || 0);
            }
            correctAns = findCorrectAnswerForKey(activeExam.answerKey, subj, sIdx >= 0 ? sIdx : 0, qd.q, cumulativeOffset);
          } else {
            correctAns = String(activeExam.answerKey[qd.q] || activeExam.answerKey[String(qd.q)] || '').trim().toUpperCase();
          }
          qd.keyAnswer = correctAns;
        });
      }
      recalculateResultCard(res);
    });

    if (opticalEvalStepResults && opticalEvalStepResults.style.display !== 'none') {
      renderOpticalEvaluationResults();
    }
  }
  window.refreshOpticalScannedResultsEvaluation = refreshOpticalScannedResultsEvaluation;

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
          if (opticalTempExamKey[k1] || opticalTempExamKey[k2] || opticalTempExamKey[globalQ] || opticalTempExamKey[String(globalQ)] || opticalTempExamKey[q] || opticalTempExamKey[String(q)]) {
            answeredCount++;
          }
        }
        cumulative += s.questionCount;
      });
    } else {
      answeredCount = Object.keys(opticalTempExamKey || {}).filter(k => parseInt(k, 10) <= qCount && opticalTempExamKey[k]).length;
    }

    const resultsKeySummary = document.getElementById('optical-results-key-summary');
    if (answeredCount === qCount) {
      opticalEvalKeyStatus.innerHTML = `<span style="color: #10b981; font-weight: 700;">${answeredCount} / ${qCount} Soru Tamamlandı ✓</span>`;
      if (resultsKeySummary) resultsKeySummary.innerHTML = `<span style="color: #10b981;">${answeredCount} / ${qCount} Soru Tamamlandı ✓</span>`;
    } else if (answeredCount > 0) {
      opticalEvalKeyStatus.innerHTML = `<span style="color: #f59e0b; font-weight: 700;">${answeredCount} / ${qCount} Soru Belirlendi (Eksik var!)</span>`;
      if (resultsKeySummary) resultsKeySummary.innerHTML = `<span style="color: #f59e0b;">${answeredCount} / ${qCount} Soru Belirlendi</span>`;
    } else {
      opticalEvalKeyStatus.innerHTML = `<span style="color: #ef4444; font-weight: 700;">Cevap Anahtarı Tanımlanmamış</span>`;
      if (resultsKeySummary) resultsKeySummary.innerHTML = `<span style="color: #ef4444;">Tanımlanmamış</span>`;
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

    const btnCopyAll = document.getElementById('btn-optical-copy-to-all-subj');
    if (btnCopyAll) {
      btnCopyAll.style.display = isMulti ? 'inline-block' : 'none';
    }

    if (isMulti) {
      const subjects = activeExam.subjects;
      activeOpticalKeySubjId = activeOpticalKeySubjId || subjects[0].id;
      const currentSubj = subjects.find(s => s.id === activeOpticalKeySubjId) || subjects[0];

      // Tab çubuğu
      const tabsWrap = document.createElement('div');
      tabsWrap.style.cssText = 'display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap; width: 100%; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;';

      let cumTab = 0;
      subjects.forEach((s, sIdx) => {
        let marked = 0;
        for (let q = 1; q <= s.questionCount; q++) {
          if (findCorrectAnswerForKey(opticalTempExamKey, s, sIdx, q, cumTab)) marked++;
        }
        cumTab += (s.questionCount || 0);
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

      const currentSubjIdx = Math.max(0, subjects.findIndex(s => s.id === currentSubj.id));
      let currentCumOffset = 0;
      for (let i = 0; i < currentSubjIdx; i++) {
        currentCumOffset += (subjects[i].questionCount || 0);
      }

      for (let q = 1; q <= currentSubj.questionCount; q++) {
        const key = `${currentSubj.id}_${q}`;
        const globalQ = currentCumOffset + q;
        const row = document.createElement('div');
        row.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 2px 6px;';

        const label = document.createElement('span');
        label.textContent = `${q}:`;
        label.style.cssText = 'font-size: 0.75rem; font-weight: 700; color: var(--text-muted); min-width: 22px; text-align: right;';
        row.appendChild(label);

        const currentVal = findCorrectAnswerForKey(opticalTempExamKey, currentSubj, currentSubjIdx, q, currentCumOffset) || '';

        letters.forEach(letter => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = letter;
          btn.className = `optical-key-pill-btn ${currentVal === letter ? 'active' : ''}`;
          btn.addEventListener('click', () => {
            if (currentVal === letter) {
              delete opticalTempExamKey[key];
              delete opticalTempExamKey[`${currentSubj.name}_${q}`];
              delete opticalTempExamKey[globalQ];
            } else {
              opticalTempExamKey[key] = letter;
              if (currentSubj.name) opticalTempExamKey[`${currentSubj.name}_${q}`] = letter;
              opticalTempExamKey[globalQ] = letter;
            }
            activeExam.answerKey = { ...opticalTempExamKey };
            stateManager.saveExam(activeExam);
            updateOpticalKeyStatusDisplay();
            renderOpticalKeyEditor();
            refreshOpticalScannedResultsEvaluation();
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
            refreshOpticalScannedResultsEvaluation();
          });
          row.appendChild(btn);
        });

        opticalEvalKeyGrid.appendChild(row);
      }
    }
  }

  // Tüm Derslere Uygula (Aktif dersin cevap anahtarını diğer derslere kopyalar)
  const btnOpticalCopyToAllSubj = document.getElementById('btn-optical-copy-to-all-subj');
  if (btnOpticalCopyToAllSubj) {
    btnOpticalCopyToAllSubj.addEventListener('click', () => {
      if (!activeExam || !activeExam.isMultiSubject || !Array.isArray(activeExam.subjects)) return;
      const currentSubj = activeExam.subjects.find(s => s.id === activeOpticalKeySubjId) || activeExam.subjects[0];
      if (!currentSubj) return;

      const currentSubjKey = {};
      for (let q = 1; q <= currentSubj.questionCount; q++) {
        const k = `${currentSubj.id}_${q}`;
        const kn = `${currentSubj.name}_${q}`;
        const val = opticalTempExamKey[k] || opticalTempExamKey[kn] || opticalTempExamKey[q] || opticalTempExamKey[String(q)];
        if (val) currentSubjKey[q] = val;
      }

      if (Object.keys(currentSubjKey).length === 0) {
        if (toastCallback) toastCallback(`Lütfen önce "${currentSubj.name}" dersi için şıkları belirleyin.`, 'warning');
        return;
      }

      activeExam.subjects.forEach(subj => {
        for (let q = 1; q <= subj.questionCount; q++) {
          const srcVal = currentSubjKey[q];
          if (srcVal) {
            opticalTempExamKey[`${subj.id}_${q}`] = srcVal;
          }
        }
      });

      activeExam.answerKey = { ...opticalTempExamKey };
      stateManager.saveExam(activeExam);
      updateOpticalKeyStatusDisplay();
      renderOpticalKeyEditor();
      refreshOpticalScannedResultsEvaluation();
      if (toastCallback) toastCallback(`"${currentSubj.name}" dersinin cevap anahtarı tüm derslere uygulandı.`, 'success');
    });
  }

  // Metinle Hızlı Gir / Yapıştır Toggle & İşlemleri
  const btnOpticalToggleTextKey = document.getElementById('btn-optical-toggle-text-key');
  const opticalEvalKeyTextBox = document.getElementById('optical-eval-key-text-box');
  const btnOpticalCancelTextKey = document.getElementById('btn-optical-cancel-text-key');
  const btnOpticalApplyTextKey = document.getElementById('btn-optical-apply-text-key');
  const opticalEvalKeyTextInput = document.getElementById('optical-eval-key-text-input');
  const opticalEvalKeyApplyAllCheck = document.getElementById('optical-eval-key-apply-all-check');

  if (btnOpticalToggleTextKey && opticalEvalKeyTextBox) {
    btnOpticalToggleTextKey.addEventListener('click', () => {
      const isHidden = opticalEvalKeyTextBox.style.display === 'none';
      opticalEvalKeyTextBox.style.display = isHidden ? 'block' : 'none';
      if (isHidden && opticalEvalKeyTextInput) {
        opticalEvalKeyTextInput.focus();
      }
    });
  }
  if (btnOpticalCancelTextKey && opticalEvalKeyTextBox) {
    btnOpticalCancelTextKey.addEventListener('click', () => {
      opticalEvalKeyTextBox.style.display = 'none';
    });
  }
  if (btnOpticalApplyTextKey && opticalEvalKeyTextInput) {
    btnOpticalApplyTextKey.addEventListener('click', () => {
      const text = opticalEvalKeyTextInput.value.trim();
      if (!text) {
        if (toastCallback) toastCallback('Lütfen bir cevap anahtarı metni girin veya yapıştırın.', 'warning');
        return;
      }

      const cCount = parseInt(activeExam ? activeExam.choicesCount : 4, 10) || 4;
      const parsed = parseAnswerKeyText(text, cCount);
      const parsedKeys = Object.keys(parsed);

      if (parsedKeys.length === 0) {
        if (toastCallback) toastCallback('Cevap anahtarı metninden geçerli şıklar okunamadı. Örnek: 1.a 2.a 3.b 4.b...', 'error');
        return;
      }

      const isMulti = activeExam && activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0;
      const applyAll = !isMulti || (opticalEvalKeyApplyAllCheck && opticalEvalKeyApplyAllCheck.checked);

      if (isMulti) {
        const subjects = activeExam.subjects;
        const currentSubj = subjects.find(s => s.id === activeOpticalKeySubjId) || subjects[0];

        if (applyAll) {
          subjects.forEach(subj => {
            for (let q = 1; q <= subj.questionCount; q++) {
              if (parsed[q]) {
                opticalTempExamKey[`${subj.id}_${q}`] = parsed[q];
              }
            }
          });
        } else {
          for (let q = 1; q <= currentSubj.questionCount; q++) {
            if (parsed[q]) {
              opticalTempExamKey[`${currentSubj.id}_${q}`] = parsed[q];
            }
          }
        }
      } else {
        const qCount = parseInt(activeExam ? activeExam.totalQuestions : 20, 10) || 20;
        for (let q = 1; q <= qCount; q++) {
          if (parsed[q]) {
            opticalTempExamKey[q] = parsed[q];
          }
        }
      }

      activeExam.answerKey = { ...opticalTempExamKey };
      stateManager.saveExam(activeExam);
      updateOpticalKeyStatusDisplay();
      renderOpticalKeyEditor();
      refreshOpticalScannedResultsEvaluation();

      if (opticalEvalKeyTextBox) opticalEvalKeyTextBox.style.display = 'none';
      if (toastCallback) toastCallback(`${parsedKeys.length} soruluk cevap anahtarı başarıyla uygulandı ve kaydedildi.`, 'success');
    });
  }

  // Sonuç ekranındaki "Anahtarı Düzenle / Metinle Gir" butonu
  const btnOpticalResultsEditKey = document.getElementById('btn-optical-results-edit-key');
  if (btnOpticalResultsEditKey) {
    btnOpticalResultsEditKey.addEventListener('click', () => {
      // Yükleme ekranına dönmeden doğrudan editör kutusunu veya modalı aç
      if (typeof window.openDesktopAnswerKeyModal === 'function') {
        window.openDesktopAnswerKeyModal();
      } else if (opticalEvalStepUpload && opticalEvalStepResults) {
        opticalEvalStepResults.style.display = 'none';
        opticalEvalStepUpload.style.display = 'block';
        if (opticalEvalKeyEditorBox) opticalEvalKeyEditorBox.style.display = 'block';
      }
    });
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
      refreshOpticalScannedResultsEvaluation();
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
      refreshOpticalScannedResultsEvaluation();
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

  // Tekil Dosya veya Çok Sayfalı PDF İşleme Motoru (Bellek Güvenli & Canlı İlerleme Bildirimli)
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

      // YÖNTEM A: Taranmış Belgelerde Doğrudan Kayıpsız JPEG Çıkarımı (CamScanner & Tarayıcılar İçin)
      // CamScanner ve benzeri tarayıcı uygulamaları her sayfayı PDF içine gömülü saf JPEG olarak kaydeder.
      // Bu JPEG akışlarını doğrudan bellekten çıkarmak;
      // 1) Linux / Pardus Chromium grafik motorunda bellek aşımını (canvas context loss ve boş beyaz sayfa) %100 önler.
      // 2) Skia/Pixman rasterizer'ın stride/pitch bozulmalarından (çapraz çizgili kayma artefaktları) korur.
      // 3) Milisaniyeler içinde sıfır CPU kaybıyla orijinal kamera sensörü çözünürlüğünde sayfaları elde eder.
      const extractedImages = [];
      const len = uint8.length;
      let i = 0;
      while (i < len - 3) {
        if (uint8[i] === 0xFF && uint8[i + 1] === 0xD8 && uint8[i + 2] === 0xFF) {
          const start = i;
          let j = start + 3;
          while (j < len - 1) {
            if (uint8[j] === 0xFF && uint8[j + 1] === 0xD9) {
              const imgLen = (j + 2) - start;
              if (imgLen > 50000) { // Küçük simge ve thumbnail'leri ele, yalnızca optik form sayfalarını al (>50KB)
                extractedImages.push(uint8.subarray(start, j + 2));
              }
              i = j + 2;
              break;
            }
            j++;
          }
          if (j >= len - 1) break;
        } else {
          i++;
        }
      }

      if (extractedImages.length > 0) {
        const pages = [];
        const totalP = extractedImages.length;
        for (let p = 0; p < totalP; p++) {
          if (typeof onProgress === 'function') {
            onProgress(p + 1, totalP, file.name);
          }
          const blob = new Blob([extractedImages[p]], { type: 'image/jpeg' });
          const pageDataUrl = await new Promise((res, rej) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result);
            fr.onerror = rej;
            fr.readAsDataURL(blob);
          });

          pages.push({
            id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '_p' + (p + 1),
            file: file,
            name: `${file.name} (Sayfa ${p + 1}/${totalP})`,
            sizeText: `${(extractedImages[p].length / 1024).toFixed(0)} KB (Sayfa ${p + 1}/${totalP})`,
            dataUrl: pageDataUrl,
            isPdf: false,
            isPdfPage: true
          });
        }
        return pages;
      }

      // YÖNTEM B: Vektörel veya ham JPEG içermeyen PDF'ler için PDF.js Güvenli Render (1600px Max)
      if (window.pdfjsLib) {
        try {
          const loadingTask = window.pdfjsLib.getDocument({
            data: arrayBuffer,
            disableFontFace: false
          });
          const pdfDoc = await loadingTask.promise;
          const pages = [];
          const totalP = pdfDoc.numPages || 1;

          for (let p = 1; p <= totalP; p++) {
            if (typeof onProgress === 'function') {
              onProgress(p, totalP, file.name);
            }

            const page = await pdfDoc.getPage(p);
            const initialVp = page.getViewport({ scale: 1.0 });
            const maxDim = Math.max(initialVp.width, initialVp.height) || 1000;
            
            // Güvenli çözünürlük ölçeği (Linux Chromium bellek aşımını önlemek için max 1600px)
            let scale = 1600 / maxDim;
            if (scale > 2.5) scale = 2.5;
            if (scale < 0.40) scale = 0.40;

            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(viewport.width);
            canvas.height = Math.round(viewport.height);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({ canvasContext: ctx, viewport }).promise;

            const pageDataUrl = canvas.toDataURL('image/jpeg', 0.92);

            if (typeof page.cleanup === 'function') page.cleanup();
            canvas.width = 0;
            canvas.height = 0;

            pages.push({
              id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '_p' + p,
              file: file,
              name: `${file.name} (Sayfa ${p}/${totalP})`,
              sizeText: `Sayfa ${p} / ${totalP}`,
              dataUrl: pageDataUrl,
              isPdf: false,
              isPdfPage: true
            });

            // Tarayıcının GC ve arayüz çizimini yapabilmesi için mikro bekleme
            await new Promise(r => setTimeout(r, 20));
          }

          if (typeof pdfDoc.destroy === 'function') pdfDoc.destroy();

          if (pages.length > 0) return pages;
        } catch (pdfErr) {
          console.warn('PDF.js render hatası:', pdfErr);
        }
      }

      // 2. PDF.js kullanılamazsa: Doğrudan PDF Dosyasını Base64 olarak al (Gemini Vision yerel PDF okuma)
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
  // OPTİK DEĞERLENDİRME ÇALIŞTIRMA MOTORU (YEREL DETERMINISTIK VEYA YAPAY ZEKA)
  // ==========================================================================
  let selectedOpticalEngine = 'deterministic'; // 'deterministic' | 'ai'

  const btnOptEngineDeterministic = document.getElementById('btn-opt-engine-deterministic');
  const btnOptEngineAi = document.getElementById('btn-opt-engine-ai');
  const opticalEngineDesc = document.getElementById('optical-engine-desc');
  const btnStartOpticalEvalText = document.getElementById('btn-start-optical-eval-text');

  function setOpticalEngineMode(mode) {
    selectedOpticalEngine = mode;
    if (mode === 'deterministic') {
      if (btnOptEngineDeterministic) {
        btnOptEngineDeterministic.className = 'btn btn-sm btn-primary';
        btnOptEngineDeterministic.style.background = '#4f46e5';
        btnOptEngineDeterministic.style.color = '#fff';
      }
      if (btnOptEngineAi) {
        btnOptEngineAi.className = 'btn btn-sm btn-secondary';
        btnOptEngineAi.style.background = 'transparent';
        btnOptEngineAi.style.color = 'var(--text-secondary)';
      }
      if (opticalEngineDesc) {
        opticalEngineDesc.textContent = '⚡ Yerel Deterministik Motor: Yapay zekaya gitmez, sıfır halüsinasyon, ışık hızında ve 100% tutarlıdır.';
      }
      if (btnStartOpticalEvalText) {
        btnStartOpticalEvalText.textContent = '⚡ Yerel Motor ile Değerlendirmeyi Başlat';
      }
      if (btnStartOpticalAiEval) {
        btnStartOpticalAiEval.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      }
      if (opticalApiKeyBanner) opticalApiKeyBanner.style.display = 'none';
    } else {
      if (btnOptEngineDeterministic) {
        btnOptEngineDeterministic.className = 'btn btn-sm btn-secondary';
        btnOptEngineDeterministic.style.background = 'transparent';
        btnOptEngineDeterministic.style.color = 'var(--text-secondary)';
      }
      if (btnOptEngineAi) {
        btnOptEngineAi.className = 'btn btn-sm btn-primary';
        btnOptEngineAi.style.background = '#4f46e5';
        btnOptEngineAi.style.color = '#fff';
      }
      if (opticalEngineDesc) {
        opticalEngineDesc.textContent = '🤖 Yapay Zeka (Gemini Vision): Dış kaynaklı veya köşeleri olmayan serbest fotoğraflar için kullanılır.';
      }
      if (btnStartOpticalEvalText) {
        btnStartOpticalEvalText.textContent = '🤖 Yapay Zeka ile Değerlendirmeyi Başlat';
      }
      if (btnStartOpticalAiEval) {
        btnStartOpticalAiEval.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
      }
      updateOpticalApiKeyBanner();
    }
  }
  window.setOpticalEngineMode = setOpticalEngineMode;

  if (btnOptEngineDeterministic) {
    btnOptEngineDeterministic.addEventListener('click', () => setOpticalEngineMode('deterministic'));
  }
  if (btnOptEngineAi) {
    btnOptEngineAi.addEventListener('click', () => setOpticalEngineMode('ai'));
  }

  if (btnStartOpticalAiEval) {
    btnStartOpticalAiEval.addEventListener('click', () => {
      if (selectedOpticalEngine === 'deterministic') {
        startDeterministicOpticalEvaluation();
      } else {
        startOpticalAiEvaluation();
      }
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
    const rawName = String(cardStudentName || '').trim();
    const isPlaceholderName = !rawName || 
      rawName === 'Eşleştirilemedi (Öğrenci Seç)' || 
      rawName.startsWith('Eşleştirilemedi') || 
      rawName === 'Öğrenci' || 
      rawName.startsWith('Öğrenci #') || 
      rawName.startsWith('Öğrenci No:');

    const digitsAi = (rawNo !== '-' && rawNo !== '......') ? rawNo.replace(/\D/g, '') : '';
    const normAi = !isPlaceholderName ? normalizeOpticalName(rawName) : '';
    const wordsAi = normAi ? normAi.split(' ').filter(w => w.length > 1) : [];
    const sortedWordsAi = wordsAi.length > 0 ? [...wordsAi].sort().join(' ') : '';

    if (!digitsAi && !normAi) {
      return { matched: null, score: 0, candidate: null, candidateScore: 0 };
    }

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

  // ==========================================================================
  // YEREL / DETERMINİSTİK (YAPAY ZEKASIZ) OPTİK DEĞERLENDİRME MOTORU
  // ==========================================================================
  async function startDeterministicOpticalEvaluation() {
    if (!activeExam || opticalSelectedFiles.length === 0) return;

    const totalFiles = opticalSelectedFiles.length;
    opticalScannedResults = [];

    // Ekranı İşlem Moduna Al
    opticalEvalStepUpload.style.display = 'none';
    opticalEvalStepProcessing.style.display = 'block';
    opticalEvalStepResults.style.display = 'none';

    if (opticalProcessingLogBox) opticalProcessingLogBox.innerHTML = '';
    appendOpticalLog('⚡ Yerel Deterministik OMR Motoru başlatılıyor (%0 halüsinasyon, çevrim dışı)...');

    const state = stateManager.loadState();
    const isMiddle = state.educationLevel === 'middle';
    const examBranch = activeExam.branch || '';
    const classStudents = (state.students || []).filter(s => !isMiddle || !examBranch || s.branch === examBranch);
    classStudents.sort((a, b) => {
      const nameA = String(a?.name || '').trim();
      const nameB = String(b?.name || '').trim();
      const cmpName = nameA.localeCompare(nameB, 'tr');
      if (cmpName !== 0) return cmpName;
      const surA = String(a?.surname || '').trim();
      const surB = String(b?.surname || '').trim();
      const cmpSur = surA.localeCompare(surB, 'tr');
      if (cmpSur !== 0) return cmpSur;
      const noA = parseInt(a?.number, 10) || 0;
      const noB = parseInt(b?.number, 10) || 0;
      return noA - noB;
    });

    const usedMatchedStudentIds = new Set();

    for (let i = 0; i < totalFiles; i++) {
      const fileItem = opticalSelectedFiles[i];
      const pct = Math.round(((i + 1) / totalFiles) * 100);
      if (opticalProcessingProgressBar) opticalProcessingProgressBar.style.width = `${pct}%`;
      if (opticalProcessingPercentage) opticalProcessingPercentage.textContent = `%${pct}`;
      if (opticalProcessingCounter) opticalProcessingCounter.textContent = `${i + 1} / ${totalFiles}`;
      appendOpticalLog(`Dosya ${i + 1}/${totalFiles}: "${fileItem.name}" analiz ediliyor...`);

      try {
        const img = new Image();
        await new Promise((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error('Görsel yüklenemedi'));
          img.src = fileItem.dataUrl;
        });

        if (!window.OmrEngine || typeof window.OmrEngine.scanDocumentPage !== 'function') {
          throw new Error('OMR Motoru henüz yüklenmedi');
        }

        const scanRes = await window.OmrEngine.scanDocumentPage(img, activeExam, classStudents, {
          pageNumber: i + 1
        });

        if (!scanRes || !scanRes.success || !scanRes.cards || scanRes.cards.length === 0) {
          throw new Error('Sayfa üzerinde referans köşe çapaları algılanamadı.');
        }

        appendOpticalLog(`✓ ${fileItem.name}: ${scanRes.cards.length} adet optik form okundu.`);

        scanRes.cards.forEach((card, cIdx) => {
          let matched = card.matched;
          let candidate = card.candidate;
          let cardStudentName = card.rawStudentName || '';
          let cardStudentNo = card.rawStudentNo || '';

          if (!matched && (cardStudentNo || cardStudentName)) {
            const mRes = findBestStudentMatch(cardStudentNo, cardStudentName, classStudents);
            matched = mRes.matched;
            candidate = mRes.candidate;
          }

          // DİKKAT: Rastgele / sıradan aday tahmini (fallbackIdx) yapılmaz!
          // Kart QR veya OMR ID ile doğrulanmadıysa eşleşmemiş olarak bırakılır ki
          // öğretmen listeden kendisi seçebilsin ve mükerrer atama oluşmasın.

          // Mükerrer Eşleşme Kontrolü: Aynı öğrenci daha önce başka bir sayfada eşleştirildiyse
          if (matched) {
            if (usedMatchedStudentIds.has(matched.id)) {
              appendOpticalLog(`⚠️ Uyarı: "${matched.name} ${matched.surname || ''}" daha önce başka bir formda eşleştirildi. Mükerrerliği önlemek için aday olarak bırakıldı.`);
              candidate = matched;
              matched = null;
            } else {
              usedMatchedStudentIds.add(matched.id);
            }
          }

          opticalScannedResults.push({
            resultId: 'omr_res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            engineType: 'deterministic',
            fileName: fileItem.name,
            thumbUrl: card.thumbUrl || fileItem.dataUrl,
            isPdf: !!fileItem.isPdf,
            pdfDataUrl: fileItem.isPdf ? fileItem.dataUrl : '',
            rawStudentName: cardStudentName,
            rawStudentNo: cardStudentNo,
            matchedStudentId: matched ? matched.id : '',
            candidateStudentId: candidate ? candidate.id : '',
            candidateStudentName: candidate ? `${candidate.name} ${candidate.surname || ''}`.trim() : '',
            candidateScore: matched ? 100 : (candidate ? 70 : 0),
            correctCount: card.correctCount,
            wrongCount: card.wrongCount,
            blankCount: card.blankCount,
            net: card.net,
            score: card.score,
            answers: card.answers,
            subjectBreakdown: card.subjectBreakdown,
            questionDetails: card.questionDetails
          });

          const nameTag = matched ? `${matched.name} ${matched.surname || ''}` : (candidate ? `${candidate.name} (Aday)` : '(Eşleşmedi)');
          appendOpticalLog(`  ↳ Form ${cIdx + 1}: ${nameTag} -> ${card.correctCount} Doğru, ${card.wrongCount} Yanlış, ${card.blankCount} Boş | Net: ${card.net}`);
        });

      } catch (err) {
        console.error('Yerel OMR Okuma Hatası:', err);
        appendOpticalLog(`⚠️ ${fileItem.name}: Yerel okuma uyarısı (${err.message || 'Köşe çapası bulunamadı'}).`);
      }

      await new Promise(r => setTimeout(r, 15));
    }

    if (opticalProcessingProgressBar) opticalProcessingProgressBar.style.width = '100%';
    if (opticalProcessingPercentage) opticalProcessingPercentage.textContent = '100%';
    if (opticalProcessingCounter) opticalProcessingCounter.textContent = `${totalFiles} / ${totalFiles} Tamamlandı`;
    appendOpticalLog('Tüm formların incelemesi tamamlandı. Sonuçlar hazırlanıyor...');

    setTimeout(() => {
      renderOpticalEvaluationResults();
    }, 400);
  }

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
    const classStudents = (state.students || []).filter(s => !isMiddle || !examBranch || s.branch === examBranch);
    classStudents.sort((a, b) => {
      const nameA = String(a?.name || '').trim();
      const nameB = String(b?.name || '').trim();
      return nameA.localeCompare(nameB, 'tr');
    });

    const studentsRosterText = classStudents.length > 0
      ? classStudents.map(s => `- No: "${s.number || '-'}", Ad Soyad: "${s.name} ${s.surname || ''}"`).join('\n')
      : '(Sınıf listesi boş)';

    const usedAiMatchedStudentIds = new Set();

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
        } else if (fileItem.isPdfPage) {
          // PDF.js zaten 2400px yüksek kalitede render etti; çift sıkıştırmadan koru
          sendingData = fileItem.dataUrl;
        } else {
          // Görseli canvas üzerinden yüksek kalitede optimize et (baloncuk netliği için 2400px)
          sendingData = await resizeImageForOmr(fileItem.dataUrl, 2400);
        }

        const isMulti = activeExam && !!activeExam.isMultiSubject;
        const examSubjects = activeExam && activeExam.subjects ? activeExam.subjects : [];

        // Resmi Cevap Anahtarı Bölümü (Gemini'ye optik baloncukları referans alarak hatasız okuma rehberliği sağlar)
        let answerKeyPromptSection = '';
        if (activeExam && activeExam.answerKey && Object.keys(activeExam.answerKey).length > 0) {
          if (isMulti && examSubjects.length > 0) {
            const lines = [];
            let cumulativeOffset = 0;
            examSubjects.forEach((s, idx) => {
              const qList = [];
              for (let q = 1; q <= s.questionCount; q++) {
                const kAns = findCorrectAnswerForKey(activeExam.answerKey, s, idx, q, cumulativeOffset);
                if (kAns) qList.push(`${q}: ${kAns}`);
              }
              if (qList.length > 0) {
                lines.push(`  * ${s.name}: ${qList.join(', ')}`);
              }
              cumulativeOffset += s.questionCount;
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
   - DİKKAT: Formun üzerindeki ders başlığı yazımında küçük farklar olsa dahi (örn: "Fen Bilimleri" vs "Fen Bilgisi") soldan sağa sütun sırasına göre ilgili derstir. Her sütundaki sorular 1'den başlar (1, 2, 3..).

2. BALONCUKLARIN SABİT YATAY SIRASI (KESİN REFERANS KURALI):
   Her soru satırında soldan sağa her zaman tam 4 adet şık çemberi bulunur:
   * 1. Çember (en soldaki ilk daire)  = 'A'
   * 2. Çember (soldan 2. daire)       = 'B'
   * 3. Çember (soldan 3. daire)       = 'C'
   * 4. Çember (en sağdaki son daire)  = 'D'

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
   - "bubbleCheck" alanında her ders için satır satır dolu çember sırasını (1., 2., 3., 4.) kısaca listele.

Cevabını SADECE aşağıdaki JSON formatında ver (hiçbir markdown etiketi ekleme):
{
  "cards": [
    {
      "studentName": "Öğrenci Adı Soyadı",
      "studentNo": "123",
      "bubbleCheck": "Ders bazında karalanmış çember sıraları doğrulaması (Örn: Turkce: 1=1.cember(A), 2=2.cember(B)...)",
      "subjects": {
        ${examSubjects.map(s => `"${s.name}": { "1": "A", "2": "B" }`).join(',\n        ')}
      },
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
          temperature: 0.1
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
        } else if (parsed.answers || parsed.subjects) {
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
          let matched = matchResult.matched;
          let candidate = matchResult.candidate;
          const candidateScore = matchResult.candidateScore;

          // Mükerrer Eşleşme Kontrolü
          if (matched) {
            if (usedAiMatchedStudentIds.has(matched.id)) {
              appendOpticalLog(`⚠️ Uyarı: "${matched.name} ${matched.surname || ''}" daha önce başka bir formda eşleştirildi. Mükerrerliği önlemek için aday olarak bırakıldı.`);
              candidate = matched;
              matched = null;
            } else {
              usedAiMatchedStudentIds.add(matched.id);
            }
          }

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
              engineType: 'ai',
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
              engineType: 'ai',
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
                📄 Dosya: <code>${res.fileName}</code> • ${res.engineType === 'deterministic' ? '<span style="color: #059669; font-weight: 700;">⚡ Yerel OMR:</span>' : '<span style="color: #6366f1; font-weight: 700;">🤖 AI Okudu:</span>'} "<strong>${res.rawStudentName || 'Belirsiz'}</strong>" (No: ${res.rawStudentNo || '-'})
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
          thumbUrl: (res.thumbUrl && typeof res.thumbUrl === 'string' && res.thumbUrl.length < 40000) ? res.thumbUrl : '',
          pdfDataUrl: '',
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

      // Modalı kapat
      if (modalUploadOpticalEval) modalUploadOpticalEval.classList.remove('active');

      // saveExam kendi içinde stateChanged fırlatır ve tabloyu/listeyi tek seferde günceller
      stateManager.saveExam(activeExam);

      const totalExamStudents = Object.keys(mergedScores).length;
      if (toastCallback) {
        if (overwrittenStudents > 0) {
          toastCallback(`🎉 ${newlyAddedStudents} yeni öğrenci eklendi, ${overwrittenStudents} kayıtlı öğrenci güncellendi! (Sınavda toplam ${totalExamStudents} öğrenci kayıtlı)`, 'success');
        } else {
          toastCallback(`🎉 ${newlyAddedStudents} öğrencinin sınav notları başarıyla eklendi! (Sınavda toplam ${totalExamStudents} öğrenci kayıtlı)`, 'success');
        }
      }
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

    const rawKey = activeExam.answerKey || {};
    editAnswerKeyTemp = {};
    if (activeExam.isMultiSubject && Array.isArray(activeExam.subjects) && activeExam.subjects.length > 0) {
      let cum = 0;
      activeExam.subjects.forEach((s, idx) => {
        if (!s.id) s.id = `sub_${idx}`;
        const qCount = parseInt(s.questionCount, 10) || 0;
        for (let q = 1; q <= qCount; q++) {
          const val = findCorrectAnswerForKey(rawKey, s, idx, q, cum);
          if (val) {
            editAnswerKeyTemp[`${s.id}_${q}`] = val;
          }
        }
        cum += qCount;
      });
    } else {
      const totalQ = parseInt(activeExam.totalQuestions, 10) || 20;
      for (let q = 1; q <= totalQ; q++) {
        const val = rawKey[q] || rawKey[String(q)];
        if (val) editAnswerKeyTemp[q] = String(val).trim().toUpperCase();
      }
    }
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

    const btnCopyAll = document.getElementById('btn-desktop-ak-copy-to-all');
    const applyAllLabel = document.getElementById('desktop-ak-key-apply-all-label');
    if (btnCopyAll) {
      btnCopyAll.style.display = isMulti ? 'inline-block' : 'none';
    }
    if (applyAllLabel) {
      applyAllLabel.style.display = isMulti ? 'flex' : 'none';
    }

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
    const filled = countExamDefinedAnswers(activeExam, editAnswerKeyTemp);

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

  // Masaüstü Cevap Anahtarı Düzenleme Modalı - Tüm Derslere Uygula & Metinle Gir
  const btnDesktopAkCopyToAll = document.getElementById('btn-desktop-ak-copy-to-all');
  if (btnDesktopAkCopyToAll) {
    btnDesktopAkCopyToAll.addEventListener('click', () => {
      if (!activeExam || !activeExam.isMultiSubject || !Array.isArray(activeExam.subjects)) return;
      const currentSubj = activeExam.subjects.find(s => s.id === activeEditKeySubjId) || activeExam.subjects[0];
      if (!currentSubj) return;

      const currentSubjKey = {};
      for (let q = 1; q <= currentSubj.questionCount; q++) {
        const val = editAnswerKeyTemp[`${currentSubj.id}_${q}`] || editAnswerKeyTemp[`${currentSubj.name}_${q}`] || editAnswerKeyTemp[q];
        if (val) currentSubjKey[q] = val;
      }

      if (Object.keys(currentSubjKey).length === 0) {
        if (toastCallback) toastCallback(`Lütfen önce "${currentSubj.name}" dersi için şıkları belirleyin.`, 'warning');
        return;
      }

      activeExam.subjects.forEach(subj => {
        for (let q = 1; q <= subj.questionCount; q++) {
          const srcVal = currentSubjKey[q];
          if (srcVal) {
            editAnswerKeyTemp[`${subj.id}_${q}`] = srcVal;
          }
        }
      });

      renderDesktopAnswerKeyModalGrid();
      if (toastCallback) toastCallback(`"${currentSubj.name}" dersinin cevap anahtarı tüm derslere uygulandı.`, 'success');
    });
  }

  const btnDesktopAkToggleTextKey = document.getElementById('btn-desktop-ak-toggle-text-key');
  const desktopAkKeyTextBox = document.getElementById('desktop-ak-key-text-box');
  const btnDesktopAkCancelTextKey = document.getElementById('btn-desktop-ak-cancel-text-key');
  const btnDesktopAkApplyTextKey = document.getElementById('btn-desktop-ak-apply-text-key');
  const desktopAkKeyTextInput = document.getElementById('desktop-ak-key-text-input');
  const desktopAkKeyApplyAllCheck = document.getElementById('desktop-ak-key-apply-all-check');

  if (btnDesktopAkToggleTextKey && desktopAkKeyTextBox) {
    btnDesktopAkToggleTextKey.addEventListener('click', () => {
      const isHidden = desktopAkKeyTextBox.style.display === 'none';
      desktopAkKeyTextBox.style.display = isHidden ? 'block' : 'none';
      if (isHidden && desktopAkKeyTextInput) {
        desktopAkKeyTextInput.focus();
      }
    });
  }
  if (btnDesktopAkCancelTextKey && desktopAkKeyTextBox) {
    btnDesktopAkCancelTextKey.addEventListener('click', () => {
      desktopAkKeyTextBox.style.display = 'none';
    });
  }

  if (btnDesktopAkApplyTextKey) {
    btnDesktopAkApplyTextKey.addEventListener('click', () => {
      const rawText = desktopAkKeyTextInput ? desktopAkKeyTextInput.value.trim() : '';
      if (!rawText) {
        if (toastCallback) toastCallback('Lütfen cevap anahtarını metin olarak girin veya yapıştırın!', 'warning');
        return;
      }

      const parsedKey = parseAnswerKeyText(rawText, editAnswerKeyChoices);
      const parsedCount = Object.keys(parsedKey).length;

      if (parsedCount === 0) {
        if (toastCallback) toastCallback('Metinden hiçbir geçerli cevap algılanamadı! (Örn: 1.a 2.a 3.b ...)', 'error');
        return;
      }

      const isMulti = activeExam && !!activeExam.isMultiSubject;
      const applyAll = desktopAkKeyApplyAllCheck ? desktopAkKeyApplyAllCheck.checked : true;

      if (isMulti && Array.isArray(activeExam.subjects)) {
        if (applyAll) {
          activeExam.subjects.forEach(s => {
            for (let q = 1; q <= s.questionCount; q++) {
              if (parsedKey[q]) {
                editAnswerKeyTemp[`${s.id}_${q}`] = parsedKey[q];
              }
            }
          });
          if (toastCallback) toastCallback(`Cevap anahtarı (${parsedCount} soru) tüm derslere uygulandı!`, 'success');
        } else {
          const currentSubj = activeExam.subjects.find(s => s.id === activeEditKeySubjId) || activeExam.subjects[0];
          for (let q = 1; q <= currentSubj.questionCount; q++) {
            if (parsedKey[q]) {
              editAnswerKeyTemp[`${currentSubj.id}_${q}`] = parsedKey[q];
            }
          }
          if (toastCallback) toastCallback(`Cevap anahtarı (${parsedCount} soru) "${currentSubj.name}" dersine uygulandı!`, 'success');
        }
      } else {
        const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
        for (let q = 1; q <= qCount; q++) {
          if (parsedKey[q]) {
            editAnswerKeyTemp[q] = parsedKey[q];
          }
        }
        if (toastCallback) toastCallback(`Cevap anahtarı (${parsedCount} soru) başarıyla aktarıldı!`, 'success');
      }

      if (desktopAkKeyTextBox) desktopAkKeyTextBox.style.display = 'none';
      if (desktopAkKeyTextInput) desktopAkKeyTextInput.value = '';
      renderDesktopAnswerKeyModalGrid();
    });
  }

  // Cevap Anahtarını Kaydet ve Gerekiyorsa Öğrenci Notlarını Yeniden Hesapla
  if (btnSaveEditAnswerKey) {
    btnSaveEditAnswerKey.addEventListener('click', () => {
      if (!activeExam) return;

      const finalAnswerKey = { ...editAnswerKeyTemp };
      if (activeExam.isMultiSubject && Array.isArray(activeExam.subjects)) {
        let cum = 0;
        activeExam.subjects.forEach(s => {
          s.answerKey = {};
          const qCount = parseInt(s.questionCount, 10) || 0;
          for (let q = 1; q <= qCount; q++) {
            const globalQ = cum + q;
            const val = finalAnswerKey[`${s.id}_${q}`];
            if (val) {
              s.answerKey[q] = val;
              if (s.name) finalAnswerKey[`${s.name}_${q}`] = val;
              finalAnswerKey[globalQ] = val;
            }
          }
          cum += qCount;
        });
      }

      activeExam.answerKey = finalAnswerKey;
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

      if (modalEditExamAnswerKey) modalEditExamAnswerKey.classList.remove('active');

      // saveExam kendi içinde stateChanged fırlatır ve tabloyu/listeyi tek seferde günceller
      stateManager.saveExam(activeExam);

      if (window.CloudSync) {
        window.CloudSync.pushExam(activeExam).catch(() => {});
        if (typeof window.CloudSync.pushLiveExamResults === 'function') {
          window.CloudSync.pushLiveExamResults(activeExam, 'desktop').catch(() => {});
        }
      }

      if (toastCallback) {
        if (rescoredCount > 0) {
          toastCallback(`✅ Cevap anahtarı güncellendi ve ${rescoredCount} öğrencinin notları otomatik olarak yeniden hesaplandı!`, 'success');
        } else {
          toastCallback('✅ Cevap anahtarı başarıyla güncellendi.', 'success');
        }
      }
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

    if (modalStudentOpticalEdit) {
      modalStudentOpticalEdit.classList.remove('active');
    }

    // saveExam kendi içinde stateChanged fırlatır ve tabloyu/listeyi tek seferde günceller
    stateManager.saveExam(activeExam);

    const state = stateManager.loadState();
    const student = (state.students || []).find(s => String(s.id) === String(activeOpticalStudentId));
    const studentLabel = student ? `${student.name} ${student.surname}` : 'Öğrencinin';

    if (toastCallback) {
      toastCallback(`✓ ${studentLabel} optik form işaretlemeleri ve puanı (${score} Puan) başarıyla güncellendi!`, 'success');
    }
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
      if (student && student.number) {
        if (activeExam.studentResults) delete activeExam.studentResults[String(student.number)];
        if (activeExam.examScores) delete activeExam.examScores[String(student.number)];
      }
      if (!Array.isArray(activeExam.deletedStudentIds)) activeExam.deletedStudentIds = [];
      if (!activeExam.deletedStudentIds.includes(String(activeOpticalStudentId))) activeExam.deletedStudentIds.push(String(activeOpticalStudentId));
      if (student && student.number && !activeExam.deletedStudentIds.includes(String(student.number))) {
        activeExam.deletedStudentIds.push(String(student.number));
      }
      if (modalStudentOpticalEdit) modalStudentOpticalEdit.classList.remove('active');

      activeExam.updatedAt = new Date().toISOString();
      stateManager.saveExam(activeExam);

      if (window.CloudSync) {
        if (typeof window.CloudSync.pushLiveOmrDelete === 'function') {
          window.CloudSync.pushLiveOmrDelete(activeExam.id, activeExam.examName, activeOpticalStudentId, sName, student ? student.number : '', 'desktop');
        }
        window.CloudSync.pushExam(activeExam).catch(() => {});
      }

      if (toastCallback) {
        toastCallback(`✓ ${sName} optik form kaydı silindi ve elle not girişine açıldı.`, 'success');
      }
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
        const cmpName = nameA.localeCompare(nameB, 'tr');
        if (cmpName !== 0) return cmpName;
        const surA = String(a?.surname || '').trim();
        const surB = String(b?.surname || '').trim();
        const cmpSur = surA.localeCompare(surB, 'tr');
        if (cmpSur !== 0) return cmpSur;
        const noA = parseInt(a?.number, 10) || 0;
        const noB = parseInt(b?.number, 10) || 0;
        return noA - noB;
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

  // Optik Kart Kimlik Rozeti (ArUco 5x5 Süper Sade Geometrik Matris)
  // Masif 1 hücrelik siyah çerçeve ve 5x5 iç bloklar ile doğrudan öğrencinin okul numarasını kodlar.
  // Kamera açısından bağımsız (0°, 90°, 180°, 270°) anında ve sıfır hata ile tanınır.
  function generateOpticalBinaryIdSVG(options) {
    const { studentIndex = 0, studentId = '', studentNo = '', examId = '' } = options || {};
    const effectiveNo = (studentNo && studentNo !== '......' && studentNo !== '-') ? studentNo : (studentIndex > 0 ? String(studentIndex) : '0');
    const num = parseInt(effectiveNo, 10) || 0;

    // OmrEngine üzerinden ArUco SVG üretimi (v1.0.92 başlık yüksekliğini birebir koruyan 46px boyut)
    let arucoSvg = '';
    if (window.OmrEngine && typeof window.OmrEngine.generateArucoSVG === 'function') {
      arucoSvg = window.OmrEngine.generateArucoSVG(num, 46);
    } else {
      const totalSize = 56;
      let rects = `<rect x="0" y="0" width="${totalSize}" height="${totalSize}" fill="#000000" /><rect x="8" y="8" width="40" height="40" fill="#ffffff" />`;
      arucoSvg = `<svg viewBox="0 0 ${totalSize} ${totalSize}" width="46" height="46" shape-rendering="crispEdges" style="display: block;">${rects}</svg>`;
    }

    const isNamed = studentNo && studentNo !== '......' && studentNo !== '-';
    const caption = isNamed ? `NO:${studentNo}` : (studentIndex > 0 ? `ID:#${studentIndex}` : 'ID:---');

    return `
      <div class="omr-id-badge omr-aruco-badge" title="Öğrenci ArUco Kimlik Kodu: ${caption}">
        <div class="omr-binary-strip-wrap" style="background: #ffffff; padding: 2px 5px; display: flex; flex-direction: column; align-items: center; border: 2px solid #000000; border-radius: 6px; box-sizing: border-box;">
          <div style="font-size: 0.48rem; font-weight: 800; color: #000000; letter-spacing: 0.4px; margin-bottom: 1px; text-transform: uppercase;">KİMLİK KODU</div>
          <div style="width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            ${arucoSvg}
          </div>
          <div class="omr-id-caption" style="font-size: 0.60rem; font-weight: 800; font-family: monospace; color: #000000; margin-top: 1px; line-height: 1;">
            ${caption}
          </div>
        </div>
      </div>
    `;
  }

  // Vektörel Köşe Referans Çapası (Yazıcı/Tarayıcı Dostu SVG - Asla Silinmez ve Yüksek Kontrastlı)
  function renderCornerAnchorSVG(posClass) {
    return `<svg class="omr-anchor ${posClass}" viewBox="0 0 24 24" width="22" height="22" shape-rendering="crispEdges" style="position: absolute; z-index: 10; display: block;">
      <rect x="0" y="0" width="24" height="24" fill="#000000" rx="3" />
      <rect x="3.5" y="3.5" width="17" height="17" fill="#ffffff" rx="2" />
      <rect x="7" y="7" width="10" height="10" fill="#000000" rx="1" />
    </svg>`;
  }

  // Tekil Optik Kart HTML Şablonu (5 Sabit Ders Cebi & Sabit 1. Soru Başlangıç Mimarisi + ArUco Rozet)
  function generateSingleDesktopOpticalCardHTML(options) {
    const {
      examName = 'Haftalık Değerlendirme',
      studentName = '................................',
      studentNo = '......',
      studentId = '',
      studentIndex = 0,
      examId = '',
      totalQuestions = 20,
      letters = ['A', 'B', 'C', 'D'],
      perPage = 2,
      isMultiSubject = false,
      subjects = []
    } = options;

    const qrBadgeHtml = generateOpticalBinaryIdSVG({
      studentIndex,
      studentId,
      studentNo,
      examId: examId || (activeExam ? activeExam.id : ''),
      perPage: perPage || 2
    });

    // 5 SABİT DERS CEBİ MİMARİSİ:
    // 1 ders seçilirse belirlenen 1. ders cebine (Slot 0) eklenir ve diğer 4 ders cebi boş kalır.
    // Çoklu ders seçilirse her ders sırasıyla kendi sabit cebine (Slot 0..4) yerleşir.
    const effectiveSubjects = (isMultiSubject && Array.isArray(subjects) && subjects.length > 0)
      ? subjects
      : [{ id: 'sub_0', name: examName || 'Ders', questionCount: totalQuestions || 10 }];

    const maxSubjQ = Math.max(...effectiveSubjects.map(s => s.questionCount || 0));
    const isCompact = maxSubjQ > 20;

    const maxSlots = 5;
    let subjectsHtml = '';
    for (let sIdx = 0; sIdx < maxSlots; sIdx++) {
      const subj = effectiveSubjects[sIdx];
      if (subj) {
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
          <div class="omr-subject-block slot-${sIdx}">
            <div class="omr-subject-header">
              <span class="omr-subject-name" title="${subj.name}">${subj.name}</span>
              <span class="omr-subject-badge">${count} Soru</span>
            </div>
            <div class="omr-subject-rows">
              ${rowsHtml}
            </div>
          </div>
        `;
      } else {
        // Boş yuva: Tam aynı 18.8% genişlikte boş alan (sayfa dengesini ve koordinatları korur)
        subjectsHtml += `
          <div class="omr-subject-block omr-slot-empty" style="visibility: hidden; border: none; background: transparent;">
          </div>
        `;
      }
    }

    const subjSubtitle = (isMultiSubject && effectiveSubjects.length > 0)
      ? `<small style="font-size: 0.68rem; font-weight: 700; opacity: 0.85; margin-left: 6px;">(${effectiveSubjects.map(s => s.name).join(' • ')})</small>`
      : '';

    return `
      <div class="omr-card omr-multi ${isCompact ? 'compact-rows' : ''}">
        <!-- 4 Köşe Referans Çapası (CamScanner & Tarayıcı Uyumlu Vektör Çapa) -->
        ${renderCornerAnchorSVG('omr-anchor-tl')}
        ${renderCornerAnchorSVG('omr-anchor-tr')}
        ${renderCornerAnchorSVG('omr-anchor-bl')}
        ${renderCornerAnchorSVG('omr-anchor-br')}

        <!-- Üst Başlık & Öğrenci Bilgileri & ArUco Kimlik Rozeti -->
        <div class="omr-card-header">
          <div class="omr-header-main">
            <div class="omr-header-title">
              ${examName}
              ${subjSubtitle}
            </div>
            <div class="omr-student-info">
              <div><strong>Öğrenci:</strong> ${studentName}</div>
              <div><strong>No:</strong> ${studentNo}</div>
            </div>
          </div>
          ${qrBadgeHtml}
        </div>

        <!-- 5 Sabit Ders Cebi Gövdesi -->
        <div class="omr-card-body" style="padding: 2px 0;">
          <div class="omr-multi-subjects-grid cols-5 fixed-5-slots">
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
        previewStudents = checkedStudentIds.map((id, sIdx) => {
          const s = (state.students || []).find(st => st && String(st.id) === String(id));
          return s ? { id: s.id, name: `${s.name || ''} ${s.surname || ''}`.trim(), number: s.number || '', index: sIdx + 1 } : { id: 'preview_' + sIdx, name: 'Örnek Öğrenci', number: '123', index: sIdx + 1 };
        });
        if (previewStudents.length === 0) {
          previewStudents = [{ id: 's1', name: 'Ahmet YILMAZ', number: '105', index: 1 }, { id: 's2', name: 'Ayşe DEMİR', number: '108', index: 2 }];
        }
      } else {
        for (let i = 0; i < perPage; i++) {
          previewStudents.push({ id: '', name: '................................', number: '......', index: i + 1 });
        }
      }

      const cardsToShow = previewStudents.slice(0, perPage);
      let cardsHtml = '';
      cardsToShow.forEach((st, idx) => {
        cardsHtml += generateSingleDesktopOpticalCardHTML({
          examName,
          studentName: st.name,
          studentNo: st.number,
          studentId: st.id || '',
          studentIndex: (formType === 'named' ? (st.index || (idx + 1)) : 0),
          examId: activeExam ? (activeExam.id || '') : '',
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
      const isMiddle = state.educationLevel === 'middle';
      const examBranch = activeExam ? activeExam.branch : '';
      const allClassStudents = (state.students || []).filter(student => {
        if (!student) return false;
        return !isMiddle || !examBranch || student.branch === examBranch;
      }).sort((a, b) => {
        const nameA = String(a?.name || '').trim();
        const nameB = String(b?.name || '').trim();
        const cmpName = nameA.localeCompare(nameB, 'tr');
        if (cmpName !== 0) return cmpName;
        const surA = String(a?.surname || '').trim();
        const surB = String(b?.surname || '').trim();
        const cmpSur = surA.localeCompare(surB, 'tr');
        if (cmpSur !== 0) return cmpSur;
        const noA = parseInt(a?.number, 10) || 0;
        const noB = parseInt(b?.number, 10) || 0;
        return noA - noB;
      });

      studentIds.forEach(id => {
        const s = allClassStudents.find(st => String(st.id) === String(id));
        if (s) {
          const canonicalIdx = allClassStudents.indexOf(s) + 1;
          studentsList.push({
            id: s.id,
            name: `${s.name} ${s.surname || ''}`.trim(),
            number: s.number || '',
            index: canonicalIdx
          });
        }
      });
      if (studentsList.length === 0) {
        const count = perPage === 4 ? 32 : (perPage === 2 ? 30 : 20);
        for (let i = 1; i <= count; i++) {
          studentsList.push({ id: '', name: '................................', number: '......', index: i });
        }
      }
    } else {
      // Boş formlar: Sayfaları tam dolduracak miktarda veya kullanıcının belirttiği adette oluştur
      const blankCountInput = document.getElementById('optical-blank-count-input');
      const customBlankCount = blankCountInput ? parseInt(blankCountInput.value, 10) : 0;
      const count = customBlankCount > 0 ? customBlankCount : (perPage === 4 ? 32 : (perPage === 2 ? 30 : 20));
      for (let i = 1; i <= count; i++) {
        studentsList.push({ id: '', name: '................................', number: '......', index: i });
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
          studentId: st.id || '',
          studentIndex: (formType === 'named' ? (st.index || 0) : 0),
          examId: activeExam ? (activeExam.id || '') : '',
          totalQuestions: questionCount,
          letters,
          perPage,
          isMultiSubject,
          subjects
        });
      });

      pagesHtml += `<div class="omr-print-page omr-per-page-${perPage}">${pageCardsHtml}</div>`;
    }

    if (printContainer) {
      printContainer.innerHTML = pagesHtml;
    }
    return pagesHtml;
  }

  function buildDesktopOpticalPrintDocument(pagesHtml, examTitle = 'Optik_Form') {
    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${examTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 4mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    .omr-print-page {
      display: block;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      width: 100%;
      box-sizing: border-box;
      padding: 1mm 2mm;
      margin: 0 auto;
      background: #ffffff;
      overflow: hidden;
    }
    .omr-print-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .omr-print-page.omr-per-page-1 {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 274mm;
      max-height: 276mm;
    }
    .omr-print-page.omr-per-page-1 .omr-card {
      height: 266mm;
      max-height: 268mm;
      max-width: 100%;
      margin: 0 auto;
      padding: 14px 18px;
    }
    .omr-print-page.omr-per-page-2 {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4mm;
      height: 260mm;
      max-height: 262mm;
      padding: 1mm 2mm;
    }
    .omr-print-page.omr-per-page-2 .omr-card {
      height: 128mm;
      max-height: 128mm;
      max-width: 100%;
      margin: 0;
      padding: 6px 10px;
    }
    .omr-print-page.omr-per-page-2 .omr-card.omr-multi {
      height: 128mm;
      max-height: 128mm;
      padding: 4px 8px;
    }
    .omr-print-page.omr-per-page-4 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 128mm 128mm;
      gap: 3mm;
      height: 262mm;
      max-height: 264mm;
    }
    .omr-print-page.omr-per-page-4 .omr-card {
      height: 128mm;
      max-height: 128mm;
      max-width: 100%;
      margin: 0;
      padding: 6px 8px;
    }
    .omr-card {
      position: relative;
      background: #ffffff;
      color: #000000;
      border: 1.5px solid #000000;
      border-radius: 6px;
      box-sizing: border-box;
      width: 100%;
      user-select: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
    }
    .omr-anchor {
      position: absolute;
      width: 22px;
      height: 22px;
      display: block;
      box-sizing: border-box;
      z-index: 10;
    }
    .omr-anchor-tl { top: 6px; left: 6px; }
    .omr-anchor-tr { top: 6px; right: 6px; }
    .omr-anchor-bl { bottom: 6px; left: 6px; }
    .omr-anchor-br { bottom: 6px; right: 6px; }
    .omr-card-header {
      margin: 2px 26px 4px 26px;
      border-bottom: 2px solid #000000;
      padding-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .omr-header-main {
      flex: 1;
      min-width: 0;
    }
    .omr-header-title {
      font-size: 0.88rem;
      font-weight: 900;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000000;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .omr-student-info {
      display: flex;
      gap: 16px;
      margin-top: 3px;
      font-size: 0.8rem;
      color: #000000;
      font-weight: 700;
    }
    .omr-id-badge {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1px;
    }
    .omr-aruco-badge svg {
      width: 46px !important;
      height: 46px !important;
      display: block;
    }
    .omr-per-page-2 .omr-aruco-badge svg {
      width: 44px !important;
      height: 44px !important;
    }
    .omr-per-page-4 .omr-aruco-badge svg {
      width: 38px !important;
      height: 38px !important;
    }
    .omr-card-body {
      margin: 4px 14px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-sizing: border-box;
    }
    .omr-multi-subjects-grid {
      display: flex;
      width: 100%;
      height: 100%;
      justify-content: space-between;
      gap: 6px;
      box-sizing: border-box;
    }
    .omr-multi-subjects-grid.cols-5 .omr-subject-block,
    .omr-multi-subjects-grid.fixed-5-slots .omr-subject-block {
      width: 18.8%;
      flex: 0 0 18.8%;
    }
    .omr-subject-block {
      display: flex;
      flex-direction: column;
      border: 1.2px solid #000000;
      border-radius: 4px;
      padding: 3px 4px;
      box-sizing: border-box;
      background: #ffffff;
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
    .omr-subject-header {
      border-bottom: 1.5px solid #000000;
      padding-bottom: 2px;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
    }
    .omr-subject-name {
      font-size: 0.72rem;
      font-weight: 900;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .omr-subject-badge {
      font-size: 0.58rem;
      font-weight: 800;
      color: #000000;
      background: #e2e8f0;
      padding: 1px 4px;
      border-radius: 3px;
      white-space: nowrap;
    }
    .omr-subject-rows {
      display: flex;
      flex-direction: column;
      justify-content: flex-start !important;
      align-items: stretch;
      flex: 1;
      gap: 2px;
      box-sizing: border-box;
    }
    .omr-q-row {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      height: 20px !important;
      min-height: 20px !important;
      box-sizing: border-box;
    }
    .omr-q-num {
      width: 22%;
      font-size: 0.74rem;
      font-weight: 800;
      text-align: right;
      color: #000000;
      box-sizing: border-box;
      padding-right: 4px;
    }
    .omr-q-bubbles {
      width: 78%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
    }
    .omr-bubble {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1.6px solid #000000 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-size: 0.66rem;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      box-sizing: border-box;
    }
    .omr-card-footer {
      margin: 4px 24px 2px 24px;
      border-top: 1px dashed #64748b;
      padding-top: 3px;
      display: flex;
      justify-content: space-between;
      font-size: 0.62rem;
      color: #475569;
      font-weight: 600;
    }
    /* 2-per-page (A5 İkili Form) milimetrik kalibrasyon kuralları */
    .omr-per-page-2 .omr-card-header {
      margin: 2px 22px 3px 22px !important;
      padding-bottom: 2px !important;
    }
    .omr-per-page-2 .omr-header-title {
      font-size: 0.80rem !important;
    }
    .omr-per-page-2 .omr-student-info {
      font-size: 0.72rem !important;
      gap: 12px !important;
      margin-top: 2px !important;
    }
    .omr-per-page-2 .omr-card-body {
      margin: 2px 10px !important;
      padding: 1px 0 !important;
    }
    .omr-per-page-2 .omr-q-row {
      gap: 4px !important;
    }
    .omr-per-page-2 .omr-q-num {
      font-size: 0.70rem !important;
      padding-right: 3px !important;
    }
    .omr-per-page-2 .omr-card.omr-multi {
      padding: 4px 8px !important;
    }
    .omr-per-page-2 .omr-card.omr-multi .omr-subject-block {
      padding: 2px 3px !important;
    }
    .omr-per-page-2 .omr-card.omr-multi .omr-subject-header {
      padding-bottom: 1px !important;
      margin-bottom: 2px !important;
    }
    .omr-per-page-2 .omr-card.omr-multi .omr-subject-name {
      font-size: 0.66rem !important;
    }
    .omr-per-page-2 .omr-card.omr-multi .omr-subject-badge {
      font-size: 0.54rem !important;
      padding: 0 3px !important;
    }
    .omr-per-page-2 .omr-card.omr-multi .omr-bubble {
      width: 14.5px !important;
      height: 14.5px !important;
      font-size: 0.55rem !important;
      border-width: 1.4px !important;
    }
    .omr-per-page-2 .omr-card-footer {
      margin: 2px 22px 2px 22px !important;
      padding-top: 2px !important;
      font-size: 0.58rem !important;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
  }

  // Başlangıç listesini yükle
  renderExamsList();
}

function computeExamSummaryStats(rawExam, state) {
  if (activeExam && rawExam && String(activeExam.id) === String(rawExam.id)) {
    activeExam = rawExam;
    window.activeWeeklyExam = rawExam;
  }
  const exam = rawExam || activeExam;
  const allRoster = (state && (state.rawStudents || state.students)) || [];
  const dedupKey = `${exam.updatedAt || exam.createdAt || exam.id}_${allRoster.length}`;
  if (exam._dedupStamp !== dedupKey && window.CloudSync && typeof window.CloudSync.deduplicateExamResults === 'function') {
    window.CloudSync.deduplicateExamResults(exam, allRoster);
    exam._dedupStamp = dedupKey;
  }

  // O(1) öğrenci indeksleme haritaları
  const stuById = new Map();
  const stuByNo = new Map();
  for (let i = 0; i < allRoster.length; i++) {
    const s = allRoster[i];
    if (!s) continue;
    stuById.set(String(s.id), s);
    if (s.number !== undefined && s.number !== null) {
      const noStr = String(s.number).trim();
      if (noStr && noStr !== '-') {
        stuByNo.set(noStr, s);
        const noInt = parseInt(noStr, 10);
        if (!isNaN(noInt) && noInt > 0) stuByNo.set(String(noInt), s);
      }
    }
  }

  const scoreMap = {};
  const resolveStuKey = (rawKey, resObj) => {
    const rawStr = String(rawKey);
    const byId = stuById.get(rawStr);
    if (byId) return String(byId.id);
    const sNo = resObj ? String(resObj.studentNo || resObj.studentNumber || '').trim() : '';
    if (sNo && sNo !== '-') {
      const byResNo = stuByNo.get(sNo);
      if (byResNo) return String(byResNo.id);
    }
    const rawInt = parseInt(rawStr, 10);
    if (!isNaN(rawInt) && rawInt > 0) {
      const byRawNo = stuByNo.get(String(rawInt));
      if (byRawNo) return String(byRawNo.id);
    }
    return rawStr;
  };

  if (exam.examScores && typeof exam.examScores === 'object') {
    for (const stdId in exam.examScores) {
      const score = exam.examScores[stdId];
      if (score !== undefined && score !== null && score !== '') {
        const num = parseFloat(score);
        if (!isNaN(num)) {
          const canonicalKey = resolveStuKey(stdId, exam.studentResults ? exam.studentResults[stdId] : null);
          scoreMap[canonicalKey] = num;
        }
      }
    }
  }
  if (exam.studentResults && typeof exam.studentResults === 'object') {
    for (const stdId in exam.studentResults) {
      const sr = exam.studentResults[stdId];
      if (sr) {
        const canonicalKey = resolveStuKey(stdId, sr);
        if (scoreMap[canonicalKey] === undefined) {
          const score = sr.score;
          if (score !== undefined && score !== null && score !== '') {
            const num = parseFloat(score);
            if (!isNaN(num)) scoreMap[canonicalKey] = num;
          }
        }
      }
    }
  }

  const scores = [];
  for (const stdId in scoreMap) {
    scores.push({ studentId: stdId, score: scoreMap[stdId] });
  }

  const avgScore = scores.length > 0
    ? (scores.reduce((sum, item) => sum + item.score, 0) / scores.length).toFixed(1)
    : '0';

  scores.sort((a, b) => b.score - a.score);
  const examSettings = exam.settings || {};
  const topCount = Math.max(3, parseInt(examSettings.topCount, 10) || 3);
  const topList = scores.slice(0, topCount);
  const topThree = scores.slice(0, 3);
  const rankPointsMap = examSettings.rankPoints || { 1: 5, 2: 3, 3: 1 };

  let currentRank = 1;
  const rankedItems = topList.map((item, idx) => {
    if (idx > 0 && item.score < topList[idx - 1].score) {
      currentRank = idx + 1;
    }
    const reward = rankPointsMap[currentRank] || 0;
    return { ...item, rank: currentRank, reward };
  });

  const getStudentShortName = (studentId) => {
    const student = stuById.get(String(studentId));
    const sSurname = (student && student.surname) ? String(student.surname) : '';
    return student ? `${student.name || ''} ${sSurname ? sSurname[0] + '.' : ''}`.trim() : 'Öğrenci';
  };

  let topStudentsHTML = '<div class="exam-card-topstudents" style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">';
  if (rankedItems.length === 0) {
    topStudentsHTML += '<span style="color: var(--text-muted); font-size: 0.75rem;">Henüz puan girişi yapılmamış.</span>';
  } else {
    rankedItems.forEach((item) => {
      const name = getStudentShortName(item.studentId);
      let medal = '';
      if (item.rank === 1) medal = '🥇';
      else if (item.rank === 2) medal = '🥈';
      else if (item.rank === 3) medal = '🥉';
      else medal = `<span style="display:inline-block; min-width:1.2rem; font-weight:700; color:var(--text-secondary);">${item.rank}.</span>`;

      const rewardBadge = item.reward > 0
        ? ` <span style="font-size: 0.68rem; color: #10b981; font-weight: 700;">(+${item.reward})</span>`
        : '';

      topStudentsHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-weight: 500; margin-bottom: 0.2rem;">
          <span style="color: var(--text-secondary);">${medal} ${name}</span>
          <strong style="color: var(--text-primary);">${item.score} Puan${rewardBadge}</strong>
        </div>
      `;
    });
  }
  topStudentsHTML += '</div>';

  const topOneText = rankedItems.length > 0
    ? `🥇 ${getStudentShortName(rankedItems[0].studentId)} (${rankedItems[0].score})`
    : '-';

  const formattedWeek = window.formatWeekTR ? window.formatWeekTR(exam.weekId, 'full') : (exam.weekId || '');
  const penaltyText = exam.wrongAffects ? `${exam.penaltyRate} Yanlış 1 Doğruyu Götürür` : 'Yanlışlar Doğruları Etkilemez';
  const opticalBadge = exam.hasOpticalForm ? `<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary); font-size: 0.72rem; padding: 0.1rem 0.35rem; font-weight: 700;">📝 ${exam.choicesCount || 4} Şıklı Optik</span>` : '';
  const multiBadge = exam.isMultiSubject && exam.subjects ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; font-size: 0.72rem; padding: 0.1rem 0.35rem; font-weight: 700;">📚 ${exam.subjects.length} Ders</span>` : '';

  return {
    exam,
    scores,
    avgScore,
    topThree,
    topOneText,
    topStudentsHTML,
    formattedWeek,
    penaltyText,
    opticalBadge,
    multiBadge
  };
}

let olderExamsModalFilterMode = 'older'; // 'older' (4,5,6...) veya 'all' (1..N)
let olderExamsModalBound = false;

function ensureOlderExamsModalEvents() {
  if (olderExamsModalBound) return;
  const modal = document.getElementById('modal-older-exams-list');
  if (!modal) return;
  olderExamsModalBound = true;

  const closeModal = () => {
    modal.classList.remove('active');
    modal.style.display = 'none';
  };

  const btnClose = document.getElementById('btn-close-older-exams-modal');
  const btnCloseFooter = document.getElementById('btn-close-older-exams-modal-footer');
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCloseFooter) btnCloseFooter.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  const searchInput = document.getElementById('older-exams-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderOlderExamsModalList();
    });
  }

  const btnOlderOnly = document.getElementById('btn-filter-older-only');
  const btnAllExams = document.getElementById('btn-filter-all-exams');
  if (btnOlderOnly) {
    btnOlderOnly.addEventListener('click', () => {
      olderExamsModalFilterMode = 'older';
      renderOlderExamsModalList();
    });
  }
  if (btnAllExams) {
    btnAllExams.addEventListener('click', () => {
      olderExamsModalFilterMode = 'all';
      renderOlderExamsModalList();
    });
  }

  const headerBtn = document.getElementById('btn-open-older-exams-modal');
  if (headerBtn) {
    headerBtn.addEventListener('click', () => {
      openOlderExamsModal('older');
    });
  }
}

function openOlderExamsModal(mode = 'older') {
  ensureOlderExamsModalEvents();
  const modal = document.getElementById('modal-older-exams-list');
  if (!modal) return;
  olderExamsModalFilterMode = mode || 'older';
  const searchInput = document.getElementById('older-exams-search-input');
  if (searchInput) searchInput.value = '';
  renderOlderExamsModalList();
  modal.style.display = 'flex';
  modal.classList.add('active');
}
window.openOlderExamsModal = openOlderExamsModal;

function renderOlderExamsModalList() {
  const modal = document.getElementById('modal-older-exams-list');
  const tbody = document.getElementById('older-exams-list-tbody');
  if (!modal || !tbody) return;

  let state = (stateManager && stateManager.state) ? stateManager.state : stateManager.loadState();
  let exams = (state.weeklyEvaluations || []).map(e => {
    if (e && !e.id) {
      e.id = 'exam_' + (e.createdAt ? new Date(e.createdAt).getTime() : Date.now());
    }
    return e;
  }).filter(e => e && e.id);

  exams.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // Eğer toplam sınav <= 3 ise otomatik tümünü göster
  const effectiveMode = (exams.length <= 3) ? 'all' : olderExamsModalFilterMode;

  const btnOlderOnly = document.getElementById('btn-filter-older-only');
  const btnAllExams = document.getElementById('btn-filter-all-exams');
  const titleEl = document.getElementById('older-exams-modal-title');
  const countBadge = document.getElementById('older-exams-modal-count-badge');

  const olderCount = Math.max(0, exams.length - 3);
  if (btnOlderOnly) {
    btnOlderOnly.textContent = `4, 5, 6... Sınavlar (${olderCount})`;
    btnOlderOnly.className = `btn btn-sm ${effectiveMode === 'older' ? 'btn-primary' : 'btn-secondary'}`;
    btnOlderOnly.style.display = exams.length > 3 ? 'inline-flex' : 'none';
  }
  if (btnAllExams) {
    btnAllExams.textContent = `Tüm Sınavlar (${exams.length})`;
    btnAllExams.className = `btn btn-sm ${effectiveMode === 'all' ? 'btn-primary' : 'btn-secondary'}`;
  }
  if (titleEl) {
    titleEl.textContent = effectiveMode === 'older'
      ? 'Diğer Sınavlar Listesi (4, 5, 6... Sınavlar)'
      : 'Tüm Sınavlar Listesi';
  }

  const searchInput = document.getElementById('older-exams-search-input');
  const query = searchInput ? searchInput.value.trim().toLocaleLowerCase('tr') : '';

  const indexedExams = exams.map((rawExam, idx) => ({
    rawExam,
    orderNo: idx + 1
  }));

  let filtered = effectiveMode === 'older'
    ? indexedExams.filter(item => item.orderNo >= 4)
    : indexedExams;

  if (query) {
    filtered = filtered.filter(({ rawExam }) => {
      const name = String(rawExam.examName || '').toLocaleLowerCase('tr');
      const branch = String(rawExam.branch || '').toLocaleLowerCase('tr');
      const weekStr = (window.formatWeekTR ? window.formatWeekTR(rawExam.weekId, 'full') : (rawExam.weekId || '')).toLocaleLowerCase('tr');
      return name.includes(query) || branch.includes(query) || weekStr.includes(query);
    });
  }

  if (countBadge) {
    countBadge.textContent = `${filtered.length} Sınav`;
  }

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          Aranan kriterlere uygun sınav bulunamadı.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(({ rawExam, orderNo }) => {
    const stats = computeExamSummaryStats(rawExam, state);
    const { exam, scores, avgScore, topOneText, formattedWeek, opticalBadge, multiBadge } = stats;
    const isSelected = !!(activeExam && String(activeExam.id) === String(exam.id));

    const tr = document.createElement('tr');
    tr.className = `older-exam-row ${isSelected ? 'active-older-exam-row' : ''}`;
    tr.innerHTML = `
      <td style="text-align: center; vertical-align: middle; font-weight: 700; color: var(--text-muted); padding: 0.65rem 0.5rem;">
        <span class="badge" style="background: ${isSelected ? 'var(--primary)' : 'var(--bg-primary)'}; color: ${isSelected ? '#fff' : 'var(--text-secondary)'}; border: 1px solid var(--border-color); font-size: 0.75rem; font-weight: 700; padding: 0.15rem 0.45rem;">#${orderNo}</span>
      </td>
      <td style="vertical-align: middle; padding: 0.65rem 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
          <strong style="color: var(--text-primary); font-size: 0.9rem;">${exam.examName || 'Sınav'}</strong>
          ${exam.branch ? `<span class="badge" style="background: rgba(255, 255, 255, 0.1); color: var(--text-primary); font-size: 0.68rem; padding: 0.1rem 0.35rem;">${exam.branch}</span>` : ''}
          ${multiBadge}
          ${opticalBadge}
          ${isSelected ? `<span class="badge" style="background: rgba(16, 185, 129, 0.16); color: #059669; font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.4rem;">✓ Açık</span>` : ''}
        </div>
      </td>
      <td style="vertical-align: middle; color: var(--text-secondary); font-size: 0.8rem; padding: 0.65rem 0.5rem;">
        ${formattedWeek || '-'}
      </td>
      <td style="text-align: center; vertical-align: middle; font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; padding: 0.65rem 0.5rem;">
        <strong>${exam.totalQuestions || 0}</strong> Soru • ${exam.duration || 0} Dk
      </td>
      <td style="text-align: center; vertical-align: middle; font-size: 0.8rem; padding: 0.65rem 0.5rem;">
        <span class="badge" style="background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-secondary); font-size: 0.74rem; font-weight: 600;">${scores.length} Öğrenci</span>
      </td>
      <td style="text-align: center; vertical-align: middle; font-weight: 700; color: var(--primary); font-size: 0.85rem; padding: 0.65rem 0.5rem;">
        Ort: ${avgScore}
      </td>
      <td style="vertical-align: middle; font-size: 0.78rem; color: var(--text-secondary); padding: 0.65rem 0.5rem; white-space: nowrap;">
        ${topOneText}
      </td>
      <td style="text-align: center; vertical-align: middle; white-space: nowrap; padding: 0.65rem 0.5rem;">
        <div style="display: inline-flex; align-items: center; gap: 0.35rem;">
          <button type="button" class="btn btn-sm btn-primary btn-select-older-exam" style="font-size: 0.74rem; padding: 0.28rem 0.65rem; height: auto; display: inline-flex; align-items: center; gap: 4px;">
            <i data-lucide="folder-open" style="width: 13px; height: 13px;"></i>
            <span>Aç</span>
          </button>
          <button type="button" class="btn btn-sm btn-secondary btn-delete-older-exam" style="font-size: 0.74rem; padding: 0.28rem 0.45rem; height: auto; color: var(--danger); border-color: rgba(239, 68, 68, 0.3);" title="Sınavı Sil">
            <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
          </button>
        </div>
      </td>
    `;

    const selectExamFromModal = () => {
      modal.classList.remove('active');
      modal.style.display = 'none';
      openActiveExam(exam);
      if (activeExamCard) {
        setTimeout(() => {
          activeExamCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
    };

    tr.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-older-exam')) return;
      selectExamFromModal();
    });

    const btnSelect = tr.querySelector('.btn-select-older-exam');
    if (btnSelect) {
      btnSelect.addEventListener('click', (e) => {
        e.stopPropagation();
        selectExamFromModal();
      });
    }

    const btnDelete = tr.querySelector('.btn-delete-older-exam');
    if (btnDelete) {
      btnDelete.addEventListener('click', async (e) => {
        e.stopPropagation();
        const examNameToDelete = exam.examName || 'Sınav';
        const examIdToDelete = exam.id;

        const confirmed = window.showConfirmDialog
          ? await window.showConfirmDialog({
              title: 'Sınavı Sil',
              message: `<strong>"${examNameToDelete}"</strong> sınavını ve bu sınava ait tüm öğrenci değerlendirme sonuçlarını tamamen silmek istediğinize emin misiniz?<br><span style="color:#ef4444; font-weight:700;">Bu işlem geri alınamaz!</span>`,
              confirmText: 'Sınavı Sil',
              cancelText: 'Vazgeç',
              type: 'danger'
            })
          : confirm(`"${examNameToDelete}" sınavını silmek istediğinize emin misiniz?`);
        if (!confirmed) return;

        stateManager.deleteExam(examIdToDelete);

        // Canlı El Terminali ve Bulut Eşitlemesi (Sınavı Terminalden ve Buluttan da Sil)
        if (window.CloudSync && typeof window.CloudSync.pushLiveExamDeleted === 'function') {
          window.CloudSync.pushLiveExamDeleted(examIdToDelete, examNameToDelete, 'desktop').catch(() => {});
        }

        if (activeExam && String(activeExam.id) === String(examIdToDelete)) {
          activeExam = null;
          window.activeWeeklyExam = null;
          if (activeExamCard) activeExamCard.style.display = 'none';
          if (btnPrintReport) btnPrintReport.style.display = 'none';
        }
        renderExamsList();
        renderOlderExamsModalList();
        document.dispatchEvent(new CustomEvent('stateChanged'));
        if (window.showToast) window.showToast(`"${examNameToDelete}" sınavı silindi ve El Terminalinden kaldırıldı.`, 'success');
      });
    }

    tbody.appendChild(tr);
  });

  if (window.safeCreateIcons) window.safeCreateIcons();
  else if (window.lucide) window.lucide.createIcons();
}

function getSortedWeeklyExams(stateObj) {
  const st = stateObj || ((stateManager && stateManager.state) ? stateManager.state : stateManager.loadState());
  const exams = (st.weeklyEvaluations || []).map(e => {
    if (e && !e.id) {
      e.id = 'exam_' + (e.createdAt ? new Date(e.createdAt).getTime() : Date.now());
    }
    return e;
  }).filter(e => e && e.id);

  exams.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return exams;
}

// ==========================================================================
// ÖĞRENCİ SINAV SIRALAMASI VE İSTATİSTİK RAPORU MODÜLÜ
// (TÜM SINAVLAR / SON 5 SINAV / SON 10 SINAV / SEÇİLEN SINAVLAR)
// ==========================================================================
let examStatsRangeMode = 'all'; // 'all' | 'last_5' | 'last_10' | 'last_3' | 'custom'
let examStatsCustomSelectedIds = new Set();
let examStatsSelectedBranch = 'all';
let examStatsExpandedStudentIds = new Set();
let examStatsEventsBound = false;

function extractStudentExamMetrics(exam, student) {
  const totalQ = Math.max(1, parseInt(exam && exam.totalQuestions, 10) || 20);
  if (!exam || !student) {
    return { participated: false, correct: 0, wrong: 0, blank: 0, net: 0, score: null, totalQuestions: totalQ };
  }

  const stuIdStr = String(student.id);
  const stuNoStr = (student.number !== undefined && student.number !== null && String(student.number).trim() !== '')
    ? String(student.number).trim()
    : '';

  // Sınav bazlı hafif önbellek (updatedAt ve sonuç sayısına göre otomatik geçersizlenir)
  const resCount = exam.studentResults ? Object.keys(exam.studentResults).length : 0;
  const scCount = exam.examScores ? Object.keys(exam.examScores).length : 0;
  const cacheStamp = `${exam.updatedAt || ''}|${totalQ}|${exam.wrongAffects ? 1 : 0}|${exam.penaltyRate || 4}|${resCount}|${scCount}`;
  if (exam._metricsCacheStamp !== cacheStamp || !(exam._metricsCache instanceof Map)) {
    exam._metricsCacheStamp = cacheStamp;
    exam._metricsCache = new Map();
  }
  const cacheKey = `${stuIdStr}:${stuNoStr}`;
  const cachedMetric = exam._metricsCache.get(cacheKey);
  if (cachedMetric) {
    return cachedMetric;
  }

  let res = null;
  if (exam.studentResults && typeof exam.studentResults === 'object') {
    if (exam.studentResults[student.id]) {
      res = exam.studentResults[student.id];
    } else if (exam.studentResults[stuIdStr]) {
      res = exam.studentResults[stuIdStr];
    } else if (stuNoStr && exam.studentResults[stuNoStr]) {
      res = exam.studentResults[stuNoStr];
    } else if (stuNoStr) {
      const stuNoNum = parseInt(stuNoStr, 10);
      for (const k in exam.studentResults) {
        const candidate = exam.studentResults[k];
        if (!candidate) continue;
        const candNo = String(candidate.studentNo || candidate.studentNumber || '').trim();
        if (candNo && (candNo === stuNoStr || (stuNoNum > 0 && parseInt(candNo, 10) === stuNoNum))) {
          res = candidate;
          break;
        }
      }
    }
  }

  let rawScoreFromExamScores = null;
  if (exam.examScores && typeof exam.examScores === 'object') {
    let scVal = exam.examScores[student.id];
    if (scVal === undefined) scVal = exam.examScores[stuIdStr];
    if (scVal === undefined && stuNoStr) scVal = exam.examScores[stuNoStr];
    if (scVal !== undefined && scVal !== null && scVal !== '') {
      const parsed = parseFloat(scVal);
      if (!isNaN(parsed)) rawScoreFromExamScores = parsed;
    }
  }

  const hasAnswers = !!(res && res.answers && Object.keys(res.answers).length > 0);
  const hasResScore = !!(res && res.score !== undefined && res.score !== null && res.score !== '' && !isNaN(parseFloat(res.score)));
  const hasResCounts = !!(res && (
    (res.correct !== undefined && res.correct !== '') ||
    (res.wrong !== undefined && res.wrong !== '') ||
    (res.net !== undefined && res.net !== '')
  ));

  const participated = hasAnswers || hasResScore || hasResCounts || (rawScoreFromExamScores !== null);
  if (!participated) {
    const emptyMetric = { participated: false, correct: 0, wrong: 0, blank: 0, net: 0, score: null, totalQuestions: totalQ };
    exam._metricsCache.set(cacheKey, emptyMetric);
    return emptyMetric;
  }

  let correct = 0;
  let wrong = 0;
  let blank = 0;

  if (res && (res.correct !== undefined && res.correct !== '')) {
    correct = Math.max(0, parseInt(res.correct, 10) || 0);
    wrong = (res.wrong !== undefined && res.wrong !== '') ? Math.max(0, parseInt(res.wrong, 10) || 0) : 0;
    blank = (res.blank !== undefined && res.blank !== '')
      ? Math.max(0, parseInt(res.blank, 10) || 0)
      : Math.max(0, totalQ - correct - wrong);
  } else if (hasAnswers && exam.answerKey && Object.keys(exam.answerKey).length > 0) {
    const isMulti = !!(exam.isMultiSubject && Array.isArray(exam.subjects) && exam.subjects.length > 0);
    if (isMulti) {
      const sbMap = getOrComputeSubjectBreakdown(res, exam);
      Object.values(sbMap).forEach(sb => {
        correct += parseInt(sb.correct, 10) || 0;
        wrong += parseInt(sb.wrong, 10) || 0;
        blank += parseInt(sb.blank, 10) || 0;
      });
    } else {
      for (let q = 1; q <= totalQ; q++) {
        const ans = String(res.answers[q] || res.answers[String(q)] || '').trim().toUpperCase();
        const keyAns = String(exam.answerKey[q] || exam.answerKey[String(q)] || '').trim().toUpperCase();
        if (!ans || ans === 'MULTIPLE') blank++;
        else if (keyAns && ans === keyAns) correct++;
        else wrong++;
      }
    }
  } else if (rawScoreFromExamScores !== null) {
    // Yalnızca puan girilmişse yaklaşık doğru sayısını koru veya 0 bırak
    correct = (res && res.correct !== undefined) ? (parseInt(res.correct, 10) || 0) : 0;
    wrong = (res && res.wrong !== undefined) ? (parseInt(res.wrong, 10) || 0) : 0;
    blank = (res && res.blank !== undefined) ? (parseInt(res.blank, 10) || 0) : 0;
  }

  let net = 0;
  if (res && res.net !== undefined && res.net !== null && res.net !== '' && !isNaN(parseFloat(res.net))) {
    net = parseFloat(res.net);
  } else {
    const penaltyRate = exam.wrongAffects ? (parseFloat(exam.penaltyRate) || 4) : 0;
    net = penaltyRate > 0 ? Math.max(0, correct - (wrong / penaltyRate)) : correct;
    net = parseFloat(net.toFixed(2));
  }

  let score = 0;
  if (rawScoreFromExamScores !== null) {
    score = rawScoreFromExamScores;
  } else if (hasResScore) {
    score = parseFloat(res.score);
  } else {
    score = parseFloat(((net / totalQ) * 100).toFixed(1));
  }

  const computedMetric = {
    participated: true,
    correct,
    wrong,
    blank,
    net: parseFloat(Number(net).toFixed(2)),
    score: parseFloat(Number(score).toFixed(2)),
    totalQuestions: totalQ
  };
  exam._metricsCache.set(cacheKey, computedMetric);
  return computedMetric;
}

function getTargetExamsForStatsRange(allExams, rangeMode, branchFilter, isMiddle) {
  let baseExams = [...allExams];
  if (isMiddle && branchFilter && branchFilter !== 'all') {
    baseExams = baseExams.filter(e => !e.branch || e.branch === 'all' || e.branch === branchFilter);
  }

  if (rangeMode === 'last_3') {
    return baseExams.slice(0, 3);
  }
  if (rangeMode === 'last_5') {
    return baseExams.slice(0, 5);
  }
  if (rangeMode === 'last_10') {
    return baseExams.slice(0, 10);
  }
  if (rangeMode === 'custom') {
    return baseExams.filter(e => examStatsCustomSelectedIds.has(String(e.id)));
  }
  return baseExams;
}

function computeMultiExamStudentRankingStats(selectedExams, branchFilter) {
  const state = (stateManager && stateManager.state) ? stateManager.state : stateManager.loadState();
  const isMiddle = state.educationLevel === 'middle';

  let students = [...(state.students || [])];
  if (isMiddle && branchFilter && branchFilter !== 'all') {
    students = students.filter(s => s.branch === branchFilter);
  }

  const targetExams = Array.isArray(selectedExams) ? selectedExams : [];
  const participants = [];
  const nonParticipants = [];

  students.forEach(student => {
    let enteredCount = 0;
    let applicableExamCount = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalBlank = 0;
    let totalNet = 0;
    let totalScore = 0;
    let totalQuestionsEntered = 0;
    let minScore = null;
    let maxScore = null;
    const examBreakdown = [];

    targetExams.forEach(exam => {
      // Ortaokulda sınav belirli bir şubeye aitse ve öğrenci başka şubedeyse kapsam dışı bırak
      const isApplicableToStudent = !isMiddle || !exam.branch || exam.branch === 'all' || !student.branch || exam.branch === student.branch;
      if (isApplicableToStudent) {
        applicableExamCount++;
      }

      const metrics = extractStudentExamMetrics(exam, student);
      if (metrics.participated) {
        enteredCount++;
        totalCorrect += metrics.correct;
        totalWrong += metrics.wrong;
        totalBlank += metrics.blank;
        totalNet += metrics.net;
        totalScore += metrics.score;
        totalQuestionsEntered += metrics.totalQuestions;
        if (minScore === null || metrics.score < minScore) minScore = metrics.score;
        if (maxScore === null || metrics.score > maxScore) maxScore = metrics.score;
      }

      if (isApplicableToStudent || metrics.participated) {
        examBreakdown.push({
          examId: exam.id,
          examName: exam.examName || 'Sınav',
          weekId: exam.weekId,
          branch: exam.branch || '',
          totalQuestions: metrics.totalQuestions,
          participated: metrics.participated,
          correct: metrics.correct,
          wrong: metrics.wrong,
          blank: metrics.blank,
          net: metrics.net,
          score: metrics.score
        });
      }
    });

    if (enteredCount > 0) {
      const avgScore = parseFloat((totalScore / enteredCount).toFixed(2));
      const cleanTotalNet = parseFloat(totalNet.toFixed(2));
      const avgNet = parseFloat((totalNet / enteredCount).toFixed(2));
      const avgCorrect = parseFloat((totalCorrect / enteredCount).toFixed(1));
      const avgWrong = parseFloat((totalWrong / enteredCount).toFixed(1));
      
      // Soru / Net Ağırlıklı Başarı Puanı: (Toplam Net / Girilen Sınavların Toplam Soru Sayısı) * 100
      const rawWeightedScore = totalQuestionsEntered > 0 ? (totalNet / totalQuestionsEntered) * 100 : 0;
      const weightedScore = parseFloat(Math.max(0, rawWeightedScore).toFixed(2));

      participants.push({
        student,
        enteredCount,
        applicableExamCount: Math.max(enteredCount, applicableExamCount || targetExams.length),
        totalCorrect,
        totalWrong,
        totalBlank,
        totalNet: cleanTotalNet,
        avgNet,
        avgCorrect,
        avgWrong,
        avgScore,
        weightedScore,
        minScore,
        maxScore,
        totalQuestionsEntered,
        examBreakdown
      });
    } else {
      nonParticipants.push({
        student,
        enteredCount: 0,
        applicableExamCount: applicableExamCount || targetExams.length,
        totalCorrect: 0,
        totalWrong: 0,
        totalBlank: 0,
        totalNet: 0,
        avgNet: 0,
        avgScore: null,
        weightedScore: null,
        totalQuestionsEntered: 0,
        examBreakdown
      });
    }
  });

  // Öğrenci puan üstünlüğüne (Soru Ağırlıklı Başarı Puanı azalan -> Toplam Net azalan -> Toplam Doğru azalan) göre sırala
  participants.sort((a, b) => {
    if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore;
    if (b.totalNet !== a.totalNet) return b.totalNet - a.totalNet;
    if (b.totalCorrect !== a.totalCorrect) return b.totalCorrect - a.totalCorrect;
    if (b.enteredCount !== a.enteredCount) return b.enteredCount - a.enteredCount;
    return String(a.student.name || '').localeCompare(String(b.student.name || ''), 'tr');
  });

  let currentRank = 1;
  participants.forEach((p, idx) => {
    if (idx > 0) {
      const prev = participants[idx - 1];
      if (p.weightedScore < prev.weightedScore || p.totalNet < prev.totalNet) {
        currentRank = idx + 1;
      }
    }
    p.rank = currentRank;
  });

  nonParticipants.sort((a, b) => {
    const numA = parseInt(a.student.number, 10) || 9999;
    const numB = parseInt(b.student.number, 10) || 9999;
    if (numA !== numB) return numA - numB;
    return String(a.student.name || '').localeCompare(String(b.student.name || ''), 'tr');
  });

  const totalQuestionsSum = targetExams.reduce((sum, e) => sum + (parseInt(e.totalQuestions, 10) || 0), 0);
  const classAvgScore = participants.length > 0
    ? parseFloat((participants.reduce((sum, p) => sum + p.weightedScore, 0) / participants.length).toFixed(2))
    : 0;
  const classSimpleAvgScore = participants.length > 0
    ? parseFloat((participants.reduce((sum, p) => sum + p.avgScore, 0) / participants.length).toFixed(2))
    : 0;
  const classTotalCorrect = participants.reduce((sum, p) => sum + p.totalCorrect, 0);
  const classTotalWrong = participants.reduce((sum, p) => sum + p.totalWrong, 0);
  const classTotalBlank = participants.reduce((sum, p) => sum + p.totalBlank, 0);
  const classTotalNet = parseFloat(participants.reduce((sum, p) => sum + p.totalNet, 0).toFixed(2));
  const classAvgNet = participants.length > 0
    ? parseFloat((participants.reduce((sum, p) => sum + p.avgNet, 0) / participants.length).toFixed(2))
    : 0;

  return {
    targetExams,
    participants,
    nonParticipants,
    totalStudentsCount: students.length,
    totalQuestionsSum,
    classAvgScore,
    classSimpleAvgScore,
    classTotalCorrect,
    classTotalWrong,
    classTotalBlank,
    classTotalNet,
    classAvgNet,
    leader: participants.length > 0 ? participants[0] : null
  };
}

let weeklyCurrentSubView = 'exams'; // 'exams' | 'stats'

function updateWeeklySubViews() {
  const examsListContainer = document.getElementById('weekly-exams-list-container');
  const activeExamCard = document.getElementById('active-exam-card');
  const statsCard = document.getElementById('weekly-exam-stats-card');
  const btnHeaderStats = document.getElementById('btn-open-exam-stats-panel');
  const btnBackFromStats = document.getElementById('btn-back-from-exam-stats');
  const btnAddExam = document.getElementById('btn-add-weekly-exam');
  const btnPrintReport = document.getElementById('btn-print-report');
  const weeklyHeaderTitle = document.querySelector('#weekly .header-title h2');
  const weeklyHeaderDesc = document.querySelector('#weekly .header-title p');

  const state = (stateManager && stateManager.state) ? stateManager.state : stateManager.loadState();
  const exams = getSortedWeeklyExams(state);
  const hasExams = exams.length > 0;

  if (weeklyCurrentSubView === 'stats') {
    if (examsListContainer) examsListContainer.style.display = 'none';
    if (activeExamCard) activeExamCard.style.display = 'none';
    if (statsCard) statsCard.style.display = 'block';

    if (btnHeaderStats) btnHeaderStats.style.display = 'none';
    if (btnBackFromStats) btnBackFromStats.style.display = 'inline-flex';
    if (btnAddExam) btnAddExam.style.display = 'none';
    if (btnPrintReport) btnPrintReport.style.display = 'none';

    if (weeklyHeaderTitle) weeklyHeaderTitle.textContent = 'Öğrenci Sınav Sıralaması ve İstatistikleri';
    if (weeklyHeaderDesc) weeklyHeaderDesc.textContent = 'Öğrencilerin tüm sınavlar veya seçili sınav aralıklarındaki başarı sıralaması, net ve not ortalaması analizi.';
  } else {
    if (examsListContainer) examsListContainer.style.display = 'block';
    if (activeExamCard) {
      activeExamCard.style.display = activeExam ? 'block' : 'none';
    }
    if (statsCard) statsCard.style.display = 'none';

    if (btnHeaderStats) btnHeaderStats.style.display = hasExams ? 'inline-flex' : 'none';
    if (btnBackFromStats) btnBackFromStats.style.display = 'none';
    if (btnAddExam) btnAddExam.style.display = 'inline-flex';
    if (btnPrintReport) btnPrintReport.style.display = hasExams ? 'inline-flex' : 'none';

    if (weeklyHeaderTitle) weeklyHeaderTitle.textContent = 'Haftalık Sınav Sonuçları';
    if (weeklyHeaderDesc) weeklyHeaderDesc.textContent = 'Sınavlar oluşturun, öğrencilerin doğru, boş ve yanlış sayılarını kaydedin ve başarı durumlarını izleyin.';
  }

  if (window.safeCreateIcons) window.safeCreateIcons();
  else if (window.lucide) window.lucide.createIcons();
}

function openWeeklyExamStatsView() {
  weeklyCurrentSubView = 'stats';
  updateWeeklySubViews();
  renderWeeklyExamStatsPanel();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeWeeklyExamStatsView() {
  weeklyCurrentSubView = 'exams';
  updateWeeklySubViews();
  renderExamsList();
  if (activeExam && activeExamCard) {
    activeExamCard.style.display = 'block';
    activeExamCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

window.openWeeklyExamStatsView = openWeeklyExamStatsView;
window.closeWeeklyExamStatsView = closeWeeklyExamStatsView;

function ensureWeeklyExamStatsEvents() {
  if (examStatsEventsBound) return;
  const statsCard = document.getElementById('weekly-exam-stats-card');
  if (!statsCard) return;
  examStatsEventsBound = true;

  const btnHeaderOpen = document.getElementById('btn-open-exam-stats-panel');
  const btnQuickOpen = document.getElementById('btn-quick-open-exam-stats');
  const btnActiveExamOpen = document.getElementById('btn-active-exam-open-stats');
  const btnHeaderBack = document.getElementById('btn-back-from-exam-stats');
  const btnCardBack = document.getElementById('btn-stats-card-back');

  if (btnHeaderOpen) btnHeaderOpen.addEventListener('click', openWeeklyExamStatsView);
  if (btnQuickOpen) btnQuickOpen.addEventListener('click', openWeeklyExamStatsView);
  if (btnActiveExamOpen) btnActiveExamOpen.addEventListener('click', openWeeklyExamStatsView);
  if (btnHeaderBack) btnHeaderBack.addEventListener('click', closeWeeklyExamStatsView);
  if (btnCardBack) btnCardBack.addEventListener('click', closeWeeklyExamStatsView);

  document.querySelectorAll('.exam-stats-range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const range = btn.getAttribute('data-stats-range') || 'all';
      examStatsRangeMode = range;
      if (range === 'custom' && examStatsCustomSelectedIds.size === 0) {
        const allExams = getSortedWeeklyExams();
        allExams.forEach(e => examStatsCustomSelectedIds.add(String(e.id)));
      }
      renderWeeklyExamStatsPanel();
    });
  });

  const branchSelect = document.getElementById('exam-stats-branch-select');
  if (branchSelect) {
    branchSelect.addEventListener('change', () => {
      examStatsSelectedBranch = branchSelect.value || 'all';
      renderWeeklyExamStatsPanel();
    });
  }

  const studentSearch = document.getElementById('exam-stats-student-search');
  if (studentSearch) {
    studentSearch.addEventListener('input', () => {
      renderWeeklyExamStatsPanel();
    });
  }

  const customExamSearch = document.getElementById('exam-stats-custom-exam-search');
  if (customExamSearch) {
    customExamSearch.addEventListener('input', () => {
      renderCustomExamsPickerGrid();
    });
  }

  const btnCustomAll = document.getElementById('btn-stats-custom-select-all');
  const btnCustomLast5 = document.getElementById('btn-stats-custom-select-last5');
  const btnCustomLast10 = document.getElementById('btn-stats-custom-select-last10');
  const btnCustomClear = document.getElementById('btn-stats-custom-clear-all');

  if (btnCustomAll) {
    btnCustomAll.addEventListener('click', () => {
      const allExams = getSortedWeeklyExams();
      examStatsCustomSelectedIds = new Set(allExams.map(e => String(e.id)));
      renderWeeklyExamStatsPanel();
    });
  }
  if (btnCustomLast5) {
    btnCustomLast5.addEventListener('click', () => {
      const allExams = getSortedWeeklyExams();
      examStatsCustomSelectedIds = new Set(allExams.slice(0, 5).map(e => String(e.id)));
      renderWeeklyExamStatsPanel();
    });
  }
  if (btnCustomLast10) {
    btnCustomLast10.addEventListener('click', () => {
      const allExams = getSortedWeeklyExams();
      examStatsCustomSelectedIds = new Set(allExams.slice(0, 10).map(e => String(e.id)));
      renderWeeklyExamStatsPanel();
    });
  }
  if (btnCustomClear) {
    btnCustomClear.addEventListener('click', () => {
      examStatsCustomSelectedIds.clear();
      renderWeeklyExamStatsPanel();
    });
  }

  const btnPrintCurrent = document.getElementById('btn-print-current-stats-report');
  if (btnPrintCurrent) {
    btnPrintCurrent.addEventListener('click', () => {
      printCurrentExamStatsReport();
    });
  }
}

function renderCustomExamsPickerGrid() {
  const grid = document.getElementById('exam-stats-custom-exams-grid');
  const countBadge = document.getElementById('exam-stats-custom-count-badge');
  if (!grid) return;

  const state = (stateManager && stateManager.state) ? stateManager.state : stateManager.loadState();
  const isMiddle = state.educationLevel === 'middle';
  let allExams = getSortedWeeklyExams(state);
  if (isMiddle && examStatsSelectedBranch && examStatsSelectedBranch !== 'all') {
    allExams = allExams.filter(e => !e.branch || e.branch === 'all' || e.branch === examStatsSelectedBranch);
  }

  const validIds = new Set(allExams.map(e => String(e.id)));
  const selectedValidCount = Array.from(examStatsCustomSelectedIds).filter(id => validIds.has(id)).length;
  if (countBadge) {
    countBadge.textContent = `${selectedValidCount} / ${allExams.length} Sınav Seçildi`;
  }

  const searchInput = document.getElementById('exam-stats-custom-exam-search');
  const query = searchInput ? searchInput.value.trim().toLocaleLowerCase('tr') : '';

  const indexed = allExams.map((ex, i) => ({ ex, orderNo: i + 1 })).filter(({ ex }) => {
    if (!query) return true;
    const name = String(ex.examName || '').toLocaleLowerCase('tr');
    const branch = String(ex.branch || '').toLocaleLowerCase('tr');
    const weekStr = (window.formatWeekTR ? window.formatWeekTR(ex.weekId, 'full') : (ex.weekId || '')).toLocaleLowerCase('tr');
    return name.includes(query) || branch.includes(query) || weekStr.includes(query);
  });

  grid.innerHTML = '';
  if (indexed.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.8rem;">Eşleşen sınav bulunamadı.</div>`;
    return;
  }

  indexed.forEach(({ ex, orderNo }) => {
    const isChecked = examStatsCustomSelectedIds.has(String(ex.id));
    const weekShort = window.formatWeekTR ? window.formatWeekTR(ex.weekId, 'short') : (ex.weekId || '');
    const item = document.createElement('label');
    item.style.cssText = `display: flex; align-items: center; gap: 0.55rem; padding: 0.5rem 0.65rem; border-radius: 8px; border: 1.5px solid ${isChecked ? 'var(--primary)' : 'var(--border-color)'}; background: ${isChecked ? 'rgba(79, 70, 229, 0.08)' : 'var(--bg-secondary)'}; cursor: pointer; transition: all 0.15s ease; user-select: none;`;
    item.innerHTML = `
      <input type="checkbox" ${isChecked ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary); flex-shrink: 0;">
      <div style="min-width: 0; flex: 1;">
        <div style="display: flex; align-items: center; gap: 0.35rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          <span style="font-size: 0.72rem; font-weight: 800; color: var(--primary);">#${orderNo}</span>
          <strong style="font-size: 0.8rem; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis;">${ex.examName || 'Sınav'}</strong>
        </div>
        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 1px;">
          ${weekShort} • ${ex.totalQuestions || 0} Soru${ex.branch ? ` • ${ex.branch}` : ''}
        </div>
      </div>
    `;
    const chk = item.querySelector('input');
    if (chk) {
      chk.addEventListener('change', () => {
        if (chk.checked) examStatsCustomSelectedIds.add(String(ex.id));
        else examStatsCustomSelectedIds.delete(String(ex.id));
        renderWeeklyExamStatsPanel();
      });
    }
    grid.appendChild(item);
  });
}

function renderWeeklyExamStatsPanel() {
  ensureWeeklyExamStatsEvents();
  const statsCard = document.getElementById('weekly-exam-stats-card');
  if (!statsCard) return;

  const state = (stateManager && stateManager.state) ? stateManager.state : stateManager.loadState();
  const allExams = getSortedWeeklyExams(state);

  if (allExams.length === 0 || weeklyCurrentSubView !== 'stats') {
    statsCard.style.display = 'none';
    if (allExams.length === 0 && weeklyCurrentSubView === 'stats') {
      closeWeeklyExamStatsView();
    }
    return;
  }
  statsCard.style.display = 'block';

  // Şube filtresi seçeneklerini güncelle
  const isMiddle = state.educationLevel === 'middle';
  const branchGroup = document.getElementById('exam-stats-branch-group');
  const branchSelect = document.getElementById('exam-stats-branch-select');
  const branches = [...new Set([
    ...(state.students || []).map(s => s.branch).filter(Boolean),
    ...allExams.map(e => e.branch).filter(b => b && b !== 'all')
  ])].sort();

  if (branchGroup && branchSelect) {
    if (isMiddle && branches.length > 0) {
      branchGroup.style.display = 'inline-flex';
      const prevVal = examStatsSelectedBranch || 'all';
      branchSelect.innerHTML = `<option value="all">Tüm Şubeler</option>` +
        branches.map(b => `<option value="${b}" ${b === prevVal ? 'selected' : ''}>${b} Şubesi</option>`).join('');
      if (!branches.includes(prevVal) && prevVal !== 'all') {
        examStatsSelectedBranch = 'all';
        branchSelect.value = 'all';
      }
    } else {
      branchGroup.style.display = 'none';
      examStatsSelectedBranch = 'all';
    }
  }

  // Sınav aralığı butonlarının metin ve aktiflik durumlarını güncelle
  const btnAll = document.getElementById('btn-stats-range-all');
  const btnLast5 = document.getElementById('btn-stats-range-last5');
  const btnLast10 = document.getElementById('btn-stats-range-last10');
  const btnLast3 = document.getElementById('btn-stats-range-last3');
  if (btnAll) btnAll.textContent = `Tüm Sınavlar (${allExams.length})`;
  if (btnLast5) btnLast5.textContent = `Son 5 Sınav (${Math.min(5, allExams.length)})`;
  if (btnLast10) btnLast10.textContent = `Son 10 Sınav (${Math.min(10, allExams.length)})`;
  if (btnLast3) btnLast3.textContent = `Son 3 Sınav (${Math.min(3, allExams.length)})`;

  document.querySelectorAll('.exam-stats-range-btn').forEach(btn => {
    const r = btn.getAttribute('data-stats-range');
    const isActive = r === examStatsRangeMode;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('btn-primary', isActive);
    btn.classList.toggle('btn-secondary', !isActive);
  });

  const customPanel = document.getElementById('exam-stats-custom-picker-panel');
  if (customPanel) {
    customPanel.style.display = examStatsRangeMode === 'custom' ? 'block' : 'none';
    if (examStatsRangeMode === 'custom') {
      renderCustomExamsPickerGrid();
    }
  }

  const targetExams = getTargetExamsForStatsRange(allExams, examStatsRangeMode, examStatsSelectedBranch, isMiddle);
  const stats = computeMultiExamStudentRankingStats(targetExams, examStatsSelectedBranch);

  // Kapsamdaki sınavlar bilgi barı
  const includedBar = document.getElementById('exam-stats-included-bar');
  if (includedBar) {
    if (targetExams.length === 0) {
      includedBar.innerHTML = `<span style="color: var(--danger); font-weight: 600;">⚠️ Seçili aralıkta sınav bulunmuyor. Lütfen yukarıdan en az bir sınav seçin.</span>`;
    } else {
      const rangeTitleMap = {
        all: 'Tüm Sınavlar',
        last_5: `Son ${targetExams.length} Sınav`,
        last_10: `Son ${targetExams.length} Sınav`,
        last_3: `Son ${targetExams.length} Sınav`,
        custom: `Özel Seçilen (${targetExams.length} Sınav)`
      };
      const chipsHtml = targetExams.slice(0, 8).map((ex, i) => {
        const wShort = window.formatWeekTR ? window.formatWeekTR(ex.weekId, 'short') : '';
        return `<span class="badge" style="background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 0.73rem; font-weight: 600; padding: 0.18rem 0.5rem;">${i + 1}. ${ex.examName || 'Sınav'} (${ex.totalQuestions || 0}S${wShort ? ' • ' + wShort : ''})</span>`;
      }).join('');
      const moreChip = targetExams.length > 8
        ? `<span class="badge" style="background: var(--primary); color: #fff; font-size: 0.72rem; font-weight: 700; padding: 0.18rem 0.5rem;">+${targetExams.length - 8} Sınav Daha</span>`
        : '';
      includedBar.innerHTML = `
        <strong style="color: var(--primary); white-space: nowrap;">📋 Rapor Kapsamı (${rangeTitleMap[examStatsRangeMode] || 'Seçili Sınavlar'}):</strong>
        <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">${chipsHtml}${moreChip}</div>
      `;
    }
  }

  // 4 Özet KPI Kartı
  const kpiGrid = document.getElementById('exam-stats-kpi-grid');
  if (kpiGrid) {
    const leaderText = stats.leader
      ? `${stats.leader.student.name || ''} ${stats.leader.student.surname || ''}`.trim()
      : '-';
    const leaderScoreText = stats.leader
      ? `${stats.leader.weightedScore} Puan (%${stats.leader.weightedScore} • ${stats.leader.totalNet} Net)`
      : 'Henüz veri yok';

    kpiGrid.innerHTML = `
      <div style="padding: 0.9rem 1rem; border-radius: var(--radius-md); background: var(--bg-secondary); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.85rem;">
        <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(79, 70, 229, 0.12); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">📚</div>
        <div>
          <div style="font-size: 0.73rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">İncelenen Sınav Aralığı</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${targetExams.length} Sınav</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Toplam ${stats.totalQuestionsSum} Soru</div>
        </div>
      </div>
      <div style="padding: 0.9rem 1rem; border-radius: var(--radius-md); background: var(--bg-secondary); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.85rem;">
        <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(16, 185, 129, 0.12); color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">📈</div>
        <div>
          <div style="font-size: 0.73rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Sınıf Ağırlıklı Ortalaması</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #059669;">${stats.classAvgScore} Puan</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Katılan: ${stats.participants.length} / ${stats.totalStudentsCount} Öğrenci • <span title="Sınav başı aritmetik ortalama">Basit Ort: ${stats.classSimpleAvgScore}</span></div>
        </div>
      </div>
      <div style="padding: 0.9rem 1rem; border-radius: var(--radius-md); background: var(--bg-secondary); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.85rem;">
        <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(99, 102, 241, 0.12); color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">🎯</div>
        <div>
          <div style="font-size: 0.73rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Sınıf Doğru / Yanlış / Net</div>
          <div style="font-size: 1.05rem; font-weight: 800; color: var(--primary);">Ort: ${stats.classAvgNet} Net</div>
          <div style="font-size: 0.74rem; color: var(--text-secondary);">Top: <span style="color:#059669;font-weight:700;">${stats.classTotalCorrect}D</span> • <span style="color:#dc2626;font-weight:700;">${stats.classTotalWrong}Y</span> • <strong>${stats.classTotalNet}N</strong></div>
        </div>
      </div>
      <div style="padding: 0.9rem 1rem; border-radius: var(--radius-md); background: var(--bg-secondary); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.85rem;">
        <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(245, 158, 11, 0.15); color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">🥇</div>
        <div style="min-width: 0;">
          <div style="font-size: 0.73rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Puan Üstünlüğü Lideri</div>
          <div style="font-size: 1.02rem; font-weight: 800; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${leaderText}</div>
          <div style="font-size: 0.74rem; color: #d97706; font-weight: 700;">${leaderScoreText}</div>
        </div>
      </div>
    `;
  }

  // Tablo Gövdesi Render
  const tbody = document.getElementById('exam-stats-ranking-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (targetExams.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          Rapor oluşturmak için lütfen yukarıdan en az bir sınav seçin.
        </td>
      </tr>
    `;
    return;
  }

  const searchInput = document.getElementById('exam-stats-student-search');
  const searchQuery = searchInput ? searchInput.value.trim().toLocaleLowerCase('tr') : '';

  const matchesSearch = (student) => {
    if (!searchQuery) return true;
    const fullName = `${student.name || ''} ${student.surname || ''}`.toLocaleLowerCase('tr');
    const numStr = String(student.number || '').toLocaleLowerCase('tr');
    return fullName.includes(searchQuery) || numStr.includes(searchQuery);
  };

  const filteredParticipants = stats.participants.filter(p => matchesSearch(p.student));
  const filteredNonParticipants = stats.nonParticipants.filter(np => matchesSearch(np.student));

  if (filteredParticipants.length === 0 && filteredNonParticipants.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          Aranan kriterlere uygun öğrenci bulunamadı.
        </td>
      </tr>
    `;
    return;
  }

  filteredParticipants.forEach(p => {
    const st = p.student;
    const sName = String(st.name || '');
    const sSurname = String(st.surname || '');
    const initials = `${sName[0] || ''}${sSurname[0] || ''}`;
    const avatarHtml = st.photo
      ? `<img src="${st.photo}" class="avatar-sm" style="width: 30px; height: 30px; object-fit: cover; border-radius: 50%; margin: 0; flex-shrink: 0;">`
      : `<div class="avatar-sm" style="width: 30px; height: 30px; font-size: 0.76rem; margin: 0; background-color: var(--primary-light); color: var(--primary); text-transform: uppercase; display: flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0;">${initials}</div>`;

    const rankHtml = getExamRankBadgeHtml(p.rank);
    const isExpanded = examStatsExpandedStudentIds.has(String(st.id));

    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td style="text-align: center; vertical-align: middle; padding: 0.6rem 0.4rem;">${rankHtml}</td>
      <td style="text-align: center; vertical-align: middle; font-weight: 700; color: var(--text-secondary); padding: 0.6rem 0.4rem;">${st.number || '-'}</td>
      <td style="vertical-align: middle; padding: 0.6rem 0.6rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${avatarHtml}
          <div>
            <strong style="color: var(--text-primary); font-size: 0.88rem;">${sName} ${sSurname}</strong>
            ${st.branch ? `<span class="badge" style="font-size: 0.68rem; padding: 0.08rem 0.35rem; margin-left: 0.3rem; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-secondary);">${st.branch}</span>` : ''}
          </div>
        </div>
      </td>
      <td style="text-align: center; vertical-align: middle; padding: 0.6rem 0.4rem;">
        <span class="badge" style="background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 0.76rem; font-weight: 700; padding: 0.2rem 0.55rem;">
          ${p.enteredCount} / ${p.applicableExamCount} Sınav
        </span>
      </td>
      <td style="text-align: center; vertical-align: middle; padding: 0.6rem 0.4rem;">
        <div style="font-weight: 800; color: #059669; font-size: 0.94rem;">${p.totalCorrect}</div>
        <div style="font-size: 0.68rem; color: var(--text-muted);">Ort: ${p.avgCorrect}</div>
      </td>
      <td style="text-align: center; vertical-align: middle; padding: 0.6rem 0.4rem;">
        <div style="font-weight: 800; color: #dc2626; font-size: 0.94rem;">${p.totalWrong}</div>
        <div style="font-size: 0.68rem; color: var(--text-muted);">Ort: ${p.avgWrong}</div>
      </td>
      <td style="text-align: center; vertical-align: middle; padding: 0.6rem 0.4rem;">
        <div style="font-weight: 700; color: #64748b; font-size: 0.9rem;">${p.totalBlank}</div>
      </td>
      <td style="text-align: center; vertical-align: middle; padding: 0.6rem 0.4rem;">
        <div style="font-weight: 800; color: var(--primary); font-size: 0.96rem;">${p.totalNet} Net</div>
        <div style="font-size: 0.69rem; color: var(--text-muted); font-weight: 600;">Ort: ${p.avgNet} N</div>
      </td>
      <td style="text-align: center; vertical-align: middle; padding: 0.6rem 0.4rem;">
        <span class="badge" style="background: rgba(79, 70, 229, 0.14); color: var(--primary); border: 1px solid rgba(79, 70, 229, 0.3); font-size: 0.92rem; font-weight: 800; padding: 0.28rem 0.65rem; border-radius: 8px;" title="Soru Ağırlıklı Başarı Puanı: (Toplam Net / Toplam Soru) x 100&#10;Sınav Başı Basit Ortalama: ${p.avgScore} Puan">
          ${p.weightedScore} Puan
        </span>
        <div style="font-size: 0.67rem; color: var(--text-muted); margin-top: 2px;">Soru Ağırlıklı (Ort: ${p.avgScore})</div>
      </td>
      <td style="text-align: center; vertical-align: middle; padding: 0.6rem 0.4rem;">
        <button type="button" class="btn btn-sm btn-secondary btn-toggle-stu-exam-breakdown" style="font-size: 0.74rem; padding: 0.25rem 0.55rem; height: auto;">
          ${isExpanded ? 'Gizle ▲' : 'Detay ▼'}
        </button>
      </td>
    `;

    const toggleExpand = () => {
      const key = String(st.id);
      if (examStatsExpandedStudentIds.has(key)) {
        examStatsExpandedStudentIds.delete(key);
      } else {
        examStatsExpandedStudentIds.add(key);
      }
      renderWeeklyExamStatsPanel();
    };

    tr.addEventListener('click', toggleExpand);
    tbody.appendChild(tr);

    if (isExpanded) {
      const detailTr = document.createElement('tr');
      detailTr.style.background = 'var(--bg-secondary)';
      const breakdownCards = p.examBreakdown.map((eb, idx) => {
        const wShort = window.formatWeekTR ? window.formatWeekTR(eb.weekId, 'short') : (eb.weekId || '');
        if (!eb.participated) {
          return `
            <div style="padding: 0.5rem 0.65rem; border-radius: 6px; border: 1px dashed var(--border-color); background: var(--bg-primary); opacity: 0.65; font-size: 0.75rem;">
              <div style="font-weight: 700; color: var(--text-secondary);">${idx + 1}. ${eb.examName}</div>
              <div style="color: #f59e0b; font-style: italic; margin-top: 2px;">Sınava Katılmadı</div>
            </div>
          `;
        }
        return `
          <div style="padding: 0.5rem 0.65rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); font-size: 0.76rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; margin-bottom: 3px;">
              <strong style="color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${idx + 1}. ${eb.examName}</strong>
              <span class="badge" style="background: rgba(79, 70, 229, 0.12); color: var(--primary); font-weight: 800; font-size: 0.72rem; padding: 1px 6px;">${eb.score} Puan</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.45rem; font-size: 0.72rem;">
              ${wShort ? `<span style="color: var(--text-muted);">${wShort} •</span>` : ''}
              <span style="color: #059669; font-weight: 700;">${eb.correct}D</span>
              <span style="color: #dc2626; font-weight: 700;">${eb.wrong}Y</span>
              <span style="color: #64748b; font-weight: 600;">${eb.blank}B</span>
              <strong style="color: var(--primary); margin-left: auto;">${eb.net} Net</strong>
            </div>
          </div>
        `;
      }).join('');

      detailTr.innerHTML = `
        <td colspan="10" style="padding: 0.75rem 1rem; border-bottom: 2px solid var(--border-color);">
          <div style="font-size: 0.76rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">
            📌 ${sName} ${sSurname} — Seçilen Aralıktaki Sınav Karnesi (${p.enteredCount} / ${p.applicableExamCount} Sınav • Toplam: ${p.totalCorrect} Doğru, ${p.totalWrong} Yanlış, ${p.totalBlank} Boş, ${p.totalNet} Net • Ağırlıklı Başarı: ${p.weightedScore} Puan • Sınav Başı Ort: ${p.avgScore} Puan)
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.5rem;">
            ${breakdownCards}
          </div>
        </td>
      `;
      tbody.appendChild(detailTr);
    }
  });

  // Seçilen sınav aralığında hiçbir sınava katılmamış öğrenciler
  filteredNonParticipants.forEach(np => {
    const st = np.student;
    const tr = document.createElement('tr');
    tr.style.opacity = '0.68';
    tr.innerHTML = `
      <td style="text-align: center; vertical-align: middle; color: var(--text-muted); font-style: italic; padding: 0.55rem 0.4rem;">-</td>
      <td style="text-align: center; vertical-align: middle; color: var(--text-muted); padding: 0.55rem 0.4rem;">${st.number || '-'}</td>
      <td style="vertical-align: middle; padding: 0.55rem 0.6rem; color: var(--text-muted);">
        <strong>${st.name || ''} ${st.surname || ''}</strong>
        <span style="font-size: 0.73rem; font-style: italic; color: #f59e0b; margin-left: 0.35rem;">(Sınava Katılmadı)</span>
      </td>
      <td style="text-align: center; vertical-align: middle; color: var(--text-muted); padding: 0.55rem 0.4rem;">0 / ${np.applicableExamCount}</td>
      <td style="text-align: center; vertical-align: middle; color: var(--text-muted); padding: 0.55rem 0.4rem;">-</td>
      <td style="text-align: center; vertical-align: middle; color: var(--text-muted); padding: 0.55rem 0.4rem;">-</td>
      <td style="text-align: center; vertical-align: middle; color: var(--text-muted); padding: 0.55rem 0.4rem;">-</td>
      <td style="text-align: center; vertical-align: middle; color: var(--text-muted); padding: 0.55rem 0.4rem;">-</td>
      <td style="text-align: center; vertical-align: middle; color: var(--text-muted); padding: 0.55rem 0.4rem;">-</td>
      <td style="text-align: center; vertical-align: middle; color: var(--text-muted); padding: 0.55rem 0.4rem;">-</td>
    `;
    tbody.appendChild(tr);
  });

  if (window.safeCreateIcons) window.safeCreateIcons();
  else if (window.lucide) window.lucide.createIcons();
}

function printCurrentExamStatsReport() {
  const state = (stateManager && stateManager.state) ? stateManager.state : stateManager.loadState();
  const isMiddle = state.educationLevel === 'middle';
  const allExams = getSortedWeeklyExams(state);
  const targetExams = getTargetExamsForStatsRange(allExams, examStatsRangeMode, examStatsSelectedBranch, isMiddle);

  if (targetExams.length === 0) {
    if (toastCallback) toastCallback('Yazdırılacak sınav aralığında sınav bulunamadı!', 'warning');
    else if (window.showToast) window.showToast('Yazdırılacak sınav aralığında sınav bulunamadı!', 'warning');
    return;
  }

  let reportTitle = 'TÜM SINAVLAR ÖĞRENCİ SIRALAMA VE İSTATİSTİK RAPORU';
  let selectedValueKey = 'all_avg';
  if (examStatsRangeMode === 'last_5') {
    reportTitle = `SON ${targetExams.length} SINAV ÖĞRENCİ SIRALAMA VE İSTATİSTİK RAPORU`;
    selectedValueKey = 'last_5';
  } else if (examStatsRangeMode === 'last_10') {
    reportTitle = `SON ${targetExams.length} SINAV ÖĞRENCİ SIRALAMA VE İSTATİSTİK RAPORU`;
    selectedValueKey = 'last_10';
  } else if (examStatsRangeMode === 'last_3') {
    reportTitle = `SON ${targetExams.length} SINAV ÖĞRENCİ SIRALAMA VE İSTATİSTİK RAPORU`;
    selectedValueKey = 'last_3';
  } else if (examStatsRangeMode === 'custom') {
    reportTitle = `SEÇİLİ SINAVLAR (${targetExams.length} SINAV) ÖĞRENCİ SIRALAMA VE İSTATİSTİK RAPORU`;
    selectedValueKey = 'custom_select';
  }

  const reportSubtitle = `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
  const examDetailText = `Toplam ${targetExams.length} Sınav`;
  const notes = `Bu rapor, seçilen ${targetExams.length} sınav (${targetExams.map(e => e.examName || 'Sınav').join(', ')}) kapsamında öğrencilerin toplam doğru, toplam yanlış, toplam boş, toplam net sayılarını ve soru ağırlıklı başarı puanlarını ((Toplam Net / Toplam Soru) x 100) puan üstünlüğüne göre sıralı olarak gösterir.`;

  prepareAdvancedPrintLayout(reportTitle, reportSubtitle, examDetailText, notes, targetExams, true, selectedValueKey, examStatsSelectedBranch);

  document.body.classList.add('print-weekly');
  window.print();

  window.addEventListener('afterprint', () => {
    document.body.classList.remove('print-weekly');
  }, { once: true });

  setTimeout(() => {
    document.body.classList.remove('print-weekly');
  }, 500);
}

function renderExamsList() {
  ensureOlderExamsModalEvents();
  ensureWeeklyExamStatsEvents();
  let state = (stateManager && stateManager.state) ? stateManager.state : stateManager.loadState();
  const examsList = document.getElementById('weekly-exams-list');
  const emptyState = document.getElementById('weekly-exams-empty-state');
  const olderBar = document.getElementById('weekly-older-exams-bar');
  const headerOlderBtn = document.getElementById('btn-open-older-exams-modal');
  const headerOlderBtnText = document.getElementById('btn-open-older-exams-modal-text');
  const countBadge = document.getElementById('weekly-exams-count-badge');
  const btnHeaderStats = document.getElementById('btn-open-exam-stats-panel');
  const btnQuickStats = document.getElementById('btn-quick-open-exam-stats');
  const statsCard = document.getElementById('weekly-exam-stats-card');
  
  if (!examsList) return;
  examsList.innerHTML = '';

  // Sınavları al ve oluşturulma tarihine göre azalan sırada sırala (yeni format)
  let exams = getSortedWeeklyExams(state);

  if (countBadge) {
    if (exams.length > 0) {
      countBadge.style.display = 'inline-block';
      countBadge.textContent = `${exams.length} Sınav`;
    } else {
      countBadge.style.display = 'none';
    }
  }

  if (exams.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (olderBar) olderBar.style.display = 'none';
    if (headerOlderBtn) headerOlderBtn.style.display = 'none';
    if (btnHeaderStats) btnHeaderStats.style.display = 'none';
    if (btnQuickStats) btnQuickStats.style.display = 'none';
    if (btnPrintReport) btnPrintReport.style.display = 'none';
    if (statsCard) statsCard.style.display = 'none';
    weeklyCurrentSubView = 'exams';
    if (typeof updateWeeklySubViews === 'function') updateWeeklySubViews();
    return;
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (btnHeaderStats) btnHeaderStats.style.display = (weeklyCurrentSubView === 'exams') ? 'inline-flex' : 'none';
    if (btnQuickStats) btnQuickStats.style.display = (weeklyCurrentSubView === 'exams') ? 'inline-flex' : 'none';
    if (btnPrintReport) btnPrintReport.style.display = (weeklyCurrentSubView === 'exams') ? 'inline-flex' : 'none';
  }

  // Masaüstünde sadece son 3 sınav kart olarak gösterilir
  const visibleExams = exams.slice(0, 3);
  const olderExams = exams.slice(3);

  visibleExams.forEach(rawExam => {
    const stats = computeExamSummaryStats(rawExam, state);
    const { exam, avgScore, topStudentsHTML, formattedWeek, penaltyText, opticalBadge, multiBadge } = stats;

    const card = document.createElement('div');
    card.className = `exam-card ${activeExam && String(activeExam.id) === String(exam.id) ? 'active-card' : ''}`;
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

  // 4, 5, 6... sınavlar varsa üst buton ve alt liste barını göster
  if (olderExams.length > 0) {
    if (headerOlderBtn) {
      headerOlderBtn.style.display = 'inline-flex';
      if (headerOlderBtnText) {
        headerOlderBtnText.textContent = `Diğer Sınavlar (+${olderExams.length} Liste)`;
      }
    }
    if (olderBar) {
      const activeOlderIdx = activeExam
        ? exams.findIndex(e => String(e.id) === String(activeExam.id))
        : -1;
      const isOlderActive = activeOlderIdx >= 3;
      const previewNames = olderExams
        .slice(0, 3)
        .map((e, i) => `#${i + 4} ${e.examName || 'Sınav'}`)
        .join(', ') + (olderExams.length > 3 ? ` ve +${olderExams.length - 3} sınav daha` : '');

      olderBar.style.display = 'block';
      olderBar.innerHTML = `
        <div class="older-exams-bar-trigger ${isOlderActive ? 'has-active-older-exam' : ''}" id="weekly-older-exams-bar-inner" title="4, 5, 6... diğer sınavları liste halinde görmek için tıklayın">
          <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; background: rgba(99, 102, 241, 0.15); color: var(--primary);">
              <i data-lucide="list" style="width: 16px; height: 16px;"></i>
            </span>
            <div>
              <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
                <strong style="font-size: 0.86rem; color: var(--text-primary);">Diğer Sınavlar (${olderExams.map((_, idx) => idx + 4).slice(0, 3).join(', ')}${olderExams.length > 3 ? '...' : ''}. Sınavlar)</strong>
                <span class="badge" style="background: var(--primary); color: #fff; font-size: 0.72rem; font-weight: 700; padding: 0.12rem 0.5rem; border-radius: 999px;">+${olderExams.length} Sınav</span>
                ${isOlderActive ? `<span class="badge" style="background: rgba(16, 185, 129, 0.18); color: #059669; border: 1px solid rgba(16, 185, 129, 0.4); font-size: 0.73rem; font-weight: 700; padding: 0.12rem 0.55rem;">📌 Açık Sınav (#${activeOlderIdx + 1}): ${activeExam.examName || 'Sınav'}</span>` : ''}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${previewNames}</div>
            </div>
          </div>
          <div style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 700; color: var(--primary); white-space: nowrap;">
            <span>Liste Halinde Gör</span>
            <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
          </div>
        </div>
      `;

      const triggerEl = document.getElementById('weekly-older-exams-bar-inner');
      if (triggerEl) {
        triggerEl.addEventListener('click', () => {
          openOlderExamsModal('older');
        });
      }
    }
  } else {
    if (headerOlderBtn) headerOlderBtn.style.display = 'none';
    if (olderBar) {
      olderBar.style.display = 'none';
      olderBar.innerHTML = '';
    }
  }

  if (weeklyCurrentSubView === 'stats') {
    renderWeeklyExamStatsPanel();
  } else {
    if (statsCard) statsCard.style.display = 'none';
    if (typeof updateWeeklySubViews === 'function') updateWeeklySubViews();
  }

  if (window.safeCreateIcons) window.safeCreateIcons();
  else if (window.lucide) window.lucide.createIcons();
}

function openActiveExam(exam) {
  try {
    if (!exam) return;
    activeExam = exam;
    window.activeWeeklyExam = exam;
    weeklyCurrentSubView = 'exams';
    if (typeof updateWeeklySubViews === 'function') updateWeeklySubViews();

    if (activeExamCard) activeExamCard.style.display = 'block';
    if (btnPrintReport) btnPrintReport.style.display = 'inline-flex';

    if (activeExamTitle) activeExamTitle.textContent = exam.examName || 'Sınav';

    const formattedWeek = window.formatWeekTR ? window.formatWeekTR(exam.weekId, 'full') : (exam.weekId || '');
    const keyCount = countExamDefinedAnswers(exam);
    const hasOpt = !!(exam.hasOpticalForm || keyCount > 0);
    const opticalBadge = hasOpt ? `<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary); font-weight: 700; cursor: pointer;" title="Cevap anahtarını düzenlemek için tıklayın" onclick="window.openDesktopAnswerKeyModal ? window.openDesktopAnswerKeyModal() : null">📝 ${exam.choicesCount || 4} Şıklı Optik Form (${keyCount}/${exam.totalQuestions || 0} Cevap 🔑)</span>` : '';
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

    // Son 3 sınav kartını ve 4+ sınav barındaki seçili durumunu güncelle
    renderExamsList();
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

    return `<div style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center;">${items.join('')}</div>`;
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

function getExamRankBadgeHtml(rank) {
  if (!rank || rank === '-') {
    return `<span style="color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">-</span>`;
  }
  if (rank === 1) {
    return `<span class="badge" style="background: linear-gradient(135deg, #fef08a, #fde047); color: #854d0e; font-weight: 800; font-size: 0.82rem; padding: 2px 7px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block;">🥇 1</span>`;
  }
  if (rank === 2) {
    return `<span class="badge" style="background: linear-gradient(135deg, #e2e8f0, #cbd5e1); color: #334155; font-weight: 800; font-size: 0.82rem; padding: 2px 7px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block;">🥈 2</span>`;
  }
  if (rank === 3) {
    return `<span class="badge" style="background: linear-gradient(135deg, #ffedd5, #fed7aa); color: #9a3412; font-weight: 800; font-size: 0.82rem; padding: 2px 7px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block;">🥉 3</span>`;
  }
  return `<span style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem;">${rank}</span>`;
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
          <td colspan="11" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            ${isMiddle && examBranch ? `Bu sınavın uygulanacağı "${examBranch}" şubesinde kayıtlı öğrenci yok.` : 'Sınıfta kayıtlı öğrenci yok.'}
          </td>
        </tr>
      `;
      return;
    }

    // Öğrencilerin sınav puanlarını ve netlerini belirle
    const getStudentScore = (studentId, studentNo) => {
      const stuNoStr = (studentNo !== undefined && studentNo !== null) ? String(studentNo) : '';
      if (activeExam.examScores) {
        if (activeExam.examScores[studentId] !== undefined && activeExam.examScores[studentId] !== null && activeExam.examScores[studentId] !== '') {
          const val = parseFloat(activeExam.examScores[studentId]);
          if (!isNaN(val)) return val;
        }
        if (stuNoStr && activeExam.examScores[stuNoStr] !== undefined && activeExam.examScores[stuNoStr] !== null && activeExam.examScores[stuNoStr] !== '') {
          const val = parseFloat(activeExam.examScores[stuNoStr]);
          if (!isNaN(val)) return val;
        }
      }
      if (activeExam.studentResults) {
        const res = activeExam.studentResults[studentId] || (stuNoStr ? activeExam.studentResults[stuNoStr] : null);
        if (res && res.score !== undefined && res.score !== null && res.score !== '') {
          const val = parseFloat(res.score);
          if (!isNaN(val)) return val;
        }
      }
      return null;
    };

    const getStudentNet = (studentId, studentNo) => {
      const stuNoStr = (studentNo !== undefined && studentNo !== null) ? String(studentNo) : '';
      if (activeExam.studentResults) {
        const res = activeExam.studentResults[studentId] || (stuNoStr ? activeExam.studentResults[stuNoStr] : null);
        if (res && res.net !== undefined && res.net !== null && res.net !== '') {
          const val = parseFloat(res.net);
          if (!isNaN(val)) return val;
        }
      }
      return 0;
    };

    // Puanı olan öğrencileri başarı sıralamasına (puan azalan, sonra net azalan) göre sıralayıp derece oluştur
    const scoredList = activeStudents
      .map(s => ({ student: s, score: getStudentScore(s.id, s.number), net: getStudentNet(s.id, s.number) }))
      .filter(item => item.score !== null);

    scoredList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.net !== a.net) return b.net - a.net;
      return String(a.student.name || '').localeCompare(String(b.student.name || ''), 'tr');
    });

    const rankMap = {};
    let currentRank = 1;
    for (let i = 0; i < scoredList.length; i++) {
      if (i > 0) {
        if (scoredList[i].score < scoredList[i - 1].score) {
          currentRank = i + 1;
        }
      }
      rankMap[scoredList[i].student.id] = currentRank;
    }

    // Tablo satır sıralaması:
    // Puanı olanlar dereceye göre (1., 2., 3...), henüz girilmemiş olanlar en altta (okul no / isim sırasıyla)
    const sortedStudents = [...activeStudents].sort((a, b) => {
      const rankA = rankMap[a.id];
      const rankB = rankMap[b.id];
      if (rankA !== undefined && rankB !== undefined) {
        if (rankA !== rankB) return rankA - rankB;
        const scoreA = getStudentScore(a.id, a.number) || 0;
        const scoreB = getStudentScore(b.id, b.number) || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        const netA = getStudentNet(a.id, a.number);
        const netB = getStudentNet(b.id, b.number);
        if (netB !== netA) return netB - netA;
        return (parseInt(a.number) || 0) - (parseInt(b.number) || 0);
      }
      if (rankA !== undefined) return -1;
      if (rankB !== undefined) return 1;
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      if (numA && numB && numA !== numB) return numA - numB;
      return String(a.name || '').localeCompare(String(b.name || ''), 'tr');
    });

    // Önceki sınavı döngü dışında tek seferde bul (35 öğrenci için 35 kez loadState ve sort yapmayı önler)
    const prevExamForActive = getPreviousExamForActive(state);
    const fragment = document.createDocumentFragment();

    sortedStudents.forEach(student => {
      const stuNoStr = (student.number !== undefined && student.number !== null) ? String(student.number) : '';
      const result = (activeExam.studentResults && (activeExam.studentResults[student.id] || (stuNoStr ? activeExam.studentResults[stuNoStr] : null))) || {
        correct: '',
        blank: '',
        wrong: '',
        net: '',
        score: ''
      };

      const rank = rankMap[student.id];
      const rankHtml = getExamRankBadgeHtml(rank);

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
        <td class="rank-td" style="text-align: center; vertical-align: middle;">${rankHtml}</td>
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
        <td style="text-align: center; vertical-align: middle; white-space: nowrap;">
          <button type="button" class="btn btn-sm btn-open-student-optical ${hasAnswers ? 'btn-secondary' : 'btn-outline-secondary'}" data-student-id="${student.id}" style="font-size: 0.74rem; padding: 0.26rem 0.55rem; height: auto; display: inline-flex; align-items: center; justify-content: center; gap: 4px; border-radius: 6px; cursor: pointer; white-space: nowrap; flex-shrink: 0; ${hasAnswers ? 'border-color: rgba(99, 102, 241, 0.4); color: var(--primary); font-weight: 600; background: rgba(99, 102, 241, 0.1);' : 'border: 1px dashed var(--border-color); color: var(--text-muted);'}" title="${sName} ${sSurname} - ${hasAnswers ? 'Optik form işaretlemelerini incele ve düzenle' : 'Bu öğrenci için optik form işaretlemelerini gir'}">
            <i data-lucide="${hasAnswers ? 'scan-line' : 'edit'}" style="width: 13px; height: 13px; flex-shrink: 0;"></i>
            <span>${hasAnswers ? 'Optik İncele' : 'Optik Gir'}</span>
          </button>
        </td>
        <td style="text-align: center; vertical-align: middle; white-space: nowrap;" class="change-indicator-td">
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

      // İlk yüklemedeki değişim okları (prevExamForActive parametresiyle O(1) ve ikonsuz)
      if (result.score !== undefined && result.score !== '') {
        updateChangeIndicator(student.id, parseFloat(result.score), row, prevExamForActive);
      } else {
        const ciTd = row.querySelector('.change-indicator-td');
        if (ciTd) ciTd.innerHTML = `<span class="score-change-badge score-stable">-</span>`;
      }

      fragment.appendChild(row);
    });

    activeExamTableBody.appendChild(fragment);

    if (window.safeCreateIcons) window.safeCreateIcons();
    else if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error('renderActiveExamTable hatası:', err);
    if (window.showToast) {
      window.showToast('Öğrenci tablosu oluşturulurken hata: ' + (err.message || err), 'danger');
    }
  }
}

let _refreshExamsListDebounceTimer = null;

function refreshExamRankingsDisplay() {
  if (!activeExam || !activeExamTableBody) return;
  const rows = activeExamTableBody.querySelectorAll('tr');
  if (!rows || rows.length === 0) return;

  const rowData = [];
  rows.forEach(row => {
    const correctInput = row.querySelector('.exam-correct-input');
    const scoreSpan = row.querySelector('.exam-score-span');
    const netSpan = row.querySelector('.exam-net-span');
    const rankTd = row.querySelector('.rank-td');

    if (!correctInput || !rankTd) return;
    const studentId = correctInput.getAttribute('data-student-id');
    const rawScore = scoreSpan ? scoreSpan.textContent.trim() : '';
    const score = (rawScore !== '' && rawScore !== '-' && !isNaN(parseFloat(rawScore))) ? parseFloat(rawScore) : null;
    const rawNet = netSpan ? netSpan.textContent.trim() : '';
    const net = (rawNet !== '' && rawNet !== '-' && !isNaN(parseFloat(rawNet))) ? parseFloat(rawNet) : 0;

    rowData.push({
      studentId,
      rankTd,
      score,
      net
    });
  });

  const scored = rowData.filter(d => d.score !== null);
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.net - a.net;
  });

  const rankMap = {};
  let currentRank = 1;
  for (let i = 0; i < scored.length; i++) {
    if (i > 0) {
      if (scored[i].score < scored[i - 1].score) {
        currentRank = i + 1;
      }
    }
    rankMap[scored[i].studentId] = currentRank;
  }

  rowData.forEach(d => {
    const rank = rankMap[d.studentId];
    d.rankTd.innerHTML = getExamRankBadgeHtml(rank);
  });

  // Üstteki sınav kartını (ilk 3 ve sınıf ortalaması) her tuş vuruşunda değil, kısa gecikmeyle güncelle
  if (_refreshExamsListDebounceTimer) clearTimeout(_refreshExamsListDebounceTimer);
  _refreshExamsListDebounceTimer = setTimeout(() => {
    _refreshExamsListDebounceTimer = null;
    try {
      renderExamsList();
    } catch (e) {
      // ignore
    }
  }, 150);
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

    // In-memory senkronizasyon (silinme durumu)
    if (activeExam) {
      if (activeExam.examScores && activeExam.examScores[studentId] !== undefined) {
        delete activeExam.examScores[studentId];
      }
      if (activeExam.studentResults && activeExam.studentResults[studentId]) {
        delete activeExam.studentResults[studentId];
      }
    }
    refreshExamRankingsDisplay();
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

  // In-memory senkronizasyon
  if (activeExam) {
    if (!activeExam.examScores) activeExam.examScores = {};
    if (!activeExam.studentResults) activeExam.studentResults = {};
    activeExam.examScores[studentId] = score;
    const existingRes = activeExam.studentResults[studentId] || {};
    activeExam.studentResults[studentId] = {
      ...existingRes,
      correct,
      blank,
      wrong,
      net: parseFloat(netSpan.textContent) || net,
      score
    };
  }

  // Tek dersli sınavlarda Ders Dağılımı sütununu canlı güncelle (sütun 7)
  const breakdownCell = rowEl.children[7];
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

  // Canlı sıralamayı güncelle
  refreshExamRankingsDisplay();
}

function updateChangeIndicator(studentId, currentScore, rowEl, preloadedPrevExam) {
  const td = rowEl.querySelector('.change-indicator-td');
  if (!td) return;

  if (currentScore === undefined || currentScore === null || isNaN(currentScore)) {
    td.innerHTML = `<span class="score-change-badge score-stable">-</span>`;
    return;
  }

  const prevScore = getPreviousExamScore(studentId, preloadedPrevExam);
  if (prevScore === null || isNaN(prevScore)) {
    td.innerHTML = `<span class="score-change-badge score-stable" title="İlk Sınav">-</span>`;
    return;
  }

  const diff = currentScore - prevScore;
  const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);

  if (diff > 0) {
    td.innerHTML = `<span class="score-change-badge score-up" title="Önceki Sınav: ${prevScore}"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px;"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg> ${diffStr}</span>`;
  } else if (diff < 0) {
    td.innerHTML = `<span class="score-change-badge score-down" title="Önceki Sınav: ${prevScore}"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px;"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg> ${diffStr}</span>`;
  } else {
    td.innerHTML = `<span class="score-change-badge score-stable" title="Önceki Sınav: ${prevScore}">→ 0</span>`;
  }
}

function getPreviousExamForActive(optionalState) {
  if (!activeExam) return null;
  const state = optionalState || (stateManager && stateManager.state ? stateManager.state : stateManager.loadState());
  const exams = (state.weeklyEvaluations || []).filter(e => e && e.id);
  exams.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const activeIndex = exams.findIndex(e => String(e.id) === String(activeExam.id));
  return (activeIndex !== -1 && activeIndex + 1 < exams.length) ? exams[activeIndex + 1] : null;
}

function getPreviousExamScore(studentId, preloadedPrevExam) {
  const prevExam = preloadedPrevExam !== undefined ? preloadedPrevExam : getPreviousExamForActive();
  if (!prevExam) return null;

  if (prevExam.examScores && prevExam.examScores[studentId] !== undefined) {
    const val = parseFloat(prevExam.examScores[studentId]);
    if (!isNaN(val)) return val;
  }
  if (prevExam.studentResults && prevExam.studentResults[studentId] && prevExam.studentResults[studentId].score !== undefined) {
    const val = parseFloat(prevExam.studentResults[studentId].score);
    if (!isNaN(val)) return val;
  }
  return null;
}

function prepareAdvancedPrintLayout(reportTitle, reportSubtitle, examDetailText, notes, examsToPrint, isAverageReport, selectedValue, customBranchFilter) {
  const state = stateManager.loadState();
  const printTitle = document.getElementById('print-title');
  const printTbody = document.getElementById('print-exam-scores-tbody');
  const printThead = document.getElementById('print-exam-scores-thead');
  const printIncludedBox = document.getElementById('print-included-exams-box');
  const printNotesContent = document.getElementById('print-notes-content');
  const printListHeading = document.getElementById('print-list-heading');
  const labelDate = document.getElementById('print-meta-label-date');
  const labelQuestions = document.getElementById('print-meta-label-questions');
  const labelDuration = document.getElementById('print-meta-label-duration');
  const labelAverage = document.getElementById('print-meta-label-average');
  const metaDate = document.getElementById('print-meta-date');
  const metaQuestions = document.getElementById('print-meta-questions');
  const metaDuration = document.getElementById('print-meta-duration');
  const metaAverage = document.getElementById('print-meta-average');
  
  if (!printTbody) return;
  printTbody.innerHTML = '';

  if (printNotesContent) {
    printNotesContent.textContent = notes || 'Herhangi bir not girilmemiş.';
  }

  let branchFilterToUse = customBranchFilter || 'all';
  if (state.educationLevel === 'middle' && (!customBranchFilter || customBranchFilter === 'all')) {
    const activeBranch = document.getElementById('dash-select-branch') ? document.getElementById('dash-select-branch').value : 'all';
    if (activeBranch && activeBranch !== 'all') {
      branchFilterToUse = activeBranch;
    }
  }

  if (isAverageReport) {
    // 1. Çoklu Sınav Sıralama ve İstatistik Raporu (Puan Üstünlüğüne Göre Sıralı, Toplam D/Y/B/Net ve Not Ortalaması)
    const stats = computeMultiExamStudentRankingStats(examsToPrint, branchFilterToUse);

    if (printTitle) {
      printTitle.textContent = reportTitle || 'ÖĞRENCİ SINAV SIRALAMA VE İSTATİSTİK RAPORU';
    }
    if (printListHeading) {
      printListHeading.textContent = 'Öğrenci Puan Üstünlüğü Sıralaması ve Sınav İstatistikleri';
    }

    if (labelDate) labelDate.textContent = 'Rapor Tarihi';
    if (labelQuestions) labelQuestions.textContent = 'İncelenen Sınav';
    if (labelDuration) labelDuration.textContent = 'Toplam Soru';
    if (labelAverage) labelAverage.textContent = 'Sınıf Ağırlıklı Ortalaması';

    if (metaDate) metaDate.textContent = new Date().toLocaleDateString('tr-TR');
    if (metaQuestions) metaQuestions.textContent = `${examsToPrint.length} Sınav`;
    if (metaDuration) metaDuration.textContent = `${stats.totalQuestionsSum} Soru`;
    if (metaAverage) metaAverage.textContent = `${stats.classAvgScore} Puan`;

    if (printIncludedBox) {
      printIncludedBox.style.display = 'block';
      const examNamesList = examsToPrint.map((e, idx) => {
        const wShort = window.formatWeekTR ? window.formatWeekTR(e.weekId, 'short') : (e.weekId || '');
        return `${idx + 1}) ${e.examName || 'Sınav'} (${e.totalQuestions || 0} Soru${wShort ? ' - ' + wShort : ''})`;
      }).join(' • ');
      printIncludedBox.innerHTML = `<strong>Kapsamdaki Sınavlar (${examsToPrint.length} Sınav):</strong> ${examNamesList}`;
    }

    if (printThead) {
      printThead.innerHTML = `
        <tr>
          <th style="width: 7%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">Sıra</th>
          <th style="width: 7%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">Okul No</th>
          <th style="width: 22%; border-bottom: 2px solid #ccc; text-align: left; background: #f1f5f9; padding: 0.5rem;">Adı Soyadı</th>
          <th style="width: 8%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">Şube</th>
          <th style="width: 10%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">Katılım</th>
          <th style="width: 11%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">TOPLAM DOĞRU</th>
          <th style="width: 11%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">TOPLAM YANLIŞ</th>
          <th style="width: 8%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">TOPLAM BOŞ</th>
          <th style="width: 12%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">TOPLAM NET</th>
          <th style="width: 12%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">AĞIRLIKLI NOT ORTALAMASI</th>
        </tr>
      `;
    }

    if (stats.participants.length === 0 && stats.nonParticipants.length === 0) {
      printTbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">Öğrenci bulunamadı.</td></tr>';
      return;
    }

    stats.participants.forEach(p => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="text-align: center; padding: 0.48rem 0.25rem; border-bottom: 1px solid #ddd; font-weight: 800; background: rgba(0,0,0,0.01);">${p.rank}</td>
        <td style="text-align: center; padding: 0.48rem 0.25rem; border-bottom: 1px solid #ddd; font-weight: 600;">${p.student.number || '-'}</td>
        <td style="padding: 0.48rem 0.5rem; border-bottom: 1px solid #ddd;"><strong>${p.student.name || ''} ${p.student.surname || ''}</strong></td>
        <td style="text-align: center; padding: 0.48rem 0.25rem; border-bottom: 1px solid #ddd;">${p.student.branch || '-'}</td>
        <td style="text-align: center; padding: 0.48rem 0.25rem; border-bottom: 1px solid #ddd; font-weight: 600;">${p.enteredCount} / ${p.applicableExamCount}</td>
        <td style="text-align: center; padding: 0.48rem 0.25rem; border-bottom: 1px solid #ddd; color: #059669; font-weight: 700;">${p.totalCorrect}</td>
        <td style="text-align: center; padding: 0.48rem 0.25rem; border-bottom: 1px solid #ddd; color: #dc2626; font-weight: 700;">${p.totalWrong}</td>
        <td style="text-align: center; padding: 0.48rem 0.25rem; border-bottom: 1px solid #ddd; color: #64748b; font-weight: 600;">${p.totalBlank}</td>
        <td style="text-align: center; padding: 0.48rem 0.25rem; border-bottom: 1px solid #ddd; font-weight: 800;">
          ${p.totalNet}
          <div style="font-size: 0.68rem; color: #64748b; font-weight: normal;">Ort: ${p.avgNet} N</div>
        </td>
        <td style="text-align: center; padding: 0.48rem 0.25rem; border-bottom: 1px solid #ddd; font-weight: 800; color: #1e1b4b; font-size: 0.98rem;">
          ${p.weightedScore}
          <div style="font-size: 0.65rem; color: #64748b; font-weight: normal;">Soru Ağırlıklı (Ort: ${p.avgScore})</div>
        </td>
      `;
      printTbody.appendChild(row);
    });

    stats.nonParticipants.forEach(np => {
      const std = np.student;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="text-align: center; padding: 0.45rem 0.25rem; border-bottom: 1px solid #eee; color: #64748b; font-style: italic;">-</td>
        <td style="text-align: center; padding: 0.45rem 0.25rem; border-bottom: 1px solid #eee; color: #64748b;">${std.number || '-'}</td>
        <td style="padding: 0.45rem 0.5rem; border-bottom: 1px solid #eee; color: #64748b;"><strong>${std.name || ''} ${std.surname || ''}</strong> <span style="font-size: 0.72rem; font-style: italic; color: #d97706;">(Katılmadı)</span></td>
        <td style="text-align: center; padding: 0.45rem 0.25rem; border-bottom: 1px solid #eee; color: #64748b;">${std.branch || '-'}</td>
        <td style="text-align: center; padding: 0.45rem 0.25rem; border-bottom: 1px solid #eee; color: #64748b;">0 / ${np.applicableExamCount}</td>
        <td style="text-align: center; padding: 0.45rem 0.25rem; border-bottom: 1px solid #eee; color: #64748b;">-</td>
        <td style="text-align: center; padding: 0.45rem 0.25rem; border-bottom: 1px solid #eee; color: #64748b;">-</td>
        <td style="text-align: center; padding: 0.45rem 0.25rem; border-bottom: 1px solid #eee; color: #64748b;">-</td>
        <td style="text-align: center; padding: 0.45rem 0.25rem; border-bottom: 1px solid #eee; color: #64748b;">-</td>
        <td style="text-align: center; padding: 0.45rem 0.25rem; border-bottom: 1px solid #eee; color: #64748b;">-</td>
      `;
      printTbody.appendChild(row);
    });
    return;
  }

  // 2. Tek Sınav Raporu Hesaplama
  if (printIncludedBox) {
    printIncludedBox.style.display = 'none';
    printIncludedBox.innerHTML = '';
  }
  if (printListHeading) {
    printListHeading.textContent = 'Sınav Sonuç Listesi';
  }
  if (labelDate) labelDate.textContent = 'Tarih';
  if (labelQuestions) labelQuestions.textContent = 'Soru Sayısı';
  if (labelDuration) labelDuration.textContent = 'Sınav Süresi';
  if (labelAverage) labelAverage.textContent = 'Ortalama Puan';
  if (printThead) {
    printThead.innerHTML = `
      <tr>
        <th style="width: 8%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">Sıra No</th>
        <th style="width: 25%; border-bottom: 2px solid #ccc; text-align: left; background: #f1f5f9; padding: 0.5rem;">Adı Soyadı</th>
        <th style="width: 10%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">Şubesi</th>
        <th style="width: 9%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">DOĞRU</th>
        <th style="width: 9%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">YANLIŞ</th>
        <th style="width: 9%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">BOŞ</th>
        <th style="width: 10%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">NET</th>
        <th style="width: 10%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">PUAN</th>
        <th style="width: 10%; text-align: center; border-bottom: 2px solid #ccc; background: #f1f5f9; padding: 0.5rem 0.25rem;">YÖN</th>
      </tr>
    `;
  }

  let students = [...state.students];
  const currentExam = examsToPrint[0];
  if (state.educationLevel === 'middle' && currentExam && currentExam.branch) {
    students = students.filter(s => s.branch === currentExam.branch);
  }

  if (students.length === 0) {
    printTbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">Öğrenci bulunamadı.</td></tr>';
    return;
  }

  const participants = [];
  const nonParticipants = [];

  {
    // Bir önceki sınavı tespit et (aynı şube)
    const sameBranchExams = (state.weeklyEvaluations || []).filter(e => e.branch === currentExam.branch);
    sameBranchExams.sort((a, b) => {
      const getTimestamp = (examItem) => {
        if (examItem.createdAt) return new Date(examItem.createdAt).getTime();
        return parseInt(String(examItem.id || '').replace('exam_', '')) || 0;
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
        const m = extractStudentExamMetrics(prevExam, std);
        if (m.participated) {
          prevParticipants.push({
            studentId: std.id,
            net: m.net || 0,
            score: m.score || 0
          });
        }
      });
      prevParticipants.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.net !== a.net) return b.net - a.net;
        return 0;
      });
      prevParticipants.forEach((p, idx) => {
        prevRankMap[p.studentId] = idx + 1;
      });
    }

    // Bu sınavdaki sıralamaları çıkar
    const currentParticipantsList = [];
    students.forEach(std => {
      const m = extractStudentExamMetrics(currentExam, std);
      if (m.participated) {
        currentParticipantsList.push({
          studentId: std.id,
          net: m.net || 0,
          score: m.score || 0
        });
      }
    });
    currentParticipantsList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.net !== a.net) return b.net - a.net;
      return 0;
    });
    const currentRankMap = {};
    currentParticipantsList.forEach((p, idx) => {
      currentRankMap[p.studentId] = idx + 1;
    });

    // Öğrenci listesini oluştur
    students.forEach(std => {
      const m = extractStudentExamMetrics(currentExam, std);
      const res = (currentExam.studentResults && (currentExam.studentResults[std.id] || (std.number ? currentExam.studentResults[String(std.number)] : null))) || null;
      if (m.participated) {
        let directionHtml = '<span style="color: #64748b;">-</span>';
        const curRank = currentRankMap[std.id];
        const prevRank = prevRankMap[std.id];

        if (prevRank && curRank) {
          const diff = prevRank - curRank;
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
          correct: m.correct,
          wrong: m.wrong,
          blank: m.blank,
          net: m.net,
          score: m.score,
          directionHtml: directionHtml,
          subjectBreakdown: res ? res.subjectBreakdown : null
        });
      } else {
        nonParticipants.push(std);
      }
    });

    // Puan üstünlüğüne göre sırala
    participants.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.net !== a.net) return b.net - a.net;
      return a.student.name.localeCompare(b.student.name, 'tr');
    });

    nonParticipants.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    let examDateText = '-';
    if (currentExam.createdAt) {
      try {
        examDateText = new Date(currentExam.createdAt).toLocaleDateString('tr-TR');
      } catch(e) {}
    } else {
      try {
        const ts = parseInt(String(currentExam.id || '').replace('exam_', ''));
        if (ts) examDateText = new Date(ts).toLocaleDateString('tr-TR');
      } catch(e) {}
    }

    const questionsText = `${currentExam.totalQuestions} Soru`;
    const durationText = `${currentExam.duration} Dk`;
    
    const totalScoresSum = participants.reduce((sum, p) => sum + p.score, 0);
    const avgScoreText = participants.length > 0 ? (totalScoresSum / participants.length).toFixed(2) + ' Puan' : '0 Puan';

    if (printTitle) printTitle.textContent = `${currentExam.examName} SINAV SONUÇ RAPORU`;

    if (metaDate) metaDate.textContent = examDateText;
    if (metaQuestions) metaQuestions.textContent = questionsText;
    if (metaDuration) metaDuration.textContent = durationText;
    if (metaAverage) metaAverage.textContent = avgScoreText;
  }

  // 3. Tek Sınav Tablo Satırlarını Render Et
  let ranking = 1;
  participants.forEach((p, idx) => {
    if (idx > 0 && p.score < participants[idx - 1].score) {
      ranking = idx + 1;
    }
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
  const isModalActive = modal && modal.classList.contains('active');
  const isWidgetActive = boardFloatingWidget && boardFloatingWidget.style.display !== 'none' && !boardFloatingMinimized;

  if (!isModalActive && !isWidgetActive) return;

  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
    if (e.key === 'Escape') {
      if (isModalActive) closeBoardQuestionAnalysisModal();
      else if (isWidgetActive) closeBoardFloatingWidget();
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
    if (isModalActive) closeBoardQuestionAnalysisModal();
    else if (isWidgetActive) closeBoardFloatingWidget();
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
  if (boardFloatingWidget && boardFloatingWidget.style.display !== 'none') {
    renderPipContent(boardFloatingWidget);
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
      ? `<img src="${st.photo}" style="width: 52px; height: 52px; object-fit: cover; border-radius: 50%; flex-shrink: 0; border: 2px solid var(--border-color); box-shadow: 0 2px 6px rgba(0,0,0,0.08);">`
      : `<div style="width: 52px; height: 52px; font-size: 1.15rem; font-weight: 800; background: var(--primary-light, #e0e7ff); color: var(--primary, #4338ca); border-radius: 50%; display: flex; align-items: center; justify-content: center; text-transform: uppercase; flex-shrink: 0; border: 2px solid rgba(99, 102, 241, 0.25); box-shadow: 0 2px 6px rgba(0,0,0,0.06);">${initials}</div>`;

    let cardClass = '';
    let badgeHtml = '';

    if (item.status === 'wrong') {
      cardClass = 'is-wrong';
      badgeHtml = `
        <div style="text-align: right; flex-shrink: 0;">
          <span style="background: #fee2e2; border: 2px solid #ef4444; color: #b91c1c; padding: 6px 14px; border-radius: 10px; font-size: 1.15rem; font-weight: 900; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);">
            ❌ <b style="font-size: 1.35rem; text-decoration: underline;">${item.answer}</b> Şıkkı
          </span>
          ${correctAns ? `<div style="font-size: 0.82rem; color: #15803d; font-weight: 800; margin-top: 4px;">(Doğru: ${correctAns})</div>` : ''}
        </div>
      `;
    } else if (item.status === 'blank') {
      cardClass = 'is-blank';
      badgeHtml = `
        <div style="text-align: right; flex-shrink: 0;">
          <span style="background: #f1f5f9; border: 2px solid #94a3b8; color: #334155; padding: 6px 14px; border-radius: 10px; font-size: 1.05rem; font-weight: 800; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 2px 6px rgba(148, 163, 184, 0.15);">
            ⚪ Boş Bıraktı
          </span>
          ${correctAns ? `<div style="font-size: 0.82rem; color: #15803d; font-weight: 800; margin-top: 4px;">(Doğru: ${correctAns})</div>` : ''}
        </div>
      `;
    } else if (item.status === 'correct') {
      cardClass = 'is-correct';
      badgeHtml = `
        <div style="text-align: right; flex-shrink: 0;">
          <span style="background: #dcfce7; border: 2px solid #22c55e; color: #15803d; padding: 6px 14px; border-radius: 10px; font-size: 1.15rem; font-weight: 900; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);">
            ✓ Doğru (${item.answer})
          </span>
        </div>
      `;
    } else {
      badgeHtml = `
        <div style="text-align: right; flex-shrink: 0;">
          <span style="font-size: 0.95rem; color: var(--text-muted); font-style: italic;">Cevap Yok</span>
        </div>
      `;
    }

    html += `
      <div class="board-student-card ${cardClass}">
        <div style="display: flex; align-items: center; gap: 0.85rem; min-width: 0; flex: 1;">
          ${avatarHtml}
          <div style="min-width: 0; flex: 1;">
            <div style="font-weight: 800; font-size: 1.25rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.25;">
              ${sName} ${sSurname}
            </div>
            <div style="font-size: 0.92rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px; margin-top: 4px; font-weight: 600;">
              ${st.number ? `<span style="background: var(--bg-primary, #f1f5f9); border: 1.5px solid var(--border-color); padding: 1px 7px; border-radius: 6px; font-weight: 700; color: var(--text-primary);">No: ${st.number}</span>` : ''}
              <span>Sınav Puanı: <strong style="color: var(--text-primary);">${item.score}</strong></span>
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
let boardFloatingWidget = null;
let boardFloatingMinimized = false;

function ensureFloatingWidgetStyles() {
  if (document.getElementById('sinif-asistani-pip-styles')) return;
  const style = document.createElement('style');
  style.id = 'sinif-asistani-pip-styles';
  style.textContent = `
    #board-qa-floating-widget {
      position: fixed;
      top: 75px;
      right: 25px;
      width: 380px;
      height: 600px;
      max-height: calc(100vh - 90px);
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.1);
      z-index: 10050;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      font-size: 13px !important;
      color: #0f172a !important;
      user-select: none;
    }
    #board-qa-floating-widget.pip-minimized {
      width: auto !important;
      height: auto !important;
      max-height: none !important;
      background: transparent !important;
      border-radius: 999px !important;
      box-shadow: none !important;
      border: none !important;
      overflow: visible !important;
    }
    .pip-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
      background: #f8fafc;
      overflow: hidden;
    }
    .pip-header {
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      color: #ffffff;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      user-select: none;
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
      min-height: 0;
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
  document.head.appendChild(style);
}

function setupFloatingWidgetDrag(widget, handle) {
  if (!widget || !handle) return;
  if (handle._dragInitialized) return;
  handle._dragInitialized = true;

  let isDragging = false;
  let startX = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;

  const onStart = (clientX, clientY) => {
    isDragging = true;
    const rect = widget.getBoundingClientRect();
    startX = clientX;
    startY = clientY;
    initialLeft = rect.left;
    initialTop = rect.top;
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
    widget.style.left = `${initialLeft}px`;
    widget.style.top = `${initialTop}px`;
    document.body.style.userSelect = 'none';
  };

  const onMove = (clientX, clientY) => {
    if (!isDragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    const maxLeft = Math.max(0, window.innerWidth - widget.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - widget.offsetHeight);
    const newLeft = Math.min(Math.max(10, initialLeft + dx), maxLeft - 10);
    const newTop = Math.min(Math.max(10, initialTop + dy), maxTop - 10);
    widget.style.left = `${newLeft}px`;
    widget.style.top = `${newTop}px`;
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.userSelect = '';
  };

  handle.addEventListener('mousedown', (e) => {
    if (e.target.closest('button, select, input')) return;
    onStart(e.clientX, e.clientY);
    const handleMouseMove = (ev) => onMove(ev.clientX, ev.clientY);
    const handleMouseUp = () => {
      onEnd();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  });

  handle.addEventListener('touchstart', (e) => {
    if (e.target.closest('button, select, input')) return;
    const touch = e.touches[0];
    onStart(touch.clientX, touch.clientY);
    const handleTouchMove = (ev) => {
      const t = ev.touches[0];
      onMove(t.clientX, t.clientY);
    };
    const handleTouchEnd = () => {
      onEnd();
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  }, { passive: true });
}

function openBoardQuestionAnalysisFloatingWidget() {
  ensureFloatingWidgetStyles();

  let widget = document.getElementById('board-qa-floating-widget');
  if (!widget) {
    widget = document.createElement('div');
    widget.id = 'board-qa-floating-widget';
    document.body.appendChild(widget);
  }

  boardFloatingWidget = widget;
  widget.style.display = 'flex';
  boardFloatingMinimized = false;

  renderPipContent(widget);

  closeBoardQuestionAnalysisModal();
  document.addEventListener('keydown', handleBoardQaKeydown);

  if (window.showToast) {
    window.showToast('📌 Yüzen Mini Analiz açıldı. Başlığından tutup ekran üzerinde istediğiniz yere taşıyabilirsiniz.', 'info', 2800);
  }
}

function closeBoardFloatingWidget() {
  if (boardFloatingWidget) {
    boardFloatingWidget.style.display = 'none';
    boardFloatingWidget = null;
    boardFloatingMinimized = false;
  }
}
window.closeBoardFloatingWidget = closeBoardFloatingWidget;
window.openBoardQuestionAnalysisFloatingWidget = openBoardQuestionAnalysisFloatingWidget;

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

  // Eğer zaten harici pencere açıksa öne getir
  if (boardPipWindow && !boardPipWindow.closed) {
    try {
      boardPipWindow.focus();
      renderPipContent(boardPipWindow);
      return;
    } catch (e) {}
  }

  // Eğer zaten uygulama içi yüzen panel açıksa öne getir
  if (boardFloatingWidget && boardFloatingWidget.style.display !== 'none') {
    boardFloatingMinimized = false;
    renderPipContent(boardFloatingWidget);
    return;
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

  // 2. Standart Bağımsız Pop-up Pencere (Masaüstü Tauri haricindeki ortamlarda)
  if (!win && !window.__TAURI__) {
    const left = Math.max(10, (window.screen.availWidth || window.screen.width) - width - 20);
    const top = 80;
    try {
      win = window.open('', 'SinifAsistaniPiP', `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`);
    } catch (err) {
      console.error('window.open hatası:', err);
    }
  }

  // 3. Eğer harici pencere açılamadıysa (Tauri masaüstü, WebKitGTK / Pardus veya engellenmiş pop-up):
  // Doğrudan Uygulama İçi Yüzen Mini Modu aç!
  if (!win) {
    openBoardQuestionAnalysisFloatingWidget();
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

function renderPipContent(target) {
  if (!activeExam) return;
  const isWindow = target && typeof target.closed !== 'undefined' && target.document;
  const isWidget = target && target.nodeType === 1;

  if (isWindow && target.closed) return;
  if (!isWindow && !isWidget) return;

  try {
    const doc = isWindow ? target.document : document;
    const root = isWindow ? target.document.body : target;
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

    // Uygulama içi simge durumuna küçültülmüş yüzen hap modu
    if (isWidget && boardFloatingMinimized) {
      target.classList.add('pip-minimized');
      target.innerHTML = `
        <div class="pip-minimized-pill pip-drag-handle" style="cursor: pointer; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #1e1b4b, #312e81); color: #ffffff; padding: 7px 14px; border-radius: 999px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); font-size: 12px; font-weight: 700; border: 1.5px solid rgba(255,255,255,0.25);">
          <span style="cursor: grab; opacity: 0.7; font-size: 13px;" title="Taşımak için basılı tutun">⋮⋮</span>
          <span>📌 Soru ${boardQaActiveQNum}</span>
          <span style="background: #10b981; color: #fff; padding: 1px 6px; border-radius: 4px; font-size: 10.5px;">D: ${correctAns || '-'}</span>
          <span style="color: #f87171; font-size: 11px;">(${wrongCount}Y)</span>
          <span style="background: rgba(255,255,255,0.18); padding: 2px 7px; border-radius: 4px; font-size: 10px; margin-left: 2px;">Genişlet ⤢</span>
          <button type="button" id="pip-btn-pill-close" style="background: none; border: none; color: #cbd5e1; font-size: 14px; cursor: pointer; padding: 0 2px; line-height: 1; margin-left: 4px;" title="Kapat">✕</button>
        </div>
      `;
      setupFloatingWidgetDrag(target, target.querySelector('.pip-drag-handle'));
      const btnPillClose = target.querySelector('#pip-btn-pill-close');
      if (btnPillClose) {
        btnPillClose.addEventListener('click', (e) => {
          e.stopPropagation();
          closeBoardFloatingWidget();
        });
      }
      const pill = target.querySelector('.pip-minimized-pill');
      if (pill) {
        pill.addEventListener('click', (e) => {
          if (e.target.closest('#pip-btn-pill-close')) return;
          boardFloatingMinimized = false;
          renderPipContent(target);
        });
      }
      return;
    }

    if (isWidget) {
      target.classList.remove('pip-minimized');
    }

    root.innerHTML = `
      <div class="pip-wrapper">
        <!-- Header -->
        <div class="pip-header pip-drag-handle" style="${isWidget ? 'cursor: move;' : ''}">
          <div style="min-width: 0; display: flex; align-items: center; gap: 6px;">
            ${isWidget ? `<span style="cursor: grab; font-size: 14px; opacity: 0.75;" title="Taşımak için basılı tutun">⋮⋮</span>` : ''}
            <div>
              <div style="font-weight: 800; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: ${isWidget ? '180px' : '220px'};">
                📌 ${activeExam.examName || 'Haftalık Sınav'}
              </div>
              <div style="font-size: 10px; color: #c7d2fe; margin-top: 1px;">
                ${isMulti ? currentSubj.name + ' • ' : ''}Toplam ${qCount} Soru
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="background: #f59e0b; color: #000; font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 999px; white-space: nowrap;">
              ${isWidget ? 'Yüzen Mini Mod' : 'Always-on-Top'}
            </span>
            ${isWidget ? `
              <button type="button" id="pip-btn-minimize" style="background: rgba(255,255,255,0.18); border: none; color: #fff; width: 22px; height: 22px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; line-height: 1;" title="Simge Durumuna Küçült">−</button>
              <button type="button" id="pip-btn-close" style="background: rgba(255,255,255,0.18); border: none; color: #fff; width: 22px; height: 22px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 1;" title="Kapat">✕</button>
            ` : ''}
          </div>
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

    if (isWidget) {
      setupFloatingWidgetDrag(target, root.querySelector('.pip-drag-handle'));
      const btnMinimize = root.querySelector('#pip-btn-minimize');
      if (btnMinimize) {
        btnMinimize.addEventListener('click', (e) => {
          e.stopPropagation();
          boardFloatingMinimized = true;
          renderPipContent(target);
        });
      }
      const btnCloseWidget = root.querySelector('#pip-btn-close');
      if (btnCloseWidget) {
        btnCloseWidget.addEventListener('click', (e) => {
          e.stopPropagation();
          closeBoardFloatingWidget();
        });
      }
    }

    const btnPrev = root.querySelector('#pip-btn-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        boardQaStepQuestion(-1);
      });
    }

    const btnNext = root.querySelector('#pip-btn-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        boardQaStepQuestion(1);
      });
    }

    const selQ = root.querySelector('#pip-select-q');
    if (selQ) {
      selQ.addEventListener('change', (e) => {
        boardQaActiveQNum = parseInt(e.target.value, 10) || 1;
        renderBoardQuestionAnalysis();
      });
    }

    root.querySelectorAll('.pip-subj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        boardQaActiveSubjIdx = parseInt(btn.getAttribute('data-subj'), 10) || 0;
        boardQaActiveQNum = 1;
        renderBoardQuestionAnalysis();
      });
    });

    root.querySelectorAll('.pip-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        boardQaActiveFilter = btn.getAttribute('data-filter') || 'all_errors';
        renderBoardQuestionAnalysis();
      });
    });

    if (isWindow) {
      doc.onkeydown = (e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          boardQaStepQuestion(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          boardQaStepQuestion(1);
        }
      };
    }

  } catch (err) {
    console.error('renderPipContent hatası:', err);
  }
}

  // ==========================================================================
  // EL TERMİNALİ İLE ÇİFT YÖNLÜ CANLI SENKRONİZASYON (BULUT & ANLIK EŞİTLEME)
  // ==========================================================================
  window.syncActiveExamToCompanion = async function() {
    if (!activeExam) {
      if (window.showToast) window.showToast('Lütfen önce bir sınav seçin.', 'warning');
      return;
    }

    if (!window.CloudSync) {
      if (window.showToast) window.showToast('Senkronizasyon modülü yüklenemedi.', 'danger');
      return;
    }

    const syncCode = window.CloudSync.syncCode || window.CloudSync.loadSyncCode();
    if (window.showToast) window.showToast(`📱 El Terminali eşitleniyor... (Kod: ${syncCode})`, 'info', 2000);

    try {
      // 1. ÖNCE buluttan el terminalinde girilen güncel cevap anahtarını ve sonuçları çek (üzerine yazılmasını engelle!)
      const pullRes = await window.CloudSync.pullExams();

      // 2. Güncellenmiş sınavı ve sınıfın öğrenci listesini hazırla
      const state = stateManager.loadState();
      const updatedFromCloud = (state.weeklyEvaluations || []).find(e => String(e.id) === String(activeExam.id));
      if (updatedFromCloud) {
        activeExam = updatedFromCloud;
        window.activeWeeklyExam = updatedFromCloud;
      }

      const examBranch = activeExam.branch || '';
      const isMiddle = state.educationLevel === 'middle';
      const classStudents = (state.students || []).filter(s => {
        return !isMiddle || !examBranch || examBranch === 'all' || s.branch === examBranch;
      });

      const examToPush = {
        ...activeExam,
        classStudents: classStudents.map(s => ({
          id: s.id,
          number: s.number,
          name: s.name,
          surname: s.surname,
          branch: s.branch
        }))
      };

      // 3. Birleştirilmiş sınavı ve sınıf listesini buluta gönder
      const pushRes = await window.CloudSync.pushExam(examToPush);

      if (pushRes.success || pullRes.success) {
        // State'i tazele, bilgi çubuğunu ve tabloyu yeniden çiz
        const freshState = stateManager.loadState();
        const updatedExam = (freshState.weeklyEvaluations || []).find(e => String(e.id) === String(activeExam.id));
        if (updatedExam) {
          openActiveExam(updatedExam);
        } else {
          openActiveExam(activeExam);
        }

        const msg = `✅ El Terminali ile eşitlendi! (Kod: ${syncCode}) Cevap anahtarı ve okunan sonuçlar senkronize edildi.`;
        if (window.showToast) window.showToast(msg, 'success', 3500);
      } else {
        const codePrompt = prompt(
          `Bulut bağlantısı kurulamadı. Eşleşme Kodunuz: ${syncCode}\n` +
          `Eşleşme kodunuzu değiştirmek ister misiniz?`,
          syncCode
        );
        if (codePrompt && codePrompt !== syncCode) {
          window.CloudSync.setSyncCode(codePrompt);
          window.syncActiveExamToCompanion();
        }
      }
    } catch (e) {
      console.error('El Terminali eşitleme hatası:', e);
      if (window.showToast) window.showToast('Eşitleme sırasında hata oluştu: ' + e.message, 'danger');
    }
  };

  // Dışarıya sınav listesini ve aktif sınavı render etme API'sini sun
  window.renderExamsList = renderExamsList;
  window.renderWeeklyEvaluations = renderExamsList;
  window.renderActiveExamTable = renderActiveExamTable;
  window.openActiveExam = openActiveExam;
  window.openWeeklyExamStatsView = openWeeklyExamStatsView;
  window.closeWeeklyExamStatsView = closeWeeklyExamStatsView;

  // Global state değiştiğinde (örneğin terminalden canlı sınav, cevap anahtarı veya sonuç geldiğinde) arayüzü anında tazele
  document.addEventListener('stateChanged', () => {
    try {
      const currentActiveId = (activeExam && activeExam.id) || (window.activeWeeklyExam && window.activeWeeklyExam.id);
      if (currentActiveId) {
        const state = (stateManager && stateManager.state) ? stateManager.state : stateManager.loadState();
        const updated = (state.weeklyEvaluations || []).find(e => String(e.id) === String(currentActiveId));
        if (updated) {
          activeExam = updated;
          window.activeWeeklyExam = updated;
        }
      }

      const weeklySec = document.getElementById('weekly');
      const isWeeklyActive = weeklySec && weeklySec.classList.contains('active');
      const isModalOpen = modalEditExamAnswerKey && modalEditExamAnswerKey.classList.contains('active');
      if (!isWeeklyActive && !isModalOpen) {
        return;
      }

      if (weeklyCurrentSubView === 'stats') {
        renderWeeklyExamStatsPanel();
        return;
      }

      if (activeExam && activeExamCard && activeExamCard.style.display !== 'none') {
        openActiveExam(activeExam);
      } else {
        renderExamsList();
      }
      if (activeExam && modalEditExamAnswerKey && modalEditExamAnswerKey.classList.contains('active') && typeof window.openDesktopAnswerKeyModal === 'function') {
        window.openDesktopAnswerKeyModal();
      }
    } catch (e) {
      console.warn('[Weekly] stateChanged arayüz tazeleme hatası:', e);
    }
  });

  window.setupWeeklyTab = setupWeeklyTab;
})();
