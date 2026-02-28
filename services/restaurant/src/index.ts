import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from './utils/prisma.js';
import resturentRoutes from './routes/restaurent.js'
dotenv.config();

const app = express()
app.use(cors({
  origin:"*",
  credentials:true,
}))
app.use(express.json());
const PORT  = process.env.PORT || 5001;


app.use("/api/restaurent" , resturentRoutes)

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT , ()=>{
        console.log(`Restaurant service is running on port ${PORT}`);
    })
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();