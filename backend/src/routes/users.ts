import { Router } from "express";
import * as rulesController from "../controllers/rules";
import { authenticate, requireRole } from "../middleware/auth";

export const rulesRouter = Router();

// Only Admins can manage rules
rulesRouter.use(authenticate, requireRole("ADMIN"));

rulesRouter.get("/", rulesController.getRules);
rulesRouter.get("/:id", rulesController.getRuleById);
rulesRouter.post("/", rulesController.createRule);
rulesRouter.put("/:id", rulesController.updateRule);
rulesRouter.delete("/:id", rulesController.deleteRule);
rulesRouter.patch("/:id/toggle", rulesController.toggleRule);
