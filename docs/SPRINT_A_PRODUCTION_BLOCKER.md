# Sprint A — Production Blocker

> **Süre:** 3–5 gün  
> **Önkoşul:** Lokal geliştirme ortamı çalışıyor (docker compose up)  
> **Hedef:** Dev/staging ortamı ayağa kalksın; middleware route koruması tamamlansın; güvenlik temel şartları karşılansın  
> **Kural:** UI değişikliği yok · Davranış korunur · Cloud deploy onaysız yok

---

## Genel İlerleme

| #   | Madde                                                  | Durum |
| --- | ------------------------------------------------------ | ----- |
| A1  | Neon dev branch migrate + CI bağlantısı                | [ ]   |
| A2  | Neon staging branch migrate + CI bağlantısı            | [ ]   |
| A3  | Next.js middleware cookie-based auth tamamlama         | [ ]   |
| A4  | Security checklist gözden geçirme + eksikleri işaretle | [ ]   |
| A5  | CORS prod ayarı doğrulama                              | [ ]   |
| A6  | B4 koltuk paneli smoke testi                           | [ ]   |

---

## A1 & A2 — Neon Migrate (dev + staging)

### Başlamadan önce

- [ ] Neon hesabı var ve erişim tam
- [ ] `apps/api/.env` içinde `DATABASE_URL` local postgres'e işaret ediyor (değişecek)
- [ ] `apps/api/prisma/schema.prisma` local'de çalışıyor
- [ ] GitHub Actions secrets boş: `DEV_DATABASE_URL`, `STAGING_DATABASE_URL`

### Adımlar — dev branch

```bash
# 1. Neon dashboard → yeni proje veya mevcut proje → "develop" branch oluştur
# 2. Connection string al (pooler + direct ayrı ayrı)
#    Pooler:  postgresql://...@ep-xxx-pooler.neon.tech/neondb?sslmode=require
#    Direct:  postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require

# 3. .env'e YALNIZCA LOKAL'de yaz (commit etme!)
# apps/api/.env.local (gitignored):
DATABASE_URL="postgresql://<user>:<pass>@ep-xxx-pooler.neon.tech/neondb?sslmode=require"

# 4. Migration çalıştır (direct URL ile)
DATABASE_URL="postgresql://<user>:<pass>@ep-xxx.neon.tech/neondb?sslmode=require" \
  pnpm --filter api prisma migrate deploy

# 5. Seed çalıştır (demo hesaplar)
DATABASE_URL="postgresql://<user>:<pass>@ep-xxx.neon.tech/neondb?sslmode=require" \
  pnpm --filter api prisma:seed

# 6. Doğrula: Neon dashboard → Tables → User, Agency, Guide tabloları var
```

### GitHub Secrets — dev

```
Settings → Secrets and variables → Actions → New repository secret

DEV_DATABASE_URL  = postgresql://<direct-url>/neondb?sslmode=require
```

> Dikkat: CI'da `migrate deploy` için **direct** URL kullan (pooler transactional DDL yapmaz).
> Runtime (API) için **pooler** URL kullan.

### Adımlar — staging branch (A2)

Dev ile aynı adımlar, `staging` Neon branch'i için:

```
STAGING_DATABASE_URL = postgresql://<staging-direct-url>/neondb?sslmode=require
```

### Doğrulama — CI smoke

```bash
# Manuel tetikle:
# GitHub → Actions → "Refresh Env DBs" → Run workflow → develop

# Beklenen output:
# ✓ prisma migrate deploy — 0 migrations pending
# ✓ prisma:seed — upsert tamamlandı
# ✓ build — exit 0
```

### Bitiş kapısı A1/A2

- [ ] `develop` Neon branch'te tablolar var
- [ ] `staging` Neon branch'te tablolar var
- [ ] `DEV_DATABASE_URL` + `STAGING_DATABASE_URL` GitHub secrets'ta
- [ ] `deploy-dev.yml` workflow manuel tetiklemede yeşil
- [ ] Demo giriş: `agency-owner@demo.turta.com` / `Demo1234!` → `/acente` çalışıyor (staging API'ye karşı)

---

## A3 — Next.js Middleware Cookie-Based Auth Tamamlama

### Mevcut durum

`apps/web/src/middleware.ts` şu an sadece korunan rotalarda `Cache-Control: no-store` set ediyor. Cookie-based redirect yok çünkü gerekli servis (`/identity/probe-session` veya token parse) zaten implement edilmiş durumda.

### Neden şimdi yapılabilir

Backend:

- `RefreshCookieService` + `RefreshTokenService` — HttpOnly cookie set/clear TAMAM
- `POST /identity/probe-session` endpoint'i var (auth-session.service)
- Login/register flow refresh cookie set ediyor

Frontend:

- `auth-provider.tsx` mount'ta `refreshAccessToken()` çağırıyor — sessiz restore TAMAM
- `api-client.ts` 401 → `trySilentRefresh()` → retry TAMAM

**Eksik:** Middleware henüz cookie'yi okuyup server-side redirect yapmıyor.

### Implementasyon

`apps/web/src/middleware.ts` dosyasını aşağıdaki mantıkla güncelle:

```typescript
// Korunan route'larda:
// 1. `refreshToken` cookie var mı?
// 2. Yoksa → ilgili login sayfasına redirect
// 3. Varsa → geçsin (AuthProvider mount'ta sessiz refresh yapacak)
// NOT: JWT decode middleware'de YAPMA — edge runtime'da verify problemi olabilir
//      Sadece cookie varlığına bak; gerçek doğrulama AuthProvider + API yapar
```

**Korunan rotalar ve yönlendirme hedefleri:**

| Prefix                    | Yetkisiz yönlendirme           |
| ------------------------- | ------------------------------ |
| `/acente/*` (giris hariç) | `/acente/giris`                |
| `/rehber/*` (giris hariç) | `/rehber/giris`                |
| `/otobus/*` (giris hariç) | `/otobus/giris`                |
| `/admin/*`                | `/login`                       |
| `/profile`                | `/login?callbackUrl=/profile`  |
| `/bookings`               | `/login?callbackUrl=/bookings` |
| `/checkout`               | `/login?callbackUrl=/checkout` |

**Asla engellenmeyecekler (allowlist):**

```
/, /tours/*, /activities/*, /routes/*, /blog/*, /about, /contact,
/gastronomi, /kultur-turlari, /macera-aktiviteleri,
/login, /register, /forgot-password,
/acente/giris, /rehber/giris, /otobus/giris,
/partner-register, /partner-verification/*,
/faq, /privacy, /terms, /cookie-policy, /accessibility,
/_next/*, /favicon.ico, /brand/*, /api/*, /public/*
```

**Cookie adı:** `refreshToken` (backend `RefreshCookieService`'ten kontrol et — tutarlı olmalı)

### Smoke checklist — middleware deploy öncesi ZORUNLU

- [ ] Misafir `/` → açılır, header normal
- [ ] Misafir `/tours`, `/acente/giris`, `/login` → redirect YOK
- [ ] Misafir `/acente/dashboard` → `/acente/giris`'e yönlenir
- [ ] Misafir `/rehber/dashboard` → `/rehber/giris`'e yönlenir
- [ ] Misafir `/otobus/dashboard` → `/otobus/giris`'e yönlenir
- [ ] Misafir `/admin/dashboard` → `/login`'e yönlenir
- [ ] Misafir `/profile`, `/bookings`, `/checkout` → `/login?callbackUrl=...`
- [ ] Acente login sonrası F5 → hâlâ `/acente/dashboard`
- [ ] Rehber login sonrası F5 → hâlâ `/rehber/dashboard`
- [ ] Logout sonrası `/acente/dashboard` → `/acente/giris`
- [ ] Redirect loop YOK (login sayfaları allowlist'te)

### Rollback

Middleware sorun çıkararsa: `matcher: []` yap veya dosyayı sil. Client-side `AuthProvider` koruması çalışmaya devam eder. Tasarım/API etkilenmez.

### Bitiş kapısı A3

- [ ] `apps/web/src/middleware.ts` cookie varlığına bakıyor
- [ ] Tüm smoke checklist ✅
- [ ] Partner tur oluşturma → 15 dk bekle → submit → 401 YOK (sessiz refresh çalışıyor)
- [ ] Partner F5 → panelden ATILMIYOR

---

## A4 — Security Checklist Gözden Geçirme

`docs/SECURITY_CHECKLIST.md` dosyasındaki tüm maddeler `[ ]`. Aşağıdaki sırayla geç:

### Authentication & Session

| Madde                   | Nereden kontrol et                                                 | Beklenen                                            |
| ----------------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| JWT kısa ömür 15m       | `apps/api/.env.example` → `JWT_EXPIRES_IN`                         | `15m`                                               |
| Refresh HttpOnly cookie | `apps/api/src/core/auth/services/refresh-cookie.service.ts`        | Set + Secure + SameSite                             |
| Login rate limit 5/dk   | `apps/api/src/modules/identity/controllers/identity.controller.ts` | `@Throttle({ default: { limit: 5, ttl: 60_000 } })` |
| bcrypt kullanımı        | `apps/api/src/modules/identity/services/identity.service.ts`       | `bcrypt.hash(pwd, 12)`                              |
| Düz metin log yok       | Tüm logger çağrıları                                               | Şifre/token log'lanmıyor                            |

### API

| Madde                    | Nereden kontrol et           | Beklenen                                      |
| ------------------------ | ---------------------------- | --------------------------------------------- |
| Global validation pipe   | `apps/api/src/main.ts`       | `whitelist: true, forbidNonWhitelisted: true` |
| CORS sadece FRONTEND_URL | `apps/api/src/main.ts`       | `origin: config.get('FRONTEND_URL')`          |
| Helmet                   | `apps/api/src/main.ts`       | `app.use(helmet())`                           |
| Throttler                | `apps/api/src/app.module.ts` | Global + özel limitler                        |
| partnerId service'te     | Her partner controller       | `@CurrentUser()` ile partnerId çek            |
| Admin/partner route'ları | Controller'larda             | `@Roles(Role.ADMIN)` vb.                      |

### Data

| Madde                          | Nereden kontrol et              | Beklenen                             |
| ------------------------------ | ------------------------------- | ------------------------------------ |
| Prisma parameterized           | Tüm raw query varsa             | Template literal yok                 |
| `passwordHash` response'da yok | User DTO'ları                   | `select` veya `Omit` ile kaldırılmış |
| İyzico webhook imza            | `apps/api/src/modules/payment/` | `X-Iyz-Signature` doğrulama          |

### Frontend

| Madde                           | Nereden kontrol et                         | Beklenen                          |
| ------------------------------- | ------------------------------------------ | --------------------------------- |
| Token localStorage'a yazılmıyor | `apps/web/src/providers/auth-provider.tsx` | Sadece React state + ref          |
| dangerouslySetInnerHTML         | Tüm bileşenler                             | Kullanılmıyorsa ✓; varsa sanitize |
| CSP header                      | `apps/web/next.config.ts` → headers        | Prod için hardening               |

### Ops

| Madde               | Nereden kontrol et | Beklenen                          |
| ------------------- | ------------------ | --------------------------------- |
| `.env` gitignore'da | `.gitignore`       | `*.env`, `.env*`                  |
| `pnpm audit`        | CI workflow        | Eklenecek (Sprint C'de)           |
| Sentry DSN          | `.env.example`     | Tanımlı ama Sprint C'de kurulacak |

**Her doğrulanan maddeyi** `SECURITY_CHECKLIST.md` dosyasında `[x]` yap.

### Bitiş kapısı A4

- [ ] Her satır kontrol edildi
- [ ] Kritik eksikler (CORS wildcard, webhook imza, Helmet) düzeltildi
- [ ] `SECURITY_CHECKLIST.md` güncel

---

## A5 — CORS Prod Ayarı

Backend şu an CORS'u nasıl configure ediyor:

```bash
# Kontrol et:
# apps/api/src/main.ts → app.enableCors(...)
# apps/api/.env.example → FRONTEND_URL
```

Beklenen:

```typescript
app.enableCors({
  origin: configService.get<string>('FRONTEND_URL'), // wildcard değil
  credentials: true, // refresh cookie için zorunlu
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
```

- [ ] `FRONTEND_URL` prod'da `https://turta.com` veya Vercel URL (wildcard değil)
- [ ] `credentials: true` var (HttpOnly cookie cross-origin için)
- [ ] Local dev: `http://localhost:3001` → `.env.local` ile override

---

## A6 — B4 Koltuk Paneli Smoke

B4 LOCAL TAMAM ama üst ortamda test edilmedi.

### Test senaryosu

1. Demo acente girişi: `agency-owner@demo.turta.com` / `Demo1234!`
2. `/acente/turlar` → herhangi bir tur seç
3. `/acente/turlar/[id]/tarihler` → tarih seç
4. `/acente/turlar/[id]/tarihler/[dateId]/koltuklar` açılıyor mu?
5. MANUAL: koltuk seç → müşteri adı gir → Ata
6. AUTO_FIFO: otomatik atama tetikle
7. Türkçe alias: `/acente/turlar/[id]/tarihler/[dateId]/koltuklar` de kontrol et

### Bitiş kapısı A6

- [ ] Koltuk haritası yükleniyor
- [ ] MANUAL atama çalışıyor
- [ ] AUTO_FIFO çalışıyor
- [ ] Ata/Kaldır işlemleri API ile sync

---

## Sprint A — Genel Bitiş Kapısı

- [ ] A1: Neon dev migrate + CI yeşil
- [ ] A2: Neon staging migrate + CI yeşil
- [ ] A3: Middleware smoke checklist tamamı ✅
- [ ] A4: Security checklist her madde kontrol edilmiş
- [ ] A5: CORS prod ayarı doğru
- [ ] A6: B4 koltuk paneli çalışıyor
- [ ] Bu dosyada tüm `[ ]` → `[x]`
- [ ] `docs/bulgular.md` güncellendi

---

## Bağımlılık Sırası

```
A1 (Neon dev)
  ↓
A2 (Neon staging)  ←─ A1 ile paralel başlanabilir
  ↓
A3 (Middleware)  ←─ A1/A2'den bağımsız, paralel
  ↓
A4 (Security)  ←─ A1/A2/A3'ten bağımsız, paralel
  ↓
A5 (CORS)  ←─ A4 ile birlikte
  ↓
A6 (Koltuk smoke)  ←─ A1 tamam olunca başla
```
