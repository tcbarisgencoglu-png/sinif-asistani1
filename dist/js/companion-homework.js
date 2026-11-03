/**
 * Sınıf Asistanı — El Terminali: Günlük Ödev Kontrol Modülü (companion-homework.js)
 * Masaüstündeki haftalık karmaşa yerine pratik GÜNLÜK GÖRÜNÜM,
 * Oklarla gün değiştirme, takvim seçici ve masaüstüne canlı aktarım.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'sinif_asistani_data';

  const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const CompanionHomework = {
    currentDate: '',       // 'YYYY-MM-DD'
    currentTitle: '',      // Ödev konusu / başlığı
    students: [],          // Aktif şubedeki öğrenciler
    statusMap: {},         // { [studentId]: 'completed' | 'incomplete' | 'missing' | 'excused' | 'none' }

    getData() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return { students: [], homeworks: [], performance: [] };
    },

    saveData(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Ödev verisi kaydetme hatası:', e);
      }
    },

    getActiveSection() {
      if (window.Companion && window.Companion.activeSection) {
        return window.Companion.activeSection;
      }
      const data = this.getData();
      const students = Array.isArray(data.students) ? data.students : [];
      if (students.length > 0 && students[0].branch) {
        return students[0].branch;
      }
      return '5-A';
    },

    // Modülü Başlat (Sayfa açıldığında veya Şube değiştiğinde)
    init() {
      if (window.CompanionBehavior && typeof window.CompanionBehavior.getActiveStudents === 'function') {
        this.students = window.CompanionBehavior.getActiveStudents();
      } else {
        const data = this.getData();
        this.students = Array.isArray(data.students) ? data.students : [];
      }

      if (!this.currentDate) {
        this.currentDate = this.getTodayDateString();
      }

      this.loadHomeworkForDate(this.currentDate);
      this.updateSubtitle();
    },

    getTodayDateString() {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },

    updateSubtitle() {
      const sub = document.getElementById('homework-view-subtitle');
      if (sub) {
        sub.textContent = `${this.getActiveSection()} Şubesi • ${this.students.length} Öğrenci`;
      }
    },

    // Bugüne Hızlıca Dön
    goToToday() {
      const today = this.getTodayDateString();
      if (this.currentDate !== today) {
        this.currentDate = today;
        this.loadHomeworkForDate(today);
        if (window.Companion) {
          window.Companion.vibrate(15);
          window.Companion.showToast('📅 Bugüne geçildi.');
        }
      }
    },

    // Oklarla Gün Değiştir (-1 veya +1 gün)
    changeDay(delta) {
      if (!this.currentDate) this.currentDate = this.getTodayDateString();
      const parts = this.currentDate.split('-').map(Number);
      const cur = new Date(parts[0], parts[1] - 1, parts[2]);
      cur.setDate(cur.getDate() + delta);

      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const nextDateStr = `${y}-${m}-${d}`;

      this.currentDate = nextDateStr;
      this.loadHomeworkForDate(nextDateStr);
      if (window.Companion) window.Companion.vibrate(10);
    },

    // Takvimden Tarih Seçildiğinde
    onDatePicked(dateStr) {
      if (!dateStr) return;
      this.currentDate = dateStr;
      this.loadHomeworkForDate(dateStr);
    },

    onTitleChanged(newTitle) {
      this.currentTitle = (newTitle || '').trim();
    },

    // Tarihe Ait Ödev Verisini ve Başlığını Bellekten Yükle
    loadHomeworkForDate(dateStr) {
      this.currentDate = dateStr;
      const activeSection = this.getActiveSection();

      // Tarih göstergelerini güncelle
      this.renderDateDisplay(dateStr);

      const data = this.getData();
      const hwList = Array.isArray(data.homeworks) ? data.homeworks : (Array.isArray(data.homework) ? data.homework : []);

      // İlgili tarih ve şubeye ait ödev var mı?
      const existingHw = hwList.find(h => {
        const matchDate = h.dueDate === dateStr;
        const matchBranch = !activeSection || !h.branch || h.branch === activeSection || h.branch === 'all';
        return matchDate && matchBranch;
      });

      this.statusMap = {};
      if (existingHw) {
        this.currentTitle = existingHw.title || '';
        if (existingHw.status && typeof existingHw.status === 'object') {
          for (const sId in existingHw.status) {
            this.statusMap[String(sId)] = existingHw.status[sId];
          }
        }
      } else {
        // Varsayılan başlık
        const parts = dateStr.split('-').map(Number);
        const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const formatted = `${dObj.getDate()} ${MONTH_NAMES[dObj.getMonth()]} Ödevi`;
        this.currentTitle = formatted;
      }

      const titleInput = document.getElementById('hw-title-input');
      if (titleInput) {
        titleInput.value = this.currentTitle;
      }

      this.renderStudentList();
      this.updateStats();
    },

    renderDateDisplay(dateStr) {
      const parts = dateStr.split('-').map(Number);
      const dObj = new Date(parts[0], parts[1] - 1, parts[2]);

      const dayNameEl = document.getElementById('hw-display-dayname');
      const dateLabelEl = document.getElementById('hw-display-formatted-date');
      const datePicker = document.getElementById('hw-date-picker');

      if (datePicker) datePicker.value = dateStr;
      if (dayNameEl) dayNameEl.textContent = DAY_NAMES[dObj.getDay()];
      if (dateLabelEl) {
        const isToday = dateStr === this.getTodayDateString();
        const formattedText = `${dObj.getDate()} ${MONTH_NAMES[dObj.getMonth()]} ${dObj.getFullYear()}`;
        dateLabelEl.textContent = isToday ? `Bugün (${formattedText})` : formattedText;
      }
    },

    renderStudentList() {
      const container = document.getElementById('hw-students-list');
      if (!container) return;

      if (this.students.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px 16px; background: rgba(255,255,255,0.08); border-radius: 16px; color: #ffffff;">
            <i data-lucide="users" style="width: 40px; height: 40px; margin: 0 auto 10px; color: #93c5fd;"></i>
            <h4 style="font-size: 15px; font-weight: 700;">Bu şubede öğrenci bulunamadı</h4>
            <p style="font-size: 12px; color: #93c5fd; margin-top: 4px;">Masaüstünden 'Tüm Sınıf & Verileri Eşitle' butonuna basarak öğrencileri yükleyebilirsiniz.</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const colors = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#6366f1'];

      container.innerHTML = this.students.map((s, idx) => {
        const sId = String(s.id);
        const currentStatus = this.statusMap[sId] || 'none';
        const initials = ((s.name ? s.name[0] : '') + (s.surname ? s.surname[0] : '')).toUpperCase() || '?';
        const color = s.gender === 'female' ? '#ec4899' : (s.gender === 'male' ? '#3b82f6' : colors[idx % colors.length]);

        const avatarHtml = s.photo
          ? `<img src="${s.photo}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1.5px solid #e2e8f0; flex-shrink: 0;" />`
          : `<div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, ${color}, #1e3a8a); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; border: 1.5px solid #ffffff; flex-shrink: 0;">${initials}</div>`;

        return `
          <div class="c-hw-student-card">
            <div class="c-hw-student-info">
              ${avatarHtml}
              <div style="overflow: hidden;">
                <div class="c-hw-student-name">${s.name} ${s.surname || ''}</div>
                <div class="c-hw-student-no">#${s.number || '-'}</div>
              </div>
            </div>

            <!-- 4'lü Durum Segmenti -->
            <div class="c-hw-status-segment">
              <button type="button" class="c-hw-choice-btn ${currentStatus === 'completed' ? 'active-completed' : ''}" 
                      onclick="window.CompanionHomework.setStatus('${s.id}', 'completed')" title="Tam / Yapıldı (+4)">
                ✓
              </button>
              <button type="button" class="c-hw-choice-btn ${currentStatus === 'incomplete' ? 'active-incomplete' : ''}" 
                      onclick="window.CompanionHomework.setStatus('${s.id}', 'incomplete')" title="Eksik / Yarım (+2)">
                ½
              </button>
              <button type="button" class="c-hw-choice-btn ${currentStatus === 'missing' ? 'active-missing' : ''}" 
                      onclick="window.CompanionHomework.setStatus('${s.id}', 'missing')" title="Yapılmadı (-4)">
                ✗
              </button>
              <button type="button" class="c-hw-choice-btn ${currentStatus === 'excused' ? 'active-excused' : ''}" 
                      onclick="window.CompanionHomework.setStatus('${s.id}', 'excused')" title="Muaf (0)">
                M
              </button>
            </div>
          </div>
        `;
      }).join('');
    },

    // Öğrenci Durumunu Belirle / Değiştir
    setStatus(studentId, newStatus) {
      const sId = String(studentId);
      const current = this.statusMap[sId] || 'none';

      // Eğer zaten o durum seçiliyse ve tekrar basıldıysa iptal et (none)
      if (current === newStatus) {
        this.statusMap[sId] = 'none';
      } else {
        this.statusMap[sId] = newStatus;
      }

      if (window.Companion) {
        const isGood = newStatus === 'completed' || newStatus === 'incomplete';
        window.Companion.vibrate(isGood ? 15 : 25);
      }

      this.renderStudentList();
      this.updateStats();
    },

    // Sınıfın Tamamına Toplu Durum Ata
    markAll(targetStatus) {
      this.students.forEach(s => {
        this.statusMap[String(s.id)] = targetStatus;
      });

      if (window.Companion) {
        window.Companion.vibrate(25);
        if (targetStatus === 'completed') {
          window.Companion.showToast('✅ Tüm öğrenciler "Tam" olarak işaretlendi.');
        } else {
          window.Companion.showToast('🔄 Ödev durumları sıfırlandı.');
        }
      }

      this.renderStudentList();
      this.updateStats();
    },

    updateStats() {
      let completed = 0;
      let incomplete = 0;
      let missing = 0;
      let excused = 0;

      this.students.forEach(s => {
        const st = this.statusMap[String(s.id)];
        if (st === 'completed') completed++;
        else if (st === 'incomplete') incomplete++;
        else if (st === 'missing') missing++;
        else if (st === 'excused') excused++;
      });

      const elComp = document.getElementById('hw-stat-completed');
      const elInc = document.getElementById('hw-stat-incomplete');
      const elMiss = document.getElementById('hw-stat-missing');
      const elExc = document.getElementById('hw-stat-excused');

      if (elComp) elComp.textContent = `Tam: ${completed}`;
      if (elInc) elInc.textContent = `Yarım: ${incomplete}`;
      if (elMiss) elMiss.textContent = `Yok: ${missing}`;
      if (elExc) elExc.textContent = `Muaf: ${excused}`;
    },

    // Ödevleri Kaydet, Performans Puanlarını Güncelle ve Masaüstüne Gönder
    saveAndSendToDesktop() {
      const activeSection = this.getActiveSection();
      const dateStr = this.currentDate || this.getTodayDateString();
      const titleInput = document.getElementById('hw-title-input');
      const title = (titleInput && titleInput.value.trim()) || this.currentTitle || `${dateStr} Ödevi`;

      const data = this.getData();
      if (!Array.isArray(data.homeworks)) data.homeworks = [];
      if (!Array.isArray(data.performance)) data.performance = [];

      // 1. Ödev Kaydını Bul veya Oluştur
      let hw = data.homeworks.find(h => {
        const matchDate = h.dueDate === dateStr;
        const matchBranch = !activeSection || !h.branch || h.branch === activeSection || h.branch === 'all';
        return matchDate && matchBranch;
      });

      if (!hw) {
        hw = {
          id: 'hw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          title: title,
          description: 'El terminalinden günlük kontrol',
          dueDate: dateStr,
          branch: activeSection,
          status: {},
          createdAt: new Date().toISOString()
        };
        data.homeworks.push(hw);
      } else {
        hw.title = title;
        if (!hw.status) hw.status = {};
      }

      // 2. Durumları ve Performans Kayıtlarını Güncelle
      const hwSettings = data.homeworkSettings || { completed: 4, incomplete: 2, missing: -4, excused: 0 };
      const timestamp = new Date().toISOString();
      const hwWeekId = (window.getISOWeek && dateStr) ? window.getISOWeek(dateStr) : '';

      for (const sId in this.statusMap) {
        const status = this.statusMap[sId];
        if (status === 'none') {
          delete hw.status[sId];
          data.performance = data.performance.filter(p => !(
            String(p.studentId) === sId &&
            (p.homeworkId === hw.id || p.reason === `"${title}" Ödevi (Tam)` || p.reason === `"${title}" Ödevi (Yarım)` || p.reason === `"${title}" Ödevi (Yapılmadı)` || p.reason === `"${title}" Ödevi (Muaf)`)
          ));
        } else {
          hw.status[sId] = status;

          // Performans kaydını güncelle (aynı ödev veya aynı başlıklı mükerrer kayıtları temizle)
          data.performance = data.performance.filter(p => !(
            String(p.studentId) === sId &&
            (p.homeworkId === hw.id || p.reason === `"${title}" Ödevi (Tam)` || p.reason === `"${title}" Ödevi (Yarım)` || p.reason === `"${title}" Ödevi (Yapılmadı)` || p.reason === `"${title}" Ödevi (Muaf)`)
          ));

          let pts = 0;
          let sLabel = '';
          if (status === 'completed') { pts = hwSettings.completed != null ? hwSettings.completed : 4; sLabel = 'Tam'; }
          else if (status === 'incomplete') { pts = hwSettings.incomplete != null ? hwSettings.incomplete : 2; sLabel = 'Yarım'; }
          else if (status === 'missing') { pts = hwSettings.missing != null ? hwSettings.missing : -4; sLabel = 'Yapılmadı'; }
          else if (status === 'excused') { pts = hwSettings.excused != null ? hwSettings.excused : 0; sLabel = 'Muaf'; }

          const student = this.students.find(s => String(s.id) === sId);
          const studentName = student ? `${student.name} ${student.surname || ''}`.trim() : 'Öğrenci';
          const studentNumber = student ? String(student.number || '').trim() : '';

          data.performance.push({
            id: 'perf_hw_' + hw.id + '_' + sId,
            studentId: sId,
            studentName: studentName,
            studentNumber: studentNumber,
            type: pts >= 0 ? 'positive' : 'development',
            point: pts,
            reason: `"${title}" Ödevi (${sLabel})`,
            date: dateStr || timestamp,
            weekId: hwWeekId || undefined,
            homeworkId: hw.id
          });
        }
      }

      data.homework = data.homeworks;
      this.saveData(data);

      // 3. CANLI BULUT ENTEGRASYONU: Masaüstüne anında ilet
      if (window.CloudSync && typeof window.CloudSync.pushLiveHomework === 'function') {
        window.CloudSync.pushLiveHomework(dateStr, activeSection, title, hw.status);
      }

      if (window.Companion) {
        window.Companion.vibrate([40, 30, 40]);
        window.Companion.showToast(`✅ ${activeSection} "${title}" ödevi kaydedildi ve masaüstüne gönderildi!`);
      }
    },

    // =========================================================================
    // YENİ ÖDEV TANIMLAMA & WHATSAPP PAYLAŞIM MODÜLÜ
    // =========================================================================

    getTomorrowDateString() {
      const now = new Date();
      now.setDate(now.getDate() + 1);
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },

    openCreateModal() {
      const modal = document.getElementById('companion-create-hw-modal');
      if (!modal) return;

      // Varsayılan olarak bir sonraki gün (Yarın) seçili gelir
      const tomorrowStr = this.getTomorrowDateString();
      const dateInput = document.getElementById('new-hw-due-date');
      if (dateInput) {
        dateInput.value = tomorrowStr;
      }
      this.updateCreateModalDateLabel(tomorrowStr);
      this.updateDateChipActive('tomorrow');

      // Alanları sıfırla
      const subjectInput = document.getElementById('new-hw-subject');
      if (subjectInput) subjectInput.value = '';

      const titleInput = document.getElementById('new-hw-title');
      if (titleInput) titleInput.value = '';

      const descInput = document.getElementById('new-hw-description');
      if (descInput) descInput.value = '';

      // Şube etiketi
      const branchPill = document.getElementById('new-hw-branch-pill');
      if (branchPill) {
        branchPill.textContent = `${this.getActiveSection()} Şubesi`;
      }

      // Konu çiplerini temizle
      const subChips = document.querySelectorAll('#new-hw-subject-chips .c-hw-sub-chip');
      subChips.forEach(c => c.classList.remove('active'));

      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('active'), 10);
      if (window.Companion) window.Companion.vibrate(15);
      if (window.lucide) window.lucide.createIcons();

      if (titleInput) {
        setTimeout(() => titleInput.focus(), 250);
      }
    },

    closeCreateModal() {
      const modal = document.getElementById('companion-create-hw-modal');
      if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
          modal.style.display = 'none';
        }, 200);
      }
    },

    updateCreateModalDateLabel(dateStr) {
      const summaryEl = document.getElementById('new-hw-date-summary');
      if (!summaryEl || !dateStr) return;

      const parts = dateStr.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const dayName = DAY_NAMES[d.getDay()] || '';
      const todayStr = this.getTodayDateString();
      const tomorrowStr = this.getTomorrowDateString();

      if (dateStr === tomorrowStr) {
        summaryEl.textContent = `Yarın (${dayName})`;
      } else if (dateStr === todayStr) {
        summaryEl.textContent = `Bugün (${dayName})`;
      } else {
        summaryEl.textContent = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} (${dayName})`;
      }
    },

    setQuickDate(type) {
      let targetDateStr = '';
      let chipId = '';

      if (type === 1) {
        targetDateStr = this.getTomorrowDateString();
        chipId = 'tomorrow';
      } else if (type === 2) {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        targetDateStr = `${y}-${m}-${day}`;
        chipId = 'dayafter';
      } else if (type === 'next_monday') {
        const d = new Date();
        const currentDay = d.getDay(); // 0: Pazar, 1: Pazartesi
        let diff = (1 + 7 - currentDay) % 7;
        if (diff === 0) diff = 7;
        d.setDate(d.getDate() + diff);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        targetDateStr = `${y}-${m}-${day}`;
        chipId = 'monday';
      }

      const dateInput = document.getElementById('new-hw-due-date');
      if (dateInput && targetDateStr) {
        dateInput.value = targetDateStr;
        this.updateCreateModalDateLabel(targetDateStr);
        this.updateDateChipActive(chipId);
        if (window.Companion) window.Companion.vibrate(10);
      }
    },

    updateDateChipActive(activeChip) {
      const chips = {
        tomorrow: document.getElementById('chip-date-tomorrow'),
        dayafter: document.getElementById('chip-date-dayafter'),
        monday: document.getElementById('chip-date-monday')
      };
      for (const key in chips) {
        if (chips[key]) {
          if (key === activeChip) chips[key].classList.add('active');
          else chips[key].classList.remove('active');
        }
      }
    },

    onNewHwDateChanged(dateVal) {
      if (!dateVal) return;
      this.updateCreateModalDateLabel(dateVal);

      const tomorrowStr = this.getTomorrowDateString();
      if (dateVal === tomorrowStr) {
        this.updateDateChipActive('tomorrow');
      } else {
        this.updateDateChipActive(null);
      }
    },

    selectSubject(subjName) {
      const subjectInput = document.getElementById('new-hw-subject');
      if (!subjectInput) return;

      const current = subjectInput.value.trim();
      const chips = document.querySelectorAll('#new-hw-subject-chips .c-hw-sub-chip');

      if (current === subjName) {
        subjectInput.value = '';
        chips.forEach(c => c.classList.remove('active'));
      } else {
        subjectInput.value = subjName;
        chips.forEach(c => {
          if (c.textContent.trim() === subjName) c.classList.add('active');
          else c.classList.remove('active');
        });
      }
      if (window.Companion) window.Companion.vibrate(10);
    },

    saveNewHomework(shareWhatsApp = false) {
      const activeSection = this.getActiveSection();
      const dateInput = document.getElementById('new-hw-due-date');
      const subjectInput = document.getElementById('new-hw-subject');
      const titleInput = document.getElementById('new-hw-title');
      const descInput = document.getElementById('new-hw-description');

      const dueDate = (dateInput && dateInput.value) || this.getTomorrowDateString();
      const subject = (subjectInput && subjectInput.value.trim()) || '';
      const rawTitle = (titleInput && titleInput.value.trim()) || '';
      const description = (descInput && descInput.value.trim()) || '';

      if (!rawTitle) {
        if (window.Companion) {
          window.Companion.vibrate([40, 40]);
          window.Companion.showToast('⚠️ Lütfen ödev konusunu veya görevini yazın.');
        } else {
          alert('Lütfen ödev konusunu veya görevini yazın.');
        }
        if (titleInput) titleInput.focus();
        return;
      }

      // Başlığı derle
      let fullTitle = rawTitle;
      if (subject && !rawTitle.toLowerCase().includes(subject.toLowerCase())) {
        fullTitle = `${subject}: ${rawTitle}`;
      }

      const data = this.getData();
      if (!Array.isArray(data.homeworks)) data.homeworks = [];
      if (!Array.isArray(data.performance)) data.performance = [];

      // İlgili tarih ve şubede mevcut bir ödev var mı?
      let hw = data.homeworks.find(h => {
        const matchDate = h.dueDate === dueDate;
        const matchBranch = !activeSection || !h.branch || h.branch === activeSection || h.branch === 'all';
        return matchDate && matchBranch;
      });

      if (!hw) {
        hw = {
          id: 'hw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          title: fullTitle,
          description: description,
          dueDate: dueDate,
          branch: activeSection,
          status: {},
          createdAt: new Date().toISOString()
        };
        data.homeworks.push(hw);
      } else {
        hw.title = fullTitle;
        if (description) hw.description = description;
        if (!hw.status) hw.status = {};
      }

      data.homework = data.homeworks;
      this.saveData(data);

      // 1. Masaüstüne Canlı Olarak İlet
      if (window.CloudSync && typeof window.CloudSync.pushLiveHomework === 'function') {
        window.CloudSync.pushLiveHomework(dueDate, activeSection, fullTitle, hw.status);
      }

      // 2. WhatsApp Paylaşımı İstenmişse
      if (shareWhatsApp) {
        this.shareHomeworkViaWhatsApp({
          branch: activeSection,
          dueDate: dueDate,
          subject: subject,
          title: rawTitle,
          fullTitle: fullTitle,
          description: description
        });
      }

      // 3. Modalı Kapat
      this.closeCreateModal();

      // 4. Günlük Ödev Görünümünü Yeni Ödevin Tarihine Ayarla ve Yükle
      this.loadHomeworkForDate(dueDate);

      if (window.Companion) {
        window.Companion.vibrate([40, 30, 40]);
        if (shareWhatsApp) {
          window.Companion.showToast(`✅ "${fullTitle}" kaydedildi ve WhatsApp paylaşımı başlatıldı.`);
        } else {
          window.Companion.showToast(`✅ "${fullTitle}" başarıyla kaydedildi.`);
        }
      }
    },

    shareHomeworkViaWhatsApp(hwData) {
      if (!hwData || !hwData.dueDate) return;

      const parts = hwData.dueDate.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const dayName = DAY_NAMES[d.getDay()] || '';
      const monthName = MONTH_NAMES[d.getMonth()] || '';
      const dueFormatted = `${d.getDate()} ${monthName} ${d.getFullYear()} (${dayName})`;

      let msg = `📚 *ÖDEV BİLGİLENDİRMESİ*\n\n`;
      if (hwData.branch) {
        msg += `🏫 *Sınıf / Şube:* ${hwData.branch}\n`;
      }
      msg += `📅 *Teslim Tarihi:* ${dueFormatted}\n`;
      if (hwData.subject) {
        msg += `📖 *Ders:* ${hwData.subject}\n`;
      }
      msg += `📝 *Ödev:* ${hwData.title || hwData.fullTitle}\n`;
      if (hwData.description && hwData.description.trim()) {
        msg += `ℹ️ *Açıklama:* ${hwData.description.trim()}\n`;
      }
      msg += `\nSayın Velilerimiz, öğrencimizin ödevini zamanında tamamlamasını ve kontrol etmenizi rica ederiz.\n\n`;
      msg += `_Sınıf Asistanı ile oluşturuldu_`;

      const encoded = encodeURIComponent(msg);
      const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;

      try {
        if (window.AndroidBridge && typeof window.AndroidBridge.shareData === 'function') {
          window.AndroidBridge.shareData(msg, 'Ödev Bildirimi', 'text/plain');
        } else {
          window.location.href = waUrl;
        }
      } catch (e) {
        try {
          window.open(waUrl, '_blank');
        } catch (err) {
          console.error('WhatsApp açma hatası:', err);
        }
      }
    },

    shareCurrentHomeworkWhatsApp() {
      const dateStr = this.currentDate || this.getTodayDateString();
      const activeSection = this.getActiveSection();
      const data = this.getData();
      const hwList = Array.isArray(data.homeworks) ? data.homeworks : [];

      const hw = hwList.find(h => {
        const matchDate = h.dueDate === dateStr;
        const matchBranch = !activeSection || !h.branch || h.branch === activeSection || h.branch === 'all';
        return matchDate && matchBranch;
      });

      const titleInput = document.getElementById('hw-title-input');
      const currentTitle = (titleInput && titleInput.value.trim()) || (hw && hw.title) || this.currentTitle || '';
      const description = (hw && hw.description) || '';

      if (!currentTitle) {
        if (window.Companion) window.Companion.showToast('⚠️ Paylaşılacak ödev başlığı bulunamadı.');
        return;
      }

      this.shareHomeworkViaWhatsApp({
        branch: activeSection,
        dueDate: dateStr,
        fullTitle: currentTitle,
        description: description
      });

      if (window.Companion) {
        window.Companion.vibrate(20);
        window.Companion.showToast('📲 WhatsApp paylaşımı açılıyor...');
      }
    }
  };

  window.CompanionHomework = CompanionHomework;

})(window);
