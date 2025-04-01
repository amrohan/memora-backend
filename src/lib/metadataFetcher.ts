import * as cheerio from "cheerio";
// Use native fetch if available (Node 18+)
// import fetch from 'node-fetch'; // Uncomment if using older Node version requiring node-fetch explicitly

interface Metadata {
  title?: string;
  description?: string;
  imageUrl?: string;
}

export const fetchMetadata = async (url: string): Promise<Metadata> => {
  try {
    const response = await fetch(url, {
      headers: {
        // Pretend to be a browser to avoid some simple blocks
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      // Add timeout?
      // signal: AbortSignal.timeout(10000) // 10 seconds timeout
    });

    if (!response.ok) {
      console.error(`Failed to fetch URL ${url}. Status: ${response.status}`);
      return {}; // Return empty if fetch fails
    }

    // Check content type to ensure it's likely HTML
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      console.warn(`URL ${url} did not return HTML content type.`);
      // Optionally, still try to parse? Or return empty.
      // return {};
    }

    const htmlContent = await response.text();
    const $ = cheerio.load(htmlContent);

    // Extract metadata, prioritizing Open Graph (og:) tags
    const title =
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $("title").text()?.trim();

    const description =
      $('meta[property="og:description"]').attr("content")?.trim() ||
      $('meta[name="description"]').attr("content")?.trim();

    let imageUrl =
      $('meta[property="og:image"]').attr("content")?.trim() ||
      $('meta[property="twitter:image"]').attr("content")?.trim(); // Check twitter card as well

    // Ensure image URL is absolute
    if (imageUrl) {
      try {
        imageUrl = new URL(imageUrl, url).toString();
      } catch (e) {
        console.warn(
          `Could not construct absolute URL for image: ${imageUrl} from base ${url}`,
        );
        imageUrl = undefined; // Invalidate if it's not a proper relative/absolute URL
      }
    }

    // Basic cleanup / length limits (optional)
    const cleanTitle = title ? title.substring(0, 255) : undefined;
    const cleanDescription = description
      ? description.substring(0, 1024)
      : undefined;

    return {
      title: cleanTitle,
      description: cleanDescription,
      imageUrl: imageUrl,
    };
  } catch (error: any) {
    console.error(`Error fetching metadata for ${url}:`, error.message);
    // Handle specific errors like timeouts if AbortSignal is used
    // if (error.name === 'TimeoutError') { ... }
    return {}; // Return empty on error
  }
};
