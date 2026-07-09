(() => {
  // Scoped Game State
  let questions = [];
  let studentScores = {};
  let settings = {
    timerSeconds: 15
  };
  let currentQuestionIndex = 0;
  let totalScore = 0;
  let stats = {
    correct: 0,
    incorrect: 0,
    skipped: 0
  };
  let timerInterval = null;
  let tickTimeout = null;
  let timeLeft = 0;
  let soundEnabled = true;
  let isLastInRound = false;
  let currentRoundNumber = 1;

  let setupSelectedMode = "tf";
  let activeGameQuestions = [];
  let activeGameMode = "tf";
  let activeCategory = "all";
  let unselectedStudents = [];
  let activeStudent = "";

  let quizSelectedStudentNames = [];
  let multSelectedStudentNames = [];

  let toastCallback = null;

  // Scoped Multiplication Game State
  let multSelectedNumber = "all";
  let multQuestionCount = 10;
  let multTimerLimit = 10;
  let multCurrentIndex = 0;
  let multRoundNumber = 1;
  let multActiveStudent = "";
  let multQuestions = [];
  let multUnselectedStudents = [];
  let multScores = {};
  let multStats = { correct: 0, incorrect: 0, skipped: 0 };
  let multSoundEnabled = true;
  let multTimerInterval = null;
  let multTickTimeout = null;
  let multTimeLeft = 0;
  let multIsLastInRound = false;

  // Web Audio API Sound Generator
  const SoundFX = {
    ctx: null,
    tickToggle: false,

    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    },

    isSoundEnabled() {
      const quizView = document.getElementById("games-quiz-view");
      const multView = document.getElementById("games-multiplication-view");
      if (quizView && quizView.style.display === "block") {
        return soundEnabled;
      }
      if (multView && multView.style.display === "block") {
        return multSoundEnabled;
      }
      return soundEnabled || multSoundEnabled;
    },

    playTone(freq, type, duration, delay = 0) {
      if (!this.isSoundEnabled()) return;
      this.init();
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + delay + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
      } catch (e) {
        console.warn("Audio Context error:", e);
      }
    },

    playCorrect() {
      this.playTone(523.25, 'sine', 0.15); // C5
      this.playTone(659.25, 'sine', 0.3, 0.1); // E5
    },

    playIncorrect() {
      if (!this.isSoundEnabled()) return;
      this.init();
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
      } catch (e) {
        console.warn(e);
      }
    },

    playTick() {
      this.playTone(880, 'sine', 0.04); // A5 short beep
    },

    playClockTick() {
      if (!this.isSoundEnabled()) return;
      this.init();
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        // Alternate between tick and tock frequencies
        const freq = this.tickToggle ? 850 : 1050;
        this.tickToggle = !this.tickToggle;
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.03);
      } catch (e) {
        console.warn(e);
      }
    },

    playGong() {
      if (!this.isSoundEnabled()) return;
      this.init();
      try {
        const now = this.ctx.currentTime;
        // Inharmonic partials to synthesize a rich metallic gong ring
        const partials = [
          { freq: 110, type: 'triangle', gain: 0.25, decay: 2.2 },
          { freq: 154, type: 'sine',     gain: 0.18, decay: 2.0 },
          { freq: 205, type: 'sine',     gain: 0.15, decay: 1.6 },
          { freq: 260, type: 'sine',     gain: 0.10, decay: 1.3 },
          { freq: 320, type: 'sine',     gain: 0.08, decay: 1.0 },
          { freq: 430, type: 'sine',     gain: 0.05, decay: 0.7 }
        ];

        partials.forEach(p => {
          const osc = this.ctx.createOscillator();
          const gainNode = this.ctx.createGain();
          
          osc.type = p.type;
          osc.frequency.setValueAtTime(p.freq, now);
          // Slight downward pitch glide for depth
          osc.frequency.exponentialRampToValueAtTime(p.freq * 0.95, now + p.decay);
          
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

    playExpire() {
      if (!this.isSoundEnabled()) return;
      this.init();
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
      } catch (e) {
        console.warn(e);
      }
    },

    playRaffleTick() {
      this.playTone(600, 'sine', 0.02);
    },

    playRaffleWin() {
      this.playTone(587.33, 'sine', 0.1); // D5
      this.playTone(698.46, 'sine', 0.1, 0.08); // F5
      this.playTone(880.00, 'sine', 0.25, 0.16); // A5
    }
  };

  // Default Sample Questions (Turkish)
  const defaultQuestions = [
    { id: 1, type: "tf", category: "Bilim", text: "Ahtapotların üç adet kalbi vardır.", answer: true, explanation: "Evet, ahtapotların iki solungaç kalbi ve bir sistemik kalbi bulunur." },
    { id: 2, type: "tf", category: "Bilim", text: "Dünya, Güneş sistemindeki en büyük gezegendir.", answer: false, explanation: "En büyük gezegen Jüpiter'dir. Dünya büyüklükte 5. sıradadır." },
    { id: 3, type: "tf", category: "Bilim", text: "Işık, sesten daha hızlı yayılır.", answer: true, explanation: "Işık hızı boşlukta yaklaşık 300.000 km/s iken, ses hızı havada yaklaşık 343 m/s'dir." },
    { id: 4, type: "tf", category: "Coğrafya", text: "Kanada'nın başkenti Toronto'dur.", answer: false, explanation: "Kanada'nın başkenti Ottawa'dır. Toronto en büyük şehridir." },
    { id: 5, type: "tf", category: "Biyoloji", text: "İnsan vücudundaki en sert madde diş minesidir.", answer: true, explanation: "Diş minesi vücudun en yoğun mineralli ve en sert dokusudur." },
    { id: 6, type: "tf", category: "Biyoloji", text: "Balinalar balık sınıfına giren deniz canlılarıdır.", answer: false, explanation: "Balinalar memelidir; akciğerleriyle nefes alırlar ve yavrularını emzirirler." },
    { id: 7, type: "tf", category: "Bilim", text: "Güneş aslında orta büyüklükte bir yıldızdır.", answer: true, explanation: "Güneş, G-tipi anakol cüce yıldızıdır ve orta büyüklüktedir." },
    { id: 8, type: "tf", category: "Coğrafya", text: "Türkiye'nin yüzölçümü en büyük ili Konya'dır.", answer: true, explanation: "Yüzölçümü bakımından Konya, 38.873 km² ile Türkiye'nin en büyük ilidir." },
    { id: 9, type: "tf", category: "Biyoloji", text: "Penguenler uçabilen tek kutup kuşlarıdır.", answer: false, explanation: "Penguenler uçamayan kuşlardır; kanatlarını yüzmek için kullanırlar." },
    { id: 10, type: "tf", category: "Fizik", text: "Su, deniz seviyesinde 100 santigrat derecede kaynar.", answer: true, explanation: "Deniz seviyesinde (1 atm basınçta) suyun kaynama noktası 100°C'dir." },
    { id: 11, type: "mc", category: "Bilim", text: "Hangi gezegen Güneş sistemindeki en büyük gezegendir?", options: ["Mars", "Jüpiter", "Satürn", "Dünya"], answer: 1, explanation: "Jüpiter, Güneş sisteminin en büyük gezegenidir ve çapı Dünya'nın yaklaşık 11 katıdır." },
    { id: 12, type: "mc", category: "Coğrafya", text: "Aşağıdakilerden hangisi Türkiye'nin başkentidir?", options: ["İstanbul", "Ankara", "İzmir", "Bursa"], answer: 1, explanation: "Türkiye'nin başkenti Ankara'dır ve 13 Ekim 1923'te başkent olmuştur." },
    { id: 13, type: "mc", category: "Biyoloji", text: "Kutup ayıları doğal olarak hangi yarımkürede yaşarlar?", options: ["Kuzey Yarımküre", "Güney Yarımküre", "Ekvator", "Hiçbiri"], answer: 0, explanation: "Kutup ayıları yalnızca Kuzey Kutbu ve çevresindeki Kuzey Yarımküre bölgelerinde yaşarlar; penguenler ise Güney Yarımküre'de yaşar." },
    { id: 14, type: "mc", category: "Tarih", text: "Cumhuriyet hangi yılda ilan edilmiştir?", options: ["1919", "1920", "1923", "1924"], answer: 2, explanation: "Türkiye Cumhuriyeti, 29 Ekim 1923'te resmen ilan edilmiştir." },
    { id: 15, type: "fib", category: "Bilim", text: "Güneş sistemindeki en sıcak gezegen [___] gezegenidir.", options: ["Mars", "Venüs", "Merkür", "Jüpiter"], answer: 1, explanation: "Venüs, kalın karbondioksit atmosferi nedeniyle Merkür'den daha sıcaktır (yaklaşık 460°C)." },
    { id: 16, type: "fib", category: "Coğrafya", text: "Dünyanın en yüksek dağı olan [___] Asya kıtasında bulunur.", options: ["Everest Dağı", "K2 Dağı", "Kilimanjaro Dağı", "Mont Blanc"], answer: 0, explanation: "Everest Dağı, deniz seviyesinden 8.848 metre yüksekliğiyle dünyanın en yüksek dağıdır." },
    { id: 17, type: "fib", category: "Tarih", text: "İstanbul, [___] yılında Fatih Sultan Mehmet tarafından fethedilmiştir.", options: ["1071", "1453", "1923", "1299"], answer: 1, explanation: "İstanbul, 29 Mayıs 1453 tarihinde Osmanlı ordusu tarafından fethedilmiştir." }
  ];

  // Helper to fetch current student names list from StateManager
  function getQuizStudents() {
    if (window.stateManager && window.stateManager.state && window.stateManager.state.students) {
      let list = window.stateManager.state.students;
      if (window.LicenseConfig && window.LicenseConfig.isDemo) {
        list = list.slice(0, window.LicenseConfig.studentLimit);
      }
      return list.map(s => `${s.name} ${s.surname}`.trim());
    }
    return [];
  }

  // Load data from LocalStorage
  function loadData() {
    // Questions
    const storedQuestions = localStorage.getItem("tf_questions");
    if (storedQuestions) {
      questions = JSON.parse(storedQuestions);
      
      // Auto-migrate new fib questions if they don't exist yet
      const hasFib = questions.some(q => q.type === "fib");
      if (!hasFib) {
        const fibQuestions = defaultQuestions.filter(q => q.type === "fib");
        questions = [...questions, ...fibQuestions];
        saveQuestions();
      }
    } else {
      questions = [...defaultQuestions];
      saveQuestions();
    }

    // Student Scores
    const storedScores = localStorage.getItem("tf_student_scores");
    if (storedScores) {
      studentScores = JSON.parse(storedScores);
    } else {
      studentScores = {};
    }

    // Filter studentScores based on currently active students from StateManager
    const currentList = getQuizStudents();
    const cleanScores = {};
    currentList.forEach(name => {
      if (studentScores[name]) {
        cleanScores[name] = studentScores[name];
        if (cleanScores[name].incorrectCount === undefined) cleanScores[name].incorrectCount = 0;
        if (cleanScores[name].turnCount === undefined) cleanScores[name].turnCount = 0;
      } else {
        cleanScores[name] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
      }
    });
    studentScores = cleanScores;
    saveStudentScores();

    // Selected Students for Quiz
    const storedSelectedQuiz = localStorage.getItem("quiz_selected_students");
    if (storedSelectedQuiz) {
      try {
        const parsed = JSON.parse(storedSelectedQuiz);
        const existingSelected = parsed.filter(name => currentList.includes(name));
        const newStudents = currentList.filter(name => !parsed.includes(name));
        quizSelectedStudentNames = [...existingSelected, ...newStudents];
      } catch (e) {
        quizSelectedStudentNames = [...currentList];
      }
    } else {
      quizSelectedStudentNames = [...currentList];
    }
    saveSelectedQuizStudents();

    // Unselected Students for Raffle
    const storedUnselected = localStorage.getItem("tf_unselected_students");
    if (storedUnselected) {
      const rawUnselected = JSON.parse(storedUnselected);
      // Keep only students that are currently active and selected
      unselectedStudents = rawUnselected.filter(name => quizSelectedStudentNames.includes(name));
    } else {
      unselectedStudents = [...quizSelectedStudentNames];
      saveUnselectedStudents();
    }

    // General Score & Stats
    totalScore = parseInt(localStorage.getItem("tf_total_score")) || 0;
    stats = JSON.parse(localStorage.getItem("tf_stats")) || { correct: 0, incorrect: 0, skipped: 0 };
    currentQuestionIndex = parseInt(localStorage.getItem("tf_current_index")) || 0;
    currentRoundNumber = parseInt(localStorage.getItem("tf_round_number")) || 1;
    isLastInRound = localStorage.getItem("tf_is_last_in_round") === "true";
  }

  function saveQuestions() {
    localStorage.setItem("tf_questions", JSON.stringify(questions));
  }

  function saveStudentScores() {
    localStorage.setItem("tf_student_scores", JSON.stringify(studentScores));
  }

  function saveUnselectedStudents() {
    localStorage.setItem("tf_unselected_students", JSON.stringify(unselectedStudents));
  }

  function saveSelectedQuizStudents() {
    localStorage.setItem("quiz_selected_students", JSON.stringify(quizSelectedStudentNames));
  }

  function saveSelectedMultStudents() {
    localStorage.setItem("mult_selected_students", JSON.stringify(multSelectedStudentNames));
  }

  function renderQuizStudentSelection() {
    const container = document.getElementById("quiz-setup-students-list");
    if (!container) return;
    
    container.innerHTML = "";
    
    const state = stateManager.loadState();
    const selectBranch = document.getElementById('quiz-select-branch');
    const branchFilter = selectBranch ? selectBranch.value : 'all';

    let activeStudents = state.students || [];
    if (window.LicenseConfig && window.LicenseConfig.isDemo) {
      activeStudents = activeStudents.slice(0, window.LicenseConfig.studentLimit);
    }

    const filteredStudents = activeStudents.filter(student => {
      return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
    });

    const currentList = filteredStudents.map(s => `${s.name} ${s.surname}`.trim());
    
    if (currentList.length === 0) {
      container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 1rem;">Sınıfta kriterlere uygun öğrenci bulunmuyor.</div>`;
      return;
    }
    
    currentList.forEach(name => {
      const isChecked = quizSelectedStudentNames.includes(name);
      
      const item = document.createElement("label");
      item.className = "student-checkbox-item";
      
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = isChecked;
      chk.addEventListener("change", () => {
        if (chk.checked) {
          if (!quizSelectedStudentNames.includes(name)) {
            quizSelectedStudentNames.push(name);
          }
        } else {
          quizSelectedStudentNames = quizSelectedStudentNames.filter(n => n !== name);
        }
        saveSelectedQuizStudents();
      });
      
      const span = document.createElement("span");
      span.textContent = name;
      
      item.appendChild(chk);
      item.appendChild(span);
      container.appendChild(item);
    });
  }

  function renderMultStudentSelection() {
    const container = document.getElementById("mult-setup-students-list");
    if (!container) return;
    
    container.innerHTML = "";
    
    const state = stateManager.loadState();
    const selectBranch = document.getElementById('mult-select-branch');
    const branchFilter = selectBranch ? selectBranch.value : 'all';

    let activeStudents = state.students || [];
    if (window.LicenseConfig && window.LicenseConfig.isDemo) {
      activeStudents = activeStudents.slice(0, window.LicenseConfig.studentLimit);
    }

    const filteredStudents = activeStudents.filter(student => {
      return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
    });

    const currentList = filteredStudents.map(s => `${s.name} ${s.surname}`.trim());
    
    if (currentList.length === 0) {
      container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 1rem;">Sınıfta kriterlere uygun öğrenci bulunmuyor.</div>`;
      return;
    }
    
    currentList.forEach(name => {
      const isChecked = multSelectedStudentNames.includes(name);
      
      const item = document.createElement("label");
      item.className = "student-checkbox-item";
      
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = isChecked;
      chk.addEventListener("change", () => {
        if (chk.checked) {
          if (!multSelectedStudentNames.includes(name)) {
            multSelectedStudentNames.push(name);
          }
        } else {
          multSelectedStudentNames = multSelectedStudentNames.filter(n => n !== name);
        }
        saveSelectedMultStudents();
      });
      
      const span = document.createElement("span");
      span.textContent = name;
      
      item.appendChild(chk);
      item.appendChild(span);
      container.appendChild(item);
    });
  }

  function saveGlobalProgress() {
    localStorage.setItem("tf_total_score", totalScore.toString());
    localStorage.setItem("tf_stats", JSON.stringify(stats));
    localStorage.setItem("tf_current_index", currentQuestionIndex.toString());
    localStorage.setItem("tf_round_number", currentRoundNumber.toString());
    localStorage.setItem("tf_is_last_in_round", isLastInRound.toString());
  }

  function initSettings() {
    const storedSettings = localStorage.getItem("tf_settings");
    if (storedSettings) {
      settings = JSON.parse(storedSettings);
    }
    
    const slider = document.getElementById("setting-timer");
    const label = document.getElementById("timer-label");
    if (slider) slider.value = settings.timerSeconds;
    if (label) label.textContent = `${settings.timerSeconds}s`;
  }

  function setupGamesTab(showToast) {
    toastCallback = showToast;

    // Load Data
    loadData();
    initSettings();
    populateCategorySelectors();

    // 1. Landing page actions
    const btnStartQuiz = document.getElementById("btn-start-quiz-game");
    if (btnStartQuiz) {
      btnStartQuiz.addEventListener("click", () => {
        document.getElementById("games-landing-view").style.display = "none";
        document.getElementById("games-quiz-view").style.display = "block";
        switchQuizSubTab("play");
      });
    }

    const btnBackToGames = document.getElementById("btn-back-to-games");
    if (btnBackToGames) {
      btnBackToGames.addEventListener("click", () => {
        // Warning on incomplete round
        const currentList = quizSelectedStudentNames;
        const isRoundIncomplete = unselectedStudents.length > 0 && unselectedStudents.length < currentList.length;
        if (isRoundIncomplete) {
          if (!confirm("Tur tamamlanmadı! Bazı öğrenciler diğerlerinden daha fazla soru cevapladı. Çıkmak istediğinize emin misiniz?")) {
            return;
          }
        } else if (activeStudent && timeLeft > 0) {
          if (!confirm("Devam eden bir yarışma var. Çıkmak istediğinize emin misiniz?")) {
            return;
          }
        }
        clearQuizTimer();
        activeStudent = "";
        document.getElementById("games-quiz-view").style.display = "none";
        document.getElementById("games-landing-view").style.display = "block";
        window.safeCreateIcons();
      });
    }

    // 2. Sub-tab navigation inside quiz
    const navButtons = {
      play: document.getElementById("game-quiz-nav-play"),
      admin: document.getElementById("game-quiz-nav-admin"),
      leaderboard: document.getElementById("game-quiz-nav-leaderboard")
    };

    for (let key in navButtons) {
      if (navButtons[key]) {
        navButtons[key].addEventListener("click", () => {
          switchQuizSubTab(key);
        });
      }
    }

    // 3. Mode selectors in Setup screen
    const modeCards = {
      tf: document.getElementById("setup-mode-tf"),
      mc: document.getElementById("setup-mode-mc"),
      fib: document.getElementById("setup-mode-fib")
    };

    for (let key in modeCards) {
      if (modeCards[key]) {
        modeCards[key].addEventListener("click", () => {
          setupSelectedMode = key;
          for (let m in modeCards) {
            if (modeCards[m]) modeCards[m].classList.remove("active");
          }
          modeCards[key].classList.add("active");
        });
      }
    }

    // 4. Start Game Button
    const btnQuizStart = document.getElementById("btn-quiz-start-game");
    if (btnQuizStart) {
      btnQuizStart.addEventListener("click", startQuizGame);
    }

    // 5. Select Student Button
    const btnSelectStudent = document.getElementById("btn-select-student");
    if (btnSelectStudent) {
      btnSelectStudent.addEventListener("click", selectRandomStudent);
    }

    // 6. Sound Toggle Button
    const btnSoundToggle = document.getElementById("btn-sound-toggle");
    if (btnSoundToggle) {
      btnSoundToggle.addEventListener("click", toggleSound);
    }

    const btnFullscreenToggle = document.getElementById("btn-fullscreen-toggle");
    if (btnFullscreenToggle) {
      btnFullscreenToggle.addEventListener("click", toggleFullscreenGame);
    }

    // 7. Active game control buttons
    const btnExitGame = document.getElementById("btn-exit-game");
    if (btnExitGame) {
      btnExitGame.addEventListener("click", () => {
        const currentList = quizSelectedStudentNames;
        const isRoundIncomplete = unselectedStudents.length > 0 && unselectedStudents.length < currentList.length;
        if (isRoundIncomplete) {
          if (!confirm("Tur tamamlanmadı! Bazı öğrenciler diğerlerinden daha fazla soru cevapladı. Kuruluma dönmek istediğinize emin misiniz?")) {
            return;
          }
        } else if (activeStudent && timeLeft > 0) {
          if (!confirm("Devam eden bir yarışma var. Kuruluma dönmek istediğinize emin misiniz?")) {
            return;
          }
        }
        clearQuizTimer();
        document.getElementById("game-setup-container").style.display = "block";
        document.getElementById("game-active-layout").style.display = "none";
        resetRaffleUI();
      });
    }

    const btnSkip = document.getElementById("btn-skip");
    if (btnSkip) {
      btnSkip.addEventListener("click", skipQuestion);
    }

    const btnRestart = document.getElementById("btn-restart");
    if (btnRestart) {
      btnRestart.addEventListener("click", restartQuiz);
    }

    // 8. Close Modals/Overlays
    const btnCloseFeedback = document.getElementById("btn-close-feedback");
    if (btnCloseFeedback) {
      btnCloseFeedback.addEventListener("click", closeFeedback);
    }

    const btnGameOverRestart = document.getElementById("btn-game-over-restart");
    if (btnGameOverRestart) {
      btnGameOverRestart.addEventListener("click", () => {
        document.getElementById("game-over-overlay").style.display = "none";
        restartQuizGame();
      });
    }

    const btnGameOverExit = document.getElementById("btn-game-over-exit");
    if (btnGameOverExit) {
      btnGameOverExit.addEventListener("click", () => {
        document.getElementById("game-over-overlay").style.display = "none";
        document.getElementById("game-setup-container").style.display = "block";
        document.getElementById("game-active-layout").style.display = "none";
        resetRaffleUI();
      });
    }

    const btnCloseRound = document.getElementById("btn-close-round-overlay");
    if (btnCloseRound) {
      btnCloseRound.addEventListener("click", closeRoundOverlay);
    }

    // 9. Admin settings
    const sliderTimer = document.getElementById("setting-timer");
    if (sliderTimer) {
      sliderTimer.addEventListener("input", (e) => {
        document.getElementById("timer-label").textContent = `${e.target.value}s`;
      });
    }

    const btnSaveSettings = document.getElementById("btn-save-quiz-settings");
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener("click", () => {
        const val = parseInt(document.getElementById("setting-timer").value);
        settings.timerSeconds = val;
        localStorage.setItem("tf_settings", JSON.stringify(settings));
        if (toastCallback) toastCallback("Ayarlar başarıyla kaydedildi!", "success");
      });
    }

    // 10. Question CRUD Form Options Count Trigger
    const selectMcCount = document.getElementById("mc-option-count");
    if (selectMcCount) {
      selectMcCount.addEventListener("change", (e) => {
        updateFormMcOptions(e.target.value);
      });
    }

    const selectQType = document.getElementById("question-type");
    if (selectQType) {
      selectQType.addEventListener("change", (e) => {
        toggleFormQuestionType(e.target.value);
      });
    }

    // 11. Image inputs preview inside form
    const inputImgUrl = document.getElementById("question-image-url");
    if (inputImgUrl) {
      inputImgUrl.addEventListener("input", (e) => {
        handleImageUrlInput(e.target.value);
      });
    }

    const inputImgFile = document.getElementById("question-image-file");
    if (inputImgFile) {
      inputImgFile.addEventListener("change", (e) => {
        handleImageFileSelect(e);
      });
    }

    const btnClearImgPreview = document.getElementById("btn-clear-image-preview");
    if (btnClearImgPreview) {
      btnClearImgPreview.addEventListener("click", clearImagePreview);
    }

    const btnCancelEdit = document.getElementById("btn-cancel-edit");
    if (btnCancelEdit) {
      btnCancelEdit.addEventListener("click", cancelEdit);
    }

    // 12. Form Submission
    const formQuestion = document.getElementById("question-form");
    if (formQuestion) {
      formQuestion.addEventListener("submit", handleQuestionSubmit);
    }

    // 13. File upload buttons
    const btnTriggerFile = document.getElementById("btn-trigger-file-select");
    const inputFile = document.getElementById("file-input");
    if (btnTriggerFile && inputFile) {
      btnTriggerFile.addEventListener("click", () => {
        inputFile.click();
      });
      inputFile.addEventListener("change", handleFileSelect);
    }

    // 14. Library and Leaderboard actions
    const selectLibCategoryFilter = document.getElementById("library-category-filter");
    if (selectLibCategoryFilter) {
      selectLibCategoryFilter.addEventListener("change", renderQuestionLibrary);
    }

    const btnDeleteAllQuestions = document.getElementById("btn-delete-all-questions");
    if (btnDeleteAllQuestions) {
      btnDeleteAllQuestions.addEventListener("click", deleteAllQuestions);
    }

    const btnResetAllScores = document.getElementById("btn-reset-all-scores");
    if (btnResetAllScores) {
      btnResetAllScores.addEventListener("click", resetAllScores);
    }

    const btnDownloadJson = document.getElementById("btn-download-json-template");
    if (btnDownloadJson) {
      btnDownloadJson.addEventListener("click", downloadJSONTemplate);
    }

    const btnDownloadCsv = document.getElementById("btn-download-csv-template");
    if (btnDownloadCsv) {
      btnDownloadCsv.addEventListener("click", downloadCSVTemplate);
    }

    // Multiplication Game Bindings
    // 1. Landing card action
    const btnStartMult = document.getElementById("btn-start-multiplication-game");
    if (btnStartMult) {
      btnStartMult.addEventListener("click", () => {
        document.getElementById("games-landing-view").style.display = "none";
        document.getElementById("games-multiplication-view").style.display = "block";
        switchMultSubTab("play");
      });
    }

    const btnBackToGamesFromMult = document.getElementById("btn-back-to-games-from-mult");
    if (btnBackToGamesFromMult) {
      btnBackToGamesFromMult.addEventListener("click", () => {
        // Warning on incomplete round
        const currentList = multSelectedStudentNames;
        const isRoundIncomplete = multUnselectedStudents.length > 0 && multUnselectedStudents.length < currentList.length;
        if (isRoundIncomplete) {
          if (!confirm("Tur tamamlanmadı! Bazı öğrenciler diğerlerinden daha fazla soru cevapladı. Çıkmak istediğinize emin misiniz?")) {
            return;
          }
        } else if (multActiveStudent && multTimeLeft > 0) {
          if (!confirm("Devam eden bir oyun var. Çıkmak istediğinize emin misiniz?")) {
            return;
          }
        }
        clearMultTimer();
        multActiveStudent = "";
        document.getElementById("games-multiplication-view").style.display = "none";
        document.getElementById("games-landing-view").style.display = "block";
        window.safeCreateIcons();
      });
    }

    // 2. Sub-tab navigation
    const multNavButtons = {
      play: document.getElementById("game-mult-nav-play"),
      leaderboard: document.getElementById("game-mult-nav-leaderboard")
    };

    for (let key in multNavButtons) {
      if (multNavButtons[key]) {
        multNavButtons[key].addEventListener("click", () => {
          switchMultSubTab(key);
        });
      }
    }

    // 3. Numbers selection buttons
    const numButtons = document.querySelectorAll("#mult-setup-numbers .btn-mult-num");
    numButtons.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const val = btn.getAttribute("data-val");
        if (val === "all") {
          multSelectedNumber = "all";
        } else {
          let selectedVals = multSelectedNumber === "all" ? [] : multSelectedNumber.split(",");
          if (selectedVals.includes(val)) {
            selectedVals = selectedVals.filter(v => v !== val);
          } else {
            selectedVals.push(val);
          }
          if (selectedVals.length === 0) {
            multSelectedNumber = "all";
          } else {
            multSelectedNumber = selectedVals.join(",");
          }
        }
        syncMultSetupUI();
        saveMultGlobalProgress();
      });
    });

    // 4. Start Game Button
    const btnMultStart = document.getElementById("btn-mult-start-game");
    if (btnMultStart) {
      btnMultStart.addEventListener("click", startMultGame);
    }

    // 5. Select Student Button
    const btnMultSelectStudent = document.getElementById("btn-mult-select-student");
    if (btnMultSelectStudent) {
      btnMultSelectStudent.addEventListener("click", selectRandomMultStudent);
    }

    // 6. Sound Toggle
    const btnMultSoundToggle = document.getElementById("btn-mult-sound-toggle");
    if (btnMultSoundToggle) {
      btnMultSoundToggle.addEventListener("click", toggleMultSound);
    }

    const btnMultFullscreenToggle = document.getElementById("btn-mult-fullscreen-toggle");
    if (btnMultFullscreenToggle) {
      btnMultFullscreenToggle.addEventListener("click", toggleFullscreenGame);
    }

    // Document fullscreen state change listeners
    document.addEventListener("fullscreenchange", syncFullscreenUI);
    document.addEventListener("webkitfullscreenchange", syncFullscreenUI);
    document.addEventListener("mozfullscreenchange", syncFullscreenUI);
    document.addEventListener("MSFullscreenChange", syncFullscreenUI);

    // 7. Active game controllers
    const btnMultExitGame = document.getElementById("btn-mult-exit-game");
    if (btnMultExitGame) {
      btnMultExitGame.addEventListener("click", () => {
        const currentList = multSelectedStudentNames;
        const isRoundIncomplete = multUnselectedStudents.length > 0 && multUnselectedStudents.length < currentList.length;
        if (isRoundIncomplete) {
          if (!confirm("Tur tamamlanmadı! Bazı öğrenciler diğerlerinden daha fazla soru cevapladı. Kuruluma dönmek istediğinize emin misiniz?")) {
            return;
          }
        } else if (multActiveStudent && multTimeLeft > 0) {
          if (!confirm("Devam eden bir oyun var. Kuruluma dönmek istediğinize emin misiniz?")) {
            return;
          }
        }
        clearMultTimer();
        document.getElementById("mult-setup-container").style.display = "block";
        document.getElementById("mult-active-layout").style.display = "none";
        resetMultRaffleUI();
      });
    }

    const btnMultSkip = document.getElementById("btn-mult-skip");
    if (btnMultSkip) {
      btnMultSkip.addEventListener("click", skipMultQuestion);
    }

    const btnMultRestart = document.getElementById("btn-mult-restart");
    if (btnMultRestart) {
      btnMultRestart.addEventListener("click", restartMultQuiz);
    }

    // 8. Close Overlays
    const btnMultCloseFeedback = document.getElementById("btn-mult-close-feedback");
    if (btnMultCloseFeedback) {
      btnMultCloseFeedback.addEventListener("click", closeMultFeedback);
    }

    const btnMultGameOverRestart = document.getElementById("btn-mult-game-over-restart");
    if (btnMultGameOverRestart) {
      btnMultGameOverRestart.addEventListener("click", () => {
        document.getElementById("mult-game-over-overlay").style.display = "none";
        restartMultQuizGame();
      });
    }

    const btnMultGameOverExit = document.getElementById("btn-mult-game-over-exit");
    if (btnMultGameOverExit) {
      btnMultGameOverExit.addEventListener("click", () => {
        document.getElementById("mult-game-over-overlay").style.display = "none";
        document.getElementById("mult-setup-container").style.display = "block";
        document.getElementById("mult-active-layout").style.display = "none";
        resetMultRaffleUI();
      });
    }

    const btnMultCloseRound = document.getElementById("btn-mult-close-round-overlay");
    if (btnMultCloseRound) {
      btnMultCloseRound.addEventListener("click", closeMultRoundOverlay);
    }

    // 9. Reset Scores
    const btnMultResetAllScores = document.getElementById("btn-mult-reset-all-scores");
    if (btnMultResetAllScores) {
      btnMultResetAllScores.addEventListener("click", resetMultAllScores);
    }

    // Bind Select All / Deselect All student selection buttons
    const btnQuizSelectAll = document.getElementById("btn-quiz-select-all-students");
    if (btnQuizSelectAll) {
      btnQuizSelectAll.addEventListener("click", () => {
        const state = stateManager.loadState();
        const selectBranch = document.getElementById('quiz-select-branch');
        const branchFilter = selectBranch ? selectBranch.value : 'all';
        let activeStudents = state.students || [];
        if (window.LicenseConfig && window.LicenseConfig.isDemo) {
          activeStudents = activeStudents.slice(0, window.LicenseConfig.studentLimit);
        }
        const filteredStudents = activeStudents.filter(student => {
          return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
        });
        const currentNames = filteredStudents.map(s => `${s.name} ${s.surname}`.trim());
        
        currentNames.forEach(name => {
          if (!quizSelectedStudentNames.includes(name)) {
            quizSelectedStudentNames.push(name);
          }
        });
        saveSelectedQuizStudents();
        renderQuizStudentSelection();
      });
    }
    
    const btnQuizDeselectAll = document.getElementById("btn-quiz-deselect-all-students");
    if (btnQuizDeselectAll) {
      btnQuizDeselectAll.addEventListener("click", () => {
        const state = stateManager.loadState();
        const selectBranch = document.getElementById('quiz-select-branch');
        const branchFilter = selectBranch ? selectBranch.value : 'all';
        let activeStudents = state.students || [];
        if (window.LicenseConfig && window.LicenseConfig.isDemo) {
          activeStudents = activeStudents.slice(0, window.LicenseConfig.studentLimit);
        }
        const filteredStudents = activeStudents.filter(student => {
          return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
        });
        const currentNames = filteredStudents.map(s => `${s.name} ${s.surname}`.trim());

        quizSelectedStudentNames = quizSelectedStudentNames.filter(name => !currentNames.includes(name));
        saveSelectedQuizStudents();
        renderQuizStudentSelection();
      });
    }

    const btnMultSelectAllBtn = document.getElementById("btn-mult-select-all-students");
    if (btnMultSelectAllBtn) {
      btnMultSelectAllBtn.addEventListener("click", () => {
        const state = stateManager.loadState();
        const selectBranch = document.getElementById('mult-select-branch');
        const branchFilter = selectBranch ? selectBranch.value : 'all';
        let activeStudents = state.students || [];
        if (window.LicenseConfig && window.LicenseConfig.isDemo) {
          activeStudents = activeStudents.slice(0, window.LicenseConfig.studentLimit);
        }
        const filteredStudents = activeStudents.filter(student => {
          return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
        });
        const currentNames = filteredStudents.map(s => `${s.name} ${s.surname}`.trim());
        
        currentNames.forEach(name => {
          if (!multSelectedStudentNames.includes(name)) {
            multSelectedStudentNames.push(name);
          }
        });
        saveSelectedMultStudents();
        renderMultStudentSelection();
      });
    }
    
    const btnMultDeselectAllBtn = document.getElementById("btn-mult-deselect-all-students");
    if (btnMultDeselectAllBtn) {
      btnMultDeselectAllBtn.addEventListener("click", () => {
        const state = stateManager.loadState();
        const selectBranch = document.getElementById('mult-select-branch');
        const branchFilter = selectBranch ? selectBranch.value : 'all';
        let activeStudents = state.students || [];
        if (window.LicenseConfig && window.LicenseConfig.isDemo) {
          activeStudents = activeStudents.slice(0, window.LicenseConfig.studentLimit);
        }
        const filteredStudents = activeStudents.filter(student => {
          return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
        });
        const currentNames = filteredStudents.map(s => `${s.name} ${s.surname}`.trim());

        multSelectedStudentNames = multSelectedStudentNames.filter(name => !currentNames.includes(name));
        saveSelectedMultStudents();
        renderMultStudentSelection();
      });
    }

    // Set Drag and Drop for Boşluk Doldurma
    setupDragAndDrop();

    // Export functions globally to be called from dynamically loaded rows
    window.editQuestion = editQuestion;
    window.deleteQuestion = deleteQuestion;
  }

  function renderGames() {
    loadData();
    populateCategorySelectors();
    initSettings();
    resetRaffleUI();
    renderQuestionLibrary();
    renderLeaderboard();

    // Multiplication Game init/render
    loadMultData();
    syncMultSetupUI();
    resetMultRaffleUI();
    renderMultLeaderboard();
    
    // Set Student Source count badge
    const currentList = getQuizStudents();
    const studentBadge = document.getElementById("quiz-student-count-badge");
    if (studentBadge) {
      studentBadge.textContent = `Sınıf Öğrencisi: ${currentList.length}`;
    }

    renderQuizStudentSelection();
    renderMultStudentSelection();
  }

  function switchQuizSubTab(tabName) {
    document.querySelectorAll(".quiz-tab-content").forEach(el => el.style.display = "none");
    document.querySelectorAll("#games .sub-tab-menu .sub-tab-btn").forEach(el => el.classList.remove("active"));

    const btn = document.getElementById(`game-quiz-nav-${tabName}`);
    if (btn) btn.classList.add("active");

    const content = document.getElementById(`game-quiz-tab-${tabName}`);
    if (content) content.style.display = "block";

    if (tabName === "play") {
      if (activeGameQuestions.length > 0) {
        document.getElementById("game-setup-container").style.display = "none";
        document.getElementById("game-active-layout").style.display = "grid";
        renderPlayZoneQuestion();
      } else {
        document.getElementById("game-setup-container").style.display = "block";
        document.getElementById("game-active-layout").style.display = "none";
        resetRaffleUI();
      }
    } else if (tabName === "admin") {
      renderQuestionLibrary();
      // Set Student Source count badge
      const currentList = getQuizStudents();
      const studentBadge = document.getElementById("quiz-student-count-badge");
      if (studentBadge) {
        studentBadge.textContent = `Sınıf Öğrencisi: ${currentList.length}`;
      }
    } else if (tabName === "leaderboard") {
      renderLeaderboard();
    }
    window.safeCreateIcons();
  }

  function populateCategorySelectors() {
    const categories = [...new Set(questions.map(q => q.category || "Genel"))].sort();
    
    // 1. Setup Screen Select box
    const setupSelect = document.getElementById("setup-category");
    if (setupSelect) {
      const currentVal = setupSelect.value || "all";
      setupSelect.innerHTML = `<option value="all">Tüm Kategoriler</option>`;
      categories.forEach(cat => {
        setupSelect.innerHTML += `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`;
      });
      setupSelect.value = currentVal;
    }
    
    // 2. Library list category filter
    const libSelect = document.getElementById("library-category-filter");
    if (libSelect) {
      const currentVal = libSelect.value || "all";
      libSelect.innerHTML = `<option value="all">Tüm Kategoriler</option>`;
      categories.forEach(cat => {
        libSelect.innerHTML += `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`;
      });
      libSelect.value = currentVal;
    }
    
    // 3. Form datalist suggestions
    const datalist = document.getElementById("category-list");
    if (datalist) {
      datalist.innerHTML = "";
      categories.forEach(cat => {
        datalist.innerHTML += `<option value="${escapeHTML(cat)}">`;
      });
    }
  }

  function startQuizGame() {
    const currentList = quizSelectedStudentNames;
    if (currentList.length === 0) {
      alert("Lütfen önce yarışmaya katılacak en az bir öğrenci seçin!");
      return;
    }

    const selectedCat = document.getElementById("setup-category").value;
    
    activeGameMode = setupSelectedMode;
    activeCategory = selectedCat;
    
    activeGameQuestions = questions.filter(q => {
      const modeMatch = (q.type || "tf") === activeGameMode;
      const catMatch = (selectedCat === "all") || (q.category === selectedCat);
      return modeMatch && catMatch;
    });
    
    if (activeGameQuestions.length === 0) {
      alert("Seçilen mod ve kategoride soru bulunmamaktadır! Lütfen yönetim panelinden soru ekleyin veya başka bir kategori seçin.");
      return;
    }

    // Pad activeGameQuestions to be a multiple of currentList.length to guarantee fair turns
    const studentCount = currentList.length;
    if (studentCount > 0 && activeGameQuestions.length > 0) {
      const remainder = activeGameQuestions.length % studentCount;
      if (remainder !== 0) {
        const padCount = studentCount - remainder;
        const originalLength = activeGameQuestions.length;
        for (let i = 0; i < padCount; i++) {
          activeGameQuestions.push(activeGameQuestions[i % originalLength]);
        }
      }
    }
    
    // Transition UI
    document.getElementById("game-setup-container").style.display = "none";
    document.getElementById("game-active-layout").style.display = "grid";
    
    // Update active mode badge
    const modeBadge = document.getElementById("game-active-mode-badge");
    if (modeBadge) {
      if (activeGameMode === "tf") {
        modeBadge.textContent = "Doğru / Yanlış";
        modeBadge.style.background = "rgba(79, 70, 229, 0.15)";
        modeBadge.style.color = "#818cf8";
        modeBadge.style.borderColor = "rgba(79, 70, 229, 0.3)";
      } else if (activeGameMode === "mc") {
        modeBadge.textContent = "Çoktan Seçmeli";
        modeBadge.style.background = "rgba(16, 185, 129, 0.15)";
        modeBadge.style.color = "#34d399";
        modeBadge.style.borderColor = "rgba(16, 185, 129, 0.3)";
      } else if (activeGameMode === "fib") {
        modeBadge.textContent = "Boşluk Doldurma";
        modeBadge.style.background = "rgba(245, 158, 11, 0.15)";
        modeBadge.style.color = "#f59e0b";
        modeBadge.style.borderColor = "rgba(245, 158, 11, 0.3)";
      }
    }
    
    currentQuestionIndex = 0;
    currentRoundNumber = 1;
    isLastInRound = false;
    resetRaffleUI();
    renderPlayZoneQuestion();
    window.safeCreateIcons();
  }

  function resetRaffleUI() {
    activeStudent = "";
    const nameActiveDisplay = document.getElementById("student-name-active");
    if (nameActiveDisplay) {
      nameActiveDisplay.textContent = "Öğrenci Seçilmedi";
      nameActiveDisplay.className = "student-name-active";
    }
    toggleAnswerControls(false);
    resetTimerUI();
    renderTopFive();
  }

  function toggleAnswerControls(enabled) {
    const container = document.getElementById("dynamic-answers-container");
    if (container) {
      const buttons = container.querySelectorAll("button");
      buttons.forEach(btn => btn.disabled = !enabled);
      
      const dragOptions = container.querySelectorAll(".fib-draggable-option");
      dragOptions.forEach(opt => {
        if (enabled) {
          opt.classList.remove("disabled");
          opt.setAttribute("draggable", "true");
        } else {
          opt.classList.add("disabled");
          opt.setAttribute("draggable", "false");
        }
      });
    }
    
    const skipBtn = document.getElementById("btn-skip");
    if (skipBtn) skipBtn.disabled = !enabled;
  }

  function resetTimerUI() {
    clearQuizTimer();
    const timerBar = document.getElementById("timer-bar");
    const timerText = document.getElementById("timer-text");
    if (timerText) {
      timerText.textContent = "--";
      timerText.classList.remove("timer-warning");
    }
    if (timerBar) {
      timerBar.style.strokeDashoffset = "0";
      timerBar.style.stroke = "var(--primary)";
    }
  }

  function renderTopFive() {
    const listContainer = document.getElementById("top-students-list");
    if (listContainer) {
      listContainer.innerHTML = "";
      
      const list = [];
      const currentList = getQuizStudents();
      currentList.forEach(name => {
        const student = studentScores[name] || { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
        let avgTime = 0;
        if (student.correctCount > 0) {
          avgTime = parseFloat((student.totalTime / student.correctCount).toFixed(1));
        }
        list.push({
          name: name,
          score: student.score || 0,
          correctCount: student.correctCount || 0,
          incorrectCount: student.incorrectCount || 0,
          turnCount: student.turnCount || 0,
          avgTime: avgTime
        });
      });
      
      // Sort: Score desc, correctCount desc, avgTime asc
      list.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (a.correctCount === 0 && b.correctCount > 0) return 1;
        if (b.correctCount === 0 && a.correctCount > 0) return -1;
        return a.avgTime - b.avgTime;
      });
      
      const topFive = list.slice(0, 5);
      
      if (topFive.length === 0) {
        listContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 15px 0; font-size: 0.85rem;">Skor kaydı bulunmuyor.</div>`;
      } else {
        topFive.forEach((item, index) => {
          let rankBadge = "";
          if (index === 0) rankBadge = "🏆";
          else if (index === 1) rankBadge = "🥈";
          else if (index === 2) rankBadge = "🥉";
          else rankBadge = `<span class="rank-badge" style="background: rgba(0, 0, 0, 0.05); width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 11px; font-weight: bold; color: var(--text-secondary);">${index + 1}</span>`;
          
          listContainer.innerHTML += `
            <div class="top-student-item">
              <div class="top-student-rank">${rankBadge}</div>
              <div class="top-student-info">
                <span class="top-student-name" title="${escapeHTML(item.name)}">${escapeHTML(item.name)}</span>
                <span class="top-student-stats-detail">
                  <span class="correct">✔️ ${item.correctCount} D</span>
                  <span class="incorrect">❌ ${item.incorrectCount} Y</span>
                  <span class="turns" style="color: var(--primary); margin-left: 5px;">🔄 ${item.turnCount} Soru</span>
                </span>
              </div>
              <span class="top-student-score-badge">${item.score} Puan</span>
            </div>
          `;
        });
      }
    }
    
    const scoreBox = document.getElementById("student-score-box");
    if (scoreBox) {
      if (activeStudent) {
        scoreBox.style.display = "flex";
        document.getElementById("active-student-score-label").textContent = `${activeStudent} Puanı:`;
        const studentObj = studentScores[activeStudent] || { score: 0 };
        document.getElementById("active-student-score-value").textContent = studentObj.score || 0;
      } else {
        scoreBox.style.display = "none";
      }
    }
  }

  function selectRandomStudent() {
    const currentList = quizSelectedStudentNames;
    if (currentList.length === 0) {
      alert("Lütfen önce yarışmaya katılacak en az bir öğrenci seçin!");
      return;
    }
    
    SoundFX.init();
    
    const selectBtn = document.getElementById("btn-select-student");
    const nameActiveDisplay = document.getElementById("student-name-active");
    
    // Disable interface during selection animation
    selectBtn.disabled = true;
    nameActiveDisplay.className = "student-name-active";
    nameActiveDisplay.textContent = "Seçiliyor...";
    
    toggleAnswerControls(false);
    
    let duration = 1500; // total duration of spin
    let intervalTime = 60; // time between steps
    let steps = duration / intervalTime;
    let currentStep = 0;
    
    const raffleInterval = setInterval(() => {
      currentStep++;
      const tempIndex = Math.floor(Math.random() * currentList.length);
      nameActiveDisplay.textContent = currentList[tempIndex];
      
      SoundFX.playRaffleTick();
      
      if (currentStep >= steps - 6) {
        clearInterval(raffleInterval);
        slowRaffleRoll(6, nameActiveDisplay, selectBtn);
      }
    }, intervalTime);
  }

  function slowRaffleRoll(remainingSteps, displayEl, btnEl) {
    let delay = 100;
    const currentList = quizSelectedStudentNames;
    
    function nextStep(stepsLeft) {
      if (stepsLeft === 0) {
        finalizeRaffle(displayEl, btnEl);
        return;
      }
      
      const tempIndex = Math.floor(Math.random() * currentList.length);
      displayEl.textContent = currentList[tempIndex];
      SoundFX.playRaffleTick();
      
      delay = delay * 1.35;
      setTimeout(() => {
        nextStep(stepsLeft - 1);
      }, delay);
    }
    
    nextStep(remainingSteps);
  }

  function finalizeRaffle(displayEl, btnEl) {
    const currentList = quizSelectedStudentNames;
    if (unselectedStudents.length === 0) {
      unselectedStudents = [...currentList];
    }
    
    const randomIndex = Math.floor(Math.random() * unselectedStudents.length);
    activeStudent = unselectedStudents[randomIndex];
    
    unselectedStudents.splice(randomIndex, 1);
    saveUnselectedStudents();
    
    if (unselectedStudents.length === 0) {
      isLastInRound = true;
    }
    
    displayEl.textContent = activeStudent;
    displayEl.className = "student-name-active selected";
    
    SoundFX.playRaffleWin();
    
    btnEl.disabled = false;
    
    if (studentScores[activeStudent] === undefined || typeof studentScores[activeStudent] !== 'object') {
      studentScores[activeStudent] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
    }
    
    studentScores[activeStudent].turnCount = (studentScores[activeStudent].turnCount || 0) + 1;
    saveStudentScores();
    
    renderTopFive();
    
    if (activeGameQuestions.length === 0) {
      document.getElementById("question-text").textContent = "Lütfen kütüphaneye soru ekleyin.";
      return;
    }
    
    toggleAnswerControls(true);
    renderPlayZoneQuestion();
    startTimer();
  }

  function renderPlayZoneQuestion() {
    const questionPool = activeGameQuestions;
    if (questionPool.length === 0) {
      document.getElementById("question-text").textContent = "Kütüphanede soru bulunmamaktadır. Lütfen yönetim panelinden soru yükleyin.";
      document.getElementById("question-index").textContent = "Soru: 0 / 0";
      renderDynamicAnswerButtons(null);
      return;
    }
    
    if (currentQuestionIndex >= questionPool.length) {
      currentQuestionIndex = 0;
      saveGlobalProgress();
    }
    
    const question = questionPool[currentQuestionIndex];
    document.getElementById("question-index").textContent = `Soru: ${currentQuestionIndex + 1} / ${questionPool.length}`;

    // Handle question text based on type (for FIB render drop slot)
    const textContainer = document.getElementById("question-text");
    if (question.type === "fib") {
      const parts = question.text.split("[___]");
      if (parts.length > 1) {
        textContainer.innerHTML = "";
        const leftSpan = document.createElement("span");
        leftSpan.textContent = parts[0];
        textContainer.appendChild(leftSpan);
        
        const blankSlot = document.createElement("span");
        blankSlot.className = "fib-blank-slot";
        blankSlot.id = "fib-blank-slot";
        blankSlot.textContent = "........";
        
        blankSlot.addEventListener("dragover", dragOver);
        blankSlot.addEventListener("dragenter", dragEnter);
        blankSlot.addEventListener("dragleave", dragLeave);
        blankSlot.addEventListener("drop", dragDrop);
        
        textContainer.appendChild(blankSlot);
        
        const rightSpan = document.createElement("span");
        rightSpan.textContent = parts[1];
        textContainer.appendChild(rightSpan);
      } else {
        textContainer.innerHTML = "";
        const leftSpan = document.createElement("span");
        leftSpan.textContent = question.text + " ";
        textContainer.appendChild(leftSpan);
        
        const blankSlot = document.createElement("span");
        blankSlot.className = "fib-blank-slot";
        blankSlot.id = "fib-blank-slot";
        blankSlot.textContent = "........";
        
        blankSlot.addEventListener("dragover", dragOver);
        blankSlot.addEventListener("dragenter", dragEnter);
        blankSlot.addEventListener("dragleave", dragLeave);
        blankSlot.addEventListener("drop", dragDrop);
        
        textContainer.appendChild(blankSlot);
      }
    } else {
      textContainer.textContent = question.text;
    }

    // Handle Question Image
    const imgContainer = document.getElementById("question-image-container");
    const imgEl = document.getElementById("question-img");
    if (question.image && question.image.trim().length > 0) {
      imgEl.src = question.image;
      imgContainer.style.display = "block";
    } else {
      imgEl.src = "";
      imgContainer.style.display = "none";
    }
    
    renderDynamicAnswerButtons(question);
  }

  function renderDynamicAnswerButtons(question) {
    const container = document.getElementById("dynamic-answers-container");
    container.innerHTML = "";
    if (!question) return;
    
    if (question.type === "tf" || !question.type) {
      container.innerHTML = `
        <button id="btn-true" class="btn-answer btn-answer-true" disabled>
          <div class="btn-answer-icon">✔️</div>
          <span>DOĞRU</span>
        </button>
        
        <button id="btn-false" class="btn-answer btn-answer-false" disabled>
          <div class="btn-answer-icon">❌</div>
          <span>YANLIŞ</span>
        </button>
      `;
      
      document.getElementById("btn-true").addEventListener("click", () => submitAnswer(true));
      document.getElementById("btn-false").addEventListener("click", () => submitAnswer(false));
    } else if (question.type === "mc") {
      const letters = ["A", "B", "C", "D", "E"];
      const opts = question.options || [];
      opts.forEach((opt, idx) => {
        const btnId = `btn-mc-${idx}`;
        container.innerHTML += `
          <button id="${btnId}" class="btn-answer btn-answer-mc" disabled>
            <div class="btn-answer-icon">${letters[idx]}</div>
            <span>${escapeHTML(opt)}</span>
          </button>
        `;
      });
      // Attach listeners after adding to DOM
      opts.forEach((opt, idx) => {
        document.getElementById(`btn-mc-${idx}`).addEventListener("click", () => submitAnswer(idx));
      });
    } else if (question.type === "fib") {
      const opts = question.options || [];
      const isDraggable = !!activeStudent;
      const disabledClass = isDraggable ? "" : "disabled";
      const dragAttr = isDraggable ? 'draggable="true"' : 'draggable="false"';
      opts.forEach((opt, idx) => {
        container.innerHTML += `
          <div class="fib-draggable-option ${disabledClass}" id="fib-opt-${idx}" ${dragAttr}>
            <span>${escapeHTML(opt)}</span>
          </div>
        `;
      });
      // Attach events after adding to DOM
      opts.forEach((opt, idx) => {
        const el = document.getElementById(`fib-opt-${idx}`);
        if (el) {
          el.addEventListener("dragstart", (e) => dragStart(e, idx));
          el.addEventListener("dragend", dragEnd);
          el.addEventListener("click", () => clickOption(idx));
        }
      });
    }
    
    toggleAnswerControls(!!activeStudent);
  }

  // Timer helpers
  function clearQuizTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (tickTimeout) {
      clearTimeout(tickTimeout);
      tickTimeout = null;
    }
  }

  function scheduleNextTick() {
    if (tickTimeout) clearTimeout(tickTimeout);
    
    SoundFX.playClockTick();
    
    const totalSec = settings.timerSeconds || 15;
    const ratio = Math.max(0, Math.min(1, timeLeft / totalSec));
    
    const minInterval = 250;
    const maxInterval = 1000;
    const nextInterval = minInterval + (maxInterval - minInterval) * ratio;
    
    tickTimeout = setTimeout(() => {
      if (timeLeft > 0 && timerInterval) {
        scheduleNextTick();
      }
    }, nextInterval);
  }

  // Timer
  function startTimer() {
    clearQuizTimer();
    timeLeft = settings.timerSeconds;
    
    const timerBar = document.getElementById("timer-bar");
    const timerText = document.getElementById("timer-text");
    if (timerText) {
      timerText.classList.remove("timer-warning");
      timerText.textContent = timeLeft;
    }
    
    if (timerBar) {
      timerBar.style.strokeDashoffset = "0";
      timerBar.style.stroke = "var(--primary)";
    }
    
    SoundFX.playGong();
    scheduleNextTick();
    
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timerText) timerText.textContent = timeLeft;
      
      const percentage = timeLeft / settings.timerSeconds;
      const offset = 283 - (283 * percentage);
      if (timerBar) timerBar.style.strokeDashoffset = offset;
      
      if (timeLeft <= 3 && timeLeft > 0) {
        if (timerText) timerText.classList.add("timer-warning");
        if (timerBar) timerBar.style.stroke = "var(--danger)";
      }
      
      if (timeLeft <= 0) {
        clearQuizTimer();
        handleTimeExpiry();
      }
    }, 1000);
  }

  function handleTimeExpiry() {
    toggleAnswerControls(false);
    SoundFX.playExpire();
    
    const currentQuestion = activeGameQuestions[currentQuestionIndex];
    let correctValStr = "";
    
    if (currentQuestion.type === "tf" || !currentQuestion.type) {
      correctValStr = currentQuestion.answer ? "DOĞRU" : "YANLIŞ";
    } else if (currentQuestion.type === "mc" || currentQuestion.type === "fib") {
      const letters = ["A", "B", "C", "D", "E"];
      const correctIdx = parseInt(currentQuestion.answer);
      const correctValOpt = currentQuestion.options[correctIdx] || "";
      correctValStr = currentQuestion.type === "mc" ? `${letters[correctIdx]}) ${correctValOpt}` : correctValOpt;
    }
    
    showFeedback(
      false, 
      "Süre Doldu!", 
      `Cevap verme süresi tükendi. Doğru cevap: <strong>${correctValStr}</strong> olmalıydı.`,
      currentQuestion.explanation,
      true
    );
    
    if (activeStudent) {
      if (studentScores[activeStudent] === undefined || typeof studentScores[activeStudent] !== 'object') {
        studentScores[activeStudent] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
      }
      studentScores[activeStudent].incorrectCount = (studentScores[activeStudent].incorrectCount || 0) + 1;
      saveStudentScores();
    }
    
    stats.incorrect++;
    currentQuestionIndex++;
    saveGlobalProgress();
    renderTopFive();
  }

  function submitAnswer(studentAnswer) {
    clearQuizTimer();
    toggleAnswerControls(false);
    
    const currentQuestion = activeGameQuestions[currentQuestionIndex];
    let isCorrect = false;
    let correctValStr = "";
    
    if (currentQuestion.type === "tf" || !currentQuestion.type) {
      isCorrect = (studentAnswer === currentQuestion.answer);
      correctValStr = currentQuestion.answer ? "DOĞRU" : "YANLIŞ";
    } else if (currentQuestion.type === "mc" || currentQuestion.type === "fib") {
      isCorrect = (parseInt(studentAnswer) === parseInt(currentQuestion.answer));
      const letters = ["A", "B", "C", "D", "E"];
      const correctIdx = parseInt(currentQuestion.answer);
      const correctValOpt = currentQuestion.options[correctIdx] || "";
      correctValStr = currentQuestion.type === "mc" ? `${letters[correctIdx]}) ${correctValOpt}` : correctValOpt;
    }
    
    const gameCard = document.querySelector("#games .game-card");
    const secondsTaken = settings.timerSeconds - timeLeft;
    
    if (isCorrect) {
      SoundFX.playCorrect();
      
      if (gameCard) {
        gameCard.classList.add("pulse-green");
        setTimeout(() => gameCard.classList.remove("pulse-green"), 500);
      }
      
      const pointsEarned = 10 + timeLeft;
      totalScore += pointsEarned;
      
      if (studentScores[activeStudent] === undefined || typeof studentScores[activeStudent] !== 'object') {
        studentScores[activeStudent] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
      }
      
      studentScores[activeStudent].score += pointsEarned;
      studentScores[activeStudent].correctCount += 1;
      studentScores[activeStudent].totalTime += secondsTaken;
      
      stats.correct++;
      
      showFeedback(
        true, 
        "Harika, Doğru Cevap!", 
        `<strong>${activeStudent}</strong> doğru yanıtlayarak <strong>+${pointsEarned} Puan</strong> (10 Taban + ${timeLeft} Hız Bonusu) kazandı!`,
        currentQuestion.explanation
      );
    } else {
      SoundFX.playIncorrect();
      
      if (gameCard) {
        gameCard.classList.add("shake");
        setTimeout(() => gameCard.classList.remove("shake"), 500);
      }
      
      stats.incorrect++;
      
      if (studentScores[activeStudent] === undefined || typeof studentScores[activeStudent] !== 'object') {
        studentScores[activeStudent] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
      }
      studentScores[activeStudent].incorrectCount = (studentScores[activeStudent].incorrectCount || 0) + 1;
      
      showFeedback(
        false, 
        "Yanlış Cevap!", 
        `<strong>${activeStudent}</strong> yanlış cevap verdi. Doğru cevap: <strong>${correctValStr}</strong> olmalıydı.`,
        currentQuestion.explanation
      );
    }
    
    currentQuestionIndex++;
    
    saveStudentScores();
    saveGlobalProgress();
    renderTopFive();
  }

  function skipQuestion() {
    clearQuizTimer();
    toggleAnswerControls(false);
    
    stats.skipped++;
    currentQuestionIndex++;
    
    saveGlobalProgress();
    renderTopFive();
    
    if (currentQuestionIndex >= activeGameQuestions.length) {
      showGameOver();
    } else if (isLastInRound) {
      showRoundCompleted();
    } else {
      resetRaffleUI();
      renderPlayZoneQuestion();
      if (toastCallback) toastCallback("Soru pas geçildi. Sıradaki öğrenciyi seçin.", "info");
    }
  }

  function restartQuiz() {
    if (confirm("Tüm puanları ve istatistikleri sıfırlamak istediğinize emin misiniz?")) {
      clearQuizTimer();
      totalScore = 0;
      stats = { correct: 0, incorrect: 0, skipped: 0 };
      currentQuestionIndex = 0;
      
      for (let student in studentScores) {
        studentScores[student] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
      }
      
      const currentList = quizSelectedStudentNames;
      unselectedStudents = [...currentList];
      saveUnselectedStudents();
      
      currentRoundNumber = 1;
      isLastInRound = false;
      
      saveStudentScores();
      saveGlobalProgress();
      resetRaffleUI();
      renderPlayZoneQuestion();
    }
  }

  // Feedback overlays
  function showFeedback(isCorrect, title, message, explanation, isExpired = false) {
    const overlay = document.getElementById("feedback-overlay");
    const iconEl = document.getElementById("feedback-icon");
    const titleEl = document.getElementById("feedback-title");
    const msgEl = document.getElementById("feedback-message");
    const expEl = document.getElementById("feedback-explanation");
    
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.innerHTML = message;
    
    if (expEl) {
      if (explanation && explanation.trim().length > 0) {
        expEl.innerHTML = `<strong>Açıklama:</strong> ${explanation}`;
        expEl.style.display = "block";
      } else {
        expEl.style.display = "none";
      }
    }
    
    if (iconEl) {
      if (isExpired) {
        iconEl.textContent = "⏰";
        iconEl.className = "feedback-icon incorrect";
      } else if (isCorrect) {
        iconEl.textContent = "✓";
        iconEl.className = "feedback-icon correct";
      } else {
        iconEl.textContent = "✗";
        iconEl.className = "feedback-icon incorrect";
      }
    }
    
    if (overlay) overlay.style.display = "flex";
  }

  function closeFeedback() {
    document.getElementById("feedback-overlay").style.display = "none";
    if (currentQuestionIndex >= activeGameQuestions.length) {
      showGameOver();
    } else if (isLastInRound) {
      showRoundCompleted();
    } else {
      resetRaffleUI();
      renderPlayZoneQuestion();
    }
  }

  function showGameOver() {
    clearQuizTimer();
    SoundFX.playRaffleWin();
    
    const overlay = document.getElementById("game-over-overlay");
    if (!overlay) return;
    
    const currentList = quizSelectedStudentNames;
    const turns = activeGameQuestions.length / currentList.length;
    document.getElementById("game-over-turns-info").textContent = `Tüm öğrenciler eşit sayıda (${turns}) soru yanıtladı.`;
    
    const list = [];
    currentList.forEach(name => {
      const student = studentScores[name] || { score: 0, correctCount: 0, totalTime: 0 };
      let avgTime = 0;
      if (student.correctCount > 0) {
        avgTime = parseFloat((student.totalTime / student.correctCount).toFixed(1));
      }
      list.push({
        name: name,
        score: student.score || 0,
        correctCount: student.correctCount || 0,
        avgTime: avgTime
      });
    });
    
    list.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.correctCount === 0 && b.correctCount > 0) return 1;
      if (b.correctCount === 0 && a.correctCount > 0) return -1;
      return a.avgTime - b.avgTime;
    });
    
    // Podium
    const p1Name = document.getElementById("podium-1-name");
    const p1Score = document.getElementById("podium-1-score");
    const p2Name = document.getElementById("podium-2-name");
    const p2Score = document.getElementById("podium-2-score");
    const p3Name = document.getElementById("podium-3-name");
    const p3Score = document.getElementById("podium-3-score");
    const p2Container = document.getElementById("podium-2");
    const p3Container = document.getElementById("podium-3");
    
    if (list[0]) {
      p1Name.textContent = list[0].name;
      p1Score.textContent = `${list[0].score} Puan`;
    } else {
      p1Name.textContent = "-";
      p1Score.textContent = "0 Puan";
    }
    
    if (list[1]) {
      p2Container.style.visibility = "visible";
      p2Name.textContent = list[1].name;
      p2Score.textContent = `${list[1].score} Puan`;
    } else {
      p2Container.style.visibility = "hidden";
    }
    
    if (list[2]) {
      p3Container.style.visibility = "visible";
      p3Name.textContent = list[2].name;
      p3Score.textContent = `${list[2].score} Puan`;
    } else {
      p3Container.style.visibility = "hidden";
    }
    
    overlay.style.display = "flex";
  }

  function restartQuizGame() {
    totalScore = 0;
    stats = { correct: 0, incorrect: 0, skipped: 0 };
    currentQuestionIndex = 0;
    currentRoundNumber = 1;
    isLastInRound = false;
    
    for (let student in studentScores) {
      studentScores[student] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
    }
    
    const currentList = quizSelectedStudentNames;
    unselectedStudents = [...currentList];
    saveUnselectedStudents();
    
    saveStudentScores();
    saveGlobalProgress();
    resetRaffleUI();
    renderPlayZoneQuestion();
  }

  function showRoundCompleted() {
    SoundFX.playRaffleWin();
    document.getElementById("round-completed-title").textContent = `${currentRoundNumber}. Tur Tamamlandı!`;
    document.getElementById("round-completed-message").textContent = `Tüm öğrenciler ${currentRoundNumber} soru yanıtladı.`;
    document.getElementById("round-completed-overlay").style.display = "flex";
  }

  function closeRoundOverlay() {
    document.getElementById("round-completed-overlay").style.display = "none";
    currentRoundNumber++;
    isLastInRound = false;
    saveGlobalProgress();
    resetRaffleUI();
    renderPlayZoneQuestion();
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundOnIcon = document.getElementById("sound-icon-on");
    const soundOffIcon = document.getElementById("sound-icon-off");
    
    if (soundEnabled) {
      soundOnIcon.style.display = "inline";
      soundOffIcon.style.display = "none";
    } else {
      soundOnIcon.style.display = "none";
      soundOffIcon.style.display = "inline";
    }
  }

  // Drag and drop / Click fallback for FIB
  function dragStart(e, index) {
    if (!activeStudent) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", index);
    e.currentTarget.classList.add("dragging");
  }

  function dragEnd(e) {
    e.currentTarget.classList.remove("dragging");
  }

  function dragOver(e) {
    if (!activeStudent) return;
    e.preventDefault();
  }

  // Events need mapping
  function dragEnter(e) {
    if (!activeStudent) return;
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  }

  function dragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  function dragDrop(e) {
    if (!activeStudent) return;
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    
    const indexStr = e.dataTransfer.getData("text/plain");
    const idx = parseInt(indexStr);
    if (isNaN(idx)) return;
    
    const currentQuestion = activeGameQuestions[currentQuestionIndex];
    const text = currentQuestion.options[idx];
    
    e.currentTarget.textContent = text;
    e.currentTarget.classList.add("filled");
    
    SoundFX.playRaffleTick();
    toggleAnswerControls(false);
    
    setTimeout(() => {
      submitAnswer(idx);
    }, 600);
  }

  function clickOption(idx) {
    if (!activeStudent) return;
    
    const currentQuestion = activeGameQuestions[currentQuestionIndex];
    const text = currentQuestion.options[idx];
    const slot = document.getElementById("fib-blank-slot");
    
    if (slot) {
      slot.textContent = text;
      slot.classList.add("filled");
    }
    
    SoundFX.playRaffleTick();
    toggleAnswerControls(false);
    
    setTimeout(() => {
      submitAnswer(idx);
    }, 600);
  }

  // Setup Drag and drop dropzone handlers
  function setupDragAndDrop() {
    const dropArea = document.getElementById("file-drop-area");
    if (!dropArea) return;
    
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
      }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
      }, false);
    });
    
    dropArea.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        parseFile(files[0]);
      }
    }, false);
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      parseFile(file);
    }
  }

  function parseFile(file) {
    const reader = new FileReader();
    const fileName = file.name.toLowerCase();
    
    reader.onload = function(e) {
      let content = e.target.result;
      
      if (content.startsWith("\uFEFF")) {
        content = content.substring(1);
      }
      
      try {
        if (fileName.endsWith('.json')) {
          importJSON(content);
        } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
          importCSV(content);
        } else {
          alert("Desteklenmeyen dosya formatı! Lütfen .json veya .csv dosyası yükleyin.");
        }
      } catch (err) {
        alert("Dosya yüklenirken hata oluştu: " + err.message);
      }
      
      document.getElementById("file-input").value = "";
    };
    
    reader.readAsText(file, "UTF-8");
  }

  function importJSON(jsonText) {
    const data = JSON.parse(jsonText);
    
    if (!Array.isArray(data)) {
      throw new Error("JSON içeriği bir liste (array) olmalıdır.");
    }
    
    let addedCount = 0;
    let startId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    
    data.forEach(item => {
      if (item.text && item.text.trim().length > 0) {
        const qType = (item.type === "mc" || item.type === "fib") ? item.type : "tf";
        const category = item.category ? item.category.trim() : "Genel";
        
        let ans = false;
        if (qType === "tf") {
          if (typeof item.answer === 'boolean') {
            ans = item.answer;
          } else if (typeof item.answer === 'string') {
            ans = (item.answer.toLowerCase() === 'true' || item.answer === '1' || item.answer.toLowerCase() === 'doğru' || item.answer.toLowerCase() === 'dogru');
          }
        } else {
          ans = parseInt(item.answer);
          if (isNaN(ans)) ans = 0;
        }
        
        const options = Array.isArray(item.options) ? item.options.map(o => o.toString().trim()) : undefined;
        
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
      populateCategorySelectors();
      renderQuestionLibrary();
      if (toastCallback) toastCallback(`${addedCount} adet soru başarıyla yüklendi!`, "success");
    } else {
      alert("Yüklenebilir geçerli soru bulunamadı.");
    }
  }

  function importCSV(csvText) {
    const lines = csvText.split('\n');
    let addedCount = 0;
    let startId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    
    let delimiter = ';';
    if (lines[0] && lines[0].includes(';') === false && lines[0].includes(',')) {
      delimiter = ',';
    }
    
    const cleanCell = cell => {
      if (!cell) return "";
      let c = cell.trim();
      if (c.startsWith('"') && c.endsWith('"')) {
        c = c.substring(1, c.length - 1);
      }
      return c.replace(/""/g, '"');
    };

    lines.forEach((line, index) => {
      if (index === 0 && (line.toLowerCase().includes('soru') || line.toLowerCase().includes('cevap') || line.toLowerCase().includes('tip'))) {
        return;
      }
      
      if (!line.trim()) return;
      
      const parts = line.split(delimiter);
      if (parts.length >= 3) {
        const cleanType = cleanCell(parts[0]).toLowerCase();
        const qType = (cleanType === "mc" || cleanType === "fib") ? cleanType : "tf";
        const category = cleanCell(parts[1]) || "Genel";
        const text = cleanCell(parts[2]);
        const ansStr = cleanCell(parts[3]).toLowerCase();
        const explanation = parts[4] ? cleanCell(parts[4]) : "";
        const imageVal = parts[5] ? cleanCell(parts[5]) : "";
        
        let options = undefined;
        if ((qType === "mc" || qType === "fib") && parts[6]) {
          const rawOpts = cleanCell(parts[6]);
          options = rawOpts.split('|').map(o => o.trim()).filter(o => o.length > 0);
        }
        
        if (text.length > 0) {
          let answer;
          if (qType === "tf") {
            answer = (ansStr === 'true' || ansStr === '1' || ansStr === 'doğru' || ansStr === 'dogru' || ansStr === 'd' || ansStr === 't');
          } else {
            answer = parseInt(ansStr);
            if (isNaN(answer)) answer = 0;
          }
          
          questions.push({
            id: startId++,
            type: qType,
            category: category,
            text: text,
            answer: answer,
            options: options,
            explanation: explanation,
            image: imageVal
          });
          addedCount++;
        }
      }
    });
    
    if (addedCount > 0) {
      saveQuestions();
      populateCategorySelectors();
      renderQuestionLibrary();
      if (toastCallback) toastCallback(`${addedCount} adet soru yüklendi!`, "success");
    } else {
      alert("CSV dosyasından geçerli soru çıkarılamadı.");
    }
  }

  // Question CRUD Operations
  function renderQuestionLibrary() {
    const tbody = document.getElementById("question-list-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    document.getElementById("question-count-badge").textContent = `${questions.length} Soru`;
    
    if (questions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">Kütüphanede henüz soru yok. Hemen ekleyin veya bir dosya yükleyin!</td></tr>`;
      return;
    }
    
    const filterSelect = document.getElementById("library-category-filter");
    const filterCat = filterSelect ? filterSelect.value : "all";
    
    const filteredQuestions = filterCat === "all" 
      ? questions 
      : questions.filter(q => (q.category || "Genel") === filterCat);
        
    if (filteredQuestions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 20px;">Bu kategoride soru bulunamadı.</td></tr>`;
      return;
    }
    
    filteredQuestions.forEach((q) => {
      const tr = document.createElement("tr");
      
      const qType = q.type || "tf";
      const typeBadge = qType === "tf" 
        ? `<span class="badge" style="background: rgba(79, 70, 229, 0.1); color: var(--primary);">D/Y</span>`
        : qType === "mc"
          ? `<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">Ç.S.</span>`
          : `<span class="badge" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">B.D.</span>`;
          
      const categoryBadge = `<span class="badge" style="background: rgba(0,0,0,0.03); color: var(--text-secondary);">${escapeHTML(q.category || 'Genel')}</span>`;
      
      let answerBadge = "";
      if (qType === "tf") {
        answerBadge = q.answer 
          ? `<span class="badge" style="background: var(--success-light); color: var(--success);">Doğru</span>` 
          : `<span class="badge" style="background: var(--danger-light); color: var(--danger);">Yanlış</span>`;
      } else {
        const letters = ["A", "B", "C", "D", "E"];
        const correctOptIdx = parseInt(q.answer);
        const correctOptVal = q.options ? q.options[correctOptIdx] : "";
        answerBadge = `<span class="badge" style="background: var(--success-light); color: var(--success);" title="${escapeHTML(correctOptVal)}">${letters[correctOptIdx]} Seçeneği</span>`;
      }
          
      const imageCell = q.image && q.image.trim().length > 0 
        ? `<img class="table-img-thumbnail" src="${q.image}">` 
        : `<span class="table-img-empty">—</span>`;
          
      tr.innerHTML = `
        <td>#${q.id}</td>
        <td>${typeBadge}</td>
        <td>${categoryBadge}</td>
        <td>${imageCell}</td>
        <td style="font-weight: 500; color: var(--text-primary);">${escapeHTML(q.text)}</td>
        <td>${answerBadge}</td>
        <td style="color: var(--text-secondary); font-style: italic;">${escapeHTML(q.explanation || '-')}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-table-edit" onclick="editQuestion(${q.id})">Düzenle</button>
            <button class="btn-table-delete" onclick="deleteQuestion(${q.id})">Sil</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function toggleFormQuestionType(type) {
    if (type === "tf") {
      document.getElementById("form-tf-container").style.display = "block";
      document.getElementById("form-mc-container").style.display = "none";
    } else if (type === "mc" || type === "fib") {
      document.getElementById("form-tf-container").style.display = "none";
      document.getElementById("form-mc-container").style.display = "block";
      updateFormMcOptions(document.getElementById("mc-option-count").value);
    }
  }

  function updateFormMcOptions(count, selectedIndex = 0, optionsValues = []) {
    const container = document.getElementById("mc-options-inputs-container");
    if (!container) return;
    container.innerHTML = "";
    const letters = ["A", "B", "C", "D", "E"];
    const limit = parseInt(count);
    
    for (let i = 0; i < limit; i++) {
      const val = optionsValues[i] || "";
      const checked = (parseInt(selectedIndex) === i) ? "checked" : "";
      container.innerHTML += `
        <div class="mc-option-row">
          <input type="radio" name="mc-correct-answer" value="${i}" ${checked} required>
          <span class="mc-option-letter">${letters[i]}</span>
          <input type="text" class="form-control mc-option-input" placeholder="${letters[i]} seçeneği metnini girin" value="${escapeHTML(val)}" required>
        </div>
      `;
    }
  }

  function handleQuestionSubmit(e) {
    e.preventDefault();
    
    const idInput = document.getElementById("edit-question-id").value;
    const textInput = document.getElementById("question-input").value.trim();
    const typeInput = document.getElementById("question-type").value;
    const categoryInput = document.getElementById("question-category").value.trim() || "Genel";
    const explanationInput = document.getElementById("explanation-input").value.trim();
    
    let answerInput;
    let optionsInput = [];
    
    if (typeInput === "tf") {
      const checkedRadio = document.querySelector('input[name="question-answer"]:checked');
      answerInput = checkedRadio ? checkedRadio.value === "true" : true;
    } else if (typeInput === "mc" || typeInput === "fib") {
      const selectedRadio = document.querySelector('input[name="mc-correct-answer"]:checked');
      if (!selectedRadio) {
        alert("Lütfen doğru seçeneği işaretleyin!");
        return;
      }
      answerInput = parseInt(selectedRadio.value);
      
      const optionInputs = document.querySelectorAll(".mc-option-input");
      optionInputs.forEach(input => {
        optionsInput.push(input.value.trim());
      });
      
      if (optionsInput.some(opt => opt.length === 0)) {
        alert("Lütfen tüm seçenek alanlarını doldurun!");
        return;
      }
    }
    
    let imageVal = "";
    const previewContainer = document.getElementById("image-preview-container");
    if (previewContainer && previewContainer.style.display !== "none") {
      imageVal = document.getElementById("form-image-preview").src || "";
    }
    
    if (textInput.length === 0) {
      alert("Soru alanı boş bırakılamaz!");
      return;
    }
    
    if (idInput) {
      const qId = parseInt(idInput);
      const qIndex = questions.findIndex(q => q.id === qId);
      if (qIndex > -1) {
        questions[qIndex].text = textInput;
        questions[qIndex].type = typeInput;
        questions[qIndex].category = categoryInput;
        questions[qIndex].answer = answerInput;
        questions[qIndex].options = (typeInput === "mc" || typeInput === "fib") ? optionsInput : undefined;
        questions[qIndex].explanation = explanationInput;
        questions[qIndex].image = imageVal;
        if (toastCallback) toastCallback("Soru başarıyla güncellendi!", "success");
      }
    } else {
      const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
      const newQuestion = {
        id: newId,
        type: typeInput,
        category: categoryInput,
        text: textInput,
        answer: answerInput,
        explanation: explanationInput,
        image: imageVal
      };
      if (typeInput === "mc" || typeInput === "fib") {
        newQuestion.options = optionsInput;
      }
      questions.push(newQuestion);
      if (toastCallback) toastCallback("Yeni soru kütüphaneye eklendi!", "success");
    }
    
    saveQuestions();
    populateCategorySelectors();
    renderQuestionLibrary();
    cancelEdit();
  }

  function editQuestion(id) {
    const question = questions.find(q => q.id === id);
    if (!question) return;
    
    document.getElementById("edit-question-id").value = question.id;
    document.getElementById("question-input").value = question.text;
    document.getElementById("question-category").value = question.category || "Genel";
    document.getElementById("explanation-input").value = question.explanation || "";
    
    const qType = question.type || "tf";
    document.getElementById("question-type").value = qType;
    toggleFormQuestionType(qType);
    
    if (qType === "tf") {
      if (question.answer === true) {
        document.getElementById("answer-true").checked = true;
      } else {
        document.getElementById("answer-false").checked = true;
      }
    } else if (qType === "mc" || qType === "fib") {
      const options = question.options || [];
      document.getElementById("mc-option-count").value = options.length;
      updateFormMcOptions(options.length, question.answer, options);
    }
    
    if (question.image && question.image.trim().length > 0) {
      document.getElementById("form-image-preview").src = question.image;
      document.getElementById("image-preview-container").style.display = "block";
      
      if (question.image.startsWith("http")) {
        document.getElementById("question-image-url").value = question.image;
      } else {
        document.getElementById("question-image-url").value = "";
      }
    } else {
      clearImagePreview();
    }
    
    document.getElementById("form-card-title").textContent = "Soruyu Düzenle";
    document.getElementById("btn-submit-question").textContent = "Güncelleştirmeyi Kaydet";
    document.getElementById("btn-cancel-edit").style.display = "inline-block";
    
    document.getElementById("question-form-card").scrollIntoView({ behavior: 'smooth' });
  }

  function cancelEdit() {
    document.getElementById("edit-question-id").value = "";
    document.getElementById("question-form").reset();
    clearImagePreview();
    
    document.getElementById("question-type").value = "tf";
    toggleFormQuestionType("tf");
    
    document.getElementById("form-card-title").textContent = "Yeni Soru Ekle";
    document.getElementById("btn-submit-question").textContent = "Soruyu Kaydet";
    document.getElementById("btn-cancel-edit").style.display = "none";
  }

  function handleImageUrlInput(url) {
    const cleanUrl = url.trim();
    const previewImg = document.getElementById("form-image-preview");
    const previewContainer = document.getElementById("image-preview-container");
    
    if (cleanUrl.length > 0) {
      previewImg.src = cleanUrl;
      if (previewContainer) previewContainer.style.display = "block";
      document.getElementById("question-image-file").value = "";
    } else {
      clearImagePreview();
    }
  }

  function handleImageFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024 * 1.5) {
      alert("Uyarı: Görsel boyutu 1.5MB'tan büyüktür.");
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Data = e.target.result;
      const previewImg = document.getElementById("form-image-preview");
      const previewContainer = document.getElementById("image-preview-container");
      
      if (previewImg) previewImg.src = base64Data;
      if (previewContainer) previewContainer.style.display = "block";
      document.getElementById("question-image-url").value = "";
    };
    reader.readAsDataURL(file);
  }

  function clearImagePreview() {
    document.getElementById("question-image-url").value = "";
    document.getElementById("question-image-file").value = "";
    const previewImg = document.getElementById("form-image-preview");
    if (previewImg) previewImg.src = "";
    const previewContainer = document.getElementById("image-preview-container");
    if (previewContainer) previewContainer.style.display = "none";
  }

  function deleteQuestion(id) {
    if (confirm("Bu soruyu silmek istediğinize emin misiniz?")) {
      questions = questions.filter(q => q.id !== id);
      saveQuestions();
      populateCategorySelectors();
      renderQuestionLibrary();
      
      const editId = document.getElementById("edit-question-id").value;
      if (editId && parseInt(editId) === id) {
        cancelEdit();
      }
    }
  }

  function deleteAllQuestions() {
    if (confirm("Kütüphanedeki TÜM soruları silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
      questions = [];
      saveQuestions();
      populateCategorySelectors();
      renderQuestionLibrary();
      cancelEdit();
      if (toastCallback) toastCallback("Kütüphanedeki tüm sorular silindi!", "info");
    }
  }

  // Templates
  function downloadJSONTemplate() {
    const template = [
      {
        "type": "tf",
        "category": "Coğrafya",
        "text": "Kanada'nın başkenti Ottawa'dır.",
        "answer": true,
        "explanation": "Doğrudur, Ottawa ülkenin başkentidir. Toronto ise en kalabalık şehridir.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Ottawa_from_above.jpg"
      },
      {
        "type": "mc",
        "category": "Bilim",
        "text": "Hangi gezegen Güneş sistemindeki en büyük gezegendir?",
        "options": ["Mars", "Jüpiter", "Satürn", "Dünya"],
        "answer": 1,
        "explanation": "Jüpiter, Güneş sisteminin en büyük gezegenidir.",
        "image": ""
      },
      {
        "type": "fib",
        "category": "Tarih",
        "text": "İstanbul, [___] yılında Fatih Sultan Mehmet tarafından fethedilmiştir.",
        "options": ["1071", "1453", "1923", "1299"],
        "answer": 1,
        "explanation": "İstanbul, 29 Mayıs 1453 tarihinde fethedilmiştir.",
        "image": ""
      }
    ];
    
    triggerDownload(
      JSON.stringify(template, null, 4),
      "bilgi_yarismasi_soru_sablonu.json",
      "application/json"
    );
  }

  function downloadCSVTemplate() {
    const csvContent = "Soru Tipi (tf/mc/fib);Kategori;Soru Cümlesi;Cevap (Doğru/Yanlış için True/False, Çoktan seçmeli/Boşluk doldurma için Seçenek İndeksi 0'dan başlar);Açıklama;Görsel_URL_veya_Base64;Seçenekler (Çoktan seçmeli/Boşluk doldurma için aralarına | koyarak yazın)\n" +
      "tf;Coğrafya;Kanada'nın başkenti Ottawa'dır.;True;Ottawa ülkenin başkentidir. Toronto ise en kalabalık şehridir.;https://upload.wikimedia.org/wikipedia/commons/e/ec/Ottawa_from_above.jpg;\n" +
      "mc;Bilim;Hangi gezegen Güneş sistemindeki en büyük gezegendir?;1;Jüpiter Güneş sisteminin en büyük gezegenidir.;;Mars|Jüpiter|Satürn|Dünya\n" +
      "fib;Tarih;İstanbul [___] yılında fethedilmiştir.;1;İstanbul 1453 yılında fethedilmiştir.;;1071|1453|1923|1919\n";
        
    const bom = "\uFEFF";
    triggerDownload(
      bom + csvContent,
      "bilgi_yarismasi_soru_sablonu.csv",
      "text/csv;charset=utf-8;"
    );
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

  // Leaderboard rendering
  function renderLeaderboard() {
    const tbody = document.getElementById("leaderboard-list-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const list = [];
    const currentList = getQuizStudents();
    currentList.forEach(name => {
      const student = studentScores[name] || { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0 };
      let avgTime = 0;
      if (student.correctCount > 0) {
        avgTime = parseFloat((student.totalTime / student.correctCount).toFixed(1));
      }
      list.push({
        name: name,
        score: student.score || 0,
        correctCount: student.correctCount || 0,
        incorrectCount: student.incorrectCount || 0,
        avgTime: avgTime
      });
    });
    
    list.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.correctCount === 0 && b.correctCount > 0) return 1;
      if (b.correctCount === 0 && a.correctCount > 0) return -1;
      return a.avgTime - b.avgTime;
    });
    
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Kayıtlı öğrenci bulunmuyor.</td></tr>`;
      return;
    }
    
    list.forEach((item, index) => {
      const tr = document.createElement("tr");
      
      let rankDisplay = "";
      let rankClass = "rank-badge";
      if (index === 0) {
        rankDisplay = "🥇";
      } else if (index === 1) {
        rankDisplay = "🥈";
      } else if (index === 2) {
        rankDisplay = "🥉";
      } else {
        rankDisplay = index + 1;
      }
      
      tr.innerHTML = `
        <td style="text-align: center;"><span class="${rankClass}">${rankDisplay}</span></td>
        <td style="font-weight: 600; color: var(--text-primary);">${escapeHTML(item.name)}</td>
        <td style="text-align: center; font-weight: 700; color: var(--primary);">${item.score}</td>
        <td style="text-align: center; color: var(--success);">${item.correctCount}</td>
        <td style="text-align: center; color: var(--danger);">${item.incorrectCount}</td>
        <td style="text-align: center; color: var(--text-secondary);">${item.correctCount > 0 ? item.avgTime + 'sn' : '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function resetAllScores() {
    if (confirm("Tüm öğrencilerin skorlarını ve cevap sürelerini sıfırlamak istediğinize emin misiniz?")) {
      for (let name in studentScores) {
        studentScores[name] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
      }
      saveStudentScores();
      renderLeaderboard();
      renderTopFive();
      if (toastCallback) toastCallback("Tüm öğrenci puanları sıfırlandı!", "success");
    }
  }

  // Scoped Multiplication Game Logic

  function loadMultData() {
    multSelectedNumber = localStorage.getItem("mult_selected_number") || "all";
    multQuestionCount = parseInt(localStorage.getItem("mult_question_count")) || 10;
    multTimerLimit = parseInt(localStorage.getItem("mult_timer_limit")) || 10;
    
    multCurrentIndex = parseInt(localStorage.getItem("mult_current_index")) || 0;
    multRoundNumber = parseInt(localStorage.getItem("mult_round_number")) || 1;
    multActiveStudent = localStorage.getItem("mult_active_student") || "";
    
    const storedQuestions = localStorage.getItem("mult_questions");
    multQuestions = storedQuestions ? JSON.parse(storedQuestions) : [];
    
    const storedScores = localStorage.getItem("multiplication_scores");
    multScores = storedScores ? JSON.parse(storedScores) : {};
    
    const currentList = getQuizStudents();
    const cleanScores = {};
    currentList.forEach(name => {
      if (multScores[name]) {
        cleanScores[name] = multScores[name];
        if (cleanScores[name].incorrectCount === undefined) cleanScores[name].incorrectCount = 0;
        if (cleanScores[name].turnCount === undefined) cleanScores[name].turnCount = 0;
      } else {
        cleanScores[name] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
      }
    });
    multScores = cleanScores;
    saveMultStudentScores();
    
    // Selected Students for Multiplication
    const storedSelectedMult = localStorage.getItem("mult_selected_students");
    if (storedSelectedMult) {
      try {
        const parsed = JSON.parse(storedSelectedMult);
        const existingSelected = parsed.filter(name => currentList.includes(name));
        const newStudents = currentList.filter(name => !parsed.includes(name));
        multSelectedStudentNames = [...existingSelected, ...newStudents];
      } catch (e) {
        multSelectedStudentNames = [...currentList];
      }
    } else {
      multSelectedStudentNames = [...currentList];
    }
    saveSelectedMultStudents();
    
    const storedUnselected = localStorage.getItem("mult_unselected_students");
    if (storedUnselected) {
      const rawUnselected = JSON.parse(storedUnselected);
      multUnselectedStudents = rawUnselected.filter(name => multSelectedStudentNames.includes(name));
    } else {
      multUnselectedStudents = [...multSelectedStudentNames];
      saveMultUnselectedStudents();
    }
    
    multStats = JSON.parse(localStorage.getItem("mult_stats")) || { correct: 0, incorrect: 0, skipped: 0 };
    multSoundEnabled = localStorage.getItem("mult_sound_enabled") !== "false";
  }

  function saveMultStudentScores() {
    localStorage.setItem("multiplication_scores", JSON.stringify(multScores));
  }

  function saveMultUnselectedStudents() {
    localStorage.setItem("mult_unselected_students", JSON.stringify(multUnselectedStudents));
  }

  function saveMultGlobalProgress() {
    localStorage.setItem("mult_selected_number", multSelectedNumber);
    localStorage.setItem("mult_question_count", multQuestionCount.toString());
    localStorage.setItem("mult_timer_limit", multTimerLimit.toString());
    localStorage.setItem("mult_current_index", multCurrentIndex.toString());
    localStorage.setItem("mult_round_number", multRoundNumber.toString());
    localStorage.setItem("mult_active_student", multActiveStudent);
    localStorage.setItem("mult_questions", JSON.stringify(multQuestions));
    localStorage.setItem("mult_stats", JSON.stringify(multStats));
    localStorage.setItem("mult_sound_enabled", multSoundEnabled.toString());
  }

  function syncMultSetupUI() {
    const numButtons = document.querySelectorAll("#mult-setup-numbers .btn-mult-num");
    const selectedVals = multSelectedNumber.split(",");
    numButtons.forEach(btn => {
      const val = btn.getAttribute("data-val");
      if (selectedVals.includes(val)) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
    
    const countSelect = document.getElementById("mult-setup-count");
    if (countSelect) countSelect.value = multQuestionCount;
    
    const timerSelect = document.getElementById("mult-setup-timer");
    if (timerSelect) timerSelect.value = multTimerLimit;
    
    const soundOnIcon = document.getElementById("mult-sound-icon-on");
    const soundOffIcon = document.getElementById("mult-sound-icon-off");
    if (soundOnIcon && soundOffIcon) {
      if (multSoundEnabled) {
        soundOnIcon.style.display = "inline";
        soundOffIcon.style.display = "none";
      } else {
        soundOnIcon.style.display = "none";
        soundOffIcon.style.display = "inline";
      }
    }
  }

  function generateMultiplicationQuestions(selectedNumber, questionCount) {
    const list = [];
    let chosenNumbers = [];
    if (selectedNumber && selectedNumber !== "all") {
      chosenNumbers = selectedNumber.split(",").map(n => parseInt(n)).filter(n => !isNaN(n));
    }
    
    for (let i = 0; i < questionCount; i++) {
      let a, b;
      if (chosenNumbers.length > 0) {
        a = chosenNumbers[Math.floor(Math.random() * chosenNumbers.length)];
        b = Math.floor(Math.random() * 10) + 1;
        if (Math.random() > 0.5) {
          const temp = a;
          a = b;
          b = temp;
        }
      } else {
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
      }
      
      const correctVal = a * b;
      const options = generateMultiplicationOptions(correctVal, a, b);
      
      list.push({
        text: `${a} x ${b}`,
        correctAnswer: correctVal,
        options: options
      });
    }
    return list;
  }

  function generateMultiplicationOptions(correctAnswer, factorA, factorB) {
    const candidates = new Set();
    const addCandidate = (val) => {
      if (val > 0 && val !== correctAnswer) {
        candidates.add(val);
      }
    };
    
    addCandidate(correctAnswer + 2);
    addCandidate(correctAnswer - 2);
    addCandidate(correctAnswer + 10);
    addCandidate(correctAnswer - 10);
    addCandidate(correctAnswer + 1);
    addCandidate(correctAnswer - 1);
    addCandidate(correctAnswer + 5);
    addCandidate(correctAnswer - 5);
    
    addCandidate((factorA + 1) * factorB);
    addCandidate((factorA - 1) * factorB);
    addCandidate(factorA * (factorB + 1));
    addCandidate(factorA * (factorB - 1));
    
    let distractorsList = Array.from(candidates);
    distractorsList.sort(() => Math.random() - 0.5);
    
    const finalDistractors = [];
    for (let i = 0; i < distractorsList.length && finalDistractors.length < 3; i++) {
      finalDistractors.push(distractorsList[i]);
    }
    
    let fallbackOffset = 3;
    while (finalDistractors.length < 3) {
      const fallbackVal = correctAnswer + fallbackOffset;
      if (!finalDistractors.includes(fallbackVal) && fallbackVal !== correctAnswer) {
        finalDistractors.push(fallbackVal);
      }
      fallbackOffset++;
    }
    
    const allOptions = [correctAnswer, ...finalDistractors];
    allOptions.sort(() => Math.random() - 0.5);
    return allOptions;
  }

  function startMultGame() {
    const currentList = multSelectedStudentNames;
    if (currentList.length === 0) {
      alert("Lütfen önce oyuna katılacak en az bir öğrenci seçin!");
      return;
    }
    
    const countSelect = document.getElementById("mult-setup-count");
    multQuestionCount = parseInt(countSelect.value) || 10;
    
    const timerSelect = document.getElementById("mult-setup-timer");
    multTimerLimit = parseInt(timerSelect.value) || 10;
    
    multQuestions = generateMultiplicationQuestions(multSelectedNumber, multQuestionCount);
    
    const studentCount = currentList.length;
    if (studentCount > 0 && multQuestions.length > 0) {
      const remainder = multQuestions.length % studentCount;
      if (remainder !== 0) {
        const padCount = studentCount - remainder;
        const originalLength = multQuestions.length;
        for (let i = 0; i < padCount; i++) {
          const qToCopy = multQuestions[i % originalLength];
          multQuestions.push({
            text: qToCopy.text,
            correctAnswer: qToCopy.correctAnswer,
            options: [...qToCopy.options]
          });
        }
      }
    }
    
    document.getElementById("mult-setup-container").style.display = "none";
    document.getElementById("mult-active-layout").style.display = "grid";
    
    multCurrentIndex = 0;
    multRoundNumber = 1;
    multIsLastInRound = false;
    multStats = { correct: 0, incorrect: 0, skipped: 0 };
    
    multUnselectedStudents = [...currentList];
    saveMultUnselectedStudents();
    
    resetMultRaffleUI();
    renderMultPlayZoneQuestion();
    saveMultGlobalProgress();
    
    window.safeCreateIcons();
  }

  function resetMultRaffleUI() {
    multActiveStudent = "";
    const nameActiveDisplay = document.getElementById("mult-student-name-active");
    if (nameActiveDisplay) {
      nameActiveDisplay.textContent = "Öğrenci Seçilmedi";
      nameActiveDisplay.className = "student-name-active";
    }
    toggleMultAnswerControls(false);
    resetMultTimerUI();
    renderMultTopFive();
  }

  function toggleMultAnswerControls(enabled) {
    const container = document.getElementById("mult-answers-container");
    if (container) {
      const buttons = container.querySelectorAll("button");
      buttons.forEach(btn => btn.disabled = !enabled);
    }
    
    const skipBtn = document.getElementById("btn-mult-skip");
    if (skipBtn) skipBtn.disabled = !enabled;
  }

  function resetMultTimerUI() {
    clearMultTimer();
    const timerBar = document.getElementById("mult-timer-bar");
    const timerText = document.getElementById("mult-timer-text");
    if (timerText) {
      timerText.textContent = "--";
      timerText.classList.remove("timer-warning");
    }
    if (timerBar) {
      timerBar.style.strokeDashoffset = "0";
      timerBar.style.stroke = "var(--primary)";
    }
  }

  function renderMultTopFive() {
    const listContainer = document.getElementById("mult-top-students-list");
    if (listContainer) {
      listContainer.innerHTML = "";
      
      const list = [];
      const currentList = getQuizStudents();
      currentList.forEach(name => {
        const student = multScores[name] || { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
        let avgTime = 0;
        if (student.correctCount > 0) {
          avgTime = parseFloat((student.totalTime / student.correctCount).toFixed(1));
        }
        list.push({
          name: name,
          score: student.score || 0,
          correctCount: student.correctCount || 0,
          incorrectCount: student.incorrectCount || 0,
          turnCount: student.turnCount || 0,
          avgTime: avgTime
        });
      });
      
      list.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (a.correctCount === 0 && b.correctCount > 0) return 1;
        if (b.correctCount === 0 && a.correctCount > 0) return -1;
        return a.avgTime - b.avgTime;
      });
      
      const topFive = list.slice(0, 5);
      
      if (topFive.length === 0) {
        listContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 15px 0; font-size: 0.85rem;">Skor kaydı bulunmuyor.</div>`;
      } else {
        topFive.forEach((item, index) => {
          let rankBadge = "";
          if (index === 0) rankBadge = "🏆";
          else if (index === 1) rankBadge = "🥈";
          else if (index === 2) rankBadge = "🥉";
          else rankBadge = `<span class="rank-badge" style="background: rgba(0, 0, 0, 0.05); width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 11px; font-weight: bold; color: var(--text-secondary);">${index + 1}</span>`;
          
          listContainer.innerHTML += `
            <div class="top-student-item">
              <div class="top-student-rank">${rankBadge}</div>
              <div class="top-student-info">
                <span class="top-student-name" title="${escapeHTML(item.name)}">${escapeHTML(item.name)}</span>
                <span class="top-student-stats-detail">
                  <span class="correct">✔️ ${item.correctCount} D</span>
                  <span class="incorrect">❌ ${item.incorrectCount} Y</span>
                  <span class="turns" style="color: var(--primary); margin-left: 5px;">🔄 ${item.turnCount} Soru</span>
                </span>
              </div>
              <span class="top-student-score-badge">${item.score} Puan</span>
            </div>
          `;
        });
      }
    }
    
    const scoreBox = document.getElementById("mult-student-score-box");
    if (scoreBox) {
      if (multActiveStudent) {
        scoreBox.style.display = "flex";
        document.getElementById("mult-active-student-score-label").textContent = `${multActiveStudent} Puanı:`;
        const studentObj = multScores[multActiveStudent] || { score: 0 };
        document.getElementById("mult-active-student-score-value").textContent = studentObj.score || 0;
      } else {
        scoreBox.style.display = "none";
      }
    }
  }

  function selectRandomMultStudent() {
    const currentList = multSelectedStudentNames;
    if (currentList.length === 0) {
      alert("Lütfen önce oyuna katılacak en az bir öğrenci seçin!");
      return;
    }
    
    SoundFX.init();
    
    const selectBtn = document.getElementById("btn-mult-select-student");
    const nameActiveDisplay = document.getElementById("mult-student-name-active");
    
    selectBtn.disabled = true;
    nameActiveDisplay.className = "student-name-active";
    nameActiveDisplay.textContent = "Seçiliyor...";
    
    toggleMultAnswerControls(false);
    
    let duration = 1500;
    let intervalTime = 60;
    let steps = duration / intervalTime;
    let currentStep = 0;
    
    const raffleInterval = setInterval(() => {
      currentStep++;
      const tempIndex = Math.floor(Math.random() * currentList.length);
      nameActiveDisplay.textContent = currentList[tempIndex];
      
      if (multSoundEnabled) {
        SoundFX.playRaffleTick();
      }
      
      if (currentStep >= steps - 6) {
        clearInterval(raffleInterval);
        slowMultRaffleRoll(6, nameActiveDisplay, selectBtn);
      }
    }, intervalTime);
  }

  function slowMultRaffleRoll(remainingSteps, displayEl, btnEl) {
    let delay = 100;
    const currentList = multSelectedStudentNames;
    
    function nextStep(stepsLeft) {
      if (stepsLeft === 0) {
        finalizeMultRaffle(displayEl, btnEl);
        return;
      }
      
      const tempIndex = Math.floor(Math.random() * currentList.length);
      displayEl.textContent = currentList[tempIndex];
      if (multSoundEnabled) {
        SoundFX.playRaffleTick();
      }
      
      delay = delay * 1.35;
      setTimeout(() => {
        nextStep(stepsLeft - 1);
      }, delay);
    }
    
    nextStep(remainingSteps);
  }

  function finalizeMultRaffle(displayEl, btnEl) {
    const currentList = multSelectedStudentNames;
    if (multUnselectedStudents.length === 0) {
      multUnselectedStudents = [...currentList];
    }
    
    const randomIndex = Math.floor(Math.random() * multUnselectedStudents.length);
    multActiveStudent = multUnselectedStudents[randomIndex];
    
    multUnselectedStudents.splice(randomIndex, 1);
    saveMultUnselectedStudents();
    
    if (multUnselectedStudents.length === 0) {
      multIsLastInRound = true;
    }
    
    displayEl.textContent = multActiveStudent;
    displayEl.className = "student-name-active selected";
    
    if (multSoundEnabled) {
      SoundFX.playRaffleWin();
    }
    
    btnEl.disabled = false;
    
    if (multScores[multActiveStudent] === undefined || typeof multScores[multActiveStudent] !== 'object') {
      multScores[multActiveStudent] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
    }
    
    multScores[multActiveStudent].turnCount = (multScores[multActiveStudent].turnCount || 0) + 1;
    saveMultStudentScores();
    
    renderMultTopFive();
    
    toggleMultAnswerControls(true);
    renderMultPlayZoneQuestion();
    startMultTimer();
  }

  function renderMultPlayZoneQuestion() {
    if (multQuestions.length === 0) {
      document.getElementById("mult-question-text").textContent = "Oyun kurulmadı.";
      document.getElementById("mult-question-index").textContent = "Soru: 0 / 0";
      return;
    }
    
    if (multCurrentIndex >= multQuestions.length) {
      multCurrentIndex = 0;
      saveMultGlobalProgress();
    }
    
    const question = multQuestions[multCurrentIndex];
    document.getElementById("mult-question-index").textContent = `Soru: ${multCurrentIndex + 1} / ${multQuestions.length}`;
    document.getElementById("mult-question-text").textContent = question.text;
    
    const container = document.getElementById("mult-answers-container");
    container.innerHTML = "";
    
    const letters = ["A", "B", "C", "D"];
    question.options.forEach((opt, idx) => {
      const btnId = `btn-mult-mc-${idx}`;
      container.innerHTML += `
        <button id="${btnId}" class="btn-answer btn-answer-mc" disabled>
          <div class="btn-answer-icon">${letters[idx]}</div>
          <span>${opt}</span>
        </button>
      `;
    });
    
    question.options.forEach((opt, idx) => {
      document.getElementById(`btn-mult-mc-${idx}`).addEventListener("click", () => submitMultAnswer(opt));
    });
    
    toggleMultAnswerControls(!!multActiveStudent);
  }

  // Multiplication Timer Helpers
  function clearMultTimer() {
    if (multTimerInterval) {
      clearInterval(multTimerInterval);
      multTimerInterval = null;
    }
    if (multTickTimeout) {
      clearTimeout(multTickTimeout);
      multTickTimeout = null;
    }
  }

  function scheduleMultNextTick() {
    if (multTickTimeout) clearTimeout(multTickTimeout);
    
    SoundFX.playClockTick();
    
    const totalSec = multTimerLimit || 10;
    const ratio = Math.max(0, Math.min(1, multTimeLeft / totalSec));
    
    const minInterval = 250;
    const maxInterval = 1000;
    const nextInterval = minInterval + (maxInterval - minInterval) * ratio;
    
    multTickTimeout = setTimeout(() => {
      if (multTimeLeft > 0 && multTimerInterval) {
        scheduleMultNextTick();
      }
    }, nextInterval);
  }

  function startMultTimer() {
    clearMultTimer();
    multTimeLeft = multTimerLimit;
    
    const timerBar = document.getElementById("mult-timer-bar");
    const timerText = document.getElementById("mult-timer-text");
    if (timerText) {
      timerText.classList.remove("timer-warning");
      timerText.textContent = multTimeLeft;
    }
    
    if (timerBar) {
      timerBar.style.strokeDashoffset = "0";
      timerBar.style.stroke = "var(--primary)";
    }
    
    SoundFX.playGong();
    scheduleMultNextTick();
    
    multTimerInterval = setInterval(() => {
      multTimeLeft--;
      if (timerText) timerText.textContent = multTimeLeft;
      
      const percentage = multTimeLeft / multTimerLimit;
      const offset = 283 - (283 * percentage);
      if (timerBar) timerBar.style.strokeDashoffset = offset;
      
      if (multTimeLeft <= 3 && multTimeLeft > 0) {
        if (timerText) timerText.classList.add("timer-warning");
        if (timerBar) timerBar.style.stroke = "var(--danger)";
      }
      
      if (multTimeLeft <= 0) {
        clearMultTimer();
        handleMultTimeExpiry();
      }
    }, 1000);
  }

  function handleMultTimeExpiry() {
    toggleMultAnswerControls(false);
    if (multSoundEnabled) {
      SoundFX.playExpire();
    }
    
    const question = multQuestions[multCurrentIndex];
    
    showMultFeedback(
      false,
      "Süre Doldu!",
      `Cevap verme süresi tükendi. Doğru cevap: <strong>${question.correctAnswer}</strong> olmalıydı.`,
      true
    );
    
    if (multActiveStudent) {
      if (multScores[multActiveStudent] === undefined || typeof multScores[multActiveStudent] !== 'object') {
        multScores[multActiveStudent] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
      }
      multScores[multActiveStudent].incorrectCount = (multScores[multActiveStudent].incorrectCount || 0) + 1;
      saveMultStudentScores();
    }
    
    multStats.incorrect++;
    multCurrentIndex++;
    saveMultGlobalProgress();
    renderMultTopFive();
  }

  function submitMultAnswer(studentAnswer) {
    clearMultTimer();
    toggleMultAnswerControls(false);
    
    const question = multQuestions[multCurrentIndex];
    const isCorrect = (parseInt(studentAnswer) === parseInt(question.correctAnswer));
    
    const gameCard = document.querySelector("#games-multiplication-view .game-card");
    const secondsTaken = multTimerLimit - multTimeLeft;
    
    if (isCorrect) {
      if (multSoundEnabled) {
        SoundFX.playCorrect();
      }
      
      if (gameCard) {
        gameCard.classList.add("pulse-green");
        setTimeout(() => gameCard.classList.remove("pulse-green"), 500);
      }
      
      const pointsEarned = 10 + multTimeLeft;
      
      if (multScores[multActiveStudent] === undefined || typeof multScores[multActiveStudent] !== 'object') {
        multScores[multActiveStudent] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
      }
      
      multScores[multActiveStudent].score += pointsEarned;
      multScores[multActiveStudent].correctCount += 1;
      multScores[multActiveStudent].totalTime += secondsTaken;
      
      multStats.correct++;
      
      showMultFeedback(
        true,
        "Harika, Doğru Cevap!",
        `<strong>${multActiveStudent}</strong> doğru yanıtlayarak <strong>+${pointsEarned} Puan</strong> (10 Taban + ${multTimeLeft} Hız Bonusu) kazandı!`
      );
    } else {
      if (multSoundEnabled) {
        SoundFX.playIncorrect();
      }
      
      if (gameCard) {
        gameCard.classList.add("shake");
        setTimeout(() => gameCard.classList.remove("shake"), 500);
      }
      
      multStats.incorrect++;
      
      if (multScores[multActiveStudent] === undefined || typeof multScores[multActiveStudent] !== 'object') {
        multScores[multActiveStudent] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
      }
      multScores[multActiveStudent].incorrectCount = (multScores[multActiveStudent].incorrectCount || 0) + 1;
      
      showMultFeedback(
        false,
        "Yanlış Cevap!",
        `<strong>${multActiveStudent}</strong> yanlış cevap verdi. Doğru cevap: <strong>${question.correctAnswer}</strong> olmalıydı.`
      );
    }
    
    multCurrentIndex++;
    
    saveMultStudentScores();
    saveMultGlobalProgress();
    renderMultTopFive();
  }

  function skipMultQuestion() {
    clearMultTimer();
    toggleMultAnswerControls(false);
    
    multStats.skipped++;
    multCurrentIndex++;
    
    saveMultGlobalProgress();
    renderMultTopFive();
    
    if (multCurrentIndex >= multQuestions.length) {
      showMultGameOver();
    } else if (multIsLastInRound) {
      showMultRoundCompleted();
    } else {
      resetMultRaffleUI();
      renderMultPlayZoneQuestion();
      if (toastCallback) toastCallback("Soru pas geçildi. Sıradaki öğrenciyi seçin.", "info");
    }
  }

  function restartMultQuiz() {
    if (confirm("Tüm puanları ve istatistikleri sıfırlamak istediğinize emin misiniz?")) {
      clearMultTimer();
      multStats = { correct: 0, incorrect: 0, skipped: 0 };
      multCurrentIndex = 0;
      
      for (let student in multScores) {
        multScores[student] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
      }
      
      const currentList = multSelectedStudentNames;
      multUnselectedStudents = [...currentList];
      saveMultUnselectedStudents();
      
      multRoundNumber = 1;
      multIsLastInRound = false;
      
      saveMultStudentScores();
      saveMultGlobalProgress();
      resetMultRaffleUI();
      renderMultPlayZoneQuestion();
    }
  }

  function showMultFeedback(isCorrect, title, message, isExpired = false) {
    const overlay = document.getElementById("mult-feedback-overlay");
    const iconEl = document.getElementById("mult-feedback-icon");
    const titleEl = document.getElementById("mult-feedback-title");
    const msgEl = document.getElementById("mult-feedback-message");
    
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.innerHTML = message;
    
    if (iconEl) {
      if (isExpired) {
        iconEl.textContent = "⏰";
        iconEl.className = "feedback-icon incorrect";
      } else if (isCorrect) {
        iconEl.textContent = "✓";
        iconEl.className = "feedback-icon correct";
      } else {
        iconEl.textContent = "✗";
        iconEl.className = "feedback-icon incorrect";
      }
    }
    
    if (overlay) overlay.style.display = "flex";
  }

  function closeMultFeedback() {
    document.getElementById("mult-feedback-overlay").style.display = "none";
    if (multCurrentIndex >= multQuestions.length) {
      showMultGameOver();
    } else if (multIsLastInRound) {
      showMultRoundCompleted();
    } else {
      resetMultRaffleUI();
      renderMultPlayZoneQuestion();
    }
  }

  function showMultRoundCompleted() {
    if (multSoundEnabled) {
      SoundFX.playRaffleWin();
    }
    document.getElementById("mult-round-completed-title").textContent = `${multRoundNumber}. Tur Tamamlandı!`;
    document.getElementById("mult-round-completed-message").textContent = `Tüm öğrenciler ${multRoundNumber} soru yanıtladı.`;
    document.getElementById("mult-round-completed-overlay").style.display = "flex";
  }

  function closeMultRoundOverlay() {
    document.getElementById("mult-round-completed-overlay").style.display = "none";
    multRoundNumber++;
    multIsLastInRound = false;
    saveMultGlobalProgress();
    resetMultRaffleUI();
    renderMultPlayZoneQuestion();
  }

  function showMultGameOver() {
    clearMultTimer();
    if (multSoundEnabled) {
      SoundFX.playRaffleWin();
    }
    
    const overlay = document.getElementById("mult-game-over-overlay");
    if (!overlay) return;
    
    const currentList = multSelectedStudentNames;
    const turns = multQuestions.length / currentList.length;
    document.getElementById("mult-game-over-turns-info").textContent = `Tüm öğrenciler eşit sayıda (${turns}) soru yanıtladı.`;
    
    const list = [];
    currentList.forEach(name => {
      const student = multScores[name] || { score: 0, correctCount: 0, totalTime: 0 };
      let avgTime = 0;
      if (student.correctCount > 0) {
        avgTime = parseFloat((student.totalTime / student.correctCount).toFixed(1));
      }
      list.push({
        name: name,
        score: student.score || 0,
        correctCount: student.correctCount || 0,
        avgTime: avgTime
      });
    });
    
    list.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.correctCount === 0 && b.correctCount > 0) return 1;
      if (b.correctCount === 0 && a.correctCount > 0) return -1;
      return a.avgTime - b.avgTime;
    });
    
    const p1Name = document.getElementById("mult-podium-1-name");
    const p1Score = document.getElementById("mult-podium-1-score");
    const p2Name = document.getElementById("mult-podium-2-name");
    const p2Score = document.getElementById("mult-podium-2-score");
    const p3Name = document.getElementById("mult-podium-3-name");
    const p3Score = document.getElementById("mult-podium-3-score");
    const p2Container = document.getElementById("mult-podium-2");
    const p3Container = document.getElementById("mult-podium-3");
    
    if (list[0]) {
      p1Name.textContent = list[0].name;
      p1Score.textContent = `${list[0].score} Puan`;
    } else {
      p1Name.textContent = "-";
      p1Score.textContent = "0 Puan";
    }
    
    if (list[1]) {
      p2Container.style.visibility = "visible";
      p2Name.textContent = list[1].name;
      p2Score.textContent = `${list[1].score} Puan`;
    } else {
      p2Container.style.visibility = "hidden";
    }
    
    if (list[2]) {
      p3Container.style.visibility = "visible";
      p3Name.textContent = list[2].name;
      p3Score.textContent = `${list[2].score} Puan`;
    } else {
      p3Container.style.visibility = "hidden";
    }
    
    overlay.style.display = "flex";
  }

  function restartMultQuizGame() {
    multStats = { correct: 0, incorrect: 0, skipped: 0 };
    multCurrentIndex = 0;
    multRoundNumber = 1;
    multIsLastInRound = false;
    
    for (let student in multScores) {
      multScores[student] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
    }
    
    const currentList = multSelectedStudentNames;
    multUnselectedStudents = [...currentList];
    saveMultUnselectedStudents();
    
    saveMultStudentScores();
    saveMultGlobalProgress();
    resetMultRaffleUI();
    renderMultPlayZoneQuestion();
  }

  function toggleMultSound() {
    multSoundEnabled = !multSoundEnabled;
    const soundOnIcon = document.getElementById("mult-sound-icon-on");
    const soundOffIcon = document.getElementById("mult-sound-icon-off");
    
    if (multSoundEnabled) {
      soundOnIcon.style.display = "inline";
      soundOffIcon.style.display = "none";
    } else {
      soundOnIcon.style.display = "none";
      soundOffIcon.style.display = "inline";
    }
    saveMultGlobalProgress();
  }

  function renderMultLeaderboard() {
    const tbody = document.getElementById("mult-leaderboard-list-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const list = [];
    const currentList = getQuizStudents();
    currentList.forEach(name => {
      const student = multScores[name] || { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0 };
      let avgTime = 0;
      if (student.correctCount > 0) {
        avgTime = parseFloat((student.totalTime / student.correctCount).toFixed(1));
      }
      list.push({
        name: name,
        score: student.score || 0,
        correctCount: student.correctCount || 0,
        incorrectCount: student.incorrectCount || 0,
        avgTime: avgTime
      });
    });
    
    list.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.correctCount === 0 && b.correctCount > 0) return 1;
      if (b.correctCount === 0 && a.correctCount > 0) return -1;
      return a.avgTime - b.avgTime;
    });
    
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Kayıtlı öğrenci bulunmuyor.</td></tr>`;
      return;
    }
    
    list.forEach((item, index) => {
      const tr = document.createElement("tr");
      
      let rankDisplay = "";
      let rankClass = "rank-badge";
      if (index === 0) {
        rankDisplay = "🥇";
      } else if (index === 1) {
        rankDisplay = "🥈";
      } else if (index === 2) {
        rankDisplay = "🥉";
      } else {
        rankDisplay = index + 1;
      }
      
      tr.innerHTML = `
        <td style="text-align: center;"><span class="${rankClass}">${rankDisplay}</span></td>
        <td style="font-weight: 600; color: var(--text-primary);">${escapeHTML(item.name)}</td>
        <td style="text-align: center; font-weight: 700; color: var(--primary);">${item.score}</td>
        <td style="text-align: center; color: var(--success);">${item.correctCount}</td>
        <td style="text-align: center; color: var(--danger);">${item.incorrectCount}</td>
        <td style="text-align: center; color: var(--text-secondary);">${item.correctCount > 0 ? item.avgTime + 'sn' : '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function resetMultAllScores() {
    if (confirm("Tüm öğrencilerin skorlarını ve cevap sürelerini sıfırlamak istediğinize emin misiniz?")) {
      for (let name in multScores) {
        multScores[name] = { score: 0, correctCount: 0, incorrectCount: 0, totalTime: 0, turnCount: 0 };
      }
      saveMultStudentScores();
      renderMultLeaderboard();
      renderMultTopFive();
      if (toastCallback) toastCallback("Tüm öğrenci puanları sıfırlandı!", "success");
    }
  }

  function switchMultSubTab(tabName) {
    document.getElementById("game-mult-tab-play").style.display = "none";
    document.getElementById("game-mult-tab-leaderboard").style.display = "none";
    
    document.getElementById("game-mult-nav-play").classList.remove("active");
    document.getElementById("game-mult-nav-leaderboard").classList.remove("active");
    
    document.getElementById(`game-mult-nav-${tabName}`).classList.add("active");
    document.getElementById(`game-mult-tab-${tabName}`).style.display = "block";
    
    if (tabName === "play") {
      if (multQuestions.length > 0) {
        document.getElementById("mult-setup-container").style.display = "none";
        document.getElementById("mult-active-layout").style.display = "grid";
        renderMultPlayZoneQuestion();
      } else {
        document.getElementById("mult-setup-container").style.display = "block";
        document.getElementById("mult-active-layout").style.display = "none";
        resetMultRaffleUI();
      }
    } else if (tabName === "leaderboard") {
      renderMultLeaderboard();
    }
    
    window.safeCreateIcons();
  }

  function toggleFullscreenGame() {
    const gamesContainer = document.getElementById("games");
    if (!gamesContainer) return;

    if (!document.fullscreenElement) {
      if (gamesContainer.requestFullscreen) {
        gamesContainer.requestFullscreen();
      } else if (gamesContainer.webkitRequestFullscreen) {
        gamesContainer.webkitRequestFullscreen();
      } else if (gamesContainer.msRequestFullscreen) {
        gamesContainer.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  function syncFullscreenUI() {
    const isFullscreen = !!document.fullscreenElement;
    
    const iconOn = document.getElementById("fullscreen-icon-on");
    const iconOff = document.getElementById("fullscreen-icon-off");
    if (iconOn && iconOff) {
      if (isFullscreen) {
        iconOn.style.display = "none";
        iconOff.style.display = "inline";
      } else {
        iconOn.style.display = "inline";
        iconOff.style.display = "none";
      }
    }

    const multIconOn = document.getElementById("mult-fullscreen-icon-on");
    const multIconOff = document.getElementById("mult-fullscreen-icon-off");
    if (multIconOn && multIconOff) {
      if (isFullscreen) {
        multIconOn.style.display = "none";
        multIconOff.style.display = "inline";
      } else {
        multIconOn.style.display = "inline";
        multIconOff.style.display = "none";
      }
    }
    
    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }
  }

  // Utilities
  function escapeHTML(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Expose module globally
  window.setupGamesTab = setupGamesTab;
  window.renderGames = renderGames;
  window.renderQuizStudentSelection = renderQuizStudentSelection;
  window.renderMultStudentSelection = renderMultStudentSelection;
})();
