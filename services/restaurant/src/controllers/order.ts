import { AuthRequest } from "../middlewares/isAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../utils/prisma.js";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export const createOrder = asyncHandler(async (req: AuthRequest, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const { paymentMethod, addressId, distance } = req.body;

  if (!addressId) {
    return res.status(400).json({
      message: "Address is required",
    });
  }

  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId: user.id,
    },
  });

  if (!address) {
    return res.status(404).json({
      message: "Address not found",
    });
  }

  const cartItems = await prisma.cart.findMany({
    where: {
      userId: user.id,
    },
    include: {
      menu: true,
      restaurant: true,
    },
  });

  if (cartItems.length === 0) {
    return res.status(400).json({
      message: "Cart is empty",
    });
  }

  const firstCartItem = cartItems[0];

  if (!firstCartItem) {
    return res.status(400).json({
      message: "Invalid cart data",
    });
  }

  const restaurantId = firstCartItem.restaurantId;
  const restaurantName = firstCartItem.restaurant.name;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant || !restaurant.isActive || !restaurant.isVerified) {
    return res.status(400).json({
      message: "Restaurant not available",
    });
  }

  let subTotal = 0;

  const orderItems = cartItems.map((cart) => {
    subTotal += cart.menu.price * cart.quantity;
    return {
      itemId: cart.menu.id,
      name: cart.menu.name,
      price: cart.menu.price,
      quantity: cart.quantity,
    };
  });

  const deliveryFee = subTotal < 250 ? 49 : 0;
  const platformFee = 7;
  const totalAmount = subTotal + deliveryFee + platformFee;
  const riderAmount = Math.ceil(distance) * 17;

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      restaurantId,
      restaurantName,

      distance,
      riderAmount,

      subTotal,
      deliveryFee,
      platformFee,
      totalAmount,

      addressId,
      deliveryAddress: address.formattedAddress,
      deliveryMobile: address.mobile,
      deliveryLat: address.latitude,
      deliveryLng: address.longitude,

      paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.PLACED,

      expiresAt: new Date(Date.now() + 15 * 60 * 1000),

      items: {
        create: orderItems,
      },
    },
    include: {
      items: true,
    },
  });

  // ✅ Clear cart after order
  await prisma.cart.deleteMany({
    where: {
      userId: user.id,
    },
  });

  res.status(201).json({
    message: "Order created successfully",
    orderId : order.id,
    amount : order.totalAmount,
  });
});

export const fetchOrderForPayment = asyncHandler(async(req : AuthRequest , res)=>{
    if(req.headers["x-internal-key"] != process.env.INTERNAL_SERVICE_KEY){
        return res.status(403).json({
            message : "Forbidden",
        })
    }

  const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if(!orderId){
    return res.status(400).json({
      message : "Order ID is required",
    })
  }

  const order = await prisma.order.findUnique({
    where : {
      id : orderId,
    }
  })

  if(!order){
    return res.status(404).json({
      message : "Order not found",
    })
  }

  if(order.paymentStatus === PaymentStatus.PAID){
    return res.status(400).json({
      message : "Order already paid",
    })
  }

  res.status(200).json({
    message : "Order fetched successfully",
    orderId : order.id,
    amount : order.totalAmount,
    currency : "INR",
  })
})
