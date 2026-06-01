import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { listProducts, createProduct, updateProduct } from "./products.service";

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
