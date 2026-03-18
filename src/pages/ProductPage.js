// src/pages/ProductPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProductById, getProducts } from "../api/productService";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import AITryOnModal from "../components/vton/AITryOnModal";
import toast from "react-hot-toast";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const found = await getProductById(id);
        
        if (found) {
          const formattedProduct = {
            ...found,
            modelUrl: found.model3dUrl || found.modelUrl || "/assets/models/dress.glb",
            brand: found.brand || "ROADSTER",
            category: found.category || "top", 
            originalPrice: found.originalPrice || Math.round(Number(found.price) * 1.5),
            discount: "SPECIAL OFFER",
            image: found.image || found.imageUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"
          };
          setProduct(formattedProduct);

          // Fetch related products
          const related = await getProducts({ category: formattedProduct.category });
          const filteredRelated = Array.isArray(related) ? related : (related.data || []);
          setRelatedProducts(filteredRelated.filter(p => p._id !== id).slice(0, 4));
        }
      } catch (err) {
        console.error("PRODUCT FETCH ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="loading-pdp">Loading Product...</div>;
  if (!product) return <div className="loading-pdp">Product not found.</div>;

  return (
    <div className="pdp-container">
      <div className="pdp-layout">
        <div className="pdp-gallery">
          <img
            src={product.image}
            alt={product.name}
            className="pdp-main-image"
          />
        </div>

        <div className="pdp-details">
          <h1 className="pdp-brand">{product.brand}</h1>
          <h2 className="pdp-title">{product.name}</h2>

          <div className="pdp-price-block">
            <span className="pdp-price">₹{product.price}</span>
            <span className="pdp-mrp">MRP ₹{product.originalPrice}</span>
            <span className="pdp-discount" style={{ color: '#FF3F6C', fontWeight: 'bold' }}>({product.discount})</span>
          </div>
          <p className="pdp-tax-info">inclusive of all taxes</p>

          <p style={{ margin: "20px 0", color: "#535766", lineHeight: "1.6" }}>
            {product.description || "A premium, comfortable item tailored for style and everyday wear. Features high-quality material designed exclusively for modern fashion aesthetics."}
          </p>

          <div style={{ margin: "20px 0", padding: "10px", background: "#f9f9f9", borderRadius: "4px", border: "1px solid #eaeaec", display: "inline-block" }}>
            <span style={{ fontWeight: "bold", marginRight: "10px", color: "#282c3f" }}>Stock Status:</span>
            {product.stock > 0 ? (
               <span style={{ color: "#03A685", fontWeight: "bold" }}>In Stock ({product.stock} available)</span>
            ) : (
               <span style={{ color: "#FF3F6C", fontWeight: "bold" }}>Out of Stock</span>
            )}
          </div>

          <div className="pdp-actions">
            <button 
              className="pdp-add-btn" 
              disabled={product.stock <= 0}
              style={{ background: product.stock <= 0 ? "#eaeaec" : "#FF3F6C", cursor: product.stock <= 0 ? "not-allowed" : "pointer" }}
              onClick={async () => {
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
            }}>
              <span className="icon">👜</span> {product.stock > 0 ? "ADD TO BAG" : "SOLD OUT"}
            </button>
            <button className="pdp-wishlist-btn">
              <span className="icon">🤍</span> WISHLIST
            </button>
          </div>

          {product.modelUrl && (
            <div className="pdp-ar-section" style={{ background: "linear-gradient(135deg, #1f1f1f 0%, #303030 100%)", color: "white", padding: "20px", borderRadius: "8px", marginTop: "30px" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#20B2AA" }}>✨ VIRTUAL TRY-ON</h3>
              <p style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#d0d0d0" }}>Experience this item in 3D right now using Augmented Reality.</p>
              
              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                <button
                  className="pdp-ar-btn"
                  style={{ 
                    background: "#20B2AA", 
                    color: "white", 
                    border: "none", 
                    padding: "12px 20px", 
                    borderRadius: "4px", 
                    fontWeight: "bold", 
                    cursor: "pointer", 
                    flex: 1,
                    fontSize: "13px"
                  }}
                  onClick={() => {
                    const modelName = product.modelUrl.split("/").pop().replace(".glb", "");
                    navigate(`/ar/${encodeURIComponent(modelName)}`, { state: { category: product.category, modelUrl: product.modelUrl } });
                  }}
                >
                  <span className="icon">📷</span> AR TRY-ON
                </button>
                
                <button
                  className="pdp-ai-btn"
                  style={{ 
                    background: "linear-gradient(45deg, #FF3F6C, #FF7B54)", 
                    color: "white", 
                    border: "none", 
                    padding: "12px 20px",
                    marginTop: "10px", 
                    borderRadius: "4px", 
                    fontWeight: "bold", 
                    cursor: "pointer", 
                    width: "100%",
                    fontSize: "14px",
                    boxShadow: "0 4px 15px rgba(255,63,108,0.3)"
                  }}
                  onClick={() => setIsAIModalOpen(true)}
                >
                  <span className="icon">✨</span> TRY ON WITH AI (HD)
                </button>
              </div>
              
              <div style={{ fontSize: "12px", color: "#999", textAlign: "center" }}>
                💡 Photorealistic AI generation preserving garment pattern and details.
              </div>
            </div>
          )}

          <div className="pdp-delivery">
            <h3>DELIVERY OPTIONS</h3>
            <div className="pincode-box">
              <input type="text" placeholder="Enter pincode" />
              <button>Check</button>
            </div>
            <ul className="delivery-features">
              <li>100% Original Products</li>
              <li>Pay on delivery might be available</li>
              <li>Easy 14 days returns and exchanges</li>
            </ul>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div style={{ padding: "50px 20px", maxWidth: "1400px", margin: "0 auto", borderTop: "1px solid #eaeaec", marginTop: "60px" }}>
          <h2 style={{ fontSize: "24px", color: "#282c3f", marginBottom: "30px", textAlign: "center", textTransform: "uppercase", letterSpacing: "1px" }}>Similar Products</h2>
          <div className="grid">
            {relatedProducts.map(p => (
               <ProductCard key={p._id} product={{
                 ...p,
                 image: p.image || p.imageUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80",
                 price: p.currentPrice ?? p.basePrice ?? p.price,
                 discount: "SPECIAL"
               }} />
            ))}
          </div>
        </div>
      )}

      {/* Render the AI Try-On Modal */}
      {product && (
        <AITryOnModal 
          isOpen={isAIModalOpen} 
          onClose={() => setIsAIModalOpen(false)} 
          garmentImage={product.image} 
          garmentDescription={`${product.brand} ${product.name} ${product.category}`}
          garmentCategory={product.category}
          garmentName={product.name}
        />
      )}
    </div>
  );
}
