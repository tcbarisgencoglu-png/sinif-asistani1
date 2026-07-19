(() => {
// DOM Elemanları
const homeworkWeeklyTable = document.getElementById('homework-weekly-table');
const homeworkWeeklyTableBody = document.getElementById('homework-weekly-table-body');
const homeworkWeeklyEmptyState = document.getElementById('homework-weekly-empty-state');
const homeworkSelectWeek = document.getElementById('homework-select-week');
const btnHwPrevWeek = document.getElementById('btn-hw-prev-week');
const btnHwNextWeek = document.getElementById('btn-hw-next-week');
const homeworkActiveWeekDisplay = document.getElementById('homework-active-week-display');

// Modallar ve Formlar (eski modal - sadece düzenleme için korundu)
const modalHomework = document.getElementById('modal-homework');
const formHomework = document.getElementById('form-homework');
const homeworkIdInput = document.getElementById('homework-id');
const homeworkTitleInput = document.getElementById('homework-title-input');
const homeworkDescInput = document.getElementById('homework-desc-input');
const homeworkDueInput = document.getElementById('homework-due-input');
const modalHomeworkTitle = document.getElementById('modal-homework-title');

// Yeni: Ödev Ver Modalı
const modalHwSend = document.getElementById('modal-hw-send');
const formHwSend = document.getElementById('form-hw-send');
const hwSendDateInput = document.getElementById('hw-send-date');
const hwSendDaynameInput = document.getElementById('hw-send-dayname');
const hwSendTitleInput = document.getElementById('hw-send-title-input');
const hwSendDescInput = document.getElementById('hw-send-desc-input');
const hwSendDueInput = document.getElementById('hw-send-due-input');
const modalHwSendTitle = document.getElementById('modal-hw-send-title');
const hwSendPreview = document.getElementById('hw-send-preview');
const hwSendPreviewText = document.getElementById('hw-send-preview-text');
const btnHwSendSaveOnly = document.getElementById('btn-hw-send-save-only');

// Yeni: Ödev Görüntüle Modalı
const modalHwView = document.getElementById('modal-hw-view');
const modalHwViewTitle = document.getElementById('modal-hw-view-title');
const hwViewTitle = document.getElementById('hw-view-title');
const hwViewDesc = document.getElementById('hw-view-desc');
const hwViewDescWrapper = document.getElementById('hw-view-desc-wrapper');
const hwViewDate = document.getElementById('hw-view-date');
const hwViewPreviewText = document.getElementById('hw-view-preview-text');
const btnHwViewResend = document.getElementById('btn-hw-view-resend');

// Rapor Elemanları
const hwReportStart = document.getElementById('hw-report-start');
const hwReportEnd = document.getElementById('hw-report-end');
const btnGenerateHwReport = document.getElementById('btn-generate-hw-report');
const modalHwReport = document.getElementById('modal-homework-report');
const hwReportPreviewBody = document.getElementById('homework-report-preview-body');
const btnPrintHwReport = document.getElementById('btn-print-homework-report');
const homeworkPrintArea = document.querySelector('.homework-report-print');

let toastCallback = null;
// Görüntüleme modalında tekrar gönder için hafızada tutulan ödev
let _viewingHw = null;
let _viewingDayName = null;

const STATUS_CYCLE = ['none', 'completed', 'incomplete', 'missing', 'excused'];
const WEEKDAYS_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

// -------------------------------------------------------
// Yardımcı: Tarih formatlama
// -------------------------------------------------------
function formatDateStr(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const day = parseInt(parts[2]);
    const month = months[parseInt(parts[1]) - 1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  }
  return dateStr;
}

// -------------------------------------------------------
// WhatsApp mesajı oluştur
// -------------------------------------------------------
function buildWhatsAppMessage(hw, dayName) {
  const dueFormatted = formatDateStr(hw.dueDate);
  let msg = `*📚 ÖDEV BİLDİRİMİ*\n\n`;
  msg += `*Gün:* ${dayName}\n`;
  msg += `*Konu:* ${hw.title}\n`;
  if (hw.description && hw.description.trim()) {
    msg += `*Detay:* ${hw.description.trim()}\n`;
  }
  msg += `*Son Teslim:* ${dueFormatted}\n\n`;
  msg += `_Sınıf Asistanı tarafından oluşturuldu_`;
  return msg;
}

// -------------------------------------------------------
// WhatsApp'ta gönder
// -------------------------------------------------------
function sendToWhatsApp(hw, dayName) {
  const message = buildWhatsAppMessage(hw, dayName);
  const encoded = encodeURIComponent(message);

  const groupLink = stateManager.getWhatsappGroupLink ? stateManager.getWhatsappGroupLink() : '';

  // Eğer grup davet linki varsa, önce onu açıyoruz.
  if (groupLink && groupLink.trim().startsWith('https://chat.whatsapp.com/')) {
    window.safeOpenURL(groupLink);
  }

  const desktopUrl = `whatsapp://send?text=${encoded}`;
  const webUrl = `https://web.whatsapp.com/send?text=${encoded}`;

  // Eğer Tauri (Masaüstü uygulaması) ortamındaysak
  if (window.__TAURI__) {
    // Tauri WebView içinde navigation hatası (çökme/donma) oluşmaması için direkt Opener API kullan
    window.safeOpenURL(desktopUrl);
    return;
  }

  // Tarayıcı ortamında akıllı yedekleme mekanizması (Desktop -> Web)
  let didOpenApp = false;
  const onBlur = () => {
    didOpenApp = true;
  };
  window.addEventListener('blur', onBlur);

  // Bilgisayarda yüklü WhatsApp uygulamasını tetiklemeyi dene
  window.location.href = desktopUrl;

  // 1.5 saniye bekleyin, eğer uygulama açılmadıysa (tarayıcı odağı kaybetmediyse) WhatsApp Web'e yönlendir
  setTimeout(() => {
    window.removeEventListener('blur', onBlur);
    if (!didOpenApp) {
      window.safeOpenURL(webUrl);
    }
  }, 1500);
}

// -------------------------------------------------------
// Önizleme güncelle (Ödev Ver Modalı)
// -------------------------------------------------------
function updateSendPreview() {
  const title = hwSendTitleInput ? hwSendTitleInput.value.trim() : '';
  const desc = hwSendDescInput ? hwSendDescInput.value.trim() : '';
  const due = hwSendDueInput ? hwSendDueInput.value : '';
  const dayName = hwSendDaynameInput ? hwSendDaynameInput.value : '';

  if (!title || !due) {
    if (hwSendPreview) hwSendPreview.style.display = 'none';
    return;
  }

  const fakeHw = { title, description: desc, dueDate: due };
  const msg = buildWhatsAppMessage(fakeHw, dayName);
  if (hwSendPreviewText) hwSendPreviewText.textContent = msg;
  if (hwSendPreview) hwSendPreview.style.display = 'block';
}

// -------------------------------------------------------
// Ödev Ver Modalı Aç
// -------------------------------------------------------
function openSendHomeworkModal(dateStr, dayName) {
  if (!modalHwSend) return;

  if (modalHwSendTitle) modalHwSendTitle.textContent = `${dayName} — Ödev Ver`;
  if (hwSendDateInput) hwSendDateInput.value = dateStr;
  if (hwSendDaynameInput) hwSendDaynameInput.value = dayName;
  if (hwSendTitleInput) hwSendTitleInput.value = '';
  if (hwSendDescInput) hwSendDescInput.value = '';
  if (hwSendDueInput) hwSendDueInput.value = dateStr;
  if (hwSendPreview) hwSendPreview.style.display = 'none';

  modalHwSend.classList.add('active');

  // Önizleme güncelleyicileri bağla
  if (hwSendTitleInput) {
    hwSendTitleInput.addEventListener('input', updateSendPreview);
  }
  if (hwSendDescInput) {
    hwSendDescInput.addEventListener('input', updateSendPreview);
  }
  if (hwSendDueInput) {
    hwSendDueInput.addEventListener('change', updateSendPreview);
  }
}

// -------------------------------------------------------
// Ödev kaydet (WhatsApp olmadan ya da WhatsApp ile)
// -------------------------------------------------------
function saveHomeworkFromSendModal(sendToWA) {
  const dateStr = hwSendDateInput ? hwSendDateInput.value : '';
  const dayName = hwSendDaynameInput ? hwSendDaynameInput.value : '';
  const title = hwSendTitleInput ? hwSendTitleInput.value.trim() : '';
  const desc = hwSendDescInput ? hwSendDescInput.value.trim() : '';
  const due = hwSendDueInput ? hwSendDueInput.value : '';

  if (!title || !due) {
    if (toastCallback) toastCallback('Lütfen ödev konusu ve son teslim tarihini girin.', 'warning');
    return;
  }

  const state = stateManager.loadState();
  const selectBranch = document.getElementById('homework-select-branch');
  const branchFilter = selectBranch ? selectBranch.value : 'all';

  // Aynı tarihe ait ödev zaten var mı kontrol et
  let hw = state.homeworks.find(h =>
    h.dueDate === dateStr &&
    (state.educationLevel === 'primary' || h.branch === branchFilter)
  );

  if (hw) {
    // Güncelle
    stateManager.updateHomework(hw.id, { title, description: desc, dueDate: due });
    hw = { ...hw, title, description: desc, dueDate: due };
  } else {
    // Yeni oluştur
    hw = stateManager.addHomework({
      title,
      description: desc,
      dueDate: due,
      branch: (state.educationLevel === 'middle') ? branchFilter : ''
    });
  }

  if (modalHwSend) modalHwSend.classList.remove('active');
  renderHomeworkMatrix();
  const event = new CustomEvent('stateChanged');
  document.dispatchEvent(event);

  if (sendToWA) {
    sendToWhatsApp(hw, dayName);
    if (toastCallback) toastCallback('Ödev kaydedildi! WhatsApp açılıyor...', 'success');
  } else {
    if (toastCallback) toastCallback('Ödev başarıyla kaydedildi.', 'success');
  }
}

// -------------------------------------------------------
// Ödev Görüntüle Modalı Aç
// -------------------------------------------------------
function openViewHomeworkModal(hw, dayName) {
  if (!modalHwView) return;
  _viewingHw = hw;
  _viewingDayName = dayName;

  if (modalHwViewTitle) modalHwViewTitle.textContent = `${dayName} — Ödev Detayı`;
  if (hwViewTitle) hwViewTitle.textContent = hw.title;

  if (hwViewDescWrapper && hwViewDesc) {
    if (hw.description && hw.description.trim()) {
      hwViewDesc.textContent = hw.description;
      hwViewDescWrapper.style.display = 'block';
    } else {
      hwViewDescWrapper.style.display = 'none';
    }
  }

  if (hwViewDate) hwViewDate.textContent = formatDateStr(hw.dueDate);

  const msg = buildWhatsAppMessage(hw, dayName);
  if (hwViewPreviewText) hwViewPreviewText.textContent = msg;

  modalHwView.classList.add('active');
}

// -------------------------------------------------------
// ISO Hafta Kodunu Alma
// -------------------------------------------------------
function getISOWeekString(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  const weekStr = weekNo < 10 ? '0' + weekNo : weekNo;
  return `${d.getUTCFullYear()}-W${weekStr}`;
}

function getCurrentISOWeekString() {
  const today = new Date();
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  const weekStr = weekNo < 10 ? '0' + weekNo : weekNo;
  return `${d.getUTCFullYear()}-W${weekStr}`;
}

function getDayInWeek(year, week, dayIndex) {
  const jan4 = new Date(year, 0, 4);
  const dayOfJan4 = jan4.getDay() || 7;
  const week1Start = new Date(jan4.getTime());
  week1Start.setDate(jan4.getDate() - dayOfJan4 + 1);

  const targetDay = new Date(week1Start.getTime());
  targetDay.setDate(week1Start.getDate() + (week - 1) * 7 + (dayIndex - 1));
  return targetDay;
}

function getWeekDates(weekStr) {
  const parts = weekStr.split('-W');
  if (parts.length !== 2) return [];
  const year = parseInt(parts[0]);
  const week = parseInt(parts[1]);

  const dates = [];
  for (let i = 1; i <= 5; i++) {
    const date = getDayInWeek(year, week, i);
    const dateStr = window.formatLocalDate(date);
    dates.push({
      dayName: WEEKDAYS_TR[i - 1],
      dateStr: dateStr,
      dayIndex: i
    });
  }
  return dates;
}

// -------------------------------------------------------
// Setup
// -------------------------------------------------------
function setupHomeworkTab(showToast) {
  toastCallback = showToast;

  // Eski Modal Kapatma
  document.querySelectorAll('#modal-homework .close-btn, #modal-homework .close-btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
      modalHomework.classList.remove('active');
      homeworkDueInput.removeAttribute('readonly');
    });
  });

  // Rapor Modalı Kapatma
  document.querySelectorAll('#modal-homework-report .close-btn, #modal-homework-report .close-btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
      modalHwReport.classList.remove('active');
    });
  });

  // Ödev Ver Modalı Kapatma
  if (modalHwSend) {
    document.querySelectorAll('#modal-hw-send .close-btn, #modal-hw-send .close-btn-action').forEach(btn => {
      btn.addEventListener('click', () => {
        modalHwSend.classList.remove('active');
      });
    });
  }

  // Ödev Görüntüle Modalı Kapatma
  if (modalHwView) {
    document.querySelectorAll('#modal-hw-view .close-btn, #modal-hw-view .close-btn-action').forEach(btn => {
      btn.addEventListener('click', () => {
        modalHwView.classList.remove('active');
      });
    });
  }

  // Sadece Kaydet butonu
  if (btnHwSendSaveOnly) {
    btnHwSendSaveOnly.addEventListener('click', () => {
      saveHomeworkFromSendModal(false);
    });
  }

  // WhatsApp'ta Gönder (form submit)
  if (formHwSend) {
    formHwSend.addEventListener('submit', (e) => {
      e.preventDefault();
      saveHomeworkFromSendModal(true);
    });
  }

  // Görüntüle modalından tekrar gönder
  if (btnHwViewResend) {
    btnHwViewResend.addEventListener('click', () => {
      if (_viewingHw && _viewingDayName) {
        sendToWhatsApp(_viewingHw, _viewingDayName);
      }
    });
  }

  // WhatsApp Ayarları — link kaydet (Puan Ayarları form submit ile birlikte çalışır)
  const whatsappInput = document.getElementById('config-whatsapp-group-link');
  const testBtn = document.getElementById('btn-test-whatsapp-link');

  if (whatsappInput && stateManager.getWhatsappGroupLink) {
    // Mevcut değeri yükle
    whatsappInput.value = stateManager.getWhatsappGroupLink();

    // Değişince kaydet
    whatsappInput.addEventListener('change', () => {
      if (stateManager.setWhatsappGroupLink) {
        stateManager.setWhatsappGroupLink(whatsappInput.value.trim());
      }
    });
    whatsappInput.addEventListener('blur', () => {
      if (stateManager.setWhatsappGroupLink) {
        stateManager.setWhatsappGroupLink(whatsappInput.value.trim());
      }
    });
  }

  if (testBtn && whatsappInput) {
    testBtn.addEventListener('click', () => {
      const link = whatsappInput.value.trim();
      if (!link) {
        if (toastCallback) toastCallback('Lütfen önce bir grup linki girin.', 'warning');
        return;
      }
      window.safeOpenURL(link);
    });
  }

  // Hafta seçici başlangıç değeri
  if (homeworkSelectWeek) {
    homeworkSelectWeek.value = stateManager.getSelectedWeek();
  }

  // Rapor Oluştur
  btnGenerateHwReport.addEventListener('click', () => {
    const startVal = hwReportStart.value;
    const endVal = hwReportEnd.value;

    if (!startVal || !endVal) {
      if (toastCallback) toastCallback('Lütfen başlangıç ve bitiş tarihlerini seçin!', 'warning');
      return;
    }

    if (startVal > endVal) {
      if (toastCallback) toastCallback('Başlangıç tarihi bitiş tarihinden sonra olamaz!', 'warning');
      return;
    }

    const state = stateManager.loadState();
    const selectBranch = document.getElementById('homework-select-branch');
    const branchFilter = selectBranch ? selectBranch.value : 'all';

    const filteredHws = state.homeworks.filter(hw => {
      const matchDate = hw.dueDate >= startVal && hw.dueDate <= endVal;
      const matchBranch = state.educationLevel === 'primary' || branchFilter === 'all' || hw.branch === branchFilter;
      return matchDate && matchBranch;
    });

    if (filteredHws.length === 0) {
      if (toastCallback) toastCallback('Seçilen tarih aralığında tanımlı ödev bulunamadı.', 'warning');
      return;
    }

    const activeStudents = state.students.filter(student => {
      return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
    });

    const studentsStats = activeStudents.map(std => {
      let completed = 0;
      let incomplete = 0;
      let missing = 0;
      let excused = 0;

      filteredHws.forEach(hw => {
        const status = hw.status ? hw.status[std.id] : undefined;
        if (status === 'completed') completed++;
        else if (status === 'incomplete') incomplete++;
        else if (status === 'excused') excused++;
        else missing++;
      });

      const expected = filteredHws.length - excused;
      const successRate = expected > 0 ? Math.round((completed / expected) * 100) : 0;

      return { ...std, completed, incomplete, missing, excused, expected, successRate };
    });

    studentsStats.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    const formatDate = (dateStr) => {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
      return dateStr;
    };

    const formattedStart = formatDate(startVal);
    const formattedEnd = formatDate(endVal);
    const todayStr = new Date().toLocaleDateString('tr-TR');

    const reportHTML = `
      <div class="report-header" style="text-align: center; border-bottom: 2px solid var(--primary); padding-bottom: 1.5rem; margin-bottom: 2rem;">
        <h2 style="color: var(--primary); font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <i data-lucide="clipboard-check" style="width: 28px; height: 28px;"></i>
          Ödev Takip Dönem Raporu
        </h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; font-weight: 500;">
          Rapor Dönemi: <strong>${formattedStart}</strong> - <strong>${formattedEnd}</strong> | Hazırlama Tarihi: <strong>${todayStr}</strong>
        </p>
        <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 1rem; flex-wrap: wrap;">
          <div class="glass-card" style="padding: 0.75rem 1.5rem; border-radius: 8px; flex: 1; min-width: 150px; text-align: center; background: rgba(99, 102, 241, 0.05); border: 1px solid var(--border-color);">
            <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.25rem;">Toplam Ödev Sayısı</span>
            <strong style="font-size: 1.5rem; color: var(--primary);">${filteredHws.length}</strong>
          </div>
          <div class="glass-card" style="padding: 0.75rem 1.5rem; border-radius: 8px; flex: 1; min-width: 150px; text-align: center; background: rgba(16, 185, 129, 0.05); border: 1px solid var(--border-color);">
            <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.25rem;">Sınıf Mevcudu</span>
            <strong style="font-size: 1.5rem; color: var(--success);">${state.students.length}</strong>
          </div>
        </div>
      </div>

      <div class="report-section" style="margin-bottom: 2.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem; border-left: 4px solid var(--primary); padding-left: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
          <i data-lucide="list" style="width: 18px; height: 18px;"></i>
          Rapor Kapsamındaki Ödevler
        </h3>
        <div class="table-wrapper">
          <table class="table" style="font-size: 0.9rem;">
            <thead>
              <tr>
                <th style="width: 25%;">Ödev Konusu</th>
                <th>Açıklama</th>
                <th style="width: 20%; text-align: center;">Son Teslim Tarihi</th>
              </tr>
            </thead>
            <tbody>
              ${filteredHws.map(hw => `
                <tr>
                  <td><strong>${hw.title}</strong></td>
                  <td style="color: var(--text-secondary); font-style: italic;">${hw.description || '-'}</td>
                  <td style="text-align: center; font-weight: 500;">${formatDate(hw.dueDate)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="report-section">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem; border-left: 4px solid var(--success); padding-left: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
          <i data-lucide="users" style="width: 18px; height: 18px;"></i>
          Öğrenci Bazında Performans Özeti
        </h3>
        <div class="table-wrapper">
          <table class="table" style="font-size: 0.9rem;">
            <thead>
              <tr>
                <th style="text-align: center; width: 80px;">No</th>
                <th>Adı Soyadı</th>
                <th style="text-align: center; width: 80px;">Beklenen</th>
                <th style="text-align: center; width: 70px; color: var(--success);">Yapıldı</th>
                <th style="text-align: center; width: 70px; color: var(--warning);">Eksik</th>
                <th style="text-align: center; width: 70px; color: var(--danger);">Yapılmadı</th>
                <th style="text-align: center; width: 70px; color: var(--info);">Muaf</th>
                <th style="text-align: center; font-weight: 700; width: 110px;">Başarı</th>
              </tr>
            </thead>
            <tbody>
              ${studentsStats.map(std => {
                let pctClass = 'missing';
                if (std.successRate >= 80) pctClass = 'completed';
                else if (std.successRate >= 50) pctClass = 'incomplete';

                return `
                  <tr>
                    <td style="text-align: center; font-weight: 600;">${std.number}</td>
                    <td><strong>${std.name} ${std.surname}</strong></td>
                    <td style="text-align: center; font-weight: 500;">${std.expected}</td>
                    <td style="text-align: center; font-weight: 600; color: var(--success);">${std.completed}</td>
                    <td style="text-align: center; font-weight: 600; color: var(--warning);">${std.incomplete}</td>
                    <td style="text-align: center; font-weight: 600; color: var(--danger);">${std.missing}</td>
                    <td style="text-align: center; font-weight: 600; color: var(--info);">${std.excused}</td>
                    <td style="text-align: center;">
                      <span class="status-badge ${pctClass}" style="font-weight: 700; width: 50px; text-align: center;">
                        %${std.successRate}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    hwReportPreviewBody.innerHTML = reportHTML;
    if (homeworkPrintArea) homeworkPrintArea.innerHTML = reportHTML;
    window.safeCreateIcons();
    modalHwReport.classList.add('active');
  });

  // Yazdır Butonu
  btnPrintHwReport.addEventListener('click', () => {
    document.body.classList.add('print-homework');
    window.print();
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('print-homework');
    }, { once: true });
    setTimeout(() => {
      document.body.classList.remove('print-homework');
    }, 500);
  });

  // Eski Form: Düzenleme submit (sadece geriye dönük uyumluluk için)
  formHomework.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = homeworkIdInput.value;
    const hwData = {
      title: homeworkTitleInput.value.trim(),
      description: homeworkDescInput.value.trim(),
      dueDate: homeworkDueInput.value
    };

    if (id) {
      stateManager.updateHomework(id, hwData);
      if (toastCallback) toastCallback('Ödev ayrıntıları güncellendi.', 'success');
    }

    modalHomework.classList.remove('active');
    homeworkDueInput.removeAttribute('readonly');
    renderHomeworkMatrix();

    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);
  });
}

// -------------------------------------------------------
// Ana Çizelge Render
// -------------------------------------------------------
function renderHomeworkMatrix() {
  const state = stateManager.loadState();

  homeworkWeeklyTableBody.innerHTML = '';
  const thead = homeworkWeeklyTable.querySelector('thead');
  if (thead) thead.innerHTML = '';

  const selectedWeek = stateManager.getSelectedWeek();
  if (homeworkActiveWeekDisplay) {
    homeworkActiveWeekDisplay.textContent = window.formatWeekTR(selectedWeek);
  }
  if (homeworkSelectWeek) {
    homeworkSelectWeek.value = selectedWeek;
  }
  if (!selectedWeek) {
    homeworkWeeklyEmptyState.style.display = 'block';
    homeworkWeeklyTable.style.display = 'none';
    return;
  }

  const weekDates = getWeekDates(selectedWeek);
  if (weekDates.length === 0) {
    homeworkWeeklyEmptyState.style.display = 'block';
    homeworkWeeklyTable.style.display = 'none';
    return;
  }

  homeworkWeeklyEmptyState.style.display = 'none';
  homeworkWeeklyTable.style.display = 'table';

  // 1. Tablo Başlığı
  const headerRow = document.createElement('tr');

  const thNo = document.createElement('th');
  thNo.className = 'th-no';
  thNo.textContent = 'No';
  thNo.style.width = '50px';
  thNo.style.textAlign = 'center';
  headerRow.appendChild(thNo);

  const thName = document.createElement('th');
  thName.className = 'th-name';
  thName.textContent = 'Öğrenci Adı Soyadı';
  thName.style.minWidth = '180px';
  headerRow.appendChild(thName);

  const selectBranch = document.getElementById('homework-select-branch');
  const branchFilter = selectBranch ? selectBranch.value : 'all';

  weekDates.forEach(day => {
    const hw = state.homeworks.find(h =>
      h.dueDate === day.dateStr &&
      (state.educationLevel === 'primary' || h.branch === branchFilter)
    );

    const parts = day.dateStr.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}.${parts[1]}` : day.dateStr;

    const defaultTitles = ['Pazartesi Ödevi', 'Salı Ödevi', 'Çarşamba Ödevi', 'Perşembe Ödevi', 'Cuma Ödevi'];
    let subTitle = '';
    if (hw && hw.title && !defaultTitles.includes(hw.title)) {
      subTitle = hw.title;
    }

    const thDay = document.createElement('th');
    thDay.className = 'th-day';
    thDay.style.padding = '0.5rem 0.25rem';
    thDay.style.minWidth = '130px';
    thDay.style.verticalAlign = 'top';

    const dayCard = document.createElement('div');
    dayCard.className = 'hw-day-card';

    if (hw) {
      // Ödev VAR → Görüntüle + Sil butonları
      dayCard.innerHTML = `
        <div class="hw-day-name">${day.dayName}</div>
        <div class="hw-day-date">${formattedDate}</div>
        ${subTitle ? `<div class="hw-day-subtitle" title="${hw.description || ''}">${subTitle}</div>` : ''}
        <div class="hw-col-actions" style="margin-top: 0.4rem; display: flex; justify-content: center; gap: 0.25rem;">
          <button class="action-btn-sm hw-view-btn" title="Verilen Ödevi Görüntüle / WhatsApp'ta Paylaş" style="background: rgba(99,102,241,0.15); color: var(--primary); border: 1px solid rgba(99,102,241,0.3);">
            <i data-lucide="eye" style="width: 12px; height: 12px;"></i>
          </button>
          <button class="action-btn-sm delete-hw-btn delete" title="Ödevi Sil / Sıfırla">
            <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
          </button>
        </div>
      `;

      dayCard.querySelector('.hw-view-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openViewHomeworkModal(hw, day.dayName);
      });

      dayCard.querySelector('.delete-hw-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`"${day.dayName} (${formattedDate})" gününe ait ödev başlığını ve bu güne girilmiş tüm öğrenci puanlarını sıfırlamak istediğinize emin misiniz?`)) {
          stateManager.deleteHomework(hw.id);
          renderHomeworkMatrix();
          const event = new CustomEvent('stateChanged');
          document.dispatchEvent(event);
        }
      });

    } else {
      // Ödev YOK → Ödev Ver butonu
      dayCard.innerHTML = `
        <div class="hw-day-name">${day.dayName}</div>
        <div class="hw-day-date">${formattedDate}</div>
        <div class="hw-col-actions" style="margin-top: 0.5rem; display: flex; justify-content: center;">
          <button class="action-btn-sm hw-send-btn" title="Bu güne ödev ver ve WhatsApp'a gönder" style="background: rgba(37,211,102,0.15); color: #1a9e4f; border: 1px solid rgba(37,211,102,0.35); display: flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem; font-size: 0.7rem; font-weight: 600; white-space: nowrap;">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="#1a9e4f"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Ödev Ver
          </button>
        </div>
      `;

      dayCard.querySelector('.hw-send-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openSendHomeworkModal(day.dateStr, day.dayName);
      });
    }

    thDay.appendChild(dayCard);
    headerRow.appendChild(thDay);
  });

  const thTotal = document.createElement('th');
  thTotal.className = 'th-total';
  thTotal.textContent = 'Puan';
  thTotal.style.width = '70px';
  thTotal.style.textAlign = 'center';
  headerRow.appendChild(thTotal);

  if (thead) thead.appendChild(headerRow);

  const activeStudents = state.students.filter(student => {
    return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
  });

  // 2. Öğrenci Satırları
  if (activeStudents.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="${3 + weekDates.length}" style="text-align: center; color: var(--text-muted); padding: 2rem;">
        Sınıfta kayıtlı öğrenci yok.
      </td>
    `;
    homeworkWeeklyTableBody.appendChild(row);
  } else {
    const sortedStudents = [...activeStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    const settings = stateManager.getHomeworkSettings();

    sortedStudents.forEach(std => {
      const row = document.createElement('tr');
      const isAbsentToday = stateManager.isStudentAbsent(std.id);
      if (isAbsentToday) {
        row.classList.add('absent-row');
      }

      const tdNo = document.createElement('td');
      tdNo.className = 'td-no';
      tdNo.style.fontWeight = '600';
      tdNo.style.textAlign = 'center';
      tdNo.textContent = std.number;
      row.appendChild(tdNo);

      const tdName = document.createElement('td');
      tdName.className = 'td-name';
      tdName.innerHTML = `<span class="homework-weekly-student-name">${std.name} ${std.surname}</span>`;
      tdName.querySelector('.homework-weekly-student-name').addEventListener('click', () => {
        if (window.openStudentDetailModal) window.openStudentDetailModal(std.id);
      });
      row.appendChild(tdName);

      let weeklyScoreSum = 0;

      const dayData = weekDates.map(day => {
        const hw = state.homeworks.find(h =>
          h.dueDate === day.dateStr &&
          (state.educationLevel === 'primary' || h.branch === branchFilter)
        );
        const currentStatus = (hw && hw.status && hw.status[std.id]) || 'none';

        let badgeText = '-';
        let pointText = '';

        if (currentStatus === 'completed') {
          badgeText = 'Tam';
          pointText = settings.completed >= 0 ? `+${settings.completed}` : settings.completed;
          weeklyScoreSum += settings.completed;
        } else if (currentStatus === 'incomplete') {
          badgeText = 'Yarım';
          pointText = settings.incomplete >= 0 ? `+${settings.incomplete}` : settings.incomplete;
          weeklyScoreSum += settings.incomplete;
        } else if (currentStatus === 'missing') {
          badgeText = 'Yapmadı';
          pointText = settings.missing >= 0 ? `+${settings.missing}` : settings.missing;
          weeklyScoreSum += settings.missing;
        } else if (currentStatus === 'excused') {
          badgeText = 'Muaf';
          const excusedPoints = settings.excused !== undefined ? settings.excused : 0;
          pointText = excusedPoints >= 0 ? `+${excusedPoints}` : excusedPoints;
          weeklyScoreSum += excusedPoints;
        }

        const labelToShow = pointText !== '' ? `${badgeText} (${pointText})` : badgeText;
        const parts = day.dateStr.split('-');
        const formattedDate = parts.length === 3 ? `${parts[2]}.${parts[1]}` : day.dateStr;
        const shortDayNames = { 'Pazartesi': 'Pzt', 'Salı': 'Sal', 'Çarşamba': 'Çar', 'Perşembe': 'Per', 'Cuma': 'Cum' };
        const shortName = shortDayNames[day.dayName] || day.dayName;
        const cellId = `cell-${day.dateStr.replace(/-/g, '_')}-${std.id}`;
        return { day, hw, currentStatus, labelToShow, shortName, formattedDate, cellId };
      });

      dayData.forEach(({ day, hw, currentStatus, labelToShow, shortName, formattedDate, cellId }) => {
        const tdDay = document.createElement('td');
        tdDay.className = 'td-day';
        tdDay.innerHTML = `
          <div class="hw-mobile-header" style="display: none;">${shortName}<span class="hw-mobile-date"> ${formattedDate}</span></div>
          <span class="status-badge status-interactive ${currentStatus}" id="${cellId}">${labelToShow}</span>
        `;
        tdDay.querySelector(`#${cellId}`).addEventListener('click', () => {
          let targetHwId = hw ? hw.id : null;
          if (!targetHwId) {
            const newHw = stateManager.addHomework({
              title: `${day.dayName} Ödevi`,
              description: '',
              dueDate: day.dateStr,
              branch: (state.educationLevel === 'middle') ? branchFilter : ''
            });
            targetHwId = newHw.id;
          }
          const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
          const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
          const nextStatus = STATUS_CYCLE[nextIndex];
          stateManager.updateHomeworkStatus(targetHwId, std.id, nextStatus);
          renderHomeworkMatrix();
          const event = new CustomEvent('stateChanged');
          document.dispatchEvent(event);
        });
        row.appendChild(tdDay);
      });

      const tdTotal = document.createElement('td');
      tdTotal.className = 'hw-total-cell td-total';
      let totalBadgeClass = 'zero';
      if (weeklyScoreSum > 0) totalBadgeClass = 'positive';
      else if (weeklyScoreSum < 0) totalBadgeClass = 'negative';
      const showSign = weeklyScoreSum >= 0 ? '+' : '';
      tdTotal.innerHTML = `
        <span class="weekly-total-badge ${totalBadgeClass}">
          ${showSign}${weeklyScoreSum}
        </span>
      `;
      row.appendChild(tdTotal);

      homeworkWeeklyTableBody.appendChild(row);
    });
  }

  window.safeCreateIcons();
}

// -------------------------------------------------------
// Eski fonksiyon (geriye dönük uyumluluk için korunuyor)
// -------------------------------------------------------
function openEditOrCreateHomework(dateStr, dayName) {
  const state = stateManager.loadState();
  const selectBranch = document.getElementById('homework-select-branch');
  const branchFilter = selectBranch ? selectBranch.value : 'all';

  let hw = state.homeworks.find(h =>
    h.dueDate === dateStr &&
    (state.educationLevel === 'primary' || h.branch === branchFilter)
  );

  if (!hw) {
    hw = stateManager.addHomework({
      title: `${dayName} Ödevi`,
      description: '',
      dueDate: dateStr,
      branch: (state.educationLevel === 'middle') ? branchFilter : ''
    });
  }

  homeworkIdInput.value = hw.id;
  homeworkTitleInput.value = hw.title;
  homeworkDescInput.value = hw.description || '';
  homeworkDueInput.value = hw.dueDate;
  homeworkDueInput.setAttribute('readonly', 'true');
  modalHomeworkTitle.textContent = `${dayName} Günü Ödev Detayları`;
  modalHomework.classList.add('active');
}

window.setupHomeworkTab = setupHomeworkTab;
window.renderHomeworkMatrix = renderHomeworkMatrix;
})();
