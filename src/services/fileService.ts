// src/services/fileService.ts
import fs from "fs";
import path from "path";

export function saveFile(file: any) {
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

  // 1) get the original filename with extension:
  const origName = file.originalname as string; // e.g. "image.png"
  // 2) extract its extension:
  const ext = path.extname(origName);           // ".png"
  // 3) strip off the extension to get the base name:
  const base = path.basename(origName, ext);    // "image"
  // 4) reconstruct the final filename:
  const fileName = `${base}${ext}`;             // "image.png"

  // 5) source path is file.path (where express-fileupload temporarily put it)
  const source = file.path as string;
  // 6) destination in your uploads folder
  const dest   = path.join(uploadDir, fileName);

  // move/rename the temp file into your uploads directory
  fs.renameSync(source, dest);

  return `/uploads/${fileName}`;
}
