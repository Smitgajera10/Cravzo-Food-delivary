import { NextFunction, Request , Response} from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request{
    user?:{
        id: string;
        name: string;
        eamil:string;
        role:string;
    };
}

export const isAuth = (
    req:AuthRequest,
    res:Response,
    next:NextFunction
)=>{
    try {
        const authHeader = req.headers.authorization;
        
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            console.log(authHeader)
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1] as string;

        const decoded = jwt.verify(
            token,
            (process.env.JWT_ACCESS_SECRET as string)
        ) as JwtPayload;
        if(!decoded || !decoded.user){
            return res.status(401).json({
                message:"Invalid token",
            });
        }
        req.user = decoded.user;

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}