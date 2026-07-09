(() => {
  let timerInterval = null;
  let totalSeconds = 60; // Default: 1 minute
  let remainingSeconds = 60;
  let isRunning = false;
  let isFullscreen = false;
  let audioCtx = null;

  // DOM references
  let modal, timeDisplay, progressRing, btnStartPause, btnStartIcon, btnStartText;
  let chkSound, btnExpand, btnReset;
  const ringCircumference = 565.48; // 2 * PI * 90

  function initDOMElements() {
    modal = document.getElementById('modal-timer');
    timeDisplay = document.getElementById('timer-modal-time');
    progressRing = document.getElementById('timer-progress-ring');
    btnStartPause = document.getElementById('btn-timer-start-pause');
    btnStartIcon = document.getElementById('btn-timer-start-icon');
    btnStartText = document.getElementById('btn-timer-start-text');
    chkSound = document.getElementById('timer-sound-enable');
    btnExpand = document.getElementById('btn-timer-expand');
    btnReset = document.getElementById('btn-timer-reset');
  }

  function formatTime(secs) {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateUI() {
    if (!timeDisplay) initDOMElements();
    if (!timeDisplay) return;

    // Time text
    timeDisplay.textContent = formatTime(remainingSeconds);

    // Progress ring
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

    // Sync Start/Pause Button state
    if (isRunning) {
      btnStartPause.classList.add('running');
      btnStartText.textContent = 'Duraklat';
      btnStartIcon.setAttribute('data-lucide', 'pause');
    } else {
      btnStartPause.classList.remove('running');
      btnStartText.textContent = 'Başlat';
      btnStartIcon.setAttribute('data-lucide', 'play');
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

  function playTickSound() {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn("Tick sound failed:", e);
    }
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
      
      if (modal) {
        modal.classList.add('time-danger');
        progressRing.style.stroke = 'var(--danger)';
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

    // Play tick in final 5 seconds
    if (remainingSeconds < 5 && chkSound && chkSound.checked) {
      playTickSound();
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
    updateUI();
  }

  function pauseTimer() {
    if (!isRunning) return;
    isRunning = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    updateUI();
  }

  function resetTimer() {
    pauseTimer();
    remainingSeconds = totalSeconds;
    if (modal) {
      modal.classList.remove('time-warning', 'time-danger');
      progressRing.style.stroke = 'var(--primary)';
    }
    updateUI();
  }

  function adjustTime(amount) {
    if (!isRunning) {
      totalSeconds = Math.max(10, totalSeconds + amount);
      remainingSeconds = totalSeconds;
    } else {
      remainingSeconds = Math.max(0, remainingSeconds + amount);
      if (remainingSeconds > totalSeconds) {
        totalSeconds = remainingSeconds;
      }
    }
    updateUI();
  }

  window.initTimerModal = function() {
    initDOMElements();
    updateUI();
  };

  function setupListeners() {
    initDOMElements();
    if (!modal) return;

    // Close buttons
    modal.querySelectorAll('.close-btn, .close-btn-action').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.classList.remove('active');
        syncDashboardBtn();
      });
    });

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

    // Custom Adjusters
    document.getElementById('btn-timer-dec-min').addEventListener('click', () => adjustTime(-60));
    document.getElementById('btn-timer-dec-sec').addEventListener('click', () => adjustTime(-10));
    document.getElementById('btn-timer-inc-sec').addEventListener('click', () => adjustTime(10));
    document.getElementById('btn-timer-inc-min').addEventListener('click', () => adjustTime(60));

    // Controls
    btnStartPause.addEventListener('click', () => {
      initAudio();
      if (isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });

    btnReset.addEventListener('click', resetTimer);

    // Fullscreen/Expand toggle
    btnExpand.addEventListener('click', () => {
      isFullscreen = !isFullscreen;
      if (isFullscreen) {
        modal.classList.add('fullscreen-mode');
        btnExpand.innerHTML = '<i data-lucide="minimize" style="width: 14px; height: 14px;"></i> Normale Dön';
      } else {
        modal.classList.remove('fullscreen-mode');
        btnExpand.innerHTML = '<i data-lucide="maximize" style="width: 14px; height: 14px;"></i> Ekranı Kapla';
      }
      if (window.safeCreateIcons) {
        window.safeCreateIcons();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupListeners);
  } else {
    setupListeners();
  }
})();
