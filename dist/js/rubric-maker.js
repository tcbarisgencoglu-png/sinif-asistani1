/**
 * rubric-maker.js
 * Sınıf Asistanı — Dereceli Puanlama Anahtarı (Rubrik) Oluşturucu
 * 
 * MEB "Türkiye Yüzyılı Maarif Modeli Öğretim Programları Okuryazarlığı Öğretmen Kılavuz Kitabı — Ölçme ve Değerlendirme 1 & 2"
 * resmi standartlarına tam uyumlu olarak geliştirilmiştir.
 * 
 * Temel Özellikler:
 * - Bağlam Temelli Gerçek Yaşam Senaryosu ve Öğrenci Görev Yönergeleri (Kitap 2 Standardı)
 * - 4 Düzeyli Analitik Rubrik Standardı (%25 Başlangıç, %50 Gelişmekte, %75 Yetkin, %100 İleri)
 * - 7 Kapsamlı MEB Şablonu (Yazılı Anlatım, Konuşma, Problem Çözme, Deney, Proje/Tasarım, Sunum, Grup Çalışması)
 * - Google Gemini AI ile müfredat kazanımına özel hem senaryo hem de rubrik matrisi üretimi
 * - Canlı Düzenlenebilir (contenteditable) A4 mizanpajı
 * - İki Çıktı Modu: "Öğrenci Görev Kağıdı (Sınav Öncesi Dağıtmalık)" ve "Öğretmen Değerlendirme Formu (Puanlı)"
 * - Geliştirici Geri Bildirim Sihirbazı (Seçilen düzeylere göre pedagojik gelişim cümlesini anında üretir)
 * - Canlı Sınıf İçi Puanlama Modu ve e-Okul uyumlu sınıf değerlendirme listesi (Panoya kopyalama)
 * - Fotokopi (Eco) Modu ve A4 Baskı / PDF Desteği
 */

(() => {
  "use strict";

  // ─── 1. Hazır MEB Şablon Kütüphanesi (Kitap 2 Bağlam ve Senaryolarıyla) ───
  const MEB_RUBRIC_TEMPLATES = {
    turkish_writing: {
      id: "turkish_writing",
      title: "Türkçe / Edebiyat — Yazılı Anlatım ve Kompozisyon Değerlendirme Ölçeği",
      lesson: "Türkçe",
      grade: "Tüm Kademeler",
      taskTitle: "Yazılı Anlatım (Kompozisyon / Hikâye / Fikir Yazısı)",
      scenario: "Geleceğe bir mektup bırakmak veya çevrenizde tanık olduğunuz toplumsal/çevresel bir değişimi ele alan özgün bir fikir yazısı ya da öykü kurgulamanız beklenmektedir.",
      instructions: "1. Yazınıza ilgi çekici ve içerikle uyumlu bir başlık koyunuz.\n2. Giriş, gelişme ve sonuç bölümlerini dengeli paragraflarla yapılandırınız.\n3. Yazım (imla) ve noktalama kurallarına özen gösteriniz.\n4. Çalışmanızı teslim etmeden önce aşağıdaki değerlendirme ölçütlerine göre gözden geçiriniz.",
      levels: [
        { name: "1. Düzey: Başlangıç", percent: 25 },
        { name: "2. Düzey: Gelişmekte", percent: 50 },
        { name: "3. Düzey: Yetkin", percent: 75 },
        { name: "4. Düzey: İleri", percent: 100 }
      ],
      criteria: [
        {
          name: "Konu ve Düşünce Gelişimi",
          weight: 25,
          descriptors: [
            "Konudan kopuktur; düşünceler tutarsız, dağınık veya eksiktir.",
            "Konu ana hatlarıyla işlenmiş ancak düşünceler arası mantıksal bağlar zayıftır.",
            "Konu açık ve tutarlı biçimde işlenmiş, ana fikir yardımcı fikirlerle desteklenmiştir.",
            "Özgün, derin ve zengin fikirler üretilmiş; ana fikir etkileyici bir kurguyla aktarılmıştır."
          ]
        },
        {
          name: "Plan, Bütünlük ve Paragraf Düzeni",
          weight: 20,
          descriptors: [
            "Giriş, gelişme ve sonuç bölümleri belirsizdir; paragraf düzeni bulunmamaktadır.",
            "Bölümler kısmen hissedilir ancak geçişler kopuktur; paragraflar dengesizdir.",
            "Giriş, gelişme ve sonuç bölümleri dengelidir; paragraflar arası geçişler anlamlıdır.",
            "Mükemmel bir metin mimarisi kurulmuş; geçiş ve bağlantı ifadeleri ustaca kullanılmıştır."
          ]
        },
        {
          name: "Kelime Dağarcığı ve İfade Zenginliği",
          weight: 20,
          descriptors: [
            "Kelime hazinesi çok dardır; sürekli aynı kelimeler tekrarlanmıştır.",
            "Genellikle günlük ve basit kelimeler kullanılmış; ifade çeşitliliği sınırlıdır.",
            "Kelimeler yerinde ve anlamına uygun kullanılmış; zengin bir dil tercih edilmiştir.",
            "Deyimler, atasözleri ve mecazi ifadeler yerinde; üslup son derece akıcı ve zengindir."
          ]
        },
        {
          name: "Dil Bilgisi ve Cümle Yapısı",
          weight: 20,
          descriptors: [
            "Anlatım bozuklukları ve devrik/eksik cümleler metnin anlaşılmasını engellemektedir.",
            "Basit cümle yapıları tercih edilmiş; yer yer anlatım pürüzleri bulunmaktadır.",
            "Cümleler dil bilgisi kurallarına uygun, açık ve anlaşılır şekilde kurulmuştur.",
            "Farklı cümle yapıları (birleşik, sıralı) hatasız ve ahenkli biçimde kullanılmıştır."
          ]
        },
        {
          name: "Yazım, Noktalama ve Sayfa Düzeni",
          weight: 15,
          descriptors: [
            "Çok sayıda imla ve noktalama hatası vardır; sayfa düzeni dikkate alınmamıştır.",
            "Belirgin imla ve noktalama hataları mevcuttur; sayfa düzeni kısmen gözetilmiştir.",
            "İmla ve noktalama kurallarına büyük ölçüde uyulmuştur; sayfa temiz ve düzenlidir.",
            "İmla ve noktalama kusursuzdur; başlık, satır başı ve sayfa marjları estetik bir intizamdadır."
          ]
        }
      ]
    },

    turkish_speaking: {
      id: "turkish_speaking",
      title: "Türkçe / Yabancı Dil — Sözlü İletişim ve Konuşma Becerisi Ölçeği",
      lesson: "Türkçe / İngilizce",
      grade: "Tüm Kademeler",
      taskTitle: "Hazırlıklı / Hazırlıksız Konuşma, Sunum ve Münazara",
      scenario: "Bir gençlik panelinde veya sınıf meclisinde 'Dijital Çağda Bilgi Güvenliği ve Sosyal Medya Etiği' konusunda dinleyicileri bilgilendiren ve ikna eden 3-5 dakikalık bir konuşma yapacaksınız.",
      instructions: "1. Konuşmanız için anahtar kelimelerden oluşan bir hazırlık kartı kullanabilirsiniz; doğrudan metin okumayınız.\n2. Dinleyicilerle göz teması kurunuz ve ses tonunuzu mekana göre ayarlayınız.\n3. Konuşmanızı aşağıdaki değerlendirme ölçütlerine göre planlayınız.",
      levels: [
        { name: "1. Düzey: Başlangıç", percent: 25 },
        { name: "2. Düzey: Gelişmekte", percent: 50 },
        { name: "3. Düzey: Yetkin", percent: 75 },
        { name: "4. Düzey: İleri", percent: 100 }
      ],
      criteria: [
        {
          name: "Konuya Hâkimiyet ve İçerik",
          weight: 25,
          descriptors: [
            "Konuyu kavramakta zorlanmakta, sürekli notlarına bağımlı kalmaktadır.",
            "Konunun ana hatlarını aktarabilmekte fakat detay ve örneklerde yetersiz kalmaktadır.",
            "Konuya hâkimdir, ana fikri net açıklar ve uygun örneklerle dinleyicilere aktarır.",
            "Konuyu derinlemesine özümsemiş, ikna edici ve özgün çıkarımlarla zenginleştirmiştir."
          ]
        },
        {
          name: "Ses Tonu, Vurgu ve Telaffuz",
          weight: 20,
          descriptors: [
            "İşitilmesi güç, monoton bir sesle konuşmakta; telaffuz hataları fazladır.",
            "Ses tonu yer yer yetersizdir; vurgu ve tonlamalar mekaniktir.",
            "Ses tonu tüm sınıfa rahatça ulaşır; vurgu ve tonlamayı amaca uygun kullanır.",
            "Etkileyici bir diksiyon ve ses modülasyonu sergiler; dinleyicinin dikkatini sürekli canlı tutar."
          ]
        },
        {
          name: "Beden Dili ve Göz Teması",
          weight: 20,
          descriptors: [
            "Hiç göz teması kurmaz; gergin, hareketsiz veya uygunsuz hareketler sergiler.",
            "Yalnızca belirli bir noktaya veya öğretmene bakar; jest ve mimikleri sınırlıdır.",
            "Dinleyicilerle düzenli göz teması kurar; jest ve mimikleri konuşmasını destekler.",
            "Sahneyi/kürsüyü doğal ve güvenli kullanır; beden dili anlatımına güçlü bir ahenk katar."
          ]
        },
        {
          name: "Akıcılık ve Dil Kurallarına Uyum",
          weight: 20,
          descriptors: [
            "Cümleleri sık sık kesilir; aşırı duraklamalar ve gereksiz dolgu sesler (ııı, şey) kullanır.",
            "Konuşma genel olarak anlaşılır ancak yer yer akıcılık kayıpları ve duraksamalar yaşanır.",
            "Akıcı ve anlaşılır bir dille konuşur; standart dil kurallarına özen gösterir.",
            "Kusursuz bir akıcılık, zengin kelime seçimi ve pürüzsüz bir hitabet sergiler."
          ]
        },
        {
          name: "Zaman Yönetimi ve Topluluğa Hitap",
          weight: 15,
          descriptors: [
            "Verilen süreyi çok aşmış veya çok erken bitirmiştir; hitap dili yetersizdir.",
            "Süreyi yönetmekte zorlanmış; konuşmayı aceleye getirmiş veya toparlayamamıştır.",
            "Verilen süreyi dengeli kullanmış; uygun selamlama ve teşekkürle konuşmasını tamamlamıştır.",
            "Süreyi dakik kullanmış; dinleyici kitlesiyle güçlü bir bağ kurup etkili bir kapanış yapmıştır."
          ]
        }
      ]
    },

    math_problem_solving: {
      id: "math_problem_solving",
      title: "Matematik — Problem Çözme ve Matematiksel Muhakeme Ölçeği",
      lesson: "Matematik",
      grade: "Tüm Kademeler",
      taskTitle: "Açık Uçlu Problem Çözme ve Senaryo Analizi",
      scenario: "Okul kermesinde stant açacak olan bir öğrenci kulübü için maliyet-kâr analizi yapacak, en uygun ürün fiyatlandırma stratejisini matematiksel modeller ve denklemlerle ispatlayacaksınız.",
      instructions: "1. Problemdeki verilenleri ve sizden istenenleri açıkça not ediniz.\n2. Çözüm için kurduğunuz matematiksel bağıntıyı (tablo, grafik veya cebirsel denklem) adım adım gösteriniz.\n3. Elde ettiğiniz sonucun doğruluğunu kontrol edip günlük hayat açısından yorumlayınız.",
      levels: [
        { name: "1. Düzey: Başlangıç", percent: 25 },
        { name: "2. Düzey: Gelişmekte", percent: 50 },
        { name: "3. Düzey: Yetkin", percent: 75 },
        { name: "4. Düzey: İleri", percent: 100 }
      ],
      criteria: [
        {
          name: "Problemi Anlama ve Modelleme",
          weight: 25,
          descriptors: [
            "Problemin ne istediğini anlayamamış; verilen ve istenenleri ayırt edememiştir.",
            "Verilenlerin bir kısmını belirlemiş ancak problem durumunu tam olarak modelleyememiştir.",
            "Problemi doğru kavramış; verilenler ile istenenler arasındaki matematiksel ilişkiyi kurmuştur.",
            "Problemi eksiksiz analiz etmiş, şema/tablo/denklem ile kusursuz bir matematiksel model kurmuştur."
          ]
        },
        {
          name: "Strateji ve Çözüm Planı Geliştirme",
          weight: 25,
          descriptors: [
            "Uygun bir çözüm yolu belirleyememiş; rastgele işlemler yapmıştır.",
            "Kısmen doğru bir strateji seçmiş fakat çözüm planını eksik kurgulamıştır.",
            "Problemin yapısına uygun, mantıklı ve amaca ulaştıran bir çözüm stratejisi seçmiştir.",
            "En etkili, pratik ve yaratıcı çözüm stratejisini geliştirmiş; adımları açıkça gerekçelendirmiştir."
          ]
        },
        {
          name: "Planı Uygulama ve İşlem Doğruluğu",
          weight: 25,
          descriptors: [
            "İşlemler tamamen hatalıdır veya yarıda bırakılmıştır.",
            "Çözüm adımlarının bir kısmını doğru yapmış ancak işlem/hesaplama hataları yapmıştır.",
            "Çözüm basamaklarını sırasıyla uygulamış ve doğru matematiksel sonuca ulaşmıştır.",
            "Tüm basamakları hatasız, birimleriyle birlikte ve yüksek işlem titizliğiyle tamamlamıştır."
          ]
        },
        {
          name: "Kontrol Etme ve Alternatif Yorumlama",
          weight: 25,
          descriptors: [
            "Sonucu kontrol etmemiş; bulunan değerin gerçek yaşamla uyumunu sorgulamamıştır.",
            "Yalnızca sonuca bakmış, işlem aşamalarını mantıksal olarak denetlememiştir.",
            "Bulduğu sonucun doğruluğunu ve mantıklılığını kontrol etmiş, cevabı açıkça ifade etmiştir.",
            "Çözümünü alternatif bir yoldan doğrulamış; sonucu genelleştirerek derin muhakeme sergilemiştir."
          ]
        }
      ]
    },

    science_experiment: {
      id: "science_experiment",
      title: "Fen Bilimleri — Deney, Laboratuvar ve Bilimsel Süreç Becerileri Ölçeği",
      lesson: "Fen Bilimleri",
      grade: "Tüm Kademeler",
      taskTitle: "Laboratuvar Uygulaması, Deney Tasarımı ve Raporlama",
      scenario: "Bir çevre laboratuvarı uzmanı olarak farklı sıcaklık ve temas yüzeylerinin kimyasal tepkime / çözünme hızına etkisini test eden kontrollü bir deney tasarlayacak ve bilimsel gözlem raporu hazırlayacaksınız.",
      instructions: "1. Bağımlı, bağımsız ve sabit tutulan (kontrol edilen) değişkenleri deney föyünüze yazınız.\n2. Laboratuvar güvenlik kurallarına tam uyarak deney aşamalarını uygulayınız.\n3. Elde ettiğiniz ölçümleri tablo ve grafiklerle görselleştirip sonuç çıkarımınızı yazınız.",
      levels: [
        { name: "1. Düzey: Başlangıç", percent: 25 },
        { name: "2. Düzey: Gelişmekte", percent: 50 },
        { name: "3. Düzey: Yetkin", percent: 75 },
        { name: "4. Düzey: İleri", percent: 100 }
      ],
      criteria: [
        {
          name: "Hipotez Kurma ve Değişkenleri Belirleme",
          weight: 20,
          descriptors: [
            "Hipotez kuramamış; bağımlı, bağımsız ve kontrol edilen değişkenleri ayırt edememiştir.",
            "Hipotez oluşturmuş ancak değişkenleri belirlemede karışıklık yaşamıştır.",
            "Test edilebilir bilimsel bir hipotez kurmuş; deney değişkenlerini doğru tanımlamıştır.",
            "Özgün ve net bir hipotez oluşturmuş; tüm değişkenler arasındaki sebep-sonuç ilişkisini açıklamıştır."
          ]
        },
        {
          name: "Araç-Gereç Güvenliği ve Doğru Kullanım",
          weight: 20,
          descriptors: [
            "Laboratuvar güvenlik kurallarına uymamakta, malzemeleri hatalı veya özensiz kullanmaktadır.",
            "Güvenlik kurallarına uyar fakat deney araçlarını kullanırken öğretmen desteğine ihtiyaç duyar.",
            "Laboratuvar güvenlik kurallarına tam uyar; araç-gereçleri amacına uygun ve doğru kullanır.",
            "Malzemeleri kusursuz bir hassasiyetle kullanır; çalışma alanını tertipli ve güvenli yönetir."
          ]
        },
        {
          name: "Deney Aşamalarını Yürütme ve Gözlem",
          weight: 20,
          descriptors: [
            "Deney basamaklarını takip edememekte; gözlemleri eksik veya yanıltıcı kalmaktadır.",
            "Deney basamaklarını sırayla uygular fakat gözlem detaylarını kaydetmekte yetersiz kalır.",
            "Deney protokolünü bağımsız şekilde başarıyla uygular; nitel ve nicel gözlemleri doğru yapar.",
            "Deney sürecini büyük bir bilimsel titizlikle yürütür; beklenmedik durumları doğru gözlemler."
          ]
        },
        {
          name: "Veri Kaydetme ve Tablo/Grafik Düzeni",
          weight: 20,
          descriptors: [
            "Elde edilen veriler düzensizdir; tablo veya grafik oluşturulamamıştır.",
            "Veriler kaydedilmiş ancak tablo/grafik çiziminde ölçek veya etiketleme hataları vardır.",
            "Verileri düzenli bir tabloya aktarmış, uygun bir grafik türüyle doğru şekilde görselleştirmiştir.",
            "Verileri eksiksiz birimleriyle tablolaştırmış; bilimsel standartlarda kusursuz grafik çizmiştir."
          ]
        },
        {
          name: "Sonuç Çıkarma ve Bilimsel Açıklama",
          weight: 20,
          descriptors: [
            "Verilerden bağımsız veya temelsiz sonuçlar çıkarmış; hipotezi değerlendirememiştir.",
            "Hipotezin doğrulanıp doğrulanmadığını belirtmiş fakat bilimsel gerekçelendirmesi zayıftır.",
            "Verilere dayanarak mantıklı sonuçlar çıkarmış; hipotezi bilimsel kavramlarla test etmiştir.",
            "Derin bilimsel çıkarımlar yapmış; olası hata paylarını tartışarak günlük yaşamla ilişkilendirmiştir."
          ]
        }
      ]
    },

    project_product: {
      id: "project_product",
      title: "Genel — Proje, Maket ve Ürün Tasarımı Değerlendirme Ölçeği",
      lesson: "STEM / Tasarım / Fen / Sanat",
      grade: "Tüm Kademeler",
      taskTitle: "Dönem Projesi, Tasarım, Model ve Ürün Oluşturma",
      scenario: "Geri dönüştürülebilir atık malzemeleri kullanarak günlük yaşamda enerji tasarrufu sağlayan ya da bir engeli kolaylaştıran özgün bir ürün prototipi veya maket tasarlayacaksınız.",
      instructions: "1. Tasarımınızın yenilikçi fikrini ve hitap ettiği problemi açıklayan 1 sayfalık süreç raporu hazırlayınız.\n2. Malzeme seçiminde çevre dostu ve dayanıklı tercihler yapınız.\n3. Çalışmanızı teslim tarihine kadar tamamlayıp sunuma hazır hale getiriniz.",
      levels: [
        { name: "1. Düzey: Başlangıç", percent: 25 },
        { name: "2. Düzey: Gelişmekte", percent: 50 },
        { name: "3. Düzey: Yetkin", percent: 75 },
        { name: "4. Düzey: İleri", percent: 100 }
      ],
      criteria: [
        {
          name: "Özgünlük ve Yaratıcılık",
          weight: 25,
          descriptors: [
            "Doğrudan hazır bir örneğin kopyasıdır; kişisel hiçbir katkı veya yaratıcılık içermemektedir.",
            "Bilinen modellerden esinlenilmiş; sınırlı düzeyde özgün detay eklenmiştir.",
            "Özgün fikirler ve yaratıcı çözümler barındırmakta; amaca uygun yeni bir yaklaşım sunmaktadır.",
            "Son derece yenilikçi, özgün ve yaratıcı bir tasarım ortaya konmuş; sıra dışı bir bakış açısı katılmıştır."
          ]
        },
        {
          name: "Amaca Uygunluk ve İşlevsellik",
          weight: 25,
          descriptors: [
            "Proje amacına hizmet etmemektedir; beklenen temel işlevleri yerine getirememektedir.",
            "Temel amacı kısmen karşılamakta ancak kullanım veya işlevsellik açısından aksaklıklar içermektedir.",
            "Proje konusuna ve hedeflerine tam uygundur; tasarlanan tüm işlevleri sorunsuz yerine getirir.",
            "Amacını mükemmel şekilde yerine getirir; pratik, sağlam, kullanıcı dostu ve işlevseldir."
          ]
        },
        {
          name: "Malzeme Seçimi ve İşçilik Kalitesi",
          weight: 25,
          descriptors: [
            "Malzeme seçimi özensizdir; işçilik dayanıksız, dağınık ve baştan savmadır.",
            "Uygun malzemeler seçilmiş ancak birleştirme ve işçilik detaylarında özensizlikler mevcuttur.",
            "Malzemeler amaca uygun ve ekonomik seçilmiş; işçilik temiz, özenli ve sağlamdır.",
            "Çevre dostu / geri dönüştürülebilir malzeme tercihi yapılmış; profesyonel ve estetik işçilik sergilenmiştir."
          ]
        },
        {
          name: "Zamanında Teslim ve Proje Raporu",
          weight: 25,
          descriptors: [
            "Süreç takvimine uyulmamış, rapor hazırlanmamış veya çok yetersiz teslim edilmiştir.",
            "Zamanında teslim edilmiş ancak yapım aşamalarını anlatan rapor eksik ve yüzeyseldir.",
            "Belirlenen takvime uygun teslim edilmiş; tasarım sürecini ve aşamaları net anlatan rapor sunulmuştur.",
            "Tüm aşamalar adım adım belgelenmiş, kaynakça ve maliyet tablosu içeren eksiksiz bir rapor sunulmuştur."
          ]
        }
      ]
    },

    presentation_skills: {
      id: "presentation_skills",
      title: "Genel — Bireysel / Grup Sunumu Değerlendirme Ölçeği",
      lesson: "Tüm Dersler",
      grade: "Tüm Kademeler",
      taskTitle: "Ders İçi Araştırma Sunumu ve Dijital Materyal Anlatımı",
      scenario: "Bir bilim müzesi veya tarih araştırmacısı rolünde, 'Uzay Araştırmaları ve Geleceğin Teknolojileri' konusunu sınıf arkadaşlarınıza aktaracağınız görsel ve etkileşimli bir sunum gerçekleştireceksiniz.",
      instructions: "1. Sunumunuzda metin yoğunluğunu azaltıp kaliteli görsel, grafik ve infografiklere yer veriniz.\n2. Slaytları doğrudan okumayınız; dinleyicilerle göz teması kurup kendi cümlelerinizle anlatınız.\n3. Sunum süresine (5-7 dakika) uyunuz ve sunum sonunda gelecek sorulara hazırlıklı olunuz.",
      levels: [
        { name: "1. Düzey: Başlangıç", percent: 25 },
        { name: "2. Düzey: Gelişmekte", percent: 50 },
        { name: "3. Düzey: Yetkin", percent: 75 },
        { name: "4. Düzey: İleri", percent: 100 }
      ],
      criteria: [
        {
          name: "Sunum İçeriği ve Bilimsel Doğruluk",
          weight: 30,
          descriptors: [
            "İçerik yetersiz, yüzeysel veya hatalı bilgiler barındırmaktadır.",
            "İçerik temel seviyede doğru ancak konunun can alıcı noktaları atlanmıştır.",
            "Konu kapsamlı araştırılmış, doğru bilgiler mantıksal bir akışla derlenmiştir.",
            "Farklı ve güvenilir kaynaklardan sentezlenmiş, zengin, derin ve güvenilir bir içerik sunulmuştur."
          ]
        },
        {
          name: "Görsel ve Dijital Materyal Kalitesi",
          weight: 25,
          descriptors: [
            "Görsel materyal kullanılmamış veya slaytlar sadece yoğun metin kopyalarından oluşmaktadır.",
            "Slaytlar hazırlanmış fakat görsel-metin dengesi zayıf ve okunması güçtür.",
            "Slaytlar düzenli, okunabilir ve konuyu pekiştiren kaliteli grafik/görseller içermektedir.",
            "Estetik tasarımı, infografikleri ve multimedya ögeleriyle son derece profesyonel bir materyal sunulmuştur."
          ]
        },
        {
          name: "İletişim ve Hitabet Gücü",
          weight: 25,
          descriptors: [
            "Slaytlardan sürekli metin okumakta, sınıfla hiçbir bağ kuramamaktadır.",
            "Yer yer slaytlara bağlı kalmakta; dinleyicilerin dikkatini sürdürmekte zorlanmaktadır.",
            "Kendi cümleleriyle anlatmakta, göz teması kurarak dinleyicileri sürece katmaktadır.",
            "Etkileyici bir hitabet sergilemekte; dinleyicileri meraklandıran sorular ve etkileşimle sunumu yönetmektedir."
          ]
        },
        {
          name: "Soruları Yanıtlama ve Zaman Planı",
          weight: 20,
          descriptors: [
            "Gelen soruları yanıtlayamamakta veya savunmacı kalmaktadır; süre sınırını aşmıştır.",
            "Sorulara yüzeysel cevaplar verebilmekte; zamanı yönetirken son kısımları aceleye getirmektedir.",
            "Soruları nezaketle ve doğru şekilde yanıtlamakta; verilen süreyi dengeli kullanmaktadır.",
            "Zor sorulara dahi derinlemesine ve örneklerle cevap vermekte; süreyi dakik kullanmaktadır."
          ]
        }
      ]
    },

    group_collaboration: {
      id: "group_collaboration",
      title: "Sosyal Beceriler — Grup Çalışması ve Akran Değerlendirme Ölçeği",
      lesson: "Tüm Dersler",
      grade: "Tüm Kademeler",
      taskTitle: "İş Birlikçi Öğrenme, Takım Çalışması ve Sorumluluk",
      scenario: "4 kişilik bir araştırma ve eylem ekibi olarak okulunuzda 'Sıfır Atık ve İsrafı Önleme' farkındalık kampanyası yürütecek ve ortak bir kampanya bülteni hazırlayacaksınız.",
      instructions: "1. Ekip arkadaşlarınızla görev paylaşımını adil şekilde yapınız.\n2. Farklı fikirleri sabır ve nezaketle dinleyip ortak kararlar alınız.\n3. Grup içindeki sürecinizi ve ekip ruhunuzu aşağıdaki ölçekle değerlendiriniz.",
      levels: [
        { name: "1. Düzey: Başlangıç", percent: 25 },
        { name: "2. Düzey: Gelişmekte", percent: 50 },
        { name: "3. Düzey: Yetkin", percent: 75 },
        { name: "4. Düzey: İleri", percent: 100 }
      ],
      criteria: [
        {
          name: "Görev Dağılımına Uyma ve Sorumluluk",
          weight: 25,
          descriptors: [
            "Üzerine düşen görevi yapmamış, grubun çalışmasını geciktirmiştir.",
            "Görevini ancak arkadaşlarının veya öğretmenin uyarısıyla kısmen yerine getirmiştir.",
            "Kendisine verilen görevi zamanında ve eksiksiz şekilde tamamlamıştır.",
            "Kendi görevini kusursuz tamamlamakla kalmamış, zorlanan arkadaşlarına da gönüllü destek olmuştur."
          ]
        },
        {
          name: "Dinleme ve Farklı Görüşlere Saygı",
          weight: 25,
          descriptors: [
            "Grup üyelerinin sözünü kesmekte, farklı fikirlere tahammülsüz davranmaktadır.",
            "Başkalarını dinler gibi görünmekte ancak ortak kararlara uymakta isteksiz davranmaktadır.",
            "Grup arkadaşlarını sabırla dinler, yapıcı eleştirilerde bulunur ve farklı fikirlere saygı duyar.",
            "Grup içinde uzlaşmacı ve kapsayıcı bir ortam oluşturulmasında öncülük eder."
          ]
        },
        {
          name: "Fikir Paylaşımı ve Problem Çözme",
          weight: 25,
          descriptors: [
            "Çalışmalara fikirsel katkı sunmamakta, sessiz ve pasif kalmaktadır.",
            "Sorulduğunda sınırlı fikir belirtir ancak grup tartışmalarında çekimserdir.",
            "Grup tartışmalarına aktif katılır, hedefe ulaşmak için yapıcı öneriler sunar.",
            "Karşılaşılan sorunlara yaratıcı çözümler üretir; grubun motivasyonunu ve enerjisini yükseltir."
          ]
        },
        {
          name: "Ortak Ürüne Aktif Katkı",
          weight: 25,
          descriptors: [
            "Ortak ürünün ortaya çıkmasına hiçbir somut katkıda bulunmamıştır.",
            "Ürünün hazırlanmasında sadece basit ve yönergeli adımlarda yer almıştır.",
            "Ürünün planlanmasından tamamlanmasına kadar sürecin her aşamasında aktif emek vermiştir.",
            "Ortak ürünün kalitesini ve niteliğini artıran kritik ve yaratıcı katkılar sağlamıştır."
          ]
        }
      ]
    }
  };

  // ─── 2. Modül Durumu (State) ──────────────────────────────────────────────
  const RubricState = {
    currentRubric: null,
    isEcoMode: false,
    isEvaluationMode: false, // Canlı öğrenci puanlama modu
    printViewMode: "teacher_eval", // "teacher_eval" (Puanlı) | "student_sheet" (Görev Kağıdı - Boş Rubrik)
    showScenario: true, // Senaryo kutusu gösterilsin mi?
    selectedStudentId: null,
    selectedStudentName: "",
    selectedStudentNumber: "",
    selectedStudentBranch: "",
    studentEvaluations: {}, // { criterionIndex: selectedLevelIndex }
    evaluationsDb: {}, // { studentId: { studentName, studentNumber, totalScore, date, criteriaMap: {}, feedback: '' } }
    savedCustomRubrics: [] // Kullanıcının kaydettiği özel rubrikler
  };

  const STORAGE_KEY_SAVED_RUBRICS = "sinif_asistani_saved_custom_rubrics";
  const STORAGE_KEY_EVALUATIONS_PREFIX = "sinif_asistani_rubric_evals_";

  // ─── 3. Başlatıcı (Init) ──────────────────────────────────────────────────
  function initRubricMaker() {
    loadSavedRubricsFromStorage();
    bindEvents();
    renderTemplatesDropdown();
    renderSavedRubricsDropdown();
    renderClassStudentsDropdown();

    if (!RubricState.currentRubric) {
      loadTemplate("turkish_writing");
    } else {
      renderA4RubricSheet();
    }
  }

  // ─── 4. Etkinlikleri Bağlama (Event Binding) ──────────────────────────────
  function bindEvents() {
    // Şablon Seçimi
    const templateSelect = document.getElementById("rubric-template-select");
    if (templateSelect) {
      templateSelect.addEventListener("change", (e) => {
        if (e.target.value) {
          loadTemplate(e.target.value);
        }
      });
    }

    // AI Oluşturucu Butonu
    const btnAiGenerate = document.getElementById("btn-rubric-ai-generate");
    if (btnAiGenerate) {
      btnAiGenerate.addEventListener("click", handleAiGenerateRubric);
    }

    // A4 Yazdır / PDF Butonu
    const btnPrint = document.getElementById("btn-rubric-print");
    if (btnPrint) {
      btnPrint.addEventListener("click", printRubricA4);
    }

    // Fotokopi Modu Değiştirme
    const btnEco = document.getElementById("btn-rubric-toggle-eco");
    if (btnEco) {
      btnEco.addEventListener("click", toggleEcoMode);
    }

    // Değerlendirme Modu (Canlı Not Verme)
    const btnEvalMode = document.getElementById("btn-rubric-toggle-eval-mode");
    if (btnEvalMode) {
      btnEvalMode.addEventListener("click", toggleEvaluationMode);
    }

    // Çıktı Görünüm Modu Değiştirme (Öğrenci Görev Kağıdı vs Öğretmen Formu)
    const btnToggleViewMode = document.getElementById("btn-rubric-toggle-view-mode");
    if (btnToggleViewMode) {
      btnToggleViewMode.addEventListener("click", togglePrintViewMode);
    }

    // Senaryo Göster/Gizle Butonu
    const btnToggleScenario = document.getElementById("btn-rubric-toggle-scenario");
    if (btnToggleScenario) {
      btnToggleScenario.addEventListener("click", toggleScenarioVisibility);
    }

    // Öğrenci Seçimi
    const studentSelect = document.getElementById("rubric-student-select");
    if (studentSelect) {
      studentSelect.addEventListener("change", (e) => {
        onStudentSelected(e.target.value);
      });
    }

    // Öğrenci Puanını Kaydet Butonu
    const btnSaveStudentScore = document.getElementById("btn-rubric-save-student-score");
    if (btnSaveStudentScore) {
      btnSaveStudentScore.addEventListener("click", saveCurrentStudentEvaluation);
    }

    // Geri Bildirim Üretici (AI / Akıllı Sihirbaz)
    const btnGenFeedback = document.getElementById("btn-rubric-gen-feedback");
    if (btnGenFeedback) {
      btnGenFeedback.addEventListener("click", generateConstructiveFeedback);
    }

    // Şablonu Kaydet Butonu
    const btnSaveTemplate = document.getElementById("btn-rubric-save-template");
    if (btnSaveTemplate) {
      btnSaveTemplate.addEventListener("click", saveCurrentRubricAsTemplate);
    }

    // Kayıtlı Şablon Sil Butonu
    const btnDeleteSaved = document.getElementById("btn-rubric-delete-saved");
    if (btnDeleteSaved) {
      btnDeleteSaved.addEventListener("click", deleteSelectedCustomRubric);
    }

    // Form Üst Bilgi Değişiklikleri
    const inputSchool = document.getElementById("rubric-input-school");
    const inputLesson = document.getElementById("rubric-input-lesson");
    const inputTask = document.getElementById("rubric-input-task");
    const inputTeacher = document.getElementById("rubric-input-teacher");

    if (inputSchool) inputSchool.addEventListener("input", () => syncHeaderInfo());
    if (inputLesson) inputLesson.addEventListener("input", () => syncHeaderInfo());
    if (inputTask) inputTask.addEventListener("input", () => syncHeaderInfo());
    if (inputTeacher) inputTeacher.addEventListener("input", () => syncHeaderInfo());

    // Yeni Kriter Ekle Butonu
    const btnAddCriterion = document.getElementById("btn-rubric-add-criterion");
    if (btnAddCriterion) {
      btnAddCriterion.addEventListener("click", addNewCriterionRow);
    }

    // Puanları Eşitle Butonu
    const btnBalanceWeights = document.getElementById("btn-rubric-balance-weights");
    if (btnBalanceWeights) {
      btnBalanceWeights.addEventListener("click", balanceCriteriaWeights);
    }

    // Değerlendirme Listesi Rapor Butonu
    const btnViewScoresList = document.getElementById("btn-rubric-view-scores-list");
    if (btnViewScoresList) {
      btnViewScoresList.addEventListener("click", showEvaluationsSummaryModal);
    }
  }

  // ─── 5. Şablon Yükleme ve Yönetimi ───────────────────────────────────────
  function loadTemplate(templateId) {
    let tpl = MEB_RUBRIC_TEMPLATES[templateId];
    if (!tpl) {
      tpl = RubricState.savedCustomRubrics.find(r => r.id === templateId);
    }
    if (!tpl) return;

    RubricState.currentRubric = JSON.parse(JSON.stringify(tpl));
    RubricState.studentEvaluations = {};

    const inputSchool = document.getElementById("rubric-input-school");
    const inputLesson = document.getElementById("rubric-input-lesson");
    const inputTask = document.getElementById("rubric-input-task");
    const inputTeacher = document.getElementById("rubric-input-teacher");

    const defaultSchool = (window.state && window.state.schoolName) || "T.C. MİLLÎ EĞİTİM BAKANLIĞI";
    const defaultTeacher = (window.state && window.state.teacherName) || "";

    if (inputSchool) inputSchool.value = RubricState.currentRubric.school || defaultSchool;
    if (inputLesson) inputLesson.value = RubricState.currentRubric.lesson || "";
    if (inputTask) inputTask.value = RubricState.currentRubric.taskTitle || "";
    if (inputTeacher) inputTeacher.value = RubricState.currentRubric.teacher || defaultTeacher;

    loadEvaluationsForCurrentRubric();
    renderA4RubricSheet();
  }

  // ─── 6. A4 Mizanpajını Çizdirme (Render Sheet) ───────────────────────────
  function renderA4RubricSheet() {
    const sheet = document.getElementById("rubric-a4-sheet");
    if (!sheet || !RubricState.currentRubric) return;

    const r = RubricState.currentRubric;
    const isEco = RubricState.isEcoMode;
    const isEval = RubricState.isEvaluationMode;
    const isStudentSheet = (RubricState.printViewMode === "student_sheet");

    const schoolName = (document.getElementById("rubric-input-school")?.value || r.school || "T.C. MİLLÎ EĞİTİM BAKANLIĞI").toUpperCase();
    const lesson = document.getElementById("rubric-input-lesson")?.value || r.lesson || "";
    const taskTitle = document.getElementById("rubric-input-task")?.value || r.taskTitle || "Dereceli Puanlama Anahtarı";
    const teacherName = document.getElementById("rubric-input-teacher")?.value || r.teacher || "";
    const todayStr = new Date().toLocaleDateString("tr-TR");

    // Görev Senaryosu ve Yönergeleri
    const scenarioText = r.scenario || "Öğrenciden bu görev kapsamında gerçek yaşam durumuna uygun bir ürün veya süreç performansı ortaya koyması beklenmektedir.";
    const instructionsText = r.instructions || "1. Çalışmanızı hazırlarken yönerge adımlarını takip ediniz.\n2. Çalışmanızı aşağıdaki değerlendirme ölçütlerine göre planlayınız.";

    // Öğrenci Adı ve No
    let studentNameDisplay = "........................................................";
    let studentNumberDisplay = "..........";
    let studentBranchDisplay = "...../.....";

    if (!isStudentSheet && isEval && RubricState.selectedStudentId) {
      studentNameDisplay = RubricState.selectedStudentName || "........................................................";
      studentNumberDisplay = RubricState.selectedStudentNumber || "..........";
      studentBranchDisplay = RubricState.selectedStudentBranch || "...../.....";
    }

    const scoreSummary = calculateCurrentTotalScore();

    const levels = r.levels || [
      { name: "1. Düzey: Başlangıç", percent: 25 },
      { name: "2. Düzey: Gelişmekte", percent: 50 },
      { name: "3. Düzey: Yetkin", percent: 75 },
      { name: "4. Düzey: İleri", percent: 100 }
    ];

    // Sütun Genişlikleri
    let headerColumnsHtml = `
      <th style="width: 22%; min-width: 140px; text-align: left; padding: 7px 9px;">Öğrenme Çıktısı / Ölçütler</th>
    `;
    levels.forEach((lvl) => {
      headerColumnsHtml += `
        <th style="width: ${64 / levels.length}%; text-align: center; padding: 6px 7px; line-height: 1.25;">
          <div style="font-weight: 800; font-size: 0.78rem;">${escapeHtml(lvl.name)}</div>
          <div style="font-size: 0.67rem; opacity: 0.85; font-weight: 600; margin-top: 1px;">(%${lvl.percent})</div>
        </th>
      `;
    });
    headerColumnsHtml += `
      <th style="width: 14%; min-width: 75px; text-align: center; padding: 6px 7px;">Puan</th>
    `;

    // Tablo Satırları
    let bodyRowsHtml = "";
    let totalWeight = 0;

    r.criteria.forEach((crit, cIdx) => {
      totalWeight += Number(crit.weight || 0);
      const selectedLvlIdx = RubricState.studentEvaluations[cIdx];
      let rowScoreText = isStudentSheet ? "___" : "-";

      if (!isStudentSheet && typeof selectedLvlIdx === "number" && levels[selectedLvlIdx]) {
        const rowScore = (crit.weight * (levels[selectedLvlIdx].percent / 100));
        rowScoreText = Number.isInteger(rowScore) ? rowScore : rowScore.toFixed(1);
      }

      bodyRowsHtml += `
        <tr data-criterion-index="${cIdx}" class="rubric-criterion-row">
          <td class="rubric-crit-title-cell" style="padding: 7px 9px; vertical-align: top;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span class="rubric-editable" contenteditable="true" data-field="criterion-name" data-cidx="${cIdx}" style="font-weight: 700; font-size: 0.8rem; color: #1e293b;">
                ${escapeHtml(crit.name)}
              </span>
              <div style="display: flex; align-items: center; gap: 5px;">
                <span style="font-size: 0.67rem; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 1px 5px; border-radius: 4px;">
                  Ağırlık: %<span class="rubric-editable" contenteditable="true" data-field="criterion-weight" data-cidx="${cIdx}">${crit.weight}</span>
                </span>
                <button type="button" class="btn-rubric-del-row" data-cidx="${cIdx}" title="Bu ölçütü sil" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0 4px; font-size: 0.8rem;">×</button>
              </div>
            </div>
          </td>
      `;

      levels.forEach((lvl, lIdx) => {
        const isSelected = (!isStudentSheet && selectedLvlIdx === lIdx);
        const descText = (crit.descriptors && crit.descriptors[lIdx]) ? crit.descriptors[lIdx] : "";
        const selectedClass = isSelected ? "rubric-cell-selected" : "";

        bodyRowsHtml += `
          <td class="rubric-desc-cell ${selectedClass}" data-cidx="${cIdx}" data-lidx="${lIdx}" style="padding: 6px 7px; vertical-align: top; font-size: 0.72rem; line-height: 1.35; cursor: ${isEval && !isStudentSheet ? 'pointer' : 'text'};">
            <div class="rubric-cell-inner">
              <span class="rubric-editable" contenteditable="true" data-field="descriptor" data-cidx="${cIdx}" data-lidx="${lIdx}">
                ${escapeHtml(descText)}
              </span>
            </div>
          </td>
        `;
      });

      bodyRowsHtml += `
          <td class="rubric-score-cell" style="text-align: center; vertical-align: middle; font-weight: 800; font-size: 0.88rem; color: #0f172a; padding: 6px;">
            <span class="rubric-editable" contenteditable="true" data-field="crit-score" data-cidx="${cIdx}">
              ${rowScoreText}
            </span>
          </td>
        </tr>
      `;
    });

    let badgeColor = "#0284c7";
    let badgeText = "Değerlendirme";
    if (scoreSummary.totalScore >= 85) { badgeColor = "#16a34a"; badgeText = "Pekiyi (İleri Düzey)"; }
    else if (scoreSummary.totalScore >= 70) { badgeColor = "#0284c7"; badgeText = "İyi (Yetkin)"; }
    else if (scoreSummary.totalScore >= 55) { badgeColor = "#d97706"; badgeText = "Orta (Gelişmekte)"; }
    else if (scoreSummary.totalScore > 0) { badgeColor = "#dc2626"; badgeText = "Geliştirilmeli (Başlangıç)"; }

    // Üst Doküman Türü Başlığı
    const docSubtitle = isStudentSheet 
      ? "PERFORMANS GÖREVİ VE ÖĞRENCİ ÇALIŞMA FORMU" 
      : "SÜREÇ ODAKLI DERECELİ PUANLAMA ANAHTARI (ÖĞRETMEN NÜSHASI)";

    sheet.className = `rubric-a4-page ${isEco ? 'fotokopi-mode' : ''}`;
    sheet.innerHTML = `
      <!-- Üst Resmi Başlık Bölümü -->
      <div class="rubric-a4-header" style="border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px;">
        <div style="text-align: center; line-height: 1.25; margin-bottom: 6px;">
          <div style="font-size: 0.86rem; font-weight: 800; letter-spacing: 0.5px; color: #1e293b;">
            <span class="rubric-editable" contenteditable="true" id="sheet-school-name">${escapeHtml(schoolName)}</span>
          </div>
          <div style="font-size: 0.76rem; font-weight: 800; color: #0284c7; margin-top: 2px;">
            <span class="rubric-editable" contenteditable="true" id="sheet-lesson-name">${escapeHtml(lesson)}</span> DERSİ — ${docSubtitle}
          </div>
          <div style="font-size: 0.68rem; color: #64748b; font-style: italic; margin-top: 2px;">
            (Türkiye Yüzyılı Maarif Modeli Ölçme ve Değerlendirme Kılavuzu Esaslarına Uygundur)
          </div>
        </div>

        <!-- Üst Bilgi Şeridi (Öğrenci & Etkinlik Detayları) -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; font-size: 0.74rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 9px;">
          <div style="display: flex; flex-direction: column; gap: 3px;">
            <div><strong>Etkinlik / Görev:</strong> <span class="rubric-editable" contenteditable="true" id="sheet-task-title" style="font-weight: 700; color: #0f172a;">${escapeHtml(taskTitle)}</span></div>
            <div><strong>Öğrenci Adı Soyadı:</strong> <span class="rubric-editable" contenteditable="true" id="sheet-student-name" style="font-weight: 700; color: #0f172a;">${escapeHtml(studentNameDisplay)}</span></div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 3px; text-align: right;">
            <div><strong>Sınıf / Şube:</strong> <span class="rubric-editable" contenteditable="true" id="sheet-student-branch">${escapeHtml(studentBranchDisplay)}</span> | <strong>No:</strong> <span class="rubric-editable" contenteditable="true" id="sheet-student-number" style="font-weight: 700;">${escapeHtml(studentNumberDisplay)}</span></div>
            <div><strong>Tarih:</strong> <span class="rubric-editable" contenteditable="true" id="sheet-date">${todayStr}</span></div>
          </div>
        </div>
      </div>

      <!-- Bağlam Temelli Gerçek Yaşam Senaryosu ve Görev Yönergesi (Kitap 2 Standardı) -->
      ${RubricState.showScenario ? `
      <div class="rubric-scenario-card" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 7px 10px; margin-bottom: 10px; font-size: 0.72rem; line-height: 1.35;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
          <strong style="color: #166534; font-size: 0.74rem; display: flex; align-items: center; gap: 4px;">
            <span>🎯</span> <span>GÖREV SENARYOSU VE UYGULAMA YÖNERGELERİ:</span>
          </strong>
          <span style="font-size: 0.65rem; color: #16a34a; font-weight: 600;">(Öğrenciye Rehberlik Eder)</span>
        </div>
        <div style="color: #1e293b; margin-bottom: 4px;">
          <strong>Bağlam:</strong> <span class="rubric-editable" contenteditable="true" id="sheet-scenario-text">${escapeHtml(scenarioText)}</span>
        </div>
        <div style="color: #334155;">
          <strong>Yönergeler:</strong>
          <div class="rubric-editable" contenteditable="true" id="sheet-instructions-text" style="white-space: pre-line; margin-top: 2px;">${escapeHtml(instructionsText)}</div>
        </div>
      </div>
      ` : ''}

      <!-- Rubrik Tablosu -->
      <div style="overflow-x: auto; margin-bottom: 10px;">
        <table class="rubric-main-table" style="width: 100%; border-collapse: collapse; font-size: 0.72rem;">
          <thead>
            <tr style="background: #f1f5f9; color: #0f172a; border-bottom: 2px solid #cbd5e1;">
              ${headerColumnsHtml}
            </tr>
          </thead>
          <tbody>
            ${bodyRowsHtml}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc; font-weight: 800; border-top: 2px solid #0f172a;">
              <td style="padding: 7px 9px; text-align: right;" colspan="${levels.length + 1}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.68rem; font-weight: 600; color: #64748b;">(Ölçüt Ağırlıkları Toplamı: %${totalWeight})</span>
                  <span style="font-size: 0.78rem; text-transform: uppercase;">TOPLAM DEĞERLENDİRME PUANI:</span>
                </div>
              </td>
              <td style="padding: 7px 6px; text-align: center; font-size: 1rem; color: ${badgeColor}; font-weight: 900;">
                <span id="sheet-total-score-val">${!isStudentSheet && scoreSummary.hasAnySelection ? scoreSummary.totalScore : (isStudentSheet ? '____' : '-')}</span> / 100
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Alt Değerlendirme & İmza Bölümü -->
      <div style="display: grid; grid-template-columns: 2.2fr 1fr; gap: 10px; margin-top: 8px; font-size: 0.72rem;">
        <!-- Öğretmen Gelişim Notu / Dönütü (Biçimlendirici Değerlendirme) -->
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 9px; background: #ffffff;">
          <div style="font-weight: 700; color: #1e293b; margin-bottom: 3px; display: flex; justify-content: space-between; align-items: center;">
            <span>Öğretmen Gözlemi ve Geliştirici Geri Bildirimi:</span>
            ${!isStudentSheet && isEval && scoreSummary.hasAnySelection ? `<span style="font-size: 0.66rem; background: ${badgeColor}; color: white; padding: 1px 6px; border-radius: 4px;">${badgeText}</span>` : ''}
          </div>
          <div class="rubric-editable" contenteditable="true" id="sheet-teacher-feedback" style="min-height: 42px; color: #334155; line-height: 1.35; outline: none;">
            ${getInitialFeedbackText()}
          </div>
        </div>

        <!-- Öğretmen İmzası -->
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 9px; display: flex; flex-direction: column; justify-content: space-between; text-align: center; background: #ffffff;">
          <div style="font-weight: 700; color: #1e293b;">
            <span class="rubric-editable" contenteditable="true" id="sheet-teacher-name">${escapeHtml(teacherName || 'Ders Öğretmeni')}</span>
          </div>
          <div style="font-size: 0.67rem; color: #64748b;">İmza / Kaşe</div>
        </div>
      </div>
    `;

    attachCellClickEvents();
    attachContentEditableSync();
  }

  // ─── 7. Geri Bildirim Metni Yardımcısı ────────────────────────────────────
  function getInitialFeedbackText() {
    if (RubricState.selectedStudentId && RubricState.evaluationsDb[RubricState.selectedStudentId]?.feedback) {
      return escapeHtml(RubricState.evaluationsDb[RubricState.selectedStudentId].feedback);
    }
    return 'Öğrencinin sergilediği güçlü beceriler ve bir sonraki çalışmasında daha yetkin olması için odaklanması önerilen süreç basamakları buraya yazılır...';
  }

  // Geliştirici Geri Bildirim Sihirbazı (Otomatik Pedagojik Cümle Üretir)
  function generateConstructiveFeedback() {
    if (!RubricState.currentRubric) return;

    const r = RubricState.currentRubric;
    const evals = RubricState.studentEvaluations;
    const strongPoints = [];
    const developPoints = [];

    r.criteria.forEach((crit, cIdx) => {
      const lvl = evals[cIdx];
      if (lvl === 3) {
        strongPoints.push(crit.name.toLowerCase());
      } else if (lvl === 0 || lvl === 1) {
        developPoints.push(crit.name.toLowerCase());
      }
    });

    let sentence = "";
    if (strongPoints.length > 0 && developPoints.length > 0) {
      sentence = `Çalışmanda özellikle ${strongPoints.slice(0, 2).join(" ve ")} alanlarında çok başarılı bir yetkinlik sergiledin. Bir sonraki çalışmanda ${developPoints.slice(0, 2).join(" ve ")} basamaklarına biraz daha odaklanarak başarını daha da yukarı taşıyabilirsin.`;
    } else if (strongPoints.length > 0) {
      sentence = `Tebrikler! ${strongPoints.join(", ")} boyutlarında beklenen hedefin de ötesinde, özgün ve son derece başarılı bir performans sergiledin.`;
    } else if (developPoints.length > 0) {
      sentence = `Görevi tamamlama gayretin takdire şayan. Özellikle ${developPoints.join(" ve ")} ölçütlerinde rehberlik adımlarını takip ederek bir sonraki çalışmanda hedefe çok daha rahat ulaşabilirsin.`;
    } else {
      sentence = `Çalışman yönergeye uygun şekilde tamamlanmıştır. Süreç içerisindeki dikkat ve gayretinin devamını dilerim.`;
    }

    const feedbackEl = document.getElementById("sheet-teacher-feedback");
    if (feedbackEl) {
      feedbackEl.innerText = sentence;
      if (RubricState.selectedStudentId && RubricState.evaluationsDb[RubricState.selectedStudentId]) {
        RubricState.evaluationsDb[RubricState.selectedStudentId].feedback = sentence;
      }
    }
  }

  // ─── 8. Çıktı Görünüm Modları (Öğrenci Görev Kağıdı vs Öğretmen Formu) ────
  function togglePrintViewMode() {
    RubricState.printViewMode = (RubricState.printViewMode === "teacher_eval") ? "student_sheet" : "teacher_eval";
    const btn = document.getElementById("btn-rubric-toggle-view-mode");
    if (btn) {
      if (RubricState.printViewMode === "student_sheet") {
        btn.classList.add("active");
        btn.innerHTML = '<span>📄</span> <span>Mod: Öğrenci Görev Kağıdı</span>';
      } else {
        btn.classList.remove("active");
        btn.innerHTML = '<span>📋</span> <span>Mod: Öğretmen Değerlendirme</span>';
      }
    }
    renderA4RubricSheet();
  }

  function toggleScenarioVisibility() {
    RubricState.showScenario = !RubricState.showScenario;
    const btn = document.getElementById("btn-rubric-toggle-scenario");
    if (btn) {
      btn.innerHTML = RubricState.showScenario ? '<span>🎯</span> <span>Senaryo: Açık</span>' : '<span>🎯</span> <span>Senaryo: Gizli</span>';
    }
    renderA4RubricSheet();
  }

  // ─── 9. Hücre Tıklama ve Canlı Puanlama ──────────────────────────────────
  function attachCellClickEvents() {
    const sheet = document.getElementById("rubric-a4-sheet");
    if (!sheet) return;

    sheet.querySelectorAll(".rubric-desc-cell").forEach(cell => {
      cell.addEventListener("click", function(e) {
        if (e.target.classList.contains("rubric-editable") && !RubricState.isEvaluationMode) {
          return;
        }

        if (!RubricState.isEvaluationMode || RubricState.printViewMode === "student_sheet") {
          return;
        }

        const cIdx = parseInt(this.dataset.cidx, 10);
        const lIdx = parseInt(this.dataset.lidx, 10);

        if (RubricState.studentEvaluations[cIdx] === lIdx) {
          delete RubricState.studentEvaluations[cIdx];
        } else {
          RubricState.studentEvaluations[cIdx] = lIdx;
        }

        // Geri bildirim sihirbazını otomatik tetikle
        generateConstructiveFeedback();
        renderA4RubricSheet();
      });
    });

    sheet.querySelectorAll(".btn-rubric-del-row").forEach(btn => {
      btn.addEventListener("click", function(e) {
        e.stopPropagation();
        const cIdx = parseInt(this.dataset.cidx, 10);
        deleteCriterionRow(cIdx);
      });
    });
  }

  function attachContentEditableSync() {
    const sheet = document.getElementById("rubric-a4-sheet");
    if (!sheet || !RubricState.currentRubric) return;

    sheet.querySelectorAll(".rubric-editable").forEach(el => {
      el.addEventListener("blur", function() {
        const field = this.dataset.field;
        const cIdx = parseInt(this.dataset.cidx, 10);
        const lIdx = parseInt(this.dataset.lidx, 10);
        const val = this.innerText.trim();

        if (this.id === "sheet-scenario-text") {
          RubricState.currentRubric.scenario = val;
        } else if (this.id === "sheet-instructions-text") {
          RubricState.currentRubric.instructions = val;
        } else if (field === "criterion-name" && RubricState.currentRubric.criteria[cIdx]) {
          RubricState.currentRubric.criteria[cIdx].name = val;
        } else if (field === "criterion-weight" && RubricState.currentRubric.criteria[cIdx]) {
          const num = parseFloat(val) || 0;
          RubricState.currentRubric.criteria[cIdx].weight = num;
          renderA4RubricSheet();
        } else if (field === "descriptor" && RubricState.currentRubric.criteria[cIdx]) {
          if (!RubricState.currentRubric.criteria[cIdx].descriptors) {
            RubricState.currentRubric.criteria[cIdx].descriptors = [];
          }
          RubricState.currentRubric.criteria[cIdx].descriptors[lIdx] = val;
        }
      });
    });
  }

  // ─── 10. Puan Hesaplama ──────────────────────────────────────────────────
  function calculateCurrentTotalScore() {
    if (!RubricState.currentRubric) return { totalScore: 0, hasAnySelection: false };

    const r = RubricState.currentRubric;
    const levels = r.levels || [
      { name: "1. Düzey: Başlangıç", percent: 25 },
      { name: "2. Düzey: Gelişmekte", percent: 50 },
      { name: "3. Düzey: Yetkin", percent: 75 },
      { name: "4. Düzey: İleri", percent: 100 }
    ];

    let total = 0;
    let hasAnySelection = false;

    r.criteria.forEach((crit, cIdx) => {
      const selectedLvlIdx = RubricState.studentEvaluations[cIdx];
      if (typeof selectedLvlIdx === "number" && levels[selectedLvlIdx]) {
        hasAnySelection = true;
        total += (Number(crit.weight || 0) * (levels[selectedLvlIdx].percent / 100));
      }
    });

    const rounded = Math.round(total * 10) / 10;
    return {
      totalScore: Number.isInteger(rounded) ? rounded : rounded.toFixed(1),
      hasAnySelection
    };
  }

  // ─── 11. Form ve Üst Bilgi Eşitleme ──────────────────────────────────────
  function syncHeaderInfo() {
    if (!RubricState.currentRubric) return;

    const inputSchool = document.getElementById("rubric-input-school");
    const inputLesson = document.getElementById("rubric-input-lesson");
    const inputTask = document.getElementById("rubric-input-task");
    const inputTeacher = document.getElementById("rubric-input-teacher");

    if (inputSchool) RubricState.currentRubric.school = inputSchool.value;
    if (inputLesson) RubricState.currentRubric.lesson = inputLesson.value;
    if (inputTask) RubricState.currentRubric.taskTitle = inputTask.value;
    if (inputTeacher) RubricState.currentRubric.teacher = inputTeacher.value;

    renderA4RubricSheet();
  }

  function addNewCriterionRow() {
    if (!RubricState.currentRubric) return;

    const newCriterion = {
      name: "Yeni Öğrenme Çıktısı / Ölçüt",
      weight: 20,
      descriptors: [
        "Temel düzeyde desteğe ihtiyaç duymaktadır; süreç adımları eksiktir.",
        "Kısmen yeterlidir; bazı adımları tamamlamış ancak yönlendirmeye ihtiyaç duyar.",
        "Hedeflenen yetkinliğe ulaşmış; süreci bağımsız ve doğru yürütmüştür.",
        "Hedefin ötesinde üstün, özgün ve örnek gösterilebilecek bir başarı sergilemiştir."
      ]
    };

    RubricState.currentRubric.criteria.push(newCriterion);
    renderA4RubricSheet();
  }

  function deleteCriterionRow(index) {
    if (!RubricState.currentRubric || !RubricState.currentRubric.criteria) return;
    if (RubricState.currentRubric.criteria.length <= 1) {
      alert("Rubrikte en az 1 ölçüt bulunmalıdır.");
      return;
    }

    RubricState.currentRubric.criteria.splice(index, 1);
    delete RubricState.studentEvaluations[index];

    const newEvals = {};
    Object.keys(RubricState.studentEvaluations).forEach(k => {
      const num = parseInt(k, 10);
      if (num < index) newEvals[num] = RubricState.studentEvaluations[num];
      else if (num > index) newEvals[num - 1] = RubricState.studentEvaluations[num];
    });
    RubricState.studentEvaluations = newEvals;

    renderA4RubricSheet();
  }

  function balanceCriteriaWeights() {
    if (!RubricState.currentRubric || !RubricState.currentRubric.criteria) return;
    const count = RubricState.currentRubric.criteria.length;
    if (count === 0) return;

    const equalWeight = Math.floor(100 / count);
    const remainder = 100 - (equalWeight * count);

    RubricState.currentRubric.criteria.forEach((c, idx) => {
      c.weight = equalWeight + (idx === 0 ? remainder : 0);
    });

    renderA4RubricSheet();
  }

  // ─── 12. Canlı Öğrenci Değerlendirme Modu ────────────────────────────────
  function toggleEvaluationMode() {
    RubricState.isEvaluationMode = !RubricState.isEvaluationMode;
    const btn = document.getElementById("btn-rubric-toggle-eval-mode");
    const evalPanel = document.getElementById("rubric-eval-student-panel");

    if (btn) {
      if (RubricState.isEvaluationMode) {
        btn.classList.add("active");
        btn.innerHTML = '<span style="font-size: 0.9rem;">🟢</span> <span>Öğrenci Puanlama Açık</span>';
        if (evalPanel) evalPanel.style.display = "block";
        RubricState.printViewMode = "teacher_eval";
      } else {
        btn.classList.remove("active");
        btn.innerHTML = '<span style="font-size: 0.9rem;">👥</span> <span>Canlı Öğrenci Puanlama</span>';
        if (evalPanel) evalPanel.style.display = "none";
      }
    }

    renderA4RubricSheet();
  }

  function onStudentSelected(studentId) {
    if (!studentId) {
      RubricState.selectedStudentId = null;
      RubricState.selectedStudentName = "";
      RubricState.selectedStudentNumber = "";
      RubricState.selectedStudentBranch = "";
      RubricState.studentEvaluations = {};
      renderA4RubricSheet();
      return;
    }

    let allStudents = [];
    if (window.stateManager && typeof window.stateManager.getStudents === "function") {
      allStudents = window.stateManager.getStudents(true) || [];
    }

    const s = allStudents.find(st => String(st.id) === String(studentId));
    if (s) {
      RubricState.selectedStudentId = s.id;
      RubricState.selectedStudentName = `${s.name || ''} ${s.surname || ''}`.trim();
      RubricState.selectedStudentNumber = s.number || s.studentNumber || '';
      RubricState.selectedStudentBranch = s.branch || '';

      if (RubricState.evaluationsDb[s.id]) {
        RubricState.studentEvaluations = JSON.parse(JSON.stringify(RubricState.evaluationsDb[s.id].criteriaMap || {}));
      } else {
        RubricState.studentEvaluations = {};
      }
    }

    renderA4RubricSheet();
  }

  function saveCurrentStudentEvaluation() {
    if (!RubricState.selectedStudentId) {
      alert("Lütfen önce sınıf listesinden bir öğrenci seçiniz.");
      return;
    }

    const summary = calculateCurrentTotalScore();
    if (!summary.hasAnySelection) {
      alert("Lütfen öğrenci için tablodan en az bir düzey ölçütü seçiniz.");
      return;
    }

    const feedbackEl = document.getElementById("sheet-teacher-feedback");
    const feedback = feedbackEl ? feedbackEl.innerText.trim() : "";

    const record = {
      studentId: RubricState.selectedStudentId,
      studentName: RubricState.selectedStudentName,
      studentNumber: RubricState.selectedStudentNumber,
      studentBranch: RubricState.selectedStudentBranch,
      totalScore: summary.totalScore,
      criteriaMap: JSON.parse(JSON.stringify(RubricState.studentEvaluations)),
      feedback: feedback,
      date: new Date().toISOString()
    };

    RubricState.evaluationsDb[RubricState.selectedStudentId] = record;
    saveEvaluationsToStorage();

    const toast = window.showToast || alert;
    toast(`✅ ${RubricState.selectedStudentName} için ${summary.totalScore} puan başarıyla kaydedildi.`);

    advanceToNextStudent();
  }

  function advanceToNextStudent() {
    const studentSelect = document.getElementById("rubric-student-select");
    if (!studentSelect) return;

    const currentIndex = studentSelect.selectedIndex;
    if (currentIndex > 0 && currentIndex < studentSelect.options.length - 1) {
      studentSelect.selectedIndex = currentIndex + 1;
      onStudentSelected(studentSelect.value);
    }
  }

  function loadEvaluationsForCurrentRubric() {
    if (!RubricState.currentRubric) return;
    const rId = RubricState.currentRubric.id || "default";
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_EVALUATIONS_PREFIX}${rId}`);
      if (raw) {
        RubricState.evaluationsDb = JSON.parse(raw);
      } else {
        RubricState.evaluationsDb = {};
      }
    } catch (e) {
      RubricState.evaluationsDb = {};
    }
  }

  function saveEvaluationsToStorage() {
    if (!RubricState.currentRubric) return;
    const rId = RubricState.currentRubric.id || "default";
    try {
      localStorage.setItem(`${STORAGE_KEY_EVALUATIONS_PREFIX}${rId}`, JSON.stringify(RubricState.evaluationsDb));
    } catch (e) {
      console.error("Rubrik değerlendirmeleri kaydedilemedi:", e);
    }
  }

  // ─── 13. e-Okul Not Özeti Modalı ─────────────────────────────────────────
  function showEvaluationsSummaryModal() {
    const evals = Object.values(RubricState.evaluationsDb || {});
    if (evals.length === 0) {
      alert("Bu rubrik için henüz hiçbir öğrenci değerlendirmesi kaydedilmemiştir.");
      return;
    }

    let modal = document.getElementById("rubric-evals-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "rubric-evals-modal";
      modal.className = "modal-overlay";
      modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999;";
      document.body.appendChild(modal);
    }

    evals.sort((a, b) => (parseInt(a.studentNumber, 10) || 0) - (parseInt(b.studentNumber, 10) || 0));

    let rowsHtml = "";
    evals.forEach(ev => {
      rowsHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 6px 10px; font-weight: 700;">${escapeHtml(ev.studentNumber || '-')}</td>
          <td style="padding: 6px 10px;">${escapeHtml(ev.studentName)}</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: 800; color: #0284c7;">${ev.totalScore}</td>
          <td style="padding: 6px 10px; font-size: 0.72rem; color: #64748b;">${escapeHtml(ev.feedback || '-')}</td>
        </tr>
      `;
    });

    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; width: 90%; max-width: 680px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
        <div style="padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
          <div>
            <h3 style="margin: 0; font-size: 1.1rem; color: #0f172a;">Öğrenci Puan Listesi (${evals.length} Öğrenci)</h3>
            <p style="margin: 0; font-size: 0.75rem; color: #64748b;">${escapeHtml(RubricState.currentRubric.taskTitle || 'Rubrik Değerlendirmesi')}</p>
          </div>
          <button type="button" id="btn-close-rubric-modal" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">✕</button>
        </div>
        <div style="padding: 1rem 1.25rem; overflow-y: auto; flex: 1;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left;">
                <th style="padding: 6px 10px;">No</th>
                <th style="padding: 6px 10px;">Öğrenci</th>
                <th style="padding: 6px 10px; text-align: center;">Puan</th>
                <th style="padding: 6px 10px;">Geri Bildirim</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
        <div style="padding: 0.75rem 1.25rem; border-top: 1px solid #e2e8f0; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
          <button type="button" id="btn-copy-eokul-scores" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">
            📋 e-Okul İçin Notları Kopyala
          </button>
          <button type="button" id="btn-modal-close-footer" class="btn btn-primary btn-sm" style="font-size: 0.75rem;">Kapat</button>
        </div>
      </div>
    `;

    modal.style.display = "flex";

    const closeModal = () => { modal.style.display = "none"; };
    document.getElementById("btn-close-rubric-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-modal-close-footer")?.addEventListener("click", closeModal);

    document.getElementById("btn-copy-eokul-scores")?.addEventListener("click", () => {
      const text = evals.map(ev => `${ev.studentNumber}\t${ev.studentName}\t${ev.totalScore}`).join("\n");
      navigator.clipboard.writeText(text).then(() => {
        alert("✅ Not listesi panoya kopyalandı! Excel'e veya e-Okul hızlı not girişine yapıştırabilirsiniz.");
      });
    });
  }

  // ─── 14. Yapay Zeka (Gemini) ile Senaryo ve Rubrik Üretici ─────────────────
  async function handleAiGenerateRubric() {
    const lessonInput = document.getElementById("rubric-ai-lesson");
    const gradeInput = document.getElementById("rubric-ai-grade");
    const topicInput = document.getElementById("rubric-ai-topic");
    const critCountSelect = document.getElementById("rubric-ai-crit-count");

    const lesson = (lessonInput ? lessonInput.value : "").trim() || "Fen Bilimleri";
    const grade = (gradeInput ? gradeInput.value : "").trim() || "7. Sınıf";
    const topic = (topicInput ? topicInput.value : "").trim();
    const critCount = parseInt(critCountSelect ? critCountSelect.value : "4", 10) || 4;

    if (!topic) {
      alert("Lütfen değerlendirmek istediğiniz etkinlik, ödev veya sınav konusunu yazınız.\n(Örn: 7. Sınıf Fen - Hücre Modeli Tasarımı veya 6. Sınıf Türkçe - İkna Edici Konuşma)");
      return;
    }

    if (!window.callGeminiAPI) {
      if (typeof window.showGeminiKeyRequiredModal === "function") {
        window.showGeminiKeyRequiredModal({ title: "Rubrik Yapay Zeka Motoru" });
      } else {
        alert("Yapay zeka motoru (Gemini API) bulunamadı. Lütfen Ayarlar menüsünden API anahtarınızı giriniz.");
      }
      return;
    }

    const btn = document.getElementById("btn-rubric-ai-generate");
    const originalText = btn ? btn.innerHTML : "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> <span>Maarif Modeli Senaryosu ve Rubriği Üretiliyor...</span>';
    }

    const prompt = `
Sen Millî Eğitim Bakanlığı (MEB) Talim ve Terbiye Kurulu ile Ölçme, Değerlendirme ve Sınav Hizmetleri Genel Müdürlüğü standartlarında uzmanlaşmış kıdemli bir ölçme-değerlendirme uzmanısın.
MEB "Türkiye Yüzyılı Maarif Modeli Öğretim Programları Okuryazarlığı Öğretmen Kılavuz Kitabı — Ölçme ve Değerlendirme (Kitap 1 & Kitap 2)" standartlarında, bağlam temelli gerçek yaşam senaryosu içeren eksiksiz bir "Performans Görevi ve Analitik Dereceli Puanlama Anahtarı (Rubrik)" hazırlayacaksın.

GİRDİ BİLGİLERİ:
- Ders: ${lesson}
- Sınıf Kademesi: ${grade}
- Değerlendirilecek Etkinlik / Ödev / Sınav Konusu: ${topic}
- Ölçüt (Kriter) Sayısı: ${critCount}
- Düzey Formatı: 4 Düzeyli Maarif Modeli (%25, %50, %75, %100)

BEKLENEN KURALLAR:
1. "scenario": Öğrenciye verilen gerçek yaşam durumu, problem bağlamı ve rolü (2-3 cümle, ilham verici, günlük hayatla ilişkili).
2. "instructions": Öğrencinin adım adım yapması gereken 3-4 maddelik yönerge (teslim şartları, kullanılacak yöntem).
3. "criteria": Belirtilen konuyla ilgili ölçülebilir, somut öğrenme çıktıları ve süreç bileşenleri. "İyi yaptı" gibi soyut sıfatlar YASAKTIR.
4. Düzey İsimleri: "1. Düzey: Başlangıç" (%25), "2. Düzey: Gelişmekte" (%50), "3. Düzey: Yetkin" (%75), "4. Düzey: İleri" (%100).
5. Ölçüt ağırlıklarının (weight) toplamı tam olarak 100 olmalıdır.
6. Çıktı SADECE geçerli bir JSON nesnesi olmalıdır:

{
  "title": "MEB Maarif Modeli Performans Görevi ve Dereceli Puanlama Anahtarı",
  "lesson": "${lesson}",
  "grade": "${grade}",
  "taskTitle": "${topic}",
  "scenario": "Öğrenciye verilen gerçek yaşam problemi...",
  "instructions": "1. Birinci adım yönergesi...\\n2. İkinci adım yönergesi...\\n3. Üçüncü adım yönergesi...",
  "levels": [
    { "name": "1. Düzey: Başlangıç", "percent": 25 },
    { "name": "2. Düzey: Gelişmekte", "percent": 50 },
    { "name": "3. Düzey: Yetkin", "percent": 75 },
    { "name": "4. Düzey: İleri", "percent": 100 }
  ],
  "criteria": [
    {
      "name": "Ölçüt 1 Başlığı (Süreç Bileşeni)",
      "weight": 25,
      "descriptors": [
        "1. Düzey somut göstergesi...",
        "2. Düzey somut göstergesi...",
        "3. Düzey somut göstergesi...",
        "4. Düzey somut göstergesi..."
      ]
    }
  ]
}
`;

    try {
      const response = await window.callGeminiAPI(prompt, { json: true, temperature: 0.3 });
      let data = null;

      if (typeof response === "string") {
        const cleanJson = response.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
        data = JSON.parse(cleanJson);
      } else if (typeof response === "object" && response !== null) {
        data = response;
      }

      if (data && data.criteria && Array.isArray(data.criteria)) {
        data.id = `custom_ai_${Date.now()}`;
        RubricState.currentRubric = data;
        RubricState.studentEvaluations = {};

        const inputLesson = document.getElementById("rubric-input-lesson");
        const inputTask = document.getElementById("rubric-input-task");
        if (inputLesson) inputLesson.value = data.lesson || lesson;
        if (inputTask) inputTask.value = data.taskTitle || topic;

        renderA4RubricSheet();

        const toast = window.showToast || alert;
        toast("✨ Maarif Modeli bağlam temelli görev kağıdı ve rubriğiniz başarıyla oluşturuldu!");
      } else {
        throw new Error("Geçerli bir rubrik yapısı oluşturulamadı.");
      }
    } catch (err) {
      console.error("Rubrik AI Hatası:", err);
      alert("Yapay zeka ile rubrik üretilirken bir hata oluştu:\n" + (err.message || err));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  }

  // ─── 15. Özel Şablon Kaydetme ve Yönetimi ────────────────────────────────
  function saveCurrentRubricAsTemplate() {
    if (!RubricState.currentRubric) return;

    const currentTitle = RubricState.currentRubric.taskTitle || "Özel Rubrik Şablonu";
    const templateName = prompt("Bu değerlendirme anahtarı için bir şablon adı giriniz:", currentTitle);
    if (!templateName) return;

    const customId = `user_tpl_${Date.now()}`;
    const toSave = JSON.parse(JSON.stringify(RubricState.currentRubric));
    toSave.id = customId;
    toSave.title = templateName;

    RubricState.savedCustomRubrics.push(toSave);
    saveCustomRubricsToStorage();
    renderSavedRubricsDropdown();

    alert(`✅ "${templateName}" şablon kütüphanenize başarıyla kaydedildi.`);
  }

  function deleteSelectedCustomRubric() {
    const select = document.getElementById("rubric-saved-select");
    if (!select || !select.value) {
      alert("Lütfen önce silmek istediğiniz kayıtlı şablonu seçiniz.");
      return;
    }

    const tplId = select.value;
    const tpl = RubricState.savedCustomRubrics.find(r => r.id === tplId);
    if (!tpl) return;

    if (confirm(`"${tpl.title}" şablonunu silmek istediğinize emin misiniz?`)) {
      RubricState.savedCustomRubrics = RubricState.savedCustomRubrics.filter(r => r.id !== tplId);
      saveCustomRubricsToStorage();
      renderSavedRubricsDropdown();
      alert("Şablon silindi.");
    }
  }

  function loadSavedRubricsFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SAVED_RUBRICS);
      if (raw) {
        RubricState.savedCustomRubrics = JSON.parse(raw);
      } else {
        RubricState.savedCustomRubrics = [];
      }
    } catch (e) {
      RubricState.savedCustomRubrics = [];
    }
  }

  function saveCustomRubricsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_RUBRICS, JSON.stringify(RubricState.savedCustomRubrics));
    } catch (e) {
      console.error("Özel rubrikler kaydedilemedi:", e);
    }
  }

  function renderTemplatesDropdown() {
    const select = document.getElementById("rubric-template-select");
    if (!select) return;

    select.innerHTML = '<option value="">-- Hazır MEB Şablonu Seçiniz --</option>';
    Object.keys(MEB_RUBRIC_TEMPLATES).forEach(key => {
      const tpl = MEB_RUBRIC_TEMPLATES[key];
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = tpl.title;
      select.appendChild(opt);
    });
  }

  function renderSavedRubricsDropdown() {
    const select = document.getElementById("rubric-saved-select");
    if (!select) return;

    select.innerHTML = '<option value="">-- Kaydedilen Özel Şablonlarım --</option>';
    RubricState.savedCustomRubrics.forEach(tpl => {
      const opt = document.createElement("option");
      opt.value = tpl.id;
      opt.textContent = tpl.title;
      select.appendChild(opt);
    });

    select.addEventListener("change", (e) => {
      if (e.target.value) {
        loadTemplate(e.target.value);
      }
    });
  }

  function renderClassStudentsDropdown() {
    const select = document.getElementById("rubric-student-select");
    if (!select) return;

    let allStudents = [];
    if (window.stateManager && typeof window.stateManager.getStudents === "function") {
      allStudents = window.stateManager.getStudents(true) || [];
    }

    allStudents.sort((a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0));

    select.innerHTML = '<option value="">-- Sınıftan Öğrenci Seçiniz --</option>';
    allStudents.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      const numStr = s.number ? `No: ${s.number} - ` : "";
      opt.textContent = `${numStr}${s.name || ''} ${s.surname || ''} (${s.branch || ''})`;
      select.appendChild(opt);
    });
  }

  function toggleEcoMode() {
    RubricState.isEcoMode = !RubricState.isEcoMode;
    const btn = document.getElementById("btn-rubric-toggle-eco");
    if (btn) {
      if (RubricState.isEcoMode) {
        btn.classList.add("active");
        btn.innerHTML = '<span>✅</span> <span>Fotokopi Modu Açık</span>';
      } else {
        btn.classList.remove("active");
        btn.innerHTML = '<span>🖨️</span> <span>Fotokopi (Eco) Modu</span>';
      }
    }
    renderA4RubricSheet();
  }

  function printRubricA4() {
    const sheet = document.getElementById("rubric-a4-sheet");
    if (!sheet) return;

    let printContainer = document.querySelector(".rubric-print-container");
    if (!printContainer) {
      printContainer = document.createElement("div");
      printContainer.className = "rubric-print-container";
      document.body.appendChild(printContainer);
    }

    printContainer.innerHTML = sheet.innerHTML;
    if (RubricState.isEcoMode) {
      printContainer.classList.add("fotokopi-mode");
    } else {
      printContainer.classList.remove("fotokopi-mode");
    }

    let styleOverride = document.getElementById("rubric-print-page-style");
    if (!styleOverride) {
      styleOverride = document.createElement("style");
      styleOverride.id = "rubric-print-page-style";
      styleOverride.textContent = "@page { size: A4 portrait; margin: 0 !important; }";
      document.head.appendChild(styleOverride);
    }

    const cleanupPrint = () => {
      document.body.classList.remove("print-rubric");
      const st = document.getElementById("rubric-print-page-style");
      if (st && st.parentNode) st.parentNode.removeChild(st);
      if (printContainer) printContainer.innerHTML = "";
    };

    document.body.classList.add("print-rubric");
    window.print();

    window.addEventListener("afterprint", cleanupPrint, { once: true });
    setTimeout(cleanupPrint, 12000);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.initRubricMaker = initRubricMaker;
  window.RubricState = RubricState;

})();
