import fs from "fs";
import path from "path";
export function saveFile(file: any) {
  const dir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const dest = path.join(dir, file.originalname);
  fs.renameSync(file.path, dest);
  return `/uploads/${file.originalname}`;
}
