import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { getRules, getRuleById, createRule, updateRule, deleteRule, toggleRule } from "../controllers/rules";

// Cast handlers to 'any' to avoid deep Express generic parameter mismatch on custom AuthRequest
export const rulesRouter = Router();

rulesRouter.use(authenticate, requireRole("ADMIN") as any);

rulesRouter.get("/", getRules as any);
rulesRouter.get("/:id", getRuleById as any);
rulesRouter.post("/", createRule as any);
rulesRouter.put("/:id", updateRule as any);
rulesRouter.patch("/:id/toggle", toggleRule as any);
rulesRouter.delete("/:id", deleteRule as any);
