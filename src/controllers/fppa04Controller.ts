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
            status:       true,
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
    const b = req.body as Record<string, any>

    // -- PARSE ARRAYS --
    const rawItems: string[] = b.items
      ? Array.isArray(b.items)
        ? b.items
        : [b.items]
      : []

    // 2) Parse JSON & sanitize
    const itemsData = rawItems.map(s => {
      const it = JSON.parse(s)
      return {
        category:    it.category,
        description: it.description,
        total:       parseFloat(it.total   ?? "") || 0,
        exception:   parseFloat(it.exception ?? "") || 0,
      }
    })

    // 3) Do the same for adjustments!
    const rawAdjs: string[] = b.adjustments
      ? Array.isArray(b.adjustments)
        ? b.adjustments
        : [b.adjustments]
      : []

    const adjsData = rawAdjs.map(s => {
      const a = JSON.parse(s)
      return {
        type:        a.type,
        description: a.description,
        amount:      parseFloat(a.amount ?? "") || 0,
      }
    })

    // -- SIGNATURE FILES (multer diskStorage → public/uploads) --
    const files = (req.files as Express.Multer.File[]) || []
    const signatureFiles = files.map(f => `/uploads/${f.filename}`)

    // -- UP S E R T --
    const record = await prisma.fppa04.upsert({
      where: { claimId },
      create: {
        claimId:         claimId,
        eventType:       b.eventType,
        claimRefNumber:  b.claimRefNumber,
        eventDescription:b.eventDescription,
        productionYear:  parseInt(b.productionYear, 10),
        accidentDate:    new Date(b.accidentDate),
        reportedDate:    new Date(b.reportedDate),
        receivedDocDate: new Date(b.receivedDocDate),
        company:         b.company,
        factory:         b.factory,
        policyNumber:    b.policyNumber,
        surveyorRefNumber:b.surveyorRefNumber,
        netAmount:       parseFloat(b.netAmount) || 0,

        // 🔥 here we nest-create your items & adjustments
        items: {
          create: itemsData
        },
        adjustments: {
          create: adjsData
        },
        signatureFiles,
      },
      update: {
        eventType:       b.eventType,
        claimRefNumber:  b.claimRefNumber,
        eventDescription:b.eventDescription,
        productionYear:  parseInt(b.productionYear, 10),
        accidentDate:    new Date(b.accidentDate),
        reportedDate:    new Date(b.reportedDate),
        receivedDocDate: new Date(b.receivedDocDate),
        company:         b.company,
        factory:         b.factory,
        policyNumber:    b.policyNumber,
        surveyorRefNumber:b.surveyorRefNumber,
        netAmount:       parseFloat(b.netAmount) || 0,

        // 🔥 delete ALL old children, then re-create exactly what you passed
        items: {
          deleteMany: {},
          create:     itemsData
        },
        adjustments: {
          deleteMany: {},
          create:     adjsData
        },
        signatureFiles,
      },
      include: {
        claim:       { select: { cause: true, approverName: true } },
        items:       true,
        adjustments: true,
      }
    })
    await prisma.claim.update({
      where: { id: claimId },
      data: { status: 'PENDING_MANAGER_REVIEW' }
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
