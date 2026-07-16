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

  // Upload Modal DOM
  let modalUploadDocument;
  let docUploadTitle;
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

  // DOSYA BOYUT SINIRI (1.5 MB)
  const MAX_FILE_SIZE = 1.5 * 1024 * 1024;

  function setupDocuments(toastCallback) {
    toastCallbackFn = toastCallback;

    // DOM Elemanlarını Bağla
    btnLaunchDocuments = document.getElementById('btn-launch-documents');
    toolsLandingView = document.getElementById('tools-landing-view');
    toolsDocumentsView = document.getElementById('tools-documents-view');
    btnBackToToolsFromDocuments = document.getElementById('btn-back-to-tools-from-documents');

    documentsListContainer = document.getElementById('documents-list-container');
    documentsEmptyState = document.getElementById('documents-empty-state');
    btnShowDocumentUploadModal = document.getElementById('btn-show-document-upload-modal');
    btnUploadFirstDocument = document.getElementById('btn-upload-first-document');

    // Upload Modal
    modalUploadDocument = document.getElementById('modal-upload-document');
    docUploadTitle = document.getElementById('doc-upload-title');
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
        renderDocumentsList();
      });
    }

    if (btnBackToToolsFromDocuments) {
      btnBackToToolsFromDocuments.addEventListener('click', () => {
        toolsDocumentsView.style.display = 'none';
        toolsLandingView.style.display = 'block';
      });
    }

    // Modal Açma/Kapama
    const openUploadModal = () => {
      resetUploadForm();
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

    // Global state değiştiğinde listeyi yenile
    document.addEventListener('stateChanged', () => {
      if (toolsDocumentsView && toolsDocumentsView.style.display === 'block') {
        renderDocumentsList();
      }
    });
  }

  // Yükleme formunu sıfırla
  function resetUploadForm() {
    selectedFileData = null;
    if (inputDocumentFile) inputDocumentFile.value = '';
    if (docUploadTitle) docUploadTitle.value = '';
    if (docSelectedFileInfo) docSelectedFileInfo.style.display = 'none';
    if (btnSaveDocument) btnSaveDocument.disabled = true;
  }

  // Dosya seçildiğinde işle
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Boyut kontrolü
    if (file.size > MAX_FILE_SIZE) {
      if (toastCallbackFn) {
        toastCallbackFn('Dosya boyutu çok büyük! LocalStorage dolmasını önlemek için lütfen 1.5 MB altında belgeler yükleyin.', 'danger');
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

  // Evrağı state'e kaydet
  function saveUploadedDocument() {
    if (!selectedFileData) return;
    
    const title = (docUploadTitle.value || '').trim();
    if (!title) {
      if (toastCallbackFn) toastCallbackFn('Lütfen evrak için geçerli bir başlık girin.', 'danger');
      return;
    }

    const docData = {
      title: title,
      fileName: selectedFileData.fileName,
      fileSize: selectedFileData.fileSize,
      fileType: selectedFileData.fileType,
      content: selectedFileData.content,
      htmlContent: selectedFileData.htmlContent
    };

    stateManager.addDocument(docData);
    
    modalUploadDocument.classList.remove('active');
    renderDocumentsList();
    
    if (toastCallbackFn) toastCallbackFn('Evrak başarıyla yüklendi ve kaydedildi.', 'success');
  }

  // Evrak Listesini Render Et
  function renderDocumentsList() {
    if (!documentsListContainer || !documentsEmptyState) return;

    const state = stateManager.loadState();
    const docs = state.documents || [];

    documentsListContainer.innerHTML = '';

    if (docs.length === 0) {
      documentsEmptyState.style.display = 'block';
      documentsListContainer.style.display = 'none';
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
      const iconColorClass = doc.fileType === 'docx' ? 'text-primary' : (doc.fileType === 'pdf' ? 'text-danger' : 'text-success');

      card.innerHTML = `
        <div class="game-card-icon" style="font-size: 2.2rem;">${icon}</div>
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
          <div class="doc-actions">
            <button class="btn btn-secondary btn-sm btn-view-doc" title="Evrağı Aç" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;">
              <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Görüntüle
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
      card.querySelector('.btn-download-doc').addEventListener('click', () => downloadDocument(doc));
      card.querySelector('.btn-rename-doc').addEventListener('click', () => renameDocument(doc));
      card.querySelector('.btn-delete-doc').addEventListener('click', () => deleteDocument(doc));

      documentsListContainer.appendChild(card);
    });

    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }
  }

  // Evrak Görüntüleyiciyi Aç
  function openDocumentViewer(doc) {
    if (!doc) return;
    activeViewerDoc = doc;

    if (docViewerTitle) docViewerTitle.textContent = doc.title;
    if (docViewerBody) {
      if (doc.fileType === 'pdf') {
        docViewerBody.style.padding = '0';
        docViewerBody.innerHTML = `<iframe src="${doc.content}" style="width: 100%; height: 70vh; border: none; border-radius: 8px;"></iframe>`;
      } else {
        docViewerBody.style.padding = '3rem';
        docViewerBody.innerHTML = doc.htmlContent || `<p style="text-align: center; color: var(--text-muted);">Evrak içeriği boş veya okunamadı.</p>`;
      }
    }

    if (modalViewDocument) {
      modalViewDocument.classList.remove('fullscreen-mode');
      resetFullscreenButton();
      modalViewDocument.classList.add('active');
    }
  }

  // Evrağı İndir
  function downloadDocument(doc) {
    if (!doc || !doc.content) return;

    try {
      const link = document.createElement('a');
      link.href = doc.content; // Base64 dataURL
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
  function printDocument(doc) {
    if (!doc || !documentPrintArea) return;

    if (doc.fileType === 'pdf') {
      window.safeOpenURL(doc.content);
      if (toastCallbackFn) toastCallbackFn('PDF belgesi yeni sekmede açıldı. Yazdırmak için tarayıcı özelliklerini kullanabilirsiniz.', 'info');
      return;
    }

    if (!doc.htmlContent) return;

    try {
      // Yazdırma alanına HTML içeriği kopyala
      documentPrintArea.innerHTML = `
        <div class="document-reader-sheet">
          <h1 style="text-align: center; margin-bottom: 2rem;">${escapeHtml(doc.title)}</h1>
          ${doc.htmlContent}
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
  function renameDocument(doc) {
    if (!doc) return;

    const newTitle = prompt('Evrak için yeni bir başlık girin:', doc.title);
    if (newTitle && newTitle.trim()) {
      stateManager.updateDocumentTitle(doc.id, newTitle.trim());
      renderDocumentsList();
      if (toastCallbackFn) toastCallbackFn('Evrak adı güncellendi.', 'success');
    }
  }

  // Sil
  function deleteDocument(doc) {
    if (!doc) return;

    if (confirm(`"${doc.title}" evrağını tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      stateManager.deleteDocument(doc.id);
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
