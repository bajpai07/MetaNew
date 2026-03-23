const BASE_URL = "http://localhost:8000";

// Helper to convert base64 data URL or external URL to a File object
async function urlToFile(url, filename) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

export async function submitTryOn(userImageStr, garmentImageStr) {
  const formData = new FormData();
  
  try {
    const userFile = await urlToFile(userImageStr, 'user_image.jpg');
    const garmentFile = await urlToFile(garmentImageStr, 'garment_image.jpg');
    
    formData.append('user_image', userFile);
    formData.append('garment_image', garmentFile);
  } catch (error) {
    throw new Error("Failed to process image files for upload.");
  }
  
  try {
    const res = await fetch(`${BASE_URL}/api/v1/try-on`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      let errorMsg = "Backend error";
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorMsg;
      } catch(e) {}
      throw new Error(errorMsg);
    }
    
    return await res.json(); // { job_id, status }
  } catch (err) {
    if (err.message === "Failed to fetch" || err.message.includes("NetworkError")) {
      throw new Error("Backend unavailable. Is the server running?");
    }
    throw err;
  }
}

export async function pollJobStatus(jobId, maxAttempts = 20, intervalMs = 3000) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${BASE_URL}/api/v1/status/${jobId}`);
    if (!res.ok) throw new Error("Failed to check status");
    
    const data = await res.json();
    if (data.status === 'done') {
      return data.result_url;
    }
    if (data.status === 'failed') {
      throw new Error(data.error_message || "Try-on processing failed");
    }
    
    // Wait and try again
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error("Try-on timed out");
}

export function getResultImageUrl(jobId) {
  return `${BASE_URL}/api/v1/result/${jobId}`;
}
