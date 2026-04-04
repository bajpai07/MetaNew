import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const OutfitRecommendations = ({ 
  productId,
  onTryThis 
}) => {
  const [recommendations, setRecommendations] = 
    useState([]);
  const [loading, setLoading] = useState(true);
  const [basedOn, setBasedOn] = useState(null);

  useEffect(() => {
    if (!productId) return;
    fetchRecommendations();
  }, [productId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/products/recommendations/${productId}`
      );
      
      if (res.data.success) {
        setRecommendations(res.data.recommendations);
        setBasedOn(res.data.basedOn);
      }
    } catch (err) {
      console.error(
        "Failed to fetch recommendations:", 
        err.message
      );
      // Silent fail — don't show error to user
    } finally {
      setLoading(false);
    }
  };

  // Don't render if no recommendations
  if (!loading && recommendations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      style={{ margin: '24px 20px 0' }}>

      {/* Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div>
          <p style={{
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: '#E8395A',
            marginBottom: '4px',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500
          }}>
            ✦ YOU MIGHT ALSO LIKE
          </p>
          <h3 style={{
            fontFamily: 
              "'Cormorant Garamond', serif",
            fontSize: '20px',
            fontWeight: 400,
            color: '#fafaf8'
          }}>
            Try these outfits
          </h3>
        </div>
        {basedOn && (
          <p style={{
            fontSize: '10px',
            color: 'rgba(250,250,248,0.3)',
            letterSpacing: '0.06em',
            fontFamily: "'DM Sans', sans-serif"
          }}>
            {basedOn.category}
          </p>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 
            'repeat(3, 1fr)',
          gap: '8px'
        }}>
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div style={{
                aspectRatio: '2/3',
                borderRadius: '12px',
                background: '#111111',
                animation: 'pulse 1.5s infinite'
              }} />
              <div style={{
                height: '10px',
                background: '#111111',
                borderRadius: '4px',
                margin: '8px 0 4px',
                animation: 'pulse 1.5s infinite'
              }} />
              <div style={{
                height: '10px',
                width: '60%',
                background: '#111111',
                borderRadius: '4px',
                animation: 'pulse 1.5s infinite'
              }} />
            </div>
          ))}
        </div>
      )}

      {/* Recommendations Grid */}
      {!loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 
            'repeat(3, 1fr)',
          gap: '8px'
        }}>
          {recommendations.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: index * 0.1,
                duration: 0.4
              }}
              style={{ cursor: 'pointer' }}>

              {/* Product Image */}
              <div style={{
                aspectRatio: '2/3',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#111111',
                position: 'relative',
                marginBottom: '8px'
              }}>
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top center'
                  }}
                />

                {/* Try This overlay */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTryThis(item)}
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 
                      'rgba(10,10,10,0.8)',
                    backdropFilter: 'blur(8px)',
                    border: 
                      '0.5px solid rgba(255,255,255,0.2)',
                    borderRadius: '20px',
                    padding: '5px 10px',
                    fontSize: '8px',
                    letterSpacing: '0.1em',
                    color: '#fafaf8',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: 
                      "'DM Sans', sans-serif"
                  }}>
                  ✦ TRY THIS
                </motion.button>

                {/* Discount badge */}
                {item.discount && (
                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    background: '#E8395A',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '8px',
                    color: '#fafaf8',
                    fontWeight: 500,
                    fontFamily: 
                      "'DM Sans', sans-serif"
                  }}>
                    -{item.discount}%
                  </div>
                )}
              </div>

              {/* Product Info */}
              <p style={{
                fontSize: '11px',
                color: '#fafaf8',
                fontFamily: "'DM Sans', sans-serif",
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: '3px',
                lineHeight: 1.3
              }}>
                {item.name}
              </p>

              {/* Price */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#fafaf8',
                  fontFamily: "'DM Sans', sans-serif"
                }}>
                  ₹{item.price?.toLocaleString(
                    'en-IN'
                  )}
                </span>
                {item.mrp && (
                  <span style={{
                    fontSize: '9px',
                    color: 'rgba(250,250,248,0.3)',
                    textDecoration: 'line-through',
                    fontFamily: "'DM Sans', sans-serif"
                  }}>
                    ₹{item.mrp?.toLocaleString(
                      'en-IN'
                    )}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add shimmer CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </motion.div>
  );
};

export default OutfitRecommendations;
