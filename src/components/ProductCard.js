import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";

const ProductCard = ({ product, index }) => {
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.div
      custom={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.07, 
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onClick={() => navigate(`/products/${product._id}`)}
      style={{
        background: '#0a0a0a',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px'
      }}>

      {/* IMAGE CONTAINER */}
      <div style={{
        width: '100%',
        aspectRatio: '2/3',
        background: '#111111',
        position: 'relative',
        overflow: 'hidden'
      }}>

        {/* Skeleton shimmer while loading */}
        {!imgLoaded && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(
              90deg,
              #111111 25%,
              #1a1a1a 50%,
              #111111 75%
            )`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
          }} />
        )}

        {/* Product Image */}
        <motion.img
          src={product.image}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          whileHover={{ scale: 1.06 }}
          transition={{ 
            duration: 0.7,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
            display: 'block',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease'
          }}
        />

        {/* Dark gradient bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '80px',
          background: 'linear-gradient(to top, rgba(10,10,10,0.8), transparent)',
          pointerEvents: 'none'
        }} />

        {/* DISCOUNT BADGE — top left */}
        {product.discount > 0 && (
          <div style={{
            position: 'absolute',
            top: '10px', left: '10px',
            background: '#E8395A',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '10px',
            fontWeight: 600,
            color: '#fafaf8',
            letterSpacing: '0.05em',
            fontFamily: "'DM Sans', sans-serif"
          }}>
            -{product.discount}%
          </div>
        )}

        {/* WISHLIST — top right */}
        <motion.button
          whileTap={{ scale: 0.75 }}
          onClick={(e) => {
            e.stopPropagation();
            setWishlisted(!wishlisted);
          }}
          style={{
            position: 'absolute',
            top: '10px', right: '10px',
            width: '32px', height: '32px',
            borderRadius: '50%',
            background: 'rgba(10,10,10,0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: wishlisted 
              ? '0.5px solid rgba(232,57,90,0.5)'
              : '0.5px solid rgba(255,255,255,0.15)',
            color: wishlisted ? '#E8395A' : '#fafaf8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px'
          }}>
          <motion.span
            animate={{ 
              scale: wishlisted ? [1, 1.5, 1] : 1 
            }}
            transition={{ duration: 0.3 }}>
            {wishlisted ? '♥' : '♡'}
          </motion.span>
        </motion.button>

        {/* TRY ON overlay — bottom center */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          whileHover={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { e.stopPropagation(); navigate(`/products/${product._id}?ai=true`); }}
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10,10,10,0.7)',
            backdropFilter: 'blur(10px)',
            border: '0.5px solid rgba(255,255,255,0.15)',
            borderRadius: '20px',
            padding: '6px 14px',
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}>
          <span style={{
            fontSize: '9px',
            letterSpacing: '0.14em',
            color: '#fafaf8',
            fontFamily: "'DM Sans', sans-serif"
          }}>
            ✦ TRY ON
          </span>
        </motion.div>
      </div>

      {/* CARD INFO */}
      <div style={{ padding: '14px 6px 20px' }}>

        {/* Brand */}
        <p style={{
          fontSize: '9px',
          letterSpacing: '0.22em',
          color: 'rgba(250,250,248,0.35)',
          marginBottom: '6px',
          fontFamily: "'DM Sans', sans-serif",
          textTransform: 'uppercase'
        }}>
          {product.brand || 'METASHOP'}
        </p>

        {/* Product name */}
        <p style={{
          fontSize: '13px',
          color: '#fafaf8',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
          lineHeight: 1.45,
          marginBottom: '10px',
          letterSpacing: '0.01em',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {product.name}
        </p>

        {/* Price row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginTop: '6px'
        }}>
          {/* Current Price */}
          <span style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#fafaf8',
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '-0.02em'
          }}>
            ₹{product.price?.toLocaleString('en-IN') || product.price}
          </span>

          {/* MRP strikethrough */}
          {product.mrp && product.mrp > product.price && (
            <span style={{
              fontSize: '11px',
              color: 'rgba(250,250,248,0.28)',
              textDecoration: 'line-through',
              fontFamily: "'DM Sans', sans-serif"
            }}>
              ₹{product.mrp?.toLocaleString('en-IN') || product.mrp}
            </span>
          )}

          {/* Discount % */}
          {product.discount > 0 && (
            <span style={{
              fontSize: '10px',
              color: '#4ade80',
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif"
            }}>
              {product.discount}% off
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
