/**
 * Sınıf Asistanı — El Terminali: Ders & Planlama Modülü (companion-schedule.js)
 * Masaüstündeki canlı ders akışını, ders saatlerini ve yıllık plan konularını
 * el terminalinde akıcı ve pratik bir şekilde gösterir.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'sinif_asistani_data';

  const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const DEFAULT_TIMES = {
    p1: { start: '09:00', end: '09:40' },
    p2: { start: '09:50', end: '10:30' },
    p3: { start: '10:40', end: '11:20' },
    p4: { start: '11:30', end: '12:10' },
    lunch: { start: '12:10', end: '13:00' },
    p5: { start: '13:00', end: '13:40' },
    p6: { start: '13:50', end: '14:30' },
    p7: { start: '14:40', end: '15:20' }
  };

  const DEFAULT_LESSONS = [
    { id: 'l_tur', name: 'Türkçe', color: '#ef4444' },
    { id: 'l_mat', name: 'Matematik', color: '#3b82f6' },
    { id: 'l_hay', name: 'Hayat Bilgisi', color: '#10b981' },
    { id: 'l_fen', name: 'Fen Bilimleri', color: '#22c55e' },
    { id: 'l_sos', name: 'Sosyal Bilgiler', color: '#f97316' },
    { id: 'l_ing', name: 'İngilizce', color: '#8b5cf6' },
    { id: 'l_bed', name: 'Beden Eğitimi', color: '#14b8a6' },
    { id: 'l_muz', name: 'Müzik', color: '#ec4899' },
    { id: 'l_gor', name: 'Görsel Sanatlar', color: '#eab308' },
    { id: 'l_din', name: 'Din Kültürü', color: '#06b6d4' }
  ];

  const CompanionSchedule = {
    selectedDay: 1,        // 1: Pzt, 2: Sal, 3: Çar, 4: Per, 5: Cum
    refreshTimer: null,

    getData() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return {};
    },

    init() {
      // Bugünün gününü belirle (Hafta sonu ise Pazartesi'ye ayarla)
      const now = new Date();
      const currentDay = now.getDay();
      if (currentDay >= 1 && currentDay <= 5) {
        this.selectedDay = currentDay;
      } else {
        this.selectedDay = 1;
      }

      this.renderDayTabs();
      this.refreshLiveStatus();

      // Periyodik tazeleyici (30 saniyede bir saati ve canlı durumu kontrol et)
      if (this.refreshTimer) clearInterval(this.refreshTimer);
      this.refreshTimer = setInterval(() => {
        const view = document.getElementById('view-schedule-plan');
        if (view && view.style.display !== 'none') {
          this.refreshLiveStatus();
        }
      }, 30000);
    },

    // -------------------------------------------------------------------------
    // DERS VE PLAN VERİLERİNİ ÇEKME YARDIMCILARI
    // -------------------------------------------------------------------------
    getTimes() {
      const data = this.getData();
      return (data && data.scheduleTimes && Object.keys(data.scheduleTimes).length > 0)
        ? data.scheduleTimes
        : DEFAULT_TIMES;
    },

    getGrid() {
      const data = this.getData();
      return (data && data.scheduleGrid && typeof data.scheduleGrid === 'object')
        ? data.scheduleGrid
        : {};
    },

    getLessons() {
      const data = this.getData();
      const list = (data && Array.isArray(data.definedLessons) && data.definedLessons.length > 0)
        ? data.definedLessons
        : DEFAULT_LESSONS;
      return list;
    },

    getPlans() {
      const data = this.getData();
      return (data && Array.isArray(data.plans)) ? data.plans : [];
    },

    // Okul Seviyesi Kontrolü (İlkokul: 6 Ders, Ortaokul: 7 Ders)
    isMiddleSchool() {
      const data = this.getData();
      if (data && data.educationLevel === 'primary') return false;
      if (data && data.educationLevel === 'middle') return true;

      // El terminali profilinde seçili rol kontrolü
      try {
        const profRaw = localStorage.getItem('sinif_companion_profile');
        if (profRaw) {
          const prof = JSON.parse(profRaw);
          if (prof.teacherRole === 'primary' || prof.isClassTeacher) return false;
          if (prof.teacherRole === 'middle') return true;
        }
      } catch (e) {}

      if (window.Companion && typeof window.Companion.isClassTeacher === 'function') {
        if (window.Companion.isClassTeacher()) return false;
      }

      // Şube adlarına bakarak kontrol et (5, 6, 7, 8 şubesi yoksa ilkokul kabul edilir)
      const students = (data && data.students) || [];
      const hasMiddleBranch = students.some(s => s.branch && ['5', '6', '7', '8'].includes(String(s.branch).trim()[0]));
      return hasMiddleBranch;
    },

    getPeriodKeys(times) {
      const isMiddle = this.isMiddleSchool();
      const baseKeys = isMiddle
        ? ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']
        : ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
      return baseKeys.filter(k => times && times[k] && times[k].start && times[k].end);
    },

    // Ders Adı ile Yıllık Plan Eşleştirici
    isLessonPlanMatch(planCourseName, lessonName) {
      if (!planCourseName || !lessonName) return false;
      const pNorm = planCourseName.trim().toLowerCase();
      const lNorm = lessonName.trim().toLowerCase();
      if (pNorm === lNorm) return true;
      if (pNorm.includes(lNorm) || lNorm.includes(pNorm)) return true;

      const aliases = [
        ['mat', 'matematik'],
        ['türk', 'türkçe', 'turkce'],
        ['fen', 'fen bilimleri'],
        ['sos', 'sosyal bilgiler'],
        ['ing', 'ingilizce'],
        ['din', 'din kültürü'],
        ['bed', 'beden eğitimi'],
        ['müz', 'müzik'],
        ['gör', 'görsel sanatlar'],
        ['hay', 'hayat bilgisi'],
        ['bil', 'bilişim']
      ];

      for (const group of aliases) {
        const pMatch = group.some(alias => pNorm.includes(alias));
        const lMatch = group.some(alias => lNorm.includes(alias));
        if (pMatch && lMatch) return true;
      }
      return false;
    },

    // Aktif Akademik Hafta Bilgisini Hesapla (1..40)
    getActiveWeekIndex(weeklySchedule) {
      if (!Array.isArray(weeklySchedule) || weeklySchedule.length === 0) return 0;

      const now = new Date();
      const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // 1. Tarih Aralığı Kontrolü (Örn: "02.11.2026 - 06.11.2026")
      for (let i = 0; i < weeklySchedule.length; i++) {
        const w = weeklySchedule[i];
        if (w.startDate && w.endDate && todayIso >= w.startDate && todayIso <= w.endDate) {
          return i;
        }
        if (w.dateRange && typeof w.dateRange === 'string') {
          const parts = w.dateRange.split('-').map(s => s.trim());
          if (parts.length === 2) {
            const startParts = parts[0].split('.').map(Number);
            const endParts = parts[1].split('.').map(Number);
            if (startParts.length === 3 && endParts.length === 3) {
              const startD = new Date(startParts[2], startParts[1] - 1, startParts[0]);
              const endD = new Date(endParts[2], endParts[1] - 1, endParts[0], 23, 59, 59);
              if (now >= startD && now <= endD) return i;
            }
          }
        }
      }

      // 2. Eylül Başlangıcına Göre Tahmin
      const year = (now.getMonth() >= 8) ? now.getFullYear() : (now.getFullYear() - 1);
      const schoolOpening = new Date(year, 8, 14); // Yaklaşık 14 Eylül
      const diffMs = now - schoolOpening;
      if (diffMs > 0) {
        const weekNum = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
        if (weekNum >= 0 && weekNum < weeklySchedule.length) {
          return weekNum;
        }
      }

      return 0;
    },

    extractTopic(weekObj) {
      if (!weekObj) return 'Konu bilgisi girilmemiş.';
      return (
        weekObj.topic ||
        weekObj.konu ||
        weekObj.subject ||
        weekObj.content ||
        weekObj.learningOutcomes ||
        weekObj.outcomes ||
        'Konu bilgisi girilmemiş.'
      );
    },

    // -------------------------------------------------------------------------
    // CANLI DERS HESAPLAYICI (LIVE ENGINE)
    // -------------------------------------------------------------------------
    getCurrentLiveStatus() {
      const now = new Date();
      const currentDay = now.getDay(); // 0: Pazar, 1..5: Pzt..Cum, 6: Cmt
      const curMin = now.getHours() * 60 + now.getMinutes();

      const times = this.getTimes();
      const grid = this.getGrid();
      const lessons = this.getLessons();
      const plans = this.getPlans();

      const parseTime = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };

      // Hafta sonu kontrolü
      if (currentDay === 0 || currentDay === 6) {
        return {
          statusType: 'weekend',
          badgeText: 'Hafta Sonu Tatili 🏖️',
          periodNum: 'Hafta Sonu',
          title: 'Dinlenme Zamanı',
          subtitle: 'Aşağıdan haftalık ders programınızı ve konularınızı inceleyebilirsiniz.',
          topic: 'Ders saatleri dışındasınız.',
          color: '#6366f1'
        };
      }

      const pKeys = this.getPeriodKeys(times);

      // 1. Aktif Ders Saati Kontrolü
      for (let i = 0; i < pKeys.length; i++) {
        const pk = pKeys[i];
        const sMin = parseTime(times[pk].start);
        const eMin = parseTime(times[pk].end);

        if (curMin >= sMin && curMin <= eMin) {
          const pNum = pk.replace('p', '');
          const gridKey = `${currentDay}-${pk}`;
          const lessonId = grid[gridKey] || '';
          const lesson = lessons.find(l => l.id === lessonId);
          const lessonName = lesson ? lesson.name : 'Boş Ders Saati';
          const lessonColor = (lesson && lesson.color) ? lesson.color : '#64748b';

          const totalDuration = Math.max(1, eMin - sMin);
          const remainingMinutes = Math.max(0, eMin - curMin);
          const elapsed = totalDuration - remainingMinutes;
          const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

          // Yıllık Plan Eşleştirme
          let topic = 'Bu ders için yıllık plan yüklenmemiş.';
          let unit = '';
          let outcomes = '';
          let activeWeekNum = null;

          if (lesson) {
            const matchedPlan = plans.find(p => this.isLessonPlanMatch(p.courseName || p.title, lesson.name));
            if (matchedPlan) {
              const schedule = matchedPlan.weeklySchedule || matchedPlan.weeks || [];
              const weekIdx = this.getActiveWeekIndex(schedule);
              const weekObj = schedule[weekIdx];
              if (weekObj) {
                topic = this.extractTopic(weekObj);
                unit = weekObj.unit || weekObj.unitName || weekObj.learningArea || '';
                outcomes = weekObj.outcomes || weekObj.learningOutcomes || '';
                activeWeekNum = weekIdx + 1;
              }
            }
          }

          return {
            statusType: 'lesson',
            badgeText: 'CANLI DERS 🔴',
            periodKey: pk,
            periodNum: `${pNum}. Ders`,
            startTime: times[pk].start,
            endTime: times[pk].end,
            remainingMinutes,
            remainingText: remainingMinutes === 0 ? '< 1 dk kaldı' : `${remainingMinutes} dk kaldı`,
            progressPercent,
            lessonName,
            lessonColor,
            unit,
            topic,
            outcomes,
            activeWeekNum
          };
        }
      }

      // 2. Öğle Arası Kontrolü
      const lunchData = times['lunch'];
      if (lunchData && lunchData.start && lunchData.end) {
        const lStart = parseTime(lunchData.start);
        const lEnd = parseTime(lunchData.end);
        if (curMin >= lStart && curMin <= lEnd) {
          const remainingMinutes = Math.max(0, lEnd - curMin);
          return {
            statusType: 'lunch',
            badgeText: 'ÖĞLE ARASI 🍽️',
            periodNum: 'Öğle Molası',
            startTime: lunchData.start,
            endTime: lunchData.end,
            remainingMinutes,
            remainingText: `${remainingMinutes} dk kaldı`,
            lessonName: 'Öğle Yemeği & Dinlenme',
            lessonColor: '#10b981',
            topic: 'Yemek ve dinlenme vakti. Bir sonraki ders için hazırlık yapabilirsiniz.'
          };
        }
      }

      // 3. Teneffüs Kontrolü
      for (let i = 0; i < pKeys.length - 1; i++) {
        const curPk = pKeys[i];
        const nextPk = pKeys[i + 1];
        const curEnd = parseTime(times[curPk].end);
        const nextStart = parseTime(times[nextPk].start);

        if (curMin > curEnd && curMin < nextStart) {
          const remainingMinutes = Math.max(0, nextStart - curMin);
          const nextPNum = nextPk.replace('p', '');
          const nextGridKey = `${currentDay}-${nextPk}`;
          const nextLessonId = grid[nextGridKey] || '';
          const nextLesson = lessons.find(l => l.id === nextLessonId);
          const nextLessonName = nextLesson ? nextLesson.name : 'Boş Ders';
          const nextLessonColor = nextLesson ? nextLesson.color : '#3b82f6';

          let nextTopic = '';
          if (nextLesson) {
            const matchedPlan = plans.find(p => this.isLessonPlanMatch(p.courseName || p.title, nextLesson.name));
            if (matchedPlan) {
              const schedule = matchedPlan.weeklySchedule || matchedPlan.weeks || [];
              const weekIdx = this.getActiveWeekIndex(schedule);
              const weekObj = schedule[weekIdx];
              if (weekObj) nextTopic = this.extractTopic(weekObj);
            }
          }

          return {
            statusType: 'break',
            badgeText: 'TENEFFÜS 🔔',
            periodNum: `Teneffüs (${nextPNum}. Ders Öncesi)`,
            remainingMinutes,
            remainingText: `${remainingMinutes} dk kaldı`,
            nextPNum,
            nextLessonName,
            nextLessonColor,
            nextTopic: nextTopic ? `Sıradaki Konu: ${nextTopic}` : 'Sıradaki ders yaklaşıyor.'
          };
        }
      }

      // 4. Ders Saatleri Dışı
      return {
        statusType: 'outside',
        badgeText: 'DERS SAATLERİ DIŞI 🌙',
        periodNum: 'Serbest Zaman',
        lessonName: 'Okul Saatleri Dışı',
        lessonColor: '#64748b',
        topic: 'Şu an ders saatleri dışındasınız. Aşağıdaki haftalık programdan günleri seçerek ders konularını önizleyebilirsiniz.'
      };
    },

    // -------------------------------------------------------------------------
    // ARAYÜZ OLUŞTURUCULAR (RENDERERS)
    // -------------------------------------------------------------------------

    refreshLiveStatus() {
      this.renderLiveCard();
      this.renderDailyLessonsList(this.selectedDay);
      if (window.lucide) window.lucide.createIcons();
    },

    renderLiveCard() {
      const container = document.getElementById('sch-live-card-container');
      if (!container) return;

      const live = this.getCurrentLiveStatus();

      // CANLI DERS DURUMU
      if (live.statusType === 'lesson') {
        container.innerHTML = `
          <div class="c-sch-live-card lesson" style="border-left: 5px solid ${live.lessonColor};">
            <div class="c-sch-live-top-row">
              <span class="c-sch-live-pill live">
                <span class="c-sch-live-dot"></span>
                <span>${live.badgeText}</span>
              </span>
              <span class="c-sch-live-time-badge">
                <i data-lucide="clock" style="width: 13px; height: 13px;"></i>
                <span>${live.periodNum} • ${live.startTime} - ${live.endTime}</span>
              </span>
            </div>

            <!-- Ders Adı ve Kalan Süre -->
            <div style="display: flex; align-items: flex-end; justify-content: space-between; margin: 10px 0 8px;">
              <div>
                <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Şu Anki Ders</span>
                <h3 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.2;">${live.lessonName}</h3>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 12px; font-weight: 800; color: #4f46e5; background: #eef2ff; padding: 4px 9px; border-radius: 8px;">
                  ⏳ ${live.remainingText}
                </span>
              </div>
            </div>

            <!-- İlerleme Çubuğu -->
            <div class="c-sch-progress-track">
              <div class="c-sch-progress-fill" style="width: ${live.progressPercent}%; background: ${live.lessonColor};"></div>
            </div>

            <!-- Müfredat Konusu & Ünite -->
            <div class="c-sch-plan-box" style="margin-top: 12px;">
              ${live.unit ? `
                <div style="font-size: 11px; font-weight: 700; color: #6366f1; margin-bottom: 3px; display: flex; align-items: center; gap: 4px;">
                  <i data-lucide="folder" style="width: 12px; height: 12px;"></i>
                  <span>${live.unit}</span>
                </div>
              ` : ''}
              <div style="font-size: 13px; font-weight: 800; color: #1e293b; line-height: 1.4;">
                📖 ${live.topic}
              </div>
              ${live.outcomes ? `
                <div style="font-size: 11.5px; color: #475569; margin-top: 4px; line-height: 1.35;">
                  🎯 <strong>Kazanım:</strong> ${live.outcomes}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }

      // TENEFFÜS DURUMU
      else if (live.statusType === 'break') {
        container.innerHTML = `
          <div class="c-sch-live-card break">
            <div class="c-sch-live-top-row">
              <span class="c-sch-live-pill break">
                <i data-lucide="bell" style="width: 13px; height: 13px;"></i>
                <span>${live.badgeText}</span>
              </span>
              <span class="c-sch-live-time-badge" style="background: #e0f2fe; color: #0284c7;">
                ⏳ ${live.remainingText}
              </span>
            </div>

            <div style="margin: 10px 0 6px;">
              <span style="font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase;">Sıradaki Ders (${live.nextPNum}. Ders)</span>
              <h3 style="font-size: 20px; font-weight: 900; color: #0f172a; margin: 2px 0 4px;">${live.nextLessonName}</h3>
              <p style="font-size: 12.5px; color: #334155; margin: 0; line-height: 1.4;">
                ${live.nextTopic}
              </p>
            </div>
          </div>
        `;
      }

      // ÖĞLE ARASI
      else if (live.statusType === 'lunch') {
        container.innerHTML = `
          <div class="c-sch-live-card lunch">
            <div class="c-sch-live-top-row">
              <span class="c-sch-live-pill lunch">
                <i data-lucide="utensils" style="width: 13px; height: 13px;"></i>
                <span>${live.badgeText}</span>
              </span>
              <span class="c-sch-live-time-badge" style="background: #ecfdf5; color: #059669;">
                ${live.startTime} - ${live.endTime} • ⏳ ${live.remainingText}
              </span>
            </div>

            <div style="margin: 10px 0 4px;">
              <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 4px;">${live.lessonName}</h3>
              <p style="font-size: 12px; color: #475569; margin: 0;">${live.topic}</p>
            </div>
          </div>
        `;
      }

      // DERS DIŞI / HAFTA SONU
      else {
        container.innerHTML = `
          <div class="c-sch-live-card outside">
            <div class="c-sch-live-top-row">
              <span class="c-sch-live-pill outside">
                <i data-lucide="moon" style="width: 13px; height: 13px;"></i>
                <span>${live.badgeText}</span>
              </span>
              <span class="c-sch-live-time-badge">
                ${DAY_NAMES[new Date().getDay()]}
              </span>
            </div>

            <div style="margin: 8px 0 2px;">
              <h4 style="font-size: 15px; font-weight: 800; color: #1e293b; margin: 0 0 3px;">${live.periodNum}</h4>
              <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.4;">${live.topic}</p>
            </div>
          </div>
        `;
      }
    },

    // Gün Seçici Butonları (Pazartesi .. Cuma)
    renderDayTabs() {
      const container = document.getElementById('sch-day-tabs');
      if (!container) return;

      const days = [
        { num: 1, label: 'Pzt', full: 'Pazartesi' },
        { num: 2, label: 'Salı', full: 'Salı' },
        { num: 3, label: 'Çar', full: 'Çarşamba' },
        { num: 4, label: 'Per', full: 'Perşembe' },
        { num: 5, label: 'Cum', full: 'Cuma' }
      ];

      const todayNum = new Date().getDay();

      container.innerHTML = days.map(d => {
        const isSelected = this.selectedDay === d.num;
        const isToday = todayNum === d.num;

        return `
          <button type="button" class="c-sch-day-btn ${isSelected ? 'active' : ''} ${isToday ? 'is-today' : ''}" 
                  onclick="window.CompanionSchedule.selectDay(${d.num})">
            <span class="c-sch-day-label">${d.label}</span>
            ${isToday ? '<span class="c-sch-today-dot" title="Bugün"></span>' : ''}
          </button>
        `;
      }).join('');
    },

    selectDay(dayNum) {
      this.selectedDay = dayNum;
      this.renderDayTabs();
      this.renderDailyLessonsList(dayNum);
      if (window.Companion) window.Companion.vibrate(10);
      if (window.lucide) window.lucide.createIcons();
    },

    // O Güne Ait Saat Saat Ders Listesini Oluştur
    renderDailyLessonsList(dayNum) {
      const container = document.getElementById('sch-daily-lessons-list');
      const labelEl = document.getElementById('sch-selected-day-label');
      const badgeEl = document.getElementById('sch-week-badge');
      if (!container) return;

      const dayNames = ['', 'Pazartesi Günü Dersleri', 'Salı Günü Dersleri', 'Çarşamba Günü Dersleri', 'Perşembe Günü Dersleri', 'Cuma Günü Dersleri'];
      if (labelEl) labelEl.textContent = dayNames[dayNum] || 'Ders Programı';

      const times = this.getTimes();
      const grid = this.getGrid();
      const lessons = this.getLessons();
      const plans = this.getPlans();
      const live = this.getCurrentLiveStatus();
      const todayNum = new Date().getDay();

      // Aktif hafta bilgisi
      let weekDisplay = 'Plan';
      if (plans.length > 0 && Array.isArray(plans[0].weeklySchedule)) {
        const wIdx = this.getActiveWeekIndex(plans[0].weeklySchedule);
        weekDisplay = `${wIdx + 1}. Hafta`;
      }
      if (badgeEl) badgeEl.textContent = weekDisplay;

      const pKeys = this.getPeriodKeys(times);

      if (pKeys.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 30px 16px; background: rgba(255,255,255,0.08); border-radius: 14px; color: #fff;">
            <i data-lucide="calendar-x" style="width: 36px; height: 36px; margin: 0 auto 8px; color: #93c5fd;"></i>
            <h4 style="font-size: 14px; font-weight: 700;">Ders programı bulunamadı</h4>
            <p style="font-size: 11px; color: #93c5fd; margin-top: 4px;">Masaüstünden "Terminale Gönder" butonuna basarak ders programınızı eşitleyebilirsiniz.</p>
          </div>
        `;
        return;
      }

      let html = '';
      let lunchShown = false;

      pKeys.forEach((pk, idx) => {
        const pNum = pk.replace('p', '');
        const timeData = times[pk] || { start: '--:--', end: '--:--' };
        const gridKey = `${dayNum}-${pk}`;
        const lessonId = grid[gridKey] || '';
        const lesson = lessons.find(l => l.id === lessonId);

        // Öğle arası ayıracı (p4 ile p5 arasında)
        if (pk === 'p5' && times['lunch'] && !lunchShown) {
          lunchShown = true;
          const lData = times['lunch'];
          html += `
            <div class="c-sch-lunch-divider">
              <i data-lucide="utensils" style="width: 14px; height: 14px; color: #10b981;"></i>
              <span>Öğle Arası (${lData.start} - ${lData.end})</span>
            </div>
          `;
        }

        // Bu ders o an işlenen canlı ders mi?
        const isCurrentNow = (todayNum === dayNum && live.statusType === 'lesson' && live.periodKey === pk);

        if (lesson) {
          // İlgili dersin o haftaki plan konusunu bul
          let topic = 'Konu girilmemiş.';
          let unit = '';
          const matchedPlan = plans.find(p => this.isLessonPlanMatch(p.courseName || p.title, lesson.name));
          if (matchedPlan) {
            const schedule = matchedPlan.weeklySchedule || matchedPlan.weeks || [];
            const weekIdx = this.getActiveWeekIndex(schedule);
            const weekObj = schedule[weekIdx];
            if (weekObj) {
              topic = this.extractTopic(weekObj);
              unit = weekObj.unit || weekObj.unitName || '';
            }
          }

          html += `
            <div class="c-sch-lesson-card ${isCurrentNow ? 'is-current' : ''}" style="border-left: 4.5px solid ${lesson.color || '#3b82f6'};">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="c-sch-period-pill">${pNum}. Ders</span>
                  <span class="c-sch-time-span">
                    <i data-lucide="clock" style="width: 11px; height: 11px;"></i>
                    ${timeData.start} - ${timeData.end}
                  </span>
                </div>

                <div style="display: flex; align-items: center; gap: 6px;">
                  ${isCurrentNow ? '<span class="c-sch-badge-now">🟢 ŞU ANKİ DERS</span>' : ''}
                  <span class="c-sch-lesson-tag" style="background: ${lesson.color || '#3b82f6'}1a; color: ${lesson.color || '#3b82f6'}; border: 1px solid ${lesson.color || '#3b82f6'}40;">
                    ${lesson.name}
                  </span>
                </div>
              </div>

              <!-- Konu & Ünite Bilgisi -->
              <div class="c-sch-topic-row">
                <div style="font-size: 13px; font-weight: 700; color: #1e293b; line-height: 1.35;">
                  ${topic}
                </div>
                ${unit ? `<div style="font-size: 11px; color: #64748b; margin-top: 3px;">📁 ${unit}</div>` : ''}
              </div>
            </div>
          `;
        } else {
          // Boş Ders Saati
          html += `
            <div class="c-sch-lesson-card empty ${isCurrentNow ? 'is-current' : ''}">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="c-sch-period-pill empty">${pNum}. Ders</span>
                  <span class="c-sch-time-span">${timeData.start} - ${timeData.end}</span>
                </div>
                <span style="font-size: 11px; font-weight: 600; color: #94a3b8;">Boş Ders</span>
              </div>
            </div>
          `;
        }
      });

      container.innerHTML = html;
    },

    // Belirtilen Günün Derslerini Raporlama İçin Döndür
    getDayLessons(dayNum) {
      const times = this.getTimes();
      const grid = this.getGrid();
      const lessons = this.getLessons();
      const plans = this.getPlans();
      const pKeys = this.getPeriodKeys(times);

      const dayLessons = [];
      pKeys.forEach(pk => {
        const gridKey = `${dayNum}-${pk}`;
        const lessonId = grid[gridKey] || '';
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson) {
          let topic = '';
          const matchedPlan = plans.find(p => this.isLessonPlanMatch(p.courseName || p.title, lesson.name));
          if (matchedPlan) {
            const schedule = matchedPlan.weeklySchedule || matchedPlan.weeks || [];
            const weekIdx = this.getActiveWeekIndex(schedule);
            const weekObj = schedule[weekIdx];
            if (weekObj) topic = this.extractTopic(weekObj);
          }
          dayLessons.push({
            periodKey: pk,
            periodNum: pk.replace('p', ''),
            name: lesson.name,
            color: lesson.color,
            topic
          });
        }
      });
      return dayLessons;
    }
  };

  window.CompanionSchedule = CompanionSchedule;

})(window);
