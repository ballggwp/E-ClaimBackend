import multer from "multer";
import path from "path";

// Tell Multer exactly where to put incoming files, and what to name them:
const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (_req, file, cb) => {
      const unique = Date.now() + "-" + Math.random().toString(36).slice(2,8);
      cb(null, unique + path.extname(file.originalname));
    },
  }),
});
