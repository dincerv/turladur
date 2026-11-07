# TurlaDur — Y1 tam yıl finansal tablo (Ocak–Aralık)

> **Hedef gelir mimarisi (kanonik):** **§M–§N** fiyatlar · **§O = 2 Mn sermaye ile Y1 işletme planı (zarar minimize).**  
> Bölüm A–L: erken senaryolar. **4×75k net Y1, 2 Mn kasa ile geçerli değil.**

> **Senaryo (A–H):** Proje **1 Ocak’ta canlıya çıktı** varsayımı (baz / gerçekçi).  
> **Para:** TRY · Eski baz model: pazaryeri komisyon %10 · Iyzico ~%4,29 GMV’den  
> **Net işlem geliri (eski tek-komisyon formülü)** ≈ GMV × **%5,5** (POS sonrası, iade gömülü).  
> **§M’de** komisyon plana göre %8–%12; net take plan mix’ine göre hesaplanır.

Bu bir **tahmin**; garanti değil. Amaç: ay ay ne girer, ne çıkar, yıl sonunda ne kalır.

---

## A) Sabit varsayımlar (tüm yıl)

### Gelir

| Kalem                         | Varsayım                                   |
| ----------------------------- | ------------------------------------------ |
| Platform komisyon             | %10 (brüt)                                 |
| Iyzico                        | %4,29 + ihmal edilen 0,25 TL               |
| **Sizin net take (ortalama)** | **GMV × %5,5**                             |
| AOV (sepet: tur + ekstra)     | 8.500 → 10.500 TL (yıl içinde hafif artar) |
| Featured / reklam geliri      | Y1’de küçük; yazdan itibaren               |

### Teknoloji giderleri (aylık sabit + büyüme)

| Kalem                              | Aylık (TL)        | Not                       |
| ---------------------------------- | ----------------- | ------------------------- |
| Neon (Postgres)                    | 1.500 → 4.000     | trafik ile artar          |
| Vercel / hosting / CDN             | 1.200 → 3.500     |                           |
| Object storage + CDN görsel        | 400 → 1.200       |                           |
| Monitoring (Sentry vb.)            | 800               |                           |
| E-posta (Resend/SMTP)              | 300 → 800         |                           |
| Domain + DNS + güvenlik            | 200               | yıllıkın aylığa bölünmüşü |
| GitHub / CI / araçlar              | 500               |                           |
| E-fatura (Paraşüt vb.)             | 1.000 → 2.500     | işlem hacmine bağlı       |
| **Teknoloji ara toplam (ort. ay)** | **~8.000–12.000** | aşağıda ay ay net         |

### İnsan & operasyon (aylık)

| Kalem                               | Aylık (TL) | Not                |
| ----------------------------------- | ---------- | ------------------ |
| Kurucu/teknik 1 (brüt+maliyet denk) | 55.000     | full-stack         |
| Kurucu/ürün 1                       | 50.000     |                    |
| Destek (yarı / outsource)           | 0 → 18.000 | Nisan’dan itibaren |
| Muhasebe + hukuk (aylık pay)        | 6.000      |                    |
| Ofis yok (remote)                   | 0          |                    |

### Pazarlama (aylık — sezon + ramp)

Performans reklam + içerik + acente edinme. Yaz şişer, kış iner.

### Diğer

| Kalem                       | Aylık       |
| --------------------------- | ----------- |
| Beklenmeyen / buffer        | 3.000–8.000 |
| Banka / KKEG / küçük masraf | 1.000       |

---

## B) Sezon & ramp çarpanı

Canlıya yeni çıktığınız için iki etki birden:

1. **Ramp:** Ocak zayıf arz/talep; yazda acente + marka oturur.
2. **Sezon:** TR yurt içi tur — yaz zirve, kış dip.

| Ay  | Ramp (arz/talep olgunluğu) | Sezon | Birleşik satış çarpanı* |
| --- | -------------------------- | ----- | ----------------------- |
| Oca | 0,35                       | 0,45  | **0,25**                |
| Şub | 0,45                       | 0,50  | **0,35**                |
| Mar | 0,55                       | 0,75  | **0,55**                |
| Nis | 0,70                       | 0,95  | **0,80**                |
| May | 0,85                       | 1,15  | **1,10**                |
| Haz | 0,95                       | 1,40  | **1,40**                |
| Tem | 1,00                       | 1,60  | **1,60**                |
| Ağu | 1,00                       | 1,55  | **1,55**                |
| Eyl | 1,00                       | 1,25  | **1,25**                |
| Eki | 1,00                       | 0,90  | **0,95**                |
| Kas | 1,00                       | 0,55  | **0,60**                |
| Ara | 1,00                       | 0,50  | **0,55**                |

\*Çarpan, “olgun ay = 200 rezervasyon × 9.500 TL” bazına göre ölçekler.

**Olgun ay referansı (çarpan = 1,00):**  
200 rezervasyon × 9.500 TL = **1.900.000 TL GMV** → net take **104.500 TL**.

---

## C) Ay ay satış (GMV & gelir)

| Ay      | Rezervasyon | AOV    | GMV            | Net take (%5,5) | Featured   | **Toplam gelir** |
| ------- | ----------- | ------ | -------------- | --------------- | ---------- | ---------------- |
| Oca     | 50          | 8.500  | 425.000        | 23.375          | 0          | **23.375**       |
| Şub     | 70          | 8.500  | 595.000        | 32.725          | 0          | **32.725**       |
| Mar     | 110         | 8.800  | 968.000        | 53.240          | 0          | **53.240**       |
| Nis     | 160         | 9.000  | 1.440.000      | 79.200          | 2.000      | **81.200**       |
| May     | 220         | 9.200  | 2.024.000      | 111.320         | 4.000      | **115.320**      |
| Haz     | 280         | 9.500  | 2.660.000      | 146.300         | 6.000      | **152.300**      |
| Tem     | 320         | 10.000 | 3.200.000      | 176.000         | 8.000      | **184.000**      |
| Ağu     | 310         | 10.000 | 3.100.000      | 170.500         | 8.000      | **178.500**      |
| Eyl     | 250         | 9.800  | 2.450.000      | 134.750         | 5.000      | **139.750**      |
| Eki     | 190         | 9.500  | 1.805.000      | 99.275          | 3.000      | **102.275**      |
| Kas     | 120         | 9.000  | 1.080.000      | 59.400          | 2.000      | **61.400**       |
| Ara     | 110         | 9.000  | 990.000        | 54.450          | 2.000      | **56.450**       |
| **Yıl** | **2.190**   | —      | **20.737.000** | **1.140.535**   | **40.000** | **1.180.535**    |

Yıllık kişi (×2,5 kişi/rezervasyon kabaca): **~5.500 bilet/yıl**.

---

## D) Ay ay giderler (detay)

### D1 — Teknoloji (aylık)

| Ay      | Neon  | Hosting/CDN | Storage | Monitor | Mail | Araç/domain | E-fatura | **Teknoloji toplam** |
| ------- | ----- | ----------- | ------- | ------- | ---- | ----------- | -------- | -------------------- |
| Oca     | 1.500 | 1.200       | 400     | 800     | 300  | 700         | 1.000    | **5.900**            |
| Şub     | 1.500 | 1.200       | 400     | 800     | 300  | 700         | 1.000    | **5.900**            |
| Mar     | 1.800 | 1.500       | 500     | 800     | 400  | 700         | 1.200    | **6.900**            |
| Nis     | 2.000 | 1.800       | 600     | 800     | 500  | 700         | 1.400    | **7.800**            |
| May     | 2.500 | 2.200       | 700     | 800     | 600  | 700         | 1.800    | **9.300**            |
| Haz     | 3.000 | 2.800       | 900     | 800     | 700  | 700         | 2.000    | **10.900**           |
| Tem     | 3.500 | 3.200       | 1.000   | 800     | 800  | 700         | 2.500    | **12.500**           |
| Ağu     | 3.500 | 3.200       | 1.000   | 800     | 800  | 700         | 2.500    | **12.500**           |
| Eyl     | 3.000 | 2.800       | 900     | 800     | 700  | 700         | 2.000    | **10.900**           |
| Eki     | 2.500 | 2.200       | 700     | 800     | 600  | 700         | 1.800    | **9.300**            |
| Kas     | 2.000 | 1.800       | 600     | 800     | 500  | 700         | 1.400    | **7.800**            |
| Ara     | 2.000 | 1.800       | 600     | 800     | 500  | 700         | 1.400    | **7.800**            |
| **Yıl** |       |             |         |         |      |             |          | **~107.500**         |

### D2 — İnsan + pazarlama + diğer (aylık)

| Ay      | Maaş×2    | Destek  | Muhasebe/hukuk | Pazarlama | Buffer+banka | **Bu blok toplam** |
| ------- | --------- | ------- | -------------- | --------- | ------------ | ------------------ |
| Oca     | 105.000   | 0       | 6.000          | 25.000    | 4.000        | **140.000**        |
| Şub     | 105.000   | 0       | 6.000          | 30.000    | 4.000        | **145.000**        |
| Mar     | 105.000   | 0       | 6.000          | 40.000    | 5.000        | **156.000**        |
| Nis     | 105.000   | 12.000  | 6.000          | 50.000    | 5.000        | **178.000**        |
| May     | 105.000   | 15.000  | 6.000          | 65.000    | 6.000        | **197.000**        |
| Haz     | 105.000   | 18.000  | 6.000          | 80.000    | 7.000        | **216.000**        |
| Tem     | 105.000   | 18.000  | 6.000          | 90.000    | 8.000        | **227.000**        |
| Ağu     | 105.000   | 18.000  | 6.000          | 85.000    | 8.000        | **222.000**        |
| Eyl     | 105.000   | 15.000  | 6.000          | 55.000    | 6.000        | **187.000**        |
| Eki     | 105.000   | 12.000  | 6.000          | 40.000    | 5.000        | **168.000**        |
| Kas     | 105.000   | 10.000  | 6.000          | 30.000    | 4.000        | **155.000**        |
| Ara     | 105.000   | 10.000  | 6.000          | 28.000    | 4.000        | **153.000**        |
| **Yıl** | 1.260.000 | 128.000 | 72.000         | 618.000   | 66.000       | **~2.144.000**     |

_(Maaş: 55k+50k = 105k/ay × 12 = 1.260k)_

### D3 — Toplam gider ay ay

| Ay      | Teknoloji    | İnsan+pazarlama+diğer | **Toplam gider** |
| ------- | ------------ | --------------------- | ---------------- |
| Oca     | 5.900        | 140.000               | **145.900**      |
| Şub     | 5.900        | 145.000               | **150.900**      |
| Mar     | 6.900        | 156.000               | **162.900**      |
| Nis     | 7.800        | 178.000               | **185.800**      |
| May     | 9.300        | 197.000               | **206.300**      |
| Haz     | 10.900       | 216.000               | **226.900**      |
| Tem     | 12.500       | 227.000               | **239.500**      |
| Ağu     | 12.500       | 222.000               | **234.500**      |
| Eyl     | 10.900       | 187.000               | **197.900**      |
| Eki     | 9.300        | 168.000               | **177.300**      |
| Kas     | 7.800        | 155.000               | **162.800**      |
| Ara     | 7.800        | 153.000               | **160.800**      |
| **Yıl** | **~107.500** | **~2.144.000**        | **≈ 2.251.500**  |

---

## E) Ay ay kâr/zarar (en önemli tablo)

| Ay  | Toplam gelir | Toplam gider | **Ay net**   | **Kümülatif net** |
| --- | ------------ | ------------ | ------------ | ----------------- |
| Oca | 23.375       | 145.900      | **−122.525** | −122.525          |
| Şub | 32.725       | 150.900      | **−118.175** | −240.700          |
| Mar | 53.240       | 162.900      | **−109.660** | −350.360          |
| Nis | 81.200       | 185.800      | **−104.600** | −454.960          |
| May | 115.320      | 206.300      | **−90.980**  | −545.940          |
| Haz | 152.300      | 226.900      | **−74.600**  | −620.540          |
| Tem | 184.000      | 239.500      | **−55.500**  | −676.040          |
| Ağu | 178.500      | 234.500      | **−56.000**  | −732.040          |
| Eyl | 139.750      | 197.900      | **−58.150**  | −790.190          |
| Eki | 102.275      | 177.300      | **−75.025**  | −865.215          |
| Kas | 61.400       | 162.800      | **−101.400** | −966.615          |
| Ara | 56.450       | 160.800      | **−104.350** | **−1.070.965**    |

### Yıl sonu özet

|                                          | TL                             |
| ---------------------------------------- | ------------------------------ |
| Yıllık GMV (acente cirosu platformda)    | **20.737.000**                 |
| Sizin toplam gelir (net take + featured) | **1.180.535**                  |
| Teknoloji giderleri                      | **~107.500**                   |
| İnsan                                    | **~1.388.000** (maaş + destek) |
| Pazarlama                                | **~618.000**                   |
| Muhasebe/hukuk + buffer                  | **~138.000**                   |
| **Toplam gider**                         | **≈ 2.251.500**                |
| **Yıl sonu net kalan (kâr/zarar)**       | **≈ −1.071.000 TL (zarar)**    |

Yani: **proje çıktı, Ocak–Aralık işledi, kasada teorik olarak ~1,07 milyon TL açık** (kurucular maaş aldı varsayımıyla).  
Kurucular maaş almazsa (+1.260.000): yıl sonu **≈ +190.000 TL** civarı — hâlâ ince; tek maaşlı modelde zarar küçülür ama sıfırlanmaz kolay kolay.

---

## F) Nakit okuma (basit)

|                                          | TL                |
| ---------------------------------------- | ----------------- |
| Yıl başı sermaye ihtiyacı (öneri)        | **1,5 – 2,0 Mn**  |
| Yıl içi max kümülatif açık (tabloda Ara) | **~1,07 Mn**      |
| Güvenli yastık (3 ay OpEx)               | +0,5 Mn           |
| **Toplam önerilen runway**               | **~1,8 – 2,5 Mn** |

Yaz aylarında aylık zarar daralır (−55k); kış yeniden açılır (−100k+).

---

## G) Duyarlılık (kısa)

| Değişiklik                         | Yıl sonu net’e kabaca etki  |
| ---------------------------------- | --------------------------- |
| Komisyonu %12 yap (net take ~%7,5) | +~0,4 Mn → zarar ~−0,67 Mn  |
| Pazarlamayı %30 kes                | +~0,18 Mn                   |
| Rezervasyon +%30 (tüm yıl)         | +~0,35 Mn                   |
| Tek kurucu maaş (105k→55k)         | +~0,60 Mn → zarar ~−0,47 Mn |
| Kurucu maaş yok                    | zarar kapanır / hafif artı  |

---

## H) Tek cümle sonuç

**Canlı Y1 (baz):** ~21 Mn TL GMV, sizin kasaya giren ~1,18 Mn, çıkan ~2,25 Mn → **yıl sonunda net ≈ −1,07 Mn TL**.  
Teknoloji ucuz (~0,1 Mn/yıl); asıl yük **maaş + pazarlama**. Kâra giden yol: daha yüksek GMV (daha çok acente/rezervasyon) veya daha düşük sabit insan maliyeti / daha yüksek take rate.

---

---

## I) Yeni gelir: Acente üyelik (Bronze/Silver/Gold) + kayıt + bakım

> **Not (şema):** Hesaplanan `SellerTier` (performans rozeti) ≠ **satılan üyelik planı**.  
> Satılan plan için ürün adı önerisi: **`AgencyPlan`** (BRONZE / SILVER / GOLD) + `featuredTourSlots`.

### I1) Üyelik paketleri (önerilen fiyat — TR KOBİ acente gerçekçi)

| Plan       | Aylık ücret  | Eşzamanlı öne çıkan tur hakkı | Ekstra                              |
| ---------- | ------------ | ----------------------------- | ----------------------------------- |
| **BRONZE** | **1.990 TL** | **2** tur                     | Liste “öne çıkan” rozeti            |
| **SILVER** | **3.990 TL** | **6** tur                     | Arama üst band + kategori vitrin    |
| **GOLD**   | **7.990 TL** | **15** tur                    | Anasayfa şeridi + “önerilen acente” |

- Hak **eşzamanlı slot**: Acente istediği turları slot’a takar/çıkarır; ayda “X kez yayın” değil, **aynı anda X tur featured**.
- Ödeme peşin aylık veya 3/6/12 ay peşin (%10–15 indirim opsiyonel; bu tabloda aylık brüt).

### I2) Kayıt + yazılım bakım (ek gelir)

| Kalem                               | Tutar (öneri) | Sıklık                            | Gerekçe                                          |
| ----------------------------------- | ------------- | --------------------------------- | ------------------------------------------------ |
| **Kayıt / onboarding ücreti**       | **7.500 TL**  | **1 kez** (onay+VERIFIED sonrası) | KYC, panel kurulum, eğitim, sözleşme             |
| **Yazılım bakım / platform ücreti** | **3.500 TL**  | **6 ayda 1**                      | Sunucu payı, güvenlik, güncelleme, destek kotası |

Pesimistte fiyatı bilerek **yüksek tutmadık** (acente direnci yüksek). İleride kayıt 10–15k, bakım 5k denenebilir.

**Yıllık bakım teorik (1 acente):** 3.500 × 2 = **7.000 TL/yıl** (+ aylık plan).

### I3) Acente için yıllık paket maliyeti örneği

|                                 | Bronze      | Silver      | Gold         |
| ------------------------------- | ----------- | ----------- | ------------ |
| Aylık ×12                       | 23.880      | 47.880      | 95.880       |
| Kayıt (Y1)                      | 7.500       | 7.500       | 7.500        |
| Bakım ×2                        | 7.000       | 7.000       | 7.000        |
| **Y1 toplam (acente cebinden)** | **~38.400** | **~62.400** | **~110.400** |

Küçük acente için Bronze ağır; Gold ancak çok satanlara.

---

## J) Pesimist senaryo — üyelik öncesi vs sonrası

### J1) Pesimist satış varsayımları (komisyon tarafı, değişmedi)

|                                     | Değer                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Yıl sonu kayıtlı acente             | 15                                                                                                           |
| Üyelik ödeyen (ort. yıl / yıl sonu) | ramp → yıl sonu **10** ödeyen                                                                                |
| Plan dağılımı (ödeyenler)           | %70 Bronze · %20 Silver · %10 Gold                                                                           |
| Yıllık GMV                          | **~4,8 Mn TL**                                                                                               |
| Net komisyon take (GMV×%5,5)        | **~264.000 TL**                                                                                              |
| Giderler (pesimist)                 | Maaş aynı 1,26 Mn · pazarlama **350k** · tech **90k** · destek+muhasebe+buffer **200k** → **OpEx ≈ 1,90 Mn** |

### J2) Üyelik gelirleri — pesimist (aylık)

**Acente giriş takvimi (kayıt ücreti bu aylarda):**  
Oca 2 · Şub 1 · Mar 2 · Nis 2 · May 2 · Haz 1 · Tem 1 · Ağu 1 · Eyl 1 · Eki 1 · Kas 0 · Ara 1 → **15 kayıt**

**Ödeyen plan stoku (ay sonu, kabaca):**  
Oca 2B · Şub 3B · Mar 4B+1S · Nis 5B+1S · May 6B+1S · Haz 6B+2S · Tem 7B+2S · Ağu 7B+2S · Eyl 7B+2S+1G · Eki–Ara aynı **7B+2S+1G**

| Ay      | Kayıt ücreti (×7.500) | Abonelik (B/S/G) | Bakım*      | **SaaS gelir** | Komisyon net | **Toplam gelir** |
| ------- | --------------------- | ---------------- | ----------- | -------------- | ------------ | ---------------- |
| Oca     | 15.000                | 3.980            | 0           | 18.980         | 11.000       | **29.980**       |
| Şub     | 7.500                 | 5.970            | 0           | 13.470         | 15.000       | **28.470**       |
| Mar     | 15.000                | 11.950           | 0           | 26.950         | 24.000       | **50.950**       |
| Nis     | 15.000                | 13.940           | 0           | 28.940         | 35.000       | **63.940**       |
| May     | 15.000                | 15.930           | 0           | 30.930         | 48.000       | **78.930**       |
| Haz     | 7.500                 | 19.920           | 7.000       | 34.420         | 58.000       | **92.420**       |
| Tem     | 7.500                 | 21.910           | 10.500      | 39.910         | 70.000       | **109.910**      |
| Ağu     | 7.500                 | 21.910           | 3.500       | 32.910         | 68.000       | **100.910**      |
| Eyl     | 7.500                 | 29.900           | 7.000       | 44.400         | 52.000       | **96.400**       |
| Eki     | 7.500                 | 29.900           | 7.000       | 44.400         | 40.000       | **84.400**       |
| Kas     | 0                     | 29.900           | 3.500       | 33.400         | 25.000       | **58.400**       |
| Ara     | 7.500                 | 29.900           | 7.000       | 44.400         | 22.000       | **66.400**       |
| **Yıl** | **112.500**           | **~235.000**     | **~45.500** | **~393.000**   | **~468.000** | **≈ 861.000**    |

\*Bakım: her acente katılımının +6. ayında 3.500 (takvim basitleştirildi; toplam ~45,5k).

_Komisyon net satırı: pesimist GMV’nin aya yayılmış kabası (~4,8 Mn × %5,5 ≈ 264k görünüyordu; tabloda sezonla ~468k’ye çıkardım — **düzeltme:** tutarlılık için komisyonu **264k/yıl** sabit paylaştırayım.)_

Yeniden tutarlı komisyon (yıllık 264k, sezon ağırlıklı):

| Ay      | SaaS         | Komisyon net | **Toplam gelir** |
| ------- | ------------ | ------------ | ---------------- |
| Oca     | 18.980       | 8.000        | **26.980**       |
| Şub     | 13.470       | 10.000       | **23.470**       |
| Mar     | 26.950       | 16.000       | **42.950**       |
| Nis     | 28.940       | 22.000       | **50.940**       |
| May     | 30.930       | 28.000       | **58.930**       |
| Haz     | 34.420       | 32.000       | **66.420**       |
| Tem     | 39.910       | 38.000       | **77.910**       |
| Ağu     | 32.910       | 36.000       | **68.910**       |
| Eyl     | 44.400       | 28.000       | **72.400**       |
| Eki     | 44.400       | 20.000       | **64.400**       |
| Kas     | 33.400       | 14.000       | **47.400**       |
| Ara     | 44.400       | 12.000       | **56.400**       |
| **Yıl** | **~393.000** | **264.000**  | **≈ 657.000**    |

### J3) Pesimist gider (düşük pazarlama)

| Kalem                 | Yıllık TL     |
| --------------------- | ------------- |
| Maaş (2 kişi)         | 1.260.000     |
| Destek                | 80.000        |
| Pazarlama             | 350.000       |
| Teknoloji             | 90.000        |
| Muhasebe/hukuk/buffer | 120.000       |
| **Toplam OpEx**       | **1.900.000** |

### J4) Pesimist kâr/zarar — üyelik ÖNCESİ vs SONRASI

|                  | Sadece komisyon  | **+ Üyelik/kayıt/bakım**     |
| ---------------- | ---------------- | ---------------------------- |
| Yıllık gelir     | ~264.000         | **~657.000**                 |
| Yıllık gider     | 1.900.000        | 1.900.000                    |
| **Yıl sonu net** | **≈ −1.636.000** | **≈ −1.243.000**             |
| İyileşme         | —                | **~+393.000** (zarar azalır) |

**Sonuç:** Üyelik modeli pesimistte **zararı ~1,64 Mn → ~1,24 Mn** yapar (~400k ek gelir).  
**Hâlâ eksi** — çünkü 2 maaş (1,26 Mn) tek başına SaaS+komisyonu yutuyor.

### J5) Pesimist — kurucu maaşı yoksa

|                                | Net                                 |
| ------------------------------ | ----------------------------------- |
| Gelir                          | 657.000                             |
| Gider (maaşsız OpEx ≈ 640.000) | 640.000                             |
| **Yıl sonu**                   | **≈ +17.000 (~sıfır / hafif artı)** |

### J6) Ay ay net (pesimist + üyelik, **2 maaşlı**)

Giderleri baz tablonun ~%85’i gibi tuttum (düşük pazarlama): aylık OpEx ~140–180k.

| Ay  | Gelir  | Gider (yaklaşık) | Ay net   | Kümülatif        |
| --- | ------ | ---------------- | -------- | ---------------- |
| Oca | 27.000 | 135.000          | −108.000 | −108.000         |
| Şub | 23.500 | 138.000          | −114.500 | −222.500         |
| Mar | 43.000 | 145.000          | −102.000 | −324.500         |
| Nis | 51.000 | 155.000          | −104.000 | −428.500         |
| May | 59.000 | 165.000          | −106.000 | −534.500         |
| Haz | 66.500 | 175.000          | −108.500 | −643.000         |
| Tem | 78.000 | 180.000          | −102.000 | −745.000         |
| Ağu | 69.000 | 178.000          | −109.000 | −854.000         |
| Eyl | 72.500 | 160.000          | −87.500  | −941.500         |
| Eki | 64.500 | 150.000          | −85.500  | −1.027.000       |
| Kas | 47.500 | 145.000          | −97.500  | −1.124.500       |
| Ara | 56.500 | 145.000          | −88.500  | **≈ −1.213.000** |

_(Yuvarlatılmış; §J4 ile uyumlu ~−1,24 Mn bandı.)_

---

## K) Üyelik modelinin anlamı

| Soru                       | Cevap                                                                          |
| -------------------------- | ------------------------------------------------------------------------------ |
| Pesimist tablo düzelir mi? | **Kısmen:** ~400k ek gelir, zarar ~%25 iner                                    |
| Tek başına kurtarır mı?    | **Hayır** (2 maaşlı modelde)                                                   |
| Asıl fayda                 | Gelir **komisyondan bağımsız** (düşük GMV kışında abonelik taşır)              |
| Risk                       | Acente “neden ödeyeyim?” → ilk 3 ay Bronze deneme / kayıt erteleme gerekebilir |
| Şema                       | `AgencyPlan`, `planFeaturedSlots`, `registrationFeePaidAt`, `maintenanceDueAt` |

### Önerilen ürün kuralı (kısa)

> **Güncel / kanonik kurallar → §M.** Aşağıdakiler §I–J döneminin özeti; bakım artık aylığa gömülü (§M).

1. VERIFIED olmadan plan satılmaz.
2. Kayıt ücreti VERIFIED anında.
3. SellerTier (performans rozeti) ≠ AgencyPlan (satılan abonelik).

---

## L) Tek cümle (§J özeti)

**Pesimist + eski üyelik/kayıt/bakım:** yıllık gelir ~0,26 Mn → **~0,66 Mn**; gider ~1,9 Mn → **net ≈ −1,2 Mn**.  
**Asıl hedef model ve Y2 kâr yolu:** **§M**.

---

## M) Kanonik gelir mimarisi — zorunlu abonelik + öne çıkarma (komisyon ikincil)

### M0) Felsefe (neden bu?)

| Öncelik | Gelir                                      | Marj (kabaca)   | Rol                                |
| ------- | ------------------------------------------ | --------------- | ---------------------------------- |
| **1**   | Acente aboneliği (Bronze/Silver/Gold)      | %85–95          | Ana kasa; kışın da akar            |
| **2**   | Öne çıkarma / ekstra slot / sponsor vitrin | %90+            | En kârlı upsell                    |
| **3**   | Kayıt (onboarding) ücreti                  | %95+            | Bir kerelik; KYC maliyeti karşılar |
| **4**   | Komisyon (plana göre %8–12)                | Net ~%3,5–7 GMV | Ölçek + kötüye kullanım freni      |

**Kural:** “Ücretsiz listing + ince komisyon” Y1–Y2’de platformu batırır.  
**Kural:** “Sadece SaaS, komisyon 0” büyük satıcıyı bağlamakta zayıf + bedava vitrin istismarı.  
**Seçilen hibrit:** **Yayın = ücretli plan zorunlu** + **komisyon plana göre iner** + **slot upsell**.

Hedef gelir karışımı (olgun Y2+): **%50–70 abonelik+vitrin · %30–50 komisyon**.

---

### M1) Plan matrisi (ürün + fiyat)

|                         | **STARTER**                                             | **BRONZE**          | **SILVER**   | **GOLD**                    |
| ----------------------- | ------------------------------------------------------- | ------------------- | ------------ | --------------------------- |
| Amaç                    | Başvuru / taslak                                        | Küçük acente girişi | Büyüme       | Ağır satıcı                 |
| Aylık ücret             | **0 TL**                                                | **4.490 TL**        | **8.990 TL** | **17.990 TL**               |
| Canlı (PUBLISH) tur     | **0**                                                   | **5**               | **20**       | **Sınırsız***               |
| Eşzamanlı featured slot | 0                                                       | **2**               | **8**        | **20**                      |
| Brüt komisyon           | —                                                       | **%12**             | **%10**      | **%8**                      |
| Arama / kategori vitrin | —                                                       | Liste rozeti        | Üst bant     | Anasayfa şeridi hakkı**     |
| Destek                  | E-posta                                                 | E-posta             | Öncelikli    | Öncelikli + onboarding call |
| Deneme                  | 14 gün Bronze özellikleri (kart zorunlu / iptale kadar) | —                   | —            | —                           |

\*Spam tavanı: örn. 200 canlı tur; üstü destek onayı.  
\*\*Anasayfa şeridi: Gold’da **1 eşzamanlı** tur; ekstra sponsor paketle (§M3).

**Bakım:** Ayrı 6 aylık fatura **yok**. Bakım + platform payı aylık ücrete **gömülü**.  
**Kayıt / onboarding:** **19.900 TL · 1 kez** — `VERIFIED` anında (KYC + panel + sözleşme + ilk eğitim).

**Yıllık peşin (opsiyonel):** 12 ay peşin → **%15 indirim** (nakit + churn düşüşü).

#### Acente cebinden Y1 (örnek, aylık ödeme)

|                            | Bronze               | Silver       | Gold         |
| -------------------------- | -------------------- | ------------ | ------------ |
| Abonelik ×12               | 53.880               | 107.880      | 215.880      |
| Kayıt                      | 19.900               | 19.900       | 19.900       |
| **Y1 sabit (komisyonsuz)** | **~73.800**          | **~127.800** | **~235.800** |
| + Komisyon                 | GMV × %12 / %10 / %8 |              |              |

---

### M2) Komisyon nasıl işler?

1. Müşteri tur (+ ekstra) öder → Iyzico.
2. Brüt komisyon = plan oranına göre sepet üzerinden.
3. Iyzico (~%4,29) **sizin brüt komisyonunuzdan** düşülür (mevcut varsayım).
4. İade/chargeback politikası aynı; net take kabaca:

| Plan       | Brüt | − Iyzico ~4,29 | Kabaca net take (iade öncesi) |
| ---------- | ---- | -------------- | ----------------------------- |
| Bronze %12 | 12%  | →              | **~%7,7** GMV                 |
| Silver %10 | 10%  | →              | **~%5,7** GMV                 |
| Gold %8    | 8%   | →              | **~%3,7** GMV                 |

İade ~%5–8 işlemde → portföy ortalaması plan mix’ine bağlı.  
**Örnek mix (ödeyenler %60 B / %30 S / %10 G):** ağırlıklı brüt ≈ %11 → net take ≈ **GMV × ~%6** bandı (eski %5,5’e yakın; Bronze ağırsa biraz yukarı).

**Neden yüksek planda komisyon düşer?** Upgrade teşviki: çok satan acente Gold’a geçer → sizin için abonelik + düşük %; acente için birim maliyet düşer.

**Kim ödemez?** STARTER’da PUBLISH yok → komisyon yok. Taslak tur serbest.

---

### M3) Upsell kataloğu (en yüksek marj)

| Ürün                                   | Fiyat (öneri)                           | Ne verir?                                          |
| -------------------------------------- | --------------------------------------- | -------------------------------------------------- |
| Ekstra featured slot                   | **1.990 TL / slot / ay**                | Plan kotasının üstü                                |
| Destinasyon sponsor (örn. “Kapadokya”) | **7.900 TL / hafta**                    | O destinasyon listesinde sabit üst sıra (1–3 slot) |
| Anasayfa hero/şerit ek tur             | **12.900 TL / hafta**                   | Gold hakkı dışı ek                                 |
| “Öne çıkan acente” rozeti (profil)     | Silver+ dahil; Bronze’a **2.490 TL/ay** | Güven sinyali                                      |

Upsell’ler abonelikten bağımsız faturalanır; plan iptalinde slotlar düşer.

---

### M4) Yaşam döngüsü (ürün kuralları)

```
Başvuru → KYC/VKN → VERIFIED
    → Kayıt ücreti 19.900 (zorunlu)
    → Plan seç (veya 14 gün deneme → Bronze)
    → Tur oluştur (taslak serbest)
    → PUBLISH ancak aktif ücretli plan + kota içi
    → Featured = plan slot’una tur bağla
Ödeme başarısız / plan bitiş:
    → 3 gün grace → yeni PUBLISH kapalı
    → 7 gün → mevcut canlı turlar UNLISTED
    → Panel: rezervasyon/geçmiş okunur; yeni satış yok
```

**Sert kurallar**

1. `AgencyPlan` ≠ `SellerTier` (skor rozeti ayrı).
2. VERIFIED + kayıt ücreti olmadan plan aktive olmaz.
3. Plan kotası aşımı: yeni PUBLISH engeli; mevcutlar kalır veya “en eski unpublish” politikası seçilir (öneri: **yeni publish engeli**).
4. Featured süre: slot’a bağlı; tur silinince slot boşalır.
5. Acente soft-delete yok (önceki karar); plan iptali ≠ hesap silme.

---

### M5) Acente tarafı örnekler (satış mantığı)

**Örnek 1 — Küçük acente (Bronze)**

- Ayda 4 satış × 9.000 TL = 36.000 GMV
- Komisyon brüt %12 = 4.320 · abonelik 4.490 · **aylık ≈ 8.800** (+ kayıt Y1’de amortisman)
- Kendi Google Ads ile aynı 4 satışı almak çoğu zaman daha pahalı + operasyon yükü.

**Örnek 2 — Orta (Silver)**

- 15 satış × 9.000 = 135.000 GMV
- Komisyon %10 = 13.500 + abonelik 8.990 ≈ **22.500/ay**
- 8 featured ile organik/SEO zayıfken görünürlük alır.

**Örnek 3 — Ağır (Gold)**

- 40 satış × 10.000 = 400.000 GMV
- Komisyon %8 = 32.000 + 17.990 ≈ **50.000/ay**
- Bronze’ta kalsaydı: %12 × 400k = 48.000 + 4.490 = **52.490** → Gold hâlâ mantıklı (daha çok slot).

---

### M6) Platform P&L — bu modele göre

#### M6.1 Y1 “lean hedef” (önerilen işletme hali)

| Varsayım                        | Değer                              |
| ------------------------------- | ---------------------------------- |
| Yıl sonu ödeyen acente          | **35** (mix %55 B / %35 S / %10 G) |
| Ort. abonelik / ödeyen          | ≈ **7.400 TL/ay**                  |
| Yıllık abonelik (ramp ~%55)     | **~1,7 Mn**                        |
| Kayıt (40 × 19.900, %85 tahsil) | **~680k**                          |
| Upsell / sponsor                | **~400–500k**                      |
| GMV                             | **~12–18 Mn**                      |
| Net komisyon                    | **~0,7 – 1,1 Mn**                  |
| **Acente toplam Y1**            | **≈ 3,5 – 4,0 Mn**                 |

#### M6.2 Y2 “kâr hedefi” (yalnız acente)

| Varsayım                    | Değer                   |
| --------------------------- | ----------------------- |
| Ödeyen acente               | **60–80**               |
| Ort. abonelik               | **~7.400 TL/ay**        |
| SaaS + kayıt kalan + upsell | **~6,0 – 7,5 Mn / yıl** |
| GMV                         | **~25 – 40 Mn**         |
| Net komisyon                | **~1,3 – 2,2 Mn**       |
| **Acente toplam**           | **~7,5 – 9,5 Mn**       |

Tam ekosistem (rehber+otobüs) → **§N5**.

#### M6.3 Gelir formülü (aylık, kod/rapor için)

```
gelir_ay =
  Σ (aktif_plan.aylık_ücret)
  + Σ (ekstra_slot × 1990)
  + Σ (sponsor_paketleri)
  + kayıt_ücretleri_bu_ay
  + Σ (sipariş.gmv × plan.brüt_komisyon) − iyzico − iade_payı
```

---

### M7) Fiyat psikolojisi & itiraz yönetimi

| İtiraz                          | Cevap                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| “Neden üyelik + komisyon?”      | Üyelik = vitrin/yazılım; komisyon = getirdiğimiz satış + ödeme altyapısı. Gold’da % düşer.  |
| “Agentis ücretsiz B2B”          | Onlar son tüketici satmıyor / tahsilat yapmıyor. Biz müşteri + POS getiriyoruz.             |
| “Kışın satmıyorum, üyelik boşa” | Kış paketi: 3 ay peşin %20 indirim veya sezonluk pause (yılda 1×, 30 gün, featured kapalı). |
| “7.500 kayıt pahalı”            | Liste fiyatı **19.900**; ilk 20 acenteye lansman kampanyası: **9.900**.                     |
| “Aylık yüksek”                  | Bronze 4.490 ≈ günde ~150 TL; 1 tur satışı çoğu zaman karşılar.                             |

**Lansman (ilk 90 gün):** Kayıt **9.900** · Bronze **3.490** (sonra liste) · komisyon aynı.

---

### M8) Şema / ürün karşılıkları (özet)

| Kavram            | Öneri                                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| Satılan plan      | `AgencyPlan` enum: STARTER / BRONZE / SILVER / GOLD                        |
| Abonelik kaydı    | `AgencySubscription` (agencyId, plan, status, currentPeriodEnd, cancelAt)  |
| Slot              | `featuredTourSlots` plandan; `Tour.featuredUntil` veya `FeaturedPlacement` |
| Komisyon          | `AgencyCommissionRate` plandan default; override istisnai                  |
| Kayıt ücreti      | `registrationFeePaidAt` / `RegistrationInvoice`                            |
| Performans rozeti | `SellerTier` — **ayrı**, satılmaz                                          |
| Upsell            | `AddonPurchase` (EXTRA_SLOT, DESTINATION_SPONSOR, …)                       |

Detaylı alanlar `DATABASE_SCHEMA.md`’ye Faz’da işlenir; bu bölüm **iş kuralı kaynağı**.

---

### M9) Uygulama sırası (gelir tarafı)

| Sıra | Ne                                               | Neden                       |
| ---- | ------------------------------------------------ | --------------------------- |
| 1    | VERIFIED + kayıt ücreti + Bronze zorunlu publish | Supply kalitesi + ilk nakit |
| 2    | Featured slot (plana gömülü)                     | Üyeliğin somut değeri       |
| 3    | Plana göre komisyon                              | Upgrade ekonomisi           |
| 4    | Ekstra slot satışı                               | Marj                        |
| 5    | Sponsor / destinasyon paketleri                  | Talep olgunlaşınca          |
| 6    | Yıllık peşin indirim                             | Nakit                       |

---

### M10) Bilinçli olarak yapılmayanlar

- Sonsuz ücretsiz satış (STARTER’da PUBLISH yok).
- Agentis.pro tarzı “aracı değiliz / ücretsiz hub”.
- Komisyonsuz sadece reklam (güven + fraud zayıf).
- Ayrı ağır 6 aylık bakım faturası (churn; §M’de aylığa gömülü).
- `SellerTier` ile plan adlarını karıştırmak.

---

### M11) Tek cümle (§M)

**TurlaDur’un en doğru ve en kârlı yolu:** zorunlu ücretli plan + featured (yüksek liste fiyatı) ana gelir; komisyon ikincil. Zamlı fiyat + rehber/otobüs ile Y2’de **~12–13 Mn gelir / 4×75k net maaşla bile kâr** makul.

---

## N) Tüm ekosistem gelir mantığı — Acente + Rehber + Otobüs

> Şema aktörleri: `Agency` (satış) · `Guide` (TUREB, atama) · `BusCompany`→`Vehicle` (atama) · `User` (müşteri) · Hotel satış yok.  
> **Komisyon yalnız acente tur GMV’sinden.** Rehber/otobüs ücretini platform tahsil etmez (MVP); onlar **abonelik + görünürlük** ile öder.

### N0) Para kimden alınır?

```
Müşteri ──ödeme──► Platform ──komisyon kes──► Acente (payout)
                      │
                      ├── Acente: plan + kayıt + featured + komisyon
                      ├── Rehber: kayıt + (Pro) plan + öne çıkma
                      └── Otobüs firması: kayıt + plan (araç kotası) + öne çıkma
```

| Taraf      | Ne satar platformda?              | Platform parası                                          |
| ---------- | --------------------------------- | -------------------------------------------------------- |
| **Acente** | Tur (+ ekstra) müşteriye          | Plan + kayıt + featured + **GMV komisyonu**              |
| **Rehber** | Kendini acentelere (takvim/atama) | Kayıt + hafif plan / Pro görünürlük — **komisyon yok**   |
| **Otobüs** | Filosunu acentelere               | Kayıt + plan (araç sayısı) / featured — **komisyon yok** |
| **Hotel**  | Satış yok                         | Gelir yok (MVP)                                          |

**Neden rehber/otobüse komisyon yok?** Atama kabulü = iş bağlantısı; ücret acente↔rehber/firma arasında platform dışında. Çift kesinti (tur komisyonu + tekrar %) supply’ı öldürür.

### N1) Acente (ana kasa) — liste fiyatı (§M)

| Plan            | Aylık                 | Yayın | Featured | Komisyon |
| --------------- | --------------------- | ----- | -------- | -------- |
| Bronze          | **4.490**             | 5 tur | 2        | %12      |
| Silver          | **8.990**             | 20    | 8        | %10      |
| Gold            | **17.990**            | geniş | 20       | %8       |
| Kayıt           | **19.900 · 1 kez**    |       |          |          |
| Ekstra featured | **1.990 / slot / ay** |       |          |          |

### N2) Rehber planları

| Plan                    | Aylık                | Ne alır?                                                  |
| ----------------------- | -------------------- | --------------------------------------------------------- |
| **FREE**                | 0                    | Takvim + atama kabul/red (temel)                          |
| **PRO**                 | **1.490 TL**         | Acente aramasında üst sıra · doğrulanmış Pro              |
| **PRO+**                | **2.990 TL**         | + destinasyon bazlı öne çıkma · ayda 2 “öne çıkan rehber” |
| Kayıt / TUREB doğrulama | **4.900 TL · 1 kez** | KYC + TUREB alan kontrolü                                 |

- FREE ile iş alınabilir (ağ için bariyer düşük).
- PRO / PRO+ = görünürlük (asıl rehber geliri).

### N3) Otobüs firması planları

| Plan                | Aylık                  | Araç kotası   | Ne alır?                    |
| ------------------- | ---------------------- | ------------- | --------------------------- |
| **BASIC**           | **2.990 TL**           | **3** Vehicle | Takvim + atama              |
| **FLEET**           | **5.990 TL**           | **10**        | + acente vitrininde öncelik |
| **FLEET+**          | **12.990 TL**          | **sınırsız*** | + destinasyon/filo sponsor  |
| Kayıt (firma)       | **14.900 TL · 1 kez**  |               | VKN/firma doğrulama         |
| Ek araç (kota üstü) | **790 TL / araç / ay** |               |                             |

\*Spam tavanı: örn. 50 araç, üstü onay.

**Kural:** Atama için en az BASIC (veya deneme 14 gün).

### N4) Gelir formülü (tam sistem)

```
gelir_ay =
  Σ agency_plan + Σ featured_extra + Σ sponsor + kayıt_acente
  + Σ (tur_gmv × plan_komisyon) − iyzico − iade
  + Σ guide_pro + kayıt_rehber
  + Σ bus_plan + Σ ek_araç + kayıt_otobüs + bus_sponsor
```

### N5) Örnek yıl sonu — zamlı fiyatlar (4 kişi × 75k net → gider ≈ 7,0 Mn)

Ort. acente plan ≈ **7.400 TL/ay** (mix).

| Kalem                              | Y1 (ramp)     | Y2 (hedef)       |
| ---------------------------------- | ------------- | ---------------- |
| Acente SaaS + kayıt + vitrin       | **~2,8 Mn**   | **~6,5–7,5 Mn**  |
| Acente net komisyon                | ~0,8 Mn       | ~1,6 Mn          |
| Rehber (kayıt + Pro/Pro+; ~40→100) | **~0,6 Mn**   | **~2,0 Mn**      |
| Otobüs (kayıt + plan; ~12→30)      | **~0,7 Mn**   | **~2,2 Mn**      |
| **Toplam gelir**                   | **≈ 4,9 Mn**  | **≈ 12–13 Mn**   |
| Gider                              | 7,0 Mn        | 7,2 Mn           |
| **Şirkete net**                    | **≈ −2,1 Mn** | **≈ +5 … +6 Mn** |

Zamlı liste ile **Y2’de 4×75k net maaşla bile kâr net**; Y1 zarar küçülür (~−4 Mn → ~−2 Mn).

### N6) Ürün kuralları (kısa)

1. Tur PUBLISH = acente ücretli plan.
2. Assignment = karşı taraf VERIFIED (+ otobüste aktif plan).
3. Rehber FREE kalabilir; Pro görünürlük.
4. Komisyon yalnızca tur GMV.
5. `AgencyPlan` · `GuidePlan` · `BusCompanyPlan` — `SellerTier` ayrı.

### N7) Fiyat gerekçesi (neden yükselttik?)

| Eski (düşük)       | Yeni liste | Mantık                                                               |
| ------------------ | ---------- | -------------------------------------------------------------------- |
| Acente kayıt 7.500 | **19.900** | KYC + eğitim + entegrasyon; TÜRSAB/ajans kurulumu ile kıyaslanabilir |
| Bronze 2.490       | **4.490**  | Panel + 2 featured + satış kanalı; günde ~150 TL                     |
| Rehber Pro 690     | **1.490**  | Acente lead’i; 1 tur günü çoğu zaman karşılar                        |
| Otobüs kayıt 4.900 | **14.900** | Ticari filo; araç takvim + atama altyapısı                           |
| Otobüs BASIC 1.490 | **2.990**  | 3 araçlık operasyon yazılımı                                         |

Lansman indirimi ayrı (§M7); liste fiyatı düşük tutulursa 4×75k net ile kâr gecikir.

---

## O) Kanonik işletme planı — giriş sermayesi **2 Mn TL**, Y1 zarar minimize

> **Önceki §N5 (4×75k net)** bu sermaye ile **geçersiz** (yalnız personel ~6,2 Mn).  
> Bu bölüm: **2.000.000 TL kasa ile Y1’i zarar minimize / mümkünse artı** bitirme modeli.

### O0) Kısıtlar

|                     |                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------- |
| Giriş kasası        | **2.000.000 TL**                                                                   |
| Hedef Y1 P&L        | **Zarar ≤ 0,5 Mn** (ideal: **0 / artı**)                                           |
| Hedef yıl sonu kasa | **≥ 1,5 Mn** (yastık; Y2 maaş için)                                                |
| Y1 ekip             | **4×75k net YASAK** · kurucu maaş **0** · en fazla **1** düşük maliyetli operasyon |
| Gelir modeli        | Aynı liste fiyatı (§M/§N) · **peşin kayıt + peşin abonelik** öncelikli             |

### O1) Y1 gider tavanı (zararı küçülten taraf)

| Kalem                                             | Yıllık TL                                     | Not                                            |
| ------------------------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| Kurucu maaş (2–3 kişi)                            | **0**                                         | Bootstrap; geçim dışarıdan                     |
| Operasyon / destek (1 kişi, işveren ~35–40k/ay)   | **0 – 480.000**                               | İdeal: ilk 6 ay 0, sonra gerekirse             |
| Teknoloji (Neon, host, e-posta, izleme, e-fatura) | **120.000**                                   | ~10k/ay                                        |
| Pazarlama (acente/rehber/filo edinme)             | **200.000 – 250.000**                         | Performans + doğrudan satış; marka şişirme yok |
| Muhasebe + hukuk + Domains                        | **80.000**                                    |                                                |
| Buffer (beklenmeyen)                              | **50.000 – 100.000**                          |                                                |
| **Toplam OpEx tavan**                             | **≈ 450k (maaşsız) – 1,0 Mn (1 operasyonlu)** |                                                |

**Kural:** Aylık nakit yakım (gider − gelir) **asla** kasayı 6 ayın altına indirmesin.

### O2) Gelir modeli (revize — aynı fiyat, farklı tahsilat)

Fiyat listesi değişmez (§N). Değişen: **ne zaman / nasıl para alınır** (zarar minimize).

| Öncelik | Uygulama                                                                            |
| ------- | ----------------------------------------------------------------------------------- |
| 1       | Kayıt **peşin** (VERIFIED anında) — acente 19.900 / lansman 9.900                   |
| 2       | Plan **aylık peşin**; mümkünse **3 veya 12 ay peşin** (%10–15 indirim) → erken kasa |
| 3       | İlk 90 gün: kayıt lansman 9.900 + Bronze 3.490 — **adet** için; 91. günden liste    |
| 4       | Rehber/otobüs kaydı peşin; Pro/filo 1. aydan                                        |
| 5       | Komisyon ikincil — GMV peşinde koşup reklam yakma **yok**                           |
| 6       | Featured upsell yazın (Haz–Eyl)                                                     |

### O3) Y1 satış hedefleri (zarar minimize senaryosu)

| Metrik                 | Hedef                          |
| ---------------------- | ------------------------------ |
| Acente kayıt (yıl)     | **28–35**                      |
| Yıl sonu ödeyen acente | **25–32** (çoğu Bronze)        |
| Rehber kayıt           | **40–60** · Pro/Pro+ **20–35** |
| Otobüs firma           | **8–12**                       |
| GMV (tur)              | **6–10 Mn** (zorlamadan)       |

### O4) Y1 P&L — **(+)** / **(0)** / **(−)** senaryoları

Giriş kasası her yerde **2.000.000 TL**. Kurucu maaş **0** (aksi yazılmadıkça).

#### **(+)** İyimser — satış tutar, gider sıkı

| Varsayım              |                    |
| --------------------- | ------------------ |
| Acente kayıt / ödeyen | 40 / ~35           |
| Rehber Pro + otobüs   | güçlü              |
| Gider                 | ~0,55 Mn (maaşsız) |

|                   | TL             |
| ----------------- | -------------- |
| Gelir             | **≈ 3,4 Mn**   |
| Gider             | **≈ 0,55 Mn**  |
| **Y1 P&L**        | **≈ +2,85 Mn** |
| **Yıl sonu kasa** | **≈ 4,85 Mn**  |

#### **(0)** Baz / temkinli — önerilen plan

| Varsayım                 |               |
| ------------------------ | ------------- |
| Acente kayıt / ödeyen    | 30 / ~28      |
| 1 operasyon (yıl ortası) | gider ~1,0 Mn |
| Gelir                    | orta          |

|                   | TL            |
| ----------------- | ------------- |
| Gelir             | **≈ 1,8 Mn**  |
| Gider             | **≈ 1,0 Mn**  |
| **Y1 P&L**        | **≈ +0,8 Mn** |
| **Yıl sonu kasa** | **≈ 2,8 Mn**  |

#### **(−)** Kötümser — satış yavaş, yine hayatta

| Varsayım              |                                            |
| --------------------- | ------------------------------------------ |
| Acente kayıt / ödeyen | 12 / ~10                                   |
| Rehber/otobüs zayıf   |                                            |
| Gider                 | ~0,70 Mn (pazarlama biraz şişer, maaş yok) |

|                   | TL                  |
| ----------------- | ------------------- |
| Gelir             | **≈ 0,70 Mn**       |
| Gider             | **≈ 0,70 Mn**       |
| **Y1 P&L**        | **≈ 0 … −0,15 Mn**  |
| **Yıl sonu kasa** | **≈ 1,85 – 2,0 Mn** |

#### **(−−)** Kırmızı çizgi — disiplin bozulursa

|                                       |                                                   |
| ------------------------------------- | ------------------------------------------------- |
| Erken 2×75k net maaş veya ağır reklam | Gider → 2,5 Mn+                                   |
| Gelir zayıf kalırsa                   | P&L **≈ −1,5 … −2,0 Mn**                          |
| **Yıl sonu kasa**                     | **≈ 0 – 0,5 Mn** → **runway biter / batış riski** |

**Özet tablo**

| Senaryo               | Gelir  | Gider   | P&L            | Kasa sonu     |
| --------------------- | ------ | ------- | -------------- | ------------- |
| **(+)**               | 3,4 Mn | 0,55 Mn | **+2,85 Mn**   | **~4,9 Mn**   |
| **(0)**               | 1,8 Mn | 1,0 Mn  | **+0,8 Mn**    | **~2,8 Mn**   |
| **(−)**               | 0,7 Mn | 0,7 Mn  | **~0 / −0,15** | **~1,9 Mn**   |
| **(−−)** disiplin yok | düşük  | 2,5 Mn+ | **−1,5…−2 Mn** | **~0–0,5 Mn** |

**4×75k net ile 2 Mn:** ilk ~4 ayda kasa biter → **bu planda yok.**

### O5) Ay ay nakit (senaryo B — temkinli, sade)

Giriş: **2.000.000**

| Çeyrek | Gelir (kabaca) | Gider | Çeyrek net | Kasa sonu    |
| ------ | -------------- | ----- | ---------- | ------------ |
| Q1     | 250k           | 220k  | +30k       | ~2,03 Mn     |
| Q2     | 350k           | 250k  | +100k      | ~2,13 Mn     |
| Q3     | 500k           | 280k  | +220k      | ~2,35 Mn     |
| Q4     | 500k           | 250k  | +250k      | **~2,60 Mn** |

### O6) Y2’ye geçiş (2 Mn’lik disiplin bozulmasın)

| Y2 ancak şöyle     |                                                                           |
| ------------------ | ------------------------------------------------------------------------- |
| Kasa ≥ ~2,5 Mn ise | 1–2 kişi **düşük/orta** maaş (75k net ×4 değil)                           |
| Ödeyen acente ≥ 50 | Pazarlama artırılabilir                                                   |
| 4×75k net          | Yıllık gelir **sürekli ≥ 8–9 Mn** ve kasa yastığı ≥ 3 Mn olmadan **açma** |

### O7) Tek cümle (§O)

**2 Mn ile Y1:** pahalı maaş yok; zamlı üyelik/kayıt peşin; gider ≤ ~1 Mn → zarar minimize (çoğu senaryoda **artı**), yıl sonu kasa **~2,5–4 Mn**. 4×75k net bu sermayeyle konuşulmaz.
