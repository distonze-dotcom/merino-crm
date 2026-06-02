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

// ─── Argentina timezone (UTC-3) ───────────────────────────────────────────────
export const AR_TZ = "America/Argentina/Buenos_Aires";

export const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

// Format a date in Argentina time (dd/mm/yyyy)
export const fmtDate = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: AR_TZ });
};

// Format date + time in Argentina time (dd/mm/yyyy HH:mm)
export const fmtDateTime = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: AR_TZ });
};

// "YYYY-MM-DD" for today in Argentina (for date inputs / new records)
export const todayAR = (): string => {
  // en-CA locale yields ISO-like YYYY-MM-DD
  return new Date().toLocaleDateString("en-CA", { timeZone: AR_TZ });
};

// Whole days between an AR calendar date and today (AR). Positive = in the past.
export const daysSince = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  const arDate = date.toLocaleDateString("en-CA", { timeZone: AR_TZ });
  const ms = new Date(`${todayAR()}T00:00:00`).getTime() - new Date(`${arDate}T00:00:00`).getTime();
  return Math.round(ms / 86400000);
};
