import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { validatePose } from '../../utils/poseValidation';
import UploadZone from './UploadZone';
import ResultViewer from './ResultViewer';
import { submitTryOn, pollJobStatus, getResultImageUrl } from '../../services/tryOnApi';

export default function TryOnExperience({ isOpen, onClose, product }) {
  const [userImage, setUserImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [loadingText, setLoadingText] = useState("Generating your realistic look...");
  const { addToCart } = useCart();

  useEffect(() => {
    let interval;
    if (isProcessing) {
      const texts = [
        "Generating your realistic look...",
        "Adjusting fit, lighting & fabric...",
        "Mapping 3D topography...",
        "Enhancing realism..."
      ];
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % texts.length;
        setLoadingText(texts[i]);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Lock body scroll when fullscreen open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const handleGenerate = async (imageToUse) => {
    setUserImage(imageToUse);
    setIsProcessing(true); setResultImage(null);
    try {
      const validation = await validatePose(imageToUse);
      if (!validation.isValid) {
         toast.error(validation.message); setIsProcessing(false); return;
      }

      const { job_id } = await submitTryOn(imageToUse, product.image);
      await pollJobStatus(job_id);
      
      setResultImage(getResultImageUrl(job_id));
      setIsProcessing(false);
      
    } catch (error) {
      console.error(error); setIsProcessing(false);
      toast.error(error.message || "Network interface offline.");
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `preview-${product?.name?.replace(/\s+/g, '-').toLowerCase() || 'look'}.jpg`;
    link.click();
  };

  const currentStep = resultImage ? 'RESULT' : isProcessing ? 'LOADING' : 'UPLOAD';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        key="experience-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-3xl overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-14 h-14 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/10 z-50 group hover:scale-105 active:scale-95"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:rotate-90 transition-transform duration-500 ease-[0.16_1_0.3_1]">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="w-full h-full p-4 md:p-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            
            {currentStep === 'UPLOAD' && (
              <UploadZone key="upload" onImageSelect={handleGenerate} />
            )}

            {currentStep === 'LOADING' && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, filter: "blur(15px)", scale: 0.9 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
                className="flex flex-col items-center w-full max-w-md mx-auto"
              >
                <div className="w-full aspect-[3/4] rounded-[2rem] overflow-hidden relative shadow-2xl bg-white/5 border border-white/10">
                   <img src={userImage} className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale blur-md mix-blend-luminosity" alt="scanning" />
                   
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-white/10 to-transparent animate-pulse"></div>
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite] mix-blend-overlay"></div>
                   
                   <motion.div 
                     animate={{ y: ["0%", "500%"] }} 
                     transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatType: 'reverse' }}
                     className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-white/20 to-white/40 border-b border-white/50"
                   />
                </div>
                
                <div className="mt-12 flex flex-col items-center min-h-[80px]">
                  <motion.h3 
                    key={loadingText}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="text-xl font-medium tracking-wide text-white"
                  >
                    {loadingText}
                  </motion.h3>
                  
                  {/* Fake subtle progress animation */}
                  <div className="w-48 h-1 bg-white/10 rounded-full mt-6 overflow-hidden relative">
                     <motion.div 
                       initial={{ width: "0%" }}
                       animate={{ width: "100%" }}
                       transition={{ duration: 15, ease: "circOut" }}
                       className="absolute top-0 left-0 h-full bg-white rounded-full"
                     />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'RESULT' && (
              <ResultViewer 
                key="result"
                resultImage={resultImage}
                product={product}
                onDownload={handleDownload}
                onTryAnother={() => { setUserImage(null); setResultImage(null); setIsProcessing(false); }}
                onAddToCart={async () => {
                   await toast.promise(addToCart(product._id), {
                     loading: 'Adding...', success: 'Added to bag', error: 'Failed'
                   }, { style: { background: '#111', color: '#fff' }});
                }}
              />
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
