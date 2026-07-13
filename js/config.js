(() => {
  let toastCallback = null;

  // DOM elements for config
  let configSearchStudent;
  let configFilterGender;
  let configStudentsTbody;
  let configSelectWeek;
  let btnConfigPrevWeek;
  let btnConfigNextWeek;
  let btnConfigCurrentWeek;
  
  // Points inputs
  let configFormGlobalSettings;
  let configHwCompleted;
  let configHwIncomplete;
  let configHwMissing;
  let configHwExcused;
  let configBookLimit;
  let configBookOntime;
  let configBookLate;
  let configExamTopcount;
  let configExamRanksContainer;

  // Setup Config Tab
  function setupConfigTab(showToast) {
    toastCallback = showToast;

    // --- Sub-Tab Switching (Genel, Puan, Hafta, Öğrenci) ---
    const configTabButtons = document.querySelectorAll('[data-config-tab]');
    const configTabContents = document.querySelectorAll('.config-tab-content');

    configTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-config-tab');
        configTabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        configTabContents.forEach(c => {
          if (c.id === targetTab) {
            c.classList.add('active');
            c.style.display = 'block';
          } else {
            c.classList.remove('active');
            c.style.display = 'none';
          }
        });

        renderConfig();
      });
    });

    // --- Points Settings Sub-Tab Switching ---
    const ptTabButtons = document.querySelectorAll('[data-pt-tab]');
    const ptTabContents = document.querySelectorAll('.pt-tab-content');

    ptTabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = btn.getAttribute('data-pt-tab');
        ptTabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        ptTabContents.forEach(c => {
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

    // --- 1. Genel Ayarlar (General Settings) ---
    const configThemeToggle = document.getElementById('config-theme-toggle');
    const configThemeIcon = document.getElementById('config-theme-icon');
    const configThemeText = document.getElementById('config-theme-text');
    const configBackupExport = document.getElementById('config-backup-export');
    const configBackupImportTrigger = document.getElementById('config-backup-import-trigger');
    const configBackupImportFile = document.getElementById('config-backup-import-file');
    const configSystemReset = document.getElementById('config-system-reset');

    if (configThemeToggle) {
      configThemeToggle.addEventListener('click', () => {
        if (window.toggleTheme) {
          window.toggleTheme();
          updateConfigThemeUI();
        }
      });
    }

    const configEducationLevel = document.getElementById('config-education-level');
    if (configEducationLevel) {
      configEducationLevel.addEventListener('change', () => {
        stateManager.setEducationLevel(configEducationLevel.value);
        if (toastCallback) {
          toastCallback(`Eğitim kademesi ${configEducationLevel.value === 'middle' ? 'Ortaokul' : 'İlkokul'} olarak güncellendi.`, 'success');
        }
        
        // Update visibility immediately
        if (window.updateVisibilityByEducationLevel) {
          window.updateVisibilityByEducationLevel();
        }

        const event = new CustomEvent('stateChanged');
        document.dispatchEvent(event);
      });
    }

    if (configBackupExport) {
      configBackupExport.addEventListener('click', () => {
        stateManager.exportData();
        if (toastCallback) toastCallback('Verileriniz bilgisayarınıza indirildi.', 'success');
      });
    }

    if (configBackupImportTrigger && configBackupImportFile) {
      configBackupImportTrigger.addEventListener('click', () => {
        configBackupImportFile.click();
      });

      configBackupImportFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
          const success = stateManager.importData(evt.target.result);
          if (success) {
            if (toastCallback) toastCallback('Yedek başarıyla yüklendi, veriler güncellendi.', 'success');
            const event = new CustomEvent('stateChanged');
            document.dispatchEvent(event);
          } else {
            if (toastCallback) toastCallback('Yüklenen dosya geçersiz bir sınıf yedek dosyası!', 'danger');
          }
        };
        reader.readAsText(file);
        configBackupImportFile.value = '';
      });
    }

    if (configSystemReset) {
      configSystemReset.addEventListener('click', () => {
        const modalSystemReset = document.getElementById('modal-system-reset');
        if (modalSystemReset) {
          const formSystemReset = document.getElementById('form-system-reset');
          const resetErrorMsg = document.getElementById('reset-error-msg');
          if (formSystemReset) formSystemReset.reset();
          if (resetErrorMsg) resetErrorMsg.style.display = 'none';
          modalSystemReset.classList.add('active');
        }
      });
    }

    // --- 2. Puan Ayarları (Points Settings) ---
    configFormGlobalSettings = document.getElementById('config-form-global-settings');
    configHwCompleted = document.getElementById('config-settings-hw-completed');
    configHwIncomplete = document.getElementById('config-settings-hw-incomplete');
    configHwMissing = document.getElementById('config-settings-hw-missing');
    configHwExcused = document.getElementById('config-settings-hw-excused');
    configBookLimit = document.getElementById('config-settings-book-limit');
    configBookOntime = document.getElementById('config-settings-book-ontime');
    configBookLate = document.getElementById('config-settings-book-late');
    configExamTopcount = document.getElementById('config-settings-exam-topcount');
    configExamRanksContainer = document.getElementById('config-settings-exam-ranks-container');

    const btnAddPos = document.getElementById('config-btn-add-positive-behavior');
    const btnAddDev = document.getElementById('config-btn-add-development-behavior');

    if (btnAddPos) {
      btnAddPos.addEventListener('click', () => {
        addBehaviorRow(document.getElementById('config-settings-positive-behaviors-list'), '', 1, '⭐', 'positive');
      });
    }

    if (btnAddDev) {
      btnAddDev.addEventListener('click', () => {
        addBehaviorRow(document.getElementById('config-settings-development-behaviors-list'), '', -1, '⚠️', 'development');
      });
    }

    if (configExamTopcount) {
      configExamTopcount.addEventListener('input', () => {
        let val = parseInt(configExamTopcount.value) || 3;
        if (val < 1) val = 1;
        if (val > 10) val = 10;
        
        const currentPoints = {};
        document.querySelectorAll('.config-exam-rank-point-input').forEach(input => {
          const r = input.getAttribute('data-rank');
          currentPoints[r] = parseInt(input.value) || 0;
        });
        
        renderExamRankInputs(val, currentPoints);
      });
    }

    if (configFormGlobalSettings) {
      configFormGlobalSettings.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Behaviors
        const positive = [];
        document.querySelectorAll('#config-settings-positive-behaviors-list .behavior-setting-row').forEach(row => {
          const icon = row.querySelector('.bh-icon-input').value.trim() || '⭐';
          const name = row.querySelector('.bh-name-input').value.trim();
          const point = parseInt(row.querySelector('.bh-point-input').value) || 0;
          if (name) {
            positive.push({ name, point, icon });
          }
        });

        const development = [];
        document.querySelectorAll('#config-settings-development-behaviors-list .behavior-setting-row').forEach(row => {
          const icon = row.querySelector('.bh-icon-input').value.trim() || '⚠️';
          const name = row.querySelector('.bh-name-input').value.trim();
          const point = parseInt(row.querySelector('.bh-point-input').value) || 0;
          if (name) {
            development.push({ name, point, icon });
          }
        });

        stateManager.updatePerformanceBehaviors({ positive, development });

        // 2. Homework settings
        const hwSettings = {
          completed: parseInt(configHwCompleted.value) || 0,
          incomplete: parseInt(configHwIncomplete.value) || 0,
          missing: parseInt(configHwMissing.value) || 0,
          excused: parseInt(configHwExcused.value) || 0
        };
        stateManager.updateHomeworkSettings(hwSettings);

        // 3. Book settings (Only save if config elements are present)
        if (configBookLimit && configBookOntime && configBookLate) {
          const bookSettings = {
            limitDays: parseInt(configBookLimit.value) || 15,
            onTimePoints: parseInt(configBookOntime.value) || 0,
            latePoints: parseInt(configBookLate.value) || 0
          };
          stateManager.updateBookSettings(bookSettings);
        }

        // 4. Exam settings
        const topCount = parseInt(configExamTopcount.value) || 3;
        const rankPoints = {};
        document.querySelectorAll('.config-exam-rank-point-input').forEach(input => {
          const r = input.getAttribute('data-rank');
          rankPoints[r] = parseInt(input.value) || 0;
        });
        stateManager.updateWeeklyExamSettings({ topCount, rankPoints });

        if (toastCallback) {
          toastCallback('Tüm puanlama kuralları ve ayarları başarıyla kaydedildi.', 'success');
        }

        const event = new CustomEvent('stateChanged');
        document.dispatchEvent(event);
      });
    }

    // --- 3. Geçerli Hafta (Current Week) ---
    configSelectWeek = document.getElementById('config-select-week');
    btnConfigPrevWeek = document.getElementById('btn-config-prev-week');
    btnConfigNextWeek = document.getElementById('btn-config-next-week');
    btnConfigCurrentWeek = document.getElementById('btn-config-current-week');

    if (configSelectWeek) {
      configSelectWeek.addEventListener('change', () => {
        stateManager.setSelectedWeek(configSelectWeek.value);
      });
    }

    if (btnConfigPrevWeek) {
      btnConfigPrevWeek.addEventListener('click', () => adjustConfigWeek(-1));
    }

    if (btnConfigNextWeek) {
      btnConfigNextWeek.addEventListener('click', () => adjustConfigWeek(1));
    }

    if (btnConfigCurrentWeek) {
      btnConfigCurrentWeek.addEventListener('click', () => {
        const thisWeek = window.getISOWeek(new Date());
        if (configSelectWeek) configSelectWeek.value = thisWeek;
        stateManager.setSelectedWeek(thisWeek);
        if (toastCallback) toastCallback('Aktif haftaya geçiş yapıldı.', 'info');
      });
    }

    // --- 4. Öğrenci Yönetimi (Student Management) ---
    configSearchStudent = document.getElementById('config-search-student');
    configFilterGender = document.getElementById('config-filter-gender');
    configStudentsTbody = document.getElementById('config-students-tbody');

    if (configSearchStudent) {
      configSearchStudent.addEventListener('input', () => renderConfigStudentsList());
    }
    if (configFilterGender) {
      configFilterGender.addEventListener('change', () => renderConfigStudentsList());
    }

    // Add Student trigger
    const configBtnAddStudent = document.getElementById('config-btn-add-student');
    if (configBtnAddStudent) {
      configBtnAddStudent.addEventListener('click', () => {
        const formStudent = document.getElementById('form-student');
        const studentIdInput = document.getElementById('student-id');
        const studentPhotoPreview = document.getElementById('student-photo-preview');
        const studentPhotoInput = document.getElementById('student-photo-input');
        const modalStudentTitle = document.getElementById('modal-student-title');
        const modalStudent = document.getElementById('modal-student');

        if (formStudent) formStudent.reset();
        if (studentIdInput) studentIdInput.value = '';
        window.currentPhotoBase64 = '';
        if (studentPhotoPreview) studentPhotoPreview.style.display = 'none';
        if (studentPhotoInput) studentPhotoInput.value = '';
        if (modalStudentTitle) modalStudentTitle.textContent = 'Öğrenci Ekle';
        if (modalStudent) modalStudent.classList.add('active');
      });
    }

    // Excel Şablonu trigger
    const configBtnDownloadTemplate = document.getElementById('config-btn-download-template');
    if (configBtnDownloadTemplate) {
      configBtnDownloadTemplate.addEventListener('click', () => {
        const btnReal = document.getElementById('btn-download-student-template');
        if (btnReal) {
          btnReal.click();
        } else {
          // Fallback if not loaded
          if (window.XLSX) {
            const data = [
              ["Okul Numarası", "Adı", "Soyadı", "Cinsiyet (Kız/Erkek)", "Veli Telefon", "Notlar", "Şube (Ortaokul için)"],
              ["101", "Ahmet", "Yılmaz", "Erkek", "05551234567", "Matematik dersinde çok ilgili ve başarılı.", "5-A"],
              ["102", "Zeynep", "Kaya", "Kız", "05559876543", "Kitap okumayı ve resim yapmayı çok seviyor.", "5-A"],
              ["103", "Can", "Demir", "Erkek", "05555555555", "Sınıf içi yardımlaşmada çok duyarlı.", "6-B"]
            ];
            const ws = XLSX.utils.aoa_to_sheet(data);
            ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 35 }, { wch: 20 }];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Öğrenci Yükleme Şablonu");
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            if (window.downloadBlob) window.downloadBlob(blob, "ogrenci_yukleme_sablonu.xlsx");
            if (toastCallback) toastCallback('Excel (.xlsx) öğrenci yükleme şablonu indirildi.', 'success');
          }
        }
      });
    }

    // Student upload trigger
    const configBtnUploadTrigger = document.getElementById('config-btn-upload-trigger');
    const configInputUploadFile = document.getElementById('config-input-upload-file');
    if (configBtnUploadTrigger && configInputUploadFile) {
      configBtnUploadTrigger.addEventListener('click', () => {
        configInputUploadFile.click();
      });

      configInputUploadFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

        const handleParsed = (parsed) => {
          if (parsed.length === 0) {
            if (toastCallback) toastCallback('Geçerli öğrenci satırı bulunamadı!', 'danger');
            return;
          }

          const state = stateManager.loadState();
          let added = 0;
          let skipped = 0;

          parsed.forEach(std => {
            const conflict = state.students.some(s => s.number === std.number);
            if (conflict) {
              skipped++;
            } else {
              stateManager.addStudent(std);
              added++;
            }
          });

          if (toastCallback) {
            if (added > 0 && skipped > 0) {
              toastCallback(`${added} adet yeni öğrenci eklendi, ${skipped} öğrenci mükerrer numara nedeniyle atlandı.`, 'warning');
            } else if (added > 0) {
              toastCallback(`${added} öğrenci başarıyla listeye eklendi.`, 'success');
            } else {
              toastCallback('Hiç yeni öğrenci eklenmedi. Tüm numaralar kayıtlı!', 'danger');
            }
          }

          renderConfigStudentsList();
          const evt = new CustomEvent('stateChanged');
          document.dispatchEvent(evt);
        };

        if (window.XLSX && (isExcel || fileName.endsWith('.csv'))) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = new Uint8Array(event.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
              
              const parsed = [];
              for (let i = 0; i < json.length; i++) {
                const row = json[i];
                if (!row || row.length < 1) continue;
                
                const number = String(row[0] || '').trim();
                const name = String(row[1] || '').trim();
                const surname = String(row[2] || '').trim();
                let gender = String(row[3] || '').trim().toLowerCase();
                const parentPhone = String(row[4] || '').trim();
                const notes = String(row[5] || '').trim();
                const branch = String(row[6] || '').trim();
                
                if (i === 0 && (number.toLowerCase().includes('okul') || number.toLowerCase().includes('no'))) continue;
                
                if (number && name) {
                  if (gender === 'kız' || gender === 'kiz' || gender === 'female') {
                    gender = 'female';
                  } else if (gender === 'erkek' || gender === 'male') {
                    gender = 'male';
                  } else {
                    gender = 'unspecified';
                  }
                  parsed.push({ number, name, surname, gender, parentPhone, notes, branch });
                }
              }
              handleParsed(parsed);
            } catch (err) {
              if (toastCallback) toastCallback(`Dosya okunurken hata oluştu: ${err.message}`, 'danger');
            }
          };
          reader.readAsArrayBuffer(file);
        } else {
          // CSV reader
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const text = event.target.result;
              const lines = text.split(/\r?\n/);
              const parsed = [];
              let delimiter = ';';
              if (lines.length > 0 && lines[0].includes(',')) delimiter = ',';

              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('sep=')) continue;

                const cols = line.split(delimiter);
                if (cols.length < 1) continue;

                const number = cols[0].replace(/"/g, '').trim();
                const name = cols[1] ? cols[1].replace(/"/g, '').trim() : '';
                const surname = cols[2] ? cols[2].replace(/"/g, '').trim() : '';
                let gender = cols[3] ? cols[3].replace(/"/g, '').trim().toLowerCase() : '';
                const parentPhone = cols[4] ? cols[4].replace(/"/g, '').trim() : '';
                const notes = cols[5] ? cols[5].replace(/"/g, '').trim() : '';
                const branch = cols[6] ? cols[6].replace(/"/g, '').trim() : '';

                if (i === 0 && (number.toLowerCase().includes('okul') || number.toLowerCase().includes('no'))) continue;

                if (number && name) {
                  if (gender === 'kız' || gender === 'kiz' || gender === 'female') {
                    gender = 'female';
                  } else if (gender === 'erkek' || gender === 'male') {
                    gender = 'male';
                  } else {
                    gender = 'unspecified';
                  }
                  parsed.push({ number, name, surname, gender, parentPhone, notes, branch });
                }
              }
              handleParsed(parsed);
            } catch (err) {
              if (toastCallback) toastCallback(`Dosya okunurken hata oluştu: ${err.message}`, 'danger');
            }
          };
          reader.readAsText(file, 'utf-8');
        }

        configInputUploadFile.value = '';
      });
    }

    // --- LİSANS YÖNETİMİ ENTEGRASYONU ---
    const btnActivate = document.getElementById('btn-activate-license');
    const btnRemove = document.getElementById('btn-remove-license');
    const txtKey = document.getElementById('txt-license-key');
    const btnBannerActivate = document.getElementById('btn-activate-license-banner');

    function updateLicenseUI() {
      const config = window.LicenseConfig;
      if (!config) return;

      const topBanner = document.getElementById('demo-top-banner');
      const sidebarContainer = document.getElementById('sidebar-demo-container');
      const lblStatus = document.getElementById('lbl-license-status');
      const detailInfo = document.getElementById('license-detail-info');

      if (config.isDemo) {
        if (topBanner) topBanner.style.display = 'flex';
        if (sidebarContainer) {
          sidebarContainer.innerHTML = `<div class="sidebar-demo-badge">Demo Sürüm (Limitli)</div>`;
        }
        if (lblStatus) {
          lblStatus.textContent = 'Demo Sürüm';
          lblStatus.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
          lblStatus.style.color = '#f59e0b';
          lblStatus.style.border = '1px solid rgba(245, 158, 11, 0.3)';
        }
        if (detailInfo) {
          detailInfo.innerHTML = `
            Uygulama Demo sürümündedir. Aşağıdaki sınırlamalar geçerlidir:<br>
            • Öğrenci Sayısı: Maksimum <strong>${config.studentLimit}</strong> öğrenci<br>
            • Kitaplık Kitap Sayısı: Maksimum <strong>${config.bookLimit}</strong> kitap<br>
            • Yıllık Ders Planı Sayısı: Maksimum <strong>${config.planLimit}</strong> plan<br>
            • Defter Sayısı: Maksimum <strong>${config.notebookLimit}</strong> defter
          `;
        }
        if (btnRemove) btnRemove.style.display = 'none';
      } else {
        if (topBanner) topBanner.style.display = 'none';
        if (sidebarContainer) sidebarContainer.innerHTML = '';
        if (lblStatus) {
          lblStatus.textContent = 'Lisanslı / Aktif';
          lblStatus.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
          lblStatus.style.color = '#10b981';
          lblStatus.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        }
        
        const expiryText = config.expiryDate === 'never' ? 'Süresiz / Ömür Boyu' : new Date(config.expiryDate).toLocaleDateString('tr-TR');
        if (detailInfo) {
          detailInfo.innerHTML = `
            <strong>Lisans Sahibi:</strong> ${config.licensee}<br>
            <strong>Geçerlilik Tarihi:</strong> ${expiryText}<br>
            <strong>Kullanım Hakkı:</strong> Sınırsız (Tam Sürüm)
          `;
        }
        if (btnRemove) btnRemove.style.display = 'block';
      }
    }

    // İlk yüklemede UI'ı güncelle
    updateLicenseUI();

    if (btnActivate && txtKey) {
      btnActivate.addEventListener('click', () => {
        const key = txtKey.value.trim();
        if (!key) {
          if (toastCallback) toastCallback('Lütfen bir lisans anahtarı girin!', 'warning');
          return;
        }

        const res = window.LicenseConfig.saveLicense(key);
        if (res.success) {
          txtKey.value = '';
          updateLicenseUI();
          if (toastCallback) toastCallback(`Tebrikler! Lisans başarıyla doğrulandı. Sınırsız sürüm aktif edildi. Lisans Sahibi: ${res.licensee}`, 'success');
          
          // Durum değiştiğinde diğer sekmeleri de tetikle
          const event = new CustomEvent('stateChanged');
          document.dispatchEvent(event);
        } else {
          if (toastCallback) toastCallback(`Aktivasyon Hatası: ${res.reason}`, 'danger');
        }
      });
    }

    if (btnRemove) {
      btnRemove.addEventListener('click', () => {
        if (confirm('Mevcut lisansı kaldırmak istediğinize emin misiniz? Uygulama tekrar Demo sürümüne dönecektir.')) {
          window.LicenseConfig.removeLicense();
          updateLicenseUI();
          if (toastCallback) toastCallback('Lisans kaldırıldı. Uygulama demo moduna geri döndü.', 'warning');
          
          const event = new CustomEvent('stateChanged');
          document.dispatchEvent(event);
        }
      });
    }

    if (btnBannerActivate) {
      btnBannerActivate.addEventListener('click', () => {
        if (window.switchTab) {
          window.switchTab('assistant-config');
          const tabGeneralBtn = document.getElementById('tab-btn-config-general');
          if (tabGeneralBtn) tabGeneralBtn.click();
          
          setTimeout(() => {
            if (txtKey) {
              txtKey.scrollIntoView({ behavior: 'smooth', block: 'center' });
              txtKey.focus();
            }
          }, 100);
        }
      });
    }

    // Bind state changes to automatically refresh
    document.addEventListener('stateChanged', () => {
      // If the configuration section is visible, refresh its lists/inputs
      const configSec = document.getElementById('assistant-config');
      if (configSec && configSec.classList.contains('active')) {
        renderConfig();
      }
      updateLicenseUI();
    });
  }

  // Week helper
  function adjustConfigWeek(offset) {
    if (!configSelectWeek) return;
    const val = configSelectWeek.value;
    if (!val) return;

    const parts = val.split('-W');
    if (parts.length !== 2) return;

    const year = parseInt(parts[0]);
    const week = parseInt(parts[1]);

    const simpleDate = window.getDayInWeek(year, week, 4);
    simpleDate.setDate(simpleDate.getDate() + (offset * 7));

    const newWeek = window.getISOWeek(simpleDate);
    configSelectWeek.value = newWeek;
    stateManager.setSelectedWeek(newWeek);
  }

  // Update configuration components
  function renderConfig() {
    updateConfigThemeUI();
    const configEducationLevel = document.getElementById('config-education-level');
    if (configEducationLevel) {
      configEducationLevel.value = stateManager.loadState().educationLevel || 'primary';
    }
    
    // 1. Load Puan Ayarları inputs
    const hwSettings = stateManager.getHomeworkSettings();
    if (configHwCompleted) configHwCompleted.value = hwSettings.completed;
    if (configHwIncomplete) configHwIncomplete.value = hwSettings.incomplete;
    if (configHwMissing) configHwMissing.value = hwSettings.missing;
    if (configHwExcused) configHwExcused.value = hwSettings.excused !== undefined ? hwSettings.excused : 0;

    const bookSettings = stateManager.getBookSettings();
    if (configBookLimit) configBookLimit.value = bookSettings.limitDays;
    if (configBookOntime) configBookOntime.value = bookSettings.onTimePoints;
    if (configBookLate) configBookLate.value = bookSettings.latePoints;

    const examSettings = stateManager.getWeeklyExamSettings();
    if (configExamTopcount) configExamTopcount.value = examSettings.topCount;
    renderExamRankInputs(examSettings.topCount, examSettings.rankPoints);
    populateConfigBehaviorsList();

    // 2. Load Active Week
    const selectedWeek = stateManager.getSelectedWeek();
    if (configSelectWeek) configSelectWeek.value = selectedWeek;

    // 3. Load Students Management List
    renderConfigStudentsList();

    window.safeCreateIcons();
  }

  function updateConfigThemeUI() {
    const configThemeIcon = document.getElementById('config-theme-icon');
    const configThemeText = document.getElementById('config-theme-text');
    const theme = document.body.getAttribute('data-theme') || 'light';

    if (configThemeIcon && configThemeText) {
      if (theme === 'dark') {
        configThemeIcon.setAttribute('data-lucide', 'sun');
        configThemeText.textContent = 'Açık Tema';
      } else {
        configThemeIcon.setAttribute('data-lucide', 'moon');
        configThemeText.textContent = 'Koyu Tema';
      }
    }
  }

  function populateConfigBehaviorsList() {
    const behaviors = stateManager.getPerformanceBehaviors();
    const posList = document.getElementById('config-settings-positive-behaviors-list');
    const devList = document.getElementById('config-settings-development-behaviors-list');

    if (posList) posList.innerHTML = '';
    if (devList) devList.innerHTML = '';

    behaviors.positive.forEach((bh, index) => {
      addBehaviorRow(posList, bh.name, bh.point, bh.icon, 'positive', index);
    });

    behaviors.development.forEach((bh, index) => {
      addBehaviorRow(devList, bh.name, bh.point, bh.icon, 'development', index);
    });
  }

  function addBehaviorRow(container, name = '', point = 1, icon = '⭐', type = 'positive', index) {
    if (!container) return;

    const isKitapOkuma = (name === 'Kitap Okuma');
    const nameReadonlyAttr = isKitapOkuma ? 'readonly' : '';
    const deleteBtnStyle = isKitapOkuma ? 'display: none;' : '';

    const row = document.createElement('div');
    row.className = `behavior-setting-row ${type}-row`;
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '0.5rem';
    row.style.marginBottom = '0.5rem';

    row.innerHTML = `
      <input type="text" class="form-control bh-icon-input" value="${icon}" style="width: 45px; text-align: center; padding: 0.35rem 0.5rem;" placeholder="İkon">
      <input type="text" class="form-control bh-name-input" value="${name}" style="flex: 1; padding: 0.35rem 0.5rem;" placeholder="Açıklama" required ${nameReadonlyAttr}>
      <input type="number" class="form-control bh-point-input" value="${point}" style="width: 60px; text-align: center; padding: 0.35rem 0.5rem;" placeholder="Puan" required>
      <button type="button" class="action-btn-sm delete-bh-row" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); ${deleteBtnStyle}" title="Sil">
        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
      </button>
    `;

    row.querySelector('.delete-bh-row').addEventListener('click', () => {
      if (isKitapOkuma) {
        if (toastCallback) toastCallback('"Kitap Okuma" davranışı silinemez!', 'warning');
        return;
      }
      row.remove();
    });

    container.appendChild(row);
    window.safeCreateIcons();
  }

  function renderExamRankInputs(topCount, rankPoints = {}) {
    if (!configExamRanksContainer) return;
    configExamRanksContainer.innerHTML = '';

    for (let r = 1; r <= topCount; r++) {
      const val = rankPoints[r] !== undefined ? rankPoints[r] : (r === 1 ? 10 : (r === 2 ? 7 : (r === 3 ? 4 : 0)));
      
      const group = document.createElement('div');
      group.className = 'form-group';
      group.innerHTML = `
        <label style="font-size: 0.8rem; font-weight: 600;">${r}. Derece Puanı (+)</label>
        <input type="number" class="form-control config-exam-rank-point-input" data-rank="${r}" value="${val}" required>
      `;
      configExamRanksContainer.appendChild(group);
    }
  }

  // Render student list in Student Management Tab
  function renderConfigStudentsList() {
    const state = stateManager.loadState();
    const query = configSearchStudent ? configSearchStudent.value.toLowerCase().trim() : '';
    const genderFilter = configFilterGender ? configFilterGender.value : 'all';
    const isMiddle = state.educationLevel === 'middle';

    // Update table header dynamically
    const theadTr = document.querySelector('#config-students-table thead tr');
    if (theadTr) {
      theadTr.innerHTML = `
        <th style="width: 60px; text-align: center;">No</th>
        <th style="width: 70px; text-align: center;">Fotoğraf</th>
        <th>Öğrenci Adı Soyadı</th>
        <th style="width: 100px; text-align: center;">Okul No</th>
        <th style="width: 100px; text-align: center;">Cinsiyet</th>
        ${isMiddle ? '<th style="width: 100px; text-align: center;">Şube</th>' : ''}
        <th style="width: 150px; text-align: center;">Veli Telefonu</th>
        <th style="width: 150px; text-align: center;">İşlemler</th>
      `;
    }

    if (!configStudentsTbody) return;
    configStudentsTbody.innerHTML = '';

    const filtered = state.students.filter(student => {
      const fullName = `${student.name} ${student.surname}`.toLowerCase();
      const matchQuery = fullName.includes(query) || student.number.includes(query);
      const matchGender = genderFilter === 'all' || student.gender === genderFilter;
      return matchQuery && matchGender;
    });

    if (filtered.length === 0) {
      configStudentsTbody.innerHTML = `<tr><td colspan="${isMiddle ? 8 : 7}" style="text-align: center; color: var(--text-muted); padding: 2rem;">Kayıtlı öğrenci bulunamadı.</td></tr>`;
      return;
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    filtered.forEach((student, index) => {
      const initials = `${student.name[0] || ''}${student.surname[0] || ''}`;
      const avatarHtml = student.photo
        ? `<img src="${student.photo}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">`
        : `<div class="student-avatar" style="width: 36px; height: 36px; border-radius: 50%; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; background: var(--primary-light); color: var(--primary); font-weight: 700;">${initials}</div>`;

      const genderText = student.gender === 'female' ? 'Kız' : (student.gender === 'male' ? 'Erkek' : '-');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center; font-weight: 600; color: var(--text-muted);">${index + 1}</td>
        <td style="text-align: center; display: flex; justify-content: center; align-items: center; height: 50px;">${avatarHtml}</td>
        <td><strong>${student.name} ${student.surname}</strong></td>
        <td style="text-align: center;">${student.number}</td>
        <td style="text-align: center;">${genderText}</td>
        ${isMiddle ? `<td style="text-align: center;"><strong>${student.branch || '-'}</strong></td>` : ''}
        <td style="text-align: center;">${student.parentPhone || '-'}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 0.5rem; justify-content: center;">
            <button class="action-btn-sm edit-btn" title="Düzenle" style="color: var(--primary); border-color: rgba(99,102,241,0.2); background: rgba(99,102,241,0.05);">
              <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="action-btn-sm delete-btn" title="Sil" style="color: var(--danger); border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.05);">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </td>
      `;

      // Bind edit event
      tr.querySelector('.edit-btn').addEventListener('click', () => {
        if (window.openEditStudentModal) {
          window.openEditStudentModal(student.id);
        }
      });

      // Bind delete event
      tr.querySelector('.delete-btn').addEventListener('click', () => {
        if (confirm(`${student.name} ${student.surname} adlı öğrenciyi ve ona ait tüm verileri (puan, kitap, ödev) silmek istediğinize emin misiniz?`)) {
          stateManager.deleteStudent(student.id);
          if (toastCallback) toastCallback('Öğrenci silindi.', 'success');
          
          const event = new CustomEvent('stateChanged');
          document.dispatchEvent(event);
        }
      });

      configStudentsTbody.appendChild(tr);
    });

    window.safeCreateIcons();
  }

  // ============================================
  // ŞİFRE KONTROLÜ SEKMESİ
  // ============================================

  function timeToMinutesConfig(t) {
    if (!t) return -1;
    const parts = t.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function renderLockTab() {
    const state = window.AppState ? window.AppState.state : null;
    if (!state) return;

    const appLock = state.appLock || { enabled: false, passwordHash: null, breakModeEnabled: false };
    const hasPassword = !!(appLock.enabled && appLock.passwordHash);

    // Durum badge ve metin
    const badge = document.getElementById('lock-status-badge');
    const statusText = document.getElementById('lock-status-text');
    if (badge) {
      if (hasPassword) {
        badge.textContent = 'AKTİF';
        badge.style.background = 'rgba(16,185,129,0.15)';
        badge.style.color = '#10b981';
      } else {
        badge.textContent = 'PASİF';
        badge.style.background = 'rgba(239,68,68,0.15)';
        badge.style.color = '#ef4444';
      }
    }
    if (statusText) {
      statusText.textContent = hasPassword
        ? 'Şifre koruması aktif — uygulama açılışta şifre sorar.'
        : 'Şifre belirlenmemiş — uygulama herkese açık.';
    }

    // Şifre kaldır butonu
    const removeSection = document.getElementById('lock-remove-section');
    if (removeSection) removeSection.style.display = hasPassword ? 'block' : 'none';

    // Teneffüs modu toggle
    const breakToggle = document.getElementById('config-break-mode-toggle');
    const noScheduleWarn = document.getElementById('lock-no-schedule-warning');
    const breakSummary = document.getElementById('lock-break-summary');

    const scheduleOk = window.AppLock ? window.AppLock.isScheduleConfigured() : false;

    if (breakToggle) {
      breakToggle.disabled = !hasPassword || !scheduleOk;
      breakToggle.checked = !!(appLock.breakModeEnabled && hasPassword && scheduleOk);
    }

    // Ders programı uyarısı
    if (noScheduleWarn) {
      noScheduleWarn.style.display = (hasPassword && !scheduleOk) ? 'block' : 'none';
    }

    // Teneffüs saatleri özeti
    if (breakSummary && scheduleOk && hasPassword) {
      breakSummary.style.display = 'block';
      const times = state.scheduleTimes;
      const periodKeys = ['p1','p2','p3','p4','p5','p6','p7'].filter(k => times && times[k]);
      let html = '<div style="font-size:0.78rem;color:var(--text-muted);display:flex;flex-wrap:wrap;gap:0.4rem;">';
      html += '<span style="font-weight:600;color:var(--text-secondary);margin-right:2px;">Teneffüsler:</span>';
      for (let i = 0; i < periodKeys.length - 1; i++) {
        const endT = times[periodKeys[i]].end;
        const startT = times[periodKeys[i + 1]].start;
        const dur = timeToMinutesConfig(startT) - timeToMinutesConfig(endT);
        if (dur > 0) {
          html += `<span style="background:rgba(99,102,241,0.12);padding:2px 8px;border-radius:20px;">${endT}–${startT} (${dur} dk)</span>`;
        }
      }
      if (times.lunch) {
        const lDur = timeToMinutesConfig(times.lunch.end) - timeToMinutesConfig(times.lunch.start);
        html += `<span style="background:rgba(245,158,11,0.12);padding:2px 8px;border-radius:20px;">Öğle: ${times.lunch.start}–${times.lunch.end} (${lDur} dk)</span>`;
      }
      html += '</div>';
      breakSummary.innerHTML = html;
    } else if (breakSummary) {
      breakSummary.style.display = 'none';
    }

    window.safeCreateIcons();
  }

  function setupLockTab() {
    // Şifre kaydet
    const saveBtn = document.getElementById('btn-save-lock-password');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const newPass = document.getElementById('config-lock-new-pass');
        const confirmPass = document.getElementById('config-lock-confirm-pass');
        const errEl = document.getElementById('config-lock-form-error');

        const p1 = newPass ? newPass.value.trim() : '';
        const p2 = confirmPass ? confirmPass.value.trim() : '';

        if (!p1) {
          if (errEl) { errEl.textContent = 'Şifre boş olamaz.'; errEl.style.display = 'block'; }
          return;
        }
        if (p1.length < 4) {
          if (errEl) { errEl.textContent = 'Şifre en az 4 karakter olmalıdır.'; errEl.style.display = 'block'; }
          return;
        }
        if (p1 !== p2) {
          if (errEl) { errEl.textContent = 'Şifreler eşleşmiyor.'; errEl.style.display = 'block'; }
          return;
        }

        if (errEl) errEl.style.display = 'none';
        await window.AppLock.savePassword(p1);
        if (newPass) newPass.value = '';
        if (confirmPass) confirmPass.value = '';

        renderLockTab();
        if (toastCallback) toastCallback('Şifre başarıyla kaydedildi. ✅', 'success');
      });
    }

    // Şifreyi kaldır
    const removeBtn = document.getElementById('btn-remove-lock-password');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        const confirmed = confirm('Şifre korumasını kaldırmak istediğinize emin misiniz?\nBundan sonra uygulama şifresiz açılacak.');
        if (confirmed) {
          window.AppLock.removePassword();
          renderLockTab();
          if (toastCallback) toastCallback('Şifre koruması kaldırıldı.', 'info');
        }
      });
    }

    // Teneffüs modu toggle
    const breakToggle = document.getElementById('config-break-mode-toggle');
    if (breakToggle) {
      breakToggle.addEventListener('change', () => {
        window.AppLock.setBreakMode(breakToggle.checked);
        renderLockTab();
        if (toastCallback) {
          toastCallback(
            breakToggle.checked ? 'Teneffüs modu aktif edildi. ☕' : 'Teneffüs modu devre dışı bırakıldı.',
            'info'
          );
        }
      });
    }
  }

  // Config sekmesi değişince lock tab'ı da render et
  const _origRenderConfig = typeof renderConfig !== 'undefined' ? renderConfig : null;
  document.addEventListener('DOMContentLoaded', () => {
    setupLockTab();

    // Şifre Kontrolü sekmesine tıklanınca render et
    const lockTabBtn = document.getElementById('tab-btn-config-lock');
    if (lockTabBtn) {
      lockTabBtn.addEventListener('click', () => {
        setTimeout(renderLockTab, 50);
      });
    }
  });

  // Export globally
  window.setupConfigTab = setupConfigTab;
  window.renderConfig = renderConfig;
  window.updateConfigThemeUI = updateConfigThemeUI;
  window.renderLockTab = renderLockTab;
})();

