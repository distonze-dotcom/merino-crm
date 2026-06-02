import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuotations, useChangeQuotationStatus, useExportToPresea } from "../hooks/useQuotations";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useAuthStore } from "../store/auth.store";
import { SectionHeader } from "../components/design/SectionHeader";
import { Badge } from "../components/design/Badge";
import { Avatar } from "../components/design/Avatar";
import { C, R, fmt, fmtDate, QUOTATION_STATUS_LABEL, QUOTATION_STATUS_COLOR, QUOTATION_STATUS_BG } from "../components/design/tokens";

// Allowed forward transitions (mirror of server ALLOWED_TRANSITIONS)
const NEXT_STATUS: Record<string, string[]> = {
  DRAFT: ["SENT", "REJECTED"],
  SENT: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["READY_FOR_INVOICING", "REJECTED"],
  READY_FOR_INVOICING: ["REJECTED"],
  INVOICED: [],
  REJECTED: [],
};

// ─── MODAL: EXPORTAR A PRESEA (facturar) ──────────────────────────────────────
function ModalExportarPresea({ quotation, onClose, onConfirmar, loading }: { quotation: any; onClose: () => void; onConfirmar: () => void; loading: boolean }) {
  useEscapeKey(onClose);
  const total = quotation.items.reduce((s: number, i: any) => s + i.subtotal, 0);
  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(45,62,80,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: C.surface, border: `2px solid ${C.purple}`, borderRadius: R, padding: 32, width: 480 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>⬇</div>
        <h2 style={{ color: C.text, textAlign: "center", margin: "0 0 6px", fontSize: 20, fontWeight: 800 }}>Facturar y exportar a Presea</h2>
        <p style={{ color: C.muted, textAlign: "center", fontSize: 13, margin: "0 0 24px" }}>Se descargará el Excel y el presupuesto quedará marcado como <strong style={{ color: C.green }}>Facturado</strong>.</p>

        <div style={{ background: C.bg, borderRadius: R, padding: "14px 16px", marginBottom: 20, border: `1px solid ${C.border}` }}>
          {[["Presupuesto", quotation.number], ["Cliente", quotation.customer?.name], ["Monto", fmt(total)], ["Comercial", quotation.salesRep?.name]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted, fontSize: 12 }}>{k}</span>
              <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onConfirmar} disabled={loading} style={{ flex: 1, background: C.purple, color: "#fff", border: "none", borderRadius: R, padding: "12px", fontWeight: 800, fontSize: 14, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Facturando..." : "⬇ Descargar Excel y Facturar"}
          </button>
          <button onClick={onClose} style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}`, borderRadius: R, padding: "12px 16px", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Presupuestos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const { data: quotations = [], isLoading, isError, refetch } = useQuotations();
  const exportMutation = useExportToPresea();
  const statusMutation = useChangeQuotationStatus();
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [exportQ, setExportQ] = useState<any | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  // Toast passed from the "Nuevo Presupuesto" page after creating
  useEffect(() => {
    const msg = (location.state as any)?.toast;
    if (msg) {
      showToast(msg);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const filtrados = useMemo(
    () => (quotations as any[]).filter((q) => filtroEstado === "Todos" || q.status === filtroEstado),
    [quotations, filtroEstado]
  );
  const totalFilt = useMemo(
    () => filtrados.reduce((s, q) => s + q.items.reduce((ss: number, i: any) => ss + i.subtotal, 0), 0),
    [filtrados]
  );
  const listos = useMemo(() => (quotations as any[]).filter((q) => q.status === "READY_FOR_INVOICING"), [quotations]);

  const handleExport = async () => {
    if (!exportQ) return;
    try {
      const result = await exportMutation.mutateAsync(exportQ.id);
      setExportQ(null);
      showToast(`✅ ${result.fileName} — facturado`);
    } catch (err: any) {
      showToast(`❌ ${err?.response?.data?.error || "Error al facturar"}`);
      setExportQ(null);
    }
  };

  const handleStatusChange = async (q: any, newStatus: string) => {
    let lossReason: string | undefined;
    if (newStatus === "REJECTED") {
      const reason = window.prompt("Motivo de pérdida (precio, stock, competencia, etc.):");
      if (reason === null) return;
      if (!reason.trim()) { showToast("❌ El motivo es obligatorio"); return; }
      lossReason = reason.trim();
    }
    try {
      await statusMutation.mutateAsync({ id: q.id, status: newStatus, lossReason });
      showToast(`✅ ${q.number} → ${QUOTATION_STATUS_LABEL[newStatus]}`);
    } catch (err: any) {
      showToast(`❌ ${err?.response?.data?.error || "No se pudo cambiar el estado"}`);
    }
  };

  if (isLoading) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Cargando presupuestos...</div>;
  if (isError) return (
    <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
      <div style={{ color: C.text, fontWeight: 700 }}>Error al cargar presupuestos</div>
      <button onClick={() => refetch()} style={{ marginTop: 14, background: C.accent, color: "#fff", border: "none", borderRadius: R, padding: "8px 18px", fontWeight: 700, cursor: "pointer" }}>Reintentar</button>
    </div>
  );

  const filterBtnStyle = (status: string) => ({
    background: filtroEstado === status ? (QUOTATION_STATUS_BG[status] || C.accent) : C.card,
    color: filtroEstado === status ? (QUOTATION_STATUS_COLOR[status] || "#fff") : C.muted,
    border: `1px solid ${filtroEstado === status ? (QUOTATION_STATUS_COLOR[status] || C.accent) : C.border}`,
    borderRadius: R, padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
  });

  return (
    <div>
      {toast && (
        <div role="status" style={{ position: "fixed", bottom: 24, right: 24, background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: R, padding: "12px 20px", fontWeight: 700, fontSize: 13, zIndex: 500, boxShadow: "0 6px 24px rgba(45,62,80,0.16)" }}>
          {toast}
        </div>
      )}
      {exportQ && <ModalExportarPresea quotation={exportQ} onClose={() => setExportQ(null)} onConfirmar={handleExport} loading={exportMutation.isPending} />}

      <SectionHeader
        title="Presupuestos"
        sub={`${filtrados.length} registros · ${fmt(totalFilt)}`}
        action={<button onClick={() => navigate("/presupuestos/nuevo")} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: R, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Nuevo Presupuesto</button>}
      />

      {/* Admin invoicing queue */}
      {isAdmin && listos.length > 0 && (
        <div style={{ background: C.purpleDim, border: `1px solid ${C.purple}44`, borderRadius: R, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ color: C.purple, fontWeight: 700, fontSize: 13 }}>🧾 {listos.length} presupuesto{listos.length > 1 ? "s" : ""} esperando facturación</span>
            <span style={{ color: C.muted, fontSize: 12, marginLeft: 10 }}>{fmt(listos.reduce((s, q) => s + q.items.reduce((ss: number, i: any) => ss + i.subtotal, 0), 0))}</span>
          </div>
          <button onClick={() => setFiltroEstado("READY_FOR_INVOICING")} style={{ background: C.purple, color: "#fff", border: "none", borderRadius: R, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Ver cola</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <button onClick={() => setFiltroEstado("Todos")} style={filterBtnStyle("Todos")}>Todos</button>
        {["READY_FOR_INVOICING", "INVOICED", "APPROVED", "UNDER_REVIEW", "SENT", "DRAFT", "REJECTED"].map((s) => (
          <button key={s} onClick={() => setFiltroEstado(s)} style={filterBtnStyle(s)}>{QUOTATION_STATUS_LABEL[s]}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 130px 90px 110px 150px 180px", gap: 8, padding: "8px 14px", background: C.surface, borderRadius: R, border: `1px solid ${C.border}` }}>
          {["N°", "Cliente", "Comercial", "Fecha", "Monto", "Estado", "Acción"].map((h) => (
            <span key={h} style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</span>
          ))}
        </div>

        {filtrados.length === 0 && (
          <div style={{ textAlign: "center", padding: 50, color: C.muted, background: C.card, borderRadius: R, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div style={{ color: C.text, fontWeight: 700 }}>Sin presupuestos {filtroEstado !== "Todos" ? "en este estado" : ""}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Creá el primero con “+ Nuevo Presupuesto”.</div>
          </div>
        )}

        {filtrados.map((q: any) => {
          const total = q.items.reduce((s: number, i: any) => s + i.subtotal, 0);
          const nexts = NEXT_STATUS[q.status] || [];
          return (
            <div key={q.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr 130px 90px 110px 150px 180px", gap: 8, padding: "12px 14px", background: C.card, borderRadius: R, border: `1px solid ${q.status === "READY_FOR_INVOICING" ? C.purple + "44" : C.border}`, alignItems: "center" }}>
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
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {/* Only ADMIN invoices (export to Presea) */}
                {q.status === "READY_FOR_INVOICING" && isAdmin && (
                  <button onClick={() => setExportQ(q)} style={{ background: C.purple, color: "#fff", border: "none", borderRadius: R, padding: "6px 10px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>⬇ Facturar</button>
                )}
                {q.status === "READY_FOR_INVOICING" && !isAdmin && (
                  <span style={{ color: C.purple, fontSize: 11, fontWeight: 600 }}>Esperando admin.</span>
                )}
                {/* Forward status (everyone, up to READY) */}
                {nexts.filter((s) => s !== "REJECTED").map((s) => (
                  <button key={s} disabled={statusMutation.isPending} onClick={() => handleStatusChange(q, s)} style={{ background: C.accentDim, color: C.accent, border: "none", borderRadius: R, padding: "6px 10px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>▸ {QUOTATION_STATUS_LABEL[s]}</button>
                ))}
                {nexts.includes("REJECTED") && (
                  <button disabled={statusMutation.isPending} onClick={() => handleStatusChange(q, "REJECTED")} title="Marcar como perdido" style={{ background: "transparent", color: C.red, border: `1px solid ${C.border}`, borderRadius: R, padding: "6px 8px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>✕</button>
                )}
                {nexts.length === 0 && q.status !== "READY_FOR_INVOICING" && <span style={{ color: C.dim, fontSize: 11 }}>—</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
