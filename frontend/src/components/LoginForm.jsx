import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useDispatch, useSelector } from "react-redux";
import { clearError, login } from "../store/slices/authSlice";

export default function LoginForm({ state }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [validErr, setValidErr] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const update = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setValidErr(""); if (error) dispatch(clearError()); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return setValidErr("Email is required.");
    if (!form.password) return setValidErr("Password is required.");
    const res = await dispatch(login({ email: form.email.trim(), password: form.password }));
    if (login.fulfilled.match(res)) navigate({ to: "/" });
  };

  const msg = validErr || error;

  return (
    <AuthShell heading="Welcome back" sub="Sign in to manage your short links." toggleLabel="Don't have an account?" toggleAction="Create one" onToggle={() => state(false)}>
      {msg && <Banner type="error">{msg}</Banner>}
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
        <Field label="Email address" type="email" value={form.email} onChange={(v) => update("email", v)} placeholder="you@example.com" disabled={loading} />
        <FieldPwd label="Password" value={form.password} show={showPwd} onToggle={() => setShowPwd(s => !s)} onChange={(v) => update("password", v)} placeholder="Your password" disabled={loading} />
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 4, minHeight: 44, fontSize: "0.95rem" }}>
          {loading ? <Spinner /> : "Sign in →"}
        </button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ heading, sub, toggleLabel, toggleAction, onToggle, children }) {
  const features = [
    { icon: "⚡", text: "Shorten any URL instantly" },
    { icon: "🔒", text: "Password-protect sensitive links" },
    { icon: "📊", text: "Track clicks, devices & referrers" },
    { icon: "📱", text: "Generate QR codes automatically" },
    { icon: "🏷️", text: "Organise links with tags" },
    { icon: "⏱️", text: "Set custom expiry dates" },
  ];
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div className="auth-hero" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 56px", background: "linear-gradient(145deg,#4f46e5,#6366f1 50%,#0ea5e9)", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 15 }}>UH</div>
            <span style={{ fontWeight: 900, fontSize: "1.1rem" }}>URLHub</span>
          </div>
          <h2 style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: 12 }}>Powerful link<br />management</h2>
          <p style={{ opacity: 0.85, lineHeight: 1.7, marginBottom: 40, maxWidth: 340, fontSize: "0.95rem" }}>Everything you need to shorten, track, and manage links for campaigns, teams, and products.</p>
          <div style={{ display: "grid", gap: 12 }}>
            {features.map(f => <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.875rem", opacity: 0.92 }}><span>{f.icon}</span>{f.text}</div>)}
          </div>
        </div>
      </div>
      <div style={{ width: "min(480px,100%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 40px", background: "var(--surface-strong)", overflowY: "auto" }}>
        <div style={{ maxWidth: 380, margin: "0 auto", width: "100%" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--text)", marginBottom: 6 }}>{heading}</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: 28 }}>{sub}</p>
          {children}
          <p style={{ marginTop: 24, textAlign: "center", fontSize: "0.85rem", color: "var(--muted)" }}>
            {toggleLabel}{" "}
            <button type="button" onClick={onToggle} style={{ fontWeight: 800, color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>{toggleAction}</button>
          </p>
        </div>
      </div>
      <style>{`@media(max-width:768px){.auth-hero{display:none!important}}`}</style>
    </div>
  );
}

function Banner({ type, children }) {
  const isErr = type === "error";
  return <div style={{ marginBottom: 16, padding: "10px 14px", background: isErr ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", border: `1px solid ${isErr ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"}`, borderRadius: 8, color: isErr ? "#ef4444" : "#15803d", fontWeight: 600, fontSize: "0.85rem" }}>{isErr ? "⚠ " : "✓ "}{children}</div>;
}

function Field({ label, type = "text", value, onChange, placeholder, error, disabled }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)" }}>{label}</span>
      <input className="field" type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
      {error && <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#ef4444" }}>⚠ {error}</span>}
    </label>
  );
}

function FieldPwd({ label, value, show, onToggle, onChange, placeholder, error, disabled }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)" }}>{label}</span>
      <div style={{ position: "relative" }}>
        <input className="field" type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} style={{ paddingRight: 44 }} />
        <button type="button" onClick={onToggle} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.8rem", fontWeight: 700 }}>{show ? "hide" : "show"}</button>
      </div>
      {error && <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#ef4444" }}>⚠ {error}</span>}
    </label>
  );
}

function Spinner() {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Please wait...<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></span>;
}
