import { useState, useMemo } from "react";
import { useQuotations, useChangeQuotationStatus, useExportToPresea, useCreateQuotation } from "../hooks/useQuotations";
import { useCustomers } from "../hooks/useCustomers";
import { useProducts } from "../hooks/useProducts";
import { useEscapeKey } from "../hooks/useEscapeKey";
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

interface QItem { productId: string; quantity: number; unitPrice: number; }

// ─── MODAL: NUEVO PRESUPUESTO ─────────────────────────────────────────────────
function ModalNuevo({ onClose, onSaved }: { onClose: () => void; onSaved: (msg: string) => void }) {
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const createMutation = useCreateQuotation();
  useEscapeKey(onClose);

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<QItem[]>([]);
  const [error, setError] = useState("");

  const addItem = () => setItems([...items, { productId: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, patch: Partial<QItem>) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const onPickProduct = (i: number, productId: string) => {
    const p = (products as any[]).find((x) => x.id === productId);
    updateItem(i, { productId, unitPrice: p ? p.price : 0 });
  };

  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  const handleSave = async () => {
    setError("");
    if (!customerId) { setError("Seleccioná un cliente."); return; }
    const validItems = items.filter((it) => it.productId && it.quantity > 0);
    if (validItems.length === 0) { setError("Agregá al menos un producto con cantidad."); return; }

    const customer = (customers as any[]).find((c) => c.id === customerId);
    try {
      await createMutation.mutateAsync({
        customerId,
        salesRepId: customer?.assignedToId || customer?.assignedTo?.id,
        items: validItems,
      });
      onSaved("✅ Presupuesto creado");
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al crear el presupuesto");
    }
  };

  const inp = { background: C.card, border: `1px solid ${C.border}`, borderRadius: R, padding: "8px 10px", color: C.text, fontSize: 13, boxSizing: "border-box" as const };

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(45,62,80,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R, padding: 28, width: 640, maxHeight: "88vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ color: C.text, fontSize: 19, margin: "0 0 20px", fontWeight: 800 }}>Nuevo Presupuesto</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5 }}>Cliente</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={{ ...inp, width: "100%" }}>
            <option value="">Seleccionar cliente...</option>
            {(customers as any[]).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7 }}>Productos</label>
          <button onClick={addItem} style={{ background: C.accentDim, color: C.accent, border: "none", borderRadius: R, padding: "5px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ Agregar producto</button>
        </div>

        {items.length === 0 && <div style={{ color: C.dim, fontSize: 13, padding: "12px 0" }}>Sin productos. Agregá al menos uno.</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {items.map((it, i) => {
            const p = (products as any[]).find((x) => x.id === it.productId);
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 100px 90px 32px", gap: 8, alignItems: "center" }}>
                <select value={it.productId} onChange={(e) => onPickProduct(i, e.target.value)} style={inp}>
                  <option value="">Producto...</option>
                  {(products as any[]).map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                </select>
                <input type="number" min={1} value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} style={inp} aria-label="Cantidad" />
                <input type="number" min={0} value={it.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} style={inp} aria-label="Precio unitario" />
                <span style={{ color: C.text, fontSize: 12, fontWeight: 700, textAlign: "right" }}>{fmt(it.quantity * it.unitPrice)}</span>
                <button onClick={() => removeItem(i)} aria-label="Quitar producto" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.red, borderRadius: R, cursor: "pointer", padding: "6px 0" }}>✕</button>
                {p?.unit && <span style={{ gridColumn: "1 / 2", color: C.dim, fontSize: 10, marginTop: -4 }}>{p.unit}{p.description ? ` · ${p.description}` : ""}</span>}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center", marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <span style={{ color: C.muted, fontSize: 13 }}>Total</span>
          <span style={{ color: C.text, fontWeight: 800, fontSize: 18 }}>{fmt(total)}</span>
        </div>

        {error && <div style={{ background: C.redDim, border: `1px solid ${C.red}33`, color: C.red, borderRadius: R, padding: "9px 12px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave} disabled={createMutation.isPending} style={{ flex: 1, background: createMutation.isPending ? C.accentDim : C.accent, color: createMutation.isPending ? C.accent : "#fff", border: "none", borderRadius: R, padding: "11px", fontWeight: 800, fontSize: 14, cursor: createMutation.isPending ? "wait" : "pointer" }}>
            {createMutation.isPending ? "Guardando..." : "Crear presupuesto"}
          </button>
          <button onClick={onClose} style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}`, borderRadius: R, padding: "11px 18px", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL: EXPORTAR A PRESEA ─────────────────────────────────────────────────
function ModalExportarPresea({ quotation, onClose, onConfirmar, loading }: { quotation: any; onClose: () => void; onConfirmar: () => void; loading: boolean }) {
  useEscapeKey(onClose);
  const total = quotation.items.reduce((s: number, i: any) => s + i.subtotal, 0);
  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(45,62,80,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: C.surface, border: `2px solid ${C.purple}`, borderRadius: R, padding: 32, width: 480 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>⬇</div>
        <h2 style={{ color: C.text, textAlign: "center", margin: "0 0 6px", fontSize: 20, fontWeight: 800 }}>Exportar a Presea</h2>
        <p style={{ color: C.muted, textAlign: "center", fontSize: 13, margin: "0 0 24px" }}>Se descargará el Excel y el presupuesto quedará marcado como <strong style={{ color: C.green }}>Facturado</strong>.</p>

        <div style={{ background: C.bg, borderRadius: R, padding: "14px 16px", marginBottom: 20, border: `1px solid ${C.border}` }}>
          {[["Presupuesto", quotation.number], ["Cliente", quotation.customer?.name], ["Monto", fmt(total)], ["Comercial", quotation.salesRep?.name]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted, fontSize: 12 }}>{k}</span>
              <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.greenDim, border: `1px solid ${C.green}33`, borderRadius: R, padding: "10px 14px", marginBottom: 20 }}>
          <p style={{ color: C.green, fontSize: 12, margin: 0 }}>✅ Al confirmar: se descarga el Excel en formato Presea y el presupuesto pasa a <strong>Facturado</strong>.</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onConfirmar} disabled={loading} style={{ flex: 1, background: C.purple, color: "#fff", border: "none", borderRadius: R, padding: "12px", fontWeight: 800, fontSize: 14, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Exportando..." : "⬇ Descargar Excel y Confirmar"}
          </button>
          <button onClick={onClose} style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}`, borderRadius: R, padding: "12px 16px", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Presupuestos() {
  const { data: quotations = [], isLoading, isError, refetch } = useQuotations();
  const exportMutation = useExportToPresea();
  const statusMutation = useChangeQuotationStatus();
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [exportQ, setExportQ] = useState<any | null>(null);
  const [showNuevo, setShowNuevo] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

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
      showToast(`✅ ${result.fileName} exportado`);
    } catch (err: any) {
      showToast(`❌ ${err?.response?.data?.error || "Error al exportar"}`);
      setExportQ(null);
    }
  };

  const handleStatusChange = async (q: any, newStatus: string) => {
    let lossReason: string | undefined;
    if (newStatus === "REJECTED") {
      const reason = window.prompt("Motivo de pérdida (precio, stock, competencia, etc.):");
      if (reason === null) return; // cancelled
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
      {showNuevo && <ModalNuevo onClose={() => setShowNuevo(false)} onSaved={showToast} />}

      <SectionHeader
        title="Presupuestos"
        sub={`${filtrados.length} registros · ${fmt(totalFilt)}`}
        action={<button onClick={() => setShowNuevo(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: R, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Nuevo Presupuesto</button>}
      />

      {listos.length > 0 && (
        <div style={{ background: C.purpleDim, border: `1px solid ${C.purple}44`, borderRadius: R, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ color: C.purple, fontWeight: 700, fontSize: 13 }}>🧾 {listos.length} presupuesto{listos.length > 1 ? "s" : ""} listo{listos.length > 1 ? "s" : ""} para facturar</span>
            <span style={{ color: C.muted, fontSize: 12, marginLeft: 10 }}>{fmt(listos.reduce((s, q) => s + q.items.reduce((ss: number, i: any) => ss + i.subtotal, 0), 0))}</span>
          </div>
          <button onClick={() => setFiltroEstado("READY_FOR_INVOICING")} style={{ background: C.purple, color: "#fff", border: "none", borderRadius: R, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Ver todos</button>
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
                {q.status === "READY_FOR_INVOICING" && (
                  <button onClick={() => setExportQ(q)} style={{ background: C.purple, color: "#fff", border: "none", borderRadius: R, padding: "6px 10px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>⬇ Presea</button>
                )}
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
