# Şirket maili + `turta.com.tr` yayını

> **Amaç:** AWS Activate Gmail kabul etmez; çalışan şirket sitesi ister.
> Bu doküman **önce** şirket e-postasını ve `www.turta.com.tr` yayını açar.
> AWS hesabı / kredi başvurusu **bunlardan sonra** — [DEPLOYMENT.md](./DEPLOYMENT.md) değil, bir sonraki adım.

**İsim sunucusu (NS) değiştirme.** Domain panelinde sadece A / CNAME / MX / TXT ekle.
NS’yi Cloudflare veya Vercel’e taşırsan mevcut kayıtlar (varsa) kaybolur.

---

## 0. Bugün kim ne yapar?

| Kim              | Ne                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------- |
| Sen (DNS paneli) | `turta.com.tr` kayıtlarını ekle (Natro / Turhost / nic.tr / Isimtescil hangisindeyse) |
| Sen (Google)     | Workspace hesabı + `info@turta.com.tr` kutusu                                         |
| Sen (Vercel)     | Custom domain ekle, SSL beklenir                                                      |
| Sen (Railway)    | `FRONTEND_URL` ve `EMAIL_BRAND_URL` güncelle                                          |
| Repo (bu PR)     | Sitedeki `mailto:` adresleri + env örnekleri `turta.com.tr`                           |

---

## 1. Şirket e-postası (önce bu)

AWS hesabını **`info@turta.com.tr`** ile açacağız. Gmail (`learnedfromai@gmail.com`) ile açma.

### Önerilen: Google Workspace (gerçek şirket kutusu)

Cyberpark ofisi + AWS başvurusu için doğru yol. Gönderim + alım `@turta.com.tr`.

1. [Google Workspace](https://workspace.google.com/) → iş e-postası başlat (deneme yeterli).
2. Şirket adı: turta. Domain: **`turta.com.tr`** (www yazma).
3. İlk kullanıcı: **`info`** → `info@turta.com.tr`.
   Şifreyi bir yere kaydet (1Password / şirket kasası). Bu adres AWS Activate’e gider.
4. Google “domain doğrula” der → DNS paneline **TXT** yapıştır (Google’ın verdiği `google-site-verification=...`).
5. Doğrulama geçince **MX** kayıtlarını ekle. Eski MX varsa sil (çakışır).

Google MX (öncelik birebir):

| Tip | Host | Öncelik | Değer                      |
| --- | ---- | ------- | -------------------------- |
| MX  | `@`  | 1       | `ASPMX.L.GOOGLE.COM.`      |
| MX  | `@`  | 5       | `ALT1.ASPMX.L.GOOGLE.COM.` |
| MX  | `@`  | 5       | `ALT2.ASPMX.L.GOOGLE.COM.` |
| MX  | `@`  | 10      | `ALT3.ASPMX.L.GOOGLE.COM.` |
| MX  | `@`  | 10      | `ALT4.ASPMX.L.GOOGLE.COM.` |

6. SPF TXT (`@`):

```
v=spf1 include:_spf.google.com ~all
```

7. Google Admin → Gmail → Authenticate email → **DKIM** üret, DNS’e TXT olarak ekle, “Start authentication”.
8. DMARC TXT (`_dmarc`):

```
v=DMARC1; p=none; rua=mailto:info@turta.com.tr
```

9. Takma adlar (aynı kutuya düşsün, ekstra ücret yok):
   - `destek@turta.com.tr`
   - `partners@turta.com.tr`
   - `privacy@turta.com.tr`
   - `hello@turta.com.tr`

10. Test: Gmail’den `info@turta.com.tr`’ye mail at. 5–30 dk sürebilir.

### Aynı gün yetişsin dersen: Cloudflare Email Routing (ücretsiz, sadece alım)

Workspace kartını bugün çıkarmak istemezsen:

1. Domain’i Cloudflare’e **taşıma** — sadece Email Routing kullanmak için de NS gerekir; bu yüzden **mümkünse Workspace tercih et**.
2. Alternatif ücretsiz kutu: [Zoho Mail Free](https://www.zoho.com/mail/) — 5 kullanıcı, gerçek `@turta.com.tr` inbox. MX’leri Zoho verir.

OTP / sistem mailleri şimdilik Gmail SMTP’de kalabilir (`docs/EMAIL_SETUP.md`). Şirket domain SPF’si oturunca Resend’e geçilir.

---

## 2. Siteyi `www.turta.com.tr` yayına al

> **Durum (2026-11):** Vercel’de domain ekli; fakat global DNS **NXDOMAIN**  
> (`nslookup turta.com.tr 8.8.8.8`). Registrar’da nameserver / A kaydı yoksa  
> Safari (TR) `*.vercel.app` engeline takılır — VPN’siz açılmaz. Soft-live için  
> DNS’i **bugün** tamamla.

Tarayıcı zaten same-origin `/api/v1` kullandığı için domain eklemek login’i bozmaz. Vercel rewrite → mevcut Nest API aynı kalır.

1. [Vercel](https://vercel.com) → turta web projesi → **Settings → Domains**.
2. `turta.com.tr` ekle. Vercel `www`’yi de önerir — **ikisini de ekle** (zaten ekliyse atla).
3. Tercih: **Primary = `www.turta.com.tr`**, apex (`turta.com.tr`) → www’ye 301.
4. Domain kartındaki **tam A ve CNAME değerlerini** kopyala (projeye özel olabilir; internetten ezbere IP yazma). Tipik:

| Tip   | Host  | Değer (karttaki)                               |
| ----- | ----- | ---------------------------------------------- |
| A     | `@`   | Vercel’in gösterdiği IPv4 (sık: `76.76.21.21`) |
| CNAME | `www` | Vercel’in gösterdiği `….vercel-dns-….com`      |

5. DNS panelinde **çakışan** eski A / AAAA / CNAME varsa sil, yenilerini kaydet.
6. Vercel kartı **Valid Configuration** + SSL (Let’s Encrypt) olana kadar bekle — genelde 5–60 dk, `.com.tr` bazen birkaç saat.
7. Kontrol:

```bash
nslookup turta.com.tr
nslookup www.turta.com.tr
curl -I https://www.turta.com.tr
curl -I https://turta.com.tr
```

Beklenen: `www` 200, apex 301 → `https://www.turta.com.tr`.

---

## 3. Canlı env (domain yeşil olduktan sonra)

Vercel **Production**:

```env
NEXT_PUBLIC_APP_URL=https://www.turta.com.tr
```

Railway / Fly API:

```env
FRONTEND_URL=https://www.turta.com.tr,https://turta.com.tr,https://turladur-zjyf.vercel.app
EMAIL_BRAND_URL=https://www.turta.com.tr
CORS_ALLOW_VERCEL=true
```

Redeploy şart (env değişince). Eski `*.vercel.app` adresi kırılmaz; AWS ve müşteri `www.turta.com.tr` kullanır.

R2 CORS’a origin ekle:

- `https://www.turta.com.tr`
- `https://turta.com.tr`

---

## 4. Definition of Done

- [ ] `info@turta.com.tr` gelen kutusu çalışıyor (dışarıdan test maili geldi)
- [ ] `https://www.turta.com.tr` açılıyor, SSL kilitli
- [ ] `https://turta.com.tr` → www yönleniyor
- [ ] Ana sayfa + `/tours` + giriş (müşteri / acente) çalışıyor
- [ ] `https://www.turta.com.tr/api/v1/health` → `database` / `redis` up
- [ ] Sitedeki Destek / KVKK `mailto:` `@turta.com.tr`

Bundan **sonra** AWS hesabı `info@turta.com.tr` ile açılır ve Cyberpark Org ID ile Activate başvurusu yapılır.

---

## 5. Yapma

- AWS hesabını Gmail ile açma (başvuru reddi riski).
- Nameserver’ı “kolay olsun” diye Vercel’e taşıma (MX kaybolur, mail ölür).
- `api.turta.com.tr` / `media.turta.com.tr` — şimdi değil; API hâlâ Railway/Fly.
- Production’a seed basma.
- Eski `turladur-zjyf.vercel.app` kaydını silme (yedek URL).
