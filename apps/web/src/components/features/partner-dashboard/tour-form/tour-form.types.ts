/** Split from tour-form.tsx (Faz 7) — types only; UI unchanged. */

export interface ImageFile {
  url: string;
  file: File | null;
  preview?: string;
}

export interface AgeRange {
  minAge: number;
  maxAge: number | null;
  pricingType: 'free' | 'half' | 'percentage' | 'fixed';
  value?: string;
}

export interface TourDate {
  startDate: string;
  endDate: string;
  price: string;
  availableSeats: string;
  soldSeats: string;
  minParticipants: string;
  maxParticipants: string;
  earlyBirdDiscount: string;
  lastMinuteDiscount: string;
  earlyBirdDeadline: string;
  lastMinuteStart: string;
  notes: string;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
  ageRanges: AgeRange[];
  earlyBirdDeadlineStart: string;
  earlyBirdDeadlineEnd: string;
  lastMinuteStartStart: string;
  lastMinuteStartEnd: string;
  isExpanded: boolean;
  waitingList?: string; // Eklendi
  discount?: string; // Eklendi
}

export interface PickupPoint {
  id?: string;
  city: string;
  location: string;
  time: string;
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
  order: number;
  isActive: boolean;
}

export interface Destination {
  city: string;
  description?: string;
}

// Yeni: Ana görsel ve galeri görselleri için ayrı state
export interface GalleryImageFile extends ImageFile {
  description?: string;
}

export interface TourFormData {
  title: string;
  description: string;
  price: string;
  location: string;
  duration: string;
  nights: string;
  maxParticipants: number;
  currentParticipants: number;
  images: ImageFile[];
  includes: string[];
  excludes: string[];
  /** Health conditions this tour can accommodate (operator-selected). */
  healthPrivileges: string[];
  itinerary: {
    title: string;
    description: string;
    images?: { url: string; file: File | null }[];
  }[];
  status: 'active' | 'draft' | 'archived';
  departureCity: string[]; // Tek şehir yerine şehir dizisi
  region: string;
  transportation: string;
  period: string;
  stayKind: '' | 'DAY_TRIP' | 'OVERNIGHT';
  destinationScope: '' | 'DOMESTIC' | 'INTERNATIONAL';
  tourType: string;
  accommodationType: string;
  ageRestriction: string;
  languages: string[];
  tags: string[];
  tourDates: TourDate[];
  discount: number;
  destinations: Destination[];
  reviews: number;
  isJointTour: boolean;
  features: string[];
  startDate: string;
  endDate: string;
  accommodationName: string;
  meetingPoint: string;
  meetingTime: string;
  pickupPoints: PickupPoint[];
  mainImage: ImageFile | null;
  galleryImages: GalleryImageFile[];
}

export interface TourFormProps {
  initialData?: Partial<TourFormData>;
  onSubmit: (
    data: TourFormData | Record<string, unknown>,
  ) => void | Promise<void>;
  onFormDataChange?: (data: TourFormData) => void;
  onStepChange?: (step: 'basic' | 'details') => void;
  isSubmitting?: boolean;
  currentStep?: 'basic' | 'details';
  partnerId?: string;
  isUpdateMode?: boolean;
  tourId?: string;
  uploadEntityId?: string;
  uploadImage?: (file: File) => Promise<string>;
}
