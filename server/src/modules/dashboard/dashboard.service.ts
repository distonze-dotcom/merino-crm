import { prisma } from "../../lib/prisma";

export async function getDashboard(userId: string, role: string) {
  const qWhere = role === "SALES" ? { salesRepId: userId } : {};

  const [allQuotations, allVisits, allCustomers, salesReps] = await Promise.all([
    prisma.quotation.findMany({
      where: qWhere,
      include: { items: true, salesRep: { select: { id: true, name: true, avatar: true, color: true } } },
    }),
    prisma.visit.findMany({
      where: role === "SALES" ? { salesRepId: userId } : {},
    }),
    prisma.customer.findMany({ where: { active: true } }),
    prisma.user.findMany({ where: { active: true, role: "SALES" }, select: { id: true, name: true, avatar: true, color: true } }),
  ]);

  const totalPresupuestado = allQuotations.reduce((s, q) => s + q.items.reduce((ss, i) => ss + i.subtotal, 0), 0);
  const facturadas = allQuotations.filter((q) => q.status === "INVOICED");
  const perdidas = allQuotations.filter((q) => q.status === "REJECTED");
  const totalFacturado = facturadas.reduce((s, q) => s + q.items.reduce((ss, i) => ss + i.subtotal, 0), 0);
  const totalPerdido = perdidas.reduce((s, q) => s + q.items.reduce((ss, i) => ss + i.subtotal, 0), 0);
  const conversion = allQuotations.length
    ? Math.round((facturadas.length / allQuotations.length) * 100)
    : 0;

  const lossReasons: Record<string, number> = {};
  for (const q of perdidas) {
    if (q.lossReason) {
      const key = q.lossReason.split("—")[0].trim();
      const amount = q.items.reduce((s, i) => s + i.subtotal, 0);
      lossReasons[key] = (lossReasons[key] || 0) + amount;
    }
  }

  const repStats = salesReps.map((rep) => {
    const repQ = allQuotations.filter((q) => q.salesRepId === rep.id);
    const repFact = repQ.filter((q) => q.status === "INVOICED");
    const monto = repFact.reduce((s, q) => s + q.items.reduce((ss, i) => ss + i.subtotal, 0), 0);
    return {
      ...rep,
      presupuestos: repQ.length,
      facturados: repFact.length,
      monto,
      conversion: repQ.length ? Math.round((repFact.length / repQ.length) * 100) : 0,
    };
  }).sort((a, b) => b.monto - a.monto);

  // Sector stats from invoiced quotations
  const sectorStats: Record<string, number> = {};
  for (const q of facturadas) {
    const customer = await prisma.customer.findUnique({ where: { id: q.customerId }, select: { sector: true } });
    if (customer) {
      const amount = q.items.reduce((s, i) => s + i.subtotal, 0);
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
      totalVisitas: allVisits.length,
    },
    lossReasons: Object.entries(lossReasons)
      .map(([reason, amount]) => ({ reason, amount }))
      .sort((a, b) => b.amount - a.amount),
    repStats,
    sectorStats: Object.entries(sectorStats)
      .map(([sector, amount]) => ({ sector, amount }))
      .sort((a, b) => b.amount - a.amount),
  };
}
