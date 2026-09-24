(() => {
  let timerInterval = null;
  let totalSeconds = 60; // Default: 1 minute
  let remainingSeconds = 60;
  let isRunning = false;
  let isFullscreen = false;
  let isMinimized = false;
  let audioCtx = null;

  // DOM references
  let modal, modalContainer, fullView, miniView;
  let timeDisplay, miniTimeDisplay, progressRing;
  let btnStartPause, btnStartIcon, btnStartText;
  let miniBtnStartPause, miniBtnStartIcon;
  let chkSound, chkAutoMinimize;
  let btnExpand, btnReset, btnMinimize, btnFloatAction;
  let miniBtnAdd, miniBtnReset, miniBtnExpand, miniBtnClose;
  let fullHeaderHandle, miniDragHandle;

  const ringCircumference = 565.48; // 2 * PI * 90

  function initDOMElements() {
    modal = document.getElementById('modal-timer');
    modalContainer = document.getElementById('timer-modal-container');
    fullView = document.getElementById('timer-full-view');
    miniView = document.getElementById('timer-mini-view');

    timeDisplay = document.getElementById('timer-modal-time');
    miniTimeDisplay = document.getElementById('timer-mini-time');
    progressRing = document.getElementById('timer-progress-ring');

    btnStartPause = document.getElementById('btn-timer-start-pause');
    btnStartIcon = document.getElementById('btn-timer-start-icon');
    btnStartText = document.getElementById('btn-timer-start-text');

    miniBtnStartPause = document.getElementById('btn-timer-mini-start-pause');
    miniBtnStartIcon = document.getElementById('btn-timer-mini-start-icon');
    miniBtnAdd = document.getElementById('btn-timer-mini-add');
    miniBtnReset = document.getElementById('btn-timer-mini-reset');
    miniBtnExpand = document.getElementById('btn-timer-mini-expand');
    miniBtnClose = document.getElementById('btn-timer-mini-close');

    chkSound = document.getElementById('timer-sound-enable');
    chkAutoMinimize = document.getElementById('timer-auto-minimize');

    btnExpand = document.getElementById('btn-timer-expand');
    btnReset = document.getElementById('btn-timer-reset');
    btnMinimize = document.getElementById('btn-timer-minimize');
    btnFloatAction = document.getElementById('btn-timer-float-action');

    fullHeaderHandle = document.getElementById('timer-full-header');
    miniDragHandle = document.getElementById('timer-mini-drag-handle');
  }

  function formatTime(secs) {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function setMinimized(minimized) {
    if (!modal) initDOMElements();
    if (!modal) return;

    if (isFullscreen && minimized) {
      // Tam ekrandan çık
      toggleFullscreen(false);
    }

    isMinimized = !!minimized;

    if (isMinimized) {
      modal.classList.add('minimized');
      if (fullView) fullView.style.display = 'none';
      if (miniView) miniView.style.display = 'flex';
    } else {
      modal.classList.remove('minimized');
      if (fullView) fullView.style.display = 'block';
      if (miniView) miniView.style.display = 'none';
    }

    // Pozisyonu sıfırla (varsayılan köşeye veya merkeze hizalansın)
    if (modalContainer) {
      modalContainer.style.left = '';
      modalContainer.style.top = '';
      modalContainer.style.right = '';
      modalContainer.style.bottom = '';
      modalContainer.style.margin = '';
      modalContainer.style.transform = '';
    }

    updateUI();

    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }
  }

  function toggleFullscreen(forceState) {
    isFullscreen = typeof forceState === 'boolean' ? forceState : !isFullscreen;
    if (isFullscreen) {
      if (isMinimized) setMinimized(false);
      modal.classList.add('fullscreen-mode');
      if (btnExpand) btnExpand.innerHTML = '<i data-lucide="minimize" style="width: 14px; height: 14px;"></i> Normale Dön';
    } else {
      modal.classList.remove('fullscreen-mode');
      if (btnExpand) btnExpand.innerHTML = '<i data-lucide="maximize" style="width: 14px; height: 14px;"></i> Ekranı Kapla';
    }
    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }
  }

  function updateUI() {
    if (!timeDisplay) initDOMElements();
    if (!timeDisplay) return;

    const formatted = formatTime(remainingSeconds);

    // Time text in full and mini views
    timeDisplay.textContent = formatted;
    if (miniTimeDisplay) {
      miniTimeDisplay.textContent = formatted;
    }

    // Progress ring
    if (progressRing) {
      const percent = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;
      const offset = ringCircumference - (percent / 100) * ringCircumference;
      progressRing.style.strokeDashoffset = offset;

      // Color warning states
      modal.classList.remove('time-warning', 'time-danger');
      if (isRunning || remainingSeconds === 0) {
        if (percent <= 10) {
          modal.classList.add('time-danger');
        } else if (percent <= 30) {
          modal.classList.add('time-warning');
        }
      }
    }

    // Sync Start/Pause Button state in Full View
    if (btnStartPause && btnStartText && btnStartIcon) {
      if (isRunning) {
        btnStartPause.classList.add('running');
        btnStartText.textContent = 'Duraklat';
        btnStartIcon.setAttribute('data-lucide', 'pause');
      } else {
        btnStartPause.classList.remove('running');
        btnStartText.textContent = 'Başlat';
        btnStartIcon.setAttribute('data-lucide', 'play');
      }
    }

    // Sync Start/Pause Button state in Mini View
    if (miniBtnStartPause && miniBtnStartIcon) {
      if (isRunning) {
        miniBtnStartPause.classList.add('running');
        miniBtnStartIcon.setAttribute('data-lucide', 'pause');
      } else {
        miniBtnStartPause.classList.remove('running');
        miniBtnStartIcon.setAttribute('data-lucide', 'play');
      }
    }

    // Sync dashboard button badge
    syncDashboardBtn();
    
    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }
  }

  function syncDashboardBtn() {
    const activeTimerBtn = document.getElementById('btn-dash-timer');
    if (activeTimerBtn) {
      if (isRunning) {
        activeTimerBtn.classList.add('active-running');
        activeTimerBtn.setAttribute('title', `Süre Tutuluyor: ${formatTime(remainingSeconds)}`);
      } else {
        activeTimerBtn.classList.remove('active-running');
        activeTimerBtn.setAttribute('title', 'Süre Tut');
      }
    }
  }

  let tickTockTimeout = null;
  let isTak = false;

  function stopTickTock() {
    if (tickTockTimeout) {
      clearTimeout(tickTockTimeout);
      tickTockTimeout = null;
    }
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

  function playTickTockSound() {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      isTak = !isTak;
      // "Tik" için 950Hz -> 180Hz, "Tak" için 720Hz -> 140Hz
      const startFreq = isTak ? 720 : 950;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.warn("Tick-tock sound failed:", e);
    }
  }

  function scheduleNextTickTock() {
    stopTickTock();
    if (!isRunning || remainingSeconds <= 0) return;
    if (!chkSound || !chkSound.checked) return;

    const threshold = totalSeconds * 0.3;
    if (remainingSeconds > threshold) {
      return; // Henüz son %30'a girilmedi
    }

    // Kalan sürenin son %30 içindeki oranı (1.0 = tam %30 başlangıcı, 0.0 = bitiş anı)
    const ratio = threshold > 0 ? Math.max(0, Math.min(1, remainingSeconds / threshold)) : 0;

    // Süre azaldıkça ses çalma sıklığı artar (1000ms'den 150ms'ye kadar hızlanır)
    const delayMs = 150 + Math.round(ratio * 850);

    playTickTockSound();

    tickTockTimeout = setTimeout(() => {
      scheduleNextTickTock();
    }, delayMs);
  }

  function playAlarmSound() {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    try {
      const duration = 0.2;
      const gap = 0.1;
      const now = audioCtx.currentTime;
      for (let i = 0; i < 3; i++) {
        const time = now + i * (duration + gap);
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, time);
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.4, time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + duration);
      }
    } catch (e) {
      console.warn("Alarm sound failed:", e);
    }
  }

  function tick() {
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      timerInterval = null;
      stopTickTock();
      
      if (modal) {
        modal.classList.add('time-danger');
        if (progressRing) progressRing.style.stroke = 'var(--danger)';
      }

      if (window.showToast) {
        window.showToast("Süre Tamamlandı!", "success");
      }

      if (chkSound && chkSound.checked) {
        playAlarmSound();
      }

      updateUI();
      return;
    }

    remainingSeconds--;

    // Son %30'a girildiğinde ve henüz zamanlayıcı başlatılmamışsa hızlanan tik-tak döngüsünü tetikle
    if (remainingSeconds <= totalSeconds * 0.3 && !tickTockTimeout && chkSound && chkSound.checked) {
      scheduleNextTickTock();
    }

    updateUI();
  }

  function startTimer() {
    if (isRunning) return;
    if (remainingSeconds <= 0) {
      remainingSeconds = totalSeconds;
    }
    isRunning = true;
    timerInterval = setInterval(tick, 1000);

    // Eğer otomatik küçültme aktifse ve tam ekran modunda değilsek, yüzen mini sayaca geç
    if (!isFullscreen && chkAutoMinimize && chkAutoMinimize.checked) {
      setMinimized(true);
    }

    // Zaten son %30 içindeyken başlatıldıysa tik-tak'ı hemen devreye al
    if (remainingSeconds <= totalSeconds * 0.3 && chkSound && chkSound.checked) {
      scheduleNextTickTock();
    }

    updateUI();
  }

  function pauseTimer() {
    if (!isRunning) return;
    isRunning = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    stopTickTock();
    updateUI();
  }

  function resetTimer() {
    pauseTimer();
    stopTickTock();
    remainingSeconds = totalSeconds;
    if (modal) {
      modal.classList.remove('time-warning', 'time-danger');
      if (progressRing) progressRing.style.stroke = 'var(--primary)';
    }
    updateUI();
  }

  function adjustTime(amount) {
    if (!isRunning) {
      totalSeconds = Math.max(10, totalSeconds + amount);
      remainingSeconds = totalSeconds;
      stopTickTock();
    } else {
      remainingSeconds = Math.max(0, remainingSeconds + amount);
      if (remainingSeconds > totalSeconds) {
        totalSeconds = remainingSeconds;
      }
      if (remainingSeconds > totalSeconds * 0.3) {
        stopTickTock();
      } else if (!tickTockTimeout && chkSound && chkSound.checked) {
        scheduleNextTickTock();
      }
    }
    updateUI();
  }

  // Akıllı tahta ve masaüstü için pencereleri sürüklenebilir yapma
  function makeDraggable(element, handle) {
    if (!element || !handle) return;
    let isDragging = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

    function getCoords(e) {
      if (e.touches && e.touches.length > 0) {
        return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
      }
      return { clientX: e.clientX, clientY: e.clientY };
    }

    function onPointerDown(e) {
      // Buton veya tıklanabilir nesneler sürüklü sayılmasın
      if (e.target.closest('button, input, a, select, textarea, .close-btn, .btn, .timer-header-btn, .btn-timer-mini')) {
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

      // Ekran dışına taşmayı engelle
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

  function closeTimerModal() {
    if (!modal) initDOMElements();
    if (!modal) return;
    modal.classList.remove('active');
    modal.classList.remove('minimized');
    modal.style.display = 'none';
    syncDashboardBtn();
  }

  window.closeTimerModal = closeTimerModal;

  window.initTimerModal = function() {
    initDOMElements();
    if (modal) {
      modal.style.display = '';
    }
    if (!isRunning && !isMinimized && modalContainer) {
      modalContainer.style.left = '';
      modalContainer.style.top = '';
      modalContainer.style.right = '';
      modalContainer.style.bottom = '';
      modalContainer.style.margin = '';
      modalContainer.style.transform = '';
    }
    updateUI();
  };

  function setupListeners() {
    initDOMElements();
    if (!modal) return;

    // Draggable desteği
    if (modalContainer) {
      if (fullHeaderHandle) makeDraggable(modalContainer, fullHeaderHandle);
      if (miniDragHandle) makeDraggable(modalContainer, miniDragHandle);
    }

    // Close buttons (Full view & general)
    modal.querySelectorAll('.close-btn, .close-btn-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeTimerModal();
      });
    });

    const btnCloseHeader = document.getElementById('btn-close-timer-modal');
    if (btnCloseHeader) {
      btnCloseHeader.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeTimerModal();
      });
    }

    const btnCloseFooterAction = document.getElementById('btn-close-timer-modal-action');
    if (btnCloseFooterAction) {
      btnCloseFooterAction.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeTimerModal();
      });
    }

    // Mini Close button
    if (miniBtnClose) {
      miniBtnClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeTimerModal();
      });
    }

    // Preset buttons
    modal.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const time = parseInt(btn.getAttribute('data-time'));
        if (!isNaN(time)) {
          totalSeconds = time;
          resetTimer();
        }
      });
    });

    // Custom Adjusters in Full View
    const decMin = document.getElementById('btn-timer-dec-min');
    const decSec = document.getElementById('btn-timer-dec-sec');
    const incSec = document.getElementById('btn-timer-inc-sec');
    const incMin = document.getElementById('btn-timer-inc-min');
    if (decMin) decMin.addEventListener('click', () => adjustTime(-60));
    if (decSec) decSec.addEventListener('click', () => adjustTime(-10));
    if (incSec) incSec.addEventListener('click', () => adjustTime(10));
    if (incMin) incMin.addEventListener('click', () => adjustTime(60));

    // Full View Controls
    if (btnStartPause) {
      btnStartPause.addEventListener('click', () => {
        initAudio();
        if (isRunning) {
          pauseTimer();
        } else {
          startTimer();
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', resetTimer);
    }

    // Mini View Controls
    if (miniBtnStartPause) {
      miniBtnStartPause.addEventListener('click', (e) => {
        e.stopPropagation();
        initAudio();
        if (isRunning) {
          pauseTimer();
        } else {
          startTimer();
        }
      });
    }

    if (miniBtnAdd) {
      miniBtnAdd.addEventListener('click', (e) => {
        e.stopPropagation();
        adjustTime(60);
      });
    }

    if (miniBtnReset) {
      miniBtnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        resetTimer();
      });
    }

    if (miniBtnExpand) {
      miniBtnExpand.addEventListener('click', (e) => {
        e.stopPropagation();
        setMinimized(false);
      });
    }

    // Minimize to Floating Widget Buttons
    if (btnMinimize) {
      btnMinimize.addEventListener('click', (e) => {
        e.preventDefault();
        setMinimized(true);
      });
    }

    if (btnFloatAction) {
      btnFloatAction.addEventListener('click', (e) => {
        e.preventDefault();
        setMinimized(true);
      });
    }

    // Sound checkbox toggle
    if (chkSound) {
      chkSound.addEventListener('change', () => {
        if (!chkSound.checked) {
          stopTickTock();
        } else if (isRunning && remainingSeconds <= totalSeconds * 0.3) {
          scheduleNextTickTock();
        }
      });
    }

    // Fullscreen/Expand toggle
    if (btnExpand) {
      btnExpand.addEventListener('click', () => {
        toggleFullscreen();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupListeners);
  } else {
    setupListeners();
  }
})();
