# CDN — Cloudflare R2 (`media.turta.com.tr`) — Sprint 23.19 / soft-launch

> Panel adımları: [infrastructure/cloudflare/R2_SETUP.md](../infrastructure/cloudflare/R2_SETUP.md)  
> Domain sonrası DNS: [DOMAIN_DNS_CUTOVER.md](./DOMAIN_DNS_CUTOVER.md)

## Canlıda metin + görsel görünürlüğü (zorunlu model)

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ Partner     │────▶│ Nest API         │────▶│ Neon PostgreSQL     │
│ upload form │     │ coverUrl, text…  │     │ (tur bilgisi + URL) │
└─────────────┘     └────────┬─────────┘     └─────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐     ┌─────────────────────┐
                    │ R2 / MinIO       │────▶│ CDN media.turta.com │
                    │ (dosya bytes)    │     │ (herkese açık HTTPS)│
                    └──────────────────┘     └──────────┬──────────┘
                                                       │
                             Vercel web ◀──────────────┘
                             next/image + API JSON
```

| Ne                          | Nerede tutulur                                 | Canlıda görünür mü?                                                   |
| --------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| Tur başlık, fiyat, açıklama | Neon (backend DB)                              | Evet — aynı API/DB                                                    |
| Görsel dosyası              | R2 (prod) / MinIO (local)                      | **Sadece dosya R2’deyse**                                             |
| Görsel adresi               | DB’de URL; API yanıtında `CDN_URL` ile resolve | Soft launch: API `/storage/media`; sonra `https://media.turta.com.tr` |

**Kritik:** Local MinIO’ya yüklenen dosya Vercel’den erişilemez. Canlıda göstermek için:

1. Railway API env → R2 + soft launch `CDN_URL=https://<API>/api/v1/storage/media` (sonra `media.turta.com.tr`)
2. Partner **canlı API üzerinden** yeniden yükler (veya MinIO→R2 sync)
3. Vercel `NEXT_PUBLIC_API_URL` → canlı Nest API

API, DB’deki `localhost:9000/...` URL’lerini yanıtta otomatik `CDN_URL` host’una çevirir; **dosyanın kendisi R2’de yoksa** yine 404 olur.

---

## Mimari

```
Browser
  → POST /api/v1/storage/presigned-url  (Nest)
  → PUT  uploadUrl                      (doğrudan R2/MinIO; Cache-Control imzalı)
  → DB’ye publicUrl kaydı               (CDN host: proxy veya media.turta.com.tr/…)
  → next/image + remotePatterns         (media.turta.com.tr / Railway allowlist)
```

| Env             | Değer                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local `CDN_URL` | Soft launch / R2: `http://localhost:4000/api/v1/storage/media` (veya MinIO path). Prod soft launch: `https://<API>/api/v1/storage/media` — [PUBLISH.md](./PUBLISH.md) |
| Prod `CDN_URL`  | Custom domain sonrası: `https://media.turta.com.tr`                                                                                                                   |
| Web (opsiyonel) | `NEXT_PUBLIC_CDN_URL` = aynı CDN / proxy base                                                                                                                         |

`publicUrl` API’de `StorageService.getPublicUrl(key)` = `{CDN_URL}/{key}`.

Upload PUT başlıkları imzada: `Content-Type` + `Cache-Control: public, max-age=31536000, immutable` (dosya adı unique → 1 yıl cache güvenli).

---

## Cloudflare R2 kurulumu (ops runbook)

Adım adım (CORS JSON dahil): **[infrastructure/cloudflare/R2_SETUP.md](../infrastructure/cloudflare/R2_SETUP.md)**

Soft launch (domain yok):

```env
MINIO_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
MINIO_ACCESS_KEY=<r2_access_key>
MINIO_SECRET_KEY=<r2_secret_key>
S3_BUCKET=tourtech-media
S3_REGION=auto
S3_FORCE_PATH_STYLE=false
CDN_URL=https://<API_HOST>/api/v1/storage/media
```

Domain sonrası:

```env
CDN_URL=https://media.turta.com.tr
# Web: NEXT_PUBLIC_CDN_URL=https://media.turta.com.tr
```

### Cloudflare cache (öneri)

- Cache Rule: `media.turta.com.tr/*` → Cache eligible, Edge TTL 1 month+ (objeler immutable key).
- Vercel `_next/static/*` için ayrı zone rule (site domain) — bkz. `docs/DEPLOYMENT.md`.

---

## Local doğrulama

```bash
pnpm docker:up   # MinIO :9000
# apps/api/.env → CDN_URL=http://localhost:9000/tourtech-media
pnpm dev:api
# Partner tur formu → görsel yükle → publicUrl localhost:9000/… olmalı
```

---

## Kod referansları

| Dosya                                             | Rol                                            |
| ------------------------------------------------- | ---------------------------------------------- |
| `apps/api/src/core/storage/storage.service.ts`    | Presign + `CDN_URL` public URL + Cache-Control |
| `apps/api/src/core/storage/storage.controller.ts` | `uploadHeaders` client’a döner                 |
| `apps/web/next.config.ts`                         | `media.turta.com` / R2 remotePatterns          |
| `apps/web/src/lib/media.ts`                       | `resolveMediaUrl` / `getCdnBaseUrl`            |

---

## Checklist (Definition of Done — 23.19)

- [x] `CDN_URL` → public URL sözleşmesi
- [x] Upload `Cache-Control` (CDN-friendly)
- [x] Next.js `media.turta.com` / `media.turta.com.tr` allowlist
- [x] R2 / forcePathStyle env desteği
- [x] Runbook + `infrastructure/cloudflare/` CORS
- [ ] Cloudflare hesabında R2 bucket + soft-launch env (panel)
- [ ] Custom domain `media.turta.com.tr` DNS (domain onay sonrası — DOMAIN_DNS_CUTOVER.md)
