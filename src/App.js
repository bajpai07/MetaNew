import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import OrderSuccess from "./pages/OrderSuccess";
import SellerDashboard from "./pages/SellerDashboard";
import SellerOrders from "./pages/SellerOrders";
import ProductPage from "./pages/ProductPage";
import ARViewer from "./pages/ARViewer"; // ✅ ADD THIS

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/my-orders" element={<MyOrders />} />

        {/* Product */}
        <Route path="/products/:id" element={<ProductPage />} />

        {/* ✅ AR ROUTE */}
        <Route path="/ar/:model" element={<ARViewer />} />

        {/* Seller */}
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/orders" element={<SellerOrders />} />

        <Route path="/order-success/:id" element={<OrderSuccess />} />
      </Routes>
    </>
  );
}

export default App;
