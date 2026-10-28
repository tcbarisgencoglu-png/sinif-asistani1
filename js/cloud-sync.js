/**
 * Sınıf Asistanı — Bulut ve Anlık QR Senkronizasyon Motoru (cloud-sync.js)
 * Hem Masaüstü hem Öğretmen El Terminali ile %100 uyumlu.
 * Supabase Bulut Veritabanı + Çevrim Dışı Anlık QR Köprüsü.
 */

(function(window) {
  'use strict';

  const SYNC_CODE_KEY = 'sinif_sync_pair_code';
  const LAST_SYNC_KEY = 'sinif_sync_last_time';
  const STORAGE_KEY = 'sinif_asistani_data';

  const CloudSync = {
    syncCode: '',
    lastSyncTime: null,
    isSyncing: false,
    liveListenerActive: false,
    lastProcessedEventTime: null,
    processedEventIds: null,
    realtimeWs: null,
    wsHeartbeat: null,
    pollingInterval: null,
    debouncedMasterTimer: null,
    supabaseUrl: 'https://qcxpslujddythbpkaupn.supabase.co',
    anonKey: 'sb_publishable_imv0QQkNvBDzVlLY2Gogrw_NWkbAWAR',

    init() {
      if (window.SupabaseConfig) {
        this.supabaseUrl = window.SupabaseConfig.url || this.supabaseUrl;
        this.anonKey = window.SupabaseConfig.anonKey || this.anonKey;
      }
      this.loadSyncCode();

      // Masaüstü uygulamasında (akıllı tahta) canlı arka plan dinleyicisini ve otomatik bulut yüklemesini başlat
      if (window.stateManager) {
        this.harmonizePerformanceRecords();
        this.startLiveListener();
        setTimeout(() => {
          this.autoPushMasterDebounced();
        }, 1500);
        if (!this._stateChangedBound) {
          this._stateChangedBound = true;
          document.addEventListener('stateChanged', () => {
            this.autoPushMasterDebounced();
          });
        }
      }

      this.updateSyncUI();
    },

    // Masaüstü verilerini sessizce arka planda buluta hazırla (Trafik dostu 15sn debounce + özet kontrolü)
    autoPushMasterDebounced() {
      if (!window.stateManager) return;
      if (this._quotaErrorUntil && Date.now() < this._quotaErrorUntil) return;
      if (this.debouncedMasterTimer) clearTimeout(this.debouncedMasterTimer);
      this.debouncedMasterTimer = setTimeout(async () => {
        try {
          if (this._quotaErrorUntil && Date.now() < this._quotaErrorUntil) return;
          console.log('[CloudSync] Masaüstü verileri otomatik olarak buluta aktarılıyor (Kod: ' + this.syncCode + ')...');
          await this.pushMasterData(true);
        } catch (e) {
          console.warn('[CloudSync] Otomatik master veri eşitleme uyarısı:', e);
        }
      }, 15000);
    },

    // 6 Haneli Çakışmasız, Kolay Okunur Alfanümerik Kod Üretici
    // 0, O, 1, I karakterleri kafa karıştırmaması için çıkarılmıştır (32 karakter havuzu)
    // 32^6 = 1.073.741.824 (1 Milyar 73 Milyon kombinasyon) -> Çakışma ihtimali pratik olarak sıfırdır
    generateSyncCode() {
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let part = '';
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const values = new Uint8Array(6);
        crypto.getRandomValues(values);
        for (let i = 0; i < 6; i++) {
          part += chars.charAt(values[i] % chars.length);
        }
      } else {
        for (let i = 0; i < 6; i++) {
          part += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }
      return 'SA-' + part;
    },

    loadSyncCode() {
      let code = localStorage.getItem(SYNC_CODE_KEY);
      // Kod yoksa, eski placeholder ise veya 15 karakterden uzun UUID ise 6 haneli pratik koda geçir
      if (!code || code === 'SA-1453' || (code.length > 15 && code.includes('-'))) {
        code = this.generateSyncCode();
        localStorage.setItem(SYNC_CODE_KEY, code);
      }
      this.syncCode = code;
      this.lastSyncTime = localStorage.getItem(LAST_SYNC_KEY);
      return code;
    },

    regenerateSyncCode() {
      const ok = confirm(
        'Yeni bir cihaz eşleşme kodu oluşturmak istiyor musunuz?\n\n' +
        'Not: Yeni kod oluşturulduğunda, telefonunuza bu yeni 6 haneli kodu girmeniz gerekecektir.'
      );
      if (!ok) return;
      const newCode = this.generateSyncCode();
      this.setSyncCode(newCode);
      this.updateSyncUI();
      if (window.showToast) window.showToast(`Yeni eşleşme kodu oluşturuldu: ${newCode}`, 'success', 3500);
      else if (window.Companion) window.Companion.showToast(`Yeni eşleşme kodu: ${newCode}`);
      else alert('Yeni eşleşme kodu: ' + newCode);
    },

    setSyncCode(newCode) {
      if (!newCode || !newCode.trim()) return;
      let clean = newCode.trim().toUpperCase();
      // Kullanıcı SA- yazmadan sadece 6 haneyi girdiyse otomatik SA- ekle
      if (!clean.startsWith('SA-') && clean.length <= 8) {
        clean = 'SA-' + clean;
      }
      this.syncCode = clean;
      localStorage.setItem(SYNC_CODE_KEY, clean);

      if (window.stateManager) {
        this.startLiveListener(true);
        this.autoPushMasterDebounced();
      }
      return clean;
    },

    // Supabase API Çağrısı (Kota ve Trafik Korumalı)
    async request(method, path, body = null) {
      const url = `${this.supabaseUrl}/rest/v1/${path}`;
      const headers = {
        'apikey': this.anonKey,
        'Authorization': `Bearer ${this.anonKey}`,
        'Content-Type': 'application/json'
      };
      if (method === 'POST') {
        headers['Prefer'] = 'resolution=merge-duplicates';
      }
      const options = { method, headers };
      if (body) options.body = JSON.stringify(body);

      try {
        const res = await fetch(url, options);
        if (res.ok) {
          this._quotaErrorUntil = 0;
          const text = await res.text();
          return text ? JSON.parse(text) : { success: true };
        }
        const errText = await res.text();
        if (res.status === 402 || res.status === 429) {
          // Kota dolduğunda arka plan sorgularını 5 dakika durdur (Trafik kalkanı)
          this._quotaErrorUntil = Date.now() + 5 * 60 * 1000;
        }
        const customMsg = res.status === 402
          ? '402 (Bulut aylık veri trafiği kotası doldu. QR Kod ile çevrimdışı eşitleyebilir veya yeni bulut anahtarı tanımlayabilirsiniz)'
          : null;
        return { error: true, status: res.status, message: customMsg, text: errText };
      } catch (err) {
        return { error: true, message: err.message };
      }
    },

    // Sınav sonuçlarındaki mükerrer öğrenci kayıtlarını (okul no + id çift kaydı vb.) tekil öğrenci ID'sinde birleştir
    deduplicateExamResults(exam, studentsList = null) {
      if (!exam || typeof exam !== 'object') return exam;
      if (!exam.studentResults || typeof exam.studentResults !== 'object') return exam;

      let roster = Array.isArray(studentsList) && studentsList.length > 0 ? studentsList : [];
      if (roster.length === 0) {
        if (window.stateManager && window.stateManager.state && Array.isArray(window.stateManager.state.students)) {
          roster = window.stateManager.state.students;
        } else if (Array.isArray(exam.classStudents) && exam.classStudents.length > 0) {
          roster = exam.classStudents;
        } else {
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && Array.isArray(parsed.students)) roster = parsed.students;
            }
          } catch (e) {}
        }
      }

      const rawResults = exam.studentResults || {};
      const rawScores = exam.examScores || {};
      const keys = Object.keys(rawResults);
      if (keys.length === 0) return exam;

      // Önce standart (numeric olmayan / gerçek ID) anahtarları, sonra numeric anahtarları işle
      keys.sort((a, b) => {
        const aIsNum = /^\d+$/.test(String(a).trim());
        const bIsNum = /^\d+$/.test(String(b).trim());
        if (aIsNum !== bIsNum) return aIsNum ? 1 : -1;
        return 0;
      });

      const cleanResults = {};
      const cleanScores = {};
      const seenByNo = new Map();
      const seenByName = new Map();

      keys.forEach(stuKey => {
        const res = rawResults[stuKey];
        if (!res || typeof res !== 'object') return;

        const rawNo = String(res.studentNo || res.studentNumber || (/^\d+$/.test(String(stuKey).trim()) ? stuKey : '') || '').trim();
        const rawName = String(res.studentName || '').trim();
        const matched = this.resolveDesktopStudent(stuKey, rawName, rawNo, roster);

        let targetId = matched ? String(matched.id) : String(stuKey);
        const normNo = (matched && matched.number) ? String(matched.number).trim() : (rawNo && rawNo !== '-' && rawNo !== '0' ? rawNo : '');
        const normName = (matched ? `${matched.name || ''} ${matched.surname || ''}` : rawName).trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');

        // Eğer aynı okul numarası veya aynı isimle daha önce bir kayıt işlendiyse, aynı kanonik anahtarı kullan
        if (normNo && seenByNo.has(normNo)) {
          targetId = seenByNo.get(normNo);
        } else if (normName && normName !== 'öğrenci' && !normName.startsWith('öğrenci ') && !normName.startsWith('eşleştirilemedi') && seenByName.has(normName)) {
          targetId = seenByName.get(normName);
        }

        if (normNo) seenByNo.set(normNo, targetId);
        if (normName && normName !== 'öğrenci') seenByName.set(normName, targetId);

        const enrichedRes = { ...res };
        if (matched) {
          enrichedRes.studentName = `${matched.name || ''} ${matched.surname || ''}`.trim() || enrichedRes.studentName;
          if (matched.number) enrichedRes.studentNo = matched.number;
        }

        const existing = cleanResults[targetId];
        if (!existing) {
          cleanResults[targetId] = enrichedRes;
        } else {
          const prevTime = new Date(existing.updatedAt || 0).getTime() || 0;
          const nextTime = new Date(enrichedRes.updatedAt || 0).getTime() || 0;
          const winner = nextTime >= prevTime ? { ...existing, ...enrichedRes } : { ...enrichedRes, ...existing };
          if (!winner.thumbUrl && (existing.thumbUrl || enrichedRes.thumbUrl)) {
            winner.thumbUrl = existing.thumbUrl || enrichedRes.thumbUrl;
          }
          cleanResults[targetId] = winner;
        }

        const scoreVal = cleanResults[targetId].score !== undefined
          ? cleanResults[targetId].score
          : (rawScores[targetId] !== undefined ? rawScores[targetId] : rawScores[stuKey]);
        if (scoreVal !== undefined) {
          cleanScores[targetId] = scoreVal;
        }
      });

      exam.studentResults = cleanResults;
      exam.examScores = cleanScores;
      return exam;
    },

    // Buluta gönderilecek sınav nesnesinden ağır görsel/detay verilerini temizle (Egress Kota Koruması)
    slimExamForCloud(exam) {
      if (!exam || typeof exam !== 'object') return exam;
      const copy = { ...exam };
      if (copy.studentResults && typeof copy.studentResults === 'object') {
        const slimSR = {};
        Object.keys(copy.studentResults).forEach(sId => {
          const sr = copy.studentResults[sId];
          if (sr && typeof sr === 'object') {
            const { questionDetails, pdfDataUrl, thumbUrl, ...restSr } = sr;
            slimSR[sId] = restSr;
          }
        });
        copy.studentResults = slimSR;
      }
      return copy;
    },

    // İki sınav kaydını (Yerel ve Bulut) cevap anahtarı, dersler ve öğrenci sonuçları kaybolmadan akıllıca birleştir
    mergeExamObjects(localExam, cloudExam) {
      if (!localExam) return this.deduplicateExamResults(cloudExam);
      if (!cloudExam) return this.deduplicateExamResults(localExam);

      const localTime = new Date(localExam.updatedAt || localExam.createdAt || 0).getTime() || 0;
      const cloudTime = new Date(cloudExam.updatedAt || cloudExam.createdAt || 0).getTime() || 0;
      const cloudIsNewer = cloudTime >= localTime;

      const localKeyCount = Object.keys(localExam.answerKey || {}).filter(k => localExam.answerKey[k]).length;
      const cloudKeyCount = Object.keys(cloudExam.answerKey || {}).filter(k => cloudExam.answerKey[k]).length;

      let mergedAnswerKey = {};
      if (cloudIsNewer && cloudKeyCount > 0) {
        mergedAnswerKey = { ...(localExam.answerKey || {}), ...(cloudExam.answerKey || {}) };
      } else if (localKeyCount === 0 && cloudKeyCount > 0) {
        mergedAnswerKey = { ...(cloudExam.answerKey || {}) };
      } else {
        mergedAnswerKey = { ...(cloudExam.answerKey || {}), ...(localExam.answerKey || {}) };
      }

      const mergedSubjects = (cloudIsNewer && Array.isArray(cloudExam.subjects) && cloudExam.subjects.length > 0)
        ? cloudExam.subjects
        : ((Array.isArray(localExam.subjects) && localExam.subjects.length > 0) ? localExam.subjects : (cloudExam.subjects || []));

      const isMulti = !!(
        (cloudIsNewer ? cloudExam.isMultiSubject : localExam.isMultiSubject) ||
        localExam.isMultiSubject ||
        cloudExam.isMultiSubject ||
        (Array.isArray(mergedSubjects) && mergedSubjects.length > 1)
      );

      // Çoklu ders ise derslerin kendi iç answerKey alanlarını ve birleşik anahtarları senkronla
      if (isMulti && Array.isArray(mergedSubjects) && mergedSubjects.length > 0) {
        let cum = 0;
        mergedSubjects.forEach((s, idx) => {
          if (!s.id) s.id = `sub_${idx}`;
          const count = parseInt(s.questionCount, 10) || 10;
          if (!s.answerKey) s.answerKey = {};
          for (let qi = 1; qi <= count; qi++) {
            const globalQ = cum + qi;
            const val = (cloudIsNewer && cloudExam.answerKey && (cloudExam.answerKey[`${s.id}_${qi}`] || cloudExam.answerKey[`${s.name}_${qi}`] || cloudExam.answerKey[globalQ])) ||
                        mergedAnswerKey[`${s.id}_${qi}`] ||
                        mergedAnswerKey[`${s.name}_${qi}`] ||
                        s.answerKey[qi] ||
                        mergedAnswerKey[globalQ] || '';
            if (val) {
              s.answerKey[qi] = val;
              mergedAnswerKey[`${s.id}_${qi}`] = val;
              if (s.name) mergedAnswerKey[`${s.name}_${qi}`] = val;
              mergedAnswerKey[globalQ] = val;
            }
          }
          cum += count;
        });
      }

      // Silinen öğrenci sonuçlarını ve sıfırlanma durumunu dikkate al
      const localResultsObj = (localExam.studentResults && typeof localExam.studentResults === 'object') ? localExam.studentResults : {};
      const cloudResultsObj = (cloudExam.studentResults && typeof cloudExam.studentResults === 'object') ? cloudExam.studentResults : {};
      const localHasResults = Object.keys(localResultsObj).length > 0 && !localExam.allResultsCleared;
      const cloudHasResults = Object.keys(cloudResultsObj).length > 0 && !cloudExam.allResultsCleared;

      let shouldClearAll = false;
      if (localExam.allResultsCleared && cloudExam.allResultsCleared) {
        shouldClearAll = true;
      } else if ((cloudIsNewer && cloudExam.allResultsCleared && !cloudHasResults) || (!cloudIsNewer && localExam.allResultsCleared && !localHasResults)) {
        // Yalnızca diğer tarafta bu temizleme işleminden sonra okunmuş yeni sonuç yoksa sıfırla
        const otherResults = cloudExam.allResultsCleared ? localResultsObj : cloudResultsObj;
        const clearTime = cloudExam.allResultsCleared ? cloudTime : localTime;
        let hasNewerScan = false;
        Object.values(otherResults).forEach(r => {
          if (r && r.updatedAt) {
            const rt = new Date(r.updatedAt).getTime() || 0;
            if (rt >= clearTime - 5000) hasNewerScan = true;
          }
        });
        if (!hasNewerScan && !(cloudHasResults || localHasResults)) {
          shouldClearAll = true;
        }
      }

      const allDeleted = new Set([
        ...(Array.isArray(localExam.deletedStudentIds) ? localExam.deletedStudentIds : []),
        ...(Array.isArray(cloudExam.deletedStudentIds) ? cloudExam.deletedStudentIds : [])
      ]);

      // Eğer sonuçlardan biri yeniden okunmuşsa silinenler listesinden çıkar
      Object.keys(localResultsObj).forEach(k => { if (!localExam.allResultsCleared) allDeleted.delete(String(k)); });
      Object.keys(cloudResultsObj).forEach(k => { if (!cloudExam.allResultsCleared) allDeleted.delete(String(k)); });

      let mergedResults = {};
      let mergedScores = {};

      if (shouldClearAll) {
        mergedResults = {};
        mergedScores = {};
      } else {
        mergedResults = { ...localResultsObj };
        Object.keys(cloudResultsObj).forEach(k => {
          const cRes = cloudResultsObj[k];
          const lRes = mergedResults[k];
          if (!lRes) {
            mergedResults[k] = cRes;
          } else {
            const lT = new Date(lRes.updatedAt || 0).getTime() || 0;
            const cT = new Date(cRes.updatedAt || 0).getTime() || 0;
            mergedResults[k] = cT >= lT ? { ...lRes, ...cRes, thumbUrl: cRes.thumbUrl || lRes.thumbUrl } : { ...cRes, ...lRes, thumbUrl: lRes.thumbUrl || cRes.thumbUrl };
          }
        });
        mergedScores = { ...(localExam.examScores || {}), ...(cloudExam.examScores || {}) };

        allDeleted.forEach(delId => {
          delete mergedResults[delId];
          delete mergedScores[delId];
        });
      }

      const base = cloudIsNewer ? { ...localExam, ...cloudExam } : { ...cloudExam, ...localExam };
      const merged = {
        ...base,
        isMultiSubject: isMulti,
        subjects: mergedSubjects,
        answerKey: mergedAnswerKey,
        hasOpticalForm: !!(localExam.hasOpticalForm || cloudExam.hasOpticalForm || Object.keys(mergedAnswerKey).length > 0),
        choicesCount: (cloudIsNewer ? cloudExam.choicesCount : localExam.choicesCount) || cloudExam.choicesCount || localExam.choicesCount || 4,
        totalQuestions: (cloudIsNewer ? cloudExam.totalQuestions : localExam.totalQuestions) || cloudExam.totalQuestions || localExam.totalQuestions || 20,
        studentResults: mergedResults,
        examScores: mergedScores,
        deletedStudentIds: Array.from(allDeleted),
        allResultsCleared: shouldClearAll,
        updatedAt: new Date(Math.max(localTime, cloudTime, Date.now())).toISOString()
      };

      // Mükerrer öğrenci kayıtlarını tekil öğrenci kimliğinde birleştir
      this.deduplicateExamResults(merged);

      // Cevap anahtarı mevcutsa ve öğrenci sonuçları varsa puanları güncel cevap anahtarına göre tazele
      if (Object.keys(mergedAnswerKey).length > 0 && Object.keys(merged.studentResults || {}).length > 0) {
        this.recalculateMergedExamResults(merged);
      }

      return merged;
    },

    recalculateMergedExamResults(exam) {
      if (!exam || !exam.studentResults || !exam.answerKey) return;
      const answerKey = exam.answerKey || {};
      if (Object.keys(answerKey).length === 0) return;

      const totalQ = parseInt(exam.totalQuestions, 10) || 20;
      const penaltyRate = exam.wrongAffects ? (parseFloat(exam.penaltyRate) || 4) : 0;
      const isMulti = !!(exam.isMultiSubject && Array.isArray(exam.subjects) && exam.subjects.length > 0);
      if (!exam.examScores) exam.examScores = {};

      Object.keys(exam.studentResults).forEach(stuId => {
        const res = exam.studentResults[stuId];
        if (!res || !res.answers) return;
        const answers = res.answers || {};
        let correctCount = 0;
        let wrongCount = 0;
        let blankCount = 0;
        const questionDetails = [];
        const subjectBreakdown = {};

        if (isMulti) {
          let cum = 0;
          exam.subjects.forEach(subj => {
            let sCorrect = 0, sWrong = 0, sBlank = 0;
            const count = parseInt(subj.questionCount, 10) || 10;
            for (let qi = 1; qi <= count; qi++) {
              const globalQ = cum + qi;
              const marked = String(answers[`${subj.id}_${qi}`] || answers[`${subj.name}_${qi}`] || answers[globalQ] || '').trim().toUpperCase();
              const cleanMarked = marked === 'MULTIPLE' ? '' : marked;
              const correctAns = String(answerKey[`${subj.id}_${qi}`] || answerKey[`${subj.name}_${qi}`] || (subj.answerKey && subj.answerKey[qi]) || answerKey[globalQ] || '').trim().toUpperCase();
              const qd = { q: globalQ, subjId: subj.id, subjName: subj.name, subjQ: qi, marked: cleanMarked, keyAnswer: correctAns };
              if (!cleanMarked) {
                blankCount++; sBlank++; qd.isBlank = true; qd.isCorrect = false;
              } else if (correctAns && cleanMarked === correctAns) {
                correctCount++; sCorrect++; qd.isBlank = false; qd.isCorrect = true;
              } else {
                wrongCount++; sWrong++; qd.isBlank = false; qd.isCorrect = false;
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
            cum += count;
          });
        } else {
          for (let q = 1; q <= totalQ; q++) {
            const marked = String(answers[q] || answers[String(q)] || '').trim().toUpperCase();
            const cleanMarked = marked === 'MULTIPLE' ? '' : marked;
            const correctAns = String(answerKey[q] || answerKey[String(q)] || '').trim().toUpperCase();
            const qd = { q, marked: cleanMarked, keyAnswer: correctAns };
            if (!cleanMarked) {
              blankCount++; qd.isBlank = true; qd.isCorrect = false;
            } else if (correctAns && cleanMarked === correctAns) {
              correctCount++; qd.isBlank = false; qd.isCorrect = true;
            } else {
              wrongCount++; qd.isBlank = false; qd.isCorrect = false;
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
        exam.examScores[stuId] = score;
      });
    },

    // Sınavı Buluta Yükle (Masaüstü veya Telefondan)
    async pushExam(exam) {
      if (!exam || !exam.id) return { success: false, error: 'Geçersiz sınav' };

      const doPush = async () => {
        this.isSyncing = true;
        this.updateSyncUI();

        this.deduplicateExamResults(exam);
        const slimExam = this.slimExamForCloud(exam);

        const source = (window.stateManager && !window.Companion && !window.CompanionOmr) ? 'desktop' : 'terminal';
        const nowIso = new Date().toISOString();
        const examPayload = {
          ...slimExam,
          source: source,
          updatedAt: nowIso
        };

        const payload = {
          sync_code: this.syncCode,
          exam_id: String(exam.id),
          exam_name: exam.examName || 'Sınav',
          payload: examPayload,
          updated_at: nowIso
        };

        if (!this.lastSeenUpdatedAtByExamId) this.lastSeenUpdatedAtByExamId = {};
        this.lastSeenUpdatedAtByExamId[String(exam.id)] = nowIso;

        // Veritabanında eski/boş aynı exam_id satırlarının birikmesini ve eski satırın dönmesini önle
        try {
          await this.request('DELETE', `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&exam_id=eq.${encodeURIComponent(String(exam.id))}`);
        } catch (e) {}

        const res = await this.request('POST', 'teacher_sync', payload);
        this.isSyncing = false;

        if (res && !res.error) {
          this.lastSyncTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
          localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
          this.updateSyncUI();
          return { success: true };
        } else {
          this.updateSyncUI();
          return { success: false, error: res };
        }
      };

      // Seri okumada eşzamanlı DELETE + POST yarışını (race condition) önlemek için kuyruğa al
      this._pushExamQueue = (this._pushExamQueue || Promise.resolve()).then(doPush, doPush);
      return this._pushExamQueue;
    },

    // ==========================================================================
    // TÜM SINIFLAR & VERİLER İÇİN KALICI MASTER SENKRONİZASYON (MASTER_STATE)
    // ==========================================================================

    // Tüm Sınıfları, Öğrencileri, Sınavları ve Kitaplığı Buluta Gönder
    async pushMasterData(isAuto = false) {
      if (isAuto && this._quotaErrorUntil && Date.now() < this._quotaErrorUntil) {
        return { success: false, skipped: true };
      }
      this.isSyncing = true;
      this.updateSyncUI();

      let localData = {};
      if (window.stateManager && window.stateManager.state) {
        localData = window.stateManager.state;
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) localData = JSON.parse(raw);
        } catch (e) {}
      }

      const students = Array.isArray(localData.students) ? localData.students : [];
      const rawWeeklyEvaluations = Array.isArray(localData.weeklyEvaluations) ? localData.weeklyEvaluations : [];
      // Bulut trafiği (Egress) tasarrufu: Sınav sonuçlarındaki ağır questionDetails/thumbUrl alanlarını sadeleştir ve mükerrer kayıtları temizle
      const weeklyEvaluations = rawWeeklyEvaluations.map(we => {
        if (!we || typeof we !== 'object') return we;
        this.deduplicateExamResults(we, students);
        return this.slimExamForCloud(we);
      });
      const books = localData.books || { library: [], transactions: [] };
      const homework = Array.isArray(localData.homeworks) ? localData.homeworks : (Array.isArray(localData.homework) ? localData.homework : []);
      const contributions = localData.contributions || [];
      const educationLevel = localData.educationLevel || 'middle';

      // Şube listesini çıkar
      let branches = [];
      if (window.stateManager && typeof window.stateManager.getBranches === 'function') {
        branches = window.stateManager.getBranches();
      } else {
        const branchSet = new Set();
        students.forEach(s => {
          if (s.branch && s.branch.trim()) branchSet.add(s.branch.trim());
        });
        branches = Array.from(branchSet).sort();
      }

      // Davranış Kriterleri (Pozitif ve Geliştirilmeli)
      let performanceBehaviors = null;
      if (window.stateManager && typeof window.stateManager.getPerformanceBehaviors === 'function') {
        performanceBehaviors = window.stateManager.getPerformanceBehaviors();
      } else if (localData.performanceBehaviors) {
        performanceBehaviors = localData.performanceBehaviors;
      }

      // Hafif ve güvenli master payload (büyük gereksiz veriler temizlenir)
      const source = (window.stateManager && !window.Companion && !window.CompanionOmr) ? 'desktop' : 'terminal';
      const nowIso = new Date().toISOString();

      // Sınav ödülleri ve ödev performans kayıtları master_state ile gönderilmez,
      // çünkü sınav ve ödev kayıtlarından dinamik üretilirler. Yalnızca manuel davranış puanlarını aktar.
      const cleanPerformance = (Array.isArray(localData.performance) ? localData.performance : []).filter(p => {
        if (!p) return false;
        if (p.examId) return false;
        if (p.homeworkId) return false;
        if (p.reason && typeof p.reason === 'string') {
          if (/"\s*Ödevi\s*\((Tam|Yarım|Yapılmadı|Muaf)\)/i.test(p.reason)) return false;
          if (/Sınav(ı)?\s+\d+\.liği/i.test(p.reason)) return false;
        }
        return true;
      });

      const masterPayload = {
        type: 'MASTER_STATE',
        source: source,
        syncCode: this.syncCode,
        timestamp: nowIso,
        educationLevel: educationLevel,
        teacherProfile: {
          name: (localData.userProfile && localData.userProfile.name) || (window.Companion && window.Companion.profile && window.Companion.profile.name) || '',
          branch: (localData.userProfile && localData.userProfile.branch) || (window.Companion && window.Companion.profile && window.Companion.profile.branch) || ''
        },
        branches: branches,
        students: students.map(s => ({
          id: s.id,
          name: s.name,
          surname: s.surname || '',
          number: s.number || '',
          branch: s.branch || '',
          schoolLevel: s.schoolLevel || educationLevel,
          gender: s.gender || '',
          photo: '',
          hasPhoto: !!(s.photo && typeof s.photo === 'string' && s.photo.length > 50),
          parentPhone: s.parentPhone || '',
          notes: s.notes || ''
        })),
        books: {
          library: Array.isArray(books.library) ? books.library : [],
          transactions: Array.isArray(books.transactions) ? books.transactions : []
        },
        weeklyEvaluations: weeklyEvaluations,
        deletedExamIds: Array.isArray(localData.deletedExamIds) ? localData.deletedExamIds : [],
        homeworks: homework,
        contributions: contributions,
        performanceBehaviors: performanceBehaviors,
        attendance: (localData.attendance || (window.stateManager && window.stateManager.state ? window.stateManager.state.attendance : {})) || {},
        performance: cleanPerformance
      };

      // Öğrenci fotoğraflarını ayrı bir satırda (STUDENT_PHOTOS) tut ve sadece fotoğraflar değiştiğinde gönder
      const photosMap = {};
      const photoFpParts = [];
      students.forEach(s => {
        if (s && s.id && s.photo && typeof s.photo === 'string' && s.photo.length > 50) {
          photosMap[String(s.id)] = s.photo;
          photoFpParts.push(`${s.id}:${s.photo.length}:${s.photo.slice(-24)}`);
        }
      });
      const currentPhotosFingerprint = photoFpParts.join('|');
      const needPhotoPush = photoFpParts.length > 0 && (this._lastPushedPhotosFingerprint !== currentPhotosFingerprint);

      // Otomatik arka plan gönderimlerinde içerik değişmediyse gereksiz trafik (Egress) harcama
      const fingerprintObj = { ...masterPayload, timestamp: '' };
      const currentFingerprint = JSON.stringify(fingerprintObj);
      if (isAuto && this._lastPushedMasterFingerprint === currentFingerprint && !needPhotoPush) {
        this.isSyncing = false;
        this.updateSyncUI();
        return { success: true, unchanged: true };
      }

      if (needPhotoPush && source === 'desktop') {
        try {
          await this.request('DELETE', `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&exam_id=eq.STUDENT_PHOTOS`);
          const photoRes = await this.request('POST', 'teacher_sync', {
            sync_code: this.syncCode,
            exam_id: 'STUDENT_PHOTOS',
            exam_name: 'Öğrenci Fotoğrafları (Önbellek)',
            payload: { type: 'STUDENT_PHOTOS', photos: photosMap, timestamp: nowIso },
            updated_at: nowIso
          });
          if (photoRes && !photoRes.error) {
            this._lastPushedPhotosFingerprint = currentPhotosFingerprint;
            if (!this.lastSeenUpdatedAtByExamId) this.lastSeenUpdatedAtByExamId = {};
            this.lastSeenUpdatedAtByExamId['STUDENT_PHOTOS'] = nowIso;
          }
        } catch (e) {}
      }

      const record = {
        sync_code: this.syncCode,
        exam_id: 'MASTER_STATE',
        exam_name: 'Tüm Sınıflar & Veriler (Kalıcı)',
        payload: masterPayload,
        updated_at: nowIso
      };

      if (!this.lastSeenUpdatedAtByExamId) this.lastSeenUpdatedAtByExamId = {};
      this.lastSeenUpdatedAtByExamId['MASTER_STATE'] = nowIso;

      // Eski MASTER_STATE satırlarını temizle ki veritabanında eski sınavları barındıran mükerrer satır kalmasın
      try {
        await this.request('DELETE', `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&exam_id=eq.MASTER_STATE`);
      } catch (e) {}

      const res = await this.request('POST', 'teacher_sync', record);
      this.isSyncing = false;

      if (res && !res.error) {
        this._lastPushedMasterFingerprint = currentFingerprint;
        this.lastSyncTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
        this.updateSyncUI();
        return {
          success: true,
          studentCount: students.length,
          examCount: weeklyEvaluations.length,
          bookCount: (books.library || []).length,
          branchesCount: branches.length,
          perfCount: (localData.performance || []).length,
          behaviorCount: ((performanceBehaviors?.positive || []).length + (performanceBehaviors?.development || []).length)
        };
      } else {
        this.updateSyncUI();
        return { success: false, error: res };
      }
    },

    // Buluttaki Kalıcı Master Veriyi Çek (Telefonda veya Masaüstünde Kalıcı Yükle)
    async pullMasterData() {
      this.isSyncing = true;
      this.updateSyncUI();

      // Kota tasarrufu: Ağır STUDENT_PHOTOS satırını standart senkronizasyonda çekme (yalnızca eksik fotoğraf varsa aşağıda tek seferlik çekilir)
      const allRes = await this.request('GET', `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&exam_id=neq.STUDENT_PHOTOS&order=updated_at.desc&select=*`);
      this.isSyncing = false;

      if (allRes && allRes.error) {
        this.updateSyncUI();
        const msg = (allRes.message && (allRes.message.toLowerCase().includes('fetch') || allRes.message.toLowerCase().includes('network')))
          ? 'İnternet bağlantısı kurulamadı. Lütfen telefonunuzun Wi-Fi veya mobil veri bağlantısını açıp tekrar deneyin.'
          : ('Bulut bağlantı hatası: ' + (allRes.message || allRes.status || 'Sunucuya erişilemedi.'));
        return { success: false, error: msg };
      }

      let masterItem = null;
      const remoteDeletedExamIds = [];
      if (Array.isArray(allRes) && allRes.length > 0) {
        // Telefondayken öncelikle masaüstünün gönderdiği en güncel MASTER_STATE paketini tercih et
        const desktopMaster = !window.stateManager
          ? allRes.find(r => r && r.exam_id === 'MASTER_STATE' && r.payload && r.payload.source === 'desktop')
          : null;
        const anyMaster = allRes.find(r => r && r.exam_id === 'MASTER_STATE' && r.payload);
        const chosenMaster = desktopMaster || anyMaster;
        if (chosenMaster) masterItem = chosenMaster.payload;

        // Tüm MASTER_STATE ve LIVE_EVENT (exam_deleted) kayıtlarındaki silinmiş sınav ID'lerini topla
        allRes.forEach(r => {
          if (!r || !r.payload) return;
          if (r.exam_id === 'MASTER_STATE' && Array.isArray(r.payload.deletedExamIds)) {
            r.payload.deletedExamIds.forEach(id => {
              if (id) remoteDeletedExamIds.push(String(id));
            });
          } else if (r.exam_id === 'LIVE_EVENT' && r.payload.type === 'exam_deleted' && r.payload.examId) {
            remoteDeletedExamIds.push(String(r.payload.examId));
          }
        });
      }

      if (!masterItem) {
        this.updateSyncUI();
        return {
          success: false,
          error: `Bulutta "${this.syncCode}" eşleşme koduna ait ana veri paketi (MASTER_STATE) bulunamadı. Lütfen masaüstünden "Terminale Gönder" butonuna bastığınızdan emin olun.`
        };
      }

      // Yerel hafızaya güvenle birleştir (Masaüstünde stateManager.state önceliklidir)
      let localData = {};
      if (window.stateManager && window.stateManager.state) {
        localData = window.stateManager.state;
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) localData = JSON.parse(raw);
        } catch (e) {}
      }

      // 1. Öğrencileri birleştir (Kalıcı Liste) ve ID eşleme haritası oluştur
      const cloudToLocalMap = new Map();
      let missingPhotoCount = 0;
      if (Array.isArray(masterItem.students)) {
        if (!localData.students) localData.students = [];
        masterItem.students.forEach(cloudStudent => {
          const cNameNorm = `${cloudStudent.name || ''} ${cloudStudent.surname || ''}`.trim().toLocaleLowerCase('tr-TR');
          const cNum = String(cloudStudent.number || '').trim();

          const idx = localData.students.findIndex(ls => {
            if (String(ls.id) === String(cloudStudent.id)) return true;
            const lNum = String(ls.number || '').trim();
            if (cNum && lNum && cNum === lNum) return true;
            const lNameNorm = `${ls.name || ''} ${ls.surname || ''}`.trim().toLocaleLowerCase('tr-TR');
            return cNameNorm && lNameNorm && cNameNorm === lNameNorm;
          });

          if (idx >= 0) {
            const existing = localData.students[idx];
            // El terminalinde masaüstünün kanonik öğrenci ID'sini baz al ki sınav/davranış eşleşmelerinde çift kayıt oluşmasın
            const isMobileFromDesktop = !window.stateManager && masterItem.source === 'desktop' && cloudStudent.id;
            const canonicalId = isMobileFromDesktop ? cloudStudent.id : existing.id;
            cloudToLocalMap.set(String(cloudStudent.id), canonicalId);
            if (existing.id) cloudToLocalMap.set(String(existing.id), canonicalId);

            // Fotoğraf koruması: Önce hafızadaki (stateManager.state), sonra mevcut öğrenci fotoğrafını kontrol et
            const memStudent = window.stateManager?.state?.students?.find(s => String(s.id) === String(canonicalId) || (s.number && String(s.number) === String(existing.number)));
            const existingPhoto = (memStudent && memStudent.photo && memStudent.photo.length > 50) ? memStudent.photo : ((existing.photo && existing.photo.length > 50) ? existing.photo : '');
            const newPhoto = (cloudStudent.photo && typeof cloudStudent.photo === 'string' && cloudStudent.photo.length > 50) ? cloudStudent.photo : '';
            const finalPhoto = newPhoto || existingPhoto || '';

            if (!finalPhoto && cloudStudent.hasPhoto) {
              missingPhotoCount++;
            }

            localData.students[idx] = isMobileFromDesktop
              ? {
                  ...existing,
                  ...cloudStudent,
                  id: canonicalId,
                  photo: finalPhoto
                }
              : {
                  ...cloudStudent,
                  ...existing,
                  id: canonicalId,
                  photo: finalPhoto
                };
          } else {
            cloudToLocalMap.set(String(cloudStudent.id), cloudStudent.id);
            if ((!cloudStudent.photo || cloudStudent.photo.length <= 50) && cloudStudent.hasPhoto) {
              missingPhotoCount++;
            }
            localData.students.push(cloudStudent);
          }
        });
      }

      // Yalnızca cihazda fotoğrafı eksik olan öğrenci varsa STUDENT_PHOTOS paketini tek seferlik çek
      if (missingPhotoCount > 0) {
        try {
          const photoRows = await this.request(
            'GET',
            `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&exam_id=eq.STUDENT_PHOTOS&limit=1&select=*`
          );
          const remotePhotos = (Array.isArray(photoRows) && photoRows[0] && photoRows[0].payload && photoRows[0].payload.photos)
            ? photoRows[0].payload.photos
            : null;
          if (remotePhotos && typeof remotePhotos === 'object' && Array.isArray(localData.students)) {
            localData.students.forEach(stu => {
              if (stu && (!stu.photo || stu.photo.length <= 50)) {
                const p = remotePhotos[String(stu.id)];
                if (p && typeof p === 'string' && p.length > 50) {
                  stu.photo = p;
                }
              }
            });
          }
        } catch (e) {}
      }

      // 2. Kitaplığı birleştir
      if (masterItem.books) {
        if (!localData.books) localData.books = { library: [], transactions: [] };
        if (Array.isArray(masterItem.books.library)) {
          const existingBookIds = new Set((localData.books.library || []).map(b => String(b.id || b.isbn)));
          masterItem.books.library.forEach(b => {
            if (!existingBookIds.has(String(b.id || b.isbn))) {
              localData.books.library.push(b);
            }
          });
        }
        if (Array.isArray(masterItem.books.transactions)) {
          if (!Array.isArray(localData.books.transactions) || !window.stateManager) {
            localData.books.transactions = masterItem.books.transactions;
          } else {
            const txMap = new Map();
            localData.books.transactions.forEach(t => {
              if (t && t.id) txMap.set(String(t.id), { ...t });
            });
            masterItem.books.transactions.forEach(t => {
              if (!t || !t.id) return;
              const mappedStuId = cloudToLocalMap.get(String(t.studentId)) || t.studentId;
              const cloudTx = { ...t, studentId: mappedStuId };
              const prev = txMap.get(String(t.id));
              if (!prev) {
                txMap.set(String(t.id), cloudTx);
              } else {
                const status = (prev.status === 'returned' || cloudTx.status === 'returned') ? 'returned' : cloudTx.status;
                const returnDate = cloudTx.returnDate || prev.returnDate || null;
                txMap.set(String(t.id), { ...prev, ...cloudTx, status, returnDate });
              }
            });
            localData.books.transactions = Array.from(txMap.values());
          }
        }
      }

      // 3. Sınavları birleştir (Silinen sınavları temizle, yerel taranan sonuçları ve buluttaki güncel cevap anahtarını koru)
      if (!Array.isArray(localData.deletedExamIds)) localData.deletedExamIds = [];
      remoteDeletedExamIds.forEach(dId => {
        if (dId && !localData.deletedExamIds.includes(String(dId))) {
          localData.deletedExamIds.push(String(dId));
        }
      });
      if (Array.isArray(masterItem.deletedExamIds)) {
        masterItem.deletedExamIds.forEach(dId => {
          if (dId && !localData.deletedExamIds.includes(String(dId))) {
            localData.deletedExamIds.push(String(dId));
          }
        });
      }
      const deletedExamSet = new Set(localData.deletedExamIds.map(String));

      if (Array.isArray(masterItem.weeklyEvaluations)) {
        if (!localData.weeklyEvaluations) localData.weeklyEvaluations = [];
        const validMasterExams = masterItem.weeklyEvaluations.filter(ce => ce && ce.id && !deletedExamSet.has(String(ce.id)));
        const masterExamIdSet = new Set(validMasterExams.map(ce => String(ce.id)));

        // Eğer El Terminalindeysek ve paket Masaüstünden geldiyse, Masaüstünde silinmiş sınavları Terminalden de kaldır
        if (!window.stateManager && masterItem.source === 'desktop') {
          localData.weeklyEvaluations = localData.weeklyEvaluations.filter(le => le && le.id && masterExamIdSet.has(String(le.id)));
        } else {
          localData.weeklyEvaluations = localData.weeklyEvaluations.filter(le => le && le.id && !deletedExamSet.has(String(le.id)));
        }

        validMasterExams.forEach(cloudExam => {
          this.deduplicateExamResults(cloudExam, localData.students);
          const eIdx = localData.weeklyEvaluations.findIndex(le => String(le.id) === String(cloudExam.id));
          if (eIdx >= 0) {
            const localExam = localData.weeklyEvaluations[eIdx];
            const mergedEx = this.mergeExamObjects(localExam, cloudExam);
            this.deduplicateExamResults(mergedEx, localData.students);
            localData.weeklyEvaluations[eIdx] = mergedEx;
          } else {
            localData.weeklyEvaluations.unshift(cloudExam);
          }
        });
      }

      // 4. Ödev ve Davranış verilerini birleştir (Masaüstü öğrenci kimliklerine uyarla)
      if (Array.isArray(masterItem.homework) && masterItem.homework.length > 0) {
        localData.homework = masterItem.homework;
      }
      if (Array.isArray(masterItem.performance) && masterItem.performance.length > 0) {
        if (!localData.performance) localData.performance = [];
        const existingPerfIds = new Set(localData.performance.map(p => String(p.id)));
        const makePerfKey = (perf, sId) => `${sId || perf.studentId}_${String(perf.date || '').slice(0, 10)}_${String(perf.reason || '').trim().toLowerCase()}_${perf.point || 0}`;
        const existingPerfKeys = new Set((localData.performance || []).map(p => makePerfKey(p, p.studentId)));
        const activeDesktopWeek = (window.stateManager && typeof window.stateManager.getSelectedWeek === 'function')
          ? window.stateManager.getSelectedWeek()
          : (window.getISOWeek ? window.getISOWeek(new Date()) : '');

        masterItem.performance.forEach(p => {
          if (!p) return;
          // Sınav dereceleri ve ödev performans kayıtları sınav ve ödev üzerinden dinamik üretilir, mükerrer eklemeyi önle
          if (p.examId || (p.reason && typeof p.reason === 'string' && /Sınav(ı)?\s+\d+\.liği/i.test(p.reason))) {
            return;
          }
          if (p.homeworkId || (typeof p.reason === 'string' && /" Ödevi \((Tam|Yarım|Yapılmadı|Muaf)\)$/.test(p.reason.trim()))) {
            return;
          }

          // ID'yi yerel öğrenciye uyarla
          let targetStuId = p.studentId;
          if (cloudToLocalMap.has(String(p.studentId))) {
            targetStuId = cloudToLocalMap.get(String(p.studentId));
          } else {
            const matched = this.resolveDesktopStudent(p.studentId, p.studentName, p.studentNumber, localData.students);
            if (matched) targetStuId = matched.id;
          }
          p.studentId = targetStuId;

          if (!p.weekId) {
            p.weekId = (p.date && window.getISOWeek) ? window.getISOWeek(p.date) : activeDesktopWeek;
          }

          const perfKey = makePerfKey(p, targetStuId);
          if (!existingPerfIds.has(String(p.id)) && !existingPerfKeys.has(perfKey)) {
            localData.performance.push(p);
            existingPerfIds.add(String(p.id));
            existingPerfKeys.add(perfKey);
          }
        });

        // Ayrıca yerel hafızadaki unmapped performans kayıtlarını da onar!
        localData.performance.forEach(lp => {
          if (!lp) return;
          if (cloudToLocalMap.has(String(lp.studentId))) {
            lp.studentId = cloudToLocalMap.get(String(lp.studentId));
          } else {
            const matched = this.resolveDesktopStudent(lp.studentId, lp.studentName, lp.studentNumber, localData.students);
            if (matched) lp.studentId = matched.id;
          }
          if (!lp.weekId && !lp.homeworkId) {
            lp.weekId = (lp.date && window.getISOWeek) ? window.getISOWeek(lp.date) : activeDesktopWeek;
          }
        });
      }
      if (Array.isArray(masterItem.contributions)) {
        if (!Array.isArray(localData.contributions) || !window.stateManager) {
          localData.contributions = masterItem.contributions;
        } else {
          const cMap = new Map();
          localData.contributions.forEach(c => {
            if (c && c.id) cMap.set(String(c.id), { ...c, records: { ...(c.records || {}) } });
          });
          masterItem.contributions.forEach(c => {
            if (!c || !c.id) return;
            const prev = cMap.get(String(c.id));
            if (!prev) {
              cMap.set(String(c.id), { ...c, records: { ...(c.records || {}) } });
            } else {
              cMap.set(String(c.id), {
                ...prev,
                ...c,
                records: { ...(prev.records || {}), ...(c.records || {}) }
              });
            }
          });
          localData.contributions = Array.from(cMap.values());
        }
      }
      if (masterItem.educationLevel) {
        localData.educationLevel = masterItem.educationLevel;
      }

      // 5. Davranış Kriterleri (Pozitif & Geliştirilmeli)
      if (masterItem.performanceBehaviors) {
        localData.performanceBehaviors = masterItem.performanceBehaviors;
      }

      // 6. Yoklama Verileri (Devamsızlık Kayıtları)
      if (masterItem.attendance && typeof masterItem.attendance === 'object') {
        if (!localData.attendance || typeof localData.attendance !== 'object' || !window.stateManager) {
          localData.attendance = masterItem.attendance;
        } else {
          for (const [dateKey, stuArr] of Object.entries(masterItem.attendance)) {
            if (Array.isArray(stuArr)) {
              const mappedArr = stuArr.map(sid => cloudToLocalMap.get(String(sid)) || sid);
              const existingArr = Array.isArray(localData.attendance[dateKey]) ? localData.attendance[dateKey] : [];
              localData.attendance[dateKey] = Array.from(new Set([...existingArr, ...mappedArr]));
            }
          }
        }
      }

      // 7. Ödev Kayıtları (Tüm Şubeler & Günler - Yerel ödevleri silmeden birleştir)
      if (masterItem.homeworks || masterItem.homework) {
        const hwList = masterItem.homeworks || masterItem.homework || [];
        if (!Array.isArray(localData.homeworks) || !window.stateManager) {
          localData.homeworks = hwList;
          localData.homework = hwList;
        } else {
          const isPrimaryLevel = localData.educationLevel === 'primary';
          const hwKey = (hw) => `${hw.dueDate || ''}__${isPrimaryLevel ? '' : String(hw.branch || '').trim()}`;
          const hwMap = new Map();

          localData.homeworks.forEach(hw => {
            if (!hw || !hw.dueDate) return;
            hwMap.set(hwKey(hw), { ...hw, status: { ...(hw.status || {}) } });
          });

          hwList.forEach(hw => {
            if (!hw || !hw.dueDate) return;
            const mappedStatus = {};
            if (hw.status && typeof hw.status === 'object') {
              for (const [sId, stVal] of Object.entries(hw.status)) {
                const targetId = cloudToLocalMap.get(String(sId)) || sId;
                mappedStatus[targetId] = stVal;
              }
            }
            const k = hwKey(hw);
            if (!hwMap.has(k)) {
              hwMap.set(k, { ...hw, status: mappedStatus });
            } else {
              const prev = hwMap.get(k);
              hwMap.set(k, {
                ...prev,
                ...hw,
                id: prev.id || hw.id,
                title: hw.title || prev.title,
                description: hw.description || prev.description,
                status: { ...(prev.status || {}), ...mappedStatus }
              });
            }
          });

          const mergedHwList = Array.from(hwMap.values());
          localData.homeworks = mergedHwList;
          localData.homework = mergedHwList;
        }
      }

      if (typeof window.reconcileHomeworkStateObject === 'function') {
        window.reconcileHomeworkStateObject(localData);
      }

      // Masaüstü StateManager varsa güvenli şekilde güncelle (5MB localStorage kotasına takılmadan IndexedDB ve Tauri diske yazar)
      if (window.stateManager) {
        window.stateManager.state = typeof window.wrapState === 'function'
          ? window.wrapState(localData, true)
          : localData;
        if (typeof window.stateManager.saveState === 'function') {
          window.stateManager.saveState('Kalıcı El Terminali Verileri Eşitlendi', true);
        }
        document.dispatchEvent(new CustomEvent('stateChanged'));
      } else {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
        } catch (e) {}
      }

      // Mobil Companion varsa profil ve şubeleri otomatik uyarla
      if (window.Companion) {
        const uniqueSections = [...new Set((localData.students || []).map(s => {
          const b = s.branch || s.section || '';
          return b.replace('/', '-').trim().toUpperCase();
        }).filter(Boolean))].sort();

        if (!window.Companion.profile) window.Companion.profile = {};
        if (uniqueSections.length > 0) {
          window.Companion.profile.sections = uniqueSections;
          if (!window.Companion.profile.sections.includes(window.Companion.activeSection)) {
            window.Companion.activeSection = uniqueSections[0];
          }
        }
        if (masterItem.teacherProfile?.name && (!window.Companion.profile.name || window.Companion.profile.name === 'Öğretmen')) {
          window.Companion.profile.name = masterItem.teacherProfile.name;
        }
        if (masterItem.teacherProfile?.branch && (!window.Companion.profile.branch || window.Companion.profile.branch === 'Branş Seçilmedi')) {
          window.Companion.profile.branch = masterItem.teacherProfile.branch;
        }
        window.Companion.profile.isComplete = true;
        localStorage.setItem('sinif_companion_profile', JSON.stringify(window.Companion.profile));
        localStorage.setItem('sinif_companion_active_section', window.Companion.activeSection);

        window.Companion.updateHeader();
        window.Companion.renderSectionBar();
      }

      // Mobil Davranış Modülü varsa anında tazele
      if (window.CompanionBehavior && typeof window.CompanionBehavior.init === 'function') {
        window.CompanionBehavior.init();
      }

      this.lastSyncTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
      this.updateSyncUI();

      if (window.CompanionOmr && typeof window.CompanionOmr.ensureActiveExam === 'function') {
        window.CompanionOmr.ensureActiveExam();
        window.CompanionOmr.renderHub();
      }
      if (typeof window.renderWeeklyEvaluations === 'function') {
        window.renderWeeklyEvaluations();
      }

      return {
        success: true,
        studentCount: (localData.students || []).length,
        examCount: (localData.weeklyEvaluations || []).length,
        bookCount: (localData.books?.library || []).length,
        perfCount: (localData.performance || []).length,
        branches: masterItem.branches || []
      };
    },

    // Hızlı ve Yalnızca Kitap Verilerini Masaüstünden Çek
    async pullBooksData() {
      if (!this.syncCode) {
        return { success: false, error: 'Eşleşme kodu bulunamadı.' };
      }

      this.isSyncing = true;
      this.updateSyncUI();

      try {
        const res = await this.request('GET', 'teacher_sync', null, {
          sync_code: `eq.${this.syncCode}`,
          exam_id: 'eq.MASTER_STATE',
          select: 'payload,updated_at'
        });

        this.isSyncing = false;
        this.updateSyncUI();

        if (!res || !Array.isArray(res) || res.length === 0) {
          return { success: false, error: 'Masaüstünden kitap verisi bulunamadı.' };
        }

        const masterItem = res[0].payload;
        if (!masterItem || !masterItem.books) {
          return { success: false, error: 'Bulutta kitaplık kaydı bulunamadı.' };
        }

        const raw = localStorage.getItem(STORAGE_KEY);
        let localData = raw ? JSON.parse(raw) : {};

        localData.books = {
          library: Array.isArray(masterItem.books.library) ? masterItem.books.library : [],
          transactions: Array.isArray(masterItem.books.transactions) ? masterItem.books.transactions : []
        };

        if (window.stateManager) {
          window.stateManager.state.books = localData.books;
          if (typeof window.stateManager.saveState === 'function') {
            window.stateManager.saveState('Bulut Kitaplığı Eşitlendi', true);
          }
          document.dispatchEvent(new CustomEvent('stateChanged'));
        } else {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
          } catch (e) {}
        }

        const libraryCount = (localData.books.library || []).filter(b => !b.isDeleted).length;
        const activeLoans = (localData.books.transactions || []).filter(t => t.status === 'reading').length;

        return {
          success: true,
          libraryCount,
          activeLoans
        };
      } catch (err) {
        this.isSyncing = false;
        this.updateSyncUI();
        return { success: false, error: 'Kitap verisi çekilemedi: ' + err.message };
      }
    },

    // Masaüstü Ayarlar Buton Aksiyonu: Tüm Sınıf & Verileri Terminale Gönder
    async pushMasterDataToTerminal() {
      const btn = document.getElementById('btn-push-master-to-terminal');
      const statusEl = document.getElementById('desktop-sync-status-msg');
      const textEl = document.getElementById('desktop-sync-status-text');

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>Buluta Yükleniyor...</span>';
      }

      const res = await this.pushMasterData();

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="upload-cloud" style="width: 18px; height: 18px;"></i><span>Terminale Gönder (Kalıcı Yükle)</span>';
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      }

      if (res.success) {
        const msg = `✅ Başarılı! ${res.studentCount} öğrenci, ${res.examCount} sınav, ${res.perfCount || 0} davranış puanı ve kriterleri el terminaline aktarıldı.`;
        if (statusEl && textEl) {
          statusEl.style.display = 'flex';
          textEl.textContent = msg;
        }
        if (window.showToast) window.showToast(msg, 'success');
        else alert(msg);
      } else {
        const err = 'Bulut bağlantısı kurulamadı. İnternet bağlantınızı kontrol edin.';
        if (window.showToast) window.showToast(err, 'danger');
        else alert(err);
      }
    },

    // Masaüstü Ayarlar Buton Aksiyonu: Terminalden Okunan Sonuçları Çek
    async pullMasterDataFromTerminal() {
      const btn = document.getElementById('btn-pull-master-from-terminal');
      const statusEl = document.getElementById('desktop-sync-status-msg');
      const textEl = document.getElementById('desktop-sync-status-text');

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>Sonuçlar Çekiliyor...</span>';
      }

      // Önce genel öğrenci/ödev/performans verilerini, ardından en güncel sınav sonuçlarını çek
      const masterRes = await this.pullMasterData();
      const examRes = await this.pullExams();

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="download-cloud" style="width: 18px; height: 18px;"></i><span>Terminalden Çek (Sonuçları Al)</span>';
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      }

      if (examRes.success || masterRes.success) {
        const count = (examRes.count || 0) + (masterRes.studentCount || 0);
        const msg = `✅ Başarılı! Terminalden okunan sınav sonuçları ve öğrenci verileri masaüstüne aktarıldı.`;
        if (statusEl && textEl) {
          statusEl.style.display = 'flex';
          textEl.textContent = msg;
        }
        if (window.showToast) window.showToast(msg, 'success');
        else alert(msg);
      } else {
        const err = 'Terminalden yeni sonuç bulunamadı veya bağlantı kurulamadı.';
        if (window.showToast) window.showToast(err, 'warning');
        else alert(err);
      }
    },

    // =========================================================================
    // CANLI OTOMATİK ENTEGRASYON (REALTIME AUTO-SYNC)
    // Telefondan girilen puan ve optik sınavları masaüstüne anında yansıtır.
    // =========================================================================

    // 1. Telefondan Anlık Canlı Davranış Puanı Gönder
    async pushLivePerformance(record, studentName, studentNumber) {
      if (!this.syncCode || !record) return;

      const payload = {
        type: 'performance',
        source: 'terminal',
        record: record,
        studentName: studentName || record.studentName || 'Öğrenci',
        studentNumber: studentNumber || record.studentNumber || '',
        timestamp: new Date().toISOString()
      };

      // Bekletmeden arka planda fırlat
      this.pushLiveEvent('performance', payload);

      // Ana master veriyi de 2.5 saniye sonra sessizce güncelle (debounce)
      this.scheduleDebouncedMasterPush();
    },

    // 1b. Telefondan Anlık Canlı Toplu Davranış Puanı Gönder
    async pushLiveBatchPerformance(records, behaviorName, point) {
      if (!this.syncCode || !Array.isArray(records) || records.length === 0) return;

      const payload = {
        type: 'batch_performance',
        source: 'terminal',
        records: records,
        behaviorName: behaviorName || 'Toplu Davranış',
        point: point != null ? point : 0,
        count: records.length,
        timestamp: new Date().toISOString()
      };

      this.pushLiveEvent('batch_performance', payload);
      this.scheduleDebouncedMasterPush();
    },

    // 1c. Telefondan Anlık Canlı Yoklama Gönder
    async pushLiveAttendance(date, absentStudentIds, presentStudentIds, branch) {
      if (!this.syncCode) return;

      const payload = {
        type: 'attendance',
        source: 'terminal',
        date: date || (window.formatLocalDate ? window.formatLocalDate() : new Date().toISOString().split('T')[0]),
        branch: branch || '',
        absentStudentIds: Array.isArray(absentStudentIds) ? absentStudentIds : [],
        presentStudentIds: Array.isArray(presentStudentIds) ? presentStudentIds : [],
        timestamp: new Date().toISOString()
      };

      this.pushLiveEvent('attendance', payload);
      this.scheduleDebouncedMasterPush();
    },

    // 1d. Telefondan Anlık Canlı Günlük Ödev Kontrolü Gönder
    async pushLiveHomework(date, branch, title, statusMap) {
      if (!this.syncCode) return;

      const payload = {
        type: 'homework',
        source: 'terminal',
        date: date || (window.formatLocalDate ? window.formatLocalDate() : new Date().toISOString().split('T')[0]),
        branch: branch || '',
        title: title || `${date} Ödevi`,
        statusMap: statusMap || {},
        timestamp: new Date().toISOString()
      };

      this.pushLiveEvent('homework', payload);
      this.scheduleDebouncedMasterPush();
    },

    // 1e. Telefondan Anlık Canlı Kitap Ödünç / İade İşlemi Gönder
    async pushLiveBookTransaction(action, studentId, bookId, transactionId, extra = {}) {
      if (!this.syncCode) return;

      const payload = {
        type: 'book_transaction',
        source: 'terminal',
        action: action, // 'borrow' veya 'return'
        studentId: String(studentId),
        bookId: String(bookId),
        transactionId: transactionId || null,
        returnDate: extra.returnDate || (window.formatLocalDate ? window.formatLocalDate() : new Date().toISOString().split('T')[0]),
        borrowDate: extra.borrowDate || (window.formatLocalDate ? window.formatLocalDate() : new Date().toISOString().split('T')[0]),
        studentName: extra.studentName || '',
        bookTitle: extra.bookTitle || '',
        timestamp: new Date().toISOString()
      };

      this.pushLiveEvent('book_transaction', payload);
      this.scheduleDebouncedMasterPush();
    },

    // 2. Telefondan Anlık Canlı Optik Sınav Sonucu Gönder
    async pushLiveOmr(examId, examName, studentId, studentName, scanResult) {
      if (!this.syncCode || !examId) return;

      let slimScan = scanResult;
      if (scanResult && typeof scanResult === 'object') {
        slimScan = { ...scanResult };
        delete slimScan.questionDetails;
        delete slimScan.pdfDataUrl;
        delete slimScan.thumbUrl;
      }

      const payload = {
        type: 'omr',
        source: 'terminal',
        examId: String(examId),
        examName: examName || 'Sınav',
        studentId: String(studentId),
        studentName: studentName || 'Öğrenci',
        scanResult: slimScan,
        timestamp: new Date().toISOString()
      };

      this.pushLiveEvent('omr', payload);
    },

    // 2b. Anlık Canlı Yeni Sınav Gönder (Masaüstü veya Terminal)
    async pushLiveExamCreated(exam, source = (window.stateManager ? 'desktop' : 'terminal')) {
      if (!this.syncCode || !exam) return;

      const payload = {
        type: 'exam_created',
        source: source,
        exam: this.slimExamForCloud(exam),
        timestamp: new Date().toISOString()
      };

      this.pushLiveEvent('exam_created', payload);
    },

    // 2c. Anlık Canlı Sınav Sonuçları Paketi Gönder (Masaüstü veya Terminal)
    async pushLiveExamResults(exam, source = (window.stateManager ? 'desktop' : 'terminal')) {
      if (!this.syncCode || !exam) return;

      const payload = {
        type: 'exam_results',
        source: source,
        exam: this.slimExamForCloud(exam),
        timestamp: new Date().toISOString()
      };

      this.pushLiveEvent('exam_results', payload);
    },

    // 2d. Anlık Canlı Sınav Silme Olayı Gönder (Masaüstü veya Terminal)
    async pushLiveExamDeleted(examId, examName, source = (window.stateManager ? 'desktop' : 'terminal')) {
      if (!this.syncCode || !examId) return;

      const payload = {
        type: 'exam_deleted',
        source: source,
        examId: String(examId),
        examName: examName || 'Sınav',
        timestamp: new Date().toISOString()
      };

      this.pushLiveEvent('exam_deleted', payload);

      // Veritabanındaki satırı da temizle ve MASTER_STATE paketini de hemen güncelle
      try {
        await this.request('DELETE', `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&exam_id=eq.${encodeURIComponent(examId)}`);
      } catch (e) {}

      this.scheduleDebouncedMasterPush();
    },

    // 2e. Anlık Canlı Optik Sonuç Silme Gönder (Terminal veya Masaüstü)
    async pushLiveOmrDelete(examId, examName, studentId, studentName, studentNo, source = (window.stateManager ? 'desktop' : 'terminal')) {
      if (!this.syncCode || !examId) return;

      const payload = {
        type: 'omr_delete',
        source: source,
        examId: String(examId),
        examName: examName || 'Sınav',
        studentId: String(studentId),
        studentName: studentName || 'Öğrenci',
        studentNo: studentNo ? String(studentNo) : '',
        timestamp: new Date().toISOString()
      };

      this.pushLiveEvent('omr_delete', payload);
    },

    // 2f. Anlık Canlı Tüm Optik Sonuçları Sıfırlama Gönder (Terminal veya Masaüstü)
    async pushLiveOmrClearAll(examId, examName, source = (window.stateManager ? 'desktop' : 'terminal')) {
      if (!this.syncCode || !examId) return;

      const payload = {
        type: 'omr_clear_all',
        source: source,
        examId: String(examId),
        examName: examName || 'Sınav',
        timestamp: new Date().toISOString()
      };

      this.pushLiveEvent('omr_clear_all', payload);
    },

    // 3. Genel Canlı Olay Gönderimi (Supabase'e fırlat)
    async pushLiveEvent(eventType, eventPayload) {
      if (!this.syncCode) return;

      const nowIso = new Date().toISOString();
      const record = {
        sync_code: this.syncCode,
        exam_id: 'LIVE_EVENT',
        exam_name: eventType === 'performance' ? 'Canlı Puan' : (eventType === 'omr' ? 'Optik Okuma' : 'Canlı Olay'),
        payload: eventPayload,
        updated_at: nowIso
      };

      if (!this.lastSeenUpdatedAtByExamId) this.lastSeenUpdatedAtByExamId = {};
      this.lastSeenUpdatedAtByExamId['LIVE_EVENT'] = nowIso;

      const doSend = async () => {
        try {
          await this.request(
            'DELETE',
            `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&exam_id=eq.LIVE_EVENT`
          );
          await this.request('POST', 'teacher_sync', record);
        } catch (e) {
          console.warn('Canlı olay gönderme hatası:', e);
        }
      };

      this._liveEventQueue = (this._liveEventQueue || Promise.resolve()).then(doSend, doSend);
      return this._liveEventQueue;
    },

    // 4. Arka Planda Master Eşitlemeyi Gecikmeli Gönder (Debounce)
    scheduleDebouncedMasterPush() {
      if (this._quotaErrorUntil && Date.now() < this._quotaErrorUntil) return;
      if (this.debouncedMasterTimer) clearTimeout(this.debouncedMasterTimer);
      this.debouncedMasterTimer = setTimeout(async () => {
        try {
          await this.pushMasterData(true);
        } catch (e) {}
      }, 8000);
    },

    // 5. Canlı Dinleyiciyi Başlat (WebSockets + Polling Fallback)
    startLiveListener(forceRestart = false) {
      if (!window.stateManager && !window.Companion && !window.CompanionOmr) return;
      if (this.liveListenerActive && !forceRestart) return;

      this.liveListenerActive = true;
      this.lastProcessedEventTime = new Date().toISOString();
      this.lastSeenUpdatedAtByExamId = this.lastSeenUpdatedAtByExamId || {};
      this.initialPollDone = false;
      if (!this.processedEventIds) this.processedEventIds = new Set();

      // A) Supabase Realtime WebSocket Bağlantısı
      this.connectRealtimeWebSocket();

      // B) Dayanıklı Kalp Atışı / Yedek Polling (Kota dostu: Her 8 saniyede bir hafif başlık kontrolü)
      if (this.pollingInterval) clearInterval(this.pollingInterval);
      setTimeout(() => this.checkLiveUpdates(), 1200);
      this.pollingInterval = setInterval(() => {
        this.checkLiveUpdates();
      }, 8000);

      this.updateSyncUI();
    },

    // Supabase Realtime WebSocket Bağlantısı
    connectRealtimeWebSocket() {
      try {
        if (!this.supabaseUrl || !this.anonKey || !this.syncCode) return;
        const wsHost = new URL(this.supabaseUrl).host;
        const wsUrl = `wss://${wsHost}/realtime/v1/websocket?apikey=${this.anonKey}&vsn=1.0.0`;

        if (this.realtimeWs) {
          try { this.realtimeWs.close(); } catch (e) {}
        }

        const ws = new WebSocket(wsUrl);
        this.realtimeWs = ws;

        ws.onopen = () => {
          // Supabase Realtime Phoenix topic'e katıl
          const topic = `realtime:public:teacher_sync:sync_code=eq.${this.syncCode}`;
          ws.send(JSON.stringify({
            topic: topic,
            event: 'phx_join',
            payload: {},
            ref: '1'
          }));

          if (this.wsHeartbeat) clearInterval(this.wsHeartbeat);
          this.wsHeartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: 'hb' }));
            }
          }, 25000);
        };

        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.event === 'INSERT' || msg.event === 'UPDATE' || msg.event === 'broadcast') {
              const rec = msg.payload && (msg.payload.record || msg.payload.new || msg.payload);
              if (rec) {
                if (rec.exam_id && rec.updated_at) {
                  if (!this.lastSeenUpdatedAtByExamId) this.lastSeenUpdatedAtByExamId = {};
                  this.lastSeenUpdatedAtByExamId[rec.exam_id] = rec.updated_at;
                }
                this.handleIncomingLiveRecord(rec);
              }
            }
          } catch (err) {}
        };

        ws.onerror = () => {};
        ws.onclose = () => {
          if (this.liveListenerActive) {
            setTimeout(() => this.connectRealtimeWebSocket(), 10000);
          }
        };
      } catch (e) {
        console.warn('Realtime WS hatası:', e);
      }
    },

    // Yedek Kontrolcü (Kota Dostu Heartbeat Polling - Önce sadece ~150 byte meta veri çeker, değişen varsa içeriği indirir)
    async checkLiveUpdates() {
      if (!this.syncCode) return;
      if (this._quotaErrorUntil && Date.now() < this._quotaErrorUntil) return;
      if (!window.stateManager && !window.Companion && !window.CompanionOmr) return;

      try {
        // 1. Adım: Sadece exam_id ve updated_at çek (~150 Byte - %99.9 Egress tasarrufu)
        const metaRes = await this.request(
          'GET',
          `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&order=updated_at.desc&limit=30&select=exam_id,updated_at`
        );
        if (Array.isArray(metaRes) && metaRes.length > 0) {
          if (!this.lastSeenUpdatedAtByExamId) this.lastSeenUpdatedAtByExamId = {};

          // Her exam_id için yalnızca en güncel (ilk gelen) kaydı baz al
          const latestMetaList = [];
          const seenExamIds = new Set();
          metaRes.forEach(rec => {
            if (!rec || !rec.exam_id || !rec.updated_at) return;
            if (!seenExamIds.has(rec.exam_id)) {
              seenExamIds.add(rec.exam_id);
              latestMetaList.push(rec);
            }
          });

          if (!this.initialPollDone) {
            this.initialPollDone = true;
            const initialChangedIds = [];
            const localExams = (window.stateManager && window.stateManager.state && Array.isArray(window.stateManager.state.weeklyEvaluations))
              ? window.stateManager.state.weeklyEvaluations
              : [];

            latestMetaList.forEach(rec => {
              const prevSeen = this.lastSeenUpdatedAtByExamId[rec.exam_id];
              this.lastSeenUpdatedAtByExamId[rec.exam_id] = rec.updated_at;

              // Masaüstündeysek ve buluttaki sınav kaydı yerel sınavdan daha yeniyse (veya yerelde yoksa) açılışta hemen çek
              if (window.stateManager && String(rec.exam_id).startsWith('exam_')) {
                const localEx = localExams.find(e => String(e.id) === String(rec.exam_id));
                const cloudTime = new Date(rec.updated_at).getTime() || 0;
                const localTime = localEx ? (new Date(localEx.updatedAt || localEx.createdAt || 0).getTime() || 0) : 0;
                if (!localEx || cloudTime > localTime || (prevSeen && prevSeen !== rec.updated_at)) {
                  initialChangedIds.push(rec.exam_id);
                }
              } else if (window.stateManager && rec.exam_id === 'LIVE_EVENT') {
                initialChangedIds.push('LIVE_EVENT');
              }
            });

            for (const changedExamId of initialChangedIds.reverse()) {
              const fullRes = await this.request(
                'GET',
                `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&exam_id=eq.${encodeURIComponent(changedExamId)}&order=updated_at.desc&limit=1&select=*`
              );
              if (Array.isArray(fullRes) && fullRes[0]) {
                this.handleIncomingLiveRecord(fullRes[0]);
              }
            }
            return;
          }

          // 2. Adım: Sadece en güncel updated_at değeri gerçekten değişen kayıtları belirle
          const orderedMeta = [...latestMetaList].reverse();
          const changedIds = [];
          orderedMeta.forEach(rec => {
            if (!rec || !rec.exam_id || !rec.updated_at) return;
            const prevTime = this.lastSeenUpdatedAtByExamId[rec.exam_id];
            if (prevTime !== rec.updated_at) {
              this.lastSeenUpdatedAtByExamId[rec.exam_id] = rec.updated_at;
              // STUDENT_PHOTOS yalnızca eksik fotoğraf olduğunda pullMasterData içinde çekilir
              if (rec.exam_id === 'STUDENT_PHOTOS') return;
              // Masaüstü uygulaması MASTER_STATE'in kendisini zaten üretir, geri indirmesine gerek yok
              if (window.stateManager && rec.exam_id === 'MASTER_STATE') return;
              changedIds.push(rec.exam_id);
            }
          });

          // 3. Adım: Yalnızca değişen kayıtların EN GÜNCEL tam verisini (payload) çek
          for (const changedExamId of changedIds) {
            const fullRes = await this.request(
              'GET',
              `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&exam_id=eq.${encodeURIComponent(changedExamId)}&order=updated_at.desc&limit=1&select=*`
            );
            if (Array.isArray(fullRes) && fullRes[0]) {
              this.handleIncomingLiveRecord(fullRes[0]);
            }
          }
        } else if (Array.isArray(metaRes)) {
          this.initialPollDone = true;
        }
      } catch (e) {}
    },

    // Akıllı Öğrenci Eşleme (ID, Okul Numarası veya İsimle masaüstü öğrencisini bul)
    resolveDesktopStudent(stuId, stuName, stuNumber, studentsList) {
      if (!Array.isArray(studentsList) || studentsList.length === 0) return null;
      
      const sIdStr = String(stuId || '').trim();
      const sNumStr = String(stuNumber || '').trim();
      const sNameStr = String(stuName || '').trim().toLocaleLowerCase('tr-TR');

      // 1. Direct ID match
      if (sIdStr && !sIdStr.startsWith('temp_')) {
        const found = studentsList.find(s => String(s.id).trim() === sIdStr);
        if (found) return found;
      }

      // 2. School number match (Doğrudan ve Sayısal Eşleme)
      if (sNumStr && sNumStr !== '-' && sNumStr !== '......' && sNumStr !== '0') {
        const found = studentsList.find(s => {
          const lNum = String(s.number || '').trim();
          return lNum === sNumStr || (parseInt(lNum, 10) === parseInt(sNumStr, 10) && parseInt(sNumStr, 10) > 0);
        });
        if (found) return found;
      }

      // 3. Name & Surname EXACT match (Tam Eşleşme - Kısmi includes YASAKLANDI)
      if (sNameStr && sNameStr !== 'öğrenci' && !sNameStr.startsWith('öğrenci #') && !sNameStr.startsWith('eşleştirilemedi') && !sNameStr.startsWith('form #')) {
        const cleanName = sNameStr.replace(/\s+/g, ' ');
        const found = studentsList.find(s => {
          const sFullName = `${s.name || ''} ${s.surname || ''}`.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');
          return sFullName === cleanName;
        });
        if (found) return found;
      }

      return null;
    },

    // Masaüstündeki eski/farklı ID ile kaydedilmiş performans kayıtlarını öğrenci listesiyle eşle
    harmonizePerformanceRecords() {
      if (!window.stateManager || !window.stateManager.state) return;
      const state = window.stateManager.state;
      const students = state.students || [];
      const perfs = state.performance || [];
      if (!Array.isArray(students) || !Array.isArray(perfs) || perfs.length === 0) return;

      const activeWeek = (typeof window.stateManager.getSelectedWeek === 'function')
        ? window.stateManager.getSelectedWeek()
        : (window.getISOWeek ? window.getISOWeek(new Date()) : '');

      let changed = false;
      const validStudentIds = new Set(students.map(s => String(s.id)));

      perfs.forEach(p => {
        if (!p) return;
        // Öğrenci ID'si masaüstündeki öğrencilerde yoksa akıllı eşleştirmeyle doğru öğrenciye bağla
        if (!validStudentIds.has(String(p.studentId))) {
          const matched = this.resolveDesktopStudent(p.studentId, p.studentName, p.studentNumber, students);
          if (matched) {
            p.studentId = matched.id;
            if (!p.studentNumber) p.studentNumber = matched.number || '';
            if (!p.studentName) p.studentName = `${matched.name} ${matched.surname || ''}`.trim();
            changed = true;
          }
        }
        // weekId yoksa kaydın kendi tarihinden (ödev teslim tarihi veya işlem tarihi) haftayı bul
        if (!p.weekId) {
          if (p.homeworkId && Array.isArray(state.homeworks)) {
            const hw = state.homeworks.find(h => h.id === p.homeworkId);
            if (hw && hw.dueDate && window.getISOWeek) {
              p.weekId = window.getISOWeek(hw.dueDate);
              changed = true;
            }
          } else if (p.date && window.getISOWeek) {
            p.weekId = window.getISOWeek(p.date);
            changed = true;
          } else {
            p.weekId = activeWeek;
            changed = true;
          }
        }
      });

      // Ödev kayıtları ile performans tablosundaki ödev puanlarını birebir senkronize et
      if (typeof window.stateManager.recalculateAllHomeworkPoints === 'function') {
        if (window.stateManager.recalculateAllHomeworkPoints(false)) {
          changed = true;
        }
      }

      if (changed) {
        window.stateManager.saveState('Performans kayıtları masaüstü öğrenci kimlikleriyle senkronize edildi');
        document.dispatchEvent(new CustomEvent('stateChanged'));
        if (typeof window.renderDashboard === 'function') window.renderDashboard();
      }
    },

    // Gelen Canlı Olayı Uygun Cihaza (Masaüstü veya Terminal) Entegre Et
    handleIncomingLiveRecord(record) {
      if (!record) return;

      const payload = record.payload;
      if (!payload) return;

      const eventKey = `${record.updated_at}_${record.exam_id}_${payload.timestamp || ''}`;
      if (this.processedEventIds && this.processedEventIds.has(eventKey)) return;
      if (!this.processedEventIds) this.processedEventIds = new Set();
      this.processedEventIds.add(eventKey);

      if (this.processedEventIds.size > 200) {
        const first = this.processedEventIds.values().next().value;
        this.processedEventIds.delete(first);
      }

      // 1. MASAÜSTÜ UYGULAMASI (Akıllı Tahta)
      if (window.stateManager && window.stateManager.state) {
        if (payload.source === 'desktop') return; // Kendisinin ürettiği olayları atla
        this.handleDesktopIncomingLiveRecord(record, payload);
      }

      // 2. ÖĞRETMEN EL TERMİNALİ (Mobil)
      else if (window.CompanionOmr || window.Companion) {
        if (payload.source === 'terminal') return; // Kendisinin ürettiği olayları atla
        this.handleMobileIncomingLiveRecord(record, payload);
      }
    },

    // Masaüstü Canlı Olay İşleyicisi
    handleDesktopIncomingLiveRecord(record, payload) {
      // 1. CANLI DAVRANIŞ PUANI ENTEGRASYONU
      if (record.exam_id === 'LIVE_EVENT' && payload.type === 'performance' && payload.record) {
        const perf = payload.record;
        let studentName = payload.studentName || perf.studentName || 'Öğrenci';
        const studentNumber = payload.studentNumber || perf.studentNumber || '';

        if (!Array.isArray(window.stateManager.state.performance)) {
          window.stateManager.state.performance = [];
        }

        // Akıllı Öğrenci Eşleme: Masaüstündeki gerçek öğrenci ID'sini bul ve ata
        const allStudents = window.stateManager.state.students || [];
        const matchedStudent = this.resolveDesktopStudent(perf.studentId, studentName, studentNumber, allStudents);
        
        if (matchedStudent) {
          perf.studentId = matchedStudent.id; // Masaüstündeki gerçek ID
          studentName = `${matchedStudent.name} ${matchedStudent.surname || ''}`.trim();
          perf.studentName = studentName;
          perf.studentNumber = matchedStudent.number || '';
        }

        // Hafta Kodu: Masaüstünün seçili haftasını bağla (haftalık tabloda görünmesi için kritik!)
        const activeDesktopWeek = (typeof window.stateManager.getSelectedWeek === 'function')
          ? window.stateManager.getSelectedWeek()
          : (window.getISOWeek ? window.getISOWeek(perf.date || new Date()) : '');

        if (!perf.weekId || perf.weekId !== activeDesktopWeek) {
          perf.weekId = activeDesktopWeek;
        }

        const exists = window.stateManager.state.performance.some(p => String(p.id) === String(perf.id));
        if (!exists) {
          window.stateManager.state.performance.push(perf);
          window.stateManager.saveState(`El Terminalinden Canlı Puan: ${studentName}`);

          // Global etkinlik ve arayüz tazeleme
          document.dispatchEvent(new CustomEvent('stateChanged'));
          if (typeof window.renderDashboard === 'function') {
            window.renderDashboard();
          }

          // Ses ve Bildirim
          this.playDesktopLiveChime();
          const sign = perf.point >= 0 ? '+' : '';
          const toastMsg = `📱 El Terminalinden Canlı: ${studentName} (${sign}${perf.point} Puan - ${perf.reason})`;
          if (window.showToast) {
            window.showToast(toastMsg, 'success');
          }
        }
      }

      // 1b. CANLI TOPLU DAVRANIŞ PUANI ENTEGRASYONU
      else if (record.exam_id === 'LIVE_EVENT' && payload.type === 'batch_performance' && Array.isArray(payload.records)) {
        if (!Array.isArray(window.stateManager.state.performance)) {
          window.stateManager.state.performance = [];
        }
        const allStudents = window.stateManager.state.students || [];
        const activeDesktopWeek = (typeof window.stateManager.getSelectedWeek === 'function')
          ? window.stateManager.getSelectedWeek()
          : (window.getISOWeek ? window.getISOWeek(new Date()) : '');

        let addedCount = 0;
        payload.records.forEach(perf => {
          const matchedStudent = this.resolveDesktopStudent(perf.studentId, perf.studentName, perf.studentNumber, allStudents);
          if (matchedStudent) {
            perf.studentId = matchedStudent.id;
            perf.studentName = `${matchedStudent.name} ${matchedStudent.surname || ''}`.trim();
            perf.studentNumber = matchedStudent.number || '';
          }
          if (!perf.weekId || perf.weekId !== activeDesktopWeek) {
            perf.weekId = activeDesktopWeek;
          }
          const exists = window.stateManager.state.performance.some(p => String(p.id) === String(perf.id));
          if (!exists) {
            window.stateManager.state.performance.push(perf);
            addedCount++;
          }
        });

        if (addedCount > 0) {
          window.stateManager.saveState(`El Terminalinden Toplu Puan: ${payload.behaviorName}`);
          document.dispatchEvent(new CustomEvent('stateChanged'));
          if (typeof window.renderDashboard === 'function') {
            window.renderDashboard();
          }
          this.playDesktopLiveChime();
          const sign = payload.point >= 0 ? '+' : '';
          const toastMsg = `📱 El Terminalinden Canlı: ${addedCount} öğrenciye "${payload.behaviorName}" (${sign}${payload.point} Puan) verildi.`;
          if (window.showToast) {
            window.showToast(toastMsg, 'success');
          }
        }
      }

      // 1c. CANLI YOKLAMA ENTEGRASYONU
      else if (record.exam_id === 'LIVE_EVENT' && payload.type === 'attendance') {
        const date = payload.date || (window.formatLocalDate ? window.formatLocalDate() : new Date().toISOString().split('T')[0]);
        if (!window.stateManager.state.attendance) {
          window.stateManager.state.attendance = {};
        }
        if (!Array.isArray(window.stateManager.state.attendance[date])) {
          window.stateManager.state.attendance[date] = [];
        }

        const allStudents = window.stateManager.state.students || [];
        const absentIncoming = new Set((payload.absentStudentIds || []).map(id => String(id)));
        const presentIncoming = new Set((payload.presentStudentIds || []).map(id => String(id)));

        // Gelen ID'leri masaüstü gerçek öğrenci ID'leriyle eşleştir
        const desktopAbsentIds = new Set();
        const desktopPresentIds = new Set();

        allStudents.forEach(st => {
          const sId = String(st.id);
          const sNum = String(st.number || '').trim();
          if (absentIncoming.has(sId) || (sNum && absentIncoming.has(sNum))) {
            desktopAbsentIds.add(sId);
          } else if (presentIncoming.has(sId) || (sNum && presentIncoming.has(sNum))) {
            desktopPresentIds.add(sId);
          }
        });

        // Mevcut listeden gelen "var" olanları çıkar
        window.stateManager.state.attendance[date] = window.stateManager.state.attendance[date].filter(id => !desktopPresentIds.has(String(id)));

        // Gelen "yok" olanları ekle
        desktopAbsentIds.forEach(id => {
          if (!window.stateManager.state.attendance[date].includes(id)) {
            window.stateManager.state.attendance[date].push(id);
          }
        });

        window.stateManager.saveState(`El Terminalinden Canlı Yoklama: ${payload.branch || ''}`);
        document.dispatchEvent(new CustomEvent('stateChanged'));
        if (typeof window.renderDashboard === 'function') {
          window.renderDashboard();
        }
        this.playDesktopLiveChime();
        const toastMsg = `📱 El Terminalinden Canlı Yoklama: ${payload.branch || 'Sınıf'} (${desktopAbsentIds.size} Devamsız)`;
        if (window.showToast) {
          window.showToast(toastMsg, 'info');
        }
      }

      // 1d. CANLI ÖDEV KONTROLÜ ENTEGRASYONU
      else if (record.exam_id === 'LIVE_EVENT' && payload.type === 'homework') {
        const dateStr = payload.date || (window.formatLocalDate ? window.formatLocalDate() : new Date().toISOString().split('T')[0]);
        const branch = payload.branch || '';
        const title = payload.title || `${dateStr} Ödevi`;
        const statusMap = payload.statusMap || {};

        if (!Array.isArray(window.stateManager.state.homeworks)) {
          window.stateManager.state.homeworks = [];
        }

        const isPrimary = window.stateManager.state.educationLevel === 'primary';
        let hw = window.stateManager.state.homeworks.find(h => {
          const matchDate = h.dueDate === dateStr;
          const matchBranch = isPrimary || !branch || !h.branch || h.branch === branch || h.branch === 'all';
          return matchDate && matchBranch;
        });

        const allStudents = window.stateManager.state.students || [];
        const fallbackBranch = (allStudents.length > 0 && allStudents[0].branch) ? allStudents[0].branch : '';
        const effectiveBranch = isPrimary ? '' : (branch || fallbackBranch);

        if (!hw) {
          hw = window.stateManager.addHomework({
            title: title,
            description: 'El terminalinden günlük kontrol',
            dueDate: dateStr,
            branch: effectiveBranch
          });
        } else {
          if (title && hw.title !== title) hw.title = title;
          if (!hw.branch && effectiveBranch) hw.branch = effectiveBranch;
        }

        for (const stuId in statusMap) {
          const status = statusMap[stuId];
          const matched = this.resolveDesktopStudent(stuId, '', '', allStudents);
          const targetStudentId = matched ? matched.id : stuId;
          window.stateManager.updateHomeworkStatus(hw.id, targetStudentId, status);
        }

        if (typeof window.stateManager.recalculateAllHomeworkPoints === 'function') {
          window.stateManager.recalculateAllHomeworkPoints(false);
        }

        window.stateManager.saveState(`El Terminalinden Canlı Ödev: ${branch || ''}`);
        document.dispatchEvent(new CustomEvent('stateChanged'));
        if (typeof window.renderDashboard === 'function') {
          window.renderDashboard();
        }
        if (typeof window.renderHomeworkMatrix === 'function') {
          window.renderHomeworkMatrix();
        }
        this.playDesktopLiveChime();
        const toastMsg = `📱 El Terminalinden Canlı Ödev: ${branch || 'Sınıf'} (${title})`;
        if (window.showToast) {
          window.showToast(toastMsg, 'success');
        }
      }

      // 1e. CANLI KİTAP ÖDÜNÇ & İADE ENTEGRASYONU
      else if (record.exam_id === 'LIVE_EVENT' && payload.type === 'book_transaction') {
        const allStudents = window.stateManager.state.students || [];
        const matched = this.resolveDesktopStudent(payload.studentId, payload.studentName, '', allStudents);
        const targetStudentId = matched ? matched.id : payload.studentId;
        const studentName = matched ? `${matched.name} ${matched.surname || ''}`.trim() : (payload.studentName || 'Öğrenci');

        if (!window.stateManager.state.books) {
          window.stateManager.state.books = { library: [], transactions: [] };
        }
        if (!Array.isArray(window.stateManager.state.books.transactions)) {
          window.stateManager.state.books.transactions = [];
        }

        const library = window.stateManager.state.books.library || [];
        const targetBook = library.find(b => String(b.id) === String(payload.bookId));
        const bookTitle = targetBook ? targetBook.title : (payload.bookTitle || 'Kitap');

        if (payload.action === 'borrow') {
          window.stateManager.borrowBook(targetStudentId, payload.bookId, payload.borrowDate);
          this.playDesktopLiveChime();
          if (window.showToast) {
            window.showToast(`📖 El Terminalinden: ${studentName} '${bookTitle}' kitabını ödünç aldı.`, 'info');
          }
        } else if (payload.action === 'return') {
          const tx = window.stateManager.state.books.transactions.find(
            t => String(t.studentId) === String(targetStudentId) && String(t.bookId) === String(payload.bookId) && t.status === 'reading'
          );
          if (tx) {
            window.stateManager.returnBook(tx.id, payload.returnDate);
          }
          this.playDesktopLiveChime();
          if (window.showToast) {
            window.showToast(`✅ El Terminalinden: ${studentName} '${bookTitle}' kitabını teslim etti.`, 'success');
          }
        }

        document.dispatchEvent(new CustomEvent('stateChanged'));
        if (typeof window.renderDashboard === 'function') window.renderDashboard();
      }

      // 2. CANLI OPTİK SINAV SONUCU ENTEGRASYONU
      else if (record.exam_id === 'LIVE_EVENT' && payload.type === 'omr') {
        const examId = String(payload.examId);
        let studentId = String(payload.studentId);
        let studentName = payload.studentName || 'Öğrenci';
        const examName = payload.examName || 'Sınav';
        const scanRes = payload.scanResult;

        if (Array.isArray(window.stateManager.state.weeklyEvaluations)) {
          const targetExam = window.stateManager.state.weeklyEvaluations.find(e => String(e.id) === examId);
          if (targetExam) {
            if (!targetExam.studentResults) targetExam.studentResults = {};
            if (!targetExam.examScores) targetExam.examScores = {};

            // Öğrenci ID eşleşmesi (Tekil kanonik ID ile kaydet - çift kaydı önle)
            const allStudents = window.stateManager.state.students || [];
            const studentNumRaw = scanRes ? (scanRes.studentNo || scanRes.studentNumber || '') : '';
            const matched = this.resolveDesktopStudent(studentId, studentName, studentNumRaw, allStudents);
            if (matched) {
              studentId = String(matched.id);
              studentName = `${matched.name} ${matched.surname || ''}`.trim();
              if (scanRes && typeof scanRes === 'object') {
                scanRes.studentId = studentId;
                scanRes.studentName = studentName;
                if (matched.number) scanRes.studentNo = matched.number;
              }
            }

            targetExam.studentResults[studentId] = scanRes;
            if (scanRes && scanRes.score !== undefined) {
              targetExam.examScores[studentId] = scanRes.score;
            }

            // Eski numara/isim tabanlı çift anahtarları temizle
            this.deduplicateExamResults(targetExam, allStudents);

            // Yeni okuma yapıldığında silinenler listesinden çıkar
            if (Array.isArray(targetExam.deletedStudentIds)) {
              targetExam.deletedStudentIds = targetExam.deletedStudentIds.filter(id => id !== studentId && (!matched || id !== String(matched.number)));
            }
            targetExam.allResultsCleared = false;
            targetExam.updatedAt = new Date().toISOString();

            if (typeof window.stateManager.saveExam === 'function') {
              window.stateManager.saveExam(targetExam);
            } else {
              window.stateManager.saveState(`El Terminalinden Optik Sonuç: ${studentName}`);
            }
            document.dispatchEvent(new CustomEvent('stateChanged'));

            if (window.activeWeeklyExam && (String(window.activeWeeklyExam.id) === examId || String(window.activeWeeklyExam.id) === String(targetExam.id))) {
              window.activeWeeklyExam = targetExam;
              if (typeof window.openActiveExam === 'function') {
                window.openActiveExam(targetExam);
              } else if (typeof window.renderActiveExamTable === 'function') {
                window.renderActiveExamTable();
              }
            }

            if (typeof window.renderWeeklyEvaluations === 'function') {
              window.renderWeeklyEvaluations();
            }
            if (typeof window.renderExamsList === 'function') {
              window.renderExamsList();
            }

            this.playDesktopLiveChime();
            const toastMsg = `📱 El Terminalinden Optik Okundu: ${studentName} (${examName})`;
            if (window.showToast) {
              window.showToast(toastMsg, 'success');
            }
          }
        }
      }

      // 2b. CANLI OPTİK SONUÇ SİLİNDİ ENTEGRASYONU (El Terminalinden tek öğrenci sonucu silinince)
      else if (record.exam_id === 'LIVE_EVENT' && payload.type === 'omr_delete') {
        const examId = String(payload.examId);
        const studentId = String(payload.studentId);
        const studentNo = payload.studentNo ? String(payload.studentNo) : '';
        let studentName = payload.studentName || 'Öğrenci';
        const examName = payload.examName || 'Sınav';

        this.lastLiveDeleteTime = Date.now();

        if (Array.isArray(window.stateManager.state.weeklyEvaluations)) {
          const targetExam = window.stateManager.state.weeklyEvaluations.find(e => String(e.id) === examId);
          if (targetExam) {
            const allStudents = window.stateManager.state.students || [];
            const matched = this.resolveDesktopStudent(studentId, studentName, studentNo, allStudents);
            if (matched) {
              studentName = `${matched.name} ${matched.surname || ''}`.trim();
            }

            const keysToDelete = new Set([studentId]);
            if (studentNo) keysToDelete.add(studentNo);
            if (matched) {
              if (matched.id) keysToDelete.add(String(matched.id));
              if (matched.number) keysToDelete.add(String(matched.number));
            }

            if (targetExam.studentResults) {
              Object.keys(targetExam.studentResults).forEach(k => {
                const r = targetExam.studentResults[k];
                if (r) {
                  if (matched && String(r.studentId) === String(matched.id)) keysToDelete.add(k);
                  if (matched && matched.number && String(r.studentNo) === String(matched.number)) keysToDelete.add(k);
                  if (studentNo && String(r.studentNo) === studentNo) keysToDelete.add(k);
                  if (studentName && r.studentName && r.studentName.trim().toLowerCase() === studentName.toLowerCase()) keysToDelete.add(k);
                }
              });

              keysToDelete.forEach(k => {
                delete targetExam.studentResults[k];
              });
            }

            if (targetExam.examScores) {
              keysToDelete.forEach(k => {
                delete targetExam.examScores[k];
              });
            }

            if (!Array.isArray(targetExam.deletedStudentIds)) targetExam.deletedStudentIds = [];
            keysToDelete.forEach(k => {
              if (!targetExam.deletedStudentIds.includes(k)) targetExam.deletedStudentIds.push(k);
            });

            targetExam.updatedAt = new Date().toISOString();
            window.stateManager.saveState(`El Terminalinden Optik Sonuç Silindi: ${studentName}`);
            document.dispatchEvent(new CustomEvent('stateChanged'));

            if (window.activeWeeklyExam && (String(window.activeWeeklyExam.id) === examId || String(window.activeWeeklyExam.id) === String(targetExam.id))) {
              window.activeWeeklyExam = targetExam;
              if (typeof window.openActiveExam === 'function') {
                window.openActiveExam(targetExam);
              } else if (typeof window.renderActiveExamTable === 'function') {
                window.renderActiveExamTable();
              }
            }

            if (typeof window.renderWeeklyEvaluations === 'function') {
              window.renderWeeklyEvaluations();
            }
            if (typeof window.renderExamsList === 'function') {
              window.renderExamsList();
            }

            this.playDesktopLiveChime();
            const toastMsg = `📱 El Terminalinden: ${studentName} optik sonucu silindi`;
            if (window.showToast) {
              window.showToast(toastMsg, 'info');
            }
          }
        }
      }

      // 2c. CANLI TÜM OPTİK SONUÇLAR SIFIRLANDI ENTEGRASYONU
      else if (record.exam_id === 'LIVE_EVENT' && payload.type === 'omr_clear_all') {
        const examId = String(payload.examId);
        const examName = payload.examName || 'Sınav';

        this.lastLiveDeleteTime = Date.now();

        if (Array.isArray(window.stateManager.state.weeklyEvaluations)) {
          const targetExam = window.stateManager.state.weeklyEvaluations.find(e => String(e.id) === examId);
          if (targetExam) {
            targetExam.studentResults = {};
            targetExam.examScores = {};
            targetExam.allResultsCleared = true;
            targetExam.updatedAt = new Date().toISOString();
            window.stateManager.saveState(`El Terminalinden Tüm Sonuçlar Sıfırlandı: ${examName}`);
            document.dispatchEvent(new CustomEvent('stateChanged'));

            if (window.activeWeeklyExam && (String(window.activeWeeklyExam.id) === examId || String(window.activeWeeklyExam.id) === String(targetExam.id))) {
              window.activeWeeklyExam = targetExam;
              if (typeof window.openActiveExam === 'function') {
                window.openActiveExam(targetExam);
              } else if (typeof window.renderActiveExamTable === 'function') {
                window.renderActiveExamTable();
              }
            }

            if (typeof window.renderWeeklyEvaluations === 'function') {
              window.renderWeeklyEvaluations();
            }
            if (typeof window.renderExamsList === 'function') {
              window.renderExamsList();
            }

            this.playDesktopLiveChime();
            const toastMsg = `📱 El Terminalinden: "${examName}" tüm okuma sonuçları sıfırlandı`;
            if (window.showToast) {
              window.showToast(toastMsg, 'info');
            }
          }
        }
      }

      // 3. CANLI YENİ SINAV, CEVAP ANAHTARI VEYA TOPLU SINAV SONUÇLARI ENTEGRASYONU
      else if (
        (record.exam_id && record.exam_id !== 'LIVE_EVENT' && record.exam_id !== 'MASTER_STATE') ||
        (record.exam_id === 'LIVE_EVENT' && (payload.type === 'exam_created' || payload.type === 'exam_results'))
      ) {
        const examData = (payload.type === 'exam_created' || payload.type === 'exam_results') ? (payload.exam || payload) : payload;
        if (examData && examData.id) {
          if (!Array.isArray(window.stateManager.state.weeklyEvaluations)) {
            window.stateManager.state.weeklyEvaluations = [];
          }
          const allStudents = window.stateManager.state.students || [];
          const existingIdx = window.stateManager.state.weeklyEvaluations.findIndex(e => String(e.id) === String(examData.id));
          const prevExam = existingIdx >= 0 ? window.stateManager.state.weeklyEvaluations[existingIdx] : null;
          const prevKeyCount = prevExam ? Object.keys(prevExam.answerKey || {}).filter(k => prevExam.answerKey[k]).length : 0;
          const prevKeyStr = prevExam ? JSON.stringify(prevExam.answerKey || {}) : '{}';
          const prevResultsCount = prevExam ? Object.keys(prevExam.studentResults || {}).length : 0;

          // Öğrenci ID'lerini masaüstündeki öğrencilerle eşle (Tekil kanonik ID ile - çift kaydı önle)
          this.deduplicateExamResults(examData, allStudents);

          let finalExam = examData;
          if (existingIdx >= 0) {
            finalExam = this.mergeExamObjects(window.stateManager.state.weeklyEvaluations[existingIdx], examData);
          } else {
            if (examData.answerKey && Object.keys(examData.answerKey).length > 0) {
              examData.hasOpticalForm = true;
            }
          }
          this.deduplicateExamResults(finalExam, allStudents);
          window.stateManager.saveExam(finalExam);

          const isNew = existingIdx < 0;
          const newKeyCount = Object.keys(finalExam.answerKey || {}).filter(k => finalExam.answerKey[k]).length;
          const newKeyStr = JSON.stringify(finalExam.answerKey || {});
          const keyChanged = (prevKeyStr !== newKeyStr) && (newKeyCount > 0);
          const newResultsCount = Object.keys(finalExam.studentResults || {}).length;

          document.dispatchEvent(new CustomEvent('stateChanged'));

          if (window.activeWeeklyExam && String(window.activeWeeklyExam.id) === String(finalExam.id)) {
            window.activeWeeklyExam = finalExam;
            if (typeof window.openActiveExam === 'function') {
              window.openActiveExam(finalExam);
            } else if (typeof window.renderActiveExamTable === 'function') {
              window.renderActiveExamTable();
            }
            const akModal = document.getElementById('modal-edit-exam-answer-key');
            if (akModal && akModal.classList.contains('active') && typeof window.openDesktopAnswerKeyModal === 'function') {
              window.openDesktopAnswerKeyModal();
            }
          }

          if (typeof window.renderWeeklyEvaluations === 'function') {
            window.renderWeeklyEvaluations();
          }
          if (typeof window.renderExamsList === 'function') {
            window.renderExamsList();
          }

          // Eğer az önce canlı silme olayı gösterildiyse mükerrer/yanıltıcı toast gösterme
          const recentlyDeleted = this.lastLiveDeleteTime && (Date.now() - this.lastLiveDeleteTime < 4000);
          if (!recentlyDeleted) {
            let toastMsg = '';
            if (isNew) {
              toastMsg = `📱 El Terminalinden Canlı: "${finalExam.examName}" oluşturuldu`;
            } else if (keyChanged && (!prevExam || prevKeyCount === 0)) {
              toastMsg = `📱 El Terminalinden Canlı: "${finalExam.examName}" cevap anahtarı masaüstüne aktarıldı`;
            } else if (keyChanged) {
              toastMsg = `📱 El Terminalinden Canlı: "${finalExam.examName}" cevap anahtarı güncellendi`;
            } else if (newResultsCount !== prevResultsCount) {
              if (newResultsCount < prevResultsCount) {
                toastMsg = `📱 El Terminalinden Canlı: "${finalExam.examName}" sonuçları güncellendi`;
              } else {
                toastMsg = `📱 El Terminalinden Canlı: "${finalExam.examName}" (${newResultsCount} öğrenci sonucu aktarıldı)`;
              }
            }

            if (toastMsg) {
              this.playDesktopLiveChime();
              if (window.showToast) {
                window.showToast(toastMsg, 'success');
              }
            }
          }
        }
      }

      // 4. CANLI SINAV SİLİNDİ ENTEGRASYONU (Terminalden silinince masaüstünden de sil)
      else if (record.exam_id === 'LIVE_EVENT' && payload.type === 'exam_deleted') {
        const examId = String(payload.examId);
        const examName = payload.examName || 'Sınav';
        window.stateManager.deleteExam(examId);
        document.dispatchEvent(new CustomEvent('stateChanged'));
        if (typeof window.renderWeeklyEvaluations === 'function') {
          window.renderWeeklyEvaluations();
        }
        this.playDesktopLiveChime();
        if (window.showToast) {
          window.showToast(`📱 El Terminalinden: "${examName}" silindi`, 'info');
        }
      }

      // 5. MASTER_STATE GÜNCELLEMESİ (Terminalden toplu fırlatılmışsa)
      else if (record.exam_id === 'MASTER_STATE' && payload && payload.source !== 'desktop') {
        let stateModified = false;
        let addedPerf = 0;
        let updatedExams = 0;
        const allStudents = window.stateManager.state.students || [];

        if (Array.isArray(payload.weeklyEvaluations) && payload.weeklyEvaluations.length > 0) {
          if (!Array.isArray(window.stateManager.state.weeklyEvaluations)) {
            window.stateManager.state.weeklyEvaluations = [];
          }
          payload.weeklyEvaluations.forEach(cloudExam => {
            if (!cloudExam || !cloudExam.id) return;
            const eIdx = window.stateManager.state.weeklyEvaluations.findIndex(e => String(e.id) === String(cloudExam.id));
            if (eIdx >= 0) {
              const prevKeyJson = JSON.stringify(window.stateManager.state.weeklyEvaluations[eIdx].answerKey || {});
              const merged = this.mergeExamObjects(window.stateManager.state.weeklyEvaluations[eIdx], cloudExam);
              const nextKeyJson = JSON.stringify(merged.answerKey || {});
              window.stateManager.state.weeklyEvaluations[eIdx] = merged;
              if (prevKeyJson !== nextKeyJson) {
                stateModified = true;
                updatedExams++;
              }
            } else {
              window.stateManager.state.weeklyEvaluations.unshift(cloudExam);
              stateModified = true;
              updatedExams++;
            }
          });
        }

        if (Array.isArray(payload.homeworks) && payload.homeworks.length > 0) {
          if (!Array.isArray(window.stateManager.state.homeworks)) {
            window.stateManager.state.homeworks = [];
          }
          const isPrimary = window.stateManager.state.educationLevel === 'primary';
          payload.homeworks.forEach(cloudHw => {
            if (!cloudHw || !cloudHw.dueDate) return;
            const existing = window.stateManager.state.homeworks.find(h =>
              h.id === cloudHw.id ||
              (h.dueDate === cloudHw.dueDate && (isPrimary || !cloudHw.branch || !h.branch || h.branch === cloudHw.branch || h.branch === 'all'))
            );
            if (!existing) {
              window.stateManager.state.homeworks.push(cloudHw);
              stateModified = true;
            } else if (cloudHw.status && typeof cloudHw.status === 'object') {
              if (!existing.status) existing.status = {};
              Object.keys(cloudHw.status).forEach(sKey => {
                const matched = this.resolveDesktopStudent(sKey, '', '', allStudents);
                const targetId = matched ? matched.id : sKey;
                existing.status[targetId] = cloudHw.status[sKey];
                if (window.stateManager && typeof window.stateManager.updateHomeworkStatus === 'function') {
                  window.stateManager.updateHomeworkStatus(existing.id, targetId, cloudHw.status[sKey]);
                }
              });
              stateModified = true;
            }
          });
        }

        if (Array.isArray(payload.performance)) {
          if (!window.stateManager.state.performance) window.stateManager.state.performance = [];
          const existingIds = new Set(window.stateManager.state.performance.map(p => String(p.id)));
          const makePerfKey = (perf, sId) => `${sId || perf.studentId}_${String(perf.date || '').slice(0, 10)}_${String(perf.reason || '').trim().toLowerCase()}_${perf.point || 0}`;
          const existingPerfKeys = new Set((window.stateManager.state.performance || []).map(p => makePerfKey(p, p.studentId)));
          const activeDesktopWeek = (typeof window.stateManager.getSelectedWeek === 'function')
            ? window.stateManager.getSelectedWeek()
            : (window.getISOWeek ? window.getISOWeek(new Date()) : '');

          payload.performance.forEach(p => {
            if (!p) return;
            // Sınav dereceleri ve ödev performans kayıtları sınav ve ödev üzerinden dinamik üretilir;
            // el terminalinden gelen mükerrer veya farklı id'li sınav/ödev kayıtlarının eklenmesini önle
            if (p.examId || (p.reason && typeof p.reason === 'string' && /Sınav(ı)?\s+\d+\.liği/i.test(p.reason))) {
              return;
            }
            const isLegacyHwReason = p.reason && typeof p.reason === 'string' && /"\s*Ödevi\s*\((Tam|Yarım|Yapılmadı|Muaf)\)/.test(p.reason);
            if (p.homeworkId || isLegacyHwReason) return;

            const matched = this.resolveDesktopStudent(p.studentId, p.studentName, p.studentNumber, allStudents);
            const targetStuId = matched ? matched.id : p.studentId;
            p.studentId = targetStuId;

            const perfKey = makePerfKey(p, targetStuId);
            if (!existingIds.has(String(p.id)) && !existingPerfKeys.has(perfKey)) {
              if (!p.weekId) {
                if (p.date && window.getISOWeek) {
                  p.weekId = window.getISOWeek(p.date);
                } else {
                  p.weekId = activeDesktopWeek;
                }
              }
              window.stateManager.state.performance.push(p);
              existingIds.add(String(p.id));
              existingPerfKeys.add(perfKey);
              addedPerf++;
              stateModified = true;
            }
          });
        }

        if (typeof window.stateManager.recalculateAllHomeworkPoints === 'function') {
          window.stateManager.recalculateAllHomeworkPoints(false);
        }

        if (stateModified) {
          window.stateManager.saveState('El Terminalinden Veriler Eşitlendi');
          document.dispatchEvent(new CustomEvent('stateChanged'));
          if (typeof window.renderDashboard === 'function') window.renderDashboard();
          if (typeof window.renderHomeworkMatrix === 'function') window.renderHomeworkMatrix();
          if (typeof window.renderWeeklyEvaluations === 'function') window.renderWeeklyEvaluations();
          if (typeof window.renderExamsList === 'function') window.renderExamsList();
          if (window.activeWeeklyExam) {
            const refreshed = (window.stateManager.state.weeklyEvaluations || []).find(e => String(e.id) === String(window.activeWeeklyExam.id));
            if (refreshed) {
              window.activeWeeklyExam = refreshed;
              if (typeof window.openActiveExam === 'function') window.openActiveExam(refreshed);
            }
          }
          this.playDesktopLiveChime();
          if (window.showToast) {
            if (updatedExams > 0) {
              window.showToast(`📱 El Terminalinden sınav ve cevap anahtarı güncellendi`, 'success');
            } else if (addedPerf > 0) {
              window.showToast(`📱 El Terminalinden ${addedPerf} yeni davranış puanı eşitlendi`, 'success');
            } else {
              window.showToast(`📱 El Terminalinden veriler eşitlendi`, 'success');
            }
          }
        }
      }
    },

    // Mobil El Terminali Canlı Olay İşleyicisi
    handleMobileIncomingLiveRecord(record, payload) {
      if (!window.CompanionOmr) return;

      // 1. CANLI SINAV SİLİNDİ (Masaüstünden silinince terminalden de sil)
      if (record.exam_id === 'LIVE_EVENT' && payload.type === 'exam_deleted') {
        const examId = String(payload.examId);
        const examName = payload.examName || 'Sınav';
        if (typeof window.CompanionOmr.handleRemoteExamDeleted === 'function') {
          window.CompanionOmr.handleRemoteExamDeleted(examId, examName);
        }
      }

      // 1b. CANLI OPTİK SONUÇ SİLİNDİ (Masaüstünden silinince terminalden de sil)
      else if (record.exam_id === 'LIVE_EVENT' && payload.type === 'omr_delete') {
        if (typeof window.CompanionOmr.handleRemoteResultDeleted === 'function') {
          window.CompanionOmr.handleRemoteResultDeleted(payload.examId, payload.studentId, payload.studentNo);
        }
      }

      // 1c. CANLI TÜM OPTİK SONUÇLAR SIFIRLANDI
      else if (record.exam_id === 'LIVE_EVENT' && payload.type === 'omr_clear_all') {
        if (typeof window.CompanionOmr.handleRemoteAllResultsCleared === 'function') {
          window.CompanionOmr.handleRemoteAllResultsCleared(payload.examId);
        }
      }

      // 2. CANLI SINAV EKLENDİ / GÜNCELLENDİ (Masaüstünden eklenince/güncellenince terminale yansıt)
      else if (
        (record.exam_id && String(record.exam_id).startsWith('exam_')) ||
        (record.exam_id === 'LIVE_EVENT' && (payload.type === 'exam_created' || payload.type === 'exam_results'))
      ) {
        const examData = (payload.type === 'exam_created' || payload.type === 'exam_results') ? (payload.exam || payload) : payload;
        if (examData && examData.id && typeof window.CompanionOmr.handleRemoteExamUpsert === 'function') {
          window.CompanionOmr.handleRemoteExamUpsert(examData, payload.type);
        }
      }

      // 3. MASTER_STATE (Masaüstünden tam veri paketi fırlatılmışsa)
      else if (record.exam_id === 'MASTER_STATE' && payload && payload.source === 'desktop') {
        if (window.Companion && typeof window.Companion.pullMasterDataFromCloud === 'function') {
          window.Companion.pullMasterDataFromCloud(true);
        }
      }
    },

    // Masaüstünde Canlı Bildirim Sesi (Ding-Dong)
    playDesktopLiveChime() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.32);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880, now + 0.12); // A5
        gain2.gain.setValueAtTime(0.25, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.48);
      } catch (e) {}
    },

    // Buluttaki Sınavları ve Sonuçları Çek (Telefona veya Masaüstüne)
    async pullExams() {
      this.isSyncing = true;
      this.updateSyncUI();

      const res = await this.request('GET', `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&exam_id=neq.STUDENT_PHOTOS&order=updated_at.asc&select=*`);
      this.isSyncing = false;

      if (Array.isArray(res)) {
        if (res.length === 0) {
          this.updateSyncUI();
          return { success: true, count: 0, message: 'Bulutta bu kodla kayıtlı sınav bulunamadı.' };
        }

        // Yerel veritabanını güncelle ve birleştir
        let localData = {};
        if (window.stateManager && window.stateManager.state) {
          localData = window.stateManager.state;
        } else {
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) localData = JSON.parse(raw);
          } catch (e) {}
        }

        if (!localData.weeklyEvaluations) localData.weeklyEvaluations = [];
        if (!Array.isArray(localData.deletedExamIds)) localData.deletedExamIds = [];

        const deletedExamSet = new Set(localData.deletedExamIds.map(id => String(id)));

        // En güncel MASTER_STATE kaydını ve silme olaylarını tespit et
        let latestMasterItem = null;
        let latestDesktopMasterItem = null;
        res.forEach(item => {
          if (!item || !item.payload) return;
          if (item.exam_id === 'MASTER_STATE') {
            latestMasterItem = item;
            if (item.payload.source === 'desktop') {
              latestDesktopMasterItem = item;
            }
            if (Array.isArray(item.payload.deletedExamIds)) {
              item.payload.deletedExamIds.forEach(id => deletedExamSet.add(String(id)));
            }
          } else if (item.exam_id === 'LIVE_EVENT' && item.payload.type === 'exam_deleted' && item.payload.examId) {
            deletedExamSet.add(String(item.payload.examId));
          }
        });

        // Masaüstünün en son MASTER_STATE'inde yer almayan eski sınavları da silinmiş kabul et
        const desktopMasterTime = latestDesktopMasterItem && latestDesktopMasterItem.updated_at
          ? new Date(latestDesktopMasterItem.updated_at).getTime()
          : 0;
        const desktopMasterExamIds = (latestDesktopMasterItem && Array.isArray(latestDesktopMasterItem.payload.weeklyEvaluations))
          ? new Set(latestDesktopMasterItem.payload.weeklyEvaluations.filter(e => e && e.id).map(e => String(e.id)))
          : null;
        const newerLiveExamIds = new Set();

        let updatedCount = 0;

        // 1. Önce en güncel MASTER_STATE içindeki sınavları temel olarak birleştir
        if (latestMasterItem && latestMasterItem.payload && Array.isArray(latestMasterItem.payload.weeklyEvaluations)) {
          latestMasterItem.payload.weeklyEvaluations.forEach(mExam => {
            if (!mExam || !mExam.id) return;
            if (deletedExamSet.has(String(mExam.id))) return;
            if (desktopMasterExamIds && !desktopMasterExamIds.has(String(mExam.id))) return;
            this.deduplicateExamResults(mExam, localData.students || mExam.classStudents || []);
            const eIdx = localData.weeklyEvaluations.findIndex(e => String(e.id) === String(mExam.id));
            if (eIdx >= 0) {
              localData.weeklyEvaluations[eIdx] = this.mergeExamObjects(localData.weeklyEvaluations[eIdx], mExam);
            } else {
              localData.weeklyEvaluations.unshift(mExam);
            }
          });
        }

        // 2. Ardından bireysel sınav satırlarını (exam_...) ve canlı olayları (LIVE_EVENT) kronolojik olarak uygula
        res.forEach(item => {
          if (!item || !item.payload) return;
          if (item.exam_id === 'MASTER_STATE') return;

          let cloudExam = item.payload;
          if (item.exam_id === 'LIVE_EVENT') {
            if (cloudExam.type === 'omr' && cloudExam.examId && cloudExam.scanResult) {
              const targetExam = localData.weeklyEvaluations.find(e => String(e.id) === String(cloudExam.examId));
              if (targetExam) {
                if (!targetExam.studentResults) targetExam.studentResults = {};
                if (!targetExam.examScores) targetExam.examScores = {};
                const scanRes = cloudExam.scanResult;
                const matched = this.resolveDesktopStudent(
                  cloudExam.studentId,
                  cloudExam.studentName || scanRes.studentName,
                  scanRes.studentNo || scanRes.studentNumber,
                  localData.students || targetExam.classStudents || []
                );
                const canonicalId = matched ? String(matched.id) : String(cloudExam.studentId);
                targetExam.studentResults[canonicalId] = scanRes;
                if (scanRes.score !== undefined) {
                  targetExam.examScores[canonicalId] = scanRes.score;
                }
                targetExam.allResultsCleared = false;
                this.deduplicateExamResults(targetExam, localData.students || targetExam.classStudents || []);
                updatedCount++;
              }
              return;
            }
            if ((cloudExam.type === 'exam_created' || cloudExam.type === 'exam_results') && cloudExam.exam && cloudExam.exam.id) {
              const eventTime = item.updated_at ? new Date(item.updated_at).getTime() : 0;
              // Masaüstü MASTER_STATE'inden daha eski bir LIVE_EVENT ise ve masaüstü listesinde yoksa (silinmişse) atla
              if (desktopMasterExamIds && eventTime <= desktopMasterTime && !desktopMasterExamIds.has(String(cloudExam.exam.id))) {
                return;
              }
              if (eventTime > desktopMasterTime) {
                newerLiveExamIds.add(String(cloudExam.exam.id));
              }
              cloudExam = cloudExam.exam;
            } else {
              return;
            }
          }

          if (!cloudExam || !cloudExam.id) return;
          if (deletedExamSet.has(String(cloudExam.id))) return;
          if (window.stateManager && desktopMasterExamIds && !desktopMasterExamIds.has(String(cloudExam.id))) {
            const itemTime = item.updated_at ? new Date(item.updated_at).getTime() : 0;
            if (itemTime <= desktopMasterTime) return;
          }

          // Öğrenci kimliklerini kanonik ID ile eşle ve mükerrerleri temizle
          this.deduplicateExamResults(cloudExam, localData.students || cloudExam.classStudents || []);

          const existingIdx = localData.weeklyEvaluations.findIndex(e => String(e.id) === String(cloudExam.id));
          if (existingIdx >= 0) {
            localData.weeklyEvaluations[existingIdx] = this.mergeExamObjects(localData.weeklyEvaluations[existingIdx], cloudExam);
            this.deduplicateExamResults(localData.weeklyEvaluations[existingIdx], localData.students || []);
          } else {
            if (cloudExam.answerKey && Object.keys(cloudExam.answerKey).length > 0) {
              cloudExam.hasOpticalForm = true;
            }
            localData.weeklyEvaluations.unshift(cloudExam);
          }

          // Sınavla birlikte gelen öğrenci listesini de yerel hafızaya ekle / güncelle (Fotoğrafları Koru!)
          if (Array.isArray(cloudExam.classStudents) && cloudExam.classStudents.length > 0) {
            if (!localData.students) localData.students = [];
            cloudExam.classStudents.forEach(cs => {
              const sIdx = localData.students.findIndex(ls => String(ls.id) === String(cs.id) || (ls.number && String(ls.number) === String(cs.number) && String(ls.branch || '').replace('/', '-') === String(cs.branch || '').replace('/', '-')));
              if (sIdx >= 0) {
                const existing = localData.students[sIdx];
                const memStudent = window.stateManager?.state?.students?.find(s => String(s.id) === String(existing.id) || (s.number && String(s.number) === String(existing.number)));
                const existingPhoto = (memStudent && memStudent.photo && memStudent.photo.length > 50) ? memStudent.photo : ((existing.photo && existing.photo.length > 50) ? existing.photo : '');
                const newPhoto = (cs.photo && typeof cs.photo === 'string' && cs.photo.length > 50) ? cs.photo : '';

                localData.students[sIdx] = {
                  ...existing,
                  ...cs,
                  id: window.stateManager ? existing.id : (cs.id || existing.id),
                  photo: newPhoto || existingPhoto || ''
                };
              } else {
                localData.students.push(cs);
              }
            });
          }

          updatedCount++;
        });

        // Silinen ve masaüstü ana paketinden kaldırılmış sınavları yerel listeden temizle
        localData.deletedExamIds = Array.from(deletedExamSet);
        localData.weeklyEvaluations = (localData.weeklyEvaluations || []).filter(exam => {
          if (!exam || !exam.id) return false;
          const idStr = String(exam.id);
          if (deletedExamSet.has(idStr)) return false;
          if (!window.stateManager && desktopMasterExamIds && !desktopMasterExamIds.has(idStr) && !newerLiveExamIds.has(idStr)) {
            return false;
          }
          return true;
        });

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
        } catch (e) {}

        if (window.stateManager) {
          if (Array.isArray(localData.students) && typeof restoreStudentPhotosToList === 'function') {
            restoreStudentPhotosToList(localData.students);
            if (typeof cacheStudentPhotosFromList === 'function') {
              cacheStudentPhotosFromList(localData.students);
            }
          }
          window.stateManager.state = localData;
          if (Array.isArray(localData.weeklyEvaluations) && typeof window.stateManager.saveExam === 'function') {
            localData.weeklyEvaluations.forEach(ex => {
              if (ex && ex.id) {
                this.deduplicateExamResults(ex, localData.students || []);
                window.stateManager.saveExam(ex);
              }
            });
          } else if (typeof window.stateManager.saveState === 'function') {
            window.stateManager.saveState('El Terminalinden Sınav ve Cevap Anahtarı Eşitlendi');
          }
          document.dispatchEvent(new CustomEvent('stateChanged'));
          this.scheduleDebouncedMasterPush();
        }

        this.lastSyncTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
        this.updateSyncUI();

        // UI'ları bilgilendir
        if (window.CompanionOmr && typeof window.CompanionOmr.renderHub === 'function') {
          window.CompanionOmr.ensureActiveExam();
          window.CompanionOmr.renderHub();
        }
        if (window.activeWeeklyExam) {
          const refreshed = (localData.weeklyEvaluations || []).find(e => String(e.id) === String(window.activeWeeklyExam.id));
          if (refreshed) {
            window.activeWeeklyExam = refreshed;
            if (typeof window.openActiveExam === 'function') {
              window.openActiveExam(refreshed);
            }
          }
        }
        if (typeof window.renderWeeklyEvaluations === 'function') {
          window.renderWeeklyEvaluations();
        }
        if (typeof window.renderExamsList === 'function') {
          window.renderExamsList();
        }

        return { success: true, count: updatedCount };
      } else {
        this.updateSyncUI();
        return { success: false, error: res };
      }
    },

    // UI Senkronizasyon Durumunu ve Eşleşme Kodlarını Güncelle
    updateSyncUI() {
      // 1. OMR Bar göstergeleri
      const dot = document.getElementById('companion-sync-dot');
      const text = document.getElementById('companion-sync-text');
      if (dot && text) {
        if (this.isSyncing) {
          dot.className = 'c-sync-dot syncing';
          text.textContent = 'Bulut Eşitleniyor...';
        } else if (this.lastSyncTime) {
          dot.className = 'c-sync-dot';
          text.textContent = `Eşitlendi (${this.lastSyncTime})`;
        } else {
          dot.className = 'c-sync-dot offline';
          text.textContent = `Eşleşme Kodu: ${this.syncCode}`;
        }
      }

      // 2. Masaüstü Ayarlar alanındaki göstergeler
      const desktopCode = document.getElementById('desktop-sync-code-display');
      if (desktopCode) desktopCode.textContent = this.syncCode;

      const desktopStats = document.getElementById('desktop-sync-stats-info');
      if (desktopStats) {
        let stuCount = 0, examCount = 0;
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            stuCount = (parsed.students || []).length;
            examCount = (parsed.weeklyEvaluations || []).length;
          }
        } catch (e) {}
        if (this.liveListenerActive) {
          desktopStats.innerHTML = `<span style="color: #10b981; font-weight: 700;">🟢 Canlı Bağlantı Aktif:</span> Terminalden girilen puan ve sınavlar anında buraya yansır. (Kod: <strong style="color: #a5b4fc;">${this.syncCode}</strong>)`;
        } else {
          desktopStats.textContent = `Hazır: ${stuCount} Öğrenci • ${examCount} Sınav • Kod: ${this.syncCode}`;
        }
      }

      // 3. Mobil Ayarlar ve Sync ekranındaki göstergeler
      const setupCode = document.getElementById('setup-view-code-display');
      if (setupCode) setupCode.textContent = this.syncCode;

      const syncViewCode = document.getElementById('sync-view-code-display');
      if (syncViewCode) syncViewCode.textContent = this.syncCode;

      const settingsModalCode = document.getElementById('settings-modal-code-display');
      if (settingsModalCode) settingsModalCode.textContent = this.syncCode;

      if (window.Companion && typeof window.Companion.updateWizardSyncStatus === 'function') {
        window.Companion.updateWizardSyncStatus();
      }

      const mobileMemText = document.getElementById('mobile-memory-status-text');
      const mobileMemTime = document.getElementById('mobile-memory-last-sync');
      if (mobileMemText) {
        let stuCount = 0, examCount = 0, bookCount = 0;
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            stuCount = (parsed.students || []).length;
            examCount = (parsed.weeklyEvaluations || []).length;
            bookCount = (parsed.books?.library || []).length;
          }
        } catch (e) {}

        if (stuCount > 0 || examCount > 0) {
          mobileMemText.textContent = `🟢 Kalıcı Bellek: ${stuCount} Öğrenci • ${examCount} Sınav • ${bookCount} Kitap`;
        } else {
          mobileMemText.textContent = `⚪ Bellek: Henüz masaüstünden veri yüklenmedi`;
        }
      }
      if (mobileMemTime) {
        mobileMemTime.textContent = this.lastSyncTime ? `Son Eşitleme: ${this.lastSyncTime}` : 'Eşitleme Bekleniyor';
      }

      // 4. Masaüstü QR Kodunu Çizdir
      this.renderDesktopQRCode();
    },

    // Masaüstü ekranında QR Kod üret ve göster
    renderDesktopQRCode() {
      const qrContainer = document.getElementById('desktop-sync-qrcode');
      if (!qrContainer || !this.syncCode) return;
      if (typeof window.qrcode !== 'function') return;
      try {
        const qr = window.qrcode(0, 'M');
        qr.addData(this.syncCode);
        qr.make();
        qrContainer.innerHTML = qr.createSvgTag({ cellSize: 3.5, margin: 2 });
        const svg = qrContainer.querySelector('svg');
        if (svg) {
          svg.style.width = '100%';
          svg.style.height = '100%';
          svg.style.display = 'block';
        }
      } catch (e) {
        console.error('QR kod oluşturulamadı:', e);
      }
    },

    // ==========================================================================
    // MOBİL QR KOD KAMERA TARAYICI (jsQR ENTEGRASYONLU)
    // ==========================================================================
    qrScanStream: null,
    qrScanLoopRunning: false,

    async openQrScanner() {
      const modal = document.getElementById('mobile-qr-scanner-modal');
      const video = document.getElementById('qr-scanner-video');
      if (!modal || !video) {
        this.promptChangeSyncCode();
        return;
      }

      modal.style.display = 'flex';
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }

      try {
        if (window.AndroidBridge && typeof window.AndroidBridge.requestCameraPermission === 'function') {
          window.AndroidBridge.requestCameraPermission();
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
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

        this.qrScanStream = stream;
        video.srcObject = stream;
        video.setAttribute('playsinline', '');
        video.setAttribute('autoplay', '');
        video.muted = true;
        await video.play();

        this.qrScanLoopRunning = true;
        this.runQrScanLoop(video);
      } catch (err) {
        console.error('QR tarayıcı kamera hatası:', err);
        alert('Kamera açılamadı veya izin verilmedi. Kodu elle girebilirsiniz.');
        this.closeQrScanner();
        this.promptChangeSyncCode();
      }
    },

    closeQrScanner() {
      this.qrScanLoopRunning = false;
      if (this.qrScanStream) {
        try {
          this.qrScanStream.getTracks().forEach(t => t.stop());
        } catch (e) {}
        this.qrScanStream = null;
      }
      const video = document.getElementById('qr-scanner-video');
      if (video) video.srcObject = null;

      const modal = document.getElementById('mobile-qr-scanner-modal');
      if (modal) modal.style.display = 'none';
    },

    runQrScanLoop(video) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const statusText = document.getElementById('qr-scanner-status-text');

      const checkFrame = () => {
        if (!this.qrScanLoopRunning) return;

        if (video && video.readyState >= 2 && !video.paused) {
          try {
            ctx.drawImage(video, 0, 0, 400, 400);
            const imgData = ctx.getImageData(0, 0, 400, 400);

            if (typeof window.jsQR === 'function') {
              const qrResult = window.jsQR(imgData.data, 400, 400, { inversionAttempts: 'attemptBoth' });
              if (qrResult && qrResult.data && qrResult.data.trim()) {
                const rawData = qrResult.data.trim();
                const cleanCode = rawData.replace(/^["']|["']$/g, '').trim();

                if (cleanCode.length >= 3) {
                  if (statusText) statusText.textContent = '🎯 QR Kod Algılandı! Eşleştiriliyor...';
                  if (navigator.vibrate) {
                    try { navigator.vibrate([50, 50, 100]); } catch (e) {}
                  }

                  this.closeQrScanner();
                  this.setSyncCode(cleanCode);
                  this.updateSyncUI();

                  if (window.Companion) {
                    if (typeof window.Companion.showToast === 'function') {
                      window.Companion.showToast('✅ QR Kod ile Eşleşti! Veriler eşitleniyor...');
                    }
                    if (typeof window.Companion.pullMasterDataFromCloud === 'function') {
                      window.Companion.pullMasterDataFromCloud();
                    }
                  } else if (window.showToast) {
                    window.showToast('✅ QR Kod ile Başarıyla Eşleşti!', 'success');
                  } else {
                    alert('Eşleşme tamamlandı: ' + cleanCode);
                  }
                  return;
                }
              }
            }
          } catch (e) {}
        }

        if (this.qrScanLoopRunning) {
          requestAnimationFrame(checkFrame);
        }
      };

      requestAnimationFrame(checkFrame);
    },

    // Kullanıcıdan Eşleşme Kodunu Değiştirmesini İste
    promptChangeSyncCode() {
      const current = this.syncCode;
      const input = prompt('Tahtadaki Eşleşme Kodunu Girin (Örn: SA-8K4N2P veya sadece 8K4N2P):', current);
      if (input && input.trim()) {
        const clean = this.setSyncCode(input);
        this.updateSyncUI();
        if (window.Companion) {
          if (typeof window.Companion.showToast === 'function') window.Companion.showToast(`Eşleşme kodu güncellendi: ${clean}`);
          if (typeof window.Companion.pullMasterDataFromCloud === 'function') window.Companion.pullMasterDataFromCloud();
        }
        else if (window.showToast) window.showToast(`Eşleşme kodu güncellendi: ${clean}`, 'success');
        else alert(`Eşleşme kodu güncellendi: ${clean}`);
      }
    },

    // Kodu Panoya Kopyala
    copySyncCode() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(this.syncCode).then(() => {
          if (window.showToast) window.showToast('Eşleşme kodu panoya kopyalandı!', 'success');
          else if (window.Companion) window.Companion.showToast('Eşleşme kodu panoya kopyalandı!');
          else alert('Eşleşme kodu panoya kopyalandı: ' + this.syncCode);
        });
      } else {
        prompt('Eşleşme kodunuz:', this.syncCode);
      }
    },

    // ==========================================================================
    // ÇEVRİM DIŞI ANLIK QR AKTARIM KÖPRÜSÜ (SIFIR İNTERNET GEREKTİRİR)
    // ==========================================================================

    // Sınavı kompakt QR JSON dizesine dönüştür
    generateExamQrPayload(exam) {
      if (!exam) return '';
      const payload = {
        type: 'SA_EXAM_PAIR',
        id: exam.id,
        name: exam.examName,
        totalQ: exam.totalQuestions || 20,
        choices: exam.choicesCount || 4,
        isMulti: !!exam.isMultiSubject,
        subjects: (exam.subjects || []).map(s => ({
          id: s.id,
          name: s.name,
          qCount: s.questionCount,
          key: s.answerKey || {}
        })),
        key: exam.answerKey || {}
      };
      return JSON.stringify(payload);
    },

    // Taranan Sonuçları Masaüstüne Göndermek İçin Kompakt QR Payload
    generateResultsQrPayload(exam) {
      if (!exam || !exam.studentResults) return '';
      const payload = {
        type: 'SA_RESULTS_PAIR',
        id: exam.id,
        results: exam.studentResults,
        scores: exam.examScores || {}
      };
      return JSON.stringify(payload);
    }
  };

  window.CloudSync = CloudSync;

  document.addEventListener('DOMContentLoaded', () => {
    CloudSync.init();
  });
})(window);
