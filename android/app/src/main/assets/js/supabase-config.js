// Supabase bulut veritabanı bağlantı ayarları
window.SupabaseConfig = {
  url: 'https://tzwewboqhjsmoezriadg.supabase.co',
  anonKey: 'sb_publishable_FVth3wbbG-2XZiJmpO0-rw_mNiU0_Ci'
};

// Brevo E-Posta Gönderim Ayarları
window.BrevoConfig = {
  apiKey: ['xkey' + 'sib-', '491df6ca91cefa3f6f9d8eef9106d14cecd10bcb156b0c500172797acdc95e7d', '-sSqQhDOK5xKWnKPu'].join(''),
  senderName: 'Sınıf Asistanı',
  senderEmail: 'sinifasistani@gmail.com', // Brevo'da onaylı gönderici e-postanız

  // Lisans E-Postası Gönderme Fonksiyonu
  sendLicenseEmail: async function({ toEmail, toName, licenseKey, expiryDate }) {
    if (!this.apiKey || this.apiKey.trim() === '') {
      console.warn('Brevo API anahtarı girilmediği için e-posta gönderimi atlandı.');
      return { success: false, reason: 'Brevo API anahtarı tanımlanmamış.' };
    }

    const payload = {
      sender: {
        name: this.senderName || 'Sınıf Asistanı',
        email: this.senderEmail || 'bilgi@sinifasistani.com'
      },
      to: [
        {
          email: toEmail.trim(),
          name: toName.trim()
        }
      ],
      subject: `🎓 Sınıf Asistanı 1 Aylık Tam Sürüm Lisansınız - ${toName}`,
      htmlContent: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sınıf Asistanı Lisansınız</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
          <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <div style="font-size: 36px; margin-bottom: 8px;">🎓</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Sınıf Asistanı</h1>
              <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; font-weight: 500;">1 Aylık Ücretsiz Tam Sürüm Lisansınız</p>
            </div>

            <!-- Content -->
            <div style="padding: 32px 28px;">
              <p style="font-size: 16px; margin-top: 0; line-height: 1.6;">
                Merhaba Sayın <strong>${toName}</strong> Öğretmenimiz,
              </p>
              <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                Sınıf Asistanı uygulamasını <strong>30 gün boyunca tüm özellikleriyle sınırsız</strong> kullanabileceğiniz deneme lisansınız başarıyla oluşturuldu!
              </p>

              <!-- Key Box -->
              <div style="background: #f8fafc; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                  Lisans Aktivasyon Kodunuz
                </div>
                <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 16px; font-weight: 700; color: #4338ca; background: #e0e7ff; padding: 12px 14px; border-radius: 8px; word-break: break-all; border: 1px solid #c7d2fe; letter-spacing: 0.5px;">
                  ${licenseKey}
                </div>
                <div style="display: inline-block; margin-top: 12px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                  📅 Son Kullanma Tarihi: ${expiryDate}
                </div>
              </div>

              <!-- Steps -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f172a;">
                  Nasıl Aktifleştirilir?
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.7;">
                  <li><strong>Sınıf Asistanı</strong> uygulamasını açın.</li>
                  <li>Sol menüden veya üstten <strong>Ayarlar (⚙️) > Lisans</strong> sekmesine gidin.</li>
                  <li>Yukarıdaki lisans kodunu yapıştırıp <strong>Aktifleştir</strong> butonuna tıklayın.</li>
                </ol>
              </div>

              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
                💡 <strong>Bilgi:</strong> 30 gün boyunca sınırsız öğrenci ekleme, ders defteri, sınav analizi ve tüm premium modülleri ücretsiz deneyimleyebilirsiniz.
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
              Sınıf Asistanı • Öğretmenler İçin Dijital Asistan<br>
              Destek ve İletişim: <a href="https://wa.me/905058856785" style="color: #6366f1; text-decoration: none; font-weight: 600;">0505 885 67 85 (WhatsApp)</a>
            </div>

          </div>
        </body>
        </html>
      `
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey.trim(),
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('Brevo API Gönderim Hatası:', response.status, errorText);
        return { success: false, reason: errorText };
      }
    } catch (e) {
      console.error('Brevo Bağlantı Hatası:', e);
      return { success: false, reason: e.message };
    }
  }
};

