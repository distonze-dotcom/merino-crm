import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { listCustomers, getCustomer, createCustomer, updateCustomer } from "./customers.service";

const createSchema = z.object({
  name: z.string().min(1),
  sector: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  assignedToId: z.string(),
});

const updateSchema = createSchema.partial().extend({ active: z.boolean().optional() });

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listCustomers(req.user!.userId, req.user!.role));
  } catch (err) {
    next(err);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getCustomer(req.params.id, req.user!.userId, req.user!.role));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    res.status(201).json(await createCustomer(data, req.user!.userId));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body);
    res.json(await updateCustomer(req.params.id, data, req.user!.userId));
  } catch (err) {
    next(err);
  }
}
