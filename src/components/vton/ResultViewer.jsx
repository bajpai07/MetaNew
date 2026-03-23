import React from 'react';
import { motion } from 'framer-motion';

export default function ResultViewer({ resultImage, product, onDownload, onTryAnother, onAddToCart }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center w-full max-w-5xl mx-auto h-full justify-center px-4"
    >
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full">
        {/* Left: The Result Image */}
        <motion.div
           initial={{ scale: 0.9, opacity: 0, filter: "blur(20px)" }}
           animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
           transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
           className="relative rounded-[2rem] overflow-hidden bg-black shadow-[0_0_80px_rgba(255,255,255,0.05)] w-full max-w-[420px] aspect-[3/4] group flex-shrink-0 border border-white/10"
        >
          <img 
            src={resultImage} 
            alt="AI Styled Result" 
            className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-[1.03]"
          />
        </motion.div>

        {/* Right: The Info & Actions */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col w-full max-w-sm"
        >
          <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 mb-8 shadow-2xl flex items-center gap-4">
             <img src={product.image} className="w-16 h-16 rounded-xl object-cover" alt="product" />
             <div className="flex flex-col">
               <span className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">{product.brand || 'STUDIO'}</span>
               <span className="text-lg font-semibold text-white leading-tight">{product.name}</span>
             </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <button 
              onClick={onAddToCart}
              className="w-full py-4 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-[15px] tracking-wide transition-all shadow-xl hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Add to Bag
            </button>
            <button 
              onClick={onDownload}
              className="w-full py-4 bg-transparent border border-white/30 text-white hover:bg-white/10 rounded-full font-bold text-[15px] tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Download Image
            </button>
            <button 
              onClick={onTryAnother}
              className="w-full py-4 mt-2 text-white/60 hover:text-white text-sm font-medium tracking-wide transition-colors"
            >
              Try another photo
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
