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

      const res = await axios.post("http://localhost:4000/api/orders", payload, config);
      
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
    <div style={{ display: "flex", gap: "40px", padding: "40px", maxWidth: "1200px", margin: "0 auto", alignItems: "flex-start", flexWrap: "wrap" }}>
      
      {/* LEFT PANE: SHIPPING FORM */}
      <div style={{ flex: "1 1 500px", background: "#fff", padding: "30px", borderRadius: "8px", border: "1px solid #eaeaec" }}>
        <h2 style={{ marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Shipping Details</h2>
        
        <form onSubmit={handlePlaceOrder} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#666" }}>Street Address</label>
            <input type="text" required placeholder="123 Main St" value={shippingAddress.address} onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})} style={{ width: "100%", padding: "12px", border: "1px solid #d4d5d9", borderRadius: "4px" }} />
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
             <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#666" }}>City</label>
                <input type="text" required placeholder="Mumbai" value={shippingAddress.city} onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})} style={{ width: "100%", padding: "12px", border: "1px solid #d4d5d9", borderRadius: "4px" }} />
             </div>
             <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#666" }}>Pincode</label>
                <input type="text" required placeholder="400001" value={shippingAddress.postalCode} onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})} style={{ width: "100%", padding: "12px", border: "1px solid #d4d5d9", borderRadius: "4px" }} />
             </div>
          </div>

          <button type="submit" style={{ marginTop: "20px", padding: "15px", background: "#FF3F6C", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", width: "100%" }}>
            PAY AND PLACE ORDER
          </button>
        </form>
      </div>

      {/* RIGHT PANE: ORDER SUMMARY */}
      <div style={{ flex: "1 1 400px", background: "#fafafa", padding: "30px", borderRadius: "8px", border: "1px solid #eaeaec" }}>
        <h2 style={{ marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Order Summary</h2>
        
        <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "10px" }}>
          {cartItems.map((item) => {
             const product = item.product || {};
             return (
              <div key={item._id} style={{ display: "flex", alignItems: "center", marginBottom: "15px", paddingBottom: "15px", borderBottom: "1px solid #eaeaea" }}>
                {product.image && <img src={product.image} alt={product.name} style={{ width: "60px", height: "80px", objectFit: "cover", borderRadius: "4px", marginRight: "15px" }} />}
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: "0 0 5px 0", fontSize: "14px" }}>{product.name || 'Product'}</h5>
                  <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Qty: {item.qty}</p>
                </div>
                <div style={{ fontWeight: "bold" }}>
                  ₹{item.priceAtPurchase * item.qty}
                </div>
              </div>
             );
          })}
        </div>

        <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "2px dashed #ccc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Total Amount:</h3>
          <h2 style={{ margin: 0, color: "#282c3f" }}>₹{total}</h2>
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
