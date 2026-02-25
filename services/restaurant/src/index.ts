import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express()
app.use(cors({
  origin:"*",
  credentials:true,
}))
app.use(express.json());
const PORT  = process.env.PORT || 5000;


app.listen(PORT , ()=>{
    console.log(`Auth service is running on port ${PORT}`);
})