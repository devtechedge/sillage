import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: env.siteUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${env.siteUrl}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
  ];
}
