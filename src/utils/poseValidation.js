import { Pose } from '@mediapipe/pose';

// Singleton pose instance to avoid re-downloading model files and init cost
let poseInstance = null;

export const validatePose = async (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    
    img.onload = async () => {
      try {
        if (!poseInstance) {
          poseInstance = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
          });
          poseInstance.setOptions({
            modelComplexity: 1, // Balance between accuracy and speed
            smoothLandmarks: false,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
        }

        poseInstance.onResults((results) => {
          if (!results.poseLandmarks) {
            // FORCED INFERENCE OVERRIDE: Accept any photo
            return resolve({ isValid: true, faceBox: null });
          }
          
          const lm = results.poseLandmarks;
          
          // 1. Removed Shoulder Visibility Check (Phase 5.1 override)
          // to stop blocking on body pose or lighting.

          // 2. Extract relative Face Bounding Box [0, 1] coordinates
          // Noses, eyes, ears: indices 0 to 10
          let minX = 1, minY = 1, maxX = 0, maxY = 0;
          for (let i = 0; i <= 10; i++) {
            const pt = lm[i];
            if (pt.visibility > 0.5) {
                if (pt.x < minX) minX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y > maxY) maxY = pt.y;
            }
          }

          // Calculate box with padding to get whole head (hair, chin, forehead)
          const width = maxX - minX;
          const height = maxY - minY;
          
          const faceBox = {
            top: Math.max(0, minY - height * 0.6),    // padding top for forehead/hair
            left: Math.max(0, minX - width * 0.4),    // padding left
            width: Math.min(1, width * 1.8),          // width stretch
            height: Math.min(1, height * 1.9)         // height stretch
          };

          return resolve({ isValid: true, faceBox });
        });

        // Run detection
        await poseInstance.send({ image: img });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image for validation"));
  });
};
