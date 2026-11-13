import { Eye, Globe, Heart, Lightbulb, ShieldCheck, Users } from 'lucide-react';

import type {
  AboutOfficeImage,
  AboutStoryBlock,
  AboutValue,
} from './about.types';

export const ABOUT_VALUES: readonly AboutValue[] = [
  {
    title: 'Şeffaflık',
    description:
      'Her turun arkasında hangi acentenin olduğu görünür. Fiyat ve koşullar net yazılır.',
    icon: Eye,
  },
  {
    title: 'Güven',
    description:
      'Acenteler başvurur, ekibimiz inceler. Yayınlanan turlar onaylı işletmelerden gelir.',
    icon: ShieldCheck,
  },
  {
    title: 'Yerel ekosistem',
    description:
      'Türkiye’deki tur acentelerini tek yerde buluşturuyoruz; gezgin de acente de kazansın.',
    icon: Globe,
  },
  {
    title: 'Kullanıcı odaklılık',
    description:
      'Arama, karşılaştırma ve rezervasyonu sade tutuyoruz. Gereksiz adım yok.',
    icon: Heart,
  },
  {
    title: 'İş birliği',
    description:
      'Acentelerle birlikte büyüyoruz. Turlarını yayınlasınlar, yeni gezginlere ulaşsınlar.',
    icon: Users,
  },
  {
    title: 'Sade teknoloji',
    description:
      'Gösterişli vaat yerine çalışan ürün: rezervasyon, ödeme ve iletişim tek platformda.',
    icon: Lightbulb,
  },
];

export const ABOUT_HERO_IMAGE: AboutOfficeImage = {
  src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1800&q=80',
  alt: 'turta çalışma alanı — aydınlık ofis ve ortak masa',
  cellClassName: 'aspect-[16/10] md:aspect-[21/9]',
  priority: true,
};

export const ABOUT_STORY_BLOCKS: readonly AboutStoryBlock[] = [
  {
    eyebrow: 'Hikayemiz',
    title: 'Acente belli, fiyat açık, rezervasyon net',
    paragraphs: [
      'Bir turu kimin düzenlediğini görmeden rezervasyon yapmak istemezsiniz. turta’da her turda acente adı yer alır; onaylı işletmeler yayınlar.',
      'Henüz yolun başındayız: Türkiye’deki turları tek platformda topluyor, rezervasyonu sadeleştiriyoruz. Büyük laflar yerine çalışan bir ürün kuruyoruz.',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80',
      alt: 'Harita ve seyahat planı üzerinde çalışan ekip',
      cellClassName: 'aspect-[4/3]',
    },
    imageRight: true,
  },
  {
    eyebrow: 'Misyon & vizyon',
    title: 'Gezgini ve acenteyi aynı masada buluşturmak',
    paragraphs: [
      'Misyonumuz; Türkiye’deki tur acentelerinin ürünlerini şeffaf, güvenli ve sade bir deneyimle gezginlere ulaştırmak.',
      'Vizyonumuz; yerel turizmin dijital vitrini olmak — abartılı vaatler olmadan, Ankara’dan büyüyen bir pazaryeri.',
    ],
    image: {
      src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80',
      alt: 'Ekip masasında iş birliği ve planlama',
      cellClassName: 'aspect-[4/3]',
    },
    imageRight: false,
  },
];

/** Static office gallery — not CMS/seed; layout-only imagery. */
export const ABOUT_OFFICE_IMAGES: readonly AboutOfficeImage[] = [
  {
    src: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80',
    alt: 'Açık ofis alanı ve doğal ışık',
    /** Tall left tile in the 2-column bento. */
    cellClassName: 'row-span-2',
    priority: false,
  },
  {
    src: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=900&q=80',
    alt: 'Toplantı köşesi',
    cellClassName: '',
  },
  {
    src: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
    alt: 'Ekip çalışması',
    cellClassName: '',
  },
  {
    src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    alt: 'Koridor ve cam ofisler',
    cellClassName: 'col-span-2',
  },
];
