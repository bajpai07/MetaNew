import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { PlaneGeometry, MeshStandardMaterial, Vector3 } from 'three';
import * as THREE from 'three';

const DeformableShirtMesh = ({ 
  poseData, 
  shirtTexture, 
  gridSize = { width: 20, height: 20 },
  meshSize = { width: 2, height: 2 },
  smoothingFactor = 0.15 
}) => {
  const meshRef = useRef();
  const geometryRef = useRef();
  
  // Store previous vertex positions for smoothing
  const previousPositions = useRef(null);
  
  // Create plane geometry with grid
  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(meshSize.width, meshSize.height, gridSize.width, gridSize.height);
    
    // Initialize previous positions array
    const positions = geo.attributes.position.array;
    previousPositions.current = new Float32Array(positions.length);
    previousPositions.current.set(positions);
    
    return geo;
  }, [gridSize.width, gridSize.height, meshSize.width, meshSize.height]);

  // Create material with shirt texture
  const material = useMemo(() => {
    if (!shirtTexture) {
      return new MeshStandardMaterial({ 
        color: 0x4287f5,
        side: THREE.DoubleSide,
        wireframe: false
      });
    }

    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      shirtTexture,
      // onLoad
      (loadedTexture) => {
        console.log('Texture loaded successfully:', shirtTexture);
      },
      // onProgress
      (progress) => {
        // Optional: Loading progress
      },
      // onError
      (error) => {
        console.warn('Failed to load texture:', shirtTexture, error);
        // Use fallback texture
        const fallbackTexture = loader.load('/assets/textures/tshirt_white.png');
        return new MeshStandardMaterial({
          map: fallbackTexture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
      }
    );
    
    return new MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
  }, [shirtTexture]);

  // Lerp function for smooth interpolation
  const lerp = (start, end, factor) => {
    return start + (end - start) * factor;
  };

  // Update mesh vertices based on pose data
  const updateMeshVertices = (poseData) => {
    if (!meshRef.current || !geometryRef.current || !poseData) return;

    const geometry = geometryRef.current;
    const positions = geometry.attributes.position.array;
    const vertexCount = positions.length / 3;

    // Convert MediaPipe coordinates to 3D space
    const convertCoordinates = (landmark) => {
      if (!landmark) return new Vector3(0, 0, 0);
      
      // MediaPipe: x,y are normalized (0-1), z is depth (-1 to 1)
      // Convert to Three.js coordinate system
      return new Vector3(
        (landmark.x - 0.5) * 4,  // Scale x
        -(landmark.y - 0.5) * 4, // Flip y and scale
        landmark.z * 2            // Scale z for depth
      );
    };

    // Get landmark positions
    const leftShoulder = convertCoordinates(poseData.leftShoulder);
    const rightShoulder = convertCoordinates(poseData.rightShoulder);
    const leftHip = convertCoordinates(poseData.leftHip);
    const rightHip = convertCoordinates(poseData.rightHip);
    const chestCenter = convertCoordinates(poseData.chestCenter);

    // Calculate mesh bounds
    const meshTop = meshSize.height / 2;
    const meshBottom = -meshSize.height / 2;
    const meshLeft = -meshSize.width / 2;
    const meshRight = meshSize.width / 2;

    // Update each vertex
    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      
      // Normalize vertex position within mesh (0-1)
      const normX = (x - meshLeft) / meshSize.width;
      const normY = (y - meshBottom) / meshSize.height;
      
      let targetX = x;
      let targetY = y;
      let targetZ = 0;

      // Vertex anchoring and deformation logic
      if (normY >= 0.8) {
        // Top row - anchor to shoulders
        if (normX <= 0.2) {
          // Left corner -> left shoulder
          targetX = leftShoulder.x;
          targetY = leftShoulder.y;
          targetZ = leftShoulder.z;
        } else if (normX >= 0.8) {
          // Right corner -> right shoulder
          targetX = rightShoulder.x;
          targetY = rightShoulder.y;
          targetZ = rightShoulder.z;
        } else {
          // Top edge - interpolate between shoulders
          const shoulderLerp = normX;
          targetX = lerp(leftShoulder.x, rightShoulder.x, shoulderLerp);
          targetY = lerp(leftShoulder.y, rightShoulder.y, shoulderLerp);
          targetZ = lerp(leftShoulder.z, rightShoulder.z, shoulderLerp);
        }
      } else if (normY <= 0.2) {
        // Bottom row - anchor to hips
        if (normX <= 0.2) {
          // Left corner -> left hip
          targetX = leftHip.x;
          targetY = leftHip.y;
          targetZ = leftHip.z;
        } else if (normX >= 0.8) {
          // Right corner -> right hip
          targetX = rightHip.x;
          targetY = rightHip.y;
          targetZ = rightHip.z;
        } else {
          // Bottom edge - interpolate between hips
          const hipLerp = normX;
          targetX = lerp(leftHip.x, rightHip.x, hipLerp);
          targetY = lerp(leftHip.y, rightHip.y, hipLerp);
          targetZ = lerp(leftHip.z, rightHip.z, hipLerp);
        }
      } else {
        // Middle section - chest deformation
        const chestInfluence = 1 - Math.abs(normY - 0.5) * 2; // Strongest at center
        
        // Interpolate between chest and edges
        if (normX <= 0.5) {
          // Left half - interpolate between left shoulder/hip and chest
          const leftEdgeY = lerp(leftShoulder.y, leftHip.y, 1 - normY);
          const leftEdgeZ = lerp(leftShoulder.z, leftHip.z, 1 - normY);
          
          targetX = lerp(
            lerp(leftShoulder.x, leftHip.x, 1 - normY),
            chestCenter.x,
            chestInfluence * (1 - normX * 2)
          );
          targetY = lerp(leftEdgeY, chestCenter.y, chestInfluence * (1 - normX * 2));
          targetZ = lerp(leftEdgeZ, chestCenter.z, chestInfluence * (1 - normX * 2));
        } else {
          // Right half - interpolate between right shoulder/hip and chest
          const rightEdgeY = lerp(rightShoulder.y, rightHip.y, 1 - normY);
          const rightEdgeZ = lerp(rightShoulder.z, rightHip.z, 1 - normY);
          
          targetX = lerp(
            lerp(rightShoulder.x, rightHip.x, 1 - normY),
            chestCenter.x,
            chestInfluence * ((normX - 0.5) * 2)
          );
          targetY = lerp(rightEdgeY, chestCenter.y, chestInfluence * ((normX - 0.5) * 2));
          targetZ = lerp(rightEdgeZ, chestCenter.z, chestInfluence * ((normX - 0.5) * 2));
        }
      }

      // Apply smoothing (LERP with previous position)
      const prevIdx = idx;
      positions[idx] = lerp(previousPositions.current[prevIdx], targetX, smoothingFactor);
      positions[idx + 1] = lerp(previousPositions.current[prevIdx + 1], targetY, smoothingFactor);
      positions[idx + 2] = lerp(previousPositions.current[prevIdx + 2], targetZ, smoothingFactor);

      // Update previous positions
      previousPositions.current[prevIdx] = positions[idx];
      previousPositions.current[prevIdx + 1] = positions[idx + 1];
      previousPositions.current[prevIdx + 2] = positions[idx + 2];
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  // Update mesh when pose data changes
  useFrame(() => {
    if (poseData) {
      updateMeshVertices(poseData);
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[0, 0, 0]}
    />
  );
};

export default DeformableShirtMesh;
