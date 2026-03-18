import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:4000/api/orders/admin/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch Admin Orders Log");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:4000/api/orders/admin/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Order status updated perfectly");
      fetchOrders(); // refresh view
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div>Loading Global Orders...</div>;

  return (
    <div>
      <h1 style={{ fontSize: "24px", color: "#282c3f", marginBottom: "30px", borderBottom: "1px solid #eaeaec", paddingBottom: "15px" }}>
        Global Order Logs
      </h1>

      <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9f9f9", borderBottom: "1px solid #eaeaec" }}>
            <tr>
              <th style={{ padding: "15px", textAlign: "left", fontSize: "12px", color: "#7e818c", textTransform: "uppercase" }}>Order ID</th>
              <th style={{ padding: "15px", textAlign: "left", fontSize: "12px", color: "#7e818c", textTransform: "uppercase" }}>Customer Name</th>
              <th style={{ padding: "15px", textAlign: "left", fontSize: "12px", color: "#7e818c", textTransform: "uppercase" }}>Order Date</th>
              <th style={{ padding: "15px", textAlign: "left", fontSize: "12px", color: "#7e818c", textTransform: "uppercase" }}>Total Amount</th>
              <th style={{ padding: "15px", textAlign: "right", fontSize: "12px", color: "#7e818c", textTransform: "uppercase" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id} style={{ borderBottom: "1px solid #f2f2f2" }}>
                <td style={{ padding: "15px", fontSize: "14px", fontWeight: "bold" }}>{o._id}</td>
                <td style={{ padding: "15px", color: "#535766" }}>{o.user?.name || 'Guest User'}</td>
                <td style={{ padding: "15px", color: "#535766" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: "15px", fontWeight: "bold", color: "#FF3F6C" }}>₹{o.totalPrice}</td>
                <td style={{ padding: "15px", textAlign: "right" }}>
                  <select 
                    value={o.status === "PLACED" ? "Pending" : o.status === "DELIVERED" ? "Delivered" : o.status} 
                    onChange={(e) => handleStatusChange(o._id, e.target.value)}
                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #eaeaec", fontWeight: "bold", background: "#f9f9f9", color: "#282c3f" }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
