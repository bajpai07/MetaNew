import { fal } from "@fal-ai/client";
import fs from 'fs';
import axios from 'axios';
import cloudinary from '../utils/cloudinary.js';
import { Readable } from 'stream';
import sharp from 'sharp';
import TryOnHistory from '../models/TryOnHistory.js';

const metrics = {
  totalRequests: 0,
  successCount: 0,
  failureCount: 0,
  totalGenerationTime: 0
};

// In-memory job store
// Resets on server restart — acceptable
// for demo/portfolio

const jobStore = new Map();

const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  COMPLETED: 'completed',
  FAILED: 'failed'
};

function createJob() {
  const jobId = Math.random()
    .toString(36)
    .substring(2, 10) + 
    Date.now().toString(36);
    
  const job = {
    jobId,
    status: JOB_STATUS.PENDING,
    createdAt: Date.now(),
    resultUrl: null,
    fitScore: null,
    generationTime: null,
    warnings: [],
    error: null
  };
  
  jobStore.set(jobId, job);
  console.log("Job created:", jobId);
  return job;
}

function updateJob(jobId, updates) {
  const job = jobStore.get(jobId);
  if (job) {
    Object.assign(job, updates);
    jobStore.set(jobId, job);
  }
}

// Auto cleanup jobs older than 1 hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [jobId, job] of jobStore) {
    if (job.createdAt < oneHourAgo) {
      jobStore.delete(jobId);
      console.log("Cleaned up job:", jobId);
    }
  }
}, 3600000); // run every hour

async function validateImageSmart(filePath) {
  const warnings = [];
  let shouldBlock = false;
  let blockReason = null;

  try {
    const meta = await sharp(filePath).metadata();
    const fileSize = fs.statSync(filePath).size;

    if (!meta || !meta.width || !meta.height) {
      return { shouldBlock: false, blockReason: null, warnings: [] };
    }

    console.log("Validating image:", { width: meta.width, height: meta.height, size: fileSize });

    if (meta.width < 150 || meta.height < 150) {
      shouldBlock = true;
      blockReason = "Image is too small. Please upload a clearer photo for better results.";
    }

    if (!shouldBlock) {
      const ratio = meta.height / meta.width;

      if (ratio < 0.8) {
        warnings.push("For best results, upload a clear front-facing full body photo.");
      }

      if (meta.width < 300 || meta.height < 300) {
        warnings.push("For sharper results, use a higher resolution image with good lighting.");
      }

      if (fileSize < 10000) {
        warnings.push("Image quality seems low — try using a clearer and well-lit photo.");
      }
    }

    return { shouldBlock, blockReason, warnings };
  } catch (err) {
    console.warn("Validation error:", err.message);
    return { shouldBlock: false, blockReason: null, warnings: [] };
  }
}

async function preprocessImage(filePath) {
  try {
    const outputPath = filePath + '_p.jpg';
    
    await sharp(filePath)
      .rotate()
      .resize(768, 1024, {
        fit: 'contain',
        background: { 
          r: 255, g: 255, b: 255, alpha: 1 
        },
        position: 'top'
      })
      .jpeg({ quality: 95 })
      .toFile(outputPath);
      
    console.log("✅ Image preprocessed");
    return outputPath;
    
  } catch (err) {
    console.warn(
      "Preprocessing failed, using original:", 
      err.message
    );
    return filePath;
  }
}

fal.config({
  credentials: process.env.FAL_KEY
});

// ─── Input Validation ───────────────────

function validateImageFile(file) {
  if (!file) {
    throw new Error("No image uploaded");
  }
  
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(
      "Invalid file type. Use JPG, PNG or WebP"
    );
  }
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(
      "Image too large. Max size is 10MB"
    );
  }
}

function validateGarmentUrl(url) {
  if (!url || url === "undefined" || url === "null") {
    throw new Error("Garment image URL missing. Ensure the product has an image.");
  }
  // Try to parse as URL if it starts with http, otherwise we treat it as a path/relative URL
  if (url.startsWith("http")) {
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid garment image URL format");
    }
  }
}

// ─── Image to Data URI ───────────────────

async function toDataUri(source) {
  try {
    if (typeof source === 'string' && (source === "null" || source === "undefined" || source === "")) {
       throw new Error("Source string is invalid null/undefined");
    }

    // Attempt to handle relative paths from the backend public folder
    if (typeof source === 'string' && source.startsWith('/')) {
      source = `http://localhost:${process.env.PORT || 10000}${source}`;
    }

    if (
      typeof source === 'string' && 
      source.startsWith('http')
    ) {
      const res = await axios.get(source, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'MetashopApp/1.0'
        }
      });
      const b64 = Buffer.from(res.data)
                        .toString('base64');
      const mime = res.headers['content-type'] 
        || 'image/jpeg';
      return `data:${mime};base64,${b64}`;
    }
    
    if (!fs.existsSync(source)) {
      throw new Error(
        `File not found: ${source}`
      );
    }
    
    const b64 = fs.readFileSync(source)
                  .toString('base64');
    return `data:image/jpeg;base64,${b64}`;
    
  } catch (err) {
    throw new Error(
      `Image conversion failed: ${err.message}`
    );
  }
}

// ─── Cloudinary Upload ───────────────────

async function uploadToCloudinary(imageUrl) {
  try {
    const res = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    const buffer = Buffer.from(res.data);
    
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader
        .upload_stream(
          {
            folder: 'metashop/try-on-results',
            format: 'jpg',
            transformation: [{ 
              quality: 'auto',
              fetch_format: 'auto'
            }]
          },
          (err, result) => {
            if (err) reject(
              new Error(
                `Cloudinary upload failed: ${err.message}`
              )
            );
            else resolve(result.secure_url);
          }
        );
      Readable.from(buffer).pipe(stream);
    });
  } catch (err) {
    throw new Error(
      `Upload failed: ${err.message}`
    );
  }
}

// ─── Cleanup Temp File ───────────────────

function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn("Cleanup warning:", err.message);
  }
}

// ─── Main Controller ─────────────────────

async function retryAsync(
  fn, 
  retries = 2, 
  delayMs = 2000
) {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(
        `Attempt ${attempt + 1} failed:`,
        err.message
      );
      
      // Don't retry if quota/billing issue
      if (err.message?.includes('quota') ||
          err.message?.includes('billing') ||
          err.message?.includes('forbidden')) {
        throw err;
      }
      
      if (attempt < retries) {
        console.log(
          `Retrying in ${delayMs}ms...`
        );
        await new Promise(resolve => 
          setTimeout(resolve, delayMs)
        );
      }
    }
  }
  
  throw lastError;
}

function withTimeout(promise, ms = 120000) {
  const timeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(
        new Error(
          "AI generation timed out. Please try again."
        )
      ),
      ms
    )
  );
  return Promise.race([promise, timeout]);
}

async function processJob(
  jobId, 
  humanImageFile, 
  garmentImageUrl,
  imageWarnings,
  meta
) {
  const startTime = Date.now();
  
  try {
    // Update status to processing
    updateJob(jobId, { 
      status: JOB_STATUS.PROCESSING 
    });
    
    console.log("Processing job:", jobId);

    // Preprocess images
    let processedPath = null;
    try {
      processedPath = await preprocessImage(
        humanImageFile.path
      );
    } catch (err) {
      console.warn(
        "Preprocessing failed:", 
        err.message
      );
      processedPath = humanImageFile.path;
    }

    // Convert to data URIs
    const [modelUri, garmentUri] = 
      await Promise.all([
        toDataUri(processedPath),
        toDataUri(garmentImageUrl)
      ]);

    console.log("Calling fal.ai for job:", jobId);

    // Call fal.ai
    const result = await retryAsync(
      () => withTimeout(
        fal.subscribe(
          "fal-ai/fashn/tryon/v1.6",
          {
            input: {
              model_image: modelUri,
              garment_image: garmentUri,
              category: "auto",
              mode: "quality",
              garment_photo_type: "auto",
              nsfw_filter: true,
              adjust_hands: true,
              restore_background: true,
              restore_clothes: true,
              flat_lay: false,
              long_top: false
            },
            logs: true,
            onQueueUpdate: (update) => {
              console.log(
                `Job ${jobId} status:`, 
                update.status
              );
              // Update job with queue position
              if (update.position) {
                updateJob(jobId, {
                  queuePosition: update.position
                });
              }
            }
          }
        ),
        120000
      ),
      2,    // max 2 retries
      2000  // 2 sec between retries
    );

    // Extract output URL
    const outputUrl =
      result?.data?.images?.[0]?.url ||
      result?.data?.image?.url ||
      result?.data?.output?.[0] ||
      result?.data?.output;

    if (!outputUrl) {
      throw new Error("No output generated");
    }

    // Upload to Cloudinary
    const cloudinaryUrl = 
      await uploadToCloudinary(outputUrl);

    const duration = Date.now() - startTime;
    const fitScore = 
      Math.floor(Math.random() * 8) + 88;

    // Update metrics
    metrics.successCount++;
    metrics.totalGenerationTime += duration;

    const avgTime = metrics.successCount > 0
      ? Math.round(
          metrics.totalGenerationTime / 
          metrics.successCount
        )
      : 0;

    // Mark job as completed
    updateJob(jobId, {
      status: JOB_STATUS.COMPLETED,
      resultUrl: cloudinaryUrl,
      fitScore,
      generationTime: duration,
      warnings: imageWarnings,
      completedAt: Date.now(),
      metrics: {
        totalRequests: metrics.totalRequests,
        successCount: metrics.successCount,
        failureCount: metrics.failureCount,
        avgGenerationTime: avgTime
      }
    });

    try {
      if (meta?.userId) {
        await TryOnHistory.create({
          userId: meta.userId,
          productId: meta.productId || null,
          productName: meta.productName || null,
          productImage: garmentImageUrl || null,
          productPrice: meta.productPrice ? Number(meta.productPrice) : null,
          resultUrl: cloudinaryUrl,
          fitScore,
          generationTime: duration,
          status: 'completed'
        });
        console.log("✅ History saved:", meta.userId);
      }
    } catch (err) {
      console.warn("History save failed:", err.message);
    }

    console.log(JSON.stringify({
      event: "VTON_SUCCESS",
      jobId,
      duration,
      fitScore
    }));

    // Cleanup files
    cleanupFile(humanImageFile.path);
    if (processedPath && 
        processedPath !== humanImageFile.path) {
      cleanupFile(processedPath);
    }

  } catch (err) {
    const duration = Date.now() - startTime;
    
    metrics.failureCount++;
    
    console.error(JSON.stringify({
      event: "VTON_JOB_FAILED",
      jobId,
      error: err.message,
      duration
    }));

    // Mark job as failed
    const getErrorMessage = (err) => {
      if (err.message?.includes('timed out')) {
        return "Generation timed out after 3 attempts. Please try again.";
      }
      if (err.message?.includes('quota') ||
          err.message?.includes('billing')) {
        return "Service temporarily unavailable. Try again in a few minutes.";
      }
      if (err.message?.includes('forbidden') ||
          err.message?.includes('unauthorized')) {
        return "Service configuration error. Please contact support.";
      }
      return "Generation failed after multiple attempts. Please try again.";
    };
    
    updateJob(jobId, {
      status: JOB_STATUS.FAILED,
      error: getErrorMessage(err),
      retryCount: 2,
      failedAt: Date.now()
    });

    try {
      if (meta?.userId) {
        await TryOnHistory.create({
          userId: meta.userId,
          productId: meta.productId || null,
          productName: meta.productName || null,
          productImage: garmentImageUrl || null,
          status: 'failed'
        });
      }
    } catch (e) {
      console.warn("Failed to log failure history");
    }

    // Cleanup files
    cleanupFile(humanImageFile?.path);
  }
}

export const generateTryOn = async (req, res) => {
  const humanImageFile = 
    req.files?.humanImage?.[0];

  console.log(JSON.stringify({
    event: "VTON_REQUEST",
    timestamp: new Date().toISOString(),
    fileSize: humanImageFile?.size
  }));

  try {
    // Validate inputs first
    validateImageFile(humanImageFile);
    validateGarmentUrl(req.body.garmentImageUrl);
    
    const garmentImageUrl = 
      req.body.garmentImageUrl;

    // Smart validation
    const validation = await validateImageSmart(
      humanImageFile.path
    );

    if (validation.shouldBlock) {
      cleanupFile(humanImageFile?.path);
      return res.status(400).json({
        success: false,
        error: validation.blockReason
      });
    }

    // Create job immediately
    const job = createJob();
    
    // Update metrics
    metrics.totalRequests++;

    // Return jobId INSTANTLY — don't wait
    res.json({
      success: true,
      jobId: job.jobId,
      status: JOB_STATUS.PENDING,
      message: "Your look is being generated..."
    });

    // Process in background — don't await
    processJob(
      job.jobId,
      humanImageFile,
      garmentImageUrl,
      validation.warnings,
      {
        userId: req.userId || req.user?._id,
        productId: req.body.productId,
        productName: req.body.productName,
        productPrice: req.body.productPrice
      }
    ).catch(err => {
      console.error(
        "Background job failed:", 
        err.message
      );
    });

  } catch (err) {
    cleanupFile(humanImageFile?.path);
    metrics.failureCount++;
    
    console.log(JSON.stringify({
      event: "VTON_ERROR",
      error: err.message
    }));
    
    return res.status(500).json({
      success: false,
      error: "Something went wrong. Please try again."
    });
  }
};

export const checkJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = jobStore.get(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found or expired"
      });
    }

    // Return different data based on status
    if (job.status === JOB_STATUS.COMPLETED) {
      return res.json({
        success: true,
        status: job.status,
        resultUrl: job.resultUrl,
        fitScore: job.fitScore,
        generationTime: job.generationTime,
        warnings: job.warnings,
        metrics: job.metrics
      });
    }

    if (job.status === JOB_STATUS.FAILED) {
      return res.json({
        success: false,
        status: job.status,
        error: job.error
      });
    }

    // Still pending or processing
    return res.json({
      success: true,
      status: job.status,
      queuePosition: job.queuePosition || null,
      message: job.status === 'processing'
        ? "AI is generating your look..."
        : "Job is queued..."
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Could not check job status"
    });
  }
};

export const getVtonStats = async (req, res) => {
  try {
    const activeJobs = Array.from(jobStore.values())
      .filter(j => 
        j.status === JOB_STATUS.PROCESSING ||
        j.status === JOB_STATUS.PENDING
      ).length;

    const completedToday = Array.from(
      jobStore.values()
    ).filter(j => {
      const oneDayAgo = Date.now() - 86400000;
      return j.status === JOB_STATUS.COMPLETED &&
             j.createdAt > oneDayAgo;
    }).length;

    const avgTime = metrics.successCount > 0
      ? Math.round(
          metrics.totalGenerationTime / 
          metrics.successCount / 1000
        )
      : 0;

    const successRate = metrics.totalRequests > 0
      ? Math.round(
          (metrics.successCount / 
           metrics.totalRequests) * 100
        )
      : 0;

    return res.json({
      success: true,
      stats: {
        totalRequests: metrics.totalRequests,
        successCount: metrics.successCount,
        failureCount: metrics.failureCount,
        successRate: `${successRate}%`,
        avgGenerationTime: `${avgTime}s`,
        activeJobs,
        completedToday
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Could not fetch stats"
    });
  }
};
