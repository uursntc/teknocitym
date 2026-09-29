import { SiteHeader } from "@/components/site/site-header";
import { Hero } from "@/components/site/hero";
import { Bench, Categories, Devices, Fab, Gallery, Offer, RulesFaq, SiteFooter, Track } from "@/components/site/sections";
import { getContent } from "@/lib/store";
import { waLink } from "@/lib/utils";

// Panelde yapılan değişiklikler anında görünsün diye sayfa her istekte oluşturulur
export const dynamic = "force-dynamic";

export default async function Home() {
  const c = await getContent();
  const wa = waLink(c.store.whatsapp, "Merhaba, bilgi almak istiyorum.");
  return (
    <>
      <SiteHeader name={c.store.name} waHref={wa} />
      <main>
        <Hero hero={c.hero} />
        <Categories intro={c.intro} categories={c.categories} />
        <Offer sales={c.sales} repair={c.repair} whatsapp={c.store.whatsapp} />
        <Gallery gallery={c.gallery} />
        <Devices devices={c.devices} />
        <Bench store={c.store} kvkk={c.kvkk} />
        <Track />
        <RulesFaq rules={c.rules} faq={c.faq} whatsapp={c.store.whatsapp} />
      </main>
      <SiteFooter store={c.store} />
      <Fab whatsapp={c.store.whatsapp} />
    </>
  );
}
