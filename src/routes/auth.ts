import { Router } from "express";
import { login } from "../controllers/authController";
const r = Router();
r.post("/login", login);
export default r;
