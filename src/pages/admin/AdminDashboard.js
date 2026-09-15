import { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import MetricsPanel from "../../components/MetricsPanel";
import { API_BASE } from '../../config/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Four figures and one chart. The metric tiles have lost their coloured left
 * borders, their emoji and their drop shadows — a number set large in the
 * display face with a label under it does the job, and the chart is drawn in
 * oxblood so the only colour on the page is the brand's one colour.
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    activeOrders: 0,
    completedOrders: 0,
    catalogSize: 0,
    users: 0
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("token");

        const [ordersRes, productsRes] = await Promise.all([
          axios.get(
            `${API_BASE}/api/orders/admin/all`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(`${API_BASE}/api/products`)
        ]);

        const allOrders = ordersRes.data;
        const allProducts = productsRes.data;

        let rev = 0;
        let active = 0;
        let completed = 0;

        allOrders.forEach((order) => {
          if (order.status === "Delivered" || order.status === "DELIVERED") {
            completed += 1;
            rev += order.totalPrice;
          } else {
            active += 1;
            rev += order.totalPrice;
          }
        });

        setStats({
          revenue: rev,
          activeOrders: active,
          completedOrders: completed,
          catalogSize: allProducts.length,
          users: 2
        });
      } catch (err) {
        console.error("Dashboard Stats Error:", err);
      }
    };

    fetchDashboardStats();
  }, []);

  const figures = [
    ["Revenue", `₹${stats.revenue.toLocaleString("en-IN")}`],
    ["Open orders", String(stats.activeOrders)],
    ["Delivered", String(stats.completedOrders)],
    ["Pieces in catalogue", String(stats.catalogSize)]
  ];

  const chartData = {
    labels: ["Men", "Women", "Kids", "Beauty", "Studio"],
    datasets: [
      {
        label: "Sales (₹)",
        data: [15500, 22300, 4200, 2150, 1149],
        backgroundColor: "#5E1A22",
        borderRadius: 0,
        barThickness: 28
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#6B6259" } },
      y: {
        grid: { color: "rgba(20,17,15,0.10)" },
        border: { display: false },
        ticks: { color: "#6B6259" }
      }
    }
  };

  return (
    <div>
      <h1 className="display display-l" style={{ marginBottom: "36px" }}>
        Overview
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1px",
          background: "var(--paper-veil)",
          marginBottom: "56px"
        }}
      >
        {figures.map(([label, value]) => (
          <div key={label} style={{ background: "var(--paper)", padding: "24px 22px" }}>
            <p className="display display-m" style={{ marginBottom: "8px" }}>
              {value}
            </p>
            <p className="label" style={{ color: "var(--paper-ash)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <h2 className="label" style={{ color: "var(--paper-ash)", marginBottom: "20px" }}>
        Sales by category
      </h2>
      <div style={{ height: "300px", marginBottom: "56px" }}>
        <Bar options={chartOptions} data={chartData} />
      </div>

      <MetricsPanel />
    </div>
  );
}
