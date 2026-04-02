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

    if (!userImage || !productImage) {
      return res.status(400).json({ 
        success: false, 
        error: "humanImage and garmentImageUrl are required" 
      });
    }

    console.log("FAL KEY:", process.env.FAL_KEY ? "Loaded" : "Missing");
    console.log("Calling true fal-ai IDM-VTON model...");

    const result = await fal.subscribe("fal-ai/idm-vton", {
      input: {
        human_image_url: userImage,
        garment_image_url: productImage,
        description: "A highly realistic photo of the same person wearing the selected outfit. Preserve face, body, and pose. Apply clothing naturally with proper alignment, realistic folds, and lighting. No distortion, no extra limbs, no cartoon style."
      }
    });

    const finalUrl = result?.data?.image?.url || result?.data?.image_url || result?.data?.images?.[0]?.url || result?.data?.url;

    return res.json({ 
      success: true, 
      imageUrl: finalUrl,
      resultUrl: finalUrl
    });

  } catch (err) {
    console.error("FAL ERROR:", err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || "Fal API failed" 
    });
  }
};
