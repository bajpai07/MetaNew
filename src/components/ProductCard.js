import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    try {
      await toast.promise(
        addToCart(product._id),
        { loading: 'Adding...', success: 'Added', error: (err) => err.response?.data?.message || 'Failed to add' }
      );
    } catch (error) { console.log(error); }
  };

  return (
    <div 
      className="bg-[#111] flex flex-col rounded-[20px] overflow-hidden cursor-pointer group hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] border border-white/5"
      onClick={() => navigate(`/products/${product._id}`)}
    >
      <div className="relative w-full aspect-[3/4] bg-[#222] overflow-hidden group">
        <img 
          loading="lazy"
          src={product.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80"} 
          alt={product.name} 
          className="w-full h-full object-cover transition-opacity duration-500 opacity-0"
          onLoad={(e) => e.target.classList.replace('opacity-0', 'opacity-100')}
        />
        {product.discount && (
          <div className="absolute top-2 left-2 bg-rose text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            -{product.discount}
          </div>
        )}
        
        {/* Try-On Button Overlay */}
        <button 
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] bg-black/40 backdrop-blur-xl border border-white/20 text-white text-xs font-bold py-3 rounded-2xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-[0.96]"
          onClick={(e) => { e.stopPropagation(); navigate(`/products/${product._id}?ai=true`); }}
        >
          ✨ Try this look
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="text-sm font-bold text-white line-clamp-1 leading-tight tracking-wide">{product.name}</h3>
        </div>
        <p className="text-[11px] text-white/50 uppercase tracking-widest font-bold mb-3">{product.category}</p>
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-sm font-bold text-white">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-white/50 line-through">₹{product.originalPrice}</span>
          )}
        </div>
      </div>
    </div>
  );
}
