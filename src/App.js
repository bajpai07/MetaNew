import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderSuccess from "./pages/OrderSuccess";
import SellerDashboard from "./pages/SellerDashboard";
import SellerOrders from "./pages/SellerOrders";
import ProductPage from "./pages/ProductPage";
import ARViewer from "./pages/ARViewer";
import ThreeDTryOnPage from "./pages/ThreeDTryOnPage";

// ✅ Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminOrders from "./pages/admin/AdminOrders";

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {children}
  </motion.div>
);

function App() {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
        <Route path="/cart" element={<PageWrapper><Cart /></PageWrapper>} />
        <Route path="/checkout" element={<PageWrapper><Checkout /></PageWrapper>} />
        <Route path="/orders" element={<PageWrapper><Orders /></PageWrapper>} />

        {/* Product */}
        <Route path="/products/:id" element={<PageWrapper><ProductPage /></PageWrapper>} />

        {/* ✅ AR ROUTE */}
        <Route path="/ar/:model" element={<PageWrapper><ARViewer /></PageWrapper>} />

        {/* ✅ 3D Try-On Route */}
        <Route path="/3d-tryon" element={<PageWrapper><ThreeDTryOnPage /></PageWrapper>} />

        {/* ✅ Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<PageWrapper><AdminDashboard /></PageWrapper>} />
          <Route path="inventory" element={<PageWrapper><AdminInventory /></PageWrapper>} />
          <Route path="orders" element={<PageWrapper><AdminOrders /></PageWrapper>} />
        </Route>

        {/* Seller */}
        <Route path="/seller/dashboard" element={<PageWrapper><SellerDashboard /></PageWrapper>} />
        <Route path="/seller/orders" element={<PageWrapper><SellerOrders /></PageWrapper>} />

        <Route path="/order-success/:id" element={<PageWrapper><OrderSuccess /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
