# Sprint D — Teknik Borç Temizliği

> **Süre:** 1 hafta (paralel / arka planda ilerleyebilir)  
> **Önkoşul:** Sprint A tamamlandı; Sprint B + C ile paralel başlanabilir  
> **Hedef:** Kod kalitesi, bakım kolaylığı, SEO ve build güvenilirliği  
> **Kural:** Davranış değişmez · UI redesign yok · Her madde ayrı küçük commit/PR

---

## Genel İlerleme

| #   | Madde                                               | Risk   | Öncelik | Durum |
| --- | --------------------------------------------------- | ------ | ------- | ----- |
| D1  | ESLint/TS build ignore kaldır                       | YÜKSEK | P1      | [ ]   |
| D2  | Root `/app` klasörü temizliği                       | ORTA   | P1      | [ ]   |
| D3  | Çift route grubu birleştirme (`/tours` + `/turlar`) | ORTA   | P1      | [ ]   |
| D4  | Hydration mismatch — `/routes/[id]`                 | DÜŞÜK  | P1      | [ ]   |
| D5  | Placeholder görsel URL'leri CDN'e taşı              | DÜŞÜK  | P2      | [ ]   |
| D6  | URL Türkçeleştirme (Opsiyon A)                      | ORTA   | P2      | [ ]   |
| D7  | Paket adı scope'lama (`@turta/web`, `@turta/api`)   | DÜŞÜK  | P2      | [ ]   |
| D8  | `partner/reviews/types.ts` legacy export temizliği  | DÜŞÜK  | P3      | [ ]   |
| D9  | `IMAGE_PLACEHOLDER` duplikasyonu birleştir          | DÜŞÜK  | P3      | [ ]   |

---

## D1 — ESLint / TypeScript Build Ignore Kaldır (P1 — En Yüksek Risk)

### Mevcut durum

```typescript
// apps/web/next.config.ts
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true },
```

Bu iki satır gerçek hataları gizliyor. Kaldırmadan önce kaç hata olduğunu bilmek gerekiyor.

### Adım 1 — Hata envanteri (risk tespiti)

```bash
# TypeScript hata sayısı
pnpm --filter web exec tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object

# ESLint hata sayısı
pnpm --filter web exec next lint 2>&1
```

### Adım 2 — Hataları düzelt (sırayla, küçük PR'lar)

Tipik hata kategorileri ve çözüm yaklaşımı:

| Hata tipi                                   | Nasıl düzeltilir                         |
| ------------------------------------------- | ---------------------------------------- |
| `Type 'X' is not assignable to 'Y'`         | Tip tanımını düzelt veya tip guard ekle  |
| `'prop' is possibly 'undefined'`            | Optional chaining (`?.`) veya null check |
| `Property 'x' does not exist on type`       | Tip genişlet veya doğru tipi kullan      |
| `React Hook 'useX' is called conditionally` | Hook'u en üstte, koşulsuz çağır          |
| `'x' is defined but never used`             | Kaldır veya `_x` adı ver                 |
| `img element` yerine `next/image`           | `<Image>` kullan                         |

### Adım 3 — ignore'ları kaldır

```bash
# Her iki satırı next.config.ts'den sil
# Build'i çalıştır:
pnpm --filter web build

# Yeşil olmalı
```

### Bitiş kapısı D1

- [ ] TypeScript hata envanteri çıkarıldı ve belgelendi
- [ ] Tüm type hatalar düzeltildi
- [ ] `ignoreDuringBuilds: false` ve `ignoreBuildErrors: false`
- [ ] `pnpm --filter web build` → exit 0, hata yok
- [ ] ESLint temiz

> **Uyarı:** Bu madde büyük iş kalemi olabilir. Envanter sonucuna göre ayrı PR'lara böl. Diğer sprint maddelerini ENGELLEME.

---

## D2 — Root `/app` Klasörü Temizliği (P1)

### Mevcut durum

Repo root'unda eski bir `app/` klasörü duruyor:

```
app/
├── (admin-dashboard)/
├── (auth)/
│   ├── forgot-password/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── blog/
│   ├── contact/
│   ├── tour/
│   └── tours/
├── (partner-dashboard)/
├── (partners-auth)/
└── api/
    ├── partner/
    └── tours/
```

Bunların tamamı `apps/web/src/app/` altında karşılıkları var. Bu klasör **legacy** — artık kullanılmıyor.

### Kontrol

```bash
# Bu dosyalara herhangi bir import var mı?
rg "from.*app/(admin-dashboard|dashboard|partner-dashboard)" --type ts --type tsx

# Next.js bu klasörü route olarak algılıyor mu?
# Root next.config.ts var mı? → apps/web/next.config.ts zaten doğru konumda
# Root'ta başka bir next.config veya page.tsx var mı kontrol et
```

### Silme planı

```bash
# 1. Import kontrolü → 0 sonuç geliyorsa güvenle sil
Remove-Item -Recurse -Force c:\Users\dince\Desktop\tur\turladur\app

# 2. Build test:
pnpm --filter web build

# 3. Root'taki diğer legacy klasörler:
# components/ → apps/web/src/components/ altında modern kopyası var mı?
# hooks/      → apps/web/src/hooks/ var
# lib/        → apps/web/src/lib/ var
# public/     → apps/web/public/ var
# Bu klasörleri de kontrol et, import yoksa sil
```

### Bitiş kapısı D2

- [ ] Root `app/` klasörü yok
- [ ] Root `components/`, `hooks/`, `lib/`, `public/` (eğer legacy ise) yok
- [ ] Build hatasız
- [ ] Herhangi bir sayfa bozulmadı

---

## D3 — Çift Route Grubu Birleştirme (P1)

### Mevcut durum

`apps/web/src/app/(agency)/acente/` altında iki paralel route grubu var:

```
/acente/tours/[tourId]/                  ← EN
/acente/turlar/[id]/                     ← TR

/acente/tours/[tourId]/dates/[dateId]/   ← EN
/acente/turlar/[id]/tarihler/[dateId]/   ← TR
```

Hangisi canonical? Hangisi aktif kullanımda?

### Analiz

```bash
# Hangi path'e link veriliyor?
rg "acente/tours" apps/web/src --type tsx --type ts
rg "acente/turlar" apps/web/src --type tsx --type ts

# Sidebar/navigation hangi path kullanıyor?
# AgencyShell navigation linklerini kontrol et
```

### Karar

| Seçenek                  | Ne yapılır                                                 |
| ------------------------ | ---------------------------------------------------------- |
| Türkçe path canonical    | `/acente/tours/*` → redirect `/acente/turlar/*` ve silinir |
| İngilizce path canonical | `/acente/turlar/*` → redirect `/acente/tours/*` ve silinir |

> Önerim: **Türkçe canonical** (Opsiyon A ile tutarlı, acente paneli TR kullanıcı)

### Uygulama (Türkçe canonical seçilirse)

```typescript
// apps/web/src/app/(agency)/acente/tours/[tourId]/page.tsx
import { redirect } from 'next/navigation';
export default function TourRedirect({
  params,
}: {
  params: { tourId: string };
}) {
  redirect(`/acente/turlar/${params.tourId}`);
}
// Tüm alt route'lar için aynı
```

### Bitiş kapısı D3

- [ ] Canonical path belirlendi
- [ ] Duplicate route'lar redirect veya silindi
- [ ] Navigation linkleri güncellendi
- [ ] Smoke: `/acente/turlar/...` ve `/acente/tours/...` her ikisi çalışıyor (biri redirect)

---

## D4 — Hydration Mismatch — `/routes/[id]` (P1)

### Mevcut sorun

`apps/web/src/app/(marketing)/routes/[id]/page.tsx` → `RouteDetailClient` `useSearchParams()` kullanıyor → Suspense fallback metin client ile uyuşmuyor → hydration fail overlay (dev).

### Hızlı Fix — Fallback metnini hizala

```typescript
// Suspense fallback:
<Suspense fallback={<div>Rota yükleniyor...</div>}>
  <RouteDetailClient />
</Suspense>

// RouteDetailClient içinde loading state:
if (loading) return <div>Rota yükleniyor...</div>;
// Aynı metin → hydration match
```

### Uzun Vadeli Fix — SSR-friendly

```typescript
// page.tsx'e server-side fetch ekle, prop olarak geç:
// → useSearchParams bağımlılığı azalır
// → generateMetadata ile SEO canonical URL
```

### Bitiş kapısı D4

- [ ] Dev overlay'de hydration error yok
- [ ] `/routes/kapadokya` sayfası açılıyor
- [ ] SSR renderı doğru (curl ile kontrol: `curl https://turta.com/routes/kapadokya`)

---

## D5 — Placeholder Görsel URL'leri CDN'e Taşı (P2)

> **Önkoşul:** Sprint C3 (Cloudflare R2) tamamlandı ve `CDN_URL` çalışıyor

### Mevcut durum

Hardcoded Unsplash/Pexels/Picsum URL'leri:

```bash
# Hangi dosyalarda var?
rg "unsplash|pexels|picsum" apps/web/src --type tsx --type ts -l
```

Bilinen konumlar: `hero.tsx`, `campaigns`, `login`, `partner-verification`, vb.

### Yaklaşım

Placeholder URL'leri kaldırıp yerine R2'deki gerçek marka görsellerini koy:

```bash
# 1. Marka görselleri R2'ye yükle (admin paneli veya rclone)
# 2. CDN URL'leri al: https://media.turta.com/brand/hero-1.jpg
# 3. Hardcoded URL'leri değiştir
# 4. next.config.ts remotePatterns'ten unsplash/pexels/picsum kaldır
```

### Bitiş kapısı D5

- [ ] `rg "unsplash|pexels|picsum" apps/web/src` → 0 sonuç
- [ ] Tüm görseller `media.turta.com` veya `/brand/*` üzerinden
- [ ] `next.config.ts remotePatterns` sadece `media.turta.com` ve `*.vercel.app`

---

## D6 — URL Türkçeleştirme — Opsiyon A (P2 — Ürün Onayı Gerekli)

> Yalnızca ürün onayı gelince başla. `bulgular.md §8` detaylı belgeliyor.

### Scope

| Eski               | Yeni                | Redirect |
| ------------------ | ------------------- | -------- |
| `/tours`           | `/turlar`           | 301      |
| `/tours/[id]`      | `/turlar/[id]`      | 301      |
| `/activities`      | `/aktiviteler`      | 301      |
| `/activities/[id]` | `/aktiviteler/[id]` | 301      |
| `/routes`          | `/rotalar`          | 301      |
| `/routes/[id]`     | `/rotalar/[id]`     | 301      |
| `/about`           | `/hakkimizda`       | 301      |
| `/contact`         | `/iletisim`         | 301      |
| `/login`           | `/giris`            | 301      |
| `/register`        | `/kayit`            | 301      |
| `/profile`         | `/profil`           | 301      |
| `/bookings`        | `/rezervasyonlarim` | 301      |
| `/checkout`        | `/odeme`            | 301      |

### Uygulama sırası

```
1. next.config.ts → redirects() ile 301 ekle (önce)
2. app/ klasör rename
3. Tüm internal link güncelleme (rg ile bul)
4. middleware.ts allowlist güncelle
5. Sitemap + canonical güncelle
6. Smoke: eski URL → 301 → yeni URL
7. SEO kırığı kontrolü
```

### Bitiş kapısı D6

- [ ] Ürün onayı alındı
- [ ] 301 redirect'ler çalışıyor
- [ ] `curl -I https://turta.com/tours` → 301
- [ ] Internal linkler güncellendi
- [ ] Sitemap güncel
- [ ] Google Search Console'da crawl error yok

---

## D7 — Paket Adı Scope'lama (P2)

### Mevcut sorun

```json
// Root package.json
{ "name": "tourtech" }  // ← "turta" olmalı

// apps/web/package.json
{ "name": "web" }  // ← "@turta/web" olmalı

// apps/api/package.json
{ "name": "api" }  // ← "@turta/api" olmalı
```

### Uygulama

```bash
# 1. Root package.json → "name": "turta"
# 2. apps/web/package.json → "name": "@turta/web"
# 3. apps/api/package.json → "name": "@turta/api"
# 4. nx.json + workspace.json güncellemelerini kontrol et
# 5. pnpm --filter @turta/web build  (filter çalışıyor mu test et)
# 6. CI workflow'larda filter adları güncelle
```

> **Risk:** Nx ve pnpm workspace filter komutları etkilenir. Build sonrası doğrula.

### Bitiş kapısı D7

- [ ] 3 paket adı tutarlı
- [ ] `pnpm --filter @turta/web build` çalışıyor
- [ ] `pnpm --filter @turta/api build` çalışıyor
- [ ] CI workflow'lar yeşil

---

## D8 — `partner/reviews/types.ts` Legacy Export Temizliği (P3)

```typescript
// apps/web/src/lib/partner/reviews/types.ts içinde:
// Kullanılmayan export'lar:
export const EMPTY_PARTNER_REVIEWS_*   // ← hiçbir consumer yok
export const PartnerReviewsProvider    // ← hiçbir consumer yok
export const PartnerReviewsSubscription* // ← hiçbir consumer yok
```

```bash
# Doğrula:
rg "EMPTY_PARTNER_REVIEWS|PartnerReviewsProvider|PartnerReviewsSubscription" apps/web/src

# 0 sonuçsa → export'ları sil (dosya kalır, canlı export'ları koru)
```

---

## D9 — `IMAGE_PLACEHOLDER` Duplikasyonu (P3)

```bash
# İki ayrı tanım var:
rg "IMAGE_PLACEHOLDER" apps/web/src -l
# lib/image-placeholder.ts (hot-deals)
# lib/partner-tour-helpers.ts (tour-form)

# Birleştir:
# lib/image-placeholder.ts → tek kaynak
# partner-tour-helpers.ts → import et
```

---

## Sprint D — Genel Bitiş Kapısı

- [ ] D1: `pnpm --filter web build` ignoreDuringBuilds=false ile yeşil
- [ ] D2: Root `/app` ve legacy klasörler silinmiş
- [ ] D3: Çift route grubu tek canonical'a indirgendi
- [ ] D4: `/routes/[id]` hydration hatasız
- [ ] D5: Placeholder görseller CDN'e taşındı (Sprint C3 sonrası)
- [ ] D6: URL Türkçeleştirme ürün onayıyla tamamlandı (opsiyonel)
- [ ] D7: Paket adları scope'lu, CI yeşil
- [ ] D8: Legacy export'lar temizlendi
- [ ] D9: IMAGE_PLACEHOLDER tek kaynaktan
- [ ] Bu dosyada tüm yapılan maddeler `[x]`

---

## Öneri: Paralel Çalışma Planı

```
[Düşük risk — hemen başla]
D2 (Root klasör temizliği)   → ayrı PR
D4 (Hydration mismatch)      → ayrı PR
D8 (Legacy exports)          → ayrı PR
D9 (IMAGE_PLACEHOLDER)       → ayrı PR

[Orta risk — dikkatli]
D3 (Çift route)              → ayrı PR, smoke zorunlu
D7 (Paket adları)            → ayrı PR, CI kontrolü

[Yüksek risk — en sona bırak]
D1 (ESLint/TS ignore kaldır) → son; büyük olabilir

[Ürün onayı gerekli]
D6 (URL Türkçeleştirme)      → onay olmadan başlama

[Önkoşul: Sprint C3]
D5 (Placeholder CDN)         → R2 hazır olunca
```
