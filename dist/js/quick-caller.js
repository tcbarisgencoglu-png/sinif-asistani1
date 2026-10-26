(() => {
  let activeStudentId = null;
  let audioCtx = null;
  let isDrawing = false;
  let isMinimized = false;
  let minimizeTimeout = null;

  // DOM elements
  let modal, modalContainer, fullView, miniView, fullHeaderHandle;
  let card, photoContainer, photo, avatar, nameDisplay, noDisplay, poolIndicator, awardContainer, btnPlusOne, btnResetPool, btnDraw, btnMinimize;
  let miniDragHandle, miniAvatar, miniPhoto, miniName, miniBtnPlusOne, miniBtnDraw, miniBtnExpand, miniBtnClose;

  function initDOMElements() {
    modal = document.getElementById('modal-quick-caller');
    modalContainer = modal ? (modal.querySelector('#caller-modal-container') || modal.querySelector('.modal-content')) : null;
    fullView = document.getElementById('caller-full-view');
    miniView = document.getElementById('caller-mini-view');
    fullHeaderHandle = document.getElementById('caller-full-header');

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
    btnMinimize = document.getElementById('btn-caller-minimize');

    // Mini floating elements
    miniDragHandle = document.getElementById('caller-mini-drag-handle');
    miniAvatar = document.getElementById('caller-mini-avatar');
    miniPhoto = document.getElementById('caller-mini-photo');
    miniName = document.getElementById('caller-mini-name');
    miniBtnPlusOne = document.getElementById('btn-caller-mini-plus-one');
    miniBtnDraw = document.getElementById('btn-caller-mini-draw');
    miniBtnExpand = document.getElementById('btn-caller-mini-expand');
    miniBtnClose = document.getElementById('btn-caller-mini-close');
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
    const fullName = `${student.name} ${student.surname}`;

    // Full modal display
    if (student.photo) {
      if (avatar) avatar.style.display = 'none';
      if (photoContainer) photoContainer.style.display = 'block';
      if (photo) photo.src = student.photo;
      if (miniPhoto) {
        miniPhoto.src = student.photo;
        miniPhoto.style.display = 'block';
      }
      if (miniAvatar) miniAvatar.style.display = 'none';
    } else {
      if (photoContainer) photoContainer.style.display = 'none';
      const initials = `${student.name[0] || ''}${student.surname[0] || ''}`.toUpperCase();
      
      if (avatar) {
        avatar.style.display = 'flex';
        avatar.textContent = initials;
        if (student.gender === 'female') {
          avatar.style.backgroundColor = 'rgba(236, 72, 153, 0.1)';
          avatar.style.color = 'rgb(236, 72, 153)';
        } else {
          avatar.style.backgroundColor = 'var(--primary-light)';
          avatar.style.color = 'var(--primary)';
        }
      }

      if (miniPhoto) miniPhoto.style.display = 'none';
      if (miniAvatar) {
        miniAvatar.style.display = 'flex';
        miniAvatar.textContent = initials;
        if (student.gender === 'female') {
          miniAvatar.style.backgroundColor = 'rgba(236, 72, 153, 0.15)';
          miniAvatar.style.color = 'rgb(236, 72, 153)';
          miniAvatar.style.borderColor = 'rgb(236, 72, 153)';
        } else {
          miniAvatar.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
          miniAvatar.style.color = 'var(--primary)';
          miniAvatar.style.borderColor = 'var(--primary)';
        }
      }
    }

    if (nameDisplay) nameDisplay.textContent = fullName;
    if (noDisplay) noDisplay.textContent = `Okul No: ${student.number}`;
    if (miniName) miniName.textContent = fullName;
  }

  function showAwardContainer() {
    if (awardContainer) {
      awardContainer.style.visibility = 'visible';
      awardContainer.style.opacity = '1';
    }
  }

  function hideAwardContainer() {
    if (awardContainer) {
      awardContainer.style.visibility = 'hidden';
      awardContainer.style.opacity = '0';
    }
  }

  function setMinimized(minimized) {
    if (!modal) initDOMElements();
    if (!modal) return;

    if (minimizeTimeout) {
      clearTimeout(minimizeTimeout);
      minimizeTimeout = null;
    }

    isMinimized = !!minimized;

    if (isMinimized) {
      modal.classList.add('minimized');
      if (fullView) fullView.style.display = 'none';
      if (miniView) miniView.style.display = 'flex';

      // Sürüklenmemişse varsayılan konuma yerleştir
      if (modalContainer && !modalContainer.dataset.dragged) {
        modalContainer.style.left = '';
        modalContainer.style.top = '';
        modalContainer.style.right = '';
        modalContainer.style.bottom = '';
        modalContainer.style.margin = '';
        modalContainer.style.transform = '';

        // Süre ölçer de yüzen moddaysa üst üste çakışmasın
        const timerModal = document.getElementById('modal-timer');
        if (timerModal && timerModal.classList.contains('active') && timerModal.classList.contains('minimized')) {
          modalContainer.style.top = '78px';
        }
      }
    } else {
      modal.classList.remove('minimized');
      if (fullView) fullView.style.display = 'block';
      if (miniView) miniView.style.display = 'none';

      // Tam görünüme dönerken konumu sıfırla (ortala)
      if (modalContainer) {
        modalContainer.style.left = '';
        modalContainer.style.top = '';
        modalContainer.style.right = '';
        modalContainer.style.bottom = '';
        modalContainer.style.margin = '';
        modalContainer.style.transform = '';
        delete modalContainer.dataset.dragged;
      }
    }

    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }
  }

  function makeDraggable(element, handle) {
    if (!element || !handle) return;
    if (handle.dataset.draggableBound) return;
    handle.dataset.draggableBound = 'true';

    let isDragging = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

    function getCoords(e) {
      if (e.touches && e.touches.length > 0) {
        return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
      }
      return { clientX: e.clientX, clientY: e.clientY };
    }

    function onPointerDown(e) {
      // Buton veya tıklanabilir nesneler sürükleme başlatmasın
      if (e.target.closest('button, input, a, select, textarea, .close-btn, .btn, .caller-header-btn, .btn-caller-mini')) {
        return;
      }
      isDragging = true;
      const coords = getCoords(e);
      startX = coords.clientX;
      startY = coords.clientY;

      const rect = element.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      element.style.position = 'fixed';
      element.style.left = `${initialLeft}px`;
      element.style.top = `${initialTop}px`;
      element.style.right = 'auto';
      element.style.bottom = 'auto';
      element.style.margin = '0';
      element.style.transform = 'none';
      element.dataset.dragged = 'true';

      document.addEventListener('mousemove', onPointerMove, { passive: false });
      document.addEventListener('mouseup', onPointerUp);
      document.addEventListener('touchmove', onPointerMove, { passive: false });
      document.addEventListener('touchend', onPointerUp);
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      const coords = getCoords(e);
      const dx = coords.clientX - startX;
      const dy = coords.clientY - startY;

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      // Ekran sınırları içinde kalmasını sağla
      const maxLeft = Math.max(10, window.innerWidth - element.offsetWidth - 10);
      const maxTop = Math.max(10, window.innerHeight - element.offsetHeight - 10);
      newLeft = Math.max(10, Math.min(maxLeft, newLeft));
      newTop = Math.max(10, Math.min(maxTop, newTop));

      element.style.left = `${newLeft}px`;
      element.style.top = `${newTop}px`;
    }

    function onPointerUp() {
      isDragging = false;
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);
    }

    handle.addEventListener('mousedown', onPointerDown);
    handle.addEventListener('touchstart', onPointerDown, { passive: false });
  }

  function closeQuickCallerModal() {
    initDOMElements();
    if (!modal) modal = document.getElementById('modal-quick-caller');
    if (!modal) return;
    if (minimizeTimeout) {
      clearTimeout(minimizeTimeout);
      minimizeTimeout = null;
    }
    modal.classList.remove('active');
    modal.classList.remove('minimized');
    modal.style.display = 'none';
    if (card) card.classList.remove('winner');
    hideAwardContainer();
    activeStudentId = null;

    if (modalContainer) {
      modalContainer.style.left = '';
      modalContainer.style.top = '';
      modalContainer.style.right = '';
      modalContainer.style.bottom = '';
      modalContainer.style.margin = '';
      modalContainer.style.transform = '';
      delete modalContainer.dataset.dragged;
    }
    if (fullView) fullView.style.display = 'block';
    if (miniView) miniView.style.display = 'none';
    isMinimized = false;
  }
  window.closeQuickCallerModal = closeQuickCallerModal;

  window.openQuickCallerModal = function() {
    initDOMElements();
    if (!modal) modal = document.getElementById('modal-quick-caller');
    if (!modal) return;
    if (minimizeTimeout) {
      clearTimeout(minimizeTimeout);
      minimizeTimeout = null;
    }
    // Her yeni açılışta önce normal modal şeklinde aç
    setMinimized(false);
    modal.style.display = 'flex';
    modal.classList.add('active');
    window.initQuickCallerModal();
    if (window.safeCreateIcons) window.safeCreateIcons();
  };

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
      if (miniName) miniName.textContent = 'Öğrenci Seçilmedi';
      if (miniAvatar) {
        miniAvatar.style.display = 'flex';
        miniAvatar.textContent = '?';
      }
      if (miniPhoto) miniPhoto.style.display = 'none';
      hideAwardContainer();
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
    if (miniName) miniName.textContent = 'Öğrenci Seçilmedi';
    hideAwardContainer();
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

    if (minimizeTimeout) {
      clearTimeout(minimizeTimeout);
      minimizeTimeout = null;
    }

    isDrawing = true;
    if (card) card.classList.remove('winner');
    hideAwardContainer();
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
        showAwardContainer();
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

        // Birkaç kez animasyonla gösterildikten sonra otomatik olarak yüzen moda geç
        // Böylece arka plandaki ders içeriği rahatlıkla görünür
        if (minimizeTimeout) clearTimeout(minimizeTimeout);
        minimizeTimeout = setTimeout(() => {
          if (modal && (modal.classList.contains('active') || modal.style.display === 'flex') && !isDrawing) {
            setMinimized(true);
          }
        }, 1300);

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
    hideAwardContainer();

    // Puanlama tamamlandığında modalı temiz bir şekilde kapat
    closeQuickCallerModal();

    // Trigger global UI redraw
    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);
  }

  function setupListeners() {
    initDOMElements();
    if (!modal) return;

    // Draggable setup
    if (modalContainer) {
      if (fullHeaderHandle) makeDraggable(modalContainer, fullHeaderHandle);
      if (miniDragHandle) makeDraggable(modalContainer, miniDragHandle);
    }

    // Close buttons (Full view & general)
    modal.querySelectorAll('.close-btn, .close-btn-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (!isDrawing) {
          closeQuickCallerModal();
        }
      });
    });

    // Backdrop click closer (only in non-minimized mode)
    modal.addEventListener('click', (e) => {
      if (e.target === modal && !isDrawing && !isMinimized) {
        closeQuickCallerModal();
      }
    });

    // ESC key support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && (modal.classList.contains('active') || modal.style.display === 'flex') && !isDrawing) {
        closeQuickCallerModal();
      }
    });

    // Reset pool button
    if (btnResetPool) {
      btnResetPool.addEventListener('click', () => {
        if (!isDrawing) resetPool();
      });
    }

    // Draw button (Full modal)
    if (btnDraw) {
      btnDraw.addEventListener('click', () => {
        if (!isDrawing) drawStudent();
      });
    }

    // Award button (Full modal)
    if (btnPlusOne) {
      btnPlusOne.addEventListener('click', awardPoint);
    }

    // Minimize button in full view header
    if (btnMinimize) {
      btnMinimize.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDrawing) {
          setMinimized(true);
        }
      });
    }

    // Mini Floating View buttons
    if (miniBtnPlusOne) {
      miniBtnPlusOne.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        awardPoint();
      });
    }

    if (miniBtnDraw) {
      miniBtnDraw.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDrawing) {
          setMinimized(false);
          setTimeout(() => {
            drawStudent();
          }, 120);
        }
      });
    }

    if (miniBtnExpand) {
      miniBtnExpand.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMinimized(false);
      });
    }

    if (miniBtnClose) {
      miniBtnClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeQuickCallerModal();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupListeners);
  } else {
    setupListeners();
  }
})();
