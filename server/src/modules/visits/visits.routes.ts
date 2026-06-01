import { Router } from "express";
import { list, create, update } from "./visits.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, create);
router.patch("/:id", requireAuth, update);

export default router;
