import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/chat/", "/admin/", "/api/", "/_next/"],
      },
    ],
    sitemap: `${process.env.NEXTAUTH_URL}/sitemap.xml`,
  };
}
