import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function TryOnExperience({ isOpen, onClose, garmentImage }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'processing' | 'result'
  const [userImage, setUserImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const fileInputRef = useRef(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setUserImage(null);
      setResultImage(null);
      setPreviewMode(false);
      setIsFallback(false);
    }
  }, [isOpen]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUserImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  /**
   * Frontend Integration Data Service
   * Clean abstraction layer calling the new WearFits-based /api/tryon route
   */
  const generateTryOnData = async (userImgBase64, productImgUrl) => {
    try {
      // Convert base64 to Blob for multipart upload
      const fetched = await fetch(userImgBase64);
      const blob = await fetched.blob();
      
      const formData = new FormData();
      formData.append('humanImage', blob, 'user_image.jpg');
      formData.append('garmentImageUrl', productImgUrl);

      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/tryon`, 
      formData, 
      { 
        timeout: 55000, // 55 sec timeout to avoid server crash hanging
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return res.data; // Expects { status: 'success' | 'fallback', image?, message? }
    } catch (err) {
      console.error("Frontend API Communication Error:", err);
      // NEVER throw error in UI -> Always return structured fallback
      return { status: "fallback", message: "Network or Server limits reached" };
    }
  };

  /**
   * "High Quality Try-On ✨" Handler
   */
  const handleHighQualityRender = async () => {
    if (!userImage) return toast.error("Please upload a photo first");
    
    setStep('processing');
    setPreviewMode(false);
    setIsFallback(false);

    // Call abstraction layer
    const result = await generateTryOnData(userImage, garmentImage);

    if (result.status === 'success' && result.image) {
      setResultImage(result.image);
      setPreviewMode(false);
      setStep('result');
    } else {
      // Fallback -> API failed, timed out, or rate limits exceeded
      setIsFallback(true);
      setPreviewMode(true);
      setStep('result');
    }
  };

  /**
   * "Instant Preview ⚡" Handler
   */
  const handleInstantPreview = () => {
    if (!userImage) return toast.error("Please upload a photo first");
    setPreviewMode(true);
    setIsFallback(false);
    setStep('result');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] flex flex-col font-body text-white overflow-hidden"
          style={{ background: 'var(--black)' }}
        >
          {/* Top Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 flex-shrink-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-md">
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-start text-white transition-transform active:scale-95">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-[13px] tracking-[0.2em] uppercase font-semibold">WearFits Try-On</h1>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 overflow-y-auto relative">
            
            {/* STEP 1: UPLOAD & Dual Buttons */}
            {step === 'upload' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col p-4 pb-[150px]"
              >
                <div className="text-center mt-2 mb-6">
                  <h2 className="text-2xl font-light">See yourself in this</h2>
                  <p className="text-white/50 text-sm mt-1">Clear front-facing photos work best</p>
                </div>

                {/* Upload Box */}
                <div 
                  className="relative w-full max-h-[45vh] mx-auto overflow-hidden cursor-pointer bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center transition-all hover:bg-white/10"
                  style={{ aspectRatio: '3/4' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {userImage ? (
                     <img src={userImage} alt="User upload" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 opacity-60">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl">+</div>
                      <p className="text-sm font-medium">Capture or Upload</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </div>
                
                <div className="mt-8 text-center text-[11px] text-white/40 uppercase tracking-widest flex items-center justify-center gap-2">
                   🔒 100% Private & Secure Processing
                </div>

                {/* DUAL MODE UX BUTTONS */}
                {userImage && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-0 left-0 w-full px-4 py-6 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 z-[300] flex flex-col gap-3"
                  >
                    <button 
                      onClick={handleInstantPreview}
                      className="w-full bg-white/10 text-white font-medium py-4 rounded-xl text-sm border border-white/20 active:bg-white/20 transition-all flex justify-center items-center gap-2"
                    >
                      Instant Preview ⚡
                    </button>
                    <button 
                      onClick={handleHighQualityRender}
                      className="w-full bg-gradient-to-r from-[#E8395A] to-[#c42d4a] text-white font-medium py-4 rounded-xl text-sm shadow-[0_4px_20px_rgba(232,57,90,0.4)] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                    >
                      High Quality Try-On ✨
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 2: LOADING SKELETON */}
            {step === 'processing' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-6 bg-[#0a0a0a]"
              >
                <div className="w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden relative shadow-2xl border border-white/10">
                  <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
                  
                  {userImage && <img src={userImage} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen blur-sm" alt="" />}
                  
                  {/* Sweep logic */}
                  <div className="absolute top-0 left-0 w-full h-[200%] bg-gradient-to-b from-transparent via-white/10 to-transparent animate-[shimmer-slide_2.5s_infinite]"></div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  </div>
                </div>

                <div className="mt-8 text-center px-4">
                  <p className="text-lg font-medium tracking-wide">Generating your AI look</p>
                  <p className="text-white/40 text-[13px] mt-1">(30–60 seconds)</p>
                </div>
              </motion.div>
            )}

            {/* STEP 3: RESULT UX */}
            {step === 'result' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-[100svh] w-full flex flex-col absolute inset-0 bg-black z-50 pb-[calc(100px+env(safe-area-inset-bottom))]"
              >
                <div className="absolute top-0 w-full px-4 pt-4 flex justify-between items-start z-20">
                   <button onClick={onClose} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-md">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                </div>

                <div className="w-full h-full relative border border-white/10 rounded-b-3xl overflow-hidden bg-white/5">
                  {previewMode ? (
                    /* INSTANT PREVIEW (Fallback or Selected) */
                    <div className="w-full h-full relative flex items-center justify-center p-4">
                      <div className="w-full h-full relative max-w-md mx-auto aspect-[3/4] overflow-hidden rounded-2xl bg-black shadow-lg border border-white/10 flex">
                         {/* Split View */}
                         <div className="w-1/2 h-full border-r border-white/20 relative">
                            <img src={userImage} className="w-full h-full object-cover" alt="User" />
                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] backdrop-blur-md">You</div>
                         </div>
                         <div className="w-1/2 h-full relative bg-white">
                            <img src={garmentImage} className="w-full h-full object-contain p-2" alt="Product" />
                            <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 text-white rounded text-[10px] backdrop-blur-md">Garment</div>
                         </div>
                      </div>

                      {/* Fallback Toast Message */}
                      {isFallback && (
                         <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 backdrop-blur-md px-4 py-3 rounded-xl text-xs text-center shadow-lg font-medium">
                            Showing instant preview while HD render is unavailable.
                         </div>
                      )}
                    </div>
                  ) : (
                    /* HIGH QUALITY SUCCESS */
                    <img src={resultImage} alt="AI Result" className="w-full h-full object-cover" />
                  )}

                  <div className="absolute bottom-[30px] left-0 w-full text-center px-4 z-10">
                    <div className="bg-black/60 backdrop-blur-lg border border-white/20 rounded-full p-1 mx-auto w-max flex gap-1">
                      <button 
                        onClick={() => setPreviewMode(true)}
                        className={`px-4 py-2 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all duration-300 ${previewMode ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => {
                          if (resultImage) {
                            setPreviewMode(false);
                          } else {
                            toast("HD Render not generated yet", { icon: '⚠️' });
                          }
                        }}
                        className={`px-4 py-2 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all duration-300 ${!previewMode ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}
                      >
                        HD AI Fit
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions for Result */}
                <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 px-4 py-4 pb-[calc(16px+env(safe-area-inset-bottom))] z-[300] flex gap-3">
                  <button 
                    onClick={() => { setStep('upload'); setUserImage(null); }}
                    className="flex-[0.3] h-14 rounded-2xl bg-white/10 text-white font-bold text-[11px] tracking-widest uppercase transition-transform active:scale-[0.96]"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => toast.success("Look saved!")}
                    className="flex-[0.7] h-14 rounded-2xl bg-white text-black font-bold text-[11px] tracking-widest uppercase shadow-lg transition-transform active:scale-[0.96]"
                  >
                    Save Look
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
