import { C } from "./tokens";

interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
}

export function Badge({ label, color, bg }: BadgeProps) {
  return (
    <span style={{
      background: bg || C.card,
      color: color || C.muted,
      border: `1px solid ${(color || C.muted)}33`,
      borderRadius: 8,
      padding: "2px 9px",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.4,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}
