/**
 * ==========================================================================
 * Sınıf Asistanı - Modern Türkçe Tarih Seçici (AppDatePicker)
 * ==========================================================================
 * - Takvimden bir gün seçildiğinde pencere anında ve otomatik kapanır.
 * - Tarihler gün, ay ve yıl (GG.AA.YYYY) formatında girilir ve görüntülenir.
 * - Kod seviyesinde standart ISO (YYYY-MM-DD) uyumluluğu korunur.
 */

(() => {
  'use strict';

  const MONTHS_TR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const MONTHS_SHORT_TR = [
    'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
    'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
  ];

  const WEEKDAYS_SHORT_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // Native input.value getter/setter saklama
  const nativeValueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  // Tarih Çevirme: Date / ISO -> GG.AA.YYYY
  function formatToTurkishDate(dateOrIso) {
    if (!dateOrIso) return '';
    if (typeof dateOrIso === 'string') {
      const trimmed = dateOrIso.trim();
      // Zaten GG.AA.YYYY ise
      if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(trimmed)) {
        const parts = trimmed.split('.');
        return `${pad(parts[0])}.${pad(parts[1])}.${parts[2]}`;
      }
      // YYYY-MM-DD ise
      if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
        const parts = trimmed.slice(0, 10).split('-');
        return `${pad(parts[2])}.${pad(parts[1])}.${parts[0]}`;
      }
    }
    const d = (dateOrIso instanceof Date) ? dateOrIso : new Date(dateOrIso);
    if (isNaN(d.getTime())) return '';
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  }

  // Tarih Çevirme: Her türlü string -> YYYY-MM-DD (ISO)
  function toISODate(strOrDate) {
    if (!strOrDate) return '';
    if (strOrDate instanceof Date) {
      if (isNaN(strOrDate.getTime())) return '';
      return `${strOrDate.getFullYear()}-${pad(strOrDate.getMonth() + 1)}-${pad(strOrDate.getDate())}`;
    }
    if (typeof strOrDate === 'string') {
      const trimmed = strOrDate.trim();
      // YYYY-MM-DD ise
      if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
        const parts = trimmed.slice(0, 10).split('-');
        return `${parts[0]}-${pad(parts[1])}-${pad(parts[2])}`;
      }
      // GG.AA.YYYY ise
      if (/^\d{1,2}[./-]\d{1,2}[./-]\d{4}$/.test(trimmed)) {
        const parts = trimmed.split(/[./-]/);
        return `${parts[2]}-${pad(parts[1])}-${pad(parts[0])}`;
      }
    }
    const d = new Date(strOrDate);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // Tarih Ayrıştırma: GG.AA.YYYY veya YYYY-MM-DD -> Date nesnesi
  function parseAnyDate(str) {
    if (!str) return null;
    if (str instanceof Date) return isNaN(str.getTime()) ? null : str;
    if (typeof str !== 'string') return null;

    const trimmed = str.trim();
    // GG.AA.YYYY
    if (/^\d{1,2}[./-]\d{1,2}[./-]\d{4}$/.test(trimmed)) {
      const parts = trimmed.split(/[./-]/);
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      if (dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d) {
        return dt;
      }
      return null;
    }

    // YYYY-MM-DD
    if (/^\d{4}[./-]\d{1,2}[./-]\d{1,2}/.test(trimmed)) {
      const parts = trimmed.slice(0, 10).split(/[./-]/);
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      if (dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d) {
        return dt;
      }
      return null;
    }

    const dt = new Date(trimmed);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // Global yardımcı fonksiyonlar
  window.formatToTurkishDate = formatToTurkishDate;
  window.toISODate = toISODate;
  window.parseAnyDate = parseAnyDate;

  // =========================================================================
  // SINGLETON TAKVİM PENCERESİ (POPOVER)
  // =========================================================================

  class DatePickerPopup {
    constructor() {
      this.activeInput = null;
      this.currentViewDate = new Date();
      this.isPickerView = false;
      this.pickerYear = new Date().getFullYear();

      this.createDOM();
      this.bindGlobalEvents();
    }

    createDOM() {
      this.popup = document.createElement('div');
      this.popup.className = 'adp-popup';
      this.popup.setAttribute('role', 'dialog');
      this.popup.setAttribute('aria-modal', 'true');
      this.popup.innerHTML = `
        <div class="adp-header">
          <button type="button" class="adp-nav-btn adp-prev" title="Önceki Ay">&#8249;</button>
          <button type="button" class="adp-title-btn" title="Ay ve Yıl Değiştir">
            <span class="adp-title-text">Ekim 2026</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <button type="button" class="adp-nav-btn adp-next" title="Sonraki Ay">&#8250;</button>
        </div>

        <!-- Günler Görünümü -->
        <div class="adp-calendar-view">
          <div class="adp-weekdays">
            ${WEEKDAYS_SHORT_TR.map((day, idx) => `
              <div class="adp-weekday ${idx >= 5 ? 'weekend' : ''}">${day}</div>
            `).join('')}
          </div>
          <div class="adp-days-grid"></div>
        </div>

        <!-- Hızlı Ay / Yıl Seçici Görünümü -->
        <div class="adp-picker-view">
          <div class="adp-year-selector">
            <button type="button" class="adp-nav-btn adp-year-prev">&#8249;</button>
            <span class="adp-year-current">2026</span>
            <button type="button" class="adp-nav-btn adp-year-next">&#8250;</button>
          </div>
          <div class="adp-months-grid">
            ${MONTHS_SHORT_TR.map((m, idx) => `
              <button type="button" class="adp-month-btn" data-month="${idx}">${m}</button>
            `).join('')}
          </div>
        </div>

        <!-- Alt Kısım (Footer) -->
        <div class="adp-footer">
          <button type="button" class="adp-footer-btn adp-btn-today">Bugün</button>
          <button type="button" class="adp-footer-btn adp-btn-clear">Temizle</button>
          <button type="button" class="adp-footer-btn adp-btn-close">Kapat</button>
        </div>
      `;

      document.body.appendChild(this.popup);

      // DOM Referansları
      this.titleBtn = this.popup.querySelector('.adp-title-btn');
      this.titleText = this.popup.querySelector('.adp-title-text');
      this.prevBtn = this.popup.querySelector('.adp-prev');
      this.nextBtn = this.popup.querySelector('.adp-next');
      this.calendarView = this.popup.querySelector('.adp-calendar-view');
      this.daysGrid = this.popup.querySelector('.adp-days-grid');
      this.pickerView = this.popup.querySelector('.adp-picker-view');
      this.yearCurrentEl = this.popup.querySelector('.adp-year-current');
      this.yearPrevBtn = this.popup.querySelector('.adp-year-prev');
      this.yearNextBtn = this.popup.querySelector('.adp-year-next');
      this.monthBtns = this.popup.querySelectorAll('.adp-month-btn');

      this.todayBtn = this.popup.querySelector('.adp-btn-today');
      this.clearBtn = this.popup.querySelector('.adp-btn-clear');
      this.closeBtn = this.popup.querySelector('.adp-btn-close');

      // Buton Dinleyicileri
      this.prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.changeMonth(-1);
      });

      this.nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.changeMonth(1);
      });

      this.titleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePickerView();
      });

      this.yearPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pickerYear--;
        this.yearCurrentEl.textContent = this.pickerYear;
      });

      this.yearNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pickerYear++;
        this.yearCurrentEl.textContent = this.pickerYear;
      });

      this.monthBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetMonth = parseInt(btn.getAttribute('data-month'), 10);
          this.currentViewDate = new Date(this.pickerYear, targetMonth, 1);
          this.isPickerView = false;
          this.pickerView.classList.remove('active');
          this.calendarView.style.display = 'block';
          this.titleBtn.classList.remove('expanded');
          this.render();
        });
      });

      // Alt Butonlar
      this.todayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.activeInput) {
          const today = new Date();
          this.selectDate(today);
        }
      });

      this.clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.activeInput) {
          this.activeInput._setCustomDate('', '', true);
          this.close();
        }
      });

      this.closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });

      // Tıklamanın popup dışına çıkmasını engelle
      this.popup.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      this.popup.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    bindGlobalEvents() {
      // Dışarı tıklayınca kapat
      document.addEventListener('mousedown', (e) => {
        if (!this.isOpen()) return;
        if (this.activeInput && (e.target === this.activeInput || this.activeInput.contains(e.target))) {
          return;
        }
        if (e.target.closest && e.target.closest('.adp-popup')) {
          return;
        }
        this.close();
      });

      // Escape tuşuyla kapat
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });

      // Pencere boyutu değiştiğinde pozisyonu güncelle
      window.addEventListener('resize', () => {
        if (this.isOpen()) this.position();
      });

      // Sayfa kaydırıldığında kapatma veya takip etme
      window.addEventListener('scroll', () => {
        if (this.isOpen()) this.position();
      }, true);
    }

    isOpen() {
      return this.popup.classList.contains('adp-active');
    }

    open(inputEl) {
      if (this.activeInput === inputEl && this.isOpen()) return;

      this.activeInput = inputEl;
      this.isPickerView = false;
      this.pickerView.classList.remove('active');
      this.calendarView.style.display = 'block';
      this.titleBtn.classList.remove('expanded');

      // Inputtaki tarihi veya bugünü baz al
      const curDate = parseAnyDate(inputEl._isoValue || inputEl.value);
      this.currentViewDate = curDate || new Date();
      this.pickerYear = this.currentViewDate.getFullYear();

      this.render();
      this.position();
      this.popup.classList.add('adp-active');
    }

    close() {
      if (!this.isOpen()) return;
      this.popup.classList.remove('adp-active');
      this.activeInput = null;
    }

    changeMonth(delta) {
      const year = this.currentViewDate.getFullYear();
      const month = this.currentViewDate.getMonth();
      this.currentViewDate = new Date(year, month + delta, 1);
      this.pickerYear = this.currentViewDate.getFullYear();
      this.render();
    }

    togglePickerView() {
      this.isPickerView = !this.isPickerView;
      if (this.isPickerView) {
        this.pickerYear = this.currentViewDate.getFullYear();
        this.yearCurrentEl.textContent = this.pickerYear;
        this.calendarView.style.display = 'none';
        this.pickerView.classList.add('active');
        this.titleBtn.classList.add('expanded');

        // Mevcut ayı vurgula
        const curMonth = this.currentViewDate.getMonth();
        this.monthBtns.forEach((btn, idx) => {
          btn.classList.toggle('selected', idx === curMonth);
        });
      } else {
        this.pickerView.classList.remove('active');
        this.calendarView.style.display = 'block';
        this.titleBtn.classList.remove('expanded');
      }
    }

    render() {
      const year = this.currentViewDate.getFullYear();
      const month = this.currentViewDate.getMonth();

      // Başlık metni
      this.titleText.textContent = `${MONTHS_TR[month]} ${year}`;

      // Seçili tarih kontrolü
      const selectedDate = this.activeInput ? parseAnyDate(this.activeInput._isoValue || this.activeInput.value) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Ayın ilk günü (Pazartesi: 0, Pazar: 6)
      const firstDay = new Date(year, month, 1);
      const startDayIndex = (firstDay.getDay() + 6) % 7;

      // Bu ayın toplam gün sayısı
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      // Önceki ayın toplam gün sayısı
      const daysInPrevMonth = new Date(year, month, 0).getDate();

      this.daysGrid.innerHTML = '';

      // 1. Önceki aydan taşan günler
      for (let i = startDayIndex - 1; i >= 0; i--) {
        const dayNum = daysInPrevMonth - i;
        const cellDate = new Date(year, month - 1, dayNum);
        this.createDayCell(cellDate, dayNum, 'other-month', selectedDate, today);
      }

      // 2. Mevcut ayın günleri
      for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const cellDate = new Date(year, month, dayNum);
        this.createDayCell(cellDate, dayNum, 'current-month', selectedDate, today);
      }

      // 3. Sonraki aydan taşan günler (Hücre sayısını 35 veya 42'ye tamamla)
      const totalCells = startDayIndex + daysInMonth;
      const remainingCells = totalCells <= 35 ? (35 - totalCells) : (42 - totalCells);

      for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
        const cellDate = new Date(year, month + 1, dayNum);
        this.createDayCell(cellDate, dayNum, 'other-month', selectedDate, today);
      }
    }

    createDayCell(cellDate, dayNum, extraClass, selectedDate, today) {
      const cell = document.createElement('div');
      cell.className = `adp-day-cell ${extraClass}`;
      cell.textContent = dayNum;

      cellDate.setHours(0, 0, 0, 0);

      // Bugün kontrolü
      if (cellDate.getTime() === today.getTime()) {
        cell.classList.add('today');
      }

      // Seçili gün kontrolü
      if (selectedDate) {
        const s = new Date(selectedDate);
        s.setHours(0, 0, 0, 0);
        if (cellDate.getTime() === s.getTime()) {
          cell.classList.add('selected');
        }
      }

      // TIKLAMA OLAYI: Bir tarih seçildiğinde OTOMATİK KAPAT!
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectDate(cellDate);
      });

      this.daysGrid.appendChild(cell);
    }

    selectDate(dateObj) {
      if (!this.activeInput) return;
      const isoStr = toISODate(dateObj);
      const displayStr = formatToTurkishDate(dateObj);

      // Inputa ata ve değişiklik olaylarını tetikle
      this.activeInput._setCustomDate(isoStr, displayStr, true);

      // KRİTİK: Bir tarih girildiğinde takvim penceresi OTOMATİK KAPANSIN!
      this.close();
    }

    position() {
      if (!this.activeInput) return;
      const rect = this.activeInput.getBoundingClientRect();
      const popupWidth = 300;
      const popupHeight = 340;

      let top = rect.bottom + 6;
      let left = rect.left;

      // Ekranın altına taşıyorsa üstüne yerleştir
      if (top + popupHeight > window.innerHeight && rect.top > popupHeight) {
        top = rect.top - popupHeight - 6;
      }

      // Ekranın sağına taşıyorsa sola kaydır
      if (left + popupWidth > window.innerWidth) {
        left = window.innerWidth - popupWidth - 12;
      }
      if (left < 10) left = 10;

      this.popup.style.top = `${top}px`;
      this.popup.style.left = `${left}px`;
    }
  }

  // Singleton Popup Nesnesi
  let globalPopup = null;
  function getPopup() {
    if (!globalPopup) {
      globalPopup = new DatePickerPopup();
    }
    return globalPopup;
  }

  // =========================================================================
  // INPUT ELEMANLARINI ZENGİNLEŞTİRME VE DESTEKLEME
  // =========================================================================

  function enhanceDateInput(input) {
    if (!input || input._hasDatePicker) return;
    input._hasDatePicker = true;

    // Orijinal tipi sakla
    const origType = input.getAttribute('type') || 'date';
    input.setAttribute('data-original-type', origType);

    // Tarayıcı native popup'ını devreden çıkarıp text yap
    input.type = 'text';
    input.classList.add('custom-datepicker-input');
    input.setAttribute('placeholder', 'GG.AA.YYYY');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('inputmode', 'numeric');

    // Başlangıç değerini tespit et ve Türk formatına çevir
    const initialRaw = input.getAttribute('value') || input.value || '';
    let initialIso = '';
    let initialDisplay = '';

    if (initialRaw) {
      const parsed = parseAnyDate(initialRaw);
      if (parsed) {
        initialIso = toISODate(parsed);
        initialDisplay = formatToTurkishDate(parsed);
      }
    }

    input._isoValue = initialIso;
    if (nativeValueDescriptor && nativeValueDescriptor.set) {
      nativeValueDescriptor.set.call(input, initialDisplay);
    } else {
      input.value = initialDisplay;
    }

    // Input içi özel değer atama metodu
    input._setCustomDate = function(iso, display, triggerEvents = false) {
      this._isoValue = iso || '';
      const finalDisplay = display || '';

      if (nativeValueDescriptor && nativeValueDescriptor.set) {
        nativeValueDescriptor.set.call(this, finalDisplay);
      } else {
        this.value = finalDisplay;
      }

      this.setAttribute('data-iso-value', this._isoValue);
      this.setAttribute('data-display-value', finalDisplay);

      if (triggerEvents) {
        this.dispatchEvent(new Event('input', { bubbles: true }));
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    // input.value property override:
    // Kod input.value okuduğunda standart ISO (YYYY-MM-DD) döner (veri uyumluluğu).
    // Kod input.value = ... dediğinde hem ISO hem GG.AA.YYYY kabul edilir ve ekranda GG.AA.YYYY gösterilir!
    Object.defineProperty(input, 'value', {
      get() {
        if (this._isoValue) return this._isoValue;
        // Eğer kullanıcı elle bir şey yazmışsa onu ISO yapmayı dene
        const raw = nativeValueDescriptor && nativeValueDescriptor.get ? nativeValueDescriptor.get.call(this) : '';
        if (raw) {
          const parsed = parseAnyDate(raw);
          if (parsed) {
            this._isoValue = toISODate(parsed);
            return this._isoValue;
          }
        }
        return '';
      },
      set(val) {
        if (!val) {
          this._setCustomDate('', '', false);
          return;
        }
        const parsed = parseAnyDate(val);
        if (parsed) {
          const iso = toISODate(parsed);
          const display = formatToTurkishDate(parsed);
          this._setCustomDate(iso, display, false);
        } else {
          // Tanımlanamayan değerse doğrudan yaz
          this._isoValue = '';
          if (nativeValueDescriptor && nativeValueDescriptor.set) {
            nativeValueDescriptor.set.call(this, val);
          }
        }
      },
      configurable: true
    });

    // Ek Özellikler
    Object.defineProperty(input, 'displayValue', {
      get() {
        return nativeValueDescriptor && nativeValueDescriptor.get ? nativeValueDescriptor.get.call(this) : '';
      },
      configurable: true
    });

    Object.defineProperty(input, 'isoValue', {
      get() {
        return this.value;
      },
      configurable: true
    });

    // 1. TIKLAMA / ODAKLANMA: Takvim penceresini aç
    input.addEventListener('click', (e) => {
      e.stopPropagation();
      getPopup().open(input);
    });

    input.addEventListener('focus', () => {
      getPopup().open(input);
    });

    // 2. KLAVYE GİRİŞİ: GG.AA.YYYY esasına göre akıllı maske
    input.addEventListener('input', (e) => {
      let rawVal = nativeValueDescriptor.get.call(input);
      const isDeleting = (e && (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward'));

      // Sadece rakamları al
      const digits = rawVal.replace(/\D/g, '');
      let formatted = '';

      if (digits.length > 0) {
        formatted = digits.slice(0, 2);
        if (digits.length >= 3) {
          formatted += '.' + digits.slice(2, 4);
        } else if (digits.length === 2 && !isDeleting) {
          formatted += '.';
        }

        if (digits.length >= 5) {
          formatted += '.' + digits.slice(4, 8);
        } else if (digits.length === 4 && !isDeleting) {
          formatted += '.';
        }
      }

      nativeValueDescriptor.set.call(input, formatted);

      // 8 hane tamamlandıysa (GG.AA.YYYY) ISO değerini güncelle
      if (digits.length === 8) {
        const parsed = parseAnyDate(formatted);
        if (parsed) {
          input._isoValue = toISODate(parsed);
          input.setAttribute('data-iso-value', input._isoValue);
          input.setAttribute('data-display-value', formatted);

          // Takvim açıksa o tarihe güncelle
          if (getPopup().isOpen()) {
            getPopup().currentViewDate = parsed;
            getPopup().render();
          }
        }
      } else {
        input._isoValue = '';
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        getPopup().close();
        input.blur();
      }
    });
  }

  // =========================================================================
  // OTOMATİK TARAMA VE SAYFA BAŞLATMA
  // =========================================================================

  function initAllDatePickers() {
    const selector = 'input[type="date"], input[data-datepicker="true"], input.custom-datepicker';
    document.querySelectorAll(selector).forEach(enhanceDateInput);
  }

  // Sayfa hazır olduğunda çalıştır
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllDatePickers);
  } else {
    initAllDatePickers();
  }

  // Dinamik olarak DOM'a eklenen inputlar için MutationObserver
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      initAllDatePickers();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Global API
  window.AppDatePicker = {
    initAll: initAllDatePickers,
    enhance: enhanceDateInput,
    open: (input) => getPopup().open(input),
    close: () => getPopup().close()
  };
  window.initDatePicker = enhanceDateInput;

})();
