/**
 * homework-generator.js
 * Sınıf Asistanı — Ödev ve Çalışma Kağıdı Hazırlama Robotu
 * 
 * Özellikler:
 * - Yıllık plan kazanımlarını (state.plans & MEB_CURRICULUM_DATA) otomatik çekme
 * - 5 Farklı Lego Şablonu:
 *   1. Karma Çalışma Kağıdı (Boşluk Doldurma, Doğru/Yanlış, Açık Uçlu)
 *   2. 2 Sütunlu Kazanım Testi (Çoktan seçmeli, cevap kodlama kutucukları, cevap anahtarı)
 *   3. Türkçe Okuma Anlama & 5N1K (Özgün seviye metni, 5N1K soruları, sözcük etkinlikleri)
 *   4. Hafta Sonu Ödev Fasikülü (Özet kutusu, karma pekiştirme, yıldız puanlama, veli imzası)
 *   5. Esnek Ödev Tasarımı (Öğretmenin seçtiği etkinlik türlerine ve A4 sayfa sayısına göre özel tasarım)
 * - Renkli ve Fotokopi Dostu (Siyah-Beyaz Eco) modları
 * - Canlı Düzenlenebilir (contenteditable) A4 mizanpajı (.hw-a4-* sınıfları ile)
 * - Çoklu A4 Sayfa Desteği, A4 Baskı & PDF Dışa Aktarma
 * - Ödev Takip Modülü ile entegrasyon (Tek tıkla ödev listesine aktarma)
 */

(() => {
  "use strict";

  // ─── Durum Yönetimi ────────────────────────────────────────────────────────
  const HwState = {
    selectedLesson: "",
    selectedGrade: "3",
    selectedUnit: "",
    selectedOutcomes: [], // [{ text, topic, weekLabel, unitTitle }]
    selectedTemplate: "mixed_worksheet", // mixed_worksheet | outcome_test | reading_comp | weekly_homework | custom_flexible
    flexiblePageCount: 1, // 1 | 2 | 3 | 4
    flexibleActivities: ["matching", "fill_blanks", "true_false", "open_ended"],
    difficulty: "orta", // temel | orta | yeni_nesil
    itemCount: 4,
    isEcoMode: false,
    generatedData: null,
    isGenerating: false,
    activePreviewPage: 1,
    totalPages: 1,
    stageTimer: null
  };

  const FLEXIBLE_ACTIVITY_META = {
    matching: { label: "Eşleştirme Etkinliği", desc: "Kavram, tanım veya sözcük eşleştirme (4-5 çift)" },
    fill_blanks: { label: "Boşluk Doldurma", desc: "Kelime bankalı boşluk doldurma cümleleri (4-5 cümle)" },
    true_false: { label: "Doğru / Yanlış", desc: "Doğru (D) / Yanlış (Y) ifadeleri (4-5 madde)" },
    open_ended: { label: "Açık Uçlu Sorular", desc: "Kısa cevaplı kavrama ve yorum soruları (2-3 soru)" },
    math_operations: { label: "Alt Alta İşlemler", desc: "Alt alta toplama, çıkarma veya çarpma işlem kartları (6-8 işlem)" },
    multiple_choice: { label: "Çoktan Seçmeli Test", desc: "Şıklı kazanım test soruları (4 soru)" },
    reading_passage: { label: "Kısa Okuma Metni", desc: "Kazanımla ilgili kısa hikaye/metin ve 2 anlama sorusu" },
    rule_summary: { label: "Konu Özeti / Bilgi Kutusu", desc: "Konunun temel kurallarını hatırlatan özet bilgi kutusu" }
  };

  let _eventsInitialized = false;

  // ─── Yardımcı Fonksiyonlar ─────────────────────────────────────────────────
  function escH(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getItems(section) {
    if (!section) return [];
    if (Array.isArray(section)) return section;
    if (Array.isArray(section.items)) return section.items;
    if (Array.isArray(section.questions)) return section.questions;
    if (Array.isArray(section.data)) return section.data;
    return [];
  }

  function getItemText(item) {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return "";
    return item.statement || item.sentence || item.question || item.text || item.reading || "";
  }

  function cleanInstruction(instr, fallback = "") {
    if (!instr || typeof instr !== "string") return fallback;
    let s = instr.trim();
    // "öğretmeninizin / öğretmenin / öğretmenimizin (özel) isteği / talebi / talimatı (üzerine / doğrultusunda / gereği) (hazırlanan / oluşturulan)" kalıplarını temizle
    s = s.replace(/öğretmen(?:inizin|imizin|in)?\s*(?:özel\s*)?(?:isteği|talebi|talimatı)?\s*(?:üzerine|doğrultusunda|gereği)?\s*(?:hazırlanan|oluşturulan)?\s*/gi, "");
    s = s.replace(/özel\s*(?:talimat|istek)\s*(?:üzerine|gereği|doğrultusunda)\s*(?:hazırlanan)?\s*/gi, "");
    s = s.replace(/özel\s*olarak\s*hazırlanan\s*/gi, "");
    // Başta kalabilecek noktalama işaretlerini temizle
    s = s.replace(/^[\s:\-\–\—\.]+/g, "").trim();
    if (s.length > 0) {
      s = s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);
    }
    return (s && s.length >= 4) ? s : fallback;
  }

  function getActiveState() {
    return (window.stateManager && window.stateManager.state) ? window.stateManager.state : (window.state || {});
  }

  function notifyUser(msg, type = "info") {
    if (typeof window.showToast === "function") {
      window.showToast(msg, type);
    } else if (typeof window.showMobileToast === "function") {
      window.showMobileToast(msg, type);
    } else {
      console.log(`[Toast ${type}]`, msg);
    }
  }

  // ─── Ders ve Kazanım Yükleme Mantığı ──────────────────────────────────────
  function loadAvailableLessons() {
    const lessonSelect = document.getElementById("hw-robot-lesson-select");
    const gradeSelect = document.getElementById("hw-robot-grade-select");
    if (!lessonSelect) return;

    const state = getActiveState();
    const lessonNames = new Set(["Matematik", "Türkçe", "Fen Bilimleri", "Sosyal Bilgiler", "Hayat Bilgisi", "İngilizce", "Din Kültürü ve Ahlak Bilgisi"]);

    // 1. Tanımlı dersler
    if (Array.isArray(state.definedLessons)) {
      state.definedLessons.forEach(l => {
        if (l && l.name && l.name.trim()) lessonNames.add(l.name.trim());
      });
    }

    // 2. Yıllık planlardaki dersler
    if (Array.isArray(state.plans)) {
      state.plans.forEach(p => {
        const pName = p ? String(p.courseName || p.title || "").trim() : "";
        if (pName) lessonNames.add(pName);
      });
    }

    // 3. MEB hazır müfredat havuzu
    if (Array.isArray(window.MEB_CURRICULUM_DATA)) {
      window.MEB_CURRICULUM_DATA.forEach(p => {
        if (p && p.course) lessonNames.add(p.course.trim());
      });
    }

    const sorted = Array.from(lessonNames).sort((a, b) => a.localeCompare(b, "tr"));
    let html = '<option value="">Ders Seçiniz...</option>';
    sorted.forEach(name => {
      html += `<option value="${escH(name)}">${escH(name)}</option>`;
    });
    lessonSelect.innerHTML = html;

    // Sınıf seviyesi otomatik doldurma (eğer öğretmenin sınıf adı varsa, örn: 4/B -> 4)
    if (gradeSelect && state.className) {
      const match = String(state.className).match(/(\d+)/);
      if (match && match[1]) {
        gradeSelect.value = match[1];
        HwState.selectedGrade = match[1];
      }
    }
  }

  function onLessonOrGradeChanged() {
    const lessonSelect = document.getElementById("hw-robot-lesson-select");
    const gradeSelect = document.getElementById("hw-robot-grade-select");
    const unitSelect = document.getElementById("hw-robot-unit-select");
    const outcomesBox = document.getElementById("hw-robot-outcomes-list");
    const outcomeSearch = document.getElementById("hw-robot-outcome-search");

    if (!lessonSelect || !unitSelect || !outcomesBox) return;

    HwState.selectedLesson = lessonSelect.value.trim();
    if (gradeSelect) HwState.selectedGrade = gradeSelect.value.trim();
    HwState.selectedOutcomes = [];
    updateSelectedOutcomesBadge();

    if (!HwState.selectedLesson) {
      unitSelect.disabled = true;
      unitSelect.innerHTML = '<option value="">Önce ders seçiniz...</option>';
      outcomesBox.innerHTML = '<div class="hw-robot-empty-hint">Kazanımları görmek için bir ders seçin.</div>';
      if (outcomeSearch) outcomeSearch.disabled = true;
      return;
    }

    unitSelect.disabled = false;
    if (outcomeSearch) {
      outcomeSearch.disabled = false;
      outcomeSearch.value = "";
    }

    // Plandan veya MEB veri havuzundan üniteleri ve haftaları topla
    const unitsMap = findCurriculumUnits(HwState.selectedLesson, HwState.selectedGrade);

    let unitOptions = '<option value="__ALL__">Tüm Üniteler ve Kazanımlar</option>';
    if (unitsMap.size === 0) {
      unitOptions = '<option value="__MANUAL__">Müfredat bulunamadı (Özel konu girebilirsiniz)</option>';
    } else {
      unitsMap.forEach((unitObj, key) => {
        unitOptions += `<option value="${escH(key)}">${escH(unitObj.title)} (${unitObj.outcomes.length} kazanım)</option>`;
      });
    }
    unitSelect.innerHTML = unitOptions;

    renderOutcomesChecklist(unitsMap);
  }

  function findCurriculumUnits(lessonName, gradeStr) {
    const unitsMap = new Map();
    const state = getActiveState();
    const plans = state.plans || [];

    // 1. Önce öğretmenin kendi yüklediği yıllık planlarına bak
    let matchedPlan = plans.find(p => {
      if (!p) return false;
      const cName = String(p.courseName || p.title || "").toLowerCase();
      const lName = lessonName.toLowerCase();
      const matchName = cName.includes(lName) || lName.includes(cName);
      if (!matchName) return false;
      if (gradeStr && p.className) {
        return String(p.className).includes(gradeStr);
      }
      return true;
    });

    if (matchedPlan) {
      const weeks = matchedPlan.weeklySchedule || matchedPlan.weeks || [];
      weeks.forEach((w, idx) => {
        if (!w || w.isHoliday) return;
        const uTitle = (w.unitName && String(w.unitName).trim()) 
          ? (w.unitNo ? `${w.unitNo}. Ünite: ${w.unitName.trim()}` : w.unitName.trim()) 
          : (w.month ? `${w.month} - ${w.weekLabel || (idx + 1) + '. Hafta'}` : `${idx + 1}. Hafta`);

        let outcomes = [];
        if (Array.isArray(w.learningOutcomes)) outcomes = w.learningOutcomes;
        else if (typeof w.learningOutcomes === "string") outcomes = w.learningOutcomes.split("\n");

        const cleanOutcomes = outcomes.map(o => String(o).trim()).filter(o => o.length > 0);
        if (cleanOutcomes.length === 0 && w.topics) {
          const topList = Array.isArray(w.topics) ? w.topics : [w.topics];
          topList.forEach(t => { if (t && String(t).trim()) cleanOutcomes.push(String(t).trim()); });
        }

        if (cleanOutcomes.length > 0) {
          if (!unitsMap.has(uTitle)) unitsMap.set(uTitle, { title: uTitle, outcomes: [] });
          const target = unitsMap.get(uTitle);
          cleanOutcomes.forEach(outc => {
            if (!target.outcomes.some(o => o.text === outc)) {
              target.outcomes.push({
                text: outc,
                unitTitle: uTitle,
                weekLabel: w.weekLabel || `${idx + 1}. Hafta`
              });
            }
          });
        }
      });
    }

    // 2. Eğer öğretmenin planı yoksa, sistemdeki 75 hazır MEB planından eşleşene bak
    if (unitsMap.size === 0 && Array.isArray(window.MEB_CURRICULUM_DATA)) {
      const gNum = parseInt(gradeStr, 10);
      const mebPlan = window.MEB_CURRICULUM_DATA.find(p => {
        if (!p) return false;
        const matchC = p.course && p.course.toLowerCase().includes(lessonName.toLowerCase());
        const matchG = isNaN(gNum) || p.grade === gNum;
        return matchC && matchG;
      });

      if (mebPlan && Array.isArray(mebPlan.weeks)) {
        mebPlan.weeks.forEach((w, idx) => {
          if (!w) return;
          const uTitle = w.unitName ? w.unitName.trim() : (w.month ? `${w.month} - ${w.weekLabel || (idx + 1) + '. Hafta'}` : `${idx + 1}. Hafta`);
          let outcomes = Array.isArray(w.learningOutcomes) ? w.learningOutcomes : [];
          const cleanOutcomes = outcomes.map(o => String(o).trim()).filter(o => o.length > 0);
          if (cleanOutcomes.length > 0) {
            if (!unitsMap.has(uTitle)) unitsMap.set(uTitle, { title: uTitle, outcomes: [] });
            const target = unitsMap.get(uTitle);
            cleanOutcomes.forEach(outc => {
              if (!target.outcomes.some(o => o.text === outc)) {
                target.outcomes.push({
                  text: outc,
                  unitTitle: uTitle,
                  weekLabel: w.weekLabel || `${idx + 1}. Hafta`
                });
              }
            });
          }
        });
      }
    }

    return unitsMap;
  }

  function renderOutcomesChecklist(unitsMap) {
    const outcomesBox = document.getElementById("hw-robot-outcomes-list");
    const unitSelect = document.getElementById("hw-robot-unit-select");
    const searchInput = document.getElementById("hw-robot-outcome-search");
    if (!outcomesBox) return;

    if (!unitsMap) {
      unitsMap = findCurriculumUnits(HwState.selectedLesson, HwState.selectedGrade);
    }

    const selectedUnitKey = unitSelect ? unitSelect.value : "__ALL__";
    const filterQuery = (searchInput ? searchInput.value : "").toLowerCase().trim();

    let allOutcomes = [];
    unitsMap.forEach((uObj, key) => {
      if (selectedUnitKey === "__ALL__" || selectedUnitKey === key) {
        uObj.outcomes.forEach(outc => allOutcomes.push(outc));
      }
    });

    if (filterQuery) {
      allOutcomes = allOutcomes.filter(o => 
        o.text.toLowerCase().includes(filterQuery) || 
        o.unitTitle.toLowerCase().includes(filterQuery)
      );
    }

    if (allOutcomes.length === 0) {
      outcomesBox.innerHTML = `
        <div class="hw-robot-empty-hint">
          ${filterQuery ? 'Aramanıza uygun kazanım bulunamadı.' : 'Bu ders/ünite için sistemde kayıtlı kazanım bulunamadı. Aşağıdaki serbest konu kutusunu kullanabilirsiniz.'}
        </div>
      `;
      return;
    }

    let html = "";
    allOutcomes.forEach((outc, idx) => {
      const isChecked = HwState.selectedOutcomes.some(sel => sel.text === outc.text);
      const safeId = `hw_outc_${idx}`;
      html += `
        <label class="hw-robot-outcome-item ${isChecked ? 'selected' : ''}" for="${safeId}">
          <input type="checkbox" id="${safeId}" data-idx="${idx}" ${isChecked ? 'checked' : ''} />
          <div class="hw-robot-outcome-text">
            <span class="hw-robot-outcome-badge">${escH(outc.weekLabel || outc.unitTitle)}</span>
            <span class="hw-robot-outcome-title">${escH(outc.text)}</span>
          </div>
        </label>
      `;
    });

    outcomesBox.innerHTML = html;

    // Dinleyici bağlama
    outcomesBox.querySelectorAll("input[type='checkbox']").forEach(chk => {
      chk.addEventListener("change", (e) => {
        const itemIdx = parseInt(e.target.dataset.idx, 10);
        const item = allOutcomes[itemIdx];
        if (e.target.checked) {
          if (!HwState.selectedOutcomes.some(sel => sel.text === item.text)) {
            HwState.selectedOutcomes.push(item);
          }
          e.target.closest(".hw-robot-outcome-item").classList.add("selected");
        } else {
          HwState.selectedOutcomes = HwState.selectedOutcomes.filter(sel => sel.text !== item.text);
          e.target.closest(".hw-robot-outcome-item").classList.remove("selected");
        }
        updateSelectedOutcomesBadge();
      });
    });
  }

  function updateSelectedOutcomesBadge() {
    const badge = document.getElementById("hw-robot-selected-count");
    if (!badge) return;
    const count = HwState.selectedOutcomes.length;
    badge.textContent = `${count} Kazanım Seçildi`;
    badge.style.display = count > 0 ? "inline-flex" : "none";
  }

  // ─── Şablon Seçimi ve Esnek Ödev Ayarları ──────────────────────────────────
  function toggleFlexibleConfigPanel() {
    const flexPanel = document.getElementById("hw-robot-flexible-config");
    if (!flexPanel) return;
    flexPanel.style.display = HwState.selectedTemplate === "custom_flexible" ? "flex" : "none";
  }

  function syncFlexibleStateFromDOM() {
    const activePageBtn = document.querySelector("#hw-robot-page-selector .hw-robot-page-btn.active");
    if (activePageBtn && activePageBtn.dataset.pages) {
      HwState.flexiblePageCount = Math.max(1, Math.min(4, parseInt(activePageBtn.dataset.pages, 10) || 1));
    }

    const checkedInputs = document.querySelectorAll("#hw-robot-activity-grid input[type='checkbox']:checked");
    const acts = [];
    checkedInputs.forEach(inp => {
      if (inp.value) acts.push(inp.value);
    });
    if (acts.length > 0) {
      HwState.flexibleActivities = acts;
    }

    const countBadge = document.getElementById("hw-robot-flex-act-count");
    if (countBadge) {
      countBadge.textContent = `${HwState.flexibleActivities.length} Tür Seçili`;
    }
  }

  function setupFlexibleControls() {
    const pageBtns = document.querySelectorAll("#hw-robot-page-selector .hw-robot-page-btn");
    pageBtns.forEach(btn => {
      const clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
    });

    document.querySelectorAll("#hw-robot-page-selector .hw-robot-page-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#hw-robot-page-selector .hw-robot-page-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        syncFlexibleStateFromDOM();
        if (HwState.selectedTemplate === "custom_flexible" && HwState.generatedData?.isSample) {
          showSampleFlexibleWorksheet();
        }
      });
    });

    const chips = document.querySelectorAll("#hw-robot-activity-grid .hw-robot-activity-chip");
    chips.forEach(chip => {
      const clone = chip.cloneNode(true);
      chip.parentNode.replaceChild(clone, chip);
    });

    const actInputs = document.querySelectorAll("#hw-robot-activity-grid input[type='checkbox']");
    actInputs.forEach(inp => {
      const chip = inp.closest(".hw-robot-activity-chip");
      if (chip) chip.classList.toggle("selected", inp.checked);

      inp.addEventListener("change", (e) => {
        const checkedCount = document.querySelectorAll("#hw-robot-activity-grid input[type='checkbox']:checked").length;
        if (checkedCount === 0) {
          e.target.checked = true;
          notifyUser("En az 1 etkinlik türü seçili olmalıdır!", "warning");
          return;
        }
        const parentChip = e.target.closest(".hw-robot-activity-chip");
        if (parentChip) parentChip.classList.toggle("selected", e.target.checked);
        syncFlexibleStateFromDOM();
        if (HwState.selectedTemplate === "custom_flexible" && HwState.generatedData?.isSample) {
          showSampleFlexibleWorksheet();
        }
      });
    });

    syncFlexibleStateFromDOM();
  }

  function setupTemplateCards() {
    const cards = document.querySelectorAll(".hw-robot-template-card");
    cards.forEach(card => {
      // Önceki listenerları temizlemek için clone
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);
    });

    document.querySelectorAll(".hw-robot-template-card").forEach(card => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".hw-robot-template-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        HwState.selectedTemplate = card.dataset.template;
        toggleFlexibleConfigPanel();
        console.log("[HwRobot] Seçilen şablon:", HwState.selectedTemplate);

        if (HwState.generatedData?.isSample) {
          if (HwState.selectedTemplate === "custom_flexible") {
            showSampleFlexibleWorksheet();
          } else {
            showSampleInitialWorksheet();
          }
        }
      });
    });

    toggleFlexibleConfigPanel();
  }

  // ─── Yapay Zeka (Gemini) Çağrısı ve Prompt Motoru ────────────────────────
  async function generateHomeworkContent() {
    const lesson = HwState.selectedLesson;
    const grade = HwState.selectedGrade;
    const customTopic = (document.getElementById("hw-robot-custom-topic")?.value || "").trim();
    const outcomes = HwState.selectedOutcomes.map(o => o.text);

    if (!lesson && !customTopic) {
      notifyUser("Lütfen önce bir ders seçin veya özel konu başlığı yazın!", "warning");
      return;
    }

    // Aktif karttan güncel şablonu garanti altına al
    const activeCard = document.querySelector(".hw-robot-template-card.active");
    if (activeCard && activeCard.dataset.template) {
      HwState.selectedTemplate = activeCard.dataset.template;
    }

    if (HwState.selectedTemplate === "custom_flexible") {
      syncFlexibleStateFromDOM();
      if (!HwState.flexibleActivities || HwState.flexibleActivities.length === 0) {
        notifyUser("Lütfen en az bir etkinlik türü seçin!", "warning");
        return;
      }
    }

    // API Anahtarı Kontrolü
    if (typeof window.hasGeminiApiKey === "function" && !window.hasGeminiApiKey()) {
      if (typeof window.showGeminiKeyRequiredModal === "function") {
        const key = await window.showGeminiKeyRequiredModal({
          title: "Ödev Hazırlama Robotu İçin Yapay Zeka Anahtarı",
          description: "Yıllık plan kazanımlarına uygun çalışma kağıdı ve test soruları üretebilmek için ücretsiz Google Gemini API anahtarı gereklidir."
        });
        if (!key) return;
      }
    }

    setGeneratingState(true);

    try {
      const prompt = buildGeminiPrompt(lesson, grade, outcomes, customTopic, HwState.selectedTemplate, HwState.difficulty, HwState.itemCount);
      console.log("[HwRobot] Gönderilen prompt parametreleri:", { lesson, grade, template: HwState.selectedTemplate });

      let rawText = "";
      if (typeof window.callGeminiAPI === "function") {
        const response = await window.callGeminiAPI(prompt, { json: true, temperature: 0.35 });
        rawText = typeof response === "string" ? response : (response?.text || JSON.stringify(response));
      } else {
        throw new Error("Yapay zeka modülü (callGeminiAPI) bulunamadı.");
      }

      // JSON bloklarını temizle (```json ... ``` gibi)
      rawText = (rawText || "").trim();
      if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/, "").trim();
      }

      let parsed = null;
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        // Regex ile { ... } bloğunu ayıkla
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch (e2) {
            console.error("Regex JSON parse error:", e2);
          }
        }
      }

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Yapay zeka geçerli bir veri döndüremedi. Lütfen tekrar deneyin.");
      }

      console.log("[HwRobot] Ayrıştırılan veri:", parsed);

      // Şablon tipini öğretmenin seçtiği şablonla senkronize et
      parsed.templateType = HwState.selectedTemplate;
      HwState.generatedData = parsed;

      // Son aşamayı (%100 Tamamlandı) başarıyla göster
      updateStageUI(GENERATION_STAGES[4]);
      await new Promise(r => setTimeout(r, 450));

      renderWorksheetToA4(parsed);
      notifyUser("✓ Ödev başarıyla hazırlandı! İnceleyebilir ve düzenleyebilirsiniz.", "success");
    } catch (err) {
      console.error("[HomeworkRobot Error]", err);
      notifyUser(`Ödev oluşturulurken hata oluştu: ${err.message}`, "error");
    } finally {
      setGeneratingState(false);
    }
  }

  function buildGeminiPrompt(lesson, grade, outcomes, customTopic, template, difficulty, count) {
    const trimmedCustom = (customTopic || "").trim();
    const isMathOpRequested = /alt\s*alta|toplama|çıkarma|çarpma|bölme|işlem|hesap/i.test(trimmedCustom);

    let outcomeText = outcomes.length > 0 ? outcomes.join(";\n- ") : "Müfredat genel konu tekrarı ve pekiştirme";
    if (trimmedCustom) {
      outcomeText = outcomes.length > 0 
        ? `${outcomeText};\n- Öncelikli Konu / İçerik: ${trimmedCustom}` 
        : trimmedCustom;
    }
    const diffDesc = difficulty === "temel" ? "Temel düzeyde, anlaşılır, pekiştirici" : (difficulty === "yeni_nesil" ? "Beceri temelli, yeni nesil, görsel-mantık muhakeme" : "Müfredata uygun orta zorlukta");

    let customInstructionBlock = "";
    if (trimmedCustom) {
      customInstructionBlock = `
*******************************************************************************
🚨 [EN YÜKSEK ÖNCELİK] ÖĞRETMENİN BELİRTTİĞİ ÖZEL KONU / TALİMAT:
"${trimmedCustom}"
DİKKAT VE KESİN KURALLAR:
1. Hazırlanacak tüm sorular, etkinlikler ve içerik ÖNCELİKLE VE KESİNLİKLE yukarıdaki konuya/talimata uygun olmalıdır! Bu talimatın dışına ASLA çıkılmamalıdır.
2. YÖNERGELERDE KESİNLİKLE "Öğretmeninizin isteği üzerine", "özel istek", "öğretmeninizin talebiyle", "özel olarak hazırlanan" gibi yapay meta ifadeler KULLANMA!
   Yönergeler ("instruction") her zaman doğrudan öğrenciye hitap eden standart ders kitabı ve çalışma kağıdı üslubunda olmalıdır.
   Örnek YANLIŞ: "Öğretmeninizin özel isteği üzerine hazırlanan en çok dört basamaklı alt alta toplama işlemlerini yapınız."
   Örnek DOĞRU: "Aşağıdaki alt alta toplama işlemlerini yapınız ve sonuçları kutucuklara yazınız."
${isMathOpRequested ? '3. Öğretmen alt alta / matematik işlemi talep etmiştir. İşlemleri "math_operations" türünde alt alta çözülecek formatta sağlayınız.' : ''}
*******************************************************************************
`;
    }

    let templateSpec = "";
    let jsonSchema = "";

    switch (template) {
      case "custom_flexible": {
        const pageCount = Math.max(1, Math.min(4, HwState.flexiblePageCount || 1));
        let acts = (HwState.flexibleActivities && HwState.flexibleActivities.length > 0)
          ? [...HwState.flexibleActivities]
          : ["matching", "fill_blanks", "true_false", "open_ended"];

        // Eğer öğretmen özel talimatta alt alta işlem istemişse ve acts içinde yoksa otomatik ekle
        if (isMathOpRequested && !acts.includes("math_operations")) {
          acts.push("math_operations");
        }

        const actDescriptions = acts.map((actKey, i) => {
          const meta = FLEXIBLE_ACTIVITY_META[actKey] || { label: actKey, desc: actKey };
          return `${i + 1}. "${actKey}" (${meta.label}): ${meta.desc}`;
        }).join("\n");

        const sectionSchemaExamples = [];
        if (acts.includes("rule_summary")) {
          sectionSchemaExamples.push(`        { "type": "rule_summary", "title": "Konu Özeti ve Hatırlatma", "items": ["Önemli kural veya bilgi 1...", "Önemli kural veya bilgi 2..."] }`);
        }
        if (acts.includes("reading_passage")) {
          sectionSchemaExamples.push(`        { "type": "reading_passage", "title": "Okuma Metni Başlığı", "text": "Kazanımla ilgili özgün metin...", "questions": [{ "question": "Metinle ilgili 1. soru?" }, { "question": "Metinle ilgili 2. soru?" }] }`);
        }
        if (acts.includes("math_operations") || isMathOpRequested) {
          sectionSchemaExamples.push(`        { "type": "math_operations", "instruction": "Aşağıdaki işlemleri alt alta yapınız ve sonuçlarını kutucuklara yazınız.", "items": [{ "num1": 348, "num2": 215, "operator": "+", "result": 563 }, { "num1": 526, "num2": 194, "operator": "+", "result": 720 }, { "num1": 417, "num2": 328, "operator": "+", "result": 745 }, { "num1": 639, "num2": 182, "operator": "+", "result": 821 }, { "num1": 274, "num2": 458, "operator": "+", "result": 732 }, { "num1": 503, "num2": 298, "operator": "+", "result": 801 }] }`);
        }
        if (acts.includes("matching")) {
          sectionSchemaExamples.push(`        { "type": "matching", "instruction": "Aşağıdaki kavramları uygun açıklamalarla eşleştiriniz.", "pairs": [{ "left": "Kavram 1", "right": "Eşleşen açıklama 1" }, { "left": "Kavram 2", "right": "Eşleşen açıklama 2" }, { "left": "Kavram 3", "right": "Eşleşen açıklama 3" }, { "left": "Kavram 4", "right": "Eşleşen açıklama 4" }] }`);
        }
        if (acts.includes("fill_blanks")) {
          sectionSchemaExamples.push(`        { "type": "fill_blanks", "instruction": "Aşağıdaki cümlelerde boş bırakılan yerleri kutudaki uygun kelimelerle tamamlayınız.", "wordBank": ["kelime1", "kelime2", "kelime3", "kelime4"], "items": [{ "sentence": "1. boşluklu cümle .......... devamı.", "answer": "kelime1" }, { "sentence": "2. boşluklu cümle .......... devamı.", "answer": "kelime2" }, { "sentence": "3. boşluklu cümle .......... devamı.", "answer": "kelime3" }, { "sentence": "4. boşluklu cümle .......... devamı.", "answer": "kelime4" }] }`);
        }
        if (acts.includes("true_false")) {
          sectionSchemaExamples.push(`        { "type": "true_false", "instruction": "Aşağıdaki ifadelerden doğru olanların başına (D), yanlış olanların başına (Y) yazınız.", "items": [{ "statement": "1. ifade...", "answer": "D" }, { "statement": "2. ifade...", "answer": "Y" }, { "statement": "3. ifade...", "answer": "D" }, { "statement": "4. ifade...", "answer": "Y" }] }`);
        }
        if (acts.includes("open_ended")) {
          sectionSchemaExamples.push(`        { "type": "open_ended", "instruction": "Aşağıdaki soruları cevaplayınız.", "items": [{ "question": "1. açık uçlu soru..." }, { "question": "2. açık uçlu soru..." }] }`);
        }
        if (acts.includes("multiple_choice")) {
          sectionSchemaExamples.push(`        { "type": "multiple_choice", "instruction": "Aşağıdaki çoktan seçmeli soruları yanıtlayınız.", "questions": [{ "questionText": "1. soru metni...", "options": ["A) ...", "B) ...", "C) ..."${grade >= 4 ? ', "D) ..."' : ''}], "correctOption": "A" }, { "questionText": "2. soru metni...", "options": ["A) ...", "B) ...", "C) ..."${grade >= 4 ? ', "D) ..."' : ''}], "correctOption": "B" }, { "questionText": "3. soru metni...", "options": ["A) ...", "B) ...", "C) ..."${grade >= 4 ? ', "D) ..."' : ''}], "correctOption": "C" }, { "questionText": "4. soru metni...", "options": ["A) ...", "B) ...", "C) ..."${grade >= 4 ? ', "D) ..."' : ''}], "correctOption": "A" }] }`);
        }

        templateSpec = `
ŞABLON: ESNEK ÖDEV TASARIMI (${pageCount} A4 SAYFASI)
Gereksinimler:
1. Ödev toplam TAM OLARAK ${pageCount} adet A4 sayfası ("pages" dizisinde ${pageCount} eleman: pageNumber 1'den ${pageCount}'e kadar) olacak şekilde hazırlanmalıdır.
2. Öğretmenin seçtiği etkinlik türleri şunlardır (YALNIZCA bu etkinlik türlerini kullan, seçilmeyen türleri ekleme):
${actDescriptions}
3. Her bir A4 sayfasında ("pages[i].sections") sayfanın dolu ve zengin görünmesi için 3 ila 4 adet etkinlik bölümü yer almalıdır.
4. Seçilen tüm etkinlik türlerine mutlaka yer verilmeli; eğer sayfa sayısı (${pageCount} sayfa) fazla ise veya sayfanın dolması gerekiyorsa seçilen etkinlik türleri farklı sorularla/alt başlıklarla birden fazla kez kullanılarak her A4 sayfası eksiksiz doldurulmalıdır.
`;

        const pagesJsonExample = Array.from({ length: pageCount }, (_, pIdx) => `    {
      "pageNumber": ${pIdx + 1},
      "sections": [
${sectionSchemaExamples.join(",\n")}
      ]
    }`).join(",\n");

        jsonSchema = `{
  "title": "${grade}. Sınıf ${lesson} Çalışma Kağıdı",
  "subject": "${lesson}",
  "grade": "${grade}. Sınıf",
  "templateType": "custom_flexible",
  "pageCount": ${pageCount},
  "pages": [
${pagesJsonExample}
  ],
  "teacherNote": "Gayretin için teşekkürler! Harika bir çalışma oldu."
}`;
        break;
      }

      case "reading_comp":
        templateSpec = `
ŞABLON: TÜRKÇE OKUMA ANLAMA & 5N1K
Gereksinimler:
1. "readingPassage": ${grade}. sınıf düzeyinde sıcak, özgün bir hikaye/metin (title ve text).
2. "questions5N1K": Metne bağlı 4 adet 5N1K sorusu (KİM, NEREDE, NE ZAMAN, NASIL). items: [{ "qTag": "KİM", "question": "..." }]
3. "wordMatch": Metinde geçen 4 çift eş anlamlı veya zıt anlamlı sözcük (pairs: [{ "word": "görev", "match": "vazife" }]).
`;
        jsonSchema = `{
  "title": "${grade}. Sınıf ${lesson} Okuma Anlama",
  "subject": "${lesson}",
  "grade": "${grade}. Sınıf",
  "templateType": "reading_comp",
  "readingPassage": { "title": "Metin Başlığı", "text": "Metin içeriği..." },
  "questions5N1K": { "instruction": "Metne göre aşağıdaki soruları cevaplayınız.", "items": [{ "qTag": "KİM", "question": "..." }, { "qTag": "NEREDE", "question": "..." }] },
  "wordMatch": { "instruction": "Sözcükleri eşleştiriniz.", "pairs": [{ "word": "cevap", "match": "yanıt" }] },
  "teacherNote": "Okuma gayretin için tebrikler!"
}`;
        break;

      case "outcome_test":
        templateSpec = `
ŞABLON: 2 SÜTUNLU KAZANIM DEĞERLENDİRME TESTİ
Gereksinimler:
1. "questions": Toplam 6 adet çoktan seçmeli soru. ${grade >= 4 ? 'A, B, C, D seçenekli' : 'A, B, C seçenekli'}.
   Her soru: { "questionNumber": 1, "questionText": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctOption": "A" }
`;
        jsonSchema = `{
  "title": "${grade}. Sınıf ${lesson} Kazanım Testi",
  "subject": "${lesson}",
  "grade": "${grade}. Sınıf",
  "templateType": "outcome_test",
  "questions": [
    { "questionNumber": 1, "questionText": "Soru metni...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctOption": "A" }
  ],
  "teacherNote": "Tüm soruları dikkatlice okuduğun için tebrikler!"
}`;
        break;

      case "weekly_homework":
        templateSpec = `
ŞABLON: HAFTA SONU ÖDEV FASİKÜLÜ
Gereksinimler:
1. "summaryBox": Haftanın özet bilgileri (3-4 maddelik hap bilgi).
2. "trueFalseSection": 4 adet Doğru/Yanlış sorusu (items: [{ "statement": "...", "answer": "D" }]).
3. "fillBlanksSection": Kelime bankalı 3 adet boşluk doldurma (wordBank: ["..."], items: [{ "sentence": "...", "answer": "..." }]).
4. "openEndedSection": 2 adet kısa cevaplı düşünme sorusu (items: [{ "question": "..." }]).
`;
        jsonSchema = `{
  "title": "${grade}. Sınıf ${lesson} Hafta Sonu Ödevi",
  "subject": "${lesson}",
  "grade": "${grade}. Sınıf",
  "templateType": "weekly_homework",
  "summaryBox": ["Haftanın 1. önemli bilgisi...", "2. önemli bilgisi..."],
  "trueFalseSection": { "instruction": "Doğru olanlara (D), yanlış olanlara (Y) yazınız.", "items": [{ "statement": "...", "answer": "D" }] },
  "fillBlanksSection": { "instruction": "Boşlukları doldurunuz.", "wordBank": ["kelime1", "kelime2"], "items": [{ "sentence": "...", "answer": "kelime1" }] },
  "openEndedSection": { "instruction": "Aşağıdaki soruları kısaca cevaplayınız.", "items": [{ "question": "..." }] },
  "teacherNote": "Hafta sonu çalışmalarını tamamladığın için tebrikler!"
}`;
        break;

      case "mixed_worksheet":
      default:
        if (isMathOpRequested) {
          templateSpec = `
ŞABLON: KARMA MATEMATİK VE İŞLEM ÇALIŞMA KAĞIDI
Gereksinimler:
1. "ruleBox": İşlemle ilgili kısa hatırlatma/kural veya pratik işlem ipucu.
2. "mathOperationsSection": 8 adet alt alta işlem kartı ("items": [{ "num1": 348, "num2": 215, "operator": "+", "result": 563 }, ...]).
3. "openEndedSection": İşlem ve konuyla ilgili 2 adet problem/soru (items: [{ "question": "..." }]).
`;
          jsonSchema = `{
  "title": "${grade}. Sınıf ${lesson} Çalışma Kağıdı",
  "subject": "${lesson}",
  "grade": "${grade}. Sınıf",
  "templateType": "mixed_worksheet",
  "ruleBox": "Toplama işlemine birler basamağından başlanır. Elde varsa komşu basamağa aktarılır.",
  "mathOperationsSection": {
    "instruction": "Aşağıdaki işlemleri alt alta yapınız ve sonuçları kutucuklara yazınız.",
    "items": [
      { "num1": 348, "num2": 215, "operator": "+", "result": 563 },
      { "num1": 526, "num2": 194, "operator": "+", "result": 720 },
      { "num1": 417, "num2": 328, "operator": "+", "result": 745 },
      { "num1": 639, "num2": 182, "operator": "+", "result": 821 },
      { "num1": 274, "num2": 458, "operator": "+", "result": 732 },
      { "num1": 503, "num2": 298, "operator": "+", "result": 801 },
      { "num1": 189, "num2": 467, "operator": "+", "result": 656 },
      { "num1": 612, "num2": 249, "operator": "+", "result": 861 }
    ]
  },
  "openEndedSection": {
    "instruction": "Aşağıdaki problemleri çözünüz.",
    "items": [
      { "question": "Bir kütüphanede 345 hikaye kitabı, hikaye kitaplarından 128 fazla masal kitabı vardır. Kütüphanede kaç masal kitabı vardır?" },
      { "question": "Ali 235 fındık, Mehmet ise Ali'den 147 fındık fazla topladı. İkisi toplam kaç fındık toplamıştır?" }
    ]
  },
  "teacherNote": "Gayretin için teşekkürler! Harika bir çalışma oldu."
}`;
        } else {
          templateSpec = `
ŞABLON: KARMA ETKİNLİK VE ÇALIŞMA KAĞIDI
Gereksinimler:
1. "ruleBox": ${lesson} dersinin seçilen kazanımıyla ilgili 1-2 cümlelik pratik bilgi veya tanım.
2. "trueFalseSection": 4 adet Doğru / Yanlış sorusu (items: [{ "statement": "...", "answer": "D" }]).
3. "fillBlanksSection": Kelime bankalı ("wordBank": ["kelime1", "kelime2", ...]) 3 adet boşluk doldurma cümlesi (items: [{ "sentence": "Cümle metni .......... kısmı boş.", "answer": "kelime1" }]).
4. "openEndedSection": 2 adet açık uçlu düşünme / kavrama sorusu (items: [{ "question": "..." }]).
`;
          jsonSchema = `{
  "title": "${grade}. Sınıf ${lesson} Çalışma Kağıdı",
  "subject": "${lesson}",
  "grade": "${grade}. Sınıf",
  "templateType": "mixed_worksheet",
  "ruleBox": "Konuyla ilgili önemli hatırlatma...",
  "trueFalseSection": {
    "instruction": "Aşağıdaki ifadelerden doğru olanların başına (D), yanlış olanların başına (Y) yazınız.",
    "items": [
      { "statement": "1. cümle ifadesi...", "answer": "D" },
      { "statement": "2. cümle ifadesi...", "answer": "Y" },
      { "statement": "3. cümle ifadesi...", "answer": "D" },
      { "statement": "4. cümle ifadesi...", "answer": "Y" }
    ]
  },
  "fillBlanksSection": {
    "instruction": "Aşağıdaki cümlelerde boş bırakılan yerleri uygun kelimelerle tamamlayınız.",
    "wordBank": ["kelime1", "kelime2", "kelime3", "kelime4"],
    "items": [
      { "sentence": "1. boşluklu cümle .......... devamı.", "answer": "kelime1" },
      { "sentence": "2. boşluklu cümle .......... devamı.", "answer": "kelime2" },
      { "sentence": "3. boşluklu cümle .......... devamı.", "answer": "kelime3" }
    ]
  },
  "openEndedSection": {
    "instruction": "Aşağıdaki soruları kısaca cevaplayınız.",
    "items": [
      { "question": "1. açık uçlu soru..." },
      { "question": "2. açık uçlu soru..." }
    ]
  },
  "teacherNote": "Gayretin için teşekkürler! Harika bir çalışma oldu."
}`;
        }
        break;
    }

    return `Sen uzman bir Milli Eğitim Bakanlığı (MEB) öğretmenisin.
GÖREV: Aşağıda verilen ders, sınıf seviyesi ve kazanımlara %100 uygun, pedagojik standartlarda bir ödev/çalışma kağıdı içeriği üret.
ASLA başka dersten soru veya içerik koyma. İçerik TAMAMEN ${lesson} dersine ait olmalıdır.

DERS: ${lesson}
SINIF SEVİYESİ: ${grade}. Sınıf
KAZANIMLAR:
- ${outcomeText}
ZORLUK: ${diffDesc}

${customInstructionBlock}

${templateSpec}

LÜTFEN YALNIZCA AŞAĞIDAKİ GEÇERLİ JSON YAPISINDA ÇIKTI ÜRET:
${jsonSchema}
`;
  }

  // ─── Animasyonlu Aşama & Durum Tanımları ───────────────────────────────────
  const GENERATION_STAGES = [
    {
      step: 1,
      percent: 22,
      icon: "🎯",
      title: "MEB Kazanımları Analiz Ediliyor",
      desc: "Seçilen ders ve sınıf düzeyindeki kazanımlar pedagojik standartlarda inceleniyor..."
    },
    {
      step: 2,
      percent: 46,
      icon: "🧠",
      title: "Soru & Etkinlik İçerikleri Kurgulanıyor",
      desc: "Öğrenci seviyesine uygun özgün soru, metin ve yönergeler yapay zeka ile tasarlanıyor..."
    },
    {
      step: 3,
      percent: 70,
      icon: "🧩",
      title: "Etkinlik Bölümleri Yapılandırılıyor",
      desc: "Eşleştirme, boşluk doldurma, test ve açık uçlu bloklar sıralanıyor..."
    },
    {
      step: 4,
      percent: 88,
      icon: "📐",
      title: "A4 Mizanpajı ve Baskı Düzeni Optimize Ediliyor",
      desc: "Sayfa sınırları, estetik kutular ve A4 sayfa sonları dengeleniyor..."
    },
    {
      step: 5,
      percent: 100,
      icon: "✨",
      title: "Çalışma Kağıdı Hazırlanıyor",
      desc: "Son kontroller tamamlanıyor ve çalışma kağıdınız ekrana yansıtılıyor..."
    }
  ];

  const GENERATION_TIPS = [
    "İpucu: Çalışma kağıdı hazırlandıktan sonra sayfa üzerindeki herhangi bir metne tıklayarak doğrudan düzenleyebilirsiniz.",
    "Biliyor muydunuz? 'Fotokopi (Eco) Modu' butonuyla tek tıkla siyah-beyaz baskı ve fotokopi dostu görünüme geçebilirsiniz.",
    "İpucu: 'Ödeve Aktar' butonu sayesinde hazırladığınız bu çalışmayı doğrudan sınıfınızın Ödev Takip sistemine gönderebilirsiniz.",
    "Biliyor muydunuz? Hazırlanan A4 çalışma kağıtları MEB güncel müfredat kazanımlarına birebir uyumlu olarak üretilmektedir."
  ];

  function renderLiveGenerationOverlay(activeStage) {
    const paper = document.getElementById("hw-robot-a4-sheet");
    if (!paper) return;

    paper.classList.remove("multi-page-mode");
    const tip = GENERATION_TIPS[Math.floor(Math.random() * GENERATION_TIPS.length)];

    paper.innerHTML = `
      <div class="hw-robot-live-stage-overlay">
        <div class="hw-stage-center-box">
          <div class="hw-stage-pulse-icon">
            <span style="font-size: 1.85rem;">✨</span>
          </div>
          <h3 class="hw-stage-main-title">Ödeviniz Adım Adım Oluşturuluyor</h3>
          <p class="hw-stage-main-desc">Yapay zeka MEB kazanımlarına uygun çalışma kağıdını tasarlıyor, lütfen bekleyiniz.</p>
          
          <div class="hw-stage-stepper" id="hw-stage-stepper">
            ${GENERATION_STAGES.map((st) => {
              const isCurrent = st.step === activeStage.step;
              const isPast = st.step < activeStage.step;
              const cls = isCurrent ? "active" : (isPast ? "done" : "");
              const statusText = isCurrent ? "İşleniyor..." : (isPast ? "Tamamlandı ✓" : "Sırada");
              const iconOrNum = isPast ? "✓" : st.step;
              return `
                <div class="hw-stage-step-item ${cls}" data-step="${st.step}">
                  <div class="hw-stage-step-num">${iconOrNum}</div>
                  <div class="hw-stage-step-text">${st.icon} ${escH(st.title)}</div>
                  <div class="hw-stage-step-status">${statusText}</div>
                </div>
              `;
            }).join("")}
          </div>

          <div class="hw-stage-tip-box">
            <span style="font-size: 1.15rem; flex-shrink: 0;">💡</span>
            <span>${escH(tip)}</span>
          </div>
        </div>
      </div>
    `;
  }

  function updateStageUI(stage) {
    // 1. Sol paneldeki mini durum kartı
    const badge = document.getElementById("hw-load-step-badge");
    const bar = document.getElementById("hw-load-progress-bar");
    const icon = document.getElementById("hw-load-step-icon");
    const label = document.getElementById("hw-load-step-label");
    const desc = document.getElementById("hw-load-step-desc");

    if (badge) badge.textContent = `${stage.step} / 5`;
    if (bar) bar.style.width = `${stage.percent}%`;
    if (icon) icon.textContent = stage.icon;
    if (label) label.textContent = stage.title;
    if (desc) desc.textContent = stage.desc;

    // 2. Sağdaki canlı önizleme sahnesi
    const stepper = document.getElementById("hw-stage-stepper");
    if (stepper) {
      stepper.querySelectorAll(".hw-stage-step-item").forEach(item => {
        const stepNum = parseInt(item.dataset.step, 10);
        const statusEl = item.querySelector(".hw-stage-step-status");
        const numEl = item.querySelector(".hw-stage-step-num");
        item.classList.remove("active", "done");

        if (stepNum === stage.step) {
          item.classList.add("active");
          if (statusEl) statusEl.textContent = "İşleniyor...";
          if (numEl) numEl.textContent = stepNum;
        } else if (stepNum < stage.step) {
          item.classList.add("done");
          if (statusEl) statusEl.textContent = "Tamamlandı ✓";
          if (numEl) numEl.textContent = "✓";
        } else {
          if (statusEl) statusEl.textContent = "Sırada";
          if (numEl) numEl.textContent = stepNum;
        }
      });
    }
  }

  function setGeneratingState(isGen) {
    HwState.isGenerating = isGen;
    const btn = document.getElementById("btn-hw-robot-generate");
    const loader = document.getElementById("hw-robot-loading-indicator");
    
    if (btn) {
      btn.disabled = isGen;
      btn.innerHTML = isGen ? '<span>⏳</span> Hazırlanıyor...' : '<i data-lucide="sparkles" style="width: 16px; height: 16px;"></i> <span>Ödevi Hazırla (Yapay Zeka)</span>';
      if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
    }

    if (HwState.stageTimer) {
      clearTimeout(HwState.stageTimer);
      HwState.stageTimer = null;
    }

    if (isGen) {
      if (loader) loader.style.display = "flex";
      hidePageNavigationControls();
      renderLiveGenerationOverlay(GENERATION_STAGES[0]);
      updateStageUI(GENERATION_STAGES[0]);

      let curIdx = 0;
      const delays = [2200, 3200, 3000, 2800];
      let delayIdx = 0;

      const runNext = () => {
        if (!HwState.isGenerating) return;
        if (delayIdx < delays.length) {
          HwState.stageTimer = setTimeout(() => {
            if (!HwState.isGenerating) return;
            curIdx++;
            if (curIdx < GENERATION_STAGES.length) {
              updateStageUI(GENERATION_STAGES[curIdx]);
              delayIdx++;
              runNext();
            }
          }, delays[delayIdx]);
        }
      };
      runNext();
    } else {
      if (loader) loader.style.display = "none";
    }
  }

  // ─── Çoklu Sayfa Tekli Önizleme & Sayfa Geçiş Kontrolleri ───────────────────
  function renderPageNavigationControls(total, active) {
    const navGroup = document.getElementById("hw-robot-page-nav-group");
    const tabsContainer = document.getElementById("hw-page-tabs");
    const badge = document.getElementById("hw-page-nav-badge");
    const btnPrev = document.getElementById("btn-hw-page-prev");
    const btnNext = document.getElementById("btn-hw-page-next");

    if (!navGroup || !tabsContainer) return;

    if (total <= 1) {
      navGroup.style.display = "none";
      return;
    }

    navGroup.style.display = "inline-flex";
    if (badge) badge.textContent = `Sayfa ${active} / ${total}`;

    tabsContainer.innerHTML = Array.from({ length: total }, (_, i) => {
      const pNum = i + 1;
      const isActive = pNum === active;
      return `<button type="button" class="hw-page-tab ${isActive ? "active" : ""}" data-page="${pNum}">Sayfa ${pNum}</button>`;
    }).join("");

    if (btnPrev) btnPrev.disabled = (active <= 1);
    if (btnNext) btnNext.disabled = (active >= total);

    tabsContainer.querySelectorAll(".hw-page-tab").forEach(tab => {
      tab.onclick = () => {
        const targetPage = parseInt(tab.dataset.page, 10);
        if (targetPage) switchPreviewPage(targetPage);
      };
    });

    if (btnPrev) {
      btnPrev.onclick = () => {
        if (HwState.activePreviewPage > 1) {
          switchPreviewPage(HwState.activePreviewPage - 1);
        }
      };
    }

    if (btnNext) {
      btnNext.onclick = () => {
        if (HwState.activePreviewPage < HwState.totalPages) {
          switchPreviewPage(HwState.activePreviewPage + 1);
        }
      };
    }

    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function switchPreviewPage(targetPage) {
    HwState.activePreviewPage = targetPage;
    const cards = document.querySelectorAll("#hw-robot-a4-sheet .hw-a4-page-card");
    cards.forEach(card => {
      const pageIdx = parseInt(card.dataset.pageIndex, 10);
      if (pageIdx === targetPage) {
        card.classList.remove("preview-hidden-page");
      } else {
        card.classList.add("preview-hidden-page");
      }
    });

    renderPageNavigationControls(HwState.totalPages, targetPage);
  }

  function hidePageNavigationControls() {
    const navGroup = document.getElementById("hw-robot-page-nav-group");
    if (navGroup) navGroup.style.display = "none";
  }

  // ─── Canlı A4 Mizanpaj Çizimi (Lego Render) ────────────────────────────────
  function renderWorksheetToA4(data) {
    const paper = document.getElementById("hw-robot-a4-sheet");
    if (!paper) return;

    // Şablon tipini KESİNLİKLE kullanıcının seçtiği HwState.selectedTemplate'e göre belirle
    const tType = HwState.selectedTemplate || data.templateType || "mixed_worksheet";
    const isEco = HwState.isEcoMode;

    console.log("[HwRobot] A4 Çizimi yapılıyor. Şablon tipi:", tType, "Ders:", data.subject);

    // Esnek Ödev ve Çoklu A4 Sayfa Kontrolü
    if (tType === "custom_flexible") {
      const pages = normalizeFlexiblePages(data);
      if (pages.length > 1) {
        paper.classList.add("multi-page-mode");
        HwState.totalPages = pages.length;
        if (!HwState.activePreviewPage || HwState.activePreviewPage > pages.length) {
          HwState.activePreviewPage = 1;
        }

        paper.innerHTML = pages.map((pageObj, pIdx) => {
          const isFirst = pIdx === 0;
          const isLast = pIdx === pages.length - 1;
          const pageNum = pIdx + 1;
          const isVisible = pageNum === HwState.activePreviewPage;
          const pageTitle = data.title || `${HwState.selectedGrade}. Sınıf ${HwState.selectedLesson || "Genel"} Çalışma Kağıdı`;
          const sectionsHtml = renderFlexibleSectionsList(pageObj.sections || [], isEco);

          return `
            <div class="hw-a4-page-card ${isVisible ? "" : "preview-hidden-page"}" data-page-index="${pageNum}">
              <div>
                ${isFirst ? `
                  ${renderHeaderBlock(data, isEco)}
                  <div class="hw-a4-student-strip">
                    <div>Adı Soyadı: <span class="hw-a4-strip-line" style="width: 160px;"></span></div>
                    <div>Sınıf / Şube: <span class="hw-a4-strip-line" style="width: 50px;"></span></div>
                    <div>Numara: <span class="hw-a4-strip-line" style="width: 60px;"></span></div>
                  </div>
                ` : `
                  <div class="hw-a4-header-compact">
                    <span contenteditable="true">${escH(pageTitle)}</span>
                    <span>Sayfa ${pageNum} / ${pages.length}</span>
                  </div>
                `}
                <div class="hw-a4-body">
                  ${sectionsHtml}
                </div>
              </div>
              <div>
                ${isLast ? renderFooterBlock(data, isEco) : ""}
                <div class="hw-a4-page-indicator">Sayfa ${pageNum} / ${pages.length}</div>
              </div>
            </div>
          `;
        }).join("");

        renderPageNavigationControls(pages.length, HwState.activePreviewPage);

        paper.classList.toggle("fotokopi-mode", isEco);
        if (window.lucide && typeof window.lucide.createIcons === "function") {
          window.lucide.createIcons();
        }
        return;
      }

      // 1 Sayfalık Esnek Ödev
      paper.classList.remove("multi-page-mode");
      hidePageNavigationControls();
      HwState.totalPages = 1;
      HwState.activePreviewPage = 1;

      const firstPageSections = pages[0]?.sections || [];
      const bodyHtml = renderFlexibleSectionsList(firstPageSections, isEco);

      paper.innerHTML = `
        ${renderHeaderBlock(data, isEco)}
        <div class="hw-a4-student-strip">
          <div>Adı Soyadı: <span class="hw-a4-strip-line" style="width: 160px;"></span></div>
          <div>Sınıf / Şube: <span class="hw-a4-strip-line" style="width: 50px;"></span></div>
          <div>Numara: <span class="hw-a4-strip-line" style="width: 60px;"></span></div>
        </div>
        <div class="hw-a4-body">
          ${bodyHtml}
        </div>
        ${renderFooterBlock(data, isEco)}
      `;
      paper.classList.toggle("fotokopi-mode", isEco);
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
      return;
    }

    paper.classList.remove("multi-page-mode");
    hidePageNavigationControls();
    HwState.totalPages = 1;
    HwState.activePreviewPage = 1;

    let bodyHtml = "";

    // 1. ŞABLON: Okuma Anlama & 5N1K
    if (tType === "reading_comp") {
      bodyHtml = renderReadingTemplate(data, isEco);
    }
    // 2. ŞABLON: 2 Sütunlu Test
    else if (tType === "outcome_test") {
      bodyHtml = renderTestTemplate(data, isEco);
    }
    // 3. ŞABLON: Hafta Sonu Fasikülü
    else if (tType === "weekly_homework") {
      bodyHtml = renderWeeklyTemplate(data, isEco);
    }
    // 4. ŞABLON: Karma Çalışma Kağıdı
    else {
      bodyHtml = renderMixedTemplate(data, isEco);
    }

    paper.innerHTML = `
      <!-- Üst Başlık -->
      ${renderHeaderBlock(data, isEco)}

      <!-- Öğrenci Bilgi Şeridi -->
      <div class="hw-a4-student-strip">
        <div>Adı Soyadı: <span class="hw-a4-strip-line" style="width: 160px;"></span></div>
        <div>Sınıf / Şube: <span class="hw-a4-strip-line" style="width: 50px;"></span></div>
        <div>Numara: <span class="hw-a4-strip-line" style="width: 60px;"></span></div>
      </div>

      <!-- İçerik Gövdesi -->
      <div class="hw-a4-body">
        ${bodyHtml}
      </div>

      <!-- Alt Bilgi & İmza Alanı -->
      ${renderFooterBlock(data, isEco)}
    `;

    // Eco sınıfını ayarla
    paper.classList.toggle("fotokopi-mode", isEco);

    // Lucide ikonlarını yenile
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function renderHeaderBlock(data, isEco) {
    const school = data.schoolName || "2026-2027 EĞİTİM ÖĞRETİM YILI";
    const title = data.title || `${HwState.selectedGrade}. Sınıf ${HwState.selectedLesson} Çalışma Kağıdı`;
    const sub = `${data.grade || HwState.selectedGrade + '. Sınıf'} ${data.subject || HwState.selectedLesson}`;

    const themeClass = isEco ? "theme-eco" : "theme-color";

    return `
      <div class="hw-a4-header ${themeClass}">
        <div>
          <div class="hw-a4-header-sub" contenteditable="true">${escH(school)} &bull; ${escH(sub)}</div>
          <h2 class="hw-a4-header-title" contenteditable="true">${escH(title)}</h2>
        </div>
        <div class="hw-a4-header-meta">
          <div style="opacity: 0.85;">Tarih: ____/____/2026</div>
          <div style="font-weight: 800; font-size: 0.88rem; margin-top: 2px;">Puan: ______</div>
        </div>
      </div>
    `;
  }

  function renderFooterBlock(data, isEco) {
    const teacherNote = data.teacherNote || "Gayretin için teşekkürler! Harika bir çalışma oldu.";
    return `
      <div class="hw-a4-footer">
        <div style="font-style: italic;" contenteditable="true">🌟 Öğretmen Notu: "${escH(teacherNote)}"</div>
        <div style="font-weight: 600;">Veli İmzası: <span class="hw-a4-strip-line" style="width: 100px;"></span></div>
      </div>
    `;
  }

  // ─── 1. OKUMA ANLAMA & 5N1K ŞABLON RENDERER ──────────────────────────────
  function renderReadingTemplate(data, isEco) {
    let html = "";
    const p = data.readingPassage || {};

    if (p.text) {
      html += `
        <div class="hw-a4-reading-box">
          <div class="hw-a4-reading-title" contenteditable="true">${escH(p.title || "Okuma Metni")}</div>
          <div class="hw-a4-reading-text" contenteditable="true">${escH(p.text)}</div>
        </div>
      `;
    }

    // 5N1K Soruları
    const q5n1k = getItems(data.questions5N1K);
    if (q5n1k.length > 0) {
      const instr = (data.questions5N1K && data.questions5N1K.instruction) || "Metne göre aşağıdaki soruları cevaplayalım:";
      html += `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">A</span>
            <span>${escH(instr)}</span>
          </div>
          <div class="hw-a4-grid-2">
            ${q5n1k.map((q, idx) => `
              <div class="hw-a4-q-card">
                <div>
                  <span class="hw-a4-q-tag">${escH(q.qTag || (idx + 1) + '.')}:</span> 
                  <span contenteditable="true">${escH(q.question || q.text)}</span>
                </div>
                <div class="hw-a4-answer-line"></div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // Eş Anlamlı Eşleştirme
    const pairs = Array.isArray(data.wordMatch?.pairs) ? data.wordMatch.pairs : (Array.isArray(data.pairs) ? data.pairs : []);
    if (pairs.length > 0) {
      const instr = (data.wordMatch && data.wordMatch.instruction) || "Sözcük Eşleştirme Etkinliği:";
      html += `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">B</span>
            <span>${escH(instr)}</span>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.75rem; background: #ffffff;">
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center; font-size: 0.8rem;">
              ${pairs.map(pair => `
                <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 0.4rem; border-radius: 6px; font-weight: 700; color: #3730a3;" contenteditable="true">${escH(pair.word)}</div>
                <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.4rem; border-radius: 6px; font-weight: 700; color: #065f46;" contenteditable="true">${escH(pair.match)}</div>
              `).join("")}
            </div>
          </div>
        </div>
      `;
    }

    return html;
  }

  // ─── 3. İKİ SÜTUNLU KAZANIM TESTİ RENDERER ────────────────────────────────
  function renderTestTemplate(data, isEco) {
    const questions = getItems(data.questions);
    let html = `
      <div class="hw-a4-grid-2">
        ${questions.map((q, idx) => `
          <div class="hw-a4-test-q">
            <p style="font-weight: 800; color: #0f172a; margin-bottom: 0.35rem;" contenteditable="true">
              ${idx + 1}. ${escH(q.questionText || q.question)}
            </p>
            <div style="display: flex; flex-direction: column; gap: 0.2rem;">
              ${(q.options || []).map(opt => `
                <div class="hw-a4-opt" contenteditable="true">${escH(opt)}</div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>

      <!-- Mini Kodlama & Cevap Alanı -->
      <div style="margin-top: 1rem; padding-top: 0.65rem; border-top: 2px solid #0f172a; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; flex-wrap: wrap; gap: 0.5rem;">
        <div style="font-weight: 800; color: #334155; text-transform: uppercase;">Cevaplarınızı Kodlayınız:</div>
        <div style="display: flex; gap: 0.6rem; font-family: monospace; font-size: 0.75rem; flex-wrap: wrap;">
          ${questions.map((q, idx) => `
            <div>${idx + 1}. [A] [B] [C] [D]</div>
          `).join("")}
        </div>
      </div>
    `;

    return html;
  }

  // ─── 4. HAFTA SONU ÖDEV FASİKÜLÜ RENDERER ────────────────────────────────
  function renderWeeklyTemplate(data, isEco) {
    let html = "";

    // Haftalık Özet
    const summaryList = Array.isArray(data.summaryBox) ? data.summaryBox : (Array.isArray(data.summary) ? data.summary : []);
    if (summaryList.length > 0) {
      html += `
        <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.8rem; color: #581c87; margin-bottom: 1rem;">
          <strong style="display: block; font-weight: 800; margin-bottom: 0.3rem;">📌 Haftanın Özeti & Hatırlayalım:</strong>
          <ul style="list-style: disc; padding-left: 1.2rem; margin: 0; line-height: 1.5;">
            ${summaryList.map(item => `<li contenteditable="true">${escH(item)}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    // Doğru / Yanlış
    const tfItems = getItems(data.trueFalseSection || data.trueFalse);
    if (tfItems.length > 0) {
      const instr = cleanInstruction(data.trueFalseSection?.instruction || data.trueFalse?.instruction, "Aşağıdaki ifadelerden doğru olanlara (D), yanlış olanlara (Y) yazınız.");
      html += `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">1</span>
            <span>${escH(instr)}</span>
          </div>
          <div>
            ${tfItems.map((item, idx) => `
              <div class="hw-a4-tf-row">
                <span class="hw-a4-tf-bubble">( )</span>
                <span contenteditable="true">${idx + 1}. ${escH(getItemText(item))}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // Boşluk Doldurma
    const fillItems = getItems(data.fillBlanksSection || data.fillBlanks);
    if (fillItems.length > 0) {
      const instr = cleanInstruction(data.fillBlanksSection?.instruction || data.fillBlanks?.instruction, "Aşağıdaki cümlelerde boş bırakılan yerleri tamamlayınız.");
      const words = Array.isArray(data.fillBlanksSection?.wordBank) ? data.fillBlanksSection.wordBank : (Array.isArray(data.wordBank) ? data.wordBank : []);
      html += `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">2</span>
            <span>${escH(instr)}</span>
          </div>
          ${words.length > 0 ? `
            <div class="hw-a4-word-bank">
              [ ${words.map(w => escH(w)).join(" &bull; ")} ]
            </div>
          ` : ''}
          <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.8rem; color: #334155;">
            ${fillItems.map((item, idx) => `
              <div contenteditable="true">${idx + 1}. ${escH(getItemText(item))}</div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // Açık Uçlu / Kısa Cevaplı Sorular
    const openItems = getItems(data.openEndedSection || data.openEnded || data.questions);
    if (openItems.length > 0) {
      const instr = cleanInstruction(data.openEndedSection?.instruction || data.openEnded?.instruction, "Aşağıdaki soruları kısaca cevaplayınız:");
      html += `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">3</span>
            <span>${escH(instr)}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${openItems.map((item, idx) => `
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.6rem; background: #f8fafc; font-size: 0.8rem;">
                <span style="font-weight: 750; color: #1e293b;" contenteditable="true">${idx + 1}. ${escH(getItemText(item))}</span>
                <div class="hw-a4-answer-line"></div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // Öz Değerlendirme
    html += `
      <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 0.5rem 0.85rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
        <div>
          <span style="font-weight: 800; color: #6b21a8;">Öğrenci Öz Değerlendirmesi:</span>
          <span style="color: #64748b; margin-left: 6px;">Bu ödevi yaparken: ⭐ ⭐ ⭐ ⭐ ⭐</span>
        </div>
      </div>
    `;

    return html;
  }

  // ─── Matematik Alt Alta İşlem Yardımcıları ───────────────────────────────
  function parseMathItem(item) {
    if (!item) return null;
    if (typeof item === "object") {
      if (item.num1 !== undefined && item.num2 !== undefined) {
        let op = String(item.operator || "+").trim();
        if (op === "*" || op === "x" || op === "X") op = "×";
        if (op === "/") op = "÷";
        return {
          num1: item.num1,
          num2: item.num2,
          operator: op,
          result: item.result || ""
        };
      }
    }
    const text = getItemText(item);
    // 1., 1), a) gibi numaralandırmaları temizle
    const cleaned = text.replace(/^\s*(?:[0-9]{1,2}|[a-zA-Z])[\.\)\-]\s*/, "");
    const m = cleaned.match(/(\d+)\s*([\+\-\*xX×÷\/])\s*(\d+)/);
    if (m) {
      let op = m[2];
      if (op === "*" || op === "x" || op === "X") op = "×";
      if (op === "/") op = "÷";
      return {
        num1: m[1],
        num2: m[3],
        operator: op,
        result: ""
      };
    }
    return null;
  }

  function renderMathOperationBox(opObj, idx) {
    const num1 = escH(opObj.num1);
    const num2 = escH(opObj.num2);
    const op = escH(opObj.operator || "+");

    return `
      <div class="hw-a4-calc-card">
        <div style="font-size: 0.72rem; color: #64748b; font-weight: 700; width: 100%; margin-bottom: 2px;">${idx + 1}.</div>
        <div class="hw-a4-calc-box">
          <div class="hw-calc-top-num" contenteditable="true">${num1}</div>
          <div class="hw-calc-bottom-num">
            <span class="hw-calc-op" contenteditable="true">${op}</span>
            <span contenteditable="true">${num2}</span>
          </div>
          <div class="hw-calc-line"></div>
          <div class="hw-calc-result-space" contenteditable="true"></div>
        </div>
      </div>
    `;
  }

  function renderMathOperationsSection(sec, badgeLetter) {
    const rawItems = getItems(sec.items || sec.operations || sec);
    if (rawItems.length === 0) return "";
    const parsedOps = rawItems.map(parseMathItem).filter(Boolean);
    if (parsedOps.length === 0) return "";

    const instr = cleanInstruction(sec.instruction, "Aşağıdaki işlemleri alt alta yapınız ve sonuçları kutucuklara yazınız.");
    return `
      <div class="hw-a4-section">
        <div class="hw-a4-section-title" contenteditable="true">
          <span class="hw-a4-badge-circle">${badgeLetter}</span>
          <span>${escH(instr)}</span>
        </div>
        <div class="hw-a4-calc-grid">
          ${parsedOps.map((op, idx) => renderMathOperationBox(op, idx)).join("")}
        </div>
      </div>
    `;
  }

  // ─── 5. KARMA ÇALIŞMA KAĞIDI RENDERER ─────────────────────────────────────
  function renderMixedTemplate(data, isEco) {
    let html = "";
    if (data.ruleBox) {
      html += `
        <div class="hw-a4-rule-box" contenteditable="true">
          💡 <strong>Hatırlayalım:</strong> ${escH(data.ruleBox)}
        </div>
      `;
    }

    const letters = ["A", "B", "C", "D", "E"];
    let badgeIdx = 0;

    // Alt Alta Matematik İşlemleri Bölümü (varsa)
    if (data.mathOperationsSection) {
      const badge = letters[badgeIdx++];
      html += renderMathOperationsSection(data.mathOperationsSection, badge);
    }

    // 1. Bölüm: Doğru / Yanlış
    const tfItems = getItems(data.trueFalseSection || data.trueFalse);
    if (tfItems.length > 0) {
      const badge = letters[badgeIdx++];
      const instr = cleanInstruction(data.trueFalseSection?.instruction || data.trueFalse?.instruction, "Aşağıdaki ifadelerden doğru olanların başına (D), yanlış olanların başına (Y) yazınız.");
      html += `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">${badge}</span>
            <span>${escH(instr)}</span>
          </div>
          <div>
            ${tfItems.map((item, idx) => `
              <div class="hw-a4-tf-row">
                <span class="hw-a4-tf-bubble">( )</span>
                <span contenteditable="true">${idx + 1}. ${escH(getItemText(item))}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // 2. Bölüm: Boşluk Doldurma
    const fillItems = getItems(data.fillBlanksSection || data.fillBlanks);
    if (fillItems.length > 0) {
      const badge = letters[badgeIdx++];
      const instr = cleanInstruction(data.fillBlanksSection?.instruction || data.fillBlanks?.instruction, "Aşağıdaki cümlelerde boş bırakılan yerleri uygun kelimelerle tamamlayınız.");
      const words = Array.isArray(data.fillBlanksSection?.wordBank) ? data.fillBlanksSection.wordBank : (Array.isArray(data.wordBank) ? data.wordBank : []);
      html += `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">${badge}</span>
            <span>${escH(instr)}</span>
          </div>
          ${words.length > 0 ? `
            <div class="hw-a4-word-bank">
              [ ${words.map(w => escH(w)).join(" &bull; ")} ]
            </div>
          ` : ''}
          <div style="display: flex; flex-direction: column; gap: 0.45rem; font-size: 0.8rem; color: #334155;">
            ${fillItems.map((item, idx) => `
              <div contenteditable="true">${idx + 1}. ${escH(getItemText(item))}</div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // 3. Bölüm: Açık Uçlu Sorular / Matematik İşlemleri
    const openItems = getItems(data.openEndedSection || data.openEnded || data.questions);
    if (openItems.length > 0) {
      const badge = letters[badgeIdx++];
      const parsedOps = openItems.map(parseMathItem).filter(Boolean);
      const rawInstr = data.openEndedSection?.instruction || data.openEnded?.instruction;
      if (parsedOps.length >= Math.ceil(openItems.length * 0.7) && parsedOps.length >= 2) {
        html += renderMathOperationsSection({
          instruction: cleanInstruction(rawInstr, "Aşağıdaki işlemleri alt alta yapınız ve sonuçları kutucuklara yazınız:"),
          items: parsedOps
        }, badge);
      } else {
        const instr = cleanInstruction(rawInstr, "Aşağıdaki soruları kısaca cevaplayınız:");
        html += `
          <div class="hw-a4-section">
            <div class="hw-a4-section-title" contenteditable="true">
              <span class="hw-a4-badge-circle">${badge}</span>
              <span>${escH(instr)}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.6rem;">
              ${openItems.map((item, idx) => `
                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.6rem; background: #f8fafc; font-size: 0.8rem;">
                  <span style="font-weight: 750; color: #1e293b;" contenteditable="true">${idx + 1}. ${escH(getItemText(item))}</span>
                  <div class="hw-a4-answer-line"></div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }
    }

    return html;
  }

  // ─── 6. ESNEK ÖDEV ŞABLONU (ÇOKLU ETKİNLİK & ÇOKLU A4 SAYFA) RENDERER ──────
  function normalizeFlexiblePages(data) {
    const targetPageCount = Math.max(1, Math.min(4, parseInt(data.pageCount || HwState.flexiblePageCount, 10) || 1));

    if (Array.isArray(data.pages) && data.pages.length > 0) {
      return data.pages.slice(0, 4);
    }

    // Geriye dönük veya düz liste olarak dönerse sayfalara böl
    let flatSections = Array.isArray(data.sections) ? [...data.sections] : [];
    if (flatSections.length === 0) {
      if (data.ruleBox) flatSections.push({ type: "rule_summary", title: "Hatırlayalım", items: [data.ruleBox] });
      if (data.readingPassage) flatSections.push({ type: "reading_passage", ...data.readingPassage });
      if (data.mathOperationsSection) flatSections.push({ type: "math_operations", ...data.mathOperationsSection });
      if (data.matchingSection) flatSections.push({ type: "matching", ...data.matchingSection });
      if (data.fillBlanksSection) flatSections.push({ type: "fill_blanks", ...data.fillBlanksSection });
      if (data.trueFalseSection) flatSections.push({ type: "true_false", ...data.trueFalseSection });
      if (data.openEndedSection) flatSections.push({ type: "open_ended", ...data.openEndedSection });
      if (data.questions) flatSections.push({ type: "multiple_choice", questions: getItems(data.questions) });
    }

    if (targetPageCount <= 1 || flatSections.length <= 1) {
      return [{ pageNumber: 1, sections: flatSections }];
    }

    const pages = [];
    const perPage = Math.max(1, Math.ceil(flatSections.length / targetPageCount));
    for (let p = 0; p < targetPageCount; p++) {
      const slice = flatSections.slice(p * perPage, (p + 1) * perPage);
      if (slice.length > 0) {
        pages.push({ pageNumber: p + 1, sections: slice });
      }
    }
    return pages.length > 0 ? pages : [{ pageNumber: 1, sections: flatSections }];
  }

  function renderFlexibleSectionsList(sections, isEco) {
    if (!Array.isArray(sections) || sections.length === 0) return "";
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    let badgeIdx = 0;

    return sections.map((sec) => {
      if (!sec || typeof sec !== "object") return "";
      const sType = String(sec.type || "").toLowerCase();

      // 1. Konu Özeti / Hatırlatma Kutusu
      if (sType === "rule_summary" || sType === "summary") {
        const items = Array.isArray(sec.items) ? sec.items : (sec.text ? [sec.text] : []);
        if (items.length === 0) return "";
        return `
          <div class="hw-a4-rule-box">
            <strong style="display: block; margin-bottom: 3px;" contenteditable="true">💡 ${escH(sec.title || "Konu Özeti ve Hatırlayalım:")}</strong>
            ${items.length === 1 ? `<div contenteditable="true">${escH(items[0])}</div>` : `
              <ul style="margin: 0; padding-left: 1.1rem; line-height: 1.45;">
                ${items.map(it => `<li contenteditable="true">${escH(getItemText(it))}</li>`).join("")}
              </ul>
            `}
          </div>
        `;
      }

      // 2. Kısa Okuma Metni
      if (sType === "reading_passage" || sType === "reading") {
        const questions = getItems(sec.questions || sec.items);
        const badge = letters[badgeIdx % letters.length];
        badgeIdx++;
        const instr = cleanInstruction(sec.instruction, "Metne göre aşağıdaki soruları cevaplayınız.");
        return `
          <div class="hw-a4-section">
            <div class="hw-a4-reading-box">
              <div class="hw-a4-reading-title" contenteditable="true">${escH(sec.title || "Okuma Metni")}</div>
              <div class="hw-a4-reading-text" contenteditable="true">${escH(sec.text || "")}</div>
            </div>
            ${questions.length > 0 ? `
              <div class="hw-a4-section-title" contenteditable="true">
                <span class="hw-a4-badge-circle">${badge}</span>
                <span>${escH(instr)}</span>
              </div>
              <div class="hw-a4-grid-2">
                ${questions.map((q, qIdx) => `
                  <div class="hw-a4-q-card">
                    <div contenteditable="true"><strong>${qIdx + 1}.</strong> ${escH(getItemText(q))}</div>
                    <div class="hw-a4-answer-line"></div>
                  </div>
                `).join("")}
              </div>
            ` : ""}
          </div>
        `;
      }

      // 3. Eşleştirme Etkinliği
      if (sType === "matching" || sType === "word_match") {
        const pairs = Array.isArray(sec.pairs) ? sec.pairs : getItems(sec);
        if (pairs.length === 0) return "";
        const badge = letters[badgeIdx % letters.length];
        badgeIdx++;
        const instr = cleanInstruction(sec.instruction, "Aşağıdaki kavramları uygun ifadelerle eşleştirerek parantez içine harfini yazınız.");
        const matchLetters = ["a", "b", "c", "d", "e", "f", "g", "h"];

        // Sağ sütunu deterministik olarak kaydır (1. kavram doğrudan a ile karşılıklı gelmesin)
        const rightItems = pairs.map((p, idx) => ({
          text: p.right || p.match || p.answer || "",
          origIdx: idx
        }));
        const shiftedRight = rightItems.map((_, idx, arr) => {
          if (arr.length <= 1) return arr[idx];
          const shiftedIndex = (idx + 2) % arr.length;
          return arr[shiftedIndex];
        });

        return `
          <div class="hw-a4-section">
            <div class="hw-a4-section-title" contenteditable="true">
              <span class="hw-a4-badge-circle">${badge}</span>
              <span>${escH(instr)}</span>
            </div>
            <div class="hw-a4-matching-grid">
              ${pairs.map((p, idx) => {
                const leftText = p.left || p.word || p.concept || p.question || "";
                const rightObj = shiftedRight[idx] || { text: "" };
                const letterCode = matchLetters[idx % matchLetters.length];
                return `
                  <div class="hw-a4-matching-row">
                    <div class="hw-a4-match-left">
                      <span class="hw-a4-match-num">${idx + 1}</span>
                      <span contenteditable="true" style="flex: 1;">${escH(leftText)}</span>
                      <span class="hw-a4-match-code">( &nbsp; )</span>
                    </div>
                    <div class="hw-a4-match-right">
                      <span class="hw-a4-match-num">${letterCode})</span>
                      <span contenteditable="true" style="flex: 1;">${escH(rightObj.text)}</span>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        `;
      }

      // 4. Boşluk Doldurma
      if (sType === "fill_blanks") {
        const fillItems = getItems(sec);
        if (fillItems.length === 0) return "";
        const badge = letters[badgeIdx % letters.length];
        badgeIdx++;
        const instr = cleanInstruction(sec.instruction, "Aşağıdaki cümlelerde boş bırakılan yerleri uygun kelimelerle tamamlayınız.");
        const words = Array.isArray(sec.wordBank) ? sec.wordBank : [];
        return `
          <div class="hw-a4-section">
            <div class="hw-a4-section-title" contenteditable="true">
              <span class="hw-a4-badge-circle">${badge}</span>
              <span>${escH(instr)}</span>
            </div>
            ${words.length > 0 ? `
              <div class="hw-a4-word-bank" contenteditable="true">
                [ ${words.map(w => escH(w)).join(" &bull; ")} ]
              </div>
            ` : ""}
            <div style="display: flex; flex-direction: column; gap: 0.42rem; font-size: 0.8rem; color: #334155;">
              ${fillItems.map((item, idx) => `
                <div contenteditable="true">${idx + 1}. ${escH(getItemText(item))}</div>
              `).join("")}
            </div>
          </div>
        `;
      }

      // 5. Doğru / Yanlış
      if (sType === "true_false") {
        const tfItems = getItems(sec);
        if (tfItems.length === 0) return "";
        const badge = letters[badgeIdx % letters.length];
        badgeIdx++;
        const instr = cleanInstruction(sec.instruction, "Aşağıdaki ifadelerden doğru olanların başına (D), yanlış olanların başına (Y) yazınız.");
        return `
          <div class="hw-a4-section">
            <div class="hw-a4-section-title" contenteditable="true">
              <span class="hw-a4-badge-circle">${badge}</span>
              <span>${escH(instr)}</span>
            </div>
            <div>
              ${tfItems.map((item, idx) => `
                <div class="hw-a4-tf-row">
                  <span class="hw-a4-tf-bubble">( )</span>
                  <span contenteditable="true">${idx + 1}. ${escH(getItemText(item))}</span>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }

      // 6. Çoktan Seçmeli Test
      if (sType === "multiple_choice") {
        const questions = getItems(sec.questions || sec);
        if (questions.length === 0) return "";
        const badge = letters[badgeIdx % letters.length];
        badgeIdx++;
        const instr = cleanInstruction(sec.instruction, "Aşağıdaki çoktan seçmeli sorularda doğru seçeneği işaretleyiniz.");
        return `
          <div class="hw-a4-section">
            <div class="hw-a4-section-title" contenteditable="true">
              <span class="hw-a4-badge-circle">${badge}</span>
              <span>${escH(instr)}</span>
            </div>
            <div class="hw-a4-grid-2">
              ${questions.map((q, idx) => `
                <div class="hw-a4-test-q">
                  <p style="font-weight: 800; color: #0f172a; margin-bottom: 0.3rem;" contenteditable="true">
                    ${idx + 1}. ${escH(q.questionText || q.question || getItemText(q))}
                  </p>
                  <div style="display: flex; flex-direction: column; gap: 0.18rem;">
                    ${(q.options || []).map(opt => `
                      <div class="hw-a4-opt" contenteditable="true">${escH(opt)}</div>
                    `).join("")}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }

      // 7. Alt Alta Matematik İşlemleri
      if (sType === "math_operations" || sType === "math_operation" || sType === "calculations" || sType === "operations") {
        const badge = letters[badgeIdx % letters.length];
        badgeIdx++;
        return renderMathOperationsSection(sec, badge);
      }

      // 8. Açık Uçlu Sorular (Varsayılan) / Matematik İşlemleri Kontrolü
      const openItems = getItems(sec);
      if (openItems.length === 0) return "";
      const badge = letters[badgeIdx % letters.length];
      badgeIdx++;

      // Eğer açık uçlu sorular aslında matematik işlemleriyse otomatik alt alta kartlara dönüştür
      const parsedOps = openItems.map(parseMathItem).filter(Boolean);
      if (parsedOps.length >= Math.ceil(openItems.length * 0.7) && parsedOps.length >= 2) {
        return renderMathOperationsSection({
          instruction: cleanInstruction(sec.instruction, "Aşağıdaki matematik işlemlerini alt alta yapınız:"),
          items: parsedOps
        }, badge);
      }

      const instr = cleanInstruction(sec.instruction, "Aşağıdaki soruları kısaca cevaplayınız.");
      return `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">${badge}</span>
            <span>${escH(instr)}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.55rem;">
            ${openItems.map((item, idx) => `
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.55rem 0.7rem; background: #f8fafc; font-size: 0.8rem;">
                <span style="font-weight: 750; color: #1e293b;" contenteditable="true">${idx + 1}. ${escH(getItemText(item))}</span>
                <div class="hw-a4-answer-line"></div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }).join("");
  }

  // ─── Yazdırma & Ödeve Aktarma İşlemleri ────────────────────────────────────
  function printWorksheet() {
    const sheet = document.getElementById("hw-robot-a4-sheet");
    if (!sheet) return;

    let printContainer = document.querySelector(".homework-robot-print-container");
    if (!printContainer) {
      printContainer = document.createElement("div");
      printContainer.className = "homework-robot-print-container";
      document.body.appendChild(printContainer);
    }

    printContainer.innerHTML = sheet.innerHTML;
    // Yazdırma esnasında tüm sayfaların (önizlemede gizli olanların da) basılmasını sağla
    printContainer.querySelectorAll(".hw-a4-page-card").forEach(c => {
      c.classList.remove("preview-hidden-page");
    });
    printContainer.classList.toggle("multi-page-mode", sheet.classList.contains("multi-page-mode"));
    if (HwState.isEcoMode) {
      printContainer.classList.add("fotokopi-mode");
    } else {
      printContainer.classList.remove("fotokopi-mode");
    }

    // Yazdırma esnasında A4 sayfa marjının sıfırlanmasını garanti altına al (C bölümünün taşmasını önler)
    let styleOverride = document.getElementById("hw-robot-print-page-style");
    if (!styleOverride) {
      styleOverride = document.createElement("style");
      styleOverride.id = "hw-robot-print-page-style";
      styleOverride.textContent = "@page { size: A4 portrait; margin: 0 !important; }";
      document.head.appendChild(styleOverride);
    }

    const cleanupPrint = () => {
      document.body.classList.remove("print-homework-robot");
      const st = document.getElementById("hw-robot-print-page-style");
      if (st && st.parentNode) st.parentNode.removeChild(st);
      if (printContainer) printContainer.innerHTML = "";
    };

    document.body.classList.add("print-homework-robot");
    window.print();

    window.addEventListener("afterprint", cleanupPrint, { once: true });
    setTimeout(cleanupPrint, 12000);
  }

  function toggleEcoMode() {
    HwState.isEcoMode = !HwState.isEcoMode;
    const btn = document.getElementById("btn-hw-robot-toggle-eco");
    if (btn) {
      if (HwState.isEcoMode) {
        btn.classList.add("active");
        btn.innerHTML = '<span>✅</span> <span>Fotokopi Modu Açık</span>';
      } else {
        btn.classList.remove("active");
        btn.innerHTML = '<span>🖨️</span> <span>Fotokopi (Eco) Modu</span>';
      }
    }

    if (HwState.generatedData) {
      renderWorksheetToA4(HwState.generatedData);
    } else {
      const paper = document.getElementById("hw-robot-a4-sheet");
      if (paper) paper.classList.toggle("fotokopi-mode", HwState.isEcoMode);
    }
  }

  function saveToHomeworkModule() {
    if (!HwState.generatedData) {
      notifyUser("Lütfen önce bir ödev oluşturun!", "warning");
      return;
    }

    const title = HwState.generatedData.title || `${HwState.selectedLesson} Çalışma Kağıdı`;
    const desc = `${HwState.selectedGrade}. Sınıf ${HwState.selectedLesson} - ${HwState.selectedOutcomes.map(o => o.text).join(", ") || 'Haftalık Kazanım Ödevi'}`;

    // Mevcut Ödev Ekle modalına aktar
    const titleInput = document.getElementById("hw-send-title-input") || document.getElementById("homework-title-input");
    const descInput = document.getElementById("hw-send-desc-input") || document.getElementById("homework-desc-input");

    if (titleInput && descInput) {
      titleInput.value = title;
      descInput.value = desc;
      notifyUser("✓ Ödev başlığı ve bilgileri Ödev Takip modülüne aktarıldı!", "success");

      // Eğer Ödev Ver modalı varsa aç
      const modal = document.getElementById("modal-hw-send") || document.getElementById("modal-homework");
      if (modal) {
        modal.classList.add("show");
        modal.style.display = "flex";
      }
    } else {
      notifyUser(`Ödev bilgileri hazırlandı: "${title}"`, "info");
    }
  }

  // ─── Örnek Başlangıç Şablonu Gösterimi ──────────────────────────────────────
  function buildSampleSectionByType(type, pageNum) {
    switch (type) {
      case "rule_summary":
        return {
          type: "rule_summary",
          title: "Konu Özeti ve Hatırlatma",
          items: [
            "Cümle içinde eş ve zıt anlamlı sözcükler anlamı zenginleştirir.",
            "Noktalama işaretleri okuma ve anlamayı kolaylaştırır."
          ]
        };
      case "reading_passage":
        return {
          type: "reading_passage",
          title: "Kütüphanedeki Sürpriz",
          text: "Elif ve Kerem okul kütüphanesinde eski bir atlas buldular. Atlasın sayfalarını çevirdikçe farklı kıtaları, nehirleri ve dağları keşfettiler. Öğretmenleri onlara araştırma yapmanın yeni dünyaların kapısını açtığını söyledi.",
          questions: [
            { question: "Elif ve Kerem okul kütüphanesinde ne buldular?" },
            { question: "Öğretmenleri araştırma yapmak hakkında ne söyledi?" }
          ]
        };
      case "matching":
        return {
          type: "matching",
          instruction: "Aşağıdaki kavramları uygun açıklamalarla eşleştirerek parantez içine harfini yazınız.",
          pairs: [
            { left: "Nokta ( . )", right: "Tamamlanmış cümlelerin sonuna konur." },
            { left: "Soru İşareti ( ? )", right: "Soru anlamı taşıyan ifadelerin sonuna konur." },
            { left: "Ünlem ( ! )", right: "Sevinç, heyecan veya korku bildiren cümlelere konur." },
            { left: "Kesme İşareti ( ' )", right: "Özel isimlere gelen çekim eklerini ayırır." }
          ]
        };
      case "fill_blanks":
        return {
          type: "fill_blanks",
          instruction: "Aşağıdaki cümlelerde boş bırakılan yerleri kutudaki uygun kelimelerle tamamlayınız.",
          wordBank: ["eş anlamlı", "zıt anlamlı", "büyük harf", "virgül"],
          items: [
            { sentence: "Anlamları birbirinin tam tersi olan kelimelere .................... kelimeler denir." },
            { sentence: "Eş görevli kelimeleri ayırmak için aralara .................... konur." },
            { sentence: "Yazılışları farklı, anlamları aynı olan sözcüklere .................... sözcükler denir." }
          ]
        };
      case "true_false":
        return {
          type: "true_false",
          instruction: "Aşağıdaki ifadelerden doğru olanların başına (D), yanlış olanların başına (Y) yazınız.",
          items: [
            { statement: "Cümleler her zaman büyük harfle başlar." },
            { statement: "Soru cümlelerinin sonuna üç nokta konur." },
            { statement: "Özel isimlerin ilk harfi her zaman büyük yazılır." },
            { statement: "'Siyah' ve 'kara' kelimeleri zıt anlamlıdır." }
          ]
        };
      case "multiple_choice":
        return {
          type: "multiple_choice",
          instruction: "Aşağıdaki çoktan seçmeli sorularda doğru seçeneği işaretleyiniz.",
          questions: [
            {
              questionText: "Aşağıdaki kelimelerden hangisi 'hediye' sözcüğünün eş anlamlısıdır?",
              options: ["A) Armağan", "B) Görev", "C) Ödül", "D) Misafir"]
            },
            {
              questionText: "Hangi cümlenin sonuna soru işareti (?) konulmalıdır?",
              options: ["A) Bugün hava çok güzel", "B) Ödevlerini bitirdin mi", "C) Eyvah, servis kaçtı", "D) Kitabımı çantama koydum"]
            }
          ]
        };
      case "math_operations":
        return {
          type: "math_operations",
          instruction: "Aşağıdaki toplama işlemlerini alt alta yapınız ve sonuçları kutucuklara yazınız.",
          items: [
            { num1: 345, num2: 218, operator: "+", result: 563 },
            { num1: 526, num2: 194, operator: "+", result: 720 },
            { num1: 417, num2: 328, operator: "+", result: 745 },
            { num1: 639, num2: 182, operator: "+", result: 821 },
            { num1: 274, num2: 458, operator: "+", result: 732 },
            { num1: 503, num2: 298, operator: "+", result: 801 },
            { num1: 189, num2: 467, operator: "+", result: 656 },
            { num1: 612, num2: 249, operator: "+", result: 861 }
          ]
        };
      case "open_ended":
      default:
        return {
          type: "open_ended",
          instruction: `Aşağıdaki açık uçlu soruları cevaplayınız.${pageNum > 1 ? ` (Bölüm ${pageNum})` : ""}`,
          items: [
            { question: "Kitap okumanın bize kazandırdığı faydalardan iki tanesini yazınız." },
            { question: "İçinde 'sorumluluk' kelimesi geçen kurallı ve anlamlı bir cümle kurunuz." }
          ]
        };
    }
  }

  function showSampleFlexibleWorksheet() {
    syncFlexibleStateFromDOM();
    const pageCount = HwState.flexiblePageCount || 1;
    const acts = HwState.flexibleActivities.length > 0
      ? HwState.flexibleActivities
      : ["matching", "fill_blanks", "true_false", "open_ended"];

    const pages = [];
    for (let p = 1; p <= pageCount; p++) {
      const pageSections = acts.map(actKey => buildSampleSectionByType(actKey, p));
      pages.push({
        pageNumber: p,
        sections: pageSections
      });
    }

    const sampleFlexible = {
      isSample: true,
      title: `Esnek Kazanım Çalışma Kağıdı (${pageCount} Sayfa A4)`,
      subject: HwState.selectedLesson || "Türkçe",
      grade: `${HwState.selectedGrade || "3"}. Sınıf`,
      templateType: "custom_flexible",
      pageCount,
      schoolName: "2026-2027 EĞİTİM ÖĞRETİM YILI",
      pages,
      teacherNote: "Seçtiğiniz etkinlik türlerine ve sayfa sayısına göre örnek önizleme. 'Ödevi Hazırla' butonuyla kazanıma özel üretebilirsiniz."
    };

    HwState.generatedData = sampleFlexible;
    renderWorksheetToA4(sampleFlexible);
  }

  function showSampleInitialWorksheet() {
    const sampleData = {
      isSample: true,
      title: "Genel Kazanım Pekiştirme ve Çalışma Kağıdı",
      subject: "Türkçe",
      grade: "3. Sınıf",
      templateType: "mixed_worksheet",
      schoolName: "2026-2027 EĞİTİM ÖĞRETİM YILI",
      ruleBox: "Sol panelden ders ve kazanım seçerek yapay zeka ile saniyeler içinde sınıfınıza özel çalışma kağıtları hazırlayabilirsiniz.",
      trueFalseSection: {
        instruction: "Aşağıdaki ifadelerden doğru olanların başına (D), yanlış olanların başına (Y) yazınız.",
        items: [
          { statement: "Cümleler her zaman büyük harfle başlar.", answer: "D" },
          { statement: "Soru anlamı taşıyan cümlelerin sonuna nokta konur.", answer: "Y" },
          { statement: "Özel isimlere getirilen çekim ekleri kesme işaretiyle ayrılır.", answer: "D" },
          { statement: "Eş anlamlı kelimelerin yazılışları aynı, anlamları farklıdır.", answer: "Y" }
        ]
      },
      fillBlanksSection: {
        instruction: "Aşağıdaki cümlelerde boş bırakılan yerleri uygun kelimelerle tamamlayınız.",
        wordBank: ["kesme işareti", "eş anlamlı", "ünlem", "zıt anlamlı"],
        items: [
          { sentence: "Anlamları birbirinin tam tersi olan kelimelere .................... kelimeler denir.", answer: "zıt anlamlı" },
          { sentence: "Sevinç, korku, heyecan gibi duyguları belirten cümlelerin sonuna .................... konur.", answer: "ünlem" },
          { sentence: "Yazılışları farklı ancak anlamları aynı olan sözcüklere .................... sözcükler denir.", answer: "eş anlamlı" }
        ]
      },
      openEndedSection: {
        instruction: "Aşağıdaki soruları kısaca cevaplayınız.",
        items: [
          { question: "Kitap okumanın bize kazandırdığı faydalardan iki tanesini yazınız." },
          { question: "İçinde 'okul' kelimesi geçen kurallı ve anlamlı bir cümle kurunuz." }
        ]
      },
      teacherNote: "Kazanım başarıyla tamamlandı. Gayretini tebrik ederim!"
    };

    HwState.generatedData = sampleData;
    renderWorksheetToA4(sampleData);
  }

  // ─── Modül Başlatıcı ───────────────────────────────────────────────────────
  function initHomeworkGenerator() {
    loadAvailableLessons();
    setupTemplateCards();
    setupFlexibleControls();

    if (!_eventsInitialized) {
      _eventsInitialized = true;

      const lessonSelect = document.getElementById("hw-robot-lesson-select");
      const gradeSelect = document.getElementById("hw-robot-grade-select");
      const unitSelect = document.getElementById("hw-robot-unit-select");
      const searchInput = document.getElementById("hw-robot-outcome-search");
      const btnGenerate = document.getElementById("btn-hw-robot-generate");
      const btnEco = document.getElementById("btn-hw-robot-toggle-eco");
      const btnPrint = document.getElementById("btn-hw-robot-print");
      const btnTransfer = document.getElementById("btn-hw-robot-transfer-hw");

      if (lessonSelect) lessonSelect.addEventListener("change", onLessonOrGradeChanged);
      if (gradeSelect) gradeSelect.addEventListener("change", onLessonOrGradeChanged);
      if (unitSelect) unitSelect.addEventListener("change", () => renderOutcomesChecklist());
      if (searchInput) searchInput.addEventListener("input", () => renderOutcomesChecklist());

      if (btnGenerate) btnGenerate.addEventListener("click", generateHomeworkContent);
      if (btnEco) btnEco.addEventListener("click", toggleEcoMode);
      if (btnPrint) btnPrint.addEventListener("click", printWorksheet);
      if (btnTransfer) btnTransfer.addEventListener("click", saveToHomeworkModule);

      // Başlangıçta örnek bir şablon çiz
      showSampleInitialWorksheet();
    }
  }

  window.initHomeworkGenerator = initHomeworkGenerator;

})();
