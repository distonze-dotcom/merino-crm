import { useDashboard } from "../hooks/useDashboard";
import { useIsMobile } from "../hooks/useIsMobile";
import { SectionHeader } from "../components/design/SectionHeader";
import { Kpi } from "../components/design/Kpi";
import { Avatar } from "../components/design/Avatar";
import { C, fmt } from "../components/design/tokens";

export default function Dashboard() {
  const { data, isLoading } = useDashboard();
  const isMobile = useIsMobile();

  if (isLoading || !data) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Cargando análisis...</div>;

  const { kpis, lossReasons, repStats, sectorStats } = data;
  const maxMonto = repStats[0]?.monto || 1;
  const totalLoss = lossReasons.reduce((s: number, x: any) => s + x.amount, 0) || 1;
  const maxSector = sectorStats[0]?.amount || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Análisis Comercial" sub="Todos los comerciales" />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12 }}>
        <Kpi icon="📋" label="Presupuestado" value={fmt(kpis.totalPresupuestado)} color={C.blue} />
        <Kpi icon="✅" label="Facturado" value={fmt(kpis.totalFacturado)} color={C.green} />
        <Kpi icon="❌" label="Perdido" value={fmt(kpis.totalPerdido)} color={C.red} />
        <Kpi icon="🎯" label="Conversión" value={`${kpis.conversion}%`} color={kpis.conversion >= 50 ? C.green : C.yellow} sub="pres. → factura" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        {/* Ranking comerciales */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 16px" }}>🏆 Ranking Comerciales</h3>
          {repStats.map((rep: any, i: number) => (
            <div key={rep.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                <span style={{ fontSize: 16 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <Avatar avatar={rep.avatar} color={rep.color} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{rep.name}</span>
                    <span style={{ color: C.green, fontSize: 13, fontWeight: 700 }}>{fmt(rep.monto)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span style={{ color: C.muted, fontSize: 11 }}>{rep.presupuestos} pres. · {rep.facturados} fact.</span>
                    <span style={{ color: rep.conversion >= 50 ? C.green : C.yellow, fontSize: 11, fontWeight: 700 }}>{rep.conversion}% conv.</span>
                  </div>
                </div>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 8 }}>
                <div style={{ width: `${(rep.monto / maxMonto) * 100}%`, height: "100%", background: rep.color, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Motivos pérdida */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 14px" }}>🔍 Por qué se pierden ventas</h3>
            {lossReasons.length === 0 && <div style={{ color: C.dim, fontSize: 13 }}>Sin datos</div>}
            {lossReasons.map((lr: any) => {
              return (
                <div key={lr.reason} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ color: C.text, fontSize: 12 }}>{lr.reason}</span>
                    <span style={{ color: C.red, fontWeight: 700, fontSize: 12 }}>{fmt(lr.amount)}</span>
                  </div>
                  <div style={{ height: 5, background: C.border, borderRadius: 8 }}>
                    <div style={{ width: `${(lr.amount / totalLoss) * 100}%`, height: "100%", background: C.red, borderRadius: 8 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Por rubro */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 14px" }}>🏗 Facturado por Rubro</h3>
            {sectorStats.length === 0 && <div style={{ color: C.dim, fontSize: 13 }}>Sin datos</div>}
            {sectorStats.map((ss: any) => {
              return (
                <div key={ss.sector} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ color: C.text, fontSize: 12 }}>{ss.sector}</span>
                    <span style={{ color: C.green, fontWeight: 700, fontSize: 12 }}>{fmt(ss.amount)}</span>
                  </div>
                  <div style={{ height: 5, background: C.border, borderRadius: 8 }}>
                    <div style={{ width: `${(ss.amount / maxSector) * 100}%`, height: "100%", background: C.green, borderRadius: 8 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
