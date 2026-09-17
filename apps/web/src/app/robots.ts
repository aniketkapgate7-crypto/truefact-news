import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truefactnews.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/workspace", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
