import * as cheerio from "cheerio";

export interface Metadata {
  title?: string;
  description?: string;
  imageUrl?: string;
}

const TITLE_SELECTORS = [
  'meta[property="og:title"]',
  'meta[name="og:title"]',
  'meta[name="twitter:title"]',
  "title",
];

const DESCRIPTION_SELECTORS = [
  'meta[property="og:description"]',
  'meta[name="og:description"]',
  'meta[name="twitter:description"]',
  'meta[name="description"]',
];

const IMAGE_SELECTORS = [
  'meta[property="og:image"]',
  'meta[name="og:image"]',
  'meta[name="twitter:image"]',
  'meta[name="twitter:image:src"]',
  'meta[itemprop="image"]',
  'link[rel="image_src"]',
  'link[rel="icon"]',
  'link[rel="shortcut icon"]',
];

async function fetchWithTimeout(
  resource: string,
  options: RequestInit = {},
  timeout = 10000
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function fetchMetadata(url: string): Promise<Metadata> {
  try {
    const res = await fetchWithTimeout(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/114.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9," +
            "image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en",
        },
      },
      10000
    );

    if (!res.ok) return {};

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("html")) return {};

    const html = await res.text();
    const $ = cheerio.load(html);

    // helper to extract text/attr
    const extract = (selectors: string[], attr?: string) => {
      for (const sel of selectors) {
        const el = $(sel).first();
        if (!el.length) continue;
        if (attr) {
          const val = el.attr(attr)?.trim();
          if (val) return val;
        } else {
          const val = el.text()?.trim();
          if (val) return val;
        }
      }
      return undefined;
    };

    const rawTitle = extract(TITLE_SELECTORS, "content") || extract(["title"]);
    const rawDesc = extract(DESCRIPTION_SELECTORS, "content");
    const rawImage =
      extract(IMAGE_SELECTORS, "content") || extract(IMAGE_SELECTORS, "href");

    // normalize URLs
    let imageUrl: string | undefined;
    if (rawImage) {
      try {
        imageUrl = new URL(rawImage, res.url).toString();
      } catch {
        imageUrl = undefined;
      }
    }

    return {
      title: rawTitle ? rawTitle.slice(0, 255) : undefined,
      description: rawDesc ? rawDesc.slice(0, 1024) : undefined,
      imageUrl,
    };
  } catch (err: any) {
    console.error("fetchMetadata error:", err);
    return {};
  }
}
