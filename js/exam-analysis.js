(() => {
  // Sınav Analiz ve Rapor Modülü

  let toastCallbackFn = null;
  let activeCharts = {};

  class ExamAnalysisTool {
    constructor() {
      // Modül içi durum
      this.currentView = 'ea-view-dashboard';
      this.currentAnalysisTab = 'ea-analysis-tab-general';
    }

    init(toastCallback) {
      toastCallbackFn = toastCallback;

      // Event Listeners - Navigation
      const btnLaunch = document.getElementById('btn-launch-exam-analysis');
      const btnBack = document.getElementById('btn-back-to-tools-from-exam-analysis');

      if (btnLaunch) {
        btnLaunch.addEventListener('click', () => {
          document.getElementById('tools-landing-view').style.display = 'none';
          document.getElementById('tools-exam-analysis-view').style.display = 'block';
          this.render();
        });
      }

      if (btnBack) {
        btnBack.addEventListener('click', () => {
          document.getElementById('tools-exam-analysis-view').style.display = 'none';
          document.getElementById('tools-landing-view').style.display = 'block';
        });
      }

      // Dialog Events
      const btnOpenAddExam = document.getElementById('btn-ea-open-add-exam');
      if (btnOpenAddExam) {
        btnOpenAddExam.addEventListener('click', () => {
          this.openModal('modal-ea-add-exam');
          this.resetExamModal();
        });
      }

      // Grade Selection Events
      const gradeExamSelect = document.getElementById('ea-grade-exam-select');
      if (gradeExamSelect) {
        gradeExamSelect.addEventListener('change', () => {
          this.handleGradeSelectionChange();
        });
      }

      const gradeBranchSelect = document.getElementById('ea-grade-branch-select');
      if (gradeBranchSelect) {
        gradeBranchSelect.addEventListener('change', () => {
          this.renderGradeGrid();
        });
      }

      const fillZerosBtn = document.getElementById('btn-ea-fill-zeros');
      if (fillZerosBtn) {
        fillZerosBtn.addEventListener('click', () => {
          this.autoFillZeros();
        });
      }

      const saveGradesBtn = document.getElementById('btn-ea-save-grades');
      if (saveGradesBtn) {
        saveGradesBtn.addEventListener('click', () => {
          this.saveGrades();
        });
      }

      // Analysis Selection Events
      const analysisExamSelect = document.getElementById('ea-analysis-exam-select');
      if (analysisExamSelect) {
        analysisExamSelect.addEventListener('change', () => {
          this.handleAnalysisExamChange();
        });
      }

      const printReportBtn = document.getElementById('btn-ea-print-report');
      if (printReportBtn) {
        printReportBtn.addEventListener('click', () => {
          this.printExamReport();
        });
      }
    }

    // Modal helpers
    openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
      }
    }

    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('active');
      }
    }

    render() {
      this.updateDashboardStats();
      this.populateExamSelectDropdowns();
      this.renderExamsList();
      if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    // Stats
    updateDashboardStats() {
      const state = window.stateManager.state;
      const totalStudents = state.students ? state.students.length : 0;
      
      const branches = state.students
        ? [...new Set(state.students.map(s => s.branch).filter(Boolean))]
        : [];
      const totalBranches = branches.length;
      
      const exams = state.examAnalysisExams ? state.examAnalysisExams.length : 0;

      document.getElementById('ea-stats-total-students').innerText = totalStudents;
      document.getElementById('ea-stats-total-branches').innerText = totalBranches;
      document.getElementById('ea-stats-total-exams').innerText = exams;

      const summaryContent = document.getElementById('ea-dashboard-exam-summary-content');
      if (!summaryContent) return;

      if (exams > 0) {
        const sortedExams = [...state.examAnalysisExams].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latestExam = sortedExams[0];
        
        // Target branch students
        const participatingStudents = state.students.filter(s => latestExam.branches.includes(s.branch));
        
        // Grades list for this exam
        const grades = state.examAnalysisGrades
          ? state.examAnalysisGrades.filter(g => g.examId === latestExam.id)
          : [];
        const gradedCount = grades.length;
        
        let progressPercent = 0;
        if (participatingStudents.length > 0) {
          progressPercent = Math.round((gradedCount / participatingStudents.length) * 100);
        }

        const validGrades = grades.filter(g => !g.isAbsent);
        let averageDisplay = 'Not Girişi Yapılmadı';
        if (validGrades.length > 0) {
          const sum = validGrades.reduce((acc, curr) => acc + curr.totalScore, 0);
          averageDisplay = `%${Math.round(sum / validGrades.length)} / ${latestExam.maxScore || 100}`;
        }

        summaryContent.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <h3 style="font-family: var(--font-family-title); font-size: 1.25rem; font-weight: 600; color: var(--primary);">
                ${latestExam.name}
              </h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                Oluşturulma: ${new Date(latestExam.createdAt).toLocaleDateString('tr-TR')} &nbsp;|&nbsp; 
                Soru Sayısı: ${latestExam.questions.length} &nbsp;|&nbsp; 
                Hedef Şubeler: ${latestExam.branches.join(', ')}
              </p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
              <div style="border: 1px solid var(--border-color); padding: 12px 16px; border-radius: var(--radius-md);">
                <div style="font-size: 0.8rem; color: var(--text-muted);">Sınıf Başarı Ortalaması</div>
                <div style="font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin-top: 4px;">${averageDisplay}</div>
              </div>
              <div style="border: 1px solid var(--border-color); padding: 12px 16px; border-radius: var(--radius-md);">
                <div style="font-size: 0.8rem; color: var(--text-muted);">Not Giriş İlerlemesi</div>
                <div style="font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin-top: 4px; display: flex; align-items: center; gap: 8px;">
                  <span>${progressPercent}%</span>
                  <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted)">(${gradedCount} / ${participatingStudents.length} Öğrenci)</span>
                </div>
              </div>
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 8px;">
              <button class="btn btn-primary btn-sm" onclick="examAnalysisTool.loadGradesForExam('${latestExam.id}')">
                <i data-lucide="edit-3" style="width: 14px; height: 14px; vertical-align: middle;"></i> Not Girişi Yap
              </button>
              <button class="btn btn-secondary btn-sm" onclick="examAnalysisTool.showAnalysisForExam('${latestExam.id}')" ${gradedCount === 0 ? 'disabled' : ''}>
                <i data-lucide="bar-chart-3" style="width: 14px; height: 14px; vertical-align: middle;"></i> Analizi Görüntüle
              </button>
            </div>
          </div>
        `;
      } else {
        summaryContent.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <i data-lucide="info"></i>
            </div>
            <div class="empty-state-title">Aktif Sınav Bulunamadı</div>
            <div class="empty-state-description">
              Sisteme henüz bir sınav eklemediniz. Sınav analizine başlamak için yeni bir sınav oluşturun.
            </div>
            <button class="btn btn-primary btn-sm" onclick="examAnalysisTool.navigateToView('ea-view-exams')">
              <i data-lucide="plus" style="width: 14px; height: 14px; vertical-align: middle;"></i> Sınav Ekle
            </button>
          </div>
        `;
      }
      if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    loadGradesForExam(examId) {
      this.navigateToView('ea-view-grades');
      const select = document.getElementById('ea-grade-exam-select');
      if (select) {
        select.value = examId;
        this.handleGradeSelectionChange();
      }
    }

    showAnalysisForExam(examId) {
      this.navigateToView('ea-view-analysis');
      const select = document.getElementById('ea-analysis-exam-select');
      if (select) {
        select.value = examId;
        this.handleAnalysisExamChange();
      }
    }

    resetExamModal() {
      document.getElementById('ea-exam-modal-step-1').style.display = 'block';
      document.getElementById('ea-exam-modal-step-2').style.display = 'none';

      document.getElementById('ea-exam-name').value = '';
      document.getElementById('ea-exam-question-count').value = '10';

      const branchContainer = document.getElementById('ea-exam-branch-checkboxes');
      if (branchContainer) {
        const state = window.stateManager.state;
        const branches = state.students
          ? [...new Set(state.students.map(s => s.branch).filter(Boolean))].sort()
          : [];

        if (branches.length === 0) {
          branchContainer.innerHTML = '<span style="color: var(--danger); font-size: 0.85rem;"><i data-lucide="alert-circle" style="vertical-align: middle;"></i> Sınav tanımlamak için önce sınıfa şube tanımlı öğrenciler eklemelisiniz.</span>';
        } else {
          branchContainer.innerHTML = '';
          branches.forEach(branch => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            label.innerHTML = `
              <input type="checkbox" name="ea-exam-branches" value="${branch}">
              <span>${branch}</span>
            `;
            
            const cb = label.querySelector('input');
            cb.addEventListener('change', () => {
              if (cb.checked) label.classList.add('checked');
              else label.classList.remove('checked');
            });

            branchContainer.appendChild(label);
          });
        }
      }
      if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    proceedToQuestionsStep() {
      const name = document.getElementById('ea-exam-name').value.trim();
      const qCount = parseInt(document.getElementById('ea-exam-question-count').value) || 0;
      
      const checkboxes = document.querySelectorAll('input[name="ea-exam-branches"]:checked');
      const branches = Array.from(checkboxes).map(cb => cb.value);

      if (!name) {
        alert('Lütfen sınav adı giriniz.');
        return;
      }
      if (branches.length === 0) {
        alert('Lütfen sınava katılacak en az bir şube seçiniz.');
        return;
      }
      if (qCount <= 0 || qCount > 50) {
        alert('Soru sayısı 1 ile 50 arasında olmalıdır.');
        return;
      }

      const configContainer = document.getElementById('ea-exam-question-configurator');
      configContainer.innerHTML = '';

      const basePoints = Math.floor(100 / qCount);
      const remainder = 100 % qCount;

      for (let i = 1; i <= qCount; i++) {
        const defaultVal = i <= remainder ? basePoints + 1 : basePoints;

        configContainer.innerHTML += `
          <div class="q-config-item" data-qnum="${i}">
            <div class="q-config-num">Soru ${i}</div>
            <div>
              <input type="number" class="form-control q-config-points" min="1" max="100" value="${defaultVal}" oninput="examAnalysisTool.calculateExamPointsSum()" required style="width: 100%;">
            </div>
            <div>
              <input type="text" class="form-control q-config-outcome" placeholder="Kazanım / Açıklama girin (opsiyonel)" style="width: 100%;">
            </div>
          </div>
        `;
      }

      document.getElementById('ea-exam-modal-step-1').style.display = 'none';
      document.getElementById('ea-exam-modal-step-2').style.display = 'block';

      this.calculateExamPointsSum();
      if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    backToInfoStep() {
      document.getElementById('ea-exam-modal-step-1').style.display = 'block';
      document.getElementById('ea-exam-modal-step-2').style.display = 'none';
    }

    calculateExamPointsSum() {
      const inputs = document.querySelectorAll('#ea-exam-question-configurator .q-config-points');
      let sum = 0;
      inputs.forEach(input => {
        sum += parseInt(input.value) || 0;
      });
      
      const display = document.getElementById('ea-exam-total-points-display');
      if (display) {
        display.innerText = sum;
        if (sum !== 100) {
          display.style.color = 'var(--warning)';
        } else {
          display.style.color = 'var(--success)';
        }
      }
      return sum;
    }

    saveExamDefinition() {
      const name = document.getElementById('ea-exam-name').value.trim();
      const checkboxes = document.querySelectorAll('input[name="ea-exam-branches"]:checked');
      const branches = Array.from(checkboxes).map(cb => cb.value);
      
      const sum = this.calculateExamPointsSum();

      if (sum !== 100) {
        if (!confirm(`Sınav sorularının toplam puanı ${sum} ediyor (100 olması önerilir). Yine de bu şekilde kaydetmek istiyor musunuz?`)) {
          return;
        }
      }

      const questions = [];
      const configItems = document.querySelectorAll('#ea-exam-question-configurator .q-config-item');
      
      configItems.forEach(item => {
        const number = parseInt(item.getAttribute('data-qnum'));
        const maxPoints = parseInt(item.querySelector('.q-config-points').value) || 0;
        const outcome = item.querySelector('.q-config-outcome').value.trim();

        questions.push({
          number,
          maxPoints,
          outcome: outcome || `Soru ${number} Kazanımı`
        });
      });

      const newExam = {
        id: 'exam_' + Date.now(),
        name,
        branches,
        questions,
        maxScore: sum,
        createdAt: new Date().toISOString()
      };

      const state = window.stateManager.state;
      if (!state.examAnalysisExams) state.examAnalysisExams = [];
      state.examAnalysisExams.push(newExam);
      window.stateManager.saveState();
      
      this.closeModal('modal-ea-add-exam');
      this.render();

      if (toastCallbackFn) toastCallbackFn('Sınav tanımı başarıyla kaydedildi. Notlar sekmesinden not girmeye başlayabilirsiniz.', 'success');
    }

    renderExamsList() {
      const tableBody = document.getElementById('ea-exams-table-body');
      const emptyState = document.getElementById('ea-exams-empty-state');
      const table = document.getElementById('ea-exams-table');
      if (!tableBody) return;

      tableBody.innerHTML = '';
      const state = window.stateManager.state;
      const exams = state.examAnalysisExams || [];

      if (exams.length === 0) {
        emptyState.style.display = 'flex';
        table.style.display = 'none';
      } else {
        emptyState.style.display = 'none';
        table.style.display = 'table';

        const sorted = [...exams].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        sorted.forEach(exam => {
          const branchBadges = exam.branches.map(b => `<span class="badge badge-info">${b}</span>`).join(' ');
          
          tableBody.innerHTML += `
            <tr>
              <td><strong>${exam.name}</strong></td>
              <td>${branchBadges}</td>
              <td>${exam.questions.length}</td>
              <td><strong>${exam.maxScore}</strong></td>
              <td>${new Date(exam.createdAt).toLocaleDateString('tr-TR')}</td>
              <td style="text-align: center;">
                <div style="display: flex; gap: 6px; justify-content: center;">
                  <button class="btn btn-primary btn-sm" onclick="examAnalysisTool.loadGradesForExam('${exam.id}')" title="Not Girişi">
                    <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i> Notlar
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="examAnalysisTool.showAnalysisForExam('${exam.id}')" title="Analiz">
                    <i data-lucide="bar-chart-3" style="width: 14px; height: 14px;"></i> Analiz
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="examAnalysisTool.deleteExam('${exam.id}')" title="Sil" style="color: var(--danger);">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Sil
                  </button>
                </div>
              </td>
            </tr>
          `;
        });
      }
      if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    deleteExam(examId) {
      if (confirm('Bu sınavı silmek istediğinize emin misiniz? Sınavla ilişkili tüm not verileri de kalıcı olarak silinecektir.')) {
        const state = window.stateManager.state;
        state.examAnalysisExams = (state.examAnalysisExams || []).filter(e => e.id !== examId);
        state.examAnalysisGrades = (state.examAnalysisGrades || []).filter(g => g.examId !== examId);

        window.stateManager.saveState();
        this.render();
        if (toastCallbackFn) toastCallbackFn('Sınav tanımı ve tüm ilişkili notları silindi.', 'info');
      }
    }

    populateExamSelectDropdowns() {
      const gradeSelect = document.getElementById('ea-grade-exam-select');
      const analSelect = document.getElementById('ea-analysis-exam-select');
      const state = window.stateManager.state;
      const exams = state.examAnalysisExams || [];

      if (gradeSelect) {
        const currVal = gradeSelect.value;
        gradeSelect.innerHTML = '<option value="">-- Sınav Seçin --</option>';
        exams.forEach(exam => {
          gradeSelect.innerHTML += `<option value="${exam.id}">${exam.name}</option>`;
        });
        if (exams.some(e => e.id === currVal)) gradeSelect.value = currVal;
      }

      if (analSelect) {
        const currVal = analSelect.value;
        analSelect.innerHTML = '<option value="">-- Analiz Edilecek Sınavı Seçin --</option>';
        exams.forEach(exam => {
          analSelect.innerHTML += `<option value="${exam.id}">${exam.name}</option>`;
        });
        if (exams.some(e => e.id === currVal)) analSelect.value = currVal;
      }
    }

    handleGradeSelectionChange() {
      const examSelect = document.getElementById('ea-grade-exam-select');
      const branchSelect = document.getElementById('ea-grade-branch-select');
      
      if (!examSelect || !branchSelect) return;

      const examId = examSelect.value;
      branchSelect.innerHTML = '<option value="">-- Şube Seçin --</option>';

      if (!examId) {
        document.getElementById('ea-grade-grid-container').style.display = 'none';
        document.getElementById('ea-grade-grid-placeholder').style.display = 'flex';
        document.getElementById('btn-ea-save-grades').style.display = 'none';
        document.getElementById('btn-ea-fill-zeros').style.display = 'none';
        return;
      }

      const state = window.stateManager.state;
      const exam = state.examAnalysisExams.find(e => e.id === examId);
      if (exam) {
        exam.branches.forEach(branch => {
          branchSelect.innerHTML += `<option value="${branch}">${branch}</option>`;
        });
      }

      this.renderGradeGrid();
    }

    renderGradeGrid() {
      const examId = document.getElementById('ea-grade-exam-select').value;
      const branch = document.getElementById('ea-grade-branch-select').value;
      
      const placeholder = document.getElementById('ea-grade-grid-placeholder');
      const container = document.getElementById('ea-grade-grid-container');
      const saveBtn = document.getElementById('btn-ea-save-grades');
      const fillZerosBtn = document.getElementById('btn-ea-fill-zeros');
      const gridTable = document.getElementById('ea-grade-grid-table');

      if (!examId || !branch) {
        container.style.display = 'none';
        placeholder.style.display = 'flex';
        saveBtn.style.display = 'none';
        fillZerosBtn.style.display = 'none';
        return;
      }

      placeholder.style.display = 'none';
      container.style.display = 'block';
      saveBtn.style.display = 'inline-flex';
      fillZerosBtn.style.display = 'inline-flex';

      const state = window.stateManager.state;
      const exam = state.examAnalysisExams.find(e => e.id === examId);
      
      const branchStudents = state.students
        ? state.students.filter(s => s.branch === branch)
        : [];

      branchStudents.sort((a, b) => {
        const numA = parseInt(a.number) || 0;
        const numB = parseInt(b.number) || 0;
        return numA - numB;
      });

      if (branchStudents.length === 0) {
        gridTable.innerHTML = `<tr><td style="color: var(--danger); text-align: center; padding: 30px;">Bu şubede (${branch}) kayıtlı öğrenci bulunamadı. Lütfen "Sınıf Listesi" veya "Ayarlar" sekmesinden öğrenci ekleyin.</td></tr>`;
        saveBtn.style.display = 'none';
        fillZerosBtn.style.display = 'none';
        return;
      }

      // Headers
      let headerHTML = `
        <tr>
          <th>Öğrenci (No - Ad Soyad)</th>
      `;
      exam.questions.forEach(q => {
        headerHTML += `
          <th style="text-align: center;">
            Soru ${q.number}
            <div style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted); margin-top: 2px;">(${q.maxPoints} p)</div>
          </th>
        `;
      });
      headerHTML += `
          <th style="width: 100px; text-align: center; font-weight: bold; background-color: var(--bg-secondary);">Toplam Not</th>
        </tr>
      `;

      // Rows
      let bodyHTML = '';
      branchStudents.forEach((student) => {
        const gradeRecord = state.examAnalysisGrades
          ? state.examAnalysisGrades.find(g => g.examId === examId && g.studentId === student.id)
          : null;
        const isAbsent = gradeRecord ? !!gradeRecord.isAbsent : true;

        let rowClass = isAbsent ? 'grade-row-absent' : '';
        
        bodyHTML += `
          <tr class="${rowClass}" data-studentid="${student.id}" id="ea-row-${student.id}">
            <td>
              <strong>${student.number}</strong> - ${student.name} ${student.surname || ''}
            </td>
        `;

        exam.questions.forEach(q => {
          let score = '';
          if (gradeRecord && !isAbsent) {
            score = gradeRecord.questionScores[q.number] !== undefined ? gradeRecord.questionScores[q.number] : '';
          }
          
          bodyHTML += `
            <td style="text-align: center;">
              <input type="text" 
                     class="grade-cell-input q-score-input" 
                     data-qnum="${q.number}" 
                     data-max="${q.maxPoints}" 
                     value="${score}" 
                     oninput="examAnalysisTool.validateAndSumRow('${student.id}')"
                     onkeydown="examAnalysisTool.handleGridKeydown(event, '${student.id}', ${q.number})">
            </td>
          `;
        });

        let totalVal = '';
        if (gradeRecord) {
          totalVal = isAbsent ? 'G (0)' : (gradeRecord.totalScore || 0);
        } else {
          totalVal = 'G (0)';
        }

        bodyHTML += `
            <td style="text-align: center; font-weight: bold; background-color: var(--bg-secondary);" class="row-total-score" id="ea-total-${student.id}">
              ${totalVal}
            </td>
          </tr>
        `;
      });

      gridTable.innerHTML = headerHTML + bodyHTML;
      if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    validateAndSumRow(studentId) {
      const row = document.getElementById(`ea-row-${studentId}`);
      const totalCell = document.getElementById(`ea-total-${studentId}`);

      const inputs = row.querySelectorAll('.q-score-input');
      let sum = 0;
      let anyFilled = false;
      let allValid = true;

      inputs.forEach(input => {
        const valStr = input.value.trim();
        const max = parseInt(input.getAttribute('data-max'));
        
        if (valStr !== '') {
          anyFilled = true;
          const val = parseFloat(valStr);
          if (isNaN(val) || val < 0 || val > max) {
            input.classList.add('invalid');
            allValid = false;
          } else {
            input.classList.remove('invalid');
            sum += val;
          }
        } else {
          input.classList.remove('invalid');
        }
      });

      if (anyFilled && allValid) {
        totalCell.innerText = sum;
        row.classList.remove('grade-row-absent');
      } else if (!allValid) {
        totalCell.innerText = 'Hata';
      } else {
        totalCell.innerText = 'G (0)';
        row.classList.add('grade-row-absent');
      }
    }

    autoFillZeros() {
      const rows = document.querySelectorAll('#ea-grade-grid-table tr[data-studentid]');
      let filledCount = 0;

      rows.forEach(row => {
        const inputs = row.querySelectorAll('.q-score-input');
        let hasAnyFilled = false;
        inputs.forEach(input => {
          if (input.value.trim() !== '') {
            hasAnyFilled = true;
          }
        });

        if (hasAnyFilled) {
          inputs.forEach(input => {
            if (input.value.trim() === '') {
              input.value = '0';
              filledCount++;
            }
          });
        }
      });

      if (filledCount > 0) {
        rows.forEach(row => {
          const studentId = row.getAttribute('data-studentid');
          if (studentId) this.validateAndSumRow(studentId);
        });
        if (toastCallbackFn) toastCallbackFn(`${filledCount} boş hücre '0' ile dolduruldu.`, 'success');
      } else {
        alert('Doldurulacak boş hücre bulunamadı (Katılmayan öğrencilerin tüm hücreleri boş bırakılır).');
      }
    }

    handleGridKeydown(e, studentId, qNum) {
      const key = e.key;
      const row = document.getElementById(`ea-row-${studentId}`);
      const currentInput = e.target;
      
      let targetRow = null;
      let targetInput = null;

      if (key === 'ArrowDown' || key === 'Enter') {
        e.preventDefault();
        targetRow = row.nextElementSibling;
        while (targetRow && !targetRow.hasAttribute('data-studentid')) {
          targetRow = targetRow.nextElementSibling;
        }
        if (targetRow) {
          targetInput = targetRow.querySelector(`.q-score-input[data-qnum="${qNum}"]`);
        }
      } else if (key === 'ArrowUp') {
        e.preventDefault();
        targetRow = row.previousElementSibling;
        while (targetRow && !targetRow.hasAttribute('data-studentid')) {
          targetRow = targetRow.previousElementSibling;
        }
        if (targetRow) {
          targetInput = targetRow.querySelector(`.q-score-input[data-qnum="${qNum}"]`);
        }
      } else if (key === 'ArrowRight') {
        if (currentInput.selectionEnd === currentInput.value.length) {
          const nextQ = qNum + 1;
          targetInput = row.querySelector(`.q-score-input[data-qnum="${nextQ}"]`);
        }
      } else if (key === 'ArrowLeft') {
        if (currentInput.selectionStart === 0) {
          const prevQ = qNum - 1;
          targetInput = row.querySelector(`.q-score-input[data-qnum="${prevQ}"]`);
        }
      }

      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    }

    saveGrades() {
      const examId = document.getElementById('ea-grade-exam-select').value;
      const branch = document.getElementById('ea-grade-branch-select').value;
      
      if (!examId || !branch) return;

      const state = window.stateManager.state;
      const exam = state.examAnalysisExams.find(e => e.id === examId);
      const rows = document.querySelectorAll('#ea-grade-grid-table tr[data-studentid]');
      
      let hasValidationError = false;
      const pendingGrades = [];

      rows.forEach(row => {
        const studentId = row.getAttribute('data-studentid');
        const inputs = row.querySelectorAll('.q-score-input');
        
        let allEmpty = true;
        inputs.forEach(input => {
          if (input.value.trim() !== '') allEmpty = false;
        });
        const isAbsent = allEmpty;
        
        const questionScores = {};
        let totalScore = 0;
        let allQuestionsFilled = true;

        if (!isAbsent) {
          inputs.forEach(input => {
            const qNum = parseInt(input.getAttribute('data-qnum'));
            const max = parseFloat(input.getAttribute('data-max'));
            const valStr = input.value.trim();

            if (valStr === '') {
              allQuestionsFilled = false;
              questionScores[qNum] = 0;
            } else {
              const score = parseFloat(valStr);
              if (isNaN(score) || score < 0 || score > max) {
                input.classList.add('invalid');
                hasValidationError = true;
              } else {
                questionScores[qNum] = score;
                totalScore += score;
              }
            }
          });
        }

        pendingGrades.push({
          examId,
          studentId,
          questionScores: isAbsent ? {} : questionScores,
          isAbsent,
          totalScore: isAbsent ? 0 : totalScore,
          allQuestionsFilled
        });
      });

      if (hasValidationError) {
        alert('Girdiğiniz puanlarda hatalar var. Kırmızı renkli hücreleri düzeltiniz (puan soru max puanından yüksek veya negatif olamaz).');
        return;
      }

      if (!state.examAnalysisGrades) state.examAnalysisGrades = [];

      // Merge grades
      pendingGrades.forEach(pending => {
        state.examAnalysisGrades = state.examAnalysisGrades.filter(
          g => !(g.examId === examId && g.studentId === pending.studentId)
        );
        
        state.examAnalysisGrades.push({
          examId: pending.examId,
          studentId: pending.studentId,
          questionScores: pending.questionScores,
          isAbsent: pending.isAbsent,
          totalScore: pending.totalScore
        });
      });

      window.stateManager.saveState();
      if (toastCallbackFn) toastCallbackFn('Notlar başarıyla kaydedildi.', 'success');
      
      if (confirm('Sınav analizi raporunu görüntülemek ister misiniz?')) {
        this.showAnalysisForExam(examId);
      } else {
        this.renderGradeGrid();
      }
    }

    // Stats Engine
    calculateStatistics(examId) {
      const state = window.stateManager.state;
      const exam = state.examAnalysisExams.find(e => e.id === examId);
      if (!exam) return null;

      const participatingStudents = state.students.filter(s => exam.branches.includes(s.branch));
      const grades = state.examAnalysisGrades ? state.examAnalysisGrades.filter(g => g.examId === examId) : [];

      const studentGradesMap = {};
      grades.forEach(g => {
        studentGradesMap[g.studentId] = g;
      });

      let participantCount = 0;
      let absentCount = 0;
      const scores = [];
      const branchScores = {};

      exam.branches.forEach(b => {
        branchScores[b] = [];
      });

      const studentList = participatingStudents.map(student => {
        const grade = studentGradesMap[student.id];
        const isAbsent = grade ? !!grade.isAbsent : true;

        if (grade && !isAbsent) {
          participantCount++;
          scores.push(grade.totalScore);
          if (branchScores[student.branch]) {
            branchScores[student.branch].push(grade.totalScore);
          }
        } else {
          absentCount++;
        }

        return {
          ...student,
          isAbsent,
          totalScore: (grade && !isAbsent) ? grade.totalScore : 0,
          questionScores: (grade && !isAbsent) ? grade.questionScores : {}
        };
      });

      const totalCount = participatingStudents.length;
      const sum = scores.reduce((a, b) => a + b, 0);
      const average = scores.length > 0 ? (sum / scores.length) : 0;
      const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
      const minScore = scores.length > 0 ? Math.min(...scores) : 0;

      let stdDev = 0;
      if (scores.length > 1) {
        const variance = scores.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / (scores.length - 1);
        stdDev = Math.sqrt(variance);
      }

      const branchAverages = {};
      exam.branches.forEach(b => {
        const bScores = branchScores[b] || [];
        const bSum = bScores.reduce((acc, curr) => acc + curr, 0);
        branchAverages[b] = bScores.length > 0 ? parseFloat((bSum / bScores.length).toFixed(1)) : 0;
      });

      const distribution = {
        '0-44': 0, '45-54': 0, '55-69': 0, '70-84': 0, '85-100': 0
      };

      scores.forEach(s => {
        if (s < 45) distribution['0-44']++;
        else if (s < 55) distribution['45-54']++;
        else if (s < 70) distribution['55-69']++;
        else if (s < 85) distribution['70-84']++;
        else distribution['85-100']++;
      });

      const validGrades = grades.filter(g => !g.isAbsent);

      const questionStats = exam.questions.map(q => {
        const qNum = q.number;
        let qSum = 0;
        let fullMarksCount = 0;
        
        validGrades.forEach(g => {
          const val = g.questionScores[qNum] !== undefined ? g.questionScores[qNum] : 0;
          qSum += val;
          if (val === q.maxPoints) {
            fullMarksCount++;
          }
        });

        const qAvg = validGrades.length > 0 ? (qSum / validGrades.length) : 0;
        const successPercent = q.maxPoints > 0 ? (qAvg / q.maxPoints) * 100 : 0;

        let difficulty = 'Orta';
        if (successPercent >= 80) difficulty = 'Çok Kolay';
        else if (successPercent >= 60) difficulty = 'Kolay';
        else if (successPercent >= 40) difficulty = 'Orta';
        else if (successPercent >= 20) difficulty = 'Zor';
        else difficulty = 'Çok Zor';

        return {
          number: qNum,
          maxPoints: q.maxPoints,
          averagePoints: parseFloat(qAvg.toFixed(2)),
          successPercent: parseFloat(successPercent.toFixed(1)),
          difficulty,
          outcome: q.outcome || `Soru ${qNum} Kazanımı`,
          fullMarksCount,
          fullMarksPercent: validGrades.length > 0 ? parseFloat(((fullMarksCount / validGrades.length) * 100).toFixed(1)) : 0
        };
      });

      return {
        exam,
        studentList,
        totalCount,
        participantCount,
        absentCount,
        average: parseFloat(average.toFixed(2)),
        maxScore,
        minScore,
        stdDev: parseFloat(stdDev.toFixed(2)),
        branchAverages,
        distribution,
        questionStats
      };
    }

    handleAnalysisExamChange() {
      const examId = document.getElementById('ea-analysis-exam-select').value;
      const placeholder = document.getElementById('ea-analysis-placeholder');
      const content = document.getElementById('ea-analysis-content');
      const printBtn = document.getElementById('btn-ea-print-report');

      if (!examId) {
        content.style.display = 'none';
        printBtn.style.display = 'none';
        placeholder.style.display = 'flex';
        return;
      }

      const state = window.stateManager.state;
      const exam = state.examAnalysisExams.find(e => e.id === examId);
      const participatingStudents = state.students.filter(s => exam.branches.includes(s.branch));
      
      const grades = state.examAnalysisGrades ? state.examAnalysisGrades.filter(g => g.examId === examId) : [];
      const gradedCount = grades.length;
      const missingCount = participatingStudents.length - gradedCount;

      if (missingCount > 0) {
        document.getElementById('ea-missing-grades-message').innerHTML = `
          Seçtiğiniz sınav için kayıtlı olan <strong>${participatingStudents.length}</strong> öğrenciden 
          <strong>${missingCount}</strong> tanesinin not girişi henüz yapılmamıştır.
        `;
        
        const confirmBtn = document.getElementById('btn-ea-confirm-proceed-analysis');
        
        // Clone to remove old click listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
          this.closeModal('modal-ea-confirm-missing-grades');
          this.renderAnalysisReports(examId);
        });

        this.openModal('modal-ea-confirm-missing-grades');
        
        placeholder.style.display = 'flex';
        placeholder.querySelector('.empty-state-title').innerText = 'Not Girişi Tamamlanmadı';
        placeholder.querySelector('.empty-state-description').innerText = `Seçili sınava katılan şubelerde (${exam.branches.join(', ')}) henüz not girişi yapılmamış ${missingCount} öğrenci var. Analizi sürdürmek için "Not Girişine Dön" veya "Analizi Göster" seçeneğini kullanın.`;
        content.style.display = 'none';
        printBtn.style.display = 'none';
      } else {
        this.renderAnalysisReports(examId);
      }
    }

    renderAnalysisReports(examId) {
      const placeholder = document.getElementById('ea-analysis-placeholder');
      const content = document.getElementById('ea-analysis-content');
      const printBtn = document.getElementById('btn-ea-print-report');

      const stats = this.calculateStatistics(examId);
      if (!stats || stats.participantCount === 0) {
        placeholder.style.display = 'flex';
        placeholder.querySelector('.empty-state-title').innerText = 'Analiz Edilecek Veri Yok';
        placeholder.querySelector('.empty-state-description').innerText = 'Seçilen sınav için girilen notlarda katılım sağlayan öğrenci bulunmuyor veya sınav kaydı hatalı.';
        content.style.display = 'none';
        printBtn.style.display = 'none';
        return;
      }

      placeholder.style.display = 'none';
      content.style.display = 'flex';
      printBtn.style.display = 'inline-flex';

      // General Metrics
      document.getElementById('ea-anal-stat-participants').innerText = `${stats.participantCount} / ${stats.totalCount}`;
      document.getElementById('ea-anal-stat-average').innerText = `% ${Math.round(stats.average)}`;
      document.getElementById('ea-anal-stat-max').innerText = stats.maxScore;
      document.getElementById('ea-anal-stat-min').innerText = stats.minScore;

      // Render Charts
      this.renderChartGradeDistribution(stats.distribution);
      this.renderChartBranchAverages(stats.branchAverages, stats.average);
      this.renderChartQuestionSuccess(stats.questionStats);

      // Question Table
      const qTableBody = document.getElementById('ea-analysis-questions-table-body');
      if (qTableBody) {
        qTableBody.innerHTML = '';
        stats.questionStats.forEach(q => {
          let diffBadge = 'badge-success';
          if (q.difficulty === 'Zor') diffBadge = 'badge-warning';
          else if (q.difficulty === 'Çok Zor') diffBadge = 'badge-danger';
          else if (q.difficulty === 'Orta') diffBadge = 'badge-info';

          qTableBody.innerHTML += `
            <tr>
              <td><strong>Soru ${q.number}</strong></td>
              <td>${q.maxPoints}</td>
              <td><strong>${q.averagePoints}</strong></td>
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-weight: 600; width: 40px;">%${q.successPercent}</span>
                  <div style="flex:1; background-color:#e2e8f0; height:6px; border-radius:3px; overflow:hidden; min-width:80px;">
                    <div style="background-color:var(--primary); height:100%; width:${q.successPercent}%"></div>
                  </div>
                </div>
              </td>
              <td><span class="badge ${diffBadge}">${q.difficulty}</span></td>
              <td style="white-space: normal; max-width: 250px;">${q.outcome}</td>
            </tr>
          `;
        });
      }

      // Student Table
      const sTableHead = document.getElementById('ea-analysis-students-table-head');
      const sTableBody = document.getElementById('ea-analysis-students-table-body');

      if (sTableHead && sTableBody) {
        let headHTML = `
          <tr>
            <th>No</th>
            <th>Öğrenci Adı Soyadı</th>
            <th>Şube</th>
        `;
        stats.exam.questions.forEach(q => {
          headHTML += `<th style="text-align:center;">S${q.number}</th>`;
        });
        headHTML += `
            <th style="text-align:center; font-weight:bold; background-color:var(--bg-secondary);">Toplam</th>
            <th style="text-align:center; font-weight:bold; background-color:var(--bg-secondary);">Başarı %</th>
          </tr>
        `;
        sTableHead.innerHTML = headHTML;

        sTableBody.innerHTML = '';
        const sortedStudents = [...stats.studentList].sort((a, b) => {
          if (a.branch !== b.branch) return a.branch.localeCompare(b.branch);
          return (parseInt(a.number) || 0) - (parseInt(b.number) || 0);
        });

        sortedStudents.forEach(student => {
          let scoreHTML = '';
          if (student.isAbsent) {
            scoreHTML = `<td colspan="${stats.exam.questions.length}" style="text-align:center; color:var(--text-light); font-style:italic; background-color:var(--bg-secondary);">Sınava Girmedi</td>`;
          } else {
            stats.exam.questions.forEach(q => {
              const val = student.questionScores[q.number] !== undefined ? student.questionScores[q.number] : 0;
              scoreHTML += `<td style="text-align:center;">${val}</td>`;
            });
          }

          const successRate = student.isAbsent ? 0 : Math.round((student.totalScore / stats.exam.maxScore) * 100);
          let rateBadgeClass = 'badge-danger';
          if (successRate >= 85) rateBadgeClass = 'badge-success';
          else if (successRate >= 55) rateBadgeClass = 'badge-info';
          else if (successRate >= 45) rateBadgeClass = 'badge-warning';

          sTableBody.innerHTML += `
            <tr class="${student.isAbsent ? 'grade-row-absent' : ''}">
              <td><strong>${student.number}</strong></td>
              <td>${student.name} ${student.surname || ''}</td>
              <td><span class="badge badge-info">${student.branch}</span></td>
              ${scoreHTML}
              <td style="text-align:center; font-weight:bold; background-color:var(--bg-secondary);">${student.isAbsent ? 'G (0)' : student.totalScore}</td>
              <td style="text-align:center; font-weight:bold; background-color:var(--bg-secondary);">
                <span class="badge ${rateBadgeClass}">%${successRate}</span>
              </td>
            </tr>
          `;
        });
      }
      if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    switchView(viewId, btn) {
      const parent = btn.parentNode;
      parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const container = document.querySelector('.ea-views-container');
      container.querySelectorAll('.ea-section-view').forEach(view => {
        if (view.id === viewId) {
          view.style.display = 'block';
        } else {
          view.style.display = 'none';
        }
      });

      this.currentView = viewId;

      if (viewId === 'ea-view-dashboard') {
        this.updateDashboardStats();
      } else if (viewId === 'ea-view-exams') {
        this.renderExamsList();
      } else if (viewId === 'ea-view-grades') {
        this.populateExamSelectDropdowns();
        this.handleGradeSelectionChange();
      } else if (viewId === 'ea-view-analysis') {
        this.populateExamSelectDropdowns();
        this.handleAnalysisExamChange();
      }
      if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    navigateToView(viewId) {
      let btnId = '';
      if (viewId === 'ea-view-dashboard') btnId = 'ea-tab-btn-dashboard';
      else if (viewId === 'ea-view-exams') btnId = 'ea-tab-btn-exams';
      else if (viewId === 'ea-view-grades') btnId = 'ea-tab-btn-grades';
      else if (viewId === 'ea-view-analysis') btnId = 'ea-tab-btn-analysis';

      const btn = document.getElementById(btnId);
      if (btn) {
        this.switchView(viewId, btn);
      }
    }

    switchAnalysisTab(tabId, btn) {
      btn.parentNode.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const content = document.getElementById('ea-analysis-content');
      content.querySelectorAll('.ea-tab-content').forEach(c => {
        if (c.id === tabId) {
          c.style.display = 'flex';
        } else {
          c.style.display = 'none';
        }
      });
      this.currentAnalysisTab = tabId;
      if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    // Chart.js renderers
    renderChartGradeDistribution(dist) {
      if (activeCharts.distribution) {
        activeCharts.distribution.destroy();
      }

      const canvas = document.getElementById('ea-chart-grade-distribution');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      activeCharts.distribution = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['0-44 (1 / Kalır)', '45-54 (2 / Geçer)', '55-69 (3 / Orta)', '70-84 (4 / İyi)', '85-100 (5 / Pekiyi)'],
          datasets: [{
            label: 'Öğrenci Sayısı',
            data: [dist['0-44'], dist['45-54'], dist['55-69'], dist['70-84'], dist['85-100']],
            backgroundColor: [
              'rgba(239, 68, 68, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(20, 184, 166, 0.7)',
              'rgba(16, 185, 129, 0.7)'
            ],
            borderColor: [
              '#ef4444', '#f59e0b', '#3b82f6', '#14b8a6', '#10b981'
            ],
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          }
        }
      });
    }

    renderChartBranchAverages(branchAvgs, overallAvg) {
      if (activeCharts.branches) {
        activeCharts.branches.destroy();
      }

      const canvas = document.getElementById('ea-chart-branch-averages');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const branches = Object.keys(branchAvgs);
      const avgs = Object.values(branchAvgs);

      const labels = [...branches, 'Genel Ort.'];
      const data = [...avgs, overallAvg];
      
      const backgroundColors = labels.map((l, i) => 
        i === labels.length - 1 ? 'rgba(99, 102, 241, 0.85)' : 'rgba(20, 184, 166, 0.7)'
      );
      const borderColors = labels.map((l, i) => 
        i === labels.length - 1 ? '#6366f1' : '#14b8a6'
      );

      activeCharts.branches = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Sınıf Ortalaması',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });
    }

    renderChartQuestionSuccess(qStats) {
      if (activeCharts.questions) {
        activeCharts.questions.destroy();
      }

      const canvas = document.getElementById('ea-chart-question-success');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const labels = qStats.map(q => `Soru ${q.number}`);
      const data = qStats.map(q => q.successPercent);

      activeCharts.questions = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Başarı Oranı (%)',
            data: data,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#6366f1',
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: value => '%' + value
              }
            }
          }
        }
      });
    }

    // A4 PRINT REPORT BUILDER
    printExamReport() {
      const examId = document.getElementById('ea-analysis-exam-select').value;
      if (!examId) return;

      const stats = this.calculateStatistics(examId);
      if (!stats) return;

      const distChartImg = activeCharts.distribution ? activeCharts.distribution.toBase64Image() : '';
      const branchChartImg = activeCharts.branches ? activeCharts.branches.toBase64Image() : '';
      const qSuccessChartImg = activeCharts.questions ? activeCharts.questions.toBase64Image() : '';

      // Print container element setup
      let printContainer = document.getElementById('ea-print-container');
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'ea-print-container';
        document.body.appendChild(printContainer);
      }
      printContainer.innerHTML = '';

      const studentsPerPage = 25;
      const sortedStudents = [...stats.studentList].sort((a, b) => {
        if (a.branch !== b.branch) return a.branch.localeCompare(b.branch);
        return (parseInt(a.number) || 0) - (parseInt(b.number) || 0);
      });

      const studentPages = [];
      for (let i = 0; i < sortedStudents.length; i += studentsPerPage) {
        studentPages.push(sortedStudents.slice(i, i + studentsPerPage));
      }

      const getHeaderHTML = (pageIndex, totalPages) => `
        <div class="print-header">
          <div class="print-header-logo">
            T.C.<br>MEB
          </div>
          <div class="print-header-center">
            <h2>YAZILI SINAV ANALİZ RAPORU</h2>
            <h3>${stats.exam.name}</h3>
            <p>Tarih: ${new Date(stats.exam.createdAt).toLocaleDateString('tr-TR')} &nbsp;|&nbsp; Soru Sayısı: ${stats.exam.questions.length} &nbsp;|&nbsp; Şubeler: ${stats.exam.branches.join(', ')}</p>
          </div>
          <div class="print-header-meta">
            <strong>Sayfa:</strong> ${pageIndex} / ${totalPages}<br>
            <strong>Ders Ort:</strong> %${Math.round(stats.average)}<br>
            <strong>Katılım:</strong> ${stats.participantCount} / ${stats.totalCount}
          </div>
        </div>
      `;

      const getSignaturesHTML = () => `
        <div class="print-signatures">
          <div class="print-signature-box">
            <div class="print-signature-line">.....................................</div>
            <div>${new Date().toLocaleDateString('tr-TR')}</div>
            <strong>Ders Öğretmeni</strong>
            <div class="print-signature-title">İmza</div>
          </div>
          <div class="print-signature-box">
            <div class="print-signature-line">.....................................</div>
            <div>&nbsp;</div>
            <strong>Okul Müdürü</strong>
            <div class="print-signature-title">İmza / Mühür</div>
          </div>
        </div>
      `;

      const totalPages = 2 + studentPages.length;
      let pageCount = 1;

      // PAGE 1
      let page1HTML = `
        <div class="print-page">
          ${getHeaderHTML(pageCount++, totalPages)}
          
          <div class="print-section-title">
            <span>1. GENEL İSTATİSTİKLER VE SINIF ORTALAMALARI</span>
          </div>

          <div class="print-stats-summary">
            <div class="print-stat-box">
              <div class="print-stat-label">Toplam Öğrenci</div>
              <div class="print-stat-val">${stats.totalCount}</div>
            </div>
            <div class="print-stat-box">
              <div class="print-stat-label">Sınava Katılan</div>
              <div class="print-stat-val">${stats.participantCount}</div>
            </div>
            <div class="print-stat-box">
              <div class="print-stat-label">Katılmayan (G)</div>
              <div class="print-stat-val">${stats.absentCount}</div>
            </div>
            <div class="print-stat-box">
              <div class="print-stat-label">Genel Başarı Ort.</div>
              <div class="print-stat-val">%${Math.round(stats.average)}</div>
            </div>
            <div class="print-stat-box">
              <div class="print-stat-label">En Yüksek Puan</div>
              <div class="print-stat-val">${stats.maxScore}</div>
            </div>
            <div class="print-stat-box">
              <div class="print-stat-label">En Düşük Puan</div>
              <div class="print-stat-val">${stats.minScore}</div>
            </div>
            <div class="print-stat-box">
              <div class="print-stat-label">Standart Sapma</div>
              <div class="print-stat-val">${stats.stdDev}</div>
            </div>
            <div class="print-stat-box">
              <div class="print-stat-label">Sınav Puan Değeri</div>
              <div class="print-stat-val">${stats.exam.maxScore} Puan</div>
            </div>
          </div>

          <div class="print-section-title">
            <span>ŞUBE BAZLI BAŞARI ORTALAMALARI</span>
          </div>
          <table class="print-table">
            <thead>
              <tr>
                <th>Şube Kodu</th>
                <th>Öğrenci Sayısı</th>
                <th>Sınava Giren</th>
                <th>Sınava Girmeyen</th>
                <th>Şube Sınav Ortalaması</th>
              </tr>
            </thead>
            <tbody>
      `;

      stats.exam.branches.forEach(branch => {
        const bStudents = stats.studentList.filter(s => s.branch === branch);
        const bParticipants = bStudents.filter(s => !s.isAbsent).length;
        const bAbsents = bStudents.filter(s => s.isAbsent).length;
        const bAvg = stats.branchAverages[branch] || 0;

        page1HTML += `
          <tr>
            <td><strong>${branch}</strong></td>
            <td>${bStudents.length}</td>
            <td>${bParticipants}</td>
            <td>${bAbsents}</td>
            <td><strong>${bAvg}</strong></td>
          </tr>
        `;
      });

      page1HTML += `
            </tbody>
          </table>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
            <div>
              <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 4px; text-align: center;">Not Dağılım Grafiği</div>
              <div class="print-chart-container">
                <img src="${distChartImg}" class="print-chart-img">
              </div>
            </div>
            <div>
              <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 4px; text-align: center;">Şube Karşılaştırma Grafiği</div>
              <div class="print-chart-container">
                <img src="${branchChartImg}" class="print-chart-img">
              </div>
            </div>
          </div>

          ${getSignaturesHTML()}
        </div>
      `;
      printContainer.innerHTML += page1HTML;

      // PAGE 2
      let page2HTML = `
        <div class="print-page">
          ${getHeaderHTML(pageCount++, totalPages)}

          <div class="print-section-title">
            <span>2. SORU BAZLI YAZILI ANALİZ TABLOSU</span>
          </div>

          <table class="print-table">
            <thead>
              <tr>
                <th style="width: 70px;">Soru No</th>
                <th style="width: 70px;">Max Puan</th>
                <th style="width: 90px;">Ortalama</th>
                <th style="width: 90px;">Başarı %</th>
                <th style="width: 90px;">Zorluk Derecesi</th>
                <th class="text-left">Kazanım / Öğrenme Alanı Açıklaması</th>
              </tr>
            </thead>
            <tbody>
      `;

      stats.questionStats.forEach(q => {
        page2HTML += `
          <tr>
            <td><strong>Soru ${q.number}</strong></td>
            <td>${q.maxPoints}</td>
            <td>${q.averagePoints}</td>
            <td><strong>%${q.successPercent}</strong></td>
            <td>${q.difficulty}</td>
            <td class="text-left" style="font-size:0.75rem;">${q.outcome}</td>
          </tr>
        `;
      });

      page2HTML += `
            </tbody>
          </table>

          <div class="print-section-title">
            <span>SORULARIN BAŞARI ORANLARI (%) GRAFİĞİ</span>
          </div>
          <div class="print-chart-container" style="height: 180px;">
            <img src="${qSuccessChartImg}" class="print-chart-img">
          </div>

          <div style="font-size: 0.75rem; border: 1px solid #ccc; padding: 10px; border-radius: 4px; background-color: #fafafa; line-height: 1.4;">
            <strong>Değerlendirme Notu:</strong><br>
            Sınav analizi neticesinde başarı oranı en yüksek soru <strong>Soru ${[...stats.questionStats].sort((a,b)=>b.successPercent - a.successPercent)[0]?.number || 1}</strong> 
            yüzde <strong>%${[...stats.questionStats].sort((a,b)=>b.successPercent - a.successPercent)[0]?.successPercent || 0}</strong> başarı ile olmuştur.
            En çok zorlanılan soru ise <strong>Soru ${[...stats.questionStats].sort((a,b)=>a.successPercent - b.successPercent)[0]?.number || 1}</strong> 
            yüzde <strong>%${[...stats.questionStats].sort((a,b)=>a.successPercent - b.successPercent)[0]?.successPercent || 0}</strong> başarı oranı ile gerçekleşmiştir.
            Bu durum öğrencilerin ilgili kazanımı tekrar gözden geçirmeleri gerektiğini işaret etmektedir.
          </div>

          ${getSignaturesHTML()}
        </div>
      `;
      printContainer.innerHTML += page2HTML;

      // PAGES 3+ (Student List)
      studentPages.forEach((studentsBatch, index) => {
        let qHeaders = '';
        stats.exam.questions.forEach(q => {
          qHeaders += `<th style="width: 35px; font-size:0.7rem;">S${q.number}</th>`;
        });

        let pageHTML = `
          <div class="print-page">
            ${getHeaderHTML(pageCount++, totalPages)}
  
            <div class="print-section-title">
              <span>3. ÖĞRENCİ BAZLI PUAN DAĞILIM LİSTESİ (SAYFA ${index + 1})</span>
            </div>
  
            <table class="print-table" style="font-size: 0.75rem !important;">
              <thead>
                <tr>
                  <th style="width: 60px;">No</th>
                  <th class="text-left">Öğrenci Adı Soyadı</th>
                  <th style="width: 50px;">Şube</th>
                  ${qHeaders}
                  <th style="width: 50px; font-weight: bold; background-color: #f1f5f9;">Toplam</th>
                  <th style="width: 50px; font-weight: bold; background-color: #f1f5f9;">Başarı%</th>
                </tr>
              </thead>
              <tbody>
        `;

        studentsBatch.forEach(student => {
          let qScores = '';
          if (student.isAbsent) {
            qScores = `<td colspan="${stats.exam.questions.length}" style="color: #666; font-style: italic; background-color: #f9f9f9;">Sınava Girmedi (G)</td>`;
          } else {
            stats.exam.questions.forEach(q => {
              const val = student.questionScores[q.number] !== undefined ? student.questionScores[q.number] : 0;
              qScores += `<td>${val}</td>`;
            });
          }

          const successRate = student.isAbsent ? 0 : Math.round((student.totalScore / stats.exam.maxScore) * 100);

          pageHTML += `
            <tr>
              <td><strong>${student.number}</strong></td>
              <td class="text-left">${student.name} ${student.surname || ''}</td>
              <td>${student.branch}</td>
              ${qScores}
              <td style="font-weight: bold; background-color: #f9f9f9;">${student.isAbsent ? 'G' : student.totalScore}</td>
              <td style="font-weight: bold; background-color: #f9f9f9;">%${successRate}</td>
            </tr>
          `;
        });

        pageHTML += `
              </tbody>
            </table>
  
            ${getSignaturesHTML()}
          </div>
        `;
        printContainer.innerHTML += pageHTML;
      });



      // Add print helper body class and trigger printing
      document.body.classList.add('print-exam-analysis');
      window.print();

      // Remove after printing completed
      setTimeout(() => {
        document.body.classList.remove('print-exam-analysis');
      }, 1000);
    }
  }

  // Global instance
  const examAnalysisTool = new ExamAnalysisTool();
  window.examAnalysisTool = examAnalysisTool;
  window.setupExamAnalysisTool = (toastCallback) => {
    examAnalysisTool.init(toastCallback);
  };
})();
