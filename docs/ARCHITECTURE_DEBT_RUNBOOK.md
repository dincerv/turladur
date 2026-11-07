# turta — Mimari Borç Runbook (Cursor Agent)

Bu dosya Cursor’a yüklenerek **adım adım** uygulanır. Amaç: modüler monolit sınırlarını düzeltmek; mikroservis rewrite **yok**.

**Repo:** `turladur` (turta)  
**Hedef mimari:** Nx + NestJS modular monolith (`apps/api`) + Next.js (`apps/web`) + `packages/shared-*`  
**Kaynak sözleşme:** `docs/ARCHITECTURE.md`, `.cursor/rules/architecture.mdc`

---

## Agent kuralları (her turda oku)

1. **Tek faz çalış.** Aşağıdaki fazlardan yalnızca birini seç; bitmeden sonrakine geçme.
2. **Önce doğrula, sonra kod yaz.** Her fazın “Başlamadan önce” checklist’ini tamamla.
3. **Küçük PR dilimi.** Faz içinde birden fazla bağımsız değişiklik varsa alt maddeleri ayrı commit/PR mantığında tut; tek turda her şeyi birleştirme.
4. **Davranış koru.** UI parity kuralına uy (`.cursor/rules/ui-parity-no-simplify.mdc`): sadeleştirme / yeniden tasarım yok.
5. **Yasaklar (asla yapma):**
   - Mikroservis / ayrı deployable servislere bölme (daf2026 kopyası)
   - Keycloak’ı “şimdi zorunlu” diye ekleme
   - Kafka / Elasticsearch / nginx’i local zorunluluk yapma
   - Tüm modüllere boş CQRS iskeleti ekleme
   - Cross-schema **okumaları** toptan yasaklama (booking→catalog read normal)
   - UI’yi basitleştirerek küçültme
6. **Faz bitişi:** “Bitiş kapısı” checklist’inin tamamı ✅ olmalı; özet mesajda ne değişti + nasıl test edildi yaz.
7. **İlerleme kaydı:** Bu dosyadaki ilgili `[ ]` kutularını `[x]` yap (aynı PR’da).

---

## Korunan sağlıklı parçalar (bozma)

- [x] `apps/api` + `apps/web` + `packages/shared-*` düzeni
- [x] Web’de Prisma yok
- [x] JWT + RolesGuard + StaffPermissionsGuard
- [x] Event örnekleri: payment→booking, review→catalog rating, catalog cancel→booking
- [x] `infrastructure/docker` (postgres, redis, minio, mailhog)
- [x] Evrim yolu: monolit → horizontal scale → sonra extract (şimdi extract yok)

---

## Genel ilerleme

| Faz | Konu                             | Durum |
| --- | -------------------------------- | ----- |
| 0   | Doc / reality sync               | [ ]   |
| 1   | Orphan event envanteri           | [ ]   |
| 2   | Payment refund → booking event   | [ ]   |
| 3   | Partner booking sahipliği        | [ ]   |
| 4   | Admin ↔ Content decoupling       | [ ]   |
| 5   | Module boundary lint (CI)        | [ ]   |
| 6   | Web HTTP tek giriş (api-client)  | [ ]   |
| 7   | Fat UI split (parity koru)       | [ ]   |
| 8   | Kritik unit test + CI genişletme | [ ]   |

---

# FAZ 0 — Doküman / reality sync

**Amaç:** Keycloak / nginx / eslint-config iddialarını gerçekle hizala. Kod davranışı değişmez.

### Başlamadan önce

- [ ] `docs/ARCHITECTURE.md` okundu
- [ ] `.cursor/rules/architecture.mdc` okundu
- [ ] `.cursor/rules/project-description.mdc` okundu
- [ ] `infrastructure/` altında gerçekten ne var listelendi (`docker` var; `nginx` yok)
- [ ] `packages/` altında `eslint-config` olmadığı doğrulandı
- [ ] Auth’un JWT olduğu doğrulandı: `apps/api/src/core/auth/`

### Yapılacaklar

- [ ] Rules/docs’ta “Keycloak + Passport” → **“JWT (Passport) — Keycloak ertelendi / plan”** olarak güncelle
- [ ] `infrastructure/nginx` iddiasını kaldır veya “prod opsiyonel, repo’da yok” yaz
- [ ] `packages/eslint-config` iddiasını kaldır (veya “henüz yok” de)
- [ ] `docs/NEON_DAY1-2.md` içinde “compose yok” gibi stale ifadeleri düzelt (`infrastructure/docker/docker-compose.yml` var)
- [ ] `docs/ARCHITECTURE.md` içinde `repositories/` maddesini “hedef / ayrı PR, zorunlu değil” diye netleştir
- [ ] CQRS’i “her domain zorunlu” gibi okunuyorsa “karmaşık yazma akışlarında opsiyonel” diye yumuşat

### Dokunulacak dosyalar (beklenen)

- `.cursor/rules/architecture.mdc`
- `.cursor/rules/project-description.mdc`
- `.cursor/rules/security.mdc` (Keycloak geçiyorsa)
- `docs/ARCHITECTURE.md`
- `docs/NEON_DAY1-2.md` (stale ise)
- İlgili sprint planlarında Keycloak “şu an canlı” iddiası varsa dipnot

### Yapılmayacaklar

- [ ] Keycloak servisi / compose ekleme
- [ ] nginx klasörü uydurma
- [ ] eslint-config paketini bu fazda oluşturma (Faz 5’e bırak)

### Bitiş kapısı

- [ ] Repo’da “Keycloak zorunlu / şu an kullanılıyor” yanıltıcı cümle kalmadı (en azından alwaysApply rules + ARCHITECTURE)
- [ ] `rg -i "keycloak|nginx|eslint-config" docs .cursor/rules` çıktısı gözden geçirildi; gerçek dışı zorunluluk yok
- [ ] Uygulama kodu değişmedi (veya yalnızca yorum)
- [ ] Bu dosyada Faz 0 satırı `[x]`

### Agent özet şablonu

```
Faz 0 tamam.
Değişen dosyalar: …
Doğrulama: Keycloak/nginx/eslint iddiaları hizalandı.
Sonraki: Faz 1
```

---

# FAZ 1 — Orphan domain event envanteri

**Amaç:** Emit edilen ama dinlenmeyen event’leri ya bağla ya kaldır/dokümante et.

### Başlamadan önce

- [ ] Faz 0 tamam (veya kullanıcı “Faz 0’ı atla” dedi)
- [ ] Tüm `eventEmitter.emit` / `EventEmitter2` kullanımları listelendi
- [ ] Tüm `@OnEvent(...)` kullanımları listelendi

### Bilinen orphan adayları (doğrula)

- [ ] `user.registered`
- [ ] `partner.registered`
- [ ] `partner.verified`
- [ ] `booking.created`
- [ ] `tour.created`

### Yapılacaklar (her orphan için TEK karar)

Her event için aşağıdaki üçünden **biri**:

1. **Listener ekle** — gerçek ihtiyaç varsa (notification, analytics, audit)
2. **Emit kaldır** — ölü kod
3. **Bilinçli no-op** — kodda kısa yorum + bu runbook’ta “ertelendi: Sprint …” notu

- [ ] Event envanter tablosu bu dosyaya veya `docs/ARCHITECTURE.md` altına eklendi (event → publisher → consumer(s) | none)
- [ ] Orphan kalmadı **veya** her orphan “bilinçli no-op” olarak işaretli

### Doğrulama komutları

```bash
# Emit’ler
rg -n "emit\(|\.emit\(" apps/api/src

# Listener’lar
rg -n "@OnEvent" apps/api/src
```

### Bitiş kapısı

- [ ] Her emit’in 0 (dokümante) veya ≥1 consumer’ı var
- [ ] Mevcut çalışan akışlar bozulmadı (payment.completed, booking.cancelled, review.*, tour.cancelled, catalog.tour.search)
- [ ] Bu dosyada Faz 1 `[x]`

---

# FAZ 2 — Payment refund → booking event

**Amaç:** Refund sonrası `reservation.paymentStatus` yazımını booking listener’a taşı.

### Başlamadan önce

- [ ] Faz 1 tamam (veya kullanıcı atladı)
- [ ] `apps/api/src/modules/payment/services/payment.service.ts` içinde refund + `reservation.update` okundu
- [ ] `apps/api/src/modules/booking/listeners/payment-events.listener.ts` okundu (completed/failed örneği)

### Yapılacaklar

- [ ] Refund yolunda booking şemasına **doğrudan yazımı kaldır**
- [ ] Mevcut veya yeni event yayınla (ör. `payment.refunded` — zaten varsa consumer’a bağla)
- [ ] Booking listener: reservation `paymentStatus` (ve gerekirse status) güncellemesi
- [ ] Notification zaten `refunded` dinliyorsa çift iş yapma; idempotent tut
- [ ] Unit/regresyon: refund sonrası rezervasyon alanı doğru

### Doğrulama

- [ ] `rg -n "paymentStatus|REFUNDED" apps/api/src/modules/payment` — booking yazımı kalmamalı (veya yalnızca kendi payment tablosu)
- [ ] `rg -n "payment\.refunded|REFUNDED" apps/api/src/modules/booking`
- [ ] API build: `pnpm --filter api build` (veya projede geçerli eşdeğer)

### Yapılmayacaklar

- [ ] İyzico akışını yeniden yazma
- [ ] Partner refund UI değiştirme (gerekmiyorsa)

### Bitiş kapısı

- [ ] Refund status transition owning module = booking
- [ ] Build yeşil
- [ ] Bu dosyada Faz 2 `[x]`

---

# FAZ 3 — Partner booking sahipliği (en kritik)

**Amaç:** `partner.service` rezervasyon status / kapasite / payment event’lerini booking domain’inden çalmayı bıraksın.

### Başlamadan önce

- [ ] Faz 2 tamam (önerilir; refund ile aynı aile)
- [ ] `apps/api/src/modules/partner/services/partner.service.ts` içinde COMPLETED / CANCELLED / kapasite / `payment.completed` emit blokları işaretlendi (~satır aralıkları not edildi)
- [ ] `reservation.service.ts` ve booking listener’lar okundu
- [ ] Mevcut partner panel complete/cancel UX’i not edildi (davranış aynı kalacak)

### Alt dilimler (ayrı turlar önerilir)

#### 3A — Envanter + sözleşme

- [ ] Partner’ın yaptığı booking/payment/catalog yazımlarının listesi çıkarıldı
- [ ] Hedef API/event sözleşmesi yazıldı (ör. `PartnerCompletesReservation` → booking command)

#### 3B — Status geçişleri booking’e

- [ ] COMPLETED / CANCELLED yazımı booking service/command’a taşındı
- [ ] Partner yalnızca tetikler (HTTP → booking) veya domain event yayınlar; Prisma ile reservation yazmaz

#### 3C — Kapasite

- [ ] `tourDate` / `activityDate` kapasite artırımı catalog veya booking’in tanımlı yoluna alındı (mevcut cancel listener modeli tercih)
- [ ] Partner doğrudan kapasite yazmıyor

#### 3D — Sahte / çapraz payment emit

- [ ] Partner’ın `payment.completed` emit etmesi kaldırıldı veya payment modülüne delege edildi
- [ ] Booking/notification çift tetiklenmiyor

#### 3E — Service split (davranış aynı)

- [ ] `partner.service.ts` mantıklı parçalara bölündü (dashboard query / actions / …) — isteğe bağlı ama bu fazda başlanabilir
- [ ] God-file satır sayısı belirgin düştü veya sorumluluklar ayrıldı

### Doğrulama senaryoları

- [ ] Partner turu complete → reservation COMPLETED + kapasite tutarlı
- [ ] Partner cancel → reservation CANCELLED + kapasite iade
- [ ] Normal customer payment.completed yolu hâlâ booking listener ile çalışıyor
- [ ] `rg -n "reservation\.(update|updateMany)" apps/api/src/modules/partner` — mümkünse 0 (veya yalnızca okuma)

### Yapılmayacaklar

- [ ] Partner UI redesign
- [ ] Modülü ayrı Nest app yapmak
- [ ] Tüm partner Prisma okumalarını yasaklamak (rapor/liste okuması OK)

### Bitiş kapısı

- [ ] Booking yazma sahipliği partner’da değil
- [ ] Kritik manuel veya unit senaryolar geçti
- [ ] Build yeşil
- [ ] Bu dosyada Faz 3 `[x]`

---

# FAZ 4 — Admin ↔ Content decoupling

**Amaç:** Tek hard ihlali kaldır: Admin → `ContentService` import.

### Başlamadan önce

- [ ] `apps/api/src/modules/admin/services/admin.service.ts` ContentService kullanımı listelendi
- [ ] `apps/api/src/modules/admin/admin.module.ts` ContentModule import’u görüldü
- [ ] Content tarafında public command/query veya controller yüzeyi incelendi

### Yapılacaklar

- [ ] Admin’in content ihtiyaçları için content modülünde **uygulama yüzeyi** tanımla (command/query handler veya dar facade — `ContentService`’i rastgele export etme)
- [ ] `AdminService` içinden `ContentService` import’unu kaldır
- [ ] `AdminModule` içinden `ContentModule` import’unu kaldır (gerekmiyorsa)
- [ ] Admin controller’ın content DTO import’ları mümkünse shared DTO / content public API’ye çekilsin (aynı tur veya hemen sonraki)

### Doğrulama

```bash
rg -n "ContentService|ContentModule" apps/api/src/modules/admin
```

- [ ] Sonuç: service/module import yok
- [ ] Admin content CRUD/list davranışları aynı
- [ ] `pnpm --filter api build`

### Bitiş kapısı

- [ ] Cross-module `*Service` import = 0
- [ ] Bu dosyada Faz 4 `[x]`

---

# FAZ 5 — Module boundary lint (CI)

**Amaç:** Ihlalin geri gelmesini engelle.

### Başlamadan önce

- [ ] Faz 4 tamam (**zorunlu** — aksi halde CI sürekli kırmızı)
- [ ] Kök `eslint.config.mjs` durumu not edildi (şu an boş olabilir)

### Yapılacaklar

- [ ] Kural: `modules/A` → `modules/B/services/**` **yasak**
- [ ] İzin: `modules/*/events/**` (ve gerekirse `dto` için dar istisna — tercihen shared)
- [ ] Nx module boundary **veya** ESLint boundaries **veya** CI’da `rg` fail script’i
- [ ] `.github/workflows/ci.yml` içine boundary check adımı
- [ ] README veya ARCHITECTURE’a “sınır kuralı CI’da” notu

### Doğrulama

- [ ] Bilerek yanlış import eklenince check fail oluyor (kanıt: lokal deneme, sonra geri al)
- [ ] Mevcut kod check’ten geçiyor
- [ ] CI workflow dosyası güncel

### Yapılmayacaklar

- [ ] Tüm cross-schema Prisma okumalarını lint ile yasaklama (çok erken)
- [ ] Keycloak ekleme

### Bitiş kapısı

- [ ] CI’da boundary adımı var ve yeşil
- [ ] Bu dosyada Faz 5 `[x]`

---

# FAZ 6 — Web HTTP tek giriş

**Amaç:** Relative `/api/...` ve dağınık raw fetch’leri `api-client` / `services/` altına topla.

### Başlamadan önce

- [ ] `apps/web/src/services/api-client.ts` okundu
- [ ] `rg -n "fetch\\(['\\\`]/api" apps/web/src` çalıştırıldı
- [ ] `rg -n "getPublicApiBaseUrl" apps/web/src` ile bypass noktaları listelendi

### Bilinen hotspots

- [ ] `components/features/home/hero.tsx` — `fetch('/api/tours/filters')` **önce bunu düzelt**
- [ ] `tours-page-client.tsx`, `tour-detail-client.tsx`
- [ ] `routes-page-client.tsx`, `route-detail-client.tsx`
- [ ] `activities-page-client.tsx`, `activity-detail-client.tsx`
- [ ] `hot-deals.tsx`, `contact-form.tsx`, `bottom-booking-bar.tsx`

### İstisna (bırakılabilir)

- [ ] Presigned S3 upload fetch’leri (`partner-tour-helpers`, `image-upload-field`) — not düş, zorla api-client’a alma

### Yapılacaklar

- [ ] Feature service fonksiyonları (`services/catalog.ts` vb.) veya mevcut service dosyalarına taşı
- [ ] Component’ler yalnızca service/api-client çağırsın
- [ ] Hata/`error.code` formatı api-client ile tutarlı kalsın
- [ ] UI metni/layout değişmesin

### Doğrulama

- [ ] `rg -n "fetch\\(['\\\`]/api" apps/web/src` → 0 (veya bilinçli Next route istisnası dokümante)
- [ ] Marketing katalog / tour filters / contact smoke manuel veya Playwright
- [ ] `pnpm --filter web build`

### Bitiş kapısı

- [ ] Relative Nest-bypass `/api` kalmadı
- [ ] Bu dosyada Faz 6 `[x]`

---

# FAZ 7 — Fat UI split (parity koru)

**Amaç:** Dev dosyaları parçala; görünen UI aynı kalsın.

### Başlamadan önce

- [ ] `.cursor/rules/ui-parity-no-simplify.mdc` okundu
- [ ] Hedef dosya seçildi (önerilen sıra aşağıda)
- [ ] Ekranın mevcut section listesi not edildi (split öncesi checklist)

### Önerilen sıra (her dosya ayrı tur)

1. [ ] `tour-form.tsx` (~3742)
2. [ ] `tour-detail-client.tsx` (~2362)
3. [ ] `tours-page-client.tsx` (~1528)
4. [ ] `activities-page-client.tsx` (~1337)
5. [ ] `checkout-client.tsx` (~1224)

### Her split turunda

- [ ] Alt bileşenlere ayır (`components/features/.../`)
- [ ] State/data hook’a taşı (gerekirse)
- [ ] Görsel/hierarchy aynı (parity checklist)
- [ ] “Temiz UI” / stil iyileştirmesi **yok**
- [ ] Build yeşil

### Bitiş kapısı (dosya başına)

- [ ] Ana dosya belirgin küçüldü
- [ ] Side-by-side: section’lar kaybolmadı
- [ ] Bu runbook’ta ilgili dosya `[x]`

### Faz 7 genel bitiş

- [ ] En az `tour-form.tsx` tamamlandı (minimum bar)
- [ ] Bu dosyada Faz 7 `[x]` (kısmi ise not düş: “tour-form done, others pending”)

---

# FAZ 8 — Kritik test + CI

**Amaç:** P0/P1 regresyon ağını kur.

### Başlamadan önce

- [ ] Faz 2–4 tamam (test edilecek davranış stabil)
- [ ] Faz 5 boundary CI ideally yeşil

### Yapılacaklar

- [ ] Unit: payment refund → booking listener
- [ ] Unit: partner complete/cancel → booking ownership (doğrudan partner reservation write yok)
- [ ] Mevcut `*.spec.ts` kırılmadı
- [ ] CI: Jest (veya projedeki test runner) api unit adımı
- [ ] Playwright: ortam yoksa skip kalsın; varsa `critical-flow` CI opsiyonel job

### Yapılmayacaklar

- [ ] Her CQRS thin proxy’ye test yazma
- [ ] %100 coverage hedefi

### Bitiş kapısı

- [ ] Kritik unit’ler lokal geçiyor
- [ ] CI’da en az unit + boundary + build
- [ ] Bu dosyada Faz 8 `[x]`

---

## Cross-schema yazım checklist (Faz 3–4 ile birlikte kullan)

Yeni kod için mini kural (code review):

- [ ] Modül kendi schema’sına yazıyor mu?
- [ ] Yabancı schema yazımı varsa: event/command ile owning modüle mi gidiyor?
- [ ] Admin/analytics **sadece okuma** mı? (yazma varsa gerekçeli + owning delege)

**Şimdilik OK (yasaklama):**

- booking’in catalog ürün/kapasite **okuması**
- admin/analytics agregasyon **okuması**

---

## Agent başlangıç prompt’u (kopyala-yapıştır)

```
docs/ARCHITECTURE_DEBT_RUNBOOK.md dosyasını oku.
Yalnızca bir sonraki tamamlanmamış FAZ’ı uygula.
Kurallar: tek faz, önce checklist, yasaklara uy, UI parity bozma, mikroservis yok.
Faz bitince runbook checklist’lerini [x] yap, bitiş kapısını doğrula, özet yaz, DUR.
Sonraki faza geçme — kullanıcı onaylasın.
```

İlk tur için:

```
docs/ARCHITECTURE_DEBT_RUNBOOK.md — FAZ 0’ı uygula. Başka faza geçme.
```

---

## Hızlı referans — kritik dosyalar

| Alan                     | Path                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| Partner god service      | `apps/api/src/modules/partner/services/partner.service.ts`          |
| Reservation              | `apps/api/src/modules/booking/services/reservation.service.ts`      |
| Payment                  | `apps/api/src/modules/payment/services/payment.service.ts`          |
| Payment→booking listener | `apps/api/src/modules/booking/listeners/payment-events.listener.ts` |
| Admin service            | `apps/api/src/modules/admin/services/admin.service.ts`              |
| Web api-client           | `apps/web/src/services/api-client.ts`                               |
| CI                       | `.github/workflows/ci.yml`                                          |
| Architecture doc         | `docs/ARCHITECTURE.md`                                              |

---

## Değişiklik günlüğü (agent doldurur)

| Tarih | Faz | Not |
| ----- | --- | --- |
|       |     |     |
