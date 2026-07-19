(() => {
// Android ve web için blob indirme yardımcısı
function downloadBlob(blob, filename) {
  if (window.AndroidInterface && window.AndroidInterface.downloadFile) {
    const reader = new FileReader();
    reader.onload = function() {
      const base64 = reader.result.split(',')[1];
      window.AndroidInterface.downloadFile(base64, filename);
    };
    reader.readAsDataURL(blob);
  } else {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}
window.downloadBlob = downloadBlob;

// Kitap Değerlendirme Soruları Veri Tabanı
const PRELOADED_QUESTIONS = {
  'book_1': [
    { question: "Küçük Prens'in kendi gezegenindeki en değerli varlığı nedir ve ona nasıl bakardı?", answer: "En değerli varlığı tek bir güldür. Onu her gün sular, rüzgardan korumak için üzerine cam bir fanus örter ve tırtılları temizlerdi." },
    { question: "Küçük Prens, Dünya'ya gelmeden önce uğradığı gezegenlerde kimlerle karşılaştı?", answer: "Kral, Kendini Beğenmiş Adam, Sarhoş, İş Adamı, Fenerci ve Coğrafyacı ile karşılaşmıştır." },
    { question: "Küçük Prens ile tilki arasındaki dostluk bağı nasıl kuruldu? Tilkinin 'evcilleştirmek' kelimesine yüklediği anlam nedir?", answer: "Tilki, Küçük Prens'e kendisini evcilleştirmesini söylemiştir. 'Evcilleştirmek', bağ kurmak ve birbirleri için dünyada tek ve eşsiz hale gelmek demektir." },
    { question: "Yazarın çölde Küçük Prens ile karşılaşması onun hayata bakışını nasıl değiştirdi?", answer: "Yazar, büyüklerin yüzeysel dünyasından sıyrılarak çocuksu masumiyeti, hayal gücünü ve hayattaki gerçek değerlerin gözle görülmeyen, sadece kalple hissedilen şeyler olduğunu yeniden keşfetmiştir." },
    { question: "Küçük Prens kitabında büyüklerin dünyası ile çocukların dünyası nasıl karşılaştırılıyor?", answer: "Büyükler sayılarla, parayla ve mevkilerle ilgilenirken; çocuklar sevgiyle, merakla ve şeylerin özüyle ilgilenir." },
    { question: "Küçük Prens'in gezegenindeki yanardağları ve baobab ağaçlarını neden düzenli olarak temizlemesi gerekiyordu?", answer: "Baobab ağaçları temizlenmezse gezegeni tamamen kaplayıp kökleriyle patlatabilirdi. Yanardağları ise düzenli temizlemek onların birden patlamasını önler ve yavaşça yanmalarını sağlardı." }
  ],
  'book_2': [
    { question: "Zeze'nin en yakın dostu olan şeker portakalı fidanının adı nedir ve onunla nasıl konuşurdu?", answer: "Adı Minguinho'dur (veya Xururuca). Zeze onunla hayal gücü vasıtasıyla içinden konuşurdu; fidanın ona cevap verdiğini hissederdi." },
    { question: "Zeze'nin hayatını derinden etkileyen ve ona gerçek sevgiyi öğreten Portekizli (Portuga) ile dostluğu nasıl başladı?", answer: "Başlangıçta Portuga'nın arabasına kaçak bindiği için dayak yiyen Zeze, daha sonra ayağı yaralandığında Portuga'nın onu eczaneye götürüp tedavi ettirmesiyle onunla dost olmuştur." },
    { question: "Zeze'nin yaramazlıklarının arkasında yatan asıl sebepler nelerdir? Sınıftaki öğretmeni onun hakkında ne düşünüyordu?", answer: "Zeze çok zeki, hayal gücü geniş, sevgisiz kalmış ve ilgi arayan bir çocuktur. Öğretmeni (Cecilia Paim) onun çok iyi kalpli, paylaşımcı ve zeki olduğunu düşünür, ona sevgiyle yaklaşırdı." },
    { question: "Portuga'nın geçirdiği kaza haberi Zeze'yi nasıl etkiledi ve bu olaydan sonra Zeze nasıl olgunlaştı?", answer: "Portuga'nın tren kazasında ölmesi Zeze'yi yatağa düşürecek kadar ağır bir yasa boğmuştur. Bu kayıpla Zeze çocukluk masumiyetini geride bırakıp 'acıyı ve sevgiyi' tam anlamıyla keşfederek erken yaşta olgunlaşmıştır." },
    { question: "Şeker Portakalı kitabında 'acıyı keşfetmek' teması Zeze üzerinden nasıl işleniyor?", answer: "Zeze'nin fiziksel şiddete maruz kalması ve ardından hayattaki en sevdiği insan olan Portuga'yı aniden kaybetmesiyle, acının fiziksel bir yaradan çok kalpte hissedilen derin bir sızı olduğunu keşfetmesi üzerinden işlenir." },
    { question: "Zeze'nin ailesiyle olan ilişkisi nasıldı ve ailesi onun yaramazlıklarına nasıl tepki verirdi?", answer: "Ailesi yoksulluk ve çaresizlikten ötürü gergindi. Zeze'nin hayal gücünü ve yaramazlıklarını anlamak yerine onu sık sık ağır şekilde döverlerdi." }
  ],
  'book_3': [
    { question: "Christy Brown'ın doğumundan itibaren karşılaştığı en büyük fiziksel engel neydi ve ailesi buna nasıl yaklaştı?", answer: "Beyin felci (serebral palsi) nedeniyle tüm vücut kaslarını kontrol edemiyordu. Babası ve diğer insanlar onun zihinsel engelli olduğunu düşünürken, annesi onun zekasına inanmış ve onu asla dışlamamıştır." },
    { question: "Christy'nin ailesine zihinsel olarak sağlıklı olduğunu kanıtladığı ilk an (tebeşirle yazı yazma sahnesi) nasıl gerçekleşti?", answer: "Ablasının tebeşirini sol ayağıyla kapıp, annesinin yoğun cesaretlendirmesiyle yere zorlukla da olsa 'A' harfini çizmeyi başarmasıyla kanıtlamıştır." },
    { question: "Christy'nin resim yapmaya ve yazmaya başlamasında annesinin rolü nedir?", answer: "Annesi ona her zaman inanmış, maddi imkansızlıklara rağmen ona boyalar, kitaplar ve kağıtlar temin etmiş, onu pes etmemesi için sürekli desteklemiştir." },
    { question: "Sol Ayağım kitabında Christy'nin kardeşleriyle olan ilişkisi ve çocukluk oyunları nasıl anlatılıyor?", answer: "Kardeşleri onu arabasıyla sokaklara taşımış, çamur savaşlarına ve oyunlara dahil etmiştir. Christy kendini kardeşleri sayesinde dışlanmış hissetmemiştir." },
    { question: "Christy'nin ergenlik döneminde engeliyle yüzleşmesi ve yaşadığı içsel çatışmalar nelerdir?", answer: "Büyüdükçe diğer insanlardan farklı olduğunu, hiçbir zaman normal yürüyüp konuşamayacağını ve aşık olduğu kızlar tarafından sadece bir dost olarak görüldüğünü fark ederek derin bir bunalıma girmiştir." },
    { question: "Christy Brown'ın sol ayağını kullanarak başardığı en önemli şeyler nelerdir?", answer: "Sol ayağıyla resim yapmayı, daktiloda yazı yazmayı öğrenmiş ve kendi otobiyografisini (Sol Ayağım) yazarak dünyaca ünlü bir yazar ve ressam olmuştur." }
  ],
  'book_4': [
    { question: "Jim Hawkins'in hanında kalan gizemli denizci Billy Bones kimdir ve Jim'e ne bıraktı?", answer: "Kaptan Flint'in eski tayfasından olan eski bir korsandır. Korsanların elinden kaçırdığı ve içinde define adasının haritası olan eski bir sandık bırakmıştır." },
    { question: "Define haritasının bulunmasından sonra çıkılan Hispaniola gemisi yolculuğunda Jim, Kaptan Flint'in tayfasıyla ilgili ne öğrendi?", answer: "Elma fıçısının içine saklandığında, gemi aşçısı Uzun John Silver'ın Flint'in eski tayfasından korsanlarla isyan planladığını kulak misafiri olarak öğrenmiştir." },
    { question: "Uzun John Silver (Long John Silver) karakteri Jim için başlangıçta kimdi, sonradan nasıl bir tehlikeye dönüştü?", answer: "Başlangıçta cana yakın, korumacı bir gemi aşçısıydı. Ancak adaya varıldığında acımasız, kurnaz ve hazineye ulaşmak için herkesi öldürebilecek bir korsan lideri olduğu ortaya çıktı." },
    { question: "Define Adası'nda yıllardır mahsur kalan Ben Gunn kimdir ve Jim'e defineyi bulmasında nasıl yardım etmiştir?", answer: "Eski bir korsan olan ve adada tek başına bırakılan bir denizcidir. Defineyi korsanlardan önce bulup bir mağaraya saklamış ve Jim'in grubuna defineyi teslim etmiştir." },
    { question: "Jim Hawkins'in gemiyi korsanların elinden tek başına geri alma macerası nasıl gerçekleşti?", answer: "Ben Gunn'ın yaptığı küçük yerli derisi sandalla gece Hispaniola gemisine yaklaşmış, geminin çapa halatını kesmiş, korsan Israel Hands ile mücadele ederek gemiyi güvenli bir koya yönlendirmiştir." },
    { question: "Define Adası macerasının sonunda Jim ve arkadaşları adadan nasıl ayrıldılar ve defineye ne oldu?", answer: "Hazineyi gemiye yükleyip yola çıktılar. Uzun John Silver yolda bir limanda hazinenin bir kısmıyla kaçtı. Jim ve diğerleri sağ salim dönüp paylarını aldılar." }
  ]
};

const GENERIC_QUESTIONS = [
  { question: "Bu kitabın baş kahramanı kimdir ve onun en belirgin kişilik özelliği nedir?", answer: "Kitabın baş kahramanını belirterek; onun cesaret, merak, dürüstlük veya yardımseverlik gibi öne çıkan yönlerini açıklaması beklenir." },
  { question: "Kitabın geçtiği yer ve zaman hakkında bilgi verebilir misin?", answer: "Hikayenin yaşandığı mekanları (örn: bir köy, ada, okul) ve zaman dilimini (örn: geçmiş zaman, yaz mevsimi) tarif etmesi beklenir." },
  { question: "Kitaptaki olayların başlangıcına sebep olan ana sorun veya macera nedir?", answer: "Hikayeyi başlatan temel çatışmayı, gizemi veya yerine getirilmesi gereken görevi açıklaması beklenir." },
  { question: "Kitapta seni en çok şaşırtan veya heyecanlandıran olay hangisiydi?", answer: "Kendi okuma deneyiminde en çok şaşırdığı, heyecanlandığı veya üzüldüğü kırılma anını anlatması beklenir." },
  { question: "Eğer kitabın sonunu sen yazsaydın, nasıl bitirmek isterdin?", answer: "Kitabın sonunu kendi yaratıcılığıyla değiştirerek, karakterlerin akıbetini nasıl görmek istediğini açıklaması beklenir." },
  { question: "Bu kitaptan çıkardığın en önemli ders veya ana fikir nedir?", answer: "Kitabın okuyucuya vermek istediği ahlaki dersi, öğüdü veya ana temayı özetlemesi beklenir." },
  { question: "Kitaptaki karakterlerden biri olsaydın, hangisi olmak isterdin ve neden?", answer: "Seçtiği bir karakterle empati kurarak, onun hangi davranışlarını veya rolünü beğendiğini ifade etmesi beklenir." },
  { question: "Bu kitabı bir arkadaşına tavsiye eder miydin? Neden?", answer: "Kitabı sürükleyicilik, bilgilendiricilik veya duygusal yönlerden değerlendirip arkadaşına önerme sebeplerini söylemesi beklenir." },
  { question: "Kitabın yazarı bu hikaye aracılığıyla okuyuculara ne anlatmak istemiş olabilir?", answer: "Yazarın vermeye çalıştığı toplumsal veya bireysel mesajları kendi kelimeleriyle yorumlaması beklenir." },
  { question: "Kitapta en çok beğendiğin cümle veya paragraf hangisidir?", answer: "Kitaptan aklında kalan anlamlı bir sözü veya bölümü paylaşarak nedenini açıklaması beklenir." }
];

let activeQuestionsState = {
  bookId: null,
  questions: [],
  currentIndex: 0,
  bookTitle: '',
  bookAuthor: ''
};

let currentEditBookId = null;

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function openBookQuestionsModal(bookId, bookTitle, bookAuthor) {
  const state = stateManager.loadState();
  const book = state.books.library.find(b => b.id === bookId);
  
  let questions = [];
  if (book && book.questions && book.questions.length > 0) {
    questions = book.questions;
  } else {
    let preloaded = PRELOADED_QUESTIONS[bookId];
    if (!preloaded) {
      const normalizedTitle = bookTitle.toLowerCase().trim();
      if (normalizedTitle.includes("küçük prens")) {
        preloaded = PRELOADED_QUESTIONS['book_1'];
      } else if (normalizedTitle.includes("şeker portakalı")) {
        preloaded = PRELOADED_QUESTIONS['book_2'];
      } else if (normalizedTitle.includes("sol ayağım")) {
        preloaded = PRELOADED_QUESTIONS['book_3'];
      } else if (normalizedTitle.includes("define adası")) {
        preloaded = PRELOADED_QUESTIONS['book_4'];
      } else {
        preloaded = GENERIC_QUESTIONS;
      }
    }
    questions = preloaded;
  }

  const shuffledQuestions = shuffleArray(questions);

  activeQuestionsState = {
    bookId: bookId,
    questions: shuffledQuestions,
    currentIndex: 0,
    bookTitle: bookTitle,
    bookAuthor: bookAuthor
  };

  const modal = document.getElementById('modal-book-questions');
  if (modal) {
    modal.classList.add('active');
    renderCurrentQuestion();
    window.safeCreateIcons();
  }
}

function renderCurrentQuestion() {
  const { questions, currentIndex, bookTitle, bookAuthor } = activeQuestionsState;
  
  const titleElem = document.getElementById('question-book-title');
  const authorElem = document.getElementById('question-book-author');
  const textElem = document.getElementById('book-question-text');
  const progressTextElem = document.getElementById('question-progress-text');
  const progressBarElem = document.getElementById('question-progress-bar');
  
  const answerContainer = document.getElementById('answer-container');
  const answerElem = document.getElementById('answer-text');
  const btnShowAnswer = document.getElementById('btn-show-answer');

  if (titleElem) titleElem.textContent = bookTitle;
  if (authorElem) authorElem.textContent = bookAuthor;
  
  if (answerContainer) answerContainer.style.display = 'none';
  if (btnShowAnswer) {
    btnShowAnswer.innerHTML = `<span>Cevabı Göster</span> <i data-lucide="eye" style="width: 16px; height: 16px;"></i>`;
  }

  const currentQuestion = questions[currentIndex];
  const qText = typeof currentQuestion === 'string' ? currentQuestion : currentQuestion.question;
  const aText = typeof currentQuestion === 'string' ? 'Cevap eklenmemiş.' : currentQuestion.answer;

  if (textElem) {
    textElem.textContent = qText;
    
    // Animasyonu yeniden başlat
    textElem.style.animation = 'none';
    textElem.offsetHeight; // reflow
    textElem.style.animation = null;
  }
  
  if (answerElem) {
    answerElem.textContent = aText;
  }
  
  const total = questions.length;
  const currentNum = currentIndex + 1;
  if (progressTextElem) {
    progressTextElem.textContent = `Soru ${currentNum} / ${total}`;
  }
  if (progressBarElem) {
    const percentage = (currentNum / total) * 100;
    progressBarElem.style.width = `${percentage}%`;
  }
}

function openEditQuestionsModal(bookId, bookTitle, bookAuthor) {
  currentEditBookId = bookId;
  const state = stateManager.loadState();
  const book = state.books.library.find(b => b.id === bookId);
  if (!book) return;

  const titleElem = document.getElementById('edit-questions-book-title');
  const authorElem = document.getElementById('edit-questions-book-author');
  if (titleElem) titleElem.textContent = bookTitle;
  if (authorElem) authorElem.textContent = bookAuthor;

  const container = document.getElementById('edit-questions-list-container');
  if (!container) return;
  container.innerHTML = '';

  let questions = book.questions;
  if (!questions || questions.length === 0) {
    const normalizedTitle = bookTitle.toLowerCase().trim();
    if (normalizedTitle.includes("küçük prens")) {
      questions = PRELOADED_QUESTIONS['book_1'];
    } else if (normalizedTitle.includes("şeker portakalı")) {
      questions = PRELOADED_QUESTIONS['book_2'];
    } else if (normalizedTitle.includes("sol ayağım")) {
      questions = PRELOADED_QUESTIONS['book_3'];
    } else if (normalizedTitle.includes("define adası")) {
      questions = PRELOADED_QUESTIONS['book_4'];
    } else {
      questions = GENERIC_QUESTIONS;
    }
  }

  questions.forEach(q => {
    const qText = typeof q === 'string' ? q : q.question;
    const aText = typeof q === 'string' ? 'Cevap eklenmemiş.' : q.answer;
    addQuestionEditRow(container, qText, aText);
  });

  const modal = document.getElementById('modal-edit-book-questions');
  if (modal) {
    modal.classList.add('active');
    window.safeCreateIcons();
  }
}

function addQuestionEditRow(container, questionVal = '', answerVal = '') {
  const row = document.createElement('div');
  row.className = 'edit-question-row glass-card';
  row.style.cssText = 'padding: 1.25rem; margin-bottom: 1rem; position: relative; border-left: 4px solid var(--primary); background: var(--bg-primary); border-radius: var(--radius-md); border-top: 1px solid var(--border-color); border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);';

  row.innerHTML = `
    <button type="button" class="action-btn-sm delete btn-remove-question" style="position: absolute; right: 10px; top: 10px;" title="Soruyu Sil">
      <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
    </button>
    <div class="form-group" style="margin-bottom: 0.75rem; padding-right: 25px;">
      <label style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.25rem; display: block; color: var(--text-primary);">Soru Metni</label>
      <textarea class="form-control edit-question-input" rows="2" style="font-size: 0.85rem; width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.5rem; background: var(--bg-secondary); color: var(--text-primary);" placeholder="Soru metnini yazın..." required>${questionVal}</textarea>
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.25rem; display: block; color: var(--success);">Doğru Cevap / Beklenen Açıklama</label>
      <textarea class="form-control edit-answer-input" rows="2" style="font-size: 0.85rem; width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.5rem; background: var(--bg-secondary); color: var(--text-primary);" placeholder="Doğru cevabı veya beklenen açıklamayı yazın..." required>${answerVal}</textarea>
    </div>
  `;

  row.querySelector('.btn-remove-question').addEventListener('click', () => {
    row.remove();
  });

  container.appendChild(row);
  window.safeCreateIcons();
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Excel sep= belirtecini atla
    if (line.toLowerCase().startsWith('sep=')) {
      continue;
    }
    
    // Ayırıcı karakteri algıla (semicolon veya virgül)
    let delimiter = ';';
    if (!line.includes(';') && line.includes(',')) {
      delimiter = ',';
    }
    
    const parts = parseCSVLine(line, delimiter);
    if (parts.length >= 2) {
      const question = parts[0].trim();
      const answer = parts[1].trim();
      
      if (i === 0 && (question.toLowerCase() === 'soru' || question.toLowerCase() === 'question' || question.toLowerCase() === 'soru metni')) {
        continue;
      }
      
      if (question && answer) {
        result.push({ question, answer });
      }
    }
  }
  return result;
}

function parseCSVLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Çift tırnak içinde çift tırnak varsa ("") bunu tek çift tırnağa dönüştür
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Bir sonraki karakteri atla
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

const libraryContainer = document.getElementById('library-books-container');
const borrowedBooksTable = document.getElementById('borrowed-books-table');
let selectedStudentId = null;

// Modallar ve Formlar
const btnAddBook = document.getElementById('btn-add-book');
const modalBook = document.getElementById('modal-book');
const formBook = document.getElementById('form-book');
const bookNoInput = document.getElementById('book-no-input');
const bookTitleInput = document.getElementById('book-title-input');
const bookAuthorInput = document.getElementById('book-author-input');
const bookPagesInput = document.getElementById('book-pages-input');

const btnBorrowBook = document.getElementById('btn-borrow-book');
const modalBorrow = document.getElementById('modal-borrow');
const formBorrow = document.getElementById('form-borrow');
const borrowStudentSelect = document.getElementById('borrow-student-select');
const borrowBookSelect = document.getElementById('borrow-book-select');
const borrowDateInput = document.getElementById('borrow-date-input');

let toastCallback = null;

function setupBooksTab(showToast) {
  toastCallback = showToast;

  function updateBooksHeaderActions(activeTab) {
    const btnAddBook = document.getElementById('btn-add-book');
    const btnDownloadTemplate = document.getElementById('btn-download-book-template');
    const btnUploadTrigger = document.getElementById('btn-upload-books-trigger');
    
    if (btnAddBook && btnDownloadTemplate && btnUploadTrigger) {
      if (activeTab === 'leaderboard') {
        btnAddBook.style.display = 'inline-flex';
        btnDownloadTemplate.style.display = 'inline-flex';
        btnUploadTrigger.style.display = 'inline-flex';
      } else {
        btnAddBook.style.display = 'none';
        btnDownloadTemplate.style.display = 'none';
        btnUploadTrigger.style.display = 'none';
      }
    }
  }

  // Set initial state (default tab is library)
  updateBooksHeaderActions('library');

  // Excel Kitap Şablonu İndirme ve Yükleme Olayları
  const btnDownloadBookTemplate = document.getElementById('btn-download-book-template');
  if (btnDownloadBookTemplate) {
    btnDownloadBookTemplate.addEventListener('click', () => {
      if (window.XLSX) {
        const data = [
          ["Kitap No", "Kitap Adı", "Yazar", "Sayfa Sayısı"],
          ["101", "Küçük Prens", "Antoine de Saint-Exupéry", 96],
          ["102", "Şeker Portakalı", "José Mauro de Vasconcelos", 182],
          ["103", "Sol Ayağım", "Christy Brown", 192],
          ["104", "Define Adası", "Robert Louis Stevenson", 224]
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Kitaplık Şablonu");
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        downloadBlob(blob, "kitap_ekleme_sablonu.xlsx");
        
        if (toastCallback) {
          toastCallback('Excel (.xlsx) kitap ekleme şablonu indirildi.', 'success');
        }
      } else {
        const headers = "Kitap No;Kitap Adı;Yazar;Sayfa Sayısı";
        const rows = [
          "101;Küçük Prens;Antoine de Saint-Exupéry;96",
          "102;Şeker Portakalı;José Mauro de Vasconcelos;182",
          "103;Sol Ayağım;Christy Brown;192",
          "104;Define Adası;Robert Louis Stevenson;224"
        ];
        const csvContent = "\uFEFFsep=;\r\n" + [headers, ...rows].join("\r\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, "kitap_ekleme_sablonu.csv");
        
        if (toastCallback) {
          toastCallback('CSV kitap ekleme şablonu indirildi.', 'info');
        }
      }
    });
  }

  const btnUploadBooksTrigger = document.getElementById('btn-upload-books-trigger');
  const inputUploadBooksFile = document.getElementById('input-upload-books-file');
  
  if (btnUploadBooksTrigger && inputUploadBooksFile) {
    btnUploadBooksTrigger.addEventListener('click', () => {
      inputUploadBooksFile.click();
    });

    inputUploadBooksFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fileName = file.name.toLowerCase();
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

      const handleParsedBooks = (parsed) => {
        if (parsed.length === 0) {
          if (toastCallback) {
            toastCallback('Geçerli kitap satırı bulunamadı! Lütfen şablon biçimine uygun dosya yükleyin.', 'danger');
          }
          return;
        }

        let addedCount = 0;
        parsed.forEach(book => {
          const res = stateManager.addBook(book);
          if (res) addedCount++;
        });

        if (toastCallback && addedCount > 0) {
          toastCallback(`${addedCount} adet kitap başarıyla kütüphaneye eklendi.`, 'success');
        }

        renderBooksList();
        renderLeaderboard();
        
        const event = new CustomEvent('stateChanged');
        document.dispatchEvent(event);
      };

      if (window.XLSX && (isExcel || fileName.endsWith('.csv'))) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            let colBookNo = -1;
            let colTitle = 0;
            let colAuthor = 1;
            let colPages = 2;
            let startIdx = 0;

            if (json.length > 0) {
              const firstRow = json[0];
              const firstVal = String(firstRow[0] || '').toLowerCase().trim();
              const hasHeaders = firstVal.includes('ad') || firstVal.includes('title') || firstVal.includes('no') || firstVal.includes('yazar') || firstVal.includes('sayfa');
              if (hasHeaders) {
                startIdx = 1;
                for (let c = 0; c < firstRow.length; c++) {
                  const val = String(firstRow[c] || '').toLowerCase().trim();
                  if (val.includes('no')) {
                    colBookNo = c;
                  } else if (val.includes('ad') || val.includes('title')) {
                    colTitle = c;
                  } else if (val.includes('yazar') || val.includes('author')) {
                    colAuthor = c;
                  } else if (val.includes('sayfa') || val.includes('page')) {
                    colPages = c;
                  }
                }
              }
            }

            const parsed = [];
            for (let i = startIdx; i < json.length; i++) {
              const row = json[i];
              if (!row || row.length < 1) continue;
              
              const title = String(row[colTitle] || '').trim();
              const bookNo = colBookNo !== -1 ? String(row[colBookNo] || '').trim() : '';
              const author = String(row[colAuthor] || 'Bilinmiyor').trim();
              const pages = parseInt(row[colPages]) || 0;
              
              if (title) {
                parsed.push({ bookNo, title, author, pages });
              }
            }
            handleParsedBooks(parsed);
          } catch (error) {
            console.error("Excel okuma hatası:", error);
            if (toastCallback) {
              toastCallback(`Excel dosyası okunurken hata oluştu: ${error.message}`, 'danger');
            }
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const text = event.target.result;
            const lines = text.split(/\r?\n/);
            const parsed = [];
            
            let delimiter = ';';
            if (lines.length > 0 && lines[0].includes(',')) {
              delimiter = ',';
            }

            let colBookNo = -1;
            let colTitle = 0;
            let colAuthor = 1;
            let colPages = 2;
            let startIdx = 0;
            
            let headerLineIdx = 0;
            if (lines.length > 0 && lines[0].trim().startsWith('sep=')) {
              headerLineIdx = 1;
              startIdx = 2;
            } else {
              startIdx = 1;
            }
            
            if (lines.length > headerLineIdx) {
              const firstRowCols = lines[headerLineIdx].split(delimiter).map(c => c.replace(/"/g, '').toLowerCase().trim());
              const hasHeaders = firstRowCols.some(val => val.includes('ad') || val.includes('title') || val.includes('no') || val.includes('yazar') || val.includes('sayfa'));
              if (hasHeaders) {
                firstRowCols.forEach((val, c) => {
                  if (val.includes('no')) {
                    colBookNo = c;
                  } else if (val.includes('ad') || val.includes('title')) {
                    colTitle = c;
                  } else if (val.includes('yazar') || val.includes('author')) {
                    colAuthor = c;
                  } else if (val.includes('sayfa') || val.includes('page')) {
                    colPages = c;
                  }
                });
              } else {
                startIdx = headerLineIdx;
              }
            }

            for (let i = startIdx; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line || line.startsWith('sep=')) continue;

              const cols = line.split(delimiter);
              if (cols.length < 1) continue;

              const title = cols[colTitle] ? cols[colTitle].replace(/"/g, '').trim() : '';
              const bookNo = colBookNo !== -1 && cols[colBookNo] ? cols[colBookNo].replace(/"/g, '').trim() : '';
              const author = cols[colAuthor] ? cols[colAuthor].replace(/"/g, '').trim() : 'Bilinmiyor';
              const pages = cols[colPages] ? parseInt(cols[colPages].replace(/"/g, '')) || 0 : 0;

              if (title) {
                parsed.push({ bookNo, title, author, pages });
              }
            }
            handleParsedBooks(parsed);
          } catch (error) {
            console.error("CSV okuma hatası:", error);
            if (toastCallback) {
              toastCallback(`CSV dosyası okunurken hata oluştu: ${error.message}`, 'danger');
            }
          }
        };
        reader.readAsText(file, 'utf-8');
      }

      e.target.value = '';
    });
  }

  // Hızlı Ödünç Verme Olay Delegasyonu (Event Delegation)
  const quickReborrowTbody = document.getElementById('quick-reborrow-tbody');
  if (quickReborrowTbody) {
    quickReborrowTbody.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-quick-borrow');
      if (!btn) return;
      
      try {
        e.preventDefault();
        e.stopPropagation();
        
        const studentId = btn.getAttribute('data-student-id');
        const bookId = btn.getAttribute('data-book-id');
        const studentName = btn.getAttribute('data-student-name');
        const bookTitle = btn.getAttribute('data-book-title');
        
        console.log("Quick borrow clicked (Delegated) - Student:", studentId, "Book:", bookId);
        const todayStr = window.formatLocalDate();
        const result = stateManager.borrowBook(studentId, bookId, todayStr);
        console.log("Quick borrow result:", result);
        
        if (result.success) {
          if (toastCallback) {
            toastCallback(`"${bookTitle}" kitabı ${studentName} adlı öğrenciye ödünç verildi.`, 'success');
          }
          document.getElementById('quick-reborrow-container').style.display = 'none';
          
          const event = new CustomEvent('stateChanged');
          document.dispatchEvent(event);
        } else {
          if (toastCallback) {
            toastCallback(result.message, 'danger');
          }
        }
      } catch (err) {
        console.error("Delegated quick borrow click error:", err);
        if (window.showToast) {
          window.showToast(`Hata oluştu: ${err.message}`, 'danger');
        } else {
          alert(`Hata oluştu: ${err.message}`);
        }
      }
    });
  }

  // Kitap Ekleme Modalı Açılış
  btnAddBook.addEventListener('click', () => {
    formBook.reset();
    modalBook.classList.add('active');
  });

  // Ödünç Verme Modalı Açılış
  btnBorrowBook.addEventListener('click', () => {
    populateBorrowDropdowns();
    // Tarih seçiciyi bugünün tarihi ile başlat
    borrowDateInput.value = window.formatLocalDate();
    modalBorrow.classList.add('active');
  });

  // Öğrenci seçildiğinde kitap listesini güncelle
  if (borrowStudentSelect) {
    borrowStudentSelect.addEventListener('change', () => {
      updateBorrowBookSelect();
    });
  }

  // Modal Kapatma Düğmeleri
  document.querySelectorAll('#modal-book .close-btn, #modal-book .close-btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
      modalBook.classList.remove('active');
    });
  });

  document.querySelectorAll('#modal-borrow .close-btn, #modal-borrow .close-btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
      modalBorrow.classList.remove('active');
    });
  });

  const modalReservation = document.getElementById('modal-book-reservation-suggestion');
  if (modalReservation) {
    modalReservation.querySelectorAll('.close-btn, .close-btn-action').forEach(btn => {
      btn.addEventListener('click', () => {
        modalReservation.classList.remove('active');
      });
    });
  }

  // Kitap Form Gönderimi
  formBook.addEventListener('submit', (e) => {
    e.preventDefault();
    const bookData = {
      title: bookTitleInput.value.trim(),
      author: bookAuthorInput.value.trim(),
      pages: parseInt(bookPagesInput.value),
      bookNo: bookNoInput.value.trim()
    };

    const addedBook = stateManager.addBook(bookData);
    if (!addedBook) return; // Limit aşıldıysa çık ve modalı kapatma
    if (toastCallback) {
      toastCallback('Yeni kitap kütüphaneye eklendi.', 'success');
    }
    modalBook.classList.remove('active');
    
    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);
  });

  // Ödünç Verme Form Gönderimi
  formBorrow.addEventListener('submit', (e) => {
    e.preventDefault();
    const studentId = borrowStudentSelect.value;
    const bookId = borrowBookSelect.value;
    const date = borrowDateInput.value;

    const result = stateManager.borrowBook(studentId, bookId, date);
    
    if (result.success) {
      if (toastCallback) {
        toastCallback('Kitap başarıyla ödünç verildi.', 'success');
      }
      modalBorrow.classList.remove('active');
      
      const event = new CustomEvent('stateChanged');
      document.dispatchEvent(event);
    } else {
      if (toastCallback) {
        toastCallback(result.message, 'danger');
      }
    }
  });

  // Alt Sekme Geçişleri
  const btnLibraryTab = document.getElementById('tab-btn-books-library');
  const btnLeaderboardTab = document.getElementById('tab-btn-books-leaderboard');
  const btnLateTab = document.getElementById('tab-btn-books-late');
  const btnTop20Tab = document.getElementById('tab-btn-books-top20');
  const btnStudentLibraryTab = document.getElementById('tab-btn-books-student-library');
  
  const sectionLibrary = document.getElementById('books-library-section');
  const sectionLeaderboard = document.getElementById('books-leaderboard-section');
  const sectionLate = document.getElementById('books-late-section');
  const sectionTop20 = document.getElementById('books-top20-section');
  const sectionStudentLibrary = document.getElementById('books-student-library-section');

  if (btnLibraryTab && btnLeaderboardTab && btnLateTab) {
    btnLibraryTab.addEventListener('click', () => {
      btnLibraryTab.classList.add('active');
      btnLeaderboardTab.classList.remove('active');
      btnLateTab.classList.remove('active');
      if (btnTop20Tab) btnTop20Tab.classList.remove('active');
      if (btnStudentLibraryTab) btnStudentLibraryTab.classList.remove('active');
      
      sectionLibrary.style.display = 'block';
      sectionLeaderboard.style.display = 'none';
      sectionLate.style.display = 'none';
      if (sectionTop20) sectionTop20.style.display = 'none';
      if (sectionStudentLibrary) sectionStudentLibrary.style.display = 'none';
      
      renderLeaderboard();
      updateBooksHeaderActions('library');
      window.safeCreateIcons();
    });

    btnLeaderboardTab.addEventListener('click', () => {
      btnLibraryTab.classList.remove('active');
      btnLeaderboardTab.classList.add('active');
      btnLateTab.classList.remove('active');
      if (btnTop20Tab) btnTop20Tab.classList.remove('active');
      if (btnStudentLibraryTab) btnStudentLibraryTab.classList.remove('active');
      
      sectionLibrary.style.display = 'none';
      sectionLeaderboard.style.display = 'block';
      sectionLate.style.display = 'none';
      if (sectionTop20) sectionTop20.style.display = 'none';
      if (sectionStudentLibrary) sectionStudentLibrary.style.display = 'none';
      
      renderBooksList();
      updateBooksHeaderActions('leaderboard');
      window.safeCreateIcons();
    });

    btnLateTab.addEventListener('click', () => {
      btnLibraryTab.classList.remove('active');
      btnLeaderboardTab.classList.remove('active');
      btnLateTab.classList.add('active');
      if (btnTop20Tab) btnTop20Tab.classList.remove('active');
      if (btnStudentLibraryTab) btnStudentLibraryTab.classList.remove('active');
      
      sectionLibrary.style.display = 'none';
      sectionLeaderboard.style.display = 'none';
      sectionLate.style.display = 'block';
      if (sectionTop20) sectionTop20.style.display = 'none';
      if (sectionStudentLibrary) sectionStudentLibrary.style.display = 'none';
      
      renderLateBooksList();
      updateBooksHeaderActions('late');
      window.safeCreateIcons();
    });

    if (btnTop20Tab && sectionTop20) {
      btnTop20Tab.addEventListener('click', () => {
        btnLibraryTab.classList.remove('active');
        btnLeaderboardTab.classList.remove('active');
        btnLateTab.classList.remove('active');
        btnTop20Tab.classList.add('active');
        if (btnStudentLibraryTab) btnStudentLibraryTab.classList.remove('active');
        
        sectionLibrary.style.display = 'none';
        sectionLeaderboard.style.display = 'none';
        sectionLate.style.display = 'none';
        sectionTop20.style.display = 'block';
        if (sectionStudentLibrary) sectionStudentLibrary.style.display = 'none';
        
        renderTop20Leaderboard();
        updateBooksHeaderActions('top20');
        window.safeCreateIcons();
      });
    }

    if (btnStudentLibraryTab && sectionStudentLibrary) {
      btnStudentLibraryTab.addEventListener('click', () => {
        btnLibraryTab.classList.remove('active');
        btnLeaderboardTab.classList.remove('active');
        btnLateTab.classList.remove('active');
        if (btnTop20Tab) btnTop20Tab.classList.remove('active');
        btnStudentLibraryTab.classList.add('active');
        
        sectionLibrary.style.display = 'none';
        sectionLeaderboard.style.display = 'none';
        sectionLate.style.display = 'none';
        if (sectionTop20) sectionTop20.style.display = 'none';
        sectionStudentLibrary.style.display = 'block';
        
        initStudentLibraryTab();
        updateBooksHeaderActions('student-library');
        window.safeCreateIcons();
      });
    }
  }

  // Makul Okuma Süresi Güncelleme
  const btnSaveLateLimit = document.getElementById('btn-save-late-limit');
  const booksLateLimitInput = document.getElementById('books-late-limit-input');

  if (btnSaveLateLimit && booksLateLimitInput) {
    booksLateLimitInput.value = stateManager.getBookSettings().limitDays || 15;

    btnSaveLateLimit.addEventListener('click', (e) => {
      e.preventDefault();
      const limitDays = parseInt(booksLateLimitInput.value);
      if (isNaN(limitDays) || limitDays < 1) {
        if (toastCallback) toastCallback('Lütfen geçerli bir okuma süresi girin!', 'danger');
        return;
      }
      const settings = stateManager.getBookSettings();
      settings.limitDays = limitDays;
      stateManager.updateBookSettings(settings);
      
      if (toastCallback) {
        toastCallback(`Makul okuma süresi ${limitDays} gün olarak güncellendi.`, 'success');
      }
      
      const event = new CustomEvent('stateChanged');
      document.dispatchEvent(event);
    });
  }

  // Kitap Soruları Modalı Kapatma ve Sonraki Soru Olayları
  document.querySelectorAll('#modal-book-questions .close-btn, #modal-book-questions .close-btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-book-questions').classList.remove('active');
    });
  });

  const btnShowAnswer = document.getElementById('btn-show-answer');
  const ansContainer = document.getElementById('answer-container');
  if (btnShowAnswer && ansContainer) {
    btnShowAnswer.addEventListener('click', () => {
      if (ansContainer.style.display === 'none') {
        ansContainer.style.display = 'block';
        btnShowAnswer.innerHTML = `<span>Cevabı Gizle</span> <i data-lucide="eye-off" style="width: 16px; height: 16px;"></i>`;
      } else {
        ansContainer.style.display = 'none';
        btnShowAnswer.innerHTML = `<span>Cevabı Göster</span> <i data-lucide="eye" style="width: 16px; height: 16px;"></i>`;
      }
      window.safeCreateIcons();
    });
  }

  const btnNextQuestion = document.getElementById('btn-next-question');
  if (btnNextQuestion) {
    btnNextQuestion.addEventListener('click', () => {
      activeQuestionsState.currentIndex++;
      if (activeQuestionsState.currentIndex >= activeQuestionsState.questions.length) {
        if (toastCallback) {
          toastCallback("Bütün sorular soruldu. Yeni rastgele sıra ile baştan başlanıyor!", "info");
        }
        
        const state = stateManager.loadState();
        const book = state.books.library.find(b => b.id === activeQuestionsState.bookId);
        
        let questions = [];
        if (book && book.questions && book.questions.length > 0) {
          questions = book.questions;
        } else {
          let preloaded = PRELOADED_QUESTIONS[activeQuestionsState.bookId];
          if (!preloaded) {
            const normalizedTitle = activeQuestionsState.bookTitle.toLowerCase().trim();
            if (normalizedTitle.includes("küçük prens")) {
              questions = PRELOADED_QUESTIONS['book_1'];
            } else if (normalizedTitle.includes("şeker portakalı")) {
              questions = PRELOADED_QUESTIONS['book_2'];
            } else if (normalizedTitle.includes("sol ayağım")) {
              questions = PRELOADED_QUESTIONS['book_3'];
            } else if (normalizedTitle.includes("define adası")) {
              questions = PRELOADED_QUESTIONS['book_4'];
            } else {
              questions = GENERIC_QUESTIONS;
            }
          } else {
            questions = preloaded;
          }
        }
        activeQuestionsState.questions = shuffleArray(questions);
        activeQuestionsState.currentIndex = 0;
      }
      renderCurrentQuestion();
    });
  }

  const btnEditQuestionsFromModal = document.getElementById('btn-edit-questions-from-modal');
  if (btnEditQuestionsFromModal) {
    btnEditQuestionsFromModal.addEventListener('click', () => {
      document.getElementById('modal-book-questions').classList.remove('active');
      openEditQuestionsModal(activeQuestionsState.bookId, activeQuestionsState.bookTitle, activeQuestionsState.bookAuthor);
    });
  }

  // Excel/CSV Şablon İndirme ve Yükleme Olayları
  const btnDownloadTemplate = document.getElementById('btn-download-q-template');
  if (btnDownloadTemplate) {
    btnDownloadTemplate.addEventListener('click', () => {
      if (window.XLSX) {
        // XLSX kitaplığı yüklüyse gerçek bir Excel (.xlsx) dosyası oluştur ve indir
        const data = [
          ["Soru Metni", "Doğru Cevap / Beklenen Açıklama"],
          ["Küçük Prens'in en değerli varlığı nedir?", "Tek bir güldür."],
          ["Zeze'nin en yakın arkadaşı kimdir?", "Şeker portakalı fidanıdır."],
          ["Jim Hawkins gemide nereye saklandı?", "Elma fıçısının içine."]
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        // Sütun genişliklerini ayarla (Soru için 50, Cevap için 45 karakter genişlik)
        ws['!cols'] = [{ wch: 50 }, { wch: 45 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Soru Şablonu");
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        downloadBlob(blob, "kitap_soru_sablonu.xlsx");
        
        if (toastCallback) {
          toastCallback('Excel (.xlsx) şablonu indirildi.', 'success');
        }
      } else {
        // XLSX yüklenmemişse CSV formatında indir
        const headers = "Soru;Cevap";
        const rows = [
          "Küçük Prens'in en değerli varlığı nedir?;Tek bir güldür.",
          "Zeze'nin en yakın arkadaşı kimdir?;Şeker portakalı fidanıdır.",
          "Jim Hawkins gemide nereye saklandı?;Elma fıçısının içine."
        ];
        
        const csvContent = "\uFEFFsep=;\r\n" + [headers, ...rows].join("\r\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, "kitap_soru_sablonu.csv");
        
        if (toastCallback) {
          toastCallback('CSV şablonu indirildi.', 'info');
        }
      }
    });
  }

  const btnUploadTrigger = document.getElementById('btn-upload-q-file-trigger');
  const fileInput = document.getElementById('input-upload-q-file');
  if (btnUploadTrigger && fileInput) {
    btnUploadTrigger.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fileName = file.name.toLowerCase();
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

      const handleParsedQuestions = (parsed) => {
        if (parsed.length === 0) {
          if (toastCallback) {
            toastCallback('Geçerli soru-cevap satırı bulunamadı! Lütfen şablon biçimine uygun dosya yükleyin.', 'danger');
          }
          return;
        }

        const container = document.getElementById('edit-questions-list-container');
        if (container) {
          container.innerHTML = '';
          parsed.forEach(item => {
            addQuestionEditRow(container, item.question, item.answer);
          });

          if (toastCallback) {
            toastCallback(`${parsed.length} adet soru başarıyla yüklendi. Kalıcı olması için lütfen Kaydet butonuna basın.`, 'success');
          }
        }
      };

      if (window.XLSX && (isExcel || fileName.endsWith('.csv'))) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const parsed = [];
            for (let i = 0; i < json.length; i++) {
              const row = json[i];
              if (!row || row.length < 2) continue;
              
              const question = String(row[0] || '').trim();
              const answer = String(row[1] || '').trim();
              
              // Başlık satırını atla
              if (i === 0 && (
                question.toLowerCase() === 'soru' || 
                question.toLowerCase() === 'question' || 
                question.toLowerCase() === 'soru metni' ||
                question.toLowerCase() === 'soru_metni' ||
                question.toLowerCase() === 'doğru cevap / beklenen açıklama' ||
                question.toLowerCase() === 'cevap'
              )) {
                continue;
              }
              
              if (question && answer) {
                parsed.push({ question, answer });
              }
            }
            handleParsedQuestions(parsed);
          } catch (error) {
            console.error(error);
            if (toastCallback) {
              toastCallback('Excel dosyası çözümlenirken bir hata oluştu.', 'danger');
            }
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // CSV / TXT fallback
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target.result;
          const parsed = parseCSV(text);
          handleParsedQuestions(parsed);
        };
        reader.readAsText(file, 'UTF-8');
      }
      fileInput.value = '';
    });
  }

  // Kitap Soruları Düzenleme Modalı Kapatma, Ekleme ve Kaydetme
  document.querySelectorAll('#modal-edit-book-questions .close-btn, #modal-edit-book-questions .close-btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-edit-book-questions').classList.remove('active');
    });
  });

  const btnAddEditQuestionRow = document.getElementById('btn-add-edit-question-row');
  if (btnAddEditQuestionRow) {
    btnAddEditQuestionRow.addEventListener('click', () => {
      const container = document.getElementById('edit-questions-list-container');
      if (container) {
        addQuestionEditRow(container);
      }
    });
  }

  const formEditQuestions = document.getElementById('form-edit-book-questions');
  if (formEditQuestions) {
    formEditQuestions.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const rows = document.querySelectorAll('.edit-question-row');
      const updatedQuestions = [];
      
      rows.forEach(row => {
        const qText = row.querySelector('.edit-question-input').value.trim();
        const aText = row.querySelector('.edit-answer-input').value.trim();
        if (qText && aText) {
          updatedQuestions.push({ question: qText, answer: aText });
        }
      });

      if (updatedQuestions.length === 0) {
        if (toastCallback) {
          toastCallback('En az bir soru ve cevap girmelisiniz.', 'danger');
        }
        return;
      }

      const result = stateManager.updateBookQuestions(currentEditBookId, updatedQuestions);
      if (result.success) {
        if (toastCallback) {
          toastCallback('Kitap soruları başarıyla güncellendi.', 'success');
        }
        document.getElementById('modal-edit-book-questions').classList.remove('active');
        
        renderBooksList();
        
        const event = new CustomEvent('stateChanged');
        document.dispatchEvent(event);
      } else {
        if (toastCallback) {
          toastCallback(result.message, 'danger');
        }
      }
    });
  }
}

// Dropdown Menüleri Doldur
function populateBorrowDropdowns() {
  const state = stateManager.loadState();
  const selectBranch = document.getElementById('books-select-branch');
  const branchFilter = selectBranch ? selectBranch.value : 'all';
  
  // Öğrencileri yükle
  borrowStudentSelect.innerHTML = '<option value="">Öğrenci Seçin...</option>';
  const activeStudents = state.students.filter(student => {
    return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
  });
  const sortedStudents = [...activeStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  sortedStudents.forEach(std => {
    const branchText = std.branch ? ` [${std.branch}]` : '';
    borrowStudentSelect.innerHTML += `<option value="${std.id}">${std.name} ${std.surname} (${std.number})${branchText}</option>`;
  });

  // Başlangıçta kitap seçimi boş ve pasif olsun (öğrenci seçilmeden kitap seçilemesin)
  updateBorrowBookSelect();
}

function updateBorrowBookSelect() {
  const state = stateManager.loadState();
  const studentId = borrowStudentSelect.value;

  if (!studentId) {
    borrowBookSelect.innerHTML = '<option value="">Lütfen önce öğrenci seçin...</option>';
    borrowBookSelect.disabled = true;
    return;
  }

  borrowBookSelect.disabled = false;
  borrowBookSelect.innerHTML = '<option value="">Kitap Seçin...</option>';

  const readBookIds = state.books.transactions
    .filter(t => t.studentId === studentId && t.status === 'returned')
    .map(t => t.bookId);

  const currentlyReadingBookIds = state.books.transactions
    .filter(t => t.status === 'reading')
    .map(t => t.bookId);

  let libraryBooks = state.books.library || [];
  if (window.LicenseConfig && window.LicenseConfig.isDemo) {
    libraryBooks = libraryBooks.slice(0, window.LicenseConfig.bookLimit);
  }

  const availableBooks = libraryBooks.filter(book => {
    const hasRead = readBookIds.includes(book.id);
    const isCurrentlyBorrowed = currentlyReadingBookIds.includes(book.id);
    return !hasRead && !isCurrentlyBorrowed;
  });

  if (availableBooks.length === 0) {
    borrowBookSelect.innerHTML = '<option value="">Ödünç verilebilecek uygun kitap bulunmuyor (Tüm kitaplar okunmuş veya başkalarında)</option>';
  } else {
    availableBooks.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    availableBooks.forEach(book => {
      borrowBookSelect.innerHTML += `<option value="${book.id}">${book.title} - ${book.author} (${book.pages} s.)</option>`;
    });
  }
}

// Kitaplık ve Aktif Okumaları Çiz
function renderBooksList() {
  const state = stateManager.loadState();
  
  // 1. Kitaplık Envanteri Çizimi
  libraryContainer.innerHTML = '';
  if (state.books.library.length === 0) {
    libraryContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
        Kütüphanenizde henüz kitap bulunmuyor.
      </div>
    `;
  } else {
    // Okunmakta olan kitapları belirle
    const readingBookIds = state.books.transactions
      .filter(t => t.status === 'reading')
      .map(t => t.bookId);

    const sortedLibrary = [...state.books.library].sort((a, b) => a.title.localeCompare(b.title, 'tr'));

    sortedLibrary.forEach(book => {
      const activeTxForBook = state.books.transactions.find(t => t.bookId === book.id && t.status === 'reading');
      const isReading = !!activeTxForBook;
      
      let readerNameBadge = '';
      if (activeTxForBook) {
        const student = state.students.find(s => s.id === activeTxForBook.studentId);
        if (student) {
          const readerName = `${student.name} ${student.surname}`;
          readerNameBadge = `<div class="book-reader-badge" style="position: absolute; top: 8px; left: 8px; right: 8px; background: rgba(15, 23, 42, 0.75); color: #fff; padding: 0.25rem 0.4rem; border-radius: var(--radius-sm); font-size: 0.65rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center;" title="${readerName}">${readerName}</div>`;
        }
      }
      
      const card = document.createElement('div');
      card.className = 'glass-card book-card';
      
      card.innerHTML = `
        <div class="student-actions">
          <button class="action-btn-sm delete" title="Sil" data-id="${book.id}">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
        <div class="book-cover" style="background: ${isReading ? 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)' : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'}; position: relative;">
          ${readerNameBadge}
          <i data-lucide="book"></i>
          ${isReading ? '<span style="position: absolute; bottom: 8px; font-size: 0.65rem; background: rgba(0,0,0,0.5); padding: 0.1rem 0.5rem; border-radius: 4px; font-weight: 700;">OKUNUYOR</span>' : ''}
        </div>
        <div class="book-title book-title-question-link" data-book-id="${book.id}" title="Kitap Sorularını Gör">${book.title}</div>
        <div class="book-author">${book.author}</div>
        <div class="book-pages" style="margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
          <span style="font-weight: 600;">No: ${book.bookNo || '-'}</span>
          <span>${book.pages} Sayfa</span>
        </div>
        <div class="book-actions-footer" style="margin-top: auto; display: flex; gap: 0.5rem; width: 100%; border-top: 1px solid var(--border-color); padding-top: 0.75rem; justify-content: flex-end;">
          <button class="action-btn-sm view-questions-action" title="Soruları Gör" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem; font-size: 0.75rem; font-weight: 600; padding: 0.4rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(79, 70, 229, 0.2); background: rgba(79, 70, 229, 0.05); color: var(--primary); cursor: pointer;">
            <i data-lucide="help-circle" style="width: 14px; height: 14px;"></i> Sorular
          </button>
          <button class="action-btn-sm edit-questions-action" title="Soruları Düzenle" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem; font-size: 0.75rem; font-weight: 600; padding: 0.4rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(245, 158, 11, 0.2); background: rgba(245, 158, 11, 0.05); color: var(--warning); cursor: pointer;">
            <i data-lucide="pencil-line" style="width: 14px; height: 14px;"></i> Düzenle
          </button>
        </div>
      `;

      card.querySelector('.view-questions-action').addEventListener('click', (e) => {
        e.preventDefault();
        openBookQuestionsModal(book.id, book.title, book.author);
      });

      card.querySelector('.book-title-question-link').addEventListener('click', (e) => {
        e.preventDefault();
        openBookQuestionsModal(book.id, book.title, book.author);
      });

      card.querySelector('.edit-questions-action').addEventListener('click', (e) => {
        e.preventDefault();
        openEditQuestionsModal(book.id, book.title, book.author);
      });

      // Kitap silme olayı
      card.querySelector('.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`"${book.title}" adlı kitabı kütüphaneden silmek istediğinize emin misiniz?`)) {
          stateManager.deleteBook(book.id);
          renderBooksList();
          
          const event = new CustomEvent('stateChanged');
          document.dispatchEvent(event);
        }
      });

      // Lisans kısıtlama kontrolü
      const originalIndex = state.books.library.findIndex(b => b.id === book.id);
      const isPassive = window.LicenseConfig && window.LicenseConfig.isDemo && originalIndex >= window.LicenseConfig.bookLimit;
      if (isPassive) {
        card.classList.add('passive-locked');
        const lockOverlay = document.createElement('div');
        lockOverlay.className = 'lock-overlay';
        lockOverlay.innerHTML = `<i data-lucide="lock"></i><span>Pasif (Lisans Gerekli)</span>`;
        lockOverlay.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (window.showToast) {
            window.showToast("Lisans süreniz dolduğu için bu kitap pasif durumdadır. Lütfen lisansınızı yenileyin.", "warning");
          } else {
            alert("Lisans süreniz dolduğu için bu kitap pasif durumdadır. Lütfen lisansınızı yenileyin.");
          }
        });
        card.appendChild(lockOverlay);
      }

      libraryContainer.appendChild(card);
    });
  }

  // 2. Aktif Okuma Tablosu Çizimi (Eğer varsa - eski yerleşim uyumluluğu için)
  if (borrowedBooksTable) {
    const tbody = borrowedBooksTable.querySelector('tbody');
    tbody.innerHTML = '';

    const activeTransactions = state.books.transactions
      .filter(t => t.status === 'reading')
      .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));

    if (activeTransactions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Şu an ödünç verilmiş aktif bir kitap bulunmuyor.</td></tr>';
    } else {
      activeTransactions.forEach(t => {
        const student = state.students.find(s => s.id === t.studentId) || { name: 'Bilinmeyen', surname: 'Öğrenci', number: '-' };
        const book = state.books.library.find(b => b.id === t.bookId) || { title: 'Silinmiş Kitap' };
        
        const borrowDate = new Date(t.borrowDate);
        const today = new Date();
        const diffTime = Math.abs(today - borrowDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let statusClass = 'incomplete';
        let statusText = 'Okuyor';
        
        // Kitap iadesi 15 günü geçerse uyarı verelim
        if (diffDays > 15) {
          statusClass = 'missing';
          statusText = `Gecikti (${diffDays} gün)`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${student.name} ${student.surname}</strong> (${student.number})</td>
          <td>
            <div style="display: flex; flex-direction: column;">
              <a class="book-title-question-link" data-book-id="${book.id}" title="Kitap Sorularını Gör" style="display: inline-flex; align-items: center; gap: 0.25rem; width: fit-content;">
                <i data-lucide="help-circle" style="width: 14px; height: 14px;"></i><strong>${book.title}</strong>
              </a>
              <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 1.15rem;">No: ${book.bookNo || '-'}</span>
            </div>
          </td>
          <td>${borrowDate.toLocaleDateString('tr-TR')}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>
            <button class="btn btn-success btn-return" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
              <i data-lucide="check" style="width: 12px; height: 12px; margin-right: 2px;"></i> İade Al
            </button>
          </td>
        `;

        row.querySelector('.book-title-question-link').addEventListener('click', (e) => {
          e.preventDefault();
          openBookQuestionsModal(book.id, book.title, book.author);
        });

        row.querySelector('.btn-return').addEventListener('click', (e) => {
          try {
            e.preventDefault();
            e.stopPropagation();

            const bookSettings = stateManager.getBookSettings();
            const borrowDate = new Date(t.borrowDate);
            const today = new Date();
            const diffTime = Math.abs(today - borrowDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let isOnTime = diffDays <= bookSettings.limitDays;

            const behaviors = stateManager.getPerformanceBehaviors();
            const kitapOkumaBehavior = behaviors.positive.find(b => b.name === 'Kitap Okuma');
            const basePoints = kitapOkumaBehavior ? kitapOkumaBehavior.point : 2;
            const points = isOnTime ? basePoints : Math.ceil(basePoints * 0.5);

            stateManager.returnBook(t.id);
            if (toastCallback) {
              toastCallback(`"${book.title}" iade alındı.`, 'success');
            }
            
            stateManager.addPerformance(
              student.id,
              points >= 0 ? 'positive' : 'development',
              points,
              `Kitap Okuma Tamamlandı: ${book.title}${isOnTime ? '' : ' (Gecikmeli)'}`,
              stateManager.getSelectedWeek()
            );
            
            if (toastCallback) {
              toastCallback(`${student.name} öğrencisine kitap okuduğu için ${points >= 0 ? '+' : ''}${points} Performans puanı eklendi!`, 'info');
            }

            const event = new CustomEvent('stateChanged');
            document.dispatchEvent(event);

            // Hızlı yeniden ödünç verme panelini aç
            showQuickReborrow(student.id, `${student.name} ${student.surname}`);

            // Yüzde 85 okuma oranına sahip öğrencilere göre rezervasyon önerisini kontrol et
            setTimeout(() => {
              if (typeof checkForBookReservation === 'function') {
                checkForBookReservation(book);
              }
            }, 300);
          } catch (err) {
            console.error("Return button click error:", err);
            if (window.showToast) {
              window.showToast(`İade Hatası: ${err.message}`, 'danger');
            } else {
              alert(`İade Hatası: ${err.message}`);
            }
          }
        });

        tbody.appendChild(row);
      });
    }
  }

  // Liderlik Tablosunu da Güncelle
  renderLeaderboard();

  // Geciken Kitapları da Güncelle
  renderLateBooksList();
}

function renderLeaderboard() {
  const state = stateManager.loadState();
  const tbody = document.getElementById('books-leaderboard-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  const selectBranch = document.getElementById('books-select-branch');
  const branchFilter = selectBranch ? selectBranch.value : 'all';
  const activeStudents = state.students.filter(student => {
    return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
  });

  // 1. Her öğrenci için okuma verilerini topla
  const studentData = activeStudents.map(student => {
    // Bu öğrencinin iade ettiği işlemleri filtrele
    const returnedTransactions = state.books.transactions.filter(t => t.studentId === student.id && t.status === 'returned');
    
    // Toplam sayfa sayısı
    let totalPages = 0;
    returnedTransactions.forEach(t => {
      const book = state.books.library.find(b => b.id === t.bookId);
      if (book) {
        totalPages += book.pages || 0;
      }
    });

    return {
      student,
      bookCount: returnedTransactions.length,
      totalPages
    };
  });

  // 2. Sayfa sayısına göre sırala (Eşitlik durumunda kitap sayısı, sonra alfabetik isim)
  studentData.sort((a, b) => {
    if (b.totalPages !== a.totalPages) {
      return b.totalPages - a.totalPages;
    }
    if (b.bookCount !== a.bookCount) {
      return b.bookCount - a.bookCount;
    }
    const nameA = `${a.student.name} ${a.student.surname}`;
    const nameB = `${b.student.name} ${b.student.surname}`;
    return nameA.localeCompare(nameB, 'tr');
  });

  // Varsayılan olarak ilk sıradaki öğrenciyi seçelim (eğer seçili öğrenci yoksa veya silinmişse)
  if (studentData.length > 0) {
    const studentExists = studentData.some(d => d.student.id === selectedStudentId);
    if (!selectedStudentId || !studentExists) {
      selectedStudentId = studentData[0].student.id;
    }
  } else {
    selectedStudentId = null;
  }

  // 3. Tabloyu çiz
  if (studentData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Sınıfta kayıtlı öğrenci bulunmuyor.</td></tr>';
    renderStudentDetailPanel();
    return;
  }

  studentData.forEach((data, index) => {
    const rank = index + 1;
    let rankHtml = '';
    
    if (rank === 1) rankHtml = '<span class="leaderboard-rank rank-1" title="1. Derece">🥇</span>';
    else if (rank === 2) rankHtml = '<span class="leaderboard-rank rank-2" title="2. Derece">🥈</span>';
    else if (rank === 3) rankHtml = '<span class="leaderboard-rank rank-3" title="3. Derece">🥉</span>';
    else rankHtml = `<span class="leaderboard-rank">${rank}</span>`;

    const row = document.createElement('tr');
    row.className = 'leaderboard-row';
    row.style.cursor = 'pointer';
    
    if (data.student.id === selectedStudentId) {
      row.classList.add('active-student-row');
    }
    
    row.innerHTML = `
      <td style="text-align: center; vertical-align: middle;">
        <div style="display: inline-flex; justify-content: center; align-items: center; width: 100%;">
          ${rankHtml}
        </div>
      </td>
      <td>
        <strong>${data.student.name} ${data.student.surname}</strong>
        <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 4px;">(${data.student.number})</span>
      </td>
      <td style="text-align: center;"><strong>${data.bookCount}</strong> adet</td>
      <td style="text-align: center;"><span class="status-badge positive-tab active" style="font-weight: 700; font-size: 0.85rem; padding: 0.35rem 0.75rem;">${data.totalPages}</span></td>
    `;

    row.addEventListener('click', (e) => {
      e.preventDefault();
      selectedStudentId = data.student.id;
      renderLeaderboard();
      
      // Mobil ve tablet ekranlarda detay panelini otomatik olarak görünür alana kaydır
      const panel = document.getElementById('books-student-detail-panel');
      if (panel && window.innerWidth <= 1024) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    tbody.appendChild(row);
  });

  // Detay panelini de güncelle
  renderStudentDetailPanel();
}

function formatDateTR(dateStr) {
  if (!dateStr) return '-';
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[0]}`;
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function renderLateBooksList() {
  const state = stateManager.loadState();
  const tbody = document.getElementById('books-late-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  
  const bookSettings = stateManager.getBookSettings();
  const limitDays = bookSettings.limitDays || 15;

  const booksLateLimitInput = document.getElementById('books-late-limit-input');
  if (booksLateLimitInput) {
    booksLateLimitInput.value = limitDays;
  }

  const activeTransactions = state.books.transactions.filter(t => t.status === 'reading');
  const lateTransactions = [];
  
  activeTransactions.forEach(t => {
    const borrowDate = new Date(t.borrowDate);
    const today = new Date();
    
    const borrowDatePure = new Date(borrowDate.getFullYear(), borrowDate.getMonth(), borrowDate.getDate());
    const todayPure = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = todayPure - borrowDatePure;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > limitDays) {
      lateTransactions.push({
        transaction: t,
        diffDays: diffDays
      });
    }
  });

  lateTransactions.sort((a, b) => b.diffDays - a.diffDays);

  if (lateTransactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          Şu an süresi geciken herhangi bir kitap bulunmuyor.
        </td>
      </tr>
    `;
    return;
  }

  lateTransactions.forEach(item => {
    const t = item.transaction;
    const diffDays = item.diffDays;
    
    const student = state.students.find(s => s.id === t.studentId) || { name: 'Bilinmeyen', surname: 'Öğrenci', number: '-' };
    const book = state.books.library.find(b => b.id === t.bookId) || { title: 'Silinmiş Kitap', author: 'Bilinmiyor', bookNo: '-' };

    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td style="text-align: center; font-weight: 600;">${book.bookNo || '-'}</td>
      <td>
        <div style="display: flex; flex-direction: column;">
          <a class="book-title-question-link" data-book-id="${book.id}" title="Kitap Sorularını Gör" style="display: inline-flex; align-items: center; gap: 0.25rem; width: fit-content; font-weight: 700; color: var(--text-primary);">
            <i data-lucide="help-circle" style="width: 14px; height: 14px;"></i>${book.title}
          </a>
        </div>
      </td>
      <td>${book.author}</td>
      <td><strong>${student.name} ${student.surname}</strong></td>
      <td style="text-align: center;">${student.number}</td>
      <td style="text-align: center;">${formatDateTR(t.borrowDate)}</td>
      <td style="text-align: center;">
        <span class="status-badge missing" style="font-weight: 700; font-size: 0.8rem; padding: 0.25rem 0.5rem;">
          ${diffDays} gün
        </span>
      </td>
      <td style="text-align: center;">
        <button class="btn btn-success btn-return-late" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.25rem; font-weight: 600;">
          <i data-lucide="check" style="width: 12px; height: 12px;"></i> İade Al
        </button>
      </td>
    `;

    const questionLink = row.querySelector('.book-title-question-link');
    if (questionLink) {
      questionLink.addEventListener('click', (e) => {
        e.preventDefault();
        openBookQuestionsModal(book.id, book.title, book.author);
      });
    }

    row.querySelector('.btn-return-late').addEventListener('click', (e) => {
      try {
        e.preventDefault();
        e.stopPropagation();

        const behaviors = stateManager.getPerformanceBehaviors();
        const kitapOkumaBehavior = behaviors.positive.find(b => b.name === 'Kitap Okuma');
        const basePoints = kitapOkumaBehavior ? kitapOkumaBehavior.point : 2;
        const points = Math.ceil(basePoints * 0.5);

        stateManager.returnBook(t.id);
        if (toastCallback) {
          toastCallback(`"${book.title}" iade alındı.`, 'success');
        }

        stateManager.addPerformance(
          student.id,
          points >= 0 ? 'positive' : 'development',
          points,
          `Kitap Okuma Tamamlandı: ${book.title} (Gecikmeli)`,
          stateManager.getSelectedWeek()
        );

        if (toastCallback) {
          toastCallback(`${student.name} öğrencisine kitap okuduğu için ${points >= 0 ? '+' : ''}${points} Performans puanı eklendi!`, 'info');
        }

        const event = new CustomEvent('stateChanged');
        document.dispatchEvent(event);

        showQuickReborrow(student.id, `${student.name} ${student.surname}`);

        setTimeout(() => {
          if (typeof checkForBookReservation === 'function') {
            checkForBookReservation(book);
          }
        }, 300);

        renderLateBooksList();
      } catch (err) {
        console.error("Late return button click error:", err);
        if (window.showToast) {
          window.showToast(`İade Hatası: ${err.message}`, 'danger');
        } else {
          alert(`İade Hatası: ${err.message}`);
        }
      }
    });

    tbody.appendChild(row);
  });

  window.safeCreateIcons();
}

function renderStudentDetailPanel() {
  const state = stateManager.loadState();
  const panel = document.getElementById('books-student-detail-panel');
  if (!panel) return;

  panel.innerHTML = '';

  const student = state.students.find(s => s.id === selectedStudentId);
  if (!student) {
    panel.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); margin: auto;">
        <i data-lucide="user" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
        <p>Lütfen detayları ve ödünç işlemlerini görmek için sol listeden bir öğrenci seçin.</p>
      </div>
    `;
    window.safeCreateIcons();
    return;
  }

  // 1. Öğrenci Başlığı
  const headerDiv = document.createElement('div');
  headerDiv.style.borderBottom = '1px solid var(--border-color)';
  headerDiv.style.paddingBottom = '0.75rem';
  headerDiv.innerHTML = `
    <h3 style="margin-bottom: 0.25rem; color: var(--primary); font-weight: 700; display: flex; align-items: center; gap: 0.5rem; font-size: 1.15rem;">
      <i data-lucide="user" style="width: 20px; height: 20px;"></i> ${student.name} ${student.surname}
    </h3>
    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Okul No: ${student.number} | Kitap Ödünç & İade Detayları</span>
  `;
  panel.appendChild(headerDiv);

  // 2. Şu An Okuyor / Yeni Ödünç Ver Bölümü
  const activeTxs = state.books.transactions.filter(t => t.studentId === selectedStudentId && t.status === 'reading');
  const actionDiv = document.createElement('div');

  if (activeTxs.length > 0) {
    actionDiv.innerHTML = `
      <h4 style="color: var(--primary); font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; font-size: 1rem;">
        <i data-lucide="book-open" style="width: 18px; height: 18px;"></i> Şu An Okuyor (${activeTxs.length})
      </h4>
      
      <div class="student-reading-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${activeTxs.map((activeTx, index) => {
          const book = state.books.library.find(b => b.id === activeTx.bookId) || { title: 'Silinmiş Kitap', author: 'Bilinmiyor', pages: 0 };
          const borrowDate = new Date(activeTx.borrowDate);
          const today = new Date();
          const diffTime = Math.abs(today - borrowDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const isLate = diffDays > 15;
          return `
            <div class="reading-item glass-card" data-tx-id="${activeTx.id}" data-book-id="${book.id}" data-book-title="${book.title.replace(/"/g, '&quot;')}" data-book-author="${book.author.replace(/"/g, '&quot;')}" style="border: 1.5px solid var(--primary); background: var(--primary-light); padding: 1.25rem; border-radius: var(--radius-md); box-sizing: border-box;">
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="width: 100%;">
                  <strong style="font-size: 1.05rem; color: var(--text-primary); display: block;">${book.title}</strong>
                  <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">${book.author} | ${book.pages} Sayfa</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Veriliş Tarihi: ${borrowDate.toLocaleDateString('tr-TR')} (${diffDays} gündür)</div>
                  ${isLate ? `<span class="status-badge missing" style="margin-top: 0.5rem; display: inline-block;">Gecikti (${diffDays} gün)</span>` : ''}
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-start; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 0.75rem; margin-top: 0.25rem;">
                  <button class="btn btn-warning btn-ask-question" style="padding: 0.5rem 0.85rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem; font-weight:600;">
                    <i data-lucide="help-circle" style="width: 14px; height: 14px;"></i> Soru Sor
                  </button>
                  <button class="btn btn-success btn-return-book" data-diff-days="${diffDays}" style="padding: 0.5rem 0.85rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem; font-weight:600;">
                    <i data-lucide="check" style="width: 14px; height: 14px;"></i> İade Al
                  </button>
                  <button class="btn btn-danger btn-cancel-borrow" style="padding: 0.5rem 0.85rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem; font-weight:600; margin-left: auto;">
                    <i data-lucide="x-circle" style="width: 14px; height: 14px;"></i> İptal Et
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    actionDiv.querySelectorAll('.btn-ask-question').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const item = btn.closest('.reading-item');
        const bookId = item.getAttribute('data-book-id');
        const bookTitle = item.getAttribute('data-book-title');
        const bookAuthor = item.getAttribute('data-book-author');
        openBookQuestionsModal(bookId, bookTitle, bookAuthor);
      });
    });

    actionDiv.querySelectorAll('.btn-return-book').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const item = btn.closest('.reading-item');
        const txId = item.getAttribute('data-tx-id');
        const bookTitle = item.getAttribute('data-book-title');
        const diffDays = parseInt(btn.getAttribute('data-diff-days'));

        try {
          const bookSettings = stateManager.getBookSettings();
          let isOnTime = diffDays <= bookSettings.limitDays;

          const behaviors = stateManager.getPerformanceBehaviors();
          const kitapOkumaBehavior = behaviors.positive.find(b => b.name === 'Kitap Okuma');
          const basePoints = kitapOkumaBehavior ? kitapOkumaBehavior.point : 2;
          const points = isOnTime ? basePoints : Math.ceil(basePoints * 0.5);

          stateManager.returnBook(txId);
          if (toastCallback) {
            toastCallback(`"${bookTitle}" iade alındı.`, 'success');
          }

          stateManager.addPerformance(
            student.id,
            points >= 0 ? 'positive' : 'development',
            points,
            `Kitap Okuma Tamamlandı: ${bookTitle}${isOnTime ? '' : ' (Gecikmeli)'}`,
            stateManager.getSelectedWeek()
          );

          if (toastCallback) {
            toastCallback(`${student.name} öğrencisine kitap okuduğu için ${points >= 0 ? '+' : ''}${points} Performans puanı eklendi!`, 'info');
          }

          const event = new CustomEvent('stateChanged');
          document.dispatchEvent(event);
        } catch (err) {
          console.error("Return error:", err);
        }
      });
    });

    actionDiv.querySelectorAll('.btn-cancel-borrow').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const item = btn.closest('.reading-item');
        const txId = item.getAttribute('data-tx-id');
        const bookTitle = item.getAttribute('data-book-title');

        if (confirm(`"${bookTitle}" kitabının ödünç işlemini iptal etmek istediğinize emin misiniz? (Kitap okunmamış sayılarak kitaplığa dönecektir)`)) {
          try {
            stateManager.cancelBorrow(txId);
            if (toastCallback) {
              toastCallback(`"${bookTitle}" ödünç işlemi iptal edildi.`, 'info');
            }

            const event = new CustomEvent('stateChanged');
            document.dispatchEvent(event);
          } catch (err) {
            console.error("Cancel borrow error:", err);
          }
        }
      });
    });

  } else {
    // Öğrenci kitap okumuyor, yeni ödünç verme listesi göster
    const readBookIds = state.books.transactions
      .filter(t => t.studentId === selectedStudentId && t.status === 'returned')
      .map(t => t.bookId);

    const currentlyReadingBookIds = state.books.transactions
      .filter(t => t.status === 'reading')
      .map(t => t.bookId);

    const availableBooks = state.books.library.filter(book => {
      const hasRead = readBookIds.includes(book.id);
      const isCurrentlyBorrowed = currentlyReadingBookIds.includes(book.id);
      return !hasRead && !isCurrentlyBorrowed;
    });

    actionDiv.className = 'glass-card';
    actionDiv.style.border = '1px solid var(--border-color)';
    actionDiv.style.padding = '1.25rem';
    actionDiv.style.borderRadius = 'var(--radius-md)';
    
    let booksHtml = '';
    if (availableBooks.length === 0) {
      booksHtml = `
        <div style="font-size: 0.85rem; color: var(--text-muted); padding: 1rem; text-align: center;">
          Ödünç verilebilecek uygun kitap bulunmuyor (Tüm kitaplar okunmuş veya başkalarında).
        </div>
      `;
    } else {
      booksHtml = `
        <div class="student-books-list" style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; padding-right: 2px;">
          ${availableBooks.map(book => `
            <div class="student-book-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.75rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); gap: 0.5rem; transition: transform var(--transition-fast);">
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${book.title}">${book.title}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${book.author}">${book.author} • ${book.pages} S.</div>
                <div style="font-size: 0.7rem; color: var(--text-muted);">No: ${book.bookNo || '-'}</div>
              </div>
              <button class="btn btn-primary btn-lend-book" data-book-id="${book.id}" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; font-weight:600; white-space: nowrap; flex-shrink: 0;">
                Ödünç Ver
              </button>
            </div>
          `).join('')}
        </div>
      `;
    }

    actionDiv.innerHTML = `
      <h4 style="color: var(--text-primary); font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; font-size: 1rem;">
        <i data-lucide="bookmark-plus" style="width: 18px; height: 18px; color: var(--primary);"></i> Yeni Kitap Ödünç Ver
      </h4>
      ${booksHtml}
    `;

    actionDiv.querySelectorAll('.btn-lend-book').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const bookId = btn.getAttribute('data-book-id');
        const todayStr = new Date().toISOString().slice(0, 10);

        stateManager.borrowBook(selectedStudentId, bookId, todayStr);
        if (toastCallback) {
          toastCallback('Kitap başarıyla ödünç verildi.', 'success');
        }

        const event = new CustomEvent('stateChanged');
        document.dispatchEvent(event);
      });
    });
  }

  panel.appendChild(actionDiv);

  // 3. Okuma Geçmişi Bölümü (İade tarihine göre azalan sırada)
  const pastTransactions = state.books.transactions
    .filter(t => t.studentId === selectedStudentId && t.status === 'returned')
    .sort((a, b) => {
      const dateA = a.returnDate ? new Date(a.returnDate) : new Date(0);
      const dateB = b.returnDate ? new Date(b.returnDate) : new Date(0);
      return dateB - dateA;
    });

  const historyDiv = document.createElement('div');
  historyDiv.className = 'glass-card';
  historyDiv.style.padding = '1.25rem';
  historyDiv.style.borderRadius = 'var(--radius-md)';
  
  window.booksHistoryExpanded = window.booksHistoryExpanded || {};
  const isExpanded = !!window.booksHistoryExpanded[selectedStudentId];
  const displayTxs = isExpanded ? pastTransactions : pastTransactions.slice(0, 5);

  let historyHtml = '';
  if (pastTransactions.length === 0) {
    historyHtml = `
      <div style="font-size: 0.85rem; color: var(--text-muted); padding: 1rem; text-align: center;">
        Henüz tamamlanmış kitap okuma kaydı bulunmuyor.
      </div>
    `;
  } else {
    historyHtml = `
      <div class="student-books-list" style="max-height: ${isExpanded ? '400px' : '250px'}; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; padding-right: 2px;">
        ${displayTxs.map(t => {
          const book = state.books.library.find(b => b.id === t.bookId) || { title: 'Silinmiş Kitap', author: 'Bilinmiyor', pages: 0 };
          const borrowD = new Date(t.borrowDate).toLocaleDateString('tr-TR');
          const returnD = t.returnDate ? new Date(t.returnDate).toLocaleDateString('tr-TR') : '-';
          return `
            <div class="student-book-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.75rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); gap: 0.5rem;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${book.title}">${book.title}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${book.author}">${book.author}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.15rem;">Veriliş: ${borrowD} • İade: ${returnD}</div>
              </div>
              <div style="text-align: right; flex-shrink: 0;">
                <span class="status-badge positive-tab active" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; font-weight:700; display: inline-block;">${book.pages} S.</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      ${pastTransactions.length > 5 ? `
        <button class="btn btn-secondary btn-sm" id="btn-toggle-history" style="margin-top: 0.75rem; width: 100%; display: flex; justify-content: center; align-items: center; gap: 0.25rem; font-weight: 600;">
          <i data-lucide="${isExpanded ? 'chevron-up' : 'chevron-down'}" style="width: 14px; height: 14px;"></i>
          ${isExpanded ? 'Daha Az Göster (Daralt)' : `Tümünü Göster (Genişlet - ${pastTransactions.length})`}
        </button>
      ` : ''}
    `;
  }

  historyDiv.innerHTML = `
    <h4 style="color: var(--text-primary); font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; font-size: 1rem;">
      <i data-lucide="history" style="width: 18px; height: 18px; color: var(--success);"></i> Okuma Geçmişi
    </h4>
    ${historyHtml}
  `;

  panel.appendChild(historyDiv);

  const btnToggle = historyDiv.querySelector('#btn-toggle-history');
  if (btnToggle) {
    btnToggle.addEventListener('click', (e) => {
      e.preventDefault();
      window.booksHistoryExpanded[selectedStudentId] = !isExpanded;
      renderStudentDetailPanel();
    });
  }

  window.safeCreateIcons();
}

function showQuickReborrow(studentId, studentName) {
  const container = document.getElementById('quick-reborrow-container');
  const title = document.getElementById('quick-reborrow-title');
  const tbody = document.getElementById('quick-reborrow-tbody');
  if (!container || !title || !tbody) return;

  const state = stateManager.loadState();

  title.innerHTML = `<i data-lucide="sparkles" style="color: var(--warning);"></i> <strong>${studentName}</strong> İçin Yeni Ödünç Kitap Seçin`;
  tbody.innerHTML = '';

  // 1. Öğrencinin geçmişte okuduğu tüm kitapların id'lerini bul
  const studentReadBookIds = state.books.transactions
    .filter(t => t.studentId === studentId)
    .map(t => t.bookId);

  // 2. Kütüphanedeki diğer kitaplardan (o an bir başkası tarafından okunmayan ve bu öğrencinin okumadığı) kitapları filtrele
  const readingBookIds = state.books.transactions
    .filter(t => t.status === 'reading')
    .map(t => t.bookId);

  const availableUnreadBooks = state.books.library.filter(book => 
    !studentReadBookIds.includes(book.id) && !readingBookIds.includes(book.id)
  );

  if (availableUnreadBooks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Öğrencinin okumadığı müsait kitap bulunamadı.</td></tr>';
    container.style.display = 'block';
    window.safeCreateIcons();
    return;
  }

  availableUnreadBooks.sort((a, b) => a.title.localeCompare(b.title, 'tr'));

  availableUnreadBooks.forEach(book => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div style="display: flex; flex-direction: column;">
          <strong>${book.title}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">No: ${book.bookNo || '-'}</span>
        </div>
      </td>
      <td>${book.author}</td>
      <td>${book.pages} s.</td>
      <td>
        <button class="btn btn-primary btn-quick-borrow" 
                data-student-id="${studentId}" 
                data-book-id="${book.id}" 
                data-student-name="${studentName}" 
                data-book-title="${book.title}" 
                style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
          Ödünç Ver
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });

  container.style.display = 'block';
  window.safeCreateIcons();
}

function checkForBookReservation(book) {
  const state = stateManager.loadState();
  const totalBooks = state.books.library;
  const totalBooksCount = totalBooks.length;
  if (totalBooksCount === 0) return;

  const students = state.students;
  const candidates = [];

  students.forEach(std => {
    // Okuduğu kitapların ID'lerini filtrele (returned transaction'lar)
    const readBookIds = new Set(
      state.books.transactions
        .filter(t => t.studentId === std.id && t.status === 'returned')
        .map(t => t.bookId)
    );

    const readCount = readBookIds.size;
    const readRatio = readCount / totalBooksCount;

    // Yüzde 85 veya daha fazlasını okumuşsa
    if (readRatio >= 0.85) {
      // Bu kitabı henüz okumamışsa
      if (!readBookIds.has(book.id)) {
        // Şu anda başka bir kitap okumadığından da emin olalım (bilgi amaçlı, rezerve edilebilir)
        const isCurrentlyReading = state.books.transactions.some(t => t.studentId === std.id && t.status === 'reading');
        candidates.push({
          student: std,
          readPercentage: Math.round(readRatio * 100),
          isCurrentlyReading: isCurrentlyReading
        });
      }
    }
  });

  if (candidates.length > 0) {
    const modal = document.getElementById('modal-book-reservation-suggestion');
    const titleElem = document.getElementById('reserved-book-title');
    const listContainer = document.getElementById('reservation-candidates-list');

    if (modal && titleElem && listContainer) {
      titleElem.textContent = book.title;
      listContainer.innerHTML = '';

      candidates.forEach(cand => {
        const row = document.createElement('div');
        row.className = 'candidate-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.padding = '0.75rem';
        row.style.background = 'var(--bg-primary)';
        row.style.border = '1px solid var(--border-color)';
        row.style.borderRadius = 'var(--radius-md)';
        row.style.gap = '1rem';

        const statusText = cand.isCurrentlyReading 
          ? ' <span style="font-size: 0.7rem; color: var(--text-muted);"> (Şu an okuduğu kitap var)</span>'
          : '';

        row.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.15rem;">
            <strong style="font-size: 0.85rem; color: var(--text-primary);">${cand.student.name} ${cand.student.surname}</strong>
            <span style="font-size: 0.75rem; color: var(--success); font-weight: 600;">%${cand.readPercentage} Okuma Oranı${statusText}</span>
          </div>
          <button type="button" class="btn btn-primary btn-sm btn-reserve-action" data-student-id="${cand.student.id}" style="font-size: 0.8rem; padding: 0.35rem 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <i data-lucide="bookmark-check" style="width: 14px; height: 14px;"></i> Ödünç Ver
          </button>
        `;

        row.querySelector('.btn-reserve-action').addEventListener('click', () => {
          // Bu öğrenciye kitabı ödünç ver
          const borrowResult = stateManager.borrowBook(cand.student.id, book.id);
          if (borrowResult.success) {
            if (toastCallback) {
              toastCallback(`"${book.title}" kitabı ${cand.student.name} için başarıyla rezerve edildi ve ödünç verildi.`, 'success');
            }
            modal.classList.remove('active');
            
            const event = new CustomEvent('stateChanged');
            document.dispatchEvent(event);
          } else {
            if (toastCallback) {
              toastCallback(borrowResult.message, 'danger');
            }
          }
        });

        listContainer.appendChild(row);
      });

      // İkonları oluştur
      window.safeCreateIcons();
      
      // Modalı aç
      modal.classList.add('active');
    }
  }
}

function renderTop20Leaderboard() {
  const state = stateManager.loadState();
  const tbody = document.getElementById('books-top20-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  // 1. Tüm öğrenciler için okuma verilerini topla
  const studentData = state.students.map(student => {
    const returnedTransactions = state.books.transactions.filter(t => t.studentId === student.id && t.status === 'returned');
    let totalPages = 0;
    returnedTransactions.forEach(t => {
      const book = state.books.library.find(b => b.id === t.bookId);
      if (book) {
        totalPages += book.pages || 0;
      }
    });

    return {
      student,
      bookCount: returnedTransactions.length,
      totalPages
    };
  });

  // 2. Sayfa sayısına göre sırala (en çok okuyandan en aza)
  studentData.sort((a, b) => {
    if (b.totalPages !== a.totalPages) {
      return b.totalPages - a.totalPages;
    }
    if (b.bookCount !== a.bookCount) {
      return b.bookCount - a.bookCount;
    }
    const nameA = `${a.student.name} ${a.student.surname}`;
    const nameB = `${b.student.name} ${b.student.surname}`;
    return nameA.localeCompare(nameB, 'tr');
  });

  // 3. İlk 20'yi al
  const top20 = studentData.slice(0, 20);

  if (top20.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Sınıfta kayıtlı öğrenci bulunmuyor.</td></tr>';
    return;
  }

  top20.forEach((data, index) => {
    const rank = index + 1;
    let rankHtml = '';
    
    if (rank === 1) rankHtml = '<span class="leaderboard-rank rank-1" title="1. Derece">🥇</span>';
    else if (rank === 2) rankHtml = '<span class="leaderboard-rank rank-2" title="2. Derece">🥈</span>';
    else if (rank === 3) rankHtml = '<span class="leaderboard-rank rank-3" title="3. Derece">🥉</span>';
    else rankHtml = `<span class="leaderboard-rank">${rank}</span>`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="text-align: center; vertical-align: middle;">
        <div style="display: inline-flex; justify-content: center; align-items: center; width: 100%;">
          ${rankHtml}
        </div>
      </td>
      <td>
        <strong>${data.student.name} ${data.student.surname}</strong>
        <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 4px;">(${data.student.number})</span>
      </td>
      <td>
        <span class="badge" style="background: rgba(255, 255, 255, 0.1); color: var(--text-primary); font-weight: 600;">${data.student.branch || '-'}</span>
      </td>
      <td style="text-align: center;"><strong>${data.bookCount}</strong> adet</td>
      <td style="text-align: center;"><span class="status-badge positive-tab active" style="font-weight: 700; font-size: 0.85rem; padding: 0.35rem 0.75rem;">${data.totalPages}</span></td>
    `;
    tbody.appendChild(row);
  });
}

function initStudentLibraryTab() {
  const select = document.getElementById('student-library-select');
  const statsContainer = document.getElementById('student-library-stats');
  const listsContainer = document.getElementById('student-library-lists');
  
  if (!select || !statsContainer || !listsContainer) return;
  
  // Save current select value to restore it after loading
  const currentSelectedId = select.value;
  
  // Clear previous options
  select.innerHTML = '<option value="">-- Öğrenci Seçin --</option>';
  statsContainer.style.display = 'none';
  listsContainer.style.display = 'none';
  
  const state = stateManager.loadState();
  const selectBranch = document.getElementById('books-select-branch');
  const branchFilter = selectBranch ? selectBranch.value : 'all';
  
  const activeStudents = state.students.filter(student => {
    return state.educationLevel === 'primary' || branchFilter === 'all' || student.branch === branchFilter;
  });
  
  const sortedStudents = [...activeStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  
  sortedStudents.forEach(student => {
    const opt = document.createElement('option');
    opt.value = student.id;
    opt.textContent = `${student.name} ${student.surname} (${student.number})`;
    select.appendChild(opt);
  });
  
  // Restore select value if it still exists
  if (currentSelectedId && activeStudents.some(s => s.id === currentSelectedId)) {
    select.value = currentSelectedId;
    statsContainer.style.display = 'grid';
    listsContainer.style.display = 'grid';
    renderStudentLibraryDetails(currentSelectedId);
  }
  
  select.onchange = () => {
    const studentId = select.value;
    if (studentId) {
      statsContainer.style.display = 'grid';
      listsContainer.style.display = 'grid';
      renderStudentLibraryDetails(studentId);
    } else {
      statsContainer.style.display = 'none';
      listsContainer.style.display = 'none';
    }
  };
}

function renderStudentLibraryDetails(studentId) {
  const state = stateManager.loadState();
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;
  
  const selectBranch = document.getElementById('books-select-branch');
  const branchFilter = selectBranch ? selectBranch.value : 'all';
  const activeStudents = state.students.filter(s => {
    return state.educationLevel === 'primary' || branchFilter === 'all' || s.branch === branchFilter;
  });
  
  // 1. Her öğrenci için okuma verilerini topla (Sıralama hesabı için)
  const studentData = activeStudents.map(s => {
    const returnedTx = state.books.transactions.filter(t => t.studentId === s.id && t.status === 'returned');
    let totalPages = 0;
    returnedTx.forEach(t => {
      const book = state.books.library.find(b => b.id === t.bookId);
      if (book) {
        totalPages += book.pages || 0;
      }
    });
    return {
      studentId: s.id,
      bookCount: returnedTx.length,
      totalPages
    };
  });
  
  // Liderlik tablosundaki gibi sırala
  studentData.sort((a, b) => {
    if (b.totalPages !== a.totalPages) {
      return b.totalPages - a.totalPages;
    }
    if (b.bookCount !== a.bookCount) {
      return b.bookCount - a.bookCount;
    }
    const studentA = state.students.find(s => s.id === a.studentId) || { name: '', surname: '' };
    const studentB = state.students.find(s => s.id === b.studentId) || { name: '', surname: '' };
    const nameA = `${studentA.name} ${studentA.surname}`;
    const nameB = `${studentB.name} ${studentB.surname}`;
    return nameA.localeCompare(nameB, 'tr');
  });
  
  const rankIndex = studentData.findIndex(d => d.studentId === studentId);
  const rank = rankIndex !== -1 ? rankIndex + 1 : '-';
  
  // 2. Seçili öğrencinin istatistiklerini hesapla
  const returnedTransactions = state.books.transactions.filter(t => t.studentId === studentId && t.status === 'returned');
  const readBookIds = new Set(returnedTransactions.map(t => t.bookId));
  
  let totalPages = 0;
  returnedTransactions.forEach(t => {
    const book = state.books.library.find(b => b.id === t.bookId);
    if (book) {
      totalPages += book.pages || 0;
    }
  });
  
  const readCount = returnedTransactions.length;
  const totalLibraryCount = state.books.library.length;
  const uniqueReadCount = readBookIds.size;
  const readingRatio = totalLibraryCount > 0 ? Math.round((uniqueReadCount / totalLibraryCount) * 100) : 0;
  
  // 3. İstatistik kartlarını çiz
  const statsContainer = document.getElementById('student-library-stats');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="report-stat-box" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; text-align: center; display: flex; flex-direction: column; gap: 0.25rem;">
        <span style="font-size: 1.5rem; font-weight: 800; color: var(--success);">${readCount}</span>
        <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary);">Okunan Kitap</span>
      </div>
      <div class="report-stat-box" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; text-align: center; display: flex; flex-direction: column; gap: 0.25rem;">
        <span style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">${totalPages}</span>
        <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary);">Toplam Sayfa</span>
      </div>
      <div class="report-stat-box" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; text-align: center; display: flex; flex-direction: column; gap: 0.25rem;">
        <span style="font-size: 1.5rem; font-weight: 800; color: var(--warning);">%${readingRatio}</span>
        <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary);">Kitaplık Okuma Oranı</span>
      </div>
      <div class="report-stat-box" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; text-align: center; display: flex; flex-direction: column; gap: 0.25rem;">
        <span style="font-size: 1.5rem; font-weight: 800; color: #ec4899;">#${rank} / ${activeStudents.length}</span>
        <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary);">Sınıftaki Sırası</span>
      </div>
    `;
  }
  
  // 4. Okunan / Okunmayan kitap listelerini oluştur
  const readContainer = document.getElementById('list-read-books');
  const unreadContainer = document.getElementById('list-unread-books');
  const countReadSpan = document.getElementById('count-read-books');
  const countUnreadSpan = document.getElementById('count-unread-books');
  
  if (readContainer && unreadContainer) {
    readContainer.innerHTML = '';
    unreadContainer.innerHTML = '';
    
    let readHtml = '';
    let unreadHtml = '';
    let readTotal = 0;
    let unreadTotal = 0;
    
    const sortedLibrary = [...state.books.library].sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    
    sortedLibrary.forEach(book => {
      const userTxForBook = returnedTransactions.filter(t => t.bookId === book.id);
      
      if (userTxForBook.length > 0) {
        // Okudu
        readTotal++;
        const latestTx = userTxForBook.sort((a,b) => new Date(b.borrowDate) - new Date(a.borrowDate))[0];
        const returnDateFormatted = latestTx && latestTx.returnDate 
          ? new Date(latestTx.returnDate).toLocaleDateString('tr-TR')
          : '-';
          
        readHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
            <div>
              <strong style="display: block; font-size: 0.85rem; color: var(--text-primary);">${book.title}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${book.author || 'Bilinmeyen Yazar'} | ${book.pages || 0} Sayfa</span>
            </div>
            <span style="font-size: 0.75rem; color: var(--success); font-weight: 600;">İade: ${returnDateFormatted}</span>
          </div>
        `;
      } else {
        // Okumadı
        unreadTotal++;
        const activeTx = state.books.transactions.find(t => t.bookId === book.id && t.status === 'reading');
        let statusBadge = '';
        if (activeTx) {
          const borrower = state.students.find(s => s.id === activeTx.studentId);
          const borrowerName = borrower ? `${borrower.name} ${borrower.surname}` : 'Başka Bir Öğrenci';
          statusBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.08); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.2); font-size: 0.7rem; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600; max-width: 140px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" title="Ödünç alan öğrenci: ${borrowerName}">${borrowerName}</span>`;
        } else {
          statusBadge = `<span class="badge" style="background: rgba(16, 185, 129, 0.08); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.7rem; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600;">Kitaplıkta</span>`;
        }
        
        unreadHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
            <div style="flex: 1; min-width: 0; padding-right: 0.5rem;">
              <strong style="display: block; font-size: 0.85rem; color: var(--text-primary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" title="${book.title}">${book.title}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; display: block;" title="${book.author || 'Bilinmeyen Yazar'}">${book.author || 'Bilinmeyen Yazar'} | ${book.pages || 0} Sayfa</span>
            </div>
            ${statusBadge}
          </div>
        `;
      }
    });
    
    if (readTotal === 0) {
      readContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">Okunan kitap bulunmuyor.</div>';
    } else {
      readContainer.innerHTML = readHtml;
    }
    
    if (unreadTotal === 0) {
      unreadContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">Kütüphanede okunmamış kitap kalmadı! 🎉</div>';
    } else {
      unreadContainer.innerHTML = unreadHtml;
    }
    
    if (countReadSpan) countReadSpan.textContent = readTotal;
    if (countUnreadSpan) countUnreadSpan.textContent = unreadTotal;
  }
}

window.setupBooksTab = setupBooksTab;
window.renderBooksList = renderBooksList;
window.renderLateBooksList = renderLateBooksList;
window.renderLeaderboard = renderLeaderboard;
window.renderTop20Leaderboard = renderTop20Leaderboard;
window.initStudentLibraryTab = initStudentLibraryTab;
window.renderStudentLibraryDetails = renderStudentLibraryDetails;
})();
