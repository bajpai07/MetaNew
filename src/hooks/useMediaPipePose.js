import { useRef, useCallback, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { Pose } from '@mediapipe/pose';

export const useMediaPipePose = (videoRef, onPoseDetected) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);

  const onResults = useCallback((results) => {
    if (results.poseLandmarks && onPoseDetected) {
      // Extract relevant landmarks for shirt deformation
      const landmarks = results.poseLandmarks;
      
      // Key landmarks for shirt mapping
      const poseData = {
        leftShoulder: landmarks[11],
        rightShoulder: landmarks[12],
        leftHip: landmarks[23],
        rightHip: landmarks[24],
        chestCenter: {
          x: (landmarks[11].x + landmarks[12].x) / 2,
          y: (landmarks[11].y + landmarks[12].y) / 2,
          z: (landmarks[11].z + landmarks[12].z) / 2,
          visibility: (landmarks[11].visibility + landmarks[12].visibility) / 2
        },
        // Additional landmarks for better deformation
        leftShoulderBlade: landmarks[14],
        rightShoulderBlade: landmarks[13],
        spine: landmarks[0], // nose as reference for spine alignment
        allLandmarks: landmarks
      };

      onPoseDetected(poseData);
    }
  }, [onPoseDetected]);

  const initializePose = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults(onResults);
      poseRef.current = pose;

      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (poseRef.current && videoRef.current) {
              await poseRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        
        cameraRef.current = camera;
        await camera.start();
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing MediaPipe Pose:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, [videoRef, onResults]);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    if (poseRef.current) {
      poseRef.current.close();
    }
  }, []);

  return {
    isLoading,
    error,
    initializePose,
    stopCamera
  };
};
