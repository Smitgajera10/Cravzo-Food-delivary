import { useEffect, useState } from "react";
import type { IRestaurent } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";

type SellerTab = "menu" | "add-item" | "sales";

const Restaurant = () => {
  const [restaurant, setRestaurant] = useState<IRestaurent | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SellerTab>("menu");

  const fetchMyRestaurant = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/my`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      setRestaurant(data.restaurant || null);

      if (data.token) {
        localStorage.setItem("accessToken", data.token);
        window.location.reload();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRestaurant();
  }, []);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading your Restaurant ..</p>
      </div>
    );

  if (!restaurant) {
    return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;
  }
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-6">
      <RestaurantProfile
        restaurant={restaurant}
        onUpdate={setRestaurant}
        isSeller={true}
      />

      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex border-b">
          {[
            { key: "menu", lable: "Menu Items" },
            { key: "add-item", lable: "Add Item" },
            { key: "sales", lable: "Sales" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as SellerTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${tab === t.key ? "border-b-2 border-red-500 text-red-500" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t.lable}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "menu" && <p>Menu Page</p>}
          {tab === "add-item" && <p>Add Item Page</p>}
          {tab === "sales" && <p>Sales Page</p>}
        </div>
      </div>
    </div>
  );
};

export default Restaurant;
