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

export interface ImportRow {
  code: string;
  name: string;
  description: string;
  unit: string;
  price: number;
}

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function importProducts(rows: ImportRow[]): Promise<ImportResult> {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const existing = await prisma.product.findUnique({ where: { code: row.code } });
      if (existing) {
        await prisma.product.update({
          where: { code: row.code },
          data: {
            name: row.name,
            description: row.description,
            unit: row.unit,
            price: row.price,
            active: true,
          },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            code: row.code,
            name: row.name,
            description: row.description,
            unit: row.unit,
            price: row.price,
          },
        });
        imported++;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Row ${row.code}: ${message}`);
      skipped++;
    }
  }

  return { imported, updated, skipped, errors };
}

export async function getProductStats() {
  const total = await prisma.product.count();
  const active = await prisma.product.count({ where: { active: true } });

  const brandsRaw = await prisma.product.findMany({
    where: { active: true, description: { not: null } },
    select: { description: true },
    distinct: ["description"],
  });
  const brands = brandsRaw
    .map((b) => b.description)
    .filter((b): b is string => !!b)
    .sort();

  // Use the most recent updatedAt as proxy for last import
  const lastProduct = await prisma.product.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });

  return {
    total,
    active,
    brands,
    lastImport: lastProduct?.updatedAt ?? null,
  };
}
