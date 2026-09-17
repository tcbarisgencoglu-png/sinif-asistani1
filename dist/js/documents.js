(() => {
  // Kişisel Evrak Deposu Modülü

  let toastCallbackFn = null;
  let selectedFileData = null;
  let activeViewerDoc = null;

  // DOM Elemanları
  let btnLaunchDocuments;
  let toolsLandingView;
  let toolsDocumentsView;
  let btnBackToToolsFromDocuments;

  let documentsListContainer;
  let documentsEmptyState;
  let btnShowDocumentUploadModal;
  let btnUploadFirstDocument;

  // Kategori / Sekme Yönetimi DOM
  let documentsCategoriesTabBar;
  let btnAddDocumentCategory;
  let documentsActiveCategoryHeader;
  let documentsActiveCategoryTitle;
  let documentsActiveCategoryCountBadge;
  let documentsCategoryControls;
  let btnRenameCurrentCategory;
  let btnDeleteCurrentCategory;
  let currentActiveCategoryId = 'all'; // 'all' | 'uncategorized' | categoryId

  // Upload Modal DOM
  let modalUploadDocument;
  let docUploadTitle;
  let docUploadCategorySelect;
  let docDragDropArea;
  let btnSelectDocumentFile;
  let inputDocumentFile;
  let docSelectedFileInfo;
  let docSelectedFileName;
  let btnClearSelectedDoc;
  let btnUploadDocCancel;
  let btnSaveDocument;

  // Viewer Modal DOM
  let modalViewDocument;
  let docViewerTitle;
  let docViewerBody;
  let btnPrintViewerDocument;
  let btnDownloadViewerDocument;
  let btnFullscreenViewerDocument;

  // Print Area DOM
  let documentPrintArea;

  // DOSYA BOYUT SINIRI (IndexedDB kullanıldığı için 25 MB'a yükseltildi)
  const MAX_FILE_SIZE = 25 * 1024 * 1024;

  // IndexedDB - Evrak Deposu Veritabanı (Büyük dosyaların localStorage'ı doldurmasını önler)
  const DOCS_DB_NAME = 'DocumentsStorageDB';
  const DOCS_DB_VERSION = 1;
  const DOCS_STORE_NAME = 'document_files';

  function openDocsDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DOCS_DB_NAME, DOCS_DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(DOCS_STORE_NAME)) {
          db.createObjectStore(DOCS_STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(request.error);
    });
  }

  async function saveDocumentFile(id, content, htmlContent) {
    const db = await openDocsDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DOCS_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(DOCS_STORE_NAME);
      const request = store.put({ id, content: content || '', htmlContent: htmlContent || '' });
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async function getDocumentFile(id) {
    const db = await openDocsDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DOCS_STORE_NAME, 'readonly');
      const store = transaction.objectStore(DOCS_STORE_NAME);
      const request = store.get(id);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function deleteDocumentFile(id) {
    try {
      const db = await openDocsDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(DOCS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(DOCS_STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("deleteDocumentFile error:", e);
    }
  }

  // Mevcut evrakları IndexedDB'ye taşıma ve localStorage'ı temizleme (Otomatik Migrasyon)
  async function migrateExistingDocumentsToIndexedDB() {
    try {
      const state = stateManager.loadState();
      const docs = state.documents || [];
      let migratedAny = false;

      for (const doc of docs) {
        if (doc.content || doc.htmlContent) {
          await saveDocumentFile(doc.id, doc.content || '', doc.htmlContent || '');
          delete doc.content;
          delete doc.htmlContent;
          migratedAny = true;
        }
      }

      if (migratedAny) {
        stateManager.saveState();
        console.log("Mevcut evrak dosyaları IndexedDB'ye taşındı ve localStorage boşaltıldı.");
      }
    } catch (e) {
      console.warn("Evrak migrasyon uyarısı:", e);
    }
  }

  function setupDocuments(toastCallback) {
    toastCallbackFn = toastCallback;

    // Arka planda eski evrakları IndexedDB'ye taşı ve localStorage'ı anında boşalt
    migrateExistingDocumentsToIndexedDB();

    // DOM Elemanlarını Bağla
    btnLaunchDocuments = document.getElementById('btn-launch-documents');
    toolsLandingView = document.getElementById('tools-landing-view');
    toolsDocumentsView = document.getElementById('tools-documents-view');
    btnBackToToolsFromDocuments = document.getElementById('btn-back-to-tools-from-documents');

    documentsListContainer = document.getElementById('documents-list-container');
    documentsEmptyState = document.getElementById('documents-empty-state');
    btnShowDocumentUploadModal = document.getElementById('btn-show-document-upload-modal');
    btnUploadFirstDocument = document.getElementById('btn-upload-first-document');

    // Kategori DOM
    documentsCategoriesTabBar = document.getElementById('documents-categories-tab-bar');
    btnAddDocumentCategory = document.getElementById('btn-add-document-category');
    documentsActiveCategoryHeader = document.getElementById('documents-active-category-header');
    documentsActiveCategoryTitle = document.getElementById('documents-active-category-title');
    documentsActiveCategoryCountBadge = document.getElementById('documents-active-category-count-badge');
    documentsCategoryControls = document.getElementById('documents-category-controls');
    btnRenameCurrentCategory = document.getElementById('btn-rename-current-category');
    btnDeleteCurrentCategory = document.getElementById('btn-delete-current-category');

    // Upload Modal
    modalUploadDocument = document.getElementById('modal-upload-document');
    docUploadTitle = document.getElementById('doc-upload-title');
    docUploadCategorySelect = document.getElementById('doc-upload-category-select');
    docDragDropArea = document.getElementById('doc-drag-drop-area');
    btnSelectDocumentFile = document.getElementById('btn-select-document-file');
    inputDocumentFile = document.getElementById('input-document-file');
    docSelectedFileInfo = document.getElementById('doc-selected-file-info');
    docSelectedFileName = document.getElementById('doc-selected-file-name');
    btnClearSelectedDoc = document.getElementById('btn-clear-selected-doc');
    btnUploadDocCancel = document.getElementById('btn-upload-doc-cancel');
    btnSaveDocument = document.getElementById('btn-save-document');

    // Viewer Modal
    modalViewDocument = document.getElementById('modal-view-document');
    docViewerTitle = document.getElementById('doc-viewer-title');
    docViewerBody = document.getElementById('doc-viewer-body');
    btnPrintViewerDocument = document.getElementById('btn-print-viewer-document');
    btnDownloadViewerDocument = document.getElementById('btn-download-viewer-document');
    btnFullscreenViewerDocument = document.getElementById('btn-fullscreen-viewer-document');

    // Print Area
    documentPrintArea = document.getElementById('document-print-area');

    // Event Listeners
    if (btnLaunchDocuments) {
      btnLaunchDocuments.addEventListener('click', () => {
        toolsLandingView.style.display = 'none';
        toolsDocumentsView.style.display = 'block';
        renderCategoryTabs();
        renderDocumentsList();
      });
    }

    if (btnBackToToolsFromDocuments) {
      btnBackToToolsFromDocuments.addEventListener('click', () => {
        toolsDocumentsView.style.display = 'none';
        toolsLandingView.style.display = 'block';
      });
    }

    // Yeni Sekme Ekle Butonu
    if (btnAddDocumentCategory) {
      btnAddDocumentCategory.addEventListener('click', addNewCategoryPrompt);
    }

    // Aktif Sekmeyi Düzenle
    if (btnRenameCurrentCategory) {
      btnRenameCurrentCategory.addEventListener('click', renameCurrentCategoryPrompt);
    }

    // Aktif Sekmeyi Sil
    if (btnDeleteCurrentCategory) {
      btnDeleteCurrentCategory.addEventListener('click', deleteCurrentCategoryPrompt);
    }

    // Modal Açma/Kapama
    const openUploadModal = () => {
      resetUploadForm();
      populateCategoryDropdown();
      modalUploadDocument.classList.add('active');
    };

    if (btnShowDocumentUploadModal) btnShowDocumentUploadModal.addEventListener('click', openUploadModal);
    if (btnUploadFirstDocument) btnUploadFirstDocument.addEventListener('click', openUploadModal);

    modalUploadDocument.querySelectorAll('.close-btn, #btn-upload-doc-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        modalUploadDocument.classList.remove('active');
      });
    });

    modalViewDocument.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modalViewDocument.classList.remove('active');
        modalViewDocument.classList.remove('fullscreen-mode');
        resetFullscreenButton();
        activeViewerDoc = null;
      });
    });

    // Dosya Seçme
    if (btnSelectDocumentFile && inputDocumentFile) {
      btnSelectDocumentFile.addEventListener('click', () => inputDocumentFile.click());
      inputDocumentFile.addEventListener('change', handleFileChange);
    }

    if (btnClearSelectedDoc) {
      btnClearSelectedDoc.addEventListener('click', clearSelectedFile);
    }

    // Sürükle Bırak
    if (docDragDropArea) {
      ['dragenter', 'dragover'].forEach(eventName => {
        docDragDropArea.addEventListener(eventName, (e) => {
          e.preventDefault();
          docDragDropArea.classList.add('dragover');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        docDragDropArea.addEventListener(eventName, (e) => {
          e.preventDefault();
          docDragDropArea.classList.remove('dragover');
        }, false);
      });

      docDragDropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
          inputDocumentFile.files = files;
          handleFileChange({ target: inputDocumentFile });
        }
      }, false);
    }

    // Kaydetme
    if (btnSaveDocument) {
      btnSaveDocument.addEventListener('click', saveUploadedDocument);
    }

    // Okuyucu Butonları
    if (btnDownloadViewerDocument) {
      btnDownloadViewerDocument.addEventListener('click', () => {
        if (activeViewerDoc) {
          downloadDocument(activeViewerDoc);
        }
      });
    }

    if (btnPrintViewerDocument) {
      btnPrintViewerDocument.addEventListener('click', () => {
        if (activeViewerDoc) {
          printDocument(activeViewerDoc);
        }
      });
    }

    if (btnFullscreenViewerDocument) {
      btnFullscreenViewerDocument.addEventListener('click', toggleFullscreen);
    }

    // Global state değiştiğinde listeyi ve sekmeleri yenile
    document.addEventListener('stateChanged', () => {
      if (toolsDocumentsView && toolsDocumentsView.style.display === 'block') {
        renderCategoryTabs();
        renderDocumentsList();
      }
    });
  }

  // --- KATEGORİ / SEKME YÖNETİMİ ---

  // Sekmeleri Render Et
  function renderCategoryTabs() {
    if (!documentsCategoriesTabBar) return;

    const state = stateManager.loadState();
    const categories = stateManager.getDocumentCategories();
    const allDocs = state.documents || [];

    // Sayaçlar
    const totalCount = allDocs.length;
    const uncategorizedCount = allDocs.filter(d => !d.categoryId).length;

    documentsCategoriesTabBar.innerHTML = '';

    // 1. Tüm Evraklar Sekmesi
    const allTabBtn = document.createElement('button');
    allTabBtn.className = `sub-tab-btn ${currentActiveCategoryId === 'all' ? 'active' : ''}`;
    allTabBtn.innerHTML = `
      <i data-lucide="files" style="width: 16px; height: 16px;"></i>
      <span>Tüm Evraklar</span>
      <span class="badge" style="background: rgba(255,255,255,0.15); font-size: 0.72rem; padding: 0.1rem 0.45rem; border-radius: 10px;">${totalCount}</span>
    `;
    allTabBtn.addEventListener('click', () => selectCategoryTab('all'));
    documentsCategoriesTabBar.appendChild(allTabBtn);

    // 2. Genel / Kategorisiz Sekmesi
    const uncatTabBtn = document.createElement('button');
    uncatTabBtn.className = `sub-tab-btn ${currentActiveCategoryId === 'uncategorized' ? 'active' : ''}`;
    uncatTabBtn.innerHTML = `
      <i data-lucide="inbox" style="width: 16px; height: 16px;"></i>
      <span>Genel / Kategorisiz</span>
      <span class="badge" style="background: rgba(255,255,255,0.15); font-size: 0.72rem; padding: 0.1rem 0.45rem; border-radius: 10px;">${uncategorizedCount}</span>
    `;
    uncatTabBtn.addEventListener('click', () => selectCategoryTab('uncategorized'));
    documentsCategoriesTabBar.appendChild(uncatTabBtn);

    // 3. Kullanıcının Eklediği Özel Sekmeler
    categories.forEach(cat => {
      const catCount = allDocs.filter(d => d.categoryId === cat.id).length;
      const catBtn = document.createElement('button');
      catBtn.className = `sub-tab-btn ${currentActiveCategoryId === cat.id ? 'active' : ''}`;
      catBtn.innerHTML = `
        <i data-lucide="folder" style="width: 16px; height: 16px;"></i>
        <span>${escapeHtml(cat.name)}</span>
        <span class="badge" style="background: rgba(255,255,255,0.15); font-size: 0.72rem; padding: 0.1rem 0.45rem; border-radius: 10px;">${catCount}</span>
      `;
      catBtn.addEventListener('click', () => selectCategoryTab(cat.id));
      documentsCategoriesTabBar.appendChild(catBtn);
    });

    if (window.safeCreateIcons) window.safeCreateIcons();

    // Aktif Sekme Başlık & Kontrol Çubuğunu Güncelle
    updateCategoryHeaderInfo(categories, allDocs);
  }

  // Sekme Seçimi
  function selectCategoryTab(catId) {
    currentActiveCategoryId = catId;
    renderCategoryTabs();
    renderDocumentsList();
  }

  // Başlık Bilgisini Güncelle
  function updateCategoryHeaderInfo(categories, allDocs) {
    if (!documentsActiveCategoryTitle || !documentsActiveCategoryCountBadge) return;

    if (currentActiveCategoryId === 'all') {
      documentsActiveCategoryTitle.textContent = 'Tüm Evraklar';
      documentsActiveCategoryCountBadge.textContent = `${allDocs.length} Evrak`;
      if (documentsCategoryControls) documentsCategoryControls.style.display = 'none';
    } else if (currentActiveCategoryId === 'uncategorized') {
      const count = allDocs.filter(d => !d.categoryId).length;
      documentsActiveCategoryTitle.textContent = 'Genel / Kategorisiz Evraklar';
      documentsActiveCategoryCountBadge.textContent = `${count} Evrak`;
      if (documentsCategoryControls) documentsCategoryControls.style.display = 'none';
    } else {
      const cat = categories.find(c => c.id === currentActiveCategoryId);
      if (cat) {
        const count = allDocs.filter(d => d.categoryId === cat.id).length;
        documentsActiveCategoryTitle.textContent = cat.name;
        documentsActiveCategoryCountBadge.textContent = `${count} Evrak`;
        if (documentsCategoryControls) documentsCategoryControls.style.display = 'flex';
      } else {
        // Sekme silinmişse all'a dön
        currentActiveCategoryId = 'all';
        renderCategoryTabs();
      }
    }
  }

  // Yeni Sekme Ekleme Prompt/Modalı
  async function addNewCategoryPrompt() {
    const title = window.promptAsync ? 
      await window.promptAsync('Oluşturmak istediğiniz yeni sekmenin/kategorinin adını girin:\n(Örn: Zümre Tutanakları, Veli Toplantıları, İdari Yazışmalar)') :
      prompt('Oluşturmak istediğiniz yeni sekmenin adını girin:');

    if (title && title.trim()) {
      const newCat = stateManager.addDocumentCategory(title.trim());
      if (newCat) {
        currentActiveCategoryId = newCat.id;
        renderCategoryTabs();
        renderDocumentsList();
        if (toastCallbackFn) toastCallbackFn(`"${newCat.name}" sekmesi başarıyla oluşturuldu.`, 'success');
      }
    }
  }

  // Aktif Sekmeyi Yeniden Adlandır
  async function renameCurrentCategoryPrompt() {
    const categories = stateManager.getDocumentCategories();
    const cat = categories.find(c => c.id === currentActiveCategoryId);
    if (!cat) return;

    const newName = window.promptAsync ? 
      await window.promptAsync('Sekmenin yeni adını girin:', cat.name) :
      prompt('Sekmenin yeni adını girin:', cat.name);

    if (newName && newName.trim() && newName.trim() !== cat.name) {
      stateManager.updateDocumentCategory(cat.id, newName.trim());
      renderCategoryTabs();
      renderDocumentsList();
      if (toastCallbackFn) toastCallbackFn('Sekme adı güncellendi.', 'success');
    }
  }

  // Aktif Sekmeyi Sil
  async function deleteCurrentCategoryPrompt() {
    const categories = stateManager.getDocumentCategories();
    const cat = categories.find(c => c.id === currentActiveCategoryId);
    if (!cat) return;

    const isConfirmed = window.confirmAsync ?
      await window.confirmAsync(`"${cat.name}" sekmesini silmek istediğinize emin misiniz?\n\nNot: Bu sekme altındaki evraklarınız silinmez, "Genel / Kategorisiz" bölümüne aktarılır.`) :
      confirm(`"${cat.name}" sekmesini silmek istediğinize emin misiniz?\nİçindeki evraklar silinmez, Genel sekmesine aktarılır.`);

    if (isConfirmed) {
      stateManager.deleteDocumentCategory(cat.id);
      currentActiveCategoryId = 'all';
      renderCategoryTabs();
      renderDocumentsList();
      if (toastCallbackFn) toastCallbackFn(`"${cat.name}" sekmesi silindi. Evraklar Genel sekmesine aktarıldı.`, 'info');
    }
  }

  // Yükleme modalındaki kategori seçim kutusunu doldur
  function populateCategoryDropdown() {
    if (!docUploadCategorySelect) return;
    const categories = stateManager.getDocumentCategories();

    docUploadCategorySelect.innerHTML = '<option value="">Genel / Kategorisiz</option>';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      if (currentActiveCategoryId === cat.id) {
        opt.selected = true;
      }
      docUploadCategorySelect.appendChild(opt);
    });
  }

  // Yükleme formunu sıfırla
  function resetUploadForm() {
    selectedFileData = null;
    if (inputDocumentFile) inputDocumentFile.value = '';
    if (docUploadTitle) docUploadTitle.value = '';
    if (docSelectedFileInfo) docSelectedFileInfo.style.display = 'none';
    if (btnSaveDocument) btnSaveDocument.disabled = true;
    populateCategoryDropdown();
  }

  // Dosya seçildiğinde işle
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Boyut kontrolü (25 MB)
    if (file.size > MAX_FILE_SIZE) {
      if (toastCallbackFn) {
        toastCallbackFn('Dosya boyutu çok büyük! Lütfen 25 MB altında belgeler yükleyin.', 'danger');
      }
      clearSelectedFile();
      return;
    }

    const fileName = file.name;
    const fileSizeStr = formatBytes(file.size);
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    
    // Yalnızca docx, txt ve pdf destekliyoruz
    if (fileExtension !== '.docx' && fileExtension !== '.txt' && fileExtension !== '.pdf') {
      if (toastCallbackFn) {
        toastCallbackFn('Yalnızca Word (.docx), Metin (.txt) ve PDF (.pdf) dosyaları desteklenmektedir.', 'warning');
      }
      clearSelectedFile();
      return;
    }

    // Başlık alanını otomatik doldur (boşsa)
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    if (docUploadTitle && !docUploadTitle.value.trim()) {
      docUploadTitle.value = baseName;
    }

    // Dosyayı oku
    const reader = new FileReader();
    
    if (fileExtension === '.docx') {
      reader.onload = function(evt) {
        try {
          if (!window.mammoth) {
            if (toastCallbackFn) toastCallbackFn('Word okuyucu kütüphanesi yüklenemedi. Sayfayı yenileyip tekrar deneyin.', 'danger');
            return;
          }
          window.mammoth.convertToHtml({ arrayBuffer: evt.target.result })
            .then(result => {
              const html = result.value;
              
              // İndirebilmek için base64 data url okuyalım
              const base64Reader = new FileReader();
              base64Reader.onload = function(b64Evt) {
                selectedFileData = {
                  fileName: fileName,
                  fileSize: fileSizeStr,
                  fileType: 'docx',
                  content: b64Evt.target.result, // base64 dataurl
                  htmlContent: html
                };
                
                showSelectedFileInfo(fileName, fileSizeStr);
              };
              base64Reader.readAsDataURL(file);
            })
            .catch(err => {
              console.error(err);
              if (toastCallbackFn) toastCallbackFn('Word dosyası dönüştürülürken hata oluştu.', 'danger');
            });
        } catch (err) {
          console.error(err);
          if (toastCallbackFn) toastCallbackFn('Dosya işlenirken hata oluştu.', 'danger');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileExtension === '.pdf') {
      // PDF dosyası (.pdf)
      reader.onload = function(evt) {
        selectedFileData = {
          fileName: fileName,
          fileSize: fileSizeStr,
          fileType: 'pdf',
          content: evt.target.result, // base64 dataurl
          htmlContent: ''
        };
        showSelectedFileInfo(fileName, fileSizeStr);
      };
      reader.readAsDataURL(file);
    } else {
      // Metin dosyası (.txt)
      reader.onload = function(evt) {
        const text = evt.target.result;
        // Satır sonlarını HTML p/br etiketlerine dönüştür
        const escapedText = escapeHtml(text);
        const html = escapedText.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<br>').join('');
        
        // Base64 okuma
        const base64Reader = new FileReader();
        base64Reader.onload = function(b64Evt) {
          selectedFileData = {
            fileName: fileName,
            fileSize: fileSizeStr,
            fileType: 'txt',
            content: b64Evt.target.result,
            htmlContent: html
          };
          
          showSelectedFileInfo(fileName, fileSizeStr);
        };
        base64Reader.readAsDataURL(file);
      };
      reader.readAsText(file);
    }
  }

  // Seçili dosyayı göster
  function showSelectedFileInfo(name, size) {
    if (docSelectedFileName) docSelectedFileName.textContent = `${name} (${size})`;
    if (docSelectedFileInfo) docSelectedFileInfo.style.display = 'flex';
    if (btnSaveDocument) btnSaveDocument.disabled = false;
  }

  // Seçili dosyayı temizle
  function clearSelectedFile() {
    selectedFileData = null;
    if (inputDocumentFile) inputDocumentFile.value = '';
    if (docSelectedFileInfo) docSelectedFileInfo.style.display = 'none';
    if (btnSaveDocument) btnSaveDocument.disabled = true;
  }

  // Evrağı state'e ve IndexedDB'ye kaydet
  async function saveUploadedDocument() {
    if (!selectedFileData) return;
    
    const title = (docUploadTitle.value || '').trim();
    if (!title) {
      if (toastCallbackFn) toastCallbackFn('Lütfen evrak için geçerli bir başlık girin.', 'danger');
      return;
    }

    const categoryId = docUploadCategorySelect ? (docUploadCategorySelect.value || null) : null;
    const docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    try {
      if (btnSaveDocument) btnSaveDocument.disabled = true;
      if (toastCallbackFn) toastCallbackFn('Evrak depoya kaydediliyor...', 'info');

      // 1. Ağır dosya içeriğini IndexedDB'ye kaydet (Depolama sınırı yok)
      await saveDocumentFile(docId, selectedFileData.content, selectedFileData.htmlContent);

      // 2. Hafif meta veriyi stateManager'a ekle (localStorage kota sorunu yaşanmaz)
      const docData = {
        id: docId,
        title: title,
        fileName: selectedFileData.fileName,
        fileSize: selectedFileData.fileSize,
        fileType: selectedFileData.fileType,
        categoryId: categoryId,
        createdAt: new Date().toISOString()
      };

      stateManager.addDocument(docData);
      
      modalUploadDocument.classList.remove('active');
      clearSelectedFile();
      renderCategoryTabs();
      renderDocumentsList();
      
      if (toastCallbackFn) toastCallbackFn('Evrak başarıyla yüklendi ve kaydedildi.', 'success');
    } catch (err) {
      console.error("Document save error:", err);
      if (toastCallbackFn) toastCallbackFn('Evrak kaydedilirken hata oluştu: ' + (err && err.message ? err.message : ''), 'danger');
    } finally {
      if (btnSaveDocument) btnSaveDocument.disabled = false;
    }
  }

  // Evrak Listesini Render Et
  function renderDocumentsList() {
    if (!documentsListContainer || !documentsEmptyState) return;

    const state = stateManager.loadState();
    const categories = stateManager.getDocumentCategories();
    const allDocs = state.documents || [];

    // Seçili sekmeye göre filtrele
    let docs = [];
    if (currentActiveCategoryId === 'all') {
      docs = allDocs;
    } else if (currentActiveCategoryId === 'uncategorized') {
      docs = allDocs.filter(d => !d.categoryId);
    } else {
      docs = allDocs.filter(d => d.categoryId === currentActiveCategoryId);
    }

    documentsListContainer.innerHTML = '';

    if (docs.length === 0) {
      documentsEmptyState.style.display = 'block';
      documentsListContainer.style.display = 'none';
      const emptyP = documentsEmptyState.querySelector('p');
      if (emptyP) {
        if (currentActiveCategoryId === 'all') {
          emptyP.textContent = 'Henüz yüklenmiş bir kişisel evrak bulunmuyor.';
        } else if (currentActiveCategoryId === 'uncategorized') {
          emptyP.textContent = 'Bu sekmede henüz genel / kategorisiz bir evrak bulunmuyor.';
        } else {
          const cat = categories.find(c => c.id === currentActiveCategoryId);
          emptyP.textContent = `"${cat ? cat.name : 'Bu sekme'}" altında henüz bir evrak bulunmuyor.`;
        }
      }
      return;
    }

    documentsEmptyState.style.display = 'none';
    documentsListContainer.style.display = 'grid';

    docs.forEach(doc => {
      const card = document.createElement('div');
      card.className = 'game-landing-card glass-card document-card';
      
      const fileDate = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
      let icon = '📄';
      if (doc.fileType === 'docx') icon = '📝';
      else if (doc.fileType === 'pdf') icon = '📕';

      // Evrağın sekme bilgisi (Rozet)
      const matchedCat = categories.find(c => c.id === doc.categoryId);
      const categoryBadgeHtml = matchedCat ? 
        `<span class="badge" style="background: rgba(99,102,241,0.15); color: var(--primary); font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.25rem;">
          <i data-lucide="folder" style="width: 11px; height: 11px;"></i> ${escapeHtml(matchedCat.name)}
        </span>` : 
        `<span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-muted); font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.25rem;">
          <i data-lucide="inbox" style="width: 11px; height: 11px;"></i> Genel
        </span>`;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
          <div class="game-card-icon" style="font-size: 2.2rem; margin-bottom: 0.5rem;">${icon}</div>
          <div style="display: flex; align-items: center;">${categoryBadgeHtml}</div>
        </div>
        <div class="game-card-info" style="width: 100%; display: flex; flex-direction: column; flex-grow: 1;">
          <h3 title="${escapeHtml(doc.title)}">${escapeHtml(doc.title)}</h3>
          <div class="doc-meta">
            <span class="file-name" title="${escapeHtml(doc.fileName)}">
              <i data-lucide="file" style="width: 12px; height: 12px;"></i> ${escapeHtml(truncateString(doc.fileName, 28))}
            </span>
            <span>
              <i data-lucide="hard-drive" style="width: 12px; height: 12px;"></i> ${doc.fileSize || '0 KB'}
            </span>
            <span>
              <i data-lucide="clock" style="width: 12px; height: 12px;"></i> ${fileDate}
            </span>
          </div>
          <div class="doc-actions" style="flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm btn-view-doc" title="Evrağı Aç" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;">
              <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Görüntüle
            </button>
            <button class="btn btn-secondary btn-sm btn-move-doc" title="Sekmeye Taşı / Kategori Değiştir" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;">
              <i data-lucide="folder-symlink" style="width: 14px; height: 14px;"></i> Taşı
            </button>
            <button class="btn btn-secondary btn-sm btn-download-doc" title="İndir" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;">
              <i data-lucide="download" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="btn btn-secondary btn-sm btn-rename-doc" title="Yeniden Adlandır" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;">
              <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="btn btn-danger btn-sm btn-delete-doc" title="Sil" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>
      `;

      // Event listenerları bağla
      card.querySelector('.btn-view-doc').addEventListener('click', () => openDocumentViewer(doc));
      card.querySelector('.btn-move-doc').addEventListener('click', () => moveDocumentPrompt(doc));
      card.querySelector('.btn-download-doc').addEventListener('click', () => downloadDocument(doc));
      card.querySelector('.btn-rename-doc').addEventListener('click', () => renameDocument(doc));
      card.querySelector('.btn-delete-doc').addEventListener('click', () => deleteDocument(doc));

      documentsListContainer.appendChild(card);
    });

    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }
  }

  // Evrağı Başka Sekmeye Taşıma
  async function moveDocumentPrompt(doc) {
    if (!doc) return;
    const categories = stateManager.getDocumentCategories();

    // Seçenekler listesi oluştur
    let optionsText = '0: Genel / Kategorisiz\n';
    categories.forEach((cat, index) => {
      optionsText += `${index + 1}: ${cat.name}\n`;
    });

    const promptMessage = `"${doc.title}" evrağını taşımak istediğiniz sekmenin numarasını girin:\n\n${optionsText}`;
    const selection = window.promptAsync ?
      await window.promptAsync(promptMessage, '0') :
      prompt(promptMessage, '0');

    if (selection === null || selection === undefined) return;

    const trimmed = (selection || '').trim();
    if (trimmed === '0') {
      stateManager.moveDocumentToCategory(doc.id, null);
      renderCategoryTabs();
      renderDocumentsList();
      if (toastCallbackFn) toastCallbackFn('Evrak "Genel / Kategorisiz" sekmesine taşındı.', 'success');
      return;
    }

    const idx = parseInt(trimmed, 10);
    if (!isNaN(idx) && idx >= 1 && idx <= categories.length) {
      const targetCat = categories[idx - 1];
      stateManager.moveDocumentToCategory(doc.id, targetCat.id);
      renderCategoryTabs();
      renderDocumentsList();
      if (toastCallbackFn) toastCallbackFn(`Evrak "${targetCat.name}" sekmesine taşındı.`, 'success');
    } else {
      if (toastCallbackFn) toastCallbackFn('Geçersiz sekme numarası seçildi.', 'warning');
    }
  }

  // Evrak Görüntüleyiciyi Aç
  async function openDocumentViewer(doc) {
    if (!doc) return;
    activeViewerDoc = doc;

    if (docViewerTitle) docViewerTitle.textContent = doc.title;
    if (docViewerBody) {
      docViewerBody.style.padding = '3rem';
      docViewerBody.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: var(--text-muted); gap: 1rem;">
          <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <span>Evrak yükleniyor...</span>
        </div>
      `;
    }

    if (modalViewDocument) {
      modalViewDocument.classList.remove('fullscreen-mode');
      resetFullscreenButton();
      modalViewDocument.classList.add('active');
    }

    let fileContent = doc.content;
    let htmlContent = doc.htmlContent;

    // Eğer içerik IndexedDB'de ise oradan çek
    if (!fileContent && !htmlContent) {
      try {
        const fileRecord = await getDocumentFile(doc.id);
        if (fileRecord) {
          fileContent = fileRecord.content;
          htmlContent = fileRecord.htmlContent;
        }
      } catch (err) {
        console.error("getDocumentFile error:", err);
      }
    }

    // activeViewerDoc'a geçici olarak içerikleri ata (indirme ve yazdırma için)
    activeViewerDoc = { ...doc, content: fileContent, htmlContent: htmlContent };

    if (docViewerBody) {
      if (doc.fileType === 'pdf') {
        docViewerBody.style.padding = '0';
        if (fileContent) {
          docViewerBody.innerHTML = `<iframe src="${fileContent}" style="width: 100%; height: 70vh; border: none; border-radius: 8px;"></iframe>`;
        } else {
          docViewerBody.innerHTML = `<p style="text-align: center; color: var(--danger); padding: 2rem;">PDF içeriği yüklenemedi veya bulunamadı.</p>`;
        }
      } else {
        docViewerBody.style.padding = '3rem';
        docViewerBody.innerHTML = htmlContent || `<p style="text-align: center; color: var(--text-muted);">Evrak içeriği boş veya okunamadı.</p>`;
      }
    }
  }

  // Evrağı İndir
  async function downloadDocument(doc) {
    if (!doc) return;

    let content = doc.content;
    if (!content) {
      try {
        const fileRecord = await getDocumentFile(doc.id);
        if (fileRecord) content = fileRecord.content;
      } catch (err) {
        console.error("downloadDocument getDocumentFile error:", err);
      }
    }

    if (!content) {
      if (toastCallbackFn) toastCallbackFn('Dosya içeriği bulunamadı.', 'danger');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = content; // Base64 dataURL
      let ext = 'docx';
      if (doc.fileType === 'pdf') ext = 'pdf';
      else if (doc.fileType === 'txt') ext = 'txt';
      link.download = doc.fileName || `doküman.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (toastCallbackFn) toastCallbackFn('Dosya indiriliyor...', 'success');
    } catch (err) {
      console.error(err);
      if (toastCallbackFn) toastCallbackFn('Dosya indirilirken bir hata oluştu.', 'danger');
    }
  }

  // Evrağı Yazdır
  async function printDocument(doc) {
    if (!doc || !documentPrintArea) return;

    let content = doc.content;
    let htmlContent = doc.htmlContent;
    if (!content && !htmlContent) {
      try {
        const fileRecord = await getDocumentFile(doc.id);
        if (fileRecord) {
          content = fileRecord.content;
          htmlContent = fileRecord.htmlContent;
        }
      } catch (err) {
        console.error("printDocument getDocumentFile error:", err);
      }
    }

    if (doc.fileType === 'pdf') {
      if (content) {
        window.safeOpenURL(content);
        if (toastCallbackFn) toastCallbackFn('PDF belgesi yeni sekmede açıldı. Yazdırmak için tarayıcı özelliklerini kullanabilirsiniz.', 'info');
      } else {
        if (toastCallbackFn) toastCallbackFn('PDF belgesi bulunamadı.', 'danger');
      }
      return;
    }

    if (!htmlContent) {
      if (toastCallbackFn) toastCallbackFn('Yazdırılacak evrak içeriği bulunamadı.', 'warning');
      return;
    }

    try {
      // Yazdırma alanına HTML içeriği kopyala
      documentPrintArea.innerHTML = `
        <div class="document-reader-sheet">
          <h1 style="text-align: center; margin-bottom: 2rem;">${escapeHtml(doc.title)}</h1>
          ${htmlContent}
        </div>
      `;

      // Body sınıfını ayarla
      document.body.classList.add('print-document');

      // Yazdır
      window.print();

      // Temizlik
      setTimeout(() => {
        document.body.classList.remove('print-document');
        documentPrintArea.innerHTML = '';
      }, 500);

    } catch (err) {
      console.error(err);
      if (toastCallbackFn) toastCallbackFn('Yazdırılırken bir hata oluştu.', 'danger');
    }
  }

  // Yeniden Adlandır
  async function renameDocument(doc) {
    if (!doc) return;

    const newTitle = window.promptAsync ? 
      await window.promptAsync('Evrak için yeni bir başlık girin:', doc.title) :
      prompt('Evrak için yeni bir başlık girin:', doc.title);

    if (newTitle && newTitle.trim()) {
      stateManager.updateDocumentTitle(doc.id, newTitle.trim());
      renderDocumentsList();
      if (toastCallbackFn) toastCallbackFn('Evrak adı güncellendi.', 'success');
    }
  }

  // Sil
  async function deleteDocument(doc) {
    if (!doc) return;

    const isConfirmed = window.confirmAsync ?
      await window.confirmAsync(`"${doc.title}" evrağını tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`) :
      confirm(`"${doc.title}" evrağını tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`);

    if (isConfirmed) {
      // 1. IndexedDB'den dosya içeriğini sil
      await deleteDocumentFile(doc.id);

      // 2. State'ten meta veriyi sil
      stateManager.deleteDocument(doc.id);
      renderCategoryTabs();
      renderDocumentsList();
      if (toastCallbackFn) toastCallbackFn('Evrak silindi.', 'info');
    }
  }

  // Baytları düzgün biçimlendirme
  function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // HTML Karakter Kaçışları
  function escapeHtml(string) {
    if (!string) return '';
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Uzun Metinleri Kısaltma Yardımcısı
  function truncateString(str, num) {
    if (!str) return '';
    if (str.length <= num) return str;
    return str.slice(0, num) + '...';
  }

  function toggleFullscreen() {
    if (!modalViewDocument) return;
    const isFullscreen = modalViewDocument.classList.contains('fullscreen-mode');
    
    if (isFullscreen) {
      modalViewDocument.classList.remove('fullscreen-mode');
      resetFullscreenButton();
      if (activeViewerDoc && activeViewerDoc.fileType === 'pdf') {
        const iframe = docViewerBody.querySelector('iframe');
        if (iframe) iframe.style.height = '70vh';
      }
    } else {
      modalViewDocument.classList.add('fullscreen-mode');
      if (btnFullscreenViewerDocument) {
        btnFullscreenViewerDocument.innerHTML = `<i data-lucide="minimize-2" style="width: 16px; height: 16px;"></i> Küçült`;
        btnFullscreenViewerDocument.title = 'Pencereye Dön';
        if (window.safeCreateIcons) window.safeCreateIcons();
      }
      if (activeViewerDoc && activeViewerDoc.fileType === 'pdf') {
        const iframe = docViewerBody.querySelector('iframe');
        if (iframe) iframe.style.height = '82vh';
      }
    }
  }

  function resetFullscreenButton() {
    if (btnFullscreenViewerDocument) {
      btnFullscreenViewerDocument.innerHTML = `<i data-lucide="maximize-2" style="width: 16px; height: 16px;"></i> Tam Ekran`;
      btnFullscreenViewerDocument.title = 'Tam Ekran';
      if (window.safeCreateIcons) window.safeCreateIcons();
    }
  }

  // Global erişim
  window.setupDocuments = setupDocuments;
  window.renderDocumentsList = renderDocumentsList;

})();
