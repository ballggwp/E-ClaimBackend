// src/controllers/claimController.ts
import type { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { saveFile } from "../services/fileService";
import { AttachmentType, ClaimStatus, Prisma } from "@prisma/client";

export const listClaims: RequestHandler = async (req, res, next) => {
  try {
    // อ่าน query params
    const { userEmail, excludeStatus } = req.query as {
      userEmail?: string
      excludeStatus?: string
    }

    // เริ่ม build เงื่อนไข where
    const where: any = {}

    // ถ้ามี excludeStatus ให้กรองสถานะออก
    if (excludeStatus) {
      where.status = { not: excludeStatus }
    }

    // ถ้ามี userEmail ให้กรองเฉพาะเคลมที่ createdBy.email ตรงกัน
    if (userEmail) {
      where.createdBy = { email: userEmail }
    }

    const claims = await prisma.claim.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        cause: true,
        status: true,
        createdAt: true,
        submittedAt: true,
        insurerComment: true,
        // ให้ดึงชื่อผู้สร้างมาเลย
        createdBy: { select: { name: true } },
      },
    })

    // map ชื่อ field ให้ตรงกับ front
    const sanitized = claims.map(c => ({
      id: c.id,
      cause: c.cause,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      submittedAt: c.submittedAt?.toISOString() ?? null,
      insurerComment: c.insurerComment,
      createdByName: c.createdBy.name,
    }))

    res.json({ claims: sanitized })
  } catch (err) {
    next(err)
  }
}

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
    const { id } = req.params

    const raw = await prisma.claim.findUnique({
      where: { id },
      include: {
        createdBy:   { select: { name: true } },
        approver:    { select: { name: true } },
        attachments: true,
      },
    })

    if (!raw) {
      res.status(404).json({ message: "Claim not found" });
      return;
    }

    // Flatten and format
    const claim = {
      id:              raw.id,
      status:          raw.status,
      approverId:      raw.approverId,
      approverName:    raw.approver.name,
      createdByName:   raw.createdBy.name,
      insurerComment:  raw.insurerComment,

      accidentDate:    raw.accidentDate.toISOString(),
      accidentTime:    raw.accidentTime,
      location:        raw.location,
      cause:           raw.cause,

      policeDate:      raw.policeDate?.toISOString()     ?? null,
      policeTime:      raw.policeTime                     ?? null,
      policeStation:   raw.policeStation                  ?? null,

      damageOwnType:   raw.damageOwnType,
      damageOtherOwn:  raw.damageOtherOwn,
      damageDetail:    raw.damageDetail,
      damageAmount:    raw.damageAmount?.toString()       ?? null,
      victimDetail:    raw.victimDetail,

      partnerName:         raw.partnerName,
      partnerPhone:        raw.partnerPhone,
      partnerLocation:     raw.partnerLocation,
      partnerDamageDetail: raw.partnerDamageDetail,
      partnerDamageAmount: raw.partnerDamageAmount?.toString() ?? null,
      partnerVictimDetail: raw.partnerVictimDetail,

      submittedAt: raw.submittedAt?.toISOString() ?? null,
      createdAt:   raw.createdAt.toISOString(),
      updatedAt:   raw.updatedAt.toISOString(),

      attachments: raw.attachments.map(att => ({
        id:       att.id,
        fileName: att.fileName,
        url:      att.url,
        type:     att.type,
        createdAt: att.uploadedAt.toISOString(),
      })),
    }
    res.json({ claim });
  } catch (err) {
    next(err)
  }
}



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
    const { action, comment } = req.body as { action: string; comment?: string }
    
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
      data: { status: newStatus,
        ...(comment && { insurerComment: comment }),
       },
      include: {
        attachments: true,
        // if you need other nested fields, include them too:
        // createdBy: { select: { name: true, role: true } },
        // etc.
      },

    });

    res.json({ claim: updated });
    return;  // <— again, don’t return the call, just return void
  } catch (err) {
    next(err);
  }
};
export const ManagerAction: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body as { action: 'approve'|'reject', comment: string };
    if (!['approve','reject'].includes(action)) {
      res.status(400).json({ message: 'Invalid action' });
      return;
    }
    // only allow MANAGER role here (you should have some middleware enforcing that)
    const newStatus = action === 'approve'
      ? 'PENDING_USER_CONFIRM'
      : 'PENDING_INSURER_REVIEW';
    const updated = await prisma.claim.update({
      where: { id },
      data: {
        status: newStatus,
        insurerComment: comment  // re-use this field for manager’s note
      },
      select: { id: true, status: true, insurerComment: true }
    });
    res.json({ claim: updated });
    return;
  } catch(err) {
    next(err);
  }
};