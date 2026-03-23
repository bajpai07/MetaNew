import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    try {
      await toast.promise(
        addToCart(product._id),
        {
          loading: 'Adding...',
          success: 'Added',
          error: (err) => err.response?.data?.message || 'Failed to add',
        }
      );
    } catch (error) {
      console.log("Cart error:", error);
    }
  };

  return (
    <div className="product-card" onClick={() => navigate(`/products/${product._id}`)}>
      <div className="product-image-container">
        <img 
          src={product.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80"} 
          alt={product.name} 
          className="product-image" 
        />
        {product.modelUrl && (
             <div className="ar-badge">AR</div>
        )}
        
        <div className="product-actions" onClick={(e) => e.stopPropagation()}>
          <button 
            className="add-to-bag-bar" 
            onClick={handleAddToCart}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "44px",
              background: "rgba(255,255,255,0.95)",
              color: "#1A1A18",
              border: "none",
              fontSize: "11px",
              letterSpacing: "0.1em",
              cursor: "pointer",
              textTransform: "uppercase",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 500
            }}
          >
            ADD TO BAG
          </button>
        </div>
      </div>
      <div className="product-info">
        {product.brand && <h3 className="product-brand">{product.brand}</h3>}
        <p className="product-title">{product.name}</p>
        <div className="product-price-row">
          <span className="current-price">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="original-price">₹{product.originalPrice}</span>
              {product.discount && <span className="discount">-{(100 - (product.price / product.originalPrice) * 100).toFixed(0)}%</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
