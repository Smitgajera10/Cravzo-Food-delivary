import express from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import { assignRiderToOrder, createOrder, fetchOrderForPayment, fetchRestaurantOrders, fetchSingleOrder, getCurrentOrderForRider, getMyOrders, updateOrderStatus, updateOrderStatusByRider } from "../controllers/order.js";

const router = express.Router();

router.post("/new", isAuth ,  createOrder);
router.get("/payment/:id", fetchOrderForPayment);
router.get("/restaurant/:restaurantId", isAuth , isSeller , fetchRestaurantOrders);
router.put("/:orderId", isAuth , isSeller , updateOrderStatus);
router.get("/my", isAuth  , getMyOrders);
router.get("/:id", isAuth  , fetchSingleOrder);
router.put("/assign/rider", assignRiderToOrder);
router.get("/current/rider", getCurrentOrderForRider);
router.put("/update/status/rider", updateOrderStatusByRider);

export default router;