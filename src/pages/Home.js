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
          data = await getProducts({ category, minPrice: priceRange[0], maxPrice: priceRange[1] });
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
      <section className="relative w-full h-[100svh] min-h-[600px] bg-black overflow-hidden flex flex-col justify-end">
        <img 
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1080&q=80" 
          alt="Fashion Model" 
          className="absolute inset-0 w-full h-full object-cover animate-slow-zoom"
        />
        
        {/* TOP RIGHT BADGE (moved from left) */}
        <div className="absolute top-6 right-5 z-[20] flex items-center gap-2 bg-[#1a1a1a]/80 backdrop-blur-md border border-rose/50 text-[9px] font-bold text-rose px-3 py-1.5 uppercase tracking-widest shadow-lg">
          <div className="w-1.5 h-1.5 bg-rose rounded-full animate-pulse-soft shadow-[0_0_10px_rgba(232,57,90,1)]"></div>
          AI TRY-ON LIVE
        </div>

        {/* TOP LEFT FLOATING SCANNER WIDGET (moved from right, rotation removed) */}
        <div className="absolute top-[7%] md:top-[12%] left-4 md:left-[8%] z-[20] w-[115px] md:w-[160px] bg-[#1a1a1a]/95 backdrop-blur-xl rounded-[20px] border border-white/10 p-3 shadow-2xl">
          {/* Earpiece Slit */}
          <div className="flex justify-center mb-2">
            <div className="w-6 h-1 bg-white/20 rounded-full"></div>
          </div>
          <p className="text-[7px] md:text-[9px] text-center text-white/60 font-bold tracking-[0.15em] uppercase mb-2">METASHOP AI</p>
          
          {/* Screen Area */}
          <div className="w-full aspect-[4/5] bg-gradient-to-b from-black/80 to-rose/30 rounded-lg relative overflow-hidden mb-2 border border-white/5">
            <div className="absolute left-0 w-full h-[1.5px] bg-rose shadow-[0_0_15px_2px_rgba(232,57,90,0.9)] animate-scan"></div>
            <div className="absolute inset-0 bg-rose/5 animate-pulse"></div>
          </div>
          
          {/* Fake CTA */}
          <div className="w-full bg-gradient-to-r from-rose to-[#ff4d6d] text-white text-[7px] md:text-[9px] font-bold py-1.5 rounded tracking-widest uppercase text-center shadow-[0_4px_10px_rgba(232,57,90,0.3)]">
            TRY ON WITH AI
          </div>
          <p className="text-[6px] md:text-[7px] text-center mt-1.5 text-white/40 tracking-widest lowercase">upload → wear it</p>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent mix-blend-multiply z-[6]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 z-[6]"></div>
        
        <div className="relative z-10 px-4 py-8 md:px-8 w-full max-w-screen-xl mx-auto pb-12 mt-8">
          <h1 className="font-display italic font-semibold text-5xl md:text-7xl text-white leading-[1.05] tracking-wide mb-8 drop-shadow-2xl">
            Wear it<br/>before you<br/>buy it.
          </h1>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <button 
              onClick={() => document.getElementById('ai')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full bg-gradient-to-r from-rose to-[#ff4d6d] text-white h-14 rounded-2xl font-bold text-[13px] tracking-widest uppercase transition-transform active:scale-[0.96] shadow-[0_8px_30px_rgba(232,57,90,0.35)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/30 -translate-x-[150%] skew-x-12 group-hover:animate-shimmer-slide"></div>
              <span>✨ See this on you</span>
            </button>
            <button 
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white h-14 rounded-2xl font-bold text-[12px] tracking-widest uppercase transition-transform active:scale-[0.96]"
            >
              Browse collection
            </button>
          </div>
        </div>
      </section>

      {/* STRIP */}
      <div className="bg-black text-white py-3 overflow-hidden flex whitespace-nowrap">
        <div className="animate-[marquee_30s_linear_infinite] text-[11px] tracking-widest font-semibold uppercase flex w-max">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center">
              <span className="mx-4">New Arrivals</span><span className="text-white/30">✦</span>
              <span className="mx-4">AI Virtual Try-On</span><span className="text-white/30">✦</span>
              <span className="mx-4">Free Delivery ₹499+</span><span className="text-white/30">✦</span>
              <span className="mx-4">Easy 14 Day Returns</span><span className="text-white/30">✦</span>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto w-full">
        {/* FILTERS */}
        <div className="flex overflow-x-auto no-scrollbar gap-6 px-4 mt-6 mb-2 border-b border-white/10">
          {["All", "Men", "Women", "Kids", "Brands"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap text-sm font-bold pb-3 transition-colors min-h-[44px] ${category === cat ? 'text-white border-b-2 border-white' : 'text-white/80 hover:text-white'}`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* PRODUCT GRID */}
        <section id="products" className="py-12 px-4 md:px-8 max-w-screen-xl mx-auto w-full bg-[#0a0a0a]">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-semibold text-3xl md:text-4xl text-white tracking-wide">New Arrivals</h2>
            <p className="text-sm text-white/60 mt-2 font-bold uppercase tracking-widest">Handpicked for you</p>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="w-full aspect-[3/4] bg-white/5 rounded-[20px] animate-pulse"></div>
                <div className="h-4 bg-white/5 w-3/4 rounded animate-pulse"></div>
                <div className="h-4 bg-white/5 w-1/2 rounded animate-pulse"></div>
              </div>
            ))}
          </div>  ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
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
              The Fitting Room<br/>of the Future
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
