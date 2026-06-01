// HubSpot-inspired light theme — clean, subtle borders, soft shadows
export const C = {
  bg:        "#f5f8fa",
  surface:   "#ffffff",
  card:      "#ffffff",
  cardHover: "#f5f8fa",
  border:    "#dfe3eb",
  accent:    "#e8541a",
  accentDim: "#fdeee8",
  green:     "#00a38d",
  greenDim:  "#e3f5f1",
  red:       "#d6492f",
  redDim:    "#fbe9e6",
  yellow:    "#c47d12",
  yellowDim: "#fdf3e1",
  blue:      "#2563eb",
  blueDim:   "#e7effd",
  purple:    "#6b4eff",
  purpleDim: "#ece8ff",
  text:      "#33475b",
  muted:     "#7c98b6",
  dim:       "#afbdca",
} as const;

export const R = 3;
export const SHADOW = "0 1px 2px rgba(45,62,80,0.08)";
export const SHADOW_LG = "0 6px 24px rgba(45,62,80,0.16)";
export const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";

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
