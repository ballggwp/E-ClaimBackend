import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usersRoutes from './routes/users'
import authRoutes from "./routes/auth";
import claimRoutes from "./routes/claims";
import path from "path"
dotenv.config();
const app = express();
app.use(
  cors({
    origin: process.env.FE_PORT,  
    credentials: true,     
    allowedHeaders: ["Authorization", "Content-Type"],           
  })
)
app.use(express.json());
app.use('/api/users', usersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/claims", claimRoutes);
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
