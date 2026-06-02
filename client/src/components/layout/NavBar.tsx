import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { Avatar } from "../design/Avatar";
import { C, R } from "../design/tokens";
import { useQuery } from "@tanstack/react-query";
import { getAlerts } from "../../api/alerts";
import { useQuotations } from "../../hooks/useQuotations";

export const SIDEBAR_W = 232;

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

  const { data: alerts = [] } = useQuery({ queryKey: ["alerts"], queryFn: getAlerts, refetchInterval: 5 * 60_000, staleTime: 60_000 });
  const { data: quotations = [] } = useQuotations();

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
    <aside style={{
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      width: SIDEBAR_W,
      background: C.surface,
      borderRight: `1px solid ${C.border}`,
      display: "flex",
      flexDirection: "column",
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 18px 16px", borderBottom: `1px solid ${C.border}` }}>
        <img src="/logo-merino.png" alt="Andres Merino — Cadena de Pinturerías" style={{ width: 150, height: "auto", display: "block" }} />
        <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, marginTop: 8 }}>Sistema CRM</div>
      </div>

      {/* Tabs */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 10px", flex: 1 }}>
        {TABS.filter(t => !t.adminOnly || user?.role === "ADMIN").map(t => {
          const b = badge(t.key);
          return (
            <NavLink key={t.to} to={t.to} style={({ isActive }) => ({
              background: isActive ? C.accentDim : "transparent",
              color: isActive ? C.accent : C.text,
              borderRadius: R,
              cursor: "pointer",
              padding: "10px 12px",
              fontSize: 13.5,
              fontWeight: isActive ? 700 : 500,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
            })}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{t.icon}</span>
              <span style={{ flex: 1 }}>{t.label}</span>
              {b && (
                <span style={{ background: C.red, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 800, minWidth: 18, textAlign: "center" }}>
                  {b}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar avatar={user.avatar} color={user.color} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: C.text, fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>{user.role}</div>
          </div>
          <button onClick={handleLogout} title="Salir" style={{
            background: "transparent",
            border: `1px solid ${C.border}`,
            color: C.muted,
            borderRadius: R,
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}>Salir</button>
        </div>
      )}
    </aside>
  );
}
