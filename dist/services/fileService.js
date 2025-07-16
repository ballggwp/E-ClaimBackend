"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFile = saveFile;
// src/services/fileService.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function saveFile(file) {
    const uploadDir = path_1.default.join(process.cwd(), "uploads");
    if (!fs_1.default.existsSync(uploadDir))
        fs_1.default.mkdirSync(uploadDir);
    // 1) get the original filename with extension:
    const origName = file.originalname; // e.g. "image.png"
    // 2) extract its extension:
    const ext = path_1.default.extname(origName); // ".png"
    // 3) strip off the extension to get the base name:
    const base = path_1.default.basename(origName, ext); // "image"
    // 4) reconstruct the final filename:
    const fileName = `${base}${ext}`; // "image.png"
    // 5) source path is file.path (where express-fileupload temporarily put it)
    const source = file.path;
    // 6) destination in your uploads folder
    const dest = path_1.default.join(uploadDir, fileName);
    // move/rename the temp file into your uploads directory
    fs_1.default.renameSync(source, dest);
    return `/uploads/${fileName}`;
}
