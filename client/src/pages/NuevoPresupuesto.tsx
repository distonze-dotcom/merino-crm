import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "../hooks/useCustomers";
import { useProducts } from "../hooks/useProducts";
import { useCreateQuotation } from "../hooks/useQuotations";
import { useIsMobile } from "../hooks/useIsMobile";
import { SectionHeader } from "../components/design/SectionHeader";
import { C, R, fmt } from "../components/design/tokens";

interface Line { productId: string; code: string; name: string; unit: string; quantity: number; unitPrice: number; }

export default function NuevoPresupuesto() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const createMutation = useCreateQuotation();

  const [customerId, setCustomerId] = useState("");
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState("");

  // Search the product catalog (limited to 25 results for performance)
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    const added = new Set(lines.map((l) => l.productId));
    return (products as any[])
      .filter((p) => !added.has(p.id) && (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)))
      .slice(0, 25);
  }, [search, products, lines]);

  const selectedCustomer = (customers as any[]).find((c) => c.id === customerId);
  const priceList: "reventa" | "general" = selectedCustomer?.priceList === "general" ? "general" : "reventa";
  // Price for a product according to the selected customer's list
  const priceFor = (p: any) => (priceList === "general" ? (p.priceGeneral ?? p.price) : p.price);

  const addProduct = (p: any) => {
    setLines([...lines, { productId: p.id, code: p.code, name: p.name, unit: p.unit, quantity: 1, unitPrice: priceFor(p) }]);
    setSearch("");
  };
  const updateLine = (i: number, patch: Partial<Line>) => setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  // Re-price all lines when the selected customer's price list changes
  useEffect(() => {
    setLines((prev) => prev.map((l) => {
      const p = (products as any[]).find((x) => x.id === l.productId);
      return p ? { ...l, unitPrice: priceList === "general" ? (p.priceGeneral ?? p.price) : p.price } : l;
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceList]);

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  const handleSave = async () => {
    setError("");
    if (!customerId) { setError("Seleccioná un cliente."); return; }
    const items = lines.filter((l) => l.productId && l.quantity > 0);
    if (items.length === 0) { setError("Agregá al menos un producto."); return; }
    const customer = (customers as any[]).find((c) => c.id === customerId);
    try {
      await createMutation.mutateAsync({
        customerId,
        salesRepId: customer?.assignedToId || customer?.assignedTo?.id,
        items: items.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })),
      });
      navigate("/presupuestos", { state: { toast: "✅ Presupuesto creado" } });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al crear el presupuesto");
    }
  };

  const inp = { background: C.card, border: `1px solid ${C.border}`, borderRadius: R, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" as const };
  const lbl = { display: "block", color: C.muted, fontSize: 11, fontWeight: 700 as const, textTransform: "uppercase" as const, letterSpacing: 0.7, marginBottom: 6 };

  return (
    <div>
      <SectionHeader
        title="Nuevo Presupuesto"
        sub="Seleccioná el cliente y agregá productos del catálogo"
        action={<button onClick={() => navigate("/presupuestos")} style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}`, borderRadius: R, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>← Volver</button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 360px", gap: 20, alignItems: "start" }}>
        {/* LEFT: builder */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Customer */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R, padding: 18 }}>
            <label style={lbl}>Cliente</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={{ ...inp, width: "100%" }}>
              <option value="">Seleccionar cliente...</option>
              {(customers as any[]).map((c) => <option key={c.id} value={c.id}>{c.name} — {c.sector}</option>)}
            </select>
          </div>

          {/* Product search */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R, padding: 18, position: "relative" }}>
            <label style={lbl}>Agregar productos</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Buscar por nombre o código..." style={{ ...inp, width: "100%" }} />
            {results.length > 0 && (
              <div style={{ position: "absolute", left: 18, right: 18, top: 78, background: C.surface, border: `1px solid ${C.border}`, borderRadius: R, boxShadow: "0 6px 24px rgba(45,62,80,0.16)", zIndex: 20, maxHeight: 320, overflow: "auto" }}>
                {results.map((p) => (
                  <div key={p.id} onClick={() => addProduct(p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <div>
                      <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ color: C.dim, fontSize: 11 }}>{p.code} · {p.unit}{p.description ? ` · ${p.description}` : ""}</div>
                    </div>
                    <span style={{ color: C.green, fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", marginLeft: 12 }}>{fmt(p.price)}</span>
                  </div>
                ))}
              </div>
            )}
            {search.trim().length >= 2 && results.length === 0 && (
              <div style={{ color: C.dim, fontSize: 12, marginTop: 8 }}>Sin productos que coincidan.</div>
            )}
          </div>

          {/* Lines */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R, padding: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px 110px 32px", gap: 8, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
              {["Producto", "Cant.", "Precio unit.", "Subtotal", ""].map((h) => (
                <span key={h} style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</span>
              ))}
            </div>
            {lines.length === 0 && <div style={{ color: C.dim, fontSize: 13, padding: "16px 0", textAlign: "center" }}>Buscá y agregá productos arriba.</div>}
            {lines.map((l, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px 110px 32px", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ color: C.text, fontSize: 12.5, fontWeight: 600 }}>{l.name}</div>
                  <div style={{ color: C.dim, fontSize: 10 }}>{l.code} · {l.unit}</div>
                </div>
                <input type="number" min={1} value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} style={{ ...inp, padding: "6px 8px" }} aria-label="Cantidad" />
                <input type="number" min={0} value={l.unitPrice} onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })} style={{ ...inp, padding: "6px 8px" }} aria-label="Precio unitario" />
                <span style={{ color: C.text, fontSize: 13, fontWeight: 700, textAlign: "right" }}>{fmt(l.quantity * l.unitPrice)}</span>
                <button onClick={() => removeLine(i)} aria-label="Quitar" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.red, borderRadius: R, cursor: "pointer", padding: "6px 0" }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: summary */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R, padding: 20, position: isMobile ? "static" : "sticky", top: 20 }}>
          <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 16px" }}>Resumen</h3>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: C.muted, fontSize: 13 }}>Productos</span>
            <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{lines.length}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
            <span style={{ color: C.muted, fontSize: 13 }}>Total</span>
            <span style={{ color: C.text, fontWeight: 800, fontSize: 22 }}>{fmt(total)}</span>
          </div>

          {error && <div style={{ background: C.redDim, border: `1px solid ${C.red}33`, color: C.red, borderRadius: R, padding: "9px 12px", fontSize: 13, margin: "8px 0 14px" }}>{error}</div>}

          <button onClick={handleSave} disabled={createMutation.isPending} style={{ width: "100%", background: createMutation.isPending ? C.accentDim : C.accent, color: createMutation.isPending ? C.accent : "#fff", border: "none", borderRadius: R, padding: "12px", fontWeight: 800, fontSize: 14, cursor: createMutation.isPending ? "wait" : "pointer", marginTop: 8 }}>
            {createMutation.isPending ? "Guardando..." : "Crear presupuesto"}
          </button>
          <div style={{ color: C.dim, fontSize: 11, marginTop: 10, lineHeight: 1.4 }}>El presupuesto se crea en estado <strong>Borrador</strong>. Desde la lista podés avanzarlo hasta “Listo p/Facturar”.</div>
        </div>
      </div>
    </div>
  );
}
