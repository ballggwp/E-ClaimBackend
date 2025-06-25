"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/users.ts
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// GET http://localhost:5000/api/users
router.get('/', userController_1.listUsers);
exports.default = router;
