import { Router } from "express";
import { list, create, update } from "./users.controller";
import { requireAuth, requireAdmin } from "../../middleware/auth";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAdmin, create);
router.patch("/:id", requireAdmin, update);

export default router;
