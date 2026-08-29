(() => {
  let activeStudentId = null;
  let audioCtx = null;
  let isDrawing = false;

  // DOM elements
  let modal, card, photoContainer, photo, avatar, nameDisplay, noDisplay, poolIndicator, awardContainer, btnPlusOne, btnResetPool, btnDraw;

  function initDOMElements() {
    modal = document.getElementById('modal-quick-caller');
    card = modal ? modal.querySelector('.caller-display-card') : null;
    photoContainer = document.getElementById('caller-student-photo-container');
    photo = document.getElementById('caller-student-photo');
    avatar = document.getElementById('caller-student-avatar');
    nameDisplay = document.getElementById('caller-student-name');
    noDisplay = document.getElementById('caller-student-no');
    poolIndicator = document.getElementById('caller-pool-indicator');
    awardContainer = document.getElementById('caller-award-container');
    btnPlusOne = document.getElementById('btn-caller-plus-one');
    btnResetPool = document.getElementById('btn-caller-reset-pool');
    btnDraw = document.getElementById('btn-caller-draw');
  }

  function initAudio() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {
      console.warn("Failed to initialize AudioContext:", e);
    }
  }

  function playTickSound(frequency = 600) {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);
      gainNode.gain.setValueAtTime(0.04, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.warn("Tick sound failed:", e);
    }
  }

  function playWinSound() {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      // C Major arpeggio notes: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const time = now + idx * 0.12;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.2, time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.5);
      });
    } catch (e) {
      console.warn("Win sound failed:", e);
    }
  }

  function getPoolKeys() {
    const state = stateManager.loadState();
    const selectBranch = document.getElementById('dash-select-branch');
    const branchFilter = selectBranch ? selectBranch.value : 'all';
    
    if (state.educationLevel === 'middle' && branchFilter !== 'all') {
      return {
        poolKey: `sinif_asistani_caller_pool_${branchFilter}`,
        calledKey: `sinif_asistani_caller_called_${branchFilter}`,
        branchFilter
      };
    }
    return {
      poolKey: 'sinif_asistani_caller_pool',
      calledKey: 'sinif_asistani_caller_called',
      branchFilter: 'all'
    };
  }

  function getPoolState() {
    const state = stateManager.loadState();
    let allStudents = state.students || [];
    if (window.LicenseConfig && window.LicenseConfig.isDemo) {
      allStudents = allStudents.slice(0, window.LicenseConfig.studentLimit);
    }

    const { poolKey, calledKey, branchFilter } = getPoolKeys();

    // Ortaokul kademesinde seçili şubeye göre öğrencileri filtrele
    if (state.educationLevel === 'middle' && branchFilter !== 'all') {
      allStudents = allStudents.filter(s => s.branch === branchFilter);
    }

    // Devamsız öğrencileri havuzdan çıkar
    allStudents = allStudents.filter(s => !stateManager.isStudentAbsent(s.id));

    if (allStudents.length === 0) {
      return { allStudents, pool: [], called: [] };
    }
    const allIds = allStudents.map(s => s.id);
    let pool = [];
    let called = [];

    try {
      const storedPool = localStorage.getItem(poolKey);
      const storedCalled = localStorage.getItem(calledKey);
      if (storedPool) pool = JSON.parse(storedPool);
      if (storedCalled) called = JSON.parse(storedCalled);
    } catch (e) {
      console.error("Failed to parse caller pool/called local storage:", e);
    }

    // Filter out invalid IDs (students deleted from db)
    pool = pool.filter(id => allIds.includes(id));
    called = called.filter(id => allIds.includes(id));

    // Auto-inject new student IDs not present in pool or called
    const missingIds = allIds.filter(id => !pool.includes(id) && !called.includes(id));
    if (missingIds.length > 0) {
      pool = [...pool, ...missingIds];
      localStorage.setItem(poolKey, JSON.stringify(pool));
    }

    // Refill the pool if it became empty (and we have students)
    if (pool.length === 0 && allIds.length > 0) {
      pool = [...allIds];
      called = [];
      localStorage.setItem(poolKey, JSON.stringify(pool));
      localStorage.setItem(calledKey, JSON.stringify(called));
    }

    return { allStudents, pool, called };
  }

  function updatePoolIndicator() {
    const { allStudents, pool } = getPoolState();
    if (poolIndicator) {
      if (allStudents.length === 0) {
        poolIndicator.textContent = "Seçim Havuzu: Sınıfta Öğrenci Yok";
      } else {
        poolIndicator.textContent = `Seçim Havuzu: ${pool.length} / ${allStudents.length}`;
      }
    }
  }

  function displayStudent(student) {
    if (!student) return;
    if (student.photo) {
      avatar.style.display = 'none';
      photoContainer.style.display = 'block';
      photo.src = student.photo;
    } else {
      photoContainer.style.display = 'none';
      avatar.style.display = 'flex';
      const initials = `${student.name[0] || ''}${student.surname[0] || ''}`;
      avatar.textContent = initials.toUpperCase();
      
      // Use gender colors for initials background
      if (student.gender === 'female') {
        avatar.style.backgroundColor = 'rgba(236, 72, 153, 0.1)';
        avatar.style.color = 'rgb(236, 72, 153)';
      } else {
        avatar.style.backgroundColor = 'var(--primary-light)';
        avatar.style.color = 'var(--primary)';
      }
    }
    nameDisplay.textContent = `${student.name} ${student.surname}`;
    noDisplay.textContent = `Okul No: ${student.number}`;
  }

  window.initQuickCallerModal = function() {
    initDOMElements();
    updatePoolIndicator();
    if (!isDrawing) {
      if (card) card.classList.remove('winner');
      if (photoContainer) photoContainer.style.display = 'none';
      if (avatar) {
        avatar.style.display = 'flex';
        avatar.textContent = '?';
        avatar.style.backgroundColor = 'var(--primary-light)';
        avatar.style.color = 'var(--primary)';
      }
      if (nameDisplay) nameDisplay.textContent = 'Öğrenci Seçilmedi';
      if (noDisplay) noDisplay.textContent = 'Tahtaya çağırmak için butona basın';
      if (awardContainer) awardContainer.style.display = 'none';
      activeStudentId = null;
    }
  };

  function resetPool() {
    initAudio();
    const { allStudents } = getPoolState();
    if (allStudents.length === 0) {
      if (window.showToast) {
        window.showToast("Havuz sıfırlanamadı: Sınıfta öğrenci yok.", "warning");
      }
      return;
    }
    const allIds = allStudents.map(s => s.id);
    const { poolKey, calledKey } = getPoolKeys();
    localStorage.setItem(poolKey, JSON.stringify(allIds));
    localStorage.setItem(calledKey, JSON.stringify([]));
    
    updatePoolIndicator();
    
    // UI state reset
    if (card) card.classList.remove('winner');
    if (photoContainer) photoContainer.style.display = 'none';
    if (avatar) {
      avatar.style.display = 'flex';
      avatar.textContent = '?';
      avatar.style.backgroundColor = 'var(--primary-light)';
      avatar.style.color = 'var(--primary)';
    }
    if (nameDisplay) nameDisplay.textContent = 'Öğrenci Seçilmedi';
    if (noDisplay) noDisplay.textContent = 'Tahtaya çağırmak için butona basın';
    if (awardContainer) awardContainer.style.display = 'none';
    activeStudentId = null;

    if (window.showToast) {
      window.showToast("Seçim havuzu sıfırlandı, tüm öğrenciler eklendi.", "success");
    }
  }

  function drawStudent() {
    if (isDrawing) return;
    initAudio();
    const { allStudents, pool, called } = getPoolState();

    if (allStudents.length === 0) {
      if (window.showToast) {
        window.showToast("Rastgele seçim yapmak için sınıfa öğrenci eklemelisiniz.", "warning");
      }
      return;
    }

    isDrawing = true;
    if (card) card.classList.remove('winner');
    if (awardContainer) awardContainer.style.display = 'none';
    activeStudentId = null;

    // Spinner details
    let currentStep = 0;
    const totalSteps = 25;
    let delay = 40;

    // Pick winner ID from pool
    const winnerId = pool[Math.floor(Math.random() * pool.length)];
    const winnerStudent = allStudents.find(s => s.id === winnerId);

    function spin() {
      if (currentStep >= totalSteps) {
        // Stop spinning and display the actual winner
        displayStudent(winnerStudent);
        if (card) card.classList.add('winner');
        if (awardContainer) awardContainer.style.display = 'flex';
        activeStudentId = winnerId;
        isDrawing = false;

        // Move student from pool to called
        const updatedPool = pool.filter(id => id !== winnerId);
        const updatedCalled = [...called, winnerId];
        const { poolKey, calledKey } = getPoolKeys();
        localStorage.setItem(poolKey, JSON.stringify(updatedPool));
        localStorage.setItem(calledKey, JSON.stringify(updatedCalled));

        updatePoolIndicator();
        playWinSound();
        return;
      }

      // Pick a random student to show temporarily during spin
      const tempStudent = allStudents[Math.floor(Math.random() * allStudents.length)];
      displayStudent(tempStudent);

      // Play click sound with shifting pitch
      playTickSound(550 + (currentStep * 15));

      currentStep++;
      // Exponentially slow down
      delay = 40 + Math.pow(currentStep / totalSteps, 2) * 350;
      setTimeout(spin, delay);
    }

    spin();
  }

  function awardPoint() {
    if (!activeStudentId) return;
    const activeWeekId = stateManager.getSelectedWeek();

    // Award dojo point
    stateManager.addPerformance(activeStudentId, 'positive', 1, 'Tahtada Gösterilen Performans', activeWeekId);

    // Get student info for toast
    const state = stateManager.loadState();
    const student = state.students.find(s => s.id === activeStudentId);
    const studentName = student ? `${student.name} ${student.surname}` : 'Öğrenci';

    if (window.showToast) {
      window.showToast(`"${studentName}" için +1 Performans Puanı eklendi!`, "success");
    }

    // Hide points container to prevent double award
    if (awardContainer) {
      awardContainer.style.display = 'none';
    }

    // Trigger global UI redraw
    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);
  }

  function setupListeners() {
    initDOMElements();
    if (!modal) return;

    // Close buttons
    modal.querySelectorAll('.close-btn, .close-btn-action').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!isDrawing) {
          modal.classList.remove('active');
        }
      });
    });

    // Reset pool button
    if (btnResetPool) {
      btnResetPool.addEventListener('click', () => {
        if (!isDrawing) resetPool();
      });
    }

    // Draw button
    if (btnDraw) {
      btnDraw.addEventListener('click', () => {
        if (!isDrawing) drawStudent();
      });
    }

    // Award button
    if (btnPlusOne) {
      btnPlusOne.addEventListener('click', awardPoint);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupListeners);
  } else {
    setupListeners();
  }
})();
