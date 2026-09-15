import { Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import Navbar from "./components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderSuccess from "./pages/OrderSuccess";
import ProductPage from "./pages/ProductPage";
import HistoryPage from "./pages/HistoryPage";

/**
 * Split off the routes that carry the heavy libraries.
 *
 * The 3D and AR screens pull in three.js and its React bindings; the admin
 * screens pull in a charting library. All of it was being downloaded by every
 * visitor before the first photograph appeared, to render pages most of them
 * will never open. These now arrive when the route does.
 *
 * The shopping path — home, product, bag, checkout, orders — stays eager, and
 * the fitting room is deliberately left alone: it is the one feature that must
 * not gain a new loading step.
 */
const ARViewer = lazy(() => import("./pages/ARViewer"));
const ThreeDTryOnPage = lazy(() => import("./pages/ThreeDTryOnPage"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerOrders = lazy(() => import("./pages/SellerOrders"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));

/**
 * A slow crossfade. No y-translation — sliding every page up by 12px is the
 * house style of a template, and it fights the wipe on the try-on result,
 * which is the only movement here meant to be noticed.
 */
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

function App() {
  const location = useLocation();
  return (
    <>
      <Navbar />
      {/* A held ink ground rather than a spinner: the split routes are rare and
          a flash of chrome would be louder than the wait. */}
      <Suspense
        fallback={<div style={{ minHeight: "100svh", background: "var(--ink)" }} />}
      >
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

          {/* AR */}
          <Route path="/ar/:model" element={<PageWrapper><ARViewer /></PageWrapper>} />

          {/* 3D try-on */}
          <Route path="/3d-tryon" element={<PageWrapper><ThreeDTryOnPage /></PageWrapper>} />

          {/* Saved looks */}
          <Route path="/history" element={<PageWrapper><HistoryPage /></PageWrapper>} />

          {/* Administration */}
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
      </Suspense>
    </>
  );
}

export default App;
