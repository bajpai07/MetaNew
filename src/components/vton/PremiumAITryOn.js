import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { validatePose } from '../../utils/poseValidation';

export default function PremiumAITryOn({ isOpen, onClose, product }) {
  const [userImage, setUserImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result);
        handleGenerate(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload({ target: { files: [e.dataTransfer.files[0]] } });
    }
  };

  const handleGenerate = async (imageToUse) => {
    setIsProcessing(true); setResultImage(null);
    try {
      const validation = await validatePose(imageToUse);
      if (!validation.isValid) {
         toast.error(validation.message); setIsProcessing(false); return;
      }

      // Convert base64 Data URL to Blob
      const fetchResponse = await fetch(imageToUse);
      const blob = await fetchResponse.blob();

      const formData = new FormData();
      formData.append('humanImage', blob, 'human_user.jpg');
      formData.append('garmentImageUrl', product.image);

      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/vton/generate`, 
      formData, 
      { 
        timeout: 180000,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success || res.data.resultUrl) {
        setResultImage(res.data.resultUrl);
        setIsProcessing(false);
      } else {
        toast.error(res.data.error || "Generation failed.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Generation error:", err);
      setIsProcessing(false);
      if (err.code === 'ECONNABORTED') {
        toast.error("Taking too long. AI is warming up — please try again in 30 seconds.");
      } else if (err.response?.status === 500) {
        toast.error(`Server error: ${err.response.data?.error || "Unknown"}`);
      } else {
        toast.error("Generation failed. Check your internet and try again.");
      }
    }
  };

  const currentStep = resultImage ? 'RESULT' : isProcessing ? 'LOADING' : 'UPLOAD';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        key="fullscreen-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "anticipate" }}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-3xl overflow-hidden"
      >
        {/* Absolute Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/20 z-50 group"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:rotate-90 transition-transform duration-300">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="w-full max-w-4xl px-6 py-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            
            {/* UPLOAD SCENE */}
            {currentStep === 'UPLOAD' && (
              <motion.div 
                key="upload-scene"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, filter: "blur(10px)", scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center w-full"
              >
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 text-center"
                >
                  Step into the look.
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-lg text-white/50 font-light mb-12 text-center"
                >
                  Upload a front-facing full-length photo to begin.
                </motion.p>
                
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-xl mx-auto relative group cursor-pointer aspect-[3/4] overflow-hidden rounded-[2.5rem] bg-[#1a1a1a] border-2 border-dashed border-white/20"
                >
                  {userImage ? (
                    <img 
                      src={userImage} 
                      alt="Uploaded photo" 
                      className="w-full h-full object-cover block" 
                      style={{ objectPosition: 'top center' }} 
                    />
                  ) : (
                    <div className={`absolute inset-0 flex flex-col items-center justify-center p-12 transition-all duration-500 pointer-events-none
                      ${isDragActive ? 'bg-white/15 scale-[1.02]' : 'group-hover:bg-white/10'}
                    `}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 text-2xl
                        ${isDragActive ? 'bg-white text-black scale-110' : 'bg-white/10 text-white shadow-sm'}
                      `}>
                        +
                      </div>
                      <span className="text-xl font-medium text-white tracking-wide">
                        {isDragActive ? 'Drop to upload' : 'Upload your photo'}
                      </span>
                      <span className="text-sm text-white/40 mt-2 font-light">
                        Supports high-resolution JPEG & PNG
                      </span>
                    </div>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }} 
                  />
                </motion.div>
              </motion.div>
            )}

            {/* PROCESSING SCENE */}
            {currentStep === 'LOADING' && (
              <motion.div 
                key="loading-scene"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, filter: "blur(10px)" }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center w-full max-w-md mx-auto"
              >
                <div className="w-full aspect-[3/4] rounded-[2rem] overflow-hidden relative shadow-2xl bg-white/5 border border-white/10">
                   <img src={userImage} className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale blur-sm" alt="scanning" />
                   
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite] mix-blend-overlay"></div>
                   
                   <motion.div 
                     animate={{ y: ["0%", "500%"] }} 
                     transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatType: 'reverse' }}
                     className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-blue-500/20 to-blue-400/50 border-b-2 border-blue-400/80 shadow-[0_4px_20px_rgba(96,165,250,0.5)]"
                   />
                </div>
                
                <div className="mt-12 flex flex-col items-center">
                  <div className="w-8 h-8 relative mb-4">
                     <div className="absolute inset-0 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-medium tracking-tight text-white animate-pulse">Generating your realistic look...</h3>
                  <p className="text-white/40 text-sm mt-2 font-light">Analyzing fabric drape and body topography. This takes 30-60 seconds.</p>
                </div>
              </motion.div>
            )}

            {/* RESULT SCENE */}
            {currentStep === 'RESULT' && (
              <motion.div 
                key="result-scene"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
                className="flex flex-col items-center w-full max-w-2xl mx-auto"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20, filter: "blur(20px)" }}
                  animate={{ scale: 1, opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative rounded-[2rem] overflow-hidden bg-black shadow-[0_0_100px_rgba(255,255,255,0.1)] w-full max-w-[400px] aspect-[3/4] group"
                >
                  <img 
                    src={resultImage} 
                    alt="AI Styled Result" 
                    className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-105"
                  />

                  {/* Glass Product Reference */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="absolute bottom-6 left-6 right-6 bg-black/40 backdrop-blur-3xl rounded-2xl p-4 flex items-center gap-4 border border-white/10"
                  >
                    <img src={product.image} alt={product.name} className="w-14 h-14 rounded-xl object-cover shadow-lg" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[11px] text-white/60 font-medium tracking-[0.2em] uppercase leading-tight mb-1">{product.brand || 'Studio'}</span>
                      <span className="text-base font-semibold text-white truncate leading-tight">{product.name}</span>
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="flex flex-col sm:flex-row gap-4 mt-12 w-full max-w-[400px]"
                >
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
                        } catch (err) {
                          console.error('Save failed:', err);
                          toast.error('Could not save image. Please screenshot manually.');
                        }
                     }}
                     className="flex-1 py-4 bg-white text-black rounded-full font-bold text-[15px] tracking-wide hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                   >
                     Save Photo
                   </button>
                   <button 
                     onClick={() => { setUserImage(null); setResultImage(null); setIsProcessing(false); }}
                     className="flex-1 py-4 bg-white/10 text-white rounded-full font-bold text-[15px] tracking-wide hover:bg-white/20 active:scale-95 transition-all border border-white/10 backdrop-blur-md"
                   >
                     Try Again
                   </button>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
