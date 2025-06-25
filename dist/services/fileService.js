"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFile = saveFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function saveFile(file) {
    const dir = path_1.default.join(process.cwd(), "uploads");
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir);
    const dest = path_1.default.join(dir, file.originalname);
    fs_1.default.renameSync(file.path, dest);
    return `/uploads/${file.originalname}`;
}
