import axios from 'axios';

async function testBackend() {
  try {
    const dummyBase64 = "data:image/jpeg;base64," + Buffer.from("dummy").toString("base64");
    
    console.log("Starting backend POST request...");
    const genRes = await axios.post("http://localhost:4000/api/vton/generate", {
      human_image: dummyBase64,
      garment_image: dummyBase64,
      garment_des: "red dress",
      product_category: "dress",
      product_name: "test dress"
    });

    const predId = genRes.data.predictionId;
    console.log("Got Prediction ID:", predId);

    let isDone = false;
    while (!isDone) {
      await new Promise(res => setTimeout(res, 2000));
      const statusRes = await axios.get(`http://localhost:4000/api/vton/status/${predId}`);
      console.log("Status:", statusRes.data.status);
      if (statusRes.data.status === 'succeeded' || statusRes.data.status === 'failed') {
        console.log("Result:", statusRes.data);
        isDone = true;
      }
    }
  } catch (err) {
    console.log("Script Error:", err.message);
  }
}

testBackend();
