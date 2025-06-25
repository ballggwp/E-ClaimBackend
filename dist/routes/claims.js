"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const claimCtl = __importStar(require("../controllers/claimController"));
const router = express_1.default.Router();
// Public‐facing list (with optional filters)
// GET /api/claims?userEmail=…&excludeStatus=…
router.get("/", claimCtl.listClaims);
// Create a new claim (header only)
// POST /api/claims
router.post("/", claimCtl.createClaim);
// Get one claim (with attachments, form, FPPA variants…)
// GET /api/claims/:id
router.get("/:id", claimCtl.getClaim);
// Update claim header & nested CPM cause
// PATCH /api/claims/:id
router.patch("/:id", claimCtl.updateClaim);
// Insurance‐side actions (approve, reject, evidence)
// POST /api/claims/:id/action
router.post("/:id/action", claimCtl.claimAction);
// Manager‐side actions (approve/reject)
// POST /api/claims/:id/manager
router.post("/:id/manager", claimCtl.ManagerAction);
// Create CPM form (one‐to‐one)
// POST /api/claims/:claimId/cpm
router.post("/:claimId/cpm", claimCtl.createCpmForm);
exports.default = router;
