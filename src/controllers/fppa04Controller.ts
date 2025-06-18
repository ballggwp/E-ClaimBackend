import type { RequestHandler } from 'express'
import prisma from '../lib/prisma'

// GET /api/fppa04/:claimId
export const getFppa04: RequestHandler = async (req, res, next) => {
  try {
    const claimId = req.params.claimId
    const record = await prisma.fppa04.findUnique({
      where: { claimId },
      include: {
        claim: {
          select: {
            cause:        true,
            approverId:   true,
            approverName: true,
          }
        },
        items: true,
        adjustments: true,
      },
    })
    if (!record) {
      // ยังไม่มี form ให้วนไป create หน้า frontend จะเห็นฟอร์มเปล่า
      res.json({ form: null, claim: await prisma.claim.findUnique({
        where: { id: claimId },
        select: { cause: true, approverId: true, approverName: true },
      }) })
      return
    }
    res.json({ form: record, claim: record.claim })
  } catch (err) {
    next(err)
  }
}

// POST /api/fppa04/:claimId  (สร้างหรืออัปเดต)
export const upsertFppa04: RequestHandler = async (req, res, next) => {
  try {
    const claimId = req.params.claimId
    const b = req.body

    // parse arrays
    const items = Array.isArray(b.items) ? b.items : []
    const adjustments = Array.isArray(b.adjustments) ? b.adjustments : []
    const signatures = Array.isArray(b.signatureFiles)
      ? b.signatureFiles
      : []

    const record = await prisma.fppa04.upsert({
      where: { claimId },
      create: {
        claimId,
        eventType:         b.eventType,
        claimRefNumber:    b.claimRefNumber,
        eventDescription:  b.eventDescription,
        productionYear:    parseInt(b.productionYear),
        accidentDate:      new Date(b.accidentDate),
        reportedDate:      new Date(b.reportedDate),
        receivedDocDate:   new Date(b.receivedDocDate),
        company:           b.company,
        factory:           b.factory,
        policyNumber:      b.policyNumber,
        surveyorRefNumber: b.surveyorRefNumber,
        items: {
          create: items.map((it:any) => ({
            category:    it.category,
            description: it.description,
            total:       parseFloat(it.total),
            exception:   parseFloat(it.exception),
          }))
        },
        adjustments: {
          create: adjustments.map((a:any) => ({
            type:        a.type,
            description: a.description,
            amount:      parseFloat(a.amount),
          }))
        },
        signatureFiles: signatures,
      },
      update: {
        eventType:         b.eventType,
        claimRefNumber:    b.claimRefNumber,
        eventDescription:  b.eventDescription,
        productionYear:    parseInt(b.productionYear),
        accidentDate:      new Date(b.accidentDate),
        reportedDate:      new Date(b.reportedDate),
        receivedDocDate:   new Date(b.receivedDocDate),
        company:           b.company,
        factory:           b.factory,
        policyNumber:      b.policyNumber,
        surveyorRefNumber: b.surveyorRefNumber,
        items: {
          deleteMany: {},
          create: items.map((it:any) => ({
            category:    it.category,
            description: it.description,
            total:       parseFloat(it.total),
            exception:   parseFloat(it.exception),
          }))
        },
        adjustments: {
          deleteMany: {},
          create: adjustments.map((a:any) => ({
            type:        a.type,
            description: a.description,
            amount:      parseFloat(a.amount),
          }))
        },
        signatureFiles: signatures,
      },
      include: { claim: { select: { cause: true, approverName: true } }, items: true, adjustments: true },
    })

    res.json({ form: record, claim: record.claim })
  } catch (err) {
    next(err)
  }
}
export const listPendingFppa04: RequestHandler = async (req, res, next) => {
  try {
    const raw = await prisma.claim.findMany({
      where: { status: "PENDING_INSURER_FORM" },
      select: {
        id: true,
        cause: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
    res.json({ claims: raw })
  } catch (err) { next(err) }
}
