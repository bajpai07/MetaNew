import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Cart() {
  const { cartItems, removeFromCart, updateQty } = useCart();
  const navigate = useNavigate();

  // If cartItems is undefined or loading hasn't finished, render a safe empty block instead of crashing.
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <div style={{ fontSize: "80px", marginBottom: "20px" }}>🛍️</div>
        <h2>Your bag is currently empty</h2>
        <p style={{ color: "#666", marginBottom: "30px" }}>Looks like you haven't added anything yet.</p>
        <button className="shop-now-btn" onClick={() => navigate("/")} style={{ padding: "15px 40px", fontSize: "16px", cursor: "pointer", background: "#FF3F6C", color: "white", border: "none", borderRadius: "4px" }}>
          🛒 SHOP NOW
        </button>
      </div>
    );
  }

  const total = cartItems.reduce((acc, item) => acc + (Number(item.priceAtPurchase) * Number(item.qty)), 0);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Shopping Cart</h2>

      {cartItems.map((item) => {
        const product = item.product;
        if (!product) return null; // Defensive check
        
        // Critical: Provide a fallback of 10 if the database didn't have a stock field on old entries
        const maxStock = product.stock !== undefined && product.stock !== null ? product.stock : 10;
        const currentQty = item.qty || 1;

        return (
          <div key={item._id} className="cart-item" style={{ display: 'flex', alignItems: 'center', marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
            {product.image ? (
              <img src={product.image} alt={product.name} style={{ width: "80px", height: "100px", objectFit: "cover", marginRight: "20px", borderRadius: "8px" }} />
            ) : (
               <div style={{ width: "80px", height: "100px", background: "#eee", marginRight: "20px", borderRadius: "8px" }}></div>
            )}
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 5px 0" }}>{product.name}</h4>
              <p className="price" style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>₹{item.priceAtPurchase}</p>
              
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "14px", color: "#666" }}>Qty:</span>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: "4px" }}>
                  <button 
                    onClick={() => {
                        if (currentQty > 1) {
                            toast.promise(updateQty(product._id, currentQty - 1), { loading: 'Updating...', success: 'Quantity decreased', error: 'Failed to update' });
                        }
                    }}
                    disabled={currentQty <= 1}
                    style={{ padding: "5px 12px", border: "none", background: currentQty <= 1 ? "#f5f5f5" : "#fff", cursor: currentQty <= 1 ? "not-allowed" : "pointer", fontSize: "16px" }}
                  >
                    -
                  </button>
                  <span style={{ padding: "5px 15px", borderLeft: "1px solid #ddd", borderRight: "1px solid #ddd" }}>{currentQty}</span>
                  <button 
                    onClick={() => {
                        if (currentQty < maxStock) {
                            toast.promise(updateQty(product._id, currentQty + 1), { loading: 'Updating...', success: 'Quantity increased', error: (err) => err.response?.data?.message || 'Failed to update' });
                        } else {
                            toast.error(`Only ${maxStock} items available in stock`);
                        }
                    }}
                    disabled={currentQty >= maxStock}
                    style={{ padding: "5px 12px", border: "none", background: currentQty >= maxStock ? "#f5f5f5" : "#fff", cursor: currentQty >= maxStock ? "not-allowed" : "pointer", fontSize: "16px" }}
                  >
                    +
                  </button>
                </div>
                {currentQty >= maxStock && <span style={{ fontSize: "12px", color: "#e74c3c" }}>Max stock reached</span>}
              </div>
            </div>

            <button className="remove-btn" onClick={async () => {
              try {
                  await toast.promise(
                    removeFromCart(product._id),
                    { loading: 'Removing...', success: 'Removed from bag', error: 'Failed to remove' }
                  );
              } catch (e) {}
            }} style={{ background: "transparent", color: "red", border: "none", cursor: "pointer", fontWeight: "bold", padding: "10px" }}>
              Remove
            </button>
          </div>
        );
      })}

      <div style={{ marginTop: "30px", padding: "20px", background: "#f9f9f9", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Total Amount:</h3>
        <h2 style={{ margin: 0, color: "#111" }}>₹{total}</h2>
      </div>

      <button
        style={{ width: "100%", marginTop: "20px", padding: "15px", background: "#FF3F6C", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}
        onClick={() => navigate("/checkout")}
      >
        PROCEED TO CHECKOUT
      </button>
    </div>
  );
}
