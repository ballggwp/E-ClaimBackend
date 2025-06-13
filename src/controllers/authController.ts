// src/controllers/authController.ts
import type { RequestHandler } from 'express'
import prisma from '../lib/prisma'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    // bad credentials → send 401 then exit
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    // good credentials → sign token and send
    const token = jwt.sign(
      { id: user.id, role: user.role,name:user.name },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    )

    res.json({
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        position : user.position
      },
      token,
    })
    // no `return res.json(...)`
  } catch (err) {
    // pass errors to express error handler
    next(err)
  }
}

export const register: RequestHandler = async (req, res, next) => {
  try {
    const { name, email, password } = req.body as {
      name: string
      email: string
      password: string
      position:string
    }

    // 1) Validate input
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email and password are required' })
      return
    }

    // 2) Check for existing email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ message: 'Email already in use' })
      return
    }

    // 3) Hash password
    const hashed = await bcrypt.hash(password, 10)

    // 4) Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'USER',
        position: req.body.position || 'EMPLOYEE', // Default to EMPLOYEE if not provided
      },
      select: {
        id:    true,
        name:  true,
        email: true,
        role:  true,
        position :true,
      },
    })

    // 5) Optionally issue JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    )

    // Send the response (don't `return res.json`)
    res.status(201).json({ user, token })
    return
  } catch (err) {
    next(err)
  }
}