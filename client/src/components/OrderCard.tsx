import { useState } from "react";
import type { IOrder } from "../types";
import { ORDER_ACTIONS } from "../utils/orderflow";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";

interface props {
  order: IOrder;
  onStatusUpdate: () => void;
}

const statusColors = (status: string) => {
  switch (status) {
    case "PLACED":
      return "bg-yellow-100 text-yellow-700";
    case "ACCEPTED":
      return "bg-orange-100 text-orange-700";
    case "PREPARING":
      return "bg-blue-100 text-blue-700";
    case "READY_FOR_RIDER":
      return "bg-indigo-100 text-indigi-700";
    case "RIDER_ASSIGNED":
      return "bg-purple-100 text-purple-700";
    case "PICKED_UP":
      return "bg-purple-100 text-purple-700";
    case "DELIVERED":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const OrderCard = ({ order, onStatusUpdate }: props) => {
  const [loading, setLoading] = useState(false);
  const actions = ORDER_ACTIONS[order.status] || [];

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      await axios.put(
        `${restaurantService}/api/order/${order.id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );
      toast.success(`Order updated to ${status}`);
      onStatusUpdate?.();
    } catch (error: any) {
      console.log("Failed to update status", error);
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Order #{order.id.slice(-6)}</p>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors(order.status)}`}
        >
          {order.status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="text-gray-600 space-y-1 text-sm">
        {order.items.map((item, idx) => (
          <p key={idx} className="">
            {item.name} x {item.quantity}
          </p>
        ))}
      </div>

      <div className="flex justify-between text-sm font-medium">
        <span>
            Total
        </span>
        <span>₹{order.totalAmount}</span>
      </div>

      <p className="text-xs text-gray-400">Payment: {order.paymentStatus}</p>

      {
        order.paymentStatus === "PAID" && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
                {actions.map((action) => (
                    <button
                        key={action}
                        onClick={() => updateStatus(action)}
                        disabled={loading}
                        className=" rounded-lg px-3 py-1 bg-[#e23744] text-xs text-white hover:bg-[#d32f3a] disabled:opacity-50"
                    >
                        Mark as {action.replaceAll("_", " ").toLowerCase()}

                    </button>
                ))}
            </div>
        )
      }
    </div>
  );
};

export default OrderCard;
