import { prisma } from "../../lib/prisma";

// Parse a date value. Plain "YYYY-MM-DD" is anchored to 12:00 UTC so that
// timezone shifts (e.g. Argentina UTC-3) never move it to the previous day.
function parseDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00.000Z`);
  return new Date(value);
}

export async function listVisits(userId: string, role: string, customerId?: string) {
  const where: Record<string, unknown> = {};
  if (role === "SALES") where.salesRepId = userId;
  if (customerId) where.customerId = customerId;
  return prisma.visit.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, sector: true } },
      salesRep: { select: { id: true, name: true, avatar: true, color: true } },
    },
    orderBy: { date: "desc" },
  });
}

export async function createVisit(
  data: {
    customerId: string;
    salesRepId: string;
    date: string;
    wasReceived: boolean;
    result: string;
    saleAmount: number;
    nextVisitDate?: string;
  },
  actorId: string
) {
  const visit = await prisma.visit.create({
    data: {
      customerId: data.customerId,
      salesRepId: data.salesRepId,
      date: parseDate(data.date),
      wasReceived: data.wasReceived,
      result: data.result,
      saleAmount: data.saleAmount,
      nextVisitDate: data.nextVisitDate ? parseDate(data.nextVisitDate) : undefined,
    },
    include: {
      customer: { select: { id: true, name: true, sector: true } },
      salesRep: { select: { id: true, name: true, avatar: true, color: true } },
    },
  });
  await prisma.auditLog.create({
    data: {
      entity: "visit",
      entityId: visit.id,
      action: "created",
      newValue: JSON.stringify({ customerId: visit.customerId, date: visit.date }),
      userId: actorId,
      customerId: visit.customerId,
    },
  });
  return visit;
}

export async function updateVisit(
  id: string,
  data: Partial<{ wasReceived: boolean; result: string; saleAmount: number; nextVisitDate: string }>,
  actorId: string
) {
  const updated = await prisma.visit.update({
    where: { id },
    data: {
      ...data,
      nextVisitDate: data.nextVisitDate ? parseDate(data.nextVisitDate) : undefined,
    },
  });
  await prisma.auditLog.create({
    data: {
      entity: "visit",
      entityId: id,
      action: "updated",
      newValue: JSON.stringify(data),
      userId: actorId,
    },
  });
  return updated;
}
