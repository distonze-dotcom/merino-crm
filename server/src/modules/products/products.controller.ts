import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as XLSX from "xlsx";
import { listProducts, createProduct, updateProduct, importProducts, getProductStats, ImportRow } from "./products.service";

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().default("un"),
  price: z.number().min(0),
});

const updateSchema = createSchema.omit({ code: true }).partial().extend({ active: z.boolean().optional() });

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listProducts());
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    res.status(201).json(await createProduct(data));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body);
    res.json(await updateProduct(req.params.id, data));
  } catch (err) {
    next(err);
  }
}

export async function importFromExcel(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No se recibió ningún archivo" });
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    const rows: ImportRow[] = [];
    let skippedEmpty = 0;

    for (const raw of rawRows) {
      const code = String(raw["CODIGO_PRO"] ?? "").trim();
      const name = String(raw["DETALLE"] ?? "").trim();

      if (!code || !name) {
        skippedEmpty++;
        continue;
      }

      const brand = String(raw["MARCA"] ?? "").trim();
      const unid = String(raw["UNID"] ?? "").trim();
      const uniMed = String(raw["UNI_MED"] ?? "").trim();
      const unit = unid && uniMed ? `${unid} ${uniMed}` : unid || uniMed || "un";

      const rawPrice = raw["REVENTA SIN IVA"];
      const price = typeof rawPrice === "number" ? rawPrice : parseFloat(String(rawPrice ?? "0").replace(",", ".")) || 0;

      rows.push({
        code,
        name,
        description: brand,
        unit,
        price,
      });
    }

    const result = await importProducts(rows);
    res.json({ ...result, skipped: result.skipped + skippedEmpty });
  } catch (err) {
    next(err);
  }
}

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getProductStats());
  } catch (err) {
    next(err);
  }
}
