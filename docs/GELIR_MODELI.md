# TurlaDur — Gelir Modeli (Kanonik)

> **Güncelleme:** 2026-08-16  
> **Sermaye:** 2.000.000 TL giriş kasası  
> **Strateji:** Zorunlu ücretli plan + peşin kayıt → komisyon ikincil  
> **Y1 Hedef:** Kurucu maaş yok · gider tavanı sıkı · kasa korunur  
> **Para birimi:** TRY · Tüm tutarlar KDV hariç

---

## 0. Tek Cümle

> **Acente/rehber/otobüs kayıt + abonelik** ana kasa (kışın da akar);  
> **tur GMV komisyonu** ikincil (büyüdükçe ölçeklenir).  
> 2 Mn sermaye + lean: **Y1 artı veya sıfır**; Y2'de ekip maaşı alınabilir.

---

## 1. Fiyat Listesi (Liste / Lansman)

### 1.1 Acente

|               | **STARTER** | **BRONZE**   | **SILVER**   | **GOLD**          |
| ------------- | ----------- | ------------ | ------------ | ----------------- |
| **Aylık**     | 0 TL        | **2.490 TL** | **4.990 TL** | **9.990 TL**      |
| Canlı tur     | 0           | 5            | 20           | geniş*            |
| Featured slot | 0           | 2            | 8            | 20                |
| GMV komisyonu | —           | %12          | %10          | %8                |
| Arama vitrin  | —           | Rozet        | Üst bant     | Anasayfa şeridi** |
| Destek        | —           | E-posta      | Öncelikli    | Öncelikli + call  |

> \*Spam tavanı ~200 tur; üstü onay.  
> \*\*Gold anasayfa: plan dahil 1 slot; fazlası §1.4 upsell.

**Kayıt / onboarding ücreti:** **7.900 TL · tek seferlik** (VERIFIED anında)  
**Lansman (ilk 90 gün):** Kayıt **4.900** · Bronze **1.990** (sonra liste fiyatı)  
**Yıllık peşin:** 12 ay peşin → **%15 indirim** (nakit + churn avantajı)  
**Deneme:** 14 gün Bronze özellikleri (kart zorunlu / iptale kadar)  
**Bakım:** Ayrı 6 aylık fatura **yok** — aylığa gömülü.

> **Fiyat Gerekçesi (Piyasa Benchmark):** TourOperation başlangıç yazılımı 2.499 TL/ay (müşteri yok).  
> TurlaDur Bronze = yazılım + müşteri kanalı + ödeme altyapısı → %20 premium makul.  
> Global OTA komisyonu %20–30 iken bizim %8–12 komisyon acentenin net gelirini koruyor.

---

### 1.2 Rehber

|                           | **FREE** | **PRO**    | **PRO+**     |
| ------------------------- | -------- | ---------- | ------------ |
| **Aylık**                 | 0 TL     | **990 TL** | **1.990 TL** |
| Takvim + atama            | ✓        | ✓          | ✓            |
| Acente aramasında öncelik | —        | ✓          | ✓            |
| Destinasyon öne çıkma     | —        | —          | ✓            |
| "Öne çıkan rehber" rozeti | —        | —          | Ayda 2       |

**Kayıt / TUREB doğrulama ücreti:** **2.490 TL · tek seferlik**

---

### 1.3 Otobüs Firması

|                            | **BASIC**              | **FLEET**    | **FLEET+**   |
| -------------------------- | ---------------------- | ------------ | ------------ |
| **Aylık**                  | **1.990 TL**           | **3.490 TL** | **7.490 TL** |
| Araç kotası                | 3                      | 10           | Sınırsız*    |
| Takvim + atama             | ✓                      | ✓            | ✓            |
| Acente vitrin önceliği     | —                      | ✓            | ✓            |
| Destinasyon / filo sponsor | —                      | —            | ✓            |
| Ek araç (kota üstü)        | **490 TL / araç / ay** | —            | —            |

**Kayıt ücreti:** **7.900 TL · tek seferlik**

> \*Spam tavanı ~50 araç; üstü onay.

---

### 1.4 Upsell Kataloğu (En Yüksek Marj)

| Ürün                       | Fiyat                                    | Ne Verir?                                 |
| -------------------------- | ---------------------------------------- | ----------------------------------------- |
| Ekstra featured slot       | **1.990 TL / slot / ay**                 | Plan kotası üstü                          |
| Destinasyon sponsor        | **7.900 TL / hafta**                     | Destinasyon listesinde sabit üst 1–3 sıra |
| Anasayfa hero/şerit ek tur | **12.900 TL / hafta**                    | Gold hakkı dışı ek yayın                  |
| "Öne çıkan acente" rozeti  | Bronze'a **2.490 TL/ay** (Silver+ dahil) | Profil güven sinyali                      |

---

### 1.5 Komisyon Mekanizması

Komisyon **yalnızca tur GMV'sinden** alınır. Rehber/otobüs ücretlerine komisyon yok.

| Plan       | Brüt | − İyzico ~%4,29 | Net take (iade öncesi) |
| ---------- | ---- | --------------- | ---------------------- |
| Bronze %12 | 12%  | →               | **~%7,7 GMV**          |
| Silver %10 | 10%  | →               | **~%5,7 GMV**          |
| Gold %8    | 8%   | →               | **~%3,7 GMV**          |

**Mix ortalaması** (%60 Bronze / %30 Silver / %10 Gold): ağırlıklı brüt ~%11 → net ≈ **GMV × %6,5**  
İade ~%5–8 → gerçek net portföy ortalaması **~%6 GMV**.

**Neden yüksek planda komisyon düşer?**  
Upgrade teşviki: çok satan acente Gold'a geçer → abonelik + düşük %; acente için birim maliyet düşer.

---

## 2. Ürün Kuralları

### 2.1 Acente Yaşam Döngüsü

```
Başvuru
  → KYC / VKN doğrulama
  → VERIFIED
  → Kayıt ücreti ödenir (19.900 / lansman 9.900)
  → Plan seç (Bronze/Silver/Gold) veya 14 gün deneme
  → Tur oluştur (taslak: ücretsiz)
  → PUBLISH: yalnızca aktif ücretli plan + kota içinde
  → Featured: plan slot'una tur bağla

Ödeme başarısız / plan süresi dolar:
  → 3 gün grace → yeni PUBLISH engeli
  → 7 gün → mevcut canlı turlar UNLISTED
  → Panel: rezervasyon/geçmiş okunur; yeni satış yok
```

### 2.2 Sert Kurallar

1. `AgencyPlan` ≠ `SellerTier` — plan satılır; tier performans rozeti, satılmaz.
2. VERIFIED + kayıt ücreti olmadan plan aktive olmaz.
3. Plan kotası aşımı → yeni PUBLISH engeli; mevcutlar kalır.
4. Featured slot: tura bağlı; tur silinince slot boşalır.
5. Anasayfa şeridine tur eklemek Gold planı + slot bağlama gerektirir.
6. Rehber atama: FREE ile de kabul/red yapılabilir (ağ için bariyer düşük).
7. Otobüs atama: en az BASIC (veya aktif 14 gün deneme).

### 2.3 Para Kimin Elinden Geçer?

```
Müşteri ──ödeme──► Platform (İyzico) ──komisyon kes──► Acente (payout)
                        │
                        ├── Acente   : plan + kayıt + featured + GMV komisyonu
                        ├── Rehber   : kayıt + Pro/Pro+ (komisyon YOK)
                        └── Otobüs   : kayıt + plan + ek araç (komisyon YOK)
```

---

## 3. Y1 Gelir Projeksiyonu

### 3.1 Satış Hedefleri (Baz Senaryo)

| Metrik                 | Y1 Hedef                                       |
| ---------------------- | ---------------------------------------------- |
| Acente kayıt (yıl)     | **30–35**                                      |
| Yıl sonu ödeyen acente | **25–32** (%55 Bronze / %35 Silver / %10 Gold) |
| Rehber kayıt           | **40–60** · Pro/Pro+ **20–35**                 |
| Otobüs firma           | **8–12**                                       |
| Tur GMV                | **8–12 Mn TL** (zorlamadan)                    |

### 3.2 Gelir Formülü (Aylık, Kod / Raporlama için)

```
gelir_ay =
  Σ (aktif_acente_plan.aylık_ücret)
  + Σ (ekstra_slot × 1.990)
  + Σ (sponsor_paketleri)
  + kayıt_ücretleri_bu_ay (acente + rehber + otobüs)
  + Σ (tur_gmv × plan.brüt_komisyon) − iyzico − iade_payı
  + Σ (rehber_pro_plan)
  + Σ (bus_plan + ek_araç)
```

### 3.3 Sezon + Ramp Çarpanı

Yaz zirve, kış dip. Yeni platform olduğu için ilk aylarda arz/talep olgunlaşmamış.

| Ay      | Birleşik çarpan | Baz rezervasyon* | Baz GMV      |
| ------- | --------------- | ---------------- | ------------ |
| Oca     | 0,25            | 50               | ~425k        |
| Şub     | 0,35            | 70               | ~595k        |
| Mar     | 0,55            | 110              | ~968k        |
| Nis     | 0,80            | 160              | ~1,44 Mn     |
| May     | 1,10            | 220              | ~2,02 Mn     |
| Haz     | 1,40            | 280              | ~2,66 Mn     |
| Tem     | 1,60            | 320              | ~3,20 Mn     |
| Ağu     | 1,55            | 310              | ~3,10 Mn     |
| Eyl     | 1,25            | 250              | ~2,45 Mn     |
| Eki     | 0,95            | 190              | ~1,81 Mn     |
| Kas     | 0,60            | 120              | ~1,08 Mn     |
| Ara     | 0,55            | 110              | ~990k        |
| **Yıl** |                 | **~2.190**       | **~20,7 Mn** |

> \*Baz: olgun ay = 200 rezervasyon × 9.500 TL = 1.900.000 TL GMV

### 3.4 Ay ay Gelir (Baz Senaryo, 2 Mn sermaye — Revize Fiyatlar)

| Ay      | Abonelik + kayıt (SaaS) | Komisyon net   | Featured / upsell | **Toplam Gelir** |
| ------- | ----------------------- | -------------- | ----------------- | ---------------- |
| Oca     | 52.000                  | 23.000         | 0                 | **75.000**       |
| Şub     | 68.000                  | 32.000         | 0                 | **100.000**      |
| Mar     | 88.000                  | 53.000         | 3.000             | **144.000**      |
| Nis     | 105.000                 | 79.000         | 5.000             | **189.000**      |
| May     | 122.000                 | 111.000        | 8.000             | **241.000**      |
| Haz     | 135.000                 | 146.000        | 12.000            | **293.000**      |
| Tem     | 140.000                 | 176.000        | 16.000            | **332.000**      |
| Ağu     | 140.000                 | 170.000        | 14.000            | **324.000**      |
| Eyl     | 135.000                 | 135.000        | 10.000            | **280.000**      |
| Eki     | 130.000                 | 99.000         | 7.000             | **236.000**      |
| Kas     | 125.000                 | 60.000         | 3.000             | **188.000**      |
| Ara     | 120.000                 | 55.000         | 3.000             | **178.000**      |
| **Yıl** | **~1.360.000**          | **~1.139.000** | **~81.000**       | **≈ 2.580.000**  |

> SaaS içinde: acente abonelik + kayıt + rehber Pro + otobüs planları dahil.  
> ⚠️ Eski fiyatlarla Y1 ~3.454.000 TL idi; revize fiyatlarla ~2.580.000 TL. Model hâlâ kârlı (gider ~786k → net ~+1.794.000 TL, kasa sonu ~3.794.000 TL).

---

## 4. Y1 Gider Planı

### 4.1 Gider Kalemleri

| Kalem                                         | Aylık TL        | Yıllık TL     | Not                                 |
| --------------------------------------------- | --------------- | ------------- | ----------------------------------- |
| Kurucu maaş                                   | **0**           | **0**         | Bootstrap; Y2'de kasa ≥ 2,5 Mn iken |
| Operasyon / destek (1 kişi)                   | 0 → 38.000      | ~**300.000**  | İlk 6 ay yok; yazdan itibaren       |
| Teknoloji (Neon, host, CDN, mail, monitoring) | 8.000 → 12.000  | **~110.000**  | Trafige göre artar                  |
| Pazarlama (acente/rehber/otobüs edinme)       | 15.000 → 25.000 | **~220.000**  | Performans + doğrudan satış         |
| Muhasebe + hukuk                              | 6.000           | **72.000**    |                                     |
| E-fatura (Paraşüt vb.)                        | 1.000 → 3.000   | **~24.000**   | İşlem hacmiyle                      |
| Buffer / beklenmeyen                          | 3.000 → 8.000   | **~60.000**   |                                     |
| **Toplam**                                    |                 | **≈ 786.000** |                                     |

### 4.2 Teknoloji Gideri Detayı (Aylık TL)

| Kalem                  | Oca–Mar    | Nis–Haz    | Tem–Ağu     | Eyl–Ara    |
| ---------------------- | ---------- | ---------- | ----------- | ---------- |
| Neon (PostgreSQL)      | 1.500      | 2.500      | 3.500       | 2.500      |
| Vercel / hosting / CDN | 1.200      | 2.200      | 3.200       | 2.200      |
| Object storage (R2)    | 400        | 700        | 1.000       | 700        |
| Monitoring (Sentry)    | 800        | 800        | 800         | 800        |
| E-posta (Resend)       | 300        | 600        | 800         | 600        |
| Domain + DNS + SSL     | 200        | 200        | 200         | 200        |
| GitHub / CI            | 500        | 500        | 500         | 500        |
| E-fatura               | 1.000      | 1.500      | 2.500       | 1.500      |
| **Toplam**             | **~5.900** | **~9.000** | **~12.500** | **~9.000** |

---

## 5. Senaryo Analizi

### 5.1 Özet Tablo

| Senaryo          | Koşul                    | Gelir  | Gider   | **P&L**        | **Kasa Sonu** |
| ---------------- | ------------------------ | ------ | ------- | -------------- | ------------- |
| **(+) İyimser**  | Satış güçlü, maaşsız     | 3,4 Mn | 0,55 Mn | **+2,85 Mn**   | **~4,85 Mn**  |
| **(0) Baz**      | Orta satış, 1 operasyon  | 1,8 Mn | 1,0 Mn  | **+0,8 Mn**    | **~2,8 Mn**   |
| **(−) Kötümser** | Satış yavaş, gider sıkı  | 0,7 Mn | 0,7 Mn  | **~0 / −0,15** | **~1,85 Mn**  |
| **(−−) KRİTİK**  | Erken maaş + ağır reklam | düşük  | 2,5 Mn+ | **−1,5…−2,0**  | **~0–0,5 Mn** |

> **4×75k net Y1, 2 Mn sermaye ile mümkün değil.** Yalnız personel gideri ~6,2 Mn/yıl.

### 5.2 Baz Senaryo — Çeyreklik Kasa

| Çeyrek       | Gelir | Gider | Çeyrek Net | Kasa           |
| ------------ | ----- | ----- | ---------- | -------------- |
| Başlangıç    | —     | —     | —          | **2.000.000**  |
| Q1 (Oca–Mar) | ~319k | ~220k | +~99k      | ~2.099.000     |
| Q2 (Nis–Haz) | ~723k | ~260k | +~463k     | ~2.562.000     |
| Q3 (Tem–Eyl) | ~936k | ~290k | +~646k     | ~3.208.000     |
| Q4 (Eki–Ara) | ~602k | ~250k | +~352k     | **~3.560.000** |

> Revize fiyatlarla da baz senaryo Y1 boyunca kasayı eritmez; her çeyrek artıda.  
> Eski fiyatlarla kasa sonu ~4.434.000 TL idi; yeni fiyatlarla ~3.560.000 TL — fark ~874.000 TL.

### 5.3 Kötümser Senaryo — Nakit Planı

```
2 Mn koy
  → Az yak (~700k/yıl)
  → Peşin üyelik / kayıt topla
  → (−) senaryo bile kasa ~1,85 Mn korunur
  → Y2'de kasa ≥ 2,5 Mn iken maaş aç
```

### 5.4 Duyarlılık

| Değişiklik                   | Baz P&L'e Etki               |
| ---------------------------- | ---------------------------- |
| Komisyon +%2 (Bronze %14)    | +~250k                       |
| Pazarlama %30 kes            | +~66k                        |
| Reservasyon +%30 (tüm yıl)   | +~342k                       |
| 1 kurucu maaş (55k/ay) ekle  | −660k                        |
| 2 kurucu maaş (105k/ay) ekle | −1.260k                      |
| Acente sayısı +10 (yıl sonu) | +~600k (abonelik + komisyon) |

---

## 6. Y2 Hedef ve Maaş Koşulu

### 6.1 Y2 Gelir Tahmini (Olgun)

| Kalem                         | Y2            |
| ----------------------------- | ------------- |
| Ödeyen acente                 | 60–80         |
| Rehber Pro/Pro+               | 60–100        |
| Otobüs firması                | 20–30         |
| Acente SaaS + kayıt + vitrin  | ~6,5–7,5 Mn   |
| Acente net komisyon           | ~1,6 Mn       |
| Rehber geliri                 | ~2,0 Mn       |
| Otobüs geliri                 | ~2,2 Mn       |
| **Y2 Toplam Gelir**           | **~12–13 Mn** |
| Gider (4 kişi ~75k net ~7 Mn) | ~7,2 Mn       |
| **Y2 Net**                    | **~+5–6 Mn**  |

### 6.2 Maaş Açma Koşulları

Y2'de maaş ancak **aşağıdakilerin tamamı** karşılanınca:

- [ ] Yıl sonu kasa **≥ 2.500.000 TL**
- [ ] Ödeyen acente **≥ 50**
- [ ] Son 3 ay gelir ortalama **≥ 250.000 TL/ay**
- [ ] Runway (kasa / aylık gider) **≥ 12 ay**

---

## 7. İtiraz Yönetimi

| İtiraz                             | Cevap                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| "Neden üyelik + komisyon?"         | Üyelik = vitrin/yazılım; komisyon = getirdiğimiz satış + ödeme altyapısı. Gold'da % düşer.                 |
| "Agentis.pro ücretsiz"             | Onlar son tüketici satmıyor / tahsilat yapmıyor. Biz müşteri + POS getiriyoruz.                            |
| "Kışın satmıyorum, üyelik boşa"    | Sezonluk pause: yılda 1×, 30 gün (featured kapalı). Veya 3 ay peşin %20 indirim.                           |
| "7.900 kayıt çok pahalı"           | Lansman 4.900 TL (ilk 90 gün). Agentsoft yıllık website paketi 8.000 TL — biz müşteri de getiriyoruz.      |
| "Aylık 2.490 yüksek"               | Günde ~83 TL; 1 tur satışı çoğu zaman karşılar. TourOperation başlangıç yazılımı 2.499 TL ama müşteri yok. |
| "Komisyonsuz sadece reklam alsam?" | Güven + fraud kontrolü zayıflar; platforma bağlanma teşviki kalkar.                                        |

---

## 8. Şema / Kod Karşılıkları

| İş Kavramı           | Şema Alanı / Model                                                        |
| -------------------- | ------------------------------------------------------------------------- |
| Satılan plan         | `AgencyPlan` enum: STARTER / BRONZE / SILVER / GOLD                       |
| Abonelik kaydı       | `AgencySubscription` (agencyId, plan, status, currentPeriodEnd, cancelAt) |
| Featured slot sayısı | `planFeaturedSlots` (plandan)                                             |
| Tura bağlı slot      | `Tour.featuredUntil` veya `FeaturedPlacement`                             |
| Komisyon oranı       | `AgencyCommissionRate` (plandan default; override istisnai)               |
| Kayıt ücreti         | `registrationFeePaidAt` / `RegistrationInvoice`                           |
| Performans rozeti    | `SellerTier` — satılmaz, ayrı hesaplanır                                  |
| Upsell satın alımı   | `AddonPurchase` (EXTRA_SLOT, DESTINATION_SPONSOR, …)                      |
| Rehber planı         | `GuidePlan` enum: FREE / PRO / PRO_PLUS                                   |
| Otobüs planı         | `BusCompanyPlan` enum: BASIC / FLEET / FLEET_PLUS                         |
| Nakit akışı raporu   | `Commission`, `Earning`, `Payout`, `BankInfo` (Faz 7)                     |

---

## 9. Uygulama Önceliği (Gelir Tarafı)

| Sıra | Ne                                               | Neden                       |
| ---- | ------------------------------------------------ | --------------------------- |
| 1    | VERIFIED + kayıt ücreti + Bronze zorunlu publish | Supply kalitesi + ilk nakit |
| 2    | Featured slot (plana gömülü, görünür değer)      | Üyeliğin somut faydası      |
| 3    | Plana göre komisyon (otomatik)                   | Upgrade ekonomisi           |
| 4    | Ekstra slot satışı (upsell)                      | En yüksek marj              |
| 5    | Sponsor / destinasyon paketleri                  | Talep olgunlaşınca          |
| 6    | Yıllık peşin indirim                             | Nakit akışını öne al        |
| 7    | Rehber Pro / Otobüs Fleet                        | Ekosistem genişlet          |

---

## 10. Bilinçli Olarak Yapılmayanlar

- Ücretsiz listing + ince komisyon (Y1–Y2 platformu batırır)
- Sadece SaaS, komisyon 0 (büyük satıcıyı bağlamakta zayıf)
- 4×75k net maaş Y1, 2 Mn sermaye ile
- Ağır Google Ads / marka yatırımı (ROI belirsiz, kasa erir)
- Komisyonsuz rehber/otobüs ücret kesimi (supply öldürür)
- `SellerTier` ile `AgencyPlan`'ı karıştırmak
- Ayrı 6 aylık bakım faturası (churn artırır; aylığa gömülü)
- Hotel / konaklama satışı (MVP dışı, drop edildi)
