import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Datos inválidos",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
    return;
  }

  res.status(500).json({ error: err.message || "Error interno del servidor" });
}
