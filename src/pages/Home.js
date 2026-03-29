import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { getProducts } from "../api/productService";
import axios from "axios";
import useDebounce from "../hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
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
          const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/products/search?q=${encodeURIComponent(debouncedQuery)}`);
          data = res.data;
        } else {
          data = await getProducts({
            category: category === "All" ? "" : category,
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

  return (
    <div className="bg-[#0a0a0a] pb-6 font-body overflow-x-hidden text-white w-full min-h-screen">
      {/* HERO SECTION */}
      <div style={{
        height: '100svh', width: '100%', position: 'relative', overflow: 'hidden', background: 'var(--black)'
      }}>
        {/* Background image */}
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1080&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top'
          }}
        />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.3) 50%, rgba(10,10,10,0.1) 100%)'
        }} />

        {/* AI badge — top left */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{
            position: 'absolute', top: '72px', left: '20px',
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(232,57,90,0.8)',
            borderRadius: '20px',
            padding: '6px 14px'
          }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--rose)' }}
          />
          <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#ff4d6d', fontWeight: 700 }}>
            AI TRY-ON LIVE
          </span>
        </motion.div>

        {/* Text content — bottom */}
        <div style={{ position: 'absolute', bottom: '100px', left: '20px', right: '20px', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
            style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#fafaf8', marginBottom: '12px', fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            NEW SEASON DROP
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
            style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(44px, 12vw, 64px)', fontWeight: 500,
              color: 'var(--white)', lineHeight: 1.05, marginBottom: '28px', textShadow: '0 4px 24px rgba(0,0,0,0.9)'
            }}>
            Wear it<br />before you<br /><em style={{ color: '#ff4d6d', fontStyle: 'italic', fontWeight: 600 }}>buy it.</em>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }}
            style={{ display: 'flex', gap: '10px' }}>
            <motion.button
              onClick={() => document.getElementById('ai')?.scrollIntoView({ behavior: 'smooth' })}
              whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}
              style={{
                flex: 1, background: 'linear-gradient(135deg, #E8395A, #c42d4a)', color: 'var(--white)', border: 'none', borderRadius: '14px',
                padding: '16px', fontSize: '12px', letterSpacing: '0.18em', fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(232,57,90,0.4)', textShadow: 'none'
              }}>
              ✦ SEE THIS ON YOU
            </motion.button>
            <motion.button
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              whileTap={{ scale: 0.96 }}
              style={{
                padding: '16px 20px', background: 'rgba(250,250,248,0.08)', backdropFilter: 'blur(12px)',
                color: 'var(--white)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '14px', fontSize: '11px',
                letterSpacing: '0.18em', fontFamily: 'var(--font-body)', cursor: 'pointer'
              }}>
              DISCOVER
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* STRIP */}
      <div style={{ overflow: 'hidden', background: 'var(--surface)', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)', padding: '10px 0' }}>
        <div className="marquee-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: 'flex' }}>
              {['New Arrivals', 'AI Virtual Try-On', 'Free Delivery ₹499+', 'Easy 14 Day Returns', 'Pay on Delivery', 'First in India'].map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '0.18em', color: 'var(--text-2)', padding: '0 20px', whiteSpace: 'nowrap', textTransform: 'uppercase', fontWeight: 600 }}>{item}</span>
                  <span style={{ color: 'var(--rose)' }}>✦</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto w-full">
        {/* FILTERS */}
        <div style={{
          display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          padding: '0 16px', gap: '4px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', position: 'sticky',
          top: '56px', background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', zIndex: 90
        }}>
          {["All", "Men", "Women", "Kids"].map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setCategory(cat)}
              whileTap={{ scale: 0.96 }}
              style={{
                padding: '14px 18px', background: 'none', border: 'none',
                borderBottom: category === cat ? '2.5px solid #E8395A' : '2.5px solid transparent',
                color: category === cat ? '#fafaf8' : 'rgba(255,255,255,0.8)',
                fontSize: '11px', letterSpacing: '0.14em', fontFamily: 'var(--font-body)',
                fontWeight: category === cat ? 600 : 500, cursor: 'pointer', whiteSpace: 'nowrap',
                flexShrink: 0, transition: 'color 0.2s, border-color 0.2s'
              }}
            >
              {cat.toUpperCase()}
            </motion.button>
          ))}
        </div>

        {/* PRODUCT GRID */}
        <section id="products" className="py-12 px-4 md:px-8 max-w-screen-xl mx-auto w-full bg-[#0a0a0a]">
          <div style={{ 
            padding: '28px 20px 20px',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)'
          }}>
            <p style={{
              fontSize: '10px',
              letterSpacing: '0.25em',
              color: '#E8395A',
              marginBottom: '8px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500
            }}>
              ✦ HANDPICKED FOR YOU
            </p>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '32px',
              fontWeight: 300,
              color: '#fafaf8',
              lineHeight: 1.1,
              letterSpacing: '-0.01em'
            }}>
              New Arrivals
            </h2>
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ background: 'var(--black)', padding: '0 0 16px' }}>
                  <div className="skeleton" style={{ aspectRatio: '3/4', width: '100%' }} />
                  <div style={{ padding: '12px 4px 0' }}>
                    <div className="skeleton" style={{ height: '10px', width: '60%', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ height: '13px', width: '85%', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>) : products.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', background: '#0a0a0a' }}>
                {products.map((p, i) => (
                  <React.Fragment key={p._id}>
                    <div style={{ borderRight: i % 2 === 0 ? '0.5px solid rgba(255,255,255,0.06)' : 'none', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                      <ProductCard product={p} index={i} />
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ) : null}
          {/* NO RESULTS */}
          {!loading && products.length === 0 && (
            <div className="text-center py-20">
              <h3 className="text-xl font-bold text-white/50">No products found</h3>
            </div>
          )}
        </section>

        {/* AI SECTION */}
        <section id="ai" className="m-3 mt-8 bg-[#0a0a0a] rounded-[24px] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col items-start md:items-center md:text-center">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-4 h-[1px] bg-rose"></span>
              <span className="text-[9px] tracking-widest text-rose uppercase font-bold">India First</span>
            </div>
            <h2 className="font-display italic font-semibold text-4xl md:text-5xl mb-4 text-white leading-tight">
              The Fitting Room<br />of the Future
            </h2>
            <p className="text-white/60 text-sm md:text-base max-w-md mb-8 leading-relaxed font-body">
              Upload your exact photo. See perfectly how any outfit looks on your body — before you spend a single rupee.
            </p>
            <button
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-rose text-white h-12 w-full md:w-auto md:px-10 flex items-center justify-center font-bold text-xs tracking-widest uppercase rounded-xl transition-transform active:scale-95"
            >
              Try It Now
            </button>
          </div>
          {/* Subtle Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose/10 rounded-full blur-[80px] pointer-events-none"></div>
        </section>
      </main>
    </div>
  );
}
