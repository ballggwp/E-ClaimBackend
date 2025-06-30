// src/controllers/claimController.ts
import type { RequestHandler } from "express";
import { Prisma, ClaimStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { saveFile } from "../services/fileService";
import { format } from "date-fns";
import { fetchAzureToken, fetchUserInfoProfile } from "./authController";
// ─── List Claims ───────────────────────────────────────────────────────────────
// ─── List Claims ───────────────────────────────────
export const listClaims: RequestHandler = async (req, res, next) => {
  try {
    // read our two filters (and an optional excludeStatus)
    const { userEmail, approverId, excludeStatus } = req.query as {
      userEmail?: string
      approverId?: string
      excludeStatus?: string
    }

    // build up the Prisma `where` clause
    const where: any = {}

    if (userEmail) {
      // claims created by this email
      where.createdBy = { email: userEmail }
    }
    if (approverId) {
      // claims assigned to this approver
      where.approverId = approverId
    }
    if (excludeStatus) {
      where.status = { not: excludeStatus }
    }

    // fetch
    const dbClaims = await prisma.claim.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        docNum: true,
        approverId: true,             // so the front end can match session.user.id
        categorySub: true,
        status: true,
        createdAt: true,
        submittedAt: true,
        insurerComment: true,
        createdBy: { select: { name: true } },
        cpmForm: { select: { cause: true } },
      },
    })

    // flatten for JSON
    const claims = dbClaims.map(c => ({
      id:             c.id,
      docNum:         c.docNum,
      approverId:     c.approverId,
      categorySub:    c.categorySub,
      status:         c.status,
      createdAt:      c.createdAt.toISOString(),
      submittedAt:    c.submittedAt?.toISOString() ?? null,
      insurerComment: c.insurerComment,
      createdByName:  c.createdBy.name,
      cause:          c.cpmForm?.cause ?? null,
    }))

    res.json({ claims })
  } catch (err) {
    console.error('listClaims error:', err)
    next(err)
  }
}





// ─── Create Claim (header only) ────────────────────────────────────────────────
export const createClaim: RequestHandler = async (req, res, next) => {
  try {
    const {

      categoryMain,
      categorySub,
      approverId,
      approverEmail,
      approverPosition,
      approverName,
      saveAsDraft,
    } = req.body as {

      categoryMain: string;
      categorySub:  string;
      approverId:   string;
      approverName:string
      approverEmail: string;
      approverPosition:string,
      saveAsDraft:  string;
    };

    const createdById = req.user!.id;
const creator = await prisma.user.findUnique({ where: { id: createdById } });
if (!creator) {
  res.status(400).json({ message: `No such user: ${createdById}` });
  return;
}
    
    const createdByName = req.user!.name!;
    console.log(createdById,createdByName)
    const today = new Date();
    const ymd   = format(today, "yyMMdd");
    const prefix = `${categorySub}${ymd}`;

    // count existing
    const count = await prisma.claim.count({
      where: { docNum: { startsWith: prefix } }
    });
    const seq = String(count + 1).padStart(4, "0");
    const docNum = `${prefix}${seq}`;

    // … generate docNum, count, etc …

    const claim = await prisma.claim.create({
      data: {
        docNum,
        createdById,
        createdByName,
        approverId,
        approverName: approverName,
        approverPosition:approverPosition,
        /** ← new required field: */
        approverEmail,
        status:
          saveAsDraft === "true"
            ? ClaimStatus.DRAFT
            : ClaimStatus.PENDING_APPROVER_REVIEW,
        categoryMain,
        categorySub,
        submittedAt: saveAsDraft === "true" ? null : new Date(),
      },
    });

    res.json({ claim });
  } catch (err) {
    next(err);
  }
};


// ─── Get Single Claim ─────────────────────────────────────────────────────────
// src/controllers/claimController.ts
export const getClaim: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, id: true } },
        attachments: true,    // assuming this is a relation
        cpmForm:    true,     // relation
        fppa04Base: {          // relation
          include: {
            cpmVariant: {
              include: {
                items:       true,
                adjustments: true,
              }
            }
          }
        },
      },
    });
if (!claim) {
  res.status(404).json({ message: "Not found" });
  return;
}
    const claimWithCause = {
      ...claim.cpmForm,
      cause: claim.cpmForm?.cause ?? "",
    };
    res.json({ claim, claimWithCause });
  } catch (err) {
    next(err);
  }
};


// ─── Update Claim (header + nested CPMForm upsert) ────────────────────────────
export const updateClaim: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      categoryMain,
      categorySub,
      cause,
      approverId,
      status,
      insurerComment,
    } = req.body as {
      categoryMain?: string;
      categorySub?: string;
      cause?: string;
      approverId?: string;
      status?: ClaimStatus;
      insurerComment?: string;
    };

    const data: Prisma.ClaimUpdateInput = {
      ...(categoryMain   !== undefined && { categoryMain }),
      ...(categorySub    !== undefined && { categorySub }),
      ...(status         !== undefined && { status }),
      ...(typeof insurerComment === "string" && { insurerComment }),
    };

    if (approverId) {
      const approver = await prisma.user.findUnique({
        where:  { id: approverId },
        select: { name: true ,position:true},
      });
      if (!approver) {
        res.status(400).json({ message: "Approver not found" });
        return;
      }
      Object.assign(data, {
        approverId,
        approverName: approver.name,
        approverPosition:approver.position,
      });
    }

    if (cause !== undefined) {
      data.cpmForm = {
        upsert: {
          create: {
            accidentDate: new Date(),  // replace with actual values if needed
            accidentTime: "00:00",
            location:     "",
            cause,
            damageOwnType: "", // Provide a default or actual value as required
          },
          update: { cause },
        },
      };
    }

    const updatedClaim = await prisma.claim.update({
      where:   { id },
      data,
      include: { cpmForm: true },
    });

    res.json({ claim: updatedClaim });
  } catch (err) {
    next(err);
  }
};

// ─── Insurance Actions ────────────────────────────────────────────────────────
export const claimAction: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user!;
    if (user.role !== "INSURANCE") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const { id } = req.params;
    const { action, comment } = req.body as { action: string; comment?: string };

    let newStatus: ClaimStatus;
    switch (action) {
      case "approve":
        newStatus = ClaimStatus.PENDING_INSURER_FORM;
        break;
      case "reject":
        newStatus = ClaimStatus.REJECTED;
        break;
      case "request_evidence":
        newStatus = ClaimStatus.AWAITING_EVIDENCE;
        break;
      default:
        res.status(400).json({ message: "Unknown action" });
        return;
    }

    const updated = await prisma.claim.update({
      where: { id },
      data: {
        status: newStatus,
        ...(comment && { insurerComment: comment }),
      },
      include: { attachments: true },
    });

    res.json({ claim: updated });
  } catch (err) {
    next(err);
  }
};

// ─── Manager Actions ──────────────────────────────────────────────────────────
export const ManagerAction: RequestHandler = async (req, res, next) => {
  console.log("approve");
  try {
    const { id } = req.params;
    const { action, comment } = req.body as { action: 'approve'|'reject'; comment: string };
    if (!['approve','reject'].includes(action)) {
      res.status(400).json({ message: 'Invalid action' });
      return;
    }

    const newStatus = action === 'approve'
      ? ClaimStatus.PENDING_USER_CONFIRM
      : ClaimStatus.PENDING_INSURER_REVIEW;

    const updated = await prisma.claim.update({
      where: { id },
      data: {
        status: newStatus,
        insurerComment: comment,
      },
      select: { id: true, status: true, insurerComment: true }
    });

    res.json({ claim: updated });
  } catch (err) {
    next(err);
  }
};

// ─── Create CPM Form ──────────────────────────────────────────────────────────
// src/controllers/claimController.ts

export const createCpmForm: RequestHandler = async (req, res, next) => {
  try {
    const { claimId } = req.params;
    const now = new Date();
    if (!req.files) {
      res.status(400).json({ message: "No files uploaded" });
      return;
    }

    // Helper to normalize express-fileupload fields into an array
    const toArray = (x: any): any[] =>
  Array.isArray(x) ? x : x ? [x] : [];

const damageFiles   = toArray((req.files as any).damageFiles);
const estimateFiles = toArray((req.files as any).estimateFiles);
const otherFiles    = toArray((req.files as any).otherFiles);
const dateStamp = format(now, "yyyyMMddHHmmss");
    // First, create the CPMForm record
    const {
      accidentDate,
      accidentTime,
      location,
      cause,
      repairShop,
      repairShopLocation,
      policeDate,
      policeTime,
      policeStation,
      damageOwnType,
      damageOtherOwn,
      damageDetail,
      damageAmount,
      victimDetail,
      partnerName,
      partnerPhone,
      partnerLocation,
      partnerDamageDetail,
      partnerDamageAmount,
      partnerVictimDetail,
    } = req.body as Record<string, string>;

    await prisma.cPMForm.create({
      data: {
        claimId,
        accidentDate:   new Date(accidentDate),
        accidentTime,
        location,
        cause,
        repairShop: repairShop || null,
        repairShopLocation:repairShopLocation || null,
        policeDate:     policeDate ? new Date(policeDate) : undefined,
        policeTime:     policeTime || undefined,
        policeStation:  policeStation || undefined,
        damageOwnType,
        damageOtherOwn: damageOtherOwn || undefined,
        damageDetail:   damageDetail || undefined,
        damageAmount:   damageAmount ? parseFloat(damageAmount) : undefined,
        victimDetail:   victimDetail || undefined,
        partnerName:         partnerName || undefined,
        partnerPhone:        partnerPhone || undefined,
        partnerLocation:     partnerLocation || undefined,
        partnerDamageDetail: partnerDamageDetail || undefined,
        partnerDamageAmount: partnerDamageAmount
                                ? parseFloat(partnerDamageAmount)
                                : undefined,
        partnerVictimDetail: partnerVictimDetail || undefined,
      },
    });

    // Next, process and save attachments
    // Log each uploaded file object
    damageFiles.forEach(f => console.log("Uploaded damage file object:", f));
    estimateFiles.forEach(f => console.log("Uploaded estimate file object:", f));
    otherFiles.forEach(f => console.log("Uploaded other file object:", f));

    // inside createCpmForm, after you've saved the CPM form...
const attachCreates = [
  // damageImages
  ...damageFiles.map((f) => ({
    id:       `${claimId}-${dateStamp}-D${Math.random().toString(36).slice(2,6)}`,
    claimId,
    type: "DAMAGE_IMAGE" as const,
    fileName: f.originalname,    // ← use originalname
    url:      saveFile(f),
  })),
  // estimateDocs
  ...estimateFiles.map((f) => ({
    id:       `${claimId}-${dateStamp}-D${Math.random().toString(36).slice(2,6)}`,
    claimId,
    type: "ESTIMATE_DOC" as const,
    fileName: f.originalname,    // ← use originalname
    url:      saveFile(f),
  })),
  // otherDocuments
  ...otherFiles.map((f) => ({
    id:       `${claimId}-${dateStamp}-D${Math.random().toString(36).slice(2,6)}`,
    claimId,
    type: "OTHER_DOCUMENT" as const,
    fileName: f.originalname,    // ← use originalname
    url:      saveFile(f),
  })),
];

if (attachCreates.length) {
  await prisma.attachment.createMany({
    data: attachCreates
  });
}


    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
};
export const updateCpmForm: RequestHandler = async (req, res, next) => {
  try {
    const { claimId } = req.params;
    const now = new Date();

    // Must have at least some form data
    if (!req.body) {
      res.status(400).json({ message: "No form data" });
      return;
    }

    // Normalize files into arrays
    const toArray = (x: any): Express.Multer.File[] =>
      Array.isArray(x) ? x : x ? [x] : [];
    const damageFiles   = toArray((req.files as any).damageFiles);
    const estimateFiles = toArray((req.files as any).estimateFiles);
    const otherFiles    = toArray((req.files as any).otherFiles);

    // Destructure & parse the incoming fields
    const {
      accidentDate,
      accidentTime,
      location,
      cause,
      repairShop,
      repairShopLocation,
      policeDate,
      policeTime,
      policeStation,
      damageOwnType,
      damageOtherOwn,
      damageDetail,
      damageAmount,
      victimDetail,
      partnerName,
      partnerPhone,
      partnerLocation,
      partnerDamageDetail,
      partnerDamageAmount,
      partnerVictimDetail,
    } = req.body as Record<string,string>;

    // 1) Update the CPMForm row
    await prisma.cPMForm.update({
      where: { claimId },
      data: {
        accidentDate:   new Date(accidentDate),
        accidentTime,
        location,
        cause,
        repairShop: repairShop || null,
        repairShopLocation:repairShopLocation || null,
        policeDate:     policeDate ? new Date(policeDate) : null,
        policeTime:     policeTime || null,
        policeStation:  policeStation || null,
        damageOwnType,
        damageOtherOwn: damageOwnType === "other" ? damageOtherOwn || null : null,
        damageDetail:   damageDetail || null,
        damageAmount:   damageAmount ? parseFloat(damageAmount) : null,
        victimDetail:   victimDetail || null,
        partnerName:         partnerName || null,
        partnerPhone:        partnerPhone || null,
        partnerLocation:     partnerLocation || null,
        partnerDamageDetail: partnerDamageDetail || null,
        partnerDamageAmount: partnerDamageAmount ? parseFloat(partnerDamageAmount) : null,
        partnerVictimDetail: partnerVictimDetail || null,
      },
    });

    // 2) Prepare new attachment records
    const dateStamp = format(now, "yyyyMMddHHmmss");
    const attachCreates = [
      // DAMAGE_IMAGE
      ...damageFiles.map(f => ({
        id:       `${claimId}-${dateStamp}-D${Math.random().toString(36).slice(2,6)}`,
        claimId,
        type:     "DAMAGE_IMAGE" as const,
        fileName: f.originalname,
        url:      saveFile(f),
      })),
      // ESTIMATE_DOC
      ...estimateFiles.map(f => ({
        id:       `${claimId}-${dateStamp}-E${Math.random().toString(36).slice(2,6)}`,
        claimId,
        type:     "ESTIMATE_DOC" as const,
        fileName: f.originalname,
        url:      saveFile(f),
      })),
      // OTHER_DOCUMENT
      ...otherFiles.map(f => ({
        id:       `${claimId}-${dateStamp}-O${Math.random().toString(36).slice(2,6)}`,
        claimId,
        type:     "OTHER_DOCUMENT" as const,
        fileName: f.originalname,
        url:      saveFile(f),
      })),
    ];

    // 3) Bulk insert any new attachments
    if (attachCreates.length) {
      await prisma.attachment.createMany({ data: attachCreates });
    }
    const saveAsDraft = req.body.saveAsDraft === 'true';
    if (!saveAsDraft) {
  await prisma.claim.update({
    where: { id: claimId },
    data: {
      status: ClaimStatus.PENDING_INSURER_REVIEW,
      submittedAt: new Date(),   // also stamp when it was actually submitted
    },
  });
}

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
export const approverAction: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body as { action: 'approve' | 'reject'; comment?: string };

    // validate action
    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ message: 'Invalid action' });
      return;
    }

    // determine new status
    const newStatus = action === 'approve'
      ? ClaimStatus.PENDING_INSURER_REVIEW
      : ClaimStatus.REJECTED;

    // update claim
    const updated = await prisma.claim.update({
      where: { id },
      data: {
        status: newStatus,
        ...(comment && { insurerComment: comment }),
      },
      select: {
        id: true,
        status: true,
        insurerComment: true,
      },
    });

    res.json({ claim: updated });
  } catch (err) {
    next(err);
  }
};