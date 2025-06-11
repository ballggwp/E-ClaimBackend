// src/middleware/authMiddleware.ts
import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string }
    }
  }
}

const authMiddleware: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization?.split(' ')
  if (!header || header[0] !== 'Bearer') {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }
  try {
    const payload = jwt.verify(header[1], process.env.JWT_SECRET!) as any
    req.user = { id: payload.id, role: payload.role }
    next()
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
}

export default authMiddleware
