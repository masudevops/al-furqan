const serialize = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

export default function StructuredData({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }}/>;
}

export const siteStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Al-Furqan",
    alternateName: "Al-Furqan Quran & Sunnah Companion",
    url: "https://al-furqan.app",
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Al-Furqan",
    url: "https://al-furqan.app",
    logo: "https://al-furqan.app/apple-icon",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Al-Furqan",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: "https://al-furqan.app",
    description: "A free, private and ad-free Quran and Sunnah companion with Tajweed, translation, Tafsir, audio, Salah times and Dua.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
];

export const breadcrumbData = (items: Array<{ name: string; path: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: `https://al-furqan.app${item.path}` })),
});
