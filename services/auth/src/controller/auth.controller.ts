import { OAuth2Client } from "google-auth-library";
import Jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import crypto from "crypto";
import { AuthProvider, Role } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AuthRequest } from "../middlewares/isAuth.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAccessToken = (user :any) => {
  return Jwt.sign({ user }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: "15d",
  });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Google ID token required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const { sub, email, name, picture } = payload;

    if (!email) {
      return res.status(401).json({ message: "Email not provided by Google" });
    }

    let account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: AuthProvider.GOOGLE,
          providerAccountId: sub,
        },
      },
      include: { user: true },
    });

    let user;

    if (account) {
      user = account.user;
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: name ?? null,
          avatar: picture ?? null,
          accounts: {
        create: {
          provider: AuthProvider.GOOGLE,
          providerAccountId: sub,
        },
          },
        },
      });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login failed" });
  }
});
const validRoles = ["CUSTOMER", "RESTAURANT", "RIDER"] as const;
type Rolee = (typeof validRoles)[number];

export const addRole = asyncHandler(async (req:AuthRequest, res) => {
  try {
    if(!req.user?.id){
      return res.status(400).json({ message: "Unauthorized" });
    }
    const { role } = req.body as {role : Rolee};

    if (!role) {
      return res.status(400).json({ message: "Role required" });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { role },
    });

    if(!updatedUser){
      return res.status(400).json({ message: "user not found" });
    }
    
    const token = generateAccessToken(req.user);
    
    return res.status(200).json({
      message: "Role updated successfully",
      updatedUser,
      token
    });

  } catch (error) {
    
    return res.status(500).json({ message: "Role update failed" });
  }
});


export const myProfile = asyncHandler(async(req:AuthRequest , res)=>{
  const user = req.user;
  res.json(user)
})