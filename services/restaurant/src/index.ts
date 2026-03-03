import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from './utils/prisma.js';
import resturentRoutes from './routes/restaurent.js'
import itemRoutes from './routes/menuItems.js'
dotenv.config();

const app = express()
app.use(express.json());
app.use(cors({
  origin:"*",
  credentials:true,
}))
const PORT  = process.env.PORT || 5001;


app.use("/api/restaurant" , resturentRoutes)
app.use("/api/item" , itemRoutes)

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