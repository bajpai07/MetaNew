import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Calling the API directly to bypass the token header requirement for guest flows
    axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/orders/${id}`)
      .then(res => {
          setOrder(res.data);
          setLoading(false);
      })
      .catch(err => {
          console.error(err);
          setLoading(false);
      });
  }, [id]);

  if (loading) {
     return <div style={{ textAlign: "center", padding: "100px" }}><h2>Loading your order details...</h2></div>;
  }

  if (!order) {
     return <div style={{ textAlign: "center", padding: "100px" }}><h2>Order not found</h2></div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "40px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", textAlign: "center" }}>
      <div style={{ fontSize: "60px", color: "#20B2AA", marginBottom: "20px" }}>✅</div>
      <h1 style={{ color: "#282c3f", marginBottom: "10px" }}>Order Placed Successfully!</h1>
      <p style={{ color: "#666", fontSize: "16px", marginBottom: "30px" }}>Thank you for shopping with MetaShop. Your order is confirmed.</p>
      
      <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "8px", textAlign: "left", marginBottom: "30px" }}>
        <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#666" }}>Order ID: <strong style={{ color: "#282c3f" }}>{order._id}</strong></p>
        {order.transactionId && (
          <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#666" }}>Transaction ID: <strong style={{ color: "#20B2AA" }}>{order.transactionId}</strong></p>
        )}
        <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#666" }}>Placed On: <strong style={{ color: "#282c3f" }}>{new Date(order.createdAt).toLocaleDateString()}</strong></p>
        <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#666" }}>Payment Method: <strong style={{ color: "#282c3f" }}>{order.paymentMethod || 'Virtual Gateway'}</strong></p>
        <p style={{ margin: "0 0 0 0", fontSize: "14px", color: "#666" }}>Delivering to: <strong style={{ color: "#282c3f" }}>{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</strong></p>
      </div>

      <div style={{ textAlign: "left" }}>
        <h3 style={{ borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "15px" }}>Order Items</h3>
        {order.orderItems.map(item => (
          <div key={item._id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #f9f9f9" }}>
             <span>{item.name} <span style={{ color: "#888" }}>× {item.qty}</span></span>
             <span style={{ fontWeight: "bold" }}>₹{item.price * item.qty}</span>
          </div>
        ))}
        
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "20px", borderTop: "2px dashed #ccc" }}>
           <h3 style={{ margin: 0 }}>Total Paid:</h3>
           <h2 style={{ margin: 0, color: "#111" }}>₹{order.totalPrice}</h2>
        </div>
      </div>

      <button onClick={() => navigate("/")} style={{ marginTop: "40px", padding: "15px 40px", background: "#FF3F6C", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>
        CONTINUE SHOPPING
      </button>
    </div>
  );
}
