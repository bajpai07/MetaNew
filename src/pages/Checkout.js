import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import PaymentModal from "../components/PaymentModal";
import { API_BASE } from '../config/api';

/**
 * THE INVERSION. The showroom is dark; the paperwork is on paper.
 *
 * Checkout, the confirmation, order history and administration are the only
 * surfaces in the application set ink-on-bone. It is not a theme switch — it
 * marks the moment you stop looking and start transacting, and it gives the
 * utilitarian screens somewhere to belong instead of looking bolted on.
 *
 * Luxury checkout is fast and legible. Nothing here is decorated.
 */
export default function Checkout() {
  const { cartItems, fetchCart, userId } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    address: "",
    city: "",
    postalCode: "",
    country: "India"
  });

  const total =
    cartItems?.reduce(
      (acc, item) => acc + Number(item.priceAtPurchase) * Number(item.qty),
      0
    ) || 0;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cartItems || cartItems.length === 0) {
      toast.error("Your bag is empty");
      return;
    }

    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode) {
      toast.error("Complete the delivery address first");
      return;
    }

    setShowPayment(true);
  };

  const processSecurePayment = async () => {
    try {
      setShowPayment(false);
      const loadingToast = toast.loading("Placing your order");

      const payload = {
        userId: userId,
        shippingAddress,
        paymentMethod: "Virtual Gateway"
      };

      const config = user
        ? { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        : {};

      const res = await axios.post(
        `${API_BASE}/api/orders`,
        payload,
        config
      );

      await fetchCart();

      toast.success("Your order is placed", { id: loadingToast });
      navigate(`/order-success/${res.data._id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "That order didn't go through");
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="on-paper page gutter" style={{ paddingTop: "calc(var(--nav-h) + 96px)" }}>
        <h1 className="display display-l" style={{ marginBottom: "14px" }}>
          Your bag is empty
        </h1>
        <p className="meta measure" style={{ marginBottom: "36px" }}>
          There is nothing here to pay for.
        </p>
        <button className="textlink" onClick={() => navigate("/")}>
          Browse the collection
        </button>
      </div>
    );
  }

  return (
    <div className="on-paper page">
      <div className="gutter" style={{ paddingTop: "34px", paddingBottom: "24px" }}>
        <h1 className="display display-l">Checkout</h1>
      </div>

      <div className="rule" />

      <div
        className="gutter"
        style={{
          paddingTop: "36px",
          paddingBottom: "80px",
          display: "grid",
          gap: "56px",
          gridTemplateColumns: "1fr",
          maxWidth: "1100px"
        }}
        id="checkout-grid"
      >
        {/* Delivery */}
        <form onSubmit={handlePlaceOrder}>
          <h2 className="label" style={{ color: "var(--paper-ash)", marginBottom: "26px" }}>
            Delivery
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "26px", maxWidth: "480px" }}>
            <div>
              <label className="meta" htmlFor="ck-address" style={{ display: "block", marginBottom: "2px" }}>
                Street address
              </label>
              <input
                id="ck-address"
                className="field"
                type="text"
                required
                placeholder="Flat, building, street"
                value={shippingAddress.address}
                onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", gap: "24px" }}>
              <div style={{ flex: 1 }}>
                <label className="meta" htmlFor="ck-city" style={{ display: "block", marginBottom: "2px" }}>
                  City
                </label>
                <input
                  id="ck-city"
                  className="field"
                  type="text"
                  required
                  placeholder="Mumbai"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="meta" htmlFor="ck-pin" style={{ display: "block", marginBottom: "2px" }}>
                  Pincode
                </label>
                <input
                  id="ck-pin"
                  className="field"
                  type="text"
                  required
                  placeholder="400001"
                  value={shippingAddress.postalCode}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                  }
                />
              </div>
            </div>

            <button type="submit" className="btn btn-bone" style={{ width: "100%", marginTop: "14px" }}>
              Continue to payment
            </button>
          </div>
        </form>

        {/* Order */}
        <section>
          <h2 className="label" style={{ color: "var(--paper-ash)", marginBottom: "26px" }}>
            Your order
          </h2>

          {cartItems.map((item) => {
            const product = item.product || {};
            return (
              <div
                key={item._id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "18px",
                  padding: "18px 0",
                  borderBottom: "1px solid var(--paper-veil)"
                }}
              >
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: "62px", height: "82px", objectFit: "cover", flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "var(--t-s)", marginBottom: "4px" }}>
                    {product.name || "Product"}
                  </p>
                  <p className="meta">Quantity {item.qty}</p>
                </div>
                <p style={{ fontSize: "var(--t-s)" }}>
                  ₹{(item.priceAtPurchase * item.qty).toLocaleString("en-IN")}
                </p>
              </div>
            );
          })}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              paddingTop: "22px"
            }}
          >
            <span className="label" style={{ color: "var(--paper-ash)" }}>Total</span>
            <span className="display display-m">₹{total.toLocaleString("en-IN")}</span>
          </div>
        </section>
      </div>

      {showPayment && (
        <PaymentModal
          amount={total}
          onPay={processSecurePayment}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}
