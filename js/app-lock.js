(() => {
  // =============================================
  // UYGULAMA KİLİT SİSTEMİ (app-lock.js)
  // Şifre koruma + Teneffüs modunda otomatik kilit
  // =============================================

  let isLocked = false;
  let breakCheckInterval = null;
  let manuallyUnlockedBreakId = null;

  function timeToMinutes(t) {
    if (!t) return -1;
    const parts = t.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  async function sha256(str) {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getCurrentBreakId() {
    const state = window.AppState ? window.AppState.state : null;
    if (!state || !state.scheduleTimes) return null;
    const times = state.scheduleTimes;
    const periodKeys = ['p1','p2','p3','p4','p5','p6','p7'].filter(k => times[k]);
    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return null;
    for (let i = 0; i < periodKeys.length - 1; i++) {
      const curEnd = timeToMinutes(times[periodKeys[i]].end);
      const nxtStart = timeToMinutes(times[periodKeys[i + 1]].start);
      if (curEnd < 0 || nxtStart < 0) continue;
      if (curMin > curEnd && curMin < nxtStart) return 'break-' + i;
    }
    if (times.lunch) {
      const lunchStart = timeToMinutes(times.lunch.start);
      const lunchEnd = timeToMinutes(times.lunch.end);
      if (curMin >= lunchStart && curMin < lunchEnd) return 'break-lunch';
    }
    return null;
  }

  function isScheduleConfigured() {
    const state = window.AppState ? window.AppState.state : null;
    if (!state || !state.scheduleTimes) return false;
    const times = state.scheduleTimes;
    const p1 = times['p1'];
    const p2 = times['p2'];
    return !!(p1 && p2 && p1.start && p1.end && p2.start && p2.end);
  }

  function lockApp(isBreakLock) {
    if (isLocked) return;
    isLocked = true;
    const overlay = document.getElementById('app-lock-overlay');
    if (!overlay) return;
    const msg = document.getElementById('lock-break-message');
    const title = document.getElementById('lock-title');
    if (isBreakLock) {
      if (msg) msg.style.display = 'flex';
      if (title) title.textContent = 'Teneffüs — Uygulama Kilitli';
    } else {
      if (msg) msg.style.display = 'none';
      if (title) title.textContent = 'Uygulama Kilitli';
    }
    const errEl = document.getElementById('lock-error-msg');
    if (errEl) errEl.style.display = 'none';
    const input = document.getElementById('lock-password-input');
    if (input) { input.value = ''; }
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('visible'));
    });
    setTimeout(() => { if (input) input.focus(); }, 400);
  }

  function unlockApp() {
    isLocked = false;
    const overlay = document.getElementById('app-lock-overlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 350);
  }

  async function attemptUnlock() {
    const input = document.getElementById('lock-password-input');
    const errEl = document.getElementById('lock-error-msg');
    if (!input) return;
    const password = input.value.trim();
    if (!password) {
      if (errEl) { errEl.textContent = 'Lütfen şifrenizi girin.'; errEl.style.display = 'block'; }
      return;
    }
    const state = window.AppState ? window.AppState.state : null;
    if (!state || !state.appLock) return;
    const enteredHash = await sha256(password);
    if (enteredHash === state.appLock.passwordHash) {
      const currentBreak = getCurrentBreakId();
      if (currentBreak) manuallyUnlockedBreakId = currentBreak;
      unlockApp();
    } else {
      if (errEl) {
        errEl.textContent = 'Yanlış şifre. Lütfen tekrar deneyin.';
        errEl.style.display = 'block';
        const lockBox = document.getElementById('lock-box');
        if (lockBox) {
          lockBox.classList.add('shake');
          setTimeout(() => lockBox.classList.remove('shake'), 600);
        }
      }
      input.value = '';
      input.focus();
    }
  }

  function checkBreakNow() {
    const state = window.AppState ? window.AppState.state : null;
    if (!state || !state.appLock) return;
    if (!state.appLock.enabled || !state.appLock.breakModeEnabled) return;
    if (isLocked) return;
    const currentBreak = getCurrentBreakId();
    if (!currentBreak) {
      manuallyUnlockedBreakId = null;
      return;
    }
    if (manuallyUnlockedBreakId === currentBreak) return;
    lockApp(true);
  }

  function startBreakCheck() {
    if (breakCheckInterval) clearInterval(breakCheckInterval);
    breakCheckInterval = setInterval(checkBreakNow, 30000);
    setTimeout(checkBreakNow, 1500);
  }

  function initLock() {
    const state = window.AppState ? window.AppState.state : null;
    if (!state || !state.appLock) return;
    if (state.appLock.enabled && state.appLock.passwordHash) lockApp(false);
    if (state.appLock.enabled && state.appLock.breakModeEnabled) startBreakCheck();
  }

  async function savePassword(newPassword) {
    const hash = await sha256(newPassword);
    const state = window.AppState ? window.AppState.state : null;
    if (!state) return false;
    if (!state.appLock) state.appLock = {};
    state.appLock.enabled = true;
    state.appLock.passwordHash = hash;
    window.AppState.saveState();
    if (state.appLock.breakModeEnabled) startBreakCheck();
    return true;
  }

  function removePassword() {
    const state = window.AppState ? window.AppState.state : null;
    if (!state) return;
    state.appLock = { enabled: false, passwordHash: null, breakModeEnabled: false };
    window.AppState.saveState();
    if (breakCheckInterval) { clearInterval(breakCheckInterval); breakCheckInterval = null; }
  }

  function setBreakMode(enabled) {
    const state = window.AppState ? window.AppState.state : null;
    if (!state || !state.appLock) return;
    state.appLock.breakModeEnabled = enabled;
    window.AppState.saveState();
    if (enabled && state.appLock.enabled) startBreakCheck();
    else if (breakCheckInterval) { clearInterval(breakCheckInterval); breakCheckInterval = null; }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const unlockBtn = document.getElementById('lock-unlock-btn');
    if (unlockBtn) unlockBtn.addEventListener('click', attemptUnlock);

    const input = document.getElementById('lock-password-input');
    if (input) {
      input.addEventListener('keypress', (e) => { if (e.key === 'Enter') attemptUnlock(); });
    }

    const forgotBtn = document.getElementById('lock-forgot-btn');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', () => {
        const confirmed = window.confirm(
          'UYARI: Şifrenizi sıfırlamak için TÜM VERİLERİNİZ SİLİNECEK.\n\n' +
          'Öğrenci bilgileri, notlar, ödevler dahil her şey kalıcı olarak silinir.\n\n' +
          'Devam etmek istiyor musunuz?'
        );
        if (confirmed) { localStorage.clear(); location.reload(); }
      });
    }

    setTimeout(initLock, 150);
  });

  window.AppLock = {
    savePassword,
    removePassword,
    setBreakMode,
    lockApp,
    unlockApp,
    isScheduleConfigured,
    getCurrentBreakId,
    get isLocked() { return isLocked; }
  };
})();
