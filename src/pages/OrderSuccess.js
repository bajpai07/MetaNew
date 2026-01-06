import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/api";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    API.get(`/orders/${id}`).then(res => setOrder(res.data));
  }, [id]);

  if (!order) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>🎉 Order Successful</h2>
      <p><b>Order ID:</b> {order._id}</p>

      <h3>Items:</h3>
      {order.orderItems.map(item => (
        <p key={item._id}>
          {item.name} × {item.qty} — ₹{item.price}
        </p>
      ))}

      <h3>Total: ₹{order.totalPrice}</h3>
    </div>
  );
}
