import { Client } from "@gradio/client";

async function getSpec() {
  try {
    const app = await Client.connect("yisol/IDM-VTON");
    const apiInfo = await app.view_api();
    console.log("GRADIO API SPEC:", JSON.stringify(apiInfo, null, 2));
  } catch (err) {
    console.error("Error fetching spec:", err);
  }
}

getSpec();
