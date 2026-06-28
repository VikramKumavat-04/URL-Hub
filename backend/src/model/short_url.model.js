
import mongoose from "mongoose";

const shorturlschema = new mongoose.Schema({
  full_url: {
    type: String,
    required: true,
  },
  short_url: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  clicks: {
    type: Number,
    required: true,
    default: 0,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Security features
  password: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  // Organization
  tags: [{
    type: String,
    default: [],
  }],
  description: {
    type: String,
    default: "",
  },
  // Custom domain
  isCustomDomain: {
    type: Boolean,
    default: false,
  },
  customDomain: {
    type: String,
    default: null,
  },
  // A/B Testing
  a_b_test_variants: [{
    variant: { type: String },
    url: { type: String },
    percentage: { type: Number, default: 50 },
  }],
  // Scheduled changes
  scheduledChanges: [{
    changeDate: Date,
    newUrl: String,
    createdAt: { type: Date, default: Date.now },
  }],
  // Sharing
  sharedWith: [{
    userId: mongoose.Schema.Types.ObjectId,
    permission: { type: String, enum: ['view', 'edit'], default: 'view' },
    sharedAt: { type: Date, default: Date.now },
  }],
  // Geography tracking
  geography: {
    US: { type: Number, default: 0 },
    UK: { type: Number, default: 0 },
    IN: { type: Number, default: 0 },
    CA: { type: Number, default: 0 },
    AU: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  // Affiliate tracking
  affiliateCode: {
    type: String,
    default: null,
  },
  // QR Code
  qrCode: {
    type: String,
    default: null,
  },
  // Analytics history with geolocation
  history: [{
    timestamp: {
      type: Date,
      default: Date.now,
    },
    device: {
      type: String,
      default: "Unknown",
    },
    browser: {
      type: String,
      default: "Unknown",
    },
    platform: {
      type: String,
      default: "Unknown",
    },
    referrer: {
      type: String,
      default: "direct",
    },
    ip: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "Unknown",
    },
    city: {
      type: String,
      default: "Unknown",
    },
    variantUsed: {
      type: String,
      default: null,
    },
  }],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const shortUrl = mongoose.model("shortUrl", shorturlschema);

export default shortUrl;