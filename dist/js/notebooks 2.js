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
  let btnFullscreenNotebook = null;
  let btnFullscreenClose = null;
  let btnFullscreenRedTitle = null;
  let btnFullscreenAddImage = null;
  let btnFullscreenSave = null;
  let notebookFullscreenColorIndicator = null;
  let btnMathDropdownTrigger = null;
  let mathDropdownMenu = null;
  let btnFullscreenMathTrigger = null;
  let fullscreenMathDropdownMenu = null;

  // Yapışkan not değişkenleri
  let btnAddStickyNote = null;
  let btnFullscreenAddStickyNote = null;
  let modalStickyNote = null;
  let formStickyNote = null;
  let btnCloseStickyNoteModal = null;
  let btnCancelStickyNoteModal = null;
  let stickyNoteText = null;

  // Liste düğmeleri değişkenleri
  let btnListBullet = null;
  let btnListNumber = null;
  let btnFullscreenListBullet = null;
  let btnFullscreenListNumber = null;

  // Tablo ekleme değişkenleri
  let btnAddTable = null;
  let btnFullscreenAddTable = null;
  let modalTable = null;
  let formTable = null;
  let btnCloseTableModal = null;
  let btnCancelTableModal = null;
  let tableRowsInput = null;
  let tableColsInput = null;

  let btnPrintNotebook = null;
  let btnFullscreenPrintNotebook = null;
  let notebookPrintArea = null;

  let currentNotebookId = null;
  let currentTopicId = null;
  let autoSaveTimeout = null;
  let isRedMode = false;
  let savedRange = null;
  let currentCoverPdfId = null;
  let currentOpenPdfId = null;
  let currentOpenPdfUrl = null;


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
    btnFullscreenNotebook = document.getElementById('btn-fullscreen-notebook');
    btnFullscreenClose = document.getElementById('btn-fullscreen-close');
    btnFullscreenRedTitle = document.getElementById('btn-fullscreen-red-title');
    btnFullscreenAddImage = document.getElementById('btn-fullscreen-add-image');
    btnFullscreenSave = document.getElementById('btn-fullscreen-save');
    notebookFullscreenColorIndicator = document.getElementById('notebook-fullscreen-color-indicator');
    btnMathDropdownTrigger = document.getElementById('btn-math-dropdown-trigger');
    mathDropdownMenu = document.getElementById('math-dropdown-menu');
    btnFullscreenMathTrigger = document.getElementById('btn-fullscreen-math-trigger');
    fullscreenMathDropdownMenu = document.getElementById('fullscreen-math-dropdown-menu');

    btnAddStickyNote = document.getElementById('btn-add-sticky-note');
    btnFullscreenAddStickyNote = document.getElementById('btn-fullscreen-add-sticky-note');
    modalStickyNote = document.getElementById('modal-sticky-note');
    formStickyNote = document.getElementById('form-sticky-note');
    btnCloseStickyNoteModal = document.getElementById('btn-close-sticky-note-modal');
    btnCancelStickyNoteModal = document.getElementById('btn-cancel-sticky-note-modal');
    stickyNoteText = document.getElementById('sticky-note-text');

    btnListBullet = document.getElementById('btn-list-bullet');
    btnListNumber = document.getElementById('btn-list-number');
    btnFullscreenListBullet = document.getElementById('btn-fullscreen-list-bullet');
    btnFullscreenListNumber = document.getElementById('btn-fullscreen-list-number');

    btnAddTable = document.getElementById('btn-add-table');
    btnFullscreenAddTable = document.getElementById('btn-fullscreen-add-table');
    modalTable = document.getElementById('modal-table');
    formTable = document.getElementById('form-table');
    btnCloseTableModal = document.getElementById('btn-close-table-modal');
    btnCancelTableModal = document.getElementById('btn-cancel-table-modal');
    tableRowsInput = document.getElementById('table-rows');
    tableColsInput = document.getElementById('table-cols');

    btnPrintNotebook = document.getElementById('btn-print-notebook');
    btnFullscreenPrintNotebook = document.getElementById('btn-fullscreen-print-notebook');
    notebookPrintArea = document.getElementById('notebook-print-area');

    // Güvenlik Kontrolü: Kritik DOM elemanları mevcut değilse kurulumu atla
    if (!notebookGrid || !modalNotebook || !formNotebook) {
      return;
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

    const btnClosePdfViewer = document.getElementById('btn-close-pdf-viewer');
    if (btnClosePdfViewer) {
      btnClosePdfViewer.addEventListener('click', () => {
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
      });
    }

    const pdfViewerPageInput = document.getElementById('pdf-viewer-page-input');
    if (pdfViewerPageInput) {
      pdfViewerPageInput.addEventListener('change', async (e) => {
        let pageNum = parseInt(e.target.value) || 1;
        if (pageNum < 1) pageNum = 1;
        e.target.value = pageNum;
        
        if (currentOpenPdfId) {
          try {
            const pdfRecord = await getPDF(currentOpenPdfId);
            if (pdfRecord) {
              pdfRecord.lastPage = pageNum;
              await savePDFRecord(pdfRecord);
              
              const iframe = document.getElementById('pdf-viewer-iframe');
              if (iframe && currentOpenPdfUrl) {
                iframe.src = currentOpenPdfUrl + '#page=' + pageNum;
              }
            }
          } catch (err) {
            console.error("Save PDF page error:", err);
          }
        }
      });
    }

    const btnPdfPrevPage = document.getElementById('btn-pdf-prev-page');
    const btnPdfNextPage = document.getElementById('btn-pdf-next-page');
    if (btnPdfPrevPage && btnPdfNextPage && pdfViewerPageInput) {
      btnPdfPrevPage.addEventListener('click', () => {
        let pageNum = parseInt(pdfViewerPageInput.value) || 1;
        if (pageNum > 1) {
          pageNum--;
          pdfViewerPageInput.value = pageNum;
          pdfViewerPageInput.dispatchEvent(new Event('change'));
        }
      });

      btnPdfNextPage.addEventListener('click', () => {
        let pageNum = parseInt(pdfViewerPageInput.value) || 1;
        pageNum++;
        pdfViewerPageInput.value = pageNum;
        pdfViewerPageInput.dispatchEvent(new Event('change'));
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

    if (btnAddStickyNote) btnAddStickyNote.addEventListener('click', openStickyNoteModalFn);
    if (btnFullscreenAddStickyNote) btnFullscreenAddStickyNote.addEventListener('click', openStickyNoteModalFn);

    if (formStickyNote) {
      formStickyNote.addEventListener('submit', handleAddStickyNoteSubmit);
    }

    // Liste Olay Dinleyicileri
    const handleBulletListToggle = () => {
      if (notebookTextarea) {
        notebookTextarea.focus();
        document.execCommand('insertUnorderedList', false, null);
        triggerAutoSave();
      }
    };
    const handleNumberListToggle = () => {
      if (notebookTextarea) {
        notebookTextarea.focus();
        document.execCommand('insertOrderedList', false, null);
        triggerAutoSave();
      }
    };

    if (btnListBullet) btnListBullet.addEventListener('click', handleBulletListToggle);
    if (btnFullscreenListBullet) btnFullscreenListBullet.addEventListener('click', handleBulletListToggle);
    if (btnListNumber) btnListNumber.addEventListener('click', handleNumberListToggle);
    if (btnFullscreenListNumber) btnFullscreenListNumber.addEventListener('click', handleNumberListToggle);

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

    if (btnAddTable) btnAddTable.addEventListener('click', openTableModalFn);
    if (btnFullscreenAddTable) btnFullscreenAddTable.addEventListener('click', openTableModalFn);

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
      btnAddImage.addEventListener('click', () => {
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
      notebookTextarea.addEventListener('input', triggerAutoSave);

      const updateSavedRange = () => {
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
      };
      notebookTextarea.addEventListener('keyup', updateSavedRange);
      notebookTextarea.addEventListener('mouseup', updateSavedRange);
      notebookTextarea.addEventListener('click', updateSavedRange);
      notebookTextarea.addEventListener('focus', updateSavedRange);
      
      // Görsel, Tablo ve Yapışkan Not Silme Olayı (Delegation)
      notebookTextarea.addEventListener('click', (e) => {
        if (e.target) {
          if (e.target.classList.contains('image-delete-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const wrapper = e.target.closest('.notebook-image-wrapper');
            if (wrapper) {
              wrapper.remove();
              triggerAutoSave();
            }
          } else if (e.target.classList.contains('table-delete-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const wrapper = e.target.closest('.notebook-table-wrapper');
            if (wrapper) {
              wrapper.remove();
              triggerAutoSave();
            }
          } else if (e.target.classList.contains('sticky-delete-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const note = e.target.closest('.sticky-note-block');
            if (note) {
              note.remove();
              triggerAutoSave();
            }
          }
        }
      });
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
      if (notebookFullscreenColorIndicator) {
        notebookFullscreenColorIndicator.style.backgroundColor = color;
      }

      if (notebookTextarea) {
        notebookTextarea.focus();
      }
      document.execCommand('foreColor', false, color);
    };

    if (btnRedTitle) {
      btnRedTitle.addEventListener('click', toggleTextColorRed);
    }
    if (btnFullscreenRedTitle) {
      btnFullscreenRedTitle.addEventListener('click', toggleTextColorRed);
    }

    // Tam Ekran Buton Olayları
    if (btnFullscreenNotebook) {
      btnFullscreenNotebook.addEventListener('click', toggleFullscreen);
    }
    if (btnFullscreenClose) {
      btnFullscreenClose.addEventListener('click', toggleFullscreen);
    }

    // Tam Ekran Kaydet Olayı
    if (btnFullscreenSave) {
      btnFullscreenSave.addEventListener('click', saveActiveNotebookManual);
    }

    // Tam Ekran Görsel Ekle Olayı
    if (btnFullscreenAddImage) {
      btnFullscreenAddImage.addEventListener('click', () => {
        if (notebookImageInput) {
          notebookImageInput.click();
        }
      });
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
        if (mathDropdownMenu) mathDropdownMenu.style.display = 'none';
        if (fullscreenMathDropdownMenu) fullscreenMathDropdownMenu.style.display = 'none';
        
        mathDropdownMenu.style.display = isShown ? 'none' : 'block';
      });
    }

    if (mathDropdownMenu) {
      mathDropdownMenu.addEventListener('mousedown', preventFocusLoss);
    }

    if (btnFullscreenMathTrigger && fullscreenMathDropdownMenu) {
      btnFullscreenMathTrigger.addEventListener('mousedown', preventFocusLoss);
      btnFullscreenMathTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShown = fullscreenMathDropdownMenu.style.display === 'block';
        if (mathDropdownMenu) mathDropdownMenu.style.display = 'none';
        if (fullscreenMathDropdownMenu) fullscreenMathDropdownMenu.style.display = 'none';

        fullscreenMathDropdownMenu.style.display = isShown ? 'none' : 'block';
      });
    }

    if (fullscreenMathDropdownMenu) {
      fullscreenMathDropdownMenu.addEventListener('mousedown', preventFocusLoss);
    }

    // Dropdown Dışına Tıklandığında Kapatma
    document.addEventListener('click', (e) => {
      if (mathDropdownMenu && btnMathDropdownTrigger && !btnMathDropdownTrigger.contains(e.target) && !mathDropdownMenu.contains(e.target)) {
        mathDropdownMenu.style.display = 'none';
      }
      if (fullscreenMathDropdownMenu && btnFullscreenMathTrigger && !btnFullscreenMathTrigger.contains(e.target) && !fullscreenMathDropdownMenu.contains(e.target)) {
        fullscreenMathDropdownMenu.style.display = 'none';
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
        if (fullscreenMathDropdownMenu) fullscreenMathDropdownMenu.style.display = 'none';
      }
    });

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
      }

      // Kırmızı modunu sıfırla
      isRedMode = false;
      if (notebookColorIndicator) {
        notebookColorIndicator.style.backgroundColor = '#1e293b';
      }
      if (notebookFullscreenColorIndicator) {
        notebookFullscreenColorIndicator.style.backgroundColor = '#1e293b';
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

  // Tam ekran modunu aç/kapat
  function toggleFullscreen() {
    if (!notebookEditorContainer || !btnFullscreenNotebook) return;
    const isFullscreen = notebookEditorContainer.classList.toggle('fullscreen');
    
    const icon = btnFullscreenNotebook.querySelector('i');
    const textNode = [...btnFullscreenNotebook.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
    
    if (isFullscreen) {
      if (icon) {
        icon.setAttribute('data-lucide', 'minimize');
        if (window.lucide) window.lucide.createIcons();
      }
      if (textNode) textNode.textContent = ' Küçült';
    } else {
      resetFullscreenButton();
    }
  }

  // Tam ekran butonu durumunu sıfırla
  function resetFullscreenButton() {
    if (!btnFullscreenNotebook) return;
    const icon = btnFullscreenNotebook.querySelector('i');
    const textNode = [...btnFullscreenNotebook.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
    
    if (icon) {
      icon.setAttribute('data-lucide', 'maximize');
      if (window.lucide) window.lucide.createIcons();
    }
    if (textNode) textNode.textContent = ' Tam Ekran';
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

    if (notebookTextarea) {
      notebookTextarea.focus();
    }

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

    if (notebookTextarea) {
      notebookTextarea.focus();
    }

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

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        // Resize image to max 800px width/height to protect localStorage space limit
        const canvas = document.createElement('canvas');
        const max_size = 800;
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

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG with 0.7 quality to reduce string size in localStorage
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        // Image tag wrapped in a hoverable container with a delete button overlay
        const imgHtml = `<div class="notebook-image-wrapper" contenteditable="false"><img src="${dataUrl}" alt="Görsel"><button class="image-delete-btn" type="button" title="Görseli Sil">&times;</button></div>&nbsp;`;
        
        // Focus textarea
        if (notebookTextarea) {
          notebookTextarea.focus();
        }

        const inserted = insertHtmlAtCursor(imgHtml);
        if (!inserted && notebookTextarea) {
          // Fallback: append at the end
          notebookTextarea.innerHTML += imgHtml + ' ';
        }

        // Trigger autosave
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
      if (notebookTextarea) {
        notebookTextarea.focus();
      }
      const inserted = insertHtmlAtCursor(html);
      if (!inserted && notebookTextarea) {
        notebookTextarea.innerHTML += html + ' ';
      }
      triggerAutoSave();
    }
  }

  function insertHtmlAtCursor(html, isBlockElement = false) {
    if (!notebookTextarea) return false;
    let sel, range;
    if (window.getSelection) {
      sel = window.getSelection();
      
      // Restore savedRange if it exists
      if (savedRange) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }

      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        // Ensure selection is inside notebookTextarea
        let container = range.commonAncestorContainer;
        if (container.nodeType === 3) {
          container = container.parentNode;
        }
        
        // Search parents if it is notebookTextarea
        let isInside = false;
        let node = container;
        let parentBlock = container;
        while (node) {
          if (node === notebookTextarea) {
            isInside = true;
            break;
          }
          parentBlock = node;
          node = node.parentNode;
        }

        if (isInside) {
          if (isBlockElement && parentBlock && parentBlock !== notebookTextarea) {
            const isEmptyLine = parentBlock.textContent.trim() === '' && 
                                (parentBlock.innerHTML === '<br>' || parentBlock.querySelector('br') || parentBlock.innerHTML === '');
            
            const el = document.createElement("div");
            el.innerHTML = html;
            const frag = document.createDocumentFragment();
            let childNode, lastNode;
            while ((childNode = el.firstChild)) {
              lastNode = frag.appendChild(childNode);
            }

            if (isEmptyLine) {
              // Replace parentBlock with the fragment
              notebookTextarea.insertBefore(frag, parentBlock);
              notebookTextarea.removeChild(parentBlock);
            } else {
              try {
                // Split parentBlock at cursor
                const leftRange = document.createRange();
                leftRange.setStart(parentBlock, 0);
                leftRange.setEnd(range.startContainer, range.startOffset);
                const leftFragment = leftRange.extractContents();
                
                const leftBlock = document.createElement(parentBlock.tagName || 'DIV');
                if (parentBlock.className) leftBlock.className = parentBlock.className;
                if (parentBlock.style.cssText) leftBlock.style.cssText = parentBlock.style.cssText;
                leftBlock.appendChild(leftFragment);
                
                notebookTextarea.insertBefore(leftBlock, parentBlock);
                notebookTextarea.insertBefore(frag, parentBlock);
                
                if (parentBlock.textContent.trim() === '' && parentBlock.innerHTML === '') {
                  parentBlock.innerHTML = '<br>';
                }
              } catch (err) {
                // Fallback to simple insertNode
                range.deleteContents();
                range.insertNode(frag);
              }
            }

            if (lastNode) {
              range = document.createRange();
              range.setStartAfter(lastNode);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
              savedRange = range.cloneRange();
            }
            return true;
          } else {
            // Original inline insertion behavior
            range.deleteContents();
            const el = document.createElement("div");
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
        }
      }
    }
    return false;
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
  const DB_VERSION = 1;
  const STORE_NAME = 'pdfs';

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
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

  async function renderTextbooksList() {
    const grid = document.getElementById('textbooks-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    try {
      const pdfs = await getAllPDFs();
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
        card.innerHTML = `
          <div class="student-actions" style="position: absolute; top: 10px; right: 10px;">
            <button class="action-btn-sm delete btn-delete-pdf" data-id="${pdf.id}" title="Sil">
              <i data-lucide="trash-2"></i>
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
          <span style="font-size: 0.75rem; color: var(--text-muted);">${(pdf.size / (1024 * 1024)).toFixed(2)} MB</span>
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
            const data = await getPDF(pdf.id);
            if (data && data.blob) {
              const overlay = document.getElementById('pdf-viewer-overlay');
              const iframe = document.getElementById('pdf-viewer-iframe');
              const title = document.getElementById('pdf-viewer-title');
              const pageInput = document.getElementById('pdf-viewer-page-input');
              
              currentOpenPdfId = pdf.id;
              
              if (overlay && iframe && title) {
                const lastPage = data.lastPage || 1;
                if (pageInput) {
                  pageInput.value = lastPage;
                }
                
                currentOpenPdfUrl = URL.createObjectURL(data.blob);
                iframe.src = currentOpenPdfUrl + '#page=' + lastPage;
                title.textContent = pdf.name;
                overlay.style.display = 'flex';
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
