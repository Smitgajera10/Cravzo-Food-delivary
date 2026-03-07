import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useState } from "react";
import type { ICart, IMenuItem, IRestaurent } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { VscLoading } from "react-icons/vsc";
import { BiMinus, BiPlus, BiTrash } from "react-icons/bi";

const Cart = () => {
  const { cart, subtotal, quantity, fetchCart } = useAppData();
  const navigate = useNavigate();

  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [clearingCart, setClearingCart] = useState(false);

  if (!cart || cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500 text-lg"> Your cart is Empty</p>
      </div>
    );
  }

  const restaurant = cart[0].restaurant as IRestaurent;

  const delivaryFee = subtotal < 250 ? 49 : 0;

  const platformFee = 7;
  const grandTotal = subtotal + delivaryFee + platformFee;

  const increaseQty = async (itemId: string, restaurantId: string) => {
    try {
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/inc`,
        { itemId, restaurantId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      await fetchCart();
    } catch (error) {
      toast.error("Somthing went wrong");
    } finally {
      setLoadingItemId(null);
    }
  };

  const decreaseQty = async (itemId: string, restaurantId: string) => {
    try {
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/dec`,
        { itemId, restaurantId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      await fetchCart();
    } catch (error) {
      toast.error("Somthing went wrong");
    } finally {
      setLoadingItemId(null);
    }
  };

  const clearCart = async () => {
    const confirm = window.confirm("Are you sure you want to clear your cart?");

    if (!confirm) return;
    try {
      setClearingCart(true);
      await axios.delete(`${restaurantService}/api/cart/clear`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      await fetchCart();
    } catch (error) {
      toast.error("Somthing went wrong");
    } finally {
      setClearingCart(false);
    }
  };

  const checkout = () => {
    navigate("/checkout");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">{restaurant.name}</h2>
        <p className="text-sm text-gray-500">{restaurant.address}</p>
      </div>

      <div className="space-y-4">
        {cart.map((cartItem: ICart) => {
          const item = cartItem.item as IMenuItem;
          const isLoading = loadingItemId === item.id;

          return (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
            >
              <img
                src={item.imageUrl}
                alt=""
                className="h-20 w-20 rounded object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500">₹{item.price}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="rounded-full border p-2 hover:bg-gray-100 disabled:opacity-50"
                  disabled={isLoading}
                  onClick={() => decreaseQty(item.id, item.restaurantId)}
                >
                  {isLoading ? (
                    <VscLoading size={16} className="animate-spin" />
                  ) : (
                    <BiMinus size={16} />
                  )}
                </button>

                <span className="font-medium">{cartItem.quantity}</span>

                <button
                  className="rounded-full border p-2 hover:bg-gray-100 disabled:opacity-50"
                  disabled={isLoading}
                  onClick={() => increaseQty(item.id, item.restaurantId)}
                >
                  {isLoading ? (
                    <VscLoading size={16} className="animate-spin" />
                  ) : (
                    <BiPlus size={16} />
                  )}
                </button>
              </div>

              <p className="w-20 text-right font-medium">
                ₹{item.price * cartItem.quantity}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <div className="flex justify-between text-sm">
          <span>Total Items</span>
          <span>{quantity}</span>
        </div>

        <div className="flex justify-baseline text-sm">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="flex justify-baseline text-sm">
          <span>Delivary Fee</span>
          <span>{delivaryFee === 0 ? "Free" : `₹${delivaryFee}`}</span>
        </div>
        <div className="flex justify-baseline text-sm">
          <span>Platform Fee</span>
          <span>₹{platformFee}</span>
        </div>

        {subtotal < 250 && (
          <p className="text-xs text-gray-500">
            Add item worth ₹{250 - subtotal} more to get free delivary.
          </p>
        )}

        <div className="flex justify-between text-base font-semibold border-t pt-2">
          <span>Grand Total</span>
          <span>₹{grandTotal}</span>
        </div>

        <button
          className={`mt-3 w-full rounded-lg bg-[#e23744] py-3 text-sm font-semibold text-white hover:bg-red-800 ${!restaurant.isActive ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={!restaurant.isActive}
          onClick={checkout}
        >
          {!restaurant.isActive ? "Restaurant is Closed" : "Proceed to Checkout"}
        </button>


        <button
          className="mt-3 w-full rounded-lg bg-[#2c2a2a] py-3 text-sm font-semibold text-white hover:bg-gray-900 flex justify-center items-center gap-3"
          onClick={clearCart}
          disabled={clearingCart}
        >
          Clear Cart <BiTrash size={16} />
        </button>
      </div>
    </div>
  );
};

export default Cart;
