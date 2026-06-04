import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuotations, useChangeQuotationStatus, useExportToPresea } from "../hooks/useQuotations";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useIsMobile } from "../hooks/useIsMobile";
import { useAuthStore } from "../store/auth.store";
import { SectionHeader } from "../components/design/SectionHeader";
import { Badge } from "../components/design/Badge";
import { Avatar } from "../components/design/Avatar";
import { C, R, SHADOW, fmt, fmtDate, QUOTATION_STATUS_LABEL, QUOTATION_STATUS_COLOR, QUOTATION_STATUS_BG } from "../components/design/tokens";

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
  const isMobile = useIsMobile();

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

  // KPI summary + per-status counts
  const stats = useMemo(() => {
    const all = quotations as any[];
    const sumItems = (q: any) => q.items.reduce((s: number, i: any) => s + i.subtotal, 0);
    const byStatus = (st: string) => all.filter((q) => q.status === st);
    const group = (sts: string[]) => all.filter((q) => sts.includes(q.status));
    const sum = (arr: any[]) => arr.reduce((s, q) => s + sumItems(q), 0);
    const ready = byStatus("READY_FOR_INVOICING");
    const invoiced = byStatus("INVOICED");
    const pending = group(["DRAFT", "SENT", "UNDER_REVIEW"]);
    const approved = byStatus("APPROVED");
    const counts: Record<string, number> = {};
    for (const s of ["READY_FOR_INVOICING", "INVOICED", "APPROVED", "UNDER_REVIEW", "SENT", "DRAFT", "REJECTED"]) {
      counts[s] = byStatus(s).length;
    }
    return {
      counts,
      cards: [
        { label: "Esperando facturación", count: ready.length, amount: sum(ready), color: C.purple },
        { label: "Facturados", count: invoiced.length, amount: sum(invoiced), color: C.green },
        { label: "Pendientes", count: pending.length, amount: sum(pending), color: C.yellow },
        { label: "Aprobados", count: approved.length, amount: sum(approved), color: C.blue },
      ],
    };
  }, [quotations]);

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

      {/* KPI summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {stats.cards.map((c) => (
          <div key={c.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R, boxShadow: SHADOW, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: R, background: c.color + "1a", color: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{c.count}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{c.label}</div>
              <div style={{ color: C.muted, fontSize: 13, fontWeight: 700, marginTop: 2 }}>{fmt(c.amount)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs with counts */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        {[["Todos", null] as [string, string | null], ...(["READY_FOR_INVOICING", "INVOICED", "APPROVED", "UNDER_REVIEW", "SENT", "DRAFT", "REJECTED"].map((s) => [s, s] as [string, string]))].map(([key, st]) => {
          const active = filtroEstado === key;
          const label = st ? QUOTATION_STATUS_LABEL[st] : "Todos";
          const count = st ? stats.counts[st] : (quotations as any[]).length;
          return (
            <button key={key} onClick={() => setFiltroEstado(key)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "10px 14px", fontSize: 13, fontWeight: active ? 700 : 500,
              color: active ? C.accent : C.muted,
              borderBottom: `2px solid ${active ? C.accent : "transparent"}`, marginBottom: -1,
              display: "flex", alignItems: "center", gap: 7,
            }}>
              {label}
              <span style={{ background: active ? C.accent + "1a" : C.bg, color: active ? C.accent : C.muted, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ overflowX: isMobile ? "auto" : "visible" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: isMobile ? 820 : "auto" }}>
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
    </div>
  );
}
