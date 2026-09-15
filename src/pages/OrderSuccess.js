import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from '../config/api';

/**
 * The receipt. Set on paper like the checkout that produced it, and read like
 * a document rather than a celebration — no ✅, no exclamation mark, no
 * centred confetti layout. A house confirms an order; it does not congratulate
 * you for placing one.
 */
export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/orders/${id}`)
      .then((res) => {
        setOrder(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="on-paper page gutter" style={{ paddingTop: "calc(var(--nav-h) + 96px)" }}>
        <p className="label" style={{ color: "var(--paper-ash)" }}>Loading</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="on-paper page gutter" style={{ paddingTop: "calc(var(--nav-h) + 96px)" }}>
        <h1 className="display display-l" style={{ marginBottom: "14px" }}>
          We can't find that order
        </h1>
        <p className="meta measure" style={{ marginBottom: "36px" }}>
          The reference may be wrong, or the order may belong to another account.
        </p>
        <button className="textlink" onClick={() => navigate("/")}>
          Browse the collection
        </button>
      </div>
    );
  }

  const rows = [
    ["Order", order._id],
    order.transactionId ? ["Transaction", order.transactionId] : null,
    ["Placed", new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })],
    ["Payment", order.paymentMethod || "Virtual gateway"],
    order.shippingAddress
      ? ["Delivering to", `${order.shippingAddress.city}, ${order.shippingAddress.postalCode}`]
      : null
  ].filter(Boolean);

  return (
    <div className="on-paper page">
      <div className="gutter" style={{ paddingTop: "34px", paddingBottom: "24px", maxWidth: "760px" }}>
        <h1 className="display display-l" style={{ marginBottom: "14px" }}>
          Your order is placed
        </h1>
        <p className="meta measure">
          We've sent the details to your email. You'll hear from us again when
          it ships.
        </p>
      </div>

      <div className="rule" />

      <div className="gutter" style={{ paddingTop: "30px", paddingBottom: "80px", maxWidth: "760px" }}>
        <dl style={{ marginBottom: "44px" }}>
          {rows.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "24px",
                padding: "13px 0",
                borderBottom: "1px solid var(--paper-veil)",
                fontSize: "var(--t-s)"
              }}
            >
              <dt style={{ color: "var(--paper-ash)" }}>{label}</dt>
              <dd style={{ textAlign: "right", wordBreak: "break-all" }}>{value}</dd>
            </div>
          ))}
        </dl>

        <h2 className="label" style={{ color: "var(--paper-ash)", marginBottom: "18px" }}>
          Pieces
        </h2>

        {order.orderItems.map((item) => (
          <div
            key={item._id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "24px",
              padding: "13px 0",
              borderBottom: "1px solid var(--paper-veil)",
              fontSize: "var(--t-s)"
            }}
          >
            <span>
              {item.name}
              <span style={{ color: "var(--paper-ash)" }}> × {item.qty}</span>
            </span>
            <span>₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
          </div>
        ))}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            paddingTop: "24px",
            marginBottom: "48px"
          }}
        >
          <span className="label" style={{ color: "var(--paper-ash)" }}>Paid</span>
          <span className="display display-m">
            ₹{Number(order.totalPrice).toLocaleString("en-IN")}
          </span>
        </div>

        <button className="textlink" onClick={() => navigate("/")}>
          Browse the collection
        </button>
      </div>
    </div>
  );
}
