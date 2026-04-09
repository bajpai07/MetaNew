import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProductById, getProducts } from "../api/productService";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import TryOnExperience from "../components/vton/TryOnExperience";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import SizeRecommendation from "../components/SizeRecommendation";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const { addToCart } = useCart();

  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeRec, setSizeRec] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [addedToBag, setAddedToBag] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      window.scrollTo(0, 0); 
      try {
        const found = await getProductById(id);

        if (found) {
          const originalPrice = found.originalPrice || Math.round(Number(found.price) * 1.5);
          const formattedProduct = {
            ...found,
            brand: found.brand || "METASHOP",
            category: found.category || "top",
            originalPrice: originalPrice,
            image: found.image || found.imageUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
            mrp: originalPrice,
            discount: Math.round((1 - found.price / originalPrice) * 100),
            images: found.images || [found.image || found.imageUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"]
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

  const handleAddToBag = () => {
    toast.promise(addToCart(product._id), { loading: 'Adding...', success: 'Added', error: 'Failed' });
  };

  if (loading) return <div className="p-24 text-center text-xs tracking-widest uppercase text-muted" style={{ background: '#0a0a0a', color: '#fafaf8', minHeight: '100vh' }}>Loading...</div>;
  if (!product) return <div className="p-24 text-center text-xs tracking-widest uppercase text-muted" style={{ background: '#0a0a0a', color: '#fafaf8', minHeight: '100vh' }}>Product not found</div>;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          minHeight: '100vh',
          background: '#0a0a0a',
          color: '#fafaf8',
          fontFamily: "'DM Sans', sans-serif",
          paddingBottom: '140px',
          width: '100%',
          overflowX: 'hidden'
        }}>

        {/* ── IMAGE SECTION ── */}
        <div style={{
          width: '100%',
          aspectRatio: '3/4',
          background: '#111111',
          position: 'relative',
          overflow: 'hidden',
          marginTop: '56px'
        }}>
          <motion.img
            key={currentImage}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            src={product.images?.[currentImage] || product.image}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top center',
              display: 'block'
            }}
          />

          {/* Gradient overlay bottom */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '120px',
            background: 'linear-gradient(to top, #0a0a0a, transparent)'
          }} />

          {/* Back button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => navigate(-1)}
            style={{
              position: 'absolute',
              top: '12px', left: '16px',
              width: '40px', height: '40px',
              borderRadius: '50%',
              background: 'rgba(10,10,10,0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '0.5px solid rgba(255,255,255,0.12)',
              color: '#fafaf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
            ←
          </motion.button>

          {/* Wishlist button */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setIsWishlisted(!isWishlisted)}
            style={{
              position: 'absolute',
              top: '12px', right: '16px',
              width: '40px', height: '40px',
              borderRadius: '50%',
              background: 'rgba(10,10,10,0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '0.5px solid rgba(255,255,255,0.12)',
              color: isWishlisted ? '#E8395A' : '#fafaf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
            <motion.span
              animate={{ scale: isWishlisted ? [1,1.4,1] : 1 }}
              transition={{ duration: 0.3 }}>
              {isWishlisted ? '♥' : '♡'}
            </motion.span>
          </motion.button>

          {/* Discount badge */}
          {product.discount > 0 && (
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#E8395A',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '11px',
              color: '#fafaf8',
              fontWeight: 500,
              letterSpacing: '0.08em'
            }}>
              {product.discount}% OFF
            </div>
          )}

          {/* Image dots */}
          {product.images?.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '6px',
              zIndex: 2
            }}>
              {product.images.map((_, i) => (
                <motion.div
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  animate={{
                    width: i === currentImage ? '20px' : '6px',
                    background: i === currentImage
                      ? '#E8395A'
                      : 'rgba(255,255,255,0.3)'
                  }}
                  style={{
                    height: '6px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── PRODUCT INFO ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ padding: '24px 24px 160px' }}>

          {/* Brand */}
          <p style={{
            fontSize: '10px',
            letterSpacing: '0.24em',
            color: 'rgba(250,250,248,0.4)',
            marginBottom: '8px',
            textTransform: 'uppercase'
          }}>
            {product.brand || "METASHOP EXCLUSIVE"}
          </p>

          {/* Product name */}
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(24px, 6vw, 30px)',
            fontWeight: 400,
            color: '#fafaf8',
            lineHeight: 1.25,
            marginBottom: '18px',
            letterSpacing: '-0.01em'
          }}>
            {product.name}
          </h1>

          {/* Price row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '18px'
          }}>
            <span style={{
              fontSize: '26px',
              fontWeight: 500,
              color: '#fafaf8',
              letterSpacing: '-0.03em'
            }}>
              ₹{product.price}
            </span>
            {product.mrp && (
              <span style={{
                fontSize: '16px',
                color: 'rgba(250,250,248,0.3)',
                textDecoration: 'line-through'
              }}>
                ₹{product.mrp}
              </span>
            )}
            {product.discount > 0 && (
              <span style={{
                background: 'rgba(232,57,90,0.12)',
                color: '#E8395A',
                border: '0.5px solid rgba(232,57,90,0.3)',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 500
              }}>
                {product.discount}% OFF
              </span>
            )}
          </div>

          {/* In Stock indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: '7px', height: '7px',
                borderRadius: '50%',
                background: '#4ade80'
              }}
            />
            <span style={{
              fontSize: '12px',
              color: '#4ade80',
              letterSpacing: '0.12em'
            }}>
              IN STOCK
            </span>
          </div>

          {/* Divider */}
          <div style={{
            height: '0.5px',
            background: 'rgba(255,255,255,0.07)',
            margin: '20px 0'
          }} />

          {/* ── SIZE SELECTOR ── */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <p style={{
                fontSize: '11px',
                letterSpacing: '0.2em',
                color: 'rgba(250,250,248,0.55)',
                textTransform: 'uppercase'
              }}>
                Select Size
              </p>
              {sizeRec && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(74,222,128,0.1)',
                    border: '0.5px solid rgba(74,222,128,0.3)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    marginBottom: '12px'
                  }}>
                  <span style={{
                    fontSize: '10px',
                    color: '#4ade80',
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: '0.08em',
                    fontWeight: 500
                  }}>
                    ✓ AI recommends size{' '}
                    <strong>{sizeRec.size}</strong>
                    {' '}({sizeRec.confidence}% match)
                  </span>
                </motion.div>
              )}
              <span style={{
                fontSize: '11px',
                color: '#E8395A',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '3px'
              }}>
                Size Guide
              </span>
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              {sizes.map(size => (
                <motion.button
                  key={size}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelectedSize(size)}
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '14px',
                    background: selectedSize === size
                      ? '#E8395A'
                      : sizeRec?.size === size
                      ? 'rgba(74,222,128,0.1)'
                      : 'rgba(255,255,255,0.04)',
                    border: selectedSize === size
                      ? '0.5px solid #E8395A'
                      : sizeRec?.size === size
                      ? '0.5px solid rgba(74,222,128,0.4)'
                      : '0.5px solid rgba(255,255,255,0.12)',
                    color: selectedSize === size
                      ? '#fafaf8'
                      : sizeRec?.size === size
                      ? '#4ade80'
                      : 'rgba(250,250,248,0.7)',
                    fontSize: '13px',
                    letterSpacing: '0.05em',
                    fontWeight: selectedSize === size ? 500 : 400,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                  {size}
                </motion.button>
              ))}
            </div>

            {/* Size warning */}
            <AnimatePresence>
              {!selectedSize && addedToBag && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontSize: '11px',
                    color: '#E8395A',
                    marginTop: '10px',
                    letterSpacing: '0.05em'
                  }}>
                  Please select a size
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div style={{
            height: '0.5px',
            background: 'rgba(255,255,255,0.07)',
            margin: '20px 0'
          }} />

          <SizeRecommendation
            onRecommendation={(rec) => {
              setSizeRec(rec);
            }}
          />

          {/* ── PRODUCT TABS ── */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              gap: '0',
              borderBottom: '0.5px solid rgba(255,255,255,0.07)',
              marginBottom: '20px'
            }}>
              {['details', 'delivery', 'returns'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '14px 24px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab
                      ? '2px solid #E8395A'
                      : '2px solid transparent',
                    color: activeTab === tab
                      ? '#fafaf8'
                      : 'rgba(250,250,248,0.4)',
                    fontSize: '11px',
                    letterSpacing: '0.14em',
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s'
                  }}>
                  {tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ paddingTop: '20px' }}>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(250,250,248,0.6)',
                    lineHeight: 1.85,
                    marginBottom: '20px',
                    letterSpacing: '0.02em'
                  }}>
                    {product.description || "Minimal. Editorial. Confident. Expertly tailored from premium materials, designed to slot seamlessly into your wardrobe."}
                  </p>
                  {/* Product specs */}
                  {[
                    { label: 'Material', value: product.material || 'Premium Cotton' },
                    { label: 'Fit', value: product.fit || 'Regular Fit' },
                    { label: 'Care', value: 'Machine wash cold' },
                    { label: 'Origin', value: 'Made in India' }
                  ].map(spec => (
                    <div key={spec.label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '13px 0',
                      borderBottom:
                        '0.5px solid rgba(255,255,255,0.05)',
                      fontSize: '13px'
                    }}>
                      <span style={{
                        color: 'rgba(250,250,248,0.4)',
                        letterSpacing: '0.04em'
                      }}>
                        {spec.label}
                      </span>
                      <span style={{
                        color: 'rgba(250,250,248,0.7)',
                        letterSpacing: '0.02em'
                      }}>
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'delivery' && (
                <motion.div
                  key="delivery"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ paddingTop: '20px' }}>
                  {[
                    { icon: '🚚', title: 'Standard Delivery',
                      sub: '3-5 business days • FREE above ₹499' },
                    { icon: '⚡', title: 'Express Delivery',
                      sub: '1-2 business days • ₹99' },
                    { icon: '📦', title: 'Pay on Delivery',
                      sub: 'Available on all orders' }
                  ].map(item => (
                    <div key={item.title} style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '14px 0',
                      borderBottom:
                        '0.5px solid rgba(255,255,255,0.05)'
                    }}>
                      <span style={{ fontSize: '20px' }}>
                        {item.icon}
                      </span>
                      <div>
                        <p style={{
                          fontSize: '13px',
                          color: '#fafaf8',
                          marginBottom: '3px'
                        }}>
                          {item.title}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: 'rgba(250,250,248,0.45)'
                        }}>
                          {item.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'returns' && (
                <motion.div
                  key="returns"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ paddingTop: '20px' }}>
                  {[
                    { icon: '↩', title: '14 Day Returns',
                      sub: 'Easy no-questions-asked returns' },
                    { icon: '✓', title: 'Quality Check',
                      sub: 'Every item inspected before shipping' },
                    { icon: '💳', title: 'Instant Refund',
                      sub: 'Refund processed within 24 hours' }
                  ].map(item => (
                    <div key={item.title} style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '14px 0',
                      borderBottom:
                        '0.5px solid rgba(255,255,255,0.05)'
                    }}>
                      <span style={{
                        fontSize: '20px',
                        color: '#4ade80'
                      }}>
                        {item.icon}
                      </span>
                      <div>
                        <p style={{
                          fontSize: '13px',
                          color: '#fafaf8',
                          marginBottom: '3px'
                        }}>
                          {item.title}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: 'rgba(250,250,248,0.45)'
                        }}>
                          {item.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── FIXED BOTTOM BUTTONS ── */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{
            delay: 0.3,
            type: 'spring',
            stiffness: 300,
            damping: 30
          }}
          style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            padding: '16px 24px',
            paddingBottom:
              'calc(16px + env(safe-area-inset-bottom))',
            background: 'rgba(10,10,10,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop:
              '0.5px solid rgba(255,255,255,0.07)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>

          {/* SEE THIS ON YOU */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsAIModalOpen(true)}
            style={{
              width: '100%',
              background:
                'linear-gradient(135deg, #E8395A, #c42d4a)',
              color: '#fafaf8',
              border: 'none',
              borderRadius: '16px',
              padding: '18px',
              fontSize: '12px',
              letterSpacing: '0.2em',
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
            ✦ SEE THIS ON YOU
          </motion.button>

          {/* ADD TO BAG + WISHLIST row */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (!selectedSize) {
                  setAddedToBag(true);
                  return;
                }
                handleAddToBag();
              }}
              style={{
                flex: 1,
                background: '#fafaf8',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '14px',
                padding: '17px',
                fontSize: '11px',
                letterSpacing: '0.18em',
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer'
              }}>
              ADD TO BAG
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setIsWishlisted(!isWishlisted)}
              style={{
                width: '52px',
                background: 'rgba(255,255,255,0.06)',
                border: '0.5px solid rgba(255,255,255,0.12)',
                borderRadius: '14px',
                color: isWishlisted ? '#E8395A' : '#fafaf8',
                cursor: 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              <motion.span
                animate={{
                  scale: isWishlisted ? [1, 1.3, 1] : 1
                }}
                transition={{ duration: 0.3 }}>
                {isWishlisted ? '♥' : '♡'}
              </motion.span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {product && (
        <TryOnExperience
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          product={product}
          garmentImage={product.image}
          garmentDescription={`${product.brand} ${product.name} ${product.category}`}
          garmentCategory={product.category}
          garmentName={product.name}
        />
      )}
    </>
  );
}
