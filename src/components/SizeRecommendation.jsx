import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const SizeRecommendation = ({ onRecommendation }) => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  // Load saved measurements on mount
  useEffect(() => {
    fetchSavedMeasurements();
  }, []);

  const fetchSavedMeasurements = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:10000'}/api/users/measurements`,
        { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        }
      );

      if (res.data.success && res.data.measurements) {
        setHeight(String(res.data.measurements.height));
        setWeight(String(res.data.measurements.weight));
        setRecommendation(res.data.recommendation);
        setSaved(true);
        // Pass to parent
        onRecommendation?.(res.data.recommendation);
      }
    } catch (err) {
      // Silent fail
    }
  };

  const handleCalculate = async () => {
    if (!height || !weight) {
      setError("Enter both height and weight");
      return;
    }

    const h = Number(height);
    const w = Number(weight);

    if (h < 100 || h > 250) {
      setError("Height: 100-250 cm");
      return;
    }
    if (w < 30 || w > 250) {
      setError("Weight: 30-250 kg");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      const res = await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:10000'}/api/users/measurements`,
        { height: h, weight: w },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (res.data.success) {
        setRecommendation(res.data.recommendation);
        setSaved(true);
        onRecommendation?.(res.data.recommendation);
      }
    } catch (err) {
      setError("Could not calculate. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const sizeColors = {
    'XS': '#8b5cf6',
    'S': '#3b82f6',
    'M': '#4ade80',
    'L': '#f59e0b',
    'XL': '#f97316',
    'XXL': '#ef4444'
  };

  return (
    <div style={{
      margin: '16px 0 0',
      background: '#111111',
      border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '14px' }}>📏</span>
        <div>
          <p style={{
            fontSize: '11px',
            fontWeight: 500,
            color: '#fafaf8',
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '0.06em'
          }}>
            Size Recommendation
          </p>
          <p style={{
            fontSize: '10px',
            color: 'rgba(250,250,248,0.35)',
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '0.04em'
          }}>
            AI-powered fit analysis
          </p>
        </div>
        {saved && (
          <div style={{
            marginLeft: 'auto',
            background: 'rgba(74,222,128,0.1)',
            border: '0.5px solid rgba(74,222,128,0.3)',
            borderRadius: '20px',
            padding: '3px 10px',
            fontSize: '9px',
            color: '#4ade80',
            letterSpacing: '0.1em',
            fontFamily: "'DM Sans', sans-serif"
          }}>
            SAVED
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        {/* Input row */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '12px'
        }}>
          {/* Height input */}
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '10px',
              letterSpacing: '0.14em',
              color: 'rgba(250,250,248,0.4)',
              marginBottom: '6px',
              fontFamily: "'DM Sans', sans-serif"
            }}>
              HEIGHT (CM)
            </p>
            <input
              type="number"
              value={height}
              onChange={(e) => {
                setHeight(e.target.value);
                setError(null);
                if (saved) setSaved(false);
              }}
              placeholder="e.g. 170"
              min="100"
              max="250"
              style={{
                width: '100%',
                background: '#1a1a1a',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '12px 14px',
                color: '#fafaf8',
                fontSize: '15px',
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
                letterSpacing: '-0.01em',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#E8395A'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Weight input */}
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '10px',
              letterSpacing: '0.14em',
              color: 'rgba(250,250,248,0.4)',
              marginBottom: '6px',
              fontFamily: "'DM Sans', sans-serif"
            }}>
              WEIGHT (KG)
            </p>
            <input
              type="number"
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value);
                setError(null);
                if (saved) setSaved(false);
              }}
              placeholder="e.g. 65"
              min="30"
              max="250"
              style={{
                width: '100%',
                background: '#1a1a1a',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '12px 14px',
                color: '#fafaf8',
                fontSize: '15px',
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
                letterSpacing: '-0.01em',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#E8395A'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                fontSize: '11px',
                color: '#E8395A',
                marginBottom: '10px',
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: '0.04em'
              }}>
              ⚠ {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Calculate button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCalculate}
          disabled={loading || !height || !weight}
          style={{
            width: '100%',
            background: height && weight
              ? 'rgba(232,57,90,0.12)'
              : 'rgba(255,255,255,0.04)',
            border: height && weight
              ? '0.5px solid rgba(232,57,90,0.3)'
              : '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '13px',
            color: height && weight
              ? '#E8395A'
              : 'rgba(250,250,248,0.25)',
            fontSize: '11px',
            letterSpacing: '0.16em',
            fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            cursor: height && weight
              ? 'pointer'
              : 'not-allowed',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
          {loading 
            ? '⟳ Calculating...' 
            : '✦ GET MY SIZE'}
        </motion.button>

        {/* Recommendation result */}
        <AnimatePresence>
          {recommendation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                marginTop: '14px',
                background: '#0a0a0a',
                border: '0.5px solid rgba(255,255,255,0.06)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>

              {/* Size badge */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: `${sizeColors[recommendation.size] || '#E8395A'}18`,
                border: `0.5px solid ${sizeColors[recommendation.size] || '#E8395A'}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: sizeColors[recommendation.size] || '#E8395A',
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '-0.02em'
                }}>
                  {recommendation.size}
                </span>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#fafaf8',
                    fontFamily: "'DM Sans', sans-serif"
                  }}>
                    Recommended: {' '}
                    <span style={{ color: sizeColors[recommendation.size] || '#E8395A' }}>
                      {recommendation.size}
                    </span>
                  </p>
                </div>

                {/* Confidence bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    flex: 1,
                    height: '3px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${recommendation.confidence}%` }}
                      transition={{ 
                        duration: 0.8,
                        ease: 'easeOut',
                        delay: 0.2
                      }}
                      style={{
                        height: '100%',
                        background: '#4ade80',
                        borderRadius: '2px'
                      }}
                    />
                  </div>
                  <span style={{
                    fontSize: '11px',
                    color: '#4ade80',
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    minWidth: '36px'
                  }}>
                    {recommendation.confidence}%
                  </span>
                </div>

                <p style={{
                  fontSize: '11px',
                  color: 'rgba(250,250,248,0.4)',
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '0.02em',
                  lineHeight: 1.4
                }}>
                  {recommendation.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Privacy note */}
        <p style={{
          marginTop: '12px',
          fontSize: '10px',
          color: 'rgba(250,250,248,0.2)',
          letterSpacing: '0.06em',
          textAlign: 'center',
          fontFamily: "'DM Sans', sans-serif"
        }}>
          🔒 Measurements saved privately
        </p>
      </div>
    </div>
  );
};

export default SizeRecommendation;
