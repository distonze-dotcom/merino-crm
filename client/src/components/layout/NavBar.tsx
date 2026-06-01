import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { Avatar } from "../design/Avatar";
import { C } from "../design/tokens";
import { useQuery } from "@tanstack/react-query";
import { getAlerts } from "../../api/alerts";
import { getQuotations } from "../../api/quotations";

const TABS = [
  { to: "/alertas",       icon: "🔔", label: "Alertas",       key: "alertas",       adminOnly: false },
  { to: "/clientes",      icon: "👥", label: "Clientes",      key: "clientes",      adminOnly: false },
  { to: "/presupuestos",  icon: "📋", label: "Presupuestos",  key: "presupuestos",  adminOnly: false },
  { to: "/visitas",       icon: "🗺",  label: "Visitas",       key: "visitas",       adminOnly: false },
  { to: "/dashboard",     icon: "📊", label: "Análisis",      key: "dashboard",     adminOnly: false },
  { to: "/configuracion", icon: "⚙",  label: "Configuración", key: "configuracion", adminOnly: true },
];

export function NavBar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: alerts = [] } = useQuery({ queryKey: ["alerts"], queryFn: getAlerts, refetchInterval: 60_000 });
  const { data: quotations = [] } = useQuery({ queryKey: ["quotations"], queryFn: () => getQuotations() });

  const alertCount = Array.isArray(alerts) ? alerts.length : 0;
  const readyCount = Array.isArray(quotations) ? quotations.filter((q: { status: string }) => q.status === "READY_FOR_INVOICING").length : 0;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const badge = (key: string) => {
    if (key === "alertas" && alertCount > 0) return alertCount;
    if (key === "presupuestos" && readyCount > 0) return readyCount;
    return null;
  };

  return (
    <div style={{
      background: C.surface,
      borderBottom: `1px solid ${C.border}`,
      padding: "0 28px",
      display: "flex",
      alignItems: "center",
      gap: 32,
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 0", minWidth: 180 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: `linear-gradient(135deg,${C.accent},#ff7043)`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>🎨</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.text, letterSpacing: -0.3 }}>Andres Merino</div>
          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.9 }}>Pinturerias · CRM</div>
        </div>
      </div>

      {/* Tabs */}
      <nav style={{ display: "flex", gap: 0, flex: 1 }}>
        {TABS.filter(t => !t.adminOnly || user?.role === "ADMIN").map(t => {
          const b = badge(t.key);
          return (
            <NavLink key={t.to} to={t.to} style={({ isActive }) => ({
              background: "transparent",
              color: isActive ? C.accent : C.muted,
              border: "none",
              borderBottom: `2px solid ${isActive ? C.accent : "transparent"}`,
              cursor: "pointer",
              padding: "17px 18px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              position: "relative",
            })}>
              <span>{t.icon}</span> {t.label}
              {b && (
                <span style={{ background: C.red, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 800, minWidth: 16, textAlign: "center" }}>
                  {b}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar avatar={user.avatar} color={user.color} size={28} />
          <div>
            <div style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{user.name.split(" ")[0]}</div>
            <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>{user.role}</div>
          </div>
          <button onClick={handleLogout} style={{
            background: "transparent",
            border: `1px solid ${C.border}`,
            color: C.muted,
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 11,
            cursor: "pointer",
            marginLeft: 4,
          }}>Salir</button>
        </div>
      )}
    </div>
  );
}
