import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";

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

const CHUNK = 500;

export async function importProducts(rows: ImportRow[]): Promise<ImportResult> {
  const errors: string[] = [];

  // De-duplicate by code within the file (last occurrence wins).
  const byCode = new Map<string, ImportRow>();
  for (const r of rows) {
    if (r.code) byCode.set(r.code, r);
  }
  const unique = [...byCode.values()];
  const duplicatesInFile = rows.length - unique.length;

  // One query to learn which codes already exist.
  const existingRows = await prisma.product.findMany({ select: { code: true } });
  const existingSet = new Set(existingRows.map((e) => e.code));

  const toCreate = unique.filter((r) => !existingSet.has(r.code));
  const toUpdate = unique.filter((r) => existingSet.has(r.code));

  // Bulk INSERT new products (chunked createMany).
  for (let i = 0; i < toCreate.length; i += CHUNK) {
    const chunk = toCreate.slice(i, i + CHUNK);
    try {
      await prisma.product.createMany({
        data: chunk.map((r) => ({
          code: r.code, name: r.name, description: r.description, unit: r.unit, price: r.price,
        })),
        skipDuplicates: true,
      });
    } catch (err) {
      errors.push(`Insert chunk ${i}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Bulk UPDATE existing products with a single VALUES-join query per chunk.
  for (let i = 0; i < toUpdate.length; i += CHUNK) {
    const chunk = toUpdate.slice(i, i + CHUNK);
    const values = chunk.map(
      (r) => Prisma.sql`(${r.code}, ${r.name}, ${r.description}, ${r.unit}, ${r.price})`
    );
    try {
      await prisma.$executeRaw`
        UPDATE "Product" AS p
        SET name = v.name,
            description = v.description,
            unit = v.unit,
            price = v.price::double precision,
            active = true,
            "updatedAt" = NOW()
        FROM (VALUES ${Prisma.join(values)}) AS v(code, name, description, unit, price)
        WHERE p.code = v.code
      `;
    } catch (err) {
      errors.push(`Update chunk ${i}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    imported: toCreate.length,
    updated: toUpdate.length,
    skipped: duplicatesInFile,
    errors,
  };
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
