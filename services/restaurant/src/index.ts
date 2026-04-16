import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from './utils/prisma.js';
import resturentRoutes from './routes/restaurent.js'
import itemRoutes from './routes/menuItems.js'
import cartRoutes from './routes/cart.js'
import addressRoutes from './routes/address.js'
import orderRoutes from './routes/order.js'
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
app.use("/api/cart" , cartRoutes)
app.use("/api/address" , addressRoutes)
app.use("/api/order" , orderRoutes)

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