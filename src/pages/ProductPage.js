// src/pages/ProductPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/api";
import ModelViewer from "../components/ar/ModelViewer";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  useEffect(() => {
  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${id}`);
      console.log("PRODUCT DATA:", res.data);

      setProduct({
        ...res.data,
        modelUrl: "/models/lamp.glb", // temporary AR hookup
      });
    } catch (err) {
      console.error("PRODUCT FETCH ERROR:", err);
      alert("Failed to load product");
    }
  };

  fetchProduct();
}, [id]);


  if (!product) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{product.name}</h2>
      <p>₹{product.price}</p>

      {/* ✅ INLINE 3D VIEWER */}
      {product.modelUrl && (
        <>
          <h3>3D Preview</h3>
          <ModelViewer modelUrl={product.modelUrl} />
        </>
      )}

      {/* ✅ AR VIEW BUTTON */}
      {product.modelUrl && (
        <button
          style={{ marginTop: "10px" }}
          onClick={() =>
            navigate(
              `/ar/${product.modelUrl
                .split("/")
                .pop()
                .replace(".glb", "")}`
            )
          }
        >
          View in AR
        </button>
      )}
    </div>
  );
}
