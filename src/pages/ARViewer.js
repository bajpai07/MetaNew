// src/pages/ARViewer.js
import { useParams, useNavigate, useLocation } from "react-router-dom";
import VirtualTryOn from "../components/ar/VirtualTryOn";

export default function ARViewer() {
  const { model } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category || "top";
  const modelUrl = location.state?.modelUrl || `/assets/models/${model}.glb`;

  return (
    <div className="ar-viewer-page">
      <VirtualTryOn 
        modelUrl={modelUrl} 
        category={category}
        onClose={() => navigate(-1)} 
      />
    </div>
  );
}
