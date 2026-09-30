/**
 * SINIF ASİSTANI — MOBİL OYUNLAR MODÜLÜ (MOBILE-GAMES.JS)
 * Bilgi Yarışması (Quiz), Çarpım Tablosu Oyunu ve Hazine Sandığı / Çarkıfelek.
 */

(function(window) {
  'use strict';

  const escapeHTML = window.escapeHTML || (str => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  });
  const showMobileToast = window.showMobileToast || (msg => alert(msg));

  // ==========================================================================
  // 2. OYUNLAR MODÜLÜ (QUIZ, ÇARPIM TABLOSU, HAZİNE SANDIĞI)
  // ==========================================================================
  let quizQuestions = [];
  let currentQuizIdx = 0;
  let quizScore = 0;
  let mathStreak = 0;
  let mathScore = 0;
  let mathCurrentAnswer = 0;

  let quizTimerInterval = null;
  function stopQuizTimer() {
    if (quizTimerInterval) {
      clearInterval(quizTimerInterval);
      quizTimerInterval = null;
    }
  }

  function initMobileGames() {
    window.backToGamesLanding();
  }

  window.backToGamesLanding = () => {
    stopQuizTimer();
    const quizFabMenu = document.getElementById('m-quiz-fab-menu');
    const quizFabBtn = document.getElementById('m-quiz-fab-btn');
    if (quizFabMenu) quizFabMenu.classList.remove('show');
    if (quizFabBtn) quizFabBtn.classList.remove('active');

    const landing = document.getElementById('m-games-landing');
    const arenaQuiz = document.getElementById('m-arena-quiz');
    const arenaMath = document.getElementById('m-arena-math');
    const arenaTreasure = document.getElementById('m-arena-treasure');
    const title = document.getElementById('m-games-header-title');

    if (landing) landing.style.display = 'block';
    if (arenaQuiz) arenaQuiz.style.display = 'none';
    if (arenaMath) arenaMath.style.display = 'none';
    if (arenaTreasure) arenaTreasure.style.display = 'none';
    if (title) title.textContent = 'Sınıf Oyunları';
    if (window.lucide) window.lucide.createIcons();
  };

  // ==========================================================================
  // Oyun 1: BİLGİ YARIŞMASI (MASAÜSTÜ PARİTESİ, YÜZEN MENÜ & SORU HAVUZU)
  // ==========================================================================
  const defaultMobileQuizQuestions = [
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

  let mobileQuizQuestions = [];
  let mobileQuizFilteredQuestions = [];
  let quizTimeLeft = 15;
  let quizActiveStudent = null;
  let quizCurrentRound = 1;
  let quizSelectedStudentNames = [];
  let quizUnselectedStudents = [];
  let quizStudentScores = {};
  let quizSoundEnabled = true;
  let quizTimerDuration = 15;
  let quizFilterType = 'all';
  let quizFilterCategory = 'all';
  let quizPoolCategoryFilter = 'all';
  let quizPoolSearchText = '';
  let quizFormActiveType = 'tf';
  let quizRafflePendingWinner = null;
  let quizHasAnsweredCurrent = false;

  function getMobileQuizActiveStudents() {
    if (!window.stateManager || !window.stateManager.state) return [];
    let students = window.stateManager.state.students || [];
    if (students.length === 0 && window.stateManager.state.rawStudents) {
      students = window.stateManager.state.rawStudents;
    }
    const demoMiddleNames = new Set([
      "Hakan Yıldız", "Zeynep Demir", "Ömer Aslan", "Ceren Yılmaz", "Kerem Kaya", "Melis Şahin", "Burak Çelik", "Eda Öztürk",
      "Ahmet Yılmaz", "Can Demir", "Zeynep Kaya", "Ayşe Yılmaz"
    ]);
    const demoMiddleIds = new Set(['std_1', '101', '102', '103', 'std_m1', 'std_m2', 'std_m3', 'std_m4', 'std_m5', 'std_m6', 'std_m7', 'std_m8', 'std_m9', 'std_m10']);
    const isDemo = (s) => {
      const fn = `${s.name || ''} ${s.surname || ''}`.trim();
      const norm = fn.toLowerCase().replace(/[\s\.\-_]/g, '');
      if (demoMiddleNames.has(fn)) return true;
      if (norm === 'candemir' || norm === 'ahmetyilmaz' || norm === 'ahmetyılmaz') return true;
      if (s.id && (demoMiddleIds.has(String(s.id)) || String(s.id).startsWith('std_m'))) return true;
      return false;
    };
    if (students.some(s => !isDemo(s))) {
      students = students.filter(s => !isDemo(s));
    }
    return students;
  }

  function getStudentDisplayName(s) {
    if (!s) return '';
    return `${s.name || ''} ${s.surname || ''}`.trim();
  }

  function loadMobileQuizData() {
    // 1. Sorular
    try {
      const storedQ = localStorage.getItem("tf_questions");
      if (storedQ) {
        mobileQuizQuestions = JSON.parse(storedQ);
        if (!Array.isArray(mobileQuizQuestions) || mobileQuizQuestions.length === 0) {
          mobileQuizQuestions = [...defaultMobileQuizQuestions];
          localStorage.setItem("tf_questions", JSON.stringify(mobileQuizQuestions));
        }
      } else {
        mobileQuizQuestions = [...defaultMobileQuizQuestions];
        localStorage.setItem("tf_questions", JSON.stringify(mobileQuizQuestions));
      }
    } catch (e) {
      mobileQuizQuestions = [...defaultMobileQuizQuestions];
    }
    if (window.stateManager && window.stateManager.state) {
      window.stateManager.state.quizQuestions = mobileQuizQuestions;
    }

    // 2. Ayarlar
    try {
      const storedSet = localStorage.getItem("m_quiz_settings");
      if (storedSet) {
        const s = JSON.parse(storedSet);
        if (s.timerSeconds !== undefined) quizTimerDuration = parseInt(s.timerSeconds);
        if (s.qType) quizFilterType = s.qType;
        if (s.category) quizFilterCategory = s.category;
        if (s.soundEnabled !== undefined) quizSoundEnabled = s.soundEnabled;
      }
    } catch (e) {}

    // 3. Skorlar
    try {
      const storedSc = localStorage.getItem("tf_student_scores");
      quizStudentScores = storedSc ? JSON.parse(storedSc) : {};
    } catch (e) {
      quizStudentScores = {};
    }

    // 4. Öğrenciler
    const activeStudents = getMobileQuizActiveStudents();
    const activeNames = activeStudents.map(s => getStudentDisplayName(s));

    try {
      const storedSel = localStorage.getItem("quiz_selected_students");
      if (storedSel) {
        quizSelectedStudentNames = JSON.parse(storedSel);
        quizSelectedStudentNames = quizSelectedStudentNames.filter(n => activeNames.includes(n));
      }
    } catch (e) {
      quizSelectedStudentNames = [];
    }

    if (quizSelectedStudentNames.length === 0 && activeNames.length > 0) {
      quizSelectedStudentNames = [...activeNames];
      localStorage.setItem("quiz_selected_students", JSON.stringify(quizSelectedStudentNames));
    }

    // 5. Kura havuzu
    try {
      const storedUnsel = localStorage.getItem("tf_unselected_students");
      if (storedUnsel) {
        quizUnselectedStudents = JSON.parse(storedUnsel);
        quizUnselectedStudents = quizUnselectedStudents.filter(n => quizSelectedStudentNames.includes(n));
      }
    } catch (e) {
      quizUnselectedStudents = [];
    }

    if (quizUnselectedStudents.length === 0 && quizSelectedStudentNames.length > 0) {
      quizUnselectedStudents = [...quizSelectedStudentNames];
      localStorage.setItem("tf_unselected_students", JSON.stringify(quizUnselectedStudents));
    }

    const soundIcon = document.getElementById('m-quiz-sound-icon');
    if (soundIcon) soundIcon.textContent = quizSoundEnabled ? '🔊' : '🔇';
  }

  function applyQuizFilters() {
    let list = [...mobileQuizQuestions];
    if (quizFilterType && quizFilterType !== 'all') {
      list = list.filter(q => q.type === quizFilterType);
    }
    if (quizFilterCategory && quizFilterCategory !== 'all') {
      list = list.filter(q => q.category === quizFilterCategory);
    }
    if (list.length === 0) {
      showMobileToast('Seçilen filtrede soru bulunamadı, tüm sorular kullanılıyor.');
      list = [...mobileQuizQuestions];
    }
    mobileQuizFilteredQuestions = list.sort(() => Math.random() - 0.5);
  }

  window.startMobileQuizGame = () => {
    const landing = document.getElementById('m-games-landing');
    const arenaQuiz = document.getElementById('m-arena-quiz');
    const title = document.getElementById('m-games-header-title');
    if (landing) landing.style.display = 'none';
    if (arenaQuiz) arenaQuiz.style.display = 'block';
    if (title) title.textContent = 'Bilgi Yarışması';

    loadMobileQuizData();
    applyQuizFilters();
    currentQuizIdx = 0;
    quizScore = 0;
    quizCurrentRound = 1;
    quizActiveStudent = null;

    window.switchQuizView('play');
    if (window.lucide) window.lucide.createIcons();
  };

  window.toggleQuizFabMenu = () => {
    const menu = document.getElementById('m-quiz-fab-menu');
    const btn = document.getElementById('m-quiz-fab-btn');
    if (!menu) return;
    const isShowing = menu.classList.toggle('show');
    if (btn) btn.classList.toggle('active', isShowing);
    if (isShowing) window.vibrate(15);
  };

  window.switchQuizView = (viewName) => {
    const menu = document.getElementById('m-quiz-fab-menu');
    const btn = document.getElementById('m-quiz-fab-btn');
    if (menu) menu.classList.remove('show');
    if (btn) btn.classList.remove('active');

    const views = {
      play: document.getElementById('m-quiz-view-play'),
      students: document.getElementById('m-quiz-view-students'),
      pool: document.getElementById('m-quiz-view-pool'),
      leaderboard: document.getElementById('m-quiz-view-leaderboard')
    };

    Object.keys(views).forEach(key => {
      if (views[key]) views[key].style.display = (key === viewName) ? 'block' : 'none';
    });

    const badge = document.getElementById('m-quiz-current-view-badge');
    if (badge) {
      if (viewName === 'play') badge.textContent = '🎮 Yarışma';
      else if (viewName === 'students') badge.textContent = '🎲 Öğrenci Seç & Kura';
      else if (viewName === 'pool') badge.textContent = '📦 Soru Havuzu';
      else if (viewName === 'leaderboard') badge.textContent = '🏆 Skor Tablosu';
    }

    if (viewName === 'play') {
      renderCurrentQuizQuestion();
    } else if (viewName === 'students') {
      stopQuizTimer();
      renderQuizStudentsRoster();
    } else if (viewName === 'pool') {
      stopQuizTimer();
      renderQuizPoolList();
    } else if (viewName === 'leaderboard') {
      stopQuizTimer();
      renderQuizLeaderboard();
    }

    if (window.lucide) window.lucide.createIcons();
  };

  function startQuizTimer() {
    stopQuizTimer();
    const timerText = document.getElementById('m-quiz-timer-text');
    const timerBar = document.getElementById('m-quiz-timer-bar');

    if (quizTimerDuration <= 0) {
      if (timerText) timerText.textContent = 'Süresiz';
      if (timerBar) {
        timerBar.style.width = '100%';
        timerBar.style.background = 'linear-gradient(90deg, #10b981, #6366f1)';
      }
      return;
    }

    quizTimeLeft = quizTimerDuration;
    if (timerText) timerText.textContent = `${quizTimeLeft}s`;
    if (timerBar) {
      timerBar.style.width = '100%';
      timerBar.style.background = 'linear-gradient(90deg, #10b981, #6366f1)';
    }

    quizTimerInterval = setInterval(() => {
      quizTimeLeft--;
      if (timerText) timerText.textContent = `${quizTimeLeft}s`;
      if (timerBar) {
        const percent = Math.max(0, (quizTimeLeft / quizTimerDuration) * 100);
        timerBar.style.width = `${percent}%`;
        if (quizTimeLeft <= 5) {
          timerBar.style.background = '#ef4444';
          if (quizSoundEnabled) playSynthChime('tick');
        }
      }

      if (quizTimeLeft <= 0) {
        stopQuizTimer();
        handleQuizTimeout();
      }
    }, 1000);
  }

  function handleQuizTimeout() {
    quizHasAnsweredCurrent = true;
    window.vibrate(100);
    if (quizSoundEnabled) playSynthChime('wrong');
    showMobileToast('⏱️ Süre Doldu!');

    const q = mobileQuizFilteredQuestions[currentQuizIdx];
    if (!q) return;

    if (q.type === 'tf') {
      const correctVal = (q.answer === true || q.answer === 'true');
      const tfBtns = document.querySelectorAll('.game-quiz-tf-btn');
      tfBtns.forEach(b => {
        b.disabled = true;
        const isTrueBtn = b.classList.contains('tf-true');
        if (isTrueBtn === correctVal) b.classList.add('correct');
      });
    } else {
      const correctIdx = (typeof q.answer === 'number') ? q.answer : ((typeof q.correct === 'number') ? q.correct : 0);
      const btns = document.querySelectorAll('.game-quiz-btn');
      btns.forEach((btn, i) => {
        btn.disabled = true;
        if (i === correctIdx) btn.classList.add('correct');
      });
    }

    if (q.explanation) {
      const expBox = document.getElementById('m-quiz-explanation-box');
      const expText = document.getElementById('m-quiz-explanation-text');
      if (expBox && expText) {
        expText.textContent = q.explanation;
        expBox.style.display = 'block';
      }
    }

    if (quizActiveStudent) {
      if (!quizStudentScores[quizActiveStudent]) {
        quizStudentScores[quizActiveStudent] = { score: 0, correctCount: 0, incorrectCount: 1 };
      } else if (typeof quizStudentScores[quizActiveStudent] === 'number') {
        quizStudentScores[quizActiveStudent] = { score: quizStudentScores[quizActiveStudent], correctCount: 0, incorrectCount: 1 };
      } else {
        quizStudentScores[quizActiveStudent].incorrectCount = (quizStudentScores[quizActiveStudent].incorrectCount || 0) + 1;
      }
      localStorage.setItem("tf_student_scores", JSON.stringify(quizStudentScores));
    }
  }

  function renderCurrentQuizQuestion() {
    stopQuizTimer();
    quizHasAnsweredCurrent = false;

    if (!mobileQuizFilteredQuestions || mobileQuizFilteredQuestions.length === 0) {
      applyQuizFilters();
    }

    if (currentQuizIdx >= mobileQuizFilteredQuestions.length) {
      mobileQuizFilteredQuestions = [...mobileQuizFilteredQuestions].sort(() => Math.random() - 0.5);
      currentQuizIdx = 0;
      showMobileToast('Tüm sorular tamamlandı, havuz yeniden karıştırıldı! 🔄');
    }

    const q = mobileQuizFilteredQuestions[currentQuizIdx];
    if (!q) return;

    const roundBadge = document.getElementById('m-quiz-round-badge');
    if (roundBadge) roundBadge.textContent = `${quizCurrentRound}. Tur`;

    const catBadge = document.getElementById('m-quiz-category-badge');
    if (catBadge) catBadge.textContent = q.category || 'Genel Kültür';

    const qtypeBadge = document.getElementById('m-quiz-qtype-badge');
    if (qtypeBadge) {
      if (q.type === 'tf') {
        qtypeBadge.textContent = '✓/✗ Doğru / Yanlış';
        qtypeBadge.style.color = '#10b981';
        qtypeBadge.style.background = 'rgba(16, 185, 129, 0.12)';
      } else if (q.type === 'fib') {
        qtypeBadge.textContent = '📝 Boşluk Doldurma';
        qtypeBadge.style.color = '#8b5cf6';
        qtypeBadge.style.background = 'rgba(139, 92, 246, 0.12)';
      } else {
        qtypeBadge.textContent = '🔤 Çoktan Seçmeli';
        qtypeBadge.style.color = '#3b82f6';
        qtypeBadge.style.background = 'rgba(59, 130, 246, 0.12)';
      }
    }

    const activeStudentEl = document.getElementById('m-quiz-active-student-name');
    if (activeStudentEl) {
      activeStudentEl.textContent = quizActiveStudent || 'Öğrenci Seçilmedi (Kura Çekebilirsiniz)';
    }

    const scoreBadge = document.getElementById('m-quiz-score-badge');
    if (scoreBadge) {
      let stScore = 0;
      if (quizActiveStudent && quizStudentScores[quizActiveStudent]) {
        const sc = quizStudentScores[quizActiveStudent];
        stScore = typeof sc === 'number' ? sc : (sc.score || 0);
      } else {
        stScore = quizScore;
      }
      scoreBadge.textContent = `Skor: ${stScore}`;
    }

    const qText = document.getElementById('m-quiz-question-text');
    if (qText) {
      let txt = q.text || q.question || '';
      if (q.type === 'fib') {
        txt = escapeHTML(txt).replace(/\[___\]/g, '<span style="border-bottom: 2px dashed var(--m-primary); color: var(--m-primary); padding: 0 8px; font-weight: 900;">____</span>');
        qText.innerHTML = txt;
      } else {
        qText.textContent = txt;
      }
    }

    const imgWrap = document.getElementById('m-quiz-question-image-wrap');
    const imgEl = document.getElementById('m-quiz-question-image');
    if (imgWrap && imgEl) {
      if (q.image) {
        imgEl.src = q.image;
        imgWrap.style.display = 'block';
      } else {
        imgWrap.style.display = 'none';
      }
    }

    const expBox = document.getElementById('m-quiz-explanation-box');
    const expText = document.getElementById('m-quiz-explanation-text');
    if (expBox) expBox.style.display = 'none';
    if (expText) expText.textContent = '';

    const optContainer = document.getElementById('m-quiz-options-container');
    if (optContainer) {
      optContainer.innerHTML = '';
      if (q.type === 'tf') {
        const correctVal = (q.answer === true || q.answer === 'true');
        optContainer.innerHTML = `
          <div class="game-quiz-tf-grid">
            <button class="game-quiz-tf-btn tf-true" onclick="window.handleQuizAnswer(true, ${correctVal})">
              <span style="font-size: 1.4rem;">✓</span>
              <span>DOĞRU</span>
            </button>
            <button class="game-quiz-tf-btn tf-false" onclick="window.handleQuizAnswer(false, ${correctVal})">
              <span style="font-size: 1.4rem;">✗</span>
              <span>YANLIŞ</span>
            </button>
          </div>
        `;
      } else {
        const opts = q.options || [];
        const correctIdx = (typeof q.answer === 'number') ? q.answer : ((typeof q.correct === 'number') ? q.correct : 0);
        optContainer.innerHTML = opts.map((opt, i) => `
          <button class="game-quiz-btn" onclick="window.handleQuizAnswer(${i}, ${correctIdx})">
            <span style="width: 28px; height: 28px; border-radius: 50%; background: var(--m-surface); border: 1.5px solid var(--m-border); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; flex-shrink: 0;">
              ${String.fromCharCode(65 + i)}
            </span>
            <span style="flex: 1; text-align: left;">${escapeHTML(opt)}</span>
          </button>
        `).join('');
      }
    }

    startQuizTimer();
  }

  window.handleQuizAnswer = (selectedAns, correctAns) => {
    if (quizHasAnsweredCurrent) return;
    quizHasAnsweredCurrent = true;
    stopQuizTimer();

    const isCorrect = (selectedAns === correctAns);
    const q = mobileQuizFilteredQuestions[currentQuizIdx];

    if (q && q.type === 'tf') {
      const tfBtns = document.querySelectorAll('.game-quiz-tf-btn');
      tfBtns.forEach(btn => {
        btn.disabled = true;
        const isTrueBtn = btn.classList.contains('tf-true');
        if (isTrueBtn === correctAns) btn.classList.add('correct');
        if (isTrueBtn === selectedAns && !isCorrect) btn.classList.add('wrong');
      });
    } else {
      const btns = document.querySelectorAll('.game-quiz-btn');
      btns.forEach((btn, i) => {
        btn.disabled = true;
        if (i === correctAns) btn.classList.add('correct');
        if (i === selectedAns && !isCorrect) btn.classList.add('wrong');
      });
    }

    if (isCorrect) {
      window.vibrate(35);
      if (quizSoundEnabled) playSynthChime('correct');
      quizScore += 10;
      showMobileToast('👏 Doğru Cevap! (+10 Puan)');

      if (quizActiveStudent) {
        if (!quizStudentScores[quizActiveStudent]) {
          quizStudentScores[quizActiveStudent] = { score: 10, correctCount: 1, incorrectCount: 0 };
        } else if (typeof quizStudentScores[quizActiveStudent] === 'number') {
          quizStudentScores[quizActiveStudent] = { score: quizStudentScores[quizActiveStudent] + 10, correctCount: 1, incorrectCount: 0 };
        } else {
          quizStudentScores[quizActiveStudent].score = (quizStudentScores[quizActiveStudent].score || 0) + 10;
          quizStudentScores[quizActiveStudent].correctCount = (quizStudentScores[quizActiveStudent].correctCount || 0) + 1;
        }
        localStorage.setItem("tf_student_scores", JSON.stringify(quizStudentScores));
      }
    } else {
      window.vibrate(90);
      if (quizSoundEnabled) playSynthChime('wrong');
      showMobileToast('❌ Yanlış Cevap');

      if (quizActiveStudent) {
        if (!quizStudentScores[quizActiveStudent]) {
          quizStudentScores[quizActiveStudent] = { score: 0, correctCount: 0, incorrectCount: 1 };
        } else if (typeof quizStudentScores[quizActiveStudent] === 'number') {
          quizStudentScores[quizActiveStudent] = { score: quizStudentScores[quizActiveStudent], correctCount: 0, incorrectCount: 1 };
        } else {
          quizStudentScores[quizActiveStudent].incorrectCount = (quizStudentScores[quizActiveStudent].incorrectCount || 0) + 1;
        }
        localStorage.setItem("tf_student_scores", JSON.stringify(quizStudentScores));
      }
    }

    const scoreBadge = document.getElementById('m-quiz-score-badge');
    if (scoreBadge) {
      let stScore = 0;
      if (quizActiveStudent && quizStudentScores[quizActiveStudent]) {
        const sc = quizStudentScores[quizActiveStudent];
        stScore = typeof sc === 'number' ? sc : (sc.score || 0);
      } else {
        stScore = quizScore;
      }
      scoreBadge.textContent = `Skor: ${stScore}`;
    }

    if (q && q.explanation) {
      const expBox = document.getElementById('m-quiz-explanation-box');
      const expText = document.getElementById('m-quiz-explanation-text');
      if (expBox && expText) {
        expText.textContent = q.explanation;
        expBox.style.display = 'block';
      }
    }
  };

  window.nextQuizQuestion = () => {
    currentQuizIdx++;
    renderCurrentQuizQuestion();
  };

  window.skipQuizQuestion = () => {
    stopQuizTimer();
    showMobileToast('⏭️ Soru Pas Geçildi');
    currentQuizIdx++;
    renderCurrentQuizQuestion();
  };

  window.restartQuizGame = () => {
    stopQuizTimer();
    currentQuizIdx = 0;
    quizScore = 0;
    applyQuizFilters();
    renderCurrentQuizQuestion();
    showMobileToast('🔄 Yarışma Yeniden Başlatıldı!');
  };

  window.confirmExitQuizGame = () => {
    stopQuizTimer();
    window.backToGamesLanding();
  };

  window.toggleQuizSound = () => {
    quizSoundEnabled = !quizSoundEnabled;
    const icon = document.getElementById('m-quiz-sound-icon');
    if (icon) icon.textContent = quizSoundEnabled ? '🔊' : '🔇';
    try {
      const s = JSON.parse(localStorage.getItem("m_quiz_settings") || "{}");
      s.soundEnabled = quizSoundEnabled;
      localStorage.setItem("m_quiz_settings", JSON.stringify(s));
    } catch (e) {}
    showMobileToast(quizSoundEnabled ? '🔊 Ses efektleri açıldı' : '🔇 Ses efektleri kapatıldı');
  };

  // Kura Çekimi
  window.pickRandomQuizStudent = () => {
    if (!quizSelectedStudentNames || quizSelectedStudentNames.length === 0) {
      showMobileToast('⚠️ Lütfen önce yarışmacı havuzundan öğrenci seçin!');
      window.switchQuizView('students');
      return;
    }

    if (!quizUnselectedStudents || quizUnselectedStudents.length === 0) {
      quizCurrentRound++;
      quizUnselectedStudents = [...quizSelectedStudentNames];
      localStorage.setItem("tf_unselected_students", JSON.stringify(quizUnselectedStudents));
      showMobileToast(`🎉 Tüm öğrenciler cevapladı! ${quizCurrentRound}. Tura geçildi!`);
    }

    openBottomSheet('modal-quiz-raffle');

    const spinner = document.getElementById('m-quiz-raffle-spinner');
    const confirmBtn = document.getElementById('btn-quiz-raffle-confirm');
    const subtext = document.getElementById('m-quiz-raffle-subtext');

    if (confirmBtn) confirmBtn.style.display = 'none';
    if (subtext) subtext.textContent = 'Sıradaki soruyu cevaplayacak şanslı öğrenci belirleniyor!';

    let ticks = 0;
    const maxTicks = 20;
    const pool = [...quizUnselectedStudents];

    const spinInterval = setInterval(() => {
      ticks++;
      const randomIdx = Math.floor(Math.random() * pool.length);
      const candidate = pool[randomIdx] || 'Öğrenci';
      if (spinner) spinner.textContent = candidate;
      if (quizSoundEnabled) playSynthChime('tick');

      if (ticks >= maxTicks) {
        clearInterval(spinInterval);
        const winnerIdx = Math.floor(Math.random() * quizUnselectedStudents.length);
        const winner = quizUnselectedStudents[winnerIdx];
        quizRafflePendingWinner = winner;

        quizUnselectedStudents.splice(winnerIdx, 1);
        localStorage.setItem("tf_unselected_students", JSON.stringify(quizUnselectedStudents));

        if (spinner) {
          spinner.innerHTML = `🌟 ${escapeHTML(winner)} 🌟`;
          spinner.style.borderColor = 'var(--m-success)';
          spinner.style.color = 'var(--m-primary)';
        }
        if (subtext) subtext.textContent = 'Tebrikler! Sıradaki soru senin için geliyor.';
        if (confirmBtn) confirmBtn.style.display = 'inline-flex';
        if (quizSoundEnabled) playSynthChime('fanfare');
        window.vibrate(50);
      }
    }, 80);
  };

  window.confirmQuizRaffleWinner = () => {
    if (quizRafflePendingWinner) {
      quizActiveStudent = quizRafflePendingWinner;
      quizRafflePendingWinner = null;
    }
    window.closeBottomSheet();
    window.switchQuizView('play');
    renderCurrentQuizQuestion();
  };

  // Öğrenci Listesi / Havuzu
  function renderQuizStudentsRoster() {
    const listEl = document.getElementById('m-quiz-students-roster-list');
    const badgeEl = document.getElementById('m-quiz-students-count-badge');
    if (!listEl) return;

    const allStudents = getMobileQuizActiveStudents();
    if (badgeEl) {
      badgeEl.textContent = `${quizSelectedStudentNames.length} / ${allStudents.length} Seçili`;
    }

    if (allStudents.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--m-text-muted);">
          <div style="font-size: 2rem; margin-bottom: 6px;">👥</div>
          <div>Kayıtlı öğrenci bulunamadı. Lütfen sınıfa öğrenci ekleyin.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = allStudents.map(st => {
      const name = getStudentDisplayName(st);
      const isSelected = quizSelectedStudentNames.includes(name);
      let sc = quizStudentScores[name];
      let pts = 0;
      let corr = 0;
      let incorr = 0;
      if (typeof sc === 'number') {
        pts = sc;
      } else if (sc) {
        pts = sc.score || 0;
        corr = sc.correctCount || 0;
        incorr = sc.incorrectCount || 0;
      }

      return `
        <div class="m-quiz-student-item ${isSelected ? 'selected' : ''}" onclick="window.toggleQuizStudentSelection('${escapeHTML(name)}')">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); window.toggleQuizStudentSelection('${escapeHTML(name)}')">
          <div class="student-avatar" style="width: 32px; height: 32px; font-size: 0.82rem;">
            ${escapeHTML(name.charAt(0).toUpperCase())}
          </div>
          <div class="student-info">
            <div class="student-name">${escapeHTML(name)}</div>
            <div class="student-meta">${corr} Doğru • ${incorr} Yanlış</div>
          </div>
          <div class="student-score">${pts} Puan</div>
        </div>
      `;
    }).join('');
  }

  window.toggleQuizStudentSelection = (name) => {
    const idx = quizSelectedStudentNames.indexOf(name);
    if (idx >= 0) {
      quizSelectedStudentNames.splice(idx, 1);
    } else {
      quizSelectedStudentNames.push(name);
    }
    localStorage.setItem("quiz_selected_students", JSON.stringify(quizSelectedStudentNames));

    quizUnselectedStudents = quizUnselectedStudents.filter(n => quizSelectedStudentNames.includes(n));
    if (idx < 0 && !quizUnselectedStudents.includes(name)) {
      quizUnselectedStudents.push(name);
    }
    localStorage.setItem("tf_unselected_students", JSON.stringify(quizUnselectedStudents));

    renderQuizStudentsRoster();
  };

  window.selectAllQuizStudents = (selectAll) => {
    const allStudents = getMobileQuizActiveStudents();
    const allNames = allStudents.map(s => getStudentDisplayName(s));
    if (selectAll) {
      quizSelectedStudentNames = [...allNames];
      quizUnselectedStudents = [...allNames];
    } else {
      quizSelectedStudentNames = [];
      quizUnselectedStudents = [];
    }
    localStorage.setItem("quiz_selected_students", JSON.stringify(quizSelectedStudentNames));
    localStorage.setItem("tf_unselected_students", JSON.stringify(quizUnselectedStudents));
    renderQuizStudentsRoster();
    showMobileToast(selectAll ? 'Tüm öğrenciler seçildi' : 'Seçimler temizlendi');
  };

  // Soru Havuzu Yönetimi
  function renderQuizPoolList() {
    const container = document.getElementById('m-quiz-pool-list-container');
    const countBadge = document.getElementById('m-quiz-pool-count-badge');
    const catSelect = document.getElementById('m-quiz-pool-category-filter');
    if (!container) return;

    if (catSelect) {
      const cats = Array.from(new Set(mobileQuizQuestions.map(q => q.category).filter(Boolean)));
      catSelect.innerHTML = `<option value="all">Tüm Konular / Paketler</option>` +
        cats.map(c => `<option value="${escapeHTML(c)}" ${quizPoolCategoryFilter === c ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('');
    }

    let list = [...mobileQuizQuestions];
    if (quizPoolCategoryFilter && quizPoolCategoryFilter !== 'all') {
      list = list.filter(q => q.category === quizPoolCategoryFilter);
    }
    if (quizPoolSearchText && quizPoolSearchText.trim() !== '') {
      const st = quizPoolSearchText.toLowerCase().trim();
      list = list.filter(q => (q.text || '').toLowerCase().includes(st) || (q.category || '').toLowerCase().includes(st));
    }

    if (countBadge) countBadge.textContent = `${list.length} Soru`;

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 6px;">📦</div>
          <div>Filtrelere uygun soru bulunamadı.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(q => {
      let typeLabel = 'Çoktan Seçmeli';
      let typeColor = '#3b82f6';
      if (q.type === 'tf') {
        typeLabel = 'Doğru / Yanlış';
        typeColor = '#10b981';
      } else if (q.type === 'fib') {
        typeLabel = 'Boşluk Doldur';
        typeColor = '#8b5cf6';
      }

      let answerDisplay = '';
      if (q.type === 'tf') {
        const isTrue = (q.answer === true || q.answer === 'true');
        answerDisplay = isTrue ? '✓ DOĞRU' : '✗ YANLIŞ';
      } else if (q.options && q.options.length > 0) {
        const corrIdx = Number(q.answer) || 0;
        const letter = String.fromCharCode(65 + corrIdx);
        answerDisplay = `${letter}) ${escapeHTML(q.options[corrIdx] || '')}`;
      }

      return `
        <div class="m-quiz-pool-card">
          <div class="m-quiz-pool-card-header">
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              <span class="m-badge" style="background: rgba(99,102,241,0.1); color: ${typeColor}; font-weight: 800; font-size: 0.7rem;">
                ${typeLabel}
              </span>
              <span class="m-badge" style="background: var(--m-surface-subtle); color: var(--m-text-muted); font-size: 0.7rem;">
                ${escapeHTML(q.category || 'Genel')}
              </span>
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="m-icon-btn" onclick="window.openQuizAddQuestionModal(${q.id})" title="Düzenle" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--m-border); background: var(--m-surface); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 0.8rem;">✏️</span>
              </button>
              <button class="m-icon-btn" onclick="window.deleteQuizQuestion(${q.id})" title="Sil" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--m-border); background: var(--m-surface); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--m-danger);">
                <span style="font-size: 0.8rem;">🗑️</span>
              </button>
            </div>
          </div>
          <div class="m-quiz-pool-card-text">
            ${escapeHTML(q.text || '')}
          </div>
          <div class="m-quiz-pool-card-ans">
            <span style="color: var(--m-primary); font-weight: 800;">Doğru Cevap:</span> ${answerDisplay}
          </div>
          ${q.explanation ? `<div style="font-size: 0.74rem; color: var(--m-text-muted); margin-top: 4px; font-style: italic;">💡 ${escapeHTML(q.explanation)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  window.filterQuizPoolByCategory = (cat) => {
    quizPoolCategoryFilter = cat;
    renderQuizPoolList();
  };

  window.filterQuizPoolBySearch = (txt) => {
    quizPoolSearchText = txt;
    renderQuizPoolList();
  };

  window.deleteQuizQuestion = (id) => {
    if (!confirm('Bu soruyu havuzdan silmek istediğinize emin misiniz?')) return;
    mobileQuizQuestions = mobileQuizQuestions.filter(q => q.id !== id);
    localStorage.setItem("tf_questions", JSON.stringify(mobileQuizQuestions));
    if (window.stateManager && window.stateManager.state) {
      window.stateManager.state.quizQuestions = mobileQuizQuestions;
    }
    applyQuizFilters();
    renderQuizPoolList();
    showMobileToast('Soru havuzdan silindi.');
  };

  window.restoreDefaultQuizQuestions = () => {
    if (!confirm('Örnek soruları tekrar yüklemek istediğinize emin misiniz? Mevcut havuz sıfırlanacaktır.')) return;
    mobileQuizQuestions = [...defaultMobileQuizQuestions];
    localStorage.setItem("tf_questions", JSON.stringify(mobileQuizQuestions));
    if (window.stateManager && window.stateManager.state) {
      window.stateManager.state.quizQuestions = mobileQuizQuestions;
    }
    applyQuizFilters();
    renderQuizPoolList();
    showMobileToast('Örnek sorular başarıyla yüklendi! (17 Soru)');
  };

  // Soru Ekleme / Düzenleme
  window.openQuizAddQuestionModal = (editId) => {
    const editIdInput = document.getElementById('m-qform-edit-id');
    const formTitle = document.getElementById('m-quiz-form-title');
    const catSelect = document.getElementById('m-qform-category-select');
    const catCustom = document.getElementById('m-qform-category-custom');
    const textInput = document.getElementById('m-qform-text');
    const expInput = document.getElementById('m-qform-explanation');
    const imgInput = document.getElementById('m-qform-image');

    const cats = Array.from(new Set(mobileQuizQuestions.map(q => q.category).filter(Boolean)));
    if (catSelect) {
      catSelect.innerHTML = cats.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('') +
        `<option value="__new__">+ Yeni Konu Ekle...</option>`;
    }

    if (editId) {
      const q = mobileQuizQuestions.find(item => item.id == editId);
      if (!q) return;
      if (editIdInput) editIdInput.value = editId;
      if (formTitle) formTitle.textContent = 'Soruyu Düzenle';
      if (textInput) textInput.value = q.text || '';
      if (expInput) expInput.value = q.explanation || '';
      if (imgInput) imgInput.value = q.image || '';

      if (catSelect) {
        if (cats.includes(q.category)) {
          catSelect.value = q.category;
          if (catCustom) catCustom.value = '';
        } else {
          catSelect.value = '__new__';
          if (catCustom) catCustom.value = q.category || '';
        }
      }

      window.setQuizFormType(q.type || 'tf');

      if (q.type === 'tf') {
        const isTrue = (q.answer === true || q.answer === 'true');
        const radios = document.getElementsByName('m-qform-tf-ans');
        radios.forEach(r => {
          r.checked = (r.value === 'true' && isTrue) || (r.value === 'false' && !isTrue);
        });
      } else {
        const opts = q.options || [];
        for (let i = 0; i < 4; i++) {
          const optInput = document.getElementById(`m-qform-opt-${i}`);
          if (optInput) optInput.value = opts[i] || '';
        }
        const radios = document.getElementsByName('m-qform-mc-correct');
        const corrIdx = Number(q.answer) || 0;
        radios.forEach(r => {
          r.checked = (Number(r.value) === corrIdx);
        });
      }
    } else {
      if (editIdInput) editIdInput.value = '';
      if (formTitle) formTitle.textContent = 'Yeni Soru Hazırla';
      if (textInput) textInput.value = '';
      if (expInput) expInput.value = '';
      if (imgInput) imgInput.value = '';
      if (catCustom) catCustom.value = '';
      for (let i = 0; i < 4; i++) {
        const optInput = document.getElementById(`m-qform-opt-${i}`);
        if (optInput) optInput.value = '';
      }
      window.setQuizFormType('tf');
    }

    openBottomSheet('modal-quiz-add-question');
  };

  window.setQuizFormType = (type) => {
    quizFormActiveType = type;
    const btnTf = document.getElementById('btn-qtype-tf');
    const btnMc = document.getElementById('btn-qtype-mc');
    const btnFib = document.getElementById('btn-qtype-fib');

    const tfOptions = document.getElementById('m-qform-options-tf');
    const mcOptions = document.getElementById('m-qform-options-mc');

    const setActive = (btn, active) => {
      if (!btn) return;
      if (active) {
        btn.style.background = 'var(--m-primary)';
        btn.style.borderColor = 'var(--m-primary)';
        btn.style.color = 'white';
        btn.style.fontWeight = '800';
      } else {
        btn.style.background = 'var(--m-surface)';
        btn.style.borderColor = 'var(--m-border)';
        btn.style.color = 'var(--m-text)';
        btn.style.fontWeight = '700';
      }
    };

    setActive(btnTf, type === 'tf');
    setActive(btnMc, type === 'mc');
    setActive(btnFib, type === 'fib');

    if (type === 'tf') {
      if (tfOptions) tfOptions.style.display = 'block';
      if (mcOptions) mcOptions.style.display = 'none';
    } else {
      if (tfOptions) tfOptions.style.display = 'none';
      if (mcOptions) mcOptions.style.display = 'block';
    }
  };

  window.handleQuizFormCategoryChange = (val) => {
    const catCustom = document.getElementById('m-qform-category-custom');
    if (val === '__new__') {
      if (catCustom) {
        catCustom.focus();
        catCustom.placeholder = 'Yeni konu adını giriniz...';
      }
    }
  };

  window.saveQuizQuestionFromForm = () => {
    const editId = document.getElementById('m-qform-edit-id')?.value;
    const text = document.getElementById('m-qform-text')?.value?.trim();
    if (!text) {
      showMobileToast('⚠️ Lütfen soru metnini yazınız!');
      return;
    }

    const catSelect = document.getElementById('m-qform-category-select');
    const catCustom = document.getElementById('m-qform-category-custom');
    let category = 'Genel Kültür';
    if (catSelect && catSelect.value === '__new__') {
      category = catCustom?.value?.trim() || 'Özel';
    } else if (catSelect && catSelect.value) {
      category = catSelect.value;
    }

    const explanation = document.getElementById('m-qform-explanation')?.value?.trim() || '';
    const image = document.getElementById('m-qform-image')?.value?.trim() || '';

    let questionObj = {
      id: editId ? Number(editId) : Date.now(),
      type: quizFormActiveType,
      category,
      text,
      explanation,
      image
    };

    if (quizFormActiveType === 'tf') {
      const radios = document.getElementsByName('m-qform-tf-ans');
      let ans = true;
      radios.forEach(r => { if (r.checked) ans = (r.value === 'true'); });
      questionObj.answer = ans;
    } else {
      const opts = [];
      for (let i = 0; i < 4; i++) {
        const val = document.getElementById(`m-qform-opt-${i}`)?.value?.trim() || '';
        opts.push(val);
      }
      if (!opts[0] || !opts[1]) {
        showMobileToast('⚠️ En az 2 seçenek (A ve B) doldurulmalıdır!');
        return;
      }
      questionObj.options = opts;

      const radios = document.getElementsByName('m-qform-mc-correct');
      let corr = 0;
      radios.forEach(r => { if (r.checked) corr = Number(r.value); });
      questionObj.answer = corr;
    }

    if (editId) {
      const idx = mobileQuizQuestions.findIndex(q => q.id == editId);
      if (idx >= 0) {
        mobileQuizQuestions[idx] = questionObj;
      } else {
        mobileQuizQuestions.push(questionObj);
      }
      showMobileToast('✓ Soru güncellendi!');
    } else {
      mobileQuizQuestions.unshift(questionObj);
      showMobileToast('✓ Yeni soru havuza eklendi!');
    }

    localStorage.setItem("tf_questions", JSON.stringify(mobileQuizQuestions));
    if (window.stateManager && window.stateManager.state) {
      window.stateManager.state.quizQuestions = mobileQuizQuestions;
    }

    applyQuizFilters();
    window.closeBottomSheet();
    renderQuizPoolList();
  };

  // Skor Tablosu
  function renderQuizLeaderboard() {
    const listEl = document.getElementById('m-quiz-leaderboard-list');
    if (!listEl) return;

    const allStudents = getMobileQuizActiveStudents();
    const ranked = allStudents.map(st => {
      const name = getStudentDisplayName(st);
      let sc = quizStudentScores[name];
      let pts = 0;
      let corr = 0;
      let incorr = 0;
      if (typeof sc === 'number') {
        pts = sc;
      } else if (sc) {
        pts = sc.score || 0;
        corr = sc.correctCount || 0;
        incorr = sc.incorrectCount || 0;
      }
      return { id: st.id, name, pts, corr, incorr };
    }).sort((a, b) => b.pts - a.pts);

    if (ranked.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--m-text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 6px;">🏆</div>
          <div>Liderlik tablosu henüz boş.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = ranked.map((st, i) => {
      let rankBadge = `${i + 1}.`;
      if (i === 0) rankBadge = '🥇';
      else if (i === 1) rankBadge = '🥈';
      else if (i === 2) rankBadge = '🥉';

      return `
        <div class="m-quiz-leaderboard-row ${i === 0 ? 'rank-1' : ''}">
          <div class="rank-num">${rankBadge}</div>
          <div class="player-info">
            <div class="player-name">${escapeHTML(st.name)}</div>
            <div class="player-stats">${st.corr} Doğru • ${st.incorr} Yanlış</div>
          </div>
          <div class="player-pts">${st.pts} Puan</div>
        </div>
      `;
    }).join('');
  }

  window.transferQuizScoresToClassPoints = () => {
    const allStudents = getMobileQuizActiveStudents();
    let transferCount = 0;
    let totalPoints = 0;

    allStudents.forEach(st => {
      const name = getStudentDisplayName(st);
      let sc = quizStudentScores[name];
      let pts = 0;
      if (typeof sc === 'number') pts = sc;
      else if (sc) pts = sc.score || 0;

      if (pts > 0 && window.stateManager && typeof window.stateManager.addScore === 'function') {
        window.stateManager.addScore(st.id, pts, 'Bilgi Yarışması');
        transferCount++;
        totalPoints += pts;
      }
    });

    if (transferCount === 0) {
      showMobileToast('Aktarılacak pozitif puan bulunamadı.');
      return;
    }

    showMobileToast(`⭐ ${transferCount} öğrenciye toplam ${totalPoints} puan başarıyla aktarıldı!`);
    window.vibrate(40);
  };

  window.resetQuizScores = () => {
    if (!confirm('Tüm yarışma skorlarını sıfırlamak istediğinize emin misiniz?')) return;
    quizStudentScores = {};
    quizScore = 0;
    localStorage.removeItem("tf_student_scores");
    renderQuizLeaderboard();
    showMobileToast('Skorlar sıfırlandı.');
  };

  // Ayarlar Modalı
  window.openQuizSettingsModal = () => {
    const timerSelect = document.getElementById('m-quiz-setting-timer');
    const qtypeSelect = document.getElementById('m-quiz-setting-qtype');
    const catSelect = document.getElementById('m-quiz-setting-category');
    const soundCheck = document.getElementById('m-quiz-setting-sound');

    if (timerSelect) timerSelect.value = String(quizTimerDuration);
    if (qtypeSelect) qtypeSelect.value = quizFilterType;
    if (soundCheck) soundCheck.checked = quizSoundEnabled;

    if (catSelect) {
      const cats = Array.from(new Set(mobileQuizQuestions.map(q => q.category).filter(Boolean)));
      catSelect.innerHTML = `<option value="all">Tüm Konular / Paketler</option>` +
        cats.map(c => `<option value="${escapeHTML(c)}" ${quizFilterCategory === c ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('');
    }

    openBottomSheet('modal-quiz-settings');
  };

  window.saveQuizSettingsFromModal = () => {
    const timerSelect = document.getElementById('m-quiz-setting-timer');
    const qtypeSelect = document.getElementById('m-quiz-setting-qtype');
    const catSelect = document.getElementById('m-quiz-setting-category');
    const soundCheck = document.getElementById('m-quiz-setting-sound');

    if (timerSelect) quizTimerDuration = parseInt(timerSelect.value) || 0;
    if (qtypeSelect) quizFilterType = qtypeSelect.value;
    if (catSelect) quizFilterCategory = catSelect.value;
    if (soundCheck) quizSoundEnabled = soundCheck.checked;

    const icon = document.getElementById('m-quiz-sound-icon');
    if (icon) icon.textContent = quizSoundEnabled ? '🔊' : '🔇';

    const settingsObj = {
      timerSeconds: quizTimerDuration,
      qType: quizFilterType,
      category: quizFilterCategory,
      soundEnabled: quizSoundEnabled
    };
    localStorage.setItem("m_quiz_settings", JSON.stringify(settingsObj));

    applyQuizFilters();
    window.closeBottomSheet();
    renderCurrentQuizQuestion();
    showMobileToast('✓ Oyun ve zaman ayarları kaydedildi!');
  };

  // Oyun 2: Çarpım Tablosu Düellosu
  window.startMobileMathGame = () => {
    const landing = document.getElementById('m-games-landing');
    const arenaMath = document.getElementById('m-arena-math');
    const title = document.getElementById('m-games-header-title');
    if (landing) landing.style.display = 'none';
    if (arenaMath) arenaMath.style.display = 'block';
    if (title) title.textContent = 'Çarpım Tablosu';

    mathStreak = 0;
    mathScore = 0;
    nextMathQuestion();
  };

  function nextMathQuestion() {
    const a = Math.floor(Math.random() * 8) + 2; // 2..9
    const b = Math.floor(Math.random() * 8) + 2; // 2..9
    mathCurrentAnswer = a * b;

    const formulaEl = document.getElementById('m-math-formula');
    const streakEl = document.getElementById('m-math-streak');
    const scoreEl = document.getElementById('m-math-score');
    const optContainer = document.getElementById('m-math-options-container');

    if (formulaEl) formulaEl.textContent = `${a} × ${b} = ?`;
    if (streakEl) streakEl.textContent = `🔥 Seri: ${mathStreak}`;
    if (scoreEl) scoreEl.textContent = `Doğru: ${mathScore}`;

    // 4 seçenek oluştur (1 doğru, 3 çeldirici)
    const options = new Set([mathCurrentAnswer]);
    while (options.size < 4) {
      const offset = (Math.floor(Math.random() * 7) - 3) * (Math.random() > 0.5 ? a : b);
      const fake = mathCurrentAnswer + (offset !== 0 ? offset : (Math.random() > 0.5 ? 2 : -2));
      if (fake > 0 && fake !== mathCurrentAnswer) options.add(fake);
    }
    const shuffled = Array.from(options).sort(() => Math.random() - 0.5);

    if (optContainer) {
      optContainer.innerHTML = shuffled.map(val => `
        <button class="game-quiz-btn" style="justify-content: center; font-size: 1.4rem; font-weight: 800; padding: 1.25rem 0.5rem;" onclick="window.handleMathAnswer(${val})">
          ${val}
        </button>
      `).join('');
    }
  }

  window.handleMathAnswer = (val) => {
    if (val === mathCurrentAnswer) {
      window.vibrate(30);
      playSynthChime('correct');
      mathStreak++;
      mathScore++;
      showMobileToast(`👏 Harika! Doğru (${val})`);
      setTimeout(nextMathQuestion, 300);
    } else {
      window.vibrate(120);
      playSynthChime('wrong');
      mathStreak = 0;
      showMobileToast(`❌ Yanlış! Doğrusu: ${mathCurrentAnswer}`);
      setTimeout(nextMathQuestion, 700);
    }
  };

  // Oyun 3: Hazine Sandığı
  const treasurePrizes = [
    { text: "🪙 +10 Altın Puan", points: 10, icon: "🪙" },
    { text: "⭐ +5 Yıldız Puanı", points: 5, icon: "⭐" },
    { text: "💎 +15 Elmas Puan", points: 15, icon: "💎" },
    { text: "❓ Soru Kartı: Soruyu Bil, 20 Puanı Kap!", points: 20, icon: "📜" },
    { text: "🎁 Sürpriz Alkış & Tebrik", points: 2, icon: "🎁" },
    { text: "🛡️ Şans Kalkanı (+3 Puan)", points: 3, icon: "🛡️" }
  ];

  window.startMobileTreasureGame = () => {
    const landing = document.getElementById('m-games-landing');
    const arenaTreasure = document.getElementById('m-arena-treasure');
    const title = document.getElementById('m-games-header-title');
    if (landing) landing.style.display = 'none';
    if (arenaTreasure) arenaTreasure.style.display = 'block';
    if (title) title.textContent = 'Hazine Sandığı';

    window.resetTreasureChests();
  };

  window.resetTreasureChests = () => {
    const grid = document.getElementById('m-treasure-chests-grid');
    const resBox = document.getElementById('m-treasure-result');
    if (resBox) resBox.style.display = 'none';

    // 6 sandığı karıştır
    const shuffled = [...treasurePrizes].sort(() => Math.random() - 0.5);

    if (grid) {
      grid.innerHTML = [1, 2, 3, 4, 5, 6].map((num, i) => `
        <div class="treasure-chest-box" id="chest-${i}" onclick="window.openTreasureChest(${i}, '${escapeHTML(shuffled[i].text)}', ${shuffled[i].points}, '${shuffled[i].icon}')">
          <div style="font-size: 2.2rem;">📦</div>
          <div style="font-size: 0.85rem; font-weight: 800; color: var(--m-text);">Sandık ${num}</div>
        </div>
      `).join('');
    }
  };

  window.openTreasureChest = (chestIdx, prizeText, points, icon) => {
    const chest = document.getElementById(`chest-${chestIdx}`);
    if (chest && chest.classList.contains('opened')) return;

    window.vibrate(50);
    playSynthChime('fanfare');

    if (chest) {
      chest.classList.add('opened');
      chest.innerHTML = `
        <div style="font-size: 2.2rem; animation: tabFadeIn 0.3s;">${icon}</div>
        <div style="font-size: 0.75rem; font-weight: 800; color: var(--m-warning);">AÇILDI</div>
      `;
    }

    const resBox = document.getElementById('m-treasure-result');
    if (resBox) {
      resBox.style.display = 'block';
      resBox.innerHTML = `
        <div style="font-size: 1.15rem; font-weight: 800; color: var(--m-text);">${prizeText}</div>
        <div style="font-size: 0.8rem; color: var(--m-text-muted); margin-top: 4px;">Şanslı öğrencinize bu puanı hemen işleyebilirsiniz!</div>
      `;
    }
  };


  window.initMobileGames = initMobileGames;

})(window);
