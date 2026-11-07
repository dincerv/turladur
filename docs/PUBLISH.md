# Soft-launch publish (custom domain yok) — Sprint 24 hazırlık

> **Hedef:** Vercel (web) + Railway/Fly (API) + Neon + R2 ile canlı soft launch.  
> **Custom domain yok:** fotoğraflar **API media proxy** ile sunulur  
> (`https://<API_HOST>/api/v1/storage/media/...`).  
> Domain alınca `CDN_URL=https://media.turta.com` + R2 Custom Domain’e geçilir.

---

## Mimari (şimdilik)

```
Vercel (apps/web) ──HTTP──▶ Railway API (apps/api)
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
                  Neon        Redis        R2 (tourtech-media)
                  (DB)      (cache/queue)  (dosya bytes)
                                │
                                └── GET /api/v1/storage/media/*  (herkese açık proxy)
```

---

## 1) Cloudflare R2 (zaten bucket var)

1. Bucket: `tourtech-media`
2. **Settings → CORS** — Vercel origin ekle:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3001",
      "http://localhost:3000",
      "https://*.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

3. Public Development URL opsiyonel (TLS sorunlu olabilir) — **zorunlu değil**; soft launch proxy kullanır.
4. API token: Object Read & Write (Access Key + Secret).

---

## 2) Neon (production DB)

1. Neon → production branch (veya `main`)
2. **Pooled** URL → API runtime `DATABASE_URL`
3. **Direct** URL → migrate: `pnpm --filter api prisma migrate deploy`
4. Seed: soft launch’ta demo seed **isteğe bağlı** (`pnpm --filter api prisma db seed`)

---

## 3) Railway / Fly — `apps/api`

### Build / start

```bash
pnpm install --frozen-lockfile
pnpm --filter api build
pnpm --filter api start:prod
# → node dist/src/main.js
```

Release / migrate:

```bash
cd apps/api && pnpm exec prisma migrate deploy --schema=prisma/schema.prisma
```

Health: `GET /api/v1/health`

### Env (Railway secrets)

```env
NODE_ENV=production
PORT=4000

# Neon pooled
DATABASE_URL=postgresql://…-pooler…/neondb?sslmode=require

REDIS_URL=redis://…

JWT_SECRET=<openssl rand -base64 32>
JWT_EXPIRES_IN=15m

# Vercel URL(s) — virgülle birden fazla
FRONTEND_URL=https://YOUR-APP.vercel.app
# Soft launch: tüm *.vercel.app preview’lara izin
CORS_ALLOW_VERCEL=true

# Public API base (CDN fallback + 3DS callback)
API_PUBLIC_URL=https://YOUR-API.up.railway.app

# R2
MINIO_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
MINIO_ACCESS_KEY=<r2_access_key>
MINIO_SECRET_KEY=<r2_secret_key>
S3_BUCKET=tourtech-media
S3_REGION=auto
S3_FORCE_PATH_STYLE=false

# Custom domain YOK → media proxy
CDN_URL=https://YOUR-API.up.railway.app/api/v1/storage/media

# Mail (OTP / voucher) — ZORUNLU soft-launch için
# SMTP yoksa OTP 201 dönüp mail gitmezdi; artık production'da 503/422 döner.
# docs/EMAIL_SETUP.md — Gmail App Password önerilir
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=learnedfromai@gmail.com
SMTP_PASS=<gmail-app-password>
MAIL_FROM="turta <learnedfromai@gmail.com>"
EMAIL_BRAND_URL=https://YOUR-APP.vercel.app
OTP_SHOW_DEBUG_CODE=false
NODE_ENV=production

# İyzico — boş = mock; sandbox key ile gerçek 3DS
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
```

Doğrulama:

```bash
curl -s https://YOUR-API…/api/v1/health
curl -sI https://YOUR-API…/api/v1/storage/media/tours/…/file.jpg
# → 200 image/*
```

---

## 4) Vercel — `apps/web`

| Ayar           | Değer                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| Root Directory | `apps/web`                                                                               |
| Install        | `cd ../.. && pnpm install --frozen-lockfile` (monorepo) **veya** Vercel pnpm + workspace |
| Build          | `pnpm build` (script zaten `NODE_ENV=production next build`)                             |
| Output         | Next default                                                                             |

### Env (Production + Preview)

```env
NEXT_PUBLIC_API_URL=https://YOUR-API.up.railway.app/api/v1
NEXT_PUBLIC_CDN_URL=https://YOUR-API.up.railway.app/api/v1/storage/media
```

Preview için aynı API’yi kullanabilirsin (veya ayrı staging API).

---

## 5) Yayın sırası (kırılmadan)

1. Neon migrate deploy (direct URL)
2. Redis ayakta
3. Railway API deploy + env + health 200
4. Media proxy smoke (`/storage/media/...`)
5. Vercel web deploy + `NEXT_PUBLIC_*`
6. Partner login → tur foto yükle → URL `…/api/v1/storage/media/…` olmalı
7. `/tours` kartında foto görünmeli
8. Checkout mock kart `…0016` (anında SUCCESS) veya `…0008` (mock 3DS)

---

## 6) Custom domain gelince (sonra)

Tam checklist: [DOMAIN_DNS_CUTOVER.md](./DOMAIN_DNS_CUTOVER.md) (`turta.com.tr`).

1. R2 → Custom Domains → `media.turta.com.tr`
2. API: `CDN_URL=https://media.turta.com.tr`
3. Web: `NEXT_PUBLIC_CDN_URL=https://media.turta.com.tr`
4. Eski proxy URL’leri API `resolveMediaUrl` ile path rewrite eder (dosya R2’deyse)
5. Veridyen MX/SPF aynı DNS panelinde (Natro veya Cloudflare)

---

## Bilerek dışarıda (Sprint 23.17 / 24+)

- SMS / push (23.17 askıda)
- İyzico canlı (şirket + key)
- `turta.com` / `api.turta.com` DNS
- Production seed temizliği

---

## Hızlı kontrol listesi

- [ ] R2 CORS’ta `*.vercel.app`
- [ ] API `CDN_URL` = `https://<api>/api/v1/storage/media`
- [ ] Web `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_CDN_URL` aynı API host
- [ ] `FRONTEND_URL` + `CORS_ALLOW_VERCEL=true`
- [ ] Health 200
- [ ] Partner upload → tours listesinde görsel
- [ ] E2E local: `pnpm test:e2e` (API+web ayaktayken)
