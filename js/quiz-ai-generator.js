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

  // ─── Modal Aç / Kapat ──────────────────────────────────────────────────────

  window.openQuizAIGeneratorModal = function () {
    const modal = document.getElementById("modal-quiz-ai-generator");
    if (!modal) return;
    // Formu sıfırla
    resetGeneratorForm();
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
      "ai-konu-basligi",
      "ai-kazanim",
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    const selects = {
      "ai-soru-sayisi": "10",
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

    return `Sen bir Türk ilkokul/ortaokul öğretmenisin. Aşağıdaki bilgilere göre tam olarak ${soruSayisi} adet bilgi yarışması sorusu üret.

Sınıf Seviyesi: ${sinifSeviyesi}. Sınıf
Ders: ${dersAdi}
Konu Başlığı: ${konuBasligi}
${kazanim ? `Kazanım/Açıklama: ${kazanim}` : ""}

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
        json: false,
        temperature: 0.5,
      });
      const data = await response.json();
      rawText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (err) {
      if (err.message === "NO_API_KEY") {
        // API anahtarı yok — kurulum modalını aç
        window.closeQuizAIGeneratorModal();
        const keyModal = document.getElementById("modal-gemini-key-setup");
        if (keyModal) {
          keyModal.classList.add("active");
          keyModal.style.display = "flex";
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
    const soruSayisi = parseInt(document.getElementById("ai-soru-sayisi")?.value) || 10;
    const soruTipi = document.getElementById("ai-soru-tipi")?.value || "karisik";
    const zorluk = document.getElementById("ai-zorluk")?.value || "dengeli";

    if (!sinifSeviyesi) {
      alert("Lütfen sınıf seviyesini seçin.");
      return;
    }
    if (!dersAdi) {
      alert("Lütfen ders adını girin.");
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
