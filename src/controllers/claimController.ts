// src/controllers/claimController.ts
import type { RequestHandler } from 'express'
import prisma from '../lib/prisma'
import { saveFile } from '../services/fileService'

export const listClaims: RequestHandler = async (req, res, next) => {
  try {
    const claims = await prisma.claim.findMany({
      where: { createdById: req.user!.id },
      include: {
        attachments: true,
        fppa04: { include: { items: true } },
        approver: true            // ดึงข้อมูล approver ด้วย
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ claims })
  } catch (err) {
    next(err)
  }
}

export const createClaim: RequestHandler = async (req, res, next) => {
  try {
    const b = req.body

    // แปลงไฟล์ -> บันทึกไป uploads แล้วคืน URL
    const df = (req.files as any).damageFiles?.map(saveFile) || []
    const ef = (req.files as any).estimateFiles?.map(saveFile) || []
    const of = (req.files as any).otherFiles?.map(saveFile) || []

    const claim = await prisma.claim.create({
      data: {
        createdById: req.user!.id,
        approverId: b.approverId,      // เปลี่ยนจาก insuranceId เป็น approverId
        status: 'DRAFT',
        submittedAt: new Date(),
        accidentDate: new Date(b.accidentDate),
        accidentTime: b.accidentTime,
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
        partnerDamageAmount: b.partnerDamageAmount ? parseFloat(b.partnerDamageAmount) : null,
        partnerVictimDetail: b.partnerVictimDetail,
        attachments: {
          create: [
            ...df.map((url: string) => ({
              type: 'DAMAGE_IMAGE' as const,
              fileName: url.split('/').pop()!,
              url,
            })),
            ...ef.map((url: string) => ({
              type: 'ESTIMATE_DOC' as const,
              fileName: url.split('/').pop()!,
              url,
            })),
            ...of.map((url: string) => ({
              type: 'OTHER_DOCUMENT' as const,
              fileName: url.split('/').pop()!,
              url,
            })),
          ],
        },
      },
      include: {
        attachments: true,
      },
    })

    res.json({ success: true, claim })
  } catch (err) {
    next(err)
  }
}
