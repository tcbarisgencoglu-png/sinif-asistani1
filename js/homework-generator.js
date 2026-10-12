/**
 * homework-generator.js
 * Sınıf Asistanı — Ödev ve Çalışma Kağıdı Hazırlama Robotu
 * 
 * Özellikler:
 * - Yıllık plan kazanımlarını (state.plans & MEB_CURRICULUM_DATA) otomatik çekme
 * - 5 Farklı Lego Şablonu:
 *   1. Matematik & Sayı Modelleme (Sayı-Okunuş + Dinamik Vektörel SVG Abaküs)
 *   2. Karma Çalışma Kağıdı (Boşluk Doldurma, Doğru/Yanlış, Açık Uçlu)
 *   3. 2 Sütunlu Kazanım Testi (Çoktan seçmeli, cevap kodlama kutucukları, cevap anahtarı)
 *   4. Türkçe Okuma Anlama & 5N1K (Özgün seviye metni, 5N1K soruları, sözcük etkinlikleri)
 *   5. Hafta Sonu Ödev Fasikülü (Özet kutusu, karma pekiştirme, yıldız puanlama, veli imzası)
 * - Renkli ve Fotokopi Dostu (Siyah-Beyaz Eco) modları
 * - Canlı Düzenlenebilir (contenteditable) A4 mizanpajı (.hw-a4-* sınıfları ile)
 * - A4 Baskı & PDF Dışa Aktarma
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
    selectedTemplate: "math_models", // math_models | mixed_worksheet | outcome_test | reading_comp | weekly_homework
    difficulty: "orta", // temel | orta | yeni_nesil
    itemCount: 4,
    isEcoMode: false,
    generatedData: null,
    isGenerating: false
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

  // ─── Şablon Seçimi ─────────────────────────────────────────────────────────
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
        console.log("[HwRobot] Seçilen şablon:", HwState.selectedTemplate);
      });
    });
  }

  // ─── Dinamik Vektörel SVG Çiziciler (Abaküs Motoru) ────────────────────────
  function renderSvgAbacus(numberStr, isEco = false) {
    const digits = String(numberStr).replace(/\s+/g, "").split("").map(d => parseInt(d, 10) || 0);
    const rodCount = Math.max(3, Math.min(6, digits.length));
    const padDigits = digits.slice(-rodCount); // son rodCount kadar basamak

    const width = 240;
    const height = 100;
    const standY = 80;
    const standHeight = 16;
    const rodTop = 14;
    const stepX = (width - 40) / (rodCount - 1 || 1);

    // Renk paleti
    const rodColor = isEco ? "#333333" : "#78350f";
    const standFill = isEco ? "#e2e8f0" : "#d97706";
    const standBorder = isEco ? "#333333" : "#92400e";
    const beadColors = isEco 
      ? ["#475569", "#334155", "#64748b", "#1e293b", "#475569", "#334155"]
      : ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

    let rodsSvg = "";
    padDigits.forEach((val, idx) => {
      const cx = 20 + (idx * stepX);
      const bColor = beadColors[idx % beadColors.length];

      // Çubuk
      rodsSvg += `<line x1="${cx}" y1="${rodTop}" x2="${cx}" y2="${standY}" stroke="${rodColor}" stroke-width="2.5" stroke-linecap="round" />`;

      // Boncuklar (Maksimum 9 adet)
      const count = Math.min(9, Math.max(0, val));
      const beadHeight = 6.5;
      const beadWidth = 16;
      for (let b = 0; b < count; b++) {
        const by = standY - ((b + 1) * (beadHeight + 1.2));
        rodsSvg += `
          <rect x="${cx - (beadWidth / 2)}" y="${by}" width="${beadWidth}" height="${beadHeight}" rx="3" 
                fill="${bColor}" stroke="${isEco ? '#1e293b' : 'rgba(0,0,0,0.15)'}" stroke-width="1" />
        `;
      }
    });

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="hw-robot-abacus-svg" style="display: block; margin: 0 auto;">
        <!-- Stand Tabanı -->
        <rect x="8" y="${standY}" width="${width - 16}" height="${standHeight}" rx="4" fill="${standFill}" stroke="${standBorder}" stroke-width="1.5" />
        <rect x="12" y="${standY - 2}" width="${width - 24}" height="4" rx="2" fill="${isEco ? '#cbd5e1' : '#f59e0b'}" />
        <!-- Çubuklar ve Boncuklar -->
        ${rodsSvg}
      </svg>
    `;
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
    const outcomeText = outcomes.length > 0 ? outcomes.join(";\n- ") : (customTopic || "Genel Konu Tekrarı");
    const diffDesc = difficulty === "temel" ? "Temel düzeyde, anlaşılır, pekiştirici" : (difficulty === "yeni_nesil" ? "Beceri temelli, yeni nesil, görsel-mantık muhakeme" : "Müfredata uygun orta zorlukta");

    let templateSpec = "";
    let jsonSchema = "";

    switch (template) {
      case "math_models":
        templateSpec = `
ŞABLON: MATEMATİK & SAYI MODELLEME
Gereksinimler:
1. "ruleBox": Konuyla ilgili 1-2 cümlelik pratik bilgi veya kural hatırlatması.
2. "section1": Sayı verilip Türkçe okunuşunun istendiği 3 adet alıştırma (items: [{ "number": "...", "readingPlaceholder": "..." }]).
3. "section2": Türkçe okunuş verilip rakamla yazılışının istendiği 3 adet alıştırma (items: [{ "reading": "...", "answer": "..." }]).
4. "section3": Abaküsle gösterilecek sayılar (abacusList: [{ "number": "..." }, { "number": "..." }]). Sayılar ${grade}. sınıf seviyesine uygun olmalıdır.
`;
        jsonSchema = `{
  "title": "${grade}. Sınıf ${lesson} Çalışma Kağıdı",
  "subject": "${lesson}",
  "grade": "${grade}. Sınıf",
  "templateType": "math_models",
  "ruleBox": "...",
  "section1": { "instruction": "Aşağıdaki doğal sayıların okunuşlarını karşılarındaki kutucuklara yazalım.", "items": [{ "number": "123456", "readingPlaceholder": "" }] },
  "section2": { "instruction": "Okunuşları verilen doğal sayıları rakamla kutucuklara yazalım.", "items": [{ "reading": "üç yüz sekiz bin iki yüz", "answer": "308200" }] },
  "section3": { "instruction": "Abaküsle modellenen sayıların okunuşlarını altlarına yazalım.", "abacusList": [{ "number": "314205" }, { "number": "250142" }] },
  "teacherNote": "Harika bir çalışma oldu!"
}`;
        break;

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

${templateSpec}

LÜTFEN YALNIZCA AŞAĞIDAKİ GEÇERLİ JSON YAPISINDA ÇIKTI ÜRET:
${jsonSchema}
`;
  }

  function setGeneratingState(isGen) {
    HwState.isGenerating = isGen;
    const btn = document.getElementById("btn-hw-robot-generate");
    const loader = document.getElementById("hw-robot-loading-indicator");
    if (btn) {
      btn.disabled = isGen;
      btn.innerHTML = isGen ? '<span>⏳</span> Hazırlanıyor...' : '<i data-lucide="sparkles" style="width: 16px; height: 16px;"></i> <span>Ödevi Hazırla</span>';
      if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
    }
    if (loader) {
      loader.style.display = isGen ? "flex" : "none";
    }
  }

  // ─── Canlı A4 Mizanpaj Çizimi (Lego Render) ────────────────────────────────
  function renderWorksheetToA4(data) {
    const paper = document.getElementById("hw-robot-a4-sheet");
    if (!paper) return;

    // Şablon tipini KESİNLİKLE kullanıcının seçtiği HwState.selectedTemplate'e göre belirle
    const tType = HwState.selectedTemplate || data.templateType || "mixed_worksheet";
    const isEco = HwState.isEcoMode;

    console.log("[HwRobot] A4 Çizimi yapılıyor. Şablon tipi:", tType, "Ders:", data.subject);

    let bodyHtml = "";

    // 1. ŞABLON: Matematik & Sayı Modelleme
    if (tType === "math_models") {
      bodyHtml = renderMathTemplate(data, isEco);
    }
    // 2. ŞABLON: Okuma Anlama & 5N1K
    else if (tType === "reading_comp") {
      bodyHtml = renderReadingTemplate(data, isEco);
    }
    // 3. ŞABLON: 2 Sütunlu Test
    else if (tType === "outcome_test") {
      bodyHtml = renderTestTemplate(data, isEco);
    }
    // 4. ŞABLON: Hafta Sonu Fasikülü
    else if (tType === "weekly_homework") {
      bodyHtml = renderWeeklyTemplate(data, isEco);
    }
    // 5. ŞABLON: Karma Çalışma Kağıdı
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

  // ─── 1. MATEMATİK & ABAKÜS ŞABLON RENDERER ────────────────────────────────
  function renderMathTemplate(data, isEco) {
    let html = "";

    // Kural Kutusu
    if (data.ruleBox) {
      html += `
        <div class="hw-a4-rule-box" contenteditable="true">
          💡 <strong>Hatırlayalım:</strong> ${escH(data.ruleBox)}
        </div>
      `;
    }

    // Bölüm 1: Sayı Verilir, Okunuşu İstenir
    const s1Items = getItems(data.section1);
    if (s1Items.length > 0) {
      const instr = (data.section1 && data.section1.instruction) || "Aşağıdaki doğal sayıların okunuşlarını karşılarındaki kutucuklara yazalım.";
      html += `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">A</span>
            <span>${escH(instr)}</span>
          </div>
          <div>
            ${s1Items.map(item => `
              <div class="hw-a4-pill-row">
                <div class="hw-a4-num-pill" contenteditable="true">${escH(item.number || "123 456")}</div>
                <div class="hw-a4-write-box" contenteditable="true">${escH(item.readingPlaceholder || "")}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // Bölüm 2: Okunuş Verilir, Sayı İstenir
    const s2Items = getItems(data.section2);
    if (s2Items.length > 0) {
      const instr = (data.section2 && data.section2.instruction) || "Okunuşları verilen doğal sayıları rakamla kutucuklara yazalım.";
      html += `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">B</span>
            <span>${escH(instr)}</span>
          </div>
          <div>
            ${s2Items.map(item => `
              <div class="hw-a4-pill-row">
                <div class="hw-a4-text-pill" contenteditable="true">${escH(item.reading || item.text || "iki yüz bin kırk beş")}</div>
                <div class="hw-a4-num-box" contenteditable="true">_ _ _ _ _ _</div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // Bölüm 3: Dinamik Abaküs Modelleri
    const abacusList = Array.isArray(data.section3?.abacusList) ? data.section3.abacusList : (Array.isArray(data.abacusList) ? data.abacusList : []);
    if (abacusList.length > 0) {
      const instr = (data.section3 && data.section3.instruction) || "Abaküsle modellenen sayıların okunuşlarını altlarına yazalım.";
      html += `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">C</span>
            <span>${escH(instr)}</span>
          </div>
          <div class="hw-a4-grid-2">
            ${abacusList.map(ab => `
              <div class="hw-a4-abacus-card">
                <div style="width: 100%; display: flex; justify-content: center; padding: 4px 0;">
                  ${renderSvgAbacus(ab.number, isEco)}
                </div>
                <div class="hw-a4-abacus-answer" contenteditable="true">
                  Sayı: ${escH(ab.number)} &bull; (Öğrenci okunuşunu yazar)
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    return html;
  }

  // ─── 2. OKUMA ANLAMA & 5N1K ŞABLON RENDERER ──────────────────────────────
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
      const instr = (data.trueFalseSection && data.trueFalseSection.instruction) || "Aşağıdaki ifadelerden doğru olanlara (D), yanlış olanlara (Y) yazınız.";
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
      const instr = (data.fillBlanksSection && data.fillBlanksSection.instruction) || "Aşağıdaki cümlelerde boş bırakılan yerleri tamamlayınız.";
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
      const instr = (data.openEndedSection && data.openEndedSection.instruction) || "Aşağıdaki soruları kısaca cevaplayınız:";
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

    // 1. Bölüm: Doğru / Yanlış
    const tfItems = getItems(data.trueFalseSection || data.trueFalse);
    if (tfItems.length > 0) {
      const instr = (data.trueFalseSection && data.trueFalseSection.instruction) || "Aşağıdaki ifadelerden doğru olanların başına (D), yanlış olanların başına (Y) yazınız.";
      html += `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">A</span>
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
      const instr = (data.fillBlanksSection && data.fillBlanksSection.instruction) || "Aşağıdaki cümlelerde boş bırakılan yerleri uygun kelimelerle tamamlayınız.";
      const words = Array.isArray(data.fillBlanksSection?.wordBank) ? data.fillBlanksSection.wordBank : (Array.isArray(data.wordBank) ? data.wordBank : []);
      html += `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">B</span>
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

    // 3. Bölüm: Açık Uçlu Sorular
    const openItems = getItems(data.openEndedSection || data.openEnded || data.questions);
    if (openItems.length > 0) {
      const instr = (data.openEndedSection && data.openEndedSection.instruction) || "Aşağıdaki soruları kısaca cevaplayınız:";
      html += `
        <div class="hw-a4-section">
          <div class="hw-a4-section-title" contenteditable="true">
            <span class="hw-a4-badge-circle">C</span>
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

    return html;
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
    if (HwState.isEcoMode) {
      printContainer.classList.add("fotokopi-mode");
    } else {
      printContainer.classList.remove("fotokopi-mode");
    }

    document.body.classList.add("print-homework-robot");
    window.print();

    window.addEventListener("afterprint", () => {
      document.body.classList.remove("print-homework-robot");
    }, { once: true });

    setTimeout(() => {
      document.body.classList.remove("print-homework-robot");
    }, 12000);
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
  function showSampleInitialWorksheet() {
    const sampleData = {
      title: "Altı Basamaklı Doğal Sayıları Yazma ve Modelleme",
      subject: "Matematik",
      grade: "4. Sınıf",
      templateType: "math_models",
      schoolName: "2026-2027 EĞİTİM ÖĞRETİM YILI",
      ruleBox: "Altı rakamdan oluşan doğal sayılara 'altı basamaklı doğal sayılar' denir. Okunurken önce binler bölüğü sonra birler bölüğü söylenir.",
      section1: {
        instruction: "Aşağıdaki doğal sayıların okunuşlarını karşılarındaki kutucuklara yazalım.",
        items: [
          { number: "123 456", readingPlaceholder: "(Örnek: yüz yirmi üç bin dört yüz elli altı)" },
          { number: "356 789", readingPlaceholder: "" },
          { number: "423 578", readingPlaceholder: "" }
        ]
      },
      section2: {
        instruction: "Okunuşları verilen doğal sayıları rakamla kutucuklara yazalım.",
        items: [
          { reading: "üç yüz sekiz bin iki yüz seksen üç", answer: "308283" },
          { reading: "dokuz yüz dört bin dört yüz kırk", answer: "904440" }
        ]
      },
      section3: {
        instruction: "Abaküsle modellenen altı basamaklı sayıların okunuşlarını altlarına yazalım.",
        abacusList: [
          { number: "314205" },
          { number: "250142" }
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
  window.renderSvgAbacus = renderSvgAbacus;

})();
