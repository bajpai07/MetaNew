import { Client } from "@gradio/client";

async function getEndpoints() {
  const app = await Client.connect("yisol/IDM-VTON");
  const apiInfo = await app.view_api();
  console.log("Named endpoints:", Object.keys(apiInfo.named_endpoints));
  console.log("Unnamed endpoints:", Object.keys(apiInfo.unnamed_endpoints));
}

getEndpoints();
