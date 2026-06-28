import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "@tanstack/react-router";
import {
  clearAnalytics,
  deleteUrl,
  fetchAnalytics,
  fetchUserUrls,
  updateUrl,
} from "../store/slices/urlSlice";

const appOrigin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

const emptyEdit = {
  url: "",
  tags: "",
  description: "",
  password: "",
  expiresAt: "",
  disabled: false,
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { urls, analytics, analyticsLoading, loading, error } = useSelector((state) => state.url);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [editUrl, setEditUrl] = useState(null);
  const [manageUrl, setManageUrl] = useState(null);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [toast, setToast] = useState("");
  const [qrBusy, setQrBusy] = useState("");

  useEffect(() => {
    dispatch(fetchUserUrls());
  }, [dispatch]);

  const allTags = useMemo(
    () => [...new Set(urls.flatMap((url) => url.tags || []))].sort((a, b) => a.localeCompare(b)),
    [urls]
  );

  const filteredUrls = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const now = new Date();

    return urls.filter((url) => {
      const matchesQuery =
        !normalizedQuery ||
        url.short_url?.toLowerCase().includes(normalizedQuery) ||
        url.full_url?.toLowerCase().includes(normalizedQuery) ||
        url.description?.toLowerCase().includes(normalizedQuery);
      const matchesTag = !tag || (url.tags || []).includes(tag);
      const isExpired = url.expiresAt && new Date(url.expiresAt) <= now;
      const matchesStatus =
        status === "all" ||
        (status === "active" && !url.disabled && !isExpired) ||
        (status === "disabled" && url.disabled) ||
        (status === "expired" && isExpired) ||
        (status === "protected" && Boolean(url.password));

      return matchesQuery && matchesTag && matchesStatus;
    });
  }, [query, status, tag, urls]);

  const totals = useMemo(() => {
    const now = new Date();
    return {
      links: urls.length,
      clicks: urls.reduce((sum, url) => sum + (url.clicks || 0), 0),
      protected: urls.filter((url) => url.password).length,
      expired: urls.filter((url) => url.expiresAt && new Date(url.expiresAt) <= now).length,
    };
  }, [urls]);

  const fullShortUrl = (shortUrl) => (shortUrl?.startsWith("http") ? shortUrl : `${appOrigin()}/${shortUrl}`);

  const formatDate = (date) => (date ? new Date(date).toLocaleString() : "No expiry");

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  const copyText = async (value, label) => {
    await navigator.clipboard.writeText(value);
    showToast(`${label} copied`);
  };

  const openAnalytics = (url) => {
    setSelectedUrl(url);
    dispatch(fetchAnalytics(url.short_url));
  };

  const closeAnalytics = () => {
    setSelectedUrl(null);
    dispatch(clearAnalytics());
  };

  const openEdit = (url) => {
    setEditUrl(url);
    setManageUrl(null);
    setEditForm({
      url: url.full_url || "",
      tags: (url.tags || []).join(", "),
      description: url.description || "",
      password: url.password || "",
      expiresAt: toDateTimeLocal(url.expiresAt),
      disabled: Boolean(url.disabled),
    });
  };

  const openManage = (url) => {
    setManageUrl(url);
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editUrl) return;

    const updates = {
      url: editForm.url.trim(),
      tags: editForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
      description: editForm.description.trim(),
      password: editForm.password || null,
      expiresAt: editForm.expiresAt || null,
      disabled: editForm.disabled,
    };

    const response = await dispatch(updateUrl({ shortId: editUrl.short_url, updates }));
    if (updateUrl.fulfilled.match(response)) {
      setEditUrl(null);
      setManageUrl(null);
      showToast("Link updated");
    }
  };

  const removeUrl = async (url) => {
    if (!window.confirm(`Delete ${url.short_url}? This cannot be undone.`)) return;
    const response = await dispatch(deleteUrl(url.short_url));
    if (deleteUrl.fulfilled.match(response)) {
      setManageUrl(null);
      showToast("Link deleted");
    }
  };

  const toggleDisabled = async (url) => {
    const response = await dispatch(updateUrl({ shortId: url.short_url, updates: { disabled: !url.disabled } }));
    if (updateUrl.fulfilled.match(response)) showToast(url.disabled ? "Link enabled" : "Link disabled");
  };

  const downloadQr = async (url) => {
    const shortUrl = fullShortUrl(url.short_url);
    setQrBusy(url.short_url);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${apiBaseUrl}/create/qr/generate?url=${encodeURIComponent(shortUrl)}`);
      if (!response.ok) throw new Error("QR generation failed");
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `qr-${url.short_url}.png`;
      link.click();
      window.URL.revokeObjectURL(objectUrl);
    } finally {
      setQrBusy("");
    }
  };

  const exportLinksCsv = () => {
    const rows = [
      ["Short URL", "Destination", "Clicks", "Status", "Tags", "Expires At"],
      ...filteredUrls.map((url) => [
        fullShortUrl(url.short_url),
        url.full_url,
        url.clicks || 0,
        url.disabled ? "Disabled" : "Active",
        (url.tags || []).join("|"),
        url.expiresAt || "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "urlhub-links.csv";
    link.click();
    window.URL.revokeObjectURL(objectUrl);
  };

  return (
    <main className="page-wrap">
      <div className="brand-panel mb-6 p-6">
        <div>
          <p className="page-kicker">Links workspace</p>
          <h1 className="page-title mt-2">Manage every live link.</h1>
          <p className="page-copy mt-3">
            Edit destinations, lock access, expire campaigns, export data, and review analytics from one workspace.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn btn-primary" type="button" onClick={() => navigate({ to: "/" })}>
            Create link
          </button>
          <button className="btn btn-secondary" type="button" onClick={exportLinksCsv} disabled={!filteredUrls.length}>
            Export current view
          </button>
        </div>
      </div>

      {toast && <div className="fixed right-4 top-20 z-[60] rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white">{toast}</div>}

      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <Stat label="Total links" value={totals.links} />
        <Stat label="Total clicks" value={totals.clicks} />
        <Stat label="Protected" value={totals.protected} />
        <Stat label="Expired" value={totals.expired} />
      </section>

      <section className="surface mb-5 grid gap-3 p-4 lg:grid-cols-[1fr_180px_180px]">
        <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search links, destinations, or notes" />
        <select className="field" value={tag} onChange={(event) => setTag(event.target.value)}>
          <option value="">All tags</option>
          {allTags.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="protected">Protected</option>
          <option value="expired">Expired</option>
          <option value="disabled">Disabled</option>
        </select>
      </section>

      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{error}</div>}

      <section className="surface overflow-hidden">
        {loading ? (
          <div className="p-10 text-center font-semibold text-slate-500">Loading links...</div>
        ) : filteredUrls.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-bold text-slate-700 theme-dark:text-slate-200">No links match this view.</p>
            <button className="btn btn-primary mt-4" type="button" onClick={() => navigate({ to: "/" })}>
              Create your first link
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="link-table w-full min-w-[1040px] text-left">
              <thead className="border-b text-xs font-black uppercase text-slate-500 theme-dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Short link</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Clicks</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUrls.map((url) => {
                  const expired = url.expiresAt && new Date(url.expiresAt) <= new Date();
                  return (
                    <tr key={url._id} className="h-16 align-middle">
                      <td className="max-w-64 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => copyText(fullShortUrl(url.short_url), "Short URL")}
                          className="link-title block max-w-64 truncate text-left font-mono text-sm font-black"
                          title={fullShortUrl(url.short_url)}
                        >
                          {fullShortUrl(url.short_url)}
                        </button>
                      </td>
                      <td className="max-w-[420px] px-4 py-3">
                        <a className="block truncate text-sm font-semibold text-slate-600 hover:text-indigo-700 theme-dark:text-slate-300 theme-dark:hover:text-teal-300" href={url.full_url} target="_blank" rel="noreferrer" title={url.full_url}>
                          {url.full_url}
                        </a>
                        <div className="mt-1 flex max-w-[420px] items-center gap-2 overflow-hidden">
                          {url.description && <span className="truncate text-xs muted-text" title={url.description}>{url.description}</span>}
                          {(url.tags || []).slice(0, 2).map((item) => <span key={item} className="badge badge-blue">{item}</span>)}
                          {(url.tags || []).length > 2 && <span className="text-xs font-bold muted-text">+{url.tags.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-nowrap gap-2">
                          {url.disabled ? <span className="badge badge-red">Disabled</span> : expired ? <span className="badge badge-amber">Expired</span> : <span className="badge badge-green">Active</span>}
                          {url.password && <span className="badge badge-blue">Protected</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-black text-slate-900 theme-dark:text-white">{url.clicks || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-nowrap gap-2">
                          <button className="btn btn-secondary px-3 py-2 text-xs" type="button" onClick={() => copyText(fullShortUrl(url.short_url), "Short URL")}>Copy</button>
                          <button className="btn btn-secondary px-3 py-2 text-xs" type="button" onClick={() => openAnalytics(url)}>Analytics</button>
                          <button className="btn btn-primary px-3 py-2 text-xs" type="button" onClick={() => openManage(url)}>Manage</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedUrl && (
        <Modal title={`Analytics for ${selectedUrl.short_url}`} onClose={closeAnalytics}>
          {analyticsLoading ? (
            <p className="p-6 text-center font-semibold text-slate-500">Loading analytics...</p>
          ) : analytics ? (
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-3">
                <Stat label="Total clicks" value={analytics.totalClicks || 0} />
                <Stat label="Device types" value={Object.keys(analytics.deviceBreakdown || {}).length} />
                <Stat label="Referrers" value={(analytics.topReferrers || []).length} />
              </div>
              <Breakdown title="Devices" data={analytics.deviceBreakdown} />
              <Breakdown title="Browsers" data={analytics.browserBreakdown} />
              <Breakdown title="Platforms" data={analytics.platformBreakdown} />
              <div className="rounded-lg border border-slate-200 p-4 theme-dark:border-slate-700">
                <h3 className="font-black text-slate-900 theme-dark:text-white">Recent clicks</h3>
                <div className="mt-3 grid gap-2">
                  {(analytics.recentClicks || []).length ? analytics.recentClicks.map((click, index) => (
                    <div key={`${click.timestamp}-${index}`} className="grid gap-1 rounded-lg bg-slate-50 p-3 text-sm theme-dark:bg-slate-900 md:grid-cols-4">
                      <span>{formatDate(click.timestamp)}</span>
                      <span>{click.device}</span>
                      <span>{click.browser}</span>
                      <span className="truncate">{click.referrer}</span>
                    </div>
                  )) : <p className="text-sm text-slate-500">No clicks recorded yet.</p>}
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      )}

      {editUrl && (
        <Modal title={`Edit ${editUrl.short_url}`} onClose={() => setEditUrl(null)}>
          <form onSubmit={saveEdit} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Destination URL</span>
              <input className="field" value={editForm.url} onChange={(event) => setEditForm((form) => ({ ...form, url: event.target.value }))} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Description</span>
              <textarea className="field min-h-24" value={editForm.description} onChange={(event) => setEditForm((form) => ({ ...form, description: event.target.value }))} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold">Tags</span>
                <input className="field" value={editForm.tags} onChange={(event) => setEditForm((form) => ({ ...form, tags: event.target.value }))} />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold">Password</span>
                <input className="field" type="password" value={editForm.password} onChange={(event) => setEditForm((form) => ({ ...form, password: event.target.value }))} />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold">Expiry date</span>
                <input className="field" type="datetime-local" value={editForm.expiresAt} onChange={(event) => setEditForm((form) => ({ ...form, expiresAt: event.target.value }))} />
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 theme-dark:border-slate-700">
                <input type="checkbox" checked={editForm.disabled} onChange={(event) => setEditForm((form) => ({ ...form, disabled: event.target.checked }))} />
                <span className="font-bold">Disable this link</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-secondary" type="button" onClick={() => setEditUrl(null)}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={loading}>Save changes</button>
            </div>
          </form>
        </Modal>
      )}

      {manageUrl && (
        <Modal title={`Manage ${manageUrl.short_url}`} onClose={() => setManageUrl(null)}>
          <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <div className="soft-section p-4">
              <p className="text-xs font-black uppercase tracking-wide muted-text">Short link</p>
              <button
                type="button"
                onClick={() => copyText(fullShortUrl(manageUrl.short_url), "Short URL")}
                className="link-title mt-2 block max-w-full truncate text-left font-mono text-lg font-black"
              >
                {fullShortUrl(manageUrl.short_url)}
              </button>
              <p className="mt-3 truncate text-sm muted-text">{manageUrl.full_url}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {manageUrl.disabled ? <span className="badge badge-red">Disabled</span> : <span className="badge badge-green">Active</span>}
                {manageUrl.password && <span className="badge badge-blue">Protected</span>}
                {manageUrl.expiresAt && <span className="badge badge-amber">Expires {formatDate(manageUrl.expiresAt)}</span>}
              </div>
            </div>

            <div className="grid gap-2">
              <button className="btn btn-primary justify-start" type="button" onClick={() => openEdit(manageUrl)}>Edit link settings</button>
              <button className="btn btn-secondary justify-start" type="button" onClick={() => openAnalytics(manageUrl)}>Open analytics</button>
              <button className="btn btn-secondary justify-start" type="button" onClick={() => downloadQr(manageUrl)} disabled={qrBusy === manageUrl.short_url}>
                {qrBusy === manageUrl.short_url ? "Preparing QR..." : "Download QR code"}
              </button>
              <button className="btn btn-secondary justify-start" type="button" onClick={() => toggleDisabled(manageUrl)}>
                {manageUrl.disabled ? "Enable link" : "Disable link"}
              </button>
              <button className="btn btn-danger justify-start" type="button" onClick={() => removeUrl(manageUrl)}>Delete link</button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="metric-card p-4">
      <div className="accent-rule mb-4" />
      <p className="text-xs font-black uppercase tracking-wide text-slate-500 theme-dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950 theme-dark:text-white">{value}</p>
    </div>
  );
}

function Breakdown({ title, data = {} }) {
  const entries = Object.entries(data || {});
  return (
    <div className="rounded-lg border border-slate-200 p-4 theme-dark:border-slate-700">
      <h3 className="font-black text-slate-900 theme-dark:text-white">{title}</h3>
      <div className="mt-3 grid gap-2">
        {entries.length ? entries.map(([label, count]) => (
          <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm theme-dark:bg-slate-900">
            <span>{label}</span>
            <span className="font-black">{count}</span>
          </div>
        )) : <p className="text-sm text-slate-500">No data yet.</p>}
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
      <div className="surface max-h-[90vh] w-full max-w-4xl overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-slate-200 bg-white p-5 theme-dark:border-slate-700 theme-dark:bg-slate-900">
          <h2 className="text-xl font-black text-slate-950 theme-dark:text-white">{title}</h2>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Close</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
