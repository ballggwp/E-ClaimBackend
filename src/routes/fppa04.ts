// routes/fppa04.ts
import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { upsertFppa04, getFppa04, listPendingFppa04 } from '../controllers/fppa04Controller'

const router = Router()

// store files under /public/uploads, keep original extension
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
      .replace(/\s+/g,'_')
      .slice(0,100)
    cb(null, `${name}_${Date.now()}${ext}`)
  }
})

const upload = multer({ storage })

router.get  ('/:claimId', getFppa04)
router.post ('/:claimId',
  upload.array('signatureFiles', 5),
  upsertFppa04
)
// optionally also support PUT:
router.put  ('/:claimId',
  upload.array('signatureFiles', 5),
  upsertFppa04
)

router.get  ('/', listPendingFppa04)

export default router
