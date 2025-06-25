import multer from "multer";
import path from "path";

// Tell Multer exactly where to put incoming files, and what to name them:
export const upload = multer({
  storage: multer.diskStorage({
    // 1️⃣ Where on disk to save
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      cb(null, uploadDir);
    },
    // 2️⃣ How to name the file
    filename: (req, file, cb) => {
      // Use the client’s original filename:
      // you could also prepend a timestamp or random suffix to avoid collisions
      cb(null, file.originalname);
    }
  })
});
