import { Router } from "express";
import { list, get, create, update } from "./customers.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.get("/", requireAuth, list);
router.get("/:id", requireAuth, get);
router.post("/", requireAuth, create);
router.patch("/:id", requireAuth, update);

export default router;
