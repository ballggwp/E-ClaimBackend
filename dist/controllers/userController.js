"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const listUsers = async (_req, res, next) => {
    try {
        const users = await prisma_1.default.user.findMany({
            select: { id: true, name: true, email: true, role: true, password: true, position: true },
        });
        res.json({ users });
    }
    catch (err) {
        next(err);
    }
};
exports.listUsers = listUsers;
