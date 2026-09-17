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
let currentEditBookTitle = '';
let currentEditBookAuthor = '';

function getGeminiApiKey() {
  const key = (localStorage.getItem('sinif_asistani_gemini_api_key') || '').trim();
  return key.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '');
}
window.getGeminiApiKey = getGeminiApiKey;

function setGeminiApiKey(key) {
  const trimmed = (key || '').trim().replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '');
  if (trimmed) {
    localStorage.setItem('sinif_asistani_gemini_api_key', trimmed);
  } else {
    localStorage.removeItem('sinif_asistani_gemini_api_key');
  }
}
window.setGeminiApiKey = setGeminiApiKey;

window.callGeminiAPI = async function(prompt, options = {}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  // 1. Önce API anahtarının erişebildiği aktif modelleri Google'dan doğrudan çek
  let listData = null;
  let listError = null;

  for (const apiVer of ['v1beta', 'v1']) {
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/${apiVer}/models?key=${apiKey}`);
      const json = await listRes.json();
      if (listRes.ok && json.models && json.models.length > 0) {
        listData = { version: apiVer, models: json.models };
        break;
      } else if (!listRes.ok) {
        listError = json.error?.message || `HTTP ${listRes.status}`;
      }
    } catch (e) {
      listError = e.message;
    }
  }

  if (!listData) {
    if (listError && (listError.toLowerCase().includes('api key not valid') || listError.toLowerCase().includes('invalid'))) {
      throw new Error('Google API anahtarı geçersiz! Lütfen anahtarınızı kontrol edip tekrar kaydedin.');
    }
    if (listError && (listError.includes('not been used in project') || listError.includes('disabled'))) {
      throw new Error('Google Cloud projenizde Generative Language API henüz etkin değil. Lütfen Google AI Studio\'da anahtar oluştururken "Create API key in new project" (Yeni projede oluştur) seçeneğini seçin.');
    }
    throw new Error(`Google API bağlantı hatası: ${listError || 'Modeller sorgulanamadı'}`);
  }

  // 2. generateContent destekleyen modelleri filtrele
  const supportedModels = listData.models.filter(m => 
    !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent')
  );

  if (supportedModels.length === 0) {
    throw new Error('Bu API anahtarının içerik üretme modellerine izni bulunmuyor. Lütfen Google AI Studio üzerinden "Create API key in new project" seçeneğiyle yeni bir anahtar oluşturun.');
  }

  // Flash modellerine ve alternatif sürümlere öncelik ver
  const prioritizedCandidateNames = [
    'models/gemini-3.6-flash',
    'models/gemini-3-flash',
    'models/gemini-2.5-flash-lite',
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.0-flash',
    ...supportedModels.map(m => m.name.startsWith('models/') ? m.name : `models/${m.name}`)
  ].filter((v, i, a) => a.indexOf(v) === i);

  let response = null;
  let lastErrDetail = '';
  const temperature = options.temperature !== undefined ? options.temperature : 0.3;
  const wantJson = options.json !== false;

  for (const modelPath of prioritizedCandidateNames) {
    const url = `https://generativelanguage.googleapis.com/${listData.version}/${modelPath}:generateContent?key=${apiKey}`;
    try {
      let curRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: temperature,
            ...(wantJson ? { responseMimeType: "application/json" } : {})
          }
        })
      });

      // Eğer responseMimeType desteklenmezse (400) formatsız dene
      if (curRes.status === 400 && wantJson) {
        curRes = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: temperature }
          })
        });
      }

      if (curRes.ok) {
        response = curRes;
        break;
      }

      let errDetail = '';
      try {
        const errJson = await curRes.json();
        errDetail = errJson.error?.message || curRes.statusText;
      } catch (e) {
        errDetail = curRes.statusText;
      }
      lastErrDetail = errDetail;

      // Google hata mesajında "Please update your code to use models/XYZ" önerisi verdiyse onu doğrudan dene!
      const match = errDetail.match(/use\s+(models\/[a-zA-Z0-9.-]+)/i);
      if (match && match[1]) {
        const suggestedUrl = `https://generativelanguage.googleapis.com/${listData.version}/${match[1]}:generateContent?key=${apiKey}`;
        const retryRes = await fetch(suggestedUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: temperature, ...(wantJson ? { responseMimeType: "application/json" } : {}) }
          })
        });
        if (retryRes.ok) {
          response = retryRes;
          break;
        }
      }

      // 404 (model bulunamadı), 503/500 (sunucu yoğun) veya High Demand durumunda diğer modeli dene!
      const isHighDemandOrUnavailable = curRes.status === 404 || 
        curRes.status === 503 || 
        curRes.status === 500 || 
        (curRes.status === 429 && errDetail.toLowerCase().includes('demand')) ||
        errDetail.toLowerCase().includes('high demand') ||
        errDetail.toLowerCase().includes('overloaded') ||
        errDetail.toLowerCase().includes('unavailable');

      if (isHighDemandOrUnavailable) {
        // Diğer modele geçmeden önce 400ms kısa bir bekleme
        await new Promise(r => setTimeout(r, 400));
        continue;
      }

      // Sadece gerçek yetkisiz (401/403) veya kota durumunda döngüyü sonlandır
      break;
    } catch (e) {
      lastErrDetail = e.message;
    }
  }

  if (!response || !response.ok) {
    if (lastErrDetail.toLowerCase().includes('high demand') || lastErrDetail.toLowerCase().includes('overloaded')) {
      throw new Error('Google Gemini sunucularında şu an anlık bir yoğunluk yaşanıyor. Lütfen 5-10 saniye sonra tekrar deneyin.');
    }
    throw new Error(`Yapay zeka servisi hatası: ${lastErrDetail || 'İstek tamamlanamadı.'}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Yapay zekadan boş yanıt alındı.');
  }

  return rawText;
};

async function generateBookQuestionsWithAI(bookTitle, bookAuthor) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const prompt = `Sen uzman bir Türkçe ve edebiyat öğretmenisin. İlkokul ve ortaokul düzeyindeki öğrenciler için aşağıdaki kitabın okunup anlaşıldığını derinlemesine ölçecek 5 adet açık uçlu soru ve her birinin detaylı doğru cevabını hazırla.

Kitap Adı: "${bookTitle}"
Yazar: "${bookAuthor || 'Bilinmiyor'}"

Yanıtını YALNIZCA geçerli bir JSON dizisi formatında ver. Kesinlikle başka hiçbir metin, açıklama veya markdown kodu (json codeblock vb.) yazma:
[
  {
    "question": "Soru metni...",
    "answer": "Beklenen doğru cevap / açıklama..."
  }
]
Kurallar:
1. Sorular kitaptaki önemli olay örgüsü, ana karakterlerin özellikleri/motivasyonları, dönüm noktaları veya ana fikirle ilgili olmalıdır.
2. Basit evet/hayır soruları sorma; öğrencinin okuduğunu kanıtlayacak belirleyici detaylar içersin.
3. Tam 5 adet soru-cevap çifti üret.`;

  const rawText = await window.callGeminiAPI(prompt, { json: true, temperature: 0.3 });

  let cleanJson = rawText.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }

  const arrayMatch = cleanJson.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    cleanJson = arrayMatch[0];
  }

  let questions;
  try {
    questions = JSON.parse(cleanJson);
  } catch (e) {
    throw new Error('Yapay zeka yanıtı geçerli JSON formatında değil: ' + e.message);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Yapay zeka geçerli soru listesi üretemedi.');
  }

  return questions;
}

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
  currentEditBookTitle = bookTitle;
  currentEditBookAuthor = bookAuthor;
  const state = stateManager.loadState();
  const book = state.books.library.find(b => b.id === bookId);
  if (!book) return;

  // AI yükleme ve buton durumunu sıfırla
  const aiLoadingState = document.getElementById('ai-questions-loading-state');
  if (aiLoadingState) aiLoadingState.style.display = 'none';
  const btnAi = document.getElementById('btn-ai-generate-book-questions');
  if (btnAi) btnAi.disabled = false;

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
let currentStudentDetailLevelFilter = 'all';

// Modallar ve Formlar
const btnAddBook = document.getElementById('btn-add-book');
const modalBook = document.getElementById('modal-book');
const formBook = document.getElementById('form-book');
const bookNoInput = document.getElementById('book-no-input');
const bookTitleInput = document.getElementById('book-title-input');
const bookAuthorInput = document.getElementById('book-author-input');
const bookPagesInput = document.getElementById('book-pages-input');
const bookLevelInput = document.getElementById('book-level-input');

const btnBorrowBook = document.getElementById('btn-borrow-book');
const modalBorrow = document.getElementById('modal-borrow');
const formBorrow = document.getElementById('form-borrow');
const borrowStudentSelect = document.getElementById('borrow-student-select');
const borrowBookSelect = document.getElementById('borrow-book-select');
const borrowDateInput = document.getElementById('borrow-date-input');
const borrowLevelFilter = document.getElementById('borrow-level-filter');

let toastCallback = null;

function setupBooksTab(showToast) {
  toastCallback = showToast;

  function updateBooksHeaderActions(activeTab) {
    const btnAddBook = document.getElementById('btn-add-book');
    const btnDownloadTemplate = document.getElementById('btn-download-book-template');
    const btnUploadTrigger = document.getElementById('btn-upload-books-trigger');
    const btnBatchAIQuestions = document.getElementById('btn-batch-ai-questions');
    
    if (btnAddBook && btnDownloadTemplate && btnUploadTrigger) {
      if (activeTab === 'leaderboard') {
        btnAddBook.style.display = 'inline-flex';
        btnDownloadTemplate.style.display = 'inline-flex';
        btnUploadTrigger.style.display = 'inline-flex';
        if (btnBatchAIQuestions) btnBatchAIQuestions.style.display = 'inline-flex';
      } else {
        btnAddBook.style.display = 'none';
        btnDownloadTemplate.style.display = 'none';
        btnUploadTrigger.style.display = 'none';
        if (btnBatchAIQuestions) btnBatchAIQuestions.style.display = 'none';
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
          ["Kitap No", "Kitap Adı", "Yazar", "Sayfa Sayısı", "Seviye (1 veya 2)"],
          ["101", "Küçük Prens", "Antoine de Saint-Exupéry", 96, 1],
          ["102", "Şeker Portakalı", "José Mauro de Vasconcelos", 182, 1],
          ["103", "Sol Ayağım", "Christy Brown", 192, 2],
          ["104", "Define Adası", "Robert Louis Stevenson", 224, 2]
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 18 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Kitaplık Şablonu");
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        downloadBlob(blob, "kitap_ekleme_sablonu.xlsx");
        
        if (toastCallback) {
          toastCallback('Excel (.xlsx) kitap ekleme şablonu indirildi.', 'success');
        }
      } else {
        const headers = "Kitap No;Kitap Adı;Yazar;Sayfa Sayısı;Seviye (1 veya 2)";
        const rows = [
          "101;Küçük Prens;Antoine de Saint-Exupéry;96;1",
          "102;Şeker Portakalı;José Mauro de Vasconcelos;182;1",
          "103;Sol Ayağım;Christy Brown;192;2",
          "104;Define Adası;Robert Louis Stevenson;224;2"
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
            let colLevel = -1;
            let startIdx = 0;

            if (json.length > 0) {
              const firstRow = json[0];
              const firstVal = String(firstRow[0] || '').toLowerCase().trim();
              const hasHeaders = firstVal.includes('ad') || firstVal.includes('title') || firstVal.includes('no') || firstVal.includes('yazar') || firstVal.includes('sayfa') || firstVal.includes('seviye');
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
                  } else if (val.includes('seviye') || val.includes('level')) {
                    colLevel = c;
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
              let level = 'seviye_1';
              if (colLevel !== -1 && row[colLevel] !== undefined) {
                const lvlStr = String(row[colLevel]).toLowerCase().trim();
                if (lvlStr === '2' || lvlStr.includes('2') || lvlStr.includes('ileri')) {
                  level = 'seviye_2';
                }
              }
              
              if (title) {
                parsed.push({ bookNo, title, author, pages, level });
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
            let colLevel = -1;
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
              const hasHeaders = firstRowCols.some(val => val.includes('ad') || val.includes('title') || val.includes('no') || val.includes('yazar') || val.includes('sayfa') || val.includes('seviye'));
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
                  } else if (val.includes('seviye') || val.includes('level')) {
                    colLevel = c;
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
              let level = 'seviye_1';
              if (colLevel !== -1 && cols[colLevel] !== undefined) {
                const lvlStr = String(cols[colLevel]).replace(/"/g, '').toLowerCase().trim();
                if (lvlStr === '2' || lvlStr.includes('2') || lvlStr.includes('ileri')) {
                  level = 'seviye_2';
                }
              }

              if (title) {
                parsed.push({ bookNo, title, author, pages, level });
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
    if (bookLevelInput) bookLevelInput.value = 'seviye_1';
    modalBook.classList.add('active');
  });

  // Ödünç Verme Modalı Açılış
  btnBorrowBook.addEventListener('click', () => {
    if (borrowLevelFilter) borrowLevelFilter.value = 'all';
    populateBorrowDropdowns();
    // Tarih seçiciyi bugünün tarihi ile başlat
    borrowDateInput.value = window.formatLocalDate();
    modalBorrow.classList.add('active');
  });

  // Öğrenci veya Seviye Filtresi seçildiğinde kitap listesini güncelle
  if (borrowStudentSelect) {
    borrowStudentSelect.addEventListener('change', () => {
      updateBorrowBookSelect();
    });
  }
  if (borrowLevelFilter) {
    borrowLevelFilter.addEventListener('change', () => {
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
      bookNo: bookNoInput.value.trim(),
      level: bookLevelInput ? bookLevelInput.value : 'seviye_1'
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

  // --- Yapay Zeka (AI) Soru Üretimi ve API Anahtarı Olayları ---
  const btnAiGenerateQuestions = document.getElementById('btn-ai-generate-book-questions');
  const btnEditQuestionsApiKey = document.getElementById('btn-edit-questions-api-key');
  const modalGeminiKeySetup = document.getElementById('modal-gemini-key-setup');
  const inputModalGeminiApiKey = document.getElementById('input-modal-gemini-api-key');
  const btnSaveModalGeminiKey = document.getElementById('btn-save-modal-gemini-key');
  const btnToggleModalKeyVisibility = document.getElementById('btn-toggle-modal-key-visibility');
  const iconToggleModalKey = document.getElementById('icon-toggle-modal-key');
  const aiLoadingState = document.getElementById('ai-questions-loading-state');
  const aiLoadingBookTitle = document.getElementById('ai-loading-book-title');

  function openGeminiKeyModal() {
    if (modalGeminiKeySetup && inputModalGeminiApiKey) {
      inputModalGeminiApiKey.value = getGeminiApiKey();
      modalGeminiKeySetup.classList.add('active');
      window.safeCreateIcons();
    }
  }
  window.openGeminiKeyModal = openGeminiKeyModal;

  if (btnEditQuestionsApiKey) {
    btnEditQuestionsApiKey.addEventListener('click', () => {
      openGeminiKeyModal();
    });
  }

  if (btnToggleModalKeyVisibility && inputModalGeminiApiKey) {
    btnToggleModalKeyVisibility.addEventListener('click', () => {
      if (inputModalGeminiApiKey.type === 'password') {
        inputModalGeminiApiKey.type = 'text';
        if (iconToggleModalKey) iconToggleModalKey.setAttribute('data-lucide', 'eye-off');
      } else {
        inputModalGeminiApiKey.type = 'password';
        if (iconToggleModalKey) iconToggleModalKey.setAttribute('data-lucide', 'eye');
      }
      window.safeCreateIcons();
    });
  }

  if (btnSaveModalGeminiKey && inputModalGeminiApiKey) {
    btnSaveModalGeminiKey.addEventListener('click', () => {
      const key = inputModalGeminiApiKey.value.trim();
      setGeminiApiKey(key);
      const configKeyInput = document.getElementById('config-gemini-api-key');
      if (configKeyInput) configKeyInput.value = key;
      const statusMsg = document.getElementById('gemini-key-status-msg');
      if (statusMsg) {
        if (key) {
          statusMsg.style.display = 'block';
          statusMsg.style.color = 'var(--success)';
          statusMsg.textContent = '✓ Tanımlı API anahtarı aktif.';
        } else {
          statusMsg.style.display = 'none';
        }
      }
      if (modalGeminiKeySetup) modalGeminiKeySetup.classList.remove('active');
      if (toastCallback) {
        toastCallback(key ? 'Google Gemini API anahtarı başarıyla kaydedildi!' : 'API anahtarı temizlendi.', key ? 'success' : 'info');
      }
    });
  }

  document.querySelectorAll('#modal-gemini-key-setup .close-btn, #modal-gemini-key-setup .close-btn-action').forEach(btn => {
    btn.addEventListener('click', () => {
      if (modalGeminiKeySetup) modalGeminiKeySetup.classList.remove('active');
    });
  });

  if (btnAiGenerateQuestions) {
    btnAiGenerateQuestions.addEventListener('click', async () => {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        if (toastCallback) {
          toastCallback('Lütfen önce ücretsiz Google Gemini API anahtarınızı tanımlayın.', 'warning');
        }
        openGeminiKeyModal();
        return;
      }

      if (!currentEditBookId) {
        if (toastCallback) toastCallback('Düzenlenecek kitap seçilemedi.', 'danger');
        return;
      }

      const container = document.getElementById('edit-questions-list-container');
      if (!container) return;

      try {
        btnAiGenerateQuestions.disabled = true;
        if (aiLoadingState) {
          if (aiLoadingBookTitle) {
            aiLoadingBookTitle.textContent = `Yapay zeka "${currentEditBookTitle}" kitabı için soruları hazırlıyor...`;
          }
          aiLoadingState.style.display = 'block';
        }

        const generatedQuestions = await generateBookQuestionsWithAI(currentEditBookTitle, currentEditBookAuthor);

        container.innerHTML = '';
        generatedQuestions.forEach(item => {
          addQuestionEditRow(container, item.question, item.answer);
        });

        if (toastCallback) {
          toastCallback(`"${currentEditBookTitle}" kitabı için 5 adet soru hazırlandı! Kalıcı olması için lütfen Kaydet butonuna basın.`, 'success');
        }
      } catch (err) {
        console.error('Yapay Zeka Soru Üretim Hatası:', err);
        if (err.message === 'NO_API_KEY') {
          openGeminiKeyModal();
        } else {
          if (toastCallback) {
            toastCallback(err.message || 'Yapay zeka soruları hazırlarken bir hata oluştu.', 'danger');
          }
        }
      } finally {
        btnAiGenerateQuestions.disabled = false;
        if (aiLoadingState) aiLoadingState.style.display = 'none';
        window.safeCreateIcons();
      }
    });
  }

  // Toplu Yapay Zeka Soru Üretimi (Kütüphanedeki sorusuz kitaplar için)
  const btnBatchAIQuestions = document.getElementById('btn-batch-ai-questions');
  if (btnBatchAIQuestions) {
    btnBatchAIQuestions.addEventListener('click', async () => {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        if (toastCallback) {
          toastCallback('Toplu soru üretimi için lütfen önce Gemini API anahtarınızı tanımlayın.', 'warning');
        }
        openGeminiKeyModal();
        return;
      }

      const state = stateManager.loadState();
      const library = state.books.library || [];
      if (library.length === 0) {
        if (toastCallback) toastCallback('Kütüphanede henüz kitap bulunmuyor.', 'info');
        return;
      }

      // Özel sorusu olmayan veya boş olan kitapları filtrele
      const targetBooks = library.filter(b => !b.questions || b.questions.length === 0);
      if (targetBooks.length === 0) {
        if (toastCallback) toastCallback('Kütüphanedeki tüm kitapların soruları zaten tanımlı!', 'success');
        return;
      }

      const confirmed = confirm(
        `Kütüphanenizde henüz özel sorusu bulunmayan ${targetBooks.length} adet kitap tespit edildi.\n\n` +
        `Yapay zeka her biri için 5'er adet okuduğunu anlama sorusu ve cevabı hazırlayıp kaydedecektir.\n` +
        `İşlemi başlatmak istiyor musunuz?`
      );
      if (!confirmed) return;

      btnBatchAIQuestions.disabled = true;
      btnBatchAIQuestions.innerHTML = `<span class="ai-spinner" style="width:14px;height:14px;border-width:2px;"></span> Hazırlanıyor...`;

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < targetBooks.length; i++) {
        const book = targetBooks[i];
        if (toastCallback) {
          toastCallback(`[${i + 1}/${targetBooks.length}] "${book.title}" için sorular hazırlanıyor...`, 'info');
        }

        try {
          const qs = await generateBookQuestionsWithAI(book.title, book.author);
          const res = stateManager.updateBookQuestions(book.id, qs);
          if (res && res.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(`Soru üretim hatası (${book.title}):`, err);
          failCount++;
        }

        // Dakikalık kota (15 RPM) aşılmaması için istekler arası 1.2 saniye bekle
        if (i < targetBooks.length - 1) {
          await new Promise(res => setTimeout(res, 1200));
        }
      }

      btnBatchAIQuestions.disabled = false;
      btnBatchAIQuestions.innerHTML = `<i data-lucide="sparkles" style="width: 15px; height: 15px;"></i> Toplu AI Soruları`;
      window.safeCreateIcons();

      renderBooksList();
      const event = new CustomEvent('stateChanged');
      document.dispatchEvent(event);

      if (toastCallback) {
        if (failCount === 0) {
          toastCallback(`Harika! ${successCount} adet kitabın tüm soruları yapay zeka ile başarıyla hazırlandı ve kaydedildi.`, 'success');
        } else {
          toastCallback(`${successCount} kitabın soruları hazırlandı, ${failCount} kitapta hata oluştu.`, 'warning');
        }
      }
    });
  }

  // --- KİTAP DÜZENLEME & SİLME MODAL VE TOOLBAR DİNLİYİCİLERİ ---
  const modalEditBook = document.getElementById('modal-edit-book');
  const formEditBook = document.getElementById('form-edit-book');
  const btnModalDeleteBook = document.getElementById('btn-modal-delete-book');
  const editIdInput = document.getElementById('edit-book-id');
  const editNoInput = document.getElementById('edit-book-no-input');
  const editTitleInput = document.getElementById('edit-book-title-input');
  const editAuthorInput = document.getElementById('edit-book-author-input');
  const editPagesInput = document.getElementById('edit-book-pages-input');

  // Düzenleme Modalı Kapatma
  if (modalEditBook) {
    modalEditBook.querySelectorAll('.close-btn, .close-btn-action').forEach(btn => {
      btn.addEventListener('click', () => {
        modalEditBook.classList.remove('active');
      });
    });
  }

  // Düzenleme Formu Gönderimi (Kitap Bilgilerini Güncelleme)
  if (formEditBook) {
    formEditBook.addEventListener('submit', (e) => {
      e.preventDefault();
      const bookId = editIdInput ? editIdInput.value : '';
      if (!bookId) return;

      const editLevelInput = document.getElementById('edit-book-level-input');
      const bookData = {
        bookNo: editNoInput ? editNoInput.value.trim() : '',
        title: editTitleInput ? editTitleInput.value.trim() : '',
        author: editAuthorInput ? editAuthorInput.value.trim() : '',
        pages: editPagesInput ? parseInt(editPagesInput.value) || 0 : 0,
        level: editLevelInput ? editLevelInput.value : 'seviye_1'
      };

      if (!bookData.title) {
        if (toastCallback) toastCallback('Lütfen kitap adını giriniz.', 'danger');
        return;
      }

      stateManager.updateBook(bookId, bookData);
      if (modalEditBook) modalEditBook.classList.remove('active');
      if (toastCallback) toastCallback(`"${bookData.title}" kitap bilgileri güncellendi.`, 'success');

      renderBooksList();
      renderLeaderboard();
      const event = new CustomEvent('stateChanged');
      document.dispatchEvent(event);
    });
  }

  // Düzenleme Modalındaki "Bu Kitabı Sil" Düğmesi
  if (btnModalDeleteBook) {
    btnModalDeleteBook.addEventListener('click', () => {
      const bookId = editIdInput ? editIdInput.value : '';
      if (!bookId) return;
      const state = stateManager.loadState();
      const book = state.books.library.find(b => b.id === bookId);
      if (book) {
        if (modalEditBook) modalEditBook.classList.remove('active');
        confirmAndDeleteBook(book);
      }
    });
  }

  // Kitaplık Arama Çubuğu
  const inputLibrarySearch = document.getElementById('input-library-search');
  if (inputLibrarySearch) {
    inputLibrarySearch.addEventListener('input', (e) => {
      librarySearchQuery = e.target.value;
      renderBooksList();
    });
  }

  // Kitaplık Durum Filtresi
  const selectLibraryFilter = document.getElementById('select-library-filter');
  if (selectLibraryFilter) {
    selectLibraryFilter.addEventListener('change', (e) => {
      libraryFilterStatus = e.target.value;
      renderBooksList();
    });
  }

  // Toplu Silme Modu Açma/Kapatma
  const btnToggleBulk = document.getElementById('btn-toggle-bulk-delete-books');
  const bulkBar = document.getElementById('bulk-delete-books-bar');
  const btnCancelBulk = document.getElementById('btn-cancel-bulk-delete-books');
  const chkSelectAll = document.getElementById('chk-select-all-books');
  const btnConfirmBulk = document.getElementById('btn-confirm-bulk-delete-books');

  if (btnToggleBulk) {
    btnToggleBulk.addEventListener('click', () => {
      isBulkDeleteMode = !isBulkDeleteMode;
      selectedBookIds.clear();
      if (bulkBar) {
        bulkBar.style.display = isBulkDeleteMode ? 'flex' : 'none';
      }
      if (isBulkDeleteMode) {
        btnToggleBulk.classList.add('btn-primary');
        btnToggleBulk.classList.remove('btn-secondary');
      } else {
        btnToggleBulk.classList.remove('btn-primary');
        btnToggleBulk.classList.add('btn-secondary');
      }
      renderBooksList();
      updateBulkDeleteCountUI();
    });
  }

  if (btnCancelBulk) {
    btnCancelBulk.addEventListener('click', () => {
      isBulkDeleteMode = false;
      selectedBookIds.clear();
      if (bulkBar) bulkBar.style.display = 'none';
      if (btnToggleBulk) {
        btnToggleBulk.classList.remove('btn-primary');
        btnToggleBulk.classList.add('btn-secondary');
      }
      renderBooksList();
      updateBulkDeleteCountUI();
    });
  }

  // Tümünü Seç / Kaldır Onay Kutusu
  if (chkSelectAll) {
    chkSelectAll.addEventListener('change', () => {
      const state = stateManager.loadState();
      const allBooks = state.books.library || [];
      const query = librarySearchQuery.trim().toLowerCase();
      const readingBookIds = state.books.transactions
        .filter(t => t.status === 'reading')
        .map(t => t.bookId);

      const visibleBooks = allBooks.filter(book => {
        if (query) {
          const titleMatch = (book.title || '').toLowerCase().includes(query);
          const authorMatch = (book.author || '').toLowerCase().includes(query);
          const noMatch = (book.bookNo || '').toLowerCase().includes(query);
          if (!titleMatch && !authorMatch && !noMatch) return false;
        }
        const isReading = readingBookIds.includes(book.id);
        const hasQuestions = Array.isArray(book.questions) && book.questions.length > 0;
        if (libraryFilterStatus === 'available' && isReading) return false;
        if (libraryFilterStatus === 'reading' && !isReading) return false;
        if (libraryFilterStatus === 'has_questions' && !hasQuestions) return false;
        if (libraryFilterStatus === 'no_questions' && hasQuestions) return false;
        return true;
      });

      if (chkSelectAll.checked) {
        visibleBooks.forEach(b => selectedBookIds.add(b.id));
      } else {
        visibleBooks.forEach(b => selectedBookIds.delete(b.id));
      }

      renderBooksList();
      updateBulkDeleteCountUI(visibleBooks.length);
    });
  }

  // Seçilenleri Silme Onayı ve İşlemi
  if (btnConfirmBulk) {
    btnConfirmBulk.addEventListener('click', async () => {
      const count = selectedBookIds.size;
      if (count === 0) {
        if (toastCallback) toastCallback('Lütfen önce silinecek kitapları seçin.', 'warning');
        return;
      }

      const state = stateManager.loadState();
      const readingCount = state.books.transactions.filter(
        t => t.status === 'reading' && selectedBookIds.has(t.bookId)
      ).length;

      let msg = `Seçilen ${count} adet kitabı kütüphaneden kalıcı olarak silmek istediğinize emin misiniz?`;
      if (readingCount > 0) {
        msg += `\n\nDikkat: Seçtiğiniz kitaplardan ${readingCount} tanesi şu anda öğrenciler tarafından okunmaktadır!`;
      }

      const ok = window.confirmAsync ?
        await window.confirmAsync(msg) :
        confirm(msg);

      if (ok) {
        const idsToDelete = Array.from(selectedBookIds);
        stateManager.deleteBooks(idsToDelete);
        selectedBookIds.clear();
        isBulkDeleteMode = false;
        if (bulkBar) bulkBar.style.display = 'none';
        if (btnToggleBulk) {
          btnToggleBulk.classList.remove('btn-primary');
          btnToggleBulk.classList.add('btn-secondary');
        }

        renderBooksList();
        renderLeaderboard();
        if (toastCallback) toastCallback(`${count} adet kitap başarıyla silindi.`, 'success');

        const event = new CustomEvent('stateChanged');
        document.dispatchEvent(event);
      }
    });
  }

  // Tümünü Temizle (Kütüphanedeki Tüm Kitapları Sil) Düğmesi
  const btnDeleteAllBooks = document.getElementById('btn-delete-all-books');
  if (btnDeleteAllBooks) {
    btnDeleteAllBooks.addEventListener('click', async () => {
      const state = stateManager.loadState();
      const totalBooks = (state.books.library || []).length;
      if (totalBooks === 0) {
        if (toastCallback) toastCallback('Kütüphanenizde silinecek kitap bulunmuyor.', 'info');
        return;
      }

      const activeReadings = state.books.transactions.filter(t => t.status === 'reading').length;
      let msg = `Kütüphanedeki TÜM KİTAPLARI (${totalBooks} adet) silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`;
      if (activeReadings > 0) {
        msg += `\n\nUyarı: Şu anda aktif olarak okunan ${activeReadings} adet kitap bulunmaktadır.`;
      }

      const ok = window.confirmAsync ?
        await window.confirmAsync(msg) :
        confirm(msg);

      if (ok) {
        stateManager.deleteAllBooks();
        selectedBookIds.clear();
        isBulkDeleteMode = false;
        if (bulkBar) bulkBar.style.display = 'none';
        if (btnToggleBulk) {
          btnToggleBulk.classList.remove('btn-primary');
          btnToggleBulk.classList.add('btn-secondary');
        }

        renderBooksList();
        renderLeaderboard();
        if (toastCallback) toastCallback('Kütüphanedeki tüm kitaplar temizlendi.', 'success');

        const event = new CustomEvent('stateChanged');
        document.dispatchEvent(event);
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

  const borrowLevelFilter = document.getElementById('borrow-level-filter');
  const selectedLevel = borrowLevelFilter ? borrowLevelFilter.value : 'all';

  let filteredByLevel = availableBooks;
  if (selectedLevel !== 'all') {
    filteredByLevel = availableBooks.filter(book => (book.level || 'seviye_1') === selectedLevel);
  }

  if (filteredByLevel.length === 0) {
    const levelLabel = selectedLevel === 'seviye_1' ? '1. Seviye' : (selectedLevel === 'seviye_2' ? '2. Seviye' : '');
    borrowBookSelect.innerHTML = `<option value="">${levelLabel ? levelLabel + ' kategorisinde ' : ''}ödünç verilebilecek uygun kitap bulunmuyor</option>`;
  } else {
    filteredByLevel.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    filteredByLevel.forEach(book => {
      const levelTag = (book.level === 'seviye_2') ? '[2. Seviye]' : '[1. Seviye]';
      borrowBookSelect.innerHTML += `<option value="${book.id}">${levelTag} ${book.title} - ${book.author} (${book.pages} s.)</option>`;
    });
  }
}

// Kitaplık Arama, Filtreleme ve Toplu Silme Durum Değişkenleri
let librarySearchQuery = '';
let libraryFilterStatus = 'all';
let isBulkDeleteMode = false;
const selectedBookIds = new Set();

// Kitap Silme Onay ve Gerçekleştirme Yardımcısı
async function confirmAndDeleteBook(book) {
  if (!book) return;
  const state = stateManager.loadState();
  const activeTx = state.books.transactions.find(t => t.bookId === book.id && t.status === 'reading');
  let confirmMsg = `"${book.title}" adlı kitabı kütüphaneden silmek istediğinize emin misiniz?`;
  if (activeTx) {
    const student = state.students.find(s => s.id === activeTx.studentId);
    const studentName = student ? `${student.name} ${student.surname}` : 'bir öğrenci';
    confirmMsg = `"${book.title}" adlı kitap şu an ${studentName} tarafından okunmaktadır.\n\nKitabı silerseniz öğrencinin aktif okuma kaydı da silinecektir. Devam etmek istiyor musunuz?`;
  }

  const ok = window.confirmAsync ?
    await window.confirmAsync(confirmMsg) :
    confirm(confirmMsg);

  if (ok) {
    selectedBookIds.delete(book.id);
    stateManager.deleteBook(book.id);
    renderBooksList();

    if (toastCallback) {
      toastCallback(`"${book.title}" kütüphaneden silindi.`, 'success');
    }

    const event = new CustomEvent('stateChanged');
    document.dispatchEvent(event);
  }
}

// Kitap Bilgilerini Düzenleme Modalını Açma
function openEditBookModal(bookId) {
  const state = stateManager.loadState();
  const book = state.books.library.find(b => b.id === bookId);
  if (!book) return;

  const modalEditBook = document.getElementById('modal-edit-book');
  const editIdInput = document.getElementById('edit-book-id');
  const editNoInput = document.getElementById('edit-book-no-input');
  const editTitleInput = document.getElementById('edit-book-title-input');
  const editAuthorInput = document.getElementById('edit-book-author-input');
  const editPagesInput = document.getElementById('edit-book-pages-input');

  if (modalEditBook && editIdInput && editTitleInput && editAuthorInput && editPagesInput) {
    editIdInput.value = book.id;
    if (editNoInput) editNoInput.value = book.bookNo || '';
    editTitleInput.value = book.title || '';
    editAuthorInput.value = book.author || '';
    editPagesInput.value = book.pages || 0;
    const editLevelInput = document.getElementById('edit-book-level-input');
    if (editLevelInput) editLevelInput.value = book.level || 'seviye_1';
    modalEditBook.classList.add('active');
    if (window.safeCreateIcons) window.safeCreateIcons();
  }
}

// Toplu Silme Seçim Sayısı ve Durumu Arayüz Yardımcısı
function updateBulkDeleteCountUI(currentVisibleCount = 0) {
  const countText = document.getElementById('selected-books-count-text');
  const chkSelectAll = document.getElementById('chk-select-all-books');
  const btnConfirmBulk = document.getElementById('btn-confirm-bulk-delete-books');
  const count = selectedBookIds.size;

  if (countText) {
    countText.textContent = `(${count} kitap seçildi)`;
  }

  if (btnConfirmBulk) {
    btnConfirmBulk.disabled = count === 0;
    btnConfirmBulk.style.opacity = count === 0 ? '0.6' : '1';
    btnConfirmBulk.style.cursor = count === 0 ? 'not-allowed' : 'pointer';
  }

  if (chkSelectAll && currentVisibleCount > 0) {
    chkSelectAll.checked = count > 0 && count === currentVisibleCount;
    chkSelectAll.indeterminate = count > 0 && count < currentVisibleCount;
  }
}

// Kitaplık ve Aktif Okumaları Çiz
function renderBooksList() {
  const state = stateManager.loadState();
  
  // 1. Kitaplık Envanteri Çizimi
  libraryContainer.innerHTML = '';
  const allBooks = state.books.library || [];

  // Toplam rozetini güncelle
  const countBadge = document.getElementById('library-books-count-badge');
  if (countBadge) {
    countBadge.textContent = `${allBooks.length} Kitap`;
  }

  if (allBooks.length === 0) {
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

    // Arama ve Filtreleme Uygula
    const query = librarySearchQuery.trim().toLowerCase();
    const filteredBooks = allBooks.filter(book => {
      // 1. Arama sorgusu filtresi
      if (query) {
        const titleMatch = (book.title || '').toLowerCase().includes(query);
        const authorMatch = (book.author || '').toLowerCase().includes(query);
        const noMatch = (book.bookNo || '').toLowerCase().includes(query);
        if (!titleMatch && !authorMatch && !noMatch) return false;
      }

      // 2. Durum filtresi
      const isReading = readingBookIds.includes(book.id);
      const hasQuestions = Array.isArray(book.questions) && book.questions.length > 0;

      if (libraryFilterStatus === 'available' && isReading) return false;
      if (libraryFilterStatus === 'reading' && !isReading) return false;
      if (libraryFilterStatus === 'level_1' && (book.level || 'seviye_1') !== 'seviye_1') return false;
      if (libraryFilterStatus === 'level_2' && book.level !== 'seviye_2') return false;
      if (libraryFilterStatus === 'has_questions' && !hasQuestions) return false;
      if (libraryFilterStatus === 'no_questions' && hasQuestions) return false;

      return true;
    });

    if (filteredBooks.length === 0) {
      libraryContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <i data-lucide="search-x" style="width: 36px; height: 36px; opacity: 0.5; margin-bottom: 0.5rem;"></i>
          <p style="margin: 0; font-size: 0.9rem;">Arama kriterlerinize uygun kitap bulunamadı.</p>
        </div>
      `;
      if (window.safeCreateIcons) window.safeCreateIcons();
    } else {
      const sortedLibrary = [...filteredBooks].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'tr'));

      sortedLibrary.forEach(book => {
        const activeTxForBook = state.books.transactions.find(t => t.bookId === book.id && t.status === 'reading');
        const isReading = !!activeTxForBook;
        const isSelected = selectedBookIds.has(book.id);
        const isLevel2 = book.level === 'seviye_2';
        const levelBadgeHtml = isLevel2
          ? `<span class="badge" style="font-size: 0.68rem; font-weight: 700; background: rgba(147, 51, 234, 0.12); color: #9333ea; border: 1px solid rgba(147, 51, 234, 0.25); padding: 0.15rem 0.45rem; border-radius: 4px;">2. Seviye (İleri)</span>`
          : `<span class="badge" style="font-size: 0.68rem; font-weight: 700; background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25); padding: 0.15rem 0.45rem; border-radius: 4px;">1. Seviye (Kolay)</span>`;
        
        let readerNameBadge = '';
        if (activeTxForBook) {
          const student = state.students.find(s => s.id === activeTxForBook.studentId);
          if (student) {
            const readerName = `${student.name} ${student.surname}`;
            readerNameBadge = `<div class="book-reader-badge" style="position: absolute; top: 8px; left: ${isBulkDeleteMode ? '36px' : '8px'}; right: 38px; background: rgba(15, 23, 42, 0.8); color: #fff; padding: 0.25rem 0.4rem; border-radius: var(--radius-sm); font-size: 0.65rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center;" title="${readerName}">${readerName}</div>`;
          }
        }
        
        const card = document.createElement('div');
        card.className = `glass-card book-card ${isSelected ? 'book-card-selected' : ''}`;
        if (isSelected) {
          card.style.borderColor = 'var(--danger)';
          card.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.3)';
        }
        
        const bulkCheckboxHtml = isBulkDeleteMode ? `
          <div class="book-select-checkbox-container">
            <input type="checkbox" class="chk-book-select" data-id="${book.id}" ${isSelected ? 'checked' : ''}>
          </div>
        ` : '';

        card.innerHTML = `
          ${bulkCheckboxHtml}
          <div class="book-card-actions">
            <button type="button" class="action-btn-sm delete delete-book-card-btn" title="Bu Kitabı Sil" data-id="${book.id}">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
          <div class="book-cover" style="background: ${isReading ? 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)' : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'}; position: relative;">
            ${readerNameBadge}
            <i data-lucide="book"></i>
            ${isReading ? '<span style="position: absolute; bottom: 8px; font-size: 0.65rem; background: rgba(0,0,0,0.5); padding: 0.1rem 0.5rem; border-radius: 4px; font-weight: 700;">OKUNUYOR</span>' : ''}
          </div>
          <div class="book-title book-title-question-link" data-book-id="${book.id}" title="Kitap Sorularını Gör" style="cursor: pointer;">${book.title}</div>
          <div class="book-author">${book.author}</div>
          <div class="book-pages" style="margin-bottom: 0.4rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
            <span style="font-weight: 600;">No: ${book.bookNo || '-'}</span>
            <span>${book.pages} Sayfa</span>
          </div>
          <div style="margin-bottom: 0.75rem; display: flex; align-items: center;">
            ${levelBadgeHtml}
          </div>
          <div class="book-actions-footer" style="margin-top: auto; display: flex; gap: 0.35rem; width: 100%; border-top: 1px solid var(--border-color); padding-top: 0.65rem; justify-content: space-between;">
            <button type="button" class="action-btn-sm view-questions-action" title="Soruları Gör" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.2rem; font-size: 0.72rem; font-weight: 600; padding: 0.35rem 0.4rem; border-radius: var(--radius-sm); border: 1px solid rgba(79, 70, 229, 0.2); background: rgba(79, 70, 229, 0.05); color: var(--primary); cursor: pointer;">
              <i data-lucide="help-circle" style="width: 13px; height: 13px;"></i> Sorular
            </button>
            <button type="button" class="action-btn-sm edit-book-action" title="Kitap Bilgilerini Düzenle" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.2rem; font-size: 0.72rem; font-weight: 600; padding: 0.35rem 0.4rem; border-radius: var(--radius-sm); border: 1px solid rgba(245, 158, 11, 0.25); background: rgba(245, 158, 11, 0.05); color: var(--warning); cursor: pointer;">
              <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i> Düzenle
            </button>
            <button type="button" class="action-btn-sm delete-book-action" title="Kitabı Sil" style="display: inline-flex; align-items: center; justify-content: center; padding: 0.35rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.06); color: var(--danger); cursor: pointer;">
              <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
            </button>
          </div>
        `;

        // Soruları Gör
        card.querySelector('.view-questions-action').addEventListener('click', (e) => {
          e.preventDefault();
          openBookQuestionsModal(book.id, book.title, book.author);
        });

        // Başlığa tıklandığında soruları gör
        card.querySelector('.book-title-question-link').addEventListener('click', (e) => {
          e.preventDefault();
          openBookQuestionsModal(book.id, book.title, book.author);
        });

        // Kitap Düzenle
        card.querySelector('.edit-book-action').addEventListener('click', (e) => {
          e.preventDefault();
          openEditBookModal(book.id);
        });

        // Kitap Sil (Alt buton ve Sağ üst buton)
        const handleDelete = (e) => {
          e.preventDefault();
          e.stopPropagation();
          confirmAndDeleteBook(book);
        };
        card.querySelector('.delete-book-action').addEventListener('click', handleDelete);
        const topDeleteBtn = card.querySelector('.delete-book-card-btn');
        if (topDeleteBtn) topDeleteBtn.addEventListener('click', handleDelete);

        // Toplu seçim onay kutusu
        if (isBulkDeleteMode) {
          const chk = card.querySelector('.chk-book-select');
          if (chk) {
            chk.addEventListener('change', (e) => {
              e.stopPropagation();
              if (chk.checked) {
                selectedBookIds.add(book.id);
                card.style.borderColor = 'var(--danger)';
                card.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.3)';
              } else {
                selectedBookIds.delete(book.id);
                card.style.borderColor = '';
                card.style.boxShadow = '';
              }
              updateBulkDeleteCountUI(filteredBooks.length);
            });
          }
        }

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
            if (window.LicenseConfig && typeof window.LicenseConfig.showPrompt === 'function') {
              window.LicenseConfig.showPrompt('Kitaplık', window.LicenseConfig.bookLimit);
            } else if (window.openLicensePurchase) {
              window.openLicensePurchase('Kitaplık Limiti');
            }
          });
          card.appendChild(lockOverlay);
        }

        libraryContainer.appendChild(card);
      });
    }
  }

  if (window.safeCreateIcons) window.safeCreateIcons();

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
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const item = btn.closest('.reading-item');
        const txId = item.getAttribute('data-tx-id');
        const bookTitle = item.getAttribute('data-book-title');

        const ok = window.confirmAsync ?
          await window.confirmAsync(`"${bookTitle}" kitabının ödünç işlemini iptal etmek istediğinize emin misiniz? (Kitap okunmamış sayılarak kitaplığa dönecektir)`) :
          confirm(`"${bookTitle}" kitabının ödünç işlemini iptal etmek istediğinize emin misiniz? (Kitap okunmamış sayılarak kitaplığa dönecektir)`);

        if (ok) {
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

    const displayBooks = availableBooks.filter(book => {
      if (currentStudentDetailLevelFilter === 'seviye_1') return (book.level || 'seviye_1') === 'seviye_1';
      if (currentStudentDetailLevelFilter === 'seviye_2') return book.level === 'seviye_2';
      return true;
    });

    actionDiv.className = 'glass-card';
    actionDiv.style.border = '1px solid var(--border-color)';
    actionDiv.style.padding = '1.25rem';
    actionDiv.style.borderRadius = 'var(--radius-md)';
    
    const filterPillsHtml = `
      <div style="display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); margin-right: 0.25rem;">Seviye Süzgeci:</span>
        <button type="button" class="btn btn-sm btn-student-level-pill" data-level="all" style="padding: 0.2rem 0.55rem; font-size: 0.72rem; font-weight: 600; border-radius: 20px; cursor: pointer; ${currentStudentDetailLevelFilter === 'all' ? 'background: var(--primary); color: #fff;' : 'background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-color);'}">Tümü</button>
        <button type="button" class="btn btn-sm btn-student-level-pill" data-level="seviye_1" style="padding: 0.2rem 0.55rem; font-size: 0.72rem; font-weight: 600; border-radius: 20px; cursor: pointer; ${currentStudentDetailLevelFilter === 'seviye_1' ? 'background: var(--success); color: #fff;' : 'background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-color);'}">1. Seviye (Kolay)</button>
        <button type="button" class="btn btn-sm btn-student-level-pill" data-level="seviye_2" style="padding: 0.2rem 0.55rem; font-size: 0.72rem; font-weight: 600; border-radius: 20px; cursor: pointer; ${currentStudentDetailLevelFilter === 'seviye_2' ? 'background: #9333ea; color: #fff;' : 'background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-color);'}">2. Seviye (İleri)</button>
      </div>
    `;

    let booksHtml = '';
    if (displayBooks.length === 0) {
      booksHtml = `
        <div style="font-size: 0.85rem; color: var(--text-muted); padding: 1rem; text-align: center;">
          ${currentStudentDetailLevelFilter !== 'all' ? 'Bu seviyede ödünç verilebilecek uygun kitap bulunmuyor.' : 'Ödünç verilebilecek uygun kitap bulunmuyor (Tüm kitaplar okunmuş veya başkalarında).'}
        </div>
      `;
    } else {
      booksHtml = `
        <div class="student-books-list" style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; padding-right: 2px;">
          ${displayBooks.map(book => {
            const isLvl2 = book.level === 'seviye_2';
            const badgeStyle = isLvl2 ? 'background: rgba(147, 51, 234, 0.12); color: #9333ea;' : 'background: rgba(16, 185, 129, 0.12); color: #10b981;';
            const badgeLabel = isLvl2 ? '2. Seviye (İleri)' : '1. Seviye (Kolay)';

            return `
              <div class="student-book-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.75rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); gap: 0.5rem; transition: transform var(--transition-fast);">
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${book.title}">${book.title}</div>
                    <span style="font-size: 0.65rem; padding: 0.1rem 0.35rem; border-radius: 3px; font-weight: 700; white-space: nowrap; ${badgeStyle}">${badgeLabel}</span>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${book.author}">${book.author} • ${book.pages} S.</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">No: ${book.bookNo || '-'}</div>
                </div>
                <button class="btn btn-primary btn-lend-book" data-book-id="${book.id}" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; font-weight:600; white-space: nowrap; flex-shrink: 0;">
                  Ödünç Ver
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    actionDiv.innerHTML = `
      <h4 style="color: var(--text-primary); font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; font-size: 1rem;">
        <i data-lucide="bookmark-plus" style="width: 18px; height: 18px; color: var(--primary);"></i> Yeni Kitap Ödünç Ver
      </h4>
      ${filterPillsHtml}
      ${booksHtml}
    `;

    actionDiv.querySelectorAll('.btn-student-level-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        currentStudentDetailLevelFilter = pill.getAttribute('data-level');
        renderStudentDetailPanel(selectedStudentId);
      });
    });

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
