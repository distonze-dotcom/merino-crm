import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAlerts } from "../api/alerts";
import { SectionHeader } from "../components/design/SectionHeader";
import { Badge } from "../components/design/Badge";
import { Avatar } from "../components/design/Avatar";
import { C, fmt } from "../components/design/tokens";
import { useExportToPresea } from "../hooks/useQuotations";

export default function Alertas() {
  const { data: alerts = [], isLoading } = useQuery({ queryKey: ["alerts"], queryFn: getAlerts });
  const exportMutation = useExportToPresea();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleExport = async (quotationId: string) => {
    try {
      const result = await exportMutation.mutateAsync(quotationId);
      showToast(`✅ ${result.fileName} descargado y marcado como Facturado`);
    } catch (err: any) {
      showToast(`❌ Error: ${err?.response?.data?.error || "Error al exportar"}`);
    }
  };

  if (isLoading) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Cargando alertas...</div>;

  const altas = alerts.filter((a: any) => a.urgency === "alta");
  const medias = alerts.filter((a: any) => a.urgency === "media");

  const iconTipo: Record<string, string> = {
    sin_compra: "💸",
    sin_visita: "📍",
    seguimiento_vencido: "📅",
    listo_facturar: "🧾",
  };
  const labelTipo: Record<string, string> = {
    sin_compra: "Sin compra",
    sin_visita: "Sin visita",
    seguimiento_vencido: "Seguimiento vencido",
    listo_facturar: "Listo p/Facturar",
  };

  const AlertRow = ({ a }: { a: any }) => {
    const isFacturar = a.type === "listo_facturar";
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "13px 16px",
        background: C.card,
        borderRadius: 3,
        border: `1px solid ${a.urgency === "alta" ? C.redDim : C.border}`,
        borderLeft: `4px solid ${a.urgency === "alta" ? C.red : C.yellow}`,
      }}>
        <div style={{ fontSize: 22 }}>{iconTipo[a.type] || "⚠"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{a.customer?.name}</span>
            <Badge label={labelTipo[a.type] || a.type} color={a.urgency === "alta" ? C.red : C.yellow} bg={a.urgency === "alta" ? C.redDim : C.yellowDim} />
            <Badge label={a.customer?.sector} color={C.muted} />
          </div>
          <div style={{ color: C.muted, fontSize: 12 }}>{a.message}</div>
          {isFacturar && a.quotation && (
            <div style={{ color: C.purple, fontSize: 12, marginTop: 2 }}>
              {a.quotation.number} · {fmt(a.quotation.total)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar avatar={a.salesRep?.avatar} color={a.salesRep?.color} size={28} />
          <span style={{ color: C.muted, fontSize: 12 }}>{a.salesRep?.name?.split(" ")[0]}</span>
        </div>
        {isFacturar ? (
          <button
            onClick={() => handleExport(a.quotation.id)}
            disabled={exportMutation.isPending}
            style={{ background: C.purple, color: "#fff", border: "none", borderRadius: 3, padding: "7px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
            ⬇ Exportar a Presea
          </button>
        ) : (
          <button
            onClick={() => a.customer?.id && navigate(`/clientes?cliente=${a.customer.id}`)}
            disabled={!a.customer?.id}
            style={{ background: C.surface, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 3, padding: "7px 14px", fontWeight: 600, fontSize: 12, cursor: a.customer?.id ? "pointer" : "not-allowed" }}>
            Ver cliente
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: C.greenDim, border: `1px solid ${C.green}`, color: C.green, borderRadius: 3, padding: "12px 20px", fontWeight: 700, fontSize: 13, zIndex: 500 }}>
          {toast}
        </div>
      )}

      <SectionHeader title="Centro de Alertas" sub={`${alerts.length} alertas activas · ${altas.length} urgentes`} />

      {altas.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, boxShadow: `0 0 8px ${C.red}` }} />
            <span style={{ color: C.red, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Urgentes — Acción inmediata</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {altas.map((a: any) => <AlertRow key={a.id} a={a} />)}
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
            {medias.map((a: any) => <AlertRow key={a.id} a={a} />)}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Sin alertas activas</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Todos los clientes están al día</div>
        </div>
      )}
    </div>
  );
}
