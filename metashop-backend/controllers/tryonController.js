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

    const result = await fal.subscribe(
      "fal-ai/fashn/tryon/v1.6",
      {
        input: {
          model_image: userImage,
          garment_image: productImage,
          category: "auto",
          mode: "quality",
          garment_photo_type: "auto",
          nsfw_filter: true,
          adjust_hands: true,
          restore_background: true,
          restore_clothes: true
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log("Status:", update.status);
        }
      }
    );

    const finalUrl =
      result.data?.images?.[0]?.url ||
      result.data?.image?.url ||
      result.data?.output?.[0];

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
