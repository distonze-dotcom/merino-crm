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
    const customer = await prisma.customer.findUnique({
      where: { id: q.customerId },
      select: { sector: true },
    });
    if (customer) {
      const amount = q.items.reduce((s: number, i: QuotationItem) => s + i.subtotal, 0);
      sectorStats[customer.sector] = (sectorStats[customer.sector] || 0) + amount;
    }
  }

  return {
    kpis: {
      totalPresupuestado,
      totalFacturado,
      totalPerdido,
      conversion,
      totalClientes: allCustomers.length,
      totalVisitas:  allVisits.length,
    },
    lossReasons: Object.entries(lossReasons)
      .map(([reason, amount]) => ({ reason, amount }))
      .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount),
    repStats,
    sectorStats: Object.entries(sectorStats)
      .map(([sector, amount]) => ({ sector, amount }))
      .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount),
  };
}
