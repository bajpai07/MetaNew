import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Wordmark from "../../components/Wordmark";

/**
 * Administration stays utilitarian — dense, tabular, quick to scan — but it is
 * paperwork, so it sits on the same bone ground as checkout and uses the same
 * type and hairlines. Previously it was its own grey-and-pink world with emoji
 * navigation; nothing about it now looks bolted on.
 */
export default function AdminLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="on-paper page gutter" style={{ paddingTop: "calc(var(--nav-h) + 96px)" }}>
        <p className="label" style={{ color: "var(--paper-ash)" }}>Checking permissions</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const links = [
    ["Overview", "/admin"],
    ["Inventory", "/admin/inventory"],
    ["Orders", "/admin/orders"]
  ];

  return (
    <div className="on-paper page" style={{ display: "flex", flexDirection: "column" }}>
      <div
        className="gutter"
        style={{
          paddingTop: "30px",
          paddingBottom: "18px",
          display: "flex",
          alignItems: "baseline",
          gap: "20px",
          flexWrap: "wrap"
        }}
      >
        <Wordmark size={16} />
        <span className="label" style={{ color: "var(--paper-ash)" }}>Administration</span>
      </div>

      <nav
        className="gutter"
        style={{
          display: "flex",
          gap: "26px",
          borderBottom: "1px solid var(--paper-veil)",
          overflowX: "auto"
        }}
      >
        {links.map(([label, path]) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="label"
              style={{
                whiteSpace: "nowrap",
                minHeight: "48px",
                display: "flex",
                alignItems: "center",
                color: active ? "var(--paper-ink)" : "var(--paper-ash)",
                borderBottom: active
                  ? "1px solid var(--paper-ink)"
                  : "1px solid transparent",
                marginBottom: "-1px"
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <main className="gutter" style={{ paddingTop: "36px", paddingBottom: "80px", flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
