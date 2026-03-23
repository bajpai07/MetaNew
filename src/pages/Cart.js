import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Cart() {
  const { cartItems, removeFromCart, updateQty } = useCart();
  const navigate = useNavigate();

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return (
      <div className="cart-page" style={{ textAlign: "center", paddingTop: "128px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: "400", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>Your bag is empty</h2>
        <button 
          className="pdp-wishlist-btn" 
          onClick={() => navigate("/")} 
          style={{ width: "auto", padding: "12px 32px", marginTop: "24px" }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const total = cartItems.reduce((acc, item) => acc + (Number(item.priceAtPurchase) * Number(item.qty)), 0);

  return (
    <div className="cart-page">
      <h2 style={{ fontSize: "18px", fontWeight: "400", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "32px" }}>Shopping Bag</h2>

      <div>
      {cartItems.map((item) => {
        const product = item.product || item;
        const productName = product.name || item.name || 'Product';
        const productImage = product.image || item.image || null;
        const productPrice = item.priceAtPurchase || product.price || item.price || 0;
        if (!productName) return null;
        
        const maxStock = product.stock || 10;
        const currentQty = item.qty || 1;

        return (
          <div key={item._id} className="cart-item-row">
            {productImage ? (
              <img src={productImage} alt={productName} className="cart-item-img" />
            ) : (
               <div className="cart-item-img" style={{ background: "var(--color-bg-secondary)" }}></div>
            )}
            
            <div className="cart-item-details">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4 className="cart-item-name">{productName}</h4>
                  <p className="cart-item-price">₹{productPrice}</p>
                </div>
                <button 
                  onClick={async () => {
                    try {
                        await toast.promise(
                          removeFromCart(product._id),
                          { loading: 'Removing...', success: 'Removed', error: 'Failed' }
                        );
                    } catch (e) {}
                  }} 
                  style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}
                >
                  Remove
                </button>
              </div>
              
              <div style={{ marginTop: "auto" }}>
                <div className="qty-controls">
                  <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Qty</span>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button 
                      className="qty-btn"
                      onClick={() => currentQty > 1 && updateQty(product._id, currentQty - 1)}
                      disabled={currentQty <= 1}
                      style={{ opacity: currentQty <= 1 ? 0.3 : 1 }}
                    >
                      -
                    </button>
                    <span style={{ width: "32px", textAlign: "center", fontSize: "13px", color: "var(--color-text-primary)" }}>{currentQty}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => {
                          if (currentQty < maxStock) {
                              updateQty(product._id, currentQty + 1);
                          } else {
                              toast.error(`Only ${maxStock} available`);
                          }
                      }}
                      disabled={currentQty >= maxStock}
                      style={{ opacity: currentQty >= maxStock ? 0.3 : 1 }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </div>

      <div className="cart-total-section">
        <span style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</span>
        <span>₹{total}</span>
      </div>

      <button className="checkout-btn" onClick={() => navigate("/checkout")}>
        Process Order
      </button>
    </div>
  );
}
