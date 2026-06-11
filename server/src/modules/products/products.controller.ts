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
    const data = createSchema.parse(req.body) as Parameters<typeof createProduct>[0];
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

    // Read as a matrix so we can locate the real header row (the file may have
    // title rows above it, e.g. "LISTA 02 DE MAYO 2026 ...").
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

    const norm = (v: unknown) =>
      String(v ?? "").trim().toUpperCase().replace(/\s+/g, " ");

    // Find the header row: the first row that contains a "CODIGO" cell and a "DETALLE" cell.
    let headerIdx = -1;
    for (let i = 0; i < matrix.length; i++) {
      const cells = (matrix[i] || []).map(norm);
      if (cells.includes("CODIGO") && cells.includes("DETALLE")) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx === -1) {
      res.status(400).json({
        error: "No se encontró la fila de encabezados. El Excel debe tener columnas CODIGO y DETALLE.",
      });
      return;
    }

    const header = (matrix[headerIdx] || []).map(norm);
    // Locate columns by normalized name (tolerant to extra spaces / variants).
    const findCol = (...names: string[]) =>
      header.findIndex((h) => names.some((n) => h === n || h.includes(n)));

    // Which list is being uploaded? ("reventa" default | "general")
    const listType = (String(req.body?.listType ?? "reventa").toLowerCase() === "general") ? "general" : "reventa";

    const colCodigo  = findCol("CODIGO");
    const colDetalle = findCol("DETALLE");
    const colMarca   = findCol("MARCA");
    const colUnid    = header.findIndex((h) => h === "UNID");
    const colUniMed  = findCol("UNI_MED", "UNI MED", "UNIDAD MEDIDA", "U_MEDIDA");
    // Prefer the column matching the selected list; fall back to any price column.
    const colPrecio  = listType === "general"
      ? findCol("GENERAL CON IVA", "GENERAL SIN IVA", "GENERAL", "PRECIO")
      : findCol("REVENTA SIN IVA", "REVENTA", "PRECIO");

    const rows: ImportRow[] = [];
    let skippedEmpty = 0;

    for (let i = headerIdx + 1; i < matrix.length; i++) {
      const r = matrix[i] || [];
      const code = String(r[colCodigo] ?? "").trim();
      const name = String(r[colDetalle] ?? "").trim();

      if (!code || !name) {
        skippedEmpty++;
        continue;
      }

      const brand  = colMarca  >= 0 ? String(r[colMarca]  ?? "").trim() : "";
      const unid   = colUnid   >= 0 ? String(r[colUnid]   ?? "").trim() : "";
      const uniMed = colUniMed >= 0 ? String(r[colUniMed] ?? "").trim() : "";
      const unit = unid && uniMed ? `${unid} ${uniMed}` : unid || uniMed || "un";

      const rawPrice = colPrecio >= 0 ? r[colPrecio] : 0;
      const price = typeof rawPrice === "number"
        ? rawPrice
        : parseFloat(String(rawPrice ?? "0").replace(/\./g, "").replace(",", ".")) || 0;

      rows.push({ code, name, description: brand, unit, price });
    }

    const result = await importProducts(rows, listType);
    res.json({ ...result, listType, skipped: result.skipped + skippedEmpty });
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
