"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCpmForm = exports.ManagerAction = exports.claimAction = exports.updateClaim = exports.getClaim = exports.createClaim = exports.listClaims = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
// ─── List Claims ───────────────────────────────────────────────────────────────
const listClaims = async (req, res, next) => {
    try {
        const { userEmail, excludeStatus } = req.query;
        const where = {};
        if (excludeStatus)
            where.status = { not: excludeStatus };
        if (userEmail)
            where.createdBy = { email: userEmail };
        const claims = await prisma_1.default.claim.findMany({
            where,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                status: true,
                createdAt: true,
                submittedAt: true,
                insurerComment: true,
                createdBy: { select: { name: true } },
                cpmForm: { select: { cause: true } }, // ← pull cause from CPMForm
            },
        });
        const sanitized = claims.map(c => ({
            id: c.id,
            status: c.status,
            createdAt: c.createdAt.toISOString(),
            submittedAt: c.submittedAt?.toISOString() ?? null,
            insurerComment: c.insurerComment,
            createdByName: c.createdBy.name,
            cause: c.cpmForm?.cause ?? null, // ← map it out here
        }));
        res.json({ claims: sanitized });
    }
    catch (err) {
        next(err);
    }
};
exports.listClaims = listClaims;
// ─── Create Claim (header only) ────────────────────────────────────────────────
const createClaim = async (req, res, next) => {
    try {
        const { categoryMain, categorySub, approverId, saveAsDraft } = req.body;
        const createdById = req.user.id;
        const createdByName = req.user.name;
        const approver = await prisma_1.default.user.findUnique({
            where: { id: approverId },
            select: { name: true },
        });
        if (!approver) {
            res.status(400).json({ message: "Approver not found" });
            return;
        }
        const claim = await prisma_1.default.claim.create({
            data: {
                createdById,
                createdByName,
                approverId,
                approverName: approver.name,
                status: saveAsDraft === "true" ? client_1.ClaimStatus.DRAFT : client_1.ClaimStatus.PENDING_INSURER_REVIEW,
                categoryMain,
                categorySub,
                submittedAt: saveAsDraft === "true" ? null : new Date(),
            },
        });
        res.json({ claim });
    }
    catch (err) {
        next(err);
    }
};
exports.createClaim = createClaim;
// ─── Get Single Claim ─────────────────────────────────────────────────────────
const getClaim = async (req, res, next) => {
    try {
        const { id } = req.params;
        const claim = await prisma_1.default.claim.findUnique({
            where: { id },
            include: {
                createdBy: { select: { name: true } },
                approver: { select: { name: true } },
                attachments: true,
                cpmForm: true,
                fppa04Base: { include: { cpmVariant: true } },
            },
        });
        if (!claim) {
            res.status(404).json({ message: "Claim not found" });
            return;
        }
        res.json({ claim });
    }
    catch (err) {
        next(err);
    }
};
exports.getClaim = getClaim;
// ─── Update Claim (header + nested CPMForm upsert) ────────────────────────────
const updateClaim = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { categoryMain, categorySub, cause, approverId, status, insurerComment, } = req.body;
        const data = {
            ...(categoryMain !== undefined && { categoryMain }),
            ...(categorySub !== undefined && { categorySub }),
            ...(status !== undefined && { status }),
            ...(typeof insurerComment === "string" && { insurerComment }),
        };
        if (approverId) {
            const approver = await prisma_1.default.user.findUnique({
                where: { id: approverId },
                select: { name: true },
            });
            if (!approver) {
                res.status(400).json({ message: "Approver not found" });
                return;
            }
            Object.assign(data, {
                approverId,
                approverName: approver.name,
            });
        }
        if (cause !== undefined) {
            data.cpmForm = {
                upsert: {
                    create: {
                        accidentDate: new Date(), // replace with actual values if needed
                        accidentTime: "00:00",
                        location: "",
                        cause,
                        damageOwnType: "", // Provide a default or actual value as required
                    },
                    update: { cause },
                },
            };
        }
        const updatedClaim = await prisma_1.default.claim.update({
            where: { id },
            data,
            include: { cpmForm: true },
        });
        res.json({ claim: updatedClaim });
    }
    catch (err) {
        next(err);
    }
};
exports.updateClaim = updateClaim;
// ─── Insurance Actions ────────────────────────────────────────────────────────
const claimAction = async (req, res, next) => {
    try {
        const user = req.user;
        if (user.role !== "INSURANCE") {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        const { id } = req.params;
        const { action, comment } = req.body;
        let newStatus;
        switch (action) {
            case "approve":
                newStatus = client_1.ClaimStatus.PENDING_INSURER_FORM;
                break;
            case "reject":
                newStatus = client_1.ClaimStatus.REJECTED;
                break;
            case "request_evidence":
                newStatus = client_1.ClaimStatus.AWAITING_EVIDENCE;
                break;
            default:
                res.status(400).json({ message: "Unknown action" });
                return;
        }
        const updated = await prisma_1.default.claim.update({
            where: { id },
            data: {
                status: newStatus,
                ...(comment && { insurerComment: comment }),
            },
            include: { attachments: true },
        });
        res.json({ claim: updated });
    }
    catch (err) {
        next(err);
    }
};
exports.claimAction = claimAction;
// ─── Manager Actions ──────────────────────────────────────────────────────────
const ManagerAction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, comment } = req.body;
        if (!['approve', 'reject'].includes(action)) {
            res.status(400).json({ message: 'Invalid action' });
            return;
        }
        const newStatus = action === 'approve'
            ? client_1.ClaimStatus.PENDING_USER_CONFIRM
            : client_1.ClaimStatus.PENDING_INSURER_REVIEW;
        const updated = await prisma_1.default.claim.update({
            where: { id },
            data: {
                status: newStatus,
                insurerComment: comment,
            },
            select: { id: true, status: true, insurerComment: true }
        });
        res.json({ claim: updated });
    }
    catch (err) {
        next(err);
    }
};
exports.ManagerAction = ManagerAction;
// ─── Create CPM Form ──────────────────────────────────────────────────────────
const createCpmForm = async (req, res, next) => {
    try {
        const { claimId } = req.params;
        const body = req.body;
        await prisma_1.default.cPMForm.create({
            data: {
                claimId,
                accidentDate: new Date(body.accidentDate),
                accidentTime: body.accidentTime,
                location: body.location,
                cause: body.cause,
                policeDate: body.policeDate ? new Date(body.policeDate) : undefined,
                policeTime: body.policeTime || undefined,
                policeStation: body.policeStation || undefined,
                damageOwnType: body.damageOwnType,
                damageOtherOwn: body.damageOtherOwn || undefined,
                damageDetail: body.damageDetail || undefined,
                damageAmount: body.damageAmount ? parseFloat(body.damageAmount) : undefined,
                victimDetail: body.victimDetail || undefined,
                partnerName: body.partnerName || undefined,
                partnerPhone: body.partnerPhone || undefined,
                partnerLocation: body.partnerLocation || undefined,
                partnerDamageDetail: body.partnerDamageDetail || undefined,
                partnerDamageAmount: body.partnerDamageAmount
                    ? parseFloat(body.partnerDamageAmount)
                    : undefined,
                partnerVictimDetail: body.partnerVictimDetail || undefined,
            },
        });
        res.status(201).json({ success: true });
    }
    catch (err) {
        next(err);
    }
};
exports.createCpmForm = createCpmForm;
