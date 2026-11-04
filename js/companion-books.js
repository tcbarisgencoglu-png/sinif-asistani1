/**
 * Sınıf Asistanı — El Terminali: Kitaplık & Barkod Modülü (companion-books.js)
 * 3 Sütunlu Öğrenci Izgarası, Dokunmatik Sürükle-Bırak Sıralama,
 * Hızlı Ödünç Verme & İade Alma Modalı ve Canlı Masaüstü Eşitleme.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'sinif_asistani_data';
  const ORDER_KEY_PREFIX = 'sinif_companion_student_order_';

  // HTML Kaçış Yardımcısı (XSS Koruması & Güvenli Render)
  function escapeHTML(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }
  if (!window.escapeHTML) window.escapeHTML = escapeHTML;

  // Ses Efekti (Web Audio API - Çevrim Dışı)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playBookSound(isReturn) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      if (isReturn) {
        // İade: Çift onay tonu (E5 -> A5)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      } else {
        // Ödünç: Başarı tonu (C5 -> G5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.24);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  const CompanionBooks = {
    students: [],
    activeStudent: null,
    activeBookTransaction: null,
    availableBooks: [],
    filteredAvailableBooks: [],
    justFinishedDrag: false,
    currentRecommendStudentId: null,
    currentRecommendFilter: 'all',
    currentRecommendSearch: '',
    lendingTargetStudent: null,

    getData() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return { students: [], books: { library: [], transactions: [] } };
    },

    saveData(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Kitap verisi kaydetme hatası:', e);
      }
    },

    getActiveStudents() {
      const data = this.getData();
      const allStudents = Array.isArray(data.students) ? data.students : [];
      const activeSection = (window.Companion && window.Companion.activeSection) || '5-A';

      const filtered = allStudents.filter(s => {
        const sec = (s.section || s.className || '').trim();
        return sec === activeSection || !sec;
      });

      // Kaydedilmiş özel sıralama varsa uygula
      const savedOrderKey = ORDER_KEY_PREFIX + activeSection;
      const savedOrderRaw = localStorage.getItem(savedOrderKey);
      if (savedOrderRaw) {
        try {
          const savedIds = JSON.parse(savedOrderRaw);
          if (Array.isArray(savedIds) && savedIds.length > 0) {
            const idMap = new Map();
            savedIds.forEach((id, idx) => idMap.set(String(id), idx));

            filtered.sort((a, b) => {
              const posA = idMap.has(String(a.id)) ? idMap.get(String(a.id)) : 9999;
              const posB = idMap.has(String(b.id)) ? idMap.get(String(b.id)) : 9999;
              if (posA !== posB) return posA - posB;
              return (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0);
            });
          }
        } catch (e) {}
      } else {
        filtered.sort((a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0));
      }

      return filtered;
    },

    // Öğrencinin şu an elinde olan aktif kitabı ve ödünç kaydını bul
    getStudentActiveBook(studentOrId) {
      const data = this.getData();
      const booksData = data.books || {};
      const txList = Array.isArray(booksData.transactions) ? booksData.transactions : [];
      const libList = Array.isArray(booksData.library) ? booksData.library : [];

      let targetId = null;
      let targetNumber = null;
      if (typeof studentOrId === 'object' && studentOrId !== null) {
        targetId = studentOrId.id != null ? String(studentOrId.id) : null;
        targetNumber = studentOrId.number != null ? String(studentOrId.number).trim() : null;
      } else if (studentOrId != null) {
        targetId = String(studentOrId);
        const sObj = this.students.find(s => String(s.id) === targetId);
        if (sObj && sObj.number != null) targetNumber = String(sObj.number).trim();
      }

      // Aktif okunan ödünç kaydını ara
      const activeTx = txList.find(t => {
        if (t.status !== 'reading') return false;
        if (targetId && t.studentId != null && String(t.studentId) === targetId) return true;
        if (targetNumber && t.studentNumber != null && String(t.studentNumber).trim() === targetNumber) return true;
        return false;
      });

      if (!activeTx) return null;

      const book = libList.find(b => String(b.id) === String(activeTx.bookId));
      return {
        transaction: activeTx,
        book: book || { id: activeTx.bookId, title: 'Bilinmeyen Kitap', author: '-', bookNo: '-' }
      };
    },

    // Ödünç verilebilir raftaki boş kitapları getir
    getAvailableBooks() {
      const data = this.getData();
      const booksData = data.books || {};
      const libList = Array.isArray(booksData.library) ? booksData.library : [];
      const txList = Array.isArray(booksData.transactions) ? booksData.transactions : [];

      // Halihazırda biri tarafından okunan kitap ID'leri kümesi
      const readingBookIds = new Set();
      txList.forEach(t => {
        if (t.status === 'reading' && t.bookId != null) {
          readingBookIds.add(String(t.bookId));
        }
      });

      return libList.filter(b => {
        if (b.isDeleted) return false;
        if (readingBookIds.has(String(b.id))) return false;
        return true;
      });
    },

    // Modülü Başlat
    init() {
      this.students = this.getActiveStudents();
      this.updateHeaderInfo();
      this.renderGrid();
    },

    updateHeaderInfo() {
      const activeSection = (window.Companion && window.Companion.activeSection) || '5-A';
      const subEl = document.getElementById('books-view-subtitle');
      if (subEl) {
        subEl.textContent = `${activeSection} Şubesi • ${this.students.length} Öğrenci`;
      }
    },

    onSearchInput(val) {
      this.renderGrid(val);
    },

    // 3 Sütunlu Izgarayı Render Et
    renderGrid(filterQuery = '') {
      const container = document.getElementById('books-students-grid');
      if (!container) return;

      let displayStudents = this.students;
      if (filterQuery && filterQuery.trim()) {
        const q = filterQuery.trim().toLowerCase();
        displayStudents = this.students.filter(s => {
          const fullName = `${s.name || ''} ${s.surname || ''}`.toLowerCase();
          const num = String(s.number || '');
          return fullName.includes(q) || num.includes(q);
        });
      }

      if (displayStudents.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px 16px; background: rgba(255,255,255,0.08); border-radius: 16px; color: #ffffff;">
            <i data-lucide="book-open" style="width: 40px; height: 40px; margin: 0 auto 10px; color: #93c5fd;"></i>
            <h4 style="font-size: 15px; font-weight: 700;">Öğrenci bulunamadı</h4>
            <p style="font-size: 12px; color: #93c5fd; margin-top: 4px;">Arama kriterini değiştirebilir veya masaüstünden öğrencileri tazeleyebilirsiniz.</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const colors = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#6366f1'];

      container.innerHTML = displayStudents.map((s, idx) => {
        const activeInfo = this.getStudentActiveBook(s);
        const initials = ((s.name ? s.name[0] : '') + (s.surname ? s.surname[0] : '')).toUpperCase() || '?';
        const color = s.gender === 'female' ? '#ec4899' : (s.gender === 'male' ? '#3b82f6' : colors[idx % colors.length]);

        let badgeHtml = '';
        if (activeInfo && activeInfo.book) {
          const bTitle = activeInfo.book.bookNo ? `#${activeInfo.book.bookNo}` : (activeInfo.book.title || 'Kitap');
          badgeHtml = `
            <div class="c-student-book-badge has-book" title="${activeInfo.book.title || ''}">
              <i data-lucide="book" style="width: 10px; height: 10px;"></i>
              <span>${bTitle}</span>
            </div>
          `;
        } else {
          badgeHtml = `
            <div class="c-student-book-badge no-book">
              <span>—</span>
            </div>
          `;
        }

        const avatarHtml = s.photo
          ? `<img src="${s.photo}" class="c-student-card-avatar" alt="${s.name}" />`
          : `<div class="c-student-card-avatar-initials" style="background: linear-gradient(135deg, ${color}, #1e3a8a);">${initials}</div>`;

        return `
          <div class="c-student-card-mini" data-id="${s.id}" draggable="true">
            <!-- Sürükleme Tutamağı -->
            <div class="c-card-drag-handle" title="Sıralamak için sürükleyin">
              <i data-lucide="grip-vertical" style="width: 14px; height: 14px;"></i>
            </div>

            <!-- Kitap Rozeti -->
            ${badgeHtml}

            <!-- Fotoğraf / Avatar -->
            <div class="c-student-avatar-wrap">
              ${avatarHtml}
            </div>

            <!-- İsim ve Numara -->
            <div class="c-student-card-name" title="${s.name} ${s.surname || ''}">
              ${s.name} ${s.surname ? s.surname[0] + '.' : ''}
            </div>
            <div class="c-student-card-num">#${s.number || (idx + 1)}</div>
          </div>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();

      // Sürükle-Bırak ve Dokunma Olaylarını Bağla
      this.bindDragAndTouchEvents(container);
    },

    // Dokunmatik ve Mouse Sürükle-Bırak Olayları
    bindDragAndTouchEvents(container) {
      const cards = container.querySelectorAll('.c-student-card-mini');

      cards.forEach(card => {
        let touchStartX = 0;
        let touchStartY = 0;
        let isTouching = false;
        let isDraggingCard = false;
        let longPressTimer = null;
        let ghostEl = null;

        card.addEventListener('touchstart', (e) => {
          const touch = e.touches[0];
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
          isTouching = true;
          isDraggingCard = false;

          longPressTimer = setTimeout(() => {
            if (isTouching) {
              isDraggingCard = true;
              card.classList.add('is-dragging');
              if (navigator.vibrate) navigator.vibrate(40);

              ghostEl = card.cloneNode(true);
              ghostEl.style.position = 'fixed';
              ghostEl.style.zIndex = '9999';
              ghostEl.style.pointerEvents = 'none';
              ghostEl.style.opacity = '0.85';
              ghostEl.style.transform = 'scale(1.05)';
              ghostEl.style.width = `${card.offsetWidth}px`;
              ghostEl.style.height = `${card.offsetHeight}px`;
              ghostEl.style.left = `${touch.clientX - card.offsetWidth / 2}px`;
              ghostEl.style.top = `${touch.clientY - card.offsetHeight / 2}px`;
              document.body.appendChild(ghostEl);
            }
          }, 320);
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
          const touch = e.touches[0];
          const diffX = Math.abs(touch.clientX - touchStartX);
          const diffY = Math.abs(touch.clientY - touchStartY);

          if (!isDraggingCard && (diffX > 10 || diffY > 10)) {
            clearTimeout(longPressTimer);
          }

          if (isDraggingCard) {
            e.preventDefault();
            if (ghostEl) {
              ghostEl.style.left = `${touch.clientX - card.offsetWidth / 2}px`;
              ghostEl.style.top = `${touch.clientY - card.offsetHeight / 2}px`;
            }

            const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
            if (elementUnder) {
              const targetCard = elementUnder.closest('.c-student-card-mini');
              if (targetCard && targetCard !== card && targetCard.parentNode === container) {
                const rect = targetCard.getBoundingClientRect();
                const midX = rect.left + rect.width / 2;
                if (touch.clientX < midX) {
                  container.insertBefore(card, targetCard);
                } else {
                  container.insertBefore(card, targetCard.nextSibling);
                }
              }
            }
          }
        }, { passive: false });

        const endTouch = () => {
          isTouching = false;
          clearTimeout(longPressTimer);
          if (ghostEl) {
            ghostEl.remove();
            ghostEl = null;
          }
          if (isDraggingCard) {
            card.classList.remove('is-dragging');
            isDraggingCard = false;
            CompanionBooks.justFinishedDrag = true;
            setTimeout(() => { CompanionBooks.justFinishedDrag = false; }, 300);
            CompanionBooks.saveCurrentOrder(container);
          }
        };

        card.addEventListener('touchend', endTouch);
        card.addEventListener('touchcancel', endTouch);

        // Karta Tıklama -> Öğrenci Kitap Modalı
        card.addEventListener('click', (e) => {
          if (CompanionBooks.justFinishedDrag) return;
          const sId = card.getAttribute('data-id');
          const student = CompanionBooks.students.find(s => String(s.id) === String(sId));
          if (student) {
            CompanionBooks.openStudentBookModal(student);
          }
        });

        // Masaüstü Drag & Drop
        card.addEventListener('dragstart', (e) => {
          card.classList.add('is-dragging');
          e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
          e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('is-dragging');
          CompanionBooks.saveCurrentOrder(container);
        });

        card.addEventListener('dragover', (e) => {
          e.preventDefault();
          const draggingCard = container.querySelector('.is-dragging');
          if (draggingCard && draggingCard !== card) {
            const rect = card.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            if (e.clientX < midX) {
              container.insertBefore(draggingCard, card);
            } else {
              container.insertBefore(draggingCard, card.nextSibling);
            }
          }
        });
      });
    },

    saveCurrentOrder(container) {
      const activeSection = (window.Companion && window.Companion.activeSection) || '5-A';
      const cards = container.querySelectorAll('.c-student-card-mini');
      const newOrderIds = [];
      cards.forEach(c => {
        const id = c.getAttribute('data-id');
        if (id) newOrderIds.push(id);
      });

      const savedOrderKey = ORDER_KEY_PREFIX + activeSection;
      localStorage.setItem(savedOrderKey, JSON.stringify(newOrderIds));

      const idMap = new Map();
      newOrderIds.forEach((id, idx) => idMap.set(String(id), idx));
      this.students.sort((a, b) => {
        const posA = idMap.has(String(a.id)) ? idMap.get(String(a.id)) : 9999;
        const posB = idMap.has(String(b.id)) ? idMap.get(String(b.id)) : 9999;
        return posA - posB;
      });

      if (window.Companion && window.Companion.showToast) {
        window.Companion.showToast('Yeni oturma/kart sırası kaydedildi');
      }
    },

    resetOrder(type) {
      const activeSection = (window.Companion && window.Companion.activeSection) || '5-A';
      const savedOrderKey = ORDER_KEY_PREFIX + activeSection;

      if (type === 'number') {
        this.students.sort((a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0));
        localStorage.removeItem(savedOrderKey);
        if (window.Companion && window.Companion.showToast) {
          window.Companion.showToast('Numara sırasına dönüldü');
        }
      } else if (type === 'name') {
        this.students.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
        const orderIds = this.students.map(s => s.id);
        localStorage.setItem(savedOrderKey, JSON.stringify(orderIds));
        if (window.Companion && window.Companion.showToast) {
          window.Companion.showToast('İsim sırasına göre dizildi');
        }
      }

      this.renderGrid();
    },

    // -------------------------------------------------------------------------
    // KİTAP MODAL & ÖDÜNÇ/İADE İŞLEMLERİ
    // -------------------------------------------------------------------------
    openStudentBookModal(student) {
      this.activeStudent = student;
      const modal = document.getElementById('companion-book-modal');
      if (!modal) return;

      // Öğrenci Bilgileri
      const nameEl = document.getElementById('book-modal-student-name');
      const infoEl = document.getElementById('book-modal-student-info');
      const avatarEl = document.getElementById('book-modal-student-avatar');

      if (nameEl) nameEl.textContent = `${student.name} ${student.surname || ''}`;
      if (infoEl) {
        const activeSection = (window.Companion && window.Companion.activeSection) || '5-A';
        infoEl.textContent = `No: ${student.number || '-'} • ${activeSection} Şubesi`;
      }

      if (avatarEl) {
        if (student.photo) {
          avatarEl.innerHTML = `<img src="${student.photo}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
        } else {
          const initials = ((student.name ? student.name[0] : '') + (student.surname ? student.surname[0] : '')).toUpperCase() || '?';
          avatarEl.textContent = initials;
          avatarEl.style.background = student.gender === 'female' ? '#ec4899' : '#3b82f6';
        }
      }

      // Aktif Kitap Durumu
      this.renderActiveBookSection();

      // Boştaki Kitapları Yükle & Listele
      this.availableBooks = this.getAvailableBooks();
      this.filteredAvailableBooks = [...this.availableBooks];
      this.renderAvailableBooksList();

      // Modalı Aç
      modal.style.display = 'flex';
      requestAnimationFrame(() => modal.classList.add('active'));

      if (window.lucide) window.lucide.createIcons();
    },

    renderActiveBookSection() {
      const cardEl = document.getElementById('book-modal-current-card');
      const borrowSection = document.getElementById('book-modal-borrow-section');
      if (!cardEl) return;

      const activeInfo = this.getStudentActiveBook(this.activeStudent);
      this.activeBookTransaction = activeInfo ? activeInfo.transaction : null;

      if (activeInfo && activeInfo.book) {
        const b = activeInfo.book;
        const tx = activeInfo.transaction;
        const borrowDateStr = tx.borrowDate ? new Date(tx.borrowDate).toLocaleDateString('tr-TR') : 'Bugün';

        cardEl.className = 'c-active-book-card';
        cardEl.innerHTML = `
          <div class="c-active-book-header">
            <div class="c-active-book-icon">
              <i data-lucide="book-open" style="width: 20px; height: 20px;"></i>
            </div>
            <div class="c-active-book-details">
              <div class="c-active-book-title" title="${b.title || ''}">${b.title || 'Başlıksız Kitap'}</div>
              <div class="c-active-book-author">✍️ ${b.author || 'Yazar Belirtilmemiş'}</div>
              <div class="c-active-book-meta">
                <span class="c-active-book-meta-pill">No: ${b.bookNo || '-'}</span>
                <span class="c-active-book-meta-pill">Sayfa: ${b.pages || '-'}</span>
                <span class="c-active-book-meta-pill">📅 ${borrowDateStr}</span>
              </div>
            </div>
          </div>
          <button type="button" class="c-btn-return-book" onclick="window.CompanionBooks.returnActiveBook()">
            <i data-lucide="corner-down-left" style="width: 18px; height: 18px;"></i>
            <span>Kitabı Teslim Al (İade Et)</span>
          </button>
        `;

        // Öğrencinin elinde zaten kitap varsa yeni ödünç listesi daha kompakt veya gizlenebilir
        if (borrowSection) borrowSection.style.opacity = '0.5';
      } else {
        cardEl.className = 'c-active-book-card empty';
        cardEl.innerHTML = `
          <div style="font-weight: 700; color: #64748b;">Öğrencinin elinde şu an kayıtlı kitap yok.</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Aşağıdaki raftan bir kitap seçip hemen ödünç verebilirsiniz.</div>
        `;
        if (borrowSection) borrowSection.style.opacity = '1';
      }

      if (window.lucide) window.lucide.createIcons();
    },

    renderAvailableBooksList() {
      const listEl = document.getElementById('companion-available-books-list');
      const countEl = document.getElementById('book-modal-available-count');
      if (!listEl) return;

      if (countEl) {
        countEl.textContent = `Rafta ${this.filteredAvailableBooks.length} kitap`;
      }

      if (this.filteredAvailableBooks.length === 0) {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 24px 12px; color: #94a3b8; font-size: 12px; font-weight: 600;">
            <i data-lucide="inbox" style="width: 28px; height: 28px; margin: 0 auto 6px; color: #cbd5e1;"></i>
            <div>Uygun veya aranan kriterde kitap bulunamadı.</div>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      listEl.innerHTML = this.filteredAvailableBooks.map(b => {
        return `
          <div class="c-book-item-row">
            <div class="c-book-item-info">
              <div class="c-book-item-title" title="${b.title || ''}">${b.title || 'İsimsiz Kitap'}</div>
              <div class="c-book-item-sub">
                <span>✍️ ${b.author || '-'}</span>
                <span>•</span>
                <span>No: ${b.bookNo || '-'}</span>
                <span>•</span>
                <span>${b.pages ? b.pages + ' sf.' : ''}</span>
              </div>
            </div>
            <button type="button" class="c-btn-borrow-book" onclick="window.CompanionBooks.borrowBook('${b.id}')">
              <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
              <span>Ödünç Ver</span>
            </button>
          </div>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();
    },

    filterAvailableBooks(query) {
      if (!query || !query.trim()) {
        this.filteredAvailableBooks = [...this.availableBooks];
      } else {
        const q = query.trim().toLowerCase();
        this.filteredAvailableBooks = this.availableBooks.filter(b => {
          const t = (b.title || '').toLowerCase();
          const a = (b.author || '').toLowerCase();
          const n = String(b.bookNo || '').toLowerCase();
          const barcode = String(b.barcode || '').toLowerCase();
          return t.includes(q) || a.includes(q) || n.includes(q) || barcode.includes(q);
        });
      }
      this.renderAvailableBooksList();
    },

    // Kitabı Teslim Al
    returnActiveBook() {
      if (!this.activeStudent || !this.activeBookTransaction) return;

      const data = this.getData();
      if (!data.books) data.books = { library: [], transactions: [] };
      if (!Array.isArray(data.books.transactions)) data.books.transactions = [];

      const txIndex = data.books.transactions.findIndex(t => t.id === this.activeBookTransaction.id);
      const returnDate = new Date().toISOString();

      if (txIndex !== -1) {
        data.books.transactions[txIndex].status = 'returned';
        data.books.transactions[txIndex].returnDate = returnDate;
      } else {
        this.activeBookTransaction.status = 'returned';
        this.activeBookTransaction.returnDate = returnDate;
        data.books.transactions.push(this.activeBookTransaction);
      }

      this.saveData(data);
      playBookSound(true);

      // Canlı Masaüstüne Fırlat
      if (window.CloudSync && window.CloudSync.pushLiveBookTransaction) {
        const book = (data.books && data.books.library || []).find(b => String(b.id) === String(this.activeBookTransaction.bookId));
        window.CloudSync.pushLiveBookTransaction(
          'return',
          this.activeStudent.id,
          this.activeBookTransaction.bookId,
          this.activeBookTransaction.id,
          {
            returnDate,
            borrowDate: this.activeBookTransaction.borrowDate,
            studentName: `${this.activeStudent.name} ${this.activeStudent.surname || ''}`.trim(),
            bookTitle: book ? book.title : '',
            bookLevel: book ? book.level : 'seviye_1'
          }
        );
      }

      if (window.Companion && window.Companion.showToast) {
        window.Companion.showToast(`Kitap teslim alındı: ${this.activeStudent.name}`);
      }

      // Modalı ve Raftaki Kitapları Yenile
      this.renderActiveBookSection();
      this.availableBooks = this.getAvailableBooks();
      this.filteredAvailableBooks = [...this.availableBooks];
      this.renderAvailableBooksList();

      // Ana ızgarayı da güncelle
      this.renderGrid();
    },

    // Yeni Kitap Ödünç Ver
    borrowBook(bookId) {
      if (!this.activeStudent || !bookId) return;

      const data = this.getData();
      if (!data.books) data.books = { library: [], transactions: [] };
      if (!Array.isArray(data.books.transactions)) data.books.transactions = [];

      const borrowDate = new Date().toISOString().split('T')[0];
      const newTxId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

      const newTx = {
        id: newTxId,
        studentId: this.activeStudent.id,
        studentNumber: this.activeStudent.number,
        bookId: bookId,
        borrowDate: borrowDate,
        status: 'reading'
      };

      data.books.transactions.push(newTx);
      this.saveData(data);
      playBookSound(false);

      // Canlı Masaüstüne Fırlat
      if (window.CloudSync && window.CloudSync.pushLiveBookTransaction) {
        const book = (data.books && data.books.library || []).find(b => String(b.id) === String(bookId));
        window.CloudSync.pushLiveBookTransaction(
          'borrow',
          this.activeStudent.id,
          bookId,
          newTxId,
          {
            borrowDate,
            studentName: `${this.activeStudent.name} ${this.activeStudent.surname || ''}`.trim(),
            bookTitle: book ? book.title : '',
            bookLevel: book ? book.level : 'seviye_1'
          }
        );
      }

      if (window.Companion && window.Companion.showToast) {
        window.Companion.showToast(`Kitap ödünç verildi: ${this.activeStudent.name}`);
      }

      // Modalı ve Raftaki Kitapları Yenile
      this.renderActiveBookSection();
      this.availableBooks = this.getAvailableBooks();
      this.filteredAvailableBooks = [...this.availableBooks];
      this.renderAvailableBooksList();

      // Ana ızgarayı da güncelle
      this.renderGrid();
    },

    closeModal() {
      const modal = document.getElementById('companion-book-modal');
      if (modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
      }
      this.activeStudent = null;
      this.activeBookTransaction = null;
    },

    // -------------------------------------------------------------------------
    // TEK DOKUNUŞLA MASAÜSTÜNDEN SADECE KİTAP VERİLERİNİ ÇEKME
    // -------------------------------------------------------------------------
    async syncBooksFromDesktop() {
      const btn = document.getElementById('btn-sync-books-fast');
      let originalHtml = '';
      if (btn) {
        originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader" class="c-spin" style="width: 14px; height: 14px;"></i> <span>Çekiliyor...</span>`;
        if (window.lucide) window.lucide.createIcons();
      }

      try {
        if (!window.CloudSync || !window.CloudSync.pullBooksData) {
          throw new Error('CloudSync modülü hazır değil.');
        }

        const res = await window.CloudSync.pullBooksData();
        if (res && res.success) {
          this.init();
          if (window.Companion && window.Companion.showToast) {
            window.Companion.showToast(`Kitaplar güncellendi! (${res.bookCount} kitap)`);
          }
        } else {
          throw new Error((res && res.error) || 'Kitap verisi alınamadı.');
        }
      } catch (err) {
        console.error('Kitap eşitleme hatası:', err);
        if (window.Companion && window.Companion.showToast) {
          window.Companion.showToast(`Eşitleme hatası: ${err.message || 'Masaüstü verisine ulaşılamadı'}`);
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalHtml;
          if (window.lucide) window.lucide.createIcons();
        }
      }
    },

    // -------------------------------------------------------------------------
    // BARKOD & QR OKUMA ALTYAPISI (KAMERA, DONANIM & ÖNERİ MOTORU)
    // -------------------------------------------------------------------------
    scannerStream: null,
    scannerFacingMode: 'environment', // 'environment' | 'user'
    isTorchOn: false,
    scannerActive: false,
    scanLoopTimer: null,
    barcodeDetector: null,
    lastScannedCode: null,
    lastScanTimestamp: 0,
    currentSmartResult: null,

    // Barkod / QR Vizörünü Aç
    async openBarcodeScanner() {
      const modal = document.getElementById('companion-barcode-scanner-modal');
      const statusText = document.getElementById('barcode-scanner-status-text');
      const titleEl = document.querySelector('.c-scanner-title');
      const banner = document.getElementById('scanner-lending-banner');
      const bannerText = document.getElementById('scanner-lending-banner-text');
      if (!modal) return;

      this.scannerActive = true;
      this.lastScannedCode = null;
      this.lastScanTimestamp = 0;
      this.isTorchOn = false;

      const torchBtn = document.getElementById('btn-scanner-torch');
      if (torchBtn) torchBtn.classList.remove('active');

      if (this.lendingTargetStudent) {
        if (titleEl) titleEl.textContent = 'Kitap Teslim Et';
        if (statusText) statusText.textContent = `${this.lendingTargetStudent.name} için verilecek kitabı okutun`;
        if (banner) banner.style.display = 'flex';
        if (bannerText) bannerText.textContent = `🎯 Teslim Edilecek: ${this.lendingTargetStudent.name}`;
      } else {
        if (titleEl) titleEl.textContent = 'Kitap Barkod / QR Oku';
        if (statusText) statusText.textContent = 'Kamerayı barkoda veya QR koda tutun';
        if (banner) banner.style.display = 'none';
      }

      modal.style.display = 'flex';
      requestAnimationFrame(() => modal.classList.add('active'));

      // BarcodeDetector desteğini hazırla
      if ('BarcodeDetector' in window) {
        try {
          const supported = await window.BarcodeDetector.getSupportedFormats();
          const targetFormats = ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a'].filter(f => supported.includes(f));
          this.barcodeDetector = new window.BarcodeDetector({ formats: targetFormats.length > 0 ? targetFormats : supported });
        } catch (e) {
          this.barcodeDetector = null;
        }
      } else {
        this.barcodeDetector = null;
      }

      await this.startScannerCamera();
      if (window.lucide) window.lucide.createIcons();
    },

    // Teslim Modunu Başlat
    startLendingBarcodeScanner(studentId, studentName) {
      this.lendingTargetStudent = {
        id: String(studentId),
        name: String(studentName || '').trim()
      };
      this.closeResultModal();
      setTimeout(() => {
        this.openBarcodeScanner();
      }, 180);
    },

    // Teslim Modundan Vazgeç
    cancelLendingMode() {
      this.lendingTargetStudent = null;
      const banner = document.getElementById('scanner-lending-banner');
      if (banner) banner.style.display = 'none';
      const titleEl = document.querySelector('.c-scanner-title');
      if (titleEl) titleEl.textContent = 'Kitap Barkod / QR Oku';
      const statusText = document.getElementById('barcode-scanner-status-text');
      if (statusText) statusText.textContent = 'Kamerayı barkoda veya QR koda tutun';
    },

    // Teslim Modundayken Okutulan Barkodu İşle
    processLendingBarcode(codeStr, targetStudent) {
      if (!targetStudent) return;
      const cleanCode = String(codeStr || '').trim();
      const statusText = document.getElementById('barcode-scanner-status-text');

      const book = this.findBookByBarcodeOrNo(cleanCode);
      if (!book) {
        if (statusText) {
          statusText.textContent = `⚠️ Kitap bulunamadı: "${cleanCode}". Tekrar okutun.`;
        }
        if (window.Companion && window.Companion.showToast) {
          window.Companion.showToast(`Kütüphanede eşleşme yok: ${cleanCode}`);
        }
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        return;
      }

      // Kitap şu an bir başkası tarafından okunuyor mu?
      const data = this.getData();
      const txList = Array.isArray(data.books && data.books.transactions) ? data.books.transactions : [];
      const activeTx = txList.find(t => String(t.bookId) === String(book.id) && t.status === 'reading');

      if (activeTx) {
        const holder = (this.students || []).find(s => String(s.id) === String(activeTx.studentId)) ||
          { name: activeTx.studentName || 'Başka bir öğrenci' };
        const holderName = `${holder.name} ${holder.surname || ''}`.trim();
        if (statusText) {
          statusText.textContent = `⚠️ Bu kitap şu an ${holderName} üzerinde!`;
        }
        if (window.Companion && window.Companion.showToast) {
          window.Companion.showToast(`Bu kitap şu an ${holderName} üzerinde!`);
        }
        if (navigator.vibrate) navigator.vibrate([150, 60, 150]);
        return;
      }

      // Kitap müsait -> Teslim işlemini gerçekleştir
      const sId = targetStudent.id;
      const sName = targetStudent.name;
      this.cancelLendingMode();
      this.closeBarcodeScanner(true);
      this.borrowBookFromSmartModal(sId, book.id);
    },

    // Kamerayı Başlat
    async startScannerCamera() {
      const video = document.getElementById('barcode-scanner-video');
      const statusText = document.getElementById('barcode-scanner-status-text');
      if (!video) return;

      if (this.scannerStream) {
        this.stopScannerStream();
      }

      try {
        const constraints = {
          video: {
            facingMode: { ideal: this.scannerFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.scannerStream = stream;
        video.srcObject = stream;
        await video.play();

        // Tarama döngüsünü başlat
        this.startScannerLoop();
      } catch (err) {
        console.error('Kamera başlatma hatası:', err);
        if (statusText) {
          statusText.textContent = '⚠️ Kamera izni alınamadı veya kamera bulunamadı';
        }
        if (window.Companion && window.Companion.showToast) {
          window.Companion.showToast('Kamera açılamadı. Lütfen kamera iznini kontrol edin.');
        }
        // Kamera açılamazsa manuel giriş alanını otomatik aç
        this.showManualBarcodeInput();
      }
    },

    // Sürekli Tarama Döngüsü
    startScannerLoop() {
      const video = document.getElementById('barcode-scanner-video');
      const canvas = document.getElementById('barcode-scanner-canvas');
      if (!video || !canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const scanStep = async () => {
        if (!this.scannerActive) return;

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
          try {
            let detectedCode = null;

            // 1. Yol: Modern Donanım Hızlandırmalı BarcodeDetector API
            if (this.barcodeDetector) {
              const barcodes = await this.barcodeDetector.detect(video);
              if (barcodes && barcodes.length > 0) {
                detectedCode = barcodes[0].rawValue;
              }
            }

            // 2. Yol: Geriye Dönük Uyumluluk (jsQR ile QR Kod Algılama)
            if (!detectedCode && window.jsQR) {
              const w = video.videoWidth;
              const h = video.videoHeight;
              if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
              }
              ctx.drawImage(video, 0, 0, w, h);
              const imgData = ctx.getImageData(0, 0, w, h);
              const qrRes = window.jsQR(imgData.data, w, h, { inversionAttempts: 'dontInvert' });
              if (qrRes && qrRes.data) {
                detectedCode = qrRes.data;
              }
            }

            if (detectedCode) {
              this.onBarcodeDetected(detectedCode);
              return; // Algılandı, döngüyü sonlandır
            }
          } catch (e) {}
        }

        if (this.scannerActive) {
          this.scanLoopTimer = requestAnimationFrame(scanStep);
        }
      };

      this.scanLoopTimer = requestAnimationFrame(scanStep);
    },

    // Barkod / QR Algılandığında
    onBarcodeDetected(rawCode) {
      const cleanCode = String(rawCode || '').trim();
      if (!cleanCode) return;

      const now = Date.now();
      // Çift okumayı önle (1.5 saniye debounce)
      if (cleanCode === this.lastScannedCode && (now - this.lastScanTimestamp) < 1500) {
        return;
      }

      this.lastScannedCode = cleanCode;
      this.lastScanTimestamp = now;

      // Ses ve Titreşim
      try {
        const audio = getAudioContext();
        if (audio) {
          const osc = audio.createOscillator();
          const gain = audio.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1760, audio.currentTime); // A6
          gain.gain.setValueAtTime(0.3, audio.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.12);
          osc.connect(gain);
          gain.connect(audio.destination);
          osc.start();
          osc.stop(audio.currentTime + 0.14);
        }
      } catch (e) {}

      if (navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }

      const statusText = document.getElementById('barcode-scanner-status-text');
      if (statusText) {
        statusText.textContent = `✓ Algılandı: ${cleanCode}`;
      }

      // Eğer bir öğrenciye teslim modundaysak doğrudan teslim et
      if (this.lendingTargetStudent) {
        this.processLendingBarcode(cleanCode, this.lendingTargetStudent);
        return;
      }

      // Kamerayı kapat ve akıllı sonuç modalını aç
      setTimeout(() => {
        this.closeBarcodeScanner(true);
        this.processScannedBarcode(cleanCode);
      }, 150);
    },

    // Kamera Akışını Durdur
    stopScannerStream() {
      if (this.scanLoopTimer) {
        cancelAnimationFrame(this.scanLoopTimer);
        this.scanLoopTimer = null;
      }
      if (this.scannerStream) {
        try {
          this.scannerStream.getTracks().forEach(t => t.stop());
        } catch (e) {}
        this.scannerStream = null;
      }
      const video = document.getElementById('barcode-scanner-video');
      if (video) {
        video.srcObject = null;
      }
    },

    // Vizörü Kapat
    closeBarcodeScanner(immediate = false) {
      this.scannerActive = false;
      this.stopScannerStream();
      this.cancelLendingMode();
      const modal = document.getElementById('companion-barcode-scanner-modal');
      if (modal) {
        modal.classList.remove('active');
        if (immediate) {
          modal.style.display = 'none';
        } else {
          setTimeout(() => { modal.style.display = 'none'; }, 200);
        }
      }
    },

    // Fener / Işık Aç/Kapat
    async toggleTorch() {
      if (!this.scannerStream) return;
      const track = this.scannerStream.getVideoTracks()[0];
      if (!track) return;

      try {
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (!capabilities.torch) {
          if (window.Companion && window.Companion.showToast) {
            window.Companion.showToast('Bu cihazda kamera flaşı desteklenmiyor.');
          }
          return;
        }

        this.isTorchOn = !this.isTorchOn;
        await track.applyConstraints({ advanced: [{ torch: this.isTorchOn }] });

        const btn = document.getElementById('btn-scanner-torch');
        if (btn) btn.classList.toggle('active', this.isTorchOn);
      } catch (e) {
        console.warn('Flaş değiştirilemedi:', e);
      }
    },

    // Ön / Arka Kamera Değiştir
    async switchCamera() {
      this.scannerFacingMode = this.scannerFacingMode === 'environment' ? 'user' : 'environment';
      await this.startScannerCamera();
    },

    // Manuel Giriş Alanını Aç/Kapat
    toggleManualBarcodeInput() {
      const form = document.getElementById('scanner-manual-box');
      const chevron = document.getElementById('scanner-manual-chevron');
      if (!form) return;
      const isHidden = form.style.display === 'none';
      form.style.display = isHidden ? 'flex' : 'none';
      if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
      if (isHidden) {
        const input = document.getElementById('scanner-manual-input');
        if (input) setTimeout(() => input.focus(), 100);
      }
    },

    showManualBarcodeInput() {
      const form = document.getElementById('scanner-manual-box');
      const chevron = document.getElementById('scanner-manual-chevron');
      if (form) form.style.display = 'flex';
      if (chevron) chevron.style.transform = 'rotate(180deg)';
      const input = document.getElementById('scanner-manual-input');
      if (input) setTimeout(() => input.focus(), 100);
    },

    // Manuel Girilen Kodu Ara
    submitManualCode() {
      const input = document.getElementById('scanner-manual-input');
      if (!input) return;
      const val = input.value.trim();
      if (!val) {
        if (window.Companion && window.Companion.showToast) {
          window.Companion.showToast('Lütfen aramak için bir kitap no veya barkod girin.');
        }
        return;
      }
      if (this.lendingTargetStudent) {
        input.value = '';
        this.processLendingBarcode(val, this.lendingTargetStudent);
        return;
      }
      this.closeBarcodeScanner(true);
      this.processScannedBarcode(val);
    },

    // -------------------------------------------------------------------------
    // AKILLI EŞLEŞTİRME & PEDAGOJİK ÖNERİ MOTORU
    // -------------------------------------------------------------------------
    findBookByBarcodeOrNo(codeStr) {
      const data = this.getData();
      const lib = Array.isArray(data.books && data.books.library) ? data.books.library : [];
      if (lib.length === 0) return null;

      const raw = String(codeStr || '').trim().toLowerCase();
      const numVal = parseInt(raw, 10);

      // 1. Öncelik: Doğrudan barkod eşleşmesi
      let found = lib.find(b => !b.isDeleted && b.barcode && String(b.barcode).trim().toLowerCase() === raw);
      if (found) return found;

      // 2. Öncelik: Kitap No birebir eşleşmesi (Örn: "14", "K-05")
      found = lib.find(b => !b.isDeleted && b.bookNo && String(b.bookNo).trim().toLowerCase() === raw);
      if (found) return found;

      // 3. Öncelik: Sayısal ön-sıfır normalize eşleşmesi (Örn: "014" == "14")
      if (!isNaN(numVal)) {
        found = lib.find(b => {
          if (b.isDeleted || !b.bookNo) return false;
          const bNum = parseInt(String(b.bookNo).trim(), 10);
          return !isNaN(bNum) && bNum === numVal;
        });
        if (found) return found;
      }

      // 4. Öncelik: ID veya ISBN eşleşmesi
      found = lib.find(b => {
        if (b.isDeleted) return false;
        const bId = String(b.id || '').toLowerCase();
        const bIsbn = String(b.isbn || '').toLowerCase();
        return bId === raw || bIsbn === raw;
      });
      if (found) return found;

      // 5. Öncelik: Prefix temizleme ("kitap:14", "k-14", "no:14" vb.)
      const stripped = raw.replace(/^(kitap|book|no)[:\-_ ]+/i, '').trim();
      if (stripped && stripped !== raw) {
        found = lib.find(b => !b.isDeleted && (
          (b.bookNo && String(b.bookNo).trim().toLowerCase() === stripped) ||
          (b.barcode && String(b.barcode).trim().toLowerCase() === stripped) ||
          (String(b.id || '').toLowerCase() === stripped)
        ));
        if (found) return found;

        const strippedNum = parseInt(stripped, 10);
        if (!isNaN(strippedNum)) {
          found = lib.find(b => {
            if (b.isDeleted || !b.bookNo) return false;
            const bNum = parseInt(String(b.bookNo).trim(), 10);
            return !isNaN(bNum) && bNum === strippedNum;
          });
          if (found) return found;
        }
      }

      return null;
    },

    // Taranan Kodu Analiz Et ve Sonuç/Öneri Modalı Aç
    processScannedBarcode(codeStr) {
      try {
        const modal = document.getElementById('companion-barcode-result-modal');
        const bodyEl = document.getElementById('barcode-result-dynamic-body');
        const titleEl = document.getElementById('barcode-result-header-title');
        const subEl = document.getElementById('barcode-result-header-subtitle');
        const iconEl = document.getElementById('barcode-result-header-icon');
        if (!modal || !bodyEl) return;

        // Öğrenci listesini garantiye al
        if (!this.students || this.students.length === 0) {
          this.students = this.getActiveStudents();
        }

        const book = this.findBookByBarcodeOrNo(codeStr);
        const data = this.getData();
        const txList = Array.isArray(data.books && data.books.transactions) ? data.books.transactions : [];

        if (!book) {
          // DURUM 3: KİTAP BULUNAMADI
          if (titleEl) titleEl.textContent = 'Kitap Bulunamadı';
          if (subEl) subEl.textContent = `Taranan Kod: ${codeStr}`;
          if (iconEl) {
            iconEl.style.background = '#fef2f2';
            iconEl.innerHTML = `<i data-lucide="alert-triangle" style="width: 20px; height: 20px; color: #ef4444;"></i>`;
          }

          bodyEl.innerHTML = `
            <div class="c-smart-card" style="text-align: center; padding: 24px 16px;">
              <div style="font-size: 40px; margin-bottom: 8px;">🔍</div>
              <h4 style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Kütüphanede Eşleşme Yok</h4>
              <p style="font-size: 12px; color: #64748b; line-height: 1.4; margin-bottom: 16px;">
                <strong>"${escapeHTML(codeStr)}"</strong> numarası veya barkoduyla kayıtlı bir kitap bulunamadı.
              </p>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <button type="button" class="c-btn-primary" style="justify-content: center; gap: 8px;" onclick="window.CompanionBooks.syncBooksFromDesktop(); window.CompanionBooks.closeResultModal();">
                  <i data-lucide="refresh-cw" style="width: 16px; height: 16px;"></i>
                  <span>Masaüstünden Kitapları Eşitle</span>
                </button>
                <button type="button" class="c-btn-secondary" style="justify-content: center;" onclick="window.CompanionBooks.closeResultModal()">
                  <span>Kapat</span>
                </button>
              </div>
            </div>
          `;

          modal.style.display = 'flex';
          requestAnimationFrame(() => modal.classList.add('active'));
          if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
          return;
        }

        // Kitabın aktif ödünç kaydını ara
        const activeTx = txList.find(t => String(t.bookId) === String(book.id) && t.status === 'reading');

        if (activeTx) {
          // DURUM 1: KİTAP BİR ÖĞRENCİDE (ÖDÜNÇTE) -> İADE & YENİ KİTAP ÖNERİSİ
          const student = (this.students || []).find(s => String(s.id) === String(activeTx.studentId)) ||
            (data.students || []).find(s => String(s.id) === String(activeTx.studentId)) ||
            { id: activeTx.studentId, name: activeTx.studentName || 'Öğrenci', number: activeTx.studentNumber || '-' };

          const borrowDate = activeTx.borrowDate ? new Date(activeTx.borrowDate) : new Date();
          const diffDays = Math.max(0, Math.floor((Date.now() - borrowDate.getTime()) / (1000 * 60 * 60 * 24)));
          const borrowDateStr = borrowDate.toLocaleDateString('tr-TR');

          if (titleEl) titleEl.textContent = 'Kitap Öğrencide';
          if (subEl) subEl.textContent = `No: ${book.bookNo || '-'} • ${book.title}`;
          if (iconEl) {
            iconEl.style.background = '#eef2ff';
            iconEl.innerHTML = `<i data-lucide="book-open" style="width: 20px; height: 20px; color: #4f46e5;"></i>`;
          }

          const avatarHtml = student.photo
            ? `<img src="${student.photo}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #e0e7ff;" />`
            : `<div style="width: 44px; height: 44px; border-radius: 50%; background: #4f46e5; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px;">${(student.name ? student.name[0] : '?').toUpperCase()}</div>`;

          // Bu öğrenci için filtreleme durumunu sıfırla
          this.currentRecommendStudentId = student.id;
          this.currentRecommendFilter = 'all';
          this.currentRecommendSearch = '';

          bodyEl.innerHTML = `
            <!-- Öğrenci ve Kitap Durumu Kartı -->
            <div class="c-smart-card borrowed" id="smart-borrowed-card">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span class="c-smart-badge info">
                  <i data-lucide="user-check" style="width: 12px; height: 12px;"></i>
                  <span>Şu An Bu Öğrencide</span>
                </span>
                <span style="font-size: 11px; color: #475569; font-weight: 700;">📅 ${diffDays} gündür okuyor</span>
              </div>

              <div style="display: flex; align-items: center; gap: 12px; margin: 4px 0;">
                ${avatarHtml}
                <div style="min-width: 0; flex: 1;">
                  <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${escapeHTML(student.name)} ${escapeHTML(student.surname || '')}</div>
                  <div style="font-size: 11px; color: #64748b; font-weight: 600;">No: #${student.number || '-'} • Teslim Alındı: ${borrowDateStr}</div>
                </div>
              </div>

              <div style="background: rgba(255,255,255,0.85); padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.06);">
                <div style="font-size: 13px; font-weight: 800; color: #1e293b;">📖 ${escapeHTML(book.title)}</div>
                <div style="font-size: 11px; color: #64748b;">✍️ ${escapeHTML(book.author || 'Yazar Belirtilmemiş')} • ${book.pages ? book.pages + ' sf.' : ''}</div>
              </div>

              <button type="button" class="c-btn-return-book" style="width: 100%; justify-content: center; padding: 12px; margin-top: 4px; font-weight: 800;" onclick="window.CompanionBooks.returnBookFromSmartModal('${activeTx.id}', '${student.id}', '${book.id}')">
                <i data-lucide="corner-down-left" style="width: 18px; height: 18px;"></i>
                <span>Kitabı Teslim Al (İade Et)</span>
              </button>
            </div>

            <!-- Bu Öğrenci İçin Sıradaki Kitap Önerileri (1. ve 2. Grup Filtreli) -->
            <div class="c-smart-recommend-block" id="smart-recommendations-section">
              ${this.buildSmartRecommendationsHTML(student.id, 'all', '')}
            </div>
          `;
        } else {
          // DURUM 2: KİTAP RAFTA (MÜSAİT) -> BU KİTABI OKUYABİLECEK UYGUN ÖĞRENCİLER
          if (titleEl) titleEl.textContent = 'Kitap Rafta (Müsait)';
          if (subEl) subEl.textContent = `No: ${book.bookNo || '-'} • ${book.title}`;
          if (iconEl) {
            iconEl.style.background = '#ecfdf5';
            iconEl.innerHTML = `<i data-lucide="check-circle" style="width: 20px; height: 20px; color: #10b981;"></i>`;
          }

          // Bu kitabı okuyabilecek uygun aday öğrencileri bul
          const candidateStudents = this.getRecommendedStudentsForBook(book);

          bodyEl.innerHTML = `
            <!-- Kitap Bilgi Kartı -->
            <div class="c-smart-card highlight">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span class="c-smart-badge success">
                  <i data-lucide="check" style="width: 12px; height: 12px;"></i>
                  <span>Rafta • Hemen Verilebilir</span>
                </span>
                <span style="font-size: 11px; color: #047857; font-weight: 700;">No: #${book.bookNo || '-'}</span>
              </div>

              <div style="margin: 4px 0;">
                <div style="font-size: 15px; font-weight: 800; color: #0f172a;">📖 ${escapeHTML(book.title)}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                  ✍️ ${escapeHTML(book.author || 'Yazar Belirtilmemiş')} • ${book.pages ? book.pages + ' sayfa' : ''} • 
                  <strong style="color: #4f46e5;">${book.level === 'seviye_2' ? '2. Seviye' : '1. Seviye'}</strong>
                </div>
              </div>
            </div>

            <!-- Bu Kitabı Okuyabilecek Uygun Öğrenciler Listesi -->
            <div class="c-smart-recommend-block">
              <div class="c-smart-recommend-title">
                <i data-lucide="sparkles" style="width: 15px; height: 15px; color: #f59e0b;"></i>
                <span>Bu Kitap İçin Önerilen Öğrenciler</span>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${candidateStudents.length > 0 ? candidateStudents.map(cs => {
                  const s = cs.student;
                  const avatarHtml = s.photo
                    ? `<img src="${s.photo}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1.5px solid #e0e7ff;" />`
                    : `<div style="width: 38px; height: 38px; border-radius: 50%; background: #4f46e5; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px;">${(s.name ? s.name[0] : '?').toUpperCase()}</div>`;

                  return `
                    <div class="c-smart-item-row">
                      <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
                        ${avatarHtml}
                        <div class="c-smart-item-info">
                          <div class="c-smart-item-name">${escapeHTML(s.name)} ${escapeHTML(s.surname || '')}</div>
                          <div class="c-smart-item-sub">
                            <span>No: #${s.number || '-'}</span>
                            <span>•</span>
                            <span style="color: #059669; font-weight: 700;">${cs.readBooksCount} kitap okudu</span>
                          </div>
                        </div>
                      </div>
                      <button type="button" class="c-btn-borrow-book" onclick="window.CompanionBooks.borrowBookFromSmartModal('${s.id}', '${book.id}')">
                        <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                        <span>Ödünç Ver</span>
                      </button>
                    </div>
                  `;
                }).join('') : `
                  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; font-weight: 600;">
                    Şu an bu kitabı okuyabilecek boşta öğrenci bulunamadı veya tüm sınıf bu kitabı okumuş.
                  </div>
                `}
              </div>
            </div>
          `;
        }

        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('active'));
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      } catch (err) {
        console.error('Akıllı barkod işleme hatası:', err);
        if (window.Companion && window.Companion.showToast) {
          window.Companion.showToast('Barkod işlenirken hata oluştu: ' + (err.message || ''));
        }
      }
    },

    // Belirli bir öğrenci için raftaki en uygun kitapları öner (Pedagojik Algoritma + Grup Filtresi)
    getRecommendedBooksForStudent(studentId, filterGroup = 'all', searchQuery = '') {
      const data = this.getData();
      const lib = Array.isArray(data.books && data.books.library) ? data.books.library : [];
      const txList = Array.isArray(data.books && data.books.transactions) ? data.books.transactions : [];

      // Öğrencinin daha önce okuduğu (teslim edilmiş) kitap ID'leri kümesi
      const studentReadIds = new Set(
        txList.filter(t => String(t.studentId) === String(studentId)).map(t => String(t.bookId))
      );

      // Şu an herhangi bir öğrenci tarafından okunan kitap ID'leri
      const currentlyReadingIds = new Set(
        txList.filter(t => t.status === 'reading').map(t => String(t.bookId))
      );

      // Rafta olan ve bu öğrencinin henüz okumadığı kitaplar
      let available = lib.filter(b => {
        if (b.isDeleted) return false;
        if (currentlyReadingIds.has(String(b.id))) return false;
        if (studentReadIds.has(String(b.id))) return false;
        return true;
      });

      // Seviye / Grup Filtresi
      if (filterGroup === 'seviye_1') {
        available = available.filter(b => (b.level || 'seviye_1') === 'seviye_1');
      } else if (filterGroup === 'seviye_2') {
        available = available.filter(b => b.level === 'seviye_2');
      }

      // Arama Metni Filtresi
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        available = available.filter(b => {
          const t = (b.title || '').toLowerCase();
          const a = (b.author || '').toLowerCase();
          const n = String(b.bookNo || '').toLowerCase();
          const bc = String(b.barcode || '').toLowerCase();
          return t.includes(q) || a.includes(q) || n.includes(q) || bc.includes(q);
        });
      }

      // Puanlama: Seviye uyumu ve kitap no sıralaması
      available.sort((a, b) => {
        const levelScoreA = (a.level === 'seviye_1') ? 2 : 1;
        const levelScoreB = (b.level === 'seviye_1') ? 2 : 1;
        if (levelScoreA !== levelScoreB) return levelScoreB - levelScoreA;
        return (parseInt(a.bookNo, 10) || 0) - (parseInt(b.bookNo, 10) || 0);
      });

      return available;
    },

    // Öneri Bölümü HTML'ini Üret (Çipler, Arama ve Liste)
    buildSmartRecommendationsHTML(studentId, filterGroup = 'all', searchQuery = '') {
      this.currentRecommendStudentId = studentId;
      this.currentRecommendFilter = filterGroup || 'all';
      this.currentRecommendSearch = searchQuery || '';

      const stu = (this.students || []).find(s => String(s.id) === String(studentId));
      const studentName = stu ? stu.name : 'Öğrenci';

      // Sayaçlar için tüm okunmayan kitapları al
      const allBooks = this.getRecommendedBooksForStudent(studentId, 'all', '');
      const countAll = allBooks.length;
      const countG1 = allBooks.filter(b => (b.level || 'seviye_1') === 'seviye_1').length;
      const countG2 = allBooks.filter(b => b.level === 'seviye_2').length;

      // Filtrelenmiş sonuçlar
      const filteredBooks = this.getRecommendedBooksForStudent(studentId, this.currentRecommendFilter, this.currentRecommendSearch);
      const displayBooks = filteredBooks.slice(0, (this.currentRecommendFilter !== 'all' || this.currentRecommendSearch) ? 25 : 8);

      return `
        <div class="c-smart-recommend-title" style="justify-content: space-between; margin-bottom: 2px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="sparkles" style="width: 15px; height: 15px; color: #f59e0b;"></i>
            <span>${escapeHTML(studentName)} İçin Sıradaki Kitaplar</span>
          </div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b;">${filteredBooks.length} Uygun</span>
        </div>

        <!-- 1. Grup / 2. Grup / Tümü Filtre Çipleri -->
        <div class="c-smart-filters-strip">
          <button type="button" class="c-smart-filter-chip ${this.currentRecommendFilter === 'all' ? 'active' : ''}" onclick="window.CompanionBooks.setRecommendFilter('all')">
            <span>📚 Tümü (${countAll})</span>
          </button>
          <button type="button" class="c-smart-filter-chip c-chip-g1 ${this.currentRecommendFilter === 'seviye_1' ? 'active' : ''}" onclick="window.CompanionBooks.setRecommendFilter('seviye_1')">
            <span>🟢 1. Grup (${countG1})</span>
          </button>
          <button type="button" class="c-smart-filter-chip c-chip-g2 ${this.currentRecommendFilter === 'seviye_2' ? 'active' : ''}" onclick="window.CompanionBooks.setRecommendFilter('seviye_2')">
            <span>🟣 2. Grup (${countG2})</span>
          </button>
        </div>

        <!-- Hızlı Arama Kutusu -->
        <div style="position: relative;">
          <input
            type="text"
            id="smart-recommend-search-input"
            class="c-input"
            placeholder="Okunmayan kitaplarda ara (isim, no)..."
            value="${escapeHTML(this.currentRecommendSearch)}"
            style="height: 34px; font-size: 12px; border-radius: 10px; padding-left: 30px; background: #ffffff; border: 1px solid #cbd5e1;"
            oninput="window.CompanionBooks.onRecommendSearchInput(this.value)"
          />
          <i data-lucide="search" style="width: 14px; height: 14px; position: absolute; left: 10px; top: 10px; color: #94a3b8;"></i>
        </div>

        <!-- Kitap Listesi -->
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 2px;">
          ${displayBooks.length > 0 ? displayBooks.map(rb => {
            const isG2 = rb.level === 'seviye_2';
            const levelLabel = isG2 ? '2. Grup' : '1. Grup';
            const levelColor = isG2 ? '#7c3aed' : '#059669';
            const levelBg = isG2 ? '#f5f3ff' : '#ecfdf5';

            return `
              <div class="c-smart-item-row">
                <div class="c-smart-item-info">
                  <div class="c-smart-item-name" title="${escapeHTML(rb.title)}">${escapeHTML(rb.title)}</div>
                  <div class="c-smart-item-sub">
                    <span>✍️ ${escapeHTML(rb.author || '-')}</span>
                    <span>•</span>
                    <span>No: ${rb.bookNo || '-'}</span>
                    <span>•</span>
                    <span style="color: ${levelColor}; background: ${levelBg}; padding: 1px 6px; border-radius: 4px; font-weight: 700;">${levelLabel}</span>
                  </div>
                </div>
                <button type="button" class="c-btn-borrow-book" onclick="window.CompanionBooks.borrowBookFromSmartModal('${escapeHTML(studentId)}', '${escapeHTML(rb.id)}')">
                  <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                  <span>Ödünç Ver</span>
                </button>
              </div>
            `;
          }).join('') : `
            <div style="text-align: center; padding: 20px 12px; color: #94a3b8; font-size: 12px; font-weight: 600;">
              ${this.currentRecommendSearch ? 'Aramaya uygun kitap bulunamadı.' : 'Bu grupta öğrencinin okumadığı uygun boş kitap bulunamadı.'}
            </div>
          `}
        </div>
      `;
    },

    setRecommendFilter(filterGroup) {
      this.currentRecommendFilter = filterGroup;
      this.renderSmartRecommendationsSection(this.currentRecommendStudentId, false);
    },

    onRecommendSearchInput(query) {
      this.currentRecommendSearch = query;
      this.renderSmartRecommendationsSection(this.currentRecommendStudentId, true);
    },

    renderSmartRecommendationsSection(studentId, refocusInput = false) {
      if (!studentId) studentId = this.currentRecommendStudentId;
      if (!studentId) return;

      const container = document.getElementById('smart-recommendations-section');
      if (!container) return;

      container.innerHTML = this.buildSmartRecommendationsHTML(studentId, this.currentRecommendFilter, this.currentRecommendSearch);

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }

      if (refocusInput) {
        const inp = document.getElementById('smart-recommend-search-input');
        if (inp) {
          inp.focus();
          inp.setSelectionRange(inp.value.length, inp.value.length);
        }
      }
    },

    // Belirli bir kitap için sınıftaki en uygun öğrencileri öner (Pedagojik Algoritma)
    getRecommendedStudentsForBook(book) {
      const data = this.getData();
      const txList = Array.isArray(data.books && data.books.transactions) ? data.books.transactions : [];

      // Halihazırda elinde kitap olan öğrenciler kümesi
      const currentlyReadingStudentIds = new Set(
        txList.filter(t => t.status === 'reading').map(t => String(t.studentId))
      );

      // Bu kitabı geçmişte okumuş olan öğrenciler kümesi
      const pastReadersOfBook = new Set(
        txList.filter(t => String(t.bookId) === String(book.id)).map(t => String(t.studentId))
      );

      // Aktif şubedeki öğrencilerden elinde kitap olmayan ve bu kitabı okumamış adaylar
      const candidates = this.students.filter(s => {
        if (currentlyReadingStudentIds.has(String(s.id))) return false;
        if (pastReadersOfBook.has(String(s.id))) return false;
        return true;
      });

      // Her aday öğrencinin toplam okuduğu kitap sayısını hesapla
      const scoredCandidates = candidates.map(s => {
        const readCount = txList.filter(t => String(t.studentId) === String(s.id) && t.status === 'returned').length;
        return {
          student: s,
          readBooksCount: readCount
        };
      });

      // Az kitap okumuş öğrencilere öncelik ver (Kitap okuma alışkanlığını teşvik et)
      // veya yüksek okuyucuları dengele
      scoredCandidates.sort((a, b) => {
        if (a.readBooksCount !== b.readBooksCount) {
          return a.readBooksCount - b.readBooksCount;
        }
        return (parseInt(a.student.number, 10) || 0) - (parseInt(b.student.number, 10) || 0);
      });

      return scoredCandidates.slice(0, 5);
    },

    // Akıllı Modaldan Kitap İade Al
    returnBookFromSmartModal(txId, studentId, bookId) {
      const data = this.getData();
      if (!data.books) data.books = { library: [], transactions: [] };
      if (!Array.isArray(data.books.transactions)) data.books.transactions = [];

      const tx = data.books.transactions.find(t => String(t.id) === String(txId) || (String(t.studentId) === String(studentId) && String(t.bookId) === String(bookId) && t.status === 'reading'));
      const returnDate = new Date().toISOString();

      if (tx) {
        tx.status = 'returned';
        tx.returnDate = returnDate;
      }

      this.saveData(data);
      playBookSound(true);

      // Canlı Masaüstüne Fırlat
      const book = (data.books && data.books.library || []).find(b => String(b.id) === String(bookId));
      const stu = (this.students || []).find(s => String(s.id) === String(studentId));
      if (window.CloudSync && window.CloudSync.pushLiveBookTransaction) {
        window.CloudSync.pushLiveBookTransaction('return', studentId, bookId, txId, {
          returnDate,
          borrowDate: tx ? tx.borrowDate : returnDate,
          studentName: stu ? `${stu.name} ${stu.surname || ''}`.trim() : '',
          bookTitle: book ? book.title : '',
          bookLevel: book ? book.level : 'seviye_1'
        });
      }

      if (window.Companion && window.Companion.showToast) {
        window.Companion.showToast(`✅ Kitap teslim alındı: ${(stu && stu.name) || 'Öğrenci'}`);
      }

      // Modaldaki kartı başarı kartına dönüştür ve önerileri taze tut
      const cardEl = document.getElementById('smart-borrowed-card');
      const stuFullName = stu ? `${stu.name} ${stu.surname || ''}`.trim() : 'Öğrenci';

      if (cardEl) {
        cardEl.className = 'c-smart-card highlight';
        cardEl.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #10b981; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800;">✓</div>
            <div>
              <div style="font-size: 14px; font-weight: 800; color: #065f46;">Kitap Başarıyla Teslim Alındı!</div>
              <div style="font-size: 11px; color: #047857;">Şimdi öğrenciye yeni bir kitap teslim edebilirsiniz:</div>
            </div>
          </div>

          <button type="button" class="c-btn-barcode-lend" onclick="window.CompanionBooks.startLendingBarcodeScanner('${escapeHTML(studentId)}', '${escapeHTML(stuFullName)}')">
            <i data-lucide="scan" style="width: 18px; height: 18px;"></i>
            <span>📷 Yeni Kitabı Barkodla Okut ve Teslim Et</span>
          </button>
        `;
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      }

      // Önerilen kitaplar listesini güncel tut
      this.renderSmartRecommendationsSection(studentId, false);

      // Ana ızgarayı yenile
      this.renderGrid();
    },

    // Akıllı Modaldan Kitap Ödünç Ver
    borrowBookFromSmartModal(studentId, bookId) {
      if (!studentId || !bookId) return;

      const data = this.getData();
      if (!data.books) data.books = { library: [], transactions: [] };
      if (!Array.isArray(data.books.transactions)) data.books.transactions = [];

      const borrowDate = new Date().toISOString().split('T')[0];
      const newTxId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

      const stu = this.students.find(s => String(s.id) === String(studentId));
      const newTx = {
        id: newTxId,
        studentId: studentId,
        studentNumber: stu ? stu.number : '',
        bookId: bookId,
        borrowDate: borrowDate,
        status: 'reading'
      };

      data.books.transactions.push(newTx);
      this.saveData(data);
      playBookSound(false);

      // Canlı Masaüstüne Fırlat
      const book = (data.books && data.books.library || []).find(b => String(b.id) === String(bookId));
      if (window.CloudSync && window.CloudSync.pushLiveBookTransaction) {
        window.CloudSync.pushLiveBookTransaction('borrow', studentId, bookId, newTxId, {
          borrowDate,
          studentName: stu ? `${stu.name} ${stu.surname || ''}`.trim() : '',
          bookTitle: book ? book.title : '',
          bookLevel: book ? book.level : 'seviye_1'
        });
      }

      if (window.Companion && window.Companion.showToast) {
        window.Companion.showToast(`📖 Kitap ödünç verildi: ${(stu && stu.name) || 'Öğrenci'}`);
      }

      this.closeResultModal();
      this.renderGrid();
    },

    closeResultModal() {
      const modal = document.getElementById('companion-barcode-result-modal');
      if (modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
      }
    }
  };

  window.CompanionBooks = CompanionBooks;

})(window);
