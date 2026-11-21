/**
 * Seed turlara uzun günlük program (sabah/öğle/akşam akışı + öğün + konaklama).
 */
import { PrismaClient } from '../src/generated/prisma/index.js';
import Redis from 'ioredis';

const prisma = new PrismaClient();

const RICH = {
  'Kapadokya Peri Bacaları': {
    description:
      'Kapadokya’nın peri bacaları, vadileri ve yeraltı şehirleri arasında üç günlük bir kültür kaçamakı. Göreme ve Uçhisar çevresinde panoramik seyir noktaları, açık hava müzesi ziyareti ve Avanos’ta geleneksel çömlek atölyesi deneyimi sizi bekliyor. Akşamları mağara otelde dinlenirken bölgenin sakin temposunu hissedersiniz; sabah erken saatlerde vadi yürüyüşü veya isteğe bağlı sıcak hava balonu için serbest zaman bırakılır. Küçük grup temposu sayesinde fotoğraf molaları ve yerel lezzet durakları acele etmeden planlanır. Tur, Nevşehir kalkışlıdır; transferler klimalı araçla yapılır ve tüm gezi noktalarında lisanslı rehber eşlik eder.',
    itinerary: [
      {
        dayNumber: 1,
        title: 'Göreme Vadisi ve Uçhisar Panoraması',
        description:
          'Sabah: Nevşehir’de belirtilen kalkış noktasında buluşma, rehber tanışması ve gün brifingi. Klimalı araçla Göreme bölgesine kısa transfer; yolda peri bacası oluşumları hakkında ilk bilgilendirme yapılır.\n\nÖğleden önce: Uçhisar Kalesi’ne çıkış (tempo herkese uygun tutulur). Kalenin seyir terasından Göreme, Avanos ve Kızılırmak ovasına bakan panoramik manzara; rehber eşliğinde bölgenin jeolojisi ve yerleşim tarihi anlatılır. Fotoğraf molaları için yeterli süre bırakılır.\n\nÖğle: Serbest zaman — rehberin önerdiği yerel restoranlarda (ücrete dahil değildir) hafif öğle yemeği veya çay molası.\n\nÖğleden sonra: Göreme vadisinde kısa ve düzlük ağırlıklı yürüyüş. Peri bacası kümeleri arasında ilerlerken güvenlik uyarısı ve tempo ayarı yapılır; isteyen misafirler kısa bir seyir noktasında dinlenebilir.\n\nAkşam: Mağara / butik otelde check-in. Oda yerleşimi sonrası serbest zaman; isteğe bağlı olarak Göreme merkezde kısa akşam yürüyüşü önerilir. Ertesi gün için balon opsiyonu ve kahvaltı saati hatırlatılır.',
        highlights: [
          'Uçhisar Kalesi',
          'Vadi yürüyüşü',
          'Mağara otel',
          'Rehberli brifing',
        ],
        meals: {
          breakfast: 'EXCLUDED',
          lunch: 'FREE_TIME',
          dinner: 'EXCLUDED',
        },
        accommodation:
          'Göreme — mağara / butik otel (kahvaltı ertesi sabah dahil)',
      },
      {
        dayNumber: 2,
        title: 'Açık Hava Müzesi ve Avanos Atölyesi',
        description:
          'Sabah: Otelde kahvaltı sonrası Göreme Açık Hava Müzesi’ne geçiş. Kayadan oyma kiliseler ve freskler rehber eşliğinde gezilir; müze içinde tempolu değil, anlatımlı bir rota izlenir. Giriş ücreti paket kapsamında belirtilen şekilde karşılanır. Kalabalık günlerde sıra bekleme süreleri esnetilebilir; rehber alternatif bir kilise rotası önerebilir.\n\nÖğleden önce: Müze içinde kısa dinlenme aralıkları ve fotoğraf için uygun noktalarda mola. Kapalı alanlarda ses seviyesi ve dokunma kuralları hatırlatılır.\n\nÖğle: Müze çıkışında serbest zaman. Çevredeki kafelerde kısa mola veya hafif atıştırmalık (hariç). Net toplanma saati verilir.\n\nÖğleden sonra: Kızılırmak kenarında Avanos’a transfer. Geleneksel çömlek atölyesinde usta anlatımı ve kısa uygulamalı deneyim; isteyen misafirler kendi küçük parçasını şekillendirebilir. Atölye sonrası çarşıda hediyelik için kısa serbest dolaşım.\n\nAkşam: Otele dönüş. Akşam yemeği serbest — rehber yöresel restoran önerilerini paylaşır. Ertesi gün check-out saati, bagaj hazırlığı ve Ürgüp programı özetlenir.',
        highlights: [
          'Açık Hava Müzesi',
          'Fresk anlatımı',
          'Çömlek deneyimi',
          'Avanos',
        ],
        meals: {
          breakfast: 'INCLUDED',
          lunch: 'FREE_TIME',
          dinner: 'EXCLUDED',
        },
        accommodation: 'Göreme — mağara / butik otel',
      },
      {
        dayNumber: 3,
        title: 'Ürgüp Dokusu ve Dönüş',
        description:
          'Sabah: Kahvaltı ve check-out. Odalar teslim edilir, bagajlar araca yüklenir; kısa bir transferle Ürgüp’ün tarihi sokaklarına geçilir. Rehber günün tahmini dönüş saatini ve bırakış noktasını hatırlatır.\n\nÖğleden önce: Ürgüp’te taş ev dokusu, seyir noktaları ve yerel dükkânlar eşliğinde rahat tempolu kültür turu. Son grup fotoğrafı ve hediyelik molası için yeterli süre bırakılır.\n\nÖğle: Serbest — dönüş öncesi hızlı bir atıştırmalık için zaman tanınır (hariç). Rehber birkaç pratik seçenek önerir.\n\nÖğleden sonra: Nevşehir / kalkış noktasına dönüş transferi. Yolda tur özeti, memnuniyet notları ve acente iletişim hatırlatması yapılır. Araçta bagaj kontrolü sonrası tur resmi olarak sona erer.\n\nNot: Bu gün konaklama yoktur; aynı gün dönüş planınıza göre havaalanı / otogar bağlantısı kendi imkânlarınızladır. Erken uçuşu olan misafirler bir gün önceden rehbere bildirmelidir.',
        highlights: ['Ürgüp', 'Taş evler', 'Dönüş transferi'],
        meals: {
          breakfast: 'INCLUDED',
          lunch: 'EXCLUDED',
          dinner: 'EXCLUDED',
        },
        accommodation: null,
      },
    ],
  },
  'İstanbul Boğaz & Tarih': {
    description:
      'İstanbul’un tarihî yarımadasını ve Boğaz silüetini tek günde özetleyen kompakt kültür turu. Ayasofya ve Sultanahmet çevresinde rehberli anlatım, Kapalıçarşı’da kısa serbest zaman ve öğleden sonra Boğaz hattında manzara molası ile gün tamamlanır. Tempo yürüyüş ağırlıklıdır; uygun ayakkabı önerilir. Öğle yemeği için yerel restoran önerileri paylaşılır (yemek ücrete dahil değildir). Küçük grup sayesinde kalabalık noktalarda toplanma ve fotoğraf aralıkları daha rahat yönetilir. Tur İstanbul içi belirtilen kalkış noktalarından başlar ve aynı gün akşam saatlerinde sona erer.',
    itinerary: [
      {
        dayNumber: 1,
        title: 'Tarihi Yarımada, Kapalıçarşı ve Boğaz Turu',
        description:
          'Sabah: Belirtilen kalkış / buluşma noktasında toplanma (en az 15 dk önce gelmeniz önerilir). Rehber tanışması, gün rotası, güvenlik ve kalabalık uyarıları. Uygun ayakkabı ve su şişesi önerilir. Tarihi yarımadaya yürüyüş veya kısa transferle geçiş.\n\nÖğleden önce: Sultanahmet Meydanı çevresinde Hipodrom, Ayasofya dış cephe anlatımı ve dönemin kentsel dokusu. Müze içi ziyaretler programda belirtilen kapsama göre yapılır; kuyruk durumuna göre sıra esnetilebilir. Fotoğraf için kısa seyir molaları planlanır; rehber toplanma işaretini hatırlatır.\n\nÖğle: Kapalıçarşı bölgesinde serbest zaman. Rehber, bütçeye göre birkaç yerel lokanta önerisi paylaşır; yemek ücrete dahil değildir. Alışveriş yapan misafirler için net bir toplanma saati ve noktası verilir; kaybolma ihtimaline karşı harita / pin paylaşılır.\n\nÖğleden sonra: Boğaz hattına geçiş. Uygun bir seyir noktasında (iskele / sahil bandı) silüet anlatımı ve grup fotoğrafı. Tempo yorgunluğa göre ayarlanır; oturarak dinlenme imkânı olan noktalar tercih edilir. Rüzgârlı günlerde ekstra katman önerilir.\n\nAkşam erken: Kalkış noktasına dönüş ve tur kapanışı. Günübirlik program olduğu için konaklama yoktur; akşam yemeği kendi planınıza bırakılır. Rehber acente iletişim bilgisini ve kayıp eşya prosedürünü hatırlatır.',
        highlights: [
          'Sultanahmet',
          'Kapalıçarşı',
          'Boğaz manzarası',
          'Rehberli anlatım',
        ],
        meals: {
          breakfast: 'EXCLUDED',
          lunch: 'FREE_TIME',
          dinner: 'EXCLUDED',
        },
        accommodation: null,
      },
    ],
  },
  'Karadeniz Yayla Escape': {
    description:
      'Doğu Karadeniz’in yaylalarını, vadilerini ve kültür duraklarını kapsayan sekiz günlük macera kaçamakı. Trabzon kalkışlı rotada Sümela Manastırı, Uzungöl, Ayder, Zilkale ve Pokut gibi ikonik noktalar günlere yayılır; her gün rehber eşliğinde gezi, kısa yürüyüş ve yöresel lezzet molaları planlanır. Konaklamalar dağ evi ve yayla oteli karışımıdır; kahvaltılar dahildir. Bulut denizi için erken kalkışlar önerilir — hava koşullarına göre sıra esnetilebilir. Orta seviye yürüyüş yeterlidir; yağmurluk ve katmanlı giysi şarttır. Grup temposu fotoğraf ve çay molalarına izin verecek şekilde tutulur. Acil durumlar için rehber iletişim bilgisi turdan bir gün önce SMS ile paylaşılır.',
    itinerary: [
      {
        dayNumber: 1,
        title: 'Trabzon Buluşma, Sümela ve Uzungöl',
        description:
          'Sabah: Trabzon’da belirtilen kalkış noktasında buluşma (en az 15 dk önce gelmeniz önerilir). Bagajlar araca yerleştirilir; rehber gün rotası, hava durumu, tempo ve acil iletişim bilgilerini özetler. Klimalı araçla Maçka yönüne hareket edilir; yolda kısa bir mola ile su ve atıştırmalık ikmali yapılabilir.\n\nÖğleden önce: Sümela Manastırı ziyareti. Yürüyüş patikası ve merdivenler orta zorluktadır; rehber tempo ve dinlenme aralıklarını gruba göre ayarlar. Manastırın tarihçesi, freskleri ve vadinin jeolojisi yerinde anlatılır. Fotoğraf için seyir teraslarında yeterli süre bırakılır; yağışlı havada zemin kaygan olabileceğinden uygun ayakkabı şarttır.\n\nÖğle: Serbest — çevredeki restoranlarda hafif öğle yemeği veya paket atıştırmalık (ücrete dahil değildir). Rehber birkaç bütçe seçeneği önerir ve net bir toplanma saati verir. Araçta su ikmali hatırlatılır.\n\nÖğleden sonra: Uzungöl’e transfer. Göl kenarında kısa yürüyüş, çay molası ve ilk yayla atmosferi. Check-in için dağ evine geçiş; oda dağılımı, Wi‑Fi / yemek saatleri ve akşam serbest zaman bilgisi paylaşılır. İsteyen misafirler göl çevresinde kısa bir akşam yürüyüşü yapabilir.\n\nAkşam: Yöresel lezzet için serbest. Ertesi gün kahvaltı saati ve isteğe bağlı sabah yürüyüşü özetlenir; yağmurluk ve katmanlı giysi hazır bulundurulması önerilir.',
        highlights: ['Sümela', 'Uzungöl', 'Dağ evi', 'Vadinin ilk bakışı'],
        meals: {
          breakfast: 'EXCLUDED',
          lunch: 'FREE_TIME',
          dinner: 'EXCLUDED',
        },
        accommodation: 'Uzungöl dağ evi — kahvaltı ertesi sabah dahil',
      },
      {
        dayNumber: 2,
        title: 'Uzungöl Çevresi ve Yöresel Tempo',
        description:
          'Sabah: Dağ evinde kahvaltı sonrası grup toplanır. Hava durumuna göre göl çevresi yürüyüş rotası seçilir; düz kıyı bandı veya hafif yükselen panoramik alternatifler sunulur. Rehber bitki örtüsü, yayla yaşamı ve bölgenin turizm dokusu hakkında kısa anlatımlar yapar. Tempo herkese uygun tutulur; dinlenme banklarında molalar verilir.\n\nÖğleden önce: Göl kenarında fotoğraf molası ve isteğe bağlı kısa seyir noktası tırmanışı (zorunlu değildir). Sis / bulut geçişlerinde ekstra süre bırakılabilir.\n\nÖğle: Serbest — göl kenarı kafelerde çay, tandır ekmek veya hafif öğün önerilir (hariç). Rehber toplanma noktası ve saati netleştirir.\n\nÖğleden sonra: İsteğe bağlı kısa yayla patikası veya otelde dinlenme. Yağmur durumunda kapalı mekân aktivitesi, yerel üretim dükkânı ziyareti veya otel lobisinde çay molası planlanır. Enerjisi yerinde olanlar için rehber güvenli bir kısa rota paylaşır.\n\nAkşam: Serbest. Ertesi gün Ayder transferi için bagaj hazırlığı, check-out saati ve araç yükleme sırası hatırlatılır.',
        highlights: ['Göl yürüyüşü', 'Yöresel lezzet', 'Esnek tempo'],
        meals: {
          breakfast: 'INCLUDED',
          lunch: 'FREE_TIME',
          dinner: 'EXCLUDED',
        },
        accommodation: 'Uzungöl dağ evi',
      },
      {
        dayNumber: 3,
        title: 'Fırtına Vadisi ve Ayder’e Geçiş',
        description:
          'Sabah: Kahvaltı ve check-out. Odalar teslim edilir, bagajlar araca alınır; Çamlıhemşin / Ayder güzergâhına hareket edilir. Yola çıkmadan önce rehber gün boyu mola noktalarını ve tahmini varış saatini paylaşır.\n\nYol boyu: Fırtına Vadisi’nde birkaç manzara molası. Rehber, derenin debisi, tarihi köprüler ve yayla yolları hakkında bilgi verir. Kısa çay molası ve fotoğraf için güvenli seyir noktaları seçilir; dar yol kenarlarında araçtan inerken dikkat uyarısı yapılır.\n\nÖğle: Serbest — yol üstü lokantalarda veya paketli atıştırmalıkla (hariç). Grup temposuna göre mola süresi esnetilebilir.\n\nÖğleden sonra: Ayder’e varış, otel / pansiyon check-in. Oda yerleşimi sonrası köy merkezinde kısa oryantasyon yürüyüşü: market, eczane, termal bilgilendirme ve akşam yemeği önerileri. İsteyen misafirler köy içi kısa bir keşif turu yapabilir.\n\nAkşam: Serbest. Ertesi gün Zilkale programı, yürüyüş ayakkabısı ve yağmurluk uyarısı yapılır; erken kahvaltı saati yazılı olarak hatırlatılır.',
        highlights: ['Fırtına Vadisi', 'Ayder', 'Oryantasyon'],
        meals: {
          breakfast: 'INCLUDED',
          lunch: 'FREE_TIME',
          dinner: 'EXCLUDED',
        },
        accommodation: 'Ayder yayla oteli / termal konaklama',
      },
      {
        dayNumber: 4,
        title: 'Zilkale ve Vadi Yürüyüşü',
        description:
          'Sabah: Kahvaltı sonrası Zilkale’ye transfer. Kale ziyareti ve Fırtına Vadisi’ne bakan seyir noktaları; rehber tarihçe, mimari katmanlar ve restorasyon notlarını paylaşır. Fotoğraf için yeterli süre bırakılır; rüzgârlı günlerde yüksek noktalarda dikkat uyarısı yapılır.\n\nÖğleden önce: Kısa vadi yürüyüşü (orta tempo). Kaygan zemin uyarısı; yağmurluk ve uygun tabanlı ayakkabı zorunlu kabul edilir. Dinlenme banklarında çay molası ve grup temposuna göre esnek mola aralıkları uygulanır.\n\nÖğle: Serbest veya paket atıştırmalık (hariç). Rehber yakındaki basit lokanta seçeneklerini paylaşır; toplanma saati net verilir.\n\nÖğleden sonra: Ayder’e dönüş. İsteğe bağlı termal / dinlenme molası (ücretli ekstralar misafire aittir). Serbest zaman — otelde dinlenme veya köy içi kısa yürüyüş.\n\nAkşam: Serbest. Ertesi gün Pokut için erken kalkış ihtimali, hava durumu planı B ve kahvaltı saati hatırlatılır; alarm kurmanız önerilir.',
        highlights: ['Zilkale', 'Vadi yürüyüşü', 'Termal mola'],
        meals: {
          breakfast: 'INCLUDED',
          lunch: 'EXCLUDED',
          dinner: 'EXCLUDED',
        },
        accommodation: 'Ayder yayla oteli / termal konaklama',
      },
      {
        dayNumber: 5,
        title: 'Pokut Yaylası — Bulut Denizi',
        description:
          'Sabah (erken): Hava uygunsa Pokut Yaylası’na çıkış. Bulut denizi ihtimali için şafak / sabah saatleri tercih edilir; sis veya kapalı havada alternatif seyir noktası seçilir. Araç + kısa yürüyüş kombinasyonu; rehber tempo ve güvenlik aralıklarını ayarlar. Soğuk rüzgâr için ekstra katman ve eldiven önerilir.\n\nYaylada: Seyir teraslarında uzun fotoğraf molası, rehber eşliğinde yayla kültürü ve göçer yaşam anlatımı, sıcak çay molası. Bulut tabakası hareket ederken ekstra bekleyiş süresi bırakılabilir. İstemeyen misafirler araç yakınında dinlenebilir.\n\nÖğle: Serbest — dönüş yolunda veya Ayder’de (hariç). Rehber birkaç pratik öğün seçeneği önerir.\n\nÖğleden sonra: Otele dönüş ve tam serbest zaman. Yorgunluk varsa dinlenme; enerjisi yerinde olanlar köy içi kısa yürüyüş veya termal mola (ekstra) yapabilir. Rehber güvenli güzergâh notlarını paylaşır.\n\nAkşam: Serbest. Ertesi günün “serbest gün” planı, isteğe bağlı aktiviteler ve önerilen dinlenme temposu konuşulur.',
        highlights: ['Pokut', 'Bulut denizi', 'Çay molası'],
        meals: {
          breakfast: 'INCLUDED',
          lunch: 'FREE_TIME',
          dinner: 'EXCLUDED',
        },
        accommodation: 'Ayder yayla oteli',
      },
      {
        dayNumber: 6,
        title: 'Yayla Serbest Günü',
        description:
          'Sabah: Kahvaltı sonrası tamamen esnek program. İsteyen misafirler rehberle kısa ve kolay bir yayla yürüyüşüne katılabilir; istemeyenler otelde veya köyde dinlenir. Sabah brifinginde gün boyu önerilen aktiviteler, yaklaşık süreler ve güvenlik notları paylaşılır.\n\nÖğleden önce (opsiyonel): Kolay tempo yayla patikası veya köy içi kültür yürüyüşü. Fotoğraf noktaları ve dinlenme bankları rota içinde işaretlenir.\n\nGün boyu: Yöresel pazar / el sanatları dükkânları, fotoğraf noktaları veya spa / termal (ekstra) için serbest zaman. Rehber, güvenli yürüyüş güzergâhları ve taksi / dolmuş notlarını paylaşır; yalnız dolaşan misafirler için dönüş saati önerilir.\n\nÖğle & akşam: Serbest — yerel mutfak denemeleri için öneri listesi verilir (muhlama, mısır ekmeği, bal-kaymak vb.; ücrete dahil değildir).\n\nAkşam: Kısa grup toplantısı; ertesi gün Çamlıhemşin lezzet rotası, toplanma saati ve yağış planı B özetlenir.',
        highlights: ['Serbest zaman', 'Yöresel pazar', 'Opsiyonel yürüyüş'],
        meals: {
          breakfast: 'INCLUDED',
          lunch: 'FREE_TIME',
          dinner: 'FREE_TIME',
        },
        accommodation: 'Ayder yayla oteli',
      },
      {
        dayNumber: 7,
        title: 'Çamlıhemşin Lezzet ve Son Fotoğraflar',
        description:
          'Sabah: Kahvaltı sonrası Çamlıhemşin merkezine kısa transfer. Nehir kenarı yürüyüşü, köprü seyirleri ve son grup fotoğrafları için rahat bir tempo tutulur. Rehber bölgenin ticaret ve yayla kültürü hakkında kısa bir özet anlatım yapar.\n\nÖğleden önce: Merkez sokaklarında kısa serbest dolaşım; hediyelik ve yerel ürün dükkânları için mola. Toplanma noktası ve saati net verilir.\n\nÖğle: Yöresel lezzet durağı — muhlama, mısır ekmeği, bal-kaymak gibi tatlar için restoran önerisi (yemek ücrete dahil değildir; serbest seçim). Alerji / diyet kısıtı olan misafirler rehbere önceden haber vermelidir.\n\nÖğleden sonra: Son manzara noktaları ve hediyelik molası. Otele dönüş, bagaj düzeni ve veda öncesi serbest zaman. İsteyenler kısa bir nehir kenarı yürüyüşü daha yapabilir.\n\nAkşam: İsteğe bağlı veda yemeği önerisi (hariç). Ertesi gün check-out, Trabzon dönüş saati ve bırakış noktası netleştirilir; uçak / otogar bağlantısı olan misafirler için saat uyumu konuşulur.',
        highlights: ['Çamlıhemşin', 'Yöresel lezzet', 'Son fotoğraflar'],
        meals: {
          breakfast: 'INCLUDED',
          lunch: 'FREE_TIME',
          dinner: 'EXCLUDED',
        },
        accommodation: 'Ayder veya Çamlıhemşin konaklama',
      },
      {
        dayNumber: 8,
        title: 'Trabzon Dönüş ve Kapanış',
        description:
          'Sabah: Kahvaltı ve check-out. Odalar teslim edilir, bagajlar araca yüklenir; oda anahtarları / kartları resepsiyona bırakılır. Rehber son yolculuk brifingini yapar: tahmini varış saati, mola planı ve bırakış noktası tekrarı.\n\nTransfer: Trabzon yönüne hareket. Yolda tur özeti, memnuniyet geri bildirimi ve acente iletişim bilgileri paylaşılır. Kısa bir çay / dinlenme molası yapılabilir (süreye göre).\n\nVarış: Belirlenen bırakış noktası (otogar / merkez / anlaşmalı nokta). Bagaj kontrolü sonrası tur resmi olarak sona erer. Rehber, acente destek hattını ve kayıp eşya prosedürünü hatırlatır.\n\nNot: Bu gün konaklama yoktur. Uçak / şehirlerarası bağlantılar kendi planınıza aittir; rehber mümkün olduğunca saat uyumunu gözetir ancak garanti etmez. Erken uçuşu olan misafirler bir gün önceden rehbere bildirmelidir.',
        highlights: ['Dönüş transferi', 'Tur kapanışı'],
        meals: {
          breakfast: 'INCLUDED',
          lunch: 'EXCLUDED',
          dinner: 'EXCLUDED',
        },
        accommodation: null,
      },
    ],
  },
};

function match(title) {
  for (const [prefix, copy] of Object.entries(RICH)) {
    if (title.startsWith(prefix)) return copy;
  }
  return null;
}

async function main() {
  const tours = await prisma.tour.findMany({
    where: { deletedAt: null, slug: { startsWith: 'seed-tour-' } },
    select: { id: true, title: true, slug: true, extras: true },
  });

  let updated = 0;
  for (const tour of tours) {
    const copy = match(tour.title);
    if (!copy) continue;
    const prev =
      tour.extras &&
      typeof tour.extras === 'object' &&
      !Array.isArray(tour.extras)
        ? { ...tour.extras }
        : {};
    const asRecord = Object.fromEntries(
      copy.itinerary.map((day, i) => [
        `day${(day.dayNumber ?? i + 1) - 1}`,
        day,
      ]),
    );
    await prisma.tour.update({
      where: { id: tour.id },
      data: {
        description: copy.description,
        extras: {
          ...prev,
          itinerary: asRecord,
          itineraryDays: copy.itinerary,
        },
      },
    });
    updated += 1;
    console.log(
      'updated',
      tour.slug,
      'day1len',
      copy.itinerary[0].description.length,
    );
  }

  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');
    const keys = await redis.keys('catalog:tour:*');
    if (keys.length) await redis.del(...keys);
    console.log('cleared redis', keys.length);
    await redis.quit();
  } catch (err) {
    console.log('redis skip', String(err));
  }

  console.log(JSON.stringify({ total: tours.length, updated }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
