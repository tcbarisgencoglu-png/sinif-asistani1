(() => {
  // Game state
  let groups = []; // Array of { id, name, students: [], score: 0 }
  let unassignedStudents = []; // Array of student objects
  let activeStudentId = null; // Currently clicked student ID during setup
  let draggedStudentId = null; // Currently dragged student ID (mouse or touch)
  let isDraggingSetup = false; // Flag to prevent click event interference during/after dragging
  let isTouchActive = false; // Flag to prevent emulated mouse/click events on touchscreens
  let unassignedSearchQuery = ""; // Query string for filtering unassigned student list
  let targetScore = 50;
  let timerSeconds = 30;
  let rewardText = "";
  
  // Active Play state
  let timerInterval = null;
  let timeLeft = 0;
  let timerRunning = false;
  let questions = [];
  let currentQuestion = null;
  let activeCategory = "all";
  let winningGroup = null;
  let victoryCountdownInterval = null;
  
  let toastCallback = null;

  // Web Audio API Sound Generator for Hazine Sandığı
  const TreasureSound = {
    ctx: null,
    tickToggle: false,

    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    },

    playTone(freq, type, duration, delay = 0) {
      this.init();
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
        
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + delay + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
      } catch (e) {
        console.warn("Audio Context error:", e);
      }
    },

    playClockTick() {
      this.init();
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        const freq = this.tickToggle ? 800 : 1000;
        this.tickToggle = !this.tickToggle;
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.025);
      } catch (e) {
        console.warn(e);
      }
    },

    playGong() {
      this.init();
      try {
        const now = this.ctx.currentTime;
        const partials = [
          { freq: 120, type: 'triangle', gain: 0.2, decay: 2.0 },
          { freq: 170, type: 'sine',     gain: 0.15, decay: 1.8 },
          { freq: 220, type: 'sine',     gain: 0.1, decay: 1.4 },
          { freq: 280, type: 'sine',     gain: 0.08, decay: 1.0 }
        ];

        partials.forEach(p => {
          const osc = this.ctx.createOscillator();
          const gainNode = this.ctx.createGain();
          
          osc.type = p.type;
          osc.frequency.setValueAtTime(p.freq, now);
          osc.frequency.exponentialRampToValueAtTime(p.freq * 0.96, now + p.decay);
          
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(p.gain, now + 0.04);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
          
          osc.connect(gainNode);
          gainNode.connect(this.ctx.destination);
          
          osc.start(now);
          osc.stop(now + p.decay + 0.1);
        });
      } catch (e) {
        console.warn("Audio Context error playing gong:", e);
      }
    },

    playVictoryMelody() {
      const now = 0;
      this.playTone(523.25, 'sine', 0.15, now); // C5
      this.playTone(659.25, 'sine', 0.15, now + 0.12); // E5
      this.playTone(783.99, 'sine', 0.15, now + 0.24); // G5
      this.playTone(1046.50, 'sine', 0.4, now + 0.36); // C6
    }
  };

  // Confetti Particle System
  let confettiActive = false;
  let confettiInterval = null;
  function startConfetti() {
    const canvas = document.getElementById("treasure-victory-confetti");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Fit canvas inside modal parent
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const colors = ["#4f46e5", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4"];
    const particles = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 3,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }
    
    confettiActive = true;
    function draw() {
      if (!confettiActive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 12;
        
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
        
        if (p.y > canvas.height) {
          particles[idx] = {
            x: Math.random() * canvas.width,
            y: -15,
            r: p.r,
            d: p.d,
            color: p.color,
            tilt: p.tilt,
            tiltAngleIncremental: p.tiltAngleIncremental,
            tiltAngle: p.tiltAngle
          };
        }
      });
      requestAnimationFrame(draw);
    }
    
    draw();
    
    confettiInterval = setTimeout(() => {
      confettiActive = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 6000);
  }

  function stopConfetti() {
    confettiActive = false;
    if (confettiInterval) {
      clearTimeout(confettiInterval);
    }
  }

  // DOM Elements
  const landingView = document.getElementById("games-landing-view");
  const treasureView = document.getElementById("games-treasure-view");
  
  // Setup DOM Elements
  const setupContainer = document.getElementById("treasure-setup-container");
  const activeLayout = document.getElementById("treasure-active-layout");
  
  const targetScoreInput = document.getElementById("treasure-target-score");
  const timerLimitInput = document.getElementById("treasure-timer-limit");
  const rewardTextInput = document.getElementById("treasure-reward-text");
  const groupCountSelect = document.getElementById("treasure-group-count");
  
  const setupGroupsGrid = document.getElementById("treasure-setup-groups-grid");
  const masterStudentsGrid = document.getElementById("treasure-setup-master-students-grid");
  const assignedCountDisplay = document.getElementById("treasure-assigned-count");
  const totalStudentsCountDisplay = document.getElementById("treasure-total-students-count");
  const genderFilterSelect = document.getElementById("treasure-gender-filter");
  const assignmentFilterSelect = document.getElementById("treasure-assignment-filter");
  
  const btnAutoDistribute = document.getElementById("btn-treasure-auto-distribute");
  const btnClearGroups = document.getElementById("btn-treasure-clear-groups");
  const btnStartGame = document.getElementById("btn-treasure-start-game");
  const btnBackToGames = document.getElementById("btn-back-to-games-from-treasure");

  // Show Answer DOM Elements
  const btnShowAnswer = document.getElementById("btn-treasure-show-answer");
  const answerContainer = document.getElementById("treasure-answer-container");
  const answerText = document.getElementById("treasure-answer-text");
  const answerExplanation = document.getElementById("treasure-answer-explanation");
  
  // Tab Containers
  const tabPlayContent = document.getElementById("game-treasure-tab-play-content");
  const tabQuestionsContent = document.getElementById("game-treasure-tab-questions-content");
  
  // Tab Nav Buttons
  const navPlayBtn = document.getElementById("btn-treasure-tab-play");
  const navQuestionsBtn = document.getElementById("btn-treasure-tab-questions");
  
  // Question CRUD Elements
  const questionForm = document.getElementById("treasure-question-form");
  const editQuestionId = document.getElementById("treasure-edit-question-id");
  const questionTypeSelect = document.getElementById("treasure-question-type");
  const questionCategoryInput = document.getElementById("treasure-question-category");
  const questionSentenceTextarea = document.getElementById("treasure-question-input");
  const questionAnswerInput = document.getElementById("treasure-question-answer");
  const questionAnswerTfSelect = document.getElementById("treasure-question-answer-tf");
  const questionWrongOptionsInput = document.getElementById("treasure-question-wrong-options");
  const questionExplanationInput = document.getElementById("treasure-question-explanation");
  const btnCancelQuestionEdit = document.getElementById("btn-treasure-cancel-question-edit");
  
  const questionFormTitle = document.getElementById("treasure-question-form-title");
  const questionCountBadge = document.getElementById("treasure-question-count-badge");
  const libraryCategoryFilter = document.getElementById("treasure-library-category-filter");
  const btnDeleteAllQuestions = document.getElementById("btn-treasure-delete-all-questions");
  const questionListBody = document.getElementById("treasure-question-list-body");
  
  const formAnswerTextGroup = document.getElementById("treasure-form-answer-text-group");
  const formAnswerTfGroup = document.getElementById("treasure-form-answer-tf-group");
  const formMcOptionsGroup = document.getElementById("treasure-form-mc-options-group");
  
  // Active Play DOM Elements
  const activeChestVisual = document.getElementById("active-chest-visual");
  const activeTargetScoreDisplay = document.getElementById("active-target-score-display");
  const activeRewardDisplay = document.getElementById("active-reward-display");
  
  const treasureQuestionText = document.getElementById("treasure-question-text");
  const questionCategoryBadge = document.getElementById("treasure-question-category-badge");
  const gameCategorySelect = document.getElementById("treasure-game-category");
  const btnNextQuestion = document.getElementById("btn-treasure-next-question");
  
  const timerText = document.getElementById("treasure-timer-text");
  const timerBar = document.getElementById("treasure-timer-bar");
  const btnTimerToggle = document.getElementById("btn-treasure-timer-toggle");
  const btnTimerReset = document.getElementById("btn-treasure-timer-reset");
  const timerIcon = document.getElementById("treasure-timer-icon");
  const timerBtnText = document.getElementById("treasure-timer-btn-text");
  
  const activeGroupsGrid = document.getElementById("treasure-active-groups-grid");
  const rankingsList = document.getElementById("treasure-rankings-list");
  const btnExitGame = document.getElementById("btn-treasure-exit-game");
  
  // Victory Overlay DOM Elements
  const victoryOverlay = document.getElementById("treasure-victory-overlay");
  const winnerTitle = document.getElementById("treasure-winner-title");
  const winnerReward = document.getElementById("treasure-winner-reward");
  const btnAwardDojo = document.getElementById("btn-treasure-award-dojo");
  const btnCloseVictory = document.getElementById("btn-treasure-close-victory");

  // Reward visibility states
  let isRewardInputHidden = false;
  let isActiveRewardPeeked = false;
  let isVictoryRewardHidden = false;

  // Load active students from StateManager
  function getActiveStudents() {
    if (window.stateManager && window.stateManager.state && window.stateManager.state.students) {
      let list = window.stateManager.state.students;
      if (window.LicenseConfig && window.LicenseConfig.isDemo) {
        list = list.slice(0, window.LicenseConfig.studentLimit);
      }
      return [...list];
    }
    return [];
  }

  // Load questions list from localStorage
  function loadQuestions() {
    try {
      const stored = localStorage.getItem("tf_questions");
      if (stored) {
        questions = JSON.parse(stored);
      } else {
        questions = [];
      }
    } catch (e) {
      questions = [];
    }
  }

  // Save active group setup config
  function saveGroupsConfig() {
    try {
      localStorage.setItem("treasure_saved_groups", JSON.stringify(groups));
      if (toastCallback) toastCallback("Grup kurulumu başarıyla kaydedildi.", "success");
    } catch (e) {
      console.error(e);
      if (toastCallback) toastCallback("Grup kurulumu kaydedilirken bir hata oluştu.", "danger");
    }
  }

  // Load saved group setup config
  function loadGroupsConfig() {
    try {
      const stored = localStorage.getItem("treasure_saved_groups");
      if (!stored) {
        if (toastCallback) toastCallback("Kayıtlı grup kurulumu bulunamadı!", "warning");
        return;
      }
      
      const savedGroups = JSON.parse(stored);
      if (!Array.isArray(savedGroups) || savedGroups.length === 0) {
        if (toastCallback) toastCallback("Geçersiz grup kurulum verisi!", "warning");
        return;
      }
      
      // Keep only students that still exist in the classroom
      const currentStudents = getActiveStudents();
      const currentIds = currentStudents.map(s => s.id);
      
      // Rebuild groups using saved structure
      groups = savedGroups.map(g => {
        const validStudents = g.students.filter(s => currentIds.includes(s.id));
        return {
          id: g.id,
          name: g.name,
          students: validStudents,
          score: 0
        };
      });
      
      // Update selected group count select dropdown
      if (groupCountSelect) {
        groupCountSelect.value = groups.length.toString();
      }
      
      // Set unassigned students list
      const assignedIds = [];
      groups.forEach(g => {
        g.students.forEach(s => assignedIds.push(s.id));
      });
      unassignedStudents = currentStudents.filter(s => !assignedIds.includes(s.id));
      unassignedStudents.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      
      // Clear search input on load
      const searchInput = document.getElementById("treasure-unassigned-search");
      if (searchInput) {
        searchInput.value = "";
      }
      unassignedSearchQuery = "";
      
      renderSetupGroups();
      renderUnassignedStudents();
      if (toastCallback) toastCallback("Grup kurulumu başarıyla yüklendi.", "success");
    } catch (e) {
      console.error(e);
      if (toastCallback) toastCallback("Grup kurulumu yüklenirken bir hata oluştu.", "danger");
    }
  }

  // Save questions list to localStorage
  function saveQuestions() {
    try {
      localStorage.setItem("tf_questions", JSON.stringify(questions));
    } catch (e) {
      console.error(e);
      if (toastCallback) toastCallback("Sorular kaydedilirken bir hata oluştu.", "danger");
    }
  }

  // Switch between Play and Questions sub-tabs
  function switchTreasureSubTab(tabName) {
    if (tabName === "play") {
      if (tabPlayContent) tabPlayContent.style.display = "block";
      if (tabQuestionsContent) tabQuestionsContent.style.display = "none";
      if (navPlayBtn) navPlayBtn.classList.add("active");
      if (navQuestionsBtn) navQuestionsBtn.classList.remove("active");
    } else if (tabName === "questions") {
      if (tabPlayContent) tabPlayContent.style.display = "none";
      if (tabQuestionsContent) tabQuestionsContent.style.display = "block";
      if (navPlayBtn) navPlayBtn.classList.remove("active");
      if (navQuestionsBtn) navQuestionsBtn.classList.add("active");
      renderTreasureQuestionLibrary();
    }
  }

  // Helper to format correct answer text for library list
  function getAnswerDisplay(q) {
    if (q.type === "tf") {
      return q.answer === true || q.answer === "true" ? "DOĞRU" : "YANLIŞ";
    } else if (q.type === "mc") {
      if (q.options && Array.isArray(q.options)) {
        const idx = parseInt(q.answer);
        if (!isNaN(idx) && idx >= 0 && idx < q.options.length) {
          const letters = ["A", "B", "C", "D", "E"];
          return `${letters[idx] || ''}) ${q.options[idx]}`;
        }
      }
      return q.answer || "";
    } else if (q.type === "fib") {
      if (q.options && Array.isArray(q.options) && q.options[0]) {
        return q.options[0];
      }
      return q.answer || "";
    } else if (q.type === "open") {
      return q.answer || "";
    }
    return q.answer || "";
  }

  // Populate Soru Kütüphanesi category filter dropdown
  function populateLibraryCategoryFilter() {
    if (!libraryCategoryFilter) return;
    
    const selectedVal = libraryCategoryFilter.value || "all";
    libraryCategoryFilter.innerHTML = '<option value="all">Tüm Kategoriler</option>';
    
    const cats = [...new Set(questions.map(q => q.category).filter(Boolean))];
    cats.sort().forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      libraryCategoryFilter.appendChild(opt);
    });
    
    if ([...libraryCategoryFilter.options].some(opt => opt.value === selectedVal)) {
      libraryCategoryFilter.value = selectedVal;
    } else {
      libraryCategoryFilter.value = "all";
    }
  }

  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function triggerDownload(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  let _allTreasurePackagesExpanded = false;

  window.toggleAllTreasurePackages = function() {
    _allTreasurePackagesExpanded = !_allTreasurePackagesExpanded;
    document.querySelectorAll(".treasure-package-body").forEach(el => {
      el.style.display = _allTreasurePackagesExpanded ? "block" : "none";
    });
    document.querySelectorAll(".treasure-package-chevron-box i").forEach(el => {
      el.style.transform = _allTreasurePackagesExpanded ? "rotate(180deg)" : "rotate(0deg)";
    });
    const btn = document.getElementById("btn-treasure-toggle-all-packages");
    if (btn) {
      btn.innerHTML = _allTreasurePackagesExpanded 
        ? '<i data-lucide="chevrons-up" style="width: 14px; height: 14px;"></i> Tümünü Kapat'
        : '<i data-lucide="chevrons-up-down" style="width: 14px; height: 14px;"></i> Tümünü Aç / Kapat';
    }
    if (window.safeCreateIcons) window.safeCreateIcons();
  };

  window.toggleTreasurePackage = function(safeId) {
    const body = document.getElementById(`treasure-body-${safeId}`);
    const chevron = document.getElementById(`treasure-chevron-${safeId}`);
    if (!body) return;
    const isClosed = body.style.display === "none";
    body.style.display = isClosed ? "block" : "none";
    if (chevron) {
      chevron.style.transform = isClosed ? "rotate(180deg)" : "rotate(0deg)";
    }
  };

  window.startTreasureWithPackage = function(catName) {
    activeCategory = catName;
    if (gameCategorySelect) {
      gameCategorySelect.value = catName;
    }
    switchTreasureSubTab("play");
    if (toastCallback) {
      toastCallback(`"${catName}" paketi seçildi. Oyunu başlatabilirsiniz!`, "info");
    }
  };

  window.deleteTreasurePackage = function(catName) {
    const pkgCount = questions.filter(q => (q.category || "Genel") === catName).length;
    if (confirm(`"${catName}" paketindeki TÜM soruları (${pkgCount} soru) silmek istediğinize emin misiniz?`)) {
      questions = questions.filter(q => (q.category || "Genel") !== catName);
      saveQuestions();
      populateLibraryCategoryFilter();
      populateCategorySelector();
      renderTreasureQuestionLibrary();
      if (toastCallback) toastCallback(`"${catName}" paketi silindi.`, "info");
    }
  };

  window.exportTreasurePackageJson = function(catName) {
    const catQuestions = questions.filter(q => (q.category || "Genel").trim() === catName.trim());
    if (catQuestions.length === 0) {
      alert("Bu pakette indirilecek soru bulunamadı.");
      return;
    }
    const exportData = catQuestions.map(q => ({
      type: q.type || "tf",
      category: q.category || "Genel",
      text: q.text || "",
      answer: q.answer,
      options: q.options || undefined,
      explanation: q.explanation || "",
      image: q.image || ""
    }));
    const cleanSlug = catName.toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, '_').replace(/^_+|_+$/g, '') || 'paket';
    const fileName = `hazine_sandigi_${cleanSlug}.json`;
    triggerDownload(JSON.stringify(exportData, null, 2), fileName, "application/json;charset=utf-8;");
    const msg = `"${catName}" paketi (${exportData.length} soru) JSON olarak indirildi.`;
    if (toastCallback) toastCallback(msg, "success");
    else alert(msg);
  };

  window.exportAllTreasureQuestionsJson = function() {
    if (questions.length === 0) {
      alert("Kütüphanede indirilecek soru bulunmuyor.");
      return;
    }
    const exportData = questions.map(q => ({
      type: q.type || "tf",
      category: q.category || "Genel",
      text: q.text || "",
      answer: q.answer,
      options: q.options || undefined,
      explanation: q.explanation || "",
      image: q.image || ""
    }));
    triggerDownload(JSON.stringify(exportData, null, 2), "hazine_sandigi_tum_soru_paketleri.json", "application/json;charset=utf-8;");
    const msg = `Tüm hazine soru kütüphanesi (${exportData.length} soru) JSON olarak indirildi.`;
    if (toastCallback) toastCallback(msg, "success");
    else alert(msg);
  };

  function importTreasureJSON(jsonText) {
    let data = JSON.parse(jsonText);
    if (!Array.isArray(data) && data && Array.isArray(data.questions)) {
      data = data.questions;
    }
    if (!Array.isArray(data)) {
      throw new Error("JSON içeriği bir liste (array) olmalıdır.");
    }

    let addedCount = 0;
    let startId = questions.length > 0 ? Math.max(...questions.map(q => parseInt(q.id) || 0)) + 1 : 1;

    data.forEach(item => {
      if (item.text && item.text.trim().length > 0) {
        const qType = (item.type === "mc" || item.type === "fib") ? item.type : "tf";
        const category = item.category ? item.category.trim() : "Genel";
        let ans;
        if (qType === "tf") {
          if (typeof item.answer === 'boolean') {
            ans = item.answer;
          } else if (typeof item.answer === 'string') {
            ans = (item.answer.toLowerCase() === 'true' || item.answer === '1' || item.answer.toLowerCase() === 'doğru' || item.answer.toLowerCase() === 'dogru');
          } else {
            ans = false;
          }
        } else {
          ans = parseInt(item.answer);
          if (isNaN(ans)) ans = 0;
        }

        const options = Array.isArray(item.options) 
          ? item.options.map(o => o.toString().trim()) 
          : (qType === "fib" && typeof item.answer === "string" ? [item.answer.trim()] : undefined);

        questions.push({
          id: startId++,
          type: qType,
          category: category,
          text: item.text.trim(),
          answer: ans,
          options: options,
          explanation: item.explanation ? item.explanation.trim() : "",
          image: item.image ? item.image.trim() : ""
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      saveQuestions();
      populateLibraryCategoryFilter();
      populateCategorySelector();
      renderTreasureQuestionLibrary();
      const succMsg = `${addedCount} adet soru başarıyla kütüphaneye eklendi!`;
      if (toastCallback) toastCallback(succMsg, "success");
      else alert(succMsg);
    } else {
      alert("Yüklenebilir geçerli soru bulunamadı.");
    }
  }
  window.importTreasureJSON = importTreasureJSON;

  // Render questions packages list in Soru Kütüphanesi
  function renderTreasureQuestionLibrary() {
    const pkgContainer = document.getElementById("treasure-packages-container");
    if (questionCountBadge) {
      questionCountBadge.textContent = `${questions.length} Soru`;
    }
    if (!pkgContainer) return;
    pkgContainer.innerHTML = "";

    if (questions.length === 0) {
      pkgContainer.innerHTML = `
        <div class="glass-card" style="text-align: center; padding: 2.5rem 1.5rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📦</div>
          <h4 style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.35rem;">Soru Havuzu Boş</h4>
          <p style="font-size: 0.88rem; margin: 0;">Henüz sisteme eklenmiş bir soru paketi bulunmuyor. Sol taraftaki formdan hemen yeni soru ekleyebilir veya <strong>JSON Yükle</strong> butonu ile hazır soru paketi yükleyebilirsiniz.</p>
        </div>
      `;
      return;
    }

    const categoryFilter = libraryCategoryFilter ? libraryCategoryFilter.value : "all";

    // Soruları kategoriye/pakete göre grupla
    const grouped = {};
    questions.forEach(q => {
      const cat = (q.category || "Genel").trim() || "Genel";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(q);
    });

    const categoryNames = Object.keys(grouped).sort();
    const filteredCategories = categoryFilter === "all"
      ? categoryNames
      : categoryNames.filter(cat => cat === categoryFilter);

    if (filteredCategories.length === 0) {
      pkgContainer.innerHTML = `
        <div class="glass-card" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <p style="margin: 0; font-size: 0.9rem;">"${escapeHTML(categoryFilter)}" paketinde soru bulunamadı.</p>
        </div>
      `;
      return;
    }

    filteredCategories.forEach((catName, index) => {
      const catQuestions = grouped[catName];
      const safeId = "tpkg_" + catName.replace(/[^a-zA-Z0-9]/g, "_") + "_" + index;

      const tfCount = catQuestions.filter(q => q.type === "tf").length;
      const mcCount = catQuestions.filter(q => q.type === "mc").length;
      const fibCount = catQuestions.filter(q => q.type === "fib").length;
      const openCount = catQuestions.filter(q => q.type === "open").length;

      const typeBadges = [];
      if (mcCount > 0) typeBadges.push(`<span class="badge" style="background: rgba(139, 92, 246, 0.12); color: #8b5cf6;">${mcCount} Çoktan Seçmeli</span>`);
      if (fibCount > 0) typeBadges.push(`<span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #10b981;">${fibCount} Boşluk Doldurma</span>`);
      if (openCount > 0) typeBadges.push(`<span class="badge" style="background: rgba(245, 158, 11, 0.12); color: #d97706;">${openCount} Açık Uçlu</span>`);
      if (tfCount > 0) typeBadges.push(`<span class="badge" style="background: rgba(59, 130, 246, 0.12); color: #3b82f6;">${tfCount} D/Y</span>`);

      let questionsRowsHtml = "";
      catQuestions.forEach((q, qIdx) => {
        const qType = q.type || "open";
        const typeBadge = qType === "mc"
          ? `<span class="badge" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6; font-weight: 700;">Ç.S.</span>`
          : qType === "fib"
            ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700;">B.D.</span>`
            : qType === "open"
              ? `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #d97706; font-weight: 700;">A.U.</span>`
              : `<span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; font-weight: 700;">D/Y</span>`;

        let answerHtml = "";
        if (qType === "tf") {
          answerHtml = (q.answer === true || q.answer === "true")
            ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 600;">✓ Doğru</span>`
            : `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; font-weight: 600;">✗ Yanlış</span>`;
        } else if (qType === "mc") {
          const letters = ["A", "B", "C", "D", "E"];
          const correctOptIdx = parseInt(q.answer) || 0;
          const correctOptVal = q.options ? q.options[correctOptIdx] : "";
          answerHtml = `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 600;" title="${escapeHTML(correctOptVal || '')}">${letters[correctOptIdx] || 'A'}) ${escapeHTML(correctOptVal || '')}</span>`;
        } else if (qType === "fib") {
          const correctVal = q.options && q.options.length > 0 ? q.options[0] : (typeof q.answer === "string" ? q.answer : "");
          answerHtml = `<span class="badge" style="background: rgba(6, 182, 212, 0.15); color: #06b6d4; font-weight: 600;">✓ ${escapeHTML(correctVal || '')}</span>`;
        } else if (qType === "open") {
          const ansStr = typeof q.answer === "string" ? q.answer : "";
          answerHtml = `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #d97706; font-weight: 600;" title="${escapeHTML(ansStr)}">💬 ${escapeHTML(ansStr || 'Model cevap')}</span>`;
        }

        questionsRowsHtml += `
          <tr class="quiz-pkg-q-row">
            <td style="width: 45px; text-align: center; color: var(--text-muted); font-size: 0.78rem;">#${qIdx + 1}</td>
            <td style="width: 65px;">${typeBadge}</td>
            <td style="font-weight: 500; color: var(--text-primary); line-height: 1.45;">
              ${escapeHTML(q.text)}
              ${q.explanation ? `<div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 3px; font-style: italic;">💡 ${escapeHTML(q.explanation)}</div>` : ''}
            </td>
            <td style="width: 170px;">${answerHtml}</td>
            <td style="width: 100px; text-align: right;">
              <div style="display: inline-flex; gap: 4px;">
                <button type="button" class="btn btn-secondary btn-xs btn-edit-treasure-q" data-id="${q.id}" title="Düzenle">
                  <i data-lucide="edit-2" style="width:13px;height:13px;"></i>
                </button>
                <button type="button" class="btn btn-danger btn-xs btn-delete-treasure-q" data-id="${q.id}" title="Sil">
                  <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      const pkgCard = document.createElement("div");
      pkgCard.className = "quiz-package-card";
      pkgCard.id = `treasure-card-${safeId}`;

      pkgCard.innerHTML = `
        <div class="quiz-package-header" onclick="window.toggleTreasurePackage('${safeId}')">
          <div class="quiz-package-left">
            <div class="quiz-package-icon" style="background: rgba(245, 158, 11, 0.15); color: #d97706;">
              <i data-lucide="folder" style="width: 22px; height: 22px;"></i>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <h4 class="quiz-package-title">${escapeHTML(catName)}</h4>
                <span class="quiz-package-count-badge" style="background: var(--warning-dark, #d97706);">${catQuestions.length} Soru</span>
              </div>
              <div class="quiz-package-badges-row">
                ${typeBadges.join(" ")}
              </div>
            </div>
          </div>

          <div class="quiz-package-right" onclick="event.stopPropagation()">
            <button type="button" class="btn btn-warning btn-sm" onclick="window.startTreasureWithPackage('${escapeHTML(catName)}')" style="display: inline-flex; align-items: center; gap: 0.3rem; font-weight: 600;">
              <i data-lucide="play" style="width: 13px; height: 13px;"></i> Bu Paketle Oyna
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.exportTreasurePackageJson('${escapeHTML(catName)}')" style="display: inline-flex; align-items: center; gap: 0.3rem;" title="Bu soru paketini JSON dosyası olarak indir">
              <i data-lucide="download" style="width: 13px; height: 13px;"></i> JSON İndir
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.deleteTreasurePackage('${escapeHTML(catName)}')" style="display: inline-flex; align-items: center; gap: 0.3rem; color: #ef4444;" title="Bu paketteki tüm soruları sil">
              <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i> Paketi Sil
            </button>
            <div class="quiz-package-chevron-box treasure-package-chevron-box" onclick="window.toggleTreasurePackage('${safeId}')" style="cursor: pointer;">
              <i data-lucide="chevron-down" id="treasure-chevron-${safeId}" style="width: 20px; height: 20px; transition: transform 0.2s;"></i>
            </div>
          </div>
        </div>

        <div class="quiz-package-body treasure-package-body" id="treasure-body-${safeId}" style="display: none;">
          <div style="overflow-x: auto;">
            <table class="table" style="font-size: 0.85rem; width: 100%; margin: 0;">
              <thead>
                <tr style="background: rgba(0,0,0,0.02);">
                  <th style="width: 45px; text-align: center;">No</th>
                  <th style="width: 65px;">Tip</th>
                  <th>Soru & Açıklama</th>
                  <th style="width: 170px;">Doğru Cevap</th>
                  <th style="width: 100px; text-align: right;">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                ${questionsRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;

      pkgContainer.appendChild(pkgCard);
    });

    // Attach edit & delete events
    pkgContainer.querySelectorAll(".btn-edit-treasure-q").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"));
        editTreasureQuestion(id);
      });
    });

    pkgContainer.querySelectorAll(".btn-delete-treasure-q").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"));
        deleteTreasureQuestion(id);
      });
    });

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // ─── MODAL: TEK SORU DÜZENLEME ──────────────────────────────────────────
  let _editingQuestionId = null;

  function openTreasureEditQuestionModal(id) {
    const q = questions.find(item => item.id === id);
    if (!q) return;
    _editingQuestionId = id;

    const modal = document.getElementById("modal-treasure-edit-question");
    if (!modal) return;

    document.getElementById("treasure-modal-edit-title").textContent = `Soruyu Düzenle (#${q.id})`;
    document.getElementById("treasure-edit-q-id").value = q.id;
    document.getElementById("treasure-edit-q-category").value = q.category || "Genel";
    document.getElementById("treasure-edit-q-type").value = q.type || "open";
    document.getElementById("treasure-edit-q-text").value = q.text || "";
    document.getElementById("treasure-edit-q-explanation").value = q.explanation || "";

    renderTreasureEditAnswerField(q);

    modal.classList.add("active");
    modal.style.display = "flex";
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  function closeTreasureEditQuestionModal() {
    const modal = document.getElementById("modal-treasure-edit-question");
    if (!modal) return;
    modal.classList.remove("active");
    modal.style.display = "none";
    _editingQuestionId = null;
  }

  function onTreasureEditTypeChange() {
    const type = document.getElementById("treasure-edit-q-type").value;
    const q = questions.find(item => item.id === _editingQuestionId) || {};
    renderTreasureEditAnswerField({ ...q, type: type });
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  function renderTreasureEditAnswerField(q) {
    const container = document.getElementById("treasure-edit-q-answer-container");
    if (!container) return;

    if (q.type === "mc") {
      const letters = ["A", "B", "C", "D"];
      const opts = Array.isArray(q.options) && q.options.length >= 4 ? q.options : ["", "", "", ""];
      const correctIdx = parseInt(q.answer) || 0;
      container.innerHTML = `
        <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.35rem; display: block;">Seçenekler ve Doğru Cevap (Doğru şıkkı işaretleyin):</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          ${letters.map((let, optIdx) => `
            <div style="display: flex; align-items: center; gap: 0.4rem; background: var(--bg-primary); padding: 0.3rem 0.5rem; border: 1px solid var(--border-color); border-radius: 6px;">
              <input type="radio" name="edit_mc_ans" id="edit_mc_opt_${optIdx}" value="${optIdx}" ${correctIdx === optIdx ? 'checked' : ''}>
              <label for="edit_mc_opt_${optIdx}" style="font-weight: 700; font-size: 0.82rem; color: var(--primary); margin: 0; min-width: 18px;">${let})</label>
              <input type="text" class="form-control form-control-sm edit-mc-input" id="edit-mc-val-${optIdx}" value="${escapeHTML(opts[optIdx] || '')}" placeholder="${let} seçeneği..." style="flex: 1; height: 30px; font-size: 0.82rem;">
            </div>
          `).join("")}
        </div>
      `;
    } else if (q.type === "tf") {
      const isTrue = q.answer === true || q.answer === "true";
      container.innerHTML = `
        <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">Doğru Cevap:</label>
        <select id="edit-tf-select" class="form-control" style="width: 100%; height: 35px;">
          <option value="true" ${isTrue ? 'selected' : ''}>DOĞRU</option>
          <option value="false" ${!isTrue ? 'selected' : ''}>YANLIŞ</option>
        </select>
      `;
    } else {
      const ansVal = typeof q.answer === "string" ? q.answer : (q.options && q.options[0] ? q.options[0] : "");
      const labelText = q.type === "fib" ? "Boşluğa Gelecek Doğru Kelime ([___] boşluğu):" : "Model / Doğru Cevap:";
      container.innerHTML = `
        <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">${labelText}</label>
        <input type="text" id="edit-text-ans" class="form-control" value="${escapeHTML(ansVal)}" placeholder="Doğru cevabı yazın..." style="width: 100%; height: 35px;">
      `;
    }
  }

  function saveTreasureEditedQuestion() {
    if (!_editingQuestionId) return;
    const qIndex = questions.findIndex(item => item.id === _editingQuestionId);
    if (qIndex === -1) return;

    const qType = document.getElementById("treasure-edit-q-type").value;
    const category = document.getElementById("treasure-edit-q-category").value.trim() || "Genel";
    const text = document.getElementById("treasure-edit-q-text").value.trim();
    const explanation = document.getElementById("treasure-edit-q-explanation").value.trim();

    if (!text) {
      alert("Soru metni boş olamaz!");
      return;
    }

    let answer = "";
    let options = undefined;

    if (qType === "mc") {
      const opts = [];
      for (let i = 0; i < 4; i++) {
        const inp = document.getElementById(`edit-mc-val-${i}`);
        opts.push(inp ? inp.value.trim() : "");
      }
      options = opts;
      const checkedRadio = document.querySelector('input[name="edit_mc_ans"]:checked');
      answer = checkedRadio ? parseInt(checkedRadio.value) || 0 : 0;
    } else if (qType === "tf") {
      const sel = document.getElementById("edit-tf-select");
      answer = sel ? sel.value === "true" : true;
    } else if (qType === "fib") {
      const inp = document.getElementById("edit-text-ans");
      answer = inp ? inp.value.trim() : "";
      options = [answer];
    } else if (qType === "open") {
      const inp = document.getElementById("edit-text-ans");
      answer = inp ? inp.value.trim() : "";
    }

    questions[qIndex] = {
      ...questions[qIndex],
      type: qType,
      category: category,
      text: text,
      answer: answer,
      options: options,
      explanation: explanation
    };

    saveQuestions();
    populateLibraryCategoryFilter();
    populateCategorySelector();
    renderTreasureQuestionLibrary();
    closeTreasureEditQuestionModal();

    if (toastCallback) toastCallback("Soru başarıyla güncellendi!", "success");
  }

  function editTreasureQuestion(id) {
    openTreasureEditQuestionModal(id);
  }

  // ─── MODAL: PAKET FORMU İLE OLUŞTURUCU ────────────────────────────────────
  let _pkgQuestionsData = [];

  function openTreasurePackageCreatorModal() {
    const modal = document.getElementById("modal-treasure-package-creator");
    if (!modal) return;
    document.getElementById("treasure-pkg-title").value = "";
    document.getElementById("treasure-pkg-count").value = "5";
    document.getElementById("treasure-pkg-type").value = "mc";
    document.getElementById("treasure-pkg-difficulty").value = "dengeli";

    document.getElementById("treasure-pkg-step-setup").style.display = "block";
    document.getElementById("treasure-pkg-step-questions").style.display = "none";
    document.getElementById("btn-treasure-pkg-create-step").style.display = "inline-flex";
    document.getElementById("btn-treasure-pkg-save").style.display = "none";

    _pkgQuestionsData = [];
    modal.classList.add("active");
    modal.style.display = "flex";
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  function closeTreasurePackageCreatorModal() {
    const modal = document.getElementById("modal-treasure-package-creator");
    if (!modal) return;
    modal.classList.remove("active");
    modal.style.display = "none";
    _pkgQuestionsData = [];
  }

  function prepareTreasurePackageQuestions() {
    const title = document.getElementById("treasure-pkg-title").value.trim();
    if (!title) {
      alert("Lütfen paket ismini giriniz!");
      document.getElementById("treasure-pkg-title").focus();
      return;
    }
    const count = parseInt(document.getElementById("treasure-pkg-count").value) || 5;
    const pType = document.getElementById("treasure-pkg-type").value;

    _pkgQuestionsData = [];
    for (let i = 0; i < count; i++) {
      let qType = pType;
      if (pType === "karisik") {
        const types = ["mc", "fib", "open"];
        qType = types[i % 3];
      }
      _pkgQuestionsData.push({
        type: qType,
        text: "",
        answer: qType === "mc" ? 0 : "",
        options: qType === "mc" ? ["", "", "", ""] : [],
        explanation: ""
      });
    }

    renderTreasurePackageQuestionCards();

    document.getElementById("treasure-pkg-step-setup").style.display = "none";
    document.getElementById("treasure-pkg-step-questions").style.display = "block";
    document.getElementById("btn-treasure-pkg-create-step").style.display = "none";
    document.getElementById("btn-treasure-pkg-save").style.display = "inline-flex";

    const titleEl = document.getElementById("treasure-pkg-step2-title");
    const badgeEl = document.getElementById("treasure-pkg-step2-badge");
    if (titleEl) titleEl.textContent = `📦 ${title}`;
    if (badgeEl) badgeEl.textContent = `Toplam ${_pkgQuestionsData.length} soru hazırlanıyor`;
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  function renderTreasurePackageQuestionCards() {
    const container = document.getElementById("treasure-pkg-questions-container");
    if (!container) return;
    container.innerHTML = "";

    _pkgQuestionsData.forEach((q, idx) => {
      const card = document.createElement("div");
      card.className = "glass-card";
      card.style.padding = "1rem 1.25rem";
      card.style.border = "1px solid var(--border-color)";
      card.style.borderRadius = "10px";
      card.style.position = "relative";

      let answerFieldsHtml = "";
      if (q.type === "mc") {
        const letters = ["A", "B", "C", "D"];
        answerFieldsHtml = `
          <div style="margin-top: 0.5rem;">
            <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.35rem; display: block;">Seçenekler ve Doğru Cevap (Doğru şıkkı işaretleyin):</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              ${letters.map((let, optIdx) => `
                <div style="display: flex; align-items: center; gap: 0.4rem; background: var(--bg-primary); padding: 0.3rem 0.5rem; border: 1px solid var(--border-color); border-radius: 6px;">
                  <input type="radio" name="pkg_q_ans_${idx}" id="pkg_q_${idx}_opt_${optIdx}" value="${optIdx}" ${q.answer === optIdx ? 'checked' : ''} onchange="window.updateTreasurePackageCardAnswer(${idx}, ${optIdx})">
                  <label for="pkg_q_${idx}_opt_${optIdx}" style="font-weight: 700; font-size: 0.82rem; color: var(--primary); margin: 0; min-width: 18px;">${let})</label>
                  <input type="text" class="form-control form-control-sm" placeholder="${let} seçeneği..." value="${escapeHTML(q.options[optIdx] || '')}" oninput="window.updateTreasurePackageCardOption(${idx}, ${optIdx}, this.value)" style="flex: 1; height: 30px; font-size: 0.82rem;">
                </div>
              `).join("")}
            </div>
          </div>
        `;
      } else if (q.type === "fib") {
        answerFieldsHtml = `
          <div style="margin-top: 0.5rem;">
            <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block;">Boşluğa Gelecek Doğru Kelime / Sayı: <small style="color: var(--text-muted);">(Cümle içine [___] yazabilirsiniz)</small></label>
            <input type="text" class="form-control form-control-sm" placeholder="Örn: Ankara veya 1923" value="${escapeHTML(typeof q.answer === 'string' ? q.answer : '')}" oninput="window.updateTreasurePackageCardAnswerText(${idx}, this.value)" style="width: 100%; height: 34px; font-size: 0.85rem;">
          </div>
        `;
      } else if (q.type === "open") {
        answerFieldsHtml = `
          <div style="margin-top: 0.5rem;">
            <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block;">Doğru / Örnek Model Cevap:</label>
            <input type="text" class="form-control form-control-sm" placeholder="Örn: Akciğer solunumu yaparlar" value="${escapeHTML(typeof q.answer === 'string' ? q.answer : '')}" oninput="window.updateTreasurePackageCardAnswerText(${idx}, this.value)" style="width: 100%; height: 34px; font-size: 0.85rem;">
          </div>
        `;
      }

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #d97706; font-weight: 800;">Soru #${idx + 1}</span>
            <select class="form-control form-control-sm" onchange="window.changeTreasurePackageCardType(${idx}, this.value)" style="width: 155px; height: 28px; font-size: 0.78rem; padding: 0 0.4rem;">
              <option value="mc" ${q.type === 'mc' ? 'selected' : ''}>Çoktan Seçmeli</option>
              <option value="fib" ${q.type === 'fib' ? 'selected' : ''}>Boşluk Doldurma</option>
              <option value="open" ${q.type === 'open' ? 'selected' : ''}>Açık Uçlu</option>
            </select>
          </div>
          <button type="button" class="btn btn-outline btn-xs" onclick="window.removeTreasurePackageCard(${idx})" style="color: var(--danger); padding: 2px 6px;" title="Bu soruyu sil">
            <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
          </button>
        </div>

        <div class="form-group" style="margin-bottom: 0.5rem;">
          <textarea class="form-control" rows="2" placeholder="Soru metnini yazın..." oninput="window.updateTreasurePackageCardText(${idx}, this.value)" style="width: 100%; font-size: 0.85rem; padding: 0.45rem 0.65rem;">${escapeHTML(q.text || '')}</textarea>
        </div>

        ${answerFieldsHtml}

        <div style="margin-top: 0.45rem;">
          <input type="text" class="form-control form-control-sm" placeholder="Açıklama / İpucu (Opsiyonel)" value="${escapeHTML(q.explanation || '')}" oninput="window.updateTreasurePackageCardExplanation(${idx}, this.value)" style="width: 100%; height: 28px; font-size: 0.78rem; color: var(--text-secondary);">
        </div>
      `;

      container.appendChild(card);
    });

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  function addMoreTreasurePackageQuestion() {
    const pType = document.getElementById("treasure-pkg-type").value;
    const qType = pType === "karisik" ? "mc" : pType;
    _pkgQuestionsData.push({
      type: qType,
      text: "",
      answer: qType === "mc" ? 0 : "",
      options: qType === "mc" ? ["", "", "", ""] : [],
      explanation: ""
    });
    renderTreasurePackageQuestionCards();
    const badgeEl = document.getElementById("treasure-pkg-step2-badge");
    if (badgeEl) badgeEl.textContent = `Toplam ${_pkgQuestionsData.length} soru hazırlanıyor`;
  }

  function removeTreasurePackageCard(idx) {
    if (_pkgQuestionsData.length <= 1) {
      alert("Pakette en az 1 soru bulunmalıdır!");
      return;
    }
    _pkgQuestionsData.splice(idx, 1);
    renderTreasurePackageQuestionCards();
    const badgeEl = document.getElementById("treasure-pkg-step2-badge");
    if (badgeEl) badgeEl.textContent = `Toplam ${_pkgQuestionsData.length} soru hazırlanıyor`;
  }

  function backToTreasurePackageSetup() {
    document.getElementById("treasure-pkg-step-setup").style.display = "block";
    document.getElementById("treasure-pkg-step-questions").style.display = "none";
    document.getElementById("btn-treasure-pkg-create-step").style.display = "inline-flex";
    document.getElementById("btn-treasure-pkg-save").style.display = "none";
  }

  function changeTreasurePackageCardType(idx, newType) {
    if (!_pkgQuestionsData[idx]) return;
    _pkgQuestionsData[idx].type = newType;
    if (newType === "mc") {
      if (!_pkgQuestionsData[idx].options || _pkgQuestionsData[idx].options.length < 4) {
        _pkgQuestionsData[idx].options = ["", "", "", ""];
      }
      _pkgQuestionsData[idx].answer = 0;
    } else if (newType === "fib" || newType === "open") {
      _pkgQuestionsData[idx].answer = "";
      _pkgQuestionsData[idx].options = [];
    }
    renderTreasurePackageQuestionCards();
  }

  function updateTreasurePackageCardText(idx, val) {
    if (_pkgQuestionsData[idx]) _pkgQuestionsData[idx].text = val;
  }
  function updateTreasurePackageCardAnswer(idx, ansIdx) {
    if (_pkgQuestionsData[idx]) _pkgQuestionsData[idx].answer = ansIdx;
  }
  function updateTreasurePackageCardOption(idx, optIdx, val) {
    if (_pkgQuestionsData[idx] && _pkgQuestionsData[idx].options) {
      _pkgQuestionsData[idx].options[optIdx] = val;
    }
  }
  function updateTreasurePackageCardAnswerText(idx, val) {
    if (_pkgQuestionsData[idx]) {
      _pkgQuestionsData[idx].answer = val;
      if (_pkgQuestionsData[idx].type === "fib") {
        _pkgQuestionsData[idx].options = [val];
      }
    }
  }
  function updateTreasurePackageCardExplanation(idx, val) {
    if (_pkgQuestionsData[idx]) _pkgQuestionsData[idx].explanation = val;
  }

  function saveTreasurePackageFromModal() {
    const title = document.getElementById("treasure-pkg-title").value.trim();
    if (!title) {
      alert("Paket ismi boş olamaz!");
      return;
    }

    const validQuestions = _pkgQuestionsData.filter(q => q.text && q.text.trim().length > 0);
    if (validQuestions.length === 0) {
      alert("Lütfen en az bir sorunun metnini yazınız!");
      return;
    }

    let startId = questions.length > 0 ? Math.max(...questions.map(q => parseInt(q.id) || 0)) + 1 : 1;

    validQuestions.forEach(q => {
      let finalOptions = undefined;
      let finalAnswer = q.answer;

      if (q.type === "mc") {
        finalOptions = q.options.map(o => o.trim());
        finalAnswer = parseInt(q.answer) || 0;
      } else if (q.type === "fib") {
        finalOptions = [String(q.answer || "").trim()];
        finalAnswer = String(q.answer || "").trim();
      } else if (q.type === "open") {
        finalAnswer = String(q.answer || "").trim();
      }

      questions.push({
        id: startId++,
        type: q.type,
        category: title,
        text: q.text.trim(),
        answer: finalAnswer,
        options: finalOptions,
        explanation: (q.explanation || "").trim()
      });
    });

    saveQuestions();
    populateLibraryCategoryFilter();
    populateCategorySelector();
    renderTreasureQuestionLibrary();
    closeTreasurePackageCreatorModal();

    const msg = `✅ "${title}" paketi (${validQuestions.length} soru) başarıyla kaydedildi!`;
    if (toastCallback) toastCallback(msg, "success");
    else alert(msg);
  }

  // ─── MODAL: KOPYALA & YAPIŞTIR İLE SORU EKLEME ────────────────────────────
  let _cpParsedQuestions = [];

  function openTreasureCopyPasteModal() {
    const modal = document.getElementById("modal-treasure-copy-paste");
    if (!modal) return;
    document.getElementById("treasure-cp-category").value = "";
    document.getElementById("treasure-cp-text").value = "";
    document.getElementById("treasure-cp-type").value = "auto";
    document.getElementById("treasure-cp-input-section").style.display = "block";
    document.getElementById("treasure-cp-preview-section").style.display = "none";
    document.getElementById("btn-treasure-cp-parse").style.display = "inline-flex";
    document.getElementById("btn-treasure-cp-save").style.display = "none";
    _cpParsedQuestions = [];
    modal.classList.add("active");
    modal.style.display = "flex";
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  function closeTreasureCopyPasteModal() {
    const modal = document.getElementById("modal-treasure-copy-paste");
    if (!modal) return;
    modal.classList.remove("active");
    modal.style.display = "none";
    _cpParsedQuestions = [];
  }

  function loadTreasureCopyPasteSample() {
    document.getElementById("treasure-cp-category").value = "4. Sınıf Fen - Canlılar Dünyası";
    document.getElementById("treasure-cp-text").value = 
`1. Aşağıdakilerden hangisi kendi besinini kendisi üretebilen bir canlıdır?
A) Mantarlar
B) Yeşil bitkiler
C) İnsanlar
D) Kuşlar
Cevap: B
Açıklama: Yeşil bitkiler klorofil ve güneş ışığı ile fotosentez yapar.

2. Soluk alıp verirken vücudumuza aldığımız yaşamsal gaz [___] gazıdır.
Cevap: Oksijen

3. Memeli hayvanların en belirgin özelliklerinden üç tanesini yazınız.
Cevap: Doğurarak çoğalırlar, yavrularını sütle beslerler ve vücutları kıllarla kaplıdır.

4. Aşağıdaki organlardan hangisi boşaltım sisteminin ana organıdır?
A) Kalp
B) Mide
C) Böbrek
D) Karaciğer
Cevap: C`;
  }

  function parseTreasureCopyPasteText(previewOnly = true) {
    const category = document.getElementById("treasure-cp-category").value.trim() || "Genel Paket";
    const text = document.getElementById("treasure-cp-text").value.trim();
    const forcedType = document.getElementById("treasure-cp-type").value;

    if (!text) {
      alert("Lütfen metin alanına soru listesini yapıştırın!");
      return;
    }

    const lines = text.split("\n");
    const itemStartRegex = /^\s*(?:Soru\s*)?(\d+)[\.\)\-:\/]\s*(.*)$/i;

    let items = [];
    let currentItem = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const match = trimmed.match(itemStartRegex);
      if (match) {
        if (currentItem) items.push(currentItem);
        currentItem = {
          num: match[1],
          rawLines: [match[2]]
        };
      } else {
        if (currentItem) {
          currentItem.rawLines.push(trimmed);
        } else {
          currentItem = {
            num: (items.length + 1).toString(),
            rawLines: [trimmed]
          };
        }
      }
    });
    if (currentItem) items.push(currentItem);

    if (items.length === 0) {
      alert("Metin içerisinde madde veya soru numarası bulunamadı! Lütfen 1. 2. gibi madde numaraları kullanın.");
      return;
    }

    _cpParsedQuestions = [];

    items.forEach((item, idx) => {
      const rawBody = item.rawLines.join("\n");
      let qType = forcedType === "auto" ? "open" : forcedType;
      let qText = "";
      let answer = "";
      let options = [];
      let explanation = "";

      const ansMatch = rawBody.match(/(?:^|\n)\s*(?:Doğru\s*)?(?:Cevap|Yanıt|Cevap\s*Anahtarı)\s*[:=\-]\s*([^\n]+)/i);
      if (ansMatch) {
        answer = ansMatch[1].trim();
      }

      const expMatch = rawBody.match(/(?:^|\n)\s*(?:Açıklama|Çözüm|İpucu)\s*[:=\-]\s*([^\n]+)/i);
      if (expMatch) {
        explanation = expMatch[1].trim();
      }

      const optRegex = /(?:^|\n)\s*([A-Ea-e])[\.\)\-:]\s*([^\n]+)/g;
      const foundOptions = [];
      let optMatch;
      while ((optMatch = optRegex.exec(rawBody)) !== null) {
        foundOptions.push({
          letter: optMatch[1].toUpperCase(),
          val: optMatch[2].trim()
        });
      }

      if (forcedType === "mc" || (forcedType === "auto" && foundOptions.length >= 2)) {
        qType = "mc";
        options = foundOptions.map(o => o.val);
        const firstOptIndex = rawBody.search(/(?:^|\n)\s*[A-Ea-e][\.\)\-:]/);
        if (firstOptIndex !== -1) {
          qText = rawBody.substring(0, firstOptIndex).trim();
        } else {
          qText = rawBody;
        }

        let ansIdx = 0;
        if (answer) {
          const letterMatch = answer.match(/^[A-Ea-e]$/);
          if (letterMatch) {
            ansIdx = letterMatch[0].toUpperCase().charCodeAt(0) - 65;
          } else {
            const matchIdx = options.findIndex(o => o.toLowerCase() === answer.toLowerCase());
            if (matchIdx !== -1) ansIdx = matchIdx;
          }
        }
        answer = Math.max(0, Math.min(options.length - 1, ansIdx));
      } else {
        if (forcedType === "fib" || (forcedType === "auto" && (rawBody.includes("[___]") || rawBody.includes("_____")))) {
          qType = "fib";
          qText = rawBody.split(/(?:^|\n)\s*(?:Doğru\s*)?(?:Cevap|Yanıt|Açıklama)/i)[0].trim();
          options = answer ? [answer] : [];
        } else {
          qType = forcedType === "auto" ? "open" : forcedType;
          qText = rawBody.split(/(?:^|\n)\s*(?:Doğru\s*)?(?:Cevap|Yanıt|Açıklama)/i)[0].trim();
        }
      }

      _cpParsedQuestions.push({
        type: qType,
        text: qText || `Soru #${idx + 1}`,
        answer: answer,
        options: options,
        explanation: explanation,
        category: category
      });
    });

    if (previewOnly) {
      renderTreasureCopyPastePreview();
      document.getElementById("treasure-cp-input-section").style.display = "none";
      document.getElementById("treasure-cp-preview-section").style.display = "block";
      document.getElementById("btn-treasure-cp-parse").style.display = "none";
      document.getElementById("btn-treasure-cp-save").style.display = "inline-flex";
    } else {
      saveTreasureCopyPastePackage();
    }
  }

  function renderTreasureCopyPastePreview() {
    const container = document.getElementById("treasure-cp-preview-container");
    const countEl = document.getElementById("treasure-cp-preview-count");
    if (!container) return;
    container.innerHTML = "";
    if (countEl) countEl.textContent = `✅ ${_cpParsedQuestions.length} Adet Soru Başarıyla Ayrıştırıldı`;

    _cpParsedQuestions.forEach((q, idx) => {
      const card = document.createElement("div");
      card.className = "glass-card";
      card.style.padding = "0.85rem 1rem";
      card.style.border = "1px solid var(--border-color)";
      card.style.borderRadius = "8px";

      const typeLabel = q.type === "mc" ? "Çoktan Seçmeli" : (q.type === "fib" ? "Boşluk Doldurma" : "Açık Uçlu");
      const typeColor = q.type === "mc" ? "#8b5cf6" : (q.type === "fib" ? "#10b981" : "#d97706");

      let ansDesc = "";
      if (q.type === "mc") {
        const letters = ["A", "B", "C", "D", "E"];
        const correctOpt = q.options[q.answer] || "";
        ansDesc = `<strong>Doğru Şık:</strong> ${letters[q.answer] || 'A'}) ${escapeHTML(correctOpt)}<br><small style="color:var(--text-muted);">Şıklar: ${escapeHTML(q.options.join(" | "))}</small>`;
      } else {
        ansDesc = `<strong>Doğru/Model Cevap:</strong> ${escapeHTML(q.answer || 'Cevap belirtilmemiş')}`;
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
          <span style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">Soru #${idx + 1}</span>
          <span class="badge" style="background:${typeColor}22; color:${typeColor}; font-weight:700;">${typeLabel}</span>
        </div>
        <p style="font-size:0.88rem; font-weight:500; margin:0 0 0.4rem 0; color:var(--text-primary);">${escapeHTML(q.text)}</p>
        <div style="font-size:0.82rem; background:rgba(0,0,0,0.02); padding:0.4rem 0.6rem; border-radius:6px; border:1px dashed var(--border-color);">
          ${ansDesc}
          ${q.explanation ? `<div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">💡 ${escapeHTML(q.explanation)}</div>` : ''}
        </div>
      `;
      container.appendChild(card);
    });
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  function backToTreasureCopyPasteInput() {
    document.getElementById("treasure-cp-input-section").style.display = "block";
    document.getElementById("treasure-cp-preview-section").style.display = "none";
    document.getElementById("btn-treasure-cp-parse").style.display = "inline-flex";
    document.getElementById("btn-treasure-cp-save").style.display = "none";
  }

  function saveTreasureCopyPastePackage() {
    if (_cpParsedQuestions.length === 0) {
      alert("Ayrıştırılmış soru bulunamadı!");
      return;
    }
    const category = document.getElementById("treasure-cp-category").value.trim() || "Genel Paket";
    let startId = questions.length > 0 ? Math.max(...questions.map(q => parseInt(q.id) || 0)) + 1 : 1;

    _cpParsedQuestions.forEach(q => {
      questions.push({
        id: startId++,
        type: q.type,
        category: category,
        text: q.text,
        answer: q.answer,
        options: q.options && q.options.length > 0 ? q.options : undefined,
        explanation: q.explanation || ""
      });
    });

    saveQuestions();
    populateLibraryCategoryFilter();
    populateCategorySelector();
    renderTreasureQuestionLibrary();
    closeTreasureCopyPasteModal();

    const msg = `✅ "${category}" paketi (${_cpParsedQuestions.length} soru) başarıyla kütüphaneye eklendi!`;
    if (toastCallback) toastCallback(msg, "success");
    else alert(msg);
  }

  // Window global exposures for package and edit modals
  window.openTreasurePackageCreatorModal = openTreasurePackageCreatorModal;
  window.closeTreasurePackageCreatorModal = closeTreasurePackageCreatorModal;
  window.prepareTreasurePackageQuestions = prepareTreasurePackageQuestions;
  window.renderTreasurePackageQuestionCards = renderTreasurePackageQuestionCards;
  window.addMoreTreasurePackageQuestion = addMoreTreasurePackageQuestion;
  window.removeTreasurePackageCard = removeTreasurePackageCard;
  window.backToTreasurePackageSetup = backToTreasurePackageSetup;
  window.changeTreasurePackageCardType = changeTreasurePackageCardType;
  window.updateTreasurePackageCardText = updateTreasurePackageCardText;
  window.updateTreasurePackageCardAnswer = updateTreasurePackageCardAnswer;
  window.updateTreasurePackageCardOption = updateTreasurePackageCardOption;
  window.updateTreasurePackageCardAnswerText = updateTreasurePackageCardAnswerText;
  window.updateTreasurePackageCardExplanation = updateTreasurePackageCardExplanation;
  window.saveTreasurePackageFromModal = saveTreasurePackageFromModal;

  window.openTreasureCopyPasteModal = openTreasureCopyPasteModal;
  window.closeTreasureCopyPasteModal = closeTreasureCopyPasteModal;
  window.loadTreasureCopyPasteSample = loadTreasureCopyPasteSample;
  window.parseTreasureCopyPasteText = parseTreasureCopyPasteText;
  window.renderTreasureCopyPastePreview = renderTreasureCopyPastePreview;
  window.backToTreasureCopyPasteInput = backToTreasureCopyPasteInput;
  window.saveTreasureCopyPastePackage = saveTreasureCopyPastePackage;

  window.openTreasureEditQuestionModal = openTreasureEditQuestionModal;
  window.closeTreasureEditQuestionModal = closeTreasureEditQuestionModal;
  window.onTreasureEditTypeChange = onTreasureEditTypeChange;
  window.saveTreasureEditedQuestion = saveTreasureEditedQuestion;

  // Delete single question
  function deleteTreasureQuestion(id) {
    if (confirm("Bu soruyu silmek istediğinize emin misiniz?")) {
      questions = questions.filter(q => q.id !== id);
      saveQuestions();
      populateLibraryCategoryFilter();
      populateCategorySelector();
      renderTreasureQuestionLibrary();
      if (toastCallback) toastCallback("Soru başarıyla silindi.", "success");
    }
  }

  // Delete all questions
  function deleteAllTreasureQuestions() {
    if (confirm("Kütüphanedeki TÜM soruları silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
      questions = [];
      saveQuestions();
      populateLibraryCategoryFilter();
      populateCategorySelector();
      renderTreasureQuestionLibrary();
      if (toastCallback) toastCallback("Tüm sorular silindi.", "success");
    }
  }

  // Toggle input visibility based on question type
  function toggleQuestionTypeUI(type) {
    if (type === "tf") {
      if (formAnswerTextGroup) formAnswerTextGroup.style.display = "none";
      if (formAnswerTfGroup) formAnswerTfGroup.style.display = "block";
      if (formMcOptionsGroup) formMcOptionsGroup.style.display = "none";
      if (questionAnswerInput) questionAnswerInput.removeAttribute("required");
    } else if (type === "mc") {
      if (formAnswerTextGroup) formAnswerTextGroup.style.display = "block";
      if (formAnswerTfGroup) formAnswerTfGroup.style.display = "none";
      if (formMcOptionsGroup) formMcOptionsGroup.style.display = "block";
      if (questionAnswerInput) questionAnswerInput.setAttribute("required", "required");
    } else if (type === "fib") {
      if (formAnswerTextGroup) formAnswerTextGroup.style.display = "block";
      if (formAnswerTfGroup) formAnswerTfGroup.style.display = "none";
      if (formMcOptionsGroup) formMcOptionsGroup.style.display = "none";
      if (questionAnswerInput) questionAnswerInput.setAttribute("required", "required");
    }
  }

  // Reset form status
  function resetTreasureQuestionForm() {
    if (questionForm) questionForm.reset();
    if (editQuestionId) editQuestionId.value = "";
    if (questionFormTitle) questionFormTitle.textContent = "Yeni Soru Ekle";
    if (btnCancelQuestionEdit) btnCancelQuestionEdit.style.display = "none";
    if (questionTypeSelect) {
      questionTypeSelect.value = "tf";
      toggleQuestionTypeUI("tf");
    }
  }

  // Save / Update question
  function handleTreasureQuestionSubmit(e) {
    e.preventDefault();
    
    const typeVal = questionTypeSelect.value;
    const categoryVal = questionCategoryInput.value.trim();
    const sentenceVal = questionSentenceTextarea.value.trim();
    const explanationVal = questionExplanationInput.value.trim();
    const editIdVal = editQuestionId.value;
    
    if (!categoryVal || !sentenceVal) {
      if (toastCallback) toastCallback("Lütfen zorunlu alanları doldurun!", "warning");
      return;
    }
    
    let answerVal;
    let optionsVal;
    
    if (typeVal === "tf") {
      answerVal = questionAnswerTfSelect.value === "true";
      optionsVal = undefined;
    } else if (typeVal === "mc") {
      const correctAns = questionAnswerInput.value.trim();
      const wrongOptsRaw = questionWrongOptionsInput.value.trim();
      
      if (!correctAns) {
        if (toastCallback) toastCallback("Lütfen doğru cevabı belirtin!", "warning");
        return;
      }
      if (!wrongOptsRaw) {
        if (toastCallback) toastCallback("Lütfen en az bir yanlış seçenek belirtin!", "warning");
        return;
      }
      
      const wrongOpts = wrongOptsRaw.split(",").map(opt => opt.trim()).filter(Boolean);
      if (wrongOpts.length === 0) {
        if (toastCallback) toastCallback("Lütfen en az bir yanlış seçenek belirtin!", "warning");
        return;
      }
      
      optionsVal = [correctAns, ...wrongOpts];
      answerVal = 0;
    } else if (typeVal === "fib") {
      const correctAns = questionAnswerInput.value.trim();
      if (!correctAns) {
        if (toastCallback) toastCallback("Lütfen doğru cevabı belirtin!", "warning");
        return;
      }
      optionsVal = [correctAns];
      answerVal = 0;
    }
    
    if (editIdVal) {
      const qId = parseInt(editIdVal);
      const qIndex = questions.findIndex(q => q.id === qId);
      if (qIndex > -1) {
        questions[qIndex].type = typeVal;
        questions[qIndex].category = categoryVal;
        questions[qIndex].text = sentenceVal;
        questions[qIndex].answer = answerVal;
        questions[qIndex].options = optionsVal;
        questions[qIndex].explanation = explanationVal;
        if (toastCallback) toastCallback("Soru başarıyla güncellendi!", "success");
      }
    } else {
      const newId = questions.length > 0 ? Math.max(...questions.map(q => parseInt(q.id) || 0)) + 1 : 1;
      const newQuestion = {
        id: newId,
        type: typeVal,
        category: categoryVal,
        text: sentenceVal,
        answer: answerVal,
        options: optionsVal,
        explanation: explanationVal
      };
      questions.push(newQuestion);
      if (toastCallback) toastCallback("Soru başarıyla eklendi!", "success");
    }
    
    saveQuestions();
    populateLibraryCategoryFilter();
    populateCategorySelector();
    renderTreasureQuestionLibrary();
    resetTreasureQuestionForm();
  }

  // Show correct answer inside active game layout
  function showCorrectAnswer() {
    if (!currentQuestion) return;
    
    if (answerText) {
      answerText.textContent = getAnswerDisplay(currentQuestion);
    }
    
    if (answerExplanation) {
      if (currentQuestion.explanation && currentQuestion.explanation.trim().length > 0) {
        answerExplanation.textContent = currentQuestion.explanation.trim();
        answerExplanation.style.display = "block";
      } else {
        answerExplanation.style.display = "none";
      }
    }
    
    if (answerContainer) {
      answerContainer.style.display = "block";
    }

    if (currentQuestion.type === "mc") {
      const correctIdx = parseInt(currentQuestion.answer) || 0;
      const optEl = document.getElementById(`treasure-mc-opt-${correctIdx}`);
      if (optEl) {
        optEl.style.borderColor = "var(--success, #10b981)";
        optEl.style.background = "rgba(16, 185, 129, 0.15)";
        optEl.style.boxShadow = "0 0 10px rgba(16, 185, 129, 0.25)";
        optEl.style.fontWeight = "700";
      }
    }
    
    if (btnShowAnswer) {
      btnShowAnswer.setAttribute("disabled", "disabled");
      btnShowAnswer.disabled = true;
    }
  }

  // Toggle reward text visibility in Setup screen
  function toggleRewardInputVisibility() {
    isRewardInputHidden = !isRewardInputHidden;
    const input = document.getElementById("treasure-reward-text");
    const btnText = document.getElementById("text-toggle-reward-visibility");
    const iconHeader = document.getElementById("icon-toggle-reward-visibility");
    const iconEye = document.getElementById("icon-reward-eye");
    
    if (isRewardInputHidden) {
      if (input) input.type = "password";
      if (btnText) btnText.textContent = "Ödülü Göster";
      if (iconHeader) iconHeader.setAttribute("data-lucide", "eye");
      if (iconEye) iconEye.setAttribute("data-lucide", "eye");
    } else {
      if (input) input.type = "text";
      if (btnText) btnText.textContent = "Ödülü Gizle";
      if (iconHeader) iconHeader.setAttribute("data-lucide", "eye-off");
      if (iconEye) iconEye.setAttribute("data-lucide", "eye-off");
    }
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Toggle reward text visibility in Active Play screen
  function toggleActiveRewardVisibility() {
    isActiveRewardPeeked = !isActiveRewardPeeked;
    const icon = document.getElementById("icon-active-reward");
    if (!activeRewardDisplay) return;

    if (isActiveRewardPeeked) {
      activeRewardDisplay.textContent = rewardText;
      if (icon) icon.setAttribute("data-lucide", "eye-off");
    } else {
      activeRewardDisplay.textContent = "Gizli 🔒";
      if (icon) icon.setAttribute("data-lucide", "eye");
    }
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Toggle reward text visibility in Victory Overlay screen
  function toggleVictoryRewardVisibility() {
    isVictoryRewardHidden = !isVictoryRewardHidden;
    const icon = document.getElementById("icon-victory-reward");
    const textSpan = document.getElementById("text-victory-reward");
    if (!winnerReward) return;

    if (isVictoryRewardHidden) {
      winnerReward.textContent = "🔒 Gizli Ödül";
      if (icon) icon.setAttribute("data-lucide", "eye");
      if (textSpan) textSpan.textContent = "Göster";
    } else {
      winnerReward.textContent = rewardText;
      if (icon) icon.setAttribute("data-lucide", "eye-off");
      if (textSpan) textSpan.textContent = "Gizle";
    }
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Initialize Game Setup Screen
  function initTreasureSetup() {
    loadQuestions();
    populateCategorySelector();
    
    const students = getActiveStudents();
    unassignedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    activeStudentId = null;
    
    // Default config values
    if (targetScoreInput) targetScoreInput.value = "50";
    if (timerLimitInput) timerLimitInput.value = "30";
    if (rewardTextInput) {
      rewardTextInput.value = "";
      rewardTextInput.type = "text";
    }
    isRewardInputHidden = false;
    const btnText = document.getElementById("text-toggle-reward-visibility");
    if (btnText) btnText.textContent = "Ödülü Gizle";
    const iconHeader = document.getElementById("icon-toggle-reward-visibility");
    if (iconHeader) iconHeader.setAttribute("data-lucide", "eye-off");
    const iconEye = document.getElementById("icon-reward-eye");
    if (iconEye) iconEye.setAttribute("data-lucide", "eye-off");

    if (groupCountSelect) groupCountSelect.value = "3";
    
    // Clear search filter & dropdowns on init
    const searchInput = document.getElementById("treasure-unassigned-search");
    if (searchInput) {
      searchInput.value = "";
    }
    unassignedSearchQuery = "";
    
    if (genderFilterSelect) genderFilterSelect.value = "all";
    if (assignmentFilterSelect) assignmentFilterSelect.value = "unassigned";
    
    // Prepare initial groups
    updateGroupsCount();
    
    if (setupContainer) setupContainer.style.display = "block";
    if (activeLayout) activeLayout.style.display = "none";
    if (victoryOverlay) victoryOverlay.style.display = "none";
    
    switchTreasureSubTab("play");
    resetTreasureQuestionForm();
  }

  // Dynamic Group Card Generation in Setup
  function updateGroupsCount() {
    const count = parseInt(groupCountSelect.value) || 3;
    const currentStudents = getActiveStudents();
    const currentIds = currentStudents.map(s => s.id);
    
    // Keep students that still exist in the classroom
    groups.forEach(g => {
      g.students = g.students.filter(s => currentIds.includes(s.id));
    });
    
    if (groups.length < count) {
      // Add more groups, keep existing ones
      for (let i = groups.length + 1; i <= count; i++) {
        groups.push({
          id: i,
          name: `${i}. Grup`,
          students: [],
          score: 0
        });
      }
    } else if (groups.length > count) {
      // Remove extra groups, members will be returned to unassigned naturally
      groups = groups.slice(0, count);
    }
    
    // Recalculate unassigned students
    const assignedIds = [];
    groups.forEach(g => g.students.forEach(s => assignedIds.push(s.id)));
    unassignedStudents = currentStudents.filter(s => !assignedIds.includes(s.id));
    unassignedStudents.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    
    renderSetupGroups();
    renderUnassignedStudents();
  }

  // Render Setup Group boxes
  function renderSetupGroups() {
    if (!setupGroupsGrid) return;
    setupGroupsGrid.innerHTML = "";
    
    groups.forEach(group => {
      const box = document.createElement("div");
      box.className = `setup-group-box-modern group-color-${((group.id - 1) % 6) + 1}`;
      box.setAttribute("data-group-id", group.id);
      
      const title = document.createElement("h5");
      
      // Inline editable group name
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.className = "group-name-input-setup";
      titleInput.value = group.name;
      titleInput.placeholder = `${group.id}. Grup`;
      titleInput.title = "Grup adını değiştirmek için tıklayın";
      titleInput.addEventListener("change", (e) => {
        group.name = e.target.value.trim() || `${group.id}. Grup`;
      });
      title.appendChild(titleInput);
      
      // Student count badge inside group header
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.style.background = "var(--primary-light)";
      badge.style.color = "var(--primary)";
      badge.style.border = "1px solid rgba(79, 70, 229, 0.2)";
      badge.style.fontSize = "0.75rem";
      badge.style.padding = "0.15rem 0.4rem";
      badge.textContent = `${group.students.length}`;
      title.appendChild(badge);
      
      const list = document.createElement("div");
      list.className = "group-setup-student-list";
      list.style.marginTop = "0.5rem";
      
      if (group.students.length === 0) {
        const emptyText = document.createElement("span");
        emptyText.style.fontSize = "0.75rem";
        emptyText.style.color = "var(--text-muted)";
        emptyText.style.fontStyle = "italic";
        emptyText.textContent = "Öğrenci yok...";
        list.appendChild(emptyText);
      } else {
        group.students.sort((a, b) => a.name.localeCompare(b.name, 'tr')).forEach(std => {
          const chip = document.createElement("div");
          chip.className = "student-chip";
          chip.textContent = `${std.name} ${std.surname}`;
          chip.title = "Gruptan çıkar";
          
          // Clicking a student chip in a group instantly removes them!
          chip.addEventListener("click", () => {
            unassignStudent(std.id);
          });
          
          const removeBtn = document.createElement("span");
          removeBtn.className = "remove-btn";
          removeBtn.innerHTML = "&times;";
          chip.appendChild(removeBtn);
          
          list.appendChild(chip);
        });
      }
      
      box.appendChild(title);
      box.appendChild(list);
      setupGroupsGrid.appendChild(box);
    });
  }

  // Render master student list grid
  function renderUnassignedStudents() {
    if (!masterStudentsGrid) return;
    masterStudentsGrid.innerHTML = "";
    
    const currentStudents = getActiveStudents();
    const totalCount = currentStudents.length;
    
    const assignedIds = [];
    groups.forEach(g => g.students.forEach(s => assignedIds.push(s.id)));
    const assignedCount = assignedIds.length;
    
    if (assignedCountDisplay) assignedCountDisplay.textContent = assignedCount;
    if (totalStudentsCountDisplay) totalStudentsCountDisplay.textContent = totalCount;
    
    const searchQuery = (unassignedSearchQuery || "").trim().toLowerCase("tr");
    const gender = genderFilterSelect ? genderFilterSelect.value : "all";
    const assignment = assignmentFilterSelect ? assignmentFilterSelect.value : "unassigned";
    
    const filtered = currentStudents.filter(std => {
      // 1. Search filter
      if (searchQuery) {
        const fullName = `${std.name} ${std.surname}`.toLowerCase("tr");
        if (!fullName.includes(searchQuery)) return false;
      }
      // 2. Gender filter
      if (gender !== "all" && std.gender !== gender) {
        return false;
      }
      // 3. Assignment status filter
      const isAssigned = assignedIds.includes(std.id);
      if (assignment === "unassigned" && isAssigned) return false;
      if (assignment === "assigned" && !isAssigned) return false;
      
      return true;
    });

    if (filtered.length === 0) {
      const emptyText = document.createElement("div");
      emptyText.style.fontSize = "0.75rem";
      emptyText.style.color = "var(--text-muted)";
      emptyText.style.fontStyle = "italic";
      emptyText.style.padding = "1rem";
      emptyText.style.textAlign = "center";
      emptyText.textContent = "Öğrenci bulunamadı.";
      masterStudentsGrid.appendChild(emptyText);
      return;
    }
    
    // Sort students alphabetically
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'tr')).forEach(std => {
      const row = document.createElement("div");
      const isAssigned = assignedIds.includes(std.id);
      row.className = `master-student-row ${isAssigned ? 'is-assigned' : ''}`;
      
      const info = document.createElement("div");
      info.className = "student-row-info";
      
      const dot = document.createElement("span");
      dot.className = `student-row-gender-dot ${std.gender || 'unspecified'}`;
      info.appendChild(dot);
      
      const name = document.createElement("span");
      name.className = "student-row-name";
      name.textContent = `${std.name} ${std.surname}`;
      info.appendChild(name);
      
      row.appendChild(info);
      
      const assigners = document.createElement("div");
      assigners.className = "student-row-assigners";
      
      let currentGroupId = null;
      groups.forEach(g => {
        if (g.students.some(s => s.id === std.id)) {
          currentGroupId = g.id;
        }
      });
      
      groups.forEach(g => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-row-assign";
        btn.textContent = g.id;
        btn.title = `${g.name} grubuna yerleştir / kaldır`;
        
        if (currentGroupId === g.id) {
          btn.classList.add(`active-g${((g.id - 1) % 6) + 1}`);
        }
        
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (currentGroupId === g.id) {
            unassignStudent(std.id);
          } else {
            assignStudentToGroup(std.id, g.id);
          }
        });
        
        assigners.appendChild(btn);
      });
      
      row.appendChild(assigners);
      masterStudentsGrid.appendChild(row);
    });
  }

  // Highlight active box (unused in click-only mode, kept for compatibility)
  function highlightActiveGroupBox() {}

  // Setup: Assign student to a group
  function assignStudentToGroup(studentId, groupId) {
    const currentStudents = getActiveStudents();
    const student = currentStudents.find(s => s.id === studentId);
    if (!student) return;
    
    // Remove from any existing group first
    groups.forEach(g => {
      const idx = g.students.findIndex(s => s.id === studentId);
      if (idx !== -1) {
        g.students.splice(idx, 1);
      }
    });
    
    // Remove from unassigned array if present
    const unassignedIdx = unassignedStudents.findIndex(s => s.id === studentId);
    if (unassignedIdx !== -1) {
      unassignedStudents.splice(unassignedIdx, 1);
    }
    
    // Add to target group
    const targetGroup = groups.find(g => g.id === groupId);
    if (targetGroup) {
      targetGroup.students.push(student);
      
      renderSetupGroups();
      renderUnassignedStudents();
    }
  }

  // Setup: Return a student from a group to unassigned list
  function unassignStudent(studentId) {
    let student = null;
    
    groups.forEach(g => {
      const idx = g.students.findIndex(s => s.id === studentId);
      if (idx !== -1) {
        student = g.students[idx];
        g.students.splice(idx, 1);
      }
    });
    
    if (student) {
      if (!unassignedStudents.some(s => s.id === studentId)) {
        unassignedStudents.push(student);
        unassignedStudents.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      }
      
      renderSetupGroups();
      renderUnassignedStudents();
    }
  }

  // Auto-Distribute students using smart gender balance
  function autoDistributeStudents() {
    clearGroupAssignments();
    
    if (unassignedStudents.length === 0) {
      if (toastCallback) toastCallback("Dağıtılacak öğrenci bulunamadı!", "warning");
      return;
    }
    
    // Separate unassigned by gender
    const girls = unassignedStudents.filter(s => s.gender === 'female').sort(() => Math.random() - 0.5);
    const boys = unassignedStudents.filter(s => s.gender === 'male').sort(() => Math.random() - 0.5);
    const others = unassignedStudents.filter(s => s.gender !== 'female' && s.gender !== 'male').sort(() => Math.random() - 0.5);
    
    let currentGroupIdx = 0;
    
    // Distribute girls
    girls.forEach(student => {
      groups[currentGroupIdx].students.push(student);
      currentGroupIdx = (currentGroupIdx + 1) % groups.length;
    });
    
    // Distribute boys
    boys.forEach(student => {
      groups[currentGroupIdx].students.push(student);
      currentGroupIdx = (currentGroupIdx + 1) % groups.length;
    });
    
    // Distribute others
    others.forEach(student => {
      groups[currentGroupIdx].students.push(student);
      currentGroupIdx = (currentGroupIdx + 1) % groups.length;
    });
    
    unassignedStudents = [];
    activeStudentId = null;
    
    renderSetupGroups();
    renderUnassignedStudents();
    
    if (toastCallback) toastCallback("Öğrenciler kız/erkek dengeli şekilde gruplara dağıtıldı.", "success");
  }

  // Clear all group assignments
  function clearGroupAssignments() {
    groups.forEach(g => {
      g.students = [];
    });
    
    const currentStudents = getActiveStudents();
    unassignedStudents = [...currentStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    activeStudentId = null;
    
    renderSetupGroups();
    renderUnassignedStudents();
  }

  // Populate Question Category dropdown
  function populateCategorySelector() {
    if (!gameCategorySelect) return;
    
    gameCategorySelect.innerHTML = '<option value="all">Tüm Kategoriler</option>';
    
    // Get unique categories
    const cats = [...new Set(questions.map(q => q.category).filter(Boolean))];
    cats.sort().forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      gameCategorySelect.appendChild(opt);
    });
  }

  // Start active gameplay
  function startTreasureGame() {
    targetScore = parseInt(targetScoreInput.value) || 50;
    timerSeconds = parseInt(timerLimitInput.value) || 30;
    rewardText = rewardTextInput.value.trim() || "Sürpriz Etkinlik Ödülü";
    
    // Validate
    const activeGroupsCount = groups.filter(g => g.students.length > 0).length;
    if (activeGroupsCount < 2) {
      alert("Oyunu başlatmak için en az 2 gruba öğrenci yerleştirmelisiniz!");
      return;
    }
    
    // Set scores to 0
    groups.forEach(g => g.score = 0);
    winningGroup = null;
    currentQuestion = null;
    
    if (answerContainer) answerContainer.style.display = "none";
    if (btnShowAnswer) {
      btnShowAnswer.setAttribute("disabled", "disabled");
      btnShowAnswer.disabled = true;
    }
    
    // Display updates
    if (activeTargetScoreDisplay) activeTargetScoreDisplay.textContent = targetScore;
    isActiveRewardPeeked = false;
    if (activeRewardDisplay) activeRewardDisplay.textContent = "Gizli 🔒";
    const activeIcon = document.getElementById("icon-active-reward");
    if (activeIcon) activeIcon.setAttribute("data-lucide", "eye");
    if (activeChestVisual) {
      activeChestVisual.classList.remove("open");
      const padlock = activeChestVisual.querySelector(".chest-padlock");
      if (padlock) padlock.textContent = "🔒";
    }
    
    if (treasureQuestionText) {
      treasureQuestionText.textContent = "Hazırsanız 'Yeni Soru Çek' butonu ile oyunu başlatın veya serbest bir soru sorun.";
    }
    if (questionCategoryBadge) {
      questionCategoryBadge.textContent = "Yarışma Başladı";
    }
    
    resetTimer();
    renderActiveGroups();
    renderRankingsBoard();
    
    // Show active screen
    if (setupContainer) setupContainer.style.display = "none";
    if (activeLayout) activeLayout.style.display = "grid";
    
    if (toastCallback) toastCallback("Hazine Sandığı oyunu başladı! Bol şanslar.", "success");
    window.safeCreateIcons();
  }

  // Render Active Group cards in play zone
  function renderActiveGroups() {
    if (!activeGroupsGrid) return;
    activeGroupsGrid.innerHTML = "";
    
    // Filter out groups with no members
    const activeGroups = groups.filter(g => g.students.length > 0);
    
    activeGroups.forEach(g => {
      const pct = Math.min(100, Math.floor((g.score / targetScore) * 100));
      const card = document.createElement("div");
      card.className = `treasure-active-group-card ${g.score >= targetScore - 10 ? 'winning-soon' : ''}`;
      
      const titleRow = document.createElement("div");
      titleRow.style.display = "flex";
      titleRow.style.justifyContent = "space-between";
      titleRow.style.alignItems = "center";
      titleRow.style.marginBottom = "0.5rem";
      
      const name = document.createElement("h5");
      name.style.margin = "0";
      name.style.fontWeight = "700";
      name.style.fontSize = "0.95rem";
      name.textContent = g.name;
      
      const scoreBadge = document.createElement("span");
      scoreBadge.style.fontWeight = "800";
      scoreBadge.style.fontSize = "1.05rem";
      scoreBadge.style.color = "var(--primary)";
      scoreBadge.textContent = `${g.score} / ${targetScore}`;
      
      titleRow.appendChild(name);
      titleRow.appendChild(scoreBadge);
      
      const list = document.createElement("div");
      list.className = "treasure-group-members-list";
      g.students.forEach(s => {
        const item = document.createElement("span");
        item.textContent = `${s.name} ${s.surname[0]}.`;
        list.appendChild(item);
      });
      
      const progressBg = document.createElement("div");
      progressBg.className = "treasure-progress-bar-bg";
      
      const progressFill = document.createElement("div");
      progressFill.className = "treasure-progress-bar-fill";
      progressFill.style.width = `${pct}%`;
      progressBg.appendChild(progressFill);
      
      // Score adjustments
      const actions = document.createElement("div");
      actions.className = "treasure-score-actions";
      
      const plus1 = document.createElement("button");
      plus1.className = "treasure-btn-score";
      plus1.textContent = "+1";
      plus1.addEventListener("click", () => updateGroupScore(g.id, 1));
      
      const plus5 = document.createElement("button");
      plus5.className = "treasure-btn-score";
      plus5.textContent = "+5";
      plus5.addEventListener("click", () => updateGroupScore(g.id, 5));
      
      const minus1 = document.createElement("button");
      minus1.className = "treasure-btn-score minus";
      minus1.textContent = "-1";
      minus1.addEventListener("click", () => updateGroupScore(g.id, -1));
      
      actions.appendChild(minus1);
      actions.appendChild(plus1);
      actions.appendChild(plus5);
      
      card.appendChild(titleRow);
      card.appendChild(list);
      
      const progressWrapper = document.createElement("div");
      progressWrapper.className = "treasure-score-progress-wrapper";
      progressWrapper.appendChild(progressBg);
      
      card.appendChild(progressWrapper);
      card.appendChild(actions);
      
      activeGroupsGrid.appendChild(card);
    });
  }

  // Render group scores ranking board
  function renderRankingsBoard() {
    if (!rankingsList) return;
    rankingsList.innerHTML = "";
    
    const activeGroups = groups.filter(g => g.students.length > 0);
    const sorted = [...activeGroups].sort((a, b) => b.score - a.score);
    
    sorted.forEach((g, idx) => {
      const item = document.createElement("div");
      item.className = `treasure-ranking-item ${idx === 0 ? 'first-place' : ''}`;
      
      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.alignItems = "center";
      left.style.gap = "0.5rem";
      
      const rank = document.createElement("span");
      rank.textContent = `${idx + 1}.`;
      
      const name = document.createElement("span");
      name.textContent = g.name;
      
      left.appendChild(rank);
      left.appendChild(name);
      
      const score = document.createElement("span");
      score.style.fontWeight = "800";
      score.textContent = `${g.score} Puan`;
      
      item.appendChild(left);
      item.appendChild(score);
      
      rankingsList.appendChild(item);
    });
  }

  // Add / subtract points from a group
  function updateGroupScore(groupId, change) {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    group.score = Math.max(0, group.score + change);
    
    renderActiveGroups();
    renderRankingsBoard();
    
    // Check win condition
    if (group.score >= targetScore) {
      triggerVictory(group);
    }
  }

  // Timer: toggle running state
  function toggleTimer() {
    if (timerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  // Timer: Start ticking
  function startTimer() {
    if (timerRunning) return;
    
    timerRunning = true;
    if (timerBtnText) timerBtnText.textContent = "Süreyi Durdur";
    if (timerIcon) {
      timerIcon.setAttribute("data-lucide", "pause");
      window.safeCreateIcons();
    }
    
    TreasureSound.init();
    
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      
      if (timeLeft <= 0) {
        pauseTimer();
        TreasureSound.playGong();
        if (toastCallback) toastCallback("Süre doldu! Cevapları toplayın.", "danger");
      } else {
        TreasureSound.playClockTick();
      }
    }, 1000);
  }

  // Timer: Pause
  function pauseTimer() {
    timerRunning = false;
    if (timerBtnText) timerBtnText.textContent = "Süreyi Başlat";
    if (timerIcon) {
      timerIcon.setAttribute("data-lucide", "play");
      window.safeCreateIcons();
    }
    
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Timer: Reset
  function resetTimer() {
    pauseTimer();
    timeLeft = timerSeconds;
    updateTimerDisplay();
  }

  // Timer: update UI circles and text
  function updateTimerDisplay() {
    if (!timerText || !timerBar) return;
    
    const formatted = String(timeLeft).padStart(2, "0");
    timerText.textContent = formatted;
    
    // Circumference = 163.36
    const offset = Math.max(0, ((timerSeconds - timeLeft) / timerSeconds) * 163.36);
    timerBar.style.strokeDashoffset = offset;
    
    if (timeLeft <= 5) {
      timerText.classList.add("timer-warning");
      timerBar.style.stroke = "var(--danger)";
    } else {
      timerText.classList.remove("timer-warning");
      timerBar.style.stroke = "var(--primary)";
    }
  }

  // Fetch new question from library
  function fetchNextQuestion() {
    activeCategory = gameCategorySelect ? gameCategorySelect.value : "all";
    
    let pool = questions;
    if (activeCategory !== "all") {
      pool = questions.filter(q => q.category === activeCategory);
    }
    
    if (pool.length === 0) {
      if (toastCallback) toastCallback("Seçilen kategoride soru bulunamadı! Lütfen soru havuzunu doldurun.", "warning");
      return;
    }
    
    const randomIdx = Math.floor(Math.random() * pool.length);
    currentQuestion = pool[randomIdx];
    
    // Render question
    const mcContainer = document.getElementById("treasure-mc-options-container");
    if (treasureQuestionText) {
      let text = currentQuestion.text;
      // Strip bracket placeholders for FIB
      if (currentQuestion.type === "fib") {
        text = text.replace(/\[___\]/g, "_______");
      }
      treasureQuestionText.textContent = text;
    }

    if (mcContainer) {
      if (currentQuestion.type === "mc" && Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0) {
        mcContainer.style.display = "block";
        const letters = ["A", "B", "C", "D", "E"];
        mcContainer.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.65rem; text-align: left;">
            ${currentQuestion.options.map((opt, i) => `
              <div class="treasure-mc-opt-card" id="treasure-mc-opt-${i}" style="background: var(--bg-secondary); border: 1.5px solid var(--border-color); border-radius: 8px; padding: 0.65rem 0.85rem; display: flex; align-items: center; gap: 0.6rem; font-size: 0.95rem; transition: all 0.2s;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: rgba(79, 70, 229, 0.12); color: var(--primary); font-weight: 700; font-size: 0.82rem; flex-shrink: 0;">${letters[i] || ''}</span>
                <span style="font-weight: 500; color: var(--text-primary); line-height: 1.35;">${escapeHTML(opt)}</span>
              </div>
            `).join("")}
          </div>
        `;
      } else {
        mcContainer.style.display = "none";
        mcContainer.innerHTML = "";
      }
    }
    
    if (questionCategoryBadge) {
      questionCategoryBadge.textContent = currentQuestion.category || "Genel Bilgi";
    }
    
    // Shake chest visual for excitement
    if (activeChestVisual) {
      activeChestVisual.classList.add("shake-chest");
      setTimeout(() => activeChestVisual.classList.remove("shake-chest"), 500);
    }
    
    if (answerContainer) answerContainer.style.display = "none";
    if (btnShowAnswer) {
      btnShowAnswer.removeAttribute("disabled");
      btnShowAnswer.disabled = false;
    }
    
    // Reset timer for the new question
    resetTimer();
    startTimer();
  }

  // Trigger win / victory screen
  function triggerVictory(group) {
    pauseTimer();
    winningGroup = group;
    
    if (winnerTitle) {
      winnerTitle.textContent = `${group.name} Hazineyi Açtı!`;
    }
    isVictoryRewardHidden = false;
    const victoryIcon = document.getElementById("icon-victory-reward");
    const victoryText = document.getElementById("text-victory-reward");
    if (victoryIcon) victoryIcon.setAttribute("data-lucide", "eye-off");
    if (victoryText) victoryText.textContent = "Gizle";
    if (winnerReward) {
      winnerReward.textContent = rewardText;
    }
    
    // Reset layout elements
    const countdownDisplay = document.getElementById("victory-countdown-display");
    const chestAnim = document.getElementById("victory-chest-anim");
    const rewardScroll = document.getElementById("victory-reward-scroll");
    const actionsContainer = document.getElementById("victory-actions-container");
    
    if (chestAnim) {
      chestAnim.classList.remove("open", "shake-gentle", "shake-intense");
      const padlock = chestAnim.querySelector(".chest-padlock");
      if (padlock) padlock.textContent = "🔒";
    }
    if (rewardScroll) {
      rewardScroll.classList.remove("revealed");
    }
    if (actionsContainer) {
      actionsContainer.style.display = "none";
    }
    
    if (victoryOverlay) {
      victoryOverlay.style.display = "flex";
    }
    
    // Start 10-second countdown
    let countdownSeconds = 10;
    if (countdownDisplay) {
      countdownDisplay.textContent = countdownSeconds;
      countdownDisplay.style.display = "flex";
    }
    
    if (victoryCountdownInterval) {
      clearInterval(victoryCountdownInterval);
    }
    
    // Add initial gentle shake
    if (chestAnim) {
      chestAnim.classList.add("shake-gentle");
    }
    
    // Sound FX init
    TreasureSound.init();
    TreasureSound.playClockTick();
    
    victoryCountdownInterval = setInterval(() => {
      countdownSeconds--;
      
      if (countdownDisplay) {
        countdownDisplay.textContent = countdownSeconds;
      }
      
      if (countdownSeconds > 0) {
        // Play ticking sound
        TreasureSound.playClockTick();
        
        // Shake intensity transition
        if (chestAnim) {
          if (countdownSeconds <= 3) {
            chestAnim.classList.remove("shake-gentle");
            chestAnim.classList.add("shake-intense");
          } else {
            chestAnim.classList.add("shake-gentle");
          }
        }
      } else {
        // Countdown finished!
        clearInterval(victoryCountdownInterval);
        victoryCountdownInterval = null;
        
        if (countdownDisplay) {
          countdownDisplay.style.display = "none";
        }
        
        if (chestAnim) {
          chestAnim.classList.remove("shake-gentle", "shake-intense");
          chestAnim.classList.add("open");
          const padlock = chestAnim.querySelector(".chest-padlock");
          if (padlock) padlock.textContent = "🔓";
        }
        
        // Open the main play screen chest as well and reveal the reward
        if (activeChestVisual) {
          activeChestVisual.classList.remove("shake-gentle", "shake-intense");
          activeChestVisual.classList.add("open");
          const padlock = activeChestVisual.querySelector(".chest-padlock");
          if (padlock) padlock.textContent = "🔓";
        }
        if (activeRewardDisplay) {
          activeRewardDisplay.textContent = rewardText;
        }
        
        // Play gong / explosion sound
        TreasureSound.playGong();
        
        // Emerge scroll and buttons after short lid rotation delay (800ms)
        setTimeout(() => {
          if (rewardScroll) {
            rewardScroll.classList.add("revealed");
          }
          
          TreasureSound.playVictoryMelody();
          startConfetti();
          
          if (actionsContainer) {
            actionsContainer.style.display = "flex";
          }
        }, 800);
      }
    }, 1000);
  }

  // Award Dojo performance points to winning students
  async function awardWinningStudentsDojo() {
    if (!winningGroup) return;
    
    const ptsInput = window.promptAsync ?
      await window.promptAsync("Gruptaki her öğrenciye kaç Dojo puanı eklemek istersiniz?", "5") :
      prompt("Gruptaki her öğrenciye kaç Dojo puanı eklemek istersiniz?", "5");
    const points = parseInt(ptsInput);
    if (isNaN(points) || points <= 0) {
      if (ptsInput !== null) {
        if (toastCallback) toastCallback("Lütfen geçerli pozitif bir sayı girin.", "warning");
      }
      return;
    }
    
    if (window.stateManager) {
      const weekId = window.stateManager.getSelectedWeek();
      
      winningGroup.students.forEach(s => {
        window.stateManager.addPerformance(
          s.id,
          'positive',
          points,
          `Hazine Sandığı Oyunu Birinciliği (${winningGroup.name})`,
          weekId
        );
      });
      
      if (toastCallback) toastCallback("Ödül puanları başarıyla tüm öğrencilere yüklendi.", "success");
      
      // Dispatch state change globally
      const event = new CustomEvent('stateChanged');
      document.dispatchEvent(event);
      
      closeVictoryOverlay();
    }
  }

  // Close victory overlay and return to setup
  function closeVictoryOverlay() {
    stopConfetti();
    if (victoryCountdownInterval) {
      clearInterval(victoryCountdownInterval);
      victoryCountdownInterval = null;
    }
    
    const countdownDisplay = document.getElementById("victory-countdown-display");
    const chestAnim = document.getElementById("victory-chest-anim");
    const rewardScroll = document.getElementById("victory-reward-scroll");
    const actionsContainer = document.getElementById("victory-actions-container");
    
    if (countdownDisplay) {
      countdownDisplay.style.display = "none";
    }
    if (chestAnim) {
      chestAnim.classList.remove("open", "shake-gentle", "shake-intense");
      const padlock = chestAnim.querySelector(".chest-padlock");
      if (padlock) padlock.textContent = "🔒";
    }
    if (rewardScroll) {
      rewardScroll.classList.remove("revealed");
    }
    if (actionsContainer) {
      actionsContainer.style.display = "none";
    }
    
    if (victoryOverlay) {
      victoryOverlay.style.display = "none";
    }
    initTreasureSetup();
  }

  // Exit game and confirm loss of session scores
  function confirmExitGame() {
    if (confirm("Yarışmadan çıkmak istediğinize emin misiniz? Mevcut puanlar sıfırlanacaktır.")) {
      pauseTimer();
      initTreasureSetup();
    }
  }

  // Setup main hooks
  function setupTreasureGame(showToast) {
    toastCallback = showToast;
    
    // Landing card start button
    const btnStart = document.getElementById("btn-start-treasure-game");
    if (btnStart) {
      btnStart.addEventListener("click", () => {
        if (landingView) landingView.style.display = "none";
        if (treasureView) treasureView.style.display = "block";
        initTreasureSetup();
      });
    }
    
    // Back to games landing page
    if (btnBackToGames) {
      btnBackToGames.addEventListener("click", () => {
        if (activeLayout && activeLayout.style.display === "grid") {
          if (!confirm("Oyun devam ediyor. Kuruluma ve oyunlar listesine dönmek istediğinize emin misiniz?")) {
            return;
          }
        }
        pauseTimer();
        if (treasureView) treasureView.style.display = "none";
        if (landingView) landingView.style.display = "block";
        window.safeCreateIcons();
      });
    }
    
    // Setup Controls
    if (groupCountSelect) {
      groupCountSelect.addEventListener("change", updateGroupsCount);
    }
    if (btnAutoDistribute) {
      btnAutoDistribute.addEventListener("click", autoDistributeStudents);
    }
    if (btnClearGroups) {
      btnClearGroups.addEventListener("click", clearGroupAssignments);
    }
    if (btnStartGame) {
      btnStartGame.addEventListener("click", startTreasureGame);
    }

    // Save & Load groups buttons
    const btnSaveGroups = document.getElementById("btn-treasure-save-groups");
    if (btnSaveGroups) {
      btnSaveGroups.addEventListener("click", saveGroupsConfig);
    }
    const btnLoadGroups = document.getElementById("btn-treasure-load-groups");
    if (btnLoadGroups) {
      btnLoadGroups.addEventListener("click", loadGroupsConfig);
    }

    // Sub-tab Navigation
    if (navPlayBtn) {
      navPlayBtn.addEventListener("click", () => switchTreasureSubTab("play"));
    }
    if (navQuestionsBtn) {
      navQuestionsBtn.addEventListener("click", () => switchTreasureSubTab("questions"));
    }

    // Show Answer Control
    if (btnShowAnswer) {
      btnShowAnswer.addEventListener("click", showCorrectAnswer);
    }

    // Question Form Controls
    if (questionTypeSelect) {
      questionTypeSelect.addEventListener("change", (e) => toggleQuestionTypeUI(e.target.value));
    }
    if (btnCancelQuestionEdit) {
      btnCancelQuestionEdit.addEventListener("click", resetTreasureQuestionForm);
    }
    if (questionForm) {
      questionForm.addEventListener("submit", handleTreasureQuestionSubmit);
    }
    if (libraryCategoryFilter) {
      libraryCategoryFilter.addEventListener("change", renderTreasureQuestionLibrary);
    }
    if (btnDeleteAllQuestions) {
      btnDeleteAllQuestions.addEventListener("click", deleteAllTreasureQuestions);
    }

    const importFileInput = document.getElementById("treasure-import-json-file");
    if (importFileInput) {
      importFileInput.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
          try {
            importTreasureJSON(evt.target.result);
          } catch (err) {
            alert("JSON dosyası ayrıştırılırken hata oluştu: " + err.message);
          }
          importFileInput.value = "";
        };
        reader.readAsText(file);
      });
    }

    // Search filter input listener
    const searchInput = document.getElementById("treasure-unassigned-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        unassignedSearchQuery = e.target.value;
        renderUnassignedStudents();
      });
    }

    // Gender filter change listener
    const genderFilterEl = document.getElementById("treasure-gender-filter");
    if (genderFilterEl) {
      genderFilterEl.addEventListener("change", (e) => {
        renderUnassignedStudents();
      });
    }

    // Assignment status filter change listener
    const assignmentFilterEl = document.getElementById("treasure-assignment-filter");
    if (assignmentFilterEl) {
      assignmentFilterEl.addEventListener("change", (e) => {
        renderUnassignedStudents();
      });
    }

    
    // Active Controls
    if (btnExitGame) {
      btnExitGame.addEventListener("click", confirmExitGame);
    }
    if (btnTimerToggle) {
      btnTimerToggle.addEventListener("click", toggleTimer);
    }
    if (btnTimerReset) {
      btnTimerReset.addEventListener("click", resetTimer);
    }
    if (btnNextQuestion) {
      btnNextQuestion.addEventListener("click", fetchNextQuestion);
    }
    
    // Victory Controls
    if (btnAwardDojo) {
      btnAwardDojo.addEventListener("click", awardWinningStudentsDojo);
    }
    if (btnCloseVictory) {
      btnCloseVictory.addEventListener("click", closeVictoryOverlay);
    }

    // Reward visibility controls
    const btnToggleRewardVis = document.getElementById("btn-toggle-reward-visibility");
    if (btnToggleRewardVis) {
      btnToggleRewardVis.addEventListener("click", toggleRewardInputVisibility);
    }
    const btnRewardEye = document.getElementById("btn-reward-eye");
    if (btnRewardEye) {
      btnRewardEye.addEventListener("click", toggleRewardInputVisibility);
    }
    const btnActiveToggleReward = document.getElementById("btn-active-toggle-reward");
    if (btnActiveToggleReward) {
      btnActiveToggleReward.addEventListener("click", toggleActiveRewardVisibility);
    }
    const btnVictoryToggleReward = document.getElementById("btn-victory-toggle-reward");
    if (btnVictoryToggleReward) {
      btnVictoryToggleReward.addEventListener("click", toggleVictoryRewardVisibility);
    }
    
    // Initial data load
    loadQuestions();
    populateLibraryCategoryFilter();
    renderTreasureQuestionLibrary();
  }

  // Render method
  function renderTreasureGame() {
    loadQuestions();
    populateCategorySelector();
    populateLibraryCategoryFilter();
    renderTreasureQuestionLibrary();
  }

  // Expose module globally
  window.setupTreasureGame = setupTreasureGame;
  window.renderTreasureGame = renderTreasureGame;
})();
