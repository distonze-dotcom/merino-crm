import { prisma } from "../../lib/prisma";

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

export async function getAlerts(userId: string, role: string) {
  const customerWhere = role === "SALES" ? { assignedToId: userId, active: true } : { active: true };

  // Single round-trip: customers + last visit, ready-to-invoice quotations,
  // and all invoiced quotations (to derive last purchase per customer) in parallel.
  const [customers, readyQuotations, invoicedRows] = await Promise.all([
    prisma.customer.findMany({
      where: customerWhere,
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true, color: true } },
        visits: { orderBy: { date: "desc" }, take: 1 },
      },
    }),
    prisma.quotation.findMany({
      where: {
        status: "READY_FOR_INVOICING",
        ...(role === "SALES" ? { salesRepId: userId } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, sector: true } },
        salesRep: { select: { id: true, name: true, avatar: true, color: true } },
        items: true,
      },
    }),
    prisma.quotation.findMany({
      where: {
        status: "INVOICED",
        ...(role === "SALES" ? { salesRepId: userId } : {}),
      },
      select: { customerId: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  // Map customerId -> most recent invoiced date (rows already sorted desc)
  const lastPurchaseByCustomer = new Map<string, Date>();
  for (const row of invoicedRows) {
    if (!lastPurchaseByCustomer.has(row.customerId)) {
      lastPurchaseByCustomer.set(row.customerId, row.updatedAt);
    }
  }

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

    // Last invoiced date (from the pre-fetched map) for sin_compra logic
    const lastPurchaseDate = lastPurchaseByCustomer.get(c.id);

    if (lastPurchaseDate) {
      const daysSincePurchase = daysSince(lastPurchaseDate);
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
