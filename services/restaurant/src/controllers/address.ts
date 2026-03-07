import { AuthRequest } from "../middlewares/isAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../utils/prisma.js";

export const AddAddress = asyncHandler(async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { mobile, formattedAddress, latitude, longitude } = req.body;

    if (
      !mobile ||
      !formattedAddress ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        message: "Please give all fields",
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id.toString(),
        mobile: BigInt(mobile),
        formattedAddress,
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
    });

    // Prisma returns `mobile` as a BigInt which can't be serialized directly
    const addressForResponse = {
      ...newAddress,
      mobile: newAddress.mobile.toString(),
    };

    res.json({
      message: "Address added successfully",
      address: addressForResponse,
    });
  } catch (error) {
    console.log(error);
  }
});

export const deleteAddress = asyncHandler(async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      return res.status(400).json({
        message: "id is required",
      });
    }

    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id.toString(),
      },
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    await prisma.address.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Address Deleted successfully",
    });
  } catch (error) {
    console.log(error);
  }
});

export const getMyaddresses = asyncHandler(async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: user.id.toString(),
      },
      orderBy :{
        createdAt : "desc",
      }
    });

    // convert BigInt fields before serialization
    const serialized = addresses.map(a => ({
      ...a,
      mobile: a.mobile.toString(),
    }));

    res.json({
      addresses: serialized,
    });
  } catch (error) {
    console.log(error);
  }
});
