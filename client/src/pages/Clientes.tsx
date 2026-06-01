import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useCustomers, useCreateCustomer, useCustomer } from "../hooks/useCustomers";
import { useUsers } from "../hooks/useDashboard";
import { useAuthStore } from "../store/auth.store";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { SectionHeader } from "../components/design/SectionHeader";
import { Badge } from "../components/design/Badge";
import { Avatar } from "../components/design/Avatar";
import { Kpi } from "../components/design/Kpi";
import { C, R, fmt, fmtDate, daysSince, QUOTATION_STATUS_COLOR, QUOTATION_STATUS_BG, QUOTATION_STATUS_LABEL } from "../components/design/tokens";

const SECTORS = ["Empresa constructora", "Pintor profesional", "Comercio", "Decorador", "Obra en construcción", "Particular"];

// ─── MODAL: NUEVO CLIENTE ─────────────────────────────────────────────────────
function ModalNuevoCliente({ onClose, onSaved }: { onClose: () => void; onSaved: (msg: string) => void }) {
  const { user } = useAuthStore();
  const { data: users = [] } = useUsers();
  const createMutation = useCreateCustomer();
  useEscapeKey(onClose);

  const [form, setForm] = useState({
    name: "", sector: SECTORS[0], phone: "", email: "", address: "", notes: "",
    assignedToId: user?.id || "",
  });
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!form.name.trim()) { setError("El nombre es obligatorio."); return; }
    if (!form.assignedToId) { setError("Asigná un comercial."); return; }
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) { setError("Email inválido."); return; }
    try {
      await createMutation.mutateAsync({
        name: form.name.trim(), sector: form.sector,
        phone: form.phone || undefined, email: form.email || undefined,
        address: form.address || undefined, notes: form.notes || undefined,
        assignedToId: form.assignedToId,
      });
      onSaved("✅ Cliente creado");
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al crear el cliente");
    }
  };

  const inp = { width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: R, padding: "8px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" as const };
  const lbl = { display: "block", color: C.muted, fontSize: 11, fontWeight: 700 as const, textTransform: "uppercase" as const, letterSpacing: 0.7, marginBottom: 5 };

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(45,62,80,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R, padding: 28, width: 520, maxHeight: "88vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ color: C.text, fontSize: 19, margin: "0 0 20px", fontWeight: 800 }}>Nuevo Cliente</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label style={lbl}>Nombre *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={lbl}>Rubro</label>
              <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} style={inp}>
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Comercial</label>
              <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })} style={inp} disabled={user?.role !== "ADMIN"}>
                <option value="">Seleccionar...</option>
                {(users as any[]).filter((u) => u.role === "SALES").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={lbl}>Teléfono</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} /></div>
          </div>
          <div><label style={lbl}>Dirección</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inp} /></div>
          <div><label style={lbl}>Notas</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inp, resize: "vertical", minHeight: 56 }} /></div>
        </div>

        {error && <div style={{ background: C.redDim, border: `1px solid ${C.red}33`, color: C.red, borderRadius: R, padding: "9px 12px", fontSize: 13, margin: "14px 0 0" }}>{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={handleSave} disabled={createMutation.isPending} style={{ flex: 1, background: createMutation.isPending ? C.accentDim : C.accent, color: createMutation.isPending ? C.accent : "#fff", border: "none", borderRadius: R, padding: "11px", fontWeight: 800, fontSize: 14, cursor: createMutation.isPending ? "wait" : "pointer" }}>
            {createMutation.isPending ? "Guardando..." : "Crear cliente"}
          </button>
          <button onClick={onClose} style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}`, borderRadius: R, padding: "11px 18px", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── FICHA CLIENTE ────────────────────────────────────────────────────────────
function FichaCliente({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const { data: c, isLoading } = useCustomer(customerId);
  useEscapeKey(onClose);
  if (isLoading || !c) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(45,62,80,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ color: "#fff", fontSize: 14 }}>Cargando ficha...</div>
    </div>
  );

  const facturado = c.quotations.filter((q: any) => q.status === "INVOICED").reduce((s: number, q: any) => s + q.items.reduce((ss: number, i: any) => ss + i.subtotal, 0), 0);
  const perdido = c.quotations.filter((q: any) => q.status === "REJECTED").reduce((s: number, q: any) => s + q.items.reduce((ss: number, i: any) => ss + i.subtotal, 0), 0);
  const conv = c.quotations.length ? Math.round(c.quotations.filter((q: any) => q.status === "INVOICED").length / c.quotations.length * 100) : 0;
  const lastVisit = c.visits[0];
  const lastPurchase = c.quotations.find((q: any) => q.status === "INVOICED");

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(45,62,80,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R, width: 720, maxHeight: "85vh", overflow: "auto", padding: 28 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ color: C.text, fontSize: 20, margin: 0, fontWeight: 800 }}>{c.name}</h2>
            <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
              <Badge label={c.sector} color={C.yellow} bg={C.yellowDim} />
              <Avatar avatar={c.assignedTo.avatar} color={c.assignedTo.color} size={20} />
              <span style={{ color: C.muted, fontSize: 12 }}>{c.assignedTo.name}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, borderRadius: R, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>✕ Cerrar</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 22 }}>
          <Kpi icon="✅" label="Facturado" value={fmt(facturado)} color={C.green} />
          <Kpi icon="❌" label="Perdido" value={fmt(perdido)} color={C.red} />
          <Kpi icon="🎯" label="Conversión" value={`${conv}%`} color={conv >= 50 ? C.green : C.yellow} />
          <Kpi icon="📋" label="Presupuestos" value={c.quotations.length} color={C.blue} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
          {lastPurchase && (
            <div style={{ background: C.bg, borderRadius: R, padding: "12px 14px", border: `1px solid ${C.border}` }}>
              <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Última compra</div>
              <div style={{ color: C.green, fontWeight: 700, fontSize: 15 }}>{fmtDate(lastPurchase.updatedAt)}</div>
            </div>
          )}
          {lastVisit && (
            <div style={{ background: C.bg, borderRadius: R, padding: "12px 14px", border: `1px solid ${C.border}` }}>
              <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Última visita</div>
              <div style={{ color: daysSince(lastVisit.date) > 20 ? C.red : C.green, fontWeight: 700, fontSize: 15 }}>{fmtDate(lastVisit.date)}</div>
              <div style={{ color: C.dim, fontSize: 11 }}>hace {daysSince(lastVisit.date)} días</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px" }}>📋 Historial de Presupuestos</h3>
          {c.quotations.length === 0 && <div style={{ color: C.dim, fontSize: 13 }}>Sin presupuestos</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {c.quotations.map((q: any) => {
              const total = q.items.reduce((s: number, i: any) => s + i.subtotal, 0);
              return (
                <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.bg, borderRadius: R, border: `1px solid ${C.border}` }}>
                  <span style={{ color: C.muted, fontSize: 11, fontFamily: "monospace", minWidth: 60 }}>{q.number}</span>
                  <span style={{ color: C.text, fontSize: 12, flex: 1 }}>{q.items[0]?.product?.name || "—"}{q.items.length > 1 ? ` +${q.items.length - 1}` : ""}</span>
                  <span style={{ color: C.muted, fontSize: 11 }}>{fmtDate(q.issueDate)}</span>
                  <span style={{ color: C.text, fontWeight: 700, fontSize: 13, minWidth: 90, textAlign: "right" }}>{fmt(total)}</span>
                  <Badge label={QUOTATION_STATUS_LABEL[q.status]} color={QUOTATION_STATUS_COLOR[q.status]} bg={QUOTATION_STATUS_BG[q.status]} />
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px" }}>🗺 Historial de Visitas</h3>
          {c.visits.length === 0 && <div style={{ color: C.dim, fontSize: 13 }}>Sin visitas registradas</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {c.visits.map((v: any) => (
              <div key={v.id} style={{ padding: "9px 12px", background: C.bg, borderRadius: R, border: `1px solid ${C.border}`, borderLeft: `3px solid ${v.saleAmount > 0 ? C.green : v.wasReceived ? C.yellow : C.red}` }}>
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

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Clientes() {
  const { data: customers = [], isLoading, isError, refetch } = useCustomers();
  const [searchParams, setSearchParams] = useSearchParams();
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [filtroRubro, setFiltroRubro] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [search, setSearch] = useState("");
  const [showNuevo, setShowNuevo] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  // Auto-open ficha when navigated from Alertas (?cliente=<id>)
  useEffect(() => {
    const cid = searchParams.get("cliente");
    if (cid) {
      setFichaId(cid);
      searchParams.delete("cliente");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const rubros = useMemo(() => ["Todos", ...new Set((customers as any[]).map((c) => c.sector))], [customers]);

  const filtrados = useMemo(() => (customers as any[]).filter((c) => {
    const matchRubro = filtroRubro === "Todos" || c.sector === filtroRubro;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const lastPurchase = c.quotations?.find((q: any) => q.status === "INVOICED");
    const diasC = lastPurchase ? daysSince(lastPurchase.updatedAt) : 999;
    const matchEstado =
      filtroEstado === "Todos" ? true :
      filtroEstado === "Activo" ? diasC <= 30 :
      filtroEstado === "En riesgo" ? diasC > 30 && diasC <= 60 : diasC > 60;
    return matchRubro && matchEstado && matchSearch;
  }), [customers, filtroRubro, filtroEstado, search]);

  if (isLoading) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Cargando clientes...</div>;
  if (isError) return (
    <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
      <div style={{ color: C.text, fontWeight: 700 }}>Error al cargar clientes</div>
      <button onClick={() => refetch()} style={{ marginTop: 14, background: C.accent, color: "#fff", border: "none", borderRadius: R, padding: "8px 18px", fontWeight: 700, cursor: "pointer" }}>Reintentar</button>
    </div>
  );

  const btnStyle = (active: boolean) => ({
    background: active ? C.accent : C.card, color: active ? "#fff" : C.muted,
    border: `1px solid ${active ? C.accent : C.border}`, borderRadius: R,
    padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
  });

  return (
    <div>
      {toast && (
        <div role="status" style={{ position: "fixed", bottom: 24, right: 24, background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: R, padding: "12px 20px", fontWeight: 700, fontSize: 13, zIndex: 500, boxShadow: "0 6px 24px rgba(45,62,80,0.16)" }}>{toast}</div>
      )}
      {fichaId && <FichaCliente customerId={fichaId} onClose={() => setFichaId(null)} />}
      {showNuevo && <ModalNuevoCliente onClose={() => setShowNuevo(false)} onSaved={showToast} />}

      <SectionHeader
        title="Cartera de Clientes"
        sub={`${filtrados.length} clientes`}
        action={<button onClick={() => setShowNuevo(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: R, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Nuevo Cliente</button>}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar cliente..."
          style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: R, padding: "6px 12px", fontSize: 13, minWidth: 220 }}
        />
        {["Todos", "Activo", "En riesgo", "Inactivo"].map((e) => (
          <button key={e} onClick={() => setFiltroEstado(e)} style={btnStyle(filtroEstado === e)}>{e}</button>
        ))}
        <select value={filtroRubro} onChange={(e) => setFiltroRubro(e.target.value)} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: R, padding: "5px 12px", fontSize: 12 }}>
          {rubros.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 110px 80px 80px", gap: 8, padding: "8px 14px", background: C.surface, borderRadius: R, border: `1px solid ${C.border}` }}>
          {["Cliente / Rubro", "Comercial", "Facturado Total", "Estado", ""].map((h) => (
            <span key={h} style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</span>
          ))}
        </div>

        {filtrados.length === 0 && (
          <div style={{ textAlign: "center", padding: 50, color: C.muted, background: C.card, borderRadius: R, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            <div style={{ color: C.text, fontWeight: 700 }}>Sin clientes que coincidan</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Probá otro filtro o creá un cliente nuevo.</div>
          </div>
        )}

        {filtrados.map((c: any) => {
          const lastPurchase = c.quotations?.find((q: any) => q.status === "INVOICED");
          const diasC = lastPurchase ? daysSince(lastPurchase.updatedAt) : 999;
          const estado = diasC <= 30 ? { label: "Activo", color: C.green, bg: C.greenDim }
            : diasC <= 60 ? { label: "En riesgo", color: C.yellow, bg: C.yellowDim }
            : { label: "Inactivo", color: C.red, bg: C.redDim };
          const facturadoTotal = (c.quotations || []).filter((q: any) => q.status === "INVOICED").reduce((s: number, q: any) => s + (q.items || []).reduce((ss: number, i: any) => ss + i.subtotal, 0), 0);

          return (
            <div key={c.id} onClick={() => setFichaId(c.id)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") setFichaId(c.id); }}
              style={{ display: "grid", gridTemplateColumns: "1fr 140px 110px 80px 80px", gap: 8, padding: "12px 14px", background: C.card, borderRadius: R, border: `1px solid ${C.border}`, cursor: "pointer", alignItems: "center" }}>
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
