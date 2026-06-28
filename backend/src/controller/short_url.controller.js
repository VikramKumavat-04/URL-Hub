import { createShortUrlWithoutUser, createShortUrlWithUser } from "../services/short_url.service.js";
import {
  getUrlsByUser,
  getShortUrlBySlug,
  recordShortUrlClick,
  updateShortUrlBySlug,
  deleteShortUrlBySlug,
  getUrlsByTag,
  getAllTags,
  bulkDeleteUrls,
  getGeographyStats,
  getTopReferrers,
  getClicksTimeseries,
  saveSettings,
  getSettings,
} from "../dao/short_url.js";
import { NotFoundError, UnauthorizedError } from "../utils/errorHandler.js";
import QRCode from "qrcode";
import crypto from "crypto";

const parseUserAgent = (userAgent) => {
  const ua = userAgent || "";
  const browser = /edge/i.test(ua)
    ? "Edge"
    : /opr|opera/i.test(ua)
    ? "Opera"
    : /chrome/i.test(ua)
    ? "Chrome"
    : /firefox/i.test(ua)
    ? "Firefox"
    : /safari/i.test(ua)
    ? "Safari"
    : /msie|trident/i.test(ua)
    ? "Internet Explorer"
    : "Unknown";

  const platform = /android/i.test(ua)
    ? "Android"
    : /iphone|ipad|ipod/i.test(ua)
    ? "iOS"
    : /macintosh|mac os x/i.test(ua)
    ? "Mac"
    : /windows/i.test(ua)
    ? "Windows"
    : /linux/i.test(ua)
    ? "Linux"
    : "Other";

  const device = /mobile/i.test(ua)
    ? "Mobile"
    : /tablet/i.test(ua)
    ? "Tablet"
    : "Desktop";

  return { browser, platform, device };
};

const buildBreakdown = (history, key) =>
  history.reduce((acc, item) => {
    const label = item[key] || "Unknown";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderPasswordForm = (res, shortId, error = "") => {
  res.status(401).send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Password Required</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #f3f4f6; color: #111827; }
      main { width: min(420px, calc(100% - 32px)); background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
      h1 { margin: 0 0 8px; font-size: 24px; }
      p { margin: 0 0 18px; color: #4b5563; }
      label { display: block; margin-bottom: 8px; font-weight: 700; }
      input { box-sizing: border-box; width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px; }
      button { width: 100%; margin-top: 14px; padding: 12px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; }
      .error { color: #b91c1c; margin-bottom: 12px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Password required</h1>
      <p>This short link is protected. Enter the password to continue.</p>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
      <form method="GET" action="/${escapeHtml(shortId)}">
        <label for="pwd">Password</label>
        <input id="pwd" name="pwd" type="password" autocomplete="current-password" autofocus required />
        <button type="submit">Open link</button>
      </form>
    </main>
  </body>
</html>`);
};

export const createShortUrl = async (req, res, next) => {
  try {
    const { url, slug, tags, description, password, expiresAt, affiliateCode } = req.body;
    console.log('[createShortUrl] Received payload:', { url, slug, tags, description, password, expiresAt, affiliateCode });
    
    if (!url) {
      throw new Error("URL is required");
    }

    const options = { tags, description, password, expiresAt, affiliateCode };

    let shortUrlRecord;
    if (req.user) {
      console.log('[createShortUrl] Creating URL for user:', req.user._id);
      shortUrlRecord = await createShortUrlWithUser(url, req.user._id, slug, options);
    } else {
      console.log('[createShortUrl] Creating URL without user');
      shortUrlRecord = await createShortUrlWithoutUser(url, slug, options);
    }

    const shortUrl = shortUrlRecord.short_url;
    console.log('[createShortUrl] Short URL slug generated:', shortUrl);
    const fullShortUrl = process.env.APP_URL + shortUrl;
    console.log('[createShortUrl] Full short URL:', fullShortUrl);

    // Generate QR Code
    let qrCode = null;
    try {
      console.log('[createShortUrl] Generating QR code for:', fullShortUrl);
      qrCode = await QRCode.toDataURL(fullShortUrl);
      console.log('[createShortUrl] QR code generated successfully');
    } catch (qrErr) {
      console.error('[createShortUrl] QR code generation failed:', qrErr.message);
      // Don't fail the entire request if QR fails - just skip it
    }

    res.status(200).json({
      shortUrl: fullShortUrl,
      short_url: shortUrl,
      full_url: url,
      url: shortUrlRecord,
      tags: shortUrlRecord.tags || [],
      description: shortUrlRecord.description || "",
      password: shortUrlRecord.password || null,
      expiresAt: shortUrlRecord.expiresAt || null,
      disabled: shortUrlRecord.disabled || false,
      affiliateCode: shortUrlRecord.affiliateCode || null,
      qrCode: qrCode || null,
      message: "Short URL created successfully",
    });
  } catch (err) {
    console.error('[createShortUrl] Error:', err.message);
    next(err);
  }
};

export const getUserShortUrls = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Login required to view your URLs");
    }

    console.log('[getUserShortUrls] Fetching URLs for user:', req.user._id);
    const { tags, search } = req.query;
    const filters = {
      tags: tags ? tags.split(',') : [],
      search,
    };

    const urls = await getUrlsByUser(req.user._id, filters);
    console.log('[getUserShortUrls] Found URLs:', urls.length);
    if (urls.length > 0) {
      console.log('[getUserShortUrls] First URL sample:', urls[0]);
    }
    res.status(200).json(urls);
  } catch (err) {
    console.error('[getUserShortUrls] Error:', err.message);
    next(err);
  }
};

export const getShortUrlDetails = async (req, res, next) => {
  try {
    const { shortId } = req.params;
    const url = await getShortUrlBySlug(shortId);
    if (!url) {
      throw new NotFoundError("Short URL not found");
    }
    res.status(200).json(url);
  } catch (err) {
    next(err);
  }
};

export const updateShortUrl = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Login required to update this URL");
    }

    const { shortId } = req.params;
    const { url, tags, description, disabled, password, expiresAt } = req.body;

    const existing = await getShortUrlBySlug(shortId);
    if (!existing) {
      throw new NotFoundError("Short URL not found");
    }

    if (!existing.user || existing.user.toString() !== req.user._id.toString()) {
      throw new UnauthorizedError("You are not allowed to edit this URL");
    }

    const updates = {
      ...(url && { full_url: url }),
      ...(tags && { tags }),
      ...(description !== undefined && { description }),
      ...(disabled !== undefined && { disabled }),
      ...(password !== undefined && { password }),
      ...(expiresAt !== undefined && { expiresAt }),
    };

    const updatedUrl = await updateShortUrlBySlug(shortId, updates);
    res.status(200).json({
      message: "URL updated successfully",
      url: updatedUrl,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteShortUrl = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Login required to remove this URL");
    }

    const { shortId } = req.params;
    const existing = await getShortUrlBySlug(shortId);
    if (!existing) {
      throw new NotFoundError("Short URL not found");
    }

    if (!existing.user || existing.user.toString() !== req.user._id.toString()) {
      throw new UnauthorizedError("You are not allowed to delete this URL");
    }

    await deleteShortUrlBySlug(shortId);
    res.status(200).json({ message: "Short URL deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const getShortUrlAnalytics = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Login required to view analytics");
    }

    const { shortId } = req.params;
    const url = await getShortUrlBySlug(shortId);
    if (!url) {
      throw new NotFoundError("Short URL not found");
    }

    if (!url.user || url.user.toString() !== req.user._id.toString()) {
      throw new UnauthorizedError("You are not allowed to view analytics for this URL");
    }

    const history = url.history || [];
    const topReferrers = await getTopReferrers(req.user._id, shortId, 10);
    const timeseries = await getClicksTimeseries(req.user._id, shortId, 30);

    const analytics = {
      shortUrl: url.short_url,
      fullUrl: url.full_url,
      totalClicks: url.clicks,
      createdAt: url.created_at,
      deviceBreakdown: buildBreakdown(history, "device"),
      browserBreakdown: buildBreakdown(history, "browser"),
      platformBreakdown: buildBreakdown(history, "platform"),
      geographyBreakdown: url.geography,
      topReferrers,
      timeseries,
      recentClicks: history.slice(-8).reverse(),
    };

    res.status(200).json(analytics);
  } catch (err) {
    next(err);
  }
};

export const redirectFromShortUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userAgent = req.get("User-Agent") || "";
    const referrer = req.get("Referer") || req.get("Referrer") || "direct";

    const requestInfo = {
      timestamp: new Date(),
      ...parseUserAgent(userAgent),
      referrer,
      ip: req.ip || req.socket?.remoteAddress || "",
      country: req.headers['cf-ipcountry'] || "Unknown",
      city: req.headers['cf-metro-code'] || "Unknown",
    };

    const url = await getShortUrlBySlug(id);
    if (!url) {
      throw new NotFoundError("Short URL not found");
    }

    // Check if expired
    if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
      throw new Error("This link has expired");
    }

    // Check if disabled
    if (url.disabled) {
      throw new Error("This link has been disabled");
    }

    // Check password protection
    if (url.password) {
      const passwordFromQuery = req.query.pwd;
      if (!passwordFromQuery || passwordFromQuery !== url.password) {
        return renderPasswordForm(res, id, passwordFromQuery ? "Incorrect password" : "");
      }
    }

    await recordShortUrlClick(id, requestInfo);
    res.redirect(url.full_url);
  } catch (err) {
    next(err);
  }
};

// New feature handlers
export const bulkDelete = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Login required");
    }

    const { urlIds } = req.body;
    await bulkDeleteUrls(req.user._id, urlIds);
    res.status(200).json({ message: "URLs deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const getUrlTags = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Login required");
    }

    const tags = await getAllTags(req.user._id);
    res.status(200).json(tags);
  } catch (err) {
    next(err);
  }
};

export const getUrlsByTagName = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Login required");
    }

    const { tag } = req.params;
    const urls = await getUrlsByTag(req.user._id, tag);
    res.status(200).json(urls);
  } catch (err) {
    next(err);
  }
};

export const exportAnalytics = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Login required");
    }

    const { shortId } = req.params;
    const url = await getShortUrlBySlug(shortId);
    if (!url) {
      throw new NotFoundError("Short URL not found");
    }

    if (!url.user || url.user.toString() !== req.user._id.toString()) {
      throw new UnauthorizedError("Unauthorized");
    }

    const csv = [
      ["Date", "Device", "Browser", "Platform", "Referrer", "Country"],
      ...url.history.map(h => [
        h.timestamp,
        h.device,
        h.browser,
        h.platform,
        h.referrer,
        h.country,
      ])
    ].map(row => row.join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="analytics-${shortId}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

export const generateAPIKey = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Login required");
    }

    const apiKey = crypto.randomBytes(32).toString('hex');
    await saveSettings(req.user._id, { apiKey });

    res.status(200).json({ apiKey, message: "API key generated successfully" });
  } catch (err) {
    next(err);
  }
};

export const getUserSettings = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Login required");
    }

    const settings = await getSettings(req.user._id);
    res.status(200).json(settings || {});
  } catch (err) {
    next(err);
  }
};

export const updateUserSettings = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Login required");
    }

    const settings = await saveSettings(req.user._id, req.body);
    res.status(200).json({ message: "Settings updated successfully", settings });
  } catch (err) {
    next(err);
  }
};

export const generateQrCode = async (req, res, next) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }
    
    console.log('[generateQrCode] Generating QR for:', url);
    
    // Generate QR code as PNG buffer
    const pngBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
    });
    
    console.log('[generateQrCode] Generated successfully, size:', pngBuffer.length, 'bytes');
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', pngBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(pngBuffer);
  } catch (err) {
    console.error('[generateQrCode] Error:', err.message);
    next(err);
  }
}; 
