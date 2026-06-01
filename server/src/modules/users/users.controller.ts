import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { listUsers, createUser, updateUser } from "./users.service";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  avatar: z.string().max(3),
  color: z.string(),
  role: z.enum(["ADMIN", "SALES"]).optional(),
});

const updateSchema = z.object({
  name: z.string().optional(),
  avatar: z.string().optional(),
  color: z.string().optional(),
  role: z.enum(["ADMIN", "SALES"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listUsers());
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    res.status(201).json(await createUser({ ...data, role: data.role ?? "SALES" }));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body);
    res.json(await updateUser(req.params.id, data));
  } catch (err) {
    next(err);
  }
}
