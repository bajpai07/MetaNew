import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function TryOnExperience({ isOpen, onClose, garmentImage }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'processing' | 'result'
  const [userImage, setUserImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const fileInputRef = useRef(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setUserImage(null);
      setResultImage(null);
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

  const handleGenerate = async () => {
    if (!userImage) return toast.error("Please upload a photo first");
    
    setStep('processing');

    try {
      // Convert base64 to Blob for multipart upload
      const fetched = await fetch(userImage);
      const blob = await fetched.blob();
      
      const formData = new FormData();
      formData.append('humanImage', blob, 'user_image.jpg');
      formData.append('garmentImageUrl', garmentImage);

      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/tryon`, 
      formData, 
      { 
        timeout: 180000, // 3 minutes timeout for heavy API queue
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.resultUrl) {
        setResultImage(res.data.resultUrl);
        setStep('result');
      } else {
        toast.error("Generation failed. No image returned.");
        setStep('upload');
      }
    } catch (err) {
      console.error("Frontend API Error:", err);
      toast.error(err.response?.data?.error || "AI generation failed.");
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
            <h1 className="text-[13px] tracking-[0.2em] uppercase font-semibold">Virtual Try-On</h1>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 overflow-y-auto relative">
            
            {/* STEP 1: UPLOAD */}
            {step === 'upload' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col p-4 pb-[150px]"
              >
                <div className="text-center mt-2 mb-6">
                  <h2 className="text-2xl font-light">See yourself in this</h2>
                  <p className="text-white/50 text-sm mt-1">Clear front-facing photos work best</p>
                </div>

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
                
                {userImage && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-0 left-0 w-full px-4 py-6 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 z-[300] flex flex-col gap-3"
                  >
                    <button 
                      onClick={handleGenerate}
                      className="w-full bg-gradient-to-r from-[#E8395A] to-[#c42d4a] text-white font-medium py-4 rounded-xl text-sm shadow-[0_4px_20px_rgba(232,57,90,0.4)] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                    >
                      Generate AI Look ✨
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 2: LOADING */}
            {step === 'processing' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-6 bg-[#0a0a0a]"
              >
                <div className="w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden relative shadow-2xl border border-white/10">
                  <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
                  {userImage && <img src={userImage} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen blur-sm" alt="" />}
                  <div className="absolute top-0 left-0 w-full h-[200%] bg-gradient-to-b from-transparent via-white/10 to-transparent animate-[shimmer-slide_2.5s_infinite]"></div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  </div>
                </div>

                <div className="mt-8 text-center px-4">
                  <p className="text-lg font-medium tracking-wide">Processing your image...</p>
                  <p className="text-white/40 text-[13px] mt-1">This may take 30-60 seconds</p>
                </div>
              </motion.div>
            )}

            {/* STEP 3: RESULT UX */}
            {step === 'result' && resultImage && (
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
                   <img src={resultImage} alt="AI Result" className="w-full h-full object-cover" />
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
