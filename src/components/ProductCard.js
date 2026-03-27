import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useState } from "react";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: (i || 0) * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);

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
    <motion.div 
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/products/${product._id}`)}
      style={{
        background: 'var(--black)',
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      <div 
        style={{ aspectRatio: '3/4', overflow: 'hidden', position: 'relative', background: 'var(--surface)' }}
      >
        <motion.img 
          loading="lazy"
          src={product.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80"} 
          alt={product.name} 
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="transition-opacity duration-500 opacity-0"
          onLoad={(e) => e.target.classList.replace('opacity-0', 'opacity-100')}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
        />
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(10,10,10,0.5)', backdropFilter: 'blur(8px)',
            border: 'none', borderRadius: '50%', width: '34px', height: '34px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10
          }}>
          <motion.span
            animate={{ scale: isWishlisted ? [1, 1.4, 1] : 1, color: isWishlisted ? 'var(--rose)' : 'var(--white)' }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: '14px', color: 'var(--white)' }}>
            {isWishlisted ? '♥' : '♡'}
          </motion.span>
        </motion.button>

        {product.discount && (
          <div style={{
            position: 'absolute', top: '10px', left: '10px', background: 'var(--rose)', borderRadius: '4px',
            padding: '3px 8px', fontSize: '10px', color: 'var(--white)', fontWeight: 500, letterSpacing: '0.05em', zIndex: 10
          }}>
            -{product.discount}
          </div>
        )}
        
        {/* Try-On Button Overlay */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          whileHover={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(10,10,10,0.75)', backdropFilter: 'blur(12px)',
            border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: '20px',
            padding: '8px 16px', whiteSpace: 'nowrap', cursor: 'pointer', zIndex: 10
          }}
          onClick={(e) => { e.stopPropagation(); navigate(`/products/${product._id}?ai=true`); }}
        >
          <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--white)' }}>
            ✦ Try this look
          </span>
        </motion.div>
      </div>

      <div style={{ padding: '12px 4px 16px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-2)', marginBottom: '4px', textTransform: 'uppercase' }}>
          {product.brand || 'METASHOP'}
        </p>
        <p style={{
          fontSize: '13px', color: 'var(--white)', marginBottom: '8px', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {product.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--white)' }}>
            ₹{product.price}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span style={{ fontSize: '12px', color: 'var(--text-3)', textDecoration: 'line-through' }}>
              ₹{product.originalPrice}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
