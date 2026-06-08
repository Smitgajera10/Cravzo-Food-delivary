import { useEffect, useRef, useState } from "react";
import type { IOrder } from "../types";
import { useSocket } from "../context/SocketContext";
import audio from "../assets/quack.mp3";
import { restaurantService } from "../main";
import axios from "axios";
import OrderCard from "./OrderCard";

const ACTIVE_STATUSES = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_RIDER",
  "RIDER_ASSIGNED",
  "PICKED_UP",
];

const RestaurantOrders = ({ restaurantId }: { restaurantId: string }) => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioUnloacked, setAudioUnloacked] = useState(false);

  const { socket } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(audio);
    audioRef.current.load();
  }, []);

  const unloackAudio = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
          setAudioUnloacked(true);
          console.log("Audio unloacked");
        })
        .catch((err) => {
          console.log("Audio unloack failed", err);
        });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/order/restaurant/${restaurantId}`,
        {
          headers: {
            authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );
      setOrders(data.orders || []);
    } catch (error) {
      console.log("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [restaurantId]);

  useEffect(() => {
    if (!socket) return;

    const onNewOrder = () => {
      console.log("New order received socket");

      if (audioUnloacked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.error("Failed to play audio", err);
        });
      }

      fetchOrders();
    };

    socket.on("order:new", onNewOrder);

    return () => {
      socket.off("order:new", onNewOrder);
    };
  }, [socket, audioUnloacked]);

  if (loading) {
    return <p className="text-gray-500">Loading Orders</p>;
  }

  const activeOrders = orders.filter((order) =>
    ACTIVE_STATUSES.includes(order.status),
  );
  const completedOrders = orders.filter(
    (order) => !ACTIVE_STATUSES.includes(order.status),
  );
  return (
    <div className="space-y-6">
      {!audioUnloacked && (
        <div className="bg-blue-50 border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div className="">
              <p className="font-medium text-blue-900 ">
                Enable Sound Notification
              </p>
              <p className="text-sm text-blue-700">
                Get Notified when new orders arrive
              </p>
            </div>
          </div>
          
          <button
            onClick={unloackAudio}
            className="rounded-lg font-medium bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition"
          >
            Enable Sound
          </button>
        </div>
      )}

      {/* active orders */}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Active Orders</h3>
        {activeOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No Active order</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map((order) => (
              <OrderCard
                key={order.id as string}
                order={order}
                onStatusUpdate={fetchOrders}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Completed Orders</h3>
        {completedOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No Completed order</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedOrders.map((order) => (
              <OrderCard
                key={order.id as string}
                order={order}
                onStatusUpdate={fetchOrders}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantOrders;
