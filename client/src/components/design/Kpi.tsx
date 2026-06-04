import { C, SHADOW } from "./tokens";

interface KpiProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function Kpi({ icon, label, value, sub, color }: KpiProps) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      boxShadow: SHADOW,
      padding: "18px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color || C.accent }} />
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || C.text, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
