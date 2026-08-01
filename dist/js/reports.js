(() => {
  // DOM Elements
  let modal, startDateInput, endDateInput, btnGenerate, selectBranch, branchContainer;
  let chkBooks, chkHomeworks, chkEvaluations, chkTasks, chkAttendance;
  let btnOpenWizardHeader, btnOpenWizardBody, btnCloseHeader, btnCloseFooter;

  // WhatsApp Wizard State
  let wizardStudents = [];
  let currentWizardIndex = -1;

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
    renderReportsList();
  };

  function renderReportsList() {
    const state = stateManager.loadState();
    const reports = state.reports || [];
    const emptyState = document.getElementById('reports-empty-state');
    const listView = document.getElementById('reports-list-view');

    if (!emptyState || !listView) return;

    if (reports.length === 0) {
      emptyState.style.display = 'flex';
      listView.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    listView.style.display = 'block';

    // Sort reports: newest first
    const sortedReports = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let html = `
      <div class="glass-card" style="padding: 1.5rem; margin: 1.5rem auto; max-width: 1000px;">
        <div class="table-responsive">
          <table class="table" style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
                <th style="padding: 0.75rem; color: var(--text-secondary); font-weight: 600;">Rapor Tarih Aralığı</th>
                <th style="padding: 0.75rem; color: var(--text-secondary); font-weight: 600;">Sayfa Sayısı</th>
                <th style="padding: 0.75rem; text-align: center; color: var(--text-secondary); font-weight: 600;">Görüntüle</th>
                <th style="padding: 0.75rem; text-align: center; color: var(--text-secondary); font-weight: 600;">Gönder</th>
                <th style="padding: 0.75rem; text-align: center; color: var(--text-secondary); font-weight: 600;">Sil</th>
              </tr>
            </thead>
            <tbody>
    `;

    sortedReports.forEach(report => {
      const formattedStart = new Date(report.startDate).toLocaleDateString('tr-TR');
      const formattedEnd = new Date(report.endDate).toLocaleDateString('tr-TR');
      const pageCount = report.pageCount || 0;
      
      html += `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); vertical-align: middle;">${formattedStart} - ${formattedEnd}</td>
          <td style="padding: 0.75rem; color: var(--text-primary); vertical-align: middle; font-weight: 500;">${pageCount} Sayfa</td>
          <td style="padding: 0.75rem; text-align: center; vertical-align: middle;">
            <button class="btn btn-outline-primary btn-sm btn-view-report" data-id="${report.id}" style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; padding: 0.35rem 0.75rem; font-weight: 600; border-radius: var(--radius-sm);">
              <i data-lucide="printer" style="width: 14px; height: 14px;"></i> Görüntüle
            </button>
          </td>
          <td style="padding: 0.75rem; text-align: center; vertical-align: middle;">
            <button class="btn btn-success btn-sm btn-send-report" data-id="${report.id}" style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; padding: 0.35rem 0.75rem; font-weight: 600; background: #25d366; border-color: #25d366; color: white; border-radius: var(--radius-sm);">
              <i data-lucide="send" style="width: 14px; height: 14px;"></i> Gönder
            </button>
          </td>
          <td style="padding: 0.75rem; text-align: center; vertical-align: middle;">
            <button class="btn btn-outline-danger btn-sm btn-delete-report" data-id="${report.id}" style="display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; padding: 0; border-radius: var(--radius-sm);" title="Sil">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    listView.innerHTML = html;

    // Bind event listeners
    listView.querySelectorAll('.btn-view-report').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        viewReport(id);
      };
    });
    
    listView.querySelectorAll('.btn-send-report').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        openWhatsAppWizard(id);
      };
    });

    listView.querySelectorAll('.btn-delete-report').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        deleteReport(id);
      };
    });

    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }
  }

  function viewReport(reportId) {
    const state = stateManager.loadState();
    const reports = state.reports || [];
    const report = reports.find(r => r.id === reportId);
    if (!report) {
      if (window.showToast) window.showToast('Rapor bulunamadı!', 'danger');
      return;
    }

    const students = state.students || [];
    const isMiddle = state.educationLevel === 'middle';
    
    const filteredStudents = students.filter(s => {
      return !isMiddle || report.branch === 'all' || s.branch === report.branch;
    });

    if (filteredStudents.length === 0) {
      if (window.showToast) window.showToast('Seçilen şubede öğrenci bulunamadı!', 'warning');
      return;
    }

    printReport(filteredStudents, report.startDate, report.endDate, report.criteria);
  }

  function deleteReport(reportId) {
    if (!confirm('Bu raporu silmek istediğinize emin misiniz?')) return;

    stateManager.deleteReport(reportId);
    renderReportsList();
    if (window.showToast) window.showToast('Rapor silindi.', 'success');
  }

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

    // WhatsApp Wizard Closers
    const modalWp = document.getElementById('modal-whatsapp-report-wizard');
    const btnCloseWpH = document.getElementById('btn-close-wp-wizard-modal');
    const btnCloseWpF = document.getElementById('btn-close-wp-wizard-modal-footer');
    const btnSendNext = document.getElementById('btn-wp-wizard-send-next');

    const closeWpModalFn = () => {
      if (modalWp) modalWp.classList.remove('active');
    };

    if (btnCloseWpH) btnCloseWpH.onclick = closeWpModalFn;
    if (btnCloseWpF) btnCloseWpF.onclick = closeWpModalFn;
    
    if (modalWp) {
      modalWp.onclick = (e) => {
        if (e.target === modalWp) {
          closeWpModalFn();
        }
      };
    }

    if (btnSendNext) {
      btnSendNext.onclick = () => {
        if (currentWizardIndex !== -1) {
          triggerSendAtIndex(currentWizardIndex);
        }
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

    const showBooks = chkBooks ? chkBooks.checked : false;
    const showHomeworks = chkHomeworks ? chkHomeworks.checked : false;
    const showEvaluations = chkEvaluations ? chkEvaluations.checked : false;
    const showTasks = chkTasks ? chkTasks.checked : false;
    const showAttendance = chkAttendance ? chkAttendance.checked : false;

    if (!showBooks && !showHomeworks && !showEvaluations && !showTasks && !showAttendance) {
      if (window.showToast) window.showToast('Lütfen rapora eklenecek en az bir alan seçin!', 'warning');
      return;
    }

    const criteria = {
      books: showBooks,
      homeworks: showHomeworks,
      evaluations: showEvaluations,
      tasks: showTasks,
      attendance: showAttendance
    };

    // Save report to state
    const newReport = {
      id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      startDate: startVal,
      endDate: endVal,
      branch: branchFilter,
      criteria: criteria,
      pageCount: filteredStudents.length,
      createdAt: new Date().toISOString()
    };

    stateManager.addReport(newReport);

    if (window.showToast) {
      window.showToast('Rapor başarıyla kaydedildi.', 'success');
    }

    // Refresh UI list
    renderReportsList();
  }

  function printReport(filteredStudents, startVal, endVal, criteria) {
    const state = stateManager.loadState();
    const isMiddle = state.educationLevel === 'middle';
    
    // Prepare print container
    const printContainer = document.getElementById('student-reports-print');
    if (!printContainer) return;
    printContainer.innerHTML = '';

    const { books: showBooks, homeworks: showHomeworks, evaluations: showEvaluations, tasks: showTasks, attendance: showAttendance } = criteria;

    const startDate = new Date(startVal + 'T00:00:00');
    const endDate = new Date(endVal + 'T23:59:59');

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
              <div class="report-stat-box" style="color: #ec4899;">
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

    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }

    // Trigger Print
    document.body.classList.add('print-reports');
    window.print();

    window.addEventListener('afterprint', () => {
      document.body.classList.remove('print-reports');
      printContainer.innerHTML = '';
    }, { once: true });

    setTimeout(() => {
      document.body.classList.remove('print-reports');
    }, 1000);
  }

  // WHATSAPP PRIVATE MESSAGE BUILDER
  function buildStudentReportMessage(student, startDateStr, endDateStr, criteria, state) {
    const startDate = new Date(startDateStr + 'T00:00:00');
    const endDate = new Date(endDateStr + 'T23:59:59');
    
    const formattedStartDate = new Date(startDateStr).toLocaleDateString('tr-TR');
    const formattedEndDate = new Date(endDateStr).toLocaleDateString('tr-TR');
    const reportDateStr = new Date().toLocaleDateString('tr-TR');
    
    let msg = `*ÖĞRENCİ GELİŞİM RAPORU*\n`;
    msg += `*Dönem:* ${formattedStartDate} - ${formattedEndDate}\n`;
    msg += `*Öğrenci:* ${student.name} ${student.surname}`;
    if (student.number) msg += ` (No: ${student.number})`;
    if (student.branch) msg += ` | Sınıf: ${student.branch}`;
    msg += `\n----------------------------------------\n`;

    // 1. Kitap Okuma
    if (criteria.books) {
      const returnTx = (state.books.transactions || []).filter(t => {
        if (t.studentId !== student.id || !t.returnDate) return false;
        const returnD = new Date(t.returnDate);
        return returnD >= startDate && returnD <= endDate;
      });

      let readPages = 0;
      returnTx.forEach(t => {
        const book = (state.books.library || []).find(b => b.id === t.bookId);
        if (book) {
          readPages += parseInt(book.pages) || 0;
        }
      });
      msg += `📚 *Kitap Okuma:* ${returnTx.length} Kitap (${readPages} Sayfa)\n`;
    }

    // 2. Ödev
    if (criteria.homeworks) {
      const assignedHomeworks = (state.homeworks || []).filter(hw => {
        const isMiddle = state.educationLevel === 'middle';
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

      msg += `📝 *Ödev Takibi:* ${hwCompleted} Tamam, ${hwIncomplete} Eksik, ${hwMissing} Yapılmayan`;
      if (hwExcused > 0) msg += `, ${hwExcused} Muaf`;
      msg += `\n`;
    }

    // 3. Sınav Değerlendirmeleri
    if (criteria.evaluations) {
      const relevantExams = (state.weeklyEvaluations || []).filter(e => {
        if (!e.createdAt) return false;
        const examDate = new Date(e.createdAt);
        const isDateInRange = examDate >= startDate && examDate <= endDate;
        const isMiddle = state.educationLevel === 'middle';
        const isRelevantBranch = !isMiddle || !e.branch || student.branch === e.branch;
        return isDateInRange && isRelevantBranch;
      });

      let participatedCount = 0;
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
        }
      });

      const avgExamScore = participatedCount > 0 ? (totalExamScore / participatedCount).toFixed(1) + ' Puan' : 'Girilmedi';
      msg += `🏆 *Sınav Ortalaması:* ${avgExamScore}\n`;
    }

    // 4. Görevler
    if (criteria.tasks) {
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

      msg += `🎯 *Görev ve Sorumluluk:* ${completedTasks.length} Tamam, ${pendingTasks.length} Bekleyen\n`;
    }

    // 5. Devamsızlık
    if (criteria.attendance) {
      const absenceCount = stateManager.getStudentAbsenceCount(student.id, startDateStr, endDateStr);
      msg += `📅 *Devamsızlık:* ${absenceCount} Gün\n`;
    }

    msg += `----------------------------------------\n`;
    msg += `*Rapor Tarihi:* ${reportDateStr}\n`;
    msg += `Sınıf Asistanı ile Gönderilmiştir.`;
    return msg;
  }

  // SEND PRIVATE WHATSAPP MESSAGE
  function sendPrivateWhatsApp(phone, message) {
    if (!phone) {
      if (window.showToast) window.showToast('Veli telefon numarası bulunamadı!', 'warning');
      return;
    }
    
    // Clean phone number
    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('0') && cleanedPhone.length === 11) {
      cleanedPhone = '90' + cleanedPhone.substring(1);
    } else if (cleanedPhone.length === 10) {
      cleanedPhone = '90' + cleanedPhone;
    }

    const encoded = encodeURIComponent(message);
    const desktopUrl = `whatsapp://send?phone=${cleanedPhone}&text=${encoded}`;
    const webUrl = `https://web.whatsapp.com/send?phone=${cleanedPhone}&text=${encoded}`;

    if (window.__TAURI__) {
      window.safeOpenURL(desktopUrl);
      return;
    }

    let didOpenApp = false;
    const onBlur = () => {
      didOpenApp = true;
    };
    window.addEventListener('blur', onBlur);

    // Try desktop app deep link
    window.location.href = desktopUrl;

    setTimeout(() => {
      window.removeEventListener('blur', onBlur);
      if (!didOpenApp) {
        window.safeOpenURL(webUrl);
      }
    }, 1500);
  }

  // WHATSAPP SENDING WIZARD MODAL POPULATION
  function openWhatsAppWizard(reportId) {
    const state = stateManager.loadState();
    const reports = state.reports || [];
    const report = reports.find(r => r.id === reportId);
    if (!report) {
      if (window.showToast) window.showToast('Rapor bulunamadı!', 'danger');
      return;
    }

    const students = state.students || [];
    const isMiddle = state.educationLevel === 'middle';
    
    const filteredStudents = students.filter(s => {
      return !isMiddle || report.branch === 'all' || s.branch === report.branch;
    });

    if (filteredStudents.length === 0) {
      if (window.showToast) window.showToast('Gönderilecek öğrenci bulunamadı!', 'warning');
      return;
    }

    // Sort alphabetically
    filteredStudents.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    // Populate state
    wizardStudents = filteredStudents.map(student => {
      const message = buildStudentReportMessage(student, report.startDate, report.endDate, report.criteria, state);
      return {
        student: student,
        message: message,
        sent: false
      };
    });

    // Reset index
    currentWizardIndex = findNextPendingIndex();

    // Open Modal
    const wizardModal = document.getElementById('modal-whatsapp-report-wizard');
    if (wizardModal) {
      wizardModal.classList.add('active');
    }

    renderWizardStudentsList();
    updateWizardHelper();
  }

  function renderWizardStudentsList() {
    const tbody = document.getElementById('wp-wizard-students-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    wizardStudents.forEach((item, index) => {
      const s = item.student;
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid var(--border-color)';
      
      const statusBadge = item.sent 
        ? `<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981; font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px;">Gönderildi</span>`
        : `<span class="badge" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px;">Bekliyor</span>`;

      const phoneDisplay = s.parentPhone ? s.parentPhone : '<span style="color: var(--danger); font-size: 0.8rem;">Girilmemiş</span>';
      const branchDisplay = s.branch ? ` | Şube: ${s.branch}` : '';

      row.innerHTML = `
        <td style="padding: 0.75rem; vertical-align: middle;">
          <div style="font-weight: 600; color: var(--text-primary);">${s.name} ${s.surname}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">No: ${s.number || '-'}${branchDisplay}</div>
        </td>
        <td style="padding: 0.75rem; vertical-align: middle; color: var(--text-primary); font-family: monospace;">${phoneDisplay}</td>
        <td style="padding: 0.75rem; text-align: center; vertical-align: middle;">${statusBadge}</td>
        <td style="padding: 0.75rem; text-align: right; vertical-align: middle;">
          <button class="btn btn-success btn-sm btn-open-wp-chat" data-index="${index}" style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; background: #25d366; border-color: #25d366; color: white; border-radius: var(--radius-sm);">
            <i data-lucide="external-link" style="width: 14px; height: 14px;"></i> WhatsApp'ı Aç
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });

    tbody.querySelectorAll('.btn-open-wp-chat').forEach(btn => {
      btn.onclick = () => {
        const index = parseInt(btn.getAttribute('data-index'));
        triggerSendAtIndex(index);
      };
    });

    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }
  }

  function triggerSendAtIndex(index) {
    if (index < 0 || index >= wizardStudents.length) return;
    const item = wizardStudents[index];
    if (!item.student.parentPhone) {
      if (window.showToast) window.showToast(`${item.student.name} öğrencisinin veli telefonu kayıtlı değil!`, 'warning');
      return;
    }

    sendPrivateWhatsApp(item.student.parentPhone, item.message);
    item.sent = true;

    // Refresh table list
    renderWizardStudentsList();

    // Advance wizard index
    if (index === currentWizardIndex) {
      currentWizardIndex = findNextPendingIndex();
    }
    updateWizardHelper();
  }

  function findNextPendingIndex() {
    for (let i = 0; i < wizardStudents.length; i++) {
      if (!wizardStudents[i].sent && wizardStudents[i].student.parentPhone) {
        return i;
      }
    }
    return -1;
  }

  function updateWizardHelper() {
    const nextInfoSpan = document.getElementById('wp-wizard-next-student-info');
    const sendNextBtn = document.getElementById('btn-wp-wizard-send-next');
    
    if (!nextInfoSpan || !sendNextBtn) return;

    if (currentWizardIndex === -1) {
      nextInfoSpan.innerHTML = '✨ <strong>Tüm gönderimler tamamlandı!</strong>';
      sendNextBtn.disabled = true;
      sendNextBtn.style.opacity = '0.5';
    } else {
      const item = wizardStudents[currentWizardIndex];
      nextInfoSpan.innerHTML = `Sıradaki: <strong>${item.student.name} ${item.student.surname}</strong> (${item.student.parentPhone})`;
      sendNextBtn.disabled = false;
      sendNextBtn.style.opacity = '1';
    }
  }
})();
