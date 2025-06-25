"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        if (!(await bcrypt_1.default.compare(password, user.password))) {
            res.status(400).json({ message: "email or password is incorrect" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                position: user.position
            },
            token,
        });
        return;
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        // 1) Validate input
        if (!name || !email || !password) {
            res.status(400).json({ message: 'Name, email and password are required' });
            return;
        }
        // 2) Check for existing email
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ message: 'Email already in use' });
            return;
        }
        // 3) Hash password
        const hashed = await bcrypt_1.default.hash(password, 10);
        // 4) Create user
        const user = await prisma_1.default.user.create({
            data: {
                name,
                email,
                password: hashed,
                role: 'USER',
                position: req.body.position || 'EMPLOYEE', // Default to EMPLOYEE if not provided
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                position: true,
            },
        });
        // 5) Optionally issue JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
        // Send the response (don't `return res.json`)
        res.status(201).json({ user, token });
        return;
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
