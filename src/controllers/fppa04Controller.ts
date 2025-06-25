// src/controllers/fppa04Controller.ts
import type { RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

// ─── Create FPPA-04 Base ───────────────────────────────────────────────────────
export const createFppa04Base: RequestHandler = async (req, res, next) => {
  try {
    const { claimId, categoryMain, categorySub } = req.body as {
      claimId: string
      categoryMain: string
      categorySub: string
    }
    console.log(claimId,categoryMain,categorySub)
    if (!claimId || !categoryMain || !categorySub) {
      res.status(400).json({ message: 'claimId, categoryMain and categorySub are required' });
      return;
    }

    const base = await prisma.fppa04Base.upsert({
      where: { claimId },
      create: {
        claimId,
        mainType: categoryMain,
        subType:  categorySub,
      },
      update: {
        // if you ever want to allow changing categoryMain/Sub on an existing record,
        // put those fields here.  Otherwise, leave this empty to just leave the existing row untouched:
      },
    });
    res.status(200).json({ base });
    return;
  } catch (err) {
    next(err);
  }
}

// ─── Get FPPA-04 Base (with CPM variant) ──────────────────────────────────────
export const getFppa04Base: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params  // this is the claimId (not the auto-PK of the base)
    const base = await prisma.fppa04Base.findUnique({
      where: { claimId: id },
      include: {
        claim: {
          select: {
            id:           true,
            approverName: true,
            status:       true,
            categoryMain: true,
            categorySub:  true,
          }
        },
        cpmVariant: {
          include: {
            items:       true,
            adjustments: true,
          }
        }
      }
    })

    if (!base) {
      res.status(404).json({ message: "FPPA-04 base not found" })
      return
    }

    // even if base.cpmVariant is null, we return it as `form: null`
    res.json({
      form:  base.cpmVariant,   // may be null on brand-new
      claim: base.claim
    })
  } catch (err) {
    next(err)
  }
}

// ─── Update FPPA-04 Base ───────────────────────────────────────────────────────
export const updateFppa04Base: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { mainType, subType } = req.body as {
      mainType?: string;
      subType?: string;
    };

    const data: Prisma.Fppa04BaseUpdateInput = {
      ...(mainType !== undefined && { mainType }),
      ...(subType  !== undefined && { subType }),
    };

    const updated = await prisma.fppa04Base.update({
      where: { id },
      data,
    });
    res.json({ base: updated });
  } catch (err) {
    next(err);
  }
};

// ─── Create / Update CPM Variant ───────────────────────────────────────────────
// POST   /api/fppa04/:id/cpm
export const createFppa04Cpm: RequestHandler = async (req, res, next) => {
  try {
    const baseId = req.params.id;
    const body = req.body as {
      eventType: string;
      claimRefNumber: string;
      eventDescription: string;
      productionYear: number;
      accidentDate: string;
      reportedDate: string;
      receivedDocDate: string;
      company: string;
      factory: string;
      policyNumber: string;
      surveyorRefNumber: string;
      netAmount: number;
      signatureFiles: string[];
    };

    const variant = await prisma.fppa04CPM.create({
      data: {
        baseId,
        eventType:         body.eventType,
        claimRefNumber:    body.claimRefNumber,
        eventDescription:  body.eventDescription,
        productionYear:    body.productionYear,
        accidentDate:      new Date(body.accidentDate),
        reportedDate:      new Date(body.reportedDate),
        receivedDocDate:   new Date(body.receivedDocDate),
        company:           body.company,
        factory:           body.factory,
        policyNumber:      body.policyNumber,
        surveyorRefNumber: body.surveyorRefNumber,
        netAmount:         body.netAmount,
        signatureFiles:    body.signatureFiles,
      },
    });

    res.status(201).json({ variant });
  } catch (err) {
    next(err);
  }
};

// PATCH  /api/fppa04/:id/cpm
export const updateFppa04Cpm: RequestHandler = async (req, res, next) => {
  try {
    const baseId = req.params.id;
    const body = req.body as Partial<{
      eventType: string;
      claimRefNumber: string;
      eventDescription: string;
      productionYear: number;
      accidentDate: string;
      reportedDate: string;
      receivedDocDate: string;
      company: string;
      factory: string;
      policyNumber: string;
      surveyorRefNumber: string;
      netAmount: number;
      signatureFiles: string[];
    }>;

    const data: Prisma.Fppa04CPMUpdateInput = {
      ...(body.eventType         && { eventType: body.eventType }),
      ...(body.claimRefNumber    && { claimRefNumber: body.claimRefNumber }),
      ...(body.eventDescription  && { eventDescription: body.eventDescription }),
      ...(body.productionYear    !== undefined && { productionYear: body.productionYear }),
      ...(body.accidentDate      && { accidentDate: new Date(body.accidentDate) }),
      ...(body.reportedDate      && { reportedDate: new Date(body.reportedDate) }),
      ...(body.receivedDocDate   && { receivedDocDate: new Date(body.receivedDocDate) }),
      ...(body.company           && { company: body.company }),
      ...(body.factory           && { factory: body.factory }),
      ...(body.policyNumber      && { policyNumber: body.policyNumber }),
      ...(body.surveyorRefNumber && { surveyorRefNumber: body.surveyorRefNumber }),
      ...(body.netAmount         !== undefined && { netAmount: body.netAmount }),
      ...(body.signatureFiles    && { signatureFiles: body.signatureFiles }),
    };

    const updated = await prisma.fppa04CPM.update({
      where: { baseId },
      data,
    });
    res.json({ variant: updated });
  } catch (err) {
    next(err);
  }
};

// ─── Items CRUD under CPM Variant ──────────────────────────────────────────────
// POST   /api/fppa04/:id/items
export const addFppa04Item: RequestHandler = async (req, res, next) => {
  try {
    const baseId = req.params.id;
    const { category, description, total, exception } = req.body as {
      category: string;
      description: string;
      total: number;
      exception: number;
    };
    const item = await prisma.fppa04ItemCPM.create({
      data: { baseId, category, description, total, exception },
    });
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
};

// PATCH  /api/fppa04/:id/items/:itemId
export const updateFppa04Item: RequestHandler = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const body = req.body as Partial<{
      category: string;
      description: string;
      total: number;
      exception: number;
    }>;
    const data: Prisma.Fppa04ItemCPMUpdateInput = {
      ...(body.category    && { category: body.category }),
      ...(body.description && { description: body.description }),
      ...(body.total       !== undefined && { total: body.total }),
      ...(body.exception   !== undefined && { exception: body.exception }),
    };
    const item = await prisma.fppa04ItemCPM.update({
      where: { id: itemId },
      data,
    });
    res.json({ item });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/fppa04/:id/items/:itemId
export const deleteFppa04Item: RequestHandler = async (req, res, next) => {
  try {
    await prisma.fppa04ItemCPM.delete({ where: { id: req.params.itemId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// ─── Adjustments CRUD under CPM Variant ────────────────────────────────────────
// POST   /api/fppa04/:id/adjustments
export const addFppa04Adjustment: RequestHandler = async (req, res, next) => {
  try {
    const baseId = req.params.id;
    const { type, description, amount } = req.body as {
      type: string;
      description: string;
      amount: number;
    };
    const adj = await prisma.fppa04AdjustmentCPM.create({
      data: { baseId, type, description, amount },
    });
    res.status(201).json({ adjustment: adj });
  } catch (err) {
    next(err);
  }
};

// PATCH  /api/fppa04/:id/adjustments/:adjId
export const updateFppa04Adjustment: RequestHandler = async (req, res, next) => {
  try {
    const { adjId } = req.params;
    const body = req.body as Partial<{
      type: string;
      description: string;
      amount: number;
    }>;
    const data: Prisma.Fppa04AdjustmentCPMUpdateInput = {
      ...(body.type        && { type: body.type }),
      ...(body.description && { description: body.description }),
      ...(body.amount      !== undefined && { amount: body.amount }),
    };
    const adj = await prisma.fppa04AdjustmentCPM.update({
      where: { id: adjId },
      data,
    });
    res.json({ adjustment: adj });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/fppa04/:id/adjustments/:adjId
export const deleteFppa04Adjustment: RequestHandler = async (req, res, next) => {
  try {
    await prisma.fppa04AdjustmentCPM.delete({ where: { id: req.params.adjId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const listFppa04: RequestHandler = async (req, res, next) => {
  try {
    
    const { categoryMain, categorySub } = req.query as {
      categoryMain?: string
      categorySub?: string
    }


    // build a dynamic filter
    const where: any = {}
    if (categoryMain) where.mainType = categoryMain
    if (categorySub)  where.subType  = categorySub

    const claims = await prisma.fppa04Base.findMany({
      where,
      select: {
        claimId: true,
        // include any other fields you need, e.g. cause, createdAt
        claim: { select: { createdAt: true } },
      },
    })

    // flatten if you prefer ClaimSummary shape
    const formatted = claims.map(c => ({
      id: c.claimId,
      createdAt: c.claim.createdAt,
    }))

    res.json({ claims: formatted })
  } catch (err) {
    next(err)
  }
}
