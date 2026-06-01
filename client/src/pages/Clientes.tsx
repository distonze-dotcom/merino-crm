import { useState } from "react";
import { useCustomers, useCreateCustomer } from "../hooks/useCustomers";
import { useUsers } from "../hooks/useDashboard";
import { useCustomer } from "../hooks/useCustomers";
import { SectionHeader } from "../components/design/SectionHeader";
import { Badge } from "../components/design/Badge";
import { Avatar } from "../components/design/Avatar";
import { Kpi } from "../components/design/Kpi";
import { C, fmt, fmtDate, daysSince, QUOTATION_STATUS_COLOR, QUOTATION_STATUS_BG, QUOTATION_STATUS_LABEL } from "../components/design/tokens";

function FichaCliente({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const { data: c, isLoading } = useCustomer(customerId);
  if (isLoading || !c) return null;

  const facturado = c.quotations
    .filter((q: any) => q.status === "INVOICED")
    .reduce((s: number, q: any) => s + q.items.reduce((ss: number, i: any) => ss + i.subtotal, 0), 0);
  const perdido = c.quotations
    .filter((q: any) => q.status === "REJECTED")
    .reduce((s: number, q: any) => s + q.items.reduce((ss: number, i: any) => ss + i.subtotal, 0), 0);
  const conv = c.quotations.length
    ? Math.round(c.quotations.filter((q: any) => q.status === "INVOICED").length / c.quotations.length * 100)
    : 0;

  const lastVisit = c.visits[0];
  const lastPurchase = c.quotations.find((q: any) => q.status === "INVOICED");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(45,62,80,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, width: 720, maxHeight: "85vh", overflow: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ color: C.text, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", fontSize: 20, margin: 0 }}>{c.name}</h2>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <Badge label={c.sector} color={C.yellow} bg={C.yellowDim} />
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Avatar avatar={c.assignedTo.avatar} color={c.assignedTo.color} size={20} />
                <span style={{ color: C.muted, fontSize: 12 }}>{c.assignedTo.name}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 3, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>✕ Cerrar</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 22 }}>
          <Kpi icon="✅" label="Facturado" value={fmt(facturado)} color={C.green} />
          <Kpi icon="❌" label="Perdido" value={fmt(perdido)} color={C.red} />
          <Kpi icon="🎯" label="Conversión" value={`${conv}%`} color={conv >= 50 ? C.green : C.yellow} />
          <Kpi icon="📋" label="Presupuestos" value={c.quotations.length} color={C.blue} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
          {lastPurchase && (
            <div style={{ background: C.card, borderRadius: 3, padding: "12px 14px", border: `1px solid ${C.border}` }}>
              <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Última compra</div>
              <div style={{ color: C.green, fontWeight: 700, fontSize: 15 }}>{fmtDate(lastPurchase.updatedAt)}</div>
            </div>
          )}
          {lastVisit && (
            <div style={{ background: C.card, borderRadius: 3, padding: "12px 14px", border: `1px solid ${C.border}` }}>
              <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Última visita</div>
              <div style={{ color: daysSince(lastVisit.date) > 20 ? C.red : C.green, fontWeight: 700, fontSize: 15 }}>{fmtDate(lastVisit.date)}</div>
              <div style={{ color: C.dim, fontSize: 11 }}>hace {daysSince(lastVisit.date)} días</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px" }}>📋 Historial de Presupuestos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {c.quotations.map((q: any) => {
              const total = q.items.reduce((s: number, i: any) => s + i.subtotal, 0);
              return (
                <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.bg, borderRadius: 3, border: `1px solid ${C.border}` }}>
                  <span style={{ color: C.muted, fontSize: 11, fontFamily: "monospace", minWidth: 60 }}>{q.number}</span>
                  <span style={{ color: C.text, fontSize: 12, flex: 1 }}>{q.items[0]?.product?.name || "—"}{q.items.length > 1 ? ` +${q.items.length - 1}` : ""}</span>
                  <span style={{ color: C.muted, fontSize: 11 }}>{fmtDate(q.issueDate)}</span>
                  <span style={{ color: C.text, fontWeight: 700, fontSize: 13, minWidth: 90, textAlign: "right" }}>{fmt(total)}</span>
                  <Badge label={QUOTATION_STATUS_LABEL[q.status]} color={QUOTATION_STATUS_COLOR[q.status]} bg={QUOTATION_STATUS_BG[q.status]} />
                  {q.lossReason && <span style={{ color: C.red, fontSize: 11 }}>⚠ {q.lossReason.split("—")[0]}</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px" }}>🗺 Historial de Visitas</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {c.visits.length === 0 && <div style={{ color: C.dim, fontSize: 13 }}>Sin visitas registradas</div>}
            {c.visits.map((v: any) => (
              <div key={v.id} style={{ padding: "9px 12px", background: C.bg, borderRadius: 3, border: `1px solid ${C.border}`, borderLeft: `3px solid ${v.saleAmount > 0 ? C.green : v.wasReceived ? C.yellow : C.red}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: C.muted, fontSize: 11 }}>{fmtDate(v.date)}</span>
                  {v.saleAmount > 0 && <span style={{ color: C.green, fontWeight: 700, fontSize: 12 }}>{fmt(v.saleAmount)}</span>}
                </div>
                <div style={{ color: C.text, fontSize: 12 }}>{v.result}</div>
                {v.nextVisitDate && <div style={{ color: C.blue, fontSize: 11, marginTop: 3 }}>Próx. visita: {fmtDate(v.nextVisitDate)}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Clientes() {
  const { data: customers = [], isLoading } = useCustomers();
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [filtroRubro, setFiltroRubro] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  if (isLoading) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Cargando clientes...</div>;

  const rubros = ["Todos", ...new Set((customers as any[]).map((c: any) => c.sector))];

  const filtrados = (customers as any[]).filter((c: any) => {
    const matchRubro = filtroRubro === "Todos" || c.sector === filtroRubro;
    const lastPurchase = c.quotations?.find((q: any) => q.status === "INVOICED");
    const diasC = lastPurchase ? daysSince(lastPurchase.updatedAt) : 999;
    const matchEstado =
      filtroEstado === "Todos" ? true :
      filtroEstado === "Activo" ? diasC <= 30 :
      filtroEstado === "En riesgo" ? diasC > 30 && diasC <= 60 :
      diasC > 60;
    return matchRubro && matchEstado;
  });

  const btnStyle = (active: boolean) => ({
    background: active ? C.accent : C.card,
    color: active ? "#fff" : C.muted,
    border: `1px solid ${active ? C.accent : C.border}`,
    borderRadius: 3,
    padding: "5px 14px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  });

  return (
    <div>
      {fichaId && <FichaCliente customerId={fichaId} onClose={() => setFichaId(null)} />}

      <SectionHeader
        title="Cartera de Clientes"
        sub={`${filtrados.length} clientes`}
        action={
          <button style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 3, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Nuevo Cliente</button>
        }
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {["Todos", "Activo", "En riesgo", "Inactivo"].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)} style={btnStyle(filtroEstado === e)}>{e}</button>
        ))}
        <select value={filtroRubro} onChange={e => setFiltroRubro(e.target.value)} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 3, padding: "5px 12px", fontSize: 12, marginLeft: 8 }}>
          {rubros.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 110px 80px 80px", gap: 8, padding: "8px 14px", background: C.surface, borderRadius: 3 }}>
          {["Cliente / Rubro", "Comercial", "Facturado Total", "Estado", ""].map(h => (
            <span key={h} style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</span>
          ))}
        </div>

        {filtrados.map((c: any) => {
          const lastPurchase = c.quotations?.find((q: any) => q.status === "INVOICED");
          const diasC = lastPurchase ? daysSince(lastPurchase.updatedAt) : 999;
          const estado = diasC <= 30
            ? { label: "Activo", color: C.green, bg: C.greenDim }
            : diasC <= 60
            ? { label: "En riesgo", color: C.yellow, bg: C.yellowDim }
            : { label: "Inactivo", color: C.red, bg: C.redDim };
          const facturadoTotal = (c.quotations || [])
            .filter((q: any) => q.status === "INVOICED")
            .reduce((s: number, q: any) => s + (q.items || []).reduce((ss: number, i: any) => ss + i.subtotal, 0), 0);

          return (
            <div key={c.id} onClick={() => setFichaId(c.id)} style={{ display: "grid", gridTemplateColumns: "1fr 140px 110px 80px 80px", gap: 8, padding: "12px 14px", background: C.card, borderRadius: 3, border: `1px solid ${C.border}`, cursor: "pointer", alignItems: "center" }}>
              <div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>{c.sector}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Avatar avatar={c.assignedTo.avatar} color={c.assignedTo.color} size={22} />
                <span style={{ color: C.muted, fontSize: 12 }}>{c.assignedTo.name.split(" ")[0]}</span>
              </div>
              <div style={{ color: C.green, fontWeight: 700, fontSize: 13 }}>{fmt(facturadoTotal)}</div>
              <Badge label={estado.label} color={estado.color} bg={estado.bg} />
              <span style={{ color: C.muted, fontSize: 12 }}>Ver →</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
