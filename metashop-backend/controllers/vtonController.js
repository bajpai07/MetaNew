import { Client } from "@gradio/client";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import sharp from "sharp";

dotenv.config();

console.log('HF Token Loaded:', !!process.env.HF_TOKEN);

// The Elite Backup: Force Global Fetch Authorization Injection
// @gradio/client historically drops hf_token on ZeroGPU spaces when communicating with internal Hugging Face APIs.
// This forcibly injects your Bearer token into all outgoing hardware requests.
if (process.env.HF_TOKEN) {
  const originalFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    if (url.toString().includes('huggingface.co')) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${process.env.HF_TOKEN.trim().replace(/^Bearer\s+/i, '')}`
      };
    }
    return originalFetch(url, options);
  };
  console.log('--- GLOBAL FETCH POLYFILL ACTIVATED WITH HF_TOKEN ---');
}

// In-Memory Job Tracker to seamlessly maintain the frontend's polling logic
// Structure: { [jobId]: { status: 'starting' | 'processing' | 'succeeded' | 'failed', output?: string, error?: string } }
const activeJobs = new Map();

/**
 * Helper: Convert a Base64 string to a Blob
 */
const base64ToBlob = (base64) => {
  const parts = base64.split(';base64,');
  const mimeType = parts[0].split(':')[1];
  const bstr = Buffer.from(parts[1], 'base64').toString('binary');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mimeType });
};

const urlToBlob = async (url) => {
  const response = await fetch(url);
  return await response.blob();
};

/**
 * Helper: Exponential Backoff for resilient API calls
 */
const withExponentialBackoff = async (fn, maxRetries = 3, label = "Task") => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      const msg = error.message || String(error);
      
      // Do not retry explicitly blocked limits like ZeroGPU if we already know they are fatal
      if (msg.includes("ZeroGPU quotas")) {
        throw error;
      }

      console.warn(`[Backoff] ${label} failed: ${msg}. Retry ${attempt}/${maxRetries}`);
      if (attempt >= maxRetries) throw error;
      
      const ms = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s
      await new Promise(r => setTimeout(r, ms));
    }
  }
};

export const generateVTON = async (req, res) => {
  try {
    const { human_image, garment_image } = req.body;

    if (!human_image || !garment_image) {
      return res.status(400).json({ message: "Both human_image and garment_image are required." });
    }

    // Assign a UUID to act as the "Prediction ID" for the frontend to poll
    const jobId = uuidv4();
    activeJobs.set(jobId, { status: "starting" });

    // Respond immediately to free up the HTTP connection and allow frontend polling
    res.status(202).json({ 
      success: true, 
      predictionId: jobId,
      status: "starting" 
    });

    // Start background processing
    activeJobs.set(jobId, { status: "processing" });

    // 1. Process Images into Blobs (Gradio expects Native Blobs)
    let humanBlob, garmentBlob;
    
    // Process Human Image
    if (human_image.startsWith('data:image')) {
      humanBlob = base64ToBlob(human_image);
    } else if (human_image.startsWith('http')) {
      humanBlob = await urlToBlob(human_image);
    } else {
      throw new Error("Invalid human_image format. Must be Base64 or URL.");
    }

    // Process Garment Image
    if (garment_image.startsWith('data:image')) {
      garmentBlob = base64ToBlob(garment_image);
    } else if (garment_image.startsWith('http')) {
      garmentBlob = await urlToBlob(garment_image);
    } else {
      // Handle relative URLs (e.g. from local assets in React)
      const absUrl = garment_image.startsWith('/') 
        ? `http://localhost:3000${garment_image}` // Assuming frontend is on 3000
        : garment_image;
      garmentBlob = await urlToBlob(absUrl);
    }

    // 2. Connect to Hugging Face Space (Circuit Breaker logic)
    console.log(`[Job ${jobId}] Connecting to yisol/IDM-VTON space...`);
    let app;
    try {
      app = await Client.connect("yisol/IDM-VTON");
    } catch (connectionError) {
      console.error("Gradio Connection Error:", connectionError);
      throw new Error("AI Space is warming up. Please try again in 30 seconds.");
    }

    // 3. Execute the Prediction
    console.log(`[Job ${jobId}] Running Prediction...`);
    const result = await app.predict("/tryon", [
      {"background":humanBlob,"layers":[],"composite":null}, // dict in 'image' Image component
      garmentBlob, // blob in 'Garment' Image component
      "photorealistic clothing", // string  in 'Garment Description' Textbox component
      true, // boolean  in 'Yes, the image of model has faces' Checkbox component
      false, // boolean  in 'Yes, you want to use auto-crop function' Checkbox component
      30, // number (numeric value between 20 and 40) in 'Denoising Steps' Slider component
      42, // number (numeric value between -1 and 2147483647) in 'Seed' Slider component
    ]);

    // Gradio returns the output. The primary image is usually the first element in the returned array depending on the space's specific return signature.
    // For yisol/IDM-VTON, index 0 is typically the final image URL generated by the space server.
    const outputImageUrl = Array.isArray(result.data) ? result.data[0].url : result.data;
    
    console.log(`[Job ${jobId}] Success!`);
    
    // 4. Update memory tracker with success (Array formatting matches what Replicate previously returned)
    activeJobs.set(jobId, { 
      status: "succeeded",
      output: [outputImageUrl]
    });

  } catch (error) {
    console.error("VTON Generation Background Error:", error);
    // Find the jobId from memory if it exists (meaning the error happened after ID creation)
    // In this scoped try-catch, if jobId exists, update it.
    // Hacky but safe way to handle background errors since res is already sent:
    // We iterate activeJobs to see which ones are 'processing' (this is a simplified single-server approach).
    // Better yet, just catch it cleanly if we wrap the background part in a closure.
  }
};

// Background worker wrapper to cleanly catch errors for specific jobs
export const generateVTONController = async (req, res) => {
  try {
    console.log('--- SYSTEM CHECK: HF_TOKEN is', process.env.HF_TOKEN ? 'LOADED' : 'MISSING', '---');

    const { human_image, garment_image, garment_des, product_category, product_name } = req.body;

    if (!human_image || !garment_image) {
      return res.status(400).json({ message: "Both human_image and garment_image are required." });
    }

    // Fuzzy Category Validation
    const catStr = String(product_category || '').toLowerCase();
    const nameStr = String(product_name || '').toLowerCase();
    
    console.log('Validating Category for:', product_category, product_name);

    const allowedCategories = ['dress', 'shirt', 't-shirt', 'top', 'kurta', 'clothing', 'bottom', 'pants', 'trousers', 'jeans', 'skirt', 'jacket', 'coat', 'sweater', 'hoodie'];
    const isValid = allowedCategories.some(cat => catStr.includes(cat) || nameStr.includes(cat));
    
    if (!isValid && (product_category || product_name)) {
        return res.status(400).json({ message: "AI Try-on is only available for clothing items" });
    }

    // The 'Dress' Exception Prompt Steering
    let final_description = garment_des || "photorealistic clothing";
    if (nameStr.includes('dress') || catStr.includes('dress') || nameStr.includes('kurta')) {
        final_description = `full-body dress, upper_body and lower_body, ${final_description}`;
        console.log("Applied Dress Exception to prompt.");
    }

    const jobId = uuidv4();
    activeJobs.set(jobId, { status: "starting" });

    // Attempt to Wake Up / Connect to Hugging Face Free Space before accepting the job
    let app;
    try {
      console.log(`[Job ${jobId}] Waking up Hugging Face Space yisol/IDM-VTON...`);
      app = await withExponentialBackoff(
        () => Client.connect("yisol/IDM-VTON", { 
          hf_token: process.env.HF_TOKEN ? process.env.HF_TOKEN.trim() : undefined 
        }),
        3,
        `Connect to space yisol/IDM-VTON`
      );
    } catch (connectionError) {
      console.error("Gradio Connection Error:", connectionError);
      return res.status(503).json({ message: "AI Engine is Warming Up. Please retry in 60 seconds." });
    }

    res.status(202).json({ 
      success: true, 
      predictionId: jobId,
      status: "starting" 
    });

    // Fire and forget background process
    processVTONBackground(jobId, app, human_image, garment_image, final_description).catch(err => {
      console.error('HF_ERROR_RAW:', err);
      let errorMsg = err.message || "An unknown error occurred during generation.";
      if (errorMsg.includes("ZeroGPU quotas") || (err.message && err.message.includes("ZeroGPU"))) {
          errorMsg = "Hugging Face Free GPU rate limit reached. " + errorMsg;
      }
      console.error(`[Job ${jobId}] Failed:`, errorMsg);
      activeJobs.set(jobId, { 
        status: "failed", 
        error: errorMsg 
      });
    });

  } catch (error) {
    console.error("VTON Initial Error:", error);
    res.status(500).json({ message: "Failed to initialize VTON", error: error.message });
  }
};

const processVTONBackground = async (jobId, app, human_image, garment_image, garment_des) => {
  activeJobs.set(jobId, { status: "processing" });

  // Native IDM-VTON resolution
  const TARGET_WIDTH = 768;
  const TARGET_HEIGHT = 1024;

  let humanBuffer, garmentBuffer;
  
  if (human_image.startsWith('data:image')) {
    const parts = human_image.split(';base64,');
    humanBuffer = Buffer.from(parts[1], 'base64');
  } else if (human_image.startsWith('http')) {
    const response = await fetch(human_image);
    humanBuffer = Buffer.from(await response.arrayBuffer());
  } else {
    throw new Error("Invalid human_image format.");
  }

  if (garment_image.startsWith('data:image')) {
    const parts = garment_image.split(';base64,');
    garmentBuffer = Buffer.from(parts[1], 'base64');
  } else if (garment_image.startsWith('http')) {
    const response = await fetch(garment_image);
    garmentBuffer = Buffer.from(await response.arrayBuffer());
  } else {
    const absUrl = garment_image.startsWith('/') ? `http://localhost:3000${garment_image}` : garment_image;
    const response = await fetch(absUrl);
    garmentBuffer = Buffer.from(await response.arrayBuffer());
  }

  console.log(`[Job ${jobId}] Resizing images to ${TARGET_WIDTH}x${TARGET_HEIGHT} via sharp...`);
  
  const optimizedHumanBuffer = await sharp(humanBuffer)
    .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 90 })
    .toBuffer();

  const optimizedGarmentBuffer = await sharp(garmentBuffer)
    .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .jpeg({ quality: 90 })
    .toBuffer();

  const humanBlob = new Blob([optimizedHumanBuffer], { type: "image/jpeg" });
  const garmentBlob = new Blob([optimizedGarmentBuffer], { type: "image/jpeg" });



  console.log(`[Job ${jobId}] Running Prediction with Fidelity-First Params & Retry Logic...`);
  console.log('--- ATTEMPTING PREDICTION WITH TOKEN LENGTH:', process.env.HF_TOKEN ? process.env.HF_TOKEN.trim().length : 0, '---');
  const result = await withExponentialBackoff(
    async () => await app.predict("/tryon", [
      {"background":humanBlob,"layers":[],"composite":null},
      garmentBlob,
      garment_des,
      true, // has faces
      false, // auto-crop (we manually resized via sharp to preserve scale)
      40, // Max allowed by Hugging Face Space is 40
      -1, // Random seed for unique generations rather than locked
    ]),
    3,
    `Predict API /tryon`
  );

  const outputImageUrl = result.data[0]?.url || result.data[0];
  
  if (!outputImageUrl) {
      throw new Error("AI Space returned empty image array");
  }

  console.log(`[Job ${jobId}] Success! Image Generated.`);
  activeJobs.set(jobId, { status: "succeeded", output: [outputImageUrl] });
};


export const checkVTONStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Prediction ID is required." });
    }

    const job = activeJobs.get(id);

    if (!job) {
      return res.status(404).json({ message: "Prediction ID not found or expired." });
    }

    res.status(200).json({
      success: true,
      status: job.status,
      output: job.output, 
      error: job.error
    });

    // Optional: Clean up memory once succeeded or failed
    if (job.status === 'succeeded' || job.status === 'failed') {
        // give frontend a few seconds to fetch it multiple times if necessary due to react strict mode double firing
        setTimeout(() => activeJobs.delete(id), 10000); 
    }

  } catch (error) {
    console.error("VTON Status Check Error:", error);
    res.status(500).json({ message: "Failed to check VTON status", error: error.message });
  }
};
