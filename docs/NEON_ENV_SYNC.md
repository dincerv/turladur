# Ortam Eşitleme Kılavuzu — Neon (dev + staging)

> **Amaç:** Local'deki mevcut şema (35 migration) + demo seed'i Neon dev ve staging branch'lerine uygulamak.  
> **Sonuç:** Local = Neon dev = Neon staging — şema ve demo veri aynı.  
> **Şifre:** Tüm demo hesaplar `Demo1234!`

---

## Genel Akış

```
Neon Proje Kur
  ├── develop branch → DEV_DATABASE_URL al
  └── staging branch → STAGING_DATABASE_URL al
       ↓
GitHub Secrets'a ekle
       ↓
Actions → Deploy Dev   → migrate + seed → Neon develop ✓
Actions → Deploy Staging → migrate + seed → Neon staging ✓
       ↓
Doğrula: demo girişleri çalışıyor
```

---

## ADIM 1 — Neon Proje Oluştur

1. **https://console.neon.tech** → giriş yap
2. **New Project** tıkla:
   - Name: `turta`
   - Region: **AWS EU Central (Frankfurt)** — Türkiye'ye en yakın
   - PostgreSQL version: **16**
   - Compute: **0.25 vCPU / 1 GB** (başlangıç için yeterli)
3. **Create Project** → proje açılır

> Proje oluşturulunca otomatik **main** branch gelir. Biz bunu doğrudan kullanmayacağız.

---

## ADIM 2 — develop Branch Oluştur

1. Sol menü → **Branches** → **+ Add Branch**
2. Ayarlar:
   - Branch name: `develop`
   - Parent: `main`
   - Compute endpoint: Auto (varsayılan)
3. **Create Branch**

### develop Connection String'leri Al

Branch açıldıktan sonra **Connect** sekmesi:

| Tür                     | Kullanım                                    |
| ----------------------- | ------------------------------------------- |
| **Direct (non-pooler)** | `prisma migrate deploy` + seed için         |
| **Pooled**              | Runtime API için (şimdilik gerekmez, sonra) |

**Direct URL formatı:**

```
postgresql://turta_owner:<password>@ep-xxxx-develop.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

Bu URL'yi kopyala — `DEV_DATABASE_URL` olacak.

---

## ADIM 3 — staging Branch Oluştur

1. **Branches** → **+ Add Branch**
2. Ayarlar:
   - Branch name: `staging`
   - Parent: `main`
3. **Create Branch** → aynı şekilde Direct URL'yi al

**Direct URL:**

```
postgresql://turta_owner:<password>@ep-xxxx-staging.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

Bu URL'yi kopyala — `STAGING_DATABASE_URL` olacak.

---

## ADIM 4 — GitHub Secrets Ekle

1. GitHub → **turladur** repo → **Settings**
2. Sol menü → **Secrets and variables** → **Actions**
3. **New repository secret** × 2:

| Secret Adı             | Değer                           |
| ---------------------- | ------------------------------- |
| `DEV_DATABASE_URL`     | develop Direct URL (Adım 2'den) |
| `STAGING_DATABASE_URL` | staging Direct URL (Adım 3'ten) |

> **Dikkat:** Pooler URL değil, **Direct** URL olmalı. `migrate deploy` DDL için non-pooled bağlantı ister.

---

## ADIM 5 — develop'u Senkronize Et

GitHub → **Actions** → **Deploy Dev** → **Run workflow**

- Branch: `main` (veya default branch — workflow dosyası orada olmalı)
- **Run workflow** tıkla

**Workflow ne yapar:**

1. `prisma migrate deploy` → 35 migration sırayla uygulanır
2. `prisma db seed` → demo verisi eklenir (idempotent)
3. API build → derleme kontrolü

**Beklenen süre:** ~5–10 dakika

**Başarı:** Her adım yeşil ✓

---

## ADIM 6 — staging'i Senkronize Et

GitHub → **Actions** → **Deploy Staging** → **Run workflow**

- Branch: `main`
- **Run workflow** tıkla

Aynı adımlar staging için çalışır.

---

## ADIM 7 — Doğrulama

### Neon Dashboard Kontrolü

Her branch için:

- Neon → **Tables** sekmesi → şu tablolar olmalı:

```
User, Agency, AgencyStaff, Guide, BusCompany
Tour, TourDate, TourExtra, TourGalleryItem, TourPickupPoint
Booking, Reservation, Payment
Review, TourMetrics
Notification, Favorite, Coupon
Commission, Earning, Payout, BankInfo
AuditLog, IdempotencyKey, RefreshToken
SitePage, RoutePage
Post, Category
...
```

### Seed Verisi Kontrolü

**User tablosu** şu demo hesapları içermeli:

| Email                         | Rol          | Panel      |
| ----------------------------- | ------------ | ---------- |
| `admin@turta.com`             | SUPER_ADMIN  | `/admin`   |
| `agency-owner@demo.turta.com` | AGENCY_OWNER | `/acente`  |
| `guide@demo.turta.com`        | GUIDE        | `/rehber`  |
| `bus@demo.turta.com`          | BUS_COMPANY  | `/otobus`  |
| `customer@demo.turta.com`     | CUSTOMER     | `/profile` |

**Şifre hepsi:** `Demo1234!`

### API Bağlantı Testi (lokal API → Neon dev)

```powershell
# .env veya .env.local içinde DEV_DATABASE_URL'yi geçici kullan:
$env:DATABASE_URL = "postgresql://...neon.tech/neondb?sslmode=require"

# Migration durumu kontrol:
cd apps/api
pnpm exec prisma migrate status

# Beklenen: "Database schema is up to date!"
```

---

## ADIM 8 — Lokal'i de Kontrol Et

Local docker postgres'in de güncel olduğundan emin ol:

```powershell
# Docker çalışıyor mu?
docker ps | Select-String "postgres"

# Lokal migration durumu:
cd c:\Users\dince\Desktop\tur\turladur\apps\api
pnpm exec prisma migrate status

# Beklenen: "Database schema is up to date!"
# Değilse:
pnpm exec prisma migrate deploy

# Seed (demo veri tazele):
pnpm exec prisma db seed
```

---

## ADIM 9 — Sonraki Cron Otomasyonu

`refresh-env-dbs.yml` her gün develop'u, her 2 günde staging'i otomatik tazeler.

Cron sadece **default branch**'ten çalışır. Kontrol:

```
GitHub → Settings → Default Branch → "main" olmalı
```

Manuel tetikle (test):

```
Actions → Refresh Env DBs → Run workflow → target: both
```

---

## Demo Giriş Adresleri

| Panel   | URL             | Email                         | Şifre       |
| ------- | --------------- | ----------------------------- | ----------- |
| Admin   | `/admin`        | `admin@turta.com`             | `Demo1234!` |
| Acente  | `/acente/giris` | `agency-owner@demo.turta.com` | `Demo1234!` |
| Rehber  | `/rehber/giris` | `guide@demo.turta.com`        | `Demo1234!` |
| Otobüs  | `/otobus/giris` | `bus@demo.turta.com`          | `Demo1234!` |
| Müşteri | `/login`        | `customer@demo.turta.com`     | `Demo1234!` |

---

## Sorun Giderme

### "DEV_DATABASE_URL secret eksik"

→ Adım 4'ü tekrar yap. Secret adı birebir `DEV_DATABASE_URL` olmalı (büyük harf, alt çizgi).

### "P3018: Migration failed to apply cleanly"

→ Neon branch'te stale tablo var. Branch'i **sıfırla:**

- Neon → branch → **Reset** (main'den yeniden başlar)
- Sonra workflow'u tekrar tetikle.

### "Connection timed out" veya "SSL required"

→ URL'nin sonunda `?sslmode=require` olduğundan emin ol.
→ Pooler URL yerine Direct URL kullanıldığından emin ol.

### Seed'de "Unique constraint" hatası

→ Seed idempotent (upsert) yazılmış. Ama tabloda farklı versiyon veri varsa sorun çıkabilir.
→ Çözüm: Neon → branch **Reset** → migration + seed tekrar.

### Migration sırası bozuk

→ `prisma/migrations/migration_lock.toml` içindeki provider `postgresql` olmalı.
→ Local'de `prisma migrate status` sıfır pending gösteriyorsa sıra doğrudur.

---

## Ortam Tablosu — Hedef

| Ortam       | DB                   | Şema     | Seed    | API Host       | Web Host       |
| ----------- | -------------------- | -------- | ------- | -------------- | -------------- |
| **Local**   | Docker postgres:5433 | ✓ Güncel | ✓       | localhost:4000 | localhost:3001 |
| **Dev**     | Neon `develop`       | ✓ Sonra  | ✓ Sonra | —              | Vercel Preview |
| **Staging** | Neon `staging`       | ✓ Sonra  | ✓ Sonra | —              | Vercel Preview |
| **Prod**    | Neon `main`          | Sprint C | Hayır   | Railway        | turta.com      |

> Bu dokümanın amacı "Local + Dev + Staging" satırlarını **✓ Güncel** yapmak.
