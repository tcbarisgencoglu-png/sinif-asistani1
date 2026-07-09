(() => {
  // Sınıf Asistanı Haftalık Ders Programı Modülü

  let toastCallbackFn = null;
  let activeScheduleTab = 'lessons'; // 'lessons' veya 'times'
  let selectedColor = '#ef4444'; // Varsayılan ders rengi (Kırmızı)

  // DOM Elemanları
  let btnLaunchSchedule;
  let toolsLandingView;
  let toolsScheduleView;
  let btnBackToToolsFromSchedule;

  let btnScheduleTabLessons;
  let btnScheduleTabTimes;
  let schedulePanelLessons;
  let schedulePanelTimes;

  let scheduleLessonNameInput;
  let scheduleColorPickerContainer;
  let btnAddScheduleLesson;
  let scheduleLessonsList;

  let scheduleTimesFormContainer;
  let btnPrintSchedule;
  let btnClearSchedule;
  let schedulePreviewContent;

  const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
  
  function getPeriods() {
    const state = stateManager.loadState();
    return state.educationLevel === 'middle'
      ? ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']
      : ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  }

  const PERIOD_LABELS = {
    p1: '1. Ders',
    p2: '2. Ders',
    p3: '3. Ders',
    p4: '4. Ders',
    p5: '5. Ders',
    p6: '6. Ders',
    p7: '7. Ders'
  };

  function setupScheduleTool(toastCallback) {
    toastCallbackFn = toastCallback;

    // DOM elemanlarını bağla
    btnLaunchSchedule = document.getElementById('btn-launch-schedule');
    toolsLandingView = document.getElementById('tools-landing-view');
    toolsScheduleView = document.getElementById('tools-schedule-view');
    btnBackToToolsFromSchedule = document.getElementById('btn-back-to-tools-from-schedule');

    btnScheduleTabLessons = document.getElementById('btn-schedule-tab-lessons');
    btnScheduleTabTimes = document.getElementById('btn-schedule-tab-times');
    schedulePanelLessons = document.getElementById('schedule-panel-lessons');
    schedulePanelTimes = document.getElementById('schedule-panel-times');

    scheduleLessonNameInput = document.getElementById('schedule-lesson-name');
    scheduleColorPickerContainer = document.getElementById('schedule-color-picker-container');
    btnAddScheduleLesson = document.getElementById('btn-add-schedule-lesson');
    scheduleLessonsList = document.getElementById('schedule-lessons-list');

    scheduleTimesFormContainer = document.getElementById('schedule-times-form-container');
    btnPrintSchedule = document.getElementById('btn-print-schedule');
    btnClearSchedule = document.getElementById('btn-clear-schedule');
    schedulePreviewContent = document.getElementById('schedule-preview-content');

    // Navigasyon Olay Dinleyicileri
    if (btnLaunchSchedule) {
      btnLaunchSchedule.addEventListener('click', () => {
        if (toolsLandingView) toolsLandingView.style.display = 'none';
        if (toolsScheduleView) toolsScheduleView.style.display = 'block';
        renderScheduleTool();
      });
    }

    if (btnBackToToolsFromSchedule) {
      btnBackToToolsFromSchedule.addEventListener('click', () => {
        if (toolsScheduleView) toolsScheduleView.style.display = 'none';
        if (toolsLandingView) toolsLandingView.style.display = 'block';
      });
    }

    // Sol Panel Sekme Dinleyicileri
    if (btnScheduleTabLessons) {
      btnScheduleTabLessons.addEventListener('click', () => {
        switchScheduleTab('lessons');
      });
    }

    if (btnScheduleTabTimes) {
      btnScheduleTabTimes.addEventListener('click', () => {
        switchScheduleTab('times');
      });
    }

    // Renk Seçici Dinleyicileri
    if (scheduleColorPickerContainer) {
      const colorDots = scheduleColorPickerContainer.querySelectorAll('.color-dot');
      colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
          colorDots.forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
          selectedColor = dot.getAttribute('data-color');
        });
      });
    }

    // Ders Ekleme Butonu
    if (btnAddScheduleLesson) {
      btnAddScheduleLesson.addEventListener('click', () => {
        addLesson();
      });
    }

    // Ders adı inputunda Enter tuşuna basılınca ekle
    if (scheduleLessonNameInput) {
      scheduleLessonNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          addLesson();
        }
      });
    }

    // Programı Yazdır Butonu
    if (btnPrintSchedule) {
      btnPrintSchedule.addEventListener('click', () => {
        printSchedule();
      });
    }

    // Programı Temizle Butonu
    if (btnClearSchedule) {
      btnClearSchedule.addEventListener('click', () => {
        if (confirm('Ders programı tablosundaki tüm seçimleri temizlemek istediğinize emin misiniz? (Ders tanımları silinmez)')) {
          stateManager.clearScheduleGrid();
          renderScheduleTable();
          if (toastCallbackFn) toastCallbackFn('Ders programı temizlendi.', 'info');
        }
      });
    }
  }

  // Sol Sütun Alt Sekmeleri Arası Geçiş
  function switchScheduleTab(tabId) {
    activeScheduleTab = tabId;
    if (tabId === 'lessons') {
      if (btnScheduleTabLessons) btnScheduleTabLessons.classList.add('active');
      if (btnScheduleTabTimes) btnScheduleTabTimes.classList.remove('active');
      if (schedulePanelLessons) schedulePanelLessons.style.display = 'block';
      if (schedulePanelTimes) schedulePanelTimes.style.display = 'none';
    } else {
      if (btnScheduleTabLessons) btnScheduleTabLessons.classList.remove('active');
      if (btnScheduleTabTimes) btnScheduleTabTimes.classList.add('active');
      if (schedulePanelLessons) schedulePanelLessons.style.display = 'none';
      if (schedulePanelTimes) schedulePanelTimes.style.display = 'block';
    }
  }

  // Yeni Ders Ekleme
  function addLesson() {
    if (!scheduleLessonNameInput) return;
    const name = scheduleLessonNameInput.value.trim();
    if (!name) {
      if (toastCallbackFn) toastCallbackFn('Lütfen geçerli bir ders adı girin.', 'warning');
      return;
    }

    const lessons = stateManager.getLessons();
    const isDuplicate = lessons.some(l => l.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
      if (toastCallbackFn) toastCallbackFn('Bu ders zaten tanımlanmış.', 'warning');
      return;
    }

    stateManager.saveLesson({
      name: name,
      color: selectedColor
    });

    scheduleLessonNameInput.value = '';
    renderLessonsList();
    renderScheduleTable();
    if (toastCallbackFn) toastCallbackFn('Ders başarıyla tanımlandı.', 'success');
  }

  // Ders silme
  function deleteLesson(lessonId) {
    const lessons = stateManager.getLessons();
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    if (confirm(`"${lesson.name}" dersini silmek istediğinize emin misiniz? Bu ders programda seçili olduğu hücrelerden de kaldırılacaktır.`)) {
      stateManager.deleteLesson(lessonId);
      renderLessonsList();
      renderScheduleTable();
      if (toastCallbackFn) toastCallbackFn('Ders tanımı kaldırıldı.', 'info');
    }
  }

  // Sol paneldeki Ders Tanımları listesini çizme
  function renderLessonsList() {
    if (!scheduleLessonsList) return;
    scheduleLessonsList.innerHTML = '';

    const lessons = stateManager.getLessons();
    
    lessons.forEach(l => {
      const item = document.createElement('div');
      item.className = 'schedule-lesson-item';
      
      item.innerHTML = `
        <div class="schedule-lesson-info">
          <span class="schedule-lesson-color-badge" style="background-color: ${l.color};"></span>
          <span style="font-weight: 600; color: var(--text-primary);">${l.name}</span>
        </div>
        <button class="schedule-lesson-delete-btn" data-id="${l.id}" title="Sil">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
        </button>
      `;

      item.querySelector('button').addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deleteLesson(id);
      });

      scheduleLessonsList.appendChild(item);
    });

    window.safeCreateIcons();
  }

  // Sol paneldeki Saat Ayarları formunu çizme ve bağlama
  function renderTimesForm() {
    if (!scheduleTimesFormContainer) return;
    scheduleTimesFormContainer.innerHTML = '';

    const times = stateManager.getScheduleTimes();

    const renderRow = (key, label, isLunch = false) => {
      const timeData = times[key] || { start: '', end: '' };
      const row = document.createElement('div');
      row.className = 'schedule-time-row';
      if (isLunch) {
        row.style.borderLeft = '3px solid var(--warning)';
      }

      row.innerHTML = `
        <span class="schedule-time-label" style="${isLunch ? 'color: var(--warning); font-weight: 800;' : ''}">${label}</span>
        <div class="schedule-time-inputs">
          <input type="time" class="schedule-time-input start-time" data-key="${key}" value="${timeData.start}">
          <span class="schedule-time-separator">-</span>
          <input type="time" class="schedule-time-input end-time" data-key="${key}" value="${timeData.end}">
        </div>
      `;

      // Değişiklik dinleyicileri
      row.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => {
          const slotKey = input.getAttribute('data-key');
          const isStart = input.classList.contains('start-time');
          
          const currentTimes = stateManager.getScheduleTimes();
          if (!currentTimes[slotKey]) currentTimes[slotKey] = { start: '', end: '' };
          
          if (isStart) {
            currentTimes[slotKey].start = input.value;
          } else {
            currentTimes[slotKey].end = input.value;
          }

          stateManager.saveScheduleTimes(currentTimes);
          renderScheduleTable();
        });
      });

      scheduleTimesFormContainer.appendChild(row);
    };

    const activePeriods = getPeriods();

    // 1-4 Ders Saatleri
    activePeriods.slice(0, 4).forEach(p => {
      renderRow(p, PERIOD_LABELS[p]);
    });

    // Öğle Yemeği Arası
    renderRow('lunch', 'Öğle Arası', true);

    // 5. ve sonrası Ders Saatleri
    activePeriods.slice(4).forEach(p => {
      renderRow(p, PERIOD_LABELS[p]);
    });
  }

  // Sağ paneldeki A4 Haftalık Ders Programı Tablosunu Çizme
  function renderScheduleTable() {
    if (!schedulePreviewContent) return;

    const lessons = stateManager.getLessons();
    const times = stateManager.getScheduleTimes();
    const grid = stateManager.getScheduleGrid();
    const className = times.className || '3/A';

    // Dropdown seçeneklerini oluştur (Dersler + Boş seçeneği)
    const getOptionsHtml = (selectedLessonId) => {
      let options = `<option value="" ${!selectedLessonId ? 'selected' : ''} style="color: var(--text-muted);">BOŞ</option>`;
      lessons.forEach(l => {
        options += `<option value="${l.id}" ${selectedLessonId === l.id ? 'selected' : ''} style="background-color: #ffffff; color: #1e293b;">${l.name.toUpperCase()}</option>`;
      });
      return options;
    };

    // Satır HTML oluşturucu
    const getRowHtml = (periodKey, label) => {
      const timeData = times[periodKey] || { start: '00:00', end: '00:00' };
      const timeText = `${timeData.start || '--:--'} - ${timeData.end || '--:--'}`;
      
      let cellsHtml = '';
      DAYS.forEach((day, dIdx) => {
        const gridKey = `${dIdx + 1}-${periodKey}`;
        const selectedLessonId = grid[gridKey] || '';
        const selectedLesson = lessons.find(l => l.id === selectedLessonId);
        
        let cellStyle = '';
        let selectStyle = 'color: #94a3b8; font-weight: 500;';
        let printTextColor = '#1e293b';
        let lessonName = '';

        if (selectedLesson) {
          cellStyle = `background-color: ${selectedLesson.color}; color: #ffffff;`;
          selectStyle = 'color: #ffffff; font-weight: 800;';
          printTextColor = '#ffffff';
          lessonName = selectedLesson.name.toUpperCase();
        }

        cellsHtml += `
          <td style="${cellStyle} padding: 0.15rem; transition: background-color 0.25s;" data-grid-key="${gridKey}">
            <select class="schedule-cell-select" data-grid-key="${gridKey}" style="${selectStyle}">
              ${getOptionsHtml(selectedLessonId)}
            </select>
            <span class="print-cell-text" style="color: ${printTextColor};">${lessonName}</span>
          </td>
        `;
      });

      return `
        <tr>
          <td class="schedule-time-cell">
            <div>${label}</div>
            <span>${timeText}</span>
          </td>
          ${cellsHtml}
        </tr>
      `;
    };

    // Öğle Yemeği Satır HTML
    const getLunchRowHtml = () => {
      const lunchData = times['lunch'] || { start: '12:10', end: '13:00' };
      const timeText = `${lunchData.start || '--:--'} - ${lunchData.end || '--:--'}`;
      return `
        <tr class="schedule-lunch-row">
          <td class="schedule-time-cell" style="background-color: #f1f5f9;">
            <div style="color: var(--warning, #fbbf24); font-weight: 800;">ÖĞLE ARASI</div>
            <span>${timeText}</span>
          </td>
          <td colspan="5" style="background-color: #f8fafc; font-weight: 800; color: #64748b; font-size: 0.8rem;">
            🍴 ÖĞLE YEMEĞİ VE DİNLENME ARASI (${timeText})
          </td>
        </tr>
      `;
    };

    // Tablo Gövdesini Oluştur
    const activePeriods = getPeriods();
    const tableBodyRowsList = [];
    
    activePeriods.slice(0, 4).forEach(p => {
      tableBodyRowsList.push(getRowHtml(p, PERIOD_LABELS[p]));
    });
    
    tableBodyRowsList.push(getLunchRowHtml());
    
    activePeriods.slice(4).forEach(p => {
      tableBodyRowsList.push(getRowHtml(p, PERIOD_LABELS[p]));
    });
    
    const tableBodyRows = tableBodyRowsList.join('');

    schedulePreviewContent.innerHTML = `
      <div class="schedule-print-header">
        <h1 style="font-size: 1.6rem; font-weight: 900; margin: 0; color: #1e1b4b; letter-spacing: 0.5px;">HAFTALIK DERS PROGRAMI</h1>
        <div class="schedule-meta" id="schedule-class-name-container" style="margin-top: 0.4rem; font-size: 0.95rem; font-weight: 700; color: #475569;">
          SINIF / ŞUBE: <span contenteditable="true" id="schedule-class-name" style="border-bottom: 2px dashed #94a3b8; padding: 0 6px; font-weight: 800; cursor: pointer; color: #1e1b4b;" title="Sınıf adını düzenlemek için tıklayın">${className}</span>
        </div>
      </div>
      <div class="schedule-table-wrapper">
        <table class="schedule-table">
          <thead>
            <tr>
              <th style="width: 12%">Saat</th>
              <th style="width: 17.6%">PAZARTESİ</th>
              <th style="width: 17.6%">SALI</th>
              <th style="width: 17.6%">ÇARŞAMBA</th>
              <th style="width: 17.6%">PERŞEMBE</th>
              <th style="width: 17.6%">CUMA</th>
            </tr>
          </thead>
          <tbody>
            ${tableBodyRows}
          </tbody>
        </table>
      </div>
    `;

    // Dropdown olay dinleyicilerini bağla
    schedulePreviewContent.querySelectorAll('.schedule-cell-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const gridKey = e.target.getAttribute('data-grid-key');
        const val = e.target.value;
        const parts = gridKey.split('-');
        const day = parseInt(parts[0]);
        const period = parts[1];

        // Hücreyi kaydet
        stateManager.saveScheduleCell(day, period, val);
        
        // Tabloyu yeniden çiz (renkleri güncellemek için)
        renderScheduleTable();
      });
    });

    // Sınıf adı inline edit dinleyicisi
    const classNameSpan = document.getElementById('schedule-class-name');
    if (classNameSpan) {
      classNameSpan.addEventListener('blur', () => {
        const newName = classNameSpan.textContent.trim() || '3/A';
        const currentTimes = stateManager.getScheduleTimes();
        currentTimes.className = newName;
        stateManager.saveScheduleTimes(currentTimes);
        classNameSpan.textContent = newName;
      });

      classNameSpan.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          classNameSpan.blur();
        }
      });
    }
  }

  // Yazdırma alanını hazırlama
  function prepareSchedulePrintArea() {
    const printArea = document.getElementById('schedule-print-area');
    if (!printArea) return;

    renderScheduleTable();

    // Önizleme içeriğinden sadece tablo kısmını al (başlığı özel olarak iki kopya için de üreteceğiz)
    const rawContent = schedulePreviewContent.innerHTML;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawContent;
    
    // Eski başlık alanını temizle (her kopya için temiz başlık ekleyeceğiz)
    const oldHeader = tempDiv.querySelector('.schedule-print-header');
    if (oldHeader) oldHeader.remove();

    const cleanedTableHtml = tempDiv.innerHTML;

    // Sınıf adını al
    const times = stateManager.getScheduleTimes();
    const className = (times.className || '3/A').trim().toUpperCase();

    // Bir adet kopya şablonu (Sayfa kırılmalarını önlemek için page-break-inside ekledik)
    const singleCopyHtml = `
      <div class="schedule-print-copy" style="page-break-inside: avoid; width: 100%; box-sizing: border-box;">
        <div class="schedule-print-header" style="text-align: center; margin-bottom: 0.75rem;">
          <h1 style="font-size: 1.4rem; font-weight: 900; margin: 0; color: #000000; letter-spacing: 0.5px; text-transform: uppercase;">
            ${className} SINIFI HAFTALIK DERS PROGRAMI
          </h1>
        </div>
        ${cleanedTableHtml}
      </div>
    `;

    // İki kopyayı aralarında makaslı kesme çizgisiyle birleştir
    printArea.innerHTML = `
      <div class="schedule-print-wrapper" style="width: 100%; display: flex; flex-direction: column; gap: 2rem; background: white; color: black; box-sizing: border-box;">
        ${singleCopyHtml}
        <div class="schedule-print-divider" style="border-top: 2px dashed #000000; margin: 1.5rem 0; text-align: center; font-size: 10pt; font-family: sans-serif; font-weight: 700; color: #000000; letter-spacing: 2px; user-select: none;">
          ✂️ MAKASLA BURADAN KESİNİZ ✂️
        </div>
        ${singleCopyHtml}
      </div>
    `;
  }

  // Yazdırma İşlemi (Buton tetiklemeli)
  function printSchedule() {
    prepareSchedulePrintArea();
    document.body.classList.add('print-schedule');
    
    // Tarayıcının yeni stilleri uygulayabilmesi için kısa bir gecikme verelim
    setTimeout(() => {
      window.print();
    }, 150);

    // afterprint tetiklenmeme ihtimaline karşı 2 saniye sonra sınıfı temizleyen yedek zamanlayıcı
    setTimeout(() => {
      document.body.classList.remove('print-schedule');
    }, 2000);
  }

  // Tarayıcı yazdırma kısayolu (Cmd+P / Ctrl+P) veya tarayıcı menüsüyle yazdırma desteği
  window.addEventListener('beforeprint', () => {
    const scheduleView = document.getElementById('tools-schedule-view');
    if (scheduleView && scheduleView.style.display !== 'none') {
      prepareSchedulePrintArea();
      document.body.classList.add('print-schedule');
    }
  });

  window.addEventListener('afterprint', () => {
    document.body.classList.remove('print-schedule');
  });

  // Ana Başlatıcı
  function renderScheduleTool() {
    switchScheduleTab('lessons');
    renderLessonsList();
    renderTimesForm();
    renderScheduleTable();
  }

  window.setupScheduleTool = setupScheduleTool;
  window.renderScheduleTool = renderScheduleTool;

})();
