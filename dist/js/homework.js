(() => {
// DOM Elemanları
const homeworkWeeklyTable = document.getElementById('homework-weekly-table');
const homeworkWeeklyTableBody = document.getElementById('homework-weekly-table-body');
const homeworkWeeklyEmptyState = document.getElementById('homework-weekly-empty-state');
const homeworkSelectWeek = document.getElementById('homework-select-week');
const btnHwPrevWeek = document.getElementById('btn-hw-prev-week');
const btnHwNextWeek = document.getElementById('btn-hw-next-week');
const homeworkActiveWeekDisplay = document.getElementById('homework-active-week-display');

// Modallar ve Formlar
const modalHomework = document.getElementById('modal-homework');
const formHomework = document.getElementById('form-homework');
const homeworkIdInput = document.getElementById('homework-id');
const homeworkTitleInput = document.getElementById('homework-title-input');
const homeworkDescInput = document.getElementById('homework-desc-input');
const homeworkDueInput = document.getElementById('homework-due-input');
const modalHomeworkTitle = document.getElementById('modal-homework-title');



// Rapor Elemanları
const hwReportStart = document.getElementById('hw-report-start');
const hwReportEnd = document.getElementById('hw-report-end');
const btnGenerateHwReport = document.getElementById('btn-generate-hw-report');
const modalHwReport = document.getElementById('modal-homework-report');
const hwReportPreviewBody = document.getElementById('homework-report-preview-body');
const btnPrintHwReport = document.getElementById('btn-print-homework-report');
const homeworkPrintArea = document.querySelector('.homework-report-print');

let toastCallback = null;

const STATUS_CYCLE = ['none', 'completed', 'incomplete', 'missing', 'excused'];
const WEEKDAYS_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

// Tarihten ISO Hafta Kodunu Alma (Örn: 2026-W23)
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

// ISO Haftasındaki belirli bir günü alma yardımcı fonksiyonu (1 = Pazartesi, ..., 7 = Pazar)
function getDayInWeek(year, week, dayIndex) {
  const jan4 = new Date(year, 0, 4);
  const dayOfJan4 = jan4.getDay() || 7;
  const week1Start = new Date(jan4.getTime());
  week1Start.setDate(jan4.getDate() - dayOfJan4 + 1);

  const targetDay = new Date(week1Start.getTime());
  targetDay.setDate(week1Start.getDate() + (week - 1) * 7 + (dayIndex - 1));
  return targetDay;
}

// Seçilen hafta kodundaki 5 iş gününü hesaplayan fonksiyon
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

function setupHomeworkTab(showToast) {
  toastCallback = showToast;

  // Modal Kapatma Düğmeleri
  document.querySelectorAll('#modal-homework .close-btn, #modal-homework .close-btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
      modalHomework.classList.remove('active');
      homeworkDueInput.removeAttribute('readonly');
    });
  });

  // Rapor Modalı Kapatma Düğmeleri
  document.querySelectorAll('#modal-homework-report .close-btn, #modal-homework-report .close-btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
      modalHwReport.classList.remove('active');
    });
  });



  // Hafta seçici başlangıç değeri
  if (homeworkSelectWeek) {
    homeworkSelectWeek.value = stateManager.getSelectedWeek();
  }

  // Rapor Oluştur Buton Tıklaması
  btnGenerateHwReport.addEventListener('click', () => {
    const startVal = hwReportStart.value;
    const endVal = hwReportEnd.value;

    if (!startVal || !endVal) {
      if (toastCallback) {
        toastCallback('Lütfen başlangıç ve bitiş tarihlerini seçin!', 'warning');
      }
      return;
    }

    if (startVal > endVal) {
      if (toastCallback) {
        toastCallback('Başlangıç tarihi bitiş tarihinden sonra olamaz!', 'warning');
      }
      return;
    }

    const state = stateManager.loadState();
    const selectBranch = document.getElementById('homework-select-branch');
    const branchFilter = selectBranch ? selectBranch.value : 'all';

    // Ödevleri son teslim tarihine ve şubeye göre filtrele
    const filteredHws = state.homeworks.filter(hw => {
      const matchDate = hw.dueDate >= startVal && hw.dueDate <= endVal;
      const matchBranch = state.educationLevel === 'primary' || branchFilter === 'all' || hw.branch === branchFilter;
      return matchDate && matchBranch;
    });

    if (filteredHws.length === 0) {
      if (toastCallback) {
        toastCallback('Seçilen tarih aralığında tanımlı ödev bulunamadı.', 'warning');
      }
      return;
    }

    const activeStudents = state.students.filter(student => {
      return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
    });

    // Öğrenci istatistiklerini hesapla
    const studentsStats = activeStudents.map(std => {
      let completed = 0;
      let incomplete = 0;
      let missing = 0;
      let excused = 0;

      filteredHws.forEach(hw => {
        const status = hw.status ? hw.status[std.id] : undefined;
        if (status === 'completed') {
          completed++;
        } else if (status === 'incomplete') {
          incomplete++;
        } else if (status === 'excused') {
          excused++;
        } else {
          missing++;
        }
      });

      const expected = filteredHws.length - excused;
      const successRate = expected > 0 ? Math.round((completed / expected) * 100) : 0;

      return {
        ...std,
        completed,
        incomplete,
        missing,
        excused,
        expected,
        successRate
      };
    });

    // Öğrencileri isme göre sıralayalım
    studentsStats.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    // Tarih formatı yardımı
    const formatDate = (dateStr) => {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
      return dateStr;
    };

    const formattedStart = formatDate(startVal);
    const formattedEnd = formatDate(endVal);
    const todayStr = new Date().toLocaleDateString('tr-TR');

    // Rapor HTML şablonu oluştur
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

    // HTML'leri yerleştir
    hwReportPreviewBody.innerHTML = reportHTML;
    if (homeworkPrintArea) {
      homeworkPrintArea.innerHTML = reportHTML;
    }

    // Lucide ikonlarını render et
    window.safeCreateIcons();

    // Modalı aç
    modalHwReport.classList.add('active');
  });

  // Yazdır Butonu
  btnPrintHwReport.addEventListener('click', () => {
    document.body.classList.add('print-homework');
    window.print();

    // Baskı sonrasında veya pencere kapandığında temizlik yap
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('print-homework');
    }, { once: true });

    // Eski tarayıcılar için fallback
    setTimeout(() => {
      document.body.classList.remove('print-homework');
    }, 500);
  });

  // Ödev Form Gönderimi (Yeni Ekleme / Düzenleme)
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
      if (toastCallback) {
        toastCallback('Ödev ayrıntıları güncellendi.', 'success');
      }
    }

    modalHomework.classList.remove('active');
    homeworkDueInput.removeAttribute('readonly');
    renderHomeworkMatrix();

    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);
  });
}

function renderHomeworkMatrix() {
  const state = stateManager.loadState();
  
  // HTML'leri temizle
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

  // Seçilen haftanın 5 iş gününü (Pazartesi-Cuma) hesapla
  const weekDates = getWeekDates(selectedWeek);
  if (weekDates.length === 0) {
    homeworkWeeklyEmptyState.style.display = 'block';
    homeworkWeeklyTable.style.display = 'none';
    return;
  }

  homeworkWeeklyEmptyState.style.display = 'none';
  homeworkWeeklyTable.style.display = 'table';

  // 1. Tablo Başlığını (Header) Oluştur
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
    const hw = state.homeworks.find(h => h.dueDate === day.dateStr && (state.educationLevel === 'primary' || h.branch === branchFilter));
    const parts = day.dateStr.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}.${parts[1]}` : day.dateStr;
    let subTitle = '';
    const defaultTitles = ['Pazartesi Ödevi', 'Salı Ödevi', 'Çarşamba Ödevi', 'Perşembe Ödevi', 'Cuma Ödevi'];
    if (hw && hw.title && !defaultTitles.includes(hw.title)) {
      subTitle = hw.title;
    }
    const editBtnTitle = hw ? "Ödevi Düzenle" : "Ödev Konusu Ekle";
    const deleteBtnDisabled = hw ? "" : "display: none;";

    const thDay = document.createElement('th');
    thDay.className = 'th-day';
    thDay.style.padding = '0.5rem 0.25rem';
    thDay.style.minWidth = '120px';
    thDay.style.verticalAlign = 'top';

    const dayCard = document.createElement('div');
    dayCard.className = 'hw-day-card';
    dayCard.innerHTML = `
      <div class="hw-day-name">${day.dayName}</div>
      <div class="hw-day-date">${formattedDate}</div>
      ${subTitle ? `<div class="hw-day-subtitle" title="${hw.description || ''}">${subTitle}</div>` : ''}
      <div class="hw-col-actions" style="margin-top: 0.4rem; display: flex; justify-content: center; gap: 0.25rem;">
        <button class="action-btn-sm edit-hw-btn" title="${editBtnTitle}">
          <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
        </button>
        <button class="action-btn-sm delete-hw-btn delete" style="${deleteBtnDisabled}" title="Ödevi Sıfırla / Sil">
          <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
        </button>
      </div>
    `;
    dayCard.querySelector('.edit-hw-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditOrCreateHomework(day.dateStr, day.dayName);
    });
    if (hw) {
      dayCard.querySelector('.delete-hw-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`"${day.dayName} (${formattedDate})" gününe ait ödev başlığını ve bu güne girilmiş tüm öğrenci puanlarını sıfırlamak istediğinize emin misiniz?`)) {
          stateManager.deleteHomework(hw.id);
          renderHomeworkMatrix();
          const event = new CustomEvent('stateChanged');
          document.dispatchEvent(event);
        }
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

  if (thead) {
    thead.appendChild(headerRow);
  }

  const activeStudents = state.students.filter(student => {
    return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
  });

  // 2. Öğrenci Satırlarını Doldur
  if (activeStudents.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="${3 + weekDates.length}" style="text-align: center; color: var(--text-muted); padding: 2rem;">
        Sınıfta kayıtlı öğrenci yok.
      </td>
    `;
    homeworkWeeklyTableBody.appendChild(row);
  } else {
    // Öğrencileri isme göre sıralayalım
    const sortedStudents = [...activeStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    const settings = stateManager.getHomeworkSettings();

    sortedStudents.forEach(std => {
      const row = document.createElement('tr');

      // No
      const tdNo = document.createElement('td');
      tdNo.className = 'td-no';
      tdNo.style.fontWeight = '600';
      tdNo.style.textAlign = 'center';
      tdNo.textContent = std.number;
      row.appendChild(tdNo);

      // Öğrenci Adı (Tıklanınca detay modalı açılır)
      const tdName = document.createElement('td');
      tdName.className = 'td-name';
      tdName.innerHTML = `<span class="homework-weekly-student-name">${std.name} ${std.surname}</span>`;
      tdName.querySelector('.homework-weekly-student-name').addEventListener('click', () => {
        if (window.openStudentDetailModal) {
          window.openStudentDetailModal(std.id);
        }
      });
      row.appendChild(tdName);

      let weeklyScoreSum = 0;
      // Tüm günler için önceden puanları hesapla
      const dayData = weekDates.map(day => {
        const hw = state.homeworks.find(h => h.dueDate === day.dateStr && (state.educationLevel === 'primary' || h.branch === branchFilter));
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

      // Gün Sütunları
      dayData.forEach(({ day, hw, currentStatus, labelToShow, shortName, formattedDate, cellId }) => {
        const tdDay = document.createElement('td');
        tdDay.className = 'td-day';
        tdDay.innerHTML = `
          <div class="hw-mobile-header" style="display: none;">${shortName}<span class="hw-mobile-date"> ${formattedDate}</span></div>
          <span class="status-badge status-interactive ${currentStatus}" id="${cellId}">${labelToShow}</span>
        `;
        // Badge tıklama
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

      // Haftalık Toplam Puan Sütunu
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

  // Lucide ikonlarını güvenli şekilde yükle
  window.safeCreateIcons();
}

function openEditOrCreateHomework(dateStr, dayName) {
  const state = stateManager.loadState();
  const selectBranch = document.getElementById('homework-select-branch');
  const branchFilter = selectBranch ? selectBranch.value : 'all';
  
  let hw = state.homeworks.find(h => h.dueDate === dateStr && (state.educationLevel === 'primary' || h.branch === branchFilter));
  
  // Eğer henüz ödev nesnesi yoksa oluşturup kaydet
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
