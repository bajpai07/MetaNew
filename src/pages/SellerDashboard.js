import { useEffect, useState } from "react";
import axios from "../api/api";
import toast from "react-hot-toast";

export default function SellerDashboard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios
      .get("/orders/seller")
      .then((res) => setOrders(res.data))
      .catch((err) => {
        console.error(err);
        toast.error("Couldn't load your orders");
      });
  }, []);

  return (
    <div className="on-paper page">
      <div className="gutter" style={{ paddingTop: "34px", paddingBottom: "24px" }}>
        <h1 className="display display-l">Seller</h1>
      </div>

      <div className="rule" />

      <div className="gutter" style={{ paddingBottom: "80px", maxWidth: "900px" }}>
        {orders.length === 0 && (
          <p className="meta" style={{ paddingTop: "40px" }}>No orders yet.</p>
        )}

        {orders.map((order) => (
          <article key={order._id} style={{ padding: "28px 0", borderBottom: "1px solid var(--paper-veil)" }}>
            <p className="label" style={{ color: "var(--paper-ash)", marginBottom: "6px" }}>
              {order.status}
            </p>
            <p className="meta" style={{ marginBottom: "16px", wordBreak: "break-all" }}>
              {order._id}
            </p>

            {order.orderItems.map((item) => (
              <p key={item._id} style={{ fontSize: "var(--t-s)", marginBottom: "4px" }}>
                {item.name}
                <span style={{ color: "var(--paper-ash)" }}>
                  {" "}× {item.qty} · ₹{Number(item.price).toLocaleString("en-IN")}
                </span>
              </p>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}
