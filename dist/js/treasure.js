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
    } else if (q.type === "mc" || q.type === "fib") {
      if (q.options && Array.isArray(q.options)) {
        const idx = parseInt(q.answer);
        if (!isNaN(idx) && idx >= 0 && idx < q.options.length) {
          return q.options[idx];
        }
      }
      return q.answer;
    }
    return "";
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

  // Render questions table list in Soru Kütüphanesi
  function renderTreasureQuestionLibrary() {
    if (!questionListBody) return;
    
    questionListBody.innerHTML = "";
    
    const categoryFilter = libraryCategoryFilter ? libraryCategoryFilter.value : "all";
    let filteredQuestions = questions;
    
    if (categoryFilter !== "all") {
      filteredQuestions = questions.filter(q => q.category === categoryFilter);
    }
    
    if (questionCountBadge) {
      questionCountBadge.textContent = `${filteredQuestions.length} Soru`;
    }
    
    if (filteredQuestions.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">
          Kütüphanede soru bulunmuyor. Yeni bir soru ekleyin!
        </td>
      `;
      questionListBody.appendChild(row);
      return;
    }
    
    filteredQuestions.forEach(q => {
      const row = document.createElement("tr");
      
      let typeText = "Doğru / Yanlış";
      if (q.type === "mc") {
        typeText = "Çoktan Seçmeli";
      } else if (q.type === "fib") {
        typeText = "Boşluk Doldurma";
      }
      
      const answerDisplayVal = getAnswerDisplay(q);
      
      row.innerHTML = `
        <td>
          <span class="badge" style="font-size: 0.7rem; padding: 0.15rem 0.4rem; background: rgba(0, 0, 0, 0.05); color: var(--text-primary);">
            ${typeText}
          </span>
        </td>
        <td>
          <span style="font-weight: 600; color: var(--primary); font-size: 0.8rem;">
            ${q.category || "Genel"}
          </span>
        </td>
        <td>
          <div style="max-width: 350px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${q.text}">
            ${q.text}
          </div>
        </td>
        <td>
          <span style="font-weight: 500; font-size: 0.8rem; color: var(--text-primary);">
            ${answerDisplayVal}
          </span>
        </td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 0.25rem; justify-content: center;">
            <button class="btn btn-outline btn-sm btn-edit-question-lib" data-id="${q.id}" style="padding: 0.2rem 0.4rem; height: auto; font-size: 0.75rem;" title="Düzenle">
              <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
            </button>
            <button class="btn btn-outline btn-sm btn-delete-question-lib" data-id="${q.id}" style="padding: 0.2rem 0.4rem; height: auto; font-size: 0.75rem; color: var(--danger); border-color: rgba(239, 68, 68, 0.2);" title="Sil">
              <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
            </button>
          </div>
        </td>
      `;
      
      const editBtn = row.querySelector(".btn-edit-question-lib");
      if (editBtn) {
        editBtn.addEventListener("click", () => editTreasureQuestion(q.id));
      }
      
      const deleteBtn = row.querySelector(".btn-delete-question-lib");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => deleteTreasureQuestion(q.id));
      }
      
      questionListBody.appendChild(row);
    });
    
    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Populate Form fields for editing
  function editTreasureQuestion(id) {
    const question = questions.find(q => q.id === id);
    if (!question) return;
    
    if (editQuestionId) editQuestionId.value = question.id;
    if (questionTypeSelect) {
      questionTypeSelect.value = question.type;
      toggleQuestionTypeUI(question.type);
    }
    if (questionCategoryInput) questionCategoryInput.value = question.category || "";
    if (questionSentenceTextarea) questionSentenceTextarea.value = question.text || "";
    if (questionExplanationInput) questionExplanationInput.value = question.explanation || "";
    
    if (question.type === "tf") {
      if (questionAnswerTfSelect) {
        questionAnswerTfSelect.value = question.answer === true || question.answer === "true" ? "true" : "false";
      }
    } else if (question.type === "mc") {
      if (questionAnswerInput && question.options && question.options.length > 0) {
        const correctIdx = parseInt(question.answer) || 0;
        questionAnswerInput.value = question.options[correctIdx] || "";
        
        const wrongOpts = question.options.filter((_, idx) => idx !== correctIdx);
        if (questionWrongOptionsInput) {
          questionWrongOptionsInput.value = wrongOpts.join(", ");
        }
      }
    } else if (question.type === "fib") {
      if (questionAnswerInput) {
        if (question.options && question.options.length > 0) {
          const correctIdx = parseInt(question.answer) || 0;
          questionAnswerInput.value = question.options[correctIdx] || "";
        } else {
          questionAnswerInput.value = question.answer || "";
        }
      }
    }
    
    if (questionFormTitle) questionFormTitle.textContent = "Soruyu Düzenle";
    if (btnCancelQuestionEdit) btnCancelQuestionEdit.style.display = "inline-block";
  }

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
    
    if (btnShowAnswer) {
      btnShowAnswer.setAttribute("disabled", "disabled");
      btnShowAnswer.disabled = true;
    }
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
    if (rewardTextInput) rewardTextInput.value = "";
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
    if (activeRewardDisplay) activeRewardDisplay.textContent = "Gizli 🔒";
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
    if (treasureQuestionText) {
      let text = currentQuestion.text;
      // Strip bracket placeholders for FIB
      if (currentQuestion.type === "fib") {
        text = text.replace(/\[___\]/g, "_______");
      }
      treasureQuestionText.textContent = text;
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
  function awardWinningStudentsDojo() {
    if (!winningGroup) return;
    
    const ptsInput = prompt("Gruptaki her öğrenciye kaç Dojo puanı eklemek istersiniz?", "5");
    const points = parseInt(ptsInput);
    if (isNaN(points) || points <= 0) {
      if (ptsInput !== null) {
        alert("Lütfen geçerli pozitif bir sayı girin.");
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
