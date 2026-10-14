/**
 * Sınıf Asistanı — El Terminali: Kitaplık & Barkod Modülü (companion-books.js)
 * 3 Sütunlu Öğrenci Izgarası, Dokunmatik Sürükle-Bırak Sıralama,
 * Hızlı Ödünç Verme & İade Alma Modalı ve Canlı Masaüstü Eşitleme.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'sinif_asistani_data';
  const ORDER_KEY_PREFIX = 'sinif_companion_student_order_';

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
        window.CloudSync.pushLiveBookTransaction(
          'return',
          this.activeStudent.id,
          this.activeBookTransaction.bookId,
          this.activeBookTransaction.id,
          { returnDate }
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
        window.CloudSync.pushLiveBookTransaction(
          'borrow',
          this.activeStudent.id,
          bookId,
          newTxId,
          { borrowDate }
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
    }
  };

  window.CompanionBooks = CompanionBooks;

})(window);
