import { useEffect, useState } from "react";
import axios from "../api/api";

export default function SellerDashboard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios
      .get("/orders/seller")
      .then((res) => setOrders(res.data))
      .catch((err) => {
        console.error(err);
        alert("Failed to fetch seller orders");
      });
  }, []);

  return (
    <div>
      <h2>Seller Orders</h2>

      {orders.length === 0 && <p>No orders yet</p>}

      {orders.map((order) => (
        <div
          key={order._id}
          style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}
        >
          <p><b>Order ID:</b> {order._id}</p>
          <p><b>Status:</b> {order.status}</p>

          {order.orderItems.map((item) => (
            <p key={item._id}>
              {item.name} × {item.qty} – ₹{item.price}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
