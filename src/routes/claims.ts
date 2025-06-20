import { Router }   from 'express'
import authMiddleware from '../middleware/authMiddleware'
import { listClaims, createClaim,getClaim,updateClaim,claimAction } from '../controllers/claimController'
import multer from 'multer'
import { ManagerAction } from '../controllers/claimController'
const upload = multer({ dest: 'temp/' })
const router = Router()

// ตรงนี้จะไม่ error แล้ว
router.use(authMiddleware)
router.get("/:id", getClaim);
router.get('/', listClaims)
router.put  ('/:id',   upload.fields([
  { name: 'damageFiles'   },
  { name: 'estimateFiles' },
  { name: 'otherFiles'    }
]), updateClaim)
router.post(
  '/',
  upload.fields([
    { name: 'damageFiles' },
    { name: 'estimateFiles' },
    { name: 'otherFiles' },
  ]),
  createClaim
)
router.post("/:id/action", claimAction);
router.patch(
  '/api/claims/:id/review',
  ManagerAction
);

export default router
