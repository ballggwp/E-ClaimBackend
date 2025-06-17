// src/controllers/claimController.ts
import type { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { saveFile } from "../services/fileService";
import { AttachmentType, ClaimStatus, Prisma } from "@prisma/client";

export const listClaims: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const isInsurer = req.user.role === "INSURANCE";

    // build a WHERE that
    // ─ if INSURANCE → exclude DRAFT and exclude claims *created by* INSURANCE
    // ─ otherwise → only your own claims
    const where: Prisma.ClaimWhereInput = isInsurer
      ? {
          status:        { not: "DRAFT" },
          createdBy:     { role: { not: "INSURANCE" } },
        }
      : {
          createdById:   req.user.id,
        };

    const raw = await prisma.claim.findMany({
      where,
      select: {
        id:          true,
        status:      true,
        submittedAt: true,
        createdAt:   true,
        cause:       true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ claims: raw });
    return;
  } catch (err) {
    next(err);
  }
};

export const createClaim: RequestHandler = async (req, res, next) => {
  try {
    const b = req.body as Record<string, any>;
    console.log("BODY:", req.body); // <--- add this
    console.log("FILES:", req.files);
    const userId = req.user!.id;
    const createdByName = req.user!.name;
    const saveAsDraft = b.saveAsDraft === "true";

    // fetch approver’s name
    const approverUser = await prisma.user.findUnique({
      where: { id: b.approverId },
      select: { name: true },
    });
    if (!approverUser) {
      res.status(400).json({ message: "Invalid approverId" });
      return;
    }
    const approverName = approverUser.name;

    // handle files
    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;
    const damageFiles = files?.damageFiles ?? [];
    const estimateFiles = files?.estimateFiles ?? [];
    const otherFiles = files?.otherFiles ?? [];
    const accidentDate = b.accidentDate
      ? new Date(b.accidentDate)
      : new Date()
    const accidentTime = b.accidentTime || ""
    const dfUrls = await Promise.all(damageFiles.map((f) => saveFile(f)));
    const efUrls = await Promise.all(estimateFiles.map((f) => saveFile(f)));
    const ofUrls = await Promise.all(otherFiles.map((f) => saveFile(f)));
    console.log("👷 data for createClaim:", {
      createdById: userId,
      createdByName,
      approverId: b.approverId,
      approverName,
      // you can include one or two other fields to confirm
    });
    const newStatus = saveAsDraft ? "DRAFT" : "PENDING_INSURER_REVIEW";
    const claim = await prisma.claim.create({
      data: {
        createdById: userId,
        approverId: b.approverId,
        createdByName,
        approverName,
        status: newStatus as any,              // cast to ClaimStatus
        submittedAt: saveAsDraft
          ? null
          : new Date(),
        accidentDate,
        accidentTime,
        location: b.location,
        cause: b.cause,
        policeDate: b.policeDate ? new Date(b.policeDate) : null,
        policeTime: b.policeTime,
        policeStation: b.policeStation,
        damageOwnType: b.damageOwnType,
        damageOtherOwn: b.damageOtherOwn,
        damageAmount: b.damageAmount ? parseFloat(b.damageAmount) : null,
        damageDetail: b.damageDetail,
        victimDetail: b.victimDetail,
        partnerName: b.partnerName,
        partnerPhone: b.partnerPhone,
        partnerLocation: b.partnerLocation,
        partnerDamageDetail: b.partnerDamageDetail,
        partnerDamageAmount: b.partnerDamageAmount
          ? parseFloat(b.partnerDamageAmount)
          : null,
        partnerVictimDetail: b.partnerVictimDetail,
        attachments: {
          create: [
            ...dfUrls.map((url) => ({
              type: AttachmentType.DAMAGE_IMAGE,
              fileName: url.split("/").pop()!,
              url,
            })),
            ...efUrls.map((url) => ({
              type: AttachmentType.ESTIMATE_DOC,
              fileName: url.split("/").pop()!,
              url,
            })),
            ...ofUrls.map((url) => ({
              type: AttachmentType.OTHER_DOCUMENT,
              fileName: url.split("/").pop()!,
              url,
            })),
          ],
        },
      },
      include: { attachments: true },
    });

    res.status(201).json({ success: true, claim });
  } catch (err) {
    next(err);
  }
};

export const getClaim: RequestHandler = async (req, res, next) => {
  try {
    const raw = await prisma.claim.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { name: true } },
        approver:  { select: { name: true } },
        attachments: true,
        fppa04: {
          include: { items: true }
        },
      },
    });

    if (!raw) {
      res.status(404).json({ message: "Claim not found" });
      return;
    }

    // pull out the nested bits and flatten
    const {
      createdBy,
      approver,
      // everything else (accidentDate, location, etc)
      ...rest
    } = raw;

    // Build the response object
    const claim = {
      ...rest,
      createdByName: createdBy.name,
      approverName:  approver.name,

      // if you want, convert Date objects to ISO strings:
      accidentDate:  rest.accidentDate.toISOString(),
      // and similarly for policeDate, submittedAt, createdAt, etc:
      policeDate:    rest.policeDate?.toISOString() ?? null,
      submittedAt:   rest.submittedAt?.toISOString() ?? null,
      createdAt:     rest.createdAt.toISOString(),
      updatedAt:     rest.updatedAt.toISOString(),
    };

    res.json({ claim });
  } catch (err) {
    next(err);
  }
};
export const updateClaim: RequestHandler = async (req, res, next) => {
  try {
    const claimId = req.params.id;
    const b = req.body;
    const saveAsDraft = b.saveAsDraft === 'true';

    // fetch approver’s name (same as create)
    const approver = await prisma.user.findUnique({
      where: { id: b.approverId },
      select: { name: true }
    });
    if (!approver) {
      res.status(400).json({ message: 'Invalid approverId' });
      return;
    }
    const approverName = approver.name;
    const createdByName = req.user!.name;

    // handle new files
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const damageFiles   = files?.damageFiles   ?? [];
    const estimateFiles = files?.estimateFiles ?? [];
    const otherFiles    = files?.otherFiles    ?? [];

    const dfUrls = await Promise.all(damageFiles.map(f => saveFile(f)));
    const efUrls = await Promise.all(estimateFiles.map(f => saveFile(f)));
    const ofUrls = await Promise.all(otherFiles.map(f => saveFile(f)));

    // perform the update
    const updated = await prisma.claim.update({
      where: { id: claimId },
      data: {
        approverId:    b.approverId,
        approverName,
        status:        saveAsDraft ? 'DRAFT' : 'PENDING_INSURER_REVIEW',
        submittedAt:   saveAsDraft ? null : new Date(),
        accidentDate:  new Date(b.accidentDate),
        accidentTime:  b.accidentTime,
        location:      b.location,
        cause:         b.cause,
        policeDate:    b.policeDate ? new Date(b.policeDate) : null,
        policeTime:    b.policeTime,
        policeStation: b.policeStation,
        damageOwnType: b.damageOwnType,
        damageOtherOwn:b.damageOtherOwn,
        damageAmount:  b.damageAmount ? parseFloat(b.damageAmount) : null,
        damageDetail:  b.damageDetail,
        victimDetail:  b.victimDetail,
        partnerName:         b.partnerName,
        partnerPhone:        b.partnerPhone,
        partnerLocation:     b.partnerLocation,
        partnerDamageDetail: b.partnerDamageDetail,
        partnerDamageAmount: b.partnerDamageAmount ? parseFloat(b.partnerDamageAmount) : null,
        partnerVictimDetail: b.partnerVictimDetail,
        // append any newly uploaded attachments
        attachments: {
          create: [
            ...dfUrls.map(url => ({ type: AttachmentType.DAMAGE_IMAGE,   fileName: url.split('/').pop()!, url })),
            ...efUrls.map(url => ({ type: AttachmentType.ESTIMATE_DOC,   fileName: url.split('/').pop()!, url })),
            ...ofUrls.map(url => ({ type: AttachmentType.OTHER_DOCUMENT, fileName: url.split('/').pop()!, url })),
          ]
        }
      },
      include: { attachments: true }
    });

    res.json({ success: true, claim: updated });
  } catch (err) {
    next(err);
  }
  
};
export const claimAction: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user!;
    if (user.role !== "INSURANCE") {
      res.status(403).json({ message: "Forbidden" });
      return;  // <— stop here, but don't return res.json itself
    }

    const { id } = req.params;
    const { action } = req.body as { action?: string };

    if (!action) {
      res.status(400).json({ message: "Missing action" });
      return;
    }

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
      data: { status: newStatus },
    });

    res.json({ claim: updated });
    return;  // <— again, don’t return the call, just return void
  } catch (err) {
    next(err);
  }
};
