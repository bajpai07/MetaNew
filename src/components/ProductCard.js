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
      className="flex flex-col overflow-hidden cursor-pointer group hover:-translate-y-1 active:scale-[0.98] transition-all duration-300"
      style={{ background: 'var(--black)', border: 'none' }}
      onClick={() => navigate(`/products/${product._id}`)}
    >
      <div 
        className="relative w-full group"
        style={{ aspectRatio: '3/4', overflow: 'hidden' }}
      >
        <img 
          loading="lazy"
          src={product.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80"} 
          alt={product.name} 
          className="w-full h-full object-cover transition-opacity duration-500 opacity-0"
          onLoad={(e) => e.target.classList.replace('opacity-0', 'opacity-100')}
        />
        {product.discount && (
          <div style={{ color: 'var(--rose)', fontSize: '11px', fontWeight: 500, position: 'absolute', top: '12px', left: '12px' }}>
            -{product.discount}
          </div>
        )}
        
        {/* Try-On Button Overlay */}
        <button 
          style={{
            background: 'rgba(10,10,10,0.75)',
            backdropFilter: 'blur(4px)',
            borderRadius: '20px',
            padding: '8px 14px',
            fontSize: '11px',
            color: 'var(--white)',
            letterSpacing: '0.1em',
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap'
          }}
          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all active:scale-[0.96]"
          onClick={(e) => { e.stopPropagation(); navigate(`/products/${product._id}?ai=true`); }}
        >
          Try this look
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1 pl-0 pr-0 mt-1">
        <h3 
          className="line-clamp-1 leading-tight mb-1" 
          style={{ color: 'var(--white)', fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: 400 }}
        >
          {product.name}
        </h3>
        <div className="flex flex-wrap items-baseline gap-2 mt-1">
          <span style={{ color: 'var(--white)', fontSize: '15px', fontWeight: 500 }}>₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'line-through' }}>₹{product.originalPrice}</span>
          )}
        </div>
      </div>
    </div>
  );
}
