import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { listVisits, createVisit, updateVisit } from "./visits.service";

const createSchema = z.object({
  customerId: z.string(),
  salesRepId: z.string(),
  date: z.string(),
  wasReceived: z.boolean(),
  result: z.string().min(1),
  saleAmount: z.number().min(0).default(0),
  nextVisitDate: z.string().optional(),
});

const updateSchema = z.object({
  wasReceived: z.boolean().optional(),
  result: z.string().optional(),
  saleAmount: z.number().optional(),
  nextVisitDate: z.string().optional(),
});

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.query.customerId as string | undefined;
    res.json(await listVisits(req.user!.userId, req.user!.role, customerId));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    res.status(201).json(await createVisit(data, req.user!.userId));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body);
    res.json(await updateVisit(req.params.id, data, req.user!.userId));
  } catch (err) {
    next(err);
  }
}
