'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Experience, Tour } from '@turta/shared-types';
import type { ActivityDate, User } from '@turta/shared-types';

import { BookingSteps } from '@/components/booking/booking-steps';
import { getPhoneValidationError, isValidFullPhone } from '@/lib/phone-rules';
import { isValidTckn } from '@/lib/tckn';
import { ApiError } from '@/services/api-client';
import { getExperienceById, getExperienceDates } from '@/services/activity';
import {
  getTourById,
  getTourDates,
  getTourPaidExtras,
  getTourPickupPoints,
  type TourDateRow,
  type TourPaidExtra,
  type TourPickupPoint,
} from '@/services/catalog';
import { checkoutPayment, createReservation } from '@/services/booking';
import { guestBootstrap, getProfile } from '@/services/identity';
import { useAuth } from '@/providers/auth-provider';
import { formatFullPhone } from '@/components/ui/phone-input';
import {
  applyProfileToPrimaryGuest,
  detectCardBrand,
  digitsOnly,
  emptyGuest,
  parsePartySize,
  STEPS,
  CARD_BRAND_LABEL,
  type GuestForm,
  type PaymentMethod,
} from './checkout/checkout.helpers';
import {
  CheckoutUiProvider,
  type CheckoutUiContextValue,
} from './checkout/checkout-context';
import { CheckoutStepSummary } from './checkout/checkout-step-summary';
import { CheckoutStepGuests } from './checkout/checkout-step-guests';
import { CheckoutStepPayment } from './checkout/checkout-step-payment';
import { CheckoutStepConfirm } from './checkout/checkout-step-confirm';
import { CheckoutSidebar } from './checkout/checkout-sidebar';
import { CheckoutHoldBanner } from './checkout/checkout-hold-banner';

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, accessToken, user } = useAuth();

  const type = searchParams.get('type'); // tour | activity
  const itemId = searchParams.get('itemId') || '';
  const dateId = searchParams.get('dateId') || '';
  const party = useMemo(() => parsePartySize(searchParams), [searchParams]);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Fresh Nest `/identity/profile` — preferred over login memory snapshot. */
  const [profile, setProfile] = useState<User | null>(null);

  const [tour, setTour] = useState<Tour | null>(null);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [tourDate, setTourDate] = useState<TourDateRow | null>(null);
  const [activityDate, setActivityDate] = useState<ActivityDate | null>(null);

  const [guests, setGuests] = useState<GuestForm[]>([]);
  const [billingFullName, setBillingFullName] = useState('');
  const [billingLine1, setBillingLine1] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingCountry, setBillingCountry] = useState('Türkiye');
  const [taxId, setTaxId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [pickupPoints, setPickupPoints] = useState<TourPickupPoint[]>([]);
  const [pickupPointId, setPickupPointId] = useState('');
  const [paidExtras, setPaidExtras] = useState<TourPaidExtra[]>([]);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('bank_transfer');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [threeDsHtml, setThreeDsHtml] = useState<string | null>(null);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [bankTransferAck, setBankTransferAck] = useState(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);

  const cardBrand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);
  const cardBrandLabel = CARD_BRAND_LABEL[cardBrand];
  const expectedCvcLength = cardBrand === 'amex' ? 4 : 3;
  const primaryEmail = guests[0]?.email?.trim() ?? '';

  useEffect(() => {
    setEmailOtpVerified(false);
  }, [primaryEmail]);

  const isTour = type === 'tour';
  const isActivity = type === 'activity';
  const isGuest = !isAuthenticated;

  useEffect(() => {
    if (!itemId || !dateId || (!isTour && !isActivity)) {
      setError(
        'Eksik rezervasyon bilgisi. Lütfen tur veya aktivite sayfasından tekrar deneyin.',
      );
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        if (isTour) {
          const [t, dates, pickups, extras] = await Promise.all([
            getTourById(itemId),
            getTourDates(itemId),
            getTourPickupPoints(itemId).catch(() => [] as TourPickupPoint[]),
            getTourPaidExtras(itemId).catch(() => [] as TourPaidExtra[]),
          ]);
          setTour(t);
          setTourDate(dates.find((d) => d.id === dateId) ?? dates[0] ?? null);
          const activePickups = pickups.filter((p) => p.isActive !== false);
          // Partner update historically re-created pickups → duplicate rows in DB.
          // Deduplicate by city+location+time for checkout UX (keep first by order).
          const seenPickupKeys = new Set<string>();
          const uniquePickups = [...activePickups]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .filter((point) => {
              const key = [
                point.city.trim().toLocaleLowerCase('tr-TR'),
                point.location.trim().toLocaleLowerCase('tr-TR'),
                point.time.trim(),
              ].join('|');
              if (seenPickupKeys.has(key)) return false;
              seenPickupKeys.add(key);
              return true;
            });
          setPickupPoints(uniquePickups);
          setPickupPointId(uniquePickups[0]?.id ?? '');
          const activeExtras = extras.filter((row) => row.isActive !== false);
          setPaidExtras(activeExtras);
          setSelectedExtraIds(
            activeExtras.filter((row) => row.isRequired).map((row) => row.id),
          );
        } else {
          const [e, dates] = await Promise.all([
            getExperienceById(itemId),
            getExperienceDates(itemId),
          ]);
          setExperience(e);
          setActivityDate(
            dates.find((d) => d.id === dateId) ?? dates[0] ?? null,
          );
          setPickupPoints([]);
          setPickupPointId('');
          setPaidExtras([]);
          setSelectedExtraIds([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Önizleme yüklenemedi');
      } finally {
        setLoading(false);
      }
    })();
  }, [itemId, dateId, isTour, isActivity]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const fresh = await getProfile(accessToken);
        if (!cancelled) setProfile(fresh);
      } catch {
        // Fallback: AuthProvider memory user (login payload).
        if (!cancelled) setProfile(user);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, accessToken, user]);

  useEffect(() => {
    const forms: GuestForm[] = [];
    let primary = emptyGuest('primary');
    const source = profile ?? user;
    if (source) {
      primary = applyProfileToPrimaryGuest(primary, source);
      setBillingFullName(
        `${source.firstName ?? ''} ${source.lastName ?? ''}`.trim(),
      );
      setBillingLine1(source.billingLine1 ?? source.address ?? '');
      setBillingCity(source.billingCity ?? '');
      setBillingCountry(source.billingCountry ?? 'Türkiye');
      setTaxId(source.identityNumber ?? '');
    }
    forms.push(primary);

    const extraAdults = Math.max(0, party.adults - 1);
    for (let i = 0; i < extraAdults; i += 1) {
      forms.push(emptyGuest('adult'));
    }
    for (let i = 0; i < party.children; i += 1) {
      forms.push(emptyGuest('child'));
    }

    setGuests(forms);
  }, [profile, user, party.adults, party.children]);

  const unitPrice = useMemo(() => {
    if (isTour && tourDate) {
      return Number(tourDate.priceOverride ?? tour?.price ?? 0);
    }
    if (isActivity && activityDate) {
      return Number(activityDate.price ?? experience?.price ?? 0);
    }
    return Number(tour?.price ?? experience?.price ?? 0);
  }, [isTour, isActivity, tourDate, activityDate, tour, experience]);

  const partySize = party.adults + party.children;
  const extrasTotal = useMemo(() => {
    return paidExtras
      .filter((extra) => selectedExtraIds.includes(extra.id))
      .reduce((sum, extra) => sum + Number(extra.price || 0) * partySize, 0);
  }, [paidExtras, selectedExtraIds, partySize]);
  const totalPrice = unitPrice * partySize + extrasTotal;

  const togglePaidExtra = (extraId: string) => {
    const extra = paidExtras.find((row) => row.id === extraId);
    if (!extra || extra.isRequired) return;
    setSelectedExtraIds((prev) =>
      prev.includes(extraId)
        ? prev.filter((id) => id !== extraId)
        : [...prev, extraId],
    );
  };

  const title = tour?.title ?? experience?.title ?? 'Rezervasyon';
  const image = tour?.coverUrl ?? null;
  const startDate = tourDate?.startDate ?? activityDate?.startDate ?? null;
  const endDate = tourDate?.endDate ?? activityDate?.endDate ?? null;

  const activeSteps = useMemo(
    () =>
      STEPS.map((step, index) => ({
        ...step,
        status:
          index < currentStep
            ? ('complete' as const)
            : index === currentStep
              ? ('current' as const)
              : ('upcoming' as const),
      })),
    [currentStep],
  );

  const updateGuest = (index: number, patch: Partial<GuestForm>) => {
    setGuests((prev) =>
      prev.map((guest, i) => (i === index ? { ...guest, ...patch } : guest)),
    );
  };

  const validateGuests = (): string | null => {
    for (let i = 0; i < guests.length; i += 1) {
      const guest = guests[i];
      const label =
        guest.role === 'primary'
          ? 'Birincil katılımcı'
          : guest.role === 'child'
            ? `Çocuk ${i}`
            : `Katılımcı ${i + 1}`;

      if (!guest.firstName.trim() || !guest.lastName.trim()) {
        return `${label}: ad ve soyad zorunlu`;
      }

      const tckn = guest.identityNumber.replace(/\D/g, '');
      if (!tckn) {
        return `${label}: TC kimlik no zorunlu`;
      }
      if (!isValidTckn(tckn)) {
        return `${label}: geçerli bir TC kimlik no girin`;
      }

      if (guest.role === 'primary') {
        if (!isValidFullPhone(guest.phoneDial, guest.phoneLocal)) {
          return (
            getPhoneValidationError(guest.phoneLocal, guest.phoneDial) ??
            `${label}: geçerli telefon numarası zorunlu`
          );
        }

        if (!guest.email.trim() || !guest.email.includes('@')) {
          return `${label}: geçerli e-posta zorunlu`;
        }

        if (!guest.address.trim() || guest.address.trim().length < 5) {
          return `${label}: adres zorunlu (en az 5 karakter)`;
        }
      }
    }

    if (isTour && pickupPoints.length > 0 && !pickupPointId) {
      return 'Kalkış noktası seçimi zorunlu';
    }

    if (!billingFullName.trim() || billingFullName.trim().length < 2) {
      return 'Fatura / ödeme sahibi ad soyad zorunlu';
    }

    if (!billingLine1.trim() || billingLine1.trim().length < 5) {
      return 'Fatura adresi zorunlu';
    }
    if (!billingCity.trim()) {
      return 'Fatura şehri zorunlu';
    }
    if (!billingCountry.trim()) {
      return 'Fatura ülkesi zorunlu';
    }

    return null;
  };

  const handleStep2Next = () => {
    const validationError = validateGuests();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  const canProceedPayment =
    emailOtpVerified &&
    (paymentMethod === 'bank_transfer'
      ? bankTransferAck
      : digitsOnly(cardNumber).length >= 15 &&
        digitsOnly(cardExpiry).length === 4 &&
        digitsOnly(cardCvc).length >= expectedCvcLength &&
        cardName.trim().length > 0);

  const handleSubmit = async () => {
    const validationError = validateGuests();
    if (validationError) {
      setError(validationError);
      setCurrentStep(1);
      return;
    }
    if (!dateId) return;

    setSubmitting(true);
    setError(null);

    try {
      const primary = guests[0];
      const primaryPhone = formatFullPhone(
        primary.phoneDial,
        primary.phoneLocal,
      );
      let token = accessToken;

      if (!token) {
        const boot = await guestBootstrap({
          email: primary.email,
          firstName: primary.firstName,
          lastName: primary.lastName,
          phone: primaryPhone,
          address: primary.address,
          billingLine1,
          billingCity,
          billingCountry,
          identityNumber: primary.identityNumber.replace(/\D/g, ''),
        });
        token = boot.accessToken;
      }

      if (!token) {
        throw new Error('Oturum oluşturulamadı');
      }

      const reservation = await createReservation(
        {
          ...(isTour ? { tourDateId: dateId } : { activityDateId: dateId }),
          ...(isTour && pickupPointId ? { pickupPointId } : {}),
          ...(isTour && selectedExtraIds.length > 0
            ? {
                extras: selectedExtraIds.map((tourExtraId) => ({
                  tourExtraId,
                  quantity: partySize,
                })),
              }
            : {}),
          adults: party.adults,
          children: party.children,
          contactEmail: primary.email,
          contactPhone: primaryPhone,
          guests: guests.map((guest, index) => ({
            firstName: guest.firstName.trim(),
            lastName: guest.lastName.trim(),
            birthDate: guest.birthDate.trim() || undefined,
            identityNumber: guest.identityNumber.replace(/\D/g, ''),
            ...(index === 0 || guest.phoneLocal.trim()
              ? {
                  phone: formatFullPhone(guest.phoneDial, guest.phoneLocal),
                }
              : {}),
            ...(index === 0 || guest.email.trim()
              ? { email: guest.email.trim() }
              : {}),
            address: guest.address.trim() || undefined,
          })),
          billing: {
            fullName: billingFullName.trim(),
            line1: billingLine1.trim(),
            city: billingCity.trim(),
            country: billingCountry.trim(),
            taxId:
              (taxId || primary.identityNumber).replace(/\D/g, '') || undefined,
            companyName: companyName || undefined,
          },
          specialRequests: specialRequests.trim() || undefined,
        },
        token,
      );

      if (reservation.holdExpiresAt) {
        setHoldExpiresAt(reservation.holdExpiresAt);
      }

      if (paymentMethod === 'card') {
        const [month, year] = cardExpiry.includes('/')
          ? cardExpiry.split('/')
          : [cardExpiry.slice(0, 2), cardExpiry.slice(2)];
        const payment = await checkoutPayment(
          {
            reservationId: reservation.id,
            cardHolderName: cardName,
            cardNumber: digitsOnly(cardNumber),
            expireMonth: month.trim().padStart(2, '0'),
            expireYear: year.trim().slice(-2),
            cvc: digitsOnly(cardCvc),
          },
          token,
        );

        if (payment.requires3ds && payment.threeDSHtmlContent) {
          // Bank / mock 3DS will POST to API callback → redirect to success
          sessionStorage.setItem(
            'turta.pendingCheckout',
            JSON.stringify({
              bookingNumber: reservation.bookingNumber,
              reservationId: reservation.id,
              title,
              totalPrice,
              paymentMethod,
              startDate: startDate ? String(startDate) : null,
            }),
          );
          setThreeDsHtml(payment.threeDSHtmlContent);
          setSubmitting(false);
          return;
        }
      }

      const params = new URLSearchParams({
        bookingNumber: reservation.bookingNumber,
        reservationId: reservation.id,
        title,
        totalPrice: String(totalPrice),
        paymentMethod,
      });
      if (startDate) params.set('startDate', String(startDate));
      router.push(`/checkout/success?${params.toString()}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_ALREADY_REGISTERED') {
        const callback = `/checkout?${searchParams.toString()}`;
        setError(
          'Bu e-posta ile hesap var. Lütfen giriş yapıp rezervasyona devam edin.',
        );
        router.push(`/login?callbackUrl=${encodeURIComponent(callback)}`);
        return;
      }
      setError(
        err instanceof ApiError ? err.message : 'Rezervasyon tamamlanamadı',
      );
      setCurrentStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  const loginCallback = `/login?callbackUrl=${encodeURIComponent(`/checkout?${searchParams.toString()}`)}`;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-neutral-950" />
          <p className="text-neutral-600">
            Rezervasyon bilgileri yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  if (threeDsHtml) {
    return (
      <div
        className="min-h-screen bg-neutral-950 px-4 py-8 text-white"
        data-testid="checkout-3ds"
      >
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-center text-xl font-semibold">
            3D Secure doğrulama
          </h1>
          <p className="mb-4 text-center text-sm text-neutral-400">
            Banka doğrulama ekranı. Sandbox SMS kodu genelde{' '}
            <strong className="text-white">123456</strong>.
          </p>
          {holdExpiresAt ? (
            <div className="mb-6">
              <CheckoutHoldBanner holdExpiresAt={holdExpiresAt} />
            </div>
          ) : null}
          <iframe
            title="3D Secure"
            className="h-[70vh] w-full rounded-xl border border-neutral-800 bg-white"
            srcDoc={threeDsHtml}
            sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-top-navigation-by-user-activation"
          />
        </div>
      </div>
    );
  }

  if (error && !tour && !experience) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-2 text-xl font-bold text-neutral-900">
            Rezervasyon Başlatılamadı
          </h1>
          <p className="mb-6 text-neutral-600">{error}</p>
          <Link
            href="/tours"
            className="inline-flex rounded-lg bg-neutral-950 px-6 py-2.5 font-semibold text-white hover:bg-neutral-800"
          >
            Turlara Dön
          </Link>
        </div>
      </div>
    );
  }

  const ui: CheckoutUiContextValue = {
    currentStep,
    setCurrentStep,
    isGuest,
    isTour,
    title,
    image,
    startDate,
    endDate,
    party,
    unitPrice,
    extrasTotal,
    totalPrice,
    guests,
    updateGuest,
    paidExtras,
    selectedExtraIds,
    togglePaidExtra,
    pickupPoints,
    pickupPointId,
    setPickupPointId,
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
    paymentMethod,
    setPaymentMethod,
    bankTransferAck,
    setBankTransferAck,
    cardName,
    setCardName,
    cardNumber,
    setCardNumber,
    cardExpiry,
    setCardExpiry,
    cardCvc,
    setCardCvc,
    cardBrand,
    cardBrandLabel,
    expectedCvcLength,
    primaryEmail,
    emailOtpVerified,
    setEmailOtpVerified,
    canProceedPayment,
    submitting,
    handleSubmit,
    holdExpiresAt,
  };

  return (
    <CheckoutUiProvider value={ui}>
      <div
        className="min-h-screen bg-neutral-50 pb-14 pt-8 sm:pt-10"
        data-testid="checkout-page"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                Rezervasyonunu Tamamla
              </h1>
              <p className="text-lg text-neutral-600">
                Bilgilerini kontrol et, katılımcı detaylarını ekle ve
                rezervasyonunu güvenle tamamla.
              </p>
            </div>

            {isGuest ? (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Üye olmadan devam ediyorsunuz. Fatura ve tüm katılımcı bilgileri
                alınacaktır.{' '}
                <Link href={loginCallback} className="font-semibold underline">
                  Giriş yap
                </Link>
              </div>
            ) : null}

            <div className="mb-8">
              <BookingSteps steps={activeSteps} />
            </div>

            {currentStep >= 2 ? (
              <CheckoutHoldBanner
                holdExpiresAt={holdExpiresAt}
                softCountdown={!holdExpiresAt}
              />
            ) : null}

            {error ? (
              <div
                className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                data-testid="checkout-error"
              >
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {currentStep === 0 ? <CheckoutStepSummary /> : null}
                {currentStep === 1 ? <CheckoutStepGuests /> : null}
                {currentStep === 2 ? <CheckoutStepPayment /> : null}
                {currentStep === 3 ? <CheckoutStepConfirm /> : null}
              </div>
              <CheckoutSidebar />
            </div>
          </div>
        </div>
      </div>
    </CheckoutUiProvider>
  );
}

export default CheckoutClient;
