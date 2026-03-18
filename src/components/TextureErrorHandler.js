import React, { useState, useEffect } from 'react';
import { textureManager } from '../utils/textureManager';

const TextureErrorHandler = ({ 
  textureUrl, 
  onTextureReady, 
  onTextureError,
  fallbackUrl = '/assets/textures/tshirt_white.png' 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTexture = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const texture = await textureManager.loadTexture(textureUrl);
        setIsLoading(false);
        onTextureReady && onTextureReady(texture);
      } catch (err) {
        setError(err);
        setIsLoading(false);
        
        // Try fallback texture
        try {
          const fallbackTexture = await textureManager.loadTexture(fallbackUrl);
          onTextureError && onTextureError(fallbackTexture);
        } catch (fallbackErr) {
          console.error('Failed to load fallback texture:', fallbackErr);
        }
      }
    };

    if (textureUrl) {
      loadTexture();
    }
  }, [textureUrl, onTextureReady, onTextureError, fallbackUrl]);

  if (isLoading) {
    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px 20px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        Loading texture...
      </div>
    );
  }

  if (error) {
    console.warn('Texture loading error:', error);
  }

  return null;
};

export default TextureErrorHandler;
