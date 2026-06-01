import { prisma } from "../../lib/prisma";

export async function listProducts() {
  return prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export async function createProduct(data: {
  code: string;
  name: string;
  description?: string;
  unit: string;
  price: number;
}) {
  return prisma.product.create({ data });
}

export async function updateProduct(
  id: string,
  data: Partial<{ name: string; description: string; unit: string; price: number; active: boolean }>
) {
  return prisma.product.update({ where: { id }, data });
}
