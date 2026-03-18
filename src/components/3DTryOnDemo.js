import ThreeDTryOn from './ThreeDTryOn';

// Demo component for testing the 3D try-on system
const ThreeDTryOnDemo = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ThreeDTryOn 
        shirtImage="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"
      />
    </div>
  );
};

export default ThreeDTryOnDemo;
