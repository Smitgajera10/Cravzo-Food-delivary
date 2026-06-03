import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import "leaflet/dist/leaflet.css";
import { SocketProvider } from "./context/SocketContext";

export const authService = import.meta.env.VITE_AUTH_SERVICE;
export const restaurantService = import.meta.env.VITE_RESTAURANT_SERVICE;
export const utilsService = import.meta.env.VITE_UTILS_SERVICE;
export const realtimeService = import.meta.env.VITE_REALTIME_SERVICE;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AppProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AppProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
