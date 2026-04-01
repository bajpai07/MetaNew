import { aiService } from '../services/aiService.js';
import fs from 'fs';

// Memory cache for session rate tracking (In production, replace with Redis)
const sessionUsageMap = new Map();
const MAX_AI_CALLS_PER_SESSION = 5;

// Cache for identical requests (userImageHash + garmentUrl) -> resultUrl
const cacheMap = new Map();

export const generateTryOn = async (req, res) => {
  try {
    const sessionId = req.ip || 'anonymous';
    const currentUsage = sessionUsageMap.get(sessionId) || 0;

    // 1. INPUT PARSING
    const userImageFile = req.files?.humanImage?.[0];
    let userImageBase64 = req.body.humanImage;
    const garmentImageUrl = req.body.garmentImageUrl;

    if (!garmentImageUrl) {
      return res.json({ status: "fallback", message: "Missing garment image" });
    }
    if (!userImageFile && !userImageBase64) {
      return res.json({ status: "fallback", message: "Missing user image" });
    }

    // Process multipart file to base64 if it came as a file upload
    if (userImageFile && !userImageBase64) {
      const buffer = fs.readFileSync(userImageFile.path);
      userImageBase64 = `data:${userImageFile.mimetype};base64,${buffer.toString('base64')}`;
      fs.unlinkSync(userImageFile.path); // cleanup temp file immediately
    }

    // 2. CACHE CHECK
    const cacheKey = `${sessionId}_${garmentImageUrl}`;
    if (cacheMap.has(cacheKey)) {
      console.log('Returning cached result instantly.');
      return res.json({ 
        status: "success", 
        image: cacheMap.get(cacheKey) 
      });
    }

    // 3. RATE LIMITING LOGIC (Graceful Fallback)
    if (currentUsage >= MAX_AI_CALLS_PER_SESSION) {
      console.log(`[Rate Limit] Session ${sessionId} exceeded max calls. Returning fallback.`);
      return res.json({ 
        status: "fallback", 
        message: "Using preview mode" 
      });
    }

    // 4. EXTERNAL AI SERVICE CALL
    const result = await aiService.generateTryOn(userImageBase64, garmentImageUrl);

    // 5. POST-PROCESSING
    if (result.status === 'success') {
      // Increment session usage counter only on success
      sessionUsageMap.set(sessionId, currentUsage + 1);
      
      // Store in short-term cache
      cacheMap.set(cacheKey, result.image);
    }

    return res.json(result);

  } catch (error) {
    console.error("❌ Critical Try-On Controller Error:", error);
    // Ultimate safety net: ensure API never crashes or returns HTTP 500
    return res.json({ status: "fallback", message: "Using preview mode" });
  }
};
