import { prisma } from "../../lib/prisma";

export async function listCustomers(userId: string, role: string) {
  const where = role === "SALES" ? { assignedToId: userId, active: true } : { active: true };
  return prisma.customer.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true, avatar: true, color: true } },
      _count: { select: { visits: true, quotations: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCustomer(id: string, userId: string, role: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, avatar: true, color: true } },
      visits: { orderBy: { date: "desc" } },
      quotations: {
        include: {
          items: { include: { product: { select: { name: true } } } },
          salesRep: { select: { id: true, name: true, avatar: true, color: true } },
        },
        orderBy: { issueDate: "desc" },
      },
    },
  });
  if (!customer) throw new Error("Cliente no encontrado");
  if (role === "SALES" && customer.assignedToId !== userId) {
    throw new Error("Sin permisos");
  }
  return customer;
}

export async function createCustomer(
  data: {
    code?: string;
    name: string;
    sector: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    assignedToId: string;
  },
  actorId: string
) {
  const customer = await prisma.customer.create({ data });
  await prisma.auditLog.create({
    data: {
      entity: "customer",
      entityId: customer.id,
      action: "created",
      newValue: JSON.stringify(customer),
      userId: actorId,
      customerId: customer.id,
    },
  });
  return customer;
}

export async function updateCustomer(
  id: string,
  data: Partial<{ code: string; name: string; sector: string; phone: string; email: string; address: string; notes: string; active: boolean }>,
  actorId: string
) {
  const old = await prisma.customer.findUnique({ where: { id } });
  const updated = await prisma.customer.update({ where: { id }, data });
  await prisma.auditLog.create({
    data: {
      entity: "customer",
      entityId: id,
      action: "updated",
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(updated),
      userId: actorId,
      customerId: id,
    },
  });
  return updated;
}
