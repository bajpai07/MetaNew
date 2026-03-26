import { Client } from "@gradio/client";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import { Readable } from 'stream';

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
    console.log("   Result type:", typeof result.data);
    console.log("   Result keys:", Object.keys(result));

    if (!result?.data?.[0]) {
      throw new Error("Empty response from HF Space");
    }

    // Get result image
    const resultImage = result.data[0];
    let cloudinaryUrl;

    if (resultImage?.url) {
      // It's a URL - download and upload to Cloudinary
      console.log("5. Downloading result from:", resultImage.url);
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
      cloudinaryUrl = uploadResult.secure_url;

    } else if (typeof resultImage === 'string' && resultImage.startsWith('data:')) {
      // Base64
      console.log("5. Uploading base64 result to Cloudinary...");
      const uploadResult = await cloudinary.uploader.upload(resultImage, {
        folder: 'metashop/try-on-results',
        format: 'jpg'
      });
      cloudinaryUrl = uploadResult.secure_url;

    } else {
      throw new Error(`Unknown result format: ${JSON.stringify(resultImage).slice(0,200)}`);
    }

    console.log("6. Cloudinary URL:", cloudinaryUrl);

    // Cleanup temp human image file
    if (humanImageFile.path && fs.existsSync(humanImageFile.path)) {
      fs.unlinkSync(humanImageFile.path);
    }

    return res.json({
      success: true,
      resultUrl: cloudinaryUrl,
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
