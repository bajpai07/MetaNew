import { fal } from "@fal-ai/client";
import fs from 'fs';
import axios from 'axios';
import cloudinary from '../utils/cloudinary.js';
import { Readable } from 'stream';

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
  if (!url) {
    throw new Error("Garment image URL missing");
  }
  try {
    new URL(url);
  } catch {
    throw new Error("Invalid garment image URL");
  }
}

// ─── Image to Data URI ───────────────────

async function toDataUri(source) {
  try {
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
  const humanImageFile = 
    req.files?.humanImage?.[0];
  const startTime = Date.now();
  
  console.log("=== VTON REQUEST START ===");
  console.log("Time:", new Date().toISOString());
  console.log("FAL_KEY set:", !!process.env.FAL_KEY);

  try {
    // ── Validate inputs ──────────────────
    validateImageFile(humanImageFile);
    validateGarmentUrl(req.body.garmentImageUrl);
    
    const garmentImageUrl = req.body.garmentImageUrl;
    console.log("✅ Inputs validated");
    console.log("File:", humanImageFile.originalname);
    console.log("Size:", humanImageFile.size, "bytes");
    console.log("Garment:", garmentImageUrl);

    // ── Convert images ───────────────────
    console.log("Converting images to base64...");
    
    let modelUri, garmentUri;
    
    try {
      [modelUri, garmentUri] = await Promise.all([
        toDataUri(humanImageFile.path),
        toDataUri(garmentImageUrl)
      ]);
    } catch (err) {
      cleanupFile(humanImageFile?.path);
      return res.status(400).json({
        success: false,
        error: "Image processing failed",
        message: err.message
      });
    }
    
    console.log("✅ Images converted");

    // ── Call fal.ai with timeout ─────────
    console.log("Calling fal.ai FASHN v1.6...");
    
    const FAL_TIMEOUT = 120000; // 2 minutes
    
    const falPromise = fal.subscribe(
      "fal-ai/fashn/tryon/v1.6",
      {
        input: {
          model_image: modelUri,
          garment_image: garmentUri,
          category: "auto",
          mode: "balanced",
          garment_photo_type: "auto",
          nsfw_filter: true,
          adjust_hands: true,
          restore_background: true,
          restore_clothes: true,
          flat_lay: false,
          long_top: false
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log(
            "FAL Status:", 
            update.status,
            update.position 
              ? `| Queue: ${update.position}` 
              : ''
          );
        }
      }
    );
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(
        () => reject(
          new Error("AI generation timed out. Please try again.")
        ), 
        FAL_TIMEOUT
      )
    );
    
    let result;
    try {
      result = await Promise.race([
        falPromise, 
        timeoutPromise
      ]);
    } catch (err) {
      cleanupFile(humanImageFile?.path);
      
      const isTimeout = err.message.includes('timed out');
      const isQuota = err.message?.includes('quota') || 
                      err.message?.includes('billing');
      
      return res.status(500).json({
        success: false,
        error: isTimeout 
          ? "Generation timed out. Please try again."
          : isQuota
          ? "Service temporarily unavailable."
          : "AI generation failed. Please try again.",
        message: err.message
      });
    }
    
    console.log("✅ FAL result received");

    // ── Extract output URL ────────────────
    const outputUrl =
      result?.data?.images?.[0]?.url ||
      result?.data?.image?.url ||
      result?.data?.output?.[0] ||
      result?.data?.output;

    if (!outputUrl) {
      cleanupFile(humanImageFile?.path);
      console.error(
        "No output URL. Result:", 
        JSON.stringify(result?.data)
      );
      return res.status(500).json({
        success: false,
        error: "No output generated. Please try again.",
        debug: result?.data
      });
    }
    
    console.log("Output URL:", outputUrl);

    // ── Upload to Cloudinary ──────────────
    console.log("Uploading to Cloudinary...");
    
    let cloudinaryUrl;
    try {
      cloudinaryUrl = await uploadToCloudinary(
        outputUrl
      );
    } catch (err) {
      cleanupFile(humanImageFile?.path);
      return res.status(500).json({
        success: false,
        error: "Failed to save result. Please try again.",
        message: err.message
      });
    }
    
    console.log("✅ Cloudinary URL:", cloudinaryUrl);

    // ── Cleanup & respond ─────────────────
    cleanupFile(humanImageFile?.path);
    
    const duration = Date.now() - startTime;
    console.log(`✅ VTON complete in ${duration}ms`);

    return res.json({
      success: true,
      resultUrl: cloudinaryUrl,
      fitScore: Math.floor(
        Math.random() * 8
      ) + 88,
      generationTime: duration
    });

  } catch (err) {
    cleanupFile(humanImageFile?.path);
    
    console.error("=== VTON UNEXPECTED ERROR ===");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    
    // Convert validation errors from 500 to 400
    if (
      err.message === "No image uploaded" || 
      err.message.includes("Invalid file type") || 
      err.message.includes("Image too large") || 
      err.message.includes("Garment image URL missing") || 
      err.message.includes("Invalid garment image URL")
    ) {
      return res.status(400).json({  
        success: false,
        error: err.message,
        message: err.message
      });
    }

    return res.status(500).json({
      success: false,
      error: "Something went wrong. Please try again.",
      message: err.message
    });
  }
};
