import { Router }   from 'express'
import authMiddleware from '../middleware/authMiddleware'
import { listClaims, createClaim } from '../controllers/claimController'
import multer from 'multer'

const upload = multer({ dest: 'temp/' })
const router = Router()

// ตรงนี้จะไม่ error แล้ว
router.use(authMiddleware)

router.get('/', listClaims)
router.post(
  '/',
  upload.fields([
    { name: 'damageFiles' },
    { name: 'estimateFiles' },
    { name: 'otherFiles' },
  ]),
  createClaim
)

export default router
