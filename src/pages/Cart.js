import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const BagPage = () => {
  const { cartItems: contextCartItems, removeFromCart, updateQty } = useCart();
  const navigate = useNavigate();

  const cartItems = (Array.isArray(contextCartItems) ? contextCartItems : []).map((item) => {
    const product = item.product || item;
    const prodId = (typeof product === 'object' && product !== null) ? product._id : product;
    return {
      _id: item._id,
      product_id: prodId || item.product_id || item.productId,
      name: product.name || item.name || 'Product',
      image: product.image || item.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      price: Number(item.priceAtPurchase || product.price || item.price || 0),
      mrp: Number(product.originalPrice || Math.round((item.priceAtPurchase || product.price || item.price || 0) * 1.5)),
      quantity: item.qty || item.quantity || 1,
      size: item.size || product.size || null,
      color: item.color || product.color || null,
      maxStock: product.stock > 0 ? product.stock : 10
    };
  });

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const delivery = subtotal >= 499 || subtotal === 0 ? 0 : 49;
  const totalSavings = cartItems.reduce((acc, item) => acc + ((item.mrp - item.price) * item.quantity), 0);
  const finalTotal = subtotal + delivery;

  const decreaseQty = async (item) => {
    if (item.quantity > 1) {
      try {
        await toast.promise(
          updateQty(item.product_id, item.quantity - 1),
          { loading: 'Updating...', success: 'Cart updated', error: (e) => e.response?.data?.message || 'Could not update' }
        );
      } catch (e) {}
    }
  };

  const increaseQty = async (item) => {
    if (item.quantity < item.maxStock) {
      try {
        await toast.promise(
          updateQty(item.product_id, item.quantity + 1),
          { loading: 'Updating...', success: 'Cart updated', error: (e) => e.response?.data?.message || 'Could not update' }
        );
      } catch (e) {}
    } else {
      toast.error(`Only ${item.maxStock} available`);
    }
  };

  const handleRemoveFromCart = async (item) => {
    try {
      await toast.promise(
        removeFromCart(item.product_id),
        { loading: 'Removing...', success: 'Removed', error: 'Failed' }
      );
    } catch (e) {}
  };

  const handleProcessOrder = () => {
    navigate('/checkout');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#fafaf8',
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: '120px'
      }}>

      {/* ── HEADER ── */}
      <div style={{
        padding: '24px 24px 18px',
        borderBottom: '0.5px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'baseline',
        gap: '10px'
      }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '28px',
          fontWeight: 400,
          color: '#fafaf8',
          lineHeight: 1.2,
          letterSpacing: '-0.01em'
        }}>
          Shopping Bag
        </h1>
        <span style={{
          fontSize: '13px',
          color: 'rgba(250,250,248,0.4)',
          letterSpacing: '0.06em',
          marginLeft: '10px'
        }}>
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* ── EMPTY STATE ── */}
      {cartItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '16px',
            padding: '40px 20px'
          }}>
          <div style={{
            width: '72px', height: '72px',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: 'rgba(255,255,255,0.2)'
          }}>
            ◻
          </div>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '22px',
            fontWeight: 400,
            color: '#fafaf8'
          }}>
            Your bag is empty
          </p>
          <p style={{
            fontSize: '13px',
            color: 'rgba(250,250,248,0.45)',
            textAlign: 'center',
            lineHeight: 1.6
          }}>
            Add items you love to your bag
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            style={{
              marginTop: '8px',
              background: '#E8395A',
              color: '#fafaf8',
              border: 'none',
              borderRadius: '14px',
              padding: '14px 32px',
              fontSize: '11px',
              letterSpacing: '0.18em',
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer'
            }}>
            CONTINUE SHOPPING
          </motion.button>
        </motion.div>
      )}

      {/* ── CART ITEMS LIST ── */}
      {cartItems.length > 0 && (
        <div style={{ padding: '0 24px' }}>
          <AnimatePresence>
            {cartItems.map((item, index) => (
              <motion.div
                key={item._id || item.product_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: index * 0.06 }}
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '22px 0',
                  borderBottom: '0.5px solid rgba(255,255,255,0.07)',
                  position: 'relative'
                }}>

                {/* Product Image */}
                <div style={{
                  width: '108px',
                  height: '138px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: '#181818',
                  flexShrink: 0
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
                </div>

                {/* Product Info */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minWidth: 0
                }}>
                  <div>
                    {/* Brand */}
                    <p style={{
                      fontSize: '10px',
                      letterSpacing: '0.2em',
                      color: 'rgba(250,250,248,0.4)',
                      marginBottom: '5px',
                      textTransform: 'uppercase'
                    }}>
                      METASHOP
                    </p>

                    {/* Name */}
                    <p style={{
                      fontSize: '15px',
                      color: '#fafaf8',
                      fontWeight: 400,
                      lineHeight: 1.4,
                      marginBottom: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.name}
                    </p>

                    {/* Size + Color tags */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '10px'
                    }}>
                      {item.size && (
                        <span style={{
                          fontSize: '10px',
                          letterSpacing: '0.08em',
                          color: 'rgba(250,250,248,0.5)',
                          background: 'rgba(255,255,255,0.06)',
                          border: '0.5px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          padding: '4px 10px'
                        }}>
                          {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span style={{
                          fontSize: '10px',
                          letterSpacing: '0.08em',
                          color: 'rgba(250,250,248,0.5)',
                          background: 'rgba(255,255,255,0.06)',
                          border: '0.5px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          padding: '4px 10px'
                        }}>
                          {item.color}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        fontSize: '17px',
                        fontWeight: 500,
                        color: '#fafaf8',
                        letterSpacing: '-0.02em'
                      }}>
                        ₹{item.price}
                      </span>
                      {item.mrp && item.mrp > item.price && (
                        <>
                          <span style={{
                            fontSize: '12px',
                            color: 'rgba(250,250,248,0.3)',
                            textDecoration: 'line-through'
                          }}>
                            ₹{item.mrp}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            color: '#4ade80',
                            fontWeight: 500
                          }}>
                            {Math.round((1 - item.price/item.mrp)*100)}% off
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quantity + Remove row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '14px'
                  }}>

                    {/* Quantity control */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0',
                      background: 'rgba(255,255,255,0.06)',
                      border: '0.5px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      overflow: 'hidden'
                    }}>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => decreaseQty(item)}
                        style={{
                          width: '38px', height: '38px',
                          background: 'none', border: 'none',
                          color: '#fafaf8', cursor: 'pointer',
                          fontSize: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                        −
                      </motion.button>

                      <span style={{
                        width: '32px',
                        textAlign: 'center',
                        fontSize: '15px',
                        color: '#fafaf8',
                        fontWeight: 500
                      }}>
                        {item.quantity}
                      </span>

                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => increaseQty(item)}
                        style={{
                          width: '38px', height: '38px',
                          background: 'none', border: 'none',
                          color: '#fafaf8', cursor: 'pointer',
                          fontSize: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                        +
                      </motion.button>
                    </div>

                    {/* Remove button */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveFromCart(item)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(250,250,248,0.35)',
                        fontSize: '11px',
                        letterSpacing: '0.12em',
                        cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                        padding: '8px 0',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px'
                      }}>
                      REMOVE
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* ── ORDER SUMMARY ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              margin: '28px 24px 0',
              background: '#111111',
              border: '0.5px solid rgba(255,255,255,0.07)',
              borderRadius: '20px',
              padding: '22px'
            }}>

            <p style={{
              fontSize: '10px',
              letterSpacing: '0.22em',
              color: 'rgba(250,250,248,0.4)',
              marginBottom: '18px',
              textTransform: 'uppercase'
            }}>
              Order Summary
            </p>

            {/* Summary rows */}
            {[
              { 
                label: 'Subtotal', 
                value: `₹${subtotal}` 
              },
              { 
                label: 'Delivery', 
                value: subtotal >= 499 
                  ? 'FREE' : '₹49',
                valueColor: subtotal >= 499 
                  ? '#4ade80' : '#fafaf8'
              },
              { 
                label: 'You save', 
                value: `₹${totalSavings}`,
                valueColor: '#4ade80'
              }
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px'
              }}>
                <span style={{
                  fontSize: '14px',
                  lineHeight: 1.5,
                  color: 'rgba(250,250,248,0.55)'
                }}>
                  {row.label}
                </span>
                <span style={{
                  fontSize: '14px',
                  color: row.valueColor || '#fafaf8',
                  fontWeight: 500
                }}>
                  {row.value}
                </span>
              </div>
            ))}

            {/* Divider */}
            <div style={{
              height: '0.5px',
              background: 'rgba(255,255,255,0.07)',
              margin: '18px 0'
            }} />

            {/* Total */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '19px',
                color: '#fafaf8',
                letterSpacing: '-0.01em',
                fontWeight: 400
              }}>
                Total
              </span>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '24px',
                color: '#fafaf8',
                letterSpacing: '-0.02em',
                fontWeight: 400
              }}>
                ₹{finalTotal}
              </span>
            </div>

            {/* Free delivery progress bar */}
            {subtotal > 0 && subtotal < 499 && (
              <div style={{ marginTop: '18px' }}>
                <p style={{
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: 'rgba(250,250,248,0.45)',
                  marginBottom: '10px'
                }}>
                  Add ₹{499 - subtotal} more for FREE delivery
                </p>
                <div style={{
                  height: '3px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.min((subtotal/499)*100, 100)}%` 
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: '#E8395A',
                      borderRadius: '2px'
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* ── COUPON INPUT ── */}
          <div style={{
            margin: '18px 24px 0',
            display: 'flex',
            gap: '10px'
          }}>
            <input
              placeholder="Enter coupon code"
              style={{
                flex: 1,
                background: '#111111',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                padding: '16px 18px',
                color: '#fafaf8',
                fontSize: '14px',
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none'
              }}
              onFocus={e => 
                e.target.style.borderColor = '#E8395A'}
              onBlur={e => 
                e.target.style.borderColor = 
                'rgba(255,255,255,0.1)'}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                padding: '16px 20px',
                color: '#fafaf8',
                fontSize: '12px',
                letterSpacing: '0.12em',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
              APPLY
            </motion.button>
          </div>
        </div>
      )}

      {/* ── FIXED BOTTOM CTA ── */}
      {cartItems.length > 0 && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4, type: 'spring',
                        stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            padding: '18px 24px',
            paddingBottom: 
              'calc(18px + env(safe-area-inset-bottom))',
            background: 'rgba(10,10,10,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '0.5px solid rgba(255,255,255,0.07)',
            zIndex: 100,
            gap: '14px'
          }}>

          {/* Total preview in CTA area */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px'
          }}>
            <span style={{
              fontSize: '13px',
              color: 'rgba(250,250,248,0.5)',
              letterSpacing: '0.06em'
            }}>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
            <span style={{
              fontSize: '17px',
              fontWeight: 500,
              color: '#fafaf8',
              letterSpacing: '-0.02em'
            }}>
              ₹{finalTotal}
            </span>
          </div>

          {/* PROCESS ORDER button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleProcessOrder}
            style={{
              width: '100%',
              background: 
                'linear-gradient(135deg, #E8395A, #c42d4a)',
              color: '#fafaf8',
              border: 'none',
              borderRadius: '16px',
              padding: '19px',
              fontSize: '12px',
              letterSpacing: '0.22em',
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
            PROCESS ORDER
            <span style={{ fontSize: '14px' }}>→</span>
          </motion.button>

          {/* Trust badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginTop: '14px'
          }}>
            {[
              '🔒 Secure checkout',
              '↩ Easy returns',
              '🚚 Fast delivery'
            ].map(badge => (
              <span key={badge} style={{
                fontSize: '9px',
                letterSpacing: '0.08em',
                color: 'rgba(250,250,248,0.3)'
              }}>
                {badge}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BagPage;
