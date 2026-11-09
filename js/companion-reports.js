/**
 * Sınıf Asistanı — El Terminali: Raporlar & WhatsApp Sınıf Bülteni Modülü (companion-reports.js)
 * Öğretmenin tek dokunuşla "Günün Özeti" ve "Haftalık Sınıf Bülteni" oluşturup
 * WhatsApp sınıf gruplarında veya bireysel velilerle paylaşmasını sağlar.
 * 
 * KURAL: Haftalık bültende "Gelecek Hafta" bölümü yer almaz.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'sinif_asistani_data';

  const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  function formatDateTurkish(dateObj) {
    const d = dateObj || new Date();
    const day = d.getDate();
    const month = MONTH_NAMES[d.getMonth()];
    const year = d.getFullYear();
    const dayName = DAY_NAMES[d.getDay()];
    return `${day} ${month} ${year} ${dayName}`;
  }

  function formatShortDate(dateObj) {
    const d = dateObj || new Date();
    const day = d.getDate();
    const month = MONTH_NAMES[d.getMonth()];
    return `${day} ${month}`;
  }

  function toLocalISO(dateObj) {
    const d = dateObj || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getISOWeekLocal(dateInput) {
    if (typeof window.getISOWeek === 'function') {
      return window.getISOWeek(dateInput);
    }
    const date = dateInput ? (dateInput instanceof Date ? dateInput : new Date(dateInput)) : new Date();
    if (isNaN(date.getTime())) return '';
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    const weekStr = weekNo < 10 ? '0' + weekNo : weekNo;
    return `${d.getUTCFullYear()}-W${weekStr}`;
  }

  function getWeekDateRange(dateObj) {
    const d = new Date(dateObj || new Date());
    const day = d.getDay();
    // Pazartesi'yi haftanın ilk günü yapalım (day 0: Pazar -> -6, day 1: Pzt -> 0)
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      monday,
      friday,
      sunday,
      rangeStr: `${monday.getDate()} ${MONTH_NAMES[monday.getMonth()]} - ${friday.getDate()} ${MONTH_NAMES[friday.getMonth()]} ${friday.getFullYear()}`
    };
  }

  const CompanionReports = {
    activeTab: 'daily', // 'daily' | 'weekly' | 'student'
    selectedStudentId: '',
    customNoteDaily: '',
    customNoteWeekly: 'Tüm öğrencilerimize ve desteklerini esirgemeyen değerli velilerimize teşekkür eder, keyifli ve dinlendirici bir hafta sonu dileriz! 🌿',
    customNoteStudent: '',
    customTopicsToday: '',

    getData() {
      if (window.Companion && typeof window.Companion.getData === 'function') {
        return window.Companion.getData();
      }
      try {
        const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('sinif_asistani_state_v3');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (window.CompanionOmr && window.CompanionOmr._memoryData && Array.isArray(window.CompanionOmr._memoryData.weeklyEvaluations)) {
            parsed.weeklyEvaluations = window.CompanionOmr._memoryData.weeklyEvaluations;
          }
          return parsed;
        }
      } catch (e) {}
      if (window.CompanionOmr && window.CompanionOmr._memoryData) {
        return window.CompanionOmr._memoryData;
      }
      return { students: [], performance: [], homeworks: [], books: { library: [], transactions: [] }, weeklyEvaluations: [] };
    },

    getActiveSection() {
      if (window.Companion && window.Companion.activeSection) {
        return window.Companion.activeSection;
      }
      return localStorage.getItem('sinif_companion_active_section') || '4-C';
    },

    getTeacherName() {
      if (window.Companion && window.Companion.profile && window.Companion.profile.name) {
        return window.Companion.profile.name;
      }
      try {
        const pRaw = localStorage.getItem('sinif_companion_profile');
        if (pRaw) {
          const parsed = JSON.parse(pRaw);
          if (parsed && parsed.name) return parsed.name;
        }
      } catch (e) {}
      return 'Sınıf Öğretmeni';
    },

    getStudentsForActiveSection() {
      const data = this.getData();
      const all = Array.isArray(data.students) ? data.students : [];
      const sec = this.getActiveSection().replace('/', '-').trim().toUpperCase();

      return all.filter(s => {
        const b = (s.branch || s.section || s.className || '').replace('/', '-').trim().toUpperCase();
        return !b || b === sec || b === 'ALL';
      }).sort((a, b) => {
        const numA = parseInt(a.number, 10) || 9999;
        const numB = parseInt(b.number, 10) || 9999;
        return numA - numB;
      });
    },

    init() {
      this.updateSectionLabel();
      this.populateStudentDropdown();
      this.setTab(this.activeTab || 'daily');
      if (window.Companion && typeof window.Companion.renderIcons === 'function') {
        window.Companion.renderIcons();
      }
    },

    updateSectionLabel() {
      const sub = document.getElementById('reports-view-subtitle');
      if (sub) {
        sub.textContent = `${this.getActiveSection()} Şubesi • WhatsApp & Veli Bülteni`;
      }
    },

    populateStudentDropdown() {
      const select = document.getElementById('report-student-select');
      if (!select) return;

      const students = this.getStudentsForActiveSection();
      if (students.length === 0) {
        select.innerHTML = '<option value="">Öğrenci bulunamadı</option>';
        return;
      }

      select.innerHTML = students.map(s => {
        const no = s.number ? `#${s.number} ` : '';
        const name = `${s.name} ${s.surname || ''}`.trim();
        return `<option value="${s.id}">${no}${name}</option>`;
      }).join('');

      if (!this.selectedStudentId && students[0]) {
        this.selectedStudentId = String(students[0].id);
      }
      select.value = this.selectedStudentId;
    },

    setTab(tabName) {
      this.activeTab = tabName;

      // Tab butonları aktiflik durumu
      const tabs = ['daily', 'weekly', 'student'];
      tabs.forEach(t => {
        const btn = document.getElementById(`tab-report-${t}`);
        const panel = document.getElementById(`report-panel-${t}`);
        if (btn) btn.classList.toggle('active', t === tabName);
        if (panel) panel.style.display = (t === tabName) ? 'block' : 'none';
      });

      this.generateActiveReport();
    },

    onStudentSelectChange(val) {
      this.selectedStudentId = val;
      this.generateActiveReport();
    },

    onCustomInputChange() {
      const dailyTopics = document.getElementById('report-daily-topics');
      if (dailyTopics) this.customTopicsToday = dailyTopics.value;

      const dailyNote = document.getElementById('report-daily-note');
      if (dailyNote) this.customNoteDaily = dailyNote.value;

      const weeklyNote = document.getElementById('report-weekly-note');
      if (weeklyNote) this.customNoteWeekly = weeklyNote.value;

      const studentNote = document.getElementById('report-student-note');
      if (studentNote) this.customNoteStudent = studentNote.value;

      this.generateActiveReport();
    },

    generateActiveReport() {
      let text = '';
      if (this.activeTab === 'daily') {
        text = this.buildDailySummaryText();
      } else if (this.activeTab === 'weekly') {
        text = this.buildWeeklyBulletinText();
      } else if (this.activeTab === 'student') {
        text = this.buildStudentReportText();
      }

      const textarea = document.getElementById('report-preview-textarea');
      if (textarea) {
        textarea.value = text;
        this.updateCharCount(text);
      }
    },

    updateCharCount(text) {
      const countEl = document.getElementById('report-char-count');
      if (countEl) {
        const len = (text || '').length;
        const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
        countEl.textContent = `${len} karakter • ${words} kelime`;
      }
    },

    // -------------------------------------------------------------------------
    // 1. GÜNÜN ÖZETİ RAPOR METNİ
    // -------------------------------------------------------------------------
    buildDailySummaryText() {
      const sec = this.getActiveSection();
      const teacher = this.getTeacherName();
      const dateStr = formatDateTurkish(new Date());
      const now = new Date();
      const todayISO = toLocalISO(now); // YYYY-MM-DD (Yerel Saat)

      const data = this.getData();
      const students = this.getStudentsForActiveSection();
      const studentIdSet = new Set(students.map(s => String(s.id)));

      // 1. İşlenen Konular & Dersler
      let topicsText = this.customTopicsToday.trim();
      if (!topicsText) {
        // Schedule modülünden günün derslerini çekmeyi dene
        if (window.CompanionSchedule && typeof window.CompanionSchedule.getDayLessons === 'function') {
          const dayLessons = window.CompanionSchedule.getDayLessons(now.getDay());
          if (Array.isArray(dayLessons) && dayLessons.length > 0) {
            topicsText = dayLessons
              .filter(l => l && l.name)
              .map(l => `• ${l.name}${l.topic ? ': ' + l.topic : ''}`)
              .join('\n');
          }
        }
      }
      if (!topicsText) {
        topicsText = '• Günlük ders kazanımları ve sınıf içi etkinlikler tamamlandı.';
      }

      // 2. Ödev Durumu
      let hwText = '';
      const hwList = Array.isArray(data.homeworks) ? data.homeworks : (Array.isArray(data.homework) ? data.homework : []);
      // Bugüne ait veya en son eklenen ödevi bul
      const todayHw = hwList.find(h => {
        const matchSec = !h.branch || h.branch === sec || h.branch === 'all';
        return matchSec && (h.dueDate === todayISO || (h.createdAt && h.createdAt.slice(0, 10) === todayISO));
      }) || (hwList.length > 0 ? hwList[hwList.length - 1] : null);

      if (todayHw) {
        const statusMap = todayHw.status || {};
        let done = 0;
        let inc = 0;
        let missing = 0;
        students.forEach(s => {
          const st = statusMap[s.id];
          if (st === 'completed') done++;
          else if (st === 'incomplete') inc++;
          else if (st === 'missing') missing++;
        });

        hwText = `📝 *ÖDEV VE GÖREV TAKİBİ*\n• *${todayHw.title || 'Günlük Ödev'}:* ${done} Öğrenci Tamamladı ✅`;
        if (missing > 0) hwText += `, ${missing} Eksik ⚠️`;
        if (todayHw.description && todayHw.description !== 'El terminalinden günlük kontrol') {
          hwText += `\n📌 *Açıklama:* ${todayHw.description}`;
        }
      } else {
        hwText = '📝 *ÖDEV VE GÖREV TAKİBİ*\n• Günlük verilen görevlerin ve okuma ödevlerinin kontrolü yapıldı.';
      }

      // 3. Günün Yıldızları & Artı Alanlar
      const perfList = Array.isArray(data.performance) ? data.performance : [];
      const todayPositives = perfList.filter(p => {
        if (!studentIdSet.has(String(p.studentId))) return false;
        if (p.type !== 'positive') return false;
        const pDate = (p.date || '').slice(0, 10);
        return pDate === todayISO;
      });

      let starsText = '';
      if (todayPositives.length > 0) {
        // Öğrenci bazında grupla
        const studentPoints = {};
        todayPositives.forEach(p => {
          const sObj = students.find(s => String(s.id) === String(p.studentId));
          const name = sObj ? `${sObj.name} ${sObj.surname || ''}`.trim() : (p.studentName || 'Öğrenci');
          if (!studentPoints[name]) studentPoints[name] = { pts: 0, reasons: [] };
          studentPoints[name].pts += (parseInt(p.point, 10) || 1);
          if (p.reason && !studentPoints[name].reasons.includes(p.reason)) {
            studentPoints[name].reasons.push(p.reason);
          }
        });

        const sortedNames = Object.keys(studentPoints).sort((a, b) => studentPoints[b].pts - studentPoints[a].pts);
        const topNames = sortedNames.slice(0, 6);
        starsText = '🌟 *GÜNÜN YILDIZLARI & DERSE KATILIM*\n' + topNames.map(n => {
          const r = studentPoints[n].reasons.slice(0, 2).join(', ');
          return `✨ *${n}* (+${studentPoints[n].pts} Puan${r ? ' - ' + r : ''})`;
        }).join('\n');
      } else {
        starsText = '🌟 *GÜNÜN YILDIZLARI*\n✨ Bugün tüm öğrencilerimiz derslere gayret ve nezaketle katılım sağladı.';
      }

      // 4. Kitaplık & Okuma Durumu
      let booksText = '';
      const booksData = data.books || {};
      const txList = Array.isArray(booksData.transactions) ? booksData.transactions : [];
      const libList = Array.isArray(booksData.library) ? booksData.library : [];
      
      const todayBooks = txList.filter(t => {
        if (!studentIdSet.has(String(t.studentId))) return false;
        const bDate = (t.returnDate || t.borrowDate || '').slice(0, 10);
        return bDate === todayISO;
      });

      if (todayBooks.length > 0) {
        booksText = `📚 *KİTAPLIK KÖŞESİ*\n📖 Bugün ${todayBooks.length} öğrencimiz sınıf kütüphanesinden kitap teslim etti / yeni kitap ödünç aldı.`;
      } else {
        booksText = '📚 *KİTAPLIK KÖŞESİ*\n📖 Her gün en az 20 dakika ailece kitap okuma saatimizi unutmayalım.';
      }

      // 5. Öğretmen Hatırlatma / Duyuru
      let noteText = '';
      if (this.customNoteDaily && this.customNoteDaily.trim()) {
        noteText = `\n📢 *ÖĞRETMENİN NOTU / HATIRLATMA*\n${this.customNoteDaily.trim()}\n`;
      }

      // Raporun Derlenmesi
      return `📢 *${sec} ŞUBESİ — GÜNÜN ÖZETİ & BÜLTENİ*
📅 *Tarih:* ${dateStr}
👨‍🏫 *Öğretmen:* ${teacher}
━━━━━━━━━━━━━━━━━━━━

📌 *BUGÜN NE YAPTIK? (İŞLENEN DERSLER)*
${topicsText}

${hwText}

${starsText}

${booksText}
${noteText}
━━━━━━━━━━━━━━━━━━━━
🌱 *Sınıf Asistanı ile hazırlanmıştır.*`;
    },

    // -------------------------------------------------------------------------
    // 2. HAFTALIK SINIF BÜLTENİ RAPOR METNİ (KURAL: GELECEK HAFTA NE VAR KISMI YOK)
    // -------------------------------------------------------------------------
    buildWeeklyBulletinText() {
      const sec = this.getActiveSection();
      const teacher = this.getTeacherName();
      const now = new Date();
      const weekRange = getWeekDateRange(now);

      const data = this.getData();
      const students = this.getStudentsForActiveSection();
      const studentIdSet = new Set(students.map(s => String(s.id)));

      // Son 7 güne veya haftaya ait başlangıç tarihi (Pazartesi 00:00 - Yerel Saat)
      const mondayIso = toLocalISO(weekRange.monday);
      const currentIsoWeek = getISOWeekLocal(now);
      const normSec = String(sec || '').replace(/[\/\-\s]/g, '').toUpperCase();

      // 1. HAFTANIN KİTAP KURTLARI
      const booksData = data.books || {};
      const txList = Array.isArray(booksData.transactions) ? booksData.transactions : [];
      const libList = Array.isArray(booksData.library) ? booksData.library : [];
      
      const bookMap = {};
      libList.forEach(b => { bookMap[String(b.id)] = b; });

      const studentPages = {};
      let totalClassPages = 0;

      txList.forEach(t => {
        if (!studentIdSet.has(String(t.studentId))) return false;
        const txDate = (t.returnDate || t.borrowDate || '').slice(0, 10);
        if (txDate >= mondayIso) {
          const sObj = students.find(s => String(s.id) === String(t.studentId));
          if (!sObj) return;
          const sName = `${sObj.name} ${sObj.surname || ''}`.trim();
          const book = bookMap[String(t.bookId)] || {};
          const pages = parseInt(book.pageCount || book.pages || book.page, 10) || 30;

          if (!studentPages[sName]) studentPages[sName] = { pages: 0, count: 0 };
          studentPages[sName].pages += pages;
          studentPages[sName].count += 1;
          totalClassPages += pages;
        }
      });

      let bookReportText = '';
      const sortedReaders = Object.keys(studentPages).sort((a, b) => studentPages[b].pages - studentPages[a].pages);
      if (sortedReaders.length > 0) {
        const topReaders = sortedReaders.slice(0, 4);
        const medals = ['🥇', '🥈', '🥉', '⭐'];
        bookReportText = '📚 *HAFTANIN KİTAP KURTLARI*\nBu hafta kütüphanemizden en çok sayfa okuyan parlayan yıldızlarımız:\n' +
          topReaders.map((n, i) => `${medals[i] || '⭐'} *${n}* — ${studentPages[n].pages} Sayfa (${studentPages[n].count} Kitap)`).join('\n') +
          `\n📖 *Sınıf Toplamı:* Bu hafta sınıfça toplam *${totalClassPages} sayfa* kitap okundu. Harikasınız! 👏`;
      } else {
        bookReportText = '📚 *HAFTANIN KİTAP KURTLARI*\n📖 Bu hafta kitap okuma gayretini sürdüren tüm öğrencilerimizi tebrik ediyoruz. Kitaplar en sadık dostumuzdur!';
      }

      // 2. HAFTANIN DAVRANIŞ & KATILIM ŞAMPİYONLARI
      const perfList = Array.isArray(data.performance) ? data.performance : [];
      const weeklyPerf = perfList.filter(p => {
        if (!studentIdSet.has(String(p.studentId))) return false;
        if (p.type !== 'positive') return false;
        const pDate = (p.date || '').slice(0, 10);
        return pDate >= mondayIso;
      });

      const behaviorScores = {};
      weeklyPerf.forEach(p => {
        const sObj = students.find(s => String(s.id) === String(p.studentId));
        if (!sObj) return;
        const sName = `${sObj.name} ${sObj.surname || ''}`.trim();
        const pt = parseInt(p.point, 10) || 1;
        behaviorScores[sName] = (behaviorScores[sName] || 0) + pt;
      });

      let behaviorReportText = '';
      const sortedBehavior = Object.keys(behaviorScores).sort((a, b) => behaviorScores[b] - behaviorScores[a]);
      if (sortedBehavior.length > 0) {
        const topBehavior = sortedBehavior.slice(0, 5);
        behaviorReportText = '🌟 *HAFTANIN DAVRANIŞ & KATILIM ŞAMPİYONLARI*\nDers içi aktif katılımları, nezaketleri ve örnek tutumlarıyla öne çıkan öğrencilerimiz:\n' +
          topBehavior.map((n, i) => `⭐ *${n}* (+${behaviorScores[n]} Puan)`).join('\n');
      } else {
        behaviorReportText = '🌟 *HAFTANIN DAVRANIŞ & KATILIM ŞAMPİYONLARI*\n⭐ Hafta boyunca sınıf düzenine ve ders kurallarına uyan tüm öğrencilerimize teşekkür ederiz.';
      }

      // 3. HAFTANIN ÖDEV YILDIZLARI (Tüm öğrenciler kısaltmasız listelenir)
      const hwList = Array.isArray(data.homeworks) ? data.homeworks : (Array.isArray(data.homework) ? data.homework : []);
      const weeklyHw = hwList.filter(h => {
        const hBranch = String(h.branch || '').replace(/[\/\-\s]/g, '').toUpperCase();
        const matchSec = !hBranch || hBranch === normSec || hBranch === 'ALL';
        const dueIso = (h.dueDate || '').slice(0, 10);
        const createdIso = (h.createdAt || '').slice(0, 10);
        return matchSec && (dueIso >= mondayIso || createdIso >= mondayIso);
      });

      // Yalnızca kontrolü yapılmış (en az 1 öğrencisi işaretlenmiş) ödevleri değerlendirmeye al
      const checkedWeeklyHw = weeklyHw.filter(hw => {
        const stMap = hw.status || {};
        return Object.values(stMap).some(v => v === 'completed' || v === 'incomplete' || v === 'missing' || v === 'excused');
      });

      let hwReportText = '';
      if (checkedWeeklyHw.length > 0) {
        // Bu hafta kontrol edilen tüm ödevleri eksiksiz ('completed' veya 'excused', en az 1 'completed') yapan tüm öğrencileri bul
        const perfectStudents = [];
        students.forEach(s => {
          let allDone = true;
          let hasCompleted = false;
          checkedWeeklyHw.forEach(hw => {
            const st = (hw.status || {})[s.id];
            if (st === 'completed') {
              hasCompleted = true;
            } else if (st !== 'excused') {
              allDone = false;
            }
          });
          if (allDone && hasCompleted) {
            perfectStudents.push(`${s.name} ${s.surname || ''}`.trim());
          }
        });

        if (perfectStudents.length > 0) {
          const displayHwStars = perfectStudents.join(', ');
          hwReportText = `📝 *HAFTANIN ÖDEV YILDIZLARI*\nBu hafta verilen tüm görev ve ödevleri eksiksiz tamamlayan yıldızlarımız (${perfectStudents.length} Öğrenci):\n🎯 ${displayHwStars} 👏`;
        } else {
          hwReportText = `📝 *HAFTANIN ÖDEV TAKİBİ*\nBu hafta ${checkedWeeklyHw.length} adet ödev kontrolü gerçekleştirildi. Ödev sorumluluğuna özen gösteren öğrencilerimizi kutlarız.`;
        }
      } else {
        hwReportText = '📝 *HAFTANIN ÖDEV TAKİBİ*\nVerilen ödev ve çalışmaları düzenli yapan tüm öğrencilerimizi tebrik ederiz.';
      }

      // 4. HAFTALIK DEĞERLENDİRME & SINAV SONUÇLARI (Birden çok sınav varsa ayrı sınav başlıkları altında, ilk 5 öğrenci)
      let examReportText = '';
      const exams = Array.isArray(data.weeklyEvaluations) ? data.weeklyEvaluations : [];

      // Sadece bu şubeye ait ve içinde öğrenci sonucu bulunan sınavları ayıkla
      const extractExamParticipants = (exam) => {
        const list = [];
        const seenKeys = new Set();

        const addEntry = (rawId, resObj) => {
          if (!resObj || typeof resObj !== 'object') return;
          const sNo = String(resObj.studentNo || resObj.studentNumber || '').trim();
          const rawName = String(resObj.studentName || resObj.name || '').trim();
          const normRawName = rawName.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');

          const matchedStu = students.find(s =>
            String(s.id) === String(rawId) ||
            (resObj.studentId && String(s.id) === String(resObj.studentId)) ||
            (sNo && sNo !== '-' && String(s.number || '').trim() === sNo) ||
            (sNo && sNo !== '-' && parseInt(s.number, 10) > 0 && parseInt(s.number, 10) === parseInt(sNo, 10)) ||
            (!isNaN(parseInt(rawId, 10)) && parseInt(s.number, 10) > 0 && parseInt(s.number, 10) === parseInt(rawId, 10)) ||
            (normRawName && `${s.name || ''} ${s.surname || ''}`.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ') === normRawName)
          );

          // Eğer sınavda şube belirtilmemişse ve öğrenci bu şubeden değilse ve şube öğrencileri varsa kontrol et
          const dedupKey = matchedStu
            ? `stu_${matchedStu.id}`
            : (sNo && sNo !== '-' ? `no_${sNo}` : (normRawName ? `name_${normRawName}` : `id_${rawId}`));

          if (seenKeys.has(dedupKey)) return;
          seenKeys.add(dedupKey);

          const displayName = matchedStu
            ? `${matchedStu.name || ''} ${matchedStu.surname || ''}`.trim()
            : (rawName || `Öğrenci #${sNo || rawId}`);

          const score = parseFloat(resObj.score != null ? resObj.score : 0) || 0;
          const net = parseFloat(resObj.net != null ? resObj.net : (resObj.correct || 0)) || 0;
          const correct = parseInt(resObj.correct, 10) || 0;
          const wrong = parseInt(resObj.wrong, 10) || 0;
          const updatedIso = (resObj.updatedAt || resObj.date || '').slice(0, 10);

          list.push({
            name: displayName,
            score,
            net,
            correct,
            wrong,
            updatedIso,
            isClassStudent: !!matchedStu
          });
        };

        if (exam.studentResults && typeof exam.studentResults === 'object' && !Array.isArray(exam.studentResults)) {
          Object.entries(exam.studentResults).forEach(([k, v]) => addEntry(k, v));
        } else if (Array.isArray(exam.results) && exam.results.length > 0) {
          exam.results.forEach((r, idx) => addEntry(r.studentId || idx, r));
        } else if (exam.examScores && typeof exam.examScores === 'object') {
          Object.entries(exam.examScores).forEach(([k, v]) => {
            if (v && typeof v === 'object') addEntry(k, v);
            else addEntry(k, { studentId: k, score: parseFloat(v) || 0 });
          });
        }

        return list;
      };

      const candidateExams = [];
      exams.forEach(e => {
        if (!e || typeof e !== 'object') return;
        const eBranch = String(e.branch || e.section || e.className || '').replace(/[\/\-\s]/g, '').toUpperCase();
        const branchMatches = !eBranch || eBranch === normSec || eBranch === 'ALL';
        const participants = extractExamParticipants(e);
        if (participants.length === 0) return;

        // Şube eşleşiyorsa veya katılımcıların içinde bu şubenin öğrencileri varsa
        const hasClassStudents = participants.some(p => p.isClassStudent);
        if (!branchMatches && !hasClassStudents) return;

        const eDateIso = (e.date || '').slice(0, 10);
        const eCreatedIso = (e.createdAt || '').slice(0, 10);
        const eUpdatedIso = (e.updatedAt || '').slice(0, 10);
        const normExamWeek = (typeof window.normalizeWeekId === 'function' && e.weekId)
          ? window.normalizeWeekId(e.weekId)
          : String(e.weekId || '').toUpperCase();
        const hasRecentScan = participants.some(p => p.updatedIso && p.updatedIso >= mondayIso);

        const isThisWeek =
          (eDateIso && eDateIso >= mondayIso) ||
          (eCreatedIso && eCreatedIso >= mondayIso) ||
          (eUpdatedIso && eUpdatedIso >= mondayIso) ||
          (normExamWeek && currentIsoWeek && normExamWeek === currentIsoWeek) ||
          hasRecentScan;

        candidateExams.push({
          exam: e,
          title: (e.examName || e.title || e.name || 'Değerlendirme Sınavı').trim(),
          participants,
          isThisWeek
        });
      });

      // Önce bu haftaya ait sınavları al; eğer tarih damgası eksik olan sınavlar varsa ve bu hafta hiç eşleşmediyse mevcut sonuçlu sınavları göster
      let weeklyExams = candidateExams.filter(c => c.isThisWeek);
      if (weeklyExams.length === 0 && candidateExams.length > 0) {
        weeklyExams = candidateExams;
      }

      if (weeklyExams.length > 0) {
        const examBlocks = weeklyExams.map(item => {
          const sorted = item.participants.slice().sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.net !== a.net) return b.net - a.net;
            return b.correct - a.correct;
          });

          const sumScore = sorted.reduce((acc, r) => acc + (r.score || 0), 0);
          const avgScore = Math.round(sumScore / sorted.length);
          const topFive = sorted.slice(0, 5);
          const rankBadges = ['🥇 1.', '🥈 2.', '🥉 3.', '🏅 4.', '🏅 5.'];

          const topFiveLines = topFive.map((stu, idx) => {
            const scoreStr = Number.isInteger(stu.score) ? stu.score : Math.round(stu.score * 10) / 10;
            const detailStr = (stu.correct > 0 || stu.wrong > 0) ? ` (${stu.correct}D / ${stu.wrong}Y)` : '';
            return `${rankBadges[idx] || `${idx + 1}.`} *${stu.name}* — ${scoreStr} Puan${detailStr}`;
          }).join('\n');

          return `📊 *SINAV SONUÇLARI: ${item.title.toLocaleUpperCase('tr-TR')}*\n📈 *Katılım:* ${sorted.length} Öğrenci • *Sınıf Ortalaması:* ${avgScore} Puan\n🏆 *İlk 5 Öğrencimiz:*\n${topFiveLines}`;
        });

        examReportText = '\n' + examBlocks.join('\n\n') + '\n';
      }

      // 5. Kapanış & Öğretmen Hafta Sonu Mesajı (KULLANICI KURALI: GELECEK HAFTA KISMI KESİNLİKLE YOK!)
      let closingText = this.customNoteWeekly.trim() || 'Tüm öğrencilerimize ve ailelerimize huzurlu, neşeli ve dinlendirici bir hafta sonu dileriz! 🌿';

      return `🏆 *${sec} ŞUBESİ — HAFTALIK GELİŞİM VE BAŞARI BÜLTENİ*
📅 *Hafta:* ${weekRange.rangeStr}
👨‍🏫 *Öğretmen:* ${teacher}
━━━━━━━━━━━━━━━━━━━━

${bookReportText}

${behaviorReportText}

${hwReportText}
${examReportText}
━━━━━━━━━━━━━━━━━━━━
🌱 *ÖĞRETMENİN HAFTA SONU MESAJI:*
${closingText}

✨ *Sınıf Asistanı ile hazırlanmıştır.*`;
    },

    // -------------------------------------------------------------------------
    // 3. BİREYSEL ÖĞRENCİ VELİ BİLGİLENDİRME RAPORU
    // -------------------------------------------------------------------------
    buildStudentReportText() {
      const sec = this.getActiveSection();
      const teacher = this.getTeacherName();
      const dateStr = formatDateTurkish(new Date());

      const data = this.getData();
      const students = this.getStudentsForActiveSection();
      const student = students.find(s => String(s.id) === String(this.selectedStudentId)) || students[0];

      if (!student) {
        return 'Seçili öğrenci bulunamadı. Lütfen listeden bir öğrenci seçin.';
      }

      const sFullName = `${student.name} ${student.surname || ''}`.trim();
      const sNo = student.number ? `#${student.number}` : '';

      // Davranış Puanı
      const perfList = Array.isArray(data.performance) ? data.performance : [];
      const sPerf = perfList.filter(p => String(p.studentId) === String(student.id));
      let totalPts = 0;
      const recentReasons = [];
      sPerf.forEach(p => {
        const pt = parseInt(p.point, 10) || 0;
        totalPts += pt;
        if (p.reason && !recentReasons.includes(p.reason)) recentReasons.push(p.reason);
      });

      // Ödev Durumu (Son 3 ödev)
      const hwList = Array.isArray(data.homeworks) ? data.homeworks : (Array.isArray(data.homework) ? data.homework : []);
      const recentHw = hwList.slice(-3);
      let hwSummary = '';
      if (recentHw.length > 0) {
        hwSummary = recentHw.map(h => {
          const st = (h.status || {})[student.id] || 'unmarked';
          let stIcon = '⏳';
          let stText = 'Bekliyor';
          if (st === 'completed') { stIcon = '✅'; stText = 'Tam Yaptı'; }
          else if (st === 'incomplete') { stIcon = '⚠️'; stText = 'Eksik Yaptı'; }
          else if (st === 'missing') { stIcon = '❌'; stText = 'Yapmadı'; }
          else if (st === 'excused') { stIcon = '🔹'; stText = 'Muaf'; }
          return `• ${h.title || 'Ödev'}: ${stIcon} ${stText}`;
        }).join('\n');
      } else {
        hwSummary = '• Kayıtlı güncel ödev bulunmuyor.';
      }

      // Kitap Durumu
      const booksData = data.books || {};
      const txList = Array.isArray(booksData.transactions) ? booksData.transactions : [];
      const libList = Array.isArray(booksData.library) ? booksData.library : [];
      const activeTx = txList.find(t => String(t.studentId) === String(student.id) && t.status === 'reading');
      let bookText = 'Şu an kütüphaneden ödünç alınmış aktif bir kitap bulunmuyor.';
      if (activeTx) {
        const book = libList.find(b => String(b.id) === String(activeTx.bookId));
        if (book) {
          bookText = `📖 Şu an okuduğu kitap: *${book.title}* (${book.author || 'Yazar Belirtilmemiş'})`;
        }
      }

      let noteText = '';
      if (this.customNoteStudent && this.customNoteStudent.trim()) {
        noteText = `\n📢 *ÖĞRETMENİN ÖZEL NOTU:*\n${this.customNoteStudent.trim()}\n`;
      }

      return `📋 *${sec} — ÖĞRENCİ GELİŞİM VE DURUM BİLGİLENDİRMESİ*
👤 *Öğrenci:* ${sFullName} ${sNo}
📅 *Tarih:* ${dateStr}
👨‍🏫 *Öğretmen:* ${teacher}
━━━━━━━━━━━━━━━━━━━━

🌟 *DAVRANIŞ VE DERSE KATILIM*
• Toplam Puan: *${totalPts >= 0 ? '+' + totalPts : totalPts} Puan*
${recentReasons.length > 0 ? '• Öne Çıkan Gözlemler: ' + recentReasons.slice(0, 3).join(', ') : '• Ders içi tutumu olumlu ve yapıcı.'}

📝 *SON ÖDEV DURUMU*
${hwSummary}

📚 *KİTAP OKUMA DURUMU*
${bookText}
${noteText}
━━━━━━━━━━━━━━━━━━━━
Değerli velimiz, öğrencimizin gelişimini birlikte desteklediğiniz için teşekkür ederim. Saygılarımla. 🌿`;
    },

    // -------------------------------------------------------------------------
    // 4. PAYLAŞIM VE KOPYALAMA FONKSİYONLARI
    // -------------------------------------------------------------------------
    getPreviewText() {
      const textarea = document.getElementById('report-preview-textarea');
      return textarea ? textarea.value : '';
    },

    shareToWhatsApp() {
      const text = this.getPreviewText();
      if (!text || !text.trim()) {
        if (window.Companion) window.Companion.showToast('⚠️ Paylaşılacak rapor metni boş!');
        return;
      }

      if (window.Companion) window.Companion.vibrate(30);

      const encoded = encodeURIComponent(text);
      const appUrl = `whatsapp://send?text=${encoded}`;
      const webUrl = `https://api.whatsapp.com/send?text=${encoded}`;

      // 1. Android/Mobil WhatsApp uygulamasını tetikle
      try {
        window.location.href = appUrl;
      } catch (e) {
        window.open(webUrl, '_blank');
      }

      // Güvenlik ve masaüstü/tarayıcı yedeği
      setTimeout(() => {
        // Eğer uygulama açılmadıysa kullanıcıya alternatif sun
      }, 1500);

      if (window.Companion) {
        window.Companion.showToast('📲 WhatsApp açılıyor...');
      }
    },

    copyToClipboard() {
      const text = this.getPreviewText();
      if (!text || !text.trim()) {
        if (window.Companion) window.Companion.showToast('⚠️ Kopyalanacak metin boş!');
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.onCopySuccess();
        }).catch(() => {
          this.fallbackCopyText(text);
        });
      } else {
        this.fallbackCopyText(text);
      }
    },

    fallbackCopyText(text) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.onCopySuccess();
      } catch (err) {
        if (window.Companion) window.Companion.showToast('❌ Kopyalama başarısız oldu, lütfen elle seçin.');
      }
    },

    onCopySuccess() {
      if (window.Companion) {
        window.Companion.vibrate(40);
        window.Companion.showToast('✅ Rapor panoya kopyalandı! WhatsApp\'a yapıştırabilirsiniz.');
      }
    },

    shareNative() {
      const text = this.getPreviewText();
      if (!text || !text.trim()) return;

      if (navigator.share) {
        navigator.share({
          title: 'Sınıf Asistanı Raporu',
          text: text
        }).then(() => {
          if (window.Companion) window.Companion.showToast('✅ Paylaşıldı');
        }).catch(() => {});
      } else {
        this.copyToClipboard();
      }
    }
  };

  window.CompanionReports = CompanionReports;

})(window);
