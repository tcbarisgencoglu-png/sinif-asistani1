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

let opticalSelectedFiles = [];
let opticalScannedResults = [];
let opticalTempExamKey = {};
let allOpticalDetailsVisible = false;

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
        const marked = Object.keys(tempCreateExamKey).filter(k => k.startsWith(s.id + '_') && tempCreateExamKey[k]).length;
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
        <div class="desktop-opt-bubble-row" data-subj="${currentSubj.id}" data-q="${q}">
          <span class="desktop-opt-bubble-qnum">${q}.</span>
          <div class="desktop-opt-bubbles-wrap">
            ${letters.map(l => `
              <button type="button" class="desktop-opt-bubble-btn ${sel === l ? 'active' : ''}" onclick="window.selectDesktopCreateExamKeyChoice('${key}', '${l}')">
                ${l}
              </button>
            `).join('')}
            <button type="button" class="desktop-opt-clear-btn ${sel ? 'visible' : ''}" id="desk-opt-clear-${key}" title="Boş Bırak" onclick="window.clearDesktopCreateExamKeyChoice('${key}')">
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
      const sel = tempCreateExamKey[q] || '';
      if (sel && letters.includes(sel)) markedCount++;
      else if (sel && !letters.includes(sel)) delete tempCreateExamKey[q];

      html += `
        <div class="desktop-opt-bubble-row" data-q="${q}">
          <span class="desktop-opt-bubble-qnum">${q}.</span>
          <div class="desktop-opt-bubbles-wrap">
            ${letters.map(l => `
              <button type="button" class="desktop-opt-bubble-btn ${sel === l ? 'active' : ''}" onclick="window.selectDesktopCreateExamKeyChoice(${q}, '${l}')">
                ${l}
              </button>
            `).join('')}
            <button type="button" class="desktop-opt-clear-btn ${sel ? 'visible' : ''}" id="desk-opt-clear-${q}" title="Boş Bırak" onclick="window.clearDesktopCreateExamKeyChoice(${q})">
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

window.selectDesktopCreateExamKeyChoice = (keyOrQ, opt) => {
  const key = String(keyOrQ);
  if (tempCreateExamKey[key] === opt) {
    delete tempCreateExamKey[key];
  } else {
    tempCreateExamKey[key] = opt;
  }

  const row = document.querySelector(`#exam-optical-key-grid .desktop-opt-bubble-row[data-q="${key.includes('_') ? key.split('_')[1] : key}"]`);
  if (row) {
    const currentSel = tempCreateExamKey[key] || '';
    row.querySelectorAll('.desktop-opt-bubble-btn').forEach(btn => {
      if (btn.textContent.trim() === currentSel) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    const clr = document.getElementById(`desk-opt-clear-${key}`);
    if (clr) clr.className = `desktop-opt-clear-btn ${currentSel ? 'visible' : ''}`;
  }

  if (tempCreateExamType === 'multi') {
    const multiTabs = document.getElementById('exam-optical-multi-tabs');
    if (multiTabs) {
      tempCreateExamSubjects.forEach(s => {
        const marked = Object.keys(tempCreateExamKey).filter(k => k.startsWith(s.id + '_') && tempCreateExamKey[k]).length;
        const tab = multiTabs.querySelector(`button[onclick*="'${s.id}'"] .badge`);
        if (tab) tab.textContent = `${marked}/${s.questionCount}`;
      });
    }
    const currentSubj = tempCreateExamSubjects.find(s => s.id === activeCreateExamSubjId) || tempCreateExamSubjects[0];
    const totalQ = tempCreateExamSubjects.reduce((sum, s) => sum + s.questionCount, 0);
    const totalMarked = Object.keys(tempCreateExamKey).filter(k => tempCreateExamKey[k]).length;
    const subjMarked = Object.keys(tempCreateExamKey).filter(k => k.startsWith(currentSubj.id + '_') && tempCreateExamKey[k]).length;
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
      tempCreateExamKey[q] = letters[(q - 1) % letters.length];
    }
  }
  renderDesktopAnswerKeyGrid();
};

window.clearDesktopExamKey = () => {
  tempCreateExamKey = {};
  renderDesktopAnswerKeyGrid();
};

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

        if (correctVal !== '' && blankVal !== '') {
          const correct = parseInt(correctVal) || 0;
          const blank = parseInt(blankVal) || 0;
          const wrong = parseInt(wrongInput.value) || 0;
          const net = parseFloat(netSpan.textContent) || 0;
          const score = parseFloat(scoreSpan.textContent) || 0;

          examScores[studentId] = score;
          studentResults[studentId] = {
            correct,
            blank,
            wrong,
            net,
            score
          };
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
    btnDeleteActiveExam.addEventListener('click', () => {
      if (!activeExam) return;

      if (confirm(`"${activeExam.examName}" sınavını tamamen silmek istediğinize emin misiniz?`)) {
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
      }
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
  if (btnPrintOpticalForms) {
    btnPrintOpticalForms.addEventListener('click', () => {
      if (!activeExam) {
        if (toastCallback) toastCallback('Lütfen önce bir sınav seçin!', 'warning');
        return;
      }
      
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
      
      populateOpticalStudentsList();
      updateOpticalLivePreview();
      if (modalPrintOptical) modalPrintOptical.classList.add('active');
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

    if (!modalUploadOpticalEval) return;

    // Sınav Bilgilerini Başlığa Yaz
    if (opticalEvalSubtitle) {
      const qCount = activeExam.totalQuestions || 20;
      const cCount = activeExam.choicesCount || 4;
      const bText = activeExam.branch ? ` • Şube: <strong>${activeExam.branch}</strong>` : '';
      opticalEvalSubtitle.innerHTML = `Sınav: <strong>${activeExam.examName}</strong> • Soru Sayısı: <strong>${qCount}</strong> • Seçenekler: <strong>${cCount} Şıklı</strong>${bText}`;
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
    updateOpticalKeyStatusDisplay();
    renderOpticalKeyEditor();

    // API Anahtarı Durumunu Güncelle
    updateOpticalApiKeyBanner();

    // Modalı Göster
    modalUploadOpticalEval.classList.add('active');
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Modalı Kapatma Butonları
  if (btnCloseOpticalUploadModal) {
    btnCloseOpticalUploadModal.addEventListener('click', () => {
      if (modalUploadOpticalEval) modalUploadOpticalEval.classList.remove('active');
    });
  }
  if (btnCancelOpticalUpload) {
    btnCancelOpticalUpload.addEventListener('click', () => {
      if (modalUploadOpticalEval) modalUploadOpticalEval.classList.remove('active');
    });
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
          const modalSetup = document.getElementById('modal-gemini-key-setup');
          if (modalSetup) modalSetup.classList.add('active');
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
          const modalSetup = document.getElementById('modal-gemini-key-setup');
          if (modalSetup) {
            modalSetup.classList.add('active');
          } else {
            const entered = prompt('Lütfen Google Gemini API anahtarınızı giriniz:');
            if (entered && entered.trim()) {
              if (window.setGeminiApiKey) window.setGeminiApiKey(entered.trim());
              else localStorage.setItem('sinif_asistani_gemini_api_key', entered.trim());
              updateOpticalApiKeyBanner();
            }
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
    const answeredCount = Object.keys(opticalTempExamKey || {}).filter(k => parseInt(k, 10) <= qCount && opticalTempExamKey[k]).length;

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

  // Cevap Anahtarı Editörü Grid Çizimi
  function renderOpticalKeyEditor() {
    if (!opticalEvalKeyGrid || !activeExam) return;
    opticalEvalKeyGrid.innerHTML = '';

    const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
    const cCount = parseInt(activeExam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, cCount);

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

  // Cevap Anahtarı Örnek Doldur
  if (btnOpticalFillSampleKey) {
    btnOpticalFillSampleKey.addEventListener('click', () => {
      if (!activeExam) return;
      const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
      const cCount = parseInt(activeExam.choicesCount, 10) || 4;
      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, cCount);
      for (let q = 1; q <= qCount; q++) {
        opticalTempExamKey[q] = letters[(q - 1) % letters.length];
      }
      activeExam.answerKey = { ...opticalTempExamKey };
      stateManager.saveExam(activeExam);
      updateOpticalKeyStatusDisplay();
      renderOpticalKeyEditor();
    });
  }

  // Cevap Anahtarı Temizle
  if (btnOpticalClearKey) {
    btnOpticalClearKey.addEventListener('click', () => {
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
          // 8KB'den büyükse geçerli bir sayfa taramasıdır (küçük simgeleri filtreler)
          if (jpegBytes.length > 8192) {
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

  // Tekil Dosya veya Çok Sayfalı PDF İşleme Motoru
  async function processOpticalFile(file) {
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

      // 1. PDF.js ile Sayfaları Render Etme (Kullanılabilirse)
      if (window.pdfjsLib) {
        try {
          const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
          const pdfDoc = await loadingTask.promise;
          const pages = [];
          for (let p = 1; p <= pdfDoc.numPages; p++) {
            const page = await pdfDoc.getPage(p);
            const initialVp = page.getViewport({ scale: 1.0 });
            const maxDim = Math.max(initialVp.width, initialVp.height);
            const scale = Math.max(1.0, Math.min(2.5, 1400 / maxDim));
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;

            const pageDataUrl = canvas.toDataURL('image/jpeg', 0.90);
            pages.push({
              id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '_p' + p,
              file: file,
              name: `${file.name} (Sayfa ${p}/${pdfDoc.numPages})`,
              sizeText: `Sayfa ${p} / ${pdfDoc.numPages}`,
              dataUrl: pageDataUrl,
              isPdf: false,
              isPdfPage: true
            });
          }
          if (pages.length > 0) return pages;
        } catch (pdfErr) {
          console.warn('PDF.js render hatası, alternatif deneniyor:', pdfErr);
        }
      }

      // 2. CamScanner Gömülü JPEG Ayrıştırıcı (Saf JS, Harici Kütüphanesiz)
      const extractedJpegs = extractJpegsFromUint8Array(new Uint8Array(arrayBuffer));
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

      // 3. Doğrudan PDF Dosyası (Gemini Vision API çok sayfalı PDF'leri yerel olarak inceler)
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
    if (hasPdf && toastCallback) {
      toastCallback('PDF belgeleri ve sayfalar taranıyor, lütfen bekleyin...', 'info');
    }

    let newlyAdded = 0;
    for (const file of filesArray) {
      const items = await processOpticalFile(file);
      items.forEach(item => {
        opticalSelectedFiles.push(item);
        newlyAdded++;
      });
    }

    renderOpticalFilesPreview();
    if (hasPdf && toastCallback) {
      toastCallback(`${newlyAdded} form sayfası başarıyla listeye eklendi.`, 'success');
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
  // YAPAY ZEKA DEĞERLENDİRME ÇALIŞTIRMA MOTORU
  // ==========================================================================
  if (btnStartOpticalAiEval) {
    btnStartOpticalAiEval.addEventListener('click', () => {
      startOpticalAiEvaluation();
    });
  }

  async function startOpticalAiEvaluation() {
    if (!activeExam || opticalSelectedFiles.length === 0) return;

    let apiKey = (window.getGeminiApiKey ? window.getGeminiApiKey() : (localStorage.getItem('sinif_asistani_gemini_api_key') || '')).trim();
    if (!apiKey) {
      const entered = prompt('✨ Yapay zeka ile optik okuma yapabilmek için Google Gemini API anahtarı gereklidir.\n\nLütfen Gemini API anahtarınızı giriniz:');
      if (entered && entered.trim()) {
        apiKey = entered.trim();
        if (window.setGeminiApiKey) window.setGeminiApiKey(apiKey);
        else localStorage.setItem('sinif_asistani_gemini_api_key', apiKey);
        updateOpticalApiKeyBanner();
      } else {
        return;
      }
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
          // Görseli canvas üzerinden optimize et (maks 1400px)
          sendingData = await resizeImageForOmr(fileItem.dataUrl, 1400);
        }

        const isMulti = activeExam && !!activeExam.isMultiSubject;
        const examSubjects = activeExam && activeExam.subjects ? activeExam.subjects : [];

        let prompt = '';
        if (isMulti && examSubjects.length > 0) {
          const subjectsDesc = examSubjects.map(s => `- ${s.name}: ${s.questionCount} soru (1'den ${s.questionCount}'e kadar)`).join('\n');
          prompt = `Görseldeki veya PDF belgesindeki ÇOKLU DERS (deneme/branşlı) sınav optik formunu dikkatlice incele.
Sınav Bilgileri:
- Sınav Adı: ${examTitle}
- Sınav Türü: Çoklu Ders / Branşlı Deneme Sınavı
- Dersler ve Soru Sayıları:
${subjectsDesc}
- Toplam Soru Sayısı: ${qCount}
- Olası Seçenekler: ${letters.join(', ')}

ÖNEMLİ TALİMATLAR:
1. Bu form ÇOKLU DERS optik formudur. Her derste soru numaraları 1'den başlar (Örn: ${examSubjects[0]?.name} 1..${examSubjects[0]?.questionCount}, ${examSubjects[1]?.name || 'Diğer'} 1..${examSubjects[1]?.questionCount || 10} gibi).
2. Belgede veya görselde 1 veya birden fazla öğrencinin optik formu bulunabilir (örneğin CamScanner ile taranmış çok sayfalı bir PDF veya sayfada altlı üstlü 2 form). Algılanan BÜTÜN optik formları ayrı bir nesne olarak "cards" dizisi içine ekle.
3. Her bir form için:
   - "Öğrenci:" yanındaki tam isim ve soyismi ("studentName").
   - "No:" yanındaki öğrenci okul numarasını ("studentNo").
4. Her dersin altındaki sorular için öğrencinin doldurduğu/karaladığı şıkları tespit et:
   - "answers" nesnesinde her dersin soru cevaplarını "${examSubjects[0]?.id || 'sub_0'}_1" formatında (örneğin: "${examSubjects[0]?.id || 'sub_0'}_1": "A", "${examSubjects[0]?.id || 'sub_0'}_2": "B") ya da "${examSubjects[0]?.name}_1" şeklinde belirt.
   - Doldurulan seçeneğin harfini ('A', 'B', 'C', 'D' vb.) yaz.
   - Soru boş bırakılmışsa "" (boş dize) yaz.
   - Birden fazla şık karalanmışsa "MULTIPLE" yaz.
   - Eğer bir şık karalanıp sonra üzeri çizilmiş ve başka bir şık doldurulmuşsa geçerli olanı al.

Cevabını SADECE aşağıdaki JSON formatında ver (hiçbir markdown etiketi veya ek metin ekleme):
{
  "cards": [
    {
      "studentName": "Öğrenci Adı",
      "studentNo": "123",
      "answers": {
        "${examSubjects[0]?.id || 'sub_0'}_1": "A"
      }
    }
  ]
}`;
        } else {
          prompt = `Görseldeki veya PDF belgesindeki sınav optik formunu dikkatlice incele.
Sınav Bilgileri:
- Sınav Adı: ${examTitle}
- Toplam Soru Sayısı: ${qCount}
- Olası Seçenekler: ${letters.join(', ')}

ÖNEMLİ TALİMATLAR:
1. Belgede veya görselde 1 veya birden fazla öğrencinin optik formu bulunabilir (örneğin CamScanner ile taranmış çok sayfalı bir PDF veya tek bir A4 sayfasında altlı üstlü 2 öğrencinin formu basılmış olabilir). Algılanan BÜTÜN optik formları ayrı bir nesne olarak "cards" dizisi içine ekle. Tek form varsa 1 elemanlı dizi döndür.
2. Her bir form için:
   - "Öğrenci:" yanındaki tam isim ve soyismi ("studentName").
   - "No:" yanındaki öğrenci okul numarasını ("studentNo").
3. 1'den ${qCount}'e kadar olan sorular için öğrencinin kurşun veya tükenmez kalemle DOLDURDUĞU / KARALADIĞI şıkkı tespit et:
   - Doldurulan seçeneğin harfini ('A', 'B', 'C', 'D' vb.) yaz.
   - Soru hiç işaretlenmemişse veya boş bırakılmışsa "" (boş dize) yaz.
   - Bir soruda birden fazla şık karalanmışsa "MULTIPLE" yaz.
   - Eğer bir şık karalanıp sonra üzeri çizilmiş ve başka bir şık doldurulmuşsa geçerli olanı al.

Cevabını SADECE aşağıdaki JSON formatında ver (hiçbir markdown etiketi veya ek metin ekleme):
{
  "cards": [
    {
      "studentName": "Öğrenci Adı",
      "studentNo": "123",
      "answers": {
        "1": "A",
        "2": "B"
      }
    }
  ]
}`;
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
        } else if (parsed.answers) {
          detectedCards = [parsed];
        }

        appendOpticalLog(`✓ ${fileItem.name}: ${detectedCards.length} adet optik form algılandı.`);

        // Her bir kartı değerlendir
        detectedCards.forEach((card, cardIndex) => {
          const cardStudentNo = String(card.studentNo || '').trim();
          const cardStudentName = String(card.studentName || '').trim();

          // Öğrenciyi Eşle
          let matched = null;
          if (cardStudentNo) {
            matched = classStudents.find(s => String(s.number).trim() === cardStudentNo);
          }
          if (!matched && cardStudentName) {
            const cleanAiName = cardStudentName.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü]/g, '');
            if (cleanAiName.length > 2) {
              matched = classStudents.find(s => {
                const sName = `${s.name} ${s.surname || ''}`.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü]/g, '');
                return sName.includes(cleanAiName) || cleanAiName.includes(sName);
              });
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

            examSubjects.forEach(subj => {
              let subjCorrect = 0;
              let subjWrong = 0;
              let subjBlank = 0;

              for (let q = 1; q <= subj.questionCount; q++) {
                const key = `${subj.id}_${q}`;
                let val = '';
                if (cardAnswers[key] !== undefined) {
                  val = cardAnswers[key];
                } else if (cardAnswers[`${subj.name}_${q}`] !== undefined) {
                  val = cardAnswers[`${subj.name}_${q}`];
                } else if (card.subjectAnswers && card.subjectAnswers[subj.id] && card.subjectAnswers[subj.id][q] !== undefined) {
                  val = card.subjectAnswers[subj.id][q];
                } else if (card.subjectAnswers && card.subjectAnswers[subj.name] && card.subjectAnswers[subj.name][q] !== undefined) {
                  val = card.subjectAnswers[subj.name][q];
                } else {
                  const normSubj = subj.name.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]/g, '');
                  const matchedKey = Object.keys(cardAnswers).find(k => {
                    const kNorm = k.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]/g, '');
                    return kNorm.startsWith(normSubj) && k.endsWith(`_${q}`);
                  });
                  if (matchedKey) val = cardAnswers[matchedKey];
                }

                val = String(val || '').trim().toUpperCase();
                if (!letters.includes(val) && val !== 'MULTIPLE') {
                  val = '';
                }

                const correctAns = answerKey[key] || '';
                const qd = {
                  subjId: subj.id,
                  subjName: subj.name,
                  q,
                  key,
                  marked: val === 'MULTIPLE' ? '' : val,
                  status: val === 'MULTIPLE' ? 'multiple' : (val ? 'marked' : 'blank'),
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
                name: subj.name,
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

            opticalScannedResults.push({
              resultId: 'omr_res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              fileName: fileItem.name,
              thumbUrl: fileItem.isPdf ? '' : fileItem.dataUrl,
              isPdf: !!fileItem.isPdf,
              pdfDataUrl: fileItem.isPdf ? fileItem.dataUrl : '',
              rawStudentName: cardStudentName,
              rawStudentNo: cardStudentNo,
              matchedStudentId: matched ? matched.id : '',
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
            // Tek Ders Puanlama (Mevcut Mantık)
            for (let q = 1; q <= qCount; q++) {
              let val = cardAnswers[q] || cardAnswers[String(q)] || '';
              val = String(val).trim().toUpperCase();
              if (!letters.includes(val) && val !== 'MULTIPLE') {
                val = '';
              }

              const correctAns = answerKey[q] || answerKey[String(q)] || '';
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

  // Canvas ile Görsel Boyutlandırma
  function resizeImageForOmr(dataUrl, maxDim = 1400) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
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
        resolve(canvas.toDataURL('image/jpeg', 0.88));
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

    // İstatistikler
    const totalCount = opticalScannedResults.length;
    const matchedCount = opticalScannedResults.filter(r => r.matchedStudentId).length;
    const avgScore = totalCount > 0 ? (opticalScannedResults.reduce((sum, r) => sum + r.score, 0) / totalCount).toFixed(1) : 0;

    if (opticalResStatTotal) opticalResStatTotal.textContent = totalCount;
    if (opticalResStatMatched) opticalResStatMatched.textContent = `${matchedCount} / ${totalCount}`;
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

    opticalScannedResults.forEach((res, index) => {
      const card = document.createElement('div');
      card.className = `optical-eval-card ${!res.matchedStudentId ? 'unmatched' : ''}`;

      // Öğrenci Seçenekleri
      let optionsHtml = `<option value="">-- Öğrenci Seçilmedi --</option>`;
      sortedStudents.forEach(st => {
        const isSelected = String(st.id) === String(res.matchedStudentId);
        optionsHtml += `<option value="${st.id}" ${isSelected ? 'selected' : ''}>${st.number} - ${st.name} ${st.surname}</option>`;
      });

      const matchBadge = res.matchedStudentId
        ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; font-size: 0.75rem;">✓ Eşleşti</span>`
        : `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #b45309; font-size: 0.75rem;">⚠️ Eşleşmedi (Lütfen Seçin)</span>`;

      // Şıklar HTML'i
      let answersHtml = '';
      if (res.subjectBreakdown) {
        const subjectsMap = {};
        res.questionDetails.forEach(qd => {
          const sName = qd.subjName || 'Ders';
          if (!subjectsMap[sName]) subjectsMap[sName] = [];
          subjectsMap[sName].push(qd);
        });

        for (const sName in subjectsMap) {
          answersHtml += `<div style="width: 100%; font-size: 0.74rem; font-weight: 800; color: #4f46e5; margin-top: 6px; border-bottom: 1px dashed var(--border-color); padding-bottom: 2px;">📚 ${sName}</div>`;
          subjectsMap[sName].forEach(qd => {
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
              <div class="optical-answer-chip ${chipClass}" title="${sName} Soru ${qd.q}: İşaretlenen '${qd.marked || 'Boş'}' - Doğru '${qd.keyAnswer || '-'}'">
                <span>S${qd.q}:</span>
                <strong>${qd.marked || '-'}</strong>
                <small>${icon}</small>
                ${detailText ? `<span style="font-size: 0.65rem; opacity: 0.85;">${detailText}</span>` : ''}
              </div>
            `;
          });
        }
      } else {
        res.questionDetails.forEach(qd => {
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
            <div class="optical-answer-chip ${chipClass}" title="Soru ${qd.q}: İşaretlenen '${qd.marked || 'Boş'}' - Doğru '${qd.keyAnswer || '-'}'">
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
            <strong>${sb.name}:</strong> ${sb.correct}D ${sb.wrong}Y <span style="color: #4f46e5; font-weight: 700;">(${sb.net} Net)</span>
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
              <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.35rem;">
                <label style="font-weight: 700; font-size: 0.82rem; margin: 0; color: var(--text-primary);">Öğrenci:</label>
                <select class="form-control form-control-sm res-student-select" style="font-size: 0.82rem; height: 30px; padding: 2px 8px; flex: 1;">
                  ${optionsHtml}
                </select>
                ${matchBadge}
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
          <button type="button" class="btn btn-secondary btn-sm res-toggle-answers-btn" style="font-size: 0.72rem; padding: 0.2rem 0.5rem; height: auto;">
            <span>Şıkları İncele</span>
          </button>
          <div class="res-answers-box" style="display: ${allOpticalDetailsVisible ? 'flex' : 'none'}; flex-wrap: wrap; gap: 4px; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--border-color);">
            ${answersHtml}
          </div>
        </div>
      `;

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

  function commitOpticalResultsToExam() {
    try {
      if (!activeExam || opticalScannedResults.length === 0) return;

      // Eşleşmeyen öğrenci kontrolü
      const unmatched = opticalScannedResults.filter(r => !r.matchedStudentId);
      if (unmatched.length > 0) {
        if (!confirm(`⚠️ ${unmatched.length} adet optik form için öğrenci eşleştirmesi yapılmamış.\n\nEşleşmeyen formlar atlanacak, diğer öğrencilerin notları aktarılacaktır. Devam etmek istiyor musunuz?`)) {
          return;
        }
      }

      if (!activeExam.examScores) activeExam.examScores = {};
      if (!activeExam.studentResults) activeExam.studentResults = {};

      let savedCount = 0;
      opticalScannedResults.forEach(res => {
        if (!res.matchedStudentId) return;

        activeExam.examScores[res.matchedStudentId] = res.score;
        activeExam.studentResults[res.matchedStudentId] = {
          correct: res.correctCount,
          wrong: res.wrongCount,
          blank: res.blankCount,
          net: res.net,
          score: res.score,
          answers: { ...res.answers },
          subjectBreakdown: res.subjectBreakdown || null,
          source: 'ai_optical_upload',
          scannedAt: new Date().toISOString()
        };
        savedCount++;
      });

      activeExam.updatedAt = new Date().toISOString();
      stateManager.saveExam(activeExam);

      // Modalı kapat
      if (modalUploadOpticalEval) modalUploadOpticalEval.classList.remove('active');

      // Tabloyu ve listeyi güncelle
      renderExamsList();
      openActiveExam(activeExam);

      if (toastCallback) {
        toastCallback(`🎉 ${savedCount} öğrencinin sınav notları başarıyla aktarıldı ve kaydedildi!`, 'success');
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
    btnDesktopAkClearAll.addEventListener('click', () => {
      if (!confirm('Tüm cevap anahtarını temizlemek istediğinize emin misiniz?')) return;
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
              activeExam.subjects.forEach(subj => {
                let subjCorrect = 0;
                let subjWrong = 0;
                let subjBlank = 0;

                for (let q = 1; q <= subj.questionCount; q++) {
                  const key = `${subj.id}_${q}`;
                  const ans = String(res.answers[key] || res.answers[`${subj.name}_${q}`] || '').trim().toUpperCase();
                  const correctAns = String(activeExam.answerKey[key] || '').trim().toUpperCase();

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
                }

                let subjNet = penaltyRate > 0 ? (subjCorrect - (subjWrong / penaltyRate)) : subjCorrect;
                subjNet = Math.max(0, parseFloat(subjNet.toFixed(2)));
                const subjScore = subj.questionCount > 0 ? parseFloat(((subjNet / subj.questionCount) * 100).toFixed(1)) : 0;

                subjectBreakdown[subj.id] = {
                  name: subj.name,
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

  function populateOpticalStudentsList() {
    if (!opticalStudentsList) return;
    opticalStudentsList.innerHTML = '';
    
    const state = stateManager.loadState();
    const isMiddle = state.educationLevel === 'middle';
    const examBranch = activeExam ? activeExam.branch : '';

    const activeStudents = state.students.filter(student => {
      return !isMiddle || !examBranch || student.branch === examBranch;
    });

    if (activeStudents.length === 0) {
      opticalStudentsList.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">Kayıtlı öğrenci bulunmuyor.</div>';
      if (opticalSelectedCount) opticalSelectedCount.textContent = '0 öğrenci seçildi';
      return;
    }
    
    const sortedStudents = [...activeStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    
    sortedStudents.forEach(student => {
      const item = document.createElement('label');
      item.className = 'optical-student-checkbox-item';
      item.innerHTML = `
        <input type="checkbox" value="${student.id}" checked>
        <span>${student.number} - ${student.name} ${student.surname}</span>
      `;
      
      item.querySelector('input').addEventListener('change', updateOpticalSelectedCount);
      item.querySelector('input').addEventListener('change', updateOpticalLivePreview);
      opticalStudentsList.appendChild(item);
    });
    
    updateOpticalSelectedCount();
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
              <span class="omr-row-tick"></span>
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
            <span class="omr-row-tick"></span>
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
    const previewContainer = document.getElementById('optical-live-preview');
    if (!previewContainer) return;
    previewContainer.innerHTML = '';

    const questionCountInput = document.getElementById('optical-questions-input');
    const choicesCountInput = document.getElementById('optical-choices-input');
    const typeInput = document.getElementById('optical-type-input');
    const perPageInput = document.getElementById('optical-per-page-input');
    if (!questionCountInput || !choicesCountInput) return;

    const questionCount = parseInt(questionCountInput.value) || 20;
    const choicesCount = parseInt(choicesCountInput.value) || 4;
    const formType = typeInput ? typeInput.value : 'named';
    const perPage = parseInt(perPageInput ? perPageInput.value : '2', 10) || 2;

    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
    const state = stateManager.loadState();
    const examName = activeExam ? (activeExam.examName || 'Haftalık Değerlendirme') : 'Haftalık Değerlendirme';
    const isMultiSubject = activeExam ? !!activeExam.isMultiSubject : false;
    const subjects = activeExam && activeExam.subjects ? activeExam.subjects : [];

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
        const s = (state.students || []).find(st => st.id === id);
        return s ? { name: `${s.name} ${s.surname || ''}`.trim(), number: s.number || '' } : { name: 'Örnek Öğrenci', number: '123' };
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
  let exams = state.weeklyEvaluations.filter(e => e.id);

  if (exams.length === 0 && state.students.length > 0) {
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
    exams = state.weeklyEvaluations.filter(e => e.id);
  }

  exams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
        const student = state.students.find(s => s.id === item.studentId);
        const name = student ? `${student.name} ${student.surname[0]}.` : 'Öğrenci';
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

    const formattedWeek = window.formatWeekTR ? window.formatWeekTR(exam.weekId, 'full') : exam.weekId;
    const penaltyText = exam.wrongAffects ? `${exam.penaltyRate} Yanlış 1 Doğruyu Götürür` : 'Yanlışlar Doğruları Etkilemez';
    const opticalBadge = exam.hasOpticalForm ? `<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary); font-size: 0.72rem; padding: 0.1rem 0.35rem; font-weight: 700;">📝 ${exam.choicesCount || 4} Şıklı Optik</span>` : '';
    const multiBadge = exam.isMultiSubject && exam.subjects ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; font-size: 0.72rem; padding: 0.1rem 0.35rem; font-weight: 700;">📚 ${exam.subjects.length} Ders</span>` : '';

    const card = document.createElement('div');
    card.className = `exam-card ${activeExam && activeExam.id === exam.id ? 'active-card' : ''}`;
    card.innerHTML = `
      <div class="exam-card-title">
        <span style="font-weight: 700; color: var(--text-primary);">${exam.examName}${exam.branch ? ` <span class="badge" style="background: rgba(255, 255, 255, 0.1); color: var(--text-primary); font-size: 0.7rem; padding: 0.1rem 0.3rem; margin-left: 0.25rem;">${exam.branch}</span>` : ''}</span>
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

  window.safeCreateIcons();
}

function openActiveExam(exam) {
  activeExam = exam;

  if (activeExamCard) activeExamCard.style.display = 'block';
  if (btnPrintReport) btnPrintReport.style.display = 'inline-flex';

  if (activeExamTitle) activeExamTitle.textContent = exam.examName;

  const formattedWeek = window.formatWeekTR ? window.formatWeekTR(exam.weekId, 'full') : exam.weekId;
  const keyCount = Object.keys(exam.answerKey || {}).filter(k => exam.answerKey[k]).length;
  const opticalBadge = exam.hasOpticalForm ? `<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary); font-weight: 700; cursor: pointer;" title="Cevap anahtarını düzenlemek için tıklayın" onclick="window.openDesktopAnswerKeyModal ? window.openDesktopAnswerKeyModal() : null">📝 ${exam.choicesCount || 4} Şıklı Optik Form (${keyCount}/${exam.totalQuestions} Cevap 🔑)</span>` : '';
  const multiSubjBadge = exam.isMultiSubject && exam.subjects ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; font-weight: 700;" title="${exam.subjects.map(s => `${s.name}: ${s.questionCount} Soru`).join(' • ')}">📚 Çoklu Ders (${exam.subjects.length} Branş - ${exam.totalQuestions} Soru)</span>` : '';
  const penaltyText = exam.wrongAffects ? `${exam.penaltyRate} Yanlış 1 Doğruyu Götürür` : 'Yanlışlar Doğruları Etkilemez';

  if (activeExamInfoBar) {
    activeExamInfoBar.innerHTML = `
      <span><strong>Hafta:</strong> ${formattedWeek}</span>
      <span>•</span>
      <span><strong>Soru Sayısı:</strong> ${exam.totalQuestions}</span>
      <span>•</span>
      <span><strong>Süre:</strong> ${exam.duration} Dk</span>
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
  const listItems = document.getElementById('weekly-exams-list').querySelectorAll('.exam-card');
  const state = stateManager.loadState();
  const exams = state.weeklyEvaluations.filter(e => e.id);
  exams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const activeIdx = exams.findIndex(e => e.id === exam.id);
  if (activeIdx !== -1 && listItems[activeIdx]) {
    listItems[activeIdx].classList.add('active-card');
  }
}

function renderActiveExamTable() {
  const state = stateManager.loadState();
  if (!activeExamTableBody) return;
  activeExamTableBody.innerHTML = '';

  const isMiddle = state.educationLevel === 'middle';
  const examBranch = activeExam.branch || '';

  const activeStudents = state.students.filter(student => {
    return !isMiddle || !examBranch || student.branch === examBranch;
  });

  if (activeStudents.length === 0) {
    activeExamTableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          ${isMiddle && examBranch ? `Bu sınavın uygulanacağı "${examBranch}" şubesinde kayıtlı öğrenci yok.` : 'Sınıfta kayıtlı öğrenci yok.'}
        </td>
      </tr>
    `;
    return;
  }

  // Öğrencileri alfabetik sıraya göre sırala
  const sortedStudents = [...activeStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  sortedStudents.forEach(student => {
    const result = (activeExam.studentResults && activeExam.studentResults[student.id]) || {
      correct: '',
      blank: '',
      wrong: '',
      net: '',
      score: ''
    };

    const row = document.createElement('tr');
    const isAbsentToday = stateManager.isStudentAbsent(student.id);
    if (isAbsentToday) {
      row.classList.add('absent-row');
    }
    const initials = `${student.name[0] || ''}${student.surname[0] || ''}`;
    const avatarHtml = student.photo
      ? `<img src="${student.photo}" class="avatar-sm" style="width: 32px; height: 32px; object-fit: cover; border-radius: 50%; margin: 0;">`
      : `<div class="avatar-sm" style="width: 32px; height: 32px; font-size: 0.8rem; margin: 0; background-color: var(--primary-light); color: var(--primary); text-transform: uppercase; display: flex; align-items: center; justify-content: center; border-radius: 50%;">${initials}</div>`;

    row.innerHTML = `
      <td style="text-align: center; vertical-align: middle; font-weight: 600;">${student.number}</td>
      <td style="vertical-align: middle;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${avatarHtml}
          <strong>${student.name} ${student.surname}</strong>
        </div>
      </td>
      <td style="text-align: center; vertical-align: middle;">
        <input type="number" class="form-control exam-table-input exam-correct-input" data-student-id="${student.id}" min="0" max="${activeExam.totalQuestions}" value="${result.correct}" placeholder="-">
      </td>
      <td style="text-align: center; vertical-align: middle;">
        <input type="number" class="form-control exam-table-input exam-blank-input" data-student-id="${student.id}" min="0" max="${activeExam.totalQuestions}" value="${result.blank}" placeholder="-">
      </td>
      <td style="text-align: center; vertical-align: middle;">
        <input type="number" class="form-control exam-table-input exam-wrong-input" readonly value="${result.wrong !== undefined ? result.wrong : ''}" style="background-color: var(--bg-primary); opacity: 0.85;" placeholder="-">
      </td>
      <td style="text-align: center; vertical-align: middle; font-weight: 700; color: var(--primary);">
        <span class="exam-net-span">${result.net !== undefined && result.net !== '' ? result.net : '-'}</span>
        ${(() => {
          if (result.subjectBreakdown && typeof result.subjectBreakdown === 'object') {
            const parts = Object.values(result.subjectBreakdown).map(b => `${b.subjectName || 'Ders'}: ${b.net !== undefined ? b.net : b.correct}N`);
            if (parts.length > 0) {
              return `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; font-weight: normal; white-space: nowrap;" title="${Object.values(result.subjectBreakdown).map(b => `${b.subjectName}: ${b.correct}D ${b.wrong}Y ${b.blank}B (${b.net} Net)`).join(' | ')}">${parts.join(' • ')}</div>`;
            }
          }
          return '';
        })()}
      </td>
      <td style="text-align: center; vertical-align: middle; font-weight: 700;">
        <span class="exam-score-span">${result.score !== undefined && result.score !== '' ? result.score : '-'}</span>
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

    correctInput.addEventListener('input', updateHandler);
    blankInput.addEventListener('input', updateHandler);

    // İlk yüklemedeki değişim okları
    if (result.score !== undefined && result.score !== '') {
      updateChangeIndicator(student.id, parseFloat(result.score), row);
    } else {
      row.querySelector('.change-indicator-td').innerHTML = `<span class="score-change-badge score-stable">-</span>`;
    }

    activeExamTableBody.appendChild(row);
  });

  window.safeCreateIcons();
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

  // Karşılaştırma göstergesini güncelle
  updateChangeIndicator(studentId, score, rowEl);
}

function updateChangeIndicator(studentId, currentScore, rowEl) {
  const td = rowEl.querySelector('.change-indicator-td');
  if (!td) return;

  const prevScore = getPreviousExamScore(studentId);
  if (prevScore === null) {
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

  window.safeCreateIcons();
}

function getPreviousExamScore(studentId) {
  const state = stateManager.loadState();
  const exams = state.weeklyEvaluations.filter(e => e.id);
  
  // Oluşturulma tarihine göre azalan sırada sırala (yeni en üstte)
  exams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const activeIndex = exams.findIndex(e => e.id === activeExam.id);
  
  // Bu sınavdan daha önce oluşturulmuş olan ilk sınavı (descending listesinde bir sonraki elemanı) bulalım
  const prevExam = (activeIndex !== -1 && activeIndex + 1 < exams.length) ? exams[activeIndex + 1] : null;

  if (prevExam && prevExam.examScores && prevExam.examScores[studentId] !== undefined) {
    return parseFloat(prevExam.examScores[studentId]);
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
      const parts = Object.values(p.subjectBreakdown).map(b => `${b.subjectName || 'Ders'}: ${b.net !== undefined ? b.net : b.correct}N`);
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



  window.setupWeeklyTab = setupWeeklyTab;
})();
