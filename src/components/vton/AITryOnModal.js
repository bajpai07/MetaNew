import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReactCompareImage from 'react-compare-image';
import { validatePose } from '../../utils/poseValidation';

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
    setLoadingMessage("Checking pose visibility...");

    try {
      // 1. Validate the pose using AI
      const validation = await validatePose(userImage);
      if (!validation.isValid) {
         toast.error(validation.message);
         setIsProcessing(false);
         return;
      }
      setLoadingMessage("AI is analyzing your photo...");

      // 2. Kick off prediction
      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/vton/generate`, {
        human_image: userImage,
        garment_image: garmentImage,
        garment_des: garmentDescription || "photorealistic clothing",
        product_category: garmentCategory,
        product_name: garmentName,
        faceBox: validation.faceBox
      }, { timeout: 120000 });

      if (res.data.status === "202_WARMING_UP") {
        toast.loading(res.data.message || "AI Engine is warming up. Please try again shortly.");
        setIsProcessing(false);
        return;
      }

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
    <div className={`ai-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => { if (e.target.className.includes('ai-overlay')) onClose(); }}>
      <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-handle" onClick={onClose}></div>
        <div className="ai-modal-inner">
          <div className="ai-modal-header">
            <div className="ai-modal-eyebrow">PREMIUM AI TRY-ON</div>
            <h2 className="ai-modal-title">See yourself in<br/><em>this outfit.</em></h2>
            <p className="ai-modal-sub">Upload your photo. AI drapes the garment with photorealistic precision.</p>
          </div>

          <div className="ai-panels">
            <label htmlFor="photoInput" style={{display:'block', cursor:'pointer'}}>
              <div className={`ai-upload ${userImage ? 'has-photo' : ''}`} id="uploadZone">
                <span className="upload-panel-label">YOUR PHOTO</span>
                <div className="upload-icon-wrap">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
                </div>
                <p className="upload-hint"><b>Tap to upload</b><br/>your photo</p>
                <img className="upload-preview" id="uploadPrev" src={userImage || ""} alt="User" />
              </div>
            </label>
            <input type="file" id="photoInput" accept="image/*" onChange={handleFileUpload} style={{display:'none'}} />

            <div className="ai-mid-col">
              <div className="ai-mid-line"></div>
              <button 
                className={`ai-gen-btn ${isProcessing ? 'spinning' : ''}`} 
                id="genBtn" 
                onClick={handleGenerate}
                disabled={!userImage || isProcessing}
              >
                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </button>
              <div className="ai-mid-line"></div>
            </div>

            <div className={`ai-result ${isProcessing ? 'scanning' : ''} ${resultImage ? 'done glowing' : ''}`} id="resultZone">
              <span className="result-panel-label">AI RESULT</span>
              <p className="result-placeholder">Your HD try-on result appears here</p>
              <img className="result-img" id="resultImg" src={resultImage || ""} alt="AI Result" />
              
              {resultImage && (
                <div style={{ position: 'absolute', bottom: '15px', display: 'flex', gap: '8px', zIndex: 10 }}>
                  <button onClick={() => {
                        const link = document.createElement('a');
                        link.href = resultImage;
                        link.download = 'metashop-tryon.jpg';
                        link.click();
                      }}
                      style={{ padding: '8px 15px', background: 'rgba(0,0,0,0.85)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '10px', letterSpacing: '0.1em', cursor: 'pointer', backdropFilter: 'blur(5px)' }}
                  >
                    ⬇️ DOWNLOAD
                  </button>
                  <button 
                      onClick={() => toast.success("Ready for studio review!")}
                      style={{ padding: '8px 15px', background: 'var(--rose)', color: 'white', border: 'none', borderRadius: '20px', fontSize: '10px', letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 4px 10px rgba(232,57,90,0.3)' }}
                  >
                    ↗️ SHARE
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="ai-stats">
            <div className="ai-stat">
              <span className="stat-n">2s</span>
              <span className="stat-l">Generation</span>
            </div>
            <div className="ai-stat">
              <span className="stat-n">HD</span>
              <span className="stat-l">Photorealistic</span>
            </div>
            <div className="ai-stat">
              <span className="stat-n">1st</span>
              <span className="stat-l">India First</span>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  resultArea: { flex: 1, border: '1px dashed #ccc', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fdfdfd', overflow: 'hidden', minHeight: '370px', position: 'relative' },
  placeholderBox: { textAlign: 'center', padding: '30px' },
  placeholderText: { color: '#aaa', fontSize: '14px', lineHeight: '1.5' },
  qualityChecklist: { padding: '12px', background: '#f8f8f8', borderRadius: '8px', fontSize: '12px', width: '100%', textAlign: 'left', border: '1px solid #eaeaea' },
  checklistTitle: { fontWeight: '700', marginBottom: '8px', color: '#333' },
  checkItem: { marginBottom: '5px', color: '#555', display: 'flex', justifyContent: 'space-between' },
  fullFrameWrapper: { width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' },
  resultActions: { position: 'absolute', bottom: '15px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '10px', padding: '0 10px' },
  downloadBtn: { padding: '8px 15px', background: '#fff', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  shareBtn: { padding: '8px 15px', background: '#FF3F6C', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(255,63,108,0.3)' }
};

// Add spinner keyframes globally if not exists
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}
