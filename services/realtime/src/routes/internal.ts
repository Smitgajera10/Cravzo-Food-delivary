import express from "express";
import { getIo } from "../socket.js";

const  router = express.Router();

router.post('/emit' , (req , res )=>{
    if (req.headers["x-internal-key"] != process.env.INTERNAL_SERVICE_KEY) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }
    const { event, payload, room } = req.body;
    if (!event || !room) {
      return res.status(400).json({
        message: "Event and room are required",
      });
    }

    const io = getIo();
    console.log(`Emitting event '${event}' to room '${room}' with payload:`, payload);
    io.to(room).emit(event, payload ?? {});

    return res.json({success : true});
})

export default router;