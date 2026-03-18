import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
           navigate("/login");
           return;
        }

        const { data } = await axios.get("http://localhost:4000/api/orders/user", {
          headers: { Authorization: `Bearer ${token}` }
        });

        setOrders(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load your orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <h2 style={{ color: "#7e818c" }}>Loading your orders...</h2>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <h2 style={{ color: "#282c3f", marginBottom: "15px" }}>You haven't placed any orders yet.</h2>
        <button onClick={() => navigate("/")} style={{ padding: "12px 24px", background: "#FF3F6C", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>
          START SHOPPING
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ borderBottom: "1px solid #eaeaec", paddingBottom: "15px", marginBottom: "30px", color: "#282c3f" }}>My Orders</h2>

      {orders.map((order) => (
        <div key={order._id} style={{ background: "#fff", border: "1px solid #eaeaec", borderRadius: "8px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px dashed #eaeaec", paddingBottom: "15px", marginBottom: "15px" }}>
            <div>
              <p style={{ margin: "0 0 5px 0", fontSize: "14px", color: "#7e818c" }}>Order ID: <strong style={{ color: "#282c3f" }}>{order._id}</strong></p>
              {order.transactionId && (
                <p style={{ margin: "0 0 5px 0", fontSize: "14px", color: "#7e818c" }}>Txn ID: <strong style={{ color: "#20B2AA", background: "#E8F8F5", padding: "2px 6px", borderRadius: "4px" }}>{order.transactionId}</strong></p>
              )}
              <p style={{ margin: "0", fontSize: "14px", color: "#7e818c" }}>Placed On: <strong style={{ color: "#282c3f" }}>{new Date(order.createdAt).toLocaleDateString()}</strong></p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: "0 0 5px 0", fontSize: "18px", fontWeight: "bold", color: "#282c3f" }}>₹{order.totalPrice}</p>
              <span style={{ display: "inline-block", background: order.status === "DELIVERED" ? "#E6F4EA" : "#FFF7E6", color: order.status === "DELIVERED" ? "#1E8E3E" : "#F2994A", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                {order.status}
              </span>
            </div>
          </div>

          <div>
             {order.orderItems.map((item) => (
               <div key={item.product} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                 {item.image ? (
                   <img src={item.image} alt={item.name} style={{ width: "50px", height: "70px", objectFit: "cover", borderRadius: "4px", marginRight: "15px" }} />
                 ) : (
                   <div style={{ width: "50px", height: "70px", background: "#f4f4f5", borderRadius: "4px", marginRight: "15px" }}></div>
                 )}
                 <div>
                   <p style={{ margin: "0 0 5px 0", fontSize: "14px", fontWeight: "bold", color: "#282c3f" }}>{item.name || "Product Name"}</p>
                   <p style={{ margin: 0, fontSize: "12px", color: "#7e818c" }}>Qty: {item.qty} | Price: ₹{item.price}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>
      ))}
    </div>
  );
}
