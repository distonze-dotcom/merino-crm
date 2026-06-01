import { Router, Request, Response, NextFunction } from "express";
import { exportToPresea } from "./presea.service";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.post("/:quotationId/export", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName, buffer, number } = await exportToPresea(req.params.quotationId, req.user!.userId);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("X-Quotation-Number", number);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

export default router;
