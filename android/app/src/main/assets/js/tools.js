(() => {
// Sınıf Yardımcı Araçları Mantık Dosyası

let toastCallbackFn = null;
let holidaysList = [];

// DOM Elemanları
let toolsLandingView;
let toolsRosterView;
let toolsPlansView;
let toolsDocumentsView;

let btnLaunchRoster;
let btnBackToTools;
let btnLaunchPlans;
let btnBackToToolsFromPlans;
let btnLaunchDocuments;
let btnBackToToolsFromDocuments;

let rosterStartDate;
let rosterEndDate;
let rosterSkipWeekends;
let rosterSortOrder;
let rosterHolidayInput;
let btnAddHoliday;
let rosterHolidaysList;
let btnGenerateRoster;
let btnClearRoster;
let btnPrintRoster;
let rosterPreviewContainer;
let rosterEmptyState;
let rosterPreviewContent;
let rosterStudentCount;

function setupToolsTab(toastCallback) {
  toastCallbackFn = toastCallback;

  // DOM elemanlarını bağla
  toolsLandingView = document.getElementById('tools-landing-view');
  toolsRosterView = document.getElementById('tools-roster-view');
  toolsPlansView = document.getElementById('tools-plans-view');
  toolsDocumentsView = document.getElementById('tools-documents-view');

  btnLaunchRoster = document.getElementById('btn-launch-roster');
  btnBackToTools = document.getElementById('btn-back-to-tools');
  btnLaunchPlans = document.getElementById('btn-launch-plans');
  btnBackToToolsFromPlans = document.getElementById('btn-back-to-tools-from-plans');
  btnLaunchDocuments = document.getElementById('btn-launch-documents');
  btnBackToToolsFromDocuments = document.getElementById('btn-back-to-tools-from-documents');

  rosterStartDate = document.getElementById('roster-start-date');
  rosterEndDate = document.getElementById('roster-end-date');
  rosterSkipWeekends = document.getElementById('roster-skip-weekends');
  rosterSortOrder = document.getElementById('roster-sort-order');
  rosterHolidayInput = document.getElementById('roster-holiday-input');
  btnAddHoliday = document.getElementById('btn-add-holiday');
  rosterHolidaysList = document.getElementById('roster-holidays-list');
  btnGenerateRoster = document.getElementById('btn-generate-roster');
  btnClearRoster = document.getElementById('btn-clear-roster');
  btnPrintRoster = document.getElementById('btn-print-roster');
  rosterPreviewContainer = document.getElementById('roster-preview-container');
  rosterEmptyState = document.getElementById('roster-empty-state');
  rosterPreviewContent = document.getElementById('roster-preview-content');
  rosterStudentCount = document.getElementById('roster-student-count');

  // Varsayılan tarihleri ayarla (Bugün ve 2 hafta sonrası)
  const today = new Date();
  const twoWeeksLater = new Date();
  twoWeeksLater.setDate(today.getDate() + 14);

  if (rosterStartDate) rosterStartDate.value = today.toISOString().slice(0, 10);
  if (rosterEndDate) rosterEndDate.value = twoWeeksLater.toISOString().slice(0, 10);

  // Olay Dinleyicileri - Nöbet Listesi Navigasyonu
  if (btnLaunchRoster) {
    btnLaunchRoster.addEventListener('click', () => {
      toolsLandingView.style.display = 'none';
      toolsRosterView.style.display = 'block';
      renderTools();
    });
  }

  if (btnBackToTools) {
    btnBackToTools.addEventListener('click', () => {
      toolsRosterView.style.display = 'none';
      toolsLandingView.style.display = 'block';
    });
  }

  // Ders Planı Navigasyonu
  if (btnLaunchPlans && toolsPlansView && toolsLandingView) {
    btnLaunchPlans.addEventListener('click', () => {
      toolsLandingView.style.display = 'none';
      toolsPlansView.style.display = 'block';
    });
  }

  if (btnBackToToolsFromPlans && toolsPlansView && toolsLandingView) {
    btnBackToToolsFromPlans.addEventListener('click', () => {
      toolsPlansView.style.display = 'none';
      toolsLandingView.style.display = 'block';
    });
  }

  // Evrak Deposu Navigasyonu
  if (btnLaunchDocuments && toolsDocumentsView && toolsLandingView) {
    btnLaunchDocuments.addEventListener('click', () => {
      toolsLandingView.style.display = 'none';
      toolsDocumentsView.style.display = 'block';
    });
  }

  if (btnBackToToolsFromDocuments && toolsDocumentsView && toolsLandingView) {
    btnBackToToolsFromDocuments.addEventListener('click', () => {
      toolsDocumentsView.style.display = 'none';
      toolsLandingView.style.display = 'block';
    });
  }

  // Nöbet Listesi Form Olayları
  if (btnAddHoliday) {
    btnAddHoliday.addEventListener('click', () => {
      addHolidayDate();
    });
  }

  if (btnGenerateRoster) {
    btnGenerateRoster.addEventListener('click', () => {
      generateDutyRoster();
    });
  }

  if (btnClearRoster) {
    btnClearRoster.addEventListener('click', () => {
      if (confirm('Mevcut nöbet listesini silmek istediğinize emin misiniz?')) {
        stateManager.clearDutyRoster();
        renderTools();
        if (toastCallbackFn) toastCallbackFn('Nöbet listesi temizlendi.', 'info');
      }
    });
  }

  if (btnPrintRoster) {
    btnPrintRoster.addEventListener('click', () => {
      const printContent = document.getElementById('roster-preview-content').innerHTML;
      const printContainer = document.querySelector('.roster-report-print');
      if (printContainer) {
        printContainer.innerHTML = printContent;
      }
      document.body.classList.add('print-roster');
      window.print();
      
      window.addEventListener('afterprint', () => {
        document.body.classList.remove('print-roster');
      }, { once: true });

      setTimeout(() => {
        document.body.classList.remove('print-roster');
      }, 10000);
    });
  }
}

// Tatil günü ekleme
function addHolidayDate() {
  if (!rosterHolidayInput) return;
  const dateStr = rosterHolidayInput.value;
  if (!dateStr) {
    if (toastCallbackFn) toastCallbackFn('Lütfen geçerli bir tatil tarihi seçin.', 'warning');
    return;
  }

  if (holidaysList.includes(dateStr)) {
    if (toastCallbackFn) toastCallbackFn('Bu tarih zaten tatil listesinde ekli.', 'warning');
    return;
  }

  holidaysList.push(dateStr);
  rosterHolidayInput.value = '';
  renderHolidaysList();
}

// Tatil günleri rozetlerini çizme
function renderHolidaysList() {
  if (!rosterHolidaysList) return;
  rosterHolidaysList.innerHTML = '';
  
  // Tarihe göre sırala
  holidaysList.sort().forEach(hStr => {
    const d = new Date(hStr);
    const formatted = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    
    const badge = document.createElement('div');
    badge.className = 'holiday-badge';
    badge.innerHTML = `
      <span>${formatted}</span>
      <button type="button" data-date="${hStr}" title="Sil">&times;</button>
    `;
    
    badge.querySelector('button').addEventListener('click', (e) => {
      const dateToRemove = e.target.getAttribute('data-date');
      holidaysList = holidaysList.filter(x => x !== dateToRemove);
      renderHolidaysList();
    });
    
    rosterHolidaysList.appendChild(badge);
  });
}

// Nöbet Listesi Oluşturma Algoritması
function generateDutyRoster() {
  const startStr = rosterStartDate.value;
  const endStr = rosterEndDate.value;
  const skipWeekends = rosterSkipWeekends.checked;
  const sortOrder = rosterSortOrder.value;

  if (!startStr || !endStr) {
    if (toastCallbackFn) toastCallbackFn('Lütfen başlangıç ve bitiş tarihlerini girin.', 'danger');
    return;
  }

  const start = new Date(startStr);
  const end = new Date(endStr);
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);

  if (start > end) {
    if (toastCallbackFn) toastCallbackFn('Başlangıç tarihi bitiş tarihinden sonra olamaz!', 'danger');
    return;
  }

  const state = stateManager.loadState();
  const activeStudents = state.students;

  const studentCountPerDay = rosterStudentCount ? parseInt(rosterStudentCount.value) : 2;
  if (isNaN(studentCountPerDay) || studentCountPerDay < 1) {
    if (toastCallbackFn) toastCallbackFn('Lütfen geçerli bir günlük görevli sayısı girin.', 'danger');
    return;
  }

  if (activeStudents.length < studentCountPerDay) {
    if (toastCallbackFn) toastCallbackFn(`Nöbet listesi hazırlamak için sınıfta en az ${studentCountPerDay} öğrenci olmalıdır!`, 'danger');
    return;
  }

  // Öğrenci havuzunu sıralama tercihine göre hazırla
  let studentsPool = [...activeStudents];
  if (sortOrder === 'alphabetical') {
    studentsPool.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  } else if (sortOrder === 'random') {
    studentsPool = shuffleArray(studentsPool);
  } else if (sortOrder === 'current') {
    // default state.students sorting is retained
  }

  const assignments = [];
  let poolIndex = 0;
  
  // Gün gün ilerle
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0: Pazar, 6: Cumartesi
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const dateStr = current.toISOString().slice(0, 10);
    const isHoliday = holidaysList.includes(dateStr);

    if ((isWeekend && skipWeekends) || isHoliday) {
      // Bu günü atla
      current.setDate(current.getDate() + 1);
      continue;
    }

    // Bu güne studentCountPerDay öğrenci ata (Adil Sıralı Döngü)
    const dayStudentIds = [];
    for (let s = 0; s < studentCountPerDay; s++) {
      const student = studentsPool[(poolIndex + s) % studentsPool.length];
      dayStudentIds.push(student.id);
    }
    
    assignments.push({
      date: dateStr,
      studentIds: dayStudentIds
    });

    poolIndex += studentCountPerDay;
    current.setDate(current.getDate() + 1);
  }

  if (assignments.length === 0) {
    if (toastCallbackFn) toastCallbackFn('Seçilen tarih aralığında nöbet yazılacak uygun gün bulunamadı (Tüm günler tatil veya hafta sonu olabilir).', 'warning');
    return;
  }

  const rosterData = {
    startDate: startStr,
    endDate: endStr,
    skipWeekends: skipWeekends,
    sortOrder: sortOrder,
    studentCountPerDay: studentCountPerDay,
    holidays: [...holidaysList],
    assignments: assignments
  };

  stateManager.saveDutyRoster(rosterData);
  drawRosterPreview(rosterData);
  if (toastCallbackFn) toastCallbackFn('Nöbet listesi başarıyla oluşturuldu ve kaydedildi.', 'success');
}

// Roster Çizimi
function drawRosterPreview(rosterData) {
  const state = stateManager.loadState();
  const students = state.students;

  if (!rosterData || !rosterData.assignments || rosterData.assignments.length === 0) {
    if (rosterEmptyState) rosterEmptyState.style.display = 'block';
    if (rosterPreviewContent) rosterPreviewContent.style.display = 'none';
    if (btnClearRoster) btnClearRoster.style.display = 'none';
    if (btnPrintRoster) btnPrintRoster.style.display = 'none';
    return;
  }

  if (rosterEmptyState) rosterEmptyState.style.display = 'none';
  if (rosterPreviewContent) rosterPreviewContent.style.display = 'block';
  if (btnClearRoster) btnClearRoster.style.display = 'block';
  if (btnPrintRoster) btnPrintRoster.style.display = 'block';

  // Form elemanlarını mevcut roster parametreleriyle güncelle
  if (rosterStartDate) rosterStartDate.value = rosterData.startDate;
  if (rosterEndDate) rosterEndDate.value = rosterData.endDate;
  if (rosterSkipWeekends) rosterSkipWeekends.checked = rosterData.skipWeekends;
  if (rosterSortOrder) rosterSortOrder.value = rosterData.sortOrder;
  if (rosterStudentCount) rosterStudentCount.value = rosterData.studentCountPerDay || 2;
  
  holidaysList = rosterData.holidays || [];
  renderHolidaysList();

  // Kağıt Tasarımını Çiz
  const dStart = new Date(rosterData.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const dEnd = new Date(rosterData.endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  rosterPreviewContent.innerHTML = `
    <div class="roster-print-header">
      <h1>SINIF NÖBET ÇİZELGESİ</h1>
      <div class="roster-meta">Tarih Aralığı: ${dStart} - ${dEnd}</div>
    </div>
    <div class="roster-print-grid" id="roster-grid-items">
      <!-- Gün kartları dinamik eklenecektir -->
    </div>
  `;

  const grid = document.getElementById('roster-grid-items');

  rosterData.assignments.forEach((assignment, index) => {
    // Geriye dönük uyumluluk migrasyonu
    if (!assignment.studentIds) {
      assignment.studentIds = [];
      if (assignment.student1Id) assignment.studentIds.push(assignment.student1Id);
      if (assignment.student2Id) assignment.studentIds.push(assignment.student2Id);
    }

    // Öğrencileri bul
    const dayStudents = assignment.studentIds.map(sid => {
      return students.find(s => s.id === sid) || { id: sid, name: 'Bilinmeyen', surname: 'Öğrenci', number: '-', gender: 'male', photo: null };
    });

    const dateFormatted = new Date(assignment.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const dayCard = document.createElement('div');
    dayCard.className = 'roster-print-day';
    
    // Öğrenciler için html
    const renderStudentHtml = (student, sIdx) => {
      const initials = `${student.name.charAt(0)}${student.surname.charAt(0)}`.toUpperCase();
      const avatar = student.photo
        ? `<img src="${student.photo}" class="roster-print-photo">`
        : `<div class="roster-print-avatar">${initials}</div>`;
      
      // Sınıftaki diğer aktif öğrencileri dropdown için listele (manuel swap)
      const optionsHtml = students
        .map(s => `<option value="${s.id}" ${s.id === student.id ? 'selected' : ''}>${s.name} ${s.surname} (${s.number})</option>`)
        .join('');

      return `
        <div class="roster-print-student" title="Nöbetçiyi Değiştir">
          ${avatar}
          <div class="roster-print-info">
            <span class="roster-print-name">${student.name} ${student.surname}</span>
            <span class="roster-print-no">No: ${student.number}</span>
          </div>
          <!-- Görünmez select overlay (tıklamayı yakalar ve swap tetikler) -->
          <select class="roster-select-dropdown" data-assign-idx="${index}" data-student-idx="${sIdx}">
            ${optionsHtml}
          </select>
        </div>
      `;
    };

    const studentsHtml = dayStudents.map((std, sIdx) => renderStudentHtml(std, sIdx)).join('');

    dayCard.innerHTML = `
      <div class="roster-print-date">${dateFormatted}</div>
      <div class="roster-print-students">
        ${studentsHtml}
      </div>
    `;

    // Dropdown olay dinleyicilerini kaydet
    dayCard.querySelectorAll('.roster-select-dropdown').forEach(select => {
      select.addEventListener('change', (e) => {
        const assignIdx = parseInt(e.target.getAttribute('data-assign-idx'));
        const studentIdx = parseInt(e.target.getAttribute('data-student-idx'));
        const newStudentId = e.target.value;

        // Rosterı güncelle
        rosterData.assignments[assignIdx].studentIds[studentIdx] = newStudentId;
        
        // Geriye dönük uyumluluk için eski alanları da güncelleyelim
        if (studentIdx === 0) rosterData.assignments[assignIdx].student1Id = newStudentId;
        if (studentIdx === 1) rosterData.assignments[assignIdx].student2Id = newStudentId;

        stateManager.saveDutyRoster(rosterData);
        drawRosterPreview(rosterData);

        if (toastCallbackFn) toastCallbackFn('Nöbetçi öğrenci güncellendi.', 'success');
      });
    });

    grid.appendChild(dayCard);
  });
}

// Ana Render Tetikleyicisi
function renderTools() {
  const rosterData = stateManager.getDutyRoster();
  drawRosterPreview(rosterData);
  
  // Lucide ikonlarını yeniden oluştur
  window.safeCreateIcons();
}

// Rastgele Karıştırma Yardımcısı
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Global erişim için fonksiyonları pencereye ekle
window.setupToolsTab = setupToolsTab;
window.renderTools = renderTools;

})();
