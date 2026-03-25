import { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    activeOrders: 0,
    completedOrders: 0,
    catalogSize: 0, // Placeholder for future product fetch
    users: 0 // Placeholder
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Parallel fetches for Orders and Products
        const [ordersRes, productsRes] = await Promise.all([
           axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/orders/admin/all`, { headers: { Authorization: `Bearer ${token}` } }),
           axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/products`)
        ]);

        const allOrders = ordersRes.data;
        const allProducts = productsRes.data; // Assuming standard response array

        let rev = 0;
        let active = 0;
        let completed = 0;

        allOrders.forEach(order => {
           // If 'Delivered', it's completed. Otherwise Active.
           if (order.status === "Delivered" || order.status === "DELIVERED") {
              completed += 1;
              rev += order.totalPrice; // Only count delivered revenue, or count all? Let's count all realized revenue.
           } else {
              active += 1;
              rev += order.totalPrice; // Counting all placed orders as revenue
           }
        });

        setStats({
          revenue: rev,
          activeOrders: active,
          completedOrders: completed,
          catalogSize: allProducts.length,
          users: 2 // Hardcoded for now as we don't have a /users endpoint
        });

      } catch (err) {
        console.error("Dashboard Stats Error:", err);
      }
    };
    
    fetchDashboardStats();
  }, []);

  const metrics = [
    { title: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: "💰", color: "#03A685" },
    { title: "Active Orders", value: stats.activeOrders.toString(), icon: "📦", color: "#FF3F6C" },
    { title: "Completed Orders", value: stats.completedOrders.toString(), icon: "✅", color: "#4A90E2" },
    { title: "Products in Catalog", value: stats.catalogSize.toString(), icon: "📚", color: "#F5A623" }
  ];

  const chartData = {
    labels: ['Men', 'Women', 'Kids', 'Beauty', 'Studio'],
    datasets: [
      {
        label: 'Sales Output (₹)',
        data: [15500, 22300, 4200, 2150, 1149],
        backgroundColor: '#FF3F6C',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: "24px", color: "#282c3f", marginBottom: "30px", borderBottom: "1px solid #eaeaec", paddingBottom: "15px" }}>
        Dashboard Overview
      </h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: "#fff", padding: "24px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", borderLeft: `4px solid ${m.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <span style={{ fontSize: "14px", color: "#535766", fontWeight: "600", textTransform: "uppercase" }}>{m.title}</span>
              <span style={{ fontSize: "24px" }}>{m.icon}</span>
            </div>
            <div style={{ fontSize: "32px", fontWeight: "900", color: "#282c3f" }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "40px", background: "#fff", padding: "24px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: "16px", color: "#282c3f", marginBottom: "20px", textTransform: "uppercase" }}>Sales Per Category</h2>
        <div style={{ height: "300px" }}>
          <Bar options={chartOptions} data={chartData} />
        </div>
      </div>
    </div>
  );
}
