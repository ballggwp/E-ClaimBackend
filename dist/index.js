"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = __importDefault(require("./routes/auth"));
const claims_1 = __importDefault(require("./routes/claims"));
const fppa04_1 = __importDefault(require("./routes/fppa04"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.FE_PORT,
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
}));
// 2) Mount your FPPA04 API (guarded inside that router by ensureRole)
app.use('/api/fppa04', fppa04_1.default);
app.use(express_1.default.json());
app.use('/api/users', users_1.default);
app.use("/api/auth", auth_1.default);
app.use("/api/claims", claims_1.default);
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
