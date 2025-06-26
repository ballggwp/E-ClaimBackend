import multer from "multer";
import path from "path";

// Tell Multer exactly where to put incoming files, and what to name them:
const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: (req, file, cb) => {
    const ext       = path.extname(file.originalname)                  // “.pdf”
    const nameOnly  = path.basename(file.originalname, ext)            // “my-document”
    const timestamp = Date.now()                                       // e.g. 1623795300000

    cb(null, `${nameOnly}-${timestamp}${ext}`)
  }
})

export const upload = multer({ storage })