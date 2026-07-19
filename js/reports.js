(() => {
  // DOM Elements
  let modal, startDateInput, endDateInput, btnGenerate, selectBranch, branchContainer;
  let chkBooks, chkHomeworks, chkEvaluations, chkTasks, chkAttendance;
  let btnOpenWizardHeader, btnOpenWizardBody, btnCloseHeader, btnCloseFooter;

  function initDOMElements() {
    modal = document.getElementById('modal-create-report');
    startDateInput = document.getElementById('report-start-date');
    endDateInput = document.getElementById('report-end-date');
    btnGenerate = document.getElementById('btn-generate-report');
    selectBranch = document.getElementById('report-select-branch');
    branchContainer = document.getElementById('report-branch-container');
    
    chkBooks = document.getElementById('chk-report-books');
    chkHomeworks = document.getElementById('chk-report-homeworks');
    chkEvaluations = document.getElementById('chk-report-evaluations');
    chkTasks = document.getElementById('chk-report-tasks');
    chkAttendance = document.getElementById('chk-report-attendance');

    btnOpenWizardHeader = document.getElementById('btn-open-report-wizard');
    btnOpenWizardBody = document.getElementById('btn-open-report-wizard-body');
    btnCloseHeader = document.getElementById('btn-close-report-modal');
    btnCloseFooter = document.getElementById('btn-close-report-modal-footer');
  }

  window.renderReports = function() {
    initDOMElements();
    setupListeners();
  };

  function setupListeners() {
    if (!startDateInput || !endDateInput) return;

    const state = stateManager.loadState();
    const isMiddle = state.educationLevel === 'middle';

    // Show/hide branch filter container
    if (branchContainer) {
      branchContainer.style.display = isMiddle ? 'flex' : 'none';
    }

    // Modal open action
    const openModalFn = () => {
      // Set default dates (past 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      startDateInput.value = window.formatLocalDate(thirtyDaysAgo);
      endDateInput.value = window.formatLocalDate(today);

      if (modal) modal.classList.add('active');
    };

    if (btnOpenWizardHeader) {
      btnOpenWizardHeader.onclick = openModalFn;
    }
    if (btnOpenWizardBody) {
      btnOpenWizardBody.onclick = openModalFn;
    }

    // Modal close action
    const closeModalFn = () => {
      if (modal) modal.classList.remove('active');
    };

    if (btnCloseHeader) btnCloseHeader.onclick = closeModalFn;
    if (btnCloseFooter) btnCloseFooter.onclick = closeModalFn;

    // Backdrop click close
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) {
          closeModalFn();
        }
      };
    }

    // Bind event listener to generate report
    if (btnGenerate) {
      btnGenerate.onclick = () => {
        generateReports();
        closeModalFn();
      };
    }
  }

  function generateReports() {
    const state = stateManager.loadState();
    const students = state.students || [];

    if (students.length === 0) {
      if (window.showToast) window.showToast('Rapora eklenecek kayıtlı öğrenci bulunamadı!', 'warning');
      return;
    }

    const startVal = startDateInput.value;
    const endVal = endDateInput.value;

    if (!startVal || !endVal) {
      if (window.showToast) window.showToast('Lütfen başlangıç ve bitiş tarihlerini seçin!', 'warning');
      return;
    }

    const startDate = new Date(startVal + 'T00:00:00');
    const endDate = new Date(endVal + 'T23:59:59');

    if (startDate > endDate) {
      if (window.showToast) window.showToast('Başlangıç tarihi bitiş tarihinden sonra olamaz!', 'warning');
      return;
    }

    const isMiddle = state.educationLevel === 'middle';
    const branchFilter = selectBranch ? selectBranch.value : 'all';

    // Filter students by branch if middle school
    const filteredStudents = students.filter(s => {
      return !isMiddle || branchFilter === 'all' || s.branch === branchFilter;
    });

    if (filteredStudents.length === 0) {
      if (window.showToast) window.showToast('Seçilen şubede öğrenci bulunamadı!', 'warning');
      return;
    }

    // Prepare print container
    const printContainer = document.getElementById('student-reports-print');
    if (!printContainer) return;
    printContainer.innerHTML = '';

    const showBooks = chkBooks ? chkBooks.checked : false;
    const showHomeworks = chkHomeworks ? chkHomeworks.checked : false;
    const showEvaluations = chkEvaluations ? chkEvaluations.checked : false;
    const showTasks = chkTasks ? chkTasks.checked : false;
    const showAttendance = chkAttendance ? chkAttendance.checked : false;

    if (!showBooks && !showHomeworks && !showEvaluations && !showTasks && !showAttendance) {
      if (window.showToast) window.showToast('Lütfen rapora eklenecek en az bir alan seçin!', 'warning');
      return;
    }

    const formattedStartDate = new Date(startVal).toLocaleDateString('tr-TR');
    const formattedEndDate = new Date(endVal).toLocaleDateString('tr-TR');
    const reportDateStr = new Date().toLocaleDateString('tr-TR');

    filteredStudents.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    filteredStudents.forEach(student => {
      const page = document.createElement('div');
      page.className = 'student-report-page';

      // 1. Report Header
      let headerHtml = `
        <div class="report-header">
          <div class="report-logo">
            <span>Sınıf Asistanı</span>
          </div>
          <div>
            <h2>ÖĞRENCİ GELİŞİM RAPORU</h2>
            <p class="report-date-range">Dönem: ${formattedStartDate} - ${formattedEndDate}</p>
          </div>
        </div>
      `;

      // 2. Student Info Card
      const initials = `${student.name[0] || ''}${student.surname[0] || ''}`.toUpperCase();
      const avatarStyle = student.gender === 'female' 
        ? 'background: rgba(236, 72, 153, 0.1); color: rgb(236, 72, 153);' 
        : 'background: rgba(99, 102, 241, 0.1); color: var(--primary);';
      
      const avatarHtml = student.photo
        ? `<img src="${student.photo}">`
        : `<div class="student-avatar-placeholder" style="${avatarStyle}">${initials}</div>`;

      const branchLabel = isMiddle ? ` | <strong>Sınıf/Şube:</strong> ${student.branch || '-'}` : '';
      const absenceCount = stateManager.getStudentAbsenceCount(student.id, startVal, endVal);
      let studentInfoHtml = `
        <div class="student-info-card">
          <div class="student-photo-wrapper">
            ${avatarHtml}
          </div>
          <div class="student-meta-details">
            <h3>${student.name} ${student.surname}</h3>
            <p><strong>Okul Numarası:</strong> ${student.number || '-'}${branchLabel} | <strong>Devamsızlık:</strong> ${absenceCount} Gün</p>
          </div>
        </div>
      `;

      // 3. Stats Sections
      let sectionsHtml = '<div class="report-sections">';

      // A. Kitap İstatistikleri
      if (showBooks) {
        const returnTx = (state.books.transactions || []).filter(t => {
          if (t.studentId !== student.id || !t.returnDate) return false;
          const returnD = new Date(t.returnDate);
          return returnD >= startDate && returnD <= endDate;
        });

        let readPages = 0;
        const readBookIds = [];
        returnTx.forEach(t => {
          const book = (state.books.library || []).find(b => b.id === t.bookId);
          if (book) {
            readPages += parseInt(book.pages) || 0;
            readBookIds.push(book.id);
          }
        });

        const uniqueReadBookIds = [...new Set(readBookIds)];
        const totalLibraryCount = (state.books.library || []).length;
        const readPercentage = totalLibraryCount > 0 
          ? ((uniqueReadBookIds.length / totalLibraryCount) * 100).toFixed(1) 
          : '0';

        sectionsHtml += `
          <div class="report-section-card">
            <h4><i data-lucide="book-open"></i> Kitap Okuma İstatistikleri</h4>
            <div class="report-stats-grid">
              <div class="report-stat-box">
                <span class="stat-val">${returnTx.length}</span>
                <span class="stat-lbl">Okunan Kitap</span>
              </div>
              <div class="report-stat-box">
                <span class="stat-val">${readPages}</span>
                <span class="stat-lbl">Toplam Sayfa</span>
              </div>
              <div class="report-stat-box">
                <span class="stat-val">%${readPercentage}</span>
                <span class="stat-lbl">Kütüphane Okuma Oranı</span>
              </div>
            </div>
          </div>
        `;
      }

      // B. Ödev İstatistikleri
      if (showHomeworks) {
        const assignedHomeworks = (state.homeworks || []).filter(hw => {
          const matchBranch = !isMiddle || !hw.branch || hw.branch === student.branch;
          const hwDate = new Date(hw.dueDate);
          return matchBranch && hwDate >= startDate && hwDate <= endDate;
        });

        let hwCompleted = 0;
        let hwIncomplete = 0;
        let hwMissing = 0;
        let hwExcused = 0;

        assignedHomeworks.forEach(hw => {
          const status = hw.status ? hw.status[student.id] : undefined;
          if (status === 'completed') hwCompleted++;
          else if (status === 'incomplete') hwIncomplete++;
          else if (status === 'missing') hwMissing++;
          else if (status === 'excused') hwExcused++;
        });

        sectionsHtml += `
          <div class="report-section-card">
            <h4><i data-lucide="clipboard-list"></i> Ödev Takip Analizi</h4>
            <div class="report-stats-grid">
              <div class="report-stat-box">
                <span class="stat-val text-success">${hwCompleted}</span>
                <span class="stat-lbl">Yapılan (Tam)</span>
              </div>
              <div class="report-stat-box">
                <span class="stat-val text-warning">${hwIncomplete}</span>
                <span class="stat-lbl">Eksik / Yarım</span>
              </div>
              <div class="report-stat-box">
                <span class="stat-val text-danger">${hwMissing}</span>
                <span class="stat-lbl">Yapılmayan</span>
              </div>
              <div class="report-stat-box">
                <span class="stat-val text-primary">${hwExcused}</span>
                <span class="stat-lbl">Muaf</span>
              </div>
            </div>
          </div>
        `;
      }

      // C. Değerlendirme İstatistikleri
      if (showEvaluations) {
        // Sınav Notu Hesaplamaları
        const relevantExams = (state.weeklyEvaluations || []).filter(e => {
          if (!e.createdAt) return false;
          const examDate = new Date(e.createdAt);
          const isDateInRange = examDate >= startDate && examDate <= endDate;
          const isRelevantBranch = !isMiddle || !e.branch || student.branch === e.branch;
          return isDateInRange && isRelevantBranch;
        });

        let participatedCount = 0;
        let missedCount = 0;
        let totalExamScore = 0;

        relevantExams.forEach(e => {
          let score = undefined;
          if (e.studentResults && e.studentResults[student.id]) {
            score = e.studentResults[student.id].score;
          } else if (e.examScores && e.examScores[student.id] !== undefined) {
            score = e.examScores[student.id];
          }

          if (score !== undefined && score !== null && score !== '') {
            participatedCount++;
            totalExamScore += parseFloat(score);
          } else {
            missedCount++;
          }
        });

        const avgExamScore = participatedCount > 0 ? (totalExamScore / participatedCount).toFixed(1) + ' Puan' : 'Girilmedi';

        // Sınıftaki başarı sıralaması hesaplama
        const classGrades = filteredStudents.map(s => {
          let sParticipated = 0;
          let sTotalScore = 0;
          
          relevantExams.forEach(e => {
            let score = undefined;
            if (e.studentResults && e.studentResults[s.id]) {
              score = e.studentResults[s.id].score;
            } else if (e.examScores && e.examScores[s.id] !== undefined) {
              score = e.examScores[s.id];
            }
            if (score !== undefined && score !== null && score !== '') {
              sParticipated++;
              sTotalScore += parseFloat(score);
            }
          });
          
          const sAvg = sParticipated > 0 ? (sTotalScore / sParticipated) : 0;
          return {
            studentId: s.id,
            avgScore: sAvg,
            participated: sParticipated
          };
        });

        classGrades.sort((a, b) => {
          if (b.avgScore !== a.avgScore) {
            return b.avgScore - a.avgScore;
          }
          if (b.participated !== a.participated) {
            return b.participated - a.participated;
          }
          const studentA = state.students.find(s => s.id === a.studentId) || { name: '', surname: '' };
          const studentB = state.students.find(s => s.id === b.studentId) || { name: '', surname: '' };
          const nameA = `${studentA.name} ${studentA.surname}`;
          const nameB = `${studentB.name} ${studentB.surname}`;
          return nameA.localeCompare(nameB, 'tr');
        });

        const rankIndex = classGrades.findIndex(g => g.studentId === student.id);
        const examRank = rankIndex !== -1 ? rankIndex + 1 : '-';

        sectionsHtml += `
          <div class="report-section-card">
            <h4><i data-lucide="award"></i> Sınav Değerlendirmesi</h4>
            <div class="report-stats-grid">
              <div class="report-stat-box">
                <span class="stat-val text-success">${participatedCount}</span>
                <span class="stat-lbl">Katıldığı Sınav</span>
              </div>
              <div class="report-stat-box">
                <span class="stat-val text-danger">${missedCount}</span>
                <span class="stat-lbl">Katılmadığı Sınav</span>
              </div>
              <div class="report-stat-box">
                <span class="stat-val text-primary">${avgExamScore}</span>
                <span class="stat-lbl">Ortalama Not Oranı</span>
              </div>
              <div class="report-stat-box">
                <span class="stat-val" style="color: #ec4899;">#${examRank} / ${filteredStudents.length}</span>
                <span class="stat-lbl">Sınıf Başarı Sırası</span>
              </div>
            </div>
          </div>
        `;
      }

      // D. Görev İstatistikleri
      if (showTasks) {
        const studentTasks = (state.tasks || []).filter(t => t.studentId === student.id);
        const completedTasks = studentTasks.filter(t => {
          if (t.status !== 'completed' || !t.completedDate) return false;
          const compD = new Date(t.completedDate);
          return compD >= startDate && compD <= endDate;
        });
        const pendingTasks = studentTasks.filter(t => {
          if (t.status === 'completed') return false;
          const dueD = new Date(t.dueDate || t.createdAt);
          return dueD >= startDate && dueD <= endDate;
        });

        sectionsHtml += `
          <div class="report-section-card">
            <h4><i data-lucide="check-square"></i> Görev ve Sorumluluk Takibi</h4>
            <div class="report-stats-grid">
              <div class="report-stat-box">
                <span class="stat-val text-success">${completedTasks.length}</span>
                <span class="stat-lbl">Teslim Edilen Görev</span>
              </div>
              <div class="report-stat-box">
                <span class="stat-val text-warning">${pendingTasks.length}</span>
                <span class="stat-lbl">Bekleyen Aktif Görev</span>
              </div>
              <div class="report-stat-box">
                <span class="stat-val">${studentTasks.length}</span>
                <span class="stat-lbl">Toplam Atanan Görev</span>
              </div>
            </div>
          </div>
        `;
      }

      // E. Devamsızlık Bilgisi
      if (showAttendance) {
        const absenceCount = stateManager.getStudentAbsenceCount(student.id, startVal, endVal);
        sectionsHtml += `
          <div class="report-section-card">
            <h4><i data-lucide="calendar-x"></i> Devamsızlık İstatistikleri</h4>
            <div class="report-stats-grid" style="grid-template-columns: 1fr;">
              <div class="report-stat-box">
                <span class="stat-val" style="color: var(--danger); font-weight: 800;">${absenceCount} Gün</span>
                <span class="stat-lbl">Seçili Dönemdeki Toplam Devamsızlık</span>
              </div>
            </div>
          </div>
        `;
      }

      sectionsHtml += '</div>'; // close report-sections

      // 4. Report Footer
      let footerHtml = `
        <div class="report-footer">
          <div>Rapor Tarihi: ${reportDateStr} | Sınıf Asistanı ile Oluşturuldu.</div>
          <div class="signature-space">Sınıf Öğretmeni İmza<br><br>____________________</div>
        </div>
      `;

      page.innerHTML = headerHtml + studentInfoHtml + sectionsHtml + footerHtml;
      printContainer.appendChild(page);
    });

    // Run lucide icons conversion on print layout before calling browser print dialog
    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }

    // Trigger Print
    document.body.classList.add('print-reports');
    window.print();

    // Cleanup print classes after printing is done
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('print-reports');
      printContainer.innerHTML = '';
    }, { once: true });

    // Fallback cleanup
    setTimeout(() => {
      document.body.classList.remove('print-reports');
    }, 1000);
  }
})();
