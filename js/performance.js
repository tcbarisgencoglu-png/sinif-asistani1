(() => {
  let activeStudentId = null;
  let isWholeClass = false;
  let currentBehaviorType = 'positive'; // positive veya development
  let studentSearchQuery = '';
  let toastCallback = null;
  let audioCtx = null;

  // DOM Elements
  let modal, stepStudents, stepBehaviors, studentSearchInput, btnAllClass, studentsGrid, btnBack, targetNameDisplay, tabPositive, tabDevelopment, behaviorGrid, btnCloseHeader, btnCloseFooter;

  function initAudio() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {
      console.warn("Failed to initialize AudioContext for point chimes:", e);
    }
  }

  function playPointUpSound() {
    initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      // High-pitched sweet double chime: E6 (1318.51Hz) and A6 (1760.00Hz)
      const notes = [1318.51, 1760.00];
      notes.forEach((freq, idx) => {
        const time = now + idx * 0.08;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.15, time + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.4);
      });
    } catch (e) {
      console.warn("Point up sound failed:", e);
    }
  }

  function playPointDownSound() {
    initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      // Warning double chime: C5 (523.25Hz) and G4 (392.00Hz)
      const notes = [523.25, 392.00];
      notes.forEach((freq, idx) => {
        const time = now + idx * 0.12;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.08, time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.5);
      });
    } catch (e) {
      console.warn("Point down sound failed:", e);
    }
  }

  function setupPerformanceTab(showToast) {
    toastCallback = showToast;
    
    // Bind DOM elements dynamically
    modal = document.getElementById('modal-quick-give-point');
    if (!modal) return;

    stepStudents = document.getElementById('quick-point-step-students');
    stepBehaviors = document.getElementById('quick-point-step-behaviors');
    studentSearchInput = document.getElementById('quick-point-student-search');
    btnAllClass = document.getElementById('btn-quick-point-all-class');
    studentsGrid = document.getElementById('quick-point-students-grid');
    btnBack = document.getElementById('btn-quick-point-back');
    targetNameDisplay = document.getElementById('quick-point-target-name');
    tabPositive = document.getElementById('quick-point-tab-positive');
    tabDevelopment = document.getElementById('quick-point-tab-development');
    behaviorGrid = document.getElementById('quick-point-behavior-grid');
    btnCloseHeader = document.getElementById('btn-close-quick-point-modal');
    btnCloseFooter = document.getElementById('btn-close-quick-point-modal-footer');

    // Register Close Actions
    const closeFn = () => {
      modal.classList.remove('active');
      activeStudentId = null;
      isWholeClass = false;
    };
    if (btnCloseHeader) btnCloseHeader.addEventListener('click', closeFn);
    if (btnCloseFooter) btnCloseFooter.addEventListener('click', closeFn);
    
    // Backdrop click closer
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeFn();
      }
    });

    // Register Step 1 Listeners
    if (studentSearchInput) {
      studentSearchInput.addEventListener('input', (e) => {
        studentSearchQuery = e.target.value;
        renderQuickPointStudents();
      });
    }

    if (btnAllClass) {
      btnAllClass.addEventListener('click', () => {
        isWholeClass = true;
        activeStudentId = null;
        if (targetNameDisplay) targetNameDisplay.textContent = 'Tüm Sınıf';
        
        // Switch view to behaviors
        if (stepStudents) stepStudents.style.display = 'none';
        if (stepBehaviors) stepBehaviors.style.display = 'block';
        
        // Default to Positive tab
        currentBehaviorType = 'positive';
        if (tabPositive) tabPositive.classList.add('active');
        if (tabDevelopment) tabDevelopment.classList.remove('active');
        
        renderQuickPointBehaviors();
      });
    }

    // Register Step 2 Listeners
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        isWholeClass = false;
        activeStudentId = null;
        
        if (stepBehaviors) stepBehaviors.style.display = 'none';
        if (stepStudents) stepStudents.style.display = 'block';
      });
    }

    if (tabPositive && tabDevelopment) {
      tabPositive.addEventListener('click', () => {
        tabPositive.classList.add('active');
        tabDevelopment.classList.remove('active');
        currentBehaviorType = 'positive';
        renderQuickPointBehaviors();
      });

      tabDevelopment.addEventListener('click', () => {
        tabDevelopment.classList.add('active');
        tabPositive.classList.remove('active');
        currentBehaviorType = 'development';
        renderQuickPointBehaviors();
      });
    }
  }

  // Globally exposed trigger
  window.openQuickGivePointModal = function() {
    initAudio();
    if (!modal) return;

    // Reset views
    if (stepStudents) stepStudents.style.display = 'block';
    if (stepBehaviors) stepBehaviors.style.display = 'none';
    if (studentSearchInput) studentSearchInput.value = '';
    studentSearchQuery = '';
    isWholeClass = false;
    activeStudentId = null;

    renderQuickPointStudents();
    modal.classList.add('active');
    window.safeCreateIcons();
  };

  function renderQuickPointStudents() {
    if (!studentsGrid) return;
    studentsGrid.innerHTML = '';

    const state = stateManager.loadState();
    const allStudents = state.students || [];

    if (allStudents.length === 0) {
      studentsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted); font-weight: 500;">
          Sınıfta öğrenci bulunamadı. Lütfen önce öğrenci ekleyin.
        </div>
      `;
      return;
    }

    const selectBranch = document.getElementById('dash-select-branch');
    const branchFilter = selectBranch ? selectBranch.value : 'all';

    const query = studentSearchQuery.trim().toLowerCase('tr');
    const filtered = allStudents.filter(s => {
      const fullName = `${s.name} ${s.surname}`.toLowerCase('tr');
      const matchesQuery = fullName.includes(query) || (s.number && s.number.includes(query));
      const matchesBranch = state.educationLevel === 'primary' || branchFilter === 'all' || s.branch === branchFilter;
      return matchesQuery && matchesBranch;
    });

    if (filtered.length === 0) {
      studentsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted); font-weight: 500;">
          Arama sonucuyla eşleşen öğrenci bulunamadı.
        </div>
      `;
      return;
    }

    // Sort alphabetically
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    const activeWeekId = stateManager.getSelectedWeek();

    filtered.forEach(student => {
      const weeklyScore = stateManager.getStudentWeeklyScore(student.id, activeWeekId);
      const initials = `${student.name[0] || ''}${student.surname[0] || ''}`;
      
      const avatarHtml = student.photo
        ? `<img src="${student.photo}" class="avatar-sm" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin: 0;">`
        : `<div class="avatar-sm" style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; text-transform: uppercase; margin: 0; ${
            student.gender === 'female'
              ? 'background-color: rgba(236, 72, 153, 0.1); color: rgb(236, 72, 153);'
              : 'background-color: var(--primary-light); color: var(--primary);'
          }">${initials}</div>`;

      let weeklyScoreClass = '';
      if (weeklyScore > 0) weeklyScoreClass = 'completed';
      else if (weeklyScore < 0) weeklyScoreClass = 'missing';

      const card = document.createElement('div');
      card.className = 'quick-point-student-card';
      card.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-secondary); cursor: pointer; transition: all var(--transition-fast); text-align: center; position: relative;';
      card.innerHTML = `
        ${avatarHtml}
        <div style="font-weight: 600; font-size: 0.8rem; margin-top: 0.5rem; color: var(--text-primary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; width: 100%;" title="${student.name} ${student.surname}">${student.name} ${student.surname}</div>
        <div style="font-size: 0.7rem; color: var(--text-muted);">No: ${student.number}</div>
        <span class="status-badge ${weeklyScoreClass}" style="position: absolute; top: 5px; right: 5px; font-size: 0.7rem; padding: 0.1rem 0.35rem; min-width: 24px; text-align: center;">${weeklyScore >= 0 ? '+' : ''}${weeklyScore}</span>
      `;

      card.addEventListener('click', () => {
        isWholeClass = false;
        activeStudentId = student.id;
        if (targetNameDisplay) targetNameDisplay.textContent = `${student.name} ${student.surname}`;

        // Switch to behaviors Step
        if (stepStudents) stepStudents.style.display = 'none';
        if (stepBehaviors) stepBehaviors.style.display = 'block';

        // Default to Positive tab
        currentBehaviorType = 'positive';
        if (tabPositive) tabPositive.classList.add('active');
        if (tabDevelopment) tabDevelopment.classList.remove('active');

        renderQuickPointBehaviors();
      });

      studentsGrid.appendChild(card);
    });
  }

  function renderQuickPointBehaviors() {
    if (!behaviorGrid) return;
    behaviorGrid.innerHTML = '';

    const behaviorsList = (stateManager.getPerformanceBehaviors()[currentBehaviorType]) || [];

    behaviorsList.forEach(bh => {
      const card = document.createElement('div');
      card.className = `behavior-card ${currentBehaviorType}`;
      
      const pointSign = bh.point >= 0 ? '+' : '';
      const pointsText = bh.name === 'Kitap Aferinleri' 
        ? 'Puan Girin' 
        : `${pointSign}${bh.point} Puan`;

      card.innerHTML = `
        <div class="behavior-icon" style="font-size: 1.5rem;">${bh.icon}</div>
        <div class="behavior-name" style="font-weight: 600; font-size: 0.85rem;">${bh.name}</div>
        <div class="behavior-points" style="font-weight: 700; font-size: 0.75rem;">${pointsText}</div>
      `;

      card.addEventListener('click', () => {
        if (bh.name === 'Kitap Aferinleri') {
          const defaultVal = bh.point !== 0 ? bh.point.toString() : '5';
          const inputVal = prompt('Lütfen "Kitap Aferinleri" için verilecek puanı girin:', defaultVal);
          if (inputVal === null) return; // cancelled
          const parsedPoint = parseInt(inputVal);
          if (isNaN(parsedPoint)) {
            if (toastCallback) toastCallback('Lütfen geçerli bir puan değeri girin!', 'warning');
            return;
          }
          applyQuickPointBehavior({ ...bh, point: parsedPoint });
        } else {
          applyQuickPointBehavior(bh);
        }
      });

      behaviorGrid.appendChild(card);
    });
  }

  function applyQuickPointBehavior(behavior) {
    const activeWeekId = stateManager.getSelectedWeek();
    const state = stateManager.loadState();
    const allStudents = state.students || [];

    const selectBranch = document.getElementById('dash-select-branch');
    const branchFilter = selectBranch ? selectBranch.value : 'all';

    // Ortaokul kademesinde seçili şubeye göre filtreleme
    const targetStudents = allStudents.filter(s => {
      return state.educationLevel === 'primary' || branchFilter === 'all' || s.branch === branchFilter;
    });

    if (isWholeClass) {
      if (targetStudents.length === 0) return;
      
      targetStudents.forEach(student => {
        stateManager.addPerformance(student.id, currentBehaviorType, behavior.point, behavior.name, activeWeekId);
      });

      if (behavior.point >= 0) playPointUpSound();
      else playPointDownSound();

      if (toastCallback) {
        const targetText = state.educationLevel === 'middle' && branchFilter !== 'all' ? `"${branchFilter}" Şubesindeki tüm öğrencilere` : 'Tüm sınıfa';
        toastCallback(`${targetText} "${behavior.name}" (${behavior.point >= 0 ? '+' : ''}${behavior.point} Puan) başarıyla uygulandı.`, 'success');
      }
    } else {
      if (!activeStudentId) return;

      stateManager.addPerformance(activeStudentId, currentBehaviorType, behavior.point, behavior.name, activeWeekId);

      if (behavior.point >= 0) playPointUpSound();
      else playPointDownSound();

      if (toastCallback) {
        const student = allStudents.find(s => s.id === activeStudentId);
        const name = student ? `${student.name} ${student.surname}` : 'Öğrenci';
        toastCallback(`"${name}" adlı öğrenciye "${behavior.name}" (${behavior.point >= 0 ? '+' : ''}${behavior.point} Puan) başarıyla eklendi.`, 'success');
      }
    }

    // Close modal
    if (modal) modal.classList.remove('active');
    activeStudentId = null;
    isWholeClass = false;

    // Trigger state change event
    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);
  }

  // Exports
  window.setupPerformanceTab = setupPerformanceTab;
  window.renderDojoStudents = () => {}; // Stub for backward compatibility
})();
