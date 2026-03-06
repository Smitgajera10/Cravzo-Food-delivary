import axios from "axios";
import { AuthRequest } from "../middlewares/isAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import getBuffer from "../utils/datauri.js";
import { prisma } from "../utils/prisma.js";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

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
    const lat =
      typeof latitude === "string" ? parseFloat(latitude) : Number(latitude);
    const lng =
      typeof longitude === "string" ? parseFloat(longitude) : Number(longitude);

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
    console.log(error);
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
      process.env.JWT_ACCESS_SECRET as string,
      {
        expiresIn: "15d",
      },
    );

    return res.json({ restaurant: safeRestaurant, token });
  }

  res.json({ restaurant: safeRestaurant });
});

export const updateStatusRestaurant = asyncHandler(
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(403).json({
          message: "Please Login",
        });
      }

      const { status } = req.body;

      if (typeof status !== "boolean") {
        return res.status(400).json({
          message: "status must be boolean",
        });
      }

      const restaurant = await prisma.restaurant.update({
        where: {
          ownerId: req.user.id,
        },
        data: {
          isActive: status,
        },
      });

      if (!restaurant) {
        return res.status(404).json({
          message: "Restaurant not found",
        });
      }

      const safeRest = {
        ...restaurant,
        phone: restaurant.phone?.toString(),
      };

      res.json({
        message: "Restaurant Status Updated",
        restaurant: safeRest,
      });
    } catch (error) {
      console.log(error);
    }
  },
);

export const updateRestaurant = asyncHandler(async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({
        message: "Please Login",
      });
    }

    const { name, description } = req.body;

    const restaurant = await prisma.restaurant.update({
      where: {
        ownerId: req.user.id,
      },
      data: {
        name,
        description,
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    const safeRest = {
      ...restaurant,
      phone: restaurant.phone?.toString(),
    };

    res.json({
      message: "Restaurant Updated",
      restaurant: safeRest,
    });
  } catch (error) {
    console.log(error);
  }
});

export const getNearbyRestaurant = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 5000, search = "" } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      message: "Latitude and longitude are required",
    });
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  const radiusMeters = Number(radius);
  const searchQuery = `%${String(search).toLowerCase()}%`;

  const restaurants = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT *,
      ST_Distance(
        location,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) AS distance
    FROM "Restaurant"
    WHERE
      "isVerified" = true
      AND LOWER(name) LIKE ${searchQuery}
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )
    ORDER BY "isActive" DESC, distance ASC
  `);
  
  const formattedRestaurants = restaurants.map((r) => ({
    ...r,
    phone: r.phone?.toString(),
  }));

  res.json({
    success: true,
    count: formattedRestaurants.length,
    restaurants: formattedRestaurants,
  });
});


export const fetchSigleRestaurant = asyncHandler(async(req , res)=>{
  try {
    const resid = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

  if (!resid) {
    return res.status(400).json({
      message: "Restaurant ID is required",
    });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      id: resid,
    },
  });

  if (!restaurant) {
    return res.status(404).json({
      message: "Restaurant not found",
    });
  }

  const safeRestaurant = {
    ...restaurant,
    phone: restaurant.phone?.toString(),
  };

  return res.json(safeRestaurant);
  } catch (error) {
    console.log(error)
  }
  
});
