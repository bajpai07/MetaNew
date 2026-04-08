import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import PaymentModal from "../components/PaymentModal";

export default function Checkout() {
  const { cartItems, fetchCart, userId } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    address: "",
    city: "",
    postalCode: "",
    country: "India"
  });

  const total = cartItems?.reduce((acc, item) => acc + (Number(item.priceAtPurchase) * Number(item.qty)), 0) || 0;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cartItems || cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode) {
      toast.error("Please fill all shipping fields");
      return;
    }
    
    // Intercept checkout to open Virtual Gateway Modal
    setShowPayment(true);
  };

  const processSecurePayment = async () => {
    try {
      setShowPayment(false);
      const loadingToast = toast.loading("Processing order securely...");
      
      // Send the strict, identical context userId
      const payload = {
        userId: userId,
        shippingAddress,
        paymentMethod: "Virtual Gateway"
      };

      const config = user ? { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } } : {};

      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/orders`, payload, config);
      
      // Backend automatically wiped the cart. Just refresh frontend state.
      await fetchCart(); 

      toast.success("Payment Verified & Order Placed Successfully!", { id: loadingToast });
      navigate(`/order-success/${res.data._id}`);
      
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Order processing failed");
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <h2>Your bag is empty</h2>
        <button onClick={() => navigate("/")} style={{ padding: "10px 20px", background: "#FF3F6C", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Go to Shop
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "40px", padding: "100px 40px 40px", maxWidth: "1200px", margin: "0 auto", alignItems: "flex-start", flexWrap: "wrap", minHeight: "100vh", background: "var(--black)", color: "var(--white)" }}>
      
      {/* LEFT PANE: SHIPPING FORM */}
      <div style={{ flex: "1 1 500px", background: "var(--surface)", padding: "40px", borderRadius: "16px", border: "0.5px solid var(--border)" }}>
        <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "32px", paddingBottom: "16px", borderBottom: "0.5px solid var(--border)", fontSize: "28px", fontWeight: 400 }}>Shipping Details</h2>
        
        <form onSubmit={handlePlaceOrder} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "10px", fontSize: "11px", letterSpacing: "0.15em", color: "var(--text-secondary)", textTransform: "uppercase" }}>Street Address</label>
            <input type="text" required placeholder="123 Main St" value={shippingAddress.address} onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})} style={{ width: "100%", padding: "18px", border: "0.5px solid var(--border)", borderRadius: "14px", background: "var(--surface-2)", color: "var(--white)", outline: "none", fontSize: "15px", fontFamily: "var(--font-body)" }} />
          </div>

          <div style={{ display: "flex", gap: "24px" }}>
             <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "10px", fontSize: "11px", letterSpacing: "0.15em", color: "var(--text-secondary)", textTransform: "uppercase" }}>City</label>
                <input type="text" required placeholder="Mumbai" value={shippingAddress.city} onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})} style={{ width: "100%", padding: "18px", border: "0.5px solid var(--border)", borderRadius: "14px", background: "var(--surface-2)", color: "var(--white)", outline: "none", fontSize: "15px", fontFamily: "var(--font-body)" }} />
             </div>
             <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "10px", fontSize: "11px", letterSpacing: "0.15em", color: "var(--text-secondary)", textTransform: "uppercase" }}>Pincode</label>
                <input type="text" required placeholder="400001" value={shippingAddress.postalCode} onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})} style={{ width: "100%", padding: "18px", border: "0.5px solid var(--border)", borderRadius: "14px", background: "var(--surface-2)", color: "var(--white)", outline: "none", fontSize: "15px", fontFamily: "var(--font-body)" }} />
             </div>
          </div>

          <button type="submit" style={{ marginTop: "24px", padding: "20px", background: "linear-gradient(135deg, #E8395A, #c42d4a)", color: "var(--white)", border: "none", borderRadius: "16px", fontSize: "13px", letterSpacing: "0.2em", fontWeight: "500", cursor: "pointer", width: "100%", boxShadow: "0 8px 24px rgba(232,57,90,0.3)", fontFamily: "var(--font-body)" }}>
            PROCEED TO PAYMENT
          </button>
        </form>
      </div>

      {/* RIGHT PANE: ORDER SUMMARY */}
      <div style={{ flex: "1 1 400px", background: "var(--surface)", padding: "40px", borderRadius: "16px", border: "0.5px solid var(--border)" }}>
        <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "32px", paddingBottom: "16px", borderBottom: "0.5px solid var(--border)", fontSize: "28px", fontWeight: 400 }}>Order Summary</h2>
        
        <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "16px" }}>
          {cartItems.map((item) => {
             const product = item.product || {};
             return (
              <div key={item._id} style={{ display: "flex", alignItems: "center", marginBottom: "24px", paddingBottom: "24px", borderBottom: "0.5px solid var(--border)" }}>
                {product.image && <img src={product.image} alt={product.name} style={{ width: "70px", height: "90px", objectFit: "cover", borderRadius: "8px", marginRight: "20px" }} />}
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 400 }}>{product.name || 'Product'}</h5>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>Qty: {item.qty}</p>
                </div>
                <div style={{ fontWeight: "500", fontSize: "15px" }}>
                  ₹{item.priceAtPurchase * item.qty}
                </div>
              </div>
             );
          })}
        </div>

        <div style={{ marginTop: "8px", paddingTop: "24px", borderTop: "1px dashed var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Total Amount</h3>
          <h2 style={{ fontFamily: "var(--font-display)", margin: 0, color: "var(--white)", fontSize: "36px", fontWeight: 400 }}>₹{total}</h2>
        </div>
      </div>

      {showPayment && (
        <PaymentModal 
          amount={total} 
          onPay={processSecurePayment} 
          onClose={() => setShowPayment(false)} 
        />
      )}
    </div>
  );
}
