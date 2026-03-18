import { useEffect, useRef, useState, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

export default function useVTONTracking(videoRef, occlusionCanvasRef) {
  const [trackingState, setTrackingState] = useState({
    targetX: 640,
    targetY: 360,
    scaleOffset: 300.0,
    rotationY: 0,
    visibilityOpacity: 1, // New side-on toggle
    isCalibrating: true,
    error: null
  });

  const poseRef = useRef(null);
  const segmentationRef = useRef(null);
  const cameraUtilsRef = useRef(null);
  const animationFrameId = useRef(null);
  const activeObj = useRef({ active: true });

  // Math helper for euclidean distance
  const calculateDistance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  useEffect(() => {
    activeObj.current.active = true;
    const active = activeObj.current.active;

    const initTracking = async () => {
      try {
        // Initialize Pose
        poseRef.current = new Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });
        poseRef.current.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        // Initialize Segmentation (Occlusion Masking)
        segmentationRef.current = new SelfieSegmentation({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
        });
        segmentationRef.current.setOptions({ modelSelection: 1 });

        // Map Segmentation Result to Canvas
        segmentationRef.current.onResults((results) => {
          if (!activeObj.current.active || !occlusionCanvasRef?.current || !videoRef?.current) return;
          const canvas = occlusionCanvasRef.current;
          const ctx = canvas.getContext('2d');
          
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Mirror rendering
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          
          ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'source-in';
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        });

        // Map Pose Result to React State
        poseRef.current.onResults((results) => {
          if (!activeObj.current.active) return;
          
          if (!results.poseLandmarks) {
            setTrackingState(prev => ({ ...prev, visibilityOpacity: 0 }));
            return;
          }

          const landmarks = results.poseLandmarks;
          const leftShoulder = landmarks[11];
          const rightShoulder = landmarks[12];
          const leftHip = landmarks[23];
          const rightHip = landmarks[24];

          // Edge Case: Side-On Body Turning
          if (!leftShoulder || !rightShoulder || 
              leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5) {
             setTrackingState(prev => ({ ...prev, visibilityOpacity: 0 }));
             return;
          } else {
             setTrackingState(prev => ({ ...prev, visibilityOpacity: 1 }));
          }

          if (leftHip && rightHip) {
            
            // Turn off loading screen once we have solid tracking
            setTrackingState(prev => {
               if (prev.isCalibrating) return { ...prev, isCalibrating: false };
               return prev;
            });

            // 1. ANATOMIC POSITIONING: Midpoint Anchoring
            const midpointX = (leftShoulder.x + rightShoulder.x) / 2;
            const midpointY = (leftShoulder.y + rightShoulder.y) / 2;

            // Use this midpointY as the base for the shirt's collar, adding Y-offset for neck
            const anchorY = midpointY + 0.08; 

            // 2. COORDINATE NORMALIZATION
            const canvas = occlusionCanvasRef.current;
            const rect = canvas ? canvas.getBoundingClientRect() : { width: 1280, height: 720 };
            
            // Mirror X because the video is flipped via CSS scaleX(-1)
            const mappedX = (1 - midpointX) * rect.width;
            const mappedY = anchorY * rect.height;

            // 3. DYNAMIC WIDTH CALCULATION
            const dx = leftShoulder.x - rightShoulder.x;
            const dy = leftShoulder.y - rightShoulder.y;
            const shoulderDist = calculateDistance(leftShoulder, rightShoulder);
            
            const pixelWidth = shoulderDist * rect.width;
            
            // Crucial: Apply a Scaling Multiplier (e.g., 2.0x) 
            const targetScale = pixelWidth * 2.0;

            // 4. ROTATION MATRIX
            const angle = -Math.atan2(-dy, dx);

            // JITTER FILTER (Exponential Smoothing)
            const alpha = 0.15; 
            const rotationAlpha = 0.1;

            setTrackingState(prev => ({
              ...prev,
              visibilityOpacity: 1,
              targetX: (alpha * mappedX) + ((1 - alpha) * prev.targetX),
              targetY: (alpha * mappedY) + ((1 - alpha) * prev.targetY),
              scaleOffset: (alpha * targetScale) + ((1 - alpha) * prev.scaleOffset),
              rotationY: (rotationAlpha * angle) + ((1 - rotationAlpha) * prev.rotationY)
            }));
          }
        });

      } catch (err) {
        setTrackingState(prev => ({ ...prev, error: "Failed to load AI Models." }));
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(console.error);
            
            if (!cameraUtilsRef.current && poseRef.current && segmentationRef.current) {
               cameraUtilsRef.current = new Camera(videoRef.current, {
                 onFrame: async () => {
                   if (videoRef.current && activeObj.current.active) {
                     await poseRef.current.send({ image: videoRef.current });
                     await segmentationRef.current.send({ image: videoRef.current });
                   }
                 },
                 width: 1280,
                 height: 720
               });
               cameraUtilsRef.current.start();
            }
          };
        }
      } catch (err) {
        setTrackingState(prev => ({ ...prev, error: "Camera access denied or unavailable." }));
      }
    };

    initTracking().then(startCamera);

    // CLEANUP MEMORY LEAKS
    return () => {
      activeObj.current.active = false;
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (cameraUtilsRef.current) cameraUtilsRef.current.stop();
      if (poseRef.current) poseRef.current.close();
      if (segmentationRef.current) segmentationRef.current.close();
    };
  }, [videoRef, occlusionCanvasRef]);

  // Provide manual overrides
  const setTargetX = useCallback((val) => setTrackingState(p => ({ ...p, targetX: typeof val === 'function' ? val(p.targetX) : val })), []);
  const setTargetY = useCallback((val) => setTrackingState(p => ({ ...p, targetY: typeof val === 'function' ? val(p.targetY) : val })), []);
  const setScaleOffset = useCallback((val) => setTrackingState(p => ({ ...p, scaleOffset: typeof val === 'function' ? val(p.scaleOffset) : val })), []);

  return { ...trackingState, setTargetX, setTargetY, setScaleOffset };
}
