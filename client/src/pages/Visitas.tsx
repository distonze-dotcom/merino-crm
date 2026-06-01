import { useState } from "react";
import { useVisits, useCreateVisit } from "../hooks/useVisits";
import { useCustomers } from "../hooks/useCustomers";
import { useAuthStore } from "../store/auth.store";
import { SectionHeader } from "../components/design/SectionHeader";
import { Badge } from "../components/design/Badge";
import { Avatar } from "../components/design/Avatar";
import { C, fmt, fmtDate, daysSince } from "../components/design/tokens";

export default function Visitas() {
  const { data: visits = [], isLoading } = useVisits();
  const { data: customers = [] } = useCustomers();
  const createVisit = useCreateVisit();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    salesRepId: user?.id || "",
    date: new Date().toISOString().split("T")[0],
    wasReceived: true,
    result: "",
    saleAmount: 0,
    nextVisitDate: "",
  });

  if (isLoading) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Cargando visitas...</div>;

  const pendientesHoy = (visits as any[]).filter((v: any) =>
    v.nextVisitDate && daysSince(v.nextVisitDate) >= 0 && v.saleAmount === 0
  );

  const handleSubmit = async () => {
    if (!form.customerId || !form.result) return;
    try {
      await createVisit.mutateAsync({
        ...form,
        saleAmount: Number(form.saleAmount),
        nextVisitDate: form.nextVisitDate || undefined,
        salesRepId: user?.id || "",
      });
      setShowForm(false);
      setForm({ customerId: "", salesRepId: user?.id || "", date: new Date().toISOString().split("T")[0], wasReceived: true, result: "", saleAmount: 0, nextVisitDate: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const inp = { width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" as const };

  return (
    <div>
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowForm(false)}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 480 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: C.text, fontFamily: "Georgia,serif", fontSize: 18, margin: "0 0 20px" }}>Registrar nueva visita</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5 }}>Cliente</div>
                <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} style={inp}>
                  <option value="">Seleccionar cliente...</option>
                  {(customers as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5 }}>Fecha</div>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} />
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5 }}>¿El cliente los recibió?</div>
                <select value={form.wasReceived ? "si" : "no"} onChange={e => setForm({ ...form, wasReceived: e.target.value === "si" })} style={inp}>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5 }}>Resultado de la visita</div>
                <textarea value={form.result} onChange={e => setForm({ ...form, result: e.target.value })} style={{ ...inp, resize: "vertical", minHeight: 70 }} />
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5 }}>Venta realizada ($)</div>
                <input type="number" value={form.saleAmount} onChange={e => setForm({ ...form, saleAmount: Number(e.target.value) })} style={inp} min={0} />
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5 }}>Próxima visita</div>
                <input type="date" value={form.nextVisitDate} onChange={e => setForm({ ...form, nextVisitDate: e.target.value })} style={inp} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={handleSubmit} disabled={createVisit.isPending} style={{ flex: 1, background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {createVisit.isPending ? "Guardando..." : "Guardar visita"}
              </button>
              <button onClick={() => setShowForm(false)} style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <SectionHeader title="Registro de Visitas" sub="Planilla de recorridos y seguimiento" action={
        <button onClick={() => setShowForm(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Registrar Visita</button>
      } />

      {pendientesHoy.length > 0 && (
        <div style={{ background: C.blueDim, border: `1px solid ${C.blue}44`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <span style={{ color: C.blue, fontWeight: 700, fontSize: 13 }}>📅 {pendientesHoy.length} seguimiento{pendientesHoy.length > 1 ? "s" : ""} pendiente{pendientesHoy.length > 1 ? "s" : ""} hoy</span>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {pendientesHoy.map((v: any) => (
              <Badge key={v.id} label={v.customer?.name} color={C.blue} bg={C.blueDim} />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(visits as any[]).map((v: any) => {
          const vencida = v.nextVisitDate && daysSince(v.nextVisitDate) > 0;
          return (
            <div key={v.id} style={{
              background: C.card,
              border: `1px solid ${vencida && v.saleAmount === 0 ? C.redDim : C.border}`,
              borderLeft: `4px solid ${v.saleAmount > 0 ? C.green : v.wasReceived ? C.yellow : C.red}`,
              borderRadius: 10,
              padding: "14px 18px",
              display: "grid",
              gridTemplateColumns: "1fr 160px 1fr 130px",
              alignItems: "center",
              gap: 14,
            }}>
              <div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{v.customer?.name}</div>
                <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>{v.customer?.sector}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                  <Badge label={fmtDate(v.date)} color={C.muted} />
                  <Badge label={v.wasReceived ? "Recibido ✓" : "No recibido"} color={v.wasReceived ? C.green : C.red} bg={v.wasReceived ? C.greenDim : C.redDim} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar avatar={v.salesRep?.avatar} color={v.salesRep?.color} size={26} />
                <span style={{ color: C.muted, fontSize: 12 }}>{v.salesRep?.name}</span>
              </div>
              <div style={{ color: C.text, fontSize: 13 }}>{v.result}</div>
              <div style={{ textAlign: "right" }}>
                {v.saleAmount > 0
                  ? <div style={{ color: C.green, fontWeight: 800, fontSize: 15 }}>{fmt(v.saleAmount)}</div>
                  : <div style={{ color: C.dim, fontSize: 12 }}>Sin venta</div>
                }
                {v.nextVisitDate && (
                  <div style={{ color: vencida && v.saleAmount === 0 ? C.red : C.blue, fontSize: 11, marginTop: 4 }}>
                    {vencida && v.saleAmount === 0 ? "⚠ " : "📅 "}Próx: {fmtDate(v.nextVisitDate)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
