import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE } from '../config/api';

/**
 * Order history — paperwork, so it sits on paper. A ledger of hairline-ruled
 * entries rather than a stack of shadowed cards; status is a word, not a
 * coloured pill.
 */
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const { data } = await axios.get(
          `${API_BASE}/api/orders/user`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setOrders(data);
      } catch (err) {
        console.error(err);
        toast.error("Couldn't load your orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  if (loading) {
    return (
      <div className="on-paper page gutter" style={{ paddingTop: "calc(var(--nav-h) + 96px)" }}>
        <p className="label" style={{ color: "var(--paper-ash)" }}>Loading</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="on-paper page gutter" style={{ paddingTop: "calc(var(--nav-h) + 96px)" }}>
        <h1 className="display display-l" style={{ marginBottom: "14px" }}>
          No orders yet
        </h1>
        <p className="meta measure" style={{ marginBottom: "36px" }}>
          Anything you buy will be recorded here.
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
        <h1 className="display display-l">Orders</h1>
      </div>

      <div className="rule" />

      <div className="gutter" style={{ paddingBottom: "80px", maxWidth: "900px" }}>
        {orders.map((order) => (
          <article key={order._id} style={{ padding: "30px 0", borderBottom: "1px solid var(--paper-veil)" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "24px",
                flexWrap: "wrap",
                marginBottom: "20px"
              }}
            >
              <div>
                <p className="label" style={{ color: "var(--paper-ash)", marginBottom: "6px" }}>
                  {order.status}
                </p>
                <p className="meta" style={{ wordBreak: "break-all" }}>
                  {order._id}
                </p>
                <p className="meta">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </p>
              </div>
              <p className="display display-m">
                ₹{Number(order.totalPrice).toLocaleString("en-IN")}
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
              {order.orderItems.map((item) => (
                <div
                  key={item.product || item._id}
                  style={{ display: "flex", gap: "14px", alignItems: "center", minWidth: "220px" }}
                >
                  <div style={{ width: "46px", height: "62px", background: "var(--paper-raised)", flexShrink: 0 }}>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: "var(--t-s)" }}>{item.name || "Product"}</p>
                    <p className="meta">
                      × {item.qty} · ₹{Number(item.price).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
