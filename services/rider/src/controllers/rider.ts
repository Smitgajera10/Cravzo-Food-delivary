import axios from "axios";
import { AuthRequest } from "../middlewares/isAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import getBuffer from "../utils/datauri.js";
import { prisma } from "../utils/prisma.js";

export const addRiderProfile = asyncHandler(async (req: AuthRequest, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  if (user.role !== "RIDER") {
    return res.status(403).json({
      message: "Only riders can create rider profile",
    });
  }

  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        message: "Profile picture is required",
      });
    }

    const fileBuffer = getBuffer(file);

    if (!fileBuffer?.content) {
      return res.status(400).json({
        message: "failed to genrate image buffer",
      });
    }

    const { data: uploadReasult } = await axios.post(
      `${process.env.UTILS_SERVICE}/api/upload`,
      {
        buffer: fileBuffer.content,
      },
    );

    const {
      phoneNumber,
      addharNumber,
      drivingLicenseNumber,
      latitude,
      longitude,
    } = req.body;

    if (
      !phoneNumber ||
      !addharNumber ||
      !drivingLicenseNumber ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingProfile = await prisma.rider.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (existingProfile) {
      return res.status(400).json({
        message: "Rider profile already exists",
      });
    }

    const lat =
      typeof latitude === "string" ? parseFloat(latitude) : Number(latitude);
    const lng =
      typeof longitude === "string" ? parseFloat(longitude) : Number(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "Invalid latitude or longitude" });
    }

    // phone must be provided and convertible to BigInt for Prisma BigInt field
    if (!phoneNumber) {
      return res.status(400).json({ message: "Please provide phone number" });
    }

    let phoneBigInt: bigint;
    try {
      // Accept numeric string or number
      phoneBigInt = BigInt(phoneNumber as any);
    } catch (err) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const rider = await prisma.rider.create({
      data: {
        userId: user.id,
        name: user.name,
        phoneNumber,
        addharNumber,
        drivingLicenseNumber,
        latitude: lat,
        longitude: lng,
        picture: uploadReasult.url,
      },
    });

    return res.status(201).json({
      message: "Rider profile created successfully",
      rider,
    });
  } catch (error) {
    console.error("Error creating rider profile:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export const fetchMyProfile = asyncHandler(async (req: AuthRequest, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  try {
    const account = await prisma.rider.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    res.json({ account });
  } catch (error) {}
});

export const toggleRiderAvailability = asyncHandler(
  async (req: AuthRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    if (user.role !== "RIDER") {
      return res.status(403).json({
        message: "Only riders can create rider profile",
      });
    }

    try {
      const { isAvailable, latitude, longitude } = req.body;

      if (typeof isAvailable !== "boolean") {
        return res.status(400).json({
          message: "isAvailable must be boolean",
        });
      }

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          message: "latitude and longitude are required",
        });
      }

      const rider = await prisma.rider.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!rider) {
        return res.status(404).json({
          message: "Rider profile not found",
        });
      }

      if (isAvailable && !rider.isVerified) {
        return res.status(403).json({
          message:
            "Rider is not verified yet. Please wait for verification to be completed.",
        });
      }

      const updatedRider = await prisma.rider.update({
        where: {
          userId: user.id,
        },
        data: {
          isAvailable,
          latitude,
          longitude,
          lastLocationUpdate: new Date(),
        },
      });

      res.json({
        message: isAvailable ? "Rider is Now Online" : "Rider is Now Offline",
        rider: updatedRider,
      });
    } catch (error) {}
  },
);

export const acceptOrder = asyncHandler(async (req: AuthRequest, res) => {
  const riderUserId = req.user?.id;
  const { orderId } = req.params;

  if (!riderUserId) {
    res.status(401).json({
      message: "Please Login",
    });
    return;
  }

  const rider = await prisma.rider.findUnique({
    where: {
      userId: riderUserId,
      isAvailable: true,
    },
  });

  if (!rider) {
    res.status(404).json({
      message: "Rider not available",
    });
    return;
  }

  try {
    const { data } = await axios.put(
      `${process.env.RESTAURANT_SERVICE}/api/order/assign/rider`,
      {
        orderId,
        riderId: rider.id,
        riderUserId: rider.userId,
        riderName: rider.name,
        riderPhone: rider.phoneNumber,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY!,
        },
      },
    );

    if (data.success) {
      const riderDetails = await prisma.rider.update({
        where: {
          userId: riderUserId,
          isAvailable: true,
        },
        data: {
          isAvailable: false,
        },
      });
      res.json({
        message: "Order accepted successfully",
      });
    }
  } catch (error) {
    res.status(400).json({
      message: "Failed to accept order",
    });
  }
});

export const fetchMycurrentOrder = asyncHandler(
  async (req: AuthRequest, res) => {
    const riderUserId = req.user?.id;

    if (!riderUserId) {
      res.status(401).json({
        message: "Please Login",
      });
      return;
    }

    const rider = await prisma.rider.findUnique({
      where: {
        userId: riderUserId,
        isAvailable: true,
      },
    });

    if (!rider) {
      res.status(404).json({
        message: "Rider not available",
      });
      return;
    }

    try {
      const { data } = await axios.get(
        `${process.env.RESTAURANT_SERVICE}/api/order/current/rider?riderId=${rider.id}`,
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY!,
          },
        },
      );

      res.json({
        order: data,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch current order",
      });
    }
  },
);

export const updateOrderStatusByRider = asyncHandler(
  async (req: AuthRequest, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Please Login",
      });
    }

    const rider = await prisma.rider.findUnique({
      where: {
        userId,
      },
    });

    if (!rider) {
      return res.status(404).json({
        message: "Rider profile not found",
      });
    }


    const { orderId } = req.params;

    try {
      const {data} = await axios.put(`${process.env.RESTAURANT_SERVICE}/api/order/update/status/rider`, {
        orderId,
        riderId : rider.id,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY!,
        },
      }); 

      res.json({
        message: data.message,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to update current order",
      });
    }
  },
);
