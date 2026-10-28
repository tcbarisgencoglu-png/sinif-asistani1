/**
 * Sınıf Asistanı — Öğretmen El Terminali: Canlı Kamera Optik & QR Okuyucu (companion-omr.js)
 * %100 Çevrim Dışı, HTML5 Canvas, Web Audio API, OmrEngine, jsQR, Çoklu Ders & Masaüstü Canlı Eşitleme.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'sinif_asistani_data';
  const OMR_SETTINGS_KEY = 'sinif_companion_omr_settings';

  // Ses Sentezleyicileri (Web Audio API - Çevrim Dışı & Sıfır Bağımlılık)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playSuccessBeep() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {}
  }

  function playCelebrationChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.25, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.38);
      });
    } catch (e) {}
  }

  function playNoticeBeep() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(550, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }

  // CompanionOmr Çekirdek Nesnesi
  const CompanionOmr = {
    viewState: 'list', // 'list' (2-kolonlu sınavlar) | 'detail' (sınav içeriği, okunan öğrenciler & QR)
    activeExam: null,
    isRanked: false, // Puan üstünlüğü sıralaması uygulandı mı?
    activeStream: null,
    isScanningLoop: false,
    isProcessingFrame: false,
    isTorchOn: false,
    autoAdvance: false,
    scanCooldownUntil: 0,
    currentSensitivity: 'normal',
    activeCardResult: null,
    autoAdvanceTimer: null,

    // Sınav Oluşturma Sihirbazı Durumu
    wizardType: 'single', // 'single' | 'multi'
    wizardSubjects: [
      { id: 'sub_0', name: 'Türkçe', questionCount: 10 },
      { id: 'sub_1', name: 'Matematik', questionCount: 10 }
    ],
    wizardChoicesCount: 4,
    wizardKey: {},
    wizardActiveSubjId: 'sub_0',

    // Modülü Başlat
    init() {
      this.loadSettings();
      this.ensureActiveExam();
      this.renderHub();
    },

    loadSettings() {
      try {
        const raw = localStorage.getItem(OMR_SETTINGS_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          this.autoAdvance = !!s.autoAdvance;
          this.currentSensitivity = s.sensitivity || 'normal';
        }
      } catch (e) {}
    },

    saveSettings() {
      try {
        localStorage.setItem(OMR_SETTINGS_KEY, JSON.stringify({
          autoAdvance: this.autoAdvance,
          sensitivity: this.currentSensitivity
        }));
      } catch (e) {}
    },

    // Aktif Verileri Çek
    getData() {
      try {
        let raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && ((Array.isArray(parsed.students) && parsed.students.length > 0) || (Array.isArray(parsed.weeklyEvaluations) && parsed.weeklyEvaluations.length > 0))) {
            return parsed;
          }
        }
        // Ana mobil ve masaüstü veritabanı yedeği (sinif_asistani_state_v3)
        const v3Raw = localStorage.getItem('sinif_asistani_state_v3');
        if (v3Raw) {
          const v3 = JSON.parse(v3Raw);
          if (v3 && typeof v3 === 'object') return v3;
        }
      } catch (e) {}
      return { students: [], weeklyEvaluations: [] };
    },

    saveData(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('State kaydetme hatası:', e);
      }
    },

    // Sınıf Öğrenci Listesini Al
    getActiveStudents() {
      if (this.activeExam && Array.isArray(this.activeExam.classStudents) && this.activeExam.classStudents.length > 0) {
        return this.activeExam.classStudents;
      }

      const data = this.getData();
      let students = Array.isArray(data.students) && data.students.length > 0 ? data.students : [];
      if (students.length === 0) {
        try {
          const v3 = JSON.parse(localStorage.getItem('sinif_asistani_state_v3') || '{}');
          if (Array.isArray(v3.students) && v3.students.length > 0) {
            students = v3.students;
          }
        } catch (e) {}
      }

      if (students.length === 0 && typeof window !== 'undefined') {
        if (window.stateManager?.state?.students?.length > 0) {
          students = window.stateManager.state.students;
        } else if (window.Companion && typeof window.Companion.getData === 'function') {
          const cd = window.Companion.getData();
          if (Array.isArray(cd.students) && cd.students.length > 0) students = cd.students;
        }
      }
      const activeSection = (this.activeExam && this.activeExam.branch) || (window.Companion && window.Companion.activeSection) || '';

      if (students.length > 0) {
        if (!activeSection) return students;
        const filtered = students.filter(s => {
          if (!s.branch && !s.section && !s.className) return true;
          const b = String(s.branch || s.section || s.className || '').trim().toUpperCase();
          const target = activeSection.trim().toUpperCase();
          const normB = b.replace(/[\/\-\s]/g, '');
          const normT = target.replace(/[\/\-\s]/g, '');
          return normB === normT || b === target;
        });
        if (filtered.length > 0) return filtered;
        return students;
      }

      return [];
    },

    // Sınav içindeki çift öğrenci kayıtlarını (ID + Okul No veya İsim tekrarı) tekilleştir
    deduplicateExamStudentResults(exam) {
      if (!exam || typeof exam !== 'object') return false;
      const students = this.getActiveStudents();
      const beforeKeys = Object.keys(exam.studentResults || {});

      if (window.CloudSync && typeof window.CloudSync.deduplicateExamResults === 'function') {
        window.CloudSync.deduplicateExamResults(exam, students);
      }

      if (exam.studentResults && typeof exam.studentResults === 'object') {
        const cleanResults = {};
        const cleanScores = {};
        const byStudentKey = new Map();

        Object.keys(exam.studentResults).forEach(rawKey => {
          const res = exam.studentResults[rawKey];
          if (!res || typeof res !== 'object') return;

          const sNo = String(res.studentNo || res.studentNumber || '').trim();
          const sName = String(res.studentName || '').trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');

          const matchedStu = students.find(s =>
            String(s.id) === String(rawKey) ||
            (res.studentId && String(s.id) === String(res.studentId)) ||
            (sNo && sNo !== '-' && String(s.number || '').trim() === sNo) ||
            (sNo && sNo !== '-' && parseInt(s.number, 10) > 0 && parseInt(s.number, 10) === parseInt(sNo, 10)) ||
            (!isNaN(parseInt(rawKey, 10)) && parseInt(s.number, 10) > 0 && parseInt(s.number, 10) === parseInt(rawKey, 10)) ||
            (sName && `${s.name || ''} ${s.surname || ''}`.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ') === sName)
          );

          const canonicalId = matchedStu ? String(matchedStu.id) : String(res.studentId || rawKey);
          const dedupGroupKey = matchedStu
            ? `stu_${matchedStu.id}`
            : (sNo && sNo !== '-' ? `no_${parseInt(sNo, 10) || sNo}` : (sName ? `name_${sName}` : `id_${canonicalId}`));

          const enrichedRes = {
            ...res,
            studentId: canonicalId,
            studentName: matchedStu ? `${matchedStu.name || ''} ${matchedStu.surname || ''}`.trim() : (res.studentName || 'Öğrenci'),
            studentNo: matchedStu && matchedStu.number ? matchedStu.number : (res.studentNo || res.studentNumber || '-')
          };

          const existing = byStudentKey.get(dedupGroupKey);
          if (!existing) {
            byStudentKey.set(dedupGroupKey, { canonicalId, res: enrichedRes });
          } else {
            const oldTime = new Date(existing.res.updatedAt || 0).getTime() || 0;
            const newTime = new Date(enrichedRes.updatedAt || 0).getTime() || 0;
            const preferNew = (newTime > oldTime) ||
              (newTime === oldTime && String(rawKey) === String(canonicalId)) ||
              (!existing.res.thumbUrl && enrichedRes.thumbUrl);
            if (preferNew) {
              if (!enrichedRes.thumbUrl && existing.res.thumbUrl) {
                enrichedRes.thumbUrl = existing.res.thumbUrl;
              }
              byStudentKey.set(dedupGroupKey, { canonicalId, res: enrichedRes });
            } else if (!existing.res.thumbUrl && enrichedRes.thumbUrl) {
              existing.res.thumbUrl = enrichedRes.thumbUrl;
            }
          }
        });

        byStudentKey.forEach(({ canonicalId, res }) => {
          cleanResults[canonicalId] = res;
          if (res.score !== undefined) {
            cleanScores[canonicalId] = res.score;
          } else if (exam.examScores && exam.examScores[canonicalId] !== undefined) {
            cleanScores[canonicalId] = exam.examScores[canonicalId];
          }
        });

        exam.studentResults = cleanResults;
        exam.examScores = cleanScores;
      }

      const afterKeys = Object.keys(exam.studentResults || {});
      return beforeKeys.length !== afterKeys.length || beforeKeys.some((k, idx) => k !== afterKeys[idx]);
    },

    // Aktif Sınavı Güvenle Sağla
    ensureActiveExam() {
      const data = this.getData();
      const exams = Array.isArray(data.weeklyEvaluations) ? data.weeklyEvaluations : [];
      if (exams.length > 0) {
        let lastId = null;
        try {
          lastId = localStorage.getItem('companion_last_active_exam_id');
        } catch(e) {}

        let matched = null;
        if (this.activeExam) {
          matched = exams.find(e => String(e.id) === String(this.activeExam.id));
        }
        if (!matched && lastId) {
          matched = exams.find(e => String(e.id) === String(lastId));
        }
        // Eğer eşleşme yoksa, çoklu dersli (Ai5 vb.) veya en son oluşturulan sınava öncelik ver
        this.activeExam = matched || exams.find(e => e.isMultiSubject && Array.isArray(e.subjects) && e.subjects.length > 0) || exams[0];
        if (this.activeExam) {
          try {
            localStorage.setItem('companion_last_active_exam_id', this.activeExam.id);
          } catch(e) {}
        }
      }
    },

    // ==========================================================================
    // EKRAN VE GÖRÜNÜM GEÇİŞLERİ
    // ==========================================================================

    openExam(examId) {
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
      if (exam) {
        this.activeExam = exam;
        try {
          localStorage.setItem('companion_last_active_exam_id', exam.id);
        } catch(e) {}
        this.viewState = 'detail';
        this.isRanked = false; // Yeni açıldığında varsayılan okuma sırası
        this.renderHub();
        if (window.Companion) window.Companion.vibrate(15);
      }
    },

    backToExamsList() {
      this.viewState = 'list';
      this.isRanked = false;
      this.renderHub();
      if (window.Companion) window.Companion.vibrate(15);
    },

    renderHub() {
      const container = document.getElementById('view-omr');
      if (!container) return;

      if (this.viewState === 'detail' && this.activeExam) {
        this.renderExamDetailView(container);
      } else {
        this.renderExamsListView(container);
      }

      if (window.Companion) window.Companion.renderIcons();
    },

    // ==========================================================================
    // 1. SINAVLAR LİSTESİ (2 KOLONLU KART IZGARASI)
    // ==========================================================================

    renderExamsListView(container) {
      const data = this.getData();
      const exams = Array.isArray(data.weeklyEvaluations) ? data.weeklyEvaluations : [];
      let anyDeduped = false;
      exams.forEach(ex => {
        if (this.deduplicateExamStudentResults(ex)) anyDeduped = true;
      });
      if (anyDeduped) this.saveData(data);
      const students = this.getActiveStudents();
      const totalStudents = students.length || 1;

      container.innerHTML = `
        <!-- Üst Gezinme Barı -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <button type="button" class="c-icon-btn" onclick="window.Companion.showView('dashboard')">
              <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
            </button>
            <div>
              <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; line-height: 1.2;">Optik Sınavlar</h2>
              <span style="font-size: 11px; color: #93c5fd;">${exams.length} Sınav • Canlı Bulut Köprüsü</span>
            </div>
          </div>
          <button type="button" class="c-btn-primary" style="padding: 7px 12px; font-size: 12.5px; gap: 6px; background: linear-gradient(135deg, #4f46e5, #6366f1);" onclick="window.CompanionOmr.openCreateExamModal()">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
            <span>Yeni Sınav</span>
          </button>
        </div>

        <!-- Bilgi Rozeti -->
        <div class="c-behavior-tip-box" style="margin-bottom: 14px;">
          <i data-lucide="sparkles" style="width: 16px; height: 16px; color: #fbbf24; flex-shrink: 0;"></i>
          <span>Bir sınava tıklayarak detayını açın ve en alttaki QR simgesiyle formları okutun.</span>
        </div>

        <!-- 2 Kolonlu Sınav Kartları Izgarası -->
        ${exams.length === 0 ? `
          <div class="c-setup-card" style="text-align: center; padding: 36px 16px; margin-top: 10px;">
            <div class="c-card-icon-wrap primary" style="width: 54px; height: 54px; margin: 0 auto 12px;">
              <i data-lucide="file-plus" style="width: 26px; height: 26px;"></i>
            </div>
            <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Henüz Sınav Bulunmuyor</h3>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 16px;">
              Masaüstünden hazırladığınız sınavları çekebilir veya hemen yeni bir sınav oluşturabilirsiniz.
            </p>
            <button type="button" class="c-btn-primary" style="margin: 0 auto;" onclick="window.CompanionOmr.openCreateExamModal()">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
              <span>Sınav Oluşturma Sihirbazı</span>
            </button>
          </div>
        ` : `
          <div class="c-exam-grid-2col">
            ${exams.map(exam => {
              const scannedCount = Object.keys(exam.studentResults || {}).length;
              const isMulti = !!(exam.isMultiSubject && Array.isArray(exam.subjects) && exam.subjects.length > 0);
              const weekLabel = exam.weekId ? (typeof window.formatWeekTR === 'function' ? window.formatWeekTR(exam.weekId, 'compact') : `${exam.weekId}. Hafta`) : 'Genel';
              const metaText = isMulti 
                ? `📚 ${exam.subjects.length} Ders • ${exam.totalQuestions || 40}S` 
                : `📄 ${exam.totalQuestions || 20} Soru • ${exam.choicesCount || 4} Şık`;

              return `
                <div class="c-exam-card-mini" onclick="window.CompanionOmr.openExam('${exam.id}')">
                  <div>
                    <div class="c-exam-card-header">
                      <span class="c-exam-week-tag">${weekLabel}</span>
                      <div style="display: flex; gap: 2px;" onclick="event.stopPropagation();">
                        <button type="button" class="c-icon-btn" style="width: 24px; height: 24px; padding: 0; background: transparent;" title="Optik Form Yazdır" onclick="window.CompanionOmr.openMobileOpticalPrintModal('${exam.id}')">
                          <i data-lucide="printer" style="width: 13px; height: 13px; color: #10b981;"></i>
                        </button>
                        <button type="button" class="c-icon-btn" style="width: 24px; height: 24px; padding: 0; background: transparent;" title="Optik Form ve Cevap Anahtarını Düzenle" onclick="window.CompanionOmr.openExamSettingsModal('${exam.id}')">
                          <i data-lucide="sliders-horizontal" style="width: 13px; height: 13px; color: #6366f1;"></i>
                        </button>
                        <button type="button" class="c-icon-btn" style="width: 24px; height: 24px; padding: 0; background: transparent;" title="Sınavı Sil" onclick="window.CompanionOmr.promptDeleteExam('${exam.id}')">
                          <i data-lucide="trash-2" style="width: 13px; height: 13px; color: #94a3b8;"></i>
                        </button>
                      </div>
                    </div>
                    <div class="c-exam-card-title">${exam.examName}</div>
                    <div class="c-exam-meta-pill">${metaText}</div>
                  </div>
                  <div class="c-exam-card-footer">
                    <span class="c-exam-scanned-badge ${scannedCount === 0 ? 'empty' : ''}">
                      <i data-lucide="users" style="width: 11px; height: 11px;"></i>
                      <span>${scannedCount} / ${totalStudents}</span>
                    </span>
                    <i data-lucide="chevron-right" style="width: 14px; height: 14px; color: #94a3b8;"></i>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      `;
    },

    // ==========================================================================
    // 2. SINAV DETAY VE OKUMA EKRANI (EN ALTTA QR VE KAYDET BUTONLARI)
    // ==========================================================================

    renderExamDetailView(container) {
      const exam = this.activeExam;
      if (this.deduplicateExamStudentResults(exam)) {
        const data = this.getData();
        const idx = (data.weeklyEvaluations || []).findIndex(e => String(e.id) === String(exam.id));
        if (idx >= 0) {
          data.weeklyEvaluations[idx] = exam;
          this.saveData(data);
        }
      }
      const students = this.getActiveStudents();
      const studentResults = exam.studentResults || {};
      const scannedKeys = Object.keys(studentResults);
      const totalStudents = students.length || 1;
      const scannedCount = scannedKeys.length;
      const percent = Math.min(100, Math.round((scannedCount / totalStudents) * 100));

      const isMulti = !!(exam.isMultiSubject && Array.isArray(exam.subjects) && exam.subjects.length > 0);
      const weekLabel = exam.weekId ? (typeof window.formatWeekTR === 'function' ? window.formatWeekTR(exam.weekId, 'compact') : `${exam.weekId}. Hafta`) : 'Genel';
      const penaltyText = exam.wrongAffects ? `Net Hesabı (${exam.penaltyRate || 4}Y=1D)` : 'Net Hesabı Yok';

      // Öğrenci listesini hazırla
      let studentListItems = scannedKeys.map(stuId => {
        const res = studentResults[stuId];
        const sNo = String(res.studentNo || res.studentNumber || '').trim();
        const stu = students.find(s =>
          String(s.id) === String(stuId) ||
          (sNo && sNo !== '-' && String(s.number || '').trim() === sNo) ||
          (sNo && sNo !== '-' && parseInt(s.number, 10) > 0 && parseInt(s.number, 10) === parseInt(sNo, 10))
        ) || { name: res.studentName || 'Öğrenci', surname: '', number: res.studentNo || '-' };
        return {
          studentId: stuId,
          stu: stu,
          res: res,
          score: Number(res.score || 0),
          net: Number(res.net || 0),
          time: new Date(res.updatedAt || 0).getTime()
        };
      });

      // Sıralama Mantığı:
      // Eğer "Sonuçları Kaydet" butonuna basılmışsa (isRanked === true) -> Puan Üstünlüğü (score desc, net desc)
      // Basılmamışsa -> Okunma Sırası (en son okunan en üstte)
      if (this.isRanked) {
        studentListItems.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.net - a.net;
        });
      } else {
        studentListItems.sort((a, b) => b.time - a.time);
      }

      container.innerHTML = `
        <!-- Üst Bar: Geri Dönüş ve Sınav Başlığı -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <button type="button" class="c-icon-btn" onclick="window.CompanionOmr.backToExamsList()">
              <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
            </button>
            <div>
              <h2 style="font-size: 17px; font-weight: 800; color: #ffffff; line-height: 1.2;">${exam.examName}</h2>
              <span style="font-size: 11px; color: #93c5fd;">${weekLabel} • ${exam.totalQuestions} Soru ${isMulti ? '• Çok Dersli' : ''}</span>
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="c-icon-btn" title="Optik Form Yazdır" onclick="window.CompanionOmr.openMobileOpticalPrintModal('${exam.id}')">
              <i data-lucide="printer" style="width: 18px; height: 18px; color: #34d399;"></i>
            </button>
            <button type="button" class="c-icon-btn" title="Optik Form & Cevap Anahtarını Düzenle" onclick="window.CompanionOmr.openExamSettingsModal('${exam.id}')">
              <i data-lucide="sliders-horizontal" style="width: 18px; height: 18px; color: #93c5fd;"></i>
            </button>
          </div>
        </div>

        <!-- Sınav Detay Bilgi Kartı -->
        <div class="c-exam-detail-header-card">
          <div class="c-exam-detail-pills">
            <span class="c-detail-pill primary">${exam.totalQuestions} Soru</span>
            <span class="c-detail-pill">${exam.choicesCount || 4} Şıklı</span>
            <span class="c-detail-pill">⏱️ ${exam.duration || 40} Dk</span>
            <span class="c-detail-pill">${penaltyText}</span>
          </div>

          ${isMulti ? `
            <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 8px;">
              ${exam.subjects.map(s => `
                <span class="c-subject-pill active" style="font-size: 10.5px; padding: 2px 7px;">
                  📚 ${s.name} (${s.questionCount}S)
                </span>
              `).join('')}
            </div>
          ` : ''}

          <!-- İlerleme Çubuğu -->
          <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; margin-bottom: 4px;">
            <span style="color: #475569;">Okuma Durumu</span>
            <span style="color: #4f46e5;">${scannedCount} / ${totalStudents} Öğrenci (%${percent})</span>
          </div>
          <div class="c-omr-progress-bar" style="height: 8px; border-radius: 999px;">
            <div class="c-omr-progress-fill" style="width: ${percent}%;"></div>
          </div>

          <!-- Hızlı Optik Müdahale & Yazdırma Çubuğu -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
            <button type="button" class="c-btn-secondary" style="font-size: 11px; padding: 7px 8px; justify-content: center; font-weight: 700; color: #4f46e5; border-color: #c7d2fe; background: #eef2ff;" onclick="window.CompanionOmr.openExamSettingsModal('${exam.id}')">
              <i data-lucide="sliders-horizontal" style="width: 14px; height: 14px;"></i>
              <span>Optik & Anahtar</span>
            </button>
            <button type="button" class="c-btn-secondary" style="font-size: 11px; padding: 7px 8px; justify-content: center; font-weight: 700; color: #059669; border-color: #a7f3d0; background: #ecfdf5;" onclick="window.CompanionOmr.openMobileOpticalPrintModal('${exam.id}')">
              <i data-lucide="printer" style="width: 14px; height: 14px;"></i>
              <span>Optik Form Yazdır</span>
            </button>
          </div>
        </div>

        <!-- Taranan Öğrenciler Başlığı ve Sıralama Durumu -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 14px; font-weight: 800; color: #ffffff;">Taranan Öğrenciler (${scannedCount})</span>
            ${this.isRanked ? `
              <span style="font-size: 10.5px; background: #fbbf24; color: #78350f; font-weight: 800; padding: 2px 7px; border-radius: 999px;">
                🏆 Puan Üstünlüğü Sıralaması
              </span>
            ` : `
              <span style="font-size: 10.5px; background: rgba(255, 255, 255, 0.15); color: #e2e8f0; font-weight: 700; padding: 2px 7px; border-radius: 999px;">
                Okunma Sırası
              </span>
            `}
          </div>
          ${scannedCount > 0 ? `
            <button type="button" class="c-btn-secondary" style="padding: 3px 8px; font-size: 11px; color: #ef4444;" onclick="window.CompanionOmr.clearAllResults()">
              Temizle
            </button>
          ` : ''}
        </div>

        <!-- Taranan Öğrenciler Listesi -->
        <div class="c-scanned-list-wrap">
          ${scannedCount === 0 ? `
            <div class="c-setup-card" style="text-align: center; padding: 30px 16px;">
              <i data-lucide="qr-code" style="width: 36px; height: 36px; color: #94a3b8; margin: 0 auto 8px;"></i>
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Henüz Form Okunmadı</div>
              <div style="font-size: 11.5px; color: #64748b; line-height: 1.4;">
                Öğrencilerin optik formlarını veya QR kodlarını okutmak için aşağıdaki <strong>QR / Form Tara</strong> butonuna dokunun.
              </div>
            </div>
          ` : `
            ${studentListItems.map((item, index) => {
              const { studentId, stu, res, score, net } = item;
              const rankNum = index + 1;
              let rankBadgeClass = '';
              let rankText = `#${rankNum}`;

              if (this.isRanked) {
                if (rankNum === 1) { rankBadgeClass = 'gold'; rankText = '🥇'; }
                else if (rankNum === 2) { rankBadgeClass = 'silver'; rankText = '🥈'; }
                else if (rankNum === 3) { rankBadgeClass = 'bronze'; rankText = '🥉'; }
              }

              const fullNameWords = `${stu.name || ''} ${stu.surname || ''}`.trim().split(/\s+/).filter(Boolean);
              const initials = fullNameWords.length > 1
                ? (fullNameWords[0][0] + fullNameWords[fullNameWords.length - 1][0])
                : ((stu.name || 'Ö')[0] || 'Ö');
              
              // Çok dersli özet
              let subSummaryText = `No: ${stu.number || '-'} • ${res.correct || 0}D ${res.wrong || 0}Y ${res.blank || 0}B`;
              if (res.subjectBreakdown && Object.keys(res.subjectBreakdown).length > 0) {
                const subSummaries = Object.values(res.subjectBreakdown).map(sb => `${sb.subjectName || 'Ders'}: ${sb.correct || 0}D`).join(' • ');
                subSummaryText += ` • <span style="color: #4f46e5;">${subSummaries}</span>`;
              }

              return `
                <div class="c-student-scan-card ${this.isRanked && rankNum <= 3 ? `rank-${rankNum}` : ''}">
                  <div class="c-student-scan-info">
                    ${this.isRanked ? `
                      <div class="c-rank-badge-item ${rankBadgeClass}">${rankText}</div>
                    ` : `
                      <div class="c-scan-card-avatar">${initials.toUpperCase()}</div>
                    `}
                    <div class="c-scan-card-details">
                      <div class="c-scan-card-name">${stu.name} ${stu.surname || ''}</div>
                      <div class="c-scan-card-sub">${subSummaryText}</div>
                    </div>
                  </div>
                  <div class="c-student-scan-score-box">
                    <div class="c-scan-card-score">${score.toFixed(1)} P</div>
                    <div class="c-scan-card-net">${net.toFixed(1)} Net</div>
                  </div>
                  <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                    <button type="button" class="c-icon-btn" style="width: 28px; height: 28px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.35);" title="Optik Form Görseli ve Noktaları Gör" onclick="window.CompanionOmr.openOpticalPreviewModal('${studentId}')">
                      <i data-lucide="eye" style="width: 14px; height: 14px; color: #818cf8;"></i>
                    </button>
                    <button type="button" class="c-icon-btn" style="width: 28px; height: 28px;" title="Sil" onclick="window.CompanionOmr.deleteResult('${studentId}')">
                      <i data-lucide="trash-2" style="width: 14px; height: 14px; color: #94a3b8;"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          `}
        </div>

        <!-- Sabit Alt Eylem Çubuğu: Sonuçları Kaydet & Akıllı / Canlı Tara -->
        <div class="c-omr-sticky-actions">
          <button type="button" class="c-btn-save-results" onclick="window.CompanionOmr.saveAndRankResults()">
            <i data-lucide="save" style="width: 18px; height: 18px;"></i>
            <span>Sonuçları Kaydet</span>
          </button>

          <div style="display: flex; gap: 6px; flex: 1.3;">
            <button type="button" class="c-btn-qr-scan-bottom" style="flex: 1;" onclick="window.CompanionOmr.openCamera()" title="Google Akıllı Belge Tarayıcı (CamScanner Kalitesinde)">
              <i data-lucide="sparkles" style="width: 20px; height: 20px; color: #a5b4fc;"></i>
              <span>Akıllı Tara</span>
            </button>
            <button type="button" class="c-icon-btn" style="width: 48px; height: 48px; background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;" onclick="window.CompanionOmr.openLiveCamera()" title="Canlı Kamera Vizörü">
              <i data-lucide="camera" style="width: 20px; height: 20px; color: #94a3b8;"></i>
            </button>
          </div>
        </div>
      `;
    },

    // ==========================================================================
    // SONUÇLARI KAYDET VE PUAN ÜSTÜNLÜĞÜ SIRALAMASI OLUŞTUR
    // ==========================================================================

    async saveAndRankResults() {
      if (!this.activeExam) return;

      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(this.activeExam.id));
      if (!exam) return;

      this.deduplicateExamStudentResults(exam);

      const studentResults = exam.studentResults || {};
      const count = Object.keys(studentResults).length;

      if (count === 0) {
        if (window.Companion) window.Companion.showToast('Henüz taranmış öğrenci sonucu bulunmuyor.');
        return;
      }

      // Puan üstünlüğüne göre bayrağı aç
      this.isRanked = true;

      // Yerel hafızaya kaydet
      exam.updatedAt = new Date().toISOString();
      this.saveData(data);
      this.activeExam = exam;

      // Kutlama sesi & titreşim
      playCelebrationChime();
      if (window.Companion) window.Companion.vibrate([30, 40, 50, 60]);

      // Buluta ve masaüstüne canlı fırlat
      if (window.CloudSync) {
        window.CloudSync.pushExam(exam).catch(() => {});
        window.CloudSync.pushLiveExamResults(exam, 'terminal').catch(() => {});
      }

      // Ekranı güncelle (puan üstünlüğü madalyalarıyla listelenir)
      this.renderHub();

      if (window.Companion) {
        window.Companion.showToast(`✅ ${count} öğrenci puan üstünlüğüne göre sıralandı ve masaüstüne aktarıldı!`);
      }
    },

    // ==========================================================================
    // 3. SINAV OLUŞTURMA SİHİRBAZI MODAL YÖNETİMİ
    // ==========================================================================

    openCreateExamModal() {
      const modal = document.getElementById('companion-exam-wizard-modal');
      if (!modal) return;

      // Durumu sıfırla
      this.wizardType = 'single';
      this.wizardChoicesCount = 4;
      this.wizardKey = {};
      this.wizardSubjects = [
        { id: 'sub_0', name: 'Türkçe', questionCount: 10 },
        { id: 'sub_1', name: 'Matematik', questionCount: 10 }
      ];
      this.wizardActiveSubjId = 'sub_0';

      // Sınıf Öğretmeni mi kontrol et: Eğer sınıf öğretmeni ise şube sorulmaz!
      const isClassTeacher = (window.Companion && typeof window.Companion.isClassTeacher === 'function' && window.Companion.isClassTeacher()) ||
                             (window.Companion && window.Companion.profile && (window.Companion.profile.isClassTeacher || (window.Companion.profile.branch && window.Companion.profile.branch.includes('Sınıf Öğretmeni')))) ||
                             (this.getData().educationLevel === 'primary');

      const branchGroup = document.getElementById('wizard-branch-group');
      const branchWeekRow = document.getElementById('wizard-branch-week-row');

      if (isClassTeacher) {
        if (branchGroup) branchGroup.style.display = 'none';
        if (branchWeekRow) branchWeekRow.style.gridTemplateColumns = '1fr';
      } else {
        if (branchGroup) branchGroup.style.display = 'block';
        if (branchWeekRow) branchWeekRow.style.gridTemplateColumns = '1fr 1.5fr';

        // Şube Seçicisini Doldur (Sadece Branş Öğretmenleri İçin)
        const sectionSelect = document.getElementById('wizard-exam-section');
        if (sectionSelect) {
          const sections = (window.Companion && window.Companion.profile && window.Companion.profile.sections) || ['5-A', '6-A', '7-A', '8-A'];
          sectionSelect.innerHTML = sections.map(s => `
            <option value="${s}" ${s === (window.Companion && window.Companion.activeSection) ? 'selected' : ''}>${s} Şubesi</option>
          `).join('');
        }
      }

      // Hafta Seçicisini Doldur (MEB 1. - 36. Hafta)
      const weekSelect = document.getElementById('wizard-exam-week');
      if (weekSelect) {
        weekSelect.innerHTML = '';
        for (let w = 1; w <= 36; w++) {
          const opt = document.createElement('option');
          opt.value = `W${w}`;
          opt.textContent = `${w}. Hafta`;
          if (w === 4) opt.selected = true;
          weekSelect.appendChild(opt);
        }
      }

      // Form elemanlarını sıfırla
      const nameInput = document.getElementById('wizard-exam-name');
      if (nameInput) nameInput.value = '';

      const durInput = document.getElementById('wizard-exam-duration');
      if (durInput) durInput.value = 40;

      const wrongAffCheck = document.getElementById('wizard-wrong-affects');
      if (wrongAffCheck) wrongAffCheck.checked = false;
      const penaltyRow = document.getElementById('wizard-penalty-row');
      if (penaltyRow) penaltyRow.style.display = 'none';

      // Tip ve Soru Sayısı
      this.wizardSelectType('single');
      this.wizardSelectChoicesCount(4);

      modal.style.display = 'flex';
      if (window.Companion) window.Companion.renderIcons();
    },

    closeCreateExamModal() {
      const modal = document.getElementById('companion-exam-wizard-modal');
      if (modal) modal.style.display = 'none';
    },

    wizardSelectType(type) {
      this.wizardType = type;
      const singlePill = document.getElementById('wizard-type-single');
      const multiPill = document.getElementById('wizard-type-multi');
      const singleGroup = document.getElementById('wizard-single-q-group');
      const multiContainer = document.getElementById('wizard-multi-container');

      if (type === 'multi') {
        singlePill && singlePill.classList.remove('active');
        multiPill && multiPill.classList.add('active');
        if (singleGroup) singleGroup.style.display = 'none';
        if (multiContainer) multiContainer.style.display = 'block';
        this.wizardRenderSubjectsUI();
      } else {
        singlePill && singlePill.classList.add('active');
        multiPill && multiPill.classList.remove('active');
        if (singleGroup) singleGroup.style.display = 'block';
        if (multiContainer) multiContainer.style.display = 'none';
      }

      this.wizardRenderAnswerKeyGrid();
    },

    wizardOnSingleQChange(val) {
      this.wizardRenderAnswerKeyGrid();
    },

    wizardSelectChoicesCount(count) {
      this.wizardChoicesCount = count;
      [3, 4, 5].forEach(c => {
        const pill = document.getElementById(`wizard-pill-opt-${c}`);
        if (pill) pill.classList.toggle('active', c === count);
      });
      this.wizardRenderAnswerKeyGrid();
    },

    // Çoklu Ders Şablonları
    wizardApplyPreset(key) {
      if (key === 'ilkokul_4') {
        this.wizardSubjects = [
          { id: 'sub_0', name: 'Türkçe', questionCount: 10 },
          { id: 'sub_1', name: 'Matematik', questionCount: 10 },
          { id: 'sub_2', name: 'Fen Bilimleri', questionCount: 10 },
          { id: 'sub_3', name: 'Sosyal Bilgiler', questionCount: 10 }
        ];
      } else if (key === 'lgs_sozel') {
        this.wizardSubjects = [
          { id: 'sub_0', name: 'Türkçe', questionCount: 20 },
          { id: 'sub_1', name: 'T.C. İnkılap Tarihi', questionCount: 10 },
          { id: 'sub_2', name: 'Din Kültürü', questionCount: 10 },
          { id: 'sub_3', name: 'İngilizce', questionCount: 10 }
        ];
      } else if (key === 'lgs_sayisal') {
        this.wizardSubjects = [
          { id: 'sub_0', name: 'Matematik', questionCount: 20 },
          { id: 'sub_1', name: 'Fen Bilimleri', questionCount: 20 }
        ];
      } else if (key === 'lgs_tam') {
        this.wizardSubjects = [
          { id: 'sub_0', name: 'Türkçe', questionCount: 20 },
          { id: 'sub_1', name: 'Matematik', questionCount: 20 },
          { id: 'sub_2', name: 'Fen Bilimleri', questionCount: 20 },
          { id: 'sub_3', name: 'T.C. İnkılap Tarihi', questionCount: 10 },
          { id: 'sub_4', name: 'Din Kültürü', questionCount: 10 },
          { id: 'sub_5', name: 'İngilizce', questionCount: 10 }
        ];
      }
      this.wizardActiveSubjId = this.wizardSubjects[0].id;
      this.wizardRenderSubjectsUI();
      this.wizardRenderAnswerKeyGrid();
    },

    wizardAddSubject() {
      const newId = 'sub_' + Date.now();
      this.wizardSubjects.push({ id: newId, name: 'Yeni Ders', questionCount: 10 });
      this.wizardActiveSubjId = newId;
      this.wizardRenderSubjectsUI();
      this.wizardRenderAnswerKeyGrid();
    },

    wizardRemoveSubject(subjId) {
      if (this.wizardSubjects.length <= 1) {
        if (window.Companion) window.Companion.showToast('En az 1 ders bulunmalıdır.');
        return;
      }
      this.wizardSubjects = this.wizardSubjects.filter(s => s.id !== subjId);
      this.wizardActiveSubjId = this.wizardSubjects[0].id;
      this.wizardRenderSubjectsUI();
      this.wizardRenderAnswerKeyGrid();
    },

    wizardUpdateSubject(subjId, field, val) {
      const s = this.wizardSubjects.find(x => x.id === subjId);
      if (s) {
        if (field === 'questionCount') s.questionCount = Math.max(1, parseInt(val, 10) || 1);
        else s.name = String(val).trim() || 'Ders';
      }
      this.wizardRenderSubjectsUI(false);
      this.wizardRenderAnswerKeyGrid();
    },

    wizardRenderSubjectsUI(rebuild = true) {
      const container = document.getElementById('wizard-subjects-list');
      const badge = document.getElementById('wizard-multi-total-badge');
      const total = this.wizardSubjects.reduce((sum, s) => sum + (parseInt(s.questionCount, 10) || 0), 0);

      if (badge) badge.textContent = `Toplam: ${total} Soru`;
      if (!container || !rebuild) return;

      container.innerHTML = this.wizardSubjects.map((subj, idx) => `
        <div style="display: flex; align-items: center; gap: 6px; background: #ffffff; padding: 6px 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <span style="font-size: 11px; font-weight: 800; color: #94a3b8; min-width: 16px;">${idx + 1}.</span>
          <input type="text" class="c-input" value="${subj.name}" placeholder="Ders Adı" style="flex: 1; height: 30px; font-size: 12px; padding: 4px 8px;" onchange="window.CompanionOmr.wizardUpdateSubject('${subj.id}', 'name', this.value)" />
          <input type="number" class="c-input" min="1" max="50" value="${subj.questionCount}" style="width: 60px; height: 30px; font-size: 12px; padding: 4px 6px; text-align: center;" onchange="window.CompanionOmr.wizardUpdateSubject('${subj.id}', 'questionCount', this.value)" />
          <button type="button" class="c-icon-btn" style="width: 28px; height: 28px; padding: 0; color: #ef4444;" onclick="window.CompanionOmr.wizardRemoveSubject('${subj.id}')">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `).join('');

      if (window.Companion) window.Companion.renderIcons();
    },

    wizardRenderAnswerKeyGrid() {
      const grid = document.getElementById('wizard-answer-key-grid');
      const tabs = document.getElementById('wizard-key-subj-tabs');
      if (!grid) return;

      const choicesCount = this.wizardChoicesCount || 4;
      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);

      if (this.wizardType === 'multi') {
        const subjects = this.wizardSubjects || [];
        if (!this.wizardActiveSubjId) {
          this.wizardActiveSubjId = subjects[0] ? subjects[0].id : 'ALL';
        }

        if (tabs) {
          tabs.style.display = 'flex';
          const allPill = `
            <button type="button" class="c-subject-pill ${this.wizardActiveSubjId === 'ALL' ? 'active' : ''}" style="cursor: pointer;" onclick="window.CompanionOmr.wizardSelectSubjTab('ALL')">
              📋 Tüm Dersler
            </button>
          `;
          tabs.innerHTML = allPill + subjects.map(s => `
            <button type="button" class="c-subject-pill ${s.id === this.wizardActiveSubjId ? 'active' : ''}" style="cursor: pointer;" onclick="window.CompanionOmr.wizardSelectSubjTab('${s.id}')">
              📚 ${s.name} (${s.questionCount}S)
            </button>
          `).join('');
        }

        const targetSubjects = this.wizardActiveSubjId === 'ALL'
          ? subjects
          : [subjects.find(s => s.id === this.wizardActiveSubjId) || subjects[0]].filter(Boolean);

        if (targetSubjects.length === 0) return;

        let html = '';
        targetSubjects.forEach(subj => {
          let cumulativeOffset = 0;
          for (const s of subjects) {
            if (s.id === subj.id) break;
            cumulativeOffset += (parseInt(s.questionCount, 10) || 0);
          }
          const count = parseInt(subj.questionCount, 10) || 10;
          html += `
            <div style="grid-column: 1 / -1; background: #eef2ff; border: 1px solid #c7d2fe; padding: 6px 10px; border-radius: 8px; margin: 6px 0 4px; font-weight: 800; font-size: 12px; color: #4338ca; display: flex; justify-content: space-between; align-items: center;">
              <span>📚 ${subj.name}</span>
              <span style="font-size: 11px; color: #4f46e5;">1 - ${count}. Sorular</span>
            </div>
          `;
          for (let q = 1; q <= count; q++) {
            const globalQ = cumulativeOffset + q;
            const key = `${subj.id}_${q}`;
            const sel = this.wizardKey[key] || this.wizardKey[`${subj.name}_${q}`] || this.wizardKey[globalQ] || '';
            html += `
              <div class="c-ak-row">
                <span class="c-ak-q-num">S.${q}</span>
                <div class="c-ak-bubbles">
                  ${letters.map(letter => `
                    <button type="button" class="c-ak-bubble-btn ${sel === letter ? 'active' : ''}" onclick="window.CompanionOmr.wizardSetAnswer('${key}', '${letter}')">
                      ${letter}
                    </button>
                  `).join('')}
                </div>
              </div>
            `;
          }
        });
        grid.innerHTML = html;
      } else {
        if (tabs) tabs.style.display = 'none';
        const qInput = document.getElementById('wizard-exam-questions');
        const count = parseInt(qInput ? qInput.value : 20, 10) || 20;

        grid.innerHTML = Array.from({ length: count }, (_, i) => i + 1).map(q => {
          const sel = this.wizardKey[q] || '';
          return `
            <div class="c-ak-row">
              <span class="c-ak-q-num">S.${q}</span>
              <div class="c-ak-bubbles">
                ${letters.map(letter => `
                  <button type="button" class="c-ak-bubble-btn ${sel === letter ? 'active' : ''}" onclick="window.CompanionOmr.wizardSetAnswer(${q}, '${letter}')">
                    ${letter}
                  </button>
                `).join('')}
              </div>
            </div>
          `;
        }).join('');
      }
    },

    wizardSelectSubjTab(subjId) {
      this.wizardActiveSubjId = subjId;
      this.wizardRenderAnswerKeyGrid();
    },

    wizardSetAnswer(qKey, letter) {
      if (this.wizardType === 'multi') {
        const subjects = this.wizardSubjects || [];
        const currentSubj = subjects.find(s => String(qKey).startsWith(s.id + '_')) || subjects.find(s => s.id === this.wizardActiveSubjId);
        if (currentSubj) {
          let cumulativeOffset = 0;
          for (const s of subjects) {
            if (s.id === currentSubj.id) break;
            cumulativeOffset += (parseInt(s.questionCount, 10) || 0);
          }
          const m = String(qKey).match(/_(\d+)$/);
          const qNum = m ? parseInt(m[1], 10) : parseInt(qKey, 10);
          if (qNum) {
            const globalQ = cumulativeOffset + qNum;
            const idKey = `${currentSubj.id}_${qNum}`;
            const nameKey = `${currentSubj.name}_${qNum}`;
            const existing = this.wizardKey[idKey] || this.wizardKey[nameKey] || this.wizardKey[globalQ] || '';
            if (existing === letter) {
              delete this.wizardKey[idKey];
              delete this.wizardKey[nameKey];
              delete this.wizardKey[globalQ];
            } else {
              this.wizardKey[idKey] = letter;
              this.wizardKey[nameKey] = letter;
              this.wizardKey[globalQ] = letter;
            }
          }
        }
      } else {
        if (this.wizardKey[qKey] === letter) {
          delete this.wizardKey[qKey];
        } else {
          this.wizardKey[qKey] = letter;
        }
      }

      this.wizardRenderAnswerKeyGrid();
      if (window.Companion) window.Companion.vibrate(10);
    },

    wizardFillSampleKey() {
      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, this.wizardChoicesCount || 4);
      if (this.wizardType === 'multi') {
        let globalCursor = 1;
        this.wizardSubjects.forEach(s => {
          for (let q = 1; q <= s.questionCount; q++) {
            const ans = letters[(globalCursor * 3) % letters.length];
            this.wizardKey[`${s.id}_${q}`] = ans;
            this.wizardKey[`${s.name}_${q}`] = ans;
            this.wizardKey[globalCursor] = ans;
            globalCursor++;
          }
        });
      } else {
        const qInput = document.getElementById('wizard-exam-questions');
        const count = parseInt(qInput ? qInput.value : 20, 10) || 20;
        for (let q = 1; q <= count; q++) {
          this.wizardKey[q] = letters[(q * 3) % letters.length];
        }
      }
      this.wizardRenderAnswerKeyGrid();
      if (window.Companion) window.Companion.showToast('Örnek cevap anahtarı dolduruldu.');
    },

    wizardClearKey() {
      this.wizardKey = {};
      this.wizardRenderAnswerKeyGrid();
      if (window.Companion) window.Companion.showToast('Cevap anahtarı temizlendi.');
    },

    wizardToggleTextBox() {
      const box = document.getElementById('wizard-key-text-box');
      if (box) box.style.display = (box.style.display === 'none') ? 'block' : 'none';
    },

    wizardApplyTextKey() {
      const txtInput = document.getElementById('wizard-key-text-input');
      const text = txtInput ? txtInput.value.trim().toUpperCase() : '';
      if (!text) return;

      const pairs = text.match(/(\d+)\s*[:.\-\s]\s*([A-E])/gi) || text.match(/(\d+)([A-E])/gi);
      if (pairs) {
        let currentSubjIdx = 0;
        let prevQ = 0;
        const subjects = this.wizardSubjects || [];

        pairs.forEach(p => {
          const m = p.match(/(\d+)[^A-E]*([A-E])/i);
          if (m) {
            const q = parseInt(m[1], 10);
            const ans = m[2].toUpperCase();
            if (this.wizardType === 'multi' && subjects.length > 0) {
              if (this.wizardActiveSubjId && this.wizardActiveSubjId !== 'ALL') {
                const activeSubj = subjects.find(s => s.id === this.wizardActiveSubjId) || subjects[0];
                let cumulativeOffset = 0;
                for (const s of subjects) {
                  if (s.id === activeSubj.id) break;
                  cumulativeOffset += (parseInt(s.questionCount, 10) || 0);
                }
                if (q >= 1 && q <= (parseInt(activeSubj.questionCount, 10) || 20)) {
                  const globalQ = cumulativeOffset + q;
                  this.wizardKey[`${activeSubj.id}_${q}`] = ans;
                  if (activeSubj.name) this.wizardKey[`${activeSubj.name}_${q}`] = ans;
                  this.wizardKey[globalQ] = ans;
                }
              } else {
                // 'ALL' görünümündeyken her ders 1'den başlayarak girilmişse (1..15, 1..15) veya ardışık (1..30) girilmişse akıllı eşle
                if (q === 1 && prevQ > 1 && currentSubjIdx < subjects.length - 1) {
                  currentSubjIdx++;
                }
                const curSubj = subjects[currentSubjIdx];
                if (curSubj && q <= (parseInt(curSubj.questionCount, 10) || 10)) {
                  let cumulativeOffset = 0;
                  for (let i = 0; i < currentSubjIdx; i++) {
                    cumulativeOffset += (parseInt(subjects[i].questionCount, 10) || 0);
                  }
                  const globalQ = cumulativeOffset + q;
                  this.wizardKey[`${curSubj.id}_${q}`] = ans;
                  if (curSubj.name) this.wizardKey[`${curSubj.name}_${q}`] = ans;
                  this.wizardKey[globalQ] = ans;
                  prevQ = q;
                } else {
                  // Global soru numarası (örn. 16..30) olarak girilmişse ilgili dersi bul
                  let cum = 0;
                  for (const s of subjects) {
                    const cnt = parseInt(s.questionCount, 10) || 0;
                    if (q > cum && q <= cum + cnt) {
                      const subjQ = q - cum;
                      this.wizardKey[`${s.id}_${subjQ}`] = ans;
                      if (s.name) this.wizardKey[`${s.name}_${subjQ}`] = ans;
                      this.wizardKey[q] = ans;
                      break;
                    }
                    cum += cnt;
                  }
                }
              }
            } else {
              this.wizardKey[q] = ans;
            }
          }
        });
      }
      this.wizardRenderAnswerKeyGrid();
      document.getElementById('wizard-key-text-box').style.display = 'none';
      if (window.Companion) window.Companion.showToast('Cevap anahtarı uygulandı.');
    },

    // Sınav Oluştur ve Masaüstüne Gönder
    async submitCreateExamForm() {
      const nameInput = document.getElementById('wizard-exam-name');
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        if (window.Companion) window.Companion.showToast('Lütfen sınav adını girin.');
        return;
      }

      const isClassTeacher = (window.Companion && typeof window.Companion.isClassTeacher === 'function' && window.Companion.isClassTeacher()) ||
                             (window.Companion && window.Companion.profile && (window.Companion.profile.isClassTeacher || (window.Companion.profile.branch && window.Companion.profile.branch.includes('Sınıf Öğretmeni')))) ||
                             (this.getData().educationLevel === 'primary');

      let branch = '';
      if (isClassTeacher) {
        branch = (window.Companion && window.Companion.activeSection) || (window.Companion && window.Companion.profile && window.Companion.profile.sections && window.Companion.profile.sections[0]) || '';
      } else {
        const sectionSelect = document.getElementById('wizard-exam-section');
        branch = sectionSelect ? sectionSelect.value : '5-A';
      }

      const weekSelect = document.getElementById('wizard-exam-week');
      const week = weekSelect ? weekSelect.value : 'W4';

      const durInput = document.getElementById('wizard-exam-duration');
      const duration = parseInt(durInput ? durInput.value : 40, 10) || 40;

      const wrongAffCheck = document.getElementById('wizard-wrong-affects');
      const wrongAffects = wrongAffCheck ? wrongAffCheck.checked : false;

      const penaltySelect = document.getElementById('wizard-penalty-rate');
      const penaltyRate = wrongAffects ? (parseInt(penaltySelect ? penaltySelect.value : 4, 10) || 4) : 0;

      const isMulti = this.wizardType === 'multi';
      let totalQ = 20;
      let subjects = [];

      if (isMulti) {
        subjects = this.wizardSubjects.map(s => ({
          id: s.id,
          name: s.name,
          questionCount: s.questionCount,
          answerKey: {}
        }));
        totalQ = subjects.reduce((sum, s) => sum + s.questionCount, 0);

        // Ders içi cevap anahtarlarını da eşle
        let cumulative = 0;
        subjects.forEach(s => {
          s.answerKey = {};
          for (let qi = 1; qi <= s.questionCount; qi++) {
            const globalQ = cumulative + qi;
            const val = this.wizardKey[`${s.id}_${qi}`] || this.wizardKey[`${s.name}_${qi}`] || this.wizardKey[globalQ];
            if (val) {
              s.answerKey[qi] = val;
              this.wizardKey[`${s.id}_${qi}`] = val;
              this.wizardKey[`${s.name}_${qi}`] = val;
              this.wizardKey[globalQ] = val;
            }
          }
          cumulative += s.questionCount;
        });
      } else {
        const qInput = document.getElementById('wizard-exam-questions');
        totalQ = parseInt(qInput ? qInput.value : 20, 10) || 20;
      }

      const newExam = {
        id: 'exam_' + Date.now(),
        weekId: week,
        examName: name,
        isMultiSubject: isMulti,
        subjects: isMulti ? subjects : [],
        totalQuestions: totalQ,
        duration: duration,
        wrongAffects: wrongAffects,
        penaltyRate: penaltyRate,
        branch: branch,
        hasOpticalForm: true,
        choicesCount: this.wizardChoicesCount || 4,
        answerKey: { ...this.wizardKey },
        examScores: {},
        studentResults: {},
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Yerel hafızaya kaydet
      const data = this.getData();
      if (!Array.isArray(data.weeklyEvaluations)) data.weeklyEvaluations = [];
      data.weeklyEvaluations.unshift(newExam);
      this.saveData(data);

      this.activeExam = newExam;

      // 2. Modalı kapat
      this.closeCreateExamModal();

      // 3. Buluta ve Masaüstüne Canlı Olarak Fırlat!
      if (window.CloudSync) {
        window.CloudSync.pushExam(newExam).catch(() => {});
        if (typeof window.CloudSync.pushLiveExamCreated === 'function') {
          window.CloudSync.pushLiveExamCreated(newExam, 'terminal').catch(() => {});
        }
      }

      playSuccessBeep();
      if (window.Companion) {
        window.Companion.showToast('✅ Sınav başarıyla oluşturuldu ve masaüstüne gönderildi!');
      }

      // 4. Doğrudan oluşturulan sınavın detayına git
      this.openExam(newExam.id);
    },

    promptDeleteExam(examId) {
      const data = this.getData();
      const target = (data.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
      const examName = target ? (target.examName || 'Bu sınavı') : 'Bu sınavı';

      if (!confirm(`"${examName}" sınavını silmek istediğinize emin misiniz?`)) return;

      data.weeklyEvaluations = (data.weeklyEvaluations || []).filter(e => String(e.id) !== String(examId));
      if (!Array.isArray(data.deletedExamIds)) data.deletedExamIds = [];
      if (!data.deletedExamIds.includes(String(examId))) data.deletedExamIds.push(String(examId));
      this.saveData(data);

      if (this.activeExam && String(this.activeExam.id) === String(examId)) {
        this.activeExam = null;
        this.viewState = 'list';
      }
      this.renderHub();

      // Buluta & Masaüstüne Canlı Olarak Silme Olayı Gönder
      if (window.CloudSync && typeof window.CloudSync.pushLiveExamDeleted === 'function') {
        window.CloudSync.pushLiveExamDeleted(examId, examName, 'terminal').catch(() => {});
      }

      if (window.Companion) window.Companion.showToast(`"${examName}" silindi ve masaüstünden kaldırıldı.`);
    },

    // Masaüstünden Canlı Gelen Sınav Ekleme/Güncelleme Olayını Uygula
    handleRemoteExamUpsert(examData, eventType) {
      if (!examData || !examData.id) return;
      const data = this.getData();
      if (!Array.isArray(data.weeklyEvaluations)) data.weeklyEvaluations = [];
      if (Array.isArray(data.deletedExamIds)) {
        data.deletedExamIds = data.deletedExamIds.filter(id => String(id) !== String(examData.id));
      }

      const existingIdx = data.weeklyEvaluations.findIndex(e => String(e.id) === String(examData.id));
      if (existingIdx >= 0) {
        if (window.CloudSync && typeof window.CloudSync.mergeExamObjects === 'function') {
          data.weeklyEvaluations[existingIdx] = window.CloudSync.mergeExamObjects(data.weeklyEvaluations[existingIdx], examData);
        } else {
          data.weeklyEvaluations[existingIdx] = {
            ...data.weeklyEvaluations[existingIdx],
            ...examData,
            updatedAt: new Date().toISOString()
          };
        }
        this.deduplicateExamStudentResults(data.weeklyEvaluations[existingIdx]);
      } else {
        this.deduplicateExamStudentResults(examData);
        data.weeklyEvaluations.unshift(examData);
      }
      this.saveData(data);

      if (this.activeExam && String(this.activeExam.id) === String(examData.id)) {
        const refreshed = data.weeklyEvaluations.find(e => String(e.id) === String(examData.id));
        if (refreshed) this.activeExam = refreshed;
      }

      this.renderHub();
      playSuccessBeep();
      if (window.Companion) {
        window.Companion.showToast(`🖥️ Masaüstünden Canlı: "${examData.examName || 'Sınav'}" eşitlendi.`);
      }
    },

    // Masaüstünden Canlı Gelen Sınav Silme Olayını Uygula
    handleRemoteExamDeleted(examId, examName) {
      if (!examId) return;
      const data = this.getData();
      if (!Array.isArray(data.weeklyEvaluations)) data.weeklyEvaluations = [];

      data.weeklyEvaluations = data.weeklyEvaluations.filter(e => String(e.id) !== String(examId));
      if (!Array.isArray(data.deletedExamIds)) data.deletedExamIds = [];
      if (!data.deletedExamIds.includes(String(examId))) data.deletedExamIds.push(String(examId));
      this.saveData(data);

      if (this.activeExam && String(this.activeExam.id) === String(examId)) {
        this.activeExam = null;
        this.viewState = 'list';
      }

      this.renderHub();
      if (window.Companion) {
        window.Companion.showToast(`🖥️ Masaüstünden: "${examName || 'Sınav'}" silindi.`);
      }
    },

    // Masaüstünden Canlı Gelen Tek Öğrenci Optik Sonuç Silme Olayını Uygula
    handleRemoteResultDeleted(examId, studentId, studentNo) {
      if (!examId || !studentId) return;
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
      if (exam && exam.studentResults) {
        delete exam.studentResults[studentId];
        if (studentNo) delete exam.studentResults[String(studentNo)];
        if (exam.examScores) {
          delete exam.examScores[studentId];
          if (studentNo) delete exam.examScores[String(studentNo)];
        }
        if (!Array.isArray(exam.deletedStudentIds)) exam.deletedStudentIds = [];
        if (!exam.deletedStudentIds.includes(String(studentId))) exam.deletedStudentIds.push(String(studentId));
        if (studentNo && !exam.deletedStudentIds.includes(String(studentNo))) exam.deletedStudentIds.push(String(studentNo));

        this.saveData(data);
        if (this.activeExam && String(this.activeExam.id) === String(examId)) {
          this.activeExam = exam;
        }
        this.renderHub();
      }
    },

    // Masaüstünden Canlı Gelen Tüm Optik Sonuçları Sıfırlama Olayını Uygula
    handleRemoteAllResultsCleared(examId) {
      if (!examId) return;
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
      if (exam) {
        exam.studentResults = {};
        exam.examScores = {};
        exam.allResultsCleared = true;
        this.saveData(data);
        if (this.activeExam && String(this.activeExam.id) === String(examId)) {
          this.activeExam = exam;
        }
        this.renderHub();
      }
    },

    // ==========================================================================
    // AKILLI BELGE TARAYICI (GOOGLE ML KIT) & CANLI KAMERA VİZÖR YÖNETİMİ
    // ==========================================================================

    async openCamera() {
      // Android ortamında Google Document Scanner destekleniyorsa doğrudan akıllı tarayıcıyı başlat
      if (window.AndroidBridge && typeof window.AndroidBridge.startDocumentScan === 'function') {
        window.AndroidBridge.startDocumentScan(30);
        return;
      }
      return this.openLiveCamera();
    },

    startDocumentScan(limit = 30) {
      if (window.AndroidBridge && typeof window.AndroidBridge.startDocumentScan === 'function') {
        window.AndroidBridge.startDocumentScan(limit);
        return true;
      }
      this.openLiveCamera();
      return false;
    },

    async openLiveCamera() {
      const modal = document.getElementById('companion-omr-camera-modal');
      const video = document.getElementById('omr-camera-video');
      const examNameTag = document.getElementById('omr-camera-exam-name');

      if (examNameTag && this.activeExam) {
        examNameTag.textContent = this.activeExam.examName;
      }

      if (modal) modal.style.display = 'flex';
      this.updateAutoAdvanceButtonUI();

      // Kağıt boyutu açılır menüsünü sınav verisine veya varsayılan değere ayarla
      const formatSelect = document.getElementById('omr-paper-format-select');
      if (this.activeExam && this.activeExam.perPage) {
        this.currentPaperFormat = parseInt(this.activeExam.perPage, 10) || 2;
      } else if (!this.currentPaperFormat) {
        this.currentPaperFormat = 2; // Varsayılan: A5 Yarım Sayfa (Kesilmiş)
      }
      if (formatSelect) {
        formatSelect.value = String(this.currentPaperFormat);
      }
      this.applyGuideBoxFormat(this.currentPaperFormat);

      try {
        if (window.AndroidBridge && typeof window.AndroidBridge.requestCameraPermission === 'function') {
          window.AndroidBridge.requestCameraPermission();
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        }).catch(() => {
          return navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
          });
        }).catch(() => {
          return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        });

        this.activeStream = stream;
        video.srcObject = stream;
        video.setAttribute('playsinline', '');
        video.setAttribute('autoplay', '');
        video.muted = true;
        await video.play();

        this.isScanningLoop = true;
        this.startLiveLoop();
        if (window.Companion) window.Companion.renderIcons();
      } catch (err) {
        console.error('Kamera başlatılamadı:', err);
        if (window.Companion) {
          window.Companion.showToast('Kamera açılamadı. Lütfen kamera izni verin.');
        }
        this.closeCamera();
      }
    },

    closeCamera() {
      this.isScanningLoop = false;
      this.hideResultHud();
      if (this.autoAdvanceTimer) {
        clearTimeout(this.autoAdvanceTimer);
        this.autoAdvanceTimer = null;
      }

      if (this.activeStream) {
        this.activeStream.getTracks().forEach(t => t.stop());
        this.activeStream = null;
      }

      const video = document.getElementById('omr-camera-video');
      if (video) video.srcObject = null;

      const modal = document.getElementById('companion-omr-camera-modal');
      if (modal) modal.style.display = 'none';

      this.isTorchOn = false;
      const torchBtn = document.getElementById('omr-torch-btn');
      if (torchBtn) torchBtn.classList.remove('active');

      this.renderHub();
    },

    async toggleTorch() {
      if (!this.activeStream) return;
      const track = this.activeStream.getVideoTracks()[0];
      if (!track) return;

      try {
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (!capabilities.torch) {
          if (window.Companion) window.Companion.showToast('Cihaz feneri desteklemiyor.');
          return;
        }
        this.isTorchOn = !this.isTorchOn;
        await track.applyConstraints({ advanced: [{ torch: this.isTorchOn }] });
        const torchBtn = document.getElementById('omr-torch-btn');
        if (torchBtn) torchBtn.classList.toggle('active', this.isTorchOn);
      } catch (e) {}
    },

    toggleAutoAdvance() {
      this.autoAdvance = !this.autoAdvance;
      this.saveSettings();
      this.updateAutoAdvanceButtonUI();
      if (window.Companion) {
        window.Companion.vibrate(20);
        window.Companion.showToast(this.autoAdvance ? 'Seri Okuma Açık' : 'Seri Okuma Kapalı');
      }
    },

    updateAutoAdvanceButtonUI() {
      const btn = document.getElementById('omr-auto-advance-btn');
      if (btn) btn.classList.toggle('active', this.autoAdvance);
    },

    // Vizör (Kılavuz Çerçeve) Bounding Box'ını Video Çözünürlüğüne Dönüştür
    getGuideBoxVideoBounds(video, guideBox) {
      if (!video || !guideBox || !video.videoWidth || !video.videoHeight) return null;
      const vRect = video.getBoundingClientRect();
      const gRect = guideBox.getBoundingClientRect();
      if (vRect.width <= 0 || vRect.height <= 0) return null;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const elemW = vRect.width;
      const elemH = vRect.height;

      const scale = Math.max(elemW / vw, elemH / vh);
      const dispW = vw * scale;
      const dispH = vh * scale;

      const offsetX = (elemW - dispW) / 2;
      const offsetY = (elemH - dispH) / 2;

      const gRelLeft = (gRect.left - vRect.left) - offsetX;
      const gRelTop = (gRect.top - vRect.top) - offsetY;
      const gRelRight = gRelLeft + gRect.width;
      const gRelBottom = gRelTop + gRect.height;

      const canvasMinX = gRelLeft / scale;
      const canvasMaxX = gRelRight / scale;
      const canvasMinY = gRelTop / scale;
      const canvasMaxY = gRelBottom / scale;

      const marginX = (canvasMaxX - canvasMinX) * 0.25;
      const marginY = (canvasMaxY - canvasMinY) * 0.25;

      return {
        minX: Math.max(0, Math.round(canvasMinX - marginX)),
        maxX: Math.min(vw, Math.round(canvasMaxX + marginX)),
        minY: Math.max(0, Math.round(canvasMinY - marginY)),
        maxY: Math.min(vh, Math.round(canvasMaxY + marginY))
      };
    },

    setPaperFormat(val) {
      this.currentPaperFormat = parseInt(val, 10) || 2;
      this.applyGuideBoxFormat(this.currentPaperFormat);
      const label = this.currentPaperFormat === 1 ? 'A4 (Tam Sayfa)' : (this.currentPaperFormat === 4 ? 'A6 (Çeyrek Sayfa - Kesilmiş)' : 'A5 (Yarım Sayfa - Kesilmiş)');
      if (window.Companion) window.Companion.showToast(`Kağıt Formatı: ${label}`);
    },

    applyGuideBoxFormat(format) {
      const guideBox = document.getElementById('omr-guide-box');
      if (!guideBox) return;
      if (format === 1) {
        // A4 (Tam Sayfa - Dikey)
        guideBox.style.width = '82vw';
        guideBox.style.height = 'calc(82vw * 1.414)';
        guideBox.style.maxWidth = '380px';
        guideBox.style.maxHeight = '537px';
      } else if (format === 4) {
        // A6 (Çeyrek Sayfa - Yatay)
        guideBox.style.width = '88vw';
        guideBox.style.height = 'calc(88vw / 1.414)';
        guideBox.style.maxWidth = '460px';
        guideBox.style.maxHeight = '325px';
      } else {
        // A5 (Yarım Sayfa - Yatay Kesilmiş Kart)
        guideBox.style.width = '90vw';
        guideBox.style.height = 'calc(90vw / 1.414)';
        guideBox.style.maxWidth = '480px';
        guideBox.style.maxHeight = '340px';
      }
    },

    // Canlı Kamera Hafif Döngüsü (jsQR + OMR Otomatik Tetikleme)
    startLiveLoop() {
      const video = document.getElementById('omr-camera-video');
      const guideBox = document.getElementById('omr-guide-box');
      const statusPill = document.getElementById('omr-status-pill');
      const statusText = document.getElementById('omr-status-text');

      const fastCanvas = document.createElement('canvas');
      fastCanvas.width = 960;
      fastCanvas.height = 720;
      const fCtx = fastCanvas.getContext('2d', { willReadFrequently: true });

      const subQrCanvas = document.createElement('canvas');
      subQrCanvas.width = 440;
      subQrCanvas.height = 360;
      const subQrCtx = subQrCanvas.getContext('2d', { willReadFrequently: true });

      const loop = async () => {
        if (!this.isScanningLoop) return;

        const now = Date.now();
        if (this.isProcessingFrame || now < this.scanCooldownUntil) {
          requestAnimationFrame(() => setTimeout(loop, 200));
          return;
        }

        if (video && video.readyState >= 2 && !video.paused) {
          try {
            const vw = video.videoWidth || 960;
            const vh = video.videoHeight || 720;
            const fw = 720;
            const fh = Math.max(400, Math.min(1280, Math.round(fw * (vh / Math.max(1, vw)))));
            if (fastCanvas.width !== fw || fastCanvas.height !== fh) {
              fastCanvas.width = fw;
              fastCanvas.height = fh;
            }
            fCtx.drawImage(video, 0, 0, fw, fh);
            const imgData = fCtx.getImageData(0, 0, fw, fh);

            // 0. ArUco Belirteç Doğrulaması (0 ms, 1:1 Oranlı Masif Geometrik Matris)
            let detectedAruco = null;
            if (window.OmrEngine && typeof window.OmrEngine.scanArucoInGrayscale === 'function') {
              const totalPx = fw * fh;
              const grayFrame = new Uint8Array(totalPx);
              const d = imgData.data;
              for (let i = 0; i < totalPx; i++) {
                const i4 = i * 4;
                grayFrame[i] = Math.round(d[i4] * 0.299 + d[i4 + 1] * 0.587 + d[i4 + 2] * 0.114);
              }
              const activeStus = typeof this.getActiveStudents === 'function' ? this.getActiveStudents() : [];
              const validNums = Array.isArray(activeStus) ? activeStus.map(s => String(s?.number ?? s?.no ?? '').trim()).filter(Boolean) : null;
              const aRes = window.OmrEngine.scanArucoInGrayscale(grayFrame, fw, fh, Math.round(fw * 0.45), fw, 0, Math.round(fh * 0.55), validNums);
              if (aRes && aRes.success) {
                detectedAruco = aRes;
              }
            }

            // 1. QR Kod Doğrulaması (jsQR)
            let detectedQr = null;
            if (!detectedAruco && typeof window.jsQR === 'function') {
              detectedQr = window.jsQR(imgData.data, fw, fh, { inversionAttempts: 'attemptBoth' });

              // 2. Eğer tam karede bulunamadıysa, rozetin bulunduğu sağ üst çeyreği tam video çözünürlüğünde tara
              if (!detectedQr && video.videoWidth > 0 && subQrCtx) {
                const cropW = Math.round(vw * 0.45);
                const cropH = Math.round(vh * 0.45);
                const cropX = Math.max(0, vw - cropW);
                const cropY = 0;
                subQrCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, 440, 360);
                const subData = subQrCtx.getImageData(0, 0, 440, 360);
                detectedQr = window.jsQR(subData.data, 440, 360, { inversionAttempts: 'attemptBoth' });
              }
            }

            if (detectedAruco || (detectedQr && detectedQr.data)) {
              guideBox && guideBox.classList.add('locked');
              statusPill && statusPill.classList.add('success');
              if (statusText) statusText.textContent = detectedAruco ? `🎯 ArUco No:${detectedAruco.studentNumber} Algılandı • Okunuyor...` : '🎯 Form / QR Algılandı • Okunuyor...';

              await this.executeFullFrameScan(detectedQr, detectedAruco);
            } else {
              guideBox && guideBox.classList.remove('locked');
              statusPill && statusPill.classList.remove('success');
              if (statusText) statusText.textContent = 'Optik formu kılavuza oturtun';
            }
          } catch (err) {}
        }

        if (this.isScanningLoop) {
          setTimeout(loop, 220);
        }
      };

      setTimeout(loop, 300);
    },

    async executeFullFrameScan(liveQr = null, liveAruco = null) {
      const video = document.getElementById('omr-camera-video');
      if (!video || video.videoWidth === 0 || this.isProcessingFrame) return;

      this.isProcessingFrame = true;

      try {
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = video.videoWidth;
        fullCanvas.height = video.videoHeight;
        const ctx = fullCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0, fullCanvas.width, fullCanvas.height);

        const guideBox = document.getElementById('omr-guide-box');
        const bounds = this.getGuideBoxVideoBounds(video, guideBox);
        await this.processImageCanvas(fullCanvas, bounds, liveQr, liveAruco);
      } catch (e) {
        console.error('Tam tarama hatası:', e);
        this.isProcessingFrame = false;
      }
    },

    async captureManual() {
      if (window.Companion) window.Companion.vibrate(25);
      const video = document.getElementById('omr-camera-video');
      if (!video || video.videoWidth === 0) return;

      const guideBox = document.getElementById('omr-guide-box');
      const statusPill = document.getElementById('omr-status-pill');
      const statusText = document.getElementById('omr-status-text');

      guideBox && guideBox.classList.add('locked');
      statusPill && statusPill.classList.add('success');
      if (statusText) statusText.textContent = '📸 Analiz Ediliyor...';

      this.isProcessingFrame = true;
      try {
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = video.videoWidth;
        fullCanvas.height = video.videoHeight;
        const ctx = fullCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0, fullCanvas.width, fullCanvas.height);

        const bounds = this.getGuideBoxVideoBounds(video, guideBox);
        await this.processImageCanvas(fullCanvas, bounds, null);
      } catch (e) {
        console.error('Manuel çekim hatası:', e);
        this.isProcessingFrame = false;
        guideBox && guideBox.classList.remove('locked');
        statusPill && statusPill.classList.remove('success');
        if (statusText) statusText.textContent = 'Optik formu kılavuza oturtun';
        if (window.Companion) window.Companion.showToast('Görüntü okunamadı: Formu kılavuza oturtup tekrar deneyin.');
      }
    },

    handleFileSelect(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);

          if (window.Companion) window.Companion.showToast('Fotoğraf taranıyor...');
          await this.processImageCanvas(c, null, null);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },

    // Görüntü Analizi (OMREngine, ArUco ve QR Kod Okuma)
    async processImageCanvas(canvas, bounds = null, liveQr = null, liveAruco = null) {
      const students = this.getActiveStudents();
      const exam = this.activeExam;

      if (!exam) {
        this.isProcessingFrame = false;
        return;
      }

      const data = this.getData();
      const allExams = Array.isArray(data.weeklyEvaluations) ? data.weeklyEvaluations : [];

      let scanResult = null;
      if (window.OmrEngine && typeof window.OmrEngine.scanDocumentPage === 'function') {
        scanResult = await window.OmrEngine.scanDocumentPage(canvas, exam, students, {
          isDoubleForm: false,
          perPage: this.currentPaperFormat || 2,
          sensitivity: this.currentSensitivity,
          bounds: bounds,
          isMobileCamera: true,
          allExams: allExams,
          liveDetectedQr: liveQr,
          liveAruco: liveAruco
        });
      }

      if (scanResult && scanResult.success && Array.isArray(scanResult.cards) && scanResult.cards.length > 0) {
        // Otomatik Sınav Eşleme Kontrolü: Fiziksel form farklı bir sınava (ör. Ai5 çoklu ders) aitse
        if (scanResult.cards[0] && scanResult.cards[0].autoSwitchedExam) {
          const sw = scanResult.cards[0].autoSwitchedExam;
          this.activeExam = sw;
          try {
            localStorage.setItem('companion_last_active_exam_id', sw.id);
          } catch(e) {}
          const examTag = document.getElementById('omr-camera-exam-name');
          if (examTag) examTag.textContent = sw.examName;
          if (window.Companion) {
            window.Companion.showToast(`🎯 Form '${sw.examName}' (${sw.isMultiSubject ? sw.subjects.length + ' Ders' : 'Tek Ders'}) ile eşleştirildi!`, 'info');
          }
        }

        const currentActiveExam = this.activeExam || exam;
        const activeRoster = this.getActiveStudents();
        const globalStudents = Array.isArray(data.students) ? data.students : [];
        const savedResults = [];

        scanResult.cards.forEach((card, cIdx) => {
          let matched = card.matched || card.candidate || null;
          if (!matched) {
            const rawNo = String(card.arucoStudentNumber || card.rawStudentNo || '').trim();
            const rawInt = parseInt(rawNo, 10);
            if (rawNo && rawNo !== '-' && rawNo !== '0') {
              const matchFn = (s) => {
                if (!s) return false;
                const sn = String(s.number ?? s.no ?? s.studentNo ?? '').trim();
                return sn && (sn === rawNo || (rawInt > 0 && parseInt(sn, 10) === rawInt));
              };
              matched = activeRoster.find(matchFn) || students.find(matchFn) || globalStudents.find(matchFn) || null;
            }
          }
          if (!matched && activeRoster.length === 1) {
            matched = activeRoster[0];
          }
          const stuName = matched ? `${matched.name} ${matched.surname || ''}`.trim() : (card.studentName || card.rawStudentName || (scanResult.cards.length > 1 ? `Form #${cIdx + 1}` : 'Öğrenci'));
          const stuNo = matched ? (matched.number || matched.no || '-') : (card.studentNo || card.rawStudentNo || '-');
          const stuId = matched ? matched.id : (card.studentId || ('temp_' + Date.now() + '_' + cIdx));

          const cardResult = {
            studentId: stuId,
            studentName: stuName,
            studentNo: stuNo,
            correct: card.correctCount,
            wrong: card.wrongCount,
            blank: card.blankCount,
            net: card.net,
            score: card.score,
            answers: card.answers,
            questionDetails: card.questionDetails,
            subjectBreakdown: card.subjectBreakdown || {},
            thumbUrl: card.thumbUrl
          };

          this.saveExamResult(currentActiveExam.id, stuId, cardResult);
          savedResults.push(cardResult);
        });

        this.activeCardResult = savedResults[0];
        playSuccessBeep();
        if (window.Companion) window.Companion.vibrate([40, 30, 40]);

        if (savedResults.length > 1) {
          const names = savedResults.map(r => r.studentName).join(', ');
          if (window.Companion) window.Companion.showToast(`✅ ${savedResults.length} Öğrenci Formu Okundu: ${names}`, 'success');
        }

        const modal = document.getElementById('companion-omr-camera-modal');
        const isModalOpen = modal && modal.style.display !== 'none';
        if (isModalOpen) {
          this.showResultHud(this.activeCardResult);
        } else {
          const r = this.activeCardResult;
          if (window.Companion) {
            window.Companion.showToast(`✅ ${r.studentName}: ${r.score} Puan (${r.correct}D ${r.wrong}Y ${r.blank}B)`, 'success');
          }
          this.renderHub();
        }

        const isUnmatched = this.activeCardResult.isUnmatched || 
                            !this.activeCardResult.studentId || 
                            (this.activeCardResult.studentId.startsWith('temp_') && (!this.activeCardResult.studentNo || this.activeCardResult.studentNo === '-')) || 
                            !this.activeCardResult.studentNo || 
                            this.activeCardResult.studentNo === '-' || 
                            this.activeCardResult.studentName === 'Öğrenci' || 
                            (typeof this.activeCardResult.studentName === 'string' && (this.activeCardResult.studentName.startsWith('Öğrenci #') || this.activeCardResult.studentName.includes('Eşleştirilemedi')));

        if (isUnmatched) {
          this.openStudentPickerModal();
        }

        if (this.autoAdvance && !isUnmatched && isModalOpen) {
          const nextBtnText = document.getElementById('omr-btn-next-text');
          let count = 2;
          if (nextBtnText) nextBtnText.textContent = `Sonraki Form (${count})`;
          this.autoAdvanceTimer = setInterval(() => {
            count--;
            if (count > 0) {
              if (nextBtnText) nextBtnText.textContent = `Sonraki Form (${count})`;
            } else {
              clearInterval(this.autoAdvanceTimer);
              this.autoAdvanceTimer = null;
              this.acceptResultAndNext();
            }
          }, 700);
        }
      } else {
        playNoticeBeep();
        const guideBox = document.getElementById('omr-guide-box');
        const statusPill = document.getElementById('omr-status-pill');
        const statusText = document.getElementById('omr-status-text');
        guideBox && guideBox.classList.remove('locked');
        statusPill && statusPill.classList.remove('success');
        if (statusText) statusText.textContent = 'Optik formu kılavuza oturtun';
        if (window.Companion) {
          window.Companion.vibrate(50);
          window.Companion.showToast('Optik form algılanamadı.');
        }
        this.isProcessingFrame = false;
        this.scanCooldownUntil = Date.now() + 1500;
      }
    },

    // Google ML Kit Belge Tarayıcı Başarılı Döndüğünde Çağrılır
    async onDocumentScanSuccess(urls, base64List) {
      const items = (Array.isArray(urls) && urls.length > 0) ? urls : (Array.isArray(base64List) ? base64List : []);
      if (!items || items.length === 0) {
        if (window.Companion) window.Companion.showToast('Taranan belge bulunamadı.');
        return;
      }

      if (window.Companion) {
        window.Companion.showToast(`📑 ${items.length} adet optik form inceleniyor...`);
      }

      let readCardsCount = 0;
      const total = items.length;

      for (let i = 0; i < total; i++) {
        const src = items[i];
        try {
          const img = await new Promise((resolve, reject) => {
            const im = new Image();
            im.crossOrigin = 'anonymous';
            im.onload = () => resolve(im);
            im.onerror = (e) => reject(e);
            im.src = src;
          });

          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          await this.processImageCanvas(canvas, null);
          readCardsCount++;
        } catch (err) {
          console.error(`Belge #${i + 1} işlenirken hata:`, err);
        }
      }

      if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === 'function') {
        window.AndroidBridge.vibrate(60);
      }

      if (total > 1) {
        if (window.Companion) {
          window.Companion.showToast(`✅ ${total} sayfadan optik formlar başarıyla okundu ve kaydedildi!`, 'success');
        }
      }
      this.renderHub();
    },

    // Google ML Kit Belge Tarayıcı İptal Edildiğinde / Hata Aldığında Çağrılır
    onDocumentScanFailed(errorMsg) {
      console.log('Document scan failed/cancelled:', errorMsg);
      if (window.Companion) {
        window.Companion.showToast(errorMsg || 'Belge tarama iptal edildi.');
      }
    },

    showResultHud(res) {
      const hud = document.getElementById('omr-result-hud');
      if (!hud) return;

      const avatar = document.getElementById('omr-hud-avatar');
      const name = document.getElementById('omr-hud-student-name');
      const no = document.getElementById('omr-hud-student-no');
      const score = document.getElementById('omr-hud-score-val');
      const correct = document.getElementById('omr-hud-correct');
      const wrong = document.getElementById('omr-hud-wrong');
      const blank = document.getElementById('omr-hud-blank');
      const net = document.getElementById('omr-hud-net');
      const nextBtnText = document.getElementById('omr-btn-next-text');

      if (avatar) avatar.textContent = (res.studentName || 'Ö')[0].toUpperCase();
      if (name) name.textContent = res.studentName;
      if (no) no.textContent = `No: ${res.studentNo}`;
      if (score) score.textContent = Number(res.score || 0).toFixed(1);
      if (correct) correct.textContent = res.correct;
      if (wrong) wrong.textContent = res.wrong;
      if (blank) blank.textContent = res.blank;
      if (net) net.textContent = Number(res.net || 0).toFixed(1);
      if (nextBtnText) nextBtnText.textContent = 'Kaydet & Sonraki Form';

      const examNameElem = document.getElementById('omr-hud-exam-name');
      const examTypeElem = document.getElementById('omr-hud-exam-type');
      if (this.activeExam) {
        if (examNameElem) examNameElem.textContent = this.activeExam.examName || 'Sınav';
        if (examTypeElem) {
          examTypeElem.textContent = this.activeExam.isMultiSubject 
            ? `📚 ${(this.activeExam.subjects || []).length} Ders • ${this.activeExam.totalQuestions || 32}S` 
            : `📄 ${this.activeExam.totalQuestions || 20} Soru`;
        }
      }

      // Eşleşmeyen Öğrenci Uyarısı
      const isUnmatched = res.isUnmatched || 
                          !res.studentId || 
                          res.studentId.startsWith('temp_') || 
                          !res.studentNo || 
                          res.studentNo === '-' || 
                          res.studentName === 'Öğrenci' || 
                          (typeof res.studentName === 'string' && (res.studentName.startsWith('Öğrenci #') || res.studentName.includes('Eşleştirilemedi')));
      const unmatchedAlert = document.getElementById('omr-unmatched-alert');
      if (unmatchedAlert) {
        unmatchedAlert.style.display = isUnmatched ? 'flex' : 'none';
      }

      // Çoklu Ders Kartları
      const subjGrid = document.getElementById('omr-hud-subjects-grid');
      if (subjGrid) {
        if (res.subjectBreakdown && Object.keys(res.subjectBreakdown).length > 0) {
          subjGrid.style.display = 'grid';
          subjGrid.innerHTML = Object.keys(res.subjectBreakdown).map(k => {
            const sb = res.subjectBreakdown[k];
            return `
              <div class="c-hud-subj-card">
                <div class="c-hud-subj-title">${sb.subjectName || k}</div>
                <div class="c-hud-subj-stats">
                  <span>${sb.correct || 0}D ${sb.wrong || 0}Y</span>
                  <span class="net">${Number(sb.net || 0).toFixed(1)} Net</span>
                </div>
              </div>
            `;
          }).join('');
        } else {
          subjGrid.style.display = 'none';
        }
      }

      hud.classList.add('show');
    },

    hideResultHud() {
      const hud = document.getElementById('omr-result-hud');
      if (hud) hud.classList.remove('show');
    },

    openStudentPickerModal() {
      if (this.autoAdvanceTimer) {
        clearInterval(this.autoAdvanceTimer);
        this.autoAdvanceTimer = null;
      }
      const modal = document.getElementById('omr-student-picker-modal');
      if (!modal) return;
      const searchInput = document.getElementById('omr-student-search-input');
      if (searchInput) {
        searchInput.value = '';
        setTimeout(() => { try { searchInput.focus(); } catch(e) {} }, 150);
      }
      this.renderStudentPickerList('');
      modal.style.display = 'flex';
      requestAnimationFrame(() => modal.classList.add('active'));
      if (window.Companion) window.Companion.renderIcons();
    },

    closeStudentPickerModal() {
      const modal = document.getElementById('omr-student-picker-modal');
      if (modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
      }
    },

    filterStudentPicker(searchTerm) {
      this.renderStudentPickerList(searchTerm);
    },

    renderStudentPickerList(filter = '') {
      const listEl = document.getElementById('omr-student-picker-list');
      if (!listEl) return;

      const students = this.getActiveStudents();
      const term = (filter || '').trim().toLowerCase();

      const filtered = students.filter(s => {
        if (!term) return true;
        const fullName = `${s.name} ${s.surname || ''}`.toLowerCase();
        const no = String(s.number || '');
        return fullName.includes(term) || no.includes(term);
      }).sort((a, b) => {
        const noA = parseInt(a.number, 10) || 0;
        const noB = parseInt(b.number, 10) || 0;
        return noA - noB;
      });

      if (filtered.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; padding: 24px 0; color: #94a3b8; font-size: 13px;">Eşleşen öğrenci bulunamadı</div>';
        return;
      }

      listEl.innerHTML = filtered.map(s => {
        const initials = ((s.name ? s.name[0] : '') + (s.surname ? s.surname[0] : '')).toUpperCase() || 'Ö';
        const isCurrent = this.activeCardResult && String(this.activeCardResult.studentId) === String(s.id);
        return `
          <div class="c-student-scan-card ${isCurrent ? 'active' : ''}" style="cursor: pointer; padding: 10px 14px;" onclick="window.CompanionOmr.assignStudent('${s.id}')">
            <div class="c-student-scan-info">
              <div class="c-scan-card-avatar" style="${isCurrent ? 'background: #4f46e5; color: #fff;' : ''}">${initials}</div>
              <div class="c-scan-card-details">
                <div class="c-scan-card-name" style="font-size: 14px; font-weight: 800;">${s.name} ${s.surname || ''}</div>
                <div class="c-scan-card-sub" style="font-size: 12px; color: #64748b;">No: ${s.number || '-'}</div>
              </div>
            </div>
            <button type="button" class="c-btn-secondary" style="font-size: 11px; padding: 4px 10px; font-weight: 700; pointer-events: none;">
              Seç
            </button>
          </div>
        `;
      }).join('');
    },

    assignStudent(studentId) {
      if (!this.activeCardResult || !this.activeExam) return;
      const students = this.getActiveStudents();
      const stu = students.find(s => String(s.id) === String(studentId));
      if (!stu) return;

      const oldStudentId = this.activeCardResult.studentId;
      const newStudentId = stu.id;

      // Eski geçici kaydı temizle
      if (oldStudentId && oldStudentId !== newStudentId) {
        const data = this.getData();
        const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(this.activeExam.id));
        if (exam && exam.studentResults) {
          delete exam.studentResults[oldStudentId];
          if (exam.examScores) delete exam.examScores[oldStudentId];
          this.saveData(data);
          this.activeExam = exam;
        }
      }

      this.activeCardResult.studentId = newStudentId;
      this.activeCardResult.studentName = `${stu.name} ${stu.surname || ''}`.trim();
      this.activeCardResult.studentNo = stu.number || '-';

      this.saveExamResult(this.activeExam.id, newStudentId, this.activeCardResult);
      this.showResultHud(this.activeCardResult);

      // Optik inceleme modalı (Optiği Gör) açıksa anlık güncelle
      const optTitle = document.getElementById('opt-inspect-title');
      const optMeta = document.getElementById('opt-inspect-meta');
      const optAvatar = document.getElementById('opt-inspect-avatar');
      if (optTitle) optTitle.textContent = this.activeCardResult.studentName;
      if (optMeta) optMeta.textContent = `No: ${this.activeCardResult.studentNo} • Puan: ${Number(this.activeCardResult.score || 0).toFixed(1)} • ${this.activeCardResult.correct || 0}D ${this.activeCardResult.wrong || 0}Y ${this.activeCardResult.blank || 0}B`;
      if (optAvatar) optAvatar.textContent = (this.activeCardResult.studentName || 'Ö')[0].toUpperCase();

      this.closeStudentPickerModal();

      if (window.Companion) {
        window.Companion.showToast(`✅ ${this.activeCardResult.studentName} başarıyla eşleştirildi!`, 'success');
        window.Companion.vibrate(30);
      }
    },

    acceptResultAndNext() {
      if (this.autoAdvanceTimer) {
        clearInterval(this.autoAdvanceTimer);
        this.autoAdvanceTimer = null;
      }
      this.hideResultHud();
      this.activeCardResult = null;
      this.isProcessingFrame = false;
      this.scanCooldownUntil = Date.now() + 1200;
      if (window.Companion) window.Companion.vibrate(15);
    },

    retryScan() {
      if (this.autoAdvanceTimer) {
        clearInterval(this.autoAdvanceTimer);
        this.autoAdvanceTimer = null;
      }
      this.hideResultHud();
      this.activeCardResult = null;
      this.isProcessingFrame = false;
      this.scanCooldownUntil = Date.now() + 500;
    },

    saveExamResult(examId, studentId, res) {
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
      if (!exam) return;

      if (!exam.studentResults) exam.studentResults = {};
      if (!exam.examScores) exam.examScores = {};

      // Aynı öğrencinin okul numarası veya farklı bir ID ile kaydedilmiş eski girdilerini temizle
      const students = this.getActiveStudents();
      const sNoStr = String(res.studentNo || res.studentNumber || '').trim();
      const matchedStu = students.find(s =>
        String(s.id) === String(studentId) ||
        (sNoStr && sNoStr !== '-' && String(s.number || '').trim() === sNoStr) ||
        (sNoStr && sNoStr !== '-' && parseInt(s.number, 10) > 0 && parseInt(s.number, 10) === parseInt(sNoStr, 10))
      );
      const canonicalStudentId = matchedStu ? String(matchedStu.id) : String(studentId);
      const canonicalName = matchedStu ? `${matchedStu.name || ''} ${matchedStu.surname || ''}`.trim() : res.studentName;
      const canonicalNo = matchedStu && matchedStu.number ? matchedStu.number : res.studentNo;

      let prevThumb = null;
      Object.keys(exam.studentResults).forEach(k => {
        const existingRes = exam.studentResults[k];
        if (!existingRes) return;
        const kNo = String(existingRes.studentNo || existingRes.studentNumber || '').trim();
        const isSameStudent =
          String(k) === canonicalStudentId ||
          String(k) === String(studentId) ||
          (canonicalNo && canonicalNo !== '-' && (String(k) === String(canonicalNo) || kNo === String(canonicalNo))) ||
          (canonicalName && existingRes.studentName && existingRes.studentName.trim().toLocaleLowerCase('tr-TR') === canonicalName.trim().toLocaleLowerCase('tr-TR'));
        if (isSameStudent) {
          if (existingRes.thumbUrl && !prevThumb) prevThumb = existingRes.thumbUrl;
          if (String(k) !== canonicalStudentId) {
            delete exam.studentResults[k];
            if (exam.examScores) delete exam.examScores[k];
          }
        }
      });

      exam.studentResults[canonicalStudentId] = {
        studentId: canonicalStudentId,
        studentName: canonicalName,
        studentNo: canonicalNo,
        correct: res.correct,
        wrong: res.wrong,
        blank: res.blank,
        net: res.net,
        score: res.score,
        answers: res.answers,
        subjectBreakdown: res.subjectBreakdown || {},
        thumbUrl: res.thumbUrl || prevThumb || null,
        updatedAt: new Date().toISOString()
      };
      exam.examScores[canonicalStudentId] = res.score;
      this.deduplicateExamStudentResults(exam);
      exam.allResultsCleared = false;
      if (Array.isArray(exam.deletedStudentIds)) {
        exam.deletedStudentIds = exam.deletedStudentIds.filter(id => id !== canonicalStudentId && id !== String(studentId) && (!canonicalNo || id !== String(canonicalNo)));
      }
      exam.updatedAt = new Date().toISOString();

      if (res.thumbUrl) {
        this.scannedCardImages = this.scannedCardImages || {};
        this.scannedCardImages[canonicalStudentId] = res.thumbUrl;
        try {
          sessionStorage.setItem('omr_thumb_' + canonicalStudentId, res.thumbUrl);
        } catch (e) {}
      }

      this.saveData(data);
      this.activeExam = exam;

      // Arka planda sessizce buluta da gönder ve masaüstüne canlı fırlat
      if (window.CloudSync) {
        window.CloudSync.pushExam(exam).catch(() => {});
        if (typeof window.CloudSync.pushLiveOmr === 'function') {
          window.CloudSync.pushLiveOmr(exam.id, exam.examName, canonicalStudentId, canonicalName, exam.studentResults[canonicalStudentId]);
        }
      }
    },

    deleteResult(studentId) {
      if (!confirm('Bu öğrencinin okuma sonucunu silmek istediğinize emin misiniz?')) return;
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(this.activeExam.id));
      if (exam && exam.studentResults) {
        const res = exam.studentResults[studentId] || {};
        const studentName = res.studentName || '';
        const studentNo = res.studentNo || res.studentNumber || '';

        delete exam.studentResults[studentId];
        if (studentNo) delete exam.studentResults[String(studentNo)];
        if (exam.examScores) {
          delete exam.examScores[studentId];
          if (studentNo) delete exam.examScores[String(studentNo)];
        }

        if (!Array.isArray(exam.deletedStudentIds)) exam.deletedStudentIds = [];
        if (!exam.deletedStudentIds.includes(String(studentId))) exam.deletedStudentIds.push(String(studentId));
        if (studentNo && !exam.deletedStudentIds.includes(String(studentNo))) exam.deletedStudentIds.push(String(studentNo));

        exam.updatedAt = new Date().toISOString();
        this.saveData(data);
        this.activeExam = exam;
        this.renderHub();
        if (window.Companion) window.Companion.showToast('Sonuç silindi.');

        if (window.CloudSync) {
          if (typeof window.CloudSync.pushLiveOmrDelete === 'function') {
            window.CloudSync.pushLiveOmrDelete(exam.id, exam.examName, studentId, studentName, studentNo);
          }
          window.CloudSync.pushExam(exam).catch(() => {});
        }
      }
    },

    clearAllResults() {
      if (!confirm('Bu sınavdaki tüm okuma sonuçlarını sıfırlamak istediğinize emin misiniz?')) return;
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(this.activeExam.id));
      if (exam) {
        exam.studentResults = {};
        exam.examScores = {};
        exam.allResultsCleared = true;
        exam.updatedAt = new Date().toISOString();
        this.saveData(data);
        this.activeExam = exam;
        this.isRanked = false;
        this.renderHub();
        if (window.Companion) window.Companion.showToast('Tüm sonuçlar temizlendi.');

        if (window.CloudSync) {
          if (typeof window.CloudSync.pushLiveOmrClearAll === 'function') {
            window.CloudSync.pushLiveOmrClearAll(exam.id, exam.examName);
          }
          window.CloudSync.pushExam(exam).catch(() => {});
        }
      }
    },

    // ==========================================================================
    // CEVAP ANAHTARI GÖRÜNTÜLEYİCİ & DÜZENLEYİCİ
    // ==========================================================================

    openKeyEditor(examId) {
      const data = this.getData();
      const exam = (examId && (data.weeklyEvaluations || []).find(e => String(e.id) === String(examId))) || this.activeExam;
      if (!exam) return;
      this.activeExam = exam;

      let modal = document.getElementById('companion-key-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'companion-key-modal';
        modal.className = 'c-key-editor-modal';
        document.body.appendChild(modal);
      }

      const totalQ = exam.totalQuestions || 32;
      const choices = ['A', 'B', 'C', 'D', 'E'].slice(0, exam.choicesCount || 4);
      const key = { ...(exam.answerKey || {}) };
      const isMulti = !!(exam.isMultiSubject && Array.isArray(exam.subjects) && exam.subjects.length > 0);

      let bodyHtml = '';

      if (isMulti) {
        let qCursor = 1;
        exam.subjects.forEach(subj => {
          bodyHtml += `
            <div style="background: var(--c-bg); padding: 8px 12px; border-radius: 8px; margin: 12px 0 6px; font-weight: 800; font-size: 13px; color: var(--c-primary); display: flex; justify-content: space-between;">
              <span>📚 ${subj.name}</span>
              <span style="font-size: 11px; opacity: 0.8;">(1 - ${subj.questionCount}. Sorular)</span>
            </div>
          `;
          for (let qi = 1; qi <= subj.questionCount; qi++) {
            const currentQ = qCursor++;
            const activeOpt = key[`${subj.id}_${qi}`] || key[`${subj.name}_${qi}`] || (subj.answerKey && subj.answerKey[qi]) || key[currentQ] || '';
            bodyHtml += `
              <div class="c-key-q-row">
                <span class="c-key-q-num">S.${qi}</span>
                <div class="c-key-opt-btns">
                  ${choices.map(opt => `
                    <button type="button" 
                            class="c-key-opt-btn ${activeOpt === opt ? 'active' : ''}" 
                            data-q="${currentQ}" 
                            data-opt="${opt}"
                            onclick="window.CompanionOmr.toggleKeyOption(${currentQ}, '${opt}')">
                      ${opt}
                    </button>
                  `).join('')}
                </div>
              </div>
            `;
          }
        });
      } else {
        bodyHtml = Array.from({ length: totalQ }, (_, i) => i + 1).map(q => {
          const activeOpt = key[q] || '';
          return `
            <div class="c-key-q-row">
              <span class="c-key-q-num">S.${q}</span>
              <div class="c-key-opt-btns">
                ${choices.map(opt => `
                  <button type="button" 
                          class="c-key-opt-btn ${activeOpt === opt ? 'active' : ''}" 
                          data-q="${q}" 
                          data-opt="${opt}"
                          onclick="window.CompanionOmr.toggleKeyOption(${q}, '${opt}')">
                    ${opt}
                  </button>
                `).join('')}
              </div>
            </div>
          `;
        }).join('');
      }

      modal.innerHTML = `
        <div class="c-key-editor-sheet">
          <div class="c-key-editor-header">
            <div>
              <h3 style="font-size: 16px; font-weight: 800;">Cevap Anahtarı</h3>
              <span style="font-size: 11px; color: var(--c-text-muted);">${exam.examName} (${totalQ} Soru)</span>
            </div>
            <button class="c-icon-btn" onclick="document.getElementById('companion-key-modal').style.display='none'">
              <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
          </div>

          <div class="c-key-editor-body" id="companion-key-body">
            ${bodyHtml}
          </div>

          <div style="padding: 16px 20px; border-top: 1px solid var(--c-border); background: var(--c-surface);">
            <button type="button" class="c-btn-primary" onclick="window.CompanionOmr.saveKeyEditor()">
              <i data-lucide="check" style="width: 18px; height: 18px;"></i>
              <span>Cevap Anahtarını Kaydet</span>
            </button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      if (window.Companion) window.Companion.renderIcons();
    },

    toggleKeyOption(q, opt) {
      if (!this.activeExam) return;
      if (!this.activeExam.answerKey) this.activeExam.answerKey = {};

      let current = this.activeExam.answerKey[q];
      if (this.activeExam.isMultiSubject && Array.isArray(this.activeExam.subjects)) {
        let cumulative = 0;
        for (const s of this.activeExam.subjects) {
          const count = s.questionCount || 0;
          if (q > cumulative && q <= cumulative + count) {
            const subjQ = q - cumulative;
            current = this.activeExam.answerKey[`${s.id}_${subjQ}`] || this.activeExam.answerKey[`${s.name}_${subjQ}`] || (s.answerKey && s.answerKey[subjQ]) || current;
            break;
          }
          cumulative += count;
        }
      }

      const isSetting = (current !== opt);
      if (isSetting) {
        this.activeExam.answerKey[q] = opt;
      } else {
        delete this.activeExam.answerKey[q];
      }

      // Çoklu dersli ise ilgili branşın s.answerKey ve id_q / name_q anahtarlarını da güncelle
      if (this.activeExam.isMultiSubject && Array.isArray(this.activeExam.subjects)) {
        let cumulative = 0;
        for (const s of this.activeExam.subjects) {
          const count = s.questionCount || 0;
          if (q > cumulative && q <= cumulative + count) {
            const subjQ = q - cumulative;
            if (!s.answerKey) s.answerKey = {};
            if (isSetting) {
              s.answerKey[subjQ] = opt;
              this.activeExam.answerKey[`${s.id}_${subjQ}`] = opt;
              this.activeExam.answerKey[`${s.name}_${subjQ}`] = opt;
            } else {
              delete s.answerKey[subjQ];
              delete this.activeExam.answerKey[`${s.id}_${subjQ}`];
              delete this.activeExam.answerKey[`${s.name}_${subjQ}`];
            }
            break;
          }
          cumulative += count;
        }
      }

      const row = document.querySelector(`.c-key-opt-btn[data-q="${q}"][data-opt="${opt}"]`);
      if (row && row.parentElement) {
        row.parentElement.querySelectorAll('.c-key-opt-btn').forEach(btn => {
          btn.classList.toggle('active', isSetting && btn.getAttribute('data-opt') === opt);
        });
      }

      if (window.Companion) window.Companion.vibrate(10);
    },

    saveKeyEditor() {
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(this.activeExam.id));
      let rescoredCount = 0;
      if (exam) {
        exam.answerKey = { ...(this.activeExam.answerKey || {}) };
        if (this.activeExam.isMultiSubject && Array.isArray(this.activeExam.subjects)) {
          exam.subjects = this.activeExam.subjects;
        }
        exam.hasOpticalForm = true;
        exam.updatedAt = new Date().toISOString();
        rescoredCount = this.recalculateExamResults(exam);
        this.saveData(data);
        this.activeExam = exam;
        if (window.CloudSync) {
          window.CloudSync.pushExam(exam).catch(() => {});
          if (typeof window.CloudSync.pushLiveExamResults === 'function') {
            window.CloudSync.pushLiveExamResults(exam, 'terminal').catch(() => {});
          }
        }
      }

      const modal = document.getElementById('companion-key-modal');
      if (modal) modal.style.display = 'none';

      this.renderHub();
      if (window.Companion) {
        const msg = rescoredCount > 0
          ? `✅ Cevap anahtarı kaydedildi ve masaüstüne gönderildi! (${rescoredCount} öğrenci yeniden puanlandı)`
          : '✅ Cevap anahtarı kaydedildi ve masaüstüne gönderildi!';
        window.Companion.showToast(msg, 'success');
      }
    },

    // ==========================================================================
    // OPTİK FORM VE CEVAP ANAHTARI MÜDAHALE (KAYITLI / MASAÜSTÜ SINAVLAR)
    // ==========================================================================

    openExamSettingsModal(examId) {
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(examId)) || this.activeExam;
      if (!exam) return;

      const modal = document.getElementById('companion-exam-settings-modal');
      if (!modal) return;

      const isMulti = !!((exam.isMultiSubject && Array.isArray(exam.subjects) && exam.subjects.length > 0) || (Array.isArray(exam.subjects) && exam.subjects.length > 1));
      const clonedSubjects = isMulti ? JSON.parse(JSON.stringify(exam.subjects)).map((s, idx) => ({
        ...s,
        id: s.id || `sub_${idx}`,
        name: s.name || `Ders ${idx + 1}`,
        questionCount: parseInt(s.questionCount, 10) || 10
      })) : [];

      const initialKey = { ...(exam.answerKey || {}) };
      if (isMulti) {
        let cum = 0;
        clonedSubjects.forEach(s => {
          const count = parseInt(s.questionCount, 10) || 10;
          for (let qi = 1; qi <= count; qi++) {
            const globalQ = cum + qi;
            const val = initialKey[`${s.id}_${qi}`] || initialKey[`${s.name}_${qi}`] || (s.answerKey && s.answerKey[qi]) || initialKey[globalQ] || '';
            if (val) {
              initialKey[`${s.id}_${qi}`] = val;
              initialKey[`${s.name}_${qi}`] = val;
              initialKey[globalQ] = val;
            }
          }
          cum += count;
        });
      }

      this.settingsState = {
        examId: exam.id,
        examName: exam.examName || '',
        branch: exam.branch || '',
        weekId: exam.weekId || 'W4',
        duration: exam.duration || 40,
        wrongAffects: !!exam.wrongAffects,
        penaltyRate: exam.penaltyRate || 4,
        choicesCount: exam.choicesCount || 4,
        isMultiSubject: isMulti,
        subjects: clonedSubjects,
        activeSubjId: isMulti ? (clonedSubjects[0]?.id || 'ALL') : null,
        totalQuestions: exam.totalQuestions || 20,
        answerKey: initialKey
      };

      const idInput = document.getElementById('settings-exam-id');
      if (idInput) idInput.value = exam.id;

      const nameInput = document.getElementById('settings-exam-name');
      if (nameInput) nameInput.value = this.settingsState.examName;

      const durInput = document.getElementById('settings-exam-duration');
      if (durInput) durInput.value = this.settingsState.duration;

      // Şube ve Hafta
      const isClassTeacher = (window.Companion && typeof window.Companion.isClassTeacher === 'function' && window.Companion.isClassTeacher()) ||
                             (window.Companion && window.Companion.profile && (window.Companion.profile.isClassTeacher || (window.Companion.profile.branch && window.Companion.profile.branch.includes('Sınıf Öğretmeni')))) ||
                             (this.getData().educationLevel === 'primary');

      const branchGroup = document.getElementById('settings-branch-group');
      const branchWeekRow = document.getElementById('settings-branch-week-row');

      if (isClassTeacher) {
        if (branchGroup) branchGroup.style.display = 'none';
        if (branchWeekRow) branchWeekRow.style.gridTemplateColumns = '1fr';
      } else {
        if (branchGroup) branchGroup.style.display = 'block';
        if (branchWeekRow) branchWeekRow.style.gridTemplateColumns = '1fr 1.5fr';

        const sectionSelect = document.getElementById('settings-exam-section');
        if (sectionSelect) {
          const sections = (window.Companion && window.Companion.profile && window.Companion.profile.sections) || ['5-A', '6-A', '7-A', '8-A'];
          sectionSelect.innerHTML = sections.map(s => `
            <option value="${s}" ${s === this.settingsState.branch ? 'selected' : ''}>${s} Şubesi</option>
          `).join('');
        }
      }

      const weekSelect = document.getElementById('settings-exam-week');
      if (weekSelect) {
        weekSelect.innerHTML = '';
        for (let w = 1; w <= 36; w++) {
          const opt = document.createElement('option');
          opt.value = `W${w}`;
          opt.textContent = `${w}. Hafta`;
          if (`W${w}` === this.settingsState.weekId || w === parseInt(String(this.settingsState.weekId).replace('W', ''), 10)) {
            opt.selected = true;
          }
          weekSelect.appendChild(opt);
        }
      }

      // Soru Sayısı ve Branşlar
      const singleGroup = document.getElementById('settings-single-q-group');
      const multiContainer = document.getElementById('settings-multi-container');
      const qInput = document.getElementById('settings-exam-questions');

      if (isMulti) {
        if (singleGroup) singleGroup.style.display = 'none';
        if (multiContainer) multiContainer.style.display = 'block';
        this.settingsRenderSubjectsUI();
      } else {
        if (singleGroup) singleGroup.style.display = 'block';
        if (multiContainer) multiContainer.style.display = 'none';
        if (qInput) qInput.value = this.settingsState.totalQuestions;
      }

      // Net Hesabı
      const wrongAffCheck = document.getElementById('settings-wrong-affects');
      if (wrongAffCheck) wrongAffCheck.checked = this.settingsState.wrongAffects;
      const penaltyRow = document.getElementById('settings-penalty-row');
      if (penaltyRow) penaltyRow.style.display = this.settingsState.wrongAffects ? 'block' : 'none';
      const penaltySelect = document.getElementById('settings-penalty-rate');
      if (penaltySelect) penaltySelect.value = String(this.settingsState.penaltyRate || 4);

      // Şık Sayısı
      this.settingsSelectChoicesCount(this.settingsState.choicesCount);

      // Taranan öğrenci varsa uyarı göster
      const scannedNotice = document.getElementById('settings-recalculate-notice');
      const scannedCount = Object.keys(exam.studentResults || {}).length;
      if (scannedNotice) scannedNotice.style.display = scannedCount > 0 ? 'block' : 'none';

      // Alt Başlık
      const subTitle = document.getElementById('settings-modal-subtitle');
      if (subTitle) subTitle.textContent = `${exam.examName} (${isMulti ? 'Çok Branşlı' : `${this.settingsState.totalQuestions} Soru`})`;

      modal.style.display = 'flex';
      if (window.Companion) window.Companion.renderIcons();
    },

    closeExamSettingsModal() {
      const modal = document.getElementById('companion-exam-settings-modal');
      if (modal) modal.style.display = 'none';
    },

    settingsSelectChoicesCount(count) {
      if (!this.settingsState) return;
      this.settingsState.choicesCount = count;
      [3, 4, 5].forEach(c => {
        const pill = document.getElementById(`settings-pill-opt-${c}`);
        if (pill) pill.classList.toggle('active', c === count);
      });
      this.settingsRenderAnswerKeyGrid();
    },

    settingsOnSingleQChange(val) {
      if (!this.settingsState) return;
      this.settingsState.totalQuestions = Math.max(1, parseInt(val, 10) || 1);
      this.settingsRenderAnswerKeyGrid();
    },

    settingsAddSubject() {
      if (!this.settingsState) return;
      const newId = 'sub_' + Date.now();
      if (!Array.isArray(this.settingsState.subjects)) this.settingsState.subjects = [];
      this.settingsState.subjects.push({ id: newId, name: 'Yeni Ders', questionCount: 10 });
      this.settingsState.activeSubjId = newId;
      this.settingsRenderSubjectsUI();
      this.settingsRenderAnswerKeyGrid();
    },

    settingsRemoveSubject(subjId) {
      if (!this.settingsState || !Array.isArray(this.settingsState.subjects)) return;
      if (this.settingsState.subjects.length <= 1) {
        if (window.Companion) window.Companion.showToast('En az 1 ders bulunmalıdır.');
        return;
      }
      this.settingsState.subjects = this.settingsState.subjects.filter(s => s.id !== subjId);
      this.settingsState.activeSubjId = this.settingsState.subjects[0].id;
      this.settingsRenderSubjectsUI();
      this.settingsRenderAnswerKeyGrid();
    },

    settingsUpdateSubject(subjId, field, val) {
      if (!this.settingsState || !Array.isArray(this.settingsState.subjects)) return;
      const s = this.settingsState.subjects.find(x => x.id === subjId);
      if (s) {
        if (field === 'questionCount') s.questionCount = Math.max(1, parseInt(val, 10) || 1);
        else s.name = String(val).trim() || 'Ders';
      }
      this.settingsRenderSubjectsUI(false);
      this.settingsRenderAnswerKeyGrid();
    },

    settingsRenderSubjectsUI(rebuild = true) {
      if (!this.settingsState) return;
      const container = document.getElementById('settings-subjects-list');
      const badge = document.getElementById('settings-multi-total-badge');
      const total = (this.settingsState.subjects || []).reduce((sum, s) => sum + (parseInt(s.questionCount, 10) || 0), 0);

      if (badge) badge.textContent = `Toplam: ${total} Soru`;
      if (!container || !rebuild) return;

      container.innerHTML = (this.settingsState.subjects || []).map((subj, idx) => `
        <div style="display: flex; align-items: center; gap: 6px; background: #ffffff; padding: 6px 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <span style="font-size: 11px; font-weight: 800; color: #94a3b8; min-width: 16px;">${idx + 1}.</span>
          <input type="text" class="c-input" value="${subj.name}" placeholder="Ders Adı" style="flex: 1; height: 30px; font-size: 12px; padding: 4px 8px;" onchange="window.CompanionOmr.settingsUpdateSubject('${subj.id}', 'name', this.value)" />
          <input type="number" class="c-input" min="1" max="50" value="${subj.questionCount}" style="width: 60px; height: 30px; font-size: 12px; padding: 4px 6px; text-align: center;" onchange="window.CompanionOmr.settingsUpdateSubject('${subj.id}', 'questionCount', this.value)" />
          <button type="button" class="c-icon-btn" style="width: 28px; height: 28px; padding: 0; color: #ef4444;" onclick="window.CompanionOmr.settingsRemoveSubject('${subj.id}')">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `).join('');

      if (window.Companion) window.Companion.renderIcons();
    },

    settingsRenderAnswerKeyGrid() {
      if (!this.settingsState) return;
      const grid = document.getElementById('settings-answer-key-grid');
      const tabs = document.getElementById('settings-key-subj-tabs');
      if (!grid) return;

      const choicesCount = this.settingsState.choicesCount || 4;
      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);

      if (this.settingsState.isMultiSubject) {
        const subjects = this.settingsState.subjects || [];
        if (!this.settingsState.activeSubjId) {
          this.settingsState.activeSubjId = subjects[0] ? subjects[0].id : 'ALL';
        }

        if (tabs) {
          tabs.style.display = 'flex';
          const allPill = `
            <button type="button" class="c-subject-pill ${this.settingsState.activeSubjId === 'ALL' ? 'active' : ''}" style="cursor: pointer;" onclick="window.CompanionOmr.settingsSelectSubjTab('ALL')">
              📋 Tüm Dersler
            </button>
          `;
          tabs.innerHTML = allPill + subjects.map(s => `
            <button type="button" class="c-subject-pill ${s.id === this.settingsState.activeSubjId ? 'active' : ''}" style="cursor: pointer;" onclick="window.CompanionOmr.settingsSelectSubjTab('${s.id}')">
              📚 ${s.name} (${s.questionCount}S)
            </button>
          `).join('');
        }

        const targetSubjects = this.settingsState.activeSubjId === 'ALL'
          ? subjects
          : [subjects.find(s => s.id === this.settingsState.activeSubjId) || subjects[0]].filter(Boolean);

        if (targetSubjects.length === 0) return;

        let html = '';
        targetSubjects.forEach(subj => {
          let cumulativeOffset = 0;
          for (const s of subjects) {
            if (s.id === subj.id) break;
            cumulativeOffset += (parseInt(s.questionCount, 10) || 0);
          }

          const count = parseInt(subj.questionCount, 10) || 10;
          html += `
            <div style="grid-column: 1 / -1; background: #eef2ff; border: 1px solid #c7d2fe; padding: 6px 10px; border-radius: 8px; margin: 6px 0 4px; font-weight: 800; font-size: 12px; color: #4338ca; display: flex; justify-content: space-between; align-items: center;">
              <span>📚 ${subj.name}</span>
              <span style="font-size: 11px; color: #4f46e5;">1 - ${count}. Sorular</span>
            </div>
          `;
          for (let q = 1; q <= count; q++) {
            const globalQ = cumulativeOffset + q;
            const key = `${subj.id}_${q}`;
            const sel = this.settingsState.answerKey[key] || this.settingsState.answerKey[`${subj.name}_${q}`] || (subj.answerKey && subj.answerKey[q]) || this.settingsState.answerKey[globalQ] || '';
            html += `
              <div class="c-ak-row">
                <span class="c-ak-q-num">S.${q}</span>
                <div class="c-ak-bubbles">
                  ${letters.map(letter => `
                    <button type="button" class="c-ak-bubble-btn ${sel === letter ? 'active' : ''}" onclick="window.CompanionOmr.settingsSetAnswer('${key}', '${letter}')">
                      ${letter}
                    </button>
                  `).join('')}
                </div>
              </div>
            `;
          }
        });
        grid.innerHTML = html;
      } else {
        if (tabs) tabs.style.display = 'none';
        const count = this.settingsState.totalQuestions || 20;

        grid.innerHTML = Array.from({ length: count }, (_, i) => i + 1).map(q => {
          const sel = this.settingsState.answerKey[q] || '';
          return `
            <div class="c-ak-row">
              <span class="c-ak-q-num">S.${q}</span>
              <div class="c-ak-bubbles">
                ${letters.map(letter => `
                  <button type="button" class="c-ak-bubble-btn ${sel === letter ? 'active' : ''}" onclick="window.CompanionOmr.settingsSetAnswer(${q}, '${letter}')">
                    ${letter}
                  </button>
                `).join('')}
              </div>
            </div>
          `;
        }).join('');
      }
    },

    settingsSelectSubjTab(subjId) {
      if (!this.settingsState) return;
      this.settingsState.activeSubjId = subjId;
      this.settingsRenderAnswerKeyGrid();
    },

    settingsSetAnswer(qKey, letter) {
      if (!this.settingsState) return;

      if (this.settingsState.isMultiSubject) {
        const subjects = this.settingsState.subjects || [];
        const currentSubj = subjects.find(s => String(qKey).startsWith(s.id + '_')) || subjects.find(s => s.id === this.settingsState.activeSubjId);
        if (currentSubj) {
          let cumulativeOffset = 0;
          for (const s of subjects) {
            if (s.id === currentSubj.id) break;
            cumulativeOffset += (parseInt(s.questionCount, 10) || 0);
          }
          const m = String(qKey).match(/_(\d+)$/);
          const qNum = m ? parseInt(m[1], 10) : parseInt(qKey, 10);
          if (qNum) {
            const globalQ = cumulativeOffset + qNum;
            const idKey = `${currentSubj.id}_${qNum}`;
            const nameKey = `${currentSubj.name}_${qNum}`;
            const existing = this.settingsState.answerKey[idKey] || this.settingsState.answerKey[nameKey] || (currentSubj.answerKey && currentSubj.answerKey[qNum]) || this.settingsState.answerKey[globalQ] || '';
            if (existing === letter) {
              delete this.settingsState.answerKey[idKey];
              delete this.settingsState.answerKey[nameKey];
              delete this.settingsState.answerKey[globalQ];
              if (currentSubj.answerKey) delete currentSubj.answerKey[qNum];
            } else {
              this.settingsState.answerKey[idKey] = letter;
              this.settingsState.answerKey[nameKey] = letter;
              this.settingsState.answerKey[globalQ] = letter;
              if (!currentSubj.answerKey) currentSubj.answerKey = {};
              currentSubj.answerKey[qNum] = letter;
            }
          }
        }
      } else {
        if (this.settingsState.answerKey[qKey] === letter) {
          delete this.settingsState.answerKey[qKey];
        } else {
          this.settingsState.answerKey[qKey] = letter;
        }
      }

      this.settingsRenderAnswerKeyGrid();
      if (window.Companion) window.Companion.vibrate(10);
    },

    settingsFillSampleKey() {
      if (!this.settingsState) return;
      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, this.settingsState.choicesCount || 4);
      if (this.settingsState.isMultiSubject) {
        let globalCursor = 1;
        (this.settingsState.subjects || []).forEach(s => {
          for (let q = 1; q <= s.questionCount; q++) {
            const ans = letters[(globalCursor * 3) % letters.length];
            this.settingsState.answerKey[`${s.id}_${q}`] = ans;
            this.settingsState.answerKey[`${s.name}_${q}`] = ans;
            this.settingsState.answerKey[globalCursor] = ans;
            globalCursor++;
          }
        });
      } else {
        const count = this.settingsState.totalQuestions || 20;
        for (let q = 1; q <= count; q++) {
          this.settingsState.answerKey[q] = letters[(q * 3) % letters.length];
        }
      }
      this.settingsRenderAnswerKeyGrid();
      if (window.Companion) window.Companion.showToast('Örnek cevap anahtarı dolduruldu.');
    },

    settingsClearKey() {
      if (!this.settingsState) return;
      this.settingsState.answerKey = {};
      this.settingsRenderAnswerKeyGrid();
      if (window.Companion) window.Companion.showToast('Cevap anahtarı temizlendi.');
    },

    settingsToggleTextBox() {
      const box = document.getElementById('settings-key-text-box');
      if (box) box.style.display = (box.style.display === 'none') ? 'block' : 'none';
    },

    settingsApplyTextKey() {
      if (!this.settingsState) return;
      const txtInput = document.getElementById('settings-key-text-input');
      const text = txtInput ? txtInput.value.trim().toUpperCase() : '';
      if (!text) return;

      const pairs = text.match(/(\d+)\s*[:.\-\s]\s*([A-E])/gi) || text.match(/(\d+)([A-E])/gi);
      if (pairs) {
        let currentSubjIdx = 0;
        let prevQ = 0;
        const subjects = this.settingsState.subjects || [];

        pairs.forEach(p => {
          const m = p.match(/(\d+)[^A-E]*([A-E])/i);
          if (m) {
            const q = parseInt(m[1], 10);
            const ans = m[2].toUpperCase();
            if (this.settingsState.isMultiSubject && subjects.length > 0) {
              if (this.settingsState.activeSubjId && this.settingsState.activeSubjId !== 'ALL') {
                const activeSubj = subjects.find(s => s.id === this.settingsState.activeSubjId) || subjects[0];
                let cumulativeOffset = 0;
                for (const s of subjects) {
                  if (s.id === activeSubj.id) break;
                  cumulativeOffset += (parseInt(s.questionCount, 10) || 0);
                }
                if (q >= 1 && q <= (parseInt(activeSubj.questionCount, 10) || 20)) {
                  const globalQ = cumulativeOffset + q;
                  this.settingsState.answerKey[`${activeSubj.id}_${q}`] = ans;
                  if (activeSubj.name) this.settingsState.answerKey[`${activeSubj.name}_${q}`] = ans;
                  this.settingsState.answerKey[globalQ] = ans;
                  if (!activeSubj.answerKey) activeSubj.answerKey = {};
                  activeSubj.answerKey[q] = ans;
                }
              } else {
                if (q === 1 && prevQ > 1 && currentSubjIdx < subjects.length - 1) {
                  currentSubjIdx++;
                }
                const curSubj = subjects[currentSubjIdx];
                if (curSubj && q <= (parseInt(curSubj.questionCount, 10) || 10)) {
                  let cumulativeOffset = 0;
                  for (let i = 0; i < currentSubjIdx; i++) {
                    cumulativeOffset += (parseInt(subjects[i].questionCount, 10) || 0);
                  }
                  const globalQ = cumulativeOffset + q;
                  this.settingsState.answerKey[`${curSubj.id}_${q}`] = ans;
                  if (curSubj.name) this.settingsState.answerKey[`${curSubj.name}_${q}`] = ans;
                  this.settingsState.answerKey[globalQ] = ans;
                  if (!curSubj.answerKey) curSubj.answerKey = {};
                  curSubj.answerKey[q] = ans;
                  prevQ = q;
                } else {
                  let cum = 0;
                  for (const s of subjects) {
                    const cnt = parseInt(s.questionCount, 10) || 0;
                    if (q > cum && q <= cum + cnt) {
                      const subjQ = q - cum;
                      this.settingsState.answerKey[`${s.id}_${subjQ}`] = ans;
                      if (s.name) this.settingsState.answerKey[`${s.name}_${subjQ}`] = ans;
                      this.settingsState.answerKey[q] = ans;
                      if (!s.answerKey) s.answerKey = {};
                      s.answerKey[subjQ] = ans;
                      break;
                    }
                    cum += cnt;
                  }
                }
              }
            } else {
              this.settingsState.answerKey[q] = ans;
            }
          }
        });
      }
      this.settingsRenderAnswerKeyGrid();
      const box = document.getElementById('settings-key-text-box');
      if (box) box.style.display = 'none';
      if (window.Companion) window.Companion.showToast('Cevap anahtarı uygulandı.');
    },

    async submitExamSettingsForm() {
      if (!this.settingsState) return;
      const nameInput = document.getElementById('settings-exam-name');
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        if (window.Companion) window.Companion.showToast('Lütfen sınav adını girin.');
        return;
      }

      const durInput = document.getElementById('settings-exam-duration');
      const duration = parseInt(durInput ? durInput.value : 40, 10) || 40;

      const sectionSelect = document.getElementById('settings-exam-section');
      const branch = sectionSelect && sectionSelect.value ? sectionSelect.value : this.settingsState.branch;

      const weekSelect = document.getElementById('settings-exam-week');
      const week = weekSelect && weekSelect.value ? weekSelect.value : this.settingsState.weekId;

      const wrongAffCheck = document.getElementById('settings-wrong-affects');
      const wrongAffects = wrongAffCheck ? wrongAffCheck.checked : false;

      const penaltySelect = document.getElementById('settings-penalty-rate');
      const penaltyRate = wrongAffects ? (parseInt(penaltySelect ? penaltySelect.value : 4, 10) || 4) : 0;

      const isMulti = this.settingsState.isMultiSubject;
      let totalQ = 20;
      let subjects = [];
      const cleanAnswerKey = {};

      if (isMulti) {
        subjects = (this.settingsState.subjects || []).map(s => ({
          id: s.id,
          name: s.name,
          questionCount: parseInt(s.questionCount, 10) || 10,
          answerKey: {}
        }));
        totalQ = subjects.reduce((sum, s) => sum + s.questionCount, 0);

        let cumulative = 0;
        subjects.forEach(s => {
          s.answerKey = {};
          for (let qi = 1; qi <= s.questionCount; qi++) {
            const globalQ = cumulative + qi;
            const val = this.settingsState.answerKey[`${s.id}_${qi}`] || this.settingsState.answerKey[`${s.name}_${qi}`] || this.settingsState.answerKey[globalQ];
            if (val) {
              s.answerKey[qi] = val;
              cleanAnswerKey[`${s.id}_${qi}`] = val;
              cleanAnswerKey[`${s.name}_${qi}`] = val;
              cleanAnswerKey[globalQ] = val;
            }
          }
          cumulative += s.questionCount;
        });
      } else {
        const qInput = document.getElementById('settings-exam-questions');
        totalQ = parseInt(qInput ? qInput.value : (this.settingsState.totalQuestions || 20), 10) || 20;
        for (let q = 1; q <= totalQ; q++) {
          const val = this.settingsState.answerKey[q] || this.settingsState.answerKey[String(q)];
          if (val) cleanAnswerKey[q] = val;
        }
      }

      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(this.settingsState.examId));
      if (!exam) {
        if (window.Companion) window.Companion.showToast('Sınav bulunamadı.');
        return;
      }

      // Bilgileri güncelle
      exam.examName = name;
      exam.duration = duration;
      if (branch) exam.branch = branch;
      if (week) exam.weekId = week;
      exam.wrongAffects = wrongAffects;
      exam.penaltyRate = penaltyRate;
      exam.choicesCount = this.settingsState.choicesCount || 4;
      exam.totalQuestions = totalQ;
      exam.isMultiSubject = isMulti;
      if (isMulti) exam.subjects = subjects;
      exam.hasOpticalForm = true;
      exam.answerKey = cleanAnswerKey;
      exam.updatedAt = new Date().toISOString();

      // Önceden taranmış öğrenci sonuçlarını otomatik yeniden puanla!
      const rescoredCount = this.recalculateExamResults(exam);

      // Veritabanına kaydet
      this.saveData(data);
      this.activeExam = exam;

      // Buluta fırlat
      if (window.CloudSync) {
        window.CloudSync.pushExam(exam).catch(() => {});
        window.CloudSync.pushLiveExamResults(exam, 'terminal').catch(() => {});
      }

      this.closeExamSettingsModal();
      this.renderHub();

      const toastMsg = rescoredCount > 0 
        ? `✅ Optik form ve cevap anahtarı güncellendi! (${rescoredCount} öğrenci yeniden puanlandı)`
        : `✅ Sınav ve cevap anahtarı başarıyla güncellendi!`;
      if (window.Companion) window.Companion.showToast(toastMsg, 'success');
    },

    recalculateExamResults(exam) {
      if (!exam || !exam.studentResults) return 0;
      const studentIds = Object.keys(exam.studentResults);
      if (studentIds.length === 0) return 0;

      const totalQ = exam.totalQuestions || 20;
      const penaltyRate = exam.wrongAffects ? (exam.penaltyRate || 4) : 0;
      const answerKey = exam.answerKey || {};
      const isMulti = !!(exam.isMultiSubject && Array.isArray(exam.subjects) && exam.subjects.length > 0);

      if (!exam.examScores) exam.examScores = {};

      studentIds.forEach(stuId => {
        const res = exam.studentResults[stuId];
        if (!res) return;
        const answers = res.answers || {};

        let correctCount = 0;
        let wrongCount = 0;
        let blankCount = 0;
        const questionDetails = [];
        const subjectBreakdown = {};

        if (isMulti) {
          let cumulativeOffset = 0;
          exam.subjects.forEach(subj => {
            let sCorrect = 0;
            let sWrong = 0;
            let sBlank = 0;
            const count = subj.questionCount || 10;

            for (let qi = 1; qi <= count; qi++) {
              const globalQ = cumulativeOffset + qi;
              const marked = answers[globalQ] || answers[`${subj.id}_${qi}`] || answers[`${subj.name}_${qi}`] || '';
              const correctAns = answerKey[globalQ] || answerKey[`${subj.id}_${qi}`] || answerKey[`${subj.name}_${qi}`] || (subj.answerKey && subj.answerKey[qi]) || '';

              const qd = {
                q: globalQ,
                subjId: subj.id,
                subjName: subj.name,
                subjQ: qi,
                marked: marked,
                keyAnswer: correctAns
              };

              if (!marked) {
                blankCount++;
                sBlank++;
                qd.isBlank = true;
                qd.isCorrect = false;
              } else if (correctAns && marked === correctAns) {
                correctCount++;
                sCorrect++;
                qd.isBlank = false;
                qd.isCorrect = true;
              } else {
                wrongCount++;
                sWrong++;
                qd.isBlank = false;
                qd.isCorrect = false;
              }
              questionDetails.push(qd);
            }

            const sNet = penaltyRate > 0 ? (sCorrect - (sWrong / penaltyRate)) : sCorrect;
            const sScore = count > 0 ? parseFloat(((Math.max(0, sNet) / count) * 100).toFixed(1)) : 0;

            subjectBreakdown[subj.id] = {
              subjectId: subj.id,
              subjectName: subj.name,
              totalQuestions: count,
              correct: sCorrect,
              wrong: sWrong,
              blank: sBlank,
              net: Math.max(0, parseFloat(sNet.toFixed(2))),
              score: sScore
            };

            cumulativeOffset += count;
          });
        } else {
          for (let q = 1; q <= totalQ; q++) {
            const marked = answers[q] || '';
            const correctAns = answerKey[q] || '';
            const qd = {
              q: q,
              marked: marked,
              keyAnswer: correctAns
            };

            if (!marked) {
              blankCount++;
              qd.isBlank = true;
              qd.isCorrect = false;
            } else if (correctAns && marked === correctAns) {
              correctCount++;
              qd.isBlank = false;
              qd.isCorrect = true;
            } else {
              wrongCount++;
              qd.isBlank = false;
              qd.isCorrect = false;
            }
            questionDetails.push(qd);
          }
        }

        let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
        net = Math.max(0, parseFloat(net.toFixed(2)));
        const score = totalQ > 0 ? parseFloat(((net / totalQ) * 100).toFixed(1)) : 0;

        res.correct = correctCount;
        res.wrong = wrongCount;
        res.blank = blankCount;
        res.net = net;
        res.score = score;
        res.questionDetails = questionDetails;
        if (isMulti) res.subjectBreakdown = subjectBreakdown;
        res.updatedAt = new Date().toISOString();

        exam.examScores[stuId] = score;
      });

      return studentIds.length;
    },

    // ==========================================================================
    // MOBİL OPTİK FORM YAZDIRMA (TELEFONDAN YAZICIYA GÖNDERME)
    // ==========================================================================

    openMobileOpticalPrintModal(examId) {
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(examId)) || this.activeExam;
      if (!exam) return;

      const isMulti = exam && !!exam.isMultiSubject && Array.isArray(exam.subjects) && exam.subjects.length > 0;
      const maxSubjQ = isMulti ? Math.max(...exam.subjects.map(s => parseInt(s.questionCount, 10) || 0)) : (parseInt(exam.totalQuestions, 10) || 20);
      const totalQ = parseInt(exam.totalQuestions, 10) || 20;
      const requiresSinglePage = maxSubjQ > 20 || (!isMulti && totalQ > 40);

      this.mprintRequiresSinglePage = requiresSinglePage;
      this.mprintExam = exam;
      this.mprintType = 'named';

      const modal = document.getElementById('companion-optical-print-modal');
      if (!modal) return;

      const badge = document.getElementById('mprint-exam-title-badge');
      if (badge) {
        badge.textContent = `${exam.examName} (${totalQ} Soru${requiresSinglePage ? ' • A4 Tam Sayfa Zorunlu' : ''})`;
      }

      const pill1 = document.getElementById('mprint-perpage-1');
      const pill2 = document.getElementById('mprint-perpage-2');
      const pill4 = document.getElementById('mprint-perpage-4');

      if (requiresSinglePage) {
        if (pill2) { pill2.classList.add('disabled'); pill2.style.opacity = '0.35'; pill2.style.pointerEvents = 'none'; pill2.title = 'Soru sayısı > 20 olduğu için A4 Tam Sayfa gereklidir'; }
        if (pill4) { pill4.classList.add('disabled'); pill4.style.opacity = '0.35'; pill4.style.pointerEvents = 'none'; pill4.title = 'Soru sayısı > 20 olduğu için A4 Tam Sayfa gereklidir'; }
        this.mprintSetPerPage(1);
      } else {
        if (pill2) { pill2.classList.remove('disabled'); pill2.style.opacity = '1'; pill2.style.pointerEvents = 'auto'; pill2.title = ''; }
        if (pill4) { pill4.classList.remove('disabled'); pill4.style.opacity = '1'; pill4.style.pointerEvents = 'auto'; pill4.title = ''; }
        this.mprintSetPerPage(2);
      }

      this.mprintSetType('named');

      const studentsListEl = document.getElementById('mprint-students-list');
      const students = this.getActiveStudents();

      if (studentsListEl) {
        if (students.length === 0) {
          studentsListEl.innerHTML = `<div style="font-size: 11.5px; color: #64748b; padding: 8px; text-align: center;">Bu şubede kayıtlı öğrenci bulunmuyor.</div>`;
        } else {
          studentsListEl.innerHTML = students.map((s, idx) => `
            <label style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" class="mprint-stu-cb" value="${s.id}" data-index="${idx + 1}" checked onchange="window.CompanionOmr.mprintUpdateSummary()" style="width: 16px; height: 16px; cursor: pointer;" />
                <span style="font-size: 12px; font-weight: 700; color: #1e293b;">${s.number ? s.number + ' - ' : ''}${s.name} ${s.surname || ''}</span>
              </div>
              <span style="font-size: 10.5px; color: #64748b; font-family: monospace;">ID:#${idx + 1}</span>
            </label>
          `).join('');
        }
      }

      this.mprintUpdateSummary();
      modal.style.display = 'flex';
      if (window.Companion) window.Companion.renderIcons();
    },

    closeMobileOpticalPrintModal() {
      const modal = document.getElementById('companion-optical-print-modal');
      if (modal) modal.style.display = 'none';
    },

    mprintSetType(type) {
      this.mprintType = type;
      const namedBtn = document.getElementById('mprint-type-named');
      const blankBtn = document.getElementById('mprint-type-blank');
      const stuGroup = document.getElementById('mprint-students-group');
      const blankGroup = document.getElementById('mprint-blank-count-group');

      if (type === 'blank') {
        namedBtn && namedBtn.classList.remove('active');
        blankBtn && blankBtn.classList.add('active');
        if (stuGroup) stuGroup.style.display = 'none';
        if (blankGroup) blankGroup.style.display = 'block';
      } else {
        namedBtn && namedBtn.classList.add('active');
        blankBtn && blankBtn.classList.remove('active');
        if (stuGroup) stuGroup.style.display = 'block';
        if (blankGroup) blankGroup.style.display = 'none';
      }

      this.mprintUpdateSummary();
    },

    mprintSetPerPage(perPage) {
      if (this.mprintRequiresSinglePage && perPage !== 1) {
        if (window.Companion && window.Companion.showToast) {
          window.Companion.showToast('Bu sınavda soru sayısı (Ders başına > 20) fazla olduğu için yalnızca A4 Tam Sayfa kullanılabilir.', 'warning');
        }
        return;
      }
      this.mprintPerPage = perPage;
      [1, 2, 4].forEach(p => {
        const pill = document.getElementById(`mprint-perpage-${p}`);
        if (pill) pill.classList.toggle('active', p === perPage);
      });
      this.mprintUpdateSummary();
    },

    mprintToggleAllStudents(select) {
      const cbs = document.querySelectorAll('.mprint-stu-cb');
      cbs.forEach(cb => { cb.checked = select; });
      this.mprintUpdateSummary();
    },

    mprintUpdateSummary() {
      const summaryText = document.getElementById('mprint-summary-text');
      if (!summaryText) return;

      const perPage = this.mprintPerPage || 2;
      let formCount = 0;

      if (this.mprintType === 'blank') {
        const blankInput = document.getElementById('mprint-blank-count');
        formCount = parseInt(blankInput ? blankInput.value : 10, 10) || 10;
      } else {
        formCount = document.querySelectorAll('.mprint-stu-cb:checked').length;
      }

      const pageCount = Math.ceil(formCount / perPage);
      summaryText.textContent = `Toplam ${formCount} adet optik form (${pageCount} sayfa A4 kağıt) yazdırılacak.`;
    },

    generateOpticalBinaryIdSVG(options) {
      const { studentIndex = 0, studentId = '', studentNo = '' } = options || {};
      const effectiveNo = (studentNo && studentNo !== '......' && studentNo !== '-') ? studentNo : (studentIndex > 0 ? String(studentIndex) : '0');
      const num = parseInt(effectiveNo, 10) || 0;

      let arucoSvg = '';
      if (window.OmrEngine && typeof window.OmrEngine.generateArucoSVG === 'function') {
        arucoSvg = window.OmrEngine.generateArucoSVG(num, 46);
      } else {
        const totalSize = 56;
        let rects = `<rect x="0" y="0" width="${totalSize}" height="${totalSize}" fill="#000000" /><rect x="8" y="8" width="40" height="40" fill="#ffffff" />`;
        arucoSvg = `<svg viewBox="0 0 ${totalSize} ${totalSize}" width="46" height="46" shape-rendering="crispEdges" style="display: block;">${rects}</svg>`;
      }

      const isNamed = studentNo && studentNo !== '......' && studentNo !== '-';
      const caption = isNamed ? `NO:${studentNo}` : (studentIndex > 0 ? `ID:#${studentIndex}` : 'ID:---');

      return `
        <div class="omr-id-badge omr-aruco-badge" title="Öğrenci ArUco Kimlik Kodu: ${caption}">
          <div class="omr-binary-strip-wrap" style="background: #ffffff; padding: 2px 5px; display: flex; flex-direction: column; align-items: center; border: 2px solid #000000; border-radius: 6px; box-sizing: border-box;">
            <div style="font-size: 0.48rem; font-weight: 800; color: #000000; letter-spacing: 0.4px; margin-bottom: 1px; text-transform: uppercase;">KİMLİK KODU</div>
            <div style="width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              ${arucoSvg}
            </div>
            <div class="omr-id-caption" style="font-size: 0.60rem; font-weight: 800; font-family: monospace; color: #000000; margin-top: 1px; line-height: 1;">
              ${caption}
            </div>
          </div>
        </div>
      `;
    },

    renderCornerAnchorSVG(posClass) {
      return `<svg class="omr-anchor ${posClass}" viewBox="0 0 24 24" width="22" height="22" shape-rendering="crispEdges" style="position: absolute; z-index: 10; display: block;">
        <rect x="0" y="0" width="24" height="24" fill="#000000" rx="3" />
        <rect x="3.5" y="3.5" width="17" height="17" fill="#ffffff" rx="2" />
        <rect x="7" y="7" width="10" height="10" fill="#000000" rx="1" />
      </svg>`;
    },

    generateSingleOpticalCardHTML(options) {
      const {
        examName = 'Haftalık Değerlendirme',
        studentName = '................................',
        studentNo = '......',
        studentId = '',
        studentIndex = 0,
        examId = '',
        totalQuestions = 20,
        letters = ['A', 'B', 'C', 'D'],
        perPage = 2,
        isMultiSubject = false,
        subjects = []
      } = options;

      const qrBadgeHtml = this.generateOpticalBinaryIdSVG({
        studentIndex,
        studentId,
        studentNo,
        examId: examId || '',
        perPage: perPage || 2
      });

      // 5 SABİT DERS CEBİ MİMARİSİ:
      // 1 ders seçilirse belirlenen 1. ders cebine (Slot 0) eklenir ve diğer 4 ders cebi boş kalır.
      // Çoklu ders seçilirse her ders sırasıyla kendi sabit cebine (Slot 0..4) yerleşir.
      const effectiveSubjects = (isMultiSubject && Array.isArray(subjects) && subjects.length > 0)
        ? subjects
        : [{ id: 'sub_0', name: examName || 'Ders', questionCount: totalQuestions || 10 }];

      const maxSubjQ = Math.max(...effectiveSubjects.map(s => s.questionCount || 0));
      const isCompact = maxSubjQ > 20;

      const maxSlots = 5;
      let subjectsHtml = '';
      for (let sIdx = 0; sIdx < maxSlots; sIdx++) {
        const subj = effectiveSubjects[sIdx];
        if (subj) {
          let rowsHtml = '';
          const count = subj.questionCount || 10;
          for (let q = 1; q <= count; q++) {
            rowsHtml += `
              <div class="omr-q-row" data-subj="${subj.id}" data-q="${q}">
                <span class="omr-q-num">${q}</span>
                <div class="omr-q-bubbles">
                  ${letters.map(l => `<span class="omr-bubble" data-opt="${l}">${l}</span>`).join('')}
                </div>
              </div>
            `;
          }

          subjectsHtml += `
            <div class="omr-subject-block slot-${sIdx}">
              <div class="omr-subject-header">
                <span class="omr-subject-name" title="${subj.name}">${subj.name}</span>
                <span class="omr-subject-badge">${count} Soru</span>
              </div>
              <div class="omr-subject-rows">
                ${rowsHtml}
              </div>
            </div>
          `;
        } else {
          // Boş yuva: Tam aynı 18.8% genişlikte boş alan (sayfa dengesini ve koordinatları korur)
          subjectsHtml += `
            <div class="omr-subject-block omr-slot-empty" style="visibility: hidden; border: none; background: transparent;">
            </div>
          `;
        }
      }

      const subjSubtitle = (isMultiSubject && effectiveSubjects.length > 0)
        ? `<small style="font-size: 0.68rem; font-weight: 700; opacity: 0.85; margin-left: 6px;">(${effectiveSubjects.map(s => s.name).join(' • ')})</small>`
        : '';

      return `
        <div class="omr-card omr-multi ${isCompact ? 'compact-rows' : ''}">
          <!-- 4 Köşe Referans Çapası (CamScanner & Tarayıcı Uyumlu Vektör Çapa) -->
          ${this.renderCornerAnchorSVG('omr-anchor-tl')}
          ${this.renderCornerAnchorSVG('omr-anchor-tr')}
          ${this.renderCornerAnchorSVG('omr-anchor-bl')}
          ${this.renderCornerAnchorSVG('omr-anchor-br')}

          <div class="omr-card-header">
            <div class="omr-header-main">
              <div class="omr-header-title">
                ${examName}
                ${subjSubtitle}
              </div>
              <div class="omr-student-info">
                <div><strong>Öğrenci:</strong> ${studentName}</div>
                <div><strong>No:</strong> ${studentNo}</div>
              </div>
            </div>
            ${qrBadgeHtml}
          </div>

          <div class="omr-card-body" style="padding: 2px 0;">
            <div class="omr-multi-subjects-grid cols-5 fixed-5-slots">
              ${subjectsHtml}
            </div>
          </div>

          <div class="omr-card-footer">
            <span>* Her ders için 1'den başlayan soruları kurşun kalemle doldurunuz.</span>
            <span>SINIF ASİSTANI</span>
          </div>
        </div>
      `;
    },

    buildMobileOpticalPrintDocument(pagesHtml, examTitle = 'Optik_Form') {
      return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${examTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 4mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    .omr-print-page {
      display: block;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      width: 100%;
      box-sizing: border-box;
      padding: 1mm 2mm;
      margin: 0 auto;
      background: #ffffff;
      overflow: hidden;
    }
    .omr-print-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .omr-print-page.omr-per-page-1 {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 274mm;
      max-height: 276mm;
    }
    .omr-print-page.omr-per-page-1 .omr-card {
      height: 266mm;
      max-height: 268mm;
      max-width: 100%;
      margin: 0 auto;
      padding: 14px 18px;
    }
    .omr-print-page.omr-per-page-2 {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4mm;
      height: 260mm;
      max-height: 262mm;
      padding: 1mm 2mm;
    }
    .omr-print-page.omr-per-page-2 .omr-card {
      height: 128mm;
      max-height: 128mm;
      max-width: 100%;
      margin: 0;
      padding: 6px 10px;
    }
    .omr-print-page.omr-per-page-2 .omr-card.omr-multi {
      height: 128mm;
      max-height: 128mm;
      padding: 4px 8px;
    }
    .omr-print-page.omr-per-page-4 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 128mm 128mm;
      gap: 3mm;
      height: 262mm;
      max-height: 264mm;
    }
    .omr-print-page.omr-per-page-4 .omr-card {
      height: 128mm;
      max-height: 128mm;
      max-width: 100%;
      margin: 0;
      padding: 6px 8px;
    }
    .omr-card {
      position: relative;
      background: #ffffff;
      color: #000000;
      border: 1.5px solid #000000;
      border-radius: 6px;
      box-sizing: border-box;
      width: 100%;
      user-select: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
    }
    .omr-anchor {
      position: absolute;
      width: 22px;
      height: 22px;
      display: block;
      box-sizing: border-box;
      z-index: 10;
    }
    .omr-anchor-tl { top: 6px; left: 6px; }
    .omr-anchor-tr { top: 6px; right: 6px; }
    .omr-anchor-bl { bottom: 6px; left: 6px; }
    .omr-anchor-br { bottom: 6px; right: 6px; }
    .omr-card-header {
      margin: 2px 26px 4px 26px;
      border-bottom: 2px solid #000000;
      padding-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .omr-header-main {
      flex: 1;
      min-width: 0;
    }
    .omr-header-title {
      font-size: 0.88rem;
      font-weight: 900;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000000;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .omr-student-info {
      display: flex;
      gap: 16px;
      margin-top: 3px;
      font-size: 0.8rem;
      color: #000000;
      font-weight: 700;
    }
    .omr-id-badge {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1px;
    }
    .omr-aruco-badge svg {
      width: 46px !important;
      height: 46px !important;
      display: block;
    }
    .omr-per-page-2 .omr-aruco-badge svg {
      width: 44px !important;
      height: 44px !important;
    }
    .omr-per-page-4 .omr-aruco-badge svg {
      width: 38px !important;
      height: 38px !important;
    }
    .omr-card-body {
      margin: 4px 14px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-sizing: border-box;
    }
    .omr-multi-subjects-grid {
      display: flex;
      width: 100%;
      height: 100%;
      justify-content: space-between;
      gap: 6px;
      box-sizing: border-box;
    }
    .omr-multi-subjects-grid.cols-5 .omr-subject-block,
    .omr-multi-subjects-grid.fixed-5-slots .omr-subject-block {
      width: 18.8%;
      flex: 0 0 18.8%;
    }
    .omr-subject-block {
      display: flex;
      flex-direction: column;
      border: 1.2px solid #000000;
      border-radius: 4px;
      padding: 3px 4px;
      box-sizing: border-box;
      background: #ffffff;
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
    .omr-subject-header {
      border-bottom: 1.5px solid #000000;
      padding-bottom: 2px;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
    }
    .omr-subject-name {
      font-size: 0.72rem;
      font-weight: 900;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .omr-subject-badge {
      font-size: 0.58rem;
      font-weight: 800;
      color: #000000;
      background: #e2e8f0;
      padding: 1px 4px;
      border-radius: 3px;
      white-space: nowrap;
    }
    .omr-subject-rows {
      display: flex;
      flex-direction: column;
      justify-content: flex-start !important;
      align-items: stretch;
      flex: 1;
      gap: 2px;
      box-sizing: border-box;
    }
    .omr-q-row {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      height: 20px !important;
      min-height: 20px !important;
      box-sizing: border-box;
    }
    .omr-q-num {
      width: 22%;
      font-size: 0.74rem;
      font-weight: 800;
      text-align: right;
      color: #000000;
      box-sizing: border-box;
      padding-right: 4px;
    }
    .omr-q-bubbles {
      width: 78%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
    }
    .omr-bubble {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1.6px solid #000000 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-size: 0.66rem;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      box-sizing: border-box;
    }
    .omr-card-footer {
      margin: 4px 24px 2px 24px;
      border-top: 1px dashed #64748b;
      padding-top: 3px;
      display: flex;
      justify-content: space-between;
      font-size: 0.62rem;
      color: #475569;
      font-weight: 600;
    }
    /* 2-per-page (A5 İkili Form) milimetrik kalibrasyon kuralları */
    .omr-per-page-2 .omr-card-header {
      margin: 2px 22px 3px 22px !important;
      padding-bottom: 2px !important;
    }
    .omr-per-page-2 .omr-header-title {
      font-size: 0.80rem !important;
    }
    .omr-per-page-2 .omr-student-info {
      font-size: 0.72rem !important;
      gap: 12px !important;
      margin-top: 2px !important;
    }
    .omr-per-page-2 .omr-card-body {
      margin: 2px 10px !important;
      padding: 1px 0 !important;
    }
    .omr-per-page-2 .omr-q-row {
      gap: 4px !important;
    }
    .omr-per-page-2 .omr-q-num {
      font-size: 0.70rem !important;
      padding-right: 3px !important;
    }
    .omr-per-page-2 .omr-card.omr-multi {
      padding: 4px 8px !important;
    }
    .omr-per-page-2 .omr-card.omr-multi .omr-subject-block {
      padding: 2px 3px !important;
    }
    .omr-per-page-2 .omr-card.omr-multi .omr-subject-header {
      padding-bottom: 1px !important;
      margin-bottom: 2px !important;
    }
    .omr-per-page-2 .omr-card.omr-multi .omr-subject-name {
      font-size: 0.66rem !important;
    }
    .omr-per-page-2 .omr-card.omr-multi .omr-subject-badge {
      font-size: 0.54rem !important;
      padding: 0 3px !important;
    }
    .omr-per-page-2 .omr-card.omr-multi .omr-bubble {
      width: 14.5px !important;
      height: 14.5px !important;
      font-size: 0.55rem !important;
      border-width: 1.4px !important;
    }
    .omr-per-page-2 .omr-card-footer {
      margin: 2px 22px 2px 22px !important;
      padding-top: 2px !important;
      font-size: 0.58rem !important;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
    },

    executeMobileOpticalPrint() {
      const exam = this.mprintExam || this.activeExam;
      if (!exam) return;

      const formType = this.mprintType || 'named';
      const perPage = this.mprintPerPage || 2;
      const allStudents = this.getActiveStudents();

      let targetStudents = [];
      if (formType === 'named') {
        const checkedBoxes = Array.from(document.querySelectorAll('.mprint-stu-cb:checked'));
        if (checkedBoxes.length === 0) {
          if (window.Companion) window.Companion.showToast('Lütfen en az bir öğrenci seçin.');
          return;
        }
        checkedBoxes.forEach(cb => {
          const s = allStudents.find(st => String(st.id) === String(cb.value));
          if (s) {
            const canonicalIdx = allStudents.indexOf(s) + 1;
            targetStudents.push({
              studentIndex: canonicalIdx,
              studentId: s.id,
              studentNo: s.number || '',
              studentName: `${s.name} ${s.surname || ''}`.trim()
            });
          }
        });
      } else {
        const blankCountInput = document.getElementById('mprint-blank-count');
        const count = Math.max(1, parseInt(blankCountInput ? blankCountInput.value : 10, 10) || 10);
        for (let i = 1; i <= count; i++) {
          targetStudents.push({
            studentIndex: 0,
            studentId: '',
            studentNo: '......',
            studentName: '................................'
          });
        }
      }

      const choicesCount = exam.choicesCount || 4;
      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
      const totalQuestions = exam.totalQuestions || 20;
      const isMultiSubject = !!(exam.isMultiSubject && Array.isArray(exam.subjects) && exam.subjects.length > 0);
      const subjects = exam.subjects || [];

      let pagesHtml = '';
      const totalPages = Math.ceil(targetStudents.length / perPage);

      for (let p = 0; p < totalPages; p++) {
        const pageStudents = targetStudents.slice(p * perPage, (p + 1) * perPage);
        let pageCardsHtml = '';

        pageStudents.forEach(stu => {
          pageCardsHtml += this.generateSingleOpticalCardHTML({
            examName: exam.examName || 'Haftalık Değerlendirme',
            studentName: stu.studentName,
            studentNo: stu.studentNo,
            studentId: stu.studentId,
            studentIndex: stu.studentIndex,
            examId: exam.id,
            totalQuestions: totalQuestions,
            letters: letters,
            perPage: perPage,
            isMultiSubject: isMultiSubject,
            subjects: subjects
          });
        });

        const remainingSlots = perPage - pageStudents.length;
        for (let r = 0; r < remainingSlots; r++) {
          pageCardsHtml += `<div class="omr-card omr-card-placeholder" style="visibility: hidden; border: 1.5px dashed transparent;"></div>`;
        }

        pagesHtml += `<div class="omr-print-page omr-per-page-${perPage}">${pageCardsHtml}</div>`;
      }

      const fullPrintHtml = this.buildMobileOpticalPrintDocument(pagesHtml, exam.examName || 'Optik_Form');

      this.closeMobileOpticalPrintModal();

      // Android Native Yazıcı Kontrolü
      if (window.AndroidBridge && typeof window.AndroidBridge.printHtml === 'function') {
        try {
          window.AndroidBridge.printHtml(fullPrintHtml, exam.examName || 'Optik_Form');
          if (window.Companion) window.Companion.showToast('Yazıcı ekranına yönlendiriliyor...', 'success');
          return;
        } catch (e) {
          console.warn('AndroidBridge.printHtml hatası, iframe fallback kullanılıyor:', e);
        }
      }

      // Mobil Tarayıcı / PWA / Web Fallback
      let printFrame = document.getElementById('mobile-omr-print-frame');
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'mobile-omr-print-frame';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        printFrame.style.visibility = 'hidden';
        document.body.appendChild(printFrame);
      }

      const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(fullPrintHtml);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        } catch (err) {
          console.error('Yazdırma tetiklenemedi:', err);
          const win = window.open('', '_blank');
          if (win) {
            win.document.write(fullPrintHtml);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 350);
          }
        }
      }, 400);

      if (window.Companion) window.Companion.showToast('Yazdırma sayfası hazırlandı!', 'success');
    },

    // ==========================================================================
    // OPTİK FORM VE İŞARETLEME NOKTALARI TEŞHİS & ÖNİZLEME MOTORU
    // ==========================================================================
    inspectZoomLevel: 1.0,
    inspectCurrentImageUrl: '',

    viewActiveCardPreview() {
      if (!this.activeCardResult) {
        if (window.Companion) window.Companion.showToast('Görüntülenecek optik form bulunamadı.', 'warning');
        return;
      }
      this.openOpticalInspectModalWithData(this.activeCardResult);
    },

    openOpticalPreviewModal(studentId) {
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(this.activeExam.id));
      const res = (exam && exam.studentResults && exam.studentResults[studentId]) || {};
      let cachedImg = (this.scannedCardImages && this.scannedCardImages[studentId]) || res.thumbUrl;
      if (!cachedImg) {
        try {
          cachedImg = sessionStorage.getItem('omr_thumb_' + studentId);
        } catch (e) {}
      }

      if (!cachedImg) {
        if (window.Companion) window.Companion.showToast('Bu öğrenci için taranmış form görseli bulunamadı.', 'warning');
        return;
      }

      this.openOpticalInspectModalWithData({
        studentName: res.studentName || 'Öğrenci',
        studentNo: res.studentNo || '-',
        score: res.score || 0,
        correct: res.correct || 0,
        wrong: res.wrong || 0,
        blank: res.blank || 0,
        thumbUrl: cachedImg
      });
    },

    openOpticalInspectModalWithData(data) {
      const modal = document.getElementById('companion-optical-inspect-modal');
      if (!modal) return;

      const titleEl = document.getElementById('opt-inspect-title');
      const metaEl = document.getElementById('opt-inspect-meta');
      const avatarEl = document.getElementById('opt-inspect-avatar');
      const imgEl = document.getElementById('opt-inspect-img');

      if (titleEl) titleEl.textContent = data.studentName || 'Öğrenci Formu';
      if (metaEl) metaEl.textContent = `No: ${data.studentNo || '-'} • Puan: ${Number(data.score || 0).toFixed(1)} • ${data.correct || 0}D ${data.wrong || 0}Y ${data.blank || 0}B`;
      if (avatarEl) avatarEl.textContent = (data.studentName || 'Ö')[0].toUpperCase();

      this.inspectCurrentImageUrl = data.thumbUrl || '';
      if (imgEl) {
        imgEl.src = data.thumbUrl || '';
        this.resetInspectZoom();
      }

      modal.style.display = 'flex';
      this.setupInspectTouch();
      if (window.Companion) window.Companion.renderIcons();
    },

    setupInspectTouch() {
      const container = document.getElementById('opt-inspect-container');
      if (!container || container._touchBound) return;
      container._touchBound = true;

      let initialDist = 0;
      let initialZoom = 1.0;
      let lastTap = 0;

      container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          initialDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          initialZoom = this.inspectZoomLevel || 1.0;
        } else if (e.touches.length === 1) {
          const now = Date.now();
          if (now - lastTap < 300) {
            // Çift dokunma: %100 ve %220 arasında geçiş
            if (this.inspectZoomLevel > 1.1) {
              this.resetInspectZoom();
            } else {
              this.inspectZoomLevel = 2.2;
              this.applyInspectZoom();
            }
          }
          lastTap = now;
        }
      }, { passive: true });

      container.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && initialDist > 0) {
          const currentDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const scale = currentDist / initialDist;
          const newZoom = Math.max(0.6, Math.min(3.5, initialZoom * scale));
          this.inspectZoomLevel = parseFloat(newZoom.toFixed(2));
          this.applyInspectZoom();
        }
      }, { passive: true });

      container.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
          initialDist = 0;
        }
      }, { passive: true });
    },

    closeOpticalInspectModal() {
      const modal = document.getElementById('companion-optical-inspect-modal');
      if (modal) modal.style.display = 'none';
      const imgEl = document.getElementById('opt-inspect-img');
      if (imgEl) imgEl.src = '';
      this.inspectCurrentImageUrl = '';
    },

    zoomInspect(delta) {
      this.inspectZoomLevel = Math.max(0.5, Math.min(3.5, parseFloat(((this.inspectZoomLevel || 1.0) + delta).toFixed(2))));
      this.applyInspectZoom();
    },

    resetInspectZoom() {
      this.inspectZoomLevel = 1.0;
      this.applyInspectZoom();
    },

    applyInspectZoom() {
      const wrapper = document.getElementById('opt-inspect-img-wrapper') || document.getElementById('opt-inspect-img');
      const levelEl = document.getElementById('opt-inspect-zoom-level');
      if (wrapper) {
        wrapper.style.transform = `scale(${this.inspectZoomLevel})`;
        if (this.inspectZoomLevel > 1) {
          wrapper.style.cursor = 'grab';
        } else {
          wrapper.style.cursor = 'default';
        }
      }
      if (levelEl) {
        levelEl.textContent = `%${Math.round(this.inspectZoomLevel * 100)}`;
      }
    },

    downloadInspectImage() {
      if (!this.inspectCurrentImageUrl) {
        if (window.Companion) window.Companion.showToast('İndirilecek görsel yok.', 'warning');
        return;
      }
      try {
        const link = document.createElement('a');
        const filename = `Optik_${(document.getElementById('opt-inspect-title')?.textContent || 'Form').replace(/\s+/g, '_')}_${Date.now()}.jpg`;
        link.href = this.inspectCurrentImageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (window.Companion) window.Companion.showToast('Görsel indirildi.', 'success');
      } catch (e) {
        window.open(this.inspectCurrentImageUrl, '_blank');
      }
    },

    openExamPickerModal() {
      const data = this.getData();
      const exams = Array.isArray(data.weeklyEvaluations) ? data.weeklyEvaluations : [];
      let picker = document.getElementById('omr-quick-exam-picker-modal');
      if (!picker) {
        picker = document.createElement('div');
        picker.id = 'omr-quick-exam-picker-modal';
        picker.className = 'c-modal-overlay';
        picker.style.cssText = 'display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 10005; align-items: center; justify-content: center; padding: 20px;';
        picker.onclick = (e) => { if (e.target === picker) this.closeExamPickerModal(); };
        document.body.appendChild(picker);
      }
      picker.innerHTML = `
        <div class="c-modal-card" style="max-width: 350px; width: 100%; border-radius: 20px; padding: 20px; background: #0f172a; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 20px 40px rgba(0,0,0,0.6); color: #fff;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">📚</span>
              <h3 style="font-size: 15px; font-weight: 800; margin: 0; color: #fff;">Sınav Seçimi</h3>
            </div>
            <button type="button" class="c-icon-btn" onclick="window.CompanionOmr.closeExamPickerModal()" style="color: #94a3b8; background: transparent; border: none; font-size: 18px; cursor: pointer; padding: 4px;">✕</button>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin: 0 0 12px 0;">Tarayacağınız optik forma ait doğru sınavı seçin:</p>
          <div style="display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto;">
            ${exams.map(e => {
              const isSelected = this.activeExam && String(this.activeExam.id) === String(e.id);
              const info = e.isMultiSubject 
                ? `📚 ${(e.subjects || []).length} Ders • ${e.totalQuestions || 32} Soru` 
                : `📄 ${e.totalQuestions || 20} Soru • ${e.choicesCount || 4} Şık`;
              return `
                <div onclick="window.CompanionOmr.quickSelectExam('${e.id}')" style="padding: 12px 14px; border-radius: 12px; background: ${isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.85)'}; border: 1.5px solid ${isSelected ? '#6366f1' : 'rgba(255,255,255,0.1)'}; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 13.5px; font-weight: 800; color: #fff; margin-bottom: 2px;">${e.examName}</div>
                    <div style="font-size: 11px; color: ${isSelected ? '#a5b4fc' : '#94a3b8'};">${info}</div>
                  </div>
                  ${isSelected ? '<span style="font-size: 16px; color: #10b981; font-weight: 900;">✓</span>' : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
      picker.style.display = 'flex';
      if (window.Companion) window.Companion.renderIcons();
    },

    closeExamPickerModal() {
      const picker = document.getElementById('omr-quick-exam-picker-modal');
      if (picker) picker.style.display = 'none';
    },

    quickSelectExam(examId) {
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(examId));
      if (exam) {
        this.activeExam = exam;
        try {
          localStorage.setItem('companion_last_active_exam_id', exam.id);
        } catch(e) {}
        const examNameTag = document.getElementById('omr-camera-exam-name');
        if (examNameTag) examNameTag.textContent = exam.examName;
        this.closeExamPickerModal();
        if (window.Companion) {
          window.Companion.showToast(`🎯 Sınav seçildi: ${exam.examName} (${exam.isMultiSubject ? exam.subjects.length + ' Ders' : 'Tek Ders'})`);
        }
      }
    }
  };

  window.CompanionOmr = CompanionOmr;

  // Android Donanım Geri Tuşu Entegrasyonu
  window.handleAndroidBack = function() {
    const examPickerModal = document.getElementById('omr-quick-exam-picker-modal');
    if (examPickerModal && examPickerModal.style.display !== 'none') {
      CompanionOmr.closeExamPickerModal();
      return true;
    }

    const inspectModal = document.getElementById('companion-optical-inspect-modal');
    if (inspectModal && inspectModal.style.display !== 'none') {
      CompanionOmr.closeOpticalInspectModal();
      return true;
    }

    const pickerModal = document.getElementById('omr-student-picker-modal');
    if (pickerModal && pickerModal.style.display !== 'none') {
      CompanionOmr.closeStudentPickerModal();
      return true;
    }

    const printModal = document.getElementById('companion-optical-print-modal');
    if (printModal && printModal.style.display !== 'none') {
      CompanionOmr.closeMobileOpticalPrintModal();
      return true;
    }

    const wizardModal = document.getElementById('companion-exam-wizard-modal');
    if (wizardModal && wizardModal.style.display !== 'none') {
      CompanionOmr.closeCreateExamModal();
      return true;
    }

    const settingsModal = document.getElementById('companion-settings-modal');
    if (settingsModal && settingsModal.style.display !== 'none') {
      if (window.Companion && typeof window.Companion.closeSettingsModal === 'function') {
        window.Companion.closeSettingsModal();
      } else {
        settingsModal.style.display = 'none';
      }
      return true;
    }

    const cameraModal = document.getElementById('companion-omr-camera-modal');
    if (cameraModal && cameraModal.style.display !== 'none') {
      CompanionOmr.closeCamera();
      return true;
    }

    if (CompanionOmr.viewState === 'detail') {
      CompanionOmr.backToExamsList();
      return true;
    }

    return false;
  };

})(window);
