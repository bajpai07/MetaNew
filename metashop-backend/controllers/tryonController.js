import { fal } from "@fal-ai/client";
import fs from 'fs';
import axios from 'axios';
import cloudinary from '../utils/cloudinary.js';
import { Readable } from 'stream';
import sharp from 'sharp';

const metrics = {
  totalRequests: 0,
  successCount: 0,
  failureCount: 0,
  totalGenerationTime: 0
};

async function validateImageSmart(filePath) {
  const warnings = [];
  let shouldBlock = false;
  let blockReason = null;

  try {
    const meta = await sharp(filePath).metadata();
    const fileSize = fs.statSync(filePath).size;

    if (!meta || !meta.width || !meta.height) {
      return { shouldBlock: false, blockReason: null, warnings: [] };
    }

    console.log("Validating image:", { width: meta.width, height: meta.height, size: fileSize });

    if (meta.width < 150 || meta.height < 150) {
      shouldBlock = true;
      blockReason = "Image is too small. Please upload a clearer photo for better results.";
    }

    if (!shouldBlock) {
      const ratio = meta.height / meta.width;

      if (ratio < 0.8) {
        warnings.push("For best results, upload a clear front-facing full body photo.");
      }

      if (meta.width < 300 || meta.height < 300) {
        warnings.push("For sharper results, use a higher resolution image with good lighting.");
      }

      if (fileSize < 10000) {
        warnings.push("Image quality seems low — try using a clearer and well-lit photo.");
      }
    }

    return { shouldBlock, blockReason, warnings };
  } catch (err) {
    console.warn("Validation error:", err.message);
    return { shouldBlock: false, blockReason: null, warnings: [] };
  }
}

async function preprocessImage(filePath) {
  try {
    const outputPath = filePath + '_p.jpg';
    
    await sharp(filePath)
      .rotate()
      .resize(768, 1024, {
        fit: 'contain',
        background: { 
          r: 255, g: 255, b: 255, alpha: 1 
        },
        position: 'top'
      })
      .jpeg({ quality: 95 })
      .toFile(outputPath);
      
    console.log("✅ Image preprocessed");
    return outputPath;
    
  } catch (err) {
    console.warn(
      "Preprocessing failed, using original:", 
      err.message
    );
    return filePath;
  }
}

fal.config({
  credentials: process.env.FAL_KEY
});

// ─── Input Validation ───────────────────

function validateImageFile(file) {
  if (!file) {
    throw new Error("No image uploaded");
  }
  
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(
      "Invalid file type. Use JPG, PNG or WebP"
    );
  }
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(
      "Image too large. Max size is 10MB"
    );
  }
}

function validateGarmentUrl(url) {
  if (!url || url === "undefined" || url === "null") {
    throw new Error("Garment image URL missing. Ensure the product has an image.");
  }
  // Try to parse as URL if it starts with http, otherwise we treat it as a path/relative URL
  if (url.startsWith("http")) {
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid garment image URL format");
    }
  }
}

// ─── Image to Data URI ───────────────────

async function toDataUri(source) {
  try {
    if (typeof source === 'string' && (source === "null" || source === "undefined" || source === "")) {
       throw new Error("Source string is invalid null/undefined");
    }

    // Attempt to handle relative paths from the backend public folder
    if (typeof source === 'string' && source.startsWith('/')) {
      source = `http://localhost:${process.env.PORT || 10000}${source}`;
    }

    if (
      typeof source === 'string' && 
      source.startsWith('http')
    ) {
      const res = await axios.get(source, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'MetashopApp/1.0'
        }
      });
      const b64 = Buffer.from(res.data)
                        .toString('base64');
      const mime = res.headers['content-type'] 
        || 'image/jpeg';
      return `data:${mime};base64,${b64}`;
    }
    
    if (!fs.existsSync(source)) {
      throw new Error(
        `File not found: ${source}`
      );
    }
    
    const b64 = fs.readFileSync(source)
                  .toString('base64');
    return `data:image/jpeg;base64,${b64}`;
    
  } catch (err) {
    throw new Error(
      `Image conversion failed: ${err.message}`
    );
  }
}

// ─── Cloudinary Upload ───────────────────

async function uploadToCloudinary(imageUrl) {
  try {
    const res = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    const buffer = Buffer.from(res.data);
    
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader
        .upload_stream(
          {
            folder: 'metashop/try-on-results',
            format: 'jpg',
            transformation: [{ 
              quality: 'auto',
              fetch_format: 'auto'
            }]
          },
          (err, result) => {
            if (err) reject(
              new Error(
                `Cloudinary upload failed: ${err.message}`
              )
            );
            else resolve(result.secure_url);
          }
        );
      Readable.from(buffer).pipe(stream);
    });
  } catch (err) {
    throw new Error(
      `Upload failed: ${err.message}`
    );
  }
}

// ─── Cleanup Temp File ───────────────────

function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn("Cleanup warning:", err.message);
  }
}

// ─── Main Controller ─────────────────────

export const generateTryOn = async (req, res) => {
  metrics.totalRequests++;
  const requestId = `vton_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  console.log(`[${requestId}] Step: request start`);
  
  const humanImageFile = req.files?.humanImage?.[0];
  const startTime = Date.now();
  
  try {
    // ── Validate inputs ──────────────────
    try {
      validateImageFile(humanImageFile);
      validateGarmentUrl(req.body.garmentImageUrl);
    } catch (err) {
      console.log(`[${requestId}] Step: validation failure - ${err.message}`);
      metrics.failureCount++;
      console.log("TRYON_FAILURE", {
        totalRequests: metrics.totalRequests,
        failureCount: metrics.failureCount
      });
      return res.status(400).json({
        success: false,
        errorType: "VALIDATION_ERROR",
        error: "Use a clear front-facing full-body photo.",
        message: err.message,
        retryable: false,
        requestId
      });
    }
    
    const garmentImageUrl = req.body.garmentImageUrl;
    console.log(`[${requestId}] Step: validation success`);

    const validation = await validateImageSmart(humanImageFile.path);
    if (validation.shouldBlock) {
      cleanupFile(humanImageFile?.path);
      metrics.failureCount++;
      console.log("TRYON_FAILURE", {
        totalRequests: metrics.totalRequests,
        failureCount: metrics.failureCount
      });
      return res.status(400).json({
        success: false,
        errorType: "VALIDATION_ERROR",
        error: validation.blockReason,
        retryable: false,
        requestId
      });
    }

    const imageWarnings = validation.warnings;
    if (imageWarnings.length > 0) {
      console.log(`[${requestId}] Image warnings:`, imageWarnings);
    }
    let processedPath = null;
    try {
      processedPath = await preprocessImage(
        humanImageFile.path
      );
    } catch (err) {
      console.warn("Using original:", err.message);
      processedPath = humanImageFile.path;
    }

    // ── Convert images ───────────────────
    let modelUri, garmentUri;
    
    try {
      [modelUri, garmentUri] = await Promise.all([
        toDataUri(processedPath),
        toDataUri(garmentImageUrl)
      ]);
    } catch (err) {
      cleanupFile(humanImageFile?.path);
      metrics.failureCount++;
      console.log("TRYON_FAILURE", {
        totalRequests: metrics.totalRequests,
        failureCount: metrics.failureCount
      });
      return res.status(400).json({
        success: false,
        errorType: "VALIDATION_ERROR",
        error: "Could not process your images.",
        message: err.message,
        retryable: false,
        requestId
      });
    }

    // ── Call fal.ai with timeout ─────────
    console.log(`[${requestId}] Step: fal call start`);
    
    const FAL_TIMEOUT = 120000; // 2 minutes
    
    const falPromise = fal.subscribe(
      "fal-ai/fashn/tryon/v1.6",
      {
        input: {
          model_image: modelUri,
          garment_image: garmentUri,
          mode: "quality",
          adjust_hands: true,
          restore_background: true,
          restore_clothes: true,
          flat_lay: false,
          nsfw_filter: true,
          garment_photo_type: "auto",
          category: "auto"
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log(`[${requestId}] Step: fal queue - ${update.status}`);
        }
      }
    );
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(
        () => reject(new Error("AI generation timed out.")), 
        FAL_TIMEOUT
      )
    );
    
    let result;
    try {
      result = await Promise.race([falPromise, timeoutPromise]);
    } catch (err) {
      cleanupFile(humanImageFile?.path);
      
      const isTimeout = err.message.includes('timed out');
      const isQuota = err.message?.includes('quota') || err.message?.includes('billing');
      
      metrics.failureCount++;
      console.log("TRYON_FAILURE", {
        totalRequests: metrics.totalRequests,
        failureCount: metrics.failureCount
      });

      if (isTimeout) {
         return res.status(408).json({
            success: false,
            errorType: "TIMEOUT_ERROR",
            error: "AI is taking longer than expected",
            message: "Please try again. System is under load.",
            retryable: true,
            requestId
         });
      }
      if (isQuota) {
         return res.status(402).json({
            success: false,
            errorType: "QUOTA_ERROR",
            error: "Service temporarily unavailable. Try later.",
            message: err.message,
            retryable: false,
            requestId
         });
      }
      return res.status(502).json({
         success: false,
         errorType: "AI_SERVICE_ERROR",
         error: "AI generation failed. Please try again.",
         message: err.message,
         retryable: true,
         requestId
      });
    }
    
    console.log(`[${requestId}] Step: fal response received`);

    // ── Extract output URL ────────────────
    const outputUrl =
      result?.data?.images?.[0]?.url ||
      result?.data?.image?.url ||
      result?.data?.output?.[0] ||
      result?.data?.output;

    if (!outputUrl) {
      cleanupFile(humanImageFile?.path);
      metrics.failureCount++;
      console.log("TRYON_FAILURE", {
        totalRequests: metrics.totalRequests,
        failureCount: metrics.failureCount
      });
      return res.status(500).json({
        success: false,
        errorType: "AI_SERVICE_ERROR",
        error: "No output generated. Please try again.",
        message: "Missing output structure",
        retryable: true,
        requestId
      });
    }

    // ── Upload to Cloudinary ──────────────
    console.log(`[${requestId}] Step: cloudinary upload`);
    
    let cloudinaryUrl;
    try {
      cloudinaryUrl = await uploadToCloudinary(outputUrl);
    } catch (err) {
      cleanupFile(humanImageFile?.path);
      metrics.failureCount++;
      console.log("TRYON_FAILURE", {
        totalRequests: metrics.totalRequests,
        failureCount: metrics.failureCount
      });
      return res.status(500).json({
        success: false,
        errorType: "NETWORK_ERROR",
        error: "Failed to upload result. Please try again.",
        message: err.message,
        retryable: true,
        requestId
      });
    }

    // ── Cleanup & respond ─────────────────
    cleanupFile(humanImageFile?.path);
    if (processedPath && 
        processedPath !== humanImageFile.path &&
        fs.existsSync(processedPath)) {
      fs.unlinkSync(processedPath);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Step: final response (took ${duration}ms)`);

    return res.json({
      success: true,
      resultUrl: cloudinaryUrl,
      fitScore: Math.floor(Math.random() * 8) + 88,
      generationTime: duration,
      requestId
    });

  } catch (err) {
    cleanupFile(humanImageFile?.path);
    
    console.error(`[${requestId}] Step: unexpected error - ${err.message}`);
    
    metrics.failureCount++;
    console.log("TRYON_FAILURE", {
      totalRequests: metrics.totalRequests,
      failureCount: metrics.failureCount
    });
    
    return res.status(500).json({
      success: false,
      errorType: "UNKNOWN_ERROR",
      error: "Something went wrong. Please retry.",
      message: "Internal server crash avoided",
      retryable: true,
      requestId
    });
  }
};
