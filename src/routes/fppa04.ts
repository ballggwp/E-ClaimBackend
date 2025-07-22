import express from "express";
import * as f04 from "../controllers/fppa04Controller";
import multer from "multer";
import path from "path";
import { saveFile } from "../services/fileService";
const router = express.Router();
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    // grab original extension
    const ext      = path.extname(file.originalname);         // e.g. ".pdf"
    const nameOnly = path.basename(file.originalname, ext);   // e.g. "my-doc"
    const ts       = Date.now();                              // e.g. 1623795300000
    // build final filename
    cb(null, `${nameOnly}-${ts}${ext}`);                      // "my-doc-1623795300000.pdf"
  }
});

const upload = multer({ storage });

// POST   /api/fppa04            → create base
// GET    /api/fppa04/:id        → read base + variant+items+adjustments
// PATCH  /api/fppa04/:id        → update base
router.post  ("/",         f04.createFppa04Base);
router.get   ("/:id",      f04.getFppa04Base);
router.patch ("/:id",      f04.updateFppa04Base);


// POST   /api/fppa04/:id/cpm  → create CPM variant
// PATCH  /api/fppa04/:id/cpm  → update CPM variant
router.post(
  "/:id/cpm",
  upload.array("signatureFiles", 10),
  async (req, res, next) => {
    try {
      // req.files is an array of Multer File objects
      const files = (req.files as Express.Multer.File[]);

      // run each through your helper
      // saveFile moves them into uploads/ with proper UTF-8 names
      // and returns the public URL path
      const signatureUrls = files.map(saveFile);

      // attach to body so your controller can store them
      req.body.signatureUrls = signatureUrls;

      // now call into your normal controller
      return f04.createFppa04Cpm(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// same for PATCH if you want updates
router.patch(
  "/:id/cpm",
  upload.array("signatureFiles", 10),
  async (req, res, next) => {
    try {
      const files = (req.files as Express.Multer.File[]);
      const signatureUrls = files.map(saveFile);
      req.body.signatureUrls = signatureUrls;
      return f04.createFppa04Cpm(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);


// POST   /api/fppa04/:id/items          → add item
// PATCH  /api/fppa04/:id/items/:itemId  → update item
// DELETE /api/fppa04/:id/items/:itemId  → delete item
router.post   ("/:id/items",             f04.addFppa04Item);
router.patch  ("/:id/items/:itemId",     f04.updateFppa04Item);
router.delete ("/:id/items/:itemId",     f04.deleteFppa04Item);


// POST   /api/fppa04/:id/adjustments         → add adjustment
// PATCH  /api/fppa04/:id/adjustments/:adjId  → update adjustment
// DELETE /api/fppa04/:id/adjustments/:adjId  → delete adjustment
router.post   ("/:id/adjustments",              f04.addFppa04Adjustment);
router.patch  ("/:id/adjustments/:adjId",       f04.updateFppa04Adjustment);
router.delete ("/:id/adjustments/:adjId",       f04.deleteFppa04Adjustment);


router.get("/", f04.listFppa04)
export default router;
