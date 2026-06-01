import { Router } from "express";
import { Request, Response, NextFunction } from "express";
import { getDashboard } from "./dashboard.service";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await getDashboard(req.user!.userId, req.user!.role));
  } catch (err) {
    next(err);
  }
});

export default router;
