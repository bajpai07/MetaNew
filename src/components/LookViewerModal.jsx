import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const LookViewerModal = ({ look, onClose, onDownload }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleShare = async () => {
    const imageUrl = look.resultUrl || look.productImage;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My AI Outfit",
          text: "Check out this outfit on me!",
          url: imageUrl,
        });
      } catch (err) {
        console.log("Share failed or was cancelled", err);
      }
    } else {
      navigator.clipboard.writeText(imageUrl);
      alert("Link copied to clipboard!");
    }
  };

  const handleTryAgain = () => {
    onClose();
    if (look.productId) {
      navigate(`/products/${look.productId}`, {
        state: { openAITab: true, garmentImage: look.productImage }
      });
    } else {
      navigate('/try-on', {
        state: { garment: look.productImage }
      });
    }
  };

  const imageUrl = look.resultUrl || look.productImage;
  const timeSaved = new Date(look.createdAt).toLocaleString(undefined, { 
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col sm:p-4"
      >
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-4 py-4 pt-8 shrink-0">
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full active:scale-95 transition-transform"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-display tracking-[0.2em] font-medium text-sm text-[#fafaf8]">YOUR LOOK</span>
          <div className="w-10 h-10"></div> {/* Spacer for centering */}
        </div>

        {/* MAIN VIEWER */}
        <div className="flex-1 overflow-hidden relative flex flex-col justify-center items-center px-4">
          {loading && (
            <div className="absolute inset-4 rounded-2xl bg-white/5 animate-pulse" />
          )}
          <img 
            src={imageUrl} 
            alt="Saved AI Look"
            onLoad={() => setLoading(false)}
            className={`w-full max-h-[70vh] object-contain rounded-[16px] transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
          />
          
          {/* INFO SECTION */}
          <div className="w-full flex justify-between items-end absolute bottom-4 px-4 drop-shadow-md">
            {look.fitScore && (
              <div className="px-3 py-1.5 bg-[#4ade80]/20 backdrop-blur-md rounded-full border border-[#4ade80]/40 flex items-center gap-1">
                <span className="text-[#4ade80] text-xs">★</span> 
                <span className="text-[#4ade80] font-bold text-xs tracking-wider uppercase">{look.fitScore}% FIT</span>
              </div>
            )}
            <div className="text-[10px] tracking-widest uppercase text-white/60 bg-black/40 px-2 py-1 rounded backdrop-blur-md">
              Saved {timeSaved}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTIONS */}
        <div 
          className="shrink-0 p-4 pb-[env(safe-area-inset-bottom)] flex items-center justify-between gap-3 bg-[#0a0a0a]"
        >
          <button 
            onClick={() => onDownload(imageUrl)}
            className="flex-1 min-h-[48px] bg-white/10 active:bg-white/20 rounded-[12px] flex items-center justify-center gap-2 transition-colors border border-white/5"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="text-xs font-bold tracking-widest uppercase text-white">Save Look</span>
          </button>

          <button 
            onClick={handleShare}
            className="w-[48px] min-h-[48px] bg-white/10 active:bg-white/20 rounded-[12px] flex items-center justify-center transition-colors border border-white/5 shrink-0"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          </button>

          <button 
            onClick={handleTryAgain}
            className="flex-1 min-h-[48px] bg-[#E8395A] active:bg-[#c42d4a] rounded-[12px] flex items-center justify-center gap-2 transition-colors font-bold tracking-widest uppercase text-xs"
          >
            Try Another Look
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LookViewerModal;
