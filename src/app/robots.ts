import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/callback", "/settings"] },
      { userAgent: ["facebookexternalhit", "facebookcatalog"], allow: ["/", "/opengraph-image"] },
    ],
    sitemap: "https://al-furqan.app/sitemap.xml",
    host: "https://al-furqan.app",
  };
}
