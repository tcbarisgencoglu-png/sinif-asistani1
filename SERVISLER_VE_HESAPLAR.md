# Sınıf Asistanı — Servisler, Hesaplar ve Altyapı Rehberi (SERVISLER_VE_HESAPLAR.md)

Bu doküman, Sınıf Asistanı uygulamasının kullandığı tüm harici bulut servisleri, veritabanı altyapısı, e-posta sistemleri ve hesap bilgilerini içermektedir. Antigravity ve proje geliştiricileri bu dosyayı referans alarak sistemleri yönetebilir.

---

## 1. Supabase Bulut Veritabanı (Canlı Senkronizasyon & Lisans)

Sınıf Asistanı, akıllı tahta (masaüstü) ile el terminali (mobil) arasındaki çift yönlü canlı senkronizasyon ve tek cihaz lisans denetimi için **Supabase (PostgreSQL + PostgREST + Realtime WebSocket)** altyapısını kullanır.

### Mevcut Bağlantı Dosyası
* **Yapılandırma Dosyası:** [`js/supabase-config.js`](file:///Users/tunc/Desktop/sınıf%20asistanı/js/supabase-config.js)
* **Senkronizasyon Motoru:** [`js/cloud-sync.js`](file:///Users/tunc/Desktop/sınıf%20asistanı/js/cloud-sync.js)
* **Lisans Motoru:** [`js/license-config.js`](file:///Users/tunc/Desktop/sınıf%20asistanı/js/license-config.js)

### Aktif Proje Bilgileri (Yeni)
* **Supabase URL:** `https://gjmxfjavxvguyygbhkdi.supabase.co`
* **Anon Public Key:** `sb_publishable_t69DnPs8cTxcM919qhwCvw_dSxKB68z`
* **Durum:** Aktif / Healthy (5 GB taze kota)

### Önceki Proje Bilgileri (Arşiv / Kotası Dolan)
* **Supabase URL:** `https://qcxpslujddythbpkaupn.supabase.co`
* **Anon Public Key:** `sb_publishable_imv0QQkNvBDzVlLY2Gogrw_NWkbAWAR`
* **Durum:** 20 Ekim - 20 Kasım 2026 döneminde 49 GB egress aşımı nedeniyle 402 kısıtlı.

---

### Supabase Tablo Yapıları ve SQL Şeması (Yeni Proje Kurulumu İçin)

Yeni bir Supabase projesi açıldığında **SQL Editor** sekmesinde aşağıdaki kodun bir kez çalıştırılması yeterlidir:

```sql
-- ============================================================================
-- 1. CANLI SENKRONİZASYON TABLOSU (teacher_sync)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.teacher_sync (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sync_code TEXT NOT NULL,
    exam_id TEXT NOT NULL,
    exam_name TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hızlı filtreleme ve sorgu performansı için indeksler
CREATE INDEX IF NOT EXISTS idx_teacher_sync_lookup 
ON public.teacher_sync (sync_code, exam_id, updated_at DESC);

-- ============================================================================
-- 2. LİSANS VE CİHAZ KİLİDİ TABLOSU (licenses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.licenses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    license_key TEXT,
    licensee_name TEXT,
    device_id TEXT,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TEXT
);

CREATE INDEX IF NOT EXISTS idx_licenses_key 
ON public.licenses (license_key);

-- ============================================================================
-- 3. GÜVENLİK VE RLS POLİTİKALARI (Anonim İstemci Erişimi)
-- ============================================================================
ALTER TABLE public.teacher_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on teacher_sync" 
ON public.teacher_sync FOR ALL TO anon 
USING (true) WITH CHECK (true);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on licenses" 
ON public.licenses FOR ALL TO anon 
USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. REALTIME (ANLIK WEBSOCKET) YAYINI
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_sync;
```

---

### Kota Koruma Kuralları (Egress Tasarrufu)
* **150 Byte Meta Sorgusu:** Tahta ve terminal arka planda asla `select=*` sorgusu atmaz. Yalnızca `select=exam_id,updated_at` (~150 Byte) kontrol edilir.
* **Fotoğraf Ayrımı (`STUDENT_PHOTOS`):** Ağır öğrenci fotoğrafları ana veri akışına (`MASTER_STATE`) sokulmaz; sadece eksik fotoğrafı olan yeni cihazlarda tek seferlik çekilir.
* **Kota Kalkanı:** HTTP 402 veya 429 yanıtı alındığında sorgular otomatik olarak en az 5 dakika duraklatılır (`_quotaErrorUntil`).
* **Keep-Alive (Uyku Engelleme):** Supabase ücretsiz projelerinin 7 gün sonra duraklatılmasını önlemek için GitHub Actions içinde [`.github/workflows/keep_alive.yml`](file:///Users/tunc/Desktop/sınıf%20asistanı/.github/workflows/keep_alive.yml) zamanlayıcısı mevcuttur (her 3 günde bir otomatik ping atar).

---

## 2. Brevo (Sendinblue) E-Posta Servisi (Demo Lisans Gönderimi)

Öğretmenler uygulama içinden veya web sitesinden 30 günlük ücretsiz deneme lisansı talep ettiklerinde e-posta gönderimi için Brevo SMTP API'si kullanılır.

* **Sağlayıcı:** Brevo ([brevo.com](https://brevo.com))
* **Yapılandırma Dosyası:** [`js/supabase-config.js`](file:///Users/tunc/Desktop/sınıf%20asistanı/js/supabase-config.js) (`window.BrevoConfig`)
* **API Uç Noktası:** `https://api.brevo.com/v3/smtp/email`
* **Gönderici Adresi:** `sinifasistani@gmail.com`
* **Gönderici İsmi:** `Sınıf Asistanı`
* **E-Posta Şablonu:** HTML formatında; lisans anahtarı, son kullanma tarihi ve 3 adımlı aktivasyon rehberi içerir.
* **Aynı Zamanda:** Kullanıcı formu gönderdiği anda uygulama içi başarı modalında (`app-demo-success-key`) anahtar anında gösterilir ve tek tıkla kopyalanıp otomatik aktifleştirilir.

---

## 3. Lisanslama ve Kriptografik Koruma Mantığı (Offline-First)

* **Lisans İmzası:** Lisans anahtarları matematiksel olarak imzalanmıştır (`cyrb128(name|expiry|SECRET_SALT)`).
* **İnternetsiz Doğrulama:** Lisans geçerliliği (öğretmenin ismi, bitiş tarihi, tam sürüm kilitleri) cihazın kendi içinde yerel olarak çözülür. Supabase kapalı olsa veya internet olmasa dahi hiçbir öğretmenin lisansı düşmez.
* **Yıllık Lisans Fiyatı & Destek:**
  * **İletişim & WhatsApp:** `0505 885 67 85` (`https://wa.me/905058856785`)
  * **IBAN:** `TR100009902171270400100010`

---

## 4. El Terminali ve Akıllı Tahta Eşleşmesi (`SA-XXXXXX`)

* **Eşleşme Kodu:** 6 haneli, çakışmasız, okunması zor harflerin (0, O, 1, I) çıkarıldığı alfanümerik kod (Örn: `SA-8K4N2P`).
* **Tahtadaki QR Kod:** Ayarlar > El Terminali Eşleştirme sekmesindeki QR kod, bu 6 haneli eşleşme kodunu kamerayla anında telefona aktarmak içindir.
* **Veri Akışı:** Kod eşleştikten sonra el terminalinin yaptığı yoklamalar, canlı davranış puanları, ödev kontrolleri ve optik okuma sonuçları Supabase üzerindeki `teacher_sync` tablosu aracılığıyla saniyeler içinde akıllı tahta ekranına yansır.

---

## 5. Yeni Bir Supabase Projesine Geçerken Yapılacak Hızlı Adımlar

1. [supabase.com](https://supabase.com) üzerinde yeni bir proje açın.
2. Yukarıdaki SQL kodunu **SQL Editor**'e yapıştırıp **Run** deyin.
3. **Project Settings > Data API** sayfasından yeni **URL** ve **anon key** değerlerini alın.
4. [`js/supabase-config.js`](file:///Users/tunc/Desktop/sınıf%20asistanı/js/supabase-config.js) içindeki `url` ve `anonKey` alanlarını güncelleyin.
5. Terminalden `npm run sync` çalıştırarak tüm platformları (web, dist, android, linux, MEB) tek komutla güncelleyin.
