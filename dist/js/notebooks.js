(() => {
  // DOM Elemanları
  let notebooksGridView = null;
  let notebookDetailView = null;
  let notebookGrid = null;
  let btnBackToNotebooks = null;
  let detailNotebookTitle = null;
  let notebookTypeBadge = null;
  let notebookTitleInput = null;
  let btnAddTopic = null;
  let topicList = null;
  let topicTitleInput = null;
  let notebookTextarea = null;
  let notebookEditorContainer = null;
  let btnAddImage = null;
  let notebookImageInput = null;

  let btnSaveNotebook = null;
  let btnDeleteNotebook = null;
  let btnAddNotebookTrigger = null;
  let modalNotebook = null;
  let formNotebook = null;
  let notebookTitleModalInput = null;
  let btnCancelNotebookModal = null;
  let btnCloseNotebookModal = null;
  let btnRedTitle = null;
  let notebookColorIndicator = null;
  let btnMathDropdownTrigger = null;
  let mathDropdownMenu = null;

  // Konu Menüsü Daraltma / Genişletme Değişkenleri
  let notebookTopicsSidebar = null;
  let btnToggleTopicsSidebar = null;
  let btnExpandTopicsSidebar = null;

  // Yapışkan not değişkenleri
  let btnAddStickyNote = null;
  let modalStickyNote = null;
  let formStickyNote = null;
  let btnCloseStickyNoteModal = null;
  let btnCancelStickyNoteModal = null;
  let stickyNoteText = null;

  // Madde imi ve numaralandırma değişkenleri
  let btnListDropdownTrigger = null;
  let listDropdownMenu = null;
  let listCustomNumberInput = null;
  let btnApplyItemNumber = null;

  // Tablo ekleme değişkenleri
  let btnAddTable = null;
  let modalTable = null;
  let formTable = null;
  let btnCloseTableModal = null;
  let btnCancelTableModal = null;
  let tableRowsInput = null;
  let tableColsInput = null;

  let btnPrintNotebook = null;
  let notebookPrintArea = null;

  // Punto Seçici Değişkenleri
  let notebookFontSizeSelect = null;
  let btnFontDecrease = null;
  let btnFontIncrease = null;
  const FONT_SIZE_LEVELS = ['small', 'normal', 'medium', 'large', 'xlarge'];

  let notebookPaperWrapper = null;

  // Konu Yan Menüsünü Daralt / Genişlet
  function setTopicsSidebarCollapsed(collapsed) {
    if (!notebookTopicsSidebar) return;
    notebookTopicsSidebar.classList.toggle('collapsed', collapsed);
    if (btnExpandTopicsSidebar) {
      btnExpandTopicsSidebar.style.display = collapsed ? 'flex' : 'none';
    }
    try {
      localStorage.setItem('sinif_asistani_topics_collapsed', collapsed ? 'true' : 'false');
    } catch (e) {}
    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    } else if (window.lucide) {
      window.lucide.createIcons();
    }
    adjustTopicTitleFontSize();
  }

  let currentNotebookId = null;
  let currentTopicId = null;
  let autoSaveTimeout = null;
  let isRedMode = false;
  let savedRange = null;
  let currentCoverPdfId = null;
  let currentOpenPdfId = null;
  let currentOpenPdfName = '';
  let currentOpenPdfUrl = null;
  let activePdfDoc = null;
  let activePdfTotalPages = 0;
  let activePdfScale = 1.25;
  let activePdfCurrentPage = 1;
  let activePdfScrollRatio = 0;
  let activePdfObserver = null;
  let activePdfPageSlots = [];
  let activePdfRenderedPages = new Map();
  let activePdfRenderSession = 0;
  let activePdfIsProgrammaticScroll = false;
  let activePdfScrollSaveTimer = null;
  let activePdfUsingJsViewer = false;

  // PDF.js Kitap Üzeri Çizim & İşaretleme Durumu
  let pdfDrawPaletteOpen = false;
  let pdfDrawTool = 'hand'; // 'hand' | 'line' | 'highlighter' | 'pen' | 'rect' | 'ellipse' | 'arrow' | 'eraser'
  let pdfDrawColor = '#ef4444';
  let pdfDrawSize = 4;
  let activePdfAnnotations = {}; // { [pageNum]: Array<Shape> }
  let activePdfUndoStack = [];
  let activePdfRedoStack = [];
  let pdfDrawInitialized = false;

  // Numaralı Liste Sürekliliği (Modül Seviyesi - Her yerden erişilebilir)
  function syncOrderedListContinuity() {
    if (!notebookTextarea) return;

    const topOls = Array.from(notebookTextarea.querySelectorAll('ol')).filter(ol => {
      return !ol.parentElement.closest('li') && !ol.parentElement.closest('ol') && !ol.parentElement.closest('ul');
    });

    if (topOls.length === 0) return;

    let currentGroupRunningCount = 0;

    for (let i = 0; i < topOls.length; i++) {
      const ol = topOls[i];
      const directItems = Array.from(ol.children).filter(child => child.tagName === 'LI');
      const itemCount = directItems.length;
      const listMode = ol.getAttribute('data-list-mode'); // 'restart' | 'continue' | null

      if (i === 0) {
        ol.removeAttribute('start');
        currentGroupRunningCount = itemCount;
        continue;
      }

      const prevOl = topOls[i - 1];
      let shouldContinue = false;

      if (listMode === 'restart') {
        shouldContinue = false;
      } else if (listMode === 'continue') {
        shouldContinue = true;
      } else {
        // Otomatik mod: prevOl ile ol arasındaki kardeş düğümleri incele
        let node = prevOl.nextSibling;
        let foundUl = false;
        let hasSignificantContent = false;

        while (node && node !== ol) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'UL') {
              foundUl = true;
            } else if (node.tagName === 'BR' || (node.tagName === 'DIV' && node.innerHTML.trim() === '<br>')) {
              // Boş satır / boş div
            } else {
              const text = node.textContent ? node.textContent.trim() : '';
              if (text.length > 0) {
                hasSignificantContent = true;
              }
            }
          } else if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent && node.textContent.trim().length > 0) {
              hasSignificantContent = true;
            }
          }
          node = node.nextSibling;
        }

        if (foundUl && !hasSignificantContent) {
          shouldContinue = true;
        } else {
          shouldContinue = false;
        }
      }

      if (shouldContinue && currentGroupRunningCount > 0) {
        ol.setAttribute('start', currentGroupRunningCount + 1);
        currentGroupRunningCount += itemCount;
      } else {
        ol.removeAttribute('start');
        currentGroupRunningCount = itemCount;
      }
    }
  }

  // Punto Uygulama ve Değiştirme Fonksiyonları
  const RESIZE_HANDLE_SVG = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="10 3 13 3 13 6"></polyline><polyline points="6 13 3 13 3 10"></polyline><line x1="13" y1="3" x2="9" y2="7"></line><line x1="3" y1="13" x2="7" y2="9"></line></svg>`;

  function getNotebookLineHeight() {
    if (!notebookTextarea) return 48;
    const val = parseInt(getComputedStyle(notebookTextarea).getPropertyValue('--nb-line-height'), 10);
    return val > 0 ? val : 48;
  }

  function syncImageLineAlignment(wrapper) {
    if (!wrapper || !notebookTextarea) return;
    const img = wrapper.querySelector('img');
    if (!img) return;
    const lineHeight = getNotebookLineHeight();
    const imgHeight = img.offsetHeight || img.getBoundingClientRect().height || 0;
    if (imgHeight <= 0) return;

    const topMargin = 4;
    const minPadding = 8;
    const rows = Math.max(1, Math.ceil((imgHeight + minPadding) / lineHeight));
    const totalSlotHeight = rows * lineHeight;
    const bottomMargin = Math.max(4, Math.round(totalSlotHeight - imgHeight - topMargin));

    wrapper.style.setProperty('margin-top', topMargin + 'px', 'important');
    wrapper.style.setProperty('margin-bottom', bottomMargin + 'px', 'important');
  }

  function syncAllNotebookImages() {
    if (!notebookTextarea) return;
    const wrappers = notebookTextarea.querySelectorAll('.notebook-image-wrapper');
    wrappers.forEach(wrapper => {
      wrapper.setAttribute('contenteditable', 'false');
      if (!wrapper.querySelector('.image-resize-handle')) {
        const resizeBtn = document.createElement('button');
        resizeBtn.className = 'image-resize-handle';
        resizeBtn.type = 'button';
        resizeBtn.title = 'Boyutlandırmak için sürükleyin';
        resizeBtn.innerHTML = RESIZE_HANDLE_SVG;
        wrapper.appendChild(resizeBtn);
      }
      const img = wrapper.querySelector('img');
      if (img) {
        if (img.complete && img.naturalHeight > 0) {
          syncImageLineAlignment(wrapper);
        } else {
          img.addEventListener('load', () => syncImageLineAlignment(wrapper), { once: true });
        }
      }
    });
  }

  function applyNotebookFontSize(sizeKey) {
    if (!FONT_SIZE_LEVELS.includes(sizeKey)) {
      sizeKey = 'normal';
    }
    if (notebookTextarea) {
      notebookTextarea.setAttribute('data-font-size', sizeKey);
    }
    if (notebookFontSizeSelect) {
      notebookFontSizeSelect.value = sizeKey;
    }
    try {
      localStorage.setItem('sinif_asistani_notebook_fontsize', sizeKey);
    } catch (e) {}
    syncAllNotebookImages();
  }

  function changeNotebookFontSizeStep(delta) {
    const current = (notebookTextarea && notebookTextarea.getAttribute('data-font-size')) ||
                    localStorage.getItem('sinif_asistani_notebook_fontsize') || 'normal';
    let idx = FONT_SIZE_LEVELS.indexOf(current);
    if (idx === -1) idx = 1; // normal
    let newIdx = idx + delta;
    if (newIdx < 0) newIdx = 0;
    if (newIdx >= FONT_SIZE_LEVELS.length) newIdx = FONT_SIZE_LEVELS.length - 1;
    applyNotebookFontSize(FONT_SIZE_LEVELS[newIdx]);
  }

  // Modülü başlat
  function init() {
    notebooksGridView = document.getElementById('notebooks-grid-view');
    notebookDetailView = document.getElementById('notebook-detail-view');
    notebookGrid = document.getElementById('notebook-grid');
    btnBackToNotebooks = document.getElementById('btn-back-to-notebooks');
    detailNotebookTitle = document.getElementById('detail-notebook-title');
    notebookTypeBadge = document.getElementById('notebook-type-badge');
    notebookTitleInput = document.getElementById('notebook-title-input');
    btnAddTopic = document.getElementById('btn-add-topic');
    topicList = document.getElementById('topic-list');
    topicTitleInput = document.getElementById('topic-title-input');
    notebookTextarea = document.getElementById('notebook-textarea');
    notebookEditorContainer = document.getElementById('notebook-editor-container');
    btnAddImage = document.getElementById('btn-add-image');
    notebookImageInput = document.getElementById('notebook-image-input');

    btnSaveNotebook = document.getElementById('btn-save-notebook');
    btnDeleteNotebook = document.getElementById('btn-delete-notebook');
    btnAddNotebookTrigger = document.getElementById('btn-add-notebook-trigger');
    modalNotebook = document.getElementById('modal-notebook');
    formNotebook = document.getElementById('form-notebook');
    notebookTitleModalInput = document.getElementById('notebook-title');
    btnCancelNotebookModal = document.getElementById('btn-cancel-notebook-modal');
    btnCloseNotebookModal = document.getElementById('btn-close-notebook-modal');
    btnRedTitle = document.getElementById('btn-red-title');
    notebookColorIndicator = document.getElementById('notebook-color-indicator');
    btnMathDropdownTrigger = document.getElementById('btn-math-dropdown-trigger');
    mathDropdownMenu = document.getElementById('math-dropdown-menu');

    btnAddStickyNote = document.getElementById('btn-add-sticky-note');
    modalStickyNote = document.getElementById('modal-sticky-note');
    formStickyNote = document.getElementById('form-sticky-note');
    btnCloseStickyNoteModal = document.getElementById('btn-close-sticky-note-modal');
    btnCancelStickyNoteModal = document.getElementById('btn-cancel-sticky-note-modal');
    stickyNoteText = document.getElementById('sticky-note-text');

    btnListDropdownTrigger = document.getElementById('btn-list-dropdown-trigger');
    listDropdownMenu = document.getElementById('list-dropdown-menu');
    listCustomNumberInput = document.getElementById('list-custom-number-input');
    btnApplyItemNumber = document.getElementById('btn-apply-item-number');

    btnAddTable = document.getElementById('btn-add-table');
    modalTable = document.getElementById('modal-table');
    formTable = document.getElementById('form-table');
    btnCloseTableModal = document.getElementById('btn-close-table-modal');
    btnCancelTableModal = document.getElementById('btn-cancel-table-modal');
    tableRowsInput = document.getElementById('table-rows');
    tableColsInput = document.getElementById('table-cols');

    btnPrintNotebook = document.getElementById('btn-print-notebook');
    notebookPrintArea = document.getElementById('notebook-print-area');

    function handlePrintNotebook() {
      if (!notebookPrintArea || !notebookTextarea) return;
      const title = topicTitleInput ? topicTitleInput.value.trim() : '';
      const content = notebookTextarea.innerHTML;

      notebookPrintArea.innerHTML = `
        <div class="notebook-print-sheet">
          ${title ? `<div class="notebook-print-title">${escapeHTML(title)}</div>` : ''}
          <div class="notebook-print-content">${content}</div>
        </div>
      `;

      document.body.classList.add('print-notebook');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('print-notebook');
      }, 1200);
    }

    if (btnPrintNotebook) {
      btnPrintNotebook.addEventListener('click', (e) => {
        e.preventDefault();
        handlePrintNotebook();
      });
    }

    // Punto Seçici Elemanları
    notebookFontSizeSelect = document.getElementById('notebook-font-size-select');
    btnFontDecrease = document.getElementById('btn-font-decrease');
    btnFontIncrease = document.getElementById('btn-font-increase');

    if (notebookFontSizeSelect) {
      notebookFontSizeSelect.addEventListener('change', (e) => {
        applyNotebookFontSize(e.target.value);
      });
    }
    if (btnFontDecrease) {
      btnFontDecrease.addEventListener('click', (e) => {
        e.preventDefault();
        changeNotebookFontSizeStep(-1);
      });
    }
    if (btnFontIncrease) {
      btnFontIncrease.addEventListener('click', (e) => {
        e.preventDefault();
        changeNotebookFontSizeStep(1);
      });
    }

    // Konu Menüsü Daraltma / Genişletme
    notebookTopicsSidebar = document.getElementById('notebook-topics-sidebar');
    btnToggleTopicsSidebar = document.getElementById('btn-toggle-topics-sidebar');
    btnExpandTopicsSidebar = document.getElementById('btn-expand-topics-sidebar');

    if (btnToggleTopicsSidebar) {
      btnToggleTopicsSidebar.addEventListener('click', (e) => {
        e.preventDefault();
        setTopicsSidebarCollapsed(true);
      });
    }

    if (btnExpandTopicsSidebar) {
      btnExpandTopicsSidebar.addEventListener('click', (e) => {
        e.preventDefault();
        setTopicsSidebarCollapsed(false);
      });
    }

    try {
      const isTopicsCollapsed = localStorage.getItem('sinif_asistani_topics_collapsed') === 'true';
      if (isTopicsCollapsed) {
        setTopicsSidebarCollapsed(true);
      }
    } catch (e) {}

    notebookPaperWrapper = document.getElementById('notebook-paper-wrapper');

    // Güvenlik Kontrolü: Kritik DOM elemanları mevcut değilse kurulumu atla
    if (!notebookGrid || !modalNotebook || !formNotebook) {
      return;
    }

    function updateSavedRange() {
      if (window.getSelection) {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          let container = range.commonAncestorContainer;
          if (container.nodeType === 3) {
            container = container.parentNode;
          }
          let isInside = false;
          let node = container;
          while (node) {
            if (node === notebookTextarea) {
              isInside = true;
              break;
            }
            node = node.parentNode;
          }
          if (isInside) {
            savedRange = range.cloneRange();
          }
        }
      }
    }

    // Olay Dinleyicileri
    const btnMaterialsNotebooks = document.getElementById('tab-btn-materials-notebooks');
    const btnMaterialsTextbooks = document.getElementById('tab-btn-materials-textbooks');
    const sectionMaterialsNotebooks = document.getElementById('materials-notebooks-section');
    const sectionMaterialsTextbooks = document.getElementById('materials-textbooks-section');

    if (btnMaterialsNotebooks && btnMaterialsTextbooks) {
      btnMaterialsNotebooks.addEventListener('click', () => {
        btnMaterialsNotebooks.classList.add('active');
        btnMaterialsTextbooks.classList.remove('active');
        if (sectionMaterialsNotebooks) sectionMaterialsNotebooks.style.display = 'block';
        if (sectionMaterialsTextbooks) sectionMaterialsTextbooks.style.display = 'none';
        
        window.renderNotebooks();
      });

      btnMaterialsTextbooks.addEventListener('click', () => {
        btnMaterialsNotebooks.classList.remove('active');
        btnMaterialsTextbooks.classList.add('active');
        if (sectionMaterialsNotebooks) sectionMaterialsNotebooks.style.display = 'none';
        if (sectionMaterialsTextbooks) sectionMaterialsTextbooks.style.display = 'block';
        
        renderTextbooksList();
      });
    }

    const btnUploadPdfTrigger = document.getElementById('btn-upload-pdf-trigger');
    const inputUploadPdfFile = document.getElementById('input-upload-pdf-file');
    
    if (btnUploadPdfTrigger && inputUploadPdfFile) {
      btnUploadPdfTrigger.addEventListener('click', () => {
        inputUploadPdfFile.click();
      });
      
      inputUploadPdfFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/pdf') {
          if (window.showToast) window.showToast('Lütfen sadece PDF dosyası yükleyin!', 'danger');
          e.target.value = '';
          return;
        }
        
        const id = 'pdf_' + Date.now();
        try {
          if (window.showToast) window.showToast('Kitap yükleniyor, lütfen bekleyin...', 'info');
          await savePDF(id, file.name, file);
          if (window.showToast) window.showToast('Kitap başarıyla yüklendi.', 'success');
          renderTextbooksList();
        } catch (err) {
          console.error("PDF upload error:", err);
          if (window.showToast) window.showToast('Kitap yüklenirken hata oluştu!', 'danger');
        }
        e.target.value = '';
      });
    }

    const inputUploadCoverFile = document.getElementById('input-upload-cover-file');
    if (inputUploadCoverFile) {
      inputUploadCoverFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
          if (window.showToast) window.showToast('Lütfen geçerli bir görsel dosyası seçin!', 'danger');
          e.target.value = '';
          return;
        }
        
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Data = event.target.result;
          try {
            const pdfRecord = await getPDF(currentCoverPdfId);
            if (pdfRecord) {
              pdfRecord.cover = base64Data;
              await savePDFRecord(pdfRecord);
              if (window.showToast) window.showToast('Kitap kapak resmi güncellendi.', 'success');
              renderTextbooksList();
            } else {
              if (window.showToast) window.showToast('Kitap kaydı bulunamadı!', 'danger');
            }
          } catch (err) {
            console.error("Cover upload error:", err);
            if (window.showToast) window.showToast('Kapak resmi güncellenirken hata oluştu!', 'danger');
          }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
      });
    }

    const pdfViewerPageInput = document.getElementById('pdf-viewer-page-input');
    const btnClosePdfViewer = document.getElementById('btn-close-pdf-viewer');
    if (btnClosePdfViewer) {
      btnClosePdfViewer.addEventListener('click', () => {
        if (currentOpenPdfId) {
          persistActivePdfPosition(true);
        }
        if (pdfLiveInterval) {
          clearInterval(pdfLiveInterval);
          pdfLiveInterval = null;
        }
        cleanupPdfJsViewer();
        const overlay = document.getElementById('pdf-viewer-overlay');
        const iframe = document.getElementById('pdf-viewer-iframe');
        if (overlay) overlay.style.display = 'none';
        if (iframe) {
          iframe.src = '';
        }
        if (currentOpenPdfUrl) {
          URL.revokeObjectURL(currentOpenPdfUrl);
          currentOpenPdfUrl = null;
        }
        currentOpenPdfId = null;
        currentOpenPdfName = '';
        renderTextbooksList();
      });
    }

    if (pdfViewerPageInput) {
      pdfViewerPageInput.addEventListener('change', async (e) => {
        let pageNum = parseInt(e.target.value, 10) || 1;
        if (pageNum < 1) pageNum = 1;
        if (activePdfUsingJsViewer && activePdfTotalPages > 0 && pageNum > activePdfTotalPages) {
          pageNum = activePdfTotalPages;
        }
        e.target.value = pageNum;
        
        if (currentOpenPdfId) {
          activePdfCurrentPage = pageNum;
          activePdfScrollRatio = 0;
          if (activePdfUsingJsViewer) {
            scrollToPdfPage(pageNum, 0);
            saveCurrentPdfPageState(currentOpenPdfId, pageNum, {
              scrollRatio: 0,
              scale: activePdfScale,
              name: currentOpenPdfName,
              immediate: true
            });
          } else {
            saveCurrentPdfPageState(currentOpenPdfId, pageNum, {
              scrollRatio: 0,
              scale: activePdfScale,
              name: currentOpenPdfName,
              immediate: true
            });
            const iframe = document.getElementById('pdf-viewer-iframe');
            if (iframe && currentOpenPdfUrl) {
              iframe.src = currentOpenPdfUrl + '#page=' + pageNum;
            }
          }
        }
      });
    }

    // Uygulama kapatıldığında, sekme gizlendiğinde veya sayfa yenilendiğinde son konumu garantiye al
    const handleAppExitPdfSave = () => {
      if (currentOpenPdfId) {
        persistActivePdfPosition(true);
        if (window.stateManager && typeof window.stateManager.flushPendingSave === 'function') {
          try { window.stateManager.flushPendingSave(); } catch (e) {}
        }
      }
    };
    window.addEventListener('beforeunload', handleAppExitPdfSave);
    window.addEventListener('pagehide', handleAppExitPdfSave);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleAppExitPdfSave();
      }
    });

    const btnPdfPrevPage = document.getElementById('btn-pdf-prev-page');
    const btnPdfNextPage = document.getElementById('btn-pdf-next-page');
    if (btnPdfPrevPage && btnPdfNextPage && pdfViewerPageInput) {
      btnPdfPrevPage.addEventListener('click', () => {
        let pageNum = parseInt(pdfViewerPageInput.value, 10) || 1;
        if (pageNum > 1) {
          pageNum--;
          pdfViewerPageInput.value = pageNum;
          pdfViewerPageInput.dispatchEvent(new Event('change'));
        }
      });

      btnPdfNextPage.addEventListener('click', () => {
        let pageNum = parseInt(pdfViewerPageInput.value, 10) || 1;
        if (!activePdfUsingJsViewer || !activePdfTotalPages || pageNum < activePdfTotalPages) {
          pageNum++;
          pdfViewerPageInput.value = pageNum;
          pdfViewerPageInput.dispatchEvent(new Event('change'));
        }
      });
    }

    // PDF.js Yakınlaştırma (Zoom) Kontrolleri
    const btnPdfZoomOut = document.getElementById('btn-pdf-zoom-out');
    const btnPdfZoomIn = document.getElementById('btn-pdf-zoom-in');
    const btnPdfZoomFit = document.getElementById('btn-pdf-zoom-fit');
    if (btnPdfZoomOut) {
      btnPdfZoomOut.addEventListener('click', () => {
        if (!activePdfUsingJsViewer || !activePdfDoc) return;
        const nextScale = Math.max(0.5, Math.round((activePdfScale - 0.15) * 100) / 100);
        changePdfJsZoom(nextScale);
      });
    }
    if (btnPdfZoomIn) {
      btnPdfZoomIn.addEventListener('click', () => {
        if (!activePdfUsingJsViewer || !activePdfDoc) return;
        const nextScale = Math.min(3.0, Math.round((activePdfScale + 0.15) * 100) / 100);
        changePdfJsZoom(nextScale);
      });
    }
    if (btnPdfZoomFit) {
      btnPdfZoomFit.addEventListener('click', async () => {
        if (!activePdfUsingJsViewer || !activePdfDoc) return;
        try {
          const container = document.getElementById('pdf-viewer-canvas-container');
          const p = await activePdfDoc.getPage(activePdfCurrentPage || 1);
          const baseVp = p.getViewport({ scale: 1 });
          const availW = Math.max(320, (container ? container.clientWidth : window.innerWidth) - 48);
          const fitScale = Math.max(0.5, Math.min(2.5, Math.round((availW / baseVp.width) * 100) / 100));
          changePdfJsZoom(fitScale);
        } catch (e) {}
      });
    }

    if (btnAddNotebookTrigger) {
      btnAddNotebookTrigger.addEventListener('click', openAddModal);
    }

    // Modal Kapatma Olayları
    const closeModalFn = () => {
      if (modalNotebook) modalNotebook.classList.remove('active');
    };
    if (btnCancelNotebookModal) btnCancelNotebookModal.addEventListener('click', closeModalFn);
    if (btnCloseNotebookModal) btnCloseNotebookModal.addEventListener('click', closeModalFn);
    
    // Yapışkan Not Modalı Kapatma Olayları
    const closeStickyNoteModalFn = () => {
      if (modalStickyNote) modalStickyNote.classList.remove('active');
    };
    if (btnCancelStickyNoteModal) btnCancelStickyNoteModal.addEventListener('click', closeStickyNoteModalFn);
    if (btnCloseStickyNoteModal) btnCloseStickyNoteModal.addEventListener('click', closeStickyNoteModalFn);

    // Yapışkan Not Buton Tıklamaları
    const openStickyNoteModalFn = () => {
      if (stickyNoteText) stickyNoteText.value = '';
      if (formStickyNote) {
        const defaultColor = formStickyNote.querySelector('input[name="sticky-color"][value="yellow"]');
        const defaultType = formStickyNote.querySelector('input[name="sticky-type"][value="info"]');
        if (defaultColor) defaultColor.checked = true;
        if (defaultType) defaultType.checked = true;
      }
      if (modalStickyNote) modalStickyNote.classList.add('active');
      setTimeout(() => {
        if (stickyNoteText) stickyNoteText.focus();
      }, 50);
    };

    if (btnAddStickyNote) {
      btnAddStickyNote.addEventListener('mousedown', updateSavedRange);
      btnAddStickyNote.addEventListener('touchstart', updateSavedRange, { passive: true });
      btnAddStickyNote.addEventListener('click', openStickyNoteModalFn);
    }

    if (formStickyNote) {
      formStickyNote.addEventListener('submit', handleAddStickyNoteSubmit);
    }

    // Madde İmi ve Numaralandırma Fonksiyonları
    const insertNotebookListItem = (type, val) => {
      if (!notebookTextarea) return;
      notebookTextarea.focus();

      const sel = window.getSelection();
      if (savedRange && sel) {
        try {
          sel.removeAllRanges();
          sel.addRange(savedRange);
        } catch (e) {}
      }

      let range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : null;
      let currentBlock = null;

      if (range) {
        let node = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        while (node && node !== notebookTextarea) {
          if (node.parentNode === notebookTextarea) {
            currentBlock = node;
            break;
          }
          node = node.parentNode;
        }
      }

      const isBullet = (type === 'bullet');
      const lineClass = isBullet ? 'notebook-bullet-line' : 'notebook-numbered-line';
      const formattedMarker = (val || (isBullet ? '•' : '1.')).trim();
      const indentStyle = isBullet ? 'padding-left: 32px !important;' : 'padding-left: 0px !important;';

      const isBlockEmpty = currentBlock && (
        currentBlock.textContent.trim() === '' &&
        (currentBlock.innerHTML === '<br>' || currentBlock.innerHTML === '' || currentBlock.querySelector('br'))
      );

      let targetLine = null;
      if (currentBlock && isBlockEmpty) {
        currentBlock.className = lineClass;
        currentBlock.setAttribute('data-list-type', type);
        currentBlock.setAttribute('data-marker', formattedMarker);
        currentBlock.style.cssText = `${indentStyle} min-height: var(--nb-line-height); line-height: var(--nb-line-height); margin: 0;`;
        currentBlock.innerHTML = `<strong class="notebook-item-marker">${escapeHTML(formattedMarker)}</strong>&nbsp;`;
        targetLine = currentBlock;
      } else {
        const newLine = document.createElement('div');
        newLine.className = lineClass;
        newLine.setAttribute('data-list-type', type);
        newLine.setAttribute('data-marker', formattedMarker);
        newLine.style.cssText = `${indentStyle} min-height: var(--nb-line-height); line-height: var(--nb-line-height); margin: 0;`;
        newLine.innerHTML = `<strong class="notebook-item-marker">${escapeHTML(formattedMarker)}</strong>&nbsp;`;

        if (currentBlock && currentBlock.parentNode === notebookTextarea) {
          if (currentBlock.nextSibling) {
            notebookTextarea.insertBefore(newLine, currentBlock.nextSibling);
          } else {
            notebookTextarea.appendChild(newLine);
          }
        } else {
          notebookTextarea.appendChild(newLine);
        }
        targetLine = newLine;
      }

      if (targetLine && sel) {
        const newRange = document.createRange();
        newRange.selectNodeContents(targetLine);
        newRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRange = newRange.cloneRange();
      }

      if (listDropdownMenu) listDropdownMenu.style.display = 'none';

      triggerAutoSave();
    };

    const applyCustomNumber = (inputEl) => {
      const val = (inputEl && inputEl.value.trim()) ? inputEl.value.trim() : '1.';
      insertNotebookListItem('number', val);

      // Otomatik sonraki madde numarasını hesapla ve kutucuklara yaz
      const numMatch = val.match(/^(\d+)([\.\)\-:]?)$/);
      const alphaMatch = val.match(/^([A-Za-z])([\.\)\-:]?)$/);
      let nextVal = '';
      if (numMatch) {
        nextVal = `${parseInt(numMatch[1], 10) + 1}${numMatch[2] || '.'}`;
      } else if (alphaMatch) {
        nextVal = `${String.fromCharCode(alphaMatch[1].charCodeAt(0) + 1)}${alphaMatch[2] || '.'}`;
      }
      if (nextVal) {
        if (listCustomNumberInput) listCustomNumberInput.value = nextVal;
      }
    };

    if (btnListDropdownTrigger && listDropdownMenu) {
      btnListDropdownTrigger.addEventListener('mousedown', () => {
        updateSavedRange();
      });
      btnListDropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShown = listDropdownMenu.style.display === 'block';
        if (listDropdownMenu) listDropdownMenu.style.display = 'none';
        if (mathDropdownMenu) mathDropdownMenu.style.display = 'none';

        if (!isShown) {
          listDropdownMenu.style.display = 'block';
          setTimeout(() => {
            if (listCustomNumberInput) {
              listCustomNumberInput.focus();
              listCustomNumberInput.select();
            }
          }, 50);
        }
      });
    }

    if (btnApplyItemNumber) {
      btnApplyItemNumber.addEventListener('click', (e) => {
        e.preventDefault();
        applyCustomNumber(listCustomNumberInput);
      });
    }

    if (listCustomNumberInput) {
      listCustomNumberInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyCustomNumber(listCustomNumberInput);
        }
      });
    }

    // Hızlı madde numarası seçimi butonları (Olay Delegasyonu)
    document.addEventListener('click', (e) => {
      const quickNumBtn = e.target.closest('.btn-list-quick-num');
      if (quickNumBtn) {
        e.preventDefault();
        e.stopPropagation();
        const val = quickNumBtn.getAttribute('data-val') || '1.';
        if (listCustomNumberInput) listCustomNumberInput.value = val;
        insertNotebookListItem('number', val);
      }
    });

    // Madde imi seçimi butonları (Olay Delegasyonu)
    document.addEventListener('click', (e) => {
      const bulletBtn = e.target.closest('.btn-list-bullet-option');
      if (bulletBtn) {
        e.preventDefault();
        e.stopPropagation();
        const bulletSymbol = bulletBtn.getAttribute('data-bullet') || '•';
        insertNotebookListItem('bullet', bulletSymbol);
      }
    });

    // Defter Liste Sağ Tık Menüsü (Context Menu)
    if (notebookTextarea) {
      notebookTextarea.addEventListener('contextmenu', (e) => {
        const targetOl = e.target.closest('ol');
        if (!targetOl) return;

        e.preventDefault();

        const oldMenu = document.getElementById('notebook-list-context-menu');
        if (oldMenu) oldMenu.remove();

        const menu = document.createElement('div');
        menu.id = 'notebook-list-context-menu';
        menu.className = 'notebook-context-menu';
        menu.style.position = 'fixed';
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;
        menu.style.zIndex = '10060';

        const currentMode = targetOl.getAttribute('data-list-mode');

        menu.innerHTML = `
          <div class="context-menu-item ${currentMode === 'restart' ? 'active' : ''}" data-action="restart">
            <i data-lucide="rotate-ccw" style="width: 14px; height: 14px;"></i>
            <span>1'den Yeniden Başlat</span>
          </div>
          <div class="context-menu-item ${currentMode === 'continue' ? 'active' : ''}" data-action="continue">
            <i data-lucide="arrow-down-right" style="width: 14px; height: 14px;"></i>
            <span>Önceki Listeden Devam Et</span>
          </div>
          <div class="context-menu-divider"></div>
          <div class="context-menu-item ${!currentMode ? 'active' : ''}" data-action="auto">
            <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>
            <span>Otomatik Belirle</span>
          </div>
        `;

        document.body.appendChild(menu);
        if (window.safeCreateIcons) window.safeCreateIcons();

        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth - 10) {
          menu.style.left = `${window.innerWidth - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight - 10) {
          menu.style.top = `${window.innerHeight - rect.height - 10}px`;
        }

        menu.querySelectorAll('.context-menu-item').forEach(item => {
          item.addEventListener('click', () => {
            const action = item.getAttribute('data-action');
            if (action === 'restart') {
              targetOl.setAttribute('data-list-mode', 'restart');
              if (window.showToast) window.showToast('Numaralandırma 1\'den başlatıldı.', 'success');
            } else if (action === 'continue') {
              targetOl.setAttribute('data-list-mode', 'continue');
              if (window.showToast) window.showToast('Önceki listeden devam ettirildi.', 'success');
            } else if (action === 'auto') {
              targetOl.removeAttribute('data-list-mode');
              if (window.showToast) window.showToast('Otomatik liste sıralaması uygulandı.', 'info');
            }
            syncOrderedListContinuity();
            triggerAutoSave();
            menu.remove();
          });
        });

        const closeMenu = (ev) => {
          if (!ev.target.closest('#notebook-list-context-menu')) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
          }
        };
        setTimeout(() => {
          document.addEventListener('click', closeMenu);
        }, 50);
      });
    }

    // Tablo Modalı Kapatma Olayları
    const closeTableModalFn = () => {
      if (modalTable) modalTable.classList.remove('active');
    };
    if (btnCancelTableModal) btnCancelTableModal.addEventListener('click', closeTableModalFn);
    if (btnCloseTableModal) btnCloseTableModal.addEventListener('click', closeTableModalFn);

    // Tablo Ekle Buton Tıklamaları
    const openTableModalFn = () => {
      if (tableRowsInput) tableRowsInput.value = '3';
      if (tableColsInput) tableColsInput.value = '3';
      if (modalTable) modalTable.classList.add('active');
      setTimeout(() => {
        if (tableRowsInput) tableRowsInput.focus();
      }, 50);
    };

    if (btnAddTable) {
      btnAddTable.addEventListener('mousedown', updateSavedRange);
      btnAddTable.addEventListener('touchstart', updateSavedRange, { passive: true });
      btnAddTable.addEventListener('click', openTableModalFn);
    }

    if (formTable) {
      formTable.addEventListener('submit', handleAddTableSubmit);
    }
    
    // Modal Tipi Kart Seçimleri
    const typeCards = modalNotebook.querySelectorAll('.notebook-type-card');
    typeCards.forEach(card => {
      card.addEventListener('click', function() {
        typeCards.forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        const radio = this.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });

    // Defter Form Kayıt Gönderimi
    formNotebook.addEventListener('submit', handleAddNotebookSubmit);

    // Geri Dön Butonu
    if (btnBackToNotebooks) {
      btnBackToNotebooks.addEventListener('click', showGridView);
    }

    // Konu Ekle Butonu
    if (btnAddTopic) {
      btnAddTopic.addEventListener('click', handleAddTopicClick);
    }

    // Manuel Kaydet Butonu
    if (btnSaveNotebook) {
      btnSaveNotebook.addEventListener('click', saveActiveNotebookManual);
    }

    // Sil Butonu
    if (btnDeleteNotebook) {
      btnDeleteNotebook.addEventListener('click', deleteActiveNotebook);
    }

    // Görsel Ekle Butonları
    if (btnAddImage && notebookImageInput) {
      btnAddImage.addEventListener('mousedown', updateSavedRange);
      btnAddImage.addEventListener('touchstart', updateSavedRange, { passive: true });
      btnAddImage.addEventListener('click', () => {
        updateSavedRange();
        notebookImageInput.click();
      });
      notebookImageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleImageUpload(e.target.files[0]);
          notebookImageInput.value = ''; // Reset value to allow uploading same file
        }
      });
    }

    // Editör Değişimlerinde Otomatik Kaydet (Debounced)
    if (notebookTextarea) {
      notebookTextarea.addEventListener('input', () => {
        syncOrderedListContinuity();
        triggerAutoSave();
      });

      // Tab / Shift+Tab ile girintileme ve liste desteği
      notebookTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          if (e.shiftKey) {
            document.execCommand('outdent', false, null);
          } else {
            document.execCommand('indent', false, null);
          }
          syncOrderedListContinuity();
          triggerAutoSave();
          return;
        }

        // Madde imi ve madde numarası satırlarında Enter tuşu davranışı
        if (e.key === 'Enter' && !e.shiftKey) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            let node = sel.getRangeAt(0).startContainer;
            if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
            const listLine = node ? node.closest('.notebook-bullet-line, .notebook-numbered-line') : null;
            if (listLine) {
              e.preventDefault();

              const markerEl = listLine.querySelector('.notebook-item-marker');
              const markerText = markerEl ? markerEl.textContent.trim() : (listLine.getAttribute('data-marker') || '');
              const textWithoutMarker = listLine.textContent.replace(markerText, '').replace(/[\u200B-\u200D\uFEFF\s\u00A0]/g, '').trim();

              // Eğer satırda sadece madde imi/numarası varsa ve metin yazılmamışsa liste modundan çık
              if (!textWithoutMarker) {
                listLine.className = '';
                listLine.removeAttribute('data-list-type');
                listLine.removeAttribute('data-marker');
                listLine.style.cssText = 'min-height: var(--nb-line-height); line-height: var(--nb-line-height); padding-left: 0px; margin: 0;';
                listLine.innerHTML = '<br>';

                const newRange = document.createRange();
                newRange.setStart(listLine, 0);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                savedRange = newRange.cloneRange();
                triggerAutoSave();
                return;
              }

              // Yeni liste satırı oluştur (Madde imi veya artırılmış madde numarası)
              const isBullet = listLine.classList.contains('notebook-bullet-line');
              let nextMarker = markerText;
              if (!isBullet) {
                const numMatch = markerText.match(/^(\d+)([\.\)\-:]?)$/);
                const alphaMatch = markerText.match(/^([A-Za-z])([\.\)\-:]?)$/);
                if (numMatch) {
                  const nextNum = parseInt(numMatch[1], 10) + 1;
                  nextMarker = `${nextNum}${numMatch[2] || '.'}`;
                } else if (alphaMatch) {
                  const nextChar = String.fromCharCode(alphaMatch[1].charCodeAt(0) + 1);
                  nextMarker = `${nextChar}${alphaMatch[2] || '.'}`;
                }
              }

              const newLine = document.createElement('div');
              newLine.className = isBullet ? 'notebook-bullet-line' : 'notebook-numbered-line';
              newLine.setAttribute('data-list-type', isBullet ? 'bullet' : 'number');
              newLine.setAttribute('data-marker', nextMarker);
              const indentStyle = isBullet ? 'padding-left: 32px !important;' : 'padding-left: 0px !important;';
              newLine.style.cssText = `${indentStyle} min-height: var(--nb-line-height); line-height: var(--nb-line-height); margin: 0;`;
              newLine.innerHTML = `<strong class="notebook-item-marker">${escapeHTML(nextMarker)}</strong>&nbsp;`;

              if (listLine.nextSibling) {
                listLine.parentNode.insertBefore(newLine, listLine.nextSibling);
              } else {
                listLine.parentNode.appendChild(newLine);
              }

              const newRange = document.createRange();
              newRange.selectNodeContents(newLine);
              newRange.collapse(false);
              sel.removeAllRanges();
              sel.addRange(newRange);
              savedRange = newRange.cloneRange();
              triggerAutoSave();
              return;
            }
          }
        }

        // Boş liste satırında Backspace ile normal satıra dönme
        if (e.key === 'Backspace') {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            let node = sel.getRangeAt(0).startContainer;
            if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
            const listLine = node ? node.closest('.notebook-bullet-line, .notebook-numbered-line') : null;
            if (listLine) {
              const markerEl = listLine.querySelector('.notebook-item-marker');
              const markerText = markerEl ? markerEl.textContent.trim() : (listLine.getAttribute('data-marker') || '');
              const textWithoutMarker = listLine.textContent.replace(markerText, '').replace(/[\u200B-\u200D\uFEFF\s\u00A0]/g, '').trim();
              if (!textWithoutMarker) {
                e.preventDefault();
                listLine.className = '';
                listLine.removeAttribute('data-list-type');
                listLine.removeAttribute('data-marker');
                listLine.style.cssText = 'min-height: var(--nb-line-height); line-height: var(--nb-line-height); padding-left: 0px; margin: 0;';
                listLine.innerHTML = '<br>';

                const newRange = document.createRange();
                newRange.setStart(listLine, 0);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                savedRange = newRange.cloneRange();
                triggerAutoSave();
                return;
              }
            }
          }
        }
      });

      notebookTextarea.addEventListener('keyup', updateSavedRange);
      notebookTextarea.addEventListener('mouseup', updateSavedRange);
      notebookTextarea.addEventListener('touchend', updateSavedRange, { passive: true });
      document.addEventListener('selectionchange', () => {
        if (document.activeElement === notebookTextarea) {
          updateSavedRange();
        }
      });

      // Görsel Boyutlandırma (Mouse ve Akıllı Tahta Dokunmatik Sürükleme Desteği)
      notebookTextarea.addEventListener('pointerdown', (e) => {
        const handle = e.target.closest('.image-resize-handle');
        if (!handle) {
          const clickedWrapper = e.target.closest('.notebook-image-wrapper');
          notebookTextarea.querySelectorAll('.notebook-image-wrapper.is-selected').forEach(w => {
            if (w !== clickedWrapper) w.classList.remove('is-selected');
          });
          if (clickedWrapper && !e.target.closest('.image-delete-btn')) {
            clickedWrapper.classList.add('is-selected');
          }
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        const wrapper = handle.closest('.notebook-image-wrapper');
        const img = wrapper ? wrapper.querySelector('img') : null;
        if (!wrapper || !img) return;

        wrapper.classList.add('is-resizing', 'is-selected');
        if (handle.setPointerCapture && e.pointerId !== undefined) {
          try { handle.setPointerCapture(e.pointerId); } catch (err) {}
        }

        const startX = e.clientX;
        const startY = e.clientY;
        const startRect = wrapper.getBoundingClientRect();
        const startWidth = startRect.width || 320;
        const startHeight = startRect.height || 200;
        const aspectRatio = (img.naturalWidth && img.naturalHeight)
          ? (img.naturalWidth / img.naturalHeight)
          : (startWidth / Math.max(1, startHeight));

        const maxAllowedWidth = Math.max(160, (notebookTextarea.clientWidth || 800) - 85);

        const onPointerMove = (ev) => {
          ev.preventDefault();
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          const deltaWFromY = dy * aspectRatio;
          const deltaW = Math.abs(dx) >= Math.abs(deltaWFromY) ? dx : deltaWFromY;
          const newWidth = Math.max(80, Math.min(maxAllowedWidth, Math.round(startWidth + deltaW)));

          wrapper.style.width = newWidth + 'px';
          syncImageLineAlignment(wrapper);
          if (typeof checkAndExpandPosterPage === 'function') {
            checkAndExpandPosterPage();
          }
        };

        const onPointerUp = (ev) => {
          if (handle.releasePointerCapture && ev && ev.pointerId !== undefined) {
            try { handle.releasePointerCapture(ev.pointerId); } catch (err) {}
          }
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);
          window.removeEventListener('pointercancel', onPointerUp);
          wrapper.classList.remove('is-resizing');
          syncImageLineAlignment(wrapper);
          triggerAutoSave();
        };

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
      });
      
      // Görsel, Tablo ve Yapışkan Not Silme Olayı (Delegation)
      notebookTextarea.addEventListener('click', (e) => {
        if (e.target) {
          const deleteImgBtn = e.target.closest('.image-delete-btn');
          if (deleteImgBtn) {
            e.preventDefault();
            e.stopPropagation();
            const wrapper = deleteImgBtn.closest('.notebook-image-wrapper');
            if (wrapper) {
              wrapper.remove();
              triggerAutoSave();
            }
            return;
          }
          if (e.target.classList.contains('table-delete-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const wrapper = e.target.closest('.notebook-table-wrapper');
            if (wrapper) {
              wrapper.remove();
              triggerAutoSave();
            }
            return;
          }
          if (e.target.classList.contains('sticky-delete-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const note = e.target.closest('.sticky-note-block');
            if (note) {
              note.remove();
              triggerAutoSave();
            }
            return;
          }
        }
      });

      // Poster sayfasının boş alanlarına tıklandığında imleci doğrudan tıklanan satıra konumlandırma
      notebookTextarea.addEventListener('click', (e) => {
        if (e.target === notebookTextarea) {
          const rect = notebookTextarea.getBoundingClientRect();
          const clickY = e.clientY - rect.top + notebookTextarea.scrollTop;
          const lineHeight = getNotebookLineHeight();
          
          const lastChild = notebookTextarea.lastElementChild;
          let lastBottomY = 20;
          if (lastChild) {
            const lastRect = lastChild.getBoundingClientRect();
            const mb = parseFloat(getComputedStyle(lastChild).marginBottom) || 0;
            lastBottomY = (lastRect.bottom - rect.top) + notebookTextarea.scrollTop + mb;
          }
          
          if (clickY > lastBottomY + 10) {
            const linesNeeded = Math.max(1, Math.floor((clickY - lastBottomY) / lineHeight));
            let targetDiv = null;
            for (let i = 0; i < linesNeeded; i++) {
              const div = document.createElement('div');
              div.innerHTML = '<br>';
              notebookTextarea.appendChild(div);
              targetDiv = div;
            }
            
            if (targetDiv) {
              const sel = window.getSelection();
              const range = document.createRange();
              range.setStart(targetDiv, 0);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
              updateSavedRange();
              triggerAutoSave();
              return;
            }
          }
        }
        updateSavedRange();
      });

      // Poster sayfasının dinamik olarak aşağı doğru genişletilmesi
      const checkAndExpandPosterPage = () => {
        if (!notebookTextarea) return;
        const currentPosterHeight = parseInt(getComputedStyle(notebookTextarea).getPropertyValue('--notebook-poster-height'), 10) || 3520;
        if (notebookTextarea.scrollHeight > currentPosterHeight - 880) {
          const newHeight = notebookTextarea.scrollHeight + 1760;
          notebookTextarea.style.setProperty('--notebook-poster-height', newHeight + 'px');
        }
      };

      notebookTextarea.addEventListener('input', checkAndExpandPosterPage);
      notebookTextarea.addEventListener('scroll', checkAndExpandPosterPage);
    }
    if (notebookTitleInput) {
      notebookTitleInput.addEventListener('input', () => {
        if (detailNotebookTitle) {
          detailNotebookTitle.textContent = notebookTitleInput.value.trim() || 'Başlıksız Defter';
        }
        triggerAutoSave();
      });
    }
    if (topicTitleInput) {
      topicTitleInput.addEventListener('input', () => {
        if (topicList && currentTopicId) {
          const activeItem = topicList.querySelector(`.topic-item[data-id="${currentTopicId}"]`);
          if (activeItem) {
            const titleDiv = activeItem.querySelector('.topic-item-title');
            if (titleDiv) {
              titleDiv.textContent = topicTitleInput.value.trim() || 'Başlıksız Konu';
            }
          }
        }
        adjustTopicTitleFontSize();
        triggerAutoSave();
      });
    }

    // Kırmızı Başlık Butonu Olayı (Yazı Rengi Değiştirici)
    const toggleTextColorRed = () => {
      isRedMode = !isRedMode;
      const color = isRedMode ? '#ef4444' : '#1e293b';
      
      if (notebookColorIndicator) {
        notebookColorIndicator.style.backgroundColor = color;
      }
      if (notebookTextarea) {
        notebookTextarea.focus();
      }
      document.execCommand('foreColor', false, color);
    };

    if (btnRedTitle) {
      btnRedTitle.addEventListener('click', toggleTextColorRed);
    }

    // Matematik Menüsü Aç/Kapat Olayları
    const preventFocusLoss = (e) => {
      e.preventDefault();
    };

    if (btnMathDropdownTrigger && mathDropdownMenu) {
      btnMathDropdownTrigger.addEventListener('mousedown', preventFocusLoss);
      btnMathDropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShown = mathDropdownMenu.style.display === 'block';
        mathDropdownMenu.style.display = isShown ? 'none' : 'block';
      });
    }

    if (mathDropdownMenu) {
      mathDropdownMenu.addEventListener('mousedown', preventFocusLoss);
    }

    // Dropdown Dışına Tıklandığında Kapatma
    document.addEventListener('click', (e) => {
      if (mathDropdownMenu && btnMathDropdownTrigger && !btnMathDropdownTrigger.contains(e.target) && !mathDropdownMenu.contains(e.target)) {
        mathDropdownMenu.style.display = 'none';
      }
      if (listDropdownMenu && btnListDropdownTrigger && !btnListDropdownTrigger.contains(e.target) && !listDropdownMenu.contains(e.target)) {
        listDropdownMenu.style.display = 'none';
      }
    });

    // Matematik Şablon Seçimleri (Olay Delegasyonu)
    document.addEventListener('click', (e) => {
      const templateBtn = e.target.closest('.math-template-btn');
      if (templateBtn) {
        e.preventDefault();
        e.stopPropagation();
        const type = templateBtn.getAttribute('data-template');
        insertMathTemplate(type);
        
        if (mathDropdownMenu) mathDropdownMenu.style.display = 'none';
      }
    });

    const pdfViewerLiveBadge = document.getElementById('pdf-viewer-live-badge');
    if (pdfViewerLiveBadge) {
      pdfViewerLiveBadge.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const flowModal = document.getElementById('modal-flow-info');
        if (flowModal) {
          flowModal.classList.add('active');
          if (window.updateFlowContent) window.updateFlowContent(true);
        }
      });
    }

    // Tam Ekran Hızlı Araçlar Olay Dinleyicileri (Kitap & Defter)
    const openCaller = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (typeof window.openQuickCallerModal === 'function') {
        window.openQuickCallerModal();
      } else {
        const callerModal = document.getElementById('modal-quick-caller');
        if (callerModal) {
          callerModal.style.display = 'flex';
          callerModal.classList.add('active');
          if (window.initQuickCallerModal) window.initQuickCallerModal();
        }
      }
    };

    const openQuickPoint = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (typeof window.openQuickGivePointModal === 'function') {
        window.openQuickGivePointModal();
      } else {
        const pointModal = document.getElementById('modal-quick-give-point');
        if (pointModal) {
          pointModal.style.display = 'flex';
          pointModal.classList.add('active');
        }
      }
    };

    const openTimer = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (typeof window.openTimerModal === 'function') {
        window.openTimerModal();
      } else {
        const timerModal = document.getElementById('modal-timer');
        if (timerModal) {
          timerModal.style.display = '';
          timerModal.classList.add('active');
          if (window.initTimerModal) window.initTimerModal();
        }
      }
    };

    // PDF Tam Ekran Butonları
    const btnPdfCaller = document.getElementById('btn-pdf-quick-caller');
    if (btnPdfCaller) btnPdfCaller.addEventListener('click', openCaller);

    const btnPdfPuan = document.getElementById('btn-pdf-quick-puan');
    if (btnPdfPuan) btnPdfPuan.addEventListener('click', openQuickPoint);

    const btnPdfTimer = document.getElementById('btn-pdf-quick-timer');
    if (btnPdfTimer) btnPdfTimer.addEventListener('click', openTimer);

    // Defter Tam Ekran Butonları
    const btnNotebookCaller = document.getElementById('btn-notebook-quick-caller');
    if (btnNotebookCaller) btnNotebookCaller.addEventListener('click', openCaller);

    const btnNotebookPuan = document.getElementById('btn-notebook-quick-puan');
    if (btnNotebookPuan) btnNotebookPuan.addEventListener('click', openQuickPoint);

    const btnNotebookTimer = document.getElementById('btn-notebook-quick-timer');
    if (btnNotebookTimer) btnNotebookTimer.addEventListener('click', openTimer);

    // Global durum değişikliklerinde listeyi yenile
    document.addEventListener('stateChanged', () => {
      if (isActiveTab('notebooks')) {
        renderNotebookGrid();
      }
    });

    // Sayfa açıldığında defterleri yükle
    loadInitialNotebooks();

    // Ekran boyutu değiştiğinde konu başlığı yazı boyutunu güncelle
    window.addEventListener('resize', () => {
      if (isActiveTab('notebooks')) {
        adjustTopicTitleFontSize();
        syncAllNotebookImages();
      }
    });
  }

  // Defterler sekmesinin aktif olup olmadığını kontrol et
  function isActiveTab(tabId) {
    const activeTab = document.querySelector('.nav-item.active');
    return activeTab && activeTab.getAttribute('data-tab') === tabId;
  }

  // İlk Görünümü Yükleme
  function loadInitialNotebooks() {
    showGridView();
  }

  // Grid Görünümünü Göster
  function showGridView() {
    savePendingChanges(); // Varsa bekleyen değişiklikleri kaydet
    currentNotebookId = null;
    currentTopicId = null;

    if (notebooksGridView) notebooksGridView.style.display = 'block';
    if (notebookDetailView) notebookDetailView.style.display = 'none';
    if (btnExpandTopicsSidebar) btnExpandTopicsSidebar.style.display = 'none';

    renderNotebookGrid();
  }

  // Defter Gridini Çiz (Kapak Tasarımları)
  function renderNotebookGrid() {
    if (!notebookGrid) return;
    notebookGrid.innerHTML = '';
    
    const notebooks = window.stateManager ? window.stateManager.getNotebooks() : [];
    
    if (notebooks.length === 0) {
      notebookGrid.innerHTML = `
        <div class="empty-state-simple" style="grid-column: 1 / -1; padding: 3rem 0; text-align: center; width: 100%;">
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">Henüz defter oluşturulmamış.</p>
        </div>
      `;
      appendAddCardToGrid();
      return;
    }

    // Güncellenme tarihine göre sırala (en güncel en üstte)
    notebooks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const coverColors = ['cover-indigo', 'cover-cyan', 'cover-emerald', 'cover-rose', 'cover-amber', 'cover-violet'];

    notebooks.forEach((nb, idx) => {
      const card = document.createElement('div');
      const colorClass = coverColors[idx % coverColors.length];
      card.className = `notebook-cover-card ${colorClass}`;
      card.setAttribute('data-id', nb.id);
      
      const typeText = nb.type === 'grid' ? 'Kareli' : 'Çizgili';
      const topicsCount = nb.topics ? nb.topics.length : 1;

      card.innerHTML = `
        <div class="notebook-cover-label">
          <div class="notebook-cover-title">${escapeHTML(nb.title)}</div>
          <div class="notebook-cover-meta">
            <i data-lucide="book-open" style="width: 12px; height: 12px;"></i>
            <span>${topicsCount} Konu • ${typeText}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => selectNotebook(nb.id));
      notebookGrid.appendChild(card);
    });

    appendAddCardToGrid();

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Defter Ekleme Kartını Gride Ekle
  function appendAddCardToGrid() {
    if (!notebookGrid) return;
    const addCard = document.createElement('div');
    addCard.className = 'notebook-cover-card add-new';
    addCard.innerHTML = `
      <i data-lucide="plus-circle"></i>
      <span>Defter Ekle</span>
    `;
    addCard.addEventListener('click', openAddModal);
    notebookGrid.appendChild(addCard);
  }

  // Defter Seçildiğinde (Açıldığında)
  function selectNotebook(id) {
    currentNotebookId = id;
    
    const notebooks = window.stateManager ? window.stateManager.getNotebooks() : [];
    const notebook = notebooks.find(nb => nb.id === id);
    
    if (notebook) {
      // Geriye dönük veri uyumluluğu: Defterin konuları yoksa oluştur
      if (!notebook.topics || notebook.topics.length === 0) {
        notebook.topics = [
          {
            id: 'topic_default_' + notebook.id,
            title: notebook.title || 'Genel Notlar',
            content: notebook.content || '<div><br></div>',
            createdAt: notebook.createdAt || new Date().toISOString(),
            updatedAt: notebook.updatedAt || new Date().toISOString()
          }
        ];
        // Durumu kaydet
        if (window.stateManager) {
          window.stateManager.saveNotebook(notebook);
        }
      }

      // Detay görünümünü göster
      if (notebooksGridView) notebooksGridView.style.display = 'none';
      if (notebookDetailView) notebookDetailView.style.display = 'block';
      if (btnExpandTopicsSidebar) {
        btnExpandTopicsSidebar.style.display = (notebookTopicsSidebar && notebookTopicsSidebar.classList.contains('collapsed')) ? 'flex' : 'none';
      }

      if (detailNotebookTitle) detailNotebookTitle.textContent = notebook.title;
      if (notebookTitleInput) notebookTitleInput.value = notebook.title;
      
      if (notebookTypeBadge) {
        notebookTypeBadge.textContent = notebook.type === 'grid' ? 'Kareli Defter' : 'Çizgili Defter';
        notebookTypeBadge.style.background = notebook.type === 'grid' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(79, 70, 229, 0.1)';
        notebookTypeBadge.style.color = notebook.type === 'grid' ? 'var(--info)' : 'var(--primary)';
      }

      // Konu listesini yükle
      renderTopicList(notebook);

      // İlk konuyu otomatik aç
      if (notebook.topics && notebook.topics.length > 0) {
        selectTopic(notebook.topics[0].id);
      }
    } else {
      showGridView();
    }
  }

  // Konu Listesini Çiz
  function renderTopicList(notebook) {
    if (!topicList) return;
    topicList.innerHTML = '';

    if (!notebook || !notebook.topics || notebook.topics.length === 0) {
      topicList.innerHTML = `
        <p style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 1rem 0;">Henüz konu eklenmemiş.</p>
      `;
      return;
    }

    notebook.topics.forEach(tp => {
      const item = document.createElement('div');
      item.className = `topic-item ${currentTopicId === tp.id ? 'active' : ''}`;
      item.setAttribute('data-id', tp.id);

      item.innerHTML = `
        <div class="topic-item-title">${escapeHTML(tp.title)}</div>
        <div class="topic-item-actions">
          <button class="btn-topic-delete" title="Konuyu Sil">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-topic-delete')) {
          e.stopPropagation();
          deleteTopic(tp.id);
        } else {
          selectTopic(tp.id);
        }
      });

      topicList.appendChild(item);
    });

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Konu Seçildiğinde
  function selectTopic(topicId) {
    savePendingChanges(); // Varsa önceki konuyu kaydet
    currentTopicId = topicId;
    savedRange = null;

    if (topicList) {
      const items = topicList.querySelectorAll('.topic-item');
      items.forEach(item => {
        if (item.getAttribute('data-id') === topicId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    const notebooks = window.stateManager ? window.stateManager.getNotebooks() : [];
    const notebook = notebooks.find(nb => nb.id === currentNotebookId);
    if (!notebook) return;

    const topic = notebook.topics.find(tp => tp.id === topicId);
    if (topic) {
      if (topicTitleInput) topicTitleInput.value = topic.title;
      if (notebookTextarea) {
        notebookTextarea.innerHTML = topic.content || '<div><br></div>';
        notebookTextarea.className = 'notebook-editor-textarea';
        notebookTextarea.classList.add(notebook.type);
        notebookTextarea.style.fontSize = '';
        notebookTextarea.style.backgroundPosition = '';
        
        const savedFontSize = localStorage.getItem('sinif_asistani_notebook_fontsize') || 'normal';
        applyNotebookFontSize(savedFontSize);

        syncOrderedListContinuity();
        syncAllNotebookImages();
      }

      // Kırmızı modunu sıfırla
      isRedMode = false;
      if (notebookColorIndicator) {
        notebookColorIndicator.style.backgroundColor = '#1e293b';
      }
    }
    adjustTopicTitleFontSize();
  }

  // Konu başlığının yazı boyutunu otomatik sığacak şekilde ayarla
  function adjustTopicTitleFontSize() {
    if (!topicTitleInput) return;
    const text = topicTitleInput.value || '';
    
    // Geçici ölçüm öğesini bul veya oluştur
    let tester = document.getElementById('topic-title-width-tester');
    if (!tester) {
      tester = document.createElement('span');
      tester.id = 'topic-title-width-tester';
      tester.style.visibility = 'hidden';
      tester.style.position = 'absolute';
      tester.style.whiteSpace = 'pre';
      tester.style.fontFamily = "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif";
      tester.style.fontWeight = '700';
      document.body.appendChild(tester);
    }
    
    tester.textContent = text || topicTitleInput.placeholder || '';
    
    const maxVal = 26; // Varsayılan boyut (pt)
    const minVal = 12; // Minimum boyut (pt)
    let currentSize = maxVal;
    tester.style.fontSize = currentSize + 'pt';
    
    // İnputun genişliğini al (padding payı çıkarılarak)
    const inputWidth = topicTitleInput.clientWidth || topicTitleInput.getBoundingClientRect().width;
    
    if (inputWidth > 0) {
      // Metin genişliği input genişliğinden büyük olduğu sürece yazı boyutunu küçült
      while (tester.getBoundingClientRect().width > inputWidth - 20 && currentSize > minVal) {
        currentSize -= 0.5;
        tester.style.fontSize = currentSize + 'pt';
      }
    }
    
    topicTitleInput.style.fontSize = currentSize + 'pt';
  }

  // Konu Ekleme Olayı
  function handleAddTopicClick() {
    if (!currentNotebookId) return;

    const notebooks = window.stateManager ? window.stateManager.getNotebooks() : [];
    const notebook = notebooks.find(nb => nb.id === currentNotebookId);
    if (!notebook) return;

    const topics = notebook.topics || [];
    const newTopicIndex = topics.length + 1;
    const newTopic = {
      id: 'topic_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: 'Konu ' + newTopicIndex,
      content: '<div><br></div>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    notebook.topics = [...topics, newTopic];

    if (window.stateManager) {
      window.stateManager.saveNotebook(notebook);
    }

    renderTopicList(notebook);
    selectTopic(newTopic.id);

    // Yeni konunun başlığını düzenlemesi için odağı oraya al
    if (topicTitleInput) {
      topicTitleInput.focus();
      topicTitleInput.select();
    }

    if (window.showToast) {
      window.showToast('Yeni konu eklendi.', 'success');
    }
  }

  // Konu Silme Olayı
  function deleteTopic(topicId) {
    if (!currentNotebookId) return;

    const notebooks = window.stateManager ? window.stateManager.getNotebooks() : [];
    const notebook = notebooks.find(nb => nb.id === currentNotebookId);
    if (!notebook) return;

    if (notebook.topics.length <= 1) {
      if (window.showToast) {
        window.showToast('Defterde en az bir konu bulunmalıdır.', 'warning');
      }
      return;
    }

    const topicToDelete = notebook.topics.find(tp => tp.id === topicId);
    const title = topicToDelete ? topicToDelete.title : 'konuyu';

    if (confirm(`"${title}" konusunu ve içindeki notları silmek istediğinize emin misiniz?`)) {
      notebook.topics = notebook.topics.filter(tp => tp.id !== topicId);

      if (window.stateManager) {
        window.stateManager.saveNotebook(notebook);
      }

      if (window.showToast) {
        window.showToast('Konu silindi.', 'danger');
      }

      renderTopicList(notebook);

      // Silinen konu aktif konuysa, listedeki ilk konuyu seç
      if (currentTopicId === topicId) {
        selectTopic(notebook.topics[0].id);
      }
    }
  }

  let pdfLiveInterval = null;

  function updatePdfViewerLiveInfo() {
    const periodSpan = document.querySelector('#pdf-live-period-text span');
    const topicSpan = document.getElementById('pdf-live-topic-text');
    const badgeContainer = document.getElementById('pdf-viewer-live-badge');
    const periodWrap = document.getElementById('pdf-live-period-text');
    if (!periodSpan || !topicSpan) return;

    if (typeof window.getCurrentLessonInfo !== 'function') return;

    const info = window.getCurrentLessonInfo();
    
    if (info.statusType === 'lesson') {
      const remainingStr = info.remainingMinutes !== null ? ` (${info.remainingMinutes} dk)` : '';
      periodSpan.textContent = `${info.periodNum}${remainingStr}`;
      if (periodWrap) periodWrap.style.color = '#10b981'; // yeşil
    } else if (info.statusType === 'break' || info.statusType === 'lunch') {
      const remainingStr = info.remainingMinutes !== null ? ` (${info.remainingMinutes} dk)` : '';
      periodSpan.textContent = `${info.periodNum}${remainingStr}`;
      if (periodWrap) periodWrap.style.color = '#f59e0b'; // sarı/amber
    } else {
      periodSpan.textContent = info.periodNum || 'Ders Saati Dışı';
      if (periodWrap) periodWrap.style.color = '#94a3b8'; // gri
    }

    let topicDisplay = '';
    if (info.statusType === 'lesson') {
      topicDisplay = `${info.lessonName.toUpperCase()}: ${info.lessonTopic || 'Konu belirtilmemiş'}`;
    } else {
      topicDisplay = `${info.lessonName} - ${info.lessonTopic || ''}`;
    }
    topicSpan.textContent = topicDisplay;
    if (badgeContainer) {
      badgeContainer.title = `${info.periodNum} | ${topicDisplay} (Detaylar için tıklayın)`;
    }

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Modal Aç
  function openAddModal() {
    if (!modalNotebook || !formNotebook || !notebookTitleModalInput) return;
    formNotebook.reset();
    
    // Varsayılan çizgili kartı seçili yap
    const typeCards = modalNotebook.querySelectorAll('.notebook-type-card');
    typeCards.forEach(c => c.classList.remove('selected'));
    const defaultCard = modalNotebook.querySelector('.notebook-type-card input[value="lined"]').closest('.notebook-type-card');
    if (defaultCard) defaultCard.classList.add('selected');
    modalNotebook.querySelector('.notebook-type-card input[value="lined"]').checked = true;

    modalNotebook.classList.add('active');
    setTimeout(() => {
      notebookTitleModalInput.focus();
    }, 100);
  }

  // Yeni Defter Ekle Submit
  function handleAddNotebookSubmit(e) {
    e.preventDefault();
    if (!notebookTitleModalInput || !formNotebook) return;
    
    const title = notebookTitleModalInput.value.trim();
    const type = formNotebook.querySelector('input[name="notebook-type"]:checked').value;

    if (!title) return;

    const notebookData = {
      title: title,
      type: type,
      content: '',
      topics: [
        {
          id: 'topic_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          title: title,
          content: '<div><br></div>',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };

    if (window.stateManager) {
      const saved = window.stateManager.saveNotebook(notebookData);
      if (modalNotebook) modalNotebook.classList.remove('active');
      
      if (window.showToast) {
        window.showToast(`"${title}" defteri oluşturuldu.`, 'success');
      }
      
      selectNotebook(saved.id); // Hemen yeni defteri aç
    }
  }

  // Tablo Ekle Submit
  function handleAddTableSubmit(e) {
    e.preventDefault();
    if (!formTable || !tableRowsInput || !tableColsInput) return;

    const rows = parseInt(tableRowsInput.value, 10) || 3;
    const cols = parseInt(tableColsInput.value, 10) || 3;

    // Tablo HTML Oluşturma
    let tableHtml = '<table contenteditable="true">';
    
    // Başlık satırı
    tableHtml += '<thead><tr>';
    for (let c = 0; c < cols; c++) {
      tableHtml += `<th>Başlık ${c + 1}</th>`;
    }
    tableHtml += '</tr></thead>';

    // Veri satırları
    tableHtml += '<tbody>';
    for (let r = 0; r < rows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < cols; c++) {
        tableHtml += '<td>&nbsp;</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';

    const suffix = '<div><br></div>'; // Altındaki boşluk ve dikey ritim satırı
    const html = `<div class="notebook-table-wrapper" contenteditable="false"><button class="table-delete-btn" type="button" title="Tabloyu Sil">&times;</button>${tableHtml}</div>` + suffix;

    const inserted = insertHtmlAtCursor(html, true);
    if (!inserted && notebookTextarea) {
      notebookTextarea.innerHTML += html + ' ';
    }

    if (modalTable) {
      modalTable.classList.remove('active');
    }

    triggerAutoSave();
  }

  // Yapışkan Not Ekle Submit
  function handleAddStickyNoteSubmit(e) {
    e.preventDefault();
    if (!formStickyNote || !stickyNoteText) return;

    const text = stickyNoteText.value.trim();
    if (!text) return;

    const color = formStickyNote.querySelector('input[name="sticky-color"]:checked').value;
    const type = formStickyNote.querySelector('input[name="sticky-type"]:checked').value;

    // İkon eşleştirmeleri
    let iconName = 'info';
    if (type === 'check') {
      iconName = 'check-circle';
    } else if (type === 'alert') {
      iconName = 'alert-triangle';
    } else if (type === 'star') {
      iconName = 'star';
    }

    const suffix = '<div><br></div>'; // Adds an empty 36px line below for cursor exiting and vertical rhythm
    const html = `<div class="sticky-note-block sticky-color-${color}" contenteditable="false"><button class="sticky-delete-btn" type="button" title="Notu Sil">&times;</button><div class="sticky-note-icon-container"><i data-lucide="${iconName}"></i></div><div class="sticky-note-content" contenteditable="true">${escapeHTML(text)}</div></div>` + suffix;

    const inserted = insertHtmlAtCursor(html, true);
    if (!inserted && notebookTextarea) {
      notebookTextarea.innerHTML += html + ' ';
    }

    if (modalStickyNote) {
      modalStickyNote.classList.remove('active');
    }

    // Lucide ikonlarını yeniden oluştur
    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }

    triggerAutoSave();
  }

  // Manuel Defter Kaydı
  function saveActiveNotebookManual() {
    if (!currentNotebookId) return;
    
    const notebooks = window.stateManager ? window.stateManager.getNotebooks() : [];
    const notebook = notebooks.find(nb => nb.id === currentNotebookId);
    if (!notebook) return;

    if (notebookTitleInput) {
      notebook.title = notebookTitleInput.value.trim() || 'Başlıksız Defter';
      if (detailNotebookTitle) detailNotebookTitle.textContent = notebook.title;
    }

    if (currentTopicId && notebook.topics) {
      const topic = notebook.topics.find(tp => tp.id === currentTopicId);
      if (topic) {
        if (topicTitleInput) {
          topic.title = topicTitleInput.value.trim() || 'Başlıksız Konu';
        }
        if (notebookTextarea) {
          topic.content = notebookTextarea.innerHTML;
        }
        topic.updatedAt = new Date().toISOString();
      }
    }

    if (window.stateManager) {
      window.stateManager.saveNotebook(notebook);
      
      if (window.showToast) {
        window.showToast('Defter kaydedildi.', 'success');
      }

      renderTopicList(notebook);
    }
  }

  // Bekleyen Değişiklikleri Anında Kaydet
  function savePendingChanges() {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = null;
    }
    
    if (!currentNotebookId) return;

    const notebooks = window.stateManager ? window.stateManager.getNotebooks() : [];
    const notebook = notebooks.find(nb => nb.id === currentNotebookId);
    if (!notebook) return;

    let changed = false;

    if (notebookTitleInput) {
      const oldTitle = notebook.title;
      notebook.title = notebookTitleInput.value.trim() || 'Başlıksız Defter';
      if (oldTitle !== notebook.title) {
        if (detailNotebookTitle) detailNotebookTitle.textContent = notebook.title;
        changed = true;
      }
    }

    if (currentTopicId && notebook.topics) {
      const topic = notebook.topics.find(tp => tp.id === currentTopicId);
      if (topic) {
        const oldContent = topic.content;
        const oldTitle = topic.title;

        if (notebookTextarea) topic.content = notebookTextarea.innerHTML;
        if (topicTitleInput) topic.title = topicTitleInput.value.trim() || 'Başlıksız Konu';

        if (oldContent !== topic.content || oldTitle !== topic.title) {
          topic.updatedAt = new Date().toISOString();
          changed = true;
        }
      }
    }

    if (changed && window.stateManager) {
      window.stateManager.saveNotebook(notebook);
      renderTopicList(notebook);
    }
  }

  // Debounced Otomatik Kaydetme
  function triggerAutoSave() {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    autoSaveTimeout = setTimeout(() => {
      if (!currentNotebookId) return;

      const notebooks = window.stateManager ? window.stateManager.getNotebooks() : [];
      const notebook = notebooks.find(nb => nb.id === currentNotebookId);
      if (!notebook) return;

      let changed = false;

      if (notebookTitleInput) {
        const oldTitle = notebook.title;
        notebook.title = notebookTitleInput.value.trim() || 'Başlıksız Defter';
        if (oldTitle !== notebook.title) {
          if (detailNotebookTitle) detailNotebookTitle.textContent = notebook.title;
          changed = true;
        }
      }

      if (currentTopicId && notebook.topics) {
        const topic = notebook.topics.find(tp => tp.id === currentTopicId);
        if (topic) {
          const oldContent = topic.content;
          const oldTitle = topic.title;

          if (notebookTextarea) topic.content = notebookTextarea.innerHTML;
          if (topicTitleInput) topic.title = topicTitleInput.value.trim() || 'Başlıksız Konu';

          if (oldContent !== topic.content || oldTitle !== topic.title) {
            topic.updatedAt = new Date().toISOString();
            changed = true;
          }
        }
      }

      if (changed && window.stateManager) {
        window.stateManager.saveNotebook(notebook);
        
        // Konu başlığı değişmişse sidebar listesindeki ismi anlık güncelle
        if (topicList && currentTopicId) {
          const activeItem = topicList.querySelector(`.topic-item[data-id="${currentTopicId}"]`);
          if (activeItem) {
            const titleDiv = activeItem.querySelector('.topic-item-title');
            if (titleDiv && topicTitleInput) titleDiv.textContent = topicTitleInput.value.trim() || 'Başlıksız Konu';
          }
        }
      }
    }, 1000); // 1 saniye bekle
  }

  // Defter Sil
  function deleteActiveNotebook() {
    if (!currentNotebookId) return;

    const notebooks = window.stateManager ? window.stateManager.getNotebooks() : [];
    const notebook = notebooks.find(nb => nb.id === currentNotebookId);
    if (!notebook) return;

    const confirmMsg = `"${notebook.title}" defterini ve içindeki tüm konuları/notları kalıcı olarak silmek istediğinize emin misiniz?`;
    if (confirm(confirmMsg)) {
      if (window.stateManager) {
        window.stateManager.deleteNotebook(currentNotebookId);
        if (window.showToast) {
          window.showToast('Defter silindi.', 'danger');
        }
        showGridView();
      }
    }
  }

  // Yardımcılar
  function handleImageUpload(file) {
    if (!file) return;

    const rangeAtUploadStart = savedRange ? savedRange.cloneRange() : null;

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        // Resize image to max 1200px width/height for crisp smartboard display while protecting localStorage
        const canvas = document.createElement('canvas');
        const max_size = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const initialDisplayWidth = Math.max(120, Math.min(360, canvas.width));

        const imgHtml = `<div class="notebook-image-wrapper" contenteditable="false" style="width: ${initialDisplayWidth}px;"><img src="${dataUrl}" alt="Görsel"><button class="image-delete-btn" type="button" title="Görseli Sil">&times;</button><button class="image-resize-handle" type="button" title="Boyutlandırmak için sürükleyin">${RESIZE_HANDLE_SVG}</button></div>`;

        if (rangeAtUploadStart) {
          savedRange = rangeAtUploadStart.cloneRange();
        }

        const inserted = insertHtmlAtCursor(imgHtml, true);
        if (!inserted && notebookTextarea) {
          notebookTextarea.insertAdjacentHTML('beforeend', imgHtml + '<div><br></div>');
        }

        syncAllNotebookImages();
        triggerAutoSave();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function insertMathTemplate(type) {
    let html = '';
    const suffix = '&#8203;&nbsp;'; 
    if (type === 'fraction') {
      html = '<span class="math-fraction" contenteditable="false"><span class="math-numerator" contenteditable="true">x</span><span class="math-denominator" contenteditable="true">y</span></span>' + suffix;
    } else if (type === 'exponent') {
      html = '<span class="math-exponent" contenteditable="false"><span class="math-base" contenteditable="true">x</span><span class="math-exponent-val" contenteditable="true">y</span></span>' + suffix;
    } else if (type === 'sqrt') {
      html = '<span class="math-sqrt" contenteditable="false"><span class="math-sqrt-symbol">&radic;</span><span class="math-sqrt-content" contenteditable="true">x</span></span>' + suffix;
    }

    if (html) {
      const inserted = insertHtmlAtCursor(html);
      if (!inserted && notebookTextarea) {
        notebookTextarea.innerHTML += html + ' ';
      }
      triggerAutoSave();
    }
  }

  function insertHtmlAtCursor(html, isBlockElement = false) {
    if (!notebookTextarea) return false;
    if (!window.getSelection) return false;

    const preservedRange = savedRange ? savedRange.cloneRange() : null;
    if (document.activeElement !== notebookTextarea) {
      notebookTextarea.focus();
    }

    const sel = window.getSelection();
    if (preservedRange) {
      try {
        sel.removeAllRanges();
        sel.addRange(preservedRange);
        savedRange = preservedRange.cloneRange();
      } catch (e) {}
    }

    if (!sel.getRangeAt || !sel.rangeCount) {
      return false;
    }

    let range = sel.getRangeAt(0);
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentNode;
    }

    let isInside = false;
    let node = container;
    while (node) {
      if (node === notebookTextarea) {
        isInside = true;
        break;
      }
      node = node.parentNode;
    }

    if (!isInside) {
      return false;
    }

    if (!isBlockElement) {
      range.deleteContents();
      const el = document.createElement('div');
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let childNode, lastNode;
      while ((childNode = el.firstChild)) {
        lastNode = frag.appendChild(childNode);
      }
      range.insertNode(frag);
      if (lastNode) {
        range = range.cloneRange();
        range.setStartAfter(lastNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        savedRange = range.cloneRange();
      }
      return true;
    }

    // --- BLOK ELEMAN EKLEME (Görsel, Tablo, Yapışkan Not) ---
    // İmlecin bulunduğu doğrudan üst satır bloğunu (notebookTextarea'nın doğrudan çocuğunu) belirle
    let parentBlock = null;

    if (range.startContainer === notebookTextarea) {
      if (notebookTextarea.childNodes.length === 0) {
        const initDiv = document.createElement('div');
        initDiv.innerHTML = '<br>';
        notebookTextarea.appendChild(initDiv);
        parentBlock = initDiv;
        range.setStart(parentBlock, 0);
        range.collapse(true);
      } else if (range.startOffset < notebookTextarea.childNodes.length) {
        const targetChild = notebookTextarea.childNodes[range.startOffset];
        if (targetChild.nodeType === Node.TEXT_NODE) {
          const wrapDiv = document.createElement('div');
          notebookTextarea.insertBefore(wrapDiv, targetChild);
          wrapDiv.appendChild(targetChild);
          parentBlock = wrapDiv;
          range.setStart(targetChild, 0);
          range.collapse(true);
        } else {
          parentBlock = targetChild;
          range.setStart(parentBlock, 0);
          range.collapse(true);
        }
      } else {
        parentBlock = notebookTextarea.lastElementChild;
        if (parentBlock) {
          range.selectNodeContents(parentBlock);
          range.collapse(false);
        }
      }
    } else if (range.startContainer.nodeType === Node.TEXT_NODE && range.startContainer.parentNode === notebookTextarea) {
      const txtNode = range.startContainer;
      const offset = range.startOffset;
      const wrapDiv = document.createElement('div');
      notebookTextarea.insertBefore(wrapDiv, txtNode);
      wrapDiv.appendChild(txtNode);
      parentBlock = wrapDiv;
      range.setStart(txtNode, offset);
      range.collapse(true);
    } else {
      let curr = range.startContainer;
      if (curr.nodeType === Node.TEXT_NODE) curr = curr.parentNode;
      while (curr && curr !== notebookTextarea) {
        if (curr.parentNode === notebookTextarea) {
          parentBlock = curr;
          break;
        }
        curr = curr.parentNode;
      }
    }

    const el = document.createElement('div');
    el.innerHTML = html;
    const frag = document.createDocumentFragment();
    let childNode;
    let firstInsertedEl = null;
    let lastInsertedEl = null;
    while ((childNode = el.firstChild)) {
      if (childNode.nodeType === Node.ELEMENT_NODE) {
        if (!firstInsertedEl) firstInsertedEl = childNode;
        lastInsertedEl = childNode;
      }
      frag.appendChild(childNode);
    }

    if (!parentBlock || parentBlock === notebookTextarea) {
      notebookTextarea.appendChild(frag);
    } else if (
      parentBlock.classList &&
      (parentBlock.classList.contains('notebook-image-wrapper') ||
       parentBlock.classList.contains('notebook-table-wrapper') ||
       parentBlock.classList.contains('sticky-note-block'))
    ) {
      if (parentBlock.nextSibling) {
        notebookTextarea.insertBefore(frag, parentBlock.nextSibling);
      } else {
        notebookTextarea.appendChild(frag);
      }
    } else {
      const hasEmbeddedMedia = parentBlock.querySelector && parentBlock.querySelector('img, table, .notebook-image-wrapper, .notebook-table-wrapper, .sticky-note-block, .math-fraction, .math-exponent, .math-sqrt');
      const cleanBlockText = (parentBlock.textContent || '').replace(/[\u200B-\u200D\uFEFF\s\u00A0]/g, '');
      const isEmptyLine = !hasEmbeddedMedia && cleanBlockText === '';

      if (isEmptyLine) {
        const hasNextSibling = !!parentBlock.nextElementSibling;
        const trailingEmptyDiv = (lastInsertedEl && lastInsertedEl !== firstInsertedEl && lastInsertedEl.tagName === 'DIV' && (lastInsertedEl.textContent || '').trim() === '');
        if (hasNextSibling && trailingEmptyDiv && lastInsertedEl.parentNode === frag) {
          frag.removeChild(lastInsertedEl);
          lastInsertedEl = firstInsertedEl;
        }
        notebookTextarea.insertBefore(frag, parentBlock);
        if (hasNextSibling || trailingEmptyDiv) {
          notebookTextarea.removeChild(parentBlock);
        }
      } else {
        try {
          const checkLeft = document.createRange();
          checkLeft.selectNodeContents(parentBlock);
          checkLeft.setEnd(range.startContainer, range.startOffset);
          const leftClone = checkLeft.cloneContents();
          const leftHasMedia = leftClone.querySelector && leftClone.querySelector('img, table, .notebook-image-wrapper, .notebook-table-wrapper, .sticky-note-block, .math-fraction, .math-exponent, .math-sqrt');
          const leftText = (leftClone.textContent || '').replace(/[\u200B-\u200D\uFEFF\s\u00A0]/g, '');
          const isAtStartOfBlock = !leftHasMedia && leftText === '';

          const checkRight = document.createRange();
          checkRight.selectNodeContents(parentBlock);
          checkRight.setStart(range.endContainer, range.endOffset);
          const rightClone = checkRight.cloneContents();
          const rightHasMedia = rightClone.querySelector && rightClone.querySelector('img, table, .notebook-image-wrapper, .notebook-table-wrapper, .sticky-note-block, .math-fraction, .math-exponent, .math-sqrt');
          const rightText = (rightClone.textContent || '').replace(/[\u200B-\u200D\uFEFF\s\u00A0]/g, '');
          const isAtEndOfBlock = !rightHasMedia && rightText === '';

          const trailingEmptyDiv = (lastInsertedEl && lastInsertedEl !== firstInsertedEl && lastInsertedEl.tagName === 'DIV' && (lastInsertedEl.textContent || '').trim() === '');

          if (isAtStartOfBlock) {
            if (trailingEmptyDiv && lastInsertedEl.parentNode === frag) {
              frag.removeChild(lastInsertedEl);
              lastInsertedEl = firstInsertedEl;
            }
            notebookTextarea.insertBefore(frag, parentBlock);
          } else if (isAtEndOfBlock) {
            if (parentBlock.nextElementSibling && trailingEmptyDiv && lastInsertedEl.parentNode === frag) {
              frag.removeChild(lastInsertedEl);
              lastInsertedEl = firstInsertedEl;
            }
            if (parentBlock.nextSibling) {
              notebookTextarea.insertBefore(frag, parentBlock.nextSibling);
            } else {
              notebookTextarea.appendChild(frag);
            }
          } else {
            // İmleç satırın ortasındaysa satırı ikiye böl: sol kısım üstte kalır, blok araya girer, sağ kısım alta kayar
            if (trailingEmptyDiv && lastInsertedEl.parentNode === frag) {
              frag.removeChild(lastInsertedEl);
              lastInsertedEl = firstInsertedEl;
            }
            const leftFragment = checkLeft.extractContents();
            const leftBlock = document.createElement(parentBlock.tagName || 'DIV');
            if (parentBlock.className) leftBlock.className = parentBlock.className;
            if (parentBlock.style.cssText) leftBlock.style.cssText = parentBlock.style.cssText;
            leftBlock.appendChild(leftFragment);

            notebookTextarea.insertBefore(leftBlock, parentBlock);
            notebookTextarea.insertBefore(frag, parentBlock);

            if ((parentBlock.textContent || '').trim() === '' && parentBlock.innerHTML === '') {
              parentBlock.innerHTML = '<br>';
            }
          }
        } catch (err) {
          if (parentBlock.nextSibling) {
            notebookTextarea.insertBefore(frag, parentBlock.nextSibling);
          } else {
            notebookTextarea.appendChild(frag);
          }
        }
      }
    }

    // Eklenen bloğun altında düzenlenebilir bir satır bulunduğundan emin ol ve imleci oraya taşı
    const anchorEl = lastInsertedEl || firstInsertedEl;
    if (anchorEl && anchorEl.parentNode === notebookTextarea) {
      let nextEditableLine = anchorEl.nextElementSibling;
      if (!nextEditableLine) {
        nextEditableLine = document.createElement('div');
        nextEditableLine.innerHTML = '<br>';
        notebookTextarea.appendChild(nextEditableLine);
      }

      const newRange = document.createRange();
      if (
        nextEditableLine.classList &&
        (nextEditableLine.classList.contains('notebook-image-wrapper') ||
         nextEditableLine.classList.contains('notebook-table-wrapper') ||
         nextEditableLine.classList.contains('sticky-note-block'))
      ) {
        newRange.setStartAfter(anchorEl);
      } else {
        newRange.setStart(nextEditableLine, 0);
      }
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      savedRange = newRange.cloneRange();
    }

    return true;
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  const DB_NAME = 'TextbooksDB';
  const DB_VERSION = 3;
  const STORE_NAME = 'pdfs';
  const POS_STORE_NAME = 'positions';
  const ANNOT_STORE_NAME = 'annotations';

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(POS_STORE_NAME)) {
          db.createObjectStore(POS_STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(ANNOT_STORE_NAME)) {
          db.createObjectStore(ANNOT_STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async function savePDF(id, name, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const data = {
        id,
        name,
        blob,
        uploadedAt: new Date().toISOString(),
        size: blob.size
      };
      const request = store.put(data);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async function getAllPDFs() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function deletePDF(id) {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const stores = [STORE_NAME];
      if (db.objectStoreNames.contains(POS_STORE_NAME)) stores.push(POS_STORE_NAME);
      if (db.objectStoreNames.contains(ANNOT_STORE_NAME)) stores.push(ANNOT_STORE_NAME);
      const transaction = db.transaction(stores, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(id);
      if (db.objectStoreNames.contains(POS_STORE_NAME)) {
        transaction.objectStore(POS_STORE_NAME).delete(id);
      }
      if (db.objectStoreNames.contains(ANNOT_STORE_NAME)) {
        transaction.objectStore(ANNOT_STORE_NAME).delete(id);
      }
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
    try {
      localStorage.removeItem('sinif_asistani_textbook_page_' + id);
      localStorage.removeItem('sinif_asistani_textbook_pos_' + id);
    } catch (e) {}
    if (window.stateManager && typeof window.stateManager.deleteTextbookPosition === 'function') {
      try { window.stateManager.deleteTextbookPosition(id); } catch (e) {}
    }
    return true;
  }

  async function getPDF(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function savePDFRecord(record) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async function savePDFPositionToIDB(posObj) {
    if (!posObj || !posObj.id) return false;
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(POS_STORE_NAME)) return false;
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(POS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(POS_STORE_NAME);
        const request = store.put(posObj);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('savePDFPositionToIDB error:', e);
      return false;
    }
  }

  async function getPDFPositionFromIDB(pdfId) {
    if (!pdfId) return null;
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(POS_STORE_NAME)) return null;
      return await new Promise((resolve) => {
        const transaction = db.transaction(POS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(POS_STORE_NAME);
        const request = store.get(pdfId);
        request.onsuccess = (e) => resolve(e.target.result || null);
        request.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  async function getAllPDFPositionsFromIDB() {
    const map = {};
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(POS_STORE_NAME)) return map;
      const rows = await new Promise((resolve) => {
        const transaction = db.transaction(POS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(POS_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = (e) => resolve(Array.isArray(e.target.result) ? e.target.result : []);
        request.onerror = () => resolve([]);
      });
      rows.forEach(r => {
        if (r && r.id) map[r.id] = r;
      });
    } catch (e) {}
    return map;
  }

  function getBestTextbookPosition(pdfId, pdfName = '', fallbackRecord = null, idbPos = null) {
    const candidates = [];

    // 1. StateManager (Masaüstü yerel disk JSON + IndexedDB yedekli — en kalıcı katman)
    if (window.stateManager && typeof window.stateManager.getTextbookPosition === 'function') {
      try {
        const stPos = window.stateManager.getTextbookPosition(pdfId, pdfName);
        if (stPos && Number(stPos.page) >= 1) {
          candidates.push({
            page: Math.max(1, parseInt(stPos.page, 10) || 1),
            scrollRatio: Number.isFinite(Number(stPos.scrollRatio)) ? Math.max(0, Math.min(1, Number(stPos.scrollRatio))) : 0,
            scale: Number.isFinite(Number(stPos.scale)) ? Number(stPos.scale) : null,
            updatedAt: Number(stPos.updatedAt) || 2,
            priority: 4
          });
        }
      } catch (e) {}
    }

    // 2. TextbooksDB hafif positions store'u
    if (idbPos && Number(idbPos.page) >= 1) {
      candidates.push({
        page: Math.max(1, parseInt(idbPos.page, 10) || 1),
        scrollRatio: Number.isFinite(Number(idbPos.scrollRatio)) ? Math.max(0, Math.min(1, Number(idbPos.scrollRatio))) : 0,
        scale: Number.isFinite(Number(idbPos.scale)) ? Number(idbPos.scale) : null,
        updatedAt: Number(idbPos.updatedAt) || 2,
        priority: 3
      });
    }

    // 3. localStorage (JSON konum + geriye dönük sadece sayfa anahtarı)
    try {
      const rawJson = localStorage.getItem('sinif_asistani_textbook_pos_' + pdfId);
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        if (parsed && Number(parsed.page) >= 1) {
          candidates.push({
            page: Math.max(1, parseInt(parsed.page, 10) || 1),
            scrollRatio: Number.isFinite(Number(parsed.scrollRatio)) ? Math.max(0, Math.min(1, Number(parsed.scrollRatio))) : 0,
            scale: Number.isFinite(Number(parsed.scale)) ? Number(parsed.scale) : null,
            updatedAt: Number(parsed.updatedAt) || 1,
            priority: 2
          });
        }
      } else {
        const storedPage = localStorage.getItem('sinif_asistani_textbook_page_' + pdfId);
        if (storedPage && parseInt(storedPage, 10) >= 1) {
          candidates.push({
            page: Math.max(1, parseInt(storedPage, 10)),
            scrollRatio: 0,
            scale: null,
            updatedAt: 1,
            priority: 1
          });
        }
      }
    } catch (e) {}

    // 4. Eski pdf kaydındaki lastPage alanı (geriye dönük uyumluluk)
    if (fallbackRecord && Number(fallbackRecord.lastPage) >= 1) {
      candidates.push({
        page: Math.max(1, parseInt(fallbackRecord.lastPage, 10)),
        scrollRatio: 0,
        scale: null,
        updatedAt: 0,
        priority: 0
      });
    }

    if (candidates.length === 0) {
      return { page: 1, scrollRatio: 0, scale: null, updatedAt: 0 };
    }

    // En yeni zaman damgasına göre seç; eşitse öncelik sırasına göre
    candidates.sort((a, b) => {
      if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
      return b.priority - a.priority;
    });
    return candidates[0];
  }

  function saveCurrentPdfPageState(pdfId, pageNum, opts = {}) {
    if (!pdfId) return;
    const p = Math.max(1, parseInt(pageNum, 10) || 1);
    const scrollRatio = Number.isFinite(Number(opts.scrollRatio))
      ? Math.max(0, Math.min(1, Number(opts.scrollRatio)))
      : 0;
    const scale = Number.isFinite(Number(opts.scale))
      ? Math.max(0.4, Math.min(4, Number(opts.scale)))
      : (activePdfScale || 1.25);
    const name = opts.name || currentOpenPdfName || '';
    const immediate = !!opts.immediate;
    const updatedAt = Date.now();

    const posObj = {
      id: pdfId,
      page: p,
      scrollRatio: Math.round(scrollRatio * 10000) / 10000,
      scale: Math.round(scale * 100) / 100,
      name,
      updatedAt
    };

    // Katman 1: localStorage (senkron — çıkış anında anında yazılır)
    try {
      localStorage.setItem('sinif_asistani_textbook_pos_' + pdfId, JSON.stringify(posObj));
      localStorage.setItem('sinif_asistani_textbook_page_' + pdfId, String(p));
      localStorage.setItem('sinif_asistani_last_opened_textbook_id', pdfId);
    } catch (e) {
      console.warn("saveCurrentPdfPageState localStorage error:", e);
    }

    // Katman 2: TextbooksDB hafif 'positions' deposu (dev PDF blob'una dokunmadan milisaniyede yazar)
    savePDFPositionToIDB(posObj);

    // Katman 3: StateManager (Masaüstü Tauri yerel disk JSON + günlük yedekler + IndexedDB state)
    if (window.stateManager && typeof window.stateManager.setTextbookPosition === 'function') {
      try {
        window.stateManager.setTextbookPosition(pdfId, posObj, immediate);
      } catch (e) {
        console.warn("saveCurrentPdfPageState stateManager error:", e);
      }
    }
  }

  function computeCurrentPdfScrollPosition() {
    const container = document.getElementById('pdf-viewer-canvas-container');
    if (!activePdfUsingJsViewer || !container || !activePdfPageSlots.length) {
      const pageInput = document.getElementById('pdf-viewer-page-input');
      const fallbackPage = pageInput ? (parseInt(pageInput.value, 10) || activePdfCurrentPage || 1) : (activePdfCurrentPage || 1);
      return { page: Math.max(1, fallbackPage), scrollRatio: activePdfScrollRatio || 0 };
    }

    const scrollTop = container.scrollTop;
    const probeY = scrollTop + 28; // Üst kenardan biraz aşağısı: aktif okunan sayfa
    let matchedSlot = activePdfPageSlots[0];
    let matchedPage = 1;

    for (let i = 0; i < activePdfPageSlots.length; i++) {
      const slot = activePdfPageSlots[i];
      const top = slot.offsetTop;
      const bottom = top + slot.offsetHeight;
      if (probeY >= top - 16) {
        matchedSlot = slot;
        matchedPage = i + 1;
        if (probeY < bottom) break;
      } else {
        break;
      }
    }

    const slotHeight = Math.max(1, matchedSlot.offsetHeight);
    const offsetInPage = Math.max(0, scrollTop - (matchedSlot.offsetTop - 16));
    const ratio = Math.max(0, Math.min(0.98, offsetInPage / slotHeight));

    return { page: matchedPage, scrollRatio: ratio };
  }

  function persistActivePdfPosition(immediate = false) {
    if (!currentOpenPdfId) return;
    if (activePdfScrollSaveTimer) {
      clearTimeout(activePdfScrollSaveTimer);
      activePdfScrollSaveTimer = null;
    }
    const pos = computeCurrentPdfScrollPosition();
    activePdfCurrentPage = pos.page;
    activePdfScrollRatio = pos.scrollRatio;
    saveCurrentPdfPageState(currentOpenPdfId, pos.page, {
      scrollRatio: pos.scrollRatio,
      scale: activePdfScale,
      name: currentOpenPdfName,
      immediate
    });
  }

  function cleanupPdfJsViewer() {
    activePdfRenderSession++;
    if (activePdfScrollSaveTimer) {
      clearTimeout(activePdfScrollSaveTimer);
      activePdfScrollSaveTimer = null;
    }
    if (activePdfObserver) {
      try { activePdfObserver.disconnect(); } catch (e) {}
      activePdfObserver = null;
    }
    activePdfRenderedPages.forEach((task) => {
      if (task && typeof task.cancel === 'function') {
        try { task.cancel(); } catch (e) {}
      }
    });
    activePdfRenderedPages.clear();
    activePdfPageSlots = [];
    if (activePdfDoc) {
      try { activePdfDoc.destroy(); } catch (e) {}
      activePdfDoc = null;
    }
    activePdfTotalPages = 0;
    activePdfUsingJsViewer = false;

    const container = document.getElementById('pdf-viewer-canvas-container');
    if (container) {
      container.onscroll = null;
      container.innerHTML = '';
      container.style.display = 'none';
    }
    const totalEl = document.getElementById('pdf-viewer-total-pages');
    if (totalEl) totalEl.style.display = 'none';
    const zoomControls = document.getElementById('pdf-viewer-zoom-controls');
    if (zoomControls) zoomControls.style.display = 'none';
    const btnDrawToggle = document.getElementById('btn-pdf-draw-toggle');
    if (btnDrawToggle) {
      btnDrawToggle.style.display = 'none';
      btnDrawToggle.classList.remove('btn-primary');
      btnDrawToggle.classList.add('btn-outline-primary');
    }
    const palette = document.getElementById('pdf-draw-palette');
    if (palette) palette.style.display = 'none';
    pdfDrawPaletteOpen = false;
    pdfDrawTool = 'hand';
    activePdfAnnotations = {};
    activePdfUndoStack = [];
    activePdfRedoStack = [];
  }

  // =========================================================================
  // PDF.JS KİTAP ÜZERİ ÇİZİM & İŞARETLEME MOTORU (LAZY + ZOOM UYUMLU + KALICI)
  // =========================================================================
  async function loadPDFAnnotationsFromIDB(pdfId) {
    if (!pdfId) return {};
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(ANNOT_STORE_NAME)) return {};
      const rec = await new Promise((resolve) => {
        const tx = db.transaction(ANNOT_STORE_NAME, 'readonly');
        const req = tx.objectStore(ANNOT_STORE_NAME).get(pdfId);
        req.onsuccess = (e) => resolve(e.target.result || null);
        req.onerror = () => resolve(null);
      });
      return (rec && rec.pages && typeof rec.pages === 'object') ? rec.pages : {};
    } catch (e) {
      console.warn('loadPDFAnnotationsFromIDB error:', e);
      return {};
    }
  }

  async function savePDFAnnotationsToIDB(pdfId, pagesObj) {
    if (!pdfId) return false;
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(ANNOT_STORE_NAME)) return false;
      return await new Promise((resolve) => {
        const tx = db.transaction(ANNOT_STORE_NAME, 'readwrite');
        const req = tx.objectStore(ANNOT_STORE_NAME).put({
          id: pdfId,
          pages: pagesObj || {},
          updatedAt: Date.now()
        });
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      console.warn('savePDFAnnotationsToIDB error:', e);
      return false;
    }
  }

  function drawSingleAnnotationShape(ctx, shape, w, h) {
    if (!shape || !ctx) return;
    const scaleFactor = w / 800;
    const baseSize = Math.max(1.2, (Number(shape.size) || 4) * scaleFactor);

    ctx.save();
    ctx.strokeStyle = shape.color || '#ef4444';
    ctx.fillStyle = shape.color || '#ef4444';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (shape.type === 'highlighter') {
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = Math.max(10, baseSize * 4.5);
    } else {
      ctx.globalAlpha = 0.94;
      ctx.lineWidth = baseSize;
    }

    if (shape.type === 'pen' || shape.type === 'highlighter') {
      const pts = shape.points;
      if (Array.isArray(pts) && pts.length > 0) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
        if (pts.length === 1) {
          ctx.lineTo(pts[0][0] * w + 0.1, pts[0][1] * h + 0.1);
        } else {
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
          }
        }
        ctx.stroke();
      }
    } else if (shape.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(shape.x1 * w, shape.y1 * h);
      ctx.lineTo(shape.x2 * w, shape.y2 * h);
      ctx.stroke();
    } else if (shape.type === 'rect') {
      const x = Math.min(shape.x1, shape.x2) * w;
      const y = Math.min(shape.y1, shape.y2) * h;
      const rw = Math.abs(shape.x2 - shape.x1) * w;
      const rh = Math.abs(shape.y2 - shape.y1) * h;
      ctx.strokeRect(x, y, rw, rh);
    } else if (shape.type === 'ellipse') {
      const cx = ((shape.x1 + shape.x2) / 2) * w;
      const cy = ((shape.y1 + shape.y2) / 2) * h;
      const rx = Math.abs(shape.x2 - shape.x1) * w / 2;
      const ry = Math.abs(shape.y2 - shape.y1) * h / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (shape.type === 'arrow') {
      const x1 = shape.x1 * w, y1 = shape.y1 * h;
      const x2 = shape.x2 * w, y2 = shape.y2 * h;
      const headLen = Math.max(10, baseSize * 4);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
    ctx.restore();
  }

  function pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function hitTestAnnotationShape(shape, nx, ny, tol = 0.025) {
    if (!shape) return false;
    if (shape.type === 'pen' || shape.type === 'highlighter') {
      const pts = shape.points || [];
      const t = shape.type === 'highlighter' ? tol * 1.6 : tol;
      for (let i = 0; i < pts.length; i++) {
        if (i === 0) {
          if (Math.hypot(nx - pts[0][0], ny - pts[0][1]) <= t) return true;
        } else {
          if (pointToSegmentDist(nx, ny, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]) <= t) return true;
        }
      }
      return false;
    }
    if (shape.type === 'line' || shape.type === 'arrow') {
      return pointToSegmentDist(nx, ny, shape.x1, shape.y1, shape.x2, shape.y2) <= tol;
    }
    if (shape.type === 'rect') {
      const minX = Math.min(shape.x1, shape.x2);
      const maxX = Math.max(shape.x1, shape.x2);
      const minY = Math.min(shape.y1, shape.y2);
      const maxY = Math.max(shape.y1, shape.y2);
      const nearH = (nx >= minX - tol && nx <= maxX + tol) && (Math.abs(ny - minY) <= tol || Math.abs(ny - maxY) <= tol);
      const nearV = (ny >= minY - tol && ny <= maxY + tol) && (Math.abs(nx - minX) <= tol || Math.abs(nx - maxX) <= tol);
      return nearH || nearV;
    }
    if (shape.type === 'ellipse') {
      const cx = (shape.x1 + shape.x2) / 2;
      const cy = (shape.y1 + shape.y2) / 2;
      const rx = Math.max(0.005, Math.abs(shape.x2 - shape.x1) / 2);
      const ry = Math.max(0.005, Math.abs(shape.y2 - shape.y1) / 2);
      const norm = Math.hypot((nx - cx) / rx, (ny - cy) / ry);
      return Math.abs(norm - 1) <= Math.max(0.18, tol / Math.min(rx, ry));
    }
    return false;
  }

  function redrawPageAnnotations(pageNum, previewShape = null) {
    const slot = activePdfPageSlots[pageNum - 1];
    if (!slot) return;
    const annotCanvas = slot.querySelector('canvas.pdf-annot-canvas');
    if (!annotCanvas) return;

    const cssW = slot.clientWidth || parseInt(slot.style.width, 10) || 1;
    const cssH = slot.clientHeight || parseInt(slot.style.height, 10) || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.floor(cssW * dpr);
    const targetH = Math.floor(cssH * dpr);
    if (annotCanvas.width !== targetW || annotCanvas.height !== targetH) {
      annotCanvas.width = targetW;
      annotCanvas.height = targetH;
    }

    const ctx = annotCanvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const shapes = activePdfAnnotations[pageNum] || [];
    for (let i = 0; i < shapes.length; i++) {
      drawSingleAnnotationShape(ctx, shapes[i], cssW, cssH);
    }
    if (previewShape) {
      drawSingleAnnotationShape(ctx, previewShape, cssW, cssH);
    }
  }

  function applyAnnotCanvasPointerMode(annotCanvas) {
    if (!annotCanvas) return;
    if (pdfDrawTool === 'hand') {
      annotCanvas.style.pointerEvents = 'none';
      annotCanvas.style.touchAction = 'auto';
      annotCanvas.style.cursor = 'default';
    } else if (pdfDrawTool === 'eraser') {
      annotCanvas.style.pointerEvents = 'auto';
      annotCanvas.style.touchAction = 'none';
      annotCanvas.style.cursor = 'cell';
    } else {
      annotCanvas.style.pointerEvents = 'auto';
      annotCanvas.style.touchAction = 'none';
      annotCanvas.style.cursor = 'crosshair';
    }
  }

  function attachAnnotCanvasEvents(annotCanvas, pageNum) {
    let isDrawing = false;
    let draftShape = null;
    let erasedDuringStroke = false;
    let prevShapesSnapshot = null;

    const getNormCoords = (e) => {
      const rect = annotCanvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height)));
      return { x, y };
    };

    const eraseAt = (nx, ny) => {
      const list = activePdfAnnotations[pageNum];
      if (!Array.isArray(list) || list.length === 0) return;
      for (let i = list.length - 1; i >= 0; i--) {
        if (hitTestAnnotationShape(list[i], nx, ny)) {
          if (!erasedDuringStroke) {
            prevShapesSnapshot = list.slice();
            erasedDuringStroke = true;
          }
          list.splice(i, 1);
          redrawPageAnnotations(pageNum);
          break;
        }
      }
    };

    annotCanvas.addEventListener('pointerdown', (e) => {
      if (pdfDrawTool === 'hand') return;
      if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      e.stopPropagation();
      try { annotCanvas.setPointerCapture(e.pointerId); } catch (err) {}

      const { x, y } = getNormCoords(e);
      isDrawing = true;

      if (pdfDrawTool === 'eraser') {
        erasedDuringStroke = false;
        prevShapesSnapshot = null;
        eraseAt(x, y);
        return;
      }

      if (pdfDrawTool === 'pen' || pdfDrawTool === 'highlighter') {
        draftShape = {
          type: pdfDrawTool,
          color: pdfDrawColor,
          size: pdfDrawSize,
          points: [[Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000]]
        };
      } else {
        draftShape = {
          type: pdfDrawTool,
          color: pdfDrawColor,
          size: pdfDrawSize,
          x1: x,
          y1: y,
          x2: x,
          y2: y
        };
      }
      redrawPageAnnotations(pageNum, draftShape);
    });

    annotCanvas.addEventListener('pointermove', (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const { x, y } = getNormCoords(e);

      if (pdfDrawTool === 'eraser') {
        eraseAt(x, y);
        return;
      }
      if (!draftShape) return;

      if (draftShape.type === 'pen' || draftShape.type === 'highlighter') {
        const last = draftShape.points[draftShape.points.length - 1];
        if (!last || Math.hypot(x - last[0], y - last[1]) >= 0.0025) {
          draftShape.points.push([Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000]);
        }
      } else {
        let tx = x, ty = y;
        // Düz çizgide satır altı çizerken yatay açı 6°'den küçükse otomatik dümdüz yatay hizala
        if (draftShape.type === 'line') {
          const dx = tx - draftShape.x1;
          const dy = ty - draftShape.y1;
          if (e.shiftKey) {
            const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
            const dist = Math.hypot(dx, dy);
            tx = draftShape.x1 + Math.cos(ang) * dist;
            ty = draftShape.y1 + Math.sin(ang) * dist;
          } else if (Math.abs(dx) > 0.02 && Math.abs(dy) / Math.abs(dx) < 0.1) {
            ty = draftShape.y1;
          }
        }
        draftShape.x2 = tx;
        draftShape.y2 = ty;
      }
      redrawPageAnnotations(pageNum, draftShape);
    });

    const finishStroke = (e) => {
      if (!isDrawing) return;
      isDrawing = false;
      try { if (e && e.pointerId !== undefined) annotCanvas.releasePointerCapture(e.pointerId); } catch (err) {}

      if (pdfDrawTool === 'eraser') {
        if (erasedDuringStroke && prevShapesSnapshot) {
          const nextShapes = (activePdfAnnotations[pageNum] || []).slice();
          if (nextShapes.length === 0) delete activePdfAnnotations[pageNum];
          activePdfUndoStack.push({ pageNum, prevShapes: prevShapesSnapshot, nextShapes });
          activePdfRedoStack = [];
          savePDFAnnotationsToIDB(currentOpenPdfId, activePdfAnnotations);
        }
        erasedDuringStroke = false;
        prevShapesSnapshot = null;
        return;
      }

      if (draftShape) {
        let isValid = true;
        if (draftShape.type === 'line' || draftShape.type === 'rect' || draftShape.type === 'ellipse' || draftShape.type === 'arrow') {
          isValid = Math.hypot(draftShape.x2 - draftShape.x1, draftShape.y2 - draftShape.y1) >= 0.005;
        }
        if (isValid) {
          const prevShapes = (activePdfAnnotations[pageNum] || []).slice();
          if (!activePdfAnnotations[pageNum]) activePdfAnnotations[pageNum] = [];
          activePdfAnnotations[pageNum].push(draftShape);
          const nextShapes = activePdfAnnotations[pageNum].slice();
          activePdfUndoStack.push({ pageNum, prevShapes, nextShapes });
          if (activePdfUndoStack.length > 60) activePdfUndoStack.shift();
          activePdfRedoStack = [];
          savePDFAnnotationsToIDB(currentOpenPdfId, activePdfAnnotations);
        }
        draftShape = null;
        redrawPageAnnotations(pageNum);
      }
    };

    annotCanvas.addEventListener('pointerup', finishStroke);
    annotCanvas.addEventListener('pointercancel', finishStroke);
  }

  function ensurePageAnnotCanvas(pageNum) {
    const slot = activePdfPageSlots[pageNum - 1];
    if (!slot) return null;
    let annotCanvas = slot.querySelector('canvas.pdf-annot-canvas');
    if (!annotCanvas) {
      annotCanvas = document.createElement('canvas');
      annotCanvas.className = 'pdf-annot-canvas';
      annotCanvas.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; z-index: 5;';
      slot.appendChild(annotCanvas);
      attachAnnotCanvasEvents(annotCanvas, pageNum);
    }
    applyAnnotCanvasPointerMode(annotCanvas);
    redrawPageAnnotations(pageNum);
    return annotCanvas;
  }

  function syncAllAnnotLayersPointerMode() {
    for (let i = 0; i < activePdfPageSlots.length; i++) {
      const slot = activePdfPageSlots[i];
      if (!slot) continue;
      const pNo = i + 1;
      const hasShapes = Array.isArray(activePdfAnnotations[pNo]) && activePdfAnnotations[pNo].length > 0;
      const isRendered = activePdfRenderedPages.get(pNo) === true;
      let annotCanvas = slot.querySelector('canvas.pdf-annot-canvas');
      if (!annotCanvas && isRendered && (hasShapes || pdfDrawTool !== 'hand')) {
        annotCanvas = ensurePageAnnotCanvas(pNo);
      } else if (annotCanvas) {
        applyAnnotCanvasPointerMode(annotCanvas);
      }
    }
  }

  function setPdfDrawTool(tool) {
    pdfDrawTool = tool || 'hand';
    document.querySelectorAll('#pdf-draw-palette .pdf-draw-tool-btn').forEach((btn) => {
      const isAct = btn.dataset.tool === pdfDrawTool;
      btn.classList.toggle('active', isAct);
      btn.style.background = isAct ? 'rgba(99,102,241,0.92)' : 'transparent';
      if (btn.dataset.tool === 'eraser') {
        btn.style.color = isAct ? '#fff' : '#fca5a5';
      } else {
        btn.style.color = isAct ? '#fff' : '#e2e8f0';
      }
    });
    syncAllAnnotLayersPointerMode();
  }

  function undoPdfAnnotation() {
    if (!activePdfUndoStack.length) return;
    const action = activePdfUndoStack.pop();
    activePdfRedoStack.push(action);
    if (action.prevShapes && action.prevShapes.length > 0) {
      activePdfAnnotations[action.pageNum] = action.prevShapes.slice();
    } else {
      delete activePdfAnnotations[action.pageNum];
    }
    ensurePageAnnotCanvas(action.pageNum);
    savePDFAnnotationsToIDB(currentOpenPdfId, activePdfAnnotations);
  }

  function redoPdfAnnotation() {
    if (!activePdfRedoStack.length) return;
    const action = activePdfRedoStack.pop();
    activePdfUndoStack.push(action);
    if (action.nextShapes && action.nextShapes.length > 0) {
      activePdfAnnotations[action.pageNum] = action.nextShapes.slice();
    } else {
      delete activePdfAnnotations[action.pageNum];
    }
    ensurePageAnnotCanvas(action.pageNum);
    savePDFAnnotationsToIDB(currentOpenPdfId, activePdfAnnotations);
  }

  function clearActivePageAnnotations() {
    const pageNum = activePdfCurrentPage || 1;
    const prevShapes = (activePdfAnnotations[pageNum] || []).slice();
    if (prevShapes.length === 0) return;
    delete activePdfAnnotations[pageNum];
    activePdfUndoStack.push({ pageNum, prevShapes, nextShapes: [] });
    activePdfRedoStack = [];
    redrawPageAnnotations(pageNum);
    savePDFAnnotationsToIDB(currentOpenPdfId, activePdfAnnotations);
    if (window.showToast) window.showToast(`Sayfa ${pageNum} çizimleri temizlendi.`, 'info');
  }

  function initPdfDrawPalette() {
    if (pdfDrawInitialized) return;
    pdfDrawInitialized = true;

    const btnToggle = document.getElementById('btn-pdf-draw-toggle');
    const palette = document.getElementById('pdf-draw-palette');
    const handle = document.getElementById('pdf-draw-palette-handle');
    const stage = document.getElementById('pdf-viewer-stage');

    if (btnToggle && palette) {
      btnToggle.addEventListener('click', () => {
        if (!activePdfUsingJsViewer) return;
        pdfDrawPaletteOpen = !pdfDrawPaletteOpen;
        palette.style.display = pdfDrawPaletteOpen ? 'flex' : 'none';
        btnToggle.classList.toggle('btn-primary', pdfDrawPaletteOpen);
        btnToggle.classList.toggle('btn-outline-primary', !pdfDrawPaletteOpen);
        if (pdfDrawPaletteOpen) {
          if (pdfDrawTool === 'hand') setPdfDrawTool('line');
          if (window.safeCreateIcons) window.safeCreateIcons();
        } else {
          setPdfDrawTool('hand');
        }
      });
    }

    document.querySelectorAll('#pdf-draw-palette .pdf-draw-tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        setPdfDrawTool(btn.dataset.tool || 'hand');
      });
    });

    document.querySelectorAll('#pdf-draw-palette .pdf-draw-color-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        pdfDrawColor = btn.dataset.color || '#ef4444';
        document.querySelectorAll('#pdf-draw-palette .pdf-draw-color-btn').forEach((b) => {
          const isAct = b === btn;
          b.classList.toggle('active', isAct);
          b.style.borderColor = isAct ? '#fff' : (b.dataset.color === '#0f172a' ? 'rgba(255,255,255,0.45)' : 'transparent');
        });
        if (pdfDrawTool === 'hand' || pdfDrawTool === 'eraser') {
          setPdfDrawTool('line');
        }
      });
    });

    document.querySelectorAll('#pdf-draw-palette .pdf-draw-size-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        pdfDrawSize = parseInt(btn.dataset.size, 10) || 4;
        document.querySelectorAll('#pdf-draw-palette .pdf-draw-size-btn').forEach((b) => {
          const isAct = b === btn;
          b.classList.toggle('active', isAct);
          b.style.background = isAct ? 'rgba(99,102,241,0.35)' : 'transparent';
          b.style.borderRadius = isAct ? '6px' : '0';
          const dot = b.querySelector('span');
          if (dot) dot.style.background = isAct ? '#fff' : '#cbd5e1';
        });
      });
    });

    const btnUndo = document.getElementById('btn-pdf-draw-undo');
    const btnRedo = document.getElementById('btn-pdf-draw-redo');
    const btnClear = document.getElementById('btn-pdf-draw-clear-page');
    if (btnUndo) btnUndo.addEventListener('click', undoPdfAnnotation);
    if (btnRedo) btnRedo.addEventListener('click', redoPdfAnnotation);
    if (btnClear) btnClear.addEventListener('click', clearActivePageAnnotations);

    // Klavye kısayolları (Ctrl+Z, Ctrl+Y, ESC -> Gezinme Modu)
    document.addEventListener('keydown', (e) => {
      if (!activePdfUsingJsViewer || !currentOpenPdfId) return;
      const overlay = document.getElementById('pdf-viewer-overlay');
      if (!overlay || overlay.style.display === 'none') return;
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redoPdfAnnotation();
        else undoPdfAnnotation();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redoPdfAnnotation();
      } else if (e.key === 'Escape' && pdfDrawTool !== 'hand') {
        setPdfDrawTool('hand');
      }
    });

    // Taşınabilir Palet (Fare + Dokunmatik Pointer Events)
    if (handle && palette && stage) {
      let dragging = false;
      let startX = 0, startY = 0;
      let startLeft = 0, startTop = 0;

      handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        dragging = true;
        handle.style.cursor = 'grabbing';
        try { handle.setPointerCapture(e.pointerId); } catch (err) {}

        const stageRect = stage.getBoundingClientRect();
        const palRect = palette.getBoundingClientRect();
        startLeft = palRect.left - stageRect.left;
        startTop = palRect.top - stageRect.top;
        startX = e.clientX;
        startY = e.clientY;

        palette.style.right = 'auto';
        palette.style.left = startLeft + 'px';
        palette.style.top = startTop + 'px';
      });

      handle.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        e.preventDefault();
        const stageRect = stage.getBoundingClientRect();
        const palRect = palette.getBoundingClientRect();
        const maxLeft = Math.max(8, stageRect.width - palRect.width - 8);
        const maxTop = Math.max(8, stageRect.height - palRect.height - 8);
        const nextLeft = Math.max(8, Math.min(maxLeft, startLeft + (e.clientX - startX)));
        const nextTop = Math.max(8, Math.min(maxTop, startTop + (e.clientY - startY)));
        palette.style.left = Math.round(nextLeft) + 'px';
        palette.style.top = Math.round(nextTop) + 'px';
      });

      const stopDrag = (e) => {
        if (!dragging) return;
        dragging = false;
        handle.style.cursor = 'grab';
        try { if (e && e.pointerId !== undefined) handle.releasePointerCapture(e.pointerId); } catch (err) {}
      };
      handle.addEventListener('pointerup', stopDrag);
      handle.addEventListener('pointercancel', stopDrag);
    }
  }

  async function renderPdfJsPage(pageNum, session) {
    if (!activePdfDoc || session !== activePdfRenderSession) return;
    if (pageNum < 1 || pageNum > activePdfTotalPages) return;
    if (activePdfRenderedPages.has(pageNum)) return;

    const slot = activePdfPageSlots[pageNum - 1];
    if (!slot) return;

    activePdfRenderedPages.set(pageNum, 'loading');
    try {
      const page = await activePdfDoc.getPage(pageNum);
      if (session !== activePdfRenderSession || !activePdfDoc) return;

      const viewport = page.getViewport({ scale: activePdfScale });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      slot.style.width = Math.round(viewport.width) + 'px';
      slot.style.height = Math.round(viewport.height) + 'px';

      let canvas = slot.querySelector('canvas.pdf-page-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'pdf-page-canvas';
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        slot.innerHTML = '';
        slot.appendChild(canvas);
      }

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const renderTask = page.render({ canvasContext: ctx, viewport });
      activePdfRenderedPages.set(pageNum, renderTask);
      await renderTask.promise;

      if (session !== activePdfRenderSession) return;
      activePdfRenderedPages.set(pageNum, true);

      // Sayfanın kayıtlı çizimi varsa veya çizim modu açıksa çizim katmanını çiz (lazy)
      const hasPageAnnots = Array.isArray(activePdfAnnotations[pageNum]) && activePdfAnnotations[pageNum].length > 0;
      if (hasPageAnnots || pdfDrawTool !== 'hand') {
        ensurePageAnnotCanvas(pageNum);
      }

      // Bellek yönetimi: aktif sayfadan 14 sayfadan fazla uzaklaşmış canvas'ları temizle
      if (activePdfRenderedPages.size > 24) {
        for (const [pNo, state] of activePdfRenderedPages.entries()) {
          if (state === true && Math.abs(pNo - activePdfCurrentPage) > 14) {
            const farSlot = activePdfPageSlots[pNo - 1];
            if (farSlot) {
              farSlot.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#94a3b8;font-size:0.85rem;">Sayfa ${pNo}</div>`;
            }
            activePdfRenderedPages.delete(pNo);
          }
        }
      }
    } catch (err) {
      if (err && err.name !== 'RenderingCancelledException') {
        console.warn('PDF.js page render error (sayfa ' + pageNum + '):', err);
      }
      if (activePdfRenderedPages.get(pageNum) !== true) {
        activePdfRenderedPages.delete(pageNum);
      }
    }
  }

  function scrollToPdfPage(pageNum, scrollRatio = 0) {
    const container = document.getElementById('pdf-viewer-canvas-container');
    if (!container || !activePdfPageSlots.length) return;
    const clampedPage = Math.max(1, Math.min(activePdfPageSlots.length, parseInt(pageNum, 10) || 1));
    const slot = activePdfPageSlots[clampedPage - 1];
    if (!slot) return;

    const clampedRatio = Math.max(0, Math.min(0.95, Number(scrollRatio) || 0));
    const targetTop = Math.max(0, slot.offsetTop - 16 + Math.round(slot.offsetHeight * clampedRatio));

    activePdfIsProgrammaticScroll = true;
    container.scrollTop = targetTop;
    activePdfCurrentPage = clampedPage;
    activePdfScrollRatio = clampedRatio;

    const pageInput = document.getElementById('pdf-viewer-page-input');
    if (pageInput) pageInput.value = clampedPage;

    const session = activePdfRenderSession;
    for (let offset = -1; offset <= 2; offset++) {
      const p = clampedPage + offset;
      if (p >= 1 && p <= activePdfTotalPages) {
        renderPdfJsPage(p, session);
      }
    }

    setTimeout(() => {
      activePdfIsProgrammaticScroll = false;
    }, 120);
  }

  async function buildPdfJsPageSlots(targetPage, targetScrollRatio) {
    const container = document.getElementById('pdf-viewer-canvas-container');
    if (!container || !activePdfDoc) return;

    const session = ++activePdfRenderSession;
    if (activePdfObserver) {
      try { activePdfObserver.disconnect(); } catch (e) {}
      activePdfObserver = null;
    }
    activePdfRenderedPages.forEach((task) => {
      if (task && typeof task.cancel === 'function') {
        try { task.cancel(); } catch (e) {}
      }
    });
    activePdfRenderedPages.clear();
    activePdfPageSlots = [];
    container.innerHTML = '';

    const firstPage = await activePdfDoc.getPage(1);
    if (session !== activePdfRenderSession) return;
    const defaultVp = firstPage.getViewport({ scale: activePdfScale });
    const defaultW = Math.round(defaultVp.width);
    const defaultH = Math.round(defaultVp.height);

    const frag = document.createDocumentFragment();
    for (let i = 1; i <= activePdfTotalPages; i++) {
      const slot = document.createElement('div');
      slot.className = 'pdf-page-slot';
      slot.dataset.page = String(i);
      slot.style.cssText = `width: ${defaultW}px; height: ${defaultH}px; margin: 0 auto 18px auto; background: #ffffff; box-shadow: 0 6px 20px rgba(0,0,0,0.35); border-radius: 3px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;`;
      slot.innerHTML = `<div style="color:#94a3b8;font-size:0.85rem;">Sayfa ${i} yükleniyor...</div>`;
      activePdfPageSlots.push(slot);
      frag.appendChild(slot);
    }
    container.appendChild(frag);

    const zoomLabel = document.getElementById('pdf-viewer-zoom-label');
    if (zoomLabel) zoomLabel.textContent = Math.round(activePdfScale * 100) + '%';

    // Önce hedef konuma atla, ardından görünür sayfaları gözlemle
    scrollToPdfPage(targetPage, targetScrollRatio);

    if (typeof IntersectionObserver !== 'undefined') {
      activePdfObserver = new IntersectionObserver((entries) => {
        if (session !== activePdfRenderSession) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pNo = parseInt(entry.target.dataset.page, 10);
            if (pNo >= 1) {
              renderPdfJsPage(pNo, session);
              if (pNo + 1 <= activePdfTotalPages) renderPdfJsPage(pNo + 1, session);
            }
          }
        });
      }, { root: container, rootMargin: '900px 0px', threshold: 0.01 });

      activePdfPageSlots.forEach((slot) => activePdfObserver.observe(slot));
    }

    container.onscroll = () => {
      if (activePdfIsProgrammaticScroll || session !== activePdfRenderSession) return;
      const pos = computeCurrentPdfScrollPosition();
      activePdfCurrentPage = pos.page;
      activePdfScrollRatio = pos.scrollRatio;

      const pageInput = document.getElementById('pdf-viewer-page-input');
      if (pageInput && document.activeElement !== pageInput) {
        pageInput.value = pos.page;
      }

      if (activePdfScrollSaveTimer) clearTimeout(activePdfScrollSaveTimer);
      activePdfScrollSaveTimer = setTimeout(() => {
        if (currentOpenPdfId) {
          saveCurrentPdfPageState(currentOpenPdfId, activePdfCurrentPage, {
            scrollRatio: activePdfScrollRatio,
            scale: activePdfScale,
            name: currentOpenPdfName,
            immediate: false
          });
        }
      }, 280);
    };
  }

  async function changePdfJsZoom(newScale) {
    if (!activePdfDoc || !activePdfUsingJsViewer) return;
    const pos = computeCurrentPdfScrollPosition();
    activePdfScale = Math.max(0.5, Math.min(3.0, newScale));
    await buildPdfJsPageSlots(pos.page, pos.scrollRatio);
    if (currentOpenPdfId) {
      saveCurrentPdfPageState(currentOpenPdfId, pos.page, {
        scrollRatio: pos.scrollRatio,
        scale: activePdfScale,
        name: currentOpenPdfName,
        immediate: true
      });
    }
  }

  async function openTextbookWithPdfJs(pdf, blob, initialPos) {
    if (!window.pdfjsLib) return false;
    const container = document.getElementById('pdf-viewer-canvas-container');
    const iframe = document.getElementById('pdf-viewer-iframe');
    const totalEl = document.getElementById('pdf-viewer-total-pages');
    const zoomControls = document.getElementById('pdf-viewer-zoom-controls');
    if (!container) return false;

    try {
      cleanupPdfJsViewer();
      if (iframe) {
        iframe.src = '';
        iframe.style.display = 'none';
      }
      container.style.display = 'block';
      container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#e2e8f0;font-size:1rem;font-weight:600;">Ders kitabı hazırlanıyor...</div>`;

      const [arrayBuffer, loadedAnnots] = await Promise.all([
        blob.arrayBuffer(),
        loadPDFAnnotationsFromIDB(pdf.id)
      ]);
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      activePdfDoc = pdfDoc;
      activePdfTotalPages = pdfDoc.numPages || 1;
      activePdfUsingJsViewer = true;
      activePdfAnnotations = loadedAnnots || {};
      activePdfUndoStack = [];
      activePdfRedoStack = [];
      initPdfDrawPalette();

      const btnDrawToggle = document.getElementById('btn-pdf-draw-toggle');
      if (btnDrawToggle) {
        btnDrawToggle.style.display = 'flex';
      }

      // İlk açılış ölçeği: kayıtlı zoom varsa onu kullan, yoksa ekrana uygun hesapla
      if (initialPos && Number.isFinite(Number(initialPos.scale)) && Number(initialPos.scale) >= 0.5) {
        activePdfScale = Number(initialPos.scale);
      } else {
        try {
          const p1 = await pdfDoc.getPage(1);
          const baseVp = p1.getViewport({ scale: 1 });
          const availW = Math.max(480, (container.clientWidth || window.innerWidth) - 80);
          activePdfScale = Math.max(0.85, Math.min(1.5, Math.round((Math.min(availW, 1050) / baseVp.width) * 100) / 100));
        } catch (e) {
          activePdfScale = 1.25;
        }
      }

      if (totalEl) {
        totalEl.textContent = '/ ' + activePdfTotalPages;
        totalEl.style.display = 'inline';
      }
      if (zoomControls) {
        zoomControls.style.display = 'flex';
      }

      const startPage = Math.max(1, Math.min(activePdfTotalPages, (initialPos && initialPos.page) || 1));
      const startRatio = (initialPos && Number.isFinite(Number(initialPos.scrollRatio))) ? Number(initialPos.scrollRatio) : 0;

      await buildPdfJsPageSlots(startPage, startRatio);

      // Açılışta konumu tüm katmanlarda senkronize et
      saveCurrentPdfPageState(pdf.id, startPage, {
        scrollRatio: startRatio,
        scale: activePdfScale,
        name: pdf.name,
        immediate: false
      });
      return true;
    } catch (err) {
      console.warn('PDF.js okuyucu başlatılamadı, standart görüntüleyiciye geçiliyor:', err);
      cleanupPdfJsViewer();
      if (iframe) iframe.style.display = 'block';
      return false;
    }
  }

  async function renderTextbooksList() {
    const grid = document.getElementById('textbooks-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    try {
      const [pdfs, idbPositions] = await Promise.all([
        getAllPDFs(),
        getAllPDFPositionsFromIDB()
      ]);
      if (pdfs.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 2rem; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="background: rgba(245, 158, 11, 0.05); color: var(--warning); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto;">
              <i data-lucide="book-open" style="width: 30px; height: 30px;"></i>
            </div>
            <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem; color: var(--text-primary);">Ders Kitabı Yüklenmemiş</h4>
            <p style="font-size: 0.85rem; margin-bottom: 1.5rem;">Ders esnasında açıp kullanmak istediğiniz ders kitaplarını PDF olarak yükleyin.</p>
            <button class="btn btn-primary" id="btn-empty-upload-trigger" style="display: flex; align-items: center; gap: 0.5rem; margin: 0 auto;">
              <i data-lucide="file-plus"></i> Kitap Yükle (PDF)
            </button>
          </div>
        `;
        
        const btnEmptyTrigger = grid.querySelector('#btn-empty-upload-trigger');
        const inputUploadPdfFile = document.getElementById('input-upload-pdf-file');
        if (btnEmptyTrigger && inputUploadPdfFile) {
          btnEmptyTrigger.addEventListener('click', () => {
            inputUploadPdfFile.click();
          });
        }
        
        window.safeCreateIcons();
        return;
      }
      
      // Sort by uploaded date descending
      pdfs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      
      pdfs.forEach(pdf => {
        const card = document.createElement('div');
        card.className = 'glass-card book-card';
        card.style.cssText = 'position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem; text-align: center; gap: 0.5rem; min-height: 200px;';
        const bestPos = getBestTextbookPosition(pdf.id, pdf.name, pdf, idbPositions[pdf.id] || null);
        const savedPage = bestPos.page || 1;

        card.innerHTML = `
          <div class="card-actions" style="position: absolute; top: 8px; right: 8px; z-index: 10;">
            <button class="action-btn-sm delete-btn btn-delete-pdf" data-id="${pdf.id}" title="Kitabı Sil" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); border: none; border-radius: var(--radius-sm); padding: 0.35rem; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition-fast);">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
          <div class="book-cover-container" style="position: relative; width: 100px; height: 130px; margin-bottom: 0.5rem; border-radius: var(--radius-sm); overflow: hidden; box-shadow: var(--shadow-sm); border: 1px solid var(--border-color);">
            ${pdf.cover 
              ? `<img src="${pdf.cover}" style="width: 100%; height: 100%; object-fit: cover;">`
              : `<div class="book-cover" style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">
                  <i data-lucide="file-text"></i>
                 </div>`
            }
            <button class="btn-change-cover" data-id="${pdf.id}" style="position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.65); color: white; border: none; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition-fast);" title="Kapak Resmi Yükle">
              <i data-lucide="camera" style="width: 12px; height: 12px;"></i>
            </button>
          </div>
          <strong style="display: block; font-size: 0.85rem; color: var(--text-primary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; width: 100%;" title="${pdf.name}">${pdf.name}</strong>
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 0.2rem;">
            <span style="font-size: 0.72rem; color: var(--text-muted);">${(pdf.size / (1024 * 1024)).toFixed(2)} MB</span>
            <span style="font-size: 0.72rem; color: var(--primary); font-weight: 700; display: flex; align-items: center; gap: 0.2rem;">
              <i data-lucide="bookmark" style="width: 12px; height: 12px;"></i> Sayfa ${savedPage}
            </span>
          </div>
          <button class="btn btn-sm btn-primary btn-open-pdf" data-id="${pdf.id}" style="margin-top: 0.5rem; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.25rem;">
            <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Kitabı Aç
          </button>
        `;
        
        // Bind Kapak Resmi Yükle button click
        card.querySelector('.btn-change-cover').addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          currentCoverPdfId = pdf.id;
          const inputUploadCoverFile = document.getElementById('input-upload-cover-file');
          if (inputUploadCoverFile) {
            inputUploadCoverFile.click();
          }
        });

        // Bind Sil button click
        card.querySelector('.btn-delete-pdf').addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm(`"${pdf.name}" kitabını silmek istediğinize emin misiniz?`)) {
            try {
              await deletePDF(pdf.id);
              if (window.showToast) window.showToast('Kitap silindi.', 'success');
              renderTextbooksList();
            } catch (err) {
              console.error("Delete PDF error:", err);
              if (window.showToast) window.showToast('Kitap silinirken hata oluştu!', 'danger');
            }
          }
        });
        
        // Bind Kitabı Aç click
        card.querySelector('.btn-open-pdf').addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            if (window.showToast) window.showToast('Kitap açılıyor...', 'info');
            const [data, idbPos] = await Promise.all([
              getPDF(pdf.id),
              getPDFPositionFromIDB(pdf.id)
            ]);
            if (data && data.blob) {
              const overlay = document.getElementById('pdf-viewer-overlay');
              const iframe = document.getElementById('pdf-viewer-iframe');
              const title = document.getElementById('pdf-viewer-title');
              const pageInput = document.getElementById('pdf-viewer-page-input');
              
              currentOpenPdfId = pdf.id;
              currentOpenPdfName = pdf.name || data.name || '';
              
              if (overlay && title) {
                const bestPos = getBestTextbookPosition(pdf.id, currentOpenPdfName, data, idbPos);
                const lastPage = Math.max(1, bestPos.page || 1);
                activePdfCurrentPage = lastPage;
                activePdfScrollRatio = bestPos.scrollRatio || 0;

                if (pageInput) {
                  pageInput.value = lastPage;
                }

                title.textContent = currentOpenPdfName;
                overlay.style.display = 'flex';
                if (window.safeCreateIcons) window.safeCreateIcons();

                // Önce PDF.js okuyucu ile aç (otomatik scroll + sayfa + zoom kalıcılığı)
                const openedWithJs = await openTextbookWithPdfJs(pdf, data.blob, bestPos);

                if (!openedWithJs && iframe) {
                  iframe.style.display = 'block';
                  try {
                    saveCurrentPdfPageState(pdf.id, lastPage, {
                      scrollRatio: 0,
                      scale: activePdfScale,
                      name: currentOpenPdfName,
                      immediate: false
                    });
                  } catch (errState) {
                    console.warn("saveCurrentPdfPageState error on open:", errState);
                  }
                  if (currentOpenPdfUrl) {
                    try { URL.revokeObjectURL(currentOpenPdfUrl); } catch (e) {}
                  }
                  currentOpenPdfUrl = URL.createObjectURL(data.blob);
                  iframe.src = currentOpenPdfUrl + '#page=' + lastPage;
                }

                // Canlı Ders Bilgisini Başlat
                if (typeof updatePdfViewerLiveInfo === 'function') {
                  updatePdfViewerLiveInfo();
                  if (pdfLiveInterval) clearInterval(pdfLiveInterval);
                  pdfLiveInterval = setInterval(updatePdfViewerLiveInfo, 30000);
                }
              }
            } else {
              if (window.showToast) window.showToast('Kitap verisi yüklenemedi!', 'danger');
            }
          } catch (err) {
            console.error("Open PDF error:", err);
            if (window.showToast) window.showToast('Kitap açılırken hata oluştu!', 'danger');
          }
        });
        
        grid.appendChild(card);
      });
      
      window.safeCreateIcons();
    } catch (err) {
      console.error("Load textbooks error:", err);
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">Kitaplar yüklenirken hata oluştu.</div>';
    }
  }

  // Global Metot Olarak Tanımla (app.js çağırabilmesi için)
  window.renderNotebooks = () => {
    // DOM hazır değilse init çağır
    if (!notebookGrid) {
      init();
    } else {
      const activeMaterialsTabBtn = document.querySelector('.sub-tab-menu button[data-materials-tab].active');
      const activeTab = activeMaterialsTabBtn ? activeMaterialsTabBtn.getAttribute('data-materials-tab') : 'notebooks';
      
      if (activeTab === 'notebooks') {
        if (currentNotebookId) {
          const notebooks = window.stateManager ? window.stateManager.getNotebooks() : [];
          const notebook = notebooks.find(nb => nb.id === currentNotebookId);
          if (notebook) {
            renderTopicList(notebook);
          } else {
            showGridView();
          }
        } else {
          showGridView();
        }
      } else if (activeTab === 'textbooks') {
        renderTextbooksList();
      }
    }
  };

  // Safe startup on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
