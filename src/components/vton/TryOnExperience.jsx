import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function TryOnExperience({ isOpen, onClose, garmentImage, garmentDescription, garmentCategory, garmentName }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'processing' | 'result'
  const [userImage, setUserImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loadingText, setLoadingText] = useState('Analyzing your photo...');
  const [viewMode, setViewMode] = useState('ai'); // 'ai' or 'user'

  const loadingMessages = [
    "Analyzing your photo...",
    "Fitting the outfit...",
    "Applying realistic physics...",
    "Almost ready..."
  ];

  useEffect(() => {
    let interval;
    if (step === 'processing') {
      let i = 0;
      setLoadingText(loadingMessages[0]);
      interval = setInterval(() => {
        i++;
        if (i < loadingMessages.length) setLoadingText(loadingMessages[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setUserImage(null);
      setResultImage(null);
      setViewMode('ai');
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

  const generateLook = async () => {
    if (!userImage) return toast.error("Please upload a photo first");
    
    setStep('processing');
    try {
      // Convert base64 Data URL to Blob
      const fetched = await fetch(userImage);
      const blob = await fetched.blob();
      
      const formData = new FormData();
      formData.append('humanImage', blob, 'human_image.jpg');
      formData.append('garmentImageUrl', garmentImage);

      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/vton/generate`, 
      formData, 
      { 
        timeout: 180000,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success || res.data.resultUrl) {
        setResultImage(res.data.resultUrl);
        setTimeout(() => setStep('result'), 800);
      } else {
        toast.error(res.data.error || "Generation failed.");
        setStep('upload');
      }
    } catch (err) {
      console.error("Generation error:", err);
      if (err.code === 'ECONNABORTED') {
        toast.error("Taking too long. AI is warming up — please try again in 30 seconds.");
      } else if (err.response?.status === 500) {
        toast.error(`Server error: ${err.response.data?.error || "Unknown"}`);
      } else {
        toast.error("Generation failed. Check your internet and try again.");
      }
      setStep('upload');
    }
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
          className="fixed inset-0 z-[200] bg-[#0a0a0a] flex flex-col font-body text-white overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 flex-shrink-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-md">
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-start text-white transition-transform active:scale-95">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-display font-semibold text-lg tracking-wide uppercase">Try this look on you</h1>
            <div className="w-10"></div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 overflow-y-auto relative">
            
            {/* STEP 1: UPLOAD */}
            {step === 'upload' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col p-4 pb-32"
              >
                <div className="text-center mt-2 mb-6">
                  <h2 className="font-display text-3xl font-medium mb-1">✨ See yourself in this outfit</h2>
                  <p className="text-white/50 text-sm tracking-wide">Use a clear front-facing photo</p>
                </div>

                <div className="relative w-full aspect-[3/4] max-h-[55vh] mx-auto rounded-[32px] overflow-hidden border-2 border-dashed border-white/15 bg-white/5 flex flex-col items-center justify-center animate-pulse-soft shadow-inner">
                  {userImage ? (
                    <img src={userImage} alt="Uploaded" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-white/50 pointer-events-none">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shadow-sm">
                        <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold tracking-wide">Upload your photo</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
                
                <div className="mt-8 text-center flex items-center justify-center gap-1.5 text-[11px] font-medium text-white/50 uppercase tracking-widest">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  Your photo is not stored
                </div>
              </motion.div>
            )}

            {/* STEP 2: PROCESSING (Magic Required) */}
            {step === 'processing' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-6 bg-[#0a0a0a] relative overflow-hidden"
              >
                {/* Blur background */}
                {userImage && <img src={userImage} className="absolute inset-0 w-full h-full object-cover opacity-15 blur-[40px] scale-110" alt="" />}

                <div className="w-full max-w-sm aspect-[3/4] rounded-[32px] overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-white/10 to-white/5 animate-pulse"></div>
                  {/* Sweep logic */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose/20 to-transparent animate-[shimmer-slide_2s_infinite]"></div>
                  
                  {userImage && <img src={userImage} className="absolute inset-0 w-full h-full object-cover opacity-40 blur-lg mix-blend-screen" alt="" />}
                  {garmentImage && <img src={garmentImage} className="absolute inset-0 w-full h-full object-contain opacity-70 scale-105" alt="" />}
                  
                  {/* Central Animated Loader */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-spin"></div>
                  </div>
                </div>

                <div className="mt-12 w-full max-w-xs text-center z-10">
                  <motion.p 
                    key={loadingText}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="text-lg font-bold text-white tracking-wide mb-2 h-6"
                  >
                    {loadingText}
                  </motion.p>
                  <p className="text-white/40 text-sm mt-2 mb-4 font-light">This takes 30-60 seconds</p>
                  
                  {/* Fake Progress Illusion */}
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose to-[#ff4d6d] animate-progress-bar rounded-full"></div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: RESULT REVEAL (Apple-Level) */}
            {step === 'result' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-[100svh] w-full flex flex-col absolute inset-0 bg-black z-50 pb-[calc(100px+env(safe-area-inset-bottom))]"
              >
                {/* Result Header Overlay */}
                <div className="absolute top-0 w-full px-4 pt-4 flex justify-between items-start z-10">
                   <button onClick={onClose} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-transform active:scale-95 shadow-sm">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.2 }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-white text-[10px] uppercase font-bold tracking-widest">AI Fit Score: 92% match</span>
                  </motion.div>
                </div>

                {/* View Image Focus Box */}
                <motion.div 
                  initial={{ filter: "blur(25px)", scale: 1.08, opacity: 0 }}
                  animate={{ filter: "blur(0px)", scale: 1, opacity: 1 }}
                  transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full h-full relative"
                >
                  <img src={viewMode === 'ai' ? resultImage : userImage} alt="AI Result" className="w-full h-full object-cover" />
                  
                  {/* Subtle Glow Highlight Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 pointer-events-none"></div>
                  <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(255,255,255,0.05)] pointer-events-none mix-blend-overlay"></div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="absolute bottom-[40px] left-0 w-full text-center px-4"
                  >
                    <h2 className="text-white font-display text-4xl mb-4 drop-shadow-lg leading-tight italic">
                      ✨ This is you <br/><span className="not-italic">in the outfit</span>
                    </h2>
                    
                    {/* Toggle View Control */}
                    <div className="mx-auto bg-white/10 backdrop-blur-lg border border-white/20 rounded-full p-1 w-max flex gap-1 shadow-lg">
                      <button 
                        onClick={() => setViewMode('user')}
                        className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-300 ${viewMode === 'user' ? 'bg-white text-black shadow-sm' : 'text-white hover:text-white/80'}`}
                      >
                        Your Photo
                      </button>
                      <button 
                         onClick={() => setViewMode('ai')}
                         className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-300 ${viewMode === 'ai' ? 'bg-white text-black shadow-sm' : 'text-white hover:text-white/80'}`}
                      >
                        AI Look
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Fixed Bottom CTA Area (Hidden in result state as it overlays its own buttons) */}
          <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 px-4 py-4 pb-[calc(16px+env(safe-area-inset-bottom))] z-[300]">
            {step === 'upload' && (
              <button 
                onClick={generateLook}
                disabled={!userImage}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-rose to-[#ff4d6d] text-white font-bold text-sm tracking-widest uppercase transition-transform active:scale-[0.96] disabled:opacity-50 shadow-[0_8px_20px_rgba(232,57,90,0.25)] relative overflow-hidden group"
              >
                {!userImage ? "✨ Generate My Look" : (
                  <>
                    <div className="absolute inset-0 bg-white/20 -translate-x-[150%] skew-x-12 group-hover:animate-shimmer-slide"></div>
                    <span>✨ Generate My Look</span>
                  </>
                )}
              </button>
            )}
            
            {step === 'processing' && (
               <button disabled className="w-full h-14 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 text-white/50 font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 cursor-wait">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing...
              </button>
            )}

            {step === 'result' && (
              <div className="flex gap-3">
                <button 
                  onClick={() => { setStep('upload'); setUserImage(null); }}
                  className="flex-1 h-14 rounded-2xl border border-white/30 bg-black text-white font-bold text-[11px] tracking-widest uppercase transition-transform active:scale-[0.96] shadow-sm"
                >
                  Try Another
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const imageUrl = resultImage;
                      if (/Mobi|Android/i.test(navigator.userAgent)) {
                        window.open(imageUrl, '_blank');
                        return;
                      }
                      const link = document.createElement('a');
                      link.href = imageUrl;
                      link.download = `metashop-tryon-${Date.now()}.jpg`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success("Saved to your device!");
                    } catch (err) {
                      console.error('Save failed:', err);
                      toast.error('Could not save image. Please screenshot manually.');
                    }
                  }}
                  className="flex-1 h-14 rounded-2xl bg-white text-black font-bold text-[11px] tracking-widest uppercase transition-transform active:scale-[0.96] shadow-[0_8px_30px_rgba(255,255,255,0.15)] hover:-translate-y-0.5"
                >
                  Save Image
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
