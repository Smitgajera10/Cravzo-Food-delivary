import { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import { restaurantService, utilsService } from "../main";
import { useNavigate } from "react-router-dom";
import type { ICart, IMenuItem, IRestaurent } from "../types";
import toast from "react-hot-toast";
import { BiCreditCard, BiLoader } from "react-icons/bi";
import {loadStripe} from '@stripe/stripe-js'

interface Address {
  id: string;
  formattedAddress: string;
  mobile: number;
}

const Checkout = () => {
  const { cart, subtotal, quantity  } = useAppData();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  const [loadingAdress, setLoadingAddress] = useState(true);

  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!cart || cart.length === 0) {
        setLoadingAddress(false);
        return;
      }

      try {
        const { data } = await axios.get(
          `${restaurantService}/api/address/all`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          },
        );

        setAddresses(data.addresses || []);
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddresses();
  }, [cart]);
  const navigate = useNavigate();

  if (!cart || cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500 text-lg">Your cart is empty</p>
      </div>
    );
  }

  const restaurent = cart[0].restaurant as IRestaurent;

  const deliveryFee = subtotal < 250 ? 49 : 0;
  const platformFee = 7;
  const grandTotal = subtotal + deliveryFee + platformFee;

  const createOrder = async (paymentMethod: "RAZORPAY" | "STRIPE") => {
    if (!selectedAddressId) {
      alert("Please select a delivery address");
      return;
    }
    setCreatingOrder(true);
    try {
      const { data } = await axios.post(
        `${restaurantService}/api/order/new`,
        {
          paymentMethod,
          addressId: selectedAddressId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      return data;
    } catch (error) {
      toast.error("Failed to create order. Please try again.");
      console.error("Order creation error:", error);
      return null;
    } finally {
      setCreatingOrder(false);
    }
  };

  const payWithRazorpay = async () => {
    try {
      setLoadingRazorpay(true);
      const order = await createOrder("RAZORPAY");
      if (!order) {
        return;
      }

      const { orderId, amount } = order;

      const { data } = await axios.post(`${utilsService}/api/payment/create`, {
        orderId,
      });

      const { razorpayOrderId, key } = data;

      const options = {
        key,
        amount: amount * 100,
        currency: "INR",
        name: "Cravzo Food Delivery",
        description: "Food order payment",
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            await axios.post(`${utilsService}/api/payment/verify`, {
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success("Payment successful! 🎉");
            navigate("/paymentsuccess" + response.razorpay_payment_id);
          } catch (error) {
            toast.error("Payment verification failed.");
            console.error("Payment verification error:", error);
          }
        },
        theme: {
          color: "#E23744",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Razorpay error:", error);
      toast.error("Payment failed please refresh page and try again.");
    } finally {
      setLoadingRazorpay(false);
    }
  };

  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  const payWithStripe = async () => {
    try {
      setLoadingStripe(true);
      const order = await createOrder("STRIPE");
      if (!order) {
        return;
      }

      const { orderId } = order;
      try {
        const stripe = await stripePromise;

        const {data} = await axios.post(`${utilsService}/api/payment/stripe/create`, {
          orderId,
        });

        if(data.url){
          window.location.href = data.url;
        }else {
          toast.error("Failed to initiate Stripe payment.");
        }
      } catch (error) {
        toast.error("Stripe payment error. Please try again.");
        console.error("Stripe payment error:", error);
      }
    } catch (error) {
      console.error("Stripe payment error:", error);
      toast.error("Payment failed please refresh page and try again.");
    } finally {
      setLoadingStripe(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">{restaurent.name}</h2>
        <p className="text-sm text-gray-500">{restaurent.address}</p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <h3 className="font-semibold">Delivery Address</h3>

        {loadingAdress ? (
          <p className="text-sm text-gray-500">Loading Adresses ...</p>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-gray-500">
            No addresses found. Please add an address in your profile.
          </p>
        ) : (
          addresses.map((address) => (
            <label
              key={address.id}
              className={`flex gap-3 rounded-lg cursor-pointer transition border p-3 ${selectedAddressId === address.id ? "border-[#e23744] bg-red-50" : "hover:border-gray-50"}`}
            >
              <input
                type="radio"
                name="address"
                value={address.id}
                checked={selectedAddressId === address.id}
                onChange={() => setSelectedAddressId(address.id)}
              />
              <div>
                <p className="text-sm font-medium">
                  {address.formattedAddress}
                </p>
                <p className="text-xs text-gray-500">{address.mobile}</p>
              </div>
            </label>
          ))
        )}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-4">
        <h3 className="font-semibold">Order Summary</h3>

        {cart.map((cartitem: ICart) => {
          const item = cartitem.menu as IMenuItem;
          return (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.name} x {cartitem.quantity}
              </span>
              <span>₹{item.price * cartitem.quantity}</span>
            </div>
          );
        })}

        <hr />

        <div className="flex justify-between text-sm">
          <span>Items ({quantity})</span>
          <span>₹{subtotal}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Delivary fee</span>
          <span>{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</span>
        </div>
        <div className="flex justify-between text-sm">
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
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <h3 className="font-semibold">Payment Method</h3>

        <button
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2d7ff9] text-white text-sm font-semibold py-3 hover:bg-blue-500 disabled:opacity-50"
          onClick={payWithRazorpay}
          disabled={!selectedAddressId || loadingRazorpay || creatingOrder}
        >
          {loadingRazorpay ? (
            <BiLoader size={18} className="animate-spin" />
          ) : (
            <BiCreditCard size={18} />
          )}{" "}
          Pay with Razorpay
        </button>
        <button
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-black text-white text-sm font-semibold py-3 hover:bg-gray-800 disabled:opacity-50"
          onClick={payWithStripe}
          disabled={!selectedAddressId || loadingStripe || creatingOrder}
        >
          {loadingRazorpay ? (
            <BiLoader size={18} className="animate-spin" />
          ) : (
            <BiCreditCard size={18} />
          )}{" "}
          Pay with Stripe
        </button>
      </div>
    </div>
  );
};

export default Checkout;
