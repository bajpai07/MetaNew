import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProductById, getProducts } from "../api/productService";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import TryOnExperience from "../components/vton/TryOnExperience";
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
            brand: found.brand || "",
            category: found.category || "top",
            originalPrice: found.originalPrice || Math.round(Number(found.price) * 1.5),
            image: found.image || found.imageUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"
          };
          setProduct(formattedProduct);

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

  if (loading) return <div className="p-24 text-center text-xs tracking-widest uppercase text-muted">Loading</div>;
  if (!product) return <div className="p-24 text-center text-xs tracking-widest uppercase text-muted">Product not found</div>;

  return (
    <div className="bg-[#0a0a0a] min-h-screen font-body pb-[90px] md:pb-10 pt-14 md:pt-16 text-white w-full overflow-x-hidden">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col md:flex-row gap-0 md:gap-12 md:p-8">
        
        {/* MOBILE BACK BUTTON (Floating over image layer) */}
        <button 
          onClick={() => navigate(-1)}
          className="md:hidden fixed z-[90] top-20 left-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg active:scale-95"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>

        {/* IMAGE GALLERY (Stacked on mobile, Sticky on Desktop) */}
        <div className="w-full md:w-1/2 flex flex-col gap-2 relative">
          <div className="w-full aspect-[3/4] md:rounded-[32px] overflow-hidden bg-[#111] relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            
            {/* IN-IMAGE BADGES */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 hidden md:flex">
              <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full shadow-sm w-max">NEW</span>
              <span className="bg-gradient-to-r from-rose to-[#ff4d6d] text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full shadow-[0_4px_10px_rgba(232,57,90,0.3)] flex items-center gap-1 w-max">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                AI TRY-ON
              </span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="w-full md:w-1/2 px-4 md:px-0 py-6 flex flex-col">
          
          <h1 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/50 mb-2">
            {product.brand || "Metashop"}
          </h1>
          <h2 className="font-display text-3xl md:text-5xl font-medium leading-tight mb-4">
            {product.name}
          </h2>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-2xl font-bold">₹{product.price}</span>
            <span className="text-base text-white/50 line-through">₹{product.originalPrice}</span>
            <span className="text-xs font-bold text-rose px-2 py-1 bg-rose/10 rounded-md">
              {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
            </span>
          </div>

          <div className="w-full h-px bg-white/10 my-6"></div>

          <p className="text-[15px] leading-relaxed text-white/70 mb-8 font-bold">
            {product.description || "Minimal. Editorial. Confident. Expertly tailored from premium materials, designed to slot seamlessly into your wardrobe."}
          </p>

          <p className="text-xs font-bold text-green-400 mb-8">
            {product.stock > 0 ? `● In Stock & Ready to Ship` : "○ Out of Stock"}
          </p>

          <div className="hidden md:flex flex-col gap-3 mb-8">
            {/* PRIMARY: SEE THIS ON YOU */}
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="w-full bg-gradient-to-r from-rose to-[#ff4d6d] text-white flex flex-col items-center justify-center h-16 rounded-2xl shadow-[0_8px_30px_rgba(232,57,90,0.25)] transition-transform active:scale-[0.96] overflow-hidden relative group"
            >
              <span className="font-semibold text-[15px] tracking-wide mt-1">✨ See this on you</span>
              <span className="text-[10px] font-medium opacity-80 tracking-widest uppercase mt-0.5">Upload your photo & preview instantly</span>
            </button>
            <div className="text-center text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1 mb-2">
              🔒 Your photo is private & auto-deleted
            </div>
            
            {/* SECONDARY: ADD TO BAG */}
            <button
              disabled={product.stock <= 0}
              onClick={() => toast.promise(addToCart(product._id), { loading: 'Adding...', success: 'Added', error: 'Failed' })}
              className="w-full bg-transparent border-2 border-white/20 text-white h-14 rounded-2xl font-bold text-[11px] tracking-widest uppercase transition-transform active:scale-95 hover:border-white disabled:border-white/10 disabled:text-white/20"
            >
              Add to bag
            </button>
          </div>

          <div className="w-full h-px bg-white/10 mb-6 md:my-6"></div>

          <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-4 min-w-max">
               <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest bg-white/5 px-4 py-2.5 rounded-xl border border-white/10">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                Premium Quality
               </div>
               <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest bg-white/5 px-4 py-2.5 rounded-xl border border-white/10">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                Secure Pay
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs text-white/50 font-medium">
            <div className="flex items-center gap-3"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg> Pay on delivery available</div>
            <div className="flex items-center gap-3"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg> Easy 14 days returns</div>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="w-full max-w-screen-xl mx-auto px-4 mt-12 md:mt-24 mb-6">
          <h3 className="text-xs font-bold tracking-widest uppercase text-center text-white/50 mb-8">You May Also Like</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p._id} product={{ ...p, price: p.currentPrice ?? p.basePrice ?? p.price }} />
            ))}
          </div>
        </div>
      )}

      {/* MOBILE STICKY BOTTOM CTA */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 px-4 pt-3 pb-[calc(16px+env(safe-area-bottom,16px))] z-[100] flex flex-col gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        {/* PRIMARY: SEE THIS ON YOU */}
        <div className="flex flex-col gap-1.5 w-full">
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="w-full bg-gradient-to-r from-rose to-[#ff4d6d] text-white flex flex-col items-center justify-center min-h-[60px] rounded-[18px] shadow-[0_8px_25px_rgba(232,57,90,0.3)] transition-transform active:scale-[0.96] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/30 -translate-x-[150%] skew-x-12 animate-[shimmer-slide_3s_infinite]"></div>
            <span className="font-semibold text-[15px] tracking-wide">✨ See this on you</span>
            <span className="text-[10px] font-medium opacity-80 tracking-widest uppercase">Upload your photo & preview instantly</span>
          </button>
          <div className="text-center text-[9px] text-white/60 font-bold uppercase tracking-widest mt-1">
            🔒 Your photo is private & auto-deleted
          </div>
        </div>

        {/* SECONDARY: ADD TO BAG */}
        <button
          disabled={product.stock <= 0}
          onClick={() => toast.promise(addToCart(product._id), { loading: 'Adding...', success: 'Added', error: 'Failed' })}
          className="w-full bg-transparent border-2 border-white text-white min-h-[50px] rounded-[16px] font-bold text-[11px] tracking-widest uppercase active:scale-[0.97] transition-transform disabled:border-white/20 disabled:text-white/20"
        >
          Add to Bag
        </button>
      </div>

      {product && (
        <TryOnExperience
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
