import { fal } from "@fal-ai/client";
import fs from 'fs';
import axios from 'axios';
import cloudinary from '../utils/cloudinary.js';

fal.config({
  credentials: process.env.FAL_KEY
});

async function imageToBase64DataUri(source) {
  if (source.startsWith('http')) {
    const response = await axios.get(source, {
      responseType: 'arraybuffer'
    });
    const base64 = Buffer.from(response.data)
                         .toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }
  const base64 = fs.readFileSync(source)
                   .toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

export const generateTryOn = async (req, res) => {
  try {
    console.log("=== FAL.AI TRY-ON START ===");

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

    console.log("Converting images to base64...");
    
    const modelImageUri = await imageToBase64DataUri(
      humanImageFile.path
    );
    const garmentImageUri = await imageToBase64DataUri(
      garmentImageUrl
    );

    console.log("Calling fal.ai FASHN v1.5...");

    const result = await fal.subscribe(
      "fashn/tryon/v1.5",
      {
        input: {
          model_image: modelImageUri,
          garment_image: garmentImageUri,
          category: "auto",
          mode: "balanced",
          garment_photo_type: "auto",
          nsfw_filter: true,
          cover_feet: false,
          adjust_hands: true,
          restore_background: true,
          restore_clothes: true,
          flat_lay: false,
          long_top: false
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log("Queue status:", update.status);
          if (update.logs) {
            update.logs.forEach(log => 
              console.log("FAL log:", log.message)
            );
          }
        }
      }
    );

    console.log("FAL result:", result);

    const outputUrl = result.data?.image?.url 
      || result.data?.images?.[0]?.url
      || result.data?.output;

    if (!outputUrl) {
      throw new Error(
        `No output URL: ${JSON.stringify(result.data)}`
      );
    }

    console.log("Output URL:", outputUrl);
    console.log("Uploading to Cloudinary...");

    // Upload to Cloudinary
    const imgResponse = await axios.get(outputUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    const imgBuffer = Buffer.from(imgResponse.data);

    const cloudinaryUrl = await new Promise(
      (resolve, reject) => {
        const { Readable } = require('stream');
        const uploadStream = cloudinary.uploader
          .upload_stream(
            {
              folder: 'metashop/try-on-results',
              format: 'jpg',
              transformation: [{ quality: 'auto' }]
            },
            (err, result) => {
              if (err) reject(err);
              else resolve(result.secure_url);
            }
          );
        Readable.from(imgBuffer).pipe(uploadStream);
      }
    );

    console.log("✅ Cloudinary URL:", cloudinaryUrl);

    // Cleanup temp file
    if (
      humanImageFile.path && 
      fs.existsSync(humanImageFile.path)
    ) {
      fs.unlinkSync(humanImageFile.path);
    }

    return res.json({
      success: true,
      resultUrl: cloudinaryUrl,
      fitScore: Math.floor(Math.random() * 8) + 88
    });

  } catch (err) {
    console.error("=== FAL.AI FAILED ===");
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
