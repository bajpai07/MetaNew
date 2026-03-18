import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { getProducts } from "../api/productService";
import axios from "axios";
import useDebounce from "../hooks/useDebounce";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const debouncedQuery = useDebounce(query, 300);

  // Filters State
  const [category, setCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 10000]);

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
            brand: p.brand || "Roadster",
            discount: "33% OFF",
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
      <div className="hero-banner">
        <div className="hero-content">
          <p className="hero-subtitle">M E T A S H O P &nbsp; P R E S E N T S</p>
          <h1 className="hero-title">BIG FASHION FESTIVAL</h1>
          <h2 className="hero-discount">50-80% OFF</h2>
          <p className="hero-desc">On Top Brands & Latest Trends</p>
          <button className="shop-now-btn">EXPLORE NOW</button>
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
        {/* SIDEBAR */}
        <aside style={{ width: "250px", flexShrink: 0, paddingRight: "30px" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "20px", color: "#282c3f", borderBottom: "1px solid #eaeaec", paddingBottom: "10px" }}>FILTERS</h3>
          
          <div style={{ marginBottom: "30px" }}>
            <h4 style={{ fontSize: "14px", marginBottom: "15px", color: "#282c3f", textTransform: "uppercase" }}>Categories</h4>
            {["All", "Men", "Women", "Accessories"].map(cat => (
              <label key={cat} style={{ display: "flex", alignItems: "center", marginBottom: "12px", cursor: "pointer", color: "#535766", fontSize: "14px", fontWeight: category === cat ? "bold" : "normal" }}>
                <input 
                  type="radio" 
                  name="category" 
                  checked={category === cat}
                  onChange={() => setCategory(cat)}
                  style={{ marginRight: "10px", accentColor: "#FF3F6C", width: "16px", height: "16px" }}
                />
                {cat}
              </label>
            ))}
          </div>

          <div>
            <h4 style={{ fontSize: "14px", marginBottom: "15px", color: "#282c3f", textTransform: "uppercase" }}>Price Range</h4>
            <input 
              type="range" 
              min="0" 
              max="10000" 
              step="500"
              value={priceRange[1]} 
              onChange={handlePriceChange}
              style={{ width: "100%", accentColor: "#FF3F6C" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", color: "#535766", fontSize: "12px", fontWeight: "bold" }}>
              <span>₹0</span>
              <span>₹{priceRange[1]}</span>
            </div>
          </div>
        </aside>

        {/* MAIN PRODUCT GRID */}
        <div style={{ flex: 1, borderLeft: "1px solid #eaeaec", paddingLeft: "30px", minHeight: "600px" }}>
          <div className="section-title" style={{ textAlign: "left", marginBottom: "20px", marginTop: "5px" }}>
            <h2 style={{ fontSize: "20px", margin: 0 }}>{debouncedQuery ? `Search Results for "${debouncedQuery}"` : "DEAL OF THE DAY"}</h2>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "30px", padding: 0 }}>
            {loading ? (
              <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '50px', color: '#666' }}>
                <h2>{debouncedQuery ? 'Searching...' : 'Loading trending styles...'}</h2>
              </div>
            ) : products.length > 0 ? (
              products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))
            ) : (
              <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '80px 20px', background: '#FAFAFA', borderRadius: '12px', border: '1px dashed #EAEAEC' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '20px' }}>🔍</span>
                <h2 style={{ color: '#282C3F', marginBottom: '10px' }}>We couldn't find any matches!</h2>
                <p style={{ color: '#7E818C', marginBottom: '30px', fontSize: '16px' }}>Try adjusting your filters or search query.</p>
                <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                  <button onClick={() => navigate('/')} style={{ background: '#FF3F6C', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>CLEAR SEARCH</button>
                  <button onClick={() => { setCategory("All"); setPriceRange([0, 10000]); }} style={{ background: '#fff', color: '#FF3F6C', border: '1px solid #FF3F6C', padding: '12px 30px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>RESET FILTERS</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
