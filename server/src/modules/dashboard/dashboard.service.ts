import { prisma } from "../../lib/prisma";

type QuotationItem = { subtotal: number };
type QuotationWithItems = {
  id: string;
  status: string;
  lossReason: string | null;
  customerId: string;
  salesRepId: string;
  issueDate: Date;
  items: QuotationItem[];
  salesRep: { id: string; name: string; avatar: string; color: string };
  customer: { sector: string };
};
type SalesRep = { id: string; name: string; avatar: string; color: string };

function sumQuotationItems(quotations: QuotationWithItems[]): number {
  return quotations.reduce(
    (total: number, q: QuotationWithItems) =>
      total + q.items.reduce((s: number, i: QuotationItem) => s + i.subtotal, 0),
    0
  );
}

export async function getDashboard(userId: string, role: string) {
  const qWhere = role === "SALES" ? { salesRepId: userId } : {};

  const [allQuotations, allVisits, allCustomers, salesReps] = await Promise.all([
    prisma.quotation.findMany({
      where: qWhere,
      include: {
        items: true,
        salesRep: { select: { id: true, name: true, avatar: true, color: true } },
        customer: { select: { sector: true } },
      },
    }),
    prisma.visit.findMany({
      where: role === "SALES" ? { salesRepId: userId } : {},
    }),
    prisma.customer.findMany({ where: { active: true } }),
    prisma.user.findMany({
      where: { active: true, role: "SALES" },
      select: { id: true, name: true, avatar: true, color: true },
    }),
  ]);

  const facturadas = allQuotations.filter((q) => q.status === "INVOICED");
  const perdidas   = allQuotations.filter((q) => q.status === "REJECTED");

  const totalPresupuestado = sumQuotationItems(allQuotations);
  const totalFacturado     = sumQuotationItems(facturadas);
  const totalPerdido       = sumQuotationItems(perdidas);
  const conversion = allQuotations.length
    ? Math.round((facturadas.length / allQuotations.length) * 100)
    : 0;
  // Win rate = facturados / (facturados + perdidos) — decisiones cerradas
  const decided = facturadas.length + perdidas.length;
  const winRate = decided ? Math.round((facturadas.length / decided) * 100) : 0;
  // Ticket promedio facturado
  const avgTicket = facturadas.length ? Math.round(totalFacturado / facturadas.length) : 0;

  // Presupuestos por estado (conteo + monto)
  const STATUSES = ["DRAFT", "SENT", "UNDER_REVIEW", "APPROVED", "READY_FOR_INVOICING", "INVOICED", "REJECTED"];
  const statusBreakdown = STATUSES.map((status) => {
    const arr = allQuotations.filter((q) => q.status === status);
    return { status, count: arr.length, amount: sumQuotationItems(arr) };
  }).filter((s) => s.count > 0);

  const lossReasons: Record<string, number> = {};
  for (const q of perdidas) {
    if (q.lossReason) {
      const key = q.lossReason.split("—")[0].trim();
      const amount = q.items.reduce((s: number, i: QuotationItem) => s + i.subtotal, 0);
      lossReasons[key] = (lossReasons[key] || 0) + amount;
    }
  }

  const repStats = (salesReps as SalesRep[])
    .map((rep: SalesRep) => {
      const repQ    = allQuotations.filter((q) => q.salesRepId === rep.id);
      const repFact = repQ.filter((q) => q.status === "INVOICED");
      const monto   = sumQuotationItems(repFact);
      return {
        ...rep,
        presupuestos: repQ.length,
        facturados:   repFact.length,
        monto,
        conversion: repQ.length ? Math.round((repFact.length / repQ.length) * 100) : 0,
      };
    })
    .sort((a: { monto: number }, b: { monto: number }) => b.monto - a.monto);

  const sectorStats: Record<string, number> = {};
  for (const q of facturadas) {
    const sector = q.customer?.sector;
    if (sector) {
      const amount = q.items.reduce((s: number, i: QuotationItem) => s + i.subtotal, 0);
      sectorStats[sector] = (sectorStats[sector] || 0) + amount;
    }
  }

  return {
    kpis: {
      totalPresupuestado,
      totalFacturado,
      totalPerdido,
      conversion,
      winRate,
      avgTicket,
      totalQuotations: allQuotations.length,
      totalClientes: allCustomers.length,
      totalVisitas:  allVisits.length,
    },
    statusBreakdown,
    lossReasons: Object.entries(lossReasons)
      .map(([reason, amount]) => ({ reason, amount }))
      .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount),
    repStats,
    sectorStats: Object.entries(sectorStats)
      .map(([sector, amount]) => ({ sector, amount }))
      .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount),
  };
}
