import { Client } from "@gradio/client";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import { Readable } from 'stream';

/**
 * 2nd Step: Image Enhancement via Hugging Face Inference API
 */
async function enhanceImage(imageUrl) {
  try {
    console.log("=== ENHANCEMENT START ===");

    // 1. Download the generated image as a buffer
    const imgResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });
    
    // 2. Query Hugging Face Image-to-Image API
    console.log("Calling Hugging Face Image-to-Image model...");
    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-refiner-1.0",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: Buffer.from(imgResponse.data).toString("base64"),
          parameters: {
            prompt: "Enhance this image to look photorealistic. Improve fabric folds, lighting consistency, shadows, and blending. Do not change face or body. Keep clothing design exactly the same.",
            negative_prompt: "cartoon, illustration, artificial, poorly drawn, bad anatomy, deformed limbs",
            strength: 0.25, // low strength to enhance texture without altering the image layout
            guidance_scale: 7.5
          },
        }),
      }
    );

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      throw new Error(`HF API Error (${hfResponse.status}): ${errText}`);
    }

    // 3. Upload enhanced result to Cloudinary
    const enhancedBuffer = await hfResponse.arrayBuffer();
    
    console.log("Uploading enhanced image to Cloudinary...");
    const cloudinaryUrl = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "metashop/try-on-enhanced", format: "jpg" },
        (error, result) => (error ? reject(error) : resolve(result.secure_url))
      );
      Readable.from(Buffer.from(enhancedBuffer)).pipe(uploadStream);
    });

    console.log("=== ENHANCEMENT SUCCESS ===");
    return cloudinaryUrl;

  } catch (err) {
    console.error("Enhancement failed, falling back to original image:", err.message);
    // Fallback: return original IDM-VTON image URL if enhancement fails
    return imageUrl; 
  }
}

export const generateTryOn = async (req, res) => {
  try {
    console.log("=== VTON START ===");

    const humanImageFile = req.files?.humanImage?.[0];
    const garmentImageUrl = req.body.garmentImageUrl;

    if (!humanImageFile) {
      return res.status(400).json({ 
        success: false, 
        error: "Human image required" 
      });
    }

    if (!garmentImageUrl) {
      return res.status(400).json({ 
        success: false, 
        error: "Garment image URL required" 
      });
    }

    console.log("1. Files received OK");
    console.log("   Human image:", humanImageFile.originalname);
    console.log("   Garment URL:", garmentImageUrl);

    // Download garment image to temp file
    const garmentResponse = await axios.get(garmentImageUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });
    const garmentBuffer = Buffer.from(garmentResponse.data);
    const garmentBlob = new Blob([garmentBuffer], { type: 'image/jpeg' });

    // Human image blob
    const humanBuffer = fs.readFileSync(humanImageFile.path);
    const humanBlob = new Blob([humanBuffer], { type: humanImageFile.mimetype });

    console.log("2. Connecting to HF Space...");

    // Connect to HF Space with token
    const client = await Client.connect("yisol/IDM-VTON", {
      hf_token: process.env.HF_TOKEN,
    });

    console.log("3. HF Space connected. Sending prediction...");

    const result = await client.predict("/tryon", [
      { background: humanBlob, layers: [], composite: null }, // human image dict
      garmentBlob,   // garment image
      "A person wearing the garment",  // description
      true,          // is_checked
      true,          // is_checked_crop
      30,            // denoise_steps
      42             // seed
    ]);

    console.log("4. HF result received");

    if (!result?.data?.[0]) {
      throw new Error("Empty response from HF Space");
    }

    // Get result image
    const resultImage = result.data[0];
    let originalCloudinaryUrl;

    if (resultImage?.url) {
      console.log("5. Downloading original VTON result from:", resultImage.url);
      const imgResponse = await axios.get(resultImage.url, { 
        responseType: 'arraybuffer',
        timeout: 30000
      });
      const imgBuffer = Buffer.from(imgResponse.data);
      
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'metashop/try-on-results', format: 'jpg' },
          (error, result) => error ? reject(error) : resolve(result)
        );
        Readable.from(imgBuffer).pipe(uploadStream);
      });
      originalCloudinaryUrl = uploadResult.secure_url;

    } else if (typeof resultImage === 'string' && resultImage.startsWith('data:')) {
      console.log("5. Uploading base64 original VTON result to Cloudinary...");
      const uploadResult = await cloudinary.uploader.upload(resultImage, {
        folder: 'metashop/try-on-results',
        format: 'jpg'
      });
      originalCloudinaryUrl = uploadResult.secure_url;
    } else {
      throw new Error(`Unknown result format`);
    }

    console.log("6. Original Cloudinary URL:", originalCloudinaryUrl);

    // Cleanup temp human image file
    if (humanImageFile.path && fs.existsSync(humanImageFile.path)) {
      fs.unlinkSync(humanImageFile.path);
    }

    // --- NEW: Enhancement Post-Processing Step ---
    console.log("7. Starting AI Image Enhancement...");
    const finalImageUrl = await enhanceImage(originalCloudinaryUrl);

    return res.json({
      success: true,
      originalUrl: originalCloudinaryUrl,
      resultUrl: finalImageUrl,
      fitScore: Math.floor(Math.random() * 8) + 88 // 88-95%
    });

  } catch (err) {
    console.error("=== VTON FAILED ===");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);

    return res.status(500).json({
      success: false,
      error: err.message,
      details: err.toString()
    });
  }
};

export const checkVTONStatus = async (req, res) => {
  res.status(404).json({ message: "Legacy polling removed. API is now synchronous." });
};
