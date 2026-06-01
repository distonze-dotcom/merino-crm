import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { NavBar, SIDEBAR_W } from "./NavBar";
import { C } from "../design/tokens";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

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
