import type { ReactElement } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { Avatar } from "../design/Avatar";
import { NAV, R_SM } from "../design/tokens";
import { useQuery } from "@tanstack/react-query";
import { getAlerts } from "../../api/alerts";
import { useQuotations } from "../../hooks/useQuotations";

export const SIDEBAR_W = 210;

// ─── Line icons (stroke-based, match mockup) ──────────────────────────────────
const ico = (path: string) => ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? NAV.textActive : NAV.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {path.split("|").map((d, i) => <path key={i} d={d} />)}
  </svg>
);
const Icons: Record<string, (p: { active: boolean }) => ReactElement> = {
  alertas:       ico("M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9|M13.7 21a2 2 0 0 1-3.4 0"),
  clientes:      ico("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8|M23 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75"),
  presupuestos:  ico("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8"),
  visitas:       ico("M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z|M8 2v16|M16 6v16"),
  dashboard:     ico("M3 3v18h18|M18 17V9|M13 17V5|M8 17v-3"),
  configuracion: ico("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"),
};

const TABS = [
  { to: "/alertas",       key: "alertas",       label: "Alertas",       adminOnly: false },
  { to: "/clientes",      key: "clientes",      label: "Clientes",      adminOnly: false },
  { to: "/presupuestos",  key: "presupuestos",  label: "Presupuestos",  adminOnly: false },
  { to: "/visitas",       key: "visitas",       label: "Visitas",       adminOnly: false },
  { to: "/dashboard",     key: "dashboard",     label: "Análisis",      adminOnly: false },
  { to: "/configuracion", key: "configuracion", label: "Configuración", adminOnly: true },
];

export function NavBar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: alerts = [] } = useQuery({ queryKey: ["alerts"], queryFn: getAlerts, refetchInterval: 5 * 60_000, staleTime: 60_000 });
  const { data: quotations = [] } = useQuotations();

  const alertCount = Array.isArray(alerts) ? alerts.length : 0;
  const readyCount = Array.isArray(quotations) ? quotations.filter((q: { status: string }) => q.status === "READY_FOR_INVOICING").length : 0;

  const handleLogout = () => { logout(); navigate("/login"); };

  const badge = (key: string) => {
    if (key === "alertas" && alertCount > 0) return alertCount;
    if (key === "presupuestos" && readyCount > 0) return readyCount;
    return null;
  };

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0, width: SIDEBAR_W,
      background: NAV.bg, display: "flex", flexDirection: "column", zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: R_SM, padding: "8px 12px", display: "flex", justifyContent: "center", width: "100%" }}>
          <img src="/logo-merino.png" alt="Andres Merino" style={{ width: "100%", maxWidth: 130, height: "auto", display: "block" }} />
        </div>
      </div>

      {/* Tabs */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 3, padding: "8px 12px", flex: 1 }}>
        {TABS.filter((t) => !t.adminOnly || user?.role === "ADMIN").map((t) => {
          const b = badge(t.key);
          const Icon = Icons[t.key];
          return (
            <NavLink key={t.to} to={t.to} onClick={onNavigate} style={({ isActive }) => ({
              background: isActive ? NAV.bgActive : "transparent",
              color: isActive ? NAV.textActive : NAV.text,
              borderRadius: R_SM, cursor: "pointer", padding: "9px 12px",
              fontSize: 13.5, fontWeight: isActive ? 600 : 500, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 11, transition: "background 0.12s",
            })}>
              {({ isActive }: any) => (
                <>
                  <span style={{ display: "flex", width: 18 }}>{Icon && <Icon active={isActive} />}</span>
                  <span style={{ flex: 1 }}>{t.label}</span>
                  {b && (
                    <span style={{ background: NAV.accent, color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700, minWidth: 18, textAlign: "center" }}>{b}</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User card */}
      {user && (
        <div style={{ margin: 12, padding: "10px 12px", borderRadius: R_SM, background: NAV.hover, display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar avatar={user.avatar} color={user.color} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: NAV.textActive, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ color: NAV.text, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>{user.role}</div>
          </div>
          <button onClick={handleLogout} title="Salir" aria-label="Salir" style={{ background: "transparent", border: "none", color: NAV.text, cursor: "pointer", padding: 4, display: "flex" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
            </svg>
          </button>
        </div>
      )}
    </aside>
  );
}
