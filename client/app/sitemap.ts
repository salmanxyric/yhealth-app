import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yhealth.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blogs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Dynamic blog posts - fetch published slugs
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${apiUrl}/blogs?limit=100&status=published`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (res.ok) {
      const data = await res.json();
      const blogs = data?.data || [];
      blogPages = blogs.map(
        (blog: { slug: string; updated_at?: string; published_at?: string }) => ({
          url: `${SITE_URL}/blogs/${blog.slug}`,
          lastModified: new Date(blog.updated_at || blog.published_at || Date.now()),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })
      );
    }
  } catch {
    // Silently fail - sitemap still works with static pages
  }

  return [...staticPages, ...blogPages];
}
