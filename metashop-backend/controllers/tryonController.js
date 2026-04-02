import { fal } from "@fal-ai/client";
import fs from "fs";

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

    const result = await fal.subscribe("flux-kontext/dev", {
      input: {
        image_url: userImage,
        reference_image_url: productImage,
        prompt: "A highly realistic photo of the same person wearing the selected outfit. Preserve face, body, and pose. Apply clothing naturally with proper alignment, realistic folds, and lighting. No distortion, no extra limbs, no cartoon style."
      }
    });

    // Handle common fal.ai response structures
    const outputUrl = result.data?.image?.url || result.data?.image_url || result.data?.images?.[0]?.url;

    return res.json({ resultUrl: outputUrl });

  } catch (error) {
    console.error("Fal API Error:", error.message || error);
    return res.status(500).json({ error: error.message || "Failed to generate Try-On" });
  }
};
