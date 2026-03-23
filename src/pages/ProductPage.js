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
            brand: found.brand || "",
            category: found.category || "top",
            originalPrice: found.originalPrice || Math.round(Number(found.price) * 1.5),
            discount: "SALE",
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

  if (loading) return <div style={{ padding: "100px", textAlign: "center", fontSize: "13px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>Loading</div>;
  if (!product) return <div style={{ padding: "100px", textAlign: "center", fontSize: "13px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>Product not found</div>;

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
            <span className="pdp-mrp">₹{product.originalPrice}</span>
            <span className="pdp-discount">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
            </span>
          </div>

          <div className="section-divider"></div>

          <p style={{ fontSize: "13px", color: "var(--color-text-primary)", lineHeight: "1.6", fontWeight: "300", marginBottom: "24px" }}>
            {product.description || "Minimal. Editorial. Confident. Expertly tailored from premium materials, designed to slot seamlessly into your wardrobe."}
          </p>

          <p className="pdp-stock">
            {product.stock > 0 ? `In Stock` : "Out of Stock"}
          </p>

          <div className="pdp-actions">
            <button
              className="pdp-add-btn"
              disabled={product.stock <= 0}
              onClick={async () => {
                try {
                  await toast.promise(
                    addToCart(product._id),
                    {
                      loading: 'Adding...',
                      success: 'Added',
                      error: (err) => err.response?.data?.message || 'Failed to add item',
                    }
                  );
                } catch (error) {
                  console.log("Cart error:", error);
                }
              }}>
              {product.stock > 0 ? "Add to bag" : "Sold out"}
            </button>
            <button className="pdp-wishlist-btn">
              Wishlist
            </button>
          </div>

          {product.modelUrl && (
            <div className="pdp-ar-section" style={{ background: "transparent", border: "none", padding: 0 }}>
              <button
                className="pdp-ar-btn"
                style={{ background: "transparent", border: "1px solid #1A1A18", color: "#1A1A18", borderRadius: 0 }}
                onClick={() => {
                  const modelName = product.modelUrl.split("/").pop().replace(".glb", "");
                  navigate(`/ar/${encodeURIComponent(modelName)}`, { state: { category: product.category, modelUrl: product.modelUrl } });
                }}
              >
                TRY IN AR
              </button>

              <button
                className="pdp-ai-btn"
                style={{ background: "#1A1A18", color: "white", borderRadius: 0, marginTop: "8px" }}
                onClick={() => setIsAIModalOpen(true)}
              >
                TRY ON WITH AI
              </button>
            </div>
          )}

          <div className="section-divider"></div>

          <div className="pdp-delivery-text">
            <p style={{ marginBottom: "8px" }}>Pay on delivery might be available</p>
            <p>Easy 14 days returns and exchanges</p>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div style={{ marginTop: "64px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "400", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "32px", textAlign: "center", color: "var(--color-text-primary)" }}>You May Also Like</h2>
          <div className="grid">
            {relatedProducts.map(p => (
              <ProductCard key={p._id} product={{
                ...p,
                image: p.image || p.imageUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80",
                price: p.currentPrice ?? p.basePrice ?? p.price
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
