/**
 * Sınıf Asistanı — Kapsamlı Kullanım Kitabı (js/manual.js)
 * İlk kez kullanan öğretmenler için tek başına yeterli, adım adım,
 * Masaüstü + El Terminali (Mobil) eşleştirmeli rehber.
 */
(function () {
  'use strict';

  const MANUAL_CATEGORIES = [
    { id: 'all', label: 'Tümü', icon: 'layers' },
    { id: 'start', label: 'Başlangıç', icon: 'compass' },
    { id: 'classroom', label: 'Sınıf & Ödev', icon: 'users' },
    { id: 'assessment', label: 'Ölçme & OMR', icon: 'scan-line' },
    { id: 'ai', label: 'Yapay Zeka', icon: 'sparkles' },
    { id: 'mobile', label: 'El Terminali', icon: 'smartphone' },
    { id: 'tools', label: 'Araçlar & Rapor', icon: 'wrench' },
    { id: 'security', label: 'Güvenlik & Ayar', icon: 'shield' }
  ];

  const MANUAL_ITEMS = [
    /* =========================================================================
       1. İLK KURULUM VE BAŞLANGIÇ REHBERİ
       ========================================================================= */
    {
      id: 'quick-start',
      title: '🧭 İlk Kurulum ve Başlangıç Rehberi (5 Adımda Hazır Olun)',
      subtitle: 'Uygulamayı ilk kez açtığınızda hiç zorlanmadan sırasıyla yapmanız gereken eksiksiz kurulum kılavuzu.',
      icon: 'compass',
      badge: { text: 'BAŞLANGIÇ', type: 'start' },
      categories: ['start', 'ai', 'mobile'],
      path: 'Asistan Konfigürasyonu → Genel Ayarlar → Yapay Zeka → Öğrenci Yönetimi → Geçerli Hafta → Eşleştirme',
      defaultOpen: true,
      keywords: 'ilk kurulum başlangıç rehberi kademe tema lisans yapay zeka api anahtarı öğrenci ekleme geçerli hafta el terminali eşleştirme qr kod şifre nasıl başlanır',
      bodyHtml: `
        <p><strong>Sınıf Asistanı</strong>'na hoş geldiniz! Uygulamayı ilk kez kurduysanız, aşağıdaki <strong>5 adımı verilen sırayla</strong> tamamladığınızda hem masaüstü/akıllı tahta uygulamanız hem de cep telefonunuzdaki El Terminali tüm özellikleriyle çalışmaya hazır hale gelir.</p>

        <ol class="manual-step-list">
          <li>
            <strong>Eğitim Kademesi, Tema ve Lisans Ayarını Yapın:</strong>
            Sol menüden <code>Asistan Konfigürasyonu → Genel Ayarlar</code> sekmesini açın.
            <ul>
              <li><strong>Eğitim Kademesi:</strong> Sınıf öğretmeniyseniz <strong>İlkokul</strong>, branş öğretmeniyseniz <strong>Ortaokul</strong> seçeneğini işaretleyin. Bu seçim ekran düzenini, şube sistemini ve sınav araçlarını sizin branşınıza göre uyarlar.</li>
              <li><strong>Tema Seçimi:</strong> Akıllı tahta ve loş sınıf ortamları için <strong>Koyu Tema</strong>, aydınlık ortamlar için <strong>Açık Tema</strong> seçebilirsiniz.</li>
              <li><strong>Lisans Aktivasyonu:</strong> Size iletilen lisans anahtarını ilgili alana yapıştırıp <strong>Aktifleştir</strong> butonuna basın.</li>
            </ul>
          </li>
          <li>
            <strong>Yapay Zeka (AI) Anahtarını Oluşturup Tanımlayın:</strong>
            <code>Asistan Konfigürasyonu → Yapay Zeka (AI)</code> sekmesine geçin. Ekrandaki yönlendirmeyi izleyerek ücretsiz veya ücretli API anahtarınızı alın, kutuya yapıştırın ve <strong>Kaydet / Bağlantıyı Test Et</strong> butonuna tıklayın.
            <br><em>Neden 2. sırada?</em> Yapay zekayı şimdi aktif ettiğinizde, hemen bir sonraki adımda e-Okul PDF listenizi veya sınıf listesi fotoğrafınızı yükleyerek tüm öğrencilerinizi tek tek yazmadan saniyeler içinde içeri aktarabilirsiniz.
          </li>
          <li>
            <strong>Sınıf ve Öğrenci Listesini Yükleyin:</strong>
            <code>Asistan Konfigürasyonu → Öğrenci Yönetimi</code> sekmesine gidin ve <strong>Öğrenci Ekle</strong> butonuna tıklayın. Karşınıza 3 seçenek çıkar:
            <ul>
              <li><strong>Yapay Zeka ile Otomatik Ekle (Önerilen):</strong> e-Okul sınıf listesi PDF'ini veya listenin net bir fotoğrafını seçin; ad, soyad ve okul numaraları otomatik çıkarılır.</li>
              <li><strong>Excel / CSV Şablonu ile Toplu Ekle:</strong> Örnek Excel şablonunu indirip doldurun ve tek tıkla yükleyin.</li>
              <li><strong>Tek Tek Manuel Ekle:</strong> Yeni nakil gelen tek bir öğrenciyi hızlıca eklemek için kullanın.</li>
            </ul>
          </li>
          <li>
            <strong>Geçerli Çalışma Haftasını Kontrol Edin:</strong>
            <code>Asistan Konfigürasyonu → Geçerli Hafta</code> sekmesini açın. Uygulama <strong>her Pazartesi otomatik olarak yeni haftaya geçer</strong>; ancak ilk kurulumda okulunuzun mevcut eğitim haftasıyla (örn. 12. Hafta) tam eşleşmesi için bu ekrandan doğru haftayı seçip onaylayın.
          </li>
          <li>
            <strong>El Terminalini (Mobil Uygulama) Kurun ve Eşleştirin:</strong>
            <code>Asistan Konfigürasyonu → Eşleştirme Ayarları</code> sekmesini açın. Ekrandaki <strong>İndirme QR Kodu</strong>nu Android telefonunuzla okutup uygulamayı kurun. Ardından masaüstünde görünen <code>SA-XXXXXX</code> eşleştirme kodunu telefonunuza girin ve verileri çekin. Artık sınıfta gezerken telefonunuzdan girdiğiniz her işlem akıllı tahtada anında görünür.
          </li>
        </ol>

        <div class="manual-callout manual-callout-important">
          <strong>⭐ Önemli (İlk Ders Öncesi Öneri):</strong> Kurulumdan sonra <code>Araçlar → Planlama → Haftalık Plan</code> bölümünden ders programınızı ve zil saatlerinizi bir kez girerseniz, hem masaüstünde hem de telefonunuzda <em>"şu an hangi dersteyiz, teneffüse kaç dakika kaldı"</em> canlı sayacı otomatik çalışır.
        </div>

        <div class="manual-callout manual-callout-tip">
          <strong>💡 Akıllı Tahta Güvenliği İpucu:</strong> Uygulamayı sınıfta akıllı tahtada açık bırakıyorsanız <code>Asistan Konfigürasyonu → Şifre Kontrolü</code> sekmesinden öğretmen şifresi belirleyin. Böylece teneffüslerde ekran otomatik kilitlenir veya telefonunuzdaki kilit tuşuyla tahtayı uzaktan kilitleyebilirsiniz.
        </div>
      `,
      mobileHtml: `
        Android El Terminalini ilk kez açtığınızda sizi <strong>3 Adımlı Kurulum Sihirbazı</strong> karşılar:<br>
        <strong>1. Adım:</strong> Sınıf Öğretmeni (İlkokul) veya Branş Öğretmeni (Ortaokul) rolünüzü seçin.<br>
        <strong>2. Adım:</strong> Masaüstündeki <code>Eşleştirme Ayarları</code> ekranında yer alan <code>SA-...</code> kodunu girin ve <strong>Buluttan Verileri Çek</strong> butonuna basın.<br>
        <strong>3. Adım:</strong> Çekilen şubelerinizi kontrol edip <strong>Kurulumu Tamamla</strong> deyin. Öğrenci listesi, fotoğraflar, ödevler, kitaplar ve ders programınız anında telefonunuza iner.
      `
    },

    /* =========================================================================
       2. SINIF KURULUMU, ŞUBE VE ÖĞRENCİ YÖNETİMİ
       ========================================================================= */
    {
      id: 'students-setup',
      title: '👥 Sınıf Kurulumu, Şube ve Öğrenci Yönetimi',
      subtitle: 'Yapay zeka (e-Okul PDF/fotoğraf), Excel veya tekil öğrenci ekleme, fotoğraf yükleme, şube geçişi ve veli bilgileri.',
      icon: 'users',
      badge: { text: 'GÜNCELLENDİ', type: 'updated' },
      categories: ['start', 'classroom', 'ai'],
      path: 'Asistan Konfigürasyonu → Öğrenci Yönetimi',
      keywords: 'öğrenci ekleme yapay zeka e-okul pdf fotoğraf excel şablonu csv silme güncelleme şube veli telefon numarası profil fotoğrafı ilkokul ortaokul',
      bodyHtml: `
        <p>Tüm puanlama, ödev, kitaplık, optik okuma ve raporlama işlemleri bu ekranda oluşturduğunuz öğrenci listesine bağlı olarak çalışır. Öğrencilerinizi ister tek tek, ister Excel ile, isterseniz de Yapay Zeka ile saniyeler içinde ekleyebilirsiniz.</p>

        <div class="manual-subsections">
          <div>
            <strong>1. Yapay Zeka ile Otomatik Öğrenci Ekleme (e-Okul PDF / Fotoğraf):</strong>
            <ol class="manual-step-list">
              <li><code>Asistan Konfigürasyonu → Öğrenci Yönetimi</code> sekmesinde <strong>Öğrenci Ekle</strong> butonuna tıklayın.</li>
              <li>Açılan pencerede mor vurgulu <strong>Yapay Zeka ile Otomatik Ekle</strong> kartını seçin.</li>
              <li>e-Okul'dan indirdiğiniz sınıf listesi PDF dosyasını veya sınıf listesinin net bir fotoğrafını (JPG/PNG) bilgisayarınızdan seçin.</li>
              <li>Yapay zeka tüm öğrencilerin <em>Okul Numarası, Adı, Soyadı</em> bilgilerini otomatik ayrıştırır. Önizleme ekranında listeyi kontrol edip onayladığınızda tüm sınıf tek seferde kaydedilir.</li>
            </ol>
          </div>

          <div>
            <strong>2. Excel / CSV Şablonu ile Toplu Yükleme:</strong>
            <ol class="manual-step-list">
              <li><strong>Excel Şablonu</strong> butonuna tıklayarak hazır örnek dosyayı bilgisayarınıza indirin.</li>
              <li>Dosyayı Excel veya LibreOffice ile açıp sütun başlıklarını değiştirmeden <em>Adı, Soyadı, Okul No, Cinsiyet (Kız/Erkek) ve Veli Telefonu</em> bilgilerini doldurup kaydedin.</li>
              <li><strong>Öğrenci Yükle</strong> butonuna basıp kaydettiğiniz dosyayı seçin.</li>
            </ol>
          </div>

          <div>
            <strong>3. Tekil Öğrenci Ekleme, Düzenleme ve Profil Fotoğrafı:</strong>
            <p>Dönem içinde sınıfa yeni öğrenci geldiğinde manuel ekleme formunu kullanabilirsiniz. Mevcut bir öğrencinin satırındaki <strong>Kalem (Düzenle)</strong> ikonuna basarak okul numarasını, veli telefonunu güncelleyebilir veya profil fotoğrafı yükleyebilirsiniz. Yüklediğiniz fotoğraflar Gösterge Paneli, Nöbet Listesi, Çarkıfelek, Başarı Belgesi ve El Terminalinde otomatik görünür.</p>
          </div>

          <div>
            <strong>4. İlkokul ve Ortaokul (Çoklu Şube) Farkı:</strong>
            <ul>
              <li><strong>İlkokul Modu:</strong> Tek sınıf düzenine odaklanır; puanlar yıldız/motivasyon odaklı gösterilir.</li>
              <li><strong>Ortaokul (Branş) Modu:</strong> Birden fazla şube (5-A, 6-B, 7-C vb.) oluşturabilirsiniz. <strong>Üst menüde seçtiğiniz şube tüm uygulama genelinde etkin şube olur</strong>; ödev, kitap, optik sınav, oturma planı ve raporlar otomatik olarak o şubeye göre filtrelenir.</li>
            </ul>
          </div>
        </div>

        <div class="manual-callout manual-callout-info">
          <strong>📌 Bilgi Notu (Fotoğraf Koruma Kalkanı):</strong> Uygulama, öğrenci fotoğraflarını yerel diskte güvenle saklar. Bulut eşitleme veya veri güncelleme sırasında mevcut öğrenci fotoğrafları asla boş veriyle ezilmez.
        </div>

        <div class="manual-callout manual-callout-warn">
          <strong>⚠️ Dikkat:</strong> Bir öğrenciyi <strong>Sil (Çöp Kutusu)</strong> butonuyla listeden kalıcı olarak kaldırdığınızda, o öğrenciye ait geçmiş tüm davranış puanları, ödev durumları ve kitap geçmişi de silinir. Bu işlem geri alınamaz; toplu değişiklik öncesi JSON yedek almanız önerilir.
        </div>
      `,
      mobileHtml: `
        Branş (Ortaokul) modunda el terminalinin üst kısmında <strong>Şube Seçim Çubuğu</strong> yer alır; derse girdiğiniz şubeye tek dokunuşla geçebilirsiniz. Öğrenci fotoğrafları el terminaline yalnızca fotoğrafı eksik olan öğrenciler için <strong>tek seferlik</strong> indirilir ve cihazda önbelleklenir; böylece mobil internet kotanız korunur.
      `
    },

    /* =========================================================================
       3. EL TERMİNALİ (MOBİL UYGULAMA) VE BULUT EŞİTLEME
       ========================================================================= */
    {
      id: 'companion-cloud',
      title: '📱 El Terminali (Mobil Uygulama) ve Bulut Eşitleme',
      subtitle: 'Android el terminalini kurma, eşleştirme koduyla bağlama, canlı senkronizasyon ve mobil ana ekran rehberi.',
      icon: 'smartphone',
      badge: { text: 'YENİ', type: 'new' },
      categories: ['start', 'mobile'],
      path: 'Asistan Konfigürasyonu → Eşleştirme Ayarları',
      keywords: 'el terminali mobil android apk qr kod bulut eşitleme senkronizasyon canlı güncelleme eşleştirme kodu yenileme kota',
      bodyHtml: `
        <p><strong>Sınıf Asistanı El Terminali</strong>, masaüstü uygulamanızın cep telefonunuzdaki canlı kumandası ve yardımcısıdır. Sınıfta sıraların arasında dolaşırken bilgisayar başına gitmeden yoklama alabilir, ödev kontrol edebilir, puan verebilir, kitap ödünç verip optik sınav okuyabilirsiniz.</p>

        <div class="manual-subsections">
          <div>
            <strong>1. Masaüstünden Eşleştirme Nasıl Başlatılır?</strong>
            <ol class="manual-step-list">
              <li><code>Asistan Konfigürasyonu → Eşleştirme Ayarları</code> sekmesini açın.</li>
              <li>Telefonunuzun kamerasıyla ekrandaki <strong>Android APK İndirme QR Kodu</strong>nu okutup uygulamayı kurun (Android "bilinmeyen kaynaklardan yükleme" izni isterse onaylayın).</li>
              <li>Aynı ekranda sizin sınıfınıza özel üretilmiş <code>SA-XXXXXX</code> biçimindeki <strong>Eşleştirme Kodu</strong>nu görün.</li>
              <li><strong>Buluta Gönder / Eşitle</strong> butonuna basarak masaüstündeki mevcut sınıf, ödev, kitap ve ders programı verilerinizin bulutta güncel olduğundan emin olun.</li>
            </ol>
          </div>

          <div>
            <strong>2. İki Yönlü Canlı Eşitleme Nasıl Çalışır?</strong>
            <ul>
              <li><strong>Masaüstünden Telefona:</strong> Yeni öğrenci eklediğinizde, sınav oluşturduğunuzda, oturma planı kaydettiğinizde veya ders programını güncellediğinizde bulut üzerinden el terminaline aktarılır.</li>
              <li><strong>Telefondan Masaüstüne:</strong> Derste telefonunuzdan verdiğiniz davranış puanları, işaretlediğiniz yoklamalar, yaptığınız ödev kontrolleri, kitap ödünç/iade işlemleri ve kamerayla okuttuğunuz optik formlar saniyeler içinde masaüstüne otomatik işlenir.</li>
              <li><strong>Manuel Yenileme:</strong> Anlık olarak verileri tazelemek isterseniz el terminalinin sağ üst köşesindeki <strong>🔄 Yenile / Eşitle</strong> butonuna dokunabilirsiniz.</li>
            </ul>
          </div>

          <div>
            <strong>3. El Terminali Ana Ekranında Neler Var?</strong>
            <ul>
              <li><strong>Üst Çubuk:</strong> <em>Masaüstüyle Eşitle/Yenile</em>, <em>Terminal Ayarları</em>, <em>🔒 Akıllı Tahtayı Kilitle/Aç</em> ve <em>Karanlık/Aydınlık Tema</em> butonları.</li>
              <li><strong>3 Hızlı Aksiyon Butonu:</strong> Tek dokunuşla <em>Rastgele Söz Hakkı</em>, <em>Toplu Puan Ver</em> ve <em>Yoklama Al</em>.</li>
              <li><strong>6 Ana Modül Kartı:</strong> <em>Davranış &amp; Öğrenciler</em>, <em>Optik Okuma</em>, <em>Ödev Takibi</em>, <em>Kitap Takibi</em>, <em>Raporlar &amp; Veli Bülteni</em>, <em>Ders Programı &amp; Plan</em>.</li>
            </ul>
          </div>
        </div>

        <div class="manual-callout manual-callout-info">
          <strong>📌 Bilgi Notu (Düşük Veri Tüketimi):</strong> Bulut eşitleme sistemi yalnızca değişen kayıtları çekecek şekilde optimize edilmiştir. Öğrenci fotoğrafları her açılışta tekrar indirilmez; yalnızca eksik olanlar için tek seferlik indirilir.
        </div>

        <div class="manual-callout manual-callout-warn">
          <strong>⚠️ Dikkat:</strong> Eşleştirme kodunuz (<code>SA-XXXXXX</code>) sınıf verilerinizin anahtarıdır; sadece kendi telefonunuzda kullanın ve başkalarıyla paylaşmayın.
        </div>
      `
    },

    /* =========================================================================
       4. GÖSTERGE PANELİ, PUANLAMA SİSTEMİ VE GEÇERLİ HAFTA
       ========================================================================= */
    {
      id: 'dashboard-points-week',
      title: '📊 Gösterge Paneli, Puanlama Sistemi ve Geçerli Hafta',
      subtitle: 'Günlük puan verme, öğrenci detay kartı, davranış/ödev/kitap/sınav puan kuralları ve otomatik hafta yönetimi.',
      icon: 'award',
      categories: ['classroom', 'mobile'],
      path: 'Gösterge Paneli · Konfigürasyon → Puan Ayarları / Geçerli Hafta',
      keywords: 'gösterge paneli dashboard puanlama davranış puanı artı eksi ödev puanı kitap puanı sınav derecesi geçerli hafta pazartesi otomatik geçiş manuel hafta seçimi yoklama öğrenci kartı',
      bodyHtml: `
        <p><strong>Gösterge Paneli</strong>, öğretmenin gün içinde en sık kullandığı ana merkezdir. Sınıfın anlık puan durumunu, liderlik sırasını, o günkü ders akışını ve öğrenci performanslarını tek ekranda görürsünüz.</p>

        <div class="manual-subsections">
          <div>
            <strong>1. Gösterge Paneli Görünümleri ve Hızlı Puan Verme:</strong>
            <ul>
              <li>Üstteki alt sekmelerden <strong>Genel Performans</strong> (dönem toplamı), <strong>Haftalık Performans</strong> (etkin hafta) ve <strong>Aylık Performans</strong> arasında geçiş yapabilirsiniz.</li>
              <li>Bir öğrenci kartına tıkladığınızda açılan panelden tanımlı olumlu (<code>+</code>) veya geliştirilmeli (<code>-</code>) davranış butonlarına basarak anında puan verebilirsiniz.</li>
              <li>Birden fazla öğrenciyi seçip aynı anda <strong>Toplu Puan</strong> verebilirsiniz (örneğin sessiz çalışan gruba veya tüm sınıfa +5 puan).</li>
              <li>Öğrenci detay kartında öğrencinin <em>haftalık gelişim grafiği, tarihli davranış günlüğü, ödev/kitap geçmişi</em> ve <em>tek tıkla veli özet metni</em> bulunur.</li>
            </ul>
          </div>

          <div>
            <strong>2. Puanlama Kurallarını Sınıfınıza Göre Özelleştirme:</strong>
            <p><code>Asistan Konfigürasyonu → Puan Ayarları</code> sekmesinde 4 ayrı alt sekme yer alır:</p>
            <ul>
              <li><strong>Davranış Puanları:</strong> "Derse katılım (+5)", "Arkadaşına yardım (+10)", "Hazırlıksız gelme (-5)" gibi hazır kuralların puanlarını değiştirebilir veya en alttaki formdan kendi sınıf kurallarınızı ekleyebilirsiniz.</li>
              <li><strong>Ödev Puanları:</strong> <em>Yapıldı</em>, <em>Eksik</em>, <em>Yapılmadı</em> ve <em>Mazeretli</em> durumlarının kaç puan ekleyip düşeceğini belirleyin.</li>
              <li><strong>Kitap Puanları:</strong> 1. Seviye (temel/ince) ve 2. Seviye (ileri/kalın) kitaplar için okuma süresi (gün), zamanında iade puanı ve gecikmeli iade puanını ayarlayın.</li>
              <li><strong>Sınav Puanları:</strong> Deneme veya haftalık sınavlarda ilk 3 veya ilk 5'e giren öğrencilere otomatik eklenecek ödül puanlarını tanımlayın.</li>
            </ul>
          </div>

          <div>
            <strong>3. Çalışma Haftası (Otomatik Geçiş ve Manuel Müdahale):</strong>
            <p>Sınıf Asistanı haftalık periyotlarla çalışır ve <strong>her Pazartesi otomatik olarak yeni haftaya geçer</strong>. Ekstra bir "hafta kapatma" işlemi yapmanız gerekmez. İhtiyaç halinde (örneğin ara tatil sonrası hafta numarasını hizalamak veya geçmiş bir haftada düzeltme yapmak için) <code>Asistan Konfigürasyonu → Geçerli Hafta</code> menüsünden manuel olarak istediğiniz haftayı seçebilirsiniz.</p>
          </div>
        </div>

        <div class="manual-callout manual-callout-important">
          <strong>⭐ Önemli:</strong> <code>Geçerli Hafta</code> menüsünde etkin olan hafta tüm uygulamadaki ödevler, haftalık değerlendirmeler ve raporlar için aktif hafta kabul edilir. Yeni haftaya geçildiğinde önceki haftaların kayıtları silinmez; arşivde saklanır ve manuel hafta seçimiyle her zaman incelenebilir.
        </div>
      `,
      mobileHtml: `
        El terminalinde <strong>Davranış &amp; Öğrenciler</strong> kartına dokunduğunuzda sınıf listeniz açılır. Herhangi bir öğrenciye dokunarak kayıtlı davranış kurallarınızdan birini seçebilir veya hızlı <strong>+1 / +2 / +3 / -1</strong> butonlarıyla anında puan yazabilirsiniz. Ana ekrandaki <strong>Toplu Puan Ver</strong> ile çoklu öğrenci seçip puan verebilir, <strong>Yoklama Al</strong> butonuyla o gün gelmeyen öğrencileri işaretleyebilirsiniz.
      `
    },

    /* =========================================================================
       5. HAFTALIK DEĞERLENDİRME VE OPTİK OKUMA (OMR)
       ========================================================================= */
    {
      id: 'weekly-omr',
      title: '🎯 Haftalık Değerlendirme ve Optik Okuma (OMR)',
      subtitle: 'Sınav oluşturma, ArUco kimlikli optik form yazdırma (A5 önerili), kamera ile okuma ve kazanım analizi.',
      icon: 'scan-line',
      badge: { text: 'YENİ', type: 'new' },
      categories: ['assessment', 'mobile'],
      path: 'Haftalık Değerlendirme',
      keywords: 'optik okuma omr aruco form yazdırma a5 kağıt cevap anahtarı deneme sınavı haftalık değerlendirme kamera tarama kazanım analizi net hesaplama',
      bodyHtml: `
        <p>Çoktan seçmeli deneme sınavları, tarama testleri ve haftalık kazanım değerlendirmelerini saniyeler içinde okuyup karne ve soru analizine dönüştürebilirsiniz.</p>

        <div class="manual-subsections">
          <div>
            <strong>1. Sınav ve Cevap Anahtarı Oluşturma:</strong>
            <ol class="manual-step-list">
              <li>Sol menüden <code>Haftalık Değerlendirme</code> sekmesini açın ve <strong>Sınav Ekle</strong> butonuna tıklayın.</li>
              <li>Sınav adını, tarihini, dersleri (Türkçe, Matematik, Fen vb.) ve her dersin soru sayısını belirleyin.</li>
              <li>Cevap anahtarını (A, B, C, D) girin; isterseniz her sorunun karşısına ait olduğu kazanımı/konuyu da yazabilirsiniz.</li>
            </ol>
          </div>

          <div>
            <strong>2. ArUco Kimlikli Optik Form Yazdırma:</strong>
            <p>Sınavı oluşturduktan sonra <strong>Optik Form Yazdır</strong> butonuna tıklayın. Sistem her öğrenci için adını, okul numarasını ve parlamaya dayanıklı beyaz zeminli <strong>ArUco kimlik kodunu</strong> içeren kişisel optik formlar üretir. Böylece öğrenciler kodlama hatası yapmaz, kamera öğrenciyi otomatik tanır.</p>
          </div>

          <div>
            <strong>3. Optik Okuma, Sonuç Tablosu ve Kazanım Analizi:</strong>
            <p>Okutulan kağıtlar otomatik olarak puanlanır; her öğrencinin ders bazlı <em>Doğru, Yanlış, Boş, Net ve Puan</em> değerleri hesaplanır. <strong>Soru Analizi</strong> görünümünde sınıfın hangi sorularda zorlandığını yüzdesel olarak görüp telafi çalışması planlayabilirsiniz.</p>
          </div>
        </div>

        <div class="manual-callout manual-callout-warn">
          <strong>⚠️ Dikkat (Baskı ve Okuma Kalitesi):</strong> Optik formları yazdırırken en ideal boyut ve kağıt tasarrufu için <strong>A5 kağıt</strong> (veya A4 kağıda 2 form / %100 ölçek) kullanmanız önerilir. Tarama sırasında kağıdı düz bir masaya koyun, 4 köşe işaretinin kamera kadrajında olduğundan emin olun ve yoğun gölge/parlamadan kaçının.
        </div>
      `,
      mobileHtml: `
        Optik kağıt okumanın en hızlı yolu <strong>El Terminali → Optik Okuma</strong> modülüdür:<br>
        <strong>1.</strong> İlgili sınavı listeden seçin (isterseniz doğrudan telefondan yeni sınav da oluşturabilirsiniz).<br>
        <strong>2.</strong> <strong>Kamerayla Tara</strong> butonuna dokunup telefonu optik formun üzerine paralel tutun; sistem ArUco kodundan öğrenciyi otomatik tanır ve tüm şıkları okur.<br>
        <strong>3.</strong> Gerekirse <strong>Optik Önizleme</strong> ile okunan baloncuk noktalarını görsel olarak kontrol edebilir veya öğrenci eşleştirmesini manuel değiştirebilirsiniz. Onayladığınız her kağıt anında masaüstündeki sınav tablosuna işlenir.
      `
    },

    /* =========================================================================
       6. ÖDEV TAKİBİ VE AI ÖDEV HAZIRLAMA ROBOTU
       ========================================================================= */
    {
      id: 'homework-and-ai-robot',
      title: '📋 Ödev Takibi ve AI Ödev Hazırlama Robotu',
      subtitle: 'Masaüstü ve mobilde ödev girişi, puanlama, WhatsApp veli paylaşımı, oturma sırasına göre kontrol ve AI çalışma kağıdı.',
      icon: 'clipboard-check',
      badge: { text: 'YENİ', type: 'new' },
      categories: ['classroom', 'ai', 'mobile'],
      path: 'Ödev Takibi · Araçlar → Ödev Hazırlama Robotu',
      keywords: 'ödev takibi ödev oluşturma whatsapp paylaşım toplu ödev kontrolü oturma sırası ödev hazırlama robotu yapay zeka çalışma kağıdı etkinlik test kazanım',
      bodyHtml: `
        <p>Ödev verme, velilere duyurma, sınıfta kontrol edip puanlama ve yapay zeka ile sıfırdan çalışma kağıdı üretme süreçlerinin tamamını kapsar.</p>

        <div class="manual-subsections">
          <div>
            <strong>1. Masaüstünde Ödev Oluşturma ve Duyuru Paylaşımı:</strong>
            <ol class="manual-step-list">
              <li><code>Ödev Takibi</code> sekmesinde <strong>Yeni Ödev Ekle</strong> butonuna tıklayın.</li>
              <li>Ders adını, ödev başlığını/sayfa bilgisini ve teslim tarihini girip kaydedin.</li>
              <li>Ödevin yanındaki paylaşım/kopyalama seçeneğiyle düzenli ödev duyuru metnini oluşturup sınıf <strong>WhatsApp veli grubunda</strong> paylaşabilirsiniz.</li>
            </ol>
          </div>

          <div>
            <strong>2. Sınıf İçi Toplu Ödev Kontrolü ve Puanlama:</strong>
            <p>Kontrol gününde ödevi seçin ve her öğrencinin yanındaki durum butonlarından birine tıklayın: <strong>Yapıldı</strong>, <strong>Eksik</strong>, <strong>Yapılmadı</strong> veya <strong>Mazeretli</strong>. <code>Puan Ayarları → Ödev Puanları</code> bölümünde tanımladığınız puan değerleri öğrencilerin haftalık ve genel puanlarına otomatik yansır.</p>
          </div>

          <div>
            <strong>3. Ödev Hazırlama Robotu (Yapay Zeka ile Çalışma Kağıdı):</strong>
            <ol class="manual-step-list">
              <li><code>Araçlar → Ödev Hazırlama Robotu</code> aracını başlatın.</li>
              <li>Sınıf düzeyini, dersi ve isterseniz <strong>Yıllık Plan kazanımlarınızdan</strong> ilgili haftanın kazanımını seçin.</li>
              <li>Soru türlerini (çoktan seçmeli, boşluk doldurma, doğru-yanlış, eşleştirme, açık uçlu) ve zorluk seviyesini belirleyip <strong>Oluştur</strong> deyin.</li>
              <li>Üretilen çalışma kağıdını önizleyip düzenleyin, ardından <strong>A4 Yazdır / PDF Kaydet</strong> ile sınıfınıza dağıtın.</li>
            </ol>
          </div>
        </div>

        <div class="manual-callout manual-callout-tip">
          <strong>💡 İpucu (Sıra Sıra Hızlı Kontrol):</strong> Masaüstünde <code>Araçlar → Sınıf Oturma Planı</code>nı bir kez oluşturup kaydettiğinizde, el terminalindeki ödev kontrol ekranında öğrencileri <strong>oturdukları masa sırasına göre</strong> listeleyebilirsiniz.
        </div>
      `,
      mobileHtml: `
        El terminalindeki <strong>Ödev Takibi</strong> ekranı sınıf içinde büyük hız kazandırır:<br>
        • <strong>Yeni Ödev &amp; WhatsApp Paylaşımı:</strong> Sağ alttaki <strong>+ Yeni Ödev</strong> butonuyla ders ve açıklama girip <strong>"Kaydet ve WhatsApp'ta Paylaş"</strong> dediğinizde ödev hem sisteme kaydedilir hem de hazır mesajla WhatsApp veli grubuna gönderilir.<br>
        • <strong>Sıralama ile Hızlı Kontrol:</strong> Üstteki <strong>Sıralama</strong> butonundan listeyi <em>Sınıf Oturma / Masa Planı</em>, <em>Okul No</em>, <em>İsim (A-Z)</em> veya <em>Ters Sıra</em> şeklinde dizerek sıraların arasında yürürken tek dokunuşla <em>Yapıldı / Eksik / Yapılmadı / Mazeretli</em> işaretleyebilirsiniz. İşaretlenen tüm durumlar anında masaüstüne ve puan tablolarına aktarılır.
      `
    },

    /* =========================================================================
       7. SINIF KİTAPLIĞI, BARKOD ETİKETLEME VE OKUMA TAKİBİ
       ========================================================================= */
    {
      id: 'library-books',
      title: '📚 Sınıf Kitaplığı, Barkod Etiketleme ve Okuma Takibi',
      subtitle: 'Kitap envanteri, ödünç/iade puanlaması, barkod etiket yazdırma (boş etiket atlama), öğrenci kitaplığı ve okuma liderliği.',
      icon: 'book-open',
      badge: { text: 'GÜNCELLENDİ', type: 'updated' },
      categories: ['classroom', 'mobile'],
      path: 'Sınıf Kitaplığı',
      keywords: 'kitaplık kitap okuma ödünç verme iade geciken kitaplar öğrenci kitaplığı en iyi 20 okuyucu liderlik barkod etiket boş etiket atlama toplu kitap puanı',
      bodyHtml: `
        <p>Sınıf kitaplığınızdaki her kitabın kimde olduğunu, ne zaman iade edilmesi gerektiğini ve öğrencilerin okuduğu toplam kitap/sayfa sayılarını zahmetsizce takip edebilirsiniz.</p>

        <div class="manual-subsections">
          <div>
            <strong>1. Kitap Envanteri Oluşturma:</strong>
            <p><code>Sınıf Kitaplığı → Kitaplık (Kitap Yönetimi)</code> sekmesine gidin ve <strong>Kitap Ekle</strong> butonuna tıklayın. Kitap adı, yazar, sayfa sayısı, türü ve okuma seviyesini (<strong>1. Seviye</strong> veya <strong>2. Seviye</strong>) kaydedin. Seviye seçimi, kitabın kaç gün içinde okunacağını ve kazandıracağı puanı otomatik belirler.</p>
          </div>

          <div>
            <strong>2. Kitap Ödünç Verme ve İade Alma:</strong>
            <ol class="manual-step-list">
              <li>Öğrenci bir kitap aldığında kitabın yanındaki <strong>Ödünç Ver</strong> butonuna tıklayıp öğrenciyi seçin. Kitap durumu <em>Öğrencide</em> olur ve teslim süresi sayacı başlar.</li>
              <li>Kitap geri geldiğinde <strong>İade Al</strong> butonuna basın. Sistem teslim süresini kontrol eder: zamanında getirilmişse <strong>Zamanında İade Puanı</strong>, süre aşıldıysa <strong>Gecikmeli İade Puanı</strong> öğrenciye otomatik eklenir.</li>
            </ol>
          </div>

          <div>
            <strong>3. Öğrenci Kitaplığı, Gecikenler, En İyi 20 ve Toplu Puan:</strong>
            <ul>
              <li><strong>Öğrenci Kitaplığı:</strong> Bir öğrenciyi seçtiğinizde bugüne kadar okuduğu tüm kitapların listesini ve toplam sayfa sayısını görürsünüz.</li>
              <li><strong>Geciken Kitaplar:</strong> Teslim tarihi geçmiş tüm kitapları ve elinde tutan öğrencileri tek ekranda görüp hatırlatma yapabilirsiniz.</li>
              <li><strong>Okuma Liderlik Tablosu &amp; En İyi 20 Okuyucu:</strong> Sınıf içi okuma yarışmaları için sayfa ve kitap sayısına göre otomatik sıralama sunar.</li>
              <li><strong>Toplu Kitap Puanı:</strong> Sınıf kitaplığı dışından (evden veya halk kütüphanesinden) kitap okuyan öğrencilere de topluca okuma puanı verebilirsiniz.</li>
            </ul>
          </div>

          <div>
            <strong>4. Barkod / Kitap Etiketi Yazdırma ve Boş Etiket Atlama:</strong>
            <p>Kitaplarınıza düzenli numara/barkod etiketi yapıştırmak için <strong>Barkod Yazdır</strong> aracını kullanın. <strong>Boş Etiket Atlama</strong> kutusuna daha önce soyup kullandığınız etiket sayısını (örneğin 5) yazarsanız sistem ilk 5 yuvayı boş bırakıp 6. yuvadan basar; böylece yarım kalmış A4 yapışkanlı etiket sayfaları ziyan olmaz.</p>
          </div>
        </div>

        <div class="manual-callout manual-callout-tip">
          <strong>💡 Etiket Yazdırma İpucu:</strong> Yapışkanlı etiket sayfası basarken yazdırma penceresinde <strong>"Kenar Boşlukları: Yok"</strong> ve <strong>"Arka Plan Grafikleri: Açık"</strong> seçeneklerini işaretleyin.
        </div>
      `,
      mobileHtml: `
        El terminalindeki <strong>Kitap Takibi</strong> ekranından teneffüste veya kitaplık köşesinde bilgisayar başına geçmeden öğrencilere <strong>Kitap Ödünç Ver</strong>ebilir, getirilen kitapları <strong>İade Al</strong>abilir ve geciken kitapları anında görebilirsiniz. Tüm işlemler masaüstü kitaplığı ve öğrenci puanlarıyla eşzamanlı güncellenir.
      `
    },

    /* =========================================================================
       8. YAPAY ZEKA (AI) AYARLARI VE AKILLI ÜRETİCİLER
       ========================================================================= */
    {
      id: 'ai-features',
      title: '✨ Yapay Zeka (AI) Ayarları ve Akıllı Üreticiler',
      subtitle: 'API anahtarı oluşturma, ücretsiz/ücretli hesap farkları ve uygulamadaki tüm AI destekli araçların listesi.',
      icon: 'sparkles',
      badge: { text: 'YENİ', type: 'new' },
      categories: ['ai', 'start'],
      path: 'Asistan Konfigürasyonu → Yapay Zeka (AI)',
      keywords: 'yapay zeka ai gemini api anahtarı kurulum ücretsiz free hesap sınırlama kota otomatik öğrenci ekleme ödev robotu rubrik üretici soru üretici quiz',
      bodyHtml: `
        <p>Sınıf Asistanı, öğretmenlerin hazırlık süresini dakikalardan saniyelere indirmek için doğrudan entegre edilmiş yapay zeka modülleri içerir. Tüm yapay zeka araçları tek bir API anahtarıyla çalışır.</p>

        <div class="manual-subsections">
          <div>
            <strong>1. API Anahtarı Nasıl Oluşturulur ve Tanımlanır?</strong>
            <ol class="manual-step-list">
              <li><code>Asistan Konfigürasyonu → Yapay Zeka (AI)</code> sekmesini açın.</li>
              <li>Ekrandaki yönlendirme bağlantısından kendi API anahtarınızı oluşturup kopyalayın.</li>
              <li>Anahtarı ilgili kutuya yapıştırın, <strong>Kaydet</strong> butonuna basın ve <strong>Bağlantıyı Test Et</strong> ile çalıştığını doğrulayın.</li>
            </ol>
          </div>

          <div>
            <strong>2. Yapay Zekanın Çalıştığı 4 Ana Modül:</strong>
            <ul>
              <li><strong>Otomatik Öğrenci Ekleme</strong> (<code>Öğrenci Yönetimi</code>): e-Okul PDF veya fotoğrafından tüm sınıf listesini otomatik çıkarır.</li>
              <li><strong>Ödev Hazırlama Robotu</strong> (<code>Araçlar → Ödev Hazırlama Robotu</code>): Yıllık plan kazanımlarına göre A4 etkinlik, çalışma kağıdı ve cevap anahtarı üretir.</li>
              <li><strong>Dereceli Puanlama Anahtarı / Rubrik</strong> (<code>Araçlar → Rubrik</code>): Konu veya etkinlik adına göre Maarif Modeli uyumlu analitik rubrik ölçütleri ve düzey açıklamaları hazırlar.</li>
              <li><strong>Bilgi Yarışması Soru Üretici</strong> (<code>Eğitsel Oyunlar → Bilgi Yarışması → Soru Havuzu</code>): Seçtiğiniz sınıf, ders ve konuya özel çoktan seçmeli yarışma soruları üretip havuza ekler.</li>
            </ul>
          </div>
        </div>

        <div class="manual-callout manual-callout-warn">
          <strong>⚠️ Dikkat (Ücretsiz / Free Hesap Sınırlamaları):</strong> Premium (ücretli) olmayan ücretsiz bir hesap üzerinden oluşturulan API anahtarı girildiğinde; günlük veya dakikalık istek kotası, yoğun saatlerde geçici hız sınırı ya da büyük dosya/PDF analizlerinde kısıtlamalarla karşılaşabilirsiniz. Limit uyarısı alırsanız bir süre bekleyip tekrar deneyebilir veya kesintisiz kullanım için ücretli (faturalandırılmış) bir API hesabı kullanabilirsiniz.
        </div>

        <div class="manual-callout manual-callout-tip">
          <strong>🔒 Gizlilik Notu:</strong> API anahtarınız yalnızca kendi cihazınızda yerel olarak saklanır ve sadece sizin başlattığınız yapay zeka işlemlerinde kullanılır.
        </div>
      `
    },

    /* =========================================================================
       9. PLANLAMA SİSTEMİ (GÜNLÜK, HAFTALIK VE YILLIK PLAN)
       ========================================================================= */
    {
      id: 'planning-schedule',
      title: '🗂️ Planlama Sistemi (Günlük, Haftalık ve Yıllık Plan)',
      subtitle: 'MEB müfredat kazanımlarıyla yıllık plan takibi, haftalık ders programı, zil saatleri ve günlük ders akışı.',
      icon: 'calendar-range',
      badge: { text: 'YENİ', type: 'new' },
      categories: ['assessment', 'tools', 'mobile'],
      path: 'Araçlar → Planlama',
      keywords: 'planlama yıllık plan günlük plan haftalık ders programı ders saati teneffüs sayacı meb müfredat kazanım zil saati',
      bodyHtml: `
        <p>Yıllık plan, haftalık ders programı ve günlük ders akışınızı birbirine bağlı tek bir planlama merkezinde yönetebilirsiniz.</p>

        <div class="manual-subsections">
          <div>
            <strong>1. Yıllık Plan (MEB Müfredat ve Kazanım Takibi):</strong>
            <p><code>Araçlar → Planlama → Yıllık Plan</code> sekmesinde sınıf düzeyinize ve dersinize ait hazır MEB müfredat kazanımlarını yükleyebilir veya kendi yıllık planınızı içeri aktarabilirsiniz. Her hafta işlediğiniz kazanımları işaretleyerek müfredat ilerlemenizi takip edin. <em>Buradaki kazanımlar doğrudan AI Ödev Hazırlama Robotu tarafından da kullanılabilir.</em></p>
          </div>

          <div>
            <strong>2. Haftalık Ders Programı ve Saat Ayarları:</strong>
            <ol class="manual-step-list">
              <li><code>Haftalık Plan</code> sekmesinde önce <strong>Saat Ayarları</strong> alt sekmesinden 1. ders başlangıç saatini, ders süresini ve teneffüs aralıklarını tanımlayın.</li>
              <li><strong>Dersleri Tanımla</strong> alt sekmesinden Pazartesi–Cuma ders programınızı yerleştirin (Ortaokul modunda hangi saatte hangi şubeye girdiğinizi seçebilirsiniz).</li>
              <li>Kaydettiğinizde Gösterge Panelinde o günkü dersler, mevcut ders ve teneffüse kalan süre canlı olarak görünür.</li>
            </ol>
          </div>

          <div>
            <strong>3. Günlük Plan:</strong>
            <p><code>Günlük Plan</code> sekmesinde o güne ait ders notlarını, işlenecek etkinlikleri, kullanılacak materyalleri ve hatırlatmaları kaydederek gün içi akışınızı düzenli tutabilirsiniz.</p>
          </div>
        </div>

        <div class="manual-callout manual-callout-info">
          <strong>📌 Bilgi Notu:</strong> Ders ve teneffüs saatlerini bir kez tanımladığınızda hem masaüstü gösterge paneli hem de el terminalindeki canlı ders/teneffüs sayacı otomatik olarak çalışır.
        </div>
      `,
      mobileHtml: `
        El terminalindeki <strong>Ders Programı &amp; Plan</strong> kartını açtığınızda o an hangi derste olduğunuzu, teneffüse kaç dakika kaldığını, sıradaki dersi/şubeyi ve o haftanın yıllık plan kazanımlarını telefonunuzdan canlı olarak takip edebilirsiniz.
      `
    },

    /* =========================================================================
       10. ÖLÇME, ÖDÜLLENDİRME VE SINIF YARDIMCI ARAÇLARI
       ========================================================================= */
    {
      id: 'teacher-tools',
      title: '🛠️ Ölçme, Ödüllendirme ve Sınıf Yardımcı Araçları',
      subtitle: 'Maarif Modeli Rubrik, Başarı Belgesi/Sertifika, Yazılı Sınav, Oturma Planı, Nöbet, Katkı, Evrak, Çarkıfelek ve Sayaç.',
      icon: 'wrench',
      badge: { text: 'GÜNCELLENDİ', type: 'updated' },
      categories: ['tools', 'assessment', 'ai'],
      path: 'Araçlar',
      keywords: 'dereceli puanlama anahtarı rubrik maarif modeli başarı belgesi sertifika ayın öğrencisi yazılı sınav hazırlama analizi oturma planı nöbet listesi katkı tedarik evrak deposu çarkıfelek kronometre',
      bodyHtml: `
        <p><code>Araçlar</code> sekmesi, öğretmenin sınıf yönetimi, ölçme-değerlendirme ve idari iş yükünü ciddi ölçüde hafifleten kapsamlı bir araç kutusudur:</p>

        <div class="manual-subsections">
          <div>
            <strong>1. Dereceli Puanlama Anahtarı (Maarif Modeli Rubrik):</strong>
            <p>MEB süreç odaklı ölçme yaklaşımına uygun analitik rubrikler oluşturun. Ölçütleri elle yazabilir veya <strong>Yapay Zeka ile Üret</strong> diyerek konuya uygun kriter ve düzey açıklamalarını (Geliştirilmeli / Orta / İyi / Çok İyi) saniyeler içinde hazırlatabilirsiniz. Ardından öğrencileri doğrudan ekrandan canlı puanlayın veya A4 ölçek çıktısı alın.</p>
          </div>

          <div>
            <strong>2. Başarı Belgesi &amp; Sertifika Üretici:</strong>
            <p>İlkokul ve Ortaokul kademelerine uygun hazır tasarımlarla (<em>Ayın Öğrencisi, Kitap Kurdu, Örnek Davranış, Akademik Başarı</em> vb.) tek bir öğrenciye özel veya tüm sınıfa toplu belgeler hazırlayın. Öğrenci adı, sınıfı, tarih ve öğretmen/müdür imza alanları otomatik yerleşir; tek tıkla A4 PDF yazdırabilirsiniz.</p>
          </div>

          <div>
            <strong>3. Yazılı Sınav Hazırlama &amp; Yazılı Sınav Analizi (Ortaokul):</strong>
            <ul>
              <li><strong>Yazılı Sınav Hazırlama:</strong> Soruları görsel (ekran görüntüsü/PNG/JPG) olarak yükleyin, cevap boşluklarını ayarlayın ve düzenli A4 yazılı sınav kağıdı oluşturun.</li>
              <li><strong>Yazılı Sınav Analizi:</strong> Soru sayısını, puan ağırlıklarını ve kazanımları girin; öğrenci puanlarını işlediğinizde sınıf ortalaması, kazanım bazlı başarı grafiği ve MEB A4 standartlarında resmi analiz raporu otomatik çıkar.</li>
            </ul>
          </div>

          <div>
            <strong>4. Sınıf Oturma Planı:</strong>
            <p>Sınıfınızdaki sıra sütun ve satır sayısını belirleyip öğrencileri sürükle-bırak veya hızlı seçimle masalara yerleştirin. Oturma planını A4 olarak yazdırıp sınıf panosuna asabilirsiniz.</p>
          </div>

          <div>
            <strong>5. Fotoğraflı Sınıf Nöbet Listesi:</strong>
            <p>Başlangıç-bitiş tarihlerini, günlük nöbetçi sayısını ve tatil/idari izinli günleri girin; hafta sonlarını otomatik atlayarak alfabetik, rastgele veya liste sırasına göre adil nöbet dağıtımı yapıp fotoğraflı A4 çıktı alın.</p>
          </div>

          <div>
            <strong>6. Sınıf Katkı &amp; Tedarik Takibi ve Kişisel Evrak Deposu:</strong>
            <ul>
              <li><strong>Katkı &amp; Tedarik Takibi:</strong> Gezi, etkinlik, fotokopi/A4 kağıdı veya sınıf ihtiyaç malzemelerinin kimden teslim alındığını ve eksik kalanları tek listeden takip edin.</li>
              <li><strong>Kişisel Evrak Deposu:</strong> Zümre tutanakları, veli toplantı belgeleri ve önemli dokümanlarınızı kategorize ederek saklayın.</li>
            </ul>
          </div>

          <div>
            <strong>7. Hızlı Söz Hakkı (Çarkıfelek) ve Kronometre / Sayaç:</strong>
            <p>Üst menüden her ekranda ulaşılabilen <strong>Çarkıfelek</strong> ile derste adil ve eğlenceli söz hakkı verin; sınav veya etkinliklerde tam ekran <strong>Kronometre / Geri Sayım</strong> aracıyla süre tutun.</p>
          </div>
        </div>

        <div class="manual-callout manual-callout-info">
          <strong>📌 Bilgi Notu:</strong> Masaüstünde oluşturduğunuz <strong>Sınıf Oturma Planı</strong>, el terminalindeki <em>Ödev Takibi → Sıralama</em> menüsüne otomatik aktarılır. Ayrıca <strong>Çarkıfelek</strong>, yoklamada gelmeyen öğrencileri otomatik olarak hariç tutar.
        </div>
      `,
      mobileHtml: `
        El terminalinin ana ekranından tek dokunuşla <strong>Rastgele Söz Hakkı (Kura)</strong> aracını çalıştırabilirsiniz. Masaüstünde hazırladığınız <strong>Sınıf Oturma Planı</strong> da bulut üzerinden el terminaline aktarılır ve ödev kontrolünde öğrencileri masa sırasına göre dizmenizi sağlar.
      `
    },

    /* =========================================================================
       11. EĞİTSEL OYUNLAR
       ========================================================================= */
    {
      id: 'educational-games',
      title: '🎮 Eğitsel Oyunlar',
      subtitle: 'Bilgi Yarışması (manuel + AI soru havuzu), Çarpım Tablosu Kahramanı ve Hazine Avı oyunlarının detaylı kullanımı.',
      icon: 'gamepad-2',
      categories: ['tools', 'ai'],
      path: 'Eğitsel Oyunlar',
      keywords: 'eğitsel oyun bilgi yarışması quiz yapay zeka soru havuzu çarpım tablosu kahramanı hazine avı sandık açma skor tablosu yoklama gelmeyen öğrenci',
      bodyHtml: `
        <p>Ders tekrarlarını, pekiştirme çalışmalarını ve serbest etkinlik saatlerini akıllı tahtada keyifli yarışmalara dönüştüren 3 entegre oyun bulunur. Oyunlarda kazanılan puanlar istenirse doğrudan sınıf puan tablosuna yansıtılır.</p>

        <div class="manual-subsections">
          <div>
            <strong>1. Sınıf İçi Bilgi Yarışması (Quiz):</strong>
            <ol class="manual-step-list">
              <li><code>Soru Havuzu</code> sekmesinden sorularınızı tek tek ekleyebilir, dosyadan yükleyebilir veya <strong>Yapay Zeka ile Soru Üret</strong> seçeneğiyle istediğiniz ders ve konudan anında çoktan seçmeli sorular oluşturabilirsiniz.</li>
              <li><code>Yarışma Ayarları</code>ndan soru süresini, kategori ve ölçme biçimini seçin.</li>
              <li><code>Yarışma Alanı</code>nda yarışmayı başlatın; öğrenciler tahtada soruyu çözdükçe doğru/yanlış kayıtları tutulur ve sonuçlar <code>Skor Tablosu</code>na işlenir.</li>
            </ol>
          </div>

          <div>
            <strong>2. Çarpım Tablosu Kahramanı:</strong>
            <p>Hangi çarpım gruplarının (örneğin sadece 6'lar, 7'ler veya 1–10 karışık) sorulacağını ve süreyi seçin. Öğrenciler süre dolmadan en fazla doğru cevabı vermeye çalışır; hızlı doğru cevaplarda ekstra hız bonusu kazanılır ve rekorlar <code>Skor Tablosu</code>nda saklanır.</p>
          </div>

          <div>
            <strong>3. Hazine Avı (Treasure Hunt):</strong>
            <p>Kilitli sandıkların ardındaki soruları çözerek ödül puanları toplamaya dayalı sınıf oyunudur. <code>Soru Kütüphanesi</code>nden kendi sorularınızı ekleyebilir, <strong>Tam Ekran</strong> moduyla soruyu ve geri sayım süresini tüm sınıfın rahatça görebileceği şekilde akıllı tahtaya yansıtabilirsiniz.</p>
          </div>
        </div>

        <div class="manual-callout manual-callout-info">
          <strong>📌 Bilgi Notu (Yoklama Entegrasyonu):</strong> Oyunlarda öğrenciler çağırılırken varsayılan olarak tüm sınıf listeye dahil edilir. Ancak o gün <strong>yoklamada gelmeyen öğrenciler işaretlenirse, gelmeyen öğrenciler otomatik olarak oyuna dahil edilmez</strong>.
        </div>
      `
    },

    /* =========================================================================
       12. NOT DEFTERLERİ VE GÖREV YÖNETİCİSİ
       ========================================================================= */
    {
      id: 'notebooks-tasks',
      title: '📓 Not Defterleri ve Görev Yöneticisi',
      subtitle: 'Kategorize zengin metin not defterleri (veli görüşmeleri, kurul kararları) ve öğretmen yapılacaklar listesi.',
      icon: 'notebook-pen',
      categories: ['tools'],
      path: 'Not Defterleri · Görevler',
      keywords: 'not defteri rich notepad veli görüşmesi kurul kararı zümre görev yöneticisi todo aktif görevler tamamlanan görevler',
      bodyHtml: `
        <p>Sınıf ve okul işlerindeki yazılı notlarınızı dağınık kağıtlar yerine düzenli ve aranabilir dijital defterlerde saklayın.</p>

        <div class="manual-subsections">
          <div>
            <strong>1. Kişisel Not Defterleri:</strong>
            <p>Sol menüden <code>Not Defterleri</code> sekmesini açarak <em>Veli Görüşmeleri, Öğretmenler Kurulu, Zümre Kararları, Ders Notları</em> gibi ayrı defterler oluşturabilirsiniz. Zengin metin düzenleyici sayesinde kalın/italik yazı, madde işaretleri ve başlıklarla düzenli kayıt tutabilir, notlarınızı anında arayabilirsiniz.</p>
          </div>

          <div>
            <strong>2. Görev Yöneticisi (Yapılacaklar Listesi):</strong>
            <p><code>Görevler</code> sekmesinde idari ve pedagojik işlerinizi (e-Okul not girişi, tutanak teslimi, veli araması, fotokopi hazırlığı vb.) tarih ve öncelik belirterek ekleyin. İşinizi bitirdiğinizde işaretleyerek <strong>Tamamlanan Görevler</strong> arşivine taşıyın; böylece <strong>Aktif Görevler</strong> listesi her zaman sade kalır.</p>
          </div>
        </div>
      `
    },

    /* =========================================================================
       13. RAPORLAR, VELİ KARNELERİ VE WHATSAPP BÜLTENİ
       ========================================================================= */
    {
      id: 'reports-whatsapp',
      title: '📈 Raporlar, Veli Karneleri ve WhatsApp Bülteni',
      subtitle: 'Çok boyutlu öğrenci karneleri, Excel/PDF dışa aktarım ve masaüstü/mobilden tek tıkla WhatsApp veli paylaşımı.',
      icon: 'trending-up',
      badge: { text: 'GÜNCELLENDİ', type: 'updated' },
      categories: ['tools', 'mobile'],
      path: 'Raporlar',
      keywords: 'raporlar karne veli bilgilendirme whatsapp bülteni excel pdf çıktı öğrenci başarı durumu grafik yazdırma',
      bodyHtml: `
        <p>Sınıf Asistanı'nda biriken tüm davranış, ödev, kitap okuma ve sınav verilerini tek tıkla profesyonel raporlara ve veli karnelerine dönüştürebilirsiniz.</p>

        <div class="manual-subsections">
          <div>
            <strong>1. Çok Boyutlu Öğrenci Karneleri:</strong>
            <p><code>Raporlar</code> sekmesinden haftalık, aylık veya dönemlik bazda her öğrenci için <em>toplam puan, davranış özeti, ödev teslim oranı, okuduğu kitap/sayfa sayısı ve sınav performansı</em> bilgilerini birleştiren görsel karneler oluşturabilirsiniz.</p>
          </div>

          <div>
            <strong>2. Excel (.xlsx) ve A4 PDF Dışa Aktarma:</strong>
            <p>Sınıf puan listelerini, ödev çizelgelerini, kitap envanterini ve öğrenci kayıtlarını <strong>Excel (.xlsx)</strong> formatında bilgisayarınıza indirebilirsiniz. Veli karnelerini ve analiz tablolarını ise doğrudan yazdırılabilir <strong>A4 PDF</strong> formatına çevirip çıktı alabilirsiniz.</p>
          </div>

          <div>
            <strong>3. Hazır Veli Bilgilendirme Metinleri:</strong>
            <p>Her öğrencinin güçlü yönlerini ve geliştirmesi gereken alanları özetleyen kibar ve düzenli veli bilgilendirme mesajı tek tıkla üretilir; kopyalayıp veliye gönderebilirsiniz.</p>
          </div>
        </div>

        <div class="manual-callout manual-callout-tip">
          <strong>💡 Yazdırma İpucu:</strong> A4 PDF karne, belge ve analiz raporlarını yazdırırken tarayıcı yazdırma penceresinde <strong>"Arka Plan Grafikleri: Açık"</strong> seçeneğini işaretlemeniz renkli kartların ve grafiklerin eksiksiz çıkmasını sağlar.
        </div>
      `,
      mobileHtml: `
        El terminalindeki <strong>Raporlar &amp; Veli Bülteni</strong> ekranı veli iletişimini saniyelere indirir:<br>
        Üstteki 3 sekmeden <strong>Günlük</strong>, <strong>Haftalık</strong> veya <strong>Öğrenci Bazlı</strong> raporu seçin. Sistem o güne/haftaya ait ödev, yoklama, puan ve okuma özetini otomatik oluşturur. Metni önizleme kutusunda isterseniz düzenleyip <strong>WhatsApp'ta Paylaş</strong> butonuyla doğrudan sınıf veli grubuna veya ilgili veliye gönderebilirsiniz.
      `
    },

    /* =========================================================================
       14. UYGULAMA KİLİDİ, YEDEKLEME VE LİSANS YÖNETİMİ
       ========================================================================= */
    {
      id: 'security-backup-license',
      title: '🔒 Uygulama Kilidi, Yedekleme ve Lisans Yönetimi',
      subtitle: 'Öğretmen şifresi, teneffüs kilidi, mobilden uzaktan kilitleme, yerel disk güvenliği, JSON yedek ve lisans.',
      icon: 'shield',
      badge: { text: 'GÜNCELLENDİ', type: 'updated' },
      categories: ['security', 'mobile', 'start'],
      path: 'Asistan Konfigürasyonu → Şifre Kontrolü / Genel Ayarlar',
      keywords: 'uygulama kilidi şifre kontrolü öğretmen şifresi teneffüs kilidi uzaktan kilitleme yedekleme json geri yükleme lisans anahtarı sıfırlama tema yerel disk',
      bodyHtml: `
        <p>Akıllı tahtada sınıf içi güvenliği sağlamak, verilerinizi olası bilgisayar arızalarına karşı korumak ve lisansınızı yönetmek için aşağıdaki araçları kullanabilirsiniz:</p>

        <div class="manual-subsections">
          <div>
            <strong>1. Şifre Kontrolü (Uygulama Kilidi):</strong>
            <ol class="manual-step-list">
              <li><code>Asistan Konfigürasyonu → Şifre Kontrolü</code> sekmesini açıp kendinize bir <strong>Öğretmen Şifresi</strong> belirleyin.</li>
              <li><strong>Teneffüste Otomatik Kilitle</strong> seçeneğini açarsanız ders programınızdaki teneffüs saatlerinde ekran otomatik kilitlenir; öğrenciler puan veya ayarlara erişemez.</li>
              <li>Şifrenizi unutmanız durumunda kilit ekranındaki <strong>Şifremi Unuttum</strong> kurtarma akışını kullanabilirsiniz.</li>
            </ol>
          </div>

          <div>
            <strong>2. Yerel Depolama ve JSON Yedekleme / Geri Yükleme:</strong>
            <p>Masaüstü uygulaması tüm verilerinizi ve öğrenci fotoğraflarınızı boyut sınırına takılmadan doğrudan bilgisayarınızın yerel diskinde saklar. Buna ek olarak bilgisayar değişimi veya format durumlarına karşı düzenli aralıklarla <code>Genel Ayarlar → Yedek Al (JSON)</code> butonuyla yedeğinizi USB/bulut sürücünüze kaydetmeniz önerilir. <strong>Yedek Yükle</strong> ile tüm sınıf verileriniz tek tıkla geri yüklenir.</p>
          </div>

          <div>
            <strong>3. Lisans Yönetimi ve Sistemi Sıfırlama:</strong>
            <ul>
              <li><strong>Lisans Taşıma:</strong> Başka bir bilgisayara geçerken önce eski bilgisayarda <strong>Lisansı Kaldır</strong> butonuna basıp lisansı boşa çıkarın, ardından yeni bilgisayarda aktifleştirin.</li>
              <li><strong>Sistemi Sıfırla:</strong> Yeni bir eğitim-öğretim yılına temiz başlangıç yaparken tüm öğrenci, puan, ödev ve kitap kayıtlarını fabrika ayarlarına döndürür.</li>
            </ul>
          </div>
        </div>

        <div class="manual-callout manual-callout-warn">
          <strong>⚠️ Dikkat:</strong> <strong>Sistemi Sıfırla</strong> işlemi tüm öğrenci, puan, ödev ve kitap kayıtlarını geri döndürülemez şekilde siler. Bu işlemi yapmadan önce mutlaka <strong>Yedek Al (JSON)</strong> butonuyla yedeğinizi bilgisayarınıza kaydedin.
        </div>
      `,
      mobileHtml: `
        El terminalinin üst çubuğundaki <strong>🔒 Akıllı Tahtayı Kilitle / Aç</strong> butonuna dokunarak sınıftan çıktığınızda veya teneffüste akıllı tahtadaki uygulamayı telefonunuzdan <strong>uzaktan anında kilitleyebilir</strong>, sınıfa döndüğünüzde yine telefonunuzdan tek dokunuşla kilidi açabilirsiniz.
      `
    }
  ];

  let activeCategory = 'all';
  let searchQuery = '';
  let allExpanded = false;

  function renderCategoryChips() {
    const container = document.getElementById('manual-category-chips');
    if (!container) return;

    container.innerHTML = MANUAL_CATEGORIES.map((cat) => {
      const isActive = cat.id === activeCategory;
      return `
        <button type="button" class="manual-cat-chip ${isActive ? 'active' : ''}" data-manual-cat="${cat.id}">
          <i data-lucide="${cat.icon}" style="width: 14px; height: 14px;"></i>
          <span>${cat.label}</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.manual-cat-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-manual-cat') || 'all';
        renderCategoryChips();
        renderManualItems();
      });
    });
  }

  function buildBadgeHtml(badge) {
    if (!badge) return '';
    return `<span class="manual-badge manual-badge-${badge.type}">${badge.text}</span>`;
  }

  function buildMobileBoxHtml(mobileHtml) {
    if (!mobileHtml) return '';
    return `
      <div class="manual-mobile-box">
        <div class="manual-mobile-box-title">
          <i data-lucide="smartphone" style="width: 16px; height: 16px;"></i>
          <span>📱 El Terminalinde (Mobil) Eşdeğeri</span>
        </div>
        <p>${mobileHtml.trim()}</p>
      </div>
    `;
  }

  function matchesFilter(item) {
    const catOk = activeCategory === 'all' || (item.categories && item.categories.includes(activeCategory));
    if (!catOk) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const haystack = [
      item.title,
      item.subtitle,
      item.path || '',
      item.keywords || '',
      item.bodyHtml.replace(/<[^>]+>/g, ' '),
      (item.mobileHtml || '').replace(/<[^>]+>/g, ' ')
    ].join(' ').toLowerCase();
    return haystack.includes(q);
  }

  function setItemOpenState(itemEl, open) {
    const body = itemEl.querySelector('.manual-body');
    const arrow = itemEl.querySelector('.accordion-arrow');
    if (!body) return;
    if (open) {
      itemEl.classList.add('open');
      body.style.maxHeight = 'none';
      body.style.borderTopWidth = '1px';
      if (arrow) arrow.style.transform = 'rotate(180deg)';
    } else {
      itemEl.classList.remove('open');
      body.style.maxHeight = '0px';
      body.style.borderTopWidth = '0px';
      if (arrow) arrow.style.transform = 'rotate(0deg)';
    }
  }

  function renderManualItems() {
    const container = document.getElementById('manual-accordion-container');
    const countEl = document.getElementById('manual-result-count');
    if (!container) return;

    const filtered = MANUAL_ITEMS.filter(matchesFilter);

    if (countEl) {
      countEl.textContent = `${filtered.length} / ${MANUAL_ITEMS.length} konu`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="padding: 2rem; text-align: center; color: var(--text-muted);">
          <i data-lucide="search-x" style="width: 32px; height: 32px; margin-bottom: 0.5rem; opacity: 0.6;"></i>
          <p style="margin: 0; font-weight: 600; color: var(--text-primary);">Aramanızla eşleşen kılavuz başlığı bulunamadı.</p>
          <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem;">Farklı bir anahtar kelime deneyin veya kategori filtresini "Tümü" olarak seçin.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = filtered.map((item) => {
      const hasMobile = Boolean(item.mobileHtml);
      return `
        <div class="manual-item glass-card" data-manual-id="${item.id}">
          <div class="manual-header" onclick="window.toggleManualAccordion(this)">
            <div class="manual-header-left">
              <div class="manual-icon-box">
                <i data-lucide="${item.icon}" style="width: 18px; height: 18px;"></i>
              </div>
              <div class="manual-title-wrap">
                <div class="manual-title-row">
                  <h4>${item.title}</h4>
                  ${buildBadgeHtml(item.badge)}
                  ${hasMobile ? '<span class="manual-mobile-pill" title="Bu özelliğin El Terminalinde (Mobil) eşdeğeri vardır">📱 Mobil Destekli</span>' : ''}
                </div>
                <p>${item.subtitle}</p>
              </div>
            </div>
            <i data-lucide="chevron-down" class="accordion-arrow" style="width: 18px; height: 18px; color: var(--text-muted); transition: transform 0.25s ease; flex-shrink: 0;"></i>
          </div>
          <div class="manual-body">
            <div class="manual-body-inner">
              ${item.path ? `<div class="manual-path-bar"><i data-lucide="map-pin" style="width: 14px; height: 14px;"></i><span><strong>Nereden Açılır?</strong> ${item.path}</span></div>` : ''}
              ${item.bodyHtml}
              ${buildMobileBoxHtml(item.mobileHtml)}
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    requestAnimationFrame(() => {
      container.querySelectorAll('.manual-item').forEach((el) => {
        const id = el.getAttribute('data-manual-id');
        const itemObj = MANUAL_ITEMS.find((x) => x.id === id);
        const shouldOpen = allExpanded || searchQuery.length > 0 || (activeCategory === 'all' && itemObj && itemObj.defaultOpen);
        setItemOpenState(el, Boolean(shouldOpen));
      });
    });
  }

  window.toggleManualAccordion = function (header) {
    const item = header.closest('.manual-item');
    if (!item) return;
    const isOpen = item.classList.contains('open');
    setItemOpenState(item, !isOpen);
  };

  window.toggleAllManualAccordions = function () {
    allExpanded = !allExpanded;
    const btn = document.getElementById('manual-toggle-all-btn');
    if (btn) {
      btn.innerHTML = allExpanded
        ? '<i data-lucide="minimize-2" style="width: 14px; height: 14px;"></i> <span>Tümünü Kapat</span>'
        : '<i data-lucide="maximize-2" style="width: 14px; height: 14px;"></i> <span>Tümünü Aç</span>';
      if (window.lucide) window.lucide.createIcons();
    }
    document.querySelectorAll('#manual-accordion-container .manual-item').forEach((el) => {
      setItemOpenState(el, allExpanded);
    });
  };

  function initManual() {
    const container = document.getElementById('manual-accordion-container');
    if (!container) return;

    renderCategoryChips();
    renderManualItems();

    const searchInput = document.getElementById('manual-search-input');
    if (searchInput && !searchInput.dataset.manualBound) {
      searchInput.dataset.manualBound = 'true';
      searchInput.addEventListener('input', (e) => {
        searchQuery = (e.target.value || '').trim();
        renderManualItems();
      });
    }

    const manualTabBtn = document.getElementById('tab-btn-config-manual');
    if (manualTabBtn && !manualTabBtn.dataset.manualBound) {
      manualTabBtn.dataset.manualBound = 'true';
      manualTabBtn.addEventListener('click', () => {
        setTimeout(() => {
          document.querySelectorAll('#manual-accordion-container .manual-item.open').forEach((el) => {
            setItemOpenState(el, true);
          });
        }, 60);
      });
    }
  }

  window.ManualModule = {
    init: initManual,
    refresh: renderManualItems
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initManual);
  } else {
    initManual();
  }
})();
