import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  listQuotations,
  getQuotation,
  createQuotation,
  changeStatus,
  updateQuotation,
} from "./quotations.service";

const STATUSES = ["DRAFT", "SENT", "UNDER_REVIEW", "APPROVED", "REJECTED", "READY_FOR_INVOICING", "INVOICED"] as const;

const itemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const createSchema = z.object({
  customerId: z.string(),
  salesRepId: z.string(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

const statusSchema = z.object({
  status: z.enum(STATUSES),
  lossReason: z.string().optional(),
});

const updateSchema = z.object({
  notes: z.string().optional(),
  validUntil: z.string().optional(),
  items: z.array(itemSchema).optional(),
});

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    res.json(await listQuotations(req.user!.userId, req.user!.role, status));
  } catch (err) {
    next(err);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getQuotation(req.params.id, req.user!.userId, req.user!.role));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body) as Parameters<typeof createQuotation>[0];
    res.status(201).json(await createQuotation(data, req.user!.userId));
  } catch (err) {
    next(err);
  }
}

export async function patchStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, lossReason } = statusSchema.parse(req.body);
    res.json(await changeStatus(req.params.id, status, lossReason, req.user!.userId));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body) as Parameters<typeof updateQuotation>[1];
    res.json(await updateQuotation(req.params.id, data, req.user!.userId));
  } catch (err) {
    next(err);
  }
}
