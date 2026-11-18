'use client';

import { Building2, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { isValidGeoCoordinate } from '@turta/shared-constants';

import { PhoneInput } from '@/components/ui/phone-input';
import { PickupLocationMap } from '@/components/ui/pickup-location-map-loader';

import { useCheckoutUi } from './checkout-context';
import { clampBirthDateInput, formatPrice } from './checkout.helpers';

/** Split from checkout-client.tsx (Faz 7) — CheckoutStepGuests; UI unchanged. */
export function CheckoutStepGuests() {
  const {
    guests,
    updateGuest,
    isGuest,
    isTour,
    pickupPoints,
    pickupPointId,
    setPickupPointId,
    paidExtras,
    selectedExtraIds,
    togglePaidExtra,
    extrasTotal,
    billingFullName,
    setBillingFullName,
    billingLine1,
    setBillingLine1,
    billingCity,
    setBillingCity,
    billingCountry,
    setBillingCountry,
    taxId,
    setTaxId,
    companyName,
    setCompanyName,
    specialRequests,
    setSpecialRequests,
    handleStep2Next,
    setCurrentStep,
    party,
  } = useCheckoutUi();

  const selectedPickup = pickupPoints.find(
    (point) => point.id === pickupPointId,
  );
  const hasSelectedPickupGeo = isValidGeoCoordinate(
    selectedPickup?.latitude,
    selectedPickup?.longitude,
  );

  return (
    <div className="space-y-6">
      {guests.map((guest, index) => {
        const heading =
          guest.role === 'primary'
            ? isGuest
              ? 'Birincil katılımcı / iletişim'
              : 'Üye bilgileri'
            : guest.role === 'child'
              ? `Çocuk ${guests.filter((g, i) => g.role === 'child' && i <= index).length}`
              : `Ek yetişkin ${index}`;
        return (
          <div
            key={`${guest.role}-${index}`}
            className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-sm sm:p-8"
          >
            <h2 className="mb-4 text-lg font-bold text-neutral-900">
              {heading}
            </h2>
            {!isGuest && guest.role === 'primary' && party.adults > 1 ? (
              <p className="mb-4 text-xs text-neutral-500">
                Üyelik bilgileriniz birincil katılımcı olarak kullanılır. Diğer
                kişiler için ayrı form doldurun.
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Ad <span className="text-red-500">*</span>
                </label>
                <input
                  data-testid={`checkout-guest-first-${index}`}
                  value={guest.firstName}
                  onChange={(e) =>
                    updateGuest(index, {
                      firstName: e.target.value,
                    })
                  }
                  placeholder="Ad"
                  className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  data-testid={`checkout-guest-last-${index}`}
                  value={guest.lastName}
                  onChange={(e) =>
                    updateGuest(index, { lastName: e.target.value })
                  }
                  placeholder="Soyad"
                  className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  TC Kimlik No <span className="text-red-500">*</span>
                </label>
                <input
                  data-testid={`checkout-guest-tckn-${index}`}
                  value={guest.identityNumber}
                  onChange={(e) =>
                    updateGuest(index, {
                      identityNumber: e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 11),
                    })
                  }
                  placeholder="11 haneli TC kimlik no"
                  inputMode="numeric"
                  maxLength={11}
                  className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Doğum Tarihi
                </label>
                <input
                  type="date"
                  value={guest.birthDate}
                  min="1900-01-01"
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) =>
                    updateGuest(index, {
                      birthDate: clampBirthDateInput(e.target.value),
                    })
                  }
                  className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                />
              </div>
              {guest.role === 'primary' ? (
                <>
                  <PhoneInput
                    countryCode={guest.phoneDial}
                    onCountryCodeChange={(dial) =>
                      updateGuest(index, { phoneDial: dial })
                    }
                    value={guest.phoneLocal}
                    onChange={(local) =>
                      updateGuest(index, { phoneLocal: local })
                    }
                    required
                  />
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                      E-posta <span className="text-red-500">*</span>
                    </label>
                    <input
                      data-testid={`checkout-guest-email-${index}`}
                      value={guest.email}
                      onChange={(e) =>
                        updateGuest(index, {
                          email: e.target.value,
                        })
                      }
                      type="email"
                      placeholder="E-posta"
                      className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                      Adres
                      <span className="text-red-500"> *</span>
                    </label>
                    <input
                      data-testid={`checkout-guest-address-${index}`}
                      value={guest.address}
                      onChange={(e) =>
                        updateGuest(index, {
                          address: e.target.value,
                        })
                      }
                      placeholder="Açık adres"
                      className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                      required
                    />
                  </div>
                </>
              ) : null}
            </div>
          </div>
        );
      })}

      {isTour && paidExtras.length > 0 ? (
        <div
          className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-sm sm:p-8"
          data-testid="checkout-extras-panel"
        >
          <h2 className="mb-4 text-lg font-bold text-neutral-900">
            Ekstra hizmetler
          </h2>
          <ul className="space-y-3">
            {paidExtras.map((extra) => {
              const checked = selectedExtraIds.includes(extra.id);
              const lineTotal =
                Number(extra.price) * (party.adults + party.children);
              return (
                <li
                  key={extra.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-neutral-100 px-3 py-3"
                  data-testid={`checkout-extra-${extra.id}`}
                >
                  <label className="flex flex-1 cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={extra.isRequired}
                      onChange={() => togglePaidExtra(extra.id)}
                      className="mt-1"
                      data-testid={`checkout-extra-check-${extra.id}`}
                    />
                    <span>
                      <span className="font-medium text-neutral-900">
                        {extra.title}
                      </span>
                      {extra.isRequired ? (
                        <span className="ml-2 text-xs text-amber-700">
                          Zorunlu
                        </span>
                      ) : null}
                      {extra.description ? (
                        <span className="mt-0.5 block text-xs text-neutral-500">
                          {extra.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                  <span
                    className="shrink-0 text-sm font-semibold text-neutral-900"
                    data-testid={`checkout-extra-price-${extra.id}`}
                  >
                    {formatPrice(lineTotal)}
                  </span>
                </li>
              );
            })}
          </ul>
          <p
            className="mt-3 text-sm font-medium text-neutral-700"
            data-testid="checkout-extras-subtotal"
          >
            Ekstralar: {formatPrice(extrasTotal)}
          </p>
        </div>
      ) : null}

      {isTour && pickupPoints.length > 0 ? (
        <div className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900">
            <MapPin className="h-5 w-5" />
            Kalkış noktası
          </h2>
          <select
            data-testid="checkout-pickup-select"
            value={pickupPointId}
            onChange={(e) => setPickupPointId(e.target.value)}
            className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
          >
            {pickupPoints.map((point) => (
              <option key={point.id} value={point.id}>
                {point.city} — {point.location} ({point.time})
              </option>
            ))}
          </select>
          {hasSelectedPickupGeo && selectedPickup ? (
            <div className="mt-3">
              <PickupLocationMap
                latitude={selectedPickup.latitude}
                longitude={selectedPickup.longitude}
                interactive={false}
              />
            </div>
          ) : null}
          <p className="mt-2 text-xs text-neutral-500">
            Koltuk numarası partner tarafından atanacaktır.
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border border-neutral-200/70 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900">
          <Building2 className="h-5 w-5" />
          Fatura bilgileri
          <span className="text-xs font-normal text-neutral-500">
            (zorunlu)
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Ödeme / fatura sahibi <span className="text-red-500">*</span>
            </label>
            <input
              data-testid="checkout-billing-name"
              value={billingFullName}
              onChange={(e) => setBillingFullName(e.target.value)}
              placeholder="Ad Soyad"
              className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Fatura adresi <span className="text-red-500">*</span>
            </label>
            <input
              data-testid="checkout-billing-line1"
              value={billingLine1}
              onChange={(e) => setBillingLine1(e.target.value)}
              placeholder="Fatura adresi"
              className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Şehir <span className="text-red-500">*</span>
            </label>
            <input
              data-testid="checkout-billing-city"
              value={billingCity}
              onChange={(e) => setBillingCity(e.target.value)}
              placeholder="Şehir"
              className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Ülke <span className="text-red-500">*</span>
            </label>
            <input
              value={billingCountry}
              onChange={(e) => setBillingCountry(e.target.value)}
              placeholder="Ülke"
              className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
              required
            />
          </div>
          <input
            value={taxId}
            onChange={(e) =>
              setTaxId(e.target.value.replace(/\D/g, '').slice(0, 11))
            }
            placeholder="Vergi / TC No (opsiyonel)"
            className="h-11 rounded-lg border border-neutral-300 px-3 text-sm"
            inputMode="numeric"
            maxLength={11}
          />
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Firma unvanı (opsiyonel)"
            className="h-11 rounded-lg border border-neutral-300 px-3 text-sm"
          />
        </div>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Özel istekler / notlar (opsiyonel)"
          className="mt-3 min-h-[88px] w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(0)}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Geri
        </button>
        <button
          type="button"
          data-testid="checkout-guests-next"
          onClick={handleStep2Next}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          Devam et
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
