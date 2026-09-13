import * as cheerio from "cheerio";
import { createHash } from "node:crypto";

export type FetchMonitorOptions = {
  url: string;
  monitoringMode: "full_page" | "text" | "selector";
  selector?: string | null;
};

export type FetchResult = {
  contentText: string;
  contentHtml: string | null;
  contentHash: string;
  contentSize: number;
  httpStatus: number;
  responseTimeMs: number;
};

export async function fetchMonitorContent(
  options: FetchMonitorOptions,
): Promise<FetchResult> {
  const startedAt = Date.now();

  const response = await fetch(options.url, {
    headers: {
      "User-Agent": "Watchtower/1.0",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });

  const responseTimeMs = Date.now() - startedAt;

  if (!response.ok) {
    throw new Error(`Website returned HTTP ${response.status}`);
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  $("script, style, noscript").remove();

  let contentText: string;
  let contentHtml: string | null = null;

  if (options.monitoringMode === "selector") {
    if (!options.selector) {
      throw new Error("Selector is required for selector monitoring");
    }

    const element = $(options.selector);

    if (element.length === 0) {
      throw new Error(`Selector not found: ${options.selector}`);
    }

    contentText = element.text();
    contentHtml = element.toString();
  } else if (options.monitoringMode === "text") {
    contentText = $("body").text();
  } else {
    contentText = $("body").text();
    contentHtml = $("body").html() ?? "";
  }

  contentText = normalizeText(contentText);

  const contentHash = createHash("sha256").update(contentText).digest("hex");

  return {
    contentText,
    contentHtml,
    contentHash,
    contentSize: Buffer.byteLength(contentText, "utf8"),
    httpStatus: response.status,
    responseTimeMs,
  };
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
