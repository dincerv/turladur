'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TourForm,
  type TourFormData,
} from '@/components/features/partner-dashboard/tour-form';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Info,
  ImageIcon,
  MapPin,
  Calendar,
  Users,
  Tag,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import ReactMarkdown from 'react-markdown';
import { getPartnerProfile } from '@/services/partner-admin';
import { getPresignedUpload } from '@/services/partner-admin';
import {
  isTourSubmitPayload,
  persistNewPartnerTour,
} from '@/lib/partner-tour-submit';
import { uploadTourImageFile } from '@/lib/partner-tour-helpers';

type FormData = Partial<TourFormData>;

type TourDestination = TourFormData['destinations'][number];
type TourItineraryDay = TourFormData['itinerary'][number];
type TourFormDate = TourFormData['tourDates'][number];
type TourGalleryImage = TourFormData['galleryImages'][number];
type TourPickupPoint = TourFormData['pickupPoints'][number];
type TourAgeRange = TourFormDate['ageRanges'][number];
type TourItineraryImage = NonNullable<TourItineraryDay['images']>[number];

export default function PartnerNewTourPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<'basic' | 'details'>('basic');
  const [formData, setFormData] = useState<FormData>({});
  const [partnerId, setPartnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void getPartnerProfile(accessToken)
      .then((profile) => setPartnerId(profile.id))
      .catch((error: Error) => setSubmitError(error.message));
  }, [accessToken]);

  const handleFormDataChange = (data: TourFormData) => {
    setFormData(data);
  };

  const handleSubmit = async (data: TourFormData | Record<string, unknown>) => {
    if (formStep === 'basic' && !isTourSubmitPayload(data)) {
      setFormData(data as TourFormData);
      setFormStep('details');
      return;
    }

    if (!accessToken || !partnerId) {
      setSubmitError('Oturum veya partner bilgisi bulunamadı');
      return;
    }

    if (!isTourSubmitPayload(data)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const tourId = await persistNewPartnerTour(
        {
          formData: data.formData,
          title: String(data.title ?? data.formData.title),
          description: String(data.description ?? data.formData.description),
          duration: Number(data.duration ?? data.formData.duration ?? 1),
          price: Number(data.price ?? data.formData.price ?? 0),
          tourDates:
            (data.tourDates as Array<{
              startDate: string | null;
              endDate: string | null;
              availableSeats: number;
              ageRanges: Array<{
                minAge: number;
                maxAge: number | null;
                pricingType: string;
                value: number;
              }>;
            }>) ?? [],
          pickupPoints:
            (data.pickupPoints as Array<{
              city: string;
              location: string;
              time: string;
              description?: string;
              latitude?: number | null;
              longitude?: number | null;
            }>) ?? [],
          accommodationName: String(
            data.accommodationName ?? data.formData.accommodationName ?? '',
          ),
          tourType: String(data.tourType ?? data.formData.tourType ?? ''),
          region: String(data.region ?? data.formData.region ?? ''),
          features: (data.features as string[]) ?? data.formData.features,
        },
        accessToken,
        partnerId,
      );
      router.push(`/acente/tours/${tourId}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Kayıt başarısız',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (formStep === 'details') {
      setFormStep('basic');
    } else {
      router.push('/acente/tours');
    }
  };

  // Önizleme için yardımcı fonksiyonlar
  const getPreviewImage = () => {
    if (formData.mainImage?.preview || formData.mainImage?.url) {
      return formData.mainImage.preview || formData.mainImage.url;
    }
    if (formData.galleryImages && formData.galleryImages.length > 0) {
      return formData.galleryImages[0].preview || formData.galleryImages[0].url;
    }
    if (formData.images && formData.images.length > 0) {
      return formData.images[0].preview || formData.images[0].url;
    }
    return null;
  };

  const formatPrice = (price: string | number | undefined) => {
    if (!price || price === '') return '0 ₺';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `${numPrice.toLocaleString('tr-TR')} ₺`;
  };

  const formatDuration = (duration: string | number | undefined) => {
    if (!duration || duration === '') return '0 gün';
    const numDuration =
      typeof duration === 'string' ? parseInt(duration) : duration;
    return `${numDuration} gün`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {submitError ? (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yeni Tur Oluştur</h1>
          <p className="text-gray-600">
            Müşterilerinize sunacağınız yeni bir tur oluşturun
          </p>
        </div>
        <Link
          href="/acente/tours"
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          İptal
        </Link>
      </div>

      {/* İlerleme göstergesi */}
      <div className="mb-8">
        <div className="overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-2.5 rounded-full bg-blue-600 transition-all duration-500 ease-in-out"
            style={{ width: formStep === 'basic' ? '50%' : '100%' }}
          ></div>
        </div>
        <div className="mt-4 flex justify-between">
          <div className="flex items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${formStep === 'basic' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
            >
              <CheckCircle className="h-5 w-5" />
            </div>
            <span className="ml-2 font-medium text-gray-900">
              Temel Bilgiler
            </span>
          </div>
          <div className="flex items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${formStep === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
            >
              {formStep === 'details' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span>2</span>
              )}
            </div>
            <span
              className={`ml-2 font-medium ${formStep === 'details' ? 'text-gray-900' : 'text-gray-500'}`}
            >
              Detaylar
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-8">
              <TourForm
                initialData={formData}
                onSubmit={handleSubmit}
                onFormDataChange={handleFormDataChange}
                onStepChange={setFormStep}
                isSubmitting={isSubmitting}
                currentStep={formStep}
                partnerId={partnerId || undefined}
                uploadEntityId={partnerId || undefined}
                uploadImage={
                  accessToken && partnerId
                    ? (file) =>
                        uploadTourImageFile(
                          file,
                          partnerId,
                          accessToken,
                          getPresignedUpload,
                        )
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900">Önizleme</h2>
                <div className="mt-4 space-y-4">
                  {/* Ana Görsel */}
                  <div className="h-48 w-full overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
                    {getPreviewImage() ? (
                      // eslint-disable-next-line @next/next/no-img-element -- live form preview (blob / proxy)
                      <img
                        src={getPreviewImage()!}
                        alt="Tur görseli"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-14 w-14 text-gray-400" />
                    )}
                  </div>

                  {/* Tur Başlığı */}
                  <h3 className="text-lg font-medium text-gray-900">
                    {formData?.title || 'Tur başlığı'}
                  </h3>

                  {/* Tur Açıklaması */}
                  <div className="text-sm text-gray-600 line-clamp-3">
                    {formData?.description ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <span className="text-sm text-gray-600">
                                {children}
                              </span>
                            ),
                            strong: ({ children }) => (
                              <span className="font-semibold text-gray-900">
                                {children}
                              </span>
                            ),
                            em: ({ children }) => (
                              <span className="italic text-gray-700">
                                {children}
                              </span>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside text-xs text-gray-600 mt-1">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-xs text-gray-600">
                                {children}
                              </li>
                            ),
                          }}
                        >
                          {formData.description}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      'Tur açıklaması burada görünecek...'
                    )}
                  </div>

                  {/* Fiyat ve Süre */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {formatPrice(formData?.price)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDuration(formData?.duration)}
                    </span>
                  </div>

                  {/* Tur Bilgileri */}
                  <div className="space-y-2">
                    {formData?.departureCity && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>Kalkış: {formData.departureCity}</span>
                      </div>
                    )}

                    {formData?.destinations &&
                      formData.destinations.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>Gidilen Yerler:</span>
                          </div>
                          <div className="ml-6 space-y-1">
                            {formData.destinations.map(
                              (dest: TourDestination, idx: number) => (
                                <div
                                  key={idx}
                                  className="text-xs text-gray-600 flex items-center"
                                >
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                                  <span className="font-medium">
                                    {dest.city}
                                  </span>
                                  {dest.description && (
                                    <span className="ml-1 text-gray-500">
                                      ({dest.description})
                                    </span>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {formData?.startDate && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          Başlangıç:{' '}
                          {new Date(formData.startDate).toLocaleDateString(
                            'tr-TR',
                          )}
                        </span>
                      </div>
                    )}

                    {formData?.maxParticipants && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Maksimum: {formData.maxParticipants} kişi</span>
                      </div>
                    )}

                    {formData?.transportation && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span>🚌 {formData.transportation}</span>
                      </div>
                    )}

                    {formData?.tourType && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span>🏷️ {formData.tourType}</span>
                      </div>
                    )}

                    {formData?.accommodationType &&
                      formData.accommodationType !== 'Günübirlik Tur' && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span>🏨 {formData.accommodationType}</span>
                          {formData.accommodationName && (
                            <span className="ml-1">
                              ({formData.accommodationName})
                            </span>
                          )}
                        </div>
                      )}

                    {formData?.region && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span>🗺️ {formData.region}</span>
                      </div>
                    )}
                  </div>

                  {/* Etiketler */}
                  {formData?.tags && formData.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                        <Tag className="h-4 w-4 mr-1" />
                        Etiketler
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {formData.tags
                          .slice(0, 5)
                          .map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        {formData.tags.length > 5 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                            +{formData.tags.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dahil Olanlar */}
                  {formData?.includes && formData.includes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        ✅ Dahil Olanlar
                      </h4>
                      <ul className="space-y-1">
                        {formData.includes
                          .slice(0, 3)
                          .map((item: string, idx: number) => (
                            <li
                              key={idx}
                              className="text-sm text-gray-700 flex items-center"
                            >
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                              {item}
                            </li>
                          ))}
                        {formData.includes.length > 3 && (
                          <li className="text-sm text-gray-500">
                            +{formData.includes.length - 3} daha...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Dahil Olmayanlar */}
                  {formData?.excludes && formData.excludes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        ❌ Dahil Olmayanlar
                      </h4>
                      <ul className="space-y-1">
                        {formData.excludes
                          .slice(0, 3)
                          .map((item: string, idx: number) => (
                            <li
                              key={idx}
                              className="text-sm text-gray-700 flex items-center"
                            >
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                              {item}
                            </li>
                          ))}
                        {formData.excludes.length > 3 && (
                          <li className="text-sm text-gray-500">
                            +{formData.excludes.length - 3} daha...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Özellikler */}
                  {formData?.features && formData.features.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        ✨ Özellikler
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {formData.features
                          .slice(0, 4)
                          .map((feature: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                            >
                              {feature}
                            </span>
                          ))}
                        {formData.features.length > 4 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                            +{formData.features.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Program Günleri */}
                  {formData?.itinerary && formData.itinerary.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        📅 Program
                      </h4>
                      <div className="space-y-2">
                        {formData.itinerary
                          .slice(0, 3)
                          .map((day: TourItineraryDay, idx: number) => (
                            <div
                              key={idx}
                              className="bg-gray-50 rounded-lg p-3"
                            >
                              <h5 className="text-sm font-medium text-gray-900 mb-1">
                                {day.title || `${idx + 1}. Gün`}
                              </h5>
                              <div className="text-xs text-gray-600 line-clamp-2">
                                {day.description ? (
                                  <div className="prose prose-xs max-w-none">
                                    <ReactMarkdown
                                      components={{
                                        p: ({ children }) => (
                                          <span className="text-xs text-gray-600">
                                            {children}
                                          </span>
                                        ),
                                        strong: ({ children }) => (
                                          <span className="font-semibold text-gray-800">
                                            {children}
                                          </span>
                                        ),
                                        em: ({ children }) => (
                                          <span className="italic text-gray-700">
                                            {children}
                                          </span>
                                        ),
                                        ul: ({ children }) => (
                                          <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                                            {children}
                                          </ul>
                                        ),
                                        ol: ({ children }) => (
                                          <ol className="list-decimal list-inside text-xs text-gray-600 mt-1">
                                            {children}
                                          </ol>
                                        ),
                                        li: ({ children }) => (
                                          <li className="text-xs text-gray-600">
                                            {children}
                                          </li>
                                        ),
                                      }}
                                    >
                                      {day.description}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  'Açıklama girilmemiş'
                                )}
                              </div>
                              {day.images && day.images.length > 0 && (
                                <div className="mt-2 flex gap-1">
                                  {day.images
                                    .slice(0, 3)
                                    .map(
                                      (
                                        img: TourItineraryImage,
                                        imgIdx: number,
                                      ) => (
                                        <div
                                          key={imgIdx}
                                          className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center"
                                        >
                                          <span className="text-xs text-gray-500">
                                            📷
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  {day.images.length > 3 && (
                                    <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                                      <span className="text-xs text-gray-500">
                                        +{day.images.length - 3}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        {formData.itinerary.length > 3 && (
                          <div className="text-xs text-gray-500 text-center py-2">
                            +{formData.itinerary.length - 3} gün daha...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tur Tarihleri */}
                  {formData?.tourDates && formData.tourDates.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        🗓️ Tur Tarihleri
                      </h4>
                      <div className="space-y-2">
                        {formData.tourDates
                          .slice(0, 2)
                          .map((date: TourFormDate, idx: number) => (
                            <div
                              key={idx}
                              className="bg-blue-50 rounded-lg p-3"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {date.startDate &&
                                      new Date(
                                        date.startDate,
                                      ).toLocaleDateString('tr-TR')}
                                    {date.endDate &&
                                      date.startDate !== date.endDate &&
                                      ` - ${new Date(date.endDate).toLocaleDateString('tr-TR')}`}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {date.price && `${formatPrice(date.price)}`}
                                    {date.availableSeats &&
                                      ` • ${date.availableSeats} kişilik`}
                                    {date.soldSeats &&
                                      parseInt(date.soldSeats) > 0 &&
                                      ` • ${date.soldSeats} satıldı`}
                                  </div>

                                  {/* Yaş Aralıkları */}
                                  {date.ageRanges &&
                                    date.ageRanges.length > 0 && (
                                      <div className="mt-2">
                                        <div className="text-xs font-medium text-gray-700 mb-1">
                                          Yaş Aralıkları:
                                        </div>
                                        <div className="space-y-1">
                                          {date.ageRanges
                                            .slice(0, 3)
                                            .map(
                                              (
                                                range: TourAgeRange,
                                                rangeIdx: number,
                                              ) => (
                                                <div
                                                  key={rangeIdx}
                                                  className="text-xs text-gray-600 flex items-center"
                                                >
                                                  <span className="w-1 h-1 bg-orange-500 rounded-full mr-2"></span>
                                                  <span>
                                                    {range.minAge}-
                                                    {range.maxAge || '∞'} yaş:
                                                    {range.pricingType ===
                                                      'free' && ' Ücretsiz'}
                                                    {range.pricingType ===
                                                      'half' && ' Yarı Fiyat'}
                                                    {range.pricingType ===
                                                      'percentage' &&
                                                      ` %${range.value} indirim`}
                                                    {range.pricingType ===
                                                      'fixed' &&
                                                      ` ${formatPrice(range.value)}`}
                                                  </span>
                                                </div>
                                              ),
                                            )}
                                          {date.ageRanges.length > 3 && (
                                            <div className="text-xs text-gray-500">
                                              +{date.ageRanges.length - 3} yaş
                                              aralığı daha...
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* İndirimler */}
                                  {(date.earlyBirdDiscount ||
                                    date.lastMinuteDiscount) && (
                                    <div className="mt-2">
                                      <div className="text-xs font-medium text-gray-700 mb-1">
                                        İndirimler:
                                      </div>
                                      <div className="space-y-1">
                                        {date.earlyBirdDiscount &&
                                          parseFloat(date.earlyBirdDiscount) >
                                            0 && (
                                            <div className="text-xs text-green-600 flex items-center">
                                              <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                                              Erken Rezervasyon: %
                                              {date.earlyBirdDiscount} indirim
                                            </div>
                                          )}
                                        {date.lastMinuteDiscount &&
                                          parseFloat(date.lastMinuteDiscount) >
                                            0 && (
                                            <div className="text-xs text-orange-600 flex items-center">
                                              <span className="w-1 h-1 bg-orange-500 rounded-full mr-2"></span>
                                              Son Dakika: %
                                              {date.lastMinuteDiscount} indirim
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ml-2 ${
                                    date.status === 'ACTIVE'
                                      ? 'bg-green-100 text-green-800'
                                      : date.status === 'CANCELLED'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {date.status === 'ACTIVE'
                                    ? 'Aktif'
                                    : date.status === 'CANCELLED'
                                      ? 'İptal'
                                      : 'Tamamlandı'}
                                </span>
                              </div>
                            </div>
                          ))}
                        {formData.tourDates.length > 2 && (
                          <div className="text-xs text-gray-500 text-center py-2">
                            +{formData.tourDates.length - 2} tarih daha...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Galeri Görselleri */}
                  {formData?.galleryImages &&
                    formData.galleryImages.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          📸 Galeri Görselleri
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {formData.galleryImages
                            .slice(0, 6)
                            .map((img: TourGalleryImage, idx: number) => (
                              <div
                                key={idx}
                                className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element -- live form preview (blob / proxy) */}
                                <img
                                  src={img.preview || img.url}
                                  alt={`Galeri görseli ${idx + 1}`}
                                  className="h-full w-full object-cover"
                                />
                                {img.description && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1">
                                    <p className="text-xs text-white truncate">
                                      {img.description}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          {formData.galleryImages.length > 6 && (
                            <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-500">
                                +{formData.galleryImages.length - 6}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Yolcu Alma Noktaları */}
                  {formData?.pickupPoints &&
                    formData.pickupPoints.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          🚌 Yolcu Alma Noktaları
                        </h4>
                        <div className="space-y-1">
                          {formData.pickupPoints
                            .slice(0, 3)
                            .map((point: TourPickupPoint, idx: number) => (
                              <div
                                key={idx}
                                className="text-xs text-gray-600 flex items-center"
                              >
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                                <span className="font-medium">
                                  {point.city}:
                                </span>
                                <span className="ml-1">{point.location}</span>
                                {point.time && (
                                  <span className="ml-1">({point.time})</span>
                                )}
                              </div>
                            ))}
                          {formData.pickupPoints.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{formData.pickupPoints.length - 3} nokta daha...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Diller */}
                  {formData?.languages && formData.languages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        🌍 Diller
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {formData.languages.map((lang: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg bg-blue-50 shadow">
              <div className="p-6">
                <div className="flex items-start">
                  <Info className="h-6 w-6 text-blue-600" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Bilgilendirme
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      {formStep === 'basic' ? (
                        <div className="space-y-2">
                          <p>
                            Temel bilgileri eksiksiz doldurmanız önemlidir.
                            Müşterileriniz turunuzu seçerken öncelikle bu
                            bilgilere göre karar verir.
                          </p>
                          <p>
                            <strong>💡 İpucu:</strong> Birden fazla destinasyon
                            ekleyebilirsiniz. Her destinasyon için açıklama da
                            ekleyebilirsiniz.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p>
                            Turunuzun detaylarını ne kadar zengin tutarsanız,
                            müşterilerinizin ilgisini o kadar çekersiniz. Turda
                            neler dahil olduğu ve olmadığı konusunda açık olun.
                          </p>
                          <p>
                            <strong>💡 İpucu:</strong> Yaş aralıkları ve
                            indirimler müşterilerinizin karar vermesinde önemli
                            rol oynar.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Geri
              </button>
              <button
                type="submit"
                form="tour-form"
                disabled={isSubmitting}
                className="flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              >
                {formStep === 'basic' ? (
                  <>
                    Devam Et
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                ) : (
                  <>{isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
