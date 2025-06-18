import { Router } from 'express'
import { ensureAuth } from '../middleware/authMiddleware'
import { getFppa04, upsertFppa04,listPendingFppa04 } from '../controllers/fppa04Controller'

const router = Router()

// ทั้ง read & write ต้องล็อกอิน
router.use(ensureAuth)

router.get('/:claimId', getFppa04)
router.post('/:claimId', upsertFppa04)
router.get("/", listPendingFppa04)

export default router
