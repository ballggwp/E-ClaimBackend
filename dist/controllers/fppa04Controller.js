"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFppa04Adjustment = exports.updateFppa04Adjustment = exports.addFppa04Adjustment = exports.deleteFppa04Item = exports.updateFppa04Item = exports.addFppa04Item = exports.updateFppa04Cpm = exports.createFppa04Cpm = exports.updateFppa04Base = exports.getFppa04Base = exports.createFppa04Base = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// ─── Create FPPA-04 Base ───────────────────────────────────────────────────────
const createFppa04Base = async (req, res, next) => {
    try {
        const { claimId, mainType, subType } = req.body;
        // ensure claim exists
        const claim = await prisma_1.default.claim.findUnique({ where: { id: claimId } });
        if (!claim) {
            res.status(404).json({ message: "Claim not found" });
            return;
        }
        const base = await prisma_1.default.fppa04Base.create({
            data: { claimId, mainType, subType },
        });
        res.status(201).json({ base });
    }
    catch (err) {
        next(err);
    }
};
exports.createFppa04Base = createFppa04Base;
// ─── Get FPPA-04 Base (with CPM variant) ──────────────────────────────────────
const getFppa04Base = async (req, res, next) => {
    try {
        const { id } = req.params; // this is the base.id
        const base = await prisma_1.default.fppa04Base.findUnique({
            where: { id },
            include: {
                cpmVariant: {
                    include: {
                        items: true,
                        adjustments: true,
                    },
                },
                claim: { select: { id: true, categoryMain: true, categorySub: true } },
            },
        });
        if (!base) {
            res.status(404).json({ message: "FPPA-04 record not found" });
            return;
        }
        res.json({ base });
    }
    catch (err) {
        next(err);
    }
};
exports.getFppa04Base = getFppa04Base;
// ─── Update FPPA-04 Base ───────────────────────────────────────────────────────
const updateFppa04Base = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { mainType, subType } = req.body;
        const data = {
            ...(mainType !== undefined && { mainType }),
            ...(subType !== undefined && { subType }),
        };
        const updated = await prisma_1.default.fppa04Base.update({
            where: { id },
            data,
        });
        res.json({ base: updated });
    }
    catch (err) {
        next(err);
    }
};
exports.updateFppa04Base = updateFppa04Base;
// ─── Create / Update CPM Variant ───────────────────────────────────────────────
// POST   /api/fppa04/:id/cpm
const createFppa04Cpm = async (req, res, next) => {
    try {
        const baseId = req.params.id;
        const body = req.body;
        const variant = await prisma_1.default.fppa04CPM.create({
            data: {
                baseId,
                eventType: body.eventType,
                claimRefNumber: body.claimRefNumber,
                eventDescription: body.eventDescription,
                productionYear: body.productionYear,
                accidentDate: new Date(body.accidentDate),
                reportedDate: new Date(body.reportedDate),
                receivedDocDate: new Date(body.receivedDocDate),
                company: body.company,
                factory: body.factory,
                policyNumber: body.policyNumber,
                surveyorRefNumber: body.surveyorRefNumber,
                netAmount: body.netAmount,
                signatureFiles: body.signatureFiles,
            },
        });
        res.status(201).json({ variant });
    }
    catch (err) {
        next(err);
    }
};
exports.createFppa04Cpm = createFppa04Cpm;
// PATCH  /api/fppa04/:id/cpm
const updateFppa04Cpm = async (req, res, next) => {
    try {
        const baseId = req.params.id;
        const body = req.body;
        const data = {
            ...(body.eventType && { eventType: body.eventType }),
            ...(body.claimRefNumber && { claimRefNumber: body.claimRefNumber }),
            ...(body.eventDescription && { eventDescription: body.eventDescription }),
            ...(body.productionYear !== undefined && { productionYear: body.productionYear }),
            ...(body.accidentDate && { accidentDate: new Date(body.accidentDate) }),
            ...(body.reportedDate && { reportedDate: new Date(body.reportedDate) }),
            ...(body.receivedDocDate && { receivedDocDate: new Date(body.receivedDocDate) }),
            ...(body.company && { company: body.company }),
            ...(body.factory && { factory: body.factory }),
            ...(body.policyNumber && { policyNumber: body.policyNumber }),
            ...(body.surveyorRefNumber && { surveyorRefNumber: body.surveyorRefNumber }),
            ...(body.netAmount !== undefined && { netAmount: body.netAmount }),
            ...(body.signatureFiles && { signatureFiles: body.signatureFiles }),
        };
        const updated = await prisma_1.default.fppa04CPM.update({
            where: { baseId },
            data,
        });
        res.json({ variant: updated });
    }
    catch (err) {
        next(err);
    }
};
exports.updateFppa04Cpm = updateFppa04Cpm;
// ─── Items CRUD under CPM Variant ──────────────────────────────────────────────
// POST   /api/fppa04/:id/items
const addFppa04Item = async (req, res, next) => {
    try {
        const baseId = req.params.id;
        const { category, description, total, exception } = req.body;
        const item = await prisma_1.default.fppa04ItemCPM.create({
            data: { baseId, category, description, total, exception },
        });
        res.status(201).json({ item });
    }
    catch (err) {
        next(err);
    }
};
exports.addFppa04Item = addFppa04Item;
// PATCH  /api/fppa04/:id/items/:itemId
const updateFppa04Item = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const body = req.body;
        const data = {
            ...(body.category && { category: body.category }),
            ...(body.description && { description: body.description }),
            ...(body.total !== undefined && { total: body.total }),
            ...(body.exception !== undefined && { exception: body.exception }),
        };
        const item = await prisma_1.default.fppa04ItemCPM.update({
            where: { id: itemId },
            data,
        });
        res.json({ item });
    }
    catch (err) {
        next(err);
    }
};
exports.updateFppa04Item = updateFppa04Item;
// DELETE /api/fppa04/:id/items/:itemId
const deleteFppa04Item = async (req, res, next) => {
    try {
        await prisma_1.default.fppa04ItemCPM.delete({ where: { id: req.params.itemId } });
        res.status(204).end();
    }
    catch (err) {
        next(err);
    }
};
exports.deleteFppa04Item = deleteFppa04Item;
// ─── Adjustments CRUD under CPM Variant ────────────────────────────────────────
// POST   /api/fppa04/:id/adjustments
const addFppa04Adjustment = async (req, res, next) => {
    try {
        const baseId = req.params.id;
        const { type, description, amount } = req.body;
        const adj = await prisma_1.default.fppa04AdjustmentCPM.create({
            data: { baseId, type, description, amount },
        });
        res.status(201).json({ adjustment: adj });
    }
    catch (err) {
        next(err);
    }
};
exports.addFppa04Adjustment = addFppa04Adjustment;
// PATCH  /api/fppa04/:id/adjustments/:adjId
const updateFppa04Adjustment = async (req, res, next) => {
    try {
        const { adjId } = req.params;
        const body = req.body;
        const data = {
            ...(body.type && { type: body.type }),
            ...(body.description && { description: body.description }),
            ...(body.amount !== undefined && { amount: body.amount }),
        };
        const adj = await prisma_1.default.fppa04AdjustmentCPM.update({
            where: { id: adjId },
            data,
        });
        res.json({ adjustment: adj });
    }
    catch (err) {
        next(err);
    }
};
exports.updateFppa04Adjustment = updateFppa04Adjustment;
// DELETE /api/fppa04/:id/adjustments/:adjId
const deleteFppa04Adjustment = async (req, res, next) => {
    try {
        await prisma_1.default.fppa04AdjustmentCPM.delete({ where: { id: req.params.adjId } });
        res.status(204).end();
    }
    catch (err) {
        next(err);
    }
};
exports.deleteFppa04Adjustment = deleteFppa04Adjustment;
