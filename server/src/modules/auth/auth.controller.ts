import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { loginUser, getMe } from "./auth.service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getMe(req.user!.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
}
