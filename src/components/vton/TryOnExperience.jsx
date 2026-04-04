import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import OutfitRecommendations from '../OutfitRecommendations';

const TryOnExperience = ({ product, garmentImage, isOpen, onClose }) => {
  const [currentProduct, setCurrentProduct] = useState(product);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [fitScore, setFitScore] = useState(null);
  const [activeTab, setActiveTab] = useState('yours'); // 'yours' | 'ai'
  const [sliderPos, setSliderPos] = useState(50);
  const [generationTime, setGenerationTime] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetryable, setIsRetryable] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [avgGenerationTime, setAvgGenerationTime] = useState(null);
  
  const handleTryThis = (newProduct) => {
    setResultUrl(null);
    setPreviewUrl(null);
    setUploadedPhoto(null);
    setFitScore(null);
    setError(null);
    setActiveTab('yours');
    setSliderPos(50);
    setCurrentProduct(newProduct);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const fileInputRef = useRef(null);
  const sliderRef = useRef(null);

  // ── Loading messages ──────────────────
  const loadingSteps = [
    "Analyzing your photo...",
    "Understanding garment details...",
    "Fitting garment to your body...",
    "Perfecting the details...",
    "Almost ready..."
  ];

  // ── File upload handler ───────────────
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG or WebP image");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
      return;
    }
    
    setError(null);
    setResultUrl(null);
    setFitScore(null);
    setWarnings([]);
    setUploadedPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  // ── Loading steps animation ───────────
  const startLoadingAnimation = useCallback(() => {
    setLoadingStep(0);
    const intervals = [0, 4000, 8000, 12000, 16000];
    intervals.forEach((delay, i) => {
      setTimeout(() => {
        setLoadingStep(i);
      }, delay);
    });
  }, []);

  // ── Generate handler ──────────────────
  const handleGenerate = useCallback(async () => {
    if (!uploadedPhoto) {
      setError("Please upload your photo first");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResultUrl(null);
    setWarnings([]);
    startLoadingAnimation();

    try {
      const formData = new FormData();
      formData.append('humanImage', uploadedPhoto);
      // Explicitly follow user request for garmentImageUrl extraction
      const garmentUrl = garmentImage || currentProduct?.image || currentProduct?.imageUrl || currentProduct?.images?.[0];
      formData.append('garmentImageUrl', garmentUrl);

      console.log("Product:", currentProduct);
      console.log("Garment URL:", currentProduct?.image || currentProduct?.imageUrl || currentProduct?.images?.[0]);
      console.log("API URL:", process.env.REACT_APP_API_URL);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:10000'}/api/vton/generate`,
        formData,
        {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 180000 // 3 min frontend timeout
        }
      );

      if (response.data.success) {
        setResultUrl(response.data.resultUrl);
        setFitScore(response.data.fitScore);
        setGenerationTime(response.data.generationTime);
        setWarnings(response.data.warnings || []);
        if (response.data.metrics?.avgGenerationTime) {
          setAvgGenerationTime(response.data.metrics.avgGenerationTime);
        }
        setActiveTab('ai');
        setRetryCount(0);
      } else {
        throw new Error(
          response.data.error || "Generation failed"
        );
      }

    } catch (err) {
      console.error("Generation error:", err);
      
      let errorMsg = "Generation failed. Please try again.";
      let canRetry = true;
      
      if (err.response?.data?.errorType) {
        const { errorType, error: uiError, retryable } = err.response.data;
        
        const errorMap = {
          'TIMEOUT_ERROR': "AI is busy right now. Try again in a few seconds.",
          'VALIDATION_ERROR': "Use a clear front-facing full-body photo.",
          'QUOTA_ERROR': "Service temporarily unavailable. Try later.",
          'NETWORK_ERROR': "Network issue. Check your internet.",
          'UNKNOWN_ERROR': "Something went wrong. Please retry."
        };
        
        errorMsg = errorMap[errorType] || uiError || "Something went wrong. Please retry.";
        canRetry = retryable;
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMsg = "AI is busy right now. Try again in a few seconds.";
      } else if (!navigator.onLine) {
        errorMsg = "Network issue. Check your internet.";
      }

      if (canRetry && retryCount >= 3) {
        errorMsg = "Please try again after some time";
        canRetry = false;
      }
      
      setError(errorMsg);
      setIsRetryable(canRetry);
      if (!canRetry) {
        setRetryCount(0);
      }
    } finally {
      setIsGenerating(false);
      setLoadingStep(0);
    }
  }, [uploadedPhoto, product, garmentImage, startLoadingAnimation, retryCount]);

  // ── Download handler ──────────────────
  const handleDownload = useCallback(async () => {
    if (!resultUrl) return;
    try {
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        window.open(resultUrl, '_blank');
        return;
      }
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = `metashop-tryon-${Date.now()}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(resultUrl, '_blank');
    }
  }, [resultUrl]);

  // ── Share handler ─────────────────────
  const handleShare = useCallback(async () => {
    if (!resultUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this outfit on me!',
          text: `I tried on ${product?.name || "this piece"} virtually on Metashop 🛍️`,
          url: window.location.href
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard?.writeText(
            window.location.href
          );
        }
      }
    } else {
      navigator.clipboard?.writeText(
        window.location.href
      );
      alert('Link copied to clipboard!');
    }
  }, [resultUrl, product]);

  // ── Reset handler ─────────────────────
  const handleTryAnother = useCallback(() => {
    setUploadedPhoto(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setFitScore(null);
    setError(null);
    setWarnings([]);
    setIsRetryable(false);
    setActiveTab('yours');
    setSliderPos(50);
    setGenerationTime(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // ── Before/After slider ───────────────
  const handleSliderMove = useCallback((e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current
      .getBoundingClientRect();
    const clientX = e.touches 
      ? e.touches[0].clientX 
      : e.clientX;
    const pos = Math.min(
      Math.max(
        ((clientX - rect.left) / rect.width) * 100,
        0
      ),
      100
    );
    setSliderPos(pos);
  }, []);

  // If not open, render nothing to match original modal paradigm
  if (!isOpen && typeof isOpen !== 'undefined') return null;

  // ── Styles ────────────────────────────
  const s = {
    wrap: {
      position: isOpen ? 'fixed' : 'relative',
      inset: isOpen ? 0 : 'auto',
      zIndex: isOpen ? 9999 : 'auto',
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fafaf8',
      fontFamily: "'DM Sans', sans-serif",
      paddingBottom: '120px',
      overflow: 'auto',
      pointerEvents: 'auto'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      position: 'sticky',
      top: 0,
      background: 'rgba(10,10,10,0.95)',
      backdropFilter: 'blur(12px)',
      zIndex: 100
    },
    backBtn: {
      background: 'none',
      border: 'none',
      color: '#fafaf8',
      cursor: 'pointer',
      fontSize: '20px',
      padding: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontFamily: "'DM Sans', sans-serif",
      letterSpacing: '0.05em'
    },
    title: {
      fontSize: '12px',
      letterSpacing: '0.2em',
      color: 'rgba(250,250,248,0.6)',
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    fitBadge: {
      background: 'rgba(74,222,128,0.12)',
      border: '0.5px solid rgba(74,222,128,0.4)',
      borderRadius: '20px',
      padding: '4px 12px',
      fontSize: '11px',
      color: '#4ade80',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    uploadZone: {
      margin: '20px',
      aspectRatio: '3/4',
      background: '#111111',
      border: '1.5px dashed rgba(255,255,255,0.15)',
      borderRadius: '20px',
      overflow: 'hidden',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      transition: 'border-color 0.2s'
    },
    tabRow: {
      display: 'flex',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: '3px',
      margin: '0 20px 16px',
      gap: '2px'
    },
    tab: (active) => ({
      flex: 1,
      padding: '10px',
      borderRadius: '10px',
      border: 'none',
      background: active ? '#fafaf8' : 'transparent',
      color: active ? '#0a0a0a' : 'rgba(250,250,248,0.5)',
      fontSize: '12px',
      fontWeight: active ? 600 : 400,
      letterSpacing: '0.08em',
      cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif",
      transition: 'all 0.2s'
    })
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        style={s.wrap}>

        {/* ── Header ───────────────────── */}
        <div style={s.header}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            style={s.backBtn}
            onClick={onClose}>
            ← Back
          </motion.button>
          
          <span style={s.title}>
            TRY THIS LOOK ON YOU
          </span>

          {fitScore && (
            <div style={s.fitBadge}>
              <span>●</span>
              {fitScore}% MATCH
            </div>
          )}
          
          {!fitScore && <div style={{ width: '80px' }} />}
        </div>

        {/* ── Main content ─────────────── */}
        {!resultUrl ? (
          <>
            {/* Upload section */}
            <div style={{ padding: '20px 20px 0' }}>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '26px',
                fontWeight: 400,
                marginBottom: '6px',
                color: '#fafaf8'
              }}>
                ✦ See yourself in this outfit
              </h2>
              <p style={{
                fontSize: '13px',
                color: 'rgba(250,250,248,0.45)',
                marginBottom: '20px'
              }}>
                Use a clear front-facing full body photo
              </p>
            </div>

            {/* Upload zone */}
            <motion.div
              whileTap={{ scale: 0.99 }}
              style={{
                ...s.uploadZone,
                borderColor: previewUrl 
                  ? 'rgba(232,57,90,0.4)'
                  : 'rgba(255,255,255,0.15)'
              }}
              onClick={() => fileInputRef.current?.click()}>
              
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Your photo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top center'
                  }}
                />
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '20px'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '0.5px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    +
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(250,250,248,0.5)',
                    textAlign: 'center'
                  }}>
                    Upload your photo
                  </p>
                  <p style={{
                    fontSize: '11px',
                    color: 'rgba(250,250,248,0.25)',
                    textAlign: 'center',
                    lineHeight: 1.5
                  }}>
                    JPG, PNG or WebP • Max 10MB
                  </p>
                </div>
              )}

              {/* Change photo overlay */}
              {previewUrl && (
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(10,10,10,0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '0.5px solid rgba(255,255,255,0.15)',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  color: '#fafaf8',
                  whiteSpace: 'nowrap'
                }}>
                  ↑ Change photo
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </motion.div>

            {/* Privacy note */}
            <p style={{
              textAlign: 'center',
              fontSize: '11px',
              letterSpacing: '0.08em',
              color: 'rgba(250,250,248,0.28)',
              padding: '12px 20px 0'
            }}>
              🔒 YOUR PHOTO IS PRIVATE & AUTO-DELETED
            </p>

            {/* Tips */}
            <div style={{
              margin: '16px 20px 0',
              background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '14px 16px'
            }}>
              <p style={{
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: 'rgba(250,250,248,0.35)',
                marginBottom: '8px'
              }}>
                BEST RESULTS
              </p>
              {[
                '✓ Full body visible',
                '✓ Front-facing pose',
                '✓ Good lighting',
                '✓ Plain background'
              ].map(tip => (
                <p key={tip} style={{
                  fontSize: '12px',
                  color: 'rgba(250,250,248,0.5)',
                  marginBottom: '4px'
                }}>
                  {tip}
                </p>
              ))}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    margin: '16px 20px 0',
                    background: 'rgba(232,57,90,0.1)',
                    border: '0.5px solid rgba(232,57,90,0.3)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                  <span style={{ 
                    color: '#E8395A', 
                    fontSize: '16px',
                    flexShrink: 0
                  }}>
                    ✕
                  </span>
                  <p style={{
                    fontSize: '13px',
                    color: 'rgba(250,250,248,0.8)',
                    lineHeight: 1.5
                  }}>
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            {/* ── Result section ─────────── */}
            
            {/* Before/After Slider */}
            <div style={{ 
              margin: '16px 20px 0',
              borderRadius: '20px',
              overflow: 'hidden',
              position: 'relative',
              aspectRatio: '3/4',
              userSelect: 'none',
              touchAction: 'none'
            }}
              ref={sliderRef}
              onMouseMove={(e) => {
                if (e.buttons === 1) 
                  handleSliderMove(e);
              }}
              onTouchMove={handleSliderMove}>
              
              {/* AI result — full width */}
              <img
                src={resultUrl}
                alt="AI Try-On"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top'
                }}
              />
              
              {/* Original photo — clipped */}
              <div style={{
                position: 'absolute',
                inset: 0,
                clipPath: `inset(0 ${100 - sliderPos}% 0 0)`
              }}>
                <img
                  src={previewUrl}
                  alt="Your photo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top'
                  }}
                />
              </div>
              
              {/* Slider handle */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${sliderPos}%`,
                  transform: 'translateX(-50%)',
                  width: '2px',
                  background: 'rgba(255,255,255,0.9)',
                  cursor: 'ew-resize'
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const move = (e) => 
                    handleSliderMove(e);
                  const up = () => {
                    window.removeEventListener(
                      'mousemove', move
                    );
                    window.removeEventListener(
                      'mouseup', up
                    );
                  };
                  window.addEventListener(
                    'mousemove', move
                  );
                  window.addEventListener(
                    'mouseup', up
                  );
                }}
                onTouchStart={() => {}}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#fafaf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: '#0a0a0a',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                  fontWeight: 700,
                  cursor: 'ew-resize'
                }}>
                  ⇔
                </div>
              </div>
              
              {/* Labels */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(10,10,10,0.6)',
                backdropFilter: 'blur(8px)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.7)'
              }}>
                YOU
              </div>
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(232,57,90,0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: '#fafaf8'
              }}>
                AI LOOK
              </div>
              
              {/* Drag hint */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(10,10,10,0.65)',
                backdropFilter: 'blur(8px)',
                borderRadius: '20px',
                padding: '5px 14px',
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.6)',
                whiteSpace: 'nowrap'
              }}>
                ← drag to compare →
              </div>
            </div>

            {/* Tab toggle */}
            <div style={s.tabRow}>
              {['yours', 'ai'].map(tab => (
                <motion.button
                  key={tab}
                  whileTap={{ scale: 0.97 }}
                  style={s.tab(activeTab === tab)}
                  onClick={() => setActiveTab(tab)}>
                  {tab === 'yours' 
                    ? 'YOUR PHOTO' 
                    : 'AI LOOK'}
                </motion.button>
              ))}
            </div>

            {/* Single image view */}
            <div style={{
              margin: '0 20px',
              borderRadius: '16px',
              overflow: 'hidden',
              aspectRatio: '3/4'
            }}>
              <img
                src={activeTab === 'yours' 
                  ? previewUrl 
                  : resultUrl}
                alt={activeTab === 'yours' 
                  ? 'Your photo' 
                  : 'AI Try-On'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top'
                }}
              />
            </div>

            {/* Stats row */}
            {(fitScore || generationTime) && (
              <div style={{
                display: 'flex',
                gap: '8px',
                margin: '16px 20px 0'
              }}>
                {fitScore && (
                  <div style={{
                    flex: 1,
                    background: 'rgba(74,222,128,0.06)',
                    border: '0.5px solid rgba(74,222,128,0.2)',
                    borderRadius: '12px',
                    padding: '14px',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      fontSize: '22px',
                      fontWeight: 600,
                      color: '#4ade80',
                      marginBottom: '2px'
                    }}>
                      {fitScore}%
                    </p>
                    <p style={{
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      color: 'rgba(250,250,248,0.4)'
                    }}>
                      AI FIT SCORE
                    </p>
                  </div>
                )}
                {generationTime && (
                  <div style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    border: '0.5px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    padding: '14px',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      fontSize: '22px',
                      fontWeight: 600,
                      color: '#fafaf8',
                      marginBottom: '2px'
                    }}>
                      {(generationTime/1000).toFixed(1)}s
                    </p>
                    <p style={{
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      color: 'rgba(250,250,248,0.4)'
                    }}>
                      GENERATED IN
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Average time metric */}
            {avgGenerationTime && (
              <p style={{
                textAlign: 'center',
                fontSize: '10px',
                color: 'rgba(250,250,248,0.3)',
                letterSpacing: '0.05em',
                marginTop: '10px'
              }}>
                ⚡ Avg generation time: {(avgGenerationTime/1000).toFixed(1)}s
              </p>
            )}
            {/* Warnings block */}
            {warnings && warnings.length > 0 && (
              <div style={{
                margin: '16px 20px 0',
                background: 'rgba(234, 179, 8, 0.1)',
                border: '0.5px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '12px',
                padding: '14px 16px'
              }}>
                <p style={{
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  color: 'rgba(234, 179, 8, 0.8)',
                  marginBottom: '8px',
                  fontWeight: 600
                }}>
                  FOR BETTER RESULTS
                </p>
                {warnings.map((warning, i) => (
                  <p key={i} style={{
                    fontSize: '12px',
                    color: 'rgba(250,250,248,0.7)',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    lineHeight: 1.4
                  }}>
                    <span style={{ color: 'rgba(234, 179, 8, 0.6)' }}>•</span>
                    {warning}
                  </p>
                ))}
              </div>
            )}

            {/* Product name */}
            <div style={{
              margin: '16px 20px 0',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid rgba(255,255,255,0.07)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  color: 'rgba(250,250,248,0.35)',
                  marginBottom: '3px'
                }}>
                  OUTFIT TRIED
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#fafaf8',
                  fontWeight: 400
                }}>
                  {currentProduct?.name || "Garment preview"}
                </p>
              </div>
              <p style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#fafaf8'
              }}>
                {currentProduct?.price ? `₹${currentProduct.price.toLocaleString('en-IN')}` : ''}
              </p>
            </div>

            <OutfitRecommendations
              productId={currentProduct?._id}
              onTryThis={handleTryThis}
            />
          </>
        )}

        {/* ── Loading overlay ───────────── */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(10,10,10,0.92)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200,
                padding: '40px'
              }}>
              
              {/* Spinner */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 1.2, 
                  repeat: Infinity, 
                  ease: 'linear' 
                }}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderTop: '2px solid #E8395A',
                  marginBottom: '32px'
                }}
              />
              
              {/* Step text */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    fontFamily: 
                      "'Cormorant Garamond', serif",
                    fontSize: '22px',
                    fontWeight: 300,
                    color: '#fafaf8',
                    textAlign: 'center',
                    marginBottom: '12px'
                  }}>
                  {loadingSteps[loadingStep]}
                </motion.p>
              </AnimatePresence>
              
              <p style={{
                fontSize: '12px',
                color: 'rgba(250,250,248,0.35)',
                letterSpacing: '0.1em',
                textAlign: 'center'
              }}>
                This takes 15–30 seconds
              </p>

              {/* Progress dots */}
              <div style={{
                display: 'flex',
                gap: '6px',
                marginTop: '24px'
              }}>
                {loadingSteps.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      background: i <= loadingStep
                        ? '#E8395A'
                        : 'rgba(255,255,255,0.15)',
                      scale: i === loadingStep 
                        ? 1.3 
                        : 1
                    }}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%'
                    }}
                  />
                ))}
              </div>

              {/* Cancel hint */}
              <p style={{
                marginTop: '32px',
                fontSize: '11px',
                color: 'rgba(250,250,248,0.2)',
                letterSpacing: '0.08em'
              }}>
                ✦ Powered by FASHN AI v1.6
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Fixed Bottom CTA ─────────── */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 20px',
          paddingBottom: 
            'calc(12px + env(safe-area-inset-bottom))',
          background: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '0.5px solid rgba(255,255,255,0.07)',
          zIndex: 100
        }}>

          {!resultUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {error && isRetryable ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setRetryCount(p => p + 1); handleGenerate(); }}
                  disabled={isGenerating}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #E8395A, #c42d4a)',
                    color: '#fafaf8',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '18px',
                    fontSize: '12px',
                    letterSpacing: '0.2em',
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    opacity: isGenerating ? 0.6 : 1,
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                  ✦ TRY AGAIN
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGenerate}
                  disabled={isGenerating || !uploadedPhoto}
                  style={{
                    width: '100%',
                    background: uploadedPhoto
                      ? 'linear-gradient(135deg, #E8395A, #c42d4a)'
                      : 'rgba(255,255,255,0.08)',
                    color: uploadedPhoto
                      ? '#fafaf8'
                      : 'rgba(250,250,248,0.3)',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '18px',
                    fontSize: '12px',
                    letterSpacing: '0.2em',
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: (isGenerating || !uploadedPhoto) ? 'not-allowed' : 'pointer',
                    opacity: isGenerating ? 0.6 : 1,
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                  ✦ GENERATE MY LOOK
                </motion.button>
              )}
              
              {!error && uploadedPhoto && (
                <p style={{
                  fontSize: '10px',
                  color: 'rgba(250,250,248,0.4)',
                  textAlign: 'center',
                  letterSpacing: '0.05em'
                }}>
                  Best results with clear front-facing photos
                </p>
              )}
              {error && isRetryable && (
                <p style={{
                  fontSize: '10px',
                  color: 'rgba(250,250,248,0.4)',
                  textAlign: 'center',
                  letterSpacing: '0.05em'
                }}>
                  If it fails, you can retry instantly
                </p>
              )}
            </div>
          ) : (
            /* Result action buttons */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              
              {/* Download + Share row */}
              <div style={{ 
                display: 'flex', 
                gap: '8px' 
              }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleDownload}
                  style={{
                    flex: 1,
                    background: '#fafaf8',
                    color: '#0a0a0a',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '14px',
                    fontSize: '11px',
                    letterSpacing: '0.15em',
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}>
                  ↓ SAVE IMAGE
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleShare}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fafaf8',
                    border: '0.5px solid rgba(255,255,255,0.15)',
                    borderRadius: '14px',
                    padding: '14px',
                    fontSize: '11px',
                    letterSpacing: '0.15em',
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}>
                  ↗ SHARE
                </motion.button>
              </div>

              {/* Try another */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleTryAnother}
                style={{
                  width: '100%',
                  background: 
                    'linear-gradient(135deg, #E8395A, #c42d4a)',
                  color: '#fafaf8',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '14px',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer'
                }}>
                ✦ TRY ANOTHER PHOTO
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TryOnExperience;
