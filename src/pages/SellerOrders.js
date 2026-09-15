import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE } from '../config/api';

/**
 * Seller view. Utilitarian, on paper, same hairlines and type as the rest of
 * the back office — `alert()` replaced by the same toast vocabulary the shop
 * uses.
 */
export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/orders/seller`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(res.data);
    } catch (err) {
      toast.error("Couldn't load your orders");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `${API_BASE}/api/orders/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Status updated");
      fetchOrders();
    } catch (err) {
      toast.error("Couldn't update that status");
    }
  };

  return (
    <div className="on-paper page">
      <div className="gutter" style={{ paddingTop: "34px", paddingBottom: "24px" }}>
        <h1 className="display display-l">Seller orders</h1>
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
                {item.name} <span style={{ color: "var(--paper-ash)" }}>× {item.qty}</span>
              </p>
            ))}

            {order.status === "PAID" && (
              <button onClick={() => updateStatus(order._id, "SHIPPED")} className="textlink" style={{ marginTop: "18px" }}>
                Mark as shipped
              </button>
            )}

            {order.status === "SHIPPED" && (
              <button onClick={() => updateStatus(order._id, "DELIVERED")} className="textlink" style={{ marginTop: "18px" }}>
                Mark as delivered
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
