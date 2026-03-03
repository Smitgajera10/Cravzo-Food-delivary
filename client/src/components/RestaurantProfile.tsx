import { useState } from "react";
import type { IRestaurent } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { BiEdit, BiMapPin, BiSave } from "react-icons/bi";

interface props {
  restaurant: IRestaurent;
  isSeller: boolean;
  onUpdate: (restaurant: IRestaurent) => void;
}

const RestaurantProfile = ({ restaurant, isSeller, onUpdate }: props) => {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description);
  const [isOpen, setIsOpen] = useState(restaurant.isActive);
  const [loading, setLoading] = useState(false);

  const toggleOpenStatus = async () => {
    try {
      const { data } = await axios.put(
        `${restaurantService}/api/restaurant/status`,
        { status: !isOpen },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      toast.success(data.message);
      setIsOpen(data.restaurant.isOpen);
    } catch (err: any) {
      console.log(err);
      toast.error(err.responce.data.message);
    }
  };

  const saveChanges = async () => {
    try {
      setLoading(true);
      const { data } = await axios.put(
        `${restaurantService}/api/restaurant/edit`,
        { name, description },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      toast.success(data.message);
      onUpdate(data.restaurant);
      setEditMode(false)
    } catch (err) {
      console.log(err);
      toast.error("faild to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-xl bg-white shadow-sm overflow-hidden">
      {restaurant.image && (
        <img
          src={restaurant.image}
          alt=""
          className="h-48 w-full object-cover"
        />
      )}
      <div className="p-5 space-y-4">
        {isSeller && (
          <div className="flex items-start justify-between">
            <div>
              {editMode ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border px-2 py-1 text-lg font-semibold"
                />
              ) : (
                <h2 className="text-xl font-semibold">{restaurant.name}</h2>
              )}

              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 ">
                <BiMapPin className="h-4 w-4 text-red-500" />
                {restaurant.address || "Location unavailable"}
              </div>
            </div>

            <button
              onClick={() => setEditMode(!editMode)}
              className="text-gray-500 hover:text-black"
            >
              <BiEdit size={18} />
            </button>
          </div>
        )}

        {editMode ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        ) : (
          <p className="text-sm text-gray-600">
            {restaurant.description || "No description added"}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <span
            className={`text-sm font-medium ${isOpen ? "text-green-600" : "text-red-500"}`}
          >
            {isOpen ? "OPEN" : "CLOSED"}
          </span>

          <div className="flex gap-3">
            {editMode && (
              <button
                onClick={saveChanges}
                disabled={loading}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 "
              >
                <BiSave size={16} />
                Save
              </button>
            )}

            {isSeller && (
              <button
                onClick={toggleOpenStatus}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white ${isOpen ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                {isOpen ? "Close Restaurant" : "Open Restaurant"}
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Created on {new Date(restaurant.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default RestaurantProfile;
