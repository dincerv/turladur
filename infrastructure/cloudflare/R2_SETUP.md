# Cloudflare R2 — turta soft-launch kurulumu

Domain (`turta.com.tr`) onaylanmadan da R2 kullanılabilir. Custom domain sonra: `media.turta.com.tr`.

## 1) Bucket

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage**
2. **Create bucket** → ad: `tourtech-media` → Create
3. Bucket → **Settings** → **CORS Policy** → `r2-cors.json` içeriğini yapıştır → Save

## 2) API token

1. R2 overview → **Manage R2 API Tokens** → **Create API token**
2. Permissions: **Object Read & Write** (bu bucket veya Account)
3. Not et:
   - Access Key ID → `MINIO_ACCESS_KEY`
   - Secret Access Key → `MINIO_SECRET_KEY`
   - Endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` → `MINIO_ENDPOINT`

Account ID: Dashboard sağ üst / R2 overview’da görünür.

## 3) Soft-launch env (custom domain yok)

Railway / API:

```env
MINIO_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
MINIO_ACCESS_KEY=<access_key>
MINIO_SECRET_KEY=<secret_key>
S3_BUCKET=tourtech-media
S3_REGION=auto
S3_FORCE_PATH_STYLE=false
API_PUBLIC_URL=https://<API_HOST>
CDN_URL=https://<API_HOST>/api/v1/storage/media
CORS_ALLOW_VERCEL=true
FRONTEND_URL=https://<YOUR-APP>.vercel.app
```

Vercel / web:

```env
NEXT_PUBLIC_API_URL=https://<API_HOST>/api/v1
NEXT_PUBLIC_CDN_URL=https://<API_HOST>/api/v1/storage/media
```

## 4) Doğrulama

```bash
# API ayaktayken
pnpm smoke:media
```

veya:

```bash
curl -s https://<API_HOST>/api/v1/health
# Partner panel → tur foto yükle → URL …/api/v1/storage/media/tours/…
```

## 5) Domain onayınca

Bkz. [docs/DOMAIN_DNS_CUTOVER.md](../../docs/DOMAIN_DNS_CUTOVER.md) — R2 Custom Domain `media.turta.com.tr`.
