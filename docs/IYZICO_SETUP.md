# İyzico entegrasyonu — şirket kurulmadan / kurulunca

## Bugün (şirket yok, vergi no yok)

Kod tarafı hazır. Key yokken sistem **Mock** kullanır:

| Kart                 | Sonuç                               |
| -------------------- | ----------------------------------- |
| `…0008` veya `…0006` | Mock 3DS ekranı → callback → başarı |
| `…0000`              | Red                                 |
| Diğer                | Anında başarı (3DS yok)             |

Checkout: kart ödeme → 3DS iframe → `/api/v1/payment/3ds/callback` → `/checkout/success`.

Opsiyonel: [Sandbox](https://sandbox-merchant.iyzipay.com/auth/register) aç (genelde vergi zorunlu değil), key’leri `apps/api/.env`’e yaz → gerçek sandbox 3DS.

```env
IYZICO_API_KEY=sandbox-...
IYZICO_SECRET_KEY=sandbox-...
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
IYZICO_CALLBACK_URL=http://localhost:4000/api/v1/payment/3ds/callback
```

Local’de İyzico bankası `localhost`’a dönemeyebilir → **ngrok** ile `IYZICO_CALLBACK_URL` güncelle. Mock 3DS için ngrok gerekmez.

Sandbox SMS: `123456` · [Test kartları](https://docs.iyzico.com/ek-bilgiler/test-kartlari)

## Şirket kurulunca (tek kalan iş)

1. Canlı üye işyeri: [merchant.iyzipay.com](https://merchant.iyzipay.com) (vergi / şirket belgeleri)
2. API Key + Secret Key al
3. Production env (Railway vb.):

```env
IYZICO_API_KEY=live-...
IYZICO_SECRET_KEY=live-...
IYZICO_BASE_URL=https://api.iyzipay.com
IYZICO_CALLBACK_URL=https://api.turta.com/api/v1/payment/3ds/callback
API_PUBLIC_URL=https://api.turta.com
FRONTEND_URL=https://www.turta.com.tr
```

4. API’yi restart et — **kod değişmez**.

## Endpoint’ler

| Method | Path                             | Açıklama                                            |
| ------ | -------------------------------- | --------------------------------------------------- |
| POST   | `/api/v1/payment/checkout`       | Ödeme başlat (auth); `requires3ds` + HTML dönebilir |
| POST   | `/api/v1/payment/3ds/callback`   | Banka/mock 3DS dönüşü → redirect                    |
| POST   | `/api/v1/payment/webhook/iyzico` | Server webhook                                      |
| POST   | `/api/v1/payment/refund`         | Admin iade                                          |
