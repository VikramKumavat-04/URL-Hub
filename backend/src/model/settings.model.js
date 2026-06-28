import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  customDomains: [{
    domain: {
      type: String,
      unique: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    primary: {
      type: Boolean,
      default: false,
    },
    dnsRecords: {
      cname: String,
      verification_token: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  premiumTier: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },
  premiumExpiresAt: Date,
  apiKey: {
    type: String,
    unique: true,
    sparse: true,
  },
  apiRateLimit: {
    type: Number,
    default: 1000, // requests per day
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light',
  },
  autoGenerateQrCode: { type: Boolean, default: true },
  defaultExpiryHours: { type: String, default: "" },
  darkMode: { type: Boolean, default: false },
  compactDashboard: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
