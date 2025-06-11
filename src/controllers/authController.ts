import type { RequestHandler } from 'express'
import prisma from '../lib/prisma'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { username, password } = req.body
    const user = await prisma.user.findUnique({ where: { email: username } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    )
    res.json({ user: { id: user.id, name: user.name, role: user.role }, token })
    return
  } catch (err) {
    next(err)
  }
}
