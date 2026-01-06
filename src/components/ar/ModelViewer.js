// src/components/ar/ModelViewer.js
import "@google/model-viewer";

export default function ModelViewer({ modelUrl }) {
  if (!modelUrl) return <p>No 3D model available</p>;

  return (
    <model-viewer
      src={modelUrl}
      ar
      ar-modes="scene-viewer webxr quick-look"
      camera-controls
      auto-rotate
      style={{ width: "100%", height: "400px" }}
      poster="/poster.png"
      shadow-intensity="1"
    >
    </model-viewer>
  );
}
