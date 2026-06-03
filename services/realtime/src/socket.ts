import { Server } from "socket.io";
import http from "http";
import jwt from 'jsonwebtoken';

let io: Server;

export const initializeSocket = (server: http.Server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
        }
    });
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;

            if(!decoded || !decoded.user) {
                return next(new Error('Authentication error'));
            }
            socket.data.user = decoded.user;

            next();
        } catch (error) {
            console.error('❌ Socket authentication error:', error);
            return next(new Error('Authentication error'));
        }
    });

    io.on("connection", (socket) => {
        const user = socket.data.user;
        if(!user){
            socket.disconnect();
            return;
        }

        const userId = user.id;
        socket.join(`user:${userId}`);

        if(user.restaurantId) {
            socket.join(`restaurant:${user.restaurantId}`);
        }   

        console.log(`✅ User connected: ${user.name} (ID: ${user.id})`);
        console.log(`Socket room: ${Array.from(socket.rooms).join(', ')}`);

        socket.on("disconnect", () => {
            console.log(`❌ User disconnected: ${socket.data.user.name} (ID: ${socket.data.user.id})`);
        });
    });

    return io;
};

export const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    } 
    return io;
}