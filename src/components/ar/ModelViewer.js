// src/components/ar/ModelViewer.js
import "@google/model-viewer";

import React, { useEffect, useRef } from "react";
import "@google/model-viewer";

export default function ModelViewer({ modelUrl }) {
  const viewerRef = useRef(null);

  // Fallback to Astronaut model for debugging rendering if local fails
  const finalModelUrl = modelUrl && modelUrl !== "/assets/models/dress.glb" 
    ? modelUrl 
    : "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

  useEffect(() => {
    const viewer = viewerRef.current;
    if (viewer) {
      const handleLoad = () => console.log("🚀 model-viewer: Model Loaded Successfully", finalModelUrl);
      const handleError = (e) => console.error("❌ model-viewer: Failed to load model", finalModelUrl, e);
      
      viewer.addEventListener('load', handleLoad);
      viewer.addEventListener('error', handleError);

      return () => {
        viewer.removeEventListener('load', handleLoad);
        viewer.removeEventListener('error', handleError);
      };
    }
  }, [finalModelUrl]);
  if (!modelUrl) return <p>No 3D model available</p>;

  return (
    <model-viewer
      ref={viewerRef}
      src={finalModelUrl}
      ar
      ar-modes="scene-viewer webxr quick-look"
      camera-controls
      auto-rotate
      camera-orbit="auto auto auto"
      min-camera-orbit="auto auto auto"
      bounds="tight"
      scale="0.1 0.1 0.1"
      camera-target="0m 1m 0m"
      environment-image="neutral"
      exposure="0.7"
      shadow-intensity="1"
      shadow-softness="1"
      style={{ width: "100%", height: "400px", filter: "blur(0.5px)", zIndex: 10, opacity: 1, backgroundColor: "transparent" }}
      poster="/poster.png"
    >
    </model-viewer>
  );
}
