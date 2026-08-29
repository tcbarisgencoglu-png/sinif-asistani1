(() => {
// Giriş dosyası - Modüller global olarak yüklendiği için importlar kaldırıldı.

// Çevrimdışı Çalışma Koruması: Lucide kütüphanesi yüklenemezse uygulamanın çökmesini önle
if (typeof window.lucide === 'undefined') {
  window.lucide = {
    createIcons: () => console.warn("Lucide ikon kütüphanesi yüklenemedi, çevrimdışı modda çalışılıyor.")
  };
}

// Güvenli İkon Oluşturma Yardımcısı
window.safeCreateIcons = () => {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    try {
      window.lucide.createIcons();
    } catch (e) {
      console.warn("Lucide ikonları yüklenirken hata oluştu:", e);
    }
  }
};

// Native printing support bridge
if (window.AndroidInterface && typeof window.AndroidInterface.printPage === 'function') {
  window.print = function() {
    window.AndroidInterface.printPage();
  };
}

// Tauri ve Tarayıcı Uyumlu Güvenli Link Açıcı
window.safeOpenURL = (url) => {
  if (window.__TAURI__) {
    try {
      if (window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
        window.__TAURI__.core.invoke('plugin:opener|open', { path: url })
          .catch(err => {
            console.error('Tauri opener failed:', err);
            window.open(url, '_blank');
          });
        return;
      } else if (window.__TAURI__.invoke && typeof window.__TAURI__.invoke === 'function') {
        window.__TAURI__.invoke('plugin:opener|open', { path: url })
          .catch(err => {
            console.error('Tauri invoke failed:', err);
            window.open(url, '_blank');
          });
        return;
      }
    } catch (e) {
      console.error('Tauri open error:', e);
    }
  }
  window.open(url, '_blank');
};

// Özelleştirilmiş ve tüm platformlarda çalışan Asenkron Onay Kutusu (Tauri macOS için confirm() alternatifi)
window.confirmAsync = function(message) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.zIndex = '9999';
    
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.maxWidth = '450px';
    content.style.padding = '1.5rem';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '1.25rem';
    content.style.borderRadius = 'var(--radius-lg)';
    content.style.backgroundColor = 'var(--bg-secondary)';
    content.style.border = '1px solid var(--border-color)';
    
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '0.5rem';
    header.style.fontSize = '1.1rem';
    header.style.fontWeight = '600';
    header.style.color = 'var(--text-primary)';
    header.innerHTML = `<i data-lucide="help-circle" style="color: var(--primary); width: 20px; height: 20px;"></i> <span>Sistem Onayı</span>`;
    
    const body = document.createElement('div');
    body.style.fontSize = '0.95rem';
    body.style.color = 'var(--text-secondary)';
    body.style.lineHeight = '1.5';
    body.innerText = message;
    
    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    footer.style.gap = '0.75rem';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-secondary';
    cancelButton.innerText = 'İptal';
    cancelButton.style.padding = '0.5rem 1rem';
    
    const confirmButton = document.createElement('button');
    confirmButton.className = 'btn btn-danger';
    confirmButton.innerText = 'Evet';
    confirmButton.style.padding = '0.5rem 1rem';
    
    footer.appendChild(cancelButton);
    footer.appendChild(confirmButton);
    
    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    modal.appendChild(content);
    
    document.body.appendChild(modal);
    
    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }
    
    const cleanup = (result) => {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.remove();
      }, 200);
      resolve(result);
    };
    
    confirmButton.addEventListener('click', () => cleanup(true));
    cancelButton.addEventListener('click', () => cleanup(false));
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup(false);
      }
    });
  });
};

// Global Hata Yakalayıcı ve Arayüz Bildirimi
window.onerror = function(message, source, lineno, colno, error) {
  const errorMsg = `JS Hatası: ${message} (Satır: ${lineno})`;
  console.error("Global Error:", message, "at", source, ":", lineno, error);
  if (window.showToast) {
    window.showToast(errorMsg, 'danger');
  } else {
    alert(errorMsg);
  }
  return false;
};

// DOM Elemanları
const navItems = document.querySelectorAll('.nav-menu .nav-item');
const contentSections = document.querySelectorAll('.content-section');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');
const btnExport = document.getElementById('backup-export');
const btnImportTrigger = document.getElementById('backup-import-trigger');
const fileImportInput = document.getElementById('backup-import-file');
const toastContainer = document.getElementById('toast-container');

// SEED DATA (Başlangıç Örnek Verileri)
const SEED_DATA = {
  students: [
    { id: 'std_1', name: 'Ahmet', surname: 'Yılmaz', number: '101', gender: 'male', parentPhone: '05551112233', notes: 'Matematik dersinde çok başarılı.', createdAt: new Date().toISOString() },
    { id: 'std_2', name: 'Elif', surname: 'Kaya', number: '102', gender: 'female', parentPhone: '05552223344', notes: 'Sınıf kitaplık sorumlusu.', createdAt: new Date().toISOString() },
    { id: 'std_3', name: 'Can', surname: 'Demir', number: '103', gender: 'male', parentPhone: '05553334455', notes: 'Gitar çalıyor, müzik kolunda.', createdAt: new Date().toISOString() },
    { id: 'std_4', name: 'Merve', surname: 'Çelik', number: '104', gender: 'female', parentPhone: '05554445566', notes: 'Resim yeteneği çok yüksek.', createdAt: new Date().toISOString() },
    { id: 'std_5', name: 'Yiğit', surname: 'Öztürk', number: '105', gender: 'male', parentPhone: '05555556677', notes: 'Biraz çekingen ama derse katılıyor.', createdAt: new Date().toISOString() }
  ],
  homeworks: [
    {
      id: 'hw_1',
      title: 'Matematik - Kesirler Çalışması',
      description: 'Çalışma kağıdındaki ilk 10 soru çözülecektir.',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), // 3 gün sonra
      status: { 'std_1': 'completed', 'std_2': 'completed', 'std_3': 'incomplete', 'std_4': 'completed', 'std_5': 'missing' },
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'hw_2',
      title: 'Türkçe - Kitap Özeti Çıkarma',
      description: 'Okunan son kitabın ana fikri yazılacaktır.',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10), // 5 gün sonra
      status: { 'std_1': 'completed', 'std_2': 'completed', 'std_3': 'completed', 'std_4': 'excused', 'std_5': 'incomplete' },
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ],
  books: {
    library: [
      { id: 'book_1', title: 'Küçük Prens', author: 'Antoine de Saint-Exupéry', pages: 96, createdAt: new Date().toISOString() },
      { id: 'book_2', title: 'Şeker Portakalı', author: 'José Mauro de Vasconcelos', pages: 182, createdAt: new Date().toISOString() },
      { id: 'book_3', title: 'Sol Ayağım', author: 'Christy Brown', pages: 192, createdAt: new Date().toISOString() },
      { id: 'book_4', title: 'Define Adası', author: 'Robert Louis Stevenson', pages: 224, createdAt: new Date().toISOString() }
    ],
    transactions: [
      { id: 'tx_1', studentId: 'std_1', bookId: 'book_1', borrowDate: new Date(Date.now() - 86400000 * 10).toISOString().slice(0, 10), returnDate: new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10), status: 'returned' },
      { id: 'tx_2', studentId: 'std_2', bookId: 'book_2', borrowDate: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10), returnDate: null, status: 'reading' },
      { id: 'tx_3', studentId: 'std_3', bookId: 'book_3', borrowDate: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10), returnDate: null, status: 'reading' }
    ]
  },
  performance: [
    { id: 'perf_1', studentId: 'std_1', type: 'positive', point: 1, reason: 'Derse Katılım', date: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'perf_2', studentId: 'std_2', type: 'positive', point: 2, reason: 'Arkadaşlık / Yardımlaşma', date: new Date(Date.now() - 3600000 * 4).toISOString() },
    { id: 'perf_3', studentId: 'std_3', type: 'development', point: -1, reason: 'Derse Geç Kalma', date: new Date(Date.now() - 3600000 * 24).toISOString() },
    { id: 'perf_4', studentId: 'std_4', type: 'positive', point: 3, reason: 'Örnek Davranış', date: new Date(Date.now() - 3600000 * 30).toISOString() },
    { id: 'perf_5', studentId: 'std_1', type: 'positive', point: 2, reason: 'Kitap Okuma Tamamlandı: Küçük Prens', date: new Date(Date.now() - 86400000 * 4).toISOString() }
  ],
  weeklyEvaluations: [
    {
      weekId: '2026-W22',
      ratings: { behavior: 4, cleanliness: 5, participation: 4 },
      notes: 'Sınıf genelinde bu hafta kesirler konusuna ilgi yüksekti. Temizlik sıralamasında okuldaki en temiz sınıf seçildik!',
      updatedAt: new Date().toISOString()
    }
  ]
};

// Dinamik Bildirim Sistemi (Toast)
function showToast(message, type = 'primary') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle-2';
  else if (type === 'danger') iconName = 'alert-triangle';
  else if (type === 'warning') iconName = 'alert-circle';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);
  window.safeCreateIcons();

  // 4 Saniye sonra kaldır
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.25s reverse ease-in forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}

window.showToast = showToast;

// Uygulama Başlatma
function initApp() {
  // 1. Veritabanını kontrol et, boşsa demo verisi yükle
  const currentDB = localStorage.getItem('sinif_asistani_data');
  if (!currentDB) {
    localStorage.setItem('sinif_asistani_data', JSON.stringify(SEED_DATA));
    console.log("Demo verileri sisteme başarıyla yüklendi.");
  }

  // 2. Temayı Yükle
  initTheme();

  // 2.5. Önceki yüklenen planları otomatik olarak tanımlı ders adlarına eşitle (Eşleşme Düzeltmesi)
  const state = stateManager.state;
  if (state && state.plans && state.plans.length > 0 && state.definedLessons && window.isLessonPlanMatch) {
    let stateUpdated = false;
    state.plans.forEach(plan => {
      const matched = state.definedLessons.find(l => l && window.isLessonPlanMatch(plan.courseName || plan.title, l.name));
      if (matched && plan.courseName !== matched.name) {
        console.log(`Otomatik plan ismi düzeltildi: "${plan.courseName}" -> "${matched.name}"`);
        plan.courseName = matched.name;
        if (plan.title) plan.title = matched.name;
        stateUpdated = true;
      }
    });
    if (stateUpdated) {
      stateManager.saveState();
    }
  }

  // 3. Modül Tetikleyicilerini Kaydet
  setupDashboardTab(showToast);
  setupPerformanceTab(showToast);
  setupBooksTab(showToast);
  setupHomeworkTab(showToast);
  setupWeeklyTab(showToast);
  if (window.setupGamesTab) {
    setupGamesTab(showToast);
  }
  if (window.setupTreasureGame) {
    setupTreasureGame(showToast);
  }
  if (window.setupTasksTab) {
    setupTasksTab(showToast);
  }
  if (window.setupConfigTab) {
    setupConfigTab(showToast);
  }
  if (window.setupToolsTab) {
    setupToolsTab(showToast);
  }
  if (window.setupScheduleTool) {
    setupScheduleTool(showToast);
  }
  if (window.setupDocuments) {
    setupDocuments(showToast);
  }
  if (window.setupPlans) {
    setupPlans(showToast);
  }
  if (window.setupWrittenExamTool) {
    setupWrittenExamTool(showToast);
  }
  if (window.setupExamAnalysisTool) {
    setupExamAnalysisTool(showToast);
  }
  if (window.renderSeating) {
    renderSeating();
  }

  // 4. Varsayılan Dashboard Görünümünü Yükle
  updateVisibilityByEducationLevel();
  renderDashboard();

  // Register branch select listeners
  const selectIdsWithCallbacks = [
    { id: 'dash-select-branch', callback: () => {
        renderDashboard();
        if (window.refreshSeatingCanvas) window.refreshSeatingCanvas();
      }
    },
    { id: 'books-select-branch', callback: () => { if (window.renderLeaderboard) window.renderLeaderboard(); } },
    { id: 'homework-select-branch', callback: () => { if (window.renderHomeworkMatrix) window.renderHomeworkMatrix(); } },
    { id: 'quiz-select-branch', callback: () => { if (window.renderQuizStudentSelection) window.renderQuizStudentSelection(); } },
    { id: 'mult-select-branch', callback: () => { if (window.renderMultStudentSelection) window.renderMultStudentSelection(); } },
    { id: 'tasks-filter-branch', callback: () => { if (window.renderTasksList) window.renderTasksList(); } }
  ];

  selectIdsWithCallbacks.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      if (item.id === 'dash-select-branch') {
        el.addEventListener('change', (e) => {
          try {
            // Sync all other branch dropdowns and trigger their callbacks
            const val = e.target.value;
            selectIdsWithCallbacks.forEach(other => {
              if (other.id !== 'dash-select-branch') {
                const otherEl = document.getElementById(other.id);
                if (otherEl) {
                  otherEl.value = val;
                  try {
                    other.callback();
                  } catch (callbackErr) {
                    console.error(`Callback error for ${other.id}:`, callbackErr);
                    if (window.showToast) {
                      window.showToast(`Hata (${other.id}): ${callbackErr.message}`, 'danger');
                    }
                  }
                }
              }
            });
            item.callback();
          } catch (err) {
            console.error("Dashboard branch change sync error:", err);
            if (window.showToast) {
              window.showToast(`Şube senkronizasyon hatası: ${err.message}`, 'danger');
            }
          }
        });
      } else {
        el.addEventListener('change', item.callback);
      }
    }
  });

  // 5. Sekmeler Arası Geçiş Yönetimi
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabName = item.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Mobil Sidebar Çekmece Yönetimi (Hamburger Menü)
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const btnCloseSidebar = document.getElementById('btn-close-sidebar');
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (btnToggleSidebar && sidebar && backdrop) {
    btnToggleSidebar.addEventListener('click', () => {
      sidebar.classList.add('open');
      backdrop.classList.add('active');
    });

    const closeSidebarFn = () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    };

    if (btnCloseSidebar) {
      btnCloseSidebar.addEventListener('click', closeSidebarFn);
    }

    backdrop.addEventListener('click', closeSidebarFn);

    // Sekmeye tıklandığında çekmeceyi otomatik kapat
    navItems.forEach(item => {
      item.addEventListener('click', closeSidebarFn);
    });
  }

  // 6. Yedekleme/Geri Yükleme Olayları
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      stateManager.exportData();
      showToast('Verileriniz bilgisayarınıza indirildi.', 'success');
    });
  }

  if (btnImportTrigger) {
    btnImportTrigger.addEventListener('click', () => {
      if (fileImportInput) fileImportInput.click();
    });
  }

  if (fileImportInput) {
    fileImportInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const success = stateManager.importData(evt.target.result);
        if (success) {
          showToast('Yedek başarıyla yüklendi, veriler güncellendi.', 'success');
          // Aktif sekmeyi yeniden çiz
          const activeTab = document.querySelector('.nav-item.active').getAttribute('data-tab');
          switchTab(activeTab);
        } else {
          showToast('Yüklenen dosya geçersiz bir sınıf yedek dosyası!', 'danger');
        }
      };
      reader.readAsText(file);
      // Aynı dosyayı tekrar yükleyebilmek için inputu sıfırla
      fileImportInput.value = '';
    });
  }

  // 7. Tema Butonu Tıklaması
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // 8. Global State Değişiklik Olayı Dinleme
  // Diğer modüllerde state değiştirildiğinde aktif ekranı yenile
  document.addEventListener('stateChanged', () => {
    updateVisibilityByEducationLevel();
    const activeTab = document.querySelector('.nav-item.active').getAttribute('data-tab');
    switchTab(activeTab, false); // Sayfa geçiş animasyonu yapmadan sadece veriyi yeniler
  });

  // 9. Sistem Sıfırlama Olayları
  const btnSystemReset = document.getElementById('btn-system-reset');
  const modalSystemReset = document.getElementById('modal-system-reset');
  const formSystemReset = document.getElementById('form-system-reset');
  const resetPasswordInput = document.getElementById('reset-password');
  const resetErrorMsg = document.getElementById('reset-error-msg');

  if (btnSystemReset) {
    btnSystemReset.addEventListener('click', () => {
      if (formSystemReset) formSystemReset.reset();
      if (resetErrorMsg) resetErrorMsg.style.display = 'none';
      if (modalSystemReset) modalSystemReset.classList.add('active');
    });
  }

  if (modalSystemReset) {
    modalSystemReset.querySelectorAll('.close-btn, .close-btn-action').forEach(btn => {
      btn.addEventListener('click', () => {
        modalSystemReset.classList.remove('active');
      });
    });

    if (formSystemReset) {
      formSystemReset.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = resetPasswordInput.value;
        if (pwd === 'sifirla123') {
          stateManager.resetState();
          modalSystemReset.classList.remove('active');
          showToast('Sistem başarıyla sıfırlandı. Tüm veriler temizlendi.', 'success');
          
          setTimeout(() => {
            location.reload();
          }, 1500);
        } else {
          resetErrorMsg.style.display = 'block';
        }
      });
    }
  }

  window.safeCreateIcons();

  // Yan Menü Daraltma (Sidebar Collapse) Yönetimi
  const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
  if (isCollapsed) {
    document.body.classList.add('sidebar-collapsed');
  }

  const btnToggleSidebarCollapse = document.getElementById('btn-toggle-sidebar-collapse');
  if (btnToggleSidebarCollapse) {
    btnToggleSidebarCollapse.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
      localStorage.setItem('sidebar-collapsed', document.body.classList.contains('sidebar-collapsed'));
    });
  }

  // Keyboard Arrow Keys (Left / Right Arrow) collapse support
  document.addEventListener('keydown', (e) => {
    // Avoid triggering when user is active inside an input/textarea
    if (document.activeElement && (
      document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.isContentEditable
    )) {
      return;
    }
    
    if (e.key === 'ArrowLeft') {
      document.body.classList.add('sidebar-collapsed');
      localStorage.setItem('sidebar-collapsed', 'true');
    } else if (e.key === 'ArrowRight') {
      document.body.classList.remove('sidebar-collapsed');
      localStorage.setItem('sidebar-collapsed', 'false');
    }
  });

  // --- HATIRLATICI YÖNETİMİ ---
  const modalReminderAdd = document.getElementById('modal-reminder-add');
  const modalReminderAlert = document.getElementById('modal-reminder-alert');
  const formReminderAdd = document.getElementById('form-reminder-add');
  
  // Close / Cancel add modal
  const closeReminderAdd = () => {
    if (modalReminderAdd) modalReminderAdd.classList.remove('active');
  };
  
  const btnCloseReminderAddModal = document.getElementById('btn-close-reminder-add-modal');
  if (btnCloseReminderAddModal) btnCloseReminderAddModal.addEventListener('click', closeReminderAdd);
  const btnCancelReminderAdd = document.getElementById('btn-cancel-reminder-add');
  if (btnCancelReminderAdd) btnCancelReminderAdd.addEventListener('click', closeReminderAdd);
  
  // Close alert modal
  const btnCloseReminderAlert = document.getElementById('btn-close-reminder-alert');
  if (btnCloseReminderAlert) {
    btnCloseReminderAlert.addEventListener('click', () => {
      if (modalReminderAlert) modalReminderAlert.classList.remove('active');
    });
  }

  // Play audio alarm beep tone using Web Audio API
  function playReminderAlertSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      };
      
      // Triple notification chime
      playTone(523.25, ctx.currentTime, 0.15);       // C5
      playTone(659.25, ctx.currentTime + 0.18, 0.15);  // E5
      playTone(783.99, ctx.currentTime + 0.36, 0.4);   // G5
    } catch (e) {
      console.warn("Audio Context playback failed:", e);
    }
  }

  // Submit new reminder
  if (formReminderAdd) {
    formReminderAdd.addEventListener('submit', (e) => {
      e.preventDefault();
      const noteInput = document.getElementById('reminder-note');
      const datetimeInput = document.getElementById('reminder-datetime');
      if (!noteInput || !datetimeInput) return;

      const noteVal = noteInput.value.trim();
      const datetimeVal = datetimeInput.value; // YYYY-MM-DDTHH:MM format

      if (!noteVal || !datetimeVal) return;

      const reminders = JSON.parse(localStorage.getItem('sinif-asistani-reminders') || '[]');
      reminders.push({
        id: 'rem-' + Date.now(),
        note: noteVal,
        datetime: datetimeVal,
        triggered: false
      });
      localStorage.setItem('sinif-asistani-reminders', JSON.stringify(reminders));

      closeReminderAdd();
      if (window.showToast) {
        window.showToast('Hatırlatıcı başarıyla eklendi.', 'success');
      } else {
        alert('Hatırlatıcı başarıyla eklendi.');
      }
    });
  }

  // --- HATIRLATICI LİSTESİ MANTIĞI ---
  const btnShowAllReminders = document.getElementById('btn-show-all-reminders');
  const modalRemindersList = document.getElementById('modal-reminders-list');
  const btnCloseRemindersListModal = document.getElementById('btn-close-reminders-list-modal');
  const btnCloseRemindersListFooter = document.getElementById('btn-close-reminders-list-footer');
  const remindersStickyNotesContainer = document.getElementById('reminders-sticky-notes-container');
  const remindersEmptyMessage = document.getElementById('reminders-empty-message');

  const openRemindersListModal = () => {
    // Close the add modal first
    closeReminderAdd();
    
    // Render notes
    renderReminderStickyNotes();
    
    // Open list modal
    if (modalRemindersList) modalRemindersList.classList.add('active');
  };

  const closeRemindersListModal = () => {
    if (modalRemindersList) modalRemindersList.classList.remove('active');
  };

  if (btnShowAllReminders) btnShowAllReminders.addEventListener('click', openRemindersListModal);
  if (btnCloseRemindersListModal) btnCloseRemindersListModal.addEventListener('click', closeRemindersListModal);
  if (btnCloseRemindersListFooter) btnCloseRemindersListFooter.addEventListener('click', closeRemindersListModal);

  function renderReminderStickyNotes() {
    if (!remindersStickyNotesContainer) return;
    
    const reminders = JSON.parse(localStorage.getItem('sinif-asistani-reminders') || '[]');
    
    if (reminders.length === 0) {
      remindersStickyNotesContainer.style.display = 'none';
      if (remindersEmptyMessage) remindersEmptyMessage.style.display = 'block';
      return;
    }
    
    remindersStickyNotesContainer.style.display = 'grid';
    if (remindersEmptyMessage) remindersEmptyMessage.style.display = 'none';
    
    // Sort reminders: closest in time first (chronological order)
    reminders.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    
    remindersStickyNotesContainer.innerHTML = reminders.map(rem => {
      const remTime = new Date(rem.datetime);
      const formattedDate = remTime.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const isPast = remTime < new Date();
      const statusBadge = isPast 
        ? `<span style="font-size: 0.65rem; padding: 2px 6px; background: rgba(0,0,0,0.06); border-radius: 4px; color: #475569; font-weight: 700; margin-left: auto;">Geçti</span>`
        : `<span style="font-size: 0.65rem; padding: 2px 6px; background: rgba(16, 185, 129, 0.1); border-radius: 4px; color: #10b981; font-weight: 700; margin-left: auto;">Bekliyor</span>`;
      
      return `
        <div class="sticky-note">
          <div class="sticky-note-pin"></div>
          <button class="sticky-note-delete-btn" onclick="deleteReminderItem('${rem.id}')" title="Hatırlatıcıyı Sil">&times;</button>
          <div class="sticky-note-text">${rem.note}</div>
          <div class="sticky-note-time">
            <i data-lucide="calendar" style="width: 12px; height: 12px; stroke-width: 2.5;"></i>
            <span>${formattedDate}</span>
            ${statusBadge}
          </div>
        </div>
      `;
    }).join('');
    
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Delete reminder item function
  window.deleteReminderItem = (id) => {
    let reminders = JSON.parse(localStorage.getItem('sinif-asistani-reminders') || '[]');
    reminders = reminders.filter(rem => rem.id !== id);
    localStorage.setItem('sinif-asistani-reminders', JSON.stringify(reminders));
    renderReminderStickyNotes();
    if (window.showToast) window.showToast('Hatırlatıcı silindi.', 'info');
  };

  // Periodic Reminder Checker (runs every 2 seconds)
  setInterval(() => {
    const reminders = JSON.parse(localStorage.getItem('sinif-asistani-reminders') || '[]');
    let updated = false;
    const now = new Date();

    reminders.forEach(rem => {
      if (!rem.triggered) {
        const remTime = new Date(rem.datetime);
        if (remTime <= now) {
          rem.triggered = true;
          updated = true;

          // Open Alert Modal
          if (modalReminderAlert) {
            const alertText = document.getElementById('reminder-alert-text');
            const alertTime = document.getElementById('reminder-alert-time');
            if (alertText) alertText.textContent = rem.note;
            if (alertTime) {
              const formattedDate = remTime.toLocaleString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              alertTime.textContent = `Tarih: ${formattedDate}`;
            }
            modalReminderAlert.classList.add('active');
            
            // Play physical chime alert
            playReminderAlertSound();
          }
        }
      }
    });

    if (updated) {
      localStorage.setItem('sinif-asistani-reminders', JSON.stringify(reminders));
    }
  // URL parametresinden otomatik lisans aktifleştirme (?license=...)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const licenseFromUrl = urlParams.get('license');
    if (licenseFromUrl && window.LicenseConfig && window.LicenseConfig.saveLicense) {
      window.LicenseConfig.saveLicense(licenseFromUrl).then(res => {
        if (res.success) {
          const alertMsg = `🎉 Tebrikler! 1 Aylık Tam Sürüm Lisansınız Otomatik Aktifleştirildi! (Lisans Sahibi: ${res.licensee})`;
          if (window.showToast) {
            window.showToast(alertMsg, 'success');
          } else {
            alert(alertMsg);
          }
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          const event = new CustomEvent('stateChanged');
          document.dispatchEvent(event);
        }
      }).catch(err => console.error("URL license auto-activation error:", err));
    }
  } catch (e) {
    console.error("URL parse error:", e);
  }

  // Güncelleme kontrolü — arka planda, uygulamayı bekletmeden
  checkForUpdates();
}

// Mevcut uygulama sürümü (her güncellemede değişir)
const APP_VERSION = '1.0.2';

// GitHub'dan güncelleme kontrolü
async function checkForUpdates() {
  try {
    // Kullanıcı "Daha Sonra Hatırlat" dediyse ve 7 gün geçmediyse atla
    const snoozedUntil = localStorage.getItem('update_snoozed_until');
    if (snoozedUntil && Date.now() < parseInt(snoozedUntil)) return;

    let latestVersion = '';
    let releaseNotes = 'Yeni iyileştirmeler ve düzeltmeler mevcut.';
    let releaseUrl = 'https://github.com/tcbarisgencoglu-png/sinif-asistani1/releases/latest';

    try {
      const ghRes = await fetch('https://api.github.com/repos/tcbarisgencoglu-png/sinif-asistani1/releases/latest', {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        signal: AbortSignal.timeout(6000)
      });
      if (ghRes.ok) {
        const ghData = await ghRes.json();
        latestVersion = (ghData.tag_name || '').replace(/^v/, '');
        if (ghData.body) releaseNotes = ghData.body;
        if (ghData.html_url) releaseUrl = ghData.html_url;
      }
    } catch (e) {
      // Fallback local version.json
      try {
        const localRes = await fetch('/version.json', { cache: 'no-cache', signal: AbortSignal.timeout(4000) });
        if (localRes.ok) {
          const localData = await localRes.json();
          latestVersion = localData.version || '';
          if (localData.release_notes) releaseNotes = localData.release_notes;
          if (localData.release_url) releaseUrl = localData.release_url;
        }
      } catch (err) {}
    }

    if (!latestVersion || latestVersion === APP_VERSION) return;

    // Sürüm karşılaştır (x.y.z formatı)
    const parseVer = v => v.split('.').map(n => parseInt(n, 10) || 0);
    const [lMaj = 0, lMin = 0, lPat = 0] = parseVer(latestVersion);
    const [cMaj = 0, cMin = 0, cPat = 0] = parseVer(APP_VERSION);
    const isNewer = lMaj > cMaj || (lMaj === cMaj && lMin > cMin) || (lMaj === cMaj && lMin === cMin && lPat > cPat);
    if (!isNewer) return;

    // Modal içeriğini doldur ve göster
    const modal = document.getElementById('modal-update-checker');
    if (!modal) return;

    const elCurrent = document.getElementById('update-current-version');
    const elLatest  = document.getElementById('update-latest-version');
    const elNotes   = document.getElementById('update-release-notes');
    const btnDownload = document.getElementById('btn-update-download');

    if (elCurrent) elCurrent.textContent = `v${APP_VERSION}`;
    if (elLatest)  elLatest.textContent  = `v${latestVersion}`;
    if (elNotes)   elNotes.textContent   = releaseNotes;
    if (btnDownload) {
      btnDownload.onclick = () => {
        window.safeOpenURL(releaseUrl);
        modal.classList.remove('active');
      };
    }

    const btnSnooze = document.getElementById('btn-update-snooze');
    if (btnSnooze) {
      btnSnooze.onclick = () => {
        // 7 gün sonrasını kaydet
        localStorage.setItem('update_snoozed_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
        modal.classList.remove('active');
      };
    }

    const btnClose = document.getElementById('btn-update-close');
    if (btnClose) {
      btnClose.onclick = () => modal.classList.remove('active');
    }

    // 2 saniye sonra göster (uygulama tamamen yüklendikten sonra)
    setTimeout(() => modal.classList.add('active'), 2000);

  } catch (_) {
    // İnternet yoksa veya hata oluşursa sessizce geç
  }
}

// Sekme Değiştirme
function switchTab(tabId, animate = true) {
  // Menü Seçimini Güncelle
  navItems.forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Bölümü Görünür Yap
  contentSections.forEach(section => {
    if (section.id === tabId) {
      section.classList.add('active');
      if (animate) {
        section.style.animation = 'none';
        section.offsetHeight; // Reflow tetikler
        section.style.animation = null;
      }
    } else {
      section.classList.remove('active');
    }
  });

  // Bölümün Verilerini Yenile
  switch (tabId) {
    case 'dashboard':
      renderDashboard();
    case 'books':
      {
        const activeBooksTabBtn = document.querySelector('#books .sub-tab-menu .sub-tab-btn.active');
        const booksTab = activeBooksTabBtn ? activeBooksTabBtn.getAttribute('data-books-tab') : 'library';
        if (booksTab === 'library') {
          if (window.renderLeaderboard) window.renderLeaderboard();
        } else if (booksTab === 'student-library') {
          if (window.initStudentLibraryTab) {
            // Keep current selection if any
            const select = document.getElementById('student-library-select');
            const currentSelectedId = select ? select.value : '';
            window.initStudentLibraryTab();
            if (select && currentSelectedId) {
              select.value = currentSelectedId;
              window.renderStudentLibraryDetails(currentSelectedId);
            }
          }
        } else if (booksTab === 'leaderboard') {
          if (window.renderBooksList) window.renderBooksList();
        } else if (booksTab === 'late') {
          if (window.renderLateBooksList) window.renderLateBooksList();
        } else if (booksTab === 'top20') {
          if (window.renderTop20Leaderboard) window.renderTop20Leaderboard();
        }
      }
      break;
    case 'homework':
      renderHomeworkMatrix();
      break;
    case 'games':
      if (window.renderGames) {
        renderGames();
      }
      if (window.renderTreasureGame) {
        renderTreasureGame();
      }
      break;
    case 'tasks':
      if (window.renderTasksList) {
        renderTasksList();
      }
      break;
    case 'reports':
      if (window.renderReports) {
        window.renderReports();
      }
      break;
    case 'notebooks':
      if (window.renderNotebooks) {
        window.renderNotebooks();
      }
      break;
    case 'assistant-config':
      if (window.renderConfig) {
        renderConfig();
      }
      break;
    case 'tools':
      if (window.renderTools) {
        renderTools();
      }
      const toolsRosterView = document.getElementById('tools-roster-view');
      const toolsPlansView = document.getElementById('tools-plans-view');
      const toolsDocumentsView = document.getElementById('tools-documents-view');
      const toolsScheduleView = document.getElementById('tools-schedule-view');
      const toolsWrittenExamView = document.getElementById('tools-written-exam-view');
      const toolsExamAnalysisView = document.getElementById('tools-exam-analysis-view');
      const toolsLandingView = document.getElementById('tools-landing-view');
      if (toolsRosterView) toolsRosterView.style.display = 'none';
      if (toolsPlansView) toolsPlansView.style.display = 'none';
      if (toolsDocumentsView) toolsDocumentsView.style.display = 'none';
      if (toolsScheduleView) toolsScheduleView.style.display = 'none';
      if (toolsWrittenExamView) toolsWrittenExamView.style.display = 'none';
      if (toolsExamAnalysisView) toolsExamAnalysisView.style.display = 'none';
      if (toolsLandingView) toolsLandingView.style.display = 'block';
      break;
    // Weekly kendi iç listenerları ile veri yüklemesini idare eder
  }

  // Menü kapanmasını tetikle (Mobil uyumluluk için yararlı)
  window.safeCreateIcons();
}

// Tema Yönetimi
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  updateThemeUI(savedTheme);
}

function setTheme(newTheme) {
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeUI(newTheme);
  const themeNames = { light: 'Açık', dark: 'Koyu', vibrant: 'Canlı', pastel: 'Pastel' };
  showToast(`${themeNames[newTheme] || newTheme} tema aktif edildi.`, 'primary');
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme') || 'light';
  const themes = ['light', 'dark', 'vibrant', 'pastel'];
  let nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
  if (nextIndex === -1) nextIndex = 0;
  const newTheme = themes[nextIndex];
  setTheme(newTheme);
}

function updateThemeUI(theme) {
  if (themeIcon) {
    if (theme === 'dark' || theme === 'pastel') {
      themeIcon.setAttribute('data-lucide', 'sun');
    } else {
      themeIcon.setAttribute('data-lucide', 'moon');
    }
  }
  if (themeText) {
    const themeNames = { light: 'Açık', dark: 'Koyu', vibrant: 'Canlı', pastel: 'Pastel' };
    themeText.textContent = `${themeNames[theme] || theme} Tema`;
  }
  if (window.updateConfigThemeUI) {
    window.updateConfigThemeUI();
  }
  window.safeCreateIcons();
}

window.setTheme = setTheme;
window.toggleTheme = toggleTheme;

function updateVisibilityByEducationLevel() {
  const state = stateManager.loadState();
  const isMiddle = state.educationLevel === 'middle';

  const branchContainers = document.querySelectorAll('.branch-filter-container');
  branchContainers.forEach(container => {
    if (container.id === 'dash-branch-filter-container' || container.id === 'report-branch-container') {
      container.style.display = isMiddle ? 'flex' : 'none';
    } else {
      container.style.display = 'none';
    }
  });

  const studentBranchGroup = document.getElementById('student-branch-group');
  if (studentBranchGroup) {
    studentBranchGroup.style.display = isMiddle ? 'block' : 'none';
    const studentBranchInput = document.getElementById('student-branch');
    if (studentBranchInput) {
      if (isMiddle) {
        studentBranchInput.setAttribute('required', 'true');
      } else {
        studentBranchInput.removeAttribute('required');
        studentBranchInput.value = '';
      }
    }
  }

  const examBranchGroup = document.getElementById('exam-branch-group');
  if (examBranchGroup) {
    examBranchGroup.style.display = isMiddle ? 'block' : 'none';
    const examBranchInput = document.getElementById('exam-branch-input');
    if (examBranchInput) {
      if (isMiddle) {
        examBranchInput.setAttribute('required', 'true');
      } else {
        examBranchInput.removeAttribute('required');
      }
    }
  }

  const tabBtnBooksTop20 = document.getElementById('tab-btn-books-top20');
  if (tabBtnBooksTop20) {
    tabBtnBooksTop20.style.display = isMiddle ? 'inline-flex' : 'none';
  }

  const cardLaunchWrittenExam = document.getElementById('card-launch-written-exam');
  if (cardLaunchWrittenExam) {
    cardLaunchWrittenExam.style.display = isMiddle ? 'flex' : 'none';
  }

  const cardLaunchExamAnalysis = document.getElementById('card-launch-exam-analysis');
  if (cardLaunchExamAnalysis) {
    cardLaunchExamAnalysis.style.display = isMiddle ? 'flex' : 'none';
  }

  if (!isMiddle) {
    const toolsWrittenExamView = document.getElementById('tools-written-exam-view');
    if (toolsWrittenExamView && toolsWrittenExamView.style.display !== 'none') {
      toolsWrittenExamView.style.display = 'none';
      const toolsLandingView = document.getElementById('tools-landing-view');
      if (toolsLandingView) toolsLandingView.style.display = 'block';
    }

    const toolsExamAnalysisView = document.getElementById('tools-exam-analysis-view');
    if (toolsExamAnalysisView && toolsExamAnalysisView.style.display !== 'none') {
      toolsExamAnalysisView.style.display = 'none';
      const toolsLandingView = document.getElementById('tools-landing-view');
      if (toolsLandingView) toolsLandingView.style.display = 'block';
    }
  }

  if (isMiddle) {
    updateBranchDropdowns(state);
  }
}

function updateBranchDropdowns(state) {
  const selectIds = [
    'dash-select-branch',
    'books-select-branch',
    'homework-select-branch',
    'quiz-select-branch',
    'mult-select-branch',
    'tasks-filter-branch',
    'exam-branch-input',
    'report-select-branch'
  ];

  const students = state.students || [];
  const branches = [...new Set(students.map(s => s.branch).filter(Boolean))];
  branches.sort();

  selectIds.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '';

    // exam-branch-input or forms should not have "All Branches" (Tüm Şubeler)
    const isFilter = id !== 'exam-branch-input';

    if (isFilter) {
      const optAll = document.createElement('option');
      optAll.value = 'all';
      optAll.textContent = 'Tüm Şubeler';
      select.appendChild(optAll);
    } else {
      if (branches.length === 0) {
        const optNone = document.createElement('option');
        optNone.value = '';
        optNone.textContent = 'Lütfen Öğrenci Ekleyin';
        select.appendChild(optNone);
      }
    }

    branches.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = b;
      select.appendChild(opt);
    });

    if (currentVal && (currentVal === 'all' || branches.includes(currentVal))) {
      select.value = currentVal;
    } else {
      select.value = isFilter ? 'all' : (branches[0] || '');
    }
  });
}
window.updateVisibilityByEducationLevel = updateVisibilityByEducationLevel;
window.updateBranchDropdowns = updateBranchDropdowns;

window.toggleTheme = toggleTheme;
window.switchTab = switchTab;

// Sayfa Hazır Olduğunda Başlat
window.addEventListener('DOMContentLoaded', initApp);
})();
