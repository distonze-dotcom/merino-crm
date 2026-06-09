import { ReactNode, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { NavBar, SIDEBAR_W } from "./NavBar";
import { useIsMobile } from "../../hooks/useIsMobile";
import { C } from "../design/tokens";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuthStore();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  if (!user) return <Navigate to="/login" replace />;

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
        {/* Top bar */}
        <div style={{ position: "sticky", top: 0, zIndex: 90, display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => setDrawerOpen(true)} aria-label="Abrir menú" style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 18, lineHeight: 1, cursor: "pointer", color: C.text }}>☰</button>
          <span style={{ color: C.text, fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>Nexoft</span>
        </div>

        {/* Drawer */}
        {drawerOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
            <div onClick={() => setDrawerOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(45,62,80,0.45)" }} />
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: SIDEBAR_W }}>
              <NavBar onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}

        <main style={{ padding: "16px 14px" }}>{children}</main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      <NavBar />
      <main style={{ marginLeft: SIDEBAR_W, minHeight: "100vh" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 32px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
