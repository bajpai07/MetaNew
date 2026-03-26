import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import cloudinary from "../utils/cloudinary.js";
import axios from "axios";
import { Readable } from "stream";

dotenv.config();

console.log('API Token Loaded:', !!process.env.HF_TOKEN);

let demoData = { demo_products: [] };
try {
  const demoDataPath = path.join(process.cwd(), 'utils', 'demoData.json');
  demoData = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));
  console.log('Demo Mode active: Loaded', demoData.demo_products.length, 'pre-cached products.');
} catch (e) {
  console.log("Demo Mode inactive: demoData.json missing or invalid.");
}

async function processAndUploadResult(imageData) {
  let uploadResult;

  if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    console.log("Processing base64 image...");
    uploadResult = await cloudinary.uploader.upload(imageData, {
      folder: 'metashop/try-on-results',
      format: 'jpg',
      transformation: [{ quality: 'auto' }]
    });

  } else if (typeof imageData === 'string' && imageData.startsWith('http')) {
    console.log("Downloading image from URL:", imageData);
    const response = await axios.get(imageData, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });
    const buffer = Buffer.from(response.data);
    
    uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'metashop/try-on-results', format: 'jpg' },
        (error, result) => error ? reject(error) : resolve(result)
      );
      Readable.from(buffer).pipe(uploadStream);
    });

  } else {
    throw new Error(`Unknown image format: ${typeof imageData}`);
  }

  console.log("Cloudinary upload success:", uploadResult.secure_url);
  return uploadResult.secure_url;
}

async function callHuggingFace(humanImageBase64, garmentImageBase64) {
  const HF_TOKEN = process.env.HF_TOKEN;
  const HF_SPACE_URL = process.env.HF_SPACE_URL || "https://yisol-idm-vton.hf.space"; 

  console.log("Waking up HF Space...");
  try {
    await fetch(HF_SPACE_URL, { 
      headers: { Authorization: `Bearer ${HF_TOKEN}` } 
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch(e) {
    console.log("Wake up ping failed but continuing:", e.message);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    console.log("Sending payload to HF Space...");
    const response = await fetch(`${HF_SPACE_URL}/api/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${HF_TOKEN}`
      },
      body: JSON.stringify({
        fn_index: 0,
        data: [
          { data: humanImageBase64, type: "base64" },
          { data: garmentImageBase64, type: "base64" },
          true,  
          true,  
          30,    
          42     
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("HF result keys:", Object.keys(result));
    
    let imageData;
    if (result.data && result.data[0]) {
      imageData = result.data[0];
    } else if (result.output) {
      imageData = result.output;
    } else {
      throw new Error(`Unexpected HF response format: ${JSON.stringify(result)}`);
    }

    // Unpack object if the Gradio response is dict-like
    if (typeof imageData === 'object' && imageData !== null) {
      if (imageData.url) imageData = imageData.url;
      else if (imageData.image) imageData = imageData.image;
      else if (imageData.path) imageData = `${HF_SPACE_URL}/file=${imageData.path}`;
    }

    return imageData;

  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('HF Space timed out after 2 minutes. Space may be sleeping.');
    }
    throw err;
  }
}

export const generateVTONController = async (req, res) => {
  try {
    console.log("=== TRY-ON START ===");
    console.log("1. Request received");
    console.log("   Body keys:", Object.keys(req.body));
    console.log("   Files:", req.files ? Object.keys(req.files) : "none");
    console.log("   HF_TOKEN exists:", !!process.env.HF_TOKEN);
    console.log("   CLOUDINARY set:", !!process.env.CLOUDINARY_API_SECRET);

    let { human_image, garment_image, product_name } = req.body;
    
    if (!human_image || !garment_image) {
      return res.status(400).json({ success: false, error: "Images required." });
    }

    const nameStr = String(product_name || '').toLowerCase();
    const demoProduct = demoData.demo_products.find(p => p.product_name.toLowerCase() === nameStr || nameStr.includes('demo'));
    if (demoProduct) {
        console.log(`[Demo] Serving instant pre-cached try-on for: ${demoProduct.product_name}`);
        return res.json({ success: true, resultUrl: demoProduct.pre_cached_result, fitScore: 99 });
    }

    console.log("2. Preparing and Calling Hugging Face API...");
    // Ensure base64 structures are correctly formatted
    if (!human_image.startsWith('data:image')) {
      if (human_image.startsWith('http')) {
          const hReq = await axios.get(human_image, { responseType: 'arraybuffer' });
          human_image = `data:image/jpeg;base64,${Buffer.from(hReq.data).toString('base64')}`;
      }
    }
    if (!garment_image.startsWith('data:image')) {
      if (garment_image.startsWith('http')) {
          const gReq = await axios.get(garment_image, { responseType: 'arraybuffer' });
          garment_image = `data:image/jpeg;base64,${Buffer.from(gReq.data).toString('base64')}`;
      }
    }

    const hfResultImage = await callHuggingFace(human_image, garment_image);

    console.log("5. Uploading to Cloudinary...");
    const cloudinaryUrl = await processAndUploadResult(hfResultImage);

    console.log("6. Sending result to frontend");
    return res.json({
      success: true,
      resultUrl: cloudinaryUrl,
      fitScore: 92
    });
    
  } catch (err) {
    console.error("=== TRY-ON FAILED ===");
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Error response:", err.response?.data);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: err.response?.data || "No details"
    });
  }
};

export const checkVTONStatus = async (req, res) => {
  res.status(404).json({ message: "Legacy polling removed. API is now synchronous." });
};
