import { useEffect, useState } from "react";
import axios from "axios";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");

        const { data } = await axios.get(
          "http://localhost:4000/api/orders/my",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setOrders(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <h2>Loading orders...</h2>;

  if (orders.length === 0) {
    return <h2>No orders yet</h2>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Orders</h2>

      {orders.map((order) => (
        <div
          key={order._id}
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "15px",
          }}
        >
          <p><b>Order ID:</b> {order._id}</p>
          <p><b>Total:</b> ₹{order.totalPrice}</p>
          <p><b>Status:</b> {order.isPaid ? "Paid" : "Pending"}</p>

          <h4>Items:</h4>
          {order.orderItems.map((item) => (
            <div key={item.product}>
              {item.name} × {item.qty} — ₹{item.price}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
