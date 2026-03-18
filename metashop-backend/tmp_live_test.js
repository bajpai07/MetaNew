import { Client } from "@gradio/client";

async function runLiveTest() {
  try {
    console.log("Connecting to IDM-VTON...");
    const app = await Client.connect("yisol/IDM-VTON");
    
    // Use some generic public image URLs to convert to blobs
    const humanUrl = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400";
    const garmentUrl = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400";
    
    const hRes = await fetch(humanUrl);
    const gRes = await fetch(garmentUrl);
    const humanBlob = await hRes.blob();
    const garmentBlob = await gRes.blob();

    console.log("Submitting Prediction Parameters (denoise: 40, seed: -1)...");
    const result = await app.predict("/tryon", [
      {"background":humanBlob,"layers":[],"composite":null},
      garmentBlob,
      "full-body dress, upper_body and lower_body, photorealistic clothing",
      true,  // has faces
      false, // auto-crop
      40,    // denoise_steps
      -1,    // seed
    ]);

    console.log("FINAL RESULT:", JSON.stringify(result.data).slice(0, 100));
  } catch(err) {
    console.log("CATCH BLOCK - API FAILED:");
    console.error(err);
  }
}

runLiveTest();
