// src/routes/claims.ts
import express from "express";
import multer from "multer";
import * as claimCtl from "../controllers/claimController";
import { ensureAuth, ensureRole } from "../middleware/authMiddleware";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
// List & filter claims
router.get(
  "/",
  ensureAuth,
  claimCtl.listClaims
);

// Create a new claim — now req.user is guaranteed
router.post(
  "/",
  ensureAuth,
  claimCtl.createClaim
);

// Get one claim
router.get(
  "/:id",
  ensureAuth,
  claimCtl.getClaim
);

// Update header + nested CPM upsert
router.patch(
  "/:id",
  ensureAuth,
  claimCtl.updateClaim
);

// Insurance actions
router.post(
  "/:id/action",
  ensureAuth,
  ensureRole("INSURANCE"),
  claimCtl.claimAction
);

// Manager actions
router.post(
  "/:id/manager",
  ensureAuth,
  ensureRole("MANAGER"),
  claimCtl.ManagerAction
);

// Create CPM form
router.post(
  "/:claimId/cpm",
  ensureAuth,
  upload.fields([
    { name: "damageFiles" },
    { name: "estimateFiles" },
    { name: "otherFiles" },
  ]),
  claimCtl.createCpmForm
);
router.put(
  "/:claimId/cpm",
  ensureAuth,
  upload.fields([
    { name: "damageFiles" },
    { name: "estimateFiles" },
    { name: "otherFiles" },
  ]),
  claimCtl.updateCpmForm
);
export default router;
