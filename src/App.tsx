import { useState } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg:          "#0d0d0d",
  surface:     "#161616",
  card:        "#1e1e1e",
  cardHover:   "#242424",
  border:      "#2a2a2a",
  accent:      "#e8541a",
  accentDim:   "#7a2d0e",
  green:       "#22c55e",
  greenDim:    "#052e16",
  red:         "#ef4444",
  redDim:      "#2d0a0a",
  yellow:      "#f59e0b",
  yellowDim:   "#422006",
  blue:        "#3b82f6",
  blueDim:     "#0c1a30",
  purple:      "#a78bfa",
  text:        "#f0ede8",
  muted:       "#7a7570",
  dim:         "#444",
};

const TABS = [
  { id: "alertas",       icon: "🔔", label: "Alertas" },
  { id: "clientes",      icon: "👥", label: "Clientes" },
  { id: "presupuestos",  icon: "📋", label: "Presupuestos" },
  { id: "visitas",       icon: "🗺",  label: "Visitas" },
  { id: "dashboard",     icon: "📊", label: "Análisis" },
];

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const hoy = new Date("2024-01-24");
const diasDesde = (fecha) => Math.floor((hoy - new Date(fecha)) / 86400000);

const comerciales = [
  { id: 1, nombre: "Lucas Pérez",       avatar: "LP", color: "#e8541a" },
  { id: 2, nombre: "Sofía Martínez",    avatar: "SM", color: "#3b82f6" },
  { id: 3, nombre: "Tomás Rodríguez",   avatar: "TR", color: "#22c55e" },
];

const clientes = [
  { id: 1,  nombre: "Construcciones Del Valle",  rubro: "Empresa constructora", comercialId: 1, ultimaCompra: "2024-01-15", ultimaVisita: "2024-01-22", facturadoTotal: 850000 },
  { id: 2,  nombre: "Pinturería El Maestro",      rubro: "Pintor profesional",   comercialId: 2, ultimaCompra: "2024-01-20", ultimaVisita: "2024-01-20", facturadoTotal: 320000 },
  { id: 3,  nombre: "Hotel Palermo",              rubro: "Comercio",             comercialId: 1, ultimaCompra: "2023-12-10", ultimaVisita: "2024-01-21", facturadoTotal: 1200000 },
  { id: 4,  nombre: "Arq. Claudia Vega",          rubro: "Decorador",            comercialId: 3, ultimaCompra: "2024-01-18", ultimaVisita: "2024-01-19", facturadoTotal: 475000 },
  { id: 5,  nombre: "Obra Av. San Martín 4200",   rubro: "Obra en construcción", comercialId: 2, ultimaCompra: "2024-01-22", ultimaVisita: "2024-01-22", facturadoTotal: 680000 },
  { id: 6,  nombre: "Ferretería Central",          rubro: "Comercio",             comercialId: 3, ultimaCompra: "2023-11-05", ultimaVisita: "2023-11-10", facturadoTotal: 190000 },
  { id: 7,  nombre: "Constructora Belgrano",       rubro: "Empresa constructora", comercialId: 1, ultimaCompra: "2023-10-20", ultimaVisita: "2023-12-01", facturadoTotal: 540000 },
  { id: 8,  nombre: "Pintor Jorge Salas",          rubro: "Pintor profesional",   comercialId: 2, ultimaCompra: "2023-12-28", ultimaVisita: "2024-01-05", facturadoTotal: 98000  },
];

const presupuestos = [
  { id: "P-0041", clienteId: 1, comercialId: 1, fecha: "2024-01-22", monto: 280000, estado: "Facturado",  productos: ["Alba Látex 20L x4", "Fijador Universal 4L x2"],   motivoPerdida: null },
  { id: "P-0042", clienteId: 3, comercialId: 1, fecha: "2024-01-21", monto: 95000,  estado: "Perdido",    productos: ["Sinteplast Exterior 10L x3"],                       motivoPerdida: "Precio — fue con otro proveedor" },
  { id: "P-0043", clienteId: 2, comercialId: 2, fecha: "2024-01-20", monto: 140000, estado: "Facturado",  productos: ["Loxon Sellador x5", "Alba Látex 10L x6"],           motivoPerdida: null },
  { id: "P-0044", clienteId: 5, comercialId: 2, fecha: "2024-01-22", monto: 310000, estado: "Pendiente",  productos: ["Revear Frentes 20L x8", "Fijador ext. 4L x4"],      motivoPerdida: null },
  { id: "P-0045", clienteId: 4, comercialId: 3, fecha: "2024-01-19", monto: 76000,  estado: "Perdido",    productos: ["Cetol Lasur 1L x10"],                               motivoPerdida: "Stock — no teníamos el color" },
  { id: "P-0046", clienteId: 6, comercialId: 3, fecha: "2024-01-18", monto: 52000,  estado: "Facturado",  productos: ["Pintura techo 10L x2"],                             motivoPerdida: null },
  { id: "P-0047", clienteId: 1, comercialId: 1, fecha: "2024-01-23", monto: 420000, estado: "Listo p/Facturar", productos: ["Revear Frentes 20L x10","Loxon 4L x5","Sellador x3"], motivoPerdida: null },
  { id: "P-0048", clienteId: 3, comercialId: 1, fecha: "2024-01-17", monto: 180000, estado: "Perdido",    productos: ["Microcemento 5kg x20"],                             motivoPerdida: "No avanzó la obra" },
  { id: "P-0049", clienteId: 8, comercialId: 2, fecha: "2024-01-10", monto: 64000,  estado: "Pendiente",  productos: ["Sinteplast Interior 4L x8"],                        motivoPerdida: null },
  { id: "P-0050", clienteId: 7, comercialId: 1, fecha: "2023-12-15", monto: 230000, estado: "Perdido",    productos: ["Revear 20L x6"],                                    motivoPerdida: "Precio — presupuesto caro" },
];

const visitas = [
  { id: 1, comercialId: 1, clienteId: 1, fecha: "2024-01-22", recibido: true,  resultado: "Presupuesto entregado. Muy interesado.",    proximaVisita: "2024-01-29", venta: 280000 },
  { id: 2, comercialId: 1, clienteId: 3, fecha: "2024-01-21", recibido: true,  resultado: "Espera aprobación del gerente.",            proximaVisita: "2024-01-25", venta: 0 },
  { id: 3, comercialId: 2, clienteId: 2, fecha: "2024-01-20", recibido: true,  resultado: "Pedido realizado en el momento.",           proximaVisita: "2024-02-05", venta: 140000 },
  { id: 4, comercialId: 2, clienteId: 5, fecha: "2024-01-22", recibido: true,  resultado: "Presupuesto en revisión por el arquitecto.", proximaVisita: "2024-01-26", venta: 0 },
  { id: 5, comercialId: 3, clienteId: 6, fecha: "2023-11-10", recibido: false, resultado: "No estaba el encargado. Dejar mensaje.",    proximaVisita: "2024-01-24", venta: 0 },
  { id: 6, comercialId: 3, clienteId: 4, fecha: "2024-01-19", recibido: true,  resultado: "Compró línea Cetol. Volver en 2 semanas.",  proximaVisita: "2024-02-02", venta: 52000 },
  { id: 7, comercialId: 1, clienteId: 7, fecha: "2023-12-01", recibido: true,  resultado: "No tienen obra activa por ahora.",         proximaVisita: "2024-01-24", venta: 0 },
  { id: 8, comercialId: 2, clienteId: 8, fecha: "2024-01-05", recibido: true,  resultado: "Presupuestó pero no cerró.",               proximaVisita: "2024-01-24", venta: 0 },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt     = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) => d.split("-").reverse().join("/");
const getCli  = (id) => clientes.find(c => c.id === id);
const getCom  = (id) => comerciales.find(c => c.id === id);

const ESTADO_COLOR = { "Facturado": C.green, "Pendiente": C.yellow, "Perdido": C.red, "Listo p/Facturar": C.purple };
const ESTADO_BG    = { "Facturado": C.greenDim, "Pendiente": C.yellowDim, "Perdido": C.redDim, "Listo p/Facturar": "#1e1040" };

// Generar alertas automáticas
const generarAlertas = () => {
  const alertas = [];
  clientes.forEach(c => {
    const diasSinCompra  = diasDesde(c.ultimaCompra);
    const diasSinVisita  = diasDesde(c.ultimaVisita);
    const com            = getCom(c.comercialId);
    if (diasSinCompra > 45) {
      alertas.push({ tipo: "sin_compra", urgencia: diasSinCompra > 75 ? "alta" : "media", clienteId: c.id, comercialId: c.comercialId, mensaje: `Sin compras hace ${diasSinCompra} días`, dias: diasSinCompra });
    }
    if (diasSinVisita > 20) {
      alertas.push({ tipo: "sin_visita", urgencia: diasSinVisita > 40 ? "alta" : "media", clienteId: c.id, comercialId: c.comercialId, mensaje: `Sin visita hace ${diasSinVisita} días`, dias: diasSinVisita });
    }
  });
  // Visitas con seguimiento vencido hoy
  visitas.forEach(v => {
    if (diasDesde(v.proximaVisita) >= 0 && v.venta === 0) {
      alertas.push({ tipo: "visita_pendiente", urgencia: "alta", clienteId: v.clienteId, comercialId: v.comercialId, mensaje: `Visita de seguimiento pendiente`, dias: diasDesde(v.proximaVisita) });
    }
  });
  // Presupuestos listos para facturar
  presupuestos.filter(p => p.estado === "Listo p/Facturar").forEach(p => {
    alertas.push({ tipo: "facturar", urgencia: "alta", clienteId: p.clienteId, comercialId: p.comercialId, mensaje: `Presupuesto ${p.id} listo para facturar — ${fmt(p.monto)}`, dias: diasDesde(p.fecha), presId: p.id });
  });
  return alertas;
};

// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────
function Badge({ label, color, bg }) {
  return (
    <span style={{ background: bg || C.card, color: color || C.muted, border: `1px solid ${(color||C.muted)}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700, letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function Ava({ com, size = 32 }) {
  if (!com) return null;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: com.color + "22", border: `2px solid ${com.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 800, color: com.color, flexShrink: 0 }}>
      {com.avatar}
    </div>
  );
}

function Kpi({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color || C.accent }} />
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || C.text, fontFamily: "Georgia, serif", letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
      <div>
        <h2 style={{ color: C.text, fontFamily: "Georgia, serif", fontSize: 22, margin: 0, fontWeight: 700 }}>{title}</h2>
        {sub && <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── ALERTAS ─────────────────────────────────────────────────────────────────
function Alertas({ onExportarPresea }) {
  const alertas = generarAlertas();
  const altas   = alertas.filter(a => a.urgencia === "alta");
  const medias  = alertas.filter(a => a.urgencia === "media");

  const iconTipo = { sin_compra: "💸", sin_visita: "📍", visita_pendiente: "📅", facturar: "🧾" };
  const labelTipo = { sin_compra: "Sin compra", sin_visita: "Sin visita", visita_pendiente: "Seguimiento vencido", facturar: "Listo p/Facturar" };

  const AlertaRow = ({ a }) => {
    const cli = getCli(a.clienteId);
    const com = getCom(a.comercialId);
    const isFacturar = a.tipo === "facturar";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", background: C.card, borderRadius: 10, border: `1px solid ${a.urgencia === "alta" ? C.redDim : C.border}`, borderLeft: `4px solid ${a.urgencia === "alta" ? C.red : C.yellow}` }}>
        <div style={{ fontSize: 22 }}>{iconTipo[a.tipo]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{cli?.nombre}</span>
            <Badge label={labelTipo[a.tipo]} color={a.urgencia === "alta" ? C.red : C.yellow} bg={a.urgencia === "alta" ? C.redDim : C.yellowDim} />
            <Badge label={cli?.rubro} color={C.muted} />
          </div>
          <div style={{ color: C.muted, fontSize: 12 }}>{a.mensaje}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ava com={com} size={28} />
          <span style={{ color: C.muted, fontSize: 12 }}>{com?.nombre.split(" ")[0]}</span>
        </div>
        {isFacturar && (
          <button onClick={() => onExportarPresea(a.presId)} style={{ background: C.purple, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
            ⬇ Exportar a Presea
          </button>
        )}
        {!isFacturar && (
          <button style={{ background: C.surface, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            Ver cliente
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionHeader title="Centro de Alertas" sub={`${alertas.length} alertas activas · ${altas.length} urgentes`} />

      {altas.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, boxShadow: `0 0 8px ${C.red}` }} />
            <span style={{ color: C.red, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Urgentes — Acción inmediata</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {altas.map((a, i) => <AlertaRow key={i} a={a} />)}
          </div>
        </div>
      )}

      {medias.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.yellow }} />
            <span style={{ color: C.yellow, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Para esta semana</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {medias.map((a, i) => <AlertaRow key={i} a={a} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FICHA CLIENTE ────────────────────────────────────────────────────────────
function FichaCliente({ clienteId, onClose }) {
  const cli   = getCli(clienteId);
  const com   = getCom(cli.comercialId);
  const pres  = presupuestos.filter(p => p.clienteId === clienteId);
  const visits= visitas.filter(v => v.clienteId === clienteId).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
  const facturado = pres.filter(p => p.estado === "Facturado").reduce((a,p) => a+p.monto, 0);
  const perdido   = pres.filter(p => p.estado === "Perdido").reduce((a,p) => a+p.monto, 0);
  const conv      = pres.length ? Math.round(pres.filter(p=>p.estado==="Facturado").length/pres.length*100) : 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, width: 720, maxHeight: "85vh", overflow: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ color: C.text, fontFamily: "Georgia, serif", fontSize: 20, margin: 0 }}>{cli.nombre}</h2>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <Badge label={cli.rubro} color={C.yellow} bg={C.yellowDim} />
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Ava com={com} size={20} />
                <span style={{ color: C.muted, fontSize: 12 }}>{com?.nombre}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>✕ Cerrar</button>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 22 }}>
          <Kpi icon="✅" label="Facturado" value={fmt(facturado)} color={C.green} />
          <Kpi icon="❌" label="Perdido" value={fmt(perdido)} color={C.red} />
          <Kpi icon="🎯" label="Conversión" value={`${conv}%`} color={conv>=50?C.green:C.yellow} />
          <Kpi icon="📋" label="Presupuestos" value={pres.length} color={C.blue} />
        </div>

        {/* Última actividad */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
          <div style={{ background: C.card, borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
            <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Última compra</div>
            <div style={{ color: diasDesde(cli.ultimaCompra) > 45 ? C.red : C.green, fontWeight: 700, fontSize: 15 }}>{fmtDate(cli.ultimaCompra)}</div>
            <div style={{ color: C.dim, fontSize: 11 }}>hace {diasDesde(cli.ultimaCompra)} días</div>
          </div>
          <div style={{ background: C.card, borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
            <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Última visita</div>
            <div style={{ color: diasDesde(cli.ultimaVisita) > 20 ? C.red : C.green, fontWeight: 700, fontSize: 15 }}>{fmtDate(cli.ultimaVisita)}</div>
            <div style={{ color: C.dim, fontSize: 11 }}>hace {diasDesde(cli.ultimaVisita)} días</div>
          </div>
        </div>

        {/* Historial presupuestos */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px" }}>📋 Historial de Presupuestos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pres.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                <span style={{ color: C.muted, fontSize: 11, fontFamily: "monospace", minWidth: 60 }}>{p.id}</span>
                <span style={{ color: C.text, fontSize: 12, flex: 1 }}>{p.productos[0]}{p.productos.length>1?` +${p.productos.length-1}`:""}</span>
                <span style={{ color: C.muted, fontSize: 11 }}>{fmtDate(p.fecha)}</span>
                <span style={{ color: C.text, fontWeight: 700, fontSize: 13, minWidth: 90, textAlign: "right" }}>{fmt(p.monto)}</span>
                <Badge label={p.estado} color={ESTADO_COLOR[p.estado]} bg={ESTADO_BG[p.estado]} />
                {p.motivoPerdida && <span style={{ color: C.red, fontSize: 11 }}>⚠ {p.motivoPerdida.split("—")[0]}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Historial visitas */}
        <div>
          <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px" }}>🗺 Historial de Visitas</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {visits.length === 0 && <div style={{ color: C.dim, fontSize: 13 }}>Sin visitas registradas</div>}
            {visits.map(v => (
              <div key={v.id} style={{ padding: "9px 12px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`, borderLeft: `3px solid ${v.venta>0?C.green:v.recibido?C.yellow:C.red}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: C.muted, fontSize: 11 }}>{fmtDate(v.fecha)}</span>
                  {v.venta>0 && <span style={{ color: C.green, fontWeight: 700, fontSize: 12 }}>{fmt(v.venta)}</span>}
                </div>
                <div style={{ color: C.text, fontSize: 12 }}>{v.resultado}</div>
                <div style={{ color: C.blue, fontSize: 11, marginTop: 3 }}>Próx. visita: {fmtDate(v.proximaVisita)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENTES ─────────────────────────────────────────────────────────────────
function Clientes() {
  const [fichaId, setFichaId]       = useState(null);
  const [filtroRubro, setFiltroRubro] = useState("Todos");
  const [filtroCom, setFiltroCom]   = useState(0);
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const rubros = ["Todos", ...new Set(clientes.map(c => c.rubro))];

  const filtrados = clientes.filter(c => {
    const matchRubro = filtroRubro === "Todos" || c.rubro === filtroRubro;
    const matchCom   = !filtroCom || c.comercialId === filtroCom;
    const diasC      = diasDesde(c.ultimaCompra);
    const diasV      = diasDesde(c.ultimaVisita);
    const matchEstado =
      filtroEstado === "Todos"    ? true :
      filtroEstado === "Activo"   ? diasC <= 30 :
      filtroEstado === "En riesgo"? diasC > 30 && diasC <= 60 :
                                    diasC > 60;
    return matchRubro && matchCom && matchEstado;
  });

  return (
    <div>
      {fichaId && <FichaCliente clienteId={fichaId} onClose={() => setFichaId(null)} />}
      <SectionHeader title="Cartera de Clientes" sub={`${filtrados.length} clientes`} action={
        <button style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Nuevo Cliente</button>
      } />

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {["Todos","Activo","En riesgo","Inactivo"].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)} style={{ background: filtroEstado===e ? C.accent : C.card, color: filtroEstado===e ? "#fff" : C.muted, border: `1px solid ${filtroEstado===e?C.accent:C.border}`, borderRadius: 20, padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {e==="Activo"?"🟢":e==="En riesgo"?"🟡":e==="Inactivo"?"🔴":""} {e}
          </button>
        ))}
        <select value={filtroRubro} onChange={e=>setFiltroRubro(e.target.value)} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, marginLeft: 8 }}>
          {rubros.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={filtroCom} onChange={e=>setFiltroCom(Number(e.target.value))} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 12 }}>
          <option value={0}>Todos los comerciales</option>
          {comerciales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Header tabla */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 100px 110px 80px 80px", gap: 8, padding: "8px 14px", background: C.surface, borderRadius: 8 }}>
          {["Cliente / Rubro","Comercial","Últ. Compra","Últ. Visita","Facturado Total","Estado",""].map(h => (
            <span key={h} style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</span>
          ))}
        </div>

        {filtrados.map(c => {
          const com     = getCom(c.comercialId);
          const diasC   = diasDesde(c.ultimaCompra);
          const diasV   = diasDesde(c.ultimaVisita);
          const estado  = diasC <= 30 ? { label: "Activo", color: C.green, bg: C.greenDim } : diasC <= 60 ? { label: "En riesgo", color: C.yellow, bg: C.yellowDim } : { label: "Inactivo", color: C.red, bg: C.redDim };
          return (
            <div key={c.id} onClick={() => setFichaId(c.id)} style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 100px 110px 80px 80px", gap: 8, padding: "12px 14px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, cursor: "pointer", alignItems: "center" }}>
              <div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{c.nombre}</div>
                <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>{c.rubro}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Ava com={com} size={22} />
                <span style={{ color: C.muted, fontSize: 12 }}>{com?.nombre.split(" ")[0]}</span>
              </div>
              <div>
                <div style={{ color: diasC>45?C.red:C.text, fontSize: 12, fontWeight: diasC>45?700:400 }}>{fmtDate(c.ultimaCompra)}</div>
                <div style={{ color: C.dim, fontSize: 10 }}>hace {diasC}d</div>
              </div>
              <div>
                <div style={{ color: diasV>20?C.yellow:C.text, fontSize: 12, fontWeight: diasV>20?700:400 }}>{fmtDate(c.ultimaVisita)}</div>
                <div style={{ color: C.dim, fontSize: 10 }}>hace {diasV}d</div>
              </div>
              <div style={{ color: C.green, fontWeight: 700, fontSize: 13 }}>{fmt(c.facturadoTotal)}</div>
              <Badge label={estado.label} color={estado.color} bg={estado.bg} />
              <span style={{ color: C.muted, fontSize: 12 }}>Ver →</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PRESUPUESTOS ─────────────────────────────────────────────────────────────
function Presupuestos({ onExportarPresea }) {
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroCom, setFiltroCom]       = useState(0);

  const filtrados = presupuestos.filter(p => {
    const matchE = filtroEstado === "Todos" || p.estado === filtroEstado;
    const matchC = !filtroCom || p.comercialId === filtroCom;
    return matchE && matchC;
  });

  const totalFilt = filtrados.reduce((a,p) => a+p.monto, 0);
  const listos    = presupuestos.filter(p => p.estado === "Listo p/Facturar");

  return (
    <div>
      <SectionHeader title="Presupuestos" sub={`${filtrados.length} registros · ${fmt(totalFilt)}`} action={
        <button style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Nuevo Presupuesto</button>
      } />

      {/* Banner listos para facturar */}
      {listos.length > 0 && (
        <div style={{ background: "#1e1040", border: `1px solid ${C.purple}44`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ color: C.purple, fontWeight: 700, fontSize: 13 }}>🧾 {listos.length} presupuesto{listos.length>1?"s":""} listo{listos.length>1?"s":""} para facturar</span>
            <span style={{ color: C.muted, fontSize: 12, marginLeft: 10 }}>{fmt(listos.reduce((a,p)=>a+p.monto,0))}</span>
          </div>
          <button onClick={() => setFiltroEstado("Listo p/Facturar")} style={{ background: C.purple, color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Ver todos</button>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {["Todos","Listo p/Facturar","Facturado","Pendiente","Perdido"].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)} style={{ background: filtroEstado===e?ESTADO_BG[e]||C.accent:C.card, color: filtroEstado===e?ESTADO_COLOR[e]||"#fff":C.muted, border: `1px solid ${filtroEstado===e?ESTADO_COLOR[e]||C.accent:C.border}`, borderRadius: 20, padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {e}
          </button>
        ))}
        <select value={filtroCom} onChange={e=>setFiltroCom(Number(e.target.value))} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, marginLeft: "auto" }}>
          <option value={0}>Todos los comerciales</option>
          {comerciales.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 130px 90px 110px 150px 130px", gap: 8, padding: "8px 14px", background: C.surface, borderRadius: 8 }}>
          {["N°","Cliente","Comercial","Fecha","Monto","Estado","Acción"].map(h=>(
            <span key={h} style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</span>
          ))}
        </div>

        {filtrados.map((p, i) => {
          const cli = getCli(p.clienteId);
          const com = getCom(p.comercialId);
          return (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr 130px 90px 110px 150px 130px", gap: 8, padding: "12px 14px", background: C.card, borderRadius: 8, border: `1px solid ${p.estado==="Listo p/Facturar"?C.purple+"44":C.border}`, alignItems: "center" }}>
              <span style={{ color: C.muted, fontSize: 11, fontFamily: "monospace" }}>{p.id}</span>
              <div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{cli?.nombre}</div>
                <div style={{ color: C.dim, fontSize: 11, marginTop: 1 }}>{p.productos[0]}{p.productos.length>1?` +${p.productos.length-1}`:""}</div>
                {p.motivoPerdida && <div style={{ color: C.red, fontSize: 11, marginTop: 1 }}>⚠ {p.motivoPerdida}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Ava com={com} size={22} />
                <span style={{ color: C.muted, fontSize: 11 }}>{com?.nombre.split(" ")[0]}</span>
              </div>
              <span style={{ color: C.muted, fontSize: 12 }}>{fmtDate(p.fecha)}</span>
              <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{fmt(p.monto)}</span>
              <Badge label={p.estado} color={ESTADO_COLOR[p.estado]} bg={ESTADO_BG[p.estado]} />
              {p.estado === "Listo p/Facturar"
                ? <button onClick={() => onExportarPresea(p.id)} style={{ background: C.purple, color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>⬇ Exportar a Presea</button>
                : <span style={{ color: C.dim, fontSize: 11 }}>—</span>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── VISITAS ──────────────────────────────────────────────────────────────────
function Visitas() {
  const [filtroCom, setFiltroCom] = useState(0);
  const [showForm,  setShowForm]  = useState(false);

  const filtradas = visitas.filter(v => !filtroCom || v.comercialId === filtroCom)
    .sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

  const pendientesHoy = visitas.filter(v => diasDesde(v.proximaVisita) >= 0 && v.venta === 0);

  return (
    <div>
      <SectionHeader title="Registro de Visitas" sub="Planilla de recorridos y seguimiento" action={
        <button onClick={() => setShowForm(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Registrar Visita</button>
      } />

      {/* Modal form simplificado */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowForm(false)}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 480 }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ color: C.text, fontFamily: "Georgia,serif", fontSize: 18, margin: "0 0 20px" }}>Registrar nueva visita</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Cliente", "select-cliente"], ["Fecha", "date"], ["¿El cliente los recibió?", "select-sino"], ["Resultado de la visita", "textarea"], ["Próxima visita", "date"], ["¿Se realizó venta?", "select-sino"]].map(([label, type]) => (
                <div key={label}>
                  <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5 }}>{label}</div>
                  {type === "textarea"
                    ? <textarea style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, resize: "vertical", minHeight: 70, boxSizing: "border-box" }} />
                    : <select style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" }}>
                        {type==="select-cliente" ? clientes.map(c=><option key={c.id}>{c.nombre}</option>) : <><option>Sí</option><option>No</option></>}
                      </select>
                  }
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Guardar visita</button>
              <button onClick={() => setShowForm(false)} style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Alertas de seguimiento */}
      {pendientesHoy.length > 0 && (
        <div style={{ background: C.blueDim, border: `1px solid ${C.blue}44`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <span style={{ color: C.blue, fontWeight: 700, fontSize: 13 }}>📅 {pendientesHoy.length} seguimiento{pendientesHoy.length>1?"s":""} pendiente{pendientesHoy.length>1?"s":""} hoy</span>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {pendientesHoy.map(v => {
              const cli = getCli(v.clienteId);
              return <Badge key={v.id} label={cli?.nombre} color={C.blue} bg={C.blueDim} />;
            })}
          </div>
        </div>
      )}

      {/* Filtro */}
      <div style={{ marginBottom: 14 }}>
        <select value={filtroCom} onChange={e=>setFiltroCom(Number(e.target.value))} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
          <option value={0}>Todos los comerciales</option>
          {comerciales.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtradas.map(v => {
          const cli = getCli(v.clienteId);
          const com = getCom(v.comercialId);
          const vencida = diasDesde(v.proximaVisita) > 0;
          return (
            <div key={v.id} style={{ background: C.card, border: `1px solid ${vencida&&v.venta===0?C.redDim:C.border}`, borderLeft: `4px solid ${v.venta>0?C.green:v.recibido?C.yellow:C.red}`, borderRadius: 10, padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 160px 1fr 130px", alignItems: "center", gap: 14 }}>
              <div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{cli?.nombre}</div>
                <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>{cli?.rubro}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                  <Badge label={fmtDate(v.fecha)} color={C.muted} />
                  <Badge label={v.recibido?"Recibido ✓":"No recibido"} color={v.recibido?C.green:C.red} bg={v.recibido?C.greenDim:C.redDim} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Ava com={com} size={26} />
                <span style={{ color: C.muted, fontSize: 12 }}>{com?.nombre}</span>
              </div>
              <div>
                <div style={{ color: C.text, fontSize: 13 }}>{v.resultado}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {v.venta > 0
                  ? <div style={{ color: C.green, fontWeight: 800, fontSize: 15 }}>{fmt(v.venta)}</div>
                  : <div style={{ color: C.dim, fontSize: 12 }}>Sin venta</div>
                }
                <div style={{ color: vencida&&v.venta===0?C.red:C.blue, fontSize: 11, marginTop: 4 }}>
                  {vencida&&v.venta===0?"⚠ ":"📅 "}Próx: {fmtDate(v.proximaVisita)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DASHBOARD / ANÁLISIS ─────────────────────────────────────────────────────
function Dashboard() {
  const totalPres   = presupuestos.reduce((a,p)=>a+p.monto,0);
  const totalFact   = presupuestos.filter(p=>p.estado==="Facturado").reduce((a,p)=>a+p.monto,0);
  const totalPerd   = presupuestos.filter(p=>p.estado==="Perdido").reduce((a,p)=>a+p.monto,0);
  const conv        = Math.round(presupuestos.filter(p=>p.estado==="Facturado").length/presupuestos.length*100);

  const motivosPerd = {};
  presupuestos.filter(p=>p.estado==="Perdido"&&p.motivoPerdida).forEach(p=>{
    const k = p.motivoPerdida.split("—")[0].trim();
    motivosPerd[k]=(motivosPerd[k]||0)+p.monto;
  });

  const rubroStats = {};
  clientes.forEach(c=>{
    const pCli = presupuestos.filter(p=>p.clienteId===c.id&&p.estado==="Facturado").reduce((a,p)=>a+p.monto,0);
    rubroStats[c.rubro]=(rubroStats[c.rubro]||0)+pCli;
  });

  const rendCom = comerciales.map(c=>{
    const pres = presupuestos.filter(p=>p.comercialId===c.id);
    const fact = pres.filter(p=>p.estado==="Facturado");
    return { ...c, pres: pres.length, fact: fact.length, monto: fact.reduce((a,p)=>a+p.monto,0), conv: pres.length?Math.round(fact.length/pres.length*100):0 };
  }).sort((a,b)=>b.monto-a.monto);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Análisis Comercial" sub="Enero 2024 · Todos los comerciales" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <Kpi icon="📋" label="Presupuestado" value={fmt(totalPres)} color={C.blue} />
        <Kpi icon="✅" label="Facturado" value={fmt(totalFact)} color={C.green} sub={`${presupuestos.filter(p=>p.estado==="Facturado").length} presupuestos`} />
        <Kpi icon="❌" label="Perdido" value={fmt(totalPerd)} color={C.red} sub={`${presupuestos.filter(p=>p.estado==="Perdido").length} oportunidades`} />
        <Kpi icon="🎯" label="Conversión" value={`${conv}%`} color={conv>=50?C.green:C.yellow} sub="pres. → factura" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Rendimiento comerciales */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 16px" }}>🏆 Ranking Comerciales</h3>
          {rendCom.map((c,i) => (
            <div key={c.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                <span style={{ color: i===0?C.yellow:C.dim, fontSize: 16 }}>{i===0?"🥇":i===1?"🥈":"🥉"}</span>
                <Ava com={c} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{c.nombre}</span>
                    <span style={{ color: C.green, fontSize: 13, fontWeight: 700 }}>{fmt(c.monto)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span style={{ color: C.muted, fontSize: 11 }}>{c.pres} pres. · {c.fact} fact.</span>
                    <span style={{ color: c.conv>=50?C.green:C.yellow, fontSize: 11, fontWeight: 700 }}>{c.conv}% conv.</span>
                  </div>
                </div>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                <div style={{ width: `${(c.monto/rendCom[0].monto)*100}%`, height: "100%", background: c.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Motivos pérdida */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 14px" }}>🔍 Por qué se pierden ventas</h3>
            {Object.entries(motivosPerd).map(([k,v])=>(
              <div key={k} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: C.text, fontSize: 12 }}>{k}</span>
                  <span style={{ color: C.red, fontWeight: 700, fontSize: 12 }}>{fmt(v)}</span>
                </div>
                <div style={{ height: 5, background: C.border, borderRadius: 2 }}>
                  <div style={{ width: `${(v/totalPerd)*100}%`, height: "100%", background: C.red, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Por rubro */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 14px" }}>🏗 Facturado por Rubro</h3>
            {Object.entries(rubroStats).sort((a,b)=>b[1]-a[1]).map(([rubro,monto])=>(
              <div key={rubro} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: C.text, fontSize: 12 }}>{rubro}</span>
                  <span style={{ color: C.green, fontWeight: 700, fontSize: 12 }}>{fmt(monto)}</span>
                </div>
                <div style={{ height: 5, background: C.border, borderRadius: 2 }}>
                  <div style={{ width: `${(monto/Math.max(...Object.values(rubroStats)))*100}%`, height: "100%", background: C.green, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL EXPORTAR A PRESEA ──────────────────────────────────────────────────
function ModalExportarPresea({ presId, onClose, onConfirmar }) {
  const p   = presupuestos.find(x=>x.id===presId);
  const cli = getCli(p?.clienteId);
  const com = getCom(p?.comercialId);
  if (!p) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `2px solid ${C.purple}`, borderRadius: 16, padding: 32, width: 480 }}>
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>⬇</div>
        <h2 style={{ color: C.text, fontFamily: "Georgia,serif", textAlign: "center", margin: "0 0 6px", fontSize: 20 }}>Exportar a Presea</h2>
        <p style={{ color: C.muted, textAlign: "center", fontSize: 13, margin: "0 0 24px" }}>Se descargará el Excel y el presupuesto quedará marcado como <strong style={{color:C.green}}>Facturado</strong> automáticamente.</p>

        <div style={{ background: C.card, borderRadius: 10, padding: "14px 16px", marginBottom: 20, border: `1px solid ${C.border}` }}>
          {[["Presupuesto", p.id],["Cliente", cli?.nombre],["Monto", fmt(p.monto)],["Comercial", com?.nombre],["Productos", p.productos.join(", ")]].map(([k,v])=>(
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted, fontSize: 12 }}>{k}</span>
              <span style={{ color: C.text, fontSize: 12, fontWeight: 600, maxWidth: 260, textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "#0a2010", border: `1px solid ${C.green}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
          <p style={{ color: C.green, fontSize: 12, margin: 0 }}>✅ Al confirmar: se descarga el Excel en formato Presea y el presupuesto pasa automáticamente a <strong>Facturado</strong>. No es necesario ningún paso adicional en este portal.</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onConfirmar(presId)} style={{ flex: 1, background: C.purple, color: "#fff", border: "none", borderRadius: 9, padding: "12px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            ⬇ Descargar Excel y Confirmar
          </button>
          <button onClick={onClose} style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 9, padding: "12px 16px", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,            setTab]           = useState("alertas");
  const [exportPresId,   setExportPresId]  = useState(null);
  const [exportados,     setExportados]    = useState([]);
  const [toastMsg,       setToastMsg]      = useState(null);

  const alertas      = generarAlertas();
  const alertasCount = alertas.length;
  const listosCount  = presupuestos.filter(p=>p.estado==="Listo p/Facturar" && !exportados.includes(p.id)).length;

  const handleConfirmarExport = (presId) => {
    setExportados(prev=>[...prev, presId]);
    setExportPresId(null);
    setToastMsg(`✅ ${presId} exportado y marcado como Facturado`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Toast */}
      {toastMsg && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: C.greenDim, border: `1px solid ${C.green}`, color: C.green, borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 13, zIndex: 500, boxShadow: "0 4px 24px #0008" }}>
          {toastMsg}
        </div>
      )}

      {/* Modal exportar */}
      {exportPresId && (
        <ModalExportarPresea presId={exportPresId} onClose={() => setExportPresId(null)} onConfirmar={handleConfirmarExport} />
      )}

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 28px", display: "flex", alignItems: "center", gap: 32, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 0", minWidth: 180 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${C.accent},#ff7043)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎨</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.text, letterSpacing: -0.3 }}>Andres Merino</div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.9 }}>Pinturerias · CRM</div>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 0, flex: 1 }}>
          {TABS.map(t => {
            const badge = t.id==="alertas"&&alertasCount>0 ? alertasCount : t.id==="presupuestos"&&listosCount>0 ? listosCount : null;
            return (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ background: "transparent", color: tab===t.id?C.accent:C.muted, border: "none", cursor: "pointer", padding: "17px 18px", fontSize: 13, fontWeight: 600, borderBottom: `2px solid ${tab===t.id?C.accent:"transparent"}`, position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
                <span>{t.icon}</span> {t.label}
                {badge && <span style={{ background: C.red, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 800, minWidth: 16, textAlign: "center" }}>{badge}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, boxShadow: `0 0 7px ${C.green}` }} />
          <span style={{ color: C.muted, fontSize: 12 }}>Ene 2024</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 22px" }}>
        {tab === "alertas"      && <Alertas      onExportarPresea={setExportPresId} />}
        {tab === "clientes"     && <Clientes />}
        {tab === "presupuestos" && <Presupuestos onExportarPresea={setExportPresId} />}
        {tab === "visitas"      && <Visitas />}
        {tab === "dashboard"    && <Dashboard />}
      </div>
    </div>
  );
}
