import axios from "axios";
import { AuthRequest } from "../middlewares/isAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import getBuffer from "../utils/datauri.js";
import { PrismaClient } from "@prisma/client/extension";
import { prisma } from "../utils/prisma.js";

export const addRestaurant = asyncHandler(async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const existingRestaurant = await prisma.restaurant.findFirst({
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

    if (!name || !latitude || !longitude) {
      return res.status(400).json({
        message: "Please give all details",
      });
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
        Buffer: filebuffer.content,
      },
    );

    const restaurent = await prisma.restaurant.create({
      data: {
        name,
        description,
        phone,
        image: uploadReasult,
        ownerId: user.id,
        latitude: latitude,
        longitude: longitude,
        address,
      },
    });

    return res.status(201).json({
      message: "Restaurent created successfully",
      restaurent,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
});
