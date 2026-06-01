import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import Login from "./pages/Login";
import Alertas from "./pages/Alertas";
import Clientes from "./pages/Clientes";
import Presupuestos from "./pages/Presupuestos";
import Visitas from "./pages/Visitas";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/alertas"
        element={<AppShell><Alertas /></AppShell>}
      />
      <Route
        path="/clientes"
        element={<AppShell><Clientes /></AppShell>}
      />
      <Route
        path="/presupuestos"
        element={<AppShell><Presupuestos /></AppShell>}
      />
      <Route
        path="/visitas"
        element={<AppShell><Visitas /></AppShell>}
      />
      <Route
        path="/dashboard"
        element={<AppShell><Dashboard /></AppShell>}
      />
      <Route path="*" element={<Navigate to="/alertas" replace />} />
    </Routes>
  );
}
