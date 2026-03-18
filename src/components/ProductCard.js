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
          loading: 'Adding to bag...',
          success: 'Added to your bag! 👜',
          error: (err) => err.response?.data?.message || 'Failed to add item',
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
             <div className="ar-badge">3D / AR</div>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-brand">{product.brand || "ROADSTER"}</h3>
        <p className="product-title">{product.name}</p>
        <div className="product-price-row">
          <span className="current-price">₹{product.price}</span>
          <span className="original-price">₹{product.originalPrice || Math.round(product.price * 1.5)}</span>
          <span className="discount">{product.discount || "33% OFF"}</span>
        </div>
      </div>
      
      <div className="product-actions" onClick={(e) => e.stopPropagation()}>
        <button className="add-cart-btn" onClick={handleAddToCart} style={{ marginBottom: "5px" }}>
          ADD TO BAG
        </button>
        {product.modelUrl && (
          <button 
            className="add-cart-btn" 
            style={{ borderColor: "var(--brand)", color: "var(--brand)" }}
            onClick={(e) => {
              e.stopPropagation();
              const encodedUrl = encodeURIComponent(product.modelUrl);
              navigate(`/ar/${encodedUrl}`, { state: { category: product.category, modelUrl: product.modelUrl } });
            }}
          >
            ✦ TRY IN AR
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
