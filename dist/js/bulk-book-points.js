/**
 * Toplu Kitap Puanı Girişi Modülü
 * Hızlı menü üzerinden tüm sınıfa tek ekranda pratik ve toplu kitap puanı verilmesini sağlar.
 * Puanlar "Kitap Okuma Puanı" olarak kaydedilir ve sistemde otomatik olarak Kitap Puanı (bookPoints) sütununa işlenir.
 */
(() => {
  let modal = null;
  let searchInput = null;
  let allValueInput = null;
  let btnApplyAll = null;
  let btnResetAll = null;
  let studentsListContainer = null;
  let summaryText = null;
  let btnSave = null;
  let btnCloseHeader = null;
  let btnCloseFooter = null;

  let activeStudents = [];
  let studentPoints = {}; // { [studentId]: number }
  let searchQuery = '';

  // Ses Efekti (Web Audio API)
  function playSuccessSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Pozitif akor (C5 - E5 - G5)
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } catch (e) {
      console.warn("Bulk points sound error:", e);
    }
  }

  function initElements() {
    modal = document.getElementById('modal-bulk-book-points');
    if (!modal) return false;

    searchInput = document.getElementById('bulk-book-point-search');
    allValueInput = document.getElementById('bulk-book-point-all-value');
    btnApplyAll = document.getElementById('btn-bulk-book-point-apply-all');
    btnResetAll = document.getElementById('btn-bulk-book-point-reset-all');
    studentsListContainer = document.getElementById('bulk-book-points-students-list');
    summaryText = document.getElementById('bulk-book-points-summary');
    btnSave = document.getElementById('btn-bulk-book-points-save');
    btnCloseHeader = document.getElementById('btn-close-bulk-book-points');
    btnCloseFooter = document.getElementById('btn-close-bulk-book-points-footer');

    bindEvents();
    return true;
  }

  function bindEvents() {
    const closeFn = () => {
      if (modal) modal.classList.remove('active');
    };

    if (btnCloseHeader) btnCloseHeader.onclick = closeFn;
    if (btnCloseFooter) btnCloseFooter.onclick = closeFn;

    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) closeFn();
      };
    }

    // Arama
    if (searchInput) {
      searchInput.oninput = (e) => {
        searchQuery = (e.target.value || '').trim().toLowerCase();
        filterAndRenderList();
      };
    }

    // Tümüne Uygula
    if (btnApplyAll && allValueInput) {
      btnApplyAll.onclick = () => {
        const val = parseInt(allValueInput.value, 10);
        if (isNaN(val)) {
          if (window.showToast) window.showToast('Lütfen geçerli bir sayı girin!', 'warning');
          return;
        }

        activeStudents.forEach(s => {
          studentPoints[s.id] = val;
        });

        filterAndRenderList();
        updateSummary();
        if (window.showToast) {
          window.showToast(`Tüm öğrencilere ${val >= 0 ? '+' : ''}${val} puan atandı.`, 'info');
        }
      };
    }

    // Tümünü Sıfırla
    if (btnResetAll) {
      btnResetAll.onclick = () => {
        studentPoints = {};
        if (allValueInput) allValueInput.value = '';
        filterAndRenderList();
        updateSummary();
      };
    }

    // Kaydet Butonu
    if (btnSave) {
      btnSave.onclick = saveBulkPoints;
    }
  }

  // Modalı Aç
  window.openBulkBookPointModal = function() {
    if (!modal) {
      if (!initElements()) {
        console.error("modal-bulk-book-points bulunamadı!");
        return;
      }
    }

    const state = stateManager.loadState();
    const students = state.students || [];

    if (students.length === 0) {
      if (window.showToast) {
        window.showToast('Sınıfta kayıtlı öğrenci bulunamadı. Lütfen önce öğrenci ekleyin.', 'warning');
      }
      return;
    }

    const isMiddle = state.educationLevel === 'middle';
    const activeBranch = state.selectedBranch || state.activeBranch || 'all';

    // Ortaokul ise ve aktif şube seçiliyse şubeye göre filtrele
    activeStudents = students.filter(s => {
      return !isMiddle || activeBranch === 'all' || !s.branch || s.branch === activeBranch;
    });

    // Numara veya ada göre sırala
    activeStudents.sort((a, b) => {
      const noA = parseInt(a.number, 10);
      const noB = parseInt(b.number, 10);
      if (!isNaN(noA) && !isNaN(noB)) return noA - noB;
      return (a.name || '').localeCompare(b.name || '', 'tr');
    });

    // Durumu sıfırla
    studentPoints = {};
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    if (allValueInput) allValueInput.value = '5'; // Varsayılan öneri: 5 puan

    const subtitleEl = document.getElementById('bulk-book-points-subtitle');
    if (subtitleEl) {
      const branchText = isMiddle && activeBranch !== 'all' ? `${activeBranch} Şubesi • ` : '';
      subtitleEl.textContent = `${branchText}${activeStudents.length} Öğrenci`;
    }

    filterAndRenderList();
    updateSummary();

    modal.classList.add('active');
    if (window.safeCreateIcons) window.safeCreateIcons();
  };

  function filterAndRenderList() {
    if (!studentsListContainer) return;

    const filtered = activeStudents.filter(s => {
      if (!searchQuery) return true;
      const fullName = `${s.name || ''} ${s.surname || ''}`.toLowerCase();
      const num = `${s.number || ''}`.toLowerCase();
      return fullName.includes(searchQuery) || num.includes(searchQuery);
    });

    if (filtered.length === 0) {
      studentsListContainer.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; color: var(--text-muted); font-size: 0.95rem;">
          Aranan kritere uygun öğrenci bulunamadı.
        </div>
      `;
      return;
    }

    const state = stateManager.loadState();
    const performance = state.performance || [];

    let html = '';
    filtered.forEach(student => {
      const pts = studentPoints[student.id] !== undefined ? studentPoints[student.id] : '';
      
      // Mevcut toplam kitap puanı
      let currentBookPts = 0;
      performance.forEach(p => {
        if (p.studentId === student.id && p.reason && p.reason.toLowerCase().includes('kitap')) {
          currentBookPts += p.point;
        }
      });

      const initials = `${student.name ? student.name[0] : ''}${student.surname ? student.surname[0] : ''}`.toUpperCase();
      const avatarStyle = student.gender === 'female'
        ? 'background: rgba(236, 72, 153, 0.15); color: rgb(236, 72, 153); border: 1px solid rgba(236, 72, 153, 0.3);'
        : 'background: rgba(99, 102, 241, 0.15); color: var(--primary); border: 1px solid rgba(99, 102, 241, 0.3);';

      const avatarHtml = student.photo
        ? `<img src="${student.photo}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);">`
        : `<div style="width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; ${avatarStyle}">${initials}</div>`;

      html += `
        <div class="bulk-pt-student-row" data-id="${student.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.9rem; border-radius: var(--radius-md); background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); margin-bottom: 0.45rem; transition: all 0.15s ease;">
          <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0;">
            <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-muted); min-width: 28px; text-align: right;">${student.number || '-'}</span>
            ${avatarHtml}
            <div style="min-width: 0;">
              <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${student.name} ${student.surname}
              </div>
              <div style="font-size: 0.76rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.1rem;">
                <span>Mevcut:</span>
                <span style="color: #6366f1; font-weight: 700;">📚 ${currentBookPts} Puan</span>
              </div>
            </div>
          </div>

          <!-- Puan Giriş Kontrolleri -->
          <div style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 0.25rem;">
              <button type="button" class="btn-quick-step" data-id="${student.id}" data-delta="1" style="background: rgba(99, 102, 241, 0.12); color: var(--primary); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 6px; padding: 0.3rem 0.45rem; font-size: 0.76rem; font-weight: 700; cursor: pointer;">+1</button>
              <button type="button" class="btn-quick-step" data-id="${student.id}" data-delta="5" style="background: rgba(99, 102, 241, 0.12); color: var(--primary); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 6px; padding: 0.3rem 0.45rem; font-size: 0.76rem; font-weight: 700; cursor: pointer;">+5</button>
              <button type="button" class="btn-quick-step" data-id="${student.id}" data-delta="10" style="background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 6px; padding: 0.3rem 0.45rem; font-size: 0.76rem; font-weight: 700; cursor: pointer;">+10</button>
            </div>
            <div style="position: relative; width: 72px;">
              <input type="number" 
                class="form-control bulk-student-input" 
                data-id="${student.id}" 
                value="${pts}" 
                placeholder="0" 
                style="text-align: center; font-weight: 700; font-size: 0.95rem; height: 36px; padding: 0.2rem; border-radius: 8px; border: 1.5px solid ${pts !== '' && pts !== 0 ? 'var(--primary)' : 'var(--border-color)'}; background: ${pts !== '' && pts !== 0 ? 'rgba(99, 102, 241, 0.08)' : 'transparent'};">
            </div>
          </div>
        </div>
      `;
    });

    studentsListContainer.innerHTML = html;

    // Dinamik input ve buton eventleri
    studentsListContainer.querySelectorAll('.bulk-student-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const sId = e.target.getAttribute('data-id');
        const raw = e.target.value.trim();
        if (raw === '') {
          delete studentPoints[sId];
          e.target.style.borderColor = 'var(--border-color)';
          e.target.style.background = 'transparent';
        } else {
          const num = parseInt(raw, 10) || 0;
          studentPoints[sId] = num;
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.background = 'rgba(99, 102, 241, 0.08)';
        }
        updateSummary();
      });
    });

    studentsListContainer.querySelectorAll('.btn-quick-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const sId = btn.getAttribute('data-id');
        const delta = parseInt(btn.getAttribute('data-delta'), 10) || 0;
        const current = studentPoints[sId] !== undefined ? studentPoints[sId] : 0;
        const next = current + delta;
        studentPoints[sId] = next;

        const rowInput = studentsListContainer.querySelector(`.bulk-student-input[data-id="${sId}"]`);
        if (rowInput) {
          rowInput.value = next;
          rowInput.style.borderColor = 'var(--primary)';
          rowInput.style.background = 'rgba(99, 102, 241, 0.08)';
        }
        updateSummary();
      });
    });
  }

  function updateSummary() {
    if (!summaryText) return;
    const count = Object.values(studentPoints).filter(v => v !== 0 && v !== undefined && !isNaN(v)).length;
    if (count === 0) {
      summaryText.innerHTML = '<span style="color: var(--text-muted);">Henüz puan girilmedi</span>';
      if (btnSave) btnSave.disabled = true;
    } else {
      summaryText.innerHTML = `<strong style="color: var(--primary);">${count}</strong> öğrenciye kitap puanı girildi`;
      if (btnSave) btnSave.disabled = false;
    }
  }

  function saveBulkPoints() {
    const entries = Object.entries(studentPoints).filter(([id, val]) => val !== 0 && val !== undefined && !isNaN(val));
    if (entries.length === 0) {
      if (window.showToast) window.showToast('Lütfen en az bir öğrenci için puan girin!', 'warning');
      return;
    }

    const state = stateManager.loadState();
    const activeWeekId = stateManager.getSelectedWeek ? stateManager.getSelectedWeek() : window.getISOWeek();

    let savedCount = 0;
    entries.forEach(([studentId, point]) => {
      const student = (state.students || []).find(s => s.id === studentId);
      if (!student) return;

      const pt = parseInt(point, 10);
      stateManager.addPerformance(
        studentId,
        pt >= 0 ? 'positive' : 'development',
        pt,
        'Kitap Okuma Puanı', // 'kitap' içerdiği için doğrudan bookPoints kategorisine dahil olur
        activeWeekId
      );
      savedCount++;
    });

    playSuccessSound();

    if (window.showToast) {
      window.showToast(`${savedCount} öğrencinin kitap okuma puanı başarıyla kaydedildi! 📚`, 'success');
    }

    // Ekranı ve tabloları anında yenile
    const ev = new CustomEvent('stateChanged');
    document.dispatchEvent(ev);

    if (modal) modal.classList.remove('active');
  }

  // DOM hazır olduğunda başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initElements);
  } else {
    initElements();
  }
})();
