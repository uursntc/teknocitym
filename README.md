# teknocitym web sitesi

Apple, PlayStation ve bilgisayar satış ve teknik servis mağazası için web sitesi ve yönetim paneli.
Next.js 15, React 19, TypeScript, Tailwind CSS 4 ve shadcn proje yapısıyla hazırlandı.

## Neler var?

- **Kaydırmalı giriş animasyonu**: `components/ui/mac-book-neo-hero.tsx` (21st.dev FrameSequenceHero bileşeninin uyarlaması). Kaydırdıkça telefon katmanlarına ayrılır: ekran, batarya, anakart, test ve teslim.
- **Site bölümleri**: kategoriler (fotoğraflı), satış ve tamir listeleri, tezgâh fotoğrafları, cihaz tablosu, servis fişi, fiş sorgulama, kurallar, sık sorulanlar, iletişim.
- **Servis fişi**: müşteri formu doldurur, talep panele düşer ve müşteriye bir fiş numarası verilir (ör. `TC-260928-4821`).
- **Fiş sorgula**: müşteri fiş numarası ve telefonunun son 4 hanesiyle cihazının durumunu görür.
- **Yönetim paneli** (`/admin`, şifreli):
  - Talepler: listeleme, arama, duruma göre filtre, durum değiştirme, iç not, müşteriye WhatsApp'tan durum mesajı, silme.
  - Site içeriği: mağaza bilgileri, giriş animasyonu metinleri, kategoriler, fotoğraflar (adres ya da bilgisayardan yükleme), satış ve tamir listeleri, cihaz tablosu, kurallar, SSS, KVKK metni.

## Kurulum

Gerekenler: Node.js 18.18 veya üzeri (20 önerilir).

```bash
npm install
cp .env.example .env.local     # Windows'ta dosyayı kopyalayıp adını değiştir
```

`.env.local` dosyasını aç ve şifreyi yaz:

```
ADMIN_PASSWORD=guclu-bir-sifre
ADMIN_SECRET=uzun-rastgele-bir-metin
```

Çalıştır:

```bash
npm run dev
```

- Site: http://localhost:3000
- Panel: http://localhost:3000/admin

Yayına almak için:

```bash
npm run build
npm start
```

## Veriler nerede duruyor?

Panelde yapılan her değişiklik proje klasöründeki `data/` altına yazılır:

| Dosya | İçerik |
| --- | --- |
| `data/content.json` | Site metinleri ve fotoğraf adresleri |
| `data/requests.json` | Servis talepleri |
| `data/uploads/` | Panelden yüklenen fotoğraflar |

`data/content.json` yoksa `lib/default-content.json` içindeki varsayılan içerik kullanılır. Varsayılan metinleri doğrudan bu dosyadan da düzenleyebilirsin.

**Yedek:** `data/` klasörünü düzenli olarak yedekle; talepler ve yüklenen fotoğraflar buradadır.

## Nereye yüklenir?

Site **Cloudflare Workers** üzerinde çalışır ([OpenNext](https://opennext.js.org/cloudflare) ile). Panel verileri `teknocitym-data` adlı **R2 kovasında** durur (`wrangler.jsonc` içinde `DATA_BUCKET`). Kovada anahtarlar `data/` klasöründekiyle aynıdır: `content.json`, `requests.json`, `uploads/...`.

İlk kurulum (bir kere):

```bash
npx wrangler login
npx wrangler r2 bucket create teknocitym-data
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SECRET
npm run deploy
```

Sonraki güncellemeler için `npm run deploy` yeterli. Cloudflare panelinde Workers Builds ile GitHub deposunu bağlarsan her push'ta kendisi yayınlar (derleme komutu `npx opennextjs-cloudflare build`, yayın komutu `npx opennextjs-cloudflare deploy`).

- `npm run dev`: bilgisayarında çalıştırır. Veriler yerel bir R2 taklidinde (`.wrangler/` klasörü) durur.
- `npm run preview`: siteyi Cloudflare çalışma ortamında yerel olarak dener. Şifreler için `.dev.vars.example` dosyasını `.dev.vars` adıyla kopyala.
- `npm run migrate -- https://eski-adres PANEL_SIFRESI`: eski sunucudaki içerik, talep ve fotoğrafları R2 kovasına kopyalar (ayrıca `migration-backup/` klasörüne yedekler).

Cloudflare dışında `npm run build && npm start` ile klasik bir Node sunucusunda da çalışır. O zaman veriler `data/` klasörüne (ya da `DATA_DIR`) yazılır, yani kalıcı bir disk gerekir.

## Yayından önce değiştirilmesi gerekenler

Panelden (Site içeriği sekmesi) şunları mağazanın gerçek bilgileriyle güncelle:

- WhatsApp numarası, telefon, adres, harita araması, Instagram, çalışma saatleri
- **KVKK metni**: şu anki metin örnektir, mağazanın kendi aydınlatma metniyle değiştirilmeli
- Kurallar ve SSS'deki taahhütler (ücretsiz tespit, aynı gün teslim, garanti) mağazanın gerçek uygulamasıyla örtüşmeli
- Fotoğraflar: şu anki fotoğraflar Unsplash'ten (ücretsiz lisans). Mağazanın kendi fotoğraflarıyla değiştirmek en iyisi

## Giriş animasyonunu kendi videonla değiştirmek

Kareler `public/frames/` klasöründe (`frame_0001.webp` … `frame_0120.webp`, 1440 px genişlik).
Örneğin tezgâhta çekilmiş bir sökme videosunu karelere çevirmek için:

```bash
rm public/frames/*.webp
ffmpeg -i video.mp4 -vf "fps=24,scale=1440:-1" -c:v libwebp -quality 72 public/frames/frame_%04d.webp
ls public/frames | wc -l     # oluşan kare sayısı
```

Sonra `components/site/hero.tsx` içindeki `FRAME_COUNT` değerini kare sayısıyla değiştir.
Kareler koyu arka planlıysa `background` rengini karelerin kenar rengiyle aynı yap; nesne karenin ortasında değilse `focusX` / `focusY` değerlerini ayarla.
Çok uzun videolar sayfayı ağırlaştırır; 100–200 kare genellikle yeterli.

## Proje yapısı (shadcn)

```
app/
  page.tsx                 Ana sayfa
  admin/page.tsx           Yönetim paneli
  api/                     Panel ve form için API uçları
components/
  ui/mac-book-neo-hero.tsx Kaydırmalı kare dizisi bileşeni
  site/                    Site bölümleri
  admin/                   Panel bileşenleri
lib/
  default-content.json     Varsayılan metinler
  store.ts                 Depolama (Cloudflare'de R2, diğer yerlerde data/ klasörü)
  admin-schema.ts          Paneldeki form alanlarının tanımı
public/frames/             Animasyon kareleri
```

`components/ui` klasörü shadcn'in varsayılan bileşen yoludur. `npx shadcn@latest add button` gibi komutlar bileşenleri buraya ekler ve `@/components/ui/...` diye içe aktarılır. Bu yüzden 21st.dev ya da shadcn'den gelen yeni bileşenleri de buraya koy.

Stil dosyası `app/globals.css`: Tailwind 4 içe aktarmaları, `fsh-shimmer` animasyonu ve sitenin tüm stilleri. Renkler dosyanın başındaki değişkenlerde (`--ink`, `--paper` vb.).

## Paneldeki alanları değiştirmek

İçerik formu `lib/admin-schema.ts` dosyasından üretilir. Yeni bir metin alanı eklemek için:

1. `lib/default-content.json` içine alanı ekle,
2. `lib/content.ts` içindeki `SiteContent` tipine ekle,
3. `lib/admin-schema.ts` içinde ilgili bölüme bir satır ekle,
4. Alanı sitede kullan.

## Güvenlik notları

- Panel şifresi bilgisayarda `.env.local` içinde, Cloudflare'de ise Worker'ın gizli değişkenlerinde (Secrets) durur; paylaşma, Git'e ekleme.
- Oturum 12 saat geçerlidir. Çıkış yapınca çerez silinir.
- Giriş denemeleri, form gönderimleri ve fiş sorguları IP başına sınırlandırılır.
- Fiş sorgulamada müşteri yalnızca durum bilgisini görür; ad, telefon ve notlar gösterilmez.
