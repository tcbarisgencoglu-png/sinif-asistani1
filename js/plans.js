(() => {
  // Sınıf Asistanı Haftalık Yıllık Plan Takip Modülü

  let toastCallbackFn = null;
  let currentWorkbook = null;
  let currentSheetData = null;
  let activePlanId = null;
  let activePlansMainTab = 'weekly'; // 'weekly' veya 'general'
  let plansSelectedWeekCode = '';
  let expandedMonths = {}; // planId + '_' + monthName -> boolean
  let expandedPlans = {}; // planId -> boolean

  // DOM Elemanları
  let btnLaunchPlans;
  let toolsLandingView;
  let toolsPlansView;
  let btnBackToToolsFromPlans;

  // Tab Menu Elements
  let btnPlansTabWeekly;
  let btnPlansTabGeneral;
  let plansTabContentWeekly;
  let plansTabContentGeneral;

  // Weekly View DOM
  let btnPlansPrevWeek;
  let btnPlansNextWeek;
  let plansCurrentWeekLabel;
  let plansCurrentWeekDates;
  let plansWeeklyViewCards;
  let plansWeeklyEmptyState;
  let btnShowImportModalWeekly;
  let btnImportFirstPlanWeekly;
  let plansWeeklyNavBar;
  let weeklyPlanUploadBtnContainer;

  // General View DOM
  let plansGeneralListContainer;
  let plansGeneralEmptyState;
  let btnShowImportModalGeneral;
  let btnImportFirstPlanGeneral;

  // Import Modal DOM
  let modalImportPlan;
  let importStepFile;
  let importStepMapping;
  let planDragDropArea;
  let btnSelectPlanFile;
  let inputPlanFile;
  let planEducationYear;
  let planClassName;
  let planCourseNameInput;
  let planCourseNameSelect;
  let planCourseNameInputContainer;
  let planSelectSheet;
  let planStartYear;
  let planRowStart;
  let planPreviewTbody;
  let btnImportCancel;
  let btnImportSave;

  // Column Selectors
  let planColMonth;
  let planColWeek;
  let planColDateRange;
  let planColHours;
  let planColUnit;
  let planColOutcomes;
  let planColTopics;
  let planColDescriptions;
  let planColSpecial;
  let planColAssessment;
  let planColContent;

  // Copy-Paste Tabs
  let importTabFile;
  let importTabPaste;
  let panelImportFile;
  let panelImportPaste;
  let planPasteText;
  let btnParsePastedText;

  const TURKISH_MONTHS = {
    'ocak': 1, 'şubat': 2, 'mart': 3, 'nisan': 4, 'mayıs': 5, 'haziran': 6,
    'temmuz': 7, 'ağustos': 8, 'eylül': 9, 'ekim': 10, 'kasım': 11, 'aralık': 12,
    'oca': 1, 'şub': 2, 'mar': 3, 'nis': 4, 'may': 5, 'haz': 6,
    'tem': 7, 'ağu': 8, 'eyl': 9, 'eki': 10, 'kas': 11, 'ara': 12
  };

  function setupPlans(toastCallback) {
    toastCallbackFn = toastCallback;

    // DOM Elemanlarını Bağla
    btnLaunchPlans = document.getElementById('btn-launch-plans');
    toolsLandingView = document.getElementById('tools-landing-view');
    toolsPlansView = document.getElementById('tools-plans-view');
    btnBackToToolsFromPlans = document.getElementById('btn-back-to-tools-from-plans');

    // Tab buttons & contents
    btnPlansTabWeekly = document.getElementById('btn-plans-tab-weekly');
    btnPlansTabGeneral = document.getElementById('btn-plans-tab-general');
    plansTabContentWeekly = document.getElementById('plans-tab-content-weekly');
    plansTabContentGeneral = document.getElementById('plans-tab-content-general');

    // Weekly View
    btnPlansPrevWeek = document.getElementById('btn-plans-prev-week');
    btnPlansNextWeek = document.getElementById('btn-plans-next-week');
    plansCurrentWeekLabel = document.getElementById('plans-current-week-label');
    plansCurrentWeekDates = document.getElementById('plans-current-week-dates');
    plansWeeklyViewCards = document.getElementById('plans-weekly-view-cards');
    plansWeeklyEmptyState = document.getElementById('plans-weekly-empty-state');
    btnShowImportModalWeekly = document.getElementById('btn-show-import-modal-weekly');
    btnImportFirstPlanWeekly = document.getElementById('btn-import-first-plan-weekly');
    plansWeeklyNavBar = document.getElementById('plans-weekly-nav-bar');
    weeklyPlanUploadBtnContainer = document.getElementById('weekly-plan-upload-btn-container');

    // General View
    plansGeneralListContainer = document.getElementById('plans-general-list-container');
    plansGeneralEmptyState = document.getElementById('plans-general-empty-state');
    btnShowImportModalGeneral = document.getElementById('btn-show-import-modal-general');
    btnImportFirstPlanGeneral = document.getElementById('btn-import-first-plan-general');

    // Import Modal
    modalImportPlan = document.getElementById('modal-import-plan');
    importStepFile = document.getElementById('import-step-file');
    importStepMapping = document.getElementById('import-step-mapping');
    planDragDropArea = document.getElementById('plan-drag-drop-area');
    btnSelectPlanFile = document.getElementById('btn-select-plan-file');
    inputPlanFile = document.getElementById('input-plan-file');
    planEducationYear = document.getElementById('plan-education-year');
    planClassName = document.getElementById('plan-class-name');
    planCourseNameInput = document.getElementById('plan-course-name-input');
    planCourseNameSelect = document.getElementById('plan-course-name-select');
    planCourseNameInputContainer = document.getElementById('plan-course-name-input-container');
    planSelectSheet = document.getElementById('plan-select-sheet');
    planStartYear = document.getElementById('plan-start-year');
    planRowStart = document.getElementById('plan-row-start');
    planPreviewTbody = document.getElementById('plan-preview-tbody');
    btnImportCancel = document.getElementById('btn-import-cancel');
    btnImportSave = document.getElementById('btn-import-save');

    // Columns
    planColMonth = document.getElementById('plan-col-month');
    planColWeek = document.getElementById('plan-col-week');
    planColDateRange = document.getElementById('plan-col-date-range');
    planColHours = document.getElementById('plan-col-hours');
    planColUnit = document.getElementById('plan-col-unit');
    planColOutcomes = document.getElementById('plan-col-outcomes');
    planColTopics = document.getElementById('plan-col-topics');
    planColDescriptions = document.getElementById('plan-col-descriptions');
    planColSpecial = document.getElementById('plan-col-special');
    planColAssessment = document.getElementById('plan-col-assessment');
    planColContent = document.getElementById('plan-col-content');

    // Tabs for Source
    importTabFile = document.getElementById('import-tab-file');
    importTabPaste = document.getElementById('import-tab-paste');
    panelImportFile = document.getElementById('panel-import-file');
    panelImportPaste = document.getElementById('panel-import-paste');
    planPasteText = document.getElementById('plan-paste-text');
    btnParsePastedText = document.getElementById('btn-parse-pasted-text');

    // Start Year Init
    if (planStartYear) {
      const currentYear = new Date().getFullYear();
      planStartYear.innerHTML = '';
      for (let y = currentYear - 2; y <= currentYear + 2; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = `${y} - ${y + 1} Eğitim Yılı`;
        const isPastJune = new Date().getMonth() >= 6;
        if (isPastJune && y === currentYear) option.selected = true;
        if (!isPastJune && y === currentYear - 1) option.selected = true;
        planStartYear.appendChild(option);
      }
    }

    // Event Listeners
    if (btnLaunchPlans) {
      btnLaunchPlans.addEventListener('click', () => {
        toolsLandingView.style.display = 'none';
        toolsPlansView.style.display = 'block';
        
        // Reset state
        plansSelectedWeekCode = stateManager.getSelectedWeek();
        activePlansMainTab = 'weekly';
        
        if (btnPlansTabWeekly) btnPlansTabWeekly.classList.add('active');
        if (btnPlansTabGeneral) btnPlansTabGeneral.classList.remove('active');
        if (plansTabContentWeekly) plansTabContentWeekly.style.display = 'block';
        if (plansTabContentGeneral) plansTabContentGeneral.style.display = 'none';
        
        renderPlansList();
      });
    }

    if (btnBackToToolsFromPlans) {
      btnBackToToolsFromPlans.addEventListener('click', () => {
        toolsPlansView.style.display = 'none';
        toolsLandingView.style.display = 'block';
      });
    }

    // Main Tab Switching
    if (btnPlansTabWeekly && btnPlansTabGeneral) {
      btnPlansTabWeekly.addEventListener('click', () => {
        activePlansMainTab = 'weekly';
        btnPlansTabWeekly.classList.add('active');
        btnPlansTabGeneral.classList.remove('active');
        plansTabContentWeekly.style.display = 'block';
        plansTabContentGeneral.style.display = 'none';
        renderPlansList();
      });

      btnPlansTabGeneral.addEventListener('click', () => {
        activePlansMainTab = 'general';
        btnPlansTabGeneral.classList.add('active');
        btnPlansTabWeekly.classList.remove('active');
        plansTabContentGeneral.style.display = 'block';
        plansTabContentWeekly.style.display = 'none';
        renderPlansList();
      });
    }

    // Weekly View Navigation
    if (btnPlansPrevWeek) {
      btnPlansPrevWeek.addEventListener('click', () => {
        if (plansSelectedWeekCode) {
          plansSelectedWeekCode = stateManager.addWeeks(plansSelectedWeekCode, -1);
          renderWeeklyView();
        }
      });
    }
    if (btnPlansNextWeek) {
      btnPlansNextWeek.addEventListener('click', () => {
        if (plansSelectedWeekCode) {
          plansSelectedWeekCode = stateManager.addWeeks(plansSelectedWeekCode, 1);
          renderWeeklyView();
        }
      });
    }

    // Populate Course Dropdown
    const populateCourseDropdown = () => {
      if (!planCourseNameSelect) return;
      planCourseNameSelect.innerHTML = '';
      
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '--- Ders Seçin ---';
      planCourseNameSelect.appendChild(defaultOption);

      const state = stateManager.loadState();
      const lessons = state.definedLessons || [];
      
      // Sort lessons alphabetically
      lessons.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      
      lessons.forEach(lesson => {
        const option = document.createElement('option');
        option.value = lesson.name;
        option.textContent = lesson.name;
        planCourseNameSelect.appendChild(option);
      });

      const customOption = document.createElement('option');
      customOption.value = 'custom';
      customOption.textContent = 'Yeni Ders Ekle...';
      planCourseNameSelect.appendChild(customOption);
      
      planCourseNameSelect.value = '';
      if (planCourseNameInputContainer) planCourseNameInputContainer.style.display = 'none';
      if (planCourseNameInput) planCourseNameInput.value = '';
    };

    // Import Modal Open
    const openImportModal = () => {
      resetImportForm();
      populateCourseDropdown();
      modalImportPlan.classList.add('active');
    };
    if (btnShowImportModalGeneral) btnShowImportModalGeneral.addEventListener('click', openImportModal);
    if (btnImportFirstPlanGeneral) btnImportFirstPlanGeneral.addEventListener('click', openImportModal);
    if (btnShowImportModalWeekly) btnShowImportModalWeekly.addEventListener('click', openImportModal);
    if (btnImportFirstPlanWeekly) btnImportFirstPlanWeekly.addEventListener('click', openImportModal);

    // Course Name Select Change
    if (planCourseNameSelect) {
      planCourseNameSelect.addEventListener('change', () => {
        if (planCourseNameSelect.value === 'custom') {
          if (planCourseNameInputContainer) planCourseNameInputContainer.style.display = 'block';
          if (planCourseNameInput) {
            planCourseNameInput.value = '';
            planCourseNameInput.focus();
          }
        } else {
          if (planCourseNameInputContainer) planCourseNameInputContainer.style.display = 'none';
          if (planCourseNameInput) planCourseNameInput.value = planCourseNameSelect.value;
        }
      });
    }

    // Modal Close
    modalImportPlan.querySelectorAll('.close-btn, #btn-import-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        modalImportPlan.classList.remove('active');
      });
    });

    // File Selector
    if (btnSelectPlanFile && inputPlanFile) {
      btnSelectPlanFile.addEventListener('click', () => inputPlanFile.click());
      inputPlanFile.addEventListener('change', handleFileSelect);
    }

    // Source tab switching inside import modal
    if (importTabFile && importTabPaste) {
      importTabFile.addEventListener('click', () => {
        importTabFile.classList.add('active');
        importTabPaste.classList.remove('active');
        panelImportFile.style.display = 'block';
        panelImportPaste.style.display = 'none';
      });

      importTabPaste.addEventListener('click', () => {
        importTabPaste.classList.add('active');
        importTabFile.classList.remove('active');
        panelImportPaste.style.display = 'block';
        panelImportFile.style.display = 'none';
      });
    }

    // Parsing pasted text
    if (btnParsePastedText && planPasteText) {
      btnParsePastedText.addEventListener('click', () => {
        const rawText = planPasteText.value.trim();
        if (!rawText) {
          if (toastCallbackFn) toastCallbackFn('Lütfen tablo metnini yapıştırın.', 'warning');
          return;
        }
        handlePasteParse(rawText);
      });
    }

    // Download Plan Template
    const btnDownloadPlanTemplate = document.getElementById('btn-download-plan-template');
    if (btnDownloadPlanTemplate) {
      btnDownloadPlanTemplate.addEventListener('click', () => {
        if (window.XLSX) {
          const data = [
            ["Ay", "Hafta", "Tarih Aralığı", "Ders Saati", "Kazanım"],
            ["Eylül", "1. Hafta", "15 Eylül - 19 Eylül", 4, "Dersle ilgili genel oryantasyon, tanışma ve hazırlık."],
            ["Eylül", "2. Hafta", "22 Eylül - 26 Eylül", 4, "Temel kavramların açıklanması ve günlük yaşamdan örnekler verilmesi."],
            ["Ekim", "3. Hafta", "29 Eylül - 03 Ekim", 4, "Konuya giriş ve temel kuralların öğretilmesi."],
            ["Ekim", "4. Hafta", "06 Ekim - 10 Ekim", 4, "Kazanım ve uygulamalarla pekiştirme çalışmaları."]
          ];
          const ws = XLSX.utils.aoa_to_sheet(data);
          ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 50 }];
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Ders Planı Şablonu");
          
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          
          if (window.downloadBlob) {
            window.downloadBlob(blob, "ders_plani_yukleme_sablonu.xlsx");
          } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "ders_plani_yukleme_sablonu.xlsx");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
          }
          if (toastCallbackFn) toastCallbackFn('Ders planı yükleme şablonu (.xlsx) indirildi.', 'success');
        } else {
          if (toastCallbackFn) toastCallbackFn('Excel kütüphanesi bulunamadı.', 'danger');
        }
      });
    }

    // Drag and Drop
    if (planDragDropArea) {
      ['dragenter', 'dragover'].forEach(eventName => {
        planDragDropArea.addEventListener(eventName, (e) => {
          e.preventDefault();
          planDragDropArea.classList.add('dragover');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        planDragDropArea.addEventListener(eventName, (e) => {
          e.preventDefault();
          planDragDropArea.classList.remove('dragover');
        }, false);
      });

      planDragDropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
          inputPlanFile.files = files;
          handleFileSelect({ target: inputPlanFile });
        }
      }, false);
    }

    // Select sheet change
    if (planSelectSheet) {
      planSelectSheet.addEventListener('change', () => {
        loadSheetData(planSelectSheet.value);
      });
    }

    // Dropdown value changes refresh preview
    [planColMonth, planColWeek, planColDateRange, planColHours, planColUnit, planColOutcomes, planColTopics, planColDescriptions, planColSpecial, planColAssessment, planColContent, planRowStart].forEach(select => {
      if (select) {
        select.addEventListener('change', updateImportPreview);
      }
    });

    // Save imported plan
    if (btnImportSave) {
      btnImportSave.addEventListener('click', saveImportedPlan);
    }

    // Global state change listener
    document.addEventListener('stateChanged', () => {
      if (toolsPlansView && toolsPlansView.style.display === 'block') {
        renderPlansList();
      }
    });
  }

  function resetImportForm() {
    currentWorkbook = null;
    currentSheetData = null;
    if (inputPlanFile) inputPlanFile.value = '';
    if (planPasteText) planPasteText.value = '';
    if (importStepFile) importStepFile.style.display = 'block';
    if (importStepMapping) importStepMapping.style.display = 'none';
    if (btnImportSave) btnImportSave.style.display = 'none';
    if (planCourseNameInput) planCourseNameInput.value = '';
    if (planClassName) planClassName.value = '3/A';
    if (planEducationYear) planEducationYear.value = '2025-2026';
    if (importTabFile) importTabFile.click();
  }

  function handlePasteParse(text) {
    try {
      // Split rows by newline and columns by tab (standard spreadsheet copy format)
      const rows = text.split(/\r?\n/).map(line => line.split('\t'));
      if (rows.length === 0 || (rows.length === 1 && rows[0].length === 1 && !rows[0][0])) {
        if (toastCallbackFn) toastCallbackFn('Yapıştırılan metin çözümlenemedi.', 'warning');
        return;
      }

      currentSheetData = rows;
      currentWorkbook = {
        isPaste: true,
        SheetNames: ['Pasted Table'],
        SheetsData: { 'Pasted Table': rows }
      };

      if (planSelectSheet) {
        planSelectSheet.innerHTML = '<option value="Pasted Table">Yapıştırılan Tablo</option>';
      }

      setupColumnDropdowns(rows[0].length);

      importStepFile.style.display = 'none';
      importStepMapping.style.display = 'block';
      if (btnImportSave) btnImportSave.style.display = 'inline-block';
    } catch (err) {
      console.error(err);
      if (toastCallbackFn) toastCallbackFn('Metin çözümlenirken hata oluştu.', 'danger');
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    if (planCourseNameInput) planCourseNameInput.value = baseName;

    const isDocx = file.name.toLowerCase().endsWith('.docx');

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        if (isDocx) {
          if (!window.mammoth) {
            if (toastCallbackFn) toastCallbackFn('Word kütüphanesi bulunamadı. Sayfayı yenileyip deneyin.', 'danger');
            return;
          }
          window.mammoth.convertToHtml({ arrayBuffer: evt.target.result })
            .then(result => {
              const html = result.value;
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;
              const tables = tempDiv.querySelectorAll('table');

              if (tables.length === 0) {
                if (toastCallbackFn) toastCallbackFn('Word belgesinde tablo bulunamadı.', 'warning');
                return;
              }

              if (planSelectSheet) {
                planSelectSheet.innerHTML = '';
                tables.forEach((table, index) => {
                  const opt = document.createElement('option');
                  opt.value = index;
                  opt.textContent = `Tablo ${index + 1} (${table.rows.length} Satır)`;
                  planSelectSheet.appendChild(opt);
                });
              }

              const sheetsMap = {};
              const sheetNames = [];
              tables.forEach((table, index) => {
                const name = `Tablo ${index + 1}`;
                sheetNames.push(name);

                const rows = [];
                for (let i = 0; i < table.rows.length; i++) {
                  const row = table.rows[i];
                  const rowCells = [];
                  for (let j = 0; j < row.cells.length; j++) {
                    rowCells.push(row.cells[j].innerText || row.cells[j].textContent || '');
                  }
                  rows.push(rowCells);
                }
                sheetsMap[name] = rows;
              });

              currentWorkbook = {
                SheetNames: sheetNames,
                SheetsData: sheetsMap,
                isDocx: true
              };

              loadSheetData(sheetNames[0]);

              importStepFile.style.display = 'none';
              importStepMapping.style.display = 'block';
              if (btnImportSave) btnImportSave.style.display = 'inline-block';
            })
            .catch(err => {
              console.error(err);
              if (toastCallbackFn) toastCallbackFn('Word belgesi okunurken hata oluştu.', 'danger');
            });
        } else {
          // Excel
          const data = new Uint8Array(evt.target.result);
          if (!window.XLSX) {
            if (toastCallbackFn) toastCallbackFn('Excel kütüphanesi bulunamadı.', 'danger');
            return;
          }
          currentWorkbook = XLSX.read(data, { type: 'array' });
          currentWorkbook.isDocx = false;

          if (planSelectSheet) {
            planSelectSheet.innerHTML = '';
            currentWorkbook.SheetNames.forEach(sheetName => {
              const opt = document.createElement('option');
              opt.value = sheetName;
              opt.textContent = sheetName;
              planSelectSheet.appendChild(opt);
            });
          }

          loadSheetData(currentWorkbook.SheetNames[0]);

          importStepFile.style.display = 'none';
          importStepMapping.style.display = 'block';
          if (btnImportSave) btnImportSave.style.display = 'inline-block';
        }
      } catch (err) {
        console.error(err);
        if (toastCallbackFn) toastCallbackFn('Dosya okunurken hata oluştu.', 'danger');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function loadSheetData(sheetName) {
    if (!currentWorkbook) return;
    if (currentWorkbook.isDocx || currentWorkbook.isPaste) {
      currentSheetData = currentWorkbook.SheetsData[sheetName];
    } else {
      const worksheet = currentWorkbook.Sheets[sheetName];
      currentSheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    }

    if (!currentSheetData || currentSheetData.length === 0) {
      if (toastCallbackFn) toastCallbackFn('Bu çalışma sayfası boş!', 'warning');
      return;
    }

    let maxCols = 0;
    for (let r = 0; r < Math.min(10, currentSheetData.length); r++) {
      if (currentSheetData[r] && currentSheetData[r].length > maxCols) {
        maxCols = currentSheetData[r].length;
      }
    }

    setupColumnDropdowns(maxCols);
    autoDetectColumns(maxCols);
  }

  function setupColumnDropdowns(colCount) {
    const colOptions = [];
    for (let i = 0; i < colCount; i++) {
      const colLetter = getColumnLetter(i);
      colOptions.push({ index: i, letter: colLetter });
    }

    const dropdowns = [
      planColMonth, planColWeek, planColDateRange, planColHours, planColUnit, 
      planColOutcomes, planColTopics, planColDescriptions, 
      planColSpecial, planColAssessment, planColContent
    ];

    dropdowns.forEach(select => {
      if (select) {
        select.innerHTML = '';
        const emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '-- Seçilmedi --';
        select.appendChild(emptyOpt);

        colOptions.forEach(col => {
          const opt = document.createElement('option');
          opt.value = col.index;
          opt.textContent = `${col.letter} Sütunu`;
          select.appendChild(opt);
        });
      }
    });
  }

  function getColumnLetter(colIndex) {
    let temp = colIndex;
    let letter = '';
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  }

  function autoDetectColumns(colCount) {
    if (!currentSheetData || currentSheetData.length === 0) return;

    let headerRowIndex = 0;
    const detectedCols = {
      month: -1, week: -1, dateRange: -1, hours: -1, unit: -1, 
      outcomes: -1, topics: -1, descriptions: -1, 
      special: -1, assessment: -1, content: -1
    };

    const maxSearchRows = Math.min(15, currentSheetData.length);
    let bestHeaderScore = -1;

    const keywords = {
      month: ['ay', 'month', 'dönem'],
      week: ['hafta', 'week'],
      dateRange: ['tarih', 'süre', 'gün', 'date', 'aralık', 'tarih aralığı', 'tarih araligi'],
      hours: ['saat', 'ders saati', 'süre', 'hours', 'hour'],
      unit: ['ünite', 'unite', 'tema', 'öğrenme alanı', 'ogrenme alani', 'alt öğrenme', 'unit', 'theme'],
      outcomes: ['kazanım', 'kazanim', 'hedef', 'outcomes', 'outcome', 'learning outcomes'],
      topics: ['konu', 'içerik', 'icerik', 'topics', 'topic', 'subject'],
      descriptions: ['açıklama', 'aciklama', 'yöntem', 'yontem', 'etkinlik', 'descriptions', 'description', 'notes'],
      special: ['belirli gün', 'belirli gun', 'gün ve haftalar', 'gun ve haftalar', 'özel gün', 'special days'],
      assessment: ['değerlendirme', 'degerlendirme', 'ölçme', 'olcme', 'assessment', 'evaluation'],
      content: ['konu', 'kazanım', 'kazanim', 'öğrenme alanı', 'içerik', 'etkinlik', 'subject', 'content', 'topic', 'kazanımlar', 'kazanimlar']
    };

    for (let r = 0; r < maxSearchRows; r++) {
      const row = currentSheetData[r] || [];
      let rowScore = 0;
      const tempDets = { ...detectedCols };

      for (let c = 0; c < row.length; c++) {
        const val = String(row[c]).toLowerCase().trim();
        if (!val) continue;

        for (const key in keywords) {
          keywords[key].forEach(keyword => {
            if (val.includes(keyword)) {
              rowScore += (val === keyword) ? 3 : 1;
              tempDets[key] = c;
            }
          });
        }
      }

      if (rowScore > bestHeaderScore) {
        bestHeaderScore = rowScore;
        headerRowIndex = r;
        Object.assign(detectedCols, tempDets);
      }
    }

    // Set fallback defaults if not found
    if (detectedCols.week === -1) detectedCols.week = colCount > 1 ? 1 : 0;
    if (detectedCols.dateRange === -1) {
      if (colCount > 2) detectedCols.dateRange = 2;
    }
    if (detectedCols.content === -1) detectedCols.content = colCount > 2 ? 2 : 0;

    // Assign selectors
    if (planColMonth) planColMonth.value = detectedCols.month !== -1 ? detectedCols.month : '';
    if (planColWeek) planColWeek.value = detectedCols.week !== -1 ? detectedCols.week : '';
    if (planColDateRange) planColDateRange.value = detectedCols.dateRange !== -1 ? detectedCols.dateRange : '';
    if (planColHours) planColHours.value = detectedCols.hours !== -1 ? detectedCols.hours : '';
    if (planColUnit) planColUnit.value = detectedCols.unit !== -1 ? detectedCols.unit : '';
    if (planColOutcomes) planColOutcomes.value = detectedCols.outcomes !== -1 ? detectedCols.outcomes : '';
    if (planColTopics) planColTopics.value = detectedCols.topics !== -1 ? detectedCols.topics : '';
    if (planColDescriptions) planColDescriptions.value = detectedCols.descriptions !== -1 ? detectedCols.descriptions : '';
    if (planColSpecial) planColSpecial.value = detectedCols.special !== -1 ? detectedCols.special : '';
    if (planColAssessment) planColAssessment.value = detectedCols.assessment !== -1 ? detectedCols.assessment : '';
    if (planColContent) planColContent.value = detectedCols.content !== -1 ? detectedCols.content : '';
    
    if (planRowStart) planRowStart.value = headerRowIndex + 2;

    updateImportPreview();
  }

  function cleanMonthName(monthVal, weekVal, startYear, weekCounter) {
    let rawText = String(monthVal || '').trim();
    if (!rawText && weekVal) {
      rawText = String(weekVal).trim();
    }

    const cleaned = rawText.toLowerCase();
    for (const key in TURKISH_MONTHS) {
      if (cleaned.includes(key)) {
        return key.charAt(0).toUpperCase() + key.slice(1);
      }
    }

    // Calendar Math Fallback
    const sept1 = new Date(startYear, 8, 1);
    const dayOfSept1 = sept1.getDay() || 7;
    const schoolStart = new Date(sept1.getTime());
    schoolStart.setDate(sept1.getDate() - dayOfSept1 + 1 + 7);
    
    const wStart = new Date(schoolStart.getTime());
    wStart.setDate(schoolStart.getDate() + (weekCounter - 1) * 7);
    
    const monthName = wStart.toLocaleDateString('tr-TR', { month: 'long' });
    return monthName.toUpperCase();
  }

  // Parse ranges like "2-3" or "34-35-36"
  function parseWeekRange(rangeStr) {
    const parts = rangeStr.split('-');
    const nums = [];
    const start = parseInt(parts[0]);
    const end = parseInt(parts[parts.length - 1]);
    if (!isNaN(start) && !isNaN(end)) {
      for (let i = start; i <= end; i++) {
        nums.push(i);
      }
    }
    return nums;
  }

  function parseWeekNumbers(text) {
    if (!text) return [];
    const cleaned = text.replace(/\s+/g, '').toLowerCase();
    
    const weekPattern = /(\d+(?:-\d+)+)\.?hafta/i;
    const match = cleaned.match(weekPattern);
    if (match) {
      return parseWeekRange(match[1]);
    }
    
    const singleMatch = cleaned.match(/(\d+)\.?hafta/i);
    if (singleMatch) {
      return [parseInt(singleMatch[1])];
    }
    
    const rawRangeMatch = cleaned.match(/(\d+(?:-\d+)+)/);
    if (rawRangeMatch) {
      return parseWeekRange(rawRangeMatch[1]);
    }

    const digitMatches = cleaned.match(/\b\d+\b/g);
    if (digitMatches && digitMatches.length > 0) {
      return [parseInt(digitMatches[0])];
    }

    return [];
  }

  function detectIsHoliday(weekText, contentText) {
    const text = ((weekText || '') + ' ' + (contentText || '')).toLowerCase();
    const holidayKeywords = ['ara tatil', 'yarıyıl', 'yarı yıl', 'sömestr', 'somestr', 'faaliyet haftası', 'tatili', 'tatil'];
    return holidayKeywords.some(kw => text.includes(kw));
  }

  function romanToInt(s) {
    const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    for (let i = 0; i < s.length; i++) {
      const current = map[s[i].toUpperCase()];
      const next = map[s[i+1]?.toUpperCase()];
      if (current < next) {
        total += next - current;
        i++;
      } else {
        total += current;
      }
    }
    return total;
  }

  function autoClassifyContent(text) {
    const outcomes = [];
    const topics = [];
    const descriptions = [];
    
    if (!text) return { outcomes, topics, descriptions };
    
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    lines.forEach(line => {
      const cleanLine = line.replace(/^[•\-*○▪]\s*/, '').trim();
      const outcomeRegex = /^[A-Za-zÇĞİÖŞÜçğıöşü]\.\d+\.\d+/;
      if (outcomeRegex.test(cleanLine)) {
        outcomes.push(cleanLine);
      } else if (cleanLine.length < 50) {
        topics.push(cleanLine);
      } else {
        descriptions.push(cleanLine);
      }
    });
    
    return { outcomes, topics, descriptions };
  }

  function parseTurkishDateRange(text, startYear) {
    let startDate = null;
    let endDate = null;
    let isDateParsed = false;

    if (!text) return { startDate, endDate, isDateParsed };

    const cleaned = text.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Scenario 1: dd.mm.yyyy
    const fullDateRegex = /(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})/g;
    const matches = cleaned.match(fullDateRegex);
    if (matches && matches.length >= 1) {
      const parseStrDate = (str) => {
        const parts = str.split(/[\.\/\-]/);
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      };

      startDate = parseStrDate(matches[0]);
      if (matches.length >= 2) {
        endDate = parseStrDate(matches[1]);
      } else {
        endDate = new Date(startDate.getTime());
        endDate.setDate(startDate.getDate() + 4);
      }
      isDateParsed = true;
      return { startDate, endDate, isDateParsed };
    }

    // Scenario 2: dd.mm
    const shortDateRegex = /(\d{1,2})[\.\/](\d{1,2})/g;
    const shortMatches = cleaned.match(shortDateRegex);
    if (shortMatches && shortMatches.length >= 1) {
      const parseShortDate = (str) => {
        const parts = str.split(/[\.\/]/);
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = month >= 9 ? startYear : startYear + 1;
        return new Date(year, month - 1, day);
      };

      startDate = parseShortDate(shortMatches[0]);
      if (shortMatches.length >= 2) {
        endDate = parseShortDate(shortMatches[1]);
      } else {
        endDate = new Date(startDate.getTime());
        endDate.setDate(startDate.getDate() + 4);
      }
      isDateParsed = true;
      return { startDate, endDate, isDateParsed };
    }

    // Scenario 3: Text months
    const numMatches = cleaned.match(/\b\d{1,2}\b/g);
    const foundMonths = [];
    
    for (const key in TURKISH_MONTHS) {
      const idx = cleaned.indexOf(key);
      if (idx !== -1) {
        foundMonths.push({ name: key, index: TURKISH_MONTHS[key], charPos: idx });
      }
    }
    foundMonths.sort((a, b) => a.charPos - b.charPos);

    if (numMatches && numMatches.length >= 1 && foundMonths.length >= 1) {
      const startDay = parseInt(numMatches[0]);
      const endDay = numMatches.length >= 2 ? parseInt(numMatches[1]) : startDay + 4;
      
      const startMonthIndex = foundMonths[0].index;
      const endMonthIndex = foundMonths.length >= 2 ? foundMonths[1].index : startMonthIndex;

      const startY = startMonthIndex >= 9 ? startYear : startYear + 1;
      const endY = endMonthIndex >= 9 ? startYear : startYear + 1;

      startDate = new Date(startY, startMonthIndex - 1, startDay);
      endDate = new Date(endY, endMonthIndex - 1, endDay);
      isDateParsed = true;
      return { startDate, endDate, isDateParsed };
    }

    return { startDate, endDate, isDateParsed };
  }

  function getFallbackDateRange(weekNum, startYear) {
    const sept1 = new Date(startYear, 8, 1);
    let dayOfWeek = sept1.getDay();
    let firstMondayDiff = (8 - dayOfWeek) % 7;
    let secondMondayDate = 1 + firstMondayDiff + 7;
    const schoolStart = new Date(startYear, 8, secondMondayDate);
    
    const monday = new Date(schoolStart.getTime());
    monday.setDate(schoolStart.getDate() + (weekNum - 1) * 7);
    
    const friday = new Date(monday.getTime());
    friday.setDate(monday.getDate() + 4);
    
    const dStart = monday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const dEnd = friday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${dStart} - ${dEnd}`;
  }

  function updateImportPreview() {
    if (!currentSheetData) return;

    const colMonthIdx = parseInt(planColMonth.value);
    const colWeekIdx = parseInt(planColWeek.value);
    const colDateRangeIdx = planColDateRange ? parseInt(planColDateRange.value) : NaN;
    const colContentIdx = parseInt(planColContent.value);
    const colOutcomesIdx = parseInt(planColOutcomes.value);
    const colTopicsIdx = parseInt(planColTopics.value);
    const startRowIndex = parseInt(planRowStart.value) - 1;
    const startYear = parseInt(planStartYear.value) || new Date().getFullYear();

    if (isNaN(colWeekIdx) || isNaN(startRowIndex)) {
      planPreviewTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Hafta / Tarih sütununu seçin.</td></tr>';
      return;
    }

    planPreviewTbody.innerHTML = '';
    
    const previewSchedule = [];
    let lastMonthText = '';
    let lastWeekText = '';
    let weekCounter = 1;

    for (let r = startRowIndex; r < currentSheetData.length; r++) {
      const row = currentSheetData[r] || [];
      const monthVal = isNaN(colMonthIdx) ? '' : String(row[colMonthIdx] || '').trim();
      const weekVal = String(row[colWeekIdx] || '').trim();
      const contentVal = isNaN(colContentIdx) ? '' : String(row[colContentIdx] || '').trim();

      if (!monthVal && !weekVal && !contentVal) continue;

      let effectiveMonth = monthVal || lastMonthText;
      if (monthVal) lastMonthText = monthVal;

      let effectiveWeek = weekVal || lastWeekText;
      if (weekVal) lastWeekText = weekVal;

      if (!effectiveWeek) {
        effectiveWeek = `${weekCounter}. Hafta`;
      }

      const dateRangeVal = isNaN(colDateRangeIdx) ? '' : String(row[colDateRangeIdx] || '').trim();

      const cleanedMonth = cleanMonthName(effectiveMonth, effectiveWeek, startYear, weekCounter);
      const isHoliday = detectIsHoliday(effectiveWeek, contentVal);

      if (isHoliday) {
        previewSchedule.push({
          weekLabel: effectiveWeek,
          monthName: cleanedMonth,
          dateRange: dateRangeVal || 'Tatil Dönemi',
          contentPreview: 'Eğitim Öğretime Ara (Tatil)',
          weekNum: 'Tatil'
        });
        if (previewSchedule.length >= 10) break;
        continue;
      }

      const weekNumbers = parseWeekNumbers(effectiveWeek);
      const activeWeekNums = weekNumbers.length > 0 ? weekNumbers : [weekCounter];
      
      const dateSourceText = dateRangeVal || effectiveWeek;
      const { startDate, endDate, isDateParsed } = parseTurkishDateRange(dateSourceText, startYear);

      activeWeekNums.forEach((wNum, idx) => {
        let dateRangeStr = '';
        if (isDateParsed && startDate && endDate) {
          const sDate = new Date(startDate.getTime());
          sDate.setDate(startDate.getDate() + idx * 7);
          const eDate = new Date(sDate.getTime());
          eDate.setDate(sDate.getDate() + 4);
          
          const dStart = sDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
          const dEnd = eDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
          dateRangeStr = `${dStart} - ${dEnd}`;
        } else {
          dateRangeStr = dateRangeVal || getFallbackDateRange(wNum, startYear);
        }

        let outcomesList = [];
        if (colOutcomesIdx !== -1 && row[colOutcomesIdx]) {
          outcomesList = String(row[colOutcomesIdx]).split('\n').map(l => l.trim()).filter(l => l);
        } else if (colContentIdx !== -1 && row[colContentIdx]) {
          const classification = autoClassifyContent(String(row[colContentIdx]));
          outcomesList = classification.outcomes;
        }

        const previewText = outcomesList.length > 0 ? outcomesList[0] : (contentVal || 'Konu/Müfredat bilgisi');

        previewSchedule.push({
          weekLabel: `${wNum}. Hafta`,
          monthName: cleanedMonth,
          dateRange: dateRangeStr,
          contentPreview: previewText,
          weekNum: wNum
        });
        weekCounter = Math.max(weekCounter, wNum) + 1;
      });

      if (previewSchedule.length >= 10) break;
    }

    previewSchedule.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center; font-weight: 600;">${item.weekNum}</td>
        <td style="font-weight: 600; color: var(--primary);">${escapeHtml(item.monthName)}</td>
        <td style="font-weight: 500; color: var(--info);">${escapeHtml(item.dateRange)}</td>
        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(item.contentPreview)}">${escapeHtml(item.contentPreview)}</td>
      `;
      planPreviewTbody.appendChild(tr);
    });

    if (previewSchedule.length === 0) {
      planPreviewTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Eşleşen satırlarda geçerli veri bulunamadı.</td></tr>';
    }
  }

  function saveImportedPlan() {
    if (!currentSheetData) return;

    const courseName = (planCourseNameInput.value || '').trim();
    const className = (planClassName.value || '3/A').trim();
    const educationYear = (planEducationYear.value || '2025-2026').trim();

    if (!courseName) {
      if (toastCallbackFn) toastCallbackFn('Lütfen plan için geçerli bir ders adı girin.', 'danger');
      return;
    }

    const colMonthIdx = parseInt(planColMonth.value);
    const colWeekIdx = parseInt(planColWeek.value);
    const colDateRangeIdx = planColDateRange ? parseInt(planColDateRange.value) : NaN;
    const colHoursIdx = parseInt(planColHours.value);
    const colUnitIdx = parseInt(planColUnit.value);
    const colOutcomesIdx = parseInt(planColOutcomes.value);
    const colTopicsIdx = parseInt(planColTopics.value);
    const colDescriptionsIdx = parseInt(planColDescriptions.value);
    const colSpecialIdx = parseInt(planColSpecial.value);
    const colAssessmentIdx = parseInt(planColAssessment.value);
    const colContentIdx = parseInt(planColContent.value);
    const startRowIndex = parseInt(planRowStart.value) - 1;
    const startYear = parseInt(planStartYear.value) || new Date().getFullYear();

    if (isNaN(colWeekIdx) || isNaN(startRowIndex)) {
      if (toastCallbackFn) toastCallbackFn('Hafta / Tarih sütununu seçmek zorunludur.', 'danger');
      return;
    }

    const weeklySchedule = [];
    let lastMonthText = '';
    let lastWeekText = '';
    let weekCounter = 1;

    for (let r = startRowIndex; r < currentSheetData.length; r++) {
      const row = currentSheetData[r] || [];
      const monthVal = isNaN(colMonthIdx) ? '' : String(row[colMonthIdx] || '').trim();
      const weekVal = String(row[colWeekIdx] || '').trim();
      const contentVal = isNaN(colContentIdx) ? '' : String(row[colContentIdx] || '').trim();
      const dateRangeVal = isNaN(colDateRangeIdx) ? '' : String(row[colDateRangeIdx] || '').trim();

      if (!monthVal && !weekVal && !contentVal) continue;

      let effectiveMonth = monthVal || lastMonthText;
      if (monthVal) lastMonthText = monthVal;

      let effectiveWeek = weekVal || lastWeekText;
      if (weekVal) lastWeekText = weekVal;

      if (!effectiveWeek) {
        effectiveWeek = `${weekCounter}. Hafta`;
      }

      const cleanedMonth = cleanMonthName(effectiveMonth, effectiveWeek, startYear, weekCounter);
      const isHoliday = detectIsHoliday(effectiveWeek, contentVal);

      if (isHoliday) {
        const dateSourceText = dateRangeVal || effectiveWeek;
        const { startDate, endDate, isDateParsed } = parseTurkishDateRange(dateSourceText, startYear);
        weeklySchedule.push({
          id: 'w_hol_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          month: cleanedMonth.toUpperCase(),
          weekNumber: [0],
          weekLabel: effectiveWeek,
          dateRange: dateRangeVal || (isDateParsed && startDate && endDate ? 
            `${startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} – ${endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}` : 
            effectiveWeek),
          startDate: startDate ? startDate.toISOString().slice(0, 10) : null,
          endDate: endDate ? endDate.toISOString().slice(0, 10) : null,
          isoWeek: startDate ? window.getISOWeek(startDate) : '',
          classHours: 0,
          unitNo: null,
          unitName: null,
          learningOutcomes: [],
          topics: [],
          descriptions: [],
          specialDays: null,
          assessment: [],
          isHoliday: true,
          isCompleted: false
        });
        continue;
      }

      // Normal Week
      const weekNumbers = parseWeekNumbers(effectiveWeek);
      const activeWeekNums = weekNumbers.length > 0 ? weekNumbers : [weekCounter];
      
      const dateSourceText = dateRangeVal || effectiveWeek;
      const { startDate, endDate, isDateParsed } = parseTurkishDateRange(dateSourceText, startYear);

      // Class Hours
      let totalHours = 3;
      if (colHoursIdx !== -1 && row[colHoursIdx]) {
        const hrNum = parseInt(String(row[colHoursIdx]).replace(/\D/g, ''));
        if (!isNaN(hrNum)) totalHours = hrNum;
      }

      const hoursPerWeek = Math.round(totalHours / activeWeekNums.length) || 1;

      // Unit
      let unitNo = null;
      let unitName = null;
      if (colUnitIdx !== -1 && row[colUnitIdx]) {
        const unitText = String(row[colUnitIdx]).trim();
        const match = unitText.match(/^(?:(\d+|[IVXLCDM]+)\.?\s*(?:ÜNİTE|UNITE|TEMA|THEME)?\s*[:-]?\s*)?(.*)$/i);
        if (match) {
          const numStr = match[1];
          if (numStr) {
            if (/^\d+$/.test(numStr)) unitNo = parseInt(numStr);
            else unitNo = romanToInt(numStr) || numStr;
          }
          unitName = match[2].trim();
        } else {
          unitName = unitText;
        }
      }

      // Outcomes, Topics, Descriptions Fallback
      let outcomes = [];
      let topics = [];
      let descriptions = [];

      if (colOutcomesIdx !== -1 && row[colOutcomesIdx]) {
        outcomes = String(row[colOutcomesIdx]).split('\n').map(l => l.trim()).filter(l => l);
      }
      if (colTopicsIdx !== -1 && row[colTopicsIdx]) {
        topics = String(row[colTopicsIdx]).split(/[\n,;]/).map(l => l.trim()).filter(l => l);
      }
      if (colDescriptionsIdx !== -1 && row[colDescriptionsIdx]) {
        descriptions = String(row[colDescriptionsIdx]).split('\n').map(l => l.trim()).filter(l => l);
      }

      // Classification Fallback
      if (colContentIdx !== -1 && row[colContentIdx] && outcomes.length === 0 && topics.length === 0) {
        const classified = autoClassifyContent(String(row[colContentIdx]));
        outcomes = classified.outcomes;
        topics = classified.topics;
        descriptions = classified.descriptions;
      }

      // Unit Fallback from content if still missing
      if (!unitName && contentVal) {
        const match = contentVal.match(/(?:(\d+|[IVXLCDM]+)\.?\s*(?:ÜNİTE|UNITE|TEMA|THEME))\s*[:-]?\s*([^\n\r]+)/i);
        if (match) {
          const numStr = match[1];
          if (/^\d+$/.test(numStr)) unitNo = parseInt(numStr);
          else unitNo = romanToInt(numStr) || numStr;
          unitName = match[2].trim();
        }
      }

      // Special Days
      let specialDays = null;
      if (colSpecialIdx !== -1 && row[colSpecialIdx]) {
        specialDays = String(row[colSpecialIdx]).trim() || null;
      }

      // Assessment
      let assessment = [];
      if (colAssessmentIdx !== -1 && row[colAssessmentIdx]) {
        assessment = String(row[colAssessmentIdx]).split(/[\n,;]/).map(l => l.trim()).filter(l => l);
      }

      activeWeekNums.forEach((wNum, idx) => {
        let dateRangeStr = '';
        let sDateStr = null;
        let eDateStr = null;
        let isoWeek = '';

        if (isDateParsed && startDate && endDate) {
          const sDate = new Date(startDate.getTime());
          sDate.setDate(startDate.getDate() + idx * 7);
          const eDate = new Date(sDate.getTime());
          eDate.setDate(sDate.getDate() + 4);
          
          const dStart = sDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
          const dEnd = eDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
          dateRangeStr = `${dStart} – ${dEnd}`;
          sDateStr = sDate.toISOString().slice(0, 10);
          eDateStr = eDate.toISOString().slice(0, 10);
          isoWeek = window.getISOWeek(sDate);
        } else {
          dateRangeStr = dateRangeVal || getFallbackDateRange(wNum, startYear);
          const parts = dateRangeStr.split(' - ');
          // Estimate dates
          const sept1 = new Date(startYear, 8, 1);
          const dayOfSept1 = sept1.getDay() || 7;
          const schoolStart = new Date(sept1.getTime());
          schoolStart.setDate(sept1.getDate() - dayOfSept1 + 1 + 7);
          const sDate = new Date(schoolStart.getTime());
          sDate.setDate(schoolStart.getDate() + (wNum - 1) * 7);
          const eDate = new Date(sDate.getTime());
          eDate.setDate(sDate.getDate() + 4);

          sDateStr = sDate.toISOString().slice(0, 10);
          eDateStr = eDate.toISOString().slice(0, 10);
          isoWeek = window.getISOWeek(sDate);
        }

        weeklySchedule.push({
          id: 'w_' + wNum + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          month: cleanedMonth.toUpperCase(),
          weekNumber: [wNum],
          weekLabel: `${wNum}. Hafta`,
          dateRange: dateRangeStr,
          startDate: sDateStr,
          endDate: eDateStr,
          isoWeek: isoWeek,
          classHours: hoursPerWeek,
          unitNo: unitNo,
          unitName: unitName,
          learningOutcomes: outcomes,
          topics: topics,
          descriptions: descriptions,
          specialDays: specialDays,
          assessment: assessment,
          isHoliday: false,
          isCompleted: false
        });

        weekCounter = Math.max(weekCounter, wNum) + 1;
      });
    }

    if (weeklySchedule.length === 0) {
      if (toastCallbackFn) toastCallbackFn('İçe aktarılacak satır bulunamadı.', 'danger');
      return;
    }

    const savedPlan = stateManager.addPlan({
      title: `${className} - ${courseName}`,
      educationYear: educationYear,
      className: className,
      courseName: courseName,
      weeklySchedule: weeklySchedule
    });

    if (!savedPlan) return; // Limit aşıldıysa ekleme yapma ve çık

    modalImportPlan.classList.remove('active');
    if (toastCallbackFn) toastCallbackFn(`"${courseName}" planı başarıyla içe aktarıldı. Toplam ${weeklySchedule.length} hafta oluşturuldu.`, 'success');
    
    activePlansMainTab = 'general';
    if (btnPlansTabGeneral) btnPlansTabGeneral.classList.add('active');
    if (btnPlansTabWeekly) btnPlansTabWeekly.classList.remove('active');
    if (plansTabContentGeneral) plansTabContentGeneral.style.display = 'block';
    if (plansTabContentWeekly) plansTabContentWeekly.style.display = 'none';

    // Expand all months and the plan card itself of the newly imported plan
    expandedPlans[savedPlan.id] = true;
    const scheduleData = savedPlan.weeklySchedule || [];
    scheduleData.forEach(week => {
      if (week.month) {
        expandedMonths[savedPlan.id + '_' + week.month] = true;
      }
    });

    renderPlansList();
  }

  function getActiveWeekIndex(weeklySchedule) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Exact Date range check
    for (let i = 0; i < weeklySchedule.length; i++) {
      const week = weeklySchedule[i];
      if (week.startDate && week.endDate) {
        const sDate = new Date(week.startDate);
        sDate.setHours(0, 0, 0, 0);
        const eDate = new Date(week.endDate);
        eDate.setHours(23, 59, 59, 999);
        // Extend Friday to Sunday for weekend comfort
        eDate.setDate(eDate.getDate() + 2);
        
        if (today >= sDate && today <= eDate) {
          return i;
        }
      }
    }

    // 2. ISO Week code check
    const currentISOWeek = window.getISOWeek(today);
    for (let i = 0; i < weeklySchedule.length; i++) {
      if (weeklySchedule[i].isoWeek === currentISOWeek) {
        return i;
      }
    }

    // 3. First incomplete week fallback
    for (let i = 0; i < weeklySchedule.length; i++) {
      if (!weeklySchedule[i].isHoliday && !weeklySchedule[i].isCompleted) {
        return i;
      }
    }

    return 0;
  }

  function getISOWeekDateRange(weekId) {
    if (!weekId) return '';
    const parts = weekId.split('-W');
    if (parts.length !== 2) return '';
    const year = parseInt(parts[0]);
    const week = parseInt(parts[1]);
    const monday = window.getDayInWeek(year, week, 1);
    const friday = window.getDayInWeek(year, week, 5);
    if (isNaN(monday.getTime()) || isNaN(friday.getTime())) return '';
    const dStart = monday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    const dEnd = friday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${dStart} – ${dEnd}`;
  }

  function renderPlansList() {
    const state = stateManager.loadState();
    const plans = state.plans || [];

    if (!plansSelectedWeekCode) {
      plansSelectedWeekCode = stateManager.getSelectedWeek();
    }

    if (activePlansMainTab === 'weekly') {
      renderWeeklyView();
    } else {
      renderGeneralView();
    }
  }

  function renderWeeklyView() {
    const state = stateManager.loadState();
    const plans = state.plans || [];

    if (!plansWeeklyViewCards || !plansWeeklyEmptyState) return;

    if (plans.length === 0) {
      plansWeeklyViewCards.style.display = 'none';
      plansWeeklyEmptyState.style.display = 'block';
      if (plansWeeklyNavBar) plansWeeklyNavBar.style.display = 'none';
      if (weeklyPlanUploadBtnContainer) weeklyPlanUploadBtnContainer.style.display = 'none';
      return;
    }

    plansWeeklyEmptyState.style.display = 'none';
    plansWeeklyViewCards.style.display = 'flex';
    if (plansWeeklyNavBar) plansWeeklyNavBar.style.display = 'flex';
    if (weeklyPlanUploadBtnContainer) weeklyPlanUploadBtnContainer.style.display = 'flex';
    plansWeeklyViewCards.innerHTML = '';

    if (plansCurrentWeekLabel) {
      plansCurrentWeekLabel.textContent = window.formatWeekTR(plansSelectedWeekCode);
    }
    if (plansCurrentWeekDates) {
      plansCurrentWeekDates.textContent = getISOWeekDateRange(plansSelectedWeekCode);
    }

    plans.forEach(plan => {
      const schedule = plan.weeklySchedule || plan.weeks || [];
      const weekIdx = schedule.findIndex(w => w.isoWeek === plansSelectedWeekCode);
      const weekItem = weekIdx !== -1 ? schedule[weekIdx] : null;

      const card = document.createElement('div');
      card.className = 'weekly-plan-card glass-card';
      card.style.padding = '1.5rem';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '1rem';
      card.style.border = '1px solid var(--border-color)';
      card.style.borderRadius = 'var(--radius-lg)';
      card.style.background = 'var(--bg-secondary)';

      if (weekItem) {
        const isCompleted = weekItem.isCompleted || weekItem.completed;
        
        let outcomesHtml = '';
        if (weekItem.learningOutcomes && weekItem.learningOutcomes.length > 0) {
          if (weekItem.learningOutcomes.length > 3) {
            const visibleOutcomes = weekItem.learningOutcomes.slice(0, 3);
            const hiddenOutcomes = weekItem.learningOutcomes.slice(3);
            outcomesHtml = visibleOutcomes.map(o => `
              <li style="margin-bottom: 0.5rem; display: flex; align-items: start; gap: 0.5rem; font-size: 0.925rem; line-height: 1.45;">
                <span style="color: var(--primary); font-weight: 700; margin-top: 0.15rem;">•</span>
                <span>${escapeHtml(o)}</span>
              </li>
            `).join('') + `
              <div class="hidden-outcomes-container" style="display: none;">
                ${hiddenOutcomes.map(o => `
                  <li style="margin-bottom: 0.5rem; display: flex; align-items: start; gap: 0.5rem; font-size: 0.925rem; line-height: 1.45;">
                    <span style="color: var(--primary); font-weight: 700; margin-top: 0.15rem;">•</span>
                    <span>${escapeHtml(o)}</span>
                  </li>
                `).join('')}
              </div>
              <button class="btn-toggle-outcomes" style="background: none; border: none; color: var(--primary); font-size: 0.8rem; font-weight: 700; padding: 0.2rem 0; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; margin-top: 0.25rem;">
                <span class="btn-toggle-text">Daha Fazla Göster (Genişlet)</span>
                <i data-lucide="chevron-down" class="btn-toggle-icon" style="width: 14px; height: 14px; transition: transform 0.2s;"></i>
              </button>
            `;
          } else {
            outcomesHtml = weekItem.learningOutcomes.map(o => `
              <li style="margin-bottom: 0.5rem; display: flex; align-items: start; gap: 0.5rem; font-size: 0.925rem; line-height: 1.45;">
                <span style="color: var(--primary); font-weight: 700; margin-top: 0.15rem;">•</span>
                <span>${escapeHtml(o)}</span>
              </li>
            `).join('');
          }
        } else {
          outcomesHtml = `<li style="font-style: italic; color: var(--text-muted); list-style: none;">Kazanım belirtilmemiş.</li>`;
        }

        let topicsHtml = '';
        if (weekItem.topics && weekItem.topics.length > 0) {
          topicsHtml = weekItem.topics.map(t => `<span style="display: inline-block; padding: 0.3rem 0.6rem; font-size: 0.75rem; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); border-radius: 99px; font-weight: 600; color: var(--text-secondary);">${escapeHtml(t)}</span>`).join(' ');
        }

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem; flex-wrap: wrap;">
            <div>
              <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(plan.className || 'Sınıf')} • ${escapeHtml(plan.courseName || 'Ders')}</span>
              <h3 style="margin: 0.15rem 0 0 0; font-size: 1.2rem; font-weight: 800; color: var(--text-primary);">${escapeHtml(plan.title || plan.courseName)}</h3>
            </div>
            ${!weekItem.isHoliday ? `
              <div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.03); padding: 0.4rem 0.8rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); width: fit-content;">
                <span class="weekly-status-label" style="font-size: 0.8rem; font-weight: 700; color: ${isCompleted ? 'var(--success)' : 'var(--text-secondary)'};">${isCompleted ? 'Tamamlandı' : 'Tamamlanmadı'}</span>
                <input type="checkbox" class="chk-weekly-plan-complete" data-plan-id="${plan.id}" data-week-idx="${weekIdx}" ${isCompleted ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
              </div>
            ` : `
              <span class="badge" style="background: rgba(6,182,212,0.15); color: var(--info); font-size: 0.8rem; font-weight: 700; padding: 0.3rem 0.6rem; border-radius: var(--radius-sm);">Tatil Haftası</span>
            `}
          </div>

          ${weekItem.isHoliday ? `
            <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--text-muted); font-style: italic; padding: 1rem 0;">
              <i data-lucide="coffee" style="color: var(--info); width: 24px; height: 24px;"></i>
              <span>Bu hafta resmi tatil veya ara tatil olarak işaretlenmiştir.</span>
            </div>
          ` : `
            <div>
              ${weekItem.unitName ? `
                <div style="margin-bottom: 0.75rem;">
                  <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 0.25rem;">Ünite / Tema</span>
                  <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${escapeHtml(weekItem.unitNo ? weekItem.unitNo + '. Ünite: ' + weekItem.unitName : weekItem.unitName)}</span>
                </div>
              ` : ''}

              <div style="margin-bottom: 0.75rem;">
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 0.25rem;">Haftalık Kazanımlar</span>
                <ul style="margin: 0; padding-left: 0; list-style: none;">
                  ${outcomesHtml}
                </ul>
              </div>

              ${topicsHtml ? `
                <div style="margin-bottom: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center;">
                  <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-right: 0.25rem;">Konular:</span>
                  ${topicsHtml}
                </div>
              ` : ''}

              ${weekItem.specialDays ? `
                <div style="margin-bottom: 0.75rem; font-size: 0.8rem; color: #d97706; font-weight: 700; display: flex; align-items: center; gap: 0.35rem; background: rgba(245, 158, 11, 0.05); padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); width: fit-content; border-left: 3px solid #f59e0b;">
                  <i data-lucide="award" style="width: 14px; height: 14px;"></i> Belirli Gün/Hafta: ${escapeHtml(weekItem.specialDays)}
                </div>
              ` : ''}

              ${weekItem.assessment && weekItem.assessment.length > 0 ? `
                <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.75rem; font-size: 0.8rem; color: var(--text-muted);">
                  <strong>Ölçme ve Değerlendirme:</strong> ${escapeHtml(weekItem.assessment.join(', '))}
                </div>
              ` : ''}
            </div>
          `}
        `;

        // Checkbox event listener
        const chk = card.querySelector('.chk-weekly-plan-complete');
        if (chk) {
          chk.addEventListener('change', (e) => {
            const pId = e.target.getAttribute('data-plan-id');
            const wIdx = parseInt(e.target.getAttribute('data-week-idx'));
            stateManager.toggleWeekCompleted(pId, wIdx);
            
            // UI instant update
            const label = card.querySelector('.weekly-status-label');
            if (e.target.checked) {
              if (label) {
                label.textContent = 'Tamamlandı';
                label.style.color = 'var(--success)';
              }
            } else {
              if (label) {
                label.textContent = 'Tamamlanmadı';
                label.style.color = 'var(--text-secondary)';
              }
            }
            if (toastCallbackFn) toastCallbackFn('Konu tamamlanma durumu güncellendi.', 'success');
          });
        }

        // Toggle outcomes button event listener
        const toggleBtn = card.querySelector('.btn-toggle-outcomes');
        if (toggleBtn) {
          toggleBtn.addEventListener('click', () => {
            const container = card.querySelector('.hidden-outcomes-container');
            const icon = toggleBtn.querySelector('.btn-toggle-icon');
            const text = toggleBtn.querySelector('.btn-toggle-text');
            const isExpanded = container.style.display !== 'none';
            
            if (isExpanded) {
              container.style.display = 'none';
              text.textContent = 'Daha Fazla Göster (Genişlet)';
              if (icon) icon.style.transform = 'rotate(0deg)';
            } else {
              container.style.display = 'block';
              text.textContent = 'Daha Az Göster (Daralt)';
              if (icon) icon.style.transform = 'rotate(180deg)';
            }
          });
        }
      } else {
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem;">
            <div>
              <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(plan.className || 'Sınıf')} • ${escapeHtml(plan.courseName || 'Ders')}</span>
              <h3 style="margin: 0.15rem 0 0 0; font-size: 1.2rem; font-weight: 800; color: var(--text-primary);">${escapeHtml(plan.title || plan.courseName)}</h3>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--text-muted); font-style: italic; padding: 0.5rem 0;">
            <i data-lucide="info" style="color: var(--text-muted); width: 20px; height: 20px;"></i>
            <span>Bu ders için seçili haftada planlanmış bir konu bulunmamaktadır.</span>
          </div>
        `;
      }
      // Lisans kısıtlama kontrolü
      const originalIndex = plans.findIndex(p => p.id === plan.id);
      const isPassive = window.LicenseConfig && window.LicenseConfig.isDemo && originalIndex >= window.LicenseConfig.planLimit;
      if (isPassive) {
        card.classList.add('passive-locked');
        const lockOverlay = document.createElement('div');
        lockOverlay.className = 'lock-overlay';
        lockOverlay.innerHTML = `<i data-lucide="lock"></i><span>Pasif (Lisans Gerekli)</span>`;
        lockOverlay.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (window.showToast) {
            window.showToast("Lisans süreniz dolduğu için bu plan pasif durumdadır. Lütfen lisansınızı yenileyin.", "warning");
          } else {
            alert("Lisans süreniz dolduğu için bu plan pasif durumdadır. Lütfen lisansınızı yenileyin.");
          }
        });
        card.appendChild(lockOverlay);
      }

      plansWeeklyViewCards.appendChild(card);
    });

    window.safeCreateIcons();
  }

  function renderGeneralView() {
    const state = stateManager.loadState();
    const plans = state.plans || [];

    if (!plansGeneralListContainer || !plansGeneralEmptyState) return;

    if (plans.length === 0) {
      plansGeneralListContainer.style.display = 'none';
      plansGeneralEmptyState.style.display = 'block';
      return;
    }

    plansGeneralEmptyState.style.display = 'none';
    plansGeneralListContainer.style.display = 'flex';
    plansGeneralListContainer.innerHTML = '';

    const currentWeekId = stateManager.getSelectedWeek();

    plans.forEach(plan => {
      const schedule = plan.weeklySchedule || plan.weeks || [];
      const completedCount = schedule.filter(w => w.isCompleted || w.completed).length;
      const progressPercent = schedule.length > 0 ? Math.round((completedCount / schedule.length) * 100) : 0;

      const isPlanExpanded = expandedPlans[plan.id] !== undefined ? 
        expandedPlans[plan.id] : 
        (plans.length === 1);

      const planCard = document.createElement('div');
      planCard.className = 'plan-general-card glass-card';
      planCard.style.padding = '1.25rem';
      planCard.style.border = '1px solid var(--border-color)';
      planCard.style.borderRadius = 'var(--radius-lg)';
      planCard.style.background = 'var(--bg-secondary)';
      planCard.style.display = 'flex';
      planCard.style.flexDirection = 'column';
      planCard.style.gap = '1rem';

      // Header block
      planCard.innerHTML = `
        <!-- Plan Header Toggle Area -->
        <div class="plan-card-header-toggle" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; user-select: none;" data-plan-id="${plan.id}">
          <div style="display: flex; align-items: start; gap: 0.75rem; flex: 1.5; min-width: 0;">
            <i data-lucide="chevron-right" class="plan-chevron-icon" style="width: 20px; height: 20px; color: var(--primary); margin-top: 0.15rem; transition: transform 0.2s; transform: ${isPlanExpanded ? 'rotate(90deg)' : 'rotate(0deg)'};"></i>
            <div style="flex: 1; min-width: 0;">
              <h3 class="general-plan-title" style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${escapeHtml(plan.title)}</h3>
              <div class="plan-meta" style="margin-top: 0.3rem; display: flex; gap: 0.75rem; flex-wrap: wrap; font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">
                <span><i data-lucide="info" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle; margin-right: 0.15rem;"></i>Sınıf: ${escapeHtml(plan.className || 'Belirtilmemiş')}</span>
                <span><i data-lucide="calendar" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle; margin-right: 0.15rem;"></i>Dönem: ${escapeHtml(plan.educationYear || '2025-2026')}</span>
                <span><i data-lucide="layers" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle; margin-right: 0.15rem;"></i>${schedule.length} Hafta</span>
              </div>
            </div>
          </div>
          
          <!-- Animated Progress Bar with Percentage On Top -->
          <div style="flex: 1; max-width: 200px; min-width: 80px; margin: 0 0.5rem; flex-shrink: 1;" class="plan-header-progress-wrapper">
            <div class="general-plan-progress-bg">
              <div class="general-plan-progress-fill" style="width: ${progressPercent}%;"></div>
              <span style="position: relative; z-index: 2; font-size: 0.72rem; font-weight: 800; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">%${progressPercent}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: 0.35rem; flex-shrink: 0;" class="plan-header-action-buttons">
            <button class="btn btn-secondary btn-sm btn-general-rename" data-plan-id="${plan.id}" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; height: auto; font-weight: 700; display: inline-flex; align-items: center; gap: 0.15rem;">
              <i data-lucide="edit" style="width: 11px; height: 11px;"></i>
            </button>
            <button class="btn btn-danger btn-sm btn-general-delete" data-plan-id="${plan.id}" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; height: auto; font-weight: 700; display: inline-flex; align-items: center; gap: 0.15rem;">
              <i data-lucide="trash-2" style="width: 11px; height: 11px;"></i>
            </button>
          </div>
        </div>

        <!-- Plan Collapsible Body -->
        <div class="plan-card-body-content" style="display: ${isPlanExpanded ? 'flex' : 'none'}; flex-direction: column; gap: 1rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1rem;">
          <!-- Accordions for Months -->
          <div class="months-accordions-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <!-- JS monthly items will be loaded here -->
          </div>
        </div>
      `;

      // Group weeks by month
      const monthsOrder = [];
      const groupedMonths = {};

      schedule.forEach((weekItem, idx) => {
        const mName = weekItem.month || 'DİĞER / TARİHSİZ';
        if (!groupedMonths[mName]) {
          groupedMonths[mName] = [];
          monthsOrder.push(mName);
        }
        groupedMonths[mName].push({ weekItem, idx });
      });

      const accordionsContainer = planCard.querySelector('.months-accordions-list');
      
      // Determine which month is active based on current active week
      const activeWeekIdx = getActiveWeekIndex(schedule);
      let activeMonthName = '';
      if (schedule[activeWeekIdx]) {
        activeMonthName = schedule[activeWeekIdx].month || 'DİĞER / TARİHSİZ';
      }

      monthsOrder.forEach(monthName => {
        const monthWeeks = groupedMonths[monthName];
        const completedWeeksCount = monthWeeks.filter(mw => mw.weekItem.isCompleted || mw.weekItem.completed).length;
        const monthProgressPercent = monthWeeks.length > 0 ? Math.round((completedWeeksCount / monthWeeks.length) * 100) : 0;

        const isMonthExpanded = expandedMonths[plan.id + '_' + monthName] !== undefined ? 
          expandedMonths[plan.id + '_' + monthName] : 
          (monthName === activeMonthName);

        const monthAccordion = document.createElement('div');
        monthAccordion.className = 'month-accordion';
        monthAccordion.style.border = '1px solid var(--border-color)';
        monthAccordion.style.borderRadius = 'var(--radius-md)';
        monthAccordion.style.overflow = 'hidden';
        monthAccordion.style.background = 'rgba(255,255,255,0.01)';

        monthAccordion.innerHTML = `
          <div class="month-header-toggle" style="padding: 0.9rem 1.1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); user-select: none;" data-plan-id="${plan.id}" data-month-name="${escapeHtml(monthName)}">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <i data-lucide="chevron-right" class="month-chevron-icon" style="width: 18px; height: 18px; color: var(--primary); transition: transform 0.2s; transform: ${isMonthExpanded ? 'rotate(90deg)' : 'rotate(0deg)'};"></i>
              <span style="font-weight: 750; font-size: 0.95rem; color: var(--text-primary);">${escapeHtml(monthName)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${monthWeeks.length} Çalışma Haftası</span>
              <span class="badge" style="background: ${monthProgressPercent === 100 ? 'rgba(16,185,129,0.15)' : 'rgba(79,70,229,0.12)'}; color: ${monthProgressPercent === 100 ? 'var(--success)' : 'var(--primary)'}; font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); font-weight: 700;">%${monthProgressPercent}</span>
            </div>
          </div>
          <div class="month-body-content" style="display: ${isMonthExpanded ? 'flex' : 'none'}; padding: 0.75rem; flex-direction: column; gap: 0.5rem; background: rgba(0,0,0,0.1); border-top: 1px solid var(--border-color);">
            <!-- Weeks list -->
          </div>
        `;

        const monthBody = monthAccordion.querySelector('.month-body-content');

        monthWeeks.forEach(({ weekItem, idx }) => {
          const isCompleted = weekItem.isCompleted || weekItem.completed;
          const isActive = weekItem.isoWeek === currentWeekId;
          const isWeekExpanded = (idx === activeWeekIdx);

          let badgeHtml = '';
          if (isActive) {
            badgeHtml = '<span style="background: rgba(16,185,129,0.15); color: var(--success); font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: var(--radius-xs); font-weight: 700; text-transform: uppercase; white-space: nowrap;">Aktif Hafta</span>';
          } else if (isCompleted) {
            badgeHtml = '<span style="background: rgba(79,70,229,0.12); color: var(--primary); font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: var(--radius-xs); font-weight: 700; text-transform: uppercase; white-space: nowrap;">İşlendi</span>';
          }

          const weekAccordion = document.createElement('div');
          weekAccordion.className = 'week-accordion-item';
          weekAccordion.style.border = '1px solid var(--border-color)';
          weekAccordion.style.borderRadius = 'var(--radius-sm)';
          weekAccordion.style.background = 'var(--bg-secondary)';
          weekAccordion.style.overflow = 'hidden';

          const mainTopic = (weekItem.topics && weekItem.topics.length > 0) ? weekItem.topics[0] : (weekItem.content || 'Ders konusu');

          let outcomesListHtml = '';
          if (weekItem.learningOutcomes && weekItem.learningOutcomes.length > 0) {
            outcomesListHtml = weekItem.learningOutcomes.map(o => `
              <li style="margin-bottom: 0.35rem; line-height: 1.45; color: var(--text-primary); font-size: 0.85rem;">
                ${escapeHtml(o)}
              </li>
            `).join('');
          } else {
            outcomesListHtml = `<li style="font-style: italic; color: var(--text-muted); list-style: none; font-size: 0.85rem;">Kazanım listesi boş.</li>`;
          }

          let topicsTags = '';
          if (weekItem.topics && weekItem.topics.length > 0) {
            topicsTags = weekItem.topics.map(t => `<span style="display: inline-block; padding: 0.2rem 0.5rem; font-size: 0.7rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-secondary); margin-right: 0.25rem;">${escapeHtml(t)}</span>`).join('');
          }

          weekAccordion.innerHTML = `
            <div class="week-header-toggle" style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; cursor: ${weekItem.isHoliday ? 'default' : 'pointer'}; user-select: none;" data-idx="${idx}">
              <div style="display: flex; align-items: center; gap: 0.6rem; flex: 1; min-width: 0;">
                ${!weekItem.isHoliday ? `<i data-lucide="chevron-right" class="week-chevron-icon" style="width: 14px; height: 14px; color: var(--text-muted); flex-shrink: 0; transition: transform 0.2s; transform: ${isWeekExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}"></i>` : '<i data-lucide="coffee" style="width: 14px; height: 14px; color: var(--info); flex-shrink: 0;"></i>'}
                <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary); min-width: 60px;">${escapeHtml(weekItem.weekLabel)}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; min-width: 110px;">${escapeHtml(weekItem.dateRange)}</div>
                <div style="font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; margin-left: 0.5rem;" class="week-strip-content">${escapeHtml(weekItem.isHoliday ? 'Eğitim Öğretime Ara' : mainTopic)}</div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; margin-left: 0.5rem;" class="week-action-area">
                ${badgeHtml}
                ${!weekItem.isHoliday ? `
                  <input type="checkbox" class="chk-general-week-complete" data-plan-id="${plan.id}" data-week-idx="${idx}" ${isCompleted ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer;">
                ` : ''}
              </div>
            </div>

            ${!weekItem.isHoliday ? `
              <div class="week-detail-body" style="display: ${isWeekExpanded ? 'block' : 'none'}; padding: 0.9rem; background: rgba(0,0,0,0.06); border-top: 1px solid var(--border-color);">
                ${weekItem.unitName ? `<div style="font-size: 0.75rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem; text-transform: uppercase;">${escapeHtml(weekItem.unitNo ? weekItem.unitNo + '. ÜNİTE: ' + weekItem.unitName : weekItem.unitName)}</div>` : ''}
                
                <div style="margin-bottom: 0.75rem;">
                  <h5 style="margin: 0 0 0.35rem 0; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Kazanımlar</h5>
                  <ul style="margin: 0; padding: 0 0 0 1.1rem; list-style: none;">
                    ${outcomesListHtml}
                  </ul>
                </div>

                ${topicsTags ? `<div style="margin-bottom: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.25rem;">${topicsTags}</div>` : ''}

                ${weekItem.specialDays ? `
                  <div style="font-size: 0.75rem; color: #d97706; font-weight: 700; margin-bottom: 0.5rem;">
                    <i data-lucide="award" style="width: 12px; height: 12px; display: inline; vertical-align: middle;"></i> Belirli Gün: ${escapeHtml(weekItem.specialDays)}
                  </div>
                ` : ''}

                ${weekItem.assessment && weekItem.assessment.length > 0 ? `
                  <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
                    <strong>Değerlendirme:</strong> ${escapeHtml(weekItem.assessment.join(', '))}
                  </div>
                ` : ''}
              </div>
            ` : ''}
          `;

          // Week complete checkbox event
          const chk = weekAccordion.querySelector('.chk-general-week-complete');
          if (chk) {
            chk.addEventListener('change', (e) => {
              const pId = e.target.getAttribute('data-plan-id');
              const wIdx = parseInt(e.target.getAttribute('data-week-idx'));
              stateManager.toggleWeekCompleted(pId, wIdx);
              renderGeneralView();
              if (toastCallbackFn) toastCallbackFn('Konu tamamlanma durumu güncellendi.', 'success');
            });
          }

          // Week header click expand toggle
          if (!weekItem.isHoliday) {
            weekAccordion.querySelector('.week-header-toggle').addEventListener('click', (e) => {
              // Ignore clicks on check box or badge
              if (e.target.closest('.week-action-area')) return;

              const chevron = weekAccordion.querySelector('.week-chevron-icon');
              const body = weekAccordion.querySelector('.week-detail-body');
              const isExpanded = body.style.display !== 'none';

              if (isExpanded) {
                body.style.display = 'none';
                if (chevron) chevron.style.transform = 'rotate(0deg)';
              } else {
                body.style.display = 'block';
                if (chevron) chevron.style.transform = 'rotate(90deg)';
              }
            });
          }

          monthBody.appendChild(weekAccordion);
        });

        // Month Header toggle expand
        monthAccordion.querySelector('.month-header-toggle').addEventListener('click', (e) => {
          const chevron = monthAccordion.querySelector('.month-chevron-icon');
          const isExpanded = monthBody.style.display !== 'none';

          if (isExpanded) {
            monthBody.style.display = 'none';
            if (chevron) chevron.style.transform = 'rotate(0deg)';
            expandedMonths[plan.id + '_' + monthName] = false;
          } else {
            monthBody.style.display = 'flex';
            if (chevron) chevron.style.transform = 'rotate(90deg)';
            expandedMonths[plan.id + '_' + monthName] = true;
          }
        });

        accordionsContainer.appendChild(monthAccordion);
      });

      // Header click toggle expand/collapse
      planCard.querySelector('.plan-card-header-toggle').addEventListener('click', (e) => {
        // Prevent toggling when clicking rename or delete buttons
        if (e.target.closest('.plan-header-action-buttons')) return;

        const chevron = planCard.querySelector('.plan-chevron-icon');
        const body = planCard.querySelector('.plan-card-body-content');
        const isExpanded = body.style.display !== 'none';

        if (isExpanded) {
          body.style.display = 'none';
          if (chevron) chevron.style.transform = 'rotate(0deg)';
          expandedPlans[plan.id] = false;
        } else {
          body.style.display = 'flex';
          if (chevron) chevron.style.transform = 'rotate(90deg)';
          expandedPlans[plan.id] = true;
        }
      });

      // Actions inside card
      planCard.querySelector('.btn-general-rename').addEventListener('click', (e) => {
        e.stopPropagation();
        const newTitle = prompt('Plan için yeni bir isim girin:', plan.courseName || plan.title);
        if (newTitle && newTitle.trim()) {
          const titleVal = newTitle.trim();
          
          // Modify directly in stateManager.state.plans so it gets saved properly
          const statePlan = stateManager.state.plans.find(p => p.id === plan.id);
          if (statePlan) {
            statePlan.courseName = titleVal;
            statePlan.title = `${statePlan.className || 'Sınıf'} - ${titleVal}`;
            stateManager.saveState();
            renderGeneralView();
            if (toastCallbackFn) toastCallbackFn('Plan başarıyla yeniden adlandırıldı.', 'success');
          }
        }
      });

      planCard.querySelector('.btn-general-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Bu ders planını tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
          stateManager.deletePlan(plan.id);
          renderGeneralView();
          if (toastCallbackFn) toastCallbackFn('Ders planı silindi.', 'info');
        }
      });

      // Lisans kısıtlama kontrolü
      const originalIndex = plans.findIndex(p => p.id === plan.id);
      const isPassive = window.LicenseConfig && window.LicenseConfig.isDemo && originalIndex >= window.LicenseConfig.planLimit;
      if (isPassive) {
        planCard.classList.add('passive-locked');
        const lockOverlay = document.createElement('div');
        lockOverlay.className = 'lock-overlay';
        lockOverlay.innerHTML = `<i data-lucide="lock"></i><span>Pasif (Lisans Gerekli)</span>`;
        lockOverlay.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (window.showToast) {
            window.showToast("Lisans süreniz dolduğu için bu plan pasif durumdadır. Lütfen lisansınızı yenileyin.", "warning");
          } else {
            alert("Lisans süreniz dolduğu için bu plan pasif durumdadır. Lütfen lisansınızı yenileyin.");
          }
        });
        planCard.appendChild(lockOverlay);
      }

      plansGeneralListContainer.appendChild(planCard);
    });

    window.safeCreateIcons();
  }

  function showPlanDetail(planId) {
    activePlansMainTab = 'general';
    if (btnPlansTabGeneral) btnPlansTabGeneral.classList.add('active');
    if (btnPlansTabWeekly) btnPlansTabWeekly.classList.remove('active');
    if (plansTabContentGeneral) plansTabContentGeneral.style.display = 'block';
    if (plansTabContentWeekly) plansTabContentWeekly.style.display = 'none';

    // Find the plan in state and expand all its months and the card itself
    const state = stateManager.loadState();
    const plan = state.plans.find(p => p.id === planId);
    if (plan) {
      expandedPlans[plan.id] = true;
      const schedule = plan.weeklySchedule || plan.weeks || [];
      schedule.forEach(week => {
        if (week.month) {
          expandedMonths[plan.id + '_' + week.month] = true;
        }
      });
    }
    renderPlansList();
  }

  function escapeHtml(string) {
    if (!string) return '';
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.setupPlans = setupPlans;
  window.renderPlansList = renderPlansList;
  window.showPlanDetail = showPlanDetail;

})();
