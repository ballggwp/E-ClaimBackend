// src/routes/users.ts
import { Router } from 'express'
import { listUsers } from '../controllers/userController'
import authMiddleware from '../middleware/authMiddleware'

const router = Router()


// GET http://localhost:5000/api/users
router.get('/', listUsers)

export default router
