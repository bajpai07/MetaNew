import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import OutfitRecommendations from '../OutfitRecommendations';
import MetricsPanel from '../MetricsPanel';

const LOADING_STAGES = [
  {
    text: "Optimizing your photo...",
    progress: 12
  },
  {
    text: "Mapping body structure...",
    progress: 28
  },
  {
    text: "Applying outfit fit...",
    progress: 48
  },
  {
    text: "Enhancing fabric details...",
    progress: 65
  },
  {
    text: "Perfecting your look...",
    progress: 82
  }
];

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
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const stageTimerRef = useRef(null);
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

  // ── Loading stages animation ──────────
  const startStages = useCallback(() => {
    setStageIndex(0);
    setProgress(0);
    
    let index = 0;
    stageTimerRef.current = setInterval(() => {
      index++;
      if (index < LOADING_STAGES.length) {
        setStageIndex(index);
        setProgress(
          LOADING_STAGES[index].progress
        );
      }
    }, 3000);
  }, []);

  const stopStages = useCallback(() => {
    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current);
      stageTimerRef.current = null;
    }
    // Animate to 100% on completion
    setProgress(100);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stageTimerRef.current) {
        clearInterval(stageTimerRef.current);
      }
    };
  }, []);

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

  // ── File upload handler ───────────────

  // ── Generate handler ──────────────────
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const pollingRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback((jobId) => {
    console.log("Starting polling for:", jobId);
    
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 60 * 3s = 3 min max
    
    pollingRef.current = setInterval(async () => {
      attempts++;
      
      if (attempts > MAX_ATTEMPTS) {
        stopPolling();
        stopStages();
        setIsGenerating(false);
        setError(
          "Taking too long. Please try again."
        );
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:10000'}/api/vton/status/${jobId}`
        );

        const data = response.data;
        setJobStatus(data.status);

        console.log(
          "Job status:", 
          data.status, 
          "attempt:", 
          attempts
        );

        if (data.status === 'completed') {
          stopPolling();
          stopStages();
          setResultUrl(data.resultUrl);
          setFitScore(data.fitScore);
          setGenerationTime(data.generationTime);
          setWarnings(data.warnings || []);
          if (data.metrics?.avgGenerationTime) {
            setAvgGenerationTime(data.metrics.avgGenerationTime);
          }
          setActiveTab('ai');
          setIsGenerating(false);
          
        } else if (data.status === 'failed') {
          stopPolling();
          stopStages();
          setError(
            data.error || 
            "Something went wrong. Please try again."
          );
          setIsGenerating(false);
        }
        // If pending/processing — keep polling

      } catch (err) {
        console.error("Polling error:", err.message);
        // Don't stop polling on network error
        // Just retry next interval
      }
    }, 3000); // Poll every 3 seconds

  }, [stopPolling, stopStages, setWarnings, setAvgGenerationTime]);

  const handleGenerate = useCallback(async () => {
    if (!uploadedPhoto) {
      setError("Please upload your photo first");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResultUrl(null);
    setJobId(null);
    setJobStatus(null);
    startStages();

    try {
      const formData = new FormData();
      formData.append('humanImage', uploadedPhoto);
      formData.append(
        'garmentImageUrl',
        currentProduct?.image || 
        currentProduct?.imageUrl ||
        currentProduct?.images?.[0]
      );
      formData.append('productId', currentProduct?._id || '');
      formData.append('productName', currentProduct?.name || '');
      formData.append('productPrice', currentProduct?.price || '');

      // This returns INSTANTLY with jobId
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:10000'}/api/vton/generate`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 30000 // just 30s for initial request
        }
      );

      if (response.data.success && 
          response.data.jobId) {
        const newJobId = response.data.jobId;
        setJobId(newJobId);
        setJobStatus('pending');
        
        console.log("Job created:", newJobId);
        
        // Start polling for result
        startPolling(newJobId);
        
      } else {
        throw new Error(
          response.data.error || 
          "Failed to start generation"
        );
      }

    } catch (err) {
      console.error("Generate error:", err);
      stopStages();
      setIsGenerating(false);
      
      let errorMsg = 
        "Something went wrong. Please try again.";
      
      if (err.response?.status === 400) {
        errorMsg = err.response.data?.error 
          || "Couldn't process this photo. Try a clearer image.";
      } else if (!navigator.onLine) {
        errorMsg = "No internet connection.";
      }
      
      setError(errorMsg);
    }
  }, [
    uploadedPhoto, 
    currentProduct, 
    startStages,
    startPolling
  ]);

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
              🔒 Private & auto-deleted within 24 hours
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
                  style={{
                    margin: '16px 20px 0',
                    background: 'rgba(232,57,90,0.08)',
                    border: '0.5px solid rgba(232,57,90,0.25)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                  
                  <p style={{
                    fontSize: '13px',
                    color: 'rgba(250,250,248,0.8)',
                    textAlign: 'center',
                    lineHeight: 1.6
                  }}>
                    {error}
                  </p>

                  {/* Retry button */}
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setError(null);
                      handleGenerate();
                    }}
                    style={{
                      background: 
                        'linear-gradient(135deg, #E8395A, #c42d4a)',
                      color: '#fafaf8',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontSize: '12px',
                      letterSpacing: '0.15em',
                      fontWeight: 500,
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                    ↺ TRY AGAIN
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}>
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
          </motion.div>
        )}

        {/* ── Loading overlay ───────────── */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(10,10,10,0.94)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200,
                padding: '40px 32px'
              }}>

              {/* ── Animated ring ──────────── */}
              <div style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                marginBottom: '40px'
              }}>
                {/* Outer slow ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '1px solid rgba(232,57,90,0.2)',
                    borderTop: '1px solid #E8395A'
                  }}
                />
                {/* Inner fast ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  style={{
                    position: 'absolute',
                    inset: '12px',
                    borderRadius: '50%',
                    border: 
                      '1px solid rgba(255,255,255,0.06)',
                    borderBottom: 
                      '1px solid rgba(255,255,255,0.3)'
                  }}
                />
                {/* Center dot */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  style={{
                    position: 'absolute',
                    inset: '34px',
                    borderRadius: '50%',
                    background: '#E8395A'
                  }}
                />
              </div>

              {/* ── Main heading ───────────── */}
              <h2 style={{
                fontFamily: 
                  "'Cormorant Garamond', serif",
                fontSize: '26px',
                fontWeight: 300,
                color: '#fafaf8',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                Creating your AI look
              </h2>

              {/* ── Dynamic stage text ─────── */}
              <div style={{
                height: '24px',
                overflow: 'hidden',
                marginBottom: '32px'
              }}>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      fontSize: '13px',
                      color: 'rgba(250,250,248,0.45)',
                      letterSpacing: '0.05em',
                      textAlign: 'center',
                      fontFamily: "'DM Sans', sans-serif"
                    }}>
                    {LOADING_STAGES[stageIndex]?.text}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* ── Progress bar ───────────── */}
              <div style={{
                width: '200px',
                marginBottom: '24px'
              }}>
                {/* Track */}
                <div style={{
                  height: '2px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  {/* Fill */}
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{
                      duration: 0.8,
                      ease: 'easeOut'
                    }}
                    style={{
                      height: '100%',
                      background: 
                        'linear-gradient(90deg, #E8395A, #ff6b8a)',
                      borderRadius: '2px'
                    }}
                  />
                </div>
                
                {/* percentage removed for cleaner UX */}
              </div>

              {/* ── Stage dots ─────────────── */}
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '32px'
              }}>
                {LOADING_STAGES.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      width: i === stageIndex 
                        ? '20px' : '6px',
                      background: i <= stageIndex
                        ? '#E8395A'
                        : 'rgba(255,255,255,0.12)',
                      opacity: i === stageIndex 
                        ? 1 : 0.5
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                      height: '6px',
                      borderRadius: '3px'
                    }}
                  />
                ))}
              </div>

              {/* ── Bottom branding ────────── */}
              <p style={{
                fontSize: '10px',
                color: 'rgba(250,250,248,0.15)',
                letterSpacing: '0.15em',
                fontFamily: "'DM Sans', sans-serif"
              }}>
                METASHOP AI
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
                  ✦ GENERATE MY LOOK ✨
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
                  ↓ SAVE LOOK
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
                ✦ TRY ANOTHER LOOK
              </motion.button>
            </div>
          )}

          <div className="mt-8">
            <MetricsPanel />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TryOnExperience;
