import { ReactNode } from "react";
import { C } from "./tokens";

interface SectionHeaderProps {
  title: string;
  sub?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, sub, action }: SectionHeaderProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
      <div>
        <h2 style={{ color: C.text, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", fontSize: 22, margin: 0, fontWeight: 700 }}>{title}</h2>
        {sub && <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
