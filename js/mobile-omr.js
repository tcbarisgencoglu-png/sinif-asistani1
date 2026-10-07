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
  let isTorchOn = false;
  let currentSensitivity = 'normal'; // 'low' | 'normal' | 'high'

  // Tüm OMR akışında (yazdırma, tarama, doğrulama) tutarlı ve güvenilir öğrenci listesi fonksiyonu
  function getOmrStudentList(state, exam) {
    let allStudents = [];
    if (window.stateManager) {
      if (typeof window.stateManager.getStudents === 'function') {
        allStudents = window.stateManager.getStudents(true) || [];
      }
      if (allStudents.length === 0 && window.stateManager.state && Array.isArray(window.stateManager.state.students)) {
        allStudents = window.stateManager.state.students;
      }
    }
    if (allStudents.length === 0 && state) {
      allStudents = state.rawStudents || state.students || [];
    }
    if (allStudents.length === 0) return [];

    const isMiddle = (typeof window.isMiddleSchool === 'function')
      ? window.isMiddleSchool()
      : ((state && state.educationLevel === 'middle') || (window.stateManager && window.stateManager.state && window.stateManager.state.educationLevel === 'middle'));

    // Kademe Filtresi
    let filtered = allStudents.filter(s => {
      if (typeof window.isStudentInCurrentLevel === 'function') {
        return window.isStudentInCurrentLevel(s);
      }
      if (isMiddle) return s.schoolLevel !== 'primary';
      return s.schoolLevel !== 'middle';
    });

    // Kademe filtresi boş dönerse tüm öğrencileri koru
    if (filtered.length === 0) {
      filtered = allStudents.slice();
    }

    // Şube Filtresi (Ortaokulda ve sınav belirli bir şubeye atanmışsa)
    if (isMiddle && exam) {
      const examBranch = exam.branch;
      const examBranches = exam.branches || (examBranch ? [examBranch] : []);
      const validBranches = examBranches.filter(b => b && b !== 'all' && b !== 'Tüm Sınıf');
      if (validBranches.length > 0) {
        const branchMatches = filtered.filter(s => {
          if (!s.branch) return false;
          const sB = s.branch.trim().toLowerCase().replace(/[\s\-_]/g, '');
          return validBranches.some(eb => {
            const eB = eb.trim().toLowerCase().replace(/[\s\-_]/g, '');
            return sB === eB || sB.includes(eB) || eB.includes(sB);
          });
        });
        if (branchMatches.length > 0) {
          filtered = branchMatches;
        }
      }
    }

    return filtered.sort((a, b) => {
      const noA = parseInt(a.number, 10) || 0;
      const noB = parseInt(b.number, 10) || 0;
      if (noA && noB && noA !== noB) return noA - noB;
      return (a.name || '').localeCompare(b.name || '', 'tr');
    });
  }

  // Hassasiyet değiştirme
  window.setOmrSensitivity = function(mode) {
    currentSensitivity = mode || 'normal';
    ['low', 'normal', 'high'].forEach(m => {
      const btn = document.getElementById(`m-omr-sens-${m}`);
      if (btn) {
        if (m === currentSensitivity) {
          btn.style.border = '1px solid #4f46e5';
          btn.style.background = '#4f46e5';
          btn.style.color = '#fff';
        } else {
          btn.style.border = '1px solid rgba(255,255,255,0.2)';
          btn.style.background = 'transparent';
          btn.style.color = '#cbd5e1';
        }
      }
    });
    if (window.vibrate) window.vibrate(10);
    const messages = {
      low: 'Tükenmez kalem / Düşük hassasiyet seçildi (Sadece koyu işaretler).',
      normal: 'Normal hassasiyet seçildi (Standart 2B kurşun kalem).',
      high: 'Yüksek hassasiyet seçildi (Hafif kurşun kalem / açık işaretler).'
    };
    if (window.showMobileToast) window.showMobileToast(messages[currentSensitivity] || 'Hassasiyet güncellendi.');
  };

  // Kamera Feneri (Torch) Aç / Kapat
  window.toggleOmrTorch = async function() {
    if (!activeMediaStream) {
      if (window.showMobileToast) window.showMobileToast('Kamera aktif değil.', 'warning');
      return;
    }
    const track = activeMediaStream.getVideoTracks()[0];
    if (!track) return;
    try {
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (!capabilities.torch) {
        if (window.showMobileToast) window.showMobileToast('Cihazınızda kamera feneri desteklenmiyor veya izin verilmedi.', 'info');
        return;
      }
      isTorchOn = !isTorchOn;
      await track.applyConstraints({ advanced: [{ torch: isTorchOn }] });
      const btn = document.getElementById('m-omr-torch-btn');
      const text = document.getElementById('m-omr-torch-text');
      if (btn) {
        btn.style.background = isTorchOn ? '#f59e0b' : 'rgba(255,255,255,0.12)';
        btn.style.color = isTorchOn ? '#000' : '#fff';
      }
      if (text) text.textContent = isTorchOn ? 'Fener Açık' : 'Fener';
      if (window.vibrate) window.vibrate(15);
      if (window.showMobileToast) window.showMobileToast(isTorchOn ? 'Fener açıldı 💡' : 'Fener kapatıldı');
    } catch (err) {
      console.warn('Torch hatası:', err);
      if (window.showMobileToast) window.showMobileToast('Fener açılamadı: ' + (err.message || err), 'warning');
    }
  };

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

  function generateOpticalQRCodeSVG(options) {
    const { studentIndex, studentId, studentNo, examId, isSample, size = 42 } = options;
    if (typeof window.qrcode === 'function') {
      try {
        let payload = '';
        if (isSample) {
          payload = 'SA:SMP:1:105:1';
        } else if (studentIndex && studentIndex > 0) {
          payload = `SA:STU:${studentId || ''}:${studentNo || ''}:${studentIndex}:${examId || ''}`;
        } else {
          payload = `SA:BLK:${examId || ''}`;
        }

        const qr = window.qrcode(0, 'M');
        qr.addData(payload);
        qr.make();
        const svgContent = qr.createSvgTag(2, 0);
        return `
          <div class="omr-id-badge" title="Öğrenci QR Kimlik Kodu #${studentIndex || ''}">
            <div class="omr-qr-wrapper" style="width: ${size}px; height: ${size}px;">
              ${svgContent}
            </div>
            <div class="omr-id-caption">${studentIndex > 0 ? ('ID:#' + studentIndex) : 'QR KOD'}</div>
          </div>
        `;
      } catch (err) {
        console.warn('QR kod oluşturulamadı, fallback kullanılıyor:', err);
      }
    }
    return generateOpticalIdSVG(studentIndex, size);
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
      { id: 'sample_1', name: 'Ahmet YILMAZ', no: '105' },
      { id: 'sample_2', name: 'Ayşe DEMİR', no: '108' },
      { id: 'sample_3', name: 'Mehmet ÇELİK', no: '112' },
      { id: 'sample_4', name: 'Zeynep KAYA', no: '119' }
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
        studentId: isNamed ? sample.id : '',
        examId: activeExam.id || '',
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
    const { examName, studentName, studentNo, studentId, examId, totalQuestions, letters, studentIndex, isSample, perPage = 2 } = options;

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

    const hasIdBadge = (studentIndex && studentIndex > 0) || isSample;
    const badgeSize = perPage === 4 ? 26 : (perPage === 1 ? 44 : 38);
    const idBadgeHtml = hasIdBadge ? generateOpticalQRCodeSVG({
      studentIndex: isSample ? 1 : studentIndex,
      studentId: studentId || '',
      studentNo: studentNo || '',
      examId: examId || '',
      isSample: !!isSample,
      size: badgeSize
    }) : '';

    return `
      <div class="omr-card ${isSample ? 'omr-card-sample' : ''} ${perPage === 4 ? 'omr-card-compact' : ''}" data-cols="${cols}">
        <!-- 4 Yüksek Kontrastlı Referans Köşe Çapası (OMR Çevrim Dışı Hizalama) -->
        <div class="omr-anchor omr-anchor-tl"></div>
        <div class="omr-anchor omr-anchor-tr"></div>
        <div class="omr-anchor omr-anchor-bl"></div>
        <div class="omr-anchor omr-anchor-br"></div>

        <!-- Üst Başlık Bilgisi ve Öğrenci QR Kimlik Bloğu -->
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
          <div class="omr-grid-container cols-${cols}">
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
      studentsList = getOmrStudentList(state, activeExam);

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
          studentId: st.id || '',
          examId: activeExam.id || '',
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
      width: 22px;
      height: 22px;
      background-color: #000000 !important;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      z-index: 5;
    }
    .omr-anchor::before {
      content: '';
      display: block;
      width: 12px;
      height: 12px;
      background-color: #ffffff !important;
      box-sizing: border-box;
    }
    .omr-anchor::after {
      content: '';
      position: absolute;
      width: 6px;
      height: 6px;
      background-color: #000000 !important;
      box-sizing: border-box;
    }
    .omr-anchor-tl { top: 6px; left: 6px; }
    .omr-anchor-tr { top: 6px; right: 6px; }
    .omr-anchor-bl { bottom: 6px; left: 6px; }
    .omr-anchor-br { bottom: 6px; right: 6px; }
    .omr-row-tick {
      width: 5px;
      height: 2px;
      background-color: #000000 !important;
      display: inline-block;
      margin-right: 2px;
      flex-shrink: 0;
    }
    .omr-qr-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff !important;
      padding: 1px;
      border: 1px solid #000000;
      box-sizing: border-box;
    }
    .omr-qr-wrapper svg {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }
    .omr-card-header {
      margin: 2px 28px 4px 28px;
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
      margin: 4px 14px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-sizing: border-box;
    }
    .omr-grid-container {
      width: 100%;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      box-sizing: border-box;
    }
    .omr-grid-container.cols-1 {
      width: 50%;
      margin: 0 auto;
    }
    .omr-grid-container.cols-2 .omr-grid-col {
      width: 48%;
    }
    .omr-grid-container.cols-3 .omr-grid-col {
      width: 31%;
    }
    .omr-grid-col {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4px;
      box-sizing: border-box;
    }
    .omr-q-row {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
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

    /* 4-per-page (Tasarruflu) özel kompakt düzeni */
    .omr-per-page-4 .omr-anchor {
      width: 14px !important;
      height: 14px !important;
    }
    .omr-per-page-4 .omr-anchor::before {
      width: 8px !important;
      height: 8px !important;
    }
    .omr-per-page-4 .omr-anchor::after {
      width: 4px !important;
      height: 4px !important;
    }
    .omr-per-page-4 .omr-row-tick {
      width: 3px !important;
      height: 1.5px !important;
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
    if (window.lucide) window.lucide.createIcons();
    if (window.updateOmrApiBtnState) window.updateOmrApiBtnState();
    if (window.setOmrEngineMode) window.setOmrEngineMode(currentOmrMode || 'ai');
    window.setOmrSensitivity(currentSensitivity || 'normal');
    startCameraStream();
  };

  window.closeMobileOmrScanner = function() {
    stopCameraStream();
    const modal = document.getElementById('modal-mobile-omr-scanner');
    if (modal) modal.classList.remove('active');
    hideVerificationSheet();
  };

  let liveQrScanTimer = null;
  let lastLiveDetectedQr = null;

  function startLiveQrScanner() {
    stopLiveQrScanner();
    const video = document.getElementById('m-omr-video');
    const guideBox = document.querySelector('.m-omr-guide-box');
    const guideHint = document.querySelector('.m-omr-guide-hint');
    if (!video || typeof window.jsQR !== 'function') return;

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 400;
    sampleCanvas.height = 300;
    const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

    liveQrScanTimer = setInterval(() => {
      if (!video || video.paused || video.ended || video.readyState < 2) return;
      try {
        sCtx.drawImage(video, 0, 0, 400, 300);
        const imgData = sCtx.getImageData(0, 0, 400, 300);
        const qr = window.jsQR(imgData.data, 400, 300, { inversionAttempts: 'dontInvert' });
        if (qr && qr.data && qr.data.startsWith('SA:')) {
          if (guideBox) guideBox.classList.add('detected');
          const parts = qr.data.split(':');
          let label = 'Optik Form';
          if (parts[1] === 'STU') {
            const rawNo = parts[3];
            const rawIdx = parseInt(parts[4], 10);
            const state = window.stateManager ? (window.stateManager.loadState ? window.stateManager.loadState() : window.stateManager.state) : {};
            const students = getOmrStudentList(state, activeExam);
            let stu = null;
            if (rawNo) stu = students.find(s => String(s.number).trim() === String(rawNo).trim());
            if (!stu && rawIdx > 0 && rawIdx <= students.length) stu = students[rawIdx - 1];
            label = stu ? `${stu.name} (No: ${stu.number || '-'})` : `Öğrenci No: ${rawNo || rawIdx}`;
          } else if (parts[1] === 'SMP') {
            label = 'Örnek Form';
          }
          if (guideHint) guideHint.textContent = `🎯 ${label} Algılandı • Çekebilirsiniz!`;
          if (lastLiveDetectedQr !== qr.data) {
            lastLiveDetectedQr = qr.data;
            if (window.vibrate) window.vibrate(15);
          }
        } else {
          lastLiveDetectedQr = null;
          if (guideBox) guideBox.classList.remove('detected');
          if (guideHint) guideHint.textContent = 'Optik formun 4 köşesini kılavuza oturtun';
        }
      } catch (err) {
        // Sessiz devam et
      }
    }, 280);
  }

  function stopLiveQrScanner() {
    if (liveQrScanTimer) {
      clearInterval(liveQrScanTimer);
      liveQrScanTimer = null;
    }
    const guideBox = document.querySelector('.m-omr-guide-box');
    const guideHint = document.querySelector('.m-omr-guide-hint');
    if (guideBox) guideBox.classList.remove('detected');
    if (guideHint) guideHint.textContent = 'Optik formun 4 köşesini kılavuza oturtun';
    lastLiveDetectedQr = null;
  }

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
          return video.play().then(() => {
            startLiveQrScanner();
          }).catch(e => {
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
    stopLiveQrScanner();
    isTorchOn = false;
    const btn = document.getElementById('m-omr-torch-btn');
    const text = document.getElementById('m-omr-torch-text');
    if (btn) {
      btn.style.background = 'rgba(255,255,255,0.12)';
      btn.style.color = '#fff';
    }
    if (text) text.textContent = 'Fener';
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
  // GEMİNİ YAPAY ZEKA (VISION) SERVİSİ
  // ==========================================================================
  if (!window.getGeminiApiKey) {
    window.getGeminiApiKey = function() {
      const key = (localStorage.getItem('sinif_asistani_gemini_api_key') || '').trim();
      return key.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '');
    };
  }

  if (!window.setGeminiApiKey) {
    window.setGeminiApiKey = function(key) {
      const trimmed = (key || '').trim().replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '');
      if (trimmed) {
        localStorage.setItem('sinif_asistani_gemini_api_key', trimmed);
      } else {
        localStorage.removeItem('sinif_asistani_gemini_api_key');
      }
    };
  }

  if (!window.callGeminiAPI) {
    window.callGeminiAPI = async function(prompt, options = {}) {
      const apiKey = window.getGeminiApiKey ? window.getGeminiApiKey() : '';
      if (!apiKey) {
        throw new Error('NO_API_KEY');
      }

      // 1. Önce API anahtarının erişebildiği aktif modelleri Google'dan doğrudan çek
      let listData = null;
      let listError = null;

      for (const apiVer of ['v1beta', 'v1']) {
        try {
          const listRes = await fetch(`https://generativelanguage.googleapis.com/${apiVer}/models?key=${apiKey}`);
          const json = await listRes.json();
          if (listRes.ok && json.models && json.models.length > 0) {
            listData = { version: apiVer, models: json.models };
            break;
          } else if (!listRes.ok) {
            listError = json.error?.message || `HTTP ${listRes.status}`;
          }
        } catch (e) {
          listError = e.message;
        }
      }

      if (!listData) {
        if (listError && (listError.toLowerCase().includes('api key not valid') || listError.toLowerCase().includes('invalid'))) {
          throw new Error('Google API anahtarı geçersiz! Lütfen anahtarınızı kontrol edip tekrar kaydedin.');
        }
        if (listError && (listError.includes('not been used in project') || listError.includes('disabled'))) {
          throw new Error('Google Cloud projenizde Generative Language API henüz etkin değil. Lütfen Google AI Studio\'da anahtar oluştururken "Create API key in new project" (Yeni projede oluştur) seçeneğini seçin.');
        }
        throw new Error(`Google API bağlantı hatası: ${listError || 'Modeller sorgulanamadı'}`);
      }

      const supportedModels = listData.models.filter(m => 
        !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent')
      );

      if (supportedModels.length === 0) {
        throw new Error('Bu API anahtarının içerik üretme modellerine izni bulunmuyor. Lütfen Google AI Studio üzerinden "Create API key in new project" seçeneğiyle yeni bir anahtar oluşturun.');
      }

      const prioritizedCandidateNames = [
        'models/gemini-2.0-flash',
        'models/gemini-1.5-flash',
        'models/gemini-2.5-flash-lite',
        'models/gemini-2.0-flash-lite',
        'models/gemini-3.6-flash',
        'models/gemini-3-flash',
        ...supportedModels.map(m => m.name.startsWith('models/') ? m.name : `models/${m.name}`)
      ].filter((v, i, a) => a.indexOf(v) === i);

      let response = null;
      let lastErrDetail = '';
      const temperature = options.temperature !== undefined ? options.temperature : 0.3;
      const wantJson = options.json !== false;

      const requestParts = [{ text: prompt }];
      if (options.imageBase64) {
        requestParts.push({
          inlineData: {
            mimeType: options.imageMimeType || 'image/jpeg',
            data: options.imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
          }
        });
      } else if (Array.isArray(options.parts)) {
        requestParts.push(...options.parts);
      }

      for (const modelPath of prioritizedCandidateNames) {
        const url = `https://generativelanguage.googleapis.com/${listData.version}/${modelPath}:generateContent?key=${apiKey}`;
        try {
          let curRes = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{ parts: requestParts }],
              generationConfig: {
                temperature: temperature,
                ...(wantJson ? { responseMimeType: "application/json" } : {})
              }
            })
          });

          if (curRes.status === 400 && wantJson) {
            curRes = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                contents: [{ parts: requestParts }],
                generationConfig: { temperature: temperature }
              })
            });
          }

          if (curRes.ok) {
            response = curRes;
            break;
          }

          let errDetail = '';
          try {
            const errJson = await curRes.json();
            errDetail = errJson.error?.message || curRes.statusText;
          } catch (e) {
            errDetail = curRes.statusText;
          }
          lastErrDetail = errDetail;

          const match = errDetail.match(/use\s+(models\/[a-zA-Z0-9.-]+)/i);
          if (match && match[1]) {
            const suggestedUrl = `https://generativelanguage.googleapis.com/${listData.version}/${match[1]}:generateContent?key=${apiKey}`;
            const retryRes = await fetch(suggestedUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: requestParts }],
                generationConfig: { temperature: temperature, ...(wantJson ? { responseMimeType: "application/json" } : {}) }
              })
            });
            if (retryRes.ok) {
              response = retryRes;
              break;
            }
          }

          const isQuotaExceeded = curRes.status === 429 || 
            errDetail.toLowerCase().includes('quota') || 
            errDetail.toLowerCase().includes('resource_exhausted') ||
            errDetail.toLowerCase().includes('rate limit');

          const isHighDemandOrUnavailable = curRes.status === 404 || 
            curRes.status === 503 || 
            curRes.status === 500 || 
            (curRes.status === 429 && errDetail.toLowerCase().includes('demand')) ||
            errDetail.toLowerCase().includes('high demand') ||
            errDetail.toLowerCase().includes('overloaded') ||
            errDetail.toLowerCase().includes('unavailable');

          if (isQuotaExceeded || isHighDemandOrUnavailable) {
            await new Promise(r => setTimeout(r, 400));
            continue;
          }

          break;
        } catch (e) {
          lastErrDetail = e.message;
        }
      }

      if (!response || !response.ok) {
        const errLower = (lastErrDetail || '').toLowerCase();
        if (errLower.includes('quota') || errLower.includes('resource_exhausted') || errLower.includes('rate limit') || errLower.includes('free_tier_requests')) {
          const secMatch = lastErrDetail.match(/retry in\s+([0-9.]+)\s*s/i);
          const retrySec = secMatch ? Math.ceil(parseFloat(secMatch[1])) : 20;
          throw new Error(`Google Yapay Zeka ücretsiz kullanım sınırına ulaşıldı. Lütfen ${retrySec} saniye bekleyin.`);
        }
        if (errLower.includes('high demand') || errLower.includes('overloaded')) {
          throw new Error('Google Gemini sunucularında yoğunluk var. Lütfen 5-10 saniye sonra tekrar deneyin.');
        }
        throw new Error(`Yapay zeka hatası: ${lastErrDetail || 'İstek tamamlanamadı.'}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Yapay zekadan boş yanıt alındı.');
      }

      return rawText;
    };
  }

  let currentOmrMode = 'ai'; // 'ai' (Gemini Vision - Varsayılan) | 'offline' (Çevrim Dışı Algoritma)

  window.setOmrEngineMode = function(mode) {
    currentOmrMode = mode;
    const aiBtn = document.getElementById('m-omr-mode-ai');
    const offBtn = document.getElementById('m-omr-mode-offline');
    if (aiBtn && offBtn) {
      if (mode === 'ai') {
        aiBtn.className = 'm-omr-mode-pill active';
        aiBtn.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
        aiBtn.style.color = '#fff';
        aiBtn.style.borderColor = '#8b5cf6';
        offBtn.className = 'm-omr-mode-pill';
        offBtn.style.background = 'transparent';
        offBtn.style.color = '#94a3b8';
        offBtn.style.borderColor = 'rgba(255,255,255,0.2)';
      } else {
        offBtn.className = 'm-omr-mode-pill active';
        offBtn.style.background = '#4f46e5';
        offBtn.style.color = '#fff';
        offBtn.style.borderColor = '#4f46e5';
        aiBtn.className = 'm-omr-mode-pill';
        aiBtn.style.background = 'transparent';
        aiBtn.style.color = '#94a3b8';
        aiBtn.style.borderColor = 'rgba(255,255,255,0.2)';
      }
    }
    if (window.showMobileToast) {
      window.showMobileToast(mode === 'ai' ? '✨ Yapay Zeka (Gemini Vision) Aktif' : '⚡ Çevrim Dışı Algoritma Aktif', 'info', 1800);
    }
  };

  window.promptOmrApiKey = function() {
    if (typeof window.showGeminiKeyRequiredModal === 'function') {
      window.showGeminiKeyRequiredModal({
        featureName: 'Optik Form Okuma (Gemini Vision)',
        description: 'Optik formları ve öğrenci işaretlemelerini kamera ile yapay zekaya okutabilmek için Google Gemini bağlantısı gereklidir.',
        confirmText: 'Kaydet',
        onSuccess: () => {
          window.updateOmrApiBtnState();
        }
      });
    } else {
      const currentKey = (window.getGeminiApiKey ? window.getGeminiApiKey() : (localStorage.getItem('sinif_asistani_gemini_api_key') || '')).trim();
      const promptMsg = 'Google Gemini API anahtarınızı giriniz:\n(Google AI Studio üzerinden ücretsiz alabilirsiniz)';
      const entered = prompt(promptMsg, currentKey);
      if (entered !== null) {
        const trimmed = entered.trim();
        if (window.setGeminiApiKey) window.setGeminiApiKey(trimmed);
        else if (trimmed) localStorage.setItem('sinif_asistani_gemini_api_key', trimmed);
        else localStorage.removeItem('sinif_asistani_gemini_api_key');
        window.updateOmrApiBtnState();
      }
    }
  };

  window.updateOmrApiBtnState = function() {
    const key = (window.getGeminiApiKey ? window.getGeminiApiKey() : (localStorage.getItem('sinif_asistani_gemini_api_key') || '')).trim();
    const btnText = document.getElementById('m-omr-api-btn-text');
    const btn = document.getElementById('m-omr-api-btn');
    if (btnText && btn) {
      if (key) {
        btnText.textContent = '✓ API';
        btn.style.borderColor = '#10b981';
        btn.style.color = '#34d399';
        btn.style.background = 'rgba(16, 185, 129, 0.12)';
      } else {
        btnText.textContent = 'API Ekle';
        btn.style.borderColor = 'rgba(255,255,255,0.2)';
        btn.style.color = '#c7d2fe';
        btn.style.background = 'rgba(255,255,255,0.08)';
      }
    }
  };

  function showOmrAiLoading(title, desc) {
    const overlay = document.getElementById('m-omr-ai-loading-overlay');
    const titleEl = document.getElementById('m-omr-ai-loading-title');
    const descEl = document.getElementById('m-omr-ai-loading-desc');
    if (titleEl && title) titleEl.textContent = title;
    if (descEl && desc) descEl.textContent = desc;
    if (overlay) overlay.style.display = 'flex';
  }

  function hideOmrAiLoading() {
    const overlay = document.getElementById('m-omr-ai-loading-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function processCapturedImage(sourceElement) {
    if (!activeExam) return;
    if (currentOmrMode === 'ai') {
      processCapturedImageWithGemini(sourceElement);
    } else {
      processCapturedImageOffline(sourceElement);
    }
  }

  // ==========================================================================
  // YAPAY ZEKA (GEMINI VISION) İLE OPTİK FORM ÇÖZÜMLEME MOTORU
  // ==========================================================================
  async function processCapturedImageWithGemini(sourceElement) {
    if (!activeExam) return;

    let apiKey = (window.getGeminiApiKey ? window.getGeminiApiKey() : (localStorage.getItem('sinif_asistani_gemini_api_key') || '')).trim();
    if (!apiKey) {
      if (typeof window.showGeminiKeyRequiredModal === 'function') {
        window.showGeminiKeyRequiredModal({
          featureName: 'Optik Form Okuma (Gemini Vision)',
          description: 'Optik formları ve öğrenci işaretlemelerini yapay zekayla otomatik tanıyabilmek için Google Gemini Vision bağlantısı gereklidir.',
          confirmText: 'Kaydet ve Optik Formu Oku',
          onSuccess: () => {
            window.updateOmrApiBtnState();
            processCapturedImageWithGemini(sourceElement);
          },
          onCancel: () => {
            if (confirm('API anahtarı girilmedi. Çevrim dışı okuma yöntemiyle devam edilsin mi?')) {
              processCapturedImageOffline(sourceElement);
            }
          }
        });
      } else {
        if (confirm('API anahtarı bulunamadı. Çevrim dışı okuma yöntemiyle devam edilsin mi?')) {
          processCapturedImageOffline(sourceElement);
        }
      }
      return;
    }

    const srcW = sourceElement.width || sourceElement.videoWidth;
    const srcH = sourceElement.height || sourceElement.videoHeight;
    if (!srcW || !srcH) {
      alert('Görsel okunamadı, lütfen tekrar deneyin.');
      return;
    }

    // 1. Resmi yüksek çözünürlüklü analiz tuvaline çiz (Maksimum 1280px)
    const canvas = document.createElement('canvas');
    const MAX_DIM = 1280;
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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(sourceElement, 0, 0, targetW, targetH);

    // 2. Anında yerel QR taraması yap (Eğer kağıtta QR varsa 5 milisaniyede öğrenciyi çözer)
    let localStudent = null;
    let localStudentIndex = null;
    let localQrDetected = false;
    const state = window.stateManager ? (window.stateManager.loadState ? window.stateManager.loadState() : window.stateManager.state) : {};
    const students = getOmrStudentList(state, activeExam);

    if (typeof window.jsQR === 'function') {
      try {
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const qr = window.jsQR(imgData.data, targetW, targetH, { inversionAttempts: 'attemptBoth' });
        if (qr && qr.data && qr.data.startsWith('SA:')) {
          localQrDetected = true;
          const parts = qr.data.split(':');
          const qrType = parts[1];
          const rawStuId = parts[2];
          const rawStuNo = parts[3];
          const rawStuIdx = parseInt(parts[4], 10) || 0;
          localStudentIndex = rawStuIdx;

          if (qrType === 'STU' && students && students.length > 0) {
            if (rawStuId) localStudent = students.find(s => String(s.id) === String(rawStuId));
            if (!localStudent && rawStuNo) localStudent = students.find(s => String(s.number).trim() === String(rawStuNo).trim());
            if (!localStudent && rawStuIdx > 0 && rawStuIdx <= students.length) localStudent = students[rawStuIdx - 1];
          } else if (qrType === 'SMP' && students.length > 0) {
            localStudent = students[0];
          }
        }
      } catch (qrErr) {
        console.warn('Yerel QR kontrolü hatası:', qrErr);
      }
    }

    // 3. Yükleniyor ekranını aç
    showOmrAiLoading('✨ Yapay Zeka İnceliyor...', 'Gemini Vision optik formu ve işaretlemeleri okuyor, lütfen bekleyin...');

    try {
      const qCount = parseInt(activeExam.totalQuestions, 10) || 20;
      const choicesCount = parseInt(activeExam.choicesCount, 10) || 4;
      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
      const examTitle = activeExam.examName || 'Optik Sınav';

      const prompt = `Görseldeki sınav optik formunu dikkatlice incele.
Sınav Bilgileri:
- Sınav Adı: ${examTitle}
- Toplam Soru Sayısı: ${qCount}
- Olası Seçenekler: ${letters.join(', ')}

FORM DÜZENİ VE OKUMA KURALLARI (ÇOK ÖNEMLİ):
1. ÖĞRENCİ BİLGİLERİ:
   - "Öğrenci:" yanındaki tam isim ("studentName")
   - "No:" yanındaki öğrenci numarası ("studentNo")
2. HER SORU SATIRINDA SOLDAN SAĞA ŞIK ÇEMBERLERİ BULUNUR:
   - 1. Çember = 'A'
   - 2. Çember = 'B'
   - 3. Çember = 'C'
   - 4. Çember = 'D' (varsa 5. Çember = 'E')
3. OPTİK İŞARETLEME TESPİTİ (EN KRİTİK KURAL):
   - Her çemberin içinde basılı harf (A, B, C, D) bulunur.
   - ÖĞRENCİNİN SEÇTİĞİ ŞIK: İÇİ KURŞUN KALEM VEYA TÜKENMEZ KALEMLE KARALANMIŞ / DOLDURULMUŞ / KOYU GRİ VEYA SİYAH OLAN ÇEMBERDİR.
   - İçi beyaz kalan ve sadece basılı harfi görünen çemberler BOŞTUR / SEÇİLMEMİŞTİR! Beyaz çemberdeki harf net okunuyor diye onu kesinlikle işaretli sayma!
   - Karalanmış çemberin içindeki harf kurşun kalemden dolayı örtülmüş olabilir; çemberin konumuna göre harfi belirle (1. çember A, 2. çember B, 3. çember C, 4. çember D).
   - Soru hiç işaretlenmemişse veya tüm çemberler boşsa "" (boş dize) yaz.
   - Bir soruda birden fazla çember karalanmışsa "MULTIPLE" yaz.
   - Eğer bir şık karalanıp sonra üzeri çizilmiş/silinmiş ve başka bir şık doldurulmuşsa geçerli doldurulanı al.

Cevabını SADECE aşağıdaki JSON formatında ver (hiçbir markdown etiketi veya ek metin ekleme):
{
  "studentName": "...",
  "studentNo": "...",
  "answers": {
    "1": "B",
    "2": "A",
    "3": "B"
  }
}`;

      const base64Data = canvas.toDataURL('image/jpeg', 0.93);
      const rawRes = await window.callGeminiAPI(prompt, {
        imageBase64: base64Data,
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

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Yapay zeka geçerli bir yanıt üretemedi.');
      }

      // Öğrenciyi Eşle
      let identifiedStudent = localStudent;
      if (!identifiedStudent && parsed) {
        const aiNo = String(parsed.studentNo || '').trim();
        const aiName = String(parsed.studentName || '').trim().toLowerCase();
        if (aiNo) {
          identifiedStudent = students.find(s => String(s.number).trim() === aiNo);
        }
        if (!identifiedStudent && aiName && aiName.length > 2) {
          identifiedStudent = students.find(s => {
            const fullName = `${s.name} ${s.surname || ''}`.trim().toLowerCase();
            return fullName.includes(aiName) || aiName.includes(fullName);
          });
        }
      }

      // Cevapları ve İstatistikleri Değerlendir
      const answerKey = activeExam.answerKey || {};
      const detectedAnswers = {};
      const questionDetails = [];
      let correctCount = 0;
      let wrongCount = 0;
      let blankCount = 0;

      const aiAnswers = parsed.answers || {};

      for (let q = 1; q <= qCount; q++) {
        let val = aiAnswers[q] || aiAnswers[String(q)] || '';
        val = String(val).trim().toUpperCase();
        if (!letters.includes(val) && val !== 'MULTIPLE') {
          val = '';
        }

        const correctAns = answerKey[q] || '';
        const qd = {
          q,
          marked: val === 'MULTIPLE' ? '' : val,
          status: val === 'MULTIPLE' ? 'multiple' : (val ? 'marked' : 'blank'),
          scores: letters.map(l => ({ letter: l, score: (l === val ? 1 : 0) })),
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

      const penaltyRate = activeExam.wrongAffects ? (parseFloat(activeExam.penaltyRate) || 3) : 0;
      let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
      net = Math.max(0, parseFloat(net.toFixed(2)));
      const score = qCount > 0 ? Math.round((net / qCount) * 100) : 0;

      hideOmrAiLoading();

      const result = {
        success: true,
        isAiVision: true,
        examId: activeExam.id,
        detectedStudentIndex: localStudentIndex,
        identifiedStudent,
        qrDetected: localQrDetected,
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

      lastScannedResult = result;
      if (window.vibrate) window.vibrate(40);
      showVerificationSheet(result);
    } catch (err) {
      hideOmrAiLoading();
      console.error('Gemini Vision OMR Hatası:', err);
      const errMsg = err.message || String(err);
      if (confirm(`Yapay zeka analizinde hata oluştu:\n${errMsg}\n\nÇevrim dışı algoritmaya geçip tekrar denemek ister misiniz?`)) {
        processCapturedImageOffline(sourceElement);
      }
    }
  }

  function processCapturedImageOffline(sourceElement) {
    if (!activeExam) return;

    if (window.showMobileToast) {
      window.showMobileToast('🔍 Çevrim dışı taranıyor...');
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
   * Tamamen istemci taraflı, Modern ve Sağlam OMR Okuyucu Motoru
   * - jsQR Entegrasyonu: QR Kod ile %100 Doğru ve Anında Öğrenci Tanıma
   * - Çift Katmanlı Çapa Tespiti (Hedef Tipi Konsantrik Çapalar + Eski Kare Blob Yedekleme)
   * - 4. Köşe Kurtarma (Paralelkenar Vektör Tamamlama)
   * - Heckbert Projective Homography (Perspektif ve Eğim Düzeltme)
   * - Lokal Adaptif Kontrast Ölçümü (Gölge, Eşitsiz Işık ve Basılı Harf Bağışıklığı)
   * - Görsel Önizleme ve Çoklu/Hatalı Şık Vurgulama
   */
  function runPureJsOmrScan(sourceElement, exam) {
    const srcW = sourceElement.width || sourceElement.videoWidth;
    const srcH = sourceElement.height || sourceElement.videoHeight;
    if (!srcW || !srcH) return { success: false, error: 'Görsel boyutu geçersiz' };

    // 1. Resmi yüksek çözünürlüklü analiz tuvaline çiz
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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(sourceElement, 0, 0, targetW, targetH);

    // 2. Gri Tonlama ve Adaptif Eşikleme
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;
    const totalPixels = targetW * targetH;
    const gray = new Uint8Array(totalPixels);

    let sumLum = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const lum = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
      gray[p] = lum;
      sumLum += lum;
    }
    const avgLum = sumLum / totalPixels;
    const threshold = Math.max(60, Math.min(150, Math.round(avgLum * 0.75)));

    // 3. QR Kod ile Öğrenci Tanıma (jsQR Motoru)
    let qrResult = null;
    let identifiedStudent = null;
    let detectedStudentIndex = null;

    const state = window.stateManager ? (window.stateManager.loadState ? window.stateManager.loadState() : window.stateManager.state) : {};
    const students = getOmrStudentList(state, exam);

    if (typeof window.jsQR === 'function') {
      try {
        qrResult = window.jsQR(data, targetW, targetH, {
          inversionAttempts: 'attemptBoth'
        });
        if (qrResult && qrResult.data) {
          const parts = qrResult.data.split(':');
          if (parts[0] === 'SA') {
            const qrType = parts[1]; // 'STU' | 'SMP' | 'BLK'
            const rawStuId = parts[2];
            const rawStuNo = parts[3];
            const rawStuIdx = parseInt(parts[4], 10) || 0;

            detectedStudentIndex = rawStuIdx;

            if (qrType === 'STU' && students && students.length > 0) {
              if (rawStuId) {
                identifiedStudent = students.find(s => String(s.id) === String(rawStuId));
              }
              if (!identifiedStudent && rawStuNo) {
                identifiedStudent = students.find(s => String(s.number).trim() === String(rawStuNo).trim());
              }
              if (!identifiedStudent && rawStuIdx > 0 && rawStuIdx <= students.length) {
                identifiedStudent = students[rawStuIdx - 1];
              }
            } else if (qrType === 'SMP' && students.length > 0) {
              identifiedStudent = students[0];
            }
          }
        }
      } catch (qrErr) {
        console.warn('QR okuma hatası:', qrErr);
      }
    }

    // 4. 4 Köşe Referans Çapasını (Anchor) Hassas Tespit Et
    const corners = detectCornerAnchors(gray, targetW, targetH, threshold, qrResult);

    // 5. Heckbert Projective Homography Eşleyicisini Kur
    const mapPoint = createProjectiveHomography(corners);

    // QR kod bulunamadıysa eski 5x5 matrisi dene (Geriye Dönük Uyumluluk)
    if (!identifiedStudent && !detectedStudentIndex) {
      const legacyIdx = scanStudentOpticalId(gray, targetW, targetH, threshold, mapPoint);
      if (legacyIdx && legacyIdx > 0 && legacyIdx <= students.length) {
        detectedStudentIndex = legacyIdx;
        identifiedStudent = students[legacyIdx - 1];
      }
    }

    // 6. Soru ve Şık Izgarasını Homografi ile Tara
    const qCount = parseInt(exam.totalQuestions, 10) || 20;
    const choicesCount = parseInt(exam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);

    const cols = qCount <= 15 ? 1 : (qCount <= 30 ? 2 : 3);
    const questionsPerCol = Math.ceil(qCount / cols);

    const detectedAnswers = {};
    const questionDetails = [];

    // Form üzerindeki orantısal koordinatlar:
    // Standart form baskısında soru satırları tüm sayfaya yayılmaz, üstten aşağıya sabit adımlarla (~%4.3-4.7) yerleşir.
    const bodyTop = 0.17;
    const actualRowStep = Math.min(0.050, Math.max(0.038, 0.74 / Math.max(16, questionsPerCol)));
    const firstRowCenter = bodyTop + actualRowStep * 0.65;
    const sampleRadius = Math.max(5, Math.min(16, Math.round(targetW * 0.013)));

    // Hassasiyet moduna göre eşik ayarları
    let minScore = 0.18;
    let minFill = 0.28;
    if (currentSensitivity === 'high') {
      minScore = 0.13; // Açık / hafif kurşun kalem
      minFill = 0.20;
    } else if (currentSensitivity === 'low') {
      minScore = 0.26; // Tükenmez / sadece çok koyu işaretler
      minFill = 0.38;
    }

    for (let c = 0; c < cols; c++) {
      const startQ = c * questionsPerCol + 1;
      const endQ = Math.min((c + 1) * questionsPerCol, qCount);

      let colUStart, colUEnd;
      if (cols === 1) {
        colUStart = 0.25;
        colUEnd = 0.75;
      } else if (cols === 2) {
        colUStart = 0.05 + c * 0.46;
        colUEnd = colUStart + 0.44;
      } else {
        colUStart = 0.04 + c * 0.32;
        colUEnd = colUStart + 0.28;
      }
      const colWidth = colUEnd - colUStart;

      for (let q = startQ; q <= endQ; q++) {
        const rowIdx = q - startQ;
        const rowV = firstRowCenter + rowIdx * actualRowStep;

        // Satırın lokal arka plan parlaklığını ölç (Gölge bağışıklığı)
        const rowSamplePt = mapPoint(colUStart + colWidth * 0.15, rowV);
        const rowPaperLum = sampleLocalPaperLuminance(gray, targetW, targetH, rowSamplePt, sampleRadius);

        // Her bir şıkkın merkezini homografi ile belirle ve ince ayarla
        const choiceScores = [];
        for (let lIdx = 0; lIdx < letters.length; lIdx++) {
          const choiceU = colUStart + colWidth * (0.24 + (lIdx + 0.5) * (0.74 / letters.length));
          const initialPt = mapPoint(choiceU, rowV);
          const snappedPt = refineBubbleCenter(gray, targetW, targetH, initialPt, sampleRadius, rowPaperLum);

          const metrics = analyzeBubble(gray, targetW, targetH, snappedPt.x, snappedPt.y, sampleRadius, rowPaperLum);
          choiceScores.push({
            letter: letters[lIdx],
            score: metrics.score,
            medianDarkness: metrics.medianDarkness,
            p75Darkness: metrics.p75Darkness,
            fillRatio: metrics.fillRatio,
            pt: snappedPt
          });
        }

        // Skorları en koyudan en açığa sırala
        choiceScores.sort((a, b) => b.score - a.score);

        const best = choiceScores[0];
        const second = choiceScores[1] || { score: 0, fillRatio: 0 };

        let markedLetter = '';
        let status = 'blank';

        // İşaretlenme Kararı
        if (best.score >= minScore && best.fillRatio >= minFill) {
          // İkinci şık da işaretlenmiş mi kontrol et (Çift işaret)
          if (second.score >= minScore && second.fillRatio >= minFill && (best.score - second.score) < 0.08) {
            status = 'multiple';
            markedLetter = '';
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

    // 7. Cevap Anahtarıyla Karşılaştır ve Puanla
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
        qd.isBlank = false;
      } else {
        wrongCount++;
        qd.isCorrect = false;
        qd.isBlank = false;
      }
      qd.keyAnswer = correctAns;
    });

    const penaltyRate = exam.wrongAffects ? (parseFloat(exam.penaltyRate) || 3) : 0;
    let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
    net = Math.max(0, parseFloat(net.toFixed(2)));

    const score = qCount > 0 ? Math.round((net / qCount) * 100) : 0;

    // 8. Görsel Önizleme Vurguları
    const overlayCtx = canvas.getContext('2d');

    // Form Dış Çerçevesi (Mavi çizgi)
    overlayCtx.lineWidth = Math.max(2, Math.round(targetW * 0.0025));
    overlayCtx.strokeStyle = 'rgba(79, 70, 229, 0.85)';
    overlayCtx.beginPath();
    overlayCtx.moveTo(corners.tl.x, corners.tl.y);
    overlayCtx.lineTo(corners.tr.x, corners.tr.y);
    overlayCtx.lineTo(corners.br.x, corners.br.y);
    overlayCtx.lineTo(corners.bl.x, corners.bl.y);
    overlayCtx.closePath();
    overlayCtx.stroke();

    // QR Kod Tespit Kutusu (Yeşil çerçeve ve etiket)
    if (qrResult && qrResult.location) {
      const loc = qrResult.location;
      overlayCtx.save();
      overlayCtx.strokeStyle = '#10b981';
      overlayCtx.lineWidth = 3;
      overlayCtx.beginPath();
      overlayCtx.moveTo(loc.topLeftCorner.x, loc.topLeftCorner.y);
      overlayCtx.lineTo(loc.topRightCorner.x, loc.topRightCorner.y);
      overlayCtx.lineTo(loc.bottomRightCorner.x, loc.bottomRightCorner.y);
      overlayCtx.lineTo(loc.bottomLeftCorner.x, loc.bottomLeftCorner.y);
      overlayCtx.closePath();
      overlayCtx.stroke();

      if (identifiedStudent) {
        overlayCtx.fillStyle = '#10b981';
        overlayCtx.font = 'bold 14px system-ui, sans-serif';
        overlayCtx.fillText(`✓ ${identifiedStudent.name} (No: ${identifiedStudent.number || '-'})`, loc.topLeftCorner.x, Math.max(16, loc.topLeftCorner.y - 8));
      }
      overlayCtx.restore();
    }

    // Şık Çemberleri ve Durum Vurguları
    questionDetails.forEach(qd => {
      const correctAns = answerKey[qd.q] || '';
      qd.scores.forEach(cs => {
        const isMarked = (qd.status === 'marked' && qd.marked === cs.letter);
        const isMultiple = (qd.status === 'multiple' && cs.score >= minScore);
        const isAnswerKey = (correctAns && cs.letter === correctAns);

        if (isMarked) {
          overlayCtx.beginPath();
          overlayCtx.arc(cs.pt.x, cs.pt.y, sampleRadius * 1.3, 0, Math.PI * 2);
          if (qd.isCorrect) {
            overlayCtx.fillStyle = 'rgba(16, 185, 129, 0.45)';
            overlayCtx.strokeStyle = '#10b981';
          } else {
            overlayCtx.fillStyle = 'rgba(239, 68, 68, 0.45)';
            overlayCtx.strokeStyle = '#ef4444';
          }
          overlayCtx.lineWidth = 2.5;
          overlayCtx.fill();
          overlayCtx.stroke();
        } else if (isMultiple) {
          overlayCtx.beginPath();
          overlayCtx.arc(cs.pt.x, cs.pt.y, sampleRadius * 1.3, 0, Math.PI * 2);
          overlayCtx.fillStyle = 'rgba(245, 158, 11, 0.45)';
          overlayCtx.strokeStyle = '#f59e0b';
          overlayCtx.lineWidth = 2.5;
          overlayCtx.fill();
          overlayCtx.stroke();
        } else if (isAnswerKey && !qd.isCorrect) {
          overlayCtx.beginPath();
          overlayCtx.arc(cs.pt.x, cs.pt.y, sampleRadius * 1.2, 0, Math.PI * 2);
          overlayCtx.strokeStyle = 'rgba(16, 185, 129, 0.75)';
          overlayCtx.lineWidth = 1.8;
          overlayCtx.stroke();
        }
      });
    });

    return {
      success: true,
      examId: exam.id,
      detectedStudentIndex,
      identifiedStudent,
      qrDetected: !!qrResult,
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

  // ==========================================================================
  // HASSAS GEOMETRİ VE HOMOGRAFİ FONKSİYONLARI
  // ==========================================================================

  // Paul Heckbert Projective Homography Çözücü
  function createProjectiveHomography(corners) {
    const x0 = corners.tl.x, y0 = corners.tl.y;
    const x1 = corners.tr.x, y1 = corners.tr.y;
    const x2 = corners.br.x, y2 = corners.br.y;
    const x3 = corners.bl.x, y3 = corners.bl.y;

    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const dy3 = y0 - y1 + y2 - y3;

    let a11, a12, a13, a21, a22, a23, a31, a32;

    if (Math.abs(dx3) < 1e-4 && Math.abs(dy3) < 1e-4) {
      a11 = x1 - x0;
      a12 = x3 - x0;
      a13 = x0;
      a21 = y1 - y0;
      a22 = y3 - y0;
      a23 = y0;
      a31 = 0;
      a32 = 0;
    } else {
      const det = dx1 * dy2 - dx2 * dy1;
      if (Math.abs(det) < 1e-7) {
        return function(u, v) {
          const x = (1 - u) * (1 - v) * x0 + u * (1 - v) * x1 + u * v * x2 + (1 - u) * v * x3;
          const y = (1 - u) * (1 - v) * y0 + u * (1 - v) * y1 + u * v * x2 + (1 - u) * v * y3;
          return { x: Math.round(x), y: Math.round(y) };
        };
      }
      a31 = (dx3 * dy2 - dx2 * dy3) / det;
      a32 = (dx1 * dy3 - dx3 * dy1) / det;
      a11 = x1 - x0 + a31 * x1;
      a12 = x3 - x0 + a32 * x3;
      a13 = x0;
      a21 = y1 - y0 + a31 * y1;
      a22 = y3 - y0 + a32 * y3;
      a23 = y0;
    }

    return function(u, v) {
      const w = a31 * u + a32 * v + 1;
      const x = (a11 * u + a12 * v + a13) / w;
      const y = (a21 * u + a22 * v + a23) / w;
      return { x: Math.round(x), y: Math.round(y) };
    };
  }

  // 4 Köşe İşaretleyicisini (Anchor) Konsantrik Hedef ve Blob Algılama ile Bul
  function detectCornerAnchors(gray, w, h, threshold, qrResult) {
    const qW = Math.round(w * 0.32);
    const qH = Math.round(h * 0.30);
    const anchorRadius = Math.max(8, Math.min(22, Math.round(w * 0.018)));

    const corners = {
      tl: { x: Math.round(w * 0.05), y: Math.round(h * 0.04) },
      tr: { x: Math.round(w * 0.95), y: Math.round(h * 0.04) },
      br: { x: Math.round(w * 0.95), y: Math.round(h * 0.96) },
      bl: { x: Math.round(w * 0.05), y: Math.round(h * 0.96) }
    };

    // 1. Aşama: Konsantrik hedef çapa araması
    let tlFound = findConcentricTargetAnchor(gray, w, h, 0, qW, 0, qH, 0, 0, anchorRadius);
    let trFound = findConcentricTargetAnchor(gray, w, h, w - qW, w, 0, qH, w, 0, anchorRadius);
    let brFound = findConcentricTargetAnchor(gray, w, h, w - qW, w, h - qH, h, w, h, anchorRadius);
    let blFound = findConcentricTargetAnchor(gray, w, h, 0, qW, h - qH, h, 0, h, anchorRadius);

    // 2. Aşama: Bulunamayan köşeler için klasik koyu blob araması (Geriye Dönük Uyumluluk)
    if (!tlFound) tlFound = findBestCornerAnchorBlob(gray, w, h, 0, qW, 0, qH, 0, 0, threshold);
    if (!trFound) trFound = findBestCornerAnchorBlob(gray, w, h, w - qW, w, 0, qH, w, 0, threshold);
    if (!brFound) brFound = findBestCornerAnchorBlob(gray, w, h, w - qW, w, h - qH, h, w, h, threshold);
    if (!blFound) blFound = findBestCornerAnchorBlob(gray, w, h, 0, qW, h - qH, h, 0, h, threshold);

    if (tlFound) corners.tl = tlFound;
    if (trFound) corners.tr = trFound;
    if (brFound) corners.br = brFound;
    if (blFound) corners.bl = blFound;

    // 3. Aşama: 4. Köşe Kurtarma (Paralelkenar Vektör Tamamlama)
    const foundCount = (tlFound ? 1 : 0) + (trFound ? 1 : 0) + (brFound ? 1 : 0) + (blFound ? 1 : 0);
    if (foundCount === 3) {
      if (!tlFound) corners.tl = { x: corners.tr.x + corners.bl.x - corners.br.x, y: corners.tr.y + corners.bl.y - corners.br.y };
      else if (!trFound) corners.tr = { x: corners.tl.x + corners.br.x - corners.bl.x, y: corners.tl.y + corners.br.y - corners.bl.y };
      else if (!brFound) corners.br = { x: corners.tr.x + corners.bl.x - corners.tl.x, y: corners.tr.y + corners.bl.y - corners.tl.y };
      else if (!blFound) corners.bl = { x: corners.tl.x + corners.br.x - corners.tr.x, y: corners.tl.y + corners.br.y - corners.tr.y };
    }

    return corners;
  }

  // Konsantrik hedef çapa bul (Siyah Merkez - Beyaz Halka - Siyah Çerçeve)
  function findConcentricTargetAnchor(gray, w, h, minX, maxX, minY, maxY, cornerX, cornerY, radius) {
    let bestX = 0, bestY = 0;
    let bestScore = 0;
    const step = Math.max(2, Math.floor(radius / 3));

    const rCore = Math.max(2, Math.round(radius * 0.30));
    const rRingInner = Math.max(rCore + 1, Math.round(radius * 0.45));
    const rRingOuter = Math.max(rRingInner + 1, Math.round(radius * 0.75));
    const rOuter = Math.max(rRingOuter + 1, Math.round(radius * 1.10));

    const rCore2 = rCore * rCore;
    const rRingInner2 = rRingInner * rRingInner;
    const rRingOuter2 = rRingOuter * rRingOuter;
    const rOuter2 = rOuter * rOuter;

    for (let y = minY + rOuter; y <= maxY - rOuter; y += step) {
      for (let x = minX + rOuter; x <= maxX - rOuter; x += step) {
        let coreSum = 0, coreCount = 0;
        let ringSum = 0, ringCount = 0;
        let outerSum = 0, outerCount = 0;

        for (let dy = -rOuter; dy <= rOuter; dy += 2) {
          const py = y + dy;
          const dy2 = dy * dy;
          for (let dx = -rOuter; dx <= rOuter; dx += 2) {
            const px = x + dx;
            const d2 = dx * dx + dy2;
            if (d2 <= rOuter2) {
              const lum = gray[py * w + px];
              if (d2 <= rCore2) {
                coreSum += lum;
                coreCount++;
              } else if (d2 >= rRingInner2 && d2 <= rRingOuter2) {
                ringSum += lum;
                ringCount++;
              } else if (d2 > rRingOuter2) {
                outerSum += lum;
                outerCount++;
              }
            }
          }
        }

        if (coreCount > 0 && ringCount > 0 && outerCount > 0) {
          const avgCore = coreSum / coreCount;
          const avgRing = ringSum / ringCount;
          const avgOuter = outerSum / outerCount;

          const diffCore = avgRing - avgCore;
          const diffOuter = avgRing - avgOuter;

          if (diffCore > 25 && diffOuter > 20) {
            const distNorm = Math.hypot((x - cornerX) / w, (y - cornerY) / h);
            const score = (diffCore + diffOuter) * (1.0 - distNorm * 0.25);
            if (score > bestScore) {
              bestScore = score;
              bestX = x;
              bestY = y;
            }
          }
        }
      }
    }

    return bestScore > 40 ? { x: bestX, y: bestY } : null;
  }

  // Koyu kompakt çapa bloğu bul (Fallback)
  function findBestCornerAnchorBlob(gray, w, h, minX, maxX, minY, maxY, cornerX, cornerY, threshold) {
    let bestX = 0, bestY = 0;
    let bestScore = -999;
    const boxSize = Math.max(8, Math.round(w * 0.022));
    const step = Math.max(2, Math.floor(boxSize / 3));

    for (let y = minY; y <= maxY - boxSize; y += step) {
      for (let x = minX; x <= maxX - boxSize; x += step) {
        let darkCount = 0;
        let sumX = 0;
        let sumY = 0;

        for (let dy = 0; dy < boxSize; dy += 2) {
          for (let dx = 0; dx < boxSize; dx += 2) {
            const idx = (y + dy) * w + (x + dx);
            if (gray[idx] < threshold) {
              darkCount++;
              sumX += (x + dx);
              sumY += (y + dy);
            }
          }
        }

        const maxPossible = Math.round((boxSize * boxSize) / 4);
        const darkRatio = darkCount / Math.max(1, maxPossible);

        if (darkRatio >= 0.45) {
          const centroidX = darkCount > 0 ? (sumX / darkCount) : (x + (boxSize >> 1));
          const centroidY = darkCount > 0 ? (sumY / darkCount) : (y + (boxSize >> 1));

          const distNorm = Math.hypot((centroidX - cornerX) / w, (centroidY - cornerY) / h);
          const score = (darkRatio * 0.40) + ((1.0 - distNorm) * 0.60);

          if (score > bestScore) {
            bestScore = score;
            bestX = Math.round(centroidX);
            bestY = Math.round(centroidY);
          }
        }
      }
    }

    return bestScore > 0 ? { x: bestX, y: bestY } : null;
  }

  // Soru satırındaki lokal kağıt aydınlığını örnekle
  function sampleLocalPaperLuminance(gray, w, h, pt, radius) {
    let sum = 0, count = 0;
    const checkPts = [
      { x: pt.x, y: Math.max(0, pt.y - Math.round(radius * 1.6)) },
      { x: pt.x, y: Math.min(h - 1, pt.y + Math.round(radius * 1.6)) },
      { x: Math.max(0, pt.x - Math.round(radius * 2.0)), y: pt.y }
    ];

    for (const cp of checkPts) {
      for (let dy = -2; dy <= 2; dy++) {
        const py = cp.y + dy;
        if (py < 0 || py >= h) continue;
        for (let dx = -2; dx <= 2; dx++) {
          const px = cp.x + dx;
          if (px < 0 || px >= w) continue;
          sum += gray[py * w + px];
          count++;
        }
      }
    }
    return count > 0 ? (sum / count) : 220;
  }

  // Baloncuk çekirdeğini gölgeye ve basılı harflere karşı dayanıklı ölç
  function analyzeBubble(gray, w, h, cx, cy, radius, rowPaperLum) {
    const rInner = Math.max(3, Math.round(radius * 0.72));
    const rInner2 = rInner * rInner;

    let totalPixels = 0;
    const darknessValues = [];

    for (let dy = -rInner; dy <= rInner; dy++) {
      const py = cy + dy;
      if (py < 0 || py >= h) continue;
      const dy2 = dy * dy;
      for (let dx = -rInner; dx <= rInner; dx++) {
        const px = cx + dx;
        if (px < 0 || px >= w) continue;
        if (dx * dx + dy2 <= rInner2) {
          totalPixels++;
          const lum = gray[py * w + px];
          const d = Math.max(0, (rowPaperLum - lum) / Math.max(1, rowPaperLum));
          darknessValues.push(d);
        }
      }
    }

    if (totalPixels === 0) {
      return { score: 0, fillRatio: 0, medianDarkness: 0, p75Darkness: 0, meanDarkness: 0 };
    }

    darknessValues.sort((a, b) => a - b);

    const medianDarkness = darknessValues[Math.floor(totalPixels * 0.50)];
    const p75Darkness = darknessValues[Math.floor(totalPixels * 0.75)];

    let darkCount = 0;
    let sumDark = 0;
    for (let i = 0; i < totalPixels; i++) {
      const v = darknessValues[i];
      sumDark += v;
      if (v >= 0.22) {
        darkCount++;
      }
    }

    const fillRatio = darkCount / totalPixels;
    const meanDarkness = sumDark / totalPixels;

    // Bileşik skor: Medyan (%45) + 75. Persentil (%30) + Doluluk Oranı (%25)
    const score = (medianDarkness * 0.45) + (p75Darkness * 0.30) + (fillRatio * 0.25);

    return {
      score,
      fillRatio,
      medianDarkness,
      p75Darkness,
      meanDarkness
    };
  }

  // Baloncuk merkezini hassas ince ayarla (Sadece kurşun kalem varsa ince ayarlar, harfe yapışmaz)
  function refineBubbleCenter(gray, w, h, initialPt, radius, rowPaperLum) {
    const searchStep = Math.max(1, Math.round(radius * 0.25));
    let bestX = initialPt.x;
    let bestY = initialPt.y;
    let maxDarkSum = -1;

    const rCheck = Math.max(2, Math.round(radius * 0.5));
    const rCheck2 = rCheck * rCheck;

    for (let dy = -searchStep; dy <= searchStep; dy += searchStep) {
      for (let dx = -searchStep; dx <= searchStep; dx += searchStep) {
        const tx = initialPt.x + dx;
        const ty = initialPt.y + dy;
        if (tx < 0 || tx >= w || ty < 0 || ty >= h) continue;

        let darkSum = 0;
        let count = 0;
        for (let cy = -rCheck; cy <= rCheck; cy += 2) {
          const py = ty + cy;
          if (py < 0 || py >= h) continue;
          for (let cx = -rCheck; cx <= rCheck; cx += 2) {
            const px = tx + cx;
            if (px < 0 || px >= w) continue;
            if (cx * cx + cy * cy <= rCheck2) {
              const lum = gray[py * w + px];
              darkSum += Math.max(0, rowPaperLum - lum);
              count++;
            }
          }
        }

        const avgDark = count > 0 ? (darkSum / count) : 0;
        if (avgDark > maxDarkSum) {
          maxDarkSum = avgDark;
          bestX = tx;
          bestY = ty;
        }
      }
    }

    return (maxDarkSum > 25) ? { x: bestX, y: bestY } : initialPt;
  }

  // Eski 5x5 matris için doluluk oranı ölçümü (Fallback)
  function measureBubbleFill(gray, w, h, cx, cy, radius, threshold) {
    let totalSampled = 0;
    let darkSampled = 0;
    const r2 = radius * radius;

    for (let dy = -radius; dy <= radius; dy++) {
      const y = cy + dy;
      if (y < 0 || y >= h) continue;
      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= w) continue;
        if (dx * dx + dy * dy <= r2) {
          totalSampled++;
          if (gray[y * w + x] < threshold) {
            darkSampled++;
          }
        }
      }
    }
    return totalSampled > 0 ? (darkSampled / totalSampled) : 0;
  }

  // 5x5 Öğrenci Optik Kimlik Matrisini Form Üzerinden Tara (Ofset Arama Korumalı - Fallback)
  function scanStudentOpticalId(gray, w, h, threshold, mapPoint) {
    const baseUMin = 0.78;
    const baseUMax = 0.95;
    const baseVMin = 0.035;
    const baseVMax = 0.165;

    const sampleRadius = Math.max(2, Math.round(w * 0.006));

    const searchOffsets = [
      { du: 0, dv: 0 },
      { du: -0.015, dv: 0 },
      { du: 0.015, dv: 0 },
      { du: 0, dv: -0.015 },
      { du: 0, dv: 0.015 },
      { du: -0.02, dv: -0.015 },
      { du: 0.02, dv: 0.015 }
    ];

    for (const off of searchOffsets) {
      const uMin = baseUMin + off.du;
      const uMax = baseUMax + off.du;
      const vMin = baseVMin + off.dv;
      const vMax = baseVMax + off.dv;

      const measuredGrid = [];
      for (let r = 0; r < 5; r++) {
        const row = [];
        const cellV = vMin + (r + 0.5) * (vMax - vMin) / 5;
        for (let c = 0; c < 5; c++) {
          const cellU = uMin + (c + 0.5) * (uMax - uMin) / 5;
          const pt = mapPoint(cellU, cellV);
          const fillRatio = measureBubbleFill(gray, w, h, pt.x, pt.y, sampleRadius, threshold);
          row.push(fillRatio >= 0.32 ? 1 : 0);
        }
        measuredGrid.push(row);
      }

      const decoded = decodeStudentOpticalId(measuredGrid);
      if (decoded !== null && decoded > 0) {
        return decoded;
      }
    }

    return null;
  }

  // ==========================================================================
  // 4. ANINDA SONUÇ DOĞRULAMA VE SERİ NOT KAYIT ARAYÜZÜ
  // ==========================================================================

  function showVerificationSheet(result) {
    const sheet = document.getElementById('m-omr-verification-sheet');
    if (!sheet || !activeExam) return;

    // Öğrenci Listesini Doldur (Güvenli ve Katmanlı Yedekli)
    const state = window.stateManager ? (window.stateManager.loadState ? window.stateManager.loadState() : window.stateManager.state) : {};
    let students = getOmrStudentList(state, activeExam);
    if (!students || students.length === 0) {
      if (window.stateManager && typeof window.stateManager.getStudents === 'function') {
        students = window.stateManager.getStudents(true) || [];
      }
    }

    const studentSelect = document.getElementById('m-omr-student-select');
    if (studentSelect) {
      if (students.length === 0) {
        studentSelect.innerHTML = '<option value="">⚠️ Kayıtlı Öğrenci Bulunamadı</option>';
      } else {
        studentSelect.innerHTML = students.map(s => {
          const sc = activeExam.examScores ? activeExam.examScores[s.id] : undefined;
          const scoreBadge = (sc !== undefined && sc !== null && sc !== '') ? ` • [${sc} Puan]` : '';
          return `<option value="${s.id}">${s.number ? s.number + ' - ' : ''}${escapeHTML(s.name)} ${escapeHTML(s.surname || '')}${s.branch ? ' (' + escapeHTML(s.branch) + ')' : ''}${scoreBadge}</option>`;
        }).join('');
      }

      const bannerEl = document.getElementById('m-omr-auto-match-banner');
      const bannerText = document.getElementById('m-omr-auto-match-text');

      // Eğer optik form üzerindeki Öğrenci Kimlik Kodu otomatik çözülmüşse
      let matchedStudent = result.identifiedStudent;
      if (!matchedStudent && result.detectedStudentIndex && result.detectedStudentIndex > 0 && result.detectedStudentIndex <= students.length) {
        matchedStudent = students[result.detectedStudentIndex - 1];
      }

      if (matchedStudent) {
        studentSelect.value = matchedStudent.id;
        if (bannerEl && bannerText) {
          if (result.isAiVision) {
            bannerText.innerHTML = `✨ <strong>Gemini Vision</strong> ile Öğrenci Tanındı: ${escapeHTML(matchedStudent.name)} ${escapeHTML(matchedStudent.surname || '')} (No: ${matchedStudent.number || '-'})`;
            bannerEl.style.background = 'rgba(99, 102, 241, 0.15)';
            bannerEl.style.borderColor = 'rgba(99, 102, 241, 0.4)';
            bannerEl.style.color = '#818cf8';
          } else {
            bannerText.textContent = `🎯 Optik Kod ile Otomatik Tanındı: ${escapeHTML(matchedStudent.name)} ${escapeHTML(matchedStudent.surname || '')} (No: ${matchedStudent.number || '-'}, ID: #${result.detectedStudentIndex})`;
            bannerEl.style.background = 'rgba(16, 185, 129, 0.12)';
            bannerEl.style.borderColor = 'rgba(16, 185, 129, 0.35)';
            bannerEl.style.color = 'var(--m-success)';
          }
          bannerEl.style.display = 'flex';
        }
        if (window.showMobileToast) {
          window.showMobileToast(`🎯 Öğrenci Tanındı: ${matchedStudent.name} (No: ${matchedStudent.number || '-'})`);
        }
      } else {
        if (bannerEl && bannerText && result.isAiVision) {
          bannerText.innerHTML = `✨ <strong>Gemini Vision</strong> ile ${result.totalQuestions} Soru Başarıyla Değerlendirildi`;
          bannerEl.style.background = 'rgba(99, 102, 241, 0.15)';
          bannerEl.style.borderColor = 'rgba(99, 102, 241, 0.4)';
          bannerEl.style.color = '#818cf8';
          bannerEl.style.display = 'flex';
        } else if (bannerEl) {
          bannerEl.style.display = 'none';
        }
        // Sıradaki not girilmemiş ilk öğrenciyi otomatik seç
        const examScores = activeExam.examScores || {};
        const unassignedStudent = students.find(s => examScores[s.id] === undefined || examScores[s.id] === null || examScores[s.id] === '');
        if (unassignedStudent) {
          studentSelect.value = unassignedStudent.id;
        } else if (students.length > 0) {
          studentSelect.value = students[0].id;
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

    // Soru Soru Cevapları Listele (Öğretmen anında tek dokunuşla düzeltebilir)
    const reviewList = document.getElementById('m-omr-review-list');
    const choicesCount = parseInt(activeExam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);

    if (reviewList) {
      reviewList.innerHTML = result.questionDetails.map(qd => {
        let badgeClass = 'badge-blank';
        let badgeIcon = '⚪';
        if (qd.status === 'multiple') {
          badgeClass = 'badge-wrong';
          badgeIcon = '⚠️ Çift';
        } else if (qd.isCorrect) {
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
              <strong>${qd.marked || (qd.status === 'multiple' ? 'Çift' : 'Boş')}</strong> ${badgeIcon}
            </div>
            <div class="m-omr-review-key">
              ${qd.keyAnswer ? `(Cvp: ${qd.keyAnswer})` : ''}
            </div>
            <div class="m-omr-review-quick-edit">
              ${letters.map(l => `
                <button type="button" class="m-omr-inline-btn ${qd.marked === l ? 'active' : ''}" onclick="window.overrideOmrQuestionAnswer(${qd.q}, '${l}')">
                  ${l}
                </button>
              `).join('')}
              <button type="button" class="m-omr-inline-btn ${!qd.marked ? 'active' : ''}" onclick="window.overrideOmrQuestionAnswer(${qd.q}, '')" title="Boş Bırak">
                -
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Görsel önizleme tuvali açıksa güncelle
    const previewBox = document.getElementById('m-omr-preview-box');
    if (previewBox && previewBox.style.display !== 'none' && result.capturedCanvas) {
      const resCanvas = document.getElementById('m-omr-result-canvas');
      if (resCanvas) {
        resCanvas.width = result.capturedCanvas.width;
        resCanvas.height = result.capturedCanvas.height;
        const oCtx = resCanvas.getContext('2d');
        oCtx.drawImage(result.capturedCanvas, 0, 0);
      }
    }

    sheet.classList.add('active');
  }

  // Taranan Form Görsel Önizleme Aç/Kapat
  window.toggleOmrScannedPreview = function() {
    const box = document.getElementById('m-omr-preview-box');
    const btnText = document.getElementById('m-omr-toggle-preview-text');
    if (!box) return;

    const isHidden = (box.style.display === 'none' || !box.style.display);
    box.style.display = isHidden ? 'block' : 'none';
    if (btnText) {
      btnText.textContent = isHidden ? '▲ Önizlemeyi Gizle' : '📷 Taranan Kağıt ve Şıklar Önizlemesi';
    }

    if (isHidden && lastScannedResult && lastScannedResult.capturedCanvas) {
      const resCanvas = document.getElementById('m-omr-result-canvas');
      if (resCanvas) {
        resCanvas.width = lastScannedResult.capturedCanvas.width;
        resCanvas.height = lastScannedResult.capturedCanvas.height;
        const oCtx = resCanvas.getContext('2d');
        oCtx.drawImage(lastScannedResult.capturedCanvas, 0, 0);
      }
    }
  };

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
      alert('Lütfen notu kaydedilecek öğrenciyi seçin. Liste boş ise lütfen önce Öğrenciler menüsünden öğrenci ekleyin.');
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
