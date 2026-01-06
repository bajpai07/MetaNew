import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/api/products")
      .then((res) => res.json())
      .then((data) => {
        const updated = data.map((p) => ({
          ...p,
          // ✅ TEMP DEFAULT MODEL
          modelUrl: p.modelUrl || "/models/lamp.glb",
        }));

        setProducts(updated);
      });
  }, []);

  return (
    <>
      <div className="hero">
        <h1>Featured Products</h1>
        <p>Curated picks for you — clean UI & delightful interactions</p>
      </div>

      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </>
  );
}
