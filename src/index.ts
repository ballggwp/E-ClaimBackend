import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import claimRoutes from "./routes/claims";
dotenv.config();
const app = express();
app.use(
  cors({
    origin: 'http://localhost:3000',  // ให้อนุญาตเฉพาะโดเมนนี้
    credentials: true,                // ถ้าจะใช้ cookie/session
  })
)
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/claims", claimRoutes);
app.use("/uploads", express.static("uploads"));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
