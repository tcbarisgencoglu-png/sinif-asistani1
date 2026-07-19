(() => {
// DOM Elemanları
let dashStudentsContainer;
let searchDashStudent;
let filterDashGender;
let dashSelectWeek;
let btnDashPrevWeek;
let btnDashNextWeek;
let dashWeeklyTbody;
let dashboardHeaderActions;
let dashSelectMonth;
let btnDashPrevMonth;
let btnDashNextMonth;
let dashMonthlyTbody;

const modalStudent = document.getElementById('modal-student');
const formStudent = document.getElementById('form-student');
const studentIdInput = document.getElementById('student-id');
const studentNameInput = document.getElementById('student-name');
const studentSurnameInput = document.getElementById('student-surname');
const studentNumberInput = document.getElementById('student-number');
const studentGenderSelect = document.getElementById('student-gender');
const studentPhoneInput = document.getElementById('student-phone');
const studentNotesInput = document.getElementById('student-notes');
const modalStudentTitle = document.getElementById('modal-student-title');
const studentPhotoInput = document.getElementById('student-photo-input');
const studentPhotoPreview = document.getElementById('student-photo-preview');

// Detay Modalı Elemanları
const modalStudentDetail = document.getElementById('modal-student-detail');
const detailAvatar = document.getElementById('detail-avatar');
const detailNameTitle = document.getElementById('detail-name-title');
const detailNumberSubtitle = document.getElementById('detail-number-subtitle');
const detailTotalScore = document.getElementById('detail-total-score');
const detailPhoneSpan = document.getElementById('detail-phone-span');
const detailDateSpan = document.getElementById('detail-date-span');
const detailNotesP = document.getElementById('detail-notes-p');
const detailPerfTbody = document.getElementById('detail-perf-tbody');
const detailBooksTbody = document.getElementById('detail-books-tbody');
const detailUnreadBooksTbody = document.getElementById('detail-unread-books-tbody');
const detailHwTbody = document.getElementById('detail-hw-tbody');
const detailEvalTbody = document.getElementById('detail-eval-tbody');

window.currentPhotoBase64 = '';
let activeSubTab = 'general'; // 'general' veya 'weekly'
let toastCallback = null;

// Haftanın belirli bir gününü alma yardımcısı (Pazartesi = 1, Pazar = 7)
function getDayInWeek(year, week, dayIndex) {
  const jan4 = new Date(year, 0, 4);
  const dayOfJan4 = jan4.getDay() || 7;
  const week1Start = new Date(jan4.getTime());
  week1Start.setDate(jan4.getDate() - dayOfJan4 + 1);

  const targetDay = new Date(week1Start.getTime());
  targetDay.setDate(week1Start.getDate() + (week - 1) * 7 + (dayIndex - 1));
  return targetDay;
}

function setupDashboardTab(showToast) {
  toastCallback = showToast;

  // DOM Elemanları Seçimi
  dashStudentsContainer = document.getElementById('dash-students-container');
  searchDashStudent = document.getElementById('search-dash-student');
  filterDashGender = document.getElementById('filter-dash-gender');
  dashSelectWeek = document.getElementById('dash-select-week');
  btnDashPrevWeek = document.getElementById('btn-dash-prev-week');
  btnDashNextWeek = document.getElementById('btn-dash-next-week');
  dashWeeklyTbody = document.getElementById('dash-weekly-tbody');
  dashboardHeaderActions = document.getElementById('dashboard-header-actions');
  dashSelectMonth = document.getElementById('dash-select-month');
  btnDashPrevMonth = document.getElementById('btn-dash-prev-month');
  btnDashNextMonth = document.getElementById('btn-dash-next-month');
  dashMonthlyTbody = document.getElementById('dash-monthly-tbody');

  // Alt Sekme Düğmeleri
  const dashTabButtons = document.querySelectorAll('[data-dash-tab]');
  const dashTabContents = document.querySelectorAll('.dash-tab-content');

  dashTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeSubTab = btn.getAttribute('data-dash-tab');
      
      dashTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      dashTabContents.forEach(c => {
        if (c.id === `dash-${activeSubTab}-section`) {
          c.classList.add('active');
          c.style.display = 'block';
        } else {
          c.classList.remove('active');
          c.style.display = 'none';
        }
      });

      renderDashboard();
    });
  });

  // Arama ve Filtre Dinleyicileri (Genel Tab)
  if (searchDashStudent) {
    searchDashStudent.addEventListener('input', () => renderDashboardGeneral());
  }
  if (filterDashGender) {
    filterDashGender.addEventListener('change', () => renderDashboardGeneral());
  }

  // Hafta seçici başlangıç değeri ve dinleyicileri (Haftalık Tab)
  if (dashSelectWeek) {
    dashSelectWeek.value = stateManager.getSelectedWeek();
    dashSelectWeek.addEventListener('change', () => {
      stateManager.setSelectedWeek(dashSelectWeek.value);
    });
  }

  if (btnDashPrevWeek) {
    btnDashPrevWeek.addEventListener('click', () => adjustWeek(-1));
  }
  if (btnDashNextWeek) {
    btnDashNextWeek.addEventListener('click', () => adjustWeek(1));
  }

  function adjustWeek(offset) {
    const val = dashSelectWeek.value;
    if (!val) return;
    
    const parts = val.split('-W');
    if (parts.length !== 2) return;
    
    const year = parseInt(parts[0]);
    const week = parseInt(parts[1]);
    
    const simpleDate = getDayInWeek(year, week, 4); // Perşembe günü
    simpleDate.setDate(simpleDate.getDate() + (offset * 7));
    
    const newWeek = window.getISOWeek(simpleDate);
    dashSelectWeek.value = newWeek;
    stateManager.setSelectedWeek(newWeek);
  }

  function getMonthOfSelectedWeek() {
    const selectedWeek = stateManager.getSelectedWeek();
    if (!selectedWeek) return '';
    const parts = selectedWeek.split('-W');
    if (parts.length !== 2) return '';
    const year = parseInt(parts[0]);
    const week = parseInt(parts[1]);
    const Thursday = getDayInWeek(year, week, 4);
    const yyyy = Thursday.getFullYear();
    const mm = String(Thursday.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }

  if (dashSelectMonth) {
    if (!dashSelectMonth.value) {
      dashSelectMonth.value = getMonthOfSelectedWeek();
    }
    dashSelectMonth.addEventListener('change', () => {
      renderDashboard();
    });
  }

  if (btnDashPrevMonth) {
    btnDashPrevMonth.addEventListener('click', () => adjustMonth(-1));
  }
  if (btnDashNextMonth) {
    btnDashNextMonth.addEventListener('click', () => adjustMonth(1));
  }

  function adjustMonth(offset) {
    const val = dashSelectMonth.value;
    if (!val) return;
    const parts = val.split('-');
    if (parts.length !== 2) return;
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() + offset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    dashSelectMonth.value = `${yyyy}-${mm}`;
    renderDashboard();
  }

  // Fotoğraf Yükleme Dinleyicisi
  if (studentPhotoInput) {
    // Android WebView için özel köprü
    studentPhotoInput.addEventListener('click', (e) => {
      if (window.AndroidInterface && typeof window.AndroidInterface.selectStudentPhoto === 'function') {
        e.preventDefault();
        window.AndroidInterface.selectStudentPhoto();
      }
    });

    studentPhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 1024 * 1024) {
        if (toastCallback) {
          toastCallback('Fotoğraf boyutu 1MB\'tan küçük olmalıdır!', 'warning');
        }
        studentPhotoInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = function(evt) {
        window.currentPhotoBase64 = evt.target.result;
        if (studentPhotoPreview) {
          studentPhotoPreview.src = window.currentPhotoBase64;
          studentPhotoPreview.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Android tarafı için küresel geri çağırma (callback) fonksiyonu
  window.onStudentPhotoSelected = function(base64Data) {
    window.currentPhotoBase64 = base64Data;
    if (studentPhotoPreview) {
      studentPhotoPreview.src = window.currentPhotoBase64;
      studentPhotoPreview.style.display = 'block';
    }
  };

  // Öğrenci Form Gönderimi (Ekleme / Güncelleme)
  if (formStudent) {
    formStudent.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = studentIdInput.value;
      const studentBranchInput = document.getElementById('student-branch');
      const studentData = {
        name: studentNameInput.value.trim(),
        surname: studentSurnameInput.value.trim(),
        number: studentNumberInput.value.trim(),
        gender: studentGenderSelect.value,
        parentPhone: studentPhoneInput.value.trim(),
        notes: studentNotesInput.value.trim(),
        branch: studentBranchInput ? studentBranchInput.value.trim() : '',
        photo: window.currentPhotoBase64 || null
      };

      const state = stateManager.loadState();
      const numberConflict = state.students.some(s => s.number === studentData.number && s.id !== id);
      if (numberConflict) {
        if (toastCallback) {
          toastCallback('Bu okul numarasına sahip başka bir öğrenci zaten kayıtlı!', 'danger');
        }
        return;
      }

      if (id) {
        stateManager.updateStudent(id, studentData);
        if (toastCallback) {
          toastCallback('Öğrenci başarıyla güncellendi.', 'success');
        }
      } else {
        const addedStudent = stateManager.addStudent(studentData);
        if (!addedStudent) return; // Limit aşıldıysa ekleme yapma ve çık
        if (toastCallback) {
          toastCallback('Yeni öğrenci eklendi.', 'success');
        }
      }

      if (modalStudent) modalStudent.classList.remove('active');
      
      const event = new CustomEvent('stateChanged');
      document.dispatchEvent(event);
    });
  }

  // Öğrenci Ekleme Modal Kapatma
  document.querySelectorAll('#modal-student .close-btn, #modal-student .close-btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
      if (modalStudent) modalStudent.classList.remove('active');
    });
  });

  // Detay Modalı Kapatma
  document.querySelectorAll('#modal-student-detail .close-btn, #modal-student-detail .close-btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
      if (modalStudentDetail) modalStudentDetail.classList.remove('active');
    });
  });

  // Detay Modalı Sekme Geçişleri
  const detailTabButtons = document.querySelectorAll('.detail-tab-btn');
  const detailTabContents = document.querySelectorAll('.detail-tab-content');

  detailTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      detailTabButtons.forEach(b => b.classList.remove('active'));
      detailTabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-detail-tab');
      const targetContent = document.getElementById(tabId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // --- Genel Puan Ayarları Modalı Mantığı ---
  const settingsTabButtons = document.querySelectorAll('[data-settings-tab]');
  const settingsTabContents = document.querySelectorAll('.settings-tab-content');
  
  settingsTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-settings-tab');
      settingsTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      settingsTabContents.forEach(c => {
        if (c.id === targetTab) {
          c.classList.add('active');
          c.style.display = 'block';
        } else {
          c.classList.remove('active');
          c.style.display = 'none';
        }
      });
    });
  });

  function openGlobalSettingsModal(settingsTabId = 'settings-behaviors') {
    if (window.switchTab) {
      window.switchTab('assistant-config');
    }
    
    const pointsBtn = document.getElementById('tab-btn-config-points');
    if (pointsBtn) {
      pointsBtn.click();
    }
    
    let ptTabId = 'pt-behaviors';
    if (settingsTabId === 'settings-exams') ptTabId = 'pt-exams';
    else if (settingsTabId === 'settings-behaviors') ptTabId = 'pt-behaviors';
    else if (settingsTabId === 'settings-homeworks') ptTabId = 'pt-homeworks';
    else if (settingsTabId === 'settings-books') ptTabId = 'pt-books';
    
    const ptBtn = document.querySelector(`[data-pt-tab="${ptTabId}"]`);
    if (ptBtn) {
      ptBtn.click();
    }
  }
  window.openGlobalSettingsModal = openGlobalSettingsModal;

  // Fullscreen change listener to update icon dynamically
  document.addEventListener('fullscreenchange', () => {
    const icon = document.getElementById('dash-fullscreen-icon');
    const btn = document.getElementById('btn-dash-fullscreen-toggle');
    if (icon && btn) {
      if (document.fullscreenElement) {
        icon.setAttribute('data-lucide', 'minimize');
        btn.setAttribute('title', 'Tam Ekrandan Çık');
      } else {
        icon.setAttribute('data-lucide', 'maximize');
        btn.setAttribute('title', 'Tam Ekran Yap');
      }
      if (window.safeCreateIcons) {
        window.safeCreateIcons();
      }
    }
  });

  // --- Hızlı Akış Bilgisi Modalı Olay Dinleyicileri ---
  const modalFlowInfo = document.getElementById('modal-flow-info');
  const btnCloseFlowInfo = document.getElementById('btn-close-flow-info');
  const flowSelectDay = document.getElementById('flow-select-day');
  const flowSelectPeriod = document.getElementById('flow-select-period');
  const btnFlowSyncTime = document.getElementById('btn-flow-sync-time');

  if (btnCloseFlowInfo && modalFlowInfo) {
    btnCloseFlowInfo.addEventListener('click', () => {
      modalFlowInfo.classList.remove('active');
    });
  }

  // Modal dışına tıklandığında kapatma
  window.addEventListener('click', (e) => {
    if (e.target === modalFlowInfo) {
      modalFlowInfo.classList.remove('active');
    }
  });

  if (flowSelectDay) {
    flowSelectDay.addEventListener('change', () => {
      if (window.updateFlowContent) {
        window.updateFlowContent(false);
      }
    });
  }

  if (flowSelectPeriod) {
    flowSelectPeriod.addEventListener('change', () => {
      if (window.updateFlowContent) {
        window.updateFlowContent(false);
      }
    });
  }

  if (btnFlowSyncTime) {
    btnFlowSyncTime.addEventListener('click', () => {
      if (window.updateFlowContent) {
        window.updateFlowContent(true);
      }
    });
  }
}

function renderDashboard() {
  // Sekme butonlarını ve içerik alanlarının görünürlüğünü aktif alt sekmeye göre senkronize et
  const dashTabButtons = document.querySelectorAll('[data-dash-tab]');
  const dashTabContents = document.querySelectorAll('.dash-tab-content');

  dashTabButtons.forEach(btn => {
    if (btn.getAttribute('data-dash-tab') === activeSubTab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  dashTabContents.forEach(c => {
    if (c.id === `dash-${activeSubTab}-section`) {
      c.classList.add('active');
      c.style.display = 'block';
    } else {
      c.classList.remove('active');
      c.style.display = 'none';
    }
  });

  if (activeSubTab === 'general') {
    renderDashboardGeneral();
  } else if (activeSubTab === 'weekly') {
    renderDashboardWeekly();
  } else if (activeSubTab === 'monthly') {
    renderDashboardMonthly();
  }
}
function renderDashboardHeaderActions() {
  if (!dashboardHeaderActions) return;
  if (!document.getElementById('btn-dash-fullscreen-toggle')) {
    dashboardHeaderActions.innerHTML = `
      <div class="quick-menu-box" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; background: rgba(255, 255, 255, 0.05); padding: 0.5rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-right: 0.2rem;">Hızlı Menü</span>
        <div style="display: flex; gap: 0.5rem;">
          <div class="flip-card" id="btn-dash-timer" tabindex="0" role="button" title="Süre Tut">
            <div class="flip-card-inner">
              <div class="flip-card-front">
                <i id="dash-timer-icon" data-lucide="clock"></i>
              </div>
              <div class="flip-card-back">
                <span>Süre Tut</span>
              </div>
            </div>
          </div>
          <div class="flip-card" id="btn-dash-quick-puan" tabindex="0" role="button" title="Hızlı Puan Ver">
            <div class="flip-card-inner">
              <div class="flip-card-front">
                <i id="dash-quick-puan-icon" data-lucide="award"></i>
              </div>
              <div class="flip-card-back">
                <span>Puan Ver</span>
              </div>
            </div>
          </div>
          <div class="flip-card" id="btn-dash-caller" tabindex="0" role="button" title="Hızlı Öğrenci Çağır">
            <div class="flip-card-inner">
              <div class="flip-card-front">
                <i id="dash-caller-icon" data-lucide="user-check"></i>
              </div>
              <div class="flip-card-back">
                <span>Öğrenci Seç</span>
              </div>
            </div>
          </div>
          <div class="flip-card" id="btn-dash-flow" tabindex="0" role="button" title="Ders ve Konu Akışı">
            <div class="flip-card-inner">
              <div class="flip-card-front">
                <i id="dash-flow-icon" data-lucide="activity"></i>
              </div>
              <div class="flip-card-back">
                <span>Ders Akışı</span>
              </div>
            </div>
          </div>
          <div class="flip-card" id="btn-dash-attendance" tabindex="0" role="button" title="Yoklama Al">
            <div class="flip-card-inner">
              <div class="flip-card-front">
                <i id="dash-attendance-icon" data-lucide="clipboard-list"></i>
              </div>
              <div class="flip-card-back">
                <span>Yoklama</span>
              </div>
            </div>
          </div>
          <div class="flip-card" id="btn-dash-reminder" tabindex="0" role="button" title="Hatırlatıcı Ekle">
            <div class="flip-card-inner">
              <div class="flip-card-front">
                <i id="dash-reminder-icon" data-lucide="bell"></i>
              </div>
              <div class="flip-card-back">
                <span>Hatırlatıcı</span>
              </div>
            </div>
          </div>
          <div class="flip-card" id="btn-dash-fullscreen-toggle" tabindex="0" role="button" title="${document.fullscreenElement ? 'Tam Ekrandan Çık' : 'Tam Ekran Yap'}">
            <div class="flip-card-inner">
              <div class="flip-card-front">
                <i id="dash-fullscreen-icon" data-lucide="${document.fullscreenElement ? 'minimize' : 'maximize'}"></i>
              </div>
              <div class="flip-card-back">
                <span>Tam Ekran</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnFullscreenToggle = document.getElementById('btn-dash-fullscreen-toggle');
    if (btnFullscreenToggle) {
      btnFullscreenToggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
            console.warn(`Fullscreen error: ${err.message}`);
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      });
    }

    const btnDashTimer = document.getElementById('btn-dash-timer');
    if (btnDashTimer) {
      btnDashTimer.addEventListener('click', (e) => {
        e.preventDefault();
        const timerModal = document.getElementById('modal-timer');
        if (timerModal) {
          timerModal.classList.add('active');
          if (window.initTimerModal) {
            window.initTimerModal();
          }
        }
      });
    }

    const btnDashQuickPuan = document.getElementById('btn-dash-quick-puan');
    if (btnDashQuickPuan) {
      btnDashQuickPuan.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.openQuickGivePointModal) {
          window.openQuickGivePointModal();
        }
      });
    }

    const btnDashCaller = document.getElementById('btn-dash-caller');
    if (btnDashCaller) {
      btnDashCaller.addEventListener('click', (e) => {
        e.preventDefault();
        const callerModal = document.getElementById('modal-quick-caller');
        if (callerModal) {
          callerModal.classList.add('active');
          if (window.initQuickCallerModal) {
            window.initQuickCallerModal();
          }
        }
      });
    }

    const btnDashFlow = document.getElementById('btn-dash-flow');
    if (btnDashFlow) {
      btnDashFlow.addEventListener('click', (e) => {
        e.preventDefault();
        const flowModal = document.getElementById('modal-flow-info');
        if (flowModal) {
          flowModal.classList.add('active');
          if (window.updateFlowContent) {
            window.updateFlowContent(true);
          }
        }
      });
    }

    const btnDashAttendance = document.getElementById('btn-dash-attendance');
    if (btnDashAttendance) {
      btnDashAttendance.addEventListener('click', (e) => {
        e.preventDefault();
        openAttendanceModal();
      });
    }

    const btnDashReminder = document.getElementById('btn-dash-reminder');
    if (btnDashReminder) {
      btnDashReminder.addEventListener('click', (e) => {
        e.preventDefault();
        const reminderModal = document.getElementById('modal-reminder-add');
        if (reminderModal) {
          reminderModal.classList.add('active');
          // Reset fields and set default time to now + 5 minutes
          const noteInput = document.getElementById('reminder-note');
          const datetimeInput = document.getElementById('reminder-datetime');
          if (noteInput) noteInput.value = '';
          if (datetimeInput) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 5);
            const localISOTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16);
            datetimeInput.value = localISOTime;
          }
        }
      });
    }
    
    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }
  }

  // Yoklama Modalı Dinleyicileri
  const modalAttendance = document.getElementById('modal-attendance');
  if (modalAttendance) {
    modalAttendance.querySelectorAll('.close-btn, .close-btn-action').forEach(btn => {
      btn.addEventListener('click', () => {
        modalAttendance.classList.remove('active');
      });
    });
    
    modalAttendance.addEventListener('click', (e) => {
      if (e.target === modalAttendance) {
        modalAttendance.classList.remove('active');
      }
    });
    
    const dateInput = document.getElementById('attendance-date');
    if (dateInput) {
      dateInput.addEventListener('change', () => {
        renderAttendanceStudentsList();
      });
    }
  }
}

function renderDashboardGeneral() {
  const state = stateManager.loadState();
  const query = searchDashStudent ? searchDashStudent.value.toLowerCase().trim() : '';
  const genderFilter = filterDashGender ? filterDashGender.value : 'all';
  const selectBranch = document.getElementById('dash-select-branch');
  const branchFilter = selectBranch ? selectBranch.value : 'all';
  
  // Header butonlarını ayarla
  renderDashboardHeaderActions();

  if (!dashStudentsContainer) return;
  dashStudentsContainer.innerHTML = '';

  const filteredStudents = state.students.filter(student => {
    const fullName = `${student.name} ${student.surname}`.toLowerCase();
    const matchQuery = fullName.includes(query) || student.number.includes(query);
    const matchGender = genderFilter === 'all' || student.gender === genderFilter;
    const matchBranch = state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
    return matchQuery && matchGender && matchBranch;
  });

  if (filteredStudents.length === 0) {
    dashStudentsContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <i data-lucide="users" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
        <p>Kriterlere uygun öğrenci bulunamadı.</p>
      </div>
    `;
    window.safeCreateIcons();
    return;
  }

  // İsme göre sırala
  filteredStudents.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  filteredStudents.forEach(student => {
    const initials = `${student.name[0] || ''}${student.surname[0] || ''}`;
    
    // 1. Kitap Okuma Oranı
    const readCount = state.books.transactions.filter(t => t.studentId === student.id && t.status === 'returned').length;
    const totalLibraryBooks = state.books.library.length;
    const bookRatio = totalLibraryBooks > 0 ? Math.round((readCount / totalLibraryBooks) * 100) : 0;

    // 2. Ödev Yapma Oranı
    let completedHw = 0;
    let expectedHw = 0;
    state.homeworks.forEach(hw => {
      const status = hw.status ? hw.status[student.id] : undefined;
      if (status !== 'excused') {
        expectedHw++;
        if (status === 'completed') {
          completedHw++;
        }
      }
    });
    const hwRatio = expectedHw > 0 ? Math.round((completedHw / expectedHw) * 100) : 0;

    // 3. Sınav Başarı Oranı (Ortalama)
    let totalExamScore = 0;
    let examCount = 0;
    state.weeklyEvaluations.forEach(exam => {
      if (exam.examScores && exam.examScores[student.id] !== undefined) {
        const score = parseFloat(exam.examScores[student.id]);
        if (!isNaN(score)) {
          totalExamScore += score;
          examCount++;
        }
      }
    });
    const examRatio = examCount > 0 ? Math.round(totalExamScore / examCount) : 0;

    const isAbsentToday = stateManager.isStudentAbsent(student.id);
    const card = document.createElement('div');
    card.className = `glass-card student-card ${student.gender === 'female' ? 'female' : 'male'}${isAbsentToday ? ' absent' : ''}`;

    const avatarHtml = student.photo 
      ? `<img src="${student.photo}" class="student-avatar" style="object-fit: cover;">`
      : `<div class="student-avatar">${initials}</div>`;

    card.innerHTML = `
      <div class="student-actions">
        <button class="action-btn-sm edit" title="Düzenle" data-id="${student.id}">
          <i data-lucide="edit-3"></i>
        </button>
        <button class="action-btn-sm delete" title="Sil" data-id="${student.id}">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
      ${avatarHtml}
      ${isAbsentToday ? '<span class="absent-badge">GELMEDİ</span>' : ''}
      <div class="student-info">
        <h3>${student.name} ${student.surname}</h3>
        <div class="std-no">Okul No: ${student.number}</div>
        
        <!-- Rasyolar/İstatistikler -->
        <div class="student-card-stats">
          <div class="stat-item" title="Okuduğu Kitap Oranı (Kitaplık Kitaplarına Göre)">
            <i data-lucide="book-open" style="color: var(--primary);"></i>
            <span>Kitap</span>
            <strong>%${bookRatio}</strong>
          </div>
          <div class="stat-item" title="Ödev Teslim Başarısı">
            <i data-lucide="clipboard-check" style="color: var(--success);"></i>
            <span>Ödev</span>
            <strong>%${hwRatio}</strong>
          </div>
          <div class="stat-item" title="Sınav Başarı Ortalaması">
            <i data-lucide="award" style="color: var(--warning);"></i>
            <span>Sınav</span>
            <strong>%${examRatio}</strong>
          </div>
        </div>
      </div>
    `;

    // Kartın kendisine tıklama
    card.addEventListener('click', (e) => {
      if (e.target.closest('.student-actions')) return;
      openStudentDetailModal(student.id);
    });

    // Düzenle butonu
    card.querySelector('.edit').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditStudentModal(student.id);
    });

    // Sil butonu
    card.querySelector('.delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`${student.name} ${student.surname} adlı öğrenciyi ve ona ait tüm verileri (puan, kitap, ödev) silmek istediğinize emin misiniz?`)) {
        stateManager.deleteStudent(student.id);
        const event = new CustomEvent('stateChanged');
        document.dispatchEvent(event);
      }
    });

    // Lisans kısıtlama kontrolü
    const originalIndex = state.students.findIndex(s => s.id === student.id);
    const isPassive = window.LicenseConfig && window.LicenseConfig.isDemo && originalIndex >= window.LicenseConfig.studentLimit;
    if (isPassive) {
      card.classList.add('passive-locked');
      const lockOverlay = document.createElement('div');
      lockOverlay.className = 'lock-overlay';
      lockOverlay.innerHTML = `<i data-lucide="lock"></i><span>Pasif (Lisans Gerekli)</span>`;
      lockOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (window.showToast) {
          window.showToast("Lisans süreniz dolduğu için bu öğrenci pasif durumdadır. Lütfen lisansınızı yenileyin.", "warning");
        } else {
          alert("Lisans süreniz dolduğu için bu öğrenci pasif durumdadır. Lütfen lisansınızı yenileyin.");
        }
      });
      card.appendChild(lockOverlay);
    }

    dashStudentsContainer.appendChild(card);
  });

  window.safeCreateIcons();
}

function renderDashboardWeekly() {
  const state = stateManager.loadState();
  const selectedWeek = stateManager.getSelectedWeek();
  const activeWeekDisplay = document.getElementById('dash-active-week-display');
  if (activeWeekDisplay) {
    activeWeekDisplay.textContent = window.formatWeekTR ? window.formatWeekTR(selectedWeek) : selectedWeek;
  }

  // Header butonlarını ayarla
  renderDashboardHeaderActions();

  if (!dashWeeklyTbody) return;
  dashWeeklyTbody.innerHTML = '';

  const selectBranch = document.getElementById('dash-select-branch');
  const branchFilter = selectBranch ? selectBranch.value : 'all';
  const activeStudents = state.students.filter(student => {
    return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
  });

  if (activeStudents.length === 0) {
    dashWeeklyTbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">Kriterlere uygun kayıtlı öğrenci bulunmuyor.</td></tr>';
    return;
  }

  // Her öğrenci için puanları topla
  const studentScores = activeStudents.map(student => {
    const perfRecords = state.performance.filter(p => {
      if (p.studentId !== student.id) return false;
      
      // Kaydın haftasını bul
      let recordWeek = '';
      if (p.weekId) {
        recordWeek = p.weekId;
      } else if (p.homeworkId) {
        const hw = state.homeworks.find(h => h.id === p.homeworkId);
        if (hw) recordWeek = window.getISOWeek(hw.dueDate);
      } else {
        recordWeek = window.getISOWeek(p.date);
      }
      
      return recordWeek === selectedWeek;
    });

    let dojoPoints = 0;
    let bookPoints = 0;
    let homeworkPoints = 0;
    let examPoints = 0;

    perfRecords.forEach(p => {
      const reasonLower = p.reason ? p.reason.toLowerCase() : '';
      if (p.homeworkId) {
        homeworkPoints += p.point;
      } else if (p.examId || reasonLower.includes('sınav') || reasonLower.includes('değerlendirme')) {
        examPoints += p.point;
      } else if (reasonLower.includes('kitap')) {
        bookPoints += p.point;
      } else {
        dojoPoints += p.point;
      }
    });

    const totalPoints = dojoPoints + bookPoints + homeworkPoints + examPoints;

    return {
      student,
      dojoPoints,
      bookPoints,
      homeworkPoints,
      examPoints,
      totalPoints
    };
  });

  // Toplam puana göre sırala (azalan), eşitlikte alfabetik sırala
  studentScores.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.student.name.localeCompare(b.student.name, 'tr');
  });

  studentScores.forEach((row, index) => {
    const student = row.student;
    const initials = `${student.name[0] || ''}${student.surname[0] || ''}`;
    
    let rankBadge = `${index + 1}`;
    if (index === 0) rankBadge = '🥇';
    else if (index === 1) rankBadge = '🥈';
    else if (index === 2) rankBadge = '🥉';

    const avatarHtml = student.photo 
      ? `<img src="${student.photo}" class="avatar-sm" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin: 0;">`
      : `<div class="avatar-sm" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; background-color: var(--primary-light); color: var(--primary); text-transform: uppercase; margin: 0;">${initials}</div>`;

    const totalColor = row.totalPoints > 0 ? 'var(--success)' : (row.totalPoints < 0 ? 'var(--danger)' : 'var(--text-primary)');
    const totalSign = row.totalPoints > 0 ? '+' : '';

    const tr = document.createElement('tr');
    if (row.totalPoints < 0) {
      tr.classList.add('negative-score-row');
    }
    const isAbsentToday = stateManager.isStudentAbsent(student.id);
    if (isAbsentToday) {
      tr.classList.add('absent-row');
    }
    
    tr.innerHTML = `
      <td style="text-align: center; font-weight: 700; font-size: 1.1rem;">${rankBadge}</td>
      <td style="display: flex; justify-content: center; align-items: center; border-bottom: none; height: 48px;">${avatarHtml}</td>
      <td>
        <strong>${student.name} ${student.surname}</strong>
        ${row.totalPoints < 0 ? ' <span style="color: var(--danger); margin-left: 0.25rem;" title="Haftalık puanı sıfırın altında!">⚠️</span>' : ''}
      </td>
      <td style="text-align: center; color: var(--text-muted); font-size: 0.85rem;">${student.number}</td>
      <td style="text-align: center; font-weight: 600; color: ${row.dojoPoints >= 0 ? 'var(--text-primary)' : 'var(--danger)'};">${row.dojoPoints >= 0 ? '+' : ''}${row.dojoPoints}</td>
      <td style="text-align: center; font-weight: 600; color: ${row.bookPoints >= 0 ? 'var(--primary)' : 'var(--danger)'};">${row.bookPoints >= 0 ? '+' : ''}${row.bookPoints}</td>
      <td style="text-align: center; font-weight: 600; color: ${row.homeworkPoints >= 0 ? 'var(--success)' : 'var(--danger)'};">${row.homeworkPoints >= 0 ? '+' : ''}${row.homeworkPoints}</td>
      <td style="text-align: center; font-weight: 600; color: ${row.examPoints >= 0 ? 'var(--warning-dark)' : 'var(--danger)'};">${row.examPoints >= 0 ? '+' : ''}${row.examPoints}</td>
      <td style="text-align: center; font-weight: 700; font-size: 0.95rem; color: ${totalColor};">${totalSign}${row.totalPoints}</td>
    `;

    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => {
      openStudentDetailModal(student.id);
    });

    dashWeeklyTbody.appendChild(tr);
  });
}

function renderDashboardMonthly() {
  const state = stateManager.loadState();
  
  // getMonthOfSelectedWeek is defined in setupDashboardTab, let's compute month of selected week
  const getMonthOfSelectedWeekStr = () => {
    const selectedWeek = stateManager.getSelectedWeek();
    if (!selectedWeek) return '';
    const parts = selectedWeek.split('-W');
    if (parts.length !== 2) return '';
    const year = parseInt(parts[0]);
    const week = parseInt(parts[1]);
    const Thursday = getDayInWeek(year, week, 4);
    const yyyy = Thursday.getFullYear();
    const mm = String(Thursday.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  };

  const selectedMonth = dashSelectMonth ? dashSelectMonth.value : getMonthOfSelectedWeekStr();
  const activeMonthDisplay = document.getElementById('dash-active-month-display');
  if (activeMonthDisplay && selectedMonth) {
    const parts = selectedMonth.split('-');
    if (parts.length === 2) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1]) - 1;
      const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      activeMonthDisplay.textContent = `${monthNames[monthIdx]} ${year}`;
    }
  }

  // Header butonlarını ayarla
  renderDashboardHeaderActions();

  if (!dashMonthlyTbody) return;
  dashMonthlyTbody.innerHTML = '';

  const selectBranch = document.getElementById('dash-select-branch');
  const branchFilter = selectBranch ? selectBranch.value : 'all';
  const activeStudents = state.students.filter(student => {
    return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
  });

  if (activeStudents.length === 0) {
    dashMonthlyTbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">Kriterlere uygun kayıtlı öğrenci bulunmuyor.</td></tr>';
    return;
  }

  // Her öğrenci için puanları topla
  const studentScores = activeStudents.map(student => {
    const perfRecords = state.performance.filter(p => {
      if (p.studentId !== student.id) return false;
      
      // Kaydın tarihini/ayını bul
      let recordMonth = '';
      if (p.date) {
        const d = new Date(p.date);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          recordMonth = `${yyyy}-${mm}`;
        }
      } else if (p.homeworkId) {
        const hw = state.homeworks.find(h => h.id === p.homeworkId);
        if (hw && hw.dueDate) {
          const d = new Date(hw.dueDate);
          if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            recordMonth = `${yyyy}-${mm}`;
          }
        }
      } else if (p.weekId) {
        const parts = p.weekId.split('-W');
        if (parts.length === 2) {
          const year = parseInt(parts[0]);
          const week = parseInt(parts[1]);
          const d = getDayInWeek(year, week, 4);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          recordMonth = `${yyyy}-${mm}`;
        }
      }
      
      return recordMonth === selectedMonth;
    });

    let dojoPoints = 0;
    let bookPoints = 0;
    let homeworkPoints = 0;
    let examPoints = 0;

    perfRecords.forEach(p => {
      const reasonLower = p.reason ? p.reason.toLowerCase() : '';
      if (p.homeworkId) {
        homeworkPoints += p.point;
      } else if (p.examId || reasonLower.includes('sınav') || reasonLower.includes('değerlendirme')) {
        examPoints += p.point;
      } else if (reasonLower.includes('kitap')) {
        bookPoints += p.point;
      } else {
        dojoPoints += p.point;
      }
    });

    const totalPoints = dojoPoints + bookPoints + homeworkPoints + examPoints;

    return {
      student,
      dojoPoints,
      bookPoints,
      homeworkPoints,
      examPoints,
      totalPoints
    };
  });

  // Toplam puana göre sırala (azalan), eşitlikte alfabetik sırala
  studentScores.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.student.name.localeCompare(b.student.name, 'tr');
  });

  studentScores.forEach((row, index) => {
    const student = row.student;
    const initials = `${student.name[0] || ''}${student.surname[0] || ''}`;
    
    let rankBadge = `${index + 1}`;
    if (index === 0) rankBadge = '🥇';
    else if (index === 1) rankBadge = '🥈';
    else if (index === 2) rankBadge = '🥉';

    const avatarHtml = student.photo 
      ? `<img src="${student.photo}" class="avatar-sm" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin: 0;">`
      : `<div class="avatar-sm" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; background-color: var(--primary-light); color: var(--primary); text-transform: uppercase; margin: 0;">${initials}</div>`;

    const totalColor = row.totalPoints > 0 ? 'var(--success)' : (row.totalPoints < 0 ? 'var(--danger)' : 'var(--text-primary)');
    const totalSign = row.totalPoints > 0 ? '+' : '';

    const tr = document.createElement('tr');
    if (row.totalPoints < 0) {
      tr.classList.add('negative-score-row');
    }
    const isAbsentToday = stateManager.isStudentAbsent(student.id);
    if (isAbsentToday) {
      tr.classList.add('absent-row');
    }
    
    tr.innerHTML = `
      <td style="text-align: center; font-weight: 700; font-size: 1.1rem;">${rankBadge}</td>
      <td style="display: flex; justify-content: center; align-items: center; border-bottom: none; height: 48px;">${avatarHtml}</td>
      <td>
        <strong>${student.name} ${student.surname}</strong>
        ${row.totalPoints < 0 ? ' <span style="color: var(--danger); margin-left: 0.25rem;" title="Aylık puanı sıfırın altında!">⚠️</span>' : ''}
      </td>
      <td style="text-align: center; color: var(--text-muted); font-size: 0.85rem;">${student.number}</td>
      <td style="text-align: center; font-weight: 600; color: ${row.dojoPoints >= 0 ? 'var(--text-primary)' : 'var(--danger)'};">${row.dojoPoints >= 0 ? '+' : ''}${row.dojoPoints}</td>
      <td style="text-align: center; font-weight: 600; color: ${row.bookPoints >= 0 ? 'var(--primary)' : 'var(--danger)'};">${row.bookPoints >= 0 ? '+' : ''}${row.bookPoints}</td>
      <td style="text-align: center; font-weight: 600; color: ${row.homeworkPoints >= 0 ? 'var(--success)' : 'var(--danger)'};">${row.homeworkPoints >= 0 ? '+' : ''}${row.homeworkPoints}</td>
      <td style="text-align: center; font-weight: 600; color: ${row.examPoints >= 0 ? 'var(--warning-dark)' : 'var(--danger)'};">${row.examPoints >= 0 ? '+' : ''}${row.examPoints}</td>
      <td style="text-align: center; font-weight: 700; font-size: 0.95rem; color: ${totalColor};">${totalSign}${row.totalPoints}</td>
    `;

    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => {
      openStudentDetailModal(student.id);
    });

    dashMonthlyTbody.appendChild(tr);
  });
}

function openEditStudentModal(id) {
  const state = stateManager.loadState();
  const student = state.students.find(s => s.id === id);
  if (!student) return;

  studentIdInput.value = student.id;
  studentNameInput.value = student.name;
  studentSurnameInput.value = student.surname;
  studentNumberInput.value = student.number;
  studentGenderSelect.value = student.gender;
  studentPhoneInput.value = student.parentPhone || '';
  studentNotesInput.value = student.notes || '';
  
  const studentBranchInput = document.getElementById('student-branch');
  if (studentBranchInput) {
    studentBranchInput.value = student.branch || '';
  }

  if (student.photo) {
    window.currentPhotoBase64 = student.photo;
    if (studentPhotoPreview) {
      studentPhotoPreview.src = student.photo;
      studentPhotoPreview.style.display = 'block';
    }
  } else {
    window.currentPhotoBase64 = '';
    if (studentPhotoPreview) studentPhotoPreview.style.display = 'none';
  }
  if (studentPhotoInput) studentPhotoInput.value = '';

  if (modalStudentTitle) modalStudentTitle.textContent = 'Öğrenci Bilgilerini Düzenle';
  if (modalStudent) modalStudent.classList.add('active');
}

function openStudentDetailModal(id) {
  const state = stateManager.loadState();
  const student = state.students.find(s => s.id === id);
  if (!student) return;

  const initials = `${student.name[0] || ''}${student.surname[0] || ''}`;
  const totalScore = stateManager.getStudentScore(id);

  // Sol panel doldurma
  detailAvatar.className = `student-avatar ${student.gender === 'female' ? 'female' : 'male'}`;
  if (student.photo) {
    detailAvatar.innerHTML = `<img src="${student.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
  } else {
    detailAvatar.textContent = initials;
  }
  detailNameTitle.textContent = `${student.name} ${student.surname}`;
  detailNumberSubtitle.textContent = `Okul No: ${student.number}`;
  
  detailTotalScore.className = `student-score-badge ${totalScore >= 0 ? 'positive' : 'negative'}`;
  detailTotalScore.textContent = `Performans: ${totalScore >= 0 ? '+' : ''}${totalScore} Puan`;
  
  detailPhoneSpan.textContent = student.parentPhone || 'Girilmemiş';
  detailDateSpan.textContent = student.createdAt ? new Date(student.createdAt).toLocaleDateString('tr-TR') : '-';
  detailNotesP.textContent = student.notes || 'Herhangi bir not bulunmuyor.';

  // 1. Sekme: Performans Akışı Doldurma
  detailPerfTbody.innerHTML = '';
  const studentPerf = state.performance
    .filter(p => p.studentId === id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (studentPerf.length === 0) {
    detailPerfTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Davranış kaydı bulunamadı.</td></tr>';
  } else {
    studentPerf.forEach(p => {
      const row = document.createElement('tr');
      const pointSign = p.point >= 0 ? '+' : '';
      const pointColor = p.point >= 0 ? 'var(--success)' : 'var(--danger)';
      
      row.innerHTML = `
        <td><strong>${p.reason}</strong></td>
        <td><span style="color: ${pointColor}; font-weight: 700;">${pointSign}${p.point}</span></td>
        <td>${new Date(p.date).toLocaleString('tr-TR')}</td>
        <td>
          <button class="action-btn-sm delete-perf" data-perf-id="${p.id}" title="Puan Kaydını Sil">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </td>
      `;

      row.querySelector('.delete-perf').addEventListener('click', () => {
        if (confirm('Bu puan kaydını silmek istiyor musunuz?')) {
          stateManager.deletePerformance(p.id);
          openStudentDetailModal(id); // Yenile
          const event = new CustomEvent('stateChanged');
          document.dispatchEvent(event);
        }
      });

      detailPerfTbody.appendChild(row);
    });
  }

  // 2. Sekme: Kitap Geçmişi ve Sıralama
  const readerCounts = state.students.map(std => {
    const count = state.books.transactions.filter(t => t.studentId === std.id && t.status === 'returned').length;
    return { studentId: std.id, count };
  });
  readerCounts.sort((a, b) => b.count - a.count);
  
  let rank = 1;
  let lastCount = -1;
  const rankMap = {};
  readerCounts.forEach((rc, idx) => {
    if (rc.count !== lastCount) {
      rank = idx + 1;
      lastCount = rc.count;
    }
    rankMap[rc.studentId] = rank;
  });
  const readingRank = rankMap[id] || '-';

  detailBooksTbody.innerHTML = '';
  const studentTxs = state.books.transactions
    .filter(t => t.studentId === id)
    .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));

  // Tab başlığına sıralamayı badge olarak ekleyelim
  const bookHeader = document.querySelector('#detail-books h4');
  if (bookHeader) {
    bookHeader.innerHTML = `
      <i data-lucide="book-open" style="width: 16px; height: 16px;"></i> Okuma Geçmişi 
      <span class="student-score-badge" style="background-color: var(--primary-light); color: var(--primary); font-size: 0.75rem; margin: 0 0 0 0.5rem; padding: 0.15rem 0.5rem;">Sınıf Okuma Sıralaması: ${readingRank}.</span>
    `;
  }

  if (studentTxs.length === 0) {
    detailBooksTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Kitap okuma kaydı bulunamadı.</td></tr>';
  } else {
    studentTxs.forEach(t => {
      const book = state.books.library.find(b => b.id === t.bookId) || { title: 'Silinmiş Kitap', author: '-' };
      const row = document.createElement('tr');
      
      let statusBadgeHtml = '';
      if (t.status === 'reading') {
        statusBadgeHtml = `<span class="status-badge incomplete">Okuyor</span>`;
      } else {
        statusBadgeHtml = `<span class="status-badge completed">Okundu</span>`;
      }

      row.innerHTML = `
        <td><strong>${book.title}</strong></td>
        <td>${book.author}</td>
        <td>${new Date(t.borrowDate).toLocaleDateString('tr-TR')}</td>
        <td>${t.returnDate ? new Date(t.returnDate).toLocaleDateString('tr-TR') : '-'}</td>
        <td>${statusBadgeHtml}</td>
      `;
      detailBooksTbody.appendChild(row);
    });
  }

  // Henüz okunmayan kitaplar listesi
  detailUnreadBooksTbody.innerHTML = '';
  const readBookIds = studentTxs.map(t => t.bookId);
  const unreadBooks = state.books.library.filter(b => !readBookIds.includes(b.id));

  if (unreadBooks.length === 0) {
    detailUnreadBooksTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); font-weight: 500;">Tebrikler! Kitaplıktaki tüm kitaplar okundu.</td></tr>';
  } else {
    unreadBooks.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    unreadBooks.forEach(book => {
      const isAlreadyBorrowed = state.books.transactions.some(
        t => t.bookId === book.id && t.status === 'reading'
      );
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><code>${book.bookNo || '-'}</code></td>
        <td><strong>${book.title}</strong></td>
        <td>${book.author}</td>
        <td>${book.pages} s.</td>
        <td>
          <button class="btn btn-primary quick-borrow-btn" data-book-id="${book.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" ${isAlreadyBorrowed ? 'disabled title="Bu kitap şu an başka bir öğrencide"' : 'title="Kitabı ödünç ver"'}>
            ${isAlreadyBorrowed ? 'Okunuyor' : 'Ödünç Ver'}
          </button>
        </td>
      `;
      
      if (!isAlreadyBorrowed) {
        row.querySelector('.quick-borrow-btn').addEventListener('click', () => {
          const todayStr = window.formatLocalDate();
          stateManager.borrowBook(student.id, book.id, todayStr);
          if (toastCallback) {
            toastCallback(`"${book.title}" kitabı ${student.name} öğrencisine ödünç verildi.`, 'success');
          }
          if (modalStudentDetail) modalStudentDetail.classList.remove('active');
          
          const event = new CustomEvent('stateChanged');
          document.dispatchEvent(event);
        });
      }
      
      detailUnreadBooksTbody.appendChild(row);
    });
  }

  // 3. Sekme: Ödev Geçmişi ve Başarı Oranı
  let completedHw = 0;
  let expectedHw = 0;
  state.homeworks.forEach(hw => {
    const status = hw.status ? hw.status[id] : undefined;
    if (status !== 'excused') {
      expectedHw++;
      if (status === 'completed') {
        completedHw++;
      }
    }
  });
  const hwPercent = expectedHw > 0 ? Math.round((completedHw / expectedHw) * 100) : 0;

  detailHwTbody.innerHTML = '';
  const hws = state.homeworks;

  const hwTabHeader = document.querySelector('#detail-hw');
  if (hwTabHeader) {
    // Başlığın üzerine bir özet ekleyelim
    const existingSummary = hwTabHeader.querySelector('.hw-summary-badge');
    if (existingSummary) existingSummary.remove();

    const titleEl = hwTabHeader.querySelector('h4') || document.createElement('h4');
    titleEl.className = 'hw-summary-badge';
    titleEl.style.fontSize = '0.95rem';
    titleEl.style.marginBottom = '0.75rem';
    titleEl.style.fontWeight = '700';
    titleEl.style.color = 'var(--success)';
    titleEl.innerHTML = `
      <i data-lucide="clipboard-check" style="width: 16px; height: 16px; margin-right: 0.25rem;"></i> Ödev Başarı Raporu
      <span class="student-score-badge" style="background-color: var(--success-light); color: var(--success); font-size: 0.75rem; margin: 0 0 0 0.5rem; padding: 0.15rem 0.5rem;">Genel Başarı: %${hwPercent}</span>
    `;
    if (!hwTabHeader.contains(titleEl)) {
      hwTabHeader.insertBefore(titleEl, hwTabHeader.firstChild);
    }
  }

  if (hws.length === 0) {
    detailHwTbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Tanımlanmış ödev bulunamadı.</td></tr>';
  } else {
    hws.forEach(hw => {
      const status = hw.status ? hw.status[id] : undefined;
      const row = document.createElement('tr');
      
      let badge = '';
      switch (status) {
        case 'completed': badge = '<span class="status-badge completed">Yapıldı</span>'; break;
        case 'incomplete': badge = '<span class="status-badge incomplete">Eksik</span>'; break;
        case 'missing': badge = '<span class="status-badge missing">Yapılmadı</span>'; break;
        case 'excused': badge = '<span class="status-badge excused">Muaf</span>'; break;
        default: badge = '<span class="status-badge none">İşaretlenmemiş</span>';
      }

      row.innerHTML = `
        <td><strong>${hw.title}</strong></td>
        <td>${new Date(hw.dueDate).toLocaleDateString('tr-TR')}</td>
        <td>${badge}</td>
      `;
      detailHwTbody.appendChild(row);
    });
  }

  // 4. Sekme: Haftalık Değerlendirme (Sınav) Detayları
  detailEvalTbody.innerHTML = '';
  const exams = state.weeklyEvaluations.filter(e => e.examScores); // Sınav puanları olan tüm kayıtlar

  if (exams.length === 0) {
    detailEvalTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Haftalık sınav kaydı bulunamadı.</td></tr>';
  } else {
    const sortedExams = [...exams].sort((a, b) => b.weekId.localeCompare(a.weekId));
    let hasResults = false;

    sortedExams.forEach(exam => {
      const score = exam.examScores ? exam.examScores[id] : undefined;
      if (score !== undefined) {
        hasResults = true;
        const result = exam.studentResults ? exam.studentResults[id] : null;
        const row = document.createElement('tr');
        
        const correctStr = result ? result.correct : '-';
        const wrongStr = result ? result.wrong : '-';
        const blankStr = result ? result.blank : '-';
        const netStr = result ? (typeof result.net === 'number' ? result.net.toFixed(2) : result.net) : '-';
        const statsStr = result ? `${correctStr} D / ${wrongStr} Y / ${blankStr} B` : 'Detay Yok';
        
        const weekNum = exam.weekId.split('-W')[1] || exam.weekId;
        
        row.innerHTML = `
          <td><strong>${exam.examName}</strong></td>
          <td style="color: var(--text-secondary); font-weight: 500;">${weekNum}. Hafta</td>
          <td style="text-align: center; font-size: 0.8rem; color: var(--text-secondary);">${statsStr}</td>
          <td style="text-align: center; font-weight: 600;">${netStr}</td>
          <td style="text-align: center; font-weight: 700; color: var(--primary);">${score}</td>
        `;
        detailEvalTbody.appendChild(row);
      }
    });

    if (!hasResults) {
      detailEvalTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Öğrenciye ait sınav sonucu bulunamadı.</td></tr>';
    }
  }

  // İlk sekmeyi aktif yap
  document.querySelectorAll('.detail-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.detail-tab-content').forEach(c => c.classList.remove('active'));
  const initialTabBtn = document.querySelector('.detail-tab-btn[data-detail-tab="detail-perf"]');
  if (initialTabBtn) initialTabBtn.classList.add('active');
  const initialTabContent = document.getElementById('detail-perf');
  if (initialTabContent) initialTabContent.classList.add('active');

  if (modalStudentDetail) modalStudentDetail.classList.add('active');
  window.safeCreateIcons();
}

// --- Hızlı Akış Bilgisi Hesaplama ve Güncelleme Fonksiyonları ---
function getActiveWeekIndexLocal(weeklySchedule) {
  if (!weeklySchedule || weeklySchedule.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Tarih aralığına göre tam eşleşme kontrolü
  for (let i = 0; i < weeklySchedule.length; i++) {
    const week = weeklySchedule[i];
    if (week.startDate && week.endDate) {
      const sDate = new Date(week.startDate);
      sDate.setHours(0, 0, 0, 0);
      const eDate = new Date(week.endDate);
      eDate.setHours(23, 59, 59, 999);
      eDate.setDate(eDate.getDate() + 2); // Hafta sonu toleransı (Cuma akşamı/Cumartesi rahatlığı için)
      
      if (today >= sDate && today <= eDate) {
        return i;
      }
    }
  }

  // 2. ISO Hafta koduna göre eşleşme kontrolü
  const currentISOWeek = window.getISOWeek ? window.getISOWeek(today) : '';
  if (currentISOWeek) {
    for (let i = 0; i < weeklySchedule.length; i++) {
      if (weeklySchedule[i].isoWeek === currentISOWeek) {
        return i;
      }
    }
  }

  // 3. Fallback: Tamamlanmamış ilk normal haftayı seç
  for (let i = 0; i < weeklySchedule.length; i++) {
    if (!weeklySchedule[i].isHoliday && !weeklySchedule[i].isCompleted) {
      return i;
    }
  }

  return 0;
}

function normalizeLessonName(text) {
  if (!text) return '';
  return text
    .toLocaleLowerCase('tr')
    // Remove class levels like "5. Sınıf", "5-A", "3/A", "5 Sınıf"
    .replace(/\b\d+([.\-/]sınıf|\s+sınıf|[.\-/][a-z])?\b/gi, '')
    // Remove standalone numbers
    .replace(/\b\d+\b/g, '')
    // Remove all non-alphanumeric Turkish characters
    .replace(/[^a-z0-9ışğçöü]/gi, '')
    .trim();
}

function isLessonPlanMatch(planName, lessonName) {
  const normPlan = normalizeLessonName(planName);
  const normLesson = normalizeLessonName(lessonName);
  if (!normPlan || !normLesson) return false;
  return normPlan.includes(normLesson) || normLesson.includes(normPlan);
}

function getTopicForLesson(lessonName, plans) {
  const matchedPlan = plans.find(p => {
    return isLessonPlanMatch(p.courseName || p.title, lessonName);
  });

  if (matchedPlan) {
    const schedule = matchedPlan.weeklySchedule || matchedPlan.weeks || [];
    const activeWeekIndex = getActiveWeekIndexLocal(schedule);
    const activeWeek = schedule[activeWeekIndex];
    if (activeWeek) {
      if (activeWeek.isHoliday) {
        return 'Resmi Tatil / Ara Tatil';
      }
      return activeWeek.topics && activeWeek.topics.length ? activeWeek.topics.join(', ') : 'Konu bilgisi girilmemiş.';
    }
  }
  return 'Yıllık plan yüklenmemiş.';
}

function updateFlowContent(syncWithRealTime = true) {
  const modalFlowInfo = document.getElementById('modal-flow-info');
  if (!modalFlowInfo) return;

  const flowSelectDay = document.getElementById('flow-select-day');
  const flowSelectPeriod = document.getElementById('flow-select-period');
  const flowCurrentStatus = document.getElementById('flow-current-status');
  const flowLessonName = document.getElementById('flow-lesson-name');
  const flowLessonTimeSpan = document.getElementById('flow-lesson-time-span');
  const flowPlanWeekBadge = document.getElementById('flow-plan-week-badge');
  const flowPlanTopic = document.getElementById('flow-plan-topic');
  const flowPlanOutcomesContainer = document.getElementById('flow-plan-outcomes-container');
  const flowPlanOutcomes = document.getElementById('flow-plan-outcomes');
  const flowLessonCard = document.getElementById('flow-lesson-card');

  const state = stateManager.loadState();
  const times = state.scheduleTimes || {};
  const grid = state.scheduleGrid || {};
  const lessons = state.definedLessons || [];
  const plans = state.plans || [];

  const isMiddle = state.educationLevel === 'middle';

  // Dropdown'ı dinamik olarak güncelle (7. Ders seçeneği)
  if (flowSelectPeriod) {
    const hasP7 = !!flowSelectPeriod.querySelector('option[value="p7"]');
    if (isMiddle && !hasP7) {
      const opt = document.createElement('option');
      opt.value = 'p7';
      opt.textContent = '7. Ders';
      flowSelectPeriod.appendChild(opt);
    } else if (!isMiddle && hasP7) {
      const opt = flowSelectPeriod.querySelector('option[value="p7"]');
      if (opt) opt.remove();
      if (flowSelectPeriod.value === 'p7') {
        flowSelectPeriod.value = 'p1';
      }
    }
  }

  const now = new Date();
  
  // 1. Eşleme için gün ve saat belirle
  let targetDay = 1;      // 1: Pazartesi, ..., 5: Cuma
  let targetPeriod = 'p1'; // p1, p2, p3, p4, p5, p6, p7
  let isLive = false;

  const dayOfWeek = now.getDay(); // 0: Pazar, 1: Pzt, ..., 6: Cmt

  if (syncWithRealTime) {
    // Gerçek zamana göre eşle
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      targetDay = dayOfWeek;
      isLive = true;
    } else {
      // Hafta sonu ise varsayılan olarak Pazartesi yap
      targetDay = 1;
      isLive = false;
    }

    // Saate göre periyodu bul
    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const parts = timeStr.split(':');
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    };

    const curTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const curMin = parseTimeToMinutes(curTimeStr);

    let resolvedPeriod = null;
    let breakNextPeriod = null;
    let isLunch = false;

    // Ders saatlerini kontrol et
    const pKeys = isMiddle 
      ? ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']
      : ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
    
    for (let i = 0; i < pKeys.length; i++) {
      const pKey = pKeys[i];
      const pData = times[pKey];
      if (pData && pData.start && pData.end) {
        const pStart = parseTimeToMinutes(pData.start);
        const pEnd = parseTimeToMinutes(pData.end);
        
        if (curMin >= pStart && curMin <= pEnd) {
          resolvedPeriod = pKey;
          break;
        }
      }
    }

    // Ders saatinde değilse, teneffüs veya öğle arasında mıyız?
    if (!resolvedPeriod && dayOfWeek >= 1 && dayOfWeek <= 5) {
      const lunchData = times['lunch'];
      if (lunchData && lunchData.start && lunchData.end) {
        const lStart = parseTimeToMinutes(lunchData.start);
        const lEnd = parseTimeToMinutes(lunchData.end);
        if (curMin >= lStart && curMin <= lEnd) {
          isLunch = true;
        }
      }

      if (!isLunch) {
        // Teneffüsleri kontrol et
        for (let i = 0; i < pKeys.length - 1; i++) {
          const currentPKey = pKeys[i];
          const nextPKey = pKeys[i + 1];
          const currentEnd = times[currentPKey] ? parseTimeToMinutes(times[currentPKey].end) : 0;
          const nextStart = times[nextPKey] ? parseTimeToMinutes(times[nextPKey].start) : 0;
          
          if (currentEnd && nextStart && curMin > currentEnd && curMin < nextStart) {
            breakNextPeriod = nextPKey;
            break;
          }
        }
      }
    }

    if (resolvedPeriod) {
      targetPeriod = resolvedPeriod;
    } else if (isLunch) {
      targetPeriod = 'lunch';
    } else if (breakNextPeriod) {
      targetPeriod = 'break';
      window.nextPeriodKey = breakNextPeriod;
    } else {
      targetPeriod = 'outside';
      isLive = false;
    }

    // Dropdown'ları senkronize et
    if (flowSelectDay) flowSelectDay.value = targetDay;
    if (flowSelectPeriod) {
      if (targetPeriod === 'lunch' || targetPeriod === 'break' || targetPeriod === 'outside') {
        flowSelectPeriod.value = 'p1';
      } else {
        flowSelectPeriod.value = targetPeriod;
      }
    }
  } else {
    // Manuel seçimi oku
    targetDay = parseInt(flowSelectDay.value);
    targetPeriod = flowSelectPeriod.value;
    isLive = false;
  }

  // 2. CANLI Durumunu Güncelle
  if (flowCurrentStatus) {
    flowCurrentStatus.style.display = isLive ? 'inline-block' : 'none';
  }

  // 3. İçeriği doldur
  if (targetPeriod === 'lunch' && syncWithRealTime) {
    flowLessonName.textContent = 'ÖĞLE ARASI 🍽️';
    const lData = times['lunch'] || { start: '--:--', end: '--:--' };
    flowLessonTimeSpan.textContent = `${lData.start} - ${lData.end}`;
    if (flowLessonCard) {
      flowLessonCard.style.border = '1px solid var(--border-color)';
      flowLessonCard.style.backgroundColor = 'var(--bg-secondary)';
    }
    flowPlanWeekBadge.textContent = '-';
    flowPlanTopic.textContent = 'Şu an öğle arası dinlenme saatindesiniz.';
    if (flowPlanOutcomesContainer) flowPlanOutcomesContainer.style.display = 'none';
  } else if (targetPeriod === 'break' && syncWithRealTime) {
    const nextP = window.nextPeriodKey || 'p1';
    const nextPNum = nextP.replace('p', '');
    flowLessonName.textContent = 'TENEFFÜS 🔔';
    flowLessonTimeSpan.textContent = `Sonraki Ders: ${nextPNum}. Ders`;
    if (flowLessonCard) {
      flowLessonCard.style.border = '1px solid var(--border-color)';
      flowLessonCard.style.backgroundColor = 'var(--bg-secondary)';
    }

    const gridKey = `${targetDay}-${nextP}`;
    const nextLessonId = grid[gridKey] || '';
    const nextLesson = lessons.find(l => l.id === nextLessonId);

    if (nextLesson) {
      flowPlanWeekBadge.textContent = 'Sıradaki Ders';
      flowPlanTopic.textContent = `Teneffüsten sonra "${nextLesson.name.toUpperCase()}" dersi başlayacak.\nKonu: ${getTopicForLesson(nextLesson.name, plans)}`;
    } else {
      flowPlanWeekBadge.textContent = '-';
      flowPlanTopic.textContent = 'Teneffüs bittikten sonraki ders saati boş görünüyor.';
    }
    if (flowPlanOutcomesContainer) flowPlanOutcomesContainer.style.display = 'none';
  } else if (targetPeriod === 'outside' && syncWithRealTime) {
    flowLessonName.textContent = 'DERS SAATLERİ DIŞI 🌙';
    flowLessonTimeSpan.textContent = 'Okul saatleri dışındasınız.';
    if (flowLessonCard) {
      flowLessonCard.style.border = '1px solid var(--border-color)';
      flowLessonCard.style.backgroundColor = 'var(--bg-secondary)';
    }
    flowPlanWeekBadge.textContent = '-';
    flowPlanTopic.textContent = 'Şu an ders saatleri dışındasınız. Ders akışını test etmek ve önizlemek için yukarıdaki sorgulama panelinden gün ve ders saati seçebilirsiniz.';
    if (flowPlanOutcomesContainer) flowPlanOutcomesContainer.style.display = 'none';
  } else {
    // Normal Ders Saati (Canlı veya Manuel Seçilmiş)
    const gridKey = `${targetDay}-${targetPeriod}`;
    const lessonId = grid[gridKey] || '';
    const lesson = lessons.find(l => l.id === lessonId);

    const tData = times[targetPeriod] || { start: '--:--', end: '--:--' };
    flowLessonTimeSpan.textContent = `${tData.start} - ${tData.end}`;

    if (lesson) {
      flowLessonName.textContent = lesson.name.toUpperCase();
      if (flowLessonCard) {
        flowLessonCard.style.border = `1px solid ${lesson.color}`;
        flowLessonCard.style.backgroundColor = `${lesson.color}0d`; // Açık ton arka plan
      }

      // Yıllık plandaki dersi ve konuyu eşleştir
      const matchedPlan = plans.find(p => {
        return isLessonPlanMatch(p.courseName || p.title, lesson.name);
      });

      if (matchedPlan) {
        const schedule = matchedPlan.weeklySchedule || matchedPlan.weeks || [];
        const activeWeekIndex = getActiveWeekIndexLocal(schedule);
        const activeWeek = schedule[activeWeekIndex];

        if (activeWeek) {
          flowPlanWeekBadge.textContent = activeWeek.weekLabel || `${activeWeekIndex + 1}. Hafta`;
          
          if (activeWeek.isHoliday) {
            flowPlanTopic.textContent = `🌴 Resmi Tatil / Ara Tatil: ${activeWeek.dateRange || ''}`;
            if (flowPlanOutcomesContainer) flowPlanOutcomesContainer.style.display = 'none';
          } else {
            const topicText = activeWeek.topics && activeWeek.topics.length ? activeWeek.topics.join('\n') : 'Bu hafta için konu bilgisi girilmemiş.';
            flowPlanTopic.textContent = topicText;

            const outcomesText = activeWeek.learningOutcomes && activeWeek.learningOutcomes.length ? activeWeek.learningOutcomes.join('\n') : '';
            if (outcomesText) {
              if (flowPlanOutcomes) flowPlanOutcomes.textContent = outcomesText;
              if (flowPlanOutcomesContainer) flowPlanOutcomesContainer.style.display = 'block';
            } else {
              if (flowPlanOutcomesContainer) flowPlanOutcomesContainer.style.display = 'none';
            }
          }
        } else {
          flowPlanWeekBadge.textContent = '-';
          flowPlanTopic.textContent = 'Bu hafta için plan konusu bulunamadı.';
          if (flowPlanOutcomesContainer) flowPlanOutcomesContainer.style.display = 'none';
        }
      } else {
        flowPlanWeekBadge.textContent = '-';
        flowPlanTopic.textContent = `"${lesson.name}" dersine ait yüklenmiş bir yıllık plan bulunamadı. Yıllık Planlar sekmesinden Excel/Word yüklemesi yapabilirsiniz.`;
        if (flowPlanOutcomesContainer) flowPlanOutcomesContainer.style.display = 'none';
      }
    } else {
      flowLessonName.textContent = 'DERS BOŞ ☕';
      if (flowLessonCard) {
        flowLessonCard.style.border = '1px solid var(--border-color)';
        flowLessonCard.style.backgroundColor = 'var(--bg-secondary)';
      }
      flowPlanWeekBadge.textContent = '-';
      flowPlanTopic.textContent = 'Bu ders saati haftalık programda boş ("BOŞ") olarak belirlenmiş.';
      if (flowPlanOutcomesContainer) flowPlanOutcomesContainer.style.display = 'none';
    }
  }

  if (window.safeCreateIcons) {
    window.safeCreateIcons();
  }
}

  function openAttendanceModal() {
    const modal = document.getElementById('modal-attendance');
    if (!modal) return;
    
    const dateInput = document.getElementById('attendance-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = window.formatLocalDate();
    }
    
    modal.classList.add('active');
    renderAttendanceStudentsList();
  }

  function renderAttendanceStudentsList() {
    const listContainer = document.getElementById('attendance-students-list');
    const dateInput = document.getElementById('attendance-date');
    if (!listContainer || !dateInput) return;
    
    const selectedDate = dateInput.value;
    listContainer.innerHTML = '';
    
    const state = stateManager.loadState();
    const selectBranch = document.getElementById('dash-select-branch');
    const branchFilter = selectBranch ? selectBranch.value : 'all';
    
    const activeStudents = state.students.filter(student => {
      return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
    });

    const sortedStudents = [...activeStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    
    if (sortedStudents.length === 0) {
      listContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">Sınıfta kayıtlı öğrenci yok.</div>';
      return;
    }
    
    sortedStudents.forEach(student => {
      const isAbsent = stateManager.isStudentAbsent(student.id, selectedDate);
      const initials = `${student.name[0] || ''}${student.surname[0] || ''}`.toUpperCase();
      
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-primary); transition: all 0.2s ease;';
      
      const avatarStyle = student.gender === 'female' 
        ? 'background: rgba(236, 72, 153, 0.1); color: rgb(236, 72, 153);' 
        : 'background: rgba(99, 102, 241, 0.1); color: var(--primary);';
        
      const avatarHtml = student.photo
        ? `<img src="${student.photo}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">`
        : `<div class="avatar-sm" style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; ${avatarStyle}">${initials}</div>`;
        
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          ${avatarHtml}
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary);">${student.name} ${student.surname}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">No: ${student.number}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="attendance-status-label" style="font-size: 0.8rem; font-weight: 600; color: ${isAbsent ? 'var(--danger)' : 'var(--success)'};">${isAbsent ? 'GELMEDİ' : 'SINIFTA'}</span>
          <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 24px; margin: 0; cursor: pointer;">
            <input type="checkbox" class="attendance-toggle" data-id="${student.id}" ${isAbsent ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isAbsent ? 'var(--danger)' : 'var(--success)'}; transition: .3s; border-radius: 24px;">
              <span class="slider-dot" style="position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; transform: ${isAbsent ? 'translateX(20px)' : 'translateX(0)'};"></span>
            </span>
          </label>
        </div>
      `;
      
      const toggleInput = row.querySelector('.attendance-toggle');
      const slider = row.querySelector('.slider');
      const dot = row.querySelector('.slider-dot');
      
      toggleInput.addEventListener('change', () => {
        stateManager.toggleAttendance(student.id, selectedDate);
        const updatedIsAbsent = stateManager.isStudentAbsent(student.id, selectedDate);
        row.querySelector('.attendance-status-label').textContent = updatedIsAbsent ? 'GELMEDİ' : 'SINIFTA';
        row.querySelector('.attendance-status-label').style.color = updatedIsAbsent ? 'var(--danger)' : 'var(--success)';
        slider.style.backgroundColor = updatedIsAbsent ? 'var(--danger)' : 'var(--success)';
        dot.style.transform = updatedIsAbsent ? 'translateX(20px)' : 'translateX(0)';
        
        const event = new CustomEvent('stateChanged');
        document.dispatchEvent(event);
      });

      listContainer.appendChild(row);
    });
  }

  window.openAttendanceModal = openAttendanceModal;
  window.renderAttendanceStudentsList = renderAttendanceStudentsList;
  window.updateFlowContent = updateFlowContent;
  window.setupDashboardTab = setupDashboardTab;
  window.renderDashboard = renderDashboard;
  window.openStudentDetailModal = openStudentDetailModal;
  window.openEditStudentModal = openEditStudentModal;
})();
