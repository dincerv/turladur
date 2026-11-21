/** Split from tour-form.tsx (Faz 7) — constants/helpers only. */

import { HEALTH_PRIVILEGE_OPTIONS } from '@/lib/constants/health-privileges';
import type { TourFormData } from './tour-form.types';

export const TOUR_OPTIONS = {
  includes: [
    'Konaklama',
    'Kahvaltı',
    'Öğle Yemeği',
    'Akşam Yemeği',
    'Rehberlik Hizmeti',
    'Ulaşım',
    'Müze Giriş Ücretleri',
    'Seyahat Sigortası',
    'Transfer Hizmeti',
    'Wifi',
    'Ara Öğün İkramları',
    'Fotoğraf Çekimi',
  ],
  excludes: [
    'Alkollü İçecekler',
    'Ekstra Aktiviteler',
    'Kişisel Harcamalar',
    'Öğle Yemeği',
    'Akşam Yemeği',
    'Müze Giriş Ücretleri',
    'Bahşişler',
    'Vize Ücreti',
    'Yurtdışı Çıkış Harcı',
  ],
  healthPrivileges: HEALTH_PRIVILEGE_OPTIONS,
  features: [
    'Ücretsiz İptal',
    'Hemen Onay',
    'Çocuk İndirimi',
    'Erken Rezervasyon İndirimi',
    'Tam Pansiyon',
    'Yarım Pansiyon',
    'Her Şey Dahil',
    'Rehberli Tur',
    'Özel Araç',
    'Lüks Konaklama',
    'Aile Dostu',
    'Engelli Dostu',
    'Evcil Hayvan Dostu',
    'Fotoğraf Turu',
    'Doğa Yürüyüşü',
    'Deniz Aktiviteleri',
    'Kültür Turu',
    'Macera Aktiviteleri',
  ],
} as const;

export const defaultFormData: TourFormData = {
  title: '',
  description: '',
  price: '',
  location: '',
  duration: '',
  nights: '',
  maxParticipants: 0,
  currentParticipants: 0,
  images: [],
  includes: [],
  excludes: [],
  healthPrivileges: [],
  itinerary: [],
  status: 'draft',
  departureCity: [''], // Boş bir string ile başlat
  region: '',
  transportation: '',
  period: '',
  stayKind: '',
  destinationScope: '',
  tourType: '',
  accommodationType: '',
  ageRestriction: '',
  languages: [],
  tags: [],
  tourDates: [
    {
      startDate: '',
      endDate: '',
      price: '',
      availableSeats: '0',
      soldSeats: '0',
      minParticipants: '',
      maxParticipants: '',
      earlyBirdDiscount: '',
      lastMinuteDiscount: '',
      earlyBirdDeadline: '',
      lastMinuteStart: '',
      notes: '',
      status: 'ACTIVE',
      ageRanges: [],
      earlyBirdDeadlineStart: '',
      earlyBirdDeadlineEnd: '',
      lastMinuteStartStart: '',
      lastMinuteStartEnd: '',
      isExpanded: true,
      waitingList: '0',
      discount: '0',
    },
  ],
  discount: 0,
  destinations: [{ city: '', description: '' }], // En az bir boş destinasyon
  reviews: 0,
  isJointTour: false,
  features: [],
  startDate: '',
  endDate: '',
  accommodationName: '',
  meetingPoint: '',
  meetingTime: '',
  pickupPoints: [],
  routeStops: [],
  mainImage: null,
  galleryImages: [],
};

export { TURKEY_CITIES } from '@/lib/turkey-cities';

export function turkishToLower(str: string) {
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ş/g, 'ş')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç')
    .toLowerCase();
}

export const TURKEY_REGIONS = {
  Marmara: [
    'İstanbul',
    'Bursa',
    'Kocaeli',
    'Sakarya',
    'Tekirdağ',
    'Edirne',
    'Kırklareli',
    'Balıkesir',
    'Çanakkale',
    'Yalova',
    'Bilecik',
  ],
  Ege: [
    'İzmir',
    'Aydın',
    'Muğla',
    'Denizli',
    'Manisa',
    'Afyonkarahisar',
    'Kütahya',
    'Uşak',
  ],
  Akdeniz: [
    'Antalya',
    'Mersin',
    'Adana',
    'Hatay',
    'Osmaniye',
    'Isparta',
    'Burdur',
    'Kahramanmaraş',
  ],
  'İç Anadolu': [
    'Ankara',
    'Konya',
    'Kayseri',
    'Eskişehir',
    'Sivas',
    'Aksaray',
    'Karaman',
    'Kırıkkale',
    'Kırşehir',
    'Nevşehir',
    'Niğde',
    'Yozgat',
  ],
  Karadeniz: [
    'Trabzon',
    'Rize',
    'Artvin',
    'Giresun',
    'Ordu',
    'Samsun',
    'Sinop',
    'Kastamonu',
    'Zonguldak',
    'Bartın',
    'Düzce',
    'Bolu',
    'Amasya',
    'Tokat',
    'Gümüşhane',
    'Bayburt',
  ],
  'Doğu Anadolu': [
    'Erzurum',
    'Erzincan',
    'Kars',
    'Ağrı',
    'Iğdır',
    'Ardahan',
    'Malatya',
    'Elazığ',
    'Bingöl',
    'Tunceli',
    'Van',
    'Bitlis',
    'Muş',
    'Hakkari',
  ],
  'Güneydoğu Anadolu': [
    'Diyarbakır',
    'Şanlıurfa',
    'Mardin',
    'Batman',
    'Siirt',
    'Şırnak',
    'Adıyaman',
    'Gaziantep',
    'Kilis',
  ],
};

// Şehir-bölge eşleştirmesi için yardımcı fonksiyon
export const getRegionByCity = (city: string): string => {
  for (const [region, cities] of Object.entries(TURKEY_REGIONS)) {
    if (cities.includes(city)) {
      return region;
    }
  }
  return '';
};

// Önceden tanımlanmış etiketler
export const AVAILABLE_TAGS = [
  'Doğa',
  'Tarih',
  'Kültür',
  'Deniz',
  'Dağ',
  'Şehir',
  'Gastronomi',
  'Spor',
  'Macera',
  'Balayı',
  'Aile',
  'Romantik',
  'Ekonomik',
  'Lüks',
  'Balıkçılık',
  'Yürüyüş',
  'Fotoğrafçılık',
  'Yoga',
  'Meditasyon',
  'Festival',
  'Müze',
  'Arkeoloji',
  'Termal',
  'Spa',
  'Golf',
  'Dalış',
  'Rafting',
  'Kayak',
  'Kamp',
  'Tekne',
];
