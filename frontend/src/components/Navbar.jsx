import { useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";

const NAV_LINKS = [
  { label: "Create", path: "/", icon: "✦" },
  { label: "Links", path: "/dashboard", icon: "⊞" },
  { label: "Analytics", path: "/advanced-dashboard", icon: "◈" },
  { label: "Settings", path: "/settings", icon: "⚙" },
];

function getInitials(name) {
  return (name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isAuthenticated) return null;

  const goTo = (path) => { navigate({ to: path }); setMenuOpen(false); };
  const handleLogout = () => {
    dispatch(logout());
    setMenuOpen(false);
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--line)",
        boxShadow: "0 1px 12px rgba(15,23,42,0.07)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        style={{
          width: "min(1200px, calc(100% - 32px))",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 0",
        }}
      >
        {/* Logo */}
        <button
          type="button"
          onClick={() => goTo("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #4f46e5, #6366f1, #0ea5e9)",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              color: "#fff",
              fontSize: 14,
              letterSpacing: "-0.05em",
              boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              flexShrink: 0,
            }}
          >
            UH
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 900, fontSize: "0.95rem", color: "var(--text)", lineHeight: 1 }}>URLHub</div>
            <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600, lineHeight: 1.4 }}>Link manager</div>
          </div>
        </button>

        {/* Desktop nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }} className="hidden-mobile">
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.path;
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => goTo(link.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: active
                    ? "linear-gradient(135deg, #4f46e5, #6366f1)"
                    : "transparent",
                  color: active ? "#fff" : "var(--muted)",
                  boxShadow: active ? "0 4px 12px rgba(99,102,241,0.25)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(99,102,241,0.08)";
                    e.currentTarget.style.color = "var(--brand)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--muted)";
                  }
                }}
              >
                <span style={{ fontSize: "0.8rem" }}>{link.icon}</span>
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Account menu */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="btn btn-secondary"
            style={{ gap: 8, padding: "7px 12px" }}
            aria-expanded={menuOpen}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
                display: "grid",
                placeItems: "center",
                fontSize: "0.7rem",
                fontWeight: 900,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {getInitials(user?.name)}
            </div>
            <span className="hidden-mobile" style={{ fontWeight: 700, fontSize: "0.85rem" }}>
              {user?.name?.split(" ")[0] || "Account"}
            </span>
            <span style={{ fontSize: "0.6rem", color: "var(--muted)" }}>{menuOpen ? "▲" : "▼"}</span>
          </button>

          {menuOpen && (
            <>
              {/* Overlay */}
              <div
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
                onClick={() => setMenuOpen(false)}
              />
              {/* Dropdown */}
              <div
                className="surface"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  width: 240,
                  zIndex: 50,
                  overflow: "hidden",
                }}
              >
                {/* User info */}
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--line)",
                    background: "rgba(99,102,241,0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "0.8rem",
                        fontWeight: 900,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(user?.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: "0.875rem", color: "var(--text)" }}>
                        {user?.name || "User"}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user?.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nav links */}
                <div style={{ padding: "8px" }}>
                  {NAV_LINKS.map((link) => (
                    <button
                      key={link.path}
                      type="button"
                      onClick={() => goTo(link.path)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: location.pathname === link.path ? "rgba(99,102,241,0.1)" : "transparent",
                        color: location.pathname === link.path ? "var(--brand)" : "var(--text)",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.12s",
                      }}
                    >
                      <span>{link.icon}</span>
                      {link.label}
                    </button>
                  ))}
                </div>

                {/* Sign out */}
                <div style={{ padding: "8px", borderTop: "1px solid var(--line)" }}>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "rgba(239,68,68,0.06)",
                      color: "#ef4444",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    <span>⎋</span> Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div
        style={{
          display: "flex",
          borderTop: "1px solid var(--line)",
        }}
        className="show-mobile"
      >
        {NAV_LINKS.map((link) => {
          const active = location.pathname === link.path;
          return (
            <button
              key={link.path}
              type="button"
              onClick={() => goTo(link.path)}
              style={{
                flex: 1,
                padding: "10px 4px",
                border: "none",
                background: "transparent",
                color: active ? "var(--brand)" : "var(--muted)",
                fontWeight: 700,
                fontSize: "0.72rem",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                borderBottom: active ? "2px solid var(--brand)" : "2px solid transparent",
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>{link.icon}</span>
              {link.label}
            </button>
          );
        })}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .show-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
