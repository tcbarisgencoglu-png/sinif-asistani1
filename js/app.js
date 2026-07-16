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

  // 4. Varsayılan Dashboard Görünümünü Yükle
  updateVisibilityByEducationLevel();
  renderDashboard();

  // Register branch select listeners
  const selectIdsWithCallbacks = [
    { id: 'dash-select-branch', callback: () => renderDashboard() },
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

  // Güncelleme kontrolü — arka planda, uygulamayı bekletmeden
  checkForUpdates();
}

// Mevcut uygulama sürümü (her güncellemede değişir)
const APP_VERSION = '1.0.1';

// GitHub'dan güncelleme kontrolü
async function checkForUpdates() {
  try {
    // Kullanıcı "Daha Sonra Hatırlat" dediyse ve 7 gün geçmediyse atla
    const snoozedUntil = localStorage.getItem('update_snoozed_until');
    if (snoozedUntil && Date.now() < parseInt(snoozedUntil)) return;

    const response = await fetch(
      'https://raw.githubusercontent.com/tcbarisgencoglu-png/sinif-asistani1/main/version.json',
      { cache: 'no-cache', signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) return;

    const data = await response.json();
    const latestVersion = data.version || '';
    if (!latestVersion || latestVersion === APP_VERSION) return;

    // Sürüm karşılaştır (x.y.z formatı)
    const parseVer = v => v.split('.').map(Number);
    const [lMaj, lMin, lPat] = parseVer(latestVersion);
    const [cMaj, cMin, cPat] = parseVer(APP_VERSION);
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
    if (elNotes)   elNotes.textContent   = data.release_notes || 'Yeni iyileştirmeler ve düzeltmeler mevcut.';
    if (btnDownload) {
      btnDownload.onclick = () => {
        const url = data.release_url || 'https://github.com/tcbarisgencoglu-png/sinif-asistani1/releases/latest';
        window.safeOpenURL(url);
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
      renderBooksList();
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

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeUI(newTheme);
  showToast(`${newTheme === 'dark' ? 'Koyu' : 'Açık'} tema aktif edildi.`, 'primary');
}

function updateThemeUI(theme) {
  if (themeIcon) {
    if (theme === 'dark') {
      themeIcon.setAttribute('data-lucide', 'sun');
    } else {
      themeIcon.setAttribute('data-lucide', 'moon');
    }
  }
  if (themeText) {
    if (theme === 'dark') {
      themeText.textContent = 'Açık Tema';
    } else {
      themeText.textContent = 'Koyu Tema';
    }
  }
  if (window.updateConfigThemeUI) {
    window.updateConfigThemeUI();
  }
  window.safeCreateIcons();
}

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
