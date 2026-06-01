import { Router } from "express";
import multer from "multer";
import { list, create, update, importFromExcel, stats } from "./products.controller";
import { requireAuth, requireAdmin } from "../../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", requireAuth, list);
router.get("/stats", requireAuth, stats);
router.post("/", requireAdmin, create);
router.patch("/:id", requireAdmin, update);
router.post("/import", requireAdmin, upload.single("file"), importFromExcel);

export default router;
