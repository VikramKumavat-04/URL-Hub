import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearError, createUrl } from "../store/slices/urlSlice";

const getSavedSettings = () => {
  try {
    return JSON.parse(localStorage.getItem("userSettings") || "{}");
  } catch {
    return {};
  }
};

const emptyForm = {
  url: "",
  slug: "",
  tags: "",
  description: "",
  password: "",
  expiresAt: "",
  affiliateCode: "",
};

export default function UrlForm() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.url);
  const settings = useMemo(() => getSavedSettings(), []);
  const [formData, setFormData] = useState(() => ({
    ...emptyForm,
    expiresAt: settings.defaultExpiryHours
      ? new Date(Date.now() + Number(settings.defaultExpiryHours) * 60 * 60 * 1000).toISOString().slice(0, 16)
      : "",
  }));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [validationError, setValidationError] = useState("");

  const shortUrl = result?.shortUrl || "";

  const updateField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
    setValidationError("");
    if (error) dispatch(clearError());
  };

  const validate = () => {
    if (!formData.url.trim()) return "Enter a URL to shorten.";

    try {
      new URL(formData.url.trim());
    } catch {
      return "Enter a complete URL, including http:// or https://.";
    }

    if (formData.slug.trim() && !/^[a-zA-Z0-9_-]{3,30}$/.test(formData.slug.trim())) {
      return "Custom alias must be 3-30 characters using letters, numbers, hyphens, or underscores.";
    }

    if (formData.expiresAt && new Date(formData.expiresAt) <= new Date()) {
      return "Expiry date must be in the future.";
    }

    return "";
  };

  const generateQrCode = async (urlToEncode) => {
    if (!urlToEncode) return;
    setQrLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${apiBaseUrl}/create/qr/generate?url=${encodeURIComponent(urlToEncode)}`);
      if (!response.ok) throw new Error("QR generation failed");
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (event) => setQrCode(event.target.result);
      reader.readAsDataURL(blob);
    } catch {
      setValidationError("Could not generate the QR code. The short URL still works.");
    } finally {
      setQrLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError("");
    setCopied("");

    const validationMessage = validate();
    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    const payload = {
      url: formData.url.trim(),
      slug: formData.slug.trim() || undefined,
      tags: formData.tags.trim() ? formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      description: formData.description.trim(),
      password: formData.password || undefined,
      expiresAt: formData.expiresAt || undefined,
      affiliateCode: formData.affiliateCode || undefined,
    };

    const response = await dispatch(createUrl(payload));
    if (!createUrl.fulfilled.match(response)) return;

    const created = response.payload;
    setResult(created);
    setQrCode(created.qrCode || "");
    setFormData({
      ...emptyForm,
      expiresAt: settings.defaultExpiryHours
        ? new Date(Date.now() + Number(settings.defaultExpiryHours) * 60 * 60 * 1000).toISOString().slice(0, 16)
        : "",
    });

    if (!created.qrCode && settings.autoGenerateQrCode) {
      await generateQrCode(created.shortUrl);
    }
  };

  const copyText = async (value, label) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1800);
  };

  const downloadQrCode = () => {
    if (!qrCode) return;
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `qr-${result?.short_url || "link"}.png`;
    link.click();
  };

  const message = validationError || error;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <form onSubmit={handleSubmit} className="surface p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-slate-950 theme-dark:text-white">Create short link</h2>
          <p className="mt-1 text-sm text-slate-500 theme-dark:text-slate-400">
            Add security, expiration, campaign tags, and a custom alias in one pass.
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {message}
          </div>
        )}

        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700 theme-dark:text-slate-200">Destination URL</span>
            <input
              className="field"
              name="url"
              value={formData.url}
              onChange={(event) => updateField(event.target.name, event.target.value)}
              placeholder="https://example.com/product/launch"
              disabled={loading}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700 theme-dark:text-slate-200">Custom alias</span>
              <input
                className="field"
                name="slug"
                value={formData.slug}
                onChange={(event) => updateField(event.target.name, event.target.value)}
                placeholder="spring-launch"
                disabled={loading}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700 theme-dark:text-slate-200">Tags</span>
              <input
                className="field"
                name="tags"
                value={formData.tags}
                onChange={(event) => updateField(event.target.name, event.target.value)}
                placeholder="marketing, social"
                disabled={loading}
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700 theme-dark:text-slate-200">Description</span>
            <textarea
              className="field min-h-24 resize-y"
              name="description"
              value={formData.description}
              onChange={(event) => updateField(event.target.name, event.target.value)}
              placeholder="Internal note for this link"
              disabled={loading}
            />
          </label>

          <button type="button" className="btn btn-secondary w-fit" onClick={() => setShowAdvanced((value) => !value)}>
            {showAdvanced ? "Hide security options" : "Show security options"}
          </button>

          {showAdvanced && (
            <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 theme-dark:border-slate-700 theme-dark:bg-slate-900">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700 theme-dark:text-slate-200">Access password</span>
                  <input
                    className="field"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={(event) => updateField(event.target.name, event.target.value)}
                    placeholder="Optional"
                    disabled={loading}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700 theme-dark:text-slate-200">Expiry date</span>
                  <input
                    className="field"
                    type="datetime-local"
                    name="expiresAt"
                    value={formData.expiresAt}
                    onChange={(event) => updateField(event.target.name, event.target.value)}
                    disabled={loading}
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700 theme-dark:text-slate-200">Affiliate or campaign code</span>
                <input
                  className="field"
                  name="affiliateCode"
                  value={formData.affiliateCode}
                  onChange={(event) => updateField(event.target.name, event.target.value)}
                  placeholder="campaign-001"
                  disabled={loading}
                />
              </label>
            </div>
          )}

          <button className="btn btn-primary min-h-12" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create short link"}
          </button>
        </div>
      </form>

      <aside className="surface p-6">
        <h2 className="text-xl font-black text-slate-950 theme-dark:text-white">Latest result</h2>
        {!result ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 theme-dark:border-slate-700 theme-dark:text-slate-400">
            Your new link and QR actions will appear here after creation.
          </div>
        ) : (
          <div className="mt-5 grid gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Short URL</p>
              <div className="mt-2 break-all rounded-lg bg-slate-100 p-3 font-mono text-sm font-bold text-blue-700 theme-dark:bg-slate-900 theme-dark:text-teal-300">
                {shortUrl}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={() => copyText(shortUrl, "short")}>
                {copied === "short" ? "Copied" : "Copy link"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => window.open(shortUrl, "_blank", "noopener,noreferrer")}>
                Open
              </button>
            </div>

            <div className="grid gap-3 rounded-lg border border-slate-200 p-4 theme-dark:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-slate-800 theme-dark:text-slate-100">QR code</p>
                {!qrCode && (
                  <button type="button" className="btn btn-secondary" onClick={() => generateQrCode(shortUrl)} disabled={qrLoading}>
                    {qrLoading ? "Generating..." : "Generate"}
                  </button>
                )}
              </div>
              {qrCode ? (
                <>
                  <img src={qrCode} alt="QR code for short URL" className="mx-auto h-48 w-48 rounded-lg bg-white object-contain p-2" />
                  <button type="button" className="btn btn-secondary" onClick={downloadQrCode}>
                    Download QR
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-500 theme-dark:text-slate-400">Generate a scannable code for print or offline sharing.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {result.password && <span className="badge badge-blue">Password protected</span>}
              {result.expiresAt && <span className="badge badge-amber">Expires {new Date(result.expiresAt).toLocaleString()}</span>}
              {(result.tags || []).map((tag) => (
                <span key={tag} className="badge badge-green">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
