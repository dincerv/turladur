# Sprint B — Feature Wiring (Backend → Frontend Bağlantıları)

> **Süre:** 1–2 hafta  
> **Önkoşul:** Sprint A tamamlandı (Neon dev/staging ayakta)  
> **Hedef:** Backend'de LOCAL TAMAM olan tüm özelliklerin frontend'e bağlanması  
> **Kural:** UI/tasarım değiştirilmez · Sadece data wiring · Davranış korunur

---

## Genel İlerleme

| #   | Madde                                       | Öncelik | Durum |
| --- | ------------------------------------------- | ------- | ----- |
| B1  | AgencyStaff Permissions UI                  | P1      | [ ]   |
| B2  | Checkout pickupPointId + TourExtra wiring   | P1      | [ ]   |
| B3  | Finans / Payout / BankInfo FE wiring        | P1      | [ ]   |
| B4  | Notification multi-aktör inbox wiring       | P1      | [ ]   |
| B5  | TourExtra / boarding — tur detay + checkout | P2      | [ ]   |
| B6  | Related Tours + TourMetrics                 | P2      | [ ]   |
| B7  | Favori / Kupon / Kampanya wiring            | P2      | [ ]   |
| B8  | PDF / Manifest export                       | P2      | [ ]   |

---

## B1 — AgencyStaff Permissions UI (P1)

### Durum

- Backend: `StaffPermissionsGuard` TAMAM — granular permission kontrolü var
- Backend: AgencyStaff CRUD endpoint'leri var (`/identity/agency/*` + sub-user controller)
- Frontend: `/acente/kullanicilar` sayfası iskelet veya yok

### API endpoint'leri (backend)

```
GET    /identity/agency/staff          → AgencyStaff listesi
POST   /identity/agency/staff          → Yeni staff ekle
PATCH  /identity/agency/staff/:id      → Permission güncelle
DELETE /identity/agency/staff/:id      → Staff kaldır
GET    /identity/agency/staff/:id/permissions → Permissions detay
```

### Frontend — dokunulacak dosyalar

```
apps/web/src/app/(agency)/acente/users/page.tsx   ← yeni veya mevcut iskelet
apps/web/src/services/identity.ts                  ← AgencyStaff CRUD metotları ekle
```

### Yapılacaklar

- [ ] `apps/web/src/services/identity.ts` → AgencyStaff listele/oluştur/güncelle/sil metotları ekle
- [ ] `/acente/kullanicilar` sayfası: staff listesi tablosu
- [ ] Staff ekle butonu + modal/form (isim, email, rol, permissions checkbox)
- [ ] Permission toggle: her permission için switch (mevcut `StaffPermissions` enum'a bak)
- [ ] Staff silme (confirm modal)
- [ ] Hata mesajları Türkçe

### Smoke testi

- [ ] Acente owner login → `/acente/kullanicilar` açılıyor
- [ ] Yeni staff ekle → listede görünüyor
- [ ] Staff permission güncelle → kaydediliyor
- [ ] Staff sil → listeden kalkıyor
- [ ] `AGENCY_VIEWER` rolü → sadece okuma (yazma butonları gizli)

---

## B2 — Checkout pickupPointId + TourExtra Wiring (P1)

### Durum

- Backend: `pickupPointId`, `guestInfo`, `extras`, `hold` (10dk) tamamı Faz 3'te yapıldı
- Frontend: checkout formu bu alanları API'ye **göndermeyebilir**

### Kontrol edilecekler

```bash
# Checkout submit payload'ında bu alanlar var mı kontrol et:
apps/web/src/components/features/checkout/checkout/
apps/web/src/services/booking.ts
```

### API — CreateReservationDto beklentisi

```typescript
// Aşağıdakilerin form'dan gönderilmesi gerekiyor:
{
  tourDateId: string;
  participantCount: number;
  pickupPointId?: string;     // ← eksik olabilir
  guestInfo?: GuestInfo[];    // ← eksik olabilir
  extras?: ExtraItem[];       // ← eksik olabilir
}
```

### Yapılacaklar

- [ ] `apps/web/src/services/booking.ts` → CreateReservation tipini incele
- [ ] Checkout form'unda pickup point seçici var mı? Yoksa ekle (tasarım mevcut kalır)
- [ ] Guest bilgi alanı (ad/soyad/TC) varsa API'ye gönder
- [ ] TourExtra seçenekleri tur detay sayfasında göster
- [ ] Hold endpoint'i → checkout başladığında `POST /booking/hold` çağır
- [ ] Hold süresi dolunca (10dk) kullanıcıyı uyar

### Smoke testi

- [ ] Tur detay → checkout → pickup point seçilebiliyor
- [ ] Form submit → API'de `pickupPointId` var
- [ ] Hold alındı → 10dk timer görünüyor
- [ ] TourExtra varsa listelenip seçilebiliyor

---

## B3 — Finans / Payout / BankInfo FE Wiring (P1)

### Durum

- Backend Faz 7: Commission, Earning, Payout, BankInfo — LOCAL TAMAM
- Frontend: `/acente/finans` sayfası iskelet (görsel var mı kontrol et)

### API endpoint'leri

```
GET /partner/financials/summary          → Toplam kazanç, bekleyen, çekilebilir
GET /partner/financials/earnings         → Kazanç geçmişi
GET /partner/financials/payouts          → Ödeme geçmişi
POST /partner/financials/payout-request  → Para çekme talebi
GET /partner/bank-info                   → Banka bilgisi
POST /partner/bank-info                  → Banka bilgisi kaydet
PATCH /partner/bank-info                 → Güncelle
```

> Not: Endpoint path'lerini `apps/api/src/modules/payment/controllers/` ve `apps/api/src/modules/partner/controllers/` içinde doğrula.

### Frontend — dokunulacak dosyalar

```
apps/web/src/app/(agency)/acente/financials/page.tsx
apps/web/src/services/                             ← finans servis metotları
apps/web/src/components/features/partner-dashboard/ ← finans bileşenleri
```

### Yapılacaklar

- [ ] Finans servis dosyası oluştur veya mevcut genişlet: `apps/web/src/services/financials.ts`
- [ ] Dashboard özet kartları: Toplam kazanç / Bu ay / Bekleyen / Çekilebilir
- [ ] Kazanç geçmişi tablosu (tur adı, tarih, tutar, komisyon, net)
- [ ] Ödeme geçmişi tablosu
- [ ] Para çekme talebi formu (miktar + onay modal)
- [ ] Banka bilgisi formu (IBAN, hesap sahibi, banka adı)
- [ ] Tüm tutarlar TRY formatında göster (`Intl.NumberFormat('tr-TR', ...)`)

### Smoke testi

- [ ] `/acente/finans` → özet kartlar yükleniyor
- [ ] Kazanç geçmişi tablosu dolu
- [ ] Banka bilgisi kaydet → "Kaydedildi" mesajı
- [ ] Para çekme talebi → API'ye gönderildi

---

## B4 — Notification Multi-Aktör Inbox Wiring (P1)

### Durum

- Backend Faz 8: Notification servisi, multi-actor (customer/agency/guide/bus) — LOCAL TAMAM
- Frontend: Bell ikonu var ama inbox wiring yok

### API endpoint'leri

```
GET  /notification/inbox           → Okunmamış/tüm bildirimler (paginated)
POST /notification/inbox/:id/read  → Okundu işaretle
POST /notification/inbox/read-all  → Tümünü okundu
DELETE /notification/inbox/:id     → Sil
```

### WebSocket / Realtime

```
# apps/api/src/core/realtime/ → Socket.IO gateway var mı kontrol et
# Varsa: 'notification' event'i dinle
# Yoksa: polling (her 30sn GET /inbox) — ilk aşama için yeterli
```

### Frontend — dokunulacak dosyalar

```
apps/web/src/components/layout/         ← header'daki bell bileşeni
apps/web/src/services/notification.ts   ← mevcut, genişlet
apps/web/src/hooks/                     ← useNotifications hook (yeni)
```

### Yapılacaklar

- [ ] `apps/web/src/services/notification.ts` → inbox listele, okundu işaretle, tümünü okundu metotları
- [ ] `useNotifications` hook: inbox fetch + polling (30sn, yalnızca authenticated + tab active)
- [ ] Header bell ikonu → okunmamış sayısı badge
- [ ] Bell'e tıkla → dropdown inbox (son 5 bildirim + "Tümünü gör")
- [ ] `/acente`, `/rehber`, `/otobus` panellerinin her birinde bell çalışıyor
- [ ] Bildirim tiplerine göre ikon: rezervasyon, atama, ödeme, sistem
- [ ] Realtime varsa: socket event'i dinle, inbox'ı güncelle

### Smoke testi

- [ ] Acente login → bell'de okunmamış sayısı görünüyor
- [ ] Bell → dropdown açılıyor, son bildirimler var
- [ ] Okundu işaretle → sayaç azalıyor
- [ ] Rehber panelinde de aynı çalışıyor

---

## B5 — TourExtra / Boarding — Tur Detay + Checkout (P2)

### Durum

- Backend: `TourExtra` (tip, fiyat, stok) Faz 2'de yapıldı
- Frontend tur detay: Boarding/extras bölümü yok

### API

```
GET /catalog/tours/:id                    → extras[] alanı dönüyor mu kontrol et
GET /catalog/tours/:tourId/extras         → Varsa ayrı endpoint
```

### Yapılacaklar

- [ ] Tur detay sayfasında extras listesi: `apps/web/src/components/features/tour/tour-detail/`
- [ ] Her extra: ad, açıklama, fiyat, stok durumu
- [ ] Checkout'ta seçilen extras → `CreateReservationDto.extras`
- [ ] Boarding bilgisi (varsa): alış noktaları haritası veya liste

---

## B6 — Related Tours + TourMetrics (P2)

### Durum

- Backend Faz 6: `TourMetrics` (görüntüleme, rezervasyon sayısı, rating avg) + `RelatedTours` (Tag) — LOCAL TAMAM
- Frontend: Tur detay'da "Benzer Turlar" bölümü yok; metrics gösterilmiyor

### API

```
GET /catalog/tours/:id/related   → İlgili tur listesi
GET /catalog/tours/:id           → metrics { viewCount, bookingCount, avgRating, reviewCount } dahil mi?
```

### Yapılacaklar

- [ ] Tur detay alt bölümü: "Benzer Turlar" slider/grid
- [ ] `apps/web/src/services/catalog.ts` → getRelatedTours metodu
- [ ] Acente dashboard: tur metrikleri özet (görüntüleme, rezervasyon, puan)
- [ ] Marketing tur listesinde sıralama: viewCount / avgRating opsiyonu (API destekliyorsa)

---

## B7 — Favori / Kupon / Kampanya Wiring (P2)

### Durum

- Backend Faz 8: `Favorite`, `Coupon`, `SearchQueryLog` — LOCAL TAMAM
- Frontend: favori butonu görsel olabilir ama API bağlı değil; kupon input checkout'ta yok

### API

```
POST   /catalog/favorites/:tourId    → Favoriye ekle
DELETE /catalog/favorites/:tourId    → Favoriden kaldır
GET    /catalog/favorites            → Favori listesi

POST   /promotion/coupons/validate   → Kupon doğrula
POST   /booking/apply-coupon         → Checkout'ta kupon uygula
```

### Yapılacaklar

**Favoriler:**

- [ ] Tur kart ve tur detay'da kalp/bookmark ikonu
- [ ] `apps/web/src/services/favorite.ts` → add/remove/list metotları (mevcut dosya var, genişlet)
- [ ] `/bookings` veya `/profile` altında "Favorilerim" sekmesi
- [ ] Authenticated değilse → `/login?callbackUrl=...`

**Kupon:**

- [ ] Checkout sayfasında "Kupon Kodu" input alanı (mevcut tasarıma ekle)
- [ ] Kupon doğrulama → indirim tutarı göster
- [ ] Geçersiz kupon → Türkçe hata mesajı

**Kampanya:**

- [ ] `/acente/financials` → aktif kampanyalar listesi (varsa)
- [ ] Marketing `/campaigns` sayfası — API'den kampanya çek (şu an statik mi kontrol et)

---

## B8 — PDF / Manifest Export (P2)

### Durum

- Backend: Rezervasyon detay API'si var; PDF generate servisi varlığını kontrol et
- Frontend: Acente rezervasyon detay'ında "PDF İndir" butonu yok

### API

```
GET /booking/reservations/:id/manifest   → PDF buffer veya URL
GET /booking/reservations/:id/pdf        → Varsa
```

### Yapılacaklar

- [ ] Acente rezervasyon detay: "Manifesto PDF İndir" butonu
- [ ] `Blob` response → `URL.createObjectURL` → otomatik download
- [ ] Dosya adı: `rezervasyon-{id}-{tarih}.pdf`
- [ ] Backend'de PDF service yoksa: html-to-pdf veya basit template → sonra

---

## Sprint B — Genel Bitiş Kapısı

- [ ] B1: AgencyStaff CRUD + permissions UI çalışıyor
- [ ] B2: Checkout pickupPointId + extras API'ye gönderiliyor
- [ ] B3: Finans/payout/banka sayfaları veri çekiyor
- [ ] B4: Notification inbox çalışıyor, tüm aktörlerde bell var
- [ ] B5: TourExtra tur detay'da görünüyor
- [ ] B6: Related tours + metrics wiring
- [ ] B7: Favori toggle + kupon input çalışıyor
- [ ] B8: PDF indirme butonu (backend varsa)
- [ ] Hiçbir sayfada "dummy-data" kullanılmıyor
- [ ] Tüm hata mesajları Türkçe
- [ ] Bu dosyada tüm yapılan maddeler `[x]`

---

## Öneri: Paralel Çalışma Planı

```
Geliştirici 1:          Geliştirici 2:
B1 (Permissions)        B3 (Finans)
B2 (Checkout)           B4 (Notification)
B5 (TourExtra)          B7 (Favori/Kupon)
B6 (Related)            B8 (PDF)
```

Her madde bağımsız — paralel başlanabilir.
