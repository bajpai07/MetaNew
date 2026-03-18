import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThreeDTryOn from '../components/ThreeDTryOn';
import toast from 'react-hot-toast';

export default function ThreeDTryOnPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get product data from navigation state
  const product = location.state?.product;

  useEffect(() => {
    // Request camera permissions
    const requestCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          } 
        });
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('Camera permission denied:', err);
        setError('Camera access is required for try-on. Please allow camera permissions and refresh.');
        toast.error('Camera access required for try-on');
      }
    };

    requestCameraPermission();
  }, []);

  const handleLoadingChange = (loading) => {
    setIsLoading(loading);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    toast.error(errorMessage);
  };

  const handleBackToProduct = () => {
    if (product) {
      navigate(`/product/${product._id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={handleBackToProduct}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          ← Back to Product
        </button>

        <div style={{
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          {product ? `3D Try-On: ${product.name}` : '3D Virtual Try-On'}
        </div>

        <div style={{ width: '150px' }} /> {/* Spacer for alignment */}
      </div>

      {/* Error overlay */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '30px',
          borderRadius: '12px',
          zIndex: 2000,
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h3 style={{ marginBottom: '15px', color: '#ff6b6b' }}>Try-On Error</h3>
          <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>{error}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Retry
            </button>
            <button
              onClick={handleBackToProduct}
              style={{
                background: '#666',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && !error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '30px',
          borderRadius: '12px',
          zIndex: 2000,
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #3498db', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h3>Initializing 3D Try-On...</h3>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>
            Setting up camera and pose detection
          </p>
        </div>
      )}

      {/* 3D Try-On Component */}
      <ThreeDTryOn
        shirtImage={product?.image}
        onLoadingChange={handleLoadingChange}
        onError={handleError}
      />

      {/* Add CSS animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
