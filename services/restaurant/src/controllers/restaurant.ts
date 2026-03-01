import axios from "axios";
import { AuthRequest } from "../middlewares/isAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import getBuffer from "../utils/datauri.js";
import { prisma } from "../utils/prisma.js";
import jwt from "jsonwebtoken";

export const addRestaurant = asyncHandler(async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const existingRestaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: user?.id,
      },
    });

    if (existingRestaurant) {
      return res.status(400).json({
        message: "You alredy have a Restaurant",
      });
    }

    const { name, description, latitude, longitude, address, phone } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "Please give all details",
      });
    }

    // parse latitude / longitude (they come as strings from multipart/form-data)
    const lat = typeof latitude === "string" ? parseFloat(latitude) : Number(latitude);
    const lng = typeof longitude === "string" ? parseFloat(longitude) : Number(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "Invalid latitude or longitude" });
    }

    // phone must be provided and convertible to BigInt for Prisma BigInt field
    if (!phone) {
      return res.status(400).json({ message: "Please provide phone number" });
    }

    let phoneBigInt: bigint;
    try {
      // Accept numeric string or number
      phoneBigInt = BigInt(phone as any);
    } catch (err) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "Please give Image",
      });
    }

    const filebuffer = getBuffer(file);
    if (!filebuffer?.content) {
      return res.status(500).json({
        message: "Failed to create file buffer",
      });
    }

    const { data: uploadReasult } = await axios.post(
      `${process.env.UTILS_SERVICE}/api/upload`,
      {
        buffer: filebuffer.content,
      },
    );

    const restaurent = await prisma.restaurant.create({
      data: {
        name,
        description,
        phone: phoneBigInt,
        image: uploadReasult.url,
        ownerId: user.id,
        latitude: lat,
        longitude: lng,
        address,
      },
    });

    const safeRestaurent = {
      ...restaurent,
      phone: restaurent.phone?.toString(),
    };

    return res.status(201).json({
      message: "Restaurent created successfully",
      restaurent: safeRestaurent,
    });
  } catch (error: any) {
    console.log(error)
    return res.status(400).json({
      message: error.message,
    });
  }
});

export const fetchMyRestaurant = asyncHandler(async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Please Login",
    });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      ownerId: req.user.id,
    },
  });

  if (!restaurant) {
    return res.status(400).json({
      message: "No Restaurant Found",
    });
  }

  const safeRestaurant = {
    ...restaurant,
    phone: restaurant.phone?.toString(),
  };

  if (!req.user.restaurantId) {
    const token = jwt.sign(
      {
        user: {
          ...req.user,
          restaurantId: restaurant.id,
        },
      },
      process.env.JWT_ACCESS_SECRET as string, {
        expiresIn : "15d", 
      }
    );

    return res.json({ restaurant: safeRestaurant, token });
  }

  res.json({ restaurant: safeRestaurant });
});
