import axios from "axios";
import { AuthRequest } from "../middlewares/isAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import getBuffer from "../utils/datauri.js";
import { prisma } from "../utils/prisma.js";

export const addMenuItem = asyncHandler(async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Pelase Login",
      });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: req.user.id,
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "No restaurant fonund",
      });
    }

    const { name, description, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        message: "Name and Price are Requried",
      });
    }

    // Parse price to float (comes as string from form data)
    const parsedPrice = typeof price === "string" ? parseFloat(price) : Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        message: "Price must be a valid positive number",
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
        buffer: filebuffer.content,
      },
    );

    const item = await prisma.menu.create({
      data: {
        name,
        description,
        price: parsedPrice,
        restaurantId: restaurant.id,
        imageUrl: uploadReasult.url,
      },
    });

    res.json({
      message: "Item Added successfully",
      item,
    });
  } catch (error) {
    console.log(error);
  }
});

export const getAllItems = asyncHandler(async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      return res.status(400).json({
        message: "Id is required",
      });
    }

    const items = await prisma.menu.findMany({
      where: {
        restaurantId: id,
      },
    });

    return res.json({
      message: "Items fetched successfully",
      items,
    });
  } catch (error) {
    console.log(error);
  }
});

export const deleteMenuItem = asyncHandler(async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Pelase Login",
      });
    }

    const itemId = Array.isArray(req.params.itemId)
      ? req.params.itemId[0]
      : req.params.itemId;

    if (!itemId) {
      return res.status(400).json({
        message: "Id is required",
      });
    }

    const item = await prisma.menu.findUnique({
      where: {
        id: itemId,
      },
    });

    if (!item) {
      return res.status(404).json({
        message: "No Item found",
      });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: item.restaurantId,
        ownerId: req.user.id,
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "No restaurant fonund",
      });
    }

    const responce = await prisma.menu.delete({
      where: {
        id: item.id,
      },
    });

    res.json({
      message: "Menu Item deleted succenssfully",
    });
  } catch (error) {
    console.log(error);
  }
});

export const toggleMenuItemAvailability = asyncHandler(
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Pelase Login",
        });
      }

      const itemId = Array.isArray(req.params.itemId)
        ? req.params.itemId[0]
        : req.params.itemId;

      if (!itemId) {
        return res.status(400).json({
          message: "Id is required",
        });
      }

      const item = await prisma.menu.findUnique({
        where: {
          id: itemId,
        },
      });

      if (!item) {
        return res.status(404).json({
          message: "No Item found",
        });
      }

      const restaurant = await prisma.restaurant.findUnique({
        where: {
          id: item.restaurantId,
          ownerId: req.user.id,
        },
      });

      if (!restaurant) {
        return res.status(404).json({
          message: "No restaurant fonund",
        });
      }


      const updatedItem = await prisma.menu.update({
        where :{
            id : item.id,
        },
        data:{
            isAvailable : !item.isAvailable,
        },
      });

      res.json({
        message : `Item Marked as ${updatedItem.isAvailable ? "available" : "unavailable"} `,
        updatedItem,
      });

      
    } catch (error) {
      console.log(error);
    }
  },
);
