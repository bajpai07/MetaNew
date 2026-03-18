import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { useMediaPipePose } from '../hooks/useMediaPipePose';
import DeformableShirtMesh from './DeformableShirtMesh';
import { textureManager } from '../utils/textureManager';

const ThreeDTryOn = ({ 
  shirtImage = null,
  onLoadingChange = null,
  onError = null 
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [poseData, setPoseData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle pose detection
  const handlePoseDetected = (data) => {
    setPoseData(data);
  };

  // Initialize MediaPipe
  const { 
    isLoading: isPoseLoading, 
    error: poseError, 
    initializePose, 
    stopCamera 
  } = useMediaPipePose(videoRef, handlePoseDetected);

  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isPoseLoading);
    }
  }, [isPoseLoading, onLoadingChange]);

  // Notify parent of errors
  useEffect(() => {
    if (onError && poseError) {
      onError(poseError);
    }
  }, [poseError, onError]);

  // Initialize camera and pose detection
  useEffect(() => {
    const initialize = async () => {
      try {
        // Preload textures
        if (shirtImage) {
          await textureManager.loadTexture(shirtImage);
        }
        
        await initializePose();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize try-on system:', error);
        if (onError) {
          onError(error.message);
        }
      }
    };

    initialize();

    return () => {
      stopCamera();
    };
  }, [initializePose, stopCamera, onError, shirtImage]);

  // Scene component with lighting
  const Scene = () => (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.8} 
        castShadow 
      />
      <directionalLight 
        position={[-10, -10, -5]} 
        intensity={0.3} 
      />
      
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      
      {/* Controls */}
      <OrbitControls 
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 6}
      />
      
      {/* Environment for reflections */}
      <Environment preset="apartment" />
      
      {/* Deformable shirt mesh */}
      <DeformableShirtMesh 
        poseData={poseData}
        shirtTexture={shirtImage}
        gridSize={{ width: 25, height: 25 }}
        meshSize={{ width: 2.5, height: 3 }}
        smoothingFactor={0.12}
      />
    </>
  );

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      position: 'relative',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Hidden video element for MediaPipe */}
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '640px',
          height: '480px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1
        }}
        autoPlay
        playsInline
        muted
      />
      
      {/* Canvas for MediaPipe (hidden) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '640px',
          height: '480px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1
        }}
      />
      
      {/* Three.js Canvas */}
      <Canvas
        shadows
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent'
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      
      {/* Loading indicator */}
      {isPoseLoading && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          zIndex: 1000
        }}>
          Initializing camera and pose detection...
        </div>
      )}
      
      {/* Error display */}
      {poseError && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          Error: {poseError}
        </div>
      )}
      
      {/* Status indicator */}
      {isInitialized && !isPoseLoading && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0, 255, 0, 0.2)',
          border: '1px solid rgba(0, 255, 0, 0.5)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '6px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          zIndex: 1000
        }}>
          {poseData ? '✓ Pose detected' : '⚠ No pose detected'}
        </div>
      )}
      
      {/* Instructions */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        zIndex: 1000,
        maxWidth: '250px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>3D Try-On Instructions:</div>
        <div style={{ marginBottom: '4px' }}>• Stand in front of camera</div>
        <div style={{ marginBottom: '4px' }}>• Move to see mesh deformation</div>
        <div style={{ marginBottom: '4px' }}>• Use mouse to rotate view</div>
        <div style={{ marginBottom: '4px' }}>• Scroll to zoom in/out</div>
      </div>
    </div>
  );
};

export default ThreeDTryOn;
