import urlSchema from "../model/short_url.model.js";
import { ConflictError } from "../utils/errorHandler.js";

// Existing functions
export const saveShortUrl = async (shortUrl, longUrl, userId, options = {}) => {
  try {
    const newUrl = new urlSchema({
      full_url: longUrl,
      short_url: shortUrl,
      user: userId,
      tags: options.tags || [],
      description: options.description || "",
      password: options.password || null,
      expiresAt: options.expiresAt || null,
      qrCode: options.qrCode || null,
      affiliateCode: options.affiliateCode || null,
    });

    await newUrl.save();
    return newUrl;
  } catch (err) {
    if (err.code === 11000) {
      throw new ConflictError("Short URL alias already exists");
    }
    throw new Error(err);
  }
};

export const getShortUrlForRedirect = async (shortUrl, analytics = {}) => {
  const update = { $inc: { clicks: 1 } };

  if (analytics && Object.keys(analytics).length) {
    update.$push = { history: analytics };
    // Update geography
    if (analytics.country) {
      const countryCode = analytics.country.substring(0, 2).toUpperCase();
      update.$inc = update.$inc || {};
      update.$inc[`geography.${countryCode}`] = 1;
    }
  }

  return await urlSchema.findOneAndUpdate({ short_url: shortUrl }, update, { new: true });
};

export const recordShortUrlClick = async (shortUrl, analytics = {}) => {
  const update = { $inc: { clicks: 1 } };

  if (analytics && Object.keys(analytics).length) {
    update.$push = { history: analytics };
    if (analytics.country) {
      const countryCode = analytics.country.substring(0, 2).toUpperCase();
      update.$inc[`geography.${countryCode}`] = 1;
    }
  }

  return await urlSchema.findOneAndUpdate({ short_url: shortUrl }, update, { new: true });
};

export const getShortUrlBySlug = async (shortUrl) => {
  return await urlSchema.findOne({ short_url: shortUrl });
};

export const getUrlsByUser = async (userId, filters = {}) => {
  const query = { user: userId };
  
  if (filters.tags && filters.tags.length) {
    query.tags = { $in: filters.tags };
  }
  if (filters.search) {
    query.$or = [
      { short_url: new RegExp(filters.search, 'i') },
      { full_url: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') },
    ];
  }

  return await urlSchema
    .find(query)
    .sort({ created_at: -1 })
    .lean();
};

export const updateShortUrlBySlug = async (shortUrl, updates) => {
  updates.updated_at = new Date();
  return await urlSchema.findOneAndUpdate({ short_url: shortUrl }, updates, { new: true });
};

export const deleteShortUrlBySlug = async (shortUrl) => {
  return await urlSchema.findOneAndDelete({ short_url: shortUrl });
};

export const getCustomShortUrl = async (slug) => {
  return await urlSchema.findOne({ short_url: slug });
};

// New feature functions
export const getUrlsByTag = async (userId, tag) => {
  return await urlSchema
    .find({ user: userId, tags: tag })
    .sort({ created_at: -1 })
    .lean();
};

export const getAllTags = async (userId) => {
  const urls = await urlSchema
    .find({ user: userId })
    .distinct('tags')
    .lean();
  return urls;
};

export const bulkDeleteUrls = async (userId, urlIds) => {
  return await urlSchema.deleteMany({ 
    _id: { $in: urlIds }, 
    user: userId 
  });
};

export const getGeographyStats = async (userId, shortUrl) => {
  const url = await urlSchema.findOne({ short_url: shortUrl, user: userId });
  return url ? url.geography : {};
};

export const getTopReferrers = async (userId, shortUrl, limit = 10) => {
  const url = await urlSchema.findOne({ short_url: shortUrl, user: userId });
  if (!url) return [];
  
  const referrers = {};
  url.history.forEach(click => {
    referrers[click.referrer] = (referrers[click.referrer] || 0) + 1;
  });

  return Object.entries(referrers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([referrer, count]) => ({ referrer, count }));
};

export const getClicksTimeseries = async (userId, shortUrl, days = 30) => {
  const url = await urlSchema.findOne({ short_url: shortUrl, user: userId });
  if (!url) return [];

  const timeseries = {};
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    timeseries[dateStr] = 0;
  }

  url.history.forEach(click => {
    const dateStr = click.timestamp.toISOString().split('T')[0];
    if (timeseries.hasOwnProperty(dateStr)) {
      timeseries[dateStr]++;
    }
  });

  return Object.entries(timeseries)
    .map(([date, clicks]) => ({ date, clicks }))
    .reverse();
};

export const saveSettings = async (userId, settings) => {
  const Settings = (await import('../model/settings.model.js')).default;
  const allowedFields = [
    "apiKey",
    "theme",
    "autoGenerateQrCode",
    "defaultExpiryHours",
    "darkMode",
    "compactDashboard",
  ];
  const cleanSettings = Object.fromEntries(
    Object.entries(settings || {}).filter(([key]) => allowedFields.includes(key))
  );

  return await Settings.findOneAndUpdate(
    { user: userId },
    {
      $set: { ...cleanSettings, updatedAt: new Date() },
      $setOnInsert: { user: userId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const getSettings = async (userId) => {
  const Settings = (await import('../model/settings.model.js')).default;
  return await Settings.findOne({ user: userId });
};
