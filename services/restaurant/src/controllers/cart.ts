import { AuthRequest } from "../middlewares/isAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../utils/prisma.js";

export const addTocart = asyncHandler(async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Please Login",
      });
    }

    const userId = req.user.id;

    const { restaurantId, itemId } = req.body;

    if (!restaurantId || !itemId) {
      return res.status(400).json({
        message: "Restaurent id and item id are required",
      });
    }

    const cartFromDiffrentRestaurant = await prisma.cart.findFirst({
      where: {
        userId,
        restaurantId: {
          not: restaurantId,
        },
      },
    });

    if (cartFromDiffrentRestaurant) {
      return res.status(401).json({
        message:
          "you can order from only one restaurant at a time, Please clear your cart first to add items from this restaurant.",
      });
    }

    const cartItem = await prisma.cart.upsert({
      where: {
        userId_restaurantId_itemId: {
          userId,
          restaurantId,
          itemId,
        },
      },
      update: {
        quantity: {
          increment: 1,
        },
      },
      create: {
        userId,
        restaurantId,
        itemId,
        quantity: 1,
      },
    });

    return res.json({
      message: "Item added to cart",
      cart: cartItem,
    });
  } catch (error) {
    console.log(error);
  }
});

export const fetchMycart = asyncHandler(async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Please Login",
      });
    }

    const userId = req.user.id;

    const cartItems = await prisma.cart.findMany({
      where: {
        userId,
      },
    });

    let subtotal = 0;
    let cartLength = 0;

    for (const cartItem of cartItems) {
      const item: any = cartItem.itemId;

      subtotal += item.price * cartItem.quantity;
      cartLength += cartItem.quantity;
    }

    return res.json({
      success: true,
      cartLength,
      subtotal,
      cart: cartItems,
    });
  } catch (error) {
    console.log(error);
  }
});

export const decrementCartItem = asyncHandler(async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { itemId, restaurantId } = req.body;

    if (!userId || !itemId || !restaurantId) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    const cartItem = await prisma.cart.findUnique({
      where: {
        userId_restaurantId_itemId: {
          userId,
          restaurantId,
          itemId,
        },
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    if (cartItem.quantity === 1) {
      await prisma.cart.delete({
        where: {
          userId_restaurantId_itemId: {
            userId,
            restaurantId,
            itemId,
          },
        },
      });
      return res.json({
        message : "Item removed from cart"
      })
    }

    const updatedCartItem = await prisma.cart.update({
      where: {
        userId_restaurantId_itemId: {
          userId,
          restaurantId,
          itemId,
        },
      },
      data: {
        quantity: {
          decrement: 1,
        },
      }
    });

    return res.json({
      message: "Quantity decreased",
      cart: updatedCartItem,
    });
  } catch (error) {
    console.log(error);
  }
});
export const incrementCartItem = asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { itemId, restaurantId } = req.body;

  if (!userId || !itemId || !restaurantId) {
    return res.status(400).json({
      message: "Invalid request",
    });
  }

  const existingCart = await prisma.cart.findFirst({
    where: { userId },
    select: { restaurantId: true },
  });

  if (existingCart && existingCart.restaurantId !== restaurantId) {
    return res.status(409).json({
      message: "Cart contains items from another restaurant. Clear cart first.",
    });
  }

  const cartItem = await prisma.cart.upsert({
    where: {
      userId_restaurantId_itemId: {
        userId,
        restaurantId,
        itemId,
      },
    },
    update: {
      quantity: {
        increment: 1,
      },
    },
    create: {
      userId,
      restaurantId,
      itemId,
      quantity: 1,
    },
  });

  return res.json({
    message: "Quantity incremented",
    cart: cartItem,
  });
});

export const clearCart = asyncHandler(async(req:AuthRequest , res)=>{
    try {
        const userId = req.user?.id;
        if(!userId){
            return res.status(401).json({
                message : "Unauthorized"
            });
        }

        await prisma.cart.deleteMany({
            where:{
                userId
            }
        });

        res.json({
            message : "Cart cleared successfully"
        })
    } catch (error) {
        console.log(error)
    }
})
