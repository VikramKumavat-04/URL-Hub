import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getUserSettings, updateUserSettings } from "../api/shortUrl.api";

const defaultSettings = {
  autoGenerateQrCode: true,
  defaultExpiryHours: "",
  darkMode: false,
  compactDashboard: false,
};

const loadLocalSettings = () => {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem("userSettings") || "{}") };
  } catch {
    return defaultSettings;
  }
};

export default function SettingsPage() {
  const { user } = useSelector((state) => state.auth);
  const [settings, setSettings] = useState(loadLocalSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    let ignore = false;
    const syncSettings = async () => {
      setLoading(true);
      try {
        const remote = await getUserSettings();
        if (!ignore && remote) {
          const merged = { ...loadLocalSettings(), ...remote };
          setSettings(merged);
          localStorage.setItem("userSettings", JSON.stringify(merged));
          document.body.classList.toggle("theme-dark", Boolean(merged.darkMode));
        }
      } catch {
        document.body.classList.toggle("theme-dark", Boolean(loadLocalSettings().darkMode));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    syncSettings();
    return () => {
      ignore = true;
    };
  }, []);

  const updateSetting = (field, value) => {
    const next = { ...settings, [field]: value };
    setSettings(next);
    setHasChanges(true);
    setMessage("");
    setError("");
    if (field === "darkMode") {
      document.body.classList.toggle("theme-dark", Boolean(value));
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      localStorage.setItem("userSettings", JSON.stringify(settings));
      document.body.classList.toggle("theme-dark", Boolean(settings.darkMode));
      await updateUserSettings(settings);
      setHasChanges(false);
      setMessage("Settings saved");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    document.body.classList.remove("theme-dark");
  };

  return (
    <main className="page-wrap">
      <div className="brand-panel mb-6 p-6">
        <p className="page-kicker">Settings</p>
        <h1 className="page-title mt-2">Account and workspace preferences.</h1>
        <p className="page-copy mt-3">
          These settings change how link creation and the workspace behave. No placeholder controls live here.
        </p>
      </div>

      {(message || error) && (
        <div className={`mb-5 rounded-lg border p-4 font-bold ${error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
          {error || message}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="surface p-6">
          <h2 className="text-xl font-black text-slate-950 theme-dark:text-white">Profile</h2>
          <div className="mt-5 grid gap-4">
            <Info label="Name" value={user?.name || "Not set"} />
            <Info label="Email" value={user?.email || "Not set"} />
            <Info label="Account status" value="Active" />
          </div>
        </section>

        <section className="surface p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950 theme-dark:text-white">Workspace behavior</h2>
              {loading && <p className="mt-1 text-sm text-slate-500">Syncing saved settings...</p>}
            </div>
            {hasChanges && <span className="badge badge-amber">Unsaved changes</span>}
          </div>

          <div className="mt-6 grid gap-4">
            <Toggle
              label="Auto-generate QR codes"
              description="Newly created links immediately show a QR code in the result panel."
              checked={settings.autoGenerateQrCode}
              onChange={(checked) => updateSetting("autoGenerateQrCode", checked)}
            />
            <Toggle
              label="Dark mode"
              description="Apply a darker interface across the app."
              checked={settings.darkMode}
              onChange={(checked) => updateSetting("darkMode", checked)}
            />
            <Toggle
              label="Compact dashboard"
              description="Keep tables tighter for dense link management."
              checked={settings.compactDashboard}
              onChange={(checked) => updateSetting("compactDashboard", checked)}
            />

            <label className="grid gap-2 rounded-lg border border-slate-200 p-4 theme-dark:border-slate-700">
              <span className="font-bold text-slate-900 theme-dark:text-white">Default expiry for new links</span>
              <span className="text-sm text-slate-500 theme-dark:text-slate-400">
                Choose a default time window, or leave it off for links that never expire unless you set a date manually.
              </span>
              <select
                className="field mt-2 max-w-sm"
                value={settings.defaultExpiryHours}
                onChange={(event) => updateSetting("defaultExpiryHours", event.target.value)}
              >
                <option value="">No default expiry</option>
                <option value="24">24 hours</option>
                <option value="72">3 days</option>
                <option value="168">7 days</option>
                <option value="720">30 days</option>
              </select>
            </label>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button className="btn btn-secondary" type="button" onClick={resetSettings}>
                Reset defaults
              </button>
              <button className="btn btn-primary" type="button" onClick={saveSettings} disabled={saving || !hasChanges}>
                {saving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 theme-dark:border-slate-700">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500 theme-dark:text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-950 theme-dark:text-white">{value}</p>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 theme-dark:border-slate-700">
      <span>
        <span className="block font-bold text-slate-900 theme-dark:text-white">{label}</span>
        <span className="mt-1 block text-sm text-slate-500 theme-dark:text-slate-400">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5"
      />
    </label>
  );
}
