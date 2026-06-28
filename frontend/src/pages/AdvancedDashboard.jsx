import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearAnalytics, fetchAnalytics, fetchUserUrls } from "../store/slices/urlSlice";

const appOrigin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

export default function AdvancedDashboard() {
  const dispatch = useDispatch();
  const { urls, analytics, analyticsLoading, loading, error } = useSelector((state) => state.url);
  const [selectedSlug, setSelectedSlug] = useState("");

  useEffect(() => {
    dispatch(fetchUserUrls());
  }, [dispatch]);

  const currentSlug = selectedSlug || urls[0]?.short_url || "";
  const selectedUrl = urls.find((url) => url.short_url === currentSlug);

  useEffect(() => {
    if (!currentSlug) {
      dispatch(clearAnalytics());
      return;
    }
    dispatch(fetchAnalytics(currentSlug));
  }, [currentSlug, dispatch]);

  const insights = useMemo(() => {
    const now = new Date();
    const totalClicks = urls.reduce((sum, url) => sum + (url.clicks || 0), 0);
    const activeLinks = urls.filter((url) => !url.disabled && !(url.expiresAt && new Date(url.expiresAt) <= now)).length;
    const protectedLinks = urls.filter((url) => url.password).length;
    const expiredLinks = urls.filter((url) => url.expiresAt && new Date(url.expiresAt) <= now).length;
    const topLinks = [...urls].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5);
    const tagCounts = urls.reduce((acc, url) => {
      (url.tags || []).forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {});

    return {
      totalClicks,
      activeLinks,
      protectedLinks,
      expiredLinks,
      averageClicks: urls.length ? Math.round(totalClicks / urls.length) : 0,
      topLinks,
      tagCounts,
    };
  }, [urls]);

  const fullShortUrl = (shortUrl) => (shortUrl?.startsWith("http") ? shortUrl : `${appOrigin()}/${shortUrl}`);

  return (
    <main className="page-wrap">
      <section className="brand-panel mb-6 p-6">
        <div className="max-w-3xl">
          <p className="page-kicker">Advanced analytics</p>
          <h1 className="page-title mt-2">
            Understand link performance at a glance.
          </h1>
          <p className="page-copy mt-3">
            Review the health of your link portfolio, compare top performers, inspect audience devices, and spot campaign patterns without leaving the dashboard.
          </p>
        </div>
      </section>

      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{error}</div>}

      <section className="mb-5 grid gap-4 md:grid-cols-5">
        <Metric label="Total clicks" value={insights.totalClicks} tone="indigo" />
        <Metric label="Average clicks" value={insights.averageClicks} tone="teal" />
        <Metric label="Active links" value={insights.activeLinks} tone="green" />
        <Metric label="Protected" value={insights.protectedLinks} tone="violet" />
        <Metric label="Expired" value={insights.expiredLinks} tone="orange" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950 theme-dark:text-white">Top performing links</h2>
              <p className="text-sm text-slate-500 theme-dark:text-slate-400">Ranked by recorded clicks.</p>
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center font-semibold text-slate-500">Loading performance data...</p>
          ) : insights.topLinks.length ? (
            <div className="grid gap-3">
              {insights.topLinks.map((url, index) => {
                const maxClicks = Math.max(...insights.topLinks.map((item) => item.clicks || 0), 1);
                const width = `${Math.max(((url.clicks || 0) / maxClicks) * 100, 6)}%`;
                return (
                  <button
                    key={url._id}
                    type="button"
                    onClick={() => setSelectedSlug(url.short_url)}
                    className={`rounded-lg border p-4 text-left transition ${
                      selectedSlug === url.short_url
                        ? "border-indigo-400 bg-indigo-50/80 theme-dark:border-teal-300 theme-dark:bg-white/10"
                        : "border-indigo-100 bg-white/58 hover:border-indigo-300 theme-dark:border-slate-700 theme-dark:bg-slate-900/38"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-black text-slate-900 theme-dark:text-white">#{index + 1} {url.short_url}</span>
                      <span className="badge badge-blue">{url.clicks || 0} clicks</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500 theme-dark:text-slate-400">{url.full_url}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 theme-dark:bg-slate-700">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400" style={{ width }} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-indigo-200 p-6 text-center text-slate-500 theme-dark:border-slate-700 theme-dark:text-slate-400">
              Create links and open them to build analytics.
            </p>
          )}
        </div>

        <div className="surface p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950 theme-dark:text-white">Link drilldown</h2>
              <p className="text-sm text-slate-500 theme-dark:text-slate-400">Select a link to inspect devices, browsers, referrers, and recent clicks.</p>
            </div>
            <select className="field max-w-sm" value={currentSlug} onChange={(event) => setSelectedSlug(event.target.value)}>
              {urls.map((url) => (
                <option key={url._id} value={url.short_url}>{url.short_url}</option>
              ))}
            </select>
          </div>

          {!selectedUrl ? (
            <p className="rounded-lg border border-dashed border-indigo-200 p-6 text-center text-slate-500 theme-dark:border-slate-700">
              No link selected.
            </p>
          ) : (
            <div className="grid gap-5">
              <div className="rounded-lg border border-indigo-100 bg-white/58 p-4 theme-dark:border-slate-700 theme-dark:bg-slate-900/38">
                <p className="font-mono text-sm font-black text-indigo-700 theme-dark:text-teal-300">{fullShortUrl(selectedUrl.short_url)}</p>
                <p className="mt-1 truncate text-sm text-slate-500 theme-dark:text-slate-400">{selectedUrl.full_url}</p>
              </div>

              {analyticsLoading ? (
                <p className="py-8 text-center font-semibold text-slate-500">Loading link analytics...</p>
              ) : analytics ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Metric label="Clicks" value={analytics.totalClicks || 0} tone="indigo" />
                    <Metric label="Devices" value={Object.keys(analytics.deviceBreakdown || {}).length} tone="teal" />
                    <Metric label="Referrers" value={(analytics.topReferrers || []).length} tone="orange" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Breakdown title="Devices" data={analytics.deviceBreakdown} />
                    <Breakdown title="Browsers" data={analytics.browserBreakdown} />
                    <Breakdown title="Platforms" data={analytics.platformBreakdown} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <List title="Top referrers" rows={(analytics.topReferrers || []).map((item) => [item.referrer, item.count])} />
                    <List
                      title="Recent clicks"
                      rows={(analytics.recentClicks || []).map((click) => [
                        new Date(click.timestamp).toLocaleString(),
                        `${click.device} / ${click.browser}`,
                      ])}
                    />
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-xl font-black text-slate-950 theme-dark:text-white">Tag distribution</h2>
          <div className="mt-4 grid gap-3">
            {Object.entries(insights.tagCounts).length ? Object.entries(insights.tagCounts).map(([tag, count]) => (
              <div key={tag}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700 theme-dark:text-slate-200">{tag}</span>
                  <span className="text-slate-500 theme-dark:text-slate-400">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 theme-dark:bg-slate-700">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-indigo-500" style={{ width: `${Math.max((count / Math.max(urls.length, 1)) * 100, 8)}%` }} />
                </div>
              </div>
            )) : <p className="text-sm text-slate-500 theme-dark:text-slate-400">Add tags to links to see distribution.</p>}
          </div>
        </div>

        <div className="brand-panel p-5">
          <h2 className="text-xl font-black text-slate-950 theme-dark:text-white">Operational signals</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 theme-dark:text-slate-300">
            <Signal label="Portfolio status" value={insights.expiredLinks ? "Review expired links" : "Healthy"} />
            <Signal label="Security coverage" value={`${insights.protectedLinks} protected links`} />
            <Signal label="Campaign tagging" value={`${Object.keys(insights.tagCounts).length} active tag groups`} />
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }) {
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
  const max = Math.max(...entries.map(([, count]) => count), 1);
  return (
    <div className="rounded-lg border border-indigo-100 bg-white/52 p-4 theme-dark:border-slate-700 theme-dark:bg-slate-900/36">
      <h3 className="font-black text-slate-900 theme-dark:text-white">{title}</h3>
      <div className="mt-3 grid gap-3">
        {entries.length ? entries.map(([label, count]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-600 theme-dark:text-slate-300">{label}</span>
              <span className="font-black text-slate-900 theme-dark:text-white">{count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 theme-dark:bg-slate-700">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400" style={{ width: `${Math.max((count / max) * 100, 8)}%` }} />
            </div>
          </div>
        )) : <p className="text-sm text-slate-500 theme-dark:text-slate-400">No data yet.</p>}
      </div>
    </div>
  );
}

function List({ title, rows }) {
  return (
    <div className="rounded-lg border border-indigo-100 bg-white/52 p-4 theme-dark:border-slate-700 theme-dark:bg-slate-900/36">
      <h3 className="font-black text-slate-900 theme-dark:text-white">{title}</h3>
      <div className="mt-3 grid gap-2">
        {rows.length ? rows.slice(0, 6).map(([label, value], index) => (
          <div key={`${label}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-white/60 px-3 py-2 text-sm theme-dark:bg-white/5">
            <span className="truncate text-slate-600 theme-dark:text-slate-300">{label}</span>
            <span className="shrink-0 font-black text-slate-900 theme-dark:text-white">{value}</span>
          </div>
        )) : <p className="text-sm text-slate-500 theme-dark:text-slate-400">No data yet.</p>}
      </div>
    </div>
  );
}

function Signal({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-indigo-100 bg-white/50 px-4 py-3 theme-dark:border-slate-700 theme-dark:bg-white/5">
      <span className="font-bold">{label}</span>
      <span className="text-right font-black text-indigo-700 theme-dark:text-teal-300">{value}</span>
    </div>
  );
}
