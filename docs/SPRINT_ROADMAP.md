# Turta — Sprint Yol Haritası

> **Güncelleme:** 2026-08-14  
> **Durum:** Auth refresh altyapısı (HttpOnly cookie + sessiz yenileme) **TAMAM**. Neon ve cloud altyapısı henüz yok.  
> **Kural:** UI redesign yok · Cloud deploy onaysız yok · Tasarım bozulmaz

---

## Hızlı Durum Tablosu

| Sprint | Konu                                                 | Süre      | Blocker mı? |
| ------ | ---------------------------------------------------- | --------- | ----------- |
| **A**  | Production Blocker — Neon + Middleware + Security    | 3–5 gün   | **EVET**    |
| **B**  | Feature Wiring — Backend→FE veri bağlantıları        | 1–2 hafta | Hayır       |
| **C**  | Cloud Altyapı — Railway, Upstash, Cloudflare, Sentry | 3–5 gün   | Hayır       |
| **D**  | Teknik Borç — ESLint, hidrasyon, route birleştirme   | 1 hafta   | Hayır       |

---

## Ne Zaman Ne Yapılır

```
[ŞİMDİ]
Sprint A ─── Neon migrate (dev/staging)
         ─── middleware.ts cookie-based auth tamamlama
         ─── Security checklist gözden geçirme
         ─── next.config ignoreDuringBuilds → false hazırlık

[Paralel veya hemen sonra]
Sprint B ─── Finans/Payout FE wiring
         ─── Notification inbox wiring
         ─── Checkout pickupPointId + TourExtra
         ─── AgencyStaff permissions UI
         ─── B4 koltuk paneli smoke

[Sprint B bittikten sonra]
Sprint C ─── Railway/Fly.io API deploy
         ─── Upstash Redis
         ─── Cloudflare R2 entegrasyon
         ─── Sentry + pnpm audit CI

[Her zaman / arka planda]
Sprint D ─── ESLint/TS type hata temizliği
         ─── Hydration mismatch fix
         ─── Çift route grubu temizliği
         ─── Root /app klasörü silme
         ─── URL Türkçeleştirme (ürün onayı)
```

---

## Tamamlanan Altyapı (Karıştırma)

Şu an ÇALIŞAN ve dokunulMAYACAK parçalar:

| Alan                                               | Durum       | Not                                                      |
| -------------------------------------------------- | ----------- | -------------------------------------------------------- |
| Auth JWT + RolesGuard + StaffPermissionsGuard      | TAMAM       |                                                          |
| HttpOnly refresh cookie + rotate                   | TAMAM       | `refresh-cookie.service.ts` + `refresh-token.service.ts` |
| Frontend sessiz yenileme (401 interceptor + retry) | TAMAM       | `api-client.ts` `trySilentRefresh`                       |
| Mount'ta restore (`refreshAccessToken` on boot)    | TAMAM       | `auth-provider.tsx`                                      |
| Multi-actor login (Agency/Guide/Bus)               | TAMAM       | `probeSession`                                           |
| Agency/Guide/Bus panel + shell + dashboard         | TAMAM       | P0-B1-B3                                                 |
| Guide/Vehicle müsaitlik takvimi                    | TAMAM       | P0-B6                                                    |
| Atama paneli (B5)                                  | TAMAM       | `/acente/atamalar`                                       |
| Koltuk paneli UI (B4)                              | LOCAL TAMAM | Smoke edilmedi                                           |
| Backend modüller (identity→commission tamamı)      | LOCAL TAMAM | Faz 0–15b                                                |
| CI workflows (ci.yml, deploy-dev/staging)          | TAMAM       | Neon bağlantı yok                                        |
| Docker compose (postgres, redis, minio, mailhog)   | TAMAM       | Sadece local                                             |
| Nx monorepo yapısı                                 | TAMAM       |                                                          |
| packages/shared-*                                  | TAMAM       |                                                          |

---

## Dosya Referansları

| Sprint      | Detay Dosyası                         |
| ----------- | ------------------------------------- |
| A           | `docs/SPRINT_A_PRODUCTION_BLOCKER.md` |
| B           | `docs/SPRINT_B_FEATURE_WIRING.md`     |
| C           | `docs/SPRINT_C_INFRASTRUCTURE.md`     |
| D           | `docs/SPRINT_D_TECH_DEBT.md`          |
| Bulgular    | `docs/bulgular.md`                    |
| Mimari borç | `docs/ARCHITECTURE_DEBT_RUNBOOK.md`   |
| Güvenlik    | `docs/SECURITY_CHECKLIST.md`          |
| Deploy      | `docs/DEPLOYMENT.md`                  |
