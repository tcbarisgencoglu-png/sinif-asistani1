/**
 * Sınıf Asistanı — El Terminali: Davranış & Puan Modülü (companion-behavior.js)
 * 3 Sütunlu Öğrenci Izgarası, Dokunmatik Sürükle-Bırak (Touch & Drag Reorder),
 * Hızlı Puan & Davranış Modal'ı ve Kalıcı Sıralama Belleği.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'sinif_asistani_data';
  const ORDER_KEY_PREFIX = 'sinif_companion_student_order_';

  // Ses Sentezleyici (Web Audio API - Çevrim Dışı)
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

  function playPointSound(isPositive) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (isPositive) {
        // Pozitif sevinçli çift ton (C5 -> G5)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.24);
      } else {
        // Negatif yumuşak uyarı tonu
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch (e) {}
  }

  // Varsayılan Davranış Listesi
  const DEFAULT_BEHAVIORS = {
    positive: [
      { name: 'Derse Katılım', point: 1, icon: '🌟' },
      { name: 'Örnek Davranış', point: 3, icon: '🏆' },
      { name: 'Görev Bilinci', point: 2, icon: '🎯' },
      { name: 'Yardımlaşma', point: 2, icon: '🤝' },
      { name: 'Ödevini Tam Yapma', point: 1, icon: '✅' },
      { name: 'Kitap Okuma', point: 2, icon: '📚' },
      { name: 'Temiz & Düzenli', point: 1, icon: '🧼' }
    ],
    development: [
      { name: 'Sınıf Düzenini Bozma', point: -1, icon: '📣' },
      { name: 'Derse Geç Kalma', point: -1, icon: '⏰' },
      { name: 'Ödevini Yapmama', point: -1, icon: '❌' },
      { name: 'Hazırlıksız Gelme', point: -1, icon: '📝' },
      { name: 'Malzeme Eksikliği', point: -1, icon: '🎒' },
      { name: 'Saygısızlık', point: -2, icon: '⚠️' }
    ]
  };

  const CompanionBehavior = {
    students: [],
    activeStudent: null,
    justFinishedDrag: false,

    getData() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return { students: [], performance: [] };
    },

    saveData(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Veri kaydetme hatası:', e);
      }
    },

    // Aktif Şubedeki Öğrencileri Getir (Sıralama Belleğiyle Birlikte)
    getActiveStudents() {
      const data = this.getData();
      let allStudents = Array.isArray(data.students) ? data.students : [];
      const activeSection = (window.Companion && window.Companion.activeSection) || '5-A';

      // Şubeye göre filtrele
      let filtered = allStudents.filter(s => {
        if (!s.branch && !s.section && !s.className) return true;
        const b = String(s.branch || s.section || s.className || '').trim().toUpperCase();
        const target = activeSection.trim().toUpperCase();
        const normB = b.replace(/[\/\-\s]/g, '');
        const normT = target.replace(/[\/\-\s]/g, '');
        return normB === normT || b === target;
      });

      // Eğer kayıtlı öğrenci yoksa öğretmen test edebilsin diye örnek öğrenciler
      if (filtered.length === 0 && allStudents.length === 0) {
        filtered = [
          { id: 'demo_1', name: 'Ahmet', surname: 'Yılmaz', number: '101', branch: activeSection, gender: 'male' },
          { id: 'demo_2', name: 'Ayşe', surname: 'Kaya', number: '104', branch: activeSection, gender: 'female' },
          { id: 'demo_3', name: 'Mehmet', surname: 'Demir', number: '108', branch: activeSection, gender: 'male' },
          { id: 'demo_4', name: 'Zeynep', surname: 'Çelik', number: '112', branch: activeSection, gender: 'female' },
          { id: 'demo_5', name: 'Can', surname: 'Öztürk', number: '115', branch: activeSection, gender: 'male' },
          { id: 'demo_6', name: 'Elif', surname: 'Aydın', number: '120', branch: activeSection, gender: 'female' },
          { id: 'demo_7', name: 'Burak', surname: 'Yıldız', number: '124', branch: activeSection, gender: 'male' },
          { id: 'demo_8', name: 'Selin', surname: 'Arslan', number: '130', branch: activeSection, gender: 'female' },
          { id: 'demo_9', name: 'Emre', surname: 'Koç', number: '135', branch: activeSection, gender: 'male' }
        ];
      }

      // Kalıcı Özel Sıralamayı Uygula
      const savedOrderRaw = localStorage.getItem(ORDER_KEY_PREFIX + activeSection);
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
        // Varsayılan numara sırası
        filtered.sort((a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0));
      }

      return filtered;
    },

    // Davranış Kriterlerini Getir (Masaüstünden Senkronize Edilenler veya Varsayılanlar)
    getBehaviors() {
      const data = this.getData();
      if (data && data.performanceBehaviors) {
        const pb = data.performanceBehaviors;
        const pos = Array.isArray(pb.positive) && pb.positive.length > 0 ? pb.positive : DEFAULT_BEHAVIORS.positive;
        const dev = Array.isArray(pb.development) && pb.development.length > 0
          ? pb.development
          : (Array.isArray(pb.negative) && pb.negative.length > 0 ? pb.negative : DEFAULT_BEHAVIORS.development);
        return { positive: pos, development: dev };
      }
      return DEFAULT_BEHAVIORS;
    },

    // Öğrencinin Toplam Puanını Hesapla (Masaüstü ve Terminal Senkronize)
    getStudentScore(studentOrId) {
      const data = this.getData();
      const perfList = Array.isArray(data.performance) ? data.performance : [];
      let total = 0;
      let plusCount = 0;
      let minusCount = 0;

      let targetId = null;
      let targetNumber = null;
      if (typeof studentOrId === 'object' && studentOrId !== null) {
        targetId = studentOrId.id != null ? String(studentOrId.id) : null;
        targetNumber = studentOrId.number != null ? String(studentOrId.number).trim() : null;
      } else if (studentOrId != null) {
        targetId = String(studentOrId);
        const sObj = this.students ? this.students.find(s => String(s.id) === targetId) : null;
        if (sObj && sObj.number != null) {
          targetNumber = String(sObj.number).trim();
        }
      }

      perfList.forEach(p => {
        let isMatch = false;
        if (targetId && p.studentId != null && String(p.studentId) === targetId) {
          isMatch = true;
        } else if (targetNumber && p.studentNumber != null && String(p.studentNumber).trim() === targetNumber) {
          isMatch = true;
        }
        if (isMatch) {
          const pt = parseInt(p.point, 10) || 0;
          total += pt;
          if (pt > 0) plusCount++;
          else if (pt < 0) minusCount++;
        }
      });

      return { total, plusCount, minusCount };
    },

    // Modülü Başlat ve Izgarayı Çiz
    init() {
      this.students = this.getActiveStudents();
      this.updateHeaderInfo();
      this.renderGrid();
    },

    updateHeaderInfo() {
      const activeSection = (window.Companion && window.Companion.activeSection) || '5-A';
      const subEl = document.getElementById('behavior-view-subtitle');
      if (subEl) {
        subEl.textContent = `${activeSection} Şubesi • ${this.students.length} Öğrenci`;
      }
    },

    // 3 Sütunlu Izgarayı Render Et
    renderGrid(filterQuery = '') {
      const container = document.getElementById('behavior-students-grid');
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
            <i data-lucide="users" style="width: 40px; height: 40px; margin: 0 auto 10px; color: #93c5fd;"></i>
            <h4 style="font-size: 15px; font-weight: 700;">Bu şubede öğrenci bulunamadı</h4>
            <p style="font-size: 12px; color: #93c5fd; margin-top: 4px;">Masaüstünden 'Tüm Sınıf & Verileri Eşitle' butonuna basarak öğrencileri yükleyebilirsiniz.</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const colors = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#6366f1'];

      container.innerHTML = displayStudents.map((s, idx) => {
        const score = this.getStudentScore(s);
        const initials = ((s.name ? s.name[0] : '') + (s.surname ? s.surname[0] : '')).toUpperCase() || '?';
        const color = s.gender === 'female' ? '#ec4899' : (s.gender === 'male' ? '#3b82f6' : colors[idx % colors.length]);

        let scoreBadgeClass = 'neutral';
        let scoreBadgeText = '0';
        if (score.total > 0) {
          scoreBadgeClass = 'positive';
          scoreBadgeText = `+${score.total}`;
        } else if (score.total < 0) {
          scoreBadgeClass = 'negative';
          scoreBadgeText = `${score.total}`;
        }

        const avatarHtml = s.photo
          ? `<img src="${s.photo}" class="c-student-card-avatar" alt="${s.name}" />`
          : `<div class="c-student-card-avatar-initials" style="background: linear-gradient(135deg, ${color}, #1e3a8a);">${initials}</div>`;

        return `
          <div class="c-student-card-mini" data-id="${s.id}" draggable="true">
            <!-- Sürükleme Tutamağı (Mobil & Masaüstü) -->
            <div class="c-card-drag-handle" title="Sıralamak için sürükleyin">
              <i data-lucide="grip-vertical" style="width: 14px; height: 14px;"></i>
            </div>

            <!-- Puan Rozeti -->
            <div class="c-student-score-badge ${scoreBadgeClass}" id="score-badge-${s.id}">
              ${scoreBadgeText}
            </div>

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

      // Sürükle-Bırak ve Dokunma Olaylarını Dinle
      this.bindDragAndTouchEvents(container);
    },

    // Sürükle-Bırak Olaylarını Bağlama (Hem Dokunmatik Hem Masaüstü Mouse)
    bindDragAndTouchEvents(container) {
      const cards = container.querySelectorAll('.c-student-card-mini');

      // 1. DOKUNMATİK MOBİL SÜRÜKLE-BIRAK (TOUCH EVENTS)
      cards.forEach(card => {
        let touchStartX = 0;
        let touchStartY = 0;
        let isTouching = false;
        let isDraggingCard = false;
        let longPressTimer = null;
        let ghostEl = null;

        // Kart İçine Dokunma
        card.addEventListener('touchstart', (e) => {
          const touch = e.touches[0];
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
          isTouching = true;
          isDraggingCard = false;

          const isHandleTouch = !!e.target.closest('.c-card-drag-handle');

          if (isHandleTouch) {
            // Tutamağa dokunulduğunda doğrudan sürüklemeye hazır ol
            isDraggingCard = true;
            this.startDragVisual(card);
            if (window.Companion) window.Companion.vibrate(25);
          } else {
            // Kart gövdesine 250ms basılı tutulduğunda sürüklemeyi tetikle
            longPressTimer = setTimeout(() => {
              if (isTouching) {
                isDraggingCard = true;
                this.startDragVisual(card);
                if (window.Companion) window.Companion.vibrate(35);
              }
            }, 260);
          }
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
          if (!isTouching) return;
          const touch = e.touches[0];
          const moveX = touch.clientX - touchStartX;
          const moveY = touch.clientY - touchStartY;
          const distance = Math.hypot(moveX, moveY);

          // Eğer kullanıcı sadece sayfayı kaydırıyorsa uzun basmayı iptal et
          if (!isDraggingCard && distance > 12) {
            clearTimeout(longPressTimer);
            isTouching = false;
            return;
          }

          if (isDraggingCard) {
            if (e.cancelable) e.preventDefault(); // Sayfa kaydırmasını engelle

            // Parmak altındaki hedef kartı bul
            const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
            const targetCard = targetEl ? targetEl.closest('.c-student-card-mini') : null;

            if (targetCard && targetCard !== card && targetCard.parentNode === container) {
              const rect = targetCard.getBoundingClientRect();
              const isAfter = touch.clientX > (rect.left + rect.width / 2);
              if (isAfter) {
                container.insertBefore(card, targetCard.nextSibling);
              } else {
                container.insertBefore(card, targetCard);
              }
            }
          }
        }, { passive: false });

        card.addEventListener('touchend', (e) => {
          clearTimeout(longPressTimer);

          if (isDraggingCard) {
            isDraggingCard = false;
            isTouching = false;
            this.stopDragVisual(card);
            this.saveCurrentOrder();
            if (window.Companion) window.Companion.vibrate(20);

            // Tıklamanın hemen arkasından tetiklenmesini engelle
            this.justFinishedDrag = true;
            setTimeout(() => { this.justFinishedDrag = false; }, 350);
            return;
          }

          isTouching = false;
        });

        card.addEventListener('touchcancel', () => {
          clearTimeout(longPressTimer);
          if (isDraggingCard) {
            this.stopDragVisual(card);
          }
          isTouching = false;
          isDraggingCard = false;
        });

        // 2. MASAÜSTÜ HTML5 SÜRÜKLE-BIRAK (MOUSE / TAHTA)
        card.addEventListener('dragstart', (e) => {
          this.startDragVisual(card);
          e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
          e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const draggingCard = container.querySelector('.c-student-card-mini.is-dragging');
          if (draggingCard && draggingCard !== card) {
            const rect = card.getBoundingClientRect();
            const isAfter = e.clientX > (rect.left + rect.width / 2);
            if (isAfter) {
              container.insertBefore(draggingCard, card.nextSibling);
            } else {
              container.insertBefore(draggingCard, card);
            }
          }
        });

        card.addEventListener('dragend', () => {
          this.stopDragVisual(card);
          this.saveCurrentOrder();
        });

        // Masaüstü tıklama
        card.addEventListener('click', (e) => {
          if (this.justFinishedDrag) return;
          const stuId = card.getAttribute('data-id');
          this.openScoreModal(stuId);
        });
      });
    },

    startDragVisual(card) {
      card.classList.add('is-dragging');
    },

    stopDragVisual(card) {
      card.classList.remove('is-dragging');
    },

    // Güncel Sıralamayı LocalStorage'a Kaydet
    saveCurrentOrder() {
      const container = document.getElementById('behavior-students-grid');
      if (!container) return;

      const activeSection = (window.Companion && window.Companion.activeSection) || '5-A';
      const cards = container.querySelectorAll('.c-student-card-mini');
      const orderIds = Array.from(cards).map(c => c.getAttribute('data-id'));

      try {
        localStorage.setItem(ORDER_KEY_PREFIX + activeSection, JSON.stringify(orderIds));
      } catch (e) {}

      // Bellekteki öğrenci dizisini de güncelle
      const idMap = new Map();
      orderIds.forEach((id, idx) => idMap.set(String(id), idx));
      this.students.sort((a, b) => {
        const posA = idMap.has(String(a.id)) ? idMap.get(String(a.id)) : 9999;
        const posB = idMap.has(String(b.id)) ? idMap.get(String(b.id)) : 9999;
        return posA - posB;
      });
    },

    // Sıralamayı Sıfırla (Numara veya İsim Sırasına)
    resetOrder(mode = 'number') {
      const activeSection = (window.Companion && window.Companion.activeSection) || '5-A';
      localStorage.removeItem(ORDER_KEY_PREFIX + activeSection);

      if (mode === 'name') {
        this.students.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
      } else {
        this.students.sort((a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0));
      }

      this.saveCurrentOrder();
      this.renderGrid();
      if (window.Companion) {
        window.Companion.showToast(`Sıralama varsayılana döndürüldü (${mode === 'name' ? 'İsim' : 'Numara'}).`);
        window.Companion.vibrate(25);
      }
    },

    // =========================================================================
    // PUAN VERME MODÜLÜ (BOTTOM SHEET MODAL)
    // =========================================================================
    openScoreModal(studentId) {
      const student = this.students.find(s => String(s.id) === String(studentId));
      if (!student) return;

      this.activeStudent = student;
      const score = this.getStudentScore(student);
      const modal = document.getElementById('behavior-score-modal');
      if (!modal) return;

      const nameEl = document.getElementById('score-modal-student-name');
      const numEl = document.getElementById('score-modal-student-num');
      const avatarContainer = document.getElementById('score-modal-student-avatar');
      const currentPointsEl = document.getElementById('score-modal-student-points');

      if (nameEl) nameEl.textContent = `${student.name} ${student.surname || ''}`;
      if (numEl) numEl.textContent = `#${student.number || '-'} • ${(student.branch || '').toUpperCase() || 'Sınıf'}`;
      if (currentPointsEl) {
        const sign = score.total > 0 ? '+' : '';
        currentPointsEl.textContent = `${sign}${score.total} Puan`;
        currentPointsEl.className = `c-modal-score-pill ${score.total > 0 ? 'positive' : (score.total < 0 ? 'negative' : 'neutral')}`;
      }

      if (avatarContainer) {
        const initials = ((student.name ? student.name[0] : '') + (student.surname ? student.surname[0] : '')).toUpperCase() || '?';
        const color = student.gender === 'female' ? '#ec4899' : '#3b82f6';
        avatarContainer.innerHTML = student.photo
          ? `<img src="${student.photo}" style="width: 58px; height: 58px; border-radius: 50%; object-fit: cover; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.15);" />`
          : `<div style="width: 58px; height: 58px; border-radius: 50%; background: linear-gradient(135deg, ${color}, #1e3a8a); color: white; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">${initials}</div>`;
      }

      // Hızlı Davranış Kartlarını Doldur
      this.renderModalBehaviors();

      modal.style.display = 'flex';
      modal.classList.add('active');
      if (window.Companion) window.Companion.vibrate(15);
      if (window.lucide) window.lucide.createIcons();
    },

    renderModalBehaviors() {
      const posContainer = document.getElementById('score-modal-positive-grid');
      const devContainer = document.getElementById('score-modal-development-grid');
      const behaviors = this.getBehaviors();

      if (posContainer) {
        posContainer.innerHTML = (behaviors.positive || []).map(b => {
          const pt = parseInt(b.point, 10) || 1;
          const icon = b.icon || '🌟';
          const name = b.name || '';
          const safeName = name.replace(/'/g, "\\'");
          return `
            <button type="button" class="c-behavior-btn positive" onclick="window.CompanionBehavior.awardPoint(${pt}, '${safeName}')">
              <span class="c-behavior-btn-icon">${icon}</span>
              <span class="c-behavior-btn-name">${name}</span>
              <span class="c-behavior-btn-point">+${pt}</span>
            </button>
          `;
        }).join('');
      }

      if (devContainer) {
        devContainer.innerHTML = (behaviors.development || []).map(b => {
          let pt = parseInt(b.point, 10) || -1;
          if (pt > 0) pt = -pt;
          const icon = b.icon || '⚠️';
          const name = b.name || '';
          const safeName = name.replace(/'/g, "\\'");
          return `
            <button type="button" class="c-behavior-btn negative" onclick="window.CompanionBehavior.awardPoint(${pt}, '${safeName}')">
              <span class="c-behavior-btn-icon">${icon}</span>
              <span class="c-behavior-btn-name">${name}</span>
              <span class="c-behavior-btn-point">${pt}</span>
            </button>
          `;
        }).join('');
      }
    },

    closeScoreModal() {
      const modal = document.getElementById('behavior-score-modal');
      if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
          modal.style.display = 'none';
        }, 200);
      }
      this.activeStudent = null;
    },

    // Puanı Ekle, Geri Bildirim Ver ve Modülü Kapat
    awardPoint(point, reason) {
      if (!this.activeStudent) return;

      const student = this.activeStudent;
      const pts = parseInt(point, 10) || 0;
      const isPositive = pts >= 0;

      const studentFullName = `${student.name} ${student.surname || ''}`.trim();
      const studentNumber = String(student.number || '').trim();

      // 1. Veritabanına / LocalStorage'a Kaydet
      const data = this.getData();
      if (!Array.isArray(data.performance)) data.performance = [];

      const record = {
        id: 'perf_' + Date.now() + Math.random().toString(36).substr(2, 5),
        studentId: student.id,
        studentName: studentFullName,
        studentNumber: studentNumber,
        type: isPositive ? 'positive' : 'development',
        point: pts,
        reason: reason || (isPositive ? 'Ders İçi Katılım' : 'Gelişim Uyarısı'),
        date: new Date().toISOString()
      };
      data.performance.push(record);
      this.saveData(data);

      // 1.1 CANLI BULUT ENTEGRASYONU: Masaüstüne/Akıllı Tahtaya anında fırlat
      if (window.CloudSync && typeof window.CloudSync.pushLivePerformance === 'function') {
        window.CloudSync.pushLivePerformance(record, studentFullName, studentNumber);
      }

      // 2. Ses ve Titreşim Çal
      playPointSound(isPositive);
      if (window.Companion) window.Companion.vibrate(isPositive ? 40 : 60);

      // 3. Rozeti Grid Üzerinde Canlı Güncelle
      const badgeEl = document.getElementById(`score-badge-${student.id}`);
      if (badgeEl) {
        const newScore = this.getStudentScore(student);
        let badgeClass = 'neutral';
        let badgeText = '0';
        if (newScore.total > 0) {
          badgeClass = 'positive';
          badgeText = `+${newScore.total}`;
        } else if (newScore.total < 0) {
          badgeClass = 'negative';
          badgeText = `${newScore.total}`;
        }
        badgeEl.className = `c-student-score-badge ${badgeClass}`;
        badgeEl.textContent = badgeText;

        // Hafif sıçrama animasyonu
        badgeEl.classList.add('pulse');
        setTimeout(() => badgeEl.classList.remove('pulse'), 400);
      }

      // 4. Bilgilendirme Bildirimi (Toast)
      const pointSign = pts > 0 ? `+${pts}` : `${pts}`;
      const msg = `⭐ ${student.name}: ${pointSign} Puan (${reason})`;
      if (window.Companion) {
        window.Companion.showToast(msg);
      }

      // 5. Modülü Kapat
      this.closeScoreModal();
    },

    // =========================================================================
    // 1. RASTGELE ÖĞRENCİ SEÇİCİ (KURA / ÖĞRENCİ ÇAĞIR)
    // =========================================================================
    activeRandomStudent: null,
    isSpinning: false,

    getCallerPoolKey() {
      const activeSection = (window.Companion && window.Companion.activeSection) || '5-A';
      return `sinif_companion_caller_pool_${activeSection}`;
    },

    getCalledStudentIds() {
      try {
        const raw = localStorage.getItem(this.getCallerPoolKey());
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return [];
    },

    saveCalledStudentIds(ids) {
      try {
        localStorage.setItem(this.getCallerPoolKey(), JSON.stringify(ids));
      } catch (e) {}
    },

    openRandomCallerModal() {
      this.students = this.getActiveStudents();
      const modal = document.getElementById('behavior-random-modal');
      if (!modal) return;

      this.updateCallerPoolTag();
      this.resetCallerCardDisplay();

      modal.style.display = 'flex';
      modal.classList.add('active');
      if (window.Companion) window.Companion.vibrate(15);
      if (window.lucide) window.lucide.createIcons();
    },

    closeRandomCallerModal() {
      const modal = document.getElementById('behavior-random-modal');
      if (modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
      }
      this.activeRandomStudent = null;
      this.isSpinning = false;
    },

    updateCallerPoolTag() {
      const tagEl = document.getElementById('random-modal-pool-tag');
      if (!tagEl) return;
      const all = this.students || [];
      const called = this.getCalledStudentIds();
      const remaining = all.filter(s => !called.includes(String(s.id))).length;
      tagEl.textContent = `Kalan: ${remaining} / ${all.length} Öğrenci`;
    },

    resetCallerCardDisplay() {
      const card = document.getElementById('random-draw-card');
      const avatarSlot = document.getElementById('random-card-avatar');
      const nameEl = document.getElementById('random-card-name');
      const subEl = document.getElementById('random-card-sub');
      const ptsBar = document.getElementById('random-quick-points');

      if (card) card.className = 'c-random-draw-card';
      if (avatarSlot) avatarSlot.innerHTML = '<div class="c-random-dice-icon">🎲</div>';
      if (nameEl) nameEl.textContent = 'Kurayı Başlatın';
      if (subEl) subEl.textContent = 'Adil seçim için aşağıdaki butona dokunun';
      if (ptsBar) ptsBar.style.display = 'none';
      this.activeRandomStudent = null;
    },

    resetCallerPool() {
      localStorage.removeItem(this.getCallerPoolKey());
      this.updateCallerPoolTag();
      this.resetCallerCardDisplay();
      if (window.Companion) {
        window.Companion.showToast('🔄 Kura havuzu sıfırlandı. Tüm öğrenciler yeniden dahil edildi.');
        window.Companion.vibrate(25);
      }
    },

    spinRandomStudent() {
      if (this.isSpinning) return;
      const all = this.students || [];
      if (all.length === 0) {
        if (window.Companion) window.Companion.showToast('Sınıfta öğrenci bulunamadı.');
        return;
      }

      let called = this.getCalledStudentIds();
      let available = all.filter(s => !called.includes(String(s.id)));

      // Eğer havuz bittiyse otomatik sıfırla
      if (available.length === 0) {
        called = [];
        this.saveCalledStudentIds([]);
        available = all;
        if (window.Companion) window.Companion.showToast('Tüm öğrenciler çağrıldı, havuz baştan başlatılıyor!');
      }

      this.isSpinning = true;
      const btnSpin = document.getElementById('btn-spin-random');
      if (btnSpin) btnSpin.disabled = true;

      const card = document.getElementById('random-draw-card');
      const avatarSlot = document.getElementById('random-card-avatar');
      const nameEl = document.getElementById('random-card-name');
      const subEl = document.getElementById('random-card-sub');
      const ptsBar = document.getElementById('random-quick-points');
      if (ptsBar) ptsBar.style.display = 'none';
      if (card) card.className = 'c-random-draw-card';

      // Rastgele kazananı önceden seç
      const winner = available[Math.floor(Math.random() * available.length)];

      let counter = 0;
      const totalSteps = 16;
      let delay = 60;

      const runStep = () => {
        counter++;
        const tempStudent = all[Math.floor(Math.random() * all.length)];
        const initials = ((tempStudent.name ? tempStudent.name[0] : '') + (tempStudent.surname ? tempStudent.surname[0] : '')).toUpperCase() || '?';
        const color = tempStudent.gender === 'female' ? '#ec4899' : '#3b82f6';

        if (avatarSlot) {
          avatarSlot.innerHTML = tempStudent.photo
            ? `<img src="${tempStudent.photo}" class="c-random-avatar-img" />`
            : `<div class="c-random-avatar-initials" style="background: linear-gradient(135deg, ${color}, #1e3a8a);">${initials}</div>`;
        }
        if (nameEl) nameEl.textContent = `${tempStudent.name} ${tempStudent.surname || ''}`;
        if (subEl) subEl.textContent = `#${tempStudent.number || '-'} • ${(tempStudent.branch || '').toUpperCase() || 'Sınıf'}`;

        playPointSound(true);
        if (window.Companion) window.Companion.vibrate(10);

        if (counter < totalSteps) {
          delay += 14;
          setTimeout(runStep, delay);
        } else {
          // KAZANAN ÖĞRENCİ BELİRLENDİ
          this.activeRandomStudent = winner;
          called.push(String(winner.id));
          this.saveCalledStudentIds(called);

          const wInitials = ((winner.name ? winner.name[0] : '') + (winner.surname ? winner.surname[0] : '')).toUpperCase() || '?';
          const wColor = winner.gender === 'female' ? '#ec4899' : '#3b82f6';

          if (avatarSlot) {
            avatarSlot.innerHTML = winner.photo
              ? `<img src="${winner.photo}" class="c-random-avatar-img" />`
              : `<div class="c-random-avatar-initials" style="background: linear-gradient(135deg, ${wColor}, #1e3a8a);">${wInitials}</div>`;
          }
          if (nameEl) nameEl.textContent = `${winner.name} ${winner.surname || ''}`;
          if (subEl) subEl.textContent = `🎯 SEÇİLDİ! #${winner.number || '-'} • ${(winner.branch || '').toUpperCase() || 'Sınıf'}`;

          if (card) card.classList.add('winner');
          if (ptsBar) ptsBar.style.display = 'block';

          this.updateCallerPoolTag();
          this.isSpinning = false;
          if (btnSpin) btnSpin.disabled = false;

          playPointSound(true);
          setTimeout(() => playPointSound(true), 120);
          if (window.Companion) window.Companion.vibrate([40, 30, 60]);
        }
      };

      runStep();
    },

    awardRandomCallerStudent(point, reason) {
      if (!this.activeRandomStudent) return;
      this.activeStudent = this.activeRandomStudent;
      this.awardPoint(point, reason);
      const ptsBar = document.getElementById('random-quick-points');
      if (ptsBar) ptsBar.style.display = 'none';
      const subEl = document.getElementById('random-card-sub');
      if (subEl) subEl.textContent = `✅ Puan Verildi: ${point > 0 ? '+' : ''}${point} (${reason})`;
    },

    openScoreModalFromRandom() {
      if (!this.activeRandomStudent) return;
      const targetId = this.activeRandomStudent.id;
      this.closeRandomCallerModal();
      this.openScoreModal(targetId);
    },

    // =========================================================================
    // 2. TOPLU DAVRANIŞ PUANI GİRİŞİ (BULK SCORE)
    // =========================================================================
    selectedBulkStudentIds: new Set(),

    openBulkScoreModal() {
      this.students = this.getActiveStudents();
      const modal = document.getElementById('behavior-bulk-modal');
      if (!modal) return;

      this.selectedBulkStudentIds.clear();
      this.goToBulkStep1();
      this.renderBulkStudentsList();

      modal.style.display = 'flex';
      modal.classList.add('active');
      if (window.Companion) window.Companion.vibrate(15);
      if (window.lucide) window.lucide.createIcons();
    },

    closeBulkScoreModal() {
      const modal = document.getElementById('behavior-bulk-modal');
      if (modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
      }
      this.selectedBulkStudentIds.clear();
    },

    renderBulkStudentsList() {
      const container = document.getElementById('bulk-students-list');
      if (!container) return;

      const all = this.students || [];
      if (all.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">Bu şubede öğrenci bulunamadı.</div>';
        return;
      }

      container.innerHTML = all.map(s => {
        const isSelected = this.selectedBulkStudentIds.has(String(s.id));
        const initials = ((s.name ? s.name[0] : '') + (s.surname ? s.surname[0] : '')).toUpperCase() || '?';
        const color = s.gender === 'female' ? '#ec4899' : '#3b82f6';
        return `
          <div class="c-bulk-student-item ${isSelected ? 'selected' : ''}" onclick="window.CompanionBehavior.toggleBulkStudent('${s.id}')">
            <div class="c-bulk-checkbox">${isSelected ? '✓' : ''}</div>
            <div class="c-bulk-mini-avatar" style="background: linear-gradient(135deg, ${color}, #1e3a8a);">
              ${initials}
            </div>
            <span class="c-bulk-item-name">${s.name} ${s.surname || ''}</span>
            <span class="c-bulk-item-no">#${s.number || '-'}</span>
          </div>
        `;
      }).join('');

      this.updateBulkCounter();
    },

    toggleBulkStudent(studentId) {
      const idStr = String(studentId);
      if (this.selectedBulkStudentIds.has(idStr)) {
        this.selectedBulkStudentIds.delete(idStr);
      } else {
        this.selectedBulkStudentIds.add(idStr);
      }
      if (window.Companion) window.Companion.vibrate(10);
      this.renderBulkStudentsList();
    },

    selectAllBulkStudents() {
      (this.students || []).forEach(s => this.selectedBulkStudentIds.add(String(s.id)));
      if (window.Companion) window.Companion.vibrate(15);
      this.renderBulkStudentsList();
    },

    clearBulkStudents() {
      this.selectedBulkStudentIds.clear();
      if (window.Companion) window.Companion.vibrate(15);
      this.renderBulkStudentsList();
    },

    updateBulkCounter() {
      const count = this.selectedBulkStudentIds.size;
      const counterEl = document.getElementById('bulk-selected-counter');
      const btnNext = document.getElementById('btn-bulk-next');
      if (counterEl) counterEl.textContent = `${count} Seçildi`;
      if (btnNext) {
        btnNext.disabled = count === 0;
        btnNext.style.opacity = count === 0 ? '0.5' : '1';
      }
    },

    goToBulkStep1() {
      const step1 = document.getElementById('bulk-step-1');
      const step2 = document.getElementById('bulk-step-2');
      const sub = document.getElementById('bulk-modal-subtitle');
      if (step1) step1.style.display = 'block';
      if (step2) step2.style.display = 'none';
      if (sub) sub.textContent = 'Adım 1: Öğrencileri Seçin';
    },

    goToBulkStep2() {
      if (this.selectedBulkStudentIds.size === 0) {
        if (window.Companion) window.Companion.showToast('Lütfen en az 1 öğrenci seçin.');
        return;
      }
      const step1 = document.getElementById('bulk-step-1');
      const step2 = document.getElementById('bulk-step-2');
      const sub = document.getElementById('bulk-modal-subtitle');
      const badge = document.getElementById('bulk-step2-badge');

      if (step1) step1.style.display = 'none';
      if (step2) step2.style.display = 'block';
      if (sub) sub.textContent = 'Adım 2: Davranış Kriterini Seçin';
      if (badge) badge.textContent = `${this.selectedBulkStudentIds.size} Öğrenci Seçili`;

      this.renderBulkModalBehaviors();
      if (window.lucide) window.lucide.createIcons();
    },

    renderBulkModalBehaviors() {
      const posContainer = document.getElementById('bulk-modal-positive-grid');
      const devContainer = document.getElementById('bulk-modal-development-grid');
      const behaviors = this.getBehaviors();

      if (posContainer) {
        posContainer.innerHTML = (behaviors.positive || []).map(b => {
          const pt = parseInt(b.point, 10) || 1;
          const icon = b.icon || '🌟';
          const name = b.name || '';
          const safeName = name.replace(/'/g, "\\'");
          return `
            <button type="button" class="c-behavior-btn positive" onclick="window.CompanionBehavior.applyBulkScore(${pt}, '${safeName}')">
              <span class="c-behavior-btn-icon">${icon}</span>
              <span class="c-behavior-btn-name">${name}</span>
              <span class="c-behavior-btn-point">+${pt}</span>
            </button>
          `;
        }).join('');
      }

      if (devContainer) {
        devContainer.innerHTML = (behaviors.development || []).map(b => {
          let pt = parseInt(b.point, 10) || -1;
          if (pt > 0) pt = -pt;
          const icon = b.icon || '⚠️';
          const name = b.name || '';
          const safeName = name.replace(/'/g, "\\'");
          return `
            <button type="button" class="c-behavior-btn negative" onclick="window.CompanionBehavior.applyBulkScore(${pt}, '${safeName}')">
              <span class="c-behavior-btn-icon">${icon}</span>
              <span class="c-behavior-btn-name">${name}</span>
              <span class="c-behavior-btn-point">${pt}</span>
            </button>
          `;
        }).join('');
      }
    },

    applyBulkScore(point, reason) {
      const selectedCount = this.selectedBulkStudentIds.size;
      if (selectedCount === 0) return;

      const pts = parseInt(point, 10) || 0;
      const isPositive = pts >= 0;
      const data = this.getData();
      if (!Array.isArray(data.performance)) data.performance = [];

      const newRecords = [];
      const timestamp = new Date().toISOString();

      this.selectedBulkStudentIds.forEach(idStr => {
        const student = (this.students || []).find(s => String(s.id) === idStr);
        if (student) {
          const sName = `${student.name} ${student.surname || ''}`.trim();
          const sNum = String(student.number || '').trim();
          const record = {
            id: 'perf_' + Date.now() + Math.random().toString(36).substr(2, 5),
            studentId: student.id,
            studentName: sName,
            studentNumber: sNum,
            type: isPositive ? 'positive' : 'development',
            point: pts,
            reason: reason || (isPositive ? 'Toplu Katılım' : 'Toplu Uyarı'),
            date: timestamp
          };
          data.performance.push(record);
          newRecords.push(record);

          // Grid rozetini güncelle
          const badgeEl = document.getElementById(`score-badge-${student.id}`);
          if (badgeEl) {
            const newScore = this.getStudentScore(student);
            let badgeClass = 'neutral';
            let badgeText = '0';
            if (newScore.total > 0) {
              badgeClass = 'positive';
              badgeText = `+${newScore.total}`;
            } else if (newScore.total < 0) {
              badgeClass = 'negative';
              badgeText = `${newScore.total}`;
            }
            badgeEl.className = `c-student-score-badge ${badgeClass} pulse`;
            badgeEl.textContent = badgeText;
            setTimeout(() => badgeEl.classList.remove('pulse'), 400);
          }
        }
      });

      this.saveData(data);

      // CANLI BULUT SENKRONİZASYONU: Masaüstüne toplu fırlat
      if (window.CloudSync && typeof window.CloudSync.pushLiveBatchPerformance === 'function') {
        window.CloudSync.pushLiveBatchPerformance(newRecords, reason, pts);
      }

      playPointSound(isPositive);
      if (window.Companion) {
        window.Companion.vibrate(isPositive ? 50 : 80);
        const sign = pts > 0 ? `+${pts}` : `${pts}`;
        window.Companion.showToast(`⭐ ${selectedCount} öğrenciye ${sign} Puan verildi (${reason})`);
      }

      this.closeBulkScoreModal();
    },

    // =========================================================================
    // 3. HIZLI YOKLAMA GİRİŞİ (ATTENDANCE)
    // =========================================================================
    currentAttendanceDate: '',
    attendanceStatusMap: {},

    openAttendanceModal() {
      this.students = this.getActiveStudents();
      const modal = document.getElementById('behavior-attendance-modal');
      if (!modal) return;

      const today = new Date().toISOString().split('T')[0];
      this.currentAttendanceDate = today;

      const dateInput = document.getElementById('attendance-date-picker');
      if (dateInput) dateInput.value = today;

      this.loadAttendanceForDate(today);

      modal.style.display = 'flex';
      modal.classList.add('active');
      if (window.Companion) window.Companion.vibrate(15);
      if (window.lucide) window.lucide.createIcons();
    },

    closeAttendanceModal() {
      const modal = document.getElementById('behavior-attendance-modal');
      if (modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
      }
    },

    onAttendanceDateChanged(newDate) {
      if (!newDate) return;
      this.currentAttendanceDate = newDate;
      this.loadAttendanceForDate(newDate);
    },

    loadAttendanceForDate(dateStr) {
      const subTitle = document.getElementById('attendance-modal-subtitle');
      const activeSection = (window.Companion && window.Companion.activeSection) || '5-A';
      if (subTitle) subTitle.textContent = `${activeSection} Şubesi • ${dateStr}`;

      const data = this.getData();
      const attendance = data.attendance || {};
      const absentList = Array.isArray(attendance[dateStr]) ? attendance[dateStr].map(String) : [];

      this.attendanceStatusMap = {};
      (this.students || []).forEach(s => {
        const sId = String(s.id);
        const sNum = String(s.number || '').trim();
        const isAbsent = absentList.includes(sId) || (sNum && absentList.includes(sNum));
        this.attendanceStatusMap[sId] = isAbsent ? 'absent' : 'present';
      });

      this.renderAttendanceList();
    },

    renderAttendanceList() {
      const container = document.getElementById('attendance-students-list');
      if (!container) return;

      const all = this.students || [];
      if (all.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">Bu şubede öğrenci bulunamadı.</div>';
        return;
      }

      let presentCount = 0;
      let absentCount = 0;

      container.innerHTML = all.map(s => {
        const sId = String(s.id);
        const status = this.attendanceStatusMap[sId] || 'present';
        if (status === 'present') presentCount++;
        else absentCount++;

        const initials = ((s.name ? s.name[0] : '') + (s.surname ? s.surname[0] : '')).toUpperCase() || '?';
        const color = s.gender === 'female' ? '#ec4899' : '#3b82f6';

        return `
          <div class="c-att-student-row">
            <div class="c-att-row-info">
              <div class="c-bulk-mini-avatar" style="background: linear-gradient(135deg, ${color}, #1e3a8a);">
                ${initials}
              </div>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #1e293b; line-height: 1.2;">
                  ${s.name} ${s.surname || ''}
                </div>
                <div style="font-size: 11px; font-weight: 600; color: #64748b;">
                  #${s.number || '-'}
                </div>
              </div>
            </div>
            <button type="button" class="c-att-status-btn ${status}" onclick="window.CompanionBehavior.toggleAttendanceStudent('${s.id}')">
              ${status === 'present' ? 'GELDİ ✓' : 'GELMEDİ ✗'}
            </button>
          </div>
        `;
      }).join('');

      const presEl = document.getElementById('att-summary-present');
      const absEl = document.getElementById('att-summary-absent');
      if (presEl) presEl.textContent = `Var: ${presentCount}`;
      if (absEl) absEl.textContent = `Yok: ${absentCount}`;
    },

    toggleAttendanceStudent(studentId) {
      const sId = String(studentId);
      const current = this.attendanceStatusMap[sId] || 'present';
      this.attendanceStatusMap[sId] = current === 'present' ? 'absent' : 'present';
      if (window.Companion) window.Companion.vibrate(15);
      this.renderAttendanceList();
    },

    markAllAttendance(status) {
      (this.students || []).forEach(s => {
        this.attendanceStatusMap[String(s.id)] = status;
      });
      if (window.Companion) window.Companion.vibrate(20);
      this.renderAttendanceList();
    },

    saveAttendance() {
      const date = this.currentAttendanceDate || new Date().toISOString().split('T')[0];
      const activeSection = (window.Companion && window.Companion.activeSection) || '5-A';

      const absentStudentIds = [];
      const presentStudentIds = [];

      (this.students || []).forEach(s => {
        const sId = String(s.id);
        if (this.attendanceStatusMap[sId] === 'absent') {
          absentStudentIds.push(sId);
        } else {
          presentStudentIds.push(sId);
        }
      });

      // 1. LocalStorage Kaydet
      const data = this.getData();
      if (!data.attendance) data.attendance = {};
      data.attendance[date] = absentStudentIds;
      this.saveData(data);

      // 2. Canlı Bulut Senkronizasyonu ile Masaüstüne Fırlat
      if (window.CloudSync && typeof window.CloudSync.pushLiveAttendance === 'function') {
        window.CloudSync.pushLiveAttendance(date, absentStudentIds, presentStudentIds, activeSection);
      }

      playPointSound(true);
      if (window.Companion) {
        window.Companion.vibrate([40, 30, 40]);
        window.Companion.showToast(`✅ ${activeSection} Yoklaması kaydedildi ve masaüstüne gönderildi! (${absentStudentIds.length} Devamsız)`);
      }

      this.closeAttendanceModal();
    }
  };

  window.CompanionBehavior = CompanionBehavior;

})(window);
