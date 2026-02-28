import express from "express";
import dotenv from "dotenv";
import authRoute from "./routes/auth.js";
import cors from "cors";
import { connectDB } from "./utils/prisma.js";
dotenv.config();

const app = express();

app.use(cors({
  origin:"*",
  credentials:true,
}))
app.use(express.json());

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});

app.use("/api/auth" , authRoute);
const PORT  = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT , ()=>{
        console.log(`Auth service is running on port ${PORT}`);
    })
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();