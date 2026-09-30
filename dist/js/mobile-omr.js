/**
 * Sınıf Asistanı - 100% Çevrim Dışı Optik Form ve Optik Okuma (OMR) Modülü
 * İnternet veya harici API gerektirmez; HTML5 Canvas ve saf JavaScript ile çalışır.
 */

(function(window) {
  'use strict';

  // Aktif taranan sınav ve durum bilgileri
  let activeExam = null;
  let activeMediaStream = null;
  let lastScannedResult = null;

  // ==========================================================================
  // 1. CEVAP ANAHTARI YÖNETİMİ
  // ==========================================================================

  window.openAnswerKeyModal = function(examId) {
    if (!window.stateManager) return;
    const state = window.stateManager.loadState ? window.stateManager.loadState() : (window.stateManager.state || {});
    const exam = (state.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
    if (!exam) return;

    activeExam = exam;
    if (window.vibrate) window.vibrate(20);

    const modal = document.getElementById('modal-mobile-answer-key');
    const titleEl = document.getElementById('m-ak-title');
    const subtitleEl = document.getElementById('m-ak-subtitle');
    const listEl = document.getElementById('m-ak-questions-list');

    if (!modal || !listEl) return;

    if (titleEl) titleEl.textContent = `${exam.examName || 'Değerlendirme'} • Cevap Anahtarı`;
    const qCount = parseInt(exam.totalQuestions, 10) || 20;
    const choicesCount = parseInt(exam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);

    if (subtitleEl) {
      subtitleEl.textContent = `${qCount} Soru • ${letters.join('-')} Şıkları • Doğru cevapları tek dokunuşla belirleyin`;
    }

    // Mevcut cevap anahtarı
    const currentKey = exam.answerKey || {};

    let html = '';
    for (let q = 1; q <= qCount; q++) {
      const selected = currentKey[q] || '';
      html += `
        <div class="m-ak-row" data-q="${q}">
          <span class="m-ak-qnum">${q}.</span>
          <div class="m-ak-options">
            ${letters.map(l => `
              <button type="button" class="m-ak-opt-btn ${selected === l ? 'active' : ''}" data-q="${q}" data-opt="${l}" onclick="window.selectAnswerKeyChoice(${q}, '${l}')">
                ${l}
              </button>
            `).join('')}
            <button type="button" class="m-ak-clear-btn ${selected ? 'visible' : ''}" id="m-ak-clear-${q}" title="Boş Bırak" onclick="window.clearAnswerKeyChoice(${q})">
              &times;
            </button>
          </div>
        </div>
      `;
    }

    listEl.innerHTML = html;
    modal.classList.add('active');
    updateAnswerKeyCounter();
  };

  window.selectAnswerKeyChoice = function(q, opt) {
    if (window.vibrate) window.vibrate(10);
    const row = document.querySelector(`.m-ak-row[data-q="${q}"]`);
    if (!row) return;

    const btns = row.querySelectorAll('.m-ak-opt-btn');
    const clearBtn = document.getElementById(`m-ak-clear-${q}`);

    btns.forEach(b => {
      if (b.getAttribute('data-opt') === opt) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    if (clearBtn) clearBtn.classList.add('visible');
    updateAnswerKeyCounter();
  };

  window.clearAnswerKeyChoice = function(q) {
    if (window.vibrate) window.vibrate(10);
    const row = document.querySelector(`.m-ak-row[data-q="${q}"]`);
    if (!row) return;

    row.querySelectorAll('.m-ak-opt-btn').forEach(b => b.classList.remove('active'));
    const clearBtn = document.getElementById(`m-ak-clear-${q}`);
    if (clearBtn) clearBtn.classList.remove('visible');
    updateAnswerKeyCounter();
  };

  function updateAnswerKeyCounter() {
    const listEl = document.getElementById('m-ak-questions-list');
    const badgeEl = document.getElementById('m-ak-count-badge');
    if (!listEl || !badgeEl) return;

    const total = listEl.querySelectorAll('.m-ak-row').length;
    const filled = listEl.querySelectorAll('.m-ak-opt-btn.active').length;
    badgeEl.textContent = `${filled} / ${total} Soru Tanımlandı`;
    if (filled === total) {
      badgeEl.style.color = 'var(--m-success)';
      badgeEl.style.background = 'rgba(16, 185, 129, 0.12)';
    } else {
      badgeEl.style.color = 'var(--m-primary)';
      badgeEl.style.background = 'var(--m-primary-light)';
    }
  }

  window.clearAllAnswerKey = function() {
    if (!confirm('Tüm cevap anahtarını temizlemek istediğinize emin misiniz?')) return;
    const listEl = document.getElementById('m-ak-questions-list');
    if (!listEl) return;
    listEl.querySelectorAll('.m-ak-opt-btn').forEach(b => b.classList.remove('active'));
    listEl.querySelectorAll('.m-ak-clear-btn').forEach(b => b.classList.remove('visible'));
    updateAnswerKeyCounter();
  };

  window.fillSampleAnswerKey = function() {
    const listEl = document.getElementById('m-ak-questions-list');
    if (!listEl || !activeExam) return;
    const choicesCount = parseInt(activeExam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);

    listEl.querySelectorAll('.m-ak-row').forEach((row, idx) => {
      const opt = letters[idx % letters.length];
      const q = idx + 1;
      window.selectAnswerKeyChoice(q, opt);
    });
    if (window.showMobileToast) window.showMobileToast('Örnek cevap anahtarı dolduruldu.');
  };

  window.saveAnswerKey = function() {
    if (!activeExam || !window.stateManager) return;
    const listEl = document.getElementById('m-ak-questions-list');
    if (!listEl) return;

    const answerKey = {};
    listEl.querySelectorAll('.m-ak-row').forEach(row => {
      const q = row.getAttribute('data-q');
      const activeBtn = row.querySelector('.m-ak-opt-btn.active');
      if (activeBtn) {
        answerKey[q] = activeBtn.getAttribute('data-opt');
      }
    });

    const state = window.stateManager.loadState ? window.stateManager.loadState() : (window.stateManager.state || {});
    const ex = (state.weeklyEvaluations || []).find(e => String(e.id) === String(activeExam.id));
    if (ex) {
      ex.answerKey = answerKey;
      window.stateManager.saveState(state);
      activeExam.answerKey = answerKey;
    }

    const modal = document.getElementById('modal-mobile-answer-key');
    if (modal) modal.classList.remove('active');

    const filledCount = Object.keys(answerKey).length;
    if (window.showMobileToast) {
      window.showMobileToast(`✅ Cevap anahtarı kaydedildi (${filledCount} soru).`);
    }
    if (window.vibrate) window.vibrate(30);

    // Eğer sınav not giriş modalı açıksa güncelle
    if (window.openWeeklyGradingModal) {
      window.openWeeklyGradingModal(activeExam.id);
    }
  };

  window.closeAnswerKeyModal = function() {
    const modal = document.getElementById('modal-mobile-answer-key');
    if (modal) modal.classList.remove('active');
  };

  // ==========================================================================
  // 2. STANDART 4 KÖŞE REFERANSLI OPTİK FORM YAZDIRMA (A4 PDF)
  // ==========================================================================

  window.openMobileOpticalPrintModal = function(examId) {
    if (!window.stateManager) return;
    const state = window.stateManager.loadState ? window.stateManager.loadState() : (window.stateManager.state || {});
    const exam = (state.weeklyEvaluations || []).find(e => String(e.id) === String(examId)) || window.activeWeeklyExam;
    if (!exam) {
      if (window.showMobileToast) window.showMobileToast('Sınav verisi bulunamadı!', 'error');
      return;
    }

    activeExam = exam;
    const modal = document.getElementById('modal-mobile-optical-print');
    if (!modal) return;

    const qInput = document.getElementById('m-opt-qcount');
    const cInput = document.getElementById('m-opt-choices');
    const typeSelect = document.getElementById('m-opt-type');
    const perPageSelect = document.getElementById('m-opt-perpage');

    if (qInput) qInput.value = exam.totalQuestions || 20;
    if (cInput) cInput.value = exam.choicesCount || 4;
    if (typeSelect) typeSelect.value = 'named';
    if (perPageSelect) perPageSelect.value = '2';

    renderOpticalPrintPreview();
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.classList.add('active');
    modal.classList.add('active');
    if (window.vibrate) window.vibrate(20);
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeMobileOpticalPrintModal = function() {
    const modal = document.getElementById('modal-mobile-optical-print');
    if (modal) modal.classList.remove('active');
    // Eğer altında sınav detay modalı açıksa backdrop'ı kapatma
    const gradingModal = document.getElementById('modal-weekly-exam-grading');
    const isGradingOpen = gradingModal && gradingModal.classList.contains('active');
    if (!isGradingOpen) {
      const backdrop = document.getElementById('sheet-backdrop');
      if (backdrop) backdrop.classList.remove('active');
    }
  };

  // ==========================================================================
  // ÖĞRENCİ OPTİK KİMLİK KODU (OPTICAL ID MATRIX) ENKODER & DEKODER
  // ==========================================================================
  // 5x5 Yüksek Kontrastlı Optik Matris (Köşe ve Merkez Referanslı, Parite Korumalı)
  function encodeStudentOpticalId(index) {
    const grid = Array(5).fill(0).map(() => Array(5).fill(0));
    
    // Sabit referans işaretleyicileri
    grid[0][0] = 1; grid[0][1] = 1;
    grid[1][0] = 1;
    grid[0][4] = 1;
    grid[4][0] = 1;
    grid[2][2] = 1; // Merkez sabitleyici
    grid[4][4] = 0; // Beyaz polarite köşesi

    // 7 veri biti (1..127 öğrenci sıra numarası)
    const bits = [];
    for (let i = 0; i < 7; i++) {
      bits.push((index >> i) & 1);
    }
    // 7 ters parite biti (gölge ve leke hatalarını %100 eleyen kontrol)
    const compBits = bits.map(b => 1 - b);

    // Kalan 14 hücre koordinatı
    const dataCoords = [
      [0, 2], [0, 3],
      [1, 1], [1, 2], [1, 3], [1, 4],
      [2, 0], [2, 1], [2, 3], [2, 4],
      [3, 0], [3, 1], [3, 2], [3, 3]
    ];

    for (let i = 0; i < 7; i++) {
      const [r, c] = dataCoords[i];
      grid[r][c] = bits[i];
    }
    for (let i = 0; i < 7; i++) {
      const [r, c] = dataCoords[i + 7];
      grid[r][c] = compBits[i];
    }

    return grid;
  }

  function decodeStudentOpticalId(grid) {
    if (!grid || grid.length !== 5) return null;

    // Sabit referansları doğrula
    if (grid[0][0] !== 1 || grid[0][1] !== 1 || grid[1][0] !== 1 ||
        grid[0][4] !== 1 || grid[4][0] !== 1 || grid[2][2] !== 1 || grid[4][4] !== 0) {
      return null;
    }

    const dataCoords = [
      [0, 2], [0, 3],
      [1, 1], [1, 2], [1, 3], [1, 4],
      [2, 0], [2, 1], [2, 3], [2, 4],
      [3, 0], [3, 1], [3, 2], [3, 3]
    ];

    const bits = [];
    for (let i = 0; i < 7; i++) {
      const [r, c] = dataCoords[i];
      bits.push(grid[r][c]);
    }

    // Parite kontrolü (Ters bitlerin tutarlılığı)
    for (let i = 0; i < 7; i++) {
      const [r, c] = dataCoords[i + 7];
      if (grid[r][c] !== (1 - bits[i])) {
        return null; // Parite uyuşmazlığı (Hatalı okuma)
      }
    }

    let index = 0;
    for (let i = 0; i < 7; i++) {
      if (bits[i]) index |= (1 << i);
    }

    return index > 0 ? index : null;
  }

  function generateOpticalIdSVG(studentIndex, size = 42) {
    if (!studentIndex || studentIndex <= 0) return '';
    const grid = encodeStudentOpticalId(studentIndex);
    const cellSize = (size / 5).toFixed(2);

    let rects = '';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid[r][c] === 1) {
          rects += `<rect x="${(c * (size / 5)).toFixed(1)}" y="${(r * (size / 5)).toFixed(1)}" width="${cellSize}" height="${cellSize}" fill="#000000" />`;
        }
      }
    }

    return `
      <div class="omr-id-badge" title="Öğrenci Optik Kimlik Kodu #${studentIndex}">
        <svg class="omr-id-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="#ffffff" stroke="#000000" stroke-width="1.5" />
          ${rects}
        </svg>
        <div class="omr-id-caption">ID:#${studentIndex}</div>
      </div>
    `;
  }

  window.renderOpticalPrintPreview = function() {
    const previewBox = document.getElementById('m-opt-preview-box');
    if (!previewBox || !activeExam) return;

    const qCount = parseInt(document.getElementById('m-opt-qcount').value, 10) || 20;
    const choicesCount = parseInt(document.getElementById('m-opt-choices').value, 10) || 4;
    const formType = document.getElementById('m-opt-type').value;
    const perPage = parseInt(document.getElementById('m-opt-perpage')?.value, 10) || 2;

    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
    const sampleStudents = [
      { name: 'Ahmet YILMAZ', no: '105' },
      { name: 'Ayşe DEMİR', no: '108' },
      { name: 'Mehmet ÇELİK', no: '112' },
      { name: 'Zeynep KAYA', no: '119' }
    ];

    let cardsHtml = '';
    for (let i = 0; i < perPage; i++) {
      const isNamed = formType === 'named';
      const sample = sampleStudents[i] || sampleStudents[0];
      const studentName = isNamed ? sample.name : '................................';
      const studentNo = isNamed ? sample.no : '......';

      cardsHtml += generateSingleOpticalCardHTML({
        examName: activeExam.examName || 'Haftalık Değerlendirme',
        studentName: studentName,
        studentNo: studentNo,
        totalQuestions: qCount,
        letters: letters,
        studentIndex: isNamed ? (i + 1) : 0,
        isSample: true,
        perPage: perPage
      });
    }

    previewBox.innerHTML = `
      <div class="omr-preview-sheet omr-preview-per-page-${perPage}">
        ${cardsHtml}
      </div>
    `;
  };

  function generateSingleOpticalCardHTML(options) {
    const { examName, studentName, studentNo, totalQuestions, letters, studentIndex, isSample, perPage = 2 } = options;

    const cols = totalQuestions <= 15 ? 1 : (totalQuestions <= 30 ? 2 : 3);
    const questionsPerCol = Math.ceil(totalQuestions / cols);

    let columnsHtml = '';
    for (let c = 0; c < cols; c++) {
      const startQ = c * questionsPerCol + 1;
      const endQ = Math.min((c + 1) * questionsPerCol, totalQuestions);

      let colRows = '';
      for (let q = startQ; q <= endQ; q++) {
        colRows += `
          <div class="omr-q-row">
            <span class="omr-q-num">${q}</span>
            <div class="omr-q-bubbles">
              ${letters.map(l => `<span class="omr-bubble">${l}</span>`).join('')}
            </div>
          </div>
        `;
      }

      columnsHtml += `
        <div class="omr-grid-col">
          ${colRows}
        </div>
      `;
    }

    const hasIdBadge = (studentIndex && studentIndex > 0) || isSample;
    const badgeSize = perPage === 4 ? 26 : (perPage === 1 ? 44 : 38);
    const idBadgeHtml = hasIdBadge ? generateOpticalIdSVG(isSample ? 1 : studentIndex, badgeSize) : '';

    return `
      <div class="omr-card ${isSample ? 'omr-card-sample' : ''} ${perPage === 4 ? 'omr-card-compact' : ''}">
        <!-- 4 Siyah Referans Köşe İşaretleyicisi (OMR Çevrim Dışı Hizalama) -->
        <div class="omr-anchor omr-anchor-tl"></div>
        <div class="omr-anchor omr-anchor-tr"></div>
        <div class="omr-anchor omr-anchor-bl"></div>
        <div class="omr-anchor omr-anchor-br"></div>

        <!-- Üst Başlık Bilgisi ve Öğrenci Optik Kimlik Bloğu -->
        <div class="omr-card-header">
          <div class="omr-header-main">
            <div class="omr-header-title">${escapeHTML(examName)}</div>
            <div class="omr-student-info">
              <div class="omr-info-item"><strong>Öğrenci:</strong> ${escapeHTML(studentName)}</div>
              <div class="omr-info-item"><strong>No:</strong> ${escapeHTML(studentNo)}</div>
            </div>
          </div>
          ${idBadgeHtml}
        </div>

        <!-- Soru ve Şık Baloncukları Alanı -->
        <div class="omr-card-body">
          <div class="omr-grid-container">
            ${columnsHtml}
          </div>
        </div>

        <div class="omr-card-footer">
          <span>Sınıf Asistanı Optik Değerlendirme Formu</span>
          <span style="font-family: monospace;">OMR-STD-${totalQuestions}Q</span>
        </div>
      </div>
    `;
  }

  window.printMobileOpticalForms = function() {
    if (!activeExam) {
      if (window.activeWeeklyExam) {
        activeExam = window.activeWeeklyExam;
      } else if (window.stateManager) {
        const state = window.stateManager.loadState ? window.stateManager.loadState() : (window.stateManager.state || {});
        activeExam = (state.weeklyEvaluations || [])[0] || null;
      }
    }

    if (!activeExam || !window.stateManager) {
      if (window.showMobileToast) window.showMobileToast('Yazdırılacak sınav bulunamadı!', 'error');
      return;
    }
    const state = window.stateManager.loadState ? window.stateManager.loadState() : (window.stateManager.state || {});

    const qCount = parseInt(document.getElementById('m-opt-qcount')?.value, 10) || activeExam.totalQuestions || 20;
    const choicesCount = parseInt(document.getElementById('m-opt-choices')?.value, 10) || activeExam.choicesCount || 4;
    const formType = document.getElementById('m-opt-type')?.value || 'named';
    const perPage = parseInt(document.getElementById('m-opt-perpage')?.value, 10) || 2;

    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);

    let studentsList = [];
    if (formType === 'named') {
      const isMiddle = window.isMiddleSchool ? window.isMiddleSchool() : false;
      studentsList = (state.students || []).filter(s => {
        if (window.isStudentInCurrentLevel && !window.isStudentInCurrentLevel(s)) return false;
        if (isMiddle && activeExam.branch && s.branch !== activeExam.branch) return false;
        return true;
      }).sort((a, b) => {
        const noA = parseInt(a.number, 10) || 0;
        const noB = parseInt(b.number, 10) || 0;
        if (noA && noB && noA !== noB) return noA - noB;
        return (a.name || '').localeCompare(b.name || '', 'tr');
      });

      if (studentsList.length === 0) {
        if (window.showMobileToast) {
          window.showMobileToast('Bu kademede öğrenci bulunamadı, boş formlar hazırlanıyor...', 'warning');
        }
        const count = perPage === 4 ? 32 : (perPage === 2 ? 30 : 20);
        for (let i = 1; i <= count; i++) {
          studentsList.push({ name: '................................', surname: '', number: '......' });
        }
      }
    } else {
      // Boş formlar: Sayfaları tam dolduracak miktarda oluştur
      const count = perPage === 4 ? 32 : (perPage === 2 ? 30 : 20);
      for (let i = 1; i <= count; i++) {
        studentsList.push({ name: '................................', surname: '', number: '......' });
      }
    }

    // Sayfalara tam doldurarak böl (Her sayfada 1, 2 veya 4 form)
    let pagesHtml = '';
    for (let p = 0; p < studentsList.length; p += perPage) {
      const pageStudents = studentsList.slice(p, p + perPage);
      let pageCardsHtml = '';

      pageStudents.forEach((st, idxInPage) => {
        const globalIdx = p + idxInPage;
        pageCardsHtml += generateSingleOpticalCardHTML({
          examName: activeExam.examName || 'Haftalık Değerlendirme',
          studentName: `${st.name} ${st.surname || ''}`.trim(),
          studentNo: st.number || '-',
          totalQuestions: qCount,
          letters: letters,
          studentIndex: formType === 'named' ? (globalIdx + 1) : 0,
          isSample: false,
          perPage: perPage
        });
      });

      pagesHtml += `<div class="omr-print-page omr-per-page-${perPage}">${pageCardsHtml}</div>`;
    }

    if (window.showMobileToast) {
      window.showMobileToast('Yazdırma ve PDF penceresi açılıyor...', 'info', 2500);
    }
    if (window.vibrate) window.vibrate(30);

    const cleanTitle = (activeExam.examName || 'Optik_Form').replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
    const docTitle = `${cleanTitle}_${formType === 'named' ? 'Ogrenci_Listeli' : 'Bos'}`;

    const fullPrintHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
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
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      width: 100%;
      height: 285mm;
      max-height: 285mm;
      box-sizing: border-box;
      padding: 2mm;
      margin: 0;
      background: #ffffff;
    }
    .omr-print-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    /* 1 Form / A4 (Geniş) */
    .omr-print-page.omr-per-page-1 {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .omr-print-page.omr-per-page-1 .omr-card {
      height: 275mm;
      max-width: 100%;
      margin: 0 auto;
      padding: 16px 20px;
    }
    /* 2 Form / A4 (Önerilen) */
    .omr-print-page.omr-per-page-2 {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .omr-print-page.omr-per-page-2 .omr-card {
      height: 138mm;
      max-height: 139mm;
      max-width: 100%;
      margin: 0;
      padding: 10px 14px;
    }
    /* 4 Form / A4 (Tasarruflu) */
    .omr-print-page.omr-per-page-4 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 139mm 139mm;
      gap: 3mm;
    }
    .omr-print-page.omr-per-page-4 .omr-card {
      height: 139mm;
      max-height: 139mm;
      max-width: 100%;
      margin: 0;
      padding: 6px 8px;
    }
    /* Kart Genel Yapısı */
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
    }
    .omr-anchor {
      position: absolute;
      width: 18px;
      height: 18px;
      background-color: #000000 !important;
      z-index: 5;
    }
    .omr-anchor-tl { top: 6px; left: 6px; }
    .omr-anchor-tr { top: 6px; right: 6px; }
    .omr-anchor-bl { bottom: 6px; left: 6px; }
    .omr-anchor-br { bottom: 6px; right: 6px; }
    .omr-card-header {
      margin: 2px 24px 4px 24px;
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
      gap: 12px;
      margin-top: 3px;
      font-size: 0.76rem;
      color: #000000;
      font-weight: 600;
    }
    .omr-id-badge {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
    }
    .omr-id-svg {
      display: block;
    }
    .omr-id-caption {
      font-size: 0.56rem;
      font-weight: 800;
      font-family: monospace;
      color: #000000;
      line-height: 1;
      margin-top: 1px;
    }
    .omr-card-body {
      margin: 4px 12px;
      flex: 1;
      display: flex;
      align-items: center;
    }
    .omr-grid-container {
      width: 100%;
      display: flex;
      justify-content: space-around;
      gap: 10px;
    }
    .omr-grid-col {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .omr-q-row {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .omr-q-num {
      width: 20px;
      font-size: 0.74rem;
      font-weight: 800;
      text-align: right;
      color: #000000;
    }
    .omr-q-bubbles {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .omr-bubble {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1.5px solid #000000 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-size: 0.66rem;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
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

    /* 4-per-page (Tasarruflu) özel kompakt düzeni */
    .omr-per-page-4 .omr-anchor {
      width: 13px !important;
      height: 13px !important;
    }
    .omr-per-page-4 .omr-anchor-tl { top: 4px !important; left: 4px !important; }
    .omr-per-page-4 .omr-anchor-tr { top: 4px !important; right: 4px !important; }
    .omr-per-page-4 .omr-anchor-bl { bottom: 4px !important; left: 4px !important; }
    .omr-per-page-4 .omr-anchor-br { bottom: 4px !important; right: 4px !important; }
    .omr-per-page-4 .omr-card-header {
      margin: 2px 14px 3px 14px !important;
      padding-bottom: 2px !important;
    }
    .omr-per-page-4 .omr-header-title {
      font-size: 0.72rem !important;
    }
    .omr-per-page-4 .omr-student-info {
      font-size: 0.64rem !important;
      gap: 6px !important;
    }
    .omr-per-page-4 .omr-id-badge {
      transform: scale(0.75) !important;
      transform-origin: right center !important;
    }
    .omr-per-page-4 .omr-card-body {
      margin: 2px 8px !important;
    }
    .omr-per-page-4 .omr-grid-container {
      gap: 4px !important;
    }
    .omr-per-page-4 .omr-grid-col {
      gap: 2px !important;
    }
    .omr-per-page-4 .omr-q-row {
      gap: 3px !important;
    }
    .omr-per-page-4 .omr-q-num {
      width: 15px !important;
      font-size: 0.62rem !important;
    }
    .omr-per-page-4 .omr-q-bubbles {
      gap: 3px !important;
    }
    .omr-per-page-4 .omr-bubble {
      width: 14px !important;
      height: 14px !important;
      font-size: 0.54rem !important;
      border: 1.2px solid #000000 !important;
    }
    .omr-per-page-4 .omr-card-footer {
      margin: 2px 14px 1px 14px !important;
      font-size: 0.54rem !important;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;

    if (window.AndroidBridge && typeof window.AndroidBridge.printHtml === 'function') {
      window.AndroidBridge.printHtml(fullPrintHtml, docTitle);
    } else {
      let printFrame = document.getElementById('omr-print-iframe');
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'omr-print-iframe';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);
      }
      const doc = printFrame.contentDocument || printFrame.contentWindow.document;
      doc.open();
      doc.write(fullPrintHtml);
      doc.close();

      setTimeout(() => {
        try {
          if (printFrame.contentWindow) {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
          }
        } catch (e) {
          window.print();
        }
      }, 350);
    }
  };

  // ==========================================================================
  // 3. %100 ÇEVRİM DIŞI OPTİK OKUMA & GÖRÜNTÜ İŞLEME MOTORU (OMR ENGINE)
  // ==========================================================================

  window.openMobileOmrScanner = function(examId) {
    if (!window.stateManager) return;
    const state = window.stateManager.loadState ? window.stateManager.loadState() : (window.stateManager.state || {});
    const exam = (state.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
    if (!exam) return;

    activeExam = exam;
    if (window.vibrate) window.vibrate(25);

    const modal = document.getElementById('modal-mobile-omr-scanner');
    const titleEl = document.getElementById('m-omr-exam-title');
    const keyStatusEl = document.getElementById('m-omr-key-status');

    if (!modal) return;

    if (titleEl) titleEl.textContent = exam.examName || 'Optik Okuma';

    // Cevap anahtarı kontrolü
    const keyCount = Object.keys(exam.answerKey || {}).length;
    if (keyStatusEl) {
      if (keyCount === 0) {
        keyStatusEl.innerHTML = '<span style="color: #ef4444; font-weight: 700;">⚠️ Cevap Anahtarı Girilmemiş! (Notlar hesaplanamaz)</span>';
      } else {
        keyStatusEl.innerHTML = `<span style="color: #10b981; font-weight: 700;">✓ Cevap Anahtarı Hazır (${keyCount}/${exam.totalQuestions} Soru)</span>`;
      }
    }

    modal.classList.add('active');
    startCameraStream();
  };

  window.closeMobileOmrScanner = function() {
    stopCameraStream();
    const modal = document.getElementById('modal-mobile-omr-scanner');
    if (modal) modal.classList.remove('active');
    hideVerificationSheet();
  };

  function startCameraStream() {
    const video = document.getElementById('m-omr-video');
    if (!video || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

    if (window.AndroidBridge && typeof window.AndroidBridge.requestCameraPermission === 'function') {
      window.AndroidBridge.requestCameraPermission();
    }

    const tryGetUserMedia = (constraints) => {
      return navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          activeMediaStream = stream;
          video.srcObject = stream;
          video.setAttribute('playsinline', '');
          video.setAttribute('autoplay', '');
          video.muted = true;
          return video.play().catch(e => {
            console.log('Video play catch:', e);
          });
        });
    };

    // 1. Öncelik: Arka kamera (environment) ile 1080p
    tryGetUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    }).catch(() => {
      // 2. Öncelik: Arka kamera (environment) standart
      return tryGetUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
    }).catch(() => {
      // 3. Öncelik: Genel video akışı
      return tryGetUserMedia({
        video: true,
        audio: false
      });
    }).catch(err => {
      console.warn('Kamera akışı açılamadı:', err);
      if (window.showMobileToast) {
        window.showMobileToast('Kamera başlatılamadı. İzin verin veya "HD Çek" butonunu kullanın.', 'warning', 4000);
      }
    });
  }

  function stopCameraStream() {
    if (activeMediaStream) {
      activeMediaStream.getTracks().forEach(t => t.stop());
      activeMediaStream = null;
    }
    const video = document.getElementById('m-omr-video');
    if (video) video.srcObject = null;
  }

  // Canlı video akışından anlık görüntü yakala
  window.captureFromVideo = function() {
    const video = document.getElementById('m-omr-video');
    if (window.vibrate) window.vibrate(20);

    if (video && video.videoWidth > 0 && activeMediaStream && !video.paused) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      processCapturedImage(canvas);
    } else {
      // Eğer canlı akış henüz hazır değilse
      if (window.showMobileToast) {
        window.showMobileToast('Kamera açılıyor... Net çekim için kamera uygulaması başlatılıyor.', 'info', 2000);
      }
      window.triggerNativeCameraCapture();
    }
  };

  // Android yerel kamera uygulamasını aç (Yüksek çözünürlük & net odak)
  window.triggerNativeCameraCapture = function() {
    const cameraInput = document.getElementById('m-omr-native-camera-input');
    if (cameraInput) {
      cameraInput.value = '';
      cameraInput.click();
    } else {
      const fileInput = document.getElementById('m-omr-file-input');
      if (fileInput) {
        fileInput.value = '';
        fileInput.click();
      }
    }
  };

  window.onOmrFileSelected = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        processCapturedImage(img);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ==========================================================================
  // GÖRÜNTÜ İŞLEME & BALONCUK ÇÖZÜMLEME (PURE JS ALGORİTMA)
  // ==========================================================================

  function processCapturedImage(sourceElement) {
    if (!activeExam) return;

    if (window.showMobileToast) {
      window.showMobileToast('🔍 Optik form taranıyor...');
    }

    setTimeout(() => {
      try {
        const result = runPureJsOmrScan(sourceElement, activeExam);
        if (result && result.success) {
          lastScannedResult = result;
          if (window.vibrate) window.vibrate(40);
          showVerificationSheet(result);
        } else {
          alert('Optik form algılanamadı. Lütfen formun tamamını kameranın çerçevesine ortalayarak net bir şekilde tekrar çekin.');
        }
      } catch (err) {
        console.error('OMR Tarama hatası:', err);
        alert('Tarama sırasında bir hata oluştu: ' + (err.message || err));
      }
    }, 50);
  }

  /**
   * Tamamen istemci taraflı, 0 harici kütüphane OMR okuyucu motor
   */
  function runPureJsOmrScan(sourceElement, exam) {
    // 1. Resmi standart analiz tuvaline çiz
    const srcW = sourceElement.width || sourceElement.videoWidth;
    const srcH = sourceElement.height || sourceElement.videoHeight;
    if (!srcW || !srcH) return { success: false, error: 'Görsel boyutu geçersiz' };

    const canvas = document.createElement('canvas');
    const MAX_DIM = 1200;
    let targetW = srcW;
    let targetH = srcH;
    if (targetW > MAX_DIM || targetH > MAX_DIM) {
      if (targetW > targetH) {
        targetH = Math.round((targetH * MAX_DIM) / targetW);
        targetW = MAX_DIM;
      } else {
        targetW = Math.round((targetW * MAX_DIM) / targetH);
        targetH = MAX_DIM;
      }
    }
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceElement, 0, 0, targetW, targetH);

    // 2. Gri Tonlama ve Adaptif Binarizasyon
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;
    const totalPixels = targetW * targetH;
    const gray = new Uint8Array(totalPixels);

    let sumLum = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      // Y = 0.299R + 0.587G + 0.114B
      const lum = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
      gray[p] = lum;
      sumLum += lum;
    }
    const avgLum = sumLum / totalPixels;
    // Dinamik siyah eşik (Ortalamanın %72'si veya 115)
    const threshold = Math.max(70, Math.min(135, avgLum * 0.75));

    // 3. 4 Köşe İşaretleyicisini (Anchor) Tespit Et
    // 4 kadranda (Sol-Üst, Sağ-Üst, Sol-Alt, Sağ-Alt) en koyu yoğun kareleri ara
    const corners = detectCornerAnchors(gray, targetW, targetH, threshold);

    // 3.5. Öğrenci Optik Kimlik Kodunu (Optical ID Matrix) Otomatik Çözümle
    const detectedStudentIndex = scanStudentOpticalId(gray, targetW, targetH, threshold, corners);
    let identifiedStudent = null;

    if (detectedStudentIndex && detectedStudentIndex > 0) {
      const state = window.stateManager ? window.stateManager.loadState() : {};
      const isMiddle = window.isMiddleSchool ? window.isMiddleSchool() : false;
      const students = (state.students || []).filter(s => {
        if (window.isStudentInCurrentLevel && !window.isStudentInCurrentLevel(s)) return false;
        if (isMiddle && exam.branch && s.branch !== exam.branch) return false;
        return true;
      }).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

      if (detectedStudentIndex <= students.length) {
        identifiedStudent = students[detectedStudentIndex - 1];
      }
    }

    // 4. Baloncuk Grid Koordinatlarını Belirle (Bilinear Quad Mapping)
    const qCount = parseInt(exam.totalQuestions, 10) || 20;
    const choicesCount = parseInt(exam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);

    const cols = qCount <= 15 ? 1 : (qCount <= 30 ? 2 : 3);
    const questionsPerCol = Math.ceil(qCount / cols);

    const detectedAnswers = {};
    const questionDetails = [];

    // Form üzerindeki bağıl alanlar: X: %6 - %94, Y: %24 - %92
    const gridLeft = 0.08;
    const gridRight = 0.92;
    const gridTop = 0.26;
    const gridBottom = 0.92;

    const colWidth = (gridRight - gridLeft) / cols;
    const rowHeight = (gridBottom - gridTop) / questionsPerCol;

    for (let c = 0; c < cols; c++) {
      const startQ = c * questionsPerCol + 1;
      const endQ = Math.min((c + 1) * questionsPerCol, qCount);

      const colUStart = gridLeft + c * colWidth;
      const colUEnd = colUStart + colWidth;

      for (let q = startQ; q <= endQ; q++) {
        const rowIdx = q - startQ;
        const rowV = gridTop + (rowIdx + 0.5) * rowHeight;

        // Her bir şık için doluluk oranını ölç
        const choiceScores = [];

        for (let lIdx = 0; lIdx < letters.length; lIdx++) {
          const letter = letters[lIdx];
          // Soru numarası için %25 yer ayır, kalan %75 şıklara paylaştır
          const choiceU = colUStart + colWidth * (0.28 + (lIdx * 0.72) / letters.length);

          // Bilinear Interpolasyon ile orijinal koordinatı bul
          const pt = mapUnitToQuad(choiceU, rowV, corners);

          // Bu koordinat etrafındaki daire alanının siyahlık doluluğunu hesapla
          const sampleRadius = Math.max(6, Math.min(16, Math.round(targetW * 0.016)));
          const fillRatio = measureBubbleFill(gray, targetW, targetH, pt.x, pt.y, sampleRadius, threshold);

          choiceScores.push({ letter, fillRatio, pt });
        }

        // Skorları sırala
        choiceScores.sort((a, b) => b.fillRatio - a.fillRatio);

        const best = choiceScores[0];
        const second = choiceScores[1] || { fillRatio: 0 };

        let markedLetter = '';
        let status = 'blank';

        // İşaretlenme Kriteri: En az %30 siyah piksel ve ikinci şıktan en az %12 daha koyu
        if (best.fillRatio >= 0.28) {
          if (second.fillRatio >= 0.26 && (best.fillRatio - second.fillRatio) < 0.10) {
            status = 'multiple'; // Çift işaretli
          } else {
            status = 'marked';
            markedLetter = best.letter;
          }
        }

        detectedAnswers[q] = markedLetter;
        questionDetails.push({
          q,
          marked: markedLetter,
          status,
          scores: choiceScores
        });
      }
    }

    // 5. Cevap Anahtarıyla Karşılaştır ve Puanla
    const answerKey = exam.answerKey || {};
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;

    questionDetails.forEach(qd => {
      const correctAns = answerKey[qd.q] || '';
      if (!qd.marked) {
        blankCount++;
        qd.isCorrect = false;
        qd.isBlank = true;
      } else if (correctAns && qd.marked === correctAns) {
        correctCount++;
        qd.isCorrect = true;
      } else {
        wrongCount++;
        qd.isCorrect = false;
      }
      qd.keyAnswer = correctAns;
    });

    const penaltyRate = exam.wrongAffects ? (parseFloat(exam.penaltyRate) || 3) : 0;
    let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
    net = Math.max(0, parseFloat(net.toFixed(2)));

    const score = qCount > 0 ? Math.round((net / qCount) * 100) : 0;

    return {
      success: true,
      examId: exam.id,
      detectedStudentIndex,
      identifiedStudent,
      totalQuestions: qCount,
      answers: detectedAnswers,
      questionDetails,
      correctCount,
      wrongCount,
      blankCount,
      net,
      score,
      capturedCanvas: canvas
    };
  }

  // 5x5 Öğrenci Optik Kimlik Matrisini Form Üzerinden Tara
  function scanStudentOpticalId(gray, w, h, threshold, corners) {
    const uMin = 0.77;
    const uMax = 0.94;
    const vMin = 0.04;
    const vMax = 0.19;

    const sampleRadius = Math.max(3, Math.round(w * 0.007));
    const measuredGrid = [];

    for (let r = 0; r < 5; r++) {
      const row = [];
      const cellV = vMin + (r + 0.5) * (vMax - vMin) / 5;
      for (let c = 0; c < 5; c++) {
        const cellU = uMin + (c + 0.5) * (uMax - uMin) / 5;
        const pt = mapUnitToQuad(cellU, cellV, corners);
        const fillRatio = measureBubbleFill(gray, w, h, pt.x, pt.y, sampleRadius, threshold);
        row.push(fillRatio >= 0.35 ? 1 : 0);
      }
      measuredGrid.push(row);
    }

    return decodeStudentOpticalId(measuredGrid);
  }

  // 4 Köşe İşaretleyicisi Tespiti
  function detectCornerAnchors(gray, w, h, threshold) {
    const marginX = Math.round(w * 0.15);
    const marginY = Math.round(h * 0.15);

    // Varsayılan köşe noktaları (Kılavuz çerçeve koordinatları)
    const corners = {
      tl: { x: Math.round(w * 0.05), y: Math.round(h * 0.04) },
      tr: { x: Math.round(w * 0.95), y: Math.round(h * 0.04) },
      br: { x: Math.round(w * 0.95), y: Math.round(h * 0.96) },
      bl: { x: Math.round(w * 0.05), y: Math.round(h * 0.96) }
    };

    // Sol-Üst kadranda en koyu kareyi ara
    const tlFound = findDarkSquareBlob(gray, w, h, 0, marginX, 0, marginY, threshold);
    if (tlFound) corners.tl = tlFound;

    // Sağ-Üst
    const trFound = findDarkSquareBlob(gray, w, h, w - marginX, w, 0, marginY, threshold);
    if (trFound) corners.tr = trFound;

    // Sağ-Alt
    const brFound = findDarkSquareBlob(gray, w, h, w - marginX, w, h - marginY, h, threshold);
    if (brFound) corners.br = brFound;

    // Sol-Alt
    const blFound = findDarkSquareBlob(gray, w, h, 0, marginX, h - marginY, h, threshold);
    if (blFound) corners.bl = blFound;

    return corners;
  }

  // Bölgedeki en koyu ve kompakt kare bloğu bul
  function findDarkSquareBlob(gray, w, h, minX, maxX, minY, maxY, threshold) {
    let bestX = 0, bestY = 0;
    let maxDarkCount = 0;
    const boxSize = Math.max(10, Math.round(w * 0.022));

    const step = Math.max(2, Math.floor(boxSize / 4));
    for (let y = minY; y <= maxY - boxSize; y += step) {
      for (let x = minX; x <= maxX - boxSize; x += step) {
        let darkCount = 0;
        for (let dy = 0; dy < boxSize; dy += 2) {
          for (let dx = 0; dx < boxSize; dx += 2) {
            const idx = (y + dy) * w + (x + dx);
            if (gray[idx] < threshold) {
              darkCount++;
            }
          }
        }
        if (darkCount > maxDarkCount) {
          maxDarkCount = darkCount;
          bestX = x + (boxSize >> 1);
          bestY = y + (boxSize >> 1);
        }
      }
    }

    const minRequired = (boxSize * boxSize) * 0.15;
    if (maxDarkCount >= minRequired) {
      return { x: bestX, y: bestY };
    }
    return null;
  }

  // 4 Noktalı Bilinear Quad Interpolasyonu
  function mapUnitToQuad(u, v, corners) {
    const { tl, tr, br, bl } = corners;
    const x = (1 - u) * (1 - v) * tl.x + u * (1 - v) * tr.x + u * v * br.x + (1 - u) * v * bl.x;
    const y = (1 - u) * (1 - v) * tl.y + u * (1 - v) * tr.y + u * v * br.y + (1 - u) * v * bl.y;
    return { x: Math.round(x), y: Math.round(y) };
  }

  // Baloncuğun doluluk oranını ölç
  function measureBubbleFill(gray, w, h, cx, cy, radius, threshold) {
    let totalSampled = 0;
    let darkSampled = 0;

    const r2 = radius * radius;
    const innerR2 = Math.round(r2 * 0.65); // Çerçeve kenarını değil, baloncuğun iç göbeğini ölç

    for (let dy = -radius; dy <= radius; dy++) {
      const y = cy + dy;
      if (y < 0 || y >= h) continue;

      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= w) continue;

        const dist2 = dx * dx + dy * dy;
        if (dist2 <= innerR2) {
          totalSampled++;
          const lum = gray[y * w + x];
          if (lum < threshold) {
            darkSampled++;
          }
        }
      }
    }

    return totalSampled > 0 ? (darkSampled / totalSampled) : 0;
  }

  // ==========================================================================
  // 4. ANINDA SONUÇ DOĞRULAMA VE SERİ NOT KAYIT ARAYÜZÜ
  // ==========================================================================

  function showVerificationSheet(result) {
    const sheet = document.getElementById('m-omr-verification-sheet');
    if (!sheet || !activeExam) return;

    // Öğrenci Listesini Doldur
    const state = window.stateManager ? window.stateManager.loadState() : {};
    const isMiddle = window.isMiddleSchool ? window.isMiddleSchool() : false;
    const students = (state.students || []).filter(s => {
      if (window.isStudentInCurrentLevel && !window.isStudentInCurrentLevel(s)) return false;
      if (isMiddle && activeExam.branch && s.branch !== activeExam.branch) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    const studentSelect = document.getElementById('m-omr-student-select');
    if (studentSelect) {
      studentSelect.innerHTML = students.map(s => `
        <option value="${s.id}">${escapeHTML(s.name)} ${escapeHTML(s.surname || '')} (No: ${s.number || '-'})</option>
      `).join('');

      const bannerEl = document.getElementById('m-omr-auto-match-banner');
      const bannerText = document.getElementById('m-omr-auto-match-text');

      // Eğer optik form üzerindeki Öğrenci Kimlik Kodu otomatik çözülmüşse
      if (result.identifiedStudent) {
        studentSelect.value = result.identifiedStudent.id;
        if (bannerEl && bannerText) {
          bannerText.textContent = `🎯 Optik Kod ile Otomatik Tanındı: ${escapeHTML(result.identifiedStudent.name)} ${escapeHTML(result.identifiedStudent.surname || '')} (No: ${result.identifiedStudent.number || '-'}, ID: #${result.detectedStudentIndex})`;
          bannerEl.style.display = 'flex';
        }
        if (window.showMobileToast) {
          window.showMobileToast(`🎯 Öğrenci Tanındı: ${result.identifiedStudent.name} (No: ${result.identifiedStudent.number || '-'})`);
        }
      } else {
        if (bannerEl) bannerEl.style.display = 'none';
        // Sıradaki not girilmemiş ilk öğrenciyi otomatik seç
        const examScores = activeExam.examScores || {};
        const unassignedStudent = students.find(s => examScores[s.id] === undefined || examScores[s.id] === null || examScores[s.id] === '');
        if (unassignedStudent) {
          studentSelect.value = unassignedStudent.id;
        }
      }
    }

    // Skor ve İstatistikler
    const scoreValEl = document.getElementById('m-omr-res-score');
    const netValEl = document.getElementById('m-omr-res-net');
    const dybValEl = document.getElementById('m-omr-res-dyb');

    if (scoreValEl) scoreValEl.textContent = result.score;
    if (netValEl) netValEl.textContent = result.net;
    if (dybValEl) dybValEl.textContent = `${result.correctCount} D • ${result.wrongCount} Y • ${result.blankCount} B`;

    // Soru Soru Cevapları Listele (Öğretmen düzenleyebilir)
    const reviewList = document.getElementById('m-omr-review-list');
    if (reviewList) {
      reviewList.innerHTML = result.questionDetails.map(qd => {
        let badgeClass = 'badge-blank';
        let badgeIcon = '⚪';
        if (qd.isCorrect) {
          badgeClass = 'badge-correct';
          badgeIcon = '✓';
        } else if (qd.marked) {
          badgeClass = 'badge-wrong';
          badgeIcon = '✗';
        }

        return `
          <div class="m-omr-review-item ${badgeClass}" id="m-omr-qitem-${qd.q}">
            <div class="m-omr-review-qnum">${qd.q}.</div>
            <div class="m-omr-review-marked">
              <strong>${qd.marked || 'Boş'}</strong> ${badgeIcon}
            </div>
            <div class="m-omr-review-key">
              ${qd.keyAnswer ? `(Cvp: ${qd.keyAnswer})` : ''}
            </div>
            <div class="m-omr-review-quick-edit">
              ${['A', 'B', 'C', 'D'].map(l => `
                <button type="button" class="m-omr-inline-btn ${qd.marked === l ? 'active' : ''}" onclick="window.overrideOmrQuestionAnswer(${qd.q}, '${l}')">
                  ${l}
                </button>
              `).join('')}
              <button type="button" class="m-omr-inline-btn ${!qd.marked ? 'active' : ''}" onclick="window.overrideOmrQuestionAnswer(${qd.q}, '')">
                -
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    sheet.classList.add('active');
  }

  function hideVerificationSheet() {
    const sheet = document.getElementById('m-omr-verification-sheet');
    if (sheet) sheet.classList.remove('active');
  }
  window.hideVerificationSheet = hideVerificationSheet;
  window.closeVerificationSheet = hideVerificationSheet;

  window.overrideOmrQuestionAnswer = function(q, newLetter) {
    if (!lastScannedResult || !activeExam) return;
    const qd = lastScannedResult.questionDetails.find(item => item.q === q);
    if (!qd) return;

    qd.marked = newLetter;
    lastScannedResult.answers[q] = newLetter;

    // Tekrar puanla
    const answerKey = activeExam.answerKey || {};
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;

    lastScannedResult.questionDetails.forEach(item => {
      const correctAns = answerKey[item.q] || '';
      if (!item.marked) {
        blankCount++;
        item.isCorrect = false;
        item.isBlank = true;
      } else if (correctAns && item.marked === correctAns) {
        correctCount++;
        item.isCorrect = true;
        item.isBlank = false;
      } else {
        wrongCount++;
        item.isCorrect = false;
        item.isBlank = false;
      }
    });

    const penaltyRate = activeExam.wrongAffects ? (parseFloat(activeExam.penaltyRate) || 3) : 0;
    let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
    net = Math.max(0, parseFloat(net.toFixed(2)));
    const score = lastScannedResult.totalQuestions > 0 ? Math.round((net / lastScannedResult.totalQuestions) * 100) : 0;

    lastScannedResult.correctCount = correctCount;
    lastScannedResult.wrongCount = wrongCount;
    lastScannedResult.blankCount = blankCount;
    lastScannedResult.net = net;
    lastScannedResult.score = score;

    showVerificationSheet(lastScannedResult);
    if (window.vibrate) window.vibrate(15);
  };

  // Sonucu Öğrenciye Kaydet ve Sıradakine Geç
  window.saveOmrResultAndNext = function() {
    if (!activeExam || !lastScannedResult || !window.stateManager) return;
    const studentSelect = document.getElementById('m-omr-student-select');
    const studentId = studentSelect ? studentSelect.value : '';
    if (!studentId) {
      alert('Lütfen bir öğrenci seçin.');
      return;
    }

    const state = window.stateManager.loadState ? window.stateManager.loadState() : (window.stateManager.state || {});
    const exam = (state.weeklyEvaluations || []).find(e => String(e.id) === String(activeExam.id));
    if (!exam) return;

    if (!exam.examScores) exam.examScores = {};
    if (!exam.studentResults) exam.studentResults = {};

    exam.examScores[studentId] = lastScannedResult.score;
    exam.studentResults[studentId] = {
      correct: lastScannedResult.correctCount,
      wrong: lastScannedResult.wrongCount,
      blank: lastScannedResult.blankCount,
      net: lastScannedResult.net,
      score: lastScannedResult.score,
      answers: { ...lastScannedResult.answers },
      source: 'optical',
      scannedAt: new Date().toISOString()
    };

    if (window.stateManager.saveExam) {
      window.stateManager.saveExam(exam);
    } else {
      window.stateManager.saveState(state);
    }
    activeExam = exam;

    const student = (state.students || []).find(s => String(s.id) === String(studentId));
    const stdName = student ? `${student.name} ${student.surname || ''}` : 'Öğrenci';

    if (window.showMobileToast) {
      window.showMobileToast(`✅ ${stdName} için ${lastScannedResult.score} Puan kaydedildi.`);
    }
    if (window.vibrate) window.vibrate(30);

    hideVerificationSheet();
    lastScannedResult = null;

    // Sınav sonuç listesini ve haftalık görünümü yenile
    if (window.openWeeklyGradingModal) {
      window.openWeeklyGradingModal(exam.id);
    }
    if (window.renderMobileWeekly) {
      window.renderMobileWeekly();
    }
  };

  window.rescanCurrentPaper = function() {
    hideVerificationSheet();
    lastScannedResult = null;
    window.captureFromVideo();
  };

  // Yardımcı HTML Escape
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})(window);
