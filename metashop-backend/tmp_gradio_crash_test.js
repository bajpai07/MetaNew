import { Client } from "@gradio/client";

async function testVTON() {
  try {
    const app = await Client.connect("yisol/IDM-VTON");
    
    // Create dummy blobs
    const humanBlob = new Blob([new Uint8Array(10)], { type: "image/jpeg" });
    const garmentBlob = new Blob([new Uint8Array(10)], { type: "image/jpeg" });

    console.log("Submitting prediction...");
    const result = await app.predict("/tryon", [
      {"background":humanBlob,"layers":[],"composite":null},
      garmentBlob,
      "full-body dress, photorealistic clothing",
      true,
      false,
      50, // denoise_steps
      -1, // seed
    ]);

    console.log("Success:", result.data);

  } catch (err) {
    console.error("Gradio Error Captured:", err);
  }
}

testVTON();
