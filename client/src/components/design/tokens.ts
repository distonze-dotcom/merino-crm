export const C = {
  bg:        "#0d0d0d",
  surface:   "#161616",
  card:      "#1e1e1e",
  cardHover: "#242424",
  border:    "#2a2a2a",
  accent:    "#e8541a",
  accentDim: "#7a2d0e",
  green:     "#22c55e",
  greenDim:  "#052e16",
  red:       "#ef4444",
  redDim:    "#2d0a0a",
  yellow:    "#f59e0b",
  yellowDim: "#422006",
  blue:      "#3b82f6",
  blueDim:   "#0c1a30",
  purple:    "#a78bfa",
  purpleDim: "#1e1040",
  text:      "#f0ede8",
  muted:     "#7a7570",
  dim:       "#444",
} as const;

export const QUOTATION_STATUS_LABEL: Record<string, string> = {
  DRAFT:                "Borrador",
  SENT:                 "Enviado",
  UNDER_REVIEW:         "En revisión",
  APPROVED:             "Aprobado",
  REJECTED:             "Perdido",
  READY_FOR_INVOICING:  "Listo p/Facturar",
  INVOICED:             "Facturado",
};

export const QUOTATION_STATUS_COLOR: Record<string, string> = {
  DRAFT:               C.muted,
  SENT:                C.blue,
  UNDER_REVIEW:        C.yellow,
  APPROVED:            C.green,
  REJECTED:            C.red,
  READY_FOR_INVOICING: C.purple,
  INVOICED:            C.green,
};

export const QUOTATION_STATUS_BG: Record<string, string> = {
  DRAFT:               C.card,
  SENT:                C.blueDim,
  UNDER_REVIEW:        C.yellowDim,
  APPROVED:            C.greenDim,
  REJECTED:            C.redDim,
  READY_FOR_INVOICING: C.purpleDim,
  INVOICED:            C.greenDim,
};

export const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export const fmtDate = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const daysSince = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
};
