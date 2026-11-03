import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/desk", "/briefs", "/formulas", "/trials", "/batches", "/materials", "/archive", "/team"],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
