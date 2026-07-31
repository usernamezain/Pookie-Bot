const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");
const url = require("url");

// ── Pookie-Bot does NOT have adm-zip in package.json ──────────────────────────
// We use a pure-JS zip builder to avoid adding dependencies.
// Format: local zip manually built using Buffer concatenation.
// For real zip support, run: npm install adm-zip
// Then uncomment the AdmZip lines below and remove the fallback.

let AdmZip;
try {
  AdmZip = require("adm-zip");
} catch {
  AdmZip = null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 200);
}

function resolveUrl(base, relative) {
  try {
    return new url.URL(relative, base).href;
  } catch {
    return null;
  }
}

function urlToFilePath(assetUrl) {
  try {
    const parsed = new url.URL(assetUrl);
    let filePath = parsed.pathname.replace(/^\//, "") || "index";
    if (!path.extname(filePath)) filePath += ".bin";
    return sanitizeFilename(filePath.replace(/\//g, "_"));
  } catch {
    return null;
  }
}

async function fetchBuffer(assetUrl, timeout = 10000) {
  try {
    const res = await axios.get(assetUrl, {
      responseType: "arraybuffer",
      timeout,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36"
      }
    });
    return Buffer.from(res.data);
  } catch {
    return null;
  }
}

async function fetchText(pageUrl, timeout = 15000) {
  const res = await axios.get(pageUrl, {
    timeout,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36"
    }
  });
  return res.data;
}

// Simple cheerio-free HTML asset extractor using regex
function extractAssetUrls(html, pageUrl) {
  const queue = new Set();

  const patterns = [
    /href=["']([^"']+\.css[^"']*?)["']/gi,
    /src=["']([^"']+\.js[^"']*?)["']/gi,
    /src=["']([^"']+\.(png|jpg|jpeg|gif|webp|svg|ico)[^"']*?)["']/gi,
    /href=["']([^"']+\.(png|jpg|jpeg|gif|webp|svg|ico)[^"']*?)["']/gi,
    /url\(["']?([^"')]+\.(css|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf)[^"')]*?)["']?\)/gi,
  ];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(html)) !== null) {
      const raw = match[1].trim();
      if (raw.startsWith("data:") || raw.startsWith("//") && raw.length < 5) continue;
      const resolved = resolveUrl(pageUrl, raw);
      if (resolved) queue.add(resolved);
    }
  }

  return queue;
}

function rewriteHtml(html, assetMap) {
  let rewritten = html;
  for (const [original, local] of assetMap.entries()) {
    // Replace all occurrences of original URL with local filename
    rewritten = rewritten.split(original).join(local);
  }
  return rewritten;
}

// ─── Main Plugin ──────────────────────────────────────────────────────────────

module.exports = {
  name: "web2zip",
  aliases: ["w2z", "webscrape", "scrapeweb"],
  category: "developer",
  description: "Scrape a website (HTML + CSS + JS + images) and send as a ZIP file.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;

    let pageUrl = args[0];

    // ── Usage guide ──────────────────────────────────────────────────────────
    if (!pageUrl) {
      return sock.sendMessage(from, {
        text: [
          "🌐 *Web2Zip — Website Scraper*",
          "",
          "*Usage:*  `.w2z <url>`",
          "*Alias:*  `.w2z`, `.webscrape`, `.scrapeweb`",
          "",
          "*Example:*",
          "  `.w2z https://example.com`",
          "",
          "📦 Downloads the full page (HTML + CSS + JS + images) and sends it as a ZIP."
        ].join("\n")
      }, { quoted: m });
    }

    // ── Check adm-zip available ──────────────────────────────────────────────
    if (!AdmZip) {
      return sock.sendMessage(from, {
        text: "❌ *Missing dependency:* `adm-zip`\n\nRun this in the bot folder:\n```npm install adm-zip```\n\nThen restart the bot."
      }, { quoted: m });
    }

    // ── Auto-prepend https:// ────────────────────────────────────────────────
    if (!/^https?:\/\//i.test(pageUrl)) pageUrl = "https://" + pageUrl;

    try { new url.URL(pageUrl); } catch {
      return sock.sendMessage(from, {
        text: "❌ Invalid URL. Example: `.w2z https://example.com`"
      }, { quoted: m });
    }

    // ── Processing ───────────────────────────────────────────────────────────
    await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });
    await sock.sendMessage(from, {
      text: `🔍 *Scraping:* ${pageUrl}\n\n_Fetching page and assets, please wait..._`
    }, { quoted: m });

    try {
      // 1. Fetch HTML
      const html = await fetchText(pageUrl);

      // 2. Extract page title
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const pageTitle = titleMatch?.[1]?.trim() || "webpage";
      const safeTitle = sanitizeFilename(pageTitle).replace(/\s+/g, "_").slice(0, 40);

      // 3. Extract asset URLs
      const assetUrls = extractAssetUrls(html, pageUrl);

      // 4. Download assets in parallel batches
      const assetMap = new Map(); // originalUrl → localFilename
      const assetBuffers = new Map(); // localFilename → Buffer
      const queueArr = [...assetUrls];
      const BATCH = 10;

      for (let i = 0; i < queueArr.length; i += BATCH) {
        const batch = queueArr.slice(i, i + BATCH);
        await Promise.all(batch.map(async (assetUrl) => {
          const filePath = urlToFilePath(assetUrl);
          if (!filePath || assetBuffers.has(filePath)) return;
          const buf = await fetchBuffer(assetUrl);
          if (buf) {
            assetMap.set(assetUrl, filePath);
            assetBuffers.set(filePath, buf);
          }
        }));
      }

      // 5. Rewrite HTML paths to local references
      const rewrittenHtml = rewriteHtml(html, assetMap);

      // 6. Build ZIP
      const zip = new AdmZip();
      zip.addFile("index.html", Buffer.from(rewrittenHtml, "utf8"));
      for (const [filePath, buffer] of assetBuffers.entries()) {
        zip.addFile(filePath, buffer);
      }

      const zipBuffer = zip.toBuffer();
      const zipSizeMB = (zipBuffer.length / 1024 / 1024).toFixed(2);

      // 7. Send ZIP
      await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(from, {
        document: zipBuffer,
        fileName: `${safeTitle}.zip`,
        mimetype: "application/zip",
        caption: [
          "📦 *Web2Zip Complete!*",
          "",
          `🌐 *URL:* ${pageUrl}`,
          `📄 *Page:* ${pageTitle}`,
          `🗂️ *Assets scraped:* ${assetBuffers.size} files`,
          `💾 *ZIP size:* ${zipSizeMB} MB`,
          "",
          "_Open `index.html` in a browser to view the page offline._"
        ].join("\n")
      }, { quoted: m });

    } catch (err) {
      console.error("[web2zip] Error:", err.message);
      await sock.sendMessage(from, { react: { text: "❌", key: m.key } });

      let errMsg = "❌ *Failed to scrape the website.*\n\n";
      if (err.code === "ENOTFOUND") errMsg += "_The website is unreachable or does not exist._";
      else if (err.response?.status === 403) errMsg += "_Access denied (403). The site blocks scrapers._";
      else if (err.response?.status === 404) errMsg += "_Page not found (404). Check the URL._";
      else if (err.code === "ETIMEDOUT") errMsg += "_Request timed out. The site may be too slow._";
      else errMsg += `_${err.message}_`;

      await sock.sendMessage(from, { text: errMsg }, { quoted: m });
    }
  }
};
