# Sprint C — Cloud Altyapı

> **Süre:** 3–5 gün  
> **Önkoşul:** Sprint A tamamlandı (Neon ayakta); Sprint B tamamlandı veya paralel ilerliyor  
> **Hedef:** API prod'a deploy; Redis, storage, CDN, monitoring yerleşsin  
> **Kural:** Cloudflare / Neon / push → açık onay olmadan yok · Local docker değiştirilmez

---

## Genel İlerleme

| #   | Madde                                   | Öncelik | Durum |
| --- | --------------------------------------- | ------- | ----- |
| C1  | Railway (veya Fly.io) — API prod deploy | P0      | [ ]   |
| C2  | Upstash Redis — prod + staging          | P0      | [ ]   |
| C3  | Cloudflare R2 entegrasyonu              | P1      | [ ]   |
| C4  | Vercel web deploy — prod custom domain  | P1      | [ ]   |
| C5  | Sentry kurulum (API + Web)              | P1      | [ ]   |
| C6  | `pnpm audit` CI'a ekle                  | P2      | [ ]   |
| C7  | MinIO → R2 medya migration              | P2      | [ ]   |

---

## C1 — Railway API Prod Deploy

> Referans: `docs/DEPLOYMENT.md` → Railway bölümü

### Önkoşullar

- [ ] Railway hesabı ve proje oluşturuldu
- [ ] Neon production branch hazır (Sprint A'nın prod uzantısı)
- [ ] Tüm env secret'lar listesi çıkarıldı (`apps/api/.env.example`)

### Adımlar

```bash
# 1. Railway CLI kur
npm install -g @railway/cli

# 2. Login
railway login

# 3. Proje bağla (repo root'undan)
railway link

# 4. apps/api klasörünü servis olarak ekle
railway service create turta-api

# 5. Dockerfile veya Nixpacks — build komutu
# apps/api/Dockerfile yoksa Nixpacks otomatik algılar (Node.js)
# Build: pnpm --filter api build
# Start: node dist/main.js

# 6. Release command (her deploy'da migration)
# Settings → Deploy → Release Command:
pnpm --filter api exec prisma migrate deploy -- --schema=prisma/schema.prisma
```

### Ortam Değişkenleri (Railway Variables)

```env
NODE_ENV=production
PORT=4000

DATABASE_URL=postgresql://<neon-pooler-url>/neondb?sslmode=require
REDIS_URL=redis://<upstash-url>:6379   # Sprint C2'den gelecek

JWT_SECRET=<güçlü-random-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<ayrı-güçlü-secret>
REFRESH_TOKEN_EXPIRES_IN=30d

FRONTEND_URL=https://turta.com         # veya Vercel URL

# Mail (MailHog prod'da değil; gerçek SMTP)
MAIL_HOST=smtp.sendgrid.net            # veya Resend / SES
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASS=<sendgrid-api-key>
MAIL_FROM=noreply@turta.com

# Storage
MINIO_ENDPOINT=                        # Sprint C3'te R2 ile değişecek
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=turta-media
CDN_URL=https://media.turta.com        # Cloudflare R2 sonrası

# İyzico
IYZICO_API_KEY=<prod-key>
IYZICO_SECRET_KEY=<prod-secret>
IYZICO_BASE_URL=https://api.iyzipay.com

# Sentry (C5'ten)
SENTRY_DSN=
```

### Health Check

```
Railway → Service Settings → Health Check Path: /api/v1/health
Health Check Timeout: 30s
```

### Smoke testi

- [ ] `https://api.turta.com/api/v1/health` → `{ status: "ok" }`
- [ ] `POST https://api.turta.com/api/v1/identity/login` → 200 (demo user)
- [ ] Railway logs'ta hata yok
- [ ] Prisma migration'lar deploy'da çalıştı

### Bitiş kapısı C1

- [ ] API Railway'de çalışıyor
- [ ] Health check yeşil
- [ ] Custom domain: `api.turta.com` (veya Railway default URL)
- [ ] Prod migration çalıştı

---

## C2 — Upstash Redis (BullMQ + Cache)

> Referans: `apps/api/src/core/queue/`, `apps/api/src/core/cache/`

### Neden Upstash

- Serverless-friendly (Railway + Vercel'e uygun)
- BullMQ uyumlu
- Free tier: 10.000 komut/gün

### Adımlar

```bash
# 1. https://console.upstash.com → Redis → Create Database
#    Region: EU-West (Frankfurt) — Neon ile yakın
#    TLS: ON

# 2. Connection URL al:
#    REST: https://...upstash.io (Vercel edge için)
#    Redis: rediss://:<password>@...:6379 (BullMQ için)

# 3. Railway → turta-api → Variables:
REDIS_URL=rediss://:<password>@eu1-xxx.upstash.io:6379

# 4. BullMQ bağlantısını doğrula:
# apps/api/src/core/queue/ → QueueModule Redis config
```

### BullMQ TLS Konfigürasyonu (gerekiyorsa)

```typescript
// apps/api/src/core/queue/ içindeki BullModule config'ine bak
// Upstash Redis TLS için:
{
  redis: {
    host: 'eu1-xxx.upstash.io',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    tls: {},  // TLS zorunlu
  }
}
```

### Smoke testi

- [ ] API prod başlıyor ve kuyruk error'ı yok
- [ ] Bir rezervasyon yarat → email kuyruğa giriyor
- [ ] Upstash console'da key'ler görünüyor
- [ ] Cache hit/miss log'ları normal

---

## C3 — Cloudflare R2 Entegrasyonu

> Referans: `docs/CDN_CLOUDFLARE.md`

### Neden R2

- S3 uyumlu API (minimal kod değişikliği)
- Egress ücreti yok
- CDN entegrasyonu native

### Adımlar

```bash
# 1. Cloudflare dashboard → R2 → Create Bucket: turta-media
# 2. API Token oluştur: R2 → Manage R2 API Tokens → Create Token
#    Permission: Object Read & Write → Specific bucket: turta-media
# 3. Endpoint al:
#    https://<account-id>.r2.cloudflarestorage.com

# 4. Railway → turta-api → Variables güncelle:
MINIO_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
MINIO_ACCESS_KEY=<r2-access-key-id>
MINIO_SECRET_KEY=<r2-secret>
MINIO_BUCKET=turta-media

# NOT: MinIO SDK zaten S3-compat — kod değişikliği YOK
# apps/api/src/core/storage/ → MinioStorageService S3 endpoint ile çalışır
```

### Public Read Domain

```bash
# Cloudflare R2 → turta-media bucket → Settings → Public Access
# Custom domain: media.turta.com
# CNAME: media.turta.com → <bucket>.r2.cloudflarestorage.com (Cloudflare manage eder)

# Railway → turta-api → Variables:
CDN_URL=https://media.turta.com
```

### CORS (R2 Bucket Ayarı)

```json
[
  {
    "AllowedOrigins": ["https://turta.com", "https://*.turta.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

### Smoke testi

- [ ] Tur görseli yükle (acente paneli) → R2'de dosya var
- [ ] `https://media.turta.com/<key>` → görsel açılıyor
- [ ] CDN_URL değişkeni API'den dönüyor (`publicUrl` doğru)
- [ ] Eski MinIO dosyaları varsa migrate et (C7)

---

## C4 — Vercel Web Deploy + Prod Custom Domain

> Referans: `docs/DEPLOYMENT.md` → Vercel bölümü

### Adımlar

```bash
# 1. Vercel dashboard → Add New Project → Import turladur repo
# 2. Settings:
#    Framework Preset: Next.js
#    Root Directory: apps/web
#    Build Command: pnpm --filter web build
#    Install Command: pnpm install --frozen-lockfile

# 3. Ortam Değişkenleri (Vercel → Settings → Environment Variables):
NEXT_PUBLIC_API_URL=https://api.turta.com/api/v1
API_PROXY_TARGET=https://api.turta.com

# Opsiyonel:
NEXT_PUBLIC_SENTRY_DSN=<web-sentry-dsn>
```

### Next.js Proxy Rewrite (api/v1 → Nest)

`apps/web/next.config.ts` içinde rewrite var mı kontrol et:

```typescript
// Tarayıcı /api/v1/* isteklerini Nest'e yönlendir
// HttpOnly cookie'ler için SAME-ORIGIN kritik
async rewrites() {
  return [
    {
      source: '/api/v1/:path*',
      destination: `${process.env.API_PROXY_TARGET}/api/v1/:path*`,
    },
  ];
},
```

### Custom Domain

```bash
# Vercel → Project → Domains:
# turta.com → A record: 76.76.21.21 (Vercel)
# www.turta.com → CNAME: cname.vercel-dns.com
```

### Smoke testi

- [ ] `https://turta.com` açılıyor
- [ ] `https://turta.com/tours` → API'den turlar geliyor
- [ ] Login → JWT refresh cookie set oluyor (same-origin rewrite)
- [ ] Acente paneli `/acente/giris` → login → dashboard
- [ ] HTTPS zorunlu (HTTP → HTTPS redirect)

---

## C5 — Sentry Kurulum (API + Web)

### Adımlar

```bash
# 1. https://sentry.io → New Project → Node.js (API) + Next.js (Web)
#    Her biri için AYRI project oluştur:
#    turta-api (Node.js)
#    turta-web (Next.js)

# 2. API entegrasyonu:
pnpm --filter api add @sentry/node

# apps/api/src/main.ts başına:
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // prod'da %10 trace
});

# 3. Web entegrasyonu:
pnpm --filter web add @sentry/nextjs

# npx @sentry/wizard@latest -i nextjs
# → sentry.client.config.ts + sentry.server.config.ts otomatik oluşur
```

### Ortam Değişkenleri

```env
# API (Railway):
SENTRY_DSN=https://xxx@o123.ingest.sentry.io/456789

# Web (Vercel):
NEXT_PUBLIC_SENTRY_DSN=https://yyy@o123.ingest.sentry.io/456790
SENTRY_AUTH_TOKEN=<token-for-source-maps>
SENTRY_ORG=turta
SENTRY_PROJECT=turta-web
```

### Alert Kuralları (Sentry → Alerts → Create Rule)

| Kural          | Koşul                | Aksiyon     |
| -------------- | -------------------- | ----------- |
| 500 spike      | >10/dk aynı endpoint | Email/Slack |
| Yeni hata tipi | İlk kez görülen      | Email       |
| 401 spike      | >50/dk               | Email       |
| Yavaş sorgu    | P95 > 3sn            | Slack       |

### Smoke testi

- [ ] API'de bilinçli hata fırlat → Sentry'de görünüyor
- [ ] Web'de bilinçli hata fırlat → Sentry'de görünüyor
- [ ] Release tracking: deploy sırasında Sentry release oluşuyor
- [ ] Source maps yüklendi (JS hata satır numaraları okunabilir)

---

## C6 — `pnpm audit` CI'a Ekle

`apps/api` veya root'taki `.github/workflows/ci.yml` dosyasına ekle:

```yaml
- name: Security audit
  run: pnpm audit --audit-level=high
  # --audit-level=high: yalnızca HIGH ve CRITICAL severity engeller
  # moderate uyarıları report eder ama fail etmez
```

- [ ] `ci.yml` güncellendi
- [ ] İlk çalışmada critical vuln varsa → patch
- [ ] PR'larda her zaman audit çalışıyor

---

## C7 — MinIO → R2 Medya Migration (Opsiyonel)

> Sadece local MinIO'da prod verisi varsa gerekli. Yoksa atla.

```bash
# rclone ile kopyala:
brew install rclone

# rclone.conf:
[r2]
type = s3
provider = Cloudflare
access_key_id = <r2-access-key>
secret_access_key = <r2-secret>
endpoint = https://<account-id>.r2.cloudflarestorage.com

[minio]
type = s3
provider = Minio
access_key_id = <minio-key>
secret_access_key = <minio-secret>
endpoint = http://localhost:9000

# Kopyala:
rclone copy minio:turta-media r2:turta-media --progress
```

---

## Sprint C — Genel Bitiş Kapısı

- [ ] API Railway'de çalışıyor, `/api/v1/health` yeşil
- [ ] Upstash Redis bağlı, BullMQ kuyruğu çalışıyor
- [ ] Cloudflare R2 bağlı, medya upload/serve çalışıyor
- [ ] Vercel'de `turta.com` yayında, Nest API'ye proxy çalışıyor
- [ ] Sentry hem API hem Web'de aktif, test hatası görünüyor
- [ ] `pnpm audit` CI'da çalışıyor
- [ ] Prod'da hiçbir servis `localhost` veya `docker` bağlantısı kullanmıyor
- [ ] Bu dosyada tüm yapılan maddeler `[x]`

---

## Bağımlılık Sırası

```
C2 (Upstash Redis)  ←─ C1 öncesi hazırla
  ↓
C1 (Railway API)  ←─ C2 + Neon prod hazır olunca
  ↓
C3 (Cloudflare R2)  ←─ C1 ile paralel
  ↓
C4 (Vercel prod)  ←─ C1 API çalışıyor olunca
  ↓
C5 (Sentry)  ←─ C1 + C4 sonrası
  ↓
C6 (audit CI)  ←─ Bağımsız, istediğinde
  ↓
C7 (MinIO migrate)  ←─ C3 sonrası, sadece gerekirse
```
