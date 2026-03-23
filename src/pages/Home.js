import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { getProducts } from "../api/productService";
import axios from "axios";
import useDebounce from "../hooks/useDebounce";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const debouncedQuery = useDebounce(query, 300);

  // Filters State
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [priceRange, setPriceRange] = useState([0, 10000]);

  useEffect(() => {
    const urlCat = searchParams.get("category");
    if (urlCat && urlCat !== category) {
      setCategory(urlCat);
    } else if (!urlCat && category !== "All") {
      setCategory("All");
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let data;
        if (debouncedQuery.trim()) {
          const res = await axios.get(`http://localhost:4000/api/products/search?q=${encodeURIComponent(debouncedQuery)}`);
          data = res.data;
        } else {
          data = await getProducts({
            category,
            minPrice: priceRange[0],
            maxPrice: priceRange[1]
          });
        }

        const productArray = Array.isArray(data) ? data : (data.data || []);

        const updated = productArray.map((p) => {
          const baseP = Number(p.price || p.currentPrice || p.basePrice || 0);
          return {
            ...p,
            price: baseP,
            originalPrice: p.originalPrice || Math.round(baseP * 1.5),
            modelUrl: p.modelUrl || "/assets/models/dress.glb",
            brand: p.brand || "",
            discount: "",
            image: p.image || p.imageUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80"
          }
        });

        setProducts(updated);
      } catch (err) {
        console.log("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [debouncedQuery, category, priceRange]);

  const handlePriceChange = (e) => {
    setPriceRange([0, Number(e.target.value)]);
  };

  return (
    <div className="home-container">
      <div className="zara-hero-banner">
        <div className="zara-hero-overlay"></div>
        <div className="zara-hero-content">
          <h1 className="zara-hero-title">NEW COLLECTION</h1>
          <button className="zara-discover-btn" onClick={() => document.getElementById('product-section')?.scrollIntoView({ behavior: 'smooth' })}>DISCOVER</button>
        </div>
      </div>

      <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "64px 48px" }}>

        {/* TOP CATEGORY FILTER ROW */}
        <div style={{ display: "flex", justifySelf: "center", gap: "32px", marginBottom: "64px" }}>
          {["All", "Men", "Women", "Kids", "Beauty"].map(cat => (
            <span
              key={cat}
              onClick={() => {
                setCategory(cat);
                const newParams = new URLSearchParams(searchParams);
                if (cat === "All") newParams.delete("category");
                else newParams.set("category", cat);
                navigate(`/?${newParams.toString()}`);
              }}
              style={{
                cursor: "pointer",
                fontSize: "12px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: "none",
                color: "var(--color-text-primary)",
                textDecoration: category === cat ? "underline" : "none",
                textUnderlineOffset: "6px"
              }}
            >
              {cat.toUpperCase()}
            </span>
          ))}
        </div>

        {/* SECTION HEADING */}
        <h2 style={{
          fontSize: "13px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          fontWeight: 400,
          color: "#6B6B67",
          marginBottom: "32px"
        }}>
          NEW IN
        </h2>

        {/* MAIN PRODUCT GRID (4 columns, no sidebar) */}
        <div id="product-section" style={{ width: "100%", minHeight: "600px" }}>
          {debouncedQuery && (
            <h2 style={{ fontSize: "13px", fontWeight: "400", color: "var(--color-text-secondary)", marginBottom: "32px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Search Results for "{debouncedQuery}"
            </h2>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "24px"
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '100px 0', color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Loading...
              </div>
            ) : products.length > 0 ? (
              products.map((p) => (
                <ProductCard key={p._id} product={{ ...p, modelUrl: null, arSupported: false, hasAR: false }} />
              ))
            ) : (
              <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '100px 0' }}>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>No matches found</p>
                <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
                  <button onClick={() => navigate('/')} style={{ background: 'transparent', color: 'var(--color-text-primary)', padding: '12px 24px', border: '1px solid var(--color-text-primary)', borderRadius: '0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>Clear Search</button>
                  <button onClick={() => { setCategory("All"); setPriceRange([0, 10000]); }} style={{ background: 'transparent', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', padding: '12px 24px', borderRadius: '0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>Reset Filters</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
