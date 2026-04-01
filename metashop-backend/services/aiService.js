import { Client } from "@gradio/client";
import cloudinary from "../utils/cloudinary.js";
import axios from "axios";
import { Readable } from 'stream';

/**
 * Service Abstraction for AI Try-On (HuggingFace IDM-VTON Wrapped)
 * Provides fault-tolerant communication with the free AI models.
 */
class AIService {
  constructor() {
    this.hfToken = process.env.HF_TOKEN;
  }

  /**
   * Generates AI Try On. Never throws errors, always returns structured state.
   * @param {string} userImageBase64 - Base64 properly formatted image
   * @param {string} productImage - URL of the garment
   * @returns {Object} { status: 'success' | 'fallback', image?: string, message?: string }
   */
  async generateTryOn(userImageBase64, productImage) {
    try {
      if (!this.hfToken) {
        console.warn('⚠️ HF_TOKEN is missing in .env. Using fallback preview mode.');
        return { status: 'fallback', message: 'Using preview mode' };
      }

      console.log('Initiating High-Quality HuggingFace IDM-VTON Try-On...');

      // 1. Prepare Blobs for HF Gradio Client
      const userBuffer = Buffer.from(userImageBase64.split(',')[1], 'base64');
      const userMime = userImageBase64.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
      const humanBlob = new Blob([userBuffer], { type: userMime });

      const garmentResponse = await axios.get(productImage, { responseType: 'arraybuffer', timeout: 30000 });
      const garmentBlob = new Blob([Buffer.from(garmentResponse.data)], { type: 'image/jpeg' });

      // 2. Connect to HF Space securely
      const client = await Client.connect("yisol/IDM-VTON", { hf_token: this.hfToken });

      // 3. Execute Try-On prediction with optimized parameters
      const result = await client.predict("/tryon", [
        { background: humanBlob, layers: [], composite: null },
        garmentBlob,
        "Photorealistic full body shot, highly detailed, perfectly fitted dress preserving natural hands, natural legs, and natural body shape, cinematic lighting.",
        true,
        false, // is_checked_crop (Set to false to prevent cropping legs/feet)
        40,    // max allowed denoise_steps
        42
      ]);

      if (!result?.data?.[0]) throw new Error("Empty response from HF Space");

      // 4. Capture & Upload Result
      const resultImage = result.data[0];
      let finalImageUrl;

      if (resultImage?.url) {
        const imgRes = await axios.get(resultImage.url, { responseType: 'arraybuffer', timeout: 30000 });
        finalImageUrl = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'metashop/tryon', format: 'jpg' },
            (err, res) => (err ? reject(err) : resolve(res.secure_url))
          );
          Readable.from(Buffer.from(imgRes.data)).pipe(stream);
        });
      } else if (typeof resultImage === 'string' && resultImage.startsWith('data:')) {
        const uploadRes = await cloudinary.uploader.upload(resultImage, { folder: 'metashop/tryon', format: 'jpg' });
        finalImageUrl = uploadRes.secure_url;
      } else {
        throw new Error("Unknown result format from IDM-VTON");
      }

      console.log('✅ IDM-VTON generation successful.');
      return { status: 'success', image: finalImageUrl };

    } catch (error) {
      console.error('❌ AI Pipeline Failure:', error.message);
      
      // CRITICAL: UX Requirement -> Never expose failure to client, always return fallback state.
      // This protects the user experience if Hugging Face limits are reached or instances timeout.
      return { 
        status: 'fallback', 
        message: 'Using preview mode' 
      };
    }
  }
}

// Export a singleton instance
export const aiService = new AIService();
