import { prisma } from "../../lib/prisma";

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

export async function getAlerts(userId: string, role: string) {
  const customerWhere = role === "SALES" ? { assignedToId: userId, active: true } : { active: true };

  const customers = await prisma.customer.findMany({
    where: customerWhere,
    include: {
      assignedTo: { select: { id: true, name: true, avatar: true, color: true } },
      visits: { orderBy: { date: "desc" }, take: 1 },
    },
  });

  const readyQuotations = await prisma.quotation.findMany({
    where: {
      status: "READY_FOR_INVOICING",
      ...(role === "SALES" ? { salesRepId: userId } : {}),
    },
    include: {
      customer: { select: { id: true, name: true, sector: true } },
      salesRep: { select: { id: true, name: true, avatar: true, color: true } },
      items: true,
    },
  });

  type AlertItem = {
    id: string;
    type: string;
    urgency: "alta" | "media";
    message: string;
    days: number;
    customer: { id: string; name: string; sector: string };
    salesRep: { id: string; name: string; avatar: string; color: string };
    quotation?: { id: string; number: string; total: number };
  };

  const alerts: AlertItem[] = [];

  for (const c of customers) {
    const lastVisit = c.visits[0];
    const salesRep = c.assignedTo as { id: string; name: string; avatar: string; color: string };

    // Last invoiced quotation for sin_compra logic
    const lastInvoiced = await prisma.quotation.findFirst({
      where: { customerId: c.id, status: "INVOICED" },
      orderBy: { updatedAt: "desc" },
    });

    if (lastInvoiced) {
      const daysSincePurchase = daysSince(lastInvoiced.updatedAt);
      if (daysSincePurchase > 45) {
        alerts.push({
          id: `sin_compra_${c.id}`,
          type: "sin_compra",
          urgency: daysSincePurchase > 75 ? "alta" : "media",
          message: `Sin compras hace ${daysSincePurchase} días`,
          days: daysSincePurchase,
          customer: { id: c.id, name: c.name, sector: c.sector },
          salesRep,
        });
      }
    }

    if (lastVisit) {
      const daysSinceVisit = daysSince(lastVisit.date);
      if (daysSinceVisit > 20) {
        alerts.push({
          id: `sin_visita_${c.id}`,
          type: "sin_visita",
          urgency: daysSinceVisit > 40 ? "alta" : "media",
          message: `Sin visita hace ${daysSinceVisit} días`,
          days: daysSinceVisit,
          customer: { id: c.id, name: c.name, sector: c.sector },
          salesRep,
        });
      }

      if (lastVisit.nextVisitDate && daysSince(lastVisit.nextVisitDate) > 0 && lastVisit.saleAmount === 0) {
        alerts.push({
          id: `seguimiento_${c.id}`,
          type: "seguimiento_vencido",
          urgency: "alta",
          message: `Visita de seguimiento pendiente (${daysSince(lastVisit.nextVisitDate)}d de atraso)`,
          days: daysSince(lastVisit.nextVisitDate),
          customer: { id: c.id, name: c.name, sector: c.sector },
          salesRep,
        });
      }
    }
  }

  for (const q of readyQuotations) {
    const total = q.items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0);
    alerts.push({
      id: `listo_facturar_${q.id}`,
      type: "listo_facturar",
      urgency: "alta",
      message: `Presupuesto ${q.number} listo para facturar`,
      days: daysSince(q.issueDate),
      customer: q.customer as { id: string; name: string; sector: string },
      salesRep: q.salesRep as { id: string; name: string; avatar: string; color: string },
      quotation: { id: q.id, number: q.number, total },
    });
  }

  return alerts.sort((a, b) => {
    if (a.urgency !== b.urgency) return a.urgency === "alta" ? -1 : 1;
    return b.days - a.days;
  });
}
