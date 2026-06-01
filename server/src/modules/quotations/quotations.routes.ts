import { Router } from "express";
import { list, get, create, patchStatus, update } from "./quotations.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.get("/", requireAuth, list);
router.get("/:id", requireAuth, get);
router.post("/", requireAuth, create);
router.patch("/:id/status", requireAuth, patchStatus);
router.patch("/:id", requireAuth, update);

export default router;
