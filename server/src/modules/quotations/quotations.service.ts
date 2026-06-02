import { prisma } from "../../lib/prisma";

const QuotationStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  READY_FOR_INVOICING: "READY_FOR_INVOICING",
  INVOICED: "INVOICED",
} as const;

type QStatus = typeof QuotationStatus[keyof typeof QuotationStatus];

const ALLOWED_TRANSITIONS: Record<QStatus, QStatus[]> = {
  DRAFT: ["SENT", "REJECTED"],
  SENT: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["READY_FOR_INVOICING", "REJECTED"],
  READY_FOR_INVOICING: ["INVOICED", "REJECTED"],
  INVOICED: [],
  REJECTED: [],
};

// Plain "YYYY-MM-DD" → anchored to 12:00 UTC (avoids timezone day-shift)
function parseDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00.000Z`);
  return new Date(value);
}

async function nextNumber(): Promise<string> {
  const last = await prisma.quotation.findFirst({ orderBy: { number: "desc" } });
  if (!last) return "P-0001";
  const num = parseInt(last.number.replace("P-", ""), 10) + 1;
  return `P-${String(num).padStart(4, "0")}`;
}

export async function listQuotations(userId: string, role: string, status?: string) {
  const where: Record<string, unknown> = {};
  if (role === "SALES") where.salesRepId = userId;
  if (status) where.status = status;
  return prisma.quotation.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, sector: true } },
      salesRep: { select: { id: true, name: true, avatar: true, color: true } },
      items: { include: { product: { select: { id: true, name: true, code: true } } } },
    },
    orderBy: { issueDate: "desc" },
  });
}

export async function getQuotation(id: string, userId: string, role: string) {
  const q = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, sector: true } },
      salesRep: { select: { id: true, name: true, avatar: true, color: true } },
      items: { include: { product: true } },
      auditLogs: { include: { user: { select: { name: true, avatar: true, color: true } } }, orderBy: { createdAt: "desc" } },
      exportLogs: { orderBy: { exportedAt: "desc" } },
    },
  });
  if (!q) throw new Error("Presupuesto no encontrado");
  if (role === "SALES" && q.salesRepId !== userId) throw new Error("Sin permisos");
  return q;
}

export async function createQuotation(
  data: {
    customerId: string;
    salesRepId: string;
    validUntil?: string;
    notes?: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  },
  actorId: string
) {
  const number = await nextNumber();
  const q = await prisma.quotation.create({
    data: {
      number,
      customerId: data.customerId,
      salesRepId: data.salesRepId,
      validUntil: data.validUntil ? parseDate(data.validUntil) : undefined,
      notes: data.notes,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true },
  });
  await prisma.auditLog.create({
    data: {
      entity: "quotation",
      entityId: q.id,
      action: "created",
      newValue: JSON.stringify({ number: q.number, customerId: q.customerId }),
      userId: actorId,
      quotationId: q.id,
      customerId: q.customerId,
    },
  });
  return q;
}

export async function changeStatus(
  id: string,
  newStatus: string,
  lossReason: string | undefined,
  actorId: string
) {
  const q = await prisma.quotation.findUnique({ where: { id } });
  if (!q) throw new Error("Presupuesto no encontrado");
  if (q.status === "INVOICED") throw new Error("El presupuesto ya está facturado y no puede cambiar de estado");

  const allowed = ALLOWED_TRANSITIONS[q.status as QStatus] || [];
  if (!allowed.includes(newStatus as QStatus)) {
    throw new Error(`Transición no permitida: ${q.status} → ${newStatus}`);
  }
  if (newStatus === "REJECTED" && !lossReason) {
    throw new Error("Se requiere motivo de pérdida para rechazar");
  }

  const updated = await prisma.quotation.update({
    where: { id },
    data: { status: newStatus, lossReason: lossReason || null },
  });
  await prisma.auditLog.create({
    data: {
      entity: "quotation",
      entityId: id,
      action: "status_changed",
      oldValue: q.status,
      newValue: newStatus,
      userId: actorId,
      quotationId: id,
      customerId: q.customerId,
    },
  });
  return updated;
}

export async function updateQuotation(
  id: string,
  data: Partial<{ notes: string; validUntil: string; items: Array<{ productId: string; quantity: number; unitPrice: number }> }>,
  actorId: string
) {
  const old = await prisma.quotation.findUnique({ where: { id } });
  if (!old) throw new Error("Presupuesto no encontrado");
  if (old.status !== "DRAFT") throw new Error("Solo se pueden editar presupuestos en estado DRAFT");

  const updated = await prisma.quotation.update({
    where: { id },
    data: {
      notes: data.notes,
      validUntil: data.validUntil ? parseDate(data.validUntil) : undefined,
      ...(data.items
        ? {
            items: {
              deleteMany: {},
              create: data.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.quantity * item.unitPrice,
              })),
            },
          }
        : {}),
    },
    include: { items: { include: { product: true } } },
  });
  await prisma.auditLog.create({
    data: {
      entity: "quotation",
      entityId: id,
      action: "updated",
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(data),
      userId: actorId,
      quotationId: id,
      customerId: old.customerId,
    },
  });
  return updated;
}
