import React, { useRef, useEffect, useState } from "react";
import "@google/model-viewer";
import useVTONTracking from "../../hooks/useVTONTracking";

export default function VirtualTryOn({ modelUrl = "/assets/models/dress.glb", category = "top", onClose }) {
  const videoRef = useRef(null);
  const occlusionCanvasRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  // Consume custom Production VTON Hook
  const { 
    targetX, targetY, scaleOffset, rotationY, visibilityOpacity, isCalibrating, error: trackingError, 
    setTargetX, setTargetY, setScaleOffset 
  } = useVTONTracking(videoRef, occlusionCanvasRef);

  // Sync tracking errors with local UI state
  useEffect(() => {
    if (trackingError) setCameraError(trackingError);
  }, [trackingError]);

  // Handle DOM Resizing to keep alignments perfectly synced
  useEffect(() => {
    const handleResize = () => {
      if (videoRef.current && occlusionCanvasRef.current) {
        // Force synchronous layout alignment if window changes
        occlusionCanvasRef.current.style.width = `${window.innerWidth}px`;
        occlusionCanvasRef.current.style.height = `${window.innerHeight}px`;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const touchState = useRef({ isDragging: false, lastX: 0, lastY: 0 });

  const handlePointerDown = (e) => {
    touchState.current.isDragging = true;
    touchState.current.lastX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    touchState.current.lastY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
  };

  const handlePointerMove = (e) => {
    if (!touchState.current.isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (clientX !== undefined && clientY !== undefined) {
      const dx = clientX - touchState.current.lastX;
      const dy = clientY - touchState.current.lastY;
      
      setDragOffset(prev => ({
        x: prev.x + (dx * 0.025), // Multiplier for 1:1 feel on drag
        y: prev.y - (dy * 0.025)
      }));
      
      touchState.current.lastX = clientX;
      touchState.current.lastY = clientY;
    }
  };

  const handlePointerUp = () => {
    touchState.current.isDragging = false;
  };

  const handleResetFit = () => {
    setScaleOffset(300.0);
    setTargetX(window.innerWidth / 2);
    setTargetY(window.innerHeight / 2);
  };

  const handleCapture = async () => {
    try {
      // Hide UI
      setIsCapturing(true);

      // Wait 1 frame so React can hide the UI before capture
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas2d = document.createElement("canvas");
      canvas2d.width = videoRef.current.videoWidth || 1280;
      canvas2d.height = videoRef.current.videoHeight || 720;
      const ctx = canvas2d.getContext("2d");

      // Draw Webcam Feed (Mirrored)
      ctx.translate(canvas2d.width, 0);
      ctx.scale(-1, 1);
        // The 3D model is now layered underneath the occlusion canvas, so we must grab both
        // First the base video (background)
        ctx.drawImage(videoRef.current, 0, 0, canvas2d.width, canvas2d.height);
        
        // Second the model (middle layer)
        const modelViewerTag = document.querySelector('model-viewer');
        if (modelViewerTag) {
           const blob = await modelViewerTag.toBlob({ idealAspect: true });
           const img = new Image();
           img.src = URL.createObjectURL(blob);
           await new Promise(r => img.onload = r);
           ctx.setTransform(1, 0, 0, 1, 0, 0); // Don't mirror model
           ctx.drawImage(img, 0, 0, canvas2d.width, canvas2d.height);
        }
        
        // Third the masked body (top layer)
        if (occlusionCanvasRef.current) {
           ctx.drawImage(occlusionCanvasRef.current, 0, 0, canvas2d.width, canvas2d.height);
        }

      const dataUrl = canvas2d.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "My_MetaShop_Look.png";
      a.click();
    } catch (err) {
      console.error("Capture Failed:", err);
    } finally {
      // Show UI again
      setIsCapturing(false);
    }
  };

  const handleModelLoad = (event) => {
    const modelViewer = event.target;
    if (modelViewer && modelViewer.model && modelViewer.model.materials) {
      modelViewer.model.materials.forEach(material => {
        if (material.pbrMetallicRoughness) {
          // Tune to look like cotton fabric (high roughness, low metalness)
          material.pbrMetallicRoughness.setRoughnessFactor(0.9);
          material.pbrMetallicRoughness.setMetallicFactor(0.1);
        }
      });
    }
  };



  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#000', zIndex: 9999, overflow: 'hidden' }}>
      
      {/* Loading Overlay */}
      {isCalibrating && !cameraError && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, color: '#fff', backdropFilter: 'blur(10px)'
        }}>
           <div style={{ width: '50px', height: '50px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid #FF3F6C', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
           <style>{"@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }"}</style>
           <h2 style={{ marginTop: '20px', letterSpacing: '2px', fontWeight: 'bold' }}>CALIBRATING AI...</h2>
           <p style={{ color: '#aaa', marginTop: '10px' }}>Analyzing body keypoints and ambient lighting</p>
        </div>
      )}
      {/* Video Background Layer */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1,
          transform: 'scaleX(-1)'
        }}
      />

      {/* AR Canvas Overlay Layer */}
      <div 
        style={{
          position: 'absolute',
          top: `${targetY}px`,
          left: `${targetX}px`,
          width: `${scaleOffset}px`,
          height: `${scaleOffset * 1.5}px`, // maintain aspect roughly 1:1.5 for shirt
          transform: 'translate(-50%, 0)', // center horizontally, anchor top to collar
          zIndex: 10, // Ensure higher z-index than video
          opacity: visibilityOpacity, // Dynamically fade out when side-on
          transition: 'opacity 0.3s ease-out', // Smooth fade effect
          display: 'block !important',
          pointerEvents: 'none', // Z-Index Fix: User requested pointer-events: none
      }}>
          <model-viewer
          src={modelUrl || "/assets/models/dress.glb"}
          camera-orbit={`${rotationY}rad 75deg 105%`}
          shadow-intensity="1.5"
          shadow-softness="1"
          exposure="0.8"
          environment-image="neutral"
          field-of-view="45deg"
          onLoad={handleModelLoad}
          alt="Virtual Try-On 3D Model"
          style={{
             width: '100%',
             height: '100%',
             background: 'transparent',
             visibility: 'visible',
             opacity: 1,
             display: 'block !important',
             pointerEvents: 'none'
          }}
        />
      </div>

      {/* Top Layer: Occlusion Mask (Person's body cut out and layered over the shirt) */}
      <canvas
         ref={occlusionCanvasRef}
         width={1280}
         height={720}
         style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none', // Must pass clicks down to the model viewer
            zIndex: 3
         }}
      />

      {/* UI Overlay Layer - hidden during capture */}
      {!isCapturing && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 4, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 20, left: 20, pointerEvents: 'auto', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button 
              onClick={onClose}
              style={{ padding: '10px 20px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
            >
              ← Back to Product
            </button>
            <div style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '10px 15px', borderRadius: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>✨ Premium AR Try-On</h3>
            </div>
          </div>

        <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '20px', background: 'rgba(0,0,0,0.6)', padding: '15px 30px', borderRadius: '30px', pointerEvents: 'auto', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={() => setScaleOffset(prev => Math.max(50, prev - 20.0))} 
                style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', background: '#fff', color: '#000', cursor: 'pointer', fontWeight: 'bold' }}>
                -
              </button>
              <span style={{ color: 'white', fontSize: '14px', width: '50px', textAlign: 'center', fontWeight: 'bold' }}>Scale</span>
              <button 
                onClick={() => setScaleOffset(prev => prev + 20.0)} 
                style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', background: '#fff', color: '#000', cursor: 'pointer', fontWeight: 'bold' }}>
                +
              </button>
           </div>
           <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.3)' }} />
           
           {/* 4-Way D-Pad Move Controls */}
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <button 
                onClick={() => setTargetY(y => y - 10)} 
                style={{ padding: '4px 15px', borderRadius: '4px', border: 'none', background: '#ffe4e1', color: '#000', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>↑</button>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                 <button 
                   onClick={() => setTargetX(x => x - 10)} 
                   style={{ padding: '8px 12px', borderRadius: '4px', border: 'none', background: '#ffe4e1', color: '#000', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>←</button>
                 <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Move</span>
                 <button 
                   onClick={() => setTargetX(x => x + 10)} 
                   style={{ padding: '8px 12px', borderRadius: '4px', border: 'none', background: '#ffe4e1', color: '#000', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>→</button>
              </div>
              <button 
                onClick={() => setTargetY(y => y + 10)} 
                style={{ padding: '4px 15px', borderRadius: '4px', border: 'none', background: '#ffe4e1', color: '#000', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>↓</button>
           </div>
        </div>

        <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={handleResetFit}
            style={{ padding: '10px 20px', background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(5px)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', cursor: 'pointer', pointerEvents: 'auto', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
          >
            <span style={{ fontSize: '18px' }}>🔄</span> Reset Fit
          </button>
          
          <button 
            onClick={handleCapture}
            style={{ padding: '12px 24px', background: '#FF3F6C', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', pointerEvents: 'auto', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(255,63,108,0.4)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
          >
            <span style={{ fontSize: '20px' }}>📸</span> Capture
          </button>
        </div>
        {cameraError && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', pointerEvents: 'auto' }}>
            <h3>⚠️ Camera Error</h3>
            <p>{cameraError}</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}