/**
 * SINIF ASİSTANI — MOBİL CEP KİTAPLIĞI MODÜLÜ (MOBILE-BOOKS.JS)
 * Okunan Kitaplar, Öğrenci Kitaplığı, Kitap Verme/Teslim Alma ve Kitap Soruları.
 */

(function(window) {
  'use strict';

  const escapeHTML = window.escapeHTML || (str => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  });
  const showMobileToast = window.showMobileToast || (msg => alert(msg));
  const openBottomSheet = (id) => {
    if (typeof window.openBottomSheet === 'function') {
      return window.openBottomSheet(id);
    }
    const sheet = document.getElementById(id);
    const backdrop = document.getElementById('sheet-backdrop');
    if (sheet) sheet.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  };
  const closeBottomSheet = () => {
    if (typeof window.closeBottomSheet === 'function') {
      return window.closeBottomSheet();
    }
    document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('active'));
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.classList.remove('active');
  };
  const getStudentByIdSafe = (id) => (window.getStudentByIdSafe ? window.getStudentByIdSafe(id) : null);
  const getAvatarColor = (id) => (window.getAvatarColor ? window.getAvatarColor(id) : '#4f46e5');
  const getFilteredStudents = () => (window.getFilteredStudents ? window.getFilteredStudents() : []);
  const isMiddleSchool = () => (window.isMiddleSchool ? window.isMiddleSchool() : false);
  const getTodayDateStr = () => (window.getTodayDateStr ? window.getTodayDateStr() : '');

  // ==========================================================================
  // 3. MODÜL: CEP KİTAPLIĞI (İKİ SEKME: ŞU AN OKUNANLAR & ÖĞRENCİ KİTAPLIĞI)
  // ==========================================================================
  let currentBooksSubTab = 'reading'; // 'reading' | 'library' | 'catalog'
  let selectedBooksStudentId = null;
  let catalogSearchTerm = '';
  let catalogFolderFilter = 'all';

  window.toggleBooksFabMenu = () => {
    window.vibrate(15);
    const menu = document.getElementById('m-books-fab-menu');
    const btn = document.getElementById('m-books-fab-btn');
    if (btn && typeof window.cancelFabAttention === 'function') window.cancelFabAttention(btn);
    if (!menu) return;
    const isShowing = menu.classList.toggle('show');
    if (btn) {
      btn.classList.toggle('active', isShowing);
    }
  };

  window.switchBooksSubTab = (subTab) => {
    currentBooksSubTab = subTab;
    window.vibrate(20);

    const menu = document.getElementById('m-books-fab-menu');
    const fabBtn = document.getElementById('m-books-fab-btn');
    if (menu) menu.classList.remove('show');
    if (fabBtn) fabBtn.classList.remove('active');

    const btnReading = document.getElementById('btn-books-subtab-reading');
    const btnLibrary = document.getElementById('btn-books-subtab-library');
    const btnCatalog = document.getElementById('btn-books-subtab-catalog');
    const paneReading = document.getElementById('books-pane-reading');
    const paneLibrary = document.getElementById('books-pane-library');
    const paneCatalog = document.getElementById('books-pane-catalog');

    if (btnReading) btnReading.classList.toggle('active', subTab === 'reading');
    if (btnLibrary) btnLibrary.classList.toggle('active', subTab === 'library');
    if (btnCatalog) btnCatalog.classList.toggle('active', subTab === 'catalog');
    if (paneReading) paneReading.style.display = (subTab === 'reading') ? 'block' : 'none';
    if (paneLibrary) paneLibrary.style.display = (subTab === 'library') ? 'block' : 'none';
    if (paneCatalog) paneCatalog.style.display = (subTab === 'catalog') ? 'block' : 'none';

    // FAB menu active indicators
    const fabReading = document.getElementById('fab-item-reading');
    const fabLibrary = document.getElementById('fab-item-library');
    const fabCatalog = document.getElementById('fab-item-catalog');
    if (fabReading) fabReading.classList.toggle('active', subTab === 'reading');
    if (fabLibrary) fabLibrary.classList.toggle('active', subTab === 'library');
    if (fabCatalog) fabCatalog.classList.toggle('active', subTab === 'catalog');

    // Header title & subtitle
    const activeTitle = document.getElementById('m-books-active-title');
    const activeSub = document.getElementById('m-books-active-subtitle');
    if (activeTitle && activeSub) {
      if (subTab === 'reading') {
        activeTitle.innerHTML = '📖 Şu An Okunanlar';
        activeSub.textContent = 'Ödünçteki kitaplar ve teslim durumları';
      } else if (subTab === 'library') {
        activeTitle.innerHTML = '👤 Öğrenci Kitaplığı';
        activeSub.textContent = 'Öğrencinin okuduğu kitaplar ve okuma istatistikleri';
      } else if (subTab === 'catalog') {
        activeTitle.innerHTML = '📚 Kütüphane Kitaplığı';
        activeSub.textContent = 'Kitap listesi, soru havuzu ve detaylar';
      }
    }

    renderBooksTab();
  };

  function renderBooksTab() {
    if (currentBooksSubTab === 'reading') {
      renderBooksReadingPane();
    } else if (currentBooksSubTab === 'library') {
      renderBooksLibraryPane();
    } else if (currentBooksSubTab === 'catalog') {
      renderBooksCatalogPane();
    }
    if (window.lucide) window.lucide.createIcons();
  }

  // 1. SEKME: ŞU AN OKUNANLAR (ÖĞRENCİ BAZLI GRUPLAMA & ÇOKLU KİTAP İÇİN ÜST ÜSTE OTURMUŞ KARTLAR)
  function renderBooksReadingPane() {
    const container = document.getElementById('m-books-reading-list');
    const badge = document.getElementById('books-reading-count-badge');
    if (!container) return;

    container.innerHTML = '';
    if (!window.stateManager) return;

    const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);
    const bookSettings = (typeof window.stateManager.getBookSettings === 'function') ? window.stateManager.getBookSettings() : {};

    // Sadece şu an okunanlar (status === 'reading')
    const activeTx = transactions.filter(t => t.status === 'reading');
    
    // Öğrenci bazında grupla
    const studentGroups = new Map();
    activeTx.forEach(t => {
      const student = getStudentByIdSafe(t.studentId);
      const book = books.find(b => b.id === t.bookId);
      if (!student || !book) return;

      const bDateStr = (t.borrowDate || '').split('T')[0];
      const todayStr = getTodayDateStr();
      const bParts = bDateStr ? bDateStr.split('-').map(Number) : [2026, 1, 1];
      const tParts = todayStr.split('-').map(Number);
      const dBorrow = new Date(bParts[0], bParts[1] - 1, bParts[2]);
      const dToday = new Date(tParts[0], tParts[1] - 1, tParts[2]);
      const diffDays = Math.max(0, Math.round((dToday - dBorrow) / (1000 * 60 * 60 * 24)));

      const isLevel2 = (book.level === 'seviye_2');
      const lvlSettings = isLevel2 ? (bookSettings.level2 || {}) : (bookSettings.level1 || {});
      const limitDays = parseInt(lvlSettings.readingLimitDays || lvlSettings.limitDays) || (isLevel2 ? 7 : (bookSettings.limitDays || 4));

      const overdueDays = diffDays - limitDays;
      const isOverdue = overdueDays > 0;

      const item = {
        transaction: t,
        student,
        book,
        diffDays,
        limitDays,
        overdueDays,
        isOverdue
      };

      if (!studentGroups.has(t.studentId)) {
        studentGroups.set(t.studentId, {
          student,
          items: []
        });
      }
      studentGroups.get(t.studentId).items.push(item);
    });

    const studentEntries = Array.from(studentGroups.values());

    // Sıralama: En çok gecikmesi olan öğrenciler en üstte
    studentEntries.forEach(entry => {
      entry.items.sort((a, b) => b.overdueDays - a.overdueDays);
      entry.maxOverdue = Math.max(...entry.items.map(it => it.overdueDays));
      entry.hasOverdue = entry.items.some(it => it.isOverdue);
    });

    studentEntries.sort((a, b) => {
      if (b.maxOverdue !== a.maxOverdue) {
        return b.maxOverdue - a.maxOverdue;
      }
      return b.items.length - a.items.length;
    });

    const totalActiveBooks = activeTx.length;
    const totalOverdueBooks = studentEntries.reduce((acc, entry) => acc + entry.items.filter(it => it.isOverdue).length, 0);

    if (badge) {
      badge.textContent = `${totalActiveBooks} Kitap (${studentEntries.length} Öğrenci)${totalOverdueBooks > 0 ? ` • ${totalOverdueBooks} Gecikmeli` : ''}`;
      badge.style.color = totalOverdueBooks > 0 ? 'var(--m-danger)' : 'var(--m-text-muted)';
    }

    if (studentEntries.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="book-check" style="width: 44px; height: 44px; margin-bottom: 0.5rem; opacity: 0.5;"></i>
          <p style="font-weight: 700;">Şu anda ödünçte kitap yok.</p>
          <p style="font-size: 0.8rem; margin-top: 0.25rem;">Yukarıdaki <strong>+ Kitap Ekle</strong> ve <strong>+ Kitap Ver</strong> butonları ile kitap dağıtabilirsiniz.</p>
        </div>
      `;
      return;
    }

    studentEntries.forEach(entry => {
      const student = entry.student;
      const items = entry.items;
      const isMulti = items.length > 1;
      const hasOverdue = entry.hasOverdue;

      const card = document.createElement('div');
      card.className = `book-reading-card ${isMulti ? 'is-multi-book' : ''} ${hasOverdue ? 'is-overdue' : 'is-ontime'}`;
      card.onclick = () => window.openManageStudentBooksModal(student.id);

      const avatarColor = getAvatarColor(student.id || student.name);

      let delayHtml = '';
      if (isMulti) {
        const overdueCount = items.filter(it => it.isOverdue).length;
        if (overdueCount > 0) {
          delayHtml = `<span class="book-delay-badge overdue">⚠️ ${overdueCount} kitap makul süreyi aştı</span>`;
        } else {
          delayHtml = `<span class="book-delay-badge ontime">✓ ${items.length} kitap da süresinde</span>`;
        }
      } else {
        const item = items[0];
        if (item.isOverdue) {
          delayHtml = `<span class="book-delay-badge overdue">⚠️ ${item.overdueDays} gün gecikti (Makul: ${item.limitDays} gün)</span>`;
        } else if (item.diffDays === item.limitDays) {
          delayHtml = `<span class="book-delay-badge ontime" style="background: var(--m-warning-light); color: var(--m-warning);">⏳ Son gün (${item.diffDays}/${item.limitDays} gün)</span>`;
        } else {
          const remaining = item.limitDays - item.diffDays;
          delayHtml = `<span class="book-delay-badge ontime">✓ Süresinde (${remaining} gün kaldı)</span>`;
        }
      }

      let booksListHtml = '';
      if (isMulti) {
        booksListHtml = `
          <div style="margin: 4px 0 6px 0; display: flex; flex-direction: column; gap: 3px;">
            ${items.map((it, idx) => `
              <div style="font-size: 0.82rem; font-weight: 700; color: var(--m-primary); display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📖 ${idx + 1}. ${escapeHTML(it.book.title)}</span>
                ${it.isOverdue ? `<span style="font-size: 0.68rem; color: var(--m-danger); font-weight: 800; flex-shrink: 0;">+${it.overdueDays} gün</span>` : `<span style="font-size: 0.68rem; color: var(--m-success); font-weight: 700; flex-shrink: 0;">(Süresinde)</span>`}
              </div>
            `).join('')}
          </div>
        `;
      } else {
        const item = items[0];
        booksListHtml = `
          <div class="book-title-text">${escapeHTML(item.book.title)}</div>
          <div class="book-meta-sub">
            <span>Veriliş: ${item.diffDays} gün önce</span> • <span>${item.book.pages ? item.book.pages + ' sayfa' : 'Sayfa belirtilmemiş'}</span>
          </div>
        `;
      }

      card.innerHTML = `
        <div style="width: 44px; height: 44px; border-radius: 50%; background: ${avatarColor}; color: #fff; font-weight: 800; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative;">
          ${student.photo ? `<img src="${student.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : escapeHTML(student.name.charAt(0).toUpperCase())}
          ${isMulti ? `<div style="position: absolute; bottom: -4px; right: -4px; background: var(--m-primary); color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.68rem; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--m-surface);">${items.length}</div>` : ''}
        </div>
        <div class="book-info-col">
          <div class="book-student-name">
            <span>${escapeHTML(student.name)} ${escapeHTML(student.surname || '')}</span>
            <span style="font-size: 0.72rem; color: var(--m-text-muted); font-weight: 600;">(No: ${escapeHTML(student.number || '-')})</span>
            ${isMulti ? `<span class="multi-book-badge">📚 ${items.length} Kitap</span>` : ''}
          </div>
          ${booksListHtml}
          <div>${delayHtml}</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 4px; flex-shrink: 0;">
          <span style="font-size: 0.74rem; color: var(--m-primary); font-weight: 700; display: flex; align-items: center; gap: 2px;">
            İşlemler <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
          </span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // 2. SEKME: ÖĞRENCİ KİTAPLIĞI
  function renderBooksLibraryPane() {
    const select = document.getElementById('m-books-student-select');
    const statsContainer = document.getElementById('m-books-student-stats');
    const historyList = document.getElementById('m-books-student-history');
    const countBadge = document.getElementById('m-books-history-count');
    if (!select || !statsContainer || !historyList) return;

    if (!window.stateManager) return;
    const students = getFilteredStudents();

    if (students.length === 0) {
      statsContainer.innerHTML = '<p style="color: var(--m-text-muted); padding: 1rem;">Öğrenci bulunamadı.</p>';
      historyList.innerHTML = '';
      return;
    }

    // Seçili öğrenci yoksa ilk öğrenciyi seç
    if (!selectedBooksStudentId || !students.some(s => String(s.id) === String(selectedBooksStudentId))) {
      selectedBooksStudentId = students[0].id;
    }

    // Select kutusunu güncelle
    select.innerHTML = students.map(s => `
      <option value="${s.id}" ${String(s.id) === String(selectedBooksStudentId) ? 'selected' : ''}>
        ${escapeHTML(s.name)} ${escapeHTML(s.surname || '')} (${s.number || '-'})${isMiddleSchool() && s.branch ? ' • ' + s.branch : ''}
      </option>
    `).join('');

    const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);

    const studentTx = transactions.filter(t => String(t.studentId) === String(selectedBooksStudentId));
    const completedTx = studentTx.filter(t => t.status === 'returned');
    const activeTx = studentTx.find(t => t.status === 'reading');

    // Toplam sayfa ve kitap sayısı
    let totalPages = 0;
    completedTx.forEach(t => {
      const book = books.find(b => b.id === t.bookId);
      if (book && book.pages) {
        totalPages += parseInt(book.pages) || 0;
      }
    });

    const activeBook = activeTx ? books.find(b => b.id === activeTx.bookId) : null;

    statsContainer.innerHTML = `
      <div class="books-stat-card">
        <div class="books-stat-num">${completedTx.length}</div>
        <div class="books-stat-lbl">Okunan Kitap</div>
      </div>
      <div class="books-stat-card">
        <div class="books-stat-num">${totalPages}</div>
        <div class="books-stat-lbl">Toplam Sayfa</div>
      </div>
      <div class="books-stat-card" style="${activeBook ? 'border-color: var(--m-primary);' : ''}">
        <div class="books-stat-num" style="font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 4px;">
          ${activeBook ? escapeHTML(activeBook.title) : 'Yok'}
        </div>
        <div class="books-stat-lbl">${activeBook ? 'Şu An Okuyor' : 'Aktif Kitap Yok'}</div>
      </div>
    `;

    if (countBadge) {
      countBadge.textContent = `${completedTx.length} Kitap Teslim Edildi`;
    }

    if (completedTx.length === 0) {
      historyList.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="book-open" style="width: 36px; height: 36px; opacity: 0.4; margin-bottom: 0.5rem;"></i>
          <p style="font-weight: 700;">Bu öğrenci henüz teslim edilmiş bir kitap okumamış.</p>
        </div>
      `;
      return;
    }

    // Ters kronolojik sıralama (son teslim edilen en üstte)
    completedTx.sort((a, b) => new Date(b.returnDate || b.borrowDate) - new Date(a.returnDate || a.borrowDate));

    historyList.innerHTML = '';
    completedTx.forEach(t => {
      const book = books.find(b => b.id === t.bookId) || { title: 'Bilinmeyen Kitap', pages: 0, author: '-' };
      const item = document.createElement('div');
      item.className = 'books-history-item';
      item.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 800; font-size: 0.9rem; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHTML(book.title)}
          </div>
          <div style="font-size: 0.72rem; color: var(--m-text-muted); margin-top: 2px;">
            <span>${escapeHTML(book.author || 'Yazar Belirtilmemiş')}</span> • <span>${book.pages || 0} Sayfa</span>
          </div>
          <div style="font-size: 0.7rem; color: var(--m-primary); margin-top: 3px; font-weight: 600;">
            📅 Teslim: ${t.returnDate || 'Tamamlandı'} (Veriliş: ${t.borrowDate || '-'})
          </div>
        </div>
        <div style="background: var(--m-success-light); color: var(--m-success); padding: 4px 8px; border-radius: var(--m-radius-sm); font-size: 0.75rem; font-weight: 800;">
          ✓ Okundu
        </div>
      `;
      historyList.appendChild(item);
    });
  }

  window.selectBooksStudent = (studentId) => {
    selectedBooksStudentId = studentId;
    window.vibrate(15);
    renderBooksLibraryPane();
    if (window.lucide) window.lucide.createIcons();
  };

  // ==========================================================================
  // YENİ KİTAP EKLE MODALI
  // ==========================================================================
  window.openAddBookModal = () => {
    window.vibrate(15);
    const titleInput = document.getElementById('m-new-book-title');
    const authorInput = document.getElementById('m-new-book-author');
    const pagesInput = document.getElementById('m-new-book-pages');
    const noInput = document.getElementById('m-new-book-no');
    const levelSelect = document.getElementById('m-new-book-level');

    if (titleInput) titleInput.value = '';
    if (authorInput) authorInput.value = '';
    if (pagesInput) pagesInput.value = '';
    if (noInput) noInput.value = '';
    if (levelSelect) levelSelect.value = 'seviye_1';

    window.openBottomSheet('modal-add-book');
    setTimeout(() => {
      if (titleInput) titleInput.focus();
    }, 250);
  };

  window.saveNewBook = () => {
    const titleInput = document.getElementById('m-new-book-title');
    const authorInput = document.getElementById('m-new-book-author');
    const pagesInput = document.getElementById('m-new-book-pages');
    const noInput = document.getElementById('m-new-book-no');
    const levelSelect = document.getElementById('m-new-book-level');

    const title = titleInput ? titleInput.value.trim() : '';
    if (!title) {
      showMobileToast('Lütfen kitap adını girin');
      if (titleInput) titleInput.focus();
      return;
    }

    const author = (authorInput && authorInput.value.trim()) ? authorInput.value.trim() : 'Bilinmiyor';
    const pages = pagesInput ? (parseInt(pagesInput.value) || 0) : 0;
    const bookNo = noInput ? noInput.value.trim() : '';
    const level = levelSelect ? levelSelect.value : 'seviye_1';

    if (!window.stateManager) {
      showMobileToast('Veri motoru yüklenemedi');
      return;
    }

    let added = null;
    if (typeof window.stateManager.addBook === 'function') {
      added = window.stateManager.addBook({
        title,
        author,
        pages,
        bookNo,
        level
      });
      if (!added) return; // Demo limit hit or error
    } else {
      if (!window.stateManager.state.books) window.stateManager.state.books = { library: [], transactions: [] };
      if (!window.stateManager.state.books.library) window.stateManager.state.books.library = [];

      added = {
        id: 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title,
        author,
        pages,
        bookNo,
        level,
        createdAt: new Date().toISOString()
      };
      window.stateManager.state.books.library.push(added);
      window.stateManager.saveState();
    }

    window.vibrate(30);
    playSynthChime('correct');
    showMobileToast(`✅ "${title}" kütüphaneye eklendi!`);
    window.closeBottomSheet();

    // Paneli güncelle
    renderBooksTab();
  };

  // ==========================================================================
  // KİTAP VER MODALI
  // ==========================================================================
  window.openGiveBookModal = (preselectedStudentId = null) => {
    if (!window.stateManager) return;
    const students = getFilteredStudents();
    const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);

    // Şu an başkasında olan kitapların ID'leri
    const currentlyReadingBookIds = new Set(
      transactions.filter(t => t.status === 'reading').map(t => t.bookId)
    );

    // Kütüphanede müsait olan kitaplar
    const availableBooks = books.filter(b => !currentlyReadingBookIds.has(b.id));

    const stSelect = document.getElementById('m-give-book-student');
    const bkSelect = document.getElementById('m-give-book-book');
    const dateInput = document.getElementById('m-give-book-date');

    if (stSelect) {
      stSelect.innerHTML = students.map(s => `
        <option value="${s.id}" ${s.id === preselectedStudentId ? 'selected' : ''}>
          ${escapeHTML(s.name)} ${escapeHTML(s.surname || '')} (${s.number || '-'})${isMiddleSchool() && s.branch ? ' • ' + s.branch : ''}
        </option>
      `).join('');
    }

    if (bkSelect) {
      if (availableBooks.length === 0) {
        bkSelect.innerHTML = '<option value="">(Kütüphanede müsait kitap yok)</option>';
      } else {
        bkSelect.innerHTML = availableBooks.map(b => `
          <option value="${b.id}">
            ${escapeHTML(b.title)} - ${escapeHTML(b.author || '')} (${b.pages || 0} Sayfa)
          </option>
        `).join('');
      }
    }

    if (dateInput) {
      dateInput.value = getTodayDateStr();
    }

    openBottomSheet('modal-give-book');
  };

  window.submitGiveBook = () => {
    const stSelect = document.getElementById('m-give-book-student');
    const bkSelect = document.getElementById('m-give-book-book');
    const dateInput = document.getElementById('m-give-book-date');

    if (!stSelect || !bkSelect) return;
    const studentId = stSelect.value;
    const bookId = bkSelect.value;
    const borrowDate = dateInput ? (dateInput.value || getTodayDateStr()) : getTodayDateStr();

    if (!studentId) {
      showMobileToast('❌ Lütfen bir öğrenci seçin');
      return;
    }
    if (!bookId) {
      showMobileToast('❌ Lütfen verilecek bir kitap seçin');
      return;
    }

    const res = window.stateManager.borrowBook(studentId, bookId, borrowDate);
    if (res && res.success) {
      window.vibrate(35);
      const student = getStudentByIdSafe(studentId);
      const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
      const book = books.find(b => b.id === bookId);
      showMobileToast(`📖 "${book ? book.title : 'Kitap'}" ${student ? student.name : 'öğrenciye'} verildi!`);
      closeBottomSheet();
      renderBooksTab();
    } else {
      showMobileToast(res ? res.message : '❌ Kitap verilemedi');
    }
  };

  // ==========================================================================
  // KİTAP YÖNETİM & TESLİM ALMA & ÖNERİ MODALI (ÇOKLU KİTAP DESTEĞİ)
  // ==========================================================================
  window.openManageStudentBooksModal = (studentId) => {
    if (!window.stateManager) return;
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);
    const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const bookSettings = (typeof window.stateManager.getBookSettings === 'function') ? window.stateManager.getBookSettings() : {};
    const student = getStudentByIdSafe(studentId);
    if (!student) return;

    // Bu öğrencinin şu anda okuduğu tüm kitapları bul
    const activeStudentTx = transactions.filter(t => t.studentId === studentId && t.status === 'reading');

    if (activeStudentTx.length === 0) {
      showMobileToast('Bu öğrencinin şu anda okuduğu kitap kalmadı.');
      window.closeBottomSheet();
      renderBooksTab();
      return;
    }

    const items = [];
    activeStudentTx.forEach(t => {
      const book = books.find(b => b.id === t.bookId);
      if (!book) return;

      const bDateStr = (t.borrowDate || '').split('T')[0];
      const todayStr = getTodayDateStr();
      const bParts = bDateStr ? bDateStr.split('-').map(Number) : [2026, 1, 1];
      const tParts = todayStr.split('-').map(Number);
      const dBorrow = new Date(bParts[0], bParts[1] - 1, bParts[2]);
      const dToday = new Date(tParts[0], tParts[1] - 1, tParts[2]);
      const diffDays = Math.max(0, Math.round((dToday - dBorrow) / (1000 * 60 * 60 * 24)));

      const isLevel2 = (book.level === 'seviye_2');
      const lvlSettings = isLevel2 ? (bookSettings.level2 || {}) : (bookSettings.level1 || {});
      const limitDays = parseInt(lvlSettings.readingLimitDays || lvlSettings.limitDays) || (isLevel2 ? 7 : 4);
      const overdueDays = diffDays - limitDays;
      const isOverdue = overdueDays > 0;

      items.push({
        transaction: t,
        book,
        diffDays,
        limitDays,
        overdueDays,
        isOverdue
      });
    });

    const titleEl = document.getElementById('m-manage-book-header-title');
    const bodyEl = document.getElementById('m-manage-book-body');
    if (titleEl) {
      titleEl.innerHTML = `👤 ${escapeHTML(student.name)} ${escapeHTML(student.surname || '')} <span style="font-size: 0.78rem; font-weight: 600; color: var(--m-text-muted);">(${items.length} Kitap)</span>`;
    }

    if (!bodyEl) return;

    bodyEl.innerHTML = `
      <div style="font-size: 0.8rem; color: var(--m-text-muted); margin-bottom: 0.85rem; line-height: 1.45;">
        ${items.length > 1 ? `Öğrencinin okumakta olduğu <strong>${items.length} kitap</strong> aşağıdadır. Dilediğiniz kitabı tek tek teslim alabilirsiniz:` : 'Öğrencinin okumakta olduğu kitap:'}
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 1.25rem;">
        ${items.map(it => `
          <div class="multi-book-item-card ${it.isOverdue ? 'is-overdue' : 'is-ontime'}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 800; font-size: 0.95rem; color: var(--m-primary);">${escapeHTML(it.book.title)}</div>
                <div style="font-size: 0.76rem; color: var(--m-text-muted); margin-top: 2px;">
                  ${escapeHTML(it.book.author || 'Yazar Belirtilmemiş')} • ${it.book.pages || 0} Sayfa • <span class="badge" style="background: ${it.book.level === 'seviye_2' ? '#9333ea' : 'var(--m-success)'}; color: white; padding: 1px 6px; border-radius: 8px; font-size: 0.68rem; font-weight: 700;">${it.book.level === 'seviye_2' ? '2. Seviye' : '1. Seviye'}</span>
                </div>
                <div style="font-size: 0.74rem; color: var(--m-text-secondary); margin-top: 5px;">
                  📅 Veriliş: <strong>${it.diffDays} gün önce</strong> (${it.transaction.borrowDate || '-'})
                </div>
              </div>
              <div style="flex-shrink: 0;">
                ${it.isOverdue ? `<span class="book-delay-badge overdue">⚠️ ${it.overdueDays} gün gecikti</span>` : `<span class="book-delay-badge ontime">✓ Süresinde (${it.limitDays - it.diffDays} gün kaldı)</span>`}
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 8px; border-top: 1px dashed var(--m-border); flex-wrap: wrap; gap: 8px;">
              <span style="font-size: 0.72rem; color: var(--m-text-muted);">Makul okuma süresi: ${it.limitDays} gün</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button type="button" class="m-btn-sm" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; font-weight: 700; padding: 6px 12px; gap: 5px; border-radius: var(--m-radius-sm); box-shadow: 0 2px 6px rgba(99, 102, 241, 0.35); cursor: pointer;" onclick="window.openBookQuestionsModal('${it.book.id}', '${student.id}')" title="Kitap Soru Sorma">
                  <i data-lucide="help-circle" style="width: 15px; height: 15px;"></i>
                  <span>Soru Sor</span>
                </button>
                <button type="button" class="m-btn-sm" style="background: linear-gradient(135deg, var(--m-success), #059669); color: white; border: none; font-weight: 700; padding: 6px 14px; gap: 6px; border-radius: var(--m-radius-sm); box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3); cursor: pointer;" onclick="window.confirmReturnStudentBook('${it.transaction.id}', '${student.id}')">
                  <i data-lucide="check-circle" style="width: 15px; height: 15px;"></i>
                  <span>İade Al</span>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <button class="subview-secondary-btn" onclick="window.closeBottomSheet()">
        Kapat
      </button>
    `;

    openBottomSheet('modal-manage-reading-book');
    if (window.lucide) window.lucide.createIcons();
  };

  // Geriye dönük uyumluluk için alias
  window.openManageBookModal = (transactionId) => {
    if (!window.stateManager) return;
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);
    const t = transactions.find(item => item.id === transactionId);
    if (t) {
      window.openManageStudentBooksModal(t.studentId);
    }
  };

  window.confirmReturnStudentBook = (transactionId, studentId) => {
    if (!window.stateManager) return;
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);
    const t = transactions.find(item => item.id === transactionId);
    if (!t) return;

    const bookId = t.bookId;
    const student = getStudentByIdSafe(studentId);
    const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const returnedBook = books.find(b => b.id === bookId);

    // İade al
    window.stateManager.returnBook(transactionId);
    window.vibrate(35);
    playSynthChime('correct');

    // Performans puanı ekle
    if (window.stateManager.addPerformance && student && returnedBook) {
      const bookSettings = (typeof window.stateManager.getBookSettings === 'function') ? window.stateManager.getBookSettings() : {};
      const isLevel2 = (returnedBook.level === 'seviye_2');
      const lvlSettings = isLevel2 ? (bookSettings.level2 || {}) : (bookSettings.level1 || {});
      const limitDays = parseInt(lvlSettings.readingLimitDays || lvlSettings.limitDays) || (isLevel2 ? 7 : 4);

      const bDate = new Date(t.borrowDate);
      const diffDays = Math.max(0, Math.round((new Date() - bDate) / (1000 * 60 * 60 * 24)));
      const isOnTime = diffDays <= limitDays;
      const points = isOnTime ? (lvlSettings.ontime !== undefined ? lvlSettings.ontime : 10) : (lvlSettings.late !== undefined ? lvlSettings.late : 5);

      window.stateManager.addPerformance(
        student.id,
        points >= 0 ? 'positive' : 'development',
        points,
        `Kitap Teslim Edildi: ${returnedBook.title}${isOnTime ? ' (Zamanında)' : ' (Gecikmeli)'}`,
        window.stateManager.getSelectedWeek ? window.stateManager.getSelectedWeek() : '1'
      );
    }

    showMobileToast(`✅ "${returnedBook ? returnedBook.title : 'Kitap'}" teslim alındı!`);
    renderBooksTab();

    // Öğrencinin başka okuduğu kitap var mı kontrol et
    const updatedTransactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);
    const remainingActive = updatedTransactions.filter(item => item.studentId === studentId && item.status === 'reading');

    if (remainingActive.length > 0) {
      // Hala okuduğu kitap var: Modalı kalan kitaplarla anında yenile
      window.openManageStudentBooksModal(studentId);
    } else {
      // Tüm kitapları teslim edildi: Yeni kitap önerme ekranına geç
      renderBookSuggestionsStep(studentId);
    }
  };

  // Geriye dönük uyumluluk aliası
  window.confirmReturnBook = (transactionId) => {
    if (!window.stateManager) return;
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);
    const t = transactions.find(item => item.id === transactionId);
    if (t) {
      window.confirmReturnStudentBook(transactionId, t.studentId);
    }
  };

  function renderBookSuggestionsStep(studentId) {
    const bodyEl = document.getElementById('m-manage-book-body');
    const titleEl = document.getElementById('m-manage-book-header-title');
    if (!bodyEl) return;

    const student = getStudentByIdSafe(studentId);
    if (titleEl) titleEl.textContent = `🎉 Yeni Kitap Öner: ${student ? student.name : ''}`;

    const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);

    // Şu an başkalarında olan kitaplar
    const currentlyReadingBookIds = new Set(
      transactions.filter(t => t.status === 'reading').map(t => t.bookId)
    );

    // Bu öğrencinin daha önce okuduğu kitaplar
    const alreadyReadBookIds = new Set(
      transactions.filter(t => String(t.studentId) === String(studentId) && t.status === 'returned').map(t => t.bookId)
    );

    // Müsait kitaplar (başkasında olmayan)
    const availableBooks = books.filter(b => !currentlyReadingBookIds.has(b.id));

    // Öncelikli olarak öğrencinin henüz okumadığı kitaplar
    const unreadAvailable = availableBooks.filter(b => !alreadyReadBookIds.has(b.id));
    const suggestedBooks = unreadAvailable.length > 0 ? unreadAvailable : availableBooks;

    let suggestionsHtml = '';
    if (suggestedBooks.length === 0) {
      suggestionsHtml = `
        <div style="text-align: center; padding: 1.5rem; color: var(--m-text-muted);">
          <p>Kütüphanede şu an verilebilecek müsait kitap bulunamadı.</p>
        </div>
      `;
    } else {
      suggestionsHtml = suggestedBooks.slice(0, 5).map(b => `
        <div class="books-suggestion-item">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 800; font-size: 0.88rem; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHTML(b.title)}
            </div>
            <div style="font-size: 0.72rem; color: var(--m-text-muted);">
              ${escapeHTML(b.author || 'Yazar Belirtilmemiş')} • ${b.pages || 0} Sayfa
            </div>
          </div>
          <button class="btn-primary-action" style="padding: 0.4rem 0.75rem; font-size: 0.78rem;" onclick="window.quickAssignSuggestedBook('${studentId}', '${b.id}')">
            Seç ve Ver
          </button>
        </div>
      `).join('');
    }

    bodyEl.innerHTML = `
      <div style="text-align: center; margin-bottom: 1rem;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--m-success-light); color: var(--m-success); font-size: 1.5rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem auto;">
          ✓
        </div>
        <div style="font-weight: 800; font-size: 1.05rem; color: var(--m-text);">Kitap Başarıyla Teslim Alındı</div>
        <p style="font-size: 0.8rem; color: var(--m-text-muted); margin-top: 2px;">
          ${student ? student.name : 'Öğrenci'} için kütüphaneden aktif okuyabileceği kitaplar:
        </p>
      </div>

      <div class="books-suggestion-box">
        <div style="font-size: 0.8rem; font-weight: 800; color: var(--m-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 4px;">
          <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i> Önerilen Müsait Kitaplar
        </div>
        ${suggestionsHtml}
      </div>

      <button class="subview-secondary-btn" style="margin-top: 1rem;" onclick="window.closeBottomSheet()">
        Şimdilik Kitap Verme / Kapat
      </button>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  window.quickAssignSuggestedBook = (studentId, bookId) => {
    if (!window.stateManager) return;
    const res = window.stateManager.borrowBook(studentId, bookId, getTodayDateStr());
    if (res && res.success) {
      window.vibrate(35);
      const student = getStudentByIdSafe(studentId);
      const books = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
      const book = books.find(b => b.id === bookId);
      showMobileToast(`📖 "${book ? book.title : 'Kitap'}" ${student ? student.name : 'öğrenciye'} verildi!`);
      closeBottomSheet();
      renderBooksTab();
    } else {
      showMobileToast(res ? res.message : '❌ Kitap verilemedi');
    }
  };

  // ==========================================================================
  // 3. ALT SEKME: KİTAPLIK (KLASÖRLER HALİNDE & SORU EKLEME)
  // ==========================================================================
  window.filterCatalogBooks = (term) => {
    catalogSearchTerm = (term || '').trim().toLowerCase();
    renderBooksCatalogPane();
  };

  window.filterCatalogFolder = (filter) => {
    catalogFolderFilter = filter || 'all';
    window.vibrate(15);
    renderBooksCatalogPane();
  };

  function renderBooksCatalogPane() {
    const container = document.getElementById('m-catalog-folders-container');
    const countText = document.getElementById('m-catalog-count-text');
    if (!container) return;

    container.innerHTML = '';
    if (!window.stateManager) return;

    const allBooks = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const transactions = window.stateManager.getBookTransactions ? window.stateManager.getBookTransactions() : (window.stateManager.state.books ? window.stateManager.state.books.transactions || [] : []);

    // Aktif okunan kitapların bilgisi (bookId -> readerName)
    const readingMap = {};
    transactions.filter(t => t.status === 'reading').forEach(t => {
      const student = getStudentByIdSafe(t.studentId);
      readingMap[t.bookId] = student ? `${student.name} ${student.surname || ''}`.trim() : 'Öğrenci';
    });

    // Filtreleme
    const filtered = allBooks.filter(b => {
      const isReading = !!readingMap[b.id];
      const level = b.level || 'seviye_1';

      if (catalogSearchTerm) {
        const titleMatch = (b.title || '').toLowerCase().includes(catalogSearchTerm);
        const authorMatch = (b.author || '').toLowerCase().includes(catalogSearchTerm);
        const noMatch = (b.bookNo || '').toLowerCase().includes(catalogSearchTerm);
        if (!titleMatch && !authorMatch && !noMatch) return false;
      }

      if (catalogFolderFilter === 'seviye_1' && level !== 'seviye_1') return false;
      if (catalogFolderFilter === 'seviye_2' && level !== 'seviye_2') return false;
      if (catalogFolderFilter === 'reading' && !isReading) return false;
      if (catalogFolderFilter === 'available' && isReading) return false;

      return true;
    });

    const totalReadingCount = Object.keys(readingMap).length;
    if (countText) {
      countText.textContent = `${filtered.length} Kitap (${totalReadingCount} Öğrencide)`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <i data-lucide="book-x" style="width: 40px; height: 40px; opacity: 0.4; margin-bottom: 0.5rem;"></i>
          <p style="font-weight: 700;">Aramanıza uygun kitap bulunamadı.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Klasörlere Ayırma
    const folderGroups = [
      {
        id: 'folder-level-1',
        title: '📁 1. Seviye Kitaplar (Kolay / Başlangıç)',
        books: filtered.filter(b => (b.level || 'seviye_1') === 'seviye_1')
      },
      {
        id: 'folder-level-2',
        title: '📁 2. Seviye Kitaplar (İleri Seviye)',
        books: filtered.filter(b => b.level === 'seviye_2')
      },
      {
        id: 'folder-other',
        title: '📁 Genel / Diğer Kitaplar',
        books: filtered.filter(b => b.level && b.level !== 'seviye_1' && b.level !== 'seviye_2')
      }
    ].filter(f => f.books.length > 0);

    folderGroups.forEach((folder) => {
      const folderCard = document.createElement('div');
      folderCard.className = 'catalog-folder-card';

      const folderHeader = document.createElement('div');
      folderHeader.className = 'catalog-folder-header';
      folderHeader.innerHTML = `
        <div class="catalog-folder-title">
          <span>${folder.title}</span>
          <span class="catalog-folder-badge">${folder.books.length} Kitap</span>
        </div>
        <i data-lucide="chevron-down" style="width: 18px; height: 18px; color: var(--m-text-muted); transition: transform 0.2s;" id="chevron-${folder.id}"></i>
      `;

      const folderContent = document.createElement('div');
      folderContent.className = 'catalog-books-list';
      folderContent.id = `content-${folder.id}`;

      folder.books.forEach(b => {
        const isReading = !!readingMap[b.id];
        const readerName = readingMap[b.id] || '';
        const qCount = Array.isArray(b.questions) ? b.questions.length : 0;

        const card = document.createElement('div');
        card.className = `catalog-book-card ${isReading ? 'is-borrowed' : 'is-available'}`;
        card.onclick = () => window.openBookQuestionsModal(b.id);

        let statusBadge = '';
        if (isReading) {
          statusBadge = `<span class="catalog-status-tag borrowed">👤 ${escapeHTML(readerName)}'da (Okuyor)</span>`;
        } else {
          statusBadge = `<span class="catalog-status-tag available">✓ Kütüphanede (Müsait)</span>`;
        }

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 6px;">
            ${statusBadge}
            <span class="catalog-questions-tag">
              <i data-lucide="help-circle" style="width: 12px; height: 12px;"></i> ${qCount > 0 ? qCount + ' Soru' : '+ Soru Ekle'}
            </span>
          </div>
          <div style="font-weight: 800; font-size: 0.92rem; color: var(--m-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHTML(b.title)}
          </div>
          <div style="font-size: 0.74rem; color: var(--m-text-muted); margin-top: 2px;">
            <span>${escapeHTML(b.author || 'Yazar Belirtilmemiş')}</span> • <span>${b.pages || 0} Sayfa</span> ${b.bookNo ? '• No: ' + escapeHTML(b.bookNo) : ''}
          </div>
        `;
        folderContent.appendChild(card);
      });

      // Accordion toggle
      folderHeader.onclick = () => {
        const isOpen = folderContent.style.display !== 'none';
        folderContent.style.display = isOpen ? 'none' : 'flex';
        const ch = document.getElementById(`chevron-${folder.id}`);
        if (ch) ch.style.transform = isOpen ? 'rotate(-90deg)' : 'rotate(0deg)';
        window.vibrate(15);
      };

      folderCard.appendChild(folderHeader);
      folderCard.appendChild(folderContent);
      container.appendChild(folderCard);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================================================
  // KİTAP SORULARI GÖRÜNTÜLEME VE EKLEME MODALI
  // ==========================================================================
  const DEFAULT_STARTER_QUESTIONS = [
    { question: "Kitabın ana kahramanı kimdir ve en belirgin özellikleri nelerdir?", answer: "Ana karakter ve kişilik özellikleri." },
    { question: "Kitaptaki olayların geçtiği ana mekan ve zaman dilimi neresidir?", answer: "Olayların geçtiği yer ve çevre." },
    { question: "Kitapta karakterin karşılaştığı en büyük zorluk veya problem neydi?", answer: "Karşılaşılan engel ve çözüm yolu." },
    { question: "Bu kitabı okuduktan sonra kendinize çıkardığınız ana fikir veya ders nedir?", answer: "Kitabın ana fikri ve verilen mesaj." }
  ];

  let activeQuestionReturnStudentId = null;

  window.closeBookQuestionsModal = () => {
    const studentIdToReturn = activeQuestionReturnStudentId;
    activeQuestionReturnStudentId = null;
    if (studentIdToReturn) {
      window.openManageStudentBooksModal(studentIdToReturn);
    } else {
      window.closeBottomSheet();
    }
  };

  window.openBookQuestionsModal = (bookId, returnStudentId = null) => {
    if (!window.stateManager) return;
    const allBooks = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    if (returnStudentId !== undefined) {
      activeQuestionReturnStudentId = returnStudentId;
    }

    const titleEl = document.getElementById('m-questions-book-title');
    const authorEl = document.getElementById('m-questions-book-author');
    const bodyEl = document.getElementById('m-book-questions-body');

    if (titleEl) titleEl.textContent = `📖 ${book.title}`;
    if (authorEl) authorEl.textContent = `${book.author || 'Bilinmiyor'} • ${book.pages || 0} Sayfa (Sorular & Değerlendirme)`;

    if (!bodyEl) return;

    const questions = Array.isArray(book.questions) ? [...book.questions] : [];

    let questionsListHtml = '';
    if (questions.length === 0) {
      questionsListHtml = `
        <div style="text-align: center; padding: 1.5rem 1rem; color: var(--m-text-muted); background: var(--m-surface-subtle); border-radius: var(--m-radius-md); border: 1px dashed var(--m-border); margin-bottom: 1rem;">
          <i data-lucide="help-circle" style="width: 32px; height: 32px; opacity: 0.4; margin-bottom: 0.4rem;"></i>
          <p style="font-weight: 700; margin: 0; font-size: 0.85rem;">Bu kitaba henüz özel soru eklenmemiş.</p>
          <p style="font-size: 0.75rem; margin-top: 4px;">Yapay zekaya otomatik soru hazırlatabilir veya standart soruları ekleyebilirsiniz.</p>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 0.85rem;">
            <button type="button" class="m-btn-sm" style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border: none; font-weight: 700; padding: 7px 14px; border-radius: var(--m-radius-sm); box-shadow: 0 2px 6px rgba(139, 92, 246, 0.35); cursor: pointer;" onclick="window.generateAiBookQuestionsMobile('${book.id}')">
              ✨ Yapay Zeka ile Üret
            </button>
            <button type="button" class="m-btn-sm" style="background: var(--m-surface); border: 1.5px solid var(--m-border); color: var(--m-text); font-weight: 700; padding: 7px 14px; border-radius: var(--m-radius-sm); cursor: pointer;" onclick="window.loadStarterQuestionsToBook('${book.id}')">
              📋 Standart Soruları Ekle
            </button>
          </div>
        </div>
      `;
    } else {
      questionsListHtml = questions.map((q, idx) => `
        <div class="question-bubble-card">
          <div class="question-bubble-header">
            <span class="question-num-pill">Soru ${idx + 1}</span>
            <button type="button" class="question-del-btn" title="Soruyu Sil" onclick="window.deleteBookQuestion('${book.id}', ${idx})">
              <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
            </button>
          </div>
          <div class="question-text-content">❓ ${escapeHTML(q.question)}</div>
          <div class="answer-text-content" style="margin-top: 6px; padding: 6px 10px; background: rgba(16, 185, 129, 0.08); border-radius: 6px; border-left: 3px solid var(--m-success); font-size: 0.82rem;">
            <strong style="color: var(--m-success);">Cevap:</strong> ${escapeHTML(q.answer || 'Cevap belirtilmemiş')}
          </div>
        </div>
      `).join('');
    }

    bodyEl.innerHTML = `
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
          <h4 style="font-size: 0.88rem; font-weight: 800; color: var(--m-text);">
            Kayıtlı Sorular (${questions.length})
          </h4>
          <button type="button" class="m-btn-sm" style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border: none; font-weight: 700; font-size: 0.72rem; padding: 4px 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 4px;" onclick="window.generateAiBookQuestionsMobile('${book.id}')">
            <span>✨ AI Soru Üret</span>
          </button>
        </div>
        ${questionsListHtml}
      </div>

      <!-- Yeni Soru Ekleme Formu -->
      <div class="new-question-box">
        <div style="font-size: 0.85rem; font-weight: 800; color: var(--m-primary); margin-bottom: 0.65rem; display: flex; align-items: center; gap: 4px;">
          <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i> Bu Kitaba Yeni Soru Ekle
        </div>
        <div class="mobile-input-group" style="margin-bottom: 0.65rem;">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--m-text-muted); display: block; margin-bottom: 3px;">Soru Metni</label>
          <input type="text" id="m-new-q-text" class="mobile-input" placeholder="Örn: Zeze'nin şeker portakalı fidanının adı nedir?">
        </div>
        <div class="mobile-input-group" style="margin-bottom: 0.85rem;">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--m-text-muted); display: block; margin-bottom: 3px;">Beklenen Cevap (İsteğe Bağlı)</label>
          <input type="text" id="m-new-q-ans" class="mobile-input" placeholder="Örn: Minguinho">
        </div>
        <button type="button" class="subview-primary-action-btn" onclick="window.saveNewBookQuestion('${book.id}')">
          <i data-lucide="check" style="width: 16px; height: 16px;"></i> Soruyu Kaydet
        </button>
      </div>

      <button type="button" class="subview-secondary-btn" style="margin-top: 1rem;" onclick="window.closeBookQuestionsModal()">
        ${activeQuestionReturnStudentId ? '← Geri Dön (Kitap İşlemleri)' : 'Kapat'}
      </button>
    `;

    openBottomSheet('modal-book-questions');
    if (window.lucide) window.lucide.createIcons();
  };

  window.saveNewBookQuestion = (bookId) => {
    const qInput = document.getElementById('m-new-q-text');
    const aInput = document.getElementById('m-new-q-ans');
    if (!qInput) return;

    const qText = qInput.value.trim();
    const aText = aInput ? aInput.value.trim() : '';

    if (!qText) {
      showMobileToast('❌ Lütfen soru metnini yazın');
      return;
    }

    const allBooks = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    if (!Array.isArray(book.questions)) {
      book.questions = [];
    }

    book.questions.push({ question: qText, answer: aText });

    if (typeof window.stateManager.updateBookQuestions === 'function') {
      window.stateManager.updateBookQuestions(bookId, book.questions);
    } else {
      window.stateManager.saveState();
    }

    window.vibrate(30);
    showMobileToast('✅ Soru kitaba başarıyla eklendi!');
    window.openBookQuestionsModal(bookId, activeQuestionReturnStudentId);
    renderBooksCatalogPane();
  };

  window.deleteBookQuestion = (bookId, qIdx) => {
    const allBooks = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const book = allBooks.find(b => b.id === bookId);
    if (!book || !Array.isArray(book.questions)) return;

    book.questions.splice(qIdx, 1);

    if (typeof window.stateManager.updateBookQuestions === 'function') {
      window.stateManager.updateBookQuestions(bookId, book.questions);
    } else {
      window.stateManager.saveState();
    }

    window.vibrate(25);
    showMobileToast('🗑️ Soru silindi');
    window.openBookQuestionsModal(bookId, activeQuestionReturnStudentId);
    renderBooksCatalogPane();
  };

  window.loadStarterQuestionsToBook = (bookId) => {
    const allBooks = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    book.questions = JSON.parse(JSON.stringify(DEFAULT_STARTER_QUESTIONS));

    if (typeof window.stateManager.updateBookQuestions === 'function') {
      window.stateManager.updateBookQuestions(bookId, book.questions);
    } else {
      window.stateManager.saveState();
    }

    window.vibrate(35);
    showMobileToast('✨ Standart sorular kitaba yüklendi!');
    window.openBookQuestionsModal(bookId, activeQuestionReturnStudentId);
    renderBooksCatalogPane();
  };

  // ==========================================================================
  // YAPAY ZEKA İLE KİTAP SORUSU HAZIRLAMA: ÖN BİLGİLENDİRME & CANLI SÜREÇ
  // ==========================================================================
  window.showAiBookQuestionsInfo = (bookId) => {
    const allBooks = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    if (!window.hasGeminiApiKey || !window.hasGeminiApiKey()) {
      if (typeof window.showGeminiKeyRequiredModal === 'function') {
        window.showGeminiKeyRequiredModal({
          featureName: 'Kitap Soru Hazırlama',
          description: 'Kitaba ait okuduğunu anlama sorularını yapay zekaya hazırlatabilmek için Google Gemini bağlantısı gereklidir.',
          onSuccess: () => window.showAiBookQuestionsInfo(bookId)
        });
      } else {
        showMobileToast('⚠️ Yapay zeka ile soru hazırlamak için lütfen Ayarlar > Yapay Zeka menüsünden API anahtarınızı girin.');
      }
      return;
    }

    const bodyEl = document.getElementById('m-book-questions-body');
    if (!bodyEl) return;

    const state = (window.stateManager && window.stateManager.state) || {};
    const gradeLevel = state.gradeLevel || 3;
    const isMiddle = isMiddleSchool();
    const currentQuestionCount = Array.isArray(book.questions) ? book.questions.length : 0;

    bodyEl.innerHTML = `
      <div class="ai-gen-info-card">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.85rem;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #8b5cf6, #6366f1); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35); flex-shrink: 0;">
            <i data-lucide="sparkles" style="width: 24px; height: 24px;"></i>
          </div>
          <div style="min-width: 0; flex: 1;">
            <div style="font-size: 1rem; font-weight: 800; color: var(--m-primary);">Yapay Zeka Soru Hazırlama</div>
            <div style="font-size: 0.74rem; color: var(--m-text-muted);">Gemini AI Pedagojik Soru & Cevap Motoru</div>
          </div>
        </div>

        <div class="ai-book-summary-box">
          <div style="margin-bottom: 3px;">📖 <strong>Kitap:</strong> ${escapeHTML(book.title)}</div>
          <div style="margin-bottom: 3px;">✍️ <strong>Yazar:</strong> ${escapeHTML(book.author || 'Belirtilmemiş')} (${book.pages || 0} Sayfa)</div>
          <div>🎯 <strong>Hedef Düzey:</strong> ${gradeLevel}. Sınıf (${isMiddle ? 'Ortaokul' : 'İlkokul'}) Öğrenci Seviyesi</div>
        </div>

        <div style="font-size: 0.78rem; font-weight: 700; color: var(--m-text); margin-bottom: 0.45rem;">
          📋 Süreç ve Hazırlanacak İçerik Bilgisi:
        </div>

        <div class="ai-gen-steps-desc">
          <div class="ai-gen-step-item">
            <span class="step-num">1</span>
            <div>
              <strong>5 Adet Açık Uçlu Soru:</strong> Kitabın ana fikri, olay örgüsü, kahramanları ve mesajını ölçen, ezber yerine kavrama ve metin tahlili odaklı sorular hazırlanır.
            </div>
          </div>
          <div class="ai-gen-step-item">
            <span class="step-num">2</span>
            <div>
              <strong>Öğretmen Model Cevapları:</strong> Öğrenciyi sözlü veya yazılı yoklarken doğru yanıtı hemen teyit edebilmeniz için her sorunun altına beklenen doğru cevap anahtarı eklenir.
            </div>
          </div>
          <div class="ai-gen-step-item">
            <span class="step-num">3</span>
            <div>
              <strong>Kalıcı Soru Havuzu:</strong> Üretilen sorular kütüphanenizdeki bu kitaba kaydedilir. Bu kitabı okuyan diğer öğrencilerde sorularınız hazır olacaktır. ${currentQuestionCount > 0 ? `<br><span style="color: #8b5cf6; font-weight: 700;">(Kitapta şu an ${currentQuestionCount} soru kayıtlı. Yeni sorular bu listeye eklenecektir.)</span>` : ''}
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 1.15rem;">
          <button type="button" class="subview-secondary-btn" style="flex: 1; margin: 0; padding: 10px;" onclick="window.openBookQuestionsModal('${book.id}', activeQuestionReturnStudentId)">
            Vazgeç
          </button>
          <button type="button" class="subview-primary-action-btn" style="flex: 2; margin: 0; padding: 10px; background: linear-gradient(135deg, #8b5cf6, #6366f1); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35); font-size: 0.88rem;" onclick="window.startAiQuestionsGeneration('${book.id}')">
            <i data-lucide="sparkles" style="width: 16px; height: 16px;"></i>
            <span>Soruları Oluşturmaya Başla</span>
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  };

  // Eski fonksiyon adı çağrıldığında doğrudan ön bilgilendirmeyi aç
  window.generateAiBookQuestionsMobile = (bookId) => {
    window.showAiBookQuestionsInfo(bookId);
  };

  window.startAiQuestionsGeneration = async (bookId) => {
    const allBooks = window.stateManager.getBooks ? window.stateManager.getBooks() : (window.stateManager.state.books ? window.stateManager.state.books.library || [] : []);
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    const bodyEl = document.getElementById('m-book-questions-body');
    if (!bodyEl) return;

    window.vibrate(30);

    // Canlı İlerleme Ekranını Göster
    bodyEl.innerHTML = `
      <div class="ai-gen-progress-card" id="m-ai-gen-progress-card">
        <div class="ai-pulse-icon">
          <div class="ai-pulse-ring"></div>
          <i data-lucide="sparkles" style="width: 30px; height: 30px; color: white;"></i>
        </div>

        <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--m-text); margin: 0.95rem 0 0.25rem 0;">
          Yapay Zeka Soruları Hazırlıyor...
        </h3>
        <p style="font-size: 0.78rem; color: var(--m-text-muted); margin: 0 0 1rem 0; line-height: 1.45;">
          "${escapeHTML(book.title)}" kitabı inceleniyor ve pedagojik sorular oluşturuluyor.
        </p>

        <!-- Canlı Durum Adımları -->
        <div class="ai-live-steps-container">
          <div class="ai-live-step done" id="ai-step-1">
            <span class="step-icon">✓</span>
            <span class="step-label">Kitap bilgileri ve sınıf düzeyi analiz edildi</span>
          </div>
          <div class="ai-live-step active" id="ai-step-2">
            <span class="step-icon"><i data-lucide="loader-2" style="width: 14px; height: 14px;"></i></span>
            <span class="step-label">Gemini AI ile metin kavrama soruları yazılıyor...</span>
          </div>
          <div class="ai-live-step pending" id="ai-step-3">
            <span class="step-icon">○</span>
            <span class="step-label">Öğretmen değerlendirme cevap anahtarları düzenleniyor...</span>
          </div>
          <div class="ai-live-step pending" id="ai-step-4">
            <span class="step-icon">○</span>
            <span class="step-label">Kitap soru havuzuna kaydediliyor...</span>
          </div>
        </div>

        <!-- İlerleme Çubuğu -->
        <div class="ai-progress-bar-wrapper">
          <div class="ai-progress-bar-fill" id="ai-progress-fill" style="width: 35%;"></div>
        </div>

        <div style="font-size: 0.72rem; color: var(--m-text-muted); margin-top: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 4px;">
          <i data-lucide="info" style="width: 14px; height: 14px;"></i>
          <span>Bu işlem genellikle 3-5 saniye sürer. Lütfen bekleyin...</span>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Zamanlayıcılarla adım ilerleme görseli
    const stepTimer1 = setTimeout(() => {
      const s2 = document.getElementById('ai-step-2');
      const s3 = document.getElementById('ai-step-3');
      const fill = document.getElementById('ai-progress-fill');
      if (s2) {
        s2.className = 'ai-live-step done';
        s2.querySelector('.step-icon').innerHTML = '✓';
      }
      if (s3) {
        s3.className = 'ai-live-step active';
        s3.querySelector('.step-icon').innerHTML = '<i data-lucide="loader-2" style="width: 14px; height: 14px;"></i>';
      }
      if (fill) fill.style.width = '70%';
      if (window.lucide) window.lucide.createIcons();
    }, 1800);

    try {
      const state = (window.stateManager && window.stateManager.state) || {};
      const grade = state.gradeLevel || 3;
      const prompt = `Sen uzman ve pedagojik formasyona sahip bir Türkçe öğretmenisin. "${book.title}" (${book.author || 'Bilinmiyor'}) kitabı için ${grade}. sınıf öğrencilerine uygun 5 adet okuduğunu anlama sorusu ve cevaplarını hazırla.
Sorular ezber yerine olay örgüsü, ana fikir, karakter analizi ve neden-sonuç ilişkilerini içersin.
Yanıtını YALNIZCA geçerli bir JSON formatında ver:
[
  {"question": "Soru metni...", "answer": "Beklenen cevap..."}
]`;

      const response = await window.callGeminiAPI(prompt, { temperature: 0.7 });
      clearTimeout(stepTimer1);

      // Adım 3 ve 4 tamamlandı
      const s3 = document.getElementById('ai-step-3');
      const s4 = document.getElementById('ai-step-4');
      const fill = document.getElementById('ai-progress-fill');
      if (s3) {
        s3.className = 'ai-live-step done';
        s3.querySelector('.step-icon').innerHTML = '✓';
      }
      if (s4) {
        s4.className = 'ai-live-step done';
        s4.querySelector('.step-icon').innerHTML = '✓';
      }
      if (fill) fill.style.width = '100%';

      let cleanText = response.trim();
      if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
      if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
      if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
      cleanText = cleanText.trim();

      const questions = JSON.parse(cleanText);
      if (Array.isArray(questions) && questions.length > 0) {
        if (!Array.isArray(book.questions)) book.questions = [];
        questions.forEach(q => {
          if (q.question) book.questions.push({ question: q.question, answer: q.answer || '' });
        });

        if (typeof window.stateManager.updateBookQuestions === 'function') {
          window.stateManager.updateBookQuestions(bookId, book.questions);
        } else {
          window.stateManager.saveState();
        }

        window.vibrate(40);

        // Başarı ekranını 700ms gösterip soru listesini aç
        const progCard = document.getElementById('m-ai-gen-progress-card');
        if (progCard) {
          progCard.innerHTML = `
            <div style="width: 58px; height: 58px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: var(--m-success); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 0.75rem;">
              <i data-lucide="check" style="width: 32px; height: 32px;"></i>
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--m-success); margin: 0 0 0.4rem 0;">
              ✨ Sorular Başarıyla Hazırlandı!
            </h3>
            <p style="font-size: 0.8rem; color: var(--m-text-muted); margin: 0;">
              ${questions.length} adet yeni soru kitaba kaydedildi. Soru listesine dönülüyor...
            </p>
          `;
          if (window.lucide) window.lucide.createIcons();
        }

        setTimeout(() => {
          showMobileToast(`✨ "${book.title}" için ${questions.length} soru başarıyla eklendi!`);
          window.openBookQuestionsModal(bookId, activeQuestionReturnStudentId);
          renderBooksCatalogPane();
        }, 800);
      } else {
        throw new Error('Soru listesi ayrıştırılamadı.');
      }
    } catch (err) {
      clearTimeout(stepTimer1);
      console.error(err);
      window.vibrate([40, 60, 40]);
      
      const progCard = document.getElementById('m-ai-gen-progress-card');
      if (progCard) {
        progCard.innerHTML = `
          <div style="width: 58px; height: 58px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); color: var(--m-danger); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 0.75rem;">
            <i data-lucide="alert-triangle" style="width: 30px; height: 30px;"></i>
          </div>
          <h3 style="font-size: 1rem; font-weight: 800; color: var(--m-danger); margin: 0 0 0.4rem 0;">
            Soru Hazırlanırken Hata Oluştu
          </h3>
          <p style="font-size: 0.78rem; color: var(--m-text-muted); margin: 0 0 1rem 0; line-height: 1.45;">
            ${escapeHTML(err.message || 'Yapay zeka servisi yanıt vermedi.')}
          </p>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button type="button" class="subview-secondary-btn" style="width: auto; padding: 7px 16px; margin: 0;" onclick="window.openBookQuestionsModal('${book.id}', activeQuestionReturnStudentId)">
              Kapat
            </button>
            <button type="button" class="subview-primary-action-btn" style="width: auto; padding: 7px 16px; margin: 0; background: linear-gradient(135deg, #8b5cf6, #6366f1);" onclick="window.startAiQuestionsGeneration('${book.id}')">
              Tekrar Dene
            </button>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
      } else {
        showMobileToast('❌ Soru üretilirken hata oluştu: ' + (err.message || ''));
      }
    }
  };


  window.renderBooksTab = renderBooksTab;

})(window);
