import { NextFunction, Request , Response} from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request{
    user?:{
        id: string;
        name: string;
        eamil:string;
        role:string;
        restaurantId : string
    };
}

export const isAuth = async (
    req:AuthRequest,
    res:Response,
    next:NextFunction
): Promise<void>=>{
    try {
        const authHeader = req.headers.authorization;
        
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            console.log(authHeader)
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const token = authHeader.split(" ")[1] as string;

        const decoded = jwt.verify(
            token,
            (process.env.JWT_ACCESS_SECRET as string)
        ) as JwtPayload;
        if(!decoded || !decoded.user){
            res.status(401).json({
                message:"Invalid token",
            });
            return;
        }
        req.user = decoded.user;

        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token" });
        return;
    }
}

export const isSeller = async (
    req:AuthRequest,
    res:Response,
    next:NextFunction
) : Promise<void> =>{
    const user = req.user;

    if(user && user.role !== "RESTAURANT"){
        res.status(401).json({
            message: "You are not authorized seller",
        })
        return;
    }
    next()
}