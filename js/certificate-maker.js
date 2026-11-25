/**
 * certificate-maker.js
 * Sınıf Asistanı — Öğrenci Başarı ve Teşvik Belgesi Hazırlayıcı
 * 
 * İlkokul ve ortaokullarda öğrencilerin motivasyonunu artıran en popüler başarı belgelerini:
 * - 8 Farklı MEB Uyumlu Başarı Kategorisi (Ayın Öğrencisi, Kitap Kurdu, Akademik Başarı, vb.)
 * - 4 Görsel Tema (Kraliyet Altını, Neşeli Yıldızlar/İlkokul, Zümrüt Prestij, Modern Geometrik)
 * - Otomatik Kişiselleştirme (Sınıf listesinden tek tıkla öğrenci seçimi)
 * - Toplu Sınıf Baskısı (Tüm sınıfa tek tıkla arka arkaya A4 sertifika üretme)
 * - Yapay Zeka (Gemini) ile Kişiselleştirilmiş Pedagojik Övgü / Takdir Metni Üretimi
 * - Canlı düzenlenebilir (contenteditable) A4 Yatay baskı mizanpajı
 * - Vektörel altın mühür ve rozetler
 */

(() => {
  "use strict";

  // ─── 1. Hazır Belge Şablonları ───────────────────────────────────────────
  const CERTIFICATE_TEMPLATES = {
    star_student: {
      id: "star_student",
      category: "davranis",
      title: "AYIN ÖRNEK ÖĞRENCİSİ BELGESİ",
      subtitle: "Üstün Karakter, Nezaket ve Örnek Davranış Teşvik Belgesi",
      badgeText: "ÖRNEK ÖĞRENCİ",
      theme: "gold",
      praiseText: "Ders içi ve ders dışındaki örnek tutumları, arkadaşlarına karşı nazik ve saygılı davranışları, okul kurallarına titizlikle uyması ve sergilediği yüksek ahlaki değerler dolayısıyla bu belgeyi almaya hak kazanmıştır.",
      targetLevel: "İlkokul & Ortaokul"
    },

    bookworm: {
      id: "bookworm",
      category: "okuma",
      title: "KİTAP KURDU BAŞARI BELGESİ",
      subtitle: "Kitap Okuma Azmi ve Edebi Merak Takdir Belgesi",
      badgeText: "KİTAP KURDU",
      theme: "joyful",
      praiseText: "Düzenli kitap okuma alışkanlığı kazanarak hayal gücünü geliştirmesi, okuduğu kitapları ilgi ve merakla incelemesi ve sınıfımızın okuma kültürüne sunduğu ilham verici katkılar dolayısıyla bu belgeyi almaya hak kazanmıştır.",
      targetLevel: "İlkokul & Ortaokul"
    },

    academic_excellence: {
      id: "academic_excellence",
      category: "akademik",
      title: "AKADEMİK ÜSTÜN BAŞARI BELGESİ",
      subtitle: "Ders Başarısı ve Üstün Gayret Takdir Belgesi",
      badgeText: "ÜSTÜN BAŞARI",
      theme: "emerald",
      praiseText: "Derslerinde göstermiş olduğu üstün kavrayış, azimli çalışma disiplini, sınav ve etkinliklerdeki yüksek başarısı ve öğrenmeye olan bitmeyen merakı dolayısıyla bu belge ile ödüllendirilmiştir.",
      targetLevel: "İlkokul & Ortaokul"
    },

    homework_hero: {
      id: "homework_hero",
      category: "sorumluluk",
      title: "ÖDEV VE SORUMLULUK BİLİNCİ BELGESİ",
      subtitle: "Düzenli Çalışma ve Görev Bilinci Takdir Belgesi",
      badgeText: "SORUMLULUK",
      theme: "modern",
      praiseText: "Verilen tüm görev ve ödevleri zamanında, özenle ve eksiksiz yerine getirmesi; planlı çalışma alışkanlığı ve sınıf içi sorumluluklarını büyük bir ciddiyetle yürütmesi dolayısıyla bu belgeyle taltif edilmiştir.",
      targetLevel: "İlkokul & Ortaokul"
    },

    young_scientist: {
      id: "young_scientist",
      category: "bilim",
      title: "GENÇ BİLİM İNSANI VE ARAŞTIRMACI BELGESİ",
      subtitle: "Fen, Deney ve Bilimsel Merak Takdir Belgesi",
      badgeText: "GENÇ MUCİT",
      theme: "modern",
      praiseText: "Bilimsel süreçlere duyduğu derin merak, deney ve araştırmalardaki sorgulayıcı bakış açısı, çevreye ve doğaya karşı geliştirdiği duyarlı projeler dolayısıyla geleceğin bilim insanı olarak bu belgeyi almaya hak kazanmıştır.",
      targetLevel: "İlkokul & Ortaokul"
    },

    kindness_friendship: {
      id: "kindness_friendship",
      category: "degerler",
      title: "NEZAKET VE YARDIMLAŞMA BELGESİ",
      subtitle: "Dostluk, Paylaşım ve Empati Takdir Belgesi",
      badgeText: "İYİLİK ELÇİSİ",
      theme: "joyful",
      praiseText: "Sınıf arkadaşlarına gösterdiği içten sevgi, zor anlarda sergilediği fedakâr yardımlaşma ruhu, güler yüzü ve sınıf iklimine kattığı huzur ve nezaket dolayısıyla bu belgeyle ödüllendirilmiştir.",
      targetLevel: "İlkokul & Ortaokul"
    },

    great_growth: {
      id: "great_growth",
      category: "gelisim",
      title: "ÜSTÜN GAYRET VE GELİŞİM BELGESİ",
      subtitle: "Azim, Kararlılık ve Kendini Geliştirme Belgesi",
      badgeText: "AZİM & GAYRET",
      theme: "gold",
      praiseText: "Zorluklar karşısında pes etmeyerek gösterdiği büyük kararlılık, her geçen gün sergilediği dikkat çekici gelişim ve öğrenme yolculuğundaki tükenmeyen inancı dolayısıyla bu belgeyi almaya hak kazanmıştır.",
      targetLevel: "İlkokul & Ortaokul"
    },

    talent_arts_sports: {
      id: "talent_arts_sports",
      category: "sanat_spor",
      title: "SANAT, SPOR VE YETENEK BAŞARI BELGESİ",
      subtitle: "Yaratıcılık, Estetik ve Sportif Başarı Belgesi",
      badgeText: "YETENEK",
      theme: "emerald",
      praiseText: "Sanatsal duyarlılığı, sportif azmi, estetik bakış açısı ve sergilediği özgün yaratıcı yeteneklerle okulumuzu ve sınıfımızı gururlandırması dolayısıyla bu belge ile tebrik edilmiştir.",
      targetLevel: "İlkokul & Ortaokul"
    }
  };

  // ─── 2. Modül Durumu (State) ──────────────────────────────────────────────
  const CertState = {
    selectedTemplateKey: "star_student",
    currentData: null,
    selectedStudentId: "all_batch", // "all_batch" veya belirli bir studentId
    activeTheme: "gold", // gold | joyful | emerald | modern
    batchStudentsList: [], // Toplu üretim için öğrenci listesi
    activeBatchIndex: 0,
    isEcoMode: false
  };

  // ─── 3. Başlatıcı (Init) ──────────────────────────────────────────────────
  function initCertificateMaker() {
    bindEvents();
    renderTemplatesDropdown();
    renderStudentsDropdown();
    loadTemplate(CertState.selectedTemplateKey);
  }

  // ─── 4. Etkinlikleri Bağlama ──────────────────────────────────────────────
  function bindEvents() {
    const tplSelect = document.getElementById("cert-template-select");
    if (tplSelect) {
      tplSelect.addEventListener("change", (e) => {
        if (e.target.value) {
          loadTemplate(e.target.value);
        }
      });
    }

    const studentSelect = document.getElementById("cert-student-select");
    if (studentSelect) {
      studentSelect.addEventListener("change", (e) => {
        onStudentChanged(e.target.value);
      });
    }

    const themeSelect = document.getElementById("cert-theme-select");
    if (themeSelect) {
      themeSelect.addEventListener("change", (e) => {
        CertState.activeTheme = e.target.value;
        renderCertificatePreview();
      });
    }

    // AI Övgü Metni Oluşturucu
    const btnAiPraise = document.getElementById("btn-cert-ai-praise");
    if (btnAiPraise) {
      btnAiPraise.addEventListener("click", generateAiPraiseText);
    }

    // A4 Yazdır / PDF
    const btnPrint = document.getElementById("btn-cert-print");
    if (btnPrint) {
      btnPrint.addEventListener("click", printCertificateA4);
    }

    // Toplu Baskı Navigasyon Butonları
    const btnPrev = document.getElementById("btn-cert-batch-prev");
    const btnNext = document.getElementById("btn-cert-batch-next");
    if (btnPrev) {
      btnPrev.addEventListener("click", () => navigateBatchStudent(-1));
    }
    if (btnNext) {
      btnNext.addEventListener("click", () => navigateBatchStudent(1));
    }

    // Fotokopi Modu
    const btnEco = document.getElementById("btn-cert-toggle-eco");
    if (btnEco) {
      btnEco.addEventListener("click", toggleEcoMode);
    }

    // Input alanları canlı eşitleme
    const bindLiveInput = (id, prop) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", () => {
          if (CertState.currentData) {
            CertState.currentData[prop] = el.value;
            renderCertificatePreview();
          }
        });
      }
    };

    bindLiveInput("cert-input-school", "schoolName");
    bindLiveInput("cert-input-title", "title");
    bindLiveInput("cert-input-subtitle", "subtitle");
    bindLiveInput("cert-input-praise", "praiseText");
    bindLiveInput("cert-input-teacher", "teacherName");
    bindLiveInput("cert-input-principal", "principalName");
    bindLiveInput("cert-input-date", "dateStr");
  }

  // ─── 5. Şablon Yükleme ───────────────────────────────────────────────────
  function loadTemplate(key) {
    const tpl = CERTIFICATE_TEMPLATES[key];
    if (!tpl) return;

    CertState.selectedTemplateKey = key;
    CertState.activeTheme = tpl.theme || "gold";

    const defaultSchool = (window.state && window.state.schoolName) || "T.C. MİLLÎ EĞİTİM BAKANLIĞI";
    const defaultTeacher = (window.state && window.state.teacherName) || "Sınıf Öğretmeni";

    CertState.currentData = {
      title: tpl.title,
      subtitle: tpl.subtitle,
      badgeText: tpl.badgeText,
      praiseText: tpl.praiseText,
      schoolName: defaultSchool,
      teacherName: defaultTeacher,
      principalName: "Okul Müdürü",
      dateStr: new Date().toLocaleDateString("tr-TR"),
      studentName: "Örnek Öğrenci Adı Soyadı",
      studentNumber: "123",
      studentBranch: "4/A"
    };

    // Form kontrollerini eşitle
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal("cert-input-school", CertState.currentData.schoolName);
    setVal("cert-input-title", CertState.currentData.title);
    setVal("cert-input-subtitle", CertState.currentData.subtitle);
    setVal("cert-input-praise", CertState.currentData.praiseText);
    setVal("cert-input-teacher", CertState.currentData.teacherName);
    setVal("cert-input-principal", CertState.currentData.principalName);
    setVal("cert-input-date", CertState.currentData.dateStr);

    const themeSelect = document.getElementById("cert-theme-select");
    if (themeSelect) themeSelect.value = CertState.activeTheme;

    // Öğrenci durumuna göre veriyi uyarla
    applyStudentData();
    renderCertificatePreview();
  }

  // ─── 6. Öğrenci Seçimi ve Toplu Mod ──────────────────────────────────────
  function onStudentChanged(studentId) {
    CertState.selectedStudentId = studentId;
    applyStudentData();
    renderCertificatePreview();
  }

  function applyStudentData() {
    let allStudents = [];
    if (window.stateManager && typeof window.stateManager.getStudents === "function") {
      allStudents = window.stateManager.getStudents(true) || [];
    }
    allStudents.sort((a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0));

    CertState.batchStudentsList = allStudents;

    const batchNav = document.getElementById("cert-batch-nav-panel");

    if (CertState.selectedStudentId === "all_batch") {
      // Toplu mod
      if (batchNav) batchNav.style.display = "flex";
      if (allStudents.length > 0) {
        const s = allStudents[CertState.activeBatchIndex] || allStudents[0];
        setStudentInfo(s);
      } else {
        setStudentInfo(null);
      }
    } else {
      // Bireysel mod
      if (batchNav) batchNav.style.display = "none";
      const s = allStudents.find(st => String(st.id) === String(CertState.selectedStudentId));
      setStudentInfo(s);
    }

    updateBatchCounterText();
  }

  function setStudentInfo(s) {
    if (!CertState.currentData) return;
    if (s) {
      CertState.currentData.studentName = `${s.name || ''} ${s.surname || ''}`.trim() || "Öğrenci Adı Soyadı";
      CertState.currentData.studentNumber = s.number || s.studentNumber || "---";
      CertState.currentData.studentBranch = s.branch || "Sınıf / Şube";
    } else {
      CertState.currentData.studentName = "Örnek Öğrenci Adı Soyadı";
      CertState.currentData.studentNumber = "123";
      CertState.currentData.studentBranch = "Sınıf / Şube";
    }
  }

  function navigateBatchStudent(direction) {
    if (CertState.batchStudentsList.length === 0) return;
    CertState.activeBatchIndex += direction;
    if (CertState.activeBatchIndex < 0) {
      CertState.activeBatchIndex = CertState.batchStudentsList.length - 1;
    } else if (CertState.activeBatchIndex >= CertState.batchStudentsList.length) {
      CertState.activeBatchIndex = 0;
    }

    const s = CertState.batchStudentsList[CertState.activeBatchIndex];
    setStudentInfo(s);
    updateBatchCounterText();
    renderCertificatePreview();
  }

  function updateBatchCounterText() {
    const badge = document.getElementById("cert-batch-counter-badge");
    if (!badge) return;
    const total = CertState.batchStudentsList.length;
    if (CertState.selectedStudentId === "all_batch" && total > 0) {
      badge.textContent = `Öğrenci: ${CertState.activeBatchIndex + 1} / ${total}`;
    } else {
      badge.textContent = `Tek Öğrenci`;
    }
  }

  // ─── 7. A4 Yatay Sertifika Çizimi (Render) ────────────────────────────────
  function renderCertificatePreview() {
    const container = document.getElementById("cert-a4-sheet-container");
    if (!container || !CertState.currentData) return;

    const isBatchPrint = (CertState.selectedStudentId === "all_batch" && CertState.batchStudentsList.length > 1);

    // Tekli önizleme için mevcut aktif öğrenci kartını üret
    const cardHtml = generateSingleCertificateHtml(CertState.currentData, CertState.activeTheme, CertState.isEcoMode);

    container.className = `cert-preview-wrapper ${CertState.isEcoMode ? 'fotokopi-mode' : ''}`;
    container.innerHTML = cardHtml;

    attachContentEditableSync();
  }

  function generateSingleCertificateHtml(data, theme, isEco) {
    const d = data;
    const themeClass = `theme-${theme}`;

    // SVG Rozet & Mühür Grafiği
    let sealSvg = getSealBadgeSvg(theme, d.badgeText || "BAŞARI");

    return `
      <div class="cert-a4-landscape ${themeClass} ${isEco ? 'fotokopi-mode' : ''}">
        <!-- Dış ve İç Çerçeve Bezeme -->
        <div class="cert-outer-border">
          <div class="cert-inner-border">
            
            <!-- Köşe Motifleri -->
            <div class="cert-corner corner-tl">❖</div>
            <div class="cert-corner corner-tr">❖</div>
            <div class="cert-corner corner-bl">❖</div>
            <div class="cert-corner corner-br">❖</div>

            <!-- Üst Başlık ve MEB Arması -->
            <div class="cert-header">
              <div class="cert-meb-badge">T.C. MİLLÎ EĞİTİM BAKANLIĞI</div>
              <div class="cert-school-name cert-editable" contenteditable="true" data-prop="schoolName">
                ${escapeHtml(d.schoolName.toUpperCase())}
              </div>
              <div class="cert-award-ribbon">
                <span class="cert-editable" contenteditable="true" data-prop="title">${escapeHtml(d.title)}</span>
              </div>
              <div class="cert-award-sub cert-editable" contenteditable="true" data-prop="subtitle">
                ${escapeHtml(d.subtitle)}
              </div>
            </div>

            <!-- Öğrenci Adı ve Bilgileri (Göz Alıcı Vurgu) -->
            <div class="cert-body">
              <div class="cert-present-text">Bu belge gururla takdim edilmiştir:</div>
              <div class="cert-student-name-box">
                <div class="cert-student-name cert-editable" contenteditable="true" data-prop="studentName">
                  ${escapeHtml(d.studentName)}
                </div>
                <div class="cert-student-line"></div>
              </div>
              <div class="cert-student-meta">
                <span><strong>Sınıf / Şube:</strong> <span class="cert-editable" contenteditable="true" data-prop="studentBranch">${escapeHtml(d.studentBranch)}</span></span>
                <span class="cert-meta-sep">•</span>
                <span><strong>Okul No:</strong> <span class="cert-editable" contenteditable="true" data-prop="studentNumber">${escapeHtml(d.studentNumber)}</span></span>
              </div>

              <!-- Övgü ve Takdir Açıklaması -->
              <div class="cert-praise-box">
                <p class="cert-praise-text cert-editable" contenteditable="true" data-prop="praiseText">
                  ${escapeHtml(d.praiseText)}
                </p>
              </div>
            </div>

            <!-- Alt Bilgi: Mühür, Tarih ve İmzalar -->
            <div class="cert-footer">
              <!-- Sol İmza: Sınıf Öğretmeni -->
              <div class="cert-sig-box">
                <div class="cert-sig-title">Sınıf Öğretmeni</div>
                <div class="cert-sig-name cert-editable" contenteditable="true" data-prop="teacherName">
                  ${escapeHtml(d.teacherName)}
                </div>
                <div class="cert-sig-line">İmza</div>
              </div>

              <!-- Orta: Görkemli Vektörel Mühür Rozeti -->
              <div class="cert-seal-box">
                ${sealSvg}
                <div class="cert-date-text">
                  <strong>Tarih:</strong> <span class="cert-editable" contenteditable="true" data-prop="dateStr">${escapeHtml(d.dateStr)}</span>
                </div>
              </div>

              <!-- Sağ İmza: Okul Müdürü -->
              <div class="cert-sig-box">
                <div class="cert-sig-title">Okul Müdürü</div>
                <div class="cert-sig-name cert-editable" contenteditable="true" data-prop="principalName">
                  ${escapeHtml(d.principalName)}
                </div>
                <div class="cert-sig-line">İmza / Mühür</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  // ─── 8. Vektörel Mühür / Rozet Üretici (SVG) ─────────────────────────────
  function getSealBadgeSvg(theme, text) {
    let mainColor = "#d97706";
    let ribbonColor = "#b45309";
    if (theme === "emerald") { mainColor = "#059669"; ribbonColor = "#047857"; }
    else if (theme === "joyful") { mainColor = "#e11d48"; ribbonColor = "#be123c"; }
    else if (theme === "modern") { mainColor = "#4f46e5"; ribbonColor = "#3730a3"; }

    return `
      <div class="cert-seal-graphic">
        <svg viewBox="0 0 100 100" class="cert-seal-svg" width="64" height="64">
          <!-- Kurdele Kuyrukları -->
          <path d="M35 75 L20 100 L35 90 L50 100 L40 75 Z" fill="${ribbonColor}" opacity="0.9"/>
          <path d="M65 75 L80 100 L65 90 L50 100 L60 75 Z" fill="${ribbonColor}" opacity="0.9"/>
          <!-- Dış Dişli Daire -->
          <circle cx="50" cy="48" r="42" fill="${mainColor}" stroke="#ffffff" stroke-width="2"/>
          <circle cx="50" cy="48" r="36" fill="none" stroke="#fef3c7" stroke-dasharray="2,3" stroke-width="2"/>
          <!-- İç Madalyon -->
          <circle cx="50" cy="48" r="30" fill="#ffffff" />
          <!-- Yıldızlar -->
          <text x="50" y="38" text-anchor="middle" font-size="13" fill="${mainColor}">★ ★ ★</text>
          <!-- Rozet Yazısı -->
          <text x="50" y="55" text-anchor="middle" font-size="8" font-weight="900" fill="#1e293b" letter-spacing="0.5">${escapeHtml(text)}</text>
          <text x="50" y="66" text-anchor="middle" font-size="6" font-weight="700" fill="${mainColor}">BAŞARI MÜHRÜ</text>
        </svg>
      </div>
    `;
  }

  // ─── 9. Contenteditable Eşitleme ─────────────────────────────────────────
  function attachContentEditableSync() {
    const container = document.getElementById("cert-a4-sheet-container");
    if (!container || !CertState.currentData) return;

    container.querySelectorAll(".cert-editable").forEach(el => {
      el.addEventListener("blur", function() {
        const prop = this.dataset.prop;
        const val = this.innerText.trim();
        if (prop && CertState.currentData[prop] !== undefined) {
          CertState.currentData[prop] = val;
          // Form alanını da senkronize et
          const map = {
            schoolName: "cert-input-school",
            title: "cert-input-title",
            subtitle: "cert-input-subtitle",
            praiseText: "cert-input-praise",
            teacherName: "cert-input-teacher",
            principalName: "cert-input-principal",
            dateStr: "cert-input-date"
          };
          if (map[prop]) {
            const inputEl = document.getElementById(map[prop]);
            if (inputEl) inputEl.value = val;
          }
        }
      });
    });
  }

  // ─── 10. Yapay Zeka (Gemini) ile Özel Övgü Metni Yazma ──────────────────
  async function generateAiPraiseText() {
    if (!CertState.currentData) return;

    const studentName = CertState.currentData.studentName || "Öğrenci";
    const awardTitle = CertState.currentData.title || "Başarı Belgesi";

    if (!window.callGeminiAPI) {
      if (typeof window.showGeminiKeyRequiredModal === "function") {
        window.showGeminiKeyRequiredModal({ title: "Başarı Belgesi AI Robotu" });
      } else {
        alert("Yapay zeka modülü bulunamadı. Lütfen Ayarlar'dan Gemini API anahtarınızı giriniz.");
      }
      return;
    }

    const btn = document.getElementById("btn-cert-ai-praise");
    const originalText = btn ? btn.innerHTML : "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> <span>Övgü Metni Yazılıyor...</span>';
    }

    const prompt = `
Sen Türk Millî Eğitim Bakanlığı (MEB) okullarında görev yapan, öğrencilerini yakından tanıyan çok şefkatli, motive edici ve ilham veren bir sınıf öğretmenisin.
Aşağıdaki başarı belgesi için öğrencinin kalbine dokunan, onu hem tebrik eden hem de geleceğe dair şevklendiren 2-3 cümlelik çok zarif bir "Övgü ve Takdir Metni" yazacaksın.

Öğrenci Adı: ${studentName}
Belge Başlığı: ${awardTitle}

KURALLAR:
1. Dil son derece samimi, pedagojik, resmiyeti zarafetle birleştiren ve özgün olmalıdır.
2. Cümle "...dolayısıyla bu belge ile ödüllendirilmiştir / almaya hak kazanmıştır." kalıbıyla tatlı bir kapanış yapmalıdır.
3. Yanıt olarak YALNIZCA metni ver (başında/sonunda tırnak veya açıklama olmasın).
`;

    try {
      const response = await window.callGeminiAPI(prompt, { temperature: 0.7 });
      let text = (typeof response === "string") ? response.trim().replace(/^["']|["']$/g, "") : "";
      if (text) {
        CertState.currentData.praiseText = text;
        const inputPraise = document.getElementById("cert-input-praise");
        if (inputPraise) inputPraise.value = text;
        renderCertificatePreview();
        const toast = window.showToast || alert;
        toast("✨ Kişiselleştirilmiş övgü metni yapay zeka ile başarıyla oluşturuldu!");
      }
    } catch (err) {
      console.error("AI Belge Hatası:", err);
      alert("Övgü metni üretilirken bir hata oluştu: " + (err.message || err));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  }

  // ─── 11. Toplu ve Tekli A4 Baskı & PDF ────────────────────────────────────
  function printCertificateA4() {
    if (!CertState.currentData) return;

    let printContainer = document.querySelector(".cert-print-container");
    if (!printContainer) {
      printContainer = document.createElement("div");
      printContainer.className = "cert-print-container";
      document.body.appendChild(printContainer);
    }

    const isBatch = (CertState.selectedStudentId === "all_batch" && CertState.batchStudentsList.length > 0);

    let fullHtml = "";

    if (isBatch) {
      // Tüm sınıfa tek tek sayfa üret (Page break always)
      CertState.batchStudentsList.forEach(s => {
        const studentData = JSON.parse(JSON.stringify(CertState.currentData));
        studentData.studentName = `${s.name || ''} ${s.surname || ''}`.trim() || "Öğrenci";
        studentData.studentNumber = s.number || s.studentNumber || "---";
        studentData.studentBranch = s.branch || "Sınıf / Şube";
        fullHtml += generateSingleCertificateHtml(studentData, CertState.activeTheme, CertState.isEcoMode);
      });
    } else {
      fullHtml = generateSingleCertificateHtml(CertState.currentData, CertState.activeTheme, CertState.isEcoMode);
    }

    printContainer.innerHTML = fullHtml;
    printContainer.classList.toggle("fotokopi-mode", CertState.isEcoMode);

    let styleOverride = document.getElementById("cert-print-page-style");
    if (!styleOverride) {
      styleOverride = document.createElement("style");
      styleOverride.id = "cert-print-page-style";
      styleOverride.textContent = "@page { size: A4 landscape; margin: 0 !important; }";
      document.head.appendChild(styleOverride);
    }

    const cleanupPrint = () => {
      document.body.classList.remove("print-cert");
      const st = document.getElementById("cert-print-page-style");
      if (st && st.parentNode) st.parentNode.removeChild(st);
      if (printContainer) printContainer.innerHTML = "";
    };

    document.body.classList.add("print-cert");
    window.print();

    window.addEventListener("afterprint", cleanupPrint, { once: true });
    setTimeout(cleanupPrint, 12000);
  }

  function toggleEcoMode() {
    CertState.isEcoMode = !CertState.isEcoMode;
    const btn = document.getElementById("btn-cert-toggle-eco");
    if (btn) {
      btn.innerHTML = CertState.isEcoMode ? '<span>✅</span> <span>Fotokopi Modu Açık</span>' : '<span>🖨️</span> <span>Fotokopi (Eco) Modu</span>';
      btn.classList.toggle("active", CertState.isEcoMode);
    }
    renderCertificatePreview();
  }

  // ─── 12. Dropdown Listelerini Doldurma ────────────────────────────────────
  function renderTemplatesDropdown() {
    const select = document.getElementById("cert-template-select");
    if (!select) return;

    select.innerHTML = "";
    Object.keys(CERTIFICATE_TEMPLATES).forEach(k => {
      const t = CERTIFICATE_TEMPLATES[k];
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = `${t.title} (${t.badgeText})`;
      select.appendChild(opt);
    });
  }

  function renderStudentsDropdown() {
    const select = document.getElementById("cert-student-select");
    if (!select) return;

    let allStudents = [];
    if (window.stateManager && typeof window.stateManager.getStudents === "function") {
      allStudents = window.stateManager.getStudents(true) || [];
    }
    allStudents.sort((a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0));

    select.innerHTML = `
      <option value="all_batch">👥 TÜM SINIF (Toplu Seri Baskı — ${allStudents.length} Öğrenci)</option>
    `;

    allStudents.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      const numStr = s.number ? `No: ${s.number} - ` : "";
      opt.textContent = `${numStr}${s.name || ''} ${s.surname || ''} (${s.branch || ''})`;
      select.appendChild(opt);
    });
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.initCertificateMaker = initCertificateMaker;
  window.CertState = CertState;

})();
