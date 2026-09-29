import type { SiteContent } from "@/lib/content";
import { mapsLink, telLink, waLink } from "@/lib/utils";
import { Photo } from "./photo";
import { PresetLink } from "./preset-link";
import { TicketForm } from "./ticket-form";
import { TrackForm } from "./track-form";

type C = SiteContent;

export function Categories({ intro, categories }: { intro: C["intro"]; categories: C["categories"] }) {
  return (
    <section className="sec" id="hizmetler" aria-labelledby="cats-title">
      <div className="wrap">
        <div className="sec-head">
          <h2 className="h2" id="cats-title">{intro.title}</h2>
          <p className="lead">{intro.text}</p>
        </div>
        <div className="cats">
          {categories.map((c, i) => (
            <figure className="cat" key={`${c.title}-${i}`}>
              <Photo key={c.photo} src={c.photo} alt={c.alt} />
              <figcaption>
                <h3 className="h3">{c.title}</h3>
                <p>{c.text}</p>
                {c.tag && <span className="cat-tag">{c.tag}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Gallery({ gallery }: { gallery: C["gallery"] }) {
  if (!gallery.items.length) return null;
  return (
    <section className="sec gallery-sec" aria-labelledby="gal-title">
      <div className="wrap">
        <div className="sec-head">
          <h2 className="h2" id="gal-title">{gallery.title}</h2>
          <p className="lead">{gallery.text}</p>
        </div>
        <div className="gallery">
          {gallery.items.map((g, i) => (
            <figure key={`${g.photo}-${i}`}>
              <Photo key={g.photo} src={g.photo} alt={g.caption} />
              <figcaption>{g.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Offer({ sales, repair, whatsapp }: { sales: C["sales"]; repair: C["repair"]; whatsapp: string }) {
  return (
    <section className="sec" aria-label="Satış ve tamir">
      <div className="wrap offer-grid">
        <div className="offer-col" id="satis">
          <h2 className="big-word">Satış</h2>
          <p className="lead">{sales.lead}</p>
          <ul className="lined">
            {sales.items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
          <div className="btn-row">
            <a className="btn btn-solid" href={waLink(whatsapp, "Merhaba, stok durumunu sormak istiyorum: ")} target="_blank" rel="noopener noreferrer">
              Stok sor
            </a>
            <PresetLink className="btn btn-line" preset={{ type: "Takas", device: "" }}>
              Takas teklifi al
            </PresetLink>
          </div>
        </div>
        <div className="offer-col" id="tamir">
          <h2 className="big-word">Tamir</h2>
          <p className="lead">{repair.lead}</p>
          <ul className="lined">
            {repair.items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
          <div className="btn-row">
            <PresetLink className="btn btn-solid" preset={{ type: "Tamir" }}>
              Tamir talebi oluştur
            </PresetLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Devices({ devices }: { devices: C["devices"] }) {
  return (
    <section className="sec devices-sec" id="cihazlar" aria-labelledby="dev-title">
      <div className="wrap">
        <div className="sec-head">
          <h2 className="h2" id="dev-title">Hangi cihaza ne yapıyoruz?</h2>
          <p className="lead">Listede olmayan bir cihazın varsa yine de yaz; bakıp dönüş yapalım.</p>
        </div>
        <table className="dev-table">
          <thead>
            <tr>
              <th scope="col">Cihaz</th>
              <th scope="col">Satış</th>
              <th scope="col">Sık yapılan tamirler</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d, i) => (
              <tr key={i}>
                <th scope="row">{d.name}</th>
                <td data-label="Satış">{d.sale}</td>
                <td data-label="Sık yapılan tamirler">{d.repairs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const STEPS = [
  { t: "Cihazını getir ya da kargola", d: "Mağazaya uğra veya kargoyla gönder. Teslim alırken servis fişini veririz." },
  { t: "Ücretsiz arıza tespiti", d: "Cihazı test eder, sorunu ve fiyatı net olarak bildiririz." },
  { t: "Onayınla onarım", d: "Fiyatı onaylamadan hiçbir işlem yapılmaz. Parça seçeneğini birlikte belirleriz." },
  { t: "Test ve garantili teslim", d: "Onarımdan sonra tüm fonksiyonları test eder, cihazını garantiyle teslim ederiz." },
];

export function Bench({ store, kvkk }: { store: C["store"]; kvkk: string }) {
  return (
    <section className="bench" id="servis" aria-labelledby="bench-title">
      <div className="wrap bench-grid">
        <div>
          <h2 className="h2" id="bench-title">Tamir nasıl işler?</h2>
          <p className="bench-intro">Fişi burada doldur. Talebin bize ulaşır, fiş numaranla cihazının durumunu her an sorgulayabilirsin.</p>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.t}>
                <span className="step-no" aria-hidden="true">{i + 1}</span>
                <div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div id="fis">
          <TicketForm
            storeName={store.name}
            whatsapp={store.whatsapp}
            phoneDisplay={store.phoneDisplay}
            phoneTel={store.phoneTel}
            address={store.address}
            kvkk={kvkk}
          />
        </div>
      </div>
    </section>
  );
}

export function Track() {
  return (
    <section className="sec track-sec" id="sorgula" aria-labelledby="track-title">
      <div className="wrap track-grid">
        <div>
          <h2 className="h2" id="track-title">Fiş sorgula</h2>
          <p className="lead" style={{ marginTop: 18 }}>
            Servis fişindeki numara ve telefonunun son 4 hanesiyle cihazının hangi aşamada olduğunu gör.
          </p>
        </div>
        <TrackForm />
      </div>
    </section>
  );
}

export function RulesFaq({ rules, faq, whatsapp }: { rules: C["rules"]; faq: C["faq"]; whatsapp: string }) {
  return (
    <>
      <section className="sec rules-sec" aria-labelledby="rules-title">
        <div className="wrap">
          <div className="sec-head">
            <h2 className="h2" id="rules-title">Değişmeyen kurallarımız</h2>
            <p className="lead">Hangi cihazı getirirsen getir, her tamirde aynı şekilde çalışırız.</p>
          </div>
          <div className="rules">
            {rules.map((r, i) => (
              <div className="rule" key={i}>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="sec faq-sec" id="sss" aria-labelledby="faq-title">
        <div className="wrap faq-grid">
          <div>
            <h2 className="h2" id="faq-title">Sık sorulanlar</h2>
            <p className="lead">Cevabını bulamadığın soruyu WhatsApp&apos;tan sor.</p>
            <a className="btn btn-line" href={waLink(whatsapp, "Merhaba, bir sorum var: ")} target="_blank" rel="noopener noreferrer">
              Soru sor
            </a>
          </div>
          <div className="faq-list">
            {faq.map((f, i) => (
              <details key={i}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function SiteFooter({ store }: { store: C["store"] }) {
  return (
    <footer className="site-footer" id="iletisim">
      <div className="wrap">
        <h2 className="footer-title">Mağazaya uğra ya da yaz.</h2>
        <div className="contact-grid">
          <div>
            <h3>Adres</h3>
            <p style={{ whiteSpace: "pre-line" }}>{store.address}</p>
            <p>
              <a href={mapsLink(store.mapsQuery)} target="_blank" rel="noopener noreferrer">
                Yol tarifi al
              </a>
            </p>
          </div>
          <div>
            <h3>Çalışma saatleri</h3>
            <dl className="hours">
              {store.hours.map((h, i) => (
                <div key={i}>
                  <dt>{h.day}</dt>
                  <dd>{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3>İletişim</h3>
            <p>
              <a href={telLink(store.phoneTel)}>{store.phoneDisplay}</a>
            </p>
            <p>
              <a href={waLink(store.whatsapp, "Merhaba, bilgi almak istiyorum.")} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </p>
            {store.instagram && (
              <p>
                <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener noreferrer">
                  Instagram: @{store.instagram}
                </a>
              </p>
            )}
          </div>
        </div>
        <div className="footer-actions">
          <PresetLink className="btn btn-light" preset={{ type: "Tamir" }}>
            Tamir talebi oluştur
          </PresetLink>
          <a className="btn btn-ghost-dark" href={telLink(store.phoneTel)}>
            Ara
          </a>
        </div>
        <div className="legal">
          <p>
            Apple, iPhone, iPad, MacBook, Apple Watch, AirPods ve PlayStation ilgili şirketlerin tescilli markalarıdır.{" "}
            {store.name} bağımsız bir satış ve teknik servis noktasıdır.
          </p>
          <p>
            © {new Date().getFullYear()} {store.name}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Fab({ whatsapp }: { whatsapp: string }) {
  return (
    <a className="fab" href={waLink(whatsapp, "Merhaba, bilgi almak istiyorum.")} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp'tan yaz">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17A2.5 2.5 0 0 1 4 14.5z" />
      </svg>
      <span>WhatsApp</span>
    </a>
  );
}
