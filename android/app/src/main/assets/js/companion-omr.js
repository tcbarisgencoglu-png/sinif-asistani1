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
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
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
      let students = Array.isArray(data.students) ? data.students : [];
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

    // Aktif Sınavı Güvenle Sağla
    ensureActiveExam() {
      const data = this.getData();
      const exams = Array.isArray(data.weeklyEvaluations) ? data.weeklyEvaluations : [];
      if (exams.length > 0) {
        if (!this.activeExam) {
          this.activeExam = exams[0];
        } else {
          const matched = exams.find(e => String(e.id) === String(this.activeExam.id));
          this.activeExam = matched || exams[0];
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
        const stu = students.find(s => String(s.id) === String(stuId)) || { name: res.studentName || 'Öğrenci', surname: '', number: res.studentNo || '-' };
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

              const initials = (stu.name || 'Ö')[0] + ((stu.surname || '')[0] || '');
              
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
                  <button type="button" class="c-icon-btn" style="width: 28px; height: 28px; flex-shrink: 0;" title="Sil" onclick="window.CompanionOmr.deleteResult('${studentId}')">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px; color: #94a3b8;"></i>
                  </button>
                </div>
              `;
            }).join('')}
          `}
        </div>

        <!-- Sabit Alt Eylem Çubuğu: Sonuçları Kaydet & QR Kod Butonu -->
        <div class="c-omr-sticky-actions">
          <button type="button" class="c-btn-save-results" onclick="window.CompanionOmr.saveAndRankResults()">
            <i data-lucide="save" style="width: 18px; height: 18px;"></i>
            <span>Sonuçları Kaydet</span>
          </button>

          <button type="button" class="c-btn-qr-scan-bottom" onclick="window.CompanionOmr.openCamera()">
            <i data-lucide="qr-code" style="width: 20px; height: 20px;"></i>
            <span>QR / Form Tara</span>
          </button>
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
        if (tabs) {
          tabs.style.display = 'flex';
          tabs.innerHTML = this.wizardSubjects.map(s => `
            <button type="button" class="c-subject-pill ${s.id === this.wizardActiveSubjId ? 'active' : ''}" style="cursor: pointer;" onclick="window.CompanionOmr.wizardSelectSubjTab('${s.id}')">
              📚 ${s.name} (${s.questionCount}S)
            </button>
          `).join('');
        }

        const currentSubj = this.wizardSubjects.find(s => s.id === this.wizardActiveSubjId) || this.wizardSubjects[0];
        if (!currentSubj) return;

        const count = currentSubj.questionCount || 10;
        grid.innerHTML = Array.from({ length: count }, (_, i) => i + 1).map(q => {
          const key = `${currentSubj.id}_${q}`;
          const sel = this.wizardKey[key] || '';
          return `
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
        }).join('');
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
      if (this.wizardKey[qKey] === letter) {
        delete this.wizardKey[qKey];
      } else {
        this.wizardKey[qKey] = letter;
      }

      if (this.wizardType === 'multi') {
        const currentSubj = (this.wizardSubjects || []).find(s => s.id === this.wizardActiveSubjId);
        if (currentSubj) {
          let cumulativeOffset = 0;
          for (const s of (this.wizardSubjects || [])) {
            if (s.id === this.wizardActiveSubjId) break;
            cumulativeOffset += (s.questionCount || 0);
          }
          const m = String(qKey).match(/_(\d+)$/);
          if (m) {
            const qNum = parseInt(m[1], 10);
            const globalQ = cumulativeOffset + qNum;
            if (this.wizardKey[qKey]) {
              this.wizardKey[`${currentSubj.name}_${qNum}`] = letter;
              this.wizardKey[globalQ] = letter;
            } else {
              delete this.wizardKey[`${currentSubj.name}_${qNum}`];
              delete this.wizardKey[globalQ];
            }
          }
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
        pairs.forEach(p => {
          const m = p.match(/(\d+)[^A-E]*([A-E])/i);
          if (m) {
            const q = parseInt(m[1], 10);
            const ans = m[2].toUpperCase();
            if (this.wizardType === 'multi') {
              const activeSubj = (this.wizardSubjects || []).find(s => s.id === this.wizardActiveSubjId);
              let cumulativeOffset = 0;
              for (const s of (this.wizardSubjects || [])) {
                if (s.id === this.wizardActiveSubjId) break;
                cumulativeOffset += (s.questionCount || 0);
              }
              const globalQ = cumulativeOffset + q;
              this.wizardKey[`${this.wizardActiveSubjId}_${q}`] = ans;
              if (activeSubj && activeSubj.name) {
                this.wizardKey[`${activeSubj.name}_${q}`] = ans;
              }
              this.wizardKey[globalQ] = ans;
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

      const existingIdx = data.weeklyEvaluations.findIndex(e => String(e.id) === String(examData.id));
      if (existingIdx >= 0) {
        data.weeklyEvaluations[existingIdx] = {
          ...data.weeklyEvaluations[existingIdx],
          ...examData,
          updatedAt: new Date().toISOString()
        };
      } else {
        data.weeklyEvaluations.unshift(examData);
      }
      this.saveData(data);

      if (this.activeExam && String(this.activeExam.id) === String(examData.id)) {
        this.activeExam = { ...this.activeExam, ...examData };
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
      if (!Array.isArray(data.weeklyEvaluations)) return;

      data.weeklyEvaluations = data.weeklyEvaluations.filter(e => String(e.id) !== String(examId));
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

    // ==========================================================================
    // CANLI KAMERA VİZÖR YÖNETİMİ & QR VE OMR OKUMA
    // ==========================================================================

    async openCamera() {
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

      const marginX = (canvasMaxX - canvasMinX) * 0.15;
      const marginY = (canvasMaxY - canvasMinY) * 0.15;

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
        guideBox.style.width = '82vw';
        guideBox.style.height = '62vh';
        guideBox.style.maxWidth = '460px';
        guideBox.style.maxHeight = '560px';
      } else if (format === 4) {
        guideBox.style.width = '84vw';
        guideBox.style.height = '42vh';
        guideBox.style.maxWidth = '440px';
        guideBox.style.maxHeight = '340px';
      } else {
        guideBox.style.width = '88vw';
        guideBox.style.height = '50vh';
        guideBox.style.maxWidth = '500px';
        guideBox.style.maxHeight = '420px';
      }
    },

    // Canlı Kamera Hafif Döngüsü (jsQR + OMR Otomatik Tetikleme)
    startLiveLoop() {
      const video = document.getElementById('omr-camera-video');
      const guideBox = document.getElementById('omr-guide-box');
      const statusPill = document.getElementById('omr-status-pill');
      const statusText = document.getElementById('omr-status-text');

      const fastCanvas = document.createElement('canvas');
      fastCanvas.width = 640;
      fastCanvas.height = 480;
      const fCtx = fastCanvas.getContext('2d', { willReadFrequently: true });

      const loop = async () => {
        if (!this.isScanningLoop) return;

        const now = Date.now();
        if (this.isProcessingFrame || now < this.scanCooldownUntil) {
          requestAnimationFrame(() => setTimeout(loop, 200));
          return;
        }

        if (video && video.readyState >= 2 && !video.paused) {
          try {
            fCtx.drawImage(video, 0, 0, 640, 480);
            const imgData = fCtx.getImageData(0, 0, 640, 480);

            // QR Kod Doğrulaması (jsQR - attemptBoth)
            let detectedQr = null;
            if (typeof window.jsQR === 'function') {
              detectedQr = window.jsQR(imgData.data, 640, 480, { inversionAttempts: 'attemptBoth' });
            }

            if (detectedQr && detectedQr.data) {
              guideBox && guideBox.classList.add('locked');
              statusPill && statusPill.classList.add('success');
              if (statusText) statusText.textContent = '🎯 Form / QR Algılandı • Okunuyor...';

              await this.executeFullFrameScan();
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

    async executeFullFrameScan() {
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
        await this.processImageCanvas(fullCanvas, bounds);
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
        await this.processImageCanvas(fullCanvas, bounds);
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
          await this.processImageCanvas(c, null);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },

    // Görüntü Analizi (OMREngine ve Doğrudan QR Kod Okuma)
    async processImageCanvas(canvas, bounds = null) {
      const students = this.getActiveStudents();
      const exam = this.activeExam;

      if (!exam) {
        this.isProcessingFrame = false;
        return;
      }

      let scanResult = null;
      if (window.OmrEngine && typeof window.OmrEngine.scanDocumentPage === 'function') {
        scanResult = await window.OmrEngine.scanDocumentPage(canvas, exam, students, {
          isDoubleForm: false,
          perPage: this.currentPaperFormat || 2,
          sensitivity: this.currentSensitivity,
          bounds: bounds
        });
      }

      if (scanResult && scanResult.success && Array.isArray(scanResult.cards) && scanResult.cards.length > 0) {
        const savedResults = [];

        scanResult.cards.forEach((card, cIdx) => {
          const matched = card.matched || card.candidate || (students.length === 1 ? students[0] : null);
          const stuName = matched ? `${matched.name} ${matched.surname || ''}`.trim() : (card.studentName || card.rawStudentName || (scanResult.cards.length > 1 ? `Form #${cIdx + 1}` : 'Öğrenci'));
          const stuNo = matched ? (matched.number || '-') : (card.studentNo || card.rawStudentNo || '-');
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

          this.saveExamResult(exam.id, stuId, cardResult);
          savedResults.push(cardResult);
        });

        this.activeCardResult = savedResults[0];
        playSuccessBeep();
        if (window.Companion) window.Companion.vibrate([40, 30, 40]);

        if (savedResults.length > 1) {
          const names = savedResults.map(r => r.studentName).join(', ');
          if (window.Companion) window.Companion.showToast(`✅ ${savedResults.length} Öğrenci Formu Okundu: ${names}`, 'success');
        }

        this.showResultHud(this.activeCardResult);

        const isUnmatched = !this.activeCardResult.studentId || 
                            (this.activeCardResult.studentId.startsWith('temp_') && (!this.activeCardResult.studentNo || this.activeCardResult.studentNo === '-')) || 
                            (this.activeCardResult.studentName === 'Öğrenci' && (!this.activeCardResult.studentNo || this.activeCardResult.studentNo === '-'));

        if (this.autoAdvance && !isUnmatched) {
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
          window.Companion.showToast('Optik form algılanamadı. Formu kılavuza oturtun.');
        }
        this.isProcessingFrame = false;
        this.scanCooldownUntil = Date.now() + 1500;
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

      // Eşleşmeyen Öğrenci Uyarısı
      const isUnmatched = !res.studentId || res.studentId.startsWith('temp_') || res.studentName === 'Öğrenci' || res.studentNo === '-';
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
      if (searchInput) searchInput.value = '';
      this.renderStudentPickerList('');
      modal.style.display = 'flex';
      if (window.Companion) window.Companion.renderIcons();
    },

    closeStudentPickerModal() {
      const modal = document.getElementById('omr-student-picker-modal');
      if (modal) modal.style.display = 'none';
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

      exam.studentResults[studentId] = {
        studentName: res.studentName,
        studentNo: res.studentNo,
        correct: res.correct,
        wrong: res.wrong,
        blank: res.blank,
        net: res.net,
        score: res.score,
        answers: res.answers,
        subjectBreakdown: res.subjectBreakdown || {},
        updatedAt: new Date().toISOString()
      };
      exam.examScores[studentId] = res.score;
      exam.updatedAt = new Date().toISOString();

      this.saveData(data);
      this.activeExam = exam;

      // Arka planda sessizce buluta da gönder ve masaüstüne canlı fırlat
      if (window.CloudSync) {
        window.CloudSync.pushExam(exam).catch(() => {});
        if (typeof window.CloudSync.pushLiveOmr === 'function') {
          window.CloudSync.pushLiveOmr(exam.id, exam.examName, studentId, res.studentName, res);
        }
      }
    },

    deleteResult(studentId) {
      if (!confirm('Bu öğrencinin okuma sonucunu silmek istediğinize emin misiniz?')) return;
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(this.activeExam.id));
      if (exam && exam.studentResults) {
        delete exam.studentResults[studentId];
        if (exam.examScores) delete exam.examScores[studentId];
        this.saveData(data);
        this.activeExam = exam;
        this.renderHub();
        if (window.Companion) window.Companion.showToast('Sonuç silindi.');
        if (window.CloudSync) window.CloudSync.pushExam(exam).catch(() => {});
      }
    },

    clearAllResults() {
      if (!confirm('Bu sınavdaki tüm okuma sonuçlarını sıfırlamak istediğinize emin misiniz?')) return;
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(this.activeExam.id));
      if (exam) {
        exam.studentResults = {};
        exam.examScores = {};
        this.saveData(data);
        this.activeExam = exam;
        this.isRanked = false;
        this.renderHub();
        if (window.Companion) window.Companion.showToast('Tüm sonuçlar temizlendi.');
        if (window.CloudSync) window.CloudSync.pushExam(exam).catch(() => {});
      }
    },

    // ==========================================================================
    // CEVAP ANAHTARI GÖRÜNTÜLEYİCİ & DÜZENLEYİCİ
    // ==========================================================================

    openKeyEditor(examId) {
      const exam = this.activeExam;
      if (!exam) return;

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
              <span style="font-size: 11px; opacity: 0.8;">(${subj.questionCount} Soru)</span>
            </div>
          `;
          for (let qi = 1; qi <= subj.questionCount; qi++) {
            const currentQ = qCursor++;
            const activeOpt = key[currentQ] || key[`${subj.id}_${qi}`] || '';
            bodyHtml += `
              <div class="c-key-q-row">
                <span class="c-key-q-num">S.${currentQ}</span>
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

      const current = this.activeExam.answerKey[q];
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
          btn.classList.toggle('active', btn.getAttribute('data-opt') === this.activeExam.answerKey[q]);
        });
      }

      if (window.Companion) window.Companion.vibrate(10);
    },

    saveKeyEditor() {
      const data = this.getData();
      const exam = (data.weeklyEvaluations || []).find(e => String(e.id) === String(this.activeExam.id));
      if (exam) {
        exam.answerKey = this.activeExam.answerKey;
        if (this.activeExam.isMultiSubject && Array.isArray(this.activeExam.subjects)) {
          exam.subjects = this.activeExam.subjects;
        }
        exam.updatedAt = new Date().toISOString();
        this.saveData(data);
        if (window.CloudSync) window.CloudSync.pushExam(exam).catch(() => {});
      }

      const modal = document.getElementById('companion-key-modal');
      if (modal) modal.style.display = 'none';

      this.renderHub();
      if (window.Companion) window.Companion.showToast('Cevap anahtarı kaydedildi!');
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

      const isMulti = !!(exam.isMultiSubject && Array.isArray(exam.subjects) && exam.subjects.length > 0);
      
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
        subjects: isMulti ? JSON.parse(JSON.stringify(exam.subjects)) : [],
        activeSubjId: isMulti ? (exam.subjects[0]?.id || 'sub_0') : null,
        totalQuestions: exam.totalQuestions || 20,
        answerKey: { ...(exam.answerKey || {}) }
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
        if (tabs) {
          tabs.style.display = 'flex';
          tabs.innerHTML = (this.settingsState.subjects || []).map(s => `
            <button type="button" class="c-subject-pill ${s.id === this.settingsState.activeSubjId ? 'active' : ''}" style="cursor: pointer;" onclick="window.CompanionOmr.settingsSelectSubjTab('${s.id}')">
              📚 ${s.name} (${s.questionCount}S)
            </button>
          `).join('');
        }

        const currentSubj = (this.settingsState.subjects || []).find(s => s.id === this.settingsState.activeSubjId) || this.settingsState.subjects[0];
        if (!currentSubj) return;

        let cumulativeOffset = 0;
        for (const s of (this.settingsState.subjects || [])) {
          if (s.id === currentSubj.id) break;
          cumulativeOffset += (s.questionCount || 0);
        }

        const count = currentSubj.questionCount || 10;
        grid.innerHTML = Array.from({ length: count }, (_, i) => i + 1).map(q => {
          const globalQ = cumulativeOffset + q;
          const key = `${currentSubj.id}_${q}`;
          const sel = this.settingsState.answerKey[key] || this.settingsState.answerKey[`${currentSubj.name}_${q}`] || this.settingsState.answerKey[globalQ] || '';
          return `
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
        }).join('');
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
      if (this.settingsState.answerKey[qKey] === letter) {
        delete this.settingsState.answerKey[qKey];
      } else {
        this.settingsState.answerKey[qKey] = letter;
      }

      if (this.settingsState.isMultiSubject) {
        const currentSubj = (this.settingsState.subjects || []).find(s => s.id === this.settingsState.activeSubjId);
        if (currentSubj) {
          let cumulativeOffset = 0;
          for (const s of (this.settingsState.subjects || [])) {
            if (s.id === this.settingsState.activeSubjId) break;
            cumulativeOffset += (s.questionCount || 0);
          }
          const m = String(qKey).match(/_(\d+)$/);
          if (m) {
            const qNum = parseInt(m[1], 10);
            const globalQ = cumulativeOffset + qNum;
            if (this.settingsState.answerKey[qKey]) {
              this.settingsState.answerKey[`${currentSubj.name}_${qNum}`] = letter;
              this.settingsState.answerKey[globalQ] = letter;
            } else {
              delete this.settingsState.answerKey[`${currentSubj.name}_${qNum}`];
              delete this.settingsState.answerKey[globalQ];
            }
          }
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
        pairs.forEach(p => {
          const m = p.match(/(\d+)[^A-E]*([A-E])/i);
          if (m) {
            const q = parseInt(m[1], 10);
            const ans = m[2].toUpperCase();
            if (this.settingsState.isMultiSubject) {
              const activeSubj = (this.settingsState.subjects || []).find(s => s.id === this.settingsState.activeSubjId);
              let cumulativeOffset = 0;
              for (const s of (this.settingsState.subjects || [])) {
                if (s.id === this.settingsState.activeSubjId) break;
                cumulativeOffset += (s.questionCount || 0);
              }
              const globalQ = cumulativeOffset + q;
              this.settingsState.answerKey[`${this.settingsState.activeSubjId}_${q}`] = ans;
              if (activeSubj && activeSubj.name) {
                this.settingsState.answerKey[`${activeSubj.name}_${q}`] = ans;
              }
              this.settingsState.answerKey[globalQ] = ans;
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

      if (isMulti) {
        subjects = (this.settingsState.subjects || []).map(s => ({
          id: s.id,
          name: s.name,
          questionCount: s.questionCount,
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
              this.settingsState.answerKey[`${s.id}_${qi}`] = val;
              this.settingsState.answerKey[`${s.name}_${qi}`] = val;
              this.settingsState.answerKey[globalQ] = val;
            }
          }
          cumulative += s.questionCount;
        });
      } else {
        const qInput = document.getElementById('settings-exam-questions');
        totalQ = parseInt(qInput ? qInput.value : (this.settingsState.totalQuestions || 20), 10) || 20;
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
      exam.answerKey = { ...this.settingsState.answerKey };
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

      this.mprintExam = exam;
      this.mprintType = 'named';
      this.mprintPerPage = 2;

      const modal = document.getElementById('companion-optical-print-modal');
      if (!modal) return;

      const badge = document.getElementById('mprint-exam-title-badge');
      if (badge) badge.textContent = `${exam.examName} (${exam.totalQuestions || 20} Soru)`;

      this.mprintSetType('named');
      this.mprintSetPerPage(2);

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
      const idx = parseInt(studentIndex, 10) || 0;

      const bits = [];
      for (let b = 0; b < 9; b++) {
        bits.push((idx >> b) & 1);
      }

      const boxSize = 16;
      const gap = 4;
      const padding = 4;
      const totalW = padding * 2 + boxSize * 3 + gap * 2; // 64
      const totalH = totalW;

      let rects = '';
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const bitIdx = r * 3 + c;
          const x = padding + c * (boxSize + gap);
          const y = padding + r * (boxSize + gap);
          if (bits[bitIdx] === 1) {
            rects += `<rect x="${x}" y="${y}" width="${boxSize}" height="${boxSize}" fill="#000000" rx="2" />`;
          } else {
            rects += `<rect x="${x}" y="${y}" width="${boxSize}" height="${boxSize}" fill="#ffffff" stroke="#000000" stroke-width="2" rx="2" />`;
          }
        }
      }

      let qrSvgHtml = '';
      const qrcodeFn = (typeof window !== 'undefined' && (window.qrcode || (typeof qrcode === 'function' ? qrcode : null))) || null;
      if (qrcodeFn && idx > 0) {
        try {
          const qr = qrcodeFn(0, 'M');
          qr.addData(`SA:${idx}:${studentNo || ''}`);
          qr.make();
          qrSvgHtml = qr.createSvgTag(2, 0);
          if (qrSvgHtml) {
            qrSvgHtml = qrSvgHtml.replace(/width="[^"]*"/, 'width="46"').replace(/height="[^"]*"/, 'height="46"');
          }
        } catch (e) {
          console.warn('Micro-QR üretilemedi:', e);
        }
      }

      if (qrSvgHtml) {
        return `
          <div class="omr-id-badge omr-dual-id-badge" title="Öğrenci Optik ve QR Kimlik Kodu #${idx}">
            <div class="omr-binary-strip-wrap" style="background: #ffffff; padding: 2px 5px; display: flex; align-items: center; gap: 6px; border: 2px solid #000000; border-radius: 6px; box-sizing: border-box;">
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="font-size: 0.48rem; font-weight: 800; color: #000000; letter-spacing: 0.4px; margin-bottom: 1px; text-transform: uppercase;">OMR ID</div>
                <svg viewBox="0 0 ${totalW} ${totalH}" width="46" height="46" shape-rendering="crispEdges" style="display: block;">
                  <rect x="1" y="1" width="${totalW - 2}" height="${totalH - 2}" fill="#ffffff" stroke="#000000" stroke-width="2.5" rx="3" />
                  ${rects}
                </svg>
                <div class="omr-id-caption" style="font-size: 0.60rem; font-weight: 800; font-family: monospace; color: #000000; margin-top: 1px;">
                  ${idx > 0 ? ('ID:#' + idx) : 'ID:---'}
                </div>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="font-size: 0.48rem; font-weight: 800; color: #000000; letter-spacing: 0.4px; margin-bottom: 1px; text-transform: uppercase;">QR KOD</div>
                <div style="width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                  ${qrSvgHtml}
                </div>
                <div class="omr-id-caption" style="font-size: 0.58rem; font-weight: 800; font-family: monospace; color: #000000; margin-top: 1px;">
                  ${studentNo ? ('NO:' + studentNo) : 'KOD'}
                </div>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="omr-id-badge omr-binary-badge" title="Öğrenci Optik Kimlik Kodu #${idx}">
          <div class="omr-binary-strip-wrap" style="background: #ffffff; padding: 4px 6px; display: flex; flex-direction: column; align-items: center; border: 2px solid #000000; border-radius: 6px; box-sizing: border-box;">
            <div style="font-size: 0.50rem; font-weight: 800; color: #000000; letter-spacing: 0.5px; margin-bottom: 2px; text-transform: uppercase;">KİMLİK KODU</div>
            <svg viewBox="0 0 ${totalW} ${totalH}" width="56" height="56" shape-rendering="crispEdges" style="display: block;">
              <rect x="1" y="1" width="${totalW - 2}" height="${totalH - 2}" fill="#ffffff" stroke="#000000" stroke-width="2.5" rx="3" />
              ${rects}
            </svg>
            <div class="omr-id-caption" style="font-size: 0.65rem; font-weight: 800; font-family: monospace; color: #000000; margin-top: 2px;">
              ${idx > 0 ? ('ID:#' + idx) : 'ID:---'}
            </div>
          </div>
        </div>
      `;
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
        examId: examId || ''
      });

      if (isMultiSubject && Array.isArray(subjects) && subjects.length > 0) {
        const cols = Math.min(6, Math.max(2, subjects.length));
        const maxSubjQ = Math.max(...subjects.map(s => s.questionCount || 0));
        const isCompact = maxSubjQ > 20 || totalQuestions > 40;

        let subjectsHtml = '';
        subjects.forEach(subj => {
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
            <div class="omr-subject-block">
              <div class="omr-subject-header">
                <span class="omr-subject-name" title="${subj.name}">${subj.name}</span>
                <span class="omr-subject-badge">${count} Soru</span>
              </div>
              <div class="omr-subject-rows">
                ${rowsHtml}
              </div>
            </div>
          `;
        });

        return `
          <div class="omr-card omr-multi ${isCompact ? 'compact-rows' : ''}">
            <div class="omr-anchor omr-anchor-tl"></div>
            <div class="omr-anchor omr-anchor-tr"></div>
            <div class="omr-anchor omr-anchor-bl"></div>
            <div class="omr-anchor omr-anchor-br"></div>

            <div class="omr-card-header">
              <div class="omr-header-main">
                <div class="omr-header-title">
                  ${examName}
                  <small style="font-size: 0.68rem; font-weight: 700; opacity: 0.85; margin-left: 6px;">(${subjects.map(s => s.name).join(' • ')})</small>
                </div>
                <div class="omr-student-info">
                  <div><strong>Öğrenci:</strong> ${studentName}</div>
                  <div><strong>No:</strong> ${studentNo}</div>
                </div>
              </div>
              ${qrBadgeHtml}
            </div>

            <div class="omr-card-body" style="padding: 2px 0;">
              <div class="omr-multi-subjects-grid cols-${cols}">
                ${subjectsHtml}
              </div>
            </div>

            <div class="omr-card-footer">
              <span>* Her ders için 1'den başlayan soruları kurşun kalemle doldurunuz.</span>
              <span>SINIF ASİSTANI</span>
            </div>
          </div>
        `;
      }

      const cols = totalQuestions <= 15 ? 1 : (totalQuestions <= 30 ? 2 : 3);
      const questionsPerCol = Math.ceil(totalQuestions / cols);

      let columnsHtml = '';
      for (let c = 0; c < cols; c++) {
        const startQ = c * questionsPerCol + 1;
        const endQ = Math.min((c + 1) * questionsPerCol, totalQuestions);

        let colRows = '';
        for (let q = startQ; q <= endQ; q++) {
          colRows += `
            <div class="omr-q-row" data-q="${q}">
              <span class="omr-q-num">${q}</span>
              <div class="omr-q-bubbles">
                ${letters.map(l => `<span class="omr-bubble" data-opt="${l}">${l}</span>`).join('')}
              </div>
            </div>
          `;
        }

        columnsHtml += `
          <div class="omr-grid-col col-${c}">
            ${colRows}
          </div>
        `;
      }

      return `
        <div class="omr-card">
          <div class="omr-anchor omr-anchor-tl"></div>
          <div class="omr-anchor omr-anchor-tr"></div>
          <div class="omr-anchor omr-anchor-bl"></div>
          <div class="omr-anchor omr-anchor-br"></div>

          <div class="omr-card-header">
            <div class="omr-header-main">
              <div class="omr-header-title">${examName}</div>
              <div class="omr-student-info">
                <div><strong>Öğrenci:</strong> ${studentName}</div>
                <div><strong>No:</strong> ${studentNo}</div>
              </div>
            </div>
            ${qrBadgeHtml}
          </div>

          <div class="omr-card-body">
            <div class="omr-grid-container cols-${cols}">
              ${columnsHtml}
            </div>
          </div>

          <div class="omr-card-footer">
            <span>* Doğru seçeneği taşırmadan, koyu kurşun kalemle doldurunuz.</span>
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
      height: 285mm;
      max-height: 285mm;
      box-sizing: border-box;
      padding: 2mm 3mm;
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
      height: 285mm;
    }
    .omr-print-page.omr-per-page-1 .omr-card {
      height: 275mm;
      max-width: 100%;
      margin: 0 auto;
      padding: 14px 18px;
    }
    .omr-print-page.omr-per-page-2 {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4mm;
      height: 285mm;
    }
    .omr-print-page.omr-per-page-2 .omr-card {
      height: 138mm;
      max-height: 139mm;
      max-width: 100%;
      margin: 0;
      padding: 8px 12px;
    }
    .omr-print-page.omr-per-page-4 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 139mm 139mm;
      gap: 3mm;
      height: 285mm;
    }
    .omr-print-page.omr-per-page-4 .omr-card {
      height: 139mm;
      max-height: 139mm;
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
    }
    .omr-anchor {
      position: absolute;
      width: 22px;
      height: 22px;
      background-color: #000000 !important;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      z-index: 5;
    }
    .omr-anchor::before {
      content: '';
      display: block;
      width: 12px;
      height: 12px;
      background-color: #ffffff !important;
      box-sizing: border-box;
    }
    .omr-anchor::after {
      content: '';
      position: absolute;
      width: 6px;
      height: 6px;
      background-color: #000000 !important;
      box-sizing: border-box;
    }
    .omr-anchor-tl { top: 6px; left: 6px; }
    .omr-anchor-tr { top: 6px; right: 6px; }
    .omr-anchor-bl { bottom: 6px; left: 6px; }
    .omr-anchor-br { bottom: 6px; right: 6px; }
    .omr-card-header {
      margin: 2px 28px 4px 28px;
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
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 2px;
    }
    .omr-student-info {
      display: flex;
      gap: 14px;
      font-size: 11px;
    }
    .omr-card-body {
      margin: 0 28px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .omr-grid-container {
      display: grid;
      gap: 16px;
      width: 100%;
    }
    .omr-grid-container.cols-1 { grid-template-columns: 1fr; }
    .omr-grid-container.cols-2 { grid-template-columns: 1fr 1fr; }
    .omr-grid-container.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
    .omr-grid-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .omr-q-row {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 20px;
    }
    .omr-q-num {
      width: 22px;
      font-size: 11px;
      font-weight: 700;
      font-family: monospace;
      text-align: right;
    }
    .omr-q-bubbles {
      display: flex;
      gap: 4px;
    }
    .omr-bubble {
      width: 18px;
      height: 18px;
      border: 1.5px solid #000000;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 800;
      background: #ffffff;
      color: #000000;
    }
    .omr-multi-subjects-grid {
      display: grid;
      gap: 8px;
      width: 100%;
    }
    .omr-multi-subjects-grid.cols-2 { grid-template-columns: 1fr 1fr; }
    .omr-multi-subjects-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
    .omr-multi-subjects-grid.cols-4 { grid-template-columns: repeat(4, 1fr); }
    .omr-multi-subjects-grid.cols-5 { grid-template-columns: repeat(5, 1fr); }
    .omr-multi-subjects-grid.cols-6 { grid-template-columns: repeat(6, 1fr); }
    .omr-subject-block {
      border: 1px solid #000000;
      border-radius: 4px;
      padding: 4px;
      background: #fafafa;
    }
    .omr-subject-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #000000;
      padding-bottom: 2px;
      margin-bottom: 4px;
      font-size: 10px;
      font-weight: 800;
    }
    .omr-subject-name {
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .omr-subject-badge {
      font-size: 9px;
      opacity: 0.8;
    }
    .omr-subject-rows {
      display: flex;
      flex-direction: column;
      gap: 1.5px;
    }
    .omr-card-footer {
      margin: 2px 28px 4px 28px;
      border-top: 1px solid #000000;
      padding-top: 2px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      font-weight: 600;
      color: #333333;
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
    }
  };

  window.CompanionOmr = CompanionOmr;

})(window);
