(() => {
// Merkezi veri yönetimi ve localStorage entegrasyonu

const STORAGE_KEY = 'sinif_asistani_data';

// Timezone-safe local date formatting function (YYYY-MM-DD)
function formatLocalDate(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
window.formatLocalDate = formatLocalDate;

function getISOWeek(dateInput) {
  let date;
  if (!dateInput) {
    date = new Date();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }
  if (isNaN(date.getTime())) return '';
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  const weekStr = weekNo < 10 ? '0' + weekNo : weekNo;
  return `${d.getUTCFullYear()}-W${weekStr}`;
}
window.getISOWeek = getISOWeek;

function getDayInWeek(year, week, dayIndex) {
  const jan4 = new Date(year, 0, 4);
  const dayOfJan4 = jan4.getDay() || 7;
  const week1Start = new Date(jan4.getTime());
  week1Start.setDate(jan4.getDate() - dayOfJan4 + 1);

  const targetDay = new Date(week1Start.getTime());
  targetDay.setDate(week1Start.getDate() + (week - 1) * 7 + (dayIndex - 1));
  return targetDay;
}
window.getDayInWeek = getDayInWeek;

function formatWeekTR(weekId) {
  if (!weekId) return '';
  const parts = weekId.split('-W');
  return parts.length === 2 ? `${parts[0]} Yılı, ${parts[1]}. Hafta` : weekId;
}
window.formatWeekTR = formatWeekTR;



const DEFAULT_STATE = {
  educationLevel: 'primary',
  students: [],
  homeworks: [],
  books: {
    library: [],
    transactions: []
  },
  performance: [],
  weeklyEvaluations: [],
  tasks: [],
  notebooks: [],
  dutyRoster: null,
  plans: [],
  documents: [],
  examAnalysisExams: [],
  examAnalysisGrades: [],
  homeworkSettings: {
    completed: 4,
    incomplete: 2,
    missing: -4,
    excused: 0
  },
  weeklyExamSettings: {
    topCount: 3,
    rankPoints: {
      1: 10,
      2: 7,
      3: 4
    }
  },
  bookSettings: {
    limitDays: 15,
    onTimePoints: 2,
    latePoints: 0
  },
  performanceBehaviors: {
    positive: [
      { name: 'Derse Katılım', point: 1, icon: '🌟' },
      { name: 'Arkadaşlık / Yardımlaşma', point: 2, icon: '🤝' },
      { name: 'Temiz ve Düzenli', point: 1, icon: '🧼' },
      { name: 'Kitap Okuma', point: 2, icon: '📚' },
      { name: 'Ödevini Tam Yapma', point: 1, icon: '✅' },
      { name: 'Görev Bilinci / Sorumluluk', point: 2, icon: '🎯' },
      { name: 'Örnek Davranış', point: 3, icon: '🏆' },
      { name: 'Kitap Aferinleri', point: 0, icon: '📖' }
    ],
    development: [
      { name: 'Sınıf Düzenini Bozma', point: -1, icon: '📣' },
      { name: 'Derse Geç Kalma', point: -1, icon: '⏰' },
      { name: 'Malzemelerini Getirmeme', point: -1, icon: '🎒' },
      { name: 'Ödevini Yapmama', point: -1, icon: '❌' },
      { name: 'Arkadaşlarına Saygısızlık', point: -2, icon: '⚠️' },
      { name: 'Hazırlıksız Gelme', point: -1, icon: '📝' }
    ]
  },
  definedLessons: [
    { id: 'l_tur', name: 'Türkçe', color: '#ef4444' },
    { id: 'l_mat', name: 'Matematik', color: '#3b82f6' },
    { id: 'l_hay', name: 'Hayat Bilgisi', color: '#10b981' },
    { id: 'l_fen', name: 'Fen Bilimleri', color: '#22c55e' },
    { id: 'l_sos', name: 'Sosyal Bilgiler', color: '#f97316' },
    { id: 'l_ing', name: 'İngilizce', color: '#8b5cf6' },
    { id: 'l_bed', name: 'Beden Eğitimi', color: '#14b8a6' },
    { id: 'l_muz', name: 'Müzik', color: '#ec4899' },
    { id: 'l_gor', name: 'Görsel Sanatlar', color: '#eab308' }
  ],
  scheduleTimes: {
    p1: { start: '09:00', end: '09:40' },
    p2: { start: '09:50', end: '10:30' },
    p3: { start: '10:40', end: '11:20' },
    p4: { start: '11:30', end: '12:10' },
    lunch: { start: '12:10', end: '13:00' },
    p5: { start: '13:00', end: '13:40' },
    p6: { start: '13:50', end: '14:30' },
    p7: { start: '14:40', end: '15:20' }
  },
  scheduleGrid: {},
  appLock: {
    enabled: false,
    passwordHash: null,
    breakModeEnabled: false
  }
};

class StateManager {
  constructor() {
    this.state = this.loadState();
    this.subscribers = [];
  }

  loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        
        // Ensure all transaction IDs are unique (Migration)
        const transactions = (parsed.books && parsed.books.transactions) || [];
        const txIds = new Set();
        let hasDuplicateTx = false;
        transactions.forEach(t => {
          if (!t.id || txIds.has(t.id)) {
            t.id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            hasDuplicateTx = true;
          }
          txIds.add(t.id);
        });
        if (hasDuplicateTx) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        
        // homeworkSettings migration
        const hs = parsed.homeworkSettings || { completed: 4, incomplete: 2, missing: -4, excused: 0 };
        if (hs.excused === undefined) hs.excused = 0;
        
        // weeklyExamSettings migration (from first/second/third to topCount/rankPoints)
        let wes = parsed.weeklyExamSettings || { topCount: 3, rankPoints: { 1: 10, 2: 7, 3: 4 } };
        if (wes.topCount === undefined) {
          wes = {
            topCount: 3,
            rankPoints: {
              1: wes.first !== undefined ? wes.first : 10,
              2: wes.second !== undefined ? wes.second : 7,
              3: wes.third !== undefined ? wes.third : 4
            }
          };
        }
        
        // bookSettings migration
        const bs = parsed.bookSettings || { limitDays: 15, onTimePoints: 2, latePoints: 0 };
        
        // performanceBehaviors migration
        const pb = parsed.performanceBehaviors || {
          positive: [
            { name: 'Derse Katılım', point: 1, icon: '🌟' },
            { name: 'Arkadaşlık / Yardımlaşma', point: 2, icon: '🤝' },
            { name: 'Temiz ve Düzenli', point: 1, icon: '🧼' },
            { name: 'Kitap Okuma', point: 2, icon: '📚' },
            { name: 'Ödevini Tam Yapma', point: 1, icon: '✅' },
            { name: 'Görev Bilinci / Sorumluluk', point: 2, icon: '🎯' },
            { name: 'Örnek Davranış', point: 3, icon: '🏆' },
            { name: 'Kitap Aferinleri', point: 0, icon: '📖' }
          ],
          development: [
            { name: 'Sınıf Düzenini Bozma', point: -1, icon: '📣' },
            { name: 'Derse Geç Kalma', point: -1, icon: '⏰' },
            { name: 'Malzemelerini Getirmeme', point: -1, icon: '🎒' },
            { name: 'Ödevini Yapmama', point: -1, icon: '❌' },
            { name: 'Arkadaşlarına Saygısızlık', point: -2, icon: '⚠️' },
            { name: 'Hazırlıksız Gelme', point: -1, icon: '📝' }
          ]
        };

        // Rename 'Kitap Okuma Öncüsü' to 'Kitap Okuma' in positive behaviors if present
        if (pb.positive) {
          pb.positive.forEach(b => {
            if (b.name === 'Kitap Okuma Öncüsü') {
              b.name = 'Kitap Okuma';
            }
          });
        }

        // Ensure 'Kitap Okuma' exists in positive behaviors
        if (pb.positive && !pb.positive.some(b => b.name === 'Kitap Okuma')) {
          pb.positive.push({ name: 'Kitap Okuma', point: 2, icon: '📚' });
        }

        // Ensure 'Kitap Aferinleri' exists in positive behaviors
        if (pb.positive && !pb.positive.some(b => b.name === 'Kitap Aferinleri')) {
          pb.positive.push({ name: 'Kitap Aferinleri', point: 0, icon: '📖' });
        }

        return {
          educationLevel: parsed.educationLevel || 'primary',
          students: parsed.students || [],
          homeworks: parsed.homeworks || [],
          books: {
            library: (parsed.books && parsed.books.library) || [],
            transactions: (parsed.books && parsed.books.transactions) || []
          },
          performance: parsed.performance || [],
          weeklyEvaluations: parsed.weeklyEvaluations || [],
          tasks: parsed.tasks || [],
          notebooks: parsed.notebooks || [],
          homeworkSettings: hs,
          weeklyExamSettings: wes,
          bookSettings: bs,
          performanceBehaviors: pb,
          dutyRoster: parsed.dutyRoster || null,
          plans: parsed.plans || [],
          documents: parsed.documents || [],
          definedLessons: parsed.definedLessons || null,
          scheduleTimes: parsed.scheduleTimes || null,
          scheduleGrid: parsed.scheduleGrid || {},
          examAnalysisExams: parsed.examAnalysisExams || [],
          examAnalysisGrades: parsed.examAnalysisGrades || [],
          appLock: parsed.appLock || { enabled: false, passwordHash: null, breakModeEnabled: false }
        };
      }
    } catch (e) {
      console.error("Veri yüklenirken hata oluştu:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notify();
    } catch (e) {
      console.error("Veri kaydedilirken hata oluştu:", e);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    // Kayıt anında mevcut durumu da ilet
    callback(this.state);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  // YEDEKLEME VE GERİ YÜKLEME
  exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const dateStr = formatLocalDate();
    downloadAnchor.setAttribute("download", `sinif_asistani_yedek_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        this.state = {
          educationLevel: parsed.educationLevel || 'primary',
          students: parsed.students || [],
          homeworks: parsed.homeworks || [],
          books: {
            library: (parsed.books && parsed.books.library) || [],
            transactions: (parsed.books && parsed.books.transactions) || []
          },
          performance: parsed.performance || [],
          weeklyEvaluations: parsed.weeklyEvaluations || [],
          tasks: parsed.tasks || [],
          homeworkSettings: parsed.homeworkSettings || this.state.homeworkSettings,
          weeklyExamSettings: parsed.weeklyExamSettings || this.state.weeklyExamSettings,
          bookSettings: parsed.bookSettings || this.state.bookSettings,
          performanceBehaviors: parsed.performanceBehaviors || this.state.performanceBehaviors,
          dutyRoster: parsed.dutyRoster || null,
          plans: parsed.plans || [],
          documents: parsed.documents || [],
          examAnalysisExams: parsed.examAnalysisExams || [],
          examAnalysisGrades: parsed.examAnalysisGrades || []
        };
        this.saveState();
        return true;
      }
    } catch (e) {
      console.error("Yedek yükleme hatası:", e);
    }
    return false;
  }

  setEducationLevel(level) {
    if (level === 'primary' || level === 'middle') {
      this.state.educationLevel = level;
      this.saveState();
      return true;
    }
    return false;
  }

  resetState() {
    const theme = localStorage.getItem('theme');
    localStorage.clear();
    if (theme) {
      localStorage.setItem('theme', theme);
    }
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }

  // ÖĞRENCİ İŞLEMLERİ
  addStudent(studentData) {
    // Demo limit kontrolü
    if (window.LicenseConfig && window.LicenseConfig.isDemo) {
      if (this.state.students.length >= window.LicenseConfig.studentLimit) {
        if (window.showToast) {
          window.showToast(`Demo sürümünde en fazla ${window.LicenseConfig.studentLimit} öğrenci ekleyebilirsiniz!`, 'danger');
        } else {
          alert(`Demo sürümünde en fazla ${window.LicenseConfig.studentLimit} öğrenci ekleyebilirsiniz!`);
        }
        return null;
      }
    }
    const student = {
      id: 'std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: studentData.name,
      surname: studentData.surname,
      number: studentData.number,
      gender: studentData.gender || 'unspecified',
      parentPhone: studentData.parentPhone || '',
      notes: studentData.notes || '',
      branch: studentData.branch || '',
      createdAt: new Date().toISOString()
    };
    this.state.students.push(student);
    this.saveState();
    return student;
  }

  updateStudent(id, studentData) {
    const index = this.state.students.findIndex(s => s.id === id);
    if (index !== -1) {
      this.state.students[index] = {
        ...this.state.students[index],
        ...studentData
      };
      this.saveState();
      return true;
    }
    return false;
  }

  deleteStudent(id) {
    // Öğrenciyi sil
    this.state.students = this.state.students.filter(s => s.id !== id);
    // Öğrenciye ait performans kayıtlarını sil
    this.state.performance = this.state.performance.filter(p => p.studentId !== id);
    // Kitap transactions güncelle (öğrenci silindi bilgisini ekle ya da sil)
    this.state.books.transactions = this.state.books.transactions.filter(t => t.studentId !== id);
    // Ödevlerden bu öğrenciyi sil
    this.state.homeworks.forEach(hw => {
      if (hw.status && hw.status[id]) {
        delete hw.status[id];
      }
    });
    // Görevlerden bu öğrenciyi sil
    if (this.state.tasks) {
      this.state.tasks = this.state.tasks.filter(t => t.studentId !== id);
    }
    this.saveState();
  }

  // PERFORMANS İŞLEMLERİ
  addPerformance(studentId, type, point, reason, weekId) {
    const record = {
      id: 'perf_' + Date.now() + Math.random().toString(36).substr(2, 5),
      studentId,
      type, // 'positive' veya 'development'
      point: parseInt(point),
      reason,
      date: new Date().toISOString(),
      weekId: weekId || window.getISOWeek()
    };
    this.state.performance.push(record);
    this.saveState();
    return record;
  }

  deletePerformance(id) {
    this.state.performance = this.state.performance.filter(p => p.id !== id);
    this.saveState();
  }

  getStudentScore(studentId) {
    return this.state.performance
      .filter(p => p.studentId === studentId)
      .reduce((sum, p) => sum + p.point, 0);
  }

  getStudentWeeklyScore(studentId, weekId) {
    return this.state.performance
      .filter(p => {
        if (p.studentId !== studentId) return false;
        if (p.weekId) return p.weekId === weekId;
        if (p.homeworkId) {
          const hw = this.state.homeworks.find(h => h.id === p.homeworkId);
          if (hw) return window.getISOWeek(hw.dueDate) === weekId;
        }
        return window.getISOWeek(p.date) === weekId;
      })
      .reduce((sum, p) => sum + p.point, 0);
  }


  // ÖDEV İŞLEMLERİ
  addHomework(hwData) {
    const homework = {
      id: 'hw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: hwData.title,
      description: hwData.description || '',
      dueDate: hwData.dueDate,
      branch: hwData.branch || '',
      status: {}, // Key: studentId, Value: 'completed' (yapıldı), 'incomplete' (eksik), 'missing' (yapılmadı), 'excused' (muaf)
      createdAt: new Date().toISOString()
    };
    this.state.homeworks.push(homework);
    this.saveState();
    return homework;
  }

  updateHomework(id, hwData) {
    const index = this.state.homeworks.findIndex(h => h.id === id);
    if (index !== -1) {
      this.state.homeworks[index] = {
        ...this.state.homeworks[index],
        title: hwData.title,
        description: hwData.description || '',
        dueDate: hwData.dueDate
      };
      this.saveState();
      return true;
    }
    return false;
  }

  deleteHomework(id) {
    this.state.homeworks = this.state.homeworks.filter(h => h.id !== id);
    // Ödeve ait tüm performans kayıtlarını sil
    this.state.performance = this.state.performance.filter(p => p.homeworkId !== id);
    this.saveState();
  }

  getHomeworkSettings() {
    if (!this.state.homeworkSettings) {
      this.state.homeworkSettings = { completed: 4, incomplete: 2, missing: -4, excused: 0 };
    } else if (this.state.homeworkSettings.excused === undefined) {
      this.state.homeworkSettings.excused = 0;
    }
    return this.state.homeworkSettings;
  }

  updateHomeworkSettings(settings) {
    this.state.homeworkSettings = {
      completed: settings.completed !== undefined ? parseInt(settings.completed) : 4,
      incomplete: settings.incomplete !== undefined ? parseInt(settings.incomplete) : 2,
      missing: settings.missing !== undefined ? parseInt(settings.missing) : -4,
      excused: settings.excused !== undefined ? parseInt(settings.excused) : 0
    };

    // Mevcut tüm ödev performans kayıtlarının puanlarını yeni ayarlara göre güncelle
    this.state.performance.forEach(p => {
      if (p.homeworkId) {
        const hw = this.state.homeworks.find(h => h.id === p.homeworkId);
        if (hw && hw.status) {
          const status = hw.status[p.studentId];
          let updatedPoint = 0;
          let statusLabel = '';
          if (status === 'completed') {
            updatedPoint = this.state.homeworkSettings.completed;
            statusLabel = 'Tam';
          } else if (status === 'incomplete') {
            updatedPoint = this.state.homeworkSettings.incomplete;
            statusLabel = 'Yarım';
          } else if (status === 'missing') {
            updatedPoint = this.state.homeworkSettings.missing;
            statusLabel = 'Yapılmadı';
          } else if (status === 'excused') {
            updatedPoint = this.state.homeworkSettings.excused;
            statusLabel = 'Muaf';
          }
          
          p.point = updatedPoint;
          p.type = updatedPoint >= 0 ? 'positive' : 'development';
          p.reason = `"${hw.title}" Ödevi (${statusLabel})`;
        }
      }
    });

    this.saveState();
  }

  updateHomeworkStatus(homeworkId, studentId, status) {
    const hw = this.state.homeworks.find(h => h.id === homeworkId);
    if (hw) {
      if (!hw.status) hw.status = {};
      hw.status[studentId] = status;

      // Önce bu ödev ve öğrenci için var olan performans kaydını sil
      this.state.performance = this.state.performance.filter(
        p => !(p.homeworkId === homeworkId && p.studentId === studentId)
      );

      const settings = this.getHomeworkSettings();
      let points = 0;
      let statusLabel = '';
      let shouldAddRecord = false;

      if (status === 'completed') {
        points = settings.completed;
        statusLabel = 'Tam';
        shouldAddRecord = true;
      } else if (status === 'incomplete') {
        points = settings.incomplete;
        statusLabel = 'Yarım';
        shouldAddRecord = true;
      } else if (status === 'missing') {
        points = settings.missing;
        statusLabel = 'Yapılmadı';
        shouldAddRecord = true;
      } else if (status === 'excused') {
        points = settings.excused !== undefined ? settings.excused : 0;
        statusLabel = 'Muaf';
        shouldAddRecord = true;
      }

      if (shouldAddRecord) {
        const type = points >= 0 ? 'positive' : 'development';
        const record = {
          id: 'perf_' + Date.now() + Math.random().toString(36).substr(2, 5),
          studentId,
          type,
          point: points,
          reason: `"${hw.title}" Ödevi (${statusLabel})`,
          date: new Date().toISOString(),
          homeworkId
        };
        this.state.performance.push(record);
      }

      this.saveState();
      return true;
    }
    return false;
  }

  // KİTAP TAKİP İŞLEMLERİ
  addBook(bookData) {
    // Demo limit kontrolü
    if (window.LicenseConfig && window.LicenseConfig.isDemo) {
      if (this.state.books.library.length >= window.LicenseConfig.bookLimit) {
        if (window.showToast) {
          window.showToast(`Demo sürümünde kitaplığa en fazla ${window.LicenseConfig.bookLimit} kitap ekleyebilirsiniz!`, 'danger');
        } else {
          alert(`Demo sürümünde kitaplığa en fazla ${window.LicenseConfig.bookLimit} kitap ekleyebilirsiniz!`);
        }
        return null;
      }
    }
    const book = {
      id: 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: bookData.title,
      author: bookData.author || 'Bilinmiyor',
      pages: parseInt(bookData.pages) || 0,
      bookNo: bookData.bookNo || '',
      createdAt: new Date().toISOString()
    };
    this.state.books.library.push(book);
    this.saveState();
    return book;
  }

  deleteBook(id) {
    this.state.books.library = this.state.books.library.filter(b => b.id !== id);
    // Bu kitaba ait işlem geçmişini de temizle
    this.state.books.transactions = this.state.books.transactions.filter(t => t.bookId !== id);
    this.saveState();
  }

  updateBookQuestions(bookId, questions) {
    const book = this.state.books.library.find(b => b.id === bookId);
    if (book) {
      book.questions = questions;
      this.saveState();
      return { success: true };
    }
    return { success: false, message: 'Kitap bulunamadı.' };
  }

  borrowBook(studentId, bookId, borrowDate) {
    // Önce bu kitabın şu an birinde olup olmadığını kontrol edelim
    const isAlreadyBorrowed = this.state.books.transactions.some(
      t => t.bookId === bookId && t.status === 'reading'
    );
    if (isAlreadyBorrowed) {
      return { success: false, message: 'Bu kitap şu anda başka bir öğrencide.' };
    }

    // Öğrencinin teslim etmediği başka kitap var mı? (Bilgi amaçlı, engel değil ama kontrol edilebilir)
    const transaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      studentId,
      bookId,
      borrowDate: borrowDate || formatLocalDate(),
      returnDate: null,
      status: 'reading' // 'reading' (okuyor), 'returned' (teslim etti)
    };
    this.state.books.transactions.push(transaction);
    this.saveState();
    return { success: true, transaction };
  }

  returnBook(transactionId, returnDate) {
    const tx = this.state.books.transactions.find(t => t.id === transactionId);
    if (tx) {
      tx.returnDate = returnDate || formatLocalDate();
      tx.status = 'returned';
      this.saveState();
      return true;
    }
    return false;
  }

  cancelBorrow(transactionId) {
    const initialLength = this.state.books.transactions.length;
    this.state.books.transactions = this.state.books.transactions.filter(t => t.id !== transactionId);
    if (this.state.books.transactions.length < initialLength) {
      this.saveState();
      return true;
    }
    return false;
  }

  // HAFTALIK DEĞERLENDİRME İŞLEMLERİ
  saveWeeklyEvaluation(weekId, examName, examScores, notes) {
    const index = this.state.weeklyEvaluations.findIndex(w => w.weekId === weekId);
    const evaluation = {
      weekId,
      examName,
      examScores, // key: studentId, value: number
      notes,
      updatedAt: new Date().toISOString()
    };

    if (index !== -1) {
      this.state.weeklyEvaluations[index] = evaluation;
    } else {
      this.state.weeklyEvaluations.push(evaluation);
    }

    // Bu haftaya ait eski sınav derece ödüllerini Dojo performans akışından temizle
    this.state.performance = this.state.performance.filter(p => p.weekId === weekId && !p.examId);

    // Yeni derece ödüllerini hesapla ve ekle
    const settings = this.getWeeklyExamSettings();
    const studentScoreList = [];
    
    for (const stdId in examScores) {
      const val = parseFloat(examScores[stdId]);
      if (!isNaN(val) && val >= 0) {
        studentScoreList.push({ studentId: stdId, score: val });
      }
    }

    // Skorlara göre büyükten küçüğe sırala
    studentScoreList.sort((a, b) => b.score - a.score);

      // Eşitlikleri gözeten sıralama ve ödüllendirme mantığı (Ranks)
      let currentRank = 0;
      let lastScore = null;
      
      studentScoreList.forEach(item => {
        if (item.score !== lastScore) {
          currentRank++;
          lastScore = item.score;
        }
        
        let rewardPoint = 0;
        let reasonLabel = '';
        
        if (currentRank <= settings.topCount) {
          rewardPoint = settings.rankPoints[currentRank] || 0;
          reasonLabel = `Haftalık Sınav ${currentRank}.liği (${examName || 'İsimsiz Sınav'})`;
        }
      
      if (rewardPoint > 0) {
        this.state.performance.push({
          id: 'perf_' + Date.now() + Math.random().toString(36).substr(2, 5),
          studentId: item.studentId,
          type: 'positive',
          point: rewardPoint,
          reason: reasonLabel,
          date: new Date().toISOString(),
          weekId: weekId
        });
      }
    });

    this.saveState();
    return evaluation;
  }

  saveExam(examData) {
    const index = this.state.weeklyEvaluations.findIndex(e => e.id === examData.id);
    if (index !== -1) {
      this.state.weeklyEvaluations[index] = examData;
    } else {
      this.state.weeklyEvaluations.push(examData);
    }

    // Bu sınava ait eski derece ödüllerini Dojo performans akışından temizle
    this.state.performance = this.state.performance.filter(p => p.examId !== examData.id);

    // Yeni derece ödüllerini hesapla ve ekle
    const settings = this.getWeeklyExamSettings();
    const studentScoreList = [];
    
    for (const stdId in examData.examScores) {
      const val = parseFloat(examData.examScores[stdId]);
      if (!isNaN(val) && val >= 0) {
        studentScoreList.push({ studentId: stdId, score: val });
      }
    }

    // Skorlara göre büyükten küçüğe sırala
    studentScoreList.sort((a, b) => b.score - a.score);

    // Eşitlikleri gözeten sıralama ve ödüllendirme mantığı (Ranks)
    let currentRank = 0;
    let lastScore = null;
    
    studentScoreList.forEach(item => {
      if (item.score !== lastScore) {
        currentRank++;
        lastScore = item.score;
      }
      
      let rewardPoint = 0;
      let reasonLabel = '';
      
      if (currentRank <= settings.topCount) {
        rewardPoint = settings.rankPoints[currentRank] || 0;
        reasonLabel = `"${examData.examName}" Sınavı ${currentRank}.liği`;
      }
      
      if (rewardPoint > 0) {
        this.state.performance.push({
          id: 'perf_' + Date.now() + Math.random().toString(36).substr(2, 5),
          studentId: item.studentId,
          type: 'positive',
          point: rewardPoint,
          reason: reasonLabel,
          date: new Date().toISOString(),
          weekId: examData.weekId,
          examId: examData.id
        });
      }
    });

    this.saveState();
    return examData;
  }

  deleteExam(examId) {
    this.state.weeklyEvaluations = this.state.weeklyEvaluations.filter(e => e.id !== examId);
    // Bu sınava ait ödülleri Dojo performans akışından da sil
    this.state.performance = this.state.performance.filter(p => p.examId !== examId);
    this.saveState();
  }

  getWeeklyEvaluation(weekId) {
    return this.state.weeklyEvaluations.find(w => w.weekId === weekId) || null;
  }

  getWeeklyExamSettings() {
    if (!this.state.weeklyExamSettings) {
      this.state.weeklyExamSettings = { topCount: 3, rankPoints: { 1: 10, 2: 7, 3: 4 } };
    } else if (this.state.weeklyExamSettings.topCount === undefined) {
      const old = this.state.weeklyExamSettings;
      this.state.weeklyExamSettings = {
        topCount: 3,
        rankPoints: {
          1: old.first !== undefined ? old.first : 10,
          2: old.second !== undefined ? old.second : 7,
          3: old.third !== undefined ? old.third : 4
        }
      };
    }
    return this.state.weeklyExamSettings;
  }

  updateWeeklyExamSettings(settings) {
    this.state.weeklyExamSettings = {
      topCount: parseInt(settings.topCount) || 3,
      rankPoints: settings.rankPoints || { 1: 10, 2: 7, 3: 4 }
    };

    const examSettings = this.getWeeklyExamSettings();

    // Geriye dönük tüm sınav ödüllerini yeni puanlara göre yeniden hesapla
    this.state.weeklyEvaluations.forEach(evalItem => {
      const weekId = evalItem.weekId;
      const examName = evalItem.examName;
      const examScores = evalItem.examScores || {};

      const studentScoreList = [];
      for (const stdId in examScores) {
        const val = parseFloat(examScores[stdId]);
        if (!isNaN(val) && val >= 0) {
          studentScoreList.push({ studentId: stdId, score: val });
        }
      }

      studentScoreList.sort((a, b) => b.score - a.score);

      if (evalItem.id) {
        this.state.performance = this.state.performance.filter(p => p.examId !== evalItem.id);
        
        let currentRank = 0;
        let lastScore = null;
        
        studentScoreList.forEach(item => {
          if (item.score !== lastScore) {
            currentRank++;
            lastScore = item.score;
          }
          
          let rewardPoint = 0;
          let reasonLabel = '';
          
          if (currentRank <= examSettings.topCount) {
            rewardPoint = examSettings.rankPoints[currentRank] || 0;
            reasonLabel = `"${examName}" Sınavı ${currentRank}.liği`;
          }
          
          if (rewardPoint > 0) {
            this.state.performance.push({
              id: 'perf_' + Date.now() + Math.random().toString(36).substr(2, 5),
              studentId: item.studentId,
              type: 'positive',
              point: rewardPoint,
              reason: reasonLabel,
              date: new Date().toISOString(),
              weekId: weekId,
              examId: evalItem.id
            });
          }
        });
      } else {
        this.state.performance = this.state.performance.filter(p => !(p.weekId === weekId && !p.examId));
        
        let currentRank = 0;
        let lastScore = null;
        
        studentScoreList.forEach(item => {
          if (item.score !== lastScore) {
            currentRank++;
            lastScore = item.score;
          }
          
          let rewardPoint = 0;
          let reasonLabel = '';
          
          if (currentRank <= examSettings.topCount) {
            rewardPoint = examSettings.rankPoints[currentRank] || 0;
            reasonLabel = `Haftalık Sınav ${currentRank}.liği (${examName || 'İsimsiz Sınav'})`;
          }
          
          if (rewardPoint > 0) {
            this.state.performance.push({
              id: 'perf_' + Date.now() + Math.random().toString(36).substr(2, 5),
              studentId: item.studentId,
              type: 'positive',
              point: rewardPoint,
              reason: reasonLabel,
              date: new Date().toISOString(),
              weekId: weekId
            });
          }
        });
      }
    });

    this.saveState();
  }

  getBookSettings() {
    if (!this.state.bookSettings) {
      this.state.bookSettings = { limitDays: 15, onTimePoints: 2, latePoints: 0 };
    }
    return this.state.bookSettings;
  }

  updateBookSettings(settings) {
    this.state.bookSettings = {
      limitDays: parseInt(settings.limitDays) || 15,
      onTimePoints: settings.onTimePoints !== undefined ? parseInt(settings.onTimePoints) : 2,
      latePoints: settings.latePoints !== undefined ? parseInt(settings.latePoints) : 0
    };
    this.saveState();
  }

  getPerformanceBehaviors() {
    if (!this.state.performanceBehaviors) {
      this.state.performanceBehaviors = {
        positive: [
          { name: 'Derse Katılım', point: 1, icon: '🌟' },
          { name: 'Arkadaşlık / Yardımlaşma', point: 2, icon: '🤝' },
          { name: 'Temiz ve Düzenli', point: 1, icon: '🧼' },
          { name: 'Kitap Okuma', point: 2, icon: '📚' },
          { name: 'Ödevini Tam Yapma', point: 1, icon: '✅' },
          { name: 'Görev Bilinci / Sorumluluk', point: 2, icon: '🎯' },
          { name: 'Örnek Davranış', point: 3, icon: '🏆' },
          { name: 'Kitap Aferinleri', point: 0, icon: '📖' }
        ],
        development: [
          { name: 'Sınıf Düzenini Bozma', point: -1, icon: '📣' },
          { name: 'Derse Geç Kalma', point: -1, icon: '⏰' },
          { name: 'Malzemelerini Getirmeme', point: -1, icon: '🎒' },
          { name: 'Ödevini Yapmama', point: -1, icon: '❌' },
          { name: 'Arkadaşlarına Saygısızlık', point: -2, icon: '⚠️' },
          { name: 'Hazırlıksız Gelme', point: -1, icon: '📝' }
        ]
      };
    } else {
      let changed = false;
      if (this.state.performanceBehaviors.positive) {
        // Rename old behavior
        this.state.performanceBehaviors.positive.forEach(b => {
          if (b.name === 'Kitap Okuma Öncüsü') {
            b.name = 'Kitap Okuma';
            changed = true;
          }
        });
        
        // Ensure new behaves exist
        if (!this.state.performanceBehaviors.positive.some(b => b.name === 'Kitap Okuma')) {
          this.state.performanceBehaviors.positive.push({ name: 'Kitap Okuma', point: 2, icon: '📚' });
          changed = true;
        }
        
        if (!this.state.performanceBehaviors.positive.some(b => b.name === 'Kitap Aferinleri')) {
          this.state.performanceBehaviors.positive.push({ name: 'Kitap Aferinleri', point: 0, icon: '📖' });
          changed = true;
        }
      }
      if (changed) {
        this.saveState();
      }
    }
    return this.state.performanceBehaviors;
  }

  updatePerformanceBehaviors(behaviors) {
    this.state.performanceBehaviors = behaviors;
    this.saveState();
  }

  // GÖREV İŞLEMLERİ
  addTaskAssignment(studentId, description, points, dueDate) {
    const assignment = {
      id: 'task_asm_' + Date.now() + Math.random().toString(36).substr(2, 5),
      studentId,
      description,
      points: parseInt(points) || 0,
      dueDate,
      status: 'active', // 'active' (devam ediyor), 'completed' (teslim edildi)
      completedDate: null,
      performanceId: null,
      createdAt: new Date().toISOString()
    };
    if (!this.state.tasks) {
      this.state.tasks = [];
    }
    this.state.tasks.push(assignment);
    this.saveState();
    return assignment;
  }

  completeTaskAssignment(id, completedDate) {
    if (!this.state.tasks) return false;
    const task = this.state.tasks.find(t => t.id === id);
    if (task) {
      task.status = 'completed';
      task.completedDate = completedDate || window.formatLocalDate();
      
      // Öğrencinin Dojo performans akışına puan ekle
      const weekId = window.getISOWeek(task.completedDate);
      
      const perfRecord = this.addPerformance(
        task.studentId,
        task.points >= 0 ? 'positive' : 'development',
        task.points,
        `"${task.description}" Görevi Teslim Edildi`,
        weekId
      );
      
      // Performans kaydının id'sini göreve bağla
      task.performanceId = perfRecord.id;
      this.saveState();
      return true;
    }
    return false;
  }

  undoTaskAssignmentCompletion(id) {
    if (!this.state.tasks) return false;
    const task = this.state.tasks.find(t => t.id === id);
    if (task && task.status === 'completed') {
      if (task.performanceId) {
        this.deletePerformance(task.performanceId);
      }
      task.status = 'active';
      task.completedDate = null;
      task.performanceId = null;
      this.saveState();
      return true;
    }
    return false;
  }

  deleteTaskAssignment(id) {
    if (!this.state.tasks) return;
    const task = this.state.tasks.find(t => t.id === id);
    if (task) {
      if (task.status === 'completed' && task.performanceId) {
        this.deletePerformance(task.performanceId);
      }
      this.state.tasks = this.state.tasks.filter(t => t.id !== id);
      this.saveState();
    }
  }

  getSelectedWeek() {
    let selected = localStorage.getItem('selected_week');
    let lastSetReal = localStorage.getItem('last_set_real_week');
    const currentReal = window.getISOWeek();
    
    if (!selected) {
      selected = currentReal;
      lastSetReal = currentReal;
      localStorage.setItem('selected_week', selected);
      localStorage.setItem('last_set_real_week', lastSetReal);
      return selected;
    }
    
    if (!lastSetReal) {
      lastSetReal = currentReal;
      localStorage.setItem('last_set_real_week', lastSetReal);
    }
    
    // Check if real week has progressed
    if (currentReal !== lastSetReal) {
      const diff = this.getWeeksDiff(lastSetReal, currentReal);
      if (diff > 0) {
        selected = this.addWeeks(selected, diff);
        localStorage.setItem('selected_week', selected);
      }
      localStorage.setItem('last_set_real_week', currentReal);
    }
    
    return selected;
  }

  setSelectedWeek(weekStr) {
    const currentReal = window.getISOWeek();
    localStorage.setItem('selected_week', weekStr);
    localStorage.setItem('last_set_real_week', currentReal);
    this.notify();
    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);
  }

  getWeeksDiff(weekStr1, weekStr2) {
    if (weekStr1 === weekStr2) return 0;
    const parts1 = weekStr1.split('-W');
    const parts2 = weekStr2.split('-W');
    if (parts1.length !== 2 || parts2.length !== 2) return 0;
    
    const y1 = parseInt(parts1[0]);
    const w1 = parseInt(parts1[1]);
    const y2 = parseInt(parts2[0]);
    const w2 = parseInt(parts2[1]);
    
    const d1 = window.getDayInWeek(y1, w1, 4);
    const d2 = window.getDayInWeek(y2, w2, 4);
    
    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
  }

  addWeeks(weekStr, numWeeks) {
    const parts = weekStr.split('-W');
    if (parts.length !== 2) return weekStr;
    const year = parseInt(parts[0]);
    const week = parseInt(parts[1]);
    const date = window.getDayInWeek(year, week, 4);
    date.setDate(date.getDate() + (numWeeks * 7));
    return window.getISOWeek(date);
  }

  getDutyRoster() {
    return this.state.dutyRoster;
  }

  saveDutyRoster(rosterData) {
    this.state.dutyRoster = rosterData;
    this.saveState();
  }

  clearDutyRoster() {
    this.state.dutyRoster = null;
    this.saveState();
  }

  // PLAN TAKİP İŞLEMLERİ
  addPlan(planData) {
    // Demo limit kontrolü
    if (window.LicenseConfig && window.LicenseConfig.isDemo) {
      const currentPlans = this.state.plans || [];
      if (currentPlans.length >= window.LicenseConfig.planLimit) {
        if (window.showToast) {
          window.showToast(`Demo sürümünde en fazla ${window.LicenseConfig.planLimit} yıllık plan ekleyebilirsiniz!`, 'danger');
        } else {
          alert(`Demo sürümünde en fazla ${window.LicenseConfig.planLimit} yıllık plan ekleyebilirsiniz!`);
        }
        return null;
      }
    }
    const plan = {
      id: 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: planData.title || `${planData.className} - ${planData.courseName}`,
      educationYear: planData.educationYear || "2025-2026",
      className: planData.className || "3/A",
      courseName: planData.courseName || planData.title,
      weeklySchedule: planData.weeklySchedule || planData.weeks || [],
      createdAt: new Date().toISOString()
    };
    if (!this.state.plans) this.state.plans = [];
    this.state.plans.push(plan);
    this.saveState();
    return plan;
  }

  deletePlan(planId) {
    if (!this.state.plans) this.state.plans = [];
    this.state.plans = this.state.plans.filter(p => p.id !== planId);
    this.saveState();
  }

  toggleWeekCompleted(planId, weekIndex) {
    if (!this.state.plans) return false;
    const plan = this.state.plans.find(p => p.id === planId);
    if (plan) {
      const schedule = plan.weeklySchedule || plan.weeks || [];
      if (schedule && schedule[weekIndex]) {
        if (schedule[weekIndex].isCompleted !== undefined) {
          schedule[weekIndex].isCompleted = !schedule[weekIndex].isCompleted;
          schedule[weekIndex].completed = schedule[weekIndex].isCompleted;
        } else {
          schedule[weekIndex].completed = !schedule[weekIndex].completed;
          schedule[weekIndex].isCompleted = schedule[weekIndex].completed;
        }
        this.saveState();
        return true;
      }
    }
    return false;
  }

  updatePlanTitle(planId, newTitle) {
    if (!this.state.plans) return false;
    const plan = this.state.plans.find(p => p.id === planId);
    if (plan) {
      plan.title = newTitle;
      this.saveState();
      return true;
    }
    return false;
  }

  // EVRAK İŞLEMLERİ (DOCUMENTS)
  addDocument(docData) {
    const doc = {
      id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: docData.title,
      fileName: docData.fileName,
      fileSize: docData.fileSize,
      fileType: docData.fileType,
      content: docData.content, // base64 string
      htmlContent: docData.htmlContent || '',
      createdAt: new Date().toISOString()
    };
    if (!this.state.documents) this.state.documents = [];
    this.state.documents.push(doc);
    this.saveState();
    return doc;
  }

  deleteDocument(docId) {
    if (!this.state.documents) this.state.documents = [];
    this.state.documents = this.state.documents.filter(d => d.id !== docId);
    this.saveState();
  }

  updateDocumentTitle(docId, newTitle) {
    if (!this.state.documents) return false;
    const doc = this.state.documents.find(d => d.id === docId);
    if (doc) {
      doc.title = newTitle;
      this.saveState();
      return true;
    }
    return false;
  }

  // DERS PROGRAMI VE DERS TANIMLAMA İŞLEMLERİ
  getLessons() {
    if (!this.state.definedLessons) {
      this.state.definedLessons = JSON.parse(JSON.stringify(DEFAULT_STATE.definedLessons));
      this.saveState();
    }
    return this.state.definedLessons;
  }

  saveLesson(lessonData) {
    if (!this.state.definedLessons) {
      this.state.definedLessons = JSON.parse(JSON.stringify(DEFAULT_STATE.definedLessons));
    }
    if (lessonData.id) {
      // Düzenleme
      const index = this.state.definedLessons.findIndex(l => l.id === lessonData.id);
      if (index !== -1) {
        this.state.definedLessons[index] = { ...this.state.definedLessons[index], ...lessonData };
      }
    } else {
      // Ekleme
      const newLesson = {
        id: 'lesson_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: lessonData.name,
        color: lessonData.color || '#3b82f6'
      };
      this.state.definedLessons.push(newLesson);
    }
    this.saveState();
  }

  deleteLesson(lessonId) {
    if (!this.state.definedLessons) return;
    this.state.definedLessons = this.state.definedLessons.filter(l => l.id !== lessonId);
    
    // Ders programı ızgarasından da sil
    if (this.state.scheduleGrid) {
      for (const key in this.state.scheduleGrid) {
        if (this.state.scheduleGrid[key] === lessonId) {
          this.state.scheduleGrid[key] = '';
        }
      }
    }
    this.saveState();
  }

  getScheduleTimes() {
    if (!this.state.scheduleTimes) {
      this.state.scheduleTimes = JSON.parse(JSON.stringify(DEFAULT_STATE.scheduleTimes));
      this.saveState();
    } else {
      // Eksik periyotları (örn: p7) DEFAULT_STATE'ten doldur
      let updated = false;
      for (const key in DEFAULT_STATE.scheduleTimes) {
        if (!this.state.scheduleTimes[key]) {
          this.state.scheduleTimes[key] = JSON.parse(JSON.stringify(DEFAULT_STATE.scheduleTimes[key]));
          updated = true;
        }
      }
      if (updated) {
        this.saveState();
      }
    }
    return this.state.scheduleTimes;
  }

  saveScheduleTimes(timesData) {
    this.state.scheduleTimes = { ...this.getScheduleTimes(), ...timesData };
    this.saveState();
  }

  getScheduleGrid() {
    return this.state.scheduleGrid || {};
  }

  saveScheduleCell(day, period, lessonId) {
    if (!this.state.scheduleGrid) {
      this.state.scheduleGrid = {};
    }
    this.state.scheduleGrid[`${day}-${period}`] = lessonId;
    this.saveState();
  }

  clearScheduleGrid() {
    this.state.scheduleGrid = {};
    this.saveState();
  }

  // NOTEBOOKS CRUD
  getNotebooks(studentId = null) {
    if (!this.state.notebooks) {
      this.state.notebooks = [];
    }
    if (studentId) {
      return this.state.notebooks.filter(nb => nb.studentId === studentId);
    }
    return this.state.notebooks;
  }

  saveNotebook(notebookData) {
    if (!this.state.notebooks) {
      this.state.notebooks = [];
    }
    if (notebookData.id) {
      // Edit/Update
      const index = this.state.notebooks.findIndex(nb => nb.id === notebookData.id);
      if (index !== -1) {
        this.state.notebooks[index] = { 
          ...this.state.notebooks[index], 
          ...notebookData,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      // Demo sınır kontrolü
      if (window.LicenseConfig && window.LicenseConfig.isDemo) {
        if (this.state.notebooks.length >= window.LicenseConfig.notebookLimit) {
          if (window.showToast) {
            window.showToast(`Demo sürümünde en fazla ${window.LicenseConfig.notebookLimit} defter oluşturabilirsiniz!`, 'danger');
          } else {
            alert(`Demo sürümünde en fazla ${window.LicenseConfig.notebookLimit} defter oluşturabilirsiniz!`);
          }
          return null;
        }
      }
      // Create new
      const newNotebook = {
        id: 'notebook_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: notebookData.title || 'Yeni Defter',
        type: notebookData.type || 'lined',
        studentId: notebookData.studentId,
        content: notebookData.content || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.state.notebooks.push(newNotebook);
      notebookData.id = newNotebook.id; // pass back the new ID
    }
    this.saveState();
    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);
    return notebookData;
  }

  deleteNotebook(notebookId) {
    if (!this.state.notebooks) return;
    this.state.notebooks = this.state.notebooks.filter(nb => nb.id !== notebookId);
    this.saveState();
    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);
  }
}

window.stateManager = new StateManager();
})();

