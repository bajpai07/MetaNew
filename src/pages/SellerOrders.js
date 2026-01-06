import { useEffect, useState } from "react";
import axios from "axios";

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/orders/seller",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setOrders(res.data);
    } catch (err) {
      alert("Failed to fetch seller orders");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `http://localhost:4000/api/orders/${id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchOrders();
    } catch (err) {
      alert("Status update failed");
    }
  };

  return (
    <div>
      <h2>Seller Orders</h2>

      {orders.length === 0 && <p>No orders yet</p>}

      {orders.map((order) => (
        <div key={order._id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <p><strong>Order ID:</strong> {order._id}</p>
          <p><strong>Status:</strong> {order.status}</p>

          {order.orderItems.map((item) => (
            <div key={item._id}>
              <p>{item.name} × {item.qty}</p>
            </div>
          ))}

          {order.status === "PAID" && (
            <button onClick={() => updateStatus(order._id, "SHIPPED")}>
              Mark as Shipped
            </button>
          )}

          {order.status === "SHIPPED" && (
            <button onClick={() => updateStatus(order._id, "DELIVERED")}>
              Mark as Delivered
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
