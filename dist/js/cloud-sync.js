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
    supabaseUrl: 'https://tzwewboqhjsmoezriadg.supabase.co',
    anonKey: 'sb_publishable_FVth3wbbG-2XZiJmpO0-rw_mNiU0_Ci',

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
      }

      this.updateSyncUI();
    },

    // Masaüstü verilerini sessizce arka planda buluta hazırla
    autoPushMasterDebounced() {
      if (!window.stateManager) return;
      if (this.debouncedMasterTimer) clearTimeout(this.debouncedMasterTimer);
      this.debouncedMasterTimer = setTimeout(async () => {
        try {
          console.log('[CloudSync] Masaüstü verileri otomatik olarak buluta aktarılıyor (Kod: ' + this.syncCode + ')...');
          await this.pushMasterData();
        } catch (e) {
          console.warn('[CloudSync] Otomatik master veri eşitleme uyarısı:', e);
        }
      }, 1000);
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

    // Supabase API Çağrısı
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
          const text = await res.text();
          return text ? JSON.parse(text) : { success: true };
        }
        return { error: true, status: res.status, text: await res.text() };
      } catch (err) {
        return { error: true, message: err.message };
      }
    },

    // Sınavı Buluta Yükle (Masaüstü veya Telefondan)
    async pushExam(exam) {
      if (!exam || !exam.id) return { success: false, error: 'Geçersiz sınav' };
      this.isSyncing = true;
      this.updateSyncUI();

      const payload = {
        sync_code: this.syncCode,
        exam_id: String(exam.id),
        exam_name: exam.examName || 'Sınav',
        payload: exam,
        updated_at: new Date().toISOString()
      };

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
    },

    // ==========================================================================
    // TÜM SINIFLAR & VERİLER İÇİN KALICI MASTER SENKRONİZASYON (MASTER_STATE)
    // ==========================================================================

    // Tüm Sınıfları, Öğrencileri, Sınavları ve Kitaplığı Buluta Gönder
    async pushMasterData() {
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
      const weeklyEvaluations = Array.isArray(localData.weeklyEvaluations) ? localData.weeklyEvaluations : [];
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
      const masterPayload = {
        type: 'MASTER_STATE',
        syncCode: this.syncCode,
        timestamp: new Date().toISOString(),
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
          photo: s.photo || '',
          parentPhone: s.parentPhone || '',
          notes: s.notes || ''
        })),
        books: {
          library: Array.isArray(books.library) ? books.library : [],
          transactions: Array.isArray(books.transactions) ? books.transactions : []
        },
        weeklyEvaluations: weeklyEvaluations,
        homework: homework,
        homeworks: homework,
        contributions: contributions,
        performanceBehaviors: performanceBehaviors,
        attendance: (localData.attendance || (window.stateManager && window.stateManager.state ? window.stateManager.state.attendance : {})) || {},
        performance: Array.isArray(localData.performance) ? localData.performance : []
      };

      const record = {
        sync_code: this.syncCode,
        exam_id: 'MASTER_STATE',
        exam_name: 'Tüm Sınıflar & Veriler (Kalıcı)',
        payload: masterPayload,
        updated_at: new Date().toISOString()
      };

      const res = await this.request('POST', 'teacher_sync', record);
      this.isSyncing = false;

      if (res && !res.error) {
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

      const res = await this.request('GET', `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&exam_id=eq.MASTER_STATE&select=*`);
      this.isSyncing = false;

      if (res && res.error) {
        this.updateSyncUI();
        const msg = (res.message && (res.message.toLowerCase().includes('fetch') || res.message.toLowerCase().includes('network')))
          ? 'İnternet bağlantısı kurulamadı. Lütfen telefonunuzun Wi-Fi veya mobil veri bağlantısını açıp tekrar deneyin.'
          : ('Bulut bağlantı hatası: ' + (res.message || res.status || 'Sunucuya erişilemedi.'));
        return { success: false, error: msg };
      }

      let masterItem = null;
      if (Array.isArray(res) && res.length > 0) {
        masterItem = res[0].payload;
      }

      // Eğer MASTER_STATE tek başına bulunamadıysa tüm kayıtları çekip içinden ara
      if (!masterItem) {
        const allRes = await this.request('GET', `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&select=*`);
        if (allRes && allRes.error) {
          this.updateSyncUI();
          return {
            success: false,
            error: 'İnternet bağlantısı kurulamadı. Lütfen telefonunuzun Wi-Fi veya mobil veri bağlantısını açıp tekrar deneyin.'
          };
        }
        if (Array.isArray(allRes)) {
          const match = allRes.find(r => r.exam_id === 'MASTER_STATE');
          if (match) masterItem = match.payload;
        }
      }

      if (!masterItem) {
        this.updateSyncUI();
        return {
          success: false,
          error: `Bulutta "${this.syncCode}" eşleşme koduna ait ana veri paketi (MASTER_STATE) bulunamadı. Lütfen masaüstünden "Terminale Gönder" butonuna bastığınızdan emin olun.`
        };
      }

      // Yerel hafızaya güvenle birleştir
      let localData = {};
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) localData = JSON.parse(raw);
      } catch (e) {}

      // 1. Öğrencileri birleştir (Kalıcı Liste) ve ID eşleme haritası oluştur
      const cloudToLocalMap = new Map();
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
            const canonicalId = localData.students[idx].id;
            cloudToLocalMap.set(String(cloudStudent.id), canonicalId);
            localData.students[idx] = { ...cloudStudent, ...localData.students[idx], id: canonicalId };
          } else {
            cloudToLocalMap.set(String(cloudStudent.id), cloudStudent.id);
            localData.students.push(cloudStudent);
          }
        });
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
          localData.books.transactions = masterItem.books.transactions;
        }
      }

      // 3. Sınavları birleştir (Yerel taranan sonuçları koru)
      if (Array.isArray(masterItem.weeklyEvaluations)) {
        if (!localData.weeklyEvaluations) localData.weeklyEvaluations = [];
        masterItem.weeklyEvaluations.forEach(cloudExam => {
          const eIdx = localData.weeklyEvaluations.findIndex(le => String(le.id) === String(cloudExam.id));
          if (eIdx >= 0) {
            const localExam = localData.weeklyEvaluations[eIdx];
            const mergedResults = { ...(cloudExam.studentResults || {}), ...(localExam.studentResults || {}) };
            const mergedScores = { ...(cloudExam.examScores || {}), ...(localExam.examScores || {}) };
            localData.weeklyEvaluations[eIdx] = {
              ...cloudExam,
              ...localExam,
              studentResults: mergedResults,
              examScores: mergedScores,
              updatedAt: new Date().toISOString()
            };
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
        const activeDesktopWeek = (window.stateManager && typeof window.stateManager.getSelectedWeek === 'function')
          ? window.stateManager.getSelectedWeek()
          : (window.getISOWeek ? window.getISOWeek(new Date()) : '');

        masterItem.performance.forEach(p => {
          // ID'yi yerel öğrenciye uyarla
          if (cloudToLocalMap.has(String(p.studentId))) {
            p.studentId = cloudToLocalMap.get(String(p.studentId));
          } else {
            const matched = this.resolveDesktopStudent(p.studentId, p.studentName, p.studentNumber, localData.students);
            if (matched) p.studentId = matched.id;
          }

          if (!p.weekId) {
            p.weekId = activeDesktopWeek;
          }

          if (!existingPerfIds.has(String(p.id))) {
            localData.performance.push(p);
            existingPerfIds.add(String(p.id));
          }
        });

        // Ayrıca yerel hafızadaki unmapped performans kayıtlarını da onar!
        localData.performance.forEach(lp => {
          if (cloudToLocalMap.has(String(lp.studentId))) {
            lp.studentId = cloudToLocalMap.get(String(lp.studentId));
          } else {
            const matched = this.resolveDesktopStudent(lp.studentId, lp.studentName, lp.studentNumber, localData.students);
            if (matched) lp.studentId = matched.id;
          }
          if (!lp.weekId) {
            lp.weekId = activeDesktopWeek;
          }
        });
      }
      if (masterItem.contributions) {
        localData.contributions = masterItem.contributions;
      }
      if (masterItem.educationLevel) {
        localData.educationLevel = masterItem.educationLevel;
      }

      // 5. Davranış Kriterleri (Pozitif & Geliştirilmeli)
      if (masterItem.performanceBehaviors) {
        localData.performanceBehaviors = masterItem.performanceBehaviors;
      }

      // 6. Yoklama Verileri (Devamsızlık Kayıtları)
      if (masterItem.attendance) {
        localData.attendance = masterItem.attendance;
      }

      // 7. Ödev Kayıtları (Tüm Şubeler & Günler)
      if (masterItem.homeworks || masterItem.homework) {
        const hwList = masterItem.homeworks || masterItem.homework || [];
        localData.homeworks = hwList;
        localData.homework = hwList;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));

      // Masaüstü StateManager varsa güncelle
      if (window.stateManager) {
        window.stateManager.state = localData;
        if (typeof window.stateManager.saveState === 'function') {
          window.stateManager.saveState('Kalıcı El Terminali Verileri Eşitlendi');
        }
        document.dispatchEvent(new CustomEvent('stateChanged'));
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

        localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));

        if (window.stateManager) {
          window.stateManager.state.books = localData.books;
          document.dispatchEvent(new CustomEvent('stateChanged'));
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

      // Hem sınav sonuçlarını hem de güncellenen verileri çek
      const examRes = await this.pullExams();
      const masterRes = await this.pullMasterData();

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

      const payload = {
        type: 'omr',
        source: 'terminal',
        examId: String(examId),
        examName: examName || 'Sınav',
        studentId: String(studentId),
        studentName: studentName || 'Öğrenci',
        scanResult: scanResult,
        timestamp: new Date().toISOString()
      };

      this.pushLiveEvent('omr', payload);
      this.scheduleDebouncedMasterPush();
    },

    // 2b. Anlık Canlı Yeni Sınav Gönder (Masaüstü veya Terminal)
    async pushLiveExamCreated(exam, source = (window.stateManager ? 'desktop' : 'terminal')) {
      if (!this.syncCode || !exam) return;

      const payload = {
        type: 'exam_created',
        source: source,
        exam: exam,
        timestamp: new Date().toISOString()
      };

      this.pushLiveEvent('exam_created', payload);
      this.scheduleDebouncedMasterPush();
    },

    // 2c. Anlık Canlı Sınav Sonuçları Paketi Gönder (Masaüstü veya Terminal)
    async pushLiveExamResults(exam, source = (window.stateManager ? 'desktop' : 'terminal')) {
      if (!this.syncCode || !exam) return;

      const payload = {
        type: 'exam_results',
        source: source,
        exam: exam,
        timestamp: new Date().toISOString()
      };

      this.pushLiveEvent('exam_results', payload);
      this.scheduleDebouncedMasterPush();
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

      // Veritabanındaki satırı da temizle
      try {
        await this.request('DELETE', `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&exam_id=eq.${encodeURIComponent(examId)}`);
      } catch (e) {}

      this.scheduleDebouncedMasterPush();
    },

    // 3. Genel Canlı Olay Gönderimi (Supabase'e fırlat)
    async pushLiveEvent(eventType, eventPayload) {
      if (!this.syncCode) return;

      const record = {
        sync_code: this.syncCode,
        exam_id: 'LIVE_EVENT',
        exam_name: eventType === 'performance' ? 'Canlı Puan' : (eventType === 'omr' ? 'Optik Okuma' : 'Canlı Olay'),
        payload: eventPayload,
        updated_at: new Date().toISOString()
      };

      try {
        await this.request('POST', 'teacher_sync', record);
      } catch (e) {
        console.warn('Canlı olay gönderme hatası:', e);
      }
    },

    // 4. Arka Planda Master Eşitlemeyi Gecikmeli Gönder (Debounce)
    scheduleDebouncedMasterPush() {
      if (this.debouncedMasterTimer) clearTimeout(this.debouncedMasterTimer);
      this.debouncedMasterTimer = setTimeout(async () => {
        try {
          await this.pushMasterData();
        } catch (e) {}
      }, 2500);
    },

    // 5. Canlı Dinleyiciyi Başlat (WebSockets + Polling Fallback)
    startLiveListener(forceRestart = false) {
      if (!window.stateManager && !window.Companion && !window.CompanionOmr) return;
      if (this.liveListenerActive && !forceRestart) return;

      this.liveListenerActive = true;
      this.lastProcessedEventTime = new Date().toISOString();
      if (!this.processedEventIds) this.processedEventIds = new Set();

      // A) Supabase Realtime WebSocket Bağlantısı
      this.connectRealtimeWebSocket();

      // B) Dayanıklı Kalp Atışı / Yedek Polling (Her 3 saniyede bir)
      if (this.pollingInterval) clearInterval(this.pollingInterval);
      this.pollingInterval = setInterval(() => {
        this.checkLiveUpdates();
      }, 3000);

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

    // Yedek Kontrolcü (Heartbeat Polling)
    async checkLiveUpdates() {
      if (!this.syncCode) return;
      if (!window.stateManager && !window.Companion && !window.CompanionOmr) return;

      try {
        const res = await this.request('GET', `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&order=updated_at.desc&limit=1&select=*`);
        if (Array.isArray(res) && res.length > 0) {
          const latest = res[0];
          if (latest.updated_at && (!this.lastProcessedEventTime || latest.updated_at > this.lastProcessedEventTime)) {
            this.lastProcessedEventTime = latest.updated_at;
            this.handleIncomingLiveRecord(latest);
          }
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
      if (sIdStr) {
        const found = studentsList.find(s => String(s.id).trim() === sIdStr);
        if (found) return found;
      }

      // 2. School number match
      if (sNumStr) {
        const found = studentsList.find(s => String(s.number || '').trim() === sNumStr);
        if (found) return found;
      }

      // 3. Name & Surname match
      if (sNameStr) {
        const cleanName = sNameStr.replace(/\s+/g, ' ');
        const found = studentsList.find(s => {
          const sFullName = `${s.name || ''} ${s.surname || ''}`.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');
          return sFullName === cleanName || sFullName.includes(cleanName) || cleanName.includes(sFullName);
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
        // weekId yoksa aktif haftayı bağla ki haftalık değerlendirmede çıksın
        if (!p.weekId) {
          p.weekId = activeWeek;
          changed = true;
        }
      });

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

        let hw = window.stateManager.state.homeworks.find(h => {
          const matchDate = h.dueDate === dateStr;
          const matchBranch = !branch || !h.branch || h.branch === branch || h.branch === 'all';
          return matchDate && matchBranch;
        });

        if (!hw) {
          hw = window.stateManager.addHomework({
            title: title,
            description: 'El terminalinden günlük kontrol',
            dueDate: dateStr,
            branch: branch
          });
        } else if (title && hw.title !== title) {
          hw.title = title;
        }

        const allStudents = window.stateManager.state.students || [];
        for (const stuId in statusMap) {
          const status = statusMap[stuId];
          const matched = this.resolveDesktopStudent(stuId, '', '', allStudents);
          const targetStudentId = matched ? matched.id : stuId;
          window.stateManager.updateHomeworkStatus(hw.id, targetStudentId, status);
        }

        window.stateManager.saveState(`El Terminalinden Canlı Ödev: ${branch || ''}`);
        document.dispatchEvent(new CustomEvent('stateChanged'));
        if (typeof window.renderDashboard === 'function') {
          window.renderDashboard();
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

            // Öğrenci ID eşleşmesi
            const allStudents = window.stateManager.state.students || [];
            const studentNumRaw = scanRes ? (scanRes.studentNo || scanRes.studentNumber || '') : '';
            const matched = this.resolveDesktopStudent(studentId, studentName, studentNumRaw, allStudents);
            if (matched) {
              studentId = matched.id;
              studentName = `${matched.name} ${matched.surname || ''}`.trim();
            }

            targetExam.studentResults[studentId] = scanRes;
            if (matched && matched.number) {
              targetExam.studentResults[String(matched.number)] = scanRes;
            }
            if (scanRes && scanRes.score !== undefined) {
              targetExam.examScores[studentId] = scanRes.score;
              if (matched && matched.number) {
                targetExam.examScores[String(matched.number)] = scanRes.score;
              }
            }

            targetExam.updatedAt = new Date().toISOString();
            window.stateManager.saveState(`El Terminalinden Optik Sonuç: ${studentName}`);
            document.dispatchEvent(new CustomEvent('stateChanged'));

            if (window.activeWeeklyExam && (String(window.activeWeeklyExam.id) === examId || String(window.activeWeeklyExam.id) === String(targetExam.id))) {
              window.activeWeeklyExam = targetExam;
              if (typeof window.renderActiveExamTable === 'function') {
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

      // 3. CANLI YENİ SINAV VEYA TOPLU SINAV SONUÇLARI ENTEGRASYONU
      else if (
        (record.exam_id && String(record.exam_id).startsWith('exam_')) ||
        (record.exam_id === 'LIVE_EVENT' && (payload.type === 'exam_created' || payload.type === 'exam_results'))
      ) {
        const examData = (payload.type === 'exam_created' || payload.type === 'exam_results') ? (payload.exam || payload) : payload;
        if (examData && examData.id) {
          if (!Array.isArray(window.stateManager.state.weeklyEvaluations)) {
            window.stateManager.state.weeklyEvaluations = [];
          }
          const allStudents = window.stateManager.state.students || [];
          const existingIdx = window.stateManager.state.weeklyEvaluations.findIndex(e => String(e.id) === String(examData.id));

          // Öğrenci ID'lerini masaüstündeki öğrencilerle eşle (harmonize results)
          if (examData.studentResults && typeof examData.studentResults === 'object') {
            const harmonizedResults = {};
            const harmonizedScores = {};
            Object.keys(examData.studentResults).forEach(stuKey => {
              const res = examData.studentResults[stuKey];
              const matched = this.resolveDesktopStudent(stuKey, res.studentName, res.studentNo || res.studentNumber, allStudents);
              const targetId = matched ? matched.id : stuKey;
              harmonizedResults[targetId] = res;
              if (matched && matched.number) {
                harmonizedResults[String(matched.number)] = res;
              }
              if (examData.examScores && examData.examScores[stuKey] !== undefined) {
                harmonizedScores[targetId] = examData.examScores[stuKey];
              } else if (res.score !== undefined) {
                harmonizedScores[targetId] = res.score;
              }
            });
            examData.studentResults = harmonizedResults;
            examData.examScores = harmonizedScores;
          }

          if (existingIdx >= 0) {
            window.stateManager.state.weeklyEvaluations[existingIdx] = {
              ...window.stateManager.state.weeklyEvaluations[existingIdx],
              ...examData,
              updatedAt: new Date().toISOString()
            };
          } else {
            window.stateManager.state.weeklyEvaluations.unshift(examData);
          }

          const isNew = existingIdx < 0;
          const actionLabel = isNew ? 'Yeni Sınav Oluşturuldu' : 'Sınav Sonuçları Güncellendi';
          window.stateManager.saveState(`El Terminalinden ${actionLabel}: ${examData.examName}`);
          document.dispatchEvent(new CustomEvent('stateChanged'));

          if (window.activeWeeklyExam && String(window.activeWeeklyExam.id) === String(examData.id)) {
            window.activeWeeklyExam = existingIdx >= 0 ? window.stateManager.state.weeklyEvaluations[existingIdx] : examData;
            if (typeof window.renderActiveExamTable === 'function') {
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
          const count = Object.keys(examData.studentResults || {}).length;
          const toastMsg = count > 0
            ? `📱 El Terminalinden Canlı: "${examData.examName}" (${count} öğrenci sonucu aktarıldı)`
            : `📱 El Terminalinden Canlı: "${examData.examName}" oluşturuldu`;
          if (window.showToast) {
            window.showToast(toastMsg, 'success');
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
      else if (record.exam_id === 'MASTER_STATE' && payload && payload.source === 'terminal') {
        if (Array.isArray(payload.performance)) {
          if (!window.stateManager.state.performance) window.stateManager.state.performance = [];
          const allStudents = window.stateManager.state.students || [];
          const existingIds = new Set(window.stateManager.state.performance.map(p => String(p.id)));
          const activeDesktopWeek = (typeof window.stateManager.getSelectedWeek === 'function')
            ? window.stateManager.getSelectedWeek()
            : (window.getISOWeek ? window.getISOWeek(new Date()) : '');

          let added = 0;
          payload.performance.forEach(p => {
            if (!existingIds.has(String(p.id))) {
              const matched = this.resolveDesktopStudent(p.studentId, p.studentName, p.studentNumber, allStudents);
              if (matched) {
                p.studentId = matched.id;
              }
              if (!p.weekId) {
                p.weekId = activeDesktopWeek;
              }
              window.stateManager.state.performance.push(p);
              existingIds.add(String(p.id));
              added++;
            }
          });
          if (added > 0) {
            window.stateManager.saveState();
            document.dispatchEvent(new CustomEvent('stateChanged'));
            if (typeof window.renderDashboard === 'function') window.renderDashboard();
            this.playDesktopLiveChime();
            if (window.showToast) window.showToast(`📱 El Terminalinden ${added} yeni veri eşitlendi`, 'success');
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

      const res = await this.request('GET', `teacher_sync?sync_code=eq.${encodeURIComponent(this.syncCode)}&select=*`);
      this.isSyncing = false;

      if (Array.isArray(res)) {
        if (res.length === 0) {
          this.updateSyncUI();
          return { success: true, count: 0, message: 'Bulutta bu kodla kayıtlı sınav bulunamadı.' };
        }

        // Yerel veritabanını güncelle ve birleştir
        let localData = {};
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) localData = JSON.parse(raw);
        } catch (e) {}

        if (!localData.weeklyEvaluations) localData.weeklyEvaluations = [];

        let updatedCount = 0;
        res.forEach(item => {
          if (item.exam_id === 'MASTER_STATE') return; // Master state ayrı işlenir

          const cloudExam = item.payload;
          if (!cloudExam || !cloudExam.id) return;

          const existingIdx = localData.weeklyEvaluations.findIndex(e => String(e.id) === String(cloudExam.id));
          if (existingIdx >= 0) {
            // Sonuçları birleştir (en güncel olanı koru)
            const localExam = localData.weeklyEvaluations[existingIdx];
            const mergedResults = { ...(localExam.studentResults || {}), ...(cloudExam.studentResults || {}) };
            const mergedScores = { ...(localExam.examScores || {}), ...(cloudExam.examScores || {}) };

            localData.weeklyEvaluations[existingIdx] = {
              ...localExam,
              ...cloudExam,
              studentResults: mergedResults,
              examScores: mergedScores,
              updatedAt: new Date().toISOString()
            };
          } else {
            localData.weeklyEvaluations.unshift(cloudExam);
          }

          // Sınavla birlikte gelen öğrenci listesini de yerel hafızaya ekle / güncelle
          if (Array.isArray(cloudExam.classStudents) && cloudExam.classStudents.length > 0) {
            if (!localData.students) localData.students = [];
            cloudExam.classStudents.forEach(cs => {
              const sIdx = localData.students.findIndex(ls => String(ls.id) === String(cs.id) || (ls.number && String(ls.number) === String(cs.number) && String(ls.branch || '').replace('/', '-') === String(cs.branch || '').replace('/', '-')));
              if (sIdx >= 0) {
                localData.students[sIdx] = { ...localData.students[sIdx], ...cs };
              } else {
                localData.students.push(cs);
              }
            });
          }

          updatedCount++;
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
        this.lastSyncTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
        this.updateSyncUI();

        // UI'ları bilgilendir
        if (window.CompanionOmr && typeof window.CompanionOmr.renderHub === 'function') {
          window.CompanionOmr.ensureActiveExam();
          window.CompanionOmr.renderHub();
        }
        if (typeof window.renderWeeklyEvaluations === 'function') {
          window.renderWeeklyEvaluations();
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
