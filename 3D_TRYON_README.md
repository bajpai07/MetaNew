# 3D Mesh Deformation Try-On System

## Overview
MetaShop has been upgraded from a flat 2D overlay to a dynamic 3D Mesh Deformation Try-On system using React Three Fiber (R3F) and MediaPipe Pose detection.

## Architecture

### Core Components

1. **useMediaPipePose Hook** (`src/hooks/useMediaPipePose.js`)
   - Handles MediaPipe Pose detection initialization
   - Extracts key landmarks: left_shoulder, right_shoulder, left_hip, right_hip, chest_center
   - Provides real-time pose data with confidence scores

2. **DeformableShirtMesh** (`src/components/DeformableShirtMesh.js`)
   - Creates a 20x20 segment PlaneGeometry representing the shirt
   - Implements vertex anchoring logic based on pose landmarks
   - Applies LERP smoothing to prevent jittering
   - Maps shirt texture as meshStandardMaterial

3. **ThreeDTryOn** (`src/components/ThreeDTryOn.js`)
   - Main component integrating MediaPipe and R3F
   - Sets up Three.js scene with proper lighting
   - Handles camera permissions and error states
   - Provides user interface controls and instructions

4. **ThreeDTryOnPage** (`src/pages/ThreeDTryOnPage.js`)
   - Full-page wrapper for the try-on experience
   - Handles navigation and error states
   - Manages loading states and permissions

## Key Features

### Grid Mapping
- 20x20 vertex grid for detailed deformation
- Each vertex can be independently positioned based on pose data

### Landmark Anchoring
- **Top corners** → left_shoulder and right_shoulder
- **Bottom corners** → left_hip and right_hip  
- **Center points** → chest_center (calculated average)
- **Mid-section** → interpolated between anchors for smooth deformation

### Vertex Deformation Logic
```javascript
// Key deformation zones:
if (normY >= 0.8) {
  // Top row - anchor to shoulders
} else if (normY <= 0.2) {
  // Bottom row - anchor to hips  
} else {
  // Middle section - chest deformation with depth influence
}
```

### Smoothing Algorithm
- LERP (Linear Interpolation) with configurable factor (default: 0.15)
- Previous vertex positions stored for smooth transitions
- Prevents jittering from pose detection noise

### Lighting Setup
- Ambient light (0.6 intensity) for base illumination
- Directional light (0.8 intensity) for shadows and depth
- Secondary directional light for fill lighting
- Environment mapping for realistic reflections

## Integration Points

### Product Page Updates
- Added "3D MESH TRY-ON" button alongside existing AR try-on
- Dual button layout for both AR and 3D mesh options
- Visual distinction with gradient styling

### Routing
- New route: `/3d-tryon` 
- Passes product data via React Router state
- Maintains existing AR route: `/ar/:model`

## Usage Instructions

### For Users
1. Navigate to any product page
2. Click "3D MESH TRY-ON" button
3. Allow camera permissions when prompted
4. Stand in front of camera with full upper body visible
5. Move around to see real-time mesh deformation
6. Use mouse to rotate view, scroll to zoom

### For Developers

#### Basic Usage
```javascript
import ThreeDTryOn from './components/ThreeDTryOn';

<ThreeDTryOn 
  shirtImage="path/to/shirt/image.jpg"
  onLoadingChange={(loading) => console.log(loading)}
  onError={(error) => console.error(error)}
/>
```

#### Custom Configuration
```javascript
<DeformableShirtMesh 
  poseData={poseData}
  shirtTexture={shirtImage}
  gridSize={{ width: 25, height: 25 }}  // More vertices = more detail
  meshSize={{ width: 2.5, height: 3 }}  // Physical dimensions
  smoothingFactor={0.12}                 // Lower = smoother but slower
/>
```

## Technical Specifications

### Dependencies
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Helper components for R3F
- `@mediapipe/pose` - Pose detection
- `@mediapipe/camera_utils` - Camera utilities
- `three` - 3D graphics library

### Performance Considerations
- Grid size affects performance (20x20 is optimal balance)
- Smoothing factor impacts responsiveness vs. smoothness
- MediaPipe model complexity set to 1 for real-time performance

### Browser Support
- Requires WebGL 2.0 support
- Camera access via getUserMedia API
- Works best on modern browsers (Chrome 90+, Firefox 88+, Safari 14+)

## Error Handling

### Common Issues
1. **Camera Permission Denied**: User must allow camera access
2. **No Pose Detected**: User needs to be fully visible in camera
3. **WebGL Not Supported**: Browser or hardware limitations
4. **Network Issues**: MediaPipe models need to load from CDN

### Recovery Mechanisms
- Retry buttons for camera permissions
- Clear error messages with actionable steps
- Graceful fallback to product page
- Loading states for all async operations

## Future Enhancements

### Potential Improvements
1. **Multiple Garment Types**: Support for pants, dresses, jackets
2. **Size Adaptation**: Automatic mesh sizing based on body measurements
3. **Fabric Simulation**: Physics-based cloth deformation
4. **Multi-Pose Support**: Sitting, walking, arm movements
5. **Performance Optimization**: Web Workers for pose processing

### Advanced Features
1. **AR Integration**: Combine mesh deformation with AR overlay
2. **Social Sharing**: Capture and share try-on photos
3. **Style Recommendations**: AI-powered suggestions based on fit
4. **Size Prediction**: Machine learning for accurate sizing

## Troubleshooting

### Debug Mode
Enable console logging to debug pose detection:
```javascript
// In useMediaPipePose.js
console.log('Pose landmarks:', landmarks);
console.log('Chest center:', chestCenter);
```

### Performance Monitoring
Monitor frame rate and vertex updates:
```javascript
// In DeformableShirtMesh.js
useFrame((state, delta) => {
  console.log('FPS:', 1/delta);
  console.log('Vertex updates:', vertexCount);
});
```

## Conclusion

The 3D Mesh Deformation Try-On system provides a significant upgrade from static overlays to dynamic, interactive virtual try-on experiences. The modular architecture allows for easy customization and extension while maintaining smooth performance and user-friendly interfaces.
