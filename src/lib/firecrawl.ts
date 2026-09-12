/**
 * Firecrawl client wrapper (Master Build Brief, Section 61).
 *
 * Firecrawl turns web pages into LLM-ready markdown/structured JSON. Used for enriching
 * tournament/grudge-match pages with external data and opponent research — see
 * docs/wiki/integrations.md.
 *
 * Works against either:
 *   - The hosted API (api.firecrawl.dev) — set FIRECRAWL_API_KEY.
 *   - A self-hosted instance (Docker Compose) — set FIRECRAWL_API_URL to its base URL.
 *
 * Server-only: do not import this from client components. Wrap calls in a server action,
 * route handler, or n8n workflow instead.
 */

const FIRECRAWL_BASE_URL =
  process.env.FIRECRAWL_API_URL?.replace(/\/$/, "") ?? "https://api.firecrawl.dev";

function assertServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("firecrawl.ts must only be called from server-side code.");
  }
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (process.env.FIRECRAWL_API_KEY) {
    headers.Authorization = `Bearer ${process.env.FIRECRAWL_API_KEY}`;
  }
  return headers;
}

export type FirecrawlScrapeResult = {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: Record<string, unknown>;
  };
  error?: string;
};

/** Scrape a single URL and return clean markdown/structured data. */
export async function scrapeUrl(
  url: string,
  options?: { formats?: Array<"markdown" | "html" | "screenshot"> }
): Promise<FirecrawlScrapeResult> {
  assertServerOnly();

  const res = await fetch(`${FIRECRAWL_BASE_URL}/v1/scrape`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      url,
      formats: options?.formats ?? ["markdown"],
    }),
  });

  if (!res.ok) {
    return { success: false, error: `Firecrawl scrape failed: ${res.status} ${res.statusText}` };
  }

  return res.json();
}

export type FirecrawlCrawlResult = {
  success: boolean;
  id?: string;
  error?: string;
};

/** Kick off an async crawl of a whole site/section (returns a job id to poll). */
export async function startCrawl(
  url: string,
  options?: { limit?: number; includePaths?: string[] }
): Promise<FirecrawlCrawlResult> {
  assertServerOnly();

  const res = await fetch(`${FIRECRAWL_BASE_URL}/v1/crawl`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      url,
      limit: options?.limit ?? 20,
      includePaths: options?.includePaths,
    }),
  });

  if (!res.ok) {
    return { success: false, error: `Firecrawl crawl failed: ${res.status} ${res.statusText}` };
  }

  return res.json();
}
