# Production Deployment (Sprint 18)

## Hedef mimari

| Bileşen        | Önerilen host           | Not                                      |
| -------------- | ----------------------- | ---------------------------------------- |
| `apps/web`     | Vercel                  | Custom domain, SSL otomatik              |
| `apps/api`     | Railway / Fly.io        | `PORT`, health check `/api/v1/health`    |
| PostgreSQL     | Neon `main` branch      | **Pooler** URL kullan (connection limit) |
| Redis          | Upstash / Railway Redis | BullMQ + cache                           |
| Object storage | S3 / R2                 | MinIO sadece local                       |
| CDN            | Cloudflare (opsiyonel)  | Statik + `CDN_URL` görseller             |

## Vercel (`apps/web`)

1. Root Directory: `apps/web`
2. Build: `pnpm --filter web build` (monorepo root install)
3. Env: `NEXT_PUBLIC_API_URL=https://api.turta.com/api/v1`
4. Opsiyonel: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (source maps)

## Railway (`apps/api`)

1. Dockerfile veya Nixpacks; start: `node dist/main.js`
2. Release command: `pnpm prisma migrate deploy --schema=prisma/schema.prisma`
3. Env: `DATABASE_URL` (Neon pooler), `REDIS_URL`, `JWT_SECRET`, `FRONTEND_URL`, `SENTRY_DSN`
4. Health check path: `/api/v1/health`

## Neon

- Develop: branch `develop`; Staging: branch `staging`; Production: branch `production`
- Connection string: `-pooler` host for serverless/API runtime; **Direct** for `prisma migrate deploy`
- CI secrets: `DEV_DATABASE_URL`, `STAGING_DATABASE_URL` (bkz. `.github/workflows/deploy-*.yml`)
- Migration öncesi staging backup (Neon snapshot / `pg_dump`)

## CDN / medya (Sprint 23.19 → soft launch)

- Local / soft launch (**custom domain yok**):  
  `CDN_URL=https://<API_HOST>/api/v1/storage/media` (Nest public proxy → R2)  
  Runbook: [PUBLISH.md](./PUBLISH.md) · R2 panel: [infrastructure/cloudflare/R2_SETUP.md](../infrastructure/cloudflare/R2_SETUP.md)
- Hedef prod: Cloudflare R2 + `https://media.turta.com.tr` — [CDN_CLOUDFLARE.md](./CDN_CLOUDFLARE.md) · [DOMAIN_DNS_CUTOVER.md](./DOMAIN_DNS_CUTOVER.md)
- Env şablon: `infrastructure/cloudflare/soft-launch.env.example`
- Doğrulama: `pnpm check:prod-env` · `pnpm smoke:media`
- `publicUrl` her zaman `CDN_URL` tabanlı; upload `Cache-Control` immutable (unique key)

## GitHub Actions (Sprint 19+)

| Workflow              | Trigger                                                   | Secret                          | Ne yapar               |
| --------------------- | --------------------------------------------------------- | ------------------------------- | ---------------------- |
| `deploy-dev.yml`      | push `develop` + manual                                   | `DEV_DATABASE_URL` (Direct)     | migrate + seed + build |
| `deploy-staging.yml`  | push `staging` + manual                                   | `STAGING_DATABASE_URL` (Direct) | migrate + seed + build |
| `refresh-env-dbs.yml` | cron (dev günlük 03:00 UTC; staging 2 günde bir) + manual | aynı secrets                    | migrate + seed         |

Repo → Settings → Secrets and variables → Actions → Neon **Direct** URL ekle (`DEV_DATABASE_URL`, `STAGING_DATABASE_URL`).

Manuel refresh: Actions → **Refresh Env DBs** → Run workflow → `develop` / `staging` / `both`.

> Cron yalnızca default branch’teki workflow dosyasından çalışır. Hemen test için `workflow_dispatch` kullan.
> Seed idempotent’tir (upsert); demo tur tarihleri her çalışmada ileri alınır. **Production’a seed yok.**

## Cloudflare (P1)

- Proxy `www` + apex → Vercel
- Cache rules: `/_next/static/*`, public images on `CDN_URL`
- API subdomain `api` → Railway (DNS only veya limited proxy)

## Uptime (18.10)

Better Stack / UptimeRobot: GET `https://api.turta.com/api/v1/health` every 1–5 min, alert on non-200 or `data.status !== ok`.

## Soft launch (18.18)

- Staging QA → prod deploy → kapalı beta (davetli partner + test müşteri)
- Sentry + health alert aktif
- Rollback: Vercel instant rollback + Railway previous deployment
