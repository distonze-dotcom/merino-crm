import { useDashboard } from "../hooks/useDashboard";
import { useIsMobile } from "../hooks/useIsMobile";
import { Avatar } from "../components/design/Avatar";
import { C, R, SHADOW, fmt, QUOTATION_STATUS_LABEL, QUOTATION_STATUS_COLOR } from "../components/design/tokens";

// ─── Reusable card (template for all pages) ──────────────────────────────────
function Card({ title, icon, children, style }: { title?: string; icon?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R, boxShadow: SHADOW, padding: 22, ...style }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
          <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, margin: 0 }}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R, boxShadow: SHADOW, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
      </div>
      <div style={{ color: C.text, fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ color: C.muted, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ color: C.dim, fontSize: 11.5, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Bar({ label, amount, max, color, sub }: { label: string; amount: number; max: number; color: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <span style={{ color: C.text, fontSize: 12.5 }}>{label}{sub && <span style={{ color: C.dim, marginLeft: 6 }}>{sub}</span>}</span>
        <span style={{ color: C.text, fontWeight: 700, fontSize: 12.5 }}>{fmt(amount)}</span>
      </div>
      <div style={{ height: 8, background: C.bg, borderRadius: 20, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(2, (amount / max) * 100)}%`, height: "100%", background: color, borderRadius: 20, transition: "width .3s" }} />
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div style={{ color: C.dim, fontSize: 13, padding: "24px 0", textAlign: "center" }}>{msg}</div>;
}

export default function Dashboard() {
  const { data, isLoading } = useDashboard();
  const isMobile = useIsMobile();

  if (isLoading || !data) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Cargando análisis...</div>;

  const { kpis, statusBreakdown, lossReasons, repStats, sectorStats } = data as any;
  const maxMonto = repStats[0]?.monto || 1;
  const totalLoss = lossReasons.reduce((s: number, x: any) => s + x.amount, 0) || 1;
  const maxSector = sectorStats[0]?.amount || 1;
  const maxStatus = Math.max(1, ...statusBreakdown.map((s: any) => s.amount));
  const hasData = kpis.totalQuotations > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Análisis Comercial</h2>
        <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>Resumen de desempeño · {kpis.totalClientes} clientes · {kpis.totalQuotations} presupuestos</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 14 }}>
        <StatCard icon="📋" label="Presupuestado" value={fmt(kpis.totalPresupuestado)} sub={`${kpis.totalQuotations} presupuestos`} color={C.blue} />
        <StatCard icon="✅" label="Facturado" value={fmt(kpis.totalFacturado)} sub={kpis.avgTicket ? `Ticket prom. ${fmt(kpis.avgTicket)}` : "—"} color={C.green} />
        <StatCard icon="❌" label="Perdido" value={fmt(kpis.totalPerdido)} sub={`Win rate ${kpis.winRate}%`} color={C.red} />
        <StatCard icon="🎯" label="Conversión" value={`${kpis.conversion}%`} sub="presupuesto → factura" color={kpis.conversion >= 50 ? C.green : C.yellow} />
      </div>

      {!hasData && (
        <Card>
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>Todavía no hay datos para analizar</div>
            <div style={{ color: C.muted, fontSize: 13, marginTop: 6, maxWidth: 420, margin: "6px auto 0" }}>
              Las métricas se van a poblar automáticamente a medida que crees presupuestos, los avances de estado y los factures.
            </div>
          </div>
        </Card>
      )}

      {hasData && (
        <>
          {/* Status breakdown */}
          <Card title="Presupuestos por estado" icon="🗂">
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : `repeat(${Math.min(statusBreakdown.length, 7)}, 1fr)`, gap: 10 }}>
              {statusBreakdown.map((s: any) => (
                <div key={s.status} style={{ background: C.bg, borderRadius: R, padding: "12px 14px", borderTop: `3px solid ${QUOTATION_STATUS_COLOR[s.status]}` }}>
                  <div style={{ color: C.text, fontSize: 20, fontWeight: 800 }}>{s.count}</div>
                  <div style={{ color: C.muted, fontSize: 11, fontWeight: 600 }}>{QUOTATION_STATUS_LABEL[s.status]}</div>
                  <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>{fmt(s.amount)}</div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {/* Ranking */}
            <Card title="Ranking de comerciales" icon="🏆">
              {repStats.length === 0 && <Empty msg="Sin comerciales con actividad" />}
              {repStats.map((rep: any, i: number) => (
                <div key={rep.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, width: 20 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                    <Avatar avatar={rep.avatar} color={rep.color} size={28} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{rep.name}</span>
                        <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{fmt(rep.monto)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                        <span style={{ color: C.muted, fontSize: 11 }}>{rep.presupuestos} pres. · {rep.facturados} fact.</span>
                        <span style={{ color: rep.conversion >= 50 ? C.green : C.yellow, fontSize: 11, fontWeight: 700 }}>{rep.conversion}% conv.</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 6, background: C.bg, borderRadius: 20 }}>
                    <div style={{ width: `${Math.max(2, (rep.monto / maxMonto) * 100)}%`, height: "100%", background: rep.color, borderRadius: 20 }} />
                  </div>
                </div>
              ))}
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card title="Por qué se pierden ventas" icon="🔍">
                {lossReasons.length === 0 && <Empty msg="Sin pérdidas registradas" />}
                {lossReasons.map((lr: any) => (
                  <Bar key={lr.reason} label={lr.reason} amount={lr.amount} max={totalLoss} color={C.red} />
                ))}
              </Card>

              <Card title="Facturado por rubro" icon="🏗">
                {sectorStats.length === 0 && <Empty msg="Sin facturación por rubro" />}
                {sectorStats.map((ss: any) => (
                  <Bar key={ss.sector} label={ss.sector} amount={ss.amount} max={maxSector} color={C.green} />
                ))}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
