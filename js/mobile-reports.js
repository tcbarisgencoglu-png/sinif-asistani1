/**
 * SINIF ASİSTANI — MOBİL RAPORLAR & KRİTER ANALİZ MODÜLÜ (MOBILE-REPORTS.JS)
 * Öğrenci Gelişim Raporları, Kriter Karneleri ve Yazdırma / Paylaşma Motoru.
 */

(function(window) {
  'use strict';

  const escapeHTML = window.escapeHTML || (str => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  });
  const showMobileToast = window.showMobileToast || (msg => alert(msg));
  const openBottomSheet = (id) => {
    if (typeof window.openBottomSheet === 'function') {
      return window.openBottomSheet(id);
    }
    const sheet = document.getElementById(id);
    const backdrop = document.getElementById('sheet-backdrop');
    if (sheet) sheet.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  };
  const closeBottomSheet = () => {
    if (typeof window.closeBottomSheet === 'function') {
      return window.closeBottomSheet();
    }
    document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('active'));
    const backdrop = document.getElementById('sheet-backdrop');
    if (backdrop) backdrop.classList.remove('active');
  };
  const isMiddleSchool = () => (window.isMiddleSchool ? window.isMiddleSchool() : false);
  const isStudentInCurrentLevel = (s) => (window.isStudentInCurrentLevel ? window.isStudentInCurrentLevel(s) : true);

  // ==========================================================================
  // 5. RAPORLAR MODÜLÜ (GELİŞİM RAPORLARI)
  // ==========================================================================
  function renderMobileReports() {
    const container = document.getElementById('m-reports-list-container');
    const countBadge = document.getElementById('m-reports-count-badge');
    if (!container) return;

    const state = window.stateManager ? window.stateManager.state : {};
    let reports = state.reports || [];

    // Tarihe göre sırala (en yeni en üstte)
    reports = [...reports].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (countBadge) countBadge.textContent = `${reports.length} Rapor`;

    if (reports.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="printer" class="empty-icon"></i>
          <div class="empty-title">Henüz Rapor Oluşturulmadı</div>
          <div class="empty-desc">Yukarıdaki "+ Rapor Oluştur" butonuna dokunarak haftalık veya aylık gelişim dökümü oluşturabilirsiniz.</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = reports.map(rep => {
      const dateStr = rep.createdAt ? new Date(rep.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tarihsiz';
      const studentCount = rep.students ? rep.students.length : (rep.totalStudents || 0);

      return `
        <div class="m-item-card">
          <div class="m-item-header">
            <div>
              <div class="m-item-title">${escapeHTML(rep.title || 'Gelişim Değerlendirme Raporu')}</div>
              <div style="font-size: 0.75rem; color: var(--m-text-muted); margin-top: 2px;">
                📅 ${escapeHTML(dateStr)}${isMiddleSchool() ? ' • Şube: ' + escapeHTML(rep.branch || 'Tümü') : ''}
              </div>
            </div>
            <span class="m-badge m-badge-active">${studentCount} Öğrenci</span>
          </div>

          <div style="font-size: 0.8rem; color: var(--m-text-muted);">
            Kapsam: ${escapeHTML(rep.rangeLabel || 'Bu Hafta')} • ${escapeHTML(rep.metrics || 'Puan, Ödev, Kitap')}
          </div>

          <div class="m-item-actions">
            <button class="m-btn-sm primary" onclick="window.viewMobileReport('${rep.id}')">
              <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Görüntüle
            </button>
            <button class="m-btn-sm success" onclick="window.shareMobileReport('${rep.id}')">
              <i data-lucide="share-2" style="width: 14px; height: 14px;"></i> Paylaş / Gönder
            </button>
            <button class="m-btn-sm" style="flex: 0 0 42px;" onclick="window.deleteMobileReport('${rep.id}')" title="Sil">
              <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--m-danger);"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================================================
  // GELİŞİM RAPORLARI VE KRİTER ANALİZ MOTORU
  // ==========================================================================

  let currentViewingReportId = null;
  let allReportCardsExpanded = false;

  window.handleReportRangeChange = (val) => {
    const customDiv = document.getElementById('m-report-custom-dates');
    if (!customDiv) return;
    if (val === 'custom') {
      customDiv.style.display = 'grid';
      const startInp = document.getElementById('m-report-start-date');
      const endInp = document.getElementById('m-report-end-date');
      const now = new Date();
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (startInp && !startInp.value) startInp.value = fmt(past);
      if (endInp && !endInp.value) endInp.value = fmt(now);
    } else {
      customDiv.style.display = 'none';
    }
  };

  function calculateReportDateBounds(range, customStart, customEnd) {
    const now = new Date();
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (range === 'today') {
      const todayStr = fmt(now);
      return { startDate: todayStr, endDate: todayStr, label: 'Bugünün Özeti' };
    } else if (range === 'this-week') {
      const day = now.getDay();
      const diffToMon = (day === 0 ? -6 : 1) - day;
      const mon = new Date(now);
      mon.setDate(now.getDate() + diffToMon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { startDate: fmt(mon), endDate: fmt(sun), label: 'Haftalık Gelişim Dökümü' };
    } else if (range === 'this-month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: fmt(firstDay), endDate: fmt(lastDay), label: 'Aylık Performans Özeti' };
    } else if (range === 'last-30') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: fmt(past), endDate: fmt(now), label: 'Son 30 Günlük Gelişim' };
    } else if (range === 'custom') {
      const start = customStart || fmt(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
      const end = customEnd || fmt(now);
      return { startDate: start, endDate: end, label: 'Özel Tarih Aralığı' };
    }
    return { startDate: fmt(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)), endDate: fmt(now), label: 'Gelişim Raporu' };
  }

  function getStudentsForReport(branchFilter = 'all') {
    if (!window.stateManager) return [];
    const isMiddle = isMiddleSchool();
    const all = (window.stateManager.state && window.stateManager.state.students) 
      ? window.stateManager.state.students 
      : (window.stateManager.getStudents(true) || []);
    let list = all.filter(s => isStudentInCurrentLevel(s));
    if (isMiddle && branchFilter && branchFilter !== 'all') {
      list = list.filter(st => st.branch === branchFilter);
    }
    return list;
  }

  function computeStudentReportMetrics(student, scopeStudents, startDateStr, endDateStr, criteria, state) {
    const startD = new Date(startDateStr + 'T00:00:00');
    const endD = new Date(endDateStr + 'T23:59:59');
    const isMiddle = isMiddleSchool();

    const result = {
      id: student.id,
      name: `${student.name || ''} ${student.surname || ''}`.trim(),
      firstName: student.name || '',
      surname: student.surname || '',
      number: student.number || '-',
      branch: student.branch || '',
      photo: student.photo || '',
      gender: student.gender || 'male',
      parentPhone: student.parentPhone || student.phone || '',
      books: null,
      homeworks: null,
      points: null,
      attendance: null,
      exams: null,
      tasks: null
    };

    // 1. KİTAP OKUMA KRİTERİ
    if (criteria.books) {
      const txList = (state.books && state.books.transactions) ? state.books.transactions : [];
      const libList = (state.books && state.books.library) ? state.books.library : [];

      const returnTx = txList.filter(t => {
        if (String(t.studentId) !== String(student.id) || !t.returnDate) return false;
        const d = new Date(t.returnDate);
        return d >= startD && d <= endD;
      });

      let readPages = 0;
      const readBooks = [];
      returnTx.forEach(t => {
        const book = libList.find(b => b.id === t.bookId) || {};
        const p = parseInt(book.pages) || 0;
        readPages += p;
        readBooks.push({
          title: book.title || 'Kitap',
          author: book.author || 'Belirtilmemiş',
          pages: p,
          returnDate: t.returnDate ? new Date(t.returnDate).toLocaleDateString('tr-TR') : '-'
        });
      });

      // Şu an okuduğu kitap
      const curTx = txList.find(t => String(t.studentId) === String(student.id) && t.status === 'reading');
      let currentReading = null;
      if (curTx) {
        const curB = libList.find(b => b.id === curTx.bookId) || {};
        currentReading = {
          title: curB.title || 'Kitap',
          author: curB.author || '',
          pages: parseInt(curB.pages) || 0,
          issueDate: curTx.issueDate ? new Date(curTx.issueDate).toLocaleDateString('tr-TR') : '-'
        };
      }

      // Sınıf içi okuma sıralaması
      const classBookStats = scopeStudents.map(s => {
        const sTx = txList.filter(t => {
          if (String(t.studentId) !== String(s.id) || !t.returnDate) return false;
          const d = new Date(t.returnDate);
          return d >= startD && d <= endD;
        });
        let sPages = 0;
        sTx.forEach(t => {
          const b = libList.find(bk => bk.id === t.bookId);
          if (b) sPages += parseInt(b.pages) || 0;
        });
        return { id: s.id, count: sTx.length, pages: sPages };
      }).sort((a, b) => (b.pages - a.pages) || (b.count - a.count));

      const rankIndex = classBookStats.findIndex(b => String(b.id) === String(student.id));
      const bookRank = rankIndex !== -1 ? (rankIndex + 1) : '-';
      const readPct = libList.length > 0 ? ((readBooks.length / libList.length) * 100).toFixed(0) : '0';

      result.books = {
        count: returnTx.length,
        pages: readPages,
        rank: bookRank,
        percentage: readPct,
        items: readBooks,
        currentReading: currentReading
      };
    }

    // 2. ÖDEV TAKİBİ KRİTERİ
    if (criteria.homeworks) {
      const allHws = (state.homeworks || []).filter(hw => {
        const matchBranch = !isMiddle || !hw.branch || hw.branch === student.branch;
        const hwDate = new Date(hw.dueDate);
        return matchBranch && hwDate >= startD && hwDate <= endD;
      });

      let hwCompleted = 0;
      let hwIncomplete = 0;
      let hwMissing = 0;
      let hwExcused = 0;
      const hwItems = [];

      allHws.forEach(hw => {
        const st = hw.status ? hw.status[student.id] : undefined;
        let statusText = 'Değerlendirilmedi';
        let badgeColor = '#64748b';
        let bg = 'rgba(100, 116, 139, 0.1)';

        if (st === 'completed') {
          hwCompleted++;
          statusText = 'Yapıldı (Tam)';
          badgeColor = '#10b981';
          bg = 'rgba(16, 185, 129, 0.12)';
        } else if (st === 'incomplete') {
          hwIncomplete++;
          statusText = 'Eksik / Yarım';
          badgeColor = '#f59e0b';
          bg = 'rgba(245, 158, 11, 0.12)';
        } else if (st === 'missing') {
          hwMissing++;
          statusText = 'Yapılmadı';
          badgeColor = '#ef4444';
          bg = 'rgba(239, 68, 68, 0.12)';
        } else if (st === 'excused') {
          hwExcused++;
          statusText = 'Muaf';
          badgeColor = '#6366f1';
          bg = 'rgba(99, 102, 241, 0.12)';
        }

        hwItems.push({
          title: hw.title || 'Ödev',
          dueDate: hw.dueDate ? new Date(hw.dueDate).toLocaleDateString('tr-TR') : '-',
          status: st || 'none',
          statusText: statusText,
          badgeColor: badgeColor,
          bg: bg
        });
      });

      const totalHw = allHws.length;
      const successPct = totalHw > 0 
        ? Math.round(((hwCompleted + (hwIncomplete * 0.5)) / totalHw) * 100) 
        : 100;

      result.homeworks = {
        total: totalHw,
        completed: hwCompleted,
        incomplete: hwIncomplete,
        missing: hwMissing,
        excused: hwExcused,
        percentage: successPct,
        items: hwItems
      };
    }

    // 3. DAVRANIŞ PUANI KRİTERİ
    if (criteria.points) {
      const allPerf = (state.performance || []).filter(p => {
        if (String(p.studentId) !== String(student.id)) return false;
        const d = new Date(p.date);
        return d >= startD && d <= endD;
      });

      let posCount = 0;
      let posSum = 0;
      let devCount = 0;
      let devSum = 0;
      const perfItems = [];

      allPerf.forEach(p => {
        const pt = parseInt(p.point) || 0;
        const isPos = p.type === 'positive' || pt >= 0;
        if (isPos) {
          posCount++;
          posSum += pt;
        } else {
          devCount++;
          devSum += Math.abs(pt);
        }
        perfItems.push({
          date: p.date ? new Date(p.date).toLocaleDateString('tr-TR') : '-',
          reason: p.reason || (isPos ? 'Olumlu Davranış' : 'Geliştirilmesi Gereken Davranış'),
          point: pt,
          isPositive: isPos
        });
      });

      result.points = {
        totalScore: student.points || 0,
        netPeriodScore: posSum - devSum,
        positiveCount: posCount,
        positiveSum: posSum,
        devCount: devCount,
        devSum: devSum,
        items: perfItems
      };
    }

    // 4. YOKLAMA & DEVAMSIZLIK KRİTERİ
    if (criteria.attendance) {
      const absentDates = [];
      const attMap = state.attendance || {};

      for (const dStr in attMap) {
        if (dStr >= startDateStr && dStr <= endDateStr) {
          if (Array.isArray(attMap[dStr]) && attMap[dStr].includes(student.id)) {
            absentDates.push(dStr);
          }
        }
      }

      absentDates.sort();
      const formattedAbsentDates = absentDates.map(d => {
        const parts = d.split('-');
        const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
      });

      result.attendance = {
        absentDays: absentDates.length,
        dates: formattedAbsentDates
      };
    }

    // 5. SINAVLAR KRİTERİ
    if (criteria.exams) {
      const evalList = (state.weeklyEvaluations || []).filter(e => {
        const matchBranch = !isMiddle || !e.branch || e.branch === student.branch;
        if (!matchBranch) return false;

        // Tarih kontrolü
        if (e.date || e.createdAt) {
          const d = new Date(e.date || e.createdAt);
          if (!isNaN(d.getTime()) && d >= startD && d <= endD) return true;
        }

        // Hafta kontrolü
        if (e.weekId) {
          const parts = e.weekId.split('-W');
          if (parts.length === 2 && window.getDayInWeek) {
            const y = parseInt(parts[0]);
            const w = parseInt(parts[1]);
            const wDate = window.getDayInWeek(y, w, 4); // Perşembe
            if (!isNaN(wDate.getTime()) && wDate >= startD && wDate <= endD) return true;
          }
        }
        return false;
      });

      let participated = 0;
      let totalExamScore = 0;
      const examItems = [];

      evalList.forEach(e => {
        let sc = undefined;
        if (e.studentResults && e.studentResults[student.id]) {
          sc = e.studentResults[student.id].score;
        } else if (e.examScores && e.examScores[student.id] !== undefined) {
          sc = e.examScores[student.id];
        }

        const hasScore = sc !== undefined && sc !== null && sc !== '';
        if (hasScore) {
          participated++;
          totalExamScore += parseFloat(sc);
        }

        let detailText = '';
        if (e.studentResults && e.studentResults[student.id]) {
          const res = e.studentResults[student.id];
          detailText = `${res.correct || 0}D / ${res.wrong || 0}Y / ${res.blank || 0}B • Net: ${typeof res.net === 'number' ? res.net.toFixed(1) : (res.net || '-')}`;
        }

        examItems.push({
          title: e.examName || e.title || 'Haftalık Değerlendirme',
          date: (e.date || e.createdAt) ? new Date(e.date || e.createdAt).toLocaleDateString('tr-TR') : '-',
          score: hasScore ? parseFloat(sc) : null,
          details: detailText
        });
      });

      const avgScore = participated > 0 ? (totalExamScore / participated).toFixed(1) : '-';

      // Sınıf sınav ortalamaları ve sıralama
      const classExams = scopeStudents.map(s => {
        let sPart = 0;
        let sTotal = 0;
        evalList.forEach(e => {
          let sc = undefined;
          if (e.studentResults && e.studentResults[s.id]) {
            sc = e.studentResults[s.id].score;
          } else if (e.examScores && e.examScores[s.id] !== undefined) {
            sc = e.examScores[s.id];
          }
          if (sc !== undefined && sc !== null && sc !== '') {
            sPart++;
            sTotal += parseFloat(sc);
          }
        });
        return { id: s.id, avg: sPart > 0 ? (sTotal / sPart) : 0, participated: sPart };
      }).sort((a, b) => (b.avg - a.avg) || (b.participated - a.participated));

      const examRankIdx = classExams.findIndex(x => String(x.id) === String(student.id));
      const examRank = examRankIdx !== -1 ? (examRankIdx + 1) : '-';

      result.exams = {
        totalExams: evalList.length,
        participated: participated,
        avgScore: avgScore,
        rank: examRank,
        items: examItems
      };
    }

    // 6. GÖREVLER KRİTERİ
    if (criteria.tasks) {
      const studentTasks = (state.tasks || []).filter(t => {
        if (String(t.studentId) !== String(student.id)) return false;
        const d = new Date(t.dueDate || t.createdAt);
        return d >= startD && d <= endD;
      });

      const completed = studentTasks.filter(t => t.status === 'completed');
      const pending = studentTasks.filter(t => t.status !== 'completed');

      result.tasks = {
        total: studentTasks.length,
        completed: completed.length,
        pending: pending.length,
        items: studentTasks.map(t => ({
          title: t.title || 'Görev',
          dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('tr-TR') : '-',
          status: t.status || 'active',
          statusText: t.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'
        }))
      };
    }

    return result;
  }

  window.openCreateReportModal = () => {
    const isMiddle = isMiddleSchool();
    const branchGroup = document.getElementById('m-report-branch-group');
    const branchSelect = document.getElementById('m-report-branch-select');

    if (branchGroup && branchSelect) {
      if (isMiddle) {
        branchGroup.style.display = 'block';
        const branches = (typeof window.getUniqueBranches === 'function') 
          ? window.getUniqueBranches() 
          : [];
        let optHtml = '<option value="all">Tüm Şubeler</option>';
        branches.forEach(b => {
          const sel = (b === activeBranch) ? 'selected' : '';
          optHtml += `<option value="${escapeHTML(b)}" ${sel}>${escapeHTML(b)} Şubesi</option>`;
        });
        branchSelect.innerHTML = optHtml;
      } else {
        branchGroup.style.display = 'none';
      }
    }

    // Reset range dropdown to default
    const rangeSelect = document.getElementById('m-report-range');
    if (rangeSelect) {
      rangeSelect.value = 'this-week';
      window.handleReportRangeChange('this-week');
    }

    openBottomSheet('modal-create-report');
  };

  window.generateNewReport = () => {
    const rangeSelect = document.getElementById('m-report-range');
    const customStartInp = document.getElementById('m-report-start-date');
    const customEndInp = document.getElementById('m-report-end-date');
    const branchSelect = document.getElementById('m-report-branch-select');

    const chkPts = document.getElementById('m-rep-chk-points');
    const chkHw = document.getElementById('m-rep-chk-hw');
    const chkBk = document.getElementById('m-rep-chk-books');
    const chkAtt = document.getElementById('m-rep-chk-att');
    const chkExams = document.getElementById('m-rep-chk-exams');
    const chkTasks = document.getElementById('m-rep-chk-tasks');

    const criteria = {
      points: chkPts ? chkPts.checked : true,
      homeworks: chkHw ? chkHw.checked : true,
      books: chkBk ? chkBk.checked : true,
      attendance: chkAtt ? chkAtt.checked : true,
      exams: chkExams ? chkExams.checked : false,
      tasks: chkTasks ? chkTasks.checked : false
    };

    if (!criteria.points && !criteria.homeworks && !criteria.books && !criteria.attendance && !criteria.exams && !criteria.tasks) {
      showMobileToast('⚠️ Lütfen rapora dahil edilecek en az bir kriter seçin!');
      return;
    }

    const range = rangeSelect ? rangeSelect.value : 'this-week';
    const bounds = calculateReportDateBounds(
      range, 
      customStartInp ? customStartInp.value : '', 
      customEndInp ? customEndInp.value : ''
    );

    const branch = (branchSelect && branchSelect.value) ? branchSelect.value : activeBranch;
    const students = getStudentsForReport(branch);

    if (students.length === 0) {
      showMobileToast('⚠️ Rapora dahil edilecek kayıtlı öğrenci bulunamadı!');
      return;
    }

    const state = window.stateManager ? window.stateManager.state : {};
    const reportStudents = students.map(st => 
      computeStudentReportMetrics(st, students, bounds.startDate, bounds.endDate, criteria, state)
    );

    // Aktif kriter isimleri
    const activeMetricLabels = [];
    if (criteria.points) activeMetricLabels.push('Davranış Puanı');
    if (criteria.homeworks) activeMetricLabels.push('Ödev Takibi');
    if (criteria.books) activeMetricLabels.push('Kitap Okuma');
    if (criteria.attendance) activeMetricLabels.push('Yoklama');
    if (criteria.exams) activeMetricLabels.push('Sınavlar');
    if (criteria.tasks) activeMetricLabels.push('Görevler');

    const branchLabel = (branch === 'all' || !branch) ? 'Tüm Sınıflar' : `${branch} Şubesi`;
    const newReport = {
      id: 'rep_' + Date.now(),
      title: `${branchLabel} ${bounds.label}`,
      range: range,
      rangeLabel: bounds.label,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      branch: branch,
      criteria: criteria,
      metrics: activeMetricLabels.join(', '),
      totalStudents: reportStudents.length,
      students: reportStudents,
      createdAt: new Date().toISOString()
    };

    if (!window.stateManager.state.reports) window.stateManager.state.reports = [];
    window.stateManager.state.reports.push(newReport);
    window.stateManager.saveState();

    window.closeBottomSheet();
    window.vibrate(30);
    showMobileToast('✅ Gelişim raporu tüm kriterleriyle üretildi!');
    renderMobileReports();
    
    // Raporu doğrudan görüntüleme modunda aç
    setTimeout(() => {
      window.viewMobileReport(newReport.id);
    }, 300);
  };

  function renderStudentReportDetailsHtml(st, criteria) {
    let sectionsHtml = '';

    // A. 📚 KİTAP OKUMA KRİTERİ
    if (criteria.books && st.books) {
      const b = st.books;
      let booksListHtml = '';
      if (b.items && b.items.length > 0) {
        booksListHtml = `
          <div class="m-rep-detail-list">
            ${b.items.map(bk => `
              <div class="m-rep-detail-item">
                <div>
                  <div style="font-weight: 700; color: var(--m-text);">${escapeHTML(bk.title)}</div>
                  <div style="font-size: 0.68rem; color: var(--m-text-muted);">${escapeHTML(bk.author)} • ${bk.pages} Sayfa</div>
                </div>
                <span class="m-rep-pill" style="background: rgba(99, 102, 241, 0.12); color: #6366f1;">
                  📅 ${escapeHTML(bk.returnDate)}
                </span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        booksListHtml = `<div style="font-size: 0.72rem; color: var(--m-text-muted); padding: 4px 0;">Seçili dönemde teslim edilen kitap kaydı bulunmuyor.</div>`;
      }

      let curReadingHtml = '';
      if (b.currentReading) {
        curReadingHtml = `
          <div style="background: rgba(99, 102, 241, 0.08); border: 1px dashed rgba(99, 102, 241, 0.3); border-radius: 8px; padding: 6px 10px; margin-bottom: 8px; font-size: 0.74rem;">
            📖 <strong>Şu An Okuyor:</strong> ${escapeHTML(b.currentReading.title)} (${b.currentReading.pages} Sayfa)
          </div>
        `;
      }

      sectionsHtml += `
        <div class="m-rep-criterion-card">
          <div class="m-rep-criterion-title" style="color: #6366f1;">
            <span>📚</span>
            <span>Kitap Okuma İstatistikleri</span>
          </div>

          <div class="m-rep-stat-grid">
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #6366f1;">${b.count}</div>
              <div class="m-rep-stat-lbl">Okunan Kitap</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #6366f1;">${b.pages}</div>
              <div class="m-rep-stat-lbl">Toplam Sayfa</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #6366f1;">#${b.rank}</div>
              <div class="m-rep-stat-lbl">Sınıf Sırası</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #6366f1;">%${b.percentage}</div>
              <div class="m-rep-stat-lbl">Kütüphane Oranı</div>
            </div>
          </div>

          ${curReadingHtml}
          ${booksListHtml}
        </div>
      `;
    }

    // B. 📝 ÖDEV TAKİBİ KRİTERİ
    if (criteria.homeworks && st.homeworks) {
      const hw = st.homeworks;
      let hwListHtml = '';
      if (hw.items && hw.items.length > 0) {
        hwListHtml = `
          <div class="m-rep-detail-list">
            ${hw.items.map(item => `
              <div class="m-rep-detail-item">
                <div>
                  <div style="font-weight: 700; color: var(--m-text);">${escapeHTML(item.title)}</div>
                  <div style="font-size: 0.68rem; color: var(--m-text-muted);">Son Teslim: ${escapeHTML(item.dueDate)}</div>
                </div>
                <span class="m-rep-pill" style="background: ${item.bg}; color: ${item.badgeColor};">
                  ${escapeHTML(item.statusText)}
                </span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        hwListHtml = `<div style="font-size: 0.72rem; color: var(--m-text-muted); padding: 4px 0;">Seçili dönemde tanımlı ödev bulunmuyor.</div>`;
      }

      sectionsHtml += `
        <div class="m-rep-criterion-card">
          <div class="m-rep-criterion-title" style="color: #f59e0b;">
            <span>📝</span>
            <span>Ödev Takip Analizi</span>
          </div>

          <div class="m-rep-stat-grid">
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #10b981;">${hw.completed}</div>
              <div class="m-rep-stat-lbl">Yapıldı (Tam)</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #f59e0b;">${hw.incomplete}</div>
              <div class="m-rep-stat-lbl">Eksik / Yarım</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #ef4444;">${hw.missing}</div>
              <div class="m-rep-stat-lbl">Yapılmadı</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #6366f1;">%${hw.percentage}</div>
              <div class="m-rep-stat-lbl">Başarı Oranı</div>
            </div>
          </div>

          ${hwListHtml}
        </div>
      `;
    }

    // C. ⭐ DAVRANIŞ PUANI KRİTERİ
    if (criteria.points && st.points) {
      const p = st.points;
      let perfListHtml = '';
      if (p.items && p.items.length > 0) {
        perfListHtml = `
          <div class="m-rep-detail-list">
            ${p.items.map(item => `
              <div class="m-rep-detail-item">
                <div>
                  <div style="font-weight: 700; color: var(--m-text);">${escapeHTML(item.reason)}</div>
                  <div style="font-size: 0.68rem; color: var(--m-text-muted);">${escapeHTML(item.date)}</div>
                </div>
                <span class="m-rep-pill" style="background: ${item.isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; color: ${item.isPositive ? '#10b981' : '#ef4444'}; font-weight: 800;">
                  ${item.point >= 0 ? '+' + item.point : item.point} Puan
                </span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        perfListHtml = `<div style="font-size: 0.72rem; color: var(--m-text-muted); padding: 4px 0;">Seçili dönemde özel davranış puanı kaydı bulunmuyor.</div>`;
      }

      sectionsHtml += `
        <div class="m-rep-criterion-card">
          <div class="m-rep-criterion-title" style="color: #10b981;">
            <span>⭐</span>
            <span>Davranış Puanı ve Gelişim Kayıtları</span>
          </div>

          <div class="m-rep-stat-grid">
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #10b981;">${p.totalScore}</div>
              <div class="m-rep-stat-lbl">Genel Puan</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: ${p.netPeriodScore >= 0 ? '#10b981' : '#ef4444'};">
                ${p.netPeriodScore >= 0 ? '+' + p.netPeriodScore : p.netPeriodScore}
              </div>
              <div class="m-rep-stat-lbl">Dönem Net Puanı</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #10b981;">${p.positiveCount}</div>
              <div class="m-rep-stat-lbl">Olumlu Davranış</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #ef4444;">${p.devCount}</div>
              <div class="m-rep-stat-lbl">Geliştirilmeli</div>
            </div>
          </div>

          ${perfListHtml}
        </div>
      `;
    }

    // D. 📅 YOKLAMA & DEVAMSIZLIK KRİTERİ
    if (criteria.attendance && st.attendance) {
      const att = st.attendance;
      let attListHtml = '';
      if (att.dates && att.dates.length > 0) {
        attListHtml = `
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
            ${att.dates.map(dt => `
              <span class="m-rep-pill" style="background: rgba(239, 68, 68, 0.12); color: #ef4444; padding: 4px 8px;">
                ❌ ${escapeHTML(dt)}
              </span>
            `).join('')}
          </div>
        `;
      } else {
        attListHtml = `
          <div style="font-size: 0.76rem; color: #10b981; font-weight: 700; background: rgba(16, 185, 129, 0.08); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2);">
            🎉 Tebrikler! Seçili dönemde hiç devamsızlık yapılmadı, derslere eksiksiz katıldı.
          </div>
        `;
      }

      sectionsHtml += `
        <div class="m-rep-criterion-card">
          <div class="m-rep-criterion-title" style="color: #ef4444;">
            <span>📅</span>
            <span>Yoklama ve Devamsızlık Durumu</span>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--m-surface); border: 1px solid var(--m-border); border-radius: 10px; padding: 8px 12px; margin-bottom: 8px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--m-text);">Toplam Devamsızlık:</div>
            <span class="m-rep-pill" style="background: ${att.absentDays > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)'}; color: ${att.absentDays > 0 ? '#ef4444' : '#10b981'}; font-size: 0.85rem; font-weight: 800; padding: 4px 10px;">
              ${att.absentDays} Gün
            </span>
          </div>

          ${attListHtml}
        </div>
      `;
    }

    // E. 🏆 SINAVLAR KRİTERİ
    if (criteria.exams && st.exams) {
      const ex = st.exams;
      let exListHtml = '';
      if (ex.items && ex.items.length > 0) {
        exListHtml = `
          <div class="m-rep-detail-list">
            ${ex.items.map(item => `
              <div class="m-rep-detail-item">
                <div>
                  <div style="font-weight: 700; color: var(--m-text);">${escapeHTML(item.title)}</div>
                  <div style="font-size: 0.68rem; color: var(--m-text-muted);">Tarih: ${escapeHTML(item.date)}</div>
                </div>
                <span class="m-rep-pill" style="background: rgba(236, 72, 153, 0.12); color: #ec4899; font-weight: 800;">
                  ${item.score !== null ? item.score + ' Puan' : 'Girilmedi'}
                </span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        exListHtml = `<div style="font-size: 0.72rem; color: var(--m-text-muted); padding: 4px 0;">Seçili dönemde kayıtlı sınav bulunmuyor.</div>`;
      }

      sectionsHtml += `
        <div class="m-rep-criterion-card">
          <div class="m-rep-criterion-title" style="color: #ec4899;">
            <span>🏆</span>
            <span>Sınav ve Değerlendirme Analizi</span>
          </div>

          <div class="m-rep-stat-grid">
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #ec4899;">${ex.participated}</div>
              <div class="m-rep-stat-lbl">Katıldığı Sınav</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #ec4899;">${ex.avgScore}</div>
              <div class="m-rep-stat-lbl">Not Ortalaması</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #ec4899;">#${ex.rank}</div>
              <div class="m-rep-stat-lbl">Sınıf Başarı Sırası</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #64748b;">${ex.totalExams}</div>
              <div class="m-rep-stat-lbl">Toplam Sınav</div>
            </div>
          </div>

          ${exListHtml}
        </div>
      `;
    }

    // F. 🎯 GÖREV VE SORUMLULUK KRİTERİ
    if (criteria.tasks && st.tasks) {
      const ts = st.tasks;
      let tsListHtml = '';
      if (ts.items && ts.items.length > 0) {
        tsListHtml = `
          <div class="m-rep-detail-list">
            ${ts.items.map(item => `
              <div class="m-rep-detail-item">
                <div>
                  <div style="font-weight: 700; color: var(--m-text);">${escapeHTML(item.title)}</div>
                  <div style="font-size: 0.68rem; color: var(--m-text-muted);">Son Teslim: ${escapeHTML(item.dueDate)}</div>
                </div>
                <span class="m-rep-pill" style="background: ${item.status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)'}; color: ${item.status === 'completed' ? '#10b981' : '#f59e0b'};">
                  ${escapeHTML(item.statusText)}
                </span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        tsListHtml = `<div style="font-size: 0.72rem; color: var(--m-text-muted); padding: 4px 0;">Seçili dönemde görevlendirme kaydı bulunmuyor.</div>`;
      }

      sectionsHtml += `
        <div class="m-rep-criterion-card">
          <div class="m-rep-criterion-title" style="color: #06b6d4;">
            <span>🎯</span>
            <span>Görev ve Sorumluluk Takibi</span>
          </div>

          <div class="m-rep-stat-grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #10b981;">${ts.completed}</div>
              <div class="m-rep-stat-lbl">Tamamlanan</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #f59e0b;">${ts.pending}</div>
              <div class="m-rep-stat-lbl">Bekleyen</div>
            </div>
            <div class="m-rep-stat-box">
              <div class="m-rep-stat-val" style="color: #06b6d4;">${ts.total}</div>
              <div class="m-rep-stat-lbl">Toplam Görev</div>
            </div>
          </div>

          ${tsListHtml}
        </div>
      `;
    }

    return sectionsHtml;
  }

  window.viewMobileReport = (repId) => {
    currentViewingReportId = repId;
    allReportCardsExpanded = false;
    const state = window.stateManager ? window.stateManager.state : {};
    const rep = (state.reports || []).find(r => r.id === repId);
    if (!rep) return;

    const titleEl = document.getElementById('m-view-report-title');
    const subEl = document.getElementById('m-view-report-subtitle');
    const criteriaBarEl = document.getElementById('m-view-report-criteria-bar');
    const contentEl = document.getElementById('m-view-report-content');
    const searchInp = document.getElementById('m-rep-student-search');
    const toggleAllBtn = document.getElementById('m-rep-toggle-all-btn');

    if (searchInp) searchInp.value = '';
    if (toggleAllBtn) toggleAllBtn.textContent = 'Tümünü Aç';

    if (titleEl) titleEl.textContent = rep.title || 'Gelişim Raporu Detayı';
    
    // Tarih aralığı formatı
    const startFmt = rep.startDate ? new Date(rep.startDate).toLocaleDateString('tr-TR') : '';
    const endFmt = rep.endDate ? new Date(rep.endDate).toLocaleDateString('tr-TR') : '';
    const rangeText = (startFmt && endFmt) ? `${startFmt} - ${endFmt}` : (rep.rangeLabel || 'Bu Hafta');
    const studentCount = (rep.students && rep.students.length) || rep.totalStudents || 0;
    
    if (subEl) {
      subEl.textContent = `📅 ${rangeText} • 👥 ${studentCount} Öğrenci`;
    }

    // Kriter rozetlerini oluştur
    const crit = rep.criteria || { points: true, homeworks: true, books: true, attendance: true };
    if (criteriaBarEl) {
      let critHtml = '';
      if (crit.points) critHtml += `<span class="m-rep-pill" style="background: rgba(16, 185, 129, 0.12); color: #10b981;">⭐ Davranış</span>`;
      if (crit.homeworks) critHtml += `<span class="m-rep-pill" style="background: rgba(245, 158, 11, 0.12); color: #f59e0b;">📝 Ödev</span>`;
      if (crit.books) critHtml += `<span class="m-rep-pill" style="background: rgba(99, 102, 241, 0.12); color: #6366f1;">📚 Kitap</span>`;
      if (crit.attendance) critHtml += `<span class="m-rep-pill" style="background: rgba(239, 68, 68, 0.12); color: #ef4444;">📅 Yoklama</span>`;
      if (crit.exams) critHtml += `<span class="m-rep-pill" style="background: rgba(236, 72, 153, 0.12); color: #ec4899;">🏆 Sınavlar</span>`;
      if (crit.tasks) critHtml += `<span class="m-rep-pill" style="background: rgba(6, 182, 212, 0.12); color: #06b6d4;">🎯 Görevler</span>`;
      criteriaBarEl.innerHTML = critHtml;
    }

    // Öğrenci listesini ve detaylarını hazırla (Eski kayıt ise otomatik hesapla)
    let stList = rep.students || [];
    const scopeStudents = getStudentsForReport(rep.branch || 'all');

    // Eğer eski bir rapor açıldıysa ve detay objeleri eksikse, anında zenginleştir
    stList = stList.map(st => {
      if (st.books !== undefined && st.homeworks !== undefined) return st;
      const fullStudentObj = scopeStudents.find(s => s.id === st.id) || st;
      return computeStudentReportMetrics(fullStudentObj, scopeStudents, rep.startDate || '2026-01-01', rep.endDate || '2026-12-31', crit, state);
    });

    if (contentEl) {
      if (stList.length === 0) {
        contentEl.innerHTML = `
          <div class="empty-state" style="padding: 2rem 1rem;">
            <i data-lucide="users" class="empty-icon"></i>
            <div class="empty-title">Raporda Öğrenci Yok</div>
            <div class="empty-desc">Bu kriter ve şubeye uygun öğrenci bulunamadı.</div>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        openBottomSheet('modal-view-report');
        return;
      }

      contentEl.innerHTML = `
        <div style="font-size: 0.73rem; color: var(--m-text-muted); margin-bottom: 0.6rem; display: flex; justify-content: space-between; align-items: center;">
          <span>Öğrencinin detaylarını görmek için kartına dokunun 👇</span>
          <span style="font-weight: 700;">${stList.length} Kayıt</span>
        </div>

        <div id="m-rep-students-accordion-container" style="display: flex; flex-direction: column;">
          ${stList.map((st, i) => {
            const avatarHtml = st.photo
              ? `<img src="${st.photo}" alt="${escapeHTML(st.name)}">`
              : `${(st.name[0] || '').toUpperCase()}${(st.surname[0] || '').toUpperCase()}`;

            let headerBadges = '';
            if (crit.points && st.points) {
              headerBadges += `<span class="m-rep-pill" style="background: rgba(16, 185, 129, 0.12); color: #10b981;">⭐ ${st.points.totalScore} P</span>`;
            }
            if (crit.books && st.books) {
              headerBadges += `<span class="m-rep-pill" style="background: rgba(99, 102, 241, 0.12); color: #6366f1;">📚 ${st.books.count} Kitap</span>`;
            }
            if (crit.homeworks && st.homeworks) {
              headerBadges += `<span class="m-rep-pill" style="background: rgba(245, 158, 11, 0.12); color: #f59e0b;">📝 %${st.homeworks.percentage} Ödev</span>`;
            }
            if (crit.attendance && st.attendance) {
              headerBadges += `<span class="m-rep-pill" style="background: ${st.attendance.absentDays > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)'}; color: ${st.attendance.absentDays > 0 ? '#ef4444' : '#10b981'};">📅 ${st.attendance.absentDays} Gün Dev.</span>`;
            }

            const branchInfo = st.branch ? ` • Şube: ${escapeHTML(st.branch)}` : '';
            const detailsHtml = renderStudentReportDetailsHtml(st, crit);

            return `
              <div class="m-rep-student-card" id="m-rep-student-${st.id}" data-name="${escapeHTML((st.name || '').toLowerCase())}" data-number="${escapeHTML(st.number || '')}">
                <div class="m-rep-student-header" onclick="window.toggleReportStudent('${st.id}')">
                  <div class="m-rep-avatar-circle">
                    ${avatarHtml}
                  </div>
                  <div class="m-rep-student-info">
                    <div class="m-rep-student-name">${i + 1}. ${escapeHTML(st.name)}</div>
                    <div class="m-rep-student-meta">
                      <span>No: ${escapeHTML(st.number || '-')}</span>
                      <span>${branchInfo}</span>
                    </div>
                    <div class="m-rep-badges-row">
                      ${headerBadges}
                    </div>
                  </div>
                  <svg class="m-rep-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>

                <div class="m-rep-student-body" id="m-rep-body-${st.id}">
                  ${detailsHtml}

                  <div class="m-rep-action-btn-row">
                    <button type="button" class="m-btn-sm success" style="flex: 1; padding: 9px 12px; font-weight: 800; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;" onclick="window.shareStudentReportWhatsApp('${rep.id}', '${st.id}')">
                      <span>📲 Velisine WhatsApp ile Gönder</span>
                    </button>
                    <button type="button" class="m-btn-sm" style="flex: 0 0 46px; border: 1.5px solid var(--m-border); background: var(--m-surface); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center;" onclick="window.printStudentReport('${rep.id}', '${st.id}')" title="Bu Öğrenciyi Yazdır">
                      <i data-lucide="printer" style="width: 16px; height: 16px; color: var(--m-primary);"></i>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top: 1.25rem; display: flex; gap: 8px;">
          <button class="subview-primary-action-btn" style="flex: 1;" onclick="window.shareMobileReport('${rep.id}')">
            <i data-lucide="share-2" style="width: 18px; height: 18px;"></i> Rapor Özetini Paylaş
          </button>
          <button type="button" class="m-btn-sm" style="flex: 0 0 50px; background: rgba(99, 102, 241, 0.12); color: var(--m-primary); border: none; border-radius: 12px; display: flex; align-items: center; justify-content: center;" onclick="window.printMobileReport()" title="Yazdır / PDF">
            <i data-lucide="printer" style="width: 20px; height: 20px;"></i>
          </button>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
    openBottomSheet('modal-view-report');
  };

  window.toggleReportStudent = (studentId) => {
    const card = document.getElementById(`m-rep-student-${studentId}`);
    if (!card) return;
    card.classList.toggle('expanded');
    window.vibrate(15);
  };

  window.toggleAllReportStudents = () => {
    const container = document.getElementById('m-rep-students-accordion-container');
    const toggleBtn = document.getElementById('m-rep-toggle-all-btn');
    if (!container) return;

    allReportCardsExpanded = !allReportCardsExpanded;
    const cards = container.querySelectorAll('.m-rep-student-card');
    cards.forEach(c => {
      if (allReportCardsExpanded) {
        c.classList.add('expanded');
      } else {
        c.classList.remove('expanded');
      }
    });

    if (toggleBtn) {
      toggleBtn.textContent = allReportCardsExpanded ? 'Tümünü Daralt' : 'Tümünü Aç';
    }
  };

  window.filterReportStudents = (query) => {
    const term = (query || '').toLowerCase().trim();
    const container = document.getElementById('m-rep-students-accordion-container');
    if (!container) return;

    const cards = container.querySelectorAll('.m-rep-student-card');
    cards.forEach(c => {
      const name = c.getAttribute('data-name') || '';
      const num = c.getAttribute('data-number') || '';
      if (!term || name.includes(term) || num.includes(term)) {
        c.style.display = 'block';
      } else {
        c.style.display = 'none';
      }
    });
  };

  window.shareStudentReportWhatsApp = (repId, studentId) => {
    const state = window.stateManager.state;
    const rep = (state.reports || []).find(r => r.id === repId);
    if (!rep) return;

    const st = (rep.students || []).find(s => String(s.id) === String(studentId));
    if (!st) return;

    const crit = rep.criteria || { points: true, homeworks: true, books: true, attendance: true };
    const dateStr = new Date().toLocaleDateString('tr-TR');
    const startFmt = rep.startDate ? new Date(rep.startDate).toLocaleDateString('tr-TR') : '';
    const endFmt = rep.endDate ? new Date(rep.endDate).toLocaleDateString('tr-TR') : '';

    let msg = `*ÖĞRENCİ GELİŞİM RAPORU*\n`;
    if (startFmt && endFmt) msg += `📅 *Dönem:* ${startFmt} - ${endFmt}\n`;
    msg += `👤 *Öğrenci:* ${st.name}`;
    if (st.number && st.number !== '-') msg += ` (No: ${st.number})`;
    if (st.branch) msg += ` | Şube: ${st.branch}`;
    msg += `\n----------------------------------------\n`;

    // 1. Kitap Okuma
    if (crit.books && st.books) {
      msg += `📚 *Kitap Okuma:* ${st.books.count} Kitap (${st.books.pages} Sayfa)`;
      if (st.books.rank && st.books.rank !== '-') msg += ` | Sınıf Sırası: #${st.books.rank}`;
      msg += `\n`;
      if (st.books.items && st.books.items.length > 0) {
        st.books.items.slice(0, 3).forEach(bk => {
          msg += `   • ${bk.title} (${bk.pages} sf)\n`;
        });
      }
    }

    // 2. Ödev Takibi
    if (crit.homeworks && st.homeworks) {
      msg += `📝 *Ödev Takibi:* ${st.homeworks.completed} Yapıldı, ${st.homeworks.incomplete} Eksik, ${st.homeworks.missing} Yapılmadı (%${st.homeworks.percentage} Başarı)\n`;
    }

    // 3. Davranış Puanı
    if (crit.points && st.points) {
      const net = st.points.netPeriodScore >= 0 ? '+' + st.points.netPeriodScore : st.points.netPeriodScore;
      msg += `⭐ *Davranış Puanı:* Toplam: ${st.points.totalScore} Puan (Dönem Net: ${net})\n`;
    }

    // 4. Yoklama & Devamsızlık
    if (crit.attendance && st.attendance) {
      msg += `📅 *Devamsızlık:* ${st.attendance.absentDays === 0 ? '0 Gün (Eksiksiz Katılım)' : st.attendance.absentDays + ' Gün'}\n`;
    }

    // 5. Sınavlar
    if (crit.exams && st.exams) {
      msg += `🏆 *Sınav Değerlendirmesi:* Not Ortalaması: ${st.exams.avgScore} | Sınıf Sırası: #${st.exams.rank}\n`;
    }

    // 6. Görevler
    if (crit.tasks && st.tasks) {
      msg += `🎯 *Görev ve Sorumluluk:* ${st.tasks.completed} Tamamlandı, ${st.tasks.pending} Bekleyen\n`;
    }

    msg += `----------------------------------------\n`;
    msg += `*Rapor Tarihi:* ${dateStr}\n`;
    msg += `_Sınıf Asistanı ile hazırlanmıştır._`;

    // Telefon no varsa doğrudan o numaraya yönlendir
    const phone = st.parentPhone || '';
    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('0') && cleanedPhone.length === 11) {
      cleanedPhone = '90' + cleanedPhone.substring(1);
    } else if (cleanedPhone.length === 10) {
      cleanedPhone = '90' + cleanedPhone;
    }

    if (cleanedPhone && cleanedPhone.length >= 10) {
      const waUrl = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    } else {
      if (navigator.share) {
        navigator.share({
          title: `${st.name} Gelişim Raporu`,
          text: msg
        }).catch(() => {
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
          window.open(waUrl, '_blank');
        });
      } else {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
      }
    }
  };

  window.shareMobileReport = (repId) => {
    const state = window.stateManager.state;
    const rep = (state.reports || []).find(r => r.id === repId);
    if (!rep) return;

    const dateStr = new Date(rep.createdAt || Date.now()).toLocaleDateString('tr-TR');
    let summaryText = `📊 *${rep.title}*\n📅 Tarih: ${dateStr}\n👥 Öğrenci Sayısı: ${rep.students ? rep.students.length : 0}\n`;
    summaryText += `📌 Kriterler: ${rep.metrics || 'Tüm Alanlar'}\n\n`;

    (rep.students || []).slice(0, 15).forEach((st, i) => {
      let line = `${i + 1}. ${st.name}`;
      if (st.points) line += ` → ${st.points.totalScore} P`;
      if (st.books) line += ` (Kitap: ${st.books.count})`;
      if (st.homeworks) line += ` (Ödev: %${st.homeworks.percentage})`;
      summaryText += line + '\n';
    });

    if (rep.students && rep.students.length > 15) {
      summaryText += `\n... ve diğer ${rep.students.length - 15} öğrenci.\n`;
    }

    summaryText += `\n_Sınıf Asistanı ile hazırlanmıştır._`;

    if (navigator.share) {
      navigator.share({
        title: rep.title,
        text: summaryText
      }).catch(() => {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
        window.open(waUrl, '_blank');
      });
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
      window.open(waUrl, '_blank');
    }
  };

  window.printMobileReport = () => {
    const state = window.stateManager.state;
    const rep = (state.reports || []).find(r => r.id === currentViewingReportId);
    if (!rep) return;

    const printContainer = document.querySelector('.mobile-report-print');
    if (!printContainer) return;

    const crit = rep.criteria || { points: true, homeworks: true, books: true, attendance: true };
    const dateStr = new Date().toLocaleDateString('tr-TR');

    printContainer.innerHTML = (rep.students || []).map(st => `
      <div class="m-rep-print-page">
        <div class="m-rep-print-header">
          <div>
            <h2 style="margin: 0; font-size: 1.15rem; color: #1e293b;">ÖĞRENCİ GELİŞİM RAPORU</h2>
            <div style="font-size: 0.75rem; color: #64748b;">${escapeHTML(rep.title)}</div>
          </div>
          <div style="text-align: right; font-size: 0.75rem; color: #64748b;">
            Tarih: ${dateStr}
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 12px; display: flex; justify-content: space-between;">
          <div>
            <div style="font-size: 1rem; font-weight: 800; color: #0f172a;">${escapeHTML(st.name)}</div>
            <div style="font-size: 0.75rem; color: #475569;">Okul No: ${escapeHTML(st.number || '-')}${st.branch ? ' | Şube: ' + escapeHTML(st.branch) : ''}</div>
          </div>
        </div>

        ${renderStudentReportDetailsHtml(st, crit)}

        <div style="margin-top: 24px; display: flex; justify-content: space-between; font-size: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          <div>Sınıf Asistanı ile Hazırlanmıştır.</div>
          <div style="text-align: right;">Sınıf Öğretmeni İmza: ____________________</div>
        </div>
      </div>
    `).join('');

    document.body.classList.add('print-mobile-report');
    if (window.AndroidBridge && typeof window.AndroidBridge.printDocument === 'function') {
      window.AndroidBridge.printDocument(rep.title.replace(/\s+/g, '_'));
    } else {
      window.print();
    }

    setTimeout(() => {
      document.body.classList.remove('print-mobile-report');
      printContainer.innerHTML = '';
    }, 1500);
  };

  window.printStudentReport = (repId, studentId) => {
    const state = window.stateManager.state;
    const rep = (state.reports || []).find(r => r.id === repId);
    if (!rep) return;
    const st = (rep.students || []).find(s => String(s.id) === String(studentId));
    if (!st) return;

    const printContainer = document.querySelector('.mobile-report-print');
    if (!printContainer) return;

    const crit = rep.criteria || { points: true, homeworks: true, books: true, attendance: true };
    const dateStr = new Date().toLocaleDateString('tr-TR');

    printContainer.innerHTML = `
      <div class="m-rep-print-page">
        <div class="m-rep-print-header">
          <div>
            <h2 style="margin: 0; font-size: 1.15rem; color: #1e293b;">ÖĞRENCİ GELİŞİM RAPORU</h2>
            <div style="font-size: 0.75rem; color: #64748b;">${escapeHTML(rep.title)}</div>
          </div>
          <div style="text-align: right; font-size: 0.75rem; color: #64748b;">
            Tarih: ${dateStr}
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 12px; display: flex; justify-content: space-between;">
          <div>
            <div style="font-size: 1rem; font-weight: 800; color: #0f172a;">${escapeHTML(st.name)}</div>
            <div style="font-size: 0.75rem; color: #475569;">Okul No: ${escapeHTML(st.number || '-')}${st.branch ? ' | Şube: ' + escapeHTML(st.branch) : ''}</div>
          </div>
        </div>

        ${renderStudentReportDetailsHtml(st, crit)}

        <div style="margin-top: 24px; display: flex; justify-content: space-between; font-size: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          <div>Sınıf Asistanı ile Hazırlanmıştır.</div>
          <div style="text-align: right;">Sınıf Öğretmeni İmza: ____________________</div>
        </div>
      </div>
    `;

    document.body.classList.add('print-mobile-report');
    if (window.AndroidBridge && typeof window.AndroidBridge.printDocument === 'function') {
      window.AndroidBridge.printDocument(`${st.name}_Gelisim_Raporu`.replace(/\s+/g, '_'));
    } else {
      window.print();
    }

    setTimeout(() => {
      document.body.classList.remove('print-mobile-report');
      printContainer.innerHTML = '';
    }, 1500);
  };

  window.deleteMobileReport = (repId) => {
    if (!confirm('Bu raporu silmek istediğinize emin misiniz?')) return;
    window.stateManager.state.reports = (window.stateManager.state.reports || []).filter(r => r.id !== repId);
    window.stateManager.saveState();
    window.vibrate(20);
    showMobileToast('Rapor silindi');
    renderMobileReports();
  };


  window.renderMobileReports = renderMobileReports;

})(window);
