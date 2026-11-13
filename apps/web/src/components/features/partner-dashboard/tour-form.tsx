'use client';

import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { normalizeError, IMAGE_PLACEHOLDER } from '@/lib/partner-tour-helpers';
import {
  defaultFormData,
  getRegionByCity,
} from './tour-form/tour-form.constants';
import {
  TourFormUiProvider,
  type TourFormUiContextValue,
} from './tour-form/tour-form-context';
import { TourFormBasicStep } from './tour-form/tour-form-basic-step';
import { TourFormDetailsStep } from './tour-form/tour-form-details-step';
import { TourFormDatesSection } from './tour-form/tour-form-dates-section';
import { TourFormFooter } from './tour-form/tour-form-footer';
import type {
  AgeRange,
  Destination,
  GalleryImageFile,
  ImageFile,
  PickupPoint,
  TourDate,
  TourFormData,
  TourFormProps,
} from './tour-form/tour-form.types';
import {
  buildTourBasicStepSchema,
  tourDetailsStepSchema,
  zodErrorsToRecord,
} from './tour-form/tour-form.schemas';

export type { TourFormData } from './tour-form/tour-form.types';

export function TourForm({
  initialData,
  onSubmit,
  onFormDataChange,
  onStepChange,
  currentStep: initialStep = 'basic',
  partnerId,
  isUpdateMode = false,
  tourId,
  uploadEntityId,
  uploadImage,
}: TourFormProps) {
  const [formData, setFormData] = useState<TourFormData>(() => {
    if (initialData) {
      const tourDates = initialData.tourDates?.map(
        (
          date: Partial<TourDate> & {
            price?: string | number;
            availableSeats?: string | number;
            minParticipants?: string | number;
            maxParticipants?: string | number;
          },
        ) => ({
          startDate: date.startDate || '',
          endDate: date.endDate || '',
          price: date.price?.toString() || '0',
          availableSeats: date.availableSeats?.toString() || '0',
          soldSeats: date.soldSeats || '',
          minParticipants: date.minParticipants?.toString() || '',
          maxParticipants: date.maxParticipants?.toString() || '',
          earlyBirdDiscount: date.earlyBirdDiscount || '',
          lastMinuteDiscount: date.lastMinuteDiscount || '',
          earlyBirdDeadline: date.earlyBirdDeadline || '',
          lastMinuteStart: date.lastMinuteStart || '',
          notes: date.notes || '',
          status: date.status || 'ACTIVE',
          ageRanges: date.ageRanges || [],
          earlyBirdDeadlineStart: date.earlyBirdDeadlineStart || '',
          earlyBirdDeadlineEnd: date.earlyBirdDeadlineEnd || '',
          lastMinuteStartStart: date.lastMinuteStartStart || '',
          lastMinuteStartEnd: date.lastMinuteStartEnd || '',
          isExpanded: date.isExpanded || true,
        }),
      ) || [defaultFormData.tourDates[0]];

      return {
        ...defaultFormData,
        title: initialData.title || '',
        description: initialData.description || '',
        price: initialData.price || '',
        location: initialData.location || '',
        duration: initialData.duration || '',
        maxParticipants: initialData.maxParticipants || 0,
        currentParticipants: initialData.currentParticipants || 0,
        images: initialData.images || [],
        includes: initialData.includes || [],
        excludes: initialData.excludes || [],
        healthPrivileges: initialData.healthPrivileges || [],
        itinerary: initialData.itinerary || [],
        status: initialData.status || 'draft',
        departureCity: Array.isArray(initialData.departureCity)
          ? initialData.departureCity
          : initialData.departureCity
            ? [initialData.departureCity]
            : [''], // Dizi kontrolü
        region: initialData.region || '',
        transportation: initialData.transportation || '',
        period: initialData.period || '',
        stayKind: initialData.stayKind || '',
        destinationScope: initialData.destinationScope || '',
        tourType: initialData.tourType || '',
        accommodationType: initialData.accommodationType || '',
        ageRestriction: initialData.ageRestriction || '',
        languages: initialData.languages || [],
        tags: initialData.tags || [],
        tourDates,
        discount: initialData.discount || 0,
        destinations:
          initialData.destinations && initialData.destinations.length > 0
            ? initialData.destinations.map((dest) => ({
                city: dest.city ?? '',
                description: dest.description ?? '',
              }))
            : [{ city: '', description: '' }],
        reviews: initialData.reviews || 0,
        isJointTour: initialData.isJointTour || false,
        features: initialData.features || [],
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        accommodationName: initialData.accommodationName || '',
        meetingPoint: initialData.meetingPoint || '',
        meetingTime: initialData.meetingTime || '',
        pickupPoints: initialData.pickupPoints || [],
        nights: initialData.nights || '',
        mainImage: initialData.mainImage || null,
        galleryImages: initialData.galleryImages || [],
      };
    }
    return defaultFormData;
  });
  const [step, setStepState] = useState(initialStep);

  const setStep = (
    next:
      | 'basic'
      | 'details'
      | ((prev: 'basic' | 'details') => 'basic' | 'details'),
  ) => {
    setStepState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      if (resolved !== prev) onStepChange?.(resolved);
      return resolved;
    });
  };

  useEffect(() => {
    setStepState(initialStep);
  }, [initialStep]);
  const [newInclude, setNewInclude] = useState('');
  const [newExclude, setNewExclude] = useState('');
  const [newHealthPrivilege, setNewHealthPrivilege] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [errors, setErrors] = useState<
    Partial<Record<keyof TourFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form verileri değiştiğinde callback'i çağır
  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  // Validasyon hatalarını konsola yazdır
  const logValidationErrors = (
    errors: Partial<Record<keyof TourFormData, string>>,
  ) => {
    console.log('Validasyon Hataları:', errors);
    // Her bir hata için detaylı log
    Object.entries(errors).forEach(([field, error]) => {
      console.log(`${field}: ${error}`);
    });
  };

  const uploadImageFile = async (file: File): Promise<string> => {
    if (uploadImage) {
      return uploadImage(file);
    }
    if (!uploadEntityId) {
      throw new Error('Görsel yüklemek için tur veya partner kimliği gerekli');
    }
    throw new Error('Görsel yükleme yapılandırılmadı');
  };

  const uploadImagesToForm = async (
    files: File[],
    target: 'images' | 'gallery' | 'main' | 'itinerary',
    dayIdx?: number,
  ) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setUploadError(null);
    setIsUploadingImages(true);
    try {
      const {
        prepareTourImageFile,
        TOUR_COVER_IMAGE_OPTIONS,
        TOUR_GALLERY_IMAGE_OPTIONS,
      } = await import('@/lib/prepare-tour-image');
      const uploadedImages: ImageFile[] = [];
      for (const file of imageFiles) {
        const prepared = await prepareTourImageFile(
          file,
          target === 'main'
            ? TOUR_COVER_IMAGE_OPTIONS
            : TOUR_GALLERY_IMAGE_OPTIONS,
        );
        const url = await uploadImageFile(prepared);
        // Blob preview avoids Next /_next/image → r2.dev TLS 500 while uploading
        uploadedImages.push({
          url,
          file: prepared,
          preview: URL.createObjectURL(prepared),
        });
      }

      setFormData((prev) => {
        if (target === 'images') {
          return { ...prev, images: [...prev.images, ...uploadedImages] };
        }
        if (target === 'gallery') {
          const galleryImages: GalleryImageFile[] = uploadedImages.map(
            (img) => ({
              ...img,
              description: '',
            }),
          );
          return {
            ...prev,
            galleryImages: [...prev.galleryImages, ...galleryImages],
          };
        }
        if (target === 'main' && uploadedImages[0]) {
          return { ...prev, mainImage: uploadedImages[0] };
        }
        if (target === 'itinerary' && dayIdx !== undefined) {
          const newItinerary = [...prev.itinerary];
          const day = { ...newItinerary[dayIdx] };
          const itineraryImages = uploadedImages.map((img) => ({
            url: img.url,
            file: null,
          }));
          day.images = [...(day.images || []), ...itineraryImages];
          newItinerary[dayIdx] = day;
          return { ...prev, itinerary: newItinerary };
        }
        return prev;
      });
    } catch (err) {
      setUploadError(
        normalizeError(err, 'Görsel yüklenirken bir hata oluştu').message,
      );
    } finally {
      setIsUploadingImages(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    disabled: isUploadingImages,
    onDrop: (acceptedFiles) => {
      void uploadImagesToForm(acceptedFiles, 'images');
    },
  });

  // Form değişikliklerini yönet
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    let newValue: string = value;

    if (type === 'number') {
      // Başındaki sıfırları sil
      newValue = value.replace(/^0+/, '');
      // Eğer input tamamen boşsa, boş string olarak bırak
      if (newValue === '') newValue = '';
    }

    if (name === 'stayKind') {
      setFormData((prev) => ({
        ...prev,
        stayKind: newValue as TourFormData['stayKind'],
        ...(newValue === 'DAY_TRIP'
          ? {
              nights: '0',
              duration: '1',
              accommodationType: '',
              accommodationName: '',
            }
          : {}),
      }));
    } else if (name === 'nights') {
      // Gece sayısına göre gün sayısını hesapla (gece + 1)
      const days = newValue ? parseInt(newValue) + 1 : '';
      setFormData((prev) => ({
        ...prev,
        nights: newValue,
        duration: days.toString(),
      }));
    } else if (
      name === 'startDate' ||
      name === 'endDate' ||
      name === 'price' ||
      name === 'maxParticipants'
    ) {
      // Ana form alanları değiştiğinde ilk tur tarihini güncelle
      setFormData((prev) => {
        const updatedTourDates = [...prev.tourDates];
        if (updatedTourDates.length > 0) {
          updatedTourDates[0] = {
            ...updatedTourDates[0],
            startDate:
              name === 'startDate' ? value : updatedTourDates[0].startDate,
            endDate: name === 'endDate' ? value : updatedTourDates[0].endDate,
            price: name === 'price' ? value : updatedTourDates[0].price,
            maxParticipants:
              name === 'maxParticipants'
                ? value
                : updatedTourDates[0].maxParticipants,
            minParticipants:
              name === 'maxParticipants'
                ? Math.floor(Number(value) / 2).toString()
                : updatedTourDates[0].minParticipants,
          };
        }
        return {
          ...prev,
          [name]: newValue,
          tourDates: updatedTourDates,
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    }
  };

  // Tarih değişikliklerini yönet
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- legacy handler kept for date field wiring
  const handleDateFieldChange = (
    field: 'startDate' | 'endDate',
    value: string,
  ) => {
    if (field === 'startDate') {
      // Başlangıç tarihi seçildiğinde, gece sayısına göre bitiş tarihini hesapla
      if (value && formData.nights) {
        const startDate = new Date(value);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + parseInt(formData.nights));

        setFormData((prev) => ({
          ...prev,
          startDate: value,
          endDate: endDate.toISOString().split('T')[0],
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          startDate: value,
        }));
      }
    }
  };

  // Sayısal değerleri yönet
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- legacy handler kept for numeric inputs
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = parseInt(value);
    if (!isNaN(numberValue)) {
      setFormData((prev) => ({ ...prev, [name]: numberValue }));
      if (errors[name as keyof TourFormData]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
  };

  // Dahil olanları yönet
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- add flow wired via preset options
  const handleAddInclude = () => {
    if (newInclude.trim()) {
      setFormData((prev) => ({
        ...prev,
        includes: [...prev.includes, newInclude.trim()],
      }));
      setNewInclude('');
    }
  };

  const handleRemoveInclude = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      includes: prev.includes.filter((_, i) => i !== index),
    }));
  };

  // Hariç olanları yönet
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- add flow wired via preset options
  const handleAddExclude = () => {
    if (newExclude.trim()) {
      setFormData((prev) => ({
        ...prev,
        excludes: [...prev.excludes, newExclude.trim()],
      }));
      setNewExclude('');
    }
  };

  const handleRemoveExclude = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      excludes: prev.excludes.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveHealthPrivilege = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      healthPrivileges: prev.healthPrivileges.filter((_, i) => i !== index),
    }));
  };

  // Program (itinerary) yönetimi
  const handleItineraryChange = (
    index: number,
    field: 'title' | 'description',
    value: string,
  ) => {
    setFormData((prev) => {
      const newItinerary = [...prev.itinerary];
      newItinerary[index] = { ...newItinerary[index], [field]: value };
      return { ...prev, itinerary: newItinerary };
    });
  };

  const handleAddItineraryDay = () => {
    if (formData.itinerary.length >= parseInt(formData.duration)) {
      alert('Maksimum gün sayısına ulaştınız!');
      return;
    }

    const dayIndex = formData.itinerary.length;
    const tourDate = formData.tourDates[0]; // İlk tur tarihini baz alıyoruz
    let dayDate = '';

    if (tourDate && tourDate.startDate) {
      const date = new Date(tourDate.startDate);
      date.setDate(date.getDate() + dayIndex);
      dayDate = date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    setFormData((prev) => ({
      ...prev,
      itinerary: [
        ...prev.itinerary,
        {
          title: `${dayIndex + 1}. Gün - ${dayDate}`,
          description: '',
        },
      ],
    }));
  };

  const handleRemoveItineraryDay = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index),
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- dropzone uses uploadImagesToForm directly
  const handleImageUpload = (files: File[]) => {
    void uploadImagesToForm(files, 'images');
  };

  const handleImageRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for tour date end-date calculation
  const calcEndDate = (start: string | Date | null | undefined) => {
    if (!start || !formData.duration) return '';
    const d = new Date(start);
    d.setDate(d.getDate() + Number(formData.duration) - 1);
    return d.toISOString().split('T')[0];
  };

  // Tur adı benzersiz mi kontrolü (placeholder, backend ile entegrasyon gerektirir)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- API uniqueness check stub
  const checkTitleUnique = async (_title: string): Promise<boolean> => {
    // TODO: API ile benzersizlik kontrolü yapılacak
    // Şimdilik true döndür (her zaman benzersiz kabul et)
    return true;
  };

  const validateBasicForm = async (): Promise<boolean> => {
    const parsed = buildTourBasicStepSchema(isUpdateMode).safeParse({
      stayKind: formData.stayKind || undefined,
      destinationScope: formData.destinationScope || undefined,
      title: formData.title,
      description: formData.description,
      price: formData.price,
      departureCity: formData.departureCity,
      destinations: formData.destinations,
      nights: formData.nights,
      maxParticipants: formData.maxParticipants,
      transportation: formData.transportation,
      tourType: formData.tourType,
      accommodationType: formData.accommodationType,
      images: formData.images,
      mainImage: formData.mainImage,
      galleryImages: formData.galleryImages,
    });

    if (parsed.success) {
      setErrors({});
      return true;
    }

    const newErrors = zodErrorsToRecord(parsed.error);
    setErrors(newErrors);
    logValidationErrors(newErrors);
    return false;
  };

  const validateDetailsForm = (): boolean => {
    const parsed = tourDetailsStepSchema.safeParse({
      tourDates: formData.tourDates,
      pickupPoints: formData.pickupPoints,
    });

    if (parsed.success) {
      setErrors({});
      return true;
    }

    const newErrors = zodErrorsToRecord(parsed.error);
    // Index-aware messages for multi-row fields
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === 'tourDates' && typeof issue.path[1] === 'number') {
        const idx = issue.path[1] + 1;
        newErrors.tourDates = `${idx}. tur: ${issue.message}`;
      }
      if (
        issue.path[0] === 'pickupPoints' &&
        typeof issue.path[1] === 'number'
      ) {
        const idx = issue.path[1] + 1;
        newErrors.pickupPoints = `${idx}. nokta: ${issue.message}`;
      }
    }

    setErrors(newErrors);
    logValidationErrors(newErrors);
    return false;
  };

  const validateForm = async (): Promise<boolean> => {
    try {
      // Eğer basic step'teyse sadece temel bilgileri kontrol et
      if (step === 'basic') {
        const basicValid = await validateBasicForm();
        return basicValid;
      }
      // Eğer details step'teyse hem temel hem detayları kontrol et
      const basicValid = await validateBasicForm();
      const detailsValid = validateDetailsForm();
      return basicValid && detailsValid;
    } catch (error) {
      console.error('Form validation error:', error);
      return false;
    }
  };

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (isUploadingImages) {
      setSubmitError(
        'Görseller yükleniyor. Lütfen yükleme tamamlanana kadar bekleyin.',
      );
      return;
    }

    const hasBlobUrls = formData.images.some((img) =>
      img?.url?.startsWith('blob:'),
    );
    if (hasBlobUrls) {
      setSubmitError(
        'Görseller geçici bağlantı olarak kaydedilmiş. Lütfen görselleri yeniden yükleyin.',
      );
      return;
    }

    if (isUpdateMode && !tourId) {
      setSubmitError(
        'Tur kimliği bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.',
      );
      return;
    }

    if (!isUpdateMode && !partnerId) {
      setSubmitError(
        'Tur operatör bilgisi yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.',
      );
      return;
    }

    const isValid = await validateForm();
    if (!isValid) {
      setSubmitError('Lütfen form alanlarını kontrol ediniz.');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Form gönderimi başlıyor...');
      console.log('isUpdateMode:', isUpdateMode);

      // Boş şehirli destinasyonları filtrele ve sadece city/description gönder
      const filteredDestinations = formData.destinations
        .filter((dest) => dest.city && dest.city.trim())
        .map((dest) => ({
          city: dest.city,
          description: dest.description || '',
        }));

      // Boş kalkış şehirlerini filtrele
      const filteredDepartureCities = formData.departureCity.filter(
        (city) => city && city.trim(),
      );

      const formDataToSubmit = {
        title: formData.title,
        description: formData.description,
        duration: parseInt(formData.duration, 10) || 0,
        nights: parseInt(formData.nights || '0', 10) || 0,
        price: parseFloat(formData.price) || 0,
        maxParticipants: parseInt(formData.maxParticipants.toString(), 10) || 0,
        currentParticipants:
          parseInt(formData.currentParticipants.toString(), 10) || 0,
        destinations: filteredDestinations,
        departureCity: filteredDepartureCities,
        images: formData.images
          .map((img) => img?.url)
          .filter((url): url is string => Boolean(url)),
        includes: formData.includes,
        excludes: formData.excludes,
        healthPrivileges: formData.healthPrivileges,
        features: formData.features,
        itinerary: formData.itinerary.map((day) => ({
          title: day.title,
          description: day.description,
          images: day.images?.map((image) => image.url).filter(Boolean) ?? [],
        })),
        featured: false,
        tourOperatorId: partnerId,
        region: formData.region,
        transportation: formData.transportation,
        period: formData.period,
        tourType: formData.tourType,
        accommodationType: formData.accommodationType,
        ageRestriction: formData.ageRestriction,
        languages: formData.languages,
        tags: formData.tags,
        accommodationName: formData.accommodationName,
        meetingPoint: formData.meetingPoint,
        meetingTime: formData.meetingTime,
        data: {
          meetingPoint: formData.meetingPoint,
          meetingTime: formData.meetingTime,
          features: formData.features,
          nights: formData.nights,
        },
        tourDates: formData.tourDates.map((date) => ({
          startDate: date.startDate
            ? new Date(date.startDate).toISOString()
            : null,
          endDate: date.endDate ? new Date(date.endDate).toISOString() : null,
          price: parseFloat(date.price || '0'),
          availableSeats: parseInt(date.availableSeats || '0', 10),
          soldSeats: parseInt(date.soldSeats || '0', 10),
          waitingList: parseInt(date.waitingList || '0', 10),
          discount: parseFloat(date.discount || '0'),
          minParticipants:
            date.minParticipants && date.minParticipants.trim()
              ? parseInt(date.minParticipants, 10)
              : null,
          maxParticipants:
            date.maxParticipants && date.maxParticipants.trim()
              ? parseInt(date.maxParticipants, 10)
              : null,
          earlyBirdDiscount:
            date.earlyBirdDiscount && date.earlyBirdDiscount.trim()
              ? parseFloat(date.earlyBirdDiscount)
              : 0,
          lastMinuteDiscount:
            date.lastMinuteDiscount && date.lastMinuteDiscount.trim()
              ? parseFloat(date.lastMinuteDiscount)
              : 0,
          earlyBirdDeadlineStart:
            date.earlyBirdDeadlineStart && date.earlyBirdDeadlineStart.trim()
              ? new Date(date.earlyBirdDeadlineStart).toISOString()
              : null,
          earlyBirdDeadline:
            date.earlyBirdDeadlineEnd && date.earlyBirdDeadlineEnd.trim()
              ? new Date(date.earlyBirdDeadlineEnd).toISOString()
              : null,
          lastMinuteStart:
            date.lastMinuteStartStart && date.lastMinuteStartStart.trim()
              ? new Date(date.lastMinuteStartStart).toISOString()
              : null,
          lastMinuteStartEnd:
            date.lastMinuteStartEnd && date.lastMinuteStartEnd.trim()
              ? new Date(date.lastMinuteStartEnd).toISOString()
              : null,
          notes: date.notes || '',
          status: date.status || 'ACTIVE',
          ageRanges: date.ageRanges
            ? date.ageRanges
                .filter(
                  (range) =>
                    range &&
                    typeof range === 'object' &&
                    range.minAge !== undefined &&
                    range.minAge !== null,
                )
                .map((range) => ({
                  minAge: parseInt(range.minAge?.toString() || '0', 10),
                  maxAge: range.maxAge
                    ? parseInt(range.maxAge.toString(), 10)
                    : null,
                  pricingType: range.pricingType || 'percentage',
                  value: parseFloat(range.value?.toString() || '0'),
                }))
            : [],
        })),
        pickupPoints: formData.pickupPoints
          .filter(
            (point) =>
              point.city &&
              point.city.trim() &&
              point.location &&
              point.location.trim() &&
              point.time &&
              point.time.trim() &&
              point.description &&
              point.description.trim(),
          )
          .map((point, index) => ({
            city: point.city.trim(),
            location: point.location.trim(),
            time: point.time.trim(),
            description: point.description?.trim() || '',
            latitude: point.latitude ?? null,
            longitude: point.longitude ?? null,
            order: index,
          })),
        startDate: formData.startDate,
        endDate: formData.endDate,
        discount: formData.discount,
      };

      if (step === 'basic') {
        onSubmit(formData);
        return;
      }

      await onSubmit({ ...formDataToSubmit, formData });
    } catch (error) {
      console.error('Form gönderimi hatası:', error);
      const errorMessage = normalizeError(
        error,
        isUpdateMode
          ? 'Tur güncellenirken bir hata oluştu. Lütfen tüm alanları kontrol edip tekrar deneyiniz.'
          : 'Tur oluşturulurken bir hata oluştu. Lütfen tüm alanları kontrol edip tekrar deneyiniz.',
      ).message;
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewImageError = (
    event: React.SyntheticEvent<HTMLImageElement>,
  ) => {
    const target = event.currentTarget;
    if (!target.src.endsWith(IMAGE_PLACEHOLDER)) {
      target.src = IMAGE_PLACEHOLDER;
    }
  };

  // Yeni özellik ekleme
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- add flow wired via preset options
  const handleAddFeature = () => {
    const input = document.getElementById('feature-input') as HTMLInputElement;
    if (input && input.value.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, input.value.trim()],
      }));
      input.value = '';
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== index),
    }));
  };

  // Yolcu alma noktalarını yönet
  const handlePickupPointsChange = (points: PickupPoint[]) => {
    setFormData((prev) => ({
      ...prev,
      pickupPoints: points.map((point, index) => ({
        ...point,
        order: index,
      })),
    }));
  };

  // Destinasyonları yönet
  const handleDestinationsChange = (
    index: number,
    field: keyof Destination,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      destinations: prev.destinations.map((dest, idx) =>
        idx === index ? { ...dest, [field]: value } : dest,
      ),
    }));
  };

  // Destinasyonlar değiştiğinde bölgeyi otomatik hesapla
  useEffect(() => {
    if (formData.destinations.length > 0) {
      const selectedCities = formData.destinations
        .map((dest) => dest.city)
        .filter(
          (city): city is string =>
            typeof city === 'string' && city.trim() !== '',
        );

      if (selectedCities.length > 0) {
        let calculatedRegion = '';

        if (selectedCities.length === 1) {
          // Tek şehir varsa o şehrin bölgesini kullan
          calculatedRegion = getRegionByCity(selectedCities[0]);
        } else {
          // Birden fazla şehir varsa akıllı bölge belirleme
          const cityRegions = selectedCities.map((city) =>
            getRegionByCity(city),
          );
          const uniqueRegions = Array.from(new Set(cityRegions)).filter(
            (region) => region,
          );

          if (uniqueRegions.length === 1) {
            // Tüm şehirler aynı bölgedeyse o bölgeyi kullan
            calculatedRegion = uniqueRegions[0];
          } else if (uniqueRegions.length === 2) {
            // İki farklı bölge varsa, komşu bölgeleri kontrol et
            const regionPairs = [
              ['Marmara', 'Ege'],
              ['Ege', 'Akdeniz'],
              ['Akdeniz', 'İç Anadolu'],
              ['İç Anadolu', 'Karadeniz'],
              ['İç Anadolu', 'Doğu Anadolu'],
              ['Doğu Anadolu', 'Güneydoğu Anadolu'],
              ['Karadeniz', 'Doğu Anadolu'],
            ];

            const isNeighboring = regionPairs.some(
              (pair) =>
                (pair[0] === uniqueRegions[0] &&
                  pair[1] === uniqueRegions[1]) ||
                (pair[0] === uniqueRegions[1] && pair[1] === uniqueRegions[0]),
            );

            if (isNeighboring) {
              // Komşu bölgeler varsa, daha büyük olanı seç
              const regionSizes = {
                'İç Anadolu': 12,
                Karadeniz: 16,
                'Doğu Anadolu': 14,
                'Güneydoğu Anadolu': 9,
                Akdeniz: 8,
                Ege: 8,
                Marmara: 11,
              };

              const region1Size =
                regionSizes[uniqueRegions[0] as keyof typeof regionSizes] || 0;
              const region2Size =
                regionSizes[uniqueRegions[1] as keyof typeof regionSizes] || 0;

              calculatedRegion =
                region1Size >= region2Size
                  ? uniqueRegions[0]
                  : uniqueRegions[1];
            } else {
              // Komşu değilse, en çok şehir olan bölgeyi seç
              const regionCounts: { [key: string]: number } = {};
              cityRegions.forEach((region) => {
                if (region) {
                  regionCounts[region] = (regionCounts[region] || 0) + 1;
                }
              });

              calculatedRegion =
                Object.entries(regionCounts).sort(
                  ([, a], [, b]) => b - a,
                )[0]?.[0] || '';
            }
          } else {
            // Üç veya daha fazla farklı bölge varsa, en çok şehir olan bölgeyi seç
            const regionCounts: { [key: string]: number } = {};
            cityRegions.forEach((region) => {
              if (region) {
                regionCounts[region] = (regionCounts[region] || 0) + 1;
              }
            });

            calculatedRegion =
              Object.entries(regionCounts).sort(
                ([, a], [, b]) => b - a,
              )[0]?.[0] || '';
          }
        }

        setFormData((prev) => ({
          ...prev,
          region: calculatedRegion,
        }));
      }
    }
  }, [formData.destinations]);

  // Bugünün tarihini al
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const handleAddAgeRange = (tourDateIndex: number) => {
    const newFormData = { ...formData };
    if (!newFormData.tourDates[tourDateIndex].ageRanges) {
      newFormData.tourDates[tourDateIndex].ageRanges = [];
    }

    // Mevcut yaş aralıklarını sırala
    const sortedRanges = [
      ...newFormData.tourDates[tourDateIndex].ageRanges,
    ].sort((a, b) => a.minAge - b.minAge);

    // Eğer hiç yaş aralığı yoksa, ilk yaş aralığı formdaki minimum yaştan başlasın
    let startAge: number | null =
      sortedRanges.length === 0 ? parseInt(formData.ageRestriction) || 0 : null;
    if (sortedRanges.length > 0) {
      const lastRange = sortedRanges[sortedRanges.length - 1];
      // Son yaş aralığının bitiş yaşı girilmemişse yeni aralık eklenemez
      if (
        lastRange.maxAge === null ||
        lastRange.maxAge === undefined ||
        isNaN(Number(lastRange.maxAge))
      ) {
        alert('Önce mevcut yaş aralığının bitiş yaşını giriniz.');
        return;
      }
      // Son yaş aralığının bitiş yaşı, başlangıç yaşından küçük veya eşit olamaz
      if (lastRange.maxAge <= lastRange.minAge) {
        alert(
          'Mevcut yaş aralığının bitiş yaşı, başlangıç yaşından küçük veya eşit olamaz.',
        );
        return;
      }
      startAge = Number(lastRange.maxAge) + 1;
    }

    // startAge null kontrolü
    if (startAge === null) {
      alert('Yaş aralığı eklenemiyor. Lütfen mevcut aralıkları kontrol edin.');
      return;
    }

    // Yeni yaş aralığı, mevcut aralıklarla çakışıyor mu kontrolü
    for (let i = 0; i < sortedRanges.length; i++) {
      const currentRange = sortedRanges[i];
      if (currentRange.maxAge !== null && startAge <= currentRange.maxAge) {
        alert(
          `Yeni yaş aralığı mevcut yaş aralığı (${currentRange.minAge}-${currentRange.maxAge}) ile çakışıyor. Önce mevcut aralıkları düzenleyin.`,
        );
        return;
      }
    }

    newFormData.tourDates[tourDateIndex].ageRanges.push({
      minAge: startAge,
      maxAge: null,
      pricingType: 'percentage',
      value: '0',
    });

    setFormData(newFormData);
  };

  const validateAgeRanges = (tourDateIndex: number) => {
    const ranges = formData.tourDates[tourDateIndex].ageRanges;
    const sortedRanges = [...ranges].sort((a, b) => a.minAge - b.minAge);
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      const currentRange = sortedRanges[i];
      const nextRange = sortedRanges[i + 1];
      if (currentRange.maxAge && currentRange.maxAge >= nextRange.minAge) {
        return false;
      }
    }
    return true;
  };

  const handleAgeRangeChange = (
    tourDateIndex: number,
    ageRangeIndex: number,
    field: keyof AgeRange,
    value: string | number | null,
  ) => {
    const newFormData = { ...formData };
    const ageRange =
      newFormData.tourDates[tourDateIndex].ageRanges[ageRangeIndex];

    if (field === 'minAge' || field === 'maxAge') {
      const newValue = value === null ? null : Number(value);
      if (field === 'minAge') {
        if (newValue !== null) {
          ageRange.minAge = newValue;
        }
      } else {
        ageRange.maxAge = newValue;
      }
    } else if (field === 'value') {
      ageRange[field] = String(value);
    } else if (field === 'pricingType') {
      ageRange[field] = value as 'free' | 'half' | 'percentage' | 'fixed';
      if (value === 'fixed') {
        ageRange.value = String(
          parseFloat(newFormData.tourDates[tourDateIndex].price) || 0,
        );
      }
    }
    setFormData(newFormData);
  };

  const handleRemoveAgeRange = (
    tourDateIndex: number,
    ageRangeIndex: number,
  ) => {
    const newFormData = { ...formData };
    newFormData.tourDates[tourDateIndex].ageRanges.splice(ageRangeIndex, 1);
    setFormData(newFormData);
  };

  // Üstteki bilgiler değiştiğinde ilk tur tarihi otomatik dolsun
  useEffect(() => {
    if (formData.tourDates.length > 0) {
      const firstDate = formData.tourDates[0];
      const updatedFirstDate: TourDate = {
        ...firstDate,
        price: formData.price,
        availableSeats: formData.maxParticipants.toString(),
        minParticipants: '',
        maxParticipants: formData.maxParticipants.toString(),
        ageRanges: firstDate.ageRanges.map((range) => ({
          ...range,
          value:
            range.pricingType === 'fixed' ? formData.price : range.value || '0',
        })),
      };

      setFormData((prev) => ({
        ...prev,
        tourDates: [updatedFirstDate, ...prev.tourDates.slice(1)],
      }));
    }
  }, [formData.price, formData.maxParticipants]);

  // Görsel ekleme fonksiyonları
  const handleMainImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      void uploadImagesToForm([file], 'main');
      event.target.value = '';
    }
  };

  const handleGalleryImagesChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      void uploadImagesToForm(files, 'gallery');
      event.target.value = '';
    }
  };

  const handleGalleryImageDescriptionChange = (
    index: number,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.map((img, idx) =>
        idx === index ? { ...img, description: value } : img,
      ),
    }));
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, idx) => idx !== index),
    }));
  };

  const handleReorderGalleryImages = (from: number, to: number) => {
    setFormData((prev) => {
      const newGalleryImages = [...prev.galleryImages];
      const [movedImage] = newGalleryImages.splice(from, 1);
      newGalleryImages.splice(to, 0, movedImage);
      return {
        ...prev,
        galleryImages: newGalleryImages,
      };
    });
  };

  // Tur tarihleri için handler fonksiyonları tekrar ekliyorum:
  const handleAddTourDate = () => {
    setFormData((prev) => {
      // İlk tur tarihinin bilgilerini al
      const firstTourDate = prev.tourDates[0];

      // Diğer tüm tarihleri kapalı yap
      const updatedTourDates = prev.tourDates.map((td) => ({
        ...td,
        isExpanded: false,
      }));

      // Yeni tur tarihi oluştur, ilk tur tarihinin bilgileriyle
      const newTourDate = {
        ...firstTourDate,
        startDate: '', // Başlangıç tarihi boş
        endDate: '', // Bitiş tarihi boş
        earlyBirdDeadline: '', // Erken rezervasyon son tarihi boş
        lastMinuteStart: '', // Son dakika başlangıç tarihi boş
        earlyBirdDeadlineStart: '', // Erken rezervasyon başlangıç tarihi boş
        earlyBirdDeadlineEnd: '', // Erken rezervasyon bitiş tarihi boş
        lastMinuteStartStart: '', // Son dakika başlangıç tarihi boş
        lastMinuteStartEnd: '', // Son dakika bitiş tarihi boş
        status: 'ACTIVE' as const,
        ageRanges: [...firstTourDate.ageRanges],
        isExpanded: true,
      };

      return {
        ...prev,
        tourDates: [...updatedTourDates, newTourDate],
      };
    });
  };

  const handleTourDateChange = (
    index: number,
    field: keyof TourDate,
    value: string,
  ) => {
    setFormData((prev) => {
      const updatedTourDates = [...prev.tourDates];

      // Eğer başlangıç tarihi değişiyorsa ve gece sayısı varsa
      if (field === 'startDate' && value && prev.nights) {
        const startDate = new Date(value);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + parseInt(prev.nights));

        updatedTourDates[index] = {
          ...updatedTourDates[index],
          startDate: value,
          endDate: endDate.toISOString().split('T')[0],
        };
      } else {
        updatedTourDates[index] = {
          ...updatedTourDates[index],
          [field]: value,
        };
      }

      return {
        ...prev,
        tourDates: updatedTourDates,
      };
    });
  };

  // 1. Handler fonksiyonları ekliyorum:
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- legacy multi-select handler
  const handleLanguagesChange = (selected: string[]) => {
    setFormData((prev) => ({ ...prev, languages: selected }));
  };

  const [newTag, setNewTag] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- tag input uses inline add flow
  const handleAddTag = () => {
    const input = document.getElementById('tag-input') as HTMLInputElement;
    if (input && input.value.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, input.value.trim()],
      }));
      input.value = '';
    }
  };
  const handleRemoveTag = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== idx),
    }));
  };

  // 1. Diller için otomatik tamamlama özelliğini güncelliyorum:
  const [newLanguage, setNewLanguage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const availableLanguages = [
    'Türkçe',
    'İngilizce',
    'Almanca',
    'Fransızca',
    'Rusça',
    'Arapça',
    'İspanyolca',
    'İtalyanca',
    'Çince',
    'Japonca',
  ];

  const handleLanguageInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setNewLanguage(value);
    if (value.trim()) {
      const filtered = availableLanguages.filter((lang) =>
        lang.toLowerCase().includes(value.toLowerCase()),
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleAddLanguage = () => {
    if (
      newLanguage.trim() &&
      availableLanguages.includes(newLanguage.trim()) &&
      !formData.languages.includes(newLanguage.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()],
      }));
      setNewLanguage('');
      setSuggestions([]);
    }
  };

  const handleRemoveLanguage = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== idx),
    }));
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!formData.languages.includes(suggestion)) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, suggestion],
      }));
    }
    setNewLanguage('');
    setSuggestions([]);
  };

  // Program günlerinde fotoğraf ekleme fonksiyonu:
  const handleItineraryImageAdd = (dayIdx: number, files: FileList | null) => {
    if (!files) return;
    void uploadImagesToForm(Array.from(files), 'itinerary', dayIdx);
  };

  const handleItineraryImageRemove = (dayIdx: number, imgIdx: number) => {
    setFormData((prev) => {
      const newItinerary = [...prev.itinerary];
      const day = { ...newItinerary[dayIdx] };
      day.images = (day.images || []).filter((_, i) => i !== imgIdx);
      newItinerary[dayIdx] = day;
      return { ...prev, itinerary: newItinerary };
    });
  };

  // Kalkış şehirlerini yönet
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- legacy multi-select handler
  const handleDepartureCityChange = (selectedCities: string[]) => {
    setFormData((prev) => ({
      ...prev,
      departureCity: selectedCities,
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- departure city uses inline add flow
  const handleAddDepartureCity = () => {
    const input = document.getElementById(
      'departure-city-input',
    ) as HTMLInputElement;
    if (input && input.value.trim()) {
      const city = input.value.trim();
      if (!formData.departureCity.includes(city)) {
        setFormData((prev) => ({
          ...prev,
          departureCity: [...prev.departureCity, city],
        }));
        input.value = '';
      }
    }
  };

  const handleRemoveDepartureCity = (cityToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      departureCity: prev.departureCity.filter((city) => city !== cityToRemove),
    }));
  };

  const ui: TourFormUiContextValue = {
    formData,
    setFormData,
    errors,
    todayStr,
    isUploadingImages,
    uploadError,
    isSubmitting,
    isUpdateMode,
    step,
    setStep,
    validateForm,
    getRootProps,
    getInputProps,
    newLanguage,
    suggestions,
    newTag,
    setNewTag,
    newInclude,
    setNewInclude,
    newExclude,
    setNewExclude,
    newHealthPrivilege,
    setNewHealthPrivilege,
    newFeature,
    setNewFeature,
    handleChange,
    handleDestinationsChange,
    handleRemoveDepartureCity,
    handleMainImageChange,
    handleGalleryImagesChange,
    handleGalleryImageDescriptionChange,
    handleRemoveGalleryImage,
    handleReorderGalleryImages,
    handleImageRemove,
    handlePreviewImageError,
    handlePickupPointsChange,
    handleLanguageInputChange,
    handleAddLanguage,
    handleRemoveLanguage,
    handleSuggestionClick,
    handleRemoveTag,
    handleRemoveInclude,
    handleRemoveExclude,
    handleRemoveHealthPrivilege,
    handleRemoveFeature,
    handleItineraryChange,
    handleAddItineraryDay,
    handleRemoveItineraryDay,
    handleItineraryImageAdd,
    handleItineraryImageRemove,
    handleAddTourDate,
    handleTourDateChange,
    handleAddAgeRange,
    handleRemoveAgeRange,
    handleAgeRangeChange,
    validateAgeRanges,
  };

  return (
    <TourFormUiProvider value={ui}>
      <div className="space-y-8">
        {/* Hata Mesajları */}
        {submitError && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Hata! </strong>
            <span className="block sm:inline">{submitError}</span>
            {Object.entries(errors).length > 0 && (
              <ul className="mt-2 list-disc list-inside">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form id="tour-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Temel Bilgiler */}
          {step === 'basic' && <TourFormBasicStep />}

          {/* Detaylar */}
          {step === 'details' && <TourFormDetailsStep />}

          {/* Tur tarihleri yalnızca detay adımında */}
          {step === 'details' ? <TourFormDatesSection /> : null}

          {/* Form Gönderme */}
          <TourFormFooter />
        </form>
      </div>
    </TourFormUiProvider>
  );
}

export default TourForm;
