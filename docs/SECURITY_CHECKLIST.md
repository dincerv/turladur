# Security Checklist (OWASP-oriented, Sprint 18 + soft-launch)

Temel penetrasyon / self-review listesi. Production öncesi işaretleyin.

## Authentication & session

- [x] JWT kısa ömür (`JWT_EXPIRES_IN=15m`), refresh HttpOnly cookie (legacy NextAuth ayrı stack)
- [x] Login/register rate limit: 5/dk (`@Throttle` identity endpoints)
- [x] Şifreler bcrypt, düz metin log yok

## API

- [x] Global validation pipe: whitelist + forbidNonWhitelisted
- [x] CORS: sadece `FRONTEND_URL` (wildcard yok prod; soft launch `CORS_ALLOW_VERCEL=true` → `*.vercel.app`)
- [x] Helmet HTTP headers (`main.ts`)
- [x] Throttler: 100 req/dk default; search 30/dk; webhook `@SkipThrottle`
- [x] Partner izolasyonu: `partnerId` service katmanında
- [x] Admin/partner route’ları `@Roles`
- [x] Swagger prod’da kapalı (`NODE_ENV=production`); açmak için `ENABLE_SWAGGER=true`

## Data

- [x] Prisma parameterized queries (SQL concat yok)
- [x] Hassas alanlar response’da yok (`passwordHash`, kart verisi)
- [ ] Webhook imza doğrulama (İyzico prod’da zorunlu — sandbox key ile test; mock gateway’de N/A)

## Frontend

- [x] Token memory/localStorage’a yazılmıyor (Nest web client)
- [x] `dangerouslySetInnerHTML` yok / sanitize (yeni sayfalar)
- [x] Temel security headers (`next.config.ts`: XFO, nosniff, Referrer-Policy, Permissions-Policy, HSTS)
- [ ] CSP sıkılaştırma (nonce / allowlist) — ayrı hardening PR

## Ops / medya

- [x] Secret’lar env’de, `.env` gitignore
- [ ] Cloudflare R2 bucket `tourtech-media` + CORS (`infrastructure/cloudflare/`)
- [ ] Prod `CDN_URL` = API media proxy veya `https://media.turta.com.tr`
- [ ] `OTP_SHOW_DEBUG_CODE=false` prod
- [ ] `JWT_SECRET` güçlü (`openssl rand -base64 32`)
- [ ] `pnpm audit` CI / release öncesi
- [ ] Sentry `SENTRY_DSN` prod/staging ayrı project
- [ ] DB backup before major migration

## Periyodik

- [ ] Dependency güncelleme (Renovate/Dependabot)
- [ ] Failed login / 429 spike izleme

## Soft-launch env (kopyala-kontrol)

```env
NODE_ENV=production
JWT_SECRET=<güçlü>
OTP_SHOW_DEBUG_CODE=false
CORS_ALLOW_VERCEL=true
FRONTEND_URL=https://<app>.vercel.app
API_PUBLIC_URL=https://<api-host>
CDN_URL=https://<api-host>/api/v1/storage/media
S3_FORCE_PATH_STYLE=false
# ENABLE_SWAGGER=  (boş / false)
```

Doğrulama: `pnpm smoke:media` · runbook: [PUBLISH.md](./PUBLISH.md), [DOMAIN_DNS_CUTOVER.md](./DOMAIN_DNS_CUTOVER.md)
