import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE } from '../../config/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${API_BASE}/api/orders/admin/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't load the order log");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/api/orders/admin/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Status updated");
      fetchOrders();
    } catch (err) {
      toast.error("Couldn't update that status");
    }
  };

  if (loading) {
    return <p className="label" style={{ color: "var(--paper-ash)" }}>Loading orders</p>;
  }

  return (
    <div>
      <h1 className="display display-l" style={{ marginBottom: "32px" }}>
        Orders
      </h1>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "620px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--paper-veil)" }}>
              {["Order", "Customer", "Placed", "Total", "Status"].map((h, i) => (
                <th
                  key={h}
                  className="label"
                  style={{
                    textAlign: i === 4 ? "right" : "left",
                    color: "var(--paper-ash)",
                    padding: "0 16px 14px 0",
                    fontWeight: 500
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} style={{ borderBottom: "1px solid var(--paper-veil)" }}>
                <td style={{ padding: "14px 16px 14px 0", fontSize: "var(--t-s)", wordBreak: "break-all" }}>
                  {o._id}
                </td>
                <td style={{ padding: "14px 16px 14px 0", fontSize: "var(--t-s)", color: "var(--paper-ash)" }}>
                  {o.user?.name || "Guest"}
                </td>
                <td style={{ padding: "14px 16px 14px 0", fontSize: "var(--t-s)", color: "var(--paper-ash)", whiteSpace: "nowrap" }}>
                  {new Date(o.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </td>
                <td style={{ padding: "14px 16px 14px 0", fontSize: "var(--t-s)", whiteSpace: "nowrap" }}>
                  ₹{Number(o.totalPrice).toLocaleString("en-IN")}
                </td>
                <td style={{ padding: "10px 0", textAlign: "right" }}>
                  <select
                    className="field"
                    aria-label={`Status for order ${o._id}`}
                    value={
                      o.status === "PLACED"
                        ? "Pending"
                        : o.status === "DELIVERED"
                        ? "Delivered"
                        : o.status
                    }
                    onChange={(e) => handleStatusChange(o._id, e.target.value)}
                    style={{ width: "auto", minWidth: "140px", textAlign: "right", fontSize: "var(--t-s)" }}
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
