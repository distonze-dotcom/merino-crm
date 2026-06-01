import { useState } from "react";
import { useQuotations, useChangeQuotationStatus, useExportToPresea } from "../hooks/useQuotations";
import { SectionHeader } from "../components/design/SectionHeader";
import { Badge } from "../components/design/Badge";
import { Avatar } from "../components/design/Avatar";
import { C, fmt, fmtDate, QUOTATION_STATUS_LABEL, QUOTATION_STATUS_COLOR, QUOTATION_STATUS_BG } from "../components/design/tokens";

function ModalExportarPresea({ quotation, onClose, onConfirmar }: { quotation: any; onClose: () => void; onConfirmar: () => void }) {
  const total = quotation.items.reduce((s: number, i: any) => s + i.subtotal, 0);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(45,62,80,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `2px solid ${C.purple}`, borderRadius: 3, padding: 32, width: 480 }}>
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>⬇</div>
        <h2 style={{ color: C.text, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", textAlign: "center", margin: "0 0 6px", fontSize: 20 }}>Exportar a Presea</h2>
        <p style={{ color: C.muted, textAlign: "center", fontSize: 13, margin: "0 0 24px" }}>Se descargará el Excel y el presupuesto quedará marcado como <strong style={{ color: C.green }}>Facturado</strong>.</p>

        <div style={{ background: C.card, borderRadius: 3, padding: "14px 16px", marginBottom: 20, border: `1px solid ${C.border}` }}>
          {[["Presupuesto", quotation.number], ["Cliente", quotation.customer?.name], ["Monto", fmt(total)], ["Comercial", quotation.salesRep?.name]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted, fontSize: 12 }}>{k}</span>
              <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "#0a2010", border: `1px solid ${C.green}33`, borderRadius: 3, padding: "10px 14px", marginBottom: 20 }}>
          <p style={{ color: C.green, fontSize: 12, margin: 0 }}>✅ Al confirmar: se descarga el Excel en formato Presea y el presupuesto pasa a <strong>Facturado</strong>.</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onConfirmar} style={{ flex: 1, background: C.purple, color: "#fff", border: "none", borderRadius: 3, padding: "12px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            ⬇ Descargar Excel y Confirmar
          </button>
          <button onClick={onClose} style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 3, padding: "12px 16px", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function Presupuestos() {
  const { data: quotations = [], isLoading } = useQuotations();
  const exportMutation = useExportToPresea();
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [exportQ, setExportQ] = useState<any | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  if (isLoading) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Cargando...</div>;

  const filtrados = (quotations as any[]).filter((q: any) =>
    filtroEstado === "Todos" || q.status === filtroEstado
  );

  const totalFilt = filtrados.reduce((s: number, q: any) => s + q.items.reduce((ss: number, i: any) => ss + i.subtotal, 0), 0);
  const listos = (quotations as any[]).filter((q: any) => q.status === "READY_FOR_INVOICING");

  const handleExport = async () => {
    if (!exportQ) return;
    try {
      const result = await exportMutation.mutateAsync(exportQ.id);
      setExportQ(null);
      showToast(`✅ ${result.fileName} exportado`);
    } catch (err: any) {
      showToast(`❌ ${err?.response?.data?.error || "Error al exportar"}`);
      setExportQ(null);
    }
  };

  const filterBtnStyle = (status: string) => ({
    background: filtroEstado === status ? (QUOTATION_STATUS_BG[status] || C.accent) : C.card,
    color: filtroEstado === status ? (QUOTATION_STATUS_COLOR[status] || "#fff") : C.muted,
    border: `1px solid ${filtroEstado === status ? (QUOTATION_STATUS_COLOR[status] || C.accent) : C.border}`,
    borderRadius: 3,
    padding: "5px 14px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  });

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: C.greenDim, border: `1px solid ${C.green}`, color: C.green, borderRadius: 3, padding: "12px 20px", fontWeight: 700, fontSize: 13, zIndex: 500 }}>
          {toast}
        </div>
      )}
      {exportQ && <ModalExportarPresea quotation={exportQ} onClose={() => setExportQ(null)} onConfirmar={handleExport} />}

      <SectionHeader
        title="Presupuestos"
        sub={`${filtrados.length} registros · ${fmt(totalFilt)}`}
        action={<button style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 3, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Nuevo Presupuesto</button>}
      />

      {listos.length > 0 && (
        <div style={{ background: C.purpleDim, border: `1px solid ${C.purple}44`, borderRadius: 3, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ color: C.purple, fontWeight: 700, fontSize: 13 }}>🧾 {listos.length} presupuesto{listos.length > 1 ? "s" : ""} listo{listos.length > 1 ? "s" : ""} para facturar</span>
            <span style={{ color: C.muted, fontSize: 12, marginLeft: 10 }}>{fmt(listos.reduce((s: number, q: any) => s + q.items.reduce((ss: number, i: any) => ss + i.subtotal, 0), 0))}</span>
          </div>
          <button onClick={() => setFiltroEstado("READY_FOR_INVOICING")} style={{ background: C.purple, color: "#fff", border: "none", borderRadius: 3, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Ver todos</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <button onClick={() => setFiltroEstado("Todos")} style={filterBtnStyle("Todos")}>Todos</button>
        {["READY_FOR_INVOICING", "INVOICED", "UNDER_REVIEW", "SENT", "DRAFT", "REJECTED"].map(s => (
          <button key={s} onClick={() => setFiltroEstado(s)} style={filterBtnStyle(s)}>{QUOTATION_STATUS_LABEL[s]}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 130px 90px 110px 150px 130px", gap: 8, padding: "8px 14px", background: C.surface, borderRadius: 3 }}>
          {["N°", "Cliente", "Comercial", "Fecha", "Monto", "Estado", "Acción"].map(h => (
            <span key={h} style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</span>
          ))}
        </div>

        {filtrados.map((q: any) => {
          const total = q.items.reduce((s: number, i: any) => s + i.subtotal, 0);
          return (
            <div key={q.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr 130px 90px 110px 150px 130px", gap: 8, padding: "12px 14px", background: C.card, borderRadius: 3, border: `1px solid ${q.status === "READY_FOR_INVOICING" ? C.purple + "44" : C.border}`, alignItems: "center" }}>
              <span style={{ color: C.muted, fontSize: 11, fontFamily: "monospace" }}>{q.number}</span>
              <div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{q.customer?.name}</div>
                <div style={{ color: C.dim, fontSize: 11, marginTop: 1 }}>{q.items[0]?.product?.name || "—"}{q.items.length > 1 ? ` +${q.items.length - 1}` : ""}</div>
                {q.lossReason && <div style={{ color: C.red, fontSize: 11, marginTop: 1 }}>⚠ {q.lossReason}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Avatar avatar={q.salesRep?.avatar} color={q.salesRep?.color} size={22} />
                <span style={{ color: C.muted, fontSize: 11 }}>{q.salesRep?.name?.split(" ")[0]}</span>
              </div>
              <span style={{ color: C.muted, fontSize: 12 }}>{fmtDate(q.issueDate)}</span>
              <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{fmt(total)}</span>
              <Badge label={QUOTATION_STATUS_LABEL[q.status]} color={QUOTATION_STATUS_COLOR[q.status]} bg={QUOTATION_STATUS_BG[q.status]} />
              {q.status === "READY_FOR_INVOICING" ? (
                <button onClick={() => setExportQ(q)} style={{ background: C.purple, color: "#fff", border: "none", borderRadius: 3, padding: "6px 12px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>⬇ Exportar a Presea</button>
              ) : (
                <span style={{ color: C.dim, fontSize: 11 }}>—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
