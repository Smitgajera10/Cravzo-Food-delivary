import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { connectDB } from "./utils/prisma.js";
import riderRoutes from "./routes/rider.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
const PORT  = process.env.PORT || 5005;
const app = express();
app.use(express.json());
app.use(cors({
  origin:"*",
  credentials:true,
}));
  
await connectRabbitMQ();
app.use("/api/rider", riderRoutes);


async function startServer() {
  try {
    await connectDB();
    app.listen(PORT , ()=>{
        console.log(`Rider service is running on port ${PORT}`);
    })
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();