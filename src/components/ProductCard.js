import { useNavigate } from "react-router-dom";
import useStore from "../store/useStore"; // ✅ correct path check karna

function ProductCard({ product }) {
  const navigate = useNavigate();

  // ✅ Zustand se addToCart lo
  const addToCart = useStore((state) => state.addToCart);

  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>₹{product.price}</p>

      {/* ✅ ADD TO CART */}
      <button onClick={() => addToCart(product)}>
        Add to Cart
      </button>

      {/* ✅ VIEW IN AR (only if model exists) */}
      {product.modelUrl && (
        <button
          style={{ marginTop: "8px" }}
          onClick={() => {
            const modelName = product.modelUrl
              .split("/")
              .pop()
              .replace(".glb", "");

            navigate(`/ar/${modelName}`);
          }}
        >
          View in AR
        </button>
      )}
    </div>
  );
}

export default ProductCard;
