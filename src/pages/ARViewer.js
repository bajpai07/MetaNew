// src/pages/ARViewer.js
import { useParams } from "react-router-dom";
import ModelViewer from "../components/ar/ModelViewer";

export default function ARViewer() {
  const { model } = useParams();

  const modelUrl = `/models/${model}.glb`;

  return (
    <div style={{ height: "100vh" }}>
      <h2 style={{ textAlign: "center" }}>AR Preview</h2>

      <ModelViewer modelUrl={modelUrl} ar />
    </div>
  );
}
