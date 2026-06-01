import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { NavBar } from "./NavBar";
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
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 22px" }}>
        {children}
      </div>
    </div>
  );
}
