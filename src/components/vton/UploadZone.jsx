import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function UploadZone({ onImageSelect }) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => onImageSelect(reader.result);
      reader.readAsDataURL(file);
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
      className="flex flex-col items-center w-full"
    >
      <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 text-center">
        Step into the look.
      </h2>
      <p className="text-lg text-white/50 font-light mb-12 text-center">
        Upload your photo to see how it looks on you
      </p>
      
      <div 
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        className="w-full max-w-xl mx-auto relative group cursor-pointer"
      >
        <div className={`absolute inset-0 rounded-[2rem] border-2 border-dashed transition-all duration-500 pointer-events-none flex flex-col items-center justify-center p-12
          ${isDragActive ? 'bg-white/10 border-white scale-[1.02]' : 'bg-white/5 border-white/20 group-hover:bg-white/10 group-hover:border-white/40'}
        `}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-2xl transition-all duration-500
            ${isDragActive ? 'bg-white text-black scale-110' : 'bg-white/10 text-white backdrop-blur-md'}
          `}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <span className="text-xl font-medium text-white tracking-wide">
            {isDragActive ? 'Drop to upload' : 'Drag & Drop upload'}
          </span>
          <span className="text-sm text-white/40 mt-2 font-light">
            Accepts only image files (JPEG, PNG)
          </span>
        </div>
        <input type="file" accept="image/*" onChange={handleChange} className="w-full h-[320px] opacity-0 cursor-pointer" />
      </div>
    </motion.div>
  );
}
