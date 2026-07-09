(() => {
  // Written Exam Creator Tool Module

  let toastCallbackFn = null;
  
  // Local state for the exam sheet
  let examState = {
    schoolName: '................................ ORTAOKULU',
    schoolYear: '2025-2026 EĞİTİM ÖĞRETİM YILI',
    examTitle: 'MATEMATİK DERSİ 1. DÖNEM 1. YAZILI SINAVI',
    questionCount: 5,
    questionSpacing: 40,
    duration: '40 Dakika',
    pointsDescription: 'Her soru 20 puandır.',
    teacherName: 'Ders Öğretmeni',
    questionImages: {}, // index -> imageSrc (objectURL or Base64)
    columnsCount: '1',
    questionScales: {}, // index -> scale factor (default: 1.0)
    maarifMode: false,
    questionKazanimlar: {} // index -> kazanim text
  };

  let activeSingleUploadIndex = null;

  // DOM Elements
  let toolsLandingView;
  let toolsWrittenExamView;
  let btnLaunchWrittenExam;
  let btnBackToToolsFromWrittenExam;

  let schoolInput;
  let yearInput;
  let titleInput;
  let questionsCountInput;
  let questionSpacingSlider;
  let questionSpacingVal;
  let durationInput;
  let pointsInput;
  let teacherInput;
  let columnsInput;
  let maarifModeInput;

  let btnTopUpload;
  let inputFiles;
  let btnPrint;
  let previewSheet;

  // Single question input
  let singleFileInput;

  function setupWrittenExamTool(toastCallback) {
    toastCallbackFn = toastCallback;

    // DOM Bindings
    toolsLandingView = document.getElementById('tools-landing-view');
    toolsWrittenExamView = document.getElementById('tools-written-exam-view');
    btnLaunchWrittenExam = document.getElementById('btn-launch-written-exam');
    btnBackToToolsFromWrittenExam = document.getElementById('btn-back-to-tools-from-written-exam');

    schoolInput = document.getElementById('written-exam-school-input');
    yearInput = document.getElementById('written-exam-year-input');
    titleInput = document.getElementById('written-exam-title-input');
    questionsCountInput = document.getElementById('written-exam-questions-count');
    questionSpacingSlider = document.getElementById('written-exam-question-spacing');
    questionSpacingVal = document.getElementById('written-exam-question-spacing-val');
    durationInput = document.getElementById('written-exam-duration-input');
    pointsInput = document.getElementById('written-exam-points-input');
    teacherInput = document.getElementById('written-exam-teacher-input');
    columnsInput = document.getElementById('written-exam-columns-count');
    maarifModeInput = document.getElementById('written-exam-maarif-mode');

    btnTopUpload = document.getElementById('btn-written-exam-upload-questions');
    inputFiles = document.getElementById('input-written-exam-files');
    btnPrint = document.getElementById('btn-print-written-exam');
    previewSheet = document.getElementById('written-exam-preview-sheet');

    // Create a hidden input for single question file upload
    singleFileInput = document.createElement('input');
    singleFileInput.type = 'file';
    singleFileInput.accept = 'image/*';
    singleFileInput.style.display = 'none';
    document.body.appendChild(singleFileInput);

    // Initial load from DOM inputs
    readInputs();

    // 1. Navigation
    if (btnLaunchWrittenExam) {
      btnLaunchWrittenExam.addEventListener('click', () => {
        if (toolsLandingView) toolsLandingView.style.display = 'none';
        if (toolsWrittenExamView) toolsWrittenExamView.style.display = 'block';
        renderWrittenExam();
      });
    }

    if (btnBackToToolsFromWrittenExam) {
      btnBackToToolsFromWrittenExam.addEventListener('click', () => {
        if (toolsWrittenExamView) toolsWrittenExamView.style.display = 'none';
        if (toolsLandingView) toolsLandingView.style.display = 'block';
      });
    }

    // 2. Input change listeners
    const inputs = [schoolInput, yearInput, titleInput, durationInput, pointsInput, teacherInput];
    inputs.forEach(el => {
      if (el) {
        el.addEventListener('input', () => {
          readInputs();
          drawPreviewSheet();
        });
      }
    });

    if (questionsCountInput) {
      questionsCountInput.addEventListener('input', () => {
        let val = parseInt(questionsCountInput.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 20) val = 20;
        examState.questionCount = val;
        drawPreviewSheet();
      });
    }

    if (columnsInput) {
      columnsInput.addEventListener('change', () => {
        readInputs();
        drawPreviewSheet();
      });
    }

    if (maarifModeInput) {
      maarifModeInput.addEventListener('change', () => {
        readInputs();
        drawPreviewSheet();
      });
    }

    if (questionSpacingSlider) {
      questionSpacingSlider.addEventListener('input', () => {
        const val = parseInt(questionSpacingSlider.value) || 40;
        examState.questionSpacing = val;
        if (questionSpacingVal) questionSpacingVal.textContent = `${val}px`;
        
        // Redraw preview sheet to recalculate dynamic A4 pages pagination
        drawPreviewSheet();
      });
    }

    // 3. File upload listeners
    if (btnTopUpload && inputFiles) {
      btnTopUpload.addEventListener('click', () => {
        inputFiles.click();
      });

      inputFiles.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        let slotIdx = 0;
        files.forEach(file => {
          // Find next empty slot
          while (slotIdx < examState.questionCount && examState.questionImages[slotIdx]) {
            slotIdx++;
          }
          if (slotIdx < examState.questionCount) {
            const url = URL.createObjectURL(file);
            examState.questionImages[slotIdx] = url;
            slotIdx++;
          }
        });

        inputFiles.value = ''; // clear
        drawPreviewSheet();
        if (toastCallbackFn) toastCallbackFn(`${files.length} soru görseli yerleştirildi.`, 'success');
      });
    }

    // Single slot upload listener
    singleFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file || activeSingleUploadIndex === null) return;

      const url = URL.createObjectURL(file);
      examState.questionImages[activeSingleUploadIndex] = url;

      singleFileInput.value = ''; // clear
      drawPreviewSheet();
      if (toastCallbackFn) toastCallbackFn(`Soru ${activeSingleUploadIndex + 1} görseli güncellendi.`, 'success');
    });

    // 4. Printing
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        // Print elementini oluştur ve body'ye ekle
        let printDiv = document.querySelector('.written-exam-report-print');
        if (!printDiv) {
          printDiv = document.createElement('div');
          printDiv.className = 'written-exam-report-print';
          document.body.appendChild(printDiv);
        }
        
        // İçeriği kopyala
        printDiv.innerHTML = previewSheet.innerHTML;
        
        // Print modunu aktif et
        document.body.classList.add('print-written-exam');
        
        // Yazdır
        window.print();
        
        // Yazdırma sonrası sınıfı kaldır
        setTimeout(() => {
          document.body.classList.remove('print-written-exam');
        }, 500);
      });
    }
  }

  function readInputs() {
    if (schoolInput) examState.schoolName = schoolInput.value.trim();
    if (yearInput) examState.schoolYear = yearInput.value.trim();
    if (titleInput) examState.examTitle = titleInput.value.trim();
    if (durationInput) examState.duration = durationInput.value.trim();
    if (pointsInput) examState.pointsDescription = pointsInput.value.trim();
    if (teacherInput) examState.teacherName = teacherInput.value.trim();
    if (questionsCountInput) {
      const val = parseInt(questionsCountInput.value);
      examState.questionCount = isNaN(val) ? 5 : val;
    }
    if (questionSpacingSlider) {
      examState.questionSpacing = parseInt(questionSpacingSlider.value) || 40;
    }
    if (columnsInput) {
      examState.columnsCount = columnsInput.value;
    }
    if (maarifModeInput) {
      examState.maarifMode = maarifModeInput.checked;
    }
  }

  function drawPreviewSheet() {
    if (!previewSheet) return;
    previewSheet.innerHTML = '';

    const pointsPerQuestion = (100 / examState.questionCount).toFixed(0);
    const pointsDescr = examState.pointsDescription === 'Her soru 20 puandır.'
      ? `Her soru ${pointsPerQuestion} puandır.` 
      : examState.pointsDescription;

    if (pointsInput && pointsInput.value === 'Her soru 20 puandır.') {
      pointsInput.value = pointsDescr;
      examState.pointsDescription = pointsDescr;
    }

    const headerHtml = `
      <!-- Başlık ve Okul/Yıl Bilgileri -->
      <div style="text-align: center; font-weight: bold; font-size: 10pt; line-height: 1.4; margin-bottom: 1.25rem;">
        <div style="font-size: 11pt; text-transform: uppercase; letter-spacing: 0.5px;">${examState.schoolName}</div>
        <div style="font-size: 9.5pt; font-weight: normal; margin-top: 3px;">${examState.schoolYear}</div>
        <div style="font-size: 10.5pt; margin-top: 8px; letter-spacing: 0.5px; color: #111;">${examState.examTitle}</div>
      </div>

      <!-- Öğrenci Bilgileri -->
      <table style="width: 100%; border: 1.5px solid black; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 9pt;">
        <tr>
          <td style="width: 50%; border: 1.5px solid black; padding: 0.5rem; text-align: left;">
            <strong>Öğrencinin Adı Soyadı:</strong> ............................................................................
          </td>
          <td style="width: 25%; border: 1.5px solid black; padding: 0.5rem; text-align: left;">
            <strong>Sınıfı / Şubesi:</strong> ............. / .............
          </td>
          <td style="width: 25%; border: 1.5px solid black; padding: 0.5rem; text-align: left;">
            <strong>Okul Numarası:</strong> .............................
          </td>
        </tr>
      </table>
    `;

    const footerHtml = `
      <div style="border-top: 1.5px solid black; padding-top: 0.5rem; margin-top: auto; display: flex; justify-content: space-between; font-size: 9pt; font-weight: bold; page-break-inside: avoid;">
        <div style="text-align: left; line-height: 1.5;">
          <div><strong>Sınav Süresi:</strong> ${examState.duration}</div>
          <div><strong>Değerlendirme:</strong> ${examState.pointsDescription}</div>
        </div>
        <div style="text-align: center; width: 220px; line-height: 1.5;">
          <div>${examState.teacherName}</div>
          <div style="margin-top: 1.5rem; font-size: 8pt; font-weight: normal; color: #555;">İmza / Başarılar Dilerim.</div>
        </div>
      </div>
    `;

    const isTwoCols = examState.columnsCount === '2';
    const gridClass = isTwoCols ? 'print-exam-questions-grid cols-2' : '';
    const gridStyle = isTwoCols 
      ? 'display: grid !important; grid-template-columns: repeat(2, 1fr) !important; column-gap: 20px !important;' 
      : 'display: flex !important; flex-direction: column !important;';

    // Helper to create page elements
    function createNewPage(pageNum) {
      const page = document.createElement('div');
      page.className = 'written-exam-page';
      page.innerHTML = `
        <div class="page-content-area" style="flex-grow: 1; display: flex; flex-direction: column; width: 100%;">
          ${pageNum === 1 ? headerHtml : ''}
          <div class="page-questions-grid ${gridClass}" style="${gridStyle}"></div>
        </div>
        <div class="page-footer-container" style="width: 100%; margin-top: auto;"></div>
      `;
      return page;
    }

    // Helper to generate question HTML string
    function getQuestionHtml(i) {
      const img = examState.questionImages[i];
      const scale = examState.questionScales[i] || 1.0;
      const maxHeight = Math.round(200 * scale);
      let imgContent = '';

      if (img) {
        imgContent = `
          <img src="${img}" style="width: auto; height: ${maxHeight}px; max-width: 100%; object-fit: contain;">
          <button class="btn-delete-question-img" data-idx="${i}" title="Görseli Kaldır">×</button>
        `;
      } else {
        imgContent = `
          <div class="print-exam-placeholder-text">
            <i data-lucide="image" style="width: 20px; height: 20px; opacity: 0.6;"></i>
            <span>Soru ${i + 1} görselini yüklemek için tıklayın</span>
            <span style="font-size: 0.7rem; opacity: 0.7;">(veya sürükleyip bırakın)</span>
          </div>
        `;
      }

      const controlsHtml = img ? `
        <div class="exam-question-controls" style="display: flex; gap: 4px; align-items: center;">
          <button class="btn-question-scale" data-action="decrease" data-idx="${i}" title="Küçült" style="padding: 2px 6px; font-size: 0.75rem; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 3px; font-weight: bold; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; color: #333;">-</button>
          <span style="font-size: 0.75rem; color: #666; font-weight: bold; width: 32px; text-align: center;">%${Math.round(scale * 100)}</span>
          <button class="btn-question-scale" data-action="increase" data-idx="${i}" title="Büyüt" style="padding: 2px 6px; font-size: 0.75rem; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 3px; font-weight: bold; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; color: #333;">+</button>
        </div>
      ` : '';

      const kazanimHtml = examState.maarifMode ? `
        <input type="text" class="written-exam-kazanim-input" data-idx="${i}" placeholder="Kazanım giriniz..." value="${examState.questionKazanimlar[i] || ''}" style="font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif; font-size: 9pt; border: none; border-bottom: 1px dashed #7f8c8d; background: transparent; padding: 1px 4px; width: 70%; max-width: 250px; color: #000; box-sizing: border-box;">
      ` : '';

      return `
        <div class="print-exam-question-item" data-qidx="${i}" style="margin-bottom: 20px !important;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
            <div style="display: flex; align-items: center; gap: 8px; flex-grow: 1;">
              <div style="font-weight: bold; font-size: 10pt; text-align: left; white-space: nowrap;">SORU ${i + 1})</div>
              ${kazanimHtml}
            </div>
            ${controlsHtml}
          </div>
          <div class="print-exam-question-image-wrapper" data-idx="${i}" style="min-height: 80px; width: 100%; padding: 5px; box-sizing: border-box; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start;">
            ${imgContent}
            <div class="print-exam-answer-space" style="height: ${examState.questionSpacing}px; width: 100%;"></div>
          </div>
        </div>
      `;
    }

    // Dynamic Pagination Loop
    let pageNum = 1;
    let currentPage = createNewPage(pageNum);
    previewSheet.appendChild(currentPage);
    let currentGrid = currentPage.querySelector('.page-questions-grid');

    for (let i = 0; i < examState.questionCount; i++) {
      const qHtml = getQuestionHtml(i);
      
      // Temporary append to grid
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = qHtml;
      const qEl = tempDiv.firstElementChild;
      
      currentGrid.appendChild(qEl);

      // Check overflow
      if (currentPage.scrollHeight > currentPage.clientHeight) {
        // Overflow! Remove it
        currentGrid.removeChild(qEl);
        
        // Start Page 2+
        pageNum++;
        currentPage = createNewPage(pageNum);
        previewSheet.appendChild(currentPage);
        currentGrid = currentPage.querySelector('.page-questions-grid');
        
        // Append to new page grid
        currentGrid.appendChild(qEl);
      }
    }

    // Now append footer to the last page
    const footerContainer = currentPage.querySelector('.page-footer-container');
    footerContainer.innerHTML = footerHtml;

    // Check if footer causes overflow on the last page
    if (currentPage.scrollHeight > currentPage.clientHeight && currentGrid.children.length > 0) {
      // Yes, it overflows! Let's move the last question to a new page
      const lastQ = currentGrid.lastElementChild;
      currentGrid.removeChild(lastQ);
      
      // Clear footer from current page
      footerContainer.innerHTML = '';
      
      // Create a final page
      pageNum++;
      currentPage = createNewPage(pageNum);
      previewSheet.appendChild(currentPage);
      currentGrid = currentPage.querySelector('.page-questions-grid');
      
      // Append the question and the footer to the new final page
      currentGrid.appendChild(lastQ);
      currentPage.querySelector('.page-footer-container').innerHTML = footerHtml;
    }

    // Attach click and drag-drop events to dynamically rendered slots
    previewSheet.querySelectorAll('.print-exam-question-image-wrapper').forEach(wrapper => {
      const idx = parseInt(wrapper.getAttribute('data-idx'));

      wrapper.addEventListener('click', (e) => {
        // If clicking delete button, ignore trigger click upload
        if (e.target.classList.contains('btn-delete-question-img')) return;

        activeSingleUploadIndex = idx;
        singleFileInput.click();
      });

      // Drag and Drop listeners
      wrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        wrapper.style.borderColor = 'var(--primary)';
        wrapper.style.backgroundColor = '#eef2ff';
      });

      wrapper.addEventListener('dragleave', (e) => {
        e.preventDefault();
        wrapper.style.borderColor = '#7f8c8d';
        wrapper.style.backgroundColor = '#f8f9fa';
      });

      wrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        wrapper.style.borderColor = '#7f8c8d';
        wrapper.style.backgroundColor = '#f8f9fa';

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          examState.questionImages[idx] = url;
          drawPreviewSheet();
          if (toastCallbackFn) toastCallbackFn(`Soru ${idx + 1} görseli yerleştirildi.`, 'success');
        }
      });
    });

    // Attach delete handlers
    previewSheet.querySelectorAll('.btn-delete-question-img').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'));
        delete examState.questionImages[idx];
        delete examState.questionScales[idx];
        drawPreviewSheet();
        if (toastCallbackFn) toastCallbackFn(`Soru ${idx + 1} görseli kaldırıldı.`, 'info');
      });
    });

    // Attach scale handlers
    previewSheet.querySelectorAll('.btn-question-scale').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'));
        const action = btn.getAttribute('data-action');
        
        let currentScale = examState.questionScales[idx] || 1.0;
        if (action === 'increase') {
          currentScale = Math.min(3.0, currentScale + 0.1);
        } else if (action === 'decrease') {
          currentScale = Math.max(0.4, currentScale - 0.1);
        }
        
        examState.questionScales[idx] = parseFloat(currentScale.toFixed(1));
        drawPreviewSheet();
      });
    });

    // Attach kazanim change handlers
    previewSheet.querySelectorAll('.written-exam-kazanim-input').forEach(input => {
      input.addEventListener('input', () => {
        const idx = parseInt(input.getAttribute('data-idx'));
        examState.questionKazanimlar[idx] = input.value;
      });
    });

    // Re-create icons for placeholders
    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }
  }

  function renderWrittenExam() {
    readInputs();
    drawPreviewSheet();
  }

  // Expose module globally
  window.setupWrittenExamTool = setupWrittenExamTool;
  window.renderWrittenExam = renderWrittenExam;

})();
