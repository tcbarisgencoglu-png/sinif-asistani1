/**
 * quiz-ai-generator.js
 * Yapay Zeka Destekli Bilgi Yarışması Soru Üretici
 * Öğretmenler Gemini AI kullanarak tek tıklamayla soru havuzu oluşturabilir.
 */

(function () {
  "use strict";

  // ─── Yardımcı Fonksiyonlar ─────────────────────────────────────────────────

  function escH(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function uid() {
    return "ai_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  let _currentUnitsMap = null;
  let _selectedOutcomes = []; // [{ text, topic, weekLabel, unitTitle }]
  let _eventsInitialized = false;

  // ─── Ders, Ünite ve Kazanım Hiyerarşik Seçim Mantığı ──────────────────────

  function populateLessonDropdown() {
    const dersSelect = document.getElementById("ai-ders-adi");
    const sinifSelect = document.getElementById("ai-sinif-seviyesi");
    if (!dersSelect) return;

    const state = (window.stateManager && window.stateManager.state) ? window.stateManager.state : {};

    // 1. Tanımlı dersler
    let lessons = [];
    if (window.stateManager && typeof window.stateManager.getLessons === "function") {
      lessons = window.stateManager.getLessons();
    } else if (state.definedLessons) {
      lessons = state.definedLessons;
    }

    // 2. Yıllık planlardaki dersler (eğer definedLessons içinde yoksa dahil et)
    const plans = state.plans || [];
    const lessonNames = new Set();

    lessons.forEach((l) => {
      if (l && l.name && String(l.name).trim()) {
        lessonNames.add(String(l.name).trim());
      }
    });

    plans.forEach((p) => {
      const pName = p ? String(p.courseName || p.title || "").trim() : "";
      if (pName) lessonNames.add(pName);
    });

    const sortedNames = Array.from(lessonNames).sort((a, b) => a.localeCompare(b, "tr"));

    let html = '<option value="">Ders Seçin...</option>';
    sortedNames.forEach((name) => {
      html += `<option value="${escH(name)}">${escH(name)}</option>`;
    });

    dersSelect.innerHTML = html;

    // Sınıf seviyesi henüz seçilmemişse öğretmenin sınıfına göre otomatik belirle
    if (sinifSelect && (!sinifSelect.value || sinifSelect.value === "")) {
      const cls = state.className || "";
      const m = String(cls).match(/(\d+)/);
      if (m && m[1]) {
        sinifSelect.value = m[1];
      }
    }
  }

  function onLessonChanged() {
    const dersSelect = document.getElementById("ai-ders-adi");
    const uniteSelect = document.getElementById("ai-unite-secimi");
    const searchInput = document.getElementById("ai-kazanim-search");
    const konuInput = document.getElementById("ai-konu-basligi");
    const sinifSelect = document.getElementById("ai-sinif-seviyesi");

    if (!dersSelect || !uniteSelect) return;

    const selectedLesson = dersSelect.value.trim();
    uniteSelect.innerHTML = "";
    _currentUnitsMap = null;
    _selectedOutcomes = [];
    onSelectedOutcomesUpdated();

    if (!selectedLesson) {
      uniteSelect.disabled = true;
      uniteSelect.innerHTML = '<option value="">Önce ders seçin...</option>';
      renderOutcomesChecklist();
      if (searchInput) searchInput.disabled = true;
      return;
    }

    const state = (window.stateManager && window.stateManager.state) ? window.stateManager.state : {};
    const plans = state.plans || [];

    const matchedPlan = plans.find((p) => {
      if (!p) return false;
      if (window.isLessonPlanMatch) {
        return window.isLessonPlanMatch(p.courseName || p.title, selectedLesson);
      }
      const cName = String(p.courseName || p.title || "").toLowerCase();
      return cName.includes(selectedLesson.toLowerCase()) || selectedLesson.toLowerCase().includes(cName);
    });

    // Plandaki sınıf seviyesi ile formdaki sınıf seviyesini eşitle
    if (matchedPlan && matchedPlan.className && sinifSelect) {
      const gradeMatch = String(matchedPlan.className).match(/(\d+)/);
      if (gradeMatch && gradeMatch[1]) {
        sinifSelect.value = gradeMatch[1];
      }
    }

    if (!matchedPlan) {
      uniteSelect.disabled = true;
      uniteSelect.innerHTML = '<option value="">Bu ders için yüklü yıllık plan bulunamadı</option>';
      renderOutcomesChecklist();
      if (searchInput) searchInput.disabled = true;
      if (konuInput && !konuInput.value) {
        konuInput.value = selectedLesson;
      }
      return;
    }

    const weeks = matchedPlan.weeklySchedule || matchedPlan.weeks || [];
    if (!weeks || weeks.length === 0) {
      uniteSelect.disabled = true;
      uniteSelect.innerHTML = '<option value="">Planda haftalık ders akışı bulunamadı</option>';
      renderOutcomesChecklist();
      if (searchInput) searchInput.disabled = true;
      return;
    }

    // Haftaları ünite bazında topla
    const unitsMap = new Map();

    weeks.forEach((w, idx) => {
      if (!w || w.isHoliday) return;

      let unitTitle = "";
      if (w.unitName && String(w.unitName).trim()) {
        const uNoStr = w.unitNo ? `${w.unitNo}. Ünite: ` : "";
        unitTitle = `${uNoStr}${String(w.unitName).trim()}`;
      } else if (w.topics && (Array.isArray(w.topics) ? w.topics.length > 0 : String(w.topics).trim())) {
        const t = Array.isArray(w.topics) ? w.topics.join(", ") : String(w.topics);
        unitTitle = t.trim();
      } else if (w.month || w.weekLabel) {
        unitTitle = `${w.month || ""} - ${w.weekLabel || (idx + 1) + ". Hafta"}`.trim();
      } else {
        unitTitle = "Genel";
      }

      let rawOutcomes = [];
      if (Array.isArray(w.learningOutcomes)) {
        rawOutcomes = w.learningOutcomes;
      } else if (typeof w.learningOutcomes === "string" && w.learningOutcomes.trim()) {
        rawOutcomes = w.learningOutcomes.split("\n");
      }

      const cleanOutcomes = rawOutcomes
        .map((o) => String(o).trim())
        .filter((o) => o.length > 0);

      // Kazanım yoksa konuları kazanım gibi ele al
      if (cleanOutcomes.length === 0 && w.topics) {
        const topicArr = Array.isArray(w.topics) ? w.topics : [w.topics];
        topicArr.forEach((t) => {
          if (t && String(t).trim()) cleanOutcomes.push(String(t).trim());
        });
      }

      if (cleanOutcomes.length === 0) return;

      if (!unitsMap.has(unitTitle)) {
        unitsMap.set(unitTitle, {
          title: unitTitle,
          outcomes: []
        });
      }

      const unitObj = unitsMap.get(unitTitle);
      const weekTopic = (Array.isArray(w.topics) && w.topics[0]) ? w.topics[0] : (w.unitName || unitTitle);
      const weekLabel = w.weekLabel || ((idx + 1) + ". Hafta");

      cleanOutcomes.forEach((outc) => {
        if (!unitObj.outcomes.some((existing) => existing.text === outc)) {
          unitObj.outcomes.push({
            text: outc,
            topic: weekTopic,
            weekLabel: weekLabel,
            unitTitle: unitTitle
          });
        }
      });
    });

    if (unitsMap.size === 0) {
      uniteSelect.disabled = true;
      uniteSelect.innerHTML = '<option value="">Planda kayıtlı kazanım bulunamadı</option>';
      renderOutcomesChecklist();
      if (searchInput) searchInput.disabled = true;
      return;
    }

    _currentUnitsMap = unitsMap;

    uniteSelect.disabled = false;
    let unitOptionsHtml = '<option value="">-- Ünite / Tema Seçin --</option>';
    unitOptionsHtml += '<option value="__all__">Tüm Üniteler (Tüm Kazanımlar)</option>';

    unitsMap.forEach((unitData, unitKey) => {
      unitOptionsHtml += `<option value="${escH(unitKey)}">${escH(unitData.title)} (${unitData.outcomes.length} Kazanım)</option>`;
    });

    uniteSelect.innerHTML = unitOptionsHtml;
    renderOutcomesChecklist();
  }

  function onUnitChanged() {
    const uniteSelect = document.getElementById("ai-unite-secimi");
    const konuInput = document.getElementById("ai-konu-basligi");
    const searchInput = document.getElementById("ai-kazanim-search");

    if (!uniteSelect) return;
    const selectedUnitKey = uniteSelect.value;

    if (searchInput) {
      searchInput.disabled = !selectedUnitKey;
      searchInput.value = "";
    }

    if (selectedUnitKey && selectedUnitKey !== "__all__" && _currentUnitsMap) {
      const unitData = _currentUnitsMap.get(selectedUnitKey);
      if (unitData && konuInput && (!konuInput.value || _selectedOutcomes.length === 0)) {
        const cleanTitle = unitData.title.replace(/^(?:\d+|[IVXLCDM]+)\.?\s*(?:Ünite|Tema)?\s*[:-]?\s*/i, "").trim() || unitData.title;
        konuInput.value = cleanTitle;
      }
    } else if (selectedUnitKey === "__all__" && konuInput && (!konuInput.value || _selectedOutcomes.length === 0)) {
      const dersSelect = document.getElementById("ai-ders-adi");
      if (dersSelect && dersSelect.value) {
        konuInput.value = `${dersSelect.value} (Genel Tekrar)`;
      }
    }

    renderOutcomesChecklist();
  }

  function getCurrentUnitOutcomes() {
    if (!_currentUnitsMap) return [];
    const uniteSelect = document.getElementById("ai-unite-secimi");
    if (!uniteSelect || !uniteSelect.value) return [];

    const selectedUnitKey = uniteSelect.value;
    if (selectedUnitKey === "__all__") {
      const all = [];
      _currentUnitsMap.forEach(u => all.push(...u.outcomes));
      return all;
    }
    const unit = _currentUnitsMap.get(selectedUnitKey);
    return unit ? unit.outcomes : [];
  }

  function renderOutcomesChecklist(filterText = "") {
    const container = document.getElementById("ai-kazanim-list-container");
    const searchInput = document.getElementById("ai-kazanim-search");
    if (!container) return;

    const outcomes = getCurrentUnitOutcomes();
    const q = filterText.trim().toLocaleLowerCase("tr-TR");

    if (!outcomes || outcomes.length === 0) {
      const uniteSelect = document.getElementById("ai-unite-secimi");
      const hasLesson = document.getElementById("ai-ders-adi")?.value;
      let msg = "Önce yukarıdan ders ve ünite seçin...";
      if (hasLesson && (!_currentUnitsMap || _currentUnitsMap.size === 0)) {
        msg = "Bu ders için plan bulunamadı. Kazanımları aşağıdaki kutuya kendiniz yazabilirsiniz.";
      } else if (hasLesson && (!uniteSelect || !uniteSelect.value)) {
        msg = "Lütfen yukarıdaki filtreden bir ünite seçin veya 'Tüm Üniteler'i seçin.";
      }
      container.innerHTML = `<div id="ai-kazanim-placeholder" style="text-align: center; color: var(--text-muted); padding: 1.5rem 0.5rem; font-size: 0.84rem;">${escH(msg)}</div>`;
      if (searchInput) searchInput.disabled = true;
      return;
    }

    if (searchInput) searchInput.disabled = false;

    let filtered = outcomes;
    if (q) {
      filtered = outcomes.filter(o =>
        (o.text && o.text.toLocaleLowerCase("tr-TR").includes(q)) ||
        (o.topic && o.topic.toLocaleLowerCase("tr-TR").includes(q)) ||
        (o.weekLabel && o.weekLabel.toLocaleLowerCase("tr-TR").includes(q))
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1.25rem 0.5rem; font-size: 0.84rem;">"${escH(filterText)}" ile eşleşen kazanım bulunamadı.</div>`;
      return;
    }

    let html = "";
    filtered.forEach((item, idx) => {
      const isChecked = _selectedOutcomes.some(o => o.text === item.text);
      const itemId = `chk-kazanim-${idx}`;
      html += `
        <label class="kazanim-check-item ${isChecked ? 'selected' : ''}" for="${itemId}">
          <input type="checkbox" id="${itemId}" class="kazanim-checkbox" data-text="${escH(item.text)}" data-topic="${escH(item.topic || '')}" data-week="${escH(item.weekLabel || '')}" data-unit="${escH(item.unitTitle || '')}" ${isChecked ? 'checked' : ''}>
          <div class="kazanim-check-content">
            <div class="kazanim-check-text">${escH(item.text)}</div>
            <div class="kazanim-check-meta">
              ${item.weekLabel ? `<span class="kazanim-tag"><i data-lucide="calendar" style="width:10px;height:10px;"></i> ${escH(item.weekLabel)}</span>` : ''}
              ${item.topic ? `<span class="kazanim-tag"><i data-lucide="bookmark" style="width:10px;height:10px;"></i> ${escH(item.topic)}</span>` : ''}
            </div>
          </div>
        </label>
      `;
    });

    container.innerHTML = html;
    if (window.safeCreateIcons) window.safeCreateIcons();

    // Checkbox event listeners
    const checkboxes = container.querySelectorAll(".kazanim-checkbox");
    checkboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        const text = cb.getAttribute("data-text");
        const topic = cb.getAttribute("data-topic");
        const weekLabel = cb.getAttribute("data-week");
        const unitTitle = cb.getAttribute("data-unit");
        const labelEl = cb.closest(".kazanim-check-item");

        if (cb.checked) {
          if (labelEl) labelEl.classList.add("selected");
          if (!_selectedOutcomes.some(o => o.text === text)) {
            _selectedOutcomes.push({ text, topic, weekLabel, unitTitle });
          }
        } else {
          if (labelEl) labelEl.classList.remove("selected");
          _selectedOutcomes = _selectedOutcomes.filter(o => o.text !== text);
        }

        onSelectedOutcomesUpdated();
      });
    });
  }

  function onSelectedOutcomesUpdated() {
    const badge = document.getElementById("ai-kazanim-count-badge");
    const chipsContainer = document.getElementById("ai-kazanim-selected-chips");
    const textarea = document.getElementById("ai-kazanim");
    const konuInput = document.getElementById("ai-konu-basligi");

    // 1. Badge güncelle
    if (badge) {
      const count = _selectedOutcomes.length;
      if (count === 0) {
        badge.textContent = "0 Kazanım Seçildi";
        badge.style.background = "rgba(59, 130, 246, 0.12)";
        badge.style.color = "var(--primary, #3b82f6)";
      } else if (count === 1) {
        badge.textContent = "1 Kazanım Seçildi";
        badge.style.background = "#dcfce7";
        badge.style.color = "#15803d";
      } else {
        badge.textContent = `✨ ${count} Kazanım Harmanlanıyor`;
        badge.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))";
        badge.style.color = "#7c3aed";
      }
    }

    // 2. Seçilen etiketler (chips)
    if (chipsContainer) {
      if (_selectedOutcomes.length === 0) {
        chipsContainer.style.display = "none";
        chipsContainer.innerHTML = "";
      } else {
        chipsContainer.style.display = "flex";
        let chipsHtml = "";
        _selectedOutcomes.forEach((o) => {
          const display = o.topic ? `[${o.topic}] ${o.text}` : o.text;
          chipsHtml += `
            <div class="kazanim-chip" title="${escH(display)}">
              <span class="kazanim-chip-text">${escH(display)}</span>
              <button type="button" class="kazanim-chip-remove" data-outcome="${escH(o.text)}" title="Kaldır">&times;</button>
            </div>
          `;
        });
        chipsContainer.innerHTML = chipsHtml;

        chipsContainer.querySelectorAll(".kazanim-chip-remove").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const textToRemove = btn.getAttribute("data-outcome");
            _selectedOutcomes = _selectedOutcomes.filter(o => o.text !== textToRemove);

            // Listede varsa onay kutusunu kaldır
            const checkboxes = document.querySelectorAll(".kazanim-checkbox");
            checkboxes.forEach(cb => {
              if (cb.getAttribute("data-text") === textToRemove) {
                cb.checked = false;
                const label = cb.closest(".kazanim-check-item");
                if (label) label.classList.remove("selected");
              }
            });

            onSelectedOutcomesUpdated();
          });
        });
      }
    }

    // 3. Textarea: Harmanlanan listeyi formatla
    if (textarea) {
      if (_selectedOutcomes.length === 0) {
        if (textarea.dataset.autoPopulated === "true") {
          textarea.value = "";
          delete textarea.dataset.autoPopulated;
        }
      } else if (_selectedOutcomes.length === 1) {
        textarea.value = _selectedOutcomes[0].text;
        textarea.dataset.autoPopulated = "true";
      } else {
        textarea.value = _selectedOutcomes
          .map((o, i) => `${i + 1}. ${o.topic ? `[${o.topic}] ` : ""}${o.text}`)
          .join("\n");
        textarea.dataset.autoPopulated = "true";
      }
    }

    // 4. Akıllı Konu / Paket Adı önerisi
    if (konuInput && _selectedOutcomes.length > 0) {
      const topics = [...new Set(_selectedOutcomes.map(o => o.topic).filter(Boolean))];
      if (topics.length === 1) {
        konuInput.value = topics[0];
      } else if (topics.length === 2) {
        konuInput.value = `${topics[0]} & ${topics[1]}`;
      } else if (topics.length > 2) {
        konuInput.value = `${topics[0]}, ${topics[1]}... (Harman)`;
      }
    }
  }

  function ensureEventsInitialized() {
    if (_eventsInitialized) return;
    const dersSelect = document.getElementById("ai-ders-adi");
    const uniteSelect = document.getElementById("ai-unite-secimi");
    const btnSelectAll = document.getElementById("btn-ai-select-all-kazanim");
    const btnClearAll = document.getElementById("btn-ai-clear-all-kazanim");
    const searchInput = document.getElementById("ai-kazanim-search");

    if (dersSelect) {
      dersSelect.addEventListener("change", onLessonChanged);
    }
    if (uniteSelect) {
      uniteSelect.addEventListener("change", onUnitChanged);
    }
    if (btnSelectAll) {
      btnSelectAll.addEventListener("click", () => {
        const visibleCheckboxes = document.querySelectorAll(".kazanim-checkbox");
        if (!visibleCheckboxes || visibleCheckboxes.length === 0) return;

        visibleCheckboxes.forEach(cb => {
          cb.checked = true;
          const label = cb.closest(".kazanim-check-item");
          if (label) label.classList.add("selected");

          const text = cb.getAttribute("data-text");
          const topic = cb.getAttribute("data-topic");
          const weekLabel = cb.getAttribute("data-week");
          const unitTitle = cb.getAttribute("data-unit");

          if (!_selectedOutcomes.some(o => o.text === text)) {
            _selectedOutcomes.push({ text, topic, weekLabel, unitTitle });
          }
        });

        onSelectedOutcomesUpdated();
      });
    }
    if (btnClearAll) {
      btnClearAll.addEventListener("click", () => {
        _selectedOutcomes = [];
        const visibleCheckboxes = document.querySelectorAll(".kazanim-checkbox");
        visibleCheckboxes.forEach(cb => {
          cb.checked = false;
          const label = cb.closest(".kazanim-check-item");
          if (label) label.classList.remove("selected");
        });
        const textarea = document.getElementById("ai-kazanim");
        if (textarea) textarea.value = "";
        onSelectedOutcomesUpdated();
      });
    }
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        renderOutcomesChecklist(searchInput.value);
      });
    }

    _eventsInitialized = true;
  }

  // ─── Modal Aç / Kapat ──────────────────────────────────────────────────────

  window.openQuizAIGeneratorModal = function () {
    const modal = document.getElementById("modal-quiz-ai-generator");
    if (!modal) return;
    ensureEventsInitialized();
    resetGeneratorForm();
    populateLessonDropdown();
    modal.classList.add("active");
    modal.style.display = "flex";
  };

  window.closeQuizAIGeneratorModal = function () {
    const modal = document.getElementById("modal-quiz-ai-generator");
    if (!modal) return;
    modal.classList.remove("active");
    modal.style.display = "none";
  };

  function resetGeneratorForm() {
    const ids = [
      "ai-sinif-seviyesi",
      "ai-ders-adi",
      "ai-unite-secimi",
      "ai-konu-basligi",
      "ai-kazanim",
      "ai-kazanim-search",
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    const uniteSelect = document.getElementById("ai-unite-secimi");
    if (uniteSelect) {
      uniteSelect.disabled = true;
      uniteSelect.innerHTML = '<option value="">Önce ders seçin...</option>';
    }

    const searchInput = document.getElementById("ai-kazanim-search");
    if (searchInput) searchInput.disabled = true;

    _selectedOutcomes = [];
    _currentUnitsMap = null;
    onSelectedOutcomesUpdated();
    renderOutcomesChecklist();

    const soruSayisiInput = document.getElementById("ai-soru-sayisi");
    if (soruSayisiInput) {
      soruSayisiInput.value = "10";
    }

    const selects = {
      "ai-soru-tipi": "karisik",
      "ai-zorluk": "dengeli",
    };
    Object.entries(selects).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });

    clearPreview();
    showGeneratorStep("form");
  }

  function showGeneratorStep(step) {
    const formSection = document.getElementById("ai-gen-form-section");
    const previewSection = document.getElementById("ai-gen-preview-section");
    const btnGenerate = document.getElementById("btn-ai-generate-form");
    const btnSave = document.getElementById("btn-ai-save-to-pool");
    if (step === "form") {
      if (formSection) formSection.style.display = "";
      if (previewSection) previewSection.style.display = "none";
      if (btnGenerate) btnGenerate.style.display = "";
      if (btnSave) btnSave.style.display = "none";
    } else {
      if (formSection) formSection.style.display = "none";
      if (previewSection) previewSection.style.display = "";
      if (btnGenerate) btnGenerate.style.display = "none";
      if (btnSave) { btnSave.style.display = ""; }
    }
  }

  function clearPreview() {
    const container = document.getElementById("ai-preview-container");
    if (container) container.innerHTML = "";
    const badge = document.getElementById("ai-preview-count-badge");
    if (badge) badge.textContent = "";
  }

  // ─── Prompt Oluşturma ──────────────────────────────────────────────────────

  function buildPrompt(params) {
    const {
      sinifSeviyesi,
      dersAdi,
      konuBasligi,
      kazanim,
      soruSayisi,
      soruTipi,
      zorluk,
    } = params;

    let tipAciklama = "";
    if (soruTipi === "karisik") {
      tipAciklama = `Soruların yaklaşık üçte biri Doğru/Yanlış (tf), üçte biri Çoktan Seçmeli (mc), üçte biri Boşluk Doldurma (fib) türünde olsun.`;
    } else if (soruTipi === "tf") {
      tipAciklama = `Tüm sorular Doğru/Yanlış (tf) türünde olsun.`;
    } else if (soruTipi === "mc") {
      tipAciklama = `Tüm sorular Çoktan Seçmeli (mc), 4 şık olsun.`;
    } else if (soruTipi === "fib") {
      tipAciklama = `Tüm sorular Boşluk Doldurma (fib) türünde olsun. Cümle içindeki boşluğu [___] ile göster.`;
    }

    let zorluğAciklama = "";
    if (zorluk === "dengeli") {
      zorluğAciklama = `Soruların yaklaşık %40'ı kolay, %40'ı orta, %20'si zor seviyede olsun.`;
    } else if (zorluk === "kolay") {
      zorluğAciklama = `Tüm sorular öğrencilerin kolayca cevaplayabileceği temel düzeyde olsun.`;
    } else if (zorluk === "orta") {
      zorluğAciklama = `Tüm sorular orta güçlükte, biraz düşünme gerektiren sorular olsun.`;
    } else if (zorluk === "zor") {
      zorluğAciklama = `Tüm sorular yüksek düşünme becerileri gerektiren, zorlu sorular olsun.`;
    }

    const isBlended = kazanim && (kazanim.includes("\n") || _selectedOutcomes.length > 1);

    const blendingSection = isBlended
      ? `ÖĞRETMEN TARAFINDAN HARMANLANAN KAZANIMLAR VE KONULAR:
${kazanim}

ÖNEMLİ PEDAGOJİK HARMANLAMA TALİMATI:
- Öğretmen yukarıdaki birden fazla kazanımı harmanlayarak kapsamlı bir yarışma testi oluşturmak istemektedir.
- Üreteceğin tam ${soruSayisi} adet soruyu bu kazanımların tamamına dengeli bir şekilde dağıt.
- Her bir soru, belirtilen kazanımlardan en az birini doğrudan ölçecek nitelikte olmalıdır.
- Tek bir konuya veya kazanıma yığılma yapma; harmanlanan tüm kazanımları kapsayan zengin ve dengeli bir soru seti oluştur.`
      : (kazanim ? `Kazanım/Açıklama: ${kazanim}` : "");

    return `Sen bir Türk ilkokul/ortaokul öğretmenisin. Aşağıdaki bilgilere göre tam olarak ${soruSayisi} adet bilgi yarışması sorusu üret.

Sınıf Seviyesi: ${sinifSeviyesi}. Sınıf
Ders: ${dersAdi}
Konu Başlığı: ${konuBasligi}
${blendingSection}

Soru Türü Dağılımı: ${tipAciklama}
Zorluk: ${zorluğAciklama}

ÇIKTI KURALLARI (BUNLARA KESİNLİKLE UYULACAK):
1. Yalnızca geçerli bir JSON dizisi döndür. JSON dışında hiçbir metin, açıklama veya markdown bloğu olmasın.
2. Her soru nesnesi şu alanları içermeli:

Doğru/Yanlış (tf):
{ "type": "tf", "text": "...", "answer": true/false, "explanation": "Kısa açıklama" }

Çoktan Seçmeli (mc):
{ "type": "mc", "text": "Soru metni?", "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"], "answer": 0, "explanation": "..." }
(answer: doğru şıkkın 0 tabanlı indeksi)

Boşluk Doldurma (fib):
{ "type": "fib", "text": "Cümlede [___] var.", "options": ["doğru cevap", "yanlış1", "yanlış2", "yanlış3"], "answer": 0, "explanation": "..." }
(answer her zaman 0; options[0] doğru cevap, diğerleri çeldirici)

3. Dil: Türkçe, öğrenci seviyesine uygun, açık ve anlaşılır.
4. Sorular MEB müfredatına uygun, kazanım odaklı olsun.
5. Doğru/Yanlış sorularında cümle içinde en az bir doğrulanabilir bilgi olsun.
6. JSON geçerli ve eksiksiz olmalı. Eksik alan olmasın.

Şimdi yalnızca JSON dizisini yaz:`;
  }

  // ─── Gemini API Çağrısı ve Ayrıştırma ─────────────────────────────────────

  async function generateQuestions(params) {
    if (!window.callGeminiAPI) {
      throw new Error("Gemini API modülü yüklenmemiş.");
    }

    const prompt = buildPrompt(params);
    let rawText = "";

    try {
      const response = await window.callGeminiAPI(prompt, {
        json: true,
        temperature: 0.5,
      });
      rawText = typeof response === "string" ? response : (response?.text || "");
    } catch (err) {
      if (err.message === "NO_API_KEY") {
        // API anahtarı yok — Ayarlar Yapay Zeka sekmesine yönlendir
        window.closeQuizAIGeneratorModal();
        if (window.navigateToConfigAI) {
          window.navigateToConfigAI();
        } else {
          const keyModal = document.getElementById("modal-gemini-key-setup");
          if (keyModal) {
            keyModal.classList.add("active");
            keyModal.style.display = "flex";
          }
        }
        if (window.showToast) {
          window.showToast("Yapay zeka ile soru hazırlamak için lütfen Google Gemini API anahtarınızı tanımlayın.", "warning");
        }
        return null;
      }
      throw err;
    }

    // JSON temizle (bazen kod bloğu içinde gelir)
    rawText = rawText.trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      // Kısmi eşleşme dene
      const match = rawText.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Yapay zeka geçerli bir JSON döndürmedi. Lütfen tekrar deneyin.");
      }
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Yapay zeka hiç soru üretemedi. Kazanım bilgisini daha ayrıntılı girmeyi deneyin.");
    }

    // Temizle ve kategorize et
    const category = params.konuBasligi.trim() || params.dersAdi.trim() || "Genel";
    return parsed
      .filter((q) => q && q.type && q.text)
      .map((q) => {
        const base = {
          id: uid(),
          type: q.type,
          category: category,
          text: q.text,
          explanation: q.explanation || "",
        };
        if (q.type === "tf") {
          base.answer = Boolean(q.answer);
        } else if (q.type === "mc" || q.type === "fib") {
          base.options = Array.isArray(q.options) ? q.options : ["", "", "", ""];
          base.answer = typeof q.answer === "number" ? q.answer : 0;
        }
        return base;
      });
  }

  // ─── UI: Önizleme Kartları ─────────────────────────────────────────────────

  function renderPreviewCards(questions, category) {
    const container = document.getElementById("ai-preview-container");
    if (!container) return;
    container.innerHTML = "";

    questions.forEach((q, idx) => {
      const typeLabel =
        q.type === "tf"
          ? "D/Y"
          : q.type === "mc"
          ? "ÇS"
          : "BF";
      const typeColor =
        q.type === "tf"
          ? "#3b82f6"
          : q.type === "mc"
          ? "#8b5cf6"
          : "#10b981";

      let answerHtml = "";
      if (q.type === "tf") {
        answerHtml = `<span class="ai-answer-badge">${q.answer ? "✓ Doğru" : "✗ Yanlış"}</span>`;
      } else if (q.type === "mc" && Array.isArray(q.options)) {
        answerHtml = q.options
          .map((opt, i) => {
            const correct = i === q.answer;
            return `<span class="ai-option ${correct ? "ai-option-correct" : ""}">${String.fromCharCode(65 + i)}) ${escH(opt)}</span>`;
          })
          .join("");
      } else if (q.type === "fib" && Array.isArray(q.options)) {
        answerHtml = `<span class="ai-answer-badge ai-answer-fib">✓ ${escH(q.options[0] || "")}</span>`;
      }

      container.innerHTML += `
        <div class="ai-preview-card" data-idx="${idx}">
          <div class="ai-preview-card-header">
            <span class="ai-type-badge" style="background:${typeColor}22;color:${typeColor};border:1px solid ${typeColor}44;">${typeLabel}</span>
            <span class="ai-q-number">${idx + 1}. Soru</span>
            <button class="ai-delete-btn" onclick="window._aiRemoveQuestion(${idx})" title="Bu soruyu kaldır">
              <i data-lucide="x" style="width:14px;height:14px;"></i>
            </button>
          </div>
          <p class="ai-preview-card-text">${escH(q.text)}</p>
          <div class="ai-options-row">${answerHtml}</div>
          ${q.explanation ? `<p class="ai-explanation">${escH(q.explanation)}</p>` : ""}
        </div>`;
    });

    const badge = document.getElementById("ai-preview-count-badge");
    if (badge)
      badge.textContent = `${questions.length} soru üretildi — Kategori: "${category}"`;

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // ─── Soru Silme (önizleme aşaması) ───────────────────────────────────────

  let _pendingQuestions = [];

  window._aiRemoveQuestion = function (idx) {
    _pendingQuestions.splice(idx, 1);
    const category =
      _pendingQuestions[0]?.category ||
      document.getElementById("ai-konu-basligi")?.value ||
      "";
    renderPreviewCards(_pendingQuestions, category);
    if (_pendingQuestions.length === 0) {
      document.getElementById("btn-ai-save-to-pool").disabled = true;
    }
  };

  // ─── Ana Üretim Fonksiyonu ─────────────────────────────────────────────────

  window.startQuizAIGeneration = async function () {
    const sinifSeviyesi = document.getElementById("ai-sinif-seviyesi")?.value;
    const dersAdi = document.getElementById("ai-ders-adi")?.value?.trim();
    const konuBasligi = document.getElementById("ai-konu-basligi")?.value?.trim();
    const kazanim = document.getElementById("ai-kazanim")?.value?.trim();
    const rawSoruSayisi = parseInt(document.getElementById("ai-soru-sayisi")?.value, 10);
    const soruSayisi = (!isNaN(rawSoruSayisi) && rawSoruSayisi > 0) ? Math.min(Math.max(rawSoruSayisi, 1), 50) : 10;
    const soruTipi = document.getElementById("ai-soru-tipi")?.value || "karisik";
    const zorluk = document.getElementById("ai-zorluk")?.value || "dengeli";

    if (!sinifSeviyesi) {
      alert("Lütfen sınıf seviyesini seçin.");
      return;
    }
    if (!dersAdi) {
      alert("Lütfen ders seçin.");
      return;
    }
    if (!konuBasligi) {
      alert("Lütfen konu başlığını girin. Bu alan soruların kategorisi olarak kullanılacak.");
      return;
    }

    const btn = document.getElementById("btn-ai-generate");
    const btnSave = document.getElementById("btn-ai-save-to-pool");
    const spinner = document.getElementById("ai-gen-spinner");

    if (btn) { btn.disabled = true; btn.textContent = "Sorular hazırlanıyor..."; }
    if (spinner) spinner.style.display = "flex";
    if (btnSave) btnSave.disabled = true;
    clearPreview();

    try {
      const questions = await generateQuestions({
        sinifSeviyesi,
        dersAdi,
        konuBasligi,
        kazanim,
        soruSayisi,
        soruTipi,
        zorluk,
      });

      if (!questions) return; // NO_API_KEY durumu — modal açıldı

      _pendingQuestions = questions;
      renderPreviewCards(questions, konuBasligi);
      showGeneratorStep("preview");

      if (btnSave) btnSave.disabled = questions.length === 0;
    } catch (err) {
      alert("Soru üretilirken hata oluştu:\n" + err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "✨ Soruları Üret"; }
      if (spinner) spinner.style.display = "none";
    }
  };

  // ─── Soruları Havuza Kaydet ────────────────────────────────────────────────

  window.saveAIQuestionsToPool = function () {
    if (!_pendingQuestions || _pendingQuestions.length === 0) {
      alert("Kaydedilecek soru bulunamadı.");
      return;
    }

    const existing = JSON.parse(localStorage.getItem("tf_questions") || "[]");
    const combined = [...existing, ..._pendingQuestions];
    localStorage.setItem("tf_questions", JSON.stringify(combined));

    const category = _pendingQuestions[0]?.category || "";
    const count = _pendingQuestions.length;
    _pendingQuestions = [];

    // games.js'deki dropdown'ları ve tabloyu güncelle
    if (window.refreshQuizQuestions) {
      window.refreshQuizQuestions();
    }

    // Yeni kategoriyi setup dropdown'ında seç
    setTimeout(() => {
      const setupSelect = document.getElementById("setup-category");
      if (setupSelect && category) {
        for (const opt of setupSelect.options) {
          if (opt.value === category) {
            setupSelect.value = category;
            break;
          }
        }
      }
    }, 100);

    window.closeQuizAIGeneratorModal();

    // Başarı bildirimi
    const toast =
      typeof showNotification === "function"
        ? showNotification
        : (msg) => alert(msg);
    if (typeof showNotification === "function") {
      showNotification(`✅ ${count} soru "${category}" kategorisine eklendi!`, "success");
    } else {
      alert(`✅ ${count} soru "${category}" kategorisine eklendi!`);
    }
  };

  // ─── Geri Dön (önizlemeden forma) ─────────────────────────────────────────

  window.backToAIGeneratorForm = function () {
    showGeneratorStep("form");
    _pendingQuestions = [];
  };

})();
