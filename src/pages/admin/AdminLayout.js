import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Checking Permissions...</div>;

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 80px)", background: "#f5f5f6" }}>
      {/* SIDEBAR */}
      <aside style={{ width: "260px", background: "#fff", borderRight: "1px solid #eaeaec", padding: "30px 20px" }}>
        <h2 style={{ fontSize: "16px", color: "#282c3f", marginBottom: "30px", textTransform: "uppercase", letterSpacing: "1px" }}>
          Admin Panel
        </h2>
        
        <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link 
            to="/admin" 
            style={{ 
              padding: "12px 15px", 
              textDecoration: "none", 
              color: isActive("/admin") ? "#FF3F6C" : "#535766", 
              background: isActive("/admin") ? "#FFF0F4" : "transparent",
              borderRadius: "4px",
              fontWeight: isActive("/admin") ? "bold" : "600",
              display: "flex", alignItems: "center", gap: "10px"
            }}
          >
            📊 Overview
          </Link>
          
          <Link 
            to="/admin/inventory" 
            style={{ 
              padding: "12px 15px", 
              textDecoration: "none", 
              color: isActive("/admin/inventory") ? "#FF3F6C" : "#535766", 
              background: isActive("/admin/inventory") ? "#FFF0F4" : "transparent",
              borderRadius: "4px",
              fontWeight: isActive("/admin/inventory") ? "bold" : "600",
              display: "flex", alignItems: "center", gap: "10px"
            }}
          >
            📦 Inventory
          </Link>

          <Link 
            to="/admin/orders" 
            style={{ 
              padding: "12px 15px", 
              textDecoration: "none", 
              color: isActive("/admin/orders") ? "#FF3F6C" : "#535766", 
              background: isActive("/admin/orders") ? "#FFF0F4" : "transparent",
              borderRadius: "4px",
              fontWeight: isActive("/admin/orders") ? "bold" : "600",
              display: "flex", alignItems: "center", gap: "10px"
            }}
          >
            🛒 Order Logs
          </Link>
        </nav>
      </aside>

      {/* DASHBOARD CONTENT AREA */}
      <main style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
