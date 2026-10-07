/**
 * Sınıf Asistanı - Yapay Zeka Destekli Günlük Plan Modülü (daily-plans.js)
 * MEB ve Türkiye Yüzyılı Maarif Modeli standartlarında günlük ders planı oluşturucu,
 * haftalık ders programı ve yıllık plan kazanımları senkronizasyon motoru.
 */

(() => {
  let toastCallbackFn = null;

  // Modül Yerel Durumu
  let currentDailyPlan = null;
  let activeViewMode = 'create'; // 'create' | 'archive'
  let isGenerating = false;
  let abortController = null;

  // DOM Elemanları Önbelleği
  let dom = {};

  const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  function getDOM() {
    return {
      container: document.getElementById('tools-daily-plan-view'),
      btnModeCreate: document.getElementById('btn-daily-mode-create'),
      btnModeArchive: document.getElementById('btn-daily-mode-archive'),
      badgeArchiveCount: document.getElementById('daily-archive-count-badge'),
      sectionCreate: document.getElementById('daily-plan-create-section'),
      sectionArchive: document.getElementById('daily-plan-archive-section'),

      // Form
      inputDate: document.getElementById('daily-plan-date-input'),
      scheduleChipsContainer: document.getElementById('daily-plan-schedule-chips'),
      selectCourse: document.getElementById('daily-plan-course-select'),
      inputClass: document.getElementById('daily-plan-class-input'),
      selectHours: document.getElementById('daily-plan-hours-select'),
      inputTeacher: document.getElementById('daily-plan-teacher-input'),
      inputSchool: document.getElementById('daily-plan-school-input'),

      // Kazanım & Konu
      noticeYearlyMatch: document.getElementById('daily-plan-yearly-match-notice'),
      btnFetchYearly: document.getElementById('btn-daily-fetch-yearly'),
      inputUnit: document.getElementById('daily-plan-unit-input'),
      inputTopic: document.getElementById('daily-plan-topic-input'),
      inputOutcomes: document.getElementById('daily-plan-outcomes-input'),

      // AI Tercihleri
      selectMethodStyle: document.getElementById('daily-plan-method-style'),
      inputCustomPrompt: document.getElementById('daily-plan-custom-prompt'),
      btnGenerate: document.getElementById('btn-daily-generate'),
      loadingBox: document.getElementById('daily-generate-loading'),
      btnCancelGenerate: document.getElementById('btn-daily-cancel-generate'),

      // Sonuç & Editör
      resultCard: document.getElementById('daily-plan-result-card'),
      emptyState: document.getElementById('daily-plan-empty-state'),
      activePlanEditor: document.getElementById('daily-plan-active-editor'),
      btnSave: document.getElementById('btn-daily-save-plan'),
      btnPrint: document.getElementById('btn-daily-print-plan'),
      btnCopy: document.getElementById('btn-daily-copy-plan'),
      selectRevision: document.getElementById('daily-plan-revision-select'),
      planSheet: document.getElementById('daily-plan-sheet'),

      // Arşiv
      archiveSearch: document.getElementById('daily-archive-search-input'),
      archiveCourseFilter: document.getElementById('daily-archive-course-filter'),
      archiveListContainer: document.getElementById('daily-archive-list-container')
    };
  }

  // Modülü Başlat
  function setupDailyPlansTool(toastCallback) {
    toastCallbackFn = toastCallback;
    dom = getDOM();
    if (!dom.container) return;

    bindEvents();
    initDefaults();
  }

  // Günlük Plan Sekmesine Geçiş Yapıldığında Çağrılır
  function openDailyPlanView() {
    dom = getDOM();
    if (!dom.container) return;

    dom.container.style.display = 'block';
    initDefaults();
    updateArchiveBadgeCount();

    if (activeViewMode === 'archive') {
      renderArchiveList();
    } else {
      populateCoursesDropdown();
      detectScheduleAndYearlyPlan();
    }

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Olay Dinleyicileri
  function bindEvents() {
    if (!dom.container) return;

    // Mod Değiştirme (Oluştur / Arşiv)
    if (dom.btnModeCreate) {
      dom.btnModeCreate.addEventListener('click', () => switchViewMode('create'));
    }
    if (dom.btnModeArchive) {
      dom.btnModeArchive.addEventListener('click', () => switchViewMode('archive'));
    }

    // Tarih Değişimi
    if (dom.inputDate) {
      dom.inputDate.addEventListener('change', () => {
        detectScheduleAndYearlyPlan();
      });
    }

    // Ders Seçimi Değişimi
    if (dom.selectCourse) {
      dom.selectCourse.addEventListener('change', () => {
        onCourseSelectionChanged();
      });
    }

    // Yıllık Plandan Getir Butonu
    if (dom.btnFetchYearly) {
      dom.btnFetchYearly.addEventListener('click', () => {
        fetchYearlyPlanOutcomes(true);
      });
    }

    // Plan Üret Butonu
    if (dom.btnGenerate) {
      dom.btnGenerate.addEventListener('click', generateDailyPlanWithAI);
    }

    // İptal Butonu
    if (dom.btnCancelGenerate) {
      dom.btnCancelGenerate.addEventListener('click', cancelAIGeneration);
    }

    // Kaydet Butonu
    if (dom.btnSave) {
      dom.btnSave.addEventListener('click', saveCurrentDailyPlan);
    }

    // Yazdır Butonu
    if (dom.btnPrint) {
      dom.btnPrint.addEventListener('click', printCurrentDailyPlan);
    }

    // Kopyala Butonu
    if (dom.btnCopy) {
      dom.btnCopy.addEventListener('click', copyDailyPlanToClipboard);
    }

    // Hızlı Revizyon Seçimi
    if (dom.selectRevision) {
      dom.selectRevision.addEventListener('change', handleQuickRevision);
    }

    // Arşiv Arama ve Filtre
    if (dom.archiveSearch) {
      dom.archiveSearch.addEventListener('input', () => renderArchiveList());
    }
    if (dom.archiveCourseFilter) {
      dom.archiveCourseFilter.addEventListener('change', () => renderArchiveList());
    }
  }

  function initDefaults() {
    dom = getDOM();
    if (!dom.inputDate) return;

    // Varsayılan bugünün tarihi
    if (!dom.inputDate.value) {
      const today = new Date();
      dom.inputDate.value = formatISODate(today);
    }

    // Profildeki öğretmen ve okul adını çek
    const state = window.stateManager ? window.stateManager.loadState() : {};
    if (dom.inputTeacher && !dom.inputTeacher.value) {
      dom.inputTeacher.value = state.teacherName || state.userProfile?.name || 'Ders Öğretmeni';
    }
    if (dom.inputSchool && !dom.inputSchool.value) {
      dom.inputSchool.value = state.schoolName || state.userProfile?.school || 'T.C. MİLLÎ EĞİTİM BAKANLIĞI';
    }
    if (dom.inputClass && !dom.inputClass.value) {
      dom.inputClass.value = state.className || '4-A';
    }
  }

  function switchViewMode(mode) {
    activeViewMode = mode;
    dom = getDOM();
    if (dom.btnModeCreate) dom.btnModeCreate.classList.toggle('active', mode === 'create');
    if (dom.btnModeArchive) dom.btnModeArchive.classList.toggle('active', mode === 'archive');

    if (dom.sectionCreate) dom.sectionCreate.style.display = mode === 'create' ? 'grid' : 'none';
    if (dom.sectionArchive) dom.sectionArchive.style.display = mode === 'archive' ? 'block' : 'none';

    if (mode === 'archive') {
      renderArchiveList();
    } else {
      populateCoursesDropdown();
      detectScheduleAndYearlyPlan();
    }

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Ders Seçeneklerini Doldur
  function populateCoursesDropdown() {
    dom = getDOM();
    if (!dom.selectCourse) return;

    const currentVal = dom.selectCourse.value;
    const state = window.stateManager ? window.stateManager.loadState() : {};
    const definedLessons = state.definedLessons || [];
    const yearlyPlans = state.plans || [];

    const coursesMap = new Map();

    // 1. Tanımlı dersler
    definedLessons.forEach(l => {
      if (l.name) coursesMap.set(l.name.trim(), l.name.trim());
    });

    // 2. Yıllık planlardaki dersler
    yearlyPlans.forEach(p => {
      const name = p.courseName || p.title;
      if (name) coursesMap.set(name.trim(), name.trim());
    });

    // Standart temel dersler (eksikse)
    ['Türkçe', 'Matematik', 'Hayat Bilgisi', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü ve Ahlak Bilgisi'].forEach(c => {
      if (!coursesMap.has(c)) coursesMap.set(c, c);
    });

    let html = `<option value="">-- Ders Seçiniz veya Yazınız --</option>`;
    coursesMap.forEach((name) => {
      html += `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`;
    });

    dom.selectCourse.innerHTML = html;
    if (currentVal && coursesMap.has(currentVal)) {
      dom.selectCourse.value = currentVal;
    }
  }

  // Tarih ve Ders Programı Tespiti
  function detectScheduleAndYearlyPlan() {
    dom = getDOM();
    if (!dom.inputDate || !dom.inputDate.value) return;

    const selectedDate = new Date(dom.inputDate.value + 'T00:00:00');
    if (isNaN(selectedDate.getTime())) return;

    const dayIndex = selectedDate.getDay(); // 0: Pazar, 1: Pzt, ..., 5: Cuma, 6: Cts
    const state = window.stateManager ? window.stateManager.loadState() : {};
    const scheduleGrid = state.scheduleGrid || {};
    const scheduleTimes = state.scheduleTimes || {};
    const definedLessons = state.definedLessons || [];

    // Hafta sonu ise bilgilendir
    if (dayIndex === 0 || dayIndex === 6) {
      if (dom.scheduleChipsContainer) {
        dom.scheduleChipsContainer.innerHTML = `
          <div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 0.25rem 0;">
            📅 Seçilen gün (${DAYS_TR[dayIndex]}) hafta sonudur. Dilerseniz ders adını aşağıdan manuel seçebilirsiniz.
          </div>
        `;
      }
      fetchYearlyPlanOutcomes(false);
      return;
    }

    // O güne ait ders periyotlarını topla: keys like `${dayIndex}-p1`, `${dayIndex}-p2`
    const dayLessons = [];
    for (let p = 1; p <= 8; p++) {
      const key = `${dayIndex}-p${p}`;
      const lessonId = scheduleGrid[key];
      if (lessonId) {
        const foundLesson = definedLessons.find(l => l.id === lessonId);
        const lessonName = foundLesson ? foundLesson.name : lessonId;
        const timeSlot = scheduleTimes[`p${p}`] ? `${scheduleTimes[`p${p}`].start}-${scheduleTimes[`p${p}`].end}` : `${p}. Ders`;
        dayLessons.push({
          periodNum: p,
          periodKey: `p${p}`,
          lessonId,
          lessonName,
          timeSlot,
          color: foundLesson?.color || '#4f46e5'
        });
      }
    }

    // Çipleri oluştur (Ardışık blok dersleri birleştir)
    if (dom.scheduleChipsContainer) {
      if (dayLessons.length === 0) {
        dom.scheduleChipsContainer.innerHTML = `
          <div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 0.25rem 0;">
            ℹ️ ${DAYS_TR[dayIndex]} günü için ders programında tanımlı ders bulunamadı. Aşağıdan serbestçe ders seçebilirsiniz.
          </div>
        `;
      } else {
        // Blok dersleri grupla
        const grouped = [];
        let currentGroup = null;

        dayLessons.forEach(item => {
          if (currentGroup && currentGroup.lessonName === item.lessonName && item.periodNum === currentGroup.endPeriod + 1) {
            currentGroup.endPeriod = item.periodNum;
            currentGroup.count++;
            currentGroup.endTime = item.timeSlot.split('-')[1] || item.timeSlot;
          } else {
            if (currentGroup) grouped.push(currentGroup);
            currentGroup = {
              lessonName: item.lessonName,
              startPeriod: item.periodNum,
              endPeriod: item.periodNum,
              count: 1,
              startTime: item.timeSlot.split('-')[0] || item.timeSlot,
              endTime: item.timeSlot.split('-')[1] || item.timeSlot,
              color: item.color
            };
          }
        });
        if (currentGroup) grouped.push(currentGroup);

        dom.scheduleChipsContainer.innerHTML = `
          <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center;">
            <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); margin-right: 0.25rem;">
              ${DAYS_TR[dayIndex]} Dersleri:
            </span>
            ${grouped.map(g => {
              const label = g.count > 1 
                ? `${g.startPeriod}-${g.endPeriod}. Ders (${g.count} Saat): ${g.lessonName}`
                : `${g.startPeriod}. Ders: ${g.lessonName}`;
              const hoursValue = g.count >= 3 ? '3' : (g.count === 2 ? '2' : '1');
              return `
                <button type="button" class="btn-daily-schedule-chip" 
                  data-lesson="${escapeHtml(g.lessonName)}" 
                  data-hours="${hoursValue}"
                  data-timerange="${escapeHtml(g.startTime + ' - ' + g.endTime)}"
                  style="font-size: 0.78rem; padding: 0.3rem 0.65rem; border-radius: 20px; border: 1px solid var(--border-color); background: var(--bg-primary); cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; transition: all 0.2s ease;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${g.color}; display: inline-block;"></span>
                  <strong>${escapeHtml(label)}</strong>
                  <span style="font-size: 0.7rem; color: var(--text-muted);">(${g.startTime}-${g.endTime})</span>
                </button>
              `;
            }).join('')}
          </div>
        `;

        // Çip tıklama olayları
        dom.scheduleChipsContainer.querySelectorAll('.btn-daily-schedule-chip').forEach(btn => {
          btn.addEventListener('click', () => {
            const lesson = btn.dataset.lesson;
            const hours = btn.dataset.hours;
            if (dom.selectCourse) {
              dom.selectCourse.value = lesson;
              if (!dom.selectCourse.value) {
                // Eğer select'te yoksa geçici ekle ve seç
                const opt = new Option(lesson, lesson, true, true);
                dom.selectCourse.add(opt);
              }
            }
            if (dom.selectHours) {
              dom.selectHours.value = hours;
            }
            // Aktif çipi vurgula
            dom.scheduleChipsContainer.querySelectorAll('.btn-daily-schedule-chip').forEach(b => {
              b.style.borderColor = 'var(--border-color)';
              b.style.backgroundColor = 'var(--bg-primary)';
            });
            btn.style.borderColor = 'var(--primary)';
            btn.style.backgroundColor = 'rgba(79, 70, 229, 0.08)';

            onCourseSelectionChanged();
          });
        });

        // İlk dersi otomatik seç (eğer ders seçilmemişse)
        if (grouped.length > 0 && dom.selectCourse && !dom.selectCourse.value) {
          const first = grouped[0];
          dom.selectCourse.value = first.lessonName;
          if (dom.selectHours) dom.selectHours.value = first.count >= 2 ? '2' : '1';
        }
      }
    }

    fetchYearlyPlanOutcomes(false);
  }

  function onCourseSelectionChanged() {
    fetchYearlyPlanOutcomes(false);
  }

  // Yıllık Plandan Kazanımları Çek
  function fetchYearlyPlanOutcomes(showToastOnFail = false) {
    dom = getDOM();
    if (!dom.inputDate || !dom.inputDate.value) return;

    const selectedCourse = dom.selectCourse ? dom.selectCourse.value.trim() : '';
    if (!selectedCourse) {
      if (dom.noticeYearlyMatch) dom.noticeYearlyMatch.style.display = 'none';
      return;
    }

    const selectedDate = new Date(dom.inputDate.value + 'T00:00:00');
    const isoWeek = typeof window.getISOWeek === 'function' ? window.getISOWeek(selectedDate) : '';

    const state = window.stateManager ? window.stateManager.loadState() : {};
    const plans = state.plans || [];

    // Seçilen derse en uygun yıllık planı bul
    const matchingPlan = plans.find(p => {
      const pName = (p.courseName || p.title || '').toLowerCase();
      const sName = selectedCourse.toLowerCase();
      return pName.includes(sName) || sName.includes(pName);
    });

    if (!matchingPlan) {
      if (dom.noticeYearlyMatch) dom.noticeYearlyMatch.style.display = 'none';
      if (showToastOnFail && toastCallbackFn) {
        toastCallbackFn(`"${selectedCourse}" dersine ait kayıtlı yıllık plan bulunamadı.`, 'info');
      }
      return;
    }

    const schedule = matchingPlan.weeklySchedule || matchingPlan.weeks || [];
    if (schedule.length === 0) {
      if (dom.noticeYearlyMatch) dom.noticeYearlyMatch.style.display = 'none';
      return;
    }

    // Tarihe veya ISO haftasına göre haftayı bul
    let matchedWeek = null;
    if (isoWeek) {
      matchedWeek = schedule.find(w => w.isoWeek === isoWeek);
    }

    if (!matchedWeek) {
      // Tarih aralığına göre bul
      const timeMs = selectedDate.getTime();
      matchedWeek = schedule.find(w => {
        if (!w.startDate || !w.endDate) return false;
        const s = new Date(w.startDate).getTime();
        const e = new Date(w.endDate).getTime();
        return timeMs >= s && timeMs <= e;
      });
    }

    // Bulunamadıysa ilk tamamlanmamış haftayı veya ilk haftayı fallback al
    if (!matchedWeek) {
      matchedWeek = schedule.find(w => !w.isCompleted) || schedule[0];
    }

    if (matchedWeek) {
      if (dom.inputUnit) dom.inputUnit.value = matchedWeek.unitName || matchedWeek.unitNo || '';
      if (dom.inputTopic) dom.inputTopic.value = matchedWeek.topics || '';
      if (dom.inputOutcomes) dom.inputOutcomes.value = matchedWeek.learningOutcomes || '';

      if (dom.noticeYearlyMatch) {
        dom.noticeYearlyMatch.style.display = 'flex';
        dom.noticeYearlyMatch.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.5rem; color: #10b981; font-size: 0.8rem; font-weight: 600;">
            <i data-lucide="check-circle-2" style="width: 16px; height: 16px;"></i>
            <span>Yıllık Plandan Aktarıldı: <strong>${escapeHtml(matchingPlan.title || matchingPlan.courseName)}</strong> (${escapeHtml(matchedWeek.weekLabel || matchedWeek.weekNumber + '. Hafta')})</span>
          </div>
        `;
        if (window.safeCreateIcons) window.safeCreateIcons();
      }

      if (showToastOnFail && toastCallbackFn) {
        toastCallbackFn('Kazanımlar yıllık plandan başarıyla çekildi.', 'success');
      }
    }
  }

  // Yapay Zeka ile Günlük Plan Üretimi
  async function generateDailyPlanWithAI() {
    dom = getDOM();
    if (isGenerating) return;

    const course = dom.selectCourse ? dom.selectCourse.value.trim() : '';
    const className = dom.inputClass ? dom.inputClass.value.trim() : 'Sınıf';
    const dateStr = dom.inputDate ? dom.inputDate.value : formatISODate(new Date());
    const hoursCount = dom.selectHours ? dom.selectHours.value : '2';
    const teacherName = dom.inputTeacher ? dom.inputTeacher.value.trim() : 'Ders Öğretmeni';
    const schoolName = dom.inputSchool ? dom.inputSchool.value.trim() : 'T.C. MİLLÎ EĞİTİM BAKANLIĞI';
    const unit = dom.inputUnit ? dom.inputUnit.value.trim() : '';
    const topic = dom.inputTopic ? dom.inputTopic.value.trim() : '';
    const outcomes = dom.inputOutcomes ? dom.inputOutcomes.value.trim() : '';
    const methodStyle = dom.selectMethodStyle ? dom.selectMethodStyle.value : 'Karma & Etkileşimli';
    const customPrompt = dom.inputCustomPrompt ? dom.inputCustomPrompt.value.trim() : '';

    if (!course) {
      if (toastCallbackFn) toastCallbackFn('Lütfen bir ders adı seçiniz veya giriniz.', 'warning');
      if (dom.selectCourse) dom.selectCourse.focus();
      return;
    }

    if (!outcomes && !topic) {
      if (toastCallbackFn) toastCallbackFn('Lütfen dersin konusunu veya kazanımlarını belirtiniz.', 'warning');
      if (dom.inputTopic) dom.inputTopic.focus();
      return;
    }

    // API Anahtarını kontrol et
    if (typeof window.ensureGeminiApiKey === 'function') {
      const hasKey = await window.ensureGeminiApiKey({
        featureTitle: 'Yapay Zeka Destekli Günlük Plan',
        featureDescription: 'MEB ve Türkiye Yüzyılı Maarif Modeline uygun günlük ders planı üretmek için Google Gemini API anahtarı gereklidir.'
      });
      if (!hasKey) return;
    } else if (!window.callGeminiAPI) {
      if (toastCallbackFn) toastCallbackFn('Gemini API bağlantısı bulunamadı.', 'danger');
      return;
    }

    // Yükleniyor durumunu aç
    setGeneratingState(true);

    const totalMinutes = parseInt(hoursCount, 10) * 40;
    const durationLabel = `${hoursCount} Ders Saati (${totalMinutes} Dakika)`;

    const promptText = `Sen 20 yıllık deneyime sahip uzman bir MEB ve Program Geliştirme müfettişisin.
Aşağıda verilen bilgilere dayanarak, Türkiye Yüzyılı Maarif Modeli ve MEB Talim Terbiye Kurulu standartlarına tam uyumlu,
öğretmenin sınıfta adım adım uygulayabileceği çok zengin, pedagojik ve somut bir GÜNLÜK DERS PLANI hazırla.

DERS BİLGİLERİ:
- Okul Adı: ${schoolName}
- Ders: ${course}
- Sınıf Düzeyi: ${className}
- Tarih: ${dateStr}
- Ders Süresi: ${durationLabel}
- Ders Öğretmeni: ${teacherName}
- Ünite Adı: ${unit || 'Genel Ünite'}
- Konu: ${topic || course}
- Öğrenme Çıktıları / Kazanımlar: ${outcomes || topic}
- Tercih Edilen Ders İşleniş Yaklaşımı: ${methodStyle}
${customPrompt ? `- Öğretmenin Özel İstekleri / Notu: ${customPrompt}` : ''}

İÇERİK VE PEDAGOJİK KURALLAR:
1. Yüzeysel, teorik veya genelgeçer cümleler KULLANMA. Öğretmenin sınıfta tahtaya yazacağı soruyu, öğrencilere yönelteceği yönergeyi, dağıtılacak materyalleri bizzat yaz.
2. Ders Süreci (${totalMinutes} dakika) net sürelere bölünmelidir:
   - Giriş / Dikkati Çekme ve Güdüleme: (Merak uyandırıcı hikaye, günlük hayat örneği, soru veya mini bilmece)
   - Gelişme / Keşfetme ve Açıklama: (Öğrenci merkezli etkinlikler, grup çalışması, canlandırma veya uygulama adımları)
   - Sonuç / Özetleme ve Derinleştirme: (Temel çıkarımlar, öğrenci özetleri, çıkış bileti)
3. Ölçme ve Değerlendirme bölümünde derste anında sorulabilecek 2-3 adet açık uçlu veya kavrayıcı soru örneği ver.
4. Farklılaştırma bölümünde hızlı kavrayanlar için zenginleştirme, desteğe ihtiyaç duyanlar için uyarlama önerisi ekle.

Lütfen yanıtını SADECE aşağıdaki JSON şemasına uygun geçerli bir JSON olarak ver (hiçbir markdown kod bloğu, \`\`\`json veya fazladan açıklama metni ekleme):
{
  "methods": "Kullanılan yöntem ve teknikler (örn: Soru-cevap, beyin fırtınası, istasyon tekniği, rol oynama)",
  "materials": "Araç, gereç ve materyaller (örn: Akıllı tahta, ders kitabı s. 45, çalışma kağıdı, örnek materyaller)",
  "concepts": "Temel kavram ve semboller",
  "introduction": "Dikkati Çekme, Güdüleme ve Hedeften Haberdar Etme aşaması (Detaylı, diyaloglu ve somut anlatım, yaklaşık 5-10 dk)",
  "development": "Dersin İşlenişi, Keşfetme, Etkinlikler ve Öğrenme Yaşantıları (Adım adım, zaman planlı ve somut etkinlikler, yaklaşık 25-50 dk)",
  "conclusion": "Özetleme, Pekiştirme ve Kapanış (Çıkış bileti, günün özeti, yaklaşık 5-10 dk)",
  "assessment": "Ölçme ve Değerlendirme (Öğrenme düzeyini belirleyici soru örnekleri, kontrol listesi veya gözlem kriterleri)",
  "differentiation": "Farklılaştırılmış Öğretim ve Bireysel Gelişim (Hızlı öğrenenler için zenginleştirme, desteğe ihtiyaç duyanlar için uyarlama)",
  "homework": "Bireysel Öğrenme Etkinliği / Ödev Önerisi (Günlük hayatla ilişkili, pekiştirici mini görev)"
}`;

    try {
      let rawRes = '';
      if (typeof window.callGeminiAPI === 'function') {
        rawRes = await window.callGeminiAPI(promptText, {
          json: true,
          temperature: 0.35
        });
      }

      if (!rawRes) {
        throw new Error('Yapay zekadan boş yanıt döndü.');
      }

      const planContent = parseAIJsonResponse(rawRes);

      // Güncel plan nesnesini oluştur
      currentDailyPlan = {
        id: 'dp_' + Date.now(),
        date: dateStr,
        dayOfWeek: new Date(dateStr + 'T00:00:00').getDay(),
        courseName: course,
        className: className,
        lessonHours: durationLabel,
        teacherName: teacherName,
        schoolName: schoolName,
        unitName: unit,
        topic: topic,
        learningOutcomes: outcomes,
        methodStyle: methodStyle,
        planData: planContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Sonucu render et
      renderDailyPlanSheet(currentDailyPlan);

      if (toastCallbackFn) {
        toastCallbackFn('Günlük plan başarıyla oluşturuldu! İnceleyebilir ve düzenleyebilirsiniz.', 'success');
      }

      // Otomatik kaydet
      if (window.stateManager && typeof window.stateManager.saveDailyPlan === 'function') {
        window.stateManager.saveDailyPlan(currentDailyPlan);
        updateArchiveBadgeCount();
        try {
          await syncDailyPlanToDocumentsStorage(currentDailyPlan);
        } catch (e) {
          console.warn('Evrak deposuna senkronizasyon uyarısı:', e);
        }
      }

    } catch (err) {
      console.error('Günlük plan üretme hatası:', err);
      if (err.message !== 'CANCELLED') {
        if (toastCallbackFn) {
          toastCallbackFn(`Günlük plan oluşturulurken hata: ${err.message || err}`, 'danger');
        }
      }
    } finally {
      setGeneratingState(false);
    }
  }

  function cancelAIGeneration() {
    if (abortController) {
      abortController.abort();
    }
    setGeneratingState(false);
    if (toastCallbackFn) toastCallbackFn('İşlem iptal edildi.', 'info');
  }

  function setGeneratingState(loading) {
    isGenerating = loading;
    dom = getDOM();
    if (dom.loadingBox) dom.loadingBox.style.display = loading ? 'flex' : 'none';
    if (dom.btnGenerate) {
      dom.btnGenerate.disabled = loading;
      dom.btnGenerate.style.opacity = loading ? '0.6' : '1';
    }
  }

  function parseAIJsonResponse(raw) {
    if (typeof raw === 'object' && raw !== null) return raw;
    let clean = String(raw).trim();
    clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

    try {
      return JSON.parse(clean);
    } catch (e) {
      // JSON tamiri
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      }
      throw new Error('Yapay zeka yanıtı geçerli JSON formatında değil.');
    }
  }

  // Plan Şablonunu Ekrana Bas
  function renderDailyPlanSheet(plan) {
    dom = getDOM();
    if (!dom.planSheet) return;

    if (!plan || !plan.planData) {
      if (dom.emptyState) dom.emptyState.style.display = 'block';
      if (dom.activePlanEditor) dom.activePlanEditor.style.display = 'none';
      return;
    }

    if (dom.emptyState) dom.emptyState.style.display = 'none';
    if (dom.activePlanEditor) dom.activePlanEditor.style.display = 'block';

    const p = plan.planData;
    const formattedDate = formatTurkishDate(plan.date);

    dom.planSheet.innerHTML = `
      <!-- A4 MEB Standart Günlük Ders Planı -->
      <div class="daily-plan-print-page" id="daily-plan-print-content">
        
        <!-- Resmi Başlık ve Antet -->
        <div class="dp-header-table">
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px;">
            <h4 style="margin: 0; font-size: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(plan.schoolName || 'T.C. MİLLÎ EĞİTİM BAKANLIĞI')}</h4>
            <h5 style="margin: 2px 0 0 0; font-size: 0.9rem; font-weight: 700;">GÜNLÜK DERS PLANI</h5>
          </div>

          <table class="dp-meta-table">
            <tr>
              <td style="width: 18%; font-weight: 700;">Dersin Adı:</td>
              <td style="width: 32%;">${escapeHtml(plan.courseName)}</td>
              <td style="width: 18%; font-weight: 700;">Tarih:</td>
              <td style="width: 32%;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Sınıf / Şube:</td>
              <td>${escapeHtml(plan.className)}</td>
              <td style="font-weight: 700;">Ders Saati / Süre:</td>
              <td>${escapeHtml(plan.lessonHours)}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Ders Öğretmeni:</td>
              <td>${escapeHtml(plan.teacherName)}</td>
              <td style="font-weight: 700;">Yaklaşım / Model:</td>
              <td>Türkiye Yüzyılı Maarif Modeli (${escapeHtml(plan.methodStyle || 'Etkileşimli')})</td>
            </tr>
          </table>
        </div>

        <!-- BÖLÜM 1: DERS VE KAZANIM BİLGİLERİ -->
        <div class="dp-section">
          <div class="dp-section-title">BÖLÜM I: DERS VE KONU BİLGİLERİ</div>
          <table class="dp-content-table">
            <tr>
              <td style="width: 25%; font-weight: 700;">Ünite / Tema:</td>
              <td contenteditable="true" data-field="unitName" class="dp-editable-cell">${escapeHtml(plan.unitName || 'Genel')}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Konu:</td>
              <td contenteditable="true" data-field="topic" class="dp-editable-cell">${escapeHtml(plan.topic || plan.courseName)}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Öğrenme Çıktıları / Kazanımlar:</td>
              <td contenteditable="true" data-field="learningOutcomes" class="dp-editable-cell" style="white-space: pre-wrap;">${escapeHtml(plan.learningOutcomes || '')}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Yöntem ve Teknikler:</td>
              <td contenteditable="true" data-field="planData.methods" class="dp-editable-cell">${escapeHtml(p.methods || '')}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Araç, Gereç ve Materyaller:</td>
              <td contenteditable="true" data-field="planData.materials" class="dp-editable-cell">${escapeHtml(p.materials || '')}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Temel Kavramlar:</td>
              <td contenteditable="true" data-field="planData.concepts" class="dp-editable-cell">${escapeHtml(p.concepts || '')}</td>
            </tr>
          </table>
        </div>

        <!-- BÖLÜM 2: ÖĞRENME-ÖĞRETME SÜRECİ -->
        <div class="dp-section">
          <div class="dp-section-title">BÖLÜM II: ÖĞRENME - ÖĞRETME SÜRECİ (DERSİN İŞLENİŞİ)</div>
          
          <div class="dp-substep">
            <div class="dp-substep-title">A) Dikkati Çekme, Güdüleme ve Hedeften Haberdar Etme (Giriş: ~5-10 Dk)</div>
            <div contenteditable="true" data-field="planData.introduction" class="dp-editable-block">${formatRichParagraphs(p.introduction)}</div>
          </div>

          <div class="dp-substep">
            <div class="dp-substep-title">B) Keşfetme, Açıklama ve Etkinlikler (Gelişme: ~25-50 Dk)</div>
            <div contenteditable="true" data-field="planData.development" class="dp-editable-block">${formatRichParagraphs(p.development)}</div>
          </div>

          <div class="dp-substep">
            <div class="dp-substep-title">C) Özetleme, Pekiştirme ve Kapanış (Sonuç: ~5-10 Dk)</div>
            <div contenteditable="true" data-field="planData.conclusion" class="dp-editable-block">${formatRichParagraphs(p.conclusion)}</div>
          </div>
        </div>

        <!-- BÖLÜM 3: ÖLÇME, DEĞERLENDİRME VE FARKLILAŞTIRMA -->
        <div class="dp-section">
          <div class="dp-section-title">BÖLÜM III: ÖLÇME, DEĞERLENDİRME VE FARKLILAŞTIRMA</div>
          <table class="dp-content-table">
            <tr>
              <td style="width: 25%; font-weight: 700;">Biçimlendirici Değerlendirme & Sorular:</td>
              <td contenteditable="true" data-field="planData.assessment" class="dp-editable-cell">${formatRichParagraphs(p.assessment)}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Farklılaştırılmış Öğretim (Destek / Zenginleştirme):</td>
              <td contenteditable="true" data-field="planData.differentiation" class="dp-editable-cell">${formatRichParagraphs(p.differentiation)}</td>
            </tr>
            <tr>
              <td style="font-weight: 700;">Ödev / Bireysel Öğrenme Görevi:</td>
              <td contenteditable="true" data-field="planData.homework" class="dp-editable-cell">${formatRichParagraphs(p.homework)}</td>
            </tr>
          </table>
        </div>

        <!-- İMZA ALANI -->
        <div class="dp-signatures">
          <div class="dp-sign-box">
            <div style="font-weight: 700;">${escapeHtml(plan.teacherName)}</div>
            <div style="font-size: 0.8rem; color: #475569;">Ders Öğretmeni</div>
            <div style="margin-top: 2rem; font-size: 0.75rem; color: #94a3b8;">İmza</div>
          </div>
          <div class="dp-sign-box">
            <div style="font-weight: 700;">UYGUNDUR</div>
            <div style="font-size: 0.8rem; color: #475569;">Okul Müdürü</div>
            <div style="margin-top: 2rem; font-size: 0.75rem; color: #94a3b8;">İmza / Mühür</div>
          </div>
        </div>

      </div>
    `;

    // Düzenlenebilir alanları dinle (anlık yazma ve odak kaybı)
    dom.planSheet.querySelectorAll('[contenteditable="true"]').forEach(elem => {
      elem.addEventListener('input', () => {
        syncEditedField(elem.dataset.field, elem.innerText.trim());
      });
      elem.addEventListener('blur', () => {
        syncEditedField(elem.dataset.field, elem.innerText.trim());
      });
    });

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  function syncEditedField(fieldPath, newValue) {
    if (!currentDailyPlan || !fieldPath) return;

    if (fieldPath.startsWith('planData.')) {
      const sub = fieldPath.split('.')[1];
      if (currentDailyPlan.planData) {
        currentDailyPlan.planData[sub] = newValue;
      }
    } else {
      currentDailyPlan[fieldPath] = newValue;
    }

    currentDailyPlan.updatedAt = new Date().toISOString();
  }

  // DOM'daki Tüm Alanları (Form ve Kağıt Hücreleri) Eksiksiz Topla
  function collectPlanDataFromDOM() {
    if (!currentDailyPlan) return;
    dom = getDOM();

    // 1. Sol Form Alanlarından Senkronize Et
    if (dom.selectCourse && dom.selectCourse.value) currentDailyPlan.courseName = dom.selectCourse.value.trim();
    if (dom.inputClass && dom.inputClass.value) currentDailyPlan.className = dom.inputClass.value.trim();
    if (dom.inputDate && dom.inputDate.value) currentDailyPlan.date = dom.inputDate.value;
    if (dom.selectHours && dom.selectHours.value) {
      const h = dom.selectHours.value;
      const mins = parseInt(h, 10) * 40;
      currentDailyPlan.lessonHours = `${h} Ders Saati (${mins} Dakika)`;
    }
    if (dom.inputTeacher && dom.inputTeacher.value) currentDailyPlan.teacherName = dom.inputTeacher.value.trim();
    if (dom.inputSchool && dom.inputSchool.value) currentDailyPlan.schoolName = dom.inputSchool.value.trim();
    if (dom.inputUnit) currentDailyPlan.unitName = dom.inputUnit.value.trim();
    if (dom.inputTopic) currentDailyPlan.topic = dom.inputTopic.value.trim();
    if (dom.inputOutcomes) currentDailyPlan.learningOutcomes = dom.inputOutcomes.value.trim();
    if (dom.selectMethodStyle && dom.selectMethodStyle.value) currentDailyPlan.methodStyle = dom.selectMethodStyle.value;

    // 2. Kağıt Üzerindeki contenteditable Alanlardan Senkronize Et
    if (dom.planSheet) {
      if (!currentDailyPlan.planData) currentDailyPlan.planData = {};
      dom.planSheet.querySelectorAll('[contenteditable="true"]').forEach(elem => {
        const field = elem.dataset.field;
        if (!field) return;
        const val = elem.innerText.trim();
        if (field.startsWith('planData.')) {
          const subKey = field.split('.')[1];
          currentDailyPlan.planData[subKey] = val;
        } else {
          currentDailyPlan[field] = val;
        }
      });
    }

    currentDailyPlan.updatedAt = new Date().toISOString();
  }

  // Kişisel Evrak Deposu ile Senkronizasyon (Kalıcı Günlük Planlar Sekmesi)
  async function syncDailyPlanToDocumentsStorage(plan) {
    if (!plan || !window.stateManager) return;

    const formattedDate = formatTurkishDate(plan.date);
    const docId = 'doc_' + plan.id;
    const docTitle = `${plan.className || ''} ${plan.courseName} - Günlük Ders Planı (${formattedDate})`;
    const fileName = `${plan.courseName}_Gunluk_Plan_${plan.date}.html`;

    // Kağıt HTML'ini oluştur
    const printContent = dom.planSheet ? dom.planSheet.innerHTML : '';
    const fullHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(docTitle)}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; color: #000; padding: 20px; line-height: 1.4; font-size: 11pt; }
    .dp-meta-table, .dp-content-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .dp-meta-table td, .dp-content-table td { border: 1px solid #334155; padding: 5px 8px; vertical-align: top; font-size: 10pt; }
    .dp-section { margin-bottom: 12px; }
    .dp-section-title { font-weight: bold; font-size: 10.5pt; background: #f1f5f9; border: 1px solid #334155; border-bottom: none; padding: 4px 8px; }
    .dp-substep { border: 1px solid #334155; border-top: none; padding: 6px 8px; margin-bottom: -1px; }
    .dp-substep-title { font-weight: bold; font-size: 9.5pt; margin-bottom: 4px; }
    .dp-signatures { display: flex; justify-content: space-between; margin-top: 24px; padding: 0 20px; }
    .dp-sign-box { width: 220px; text-align: center; }
    @media print { @page { size: A4 portrait; margin: 10mm 12mm; } }
  </style>
</head>
<body>
  ${printContent}
</body>
</html>`;

    let base64Html = '';
    try {
      base64Html = 'data:text/html;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(fullHtml)));
    } catch (e) {
      base64Html = 'data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml);
    }

    const docData = {
      id: docId,
      title: docTitle,
      fileName: fileName,
      fileSize: formatBytes(fullHtml.length),
      fileType: 'html',
      categoryId: 'cat_daily_plans',
      createdAt: plan.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDailyPlan: true,
      dailyPlanId: plan.id
    };

    // 1. IndexedDB'ye tam dosya içeriğini yaz
    if (typeof window.saveDocumentFileToIndexedDB === 'function') {
      try {
        await window.saveDocumentFileToIndexedDB(docId, base64Html, printContent);
      } catch (err) {
        console.warn('saveDocumentFileToIndexedDB error:', err);
      }
    }

    // 2. StateManager meta verilerini güncelle
    const state = window.stateManager.state;
    if (!state.documents) state.documents = [];
    const existingIdx = state.documents.findIndex(d => d.id === docId || d.dailyPlanId === plan.id);
    if (existingIdx !== -1) {
      state.documents[existingIdx] = { ...state.documents[existingIdx], ...docData };
    } else {
      state.documents.unshift(docData);
    }
    window.stateManager.saveState();
  }

  // Hızlı Revizyon (AI Prompt Tetikleyici)
  async function handleQuickRevision() {
    dom = getDOM();
    if (!dom.selectRevision || !currentDailyPlan || isGenerating) return;

    const revisionType = dom.selectRevision.value;
    if (!revisionType) return;

    let instruction = '';
    if (revisionType === 'gamify') {
      instruction = 'Dersin etkinliklerini ve gelişme bölümünü tamamen eğlenceli, yarışmalı veya oyunlaştırılmış (gamification) bir kurguya dönüştür.';
    } else if (revisionType === 'experiment') {
      instruction = 'Dersin içine mutlaka basit sınıf içi malzemelerle yapılabilecek pratik bir deney, gözlem veya canlandırma etkinliği ekle.';
    } else if (revisionType === 'compact') {
      instruction = 'Dersi daha hızlı, kompakt ve pratik adımlara böl; açıklamaları sadeleştir ve süreyi çok etkin kıl.';
    } else if (revisionType === 'support') {
      instruction = 'Öğrenme güçlüğü çeken ve desteğe ihtiyaç duyan öğrenciler için farklılaştırılmış öğretim ipuçlarını ve ek etkinlikleri belirgin şekilde artır.';
    }

    dom.selectRevision.value = ''; // Sıfırla

    if (toastCallbackFn) {
      toastCallbackFn('Yapay zeka planı revize ediyor, lütfen bekleyin...', 'info');
    }

    setGeneratingState(true);

    const revisionPrompt = `Aşağıda daha önce hazırlanan bir günlük ders planı bulunmaktadır:
MEVCUT PLAN:
- Ders: ${currentDailyPlan.courseName}
- Konu: ${currentDailyPlan.topic}
- Giriş: ${currentDailyPlan.planData?.introduction || ''}
- Gelişme: ${currentDailyPlan.planData?.development || ''}
- Sonuç: ${currentDailyPlan.planData?.conclusion || ''}
- Ölçme: ${currentDailyPlan.planData?.assessment || ''}
- Farklılaştırma: ${currentDailyPlan.planData?.differentiation || ''}

ÖĞRETMENİN REVİZYON TALEBİ:
${instruction}

Lütfen bu talebe göre planı yeniden düzenle ve SADECE geçerli JSON formatında şu anahtarlarla ver:
{
  "methods": "...",
  "materials": "...",
  "concepts": "...",
  "introduction": "...",
  "development": "...",
  "conclusion": "...",
  "assessment": "...",
  "differentiation": "...",
  "homework": "..."
}`;

    try {
      const rawRes = await window.callGeminiAPI(revisionPrompt, { json: true, temperature: 0.35 });
      const newContent = parseAIJsonResponse(rawRes);
      currentDailyPlan.planData = newContent;
      currentDailyPlan.updatedAt = new Date().toISOString();

      renderDailyPlanSheet(currentDailyPlan);

      if (window.stateManager && typeof window.stateManager.saveDailyPlan === 'function') {
        window.stateManager.saveDailyPlan(currentDailyPlan);
        updateArchiveBadgeCount();
        await syncDailyPlanToDocumentsStorage(currentDailyPlan);
      }

      if (toastCallbackFn) toastCallbackFn('Plan başarıyla revize edildi!', 'success');
    } catch (e) {
      console.error('Revizyon hatası:', e);
      if (toastCallbackFn) toastCallbackFn('Revizyon uygulanırken hata oluştu.', 'danger');
    } finally {
      setGeneratingState(false);
    }
  }

  // Planı Kaydet
  async function saveCurrentDailyPlan() {
    if (!currentDailyPlan) {
      if (toastCallbackFn) toastCallbackFn('Kaydedilecek bir plan bulunmuyor.', 'warning');
      return;
    }

    // 1. Önce kağıt ve formdaki tüm güncel değişiklikleri topla
    collectPlanDataFromDOM();

    // 2. Yerel veritabanına kaydet
    if (window.stateManager && typeof window.stateManager.saveDailyPlan === 'function') {
      window.stateManager.saveDailyPlan(currentDailyPlan);
      updateArchiveBadgeCount();
    }

    // 3. Kişisel Evrak Deposu'ndaki "Günlük Planlar" sekmesine kaydet / senkronize et
    try {
      await syncDailyPlanToDocumentsStorage(currentDailyPlan);
    } catch (e) {
      console.warn('Evrak deposu senkronizasyon uyarısı:', e);
    }

    // 4. Kağıdı güncel verilerle tazele (üst başlık bilgileri vb. yenilensin)
    renderDailyPlanSheet(currentDailyPlan);

    if (toastCallbackFn) {
      toastCallbackFn('Günlük plan başarıyla kaydedildi ve Kişisel Evrak Deposu\'na aktarıldı.', 'success');
    }
  }

  // Panoya Kopyala
  function copyDailyPlanToClipboard() {
    if (!currentDailyPlan || !currentDailyPlan.planData) return;

    const p = currentDailyPlan.planData;
    const text = `T.C. MİLLÎ EĞİTİM BAKANLIĞI - GÜNLÜK DERS PLANI
--------------------------------------------------
Ders: ${currentDailyPlan.courseName}
Sınıf / Şube: ${currentDailyPlan.className}
Tarih: ${currentDailyPlan.date} (${currentDailyPlan.lessonHours})
Öğretmen: ${currentDailyPlan.teacherName}
Ünite: ${currentDailyPlan.unitName || ''}
Konu: ${currentDailyPlan.topic || ''}
Kazanımlar: ${currentDailyPlan.learningOutcomes || ''}
Yöntem-Teknikler: ${p.methods || ''}
Materyaller: ${p.materials || ''}

BÖLÜM II: DERSİN İŞLENİŞİ
A) Dikkati Çekme ve Giriş:
${p.introduction || ''}

B) Gelişme ve Etkinlikler:
${p.development || ''}

C) Özet ve Sonuç:
${p.conclusion || ''}

BÖLÜM III: ÖLÇME VE DEĞERLENDİRME
Değerlendirme: ${p.assessment || ''}
Farklılaştırma: ${p.differentiation || ''}
Ödev / Takip: ${p.homework || ''}
`;

    navigator.clipboard.writeText(text).then(() => {
      if (toastCallbackFn) toastCallbackFn('Günlük plan metni panoya kopyalandı.', 'success');
    }).catch(() => {
      if (toastCallbackFn) toastCallbackFn('Panoya kopyalama başarısız oldu.', 'danger');
    });
  }

  // A4 Yazdır
  function printCurrentDailyPlan() {
    if (!currentDailyPlan) return;

    document.body.classList.add('print-daily-plan');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-daily-plan');
    }, 500);
  }

  // Arşiv Listesini Render Et
  function renderArchiveList() {
    dom = getDOM();
    if (!dom.archiveListContainer) return;

    const state = window.stateManager ? window.stateManager.loadState() : {};
    const plans = state.dailyPlans || [];

    const searchQuery = dom.archiveSearch ? dom.archiveSearch.value.trim().toLowerCase() : '';
    const courseFilter = dom.archiveCourseFilter ? dom.archiveCourseFilter.value : '';

    // Filtreleme
    const filtered = plans.filter(p => {
      if (courseFilter && p.courseName !== courseFilter) return false;
      if (!searchQuery) return true;
      const combined = `${p.courseName} ${p.topic} ${p.unitName} ${p.date} ${p.className}`.toLowerCase();
      return combined.includes(searchQuery);
    });

    // Kurs filtre seçeneklerini güncelle
    if (dom.archiveCourseFilter) {
      const courses = Array.from(new Set(plans.map(p => p.courseName))).filter(Boolean);
      const cur = dom.archiveCourseFilter.value;
      dom.archiveCourseFilter.innerHTML = `
        <option value="">Tüm Dersler (${plans.length})</option>
        ${courses.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
      `;
      if (cur) dom.archiveCourseFilter.value = cur;
    }

    if (filtered.length === 0) {
      dom.archiveListContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          <i data-lucide="folder-search" style="width: 44px; height: 44px; color: var(--text-muted); margin-bottom: 0.75rem; opacity: 0.6;"></i>
          <h4 style="margin: 0 0 0.4rem 0; font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">Kayıtlı Plan Bulunamadı</h4>
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">
            ${plans.length === 0 ? 'Henüz kaydedilmiş bir günlük planınız yok. Yeni bir plan oluşturup kaydedebilirsiniz.' : 'Arama kriterlerinize uyan bir plan bulunamadı.'}
          </p>
        </div>
      `;
      if (window.safeCreateIcons) window.safeCreateIcons();
      return;
    }

    dom.archiveListContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem;">
        ${filtered.map(p => {
          const dateStr = formatTurkishDate(p.date);
          return `
            <div class="glass-card daily-archive-item-card" style="padding: 1.15rem; border-radius: var(--radius-md); background: var(--bg-secondary); border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between; gap: 0.85rem;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                  <span class="badge" style="background: rgba(79, 70, 229, 0.1); color: #4f46e5; font-size: 0.76rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 4px;">
                    📅 ${dateStr}
                  </span>
                  <span style="font-size: 0.76rem; color: var(--text-muted); font-weight: 600;">
                    ${escapeHtml(p.className || '')}
                  </span>
                </div>
                <h4 style="margin: 0 0 0.35rem 0; font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">
                  ${escapeHtml(p.courseName)}
                </h4>
                <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  <strong>Konu:</strong> ${escapeHtml(p.topic || 'Belirtilmedi')}
                </div>
                ${p.unitName ? `
                  <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">
                    <em>${escapeHtml(p.unitName)}</em>
                  </div>
                ` : ''}
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                <button type="button" class="btn btn-secondary btn-sm btn-archive-delete" data-id="${p.id}" title="Sil" style="color: var(--danger); padding: 0.3rem 0.5rem;">
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
                <div style="display: flex; gap: 0.4rem;">
                  <button type="button" class="btn btn-secondary btn-sm btn-archive-print" data-id="${p.id}" style="padding: 0.3rem 0.65rem;">
                    <i data-lucide="printer" style="width: 14px; height: 14px;"></i> Yazdır
                  </button>
                  <button type="button" class="btn btn-primary btn-sm btn-archive-open" data-id="${p.id}" style="padding: 0.3rem 0.8rem; font-weight: 600;">
                    <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Aç & Düzenle
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Buton olayları
    dom.archiveListContainer.querySelectorAll('.btn-archive-open').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        loadPlanFromArchive(id);
      });
    });

    dom.archiveListContainer.querySelectorAll('.btn-archive-print').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        loadPlanFromArchive(id, true);
      });
    });

    dom.archiveListContainer.querySelectorAll('.btn-archive-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const confirmed = typeof window.confirmAsync === 'function'
          ? await window.confirmAsync('Bu günlük planı silmek istediğinize emin misiniz?')
          : confirm('Bu günlük planı silmek istediğinize emin misiniz?');
        if (confirmed) {
          if (window.stateManager && typeof window.stateManager.deleteDailyPlan === 'function') {
            window.stateManager.deleteDailyPlan(id);

            // Kişisel Evrak Deposu ile senkronize sil
            if (window.stateManager.state && Array.isArray(window.stateManager.state.documents)) {
              window.stateManager.state.documents = window.stateManager.state.documents.filter(d => d.id !== ('doc_' + id) && d.dailyPlanId !== id);
              window.stateManager.saveState();
            }
            if (typeof window.deleteDocumentFileFromIndexedDB === 'function') {
              window.deleteDocumentFileFromIndexedDB('doc_' + id);
            }

            if (currentDailyPlan && currentDailyPlan.id === id) {
              currentDailyPlan = null;
              renderDailyPlanSheet(null);
            }
            updateArchiveBadgeCount();
            renderArchiveList();
            if (toastCallbackFn) toastCallbackFn('Günlük plan silindi.', 'info');
          }
        }
      });
    });

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  function loadPlanFromArchive(planId, printDirectly = false) {
    if (!window.stateManager || typeof window.stateManager.getDailyPlanById !== 'function') return;
    const plan = window.stateManager.getDailyPlanById(planId);
    if (!plan) return;

    currentDailyPlan = plan;

    // Oluşturucu paneline geri dön ve planı yükle
    switchViewMode('create');
    renderDailyPlanSheet(currentDailyPlan);

    // Form alanlarını güncelle
    dom = getDOM();
    if (dom.inputDate) dom.inputDate.value = plan.date || '';
    if (dom.selectCourse) dom.selectCourse.value = plan.courseName || '';
    if (dom.inputClass) dom.inputClass.value = plan.className || '';
    if (dom.inputUnit) dom.inputUnit.value = plan.unitName || '';
    if (dom.inputTopic) dom.inputTopic.value = plan.topic || '';
    if (dom.inputOutcomes) dom.inputOutcomes.value = plan.learningOutcomes || '';
    if (dom.inputTeacher) dom.inputTeacher.value = plan.teacherName || '';
    if (dom.inputSchool) dom.inputSchool.value = plan.schoolName || '';

    if (printDirectly) {
      setTimeout(() => printCurrentDailyPlan(), 200);
    }
  }

  function updateArchiveBadgeCount() {
    dom = getDOM();
    if (!dom.badgeArchiveCount) return;
    const state = window.stateManager ? window.stateManager.loadState() : {};
    const count = (state.dailyPlans || []).length;
    dom.badgeArchiveCount.textContent = count;
    dom.badgeArchiveCount.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  // Yardımcı Fonksiyonlar
  function formatISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatTurkishDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  }

  function formatRichParagraphs(text) {
    if (!text) return '';
    return escapeHtml(String(text))
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  function escapeHtml(string) {
    if (!string) return '';
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Genel pencereye dışa aktar
  window.setupDailyPlansTool = setupDailyPlansTool;
  window.openDailyPlanView = openDailyPlanView;
  window.loadDailyPlanById = loadPlanFromArchive;

})();
