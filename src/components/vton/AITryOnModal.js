import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReactCompareImage from 'react-compare-image';

export default function AITryOnModal({ isOpen, onClose, garmentImage, garmentDescription, garmentCategory, garmentName }) {
  const [userImage, setUserImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [resultImage, setResultImage] = useState(null);

  const loadingMessages = [
    "AI is analyzing your photo...",
    "Weaving the digital fabric...",
    "Adjusting the perfect fit...",
    "Enhancing photorealism...",
    "Almost ready..."
  ];

  // Rotate loading messages
  useEffect(() => {
    let interval;
    if (isProcessing) {
      let i = 0;
      setLoadingMessage(loadingMessages[0]);
      interval = setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[i]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);



  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUserImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!userImage) {
      toast.error("Please provide a photo first.");
      return;
    }

    setIsProcessing(true);
    setResultImage(null);

    try {
      // 1. Kick off prediction
      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/vton/generate`, {
        human_image: userImage,
        garment_image: garmentImage,
        garment_des: garmentDescription || "photorealistic clothing",
        product_category: garmentCategory,
        product_name: garmentName
      }, { timeout: 120000 });

      const { predictionId } = res.data;

      // 2. Poll for results
      let isDone = false;
      while (!isDone) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // poll every 3 seconds
        const checkRes = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/vton/status/${predictionId}`, { timeout: 120000 });
        const status = checkRes.data.status;
        
        if (status === 'succeeded') {
          const finalImageUrl = checkRes.data.output[0];
          console.log('Final Result URL:', finalImageUrl);
          setResultImage(finalImageUrl); // Replicate output is usually an array of URLs
          isDone = true;
          setIsProcessing(false);
          toast.success("Try-On successful!");
        } else if (status === 'failed' || status === 'canceled') {
          isDone = true;
          setIsProcessing(false);
          toast.error(checkRes.data.error || "AI Generation failed. Please try again.");
          console.error(checkRes.data.error);
        }
      }

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      toast.error(error.response?.data?.message || "Failed to connect to AI server");
    }
  };

  const resetFlow = () => {
    setUserImage(null);
    setResultImage(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.overlay}
      >
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <button style={styles.closeBtn} onClick={() => { onClose(); }}>×</button>
          
          <h2 style={styles.title}>✨ Premium AI Try-On</h2>
          <p style={styles.subtitle}>Let AI weave the perfect fit with photorealistic precision.</p>

          <div style={styles.content}>
            {/* LEFT COLUMN: Input */}
            <div style={styles.column}>
              <h3 style={styles.colTitle}>Your Photo</h3>
              {!userImage ? (
                <div style={styles.inputArea}>
                  <div style={styles.uploadBox}>
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={styles.fileInput} id="vton-upload" />
                    <label htmlFor="vton-upload" style={styles.uploadLabel}>
                      <div style={{ marginBottom: '10px' }}>Click or drag to upload a clear photo of yourself looking forward.</div>
                      <div style={styles.fidelityTip}>✨ <strong>Fidelity Tip:</strong> For model-level accuracy, upload a high-resolution photo.</div>
                    </label>
                  </div>
                </div>
              ) : (
                <div style={styles.imagePreview}>
                  <img src={userImage} alt="User" style={styles.image} />
                  {!isProcessing && !resultImage && (
                    <button onClick={resetFlow} style={styles.textBtn}>Try another photo</button>
                  )}
                </div>
              )}
            </div>

            {/* MIDDLE: Generate Action */}
            <div style={styles.actionColumn}>
              {resultImage ? (
                <div style={styles.successArrow}>➡️</div>
              ) : isProcessing ? (
                <div style={styles.loaderBox}>
                  <div style={styles.spinner}></div>
                  <p style={styles.loadingText}>{loadingMessage}</p>
                </div>
              ) : (
                <button 
                  onClick={handleGenerate} 
                  disabled={!userImage}
                  style={userImage ? styles.generateBtn : styles.generateBtnDisabled}
                >
                  Generate HD Fit ✨
                </button>
              )}
            </div>

            {/* RIGHT COLUMN: Output */}
            <div style={styles.column}>
              <h3 style={styles.colTitle}>AI Result</h3>
              <div style={styles.resultArea}>
                {resultImage ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    style={styles.compareWrapper}
                  >
                    <img 
                      src={resultImage} 
                      alt="AI Try-On Result" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                  </motion.div>
                ) : (
                  <div style={styles.placeholderBox}>
                    <p style={styles.placeholderText}>Your photorealistic result will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center',
    backdropFilter: 'blur(5px)'
  },
  modal: {
    backgroundColor: '#fff', width: '900px', maxWidth: '95vw',
    borderRadius: '16px', padding: '30px', position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden'
  },
  closeBtn: {
    position: 'absolute', top: '15px', right: '20px', fontSize: '28px',
    background: 'transparent', border: 'none', cursor: 'pointer', color: '#666'
  },
  title: {
    fontSize: '24px', fontWeight: '800', margin: '0 0 10px 0',
    background: 'linear-gradient(45deg, #FF3F6C, #FF7B54)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
  },
  subtitle: { color: '#666', marginBottom: '30px', fontSize: '15px' },
  content: { display: 'flex', gap: '20px', alignItems: 'stretch' },
  column: { flex: 1, display: 'flex', flexDirection: 'column' },
  actionColumn: { width: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  colTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#333' },
  inputArea: { flex: 1, border: '1px solid #eaeaea', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  tabs: { display: 'flex', borderBottom: '1px solid #eaeaea' },
  tab: { flex: 1, padding: '12px', background: '#f8f8f8', border: 'none', cursor: 'pointer', color: '#666', fontWeight: '500' },
  activeTab: { flex: 1, padding: '12px', background: '#fff', border: 'none', borderBottom: '2px solid #FF3F6C', color: '#FF3F6C', fontWeight: 'bold', cursor: 'pointer' },
  uploadBox: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '30px', position: 'relative' },
  fileInput: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' },
  uploadLabel: { textAlign: 'center', color: '#888', pointerEvents: 'none', fontSize: '14px', lineHeight: '1.5' },
  webcamBox: { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: '#000' },
  video: { width: '100%', height: '300px', objectFit: 'cover' },
  captureBtn: { position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', padding: '8px 20px', borderRadius: '20px', background: '#FF3F6C', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,63,108,0.4)' },
  imagePreview: { flex: 1, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #eaeaea', padding: '10px' },
  image: { width: '100%', height: '350px', objectFit: 'contain', borderRadius: '8px' },
  compareWrapper: { 
    width: '100%', 
    maxWidth: '350px', 
    aspectRatio: '3/4', 
    margin: '0 auto', 
    borderRadius: '12px', 
    overflow: 'hidden', 
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    display: 'flex'
  },
  textBtn: { marginTop: '10px', background: 'none', border: 'none', color: '#FF3F6C', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  fidelityTip: { background: '#fff0f3', padding: '10px', borderRadius: '6px', color: '#FF3F6C', fontSize: '12px', marginTop: '15px', border: '1px dashed #FF3F6C' },
  generateBtn: { width: '100%', padding: '15px 10px', background: 'linear-gradient(45deg, #FF3F6C, #FF7B54)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,63,108,0.3)', transition: 'transform 0.2s', fontSize: '15px' },
  generateBtnDisabled: { width: '100%', padding: '15px 10px', background: '#e0e0e0', color: '#888', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'not-allowed', fontSize: '15px' },
  loaderBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #FF3F6C', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { fontSize: '12px', color: '#666', textAlign: 'center', fontStyle: 'italic' },
  successArrow: { fontSize: '40px' },
  resultArea: { flex: 1, border: '1px dashed #ccc', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fdfdfd', overflow: 'hidden', minHeight: '370px' },
  placeholderBox: { textAlign: 'center', padding: '30px' },
  placeholderText: { color: '#aaa', fontSize: '14px', lineHeight: '1.5' },
};

// Add spinner keyframes globally if not exists
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}
