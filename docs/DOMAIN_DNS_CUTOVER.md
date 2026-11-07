# Domain onay sonrası DNS cutover (`turta.com.tr`)

Natro evrak onayı geldikten sonra uygulanır. Mail = Veridyen; site = Vercel; API = Railway/Fly; medya = R2.

## Tek DNS paneli kuralı

MX/SPF (Veridyen) ile site A/CNAME kayıtları **aynı DNS panelinde** olmalı.

- **Seçenek A (önerilen soft start):** DNS Natro’da kalsın. Sadece gerekli A/CNAME ekle; R2 custom domain Cloudflare’de CNAME isterse Natro’ya o CNAME’i yaz.
- **Seçenek B:** Nameserver’ları Cloudflare’e taşı; Veridyen MX + SPF’i Cloudflare’e kopyala (eski Natro MX sil).

## 1) Veridyen mail (zaten hazırlanan kayıtlar)

| Tür | İsim | Öncelik / değer                                                            |
| --- | ---- | -------------------------------------------------------------------------- |
| MX  | `@`  | 10 → `mx1.guvenlimail.com.tr`                                              |
| MX  | `@`  | 20 → `mx2.guvenlimail.com.tr`                                              |
| MX  | `@`  | 30 → `mx3.guvenlimail.com.tr`                                              |
| MX  | `@`  | 40 → `mx4.guvenlimail.com.tr`                                              |
| TXT | `@`  | `v=spf1 include:out.guvenlimail.com.tr include:mc.guvenlimail.com.tr ~all` |

Tek SPF kaydı; eski SPF varsa değiştir, yanına ikinci ekleme.

## 2) Site + API

Vercel / Railway panelinden verilen hedefler (örnek):

| Tür       | İsim        | Hedef              |
| --------- | ----------- | ------------------ |
| CNAME / A | `@` / `www` | Vercel             |
| CNAME     | `api`       | Railway / Fly host |

SSL: Vercel + Cloudflare (proxy açıksa turuncu bulut) otomatik.

## 3) Medya CDN — `media.turta.com.tr`

1. Cloudflare R2 → bucket `tourtech-media` → **Custom Domains** → `media.turta.com.tr`
2. Cloudflare’in istediği CNAME’i DNS paneline ekle (Natro veya CF zone)
3. Env güncelle:

```env
# API
CDN_URL=https://media.turta.com.tr

# Vercel web
NEXT_PUBLIC_CDN_URL=https://media.turta.com.tr
NEXT_PUBLIC_API_URL=https://api.turta.com.tr/api/v1
```

4. Redeploy API + web. Eski `…/api/v1/storage/media/…` URL’leri `resolveMediaUrl` ile path rewrite edilir (dosya R2’deyse).

## 4) Cache (Cloudflare zone varsa)

- `media.turta.com.tr/*` → Cache Everything / Edge TTL uzun (immutable keys)
- `/_next/static/*` → uzun cache

## 5) Doğrulama

```bash
nslookup -type=mx turta.com.tr
curl -sI https://media.turta.com.tr/<bir-key>
pnpm smoke:media
# Gmail → info@turta.com.tr test
# Partner upload → kartta görsel
```

## Checklist

- [ ] Domain Natro’da aktif
- [ ] Veridyen MX + SPF yayında
- [ ] www / apex → Vercel
- [ ] api → Railway
- [ ] R2 custom domain `media.turta.com.tr`
- [ ] `CDN_URL` + `NEXT_PUBLIC_CDN_URL` güncel
- [ ] Mail + foto smoke OK
