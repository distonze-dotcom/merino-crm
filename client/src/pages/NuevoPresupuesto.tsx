import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "../hooks/useCustomers";
import { useProducts } from "../hooks/useProducts";
import { useCreateQuotation } from "../hooks/useQuotations";
import { useIsMobile } from "../hooks/useIsMobile";
import { SectionHeader } from "../components/design/SectionHeader";
import { C, R, SHADOW, fmt } from "../components/design/tokens";

interface Line { productId: string; code: string; name: string; unit: string; quantity: number; unitPrice: number; }

const LIST_META: Record<string, { label: string; color: string }> = {
  reventa:    { label: "Reventa",    color: C.blue },
  general:    { label: "General",    color: C.purple },
  licitacion: { label: "Licitación", color: C.yellow },
};

export default function NuevoPresupuesto() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const createMutation = useCreateQuotation();

  const [customerId, setCustomerId] = useState("");
  const [custSearch, setCustSearch] = useState("");
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState("");

  const selectedCustomer = (customers as any[]).find((c) => c.id === customerId);
  const listKey: string = selectedCustomer?.priceList || "reventa";
  const listMeta = LIST_META[listKey] || LIST_META.reventa;
  const priceFor = (p: any) => (listKey === "general" ? (p.priceGeneral ?? p.price) : p.price);

  // ─── Customer search (by code or name) ──────────────────────────────────────
  const custResults = useMemo(() => {
    const q = custSearch.trim().toLowerCase();
    if (!q) return [];
    return (customers as any[])
      .filter((c) => c.name.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q)))
      .slice(0, 30);
  }, [custSearch, customers]);

  // ─── Product search ─────────────────────────────────────────────────────────
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    const added = new Set(lines.map((l) => l.productId));
    return (products as any[])
      .filter((p) => !added.has(p.id) && (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)))
      .slice(0, 25);
  }, [search, products, lines]);

  const addProduct = (p: any) => {
    setLines([...lines, { productId: p.id, code: p.code, name: p.name, unit: p.unit, quantity: 1, unitPrice: priceFor(p) }]);
    setSearch("");
  };
  const updateLine = (i: number, patch: Partial<Line>) => setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  // Re-price lines when the customer's list changes
  useEffect(() => {
    setLines((prev) => prev.map((l) => {
      const p = (products as any[]).find((x) => x.id === l.productId);
      return p ? { ...l, unitPrice: listKey === "general" ? (p.priceGeneral ?? p.price) : p.price } : l;
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey]);

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  const handleSave = async () => {
    setError("");
    if (!customerId) { setError("Seleccioná un cliente."); return; }
    const items = lines.filter((l) => l.productId && l.quantity > 0);
    if (items.length === 0) { setError("Agregá al menos un producto."); return; }
    try {
      await createMutation.mutateAsync({
        customerId,
        salesRepId: selectedCustomer?.assignedToId || selectedCustomer?.assignedTo?.id,
        items: items.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })),
      });
      navigate("/presupuestos", { state: { toast: "✅ Presupuesto creado" } });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al crear el presupuesto");
    }
  };

  const inp = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: R, padding: "11px 14px", color: C.text, fontSize: 14, boxSizing: "border-box" as const, outline: "none" };
  const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: R, boxShadow: SHADOW, padding: 20 };
  const stepNum = (n: number, done: boolean) => ({
    width: 22, height: 22, borderRadius: "50%", fontSize: 12, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    background: done ? C.green : C.accent, color: "#fff",
  });

  return (
    <div>
      <SectionHeader
        title="Nuevo Presupuesto"
        sub="Elegí el cliente y agregá productos del catálogo"
        action={<button onClick={() => navigate("/presupuestos")} style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}`, borderRadius: R, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>← Volver</button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 360px", gap: 20, alignItems: "start" }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* STEP 1 — Customer */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={stepNum(1, !!selectedCustomer)}>{selectedCustomer ? "✓" : "1"}</div>
              <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>Cliente</span>
            </div>

            {!selectedCustomer ? (
              <div style={{ position: "relative" }}>
                <input autoFocus value={custSearch} onChange={(e) => setCustSearch(e.target.value)} placeholder="🔍 Buscar cliente por nombre o código..." style={{ ...inp, width: "100%" }} />
                {custResults.length > 0 && (
                  <div style={{ position: "absolute", left: 0, right: 0, top: 50, background: C.surface, border: `1px solid ${C.border}`, borderRadius: R, boxShadow: "0 8px 30px rgba(16,33,58,0.16)", zIndex: 30, maxHeight: 340, overflow: "auto" }}>
                    {custResults.map((c) => {
                      const m = LIST_META[c.priceList] || LIST_META.reventa;
                      return (
                        <div key={c.id} onClick={() => { setCustomerId(c.id); setCustSearch(""); }}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: C.text, fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                            <div style={{ color: C.dim, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {c.code ? <span style={{ fontFamily: "monospace" }}>{c.code}</span> : null}{c.code && c.address ? " · " : ""}{c.address || ""}
                            </div>
                          </div>
                          <span style={{ background: m.color + "1a", color: m.color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", marginLeft: 10 }}>{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {custSearch.trim() && custResults.length === 0 && (
                  <div style={{ color: C.dim, fontSize: 12, marginTop: 8 }}>Sin clientes que coincidan.</div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg, borderRadius: R, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>{selectedCustomer.name}</span>
                    <span style={{ background: listMeta.color + "1a", color: listMeta.color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>Lista {listMeta.label}</span>
                  </div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
                    {selectedCustomer.code ? <span style={{ fontFamily: "monospace" }}>{selectedCustomer.code}</span> : null}
                    {selectedCustomer.code && selectedCustomer.address ? " · " : ""}{selectedCustomer.address || ""}
                  </div>
                </div>
                <button onClick={() => { setCustomerId(""); }} style={{ background: "transparent", color: C.accent, border: `1px solid ${C.border}`, borderRadius: R, padding: "7px 12px", fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>Cambiar</button>
              </div>
            )}
          </div>

          {/* STEP 2 — Products */}
          <div style={{ ...card, position: "relative", opacity: selectedCustomer ? 1 : 0.55, pointerEvents: selectedCustomer ? "auto" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={stepNum(2, lines.length > 0)}>{lines.length > 0 ? "✓" : "2"}</div>
              <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>Productos</span>
              {selectedCustomer && <span style={{ color: C.muted, fontSize: 12, marginLeft: "auto" }}>Precios de lista <strong style={{ color: listMeta.color }}>{listMeta.label}</strong></span>}
            </div>

            <div style={{ position: "relative" }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Buscar producto por nombre o código..." style={{ ...inp, width: "100%" }} />
              {results.length > 0 && (
                <div style={{ position: "absolute", left: 0, right: 0, top: 50, background: C.surface, border: `1px solid ${C.border}`, borderRadius: R, boxShadow: "0 8px 30px rgba(16,33,58,0.16)", zIndex: 20, maxHeight: 320, overflow: "auto" }}>
                  {results.map((p) => (
                    <div key={p.id} onClick={() => addProduct(p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                        <div style={{ color: C.dim, fontSize: 11 }}>{p.code} · {p.unit}{p.description ? ` · ${p.description}` : ""}</div>
                      </div>
                      <span style={{ color: C.green, fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", marginLeft: 12 }}>{fmt(priceFor(p))}</span>
                    </div>
                  ))}
                </div>
              )}
              {search.trim().length >= 2 && results.length === 0 && (
                <div style={{ color: C.dim, fontSize: 12, marginTop: 8 }}>Sin productos que coincidan.</div>
              )}
            </div>

            {/* Lines */}
            <div style={{ marginTop: 16 }}>
              {lines.length === 0 ? (
                <div style={{ color: C.dim, fontSize: 13, padding: "20px 0", textAlign: "center" }}>Buscá un producto arriba para agregarlo.</div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 120px 120px 32px", gap: 8, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
                    {["Producto", "Cant.", "Precio unit.", "Subtotal", ""].map((h) => (
                      <span key={h} style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</span>
                    ))}
                  </div>
                  {lines.map((l, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 120px 120px 32px", gap: 8, alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: C.text, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</div>
                        <div style={{ color: C.dim, fontSize: 10 }}>{l.code} · {l.unit}</div>
                      </div>
                      <input type="number" min={1} value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} style={{ ...inp, padding: "7px 9px", fontSize: 13 }} aria-label="Cantidad" />
                      <input type="number" min={0} value={l.unitPrice} onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })} style={{ ...inp, padding: "7px 9px", fontSize: 13 }} aria-label="Precio unitario" />
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 700, textAlign: "right" }}>{fmt(l.quantity * l.unitPrice)}</span>
                      <button onClick={() => removeLine(i)} aria-label="Quitar" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.red, borderRadius: R, cursor: "pointer", padding: "7px 0" }}>✕</button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: summary */}
        <div style={{ ...card, position: isMobile ? "static" : "sticky", top: 20 }}>
          <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 16px" }}>Resumen</h3>
          {selectedCustomer && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: C.muted, fontSize: 13 }}>Lista</span>
              <span style={{ color: listMeta.color, fontSize: 13, fontWeight: 700 }}>{listMeta.label}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: C.muted, fontSize: 13 }}>Productos</span>
            <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{lines.length}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
            <span style={{ color: C.muted, fontSize: 13 }}>Total</span>
            <span style={{ color: C.text, fontWeight: 800, fontSize: 22 }}>{fmt(total)}</span>
          </div>

          {error && <div style={{ background: C.redDim, border: `1px solid ${C.red}33`, color: C.red, borderRadius: R, padding: "9px 12px", fontSize: 13, margin: "8px 0 14px" }}>{error}</div>}

          <button onClick={handleSave} disabled={createMutation.isPending || !selectedCustomer || lines.length === 0}
            style={{ width: "100%", background: (!selectedCustomer || lines.length === 0) ? C.border : createMutation.isPending ? C.accentDim : C.accent, color: (!selectedCustomer || lines.length === 0) ? C.muted : "#fff", border: "none", borderRadius: R, padding: "13px", fontWeight: 800, fontSize: 14, cursor: (!selectedCustomer || lines.length === 0) ? "not-allowed" : "pointer", marginTop: 8 }}>
            {createMutation.isPending ? "Guardando..." : "Crear presupuesto"}
          </button>
          <div style={{ color: C.dim, fontSize: 11, marginTop: 10, lineHeight: 1.4 }}>Se crea en estado <strong>Borrador</strong>. Desde la lista podés avanzarlo hasta “Listo p/Facturar”.</div>
        </div>
      </div>
    </div>
  );
}
