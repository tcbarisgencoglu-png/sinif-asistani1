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

let activeExam = null;
let toastCallback = null;

function setupWeeklyTab(showToast) {
  toastCallback = showToast;

  // Sınav Ekleme Modalı Açılış
  if (btnAddWeeklyExam) {
    btnAddWeeklyExam.addEventListener('click', () => {
      if (formAddExam) formAddExam.reset();
      if (examPenaltyContainer) examPenaltyContainer.style.display = 'none';
      
      const weekInput = document.getElementById('exam-week-input');
      if (weekInput) weekInput.value = stateManager.getSelectedWeek();

      // Şube seçeneklerini doldur
      const state = stateManager.loadState();
      const examBranchInput = document.getElementById('exam-branch-input');
      if (examBranchInput) {
        examBranchInput.innerHTML = '';
        const branches = [...new Set(state.students.map(s => s.branch).filter(Boolean))];
        branches.sort();
        branches.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b;
          opt.textContent = b;
          examBranchInput.appendChild(opt);
        });
      }

      if (modalAddExam) modalAddExam.classList.add('active');
    });
  }

  // Yanlışlar doğruları etkilesin mi checkbox kontrolü
  if (examWrongAffectsInput && examPenaltyContainer) {
    examWrongAffectsInput.addEventListener('change', () => {
      examPenaltyContainer.style.display = examWrongAffectsInput.checked ? 'block' : 'none';
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

      const examData = {
        id: 'exam_' + Date.now(),
        weekId: week,
        examName: name,
        totalQuestions: questions,
        duration: duration,
        wrongAffects: wrongAffects,
        penaltyRate: penaltyRate,
        branch: examBranch,
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
        const parts = selectedWeek.split('-W');
        const formattedWeek = parts.length === 2 ? `${parts[0]} Yılı, ${parts[1]}. Hafta` : selectedWeek;
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
        
        const parts = targetExam.weekId.split('-W');
        const formattedWeek = parts.length === 2 ? `${parts[0]} Yılı, ${parts[1]}. Hafta` : targetExam.weekId;
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

  // Optik Form Butonu Tıklanması (Modal Açılış)
  if (btnPrintOpticalForms) {
    btnPrintOpticalForms.addEventListener('click', () => {
      if (!activeExam) {
        if (toastCallback) toastCallback('Lütfen önce bir sınav seçin!', 'warning');
        return;
      }
      
      const questionCountInput = document.getElementById('optical-questions-input');
      if (questionCountInput) {
        questionCountInput.value = activeExam.totalQuestions;
        questionCountInput.disabled = true; // Sınavın soru sayısı değiştirilemez
      }
      
      populateOpticalStudentsList();
      updateOpticalLivePreview();
      if (modalPrintOptical) modalPrintOptical.classList.add('active');
    });
  }

  const opticalQInput = document.getElementById('optical-questions-input');
  const opticalCInput = document.getElementById('optical-choices-input');
  if (opticalQInput) {
    opticalQInput.addEventListener('input', updateOpticalLivePreview);
  }
  if (opticalCInput) {
    opticalCInput.addEventListener('change', updateOpticalLivePreview);
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
      
      // Seçili öğrencileri al
      const selectedStudentIds = [];
      opticalStudentsList.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        selectedStudentIds.push(cb.value);
      });
      
      if (selectedStudentIds.length === 0) {
        if (toastCallback) toastCallback('Lütfen en az bir öğrenci seçin!', 'warning');
        return;
      }
      
      // Formları oluştur
      generateOpticalFormsHTML(selectedStudentIds, questionCount, choicesCount);
      
      // Kapat modalı
      if (modalPrintOptical) modalPrintOptical.classList.remove('active');
      
      // Yazdır
      document.body.classList.add('print-optical');
      window.print();
      
      window.addEventListener('afterprint', () => {
        document.body.classList.remove('print-optical');
      }, { once: true });

      setTimeout(() => {
        document.body.classList.remove('print-optical');
      }, 500);
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

  function getCardsPerPage(questionCount) {
    const qCols = questionCount <= 10 ? 1 : (questionCount <= 30 ? 2 : 3);
    const qRows = Math.ceil(questionCount / qCols);
    
    const headerHeight = 22; 
    const rowHeight = 3.8; 
    const paddingHeight = 10;
    const cardHeight = headerHeight + (qRows * rowHeight) + paddingHeight;
    
    const pageHeight = 280; 
    const cardRows = Math.floor(pageHeight / cardHeight);
    
    const rows = Math.max(1, Math.min(4, cardRows));
    return rows * 2; 
  }

  function updateOpticalLivePreview() {
    const previewContainer = document.getElementById('optical-live-preview');
    if (!previewContainer) return;
    previewContainer.innerHTML = '';

    const questionCountInput = document.getElementById('optical-questions-input');
    const choicesCountInput = document.getElementById('optical-choices-input');
    if (!questionCountInput || !choicesCountInput) return;

    const questionCount = parseInt(questionCountInput.value) || 20;
    const choicesCount = parseInt(choicesCountInput.value) || 4;

    const state = stateManager.loadState();
    
    let checkedStudentIds = [];
    if (opticalStudentsList) {
      opticalStudentsList.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        checkedStudentIds.push(cb.value);
      });
    }

    if (checkedStudentIds.length === 0) {
      checkedStudentIds = ['sample_preview_student'];
    }

    const cardsPerPage = getCardsPerPage(questionCount);
    const pageCount = Math.ceil(checkedStudentIds.length / cardsPerPage);

    const letters = ['A', 'B', 'C', 'D', 'E'];
    const activeLetters = letters.slice(0, choicesCount);
    
    const cols = questionCount <= 10 ? 1 : (questionCount <= 30 ? 2 : 3);
    const questionsPerCol = Math.ceil(questionCount / cols);
    
    const sortedStudents = [...state.students].sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    for (let p = 0; p < pageCount; p++) {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'optical-page';
      
      const startIdx = p * cardsPerPage;
      const endIdx = Math.min((p + 1) * cardsPerPage, checkedStudentIds.length);
      
      for (let i = startIdx; i < endIdx; i++) {
        const studentId = checkedStudentIds[i];
        let studentName = 'Örnek Öğrenci';
        let studentNo = '123';
        
        if (studentId !== 'sample_preview_student') {
          const student = state.students.find(s => s.id === studentId);
          if (student) {
            studentName = `${student.name} ${student.surname}`;
            studentNo = student.number;
          }
        }

        const card = document.createElement('div');
        card.className = 'optical-form-card';

        let headerHTML = `
          <div class="optical-form-header">
            <h4>Haftalık Değerlendirme Cevap Formu</h4>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 2px;">
              <div class="optical-student-info">
                <div><strong>Adı Soyadı:</strong> ${studentName}</div>
                <div><strong>Sınıf / No:</strong> ${studentNo}</div>
              </div>
            </div>
          </div>
        `;

        let bodyHTML = '<div class="optical-form-body">';
        
        for (let c = 0; c < cols; c++) {
          let colHTML = '<div class="optical-form-column">';
          const startQ = c * questionsPerCol + 1;
          const endQ = Math.min((c + 1) * questionsPerCol, questionCount);
          
          for (let q = startQ; q <= endQ; q++) {
            let rowHTML = `
              <div class="optical-form-row">
                <span class="optical-form-qnum">${q}</span>
                <div class="optical-form-bubbles">
            `;
            
            activeLetters.forEach(l => {
              rowHTML += `<span class="optical-form-bubble">${l}</span>`;
            });
            
            rowHTML += `
                </div>
              </div>
            `;
            colHTML += rowHTML;
          }
          colHTML += '</div>';
          bodyHTML += colHTML;
        }
        
        bodyHTML += '</div>';
        
        card.innerHTML = headerHTML + bodyHTML;
        pageDiv.appendChild(card);
      }
      
      const pageIndicator = document.createElement('span');
      pageIndicator.style.position = 'absolute';
      pageIndicator.style.bottom = '8px';
      pageIndicator.style.right = '12px';
      pageIndicator.style.fontSize = '8px';
      pageIndicator.style.color = '#777';
      pageIndicator.style.fontWeight = 'bold';
      pageIndicator.textContent = `Sayfa ${p + 1} / ${pageCount}`;
      pageDiv.appendChild(pageIndicator);
      
      previewContainer.appendChild(pageDiv);
    }
  }

  function generateOpticalFormsHTML(studentIds, questionCount, choicesCount) {
    const printContainer = document.getElementById('optical-forms-print-container');
    if (!printContainer) return;
    printContainer.innerHTML = '';
    
    const state = stateManager.loadState();
    const cardsPerPage = getCardsPerPage(questionCount);
    const pageCount = Math.ceil(studentIds.length / cardsPerPage);
    
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const activeLetters = letters.slice(0, choicesCount);
    
    const cols = questionCount <= 10 ? 1 : (questionCount <= 30 ? 2 : 3);
    const questionsPerCol = Math.ceil(questionCount / cols);
    
    const sortedStudents = [...state.students].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    
    for (let p = 0; p < pageCount; p++) {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'optical-page';
      
      const startIdx = p * cardsPerPage;
      const endIdx = Math.min((p + 1) * cardsPerPage, studentIds.length);
      
      for (let i = startIdx; i < endIdx; i++) {
        const studentId = studentIds[i];
        const student = state.students.find(s => s.id === studentId);
        if (!student) continue;
        
        const card = document.createElement('div');
        card.className = 'optical-form-card';
        
        let headerHTML = `
          <div class="optical-form-header">
            <h4>Haftalık Değerlendirme Cevap Formu</h4>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 2px;">
              <div class="optical-student-info">
                <div><strong>Adı Soyadı:</strong> ${student.name} ${student.surname}</div>
                <div><strong>Sınıf / No:</strong> ${student.number}</div>
              </div>
            </div>
          </div>
        `;
        
        let bodyHTML = '<div class="optical-form-body">';
        
        for (let c = 0; c < cols; c++) {
          let colHTML = '<div class="optical-form-column">';
          const startQ = c * questionsPerCol + 1;
          const endQ = Math.min((c + 1) * questionsPerCol, questionCount);
          
          for (let q = startQ; q <= endQ; q++) {
            let rowHTML = `
              <div class="optical-form-row">
                <span class="optical-form-qnum">${q}</span>
                <div class="optical-form-bubbles">
            `;
            
            activeLetters.forEach(l => {
              rowHTML += `<span class="optical-form-bubble">${l}</span>`;
            });
            
            rowHTML += `
                </div>
              </div>
            `;
            colHTML += rowHTML;
          }
          colHTML += '</div>';
          bodyHTML += colHTML;
        }
        
        bodyHTML += '</div>';
        
        card.innerHTML = headerHTML + bodyHTML;
        pageDiv.appendChild(card);
      }
      printContainer.appendChild(pageDiv);
    }
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

    const parts = exam.weekId.split('-W');
    const formattedWeek = parts.length === 2 ? `${parts[0]} Yılı, ${parts[1]}. Hafta` : exam.weekId;
    const penaltyText = exam.wrongAffects ? `${exam.penaltyRate} Yanlış 1 Doğruyu Götürür` : 'Yanlışlar Doğruları Etkilemez';

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

  const parts = exam.weekId.split('-W');
  const formattedWeek = parts.length === 2 ? `${parts[0]} Yılı, ${parts[1]}. Hafta` : exam.weekId;
  const penaltyText = exam.wrongAffects ? `${exam.penaltyRate} Yanlış 1 Doğruyu Götürür` : 'Yanlışlar Doğruları Etkilemez';

  if (activeExamInfoBar) {
    activeExamInfoBar.innerHTML = `
      <span><strong>Hafta:</strong> ${formattedWeek}</span>
      <span>•</span>
      <span><strong>Soru Sayısı:</strong> ${exam.totalQuestions}</span>
      <span>•</span>
      <span><strong>Süre:</strong> ${exam.duration} Dk</span>
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
    const parts = selectedWeek.split('-W');
    const formattedWeek = parts.length === 2 ? `${parts[0]} Yılı, ${parts[1]}. Hafta` : selectedWeek;

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
          directionHtml: directionHtml
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
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd; font-weight: bold; background: rgba(0,0,0,0.01);">${ranking}</td>
      <td style="padding: 0.5rem; border-bottom: 1px solid #ddd;"><strong>${p.student.name} ${p.student.surname}</strong></td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd;">${p.student.branch || '-'}</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd; color: #10b981; font-weight: 500;">${p.correct}</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd; color: #ef4444; font-weight: 500;">${p.wrong}</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd; color: #f59e0b; font-weight: 500;">${p.blank}</td>
      <td style="text-align: center; padding: 0.5rem 0.25rem; border-bottom: 1px solid #ddd; font-weight: bold;">${p.net}</td>
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
