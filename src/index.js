import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

const root = ReactDOM.createRoot(document.getElementById("root"));

/**
 * Toasts inherit the system: square, bone on ink, body face at 13px, no icon
 * and no coloured status bar down the side. A message that has to be
 * colour-coded green or red usually has not been written properly.
 */
root.render(
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <Toaster
          position="bottom-center"
          reverseOrder={false}
          toastOptions={{
            duration: 3200,
            style: {
              background: "#EDE7DE",
              color: "#14110F",
              borderRadius: 0,
              fontFamily:
                "'Instrument Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
              fontSize: "13px",
              letterSpacing: "0.01em",
              padding: "14px 18px",
              boxShadow: "none",
              maxWidth: "420px"
            },
            success: { iconTheme: { primary: "#5E1A22", secondary: "#EDE7DE" } },
            error: { iconTheme: { primary: "#5E1A22", secondary: "#EDE7DE" } }
          }}
        />
        <App />
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);
