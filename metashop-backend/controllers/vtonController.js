import { Client } from "@gradio/client";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import sharp from "sharp";
import fs from "fs";
import path from "path";

dotenv.config();

console.log('API Token Loaded:', !!process.env.HF_TOKEN);

// Global Fetch Polyfill for Hugging Face
if (process.env.HF_TOKEN && process.env.HF_TOKEN.startsWith('hf_')) {
  const originalFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    if (url.toString().includes('huggingface.co')) {
      options.headers = { ...options.headers, Authorization: `Bearer ${process.env.HF_TOKEN.trim()}` };
    }
    return originalFetch(url, options);
  };
}

const activeJobs = new Map();

const withExponentialBackoff = async (fn, maxRetries = 3, label = "Task") => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try { return await fn(); }
    catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 2000));
    }
  }
};

// ==========================================
// NEW: DEMO MODE INTEGRATION
// ==========================================
let demoData = { demo_products: [] };
try {
  const demoDataPath = path.join(process.cwd(), 'utils', 'demoData.json');
  demoData = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));
  console.log('Demo Mode active: Loaded', demoData.demo_products.length, 'pre-cached products.');
} catch (e) {
  console.log("Demo Mode inactive: demoData.json missing or invalid.");
}

export const generateVTONController = async (req, res) => {
  try {
    const { human_image, garment_image, garment_des, product_category, product_name, faceBox } = req.body;
    if (!human_image || !garment_image) return res.status(400).json({ message: "Images required." });

    const nameStr = String(product_name || '').toLowerCase();
    
    // DEMO CACHE INTERCEPTOR
    const demoProduct = demoData.demo_products.find(p => p.product_name.toLowerCase() === nameStr || nameStr.includes('demo'));
    if (demoProduct) {
        const jobId = uuidv4();
        console.log(`[Demo] Serving instant pre-cached try-on for: ${demoProduct.product_name}`);
        activeJobs.set(jobId, { status: "succeeded", output: [demoProduct.pre_cached_result] });
        return res.status(202).json({ success: true, predictionId: jobId, status: "starting" });
    }

    let final_description = garment_des || "photorealistic clothing";
    const jobId = uuidv4();
    activeJobs.set(jobId, { status: "starting" });

    let app = null;
    const isReplicate = process.env.HF_TOKEN && process.env.HF_TOKEN.startsWith('r8_');
    
    if (!isReplicate) {
      try {
        console.log(`[Job ${jobId}] Waking up Hugging Face Free Space...`);
        app = await withExponentialBackoff(() => Client.connect("yisol/IDM-VTON", { hf_token: process.env.HF_TOKEN }), 2);
      } catch (err) {
        // PRODUCTION UPGRADE: 202_WARMING_UP fallback instead of hard crash
        return res.status(202).json({ 
          success: false, 
          status: "202_WARMING_UP", 
          message: "AI Engine is warming up. Please hold on or retry shortly." 
        });
      }
    }

    res.status(202).json({ success: true, predictionId: jobId, status: "starting" });

    // Fire and forget target background task
    processVTONBackground(jobId, app, human_image, garment_image, final_description, faceBox, isReplicate).catch(err => {
      console.error(`[Job ${jobId}] Failed Background Generation:`, err.message);
      // UX Refinement: Override with generic failure to remove lockdown toast
      activeJobs.set(jobId, { 
        status: "failed", 
        error: `Generation Failed: ${err.message}`,
        fallback: true
      });
    });

  } catch (error) {
    console.error("VTON Init Error", error);
    // Generic fallback for any other crash
    res.status(202).json({ status: "202_WARMING_UP", message: "AI Engine is currently optimizing. Please try again." });
  }
};

const processVTONBackground = async (jobId, app, human_image, garment_image, garment_des, faceBox, isReplicate) => {
  activeJobs.set(jobId, { status: "processing" });
  const TARGET_WIDTH = 768;
  const TARGET_HEIGHT = 1024;

  let humanBuffer = human_image.startsWith('http') ? Buffer.from(await (await fetch(human_image)).arrayBuffer()) : Buffer.from(human_image.split(',')[1], 'base64');
  let garmentBuffer = garment_image.startsWith('http') ? Buffer.from(await (await fetch(garment_image)).arrayBuffer()) : Buffer.from(garment_image.split(',')[1], 'base64');

  const optimizedHumanBuffer = await sharp(humanBuffer).resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).normalize().modulate({ brightness: 1.05 }).jpeg({ quality: 90 }).toBuffer();
  const optimizedGarmentBuffer = await sharp(garmentBuffer).trim().resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).jpeg({ quality: 90 }).toBuffer();

  let outputImageUrl = null;

  if (isReplicate) {
    try {
      console.log(`[Job ${jobId}] Connecting to Replicate IDM-VTON API...`);
      const base64Human = `data:image/jpeg;base64,${optimizedHumanBuffer.toString('base64')}`;
      const base64Garment = `data:image/jpeg;base64,${optimizedGarmentBuffer.toString('base64')}`;
      
      const repReq = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: { "Authorization": `Token ${process.env.HF_TOKEN.trim()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4", // IDM-VTON Replicate Model
          input: { image: base64Human, garm_img: base64Garment, garment_des: garment_des }
        })
      });
      
      let repRes = await repReq.json();
      if (repRes.error || repRes.detail) throw new Error(repRes.error || repRes.detail);

      let pollUrl = repRes.urls.get;
      while (true) {
        await new Promise(r => setTimeout(r, 2500));
        let pollReq = await fetch(pollUrl, { headers: { "Authorization": `Token ${process.env.HF_TOKEN.trim()}` } });
        let pollData = await pollReq.json();
        if (pollData.status === "succeeded") {
          outputImageUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
          break;
        } else if (pollData.status === "failed") {
          throw new Error("Replicate Engine Failed internally");
        }
      }
    } catch (replicateErr) {
        console.error(`[Job ${jobId}] Replicate failed (${replicateErr.message}), falling back to FREE HuggingFace Space!`);
        console.log('--- FORCING INFERENCE ON UNVALIDATED PHOTO ---');
        
        // Re-connect to HuggingFace Free Space since this wasn't done for Replicate
        if (!app) {
           app = await withExponentialBackoff(() => Client.connect("yisol/IDM-VTON"), 2);
        }
        
        const result = await withExponentialBackoff(
          async () => await app.predict("/tryon", [ {"background":new Blob([optimizedHumanBuffer]),"layers":[],"composite":null}, new Blob([optimizedGarmentBuffer]), garment_des, true, false, 40, -1 ]), 3
        );
        outputImageUrl = result.data[0]?.url || result.data[0];
    }
  } else {
    // Legacy / Free Hugging Face Pipeline
    console.log(`[Job ${jobId}] Connecting to Hugging Face Free GPU...`);
    console.log('--- FORCING INFERENCE ON UNVALIDATED PHOTO ---');
    const result = await withExponentialBackoff(
      async () => await app.predict("/tryon", [ {"background":new Blob([optimizedHumanBuffer]),"layers":[],"composite":null}, new Blob([optimizedGarmentBuffer]), garment_des, true, false, 40, -1 ]), 3
    );
    outputImageUrl = result.data[0]?.url || result.data[0];
  }

  if (!outputImageUrl) throw new Error("AI Space returned empty image");

  let finalImageUrl = outputImageUrl;

  // STEP 2: POST-PROCESSING FACE PRESERVATION
  if (faceBox) {
    try {
      console.log(`[Job ${jobId}] Compositing original face back onto generated image...`);
      const generatedBuffer = Buffer.from(await (await fetch(outputImageUrl)).arrayBuffer());
      
      let extLeft = Math.max(0, Math.floor(faceBox.left * TARGET_WIDTH));
      let extTop = Math.max(0, Math.floor(faceBox.top * TARGET_HEIGHT));
      let extWidth = Math.floor(faceBox.width * TARGET_WIDTH);
      let extHeight = Math.floor(faceBox.height * TARGET_HEIGHT);

      if (extLeft + extWidth > TARGET_WIDTH) extWidth = TARGET_WIDTH - extLeft;
      if (extTop + extHeight > TARGET_HEIGHT) extHeight = TARGET_HEIGHT - extTop;

      const faceBuffer = await sharp(optimizedHumanBuffer).extract({ left: extLeft, top: extTop, width: extWidth, height: extHeight }).toBuffer();
      const compositedBuffer = await sharp(generatedBuffer).composite([{ input: faceBuffer, left: extLeft, top: extTop, blend: 'over' }]).jpeg({ quality: 90 }).toBuffer();

      finalImageUrl = `data:image/jpeg;base64,${compositedBuffer.toString('base64')}`;
      console.log(`[Job ${jobId}] Face preservation completed successfully!`);
    } catch (err) {
      console.error(`[Job ${jobId}] Face Compositing Failed:`, err.message);
    }
  }
  
  console.log(`[Job ${jobId}] Success! Image Generated.`);
  activeJobs.set(jobId, { status: "succeeded", output: [finalImageUrl] });
};

export const checkVTONStatus = async (req, res) => {
  try {
    const job = activeJobs.get(req.params.id);
    if (!job) return res.status(404).json({ message: "Prediction ID not found or Expired." });
    res.status(200).json({ success: true, status: job.status, output: job.output, error: job.error });
    if (job.status === 'succeeded' || job.status === 'failed') setTimeout(() => activeJobs.delete(req.params.id), 10000); 
  } catch (error) {
    res.status(500).json({ message: "Status check failed", error: error.message });
  }
};
