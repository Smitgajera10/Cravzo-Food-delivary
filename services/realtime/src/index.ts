import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import http from 'http';
import { initializeSocket } from './socket.js';
import internalRoute from './routes/internal.js';


const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/internal", internalRoute);


const server = http.createServer(app);
initializeSocket(server);

server.listen(process.env.PORT, () => {
  console.log('Realtime service is running on port ' + process.env.PORT);
})