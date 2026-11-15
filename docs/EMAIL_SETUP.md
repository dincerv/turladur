# E-posta kurulumu (OTP / transactional)

Şirket kutusu (`info@turta.com.tr`) ayrı iş: [COMPANY_DOMAIN_AND_EMAIL.md](./COMPANY_DOMAIN_AND_EMAIL.md).
Bu dosya **sistemin gönderdiği** OTP / voucher maillerini anlatır.

## Hedef (şirket domain SPF/DKIM oturana kadar)

| Alan                   | Değer                                          |
| ---------------------- | ---------------------------------------------- |
| **FROM (gönderen)**    | `learnedfromai@gmail.com`                      |
| **TO (alıcı)**         | Kayıt olan kullanıcının girdiği e-posta        |
| **Logo / buton linki** | `EMAIL_BRAND_URL` → `https://www.turta.com.tr` |

Resend, doğrulanmış domain olmadan **Gmail adresinden** rastgele kullanıcıya mail atamaz.
Bu yüzden OTP için **Gmail SMTP + Uygulama Şifresi** kullanıyoruz.

AWS Activate ve müşteri yazışması `info@turta.com.tr` ile yapılır; OTP hâlâ Gmail SMTP’den gidebilir. Karıştırmayın.

## Kurulum (2 dk)

1. Google hesabı `learnedfromai@gmail.com` → [App passwords](https://myaccount.google.com/apppasswords)
   (2FA açık olmalı) → “Mail” / “Other” → 16 haneli şifre üret
2. `apps/api/.env`:

```env
EMAIL_BRAND_URL=https://www.turta.com.tr
MAIL_FROM="turta <learnedfromai@gmail.com>"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=learnedfromai@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
OTP_SHOW_DEBUG_CODE=false
```

Domain henüz SSL almadıysa geçici: `EMAIL_BRAND_URL=https://turladur-zjyf.vercel.app`

3. API restart: `pnpm --filter api start:dev`
4. `/register` → istediğin mail ile kayıt → OTP **o mailin gelen kutusuna** gelir, gönderen `learnedfromai@gmail.com` görünür

## Şirket domain sonrası (Resend)

Workspace MX/SPF/DKIM hazır + `www.turta.com.tr` açıkken:

- Resend’de `turta.com.tr` doğrula (SPF/DKIM — Workspace kayıtlarıyla çakışmaması için Resend rehberini izle)
- `MAIL_FROM=turta <noreply@turta.com.tr>`
- `SMTP_USER` / `SMTP_PASS` kaldırılabilir; `RESEND_API_KEY` yeterli

## Local (Mailhog)

`SMTP_USER` / `SMTP_PASS` / `RESEND_API_KEY` boş → http://localhost:8025
