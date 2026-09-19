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

  // Copy-Paste Tabs & AI & MEB Curriculum Pool
  let importTabCurriculum;
  let importTabFile;
  let importTabPaste;
  let importTabAi;
  let panelImportCurriculum;
  let panelImportFile;
  let panelImportPaste;
  let panelImportAi;
  let mebCurriculumCardsContainer;
  let mebGradeFilterGroup;
  let mebCurriculumSearch;
  let panelCurriculumPreview;
  let previewCurriculumTitle;
  let previewCurriculumTableContainer;
  let btnCloseCurriculumPreview;
  let btnCancelCurriculumPreview;
  let selectedCurriculumGrade = 3;
  let previewingMebPlan = null;
  let planImportTopRow;
  let planCourseSelectGroup;
  let planPasteText;
  let btnParsePastedText;
  let btnGenerateAiAnnualPlan;
  let aiPlanHours;
  let aiPlanCurriculumStyle;
  let aiPlanNotes;
  let aiPlanGenStatus;
  let aiPlanGenStatusText;
  let btnAiAutoMapPlan;
  let aiPlanMappingStatus;

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

    // Tabs for Source & AI & MEB Curriculum Pool
    importTabCurriculum = document.getElementById('import-tab-curriculum');
    importTabFile = document.getElementById('import-tab-file');
    importTabPaste = document.getElementById('import-tab-paste');
    importTabAi = document.getElementById('import-tab-ai');
    panelImportCurriculum = document.getElementById('panel-import-curriculum');
    panelImportFile = document.getElementById('panel-import-file');
    panelImportPaste = document.getElementById('panel-import-paste');
    panelImportAi = document.getElementById('panel-import-ai');
    mebCurriculumCardsContainer = document.getElementById('meb-curriculum-cards-container');
    mebGradeFilterGroup = document.getElementById('meb-grade-filter-group');
    mebCurriculumSearch = document.getElementById('meb-curriculum-search');
    panelCurriculumPreview = document.getElementById('panel-curriculum-preview');
    previewCurriculumTitle = document.getElementById('preview-curriculum-title');
    previewCurriculumTableContainer = document.getElementById('preview-curriculum-table-container');
    btnCloseCurriculumPreview = document.getElementById('btn-close-curriculum-preview');
    btnCancelCurriculumPreview = document.getElementById('btn-cancel-curriculum-preview');
    btnConfirmCurriculumUse = document.getElementById('btn-confirm-curriculum-use');
    planImportTopRow = document.getElementById('plan-import-top-row');
    planCourseSelectGroup = document.getElementById('plan-course-select-group');

    planPasteText = document.getElementById('plan-paste-text');
    btnParsePastedText = document.getElementById('btn-parse-pasted-text');
    btnGenerateAiAnnualPlan = document.getElementById('btn-generate-ai-annual-plan');
    aiPlanHours = document.getElementById('ai-plan-hours');
    aiPlanCurriculumStyle = document.getElementById('ai-plan-curriculum-style');
    aiPlanNotes = document.getElementById('ai-plan-notes');
    aiPlanGenStatus = document.getElementById('ai-plan-gen-status');
    aiPlanGenStatusText = document.getElementById('ai-plan-gen-status-text');
    btnAiAutoMapPlan = document.getElementById('btn-ai-auto-map-plan');
    aiPlanMappingStatus = document.getElementById('ai-plan-mapping-status');

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
    function switchImportTab(tabName) {
      const tabs = [
        { btn: importTabCurriculum, panel: panelImportCurriculum, name: 'curriculum' },
        { btn: importTabFile, panel: panelImportFile, name: 'file' },
        { btn: importTabPaste, panel: panelImportPaste, name: 'paste' },
        { btn: importTabAi, panel: panelImportAi, name: 'ai' }
      ];

      tabs.forEach(t => {
        if (!t.btn || !t.panel) return;
        if (t.name === tabName) {
          t.btn.classList.add('active');
          t.btn.style.borderBottom = '2px solid var(--primary)';
          t.btn.style.fontWeight = '700';
          t.btn.style.color = 'var(--text-primary)';
          t.panel.style.display = 'block';
        } else {
          t.btn.classList.remove('active');
          t.btn.style.borderBottom = '2px solid transparent';
          t.btn.style.fontWeight = '600';
          t.btn.style.color = 'var(--text-muted)';
          t.panel.style.display = 'none';
        }
      });

      if (btnImportSave) {
        btnImportSave.style.display = 'none';
      }

      if (tabName === 'curriculum') {
        if (planCourseSelectGroup) planCourseSelectGroup.style.display = 'none';
        if (planImportTopRow) planImportTopRow.style.gridTemplateColumns = '1fr 1fr';
        const q = mebCurriculumSearch ? mebCurriculumSearch.value.trim().toLocaleLowerCase('tr-TR') : '';
        renderMebCurriculumPool(selectedCurriculumGrade, q);
      } else {
        if (planCourseSelectGroup) planCourseSelectGroup.style.display = 'block';
        if (planImportTopRow) planImportTopRow.style.gridTemplateColumns = '1fr 1fr 1fr';
      }
    }

    if (importTabCurriculum) {
      importTabCurriculum.addEventListener('click', () => switchImportTab('curriculum'));
    }
    if (importTabFile) {
      importTabFile.addEventListener('click', () => switchImportTab('file'));
    }
    if (importTabPaste) {
      importTabPaste.addEventListener('click', () => switchImportTab('paste'));
    }
    if (importTabAi) {
      importTabAi.addEventListener('click', () => switchImportTab('ai'));
    }

    // MEB Sınıf Düzeyi Filtreleme Dinleyicileri
    if (mebGradeFilterGroup) {
      const gradeButtons = mebGradeFilterGroup.querySelectorAll('.meb-grade-btn');
      gradeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          gradeButtons.forEach(b => {
            b.classList.remove('active', 'btn-primary');
            b.classList.add('btn-secondary');
          });
          btn.classList.add('active', 'btn-primary');
          btn.classList.remove('btn-secondary');
          selectedCurriculumGrade = parseInt(btn.dataset.grade) || 3;

          // Eğer sınıf/şube kutusunda sadece seviye değişikliği uyumluysa güncelle
          if (planClassName) {
            const currentVal = planClassName.value.trim();
            const branchMatch = currentVal.match(/\/?([A-Za-zÇĞİÖŞÜçğıöşü]+)$/);
            const branch = branchMatch ? branchMatch[1] : 'A';
            planClassName.value = `${selectedCurriculumGrade}/${branch}`;
          }

          const q = mebCurriculumSearch ? mebCurriculumSearch.value.trim().toLocaleLowerCase('tr-TR') : '';
          renderMebCurriculumPool(selectedCurriculumGrade, q);
        });
      });
    }

    // MEB Ders Arama Kutusu
    if (mebCurriculumSearch) {
      mebCurriculumSearch.addEventListener('input', () => {
        const q = mebCurriculumSearch.value.trim().toLocaleLowerCase('tr-TR');
        renderMebCurriculumPool(selectedCurriculumGrade, q);
      });
    }

    // Sınıf / Şube adı değiştiğinde havuzdaki "Eklendi" durumlarını canlı güncelle
    if (planClassName) {
      planClassName.addEventListener('input', () => {
        const q = mebCurriculumSearch ? mebCurriculumSearch.value.trim().toLocaleLowerCase('tr-TR') : '';
        renderMebCurriculumPool(selectedCurriculumGrade, q);
      });
    }

    // MEB Önizleme Kontrolleri
    if (btnCloseCurriculumPreview) {
      btnCloseCurriculumPreview.addEventListener('click', closeCurriculumPreview);
    }
    if (btnCancelCurriculumPreview) {
      btnCancelCurriculumPreview.addEventListener('click', closeCurriculumPreview);
    }
    if (btnConfirmCurriculumUse) {
      btnConfirmCurriculumUse.addEventListener('click', () => {
        if (previewingMebPlan) {
          addMebCurriculumPlanToUserPlans(previewingMebPlan.id);
        }
      });
    }

    // AI Buttons Listeners
    if (btnAiAutoMapPlan) {
      btnAiAutoMapPlan.addEventListener('click', handleAiAutoMapPlan);
    }
    if (btnGenerateAiAnnualPlan) {
      btnGenerateAiAnnualPlan.addEventListener('click', handleGenerateAiAnnualPlan);
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
    
    // Mevcut bir plan varsa varsayılan sınıf olarak onun şubesini kullan
    const existingPlans = (stateManager.state && stateManager.state.plans) ? stateManager.state.plans : [];
    const defaultClass = existingPlans.length > 0 && existingPlans[0].className ? existingPlans[0].className : '3/A';
    if (planClassName) planClassName.value = defaultClass;

    // Sınıf seviyesini varsayılan sınıftan tespit et
    const gradeMatch = defaultClass.match(/^(\d+)/);
    if (gradeMatch) {
      selectedCurriculumGrade = parseInt(gradeMatch[1]) || 3;
    }

    // İlgili sınıf butonunu aktif yap
    if (mebGradeFilterGroup) {
      const gradeButtons = mebGradeFilterGroup.querySelectorAll('.meb-grade-btn');
      gradeButtons.forEach(b => {
        if (parseInt(b.dataset.grade) === selectedCurriculumGrade) {
          b.classList.add('active', 'btn-primary');
          b.classList.remove('btn-secondary');
        } else {
          b.classList.remove('active', 'btn-primary');
          b.classList.add('btn-secondary');
        }
      });
    }

    if (mebCurriculumSearch) mebCurriculumSearch.value = '';
    closeCurriculumPreview();

    if (planEducationYear) planEducationYear.value = '2026-2027';
    if (aiPlanNotes) aiPlanNotes.value = '';
    if (aiPlanGenStatus) aiPlanGenStatus.style.display = 'none';
    if (aiPlanMappingStatus) {
      aiPlanMappingStatus.style.display = 'none';
      aiPlanMappingStatus.innerHTML = '';
    }

    if (importTabCurriculum) {
      importTabCurriculum.click();
    } else if (importTabFile) {
      importTabFile.click();
    }
  }

  function detectCourseAndClassFromContent(rawText, sheetRows, fileName) {
    const combined = ((rawText || '') + ' ' + (fileName || '') + ' ' + 
      (sheetRows ? sheetRows.slice(0, 20).map(r => (r || []).join(' ')).join(' ') : '')
    ).toLocaleLowerCase('tr-TR');

    const coursePatterns = [
      { name: 'Sosyal Bilgiler', regex: /sosyal\s*bilgiler|sosyal\s*bilgi/i },
      { name: 'Fen Bilimleri', regex: /fen\s*bilimleri|fen\s*ve\s*teknoloji/i },
      { name: 'Matematik', regex: /matematik/i },
      { name: 'Türkçe', regex: /türkçe|turkce/i },
      { name: 'Hayat Bilgisi', regex: /hayat\s*bilgisi/i },
      { name: 'İngilizce', regex: /ingilizce|english/i },
      { name: 'Din Kültürü ve Ahlak Bilgisi', regex: /din\s*kültürü|din\s*kulturu/i },
      { name: 'Görsel Sanatlar', regex: /görsel\s*sanatlar|gorsel\s*sanatlar|resim/i },
      { name: 'Müzik', regex: /müzik|muzik/i },
      { name: 'Beden Eğitimi ve Oyun', regex: /beden\s*eğitimi|beden\s*egitimi|oyun\s*ve\s*fiziki/i },
      { name: 'Trafik Güvenliği', regex: /trafik\s*güvenliği|trafik\s*guvenligi/i },
      { name: 'İnsan Hakları, Yurttaşlık ve Demokrasi', regex: /insan\s*hakları|insan\s*haklari|yurttaşlık|yurttaslik/i },
      { name: 'Bilişim Teknolojileri ve Yazılım', regex: /bilişim|bilisim|kodlama/i }
    ];

    let detectedCourse = '';
    for (const cp of coursePatterns) {
      if (cp.regex.test(combined)) {
        detectedCourse = cp.name;
        break;
      }
    }

    let detectedGrade = '';
    const gradeMatch = combined.match(/\b([1-8])\s*[\.\/]?\s*(?:sınıf|sinif|grade|\b([a-zğüşıöç])\b)/i);
    if (gradeMatch) {
      const gNum = gradeMatch[1];
      const branch = gradeMatch[2] ? gradeMatch[2].toUpperCase() : 'A';
      detectedGrade = `${gNum}/${branch}`;
    }

    return { detectedCourse, detectedGrade };
  }

  function applyDetectedCourseAndClass(detectedCourse, detectedGrade) {
    // Öğretmen modalda zaten bir ders seçtiyse veya girdiyse, öğretmenin seçimini KORU!
    const userAlreadySelected = (planCourseNameSelect && planCourseNameSelect.value && planCourseNameSelect.value !== 'custom') || (planCourseNameInput && planCourseNameInput.value.trim() && !/^[a-f0-9]{6,}$/i.test(planCourseNameInput.value.trim()));
    if (!userAlreadySelected && detectedCourse) {
      let matchedInSelect = false;
      if (planCourseNameSelect) {
        for (let opt of planCourseNameSelect.options) {
          if (opt.value && opt.value !== 'custom' && (opt.value.toLowerCase() === detectedCourse.toLowerCase() || (window.isLessonPlanMatch && window.isLessonPlanMatch(detectedCourse, opt.value)))) {
            planCourseNameSelect.value = opt.value;
            matchedInSelect = true;
            break;
          }
        }
      }
      if (matchedInSelect) {
        if (planCourseNameInput) planCourseNameInput.value = planCourseNameSelect.value;
        if (planCourseNameInputContainer) planCourseNameInputContainer.style.display = 'none';
      } else {
        if (planCourseNameSelect) planCourseNameSelect.value = 'custom';
        if (planCourseNameInput) planCourseNameInput.value = detectedCourse;
        if (planCourseNameInputContainer) planCourseNameInputContainer.style.display = 'block';
      }
    }
    if (detectedGrade && planClassName && (!planClassName.value || planClassName.value === '3/A')) {
      planClassName.value = detectedGrade;
    }
  }

  function enrichOutcomes(outcomes, topics, descriptions, contentVal, rowCells) {
    let cleanOutcomes = (outcomes || []).map(o => String(o).trim()).filter(Boolean);
    const cleanTopics = (topics || []).map(t => String(t).trim()).filter(Boolean);
    const cleanDescs = (descriptions || []).map(d => String(d).trim()).filter(Boolean);

    const isBareNumeric = (arr) => arr.length > 0 && arr.every(item => /^\d+[\.\)]?$/.test(item.trim()));

    if (cleanOutcomes.length === 0 || isBareNumeric(cleanOutcomes)) {
      const numPrefix = (cleanOutcomes.length > 0 && isBareNumeric(cleanOutcomes)) ? cleanOutcomes[0].replace(/[\.\)]$/, '') : '';
      
      let candidateText = '';
      if (cleanDescs.length > 0) {
        candidateText = cleanDescs.join('; ');
      }
      if (!candidateText && cleanTopics.length > 0) {
        const longTopic = cleanTopics.find(t => t.length > 15 || /(?:tanır|açıklar|kavrar|uygular|belirtir|fark|özen|gösterir|yapar|edinir|geliştirir)[\.\s]*$/i.test(t));
        candidateText = longTopic || cleanTopics.join(', ');
      }
      if (!candidateText && contentVal && contentVal.length > 8) {
        candidateText = contentVal;
      }
      if (!candidateText && Array.isArray(rowCells)) {
        for (const cell of rowCells) {
          const str = String(cell || '').trim();
          if (str.length > 15 && !/^\d+[\.\/\-]\d+/.test(str) && !/^(?:hafta|tarih|saat|ay)$/i.test(str)) {
            candidateText = str;
            break;
          }
        }
      }

      if (candidateText) {
        if (numPrefix && !new RegExp(`^${numPrefix}[\\.\\)\\-\\s]`).test(candidateText)) {
          cleanOutcomes = [`${numPrefix}. ${candidateText}`];
        } else {
          cleanOutcomes = [candidateText];
        }
      }
    }

    return cleanOutcomes;
  }

  function formatOutcomeDisplay(outcomeStr, weekItem) {
    const str = String(outcomeStr || '').trim();
    if (/^\d+[\.\)]?$/.test(str)) {
      const num = str.replace(/[\.\)]$/, '');
      let extra = '';
      if (weekItem && weekItem.descriptions && weekItem.descriptions.length > 0) {
        extra = weekItem.descriptions.join('; ');
      } else if (weekItem && weekItem.topics && weekItem.topics.length > 0) {
        extra = weekItem.topics.join(', ');
      } else if (weekItem && weekItem.unitName && !/^(?:ünite|unite|tema|theme)$/i.test(weekItem.unitName.trim())) {
        extra = weekItem.unitName;
      }
      return extra ? `${num}. ${extra}` : `Kazanım ${num}`;
    }
    return str;
  }

  function formatUnitDisplay(unitNo, unitName) {
    const cleanName = (unitName || '').trim();
    const isGeneric = !cleanName || /^(?:ünite|unite|tema|theme)$/i.test(cleanName);
    if (unitNo && !isGeneric) {
      if (new RegExp(`^${unitNo}\\.?\\s*(?:ünite|unite|tema|theme)`, 'i').test(cleanName)) {
        return cleanName.toUpperCase();
      }
      return `${unitNo}. ÜNİTE: ${cleanName.toUpperCase()}`;
    } else if (unitNo) {
      return `${unitNo}. ÜNİTE`;
    } else if (!isGeneric) {
      return cleanName.toUpperCase();
    }
    return '';
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

      // Öğretmen modalda ders seçtiyse asla üzerine yazma
      const userAlreadySelected = (planCourseNameSelect && planCourseNameSelect.value && planCourseNameSelect.value !== 'custom') || (planCourseNameInput && planCourseNameInput.value.trim());
      if (!userAlreadySelected) {
        const detected = detectCourseAndClassFromContent(text, rows, '');
        applyDetectedCourseAndClass(detected.detectedCourse, detected.detectedGrade);
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
    
    // Öğretmenin seçtiği ders varsa KESİNLİKLE KORU! Dosya adıyla asla ezme!
    const userAlreadySelectedCourse = (planCourseNameSelect && planCourseNameSelect.value && planCourseNameSelect.value !== 'custom') || (planCourseNameInput && planCourseNameInput.value.trim() && !/^[a-f0-9]{6,}$/i.test(planCourseNameInput.value.trim()));

    if (!userAlreadySelectedCourse) {
      if (window.isLessonPlanMatch) {
        const state = stateManager.loadState();
        const lessons = state.definedLessons || [];
        const matched = lessons.find(l => l && window.isLessonPlanMatch(baseName, l.name));
        if (matched && planCourseNameSelect) {
          planCourseNameSelect.value = matched.name;
          if (planCourseNameInput) planCourseNameInput.value = matched.name;
          if (planCourseNameInputContainer) planCourseNameInputContainer.style.display = 'none';
        }
      }
      // Dosya adı bilinen bir dersle eşleşmediyse planCourseNameInput'a dosya adını (örn: a4574fe744) ASLA atama!
    }

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

              const sheetsMap = {};
              const sheetNames = [];
              const parsedTables = [];

              tables.forEach((table, index) => {
                const rows = [];
                for (let i = 0; i < table.rows.length; i++) {
                  const row = table.rows[i];
                  const rowCells = [];
                  for (let j = 0; j < row.cells.length; j++) {
                    rowCells.push(row.cells[j].innerText || row.cells[j].textContent || '');
                  }
                  rows.push(rowCells);
                }

                const rowCount = rows.length;
                let maxCols = 0;
                for (let r = 0; r < Math.min(10, rows.length); r++) {
                  if (rows[r] && rows[r].length > maxCols) maxCols = rows[r].length;
                }

                const fullText = rows.map(r => r.join(' ')).join(' ').toLowerCase();
                const isAuxAtaturk = /atatürkçülük|atatürk/i.test(fullText);
                const isAuxBelirli = /belirli gün|özel gün/i.test(fullText);
                const isAuxImza = /okul müdürü|ders öğretmeni|zümre başkanı|onay|imza/i.test(fullText) && rowCount <= 5;
                const isAuxiliary = (isAuxAtaturk || isAuxBelirli || isAuxImza) && rowCount < 28 && maxCols <= 4;

                const headerText = rows.slice(0, 3).map(r => r.join(' ')).join(' ').toLowerCase();
                const hasPlanKeywords = /hafta|ay|saat|kazanım|öğrenme|tema|ünite/i.test(headerText);

                let planScore = 0;
                if (!isAuxiliary) {
                  if (rowCount >= 28 && rowCount <= 45) planScore += 120;
                  else if (rowCount >= 12 && rowCount < 28) planScore += 50;
                  if (maxCols >= 5) planScore += 40;
                  else if (maxCols >= 3) planScore += 15;
                  if (hasPlanKeywords) planScore += 50;
                } else {
                  planScore = -100;
                }

                let descriptiveTag = '';
                if (isAuxAtaturk) descriptiveTag = ' - Atatürkçülük';
                else if (isAuxBelirli) descriptiveTag = ' - Belirli Gün ve Haftalar';
                else if (isAuxImza) descriptiveTag = ' - İmza / Onay';
                else if (rowCount >= 28 && hasPlanKeywords) descriptiveTag = ' - Yıllık Ders Planı';
                else if (hasPlanKeywords) descriptiveTag = ' - Ders Planı';

                const name = `Tablo ${index + 1} (${rowCount} Satır, ${maxCols} Sütun${descriptiveTag})`;
                sheetsMap[name] = rows;
                sheetNames.push(name);

                parsedTables.push({
                  index,
                  name,
                  rows,
                  rowCount,
                  maxCols,
                  isAuxiliary,
                  hasPlanKeywords,
                  planScore
                });
              });

              // Sadece benzer sütun yapısına sahip ders planı tabloları için birleştirme seçeneği sun (ek tabloları asla ana plana katma)
              const planCandidates = parsedTables.filter(t => !t.isAuxiliary && t.hasPlanKeywords && t.maxCols >= 4);
              const hasSingleFullPlan = parsedTables.some(t => !t.isAuxiliary && t.rowCount >= 28 && t.hasPlanKeywords);

              let bestTable = parsedTables.reduce((prev, curr) => (curr.planScore > prev.planScore ? curr : prev), parsedTables[0]);

              if (!hasSingleFullPlan && planCandidates.length > 1) {
                const firstColCount = planCandidates[0].maxCols;
                const canMerge = planCandidates.every(t => Math.abs(t.maxCols - firstColCount) <= 1);
                if (canMerge) {
                  const mergedPlanRows = [];
                  planCandidates.forEach((t, i) => {
                    if (i === 0) {
                      mergedPlanRows.push(...t.rows);
                    } else {
                      const isHeaderRepeat = t.rows.length > 1 && t.rows[0].some(cell => /hafta|ay|saat|kazanım|unite|tema|konu/i.test(cell));
                      mergedPlanRows.push(...(isHeaderRepeat ? t.rows.slice(1) : t.rows));
                    }
                  });
                  const mergedName = `Dönem Tablolarını Birleştir (${mergedPlanRows.length} Satır - Birleşik Plan)`;
                  sheetNames.unshift(mergedName);
                  sheetsMap[mergedName] = mergedPlanRows;
                  bestTable = { name: mergedName, rows: mergedPlanRows };
                }
              }

              if (planSelectSheet) {
                planSelectSheet.innerHTML = '';
                sheetNames.forEach(name => {
                  const opt = document.createElement('option');
                  opt.value = name;
                  opt.textContent = name;
                  planSelectSheet.appendChild(opt);
                });
                planSelectSheet.value = bestTable.name;
              }

              currentWorkbook = {
                SheetNames: sheetNames,
                SheetsData: sheetsMap,
                isDocx: true
              };

              // Word içeriğinden ve tablolarından ders adı ve sınıfı otomatik tespit et (öğretmen önceden ders seçmediyse)
              const userChosen = (planCourseNameSelect && planCourseNameSelect.value && planCourseNameSelect.value !== 'custom') || (planCourseNameInput && planCourseNameInput.value.trim() && !/^[a-f0-9]{6,}$/i.test(planCourseNameInput.value.trim()));
              if (!userChosen) {
                const docText = tempDiv.textContent || '';
                const detected = detectCourseAndClassFromContent(docText, bestTable.rows, file.name);
                applyDetectedCourseAndClass(detected.detectedCourse, detected.detectedGrade);
              }

              loadSheetData(planSelectSheet ? planSelectSheet.value : bestTable.name);

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

          const userChosen = (planCourseNameSelect && planCourseNameSelect.value && planCourseNameSelect.value !== 'custom') || (planCourseNameInput && planCourseNameInput.value.trim() && !/^[a-f0-9]{6,}$/i.test(planCourseNameInput.value.trim()));
          if (!userChosen) {
            let excelText = currentWorkbook.SheetNames.join(' ');
            const firstWs = currentWorkbook.Sheets[currentWorkbook.SheetNames[0]];
            const firstRows = XLSX.utils.sheet_to_json(firstWs, { header: 1 });
            const detected = detectCourseAndClassFromContent(excelText, firstRows, file.name);
            applyDetectedCourseAndClass(detected.detectedCourse, detected.detectedGrade);
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
      // Eğer birleştirilmiş hücreler (merge cells) varsa, değerleri tüm kapsama yay
      if (worksheet && worksheet['!merges'] && Array.isArray(worksheet['!merges'])) {
        worksheet['!merges'].forEach(range => {
          const startCellAddr = XLSX.utils.encode_cell(range.s);
          const startCellVal = worksheet[startCellAddr];
          if (startCellVal) {
            for (let R = range.s.r; R <= range.e.r; ++R) {
              for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
                if (!worksheet[cellAddr]) {
                  worksheet[cellAddr] = { ...startCellVal };
                }
              }
            }
          }
        });
      }
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

  function getColumnPreviewLabel(colIndex) {
    if (!currentSheetData || currentSheetData.length === 0) return '';
    let headerCandidate = '';
    let sampleCandidate = '';

    for (let r = 0; r < Math.min(4, currentSheetData.length); r++) {
      const row = currentSheetData[r];
      if (!row) continue;
      const rawCell = String(row[colIndex] !== undefined ? row[colIndex] : '').trim().replace(/\s+/g, ' ');
      if (!rawCell) continue;

      // Sütun başlığı anahtar sözcüğü içeriyorsa öncelikli olarak al
      if (/^(?:ay|hafta|tarih|saat|ders saati|ünite|unite|tema|öğrenme alanı|ogrenme alani|kazanım.*|hedef.*|konu.*|içerik|icerik|açıklama.*|aciklama.*|etkinlik.*|yöntem.*|araç.*|ölçme.*|değerlendirme.*|belirli gün.*)$/i.test(rawCell)) {
        headerCandidate = rawCell;
        break;
      }
      if (!headerCandidate && rawCell.length <= 40 && !/^\d{1,2}\.?\s*hafta/i.test(rawCell)) {
        headerCandidate = rawCell;
      }
      if (!sampleCandidate && rawCell) {
        sampleCandidate = rawCell;
      }
    }

    const candidate = headerCandidate || sampleCandidate;
    if (!candidate) return '';
    return candidate.length > 25 ? candidate.substring(0, 23) + '…' : candidate;
  }

  function setupColumnDropdowns(colCount) {
    const colOptions = [];
    for (let i = 0; i < colCount; i++) {
      const colLetter = getColumnLetter(i);
      const preview = getColumnPreviewLabel(i);
      colOptions.push({ index: i, letter: colLetter, preview: preview });
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
          opt.textContent = col.preview ? `${col.letter} Sütunu (${col.preview})` : `${col.letter} Sütunu`;
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

  function parseColIndex(val, maxCols) {
    if (val === null || val === undefined || val === '') return -1;
    
    // Direct number
    if (typeof val === 'number' && !isNaN(val)) {
      if (val >= 0 && val < maxCols) return val;
      if (val >= 1 && val <= maxCols) return val - 1;
      return -1;
    }

    const s = String(val).trim().toUpperCase();
    
    // Single letter "A", "B", "C"...
    if (/^[A-Z]$/.test(s)) {
      const idx = s.charCodeAt(0) - 65;
      if (idx >= 0 && idx < maxCols) return idx;
    }

    // "A SÜTUNU", "SÜTUN A", "COL A", "COLUMN B"
    const letterMatch = s.match(/(?:SÜTUN|COL|COLUMN)?\s*([A-Z])\s*(?:SÜTUNU|SUTUNU|COL)?/i);
    if (letterMatch && letterMatch[1]) {
      const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < maxCols) return idx;
    }

    // Number inside string "0", "1", "2"...
    const numMatch = s.match(/\b\d+\b/);
    if (numMatch) {
      const n = parseInt(numMatch[0], 10);
      if (n >= 0 && n < maxCols) return n;
      if (n >= 1 && n <= maxCols) return n - 1;
    }

    return -1;
  }

  function detectHeuristicColumns(colCount) {
    const detectedCols = {
      month: -1, week: -1, dateRange: -1, hours: -1, unit: -1, 
      outcomes: -1, topics: -1, descriptions: -1, 
      special: -1, assessment: -1, content: -1,
      startRow: 2
    };

    if (!currentSheetData || currentSheetData.length === 0) return detectedCols;

    function isColMostlyNumeric(colIdx, startRow = 1) {
      let numCount = 0;
      let totalCount = 0;
      for (let r = startRow; r < Math.min(25, currentSheetData.length); r++) {
        const val = String(currentSheetData[r] && currentSheetData[r][colIdx] !== undefined ? currentSheetData[r][colIdx] : '').trim();
        if (!val) continue;
        totalCount++;
        if (/^\d+[\.\)]?$/.test(val)) {
          numCount++;
        }
      }
      return totalCount >= 2 && (numCount / totalCount) >= 0.6;
    }

    const maxSearchRows = Math.min(15, currentSheetData.length);
    let bestHeaderScore = -1;
    let headerRowIndex = 0;

    const keywords = {
      month: ['ay', 'month', 'dönem'],
      week: ['hafta', 'week'],
      dateRange: ['tarih', 'süre', 'gün', 'date', 'aralık', 'tarih aralığı', 'tarih araligi'],
      hours: ['saat', 'ders saati', 'süre', 'hours', 'hour'],
      unit: ['ünite', 'unite', 'tema', 'öğrenme alanı', 'ogrenme alani', 'alt öğrenme', 'unit', 'theme'],
      outcomes: ['kazanım', 'kazanim', 'hedef', 'outcomes', 'outcome', 'learning outcomes', 'öğrenme çıktıları'],
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
        const val = String(row[c] || '').toLocaleLowerCase('tr-TR').trim();
        if (!val) continue;

        for (const key in keywords) {
          keywords[key].forEach(keyword => {
            let matched = false;
            if (keyword === 'ay') {
              matched = /\bay\b/i.test(val) || val === 'ay' || val === 'aylar';
            } else {
              matched = val.includes(keyword);
            }
            if (matched) {
              // Kazanım / Konu / Açıklama / İçerik sayısal sütunlara (örn: "Kazanım No") eşlenmemelidir
              if (key === 'outcomes' || key === 'topics' || key === 'descriptions' || key === 'content') {
                const isNumericHeader = /\b(?:no|numara|sıra|kodu)\b/i.test(val);
                const isNumericData = isColMostlyNumeric(c, r + 1);
                if (isNumericHeader || isNumericData) {
                  return;
                }
              }
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

    if (detectedCols.week === -1) detectedCols.week = colCount > 1 ? 1 : 0;
    if (detectedCols.dateRange === -1 && colCount > 2) detectedCols.dateRange = 2;

    // Kazanım bulunamadıysa en uzun metin içeren sütunu bul (sayısal ve hafta/saat olmayan)
    if (detectedCols.outcomes === -1) {
      let bestOutcomesCol = -1;
      let maxAvgLen = 0;
      for (let c = 0; c < colCount; c++) {
        if (c === detectedCols.week || c === detectedCols.dateRange || c === detectedCols.hours || c === detectedCols.month) continue;
        if (isColMostlyNumeric(c, headerRowIndex + 1)) continue;
        let totalLen = 0;
        let validRows = 0;
        for (let r = headerRowIndex + 1; r < Math.min(headerRowIndex + 20, currentSheetData.length); r++) {
          const cellStr = String(currentSheetData[r] && currentSheetData[r][c] !== undefined ? currentSheetData[r][c] : '').trim();
          if (cellStr) {
            totalLen += cellStr.length;
            validRows++;
          }
        }
        const avg = validRows > 0 ? (totalLen / validRows) : 0;
        if (avg > maxAvgLen && avg > 12) {
          maxAvgLen = avg;
          bestOutcomesCol = c;
        }
      }
      if (bestOutcomesCol !== -1) {
        detectedCols.outcomes = bestOutcomesCol;
      }
    }

    if (detectedCols.content === -1) {
      if (detectedCols.outcomes !== -1) {
        detectedCols.content = detectedCols.outcomes;
      } else if (detectedCols.dateRange === 2 && colCount > 3) {
        detectedCols.content = 3;
      } else {
        detectedCols.content = colCount > 2 ? 2 : 0;
      }
    }
    detectedCols.startRow = headerRowIndex + 2;
    return detectedCols;
  }

  function autoDetectColumns(colCount) {
    if (!currentSheetData || currentSheetData.length === 0) return;

    const detectedCols = detectHeuristicColumns(colCount);

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
    
    if (planRowStart) planRowStart.value = detectedCols.startRow;

    updateImportPreview();
  }

  async function handleAiAutoMapPlan() {
    if (!currentSheetData || currentSheetData.length === 0) {
      if (toastCallbackFn) toastCallbackFn('Önce bir dosya veya tablo verisi yüklemelisiniz.', 'warning');
      return;
    }

    const apiKey = window.getGeminiApiKey ? window.getGeminiApiKey() : (localStorage.getItem('sinif_asistani_gemini_api_key') || '').trim();
    if (!apiKey) {
      if (toastCallbackFn) toastCallbackFn('Yapay zeka ile sütun analizi için lütfen önce Gemini API anahtarınızı tanımlayın.', 'warning');
      if (window.openGeminiKeyModal) window.openGeminiKeyModal();
      return;
    }

    if (!window.callGeminiAPI) {
      if (toastCallbackFn) toastCallbackFn('Yapay zeka servisi yüklenemedi. Lütfen sayfayı yenileyin.', 'danger');
      return;
    }

    // Sütun sayısını hesapla
    let maxCols = 0;
    const scanLimit = Math.min(25, currentSheetData.length);
    for (let r = 0; r < scanLimit; r++) {
      if (currentSheetData[r] && currentSheetData[r].length > maxCols) {
        maxCols = currentSheetData[r].length;
      }
    }
    if (maxCols === 0) maxCols = 1;

    // Her sütun için harf, indeks ve ilk 8 örnek hücre değerini derle
    const colProfiles = [];
    for (let c = 0; c < maxCols; c++) {
      const colLetter = getColumnLetter(c);
      const samples = [];
      for (let r = 0; r < Math.min(15, currentSheetData.length); r++) {
        const cellVal = currentSheetData[r] && currentSheetData[r][c] !== undefined ? String(currentSheetData[r][c]).trim() : '';
        if (cellVal) {
          const clean = cellVal.replace(/\s+/g, ' ');
          samples.push(clean.length > 70 ? clean.slice(0, 67) + '...' : clean);
        }
      }
      colProfiles.push({
        index: c,
        letter: colLetter,
        samples: samples.slice(0, 8)
      });
    }

    // Kural tabanlı yedekleri hesapla
    const fallbackCols = detectHeuristicColumns(maxCols);

    const originalBtnHtml = btnAiAutoMapPlan.innerHTML;
    btnAiAutoMapPlan.disabled = true;
    btnAiAutoMapPlan.innerHTML = `<span class="spinner-sm" style="display:inline-block; width:13px; height:13px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:4px; vertical-align:middle;"></span> Çözümleniyor...`;

    if (aiPlanMappingStatus) {
      aiPlanMappingStatus.style.display = 'block';
      aiPlanMappingStatus.style.background = 'rgba(99, 102, 241, 0.1)';
      aiPlanMappingStatus.style.border = '1px solid rgba(99, 102, 241, 0.3)';
      aiPlanMappingStatus.style.color = 'var(--text-primary)';
      aiPlanMappingStatus.innerHTML = `<strong>✨ Yapay Zeka Tabloyu İnceliyor:</strong> Sütun başlıkları ve ilk veri satırları analiz ediliyor, lütfen bekleyin...`;
    }

    try {
      const columnDescriptions = colProfiles.map(p => 
        `- Sütun ${p.letter} (İndeks ${p.index}): [${p.samples.map(s => `"${s}"`).join(', ')}]`
      ).join('\n');

      const prompt = `Sen eğitim planlama yazılımlarında uzman bir veri analistisin. Aşağıda bir öğretmenin yüklediği yıllık ders planı tablosundaki tüm sütunlar (Sütun Harfi, Sütun İndeksi ve ilk satırlardaki örnek hücre içerikleri) listelenmiştir:

SÜTUN LİSTESİ VE ÖRNEK DEĞERLERİ:
${columnDescriptions}

GÖREV:
Yukarıdaki sütun içeriklerini ve başlıklarını analiz ederek aşağıdaki alanların hangi sütunda yer aldığını tespit et:
1. "week": Hafta sütunu (1. Hafta, 2. Hafta, veya "Hafta / Tarih", "Süre" gibi haftanın belirtildiği sütun. BU ALAN EN KRİTİK ALANDIR, MUTLAKA EN UYGUN SÜTUNU SEÇ!)
2. "month": Ay sütunu (Eylül, Ekim, Kasım vb. aylar. Tabloda ayrı ay sütunu yoksa null)
3. "dateRange": Tarih aralığı sütunu (Örn: 09-13 Eylül, 15-19 Eylül. Ayrı bir tarih sütunu yoksa hafta sütunuyla aynı indeksi verebilirsin)
4. "hours": Ders saati sütunu (2, 4 vb. haftalık ders saatleri)
5. "unit": Ünite No / Ünite Adı / Tema / Öğrenme Alanı sütunu
6. "outcomes": Kazanımlar / Öğrenme Hedefleri / Öğrenme Çıktıları sütunu (DİKKAT: Tabloda sadece sıra veya kazanım numarası içeren örn: "10", "1", "2" gibi sayısal bir sütun varsa KESİNLİKLE onu değil, kazanımın Türkçe açıklamasını/cümlesini içeren metin sütununu seç!)
7. "topics": Konu / Konular / Alt Konular sütunu
8. "descriptions": Açıklamalar / Yöntem-Teknik / Araç-Gereç / Ders İçi Etkinlik sütunu
9. "special": Belirli Gün ve Haftalar sütunu
10. "assessment": Ölçme ve Değerlendirme sütunu
11. "content": Ana Ders İçeriği / Kazanım ve Konuların birlikte yer aldığı sütun (Eğer kazanım ve konular tek sütundaysa bu sütunu seç)
12. "startRow": Başlık satırlarının bittiği ve ilk gerçek ders verisinin başladığı satır numarası (1-tabanlı sayı, örn: 2, 3 veya 4)

ÖNEMLİ KURALLAR:
- Değerleri sütun indeksi (0, 1, 2, ...) veya sütun harfi ("A", "B", "C", ...) olarak belirt.
- "week" alanını MUTLAKA doldur (Hafta, Tarih veya Süre içeren sütun).
- "outcomes" veya "content" alanını MUTLAKA doldur (Kazanım, Konu veya Ders içeriği içeren sütun).
- Tabloda gerçekten bulunmayan yan alanlar için null ver.

Cevabını YALNIZCA şu JSON formatında ver:
{
  "week": 1,
  "month": 0,
  "dateRange": 1,
  "hours": 4,
  "unit": 0,
  "outcomes": 2,
  "topics": 3,
  "descriptions": null,
  "special": null,
  "assessment": null,
  "content": 2,
  "startRow": 2
}`;

      const rawResponse = await window.callGeminiAPI(prompt, { json: true, temperature: 0.1 });
      let cleanJson = rawResponse.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      }

      const objMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (objMatch) {
        cleanJson = objMatch[0];
      }

      let mapping = {};
      try {
        mapping = JSON.parse(cleanJson);
      } catch (parseErr) {
        console.warn('AI yanıtı JSON olarak tam ayrıştırılamadı, yedek kurallar devreye giriyor:', cleanJson);
      }

      // Sütun eşleme yardımcı fonksiyonu (AI bulduysa kullan, bulamadıysa yedekten al, asla gereksiz sıfırlama yapma)
      const applyCol = (selectElem, aiVal, fallbackIdx) => {
        if (!selectElem) return;
        const parsed = parseColIndex(aiVal, maxCols);
        if (parsed >= 0) {
          selectElem.value = String(parsed);
        } else if (fallbackIdx !== undefined && fallbackIdx >= 0) {
          selectElem.value = String(fallbackIdx);
        }
      };

      applyCol(planColWeek, mapping.week, fallbackCols.week);
      applyCol(planColMonth, mapping.month, fallbackCols.month);
      applyCol(planColDateRange, mapping.dateRange, fallbackCols.dateRange);
      applyCol(planColHours, mapping.hours, fallbackCols.hours);
      applyCol(planColUnit, mapping.unit, fallbackCols.unit);
      applyCol(planColOutcomes, mapping.outcomes, fallbackCols.outcomes);
      applyCol(planColTopics, mapping.topics, fallbackCols.topics);
      applyCol(planColDescriptions, mapping.descriptions, fallbackCols.descriptions);
      applyCol(planColSpecial, mapping.special, fallbackCols.special);
      applyCol(planColAssessment, mapping.assessment, fallbackCols.assessment);
      applyCol(planColContent, mapping.content, fallbackCols.content);

      // Güvenlik Ağı 1: Hafta sütunu mutlaka geçerli bir sütun olmalı!
      if (!planColWeek || planColWeek.value === '') {
        let bestWeekCol = -1;
        for (let c = 0; c < maxCols; c++) {
          const p = colProfiles[c];
          const joined = p.samples.join(' ').toLocaleLowerCase('tr');
          if (/hafta|\bweek\b|tarih|süre|\d{1,2}[\.\/\-]\d{1,2}/.test(joined)) {
            bestWeekCol = c;
            break;
          }
        }
        if (bestWeekCol === -1) bestWeekCol = maxCols > 1 ? 1 : 0;
        if (planColWeek) planColWeek.value = String(bestWeekCol);
      }

      // Güvenlik Ağı 2: Tarih Aralığı boşsa ve hafta sütunu tarih içeriyorsa eşle
      if (planColDateRange && planColDateRange.value === '' && planColWeek && planColWeek.value !== '') {
        planColDateRange.value = planColWeek.value;
      }

      // Güvenlik Ağı 2.5: Kazanım sütunu sadece sayı mı içeriyor? Eğer öyleyse gerçek metin sütununa yönlendir!
      if (planColOutcomes && planColOutcomes.value !== '') {
        const outIdx = parseInt(planColOutcomes.value);
        if (!isNaN(outIdx) && colProfiles[outIdx]) {
          const prof = colProfiles[outIdx];
          const isNumeric = prof.samples.length > 0 && prof.samples.filter(s => /^\d+[\.\)]?$/.test(s.trim())).length >= prof.samples.length * 0.5;
          if (isNumeric) {
            let bestCol = -1;
            let maxAvg = 0;
            for (let c = 0; c < maxCols; c++) {
              if (c === outIdx) continue;
              if (String(c) === planColWeek.value || (planColHours && String(c) === planColHours.value)) continue;
              const cp = colProfiles[c];
              if (!cp || cp.samples.length === 0) continue;
              const numCount = cp.samples.filter(s => /^\d+[\.\)]?$/.test(s.trim())).length;
              if (numCount >= cp.samples.length * 0.5) continue;
              const avg = cp.samples.reduce((a, s) => a + s.length, 0) / cp.samples.length;
              if (avg > maxAvg) {
                maxAvg = avg;
                bestCol = c;
              }
            }
            if (bestCol >= 0) {
              planColOutcomes.value = String(bestCol);
            }
          }
        }
      }

      // Güvenlik Ağı 3: Kazanım / Konu / İçerik alanlarından en az biri seçili olmalı!
      const hasOutcomes = planColOutcomes && planColOutcomes.value !== '';
      const hasTopics = planColTopics && planColTopics.value !== '';
      const hasContent = planColContent && planColContent.value !== '';

      if (!hasOutcomes && !hasTopics && !hasContent) {
        let bestContentCol = -1;
        let maxTextLen = 0;
        for (let c = 0; c < maxCols; c++) {
          const strC = String(c);
          if (strC === planColWeek.value || (planColHours && strC === planColHours.value) || (planColUnit && strC === planColUnit.value)) {
            continue;
          }
          const p = colProfiles[c];
          const joined = p.samples.join(' ');
          const lower = joined.toLocaleLowerCase('tr');
          if (/kazanım|kazanim|öğrenme|hedef|konu|içerik/.test(lower)) {
            bestContentCol = c;
            break;
          }
          if (joined.length > maxTextLen) {
            maxTextLen = joined.length;
            bestContentCol = c;
          }
        }
        if (bestContentCol >= 0) {
          if (planColOutcomes) planColOutcomes.value = String(bestContentCol);
          if (planColContent) planColContent.value = String(bestContentCol);
        }
      }

      // Öğretmen ders seçmediyse ve içerikten ders adı tespit edilebiliyorsa ata
      const teacherHasSelected = (planCourseNameSelect && planCourseNameSelect.value && planCourseNameSelect.value !== 'custom') || (planCourseNameInput && planCourseNameInput.value.trim() && !/^[a-f0-9]{6,}$/i.test(planCourseNameInput.value.trim()));
      if (!teacherHasSelected) {
        const detected = detectCourseAndClassFromContent('', currentSheetData, '');
        if (detected.detectedCourse) {
          applyDetectedCourseAndClass(detected.detectedCourse, detected.detectedGrade);
        }
      }

      // Başlangıç Satırı
      if (planRowStart) {
        let sRow = parseInt(mapping.startRow);
        if (!isNaN(sRow) && sRow >= 1 && sRow <= currentSheetData.length) {
          planRowStart.value = sRow;
        } else if (fallbackCols.startRow >= 1) {
          planRowStart.value = fallbackCols.startRow;
        }
      }

      updateImportPreview();

      // Kullanıcıya eşlenen temel sütunları gösteren bilgilendirici bildirim
      const mappedDetails = [];
      if (planColWeek && planColWeek.value !== '') mappedDetails.push(`Hafta: ${getColumnLetter(parseInt(planColWeek.value))}`);
      if (planColHours && planColHours.value !== '') mappedDetails.push(`Ders Saati: ${getColumnLetter(parseInt(planColHours.value))}`);
      if (planColUnit && planColUnit.value !== '') mappedDetails.push(`Ünite: ${getColumnLetter(parseInt(planColUnit.value))}`);
      if (planColOutcomes && planColOutcomes.value !== '') mappedDetails.push(`Kazanım: ${getColumnLetter(parseInt(planColOutcomes.value))}`);
      else if (planColContent && planColContent.value !== '') mappedDetails.push(`İçerik: ${getColumnLetter(parseInt(planColContent.value))}`);

      if (aiPlanMappingStatus) {
        aiPlanMappingStatus.style.background = 'rgba(16, 185, 129, 0.12)';
        aiPlanMappingStatus.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        aiPlanMappingStatus.style.color = 'var(--text-primary)';
        aiPlanMappingStatus.innerHTML = `<strong>✅ Başarılı:</strong> Yapay zeka tablonuzu çözümledi ve eşleştirdi!<br><span style="font-size: 0.78rem; opacity: 0.9;">Tespit Edilen Sütunlar: ${mappedDetails.join(' | ')} (Veri Başlangıç Satırı: ${planRowStart.value})</span>`;
      }

      if (toastCallbackFn) toastCallbackFn('✨ Yapay zeka sütunları başarıyla eşleştirdi!', 'success');
    } catch (err) {
      console.error('Yapay zeka eşleme hatası:', err);
      // Hata durumunda da akıllı kural tabanlı eşlemeyi devreye sok
      if (fallbackCols) {
        if (planColWeek && fallbackCols.week >= 0) planColWeek.value = String(fallbackCols.week);
        if (planColHours && fallbackCols.hours >= 0) planColHours.value = String(fallbackCols.hours);
        if (planColUnit && fallbackCols.unit >= 0) planColUnit.value = String(fallbackCols.unit);
        if (planColOutcomes && fallbackCols.outcomes >= 0) planColOutcomes.value = String(fallbackCols.outcomes);
        if (planColContent && fallbackCols.content >= 0) planColContent.value = String(fallbackCols.content);
        if (planRowStart && fallbackCols.startRow >= 1) planRowStart.value = fallbackCols.startRow;
        updateImportPreview();
      }
      if (aiPlanMappingStatus) {
        aiPlanMappingStatus.style.background = 'rgba(239, 68, 68, 0.12)';
        aiPlanMappingStatus.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        aiPlanMappingStatus.style.color = 'var(--text-primary)';
        aiPlanMappingStatus.innerHTML = `<strong>⚠️ Eşleme Uyarısı:</strong> ${err.message || 'Yapay zeka ile eşleme yapılırken bir sorun oluştu, temel eşleme uygulandı.'}`;
      }
      if (toastCallbackFn) toastCallbackFn('Yapay zeka eşlemesi tamamlandı, lütfen kontrol ediniz.', 'info');
    } finally {
      btnAiAutoMapPlan.disabled = false;
      btnAiAutoMapPlan.innerHTML = originalBtnHtml;
      if (window.safeCreateIcons) window.safeCreateIcons();
    }
  }

  async function handleGenerateAiAnnualPlan() {
    const apiKey = window.getGeminiApiKey ? window.getGeminiApiKey() : (localStorage.getItem('sinif_asistani_gemini_api_key') || '').trim();
    if (!apiKey) {
      if (toastCallbackFn) toastCallbackFn('Yapay zeka ile plan üretmek için lütfen önce Gemini API anahtarınızı tanımlayın.', 'warning');
      if (window.openGeminiKeyModal) window.openGeminiKeyModal();
      return;
    }

    if (!window.callGeminiAPI) {
      if (toastCallbackFn) toastCallbackFn('Yapay zeka servisi yüklenemedi. Lütfen sayfayı yenileyin.', 'danger');
      return;
    }

    const courseName = ((planCourseNameInput && planCourseNameInput.value) ? planCourseNameInput.value : (planCourseNameSelect && planCourseNameSelect.value !== 'custom' ? planCourseNameSelect.value : '')).trim();
    const className = (planClassName ? planClassName.value : '3/A').trim();
    const educationYear = (planEducationYear ? planEducationYear.value : '2025-2026').trim();
    const hoursPerWeek = parseInt(aiPlanHours ? aiPlanHours.value : '4') || 4;
    const curriculumStyle = aiPlanCurriculumStyle ? aiPlanCurriculumStyle.value : 'maarif';
    const customNotes = aiPlanNotes ? aiPlanNotes.value.trim() : '';

    if (!courseName) {
      if (toastCallbackFn) toastCallbackFn('Lütfen yıllık plan için ders adını belirtin.', 'danger');
      if (planCourseNameSelect) planCourseNameSelect.focus();
      return;
    }

    const originalBtnHtml = btnGenerateAiAnnualPlan.innerHTML;
    btnGenerateAiAnnualPlan.disabled = true;
    btnGenerateAiAnnualPlan.innerHTML = `<span class="spinner-sm" style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:4px; vertical-align:middle;"></span> Plan Hazırlanıyor...`;

    if (aiPlanGenStatus) {
      aiPlanGenStatus.style.display = 'block';
    }
    if (aiPlanGenStatusText) {
      aiPlanGenStatusText.textContent = `Yapay zeka ${className} ${courseName} dersi için MEB müfredatını ve 36 haftalık yıllık planı hazırlıyor, lütfen bekleyin...`;
    }

    try {
      const prompt = `Sen Türkiye Cumhuriyeti Millî Eğitim Bakanlığı (MEB) müfredat uzmanı ve deneyimli bir zümre başkanısın.
Aşağıda bilgileri verilen ders ve sınıf için ${educationYear} eğitim-öğretim yılına ait 36 haftalık eksiksiz, MEB müfredatına tam uyumlu bir YILLIK DERS PLANI hazırla.

DERS BİLGİLERİ:
- Ders Adı: ${courseName}
- Sınıf Düzeyi: ${className}
- Haftalık Ders Saati: ${hoursPerWeek}
- Müfredat Modeli: ${curriculumStyle === 'maarif' ? 'Türkiye Yüzyılı Maarif Modeli (Güncel MEB Programı)' : 'Standart MEB Öğretim Programı'}
${customNotes ? `- Öğretmenin Özel İstekleri ve Notları: ${customNotes}` : ''}

Yanıtını YALNIZCA geçerli ve hatasız bir JSON objesi formatında ver. Kesinlikle başka hiçbir metin veya markdown kodu yazma:
{
  "title": "${className} - ${courseName}",
  "educationYear": "${educationYear}",
  "className": "${className}",
  "courseName": "${courseName}",
  "weeklySchedule": [
    {
      "weekNum": 1,
      "weekLabel": "1. Hafta",
      "month": "EYLÜL",
      "dateRange": "08 Eylül – 12 Eylül",
      "classHours": ${hoursPerWeek},
      "unitNo": 1,
      "unitName": "1. Ünite Adı",
      "learningOutcomes": ["Kazanım kodu ve tam açıklaması"],
      "topics": ["Konu başlığı"],
      "descriptions": ["Yöntem-teknik, araç-gereç ve ders içi etkinlikler"],
      "specialDays": "İlköğretim Haftası",
      "assessment": ["Ders içi gözlem, soru-cevap"],
      "isHoliday": false
    }
  ]
}

ÖNEMLİ KURALLAR:
1. 1. haftadan 36. haftaya kadar MEB takvimine uygun tüm haftaları oluştur.
2. 1. Dönem Ara Tatil (Kasım), Yarıyıl / Sömestr Tatili (Ocak sonu - Şubat başı) ve 2. Dönem Ara Tatil (Nisan) haftalarını "isHoliday": true ve "classHours": 0 olarak işaretle.
3. İlgili haftalara denk gelen belirli gün ve haftaları (Cumhuriyet Bayramı, 10 Kasım Atatürk'ü Anma, 24 Kasım Öğretmenler Günü, 12 Mart İstiklal Marşı'nın Kabulü, 18 Mart Çanakkale Zaferi, 23 Nisan, 19 Mayıs vb.) "specialDays" alanına ekle.
4. Kazanımlar ilgili sınıf ve dersin gerçek MEB müfredatına uygun olmalıdır.`;

      const rawResponse = await window.callGeminiAPI(prompt, { json: true, temperature: 0.3 });
      let cleanJson = rawResponse.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      }

      const objMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (objMatch) {
        cleanJson = objMatch[0];
      }

      const planResult = JSON.parse(cleanJson);
      if (!planResult.weeklySchedule || !Array.isArray(planResult.weeklySchedule) || planResult.weeklySchedule.length === 0) {
        throw new Error('Yapay zeka haftalık ders planını oluşturamadı.');
      }

      const startYear = parseInt(educationYear.split('-')[0]) || new Date().getFullYear();
      const finalSchedule = planResult.weeklySchedule.map((w, idx) => {
        const wNum = w.weekNum || (idx + 1);
        const isHoliday = Boolean(w.isHoliday);

        const sept1 = new Date(startYear, 8, 1);
        const dayOfSept1 = sept1.getDay() || 7;
        const schoolStart = new Date(sept1.getTime());
        schoolStart.setDate(sept1.getDate() - dayOfSept1 + 1 + 7);
        const sDate = new Date(schoolStart.getTime());
        sDate.setDate(schoolStart.getDate() + (wNum - 1) * 7);
        const eDate = new Date(sDate.getTime());
        eDate.setDate(sDate.getDate() + 4);

        const sDateStr = sDate.toISOString().slice(0, 10);
        const eDateStr = eDate.toISOString().slice(0, 10);
        const isoWeek = window.getISOWeek ? window.getISOWeek(sDate) : '';

        return {
          id: 'w_' + wNum + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          month: (w.month || '').toUpperCase(),
          weekNumber: [wNum],
          weekLabel: w.weekLabel || `${wNum}. Hafta`,
          dateRange: w.dateRange || `${sDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} – ${eDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`,
          startDate: sDateStr,
          endDate: eDateStr,
          isoWeek: isoWeek,
          classHours: isHoliday ? 0 : (w.classHours || hoursPerWeek),
          unitNo: w.unitNo !== undefined ? w.unitNo : null,
          unitName: w.unitName || null,
          learningOutcomes: Array.isArray(w.learningOutcomes) ? w.learningOutcomes : (w.learningOutcomes ? [w.learningOutcomes] : []),
          topics: Array.isArray(w.topics) ? w.topics : (w.topics ? [w.topics] : []),
          descriptions: Array.isArray(w.descriptions) ? w.descriptions : (w.descriptions ? [w.descriptions] : []),
          specialDays: w.specialDays || null,
          assessment: Array.isArray(w.assessment) ? w.assessment : (w.assessment ? [w.assessment] : []),
          isHoliday: isHoliday,
          isCompleted: false
        };
      });

      const savedPlan = stateManager.addPlan({
        title: `${className} - ${courseName}`,
        educationYear: educationYear,
        className: className,
        courseName: courseName,
        weeklySchedule: finalSchedule
      });

      if (!savedPlan) return;

      modalImportPlan.classList.remove('active');
      if (toastCallbackFn) toastCallbackFn(`✨ "${courseName}" yıllık planı yapay zeka tarafından başarıyla oluşturuldu ve kaydedildi! (Toplam ${finalSchedule.length} hafta)`, 'success');

      activePlansMainTab = 'general';
      if (btnPlansTabGeneral) btnPlansTabGeneral.classList.add('active');
      if (btnPlansTabWeekly) btnPlansTabWeekly.classList.remove('active');
      if (plansTabContentGeneral) plansTabContentGeneral.style.display = 'block';
      if (plansTabContentWeekly) plansTabContentWeekly.style.display = 'none';

      expandedPlans[savedPlan.id] = true;
      finalSchedule.forEach(week => {
        if (week.month) {
          expandedMonths[savedPlan.id + '_' + week.month] = true;
        }
      });

      renderPlansList();
    } catch (err) {
      console.error('Yapay zeka plan üretme hatası:', err);
      if (toastCallbackFn) toastCallbackFn(err.message || 'Yapay zeka yıllık plan üretirken bir hata oluştu.', 'danger');
    } finally {
      btnGenerateAiAnnualPlan.disabled = false;
      btnGenerateAiAnnualPlan.innerHTML = originalBtnHtml;
      if (aiPlanGenStatus) aiPlanGenStatus.style.display = 'none';
      if (window.safeCreateIcons) window.safeCreateIcons();
    }
  }

  function cleanMonthName(monthVal, weekVal, startYear, weekCounter) {
    let rawText = String(monthVal || '').trim();
    if (!rawText && weekVal) {
      rawText = String(weekVal).trim();
    }

    const cleaned = rawText.toLocaleLowerCase('tr-TR');
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
    const cleaned = text.replace(/\s+/g, '').toLocaleLowerCase('tr-TR');
    
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
    const text = ((weekText || '') + ' ' + (contentText || '')).toLocaleLowerCase('tr-TR');
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

  function isDateString(str) {
    if (window.isDateString) return window.isDateString(str);
    if (!str) return false;
    const s = String(str).trim();
    if (!s) return false;
    if (/^\d{1,2}[\.\/\-]\d{1,2}(?:[\.\/\-]\d{2,4})?(?:\s*[-–—]\s*\d{1,2}[\.\/\-]\d{1,2}(?:[\.\/\-]\d{2,4})?)?$/.test(s)) return true;
    const withoutDate = s.toLocaleLowerCase('tr')
      .replace(/\b(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)\b/gi, '')
      .replace(/\b(pazartesi|salı|sali|çarşamba|carsamba|perşembe|persembe|cuma|cumartesi|pazar)\b/gi, '')
      .replace(/\b\d{1,4}\b/g, '')
      .replace(/[–—\-\.\/\,\:\s]/g, '').trim();
    return withoutDate.length === 0;
  }

  function autoClassifyContent(text) {
    const outcomes = [];
    const topics = [];
    const descriptions = [];
    
    if (!text) return { outcomes, topics, descriptions };
    
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    lines.forEach(line => {
      const cleanLine = line.replace(/^[•\-*○▪]\s*/, '').trim();
      if (!cleanLine || isDateString(cleanLine)) {
        return;
      }
      const outcomeRegex = /^[A-Za-zÇĞİÖŞÜçğıöşü]{1,5}\.?\s*\d+/;
      const isOutcomeVerb = /(?:tanır|açıklar|kavrar|fark eder|uygular|ilişkilendirir|özen gösterir|çözümler|belirtir|karşılaştırır|ayırt eder|gösterir|yapar|geliştirir|öğrenir|kullanır|tanıtır)[\.\s]*$/i;
      const startsWithNumberOutcome = /^\d+[\.\)]\s*[A-ZÇĞİÖŞÜ]/;

      if (outcomeRegex.test(cleanLine) || isOutcomeVerb.test(cleanLine) || startsWithNumberOutcome.test(cleanLine)) {
        outcomes.push(cleanLine);
      } else if (cleanLine.length < 50) {
        topics.push(cleanLine);
      } else {
        descriptions.push(cleanLine);
      }
    });

    if (outcomes.length === 0) {
      if (descriptions.length > 0) {
        outcomes.push(descriptions[0]);
      } else if (topics.length > 0) {
        outcomes.push(topics[0]);
      }
    }
    
    return { outcomes, topics, descriptions };
  }

  function parseTurkishDateRange(text, startYear) {
    let startDate = null;
    let endDate = null;
    let isDateParsed = false;

    if (!text) return { startDate, endDate, isDateParsed };

    const cleaned = text.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
    
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
      if (key === 'ara' && (cleaned.includes('ara tatil') || cleaned.includes('tatil'))) {
        continue;
      }
      let startIdx = 0;
      while (true) {
        const idx = cleaned.indexOf(key, startIdx);
        if (idx === -1) break;
        
        const charBefore = idx > 0 ? cleaned[idx - 1] : '';
        const charAfter = idx + key.length < cleaned.length ? cleaned[idx + key.length] : '';
        
        const isWordBefore = /[a-z0-9çğıöşü]/.test(charBefore);
        const isWordAfter = /[a-z0-9çğıöşü]/.test(charAfter);
        
        if (!isWordBefore && !isWordAfter) {
          foundMonths.push({ name: key, index: TURKISH_MONTHS[key], charPos: idx });
        }
        startIdx = idx + 1;
      }
    }

    // Filter out subset matches
    const uniqueMatches = [];
    foundMonths.forEach(m1 => {
      const isSubset = foundMonths.some(m2 => {
        return m1 !== m2 && 
          m1.charPos >= m2.charPos && 
          (m1.charPos + m1.name.length) <= (m2.charPos + m2.name.length);
      });
      if (!isSubset) {
        uniqueMatches.push(m1);
      }
    });

    uniqueMatches.sort((a, b) => a.charPos - b.charPos);

    if (numMatches && numMatches.length >= 2 && uniqueMatches.length >= 1) {
      const d1 = parseInt(numMatches[0]);
      const d2 = parseInt(numMatches[1]);
      
      const m1Obj = uniqueMatches[0];
      const m2Obj = uniqueMatches.length >= 2 ? uniqueMatches[1] : m1Obj;

      const y1 = m1Obj.index >= 9 ? startYear : startYear + 1;
      const y2 = m2Obj.index >= 9 ? startYear : startYear + 1;

      startDate = new Date(y1, m1Obj.index - 1, d1);
      endDate = new Date(y2, m2Obj.index - 1, d2);
      isDateParsed = true;
      return { startDate, endDate, isDateParsed };
    }

    return { startDate, endDate, isDateParsed };
  }

  function getFallbackDateRange(weekNum, startYear) {
    const sept1 = new Date(startYear, 8, 1);
    const dayOfSept1 = sept1.getDay() || 7;
    const schoolStart = new Date(sept1.getTime());
    schoolStart.setDate(sept1.getDate() - dayOfSept1 + 1 + 7);

    const sDate = new Date(schoolStart.getTime());
    sDate.setDate(schoolStart.getDate() + (weekNum - 1) * 7);
    const eDate = new Date(sDate.getTime());
    eDate.setDate(sDate.getDate() + 4);

    const dStart = sDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const dEnd = eDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    return `${dStart} - ${dEnd}`;
  }

  function updateImportPreview() {
    if (!currentSheetData || currentSheetData.length === 0) return;

    const colMonthIdx = parseInt(planColMonth.value);
    const colWeekIdx = parseInt(planColWeek.value);
    const colDateRangeIdx = planColDateRange ? parseInt(planColDateRange.value) : NaN;
    const colContentIdx = parseInt(planColContent.value);
    const colOutcomesIdx = parseInt(planColOutcomes.value);
    const colTopicsIdx = parseInt(planColTopics.value);
    const colDescriptionsIdx = parseInt(planColDescriptions.value);
    const startRowIndex = parseInt(planRowStart.value) - 1;
    const startYear = parseInt(planStartYear.value) || new Date().getFullYear();

    if (isNaN(colWeekIdx) || isNaN(startRowIndex)) return;

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

      // İmza, onay veya ek tablo kalıntılarını atla
      const rowFullText = row.join(' ').toLowerCase();
      if (/(?:okul müdürü|ders öğretmeni|zümre başkanı|uygundur|onaylanmıştır|imza sirküsü|belirli gün ve haftalarveatatürkçülük)/i.test(rowFullText)) {
        continue;
      }

      let effectiveMonth = monthVal || lastMonthText;
      if (monthVal) lastMonthText = monthVal;

      let effectiveWeek = weekVal || lastWeekText;
      if (weekVal) lastWeekText = weekVal;

      if (!effectiveWeek) {
        if (weekCounter > 40) continue;
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

      const weekNumbers = parseWeekNumbers(effectiveWeek).filter(n => n >= 1 && n <= 42);
      if (weekNumbers.length === 0 && weekCounter > 40) {
        continue;
      }
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

        let previewTopics = [];
        if (colTopicsIdx !== -1 && row[colTopicsIdx]) {
          previewTopics = String(row[colTopicsIdx]).split(/[\n,;]/).map(l => l.trim()).filter(l => l);
        }
        let previewDescs = [];
        if (colDescriptionsIdx !== -1 && row[colDescriptionsIdx]) {
          previewDescs = String(row[colDescriptionsIdx]).split('\n').map(l => l.trim()).filter(l => l);
        }

        const enrichedPreviewOutcomes = enrichOutcomes(outcomesList, previewTopics, previewDescs, contentVal, row);
        const previewText = enrichedPreviewOutcomes.length > 0 ? enrichedPreviewOutcomes[0] : (contentVal || 'Konu/Müfredat bilgisi');

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

    let courseName = '';
    if (planCourseNameSelect && planCourseNameSelect.value && planCourseNameSelect.value !== 'custom') {
      courseName = planCourseNameSelect.value.trim();
    } else if (planCourseNameInput && planCourseNameInput.value.trim()) {
      courseName = planCourseNameInput.value.trim();
    }

    const className = (planClassName.value || '3/A').trim();
    const educationYear = (planEducationYear.value || '2025-2026').trim();

    if (!courseName) {
      if (toastCallbackFn) toastCallbackFn('Lütfen planın ait olduğu dersi "Ders Seçin" alanından seçiniz.', 'danger');
      if (planCourseNameSelect) planCourseNameSelect.focus();
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

      // İmza, onay veya ek tablo kalıntılarını atla
      const rowFullText = row.join(' ').toLowerCase();
      if (/(?:okul müdürü|ders öğretmeni|zümre başkanı|uygundur|onaylanmıştır|imza sirküsü|belirli gün ve haftalarveatatürkçülük)/i.test(rowFullText)) {
        continue;
      }

      let effectiveMonth = monthVal || lastMonthText;
      if (monthVal) lastMonthText = monthVal;

      let effectiveWeek = weekVal || lastWeekText;
      if (weekVal) lastWeekText = weekVal;

      if (!effectiveWeek) {
        if (weekCounter > 40) continue;
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
      const weekNumbers = parseWeekNumbers(effectiveWeek).filter(n => n >= 1 && n <= 42);
      if (weekNumbers.length === 0 && weekCounter > 40) {
        continue;
      }
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
          if (/^(?:ünite|unite|tema|theme)$/i.test(unitName)) {
            unitName = null;
          }
        } else {
          unitName = /^(?:ünite|unite|tema|theme)$/i.test(unitText) ? null : unitText;
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

      // Sayısal kazanım kodlarını veya eksik kazanımları metinle zenginleştir
      outcomes = enrichOutcomes(outcomes, topics, descriptions, contentVal, row);

      // Unit Fallback from content if still missing
      if (!unitName && contentVal) {
        const match = contentVal.match(/(?:(\d+|[IVXLCDM]+)\.?\s*(?:ÜNİTE|UNITE|TEMA|THEME))\s*[:-]?\s*([^\n\r]+)/i);
        if (match) {
          const numStr = match[1];
          if (/^\d+$/.test(numStr)) unitNo = parseInt(numStr);
          else unitNo = romanToInt(numStr) || numStr;
          unitName = match[2].trim();
          if (/^(?:ünite|unite|tema|theme)$/i.test(unitName)) {
            unitName = null;
          }
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

    const planTitle = className ? `${className} - ${courseName}` : courseName;

    // Otomatik model tespiti: 4 ve 8 standart MEB (Kazanım), diğerleri Türkiye Yüzyılı Maarif Modeli (Öğrenme Çıktısı)
    const detectedGradeMatch = className ? className.match(/^(\d+)/) : null;
    const detectedGrade = detectedGradeMatch ? parseInt(detectedGradeMatch[1]) : 3;
    const isStdModel = detectedGrade === 4 || detectedGrade === 8;

    const savedPlan = stateManager.addPlan({
      title: planTitle,
      educationYear: educationYear,
      className: className,
      courseName: courseName,
      modelType: isStdModel ? 'standard' : 'maarif',
      modelName: isStdModel ? 'Standart MEB Müfredatı' : 'Türkiye Yüzyılı Maarif Modeli',
      weeklySchedule: weeklySchedule
    });

    if (!savedPlan) return; // Limit aşıldıysa ekleme yapma ve çık

    modalImportPlan.classList.remove('active');
    if (toastCallbackFn) toastCallbackFn(`"${courseName}" dersine ait ${className} yıllık planı başarıyla kaydedildi! (Toplam ${weeklySchedule.length} hafta)`, 'success');
    
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

  // --- MEB MÜFREDAT MODELİ VE TERMİNOLOJİ YARDIMCISI ---
  function getPlanModelInfo(plan) {
    if (!plan) {
      return {
        isMaarif: true,
        outcomeTitle: 'Öğrenme Çıktıları',
        weeklyOutcomeTitle: 'Haftalık Öğrenme Çıktıları',
        badgeText: 'Türkiye Yüzyılı Maarif Modeli',
        badgeStyle: 'background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25);',
        badgeIcon: 'sparkles'
      };
    }

    let isMaarif = true;
    if (plan.modelType) {
      isMaarif = plan.modelType === 'maarif';
    } else {
      // Sınıf seviyesine göre akıllı tespit: 4 ve 8 standart model, diğerleri Maarif modeli
      const gradeStr = (plan.className || '') + ' ' + (plan.title || '') + ' ' + (plan.courseName || '');
      const match = gradeStr.match(/\b(4|8)[\/\.\s-]*(?:sınıf|sinif|[a-z])?\b/i);
      if (match) {
        isMaarif = false;
      }
    }

    return {
      isMaarif: isMaarif,
      outcomeTitle: isMaarif ? 'Öğrenme Çıktıları' : 'Kazanımlar',
      weeklyOutcomeTitle: isMaarif ? 'Haftalık Öğrenme Çıktıları' : 'Haftalık Kazanımlar',
      badgeText: isMaarif ? 'Türkiye Yüzyılı Maarif Modeli' : 'Standart MEB Müfredatı',
      badgeStyle: isMaarif
        ? 'background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25);'
        : 'background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25);',
      badgeIcon: isMaarif ? 'sparkles' : 'book'
    };
  }

  // --- MEB TASLAK ÇERÇEVE PLAN HAVUZU FONKSİYONLARI ---

  function renderMebCurriculumPool(grade, query) {
    if (!mebCurriculumCardsContainer) return;

    const data = window.MEB_CURRICULUM_DATA || [];
    if (!data || data.length === 0) {
      mebCurriculumCardsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted);">
          <i data-lucide="alert-circle" style="width: 32px; height: 32px; margin-bottom: 0.5rem; opacity: 0.6;"></i>
          <p style="margin: 0; font-size: 0.9rem;">MEB Müfredat planları yüklenemedi veya veri bulunamadı.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const currentGrade = grade ? parseInt(grade) : selectedCurriculumGrade;
    const q = (query || '').trim().toLocaleLowerCase('tr-TR');

    const filtered = data.filter(p => {
      const matchGrade = !currentGrade || p.grade === currentGrade;
      const matchQuery = !q || (
        (p.course && p.course.toLocaleLowerCase('tr-TR').includes(q)) ||
        (p.sourceSheet && p.sourceSheet.toLocaleLowerCase('tr-TR').includes(q))
      );
      return matchGrade && matchQuery;
    });

    if (filtered.length === 0) {
      mebCurriculumCardsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--text-muted); background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          <i data-lucide="search-x" style="width: 36px; height: 36px; margin-bottom: 0.5rem; opacity: 0.5;"></i>
          <p style="margin: 0 0 0.25rem 0; font-weight: 600; font-size: 0.9rem;">Aradığınız kriterlere uygun plan bulunamadı.</p>
          <p style="margin: 0; font-size: 0.8rem;">Lütfen arama terimini değiştirin veya başka bir sınıf seviyesi seçin.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Mevcut kayıtlı planları kontrol et
    const existingPlans = (stateManager.state && stateManager.state.plans) ? stateManager.state.plans : [];
    const currentClassName = planClassName ? planClassName.value.trim() : '4/A';
    const curClassLower = currentClassName.toLocaleLowerCase('tr-TR');

    let html = '';
    filtered.forEach(p => {
      const isMaarif = p.modelType === 'maarif';
      const badgeStyle = isMaarif 
        ? 'background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25);'
        : 'background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25);';
      const badgeLabel = isMaarif ? 'Türkiye Yüzyılı Maarif Modeli' : 'Standart MEB Müfredatı';
      const outcomeLabel = isMaarif ? 'Öğrenme Çıktıları' : 'Kazanımlar';

      // Bu planın mevcut sınıfa zaten ekli olup olmadığını kontrol et
      const mebCourseLower = (p.course || '').trim().toLocaleLowerCase('tr-TR');
      const isAlreadyAdded = existingPlans.some(ep => {
        const epClass = (ep.className || '').trim().toLocaleLowerCase('tr-TR');
        if (epClass !== curClassLower) return false;
        const epCourse = (ep.courseName || ep.title || '').trim().toLocaleLowerCase('tr-TR');
        return epCourse === mebCourseLower || epCourse.includes(mebCourseLower) || mebCourseLower.includes(epCourse);
      });

      // Tipik haftalık ders saatini bul
      let classHours = 4;
      if (p.weeks && p.weeks.length > 0) {
        const found = p.weeks.find(w => w.classHours && w.classHours > 0);
        if (found) classHours = found.classHours;
      }

      // Yayıncı veya sayfa bilgisi
      let publisherInfo = p.sourceSheet || '';
      if (publisherInfo.length > 38) publisherInfo = publisherInfo.slice(0, 35) + '...';

      const cardStyle = isAlreadyAdded 
        ? 'border: 1px solid rgba(16, 185, 129, 0.45); background: rgba(16, 185, 129, 0.04);' 
        : 'border: 1px solid var(--border-color); background: var(--bg-secondary);';

      html += `
        <div class="glass-card meb-curriculum-card" style="display: flex; flex-direction: column; justify-content: space-between; padding: 0.9rem; border-radius: var(--radius-md); ${cardStyle} transition: transform 0.15s ease, border-color 0.15s ease;">
          <div>
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.4rem;">
              <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text-primary); line-height: 1.25;">
                ${escapeHtml(p.course)}
              </h4>
              ${isAlreadyAdded ? `
                <span class="badge" style="font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; background: rgba(16, 185, 129, 0.18); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.35); white-space: nowrap; display: inline-flex; align-items: center; gap: 0.2rem;">
                  <i data-lucide="check" style="width: 11px; height: 11px;"></i> Ekli (${escapeHtml(currentClassName)})
                </span>
              ` : `
                <span style="font-size: 0.75rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; background: rgba(59, 130, 246, 0.12); color: var(--primary); white-space: nowrap;">
                  ${p.grade}. Sınıf
                </span>
              `}
            </div>

            <div style="margin-bottom: 0.5rem;">
              <span class="badge" style="${badgeStyle} font-size: 0.7rem; padding: 0.2rem 0.45rem; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem;">
                <i data-lucide="${isMaarif ? 'sparkles' : 'book'}" style="width: 11px; height: 11px;"></i>
                ${badgeLabel}
              </span>
            </div>

            <div style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.4;">
              <div style="display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.2rem;">
                <i data-lucide="clock" style="width: 12px; height: 12px; opacity: 0.7;"></i>
                <span>${classHours} Saat / Hafta • Toplam ${p.weekCount || (p.weeks ? p.weeks.length : 36)} Hafta</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.35rem;">
                <i data-lucide="file-check" style="width: 12px; height: 12px; opacity: 0.7;"></i>
                <span>Format: <strong>${outcomeLabel}</strong></span>
              </div>
              ${publisherInfo ? `
                <div style="display: flex; align-items: center; gap: 0.35rem; margin-top: 0.2rem; font-size: 0.72rem; opacity: 0.85;">
                  <i data-lucide="tag" style="width: 11px; height: 11px; opacity: 0.6;"></i>
                  <span>${escapeHtml(publisherInfo)}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div style="display: flex; gap: 0.4rem; padding-top: 0.6rem; border-top: 1px solid rgba(255, 255, 255, 0.05);">
            <button type="button" class="btn btn-secondary btn-sm btn-preview-meb-curriculum" data-id="${p.id}" style="flex: 1; font-size: 0.78rem; padding: 0.35rem 0.4rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem;">
              <i data-lucide="eye" style="width: 13px; height: 13px;"></i> Önizle
            </button>
            ${isAlreadyAdded ? `
              <button type="button" class="btn btn-secondary btn-sm" disabled style="flex: 1.3; font-size: 0.78rem; padding: 0.35rem 0.4rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); cursor: not-allowed; opacity: 0.9;">
                <i data-lucide="check" style="width: 13px; height: 13px;"></i> Eklendi
              </button>
            ` : `
              <button type="button" class="btn btn-primary btn-sm btn-use-meb-curriculum" data-id="${p.id}" style="flex: 1.3; font-size: 0.78rem; padding: 0.35rem 0.4rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem;">
                <i data-lucide="plus" style="width: 13px; height: 13px;"></i> Planı Ekle
              </button>
            `}
          </div>
        </div>
      `;
    });

    mebCurriculumCardsContainer.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();

    // Dinleyicileri bağla
    mebCurriculumCardsContainer.querySelectorAll('.btn-preview-meb-curriculum').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openCurriculumPreview(id);
      });
    });

    mebCurriculumCardsContainer.querySelectorAll('.btn-use-meb-curriculum').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        addMebCurriculumPlanToUserPlans(id);
      });
    });
  }

  function openCurriculumPreview(planId) {
    const data = window.MEB_CURRICULUM_DATA || [];
    const plan = data.find(p => p.id === planId);
    if (!plan) return;

    previewingMebPlan = plan;
    if (!panelCurriculumPreview) return;

    const isMaarif = plan.modelType === 'maarif';
    const outcomeColName = isMaarif ? 'Öğrenme Çıktıları' : 'Kazanımlar';

    // Bu plan ekli mi kontrol et
    const existingPlans = (stateManager.state && stateManager.state.plans) ? stateManager.state.plans : [];
    const currentClassName = planClassName ? planClassName.value.trim() : '4/A';
    const curClassLower = currentClassName.toLocaleLowerCase('tr-TR');
    const mebCourseLower = (plan.course || '').trim().toLocaleLowerCase('tr-TR');
    const isAlreadyAdded = existingPlans.some(ep => {
      const epClass = (ep.className || '').trim().toLocaleLowerCase('tr-TR');
      if (epClass !== curClassLower) return false;
      const epCourse = (ep.courseName || ep.title || '').trim().toLocaleLowerCase('tr-TR');
      return epCourse === mebCourseLower || epCourse.includes(mebCourseLower) || mebCourseLower.includes(epCourse);
    });

    if (btnConfirmCurriculumUse) {
      if (isAlreadyAdded) {
        btnConfirmCurriculumUse.disabled = true;
        btnConfirmCurriculumUse.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px;"></i> Bu Plan Zaten Ekli (${escapeHtml(currentClassName)})`;
        btnConfirmCurriculumUse.style.background = 'rgba(16, 185, 129, 0.2)';
        btnConfirmCurriculumUse.style.color = '#10b981';
        btnConfirmCurriculumUse.style.cursor = 'not-allowed';
      } else {
        btnConfirmCurriculumUse.disabled = false;
        btnConfirmCurriculumUse.innerHTML = `<i data-lucide="plus" style="width: 14px; height: 14px;"></i> Bu Planı Yıllık Planlarıma Ekle`;
        btnConfirmCurriculumUse.style.background = '';
        btnConfirmCurriculumUse.style.color = '';
        btnConfirmCurriculumUse.style.cursor = 'pointer';
      }
    }

    if (previewCurriculumTitle) {
      previewCurriculumTitle.innerHTML = `
        <span style="color: var(--text-primary);">${escapeHtml(plan.course)} (${plan.grade}. Sınıf)</span>
        <span style="font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem; opacity: 0.8; color: ${isMaarif ? '#10b981' : '#f59e0b'};">
          ${isMaarif ? '● Türkiye Yüzyılı Maarif Modeli' : '● Standart MEB Müfredatı'}
        </span>
        ${isAlreadyAdded ? `
          <span class="badge" style="font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; background: rgba(16, 185, 129, 0.18); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.35); margin-left: 0.5rem;">
            ✓ Ekli (${escapeHtml(currentClassName)})
          </span>
        ` : ''}
      `;
    }

    if (previewCurriculumTableContainer) {
      const weeks = plan.weeks || [];
      let rowsHtml = '';
      weeks.forEach(w => {
        const outcomesText = (w.learningOutcomes || []).map(o => `<div style="margin-bottom: 0.2rem;">• ${escapeHtml(o)}</div>`).join('');
        const topicsText = (w.topics || []).map(t => `<div style="margin-bottom: 0.2rem;">• ${escapeHtml(t)}</div>`).join('');

        rowsHtml += `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.4rem 0.5rem; font-weight: 700; white-space: nowrap; text-align: center;">${w.weekNum}. Hafta</td>
            <td style="padding: 0.4rem 0.5rem; white-space: nowrap; color: var(--text-muted);">${w.month || ''} <br><span style="font-size: 0.72rem;">${w.dateRange || ''}</span></td>
            <td style="padding: 0.4rem 0.5rem; font-weight: 600;">${escapeHtml(w.unitName || '-')}</td>
            <td style="padding: 0.4rem 0.5rem;">${topicsText || '-'}</td>
            <td style="padding: 0.4rem 0.5rem; color: var(--text-primary);">${outcomesText || '-'}</td>
            <td style="padding: 0.4rem 0.5rem; font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(w.specialDays || '-')}</td>
          </tr>
        `;
      });

      previewCurriculumTableContainer.innerHTML = `
        <table class="table" style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
          <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--border-color); text-align: left;">
              <th style="padding: 0.4rem 0.5rem; width: 65px; text-align: center;">Hafta</th>
              <th style="padding: 0.4rem 0.5rem; width: 95px;">Tarih</th>
              <th style="padding: 0.4rem 0.5rem; width: 140px;">Ünite / Tema</th>
              <th style="padding: 0.4rem 0.5rem; width: 150px;">Konu</th>
              <th style="padding: 0.4rem 0.5rem;">${outcomeColName}</th>
              <th style="padding: 0.4rem 0.5rem; width: 120px;">Belirli Günler</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
    }

    panelCurriculumPreview.style.display = 'block';
    panelCurriculumPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (window.lucide) window.lucide.createIcons();
  }

  function closeCurriculumPreview() {
    previewingMebPlan = null;
    if (panelCurriculumPreview) {
      panelCurriculumPreview.style.display = 'none';
    }
  }

  function addMebCurriculumPlanToUserPlans(planId) {
    const data = window.MEB_CURRICULUM_DATA || [];
    const mebPlan = data.find(p => p.id === planId);
    if (!mebPlan) {
      if (toastCallbackFn) toastCallbackFn('Plan bulunamadı.', 'danger');
      return;
    }

    let className = planClassName ? planClassName.value.trim() : '';
    if (!className) {
      className = `${mebPlan.grade}/A`;
    }

    const courseName = mebPlan.course;

    // Güvenlik Kontrolü: Bu ders bu sınıfa zaten ekli mi?
    const existingPlans = (stateManager.state && stateManager.state.plans) ? stateManager.state.plans : [];
    const curClassLower = className.toLocaleLowerCase('tr-TR');
    const mebCourseLower = courseName.trim().toLocaleLowerCase('tr-TR');
    const isAlreadyAdded = existingPlans.some(ep => {
      const epClass = (ep.className || '').trim().toLocaleLowerCase('tr-TR');
      if (epClass !== curClassLower) return false;
      const epCourse = (ep.courseName || ep.title || '').trim().toLocaleLowerCase('tr-TR');
      return epCourse === mebCourseLower || epCourse.includes(mebCourseLower) || mebCourseLower.includes(epCourse);
    });

    if (isAlreadyAdded) {
      if (toastCallbackFn) toastCallbackFn(`"${courseName}" dersine ait ${className} planı zaten ekli!`, 'warning');
      return;
    }

    const rawEduYear = planEducationYear ? planEducationYear.value.trim() : '';
    let startYear = parseInt((rawEduYear || '2026').split('-')[0]) || 2026;
    if (startYear < 2026) startYear = 2026; // MEB taslak planları 2026-2027 takvimine aittir
    const educationYear = `${startYear}-${startYear + 1}`;

    // Haftaları dönüştür
    const weeklySchedule = [];
    const sourceWeeks = mebPlan.weeks || [];

    sourceWeeks.forEach(w => {
      let sDateStr = null;
      let eDateStr = null;
      let isoWeek = null;

      if (w.dateRange) {
        const { startDate, endDate, isDateParsed } = parseTurkishDateRange(w.dateRange, startYear);
        if (isDateParsed && startDate && endDate) {
          sDateStr = startDate.toISOString().slice(0, 10);
          eDateStr = endDate.toISOString().slice(0, 10);
          isoWeek = window.getISOWeek(startDate);
        }
      }

      weeklySchedule.push({
        id: 'w_' + (w.weekNum || weeklySchedule.length + 1) + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        month: w.month ? w.month.toUpperCase() : '',
        weekNumber: [w.weekNum || (weeklySchedule.length + 1)],
        weekLabel: w.weekLabel || `${w.weekNum || (weeklySchedule.length + 1)}. Hafta`,
        dateRange: w.dateRange || '',
        startDate: sDateStr,
        endDate: eDateStr,
        isoWeek: isoWeek,
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
      if (toastCallbackFn) toastCallbackFn('Seçilen planda haftalık içerik bulunamadı.', 'danger');
      return;
    }

    const planTitle = className ? `${className} - ${courseName}` : courseName;

    const savedPlan = stateManager.addPlan({
      title: planTitle,
      educationYear: educationYear,
      className: className,
      courseName: courseName,
      modelType: mebPlan.modelType || (mebPlan.grade === 4 || mebPlan.grade === 8 ? 'standard' : 'maarif'),
      modelName: mebPlan.modelName || (mebPlan.grade === 4 || mebPlan.grade === 8 ? 'Standart MEB Müfredatı' : 'Türkiye Yüzyılı Maarif Modeli'),
      weeklySchedule: weeklySchedule
    });

    if (!savedPlan) return;

    closeCurriculumPreview();
    if (modalImportPlan) modalImportPlan.classList.remove('active');

    const modelDesc = savedPlan.modelType === 'maarif' 
      ? 'Türkiye Yüzyılı Maarif Modeli (Öğrenme Çıktıları)' 
      : 'Standart MEB Müfredatı (Kazanımlar)';

    if (toastCallbackFn) {
      toastCallbackFn(`"${courseName}" dersine ait ${className} yıllık planı eklendi! [${modelDesc} - ${weeklySchedule.length} hafta]`, 'success');
    }

    activePlansMainTab = 'general';
    if (btnPlansTabGeneral) btnPlansTabGeneral.classList.add('active');
    if (btnPlansTabWeekly) btnPlansTabWeekly.classList.remove('active');
    if (plansTabContentGeneral) plansTabContentGeneral.style.display = 'block';
    if (plansTabContentWeekly) plansTabContentWeekly.style.display = 'none';

    // Yeni planı aç
    expandedPlans[savedPlan.id] = true;
    (savedPlan.weeklySchedule || []).forEach(week => {
      if (week.month) {
        expandedMonths[savedPlan.id + '_' + week.month] = true;
      }
    });

    renderPlansList();
  }

  function getActiveWeekIndex(weeklySchedule) {
    if (!weeklySchedule || weeklySchedule.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayM = today.getMonth(); // 0-11
    const todayD = today.getDate(); // 1-31

    const parseFlexibleDate = (dateVal) => {
      if (!dateVal) return null;
      if (dateVal instanceof Date && !isNaN(dateVal.getTime())) return dateVal;
      if (typeof dateVal === 'string') {
        const str = dateVal.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          const parts = str.split('T')[0].split('-');
          return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
        if (/^\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4}/.test(str)) {
          const parts = str.split(/[\.\/\-]/);
          return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
        if (/^\d{1,2}[\.\/\-]\d{1,2}$/.test(str)) {
          const parts = str.split(/[\.\/\-]/);
          return new Date(today.getFullYear(), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) return parsed;
      }
      return null;
    };

    // 1. Seviye: startDate - endDate aralık kontrolü
    for (let i = 0; i < weeklySchedule.length; i++) {
      const week = weeklySchedule[i];
      if (week.startDate && week.endDate) {
        const sDate = parseFlexibleDate(week.startDate);
        const eDate = parseFlexibleDate(week.endDate);
        if (sDate && eDate) {
          sDate.setHours(0, 0, 0, 0);
          eDate.setHours(23, 59, 59, 999);
          const eDateExtended = new Date(eDate.getTime());
          eDateExtended.setDate(eDateExtended.getDate() + 2); // Hafta sonu toleransı
          
          if (today >= sDate && today <= eDateExtended) {
            return i;
          }

          // Yıl toleransı (Ay ve gün aralığı kontrolü)
          const sM = sDate.getMonth();
          const eM = eDate.getMonth();
          const sD = sDate.getDate();
          const eD = eDate.getDate() + 2;
          if (sM === eM && todayM === sM) {
            if (todayD >= sD && todayD <= eD) {
              return i;
            }
          } else if (sM !== eM) {
            if ((todayM === sM && todayD >= sD) || (todayM === eM && todayD <= eD)) {
              return i;
            }
          }
        }
      }
    }

    // 2. Seviye: dateRange metninden Türkçe ay ve gün aralığı kontrolü
    const TURKISH_MONTH_MAP = {
      'ocak': 0, 'şubat': 1, 'subat': 1, 'mart': 2, 'nisan': 3,
      'mayıs': 4, 'mayis': 4, 'haziran': 5, 'temmuz': 6,
      'ağustos': 7, 'agustos': 7, 'eylül': 8, 'eylul': 8,
      'ekim': 9, 'kasım': 10, 'kasim': 10, 'aralık': 11, 'aralik': 11
    };

    for (let i = 0; i < weeklySchedule.length; i++) {
      const week = weeklySchedule[i];
      const rawText = `${week.dateRange || ''} ${week.month || ''}`.toLocaleLowerCase('tr');
      if (!rawText.trim()) continue;

      let matchedMonthIdx = -1;
      for (const [mName, mIdx] of Object.entries(TURKISH_MONTH_MAP)) {
        if (rawText.includes(mName)) {
          matchedMonthIdx = mIdx;
          break;
        }
      }

      if (matchedMonthIdx === todayM) {
        const numMatches = rawText.match(/\b\d{1,2}\b/g);
        if (numMatches && numMatches.length >= 1) {
          const startDay = parseInt(numMatches[0], 10);
          const endDay = numMatches.length >= 2 ? parseInt(numMatches[1], 10) + 2 : startDay + 4 + 2;
          if (todayD >= startDay && todayD <= endDay) {
            return i;
          }
        }
      }
    }

    // 3. Seviye: ISO Hafta kodu kontrolü
    const currentISOWeek = window.getISOWeek ? window.getISOWeek(today) : '';
    if (currentISOWeek) {
      for (let i = 0; i < weeklySchedule.length; i++) {
        if (weeklySchedule[i].isoWeek === currentISOWeek) {
          return i;
        }
      }
      const weekPart = currentISOWeek.includes('-W') ? currentISOWeek.split('-W')[1] : '';
      if (weekPart) {
        for (let i = 0; i < weeklySchedule.length; i++) {
          if (weeklySchedule[i].isoWeek && weeklySchedule[i].isoWeek.endsWith(`-W${weekPart}`)) {
            return i;
          }
        }
      }
    }

    // 4. Seviye: Tamamlanmamış ilk normal haftayı seç
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

    // Auto-migrate/correct plans in localStorage
    const statePlans = stateManager.state.plans || [];
    let stateChanged = false;
    statePlans.forEach(plan => {
      // 1. Rastgele hash içeren ders adını/başlığını tespit edip onar (örn: 4/c - a4574fe744)
      if (plan.courseName && /^[a-f0-9]{8,}$/i.test(plan.courseName.trim())) {
        const allText = (plan.weeklySchedule || plan.weeks || []).map(w => 
          (w.unitName || '') + ' ' + (w.topics || []).join(' ') + ' ' + (w.descriptions || []).join(' ')
        ).join(' ');
        const detected = detectCourseAndClassFromContent('', null, allText);
        if (detected.detectedCourse) {
          plan.courseName = detected.detectedCourse;
          plan.title = `${plan.className ? plan.className + ' - ' : ''}${detected.detectedCourse}`;
          stateChanged = true;
        }
      }

      const schedule = plan.weeklySchedule || plan.weeks || [];

      // MEB 2026-2027 taslak planları (14 Eylül başlangıçlı planlar) eğitim yılını 2026-2027'ye senkronize et
      const firstWeekDate = schedule.length > 0 ? (schedule[0].dateRange || '') : '';
      if (/14\s*Eyl/i.test(firstWeekDate) && (plan.educationYear === '2025-2026' || !plan.educationYear)) {
        plan.educationYear = '2026-2027';
        stateChanged = true;
      }

      const startYear = parseInt((plan.educationYear || '2026').split('-')[0]) || 2026;
      schedule.forEach(week => {
        // 2. Sadece sayı olan veya eksik kalan kazanımları zenginleştir
        if (week.learningOutcomes && Array.isArray(week.learningOutcomes)) {
          const isOnlyNumbers = week.learningOutcomes.length > 0 && week.learningOutcomes.every(o => /^\d+[\.\)]?$/.test(String(o).trim()));
          if (isOnlyNumbers || week.learningOutcomes.length === 0) {
            const enriched = enrichOutcomes(week.learningOutcomes, week.topics, week.descriptions, week.content, null);
            if (enriched.length > 0 && enriched[0] !== (week.learningOutcomes[0] || '')) {
              week.learningOutcomes = enriched;
              stateChanged = true;
            }
          }
        }

        if (week.topics && Array.isArray(week.topics)) {
          const filtered = week.topics.filter(t => !isDateString(t));
          if (filtered.length !== week.topics.length) {
            week.topics = filtered;
            stateChanged = true;
          }
        }
        if (week.topic && isDateString(week.topic)) {
          week.topic = '';
          stateChanged = true;
        }
        if (week.dateRange) {
          const { startDate, endDate, isDateParsed } = parseTurkishDateRange(week.dateRange, startYear);
          if (isDateParsed && startDate && endDate) {
            const sDateStr = startDate.toISOString().slice(0, 10);
            const eDateStr = endDate.toISOString().slice(0, 10);
            const computedIsoWeek = window.getISOWeek(startDate);
            
            if (week.startDate !== sDateStr || week.endDate !== eDateStr || week.isoWeek !== computedIsoWeek) {
              week.startDate = sDateStr;
              week.endDate = eDateStr;
              week.isoWeek = computedIsoWeek;
              stateChanged = true;
            }
          }
        }
      });

      // 3. 40 haftadan fazla veya bozuk (50+ hafta numaralı / ek tablo kalıntısı) haftaları otomatik temizle
      if (schedule.length > 40 || schedule.some(w => {
        const wNums = Array.isArray(w.weekNumber) ? w.weekNumber : [];
        return wNums.some(n => n > 42) || /^(?:5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])\./.test(w.weekLabel || '');
      })) {
        const validSchedule = schedule.filter(week => {
          const wNums = Array.isArray(week.weekNumber) ? week.weekNumber : [];
          if (wNums.some(n => n > 42)) return false;
          if (/^(?:5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])\./.test(week.weekLabel || '')) return false;
          const text = [week.unitName, ...(week.topics || []), ...(week.descriptions || [])].join(' ').toLowerCase();
          if (text.includes('atatürkçülük konuları') || text.includes('belirli gün ve haftalarveatatürkçülük')) return false;
          return true;
        });
        if (validSchedule.length > 0 && validSchedule.length < schedule.length) {
          plan.weeklySchedule = validSchedule.slice(0, 40);
          stateChanged = true;
        }
      }

      // 4. "2. ÜNİTE: ÜNİTE" sorununu veritabanı düzeyinde düzelt
      schedule.forEach(week => {
        if (week.unitName && /^(?:ünite|unite|tema|theme)$/i.test(week.unitName.trim())) {
          week.unitName = null;
          stateChanged = true;
        }
      });
    });
    if (stateChanged) {
      stateManager.saveState();
    }

    if (!plansSelectedWeekCode) {
      plansSelectedWeekCode = stateManager.getSelectedWeek();
    }

    if (activePlansMainTab === 'weekly') {
      renderWeeklyView();
    } else {
      renderGeneralView();
    }
  }

  function findWeekForSchedule(schedule, targetWeekCode, plan, allPlans) {
    if (!schedule || schedule.length === 0) return { weekItem: null, weekIdx: -1 };

    // 1. Doğrudan isoWeek Eşleşmesi (Tam eşleşme)
    let weekIdx = schedule.findIndex(w => w.isoWeek === targetWeekCode);
    if (weekIdx !== -1) return { weekItem: schedule[weekIdx], weekIdx };

    const parts = (targetWeekCode || '').split('-W');
    const targetYear = parseInt(parts[0]);
    const targetWeekNum = parseInt(parts[1]);

    // 2. Çapraz Eşleşme: Başka bir planda targetWeekCode eşleşmişse aynı haftalık çalışma sırasını al
    // (Örn: Fen Bilimleri 1. çalışma haftasındaysa Matematik ve Beden Eğitimi de 1. çalışma haftasında olsun)
    if (Array.isArray(allPlans)) {
      for (const otherPlan of allPlans) {
        if (otherPlan.id === plan.id) continue;
        const otherSched = otherPlan.weeklySchedule || otherPlan.weeks || [];
        const matchIdx = otherSched.findIndex(w => w.isoWeek === targetWeekCode);
        if (matchIdx !== -1 && matchIdx < schedule.length) {
          const candidateWeek = schedule[matchIdx];
          if (candidateWeek) {
            return { weekItem: candidateWeek, weekIdx: matchIdx };
          }
        }
      }
    }

    // 3. Hafta Numarası Eşleşmesi (W38 vs W38 veya Eylül başı toleransı W37-W38)
    if (!isNaN(targetWeekNum)) {
      weekIdx = schedule.findIndex(w => {
        if (!w.isoWeek) return false;
        const wParts = w.isoWeek.split('-W');
        const wNum = parseInt(wParts[1]);
        if (wNum === targetWeekNum) return true;
        // Eylül açılış haftası toleransı (W37 veya W38)
        if ((targetWeekNum === 38 || targetWeekNum === 37) && (wNum === 37 || wNum === 38)) {
          return true;
        }
        return false;
      });
      if (weekIdx !== -1) return { weekItem: schedule[weekIdx], weekIdx };
    }

    // 4. Tarih Aralığı Gün/Ay Metin Eşleşmesi
    const weekDateRange = getISOWeekDateRange(targetWeekCode);
    if (weekDateRange) {
      const lowerTarget = weekDateRange.toLocaleLowerCase('tr-TR');
      weekIdx = schedule.findIndex(w => {
        if (!w.dateRange) return false;
        const lowerPlan = w.dateRange.toLocaleLowerCase('tr-TR');
        const dayMatch = lowerPlan.match(/\b\d{1,2}\b/);
        if (dayMatch && lowerTarget.includes(dayMatch[0])) {
          const monthMatch = lowerPlan.match(/\b(eyl|eki|kas|ara|oca|şub|mar|nis|may|haz)\b/);
          if (monthMatch && lowerTarget.includes(monthMatch[1])) {
            return true;
          }
        }
        return false;
      });
      if (weekIdx !== -1) return { weekItem: schedule[weekIdx], weekIdx };
    }

    // 5. MEB Okul Takvimi Sıra Numarası (Hafta 1..40)
    let mebWeekNumber = null;
    if (targetWeekNum >= 37) {
      mebWeekNumber = targetWeekNum >= 38 ? targetWeekNum - 37 : 1;
    } else if (targetWeekNum <= 26) {
      mebWeekNumber = targetWeekNum + 15;
    }

    if (mebWeekNumber !== null) {
      weekIdx = schedule.findIndex(w => {
        const wNums = Array.isArray(w.weekNumber) ? w.weekNumber : [];
        if (wNums.includes(mebWeekNumber)) return true;
        if (w.weekNo === mebWeekNumber) return true;
        if (w.weekLabel && w.weekLabel.startsWith(`${mebWeekNumber}.`)) return true;
        return false;
      });
      if (weekIdx !== -1) return { weekItem: schedule[weekIdx], weekIdx };
    }

    return { weekItem: null, weekIdx: -1 };
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
      plansCurrentWeekLabel.textContent = window.formatWeekTR ? window.formatWeekTR(plansSelectedWeekCode, 'short') : plansSelectedWeekCode;
    }
    if (plansCurrentWeekDates) {
      plansCurrentWeekDates.textContent = getISOWeekDateRange(plansSelectedWeekCode);
    }

    plans.forEach(plan => {
      const schedule = plan.weeklySchedule || plan.weeks || [];
      const matchResult = findWeekForSchedule(schedule, plansSelectedWeekCode, plan, plans);
      const weekIdx = matchResult.weekIdx;
      const weekItem = matchResult.weekItem;
      const modelInfo = getPlanModelInfo(plan);

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
        const displayOutcomes = (weekItem.learningOutcomes || []).map(o => formatOutcomeDisplay(o, weekItem));
        if (displayOutcomes.length > 0) {
          if (displayOutcomes.length > 3) {
            const visibleOutcomes = displayOutcomes.slice(0, 3);
            const hiddenOutcomes = displayOutcomes.slice(3);
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
            outcomesHtml = displayOutcomes.map(o => `
              <li style="margin-bottom: 0.5rem; display: flex; align-items: start; gap: 0.5rem; font-size: 0.925rem; line-height: 1.45;">
                <span style="color: var(--primary); font-weight: 700; margin-top: 0.15rem;">•</span>
                <span>${escapeHtml(o)}</span>
              </li>
            `).join('');
          }
        } else {
          outcomesHtml = `<li style="font-style: italic; color: var(--text-muted); list-style: none;">${modelInfo.outcomeTitle} belirtilmemiş.</li>`;
        }

        let topicsHtml = '';
        if (weekItem.topics && weekItem.topics.length > 0) {
          topicsHtml = weekItem.topics.map(t => `<span style="display: inline-block; padding: 0.3rem 0.6rem; font-size: 0.75rem; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); border-radius: 99px; font-weight: 600; color: var(--text-secondary);">${escapeHtml(t)}</span>`).join(' ');
        }

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem; flex-wrap: wrap;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(plan.className || 'Sınıf')} • ${escapeHtml(plan.courseName || 'Ders')}</span>
                <span class="badge" style="${modelInfo.badgeStyle} font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem;">
                  <i data-lucide="${modelInfo.badgeIcon}" style="width: 11px; height: 11px;"></i> ${modelInfo.badgeText}
                </span>
              </div>
              <h3 style="margin: 0.25rem 0 0 0; font-size: 1.2rem; font-weight: 800; color: var(--text-primary);">${escapeHtml(plan.title || plan.courseName)}</h3>
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
              ${formatUnitDisplay(weekItem.unitNo, weekItem.unitName) ? `
                <div style="margin-bottom: 0.75rem;">
                  <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 0.25rem;">Ünite / Tema</span>
                  <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${escapeHtml(formatUnitDisplay(weekItem.unitNo, weekItem.unitName))}</span>
                </div>
              ` : ''}

              <div style="margin-bottom: 0.75rem;">
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 0.25rem;">${modelInfo.weeklyOutcomeTitle}</span>
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
          if (window.LicenseConfig && typeof window.LicenseConfig.showPrompt === 'function') {
            window.LicenseConfig.showPrompt('Yıllık Planlar', window.LicenseConfig.planLimit);
          } else if (window.openLicensePurchase) {
            window.openLicensePurchase('Yıllık Plan Limiti');
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
      const modelInfo = getPlanModelInfo(plan);

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
              <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <h3 class="general-plan-title" style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${escapeHtml(plan.title)}</h3>
                <span class="badge" style="${modelInfo.badgeStyle} font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem;">
                  <i data-lucide="${modelInfo.badgeIcon}" style="width: 10px; height: 10px;"></i>
                  ${modelInfo.badgeText}
                </span>
              </div>
              <div class="plan-meta" style="margin-top: 0.35rem; display: flex; gap: 0.75rem; flex-wrap: wrap; font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">
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
          const generalDisplayOutcomes = (weekItem.learningOutcomes || []).map(o => formatOutcomeDisplay(o, weekItem));
          if (generalDisplayOutcomes.length > 0) {
            outcomesListHtml = generalDisplayOutcomes.map(o => `
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
                ${formatUnitDisplay(weekItem.unitNo, weekItem.unitName) ? `<div style="font-size: 0.75rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem; text-transform: uppercase;">${escapeHtml(formatUnitDisplay(weekItem.unitNo, weekItem.unitName))}</div>` : ''}
                
                <div style="margin-bottom: 0.75rem;">
                  <h5 style="margin: 0 0 0.35rem 0; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">${modelInfo.outcomeTitle}</h5>
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
      const btnRename = planCard.querySelector('.btn-general-rename');
      if (btnRename) {
        btnRename.addEventListener('click', async (e) => {
          e.stopPropagation();
          e.preventDefault();
          const updated = await openEditPlanModal(plan);
          if (updated) {
            renderGeneralView();
            renderWeeklyView();
            if (toastCallbackFn) toastCallbackFn('Plan bilgileri başarıyla güncellendi.', 'success');
          }
        });
      }

      const btnDelete = planCard.querySelector('.btn-general-delete');
      if (btnDelete) {
        btnDelete.addEventListener('click', async (e) => {
          e.stopPropagation();
          e.preventDefault();
          const planName = plan.courseName || plan.title || 'Ders Planı';
          const isConfirmed = window.confirmAsync ? 
            await window.confirmAsync(`"${planName}" planını tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`) :
            confirm(`"${planName}" planını tamamen silmek istediğinize emin misiniz?`);
          
          if (isConfirmed) {
            stateManager.deletePlan(plan.id);
            renderGeneralView();
            renderWeeklyView();
            if (toastCallbackFn) toastCallbackFn('Ders planı silindi.', 'info');
          }
        });
      }

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
          if (window.LicenseConfig && typeof window.LicenseConfig.showPrompt === 'function') {
            window.LicenseConfig.showPrompt('Yıllık Planlar', window.LicenseConfig.planLimit);
          } else if (window.openLicensePurchase) {
            window.openLicensePurchase('Yıllık Plan Limiti');
          }
        });
        planCard.appendChild(lockOverlay);
      }

      plansGeneralListContainer.appendChild(planCard);
    });

    window.safeCreateIcons();
  }

  // Plan Bilgilerini Düzenleme Modalı
  function openEditPlanModal(plan) {
    if (!plan) return Promise.resolve(false);
    
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal active';
      modal.style.zIndex = '99999';
      
      const content = document.createElement('div');
      content.className = 'modal-content';
      content.style.maxWidth = '460px';
      content.style.borderRadius = 'var(--radius-lg)';
      content.style.overflow = 'hidden';
      content.style.boxShadow = 'var(--shadow-xl)';
      content.style.border = '1px solid var(--border-color)';
      content.style.backgroundColor = 'var(--bg-secondary)';
      
      content.innerHTML = `
        <div class="modal-header" style="background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1)); padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div style="width: 34px; height: 34px; border-radius: 8px; background: var(--primary); display: flex; align-items: center; justify-content: center; color: white;">
              <i data-lucide="edit-3" style="width: 18px; height: 18px;"></i>
            </div>
            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">Plan Bilgilerini Düzenle</h3>
          </div>
          <button class="btn-close-edit-plan" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: var(--text-secondary); line-height: 1;">&times;</button>
        </div>
        <div class="modal-body" style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.35rem;">Ders Adı *</label>
            <input type="text" id="edit-plan-course-name" class="form-control" style="width: 100%; box-sizing: border-box; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);" value="${escapeHtml(plan.courseName || plan.title || '')}" placeholder="Örn: Fen Bilimleri">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.35rem;">Sınıf / Şube</label>
              <input type="text" id="edit-plan-class-name" class="form-control" style="width: 100%; box-sizing: border-box; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);" value="${escapeHtml(plan.className || '')}" placeholder="Örn: 4-A">
            </div>
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.35rem;">Eğitim Yılı</label>
              <input type="text" id="edit-plan-edu-year" class="form-control" style="width: 100%; box-sizing: border-box; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);" value="${escapeHtml(plan.educationYear || '2025-2026')}" placeholder="2025-2026">
            </div>
          </div>
        </div>
        <div class="modal-footer" style="padding: 1rem 1.5rem; background: var(--bg-primary); border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button class="btn btn-secondary btn-cancel-edit-plan" style="font-size: 0.85rem; padding: 0.5rem 1rem;">İptal</button>
          <button class="btn btn-primary btn-save-edit-plan" style="font-size: 0.85rem; padding: 0.5rem 1.25rem; display: flex; align-items: center; gap: 0.4rem; font-weight: 600;">
            <i data-lucide="check" style="width: 16px; height: 16px;"></i> Kaydet
          </button>
        </div>
      `;
      
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      if (window.safeCreateIcons) window.safeCreateIcons();
      
      const inputCourse = modal.querySelector('#edit-plan-course-name');
      const inputClass = modal.querySelector('#edit-plan-class-name');
      const inputYear = modal.querySelector('#edit-plan-edu-year');
      
      setTimeout(() => {
        if (inputCourse) {
          inputCourse.focus();
          inputCourse.select();
        }
      }, 50);
      
      const cleanup = (saved) => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 200);
        resolve(saved);
      };
      
      modal.querySelector('.btn-close-edit-plan').onclick = () => cleanup(false);
      modal.querySelector('.btn-cancel-edit-plan').onclick = () => cleanup(false);
      
      modal.querySelector('.btn-save-edit-plan').onclick = () => {
        const courseVal = inputCourse.value.trim();
        const classVal = inputClass.value.trim();
        const yearVal = inputYear.value.trim();
        
        if (!courseVal) {
          if (toastCallbackFn) toastCallbackFn('Lütfen bir ders adı girin.', 'warning');
          return;
        }
        
        const statePlan = stateManager.state.plans.find(p => p.id === plan.id);
        if (statePlan) {
          statePlan.courseName = courseVal;
          statePlan.className = classVal || 'Sınıf';
          statePlan.educationYear = yearVal || '2025-2026';
          statePlan.title = `${statePlan.className} - ${courseVal}`;
          stateManager.saveState();
          cleanup(true);
        } else {
          cleanup(false);
        }
      };
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) cleanup(false);
      });
    });
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
