import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import axios from "axios";
import { restaurantService } from "../main";

const OrderPage = () => {
  const { id } = useParams();
  const { socket } = useSocket();

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/order/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setOrder(data.order);
    } catch (error) {
      console.log("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const onOrderUpdate = () => {
      fetchOrder();
    };
    socket.on("order:update", onOrderUpdate);

    return () => {
      socket.off("order:update", onOrderUpdate);
    };
  }, [socket]);

  if (loading) {
    return <p className="text-center text-gray-500">Loading Order...</p>;
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">No orders Found</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">Order #{order.id.toString().slice(-6)}</h1>

      <div className="rounded-lg bg-blue-50 p-3 text-sm font-medium">
        Status: <span className="capitalize">{order.status}</span>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-2">
        <h2 className="font-semibold">
            Items
        </h2>
        {order.items.map((item, i) => (
          <div
            key={i}
            className="flex justify-between tesxt-sm"
            >
           <span>{item.name} x {item.quantity}</span>
           <span>₹{item.price*item.quantity}</span>
            </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-1">
        <h2 className="font-semibold">Delivery Address</h2>
        <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
        <p className="text-sm text-gray-600">Mobile : {order.deliveryMobile.toString()}</p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-2">
        <div className="flex justify-between text-sm">
            <span>SubTotal</span>
            <span>₹{order.subTotal}</span>
        </div>
        <div className="flex justify-between text-sm">
            <span>Delivary Fee</span>
            <span>₹{order.deliveryFee}</span>
        </div>
        <div className="flex justify-between text-sm">
            <span>Platform fee</span>
            <span>₹{order.platformFee}</span>
        </div>
        <div className="flex justify-between text-sm">
            <span>Total</span>
            <span>₹{order.totalAmount}</span>
        </div>
        
        <p className="text-xs text-gray-500">Payment Method: {order.paymentMethod}</p>
        <p className="text-xs text-gray-500">Payment Status: {order.status}</p>
      </div>
        
    </div>
  );
};

export default OrderPage;
