import { fal } from "@fal-ai/client";
import fs from "fs";

fal.config({
  credentials: process.env.FAL_KEY
});

export const generateTryOn = async (req, res) => {
  try {
    let userImage = req.body.humanImage;
    const productImage = req.body.garmentImageUrl;
    const userImageFile = req.files?.humanImage?.[0];

    // Read local file upload to base64 Data URI if needed
    if (userImageFile && !userImage) {
      const buffer = fs.readFileSync(userImageFile.path);
      userImage = `data:${userImageFile.mimetype};base64,${buffer.toString("base64")}`;
      fs.unlinkSync(userImageFile.path);
    }

    // VALIDATE INPUT BEFORE CALL
    if (!userImage || !productImage) {
      return res.status(400).json({ 
        success: false, 
        error: "humanImage and garmentImageUrl are required" 
      });
    }

    // ADD DEBUG LOGGING
    console.log("FAL KEY:", process.env.FAL_KEY ? "Loaded" : "Missing");
    console.log("Calling fal model...");

    const result = await fal.subscribe("fal-ai/flux-kontext/dev", {
      input: {
        image_url: userImage,
        reference_image_url: productImage,
        prompt: "A highly realistic photo of the same person wearing the selected outfit. Preserve face, body, and pose. Apply clothing naturally with proper alignment, realistic folds, and lighting. No distortion, no extra limbs, no cartoon style."
      }
    });

    // Ensure fallback safety for different fal JSON structures
    const finalUrl = result?.data?.images?.[0]?.url || result?.data?.image?.url || result?.data?.image_url;

    return res.json({ 
      success: true, 
      imageUrl: finalUrl,
      resultUrl: finalUrl // Retained securely for frontend compatibility since frontend changes were forbidden
    });

  } catch (err) {
    console.error("FAL ERROR:", err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || "Fal API failed" 
    });
  }
};
