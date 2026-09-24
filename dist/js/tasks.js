(() => {
  // DOM Elements
  const tasksContainer = document.getElementById('tasks-container');
  const tasksEmptyState = document.getElementById('tasks-empty-state');
  const searchTask = document.getElementById('search-task');
  const filterTaskStudent = document.getElementById('filter-task-student');
  
  // Modals & Forms
  const modalAssignTask = document.getElementById('modal-assign-task');
  const formAssignTask = document.getElementById('form-assign-task');
  const assignTaskStudent = document.getElementById('assign-task-student');
  const assignTaskDescription = document.getElementById('assign-task-description');
  const assignTaskPoints = document.getElementById('assign-task-points');
  const assignTaskDueDate = document.getElementById('assign-task-due-date');
  const btnAssignTask = document.getElementById('btn-assign-task');

  const modalCompleteTask = document.getElementById('modal-complete-task');
  const formCompleteTask = document.getElementById('form-complete-task');
  const completeTaskId = document.getElementById('complete-task-id');
  const completeTaskDate = document.getElementById('complete-task-date');

  let toastCallback = null;
  let activeTasksTab = 'active'; // 'active', 'completed', 'passive'

  // Helper for DD.MM.YYYY formatting
  function formatDateTR(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  }

  function setupTasksTab(showToast) {
    toastCallback = showToast;

    // Sub-tab button listeners
    const tasksTabButtons = document.querySelectorAll('[data-tasks-tab]');
    tasksTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        activeTasksTab = btn.getAttribute('data-tasks-tab');
        
        tasksTabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        renderTasksList();
      });
    });

    // Modal triggers and close hooks
    if (btnAssignTask) {
      btnAssignTask.addEventListener('click', () => {
        if (formAssignTask) formAssignTask.reset();
        populateStudentSelect();
        
        // Default values
        if (assignTaskPoints) assignTaskPoints.value = '5';
        if (assignTaskDueDate) {
          // Default deadline: today + 3 days
          const threeDaysLater = new Date();
          threeDaysLater.setDate(threeDaysLater.getDate() + 3);
          assignTaskDueDate.value = window.formatLocalDate(threeDaysLater);
        }
        
        if (modalAssignTask) modalAssignTask.classList.add('active');
      });
    }

    document.querySelectorAll('#modal-assign-task .close-btn, #modal-assign-task .close-btn-action').forEach(btn => {
      btn.addEventListener('click', () => {
        if (modalAssignTask) modalAssignTask.classList.remove('active');
      });
    });

    document.querySelectorAll('#modal-complete-task .close-btn, #modal-complete-task .close-btn-action').forEach(btn => {
      btn.addEventListener('click', () => {
        if (modalCompleteTask) modalCompleteTask.classList.remove('active');
      });
    });

    // Görev Teslim Tarihi Uyarısı Modal Dinleyicileri
    const modalTaskDueAlert = document.getElementById('modal-task-due-alert');
    const btnCloseTaskDueAlert = document.getElementById('btn-close-task-due-alert');
    const btnCloseTaskDueAlertX = document.getElementById('btn-close-task-due-alert-x');
    const btnGoToTasksFromAlert = document.getElementById('btn-go-to-tasks-from-alert');

    const dismissCurrentDueTasks = () => {
      if (modalTaskDueAlert) modalTaskDueAlert.classList.remove('active');
      const state = stateManager.loadState();
      const todayStr = window.formatLocalDate ? window.formatLocalDate() : new Date().toISOString().slice(0, 10);
      const validStudentIds = new Set((state.students || []).map(s => String(s.id)));
      const dueTaskIds = (state.tasks || [])
        .filter(t => t.status === 'active' && t.dueDate && t.dueDate <= todayStr && validStudentIds.has(String(t.studentId)))
        .map(t => t.id);
      sessionStorage.setItem('sinif_asistani_dismissed_due_task_ids', JSON.stringify(dueTaskIds));
    };

    if (btnCloseTaskDueAlert) btnCloseTaskDueAlert.addEventListener('click', dismissCurrentDueTasks);
    if (btnCloseTaskDueAlertX) btnCloseTaskDueAlertX.addEventListener('click', dismissCurrentDueTasks);

    if (btnGoToTasksFromAlert) {
      btnGoToTasksFromAlert.addEventListener('click', () => {
        dismissCurrentDueTasks();
        const tabBtn = document.querySelector('[data-tab="tasks"]');
        if (tabBtn) tabBtn.click();
      });
    }

    // Form Submission: Assign Task
    if (formAssignTask) {
      formAssignTask.addEventListener('submit', (e) => {
        e.preventDefault();
        const studentId = assignTaskStudent.value;
        const description = assignTaskDescription.value.trim();
        const points = parseInt(assignTaskPoints.value) || 5;
        const dueDate = assignTaskDueDate.value;

        if (!studentId || !description || !dueDate) {
          if (toastCallback) toastCallback('Lütfen tüm zorunlu alanları doldurun!', 'warning');
          return;
        }

        stateManager.addTaskAssignment(studentId, description, points, dueDate);
        
        if (toastCallback) toastCallback('Görev başarıyla öğrenciye atandı.', 'success');
        if (modalAssignTask) modalAssignTask.classList.remove('active');

        renderTasksList();
        
        // Trigger stateChanged globally
        const event = new CustomEvent('stateChanged');
        document.dispatchEvent(event);
      });
    }

    // Form Submission: Complete Task
    if (formCompleteTask) {
      formCompleteTask.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = completeTaskId.value;
        const date = completeTaskDate.value;

        if (!id || !date) {
          if (toastCallback) toastCallback('Lütfen teslim tarihini belirtin!', 'warning');
          return;
        }

        const success = stateManager.completeTaskAssignment(id, date);
        if (success) {
          if (toastCallback) toastCallback('Görev tamamlandı ve puan eklendi.', 'success');
        } else {
          if (toastCallback) toastCallback('Bir hata oluştu. Görev bulunamadı.', 'danger');
        }

        if (modalCompleteTask) modalCompleteTask.classList.remove('active');
        renderTasksList();

        const event = new CustomEvent('stateChanged');
        document.dispatchEvent(event);
      });
    }

    // Filter listeners
    if (searchTask) {
      searchTask.addEventListener('input', renderTasksList);
    }
    if (filterTaskStudent) {
      filterTaskStudent.addEventListener('change', renderTasksList);
    }
    
    const tasksFilterBranch = document.getElementById('tasks-filter-branch');
    if (tasksFilterBranch) {
      tasksFilterBranch.addEventListener('change', () => {
        populateStudentFilter();
        renderTasksList();
      });
    }

    // Populate search bar student dropdown initially
    populateStudentFilter();
    
    // Listen for state change to refresh dropdowns
    document.addEventListener('stateChanged', () => {
      populateStudentFilter();
      populateStudentSelect();
      checkDueTasksNotification();
    });
  }

  function populateStudentSelect() {
    if (!assignTaskStudent) return;
    const state = stateManager.loadState();
    
    assignTaskStudent.innerHTML = '<option value="" disabled selected>Öğrenci seçin...</option>';
    
    const selectBranch = document.getElementById('tasks-filter-branch');
    const branchFilter = selectBranch ? selectBranch.value : 'all';

    const activeStudents = state.students.filter(student => {
      return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
    });

    const sorted = [...activeStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    sorted.forEach(std => {
      const opt = document.createElement('option');
      opt.value = std.id;
      const branchText = std.branch ? ` [${std.branch}]` : '';
      opt.textContent = `${std.name} ${std.surname} (No: ${std.number})${branchText}`;
      assignTaskStudent.appendChild(opt);
    });
  }

  function populateStudentFilter() {
    if (!filterTaskStudent) return;
    const state = stateManager.loadState();
    const currentVal = filterTaskStudent.value || 'all';

    const selectBranch = document.getElementById('tasks-filter-branch');
    const branchFilter = selectBranch ? selectBranch.value : 'all';

    filterTaskStudent.innerHTML = '<option value="all">Tüm Öğrenciler</option>';

    const activeStudents = state.students.filter(student => {
      return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
    });

    const sorted = [...activeStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    sorted.forEach(std => {
      const opt = document.createElement('option');
      opt.value = std.id;
      opt.textContent = `${std.name} ${std.surname}`;
      filterTaskStudent.appendChild(opt);
    });

    const exists = activeStudents.some(s => s.id === currentVal);
    filterTaskStudent.value = exists ? currentVal : 'all';
  }

  function renderTasksList() {
    const state = stateManager.loadState();
    const query = searchTask ? searchTask.value.toLowerCase().trim() : '';
    const studentFilter = filterTaskStudent ? filterTaskStudent.value : 'all';
    const todayStr = window.formatLocalDate();
    const selectBranch = document.getElementById('tasks-filter-branch');
    const branchFilter = selectBranch ? selectBranch.value : 'all';

    if (!tasksContainer) return;
    tasksContainer.innerHTML = '';

    const allTasks = state.tasks || [];
    
    // Categorize
    const activeTasks = [];
    const completedTasks = [];
    const passiveTasks = [];

    allTasks.forEach(t => {
      if (t.status === 'completed') {
        completedTasks.push(t);
      } else if (t.dueDate < todayStr) {
        passiveTasks.push(t);
      } else {
        activeTasks.push(t);
      }
    });

    let listToRender = [];
    if (activeTasksTab === 'active') {
      listToRender = activeTasks;
    } else if (activeTasksTab === 'completed') {
      listToRender = completedTasks;
    } else if (activeTasksTab === 'passive') {
      listToRender = passiveTasks;
    }

    // Filter by student, query and branch
    const filteredList = listToRender.filter(t => {
      const student = state.students.find(s => String(s.id) === String(t.studentId));
      if (!student) return false;

      const matchesStudent = studentFilter === 'all' || String(t.studentId) === String(studentFilter);
      const matchesBranch = state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
      
      const fullName = `${student.name} ${student.surname}`.toLowerCase();
      const matchesQuery = fullName.includes(query) || 
                           student.number.includes(query) || 
                           t.description.toLowerCase().includes(query);

      return matchesStudent && matchesQuery && matchesBranch;
    });

    // Sorting
    if (activeTasksTab === 'completed') {
      // Completed tasks: sorted by completion date descending
      filteredList.sort((a, b) => b.completedDate.localeCompare(a.completedDate));
    } else {
      // Active and Passive tasks: sorted by due date ascending (closest deadline first)
      filteredList.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }

    // Display
    if (filteredList.length === 0) {
      if (tasksEmptyState) {
        tasksEmptyState.style.display = 'block';
        tasksEmptyState.innerHTML = `
          <i data-lucide="clipboard-list" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
          <p>Kriterlere uygun görev kaydı bulunmuyor.</p>
        `;
      }
      if (tasksContainer) tasksContainer.style.display = 'none';
      window.safeCreateIcons();
      return;
    }

    if (tasksEmptyState) tasksEmptyState.style.display = 'none';
    tasksContainer.style.display = 'grid';

    filteredList.forEach(task => {
      const student = state.students.find(s => s.id === task.studentId);
      if (!student) return;

      const initials = `${student.name[0] || ''}${student.surname[0] || ''}`;
      const avatarHtml = student.photo 
        ? `<img src="${student.photo}" class="task-student-avatar" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover;">`
        : `<div class="task-student-avatar" style="width: 45px; height: 45px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;">${initials}</div>`;

      const pointsSign = task.points >= 0 ? '+' : '';
      const pointsColor = task.points >= 0 ? 'var(--success)' : 'var(--danger)';

      const card = document.createElement('div');
      card.className = `glass-card task-card ${task.status === 'completed' ? 'completed' : (task.dueDate < todayStr ? 'overdue' : 'active')}`;

      let footerHtml = '';
      if (task.status === 'completed') {
        footerHtml = `
          <div class="task-card-footer" style="margin-top: 1.25rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.75rem; color: var(--success); font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
              <i data-lucide="check-circle-2" style="width: 14px; height: 14px;"></i> Teslim Alındı: ${formatDateTR(task.completedDate)}
            </span>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-danger btn-sm delete-task-btn" data-id="${task.id}" style="padding: 0.35rem; display: flex; align-items: center; justify-content: center;" title="Görevi Sil">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
              <button class="btn btn-secondary btn-sm undo-task-btn" data-id="${task.id}" style="padding: 0.35rem 0.6rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                <i data-lucide="undo-2" style="width: 12px; height: 12px;"></i> Geri Al
              </button>
            </div>
          </div>
        `;
      } else {
        const isOverdue = task.dueDate < todayStr;
        const dateBadgeClass = isOverdue ? 'task-overdue-badge' : 'task-date-badge';
        const dateIcon = isOverdue ? 'alert-triangle' : 'calendar';
        const dateLabel = isOverdue ? `Süresi Geçti: ${formatDateTR(task.dueDate)}` : `Son Tarih: ${formatDateTR(task.dueDate)}`;
        
        footerHtml = `
          <div class="task-card-footer" style="margin-top: 1.25rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <span class="${dateBadgeClass}" style="font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem; font-weight: 600; color: ${isOverdue ? 'var(--danger)' : 'var(--text-secondary)'};">
              <i data-lucide="${dateIcon}" style="width: 14px; height: 14px;"></i> ${dateLabel}
            </span>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-danger btn-sm delete-task-btn" data-id="${task.id}" style="padding: 0.35rem; display: flex; align-items: center; justify-content: center;" title="Görevi Sil">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
              <button class="btn btn-success btn-sm complete-task-btn" data-id="${task.id}" style="padding: 0.35rem 0.6rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.2rem;">
                <i data-lucide="check" style="width: 14px; height: 14px;"></i> Teslim Al
              </button>
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="task-card-header" style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem;">
          ${avatarHtml}
          <div style="flex: 1;">
            <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${student.name} ${student.surname}</h4>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Okul No: ${student.number}</span>
          </div>
          <span class="task-badge-points" style="font-size: 0.8rem; font-weight: 700; background: ${task.points >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'}; color: ${pointsColor}; padding: 0.2rem 0.5rem; border-radius: 4px;">
            ${pointsSign}${task.points} Puan
          </span>
        </div>
        <div class="task-card-body" style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; font-style: italic;">
          ${task.description}
        </div>
        ${footerHtml}
      `;

      // Event listener: Delete task
      const btnDelete = card.querySelector('.delete-task-btn');
      if (btnDelete) {
        btnDelete.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isConfirmed = window.confirmAsync 
            ? await window.confirmAsync('Bu görev kaydını silmek istediğinize emin misiniz?') 
            : confirm('Bu görev kaydını silmek istediğinize emin misiniz?');

          if (isConfirmed) {
            stateManager.deleteTaskAssignment(task.id);
            if (toastCallback) toastCallback('Görev silindi.', 'success');
            renderTasksList();
            
            const event = new CustomEvent('stateChanged');
            document.dispatchEvent(event);
          }
        });
      }

      // Event listener: Trigger complete task date modal
      const btnComplete = card.querySelector('.complete-task-btn');
      if (btnComplete) {
        btnComplete.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (completeTaskId) completeTaskId.value = task.id;
          if (completeTaskDate) completeTaskDate.value = window.formatLocalDate();
          if (modalCompleteTask) modalCompleteTask.classList.add('active');
        });
      }

      // Event listener: Revert completion status
      const btnUndo = card.querySelector('.undo-task-btn');
      if (btnUndo) {
        btnUndo.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isConfirmed = window.confirmAsync 
            ? await window.confirmAsync('Bu görevin teslim edilme durumunu iptal etmek ve eklenen puanı silmek istediğinize emin misiniz?') 
            : confirm('Bu görevin teslim edilme durumunu iptal etmek ve eklenen puanı silmek istediğinize emin misiniz?');

          if (isConfirmed) {
            const success = stateManager.undoTaskAssignmentCompletion(task.id);
            if (success) {
              if (toastCallback) toastCallback('Görev teslim işlemi iptal edildi ve puanlar geri alındı.', 'success');
              renderTasksList();
              
              const event = new CustomEvent('stateChanged');
              document.dispatchEvent(event);
            }
          }
        });
      }

      tasksContainer.appendChild(card);
    });

    window.safeCreateIcons();
  }

  // Görev Son Teslim Tarihi Bildirim Kontrolü
  function checkDueTasksNotification() {
    const modalTaskDueAlert = document.getElementById('modal-task-due-alert');
    const listContainer = document.getElementById('task-due-alert-list');
    if (!modalTaskDueAlert || !listContainer) return;

    const state = stateManager.loadState();
    const allTasks = state.tasks || [];
    const todayStr = window.formatLocalDate ? window.formatLocalDate() : new Date().toISOString().slice(0, 10);
    const studentsMap = new Map((state.students || []).map(s => [String(s.id), s]));

    // Sadece gerçekten sistemde kayıtlı olan öğrencilerin aktif ve süresi gelmiş görevlerini filtrele
    const dueTasks = allTasks.filter(t => t.status === 'active' && t.dueDate && t.dueDate <= todayStr && studentsMap.has(String(t.studentId)));
    if (dueTasks.length === 0) {
      modalTaskDueAlert.classList.remove('active');
      return;
    }

    // Bu oturumda daha önce onaylanmış görevleri kontrol et
    let dismissedIds = [];
    try {
      dismissedIds = JSON.parse(sessionStorage.getItem('sinif_asistani_dismissed_due_task_ids') || '[]');
    } catch (e) {
      dismissedIds = [];
    }

    const unhandledTasks = dueTasks.filter(t => !dismissedIds.includes(t.id));
    if (unhandledTasks.length === 0) {
      return; // Bu oturumda zaten öğretmen tarafından görüldü/kapatıldı
    }

    // Görev listesi html çıktısını üret
    listContainer.innerHTML = unhandledTasks.map(task => {
      const student = studentsMap.get(String(task.studentId));
      if (!student) return '';
      const studentName = `${student.name} ${student.surname}`;
      const studentNo = student.number ? `No: ${student.number}` : '';
      const branchText = student.branch ? ` [${student.branch}]` : '';
      const isOverdue = task.dueDate < todayStr;
      const isToday = task.dueDate === todayStr;
      
      const badgeText = isToday ? 'Bugün Son Gün!' : `Süresi Geçti: ${formatDateTR(task.dueDate)}`;
      const badgeBg = isToday ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      const badgeColor = isToday ? '#d97706' : '#ef4444';

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.75rem 1rem;">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${studentName}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${studentNo}${branchText}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${task.description}">
              ${task.description}
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem; flex-shrink: 0;">
            <span style="font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px; background: ${badgeBg}; color: ${badgeColor}; white-space: nowrap;">
              ${badgeText}
            </span>
            <span style="font-size: 0.75rem; font-weight: 600; color: var(--success);">
              +${task.points} Puan
            </span>
          </div>
        </div>
      `;
    }).filter(Boolean).join('');

    modalTaskDueAlert.classList.add('active');
    if (window.safeCreateIcons) window.safeCreateIcons();

    if (typeof window.playReminderAlertSound === 'function') {
      window.playReminderAlertSound();
    }
  }

  // İlk yükleme ve periyodik kontrol
  setTimeout(checkDueTasksNotification, 2000);
  setInterval(checkDueTasksNotification, 30000);

  window.setupTasksTab = setupTasksTab;
  window.renderTasksList = renderTasksList;
  window.checkDueTasksNotification = checkDueTasksNotification;
})();
