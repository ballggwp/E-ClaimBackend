// src/controllers/userController.ts
import type { RequestHandler } from 'express'
import prisma from '../lib/prisma'

export const listUsers: RequestHandler = async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true,password:true ,position:true },
    })
    res.json({ users })
  } catch (err) {
    next(err)
  }
}
