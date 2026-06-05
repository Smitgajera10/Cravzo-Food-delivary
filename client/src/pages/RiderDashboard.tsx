import { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { riderService } from "../main";
import toast from "react-hot-toast";
import { BiMapPin, BiUpload } from "react-icons/bi";

interface IRider {
  id: string;
  userId: string;
  name: string;
  picture: string;
  phoneNumber: BigInt;
  addharNumber: string;
  drivingLicenseNumber: string;
  isVerified: Boolean;
  isAvailable: Boolean;
}

const RiderDashboard = () => {
  const { user } = useAppData();
  const { socket } = useSocket();
  const [profile, setProfile] = useState<IRider | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [addharNumber, setAddharNumber] = useState("");
  const [drivingLicenceNumber, setDrivingLicenceNumber] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${riderService}/api/rider/myprofile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setProfile(data || null);
    } catch (err) {
      setProfile(null);
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "RIDER") {
      fetchProfile();
    } else setLoading(false);
  }, [user]);

  const toggleAvailability = async () => {
    if (!navigator.geolocation) {
      toast.error("Location Acess is required.");
      return;
    }

    setToggling(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await axios.patch(
          `${riderService}/api/rider/toggle`,
          {
            isAvailable: !profile,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          },
        );

        toast.success(
          `You are now ${!profile?.isAvailable ? "Online" : "Offline"}`,
        );

        fetchProfile();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to toggle availability.",
        );
      } finally {
        setToggling(false);
      }
    });
  };

  const handleSubmit = async () => {
    if (!navigator.geolocation) {
      toast.error("Location Acess is required.");
      return;
    }
    setSubmitting(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const formData = new FormData();
      formData.append("phoneNumber", phoneNumber);
      formData.append("addharNumber", addharNumber);
      formData.append("drivingLicenceNumber", drivingLicenceNumber);
      formData.append("latitude", String(pos.coords.latitude));
      formData.append("longitude", String(pos.coords.longitude));
      if (image) formData.append("file", image);

      try {
        const { data } = await axios.post(
          `${riderService}/api/rider/new`,
          {
            formData,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          },
        );

        toast.success(data.message);

        fetchProfile();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to toggle availability.",
        );
      } finally {
        setSubmitting(false);
      }
    });
  };

  if (user?.role !== "RIDER") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
        You are not a registered as rider.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
        Loading Rider Details...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow-sm space-y-5">
          <h1 className="text-xl font-semibold">Add Your Profile</h1>
          <input
            type="number"
            placeholder="Addhar Number"
            value={addharNumber}
            onChange={(e) => setAddharNumber(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none"
          />
          <input
            type="number"
            placeholder="Contact Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none"
          />
          <input
            type="text"
            placeholder="Driving Licence"
            value={drivingLicenceNumber}
            onChange={(e) => setDrivingLicenceNumber(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none"
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm text-gray-600 hover:bg-gray-50">
            <BiUpload className="h-5 w-5 text-red-500" />
            {image ? image.name : "Uplaod profile image"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </label>

          <button
            className="w-full rounded-lg py-3 text-sm font-semibold text-white bg-[#E23744]"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting..." : "Add Profile"}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-md px-4 py-4">
        <div className="rounded-xl bg-white p-4 shadow space-y-3">
          <img
            src={profile.picture}
            className="mx-auto h-24 w-24 rounded-full object-cover"
            alt=""
          />

          <p className="text-center font-semibold">{user?.name}</p>
          <p className="text-center text-sm text-gray-500">
            {profile.phoneNumber.toString()}
          </p>

          <div className="flex justify-center gap-2">
            <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-600">
              {profile.isVerified ? "Verified" : "Pending"}
            </span>
            <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-600">
              {profile.isAvailable ? "Online" : "Offline"}
            </span>
          </div>

          <div>
            <p className="text-blue-400">
              Please be within 5km radius of any restaurant (which we call
              hotspot) before going online as a rider to recive orders.
            </p>
          </div>

          {profile.isVerified && (
            <button
              onClick={toggleAvailability}
              disabled={toggling}
              className={`w-full py-2 rounded-lg text-white font-semibold ${toggling ? "bg-gray-400" : profile.isAvailable ? "bg-gray-600" : "bg-[#e23744]"}`}
            >
              {toggling
                ? "Updating..."
                : profile.isAvailable
                ? "Go Offline"
                : "Go Online"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
