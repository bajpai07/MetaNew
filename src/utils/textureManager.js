import * as THREE from 'three';

class TextureManager {
  constructor() {
    this.cache = new Map();
    this.loader = new THREE.TextureLoader();
    this.fallbackTexture = '/assets/textures/tshirt_white.png';
  }

  async loadTexture(textureUrl, options = {}) {
    const cacheKey = textureUrl;
    
    // Return cached texture if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        textureUrl,
        (texture) => {
          console.log(`✅ Texture loaded: ${textureUrl}`);
          this.cache.set(cacheKey, texture);
          resolve(texture);
        },
        (progress) => {
          if (options.onProgress) {
            options.onProgress(progress);
          }
        },
        (error) => {
          console.warn(`⚠️ Failed to load texture: ${textureUrl}, using fallback`);
          
          // Load fallback texture
          this.loader.load(this.fallbackTexture, (fallbackTexture) => {
            this.cache.set(cacheKey, fallbackTexture);
            resolve(fallbackTexture);
          }, null, reject);
        }
      );
    });
  }

  preloadTextures(textureUrls) {
    return Promise.all(
      textureUrls.map(url => this.loadTexture(url))
    );
  }

  clearCache() {
    this.cache.forEach(texture => texture.dispose());
    this.cache.clear();
  }
}

// Singleton instance
export const textureManager = new TextureManager();

export default textureManager;
