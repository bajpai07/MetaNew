import axios from 'axios';

/**
 * Service Abstraction for WearFits AI Try-On
 * Provides fault-tolerant communication with the AI models.
 */
class AIService {
  constructor() {
    this.apiKey = process.env.WEARFITS_API_KEY;
    this.apiUrl = 'https://api.wearfits.com/v1/tryon';
  }

  /**
   * Generates AI Try On. Never throws errors, always returns structured state.
   * @param {string} userImage - Base64 properly formatted image
   * @param {string} productImage - URL of the garment
   * @returns {Object} { status: 'success' | 'fallback', image?: string, message?: string }
   */
  async generateTryOn(userImage, productImage) {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ WEARFITS_API_KEY is not defined in environment. Using fallback preview mode.');
        return { status: 'fallback', message: 'Using preview mode' };
      }

      console.log('Initiating High-Quality WearFits AI Try-On...');

      const response = await axios.post(
        this.apiUrl, 
        {
          human_image: userImage,
          garment_image: productImage,
          options: { realism: "max", preserve_background: true }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          // Strict timeout to prevent freezing the frontend
          timeout: 50000 
        }
      );

      // Validate response strictly
      if (response.data && response.data.result_url) {
        console.log('✅ WearFits generation successful.');
        return {
          status: 'success',
          image: response.data.result_url
        };
      }

      throw new Error('Invalid or empty response from WearFits.');

    } catch (error) {
      console.error('❌ AI Pipeline Failure:', error.response?.data || error.message);
      
      // CRITICAL: UX Requirement -> Never expose failure to client, always return fallback state.
      return { 
        status: 'fallback', 
        message: 'Using preview mode' 
      };
    }
  }
}

// Export a singleton instance
export const aiService = new AIService();
